import { formatPercent, numberToSpace } from "@/libs/utils"

/**
 * What a cell shows when the node couldn't give its value.
 */
export const NO_VALUE = "—"

export function formatInteger(value: number) {
  return numberToSpace(String(value))
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
