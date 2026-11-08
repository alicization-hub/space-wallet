import { eq } from "drizzle-orm"

import { db, schema } from "@/drizzle"
import { readNodeBalance } from "@/libs/bitcoin/balance"
import { RPCClient } from "@/libs/bitcoin/rpc"
import { satsToBitcoin } from "@/libs/bitcoin/unit"
import { COLOR, logger } from "@/libs/logger"
import { numberToSpace } from "@/libs/utils"

import { toPrintable } from "../cmd.spec"
import { chooseAccount } from "../transfers/ask"
import { warnIfSyncing } from "./shared"

/**
 * @example
 * ```ts
 * formatAmount(123_456) // "0.00123456 BTC (123 456 sats)"
 * ```
 */
function formatAmount(sats: number) {
  return `${satsToBitcoin(sats).toFixed(8)} BTC ${COLOR.FG.Gray}(${numberToSpace(sats.toString())} sats)${COLOR.RESET}`
}

/**
 * Reads an account's balance from the node, saves it to the DB the way the app's sync does, and
 * prints it.
 */
export async function showBalance() {
  const account = await chooseAccount()
  const startedAt = new Date()

  const rpcClient = new RPCClient()
  await rpcClient.setWallet(account.id)

  const balance = await readNodeBalance(rpcClient)
  await db
    .update(schema.accounts)
    .set({ balance })
    .where(eq(schema.accounts.id, account.id))

  logger(`💼 Account: ${toPrintable(account.label)}`)
  logger(`💰 Total: ${formatAmount(balance.total)}`)
  logger(`📦 Confirmed: ${formatAmount(balance.confirmed)}`)
  logger(`⏳ Unconfirmed: ${formatAmount(balance.unconfirmed)}`)
  logger(`⛏️ Immature: ${formatAmount(balance.immature)}`)
  logger(`💸 Spendable: ${formatAmount(balance.spendable)}`)
  logger("✅ The balance is saved.", startedAt)

  await warnIfSyncing(rpcClient)
}
