import { filter, reduce, remove } from 'ramda'

import { COIN, DUST_THRESHOLD } from './scure'

/**
 * Converts Bitcoin to Satoshis
 *
 * @param bitcoin - Amount in Bitcoin (BTC)
 * @returns Amount in Satoshis
 */
export function bitcoinToSats(bitcoin: number): number {
  if (bitcoin < 0) {
    throw new Error('Bitcoin amount cannot be negative.')
  }

  return Math.round(bitcoin * COIN)
}

/**
 * Converts Satoshis to Bitcoin
 *
 * @param satoshis - Amount in Satoshis
 * @returns Amount in Bitcoin (BTC)
 */
export function satsToBitcoin(satoshis: number): number {
  if (satoshis < 0) {
    throw new Error('Satoshis amount cannot be negative.')
  }

  if (!Number.isInteger(satoshis)) {
    throw new Error('Satoshis must be a whole number.')
  }

  return satoshis / COIN
}

/**
 * Infers the type of an address.
 *
 * @param address - Address
 */
export function inferType(address: string): Transaction.PrepareInput<'server'>['type'] {
  // Bech32 P2WPKH addresses start with "bc1q"
  if (address.startsWith('bc1q')) return 'wpkh'

  // Bech32 P2TR addresses start with "bc1p"
  if (address.startsWith('bc1p')) return 'tr'

  throw new Error(`Unsupported address type: ${address}`)
}

/**
 * Estimates the total virtual bytes of a transaction.
 *
 * ```bash
 * P2WPKH input ~68 vBytes (signature + pubkey)
 * P2TR input ~57 vBytes (Schnorr signature only)
 * P2WPKH output ~31 vBytes (OP_0 + 20-byte hash)
 * P2TR output ~43 vBytes (OP_1 + 32-byte x-only pubkey)
 * ```
 *
 * @param inputs - Array of UTXO inputs
 * @param outputs - Array of outputs
 * @returns Estimated total virtual bytes
 */
export function estimateVBytes<T extends string>(
  inputs: Transaction.PrepareInput<T>[],
  outputs: Transaction.PrepareOutput[]
) {
  // Calculate the total virtual bytes for the inputs
  const inputVBytes = inputs.reduce((acc, { address }) => {
    // P2WPKH inputs have a virtual byte size of 68
    // P2TR inputs have a virtual byte size of 57.5
    const vBytes = inferType(address) === 'wpkh' ? 68 : 57.5
    return acc + vBytes
  }, 0)

  // Calculate the total virtual bytes for the outputs
  const outputVBytes = outputs.reduce((acc, { address }) => {
    // P2WPKH outputs have a virtual byte size of 31
    // P2TR outputs have a virtual byte size of 43
    const vBytes = inferType(address) === 'wpkh' ? 31 : 43
    return acc + vBytes
  }, 0)

  // The base size of a transaction is 10 vBytes
  // 4 bytes = version
  // 1 byte = varint input count (if < 252)
  // 1 byte = varint output count (if < 252)
  // 4 bytes = locktime
  return Math.ceil(10 + inputVBytes + outputVBytes)
}

/**
 * Estimates transaction details including fee, change amount, and checks for dust and insufficient fee.
 *
 * @param feeRate - Fee rate in satoshis per virtual byte
 * @param inputs - Array of UTXO inputs
 * @param outputs - Array of transaction outputs
 */
export function calcEstimator<T extends string>(
  feeRate: number,
  inputs: Transaction.PrepareInput<T>[],
  outputs: Transaction.PrepareOutput[]
) {
  // Calculate the total amount to be sent to recipients
  const totalAmount = reduce((acc, o) => (o.isRecipient ? acc + bitcoinToSats(o.amount) : acc), 0, outputs)

  // Calculate the total input amount available from UTXOs
  const totalInput = reduce((acc, u) => acc + bitcoinToSats(u.amount), 0, inputs)

  // If the remaining balance is less than or equal to the dust threshold, remove change outputs
  if (totalInput - totalAmount <= DUST_THRESHOLD) {
    outputs = filter((o) => !o.isChange, outputs)
  }

  // Calculate the estimated total virtual bytes of the transaction
  const vBytes = estimateVBytes(inputs, outputs)

  // Calculate the estimated total fee in satoshis
  const fee = Math.ceil(vBytes * feeRate)

  // Calculate the change amount in satoshis
  const changeAmount = totalInput - totalAmount - fee

  // Return the results including checks for dust and insufficient fee
  return {
    totalAmount,
    totalInput,
    vBytes,
    fee,
    changeAmount,
    isDust: changeAmount < DUST_THRESHOLD,
    isInsufficientFee: totalInput - totalAmount < fee
  }
}
