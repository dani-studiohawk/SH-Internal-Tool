/**
 * Security headers configuration for Next.js
 * Provides comprehensive security headers including CSP, HSTS, etc.
 */

const securityHeaders = [
  // Content Security Policy
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://accounts.google.com https://apis.google.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https://lh3.googleusercontent.com https://*.googleusercontent.com",
      "connect-src 'self' https://api.openai.com https://accounts.google.com https://oauth2.googleapis.com",
      "frame-src 'self' https://accounts.google.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests"
    ].join('; ')
  },
  
  // HTTP Strict Transport Security
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload'
  },
  
  // Prevent MIME type sniffing
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  
  // Prevent clickjacking
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  
  // XSS Protection
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  
  // Referrer Policy
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  
  // Permissions Policy (Feature Policy)
  {
    key: 'Permissions-Policy',
    value: [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'interest-cohort=()'
    ].join(', ')
  },
  
  // Prevent DNS prefetching
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'off'
  },
  
  // Remove X-Powered-By header
  {
    key: 'X-Powered-By',
    value: ''
  }
];

// Development-specific headers (less restrictive CSP)
const developmentHeaders = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://accounts.google.com https://apis.google.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https://lh3.googleusercontent.com https://*.googleusercontent.com",
      "connect-src 'self' https://api.openai.com https://accounts.google.com https://oauth2.googleapis.com ws: wss:",
      "frame-src 'self' https://accounts.google.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ')
  },
  // Other headers remain the same for development
  ...securityHeaders.slice(1)
];

module.exports = {
  securityHeaders,
  developmentHeaders
};