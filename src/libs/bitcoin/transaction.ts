import { hexToBytes } from '@noble/hashes/utils'
import { HDKey } from '@scure/bip32'
import { Transaction } from '@scure/btc-signer'

import { createPrivateKey, DUST_THRESHOLD } from './scure'
import { bitcoinToSats, calcEstimator } from './unit'

/**
 * Creates an signed transaction from a list of UTXOs, an amount to send, a fee rate, and the recipient and change addresses.
 *
 * @param rootKey - Root key to use for signing
 * @param utxos - List of UTXOs to use as inputs
 * @param amount - Amount to send in satoshis
 * @param feeRate - Fee rate in satoshis per byte
 * @param recipientAddress - Recipient address
 * @param changeAddress - Change address
 */
export async function createSignedTransaction(
  rootKey: HDKey,
  feeRate: number,
  inputs: Transaction.PrepareInput<'server'>[],
  outputs: Transaction.PrepareOutput[]
): Promise<Transaction> {
  // Validate inputs
  if (!inputs.length) throw new Error('No inouts provided')
  if (!outputs.length) throw new Error('No outputs provided')
  if (feeRate <= 0) throw new Error('Invalid fee rate')
  if (outputs.filter((o) => o.isChange).length > 1) throw new Error('Change address is not unique')

  // Calculate the total amount being sent
  const amount = outputs.reduce((acc, r) => (r.isRecipient ? acc + bitcoinToSats(r.amount) : acc), 0)
  const { changeAmount } = calcEstimator(amount, feeRate, inputs, outputs)

  // Initialize transaction
  const tx = new Transaction()

  // Add outputs to the transaction
  for (const output of outputs) {
    if (output.isRecipient) {
      tx.addOutputAddress(output.address, BigInt(bitcoinToSats(output.amount)))
    } else if (output.isChange) {
      // If changeAmount is too small, treat as additional fee (dust threshold ~546)
      if (changeAmount >= DUST_THRESHOLD) tx.addOutputAddress(output.address, BigInt(changeAmount))
    }
  }

  // Add inputs to the transaction and sign it with the corresponding private key
  for (let index = 0; index < inputs.length; index++) {
    const utxo = inputs[index]
    const amount = BigInt(bitcoinToSats(utxo.amount))
    const script = hexToBytes(utxo.scriptPubKey)

    // Add the UTXO as an input to the transaction
    tx.addInput({
      txid: utxo.txid,
      index: utxo.vout,
      witnessUtxo: { amount, script },
      tapInternalKey: utxo.type === 'tr' ? script.slice(2) : undefined
    })

    // Sign the input with the corresponding private key
    const privateKey = createPrivateKey(rootKey, utxo.derivationPath)
    tx.signIdx(privateKey, index)
  }

  // Finalize the transaction and compute its txid and hash
  tx.finalize()
  return tx
}
