'use server'

import { pick } from 'ramda'

import { mnemonic } from '../bitcoin/mnemonic'
import { ciphers } from '../ciphers'
import { db } from '../db'
import { useAuthGuard } from '../jwt/guard'
import { password } from '../password'
import type { CreateWalletValidator, UpdateWalletValidator } from './wallet.validator'

/**
 * Generates a new BIP39 mnemonic seed phrase with the given length.
 *
 * @param length - The length of the mnemonic seed phrase. It can be either 12 or 24. Default to `24`.
 * @returns A new BIP39 mnemonic seed phrase.
 */
export function generateMnemonic(length: 12 | 24 = 24): string {
  return mnemonic.generate(length)
}

/**
 * Creates a new wallet using the provided values.
 */
export async function createWallet(values: CreateWalletValidator) {
  try {
    const passwordHash = await password.hash(values.passphrase)

    const mnemonicEncrypted = await ciphers.encrypt(values.mnemonic, passwordHash)
    const passphraseEncrypted = await ciphers.encrypt(values.passphrase, passwordHash)

    const result = await db.wallets.create({
      slug: values.name.trim().toLowerCase().replace(/\s+/g, '-'), // Generate a unique identifier for the wallet
      name: values.name,
      mnemonic: mnemonicEncrypted,
      passphrase: passphraseEncrypted,
      passkey: passwordHash,
      accounts: [],
      balance: {
        confirmed: 0,
        unconfirmed: 0,
        immature: 0,
        total: 0,
        spendable: 0
      },
      lastSyncHeight: 0,
      timestamp: null
    })

    return {
      success: true,
      message: 'The wallet has been successfully created.',
      data: pick(['id', 'slug', 'name'], result)
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
    await db.wallets.update(auth.sub, values)

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
    await db.wallets.delete(auth.sub)

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
