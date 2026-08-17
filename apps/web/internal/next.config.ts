import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@rufieltics/api-client', '@rufieltics/query'],
}

export default nextConfig
