import "server-only"

import { fromUnixTime } from "date-fns"

import { RPCClient, RPCError } from "@/libs/bitcoin/rpc"
import { bitcoinToSats } from "@/libs/bitcoin/unit"

async function readDetails(rpcClient: RPCClient, tx: NodeTransaction.List) {
  const raw = await rpcClient.getTransaction(tx.txid)

  // Optimize: Batch fetch all parent transactions for inputs
  const batchCalls = raw.vin
    .filter((vin) => vin.txid)
    .map((vin) => ({
      method: "getrawtransaction",
      params: [vin.txid, true]
    }))

  const parentTxs =
    batchCalls.length > 0 ? await rpcClient.batch<NodeTransaction.Raw>(batchCalls) : []

  let fetchIndex = 0
  const inputs: Transaction.Schema["inputs"] = raw.vin.map((vin) => {
    if (!vin.txid) {
      // Handle coinbase transaction
      return {
        txid: "coinbase",
        address: "coinbase",
        value: 0
      }
    }

    const prevTx = parentTxs[fetchIndex++]
    const prevOut = prevTx.vout[vin.vout]
    const { address = "" } = prevOut.scriptPubKey || {}

    return {
      txid: vin.txid,
      address,
      value: bitcoinToSats(prevOut.value)
    }
  })

  const outputs: Transaction.Schema["outputs"] = raw.vout.map(
    ({ value, scriptPubKey }) => ({
      address: scriptPubKey?.address || "",
      value: bitcoinToSats(value)
    })
  )

  const vin = inputs.reduce((sum, { value }) => sum + value, 0)
  const vout = raw.vout.reduce((sum, { value }) => sum + value, 0)
  const fee = Math.round(vin - bitcoinToSats(vout))

  return { size: raw.size, weight: raw.weight, fee, inputs, outputs }
}

export async function formatTransaction(rpcClient: RPCClient, tx: NodeTransaction.List) {
  // The node saying no is about this one transaction, such as a payment its sender replaced, and
  // the rest of the history still stands. No answer at all is different, so that one goes up.
  const details = await readDetails(rpcClient, tx).catch((error) => {
    if (error instanceof RPCError) return null
    throw error
  })

  const amount = bitcoinToSats(Math.abs(tx.amount))

  return {
    txid: tx.txid,
    size: details?.size ?? 0,
    weight: details?.weight ?? 0,
    amount,
    fee: details?.fee ?? 0,
    inputs: details?.inputs ?? [],
    outputs:
      details?.outputs ?? (tx.address ? [{ address: tx.address, value: amount }] : []),
    type: tx.category as Transaction.Type,
    status: (tx?.confirmations < 1
      ? "pending"
      : tx.abandoned
        ? "abandoned"
        : "confirmed") as Transaction.Status,
    timestamp: fromUnixTime(tx.time),
    confirmations: tx?.confirmations || 0,
    blockHash: tx.blockhash,
    blockHeight: tx?.blockheight,
    blockIndex: tx?.blockindex,
    blockTime: tx?.blocktime
  }
}
