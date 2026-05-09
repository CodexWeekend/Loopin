import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        hostname: 'images.unsplash.com',
        protocol: 'https',
      },
      {
        hostname: 'api.dicebear.com',
        protocol: 'https',
      },
    ],
  },
  transpilePackages: ['@loopin/core', '@loopin/shared'],
};

export default nextConfig;
