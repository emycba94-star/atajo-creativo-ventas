// Service Worker - Atajo Creativo v4
// v4: HTML always served fresh from network (no caching)
const CACHE_NAME = 'atajo-creativo-v4';
const STATIC_ASSETS = [
  // Only cache fonts and external static resources
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.resolve();
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Always fetch HTML fresh from network - no caching
  if (event.request.destination === 'document' || 
      url.pathname === '/' || 
      url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' }).catch(() => {
        return new Response('Offline', { status: 503 });
      })
    );
    return;
  }
  
  // For API calls, always go to network
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  // For static assets, use network-first strategy
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
