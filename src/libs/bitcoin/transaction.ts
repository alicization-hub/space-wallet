import { hexToBytes } from '@noble/hashes/utils'
import { HDKey } from '@scure/bip32'
import { Transaction } from '@scure/btc-signer'

import { createPrivateKey, DUST_THRESHOLD } from './scure'
import { bitcoinToSats, estimateVirtualBytes } from './unit'

/**
 * Creates an unsigned transaction from a list of UTXOs, an amount to send, a fee rate, and the recipient and change addresses.
 *
 * @returns An unsigned transaction
 */
export function createUnsignedTransaction(params: {
  /** List of UTXOs to use as inputs */
  utxos: UTXO.Selected[]
  /** Amount to send in satoshis */
  amount: number
  /** Fee rate in satoshis per byte */
  feeRate: number
  /** Address to send the amount to */
  recipientAddress: string
  /** Address to send change to */
  changeAddress?: string
}) {
  const { utxos, amount, feeRate, recipientAddress, changeAddress } = params

  // Validate inputs
  if (!utxos.length) throw new Error('No UTXOs provided')
  if (amount <= 0) throw new Error('Invalid amount')
  if (feeRate <= 0) throw new Error('Invalid fee rate')

  const totalInput = utxos.reduce((acc, utxo) => acc + bitcoinToSats(utxo.amount), 0)

  const outputs: string[] = [recipientAddress]
  if (changeAddress) outputs.push(changeAddress)

  const vBytes = estimateVirtualBytes(utxos, outputs)
  const fee = Math.ceil(vBytes * feeRate)
  const changeAmount = totalInput - amount - fee

  // Initialize transaction
  const tx = new Transaction()

  // Add inputs from selected UTXOs
  for (const utxo of utxos) {
    const amount = BigInt(bitcoinToSats(utxo.amount))
    const script = hexToBytes(utxo.scriptPubKey)

    tx.addInput({
      txid: utxo.txid,
      index: utxo.vout,
      witnessUtxo: { amount, script },
      tapInternalKey: utxo.type === 'p2tr' ? script.slice(2) : undefined
    })
  }

  // Add recipient output
  tx.addOutputAddress(recipientAddress, BigInt(amount))

  // If changeAmount is too small, treat as additional fee (dust threshold ~546)
  if (changeAddress && changeAmount >= DUST_THRESHOLD) {
    tx.addOutputAddress(changeAddress, BigInt(changeAmount))
  }

  return tx
}

/**
 * Signs a transaction with the given root key and list of UTXOs.
 *
 * @param rootKey The root key to use for signing
 * @param tx The transaction to sign
 * @param utxos The UTXOs to use as inputs
 * @returns The signed transaction
 */
export function signTransaction(rootKey: HDKey, tx: Transaction, utxos: UTXO.Selected[]) {
  // Iterate over each UTXO and sign the corresponding input
  for (const utxo of utxos) {
    const index = utxos.findIndex(({ txid, vout }) => txid === utxo.txid && vout === utxo.vout)
    const privateKey = createPrivateKey(rootKey, utxo.derivationPath)
    tx.signIdx(privateKey, index)
  }

  // Finalize the transaction and compute its txid and hash
  tx.finalize()
  return tx
}
