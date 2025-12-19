'use server'

import 'server-only'

import { addDays } from 'date-fns'
import { and, eq } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { pick } from 'ramda'

import { APP_TOKEN } from '@/constants'
import { useAuth } from '@/libs/actions/auth'
import { accountColumns, db, schema, walletColumns } from '@/libs/drizzle'
import { password } from '@/libs/password'

import { generateToken } from '../token'
import { switchValidator, type SwitchValidator } from './validator'

export async function findAccount(id: string) {
  try {
    const auth = await useAuth()
    const account = await db.query.accounts.findFirst({
      where: and(eq(schema.accounts.id, id), eq(schema.accounts.walletId, auth.id)),
      columns: {
        walletId: false
      },
      with: {
        wallet: {
          columns: {
            passkey: false,
            bio: false
          }
        },
        balances: {
          columns: {
            accountId: false
          }
        }
      }
    })

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
    const auth = await useAuth()
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
    const cookieStore = await cookies()
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
