import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: [],
  typedRoutes: false,
};

export default nextConfig;
