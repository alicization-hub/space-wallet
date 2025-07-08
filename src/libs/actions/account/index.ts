'use server'

import 'server-only'

import { addDays } from 'date-fns'
import { and, eq, getTableColumns } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { pick } from 'ramda'

import { APP_TOKEN } from '@/constants'
import { useAuthorized } from '@/libs/actions/guard'
import { db, schema } from '@/libs/drizzle'
import { jwt } from '@/libs/jwt'
import { password } from '@/libs/password'

import { switchValidator, type SwitchValidator } from './validator'

export async function switchAccount(params: SwitchValidator) {
  try {
    const auth = await useAuthorized()
    const { walletId, accountId, passphrase } = switchValidator.parse(params)

    const walletColumns = getTableColumns(schema.wallets)
    const accountColumns = getTableColumns(schema.accounts)
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

    const token = jwt.sign({ sub: wallet.id, uid: account.id })
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
