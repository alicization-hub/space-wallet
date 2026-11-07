import { bytesToHex } from "@noble/hashes/utils.js"
import { HDKey } from "@scure/bip32"
import { Address, NETWORK, OutScript, Transaction } from "@scure/btc-signer"
import { and, asc, eq, inArray } from "drizzle-orm"

import { db, schema } from "@/drizzle"
import { derivationPathBuilder } from "@/libs/bitcoin/derivation"
import type { RPCClient } from "@/libs/bitcoin/rpc"
import { AddressBuilder, createRootKey } from "@/libs/bitcoin/scure"
import { createSignedTransaction } from "@/libs/bitcoin/transaction"
import { bitcoinToSats, satsToBitcoin } from "@/libs/bitcoin/unit"
import { Cipher } from "@/libs/cipher"
import { verifyPassword } from "@/libs/password"
import { passphraseInputValidator } from "@/libs/validator.zod"

import { commandInput, toPrintable } from "../cmd.spec"
import type { TransferAccount } from "./ask"

type TransferRequest = {
  coins: Unspent.List[]
  recipient: string
  /** In satoshis */
  amount: number
  /** In sat/vB */
  feeRate: number
}

type AddressRow = { address: string; index: number; type: "receive" | "change" }

export type Transfer = ReturnType<typeof decodeTransfer>

/**
 * The rows of the coins' addresses, and the next unused change address. The DB only gives derivation
 * paths here: `requireOwnAddress` checks each one against the keys before anything is signed.
 */
async function readAddressRows(account: TransferAccount, coins: Unspent.List[]) {
  const columns = {
    address: schema.addresses.address,
    index: schema.addresses.index,
    type: schema.addresses.type
  }

  const rows = await db
    .select(columns)
    .from(schema.addresses)
    .where(
      and(
        eq(schema.addresses.accountId, account.id),
        inArray(
          schema.addresses.address,
          coins.map(({ address }) => address)
        )
      )
    )

  const [change] = await db
    .select(columns)
    .from(schema.addresses)
    .where(
      and(
        eq(schema.addresses.accountId, account.id),
        eq(schema.addresses.type, "change"),
        eq(schema.addresses.isUsed, false)
      )
    )
    .orderBy(asc(schema.addresses.index))
    .limit(1)

  if (!change) {
    throw new Error(
      `No unused change address left. Run: bun tests/wallet.spec.ts addresses --wallet ${toPrintable(account.slug)}`
    )
  }

  return { rows, change }
}

async function unlockWallet(walletId: string) {
  const [wallet] = await db
    .select({ bio: schema.wallets.bio, passkey: schema.wallets.passkey })
    .from(schema.wallets)
    .where(eq(schema.wallets.id, walletId))

  const passphrase = passphraseInputValidator.parse(
    await commandInput({
      label: "Passphrase",
      description:
        "The wallet's passphrase. The transaction is signed and tested here, and nothing is sent yet."
    })
  )
  if (!(await verifyPassword(passphrase, wallet.passkey))) {
    throw new Error("Invalid passphrase.")
  }

  const mnemonic = await Cipher.decrypt(wallet.bio, passphrase)

  return createRootKey(mnemonic, passphrase)
}

/**
 * Someone who can only write to the DB could otherwise redirect a send's change, or have the wrong
 * key sign. Only the keys can say which address is really ours.
 */
function requireOwnAddress(rootKey: HDKey, account: TransferAccount, row: AddressRow) {
  const address = new AddressBuilder(rootKey).create(
    account.purpose,
    account.index,
    row.index,
    row.type === "change"
  )

  if (address !== row.address) {
    throw new Error(
      `The address ${toPrintable(row.address)} doesn't match this wallet's keys.`
    )
  }
}

function toInput(
  rootKey: HDKey,
  account: TransferAccount,
  coin: Unspent.List,
  rows: AddressRow[]
): Transaction.PrepareInput<"server"> {
  const row = rows.find(({ address }) => address === coin.address)
  if (!row) {
    throw new Error(
      `The coin ${toPrintable(coin.txid)}:${coin.vout} is on an address this wallet hasn't generated yet. Run: bun tests/wallet.spec.ts addresses --wallet ${toPrintable(account.slug)}`
    )
  }

  requireOwnAddress(rootKey, account, row)

  return {
    txid: coin.txid,
    vout: coin.vout,
    address: coin.address,
    amount: coin.amount,
    scriptPubKey: coin.scriptPubKey,
    type: account.purpose === 84 ? "wpkh" : "tr",
    derivationPath: derivationPathBuilder()
      .purpose(account.purpose)
      .account(account.index)
      .change(row.type === "change" ? 1 : 0)
      .address(row.index)
      .build()
  }
}

/**
 * Reads the signed bytes back. This is what the owner approves, instead of what was typed, and
 * anything but the chosen coins and the expected outputs stops the send.
 */
function decodeTransfer(
  signed: Transaction,
  { coins, recipient, amount }: TransferRequest,
  changeAddress: string
) {
  const decoded = Transaction.fromRaw(signed.extract())

  const spent = Array.from({ length: decoded.inputsLength }, (_, index) => {
    const { txid, index: vout } = decoded.getInput(index)
    return `${bytesToHex(txid!)}:${vout}`
  })
  const isSameCoins =
    spent.length === coins.length &&
    coins.every(({ txid, vout }) => spent.includes(`${txid}:${vout}`))

  if (!isSameCoins) throw new Error("The signed transaction spends other coins.")

  const outputs = Array.from({ length: decoded.outputsLength }, (_, index) => {
    const { script, amount } = decoded.getOutput(index)
    return {
      address: Address(NETWORK).encode(OutScript.decode(script!)),
      amount: Number(amount)
    }
  })
  const [paid, change] = outputs
  const isSameOutputs =
    outputs.length <= 2 &&
    paid.address === recipient &&
    paid.amount === amount &&
    (!change || change.address === changeAddress)

  if (!isSameOutputs) throw new Error("The signed transaction pays something else.")

  const received = coins.reduce((sum, coin) => sum + bitcoinToSats(coin.amount), 0)
  const sent = outputs.reduce((sum, output) => sum + output.amount, 0)
  const fee = received - sent

  return {
    id: decoded.id,
    hex: decoded.hex,
    recipient: paid.address,
    amount: paid.amount,
    change: change ?? null,
    fee,
    feeRate: fee / signed.vsize,
    coins
  }
}

/**
 * Signs the transfer and proves the node would take it. Nothing leaves this machine yet.
 */
export async function signTransfer(
  rpcClient: RPCClient,
  account: TransferAccount,
  request: TransferRequest
) {
  const { rows, change } = await readAddressRows(account, request.coins)
  const rootKey = await unlockWallet(account.walletId)

  let signed: Transaction
  try {
    const inputs = request.coins.map((coin) => toInput(rootKey, account, coin, rows))
    requireOwnAddress(rootKey, account, change)

    // The node must watch the change, or it would leave what the app can see
    const { ismine } = await rpcClient.getAddressInfo(change.address)
    if (!ismine) throw new Error(`The node doesn't watch the address ${change.address}.`)

    signed = await createSignedTransaction(rootKey, request.feeRate, inputs, [
      {
        address: request.recipient,
        amount: satsToBitcoin(request.amount),
        isRecipient: true,
        isChange: false
      },
      { address: change.address, amount: 0, isRecipient: false, isChange: true }
    ])
  } finally {
    // Before anything waits on a person
    rootKey.wipePrivateData()
  }

  const transfer = decodeTransfer(signed, request, change.address)

  const [test] = await rpcClient.verifyTransaction(transfer.hex)
  if (!test.allowed) {
    throw new Error(
      `The node would refuse this transaction: ${toPrintable(test["reject-reason"])}`
    )
  }

  return transfer
}
