import { addYears, isAfter } from 'date-fns'
import { cacheLife, cacheTag } from 'next/cache'
import { NIL, v5 as uuidV5 } from 'uuid'

import { CIPHER } from '@/constants/env'
import { cipher } from '@/libs/cipher'

export async function generateToken(walletId: string, accountId: string) {
  const expiredAt = addYears(new Date(), 1)
  const payload: AccessToken = `space:${walletId}:${accountId}:${expiredAt.getTime()}`
  return cipher.symmetricEncrypt(CIPHER.secret, payload)
}

export async function validateToken(token: string) {
  'use cache'
  cacheTag('auth-token', uuidV5(token, NIL))
  cacheLife('minutes')

  const decrypted = await cipher.symmetricDecrypt(CIPHER.secret, token)
  const [_, walletId, accountId, exp] = (decrypted as AccessToken).split(':')

  if (isAfter(new Date(), new Date(Number(exp)))) {
    throw new Error('401 Token Expired')
  }

  return { walletId, accountId }
}
