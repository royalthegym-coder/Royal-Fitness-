/* ================= QR check-in: the member shows a QR pass, staff scan it (camera or a barcode scanner) =================
   Offline-safe: a scan is written to this device's outbox first, with the visit id made here, and then sent. With no
   connection it waits and is sent in order when the connection returns. A resend is harmless: the id is the primary key. */
const PASS_RE = /^gymos:([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;
const passCode = (m) => `gymos:${m.id}`;
const SCAN_REPEAT_MS = 120000; /* a second scan within 2 minutes of a check-in is a repeat, not a check-out */
const OUTBOX_KEY = 'gymos-checkin-outbox', ROSTER_KEY = 'gymos-checkin-roster';

/* pure: a version-4 id made in the browser, so an offline scan already has its id */
function newVisitId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const b = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') crypto.getRandomValues(b);
  else for (let i = 0; i < 16; i++) b[i] = Math.floor(Math.random() * 256);
  b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
/* pure: what one scan means. visits = the known visits (server or snapshot), outbox = scans not yet sent.
   'in' = new check-in; 'out' = check out of visit id; 'repeat' = already checked in a moment ago, so nothing is written. */
function planScan(visits, outbox, memberId, today, nowMs) {
  const sessions = new Map();
  (Array.isArray(visits) ? visits : []).forEach((v) => { if (v && v.member_id === memberId) sessions.set(v.id, { id: v.id, in_at: v.in_at, out_at: v.out_at || null }); });
  (Array.isArray(outbox) ? outbox : []).forEach((e) => {
    if (!e) return;
    if (e.type === 'in' && e.member_id === memberId) sessions.set(e.id, { id: e.id, in_at: e.in_at, out_at: null });
    if (e.type === 'out' && sessions.has(e.visit_id)) sessions.get(e.visit_id).out_at = e.out_at;
  });
  let open = null;
  sessions.forEach((s) => { if (!s.out_at && istDate(s.in_at) === today && (!open || s.in_at > open.in_at)) open = s; });
  if (!open) return { action: 'in' };
  return nowMs - Date.parse(open.in_at) < SCAN_REPEAT_MS ? { action: 'repeat', id: open.id } : { action: 'out', id: open.id };
}

/* storage: this device's localStorage, or an in-memory stand-in in private windows where it is blocked */
const MEM_STORE = { m: new Map(), getItem(k) { return this.m.has(k) ? this.m.get(k) : null; }, setItem(k, v) { this.m.set(k, String(v)); }, removeItem(k) { this.m.delete(k); } };
function safeStore() { try { return window.localStorage || MEM_STORE; } catch (e) { return MEM_STORE; } }
function outboxRead(store) {
  try {
    const v = JSON.parse(store.getItem(OUTBOX_KEY) || '[]');
    return Array.isArray(v) ? v.filter((e) => e && e.key && e.gym_id && (e.type === 'in' || e.type === 'out')) : [];
  } catch (e) { return []; }
}
function outboxWrite(store, list) {
  try { if (list.length) store.setItem(OUTBOX_KEY, JSON.stringify(list)); else store.removeItem(OUTBOX_KEY); return true; } catch (e) { return false; }
}
/* the members and recent visits of this gym, kept for when the connection is down (minimum fields only) */
function rosterSave(store, members, visits) {
  try {
    const cutoff = addDays(todayISO(), -2);
    store.setItem(ROSTER_KEY, JSON.stringify({
      gym: gymId(), at: Date.now(),
      members: (members || []).map((m) => ({ id: m.id, name: m.name, status: m.status, end_date: m.end_date })),
      visits: (visits || []).filter((v) => istDate(v.in_at) >= cutoff).map((v) => ({ id: v.id, member_id: v.member_id, in_at: v.in_at, out_at: v.out_at || null })),
    }));
  } catch (e) { /* storage full: offline check-in is then unavailable; online check-in still works */ }
}
function rosterLoad(store, gym) {
  try {
    const s = JSON.parse(store.getItem(ROSTER_KEY) || 'null');
    return s && s.gym === gym && Array.isArray(s.members) && Array.isArray(s.visits) ? s : null;
  } catch (e) { return null; }
}

/* sign-out removes the member names kept for offline use (shared front-desk devices). Unsent scans stay: they are still owed to the gym. */
function rosterClear() { try { safeStore().removeItem(ROSTER_KEY); } catch (e) { /* nothing stored */ } }

/* sends the queued scans in order. Returns one result per scan it finished: sent, or dropped with a reason.
   It stops at the first scan that cannot be sent now (no connection, signed out, no access), and keeps the rest. */
let OUTBOX_BUSY = false;
async function flushCheckIns() {
  const store = safeStore();
  if (OUTBOX_BUSY || !SESSION || !CTX.profile || !CTX.profile.gym_id) return [];
  const results = [];
  OUTBOX_BUSY = true;
  try {
    for (const e of outboxRead(store)) {
      if (e.gym_id !== gymId()) continue; /* another gym's queue on this device: leave it for that login */
      let outcome = 'sent', msg = '';
      try {
        if (e.type === 'in') {
          try { await DB.insert('visits', { id: e.id, gym_id: e.gym_id, member_id: e.member_id, in_at: e.in_at }); }
          catch (err) { if (!(err && err.code === '23505')) throw err; } /* already recorded by an earlier try: fine */
        } else {
          await DB.update('visits', e.visit_id, { out_at: e.out_at });
        }
      } catch (err) {
        if (err && (err.status === 0 || err.status === 401 || err.code === '42501')) break;
        outcome = 'dropped';
        msg = L(`One check-in could not be saved: ${friendlyError(err)}`, `एक चेक-इन सेव नहीं हो सका: ${friendlyError(err)}`);
      }
      outboxWrite(store, outboxRead(store).filter((x) => x.key !== e.key));
      results.push({ key: e.key, outcome, msg });
    }
  } finally { OUTBOX_BUSY = false; }
  return results;
}
function reportFlush(results) {
  if (!results.length) return;
  const sent = results.filter((r) => r.outcome === 'sent').length;
  results.filter((r) => r.outcome === 'dropped').forEach((r) => toast(r.msg, 'bad'));
  if (sent) toast(L(`${sent} offline check-in(s) synced`, `${sent} ऑफ़लाइन चेक-इन सिंक हुए`));
  bust('visits');
  const cur = currentRoute();
  if (cur && cur[0] === 'checkin') render();
}

/* staff side: the scans saved on this device that the gym has not received yet (this gym's only, never another gym's) */
function pendingCheckIns() { try { return outboxRead(safeStore()).filter((e) => e.gym_id === gymId()); } catch (e) { return []; } }
/* the "Sync now" button: send what is waiting. If nothing could be sent, say so, so a stuck queue is never silent. */
async function syncCheckIns() {
  const before = pendingCheckIns().length;
  if (!before) return;
  const results = await flushCheckIns();
  reportFlush(results);
  const left = pendingCheckIns().length;
  if (left && left === before && !results.length) toast(L(`${left} check-in(s) still waiting. Check the internet connection, and that you still have access.`, `${left} चेक-इन अभी इंतज़ार में हैं। इंटरनेट और अपनी पहुँच जाँचें।`), 'bad');
}
/* the banner on the check-in page while scans wait on this device; empty when nothing waits */
function queuedBanner() {
  const n = pendingCheckIns().length;
  if (!n) return '';
  return card(L('Waiting to sync', 'सिंक का इंतज़ार'), 'clock', '', `<div style="padding:4px 18px 16px"><p style="margin:0 0 10px">${esc(L(`${n} check-in(s) are saved on this device and not yet with the gym. They are sent when the connection and your access are back.`, `${n} चेक-इन इस डिवाइस पर सेव हैं, जिम तक अभी नहीं पहुँचे। इंटरनेट और पहुँच वापस आने पर ये भेजे जाएँगे।`))}</p><button class="btn primary sm" data-act="syncCheckIns">${ic('check')} ${esc(L('Sync now', 'अभी सिंक करें'))}</button></div>`);
}

/* member side: the pass shown on the home page (made in the browser, works offline) */
function memberPassCard(m) {
  return card(L('My check-in pass', 'मेरा चेक-इन पास'), 'door', '', `<div style="padding:4px 18px 18px;text-align:center"><div class="qrbox">${qrSvg(passCode(m), 240)}</div><p class="muted" style="margin:10px 0 0">${esc(L('Show this QR at the front desk to check in. Turn the screen brightness up.', 'चेक-इन के लिए रिसेप्शन पर यह QR दिखाएँ। स्क्रीन की रोशनी बढ़ा लें।'))}</p></div>`);
}

/* staff side: one scan is a check-in, or a check-out if the member is already inside today (not within 2 minutes) */
async function scanCheckIn(text) {
  const mt = PASS_RE.exec(String(text || '').trim());
  if (!mt) { toast(L('This is not a GymOS pass', 'यह GymOS पास नहीं है'), 'bad'); return false; }
  if (gymLocked(CTX.gym)) { toast(L('Subscription expired. Please renew to make changes.', 'सब्सक्रिप्शन खत्म हो गया है। बदलाव के लिए रिन्यू करें।'), 'bad'); return false; }
  const id = mt[1].toLowerCase(), store = safeStore();
  let members, visits;
  try {
    bust('members', 'visits');
    [members, visits] = await Promise.all([Q.members(), Q.visits()]);
    rosterSave(store, members, visits);
  } catch (e) {
    if (e && e.status === 401) return false;
    if (!(e && e.status === 0)) { toast(friendlyError(e), 'bad'); return false; }
    const snap = rosterLoad(store, gymId());
    if (!snap) { toast(L('No connection, and members are not loaded on this device yet. Connect once first.', 'इंटरनेट नहीं है, और इस डिवाइस पर सदस्य अभी लोड नहीं हैं। पहले एक बार कनेक्ट करें।'), 'bad'); return false; }
    members = snap.members; visits = snap.visits;
  }
  const m = members.find((x) => x.id === id);
  if (!m) { toast(L('This member is not in your gym', 'यह सदस्य आपके जिम का नहीं है'), 'bad'); return false; }
  const s = memberState(m);
  if (['Expired', 'Frozen', 'Cancelled'].includes(s)) { toast(`${m.name}: ${LANG === 'hi' && STATE_HI[s] ? STATE_HI[s] : s}`, 'bad'); return false; }
  const plan = planScan(visits, outboxRead(store), id, todayISO(), Date.now());
  if (plan.action === 'repeat') { toast(L(`${m.name} is already checked in`, `${m.name} पहले से चेक-इन है`)); return true; }
  const now = new Date().toISOString(), key = newVisitId();
  const entry = plan.action === 'in'
    ? { key, type: 'in', id: key, gym_id: gymId(), member_id: id, in_at: now }
    : { key, type: 'out', gym_id: gymId(), visit_id: plan.id, out_at: now };
  if (!outboxWrite(store, [...outboxRead(store), entry])) { toast(L('This device cannot store the check-in. Free some browser storage and scan again.', 'इस डिवाइस में चेक-इन सेव नहीं हो सकता। ब्राउज़र की जगह खाली करके फिर स्कैन करें।'), 'bad'); return false; }
  const mine = (await flushCheckIns()).find((r) => r.key === key);
  bust('visits');
  if (mine && mine.outcome === 'dropped') { toast(mine.msg, 'bad'); return false; }
  if (outboxRead(store).some((x) => x.key === key)) toast(L(`${m.name}: saved on this device, will sync when online`, `${m.name}: इस डिवाइस पर सेव, इंटरनेट आने पर सिंक होगा`));
  else toast(plan.action === 'in' ? L(`${m.name} checked in`, `${m.name} चेक-इन`) : L(`${m.name} checked out`, `${m.name} चेक-आउट`));
  render();
  setTimeout(() => { const i = $('#scanIn'); if (i) i.focus(); }, 250);
  return true;
}

/* camera scanner, where the browser has a built-in QR reader (Chrome on Android and desktop); otherwise the code box below still works */
const canScanCamera = () => 'BarcodeDetector' in window && !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
async function openScanner() {
  if (!canScanCamera()) { toast(L('This browser cannot scan with the camera. Use Chrome, or a barcode scanner with the code box.', 'यह ब्राउज़र कैमरे से स्कैन नहीं कर सकता। Chrome चलाएँ, या कोड बॉक्स में बारकोड स्कैनर इस्तेमाल करें।'), 'bad'); return; }
  let stream;
  try { stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false }); } catch (e) { toast(L('Camera permission was not given', 'कैमरे की अनुमति नहीं मिली'), 'bad'); return; }
  const mod = openModal({ title: L('Scan member pass', 'सदस्य का पास स्कैन करें'), body: `<video id="scanVid" playsinline muted style="width:100%;border-radius:10px;background:#000"></video><p class="muted" style="margin:8px 0 0">${esc(L('Hold the member\'s QR in front of the camera.', 'सदस्य का QR कैमरे के सामने रखें।'))}</p>` });
  const vid = $('#scanVid', mod.el); vid.srcObject = stream; try { await vid.play(); } catch (e) { /* the user may have closed the window */ }
  const det = new window.BarcodeDetector({ formats: ['qr_code'] });
  let busy = false;
  const stop = () => stream.getTracks().forEach((t) => t.stop());
  const loop = async () => {
    if (!mod.el.isConnected) { stop(); return; }
    if (!busy) { try { const found = await det.detect(vid); if (found.length) { busy = true; const ok = await scanCheckIn(found[0].rawValue); if (ok && mod.el.isConnected) mod.close(); else setTimeout(() => { busy = false; }, 2500); } } catch (e) { /* a frame that cannot be read is skipped */ } }
    setTimeout(loop, 300);
  };
  loop();
}

/* a barcode scanner that types the code and presses Enter (a "keyboard wedge" scanner) fills this box */
document.addEventListener('keydown', async (e) => {
  if (e.key !== 'Enter' || !e.target || e.target.id !== 'scanIn') return;
  e.preventDefault(); const v = e.target.value; e.target.value = ''; if (v.trim()) await scanCheckIn(v);
});

/* start-up: send anything queued when the connection returns, when the app comes back to the screen, and once shortly after start */
function checkinInit() {
  const again = () => flushCheckIns().then(reportFlush).catch(() => {});
  window.addEventListener('online', again);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') again(); });
  setTimeout(again, 4000);
}
