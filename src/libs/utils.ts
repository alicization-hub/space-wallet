import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cls(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Creates a URL-friendly name: trims, lowercases, hyphenates, and drops everything else.
 *
 * @example
 * ```ts
 * slugify("  My Cold Wallet! ") // "my-cold-wallet"
 * ```
 */
export function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function randomIntBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min)
}

export function numberToSpace(value: string, i?: number) {
  switch (i) {
    case 4:
      return value.replace(/\s/g, "").replace(/(\d)(?=(\d{4})+$)/g, "$1 ")

    default:
      return value.replace(/\s/g, "").replace(/(\d)(?=(\d{3})+$)/g, "$1 ")
  }
}

export function formatPercent(ratio: number, fractionDigits: number = 1) {
  return `${(ratio * 100).toFixed(fractionDigits)}%`
}

/**
 * Starts from the largest unit that isn't zero.
 *
 * @example
 * ```ts
 * formatUptime(180) // "3m"
 * formatUptime(64_980) // "18h 3m"
 * formatUptime(237_780) // "2d 18h 3m"
 * ```
 */
export function formatUptime(seconds: number) {
  const days = Math.floor(seconds / 86_400)
  const hours = Math.floor((seconds % 86_400) / 3_600)
  const minutes = Math.floor((seconds % 3_600) / 60)

  if (days > 0) return `${days}d ${hours}h ${minutes}m`
  if (hours > 0) return `${hours}h ${minutes}m`

  return `${minutes}m`
}

const BYTE_UNITS = ["B", "KB", "MB", "GB", "TB", "PB"]
const HASHRATE_UNITS = ["H/s", "kH/s", "MH/s", "GH/s", "TH/s", "PH/s", "EH/s", "ZH/s"]
const DIFFICULTY_UNITS = ["", "K", "M", "G", "T", "P"]

/**
 * Scales a value to its unit in steps of a thousand. Regtest's difficulty is far below one, so
 * anything below one stays in the first unit.
 */
function scaleByThousand(value: number, units: string[]) {
  const tier =
    value >= 1 ? Math.min(Math.floor(Math.log10(value) / 3), units.length - 1) : 0

  return { scaled: value / 1000 ** tier, tier, unit: units[tier] }
}

/**
 * @returns The number and its unit apart, because the dashboard's cards set them in two sizes
 */
export function formatBytes(bytes: number) {
  const { scaled, tier, unit } = scaleByThousand(bytes, BYTE_UNITS)
  const fractionDigits = tier < 2 ? 0 : tier < 4 ? 1 : 2

  return { value: scaled.toFixed(fractionDigits), unit }
}

export function formatBytesText(bytes: number) {
  const { value, unit } = formatBytes(bytes)
  return `${value} ${unit}`
}

/**
 * @returns The number and its unit apart, because the dashboard's cards set them in two sizes
 */
export function formatHashrate(hashes: number) {
  const { scaled, unit } = scaleByThousand(hashes, HASHRATE_UNITS)
  return { value: scaled.toFixed(1), unit }
}

export function formatDifficulty(difficulty: number) {
  const { scaled, unit } = scaleByThousand(difficulty, DIFFICULTY_UNITS)
  return `${scaled.toFixed(2)} ${unit}`.trim()
}

export function toExplorer(type: "addr" | "tx", value: string) {
  let pathTo = ""

  switch (type) {
    case "addr":
      pathTo = `addresses/btc/${value}`
      break

    case "tx":
      pathTo = `transactions/btc/${value}`
      break
  }

  if (pathTo) {
    return `https://www.blockchain.com/explorer/${pathTo}`
  }
}

export function toShort(value: string, start: number = 4, end: number = -6) {
  return `${value.slice(0, start)}...${value.slice(end)}`
}

export function abbreviateNumber(input: number, fractionDigits: number = 1) {
  const tier = (Math.log10(Math.abs(input)) / 3) | 0

  if (tier === 0) return input.toLocaleString()

  const suffix = ["", "k", "M", "B", "T", "P", "E"][tier]
  const scale = Math.pow(10, tier * 3)

  return (input / scale).toFixed(fractionDigits) + suffix
}
