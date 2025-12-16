'use server'

import 'server-only'

import { fromUnixTime } from 'date-fns'

import { RPCClient } from '@/libs/bitcoin/rpc'
import { bitcoinToSats } from '@/libs/bitcoin/unit'

export async function formatter(rpcClient: RPCClient, tx: ITransaction.List) {
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
