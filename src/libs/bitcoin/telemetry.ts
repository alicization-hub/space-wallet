import { COIN } from "./constants"

/**
 * Blocks between two difficulty adjustments.
 */
const RETARGET_INTERVAL = 2016

/**
 * The block time the difficulty aims for, in seconds.
 */
const TARGET_BLOCK_TIME = 600

/**
 * The most one adjustment can change the difficulty by, either way.
 */
const MAX_RETARGET_FACTOR = 4

/**
 * Weight units in one virtual byte.
 */
const WITNESS_SCALE_FACTOR = 4

/**
 * The fee rates the congestion chart splits the mempool into, in sat/vB.
 */
const FEE_BANDS = [
  { label: "<10 sat", below: 10 },
  { label: "10-25 sat", below: 25 },
  { label: "25-50 sat", below: 50 },
  { label: ">50 sat", below: Infinity }
]

/**
 * Converts the fee rate the node reports to the unit people quote.
 *
 * @param feeRate - Fee rate in BTC/kvB
 * @returns Fee rate in sat/vB
 */
export function toSatsPerVByte(feeRate: number) {
  return (feeRate * COIN) / 1000
}

/**
 * The height of the first block of the current difficulty period.
 *
 * @param height - The chain's height
 */
export function readEpochStart(height: number) {
  return height - (height % RETARGET_INTERVAL)
}

/**
 * Estimates the next difficulty adjustment from how fast this period's blocks have come so far, with
 * the limit consensus puts on it.
 *
 * @param chain - The chain's state
 * @param epochStartTime - The time of the period's first block, or null if it couldn't be read
 * @returns Blocks left, with the change and the new difficulty if there's enough to estimate them
 * from. Null on regtest, which never adjusts.
 */
export function estimateRetarget(
  chain: Pick<Blockchain.Info, "chain" | "blocks" | "difficulty" | "time">,
  epochStartTime: number | null
) {
  if (chain.chain === "regtest") return null

  const elapsedBlocks = chain.blocks % RETARGET_INTERVAL
  const blocksLeft = RETARGET_INTERVAL - elapsedBlocks
  const elapsedTime = epochStartTime === null ? 0 : chain.time - epochStartTime

  // Block times aren't strictly ordered, and a new period has no blocks to measure yet
  if (elapsedBlocks === 0 || !(elapsedTime > 0)) {
    return { blocksLeft, change: null, nextDifficulty: null }
  }

  const factor = Math.min(
    Math.max((elapsedBlocks * TARGET_BLOCK_TIME) / elapsedTime, 1 / MAX_RETARGET_FACTOR),
    MAX_RETARGET_FACTOR
  )

  return {
    blocksLeft,
    change: factor - 1,
    nextDifficulty: chain.difficulty * factor
  }
}

/**
 * Splits the mempool into fee bands. Every chunk has one fee rate, so each falls in a single band.
 *
 * @param diagram - The answer of `getmempoolfeeratediagram`
 * @returns The bands, lowest fee rate first, with the virtual bytes in each
 */
export function sumFeeBands(diagram: Mempool.FeeratePoint[]) {
  const bands = FEE_BANDS.map(({ label }) => ({ label, vBytes: 0 }))

  diagram.slice(1).forEach((point, index) => {
    const previous = diagram[index]
    const vBytes = (point.weight - previous.weight) / WITNESS_SCALE_FACTOR
    if (vBytes <= 0) return

    const feeRate = ((point.fee - previous.fee) * COIN) / vBytes
    bands[FEE_BANDS.findIndex(({ below }) => feeRate < below)].vBytes += vBytes
  })

  return bands
}
