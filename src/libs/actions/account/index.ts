'use server'

import { addDays } from 'date-fns'
import { and, eq } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { omit, pick } from 'ramda'

import { APP_TOKEN } from '@/constants'
import { useAuth } from '@/libs/actions/auth'
import { accountColumns, db, schema, walletColumns } from '@/libs/drizzle'
import { password } from '@/libs/password'

import { generateToken } from '../token'
import { switchValidator, type SwitchValidator } from './validator'

export async function findAccount(accountId: string) {
  try {
    const cookieStore = await cookies()
    const auth = await useAuth(cookieStore)

    const [account] = await db
      .select({
        ...omit(['walletId'], accountColumns),
        wallet: omit(['bio', 'passkey'], walletColumns)
      })
      .from(schema.accounts)
      .leftJoin(schema.wallets, eq(schema.wallets.id, schema.accounts.walletId))
      .where(and(eq(schema.accounts.id, accountId), eq(schema.accounts.walletId, auth.id)))

    if (!account) {
      throw new Error('Account not found.')
    }

    return account
  } catch (error) {
    throw error
  }
}

export type AccountInfo = Awaited<ReturnType<typeof findAccount>>

export async function switchAccount(params: SwitchValidator) {
  try {
    const cookieStore = await cookies()
    await useAuth(cookieStore)

    const { walletId, accountId, passphrase } = switchValidator.parse(params)

    const [{ wallet, ...account }] = await db
      .select({
        ...pick(['id'], accountColumns),
        wallet: pick(['id', 'passkey'], walletColumns)
      })
      .from(schema.accounts)
      .innerJoin(schema.wallets, eq(schema.wallets.id, schema.accounts.walletId))
      .where(
        and(
          eq(schema.wallets.id, walletId),
          eq(schema.wallets.isActive, true),
          eq(schema.accounts.id, accountId),
          eq(schema.accounts.isActive, true)
        )
      )

    if (!wallet || !account) {
      throw new Error('Unaviable account.')
    }

    const isValid = await password.verify(wallet.passkey, passphrase)
    if (!isValid) {
      throw new Error('Invalid passphrase.')
    }

    const token = await generateToken(wallet.id, account.id)
    cookieStore.set(APP_TOKEN, token, {
      priority: 'high',
      secure: true,
      expires: addDays(new Date(), 360)
    })

    return true
  } catch (error) {
    throw error
  }
}
