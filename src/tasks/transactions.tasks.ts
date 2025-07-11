import { fromUnixTime } from 'date-fns'
import { and, eq, inArray, ne } from 'drizzle-orm'
import { omit } from 'ramda'

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

  const outputs: Transaction.Output[] = raw.vout.map(({ value, scriptPubKey }) => ({
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
    amount: bitcoinToSats(Math.abs(tx.amount)),
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

  const BATCH_SIZE = 20
  let skip = 0
  let isContinue = true

  while (isContinue) {
    try {
      const result = await rpcClient.listTransactions('*', BATCH_SIZE + 1, skip, true)
      if (result.length < 1) break

      logger(`📦 Fetch transactions with batch (${BATCH_SIZE})`)

      const calls = result.slice(0, BATCH_SIZE).map((tx) => txFormatter(rpcClient, tx))
      const txs = await Promise.all(calls)
      const txids = txs.map((tx) => tx.txid)

      const existing = await db
        .select({ txid: schema.transactions.txid })
        .from(schema.transactions)
        .where(and(eq(schema.transactions.accountId, accountId), inArray(schema.transactions.txid, txids)))

      const existingTxids = new Set(existing.map((e) => e.txid))

      // Insert new transactions.
      const inserts = txs.filter((tx) => !existingTxids.has(tx.txid))
      if (inserts.length > 0) {
        const values = inserts.map((tx) => ({
          ...omit(['confirmations', 'blockHash', 'blockHeight', 'blockIndex', 'blockTime'], tx),
          accountId: accountId
        }))

        await db.insert(schema.transactions).values(values)
      }

      // Update existing transactions.
      const updates = txs.filter((tx) => existingTxids.has(tx.txid))
      if (updates.length > 0) {
        await db.transaction(async (tx) => {
          for (const trans of updates) {
            await tx
              .update(schema.transactions)
              .set({ status: trans.status })
              .where(
                and(
                  eq(schema.transactions.accountId, accountId),
                  eq(schema.transactions.txid, trans.txid),
                  ne(schema.transactions.status, trans.status)
                )
              )
          }
        })
      }

      logger(`✅ Fetch transactions with batch success: (${skip + 1}~${skip + BATCH_SIZE})`)

      // Continue if got full batch size
      isContinue = result.length >= BATCH_SIZE
      skip += BATCH_SIZE
    } catch (error) {
      console.error('⚠️', ' An error occurred:')
      console.log(error)
    }
  }

  logger(`📝 [${accountId}] Transaction's has been successfully synced.`, startTime)
}
