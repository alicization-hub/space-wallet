import type { NextConfig } from "next"

/**
 * Sent with every response. The Content-Security-Policy carries a per-request nonce, so it lives in
 * `src/proxy.ts`. There is no HSTS: the app only runs on this machine, and browsers would remember it
 * for every other `http://localhost` project.
 */
const securityHeaders = [
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), geolocation=(), microphone=(), payment=(), usb=()"
  },
  { key: "Referrer-Policy", value: "no-referrer" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" }
]

const nextConfig: NextConfig = {
  agentRules: false,

  cacheComponents: true,

  /**
   * Off because every page renders per request (see `src/app/layout.tsx`): a prerendered App Shell
   * has no CSP nonce for its scripts.
   */
  partialPrefetching: false,

  experimental: {
    serverActions: {
      bodySizeLimit: "256kb"
    }
  },

  httpAgentOptions: {
    keepAlive: false
  },

  /**
   * The app serves a handful of small local images, so it doesn't need the optimizer, whose
   * endpoint has had several remote code execution and SSRF advisories.
   */
  images: {
    unoptimized: true
  },

  logging: {
    fetches: {
      fullUrl: false,
      hmrRefreshes: false
    },
    incomingRequests: false,

    /**
     * In dev, this would print every Server Function's arguments.
     */
    serverFunctions: false
  },

  poweredByHeader: false,
  productionBrowserSourceMaps: false,

  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }]
  }
}

export default nextConfig
