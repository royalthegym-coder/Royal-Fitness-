/* ================= Installable app: update prompt, install prompt (Android + iPhone/iPad), offline bar ================= */
const isStandalone = () => (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const lsGet = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } };
let DEFERRED_INSTALL = null, SW_REG = null;

function bar(id, html) {
  let el = document.getElementById(id);
  if (!el) { el = document.createElement('div'); el.id = id; el.className = 'pwabar'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
  el.innerHTML = html; return el;
}
const dropBar = (id) => { const el = document.getElementById(id); if (el) el.remove(); };

const isNativeApp = () => !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
function pwaInit() {
  if (isNativeApp()) return; /* the store app has its own files, install prompt and updates */
  const secure = location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  if ('serviceWorker' in navigator && secure) {
    navigator.serviceWorker.register('sw.js').then((reg) => {
      SW_REG = reg;
      const watch = (w) => w && w.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) showUpdateBar(w); });
      if (reg.waiting && navigator.serviceWorker.controller) showUpdateBar(reg.waiting);
      reg.addEventListener('updatefound', () => watch(reg.installing));
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') reg.update().catch(() => {}); });
      setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000);
    }).catch(() => {});
    /* reload only when the person pressed "Update now"; the very first install must not reload the page */
    let reloading = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (reloading || !window.__updating) return; reloading = true; location.reload(); });
  }
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); DEFERRED_INSTALL = e; });
  window.addEventListener('appinstalled', () => { DEFERRED_INSTALL = null; dropBar('installBar'); lsSet('gymos-installed', '1'); });
  const off = () => bar('offBar', `<span>${esc(L('You are offline. You can look around, but changes cannot be saved.', 'इंटरनेट नहीं है। देख सकते हैं, पर बदलाव सेव नहीं होंगे।'))}</span>`).classList.add('warn');
  window.addEventListener('offline', off); window.addEventListener('online', () => dropBar('offBar'));
  if (!navigator.onLine) off();
}
function showUpdateBar(worker) {
  bar('updBar', `<span>${esc(L('A new version of the app is ready.', 'ऐप का नया वर्ज़न तैयार है।'))}</span><button class="btn sm pri" type="button" data-act="applyUpdate">${esc(L('Update now', 'अभी अपडेट करें'))}</button>`);
  window.__swWaiting = worker;
}
/* shown once the person is signed in; never inside the installed app, and not again for 14 days after "Not now" */
function pwaAfterLogin() {
  if (isNativeApp()) return;
  if (isStandalone() || lsGet('gymos-installed') === '1') return;
  const until = Number(lsGet('gymos-install-later') || 0); if (until > Date.now()) return;
  if (DEFERRED_INSTALL) bar('installBar', `<span>${esc(L('Install GymOS on your phone for one-tap access.', 'GymOS को फ़ोन में इंस्टॉल करें, एक टैप में खुलेगा।'))}</span><button class="btn sm pri" type="button" data-act="installApp">${esc(L('Install', 'इंस्टॉल'))}</button><button class="btn sm" type="button" data-act="installLater">${esc(L('Not now', 'अभी नहीं'))}</button>`);
  else if (isIOS()) bar('installBar', `<span>${esc(L('Install on iPhone: tap the Share button, then "Add to Home Screen".', 'iPhone में इंस्टॉल: Share बटन दबाएँ, फिर "Add to Home Screen" चुनें।'))}</span><button class="btn sm" type="button" data-act="installLater">${esc(L('Got it', 'समझ गया'))}</button>`);
}
async function installApp() {
  if (!DEFERRED_INSTALL) return;
  DEFERRED_INSTALL.prompt(); const r = await DEFERRED_INSTALL.userChoice.catch(() => ({})); DEFERRED_INSTALL = null; dropBar('installBar');
  if (r && r.outcome === 'dismissed') lsSet('gymos-install-later', String(Date.now() + 14 * 864e5));
}
function installLater() { lsSet('gymos-install-later', String(Date.now() + 14 * 864e5)); dropBar('installBar'); }
function applyUpdate() { window.__updating = true; const w = window.__swWaiting || (SW_REG && SW_REG.waiting); if (w) w.postMessage('SKIP_WAITING'); else location.reload(); }

/* Inside the Android/iOS store app: the phone's Back button closes a sheet, goes to the first page, then leaves the app */
function nativeInit() {
  const A = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App; if (!isNativeApp() || !A) return;
  A.addListener('backButton', () => {
    if (MODALS.length) { MODALS[MODALS.length - 1].querySelector('[data-x]').click(); return; }
    const first = navFor().length ? navFor()[0][0] : '', cur = location.hash.replace('#', '');
    if (cur && first && cur !== first) location.hash = first; else A.exitApp();
  });
}
