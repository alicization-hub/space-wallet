import { fromUnixTime } from 'date-fns'
import { and, eq, inArray } from 'drizzle-orm'

import { RPCClient } from '@/libs/bitcoin/rpc'
import { bitcoinToSats } from '@/libs/bitcoin/unit'
import { db, schema } from '@/libs/drizzle'

import { logger } from './logger'

async function txFormatter(rpcClient: RPCClient, tx: ITransaction.List) {
  const raw = await rpcClient.getTransaction(tx.txid)

  const inputs: Transaction.Input[] = await Promise.all(
    raw.vin.map(async ({ txid, vout }) => {
      const { vout: prevVout } = await rpcClient.getTransaction(txid)
      const prevOut = prevVout[vout]
      const { address = '', hex: pkScript = '' } = prevOut.scriptPubKey || {}

      return {
        txid,
        address,
        value: bitcoinToSats(prevOut.value)
      }
    })
  )

  const outputs: Transaction.Output[] = raw.vout
    .filter(
      ({ scriptPubKey }) =>
        scriptPubKey?.address === tx.address ||
        inputs.some(({ address }) => address === scriptPubKey?.address)
    )
    .map(({ value, scriptPubKey }) => ({
      address: scriptPubKey?.address || '',
      value: bitcoinToSats(value)
    }))

  const vin = inputs.reduce((sum, { value }) => sum + value, 0)
  const vout = raw.vout.reduce((sum, { value }) => sum + value, 0)
  const fee = Math.round(vin - bitcoinToSats(vout))

  return {
    txid: raw.txid,
    size: raw.size,
    weight: raw.weight,
    amount: bitcoinToSats(tx.amount),
    fee,
    inputs,
    outputs,
    type: tx.category as Transaction.Type,
    status: (tx?.confirmations < 1
      ? 'pending'
      : tx.abandoned
        ? 'abandoned'
        : 'confirmed') as Transaction.Status,
    timestamp: fromUnixTime(tx.time),
    confirmations: tx?.confirmations || 0,
    blockHash: tx.blockhash,
    blockHeight: tx?.blockheight,
    blockIndex: tx?.blockindex,
    blockTime: tx?.blocktime
  }
}

export async function syncTransactions(accountId: string, rpcClient: RPCClient) {
  logger(`🔄 [${accountId}] Initiating transaction sync...`)
  const startTime = Date.now()

  let BATCH_SIZE = 10
  let skip = 0
  let isContinue = true

  while (isContinue) {
    try {
      logger(`📦 Fetch transactions with batch (${BATCH_SIZE})`)

      const result = await rpcClient.listTransactions('*', BATCH_SIZE + 1, skip, true)
      const calls = result.slice(0, BATCH_SIZE).map((tx) => txFormatter(rpcClient, tx))
      const txs = await Promise.all(calls)
      const txids = txs.map((tx) => tx.txid)

      // Continue if got full batch size
      isContinue = result.length >= BATCH_SIZE
      skip += BATCH_SIZE

      const existing = await db
        .select({ txid: schema.transactions.txid })
        .from(schema.transactions)
        .where(inArray(schema.transactions.txid, txids))

      const existingTxids = new Set(existing.map((e) => e.txid))

      // Insert new transactions.
      const inserts = txs.filter((tx) => !existingTxids.has(tx.txid))
      if (inserts.length > 0) {
        await db.insert(schema.transactions).values(
          inserts.map((tx) => ({
            accountId: accountId,
            ...tx
          }))
        )
      }

      // Update existing transactions.
      const updates = txs.filter((tx) => existingTxids.has(tx.txid))
      if (updates.length > 0) {
        for (const tx of updates) {
          await db
            .update(schema.transactions)
            .set({
              confirmations: tx.confirmations
            })
            .where(and(eq(schema.transactions.accountId, accountId), eq(schema.transactions.txid, tx.txid)))
        }
      }

      logger(`✅ Fetch transactions with batch success: (${skip + 1}~${skip + BATCH_SIZE})`)
    } catch (error) {
      console.error('⚠️', ' An error occurred:')
      console.log(error)
    }
  }

  logger(`📝 [${accountId}] Transaction's has been successfully synced.`, startTime)
}
