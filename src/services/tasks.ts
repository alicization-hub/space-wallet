import { minutesToMilliseconds, secondsToMilliseconds } from 'date-fns'
import { and, eq } from 'drizzle-orm'

import { RPCClient } from '@/libs/bitcoin/rpc'
import { bitcoinToSats } from '@/libs/bitcoin/unit'
import { db, schema } from '@/libs/drizzle'
import { txsFormatter } from '@/libs/tx'
import { logger } from '@/libs/utils'

import { currentWallet } from './auth'

async function start() {
  logger('🚀 Bitcoin wallet data syncing...')
  const startTime = Date.now()

  try {
    const [{ account, ...wallet }] = await currentWallet(process.env.JWT_CURRENT)

    const rpcClient = new RPCClient()
    await rpcClient.setWallet(wallet.slug)

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
      .returning()

    // TODO: Check addresses is already used.
    const addresses = await db
      .select()
      .from(schema.addresses)
      .where(and(eq(schema.addresses.accountId, account.id), eq(schema.addresses.isUsed, false)))

    const txs = await txsFormatter(rpcClient, await rpcClient.listTransactions('*', 1000))
    const addrSet = new Set(
      txs
        .filter((tx) => tx.confirmations > 0)
        .flatMap((tx) => [...tx.inputs, ...tx.outputs].map(({ address }) => address))
    )

    for await (const { address } of addresses) {
      if (addrSet.has(address)) {
        await db.update(schema.addresses).set({ isUsed: true }).where(eq(schema.addresses.address, address))
      }
    }

    logger('✅ The wallet has been successfully synced.', startTime)
    // setTimeout(() => start(), minutesToMilliseconds(1))
  } catch (error) {
    console.error('⚠️', ' An error occurred:')
    console.log(error)
  }
}

start()
