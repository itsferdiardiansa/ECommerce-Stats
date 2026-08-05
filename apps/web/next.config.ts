// import type { NextConfig } from 'next'
import { withNx } from '@nx/next/plugins/with-nx'

const baseConfig = {
  reactCompiler: true,
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  webpack(config: { module: { rules: unknown[] } }) {
    config.module.rules.push({
      test: /\.svg$/i,
      use: ['@svgr/webpack'],
    })
    return config
  },
}

const configWithPlugins = baseConfig

const nextConfig = configWithPlugins
export default withNx(nextConfig)
