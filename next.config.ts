import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true
  },

  experimental: {
    serverActions: {
      bodySizeLimit: '4mb'
    }
  },

  httpAgentOptions: {
    keepAlive: false
  },

  logging: {
    fetches: {
      fullUrl: true
    }
  },

  poweredByHeader: true,
  productionBrowserSourceMaps: false
}

export default nextConfig
