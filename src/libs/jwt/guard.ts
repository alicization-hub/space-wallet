'use server'

import 'server-only'

import { cookies, headers } from 'next/headers'

import { APP_TOKEN } from '@/constants'

import { jwt } from './index'

export async function useAuthGuard() {
  const cookieStore = await cookies()
  const token = cookieStore.get(APP_TOKEN)
  if (token?.value) {
    const { payload, error } = await jwt.verify(token.value)
    if (payload) {
      return {
        ...payload,
        token: token.value
      }
    }
  }

  throw new Error('401 Unauthorized')
}
