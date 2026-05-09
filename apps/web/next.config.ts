import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@loopin/core', '@loopin/shared'],
};

export default nextConfig;
