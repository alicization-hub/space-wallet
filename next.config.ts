import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  cacheComponents: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb'
    }
  },

  httpAgentOptions: {
    keepAlive: false
  },

  images: {
    qualities: [100]
  },

  logging: {
    fetches: {
      fullUrl: false,
      hmrRefreshes: false
    },
    incomingRequests: false
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
