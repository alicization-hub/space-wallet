'use server'

import { cacheLife, cacheTag } from 'next/cache'

import { withAuth } from './guard'

async function findAddress(accountId: string) {
  'use cache'
  cacheTag('address')
  cacheLife('seconds')

  return [0]
}

export const findAddr = withAuth(async (auth, accountId: string) => {
  return findAddress(accountId)
})
