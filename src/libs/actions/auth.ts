'use server'

import { eq } from 'drizzle-orm'
import { cacheLife, cacheTag } from 'next/cache'
import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies'
import { cookies } from 'next/headers'

import { APP_TOKEN } from '@/constants'
import { db, schema } from '@/libs/drizzle'

import { validateToken } from './token'

async function findWallet(walletId: string) {
  'use cache'
  cacheTag('space-auth', walletId)
  cacheLife('hours')

  return db.select().from(schema.wallets).where(eq(schema.wallets.id, walletId))
}

export async function useAuth(cookieStore: ReadonlyRequestCookies) {
  try {
    const token = cookieStore.get(APP_TOKEN)
    if (!token?.value) {
      throw new Error('401 Unauthorized')
    }

    const { walletId } = await validateToken(token.value)
    const [wallet] = await findWallet(walletId)
    if (!wallet) {
      throw new Error('401 Unauthorized')
    }

    return wallet
  } catch (error) {
    throw error
  }
}
