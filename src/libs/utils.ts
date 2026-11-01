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
