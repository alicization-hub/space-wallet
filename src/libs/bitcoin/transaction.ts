import { hexToBytes } from "@noble/hashes/utils.js"
import { HDKey } from "@scure/bip32"
import { Transaction, utils } from "@scure/btc-signer"

import { MAX_FEE_SATS } from "./constants"
import { createPrivateKey } from "./scure"
import { bitcoinToSats, calcEstimator } from "./unit"

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
  inputs: Transaction.PrepareInput<"server">[],
  outputs: Transaction.PrepareOutput[]
): Promise<Transaction> {
  // Validate inputs
  if (!inputs.length) throw new Error("No inputs provided")
  if (!outputs.length) throw new Error("No outputs provided")
  if (feeRate <= 0) throw new Error("Invalid fee rate")
  if (outputs.filter((o) => o.isChange).length > 1)
    throw new Error("Change address is not unique")

  // Calculate the estimated transaction details
  const { changeAmount, isDust, isInsufficientFee } = calcEstimator(
    feeRate,
    inputs,
    outputs
  )

  // Validate the transaction
  if (isInsufficientFee) {
    throw new Error(
      "Insufficient fee. The total amount of the transaction is less than the fee required to relay it on the network."
    )
  }

  // Initialize transaction
  const tx = new Transaction()

  // Add inputs to the transaction
  for (const utxo of inputs) {
    const amount = BigInt(bitcoinToSats(utxo.amount))
    const script = hexToBytes(utxo.scriptPubKey)
    const privateKey = createPrivateKey(rootKey, utxo.derivationPath)

    // Add the UTXO as an input to the transaction
    tx.addInput({
      txid: utxo.txid,
      index: utxo.vout,
      witnessUtxo: { amount, script },
      // BIP-86: the internal key is the untweaked x-only key. The key inside `script` is already
      // tweaked.
      tapInternalKey: utxo.type === "tr" ? utils.pubSchnorr(privateKey) : undefined
    })

    privateKey.fill(0)
  }

  // Add outputs to the transaction
  for (const output of outputs) {
    if (output.isRecipient) {
      tx.addOutputAddress(output.address, BigInt(bitcoinToSats(output.amount)))
    } else if (output.isChange) {
      // If changeAmount is too small, treat as additional fee (dust threshold ~546)
      if (!isDust) tx.addOutputAddress(output.address, BigInt(changeAmount))
    }
  }

  // Sign the input with the corresponding private key
  for (let index = 0; index < inputs.length; index++) {
    const utxo = inputs[index]
    const privateKey = createPrivateKey(rootKey, utxo.derivationPath)

    tx.signIdx(privateKey, index)
    privateKey.fill(0)
  }

  // Finalize the transaction and compute its txid and hash
  tx.finalize()

  // The last check on the real transaction, before anyone can broadcast it
  if (tx.fee > BigInt(MAX_FEE_SATS)) {
    throw new Error(
      `The transaction fee (${tx.fee} sats) exceeds the safety limit of ${MAX_FEE_SATS} sats.`
    )
  }

  return tx
}
