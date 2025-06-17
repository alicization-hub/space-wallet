import { getUnixTime } from 'date-fns'

import { db } from '@/libs/db'

import { ciphers } from '../ciphers'
import { nanoId } from '../utils'
import { derivationPathBuilder } from './derivation'
import { createDescriptors } from './descriptor'
import { RPCClient } from './rpc'
import { AddressBuilder, createRootKey } from './scure'

const rpcClient = new RPCClient()

async function main() {
  const [wallet] = await db.wallets.findAll()
  if (!wallet) {
    throw new Error('Wallet not found')
  }

  const mnemonicCode = await ciphers.decrypt(wallet.mnemonic, wallet.passkey)
  const passphrase = await ciphers.decrypt(wallet.passphrase, wallet.passkey)

  try {
    const rootKey = await createRootKey(mnemonicCode, passphrase)
    const addr = new AddressBuilder(rootKey)

    const accounts: Wallet.Account[] = []
    for (let account = 0; account < 1; account++) {
      const acc: Wallet.Account = {
        id: nanoId(),
        purpose: 84,
        coinType: 0,
        index: account,
        addresses: [],
        createdAt: new Date().toISOString()
      }

      for (let address = 0; address < 6; address++) {
        acc.addresses = [
          ...(acc.addresses || []),
          {
            accountId: acc.id,
            address: addr.segWit(account, address)?.address || '',
            index: address,
            change: 0,
            type: 'wpkh',
            balance: 0,
            createdAt: new Date().toISOString()
          },
          {
            accountId: acc.id,
            address: addr.segWit(account, address, true)?.address || '',
            index: address,
            change: 1,
            type: 'wpkh',
            balance: 0,
            createdAt: new Date().toISOString()
          }
        ]
      }

      accounts.push(acc)
    }

    for await (const account of accounts) {
      for await (const address of account.addresses || []) {
        const derivationPath = derivationPathBuilder()
          .purpose(account.purpose)
          .coinType(account.coinType)
          .account(account.index)
          .change(address.change)
          .address(address.index)
          .build()

        console.log('📝 Derivation path:\x1b[32m', derivationPath, address.address, '\x1b[0m')
      }
    }
  } catch (error) {
    console.error(error)
  }
}
// main()

async function status() {
  console.log('🔍 ตรวจสอบสถานะ Bitcoin Core...')

  try {
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
// status()

async function trans() {
  console.log('🔍 ตรวจสอบ Bitcoin transaction histories...')

  try {
    // const chainInfo = await rpcClient.getChain()

    // console.log('✅ Bitcoin Core Connection: SUCCESS')
    // console.log(`📊 Chain: ${chainInfo.chain}`)
    // console.log(`📦 Blocks: ${chainInfo.blocks} / ${chainInfo.headers}`)
    // console.log(`🔄 Sync Progress: ${(chainInfo.verificationprogress * 100).toFixed(2)} %`)

    // if (chainInfo.verificationprogress < 0.99) {
    //   console.log('⚠️ WARNING: Bitcoin Core is still syncing. Balance data may be incomplete.\n')
    // } else {
    const [wallet] = await db.wallets.findAll()
    if (!wallet) {
      throw new Error('Wallet not found.')
    }

    const mnemonicPhrase = await ciphers.decrypt(wallet.mnemonic, wallet.passkey)
    const passphrase = await ciphers.decrypt(wallet.passphrase, wallet.passkey)
    console.log('🎯 Mnemonic phrase:', mnemonicPhrase.split(/\s+/))

    const rootKey = await createRootKey(mnemonicPhrase, passphrase)
    const addr = new AddressBuilder(rootKey)

    // Generate a list of addresses for the first 2 accounts and the first 20 addresses in each account.
    const addresses = Array.from({ length: 2 * 2 * 20 }, (_, i) => {
      const account = Math.floor(i / 40)
      const change = Math.floor(i / 20) % 2
      const index = i % 20

      const { address, derivationPath } = addr.segWit(account, index, change === 1)
      return {
        derivationPath,
        address,
        isChange: change === 1
      }
    }).filter(({ address }) => !!address)
    console.log('🔑 SegWit addresses:', addresses, addresses.length)

    // const transactions = []
    // for await (const address of addresses) {
    //   try {
    //     // Note: This requires txindex=1 in bitcoin.conf
    // const txs = await rpcClient.scanUTXO('start', [`addr(${addresses[0].address})`])
    //     if (txs.unspents && txs.unspents.length > 0) {
    //       for (const utxo of txs.unspents) {
    //         const tx = await callRPC('gettransaction', [utxo.txid, true])
    //         transactions.push(tx)
    //       }
    //     }
    //   } catch (error) {
    //     console.error(`Error scanning for address ${address}:`, error)
    //   }
    // }

    // console.log('📦 Transactions:', transactions)
    // }
  } catch (error: any) {
    console.log(`❌ Bitcoin Core Connection Failed: ${error.message}`)
  }
}
// trans()

async function descriptor() {
  console.log('🔍 ตรวจสอบ Bitcoin descriptors...')

  const [wallet] = await db.wallets.findAll()
  if (!wallet) {
    throw new Error('Wallet not found')
  }

  try {
    const mnemonicCode = await ciphers.decrypt(wallet.mnemonic, wallet.passkey)
    const passphrase = await ciphers.decrypt(wallet.passphrase, wallet.passkey)
    const rootKey = await createRootKey(mnemonicCode, passphrase)

    const descriptors = createDescriptors(rootKey, 84)
    const [receive, change] = await Promise.all([
      rpcClient.getDescriptor(descriptors.receive),
      rpcClient.getDescriptor(descriptors.change)
    ])
    console.log('📊 Receive Descriptors info:', receive)
    console.log('📊 Change Descriptors info:', change)

    // const beginForm = getUnixTime(new Date('2022-04-04T10:00:00+07:00'))
    // const result = await rpcClient.importDescriptors([
    //   {
    //     desc: receive.descriptor,
    //     active: true,
    //     range: [0, 100],
    //     timestamp: beginForm,
    //     internal: false,
    //     next_index: 0
    //   },
    //   {
    //     desc: change.descriptor,
    //     active: true,
    //     range: [0, 100],
    //     timestamp: beginForm,
    //     internal: true,
    //     next_index: 0
    //   }
    // ])
    // console.log('📊 Import descriptors result:', result)
  } catch (error) {
    console.error('❌ An error occurred:', error)
  }
}
// descriptor()
