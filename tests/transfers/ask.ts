import { and, asc, eq } from "drizzle-orm"
import { z } from "zod"

import { db, schema } from "@/drizzle"
import { MAX_FEE_RATE, SYNCED_PROGRESS } from "@/libs/bitcoin/constants"
import type { RPCClient } from "@/libs/bitcoin/rpc"
import { toSatsPerVByte } from "@/libs/bitcoin/telemetry"
import { bitcoinToSats, satsToBitcoin } from "@/libs/bitcoin/unit"
import { COLOR, logger } from "@/libs/logger"

import { commandConfirm, commandInput, toPrintable, type Question } from "../cmd.spec"
import {
  amountValidator,
  choiceValidator,
  coinsValidator,
  feeRateValidator,
  recipientValidator
} from "./validator.zod"

/**
 * The confirmation targets the node is asked to estimate a fee for, in blocks.
 */
const FEE_TARGETS = [2, 6, 144]

/**
 * How many of the latest transactions are searched for unconfirmed sends.
 */
const RECENT_TRANSACTIONS = 1_000

export type TransferAccount = Awaited<ReturnType<typeof chooseAccount>>

/**
 * Asks until the answer is valid. Ctrl+C is the way out.
 */
async function ask<T>(question: Question, validator: z.ZodType<T, string>) {
  while (true) {
    const answer = await commandInput({ ...question, isHidden: false })

    const parsed = validator.safeParse(answer)
    if (parsed.success) return parsed.data

    logger(`🚫 ${COLOR.FG.Red}${parsed.error.issues[0].message}`)
  }
}

/**
 * Keys the rows from 1, so the first column of `console.table` is the number to type.
 */
function toChoices<T>(rows: T[]) {
  return Object.fromEntries(rows.map((row, index) => [index + 1, row]))
}

/**
 * Splits an address into groups of 4, which are easier to compare with its source.
 */
export function toGroups(address: string) {
  return address.match(/.{1,4}/g)!.join(" ")
}

/**
 * The coins of a node still catching up can't be believed, so the app shows no wallet page until it
 * has synced. The script goes by the same rule.
 */
export async function requireSyncedNode(rpcClient: RPCClient) {
  const { verificationprogress } = await rpcClient.getChain()

  if (verificationprogress <= SYNCED_PROGRESS) {
    throw new Error(
      `The node is still syncing (${(verificationprogress * 100).toFixed(1)}%), so nothing can be sent yet.`
    )
  }
}

export async function chooseAccount() {
  const accounts = await db
    .select({
      id: schema.accounts.id,
      walletId: schema.accounts.walletId,
      slug: schema.wallets.slug,
      label: schema.accounts.label,
      purpose: schema.accounts.purpose,
      index: schema.accounts.index
    })
    .from(schema.accounts)
    .innerJoin(schema.wallets, eq(schema.wallets.id, schema.accounts.walletId))
    .where(and(eq(schema.accounts.isActive, true), eq(schema.wallets.isActive, true)))
    .orderBy(
      asc(schema.wallets.createdAt),
      asc(schema.accounts.purpose),
      asc(schema.accounts.index)
    )

  if (accounts.length === 0) {
    throw new Error("No wallet yet. Create one with: bun tests/wallet.spec.ts create")
  }

  console.table(
    toChoices(
      accounts.map(({ label, purpose }) => ({
        Account: toPrintable(label),
        Type: purpose === 84 ? "SegWit" : "Taproot"
      }))
    )
  )

  const choice = await ask(
    { label: "Account", description: "Type the number of the account to send from." },
    choiceValidator(accounts.length)
  )

  return accounts[choice - 1]
}

/**
 * Sending again from other coins while an earlier send is still out could pay twice, so the owner
 * sees those sends before picking anything.
 */
export async function confirmPending(rpcClient: RPCClient) {
  const transactions = await rpcClient.listTransactions("*", RECENT_TRANSACTIONS)
  const pending = transactions.filter(
    ({ category, confirmations }) => category === "send" && confirmations === 0
  )

  if (pending.length === 0) return

  logger(`🚫 ${COLOR.FG.Red}These sends aren't confirmed yet:`)
  console.table(
    toChoices(
      pending.map(({ txid, amount, address }) => ({
        Transaction: toPrintable(txid),
        Amount: `${Math.abs(amount).toFixed(8)} BTC`,
        Address: toPrintable(address)
      }))
    )
  )

  const isConfirmed = await commandConfirm({
    label: "Send another one anyway?",
    description: "Sending again from other coins while these are out could pay twice."
  })

  if (!isConfirmed) throw new Error("Nothing was sent.")
}

export async function chooseCoins(rpcClient: RPCClient) {
  const utxos = await rpcClient.listUnspent()

  if (utxos.length === 0) throw new Error("This account has no confirmed coins.")

  console.table(
    toChoices(
      utxos.map(({ amount, address, confirmations }) => ({
        Amount: `${amount.toFixed(8)} BTC`,
        Address: toPrintable(address),
        Confirmations: confirmations
      }))
    )
  )

  const choices = await ask(
    { label: "Coins", description: "Type their numbers, such as 1,3." },
    coinsValidator(utxos.length)
  )

  return choices.map((choice) => utxos[choice - 1])
}

export async function askRecipient(rpcClient: RPCClient) {
  const recipient = await ask(
    {
      label: "Recipient",
      description:
        "Paste the address, then compare every group below with where you got it."
    },
    recipientValidator
  )
  console.info(`   ${COLOR.BRIGHT}${toGroups(recipient)}${COLOR.RESET}`)

  const { ismine } = await rpcClient.getAddressInfo(recipient)
  if (ismine) logger(`🚫 ${COLOR.FG.Red}This address belongs to this account.`)

  return recipient
}

/**
 * @returns The amount in satoshis
 */
export async function askAmount(coins: Unspent.List[]) {
  const total = coins.reduce((sum, { amount }) => sum + bitcoinToSats(amount), 0)

  return ask(
    {
      label: "Amount",
      description: `In BTC, with at most 8 decimals. The coins hold ${satsToBitcoin(total).toFixed(8)} BTC, and the fee comes out of what's left.`
    },
    amountValidator.refine((amount) => amount < total, {
      error: "The coins must hold more than the amount, to pay the fee."
    })
  )
}

/**
 * @returns The fee rate in sat/vB
 */
export async function askFeeRate(rpcClient: RPCClient) {
  const estimates = await Promise.all(
    FEE_TARGETS.map((blocks) => rpcClient.estimateSmartFee(blocks))
  )

  console.table(
    Object.fromEntries(
      estimates.map(({ feerate }, index) => [
        `Within ${FEE_TARGETS[index]} blocks`,
        { "sat/vB": feerate ? toSatsPerVByte(feerate).toFixed(2) : "no estimate yet" }
      ])
    )
  )

  return ask(
    {
      label: "Fee rate",
      description: `In sat/vB, from 1 to ${MAX_FEE_RATE}. The table shows what the node estimates.`
    },
    feeRateValidator
  )
}
