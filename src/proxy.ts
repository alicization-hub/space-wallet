import { NextResponse, type NextRequest } from "next/server"

/**
 * The only names the wallet answers to. The server already listens on the loopback only, so this is
 * for what can still reach it there: a tunnel, a port forward, or a browser tricked by DNS
 * rebinding.
 */
const ALLOWED_HOSTNAMES = ["localhost", "127.0.0.1"]

function isAllowedHost(host: string) {
  return ALLOWED_HOSTNAMES.includes(host.replace(/:\d+$/, "").toLowerCase())
}

/**
 * There's no session for a browser to hold back from another site, so this is what keeps other sites
 * out of the Server Actions: anything that isn't a plain read has to come from this app's own pages.
 * Next.js checks `Origin` too, but lets a request through when it's missing or `null`, and a sandboxed
 * iframe sends `null`.
 */
function isFromThisApp(origin: string | null, host: string) {
  return origin !== null && URL.canParse(origin) && new URL(origin).host === host
}

/**
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/proxy#matcher
 */
export const config = {
  matcher: [
    /*
     * Match all paths except static files. Nothing is skipped by its file extension: one path segment
     * is enough to reach a page, and with it a Server Action, so `/anything.json` would get past the
     * checks below.
     */
    "/((?!_next/static/|_next/image|static/).*)"
  ]
}

/**
 * Refuses any host but this machine and any write from outside this app, and sets the per-request
 * Content-Security-Policy. Next.js reads the nonce from the request header and adds it to its own
 * scripts.
 *
 * `style-src` keeps `'unsafe-inline'` without a nonce, because a nonce would make browsers ignore
 * it and block the `style` attributes that React and framer-motion render.
 *
 * @see https://nextjs.org/docs/app/guides/content-security-policy
 */
export function proxy(req: NextRequest) {
  const host = req.headers.get("host") ?? ""
  const forwardedHost = req.headers.get("x-forwarded-host") ?? host

  if (!isAllowedHost(host) || !isAllowedHost(forwardedHost)) {
    return new NextResponse("Misdirected Request", { status: 421 })
  }

  if (
    !["GET", "HEAD"].includes(req.method) &&
    !isFromThisApp(req.headers.get("origin"), host)
  ) {
    return new NextResponse("Forbidden", { status: 403 })
  }

  const nonce = crypto.randomUUID().replaceAll("-", "")
  const isDevelopment = process.env.NODE_ENV === "development"

  const policy = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDevelopment ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    `connect-src 'self'${isDevelopment ? " ws: wss:" : ""}`,
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join("; ")

  const requestHeaders = new Headers(req.headers)
  requestHeaders.set("Content-Security-Policy", policy)
  requestHeaders.set("x-nonce", nonce)

  const response = NextResponse.next({ request: { headers: requestHeaders } })
  response.headers.set("Content-Security-Policy", policy)

  return response
}
