import { differenceInMilliseconds, format } from 'date-fns'
import { customAlphabet } from 'nanoid'

import { blockExplorerUrl } from '@/constants'

export const nanoId = customAlphabet('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789')

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
      pathTo = `/addresses/btc/${value}`
      break

    case 'tx':
      pathTo = `/transactions/btc/${value}`
      break
  }

  if (pathTo) {
    window.open(`${blockExplorerUrl}${pathTo}`, '_blank', 'noopener,noreferrer')
  }
}
