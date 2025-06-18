'use server'

import 'server-only'

import { headers } from 'next/headers'

import { jwt } from './index'

export async function useAuthGuard() {
  const headerStore = await headers()
  const bearerToken = headerStore.get('Authorization')
  if (bearerToken) {
    const token = bearerToken.replace(/^(B|b)earer/g, '').trim()
    const { payload, error } = await jwt.verify(token)
    if (payload) {
      return payload
    }
  }

  throw new Error('Unauthorized (401)')
}

export async function useProtector() {}
