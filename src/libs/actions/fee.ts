'use server'

import { unstable_cache as cache } from 'next/cache'

export const getFee = cache(
  async () => {
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
    ] as Array<{ label: string; duration: string; value: number }>
  },
  undefined,
  {
    revalidate: 120,
    tags: ['recommended-fees']
  }
)
