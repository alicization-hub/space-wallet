'use server'

import { cacheLife, cacheTag } from 'next/cache'

export async function getFee() {
  'use cache'
  cacheTag('recommended-fees')
  cacheLife('hours')

  const res = await fetch('https://mempool.space/api/v1/fees/recommended')
  const data = await res.json()

  return [
    {
      label: 'highest',
      duration: '~10 minutes',
      value: Math.min(Math.max(data.fastestFee, 10), 50)
    },
    {
      label: 'medium',
      duration: '~30 minutes',
      value: Math.min(Math.max(data.hourFee, 5), 20)
    },
    {
      label: 'economy',
      duration: '~50 minutes',
      value: Math.min(Math.max(data.economyFee, 2), 10)
    },
    {
      label: 'lowest',
      duration: '~1 hour',
      value: Math.min(Math.max(data.minimumFee, 1), 5)
    }
  ]
}
