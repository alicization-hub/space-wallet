/**
 * Plain values, kept apart from `scure.ts` so client components can use them (through `unit.ts`)
 * without pulling the key-derivation libraries into the browser bundle.
 */

/**
 * How long a page or the sync waits for the node, in milliseconds. Server Actions run one at a time,
 * so a sync stuck on a node that hung would hold up everything behind it.
 */
export const READ_TIMEOUT = 10_000

/**
 * How far the node must have verified the chain before its coins and balances can be believed.
 */
export const SYNCED_PROGRESS = 0.97

/**
 * The amount of satoshis in one BTC.
 */
export const COIN = 100_000_000

/**
 * The maximum number of consecutive unused addresses to generate.
 * `range(0, GAP_LIMIT)`
 */
export const GAP_LIMIT = 23

/**
 * The minimum amount of satoshis that is considered a dust output.
 * Below this threshold, the transaction will not be relayed by the network.
 */
export const DUST_THRESHOLD = 546

/**
 * Highest fee rate a transaction may ask for, in sat/vB. It's far above what the node estimates, so
 * it only stops a bad value from burning funds.
 */
export const MAX_FEE_RATE = 500

/**
 * Highest total fee a signed transaction may pay, in satoshis (0.01 BTC). Checked after signing.
 */
export const MAX_FEE_SATS = 1_000_000

/**
 * Most UTXOs a single transaction may spend.
 */
export const MAX_INPUTS = 500
