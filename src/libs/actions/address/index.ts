'use server'

import { setTimeout } from 'timers/promises'

import { getUnixTime } from 'date-fns'
import { and, asc, count, desc, eq, SQL } from 'drizzle-orm'
import { cacheLife, cacheTag } from 'next/cache'
import { cookies } from 'next/headers'
import { omit } from 'ramda'

import { useAuth } from '@/libs/actions/auth'
import { createDescriptors } from '@/libs/bitcoin/descriptor'
import { RPCClient } from '@/libs/bitcoin/rpc'
import { AddressBuilder, createRootKey, GAP_LIMIT } from '@/libs/bitcoin/scure'
import { cipher } from '@/libs/cipher'
import { addressColumns, db, schema } from '@/libs/drizzle'
import type { AddressInsertValues } from '@/libs/drizzle/types'
import { withPagination } from '@/libs/drizzle/utils'
import { password } from '@/libs/password'
import { createPagination } from '@/libs/utils'

import type { CreateValidator, QueryValidator } from './validator'

export async function findAddress(accountId: string) {
  try {
    const cookieStore = await cookies()
    await useAuth(cookieStore)

    const [address] = await db
      .select()
      .from(schema.addresses)
      .where(
        and(
          eq(schema.addresses.accountId, accountId),
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

export async function findAddresses(accountId: string, query: QueryValidator) {
  try {
    const cookieStore = await cookies()
    await useAuth(cookieStore)

    const filters: SQL[] = [eq(schema.addresses.accountId, accountId)]

    if (query?.status && query?.status !== 'all') {
      filters.push(eq(schema.addresses.isUsed, query.status === 'used'))
    }

    if (query?.type && query?.type !== 'all') {
      filters.push(eq(schema.addresses.type, query.type))
    }

    const { total, results } = await db.transaction(async (tx) => {
      const queryBuilder = tx
        .select({
          ...omit(['accountId'], addressColumns)
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

export async function createAddresses(accountId: string, { passphrase }: CreateValidator) {
  try {
    const cookieStore = await cookies()
    const auth = await useAuth(cookieStore)

    // Verify the passphrase
    const isValid = await password.verify(auth.passkey, passphrase)
    if (!isValid) {
      throw new Error('⚠️ - Invalid passphrase.')
    }

    // Create a new RPC client
    const rpcClient = new RPCClient()
    await rpcClient.setWallet(accountId)

    // Decrypt the mnemonic and create the root key
    const mnemonic = await cipher.decrypt(auth.bio, passphrase)
    const rootKey = await createRootKey(mnemonic, passphrase)
    const addr = new AddressBuilder(rootKey)

    // Fetch the account info and determine the next address index, index starting point
    const [account, address] = await db.transaction(async (tx) => {
      const [account] = await tx.select().from(schema.accounts).where(eq(schema.accounts.id, accountId))
      const [address] = await tx
        .select()
        .from(schema.addresses)
        .where(and(eq(schema.addresses.accountId, accountId), eq(schema.addresses.type, 'receive')))
        .orderBy(desc(schema.addresses.index))
        .limit(1)

      return [account, address] as const
    })

    const addressValues: AddressInsertValues[] = []
    const start = address ? address.index + 1 : 0
    const end = start + GAP_LIMIT

    // Generate a batch of new receive and change addresses up to the defined GAP_LIMIT
    for (let index = start; index <= end; index++) {
      const receiveAddress = addr.create(account.purpose, account.index, index)
      const changeAddress = addr.create(account.purpose, account.index, index, true)
      addressValues.push(
        {
          accountId: account.id,
          label: `Receive No. ${index}`,
          type: 'receive',
          index,
          address: receiveAddress
        },
        {
          accountId: account.id,
          label: `Change No. ${index}`,
          type: 'change',
          index,
          address: changeAddress
        }
      )
    }

    // Construct output descriptors for both internal (change) and external (receive) chains
    const descriptor = createDescriptors(rootKey, account.purpose, account.index)
    await rpcClient.setWallet(account.id)

    const receive = await rpcClient.getDescriptor(descriptor.receive)
    const change = await rpcClient.getDescriptor(descriptor.change)

    await setTimeout(2e3)

    // Import the calculated descriptors into the Bitcoin node to start monitoring UTXOs
    await rpcClient.importDescriptors([
      {
        desc: receive.descriptor,
        active: true,
        range: [start, end],
        timestamp: getUnixTime(new Date(account.startedAt)),
        internal: false,
        next_index: start
      },
      {
        desc: change.descriptor,
        active: true,
        range: [start, end],
        timestamp: getUnixTime(new Date(account.startedAt)),
        internal: true,
        next_index: start
      }
    ])

    // Bulk insert the record of the new generated addresses into the local database
    await db.insert(schema.addresses).values(addressValues)

    return {
      success: true,
      message: 'New addresses and descriptors has been successfully generated.'
    }
  } catch (error: any) {
    return {
      error,
      success: false,
      message: error?.message || 'An error occurred while creating the addresses.'
    }
  }
}
