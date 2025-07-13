import { clsx, type ClassValue } from 'clsx'
import { customAlphabet } from 'nanoid'
import { twMerge } from 'tailwind-merge'

export { addToast as toast } from '@heroui/toast'
export const nanoId = customAlphabet('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789')

export function cls(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function randomIntBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min)
}

export function numberToSpace(value: string, i?: number) {
  switch (i) {
    case 4:
      return value.replace(/\s/g, '').replace(/(\d)(?=(\d{4})+$)/g, '$1 ')

    default:
      return value.replace(/\s/g, '').replace(/(\d)(?=(\d{3})+$)/g, '$1 ')
  }
}

export function toExplorer(type: 'addr' | 'tx', value: string) {
  let pathTo = ''

  switch (type) {
    case 'addr':
      pathTo = `addresses/btc/${value}`
      break

    case 'tx':
      pathTo = `transactions/btc/${value}`
      break
  }

  if (pathTo) {
    return `https://www.blockchain.com/explorer/${pathTo}`
    // window.open(`https://www.blockchain.com/explorer/${pathTo}`, '_blank', 'noopener,noreferrer')
  }
}

export function toShort(value: string, start: number = 4, end: number = -6) {
  return `${value.slice(0, start)}...${value.slice(end)}`
}

export function abbreviateNumber(input: number, fractionDigits: number = 1) {
  const tier = (Math.log10(Math.abs(input)) / 3) | 0

  if (tier === 0) return input.toLocaleString()

  const suffix = ['', 'k', 'M', 'B', 'T', 'P', 'E'][tier]
  const scale = Math.pow(10, tier * 3)

  return (input / scale).toFixed(fractionDigits) + suffix
}

export function createPagination<T = any>(
  data: T[],
  count: number,
  page: number,
  take: number
): IPagination<T> {
  const lastPage = Math.ceil(count / take) || 1

  return {
    data,
    count,
    currentPage: page,
    nextPage: page + 1 > lastPage ? null : page + 1,
    prevPage: page - 1 < 1 ? null : page - 1,
    lastPage
  }
}
