import { fromUnixTime } from 'date-fns'
import { and, eq, inArray } from 'drizzle-orm'

import { RPCClient } from '@/libs/bitcoin/rpc'
import { bitcoinToSats } from '@/libs/bitcoin/unit'
import { db, schema } from '@/libs/drizzle'
import { logger } from '@/libs/logger'

async function formatter(rpcClient: RPCClient, tx: ITransaction.List) {
  const raw = await rpcClient.getTransaction(tx.txid)

  // Optimize: Batch fetch all parent transactions for inputs
  const batchCalls = raw.vin
    .filter((vin) => vin.txid)
    .map((vin) => ({
      method: 'getrawtransaction',
      params: [vin.txid, true]
    }))

  const parentTxs = batchCalls.length > 0 ? await rpcClient.batch<ITransaction.Raw>(batchCalls) : []

  let fetchIndex = 0
  const inputs: Transaction.Schema['inputs'] = raw.vin.map((vin) => {
    if (!vin.txid) {
      // Handle coinbase transaction
      return {
        txid: 'coinbase',
        address: 'coinbase',
        value: 0
      }
    }

    const prevTx = parentTxs[fetchIndex++]
    const prevOut = prevTx.vout[vin.vout]
    const { address = '', hex: pkScript = '' } = prevOut.scriptPubKey || {}

    return {
      txid: vin.txid,
      address,
      value: bitcoinToSats(prevOut.value)
    }
  })

  const outputs: Transaction.Schema['outputs'] = raw.vout.map(({ value, scriptPubKey }) => ({
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

async function getTransactions(rpcClient: RPCClient, page: number, take: number) {
  const transactions = await rpcClient.listTransactions('*', take, (page - 1) * take)
  const formatted = await Promise.all(transactions.map((tx) => formatter(rpcClient, tx)))

  // Sort by timestamp descending (newest first)
  // Since listTransactions returns a batch of "recent" transactions,
  // we just need to sort specifically this batch or reverse it if it's already in chronological order.
  return formatted.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
}

async function main() {
  logger('🔍 Fetch transactions...')
  const startedAt = new Date()
  const [walletId, accountId] = [process.env.PRIV_SUB!, process.env.PRIV_UID!]

  try {
    const rpcClient = new RPCClient()
    await rpcClient.setWallet(accountId)

    // Example: Fetch Page 1 with 10 items
    const page = 1
    const take = 10

    logger(`📄 Fetching page ${page} (limit ${take})...`)
    const transactions = await getTransactions(rpcClient, page, take)

    const addrs = new Set(transactions.flatMap((tx) => [...tx.inputs, ...tx.outputs].map((r) => r.address)))
    await db
      .update(schema.addresses)
      .set({
        isUsed: true
      })
      .where(
        and(
          eq(schema.addresses.accountId, accountId),
          eq(schema.addresses.isUsed, false),
          inArray(schema.addresses.address, Array.from(addrs))
        )
      )

    logger(`✅ Transactions fetched successfully`, startedAt)
  } catch (error) {
    logger(`⚠️ An error occurred: ${error}`, startedAt)
  }

  process.exit()
}

main()
