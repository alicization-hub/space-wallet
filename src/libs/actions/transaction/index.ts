'use server'

import 'server-only'

import { pick } from 'ramda'

import { useAuth } from '@/libs/actions/auth'
import { RPCClient } from '@/libs/bitcoin/rpc'
import { createPagination } from '@/libs/utils'

import { formatter } from './helpers'
import { type QueryValidator } from './validator'

export type Transaction = Awaited<ReturnType<typeof formatter>>

export async function findTransactions(query: QueryValidator) {
  try {
    const auth = await useAuth()

    const rpcClient = new RPCClient()
    await rpcClient.setWallet(auth.account.id)

    const wallet = await rpcClient.getWallet()
    const transactions = await rpcClient.listTransactions('*', query.take, (query.page - 1) * query.take)
    const formatted = await Promise.all(transactions.map((tx) => formatter(rpcClient, tx)))

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

export async function findUTXOs() {
  try {
    const auth = await useAuth()

    const rpcClient = new RPCClient()
    await rpcClient.setWallet(auth.account.id)

    const utxos = await rpcClient.listUnspent()
    return utxos.map((utxo) =>
      pick(['txid', 'vout', 'address', 'amount', 'confirmations', 'spendable'], utxo)
    )
  } catch (error) {
    throw error
  }
}
