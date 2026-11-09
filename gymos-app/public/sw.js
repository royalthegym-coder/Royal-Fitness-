/* GymOS service worker. Caches the app shell only. Data is never cached: every request to Supabase (another origin) is left alone.
   BUILD is replaced by build.sh with a hash of the app files, so each release gets its own cache and the old one is deleted. */
const BUILD = 'c827c4f786';
const CACHE = 'gymos-' + BUILD;
const SHELL = ['./', 'index.html', 'style.css', 'app.js', 'manifest.webmanifest', 'offline.html', 'logo.webp', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => Promise.all(SHELL.map((u) => c.add(new Request(u, { cache: 'reload' }))))));
});
self.addEventListener('message', (e) => { if (e.data === 'SKIP_WAITING') self.skipWaiting(); });
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith('gymos-') && k !== CACHE).map((k) => caches.delete(k)));
    if (self.registration.navigationPreload) { try { await self.registration.navigationPreload.enable(); } catch (err) { /* optional */ } }
    await self.clients.claim();
  })());
});

const withTimeout = (p, ms) => new Promise((resolve, reject) => { const t = setTimeout(() => reject(new Error('timeout')), ms); p.then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); }); });

self.addEventListener('fetch', (e) => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin) return;
  if (r.mode === 'navigate') {
    /* online: always the newest page; slow or offline: the saved shell, then a friendly offline page */
    e.respondWith((async () => {
      try {
        const pre = e.preloadResponse ? await e.preloadResponse : null;
        const res = pre || (await withTimeout(fetch(r), 6000));
        if (res && res.ok) { const c = await caches.open(CACHE); c.put('index.html', res.clone()); }
        return res;
      } catch (err) {
        const c = await caches.open(CACHE);
        return (await c.match('index.html')) || (await c.match('offline.html')) || Response.error();
      }
    })());
    return;
  }
  /* files of the app: show the saved copy at once, refresh it in the background */
  e.respondWith((async () => {
    const c = await caches.open(CACHE), hit = await c.match(r);
    const net = fetch(r).then((res) => { if (res && res.ok) c.put(r, res.clone()); return res; });
    if (hit) { net.catch(() => {}); return hit; }
    try { return await net; } catch (err) { return (await c.match('offline.html')) || Response.error(); }
  })());
});
