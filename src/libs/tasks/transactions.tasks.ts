import { fromUnixTime } from 'date-fns'
import { and, eq, inArray } from 'drizzle-orm'

import { RPCClient } from '../bitcoin/rpc'
import { bitcoinToSats } from '../bitcoin/unit'
import { db, schema } from '../drizzle'
import type { AccountSchema as Account } from '../drizzle/types'
import { logger } from '../utils'

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

async function txsFormatter(rpcClient: RPCClient, txs: ITransaction.List[]) {
  return Promise.all(txs.map((tx) => txFormatter(rpcClient, tx)))
}

export async function syncTransactions(account: Account, rpcClient: RPCClient) {
  const startTime = Date.now()

  try {
    const transactions = await rpcClient.listTransactions('*', 1000)
    const txs = await txsFormatter(rpcClient, transactions)
    const txids = txs.map((tx) => tx.txid)

    const existing = await db
      .select({ txid: schema.transactions.txid })
      .from(schema.transactions)
      .where(inArray(schema.transactions.txid, txids))

    const existingTxids = new Set(existing.map((e) => e.txid))

    const inserts = txs.filter((tx) => !existingTxids.has(tx.txid))
    if (inserts.length > 0) {
      await db.insert(schema.transactions).values(
        inserts.map((tx) => ({
          accountId: account.id,
          ...tx
        }))
      )
    }

    const updates = txs.filter((tx) => existingTxids.has(tx.txid))
    if (updates.length > 0) {
      for (const tx of updates) {
        await db
          .update(schema.transactions)
          .set({
            fee: tx.fee,
            confirmations: tx.confirmations
          })
          .where(eq(schema.transactions.txid, tx.txid))
      }
    }

    const addresses = await db
      .select()
      .from(schema.addresses)
      .where(and(eq(schema.addresses.accountId, account.id), eq(schema.addresses.isUsed, false)))

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

    logger(`✅ [${account.id}] Transaction's has been successfully synced.`, startTime)

    return true
  } catch (error) {
    console.error('⚠️', ' An error occurred:')
    console.log(error)
  }
}
