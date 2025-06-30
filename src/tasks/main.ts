import { setTimeout } from 'timers/promises'

import { eq, getTableColumns, gt } from 'drizzle-orm'
import { schedule } from 'node-cron'
import { pick } from 'ramda'

import { ENV } from '@/constants/env'
import { RPCClient } from '@/libs/bitcoin/rpc'
import { db, schema } from '@/libs/drizzle'

import { syncAccount } from './accounts.tasks'
import { syncAddresses } from './addresses.tasks'
import { logger } from './logger'
import { syncTransactions } from './transactions.tasks'

// Cron syntax:
// * * * * * *
// | | | | | |
// | | | | | +-- day of week (0 - 7) (Sunday=0 or 7)
// | | | | +---- month (1 - 12)
// | | | +------ day of month (1 - 31)
// | | +-------- hour (0 - 23)
// | +---------- minute (0 - 59)
// +------------ second (0 - 59, optional)

async function runScheduledTask() {
  const startTime = Date.now()

  try {
    const walletColumns = getTableColumns(schema.wallets)
    const accounts = await db
      .select({
        id: schema.accounts.id,
        wallet: pick(['slug'], walletColumns)
      })
      .from(schema.accounts)
      .innerJoin(schema.wallets, eq(schema.wallets.id, schema.accounts.walletId))
      .where(gt(schema.accounts.lastDescriptorRange, 0))

    const rpcClient = new RPCClient()
    for await (const { id, wallet } of accounts) {
      await rpcClient.setWallet(wallet.slug)

      await syncAccount(id, rpcClient)
      await syncTransactions(id, rpcClient)

      await setTimeout(2e2)
      await syncAddresses(id)
    }

    logger('✅ The tasks have been successfully synced.', startTime)
    logger('')
  } catch (error) {
    console.error('⚠️', ' An error occurred:')
    console.log(error)
  }
}

// Schedule to run every 15 seconds
schedule(
  '*/15 * * * * *',
  () => {
    logger('🔄 Running task every 5 seconds...')
    runScheduledTask()
  },
  {
    timezone: ENV.TZ
  }
)

logger('🚀 Initializing and waiting for scheduled tasks...')
