import { customAlphabet } from 'nanoid'

import { blockExplorerUrl } from '@/constants'

export const nanoId = customAlphabet('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789')

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
