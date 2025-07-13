'use server'

import 'server-only'

import { and, asc, count, desc, eq, getTableColumns, SQL } from 'drizzle-orm'
import { omit } from 'ramda'

import { useAuthorized } from '@/libs/actions/guard'
import { AddressBuilder, createRootKey, GAP_LIMIT } from '@/libs/bitcoin/scure'
import { ciphers } from '@/libs/ciphers'
import { db, schema } from '@/libs/drizzle'
import { withPagination } from '@/libs/drizzle/utils'
import { password } from '@/libs/password'
import { createPagination } from '@/libs/utils'

import type { CreateValidator, QueryValidator } from './validator'

export async function findAddress() {
  try {
    const auth = await useAuthorized()

    const addressColumns = getTableColumns(schema.addresses)
    const [address] = await db
      .select(omit(['accountId'], addressColumns))
      .from(schema.addresses)
      .where(
        and(
          eq(schema.addresses.accountId, auth.uid),
          eq(schema.addresses.type, 'receive'),
          eq(schema.addresses.isUsed, false)
        )
      )
      .orderBy(asc(schema.addresses.index))
      .limit(1)

    return address
  } catch (error: any) {
    throw new Error(error.message)
  }
}

export async function findAddresses(query: QueryValidator) {
  try {
    const auth = await useAuthorized()

    const addressTableColumns = getTableColumns(schema.addresses)
    const filters: SQL[] = [eq(schema.addresses.accountId, auth.uid)]

    if (query?.status && query?.status !== 'all') {
      filters.push(eq(schema.addresses.isUsed, query.status === 'used'))
    }

    if (query?.type && query?.type !== 'all') {
      filters.push(eq(schema.addresses.type, query.type))
    }

    const { total, results } = await db.transaction(async (tx) => {
      const queryBuilder = tx
        .select({
          ...omit(['accountId'], addressTableColumns)
        })
        .from(schema.addresses)
        .where(and(...filters))
        .orderBy(asc(schema.addresses.isUsed), asc(schema.addresses.index))
        .$dynamic()

      const queryCountBuilder = tx
        .select({ count: count() })
        .from(schema.addresses)
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
  } catch (error) {
    throw error
  }
}

export async function createAddresses({ passphrase }: CreateValidator) {
  try {
    const auth = await useAuthorized()

    const walletColumns = getTableColumns(schema.wallets)
    const accountColumns = getTableColumns(schema.accounts)
    const [wallet] = await db
      .select({
        ...walletColumns,
        account: omit(['walletId'], accountColumns)
      })
      .from(schema.wallets)
      .innerJoin(schema.accounts, eq(schema.accounts.walletId, schema.wallets.id))
      .where(and(eq(schema.wallets.id, auth.sub), eq(schema.accounts.id, auth.uid)))

    // Verify the passphrase
    const isValid = await password.verify(wallet.passkey, passphrase)
    if (!isValid) {
      throw new Error('⚠️ - Invalid passphrase.')
    }

    const [address] = await db
      .select()
      .from(schema.addresses)
      .where(eq(schema.addresses.accountId, wallet.account.id))
      .orderBy(desc(schema.addresses.index))
      .limit(1)

    // Decrypt the mnemonic and create the root key
    const mnemonic = await ciphers.decrypt(wallet.bio, passphrase)
    const rootKey = await createRootKey(mnemonic, passphrase)
    const addr = new AddressBuilder(rootKey)

    const form = address ? address.index + 1 : 0
    const to = address ? form + GAP_LIMIT - 1 : GAP_LIMIT
    const addresses: (typeof schema.addresses.$inferInsert)[] = []

    for (let index = form; index <= to; index++) {
      const receiveAddress = addr.create(wallet.account.purpose, wallet.account.index, index)
      addresses.push({
        accountId: wallet.account.id,
        address: receiveAddress,
        type: 'receive',
        index
      })

      const changeAddress = addr.create(wallet.account.purpose, wallet.account.index, index, true)
      addresses.push({
        accountId: wallet.account.id,
        address: changeAddress,
        type: 'change',
        index
      })
    }

    await db.insert(schema.addresses).values(addresses)

    return {
      success: true,
      message: 'The addresses have been successfully created.'
    }
  } catch (error: any) {
    return {
      error,
      success: false,
      message: error?.message || 'An error occurred while creating the addresses.'
    }
  }
}
