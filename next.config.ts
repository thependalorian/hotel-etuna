import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Always resolve from hotel-etuna (not parent monorepo / home git root). */
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

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
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
      },
    ],
  },

  // Production Optimizations
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  turbopack: {
    root: projectRoot,
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

  // Webpack
  webpack: (config, { webpack }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
    };

    // Prevent Node-only DB drivers from being bundled into client components
    config.plugins = [
      ...(config.plugins ?? []),
      new webpack.IgnorePlugin({
        resourceRegExp: /^(pg|pg-connection-string|@neondatabase\/serverless)$/,
        contextRegExp: /^$/,
      }),
    ];

    return config;
  },

  // Output Configuration
  output: 'standalone',
};

export default nextConfig;
