'use server'

import { and, eq } from 'drizzle-orm'
import { cacheLife, cacheTag } from 'next/cache'
import { cookies } from 'next/headers'
import { omit } from 'ramda'

import { APP_TOKEN } from '@/constants'
import { accountColumns, db, schema, walletColumns } from '@/libs/drizzle'

import { validateToken } from './token'

async function findWallet(walletId: string, accountId: string) {
  'use cache'
  cacheTag('space-auth', walletId, accountId)
  cacheLife('hours')

  return db
    .select({
      ...walletColumns,
      account: omit(['walletId'], accountColumns)
    })
    .from(schema.wallets)
    .innerJoin(schema.accounts, eq(schema.wallets.id, schema.accounts.walletId))
    .where(and(eq(schema.wallets.id, walletId), eq(schema.accounts.id, accountId)))
}

export async function useAuth() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(APP_TOKEN)
    if (!token?.value) {
      throw new Error('401 Unauthorized')
    }

    const { walletId, accountId } = await validateToken(token.value)
    const [wallet] = await findWallet(walletId, accountId)
    if (!wallet) {
      throw new Error('401 Unauthorized')
    }

    return wallet
  } catch (error) {
    throw error
  }
}
