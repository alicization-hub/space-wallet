import { formatISO } from 'date-fns'
import { NextRequest, NextResponse } from 'next/server'
import { v7 as uuidV7 } from 'uuid'

import { APP_TOKEN } from '@/constants'

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
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (pathname === '/') {
    const hasJWT = req.cookies.has(APP_TOKEN)
    const uuid = uuidV7()
    if (hasJWT) {
      return NextResponse.redirect(new URL(`/${uuid}`, req.url))
    } else {
      return NextResponse.redirect(new URL(`/main?uuid=${uuid}&ts=${formatISO(Date.now())}`, req.url))
    }
  }

  return NextResponse.next()
}
