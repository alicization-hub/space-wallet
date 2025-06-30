'use server'

import 'server-only'

import { getUnixTime } from 'date-fns'
import { and, eq, getTableColumns } from 'drizzle-orm'
import { omit } from 'ramda'

import { createDescriptors } from '@/libs/bitcoin/descriptor'
import { RPCClient } from '@/libs/bitcoin/rpc'
import { createRootKey, GAP_LIMIT } from '@/libs/bitcoin/scure'
import { ciphers } from '@/libs/ciphers'
import { db, schema } from '@/libs/drizzle'
import { useAuthGuard } from '@/libs/jwt/guard'
import { password } from '@/libs/password'

import { type ImportValidator } from './validator'

/**
 * Imports descriptors into the wallet.
 *
 * This RPC call is used to import descriptors into the wallet.
 * This function must be called only after creating an account and address.
 */
export async function importDescriptors({ passphrase }: ImportValidator) {
  try {
    const auth = await useAuthGuard()

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

    // Create a new RPC client
    const rpcClient = new RPCClient()
    await rpcClient.setWallet(wallet.account.id)

    // Decrypt the mnemonic and create the root key
    const mnemonic = await ciphers.decrypt(wallet.bio, passphrase)
    const rootKey = await createRootKey(mnemonic, passphrase)

    // Create the descriptors
    const descriptors = createDescriptors(rootKey, wallet.account.purpose, wallet.account.index)
    const [receive, change] = await Promise.all([
      rpcClient.getDescriptor(descriptors.receive),
      rpcClient.getDescriptor(descriptors.change)
    ])

    const isFirst = wallet.account.lastDescriptorRange === 0
    const nextIndex = isFirst ? 0 : wallet.account.lastDescriptorRange + 1
    const nextRangeEnd = isFirst ? GAP_LIMIT : nextIndex + GAP_LIMIT - 1

    rpcClient.importDescriptors([
      {
        desc: receive.descriptor,
        active: false,
        range: [nextIndex, nextRangeEnd],
        timestamp: getUnixTime(wallet.account.startedAt),
        internal: false,
        next_index: nextIndex
      },
      {
        desc: change.descriptor,
        active: false,
        range: [nextIndex, nextRangeEnd],
        timestamp: getUnixTime(wallet.account.startedAt),
        internal: true,
        next_index: nextIndex
      }
    ])

    await db
      .update(schema.accounts)
      .set({ lastDescriptorRange: nextRangeEnd })
      .where(eq(schema.accounts.id, wallet.account.id))

    return {
      success: true,
      message: 'The descriptors has been successfully imported.'
    }
  } catch (error: any) {
    return {
      error,
      success: false,
      message: error?.message || 'An error occurred while creating the wallet.'
    }
  }
}
