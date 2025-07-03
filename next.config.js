/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ignore ESLint errors during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Production optimizations are enabled by default in Next.js 15
  
  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://orc-backend.railway.app/api/v1',
  },
  
  // Image optimization for Vercel
  images: {
    domains: ['localhost', 'orc-backend-production.up.railway.app'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Disable x-powered-by header for security
  poweredByHeader: false,
  
  // Enable experimental features for better performance
  experimental: {
    // Enable modern bundling
    esmExternals: true,
  },
  
  // Webpack configuration
  webpack: (config, { isServer }) => {
    // Optimize bundle size
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    return config;
  },
  
  // Headers for security and performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;