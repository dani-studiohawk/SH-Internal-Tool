/** @type {import('next').NextConfig} */

const { securityHeaders, developmentHeaders } = require('./lib/security-headers');

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Security headers
  async headers() {
    const headers = process.env.NODE_ENV === 'development' 
      ? developmentHeaders 
      : securityHeaders;
      
    return [
      {
        // Apply security headers to all routes
        source: '/:path*',
        headers: headers,
      },
      {
        // Additional headers for API routes
        source: '/api/:path*',
        headers: [
          ...headers,
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0'
          }
        ],
      }
    ];
  },
  
  // Redirect configuration
  async redirects() {
    return [
      // Redirect root to dashboard or login
      {
        source: '/',
        destination: '/index',
        permanent: false,
      }
    ];
  },
  
  // Environment variables validation
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // Webpack configuration for additional security
  webpack: (config, { dev, isServer }) => {
    // Security-related webpack configurations
    if (!dev && !isServer) {
      // Remove console.log in production
      config.optimization.minimizer[0].options.terserOptions.compress.drop_console = true;
    }
    
    return config;
  },
  
  // Power off X-Powered-By header
  poweredByHeader: false,
  
  // Compress responses
  compress: true,
  
  // Experimental features for security
  experimental: {
    // Enable security-related experimental features if needed
  }
};

module.exports = nextConfig;