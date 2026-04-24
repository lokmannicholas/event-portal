import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: [],
  experimental: {
    typedRoutes: false,
  },
};

export default nextConfig;
