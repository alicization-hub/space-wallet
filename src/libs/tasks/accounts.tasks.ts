import { eq } from 'drizzle-orm'

import { RPCClient } from '../bitcoin/rpc'
import { bitcoinToSats } from '../bitcoin/unit'
import { db, schema } from '../drizzle'
import type { AccountSchema as Account } from '../drizzle/types'
import { logger } from '../utils'

export async function syncAccount(account: Account, rpcClient: RPCClient) {
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
      .where(eq(schema.accounts.id, account.id))

    logger(`✅ [${account.id}] The account has been successfully synced.`, startTime)

    return true
  } catch (error) {
    console.error('⚠️', ' An error occurred:')
    console.log(error)
  }
}
