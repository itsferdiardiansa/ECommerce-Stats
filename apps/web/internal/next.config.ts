import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@rufieltics/api-client', '@rufieltics/core-client'],
}

export default nextConfig
