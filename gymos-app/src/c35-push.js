/* ================= Push notifications (Web Push) =================
   A member switches notifications on in Profile. After that the database queues a short message when a payment is recorded,
   two days before and on the day a membership ends, and when the gym owner sends an announcement. The push-dispatch Edge Function delivers them.
   No key has to be typed anywhere: the server makes its own key pair. On iPhone this works only after "Add to Home Screen". */
const PUSH_OK = () => typeof navigator !== 'undefined' && 'serviceWorker' in navigator && typeof window !== 'undefined' && 'PushManager' in window && 'Notification' in window;

/* pure */
function b64ToBytes(s) {
  const p = String(s || '').replace(/-/g, '+').replace(/_/g, '/'), raw = atob(p + '='.repeat((4 - (p.length % 4)) % 4)), out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}
/* iPhone and iPad only deliver web push to an app that was added to the home screen */
function pushNeedsInstall(ua, standalone) { return /iPhone|iPad|iPod/i.test(String(ua || '')) && !standalone; }
/* pure: group the per-person rows of each announcement into one line */
function announceGroups(rows) {
  const g = new Map();
  rows.filter((r) => r.kind === 'announce').forEach((r) => {
    const k = String(r.dedupe_key).split(':')[1] || r.created_at;
    const x = g.get(k) || { at: r.created_at, title: r.title, body: r.body, total: 0, sent: 0, failed: 0, waiting: 0 };
    x.total++; if (r.status === 'sent') x.sent++; else if (r.status === 'failed' || r.status === 'skipped') x.failed++; else x.waiting++;
    g.set(k, x);
  });
  return [...g.values()].sort((a, b) => (a.at < b.at ? 1 : a.at > b.at ? -1 : 0));
}

async function pushFn(body) {
  if (SESSION && SESSION.expires_at && SESSION.expires_at - 30 < Date.now() / 1000) await refreshSession();
  const res = await rawFetch('/functions/v1/push-dispatch', { method: 'POST', headers: { apikey: CFG.key, Authorization: 'Bearer ' + (SESSION && SESSION.access_token), 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const j = await res.json().catch(() => ({}));
  if (res.status === 401) { saveSession(null); if (typeof onSignedOut === 'function') onSignedOut(); throw new ApiError('session expired', 401, 'jwt'); }
  if (!res.ok && !j.error) j.error = 'HTTP ' + res.status;
  return j;
}
const pushReg = () => Promise.race([navigator.serviceWorker.ready, new Promise((_, rej) => setTimeout(() => rej(new Error('no service worker')), 4000))]);
async function pushState() {
  if (!PUSH_OK()) return { supported: false, permission: 'default', on: false };
  let on = false; try { const reg = await pushReg(); on = !!(await reg.pushManager.getSubscription()); } catch (e) { /* not ready: shown as off */ }
  return { supported: true, permission: Notification.permission, on };
}
async function pushEnable() {
  if (!PUSH_OK()) { toast(L('This browser cannot show notifications.', 'यह ब्राउज़र सूचनाएँ नहीं दिखा सकता।'), 'bad'); return false; }
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') { toast(L('Notifications are blocked. Allow them in the browser settings for this site.', 'सूचनाएँ बंद हैं। ब्राउज़र की सेटिंग में इस साइट के लिए अनुमति दीजिए।'), 'bad'); return false; }
  const r = await pushFn({ action: 'key' });
  if (!r.key) { toast(L('Could not set up notifications. Try again.', 'सूचनाएँ चालू नहीं हो सकीं। फिर कोशिश करें।'), 'bad'); return false; }
  const reg = await pushReg(); let sub = await reg.pushManager.getSubscription();
  try { if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(r.key) }); } catch (e) {
    toast(L('This phone refused notifications. Try again after installing the app to the home screen.', 'इस फ़ोन ने सूचनाएँ नहीं मानीं। ऐप को होम स्क्रीन पर इंस्टॉल करके फिर कोशिश करें।'), 'bad'); return false;
  }
  const j = sub.toJSON(), k = (j && j.keys) || {};
  await DB.rpc('push_subscribe', { p_endpoint: j.endpoint, p_p256dh: k.p256dh, p_auth: k.auth });
  return true;
}
async function pushDisable() {
  try { const reg = await pushReg(), sub = await reg.pushManager.getSubscription(); if (sub) { const ep = sub.endpoint; await sub.unsubscribe(); await DB.rpc('push_unsubscribe', { p_endpoint: ep }); } } catch (e) { return false; }
  return true;
}

/* card for the member's Profile page */
async function pushCard() {
  const st = await pushState(), standalone = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
  const need = pushNeedsInstall(navigator.userAgent, standalone);
  const badgeHtml = !st.supported || need ? badge(L('Not available here', 'यहाँ उपलब्ध नहीं'), 'mute') : st.on ? badge(L('On', 'चालू'), 'ok') : st.permission === 'denied' ? badge(L('Blocked', 'बंद'), 'bad') : badge(L('Off', 'बंद'), 'mute');
  const msg = need ? L('On iPhone, first tap Share → “Add to Home Screen”, then open the app from the home screen and switch notifications on.', 'iPhone पर पहले Share → “Add to Home Screen” कीजिए, फिर होम स्क्रीन से ऐप खोलकर सूचनाएँ चालू कीजिए।')
    : !st.supported ? L('This browser cannot show notifications.', 'यह ब्राउज़र सूचनाएँ नहीं दिखा सकता।')
    : st.permission === 'denied' ? L('Notifications are blocked for this site. Allow them in the browser settings, then come back.', 'इस साइट की सूचनाएँ बंद हैं। ब्राउज़र की सेटिंग में अनुमति देकर वापस आइए।')
    : L('Get a message on your phone when a payment is recorded and before your membership ends, and news from your gym.', 'भुगतान दर्ज होने पर, सदस्यता खत्म होने से पहले, और जिम की ख़बरों पर अपने फ़ोन में सूचना पाइए।');
  const btns = !st.supported || need || st.permission === 'denied' ? '' : st.on
    ? `<button class="btn" data-act="pushTest">${ic('msg')} ${esc(L('Send me a test', 'टेस्ट भेजें'))}</button> <button class="btn" data-act="pushOff">${esc(L('Switch off', 'बंद करें'))}</button>`
    : `<button class="btn primary" data-act="pushOn">${ic('msg')} ${esc(L('Switch on notifications', 'सूचनाएँ चालू करें'))}</button>`;
  return card(L('Notifications', 'सूचनाएँ'), 'msg', badgeHtml, `<div style="padding:6px 18px 18px"><p class="muted" style="margin:0 0 12px">${esc(msg)}</p>${btns ? `<div style="display:flex;gap:8px;flex-wrap:wrap">${btns}</div>` : ''}</div>`);
}
async function pushToggle(on) {
  if (U.pushBusy) return; U.pushBusy = true;
  try {
    const ok = on ? await pushEnable() : await pushDisable();
    if (ok) toast(on ? L('Notifications are on.', 'सूचनाएँ चालू हो गईं।') : L('Notifications are off.', 'सूचनाएँ बंद हो गईं।'), 'ok');
    render();
  } catch (e) { toast(friendlyError(e), 'bad'); } finally { U.pushBusy = false; }
}
async function pushTest() {
  if (U.pushBusy) return; U.pushBusy = true;
  try {
    const r = await pushFn({ action: 'test' });
    if (r.error === 'too_soon') toast(L('Wait a minute before the next test.', 'अगले टेस्ट से पहले एक मिनट रुकिए।'), 'bad');
    else if (r.error) toast(L('Could not send the test.', 'टेस्ट नहीं भेजा जा सका।'), 'bad');
    else if (r.delivered > 0) toast(L('Test sent. It should appear on this phone now.', 'टेस्ट भेजा गया। यह फ़ोन पर अभी दिखना चाहिए।'), 'ok');
    else toast(L('The test could not be delivered. Switch notifications off and on again.', 'टेस्ट नहीं पहुँचा। सूचनाएँ बंद करके फिर चालू कीजिए।'), 'bad');
  } catch (e) { toast(friendlyError(e), 'bad'); } finally { U.pushBusy = false; }
}

/* ---------- owner: announcements ---------- */
async function vAnnounce() {
  const [stats, rows] = await Promise.all([DB.rpc('push_stats', {}).catch(() => null), DB.select('push_outbox', { filters: { kind: 'eq.announce' }, order: 'created_at.desc', limit: 200 }).catch(() => [])]);
  const gr = announceGroups(rows), lock = CTX.locked ? 'disabled' : '';
  const sub = stats ? stats.subscribed : 0, tot = stats ? stats.members_with_login : 0;
  return pageHead(L('People', 'लोग'), L('Announcements', 'घोषणाएँ'), L('Send a short message to every member who has switched notifications on, for example a holiday or a new batch timing.', 'जिन सदस्यों ने सूचनाएँ चालू की हैं उन सबको छोटा संदेश भेजिए, जैसे छुट्टी या नई बैच का समय।'), `<button class="btn primary" data-act="announceNew" ${lock}>${ic('msg')} ${esc(L('New announcement', 'नई घोषणा'))}</button>`)
    + `<div class="tiles">${tile(L('Will receive', 'पाएँगे'), String(sub), L(`of ${tot} members with a login`, `${tot} लॉगिन वाले सदस्यों में से`), sub ? 'var(--ok)' : '')}${tile(L('Sent so far', 'अब तक भेजी'), String(gr.length), L('announcements', 'घोषणाएँ'))}</div>`
    + (tot && !sub ? `<div class="note" style="margin-bottom:12px">${esc(L('Nobody has switched notifications on yet. Members do it in the app under Profile → Notifications.', 'अभी किसी ने सूचनाएँ चालू नहीं की हैं। सदस्य ऐप में Profile → Notifications से चालू करते हैं।'))}</div>` : '')
    + card(L('Sent announcements', 'भेजी गई घोषणाएँ'), 'list', '', gr.length ? `<ul class="list">${gr.map((x) => `<li><div class="grow"><b>${esc(x.title)}</b><small>${esc(x.body)}</small><small>${esc(fmtDate(istDate(x.at)))} ${esc(fmtTime(x.at))} · ${esc(L(`${x.sent} delivered`, `${x.sent} को पहुँची`))}${x.waiting ? ' · ' + esc(L(`${x.waiting} waiting`, `${x.waiting} इंतज़ार में`)) : ''}${x.failed ? ' · ' + esc(L(`${x.failed} not delivered`, `${x.failed} को नहीं पहुँची`)) : ''}</small></div></li>`).join('')}</ul>` : empty(L('No announcements yet', 'अभी कोई घोषणा नहीं'), ''))
    + `<div class="note" style="margin-top:14px">${esc(L('Members also get a message by themselves when a payment is recorded and 2 days before and on the day their membership ends. They can switch notifications off any time.', 'सदस्यों को भुगतान दर्ज होने पर और सदस्यता खत्म होने से 2 दिन पहले व उसी दिन अपने-आप सूचना जाती है। वे जब चाहें सूचनाएँ बंद कर सकते हैं।'))}</div>`;
}
function announceForm() {
  openForm({
    title: L('New announcement', 'नई घोषणा'), submitLabel: L('Send', 'भेजें'),
    fields: [
      { k: 'title', label: L('Title', 'शीर्षक'), req: true, full: true, check: (v) => (v.trim().length > 60 ? L('Up to 60 characters', 'अधिकतम 60 अक्षर') : '') },
      { k: 'body', label: L('Message', 'संदेश'), type: 'textarea', req: true, full: true, check: (v) => (v.trim().length > 200 ? L('Up to 200 characters', 'अधिकतम 200 अक्षर') : '') },
    ],
    onSubmit: async (v) => {
      let r; try { r = await DB.rpc('push_announce', { p_title: v.title.trim(), p_body: v.body.trim() }); } catch (e) { toast(friendlyError(e), 'bad'); return false; }
      if (r && r.error === 'too_soon') { toast(L('You sent one a moment ago. Wait 10 minutes.', 'अभी एक घोषणा भेजी है। 10 मिनट रुकिए।'), 'bad'); return false; }
      if (r && r.error) { toast(L('Check the title and message.', 'शीर्षक और संदेश जाँचिए।'), 'bad'); return false; }
      toast(L(`Sent to ${(r && r.queued) || 0} members.`, `${(r && r.queued) || 0} सदस्यों को भेजी गई।`), 'ok'); render(); return true;
    },
  });
}
