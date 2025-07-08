import { eq } from 'drizzle-orm'

import { RPCClient } from '@/libs/bitcoin/rpc'
import { bitcoinToSats } from '@/libs/bitcoin/unit'
import { db, schema } from '@/libs/drizzle'

import { logger } from './logger'

export async function syncAccount(accountId: string, rpcClient: RPCClient) {
  logger(`🔄 [${accountId}] Initiating account balance sync...`)
  const startTime = Date.now()

  try {
    const [walletInfo, utxos] = await Promise.all([rpcClient.getWallet(), rpcClient.listUnspent(1)])
    const balance: Wallet.Balance = {
      confirmed: utxos.reduce((acc, utxo) => acc + bitcoinToSats(utxo.amount), 0),
      unconfirmed: bitcoinToSats(walletInfo.unconfirmed_balance),
      immature: bitcoinToSats(walletInfo.immature_balance),
      total: bitcoinToSats(walletInfo.balance),
      spendable: utxos
        .filter((utxo) => utxo.confirmations > 1)
        .reduce((acc, utxo) => acc + bitcoinToSats(utxo.amount), 0)
    }

    await db
      .update(schema.accounts)
      .set({
        balance,
        lastSyncHeight: walletInfo.lastprocessedblock.height
      })
      .where(eq(schema.accounts.id, accountId))

    logger(`📝 [${accountId}] The account has been successfully synced.`, startTime)
  } catch (error) {
    console.error('⚠️', ' An error occurred:')
    console.log(error)
  }
}
