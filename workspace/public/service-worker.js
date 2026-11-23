const CACHE_NAME = 'fitness-gym-cache-v1';
const urlsToCache = ['/', '/index.html', '/offline.html', '/styles.css'];

// 1. Cache static assets on install
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
    );
});

// 2. Serve cached assets in Offline Mode
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request).catch(() => caches.match('/offline.html'));
        })
    );
});
