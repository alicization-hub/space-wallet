'use server'

import 'server-only'

import { and, eq, getTableColumns } from 'drizzle-orm'
import { omit, pick } from 'ramda'

import { mnemonic } from '@/libs/bitcoin/mnemonic'
import { ciphers } from '@/libs/ciphers'
import { db, schema } from '@/libs/drizzle'
import { useAuthGuard } from '@/libs/jwt/guard'
import { password } from '@/libs/password'

import type { CreateWalletValidator, UpdateWalletValidator } from './validator'

/**
 * Generates a new BIP39 mnemonic seed phrase with the given length.
 *
 * @param length - The length of the mnemonic seed phrase. It can be either 12 or 24. Default to `24`.
 * @returns A new BIP39 mnemonic seed phrase.
 */
export async function generateMnemonic(length: 12 | 24 = 24) {
  return mnemonic.generate(length)
}

/**
 * Returns the wallet data for the authenticated user.
 */
export async function getWallet() {
  const auth = await useAuthGuard()

  const [wallet] = await db
    .select({ slug: schema.wallets.slug })
    .from(schema.wallets)
    .where(eq(schema.wallets.id, auth.sub))

  const walletColumns = getTableColumns(schema.wallets)
  const accountColumns = getTableColumns(schema.accounts)
  return db
    .select({
      ...omit(['bio', 'passkey'], walletColumns),
      account: omit(['walletId', 'index', 'lastDescriptorRange'], accountColumns)
    })
    .from(schema.wallets)
    .innerJoin(schema.accounts, eq(schema.accounts.walletId, schema.wallets.id))
    .where(and(eq(schema.wallets.id, auth.sub), eq(schema.accounts.id, auth.uid)))
}

/**
 * Creates a new wallet using the provided values.
 */
export async function createWallet(values: CreateWalletValidator) {
  try {
    const passphraseHash = await password.hash(values.passphrase)
    const mnemonicEncrypted = await ciphers.encrypt(values.mnemonic, passphraseHash)

    const [walletCreated] = await db
      .insert(schema.wallets)
      .values({
        slug: values.name.trim().toLowerCase().replace(/\s+/g, '-'), // Generate a unique identifier for the wallet
        name: values.name,
        bio: mnemonicEncrypted,
        passkey: passphraseHash
      })
      .returning()

    const accountsCreated = await db
      .insert(schema.accounts)
      .values(
        [84, 86].map((purpose: any) => ({
          walletId: walletCreated.id,
          label: `BIP-${purpose}`,
          purpose,
          index: values?.account?.index || 0,
          balance: {
            confirmed: 0,
            unconfirmed: 0,
            immature: 0,
            total: 0,
            spendable: 0
          },
          lastSyncHeight: 0,
          startedAt: values?.account?.startedAt ? new Date(values.account.startedAt) : new Date()
        }))
      )
      .returning()

    return {
      success: true,
      message: 'The wallet has been successfully created.',
      data: {
        ...pick(['id', 'slug', 'name'], walletCreated),
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
    const auth = await useAuthGuard()
    await db.update(schema.wallets).set(values).where(eq(schema.wallets.id, auth.sub))

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
    const auth = await useAuthGuard()
    await db.delete(schema.wallets).where(eq(schema.wallets.id, auth.sub))

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
