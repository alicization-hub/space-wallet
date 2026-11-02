import { and, asc, eq } from "drizzle-orm"
import { z } from "zod"

import { db, schema } from "@/drizzle"
import { SYNCED_PROGRESS } from "@/libs/bitcoin/constants"
import type { RPCClient } from "@/libs/bitcoin/rpc"
import { toSatsPerVByte } from "@/libs/bitcoin/telemetry"
import { bitcoinToSats, satsToBitcoin } from "@/libs/bitcoin/unit"
import { logger } from "@/libs/logger"

import { commandConfirm, commandInput, toPrintable } from "../cmd.spec"
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
async function ask<T>(label: string, validator: z.ZodType<T, string>) {
  while (true) {
    const answer = await commandInput(label, { isHidden: false })

    const parsed = validator.safeParse(answer)
    if (parsed.success) return parsed.data

    logger(`🚫 ${parsed.error.issues[0].message}`)
  }
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

  accounts.forEach(({ label }, index) => {
    console.info(`${index + 1}. ${toPrintable(label)}`)
  })

  return accounts[(await ask("Account", choiceValidator(accounts.length))) - 1]
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

  logger("🚫 These sends aren't confirmed yet:")
  for (const { txid, amount, address } of pending) {
    console.info(
      `   ${toPrintable(txid)}  ${Math.abs(amount).toFixed(8)} BTC  ${toPrintable(address)}`
    )
  }

  if (!(await commandConfirm("Send another one anyway?"))) {
    throw new Error("Nothing was sent.")
  }
}

export async function chooseCoins(rpcClient: RPCClient) {
  const utxos = await rpcClient.listUnspent()

  if (utxos.length === 0) throw new Error("This account has no confirmed coins.")

  utxos.forEach(({ amount, address, confirmations }, index) => {
    console.info(
      `${index + 1}. ${amount.toFixed(8)} BTC  ${toPrintable(address)}  ${confirmations} confirmations`
    )
  })

  const choices = await ask("Coins, such as 1,3", coinsValidator(utxos.length))

  return choices.map((choice) => utxos[choice - 1])
}

export async function askRecipient(rpcClient: RPCClient) {
  const recipient = await ask("Recipient", recipientValidator)
  console.info(`   ${toGroups(recipient)}`)

  const { ismine } = await rpcClient.getAddressInfo(recipient)
  if (ismine) logger("🚫 This address belongs to this account.")

  return recipient
}

/**
 * @returns The amount in satoshis
 */
export async function askAmount(coins: Unspent.List[]) {
  const total = coins.reduce((sum, { amount }) => sum + bitcoinToSats(amount), 0)
  console.info(`   The coins hold ${satsToBitcoin(total).toFixed(8)} BTC`)

  return ask(
    "Amount in BTC",
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

  estimates.forEach(({ feerate }, index) => {
    const estimate = feerate
      ? `${toSatsPerVByte(feerate).toFixed(2)} sat/vB`
      : "no estimate yet"
    console.info(`   Within ${FEE_TARGETS[index]} blocks: ${estimate}`)
  })

  return ask("Fee rate in sat/vB", feeRateValidator)
}
