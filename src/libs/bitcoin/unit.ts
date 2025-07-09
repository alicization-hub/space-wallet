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
 * Infers the type of UTXO given an address.
 *
 * @param address - Address of the UTXO
 * @returns The type of the UTXO
 */
export function inferUTXOType(address: string): UTXO.Type {
  // Legacy P2PKH addresses start with "1"
  // P2SH-P2WPKH addresses start with "3"
  // Bech32 P2WPKH addresses start with "bc1q"
  // Bech32 P2TR addresses start with "bc1p"
  if (address.startsWith('bc1q')) return 'p2wpkh'
  if (address.startsWith('bc1p')) return 'p2tr'

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
 * @param outputs - Array of output addresses
 * @returns Estimated total virtual bytes
 */
export function estimateVirtualBytes(inputs: UTXO.Selected[], outputs: string[]): number {
  // Calculate the total virtual bytes for the inputs
  const inputVBytes = inputs.reduce((acc, { address }) => {
    // P2WPKH inputs have a virtual byte size of 68
    // P2TR inputs have a virtual byte size of 57
    const vBytes = inferUTXOType(address) === 'p2wpkh' ? 68 : 57
    return acc + vBytes
  }, 0)

  // Calculate the total virtual bytes for the outputs
  const outputVBytes = outputs.reduce((acc, address) => {
    // P2WPKH outputs have a virtual byte size of 31
    // P2TR outputs have a virtual byte size of 43
    const vBytes = inferUTXOType(address) === 'p2wpkh' ? 31 : 43
    return acc + vBytes
  }, 0)

  // The base size of a transaction is 10 vBytes
  // 4 bytes = version
  // 1 byte = varint input count (if < 252)
  // 1 byte = varint output count (if < 252)
  // 4 bytes = locktime
  return 10 + inputVBytes + outputVBytes
}
