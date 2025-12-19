import { setTimeout } from 'timers/promises'

import { getUnixTime } from 'date-fns'
import { and, desc, eq } from 'drizzle-orm'

import { createDescriptors } from '@/libs/bitcoin/descriptor'
import { mnemonic } from '@/libs/bitcoin/mnemonic'
import { RPCClient } from '@/libs/bitcoin/rpc'
import { AddressBuilder, createRootKey, GAP_LIMIT } from '@/libs/bitcoin/scure'
import { cipher } from '@/libs/cipher'
import { db, schema } from '@/libs/drizzle'
import type { AddressInsertValues } from '@/libs/drizzle/types'
import { logger } from '@/libs/logger'
import { password } from '@/libs/password'
import { passphraseSchema } from '@/libs/validator.zod'

import { commandInput } from './cmd.spec'

async function createWallet(name: string) {
  logger('🚀 Create wallet...')
  const startedAt = new Date()

  try {
    // Prompt the user for a passkey and validate it against the defined schema
    const str = await commandInput('🔑 Enter passkey')
    const passphrase = await passphraseSchema.parseAsync(str)

    // Generate a secure 24-word BIP39 mnemonic for the new wallet
    const bio = mnemonic.generate(24)

    // Hash the passphrase for secure storage in the database
    const passwordHash = await password.hash(passphrase)

    // Encrypt the generated mnemonic using the user's passphrase
    const bioEncrypted = await cipher.encrypt(bio, passphrase)

    // Create a URL-friendly name (slug) by trimming, lowercasing, and hyphenating
    const slug = name
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
        name,
        bio: bioEncrypted,
        passkey: passwordHash
      })
      .returning({ id: schema.wallets.id })

    logger(`✅ New wallet "${name}" has been successfully created.`, startedAt)

    return wallet.id
  } catch (error) {
    throw error
  }
}

async function createAccount(walletId: string, index: number) {
  logger('🚀 Create account...')
  const startedAt = new Date()

  try {
    // Execute within a database transaction to ensure atomicity for account and balance creation
    const accountId = await db.transaction(async (tx) => {
      // Create a new account record linked to the specified wallet
      const [{ id: accountId }] = await tx
        .insert(schema.accounts)
        .values({
          walletId,
          label: `Account No. ${index}`,
          index,
          startedAt: new Date()
        })
        .returning({ id: schema.accounts.id })

      // Initialize a balance record for this newly created account
      await tx.insert(schema.balances).values({ accountId })

      return accountId
    })

    // Register and create the wallet in the Bitcoin Core RPC node using the account ID
    const rpcClient = new RPCClient()
    await rpcClient.createWallet(accountId)

    logger(`✅ New account ${index} has been successfully created.`, startedAt)

    return accountId
  } catch (error: any) {
    throw error
  }
}

async function createAddresses(walletId: string, accountId: string) {
  logger('🚀 Create addresses...')
  const startedAt = new Date()

  try {
    // Request the passkey from the user and validate it
    const str = await commandInput('🔑 Enter passkey')
    const passphrase = await passphraseSchema.parseAsync(str)

    // Retrieve wallet records and verify the user's passphrase
    const [wallet] = await db.select().from(schema.wallets).where(eq(schema.wallets.id, walletId))
    const isValid = await password.verify(wallet.passkey, passphrase)
    if (!isValid) {
      throw new Error('Invalid passphrase.')
    }

    const rpcClient = new RPCClient()

    // Decrypt the wallet's mnemonic and derive the BIP32 Root Key
    const mnemonic = await cipher.decrypt(wallet.bio, passphrase)
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
    logger('✅ New addresses and descriptors has been successfully generated.', startedAt)
  } catch (error) {
    throw error
  }
}

async function main() {
  const startedAt = new Date()

  try {
    const walletId = await createWallet('Test Wallet')
    const accountId = await createAccount(walletId, 0)
    await createAddresses(walletId, accountId)

    logger(`✅ Test wallet has been successfully created.`, startedAt)
  } catch (error) {
    logger(`⚠️ An error occurred: ${error}`)
  }

  process.exit()
}

main()
