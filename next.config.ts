import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    // Public REST contract: /api/v1/* maps to existing route handlers under /api/*
    const apiPrefix = (process.env.NEXT_PUBLIC_API_PREFIX || '/api/v1').replace(/\/$/, '');
    return [
      {
        source: `${apiPrefix}/:path*`,
        destination: '/api/:path*',
      },
    ];
  },

  // Image Optimization
  images: {
    qualities: [75, 85, 90],
    formats: ['image/avif', 'image/webp'],
    unoptimized: process.env.NODE_ENV === 'development',
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.vercel.app',
      },
      {
        protocol: 'https',
        hostname: '**.vercel-storage.com',
      },
    ],
  },

  // Production Optimizations
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  turbopack: {
    root: process.cwd(),
  },

  // Environment Variables
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    NEXT_PUBLIC_ENVIRONMENT: process.env.NEXT_PUBLIC_ENVIRONMENT || 'development',
    NEXT_PUBLIC_API_PREFIX: process.env.NEXT_PUBLIC_API_PREFIX || '/api/v1',
  },

  // Experimental Features
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-dialog', '@radix-ui/react-select'],
  },

  // TypeScript
  typescript: {
    ignoreBuildErrors: false,
  },

  // Output Configuration
  output: 'standalone',
};

export default nextConfig;
