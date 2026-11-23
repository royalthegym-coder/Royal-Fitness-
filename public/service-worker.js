const CACHE_NAME = 'fitness-future-pwa-v2';
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',
  '/index.css'
];

// 1. Install stage: pre-cache critical app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[ServiceWorker] Caching app shell');
      return cache.addAll(APP_SHELL).catch(err => {
        console.warn('[ServiceWorker] Pre-cache partial fail (acceptable in dev):', err);
      });
    })
  );
  self.skipWaiting();
});

// 2. Activate stage: clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('[ServiceWorker] Removing old cache', key);
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// 3. Fetch stage: Network first for API/Edge, Cache first for assets, fallback to offline.html
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);

  // Skip POST/PUT or WebSockets or browser extensions
  if (event.request.method !== 'GET' || requestUrl.protocol.startsWith('chrome-extension')) {
    return;
  }

  // API endpoints: Network first with offline fallback
  if (requestUrl.pathname.startsWith('/api/') || requestUrl.pathname.startsWith('/rest/')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(JSON.stringify({ 
          offline: true, 
          cached: true, 
          message: 'Client in offline mode. Changes queued in local IndexedDB.' 
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // Static assets & navigation: Stale-while-revalidate / cache-first
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        // Fetch in background to revalidate
        fetch(event.request).then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, networkResponse.clone()));
          }
        }).catch(() => {});
        return cachedResponse;
      }

      return fetch(event.request)
        .then(networkResponse => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
          return networkResponse;
        })
        .catch(() => {
          if (event.request.mode === 'navigate') {
            return caches.match('/offline.html');
          }
        });
    })
  );
});

// 4. Background Sync for offline actions
self.addEventListener('sync', event => {
  if (event.tag === 'fitness-future-sync') {
    event.waitUntil(
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({ type: 'TRIGGER_OFFLINE_SYNC' });
        });
      })
    );
  }
});
