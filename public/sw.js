// // public/sw.js
// const CACHE_NAME = 'cdsync-cache-v1';
// const ASSETS_TO_CACHE = [
//   '/icons/manifest-icon-192.maskable.png',
//   '/icons/manifest-icon-512.maskable.png',
//   '/icons/icon-source.png',
// ];

// // Install Event: Cache critical app shell assets
// self.addEventListener('install', (event) => {
//   event.waitUntil(
//     caches.open(CACHE_NAME).then((cache) => {
//       return cache.addAll(ASSETS_TO_CACHE);
//     }),
//   );
// });

// // Activate Event: Clean up old caches
// self.addEventListener('activate', (event) => {
//   event.waitUntil(
//     caches.keys().then((cacheNames) => {
//       return Promise.all(
//         cacheNames.map((cache) => {
//           if (cache !== CACHE_NAME) {
//             return caches.delete(cache);
//           }
//         }),
//       );
//     }),
//   );
// });

// // Fetch Event: Stale-While-Revalidate Strategy
// self.addEventListener('fetch', (event) => {
//   event.respondWith(
//     caches.match(event.request).then((cachedResponse) => {
//       const fetchPromise = fetch(event.request)
//         .then((networkResponse) => {
//           if (networkResponse.status === 200) {
//             caches.open(CACHE_NAME).then((cache) => {
//               cache.put(event.request, networkResponse.clone());
//             });
//           }
//           return networkResponse;
//         })
//         .catch(() => {
//           // Fallback or silence network errors if offline
//         });

//       return cachedResponse || fetchPromise;
//     }),
//   );
// });

// public/sw.js
const CACHE_NAME = 'nysc-cds-v1'

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', (event) => {
  // Basic network-first strategy
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request)
    })
  )
})