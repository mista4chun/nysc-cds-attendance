

import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'NYSC CDS Attendance',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'CDSync',
    // This handles the primary iOS touch icon
    startupImage: [
      {
        url: '/icons/manifest-icon-512.maskable.png', // A fallback splash image
        media: '(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)', // iPhone 15 Pro
      },
    ],
  },
}
// app/(auth)/layout.tsx
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}
 
  </>
}