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
