import { decode, sign, verify, type SignOptions } from 'jsonwebtoken'

import { ENV, JWT } from '@/constants/env'

export class jwt {
  static async sign(payload: any, options?: SignOptions) {
    return new Promise<{ token: string; error: Error | null }>((resolve) => {
      sign(
        payload,
        JWT.secret,
        {
          algorithm: 'HS512',
          issuer: ENV.APP_NAME,
          expiresIn: JWT.ttl as any,
          ...options
        },
        (error, token) => {
          resolve({ token, error } as any)
        }
      )
    })
  }

  static verify<T = JwtPayload>(token: string) {
    return new Promise<{ payload: T; error: Error | null }>((resolve) => {
      verify(
        token,
        JWT.secret,
        {
          algorithms: ['HS512'],
          issuer: ENV.APP_NAME
        },
        (error, payload) => {
          resolve({ payload, error } as any)
        }
      )
    })
  }
}
