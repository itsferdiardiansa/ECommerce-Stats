import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@rufieltics/api-client', '@rufieltics/core'],
}

export default nextConfig
