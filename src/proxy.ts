import { isAfter } from 'date-fns'
import { NextRequest, NextResponse } from 'next/server'
import { v7 as uuidV7 } from 'uuid'

import { APP_TOKEN } from '@/constants'

import { CIPHER } from './constants/env'
import { cipher } from './libs/cipher'

/**
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/middleware#matcher
 */
export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - /static (static files)
     * - /_next/static (Next.js static files)
     * - /_next/image (Next.js image optimization)
     * - Files with extensions
     */
    '/((?!static|_next/static|_next/image|.*\\.(?:ico|png|webp|gif|avif|json|webmanifest|txt)$).*)'
  ]
}

/**
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/middleware
 */
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (pathname === '/') {
    const token = req.cookies.get(APP_TOKEN)
    if (token?.value) {
      const decrypted = await cipher.symmetricDecrypt(CIPHER.secret, token.value)
      const [_, __, accountId, exp] = (decrypted as AccessToken).split(':')

      if (isAfter(new Date(), new Date(Number(exp)))) {
        throw new Error('401 Token Expired')
      }

      return NextResponse.redirect(new URL(`/${accountId}`, req.url))
    } else {
      const uuid = uuidV7()
      const timestamp = new Date().getTime()

      return NextResponse.redirect(new URL(`/index?uuid=${uuid}&ts=${timestamp}`, req.url))
    }
  }

  return NextResponse.next()
}
