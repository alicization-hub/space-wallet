import { and, eq, inArray } from 'drizzle-orm'

import { db, schema } from '@/libs/drizzle'

import { logger } from './logger'

export async function syncAddresses(accountId: string) {
  logger(`🔄 [${accountId}] Initiating address data sync...`)
  const startTime = Date.now()

  try {
    const transactions = await db
      .select({
        txid: schema.transactions.txid,
        inputs: schema.transactions.inputs,
        outputs: schema.transactions.outputs
      })
      .from(schema.transactions)
      .where(and(eq(schema.transactions.accountId, accountId), eq(schema.transactions.status, 'confirmed')))

    const addrSet = transactions.flatMap((tx) => [...tx.inputs, ...tx.outputs].map(({ address }) => address))

    await db
      .update(schema.addresses)
      .set({ isUsed: true })
      .where(
        and(
          eq(schema.addresses.accountId, accountId),
          eq(schema.addresses.isUsed, false),
          inArray(schema.addresses.address, addrSet)
        )
      )

    logger(`📝 [${accountId}] Address has been successfully synced.`, startTime)
  } catch (error) {
    console.error('⚠️', ' An error occurred:')
    console.log(error)
  }
}
