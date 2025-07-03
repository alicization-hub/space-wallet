'use server'

import 'server-only'

import { cookies } from 'next/headers'

import { APP_TOKEN } from '@/constants'

import { jwt } from './index'

export async function useAuthorized() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(APP_TOKEN)

    if (!token?.value) {
      throw new Error('401 Unauthorized')
    }

    const payload = jwt.verify(token.value)
    return {
      ...payload,
      token: token.value
    }
  } catch (error: any) {
    throw new Error(error.message || '401 Unauthorized')
  }
}
