// app/manifest.ts
import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'NYSC CDS Attendance',
    short_name: 'NYSC Attend',
    description: 'CDS attendance management for corps members',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#006400',
    orientation: 'portrait',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',   // Android adaptive icon
      },
    ],
  }
}