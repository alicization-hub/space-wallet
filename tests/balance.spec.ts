import { setTimeout } from 'timers/promises'

import { eq } from 'drizzle-orm'

import { RPCClient } from '@/libs/bitcoin/rpc'
import { bitcoinToSats } from '@/libs/bitcoin/unit'
import { db, schema } from '@/libs/drizzle'
import { logger } from '@/libs/logger'

async function getBalance(accountId: string) {
  const rpcClient = new RPCClient()
  await rpcClient.setWallet(accountId)
  const [walletInfo, utxos] = (await rpcClient.batch([
    {
      method: 'getwalletinfo'
    },
    {
      method: 'listunspent',
      params: [1, 1e6, [], true]
    }
  ])) as [IWallet.Info, Unspent.List[]]

  return {
    confirmed: utxos.reduce((acc, utxo) => acc + bitcoinToSats(utxo.amount), 0),
    unconfirmed: bitcoinToSats(walletInfo.unconfirmed_balance),
    immature: bitcoinToSats(walletInfo.immature_balance),
    total: bitcoinToSats(walletInfo.balance),
    spendable: utxos
      .filter((utxo) => utxo.confirmations > 1)
      .reduce((acc, utxo) => acc + bitcoinToSats(utxo.amount), 0)
  }
}

async function main() {
  const startedAt = new Date()

  try {
    const accounts = await db.select().from(schema.accounts)

    for await (const account of accounts) {
      const balance = await getBalance(account.id)
      await db
        .update(schema.accounts)
        .set({
          balance
        })
        .where(eq(schema.accounts.id, account.id))

      await setTimeout(2e3)
    }

    logger(`✅ The balance has been successfully updated.`, startedAt)
  } catch (error) {
    logger(`⚠️ An error occurred: ${error}`, startedAt)
  }

  process.exit()
}

main()
