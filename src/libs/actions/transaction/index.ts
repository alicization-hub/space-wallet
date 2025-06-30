'use server'

import 'server-only'

import { and, count, desc, eq, getTableColumns, SQL } from 'drizzle-orm'
import { omit } from 'ramda'

import { db, schema } from '@/libs/drizzle'
import { withPagination } from '@/libs/drizzle/utils'
import { useAuthGuard } from '@/libs/jwt/guard'
import { createPagination } from '@/libs/utils'

import type { QueryValidator } from './validator'

export async function findTransactions(query: QueryValidator) {
  try {
    const auth = await useAuthGuard()

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
