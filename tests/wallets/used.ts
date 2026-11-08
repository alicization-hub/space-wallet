import { markAddressesUsed } from "@/drizzle/addresses"
import { formatTransaction } from "@/libs/bitcoin/history"
import { RPCClient } from "@/libs/bitcoin/rpc"
import { logger } from "@/libs/logger"

import { toPrintable } from "../cmd.spec"
import { chooseAccount } from "../transfers/ask"
import { warnIfSyncing } from "./shared"

/**
 * How many node transactions are read at a time. Each one costs a lookup of itself and of the
 * transactions its inputs spend, so a page stays small.
 */
const PAGE_SIZE = 10

/**
 * Marks the addresses an account's confirmed transactions touch as used, through its whole history.
 * The app's sync only reads the newest few, so this catches what came before, such as the history a
 * `recover` rescan found.
 *
 * `listtransactions` counts entries, not transactions: one that pays two of the account's addresses
 * is two entries, and can span two pages. So the pages run until one comes back short, and a
 * transaction read once is skipped after.
 */
export async function markUsedAddresses() {
  const account = await chooseAccount()
  const startedAt = new Date()

  const rpcClient = new RPCClient()
  await rpcClient.setWallet(account.id)

  logger(`🔍 Reading the history of ${toPrintable(account.label)}...`)

  const seen = new Set<string>()
  let marked = 0

  for (let skip = 0; ; skip += PAGE_SIZE) {
    const entries = await rpcClient.listTransactions("*", PAGE_SIZE, skip)

    const fresh: NodeTransaction.List[] = []
    for (const entry of entries) {
      if (seen.has(entry.txid)) continue

      seen.add(entry.txid)
      fresh.push(entry)
    }

    const transactions = await Promise.all(
      fresh.map((tx) => formatTransaction(rpcClient, tx))
    )
    marked += await markAddressesUsed(account.id, transactions)

    if (entries.length < PAGE_SIZE) break
  }

  logger(`✅ ${seen.size} transactions read, ${marked} addresses newly used.`, startedAt)

  await warnIfSyncing(rpcClient)
}
