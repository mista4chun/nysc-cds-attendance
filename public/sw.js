// public/sw.js
const CACHE_NAME = 'nysc-cds-v1'

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Don't intercept — let API calls and Supabase go straight to network
  if (
    request.method !== 'GET' ||
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('ngrok')
  ) {
    return
  }

  // Everything else — network first, no hanging
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  )
})