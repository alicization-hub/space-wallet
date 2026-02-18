'use server'

import 'server-only'

import { asc, desc, eq } from 'drizzle-orm'
import { cacheLife, cacheTag } from 'next/cache'
import { cookies } from 'next/headers'
import { pick } from 'ramda'

import { useAuth } from '@/libs/actions/auth'
import { mnemonic } from '@/libs/bitcoin/mnemonic'
import { AddressBuilder, createRootKey, GAP_LIMIT } from '@/libs/bitcoin/scure'
import { cipher } from '@/libs/cipher'
import { db, schema } from '@/libs/drizzle'
import { AccountInsertValues } from '@/libs/drizzle/types'
import { password } from '@/libs/password'

import type { CreateWalletValidator, UpdateWalletValidator } from './validator'

/**
 * Generates a new BIP39 mnemonic seed phrase with the given length.
 *
 * @param length - The length of the mnemonic seed phrase. It can be either 12 or 24. Default to `24`.
 * @returns A new BIP39 mnemonic seed phrase.
 */
export async function generateMnemonic(length: MnemonicLength = 24) {
  return mnemonic.generate(length)
}

export async function findWallet(walletId: string) {
  'use cache'
  cacheTag('wallet', walletId)
  cacheLife('hours')

  return db.select().from(schema.wallets).where(eq(schema.wallets.id, walletId))
}

export async function findWallets() {
  'use cache'
  cacheTag('wallets')
  cacheLife('seconds')

  try {
    const cookieStore = await cookies()
    await useAuth(cookieStore)

    return db.query.wallets.findMany({
      where: eq(schema.wallets.isActive, true),
      columns: {
        bio: false,
        passkey: false
      },
      orderBy: [asc(schema.wallets.createdAt)],
      with: {
        accounts: {
          columns: {
            walletId: false,
            index: false
          },
          orderBy: [desc(schema.accounts.purpose)]
        }
      }
    })
  } catch (error) {
    throw error
  }
}

/**
 * Creates a new wallet using the provided values.
 */
export async function createWallet(values: CreateWalletValidator) {
  try {
    // Hash the passphrase for secure storage in the database
    const passwordHash = await password.hash(values.passphrase)

    // Encrypt the generated mnemonic using the user's passphrase
    const bioEncrypted = await cipher.encrypt(values.mnemonic, values.passphrase)

    // Create a URL-friendly name (slug) by trimming, lowercasing, and hyphenating
    const slug = values.name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/[^a-z0-9-]/g, '') // Remove non-alphanumeric characters
      .replace(/-+/g, '-') // Replace multiple hyphens with a single hyphen
      .replace(/^-+|-+$/g, '') // Remove leading and trailing hyphens

    // Persist the new wallet record to the database and return its unique ID
    const [wallet] = await db
      .insert(schema.wallets)
      .values({
        slug,
        name: values.name,
        bio: bioEncrypted,
        passkey: passwordHash
      })
      .returning()

    const accountValues: AccountInsertValues[] = [84, 86].map((purpose: any) => ({
      walletId: wallet.id,
      label: `Account No. ${purpose}`,
      purpose,
      index: values?.account?.index || 0,
      startedAt: values?.account?.startedAt ? new Date(values.account.startedAt) : new Date()
    }))

    const accountsCreated = await db.insert(schema.accounts).values(accountValues).returning()

    const rootKey = await createRootKey(values.mnemonic, values.passphrase)
    const addr = new AddressBuilder(rootKey)

    const addresses: (typeof schema.addresses.$inferInsert)[] = []
    for (const account of accountsCreated) {
      for (let index = 0; index <= GAP_LIMIT; index++) {
        const receiveAddress = addr.create(account.purpose, account.index, index)
        addresses.push({
          accountId: account.id,
          address: receiveAddress,
          type: 'receive',
          index
        })

        const changeAddress = addr.create(account.purpose, account.index, index, true)
        addresses.push({
          accountId: account.id,
          address: changeAddress,
          type: 'change',
          index
        })
      }
    }

    await db.insert(schema.addresses).values(addresses)

    return {
      success: true,
      message: 'The wallet has been successfully created.',
      data: {
        ...pick(['id', 'slug', 'name'], wallet),
        accounts: accountsCreated.map((account) => pick(['id', 'label', 'purpose'], account))
      }
    }
  } catch (error: any) {
    return {
      error,
      success: false,
      message: error?.message || 'An error occurred while creating the wallet.'
    }
  }
}

/**
 * Updates an existing wallet using the provided values.
 */
export async function updateWallet(values: UpdateWalletValidator) {
  try {
    const cookieStore = await cookies()
    const auth = await useAuth(cookieStore)
    await db.update(schema.wallets).set(values).where(eq(schema.wallets.id, auth.id))

    return {
      success: true,
      message: 'The wallet has been successfully updated.'
    }
  } catch (error: any) {
    return {
      error,
      success: false,
      message: error?.message || 'An error occurred while updating the wallet.'
    }
  }
}

/**
 * Deletes a wallet.
 */
export async function deleteWallet() {
  try {
    const cookieStore = await cookies()
    const auth = await useAuth(cookieStore)
    await db.delete(schema.wallets).where(eq(schema.wallets.id, auth.id))

    return {
      success: true,
      message: 'The wallet has been successfully deleted.'
    }
  } catch (error: any) {
    return {
      error,
      success: false,
      message: error?.message || 'An error occurred while deleting the wallet.'
    }
  }
}
