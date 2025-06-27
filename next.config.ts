import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true
  },

  experimental: {
    serverActions: {
      bodySizeLimit: '2mb'
    }
  },

  httpAgentOptions: {
    keepAlive: false
  },

  logging: {
    fetches: {
      fullUrl: false,
      hmrRefreshes: false
    }
  },

  poweredByHeader: false,
  productionBrowserSourceMaps: false,

  async rewrites() {
    return [
      {
        source: '/v0/:path*',
        destination: '/services/:path*'
      }
    ]
  }
}

export default nextConfig
