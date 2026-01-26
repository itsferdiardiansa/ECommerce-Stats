import type { NextConfig } from 'next';

const baseConfig: NextConfig = {
  images: {
    remotePatterns: []
  },
  serverExternalPackages: ['@rufieltics/db']
};

const configWithPlugins = baseConfig;

const nextConfig = configWithPlugins;
export default nextConfig;
