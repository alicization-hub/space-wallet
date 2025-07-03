import { sign, verify, type SignOptions } from 'jsonwebtoken'

import { JWT } from '@/constants/env'

export class jwt {
  static sign(payload: any, options?: SignOptions) {
    try {
      return sign(payload, JWT.secret, {
        algorithm: 'HS512',
        issuer: JWT.issuer,
        expiresIn: JWT.ttl as any,
        ...options
      })
    } catch (error) {
      throw error
    }
  }

  static verify<T = JwtPayload>(token: string): T {
    try {
      const result = verify(token, JWT.secret, {
        complete: true,
        algorithms: ['HS512'],
        issuer: JWT.issuer
      })

      return result.payload as T
    } catch (error) {
      throw error
    }
  }
}
