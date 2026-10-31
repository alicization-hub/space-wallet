import { formatPercent, numberToSpace } from "@/libs/utils"

const BYTE_UNITS = ["B", "KB", "MB", "GB", "TB", "PB"]
const HASHRATE_UNITS = ["H/s", "kH/s", "MH/s", "GH/s", "TH/s", "PH/s", "EH/s", "ZH/s"]
const DIFFICULTY_UNITS = ["", "K", "M", "G", "T", "P"]

/**
 * What a cell shows when the node couldn't give its value.
 */
export const NO_VALUE = "—"

/**
 * Scales a value to its unit in steps of a thousand. Regtest's difficulty is far below one, so
 * anything below one stays in the first unit.
 */
function scale(value: number, units: string[]) {
  const tier =
    value >= 1 ? Math.min(Math.floor(Math.log10(value) / 3), units.length - 1) : 0

  return { scaled: value / 1000 ** tier, tier, unit: units[tier] }
}

export function formatInteger(value: number) {
  return numberToSpace(String(value))
}

/**
 * @returns The number and its unit apart, because the cards set them in two sizes
 */
export function formatBytes(bytes: number) {
  const { scaled, tier, unit } = scale(bytes, BYTE_UNITS)
  const fractionDigits = tier < 2 ? 0 : tier < 4 ? 1 : 2

  return { value: scaled.toFixed(fractionDigits), unit }
}

export function formatBytesText(bytes: number) {
  const { value, unit } = formatBytes(bytes)
  return `${value} ${unit}`
}

/**
 * @returns The number and its unit apart, because the cards set them in two sizes
 */
export function formatHashrate(hashes: number) {
  const { scaled, unit } = scale(hashes, HASHRATE_UNITS)
  return { value: scaled.toFixed(1), unit }
}

export function formatDifficulty(difficulty: number) {
  const { scaled, unit } = scale(difficulty, DIFFICULTY_UNITS)
  return `${scaled.toFixed(2)} ${unit}`.trim()
}

/**
 * @example
 * ```ts
 * formatChange(0.014) // "+1.40%"
 * ```
 */
export function formatChange(ratio: number) {
  return `${ratio >= 0 ? "+" : ""}${formatPercent(ratio, 2)}`
}

export function formatFeeRate(satsPerVByte: number) {
  return `${satsPerVByte.toFixed(2)} sat/vB`
}

/**
 * @param timestamp - UNIX time in seconds
 * @returns The date and the time apart, in UTC
 */
export function formatBlockTime(timestamp: number) {
  const [date, time] = new Date(timestamp * 1000).toISOString().split("T")

  return { date, time: time.slice(0, 8) }
}
