// // app/manifest.ts
// import type { MetadataRoute } from 'next'

// export default function manifest(): MetadataRoute.Manifest {
//   return {
//     name: 'NYSC CDS Attendance',
//     short_name: 'NYSC Attend',
//     description: 'CDS attendance management for corps members',
//     start_url: '/',
//     display: 'standalone',
//     background_color: '#ffffff',
//     theme_color: '#006400',
//     orientation: 'portrait',
//     icons: [
      // {
      //   src: '/icons/manifest-icon-192.maskable.png',
      //   sizes: '192x192',
      //   type: 'image/png',
      // },
      // {
      //   src: '/icons/manifest-icon-512.maskable.png',
      //   sizes: '512x512',
      //   type: 'image/png',
      // },
      //  {
      //   src: '/icons/apple-icon-180.png',
      //   sizes: '180x180',
      //   type: 'image/png',
      // },
      // {
      //   src: '/icons/manifest-icon-512.maskable.png',
      //   sizes: '512x512',
      //   type: 'image/png',
      //   purpose: 'maskable',   // Android adaptive icon
      // },
//     ],
//   }
// }

// ============================================================
// FILE 1: app/manifest.ts  — complete PWA manifest
// ============================================================

import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name:             'NYSC CDS Attendance',
    short_name:       'NYSC Attend',
    description:      'CDS attendance management for corps members — OSISIOMA LGA',
    start_url:        '/',
    display:          'standalone',
    background_color: '#006400',
    theme_color:      '#006400',
    orientation:      'portrait-primary',
    categories:       ['productivity', 'education'],
    icons: [
      {
        src:   '/icons/icon-32.png',
        sizes: '32x32',
        type:  'image/png',
      },
        {
        src: '/icons/apple-icon-180.png',
        sizes: '180x180',
        type: 'image/png',
      },
      {
        src: '/icons/manifest-icon-192.maskable.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/manifest-icon-512.maskable.png',
        sizes: '512x512',
        type: 'image/png',
      },
     {
        src: '/icons/manifest-icon-512.maskable.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',   // Android adaptive icon
      },
    ],
    shortcuts: [
      {
        name:      'Scan attendance',
        short_name: 'Scan',
        url:       '/member/scan',
        icons:     [{ src: '/icons/manifest-icon-192.maskable.png', sizes: '192x192' }],
      },
    ],
  }
}