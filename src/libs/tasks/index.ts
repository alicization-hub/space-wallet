import { secondsToMilliseconds } from 'date-fns'
import { eq, getTableColumns, gt } from 'drizzle-orm'
import { pick } from 'ramda'

import { RPCClient } from '../bitcoin/rpc'
import { db, schema } from '../drizzle'
import { logger } from '../utils'
import { syncAccount } from './accounts.tasks'
import { syncTransactions } from './transactions.tasks'

export async function syncStart() {
  logger("🚀 Wallet's Sync start...")
  const startTime = Date.now()

  try {
    const walletColumns = getTableColumns(schema.wallets)
    const accountColumns = getTableColumns(schema.accounts)
    const accounts = await db
      .select({
        ...accountColumns,
        wallet: pick(['slug'], walletColumns)
      })
      .from(schema.accounts)
      .innerJoin(schema.wallets, eq(schema.wallets.id, schema.accounts.walletId))
      .where(gt(schema.accounts.lastDescriptorRange, 0))

    const rpcClient = new RPCClient()
    for await (const { wallet, ...account } of accounts) {
      await rpcClient.setWallet(wallet.slug)
      await syncAccount(account, rpcClient)
      await syncTransactions(account, rpcClient)
    }

    logger(`✅ Wallet's data has been successfully synced.`, startTime)
    console.log('')

    setTimeout(() => syncStart(), secondsToMilliseconds(60))
  } catch (error) {
    console.error('⚠️', ' An error occurred:')
    console.log(error)
  }
}

syncStart()
