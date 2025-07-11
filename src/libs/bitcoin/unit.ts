import { extend } from 'node_modules/zod/v4/core/util.cjs'

import { COIN } from './scure'

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
 * Calculates the estimated total virtual bytes of a transaction,
 * total amount of all inputs, total fee, and change amount.
 *
 * @param amount - The amount of the transaction in satoshis
 * @param feeRate - The fee rate in satoshis per virtual byte
 * @param inputs - Array of UTXO inputs
 * @param outputs - Array of outputs
 * @returns An object with the following properties:
 *   - `total`: The total amount of all inputs in satoshis
 *   - `vBytes`: The estimated total virtual bytes of the transaction
 *   - `fee`: The estimated total fee in satoshis
 *   - `changeAmount`: The amount of change in satoshis
 */
export function calcEstimator<T extends string>(
  amount: number,
  feeRate: number,
  inputs: Transaction.PrepareInput<T>[],
  outputs: Transaction.PrepareOutput[]
) {
  // Calculate the total amount of all inputs
  const total = inputs.reduce((acc, utxo) => acc + bitcoinToSats(utxo.amount), 0)

  // Calculate the estimated total virtual bytes of the transaction
  const vBytes = estimateVBytes(inputs, outputs)

  // Calculate the estimated total fee in satoshis
  const fee = Math.ceil(vBytes * feeRate)

  // Calculate the change amount in satoshis
  const changeAmount = total - amount - fee

  // Return the results
  return {
    total,
    vBytes,
    fee,
    changeAmount
  }
}
