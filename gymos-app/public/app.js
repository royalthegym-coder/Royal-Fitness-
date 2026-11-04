'use strict';
/* GymOS · Royal The Gym — a dependency-free client for the Supabase project (Auth + PostgREST).
   Security model: this file holds ONLY the public publishable key. Every permission is enforced by Postgres row level security. */
const CFG = (window.GYMOS_CONFIG = Object.assign({
  url: 'https://ayoeevltbubkyhixqqlg.supabase.co',
  key: 'sb_publishable_lCd7sizYZfkfaQpPx3zFcA_zEGtdjJA',
}, window.GYMOS_CONFIG || {}));

/* ---------- tiny helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = (n) => String(n).padStart(2, '0');
const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
const sum = (a, f) => a.reduce((s, x) => s + Number(f(x) || 0), 0);
/* India has no DST: shift by a fixed +05:30 so results do not depend on the viewer's timezone */
const istDate = (d = new Date()) => { const x = new Date(new Date(d).getTime() + 19800000); return `${x.getUTCFullYear()}-${pad(x.getUTCMonth() + 1)}-${pad(x.getUTCDate())}`; };
const istParts = (d) => { const x = new Date(new Date(d).getTime() + 19800000); return { dow: x.getUTCDay(), hour: x.getUTCHours(), min: x.getUTCMinutes() }; };
const todayISO = () => istDate();
const ymd = (s) => String(s).slice(0, 10).split('-').map(Number);
const diffDays = (a, b) => { const A = ymd(a), B = ymd(b); return Math.round((Date.UTC(B[0], B[1] - 1, B[2]) - Date.UTC(A[0], A[1] - 1, A[2])) / 864e5); };
const addDays = (s, n) => { const [y, m, d] = ymd(s); const t = new Date(Date.UTC(y, m - 1, d + n)); return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`; };
const addMonths = (s, n) => { const [y, m, d] = ymd(s); const t = new Date(Date.UTC(y, m - 1 + n, 1)); const last = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + 1, 0)).getUTCDate(); return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(Math.min(d, last))}`; };
const monthKey = (s) => String(s).slice(0, 7);
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fmtDate = (s) => { if (!s) return '—'; const [y, m, d] = ymd(String(s).length > 10 ? istDate(s) : s); return `${d} ${MON[m - 1]} ${y}`; };
const fmtShort = (s) => { if (!s) return '—'; const [, m, d] = ymd(String(s).length > 10 ? istDate(s) : s); return `${d} ${MON[m - 1]}`; };
const fmtTime = (iso) => { if (!iso) return '—'; const { hour, min } = istParts(iso); return `${hour % 12 || 12}:${pad(min)} ${hour < 12 ? 'am' : 'pm'}`; };
const inr = (v) => { const n = Number(v || 0); return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2, minimumFractionDigits: Number.isInteger(n) ? 0 : 2 }).format(n); };
const initials = (n) => String(n || '?').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
const waLink = (phone, text) => { const dg = String(phone || '').replace(/\D/g, ''); return `https://wa.me/${dg.length === 10 ? '91' + dg : dg}?text=${encodeURIComponent(text)}`; };
const isUUID = (v) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(v || ''));
const csvCell = (v) => { let s = String(v ?? ''); if (/^[=+\-@]/.test(s) && isNaN(Number(s))) s = "'" + s; return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };

/* ---------- language ---------- */
let LANG = 'hi';
try { LANG = localStorage.getItem('gymos-lang') || 'hi'; } catch (e) {}
const L = (en, hi) => (LANG === 'hi' ? hi : en);

/* ---------- subscription lock (mirrors private.gym_is_open in the database; the database is the authority) ---------- */
function gymLocked(g) {
  if (!g) return false;
  if (g.lock_override === 'force_unlock') return false;
  if (g.lock_override === 'force_lock') return true;
  if (g.status === 'suspended') return true;
  return !!g.subscription_ends_on && g.subscription_ends_on < todayISO();
}

/* ---------- Supabase client: Auth (GoTrue) + PostgREST over fetch ---------- */
const SESSION_KEY = 'gymos-session';
let SESSION = null;
try { SESSION = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch (e) {}
const saveSession = (s) => { SESSION = s; try { s ? localStorage.setItem(SESSION_KEY, JSON.stringify(s)) : localStorage.removeItem(SESSION_KEY); } catch (e) {} };
const jwtPayload = (t) => { try { return JSON.parse(atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))); } catch (e) { return {}; } };

class ApiError extends Error { constructor(message, status, code, detail) { super(message); this.status = status; this.code = code; this.detail = detail; } }
/* PostgREST / Postgres error → a message a gym owner can act on */
function friendlyError(e) {
  if (!e) return L('Something went wrong.', 'कुछ गड़बड़ हुई।');
  if (e.friendly) return e.friendly;
  const msg = String(e.message || ''), code = e.code || '';
  if (e.status === 0) return L('No connection. Check the internet and try again.', 'कनेक्शन नहीं है। इंटरनेट जाँचकर फिर कोशिश करें।');
  if (code === '42501' || /row-level security|permission denied|not allowed|super admin only/i.test(msg)) return CTX.locked
    ? L('Subscription expired. Please renew to make changes.', 'सब्सक्रिप्शन खत्म हो गया है। बदलाव के लिए रिन्यू करें।')
    : L('You do not have permission for this.', 'आपको इसकी अनुमति नहीं है।');
  if (code === '23505') return L('This already exists.', 'यह पहले से मौजूद है।');
  if (code === '23503') return L('This is linked to other records and cannot be removed.', 'यह दूसरे रिकॉर्ड से जुड़ा है, हटाया नहीं जा सकता।');
  if (code === '23514') return L('A value is out of the allowed range.', 'कोई मान अनुमत सीमा से बाहर है।');
  if (code === '23502') return L('A required field is missing.', 'ज़रूरी जानकारी छूट गई है।');
  if (/invalid login credentials/i.test(msg)) return L('Wrong email or password.', 'ईमेल या पासवर्ड ग़लत है।');
  return L('Could not complete this. Try again.', 'यह नहीं हो सका। फिर कोशिश करें।');
}
async function rawFetch(path, opts = {}) {
  let res;
  try { res = await fetch(CFG.url + path, opts); } catch (e) { throw new ApiError('network', 0, 'network'); }
  return res;
}
async function refreshSession() {
  if (!SESSION || !SESSION.refresh_token) return false;
  const res = await rawFetch('/auth/v1/token?grant_type=refresh_token', { method: 'POST', headers: { apikey: CFG.key, 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh_token: SESSION.refresh_token }) });
  if (!res.ok) { saveSession(null); return false; }
  const j = await res.json();
  saveSession({ access_token: j.access_token, refresh_token: j.refresh_token, expires_at: Math.floor(Date.now() / 1000) + (j.expires_in || 3600), user_id: jwtPayload(j.access_token).sub, email: (j.user && j.user.email) || SESSION.email });
  return true;
}
async function api(path, { method = 'GET', body, headers = {}, retry = true } = {}) {
  if (SESSION && SESSION.expires_at && SESSION.expires_at - 30 < Date.now() / 1000) await refreshSession();
  const h = { apikey: CFG.key, Authorization: 'Bearer ' + ((SESSION && SESSION.access_token) || CFG.key), ...headers };
  if (body !== undefined) h['Content-Type'] = 'application/json';
  const res = await rawFetch(path, { method, headers: h, body: body === undefined ? undefined : JSON.stringify(body) });
  if (res.status === 401 && retry && SESSION && (await refreshSession())) return api(path, { method, body, headers, retry: false });
  if (res.status === 401) { saveSession(null); if (typeof onSignedOut === 'function') onSignedOut(); throw new ApiError('session expired', 401, 'jwt'); }
  if (!res.ok) { let j = {}; try { j = await res.json(); } catch (e) {} throw new ApiError(j.message || j.msg || res.statusText, res.status, j.code || String(res.status), j.details || j.hint); }
  if (res.status === 204) return null;
  const t = await res.text();
  return t ? JSON.parse(t) : null;
}
const qs = (o) => Object.entries(o).filter(([, v]) => v !== undefined && v !== null && v !== '').map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
const DB = {
  /* select(table, {select, eq:{col:val}, filters:{col:'gte.5'}, order:'col.desc', limit}) */
  select: (table, { select = '*', eq = {}, filters = {}, order, limit } = {}) => {
    const f = {}; Object.entries(eq).forEach(([k, v]) => (f[k] = 'eq.' + v)); Object.assign(f, filters);
    return api(`/rest/v1/${table}?${qs({ select, ...f, order, limit })}`);
  },
  insertMany: (table, rows) => api(`/rest/v1/${table}`, { method: 'POST', body: rows, headers: { Prefer: 'return=representation' } }),
  insert: async (table, row) => (await api(`/rest/v1/${table}`, { method: 'POST', body: row, headers: { Prefer: 'return=representation' } }))[0],
  update: async (table, id, patch) => { const r = await api(`/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`, { method: 'PATCH', body: patch, headers: { Prefer: 'return=representation' } }); if (!r || !r.length) throw new ApiError('not allowed', 403, '42501'); return r[0]; },
  remove: (table, id) => api(`/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' }),
  rpc: (fn, args = {}) => api(`/rest/v1/rpc/${fn}`, { method: 'POST', body: args }),
};
/* Edge function: a gym admin creates a trainer/member login for their own gym (service key stays on the server) */
const FN_ERR = { locked: ['Subscription expired. Renew to add logins.', 'सब्सक्रिप्शन खत्म है। लॉगिन जोड़ने के लिए रिन्यू करें।'], email_taken: ['This email already has an account.', 'इस ईमेल का अकाउंट पहले से है।'], already_linked: ['This member already has a login.', 'इस सदस्य का लॉगिन पहले से है।'], bad_email: ['Enter a valid email.', 'सही ईमेल लिखें।'], forbidden: ['Only a gym admin can do this.', 'यह सिर्फ़ जिम एडमिन कर सकता है।'] };
async function createAccount(body) {
  if (SESSION && SESSION.expires_at && SESSION.expires_at - 30 < Date.now() / 1000) await refreshSession();
  const res = await rawFetch('/functions/v1/create-account', { method: 'POST', headers: { apikey: CFG.key, Authorization: 'Bearer ' + (SESSION && SESSION.access_token), 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const j = await res.json().catch(() => ({}));
  if (res.status === 401) { saveSession(null); if (typeof onSignedOut === 'function') onSignedOut(); throw new ApiError('session expired', 401, 'jwt'); }
  if (!res.ok) { const m = FN_ERR[j.error]; const e = new ApiError(m ? L(m[0], m[1]) : 'failed', res.status, 'fn'); e.friendly = m ? L(m[0], m[1]) : null; throw e; }
  return j;
}
const Auth = {
  async signIn(email, password) {
    const res = await rawFetch('/auth/v1/token?grant_type=password', { method: 'POST', headers: { apikey: CFG.key, 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) throw new ApiError(j.msg || j.error_description || j.message || 'Invalid login credentials', res.status, j.error_code || 'auth');
    saveSession({ access_token: j.access_token, refresh_token: j.refresh_token, expires_at: Math.floor(Date.now() / 1000) + (j.expires_in || 3600), user_id: jwtPayload(j.access_token).sub, email });
  },
  async changePassword(password) { await api('/auth/v1/user', { method: 'PUT', body: { password } }); },
  async signOut() { try { if (SESSION) await rawFetch('/auth/v1/logout', { method: 'POST', headers: { apikey: CFG.key, Authorization: 'Bearer ' + SESSION.access_token } }); } catch (e) {} saveSession(null); },
};

/* ---------- context shared by all screens ---------- */
const CTX = { profile: null, gym: null, locked: false };
/* ---------- icons ---------- */
const ICONS = {
  home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
  door: '<path d="M13 4h3a2 2 0 0 1 2 2v14"/><path d="M2 20h3M13 20h9M10 12v.01"/><path d="M13 4.56v16.16a1 1 0 0 1-1.24.97L5 20V5.56a2 2 0 0 1 1.5-1.94l4-1A2 2 0 0 1 13 4.56Z"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  receipt: '<path d="M4 2v20l3-2 3 2 3-2 3 2 3-2V2z"/><path d="M8 7h8M8 11h8M8 15h5"/>',
  wallet: '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
  tag: '<path d="M12.59 2.59A2 2 0 0 0 11.17 2H4a2 2 0 0 0-2 2v7.17a2 2 0 0 0 .59 1.41l8.7 8.7a2.43 2.43 0 0 0 3.42 0l6.58-6.58a2.43 2.43 0 0 0 0-3.42z"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>', x: '<path d="M18 6 6 18M6 6l12 12"/>',
  check: '<path d="M20 6 9 17l-5-5"/>', left: '<path d="m15 18-6-6 6-6"/>', right: '<path d="m9 18 6-6-6-6"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>', msg: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20"/>',
  crown: '<path d="M3 8l4 4 5-7 5 7 4-4-2 11H5z"/>', clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  pencil: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  shield: '<path d="M12 2 4 5v6c0 5 3.5 9 8 11 4.5-2 8-6 8-11V5z"/><path d="m9 12 2 2 4-4"/>',
  pulse: '<path d="M3 12h4l3-8 4 16 3-8h4"/>', chart: '<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/>',
  building: '<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2"/>',
  lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
  down: '<path d="M12 3v12m0 0-4-4m4 4 4-4M4 21h16"/>', out: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
};
const ic = (n) => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ''}</svg>`;

/* ---------- toast + modal ---------- */
function toast(msg, kind) {
  const el = document.createElement('div');
  el.className = 'toast' + (kind === 'bad' ? ' bad' : '');
  el.setAttribute('role', 'status'); el.textContent = msg;
  $('#toasts').appendChild(el);
  setTimeout(() => el.remove(), kind === 'bad' ? 6000 : 2800);
}
const MODALS = [];
function openModal({ title, body, footer = '', wide = false, onClose }) {
  const prev = document.activeElement;
  const ov = document.createElement('div');
  ov.className = 'ov';
  ov.innerHTML = `<div class="md${wide ? ' wide' : ''}" role="dialog" aria-modal="true" aria-label="${esc(title)}"><header><h2>${esc(title)}</h2><button type="button" class="btn ghost ibtn" data-x aria-label="${esc(L('Close', 'बंद करें'))}">${ic('x')}</button></header><div class="mb">${body}</div>${footer ? `<footer>${footer}</footer>` : ''}</div>`;
  $('#modals').appendChild(ov); MODALS.push(ov);
  const api2 = { el: ov, close() { if (!ov.isConnected) return; ov.remove(); const i = MODALS.indexOf(ov); if (i >= 0) MODALS.splice(i, 1); if (onClose) onClose(); if (prev && prev.focus && prev.isConnected) prev.focus(); } };
  ov.addEventListener('mousedown', (e) => { if (e.target === ov) api2.close(); });
  $('[data-x]', ov).addEventListener('click', api2.close);
  const first = $('input:not([type=hidden]),select,textarea', ov);
  (first || $('[data-x]', ov)).focus();
  return api2;
}
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && MODALS.length) MODALS[MODALS.length - 1].querySelector('[data-x]').click(); });
const closeAllModals = () => { while (MODALS.length) MODALS[MODALS.length - 1].querySelector('[data-x]').click(); };
function askConfirm(msg, label, tone) {
  return new Promise((resolve) => {
    let done = false;
    const m = openModal({ title: L('Please confirm', 'पक्का करें'), body: `<p style="margin:0">${esc(msg)}</p>`, footer: `<button type="button" class="btn" data-no>${esc(L('Cancel', 'रद्द करें'))}</button><button type="button" class="btn ${tone === 'primary' ? 'primary' : 'danger'}" data-yes>${esc(label || L('Confirm', 'पक्का'))}</button>`, onClose: () => { if (!done) resolve(false); } });
    $('[data-no]', m.el).onclick = () => { done = true; m.close(); resolve(false); };
    $('[data-yes]', m.el).onclick = () => { done = true; m.close(); resolve(true); };
  });
}

/* ---------- forms ---------- */
function fieldHtml(f, v) {
  const id = 'f_' + f.k, val = v[f.k] ?? f.def ?? '';
  let inner;
  if (f.type === 'select') inner = `<select class="sel" id="${id}">${f.options.map((o) => `<option value="${esc(o.v)}"${String(o.v) === String(val) ? ' selected' : ''}>${esc(o.l)}</option>`).join('')}</select>`;
  else if (f.type === 'textarea') inner = `<textarea class="ta" id="${id}" placeholder="${esc(f.ph || '')}">${esc(val)}</textarea>`;
  else if (f.type === 'check') return `<label class="ck fl${f.full ? ' full' : ''}"><input type="checkbox" id="${id}"${val ? ' checked' : ''}> ${esc(f.label)}</label>`;
  else inner = `<input class="in" id="${id}" type="${f.type || 'text'}" value="${esc(val)}" placeholder="${esc(f.ph || '')}"${f.type === 'number' ? ` step="${f.step || 'any'}" min="${f.min ?? 0}" inputmode="decimal"` : ''}${f.type === 'tel' ? ' inputmode="tel" autocomplete="off"' : ''}${f.type === 'password' ? ' autocomplete="new-password"' : ''}${f.type === 'email' ? ' autocomplete="username"' : ''}${!f.type || f.type === 'text' || f.type === 'tel' || f.type === 'number' || f.type === 'date' ? ' autocomplete="off"' : ''}>`;
  return `<label class="fl${f.full ? ' full' : ''}"><span>${esc(f.label)}${f.req ? ' *' : ''}</span>${inner}<small class="err" id="e_${f.k}"></small></label>`;
}
function readForm(root, fields) {
  const out = {}; let ok = true;
  fields.forEach((f) => {
    const el = $('#f_' + f.k, root), er = $('#e_' + f.k, root); if (!el) return;
    let v = f.type === 'check' ? el.checked : el.value.trim();
    if (f.type === 'number') v = v === '' ? '' : parseFloat(v);
    let msg = '';
    if (f.req && (v === '' || v === null || Number.isNaN(v))) msg = L('Required', 'ज़रूरी है');
    else if (f.type === 'number' && v !== '' && (Number.isNaN(v) || v < (f.min ?? 0))) msg = L('Enter a valid number', 'सही संख्या लिखें');
    else if (f.type === 'tel' && v && String(v).replace(/\D/g, '').length < 10) msg = L('Enter a 10-digit number', '10 अंकों का नंबर लिखें');
    else if (f.type === 'email' && v && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) msg = L('Enter a valid email', 'सही ईमेल लिखें');
    else if (f.check) msg = f.check(v, out) || '';
    if (er) er.textContent = msg;
    if (msg) ok = false;
    out[f.k] = v;
  });
  return ok ? out : null;
}
function openForm({ title, fields, values = {}, submitLabel, onSubmit, extra = '', wide = false }) {
  const m = openModal({ title, wide, body: `<form id="mf" novalidate><div class="fg">${fields.map((f) => fieldHtml(f, values)).join('')}</div>${extra}</form>`, footer: `<button type="button" class="btn" data-no>${esc(L('Cancel', 'रद्द करें'))}</button><button type="button" class="btn primary" data-ok>${esc(submitLabel || L('Save', 'सेव करें'))}</button>` });
  const btn = $('[data-ok]', m.el);
  const go = async () => {
    const vals = readForm(m.el, fields);
    if (!vals) { const bad = $('.err:not(:empty)', m.el); if (bad) bad.closest('label').querySelector('input,select,textarea')?.focus(); return; }
    btn.disabled = true;
    try { const r = await onSubmit(vals, m); if (r !== false) m.close(); } catch (e) { toast(friendlyError(e), 'bad'); } finally { btn.disabled = false; }
  };
  btn.onclick = go; $('[data-no]', m.el).onclick = m.close;
  $('#mf', m.el).addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') { e.preventDefault(); go(); } });
  $('#mf', m.el).addEventListener('submit', (e) => e.preventDefault());
  return m;
}
const opts = (arr) => arr.map((x) => (typeof x === 'string' ? { v: x, l: x } : x));

/* ---------- view building blocks ---------- */
const pageHead = (eyebrow, title, sub, actions) => `<div class="ph"><div><div class="eye">${esc(eyebrow)}</div><h1>${esc(title)}</h1>${sub ? `<p>${esc(sub)}</p>` : ''}</div>${actions ? `<div class="acts">${actions}</div>` : ''}</div>`;
const card = (title, icon, link, body, cls) => `<section class="card ${cls || ''}"><h2><span style="display:flex;gap:8px;align-items:center">${ic(icon)}${esc(title)}</span>${link || ''}</h2>${body}</section>`;
const empty = (title, text, btn) => `<div class="empty"><b>${esc(title)}</b>${text ? esc(text) : ''}${btn ? `<div style="margin-top:12px">${btn}</div>` : ''}</div>`;
const tile = (label, value, sub, color) => `<div class="card tile"><div class="l">${esc(label)}</div><div class="v"${color ? ` style="color:${color}"` : ''}>${value}</div>${sub ? `<div class="s">${sub}</div>` : ''}</div>`;
const chipsHtml = (key, cur, items) => `<div class="chips" role="tablist">${items.map(([v, label, n]) => `<button class="chip" role="tab" aria-selected="${cur === v}" data-act="chip" data-key="${key}" data-v="${esc(v)}">${esc(label)}${n != null ? `<span class="c">${n}</span>` : ''}</button>`).join('')}</div>`;
const searchBox = (id, val, ph) => `<div class="srch">${ic('search')}<input class="in" id="${id}" data-bind="${id}" value="${esc(val)}" placeholder="${esc(ph)}" aria-label="${esc(ph)}" autocomplete="off"></div>`;
const avatar = (n) => `<span class="av">${esc(initials(n))}</span>`;
const TONE = { Active: 'ok', Expiring: 'warn', Expired: 'bad', Frozen: 'info', Cancelled: 'mute', Paid: 'ok', Partial: 'warn', Unpaid: 'info', Overdue: 'bad' };
const STATE_HI = { Active: 'सक्रिय', Expiring: 'खत्म होने वाली', Expired: 'खत्म', Frozen: 'फ़्रीज़', Cancelled: 'रद्द', Paid: 'चुकाया', Partial: 'आंशिक', Unpaid: 'बाक़ी', Overdue: 'देर' };
const badge = (label, tone) => `<span class="badge ${tone || TONE[label] || 'mute'}">${esc(LANG === 'hi' && STATE_HI[label] ? STATE_HI[label] : label)}</span>`;
const PAGE = 15;
const pagerHtml = (total, page, key) => { if (total <= PAGE) return ''; const pages = Math.ceil(total / PAGE); return `<div class="pager"><span class="num">${(page - 1) * PAGE + 1}–${Math.min(page * PAGE, total)} / ${total}</span><span style="display:flex;gap:6px"><button class="btn sm" data-act="page" data-key="${key}" data-d="-1" ${page <= 1 ? 'disabled' : ''} aria-label="Previous">${ic('left')}</button><button class="btn sm" data-act="page" data-key="${key}" data-d="1" ${page >= pages ? 'disabled' : ''} aria-label="Next">${ic('right')}</button></span></div>`; };
const loadingHtml = () => `<div role="status" aria-live="polite"><span class="sr">${esc(L('Loading…', 'लोड हो रहा है…'))}</span><div class="skel" style="width:40%;height:28px;margin-bottom:22px"></div><div class="card" style="padding:18px">${'<div class="skel" style="margin:12px 0"></div>'.repeat(5)}</div></div>`;
async function copyText(text, okMsg) {
  try { await navigator.clipboard.writeText(text); toast(okMsg || L('Copied', 'कॉपी हो गया')); return; } catch (e) {}
  const m = openModal({ title: L('Copy this text', 'यह टेक्स्ट कॉपी करें'), body: `<textarea class="ta" id="cpt" readonly style="min-height:90px">${esc(text)}</textarea>` });
  const ta = $('#cpt', m.el); ta.focus(); ta.select();
}
function downloadCsv(filename, rows) {
  const data = '﻿' + rows.map((r) => r.map(csvCell).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([data], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000);
}
/* ---------- data layer: cached reads, derived values ---------- */
const CACHE = new Map();
const cached = (name, loader) => { if (!CACHE.has(name)) CACHE.set(name, loader().catch((e) => { CACHE.delete(name); throw e; })); return CACHE.get(name); };
const bust = (...names) => (names.length ? names.forEach((n) => CACHE.delete(n)) : CACHE.clear());
const sinceISO = (days) => new Date(Date.now() - days * 864e5).toISOString();
const Q = {
  members: () => cached('members', () => DB.select('members', { order: 'name.asc', limit: 5000 })),
  plans: () => cached('plans', () => DB.select('plans', { order: 'months.asc', limit: 500 })),
  invoices: () => cached('invoices', () => DB.select('invoices', { order: 'date.desc', limit: 5000 })),
  payments: () => cached('payments', () => DB.select('payments', { order: 'paid_on.desc,created_at.desc', limit: 5000 })),
  visits: () => cached('visits', () => DB.select('visits', { filters: { in_at: 'gte.' + sinceISO(90) }, order: 'in_at.desc', limit: 10000 })),
  ledger: () => cached('ledger', () => DB.select('payment_ledger', { order: 'seq.desc', limit: 5000 })),
  gyms: () => cached('gyms', () => DB.select('gyms', { order: 'created_at.asc' })),
  profiles: () => cached('profiles', () => DB.select('profiles', { order: 'created_at.asc', limit: 2000 })),
  audit: () => cached('audit', () => DB.select('audit_log', { order: 'at.desc', limit: 100 })),
  overview: () => cached('overview', () => DB.rpc('admin_gym_overview')),
};
const memberMap = (list) => new Map(list.map((m) => [m.id, m]));
const planMap = (list) => new Map(list.map((p) => [p.id, p]));
function paidByInvoice(payments) { const m = new Map(); payments.forEach((p) => m.set(p.invoice_id, round2((m.get(p.invoice_id) || 0) + Number(p.amount)))); return m; }
const balanceOf = (inv, paid) => (inv.cancelled ? 0 : Math.max(round2(Number(inv.total) - (paid.get(inv.id) || 0)), 0));
const invStatus = (inv, paid) => (inv.cancelled ? 'Cancelled' : balanceOf(inv, paid) <= 0.004 ? 'Paid' : (paid.get(inv.id) || 0) > 0 ? 'Partial' : 'Unpaid');
const isOverdue = (inv, paid) => ['Unpaid', 'Partial'].includes(invStatus(inv, paid)) && inv.due && inv.due < todayISO();
function duesByMember(invoices, paid) { const m = new Map(); invoices.forEach((i) => { const b = balanceOf(i, paid); if (b > 0.004) m.set(i.member_id, round2((m.get(i.member_id) || 0) + b)); }); return m; }
function lastVisitMap(visits) { const m = new Map(); visits.forEach((v) => { const d = istDate(v.in_at); if (!m.has(v.member_id) || m.get(v.member_id) < d) m.set(v.member_id, d); }); return m; }
function visitDaysMap(visits) { const m = new Map(); visits.forEach((v) => { if (!m.has(v.member_id)) m.set(v.member_id, new Set()); m.get(v.member_id).add(istDate(v.in_at)); }); return m; }
function memberState(m) {
  if (m.status === 'Frozen') return 'Frozen';
  if (m.status === 'Cancelled') return 'Cancelled';
  if (!m.end_date) return 'Active';
  const left = diffDays(todayISO(), m.end_date);
  return left < 0 ? 'Expired' : left <= 7 ? 'Expiring' : 'Active';
}
const daysLeft = (m) => (m.end_date ? diffDays(todayISO(), m.end_date) : null);
const STATE_FILTERS = ['Active', 'Expiring', 'Expired', 'Frozen', 'Cancelled'];

/* invoice maths: GST on the amount after discount; rounded to paise */
function computeInvoice(items, discount, gstPct) {
  const subtotal = round2(sum(items, (i) => i.amount));
  const disc = Math.min(Math.max(Number(discount || 0), 0), subtotal);
  const base = round2(subtotal - disc);
  const gst_amt = round2((base * Number(gstPct || 0)) / 100);
  return { subtotal, discount: disc, gst_pct: Number(gstPct || 0), gst_amt, total: round2(base + gst_amt) };
}
const gymId = () => CTX.profile.gym_id;
const roleName = (r) => ({ super_admin: L('Super admin', 'सुपर एडमिन'), gym_admin: L('Gym admin', 'जिम एडमिन'), trainer: L('Trainer', 'ट्रेनर'), member: L('Member', 'सदस्य') }[r] || r);

/* Write wrapper: surfaces a friendly toast, returns the result or null */
async function act(fn, okMsg) {
  try { const r = await fn(); if (okMsg) toast(okMsg); return r === undefined || r === null ? true : r; /* void RPCs return 204/null */ } catch (e) { if (e && e.status === 401) return null; toast(friendlyError(e), 'bad'); return null; }
}
/* ================= Super admin ================= */
const UPI_RE = /^[A-Za-z0-9._-]{2,}@[A-Za-z]{2,}$/;
async function vSuperGyms() {
  const rows = await Q.overview();
  const lockBadge = (g) => (g.locked ? badge(L('Locked', 'लॉक'), 'bad') : badge(L('Open', 'खुला'), 'ok'));
  const ovr = (g) => (g.lock_override === 'none' ? '' : `<br><small class="muted">${esc(g.lock_override === 'force_lock' ? L('forced lock', 'जबरन लॉक') : L('forced open', 'जबरन खुला'))}</small>`);
  return pageHead(L('Super admin', 'सुपर एडमिन'), L('Gyms', 'जिम'), L('Every gym, its subscription and lock. Member and payment details are not visible here.', 'हर जिम, उसकी सदस्यता और लॉक। सदस्य और भुगतान का ब्योरा यहाँ नहीं दिखता।'), `<button class="btn primary" data-act="newGym">${ic('plus')} ${esc(L('New gym', 'नया जिम'))}</button>`)
    + `<div class="tiles">${tile(L('Gyms', 'जिम'), rows.length)}${tile(L('Locked now', 'अभी लॉक'), rows.filter((g) => g.locked).length, '', rows.some((g) => g.locked) ? 'var(--crimson)' : '')}${tile(L('Members in total', 'कुल सदस्य'), sum(rows, (g) => g.members))}${tile(L('Ending in 7 days', '7 दिन में खत्म'), rows.filter((g) => g.subscription_ends_on && diffDays(todayISO(), g.subscription_ends_on) >= 0 && diffDays(todayISO(), g.subscription_ends_on) <= 7).length)}</div>`
    + `<div class="card">${rows.length ? `<div class="tw"><table class="t"><thead><tr><th>${esc(L('Gym', 'जिम'))}</th><th>${esc(L('Plan', 'प्लान'))}</th><th>${esc(L('Valid till', 'तारीख़ तक'))}</th><th>${esc(L('State', 'स्थिति'))}</th><th class="r">${esc(L('Members', 'सदस्य'))}</th><th class="r">${esc(L('Staff', 'स्टाफ़'))}</th><th>${esc(L('Last visit', 'आख़िरी विज़िट'))}</th><th></th></tr></thead><tbody>${rows.map((g) => `<tr><td class="edge ${g.locked ? 'e-bad' : 'e-ok'}"><b>${esc(g.name)}</b><br><small class="muted">${esc(g.city || '')}</small></td><td>${esc(g.plan)}${g.status === 'suspended' ? '<br>' + badge(L('Suspended', 'निलंबित'), 'warn') : ''}</td><td class="num">${esc(fmtDate(g.subscription_ends_on))}</td><td>${lockBadge(g)}${ovr(g)}</td><td class="r num">${g.members}</td><td class="r num">${g.staff}</td><td class="num">${g.last_visit ? esc(fmtShort(g.last_visit)) : '—'}</td><td class="r" style="white-space:nowrap"><button class="btn sm" data-act="extendGym" data-id="${esc(g.gym_id)}">${esc(L('Subscription', 'सब्सक्रिप्शन'))}</button> <button class="btn sm" data-act="lockGym" data-id="${esc(g.gym_id)}">${ic('lock')} ${esc(L('Lock', 'लॉक'))}</button></td></tr>`).join('')}</tbody></table></div>` : empty(L('No gyms yet', 'अभी कोई जिम नहीं'), L('Create the first gym, then assign its admin in Users.', 'पहला जिम बनाएँ, फिर Users में उसका एडमिन तय करें।'), `<button class="btn primary" data-act="newGym">${esc(L('New gym', 'नया जिम'))}</button>`)}</div>`;
}
function gymForm() {
  openForm({
    title: L('New gym', 'नया जिम'),
    fields: [
      { k: 'name', label: L('Gym name', 'जिम का नाम'), req: true, full: true, check: (v) => (v.length < 2 ? L('Too short', 'बहुत छोटा') : '') },
      { k: 'owner', label: L('Owner', 'मालिक') }, { k: 'phone', label: L('Phone', 'फ़ोन'), type: 'tel' },
      { k: 'city', label: L('City', 'शहर') }, { k: 'upi', label: L('Merchant UPI ID', 'मर्चेंट UPI आईडी'), ph: 'name@bank', check: (v) => (v && !UPI_RE.test(v) ? L('Example: name@bank', 'उदाहरण: name@bank') : '') },
      { k: 'ends', label: L('Subscription valid till', 'सब्सक्रिप्शन की तारीख़'), type: 'date', req: true, def: addDays(todayISO(), 30), full: true },
    ],
    onSubmit: async (v) => { const ok = await act(() => DB.rpc('admin_create_gym', { gym_name: v.name, owner: v.owner || null, phone_no: v.phone || null, city_name: v.city || null, upi: v.upi || null, ends_on: v.ends })); if (ok) { bust('overview', 'gyms'); toast(L('Gym created', 'जिम बन गया')); render(); } return !!ok; },
  });
}
async function extendForm(id) {
  const g = (await Q.overview()).find((x) => x.gym_id === id); if (!g) return;
  const start = g.subscription_ends_on && g.subscription_ends_on > todayISO() ? g.subscription_ends_on : todayISO();
  openForm({
    title: `${g.name} · ${L('Subscription', 'सब्सक्रिप्शन')}`,
    fields: [
      { k: 'plan', label: L('Plan', 'प्लान'), type: 'select', options: opts(['trial', 'starter', 'pro']), def: g.plan },
      { k: 'ends', label: L('Valid till', 'तारीख़ तक'), type: 'date', req: true, def: g.subscription_ends_on || addDays(todayISO(), 30) },
      { k: 'status', label: L('Status', 'स्थिति'), type: 'select', options: [{ v: 'active', l: L('Active', 'सक्रिय') }, { v: 'suspended', l: L('Suspended', 'निलंबित') }], def: g.status, full: true },
    ],
    extra: `<div class="row" style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">${[30, 90, 365].map((d) => `<button type="button" class="btn sm" data-quick="${d}">+${d} ${esc(L('days', 'दिन'))}</button>`).join('')}</div>`,
    onSubmit: async (v) => { const ok = await act(() => DB.rpc('admin_set_subscription', { gym: id, plan_name: v.plan, ends_on: v.ends, new_status: v.status }), L('Subscription saved', 'सब्सक्रिप्शन सेव हुआ')); if (ok) { bust('overview', 'gyms', 'audit'); render(); } return !!ok; },
  }).el.addEventListener('click', (e) => { const q = e.target.closest('[data-quick]'); if (q) $('#f_ends').value = addDays(start, Number(q.dataset.quick)); });
}
async function lockForm(id) {
  const g = (await Q.overview()).find((x) => x.gym_id === id); if (!g) return;
  const m = openModal({
    title: `${g.name} · ${L('Lock control', 'लॉक नियंत्रण')}`,
    body: `<p style="margin-top:0">${esc(g.locked ? L('This gym is locked: staff can read but not change data.', 'यह जिम लॉक है: स्टाफ़ पढ़ सकता है, बदल नहीं सकता।') : L('This gym is open.', 'यह जिम खुला है।'))}</p><div class="note">${esc(L('"Reset" lets the subscription date decide again. Forced open ignores an expired date until you reset it.', '"रीसेट" से फिर तारीख़ तय करती है। जबरन खुला रखने पर खत्म तारीख़ अनदेखी होती है, जब तक आप रीसेट न करें।'))}</div>`,
    footer: `<button type="button" class="btn danger" data-o="force_lock">${esc(L('Force lock', 'जबरन लॉक'))}</button><button type="button" class="btn" data-o="force_unlock">${esc(L('Force open', 'जबरन खोलें'))}</button><button type="button" class="btn primary" data-o="none">${esc(L('Reset', 'रीसेट'))}</button>`,
  });
  $$('[data-o]', m.el).forEach((b) => (b.onclick = async () => {
    b.disabled = true;
    const ok = await act(() => DB.rpc('admin_set_gym_lock', { gym: id, override: b.dataset.o }), L('Saved', 'सेव हुआ'));
    if (ok) { bust('overview', 'gyms', 'audit'); m.close(); render(); } else b.disabled = false;
  }));
}
async function vSuperUsers() {
  const [profiles, gyms] = await Promise.all([Q.profiles(), Q.gyms()]);
  const gm = new Map(gyms.map((g) => [g.id, g]));
  return pageHead(L('Super admin', 'सुपर एडमिन'), L('Users', 'यूज़र'), L('Accounts are created in the Supabase dashboard. Assign each one a role and a gym here.', 'अकाउंट Supabase डैशबोर्ड में बनते हैं। यहाँ हर एक को भूमिका और जिम दें।'))
    + `<div class="card">${profiles.length ? `<div class="tw"><table class="t"><thead><tr><th>${esc(L('User', 'यूज़र'))}</th><th>${esc(L('Role', 'भूमिका'))}</th><th>${esc(L('Gym', 'जिम'))}</th><th></th></tr></thead><tbody>${profiles.map((p) => `<tr><td><b>${esc(p.full_name || p.email || '—')}</b><br><small class="muted">${esc(p.email || '')}</small></td><td>${badge(roleName(p.role), p.role === 'super_admin' ? 'warn' : p.role === 'gym_admin' ? 'info' : 'mute')}</td><td>${p.gym_id ? esc((gm.get(p.gym_id) || {}).name || '—') : p.role === 'super_admin' ? '—' : `<span class="muted">${esc(L('No gym (waiting)', 'जिम नहीं (इंतज़ार में)'))}</span>`}</td><td class="r"><button class="btn sm" data-act="assignUser" data-id="${esc(p.id)}">${ic('pencil')} ${esc(L('Assign', 'तय करें'))}</button></td></tr>`).join('')}</tbody></table></div>` : empty(L('No users yet', 'अभी कोई यूज़र नहीं'), L('Create an account in Supabase → Authentication → Users first.', 'पहले Supabase → Authentication → Users में अकाउंट बनाएँ।')) }</div>`;
}
async function assignForm(id) {
  const [profiles, gyms] = await Promise.all([Q.profiles(), Q.gyms()]);
  const p = profiles.find((x) => x.id === id); if (!p) return;
  if (p.id === SESSION.user_id) { toast(L('You cannot change your own role here.', 'अपनी भूमिका यहाँ नहीं बदल सकते।'), 'bad'); return; }
  const m = openForm({
    title: p.full_name || p.email || 'User',
    fields: [
      { k: 'role', label: L('Role', 'भूमिका'), type: 'select', options: ['gym_admin', 'trainer', 'member', 'super_admin'].map((r) => ({ v: r, l: roleName(r) })), def: p.role === 'super_admin' ? 'gym_admin' : p.role, full: true },
      { k: 'gym', label: L('Gym', 'जिम'), type: 'select', options: [{ v: '', l: '—' }, ...gyms.map((g) => ({ v: g.id, l: g.name }))], def: p.gym_id || '', full: true, check: (v, o) => (o.role !== 'super_admin' && !v ? L('Choose a gym', 'जिम चुनें') : '') },
    ],
    onSubmit: async (v) => {
      if (v.role === 'super_admin' && !(await askConfirm(L('Make this person a super admin? They will control every gym.', 'इसे सुपर एडमिन बनाएँ? यह हर जिम को नियंत्रित करेगा।'), L('Yes, make super admin', 'हाँ, सुपर एडमिन बनाएँ')))) return false;
      const ok = await act(() => DB.rpc('admin_assign_user', { target: id, new_role: v.role, gym: v.role === 'super_admin' ? null : v.gym }), L('Saved', 'सेव हुआ'));
      if (ok) { bust('profiles', 'overview', 'audit'); render(); } return !!ok;
    },
  });
}
async function vSuperAudit() {
  const [rows, gyms] = await Promise.all([Q.audit(), Q.gyms()]);
  const gm = new Map(gyms.map((g) => [g.id, g]));
  const txt = (r) => ({ create_gym: L('Gym created', 'जिम बना'), set_lock: L('Lock changed', 'लॉक बदला'), set_subscription: L('Subscription changed', 'सब्सक्रिप्शन बदला'), assign_user: L('User assigned', 'यूज़र तय हुआ'), update_gym: L('Gym details changed', 'जिम का ब्योरा बदला'), create_account: L('Login created', 'लॉगिन बना') }[r.action] || r.action);
  return pageHead(L('Super admin', 'सुपर एडमिन'), L('Audit log', 'ऑडिट लॉग'), L('Every admin action, newest first. This log cannot be edited.', 'हर एडमिन कार्रवाई, नई सबसे ऊपर। इस लॉग को बदला नहीं जा सकता।'))
    + `<div class="card">${rows.length ? `<div class="tw"><table class="t"><thead><tr><th>${esc(L('When', 'कब'))}</th><th>${esc(L('Action', 'कार्रवाई'))}</th><th>${esc(L('Gym', 'जिम'))}</th><th>${esc(L('Detail', 'ब्योरा'))}</th></tr></thead><tbody>${rows.map((r) => `<tr><td class="num">${esc(fmtShort(r.at))} ${esc(fmtTime(r.at))}</td><td>${esc(txt(r))}</td><td>${esc((gm.get(r.gym_id) || {}).name || '—')}</td><td><small class="hash">${esc(JSON.stringify(r.detail || {}))}</small></td></tr>`).join('')}</tbody></table></div>` : empty(L('Nothing logged yet', 'अभी कुछ दर्ज नहीं'), '')}</div>`;
}
async function vSuperStatus() {
  const t0 = performance.now(); let ok = true, ms = 0, errTxt = '';
  try { await api('/rest/v1/rpc/admin_gym_overview', { method: 'POST', body: {} }); ms = Math.round(performance.now() - t0); } catch (e) { ok = false; errTxt = friendlyError(e); }
  const row = (a, b, tone) => `<li><div class="grow"><b>${esc(a)}</b></div>${tone ? badge(b, tone) : `<span class="num">${esc(b)}</span>`}</li>`;
  return pageHead(L('Super admin', 'सुपर एडमिन'), L('System status', 'सिस्टम स्थिति'), '')
    + card(L('What this page can really check', 'यह पेज असल में क्या जाँच सकता है'), 'pulse', '', `<ul class="list">${row(L('Database (Supabase) reachable', 'डेटाबेस (Supabase) पहुँच में'), ok ? L('Yes', 'हाँ') : L('No', 'नहीं'), ok ? 'ok' : 'bad')}${ok ? row(L('Response time', 'जवाब का समय'), ms + ' ms') : row(L('Error', 'त्रुटि'), errTxt)}${row(L('India time now', 'अभी भारतीय समय'), `${fmtDate(todayISO())} ${fmtTime(new Date().toISOString())}`)}${row(L('Signed in as', 'लॉगिन'), SESSION.email || '')}</ul>`)
    + `<div class="note" style="margin-top:14px">${esc(L('Cloudflare, n8n and WhatsApp are not connected to this app, so it does not show their health. Check them in their own dashboards.', 'Cloudflare, n8n और WhatsApp इस ऐप से जुड़े नहीं हैं, इसलिए इनकी सेहत यहाँ नहीं दिखती। इन्हें इनके अपने डैशबोर्ड में देखें।'))}</div>`;
}
/* ================= Gym screens (gym_admin; trainers get Members + Check-in) ================= */
const U = { members: { q: '', f: 'all', page: 1 }, checkin: { q: '' }, invoices: { f: 'all', q: '', page: 1 }, payments: { q: '', page: 1 }, ledger: { result: null, busy: false, page: 1 }, retention: { thr: 4 }, peak: { days: '28' } };
try { const t = Number(localStorage.getItem('gymos-thr')); if (t >= 1 && t <= 30) U.retention.thr = t; } catch (e) {}
const isAdmin = () => CTX.profile.role === 'gym_admin';
const gymName = () => (CTX.gym ? CTX.gym.name : 'Royal The Gym');
const memberName = (map, id) => (map.get(id) || {}).name || '—';
const upiOf = () => (CTX.gym && CTX.gym.upi_id) || '';

/* ---------- Dashboard ---------- */
async function vDashboard() {
  const [members, invoices, payments, visits] = await Promise.all([Q.members(), Q.invoices(), Q.payments(), Q.visits()]);
  const paid = paidByInvoice(payments), today = todayISO(), mk = monthKey(today);
  const states = members.map(memberState);
  const active = states.filter((s) => s === 'Active' || s === 'Expiring').length, expiring = states.filter((s) => s === 'Expiring').length, expired = states.filter((s) => s === 'Expired').length;
  const todayIn = visits.filter((v) => istDate(v.in_at) === today), onFloor = todayIn.filter((v) => !v.out_at).length;
  const collected = sum(payments.filter((p) => monthKey(p.paid_on) === mk), (p) => p.amount);
  const dues = sum(invoices, (i) => balanceOf(i, paid)), overdueN = invoices.filter((i) => isOverdue(i, paid)).length;
  const soon = members.filter((m) => memberState(m) === 'Expiring').sort((a, b) => a.end_date.localeCompare(b.end_date)).slice(0, 6);
  return pageHead(gymName(), L('Dashboard', 'डैशबोर्ड'), fmtDate(today))
    + `<div class="tiles">${tile(L('Active members', 'सक्रिय सदस्य'), active, `${expired} ${esc(L('expired', 'खत्म'))}`)}${tile(L('Expiring in 7 days', '7 दिन में खत्म'), expiring, '', expiring ? 'var(--warn)' : '')}${tile(L('Check-ins today', 'आज चेक-इन'), todayIn.length, `${onFloor} ${esc(L('on the floor now', 'अभी फ़्लोर पर'))}`)}${isAdmin() ? tile(L('Collected this month', 'इस महीने जमा'), esc(inr(collected))) + tile(L('Dues pending', 'बकाया'), esc(inr(dues)), overdueN ? `${overdueN} ${esc(L('overdue', 'देर'))}` : '', dues ? 'var(--crimson)' : '') : ''}</div>`
    + `<div class="grid2">${card(L('Renewals coming up', 'जल्द खत्म होने वाले'), 'clock', '', soon.length ? `<ul class="list">${soon.map((m) => `<li class="click" data-act="openMember" data-id="${esc(m.id)}">${avatarM(m)}<div class="grow"><b>${esc(m.name)}</b><small>${esc(L(`Ends ${fmtDate(m.end_date)}`, `${fmtDate(m.end_date)} को खत्म`))}</small></div>${waBtnRenew(m)}</li>`).join('')}</ul>` : empty(L('No renewals due this week', 'इस हफ़्ते कोई रिन्यूअल नहीं'), ''))}
    ${card(L('Today at the gym', 'आज जिम में'), 'door', `<a href="#checkin">${esc(L('Check-in', 'चेक-इन'))}</a>`, todayIn.length ? `<ul class="list">${todayIn.slice(0, 6).map((v) => `<li><div class="grow"><b>${esc(memberName(memberMap(members), v.member_id))}</b><small>${esc(fmtTime(v.in_at))}${v.out_at ? ' – ' + esc(fmtTime(v.out_at)) : ''}</small></div>${v.out_at ? '' : badge(L('Inside', 'अंदर'), 'ok')}</li>`).join('')}</ul>` : empty(L('No check-ins yet today', 'आज अभी कोई चेक-इन नहीं'), ''))}</div>`;
}
const waBtnRenew = (m) => `<a class="btn wa sm" data-stop data-remind="${esc(m.id)}" target="_blank" rel="noreferrer" href="${esc(waLink(m.phone, `नमस्ते ${m.name} जी, ${gymName()} से। आपकी सदस्यता ${fmtDate(m.end_date)} को समाप्त हो रही है। रिन्यूअल के लिए हमसे संपर्क करें। 💪`))}">${ic('msg')} WhatsApp</a>`;

/* ---------- Members ---------- */
async function vMembers() {
  const [members, plans, invoices, payments, visits] = await Promise.all([Q.members(), Q.plans(), isAdmin() ? Q.invoices() : [], isAdmin() ? Q.payments() : [], Q.visits()]);
  const pm = planMap(plans), last = lastVisitMap(visits), dues = duesByMember(invoices, paidByInvoice(payments));
  const st = U.members, q = st.q.trim().toLowerCase();
  const counts = { all: members.length }; STATE_FILTERS.forEach((s) => (counts[s] = members.filter((m) => memberState(m) === s).length));
  let rows = members.filter((m) => (st.f === 'all' || memberState(m) === st.f) && (!q || m.name.toLowerCase().includes(q) || String(m.phone || '').includes(q)));
  const total = rows.length; st.page = Math.min(st.page, Math.max(1, Math.ceil(total / PAGE))); rows = rows.slice((st.page - 1) * PAGE, st.page * PAGE);
  return pageHead(L('People', 'लोग'), L('Members', 'सदस्य'), '', `<button class="btn" data-act="membersCsv">${ic('down')} CSV</button>${isAdmin() ? `<button class="btn" data-act="importMembers" ${CTX.locked ? 'disabled' : ''}>${ic('down')} ${esc(L('Import', 'इम्पोर्ट'))}</button>` : ''}<button class="btn primary" data-act="newMember" ${CTX.locked ? 'disabled' : ''}>${ic('plus')} ${esc(L('New member', 'नया सदस्य'))}</button>`)
    + `<div class="bar">${searchBox('mq', st.q, L('Search name or phone', 'नाम या फ़ोन खोजें'))}</div>`
    + chipsHtml('memF', st.f, [['all', L('All', 'सभी'), counts.all], ...STATE_FILTERS.map((s) => [s, LANG === 'hi' ? STATE_HI[s] : s, counts[s]])])
    + `<div class="card">${rows.length ? `<div class="tw"><table class="t"><thead><tr><th>${esc(L('Photo', 'फ़ोटो'))}</th><th>${esc(L('Member', 'सदस्य'))}</th><th>${esc(L('Plan', 'प्लान'))}</th><th>${esc(L('Status', 'स्थिति'))}</th><th class="r">${esc(L('Valid till', 'तारीख़ तक'))}</th><th>${esc(L('Last visit', 'आख़िरी विज़िट'))}</th>${isAdmin() ? `<th class="r">${esc(L('Dues', 'बकाया'))}</th>` : ''}</tr></thead><tbody>${rows.map((m) => { const s = memberState(m), d = dues.get(m.id) || 0; return `<tr class="click" data-act="openMember" data-id="${esc(m.id)}"><td class="edge e-${TONE[s] || 'mute'}">${avatarM(m)}</td><td><b>${esc(m.name)}</b><br><small class="muted">${esc(m.phone || '')}</small></td><td>${esc((pm.get(m.plan_id) || {}).name || '—')}</td><td>${badge(s)}</td><td class="r num">${esc(fmtDate(m.end_date))}</td><td class="num">${last.get(m.id) ? esc(fmtShort(last.get(m.id))) : '—'}</td>${isAdmin() ? `<td class="r num" style="color:${d ? 'var(--crimson)' : 'inherit'}">${d ? esc(inr(d)) : '—'}</td>` : ''}</tr>`; }).join('')}</tbody></table></div>${pagerHtml(total, st.page, 'members')}` : empty(members.length ? L('No members match', 'कोई सदस्य मेल नहीं खाता') : L('No members yet', 'अभी कोई सदस्य नहीं'), '', members.length ? '' : `<button class="btn primary" data-act="newMember">${esc(L('Add the first member', 'पहला सदस्य जोड़ें'))}</button>`)}</div>`;
}
const GOALS = ['Fat Loss', 'Muscle', 'Strength', 'General Fitness', 'Rehab'];
async function memberForm(id) {
  const [members, plans, offers] = await Promise.all([Q.members(), Q.plans(), isAdmin() ? Q.offers() : []]);
  const liveOffers = offers.filter((o) => offerLive(o, todayISO()));
  const x = id ? members.find((m) => m.id === id) : null;
  const act2 = plans.filter((p) => p.status === 'Active');
  const fields = [
    { k: 'name', label: L('Name', 'नाम'), req: true, full: true }, { k: 'phone', label: L('Phone', 'फ़ोन'), type: 'tel', req: true },
    { k: 'gender', label: L('Gender', 'लिंग'), type: 'select', options: [{ v: '', l: '—' }, { v: 'Male', l: L('Male', 'पुरुष') }, { v: 'Female', l: L('Female', 'महिला') }, { v: 'Other', l: L('Other', 'अन्य') }] },
    { k: 'goal', label: L('Goal', 'लक्ष्य'), type: 'select', options: [{ v: '', l: '—' }, ...GOALS.map((g) => ({ v: g, l: g }))] },
    { k: 'plan_id', label: L('Plan', 'प्लान'), type: 'select', options: [{ v: '', l: L('No plan yet', 'अभी प्लान नहीं') }, ...act2.map((p) => ({ v: p.id, l: `${p.name} · ${inr(p.price)}` }))], def: x ? x.plan_id || '' : '' },
    { k: 'start_date', label: L('Start date', 'शुरू की तारीख़'), type: 'date', def: x ? x.start_date : todayISO() },
    { k: 'notes', label: L('Notes', 'नोट'), type: 'textarea', full: true },
  ];
  if (isAdmin()) fields.push({ k: 'wa_opt_out', label: L('Do not send automatic WhatsApp messages (member asked to stop)', 'ऑटोमैटिक WhatsApp मैसेज न भेजें (सदस्य ने मना किया)'), type: 'check', full: true });
  if (!x && isAdmin()) { fields.push({ k: 'bill', label: L('Create the first invoice for the plan', 'प्लान का पहला इनवॉइस बनाएँ'), type: 'check', def: true, full: true }); if (liveOffers.length) fields.push({ k: 'offer', label: L('Offer (applies to the invoice)', 'ऑफ़र (इनवॉइस पर लागू)'), type: 'select', options: [{ v: '', l: L('No offer', 'कोई ऑफ़र नहीं') }, ...liveOffers.map((o) => ({ v: o.id, l: `${o.name} · ${offerText(o)}` }))], full: true }); }
  openForm({
    title: x ? x.name : L('New member', 'नया सदस्य'), fields, values: x || {},
    onSubmit: async (v) => {
      const plan = plans.find((p) => p.id === v.plan_id);
      const start = v.start_date || todayISO();
      const row = { name: v.name, phone: v.phone, gender: v.gender || null, goal: v.goal || null, notes: v.notes || null, plan_id: plan ? plan.id : null };
      if (isAdmin()) row.wa_opt_out = !!v.wa_opt_out;
      if (plan && (!x || x.plan_id !== plan.id || x.start_date !== start)) { row.start_date = start; row.end_date = addDays(addMonths(start, plan.months), -1); }
      const saved = await act(() => (x ? DB.update('members', x.id, row) : DB.insert('members', { ...row, gym_id: gymId() })), L('Saved', 'सेव हुआ'));
      if (!saved) return false;
      if (!x && plan && v.bill && isAdmin()) {
        const off = liveOffers.find((o) => o.id === v.offer && (!o.plan_id || o.plan_id === plan.id)), disc = off ? offerDiscount(off, plan.price) : 0;
        const items = [{ label: `${plan.name} membership`, amount: Number(plan.price) }]; if (off && disc > 0) items.push({ label: `Offer: ${off.name}`, amount: 0 });
        await act(() => DB.insert('invoices', { gym_id: gymId(), member_id: saved.id, items, ...computeInvoice([{ amount: plan.price }], disc, plan.gst_pct), due: addDays(todayISO(), 7) }), L('Invoice created', 'इनवॉइस बना'));
      }
      bust('members', 'invoices'); render(); return true;
    },
  });
}
async function renewForm(id) {
  const [members, plans, invoices, payments, offers] = await Promise.all([Q.members(), Q.plans(), Q.invoices(), Q.payments(), Q.offers()]);
  const liveOffers = offers.filter((o) => offerLive(o, todayISO()));
  const m = members.find((x) => x.id === id); if (!m) return;
  const act2 = plans.filter((p) => p.status === 'Active'); if (!act2.length) { toast(L('Add a plan first.', 'पहले प्लान जोड़ें।'), 'bad'); return; }
  const startDef = m.end_date && m.end_date >= todayISO() ? addDays(m.end_date, 1) : todayISO();
  const cur = act2.find((p) => p.id === m.plan_id) || act2[0];
  const preview = (root, src) => { const p = act2.find((x) => x.id === $('#f_plan', root).value); if (src === 'offer' || src === 'plan') { const o = liveOffers.find((x) => x.id === $('#f_offer', root).value); $('#f_discount', root).value = o && (!o.plan_id || o.plan_id === p.id) ? offerDiscount(o, p.price) : 0; } const disc = parseFloat($('#f_discount', root).value) || 0; const c = computeInvoice([{ amount: p.price }], disc, p.gst_pct); const out = $('#rn_sum', root); if (out) out.textContent = `${L('Total', 'कुल')} ${inr(c.total)} (GST ${inr(c.gst_amt)})`; const pay = $('#f_pay', root); if (pay && !pay.dataset.touched) pay.value = c.total; };
  const mod = openForm({
    title: `${L('Renew', 'रिन्यू')} · ${m.name}`,
    fields: [
      { k: 'plan', label: L('Plan', 'प्लान'), type: 'select', options: act2.map((p) => ({ v: p.id, l: `${p.name} · ${inr(p.price)}` })), def: cur.id, full: true },
      { k: 'offer', label: L('Offer', 'ऑफ़र'), type: 'select', options: [{ v: '', l: L('No offer', 'कोई ऑफ़र नहीं') }, ...liveOffers.map((o) => ({ v: o.id, l: `${o.name} · ${offerText(o)}` }))], full: true },
      { k: 'start', label: L('Starts on', 'शुरू'), type: 'date', req: true, def: startDef }, { k: 'discount', label: `${L('Discount', 'छूट')} (₹)`, type: 'number', def: 0 },
      { k: 'pay', label: `${L('Paid now', 'अभी जमा')} (₹)`, type: 'number', def: 0 }, { k: 'method', label: L('Method', 'तरीक़ा'), type: 'select', options: opts(['UPI', 'Cash', 'Card', 'Bank']) },
    ],
    extra: `<div class="note" id="rn_sum" style="margin-top:10px"></div>`,
    submitLabel: L('Renew', 'रिन्यू करें'),
    onSubmit: async (v) => {
      const p = act2.find((x) => x.id === v.plan), c = computeInvoice([{ amount: p.price }], v.discount, p.gst_pct);
      if (Number(v.pay) > c.total + 0.005) { $('#e_pay', mod.el).textContent = L(`More than the total ${inr(c.total)}`, `कुल ${inr(c.total)} से ज़्यादा`); return false; }
      const off = liveOffers.find((x) => x.id === v.offer && (!x.plan_id || x.plan_id === p.id)), items = [{ label: `${p.name} membership`, amount: Number(p.price) }];
      if (off && c.discount > 0) items.push({ label: `Offer: ${off.name}`, amount: 0 });
      const inv = await act(() => DB.insert('invoices', { gym_id: gymId(), member_id: m.id, items, ...c, due: addDays(todayISO(), 7) })); if (!inv) return false;
      const upd = await act(() => DB.update('members', m.id, { plan_id: p.id, start_date: v.start, end_date: addDays(addMonths(v.start, p.months), -1), status: 'Active' })); if (!upd) { toast(L('Invoice created but the membership was not updated. Edit the member.', 'इनवॉइस बना पर सदस्यता अपडेट नहीं हुई। सदस्य को बदलें।'), 'bad'); bust(); render(); return true; }
      if (Number(v.pay) > 0) { const pay = await act(() => DB.insert('payments', { gym_id: gymId(), invoice_id: inv.id, member_id: m.id, amount: Number(v.pay), method: v.method })); if (pay) { bust(); render(); receiptModal(pay, m); return true; } }
      toast(L('Membership renewed', 'सदस्यता रिन्यू हुई')); bust(); render(); return true;
    },
  });
  mod.el.addEventListener('input', (e) => { if (e.target.id === 'f_pay') e.target.dataset.touched = '1'; preview(mod.el); }); mod.el.addEventListener('change', (e) => preview(mod.el, e.target.id === 'f_offer' ? 'offer' : e.target.id === 'f_plan' ? 'plan' : '')); preview(mod.el);
}
async function memberModal(id) {
  const [members, plans, visits] = await Promise.all([Q.members(), Q.plans(), Q.visits()]);
  const m = members.find((x) => x.id === id); if (!m) return;
  const [invoices, payments] = isAdmin() ? await Promise.all([Q.invoices(), Q.payments()]) : [[], []];
  const paid = paidByInvoice(payments), mine = invoices.filter((i) => i.member_id === id), s = memberState(m), dl = daysLeft(m), due = sum(mine, (i) => balanceOf(i, paid));
  const vs = visits.filter((v) => v.member_id === id).slice(0, 6), plan = plans.find((p) => p.id === m.plan_id);
  closeAllModals();
  const mod = openModal({
    title: m.name, wide: true,
    body: `<div style="display:flex;gap:14px;align-items:center;margin-bottom:12px">${avatarM(m, true)}<div class="grow"><b>${esc(m.phone || '')}</b><div class="muted">${esc(plan ? plan.name : L('No plan', 'प्लान नहीं'))} · ${esc(m.goal || '')}${m.profile_id ? ' · ' + esc(L('app login linked', 'ऐप लॉगिन जुड़ा')) : ''}</div></div>${badge(s)}</div>
      <div class="tiles" style="margin-bottom:12px">${tile(L('Valid till', 'तारीख़ तक'), esc(fmtDate(m.end_date)), dl == null ? '' : dl >= 0 ? L(`${dl} days left`, `${dl} दिन बाक़ी`) : L(`${-dl} days ago`, `${-dl} दिन पहले`))}${isAdmin() ? tile(L('Dues', 'बकाया'), esc(inr(due)), '', due ? 'var(--crimson)' : '') : ''}</div>
      ${m.notes ? `<p class="muted">${esc(m.notes)}</p>` : ''}
      <h3 style="font-size:13px;margin:10px 0 4px">${esc(L('Recent visits', 'हाल की विज़िट'))}</h3>${vs.length ? `<ul class="list">${vs.map((v) => `<li><div class="grow"><b>${esc(fmtDate(v.in_at))}</b><small>${esc(fmtTime(v.in_at))}${v.out_at ? ' – ' + esc(fmtTime(v.out_at)) : ''}</small></div></li>`).join('')}</ul>` : `<div class="muted">${esc(L('No visits in the last 90 days', 'पिछले 90 दिन में कोई विज़िट नहीं'))}</div>`}
      ${isAdmin() ? `<h3 style="font-size:13px;margin:14px 0 4px">${esc(L('Invoices', 'इनवॉइस'))}</h3>${mine.length ? `<ul class="list">${mine.slice(0, 5).map((i) => `<li class="click" data-act="openInvoice" data-id="${esc(i.id)}"><div class="grow"><b class="num">${esc(i.no)}</b><small>${esc(fmtDate(i.date))}</small></div><span class="num">${esc(inr(i.total))}</span>${badge(invStatus(i, paid))}</li>`).join('')}</ul>` : `<div class="muted">—</div>`}` : ''}`,
    footer: `${waBtnRenew(m).replace('data-stop ', '')}${isAdmin() && !m.profile_id ? `<button type="button" class="btn" data-l>${ic('lock')} ${esc(L('Create login', 'लॉगिन बनाएँ'))}</button>` : ''}<button type="button" class="btn" data-ph>${ic('plus')} ${esc(L('Photo', 'फ़ोटो'))}</button><input type="file" id="phIn" accept="image/*" hidden><button type="button" class="btn" data-e>${ic('pencil')} ${esc(L('Edit', 'बदलें'))}</button>${isAdmin() ? `<button type="button" class="btn primary" data-r>${esc(L('Renew', 'रिन्यू'))}</button>` : ''}`,
  });
  $('[data-e]', mod.el).onclick = () => { mod.close(); memberForm(id); };
  const phb = $('[data-ph]', mod.el), phIn = $('#phIn', mod.el);
  phb.onclick = () => phIn.click();
  phIn.onchange = async () => { const f = phIn.files[0]; if (!f) return; phb.disabled = true; try { await pickMemberPhoto(m, f, mod); } catch (e) { phb.disabled = CTX.locked; } };
  const lg = $('[data-l]', mod.el); if (lg) lg.onclick = () => { mod.close(); accountForm('member', m); };
  const r = $('[data-r]', mod.el); if (r) r.onclick = () => { mod.close(); renewForm(id); };
  if (CTX.locked) { $$('[data-e],[data-r],[data-l],[data-ph]', mod.el).forEach((b) => (b.disabled = true)); }
}

/* ---------- Check-in ---------- */
async function vCheckin() {
  const [members, visits] = await Promise.all([Q.members(), Q.visits()]);
  const today = todayISO(), todays = visits.filter((v) => istDate(v.in_at) === today), open = new Map(todays.filter((v) => !v.out_at).map((v) => [v.member_id, v]));
  const q = U.checkin.q.trim().toLowerCase(), mm = memberMap(members);
  const found = q ? members.filter((m) => m.name.toLowerCase().includes(q) || String(m.phone || '').includes(q)).slice(0, 8) : [];
  return pageHead(L('Floor', 'फ़्लोर'), L('Check-in', 'चेक-इन'), L(`${todays.length} today · ${open.size} inside`, `आज ${todays.length} · अंदर ${open.size}`))
    + `<div class="bar">${searchBox('cq', U.checkin.q, L('Type a name or phone', 'नाम या फ़ोन लिखें'))}</div>`
    + (q ? `<div class="card" style="margin-bottom:14px">${found.length ? `<ul class="list">${found.map((m) => { const s = memberState(m), inV = open.get(m.id), blocked = ['Expired', 'Frozen', 'Cancelled'].includes(s); return `<li>${avatarM(m)}<div class="grow"><b>${esc(m.name)}</b><small>${esc(m.phone || '')} · ${esc(LANG === 'hi' ? STATE_HI[s] : s)}${m.end_date ? ' · ' + esc(fmtShort(m.end_date)) : ''}</small></div>${inV ? `<button class="btn sm" data-act="checkOut" data-id="${esc(inV.id)}">${esc(L('Check out', 'चेक-आउट'))}</button>` : `<button class="btn primary sm" data-act="checkIn" data-id="${esc(m.id)}" ${blocked || CTX.locked ? 'disabled' : ''}>${esc(blocked ? L('Renew first', 'पहले रिन्यू') : L('Check in', 'चेक-इन'))}</button>`}</li>`; }).join('')}</ul>` : empty(L('No match', 'कोई मेल नहीं'), '')}</div>` : '')
    + card(L('Today', 'आज'), 'clock', '', todays.length ? `<ul class="list">${todays.map((v) => `<li><div class="grow"><b>${esc(memberName(mm, v.member_id))}</b><small>${esc(fmtTime(v.in_at))}${v.out_at ? ' – ' + esc(fmtTime(v.out_at)) : ''}</small></div>${v.out_at ? badge(L('Done', 'पूरा'), 'mute') : `<button class="btn sm" data-act="checkOut" data-id="${esc(v.id)}">${esc(L('Check out', 'चेक-आउट'))}</button>`}</li>`).join('')}</ul>` : empty(L('Nobody yet today', 'आज अभी कोई नहीं'), ''));
}

/* ---------- Plans ---------- */
async function vPlans() {
  const [plans, members] = await Promise.all([Q.plans(), Q.members()]);
  const n = (p) => members.filter((m) => m.plan_id === p.id).length;
  return pageHead(L('Setup', 'सेटअप'), L('Plans', 'प्लान'), L('Plans are archived, not deleted, so old invoices stay correct.', 'प्लान हटते नहीं, आर्काइव होते हैं, ताकि पुराने इनवॉइस सही रहें।'), `<button class="btn primary" data-act="newPlan" ${CTX.locked ? 'disabled' : ''}>${ic('plus')} ${esc(L('New plan', 'नया प्लान'))}</button>`)
    + (plans.length ? `<div class="cg">${plans.map((p) => `<div class="card pc${p.status === 'Archived' ? ' off' : ''}"><b>${esc(p.name)}</b><div class="pr">${esc(inr(p.price))}</div><div class="muted">${p.months} ${esc(L('months', 'महीने'))} · GST ${p.gst_pct}%</div><div class="muted">${n(p)} ${esc(L('members', 'सदस्य'))}</div><div class="acts"><button class="btn sm" data-act="editPlan" data-id="${esc(p.id)}" ${CTX.locked ? 'disabled' : ''}>${ic('pencil')} ${esc(L('Edit', 'बदलें'))}</button></div></div>`).join('')}</div>` : `<div class="card">${empty(L('No plans yet', 'अभी कोई प्लान नहीं'), L('Add your membership plans to start billing.', 'बिलिंग शुरू करने के लिए प्लान जोड़ें।'), `<button class="btn primary" data-act="newPlan">${esc(L('New plan', 'नया प्लान'))}</button>`)}</div>`);
}
async function planForm(id) {
  const plans = await Q.plans(), x = id ? plans.find((p) => p.id === id) : null;
  openForm({
    title: x ? x.name : L('New plan', 'नया प्लान'),
    fields: [
      { k: 'name', label: L('Name', 'नाम'), req: true, full: true }, { k: 'months', label: L('Months', 'महीने'), type: 'number', req: true, min: 1, step: 1, def: 1, check: (v) => (v > 60 || !Number.isInteger(v) ? L('Whole months, up to 60', 'पूरे महीने, अधिकतम 60') : '') },
      { k: 'price', label: `${L('Price', 'कीमत')} (₹)`, type: 'number', req: true }, { k: 'gst_pct', label: 'GST %', type: 'number', def: 18, check: (v) => (v > 40 ? L('Up to 40', 'अधिकतम 40') : '') },
      { k: 'status', label: L('Status', 'स्थिति'), type: 'select', options: [{ v: 'Active', l: L('Active', 'सक्रिय') }, { v: 'Archived', l: L('Archived', 'आर्काइव') }], def: x ? x.status : 'Active' },
    ],
    values: x || {},
    onSubmit: async (v) => { const row = { name: v.name, months: v.months, price: v.price, gst_pct: v.gst_pct === '' ? 18 : v.gst_pct, status: v.status }; const ok = await act(() => (x ? DB.update('plans', x.id, row) : DB.insert('plans', { ...row, gym_id: gymId() })), L('Saved', 'सेव हुआ')); if (ok) { bust('plans'); render(); } return !!ok; },
  });
}
/* ================= Gym screens, part 2: check-in actions, billing, ledger, retention, peak hours, settings, member portal ================= */
async function doCheckIn(memberId) {
  const r = await act(() => DB.insert('visits', { gym_id: gymId(), member_id: memberId }), L('Checked in', 'चेक-इन हो गया'));
  if (r) { bust('visits'); render(); }
}
async function doCheckOut(visitId) {
  const r = await act(() => DB.update('visits', visitId, { out_at: new Date().toISOString() }), L('Checked out', 'चेक-आउट हो गया'));
  if (r) { bust('visits'); render(); }
}

/* ---------- Invoices ---------- */
async function vInvoices() {
  const [invoices, payments, members] = await Promise.all([Q.invoices(), Q.payments(), Q.members()]);
  const paid = paidByInvoice(payments), mm = memberMap(members), st = U.invoices, q = st.q.trim().toLowerCase();
  const tag = (i) => (isOverdue(i, paid) ? 'Overdue' : invStatus(i, paid));
  const counts = { all: invoices.length }; ['Unpaid', 'Partial', 'Overdue', 'Paid', 'Cancelled'].forEach((s) => (counts[s] = invoices.filter((i) => tag(i) === s).length));
  let rows = invoices.filter((i) => (st.f === 'all' || tag(i) === st.f) && (!q || String(i.no || '').toLowerCase().includes(q) || memberName(mm, i.member_id).toLowerCase().includes(q)));
  const total = rows.length; st.page = Math.min(st.page, Math.max(1, Math.ceil(total / PAGE))); rows = rows.slice((st.page - 1) * PAGE, st.page * PAGE);
  return pageHead(L('Billing', 'बिलिंग'), L('Invoices', 'इनवॉइस'), '', `<button class="btn primary" data-act="newInvoice" ${CTX.locked ? 'disabled' : ''}>${ic('plus')} ${esc(L('New invoice', 'नया इनवॉइस'))}</button>`)
    + `<div class="bar">${searchBox('iq', st.q, L('Invoice no. or member', 'इनवॉइस नंबर या सदस्य'))}</div>`
    + chipsHtml('invF', st.f, [['all', L('All', 'सभी'), counts.all], ...['Unpaid', 'Partial', 'Overdue', 'Paid', 'Cancelled'].map((s) => [s, LANG === 'hi' ? STATE_HI[s] || s : s, counts[s]])])
    + `<div class="card">${rows.length ? `<div class="tw"><table class="t"><thead><tr><th>${esc(L('No.', 'नं.'))}</th><th>${esc(L('Member', 'सदस्य'))}</th><th>${esc(L('Date', 'तारीख़'))}</th><th class="r">${esc(L('Total', 'कुल'))}</th><th class="r">${esc(L('Balance', 'बाक़ी'))}</th><th>${esc(L('Status', 'स्थिति'))}</th></tr></thead><tbody>${rows.map((i) => `<tr class="click" data-act="openInvoice" data-id="${esc(i.id)}"><td class="num"><b>${esc(i.no || '—')}</b></td><td>${esc(memberName(mm, i.member_id))}</td><td class="num">${esc(fmtDate(i.date))}</td><td class="r num">${esc(inr(i.total))}</td><td class="r num">${esc(inr(balanceOf(i, paid)))}</td><td>${badge(tag(i))}</td></tr>`).join('')}</tbody></table></div>${pagerHtml(total, st.page, 'invoices')}` : empty(L('No invoices', 'कोई इनवॉइस नहीं'), '', '')}</div>`;
}
async function invoiceForm(memberId) {
  const [members, plans] = await Promise.all([Q.members(), Q.plans()]);
  if (!members.length) { toast(L('Add a member first.', 'पहले सदस्य जोड़ें।'), 'bad'); return; }
  const mod = openForm({
    title: L('New invoice', 'नया इनवॉइस'),
    fields: [
      { k: 'member', label: L('Member', 'सदस्य'), type: 'select', options: members.map((m) => ({ v: m.id, l: `${m.name} · ${m.phone || ''}` })), def: memberId || members[0].id, full: true },
      { k: 'label', label: L('Item', 'विवरण'), req: true, def: plans[0] ? plans[0].name : '', full: true },
      { k: 'amount', label: `${L('Amount', 'राशि')} (₹)`, type: 'number', req: true, def: plans[0] ? plans[0].price : '' }, { k: 'discount', label: `${L('Discount', 'छूट')} (₹)`, type: 'number', def: 0 },
      { k: 'gst', label: 'GST %', type: 'number', def: 18 }, { k: 'due', label: L('Due date', 'आख़िरी तारीख़'), type: 'date', def: addDays(todayISO(), 7) },
    ],
    extra: `<div class="note" id="iv_sum" style="margin-top:10px"></div>`,
    onSubmit: async (v) => {
      const c = computeInvoice([{ amount: v.amount }], v.discount, v.gst === '' ? 18 : v.gst);
      const ok = await act(() => DB.insert('invoices', { gym_id: gymId(), member_id: v.member, items: [{ label: v.label, amount: Number(v.amount) }], ...c, due: v.due || null }), L('Invoice created', 'इनवॉइस बना'));
      if (ok) { bust('invoices'); render(); } return !!ok;
    },
  });
  const sum2 = () => { const g = (k) => parseFloat($('#f_' + k, mod.el).value) || 0; const c = computeInvoice([{ amount: g('amount') }], g('discount'), $('#f_gst', mod.el).value === '' ? 18 : g('gst')); $('#iv_sum', mod.el).textContent = `${L('Total', 'कुल')} ${inr(c.total)} (GST ${inr(c.gst_amt)})`; };
  mod.el.addEventListener('input', sum2); sum2();
}
async function invoiceModal(id) {
  const [invoices, payments, members] = await Promise.all([Q.invoices(), Q.payments(), Q.members()]);
  const i = invoices.find((x) => x.id === id); if (!i) return;
  const paid = paidByInvoice(payments), bal = balanceOf(i, paid), m = members.find((x) => x.id === i.member_id) || {}, mine = payments.filter((p) => p.invoice_id === id);
  const items = Array.isArray(i.items) ? i.items : [];
  closeAllModals();
  const mod = openModal({
    title: `${L('Invoice', 'इनवॉइस')} ${i.no || ''}`, wide: true,
    body: `<div style="display:flex;justify-content:space-between;gap:10px;margin-bottom:10px"><div><b>${esc(m.name || '—')}</b><div class="muted">${esc(m.phone || '')}</div></div><div style="text-align:right"><div class="num">${esc(fmtDate(i.date))}</div>${badge(isOverdue(i, paid) ? 'Overdue' : invStatus(i, paid))}</div></div>
      <table class="t"><tbody>${items.map((it) => `<tr><td>${esc(it.label)}</td><td class="r num">${Number(it.amount) ? esc(inr(it.amount)) : ''}</td></tr>`).join('')}
      ${Number(i.discount) ? `<tr><td>${esc(L('Discount', 'छूट'))}</td><td class="r num">−${esc(inr(i.discount))}</td></tr>` : ''}
      <tr><td>GST ${Number(i.gst_pct)}%</td><td class="r num">${esc(inr(i.gst_amt))}</td></tr><tr><td><b>${esc(L('Total', 'कुल'))}</b></td><td class="r num"><b>${esc(inr(i.total))}</b></td></tr>
      <tr><td>${esc(L('Balance', 'बाक़ी'))}</td><td class="r num" style="color:${bal ? 'var(--crimson)' : 'inherit'}">${esc(inr(bal))}</td></tr></tbody></table>
      <h3 style="font-size:13px;margin:14px 0 4px">${esc(L('Payments', 'भुगतान'))}</h3>${mine.length ? `<ul class="list">${mine.map((p) => `<li class="click" data-act="openReceipt" data-id="${esc(p.id)}"><div class="grow"><b class="num">${esc(p.no || '—')}</b><small>${esc(fmtDate(p.paid_on))} · ${esc(p.method)}</small></div><span class="num">${esc(inr(p.amount))}</span></li>`).join('')}</ul>` : `<div class="muted">${esc(L('No payments yet', 'अभी कोई भुगतान नहीं'))}</div>`}`,
    footer: `${!i.cancelled && !mine.length ? `<button type="button" class="btn danger" data-c>${esc(L('Cancel invoice', 'इनवॉइस रद्द करें'))}</button>` : ''}${!i.cancelled && bal > 0.004 ? `<button type="button" class="btn primary" data-p>${esc(L('Record payment', 'भुगतान दर्ज करें'))}</button>` : ''}`,
  });
  const c = $('[data-c]', mod.el), p = $('[data-p]', mod.el);
  if (CTX.locked) $$('button[data-c],button[data-p]', mod.el).forEach((b) => (b.disabled = true));
  if (c) c.onclick = async () => { if (!(await askConfirm(L('Cancel this invoice? This cannot be undone.', 'यह इनवॉइस रद्द करें? यह वापस नहीं होगा।'), L('Cancel invoice', 'रद्द करें')))) return; const ok = await act(() => DB.update('invoices', id, { cancelled: true }), L('Cancelled', 'रद्द हुआ')); if (ok) { bust('invoices'); mod.close(); render(); } };
  if (p) p.onclick = () => { mod.close(); payForm(id); };
}

/* ---------- Payments ---------- */
async function payForm(invoiceId) {
  const [invoices, payments, members] = await Promise.all([Q.invoices(), Q.payments(), Q.members()]);
  const i = invoices.find((x) => x.id === invoiceId); if (!i) return;
  const bal = balanceOf(i, paidByInvoice(payments)), m = members.find((x) => x.id === i.member_id) || {};
  openForm({
    title: `${L('Payment', 'भुगतान')} · ${m.name || ''}`,
    fields: [
      { k: 'amount', label: `${L('Amount', 'राशि')} (₹)`, type: 'number', req: true, def: bal, min: 0.01, check: (v) => (v > bal + 0.005 ? L(`More than the balance ${inr(bal)}`, `बाक़ी ${inr(bal)} से ज़्यादा`) : '') },
      { k: 'method', label: L('Method', 'तरीक़ा'), type: 'select', options: opts(['UPI', 'Cash', 'Card', 'Bank']) },
      { k: 'ref', label: L('Reference (UTR / note)', 'रेफ़रेंस (UTR / नोट)'), full: true },
    ],
    submitLabel: L('Save payment', 'भुगतान सेव करें'),
    extra: `<div class="note" style="margin-top:10px">${esc(L('Payments cannot be edited after saving. Check the amount.', 'सेव के बाद भुगतान बदला नहीं जा सकता। राशि जाँच लें।'))}</div>`,
    onSubmit: async (v) => {
      const pay = await act(() => DB.insert('payments', { gym_id: gymId(), invoice_id: invoiceId, member_id: i.member_id, amount: v.amount, method: v.method, ref: v.ref || null }));
      if (!pay) return false;
      bust('payments', 'ledger'); render(); receiptModal(pay, m); return true;
    },
  });
}
function receiptText(p, m) {
  return `🧾 ${gymName()}\nरसीद: ${p.no || '—'}\nसदस्य: ${m.name || ''}\nराशि: ${inr(p.amount)} (${p.method})\nतारीख़: ${fmtDate(p.paid_on || todayISO())}\nधन्यवाद! 💪`;
}
async function vPayments() {
  const [payments, members] = await Promise.all([Q.payments(), Q.members()]);
  const mm = memberMap(members), st = U.payments, q = st.q.trim().toLowerCase();
  let rows = payments.filter((p) => !q || String(p.no || '').toLowerCase().includes(q) || memberName(mm, p.member_id).toLowerCase().includes(q));
  const total = rows.length; st.page = Math.min(st.page, Math.max(1, Math.ceil(total / PAGE))); const all = rows; rows = rows.slice((st.page - 1) * PAGE, st.page * PAGE);
  const mk = monthKey(todayISO());
  return pageHead(L('Billing', 'बिलिंग'), L('Payments', 'भुगतान'), '', `<button class="btn" data-act="payCsv">${ic('down')} CSV</button>`)
    + `<div class="tiles">${tile(L('This month', 'इस महीने'), esc(inr(sum(payments.filter((p) => monthKey(p.paid_on) === mk), (p) => p.amount))))}${tile(L('Payments', 'भुगतान'), payments.length)}</div>`
    + `<div class="bar">${searchBox('pq', st.q, L('Receipt no. or member', 'रसीद नंबर या सदस्य'))}</div>`
    + `<div class="card">${rows.length ? `<div class="tw"><table class="t"><thead><tr><th>${esc(L('No.', 'नं.'))}</th><th>${esc(L('Member', 'सदस्य'))}</th><th>${esc(L('Date', 'तारीख़'))}</th><th>${esc(L('Method', 'तरीक़ा'))}</th><th class="r">${esc(L('Amount', 'राशि'))}</th></tr></thead><tbody>${rows.map((p) => `<tr class="click" data-act="openReceipt" data-id="${esc(p.id)}"><td class="num"><b>${esc(p.no || '—')}</b></td><td>${esc(memberName(mm, p.member_id))}</td><td class="num">${esc(fmtDate(p.paid_on))}</td><td>${esc(p.method)}</td><td class="r num">${esc(inr(p.amount))}</td></tr>`).join('')}</tbody></table></div>${pagerHtml(total, st.page, 'payments')}` : empty(L('No payments', 'कोई भुगतान नहीं'), '')}</div>`;
}
async function exportPayments() {
  const [payments, members] = await Promise.all([Q.payments(), Q.members()]), mm = memberMap(members);
  downloadCsv(`payments-${todayISO()}.csv`, [['No', 'Date', 'Member', 'Method', 'Amount', 'Ref'], ...payments.map((p) => [p.no, p.paid_on, memberName(mm, p.member_id), p.method, p.amount, p.ref || ''])]);
}

/* ---------- Ledger (server-side HMAC chain) ---------- */
async function vLedger() {
  const [rows, members] = await Promise.all([Q.ledger(), Q.members()]);
  const mm = memberMap(members), st = U.ledger, res = st.result;
  const verdict = res === null ? '' : res.length === 0
    ? `<div class="banner ok">${ic('shield')} ${esc(L(`Verified: ${rows.length} sealed entries, the chain is intact and every entry matches its payment.`, `जाँच पूरी: ${rows.length} सील प्रविष्टियाँ, चेन सही है और हर प्रविष्टि भुगतान से मेल खाती है।`))}</div>`
    : `<div class="banner bad">${ic('shield')} ${esc(L(`${res.length} problem(s) found`, `${res.length} गड़बड़ मिली`))}<ul>${res.map((r) => `<li>#${r.seq}: ${esc(r.problem)}</li>`).join('')}</ul></div>`;
  const total = rows.length; st.page = Math.min(st.page, Math.max(1, Math.ceil(total / PAGE)));
  const pageRows = rows.slice((st.page - 1) * PAGE, st.page * PAGE);
  return pageHead(L('Billing', 'बिलिंग'), L('Secure ledger', 'सुरक्षित लेजर'), L('Each payment is sealed on the server with a keyed HMAC-SHA256 chain. Any later change breaks the chain.', 'हर भुगतान सर्वर पर कुंजी वाली HMAC-SHA256 चेन से सील होता है। बाद में कोई बदलाव चेन तोड़ देता है।'),
    `<button class="btn primary" data-act="verifyLedger" ${st.busy ? 'disabled' : ''}>${ic('shield')} ${esc(L('Verify now', 'अभी जाँचें'))}</button><button class="btn" data-act="ledgerCsv">${ic('down')} CSV</button>`)
    + verdict
    + `<div class="card">${rows.length ? `<div class="tw"><table class="t"><thead><tr><th>#</th><th>${esc(L('Receipt', 'रसीद'))}</th><th>${esc(L('Member', 'सदस्य'))}</th><th class="r">${esc(L('Amount', 'राशि'))}</th><th>${esc(L('Seal', 'सील'))}</th></tr></thead><tbody>${pageRows.map((r) => `<tr><td class="num">${r.seq}</td><td class="num">${esc(r.no)}</td><td>${esc(memberName(mm, r.member_id))}</td><td class="r num">${esc(inr(r.amount))}</td><td><small class="hash">${esc(String(r.mac).slice(0, 16))}…</small></td></tr>`).join('')}</tbody></table></div>${pagerHtml(total, st.page, 'ledger')}` : empty(L('No sealed payments yet', 'अभी कोई सील भुगतान नहीं'), '')}</div>`;
}
async function runVerify() {
  U.ledger.busy = true; render();
  try { bust('ledger'); U.ledger.result = await DB.rpc('verify_gym_ledger', { g: gymId() }); } catch (e) { toast(friendlyError(e), 'bad'); } finally { U.ledger.busy = false; render(); }
}
async function exportLedger() {
  const [rows, members] = await Promise.all([Q.ledger(), Q.members()]), mm = memberMap(members);
  downloadCsv(`ledger-${todayISO()}.csv`, [['Seq', 'Receipt', 'Date', 'Member', 'Method', 'Amount', 'MAC'], ...[...rows].reverse().map((r) => [r.seq, r.no, r.paid_on, memberName(mm, r.member_id), r.method, r.amount, r.mac])]);
}

/* ---------- Retention ---------- */
async function vRetention() {
  const [members, visits] = await Promise.all([Q.members(), Q.visits()]);
  const thr = U.retention.thr, last = lastVisitMap(visits), today = todayISO();
  const risky = members.filter((m) => ['Active', 'Expiring'].includes(memberState(m))).map((m) => {
    const lv = last.get(m.id), base = lv || m.joined_on || m.start_date, gone = base ? diffDays(base, today) : 999;
    return { m, lv, gone };
  }).filter((x) => x.gone >= thr && !(x.m.joined_on && !x.lv && diffDays(x.m.joined_on, today) < thr)).sort((a, b) => b.gone - a.gone);
  const msg = (m, gone) => `नमस्ते ${m.name} जी, ${gymName()} से। ${gone >= 90 ? 'काफ़ी दिनों' : gone + ' दिन'} से आप जिम नहीं आए। सब ठीक है? आपका इंतज़ार है, कल आइए! 💪`;
  return pageHead(L('Members', 'सदस्य'), L('At risk of leaving', 'छोड़ने का जोखिम'), L('Active members who have not visited for a while. Visit history covers the last 90 days.', 'सक्रिय सदस्य जो कुछ समय से नहीं आए। विज़िट इतिहास पिछले 90 दिन का है।'),
    `<label class="fl" style="margin:0"><span>${esc(L('Absent for at least (days)', 'कम से कम इतने दिन अनुपस्थित'))}</span><input class="in" id="thr" type="number" min="1" max="30" value="${thr}" data-bind="thr" style="width:90px"></label>`)
    + `<div class="card">${risky.length ? `<ul class="list">${risky.map(({ m, lv, gone }) => `<li class="click" data-act="openMember" data-id="${esc(m.id)}">${avatarM(m)}<div class="grow"><b>${esc(m.name)}</b><small>${lv ? esc(L(`Last visit ${fmtShort(lv)}`, `आख़िरी विज़िट ${fmtShort(lv)}`)) : esc(L('No visit in 90 days', '90 दिन में कोई विज़िट नहीं'))}</small></div>${badge(gone >= 90 ? '90+' : L(`${gone} days`, `${gone} दिन`), gone >= 14 ? 'bad' : 'warn')}<a class="btn wa sm" data-stop target="_blank" rel="noreferrer" href="${esc(waLink(m.phone, msg(m, gone)))}">${ic('msg')}</a></li>`).join('')}</ul>` : empty(L('Nobody is overdue for a visit', 'कोई लंबे समय से अनुपस्थित नहीं'), '')}</div>`;
}

/* ---------- Peak hours ---------- */
async function vPeak() {
  const visits = await Q.visits(), days = Number(U.peak.days), since = Date.now() - days * 864e5;
  const grid = Array.from({ length: 7 }, () => Array(24).fill(0)); let n = 0, max = 0;
  visits.filter((v) => new Date(v.in_at).getTime() >= since).forEach((v) => { const { dow, hour } = istParts(v.in_at); grid[dow][hour]++; n++; });
  grid.forEach((r) => r.forEach((c) => { if (c > max) max = c; }));
  const DN = L('Sun,Mon,Tue,Wed,Thu,Fri,Sat', 'रवि,सोम,मंगल,बुध,गुरु,शुक्र,शनि').split(',');
  const hours = [...Array(24).keys()].filter((h) => h >= 5 && h <= 23);
  const byHour = hours.map((h) => [h, sum(grid, (r) => r[h])]).sort((a, b) => b[1] - a[1]).slice(0, 3).filter((x) => x[1] > 0);
  const hl = (h) => `${h % 12 || 12}${h < 12 ? 'am' : 'pm'}`;
  return pageHead(L('Insights', 'इनसाइट'), L('Peak hours', 'भीड़ के समय'), L(`Check-ins by day and hour (India time), last ${days} days: ${n} visits.`, `दिन और घंटे के हिसाब से चेक-इन (भारतीय समय), पिछले ${days} दिन: ${n} विज़िट।`))
    + chipsHtml('peakD', U.peak.days, [['28', L('28 days', '28 दिन')], ['90', L('90 days', '90 दिन')]])
    + (byHour.length ? `<div class="note" style="margin-bottom:12px">${esc(L('Busiest hours: ', 'सबसे व्यस्त घंटे: '))}${byHour.map((x) => `${hl(x[0])} (${x[1]})`).join(', ')}</div>` : '')
    + `<div class="card" style="overflow:auto;padding:14px"><div class="heat" role="img" aria-label="${esc(L('Peak hours heatmap', 'भीड़ का हीटमैप'))}" style="grid-template-columns:44px repeat(${hours.length},minmax(0,1fr))"><span></span>${hours.map((h) => `<span class="hl">${hl(h)}</span>`).join('')}${[1, 2, 3, 4, 5, 6, 0].map((d) => `<span class="hd">${esc(DN[d])}</span>${hours.map((h) => { const c = grid[d][h]; return `<span class="hc" title="${esc(DN[d])} ${hl(h)}: ${c}"><i style="opacity:${c ? (0.2 + 0.8 * c / max).toFixed(2) : 0}"></i>${c ? `<b>${c}</b>` : ''}</span>`; }).join('')}`).join('')}</div></div>`;
}

/* ---------- Settings / team ---------- */
async function vSettings() {
  const g = CTX.gym || {}; let staff = [];
  try { staff = (await Q.profiles()).filter((p) => p.gym_id === gymId()); } catch (e) {}
  return pageHead(L('Setup', 'सेटअप'), L('Gym settings', 'जिम सेटिंग'), '', `<button class="btn primary" data-act="editGym" ${CTX.locked ? 'disabled' : ''}>${ic('pencil')} ${esc(L('Edit', 'बदलें'))}</button>`)
    + `<div class="grid2">${card(L('Gym', 'जिम'), 'building', '', `<ul class="list"><li><div class="grow"><small>${esc(L('Name', 'नाम'))}</small><b>${esc(g.name || '')}</b></div></li><li><div class="grow"><small>${esc(L('Owner', 'मालिक'))}</small><b>${esc(g.owner_name || '—')}</b></div></li><li><div class="grow"><small>${esc(L('Phone', 'फ़ोन'))}</small><b>${esc(g.phone || '—')}</b></div></li><li><div class="grow"><small>${esc(L('City', 'शहर'))}</small><b>${esc(g.city || '—')}</b></div></li><li><div class="grow"><small>UPI</small><b>${esc(g.upi_id || '—')}</b></div></li><li><div class="grow"><small>${esc(L('Subscription valid till', 'सब्सक्रिप्शन की तारीख़'))}</small><b>${esc(fmtDate(g.subscription_ends_on))}</b></div>${CTX.locked ? badge(L('Locked', 'लॉक'), 'bad') : badge(L('Open', 'खुला'), 'ok')}</li></ul>`)}
    ${card(L('Team', 'टीम'), 'users', `<button class="btn sm" data-act="newTrainer" ${CTX.locked ? 'disabled' : ''}>${ic('plus')} ${esc(L('Trainer login', 'ट्रेनर लॉगिन'))}</button>`, staff.length ? `<ul class="list">${staff.map((p) => `<li>${avatar(p.full_name || p.email)}<div class="grow"><b>${esc(p.full_name || p.email || '—')}</b><small>${esc(p.email || '')}</small></div>${badge(roleName(p.role), 'mute')}</li>`).join('')}</ul><div class="muted" style="margin-top:8px">${esc(L('Roles are assigned by the platform admin.', 'भूमिकाएँ प्लेटफ़ॉर्म एडमिन तय करता है।'))}</div>` : empty(L('No team listed', 'टीम सूची में नहीं'), ''))}</div>`;
}
function editGymForm() {
  const g = CTX.gym || {};
  openForm({
    title: L('Edit gym', 'जिम बदलें'), values: { name: g.name, owner: g.owner_name, phone: g.phone, city: g.city, upi: g.upi_id },
    fields: [
      { k: 'name', label: L('Gym name', 'जिम का नाम'), req: true, full: true, check: (v) => (v.length < 2 ? L('Too short', 'बहुत छोटा') : '') },
      { k: 'owner', label: L('Owner', 'मालिक') }, { k: 'phone', label: L('Phone', 'फ़ोन'), type: 'tel' }, { k: 'city', label: L('City', 'शहर') },
      { k: 'upi', label: L('Merchant UPI ID', 'मर्चेंट UPI आईडी'), ph: 'name@bank', check: (v) => (v && !UPI_RE.test(v) ? L('Example: name@bank', 'उदाहरण: name@bank') : '') },
    ],
    onSubmit: async (v) => {
      const ok = await act(() => DB.rpc('admin_update_gym', { gym: gymId(), gym_name: v.name, owner: v.owner || null, phone_no: v.phone || null, city_name: v.city || null, upi: v.upi || null }), L('Saved', 'सेव हुआ'));
      if (ok) { await loadContext(); render(); } return !!ok;
    },
  });
}

/* ---------- Member portal ---------- */
async function vMine() {
  const members = await Q.members(), m = members[0];
  if (!m) return pageHead(gymName(), L('My gym', 'मेरा जिम'), '') + `<div class="card">${empty(L('Your membership is not linked yet', 'आपकी सदस्यता अभी जुड़ी नहीं है'), L('Ask the front desk to link your account to your membership.', 'फ़्रंट डेस्क से अपना अकाउंट सदस्यता से जुड़वाएँ।'))}</div>`;
  const [invoices, payments, visits, plans] = await Promise.all([Q.invoices(), Q.payments(), Q.visits(), Q.plans()]);
  const paid = paidByInvoice(payments), due = sum(invoices, (i) => balanceOf(i, paid)), s = memberState(m), dl = daysLeft(m), plan = plans.find((p) => p.id === m.plan_id), upi = upiOf();
  const month = visits.filter((v) => monthKey(istDate(v.in_at)) === monthKey(todayISO())).length;
  return pageHead(gymName(), `${L('Hello', 'नमस्ते')}, ${m.name}`, '')
    + `<div class="tiles">${tile(L('Membership', 'सदस्यता'), badge(s), esc(plan ? plan.name : ''))}${tile(L('Valid till', 'तारीख़ तक'), esc(fmtDate(m.end_date)), dl == null ? '' : dl >= 0 ? esc(L(`${dl} days left`, `${dl} दिन बाक़ी`)) : esc(L(`Expired ${-dl} days ago`, `${-dl} दिन पहले खत्म`)))}${tile(L('Visits this month', 'इस महीने विज़िट'), month)}${tile(L('Dues', 'बकाया'), esc(inr(due)), '', due ? 'var(--crimson)' : '')}</div>`
    + (due && upi ? `<div class="card" style="padding:14px;margin-bottom:14px"><b>${esc(L('Pay your dues', 'बकाया चुकाएँ'))}</b><p class="muted" style="margin:6px 0">${esc(L('Pay to this UPI ID, then tell the front desk. The gym records the payment on its side.', 'इस UPI आईडी पर भुगतान करें, फिर फ़्रंट डेस्क को बताएँ। भुगतान जिम की तरफ़ से दर्ज होता है।'))}</p><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><code class="num">${esc(upi)}</code><button class="btn sm" data-act="copyUpi">${ic('copy')} ${esc(L('Copy', 'कॉपी'))}</button></div></div>` : '')
    + `<div class="grid2">${card(L('Invoices', 'इनवॉइस'), 'receipt', '', invoices.length ? `<ul class="list">${invoices.slice(0, 8).map((i) => `<li><div class="grow"><b class="num">${esc(i.no || '—')}</b><small>${esc(fmtDate(i.date))}</small></div><span class="num">${esc(inr(i.total))}</span>${badge(invStatus(i, paid))}</li>`).join('')}</ul>` : empty(L('No invoices', 'कोई इनवॉइस नहीं'), ''))}
    ${card(L('Recent visits', 'हाल की विज़िट'), 'clock', '', visits.length ? `<ul class="list">${visits.slice(0, 8).map((v) => `<li><div class="grow"><b>${esc(fmtDate(v.in_at))}</b><small>${esc(fmtTime(v.in_at))}${v.out_at ? ' – ' + esc(fmtTime(v.out_at)) : ''}</small></div></li>`).join('')}</ul>` : empty(L('No visits yet', 'अभी कोई विज़िट नहीं'), ''))}</div>`;
}

/* ---------- Create a login (trainer / member) ---------- */
function accountForm(role, member) {
  openForm({
    title: role === 'member' ? `${L('Create login', 'लॉगिन बनाएँ')} · ${member.name}` : L('New trainer login', 'नया ट्रेनर लॉगिन'),
    fields: [
      { k: 'email', label: L('Email', 'ईमेल'), type: 'email', req: true, full: true },
      { k: 'full_name', label: L('Name', 'नाम'), req: role === 'trainer', def: member ? member.name : '', full: true },
    ],
    extra: `<div class="note" style="margin-top:10px">${esc(L('A password is generated and shown once. Share it with the person; they can change it after signing in.', 'पासवर्ड अपने-आप बनता है और एक ही बार दिखता है। उसे व्यक्ति को दीजिए; वह लॉगिन के बाद बदल सकता है।'))}</div>`,
    submitLabel: L('Create login', 'लॉगिन बनाएँ'),
    onSubmit: async (v) => {
      const r = await act(() => createAccount({ email: v.email, full_name: v.full_name, role, member_id: member ? member.id : undefined }));
      if (!r) return false;
      bust('members', 'profiles'); render(); showAccessModal(r, member); return true;
    },
  });
}
function showAccessModal(c, member) {
  const url = location.origin;
  const text = `${gymName()} ऐप\nलिंक: ${url}\nईमेल: ${c.email}\nपासवर्ड: ${c.password}\nलॉगिन के बाद पासवर्ड बदल लें।`;
  const mod = openModal({
    title: L('Login created', 'लॉगिन बन गया'),
    body: `<div class="banner">${esc(L('Copy this now. The password is not shown again.', 'अभी कॉपी कर लें। पासवर्ड दोबारा नहीं दिखेगा।'))}</div><div class="card" style="padding:14px"><div class="muted">${esc(L('Email', 'ईमेल'))}</div><b class="num">${esc(c.email)}</b><div class="muted" style="margin-top:8px">${esc(L('Password', 'पासवर्ड'))}</div><b class="num" style="font-size:18px">${esc(c.password)}</b></div>`,
    footer: `${member && member.phone ? `<a class="btn wa" target="_blank" rel="noreferrer" href="${esc(waLink(member.phone, text))}">${ic('msg')} WhatsApp</a>` : ''}<button type="button" class="btn primary" data-cp>${ic('copy')} ${esc(L('Copy', 'कॉपी'))}</button>`,
  });
  $('[data-cp]', mod.el).onclick = () => copyText(text);
}

/* ---------- Import existing members (paste from Excel / Google Sheets) ---------- */
const normName = (x) => String(x || '').toLowerCase().replace(/[\s·.\-_]+/g, '');
function parseDateCell(x) {
  x = String(x || '').trim(); if (!x) return '';
  let m = x.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/), d, mo, y;
  if (m) { y = +m[1]; mo = +m[2]; d = +m[3]; } else if ((m = x.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/))) { d = +m[1]; mo = +m[2]; y = +m[3]; } else return null;
  const iso = `${y}-${pad(mo)}-${pad(d)}`, back = new Date(Date.UTC(y, mo - 1, d));
  return back.getUTCFullYear() === y && back.getUTCMonth() === mo - 1 && back.getUTCDate() === d ? iso : null;
}
function parseImport(text, plans, existingPhones) {
  const rows = [], errors = [], seen = new Set(), byName = new Map(plans.map((p) => [normName(p.name), p]));
  text.split(/\r?\n/).forEach((line, i) => {
    if (!line.trim()) return;
    const c = line.split(/\t|,|;/).map((x) => x.trim()), n = i + 1;
    if (i === 0 && /^(name|नाम)$/i.test(c[0])) return;
    const name = c[0], phone = String(c[1] || '').replace(/\D/g, '').slice(-10), planTxt = c[2] || '', start = parseDateCell(c[3]);
    if (!name || name.length < 2) { errors.push(L(`Line ${n}: name is missing`, `लाइन ${n}: नाम नहीं है`)); return; }
    if (phone.length !== 10) { errors.push(L(`Line ${n} (${name}): phone must be 10 digits`, `लाइन ${n} (${name}): फ़ोन 10 अंकों का हो`)); return; }
    if (existingPhones.has(phone) || seen.has(phone)) { errors.push(L(`Line ${n} (${name}): this phone is already a member`, `लाइन ${n} (${name}): यह फ़ोन पहले से सदस्य है`)); return; }
    let plan = null; if (planTxt) { plan = byName.get(normName(planTxt)); if (!plan) { errors.push(L(`Line ${n} (${name}): plan "${planTxt}" not found`, `लाइन ${n} (${name}): प्लान "${planTxt}" नहीं मिला`)); return; } }
    if (start === null) { errors.push(L(`Line ${n} (${name}): date must be DD-MM-YYYY`, `लाइन ${n} (${name}): तारीख़ DD-MM-YYYY में हो`)); return; }
    if (plan && !start) { errors.push(L(`Line ${n} (${name}): a plan needs a start date`, `लाइन ${n} (${name}): प्लान के साथ शुरू की तारीख़ चाहिए`)); return; }
    seen.add(phone);
    const row = { name, phone, plan_id: plan ? plan.id : null };
    if (plan) { row.start_date = start; row.end_date = addDays(addMonths(start, plan.months), -1); row.joined_on = start; }
    rows.push(row);
  });
  return { rows, errors };
}
async function importForm() {
  const [plans, members] = await Promise.all([Q.plans(), Q.members()]);
  const phones = new Set(members.map((m) => String(m.phone || '').replace(/\D/g, '').slice(-10)));
  const act2 = plans.filter((p) => p.status === 'Active');
  const mod = openForm({
    title: L('Import existing members', 'पुराने सदस्य इम्पोर्ट करें'),
    wide: true,
    fields: [{ k: 'text', label: L('Paste rows: name, phone, plan, start date', 'पंक्तियाँ चिपकाएँ: नाम, फ़ोन, प्लान, शुरू की तारीख़'), type: 'textarea', req: true, full: true, ph: 'Rahul Sharma, 9876543210, Gym · 3 Months, 01-10-2026' }],
    extra: `<div class="note" style="margin-top:10px">${esc(L('One member per line. Copy straight from Excel or Google Sheets. Plan and date can be left empty. Date format: DD-MM-YYYY. Existing dues are not imported; add an invoice if a member owes money.', 'हर लाइन में एक सदस्य। Excel या Google Sheets से सीधे कॉपी करें। प्लान और तारीख़ खाली छोड़ सकते हैं। तारीख़: DD-MM-YYYY। पुराना बकाया इम्पोर्ट नहीं होता; बकाया हो तो इनवॉइस बनाएँ।'))}<br>${esc(L('Plan names: ', 'प्लान के नाम: '))}${act2.map((p) => esc(p.name)).join(' | ')}</div><div id="imp_res" style="margin-top:10px"></div>`,
    submitLabel: L('Check and import', 'जाँचें और इम्पोर्ट करें'),
    onSubmit: async (v) => {
      const { rows, errors } = parseImport(v.text, plans, phones), out = $('#imp_res', mod.el);
      if (errors.length) { out.innerHTML = `<div class="banner bad"><b>${esc(L(`${errors.length} problem(s). Fix these lines and try again; nothing was imported.`, `${errors.length} गड़बड़। ये लाइनें ठीक करके फिर कोशिश करें; कुछ इम्पोर्ट नहीं हुआ।`))}</b><ul style="margin:6px 0 0;padding-left:18px">${errors.slice(0, 12).map((e) => `<li>${esc(e)}</li>`).join('')}${errors.length > 12 ? `<li>…</li>` : ''}</ul></div>`; return false; }
      if (!rows.length) { out.innerHTML = `<div class="banner bad">${esc(L('No rows found.', 'कोई पंक्ति नहीं मिली।'))}</div>`; return false; }
      if (rows.length > 500) { out.innerHTML = `<div class="banner bad">${esc(L('Import at most 500 members at a time.', 'एक बार में अधिकतम 500 सदस्य।'))}</div>`; return false; }
      const saved = await act(() => DB.insertMany('members', rows.map((r) => ({ ...r, gym_id: gymId() }))));
      if (!saved) return false;
      bust('members'); toast(L(`${rows.length} members imported`, `${rows.length} सदस्य इम्पोर्ट हुए`)); render(); return true;
    },
  });
}

async function exportMembers() {
  const [members, plans, invoices, payments] = await Promise.all([Q.members(), Q.plans(), isAdmin() ? Q.invoices() : [], isAdmin() ? Q.payments() : []]);
  const pm = planMap(plans), dues = duesByMember(invoices, paidByInvoice(payments));
  downloadCsv(`members-${todayISO()}.csv`, [['Name', 'Phone', 'Plan', 'Start', 'End', 'Status', 'Dues', 'Goal', 'Notes'], ...members.map((m) => [m.name, m.phone, (pm.get(m.plan_id) || {}).name || '', m.start_date || '', m.end_date || '', memberState(m), dues.get(m.id) || 0, m.goal || '', m.notes || ''])]);
}
/* ================= Extras: member photos, WhatsApp expiry reminders, offers ================= */

/* ---------- Photos (private Supabase Storage bucket; staff of the gym + the member themself can read) ---------- */
const PHOTO_CACHE = new Map();
const storagePath = (p) => p.split('/').map(encodeURIComponent).join('/');
async function storageAuth() {
  if (SESSION && SESSION.expires_at && SESSION.expires_at - 30 < Date.now() / 1000) await refreshSession();
  return { apikey: CFG.key, Authorization: 'Bearer ' + ((SESSION && SESSION.access_token) || CFG.key) };
}
function photoUrl(path) {
  if (!path) return Promise.resolve(null);
  if (PHOTO_CACHE.has(path)) return PHOTO_CACHE.get(path);
  const p = (async () => {
    const res = await rawFetch('/storage/v1/object/authenticated/member-photos/' + storagePath(path), { headers: await storageAuth() });
    if (!res.ok) throw new Error('photo');
    return URL.createObjectURL(await res.blob());
  })();
  PHOTO_CACHE.set(path, p); p.catch(() => PHOTO_CACHE.delete(path));
  return p;
}
async function uploadPhoto(path, blob) {
  const res = await rawFetch('/storage/v1/object/member-photos/' + storagePath(path), { method: 'POST', headers: { ...(await storageAuth()), 'Content-Type': 'image/jpeg', 'x-upsert': 'true' }, body: blob });
  if (!res.ok) { let j = {}; try { j = await res.json(); } catch (e) {} throw new ApiError(j.message || 'upload failed', res.status, res.status === 400 || res.status === 403 ? '42501' : 'storage'); }
  const old = PHOTO_CACHE.get(path); PHOTO_CACHE.delete(path); if (old) old.then((u) => URL.revokeObjectURL(u)).catch(() => {});
}
function shrinkPhoto(file, max = 360) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file), img = new Image();
    img.onload = () => {
      const s = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(img.width * s)); c.height = Math.max(1, Math.round(img.height * s));
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
      c.toBlob((b) => (b ? resolve(b) : reject(new Error('encode'))), 'image/jpeg', 0.82);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('image')); };
    img.src = url;
  });
}
const avatarM = (m, big) => `<span class="av ph${big ? ' lg' : ''}"${m.photo_path ? ` data-photo="${esc(m.photo_path)}"` : ''}>${esc(initials(m.name))}</span>`;
function hydratePhotos() {
  $$('[data-photo]:not([data-ph-done])').forEach((el) => {
    el.dataset.phDone = '1';
    photoUrl(el.dataset.photo).then((u) => { if (u && el.isConnected) { el.style.backgroundImage = `url("${u}")`; el.classList.add('has'); } }).catch(() => {});
  });
}
let hydrateTimer;
new MutationObserver(() => { clearTimeout(hydrateTimer); hydrateTimer = setTimeout(hydratePhotos, 40); }).observe(document.body, { childList: true, subtree: true });
async function pickMemberPhoto(m, file, modal) {
  try {
    const blob = await shrinkPhoto(file), path = `${gymId()}/${m.id}.jpg`;
    await uploadPhoto(path, blob);
    if (m.photo_path !== path) await DB.update('members', m.id, { photo_path: path });
    bust('members'); toast(L('Photo saved', 'फ़ोटो सेव हुई'));
    if (modal) modal.close(); await render(); memberModal(m.id);
  } catch (e) { toast(e && e.message === 'image' ? L('This file is not a usable image.', 'यह फ़ाइल सही फ़ोटो नहीं है।') : friendlyError(e), 'bad'); throw e; }
}

/* ---------- Offers ---------- */
Q.offers = () => cached('offers', () => DB.select('offers', { order: 'created_at.desc', limit: 500 }));
const offerText = (o) => (o.kind === 'percent' ? `${Number(o.value)}% ${L('off', 'छूट')}` : `₹${Number(o.value)} ${L('off', 'छूट')}`);
const offerDiscount = (o, price) => (o.kind === 'percent' ? round2((Number(price) * Number(o.value)) / 100) : Math.min(Number(o.value), Number(price)));
const offerState = (o, t) => (!o.active ? 'off' : o.starts_on && o.starts_on > t ? 'soon' : o.ends_on && o.ends_on < t ? 'ended' : 'live');
const offerLive = (o, t) => offerState(o, t) === 'live';
const OFFER_TONE = { live: 'ok', soon: 'info', ended: 'mute', off: 'mute' };
const offerStateLabel = (s) => ({ live: L('Live', 'चालू'), soon: L('Scheduled', 'आने वाला'), ended: L('Ended', 'खत्म'), off: L('Off', 'बंद') }[s]);
async function vOffers() {
  const [offers, plans] = await Promise.all([Q.offers(), Q.plans()]), pm = planMap(plans), t = todayISO();
  return pageHead(L('Setup', 'सेटअप'), L('Offers', 'ऑफ़र'), L('A live offer can be picked while renewing or adding a member; the discount is filled in for you.', 'चालू ऑफ़र रिन्यूअल या नए सदस्य के समय चुन सकते हैं; छूट अपने-आप भर जाती है।'), `<button class="btn primary" data-act="newOffer" ${CTX.locked ? 'disabled' : ''}>${ic('plus')} ${esc(L('New offer', 'नया ऑफ़र'))}</button>`)
    + (offers.length ? `<div class="cg">${offers.map((o) => { const s = offerState(o, t); return `<div class="card pc${s === 'live' ? '' : ' off'}"><div style="display:flex;justify-content:space-between;gap:8px"><b>${esc(o.name)}</b>${badge(offerStateLabel(s), OFFER_TONE[s])}</div><div class="pr">${esc(offerText(o))}</div><div class="muted">${esc(o.plan_id ? (pm.get(o.plan_id) || {}).name || '—' : L('All plans', 'सभी प्लान'))}</div><div class="muted">${o.starts_on || o.ends_on ? esc(`${o.starts_on ? fmtDate(o.starts_on) : '…'} → ${o.ends_on ? fmtDate(o.ends_on) : '…'}`) : esc(L('No dates', 'तारीख़ तय नहीं'))}</div>${o.note ? `<div class="muted">${esc(o.note)}</div>` : ''}<div class="acts"><button class="btn sm" data-act="editOffer" data-id="${esc(o.id)}" ${CTX.locked ? 'disabled' : ''}>${ic('pencil')} ${esc(L('Edit', 'बदलें'))}</button><button class="btn sm" data-act="shareOffer" data-id="${esc(o.id)}">${ic('copy')} ${esc(L('Copy message', 'मैसेज कॉपी'))}</button></div></div>`; }).join('')}</div>` : `<div class="card">${empty(L('No offers yet', 'अभी कोई ऑफ़र नहीं'), L('Create an offer such as "Diwali 10% off" for new joiners or renewals.', 'जैसे "दिवाली 10% छूट" जैसा ऑफ़र बनाइए।'), `<button class="btn primary" data-act="newOffer">${esc(L('New offer', 'नया ऑफ़र'))}</button>`)}</div>`);
}
async function offerForm(id) {
  const [offers, plans] = await Promise.all([Q.offers(), Q.plans()]), x = id ? offers.find((o) => o.id === id) : null;
  openForm({
    title: x ? x.name : L('New offer', 'नया ऑफ़र'), values: x || {},
    fields: [
      { k: 'name', label: L('Offer name', 'ऑफ़र का नाम'), req: true, full: true, ph: 'Diwali 10% off', check: (v) => (v.length < 2 ? L('Too short', 'बहुत छोटा') : '') },
      { k: 'kind', label: L('Type', 'प्रकार'), type: 'select', options: [{ v: 'percent', l: L('Percent (%)', 'प्रतिशत (%)') }, { v: 'flat', l: L('Flat amount (₹)', 'सीधी रकम (₹)') }], def: x ? x.kind : 'percent' },
      { k: 'value', label: L('Value', 'मान'), type: 'number', req: true, min: 0.01, check: (v, o) => (o.kind === 'percent' && v > 100 ? L('Up to 100%', 'अधिकतम 100%') : '') },
      { k: 'plan_id', label: L('Applies to', 'किस पर लागू'), type: 'select', options: [{ v: '', l: L('All plans', 'सभी प्लान') }, ...plans.filter((p) => p.status === 'Active').map((p) => ({ v: p.id, l: p.name }))], def: x ? x.plan_id || '' : '', full: true },
      { k: 'starts_on', label: L('Starts', 'शुरू'), type: 'date' }, { k: 'ends_on', label: L('Ends', 'खत्म'), type: 'date', check: (v, o) => (v && o.starts_on && v < o.starts_on ? L('Before the start date', 'शुरू की तारीख़ से पहले') : '') },
      { k: 'active', label: L('Status', 'स्थिति'), type: 'select', options: [{ v: '1', l: L('On', 'चालू') }, { v: '0', l: L('Off', 'बंद') }], def: x ? (x.active ? '1' : '0') : '1' },
      { k: 'note', label: L('Note', 'नोट'), type: 'textarea', full: true },
    ],
    onSubmit: async (v) => {
      const row = { name: v.name, kind: v.kind, value: v.value, plan_id: v.plan_id || null, starts_on: v.starts_on || null, ends_on: v.ends_on || null, active: v.active === '1', note: v.note || null };
      const ok = await act(() => (x ? DB.update('offers', x.id, row) : DB.insert('offers', { ...row, gym_id: gymId() })), L('Saved', 'सेव हुआ'));
      if (ok) { bust('offers'); render(); } return !!ok;
    },
  });
}
async function shareOffer(id) {
  const [offers, plans] = await Promise.all([Q.offers(), Q.plans()]), o = offers.find((x) => x.id === id); if (!o) return;
  const plan = o.plan_id ? plans.find((p) => p.id === o.plan_id) : null;
  copyText(`🎁 ${gymName()}: ${o.name}\n${offerText(o)}${plan ? ' (' + plan.name + ')' : ''}${o.ends_on ? '\nतारीख़ ' + fmtDate(o.ends_on) + ' तक' : ''}\nसंपर्क: ${(CTX.gym && CTX.gym.phone) || ''}`, L('Offer message copied', 'ऑफ़र मैसेज कॉपी हुआ'));
}

/* ---------- Expiry reminders over WhatsApp (one tap: WhatsApp opens with the message ready) ---------- */
const U_REMIND = { days: 2 };
try { const d = Number(localStorage.getItem('gymos-remind-days')); if (d >= 1 && d <= 14) U_REMIND.days = d; } catch (e) {}
const isDueSoon = (m, days) => ['Active', 'Expiring'].includes(memberState(m)) && m.end_date && daysLeft(m) >= 0 && daysLeft(m) <= days;
function remindMsg(m, offer) {
  const left = daysLeft(m);
  const when = left < 0 ? `${fmtDate(m.end_date)} को खत्म हो चुकी है` : left === 0 ? 'आज खत्म हो रही है' : left === 1 ? 'कल खत्म हो रही है' : `${fmtDate(m.end_date)} को (${left} दिन में) खत्म हो रही है`;
  const upi = upiOf();
  return `नमस्ते ${m.name} जी, ${gymName()} से।\nआपकी सदस्यता ${when}.${offer ? `\n🎁 अभी ऑफ़र: ${offer.name} (${offerText(offer)})` : ''}\nरिन्यू के लिए जिम आइए${upi ? ` या UPI: ${upi} पर भुगतान करके हमें बताइए` : ''}।\n${(CTX.gym && CTX.gym.phone) ? 'संपर्क: ' + CTX.gym.phone + '\n' : ''}धन्यवाद! 💪`;
}
function bestOffer(m, offers, plans) {
  const t = todayISO(), pr = (plans.find((p) => p.id === m.plan_id) || {}).price || 0;
  return offers.filter((o) => offerLive(o, t) && (!o.plan_id || o.plan_id === m.plan_id)).sort((a, b) => offerDiscount(b, pr) - offerDiscount(a, pr))[0] || null;
}
async function vReminders() {
  const [members, offers, plans, invoices, payments] = await Promise.all([Q.members(), Q.offers().catch(() => []), Q.plans(), isAdmin() ? Q.invoices() : [], isAdmin() ? Q.payments() : []]);
  const d = U_REMIND.days, today = todayISO();
  const dueMap = duesByMember(invoices, paidByInvoice(payments)), mm = memberMap(members);
  const oldestDue = new Map(); invoices.forEach((i) => { if (!i.cancelled && i.due && balanceOf(i, paidByInvoice(payments)) > 0.004 && (!oldestDue.has(i.member_id) || oldestDue.get(i.member_id) > i.due)) oldestDue.set(i.member_id, i.due); });
  const owing = [...dueMap.entries()].map(([id, amt]) => ({ m: mm.get(id), amt })).filter((x) => x.m).sort((a, b) => b.amt - a.amt);
  const duesMsg = (m, amt) => `नमस्ते ${m.name} जी, ${gymName()} से।\nआपका ${inr(amt)} बकाया है।${upiOf() ? `\nUPI: ${upiOf()} पर भेज सकते हैं` : ''} या जिम आकर जमा कर दीजिए।\n${(CTX.gym && CTX.gym.phone) ? 'संपर्क: ' + CTX.gym.phone + '\n' : ''}धन्यवाद! 🙏`;
  const dueRow = ({ m, amt }) => `<li class="click" data-act="openMember" data-id="${esc(m.id)}">${avatarM(m)}<div class="grow"><b>${esc(m.name)}</b><small>${oldestDue.has(m.id) ? esc(L(`Oldest due date ${fmtDate(oldestDue.get(m.id))}`, `सबसे पुरानी देय तारीख़ ${fmtDate(oldestDue.get(m.id))}`)) : ''}</small></div><b class="num" style="color:var(--crimson)">${esc(inr(amt))}</b><a class="btn wa sm" data-stop target="_blank" rel="noreferrer" href="${esc(waLink(m.phone, duesMsg(m, amt)))}">${ic('msg')}</a></li>`;
  const soon = members.filter((m) => isDueSoon(m, d)).sort((a, b) => daysLeft(a) - daysLeft(b));
  const lapsed = members.filter((m) => memberState(m) === 'Expired' && daysLeft(m) >= -14).sort((a, b) => daysLeft(b) - daysLeft(a));
  const row = (m) => { const left = daysLeft(m), done = m.reminded_on === today; return `<li class="click" data-act="openMember" data-id="${esc(m.id)}">${avatarM(m)}<div class="grow"><b>${esc(m.name)}</b><small>${esc(left < 0 ? L(`Ended ${-left} day(s) ago`, `${-left} दिन पहले खत्म`) : left === 0 ? L('Ends today', 'आज खत्म') : L(`Ends in ${left} day(s) · ${fmtDate(m.end_date)}`, `${left} दिन में खत्म · ${fmtDate(m.end_date)}`))}${m.reminded_on ? ' · ' + esc(L(`reminded ${fmtShort(m.reminded_on)}`, `रिमाइंडर ${fmtShort(m.reminded_on)} को`)) : ''}</small></div>${done ? badge(L('Sent today', 'आज भेजा'), 'ok') : ''}<a class="btn wa sm" data-stop data-remind="${esc(m.id)}" target="_blank" rel="noreferrer" href="${esc(waLink(m.phone, remindMsg(m, bestOffer(m, offers, plans))))}">${ic('msg')} ${esc(done ? L('Again', 'फिर') : L('Remind', 'रिमाइंडर'))}</a></li>`; };
  return pageHead(L('Members', 'सदस्य'), L('Renewal reminders', 'रिन्यूअल रिमाइंडर'), L('WhatsApp opens with a ready message (and your best live offer). Press send. For fully automatic sending open the WhatsApp page.', 'WhatsApp तैयार मैसेज के साथ खुलता है (चालू सबसे अच्छे ऑफ़र के साथ)। बस भेज दीजिए। पूरी तरह अपने-आप भेजने के लिए WhatsApp पेज खोलिए।'),
    `<label class="fl" style="margin:0"><span>${esc(L('Remind this many days before', 'इतने दिन पहले याद दिलाएँ'))}</span><input class="in" id="rdays" type="number" min="1" max="14" value="${d}" data-bind="rdays" style="width:90px"></label>`)
    + card(L(`Ending within ${d} day(s)`, `${d} दिन में खत्म`), 'clock', '', soon.length ? `<ul class="list">${soon.map(row).join('')}</ul>` : empty(L('Nobody is due right now', 'अभी कोई नहीं'), ''))
    + `<div style="height:14px"></div>`
    + card(L('Ended in the last 14 days', 'पिछले 14 दिन में खत्म'), 'clock', '', lapsed.length ? `<ul class="list">${lapsed.map(row).join('')}</ul>` : empty(L('None', 'कोई नहीं'), ''))
    + (isAdmin() ? `<div style="height:14px"></div>` + card(L(`Pending dues · ${inr(sum(owing, (x) => x.amt))}`, `बकाया · ${inr(sum(owing, (x) => x.amt))}`), 'wallet', '', owing.length ? `<ul class="list">${owing.map(dueRow).join('')}</ul>` : empty(L('No pending dues', 'कोई बकाया नहीं'), '')) : '');
}
function markReminded(id) {
  DB.update('members', id, { reminded_on: todayISO() }).then(() => { bust('members'); setTimeout(() => { if (currentRoute() && currentRoute()[0] === 'reminders') render(); }, 700); }).catch(() => {});
}
async function refreshBadge() {
  const a = $('#nav a[href="#reminders"]'); if (!a) return;
  try {
    const ms = await Q.members(), n = ms.filter((m) => isDueSoon(m, U_REMIND.days) && m.reminded_on !== todayISO()).length;
    let b = $('.n', a);
    if (n) { if (!b) { b = document.createElement('span'); b.className = 'n'; a.appendChild(b); } b.textContent = n; } else if (b) b.remove();
  } catch (e) {}
}
/* ================= Fee receipt: generated with the gym logo; share as an image, download, or print / save as PDF ================= */
function amountWords(n) {
  n = Math.round(Number(n) * 100) / 100;
  const r = Math.floor(n), ps = Math.round((n - r) * 100);
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const two = (x) => (x < 20 ? a[x] : b[Math.floor(x / 10)] + (x % 10 ? ' ' + a[x % 10] : ''));
  const three = (x) => (x >= 100 ? a[Math.floor(x / 100)] + ' Hundred' + (x % 100 ? ' ' : '') : '') + (x % 100 ? two(x % 100) : '');
  const cr = Math.floor(r / 1e7), lk = Math.floor((r % 1e7) / 1e5), th = Math.floor((r % 1e5) / 1e3), rest = r % 1e3;
  let s = '';
  if (cr) s += three(cr) + ' Crore '; if (lk) s += two(lk) + ' Lakh '; if (th) s += two(th) + ' Thousand '; if (rest) s += three(rest);
  s = s.trim() || 'Zero';
  return `Rupees ${s}${ps ? ' and ' + two(ps) + ' Paise' : ''} Only`;
}
async function receiptData(p, m) {
  const [members, plans, invoices, payments] = await Promise.all([Q.members(), Q.plans(), Q.invoices(), Q.payments()]);
  const mem = members.find((x) => x.id === p.member_id) || m || {}, inv = invoices.find((i) => i.id === p.invoice_id) || null;
  return { p, m: mem, plan: plans.find((x) => x.id === mem.plan_id) || null, inv, balance: inv ? balanceOf(inv, paidByInvoice(payments)) : 0, gym: CTX.gym || {} };
}
let LOGO_IMG;
function loadLogo() {
  if (!LOGO_IMG) LOGO_IMG = new Promise((resolve) => { const i = new Image(); i.onload = () => resolve(i); i.onerror = () => resolve(null); i.src = 'logo.webp'; });
  return LOGO_IMG;
}
async function receiptBlob(d) {
  const W = 800, H = 1220, c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d'), F = '"Quicksand","Noto Sans Devanagari","Mukta",system-ui,-apple-system,"Segoe UI",sans-serif', GOLD = '#a67c1d', INK = '#1b1b1b', MUTE = '#666';
  const txt = (s, px, py, o = {}) => { x.font = `${o.w || 500} ${o.s || 26}px ${F}`; x.fillStyle = o.c || INK; x.textAlign = o.a || 'left'; x.fillText(String(s), px, py); };
  x.fillStyle = '#fff'; x.fillRect(0, 0, W, H);
  x.strokeStyle = GOLD; x.lineWidth = 6; x.strokeRect(22, 22, W - 44, H - 44); x.lineWidth = 1.5; x.strokeRect(34, 34, W - 68, H - 68);
  const logo = await loadLogo(); if (logo) x.drawImage(logo, W / 2 - 80, 58, 160, 160);
  txt((d.gym.name || 'Royal The Gym').toUpperCase(), W / 2, 262, { a: 'center', w: 800, s: 38, c: '#13264d' });
  txt([d.gym.city, d.gym.phone ? '📞 ' + d.gym.phone : ''].filter(Boolean).join('  ·  '), W / 2, 300, { a: 'center', s: 22, c: MUTE });
  x.fillStyle = GOLD; x.fillRect(W / 2 - 120, 322, 240, 3);
  txt('FEE RECEIPT  /  फ़ीस रसीद', W / 2, 376, { a: 'center', w: 800, s: 32, c: GOLD });
  const rows = [
    ['Receipt No. / रसीद नं.', d.p.no || '—'], ['Date / तारीख़', fmtDate(d.p.paid_on || todayISO())],
    ['Member / सदस्य', d.m.name || '—'], ['Phone / फ़ोन', d.m.phone || '—'],
    ['Plan / प्लान', d.plan ? d.plan.name : '—'], ['Valid / अवधि', d.m.start_date && d.m.end_date ? `${fmtDate(d.m.start_date)} → ${fmtDate(d.m.end_date)}` : '—'],
    ['Invoice / इनवॉइस', d.inv ? `${d.inv.no || ''}  (${inr(d.inv.total)})` : '—'], ['Paid via / तरीक़ा', d.p.method + (d.p.ref ? ` · ${d.p.ref}` : '')],
  ];
  let y = 436;
  rows.forEach(([k, v], i) => { if (i % 2 === 0) { x.fillStyle = '#faf6ea'; x.fillRect(62, y - 34, W - 124, 50); } txt(k, 78, y, { s: 22, c: MUTE }); txt(v, W - 78, y, { a: 'right', w: 700, s: 25 }); y += 50; });
  y += 14;
  x.fillStyle = '#13264d'; x.beginPath(); x.roundRect(62, y, W - 124, 136, 18); x.fill();
  txt('AMOUNT RECEIVED  /  प्राप्त राशि', W / 2, y + 40, { a: 'center', s: 21, c: '#e7d9a8' });
  txt(inr(d.p.amount), W / 2, y + 96, { a: 'center', w: 800, s: 56, c: '#ffffff' });
  y += 176;
  txt(amountWords(d.p.amount), W / 2, y, { a: 'center', s: 21, c: MUTE, w: 600 });
  y += 42;
  if (d.balance > 0.004) txt(`Balance due / बाक़ी: ${inr(d.balance)}`, W / 2, y, { a: 'center', w: 800, s: 28, c: '#b3261e' });
  else txt('✓ Fully paid / पूरा चुकाया', W / 2, y, { a: 'center', w: 800, s: 28, c: '#1e7a3c' });
  txt('Thank you! Train like royalty 💪  /  धन्यवाद!', W / 2, H - 96, { a: 'center', w: 700, s: 26, c: '#13264d' });
  txt('Computer-generated receipt. Valid without signature.', W / 2, H - 66, { a: 'center', s: 16, c: MUTE });
  txt('कंप्यूटर द्वारा बनी रसीद, हस्ताक्षर की ज़रूरत नहीं।', W / 2, H - 46, { a: 'center', s: 16, c: MUTE });
  return new Promise((resolve, reject) => c.toBlob((b) => (b ? resolve(b) : reject(new Error('png'))), 'image/png'));
}
function downloadBlob(name, blob) {
  const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000);
}
function printImage(url) {
  const area = $('#printArea'); area.innerHTML = `<img alt="" src="${url}" style="width:100%">`;
  const img = $('img', area), go = () => { document.body.classList.add('printing'); const done = () => { document.body.classList.remove('printing'); area.innerHTML = ''; window.removeEventListener('afterprint', done); }; window.addEventListener('afterprint', done); window.print(); };
  if (img.complete) go(); else img.onload = go;
}
function receiptModal(p, m) {
  m = m || {};
  let url = null, blob = null;
  const mod = openModal({
    title: L('Receipt', 'रसीद'), wide: true,
    body: `<div id="rcBox" class="muted" style="text-align:center;min-height:160px;display:grid;place-items:center">${esc(L('Preparing receipt…', 'रसीद बन रही है…'))}</div>`,
    footer: `<a class="btn wa" target="_blank" rel="noreferrer" href="${esc(waLink(m.phone, receiptText(p, m)))}">${ic('msg')} ${esc(L('WhatsApp text', 'WhatsApp मैसेज'))}</a><button type="button" class="btn" data-sh disabled>${ic('copy')} ${esc(L('Share image', 'फ़ोटो भेजें'))}</button><button type="button" class="btn" data-dl disabled>${ic('down')} ${esc(L('Download', 'डाउनलोड'))}</button><button type="button" class="btn primary" data-pr disabled>${esc(L('Print / PDF', 'प्रिंट / PDF'))}</button>`,
    onClose: () => { if (url) URL.revokeObjectURL(url); },
  });
  const name = `${(p.no || 'receipt').replace(/[^\w-]+/g, '_')}.png`;
  (async () => {
    try {
      blob = await receiptBlob(await receiptData(p, m)); url = URL.createObjectURL(blob);
      if (!mod.el.isConnected) { URL.revokeObjectURL(url); return; }
      $('#rcBox', mod.el).style.display = 'block'; $('#rcBox', mod.el).innerHTML = `<img alt="${esc(L('Receipt', 'रसीद'))}" src="${url}" style="width:100%;max-width:440px;border-radius:8px;border:1px solid var(--line)">`;
      $$('[data-sh],[data-dl],[data-pr]', mod.el).forEach((b) => (b.disabled = false));
    } catch (e) { const bx = $('#rcBox', mod.el); if (bx) bx.textContent = L('Could not draw the receipt image. Use the WhatsApp text instead.', 'रसीद की फ़ोटो नहीं बन सकी। WhatsApp मैसेज इस्तेमाल करें।'); }
  })();
  $('[data-dl]', mod.el).onclick = () => blob && downloadBlob(name, blob);
  $('[data-pr]', mod.el).onclick = () => url && printImage(url);
  $('[data-sh]', mod.el).onclick = async () => {
    if (!blob) return;
    const file = new File([blob], name, { type: 'image/png' });
    try { if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: `${gymName()} ${L('receipt', 'रसीद')}`, text: receiptText(p, m) }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
    downloadBlob(name, blob); toast(L('Sharing is not supported here, so the image was downloaded. Send it on WhatsApp from your gallery.', 'यहाँ सीधे शेयर नहीं हो सकता, इसलिए फ़ोटो डाउनलोड हुई। गैलरी से WhatsApp पर भेजें।'));
  };
}
/* ================= Automatic WhatsApp: receipt after payment, expiry reminder, due-payment reminder =================
   The database queues the messages (trigger on payments + a daily 09:00 IST job) and the wa-dispatch Edge Function
   sends them through the Meta WhatsApp Cloud API. Nothing is sent until the gym owner connects WhatsApp (see the guide on this page). */
const WA_DEFAULT = { auto_receipt: false, auto_expiry: false, expiry_days: 2, auto_dues: false, dues_every_days: 7, tpl_receipt: 'fee_receipt', tpl_expiry: 'membership_expiry', tpl_dues: 'fee_due', tpl_lang: 'hi' };
Q.waSettings = () => cached('wa_settings', async () => ({ ...WA_DEFAULT, ...((await DB.select('wa_settings', { limit: 1 }))[0] || {}) }));
Q.waLog = () => cached('wa_log', () => DB.select('wa_log', { order: 'created_at.desc', limit: 60 }));

async function waFn(body) {
  if (SESSION && SESSION.expires_at && SESSION.expires_at - 30 < Date.now() / 1000) await refreshSession();
  const res = await rawFetch('/functions/v1/wa-dispatch', { method: 'POST', headers: { apikey: CFG.key, Authorization: 'Bearer ' + (SESSION && SESSION.access_token), 'Content-Type': 'application/json' }, body: JSON.stringify({ gym_id: gymId(), ...body }) });
  const j = await res.json().catch(() => ({}));
  if (res.status === 401) { saveSession(null); if (typeof onSignedOut === 'function') onSignedOut(); throw new ApiError('session expired', 401, 'jwt'); }
  if (!res.ok && !j.error) j.error = 'HTTP ' + res.status;
  return j;
}

/* Template texts the owner pastes into Meta's template manager (category: Utility). Variables are filled by the system. */
function waTemplates(gym) {
  const g = gym || 'Royal The Gym';
  return {
    receipt: { key: 'tpl_receipt', title: L('Fee receipt', 'फ़ीस रसीद'), vars: L('{{1}} name · {{2}} amount · {{3}} receipt no. · {{4}} date · {{5}} balance / fully paid', '{{1}} नाम · {{2}} रकम · {{3}} रसीद नं. · {{4}} तारीख़ · {{5}} बाकी / पूरा चुकाया'),
      text: `नमस्ते {{1}} जी, आपका {{2}} का भुगतान मिल गया। रसीद नं. {{3}}, तारीख़ {{4}}। {{5}}। धन्यवाद! - ${g}` },
    expiry: { key: 'tpl_expiry', title: L('Membership expiry', 'सदस्यता खत्म होने से पहले'), vars: L('{{1}} name · {{2}} end date · {{3}} days left', '{{1}} नाम · {{2}} अंतिम तारीख़ · {{3}} बचे दिन'),
      text: `नमस्ते {{1}} जी, आपकी जिम सदस्यता {{2}} को खत्म हो रही है ({{3}} दिन बाकी)। रिन्यू के लिए जिम आइए या हमें संपर्क कीजिए। - ${g}` },
    dues: { key: 'tpl_dues', title: L('Due payment', 'बकाया भुगतान'), vars: L('{{1}} name · {{2}} amount due · {{3}} UPI ID', '{{1}} नाम · {{2}} बकाया रकम · {{3}} UPI ID'),
      text: `नमस्ते {{1}} जी, आपका {{2}} बकाया है। UPI: {{3}} पर भेज सकते हैं या जिम आकर जमा कीजिए। - ${g}` },
  };
}
const WA_KIND = () => ({ receipt: L('Receipt', 'रसीद'), expiry: L('Expiry', 'एक्सपायरी'), dues: L('Dues', 'बकाया'), test: L('Test', 'टेस्ट') });
const WA_STATUS = () => ({ queued: [L('Waiting', 'कतार में'), 'info'], sent: [L('Sent', 'भेजा'), 'ok'], failed: [L('Failed', 'फ़ेल'), 'bad'], skipped: [L('Skipped', 'छोड़ा'), 'mute'] });

async function vWhatsApp() {
  const [s, log, members] = await Promise.all([Q.waSettings(), Q.waLog().catch(() => []), Q.members()]);
  let conf = null; try { const r = await Promise.race([waFn({ action: 'status' }), new Promise((_, rej) => setTimeout(() => rej(new Error('t')), 6000))]); conf = r.configured === true ? true : r.configured === false ? false : null; } catch (e) { conf = null; }
  const mm = memberMap(members), st = WA_STATUS(), kinds = WA_KIND(), T = waTemplates(gymName());
  const count = (x) => log.filter((l) => l.status === x).length;
  const on = (b) => badge(b ? L('On', 'चालू') : L('Off', 'बंद'), b ? 'ok' : 'mute');
  const connBadge = conf === true ? badge(L('Connected', 'जुड़ा हुआ'), 'ok') : conf === false ? badge(L('Not connected yet', 'अभी जुड़ा नहीं'), 'info') : badge(L('Unknown', 'पता नहीं'), 'mute');
  const lock = CTX.locked ? 'disabled' : '';
  const head = pageHead(L('Setup', 'सेटअप'), L('Automatic WhatsApp', 'ऑटोमैटिक WhatsApp'),
    L('Receipts, expiry reminders and due-payment reminders go to every member by themselves. Members who opted out are skipped.', 'रसीद, एक्सपायरी रिमाइंडर और बकाया रिमाइंडर हर सदस्य को अपने-आप जाते हैं। जिन्होंने मना किया है उन्हें नहीं जाते।'),
    `<button class="btn" data-act="waTest" ${lock}>${ic('msg')} ${esc(L('Send test', 'टेस्ट भेजें'))}</button><button class="btn primary" data-act="waSettings" ${lock}>${ic('gear')} ${esc(L('Settings', 'सेटिंग'))}</button>`);
  const status = card(L('Status', 'स्थिति'), 'msg', connBadge,
    `<ul class="list">
      <li><div class="grow"><b>${esc(L('Fee receipt after every payment', 'हर भुगतान के बाद फ़ीस रसीद'))}</b><small>${esc(L('Sent within seconds of saving the payment', 'पेमेंट सेव होते ही कुछ सेकंड में'))}</small></div>${on(s.auto_receipt)}</li>
      <li><div class="grow"><b>${esc(L(`Expiry reminder ${s.expiry_days} day(s) before`, `एक्सपायरी से ${s.expiry_days} दिन पहले रिमाइंडर`))}</b><small>${esc(L('Every day at 9:00 AM', 'रोज़ सुबह 9:00 बजे'))}</small></div>${on(s.auto_expiry)}</li>
      <li><div class="grow"><b>${esc(L(`Due-payment reminder every ${s.dues_every_days} day(s)`, `बकाया रिमाइंडर हर ${s.dues_every_days} दिन में`))}</b><small>${esc(L('Only for invoices past their due date', 'सिर्फ़ उन इनवॉइस पर जिनकी देय तारीख़ निकल चुकी'))}</small></div>${on(s.auto_dues)}</li>
    </ul>
    ${conf === false ? `<p class="muted" style="margin:10px 0 0">${esc(L('WhatsApp is not connected yet, so messages wait in the queue and are sent once you finish the setup below. Messages older than 3 days are dropped.', 'WhatsApp अभी जुड़ा नहीं है, इसलिए मैसेज कतार में रुके रहेंगे और नीचे का सेटअप पूरा होते ही जाएँगे। 3 दिन से पुराने मैसेज नहीं भेजे जाते।'))}</p>` : ''}`);
  const tiles = `<div class="tiles" style="margin:14px 0">${tile(L('Waiting', 'कतार में'), String(count('queued')), '')}${tile(L('Sent', 'भेजे गए'), String(count('sent')), L('last 60', 'पिछले 60'), 'var(--ok, #1e7a3c)')}${tile(L('Failed', 'फ़ेल'), String(count('failed')), '', count('failed') ? 'var(--crimson)' : '')}</div>`;
  const steps = card(L('Connect WhatsApp (one time, about 30 minutes)', 'WhatsApp जोड़ें (एक बार, लगभग 30 मिनट)'), 'gear', '',
    `<ol class="muted" style="padding-left:20px;margin:0;display:grid;gap:8px;line-height:1.5">
      <li>${esc(L('Create a Meta Business account at business.facebook.com and open the WhatsApp product in developers.facebook.com (WhatsApp Cloud API).', 'business.facebook.com पर Meta Business अकाउंट बनाइए और developers.facebook.com में WhatsApp (Cloud API) चालू कीजिए।'))}</li>
      <li>${esc(L('Add the gym number. It must not be logged in to the normal WhatsApp app. Verify it with the OTP.', 'जिम का नंबर जोड़िए। वह नंबर साधारण WhatsApp ऐप में चालू नहीं होना चाहिए। OTP से वेरिफ़ाई कीजिए।'))}</li>
      <li>${esc(L('In WhatsApp Manager → Message templates, create the three templates below (category Utility, language Hindi) with exactly these names and texts. Approval takes a few minutes to a day.', 'WhatsApp Manager → Message templates में नीचे के तीनों टेम्पलेट (कैटेगरी Utility, भाषा Hindi) ठीक इन्हीं नामों और टेक्स्ट से बनाइए। अनुमोदन में कुछ मिनट से एक दिन लगता है।'))}</li>
      <li>${esc(L('Create a permanent access token (System User in Business Settings, permission whatsapp_business_messaging) and copy the Phone number ID.', 'स्थायी access token बनाइए (Business Settings में System User, अनुमति whatsapp_business_messaging) और Phone number ID कॉपी कीजिए।'))}</li>
      <li>${esc(L('In Supabase → Edge Functions → Secrets add WHATSAPP_TOKEN (the token) and WHATSAPP_PHONE_NUMBER_ID. Then press “Send test” here.', 'Supabase → Edge Functions → Secrets में WHATSAPP_TOKEN (टोकन) और WHATSAPP_PHONE_NUMBER_ID जोड़िए। फिर यहाँ “टेस्ट भेजें” दबाइए।'))}</li>
    </ol>
    <p class="muted" style="margin:10px 0 0">${esc(L('Meta charges per business-initiated conversation (roughly ₹0.1–0.8 for utility messages in India; check current rates). Only message members who gave their number to the gym, and use the member form to switch a member off if they ask to stop.', 'Meta हर बिज़नेस-शुरू की गई बातचीत पर शुल्क लेता है (भारत में utility मैसेज लगभग ₹0.1–0.8; ताज़ा दरें देखें)। सिर्फ़ उन्हें भेजें जिन्होंने जिम को अपना नंबर दिया है, और कोई रोकने को कहे तो सदस्य फ़ॉर्म से उसे बंद कर दीजिए।'))}</p>`);
  const tpls = card(L('Template texts to paste in Meta', 'Meta में चिपकाने के टेम्पलेट'), 'copy', '',
    Object.entries(T).map(([k, t]) => `<div style="margin-bottom:12px"><div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><b>${esc(t.title)} · <code>${esc(s[t.key])}</code></b><button class="btn sm" data-act="copyTpl" data-k="${k}">${ic('copy')} ${esc(L('Copy', 'कॉपी'))}</button></div><div class="muted" style="font-size:12px">${esc(t.vars)}</div><pre style="white-space:pre-wrap;margin:6px 0 0;padding:8px 10px;border:1px solid var(--line);border-radius:8px;font:inherit;font-size:13px">${esc(t.text)}</pre></div>`).join(''));
  const logCard = card(L('Message log', 'मैसेज लॉग'), 'clock', '', log.length ? `<ul class="list">${log.map((l) => { const m = l.member_id ? mm.get(l.member_id) : null, [lab, tone] = st[l.status] || [l.status, 'mute']; return `<li><div class="grow"><b>${esc(m ? m.name : (l.params && l.params[0]) || '—')} · ${esc(kinds[l.kind] || l.kind)}</b><small>${esc(fmtDate(istDate(l.created_at)))} ${esc(fmtTime(l.created_at))} · ${esc(l.to_phone || '')}${l.error ? ' · ' + esc(l.error) : ''}</small></div>${badge(lab, tone)}</li>`; }).join('')}</ul>` : empty(L('No messages yet', 'अभी कोई मैसेज नहीं'), L('They appear here as soon as a payment is saved or a reminder is due.', 'पेमेंट सेव होते या रिमाइंडर का समय आते ही यहाँ दिखेंगे।')));
  return head + status + tiles + steps + '<div style="height:14px"></div>' + tpls + '<div style="height:14px"></div>' + logCard;
}

async function waSettingsForm() {
  const s = await Q.waSettings();
  const tplCheck = (v) => (/^[a-z0-9_]{1,80}$/.test(v) ? '' : L('Lower-case letters, digits and _ only', 'सिर्फ़ छोटे अक्षर, अंक और _'));
  openForm({
    title: L('Automatic WhatsApp settings', 'ऑटोमैटिक WhatsApp सेटिंग'), values: s,
    fields: [
      { k: 'auto_receipt', label: L('Send the fee receipt after every payment', 'हर भुगतान के बाद फ़ीस रसीद भेजें'), type: 'check', full: true },
      { k: 'auto_expiry', label: L('Send a membership expiry reminder', 'सदस्यता एक्सपायरी का रिमाइंडर भेजें'), type: 'check', full: true },
      { k: 'expiry_days', label: L('…this many days before the end date', '…अंतिम तारीख़ से इतने दिन पहले'), type: 'number', min: 1, step: 1, check: (v) => (v >= 1 && v <= 14 && Number.isInteger(v) ? '' : L('1 to 14', '1 से 14')) },
      { k: 'auto_dues', label: L('Send due-payment reminders', 'बकाया भुगतान का रिमाइंडर भेजें'), type: 'check', full: true },
      { k: 'dues_every_days', label: L('…repeat every (days)', '…हर इतने दिन में दोहराएँ'), type: 'number', min: 1, step: 1, check: (v) => (v >= 1 && v <= 30 && Number.isInteger(v) ? '' : L('1 to 30', '1 से 30')) },
      { k: 'tpl_lang', label: L('Template language', 'टेम्पलेट की भाषा'), type: 'select', options: [{ v: 'hi', l: 'Hindi (hi)' }, { v: 'en', l: 'English (en)' }, { v: 'en_US', l: 'English US (en_US)' }], def: s.tpl_lang },
      { k: 'tpl_receipt', label: L('Receipt template name', 'रसीद टेम्पलेट का नाम'), check: tplCheck },
      { k: 'tpl_expiry', label: L('Expiry template name', 'एक्सपायरी टेम्पलेट का नाम'), check: tplCheck },
      { k: 'tpl_dues', label: L('Dues template name', 'बकाया टेम्पलेट का नाम'), check: tplCheck },
    ],
    onSubmit: async (v) => {
      const row = { gym_id: gymId(), auto_receipt: !!v.auto_receipt, auto_expiry: !!v.auto_expiry, expiry_days: v.expiry_days, auto_dues: !!v.auto_dues, dues_every_days: v.dues_every_days, tpl_lang: v.tpl_lang, tpl_receipt: v.tpl_receipt, tpl_expiry: v.tpl_expiry, tpl_dues: v.tpl_dues, updated_at: new Date().toISOString() };
      const ok = await act(() => api('/rest/v1/wa_settings?on_conflict=gym_id', { method: 'POST', body: row, headers: { Prefer: 'resolution=merge-duplicates,return=representation' } }), L('Saved', 'सेव हुआ'));
      if (ok) { bust('wa_settings'); render(); } return !!ok;
    },
  });
}

async function waTestForm() {
  openForm({
    title: L('Send a test WhatsApp', 'टेस्ट WhatsApp भेजें'), values: { phone: (CTX.gym && CTX.gym.phone) || '' },
    fields: [{ k: 'phone', label: L('Mobile number to receive the test', 'टेस्ट पाने वाला मोबाइल नंबर'), type: 'tel', req: true, full: true }],
    onSubmit: async (v) => {
      let r; try { r = await waFn({ action: 'test', phone: v.phone }); } catch (e) { toast(friendlyError(e), 'bad'); return false; }
      if (r.configured === false) { toast(L('WhatsApp is not connected yet. Finish the setup steps first.', 'WhatsApp अभी जुड़ा नहीं है। पहले सेटअप के कदम पूरे कीजिए।'), 'bad'); return false; }
      if (!r.ok) { toast(r.error || L('Could not send', 'भेज नहीं सका'), 'bad'); return false; }
      toast(L('Test message sent. It uses the receipt template.', 'टेस्ट मैसेज भेजा गया। यह रसीद वाले टेम्पलेट से जाता है।')); bust('wa_log'); render(); return true;
    },
  });
}

async function copyWaTemplate(k) { const t = waTemplates(gymName())[k]; if (t) copyText(t.text, L('Template copied', 'टेम्पलेट कॉपी हुआ')); }
/* ================= Boot: auth gate, role routing, events ================= */
const NAV = {
  super_admin: [['gyms', 'building', 'Gyms', 'जिम', vSuperGyms], ['users', 'users', 'Users', 'यूज़र', vSuperUsers], ['audit', 'list', 'Audit log', 'ऑडिट लॉग', vSuperAudit], ['status', 'pulse', 'Status', 'स्थिति', vSuperStatus]],
  gym_admin: [['dashboard', 'home', 'Dashboard', 'डैशबोर्ड', vDashboard], ['members', 'users', 'Members', 'सदस्य', vMembers], ['reminders', 'clock', 'Reminders', 'रिमाइंडर', vReminders], ['whatsapp', 'msg', 'WhatsApp', 'WhatsApp', vWhatsApp], ['checkin', 'door', 'Check-in', 'चेक-इन', vCheckin], ['plans', 'tag', 'Plans', 'प्लान', vPlans], ['offers', 'crown', 'Offers', 'ऑफ़र', vOffers], ['invoices', 'receipt', 'Invoices', 'इनवॉइस', vInvoices], ['payments', 'wallet', 'Payments', 'भुगतान', vPayments], ['ledger', 'shield', 'Secure ledger', 'सुरक्षित लेजर', vLedger], ['retention', 'pulse', 'At risk', 'जोखिम', vRetention], ['peak', 'chart', 'Peak hours', 'भीड़ के समय', vPeak], ['settings', 'gear', 'Settings', 'सेटिंग', vSettings]],
  trainer: [['dashboard', 'home', 'Dashboard', 'डैशबोर्ड', vDashboard], ['members', 'users', 'Members', 'सदस्य', vMembers], ['reminders', 'clock', 'Reminders', 'रिमाइंडर', vReminders], ['checkin', 'door', 'Check-in', 'चेक-इन', vCheckin]],
  member: [['mine', 'home', 'My gym', 'मेरा जिम', vMine]],
};
const navFor = () => NAV[CTX.profile ? CTX.profile.role : ''] || [];
let RENDER_TOKEN = 0, WAITING = false;

function currentRoute() {
  const items = navFor(), h = location.hash.replace('#', '');
  return items.find((i) => i[0] === h) || items[0];
}

/* ---------- context ---------- */
async function loadContext() {
  const rows = await DB.select('profiles', { eq: { id: SESSION.user_id } });
  CTX.profile = rows[0] || null; CTX.gym = null; CTX.locked = false;
  if (!CTX.profile) return;
  if (CTX.profile.gym_id) {
    const g = await DB.select('gyms', { eq: { id: CTX.profile.gym_id } });
    CTX.gym = g[0] || null;
    CTX.locked = CTX.profile.role !== 'super_admin' && gymLocked(CTX.gym);
  }
}

/* ---------- screens ---------- */
function showGate(html) { $('#app').hidden = true; const g = $('#gate'); g.hidden = false; g.innerHTML = html; }
function loginScreen(msg) {
  showGate(`<div class="login"><section class="card"><div class="brand" style="padding:0"><span class="crest"><img src="logo.webp" alt="" width="38" height="38"></span><div><b>Royal The Gym</b><small>GymOS</small></div></div>
    <h1>${esc(L('Sign in', 'लॉगिन करें'))}</h1><p class="muted" style="margin:0">${esc(L('Use the email and password given by your gym.', 'अपने जिम से मिला ईमेल और पासवर्ड इस्तेमाल करें।'))}</p>
    ${msg ? `<div class="banner bad" style="margin:12px 0 0" role="alert">${esc(msg)}</div>` : ''}
    <form id="loginForm" novalidate><label class="fl"><span>${esc(L('Email', 'ईमेल'))}</span><input class="in" id="l_email" type="email" autocomplete="username" required></label>
    <label class="fl"><span>${esc(L('Password', 'पासवर्ड'))}</span><input class="in" id="l_pass" type="password" autocomplete="current-password" required></label>
    <button class="btn primary" id="l_go" type="submit">${esc(L('Sign in', 'लॉगिन'))}</button></form>
    <div style="display:flex;gap:8px;margin-top:14px"><button class="btn sm" type="button" data-act="lang">${ic('globe')} ${LANG === 'hi' ? 'English' : 'हिन्दी'}</button></div></section></div>`);
  const em = $('#l_email'); if (em) em.focus();
}
function waitingScreen() {
  showGate(`<div class="login"><section class="card"><h1>${esc(L('Waiting for approval', 'मंज़ूरी का इंतज़ार'))}</h1><p>${esc(L('Your account is created, but it is not linked to a gym yet. Ask your gym owner or the platform admin to assign you.', 'आपका अकाउंट बन गया है, पर अभी किसी जिम से नहीं जुड़ा। अपने जिम मालिक या प्लेटफ़ॉर्म एडमिन से जुड़वाएँ।'))}</p><p class="muted">${esc(SESSION.email || '')}</p>
    <div style="display:flex;gap:8px"><button class="btn" data-act="retry">${esc(L('Check again', 'फिर जाँचें'))}</button><button class="btn" data-act="signOut">${ic('out')} ${esc(L('Sign out', 'लॉग आउट'))}</button></div></section></div>`);
}
function chrome() {
  $('#gate').hidden = true; $('#app').hidden = false;
  const items = navFor(), cur = currentRoute();
  $('#nav').innerHTML = items.map((i) => `<a href="#${i[0]}" ${cur && cur[0] === i[0] ? 'aria-current="page"' : ''}>${ic(i[1])}<span>${esc(L(i[2], i[3]))}</span></a>`).join('');
  $('#date').textContent = fmtDate(todayISO());
  $('#gymName').textContent = CTX.gym ? CTX.gym.name : 'Royal The Gym';
  $('#pills').innerHTML = `<span class="pill">${esc(roleName(CTX.profile.role))}</span>${CTX.locked ? ` <span class="pill demo">${esc(L('Locked', 'लॉक'))}</span>` : ''}`;
  $('#who').textContent = SESSION.email || '';
  $('#langBtn').innerHTML = `${ic('globe')} ${LANG === 'hi' ? 'EN' : 'हि'}`;
  $('#langBtn').setAttribute('aria-label', L('Switch language', 'भाषा बदलें'));
  $('#themeBtn').innerHTML = ic(document.documentElement.dataset.theme === 'light' ? 'moon' : 'sun');
  $('#themeBtn').setAttribute('aria-label', L('Switch theme', 'थीम बदलें'));
  $('#pwBtn').innerHTML = ic('lock'); $('#pwBtn').setAttribute('aria-label', L('Change password', 'पासवर्ड बदलें')); $('#pwBtn').title = L('Change password', 'पासवर्ड बदलें');
  $('#outBtn').innerHTML = `${ic('out')}`; $('#outBtn').setAttribute('aria-label', L('Sign out', 'लॉग आउट'));
  document.documentElement.lang = LANG === 'hi' ? 'hi' : 'en';
}
function lockBanner() {
  if (!CTX.locked || !CTX.gym) return '';
  const forced = CTX.gym.lock_override === 'force_lock' || CTX.gym.status === 'suspended';
  return `<div class="banner bad" role="alert">${ic('lock')} ${esc(forced ? L('This gym is locked by the platform admin. You can view data but not change it.', 'यह जिम प्लेटफ़ॉर्म एडमिन ने लॉक किया है। आप डेटा देख सकते हैं, बदल नहीं सकते।') : L(`Subscription ended on ${fmtDate(CTX.gym.subscription_ends_on)}. You can view data but not change it. Renew to continue.`, `सब्सक्रिप्शन ${fmtDate(CTX.gym.subscription_ends_on)} को खत्म हुआ। आप डेटा देख सकते हैं, बदल नहीं सकते। जारी रखने के लिए रिन्यू करें।`))}</div>`;
}
async function render() {
  if (!CTX.profile) return;
  const token = ++RENDER_TOKEN, route = currentRoute(), view = $('#view');
  if (!route) { view.innerHTML = empty(L('Nothing to show', 'दिखाने को कुछ नहीं'), ''); return; }
  chrome();
  const focusId = document.activeElement && document.activeElement.dataset && document.activeElement.dataset.bind ? document.activeElement.id : null;
  const caret = focusId ? document.activeElement.selectionStart : 0;
  if (!view.dataset.ready || view.dataset.route !== route[0]) { view.innerHTML = loadingHtml(); }
  let html;
  try { html = await route[4](); } catch (e) {
    if (token !== RENDER_TOKEN) return;
    if (e && e.status === 401) return;
    view.dataset.ready = '1'; view.dataset.route = route[0];
    view.innerHTML = `<div class="card">${empty(L('Could not load this page', 'यह पेज लोड नहीं हो सका'), friendlyError(e), `<button class="btn" data-act="retry">${esc(L('Try again', 'फिर कोशिश करें'))}</button>`)}</div>`;
    return;
  }
  if (token !== RENDER_TOKEN) return;
  view.dataset.ready = '1'; view.dataset.route = route[0];
  view.innerHTML = lockBanner() + html; refreshBadge();
  if (focusId) { const el = document.getElementById(focusId); if (el) { el.focus(); try { el.setSelectionRange(caret, caret); } catch (e) {} } }
}
async function enter() {
  try { await loadContext(); } catch (e) { if (e && e.status === 401) return; showGate(`<div class="login"><section class="card"><h1>${esc(L('Could not connect', 'कनेक्ट नहीं हो सका'))}</h1><p>${esc(friendlyError(e))}</p><button class="btn" data-act="retry">${esc(L('Try again', 'फिर कोशिश करें'))}</button> <button class="btn" data-act="signOut">${esc(L('Sign out', 'लॉग आउट'))}</button></section></div>`); return; }
  const p = CTX.profile;
  if (!p || (p.role !== 'super_admin' && !p.gym_id)) { waitingScreen(); return; }
  if (!navFor().length) { waitingScreen(); return; }
  $('#view').dataset.ready = ''; render();
}
function onSignedOut() { bust(); CTX.profile = null; CTX.gym = null; CTX.locked = false; RENDER_TOKEN++; loginScreen(L('Please sign in again.', 'कृपया दोबारा लॉगिन करें।')); }

/* ---------- actions ---------- */
const CHIP = { memF: (v) => { U.members.f = v; U.members.page = 1; }, invF: (v) => { U.invoices.f = v; U.invoices.page = 1; }, peakD: (v) => { U.peak.days = v; } };
const BIND = { mq: (v) => { U.members.q = v; U.members.page = 1; }, cq: (v) => { U.checkin.q = v; }, iq: (v) => { U.invoices.q = v; U.invoices.page = 1; }, pq: (v) => { U.payments.q = v; U.payments.page = 1; }, rdays: (v) => { const n = Math.min(14, Math.max(1, parseInt(v, 10) || 2)); U_REMIND.days = n; try { localStorage.setItem('gymos-remind-days', String(n)); } catch (e) {} }, thr: (v) => { const n = Math.min(30, Math.max(1, parseInt(v, 10) || 4)); U.retention.thr = n; try { localStorage.setItem('gymos-thr', String(n)); } catch (e) {} } };
const ACTIONS = {
  newGym: () => gymForm(), extendGym: (d) => extendForm(d.id), lockGym: (d) => lockForm(d.id), assignUser: (d) => assignForm(d.id),
  newMember: () => memberForm(), openMember: (d) => memberModal(d.id), checkIn: (d) => doCheckIn(d.id), checkOut: (d) => doCheckOut(d.id),
  newPlan: () => planForm(), editPlan: (d) => planForm(d.id), newInvoice: () => invoiceForm(), openInvoice: (d) => invoiceModal(d.id),
  openReceipt: async (d) => { const [pays, ms] = await Promise.all([Q.payments(), Q.members()]); const p = pays.find((x) => x.id === d.id); if (p) { closeAllModals(); receiptModal(p, ms.find((m) => m.id === p.member_id)); } },
  payCsv: () => exportPayments(), verifyLedger: () => runVerify(), ledgerCsv: () => exportLedger(), editGym: () => editGymForm(),
  copyUpi: () => copyText(upiOf(), L('UPI ID copied', 'UPI आईडी कॉपी हुई')),
  chip: (d) => { CHIP[d.key] && CHIP[d.key](d.v); render(); },
  page: (d) => { const s = U[d.key]; if (s) { s.page = Math.max(1, s.page + Number(d.d)); render(); } },
  retry: () => { bust(); CTX.profile ? render() : enter(); },
  lang: () => { LANG = LANG === 'hi' ? 'en' : 'hi'; try { localStorage.setItem('gymos-lang', LANG); } catch (e) {} if (CTX.profile) render(); else if (SESSION) enter(); else loginScreen(); },
  theme: () => { const r = document.documentElement, nx = r.dataset.theme === 'light' ? 'dark' : 'light'; r.dataset.theme = nx; try { localStorage.setItem('gymos-theme', nx); } catch (e) {} chrome(); },
  importMembers: () => importForm(), membersCsv: () => exportMembers(), newOffer: () => offerForm(), editOffer: (d) => offerForm(d.id), shareOffer: (d) => shareOffer(d.id),
  newTrainer: () => accountForm('trainer'), waSettings: () => waSettingsForm(), waTest: () => waTestForm(), copyTpl: (d) => copyWaTemplate(d.k),
  changePw: () => openForm({
    title: L('Change password', 'पासवर्ड बदलें'),
    fields: [
      { k: 'pw', label: L('New password (8+ characters)', 'नया पासवर्ड (कम से कम 8 अक्षर)'), type: 'password', req: true, full: true, check: (v) => (v.length < 8 ? L('At least 8 characters', 'कम से कम 8 अक्षर') : '') },
      { k: 'pw2', label: L('Repeat new password', 'नया पासवर्ड दोबारा'), type: 'password', req: true, full: true, check: (v, o) => (v !== o.pw ? L('Passwords do not match', 'पासवर्ड मेल नहीं खाते') : '') },
    ],
    onSubmit: async (v) => { const ok = await act(() => Auth.changePassword(v.pw), L('Password changed', 'पासवर्ड बदल गया')); return !!ok; },
  }),
  signOut: async () => { await Auth.signOut(); bust(); CTX.profile = null; RENDER_TOKEN++; loginScreen(); },
};
document.addEventListener('click', (e) => {
  const link = e.target.closest('a[href]');
  if (link && link.dataset.remind) markReminded(link.dataset.remind);
  if (link && (link.hasAttribute('data-stop') || link.classList.contains('wa'))) return; /* let WhatsApp links open; do not trigger the row */
  if (link && !e.target.closest('[data-act]')) return;
  const el = e.target.closest('[data-act]'); if (!el || el.disabled) return;
  const fn = ACTIONS[el.dataset.act]; if (!fn) return;
  e.preventDefault();
  Promise.resolve(fn(el.dataset)).catch((err) => { if (!(err && err.status === 401)) toast(friendlyError(err), 'bad'); });
});
let bindTimer;
document.addEventListener('input', (e) => {
  const id = e.target.dataset && e.target.dataset.bind; if (!id || !BIND[id]) return;
  BIND[id](e.target.value); clearTimeout(bindTimer); bindTimer = setTimeout(render, id === 'thr' || id === 'rdays' ? 500 : 220);
});
document.addEventListener('submit', async (e) => {
  if (e.target.id !== 'loginForm') return;
  e.preventDefault();
  const email = $('#l_email').value.trim(), pass = $('#l_pass').value, btn = $('#l_go');
  if (!email || !pass) { loginScreen(L('Enter email and password.', 'ईमेल और पासवर्ड लिखें।')); return; }
  btn.disabled = true;
  try { await Auth.signIn(email, pass); bust(); await enter(); } catch (err) { loginScreen(friendlyError(err)); const el = $('#l_email'); if (el) el.value = email; }
});
window.addEventListener('hashchange', () => { closeAllModals(); if (CTX.profile) render(); });

/* ---------- start ---------- */
(function start() {
  try { const t = localStorage.getItem('gymos-theme'); if (t) document.documentElement.dataset.theme = t; } catch (e) {}
  $('#langBtn').onclick = () => ACTIONS.lang(); $('#themeBtn').onclick = () => ACTIONS.theme(); $('#outBtn').onclick = () => ACTIONS.signOut(); $('#pwBtn').onclick = () => ACTIONS.changePw();
  if (SESSION && SESSION.refresh_token) enter(); else loginScreen();
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
  window.addEventListener('offline', () => toast(L('You are offline. Changes cannot be saved until the internet is back.', 'इंटरनेट नहीं है। इंटरनेट आने तक बदलाव सेव नहीं होंगे।'), 'bad'));
})();
