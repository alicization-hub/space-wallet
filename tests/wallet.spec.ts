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
    const str = await commandInput('🔑 Enter passkey')
    const passphrase = await passphraseSchema.parseAsync(str)

    const bio = mnemonic.generate(24)
    const passwordHash = await password.hash(passphrase)
    const bioEncrypted = await cipher.encrypt(bio, passphrase)

    const slug = name.trim().toLowerCase().replace(/\s+/g, '-')
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
    const accountId = await db.transaction(async (tx) => {
      const [{ id: accountId }] = await tx
        .insert(schema.accounts)
        .values({
          walletId,
          label: `Account No. ${index}`,
          index,
          startedAt: new Date()
        })
        .returning({ id: schema.accounts.id })

      await tx.insert(schema.balances).values({ accountId })

      return accountId
    })

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
    const str = await commandInput('🔑 Enter passkey')
    const passphrase = await passphraseSchema.parseAsync(str)

    const [wallet] = await db.select().from(schema.wallets).where(eq(schema.wallets.id, walletId))
    const isValid = await password.verify(wallet.passkey, passphrase)
    if (!isValid) {
      throw new Error('⚠️ - Invalid passphrase.')
    }

    const rpcClient = new RPCClient()

    const mnemonic = await cipher.decrypt(wallet.bio, passphrase)
    const rootKey = await createRootKey(mnemonic, passphrase)
    const addr = new AddressBuilder(rootKey)

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

    // Generate addresses
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

    // Generate descriptors
    const descriptor = createDescriptors(rootKey, account.purpose, account.index)
    await rpcClient.setWallet(account.id)

    const receive = await rpcClient.getDescriptor(descriptor.receive)
    const change = await rpcClient.getDescriptor(descriptor.change)

    await setTimeout(2e3)
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
