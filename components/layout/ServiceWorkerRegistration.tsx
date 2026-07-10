// components/layout/ServiceWorkerRegistration.tsx
// Drop this into app/layout.tsx — registers SW on client only
'use client'

import { useEffect } from 'react'

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator))  return

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then(reg => {
        console.log('[SW] Registered, scope:', reg.scope)

        // Check for updates every 60s while app is open
        setInterval(() => reg.update(), 60_000)
      })
      .catch(err => console.warn('[SW] Registration failed:', err))
  }, [])

  return null
}