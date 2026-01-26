// import type { NextConfig } from 'next'
import { withNx } from '@nx/next/plugins/with-nx'

const baseConfig = {
  reactCompiler: true,
}

const configWithPlugins = baseConfig

const nextConfig = configWithPlugins
export default withNx(nextConfig)
