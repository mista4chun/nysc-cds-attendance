// next.config.ts
import type { NextConfig } from 'next'

const config: NextConfig = {
  // No withPWA wrapper needed — manifest.ts handles it
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',  // for profile photos from Supabase Storage
      },
    ],
  },
  // Required for QR scanner library
  transpilePackages: ['html5-qrcode'],
}

export default config

