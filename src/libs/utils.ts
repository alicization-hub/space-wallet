import { clsx, type ClassValue } from 'clsx'
import { differenceInMilliseconds, format } from 'date-fns'
import { customAlphabet } from 'nanoid'
import { twMerge } from 'tailwind-merge'

export const nanoId = customAlphabet('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789')

export function cls(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isEqual(value: any, input?: any) {
  return !!input && input === value
}

export function isNotEqual(value: any, input?: any) {
  return !!input && input !== value
}

export function randomIntNetween(min: number, max: number) {
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

export function logger(message: string, ts?: number) {
  const arr = [
    `\x1b[32m[Scheduler]\x1b[0m`,
    `-`,
    `\x1b[37m${format(Date.now(), 'PPpp')}\x1b[0m`,
    ` `,
    `${message}\x1b[0m`
  ]

  if (ts) {
    const seconds = differenceInMilliseconds(Date.now(), ts) / 1e3
    arr.push(`~`, `\x1b[35m${seconds}s\x1b[0m`)
  }

  console.log(...arr)
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

export function toShort(value: string): string {
  return `${value.slice(0, 4)}...${value.slice(-4)}`
}

/**
 * Convert long number into abbreviated string.
 *
 * @param {number} input
 * @param {number} fractionDigits Number of digits after the decimal point. Must be in the range 0 - 20, inclusive.
 */
export function abbreviateNumber(input: number, fractionDigits: number = 1) {
  const tier = (Math.log10(Math.abs(input)) / 3) | 0

  if (tier === 0) return input.toLocaleString()

  const suffix = ['', 'k', 'M', 'B', 'T', 'P', 'E'][tier]
  const scale = Math.pow(10, tier * 3)

  return (input / scale).toFixed(fractionDigits) + suffix
}

/**
 * The function creates a pagination object based on the provided data, count, page, and take parameters.
 *
 * @param {T[]} data - An array of items to be paginated.
 * @param {number} count - The `count` parameter represents the total number of items in the dataset.
 * @param {number} page - The `page` parameter in the `createPagination` function represents the current page number of the paginated data. It is used to determine the current page, as well as calculate the next and previous pages based on the total count of items and the specified `take` value.
 * @param {number} take - The `take` parameter in the `createPagination` function represents the number of items to display per page. It determines how many items from the `data` array should be included in each page of the pagination.
 * @returns The `createPagination` function returns an object of type `Pagination<T>`, which includes the following properties:
 * - `data`: an array of data items
 * - `count`: the total count of data items
 * - `currentPage`: the current page number
 * - `nextPage`: the next page number, or `null` if there is no next page
 * - `prevPage`: the previous page number, or `null` if there is no previous page
 * - `lastPage`: the last page number
 */
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
