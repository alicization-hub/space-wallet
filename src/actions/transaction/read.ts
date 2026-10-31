import "server-only"

import { READ_TIMEOUT } from "@/libs/bitcoin/constants"
import { RPCClient } from "@/libs/bitcoin/rpc"
import { logger } from "@/libs/logger"
import { createPagination } from "@/libs/utils"

import { withAccount } from "../account"
import { formatTransaction } from "./format"
import { queryValidator, type QueryValidator } from "./validator.zod"

export type Transaction = Awaited<ReturnType<typeof formatTransaction>>

/**
 * Reads an account's transactions. A node that doesn't answer is expected, so this gives `null` and
 * the page still shows the rest.
 *
 * It isn't `"use cache"` because a Server Component imports it: Next.js would register the cached
 * function as a server reference, which anyone holding its ID could call past `withAccount`.
 */
export const readTransactions = withAccount(async (account, input: QueryValidator) => {
  const query = queryValidator.parse(input)

  try {
    const rpcClient = new RPCClient(READ_TIMEOUT)
    await rpcClient.setWallet(account.id)

    const info = await rpcClient.getWallet()
    const transactions = await rpcClient.listTransactions(
      "*",
      query.take,
      (query.page - 1) * query.take
    )
    const formatted = await Promise.all(
      transactions.map((tx) => formatTransaction(rpcClient, tx))
    )

    // Sort by timestamp descending (newest first)
    // Since listTransactions returns a batch of "recent" transactions,
    // we just need to sort specifically this batch or reverse it if it's already in chronological
    // order.
    const sorted = formatted.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

    return createPagination(sorted, info.txcount, query.page, query.take)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    logger(`⚠️ readTransactions failed: ${message}`)
    return null
  }
})
