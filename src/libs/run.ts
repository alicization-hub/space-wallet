import { randomUUID } from 'crypto'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { setTimeout } from 'timers/promises'

import { formatISO, getUnixTime } from 'date-fns'

import { derivationPathBuilder } from './bitcoin/derivation'
import { createDescriptors } from './bitcoin/descriptor'
import { mnemonic } from './bitcoin/mnemonic'
import { RPCClient } from './bitcoin/rpc'
import { AddressBuilder, createRootKey } from './bitcoin/scure'
import { ciphers } from './ciphers'
import { db } from './db'
import { jwt } from './jwt'
import { password } from './password'
import { txFormatter } from './tx'
import { nanoId } from './utils'

const uuid = 'fff1536a-7946-404c-b968-78ace18c9b28'

async function status() {
  console.log('🔍 ตรวจสอบสถานะ Bitcoin Core...')

  try {
    const rpcClient = new RPCClient()
    const [chainInfo, networkInfo, mempoolInfo] = await Promise.all([
      rpcClient.getChain(),
      rpcClient.getNetwork(),
      rpcClient.getMempool()
    ])

    console.log('✅ Bitcoin Core Connection: SUCCESS')
    console.log(`📊 Chain: ${chainInfo.chain}`)
    console.log(`📦 Blocks: ${chainInfo.blocks} / ${chainInfo.headers}`)
    console.log(`🔄 Sync Progress: ${(chainInfo.verificationprogress * 100).toFixed(2)} %`)
    console.log(`🌐 Connections: ${networkInfo.connections}`)
    console.log(`📝 Mempool: ${mempoolInfo.size} transactions`)
    console.log(`💻 Version: ${networkInfo.subversion}\n`)

    if (chainInfo.verificationprogress < 0.99) {
      console.log('⚠️', ' WARNING: Bitcoin Core is still syncing. Balance data may be incomplete.')
    }
  } catch (error: any) {
    console.log(`❌ Bitcoin Core Connection Failed: ${error.message}`)
  }
}

async function create() {
  console.log('🚀 Bitcoin Wallet Generator with Bitcoin Core Support')

  const pathFile = resolve('D:\\Workspace\\load.json')
  const content = readFileSync(pathFile, 'utf-8')
  const data: any[] = JSON.parse(content)

  for await (const r of data) {
    try {
      if (mnemonic.validate(r.mnemonic)) {
        const passwordHash = await password.hash(r.passphrase)
        const mnemonicEncrypted = await ciphers.encrypt(r.mnemonic, passwordHash)
        const passphraseEncrypted = await ciphers.encrypt(r.passphrase, passwordHash)

        const wallet: Omit<Wallet.Schema, 'id' | 'createdAt'> = {
          slug: (r.name as string).trim().toLowerCase().replace(/\s+/g, '-'),
          name: r.name,
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
          timestamp: r.timestamp
        }

        await db.wallets.create(wallet)
        console.log('✅', `"${wallet.name} (${wallet.slug})"`, 'Wallet has been successfully created.')
      } else {
        throw new Error('⚠️ - Invalid mnemonic phrase.')
      }
    } catch (error: any) {
      console.error('An error occurred:', `"${r.name}"`, error.message)
    }
  }
}

async function descriptors(wallet: Wallet.Schema) {
  console.log('📊 Descriptors importing...')

  const rpcClient = new RPCClient()
  await rpcClient.setWallet(wallet.slug)

  const mnemonicCode = await ciphers.decrypt(wallet.mnemonic, wallet.passkey)
  const passphrase = await ciphers.decrypt(wallet.passphrase, wallet.passkey)
  const rootKey = await createRootKey(mnemonicCode, passphrase)

  const descriptors = createDescriptors(rootKey, 84)
  const [receive, change] = await Promise.all([
    rpcClient.getDescriptor(descriptors.receive),
    rpcClient.getDescriptor(descriptors.change)
  ])

  const beginForm = wallet.timestamp ? getUnixTime(new Date(wallet.timestamp)) : 'now'
  rpcClient.importDescriptors([
    {
      desc: receive.descriptor,
      active: true,
      range: [0, 20],
      timestamp: beginForm,
      internal: false,
      next_index: 0
    },
    {
      desc: change.descriptor,
      active: true,
      range: [0, 20],
      timestamp: beginForm,
      internal: true,
      next_index: 0
    }
  ])
  console.log('✅ The descriptors has been successfully imported.')

  await setTimeout(2e3)
  const result = await rpcClient.getWallet()
  console.log('📊 Wallet info:', result)
}

async function addresses() {
  try {
    const wallet = await db.wallets.findOne(uuid)
    if (!wallet) {
      throw new Error('Wallet not found')
    }

    const mnemonicCode = await ciphers.decrypt(wallet.mnemonic, wallet.passkey)
    const passphrase = await ciphers.decrypt(wallet.passphrase, wallet.passkey)

    const rootKey = await createRootKey(mnemonicCode, passphrase)
    const addr = new AddressBuilder(rootKey)

    const account: Account.Schema = {
      id: randomUUID(),
      walletId: wallet.id,
      purpose: 84,
      coinType: 0,
      index: 0,
      addresses: [],
      utxos: [],
      createdAt: formatISO(new Date())
    }

    for (let index = 0; index < 5; index++) {
      const receiveAddr = addr.create(account.purpose, account.index, index)
      account.addresses.push({
        accountId: account.id,
        address: receiveAddr.address,
        path: receiveAddr.derivationPath,
        type: 'receive',
        index,
        balance: 0,
        isUsed: false,
        createdAt: formatISO(new Date())
      })

      const changeAddr = addr.create(account.purpose, account.index, index, true)
      account.addresses.push({
        accountId: account.id,
        address: changeAddr.address,
        path: changeAddr.derivationPath,
        type: 'change',
        index,
        balance: 0,
        isUsed: false,
        createdAt: formatISO(new Date())
      })
    }

    console.log('📊 Account:', account)
  } catch (error) {
    console.error('⚠️', ' An error occurred:')
    console.log(error)
  }
}
addresses()

async function main() {
  try {
    const wallet = await db.wallets.findOne(uuid)
    if (!wallet) {
      throw new Error('Wallet not found.')
    }

    const rpcClient = new RPCClient()
    // const result = await rpcClient.createWallet(wallet.slug)

    // await rpcClient.setWallet(wallet.slug)
    // const result = await rpcClient.getWallet()
    // console.log(result)

    // await descriptors(wallet)

    // const { token, error } = await jwt.sign({ id: nanoId(8), sub: wallet.id })
    // if (error) return console.error(error.message)
    // console.log('🔑 JWT Token:', token)

    // const { payload, error: err } = await jwt.verify(token)
    // if (err) return console.error(err)
    // console.log('🔑 JWT is valid:', !!payload?.id)
    // console.log('🔑 JWT Token Decoded:', payload)
  } catch (error) {
    console.error('⚠️', ' An error occurred:')
    console.log(error)
  }
}
// main()
