// next.config.ts
import type { NextConfig } from 'next'

const config: NextConfig = {
  // No withPWA wrapper needed — manifest.ts handles it
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',  // for profile photos from Supabase Storage
      },
    ],
  },
  // Required for QR scanner library
  transpilePackages: ['html5-qrcode'],
  
  allowedDevOrigins: ['chalice-pester-cough.ngrok-free.dev'],

  // ── Bundle optimisation ─────────────────────────────────────
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'recharts',
      '@radix-ui/react-dialog',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
    ],
  },

  // ── Security headers ────────────────────────────────────────
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options',    value: 'nosniff'          },
          { key: 'X-Frame-Options',           value: 'DENY'             },
          { key: 'X-XSS-Protection',          value: '1; mode=block'    },
          { key: 'Referrer-Policy',           value: 'strict-origin'    },
          // Fixed: Changed camera=() to camera=(self) so your html5-qrcode library can function
          { key: 'Permissions-Policy',        value: 'camera=(self), microphone=()' },
        ],
      },
      {
        // Cache static icons aggressively
        source: '/icons/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        // Service worker must not be cached
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
    ]
  },

  // ── Redirects ───────────────────────────────────────────────
  async redirects() {
    return [
      {
        source:      '/',
        destination: '/login',
        permanent:   false,
      },
    ]
  },

}

export default config

