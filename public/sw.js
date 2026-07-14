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

  // Only cache static assets — never intercept navigation or API
  if (
    request.mode === 'navigate' ||
    request.method !== 'GET' ||
    url.pathname.startsWith('/api/') ||
    url.hostname !== self.location.hostname
  ) {
    return  // Let browser handle normally
  }

  // Only cache Next.js static chunks
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then(cached =>
        cached ?? fetch(request).then(res => {
          if (res.ok) {
            const clone = res.clone()
            caches.open(CACHE_NAME).then(c => c.put(request, clone))
          }
          return res
        })
      )
    )
  }
})