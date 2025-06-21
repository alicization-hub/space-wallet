import { RPCClient } from './bitcoin/rpc'
import { COIN } from './bitcoin/scure'

export async function txFormatter(rpcClient: RPCClient, tx: ITransaction.List) {
  const raw = await rpcClient.getTransaction(tx.txid)

  const inputs = await Promise.all(
    raw.vin.map(async ({ txid, vout, scriptSig, sequence, txinwitness }) => {
      const { vout: prevVout } = await rpcClient.getTransaction(txid)
      const prevOut = prevVout[vout]
      const { address = '', hex: pkScript = '' } = prevOut.scriptPubKey || {}

      return {
        txid,
        output: vout,
        sigScript: scriptSig?.hex || '',
        sequence,
        pkScript,
        value: Math.round(prevOut.value * COIN),
        address,
        witness: txinwitness || []
      }
    })
  )

  const outputs = raw.vout
    .filter(
      ({ scriptPubKey }) =>
        scriptPubKey?.address === tx.address ||
        inputs.some(({ address }) => address === scriptPubKey?.address)
    )
    .map(({ value, scriptPubKey }) => ({
      address: scriptPubKey?.address || '',
      pkScript: scriptPubKey.hex,
      value: Math.round(value * COIN),
      spent: false,
      spender: null
    }))

  const inputSum = inputs.reduce((sum, { value }) => sum + value, 0)
  const outputSum = outputs.reduce((sum, { value }) => sum + value, 0)
  const fee = Math.round(inputSum - outputSum)

  return {
    txid: raw.txid,
    size: raw.size,
    version: raw.version,
    lockTime: raw.locktime,
    weight: raw.weight,
    fee,
    inputs,
    outputs,
    type: tx.category,
    status: tx.confirmations < 1 ? 'pending' : tx.abandoned ? 'abandoned' : 'confirmed',
    confirmations: tx.confirmations || 0,
    blockHash: tx.blockhash,
    blockHeight: tx.blockheight,
    blockIndex: tx.blockindex,
    blockTime: tx.blocktime
  }
}

export async function txsFormatter(rpcClient: RPCClient, txs: ITransaction.List[]) {
  return Promise.all(txs.map((tx) => txFormatter(rpcClient, tx)))
}
