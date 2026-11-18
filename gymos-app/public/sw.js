/* GymOS service worker. Caches the app shell only. Data is never cached: every request to Supabase (another origin) is left alone.
   BUILD is replaced by build.sh with a hash of the app files, so each release gets its own cache and the old one is deleted. */
const BUILD = '2467351666';
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

/* Web Push: the server sends {title, body, url}. Tapping opens the app on a page of THIS site only. */
self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) { d = { body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(String(d.title || 'Gym').slice(0, 60), {
    body: String(d.body || '').slice(0, 200), icon: 'icon-192.png', badge: 'icon-192.png', data: { url: String(d.url || '/') },
  }));
});
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  let target = self.location.origin + '/';
  try { const u = new URL((e.notification.data && e.notification.data.url) || '/', self.location.origin); if (u.origin === self.location.origin) target = u.href; } catch (err) { /* keep the home page */ }
  e.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of all) {
      if (c.url.startsWith(self.location.origin)) { try { await c.navigate(target); } catch (err) { /* focus anyway */ } return c.focus(); }
    }
    return self.clients.openWindow(target);
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
        /* only the app entry is saved as the offline shell; the privacy page and other pages are never stored in its place */
        if (res && res.ok && /(\/|\/index\.html)$/.test(u.pathname)) { const c = await caches.open(CACHE); c.put('index.html', res.clone()); }
        return res;
      } catch (err) {
        const c = await caches.open(CACHE);
        /* only the app entry falls back to the saved shell; any other page (e.g. privacy.html) gets the offline page, never the app */
        if (!/(\/|\/index\.html)$/.test(u.pathname)) return (await c.match('offline.html')) || Response.error();
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
