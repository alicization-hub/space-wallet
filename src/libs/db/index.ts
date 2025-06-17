import { nanoId } from '@/libs/utils'

import { mnemonic } from '../bitcoin/mnemonic'
import { ciphers } from '../ciphers'
import { parseCLIArguments } from '../cli-args'
import { password } from '../password'
import { Driver } from './driver'

export const db = Object.freeze({
  wallets: new Driver<Wallet.Schema>('wallets'),
  transactions: new Driver<Wallet.Schema>('transactions')
})

async function main() {
  console.log('🚀 Bitcoin Wallet Generator with Bitcoin Core Support')
  console.log('====================================================')

  const wallets = await db.wallets.findAll()
  console.log('📝 Wallets:', wallets)

  const args = parseCLIArguments<{
    name: string
    mnemonic: string
    passphrase: string
  }>(process.argv.slice(2))

  if (Object.keys(args).length !== 3) {
    args.name = `Bitcoin Wallet: ${wallets.length + 1}`
    args.mnemonic = mnemonic.generate(12)
    args.passphrase = 'WPAdvAw4hdMm@8IB'

    console.log('🎯 Mnemonic code:', args.mnemonic.split(/\s+/))
  } else {
    if (!mnemonic.validate(args.mnemonic)) {
      throw new Error('⚠️ - Invalid mnemonic phrase.')
    }
  }

  const passwordHash = await password.hash(args.passphrase)
  const mnemonicEncrypted = await ciphers.encrypt(args.mnemonic, passwordHash)
  const passphraseEncrypted = await ciphers.encrypt(args.passphrase, passwordHash)

  const wallet: Omit<Wallet.Schema, 'id' | 'createdAt'> = {
    slug: nanoId(8),
    name: args.name,
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
    lastSyncHeight: 0
  }

  const result = await db.wallets.create(wallet)
  console.log('📝 New wallet:', result)
}
// main()

// db.wallets.findAll().then((wallets) => console.log('📝 Wallets:', wallets))
