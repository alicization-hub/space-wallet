'use server'

import { and, eq, inArray } from 'drizzle-orm'
import { cacheLife, cacheTag } from 'next/cache'
import { pick } from 'ramda'

import { RPCClient } from '@/libs/bitcoin/rpc'
import { db, schema } from '@/libs/drizzle'
import { createPagination } from '@/libs/utils'

import { formatter } from './helpers'
import { type QueryValidator } from './validator'

export type Transaction = Awaited<ReturnType<typeof formatter>>

export async function findTransactions(accountId: string, query: QueryValidator) {
  'use cache'
  cacheTag('transactions')
  cacheLife('seconds')

  try {
    const rpcClient = new RPCClient()
    await rpcClient.setWallet(accountId)

    const wallet = await rpcClient.getWallet()
    const transactions = await rpcClient.listTransactions('*', query.take, (query.page - 1) * query.take)
    const formatted = await Promise.all(transactions.map((tx) => formatter(rpcClient, tx)))

    // Update the address to "used" based on a transaction that has a "confirmed" status.
    if (formatted.length > 0) {
      const CHUNK_SIZE = 100
      const addrs = Array.from(
        new Set(
          formatted
            .filter((tx) => tx.status === 'confirmed')
            .flatMap((tx) => [...tx.inputs, ...tx.outputs].map((r) => r.address))
        )
      )

      await db.transaction(async (tx) => {
        for (let i = 0; i < addrs.length; i += CHUNK_SIZE) {
          const chunk = addrs.slice(i, i + CHUNK_SIZE)

          await tx
            .update(schema.addresses)
            .set({
              isUsed: true
            })
            .where(
              and(
                eq(schema.addresses.accountId, accountId),
                eq(schema.addresses.isUsed, false),
                inArray(schema.addresses.address, chunk)
              )
            )
        }
      })
    }

    // Sort by timestamp descending (newest first)
    // Since listTransactions returns a batch of "recent" transactions,
    // we just need to sort specifically this batch or reverse it if it's already in chronological order.
    const sorted = formatted.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

    return createPagination(sorted, wallet.txcount, query.page, query.take)
  } catch (error: any) {
    console.error(error)
    throw new Error(`An error occurred: ${error.message}`)
  }
}

export async function findUTXOs(accountId: string) {
  'use cache'
  cacheTag('utxos')
  cacheLife('seconds')

  try {
    const rpcClient = new RPCClient()
    await rpcClient.setWallet(accountId)

    const utxos = await rpcClient.listUnspent()
    return utxos.map((utxo) =>
      pick(['txid', 'vout', 'address', 'amount', 'confirmations', 'spendable'], utxo)
    )
  } catch (error) {
    throw error
  }
}
