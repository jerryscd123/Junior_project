import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    // Enable server components and app directory features
    serverComponentsExternalPackages: ['axios']
  },
  // Allow images from the Laravel backend
  images: {
    domains: ['localhost', 'www.gravatar.com', 'gravatar.com', 'avatars.githubusercontent.com', 'lh3.googleusercontent.com'],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/storage/**'
      },
      {
        protocol: 'https',
        hostname: 'www.gravatar.com',
        pathname: '/avatar/**'
      },
      {
        protocol: 'https',
        hostname: 'gravatar.com',
        pathname: '/avatar/**'
      },
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
        pathname: '/**'
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**'
      }
    ]
  },
  // Custom headers for CORS and security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          }
        ]
      }
    ]
  },
  // Enable webpack optimizations
  webpack: (config, { dev, isServer }) => {
    // Enable source maps in development
    if (dev && !isServer) {
      config.devtool = 'eval-source-map'
    }
    
    return config
  }
};

export default nextConfig;
