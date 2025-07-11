'use server'

import 'server-only'

import { and, count, desc, eq, getTableColumns, SQL } from 'drizzle-orm'
import { omit, pick } from 'ramda'

import { useAuthorized } from '@/libs/actions/guard'
import { RPCClient } from '@/libs/bitcoin/rpc'
import { db, schema } from '@/libs/drizzle'
import { withPagination } from '@/libs/drizzle/utils'
import { createPagination } from '@/libs/utils'

import { type QueryValidator } from './validator'

export async function findTransactions(query: QueryValidator) {
  try {
    const auth = await useAuthorized()

    const transactionColumns = getTableColumns(schema.transactions)
    const filters: SQL[] = [eq(schema.transactions.accountId, auth.uid)]

    const { total, results } = await db.transaction(async (tx) => {
      const queryBuilder = tx
        .select({
          ...omit(['accountId'], transactionColumns)
        })
        .from(schema.transactions)
        .where(and(...filters))
        .orderBy(desc(schema.transactions.timestamp))
        .$dynamic()

      const queryCountBuilder = tx
        .select({ count: count() })
        .from(schema.transactions)
        .where(and(...filters))
        .$dynamic()

      const results = await withPagination(queryBuilder, query.page, query.take).execute()
      const [r] = await queryCountBuilder.execute()

      return {
        total: +r.count,
        results
      }
    })

    return createPagination(results, total, query.page, query.take)
  } catch (error: any) {
    console.error(error)
    throw new Error(`An error occurred: ${error.message}`)
  }
}

export async function findUTXOs() {
  try {
    const auth = await useAuthorized()

    const rpcClient = new RPCClient()
    await rpcClient.setWallet(auth.uid)

    const utxos = await rpcClient.listUnspent()
    return utxos.map((utxo) =>
      pick(['txid', 'vout', 'address', 'amount', 'confirmations', 'spendable'], utxo)
    )
  } catch (error) {
    throw error
  }
}
