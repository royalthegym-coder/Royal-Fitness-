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
  check: '<path d="M20 6 9 17l-5-5"/>', gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/>', star: '<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>', left: '<path d="m15 18-6-6 6-6"/>', right: '<path d="m9 18 6-6-6-6"/>',
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
  if (f.list) inner = inner.replace('<input ', `<input list="${id}_dl" `) + `<datalist id="${id}_dl">${f.list.map((o) => `<option value="${esc(o)}">`).join('')}</datalist>`;
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
    if (btn.disabled) return; // Enter pressed again while a save is running must not save twice
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
  const rows0 = await Q.overview(), t0 = todayISO(), sq = U.sg.q.trim().toLowerCase();
  const rows = rows0.filter((g) => (U.sg.f === 'all' || (U.sg.f === 'locked' ? g.locked : subState(g, t0) === U.sg.f)) && (!sq || `${g.name} ${g.city || ''}`.toLowerCase().includes(sq)));
  const lockBadge = (g) => (g.locked ? badge(L('Locked', 'लॉक'), 'bad') : badge(L('Open', 'खुला'), 'ok'));
  const ovr = (g) => (g.lock_override === 'none' ? '' : `<br><small class="muted">${esc(g.lock_override === 'force_lock' ? L('forced lock', 'जबरन लॉक') : L('forced open', 'जबरन खुला'))}</small>`);
  return pageHead(L('Super admin', 'सुपर एडमिन'), L('Gyms', 'जिम'), L('Every gym, its subscription and lock. Member and payment details are not visible here.', 'हर जिम, उसकी सदस्यता और लॉक। सदस्य और भुगतान का ब्योरा यहाँ नहीं दिखता।'), `<button class="btn primary" data-act="newGym">${ic('plus')} ${esc(L('New gym', 'नया जिम'))}</button>`)
    + `<div class="tiles">${tile(L('Gyms', 'जिम'), rows0.length)}${tile(L('Locked now', 'अभी लॉक'), rows0.filter((g) => g.locked).length, '', rows0.some((g) => g.locked) ? 'var(--crimson)' : '')}${tile(L('Members in total', 'कुल सदस्य'), sum(rows0, (g) => g.members))}${tile(L('Ending in 7 days', '7 दिन में खत्म'), rows0.filter((g) => g.subscription_ends_on && diffDays(todayISO(), g.subscription_ends_on) >= 0 && diffDays(todayISO(), g.subscription_ends_on) <= 7).length)}</div>`
    + chipsHtml('sgF', U.sg.f, [['all', L('All', 'सभी'), rows0.length], ['locked', L('Locked', 'लॉक'), rows0.filter((g) => g.locked).length], ['soon', L('Ending soon', 'जल्दी ख़त्म'), rows0.filter((g) => subState(g, t0) === 'soon').length], ['expired', L('Expired', 'ख़त्म'), rows0.filter((g) => subState(g, t0) === 'expired').length]]) + searchBox('sgq', U.sg.q, L('Search gym or city', 'जिम या शहर खोजें'))
    + `<div class="card">${rows.length ? `<div class="tw"><table class="t"><thead><tr><th>${esc(L('Gym', 'जिम'))}</th><th>${esc(L('Plan', 'प्लान'))}</th><th>${esc(L('Valid till', 'तारीख़ तक'))}</th><th>${esc(L('State', 'स्थिति'))}</th><th class="r">${esc(L('Members', 'सदस्य'))}</th><th class="r">${esc(L('Staff', 'स्टाफ़'))}</th><th>${esc(L('Last visit', 'आख़िरी विज़िट'))}</th><th></th></tr></thead><tbody>${rows.map((g) => `<tr><td class="edge ${g.locked ? 'e-bad' : 'e-ok'}"><b>${esc(g.name)}</b><br><small class="muted">${esc(g.city || '')}</small></td><td>${esc(g.plan)}${g.status === 'suspended' ? '<br>' + badge(L('Suspended', 'निलंबित'), 'warn') : ''}</td><td class="num">${esc(fmtDate(g.subscription_ends_on))}</td><td>${lockBadge(g)}${ovr(g)}</td><td class="r num">${g.members}</td><td class="r num">${g.staff}</td><td class="num">${g.last_visit ? esc(fmtShort(g.last_visit)) : '—'}</td><td class="r" style="white-space:nowrap"><button class="btn sm" data-act="extendGym" data-id="${esc(g.gym_id)}">${esc(L('Subscription', 'सब्सक्रिप्शन'))}</button> <button class="btn sm" data-act="lockGym" data-id="${esc(g.gym_id)}">${ic('lock')} ${esc(L('Lock', 'लॉक'))}</button></td></tr>`).join('')}</tbody></table></div>` : (rows0.length ? empty(L('No gym matches', 'कोई जिम नहीं मिला'), '') : empty(L('No gyms yet', 'अभी कोई जिम नहीं'), L('Create the first gym, then assign its admin in Users.', 'पहला जिम बनाएँ, फिर Users में उसका एडमिन तय करें।'), `<button class="btn primary" data-act="newGym">${esc(L('New gym', 'नया जिम'))}</button>`))}</div>`;
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
  const [all, gyms] = await Promise.all([Q.profiles(), Q.gyms()]);
  const gm = new Map(gyms.map((g) => [g.id, g])), uq = U.su.q.trim().toLowerCase();
  const waiting = (p) => p.role !== 'super_admin' && !p.gym_id;
  const profiles = all.filter((p) => (U.su.f === 'all' || (U.su.f === 'waiting' ? waiting(p) : p.role === U.su.f)) && (!uq || `${p.full_name || ''} ${p.email || ''}`.toLowerCase().includes(uq)));
  return pageHead(L('Super admin', 'सुपर एडमिन'), L('Users', 'यूज़र'), L('Accounts are created in the Supabase dashboard. Assign each one a role and a gym here.', 'अकाउंट Supabase डैशबोर्ड में बनते हैं। यहाँ हर एक को भूमिका और जिम दें।'))
    + chipsHtml('suF', U.su.f, [['all', L('All', 'सभी'), all.length], ['waiting', L('Waiting', 'इंतज़ार में'), all.filter(waiting).length], ['gym_admin', L('Admins', 'एडमिन'), all.filter((p) => p.role === 'gym_admin').length], ['trainer', L('Trainers', 'ट्रेनर'), all.filter((p) => p.role === 'trainer').length], ['member', L('Members', 'सदस्य'), all.filter((p) => p.role === 'member').length]]) + searchBox('suq', U.su.q, L('Search name or email', 'नाम या ईमेल खोजें'))
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
const U = { members: { q: '', f: 'all', t: 'all', page: 1 }, checkin: { q: '' }, invoices: { f: 'all', q: '', page: 1 }, payments: { q: '', page: 1 }, ledger: { result: null, busy: false, page: 1 }, retention: { thr: 4 }, peak: { days: '28' } };
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
    + (isAdmin() ? '<div id="daySum"></div>' : '')
    + (isAdmin() ? await weeklyCard().catch(() => '') + '<div style="height:14px"></div>' : '')
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
  const me = CTX.profile ? CTX.profile.id : '', mine = members.filter((m) => m.trainer_id === me).length, loose = members.filter((m) => !m.trainer_id).length, anyTrainer = members.some((m) => m.trainer_id);
  let rows = members.filter((m) => (st.t === 'all' || (st.t === 'mine' ? m.trainer_id === me : !m.trainer_id)) && (st.f === 'all' || memberState(m) === st.f) && (!q || m.name.toLowerCase().includes(q) || String(m.phone || '').includes(q)));
  const total = rows.length; st.page = Math.min(st.page, Math.max(1, Math.ceil(total / PAGE))); rows = rows.slice((st.page - 1) * PAGE, st.page * PAGE);
  return pageHead(L('People', 'लोग'), L('Members', 'सदस्य'), '', `<button class="btn" data-act="membersCsv">${ic('down')} CSV</button>${isAdmin() ? `<button class="btn" data-act="importMembers" ${CTX.locked ? 'disabled' : ''}>${ic('down')} ${esc(L('Import', 'इम्पोर्ट'))}</button>` : ''}<button class="btn primary" data-act="newMember" ${CTX.locked ? 'disabled' : ''}>${ic('plus')} ${esc(L('New member', 'नया सदस्य'))}</button>`)
    + `<div class="bar">${searchBox('mq', st.q, L('Search name or phone', 'नाम या फ़ोन खोजें'))}</div>`
    + (anyTrainer || isAdmin() ? chipsHtml('memT', st.t, [['all', L('Everyone', 'सभी'), members.length], ['mine', L('My members', 'मेरे सदस्य'), mine], ...(isAdmin() ? [['none', L('No trainer', 'ट्रेनर नहीं'), loose]] : [])]) : '')
    + chipsHtml('memF', st.f, [['all', L('All', 'सभी'), counts.all], ...STATE_FILTERS.map((s) => [s, LANG === 'hi' ? STATE_HI[s] : s, counts[s]])])
    + `<div class="card">${rows.length ? `<div class="tw"><table class="t"><thead><tr><th>${esc(L('Photo', 'फ़ोटो'))}</th><th>${esc(L('Member', 'सदस्य'))}</th><th>${esc(L('Plan', 'प्लान'))}</th><th>${esc(L('Status', 'स्थिति'))}</th><th class="r">${esc(L('Valid till', 'तारीख़ तक'))}</th><th>${esc(L('Last visit', 'आख़िरी विज़िट'))}</th>${isAdmin() ? `<th class="r">${esc(L('Dues', 'बकाया'))}</th>` : ''}</tr></thead><tbody>${rows.map((m) => { const s = memberState(m), d = dues.get(m.id) || 0; return `<tr class="click" data-act="openMember" data-id="${esc(m.id)}"><td class="edge e-${TONE[s] || 'mute'}">${avatarM(m)}</td><td><b>${esc(m.name)}</b><br><small class="muted">${esc(m.phone || '')}</small></td><td>${esc((pm.get(m.plan_id) || {}).name || '—')}${m.trainer_id ? `<br><small class="muted">${esc(m.trainer_name || '')}</small>` : ''}</td><td>${badge(s)}</td><td class="r num">${esc(fmtDate(m.end_date))}</td><td class="num">${last.get(m.id) ? esc(fmtShort(last.get(m.id))) : '—'}</td>${isAdmin() ? `<td class="r num" style="color:${d ? 'var(--crimson)' : 'inherit'}">${d ? esc(inr(d)) : '—'}</td>` : ''}</tr>`; }).join('')}</tbody></table></div>${pagerHtml(total, st.page, 'members')}` : empty(members.length ? L('No members match', 'कोई सदस्य मेल नहीं खाता') : L('No members yet', 'अभी कोई सदस्य नहीं'), '', members.length ? '' : `<button class="btn primary" data-act="newMember">${esc(L('Add the first member', 'पहला सदस्य जोड़ें'))}</button>`)}</div>`;
}
const GOALS = ['Fat Loss', 'Muscle', 'Strength', 'General Fitness', 'Rehab'];
async function memberForm(id, prefill, onSaved) {
  const [members, plans, offers] = await Promise.all([Q.members(), Q.plans(), isAdmin() ? Q.offers() : []]);
  let trainers = []; if (isAdmin()) { try { trainers = (await Q.profiles()).filter((p) => p.gym_id === gymId() && (p.role === 'trainer' || p.role === 'gym_admin')); } catch (e) { /* the list is optional */ } }
  const liveOffers = offers.filter((o) => offerLive(o, todayISO()));
  const x = id ? members.find((m) => m.id === id) : null;
  const act2 = plans.filter((p) => p.status === 'Active');
  const fields = [
    { k: 'name', label: L('Name', 'नाम'), req: true, full: true }, { k: 'phone', label: L('Phone', 'फ़ोन'), type: 'tel', req: true },
    { k: 'gender', label: L('Gender', 'लिंग'), type: 'select', options: [{ v: '', l: '—' }, { v: 'Male', l: L('Male', 'पुरुष') }, { v: 'Female', l: L('Female', 'महिला') }, { v: 'Other', l: L('Other', 'अन्य') }] },
    { k: 'dob', label: L('Date of birth', 'जन्म की तारीख़'), type: 'date', check: (v) => (v && v > todayISO() ? L('Cannot be in the future', 'आगे की तारीख़ नहीं') : v && v < '1900-01-01' ? L('Check the year', 'साल जाँचें') : '') },
    { k: 'goal', label: L('Goal', 'लक्ष्य'), type: 'select', options: [{ v: '', l: '—' }, ...GOALS.map((g) => ({ v: g, l: g }))] },
    { k: 'plan_id', label: L('Plan', 'प्लान'), type: 'select', options: [{ v: '', l: L('No plan yet', 'अभी प्लान नहीं') }, ...act2.map((p) => ({ v: p.id, l: `${p.name} · ${inr(p.price)}` }))], def: x ? x.plan_id || '' : '' },
    { k: 'start_date', label: L('Start date', 'शुरू की तारीख़'), type: 'date', def: x ? x.start_date : todayISO() },
    { k: 'notes', label: L('Notes', 'नोट'), type: 'textarea', full: true },
  ];
  if (isAdmin()) fields.splice(fields.length - 1, 0, { k: 'referred_by', label: L('Referred by (member)', 'किसने जुड़वाया (सदस्य)'), type: 'select', full: true, options: [{ v: '', l: '—' }, ...members.filter((m) => !x || m.id !== x.id).sort((p, q) => p.name.localeCompare(q.name)).map((m) => ({ v: m.id, l: `${m.name} · ${m.phone || ''}` }))], def: x ? x.referred_by || '' : '' });
  if (isAdmin() && trainers.length) fields.push({ k: 'trainer_id', label: L('Trainer', 'ट्रेनर'), type: 'select', full: true, options: [{ v: '', l: L('Not assigned', 'सौंपा नहीं') }, ...trainers.map((p) => ({ v: p.id, l: (p.full_name || p.email || 'Trainer') + (p.role === 'gym_admin' ? ` (${L('owner', 'मालिक')})` : '') }))], def: x ? x.trainer_id || '' : '' });
  if (isAdmin()) fields.push({ k: 'wa_opt_out', label: L('Do not send automatic WhatsApp messages (member asked to stop)', 'ऑटोमैटिक WhatsApp मैसेज न भेजें (सदस्य ने मना किया)'), type: 'check', full: true });
  if (!x && isAdmin()) { fields.push({ k: 'bill', label: L('Create the first invoice for the plan', 'प्लान का पहला इनवॉइस बनाएँ'), type: 'check', def: true, full: true }); if (liveOffers.length) fields.push({ k: 'offer', label: L('Offer (applies to the invoice)', 'ऑफ़र (इनवॉइस पर लागू)'), type: 'select', options: [{ v: '', l: L('No offer', 'कोई ऑफ़र नहीं') }, ...liveOffers.map((o) => ({ v: o.id, l: `${o.name} · ${offerText(o)}` }))], full: true }); }
  openForm({
    title: x ? x.name : L('New member', 'नया सदस्य'), fields, values: x || prefill || {},
    onSubmit: async (v) => {
      const plan = plans.find((p) => p.id === v.plan_id);
      const start = v.start_date || todayISO();
      const row = { name: v.name, phone: v.phone, gender: v.gender || null, dob: v.dob || null, goal: v.goal || null, notes: v.notes || null, plan_id: plan ? plan.id : null };
      if (isAdmin()) row.wa_opt_out = !!v.wa_opt_out;
      if (isAdmin()) row.referred_by = v.referred_by || null;
      if (isAdmin() && trainers.length) row.trainer_id = v.trainer_id || null;
      if (plan && (!x || x.plan_id !== plan.id || x.start_date !== start)) { row.start_date = start; row.end_date = addDays(addMonths(start, plan.months), -1); }
      const saved = await act(() => (x ? DB.update('members', x.id, row) : DB.insert('members', { ...row, gym_id: gymId() })), L('Saved', 'सेव हुआ'));
      if (!saved) return false;
      if (!x && plan && v.bill && isAdmin()) {
        const off = liveOffers.find((o) => o.id === v.offer && (!o.plan_id || o.plan_id === plan.id)), disc = off ? offerDiscount(off, plan.price) : 0;
        const items = [{ label: `${plan.name} membership`, amount: Number(plan.price) }]; if (off && disc > 0) items.push({ label: `Offer: ${off.name}`, amount: 0 });
        await act(() => DB.insert('invoices', { gym_id: gymId(), member_id: saved.id, items, ...computeInvoice([{ amount: plan.price }], disc, plan.gst_pct), due: addDays(todayISO(), 7) }), L('Invoice created', 'इनवॉइस बना'));
      }
      bust('members', 'invoices'); if (onSaved) { try { await onSaved(saved); } catch (e) {} } render(); return true;
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
    body: `<div style="display:flex;gap:14px;align-items:center;margin-bottom:12px">${avatarM(m, true)}<div class="grow"><b>${esc(m.phone || '')}</b><div class="muted">${esc(plan ? plan.name : L('No plan', 'प्लान नहीं'))} · ${esc(m.goal || '')}${m.profile_id ? ' · ' + esc(L('app login linked', 'ऐप लॉगिन जुड़ा')) : ''}${m.trainer_id ? ' · ' + esc(L('Trainer', 'ट्रेनर') + ': ' + (m.trainer_name || '')) : ''}</div></div>${badge(s)}</div>
      <div class="tiles" style="margin-bottom:12px">${tile(L('Valid till', 'तारीख़ तक'), esc(fmtDate(m.end_date)), dl == null ? '' : dl >= 0 ? L(`${dl} days left`, `${dl} दिन बाक़ी`) : L(`${-dl} days ago`, `${-dl} दिन पहले`))}${isAdmin() ? tile(L('Dues', 'बकाया'), esc(inr(due)), '', due ? 'var(--crimson)' : '') : ''}</div>
      ${m.notes ? `<p class="muted">${esc(m.notes)}</p>` : ''}
      <h3 style="font-size:13px;margin:10px 0 4px">${esc(L('Recent visits', 'हाल की विज़िट'))}</h3>${vs.length ? `<ul class="list">${vs.map((v) => `<li><div class="grow"><b>${esc(fmtDate(v.in_at))}</b><small>${esc(fmtTime(v.in_at))}${v.out_at ? ' – ' + esc(fmtTime(v.out_at)) : ''}</small></div></li>`).join('')}</ul>` : `<div class="muted">${esc(L('No visits in the last 90 days', 'पिछले 90 दिन में कोई विज़िट नहीं'))}</div>`}
      ${isAdmin() ? `<h3 style="font-size:13px;margin:14px 0 4px">${esc(L('Invoices', 'इनवॉइस'))}</h3>${mine.length ? `<ul class="list">${mine.slice(0, 5).map((i) => `<li class="click" data-act="openInvoice" data-id="${esc(i.id)}"><div class="grow"><b class="num">${esc(i.no)}</b><small>${esc(fmtDate(i.date))}</small></div><span class="num">${esc(inr(i.total))}</span>${badge(invStatus(i, paid))}</li>`).join('')}</ul>` : `<div class="muted">—</div>`}` : ''}`,
    footer: `${waBtnRenew(m).replace('data-stop ', '')}${isAdmin() && !m.profile_id ? `<button type="button" class="btn" data-l>${ic('lock')} ${esc(L('Create login', 'लॉगिन बनाएँ'))}</button>` : ''}${isAdmin() && s === 'Frozen' ? `<button type="button" class="btn" data-uf>${ic('sun')} ${esc(L('Unfreeze', 'फ़्रीज़ हटाएँ'))}</button>` : isAdmin() && (s === 'Active' || s === 'Expiring') ? `<button type="button" class="btn" data-fz>${ic('moon')} ${esc(L('Freeze', 'फ़्रीज़'))}</button>` : ''}<button type="button" class="btn" data-pg>${ic('pulse')} ${esc(L('Progress', 'प्रगति'))}</button><button type="button" class="btn" data-wk>${ic('list')} ${esc(L('Workouts', 'वर्कआउट'))}</button><button type="button" class="btn" data-wl>${ic('moon')} ${esc(L('Habits', 'आदतें'))}</button><button type="button" class="btn" data-fp>${ic('pulse')} ${esc(L('Diet & workout', 'डाइट / वर्कआउट'))}</button><button type="button" class="btn" data-ph>${ic('plus')} ${esc(L('Photo', 'फ़ोटो'))}</button><input type="file" id="phIn" accept="image/*" hidden><button type="button" class="btn" data-e>${ic('pencil')} ${esc(L('Edit', 'बदलें'))}</button>${isAdmin() ? `<button type="button" class="btn primary" data-r>${esc(L('Renew', 'रिन्यू'))}</button>` : ''}`,
  });
  $('[data-e]', mod.el).onclick = () => { mod.close(); memberForm(id); };
  const phb = $('[data-ph]', mod.el), phIn = $('#phIn', mod.el);
  phb.onclick = () => phIn.click();
  phIn.onchange = async () => { const f = phIn.files[0]; if (!f) return; phb.disabled = true; try { await pickMemberPhoto(m, f, mod); } catch (e) { phb.disabled = CTX.locked; } };
  const fp = $('[data-fp]', mod.el); if (fp) fp.onclick = () => fitPlanModal(id);
  const fz = $('[data-fz]', mod.el); if (fz) fz.onclick = () => { mod.close(); freezeForm(m); };
  const uf = $('[data-uf]', mod.el); if (uf) uf.onclick = () => unfreezeMember(m);
  const pg = $('[data-pg]', mod.el); if (pg) pg.onclick = () => progressModal(id);
  const wk = $('[data-wk]', mod.el); if (wk) wk.onclick = () => workoutModal(id);
  const wl = $('[data-wl]', mod.el); if (wl) wl.onclick = () => habitsModal(id);
  const lg = $('[data-l]', mod.el); if (lg) lg.onclick = () => { mod.close(); accountForm('member', m); };
  const r = $('[data-r]', mod.el); if (r) r.onclick = () => { mod.close(); renewForm(id); };
  if (CTX.locked) { $$('[data-e],[data-r],[data-l],[data-ph],[data-fz],[data-uf]', mod.el).forEach((b) => (b.disabled = true)); }
}

/* ---------- Check-in ---------- */
async function vCheckin() {
  const [members, visits] = await Promise.all([Q.members(), Q.visits()]);
  const today = todayISO(), todays = visits.filter((v) => istDate(v.in_at) === today), open = new Map(todays.filter((v) => !v.out_at).map((v) => [v.member_id, v]));
  const q = U.checkin.q.trim().toLowerCase(), mm = memberMap(members);
  const found = q ? members.filter((m) => m.name.toLowerCase().includes(q) || String(m.phone || '').includes(q)).slice(0, 8) : [];
  return pageHead(L('Floor', 'फ़्लोर'), L('Check-in', 'चेक-इन'), L(`${todays.length} today · ${open.size} inside`, `आज ${todays.length} · अंदर ${open.size}`), `<button class="btn pri" data-act="openScan">${ic('door')} ${esc(L('Scan QR', 'QR स्कैन'))}</button>`)
    + `<div class="bar"><input class="in" id="scanIn" autocomplete="off" placeholder="${esc(L('Scanner code box', 'स्कैनर कोड बॉक्स'))}" aria-label="${esc(L('Scanner code box', 'स्कैनर कोड बॉक्स'))}" style="max-width:220px"></div>`
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
    + `<div class="grid2">${card(L('Gym', 'जिम'), 'building', '', `<ul class="list"><li><div class="grow"><small>${esc(L('Name', 'नाम'))}</small><b>${esc(g.name || '')}</b></div></li><li><div class="grow"><small>${esc(L('Owner', 'मालिक'))}</small><b>${esc(g.owner_name || '—')}</b></div></li><li><div class="grow"><small>${esc(L('Phone', 'फ़ोन'))}</small><b>${esc(g.phone || '—')}</b></div></li><li><div class="grow"><small>${esc(L('City', 'शहर'))}</small><b>${esc(g.city || '—')}</b></div></li><li><div class="grow"><small>UPI</small><b>${esc(g.upi_id || '—')}</b></div></li><li><div class="grow"><small>${esc(L('Gym timings', 'जिम का समय'))}</small><b>${esc(g.timings || '—')}</b></div></li><li><div class="grow"><small>${esc(L('Subscription valid till', 'सब्सक्रिप्शन की तारीख़'))}</small><b>${esc(fmtDate(g.subscription_ends_on))}</b></div>${CTX.locked ? badge(L('Locked', 'लॉक'), 'bad') : badge(L('Open', 'खुला'), 'ok')}</li></ul>`)}
    ${card(L('Team', 'टीम'), 'users', `<button class="btn sm" data-act="newTrainer" ${CTX.locked ? 'disabled' : ''}>${ic('plus')} ${esc(L('Trainer login', 'ट्रेनर लॉगिन'))}</button>`, staff.length ? `<ul class="list">${staff.map((p) => `<li>${avatar(p.full_name || p.email)}<div class="grow"><b>${esc(p.full_name || p.email || '—')}</b><small>${esc(p.email || '')}</small></div>${badge(roleName(p.role), 'mute')}</li>`).join('')}</ul><div class="muted" style="margin-top:8px">${esc(L('Roles are assigned by the platform admin.', 'भूमिकाएँ प्लेटफ़ॉर्म एडमिन तय करता है।'))}</div>` : empty(L('No team listed', 'टीम सूची में नहीं'), ''))}</div>` + reviewQrCard();
}
function editGymForm() {
  const g = CTX.gym || {};
  openForm({
    title: L('Edit gym', 'जिम बदलें'), values: { name: g.name, owner: g.owner_name, phone: g.phone, city: g.city, upi: g.upi_id, timings: g.timings || '', review: g.review_url || '' },
    fields: [
      { k: 'name', label: L('Gym name', 'जिम का नाम'), req: true, full: true, check: (v) => (v.length < 2 ? L('Too short', 'बहुत छोटा') : '') },
      { k: 'owner', label: L('Owner', 'मालिक') }, { k: 'phone', label: L('Phone', 'फ़ोन'), type: 'tel' }, { k: 'city', label: L('City', 'शहर') },
      { k: 'upi', label: L('Merchant UPI ID', 'मर्चेंट UPI आईडी'), ph: 'name@bank', check: (v) => (v && !UPI_RE.test(v) ? L('Example: name@bank', 'उदाहरण: name@bank') : '') },
      { k: 'review', label: L('Google review link', 'गूगल रिव्यू लिंक'), full: true, ph: 'https://g.page/r/…/review', check: (v) => (v && !reviewOk(v.trim()) ? L('Must start with https:// and be a Google link (g.page, search.google.com, maps.app.goo.gl)', 'https:// से शुरू होने वाला गूगल लिंक चाहिए (g.page, search.google.com, maps.app.goo.gl)') : '') },
      { k: 'timings', label: L('Gym timings', 'जिम का समय'), full: true, ph: L('Mon-Sat 5:30 AM - 10 PM, Sun 6-11 AM', 'सोम-शनि सुबह 5:30 - रात 10, रवि 6-11 सुबह'), check: (v) => (v.length > 200 ? L('Up to 200 characters', 'अधिकतम 200 अक्षर') : '') },
    ],
    onSubmit: async (v) => {
      const ok = await act(() => DB.rpc('admin_update_gym', { gym: gymId(), gym_name: v.name, owner: v.owner || null, phone_no: v.phone || null, city_name: v.city || null, upi: v.upi || null }).then(() => DB.rpc('admin_set_gym_timings', { gym: gymId(), timing_text: v.timings || null })).then(() => DB.rpc('admin_set_gym_review_url', { gym: gymId(), link: v.review ? v.review.trim() : null })), L('Saved', 'सेव हुआ'));
      if (ok) { await loadContext(); render(); } return !!ok;
    },
  });
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
  downloadCsv(`members-${todayISO()}.csv`, [['Name', 'Phone', 'Plan', 'Start', 'End', 'Status', 'Dues', 'Goal', 'Trainer', 'Notes'], ...members.map((m) => [m.name, m.phone, (pm.get(m.plan_id) || {}).name || '', m.start_date || '', m.end_date || '', memberState(m), dues.get(m.id) || 0, m.goal || '', m.trainer_id ? m.trainer_name || '' : '', m.notes || ''])]);
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
    + `<div style="height:14px"></div>` + birthdayCard(members) + `<div style="height:14px"></div>` + referralCard(members)
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
/* ================= Diet + workout plans =================
   Staff add a member's body details, press Generate (Edge Function generate-plan: numbers come from fixed rules, never guessed),
   review the draft, then Publish. Only published plans are visible in the member's own account. */
const tx = (o) => (o ? (LANG === 'hi' ? o.hi || o.en : o.en || o.hi) || '' : '');
const FIT_GOALS = () => [{ v: 'fat_loss', l: L('Fat loss', 'फ़ैट लॉस') }, { v: 'muscle_gain', l: L('Muscle gain', 'मसल गेन') }, { v: 'strength', l: L('Strength', 'ताक़त') }, { v: 'maintain', l: L('Stay fit', 'फ़िट रहना') }, { v: 'endurance', l: L('Endurance', 'स्टैमिना') }];
const planMemberFit = (id) => DB.select('member_fit', { eq: { member_id: id }, limit: 1 }).then((r) => r[0] || null);
const planRows = (id, extra = {}) => DB.select('member_plans', { eq: { member_id: id, ...extra }, order: 'created_at.desc', limit: 20 });

const GEN_ERR = {
  missing_profile: ['Add the body details first.', 'पहले शरीर की जानकारी भरिए।'], missing_age: ['Age is missing.', 'उम्र नहीं भरी है।'], missing_height_cm: ['Height is missing.', 'ऊँचाई नहीं भरी है।'], missing_weight_kg: ['Weight is missing.', 'वज़न नहीं भरा है।'],
  pregnancy: ['A plan is not generated automatically during pregnancy or breastfeeding. Please refer the member to a doctor.', 'गर्भावस्था या स्तनपान में प्लान अपने-आप नहीं बनता। सदस्य को डॉक्टर के पास भेजिए।'],
  staff_only: ['Only gym staff can do this.', 'यह सिर्फ़ जिम स्टाफ़ कर सकता है।'], not_found: ['Member not found.', 'सदस्य नहीं मिला।'], save_failed: ['Could not save the plan. The gym subscription may have expired.', 'प्लान सेव नहीं हो सका। जिम का सब्सक्रिप्शन खत्म हो सकता है।'],
};
async function generatePlanFn(memberId) {
  if (SESSION && SESSION.expires_at && SESSION.expires_at - 30 < Date.now() / 1000) await refreshSession();
  const res = await rawFetch('/functions/v1/generate-plan', { method: 'POST', headers: { apikey: CFG.key, Authorization: 'Bearer ' + (SESSION && SESSION.access_token), 'Content-Type': 'application/json' }, body: JSON.stringify({ member_id: memberId, seed: Math.floor(Math.random() * 2147483647) }) });
  const j = await res.json().catch(() => ({}));
  if (res.status === 401) { saveSession(null); if (typeof onSignedOut === 'function') onSignedOut(); throw new ApiError('session expired', 401, 'jwt'); }
  if (!res.ok) { const m = GEN_ERR[j.error]; const e = new ApiError(m ? L(m[0], m[1]) : 'failed', res.status, 'fn'); e.friendly = m ? L(m[0], m[1]) : null; throw e; }
  return j;
}

/* ---------- rendering (shared by staff and the member's own page) ---------- */
function planHtml(row, staff) {
  const s = row.summary || {}, c = row.content || {};
  const review = staff && row.needs_review && (s.review || []).length ? `<div class="note" style="border-color:var(--crimson);margin-bottom:10px"><b>${esc(L('Needs review before publishing', 'पब्लिश से पहले जाँच ज़रूरी'))}</b><ul style="margin:6px 0 0;padding-left:18px">${s.review.map((r) => `<li>${esc(tx(r))}</li>`).join('')}</ul></div>` : '';
  const coach = c.coach ? `<div class="note" style="margin-bottom:10px">${c.coach.note ? `<p style="margin:0 0 6px">${esc(tx(c.coach.note))}</p>` : ''}${(c.coach.tips || []).length ? `<ul style="margin:0;padding-left:18px">${c.coach.tips.map((t) => `<li>${esc(tx(t))}</li>`).join('')}</ul>` : ''}</div>` : '';
  const notes = (arr) => (arr && arr.length ? `<ul class="muted" style="padding-left:18px;margin:10px 0 0;display:grid;gap:4px">${arr.map((n) => `<li>${esc(tx(n))}</li>`).join('')}</ul>` : '');
  const pn = (s.notes || []);
  if (row.kind === 'diet') {
    const p = s.provides || {};
    const tiles = `<div class="tiles" style="margin-bottom:12px">${tile(L('Calories / day', 'कैलोरी / दिन'), esc(String(s.kcal)), p.kcal ? esc(L(`plan gives ${p.kcal}`, `प्लान में ${p.kcal}`)) : '')}${tile(L('Protein', 'प्रोटीन'), esc(s.protein + ' g'), p.p ? esc(L(`plan gives ${p.p} g`, `प्लान में ${p.p} g`)) : '')}${tile(L('Carbs', 'कार्ब्स'), esc(s.carbs + ' g'))}${tile(L('Fat', 'फ़ैट'), esc(s.fat + ' g'))}</div>`;
    const meals = (c.meals || []).map((m) => `<div style="margin-bottom:12px"><b>${esc(tx(m.name))}</b> <span class="muted">· ${esc(m.time || '')}</span>${m.options.map((o, i) => `<div style="margin:4px 0 0;padding:8px 10px;border:1px solid var(--line);border-radius:8px"><b style="font-size:12px">${esc(L('Option', 'विकल्प'))} ${'AB'[i]}</b> · <span class="muted">${esc(o.kcal)} kcal · P ${esc(o.p)} g</span><div>${o.items.map((it) => `${esc(it.qty)} ${esc(it.unit)} ${esc(tx(it.food))}`).join(' + ')}</div></div>`).join('')}</div>`).join('');
    return review + coach + `<p class="muted" style="margin:0 0 8px">${esc(L('BMI', 'BMI'))} ${esc(s.bmi)} · ${esc(tx(s.bmi_label))} · ${esc(s.weight_kg)} kg · ${esc(s.height_cm)} cm</p>` + tiles + notes(pn) + `<div style="height:10px"></div>` + meals + notes(c.notes);
  }
  const days = (c.days || []).map((d) => `<div style="margin-bottom:12px"><b>${esc(tx(d.day))} · ${esc(tx(d.focus))}</b><div style="overflow-x:auto"><table class="t" style="width:100%;margin-top:4px"><thead><tr><th>${esc(L('Exercise', 'एक्सरसाइज़'))}</th><th>${esc(L('Sets', 'सेट'))}</th><th>${esc(L('Reps', 'रेप'))}</th><th>${esc(L('Rest', 'आराम'))}</th></tr></thead><tbody>${d.exercises.map((e) => `<tr><td>${esc(e.name)}</td><td>${esc(e.sets)}</td><td>${esc(e.reps)}</td><td>${esc(e.rest || '')}</td></tr>`).join('')}</tbody></table></div></div>`).join('');
  return review + coach + days + (c.cardio ? `<p><b>${esc(L('Cardio', 'कार्डियो'))}:</b> ${esc(tx(c.cardio))}</p>` : '') + notes(c.notes);
}
function planText(row, name) {
  const s = row.summary || {}, c = row.content || {}, head = `${gymName()} · ${name || ''}\n${tx(s.title)}\n`;
  if (row.kind === 'diet') return head + `${s.kcal} kcal · P ${s.protein} g · C ${s.carbs} g · F ${s.fat} g\n\n` + (c.meals || []).map((m) => `${tx(m.name)} (${m.time}):\n A) ${m.options[0].items.map((i) => `${i.qty} ${i.unit} ${tx(i.food)}`).join(' + ')}\n B) ${m.options[1] ? m.options[1].items.map((i) => `${i.qty} ${i.unit} ${tx(i.food)}`).join(' + ') : ''}`).join('\n') + '\n\n' + (c.notes || []).map((n) => '• ' + tx(n)).join('\n');
  return head + '\n' + (c.days || []).map((d) => `${tx(d.day)} - ${tx(d.focus)}\n` + d.exercises.map((e) => ` • ${e.name}: ${e.sets} x ${e.reps}`).join('\n')).join('\n\n') + (c.cardio ? '\n\n' + tx(c.cardio) : '');
}
function printPlanHtml(html, title) {
  const area = $('#printArea'); area.innerHTML = `<h2 style="font-family:inherit">${esc(title)}</h2>${html}`;
  document.body.classList.add('printing');
  const done = () => { document.body.classList.remove('printing'); area.innerHTML = ''; window.removeEventListener('afterprint', done); };
  window.addEventListener('afterprint', done); window.print();
}
function planViewModal(row, member, staff) {
  const name = member ? member.name : '';
  const mod = openModal({
    title: `${tx((row.summary || {}).title) || row.title}${name ? ' · ' + name : ''}`, wide: true,
    body: `<div id="planBody">${planHtml(row, staff)}</div><p class="muted" style="margin-top:12px;font-size:12px">${esc(L('General fitness guidance, not medical advice. If you have a health condition, check with your doctor first. Stop any exercise that causes sharp pain.', 'यह सामान्य फ़िटनेस मार्गदर्शन है, चिकित्सा सलाह नहीं। कोई स्वास्थ्य समस्या हो तो पहले डॉक्टर से पूछिए। तेज़ दर्द हो तो एक्सरसाइज़ रोक दीजिए।'))}</p>`,
    footer: `${member && member.phone && staff ? `<a class="btn wa" target="_blank" rel="noreferrer" href="${esc(waLink(member.phone, planText(row, name)))}">${ic('msg')} WhatsApp</a>` : ''}<button type="button" class="btn" data-cp>${ic('copy')} ${esc(L('Copy', 'कॉपी'))}</button><button type="button" class="btn primary" data-pr>${esc(L('Print / PDF', 'प्रिंट / PDF'))}</button>`,
  });
  $('[data-cp]', mod.el).onclick = () => copyText(planText(row, name), L('Plan copied', 'प्लान कॉपी हुआ'));
  $('[data-pr]', mod.el).onclick = () => printPlanHtml(planHtml(row, false), `${gymName()} · ${name} · ${tx((row.summary || {}).title)}`);
}

/* ---------- staff: body details ---------- */
async function fitForm(memberId, after) {
  const [members, fit] = await Promise.all([Q.members(), planMemberFit(memberId)]), m = members.find((x) => x.id === memberId); if (!m) return;
  const num = (k, label, min, extra = {}) => ({ k, label, type: 'number', min, step: 'any', ...extra });
  const sel = (k, label, opts, def) => ({ k, label, type: 'select', options: opts.map(([v, l]) => ({ v, l })), def });
  openForm({
    title: `${L('Body details', 'शरीर की जानकारी')} · ${m.name}`, values: fit || {},
    fields: [
      num('age', L('Age (years)', 'उम्र (साल)'), 10, { req: true, check: (v) => (v >= 10 && v <= 90 ? '' : '10 – 90') }),
      num('height_cm', L('Height (cm)', 'ऊँचाई (सेमी)'), 100, { req: true, check: (v) => (v >= 100 && v <= 230 ? '' : '100 – 230') }),
      num('weight_kg', L('Weight (kg)', 'वज़न (किलो)'), 25, { req: true, check: (v) => (v >= 25 && v <= 250 ? '' : '25 – 250') }),
      num('target_weight_kg', L('Target weight (kg, optional)', 'लक्ष्य वज़न (किलो, ऐच्छिक)'), 25, { check: (v) => (v === '' || (v >= 25 && v <= 250) ? '' : '25 – 250') }),
      sel('goal', L('Goal', 'लक्ष्य'), FIT_GOALS().map((g) => [g.v, g.l]), fit ? fit.goal : 'fat_loss'),
      sel('diet_pref', L('Food preference', 'खाने की पसंद'), [['veg', L('Vegetarian', 'शाकाहारी')], ['egg', L('Eggetarian', 'अंडा खाने वाले')], ['nonveg', L('Non-vegetarian', 'मांसाहारी')], ['vegan', L('Vegan', 'वीगन')]], fit ? fit.diet_pref : 'veg'),
      sel('activity', L('Daily activity (outside the gym)', 'दिन भर की गतिविधि (जिम के बाहर)'), [['low', L('Mostly sitting', 'ज़्यादातर बैठकर')], ['moderate', L('Some walking / standing', 'थोड़ा चलना / खड़े रहना')], ['high', L('On feet / physical work', 'ज़्यादातर खड़े / शारीरिक काम')]], fit ? fit.activity : 'moderate'),
      sel('experience', L('Training experience', 'ट्रेनिंग का अनुभव'), [['beginner', L('Beginner (under 6 months)', 'शुरुआती (6 महीने से कम)')], ['intermediate', L('Intermediate (6 months - 2 years)', 'मध्यम (6 महीने - 2 साल)')], ['advanced', L('Advanced (2+ years)', 'अनुभवी (2+ साल)')]], fit ? fit.experience : 'beginner'),
      sel('days_per_week', L('Days per week', 'हफ़्ते में दिन'), [2, 3, 4, 5, 6].map((d) => [d, String(d)]), fit ? fit.days_per_week : 4),
      sel('session_min', L('Minutes per session', 'एक सेशन के मिनट'), [30, 45, 60, 75, 90].map((d) => [d, String(d)]), fit ? fit.session_min : 60),
      sel('equipment', L('Where', 'कहाँ'), [['gym', L('Gym', 'जिम')], ['home', L('Home (no equipment)', 'घर (बिना उपकरण)')]], fit ? fit.equipment : 'gym'),
      { k: 'injuries', label: L('Injuries / pain (knee, back, shoulder…)', 'चोट / दर्द (घुटना, कमर, कंधा…)'), type: 'textarea', full: true },
      { k: 'conditions', label: L('Health conditions (diabetes, BP, thyroid…) – a doctor must approve the plan', 'स्वास्थ्य समस्या (डायबिटीज़, BP, थायरॉइड…) – प्लान पर डॉक्टर की मंज़ूरी ज़रूरी'), type: 'textarea', full: true },
      { k: 'allergies', label: L('Food allergies', 'खाने की एलर्जी'), type: 'textarea', full: true },
    ],
    onSubmit: async (v) => {
      const t = (x) => (x && String(x).trim() ? String(x).trim().slice(0, 300) : null);
      const row = { member_id: memberId, gym_id: gymId(), age: Math.round(v.age), height_cm: v.height_cm, weight_kg: v.weight_kg, target_weight_kg: v.target_weight_kg === '' ? null : v.target_weight_kg, goal: v.goal, diet_pref: v.diet_pref, activity: v.activity, experience: v.experience, days_per_week: Number(v.days_per_week), session_min: Number(v.session_min), equipment: v.equipment, injuries: t(v.injuries), conditions: t(v.conditions), allergies: t(v.allergies), updated_at: new Date().toISOString() };
      const ok = await act(() => api('/rest/v1/member_fit?on_conflict=member_id', { method: 'POST', body: row, headers: { Prefer: 'resolution=merge-duplicates,return=representation' } }), L('Saved', 'सेव हुआ'));
      if (ok) { if (after) after(); else fitPlanModal(memberId); } return !!ok;
    },
  });
}

/* ---------- staff: generate, review, publish ---------- */
async function fitPlanModal(memberId) {
  const [members, fit, rows] = await Promise.all([Q.members(), planMemberFit(memberId).catch(() => null), planRows(memberId).catch(() => [])]), m = members.find((x) => x.id === memberId); if (!m) return;
  closeAllModals();
  const lock = CTX.locked ? 'disabled' : '', goal = fit ? (FIT_GOALS().find((g) => g.v === fit.goal) || {}).l : '';
  const kindLab = { diet: L('Diet', 'डाइट'), workout: L('Workout', 'वर्कआउट') };
  const stBadge = (r) => badge(r.status === 'published' ? L('Published', 'पब्लिश') : r.status === 'draft' ? L('Draft', 'ड्राफ़्ट') : L('Old', 'पुराना'), r.status === 'published' ? 'ok' : r.status === 'draft' ? 'info' : 'mute');
  const list = rows.filter((r) => r.status !== 'archived');
  const body = `<p class="muted" style="margin:0 0 10px">${fit ? esc(`${fit.age} ${L('yrs', 'साल')} · ${fit.height_cm} cm · ${fit.weight_kg} kg · ${goal} · ${fit.days_per_week} ${L('days/week', 'दिन/हफ़्ता')}`) : esc(L('Body details are not added yet.', 'शरीर की जानकारी अभी नहीं भरी।'))}</p>
    ${list.length ? `<ul class="list">${list.map((r) => `<li><div class="grow"><b>${esc(kindLab[r.kind])} · ${esc(tx((r.summary || {}).title) || r.title)}</b><small>${esc(fmtDate(istDate(r.created_at)))}${r.source === 'ai' ? ' · ' + esc(L('with coach note', 'कोच नोट के साथ')) : ''}${r.needs_review ? ' · ' + esc(L('needs review', 'जाँच ज़रूरी')) : ''}</small></div>${stBadge(r)}<button class="btn sm" data-v="${esc(r.id)}">${esc(L('View', 'देखें'))}</button>${r.status === 'draft' ? `<button class="btn sm primary" data-pub="${esc(r.id)}" ${lock}>${esc(L('Publish', 'पब्लिश'))}</button><button class="btn sm" data-del="${esc(r.id)}" ${lock}>${esc(L('Delete', 'हटाएँ'))}</button>` : `<button class="btn sm" data-unpub="${esc(r.id)}" ${lock}>${esc(L('Unpublish', 'वापस लें'))}</button>`}</li>`).join('')}</ul>` : empty(L('No plan yet', 'अभी कोई प्लान नहीं'), L('Add body details, then press Generate. Review the draft and publish it so the member sees it in their account.', 'शरीर की जानकारी भरिए, फिर Generate दबाइए। ड्राफ़्ट देखकर पब्लिश कीजिए, तब सदस्य को अपने अकाउंट में दिखेगा।'))}
    ${m.profile_id ? '' : `<p class="muted" style="margin-top:10px">${esc(L('This member has no app login yet, so create a login to let them see the plan. You can also share it on WhatsApp.', 'इस सदस्य का ऐप लॉगिन नहीं है, इसलिए प्लान दिखाने के लिए लॉगिन बनाइए। आप इसे WhatsApp पर भी भेज सकते हैं।'))}</p>`}`;
  const mod = openModal({
    title: `${L('Diet & workout', 'डाइट और वर्कआउट')} · ${m.name}`, wide: true, body,
    footer: `<button type="button" class="btn" data-fit ${lock}>${ic('pencil')} ${esc(L('Body details', 'शरीर की जानकारी'))}</button><button type="button" class="btn primary" data-gen ${fit && !CTX.locked ? '' : 'disabled'}>${ic('pulse')} ${esc(L('Generate plan', 'प्लान बनाएँ'))}</button>`,
  });
  $('[data-fit]', mod.el).onclick = () => { mod.close(); fitForm(memberId); };
  $('[data-gen]', mod.el).onclick = async (ev) => {
    const b = ev.currentTarget; b.disabled = true; b.textContent = L('Generating…', 'बन रहा है…');
    try { const r = await generatePlanFn(memberId); toast(r.needs_review ? L('Draft ready. It needs a review before publishing.', 'ड्राफ़्ट तैयार। पब्लिश से पहले जाँच ज़रूरी है।') : L('Draft ready. Review and publish.', 'ड्राफ़्ट तैयार। देखकर पब्लिश कीजिए।')); mod.close(); fitPlanModal(memberId); }
    catch (e) { toast(friendlyError(e), 'bad'); b.disabled = false; b.textContent = L('Generate plan', 'प्लान बनाएँ'); }
  };
  $$('[data-v]', mod.el).forEach((b) => (b.onclick = () => planViewModal(rows.find((r) => r.id === b.dataset.v), m, true)));
  $$('[data-pub]', mod.el).forEach((b) => (b.onclick = async () => {
    const r = rows.find((x) => x.id === b.dataset.pub);
    if (r.needs_review && !(await askConfirm(L('This plan needs a review (health condition, allergy or age). Publish only after the doctor or trainer has approved it. Publish now?', 'इस प्लान की जाँच ज़रूरी है (स्वास्थ्य समस्या, एलर्जी या उम्र)। डॉक्टर या ट्रेनर की मंज़ूरी के बाद ही पब्लिश कीजिए। अभी पब्लिश करें?'), L('Publish', 'पब्लिश'), 'primary'))) return;
    const ok = await act(() => DB.rpc('publish_member_plan', { p: r.id }), L('Published. The member can see it now.', 'पब्लिश हो गया। सदस्य को अब दिखेगा।'));
    if (ok) fitPlanModal(memberId);
  }));
  $$('[data-unpub]', mod.el).forEach((b) => (b.onclick = async () => { const ok = await act(() => DB.rpc('unpublish_member_plan', { p: b.dataset.unpub }), L('Taken back. The member no longer sees it.', 'वापस ले लिया। सदस्य को अब नहीं दिखेगा।')); if (ok) fitPlanModal(memberId); }));
  $$('[data-del]', mod.el).forEach((b) => (b.onclick = async () => { if (!(await askConfirm(L('Delete this draft?', 'यह ड्राफ़्ट हटाएँ?'), L('Delete', 'हटाएँ')))) return; const ok = await act(() => DB.remove('member_plans', b.dataset.del), L('Deleted', 'हटाया')); if (ok) fitPlanModal(memberId); }));
}

/* ---------- member's own page: published plans, while the membership is active ---------- */
async function mineFitCards(m) {
  let rows = []; try { rows = await planRows(m.id, { status: 'published' }); } catch (e) { return ''; }
  if (!rows.length) return '';
  if (memberState(m) === 'Expired') return `<div style="height:14px"></div>` + card(L('My diet & workout plan', 'मेरा डाइट और वर्कआउट प्लान'), 'pulse', '', empty(L('Renew your membership to see your plan', 'प्लान देखने के लिए सदस्यता रिन्यू कीजिए'), L('Your plan is saved and will be back as soon as the membership is renewed.', 'आपका प्लान सुरक्षित है, सदस्यता रिन्यू होते ही फिर दिखेगा।')));
  const latest = ['diet', 'workout'].map((k) => rows.find((r) => r.kind === k)).filter(Boolean);
  window.__minePlans = latest;
  return `<div style="height:14px"></div>` + card(L('My diet & workout plan', 'मेरा डाइट और वर्कआउट प्लान'), 'pulse', '', `<ul class="list">${latest.map((r, i) => `<li class="click" data-act="openMyPlan" data-i="${i}"><div class="grow"><b>${esc(tx((r.summary || {}).title) || r.title)}</b><small>${esc(L('Updated', 'अपडेट'))} ${esc(fmtDate(r.published_at ? istDate(r.published_at) : istDate(r.created_at)))}</small></div>${ic('right')}</li>`).join('')}</ul>`);
}
/* ================= Owner's dashboard: short Hindi summary of today's collection, dues and check-ins =================
   Built by the daily-summary Edge Function (numbers from the database; an AI gateway may only re-word the text). */
async function fetchDaySummary() {
  if (SESSION && SESSION.expires_at && SESSION.expires_at - 30 < Date.now() / 1000) await refreshSession();
  const res = await rawFetch('/functions/v1/daily-summary', { method: 'POST', headers: { apikey: CFG.key, Authorization: 'Bearer ' + (SESSION && SESSION.access_token), 'Content-Type': 'application/json' }, body: '{}' });
  if (res.status === 401) { saveSession(null); if (typeof onSignedOut === 'function') onSignedOut(); throw new ApiError('session expired', 401, 'jwt'); }
  const j = await res.json().catch(() => ({}));
  if (!res.ok || !j.text) throw new Error(j.error || 'HTTP ' + res.status);
  return j;
}
async function loadDaySummary() {
  const box = $('#daySum'); if (!box) return;
  const hour = new Date(Date.now() + 5.5 * 3600 * 1000).getUTCHours(), evening = hour >= 21;
  const title = evening ? L('Today\'s summary', 'आज का सारांश') : L('Today so far', 'आज अब तक');
  const draw = (body) => { const b = $('#daySum'); if (b) b.innerHTML = body; };
  draw(card(title, 'pulse', '', `<p class="muted" style="margin:0">${esc(L('Preparing…', 'तैयार हो रहा है…'))}</p>`) + '<div style="height:14px"></div>');
  try {
    const [s, past] = await Promise.all([fetchDaySummary(), DB.select('daily_summaries', { order: 'day.desc', limit: 3 }).catch(() => [])]);
    const yday = past.find((r) => r.day !== s.day && r.day < s.day);
    const upd = s.cached ? '' : ` · ${L('updated', 'अपडेट')} ${fmtTime(new Date().toISOString())}`;
    draw(card(title, 'pulse', s.source === 'ai' ? badge('AI', 'info') : '', `<p id="daySumText" style="margin:0;line-height:1.7;font-size:15px">${esc(s.text)}</p><small class="muted">${esc(fmtDate(s.day))}${esc(upd)}</small>${yday ? `<div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--line)"><small class="muted">${esc(L('Last closing summary', 'पिछला अंतिम सारांश'))} · ${esc(fmtDate(yday.day))}</small><p style="margin:4px 0 0;font-size:13px" class="muted">${esc(yday.text_hi)}</p></div>` : ''}`) + '<div style="height:14px"></div>');
  } catch (e) {
    draw(card(title, 'pulse', '', `<p class="muted" style="margin:0">${esc(L('The summary is not available right now.', 'सारांश अभी उपलब्ध नहीं है।'))} <a href="#dashboard" data-act="retry">${esc(L('Try again', 'फिर कोशिश करें'))}</a></p>`) + '<div style="height:14px"></div>');
  }
}
/* ================= Business pages: Expenses (owner only) and Leads (owner + trainers) ================= */
const EXP_CATS = ['Rent', 'Electricity', 'Salary', 'Equipment', 'Maintenance', 'Supplements', 'Marketing', 'Cleaning', 'Other'];
const EXP_CAT_HI = { Rent: 'किराया', Electricity: 'बिजली', Salary: 'वेतन', Equipment: 'उपकरण', Maintenance: 'मरम्मत', Supplements: 'सप्लीमेंट', Marketing: 'प्रचार', Cleaning: 'सफ़ाई', Other: 'अन्य' };
const LEAD_STAGES = ['New', 'Contacted', 'Trial', 'Converted', 'Lost'];
const LEAD_STAGE_HI = { New: 'नया', Contacted: 'संपर्क हुआ', Trial: 'ट्रायल', Converted: 'सदस्य बना', Lost: 'छूट गया' };
const LEAD_SOURCES = ['Walk-in', 'Instagram', 'Facebook', 'Referral', 'Website', 'Other'];
const LEAD_SOURCE_HI = { 'Walk-in': 'सीधे आए', Instagram: 'इंस्टाग्राम', Facebook: 'फ़ेसबुक', Referral: 'रेफ़रल', Website: 'वेबसाइट', Other: 'अन्य' };
const LEAD_TONE = { New: 'info', Contacted: 'warn', Trial: 'warn', Converted: 'ok', Lost: 'mute' };
const catLabel = (c) => (LANG === 'hi' ? EXP_CAT_HI[c] || c : c);
const stageLabel = (s) => (LANG === 'hi' ? LEAD_STAGE_HI[s] || s : s);
const sourceLabel = (s) => (LANG === 'hi' ? LEAD_SOURCE_HI[s] || s : s);

Q.expenses = () => cached('expenses', () => DB.select('expenses', { order: 'spent_on.desc,created_at.desc', limit: 5000 }));
Q.leads = () => cached('leads', () => DB.select('leads', { order: 'created_at.desc', limit: 2000 }));

U.exp = { m: 'this' };
U.lead = { f: 'all', q: '' };

const shiftMonth = (mk, n) => { const [y, m] = mk.split('-').map(Number), d = new Date(Date.UTC(y, m - 1 + n, 1)); return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`; };
/* months included by the chosen range, as a Set of YYYY-MM; null = every month */
function expRange(key) {
  const now = monthKey(todayISO());
  if (key === 'this') return new Set([now]);
  if (key === 'last') return new Set([shiftMonth(now, -1)]);
  if (key === 'q') return new Set([now, shiftMonth(now, -1), shiftMonth(now, -2)]);
  return null;
}

/* ---------- Expenses ---------- */
/* one dated list of everything in the chosen range for the accountant: fees and store sales in, expenses and salaries out */
async function exportBooks() {
  const [exps, pays, sales, sal, members, staff] = await Promise.all([Q.expenses(), Q.payments(), Q.sales(), Q.salaryPays(), Q.members(), Q.staff()]);
  const rng = expRange(U.exp.m), inR = (d) => !rng || rng.has(monthKey(d)), mm = new Map(members.map((m) => [m.id, m])), sm = new Map(staff.map((s) => [s.id, s]));
  const rows = [
    ...pays.filter((p) => inR(p.paid_on)).map((p) => [p.paid_on, 'Fee', p.no || '', memberName(mm, p.member_id), p.method, Number(p.amount), '']),
    ...sales.filter((s) => !s.voided_at && inR(s.sold_on)).map((s) => [String(s.sold_on).slice(0, 10), 'Store sale', `${s.qty} x ${s.product_name}`, s.member_id ? memberName(mm, s.member_id) : '', s.method, Number(s.total), '']),
    ...exps.filter((e) => inR(e.spent_on)).map((e) => [e.spent_on, 'Expense', e.item, e.category, '', '', Number(e.amount)]),
    ...sal.filter((p) => inR(p.paid_on)).map((p) => [p.paid_on, 'Salary', `${p.kind} ${p.month}`, (sm.get(p.staff_id) || {}).name || '', p.method, '', Number(p.amount)]),
  ].sort((a, b) => String(a[0]).localeCompare(String(b[0])));
  const inn = sum(rows, (r) => Number(r[5]) || 0), out = sum(rows, (r) => Number(r[6]) || 0);
  downloadCsv(`books-${U.exp.m}-${todayISO()}.csv`, [['Date', 'Type', 'Detail', 'Party', 'Method', 'In (INR)', 'Out (INR)'], ...rows, ['', 'TOTAL', '', '', '', inn, out], ['', 'NET', '', '', '', inn - out, '']]);
}
async function vExpenses() {
  const [exps, pays, sales, scs, sal] = await Promise.all([Q.expenses(), Q.payments(), Q.sales(), Q.saleCosts(), Q.salaryPays()]);
  const rng = expRange(U.exp.m), inR = (d) => !rng || rng.has(monthKey(d));
  const rows = exps.filter((e) => inR(e.spent_on)), got = sum(pays.filter((p) => inR(p.paid_on)), (p) => p.amount), payroll = sum(sal.filter((p) => inR(p.paid_on)), (p) => p.amount), spent = sum(rows, (e) => e.amount) + payroll, shop = saleMargin(sales.filter((s) => inR(s.sold_on)), costMap(scs, 'sale_id', 'unit_cost')), net = got + shop - spent;
  const byCat = EXP_CATS.map((c) => [c, sum(rows.filter((e) => e.category === c), (e) => e.amount) + (c === 'Salary' ? payroll : 0)]).filter((x) => x[1] > 0).sort((a, b) => b[1] - a[1]);
  const chips = chipsHtml('expM', U.exp.m, [['this', L('This month', 'यह महीना')], ['last', L('Last month', 'पिछला महीना')], ['q', L('Last 3 months', 'पिछले 3 महीने')], ['all', L('All time', 'पूरा समय')]]);
  const catHtml = byCat.length
    ? `<ul class="list">${byCat.map(([c, a]) => `<li><div class="grow"><b>${esc(catLabel(c))}</b><div class="cbar"><i style="width:${Math.max(3, Math.round((a / spent) * 100))}%"></i></div></div><div class="amt">${inr(a)}</div></li>`).join('')}</ul>`
    : empty(L('No expenses in this period', 'इस अवधि में कोई खर्च नहीं'), '');
  const tbl = rows.length
    ? `<div class="tw"><table class="t"><thead><tr><th>${esc(L('Date', 'तारीख़'))}</th><th>${esc(L('Item', 'मद'))}</th><th>${esc(L('Category', 'श्रेणी'))}</th><th class="r">${esc(L('Amount', 'रकम'))}</th><th></th></tr></thead><tbody>${rows.map((e) => `<tr><td>${esc(fmtDate(e.spent_on))}</td><td><b>${esc(e.item)}</b>${e.note ? `<small style="display:block;color:var(--muted)">${esc(e.note)}</small>` : ''}</td><td>${badge(catLabel(e.category), 'mute')}</td><td class="r">${inr(e.amount)}</td><td class="r"><button class="btn sm" data-act="delExpense" data-id="${esc(e.id)}" aria-label="${esc(L('Delete', 'हटाएँ'))}">${esc(L('Delete', 'हटाएँ'))}</button></td></tr>`).join('')}</tbody></table></div>`
    : empty(L('No expenses yet', 'अभी कोई खर्च नहीं'), L('Add rent, electricity, salaries and other costs to see your real profit.', 'किराया, बिजली, वेतन जैसे खर्च जोड़ें ताकि असली मुनाफ़ा दिखे।'), `<button class="btn pri" data-act="newExpense">${esc(L('Add expense', 'खर्च जोड़ें'))}</button>`);
  return pageHead(L('Money', 'पैसा'), L('Expenses & profit', 'खर्च और मुनाफ़ा'), L('Fees collected plus store profit, minus what you spent. Only the owner can see this page.', 'आई हुई फ़ीस और स्टोर का मुनाफ़ा, घटाकर खर्च। यह पेज सिर्फ़ मालिक देख सकता है।'), `<button class="btn" data-act="booksCsv">${ic('down')} CSV</button><button class="btn pri" data-act="newExpense">${ic('plus')}${esc(L('Add expense', 'खर्च जोड़ें'))}</button>`)
    + chips
    + `<div class="tiles">${tile(L('Fees collected', 'फ़ीस आई'), inr(got), '', 'var(--ok)')}${tile(L('Store profit', 'स्टोर का मुनाफ़ा'), inr(shop), L('sales minus cost of goods', 'बिक्री − सामान की लागत'), 'var(--ok)')}${tile(L('Expenses', 'खर्च'), inr(spent), payroll ? L(`incl. salaries ${inr(payroll)}`, `वेतन ${inr(payroll)} सहित`) : L(`${rows.length} entries`, `${rows.length} प्रविष्टियाँ`), 'var(--warn)')}${tile(net >= 0 ? L('Profit', 'मुनाफ़ा') : L('Loss', 'घाटा'), inr(Math.abs(net)), '', net >= 0 ? 'var(--ok)' : 'var(--crimson)')}</div>`
    + `<div class="two">${card(L('Where the money went', 'पैसा कहाँ गया'), 'chart', '', catHtml)}${card(L('All entries', 'सभी प्रविष्टियाँ'), 'receipt', '', tbl)}</div>`;
}
function expenseForm() {
  openForm({
    title: L('Add expense', 'खर्च जोड़ें'),
    fields: [
      { k: 'item', label: L('What was it for?', 'किस काम का खर्च?'), req: true, full: true, ph: L('Electricity bill', 'बिजली का बिल'), check: (v) => (v.trim().length > 120 ? L('Up to 120 characters', 'अधिकतम 120 अक्षर') : '') },
      { k: 'category', label: L('Category', 'श्रेणी'), type: 'select', options: EXP_CATS.map((c) => ({ v: c, l: catLabel(c) })), def: 'Other' },
      { k: 'amount', label: L('Amount (₹)', 'रकम (₹)'), type: 'number', req: true, min: 1, check: (v) => (v >= 100000000 ? L('Too large', 'बहुत बड़ी रकम') : '') },
      { k: 'spent_on', label: L('Date', 'तारीख़'), type: 'date', def: todayISO(), check: (v) => (v && v > todayISO() ? L('Cannot be in the future', 'आगे की तारीख़ नहीं') : '') },
      { k: 'note', label: L('Note', 'नोट'), type: 'textarea', full: true, check: (v) => (v.length > 300 ? L('Up to 300 characters', 'अधिकतम 300 अक्षर') : '') },
    ],
    onSubmit: async (v) => {
      const row = { gym_id: gymId(), item: v.item.trim(), category: v.category, amount: v.amount, spent_on: v.spent_on || todayISO(), note: v.note ? v.note.trim() : null };
      const ok = await act(() => DB.insert('expenses', row), L('Expense saved', 'खर्च सेव हुआ'));
      if (ok) { bust('expenses'); render(); } return !!ok;
    },
  });
}
async function deleteExpense(id) {
  const e = (await Q.expenses()).find((x) => x.id === id); if (!e) return;
  if (!(await askConfirm(L(`Delete "${e.item}" (${inr(e.amount)})?`, `"${e.item}" (${inr(e.amount)}) हटाएँ?`), L('Delete', 'हटाएँ'), 'bad'))) return;
  const ok = await act(() => DB.remove('expenses', id), L('Deleted', 'हटा दिया'));
  if (ok) { bust('expenses'); render(); }
}

/* ---------- Leads ---------- */
const nextStage = (s) => ({ New: 'Contacted', Contacted: 'Trial', Trial: null, Converted: null, Lost: null })[s] || null;
async function vLeads() {
  const leads = await Q.leads(), t = todayISO(), q = U.lead.q.trim().toLowerCase();
  const cnt = (s) => leads.filter((l) => l.stage === s).length, open = leads.filter((l) => !['Converted', 'Lost'].includes(l.stage));
  const due = open.filter((l) => l.follow_up_on && l.follow_up_on <= t);
  const rate = leads.length ? Math.round((cnt('Converted') / leads.length) * 100) : 0;
  let rows = U.lead.f === 'all' ? leads : U.lead.f === 'due' ? due : leads.filter((l) => l.stage === U.lead.f);
  if (q) rows = rows.filter((l) => `${l.name} ${l.phone || ''}`.toLowerCase().includes(q));
  const chips = chipsHtml('leadF', U.lead.f, [['all', L('All', 'सभी'), leads.length], ['due', L('Follow up today', 'आज फ़ॉलो-अप'), due.length], ...LEAD_STAGES.map((s) => [s, stageLabel(s), cnt(s)])]);
  const hello = (l) => L(`Hi ${l.name}, this is ${gymName()}. Thank you for your interest. Would you like to visit for a free trial session?`, `नमस्ते ${l.name}, ${gymName()} से बात कर रहे हैं। हमारे जिम में रुचि दिखाने के लिए धन्यवाद। क्या आप फ़्री ट्रायल के लिए आना चाहेंगे?`);
  const rowHtml = (l) => {
    const nx = nextStage(l.stage), closed = l.stage === 'Converted' || l.stage === 'Lost', over = !closed && l.follow_up_on && l.follow_up_on <= t;
    return `<tr><td><b>${esc(l.name)}</b><small style="display:block;color:var(--muted)">${esc(sourceLabel(l.source))}${l.interest ? ' · ' + esc(l.interest) : ''}</small>${l.note ? `<small style="display:block;color:var(--muted)">${esc(l.note)}</small>` : ''}</td>`
      + `<td>${l.phone ? `<a href="tel:${esc(String(l.phone).replace(/[^\d+]/g, ''))}">${esc(l.phone)}</a>` : '—'}</td>`
      + `<td>${badge(stageLabel(l.stage), LEAD_TONE[l.stage])}</td>`
      + `<td>${l.follow_up_on ? `<span style="${over ? 'color:var(--crimson);font-weight:600' : ''}">${esc(fmtDate(l.follow_up_on))}</span>` : '—'}</td>`
      + `<td class="r"><div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end">`
      + (l.phone && !closed ? `<a class="btn sm" target="_blank" rel="noopener" href="${esc(waLink(l.phone, hello(l)))}">WhatsApp</a>` : '')
      + (nx ? `<button class="btn sm" data-act="leadNext" data-id="${esc(l.id)}">${esc(L('Mark ', 'चुनें: ') + stageLabel(nx))}</button>` : '')
      + (!closed ? `<button class="btn sm pri" data-act="leadConvert" data-id="${esc(l.id)}">${esc(L('Make member', 'सदस्य बनाएँ'))}</button><button class="btn sm" data-act="leadLost" data-id="${esc(l.id)}">${esc(L('Lost', 'छूटा'))}</button>` : '')
      + `<button class="btn sm" data-act="editLead" data-id="${esc(l.id)}">${esc(L('Edit', 'बदलें'))}</button>`
      + (isAdmin() ? `<button class="btn sm" data-act="delLead" data-id="${esc(l.id)}">${esc(L('Delete', 'हटाएँ'))}</button>` : '') + `</div></td></tr>`;
  };
  const tbl = rows.length
    ? `<div class="tw"><table class="t"><thead><tr><th>${esc(L('Lead', 'संभावित सदस्य'))}</th><th>${esc(L('Phone', 'फ़ोन'))}</th><th>${esc(L('Stage', 'चरण'))}</th><th>${esc(L('Follow-up', 'फ़ॉलो-अप'))}</th><th></th></tr></thead><tbody>${rows.map(rowHtml).join('')}</tbody></table></div>`
    : empty(leads.length ? L('Nothing here', 'यहाँ कुछ नहीं') : L('No leads yet', 'अभी कोई लीड नहीं'), leads.length ? '' : L('Write down every enquiry, set a follow-up date, and turn it into a member with one tap.', 'हर पूछताछ लिखें, फ़ॉलो-अप तारीख़ रखें, और एक टैप में सदस्य बनाएँ।'), leads.length ? '' : `<button class="btn pri" data-act="newLead">${esc(L('Add lead', 'लीड जोड़ें'))}</button>`);
  return pageHead(L('Growth', 'विकास'), L('Leads', 'लीड्स'), L('People who asked about joining. Follow up, then convert them to members.', 'जिन्होंने जॉइन करने के बारे में पूछा। फ़ॉलो-अप करें, फिर सदस्य बनाएँ।'), `<button class="btn pri" data-act="newLead">${ic('plus')}${esc(L('Add lead', 'लीड जोड़ें'))}</button>`)
    + `<div class="tiles">${tile(L('Open leads', 'खुली लीड्स'), open.length, '')}${tile(L('Follow up today', 'आज फ़ॉलो-अप'), due.length, due.length ? L('Call them today', 'आज कॉल करें') : '', due.length ? 'var(--crimson)' : '')}${tile(L('Joined', 'सदस्य बने'), cnt('Converted'), L(`${rate}% of all leads`, `सभी लीड्स का ${rate}%`), 'var(--ok)')}</div>`
    + chips
    + `<div class="card" style="margin-bottom:12px"><input class="in" id="leadQ" type="search" placeholder="${esc(L('Search name or phone', 'नाम या फ़ोन खोजें'))}" value="${esc(U.lead.q)}" aria-label="${esc(L('Search leads', 'लीड खोजें'))}"></div>`
    + `<div class="card">${tbl}</div>`;
}
function leadForm(id) {
  Q.leads().then((leads) => {
    const x = id ? leads.find((l) => l.id === id) : null;
    openForm({
      title: x ? x.name : L('Add lead', 'लीड जोड़ें'), values: x || {},
      fields: [
        { k: 'name', label: L('Name', 'नाम'), req: true, full: true, check: (v) => (v.trim().length > 120 ? L('Up to 120 characters', 'अधिकतम 120 अक्षर') : '') },
        { k: 'phone', label: L('Phone', 'फ़ोन'), type: 'tel', check: (v) => (v && String(v).replace(/\D/g, '').length < 10 ? L('Enter a 10-digit number', '10 अंकों का नंबर डालें') : '') },
        { k: 'source', label: L('Where from', 'कहाँ से'), type: 'select', options: LEAD_SOURCES.map((s) => ({ v: s, l: sourceLabel(s) })), def: x ? x.source : 'Walk-in' },
        { k: 'stage', label: L('Stage', 'चरण'), type: 'select', options: LEAD_STAGES.filter((s) => s !== 'Converted' || (x && x.stage === 'Converted')).map((s) => ({ v: s, l: stageLabel(s) })), def: x ? x.stage : 'New' },
        { k: 'follow_up_on', label: L('Follow up on', 'फ़ॉलो-अप तारीख़'), type: 'date' },
        { k: 'interest', label: L('Interested in', 'किसमें रुचि'), full: true, ph: L('Weight loss, 3-month plan', 'वज़न घटाना, 3 महीने का प्लान'), check: (v) => (v.length > 200 ? L('Up to 200 characters', 'अधिकतम 200 अक्षर') : '') },
        { k: 'note', label: L('Note', 'नोट'), type: 'textarea', full: true, check: (v) => (v.length > 500 ? L('Up to 500 characters', 'अधिकतम 500 अक्षर') : '') },
      ],
      onSubmit: async (v) => {
        const row = { name: v.name.trim(), phone: v.phone ? String(v.phone).trim() : null, source: v.source, stage: v.stage, follow_up_on: v.follow_up_on || null, interest: v.interest ? v.interest.trim() : null, note: v.note ? v.note.trim() : null, updated_at: new Date().toISOString() };
        const ok = await act(() => (x ? DB.update('leads', x.id, row) : DB.insert('leads', { ...row, gym_id: gymId() })), L('Saved', 'सेव हुआ'));
        if (ok) { bust('leads'); render(); } return !!ok;
      },
    });
  });
}
async function leadSetStage(id, stage, msg) {
  const ok = await act(() => DB.update('leads', id, { stage, updated_at: new Date().toISOString() }), msg);
  if (ok) { bust('leads'); render(); }
}
async function leadConvert(id) {
  const l = (await Q.leads()).find((x) => x.id === id); if (!l) return;
  /* the lead is marked Converted only after the member really exists */
  await memberForm(null, { name: l.name, phone: l.phone || '', notes: [l.interest, l.note].filter(Boolean).join(' · ') }, async (saved) => {
    await act(() => DB.update('leads', id, { stage: 'Converted', converted_member_id: saved.id, follow_up_on: null, updated_at: new Date().toISOString() }), L('Lead marked as member', 'लीड सदस्य बन गई'));
    bust('leads');
  });
}
async function deleteLead(id) {
  const l = (await Q.leads()).find((x) => x.id === id); if (!l) return;
  if (!(await askConfirm(L(`Delete lead "${l.name}"?`, `लीड "${l.name}" हटाएँ?`), L('Delete', 'हटाएँ'), 'bad'))) return;
  const ok = await act(() => DB.remove('leads', id), L('Deleted', 'हटा दिया'));
  if (ok) { bust('leads'); render(); }
}
document.addEventListener('input', (e) => {
  if (e.target && e.target.id === 'leadQ') { U.lead.q = e.target.value; clearTimeout(window.__leadT); window.__leadT = setTimeout(async () => { const v = $('#view'); if (!v || !$('#leadQ')) return; v.innerHTML = await vLeads(); const i = $('#leadQ'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 200); }
});
/* ================= Store / POS: products, stock, sales (owner + trainers sell, owner manages) ================= */
const PROD_CATS = ['Supplements', 'Drinks', 'Snacks', 'Apparel', 'Accessories', 'Other'];
const PROD_CAT_HI = { Supplements: 'सप्लीमेंट', Drinks: 'ड्रिंक', Snacks: 'स्नैक्स', Apparel: 'कपड़े', Accessories: 'एक्सेसरी', Other: 'अन्य' };
const prodCatLabel = (c) => (LANG === 'hi' ? PROD_CAT_HI[c] || c : c);
const PAY_METHODS = ['UPI', 'Cash', 'Card', 'Bank'];

Q.products = () => cached('products', () => DB.select('products', { order: 'name.asc', limit: 1000 }));
Q.sales = () => cached('sales', () => DB.select('sales', { order: 'created_at.desc', limit: 2000 }));
/* cost prices live in owner-only tables: trainers get no rows and the app never asks them */
Q.productCosts = () => cached('product_costs', () => DB.select('product_costs', { limit: 2000 }));
Q.saleCosts = () => cached('sale_costs', () => DB.select('sale_costs', { limit: 5000 }));
const costMap = (rows, k, v) => new Map(rows.map((r) => [r[k], Number(r[v])]));

/* gross profit of the sales in a list: what was charged minus what the goods cost, voided sales left out */
const saleMargin = (list, unitCosts) => sum(list.filter((s) => !s.voided_at), (s) => Number(s.total) - s.qty * (unitCosts.get(s.id) || 0));
const saleTotal = (list) => sum(list.filter((s) => !s.voided_at), (s) => s.total);

async function vStore() {
  const admin = isAdmin();
  const [prods, sales, members, pcs, scs] = await Promise.all([Q.products(), Q.sales(), Q.members(), admin ? Q.productCosts() : [], admin ? Q.saleCosts() : []]);
  const pcost = costMap(pcs, 'product_id', 'cost'), scost = costMap(scs, 'sale_id', 'unit_cost');
  const mm = memberMap(members), t = todayISO(), mk = monthKey(t);
  const today = sales.filter((s) => s.sold_on === t), month = sales.filter((s) => monthKey(s.sold_on) === mk);
  const low = prods.filter((p) => p.active && p.stock <= p.low_at);
  const stockValue = sum(prods, (p) => p.stock * (pcost.get(p.id) || 0));
  const card1 = (p) => `<div class="card pc${p.active ? '' : ' off'}"><div style="display:flex;justify-content:space-between;gap:8px"><b>${esc(p.name)}</b>${p.stock === 0 ? badge(L('Out of stock', 'स्टॉक ख़त्म'), 'bad') : p.stock <= p.low_at ? badge(L('Low', 'कम'), 'warn') : ''}</div>`
    + `<div class="pr">${inr(p.price)}</div><div style="color:var(--muted);font-size:13px">${esc(prodCatLabel(p.category))} · ${esc(L(`${p.stock} in stock`, `${p.stock} स्टॉक में`))}${admin && pcost.get(p.id) > 0 ? ' · ' + esc(L('cost', 'लागत')) + ' ' + inr(pcost.get(p.id)) : ''}${p.active ? '' : ' · ' + esc(L('off', 'बंद'))}</div>`
    + `<div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap"><button class="btn pri sm" data-act="sellProduct" data-id="${esc(p.id)}"${p.active && p.stock > 0 ? '' : ' disabled'}>${esc(L('Sell', 'बेचें'))}</button>${admin ? `<button class="btn sm" data-act="editProduct" data-id="${esc(p.id)}">${esc(L('Edit', 'बदलें'))}</button>` : ''}</div></div>`;
  const recent = sales.slice(0, 40);
  const tbl = recent.length
    ? `<div class="tw"><table class="t"><thead><tr><th>${esc(L('Date', 'तारीख़'))}</th><th>${esc(L('Item', 'सामान'))}</th><th>${esc(L('Buyer', 'ग्राहक'))}</th><th>${esc(L('Paid by', 'तरीक़ा'))}</th><th class="r">${esc(L('Total', 'कुल'))}</th><th></th></tr></thead><tbody>${recent.map((s) => `<tr${s.voided_at ? ' style="opacity:.55;text-decoration:line-through"' : ''}><td>${esc(fmtDate(s.sold_on))}</td><td><b>${esc(s.product_name)}</b> × ${s.qty}</td><td>${s.member_id && mm.get(s.member_id) ? esc(mm.get(s.member_id).name) : '—'}</td><td>${esc(s.method)}</td><td class="r">${inr(s.total)}</td><td class="r">${admin && !s.voided_at ? `<button class="btn sm" data-act="voidSale" data-id="${esc(s.id)}">${esc(L('Cancel sale', 'बिक्री रद्द'))}</button>` : s.voided_at ? badge(L('Cancelled', 'रद्द'), 'mute') : ''}</td></tr>`).join('')}</tbody></table></div>`
    : empty(L('No sales yet', 'अभी कोई बिक्री नहीं'), L('Sell a product and it appears here. Stock goes down by itself.', 'कुछ बेचें तो यहाँ दिखेगा। स्टॉक अपने-आप घटेगा।'));
  return pageHead(L('Store', 'स्टोर'), L('Store & stock', 'स्टोर और स्टॉक'), L('Sell supplements and drinks at the counter. Stock goes down with every sale.', 'काउंटर पर सप्लीमेंट और ड्रिंक बेचें। हर बिक्री पर स्टॉक घटता है।'), admin ? `<button class="btn pri" data-act="newProduct">${ic('plus')}${esc(L('Add product', 'प्रोडक्ट जोड़ें'))}</button>` : '')
    + `<div class="tiles">${tile(L('Sold today', 'आज की बिक्री'), inr(saleTotal(today)), L(`${today.filter((s) => !s.voided_at).length} sales`, `${today.filter((s) => !s.voided_at).length} बिक्री`), 'var(--ok)')}${tile(L('This month', 'यह महीना'), inr(saleTotal(month)), admin ? L('Profit ', 'मुनाफ़ा ') + inr(saleMargin(month, scost)) : '')}${tile(L('Low stock', 'कम स्टॉक'), low.length, low.length ? esc(low.slice(0, 3).map((p) => p.name).join(', ')) : '', low.length ? 'var(--crimson)' : '')}${admin ? tile(L('Stock value', 'स्टॉक की क़ीमत'), inr(stockValue), L('at cost price', 'लागत पर')) : ''}</div>`
    + (prods.length ? `<div class="cg" style="margin-bottom:14px">${prods.map(card1).join('')}</div>` : `<div class="card" style="margin-bottom:14px">${empty(L('No products yet', 'अभी कोई प्रोडक्ट नहीं'), admin ? L('Add what you sell: protein, shakers, water, T-shirts.', 'जो बेचते हैं वह जोड़ें: प्रोटीन, शेकर, पानी, टी-शर्ट।') : L('Ask the owner to add products.', 'मालिक से प्रोडक्ट जुड़वाएँ।'), admin ? `<button class="btn pri" data-act="newProduct">${esc(L('Add product', 'प्रोडक्ट जोड़ें'))}</button>` : '')}</div>`)
    + card(L('Recent sales', 'हाल की बिक्री'), 'receipt', '', tbl);
}

function productForm(id) {
  Promise.all([Q.products(), Q.productCosts()]).then(([prods, pcs]) => {
    const x = id ? prods.find((p) => p.id === id) : null, own = costMap(pcs, 'product_id', 'cost');
    openForm({
      title: x ? x.name : L('Add product', 'प्रोडक्ट जोड़ें'), values: x ? { ...x, cost: own.get(x.id) || 0 } : {},
      fields: [
        { k: 'name', label: L('Name', 'नाम'), req: true, full: true, ph: 'Whey Protein 1kg', check: (v) => (v.trim().length > 120 ? L('Up to 120 characters', 'अधिकतम 120 अक्षर') : '') },
        { k: 'category', label: L('Category', 'श्रेणी'), type: 'select', options: PROD_CATS.map((c) => ({ v: c, l: prodCatLabel(c) })), def: x ? x.category : 'Supplements' },
        { k: 'price', label: L('Selling price (₹)', 'बिक्री भाव (₹)'), type: 'number', req: true, min: 1 },
        { k: 'cost', label: L('Your cost (₹)', 'आपकी लागत (₹)'), type: 'number', min: 0, def: x ? own.get(x.id) || 0 : 0, check: (v, o) => (v !== '' && o.price !== '' && Number(v) > Number(o.price) ? L('Cost is higher than the price (you will lose money)', 'लागत भाव से ज़्यादा है (नुक़सान होगा)') : '') },
        { k: 'stock', label: L('Stock now', 'अभी स्टॉक'), type: 'number', min: 0, def: x ? x.stock : 0, check: (v) => (v !== '' && !Number.isInteger(Number(v)) ? L('Whole number', 'पूरी संख्या') : '') },
        { k: 'low_at', label: L('Warn when stock is at or below', 'इतने या कम स्टॉक पर चेतावनी'), type: 'number', min: 0, def: x ? x.low_at : 3 },
        { k: 'active', label: L('Status', 'स्थिति'), type: 'select', options: [{ v: '1', l: L('On sale', 'बिक्री चालू') }, { v: '0', l: L('Off', 'बंद') }], def: x ? (x.active ? '1' : '0') : '1' },
      ],
      extra: x ? `<p style="margin:12px 0 0"><button type="button" class="btn sm" data-act="delProduct" data-id="${esc(x.id)}">${esc(L('Delete product', 'प्रोडक्ट हटाएँ'))}</button></p>` : '',
      onSubmit: async (v) => {
        const dup = prods.find((p) => p.name.trim().toLowerCase() === v.name.trim().toLowerCase() && (!x || p.id !== x.id));
        if (dup) { toast(L('A product with this name already exists.', 'इस नाम का प्रोडक्ट पहले से है।'), 'bad'); return false; }
        const args = { p_id: x ? x.id : null, p_name: v.name.trim(), p_category: v.category, p_price: v.price, p_cost: v.cost === '' ? 0 : v.cost, p_stock: v.stock === '' ? 0 : Math.round(Number(v.stock)), p_low_at: v.low_at === '' ? 3 : Math.round(Number(v.low_at)), p_active: v.active === '1' };
        const ok = await act(() => DB.rpc('save_product', args), L('Saved', 'सेव हुआ'));
        if (ok) { bust('products', 'product_costs'); render(); } return !!ok;
      },
    });
  });
}

async function sellForm(id) {
  const [prods, members] = await Promise.all([Q.products(), Q.members()]);
  const p = prods.find((x) => x.id === id); if (!p) return;
  const people = members.filter((m) => m.status !== 'Cancelled');
  openForm({
    title: L(`Sell: ${p.name}`, `बेचें: ${p.name}`), submitLabel: L('Record sale', 'बिक्री दर्ज करें'),
    fields: [
      { k: 'qty', label: `${L('Quantity', 'मात्रा')} (${L('max', 'अधिकतम')} ${p.stock})`, type: 'number', req: true, min: 1, def: 1, check: (v) => (!Number.isInteger(Number(v)) ? L('Whole number', 'पूरी संख्या') : Number(v) > p.stock ? L(`Only ${p.stock} in stock`, `सिर्फ़ ${p.stock} स्टॉक में हैं`) : '') },
      { k: 'method', label: L('Paid by', 'भुगतान का तरीक़ा'), type: 'select', options: PAY_METHODS.map((m) => ({ v: m, l: m })), def: 'UPI' },
      { k: 'member', label: L('Member (optional)', 'सदस्य (वैकल्पिक)'), type: 'select', full: true, options: [{ v: '', l: L('Walk-in customer', 'बाहर का ग्राहक') }, ...people.map((m) => ({ v: m.id, l: `${m.name}${m.phone ? ' · ' + m.phone : ''}` }))] },
    ],
    extra: `<p style="margin:12px 0 0;color:var(--muted)">${esc(L('Price', 'भाव'))}: <b>${inr(p.price)}</b> ${esc(L('each', 'प्रति'))}</p>`,
    onSubmit: async (v) => {
      const ok = await act(() => DB.rpc('record_sale', { p_product: p.id, p_qty: Math.round(Number(v.qty)), p_method: v.method, p_member: v.member || null }), L(`Sold ${v.qty} × ${p.name} · ${inr(p.price * v.qty)}`, `${v.qty} × ${p.name} बिका · ${inr(p.price * v.qty)}`));
      bust('products', 'sales', 'sale_costs'); if (ok) render(); return !!ok;
    },
  });
}
async function voidSale(id) {
  const s = (await Q.sales()).find((x) => x.id === id); if (!s) return;
  if (!(await askConfirm(L(`Cancel the sale of ${s.qty} × ${s.product_name} (${inr(s.total)})? The stock is added back.`, `${s.qty} × ${s.product_name} (${inr(s.total)}) की बिक्री रद्द करें? स्टॉक वापस जुड़ जाएगा।`), L('Cancel sale', 'बिक्री रद्द'), 'bad'))) return;
  const ok = await act(() => DB.rpc('void_sale', { p_sale: id }), L('Sale cancelled, stock added back', 'बिक्री रद्द, स्टॉक वापस जुड़ा'));
  bust('products', 'sales', 'sale_costs'); if (ok) render();
}
async function deleteProduct(id) {
  const p = (await Q.products()).find((x) => x.id === id); if (!p) return;
  if (!(await askConfirm(L(`Delete "${p.name}"? Past sales stay in the history.`, `"${p.name}" हटाएँ? पुरानी बिक्री इतिहास में रहेगी।`), L('Delete', 'हटाएँ'), 'bad'))) return;
  const ok = await act(() => DB.remove('products', id), L('Deleted', 'हटा दिया'));
  if (ok) { closeAllModals(); bust('products', 'sales', 'product_costs', 'sale_costs'); render(); }
}
/* ================= Portals: navigation sheet, quick search, member portal (5 pages), super admin overview ================= */
U.sg = { q: '', f: 'all' };
U.su = { q: '', f: 'all' };

/* ---------- "More" sheet for phones: every page, grouped ---------- */
function openMoreSheet() {
  const items = navFor(), cur = currentRoute(); let lastG = '', html = '';
  items.forEach((i) => {
    if (i[5] && i[5] !== lastG) { html += `${lastG ? '</div>' : ''}<div class="sheet-grp">${esc(L(...(NAV_GROUPS[i[5]] || ['', ''])))}</div><div class="sheet-links">`; lastG = i[5]; }
    html += `<a href="#${esc(i[0])}"${cur && cur[0] === i[0] ? ' aria-current="page"' : ''}>${ic(i[1])}<span>${esc(L(i[2], i[3]))}</span></a>`;
  });
  const m = openModal({ title: L('All pages', 'सभी पेज'), body: html + (lastG ? '</div>' : '') });
  $$('a', m.el).forEach((a) => a.addEventListener('click', () => m.close()));
}

/* ---------- Quick search (Ctrl/Cmd+K or "/"): jump to any page, member or gym ---------- */
async function openPalette() {
  if (!CTX.profile || CTX.profile.role === 'member' || MODALS.length) return;
  const isSuper = CTX.profile.role === 'super_admin';
  let things = navFor().map((i) => ({ t: 'page', key: i[0], label: L(i[2], i[3]), sub: L('Page', 'पेज'), hay: `${i[2]} ${i[3]}`.toLowerCase() }));
  try {
    if (isSuper) things = things.concat((await Q.overview()).map((g) => ({ t: 'gym', key: g.gym_id, label: g.name, sub: g.city || L('Gym', 'जिम'), hay: `${g.name} ${g.city || ''}`.toLowerCase() })));
    else things = things.concat((await Q.members()).map((x) => ({ t: 'member', key: x.id, label: x.name, sub: x.phone || '', hay: `${x.name} ${x.phone || ''}`.toLowerCase() })));
  } catch (e) { /* pages still work */ }
  const m = openModal({ title: L('Quick search', 'तुरंत खोज'), body: `<input class="in pal-in" id="palQ" type="search" autocomplete="off" placeholder="${esc(isSuper ? L('Page or gym name', 'पेज या जिम का नाम') : L('Page, member name or phone', 'पेज, सदस्य का नाम या फ़ोन'))}" aria-label="${esc(L('Quick search', 'तुरंत खोज'))}"><ul class="pal-list" id="palL" role="listbox"></ul>` });
  const inp = $('#palQ', m.el), list = $('#palL', m.el); let shown = [], sel = 0;
  const go = (r) => { m.close(); if (!r) return; if (r.t === 'page') location.hash = r.key; else if (r.t === 'member') memberModal(r.key); else location.hash = 'gyms'; };
  const paint = () => {
    const q = inp.value.trim().toLowerCase();
    shown = (q ? things.filter((x) => x.hay.includes(q)) : things.filter((x) => x.t === 'page')).slice(0, 12); sel = Math.min(sel, Math.max(0, shown.length - 1));
    list.innerHTML = shown.length ? shown.map((r, i) => `<li role="option" data-i="${i}" aria-selected="${i === sel}">${ic(r.t === 'page' ? 'list' : 'users')}<b>${esc(r.label)}</b><small>${esc(r.sub)}</small></li>`).join('') : `<li style="cursor:default">${esc(L('Nothing found', 'कुछ नहीं मिला'))}</li>`;
  };
  inp.addEventListener('input', () => { sel = 0; paint(); });
  inp.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(shown.length - 1, sel + 1); paint(); } else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(0, sel - 1); paint(); } else if (e.key === 'Enter') { e.preventDefault(); go(shown[sel]); }
  });
  list.addEventListener('click', (e) => { const li = e.target.closest('li[data-i]'); if (li) go(shown[Number(li.dataset.i)]); });
  paint();
}
document.addEventListener('keydown', (e) => {
  const tg = e.target, typing = tg && (tg.tagName === 'INPUT' || tg.tagName === 'TEXTAREA' || tg.tagName === 'SELECT' || tg.isContentEditable);
  if (((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') || (e.key === '/' && !typing && !e.ctrlKey && !e.metaKey)) { if (CTX.profile && CTX.profile.role !== 'member') { e.preventDefault(); openPalette(); } }
});

/* ================= Member portal ================= */
const visitDays = (visits) => new Set(visits.map((v) => istDate(v.in_at)));
function currentStreak(days, t) { let d = days.has(t) ? t : addDays(t, -1), n = 0; while (days.has(d)) { n++; d = addDays(d, -1); } return n; }
function bestStreak(days) { const a = [...days].sort(); let best = 0, run = 0, prev = ''; a.forEach((d) => { run = prev && addDays(prev, 1) === d ? run + 1 : 1; best = Math.max(best, run); prev = d; }); return best; }
const WEEK_HI = ['र', 'सो', 'मं', 'बु', 'गु', 'शु', 'श'], WEEK_EN = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
function monthCal(mk, days, t) {
  const [y, mo] = mk.split('-').map(Number), first = new Date(Date.UTC(y, mo - 1, 1)).getUTCDay(), n = new Date(Date.UTC(y, mo, 0)).getUTCDate();
  let cells = ''; for (let i = 0; i < first; i++) cells += '<i class="pad"></i>';
  for (let d = 1; d <= n; d++) { const ds = `${mk}-${pad(d)}`; cells += `<i class="${days.has(ds) ? 'on' : ''}${ds === t ? ' today' : ''}" title="${esc(fmtDate(ds))}">${d}</i>`; }
  const cnt = [...days].filter((d) => monthKey(d) === mk).length;
  return `<div style="display:flex;justify-content:space-between;margin-bottom:8px"><b>${esc(MON[mo - 1])} ${y}</b><span class="muted">${esc(L(`${cnt} days`, `${cnt} दिन`))}</span></div><div class="cal-h">${(LANG === 'hi' ? WEEK_HI : WEEK_EN).map((w) => `<span>${w}</span>`).join('')}</div><div class="cal">${cells}</div>`;
}
const noMember = () => pageHead(gymName(), L('My gym', 'मेरा जिम'), '') + `<div class="card">${empty(L('Your membership is not linked yet', 'आपकी सदस्यता अभी जुड़ी नहीं है'), L('Ask the front desk to link your account to your membership.', 'फ़्रंट डेस्क से अपना अकाउंट सदस्यता से जुड़वाएँ।'))}</div>`;
const gymPhone = () => (CTX.gym && CTX.gym.phone) || '';

async function vMine() {
  const members = await Q.members(), m = members[0]; if (!m) return noMember();
  const [invoices, payments, visits, plans] = await Promise.all([Q.invoices(), Q.payments(), Q.visits(), Q.plans()]);
  let offers = []; try { offers = (await Q.offers()).filter((o) => offerLive(o, todayISO())); } catch (e) { /* offers are optional */ }
  const paid = paidByInvoice(payments), due = sum(invoices, (i) => balanceOf(i, paid)), s = memberState(m), dl = daysLeft(m), plan = plans.find((p) => p.id === m.plan_id), upi = upiOf(), t = todayISO();
  const days = visitDays(visits), streak = currentStreak(days, t), month = [...days].filter((d) => monthKey(d) === monthKey(t)).length;
  const inNow = visits.some((v) => istDate(v.in_at) === t && !v.out_at);
  const ending = s === 'Expired' || (dl != null && dl <= 7);
  const renewMsg = L(`Hi, I am ${m.name}. I want to renew my membership at ${gymName()}.`, `नमस्ते, मैं ${m.name} हूँ। मैं ${gymName()} में अपनी सदस्यता रिन्यू करना चाहता/चाहती हूँ।`);
  return pageHead(gymName(), `${L('Hello', 'नमस्ते')}, ${m.name}`, CTX.gym && CTX.gym.timings ? L('Gym timings: ', 'जिम का समय: ') + CTX.gym.timings : '')
    + (ending ? `<div class="banner ${s === 'Expired' ? 'bad' : 'warn'}" role="status" style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><span style="flex:1;min-width:200px">${esc(s === 'Expired' ? L('Your membership has ended. Renew to keep training.', 'आपकी सदस्यता ख़त्म हो गई। ट्रेनिंग जारी रखने के लिए रिन्यू करें।') : L(`Your membership ends in ${dl} day(s).`, `आपकी सदस्यता ${dl} दिन में ख़त्म होगी।`))}</span>${gymPhone() ? `<a class="btn sm pri" target="_blank" rel="noopener" href="${esc(waLink(gymPhone(), renewMsg))}">${esc(L('Renew on WhatsApp', 'WhatsApp पर रिन्यू'))}</a>` : ''}</div>` : '')
    + `<div class="tiles">${tile(L('Membership', 'सदस्यता'), badge(s), esc(plan ? plan.name : ''))}${tile(L('Valid till', 'तारीख़ तक'), esc(fmtDate(m.end_date)), dl == null ? '' : dl >= 0 ? esc(L(`${dl} days left`, `${dl} दिन बाक़ी`)) : esc(L(`Expired ${-dl} days ago`, `${-dl} दिन पहले ख़त्म`)))}${tile(L('Visit streak', 'लगातार दिन'), esc(L(`${streak} days`, `${streak} दिन`)), inNow ? esc(L('You are checked in', 'आप अभी चेक-इन हैं')) : esc(L(`${month} visits this month`, `इस महीने ${month} विज़िट`)), streak ? 'var(--ok)' : '')}${tile(L('Balance due', 'बकाया'), esc(inr(due)), due ? esc(L('Please clear it at the desk', 'कृपया डेस्क पर चुकाएँ')) : esc(L('All clear', 'सब चुकता')), due ? 'var(--crimson)' : '')}</div>`
    + (due && upi ? `<div class="card" style="padding:14px;margin-bottom:14px"><b>${esc(L('Pay your dues', 'बकाया चुकाएँ'))}</b><p class="muted" style="margin:6px 0">${esc(L('Pay to this UPI ID, then tell the front desk. The gym records the payment on its side.', 'इस UPI आईडी पर भुगतान करें, फिर फ़्रंट डेस्क को बताएँ। भुगतान जिम अपनी तरफ़ से दर्ज करता है।'))}</p><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><code class="num">${esc(upi)}</code><button class="btn sm" data-act="copyUpi">${esc(L('Copy UPI ID', 'UPI आईडी कॉपी'))}</button></div></div>` : '')
    + (offers.length ? card(L('Offers for you', 'आपके लिए ऑफ़र'), 'crown', '', `<ul class="list">${offers.slice(0, 4).map((o) => `<li><div class="grow"><b>${esc(o.name)}</b><small>${esc(offerText(o))}${o.ends_on ? ' · ' + esc(L('till ', 'तक ')) + esc(fmtDate(o.ends_on)) : ''}</small></div></li>`).join('')}</ul>`) + '<div style="height:14px"></div>' : '')
    + memberPassCard(m)
    + reviewMemberCard()
    + achievementsCard(visits)
    + (await leaderboardCard(m)) + '<div style="height:14px"></div>'
    + card(L('My progress', 'मेरी प्रगति'), 'pulse', `<a href="#progress" style="font-size:13px">${esc(L('Open', 'खोलें'))}</a>`, `<p class="muted" style="margin:0;padding:0 18px 14px">${esc(L('Track your weight and body measurements.', 'अपना वज़न और शरीर के माप ट्रैक करें।'))}</p>`)
    + `<div class="grid2">${card(L('Last visits', 'हाल की विज़िट'), 'clock', `<a href="#visits" style="font-size:13px">${esc(L('All', 'सभी'))}</a>`, visits.length ? `<ul class="list">${visits.slice(0, 4).map((v) => `<li><div class="grow"><b>${esc(fmtDate(v.in_at))}</b><small>${esc(fmtTime(v.in_at))}${v.out_at ? ' – ' + esc(fmtTime(v.out_at)) : ''}</small></div></li>`).join('')}</ul>` : empty(L('No visits yet', 'अभी कोई विज़िट नहीं'), ''))}`
    + `${card(L('Latest invoices', 'हाल के इनवॉइस'), 'receipt', `<a href="#pay" style="font-size:13px">${esc(L('All', 'सभी'))}</a>`, invoices.length ? `<ul class="list">${invoices.slice(0, 4).map((i) => `<li><div class="grow"><b class="num">${esc(i.no || '—')}</b><small>${esc(fmtDate(i.date))}</small></div><span class="num">${esc(inr(i.total))}</span>${badge(invStatus(i, paid))}</li>`).join('')}</ul>` : empty(L('No invoices', 'कोई इनवॉइस नहीं'), ''))}</div>`;
}
async function vMyPlan() {
  const m = (await Q.members())[0]; if (!m) return noMember();
  const html = await mineFitCards(m);
  return pageHead(gymName(), L('My diet & workout plan', 'मेरा डाइट और वर्कआउट प्लान'), L('Prepared for you by your gym. Follow it and tell your trainer how it feels.', 'आपके जिम ने आपके लिए बनाया है। इसे अपनाएँ और ट्रेनर को अनुभव बताएँ।'))
    + (html || `<div class="card">${empty(L('No plan yet', 'अभी कोई प्लान नहीं'), L('Your trainer will publish your diet and workout plan here. Ask at the front desk.', 'आपका ट्रेनर डाइट और वर्कआउट प्लान यहीं पब्लिश करेगा। फ़्रंट डेस्क पर पूछें।'))}</div>`);
}
async function vMyPay() {
  const m = (await Q.members())[0]; if (!m) return noMember();
  const [invoices, payments] = await Promise.all([Q.invoices(), Q.payments()]);
  const paid = paidByInvoice(payments), due = sum(invoices, (i) => balanceOf(i, paid)), total = sum(payments, (p) => p.amount);
  return pageHead(gymName(), L('My payments', 'मेरे भुगतान'), L('Every invoice and receipt for your membership.', 'आपकी सदस्यता के सभी इनवॉइस और रसीदें।'))
    + `<div class="tiles">${tile(L('Paid so far', 'अब तक चुकाया'), esc(inr(total)), '', 'var(--ok)')}${tile(L('Balance due', 'बकाया'), esc(inr(due)), '', due ? 'var(--crimson)' : '')}${tile(L('Receipts', 'रसीदें'), payments.length, '')}</div>`
    + `<div class="grid2">${card(L('Invoices', 'इनवॉइस'), 'receipt', '', invoices.length ? `<ul class="list">${invoices.map((i) => `<li><div class="grow"><b class="num">${esc(i.no || '—')}</b><small>${esc(fmtDate(i.date))}${i.due ? ' · ' + esc(L('due ', 'देय ')) + esc(fmtDate(i.due)) : ''}</small></div><span class="num">${esc(inr(i.total))}</span>${badge(invStatus(i, paid))}</li>`).join('')}</ul>` : empty(L('No invoices', 'कोई इनवॉइस नहीं'), ''))}`
    + `${card(L('Receipts', 'रसीदें'), 'wallet', '', payments.length ? `<ul class="list">${payments.map((p) => `<li class="click" data-act="openReceipt" data-id="${esc(p.id)}"><div class="grow"><b class="num">${esc(p.no || '—')}</b><small>${esc(fmtDate(p.paid_on))} · ${esc(p.method || '')}</small></div><span class="num">${esc(inr(p.amount))}</span></li>`).join('')}</ul>` : empty(L('No payments yet', 'अभी कोई भुगतान नहीं'), ''))}</div>`;
}
async function vMyVisits() {
  const m = (await Q.members())[0]; if (!m) return noMember();
  const visits = await Q.visits(), t = todayISO(), days = visitDays(visits), mk = monthKey(t), prev = monthKey(addDays(`${mk}-01`, -1));
  const inMonth = [...days].filter((d) => monthKey(d) === mk).length;
  return pageHead(gymName(), L('My visits', 'मेरी विज़िट'), L('Your attendance for the last 90 days.', 'पिछले 90 दिनों की आपकी हाज़िरी।'))
    + `<div class="tiles">${tile(L('Current streak', 'अभी लगातार'), esc(L(`${currentStreak(days, t)} days`, `${currentStreak(days, t)} दिन`)), '', 'var(--ok)')}${tile(L('Best streak', 'सबसे लंबा'), esc(L(`${bestStreak(days)} days`, `${bestStreak(days)} दिन`)), '')}${tile(L('This month', 'यह महीना'), inMonth, L('days trained', 'दिन ट्रेनिंग'))}${tile(L('Last 90 days', 'पिछले 90 दिन'), days.size, L('days trained', 'दिन ट्रेनिंग'))}</div>`
    + `<div class="grid2"><div class="card" style="padding:16px">${monthCal(prev, days, t)}</div><div class="card" style="padding:16px">${monthCal(mk, days, t)}</div></div><div style="height:14px"></div>`
    + card(L('Every visit', 'हर विज़िट'), 'clock', '', visits.length ? `<ul class="list">${visits.slice(0, 60).map((v) => `<li><div class="grow"><b>${esc(fmtDate(v.in_at))}</b><small>${esc(fmtTime(v.in_at))}${v.out_at ? ' – ' + esc(fmtTime(v.out_at)) : ''}</small></div></li>`).join('')}</ul>` : empty(L('No visits yet', 'अभी कोई विज़िट नहीं'), L('Show up at the front desk and your first visit will appear here.', 'फ़्रंट डेस्क पर आएँ, आपकी पहली विज़िट यहाँ दिखेगी।')));
}
async function vMyProfile() {
  const m = (await Q.members())[0]; if (!m) return noMember();
  const plans = await Q.plans(), plan = plans.find((p) => p.id === m.plan_id), g = CTX.gym || {}, row = (k, v) => `<dt>${esc(k)}</dt><dd>${v}</dd>`;
  return pageHead(gymName(), L('My profile', 'मेरी प्रोफ़ाइल'), '')
    + `<div class="grid2">${card(L('My membership', 'मेरी सदस्यता'), 'users', '', `<dl class="kv" style="padding:6px 18px 16px">${row(L('Name', 'नाम'), esc(m.name))}${row(L('Phone', 'फ़ोन'), esc(m.phone || '—'))}${row(L('Plan', 'प्लान'), esc(plan ? plan.name : '—'))}${row(L('Started', 'शुरू'), esc(fmtDate(m.start_date)))}${row(L('Valid till', 'तारीख़ तक'), esc(fmtDate(m.end_date)))}${row(L('Goal', 'लक्ष्य'), esc(m.goal || '—'))}${m.trainer_id ? row(L('My trainer', 'मेरा ट्रेनर'), esc(m.trainer_name || '—')) : ''}${row(L('Status', 'स्थिति'), badge(memberState(m)))}</dl>`)}`
    + `${card(L('My gym', 'मेरा जिम'), 'building', '', `<dl class="kv" style="padding:6px 18px 16px">${row(L('Gym', 'जिम'), esc(g.name || '—'))}${row(L('City', 'शहर'), esc(g.city || '—'))}${row(L('Phone', 'फ़ोन'), g.phone ? `<a href="tel:${esc(String(g.phone).replace(/[^\d+]/g, ''))}">${esc(g.phone)}</a>` : '—')}${row(L('Timings', 'समय'), esc(g.timings || '—'))}${row('UPI', g.upi_id ? `${esc(g.upi_id)} <button class="btn sm" data-act="copyUpi">${esc(L('Copy', 'कॉपी'))}</button>` : '—')}</dl>`)}</div><div style="height:14px"></div>`
    + card(L('My account', 'मेरा अकाउंट'), 'lock', '', `<div style="padding:6px 18px 18px"><p class="muted" style="margin:0 0 12px">${esc(SESSION.email || '')}</p><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" data-act="changePw">${ic('lock')} ${esc(L('Change password', 'पासवर्ड बदलें'))}</button><button class="btn" data-act="lang">${ic('globe')} ${LANG === 'hi' ? 'English' : 'हिन्दी'}</button><button class="btn" data-act="signOut">${ic('out')} ${esc(L('Sign out', 'लॉग आउट'))}</button></div></div>`);
}

/* ================= Super admin overview ================= */
const subState = (g, t) => (g.locked ? 'locked' : !g.subscription_ends_on ? 'open' : g.subscription_ends_on < t ? 'expired' : diffDays(t, g.subscription_ends_on) <= 14 ? 'soon' : 'open');
const AUDIT_TXT = () => ({ create_gym: L('Gym created', 'जिम बना'), set_lock: L('Lock changed', 'लॉक बदला'), set_subscription: L('Subscription changed', 'सब्सक्रिप्शन बदला'), assign_user: L('User assigned', 'यूज़र तय हुआ'), update_gym: L('Gym edited', 'जिम बदला'), void_sale: L('Sale cancelled', 'बिक्री रद्द') });
async function vSuperHome() {
  const [rows, audit] = await Promise.all([Q.overview(), Q.audit().catch(() => [])]), t = todayISO();
  const st = (g) => subState(g, t), locked = rows.filter((g) => g.locked), soon = rows.filter((g) => st(g) === 'soon'), expired = rows.filter((g) => st(g) === 'expired' && !g.locked);
  const quiet = rows.filter((g) => !g.locked && (!g.last_visit || diffDays(istDate(g.last_visit), t) > 7));
  const attn = rows.filter((g) => ['locked', 'expired', 'soon'].includes(st(g))).sort((a, b) => String(a.subscription_ends_on || '').localeCompare(String(b.subscription_ends_on || '')));
  const mix = ['trial', 'starter', 'pro'].map((p) => [p, rows.filter((g) => g.plan === p).length]).filter((x) => x[1] > 0);
  const gm = new Map(rows.map((g) => [g.gym_id, g])), at = AUDIT_TXT();
  const attnTbl = attn.length ? `<div class="tw"><table class="t"><thead><tr><th>${esc(L('Gym', 'जिम'))}</th><th>${esc(L('Why', 'वजह'))}</th><th>${esc(L('Valid till', 'तारीख़ तक'))}</th><th></th></tr></thead><tbody>${attn.map((g) => `<tr><td><b>${esc(g.name)}</b><br><small class="muted">${esc(g.city || '')}</small></td><td>${badge(g.locked ? L('Locked', 'लॉक') : st(g) === 'expired' ? L('Expired', 'ख़त्म') : L('Ends soon', 'जल्दी ख़त्म'), g.locked || st(g) === 'expired' ? 'bad' : 'warn')}</td><td class="num">${esc(fmtDate(g.subscription_ends_on))}</td><td class="r" style="white-space:nowrap"><button class="btn sm" data-act="extendGym" data-id="${esc(g.gym_id)}">${esc(L('Subscription', 'सब्सक्रिप्शन'))}</button> <button class="btn sm" data-act="lockGym" data-id="${esc(g.gym_id)}">${ic('lock')} ${esc(L('Lock', 'लॉक'))}</button></td></tr>`).join('')}</tbody></table></div>` : empty(L('Nothing needs attention', 'किसी पर ध्यान की ज़रूरत नहीं'), L('No gym is locked, expired or about to end.', 'कोई जिम लॉक, ख़त्म या जल्दी ख़त्म होने वाला नहीं।'));
  return pageHead(L('Super admin', 'सुपर एडमिन'), L('Platform overview', 'प्लेटफ़ॉर्म ओवरव्यू'), L('Every gym at a glance. Member and payment details are not visible here.', 'हर जिम एक नज़र में। सदस्य और भुगतान का ब्योरा यहाँ नहीं दिखता।'), `<button class="btn primary" data-act="newGym">${ic('plus')} ${esc(L('New gym', 'नया जिम'))}</button>`)
    + `<div class="tiles">${tile(L('Gyms', 'जिम'), rows.length, L(`${rows.length - locked.length} open`, `${rows.length - locked.length} खुले`))}${tile(L('Locked', 'लॉक'), locked.length, '', locked.length ? 'var(--crimson)' : '')}${tile(L('Ending in 14 days', '14 दिन में ख़त्म'), soon.length, expired.length ? esc(L(`${expired.length} already expired`, `${expired.length} पहले ही ख़त्म`)) : '', soon.length ? 'var(--warn)' : '')}${tile(L('Members', 'सदस्य'), sum(rows, (g) => g.members), L(`${sum(rows, (g) => g.staff)} staff`, `${sum(rows, (g) => g.staff)} स्टाफ़`))}</div>`
    + card(L('Needs attention', 'ध्यान चाहिए'), 'pulse', '', attnTbl) + '<div style="height:14px"></div>'
    + `<div class="grid2">${card(L('Plan mix', 'प्लान का बँटवारा'), 'tag', '', mix.length ? `<ul class="list">${mix.map(([p, n]) => `<li><div class="grow"><b>${esc(p)}</b><div class="cbar"><i style="width:${Math.max(4, Math.round((n / rows.length) * 100))}%"></i></div></div><span class="num">${n}</span></li>`).join('')}</ul>` : empty(L('No gyms yet', 'अभी कोई जिम नहीं'), ''))}`
    + `${card(L('Quiet gyms', 'शांत जिम'), 'clock', '', quiet.length ? `<ul class="list">${quiet.map((g) => `<li><div class="grow"><b>${esc(g.name)}</b><small>${esc(g.last_visit ? L('Last check-in ', 'आख़िरी चेक-इन ') + fmtDate(g.last_visit) : L('No check-ins yet', 'अभी तक कोई चेक-इन नहीं'))}</small></div></li>`).join('')}</ul>` : empty(L('All gyms are active', 'सभी जिम सक्रिय हैं'), L('Every open gym had a check-in in the last 7 days.', 'हर खुले जिम में पिछले 7 दिन में चेक-इन हुआ।')))}</div><div style="height:14px"></div>`
    + card(L('Recent admin actions', 'हाल की एडमिन कार्रवाई'), 'list', `<a href="#audit" style="font-size:13px">${esc(L('All', 'सभी'))}</a>`, audit.length ? `<ul class="list">${audit.slice(0, 6).map((r) => `<li><div class="grow"><b>${esc(at[r.action] || r.action)}</b><small>${r.gym_id && gm.get(r.gym_id) ? esc(gm.get(r.gym_id).name) + ' · ' : ''}${esc(fmtDate(r.at))} ${esc(fmtTime(r.at))}</small></div></li>`).join('')}</ul>` : empty(L('No actions yet', 'अभी कोई कार्रवाई नहीं'), ''));
}
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
/* ================= Staff & salary (owner only): who works here, what they earn, what was paid ================= */
const STAFF_JOBS = ['Trainer', 'Manager', 'Receptionist', 'Cleaner', 'Other'];
const STAFF_JOB_HI = { Trainer: 'ट्रेनर', Manager: 'मैनेजर', Receptionist: 'रिसेप्शनिस्ट', Cleaner: 'सफ़ाई', Other: 'अन्य' };
const jobLabel = (j) => (LANG === 'hi' ? STAFF_JOB_HI[j] || j : j);
const PAY_KINDS = [['salary', 'Salary', 'वेतन'], ['advance', 'Advance', 'एडवांस'], ['bonus', 'Bonus', 'बोनस']];
const kindLabel = (k) => { const x = PAY_KINDS.find((q) => q[0] === k); return x ? L(x[1], x[2]) : k; };

Q.staff = () => cached('staff', () => DB.select('staff_members', { order: 'name.asc', limit: 500 }));
Q.salaryPays = () => cached('salary_payments', () => DB.select('salary_payments', { order: 'paid_on.desc,created_at.desc', limit: 5000 }));

Q.commission = () => cached('trainer_commission', () => DB.select('trainer_commission', { limit: 200 }));
U.pay = { m: 'this' };
const payMonthKey = () => { const now = monthKey(todayISO()); return U.pay.m === 'last' ? shiftMonth(now, -1) : U.pay.m === 'prev' ? shiftMonth(now, -2) : now; };
const monthLabel = (mk) => `${MON[Number(mk.slice(5)) - 1]} ${mk.slice(0, 4)}`;

/* one person, one month: what they should get, what was paid (salary + advance), the bonus on top, what is left */
function staffMonth(st, pays, mk) {
  const mine = pays.filter((p) => p.staff_id === st.id && p.month === mk);
  const paid = sum(mine.filter((p) => p.kind !== 'bonus'), (p) => p.amount), bonus = sum(mine.filter((p) => p.kind === 'bonus'), (p) => p.amount);
  const applies = monthKey(st.joined_on) <= mk && (st.active || mine.length > 0), salary = applies ? Number(st.monthly_salary) : 0;
  return { salary, paid, bonus, left: Math.max(0, salary - paid), applies, count: mine.length };
}

async function vStaff() {
  const [staff, pays] = await Promise.all([Q.staff(), Q.salaryPays()]), mk = payMonthKey();
  const rows = staff.map((s) => ({ s, m: staffMonth(s, pays, mk) })).filter((r) => r.m.applies || r.s.active);
  const due = sum(rows, (r) => r.m.salary), paid = sum(rows, (r) => r.m.paid + r.m.bonus), left = sum(rows, (r) => r.m.left);
  const chips = chipsHtml('payM', U.pay.m, [['this', L('This month', 'यह महीना')], ['last', L('Last month', 'पिछला महीना')], ['prev', L('Two months ago', 'दो महीने पहले')]]);
  const status = (m) => (!m.applies ? badge(L('Not started', 'शुरू नहीं'), 'mute') : m.salary === 0 ? badge('—', 'mute') : m.left === 0 ? badge(L('Paid', 'चुकाया'), 'ok') : m.paid > 0 ? badge(L('Part paid', 'आंशिक'), 'warn') : badge(L('Due', 'बाक़ी'), 'bad'));
  const tbl = rows.length
    ? `<div class="tw"><table class="t"><thead><tr><th>${esc(L('Name', 'नाम'))}</th><th class="r">${esc(L('Salary', 'वेतन'))}</th><th class="r">${esc(L('Paid', 'चुकाया'))}</th><th class="r">${esc(L('Left', 'बाक़ी'))}</th><th>${esc(L('Status', 'स्थिति'))}</th><th></th></tr></thead><tbody>${rows.map(({ s, m }) => `<tr${s.active ? '' : ' style="opacity:.6"'}><td><b>${esc(s.name)}</b><small style="display:block;color:var(--muted)">${esc(jobLabel(s.job))}${s.active ? '' : ' · ' + esc(L('inactive', 'बंद'))}${s.phone ? ' · ' + esc(s.phone) : ''}</small></td><td class="r">${inr(m.salary)}</td><td class="r">${inr(m.paid)}${m.bonus ? `<small style="display:block;color:var(--muted)">+ ${esc(L('bonus', 'बोनस'))} ${inr(m.bonus)}</small>` : ''}</td><td class="r">${inr(m.left)}</td><td>${status(m)}</td><td class="r"><div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end">${s.active ? `<button class="btn sm pri" data-act="payStaff" data-id="${esc(s.id)}">${esc(L('Pay', 'भुगतान'))}</button>` : ''}${m.count && s.phone ? `<a class="btn sm" target="_blank" rel="noopener" href="${esc(waLink(s.phone, slipText(s, m, mk)))}">${esc(L('Slip', 'पर्ची'))}</a>` : ''}<button class="btn sm" data-act="staffHist" data-id="${esc(s.id)}">${esc(L('History', 'इतिहास'))}</button><button class="btn sm" data-act="editStaff" data-id="${esc(s.id)}">${esc(L('Edit', 'बदलें'))}</button></div></td></tr>`).join('')}</tbody></table></div>`
    : empty(L('No staff yet', 'अभी कोई स्टाफ़ नहीं'), L('Add trainers and other staff with their monthly salary. Payments you record here are counted in your profit automatically.', 'ट्रेनर और बाक़ी स्टाफ़ को मासिक वेतन के साथ जोड़ें। यहाँ दर्ज भुगतान मुनाफ़े में अपने-आप गिने जाते हैं।'), `<button class="btn pri" data-act="newStaff">${esc(L('Add staff', 'स्टाफ़ जोड़ें'))}</button>`);
  return pageHead(L('Money', 'पैसा'), L('Staff & salary', 'स्टाफ़ और वेतन'), L('Monthly salary, advances and bonuses. Only the owner can see this page.', 'मासिक वेतन, एडवांस और बोनस। यह पेज सिर्फ़ मालिक देख सकता है।'), `<button class="btn pri" data-act="newStaff">${ic('plus')}${esc(L('Add staff', 'स्टाफ़ जोड़ें'))}</button>`)
    + chips + `<p class="muted" style="margin:0 0 10px">${esc(monthLabel(mk))}</p>`
    + `<div class="tiles">${tile(L('Payroll', 'कुल वेतन'), inr(due), L(`${rows.filter((r) => r.m.salary > 0).length} people`, `${rows.filter((r) => r.m.salary > 0).length} लोग`))}${tile(L('Paid', 'चुकाया'), inr(paid), '', 'var(--ok)')}${tile(L('Left to pay', 'देना बाक़ी'), inr(left), '', left ? 'var(--crimson)' : '')}</div>`
    + `<div class="card">${tbl}</div>` + (await commissionCard(mk));
}
function slipText(s, m, mk) {
  return L(`Salary slip - ${gymName()}\n${s.name}\nMonth: ${monthLabel(mk)}\nSalary: ${inr(m.salary)}\nPaid: ${inr(m.paid)}${m.bonus ? `\nBonus: ${inr(m.bonus)}` : ''}\nBalance: ${inr(m.left)}\nThank you.`, `वेतन पर्ची - ${gymName()}\n${s.name}\nमहीना: ${monthLabel(mk)}\nवेतन: ${inr(m.salary)}\nचुकाया: ${inr(m.paid)}${m.bonus ? `\nबोनस: ${inr(m.bonus)}` : ''}\nबाक़ी: ${inr(m.left)}\nधन्यवाद।`);
}

function staffForm(id) {
  Q.staff().then((staff) => {
    const x = id ? staff.find((s) => s.id === id) : null;
    openForm({
      title: x ? x.name : L('Add staff', 'स्टाफ़ जोड़ें'), values: x ? { ...x, active: x.active ? '1' : '0' } : {},
      fields: [
        { k: 'name', label: L('Name', 'नाम'), req: true, full: true, check: (v) => (v.trim().length > 120 ? L('Up to 120 characters', 'अधिकतम 120 अक्षर') : '') },
        { k: 'job', label: L('Job', 'काम'), type: 'select', options: STAFF_JOBS.map((j) => ({ v: j, l: jobLabel(j) })), def: x ? x.job : 'Trainer' },
        { k: 'phone', label: L('Phone', 'फ़ोन'), type: 'tel', check: (v) => (v && String(v).replace(/\D/g, '').length < 10 ? L('Enter a 10-digit number', '10 अंकों का नंबर डालें') : '') },
        { k: 'monthly_salary', label: L('Monthly salary (₹)', 'मासिक वेतन (₹)'), type: 'number', req: true, min: 0, check: (v) => (v >= 10000000 ? L('Too large', 'बहुत बड़ी रकम') : '') },
        { k: 'joined_on', label: L('Joined on', 'जॉइन की तारीख़'), type: 'date', def: x ? x.joined_on : todayISO() },
        { k: 'active', label: L('Status', 'स्थिति'), type: 'select', options: [{ v: '1', l: L('Working', 'काम कर रहे हैं') }, { v: '0', l: L('Left', 'छोड़ चुके') }], def: x ? (x.active ? '1' : '0') : '1' },
        { k: 'note', label: L('Note', 'नोट'), type: 'textarea', full: true, check: (v) => (v.length > 300 ? L('Up to 300 characters', 'अधिकतम 300 अक्षर') : '') },
      ],
      extra: x ? `<p style="margin:12px 0 0"><button type="button" class="btn sm" data-act="delStaff" data-id="${esc(x.id)}">${esc(L('Delete person', 'व्यक्ति हटाएँ'))}</button></p>` : '',
      onSubmit: async (v) => {
        const row = { name: v.name.trim(), job: v.job, phone: v.phone ? String(v.phone).trim() : null, monthly_salary: v.monthly_salary, joined_on: v.joined_on || todayISO(), active: v.active === '1', note: v.note ? v.note.trim() : null };
        const ok = await act(() => (x ? DB.update('staff_members', x.id, row) : DB.insert('staff_members', { ...row, gym_id: gymId() })), L('Saved', 'सेव हुआ'));
        if (ok) { bust('staff'); render(); } return !!ok;
      },
    });
  });
}
async function deleteStaff(id) {
  const [staff, pays] = await Promise.all([Q.staff(), Q.salaryPays()]), s = staff.find((x) => x.id === id); if (!s) return;
  if (pays.some((p) => p.staff_id === id)) { toast(L('This person has payment history, so it cannot be deleted. Set the status to "Left" instead.', 'इस व्यक्ति का भुगतान इतिहास है, इसलिए हटा नहीं सकते। स्थिति "छोड़ चुके" कर दें।'), 'bad'); return; }
  if (!(await askConfirm(L(`Delete ${s.name}?`, `${s.name} को हटाएँ?`), L('Delete', 'हटाएँ'), 'bad'))) return;
  const ok = await act(() => DB.remove('staff_members', id), L('Deleted', 'हटा दिया'));
  if (ok) { closeAllModals(); bust('staff'); render(); }
}

function salaryForm(id) {
  Promise.all([Q.staff(), Q.salaryPays()]).then(([staff, pays]) => {
    const s = staff.find((x) => x.id === id); if (!s) return;
    const mk = payMonthKey(), m = staffMonth(s, pays, mk);
    openForm({
      title: L(`Pay ${s.name} · ${monthLabel(mk)}`, `${s.name} को भुगतान · ${monthLabel(mk)}`), submitLabel: L('Record payment', 'भुगतान दर्ज करें'),
      fields: [
        { k: 'kind', label: L('Type', 'प्रकार'), type: 'select', options: PAY_KINDS.map((k) => ({ v: k[0], l: L(k[1], k[2]) })), def: 'salary' },
        { k: 'amount', label: L('Amount (₹)', 'रकम (₹)'), type: 'number', req: true, min: 1, def: m.left || '', check: (v, o) => (v >= 10000000 ? L('Too large', 'बहुत बड़ी रकम') : o.kind !== 'bonus' && Number(v) > m.left ? L(`Only ${inr(m.left)} is left for this month. Choose Bonus for extra money.`, `इस महीने सिर्फ़ ${inr(m.left)} बाक़ी है। ज़्यादा देना हो तो "बोनस" चुनें।`) : '') },
        { k: 'method', label: L('Paid by', 'तरीक़ा'), type: 'select', options: PAY_METHODS.map((q) => ({ v: q, l: q })), def: 'Cash' },
        { k: 'paid_on', label: L('Date', 'तारीख़'), type: 'date', def: todayISO(), check: (v) => (v && v > todayISO() ? L('Cannot be in the future', 'आगे की तारीख़ नहीं') : '') },
        { k: 'note', label: L('Note', 'नोट'), full: true, check: (v) => (v.length > 300 ? L('Up to 300 characters', 'अधिकतम 300 अक्षर') : '') },
      ],
      extra: `<p style="margin:12px 0 0;color:var(--muted)">${esc(L('Salary', 'वेतन'))}: <b>${inr(m.salary)}</b> · ${esc(L('paid', 'चुकाया'))}: <b>${inr(m.paid)}</b> · ${esc(L('left', 'बाक़ी'))}: <b>${inr(m.left)}</b></p>`,
      onSubmit: async (v) => {
        const row = { gym_id: gymId(), staff_id: s.id, month: mk, kind: v.kind, amount: v.amount, method: v.method, paid_on: v.paid_on || todayISO(), note: v.note ? v.note.trim() : null };
        const ok = await act(() => DB.insert('salary_payments', row), L(`${inr(v.amount)} paid to ${s.name}`, `${s.name} को ${inr(v.amount)} दिए`));
        if (ok) { bust('salary_payments'); render(); } return !!ok;
      },
    });
  });
}
async function staffHistory(id) {
  const [staff, pays] = await Promise.all([Q.staff(), Q.salaryPays()]), s = staff.find((x) => x.id === id); if (!s) return;
  const mine = pays.filter((p) => p.staff_id === id);
  openModal({ title: L(`${s.name}: payments`, `${s.name}: भुगतान`), body: mine.length ? `<ul class="list">${mine.map((p) => `<li><div class="grow"><b>${esc(kindLabel(p.kind))} · ${esc(monthLabel(p.month))}</b><small>${esc(fmtDate(p.paid_on))} · ${esc(p.method)}${p.note ? ' · ' + esc(p.note) : ''}</small></div><span class="num">${esc(inr(p.amount))}</span><button class="btn sm" data-act="delSalPay" data-id="${esc(p.id)}" aria-label="${esc(L('Delete', 'हटाएँ'))}">${esc(L('Delete', 'हटाएँ'))}</button></li>`).join('')}</ul>` : empty(L('No payments yet', 'अभी कोई भुगतान नहीं'), '') });
}
async function deleteSalaryPay(id) {
  const p = (await Q.salaryPays()).find((x) => x.id === id); if (!p) return;
  if (!(await askConfirm(L(`Delete this ${kindLabel(p.kind)} payment of ${inr(p.amount)}? It is recorded in the audit log.`, `${inr(p.amount)} का ${kindLabel(p.kind)} भुगतान हटाएँ? यह ऑडिट लॉग में दर्ज रहेगा।`), L('Delete', 'हटाएँ'), 'bad'))) return;
  const ok = await act(() => DB.remove('salary_payments', id), L('Deleted', 'हटा दिया'));
  if (ok) { closeAllModals(); bust('salary_payments'); render(); }
}

/* ---------- Trainer commission: a share of the fees collected from each trainer's own members ---------- */
async function commissionCard(mk) {
  let trainers = [], rates = [], members = [], pays = [];
  try { [trainers, rates, members, pays] = await Promise.all([Q.profiles(), Q.commission(), Q.members(), Q.payments()]); } catch (e) { return ''; }
  trainers = trainers.filter((p) => p.gym_id === gymId() && (p.role === 'trainer' || p.role === 'gym_admin') && members.some((m) => m.trainer_id === p.id || p.role === 'trainer'));
  if (!trainers.length) return '';
  const rows = trainers.map((p) => {
    const mine = members.filter((m) => m.trainer_id === p.id), ids = new Set(mine.map((m) => m.id)), r = rates.find((x) => x.trainer_id === p.id), pct = r ? Number(r.pct) : 0;
    const got = sum(pays.filter((x) => ids.has(x.member_id) && monthKey(x.paid_on) === mk), (x) => x.amount);
    return { p, n: mine.length, got, pct, due: Math.round((got * pct) / 100), set: !!r };
  });
  const total = sum(rows, (r) => r.due);
  const body = `<div class="tw"><table class="t"><thead><tr><th>${esc(L('Trainer', 'ट्रेनर'))}</th><th class="r">${esc(L('Members', 'सदस्य'))}</th><th class="r">${esc(L('Fees collected', 'वसूली'))}</th><th class="r">${esc(L('Rate', 'दर'))}</th><th class="r">${esc(L('Commission', 'कमीशन'))}</th><th></th></tr></thead><tbody>${rows.map((r) => `<tr><td><b>${esc(r.p.full_name || r.p.email || 'Trainer')}</b></td><td class="r">${r.n}</td><td class="r">${inr(r.got)}</td><td class="r">${r.set ? esc(num1(r.pct)) + '%' : '—'}</td><td class="r"><b>${inr(r.due)}</b></td><td class="r"><button class="btn sm" data-act="setCommission" data-id="${esc(r.p.id)}">${esc(L('Set rate', 'दर तय करें'))}</button></td></tr>`).join('')}</tbody></table></div><p class="muted" style="margin:10px 18px 14px;font-size:12px">${esc(L('Based on fees collected in the month from members currently assigned to the trainer. To pay it out, record it as a Bonus against the person above.', 'महीने में उन सदस्यों से आई फ़ीस पर, जो अभी उस ट्रेनर को सौंपे हैं। चुकाने के लिए ऊपर उस व्यक्ति के नाम "बोनस" दर्ज करें।'))}</p>`;
  return `<div style="height:14px"></div>` + card(L(`Trainer commission · ${monthLabel(mk)}`, `ट्रेनर कमीशन · ${monthLabel(mk)}`), 'crown', `<span class="muted" style="font-size:13px">${esc(L('Total', 'कुल'))} ${esc(inr(total))}</span>`, body);
}
function commissionForm(trainerId) {
  Promise.all([Q.profiles(), Q.commission()]).then(([profiles, rates]) => {
    const p = profiles.find((x) => x.id === trainerId); if (!p) return;
    const r = rates.find((x) => x.trainer_id === trainerId);
    openForm({
      title: L(`Commission: ${p.full_name || p.email || 'Trainer'}`, `कमीशन: ${p.full_name || p.email || 'ट्रेनर'}`), values: r ? { pct: r.pct } : {},
      fields: [{ k: 'pct', label: L('Share of fees from their members (%)', 'उनके सदस्यों की फ़ीस का हिस्सा (%)'), type: 'number', req: true, min: 0, full: true, check: (v) => (v > 100 ? L('Up to 100', 'अधिकतम 100') : '') }],
      onSubmit: async (v) => {
        const ok = await act(() => (r ? DB.update('trainer_commission', r.id, { pct: v.pct, updated_at: new Date().toISOString() }) : DB.insert('trainer_commission', { gym_id: gymId(), trainer_id: trainerId, pct: v.pct })), L('Saved', 'सेव हुआ'));
        if (ok) { bust('trainer_commission'); render(); } return !!ok;
      },
    });
  });
}
/* ================= Member progress: weight, body fat and body measurements over time ================= */
const PROG_FIELDS = [
  ['weight_kg', 'Weight (kg)', 'वज़न (किग्रा)', 'kg'], ['body_fat_pct', 'Body fat (%)', 'बॉडी फ़ैट (%)', '%'],
  ['waist_cm', 'Waist (cm)', 'कमर (सेमी)', 'cm'], ['chest_cm', 'Chest (cm)', 'छाती (सेमी)', 'cm'],
  ['hips_cm', 'Hips (cm)', 'कूल्हे (सेमी)', 'cm'], ['arm_cm', 'Arm (cm)', 'बाँह (सेमी)', 'cm'], ['thigh_cm', 'Thigh (cm)', 'जाँघ (सेमी)', 'cm'],
];
const progOf = (memberId) => DB.select('member_progress', { eq: { member_id: memberId }, order: 'measured_on.desc,created_at.desc', limit: 300 });
const num1 = (v) => (Math.round(Number(v) * 10) / 10).toString();

/* first and latest value of one measure, oldest-first list given */
function progDelta(asc, key) {
  const xs = asc.filter((r) => r[key] != null);
  if (!xs.length) return null;
  const first = Number(xs[0][key]), last = Number(xs[xs.length - 1][key]);
  return { first, last, diff: Math.round((last - first) * 10) / 10, n: xs.length };
}
const signed = (d) => (d > 0 ? '+' : d < 0 ? '−' : '') + num1(Math.abs(d));

/* small line chart of one measure; plain SVG so it works offline and in both themes */
function progChart(asc, key) {
  const pts = asc.filter((r) => r[key] != null).map((r) => ({ d: r.measured_on, v: Number(r[key]) }));
  if (pts.length < 2) return '';
  const W = 320, H = 110, P = 14, vs = pts.map((p) => p.v), lo = Math.min(...vs), hi = Math.max(...vs), span = hi - lo || 1;
  const t0 = new Date(pts[0].d).getTime(), t1 = new Date(pts[pts.length - 1].d).getTime(), ts = t1 - t0 || 1;
  const xy = pts.map((p) => [P + ((new Date(p.d).getTime() - t0) / ts) * (W - 2 * P), H - P - ((p.v - lo) / span) * (H - 2 * P)]);
  const line = xy.map((q) => q.map((n) => n.toFixed(1)).join(',')).join(' ');
  const label = L(`Trend from ${num1(pts[0].v)} to ${num1(pts[pts.length - 1].v)}`, `${num1(pts[0].v)} से ${num1(pts[pts.length - 1].v)} तक का रुझान`);
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}" style="width:100%;height:auto;display:block"><polyline points="${line}" fill="none" stroke="var(--crimson)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>${xy.map((q) => `<circle cx="${q[0].toFixed(1)}" cy="${q[1].toFixed(1)}" r="3.5" fill="var(--crimson)"/>`).join('')}<text x="${P}" y="11" font-size="10" fill="var(--muted)">${esc(num1(hi))}</text><text x="${P}" y="${H - 2}" font-size="10" fill="var(--muted)">${esc(num1(lo))}</text></svg>`;
}

/* the same view serves the member portal and the staff modal; staff may delete entries */
function progBody(rows, staff, memberId) {
  if (!rows.length) return empty(L('No measurements yet', 'अभी कोई माप नहीं'), L('Add your weight and measurements every couple of weeks to see your progress.', 'हर दो हफ़्ते में अपना वज़न और माप जोड़ें, फिर प्रगति यहाँ दिखेगी।'), `<button class="btn pri" data-act="addProgress" data-id="${esc(memberId)}"${staff ? '' : ' data-by="1"'}>${esc(L('Add measurements', 'माप जोड़ें'))}</button>`);
  const asc = [...rows].reverse(), w = progDelta(asc, 'weight_kg'), wa = progDelta(asc, 'waist_cm'), bf = progDelta(asc, 'body_fat_pct');
  const tl = (lab, d, unit, good) => (d ? tile(lab, esc(num1(d.last) + ' ' + unit), d.n > 1 ? `<span style="color:${d.diff === 0 ? 'var(--muted)' : good(d.diff) ? 'var(--ok)' : 'var(--crimson)'}">${esc(signed(d.diff) + ' ' + unit)} ${esc(L('since first entry', 'पहली एंट्री से'))}</span>` : esc(L('first entry', 'पहली एंट्री'))) : '');
  const down = (d) => d <= 0;
  const chart = progChart(asc, 'weight_kg');
  const cols = PROG_FIELDS.filter((f) => rows.some((r) => r[f[0]] != null));
  return `<div class="tiles" style="margin-bottom:12px">${tl(L('Weight', 'वज़न'), w, 'kg', down)}${tl(L('Waist', 'कमर'), wa, 'cm', down)}${tl(L('Body fat', 'बॉडी फ़ैट'), bf, '%', down)}</div>`
    + (chart ? `<div class="card" style="padding:12px;margin-bottom:12px"><div class="muted" style="font-size:12px;margin-bottom:4px">${esc(L('Weight over time', 'समय के साथ वज़न'))}</div>${chart}</div>` : '')
    + `<div class="tw"><table class="t"><thead><tr><th>${esc(L('Date', 'तारीख़'))}</th>${cols.map((f) => `<th class="r">${esc(L(f[1], f[2]))}</th>`).join('')}${staff ? '<th></th>' : ''}</tr></thead><tbody>${rows.map((r) => `<tr><td>${esc(fmtDate(r.measured_on))}${r.note ? `<small style="display:block;color:var(--muted)">${esc(r.note)}</small>` : ''}</td>${cols.map((f) => `<td class="r">${r[f[0]] != null ? esc(num1(r[f[0]])) : '—'}</td>`).join('')}${staff ? `<td class="r"><button class="btn sm" data-act="delProgress" data-id="${esc(r.id)}" data-m="${esc(memberId)}">${esc(L('Delete', 'हटाएँ'))}</button></td>` : ''}</tr>`).join('')}</tbody></table></div>`;
}

function progressForm(memberId, byMember, after) {
  openForm({
    title: L('Add measurements', 'माप जोड़ें'), submitLabel: L('Save', 'सेव करें'),
    fields: [
      { k: 'measured_on', label: L('Date', 'तारीख़'), type: 'date', def: todayISO(), full: true, check: (v) => (v && v > todayISO() ? L('Cannot be in the future', 'आगे की तारीख़ नहीं') : '') },
      ...PROG_FIELDS.map((f) => ({ k: f[0], label: L(f[1], f[2]), type: 'number', min: 0, check: (v) => (v === '' ? '' : f[0] === 'weight_kg' ? (v < 20 || v > 400 ? L('Between 20 and 400', '20 से 400 के बीच') : '') : f[0] === 'body_fat_pct' ? (v < 2 || v > 70 ? L('Between 2 and 70', '2 से 70 के बीच') : '') : (v < 10 || v > 250 ? L('Between 10 and 250', '10 से 250 के बीच') : '')) })),
      { k: 'note', label: L('Note', 'नोट'), full: true, check: (v) => (v.length > 300 ? L('Up to 300 characters', 'अधिकतम 300 अक्षर') : '') },
    ],
    extra: `<p class="muted" style="margin:10px 0 0">${esc(L('Fill only what you measured.', 'सिर्फ़ वही भरें जो नापा हो।'))}</p>`,
    onSubmit: async (v) => {
      if (!PROG_FIELDS.some((f) => v[f[0]] !== '' && v[f[0]] != null)) { toast(L('Enter at least one measurement', 'कम से कम एक माप भरें'), 'bad'); return false; }
      const row = { gym_id: gymId(), member_id: memberId, measured_on: v.measured_on || todayISO(), by_member: !!byMember, note: v.note ? v.note.trim() : null };
      PROG_FIELDS.forEach((f) => { row[f[0]] = v[f[0]] === '' || v[f[0]] == null ? null : v[f[0]]; });
      const ok = await act(() => DB.insert('member_progress', row), L('Measurements saved', 'माप सेव हुए'));
      if (ok) { if (after) await after(); else render(); } return !!ok;
    },
  });
}

/* staff: a member's progress in a modal */
async function progressModal(memberId) {
  const members = await Q.members(), m = members.find((x) => x.id === memberId); if (!m) return;
  const rows = await progOf(memberId);
  closeAllModals();
  openModal({ title: L(`${m.name}: progress`, `${m.name}: प्रगति`), wide: true, body: progBody(rows, true, memberId) + (rows.length ? `<p style="margin:12px 0 0"><button class="btn pri" data-act="addProgress" data-id="${esc(memberId)}">${ic('plus')} ${esc(L('Add measurements', 'माप जोड़ें'))}</button></p>` : '') });
}
async function deleteProgress(id, memberId) {
  if (!(await askConfirm(L('Delete this entry?', 'यह एंट्री हटाएँ?'), L('Delete', 'हटाएँ'), 'bad'))) return;
  const ok = await act(() => DB.remove('member_progress', id), L('Deleted', 'हटा दिया'));
  if (ok) progressModal(memberId);
}

/* member portal page */
async function vMyProgress() {
  const m = (await Q.members())[0]; if (!m) return noMember();
  const rows = await progOf(m.id);
  return pageHead(gymName(), L('My progress', 'मेरी प्रगति'), L('Your weight and body measurements over time.', 'समय के साथ आपका वज़न और शरीर के माप।'), rows.length ? `<button class="btn pri" data-act="addProgress" data-id="${esc(m.id)}" data-by="1">${ic('plus')}${esc(L('Add', 'जोड़ें'))}</button>` : '')
    + `<div class="card" style="padding:16px">${progBody(rows, false, m.id)}</div>`;
}
/* ================= Classes: the gym schedules classes, members book a spot (capacity enforced in the database) ================= */
Q.classes = () => cached('gym_classes', () => DB.select('gym_classes', { filters: { starts_at: 'gte.' + sinceISO(1) }, order: 'starts_at.asc', limit: 500 }));
Q.classCounts = () => cached('class_counts', async () => { const rows = (await DB.rpc('class_booked_counts', { g: gymId() })) || []; return new Map(rows.map((r) => [r.class_id, r.booked])); });
Q.myBookings = () => cached('class_bookings', () => DB.select('class_bookings', { filters: { cancelled_at: 'is.null' }, limit: 500 }));
U.cls = { f: 'up' };
const bustClasses = () => bust('gym_classes', 'class_counts', 'class_bookings');

/* the database refuses with a plain sentence; show it in the person's language */
function classMsg(e) {
  const m = String((e && e.message) || '');
  const T = [['class full', 'This class is full.', 'यह क्लास भर चुकी है।'], ['already booked', 'You already have a spot in this class.', 'इस क्लास में आपकी जगह पहले से है।'], ['membership expired', 'Your membership has ended. Please renew to book.', 'आपकी सदस्यता ख़त्म हो चुकी है। बुक करने के लिए रिन्यू करें।'], ['already started', 'This class has already started.', 'यह क्लास शुरू हो चुकी है।'], ['class cancelled', 'This class was cancelled.', 'यह क्लास रद्द हो गई है।'], ['too late to cancel', 'Too late to cancel online (less than 2 hours left). Please ask the gym.', 'रद्द करने में देर हो चुकी (2 घंटे से कम बचे)। जिम से कहें।'], ['gym locked', 'The gym subscription has ended.', 'जिम का सब्सक्रिप्शन ख़त्म हो गया है।']];
  const t = T.find((x) => m.includes(x[0]));
  return t ? L(t[1], t[2]) : friendlyError(e);
}
async function actClass(fn, okMsg) {
  try { const r = await fn(); if (okMsg) toast(okMsg); bustClasses(); return r === undefined || r === null ? true : r; } catch (e) { if (e && e.status === 401) return null; toast(classMsg(e), 'bad'); return null; }
}
const clsDay = (iso) => { const d = istDate(iso), t = todayISO(); return d === t ? L('Today', 'आज') : d === addDays(t, 1) ? L('Tomorrow', 'कल') : fmtDate(d); };
const clsRange = (c) => `${fmtTime(c.starts_at)} – ${fmtTime(new Date(new Date(c.starts_at).getTime() + c.duration_min * 60000).toISOString())}`;
const toIST = (date, time) => `${date}T${time}:00+05:30`;

/* ---------- staff: schedule ---------- */
async function vClasses() {
  const [classes, counts] = await Promise.all([Q.classes(), Q.classCounts()]), now = Date.now();
  const list = classes.filter((c) => (U.cls.f === 'up' ? new Date(c.starts_at).getTime() >= now : new Date(c.starts_at).getTime() < now));
  const days = [...new Set(list.map((c) => istDate(c.starts_at)))];
  const row = (c) => {
    const n = counts.get(c.id) || 0, full = n >= c.capacity, off = !!c.cancelled_at, past = new Date(c.starts_at).getTime() < now;
    return `<li${off ? ' style="opacity:.55"' : ''}><div class="grow"><b>${esc(clsRange(c))} · ${esc(c.title)}</b><small>${esc(c.coach || '')}${c.coach && c.note ? ' · ' : ''}${esc(c.note || '')}</small></div>${off ? badge(L('Cancelled', 'रद्द'), 'bad') : full ? badge(L('Full', 'भरी'), 'warn') : ''}<span class="num" title="${esc(L('Booked / capacity', 'बुक / क्षमता'))}">${n} / ${c.capacity}</span><div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn sm" data-act="clsBookings" data-id="${esc(c.id)}">${esc(L('Bookings', 'बुकिंग'))}</button>${off || past ? '' : `<button class="btn sm" data-act="editClass" data-id="${esc(c.id)}">${esc(L('Edit', 'बदलें'))}</button><button class="btn sm" data-act="cancelClass" data-id="${esc(c.id)}">${esc(L('Cancel class', 'क्लास रद्द'))}</button>`}</div></li>`;
  };
  const body = days.length ? days.map((d) => `<h3 style="font-size:13px;margin:14px 0 4px">${esc(clsDay(`${d}T12:00:00+05:30`))}</h3><ul class="list">${list.filter((c) => istDate(c.starts_at) === d).map(row).join('')}</ul>`).join('') : empty(U.cls.f === 'up' ? L('No upcoming classes', 'कोई आने वाली क्लास नहीं') : L('Nothing in the last day', 'पिछले दिन कुछ नहीं'), L('Add yoga, Zumba, HIIT or any batch. Members book a spot from their app.', 'योगा, ज़ुम्बा, HIIT या कोई भी बैच जोड़ें। सदस्य अपने ऐप से जगह बुक करेंगे।'), `<button class="btn pri" data-act="newClass">${esc(L('Add class', 'क्लास जोड़ें'))}</button>`);
  return pageHead(L('Business', 'व्यापार'), L('Classes', 'क्लास'), L('Schedule classes and see who booked. Members cannot book more than the capacity.', 'क्लास का समय तय करें और देखें किसने बुक किया। क्षमता से ज़्यादा बुकिंग नहीं होती।'), `<button class="btn pri" data-act="newClass">${ic('plus')}${esc(L('Add class', 'क्लास जोड़ें'))}</button>`)
    + chipsHtml('clsF', U.cls.f, [['up', L('Upcoming', 'आने वाली')], ['recent', L('Earlier (last day)', 'बीती (पिछला दिन)')]])
    + `<div class="card" style="padding:4px 18px 16px">${body}</div>`;
}

function classForm(id) {
  Q.classes().then((classes) => {
    const x = id ? classes.find((c) => c.id === id) : null, d0 = x ? istDate(x.starts_at) : todayISO(), p = x ? istParts(x.starts_at) : { hour: 7, min: 0 };
    openForm({
      title: x ? L('Edit class', 'क्लास बदलें') : L('Add class', 'क्लास जोड़ें'), submitLabel: L('Save', 'सेव करें'),
      values: x ? { ...x, date: d0, time: `${pad(p.hour)}:${pad(p.min)}` } : {},
      fields: [
        { k: 'title', label: L('Class name', 'क्लास का नाम'), req: true, full: true, ph: L('Morning Yoga', 'सुबह का योगा'), check: (v) => (v.trim().length > 80 ? L('Up to 80 characters', 'अधिकतम 80 अक्षर') : '') },
        { k: 'coach', label: L('Coach', 'कोच'), check: (v) => (v.length > 80 ? L('Up to 80 characters', 'अधिकतम 80 अक्षर') : '') },
        { k: 'capacity', label: L('Spots', 'जगह'), type: 'number', req: true, min: 1, def: 15, step: 1, check: (v) => (v > 500 ? L('At most 500', 'अधिकतम 500') : '') },
        { k: 'date', label: L('Date', 'तारीख़'), type: 'date', req: true, def: d0 },
        { k: 'time', label: L('Start time', 'शुरू का समय'), type: 'time', req: true, def: `${pad(p.hour)}:${pad(p.min)}` },
        { k: 'duration_min', label: L('Minutes', 'मिनट'), type: 'number', req: true, min: 10, def: 60, step: 5, check: (v) => (v > 240 ? L('At most 240', 'अधिकतम 240') : '') },
        ...(x ? [] : [{ k: 'weeks', label: L('Repeat weekly for', 'हर हफ़्ते दोहराएँ'), type: 'select', options: [1, 2, 4, 8, 12].map((n) => ({ v: String(n), l: n === 1 ? L('Just once', 'सिर्फ़ एक बार') : L(`${n} weeks`, `${n} हफ़्ते`) })), def: '1' }]),
        { k: 'note', label: L('Note', 'नोट'), full: true, check: (v) => (v.length > 200 ? L('Up to 200 characters', 'अधिकतम 200 अक्षर') : '') },
      ],
      onSubmit: async (v) => {
        const at = (d) => toIST(d, v.time), now = Date.now();
        if (new Date(at(v.date)).getTime() <= now && !x) { toast(L('Pick a time in the future', 'आगे का समय चुनें'), 'bad'); return false; }
        const base = { title: v.title.trim(), coach: v.coach ? v.coach.trim() : null, capacity: Math.round(v.capacity), duration_min: Math.round(v.duration_min), note: v.note ? v.note.trim() : null };
        const ok = await actClass(() => (x ? DB.update('gym_classes', x.id, { ...base, starts_at: at(v.date) }) : DB.insert('gym_classes', Array.from({ length: Number(v.weeks || 1) }, (_, i) => ({ ...base, gym_id: gymId(), starts_at: at(addDays(v.date, 7 * i)) })))), x ? L('Saved', 'सेव हुआ') : L('Class added', 'क्लास जुड़ी'));
        if (ok) render(); return !!ok;
      },
    });
  });
}
async function cancelClass(id) {
  const c = (await Q.classes()).find((x) => x.id === id); if (!c) return;
  const n = (await Q.classCounts()).get(id) || 0;
  if (!(await askConfirm(L(`Cancel "${c.title}" on ${clsDay(c.starts_at)}?${n ? ` ${n} booked member(s) will see it as cancelled.` : ''}`, `${clsDay(c.starts_at)} की "${c.title}" रद्द करें?${n ? ` बुक किए ${n} सदस्यों को यह रद्द दिखेगी।` : ''}`), L('Cancel class', 'क्लास रद्द करें'), 'bad'))) return;
  const ok = await actClass(() => DB.update('gym_classes', id, { cancelled_at: new Date().toISOString() }), L('Class cancelled', 'क्लास रद्द हुई'));
  if (!ok) return;
  render();
  if (n) tellBooked(c);
}
/* after a cancellation: one tap per booked member opens WhatsApp with the message ready (works without any WhatsApp Business setup) */
async function tellBooked(c) {
  const [members, rows] = await Promise.all([Q.members(), DB.select('class_bookings', { eq: { class_id: c.id }, filters: { cancelled_at: 'is.null' }, limit: 600 })]);
  const mm = new Map(members.map((m) => [m.id, m])), people = rows.map((r) => mm.get(r.member_id)).filter(Boolean);
  if (!people.length) return;
  const text = (m) => L(`Hello ${m.name}, from ${gymName()}. Sorry, the ${c.title} class on ${clsDay(c.starts_at)} at ${fmtTime(c.starts_at)} has been cancelled. We will let you know about the next one.`, `नमस्ते ${m.name} जी, ${gymName()} से। खेद है, ${clsDay(c.starts_at)} को ${fmtTime(c.starts_at)} की ${c.title} क्लास रद्द हो गई है। अगली क्लास की जानकारी हम बताएँगे।`);
  openModal({ title: L('Tell the booked members', 'बुक किए सदस्यों को बताएँ'), body: `<p class="muted" style="margin:0 0 8px">${esc(L('Tap WhatsApp for each member. The message is ready to send.', 'हर सदस्य के लिए WhatsApp दबाएँ। संदेश तैयार है।'))}</p><ul class="list">${people.map((m) => `<li><div class="grow"><b>${esc(m.name)}</b><small>${esc(m.phone || '')}</small></div>${m.phone ? `<a class="btn wa sm" target="_blank" rel="noopener" href="${esc(waLink(m.phone, text(m)))}">WhatsApp</a>` : `<span class="muted">${esc(L('no phone', 'फ़ोन नहीं'))}</span>`}</li>`).join('')}</ul>` });
}

/* staff: who booked a class; add or remove a member */
async function classBookings(id) {
  const [classes, members] = await Promise.all([Q.classes(), Q.members()]), c = classes.find((x) => x.id === id); if (!c) return;
  const rows = await DB.select('class_bookings', { eq: { class_id: id }, filters: { cancelled_at: 'is.null' }, order: 'created_at.asc', limit: 600 });
  const mm = new Map(members.map((m) => [m.id, m])), booked = new Set(rows.map((r) => r.member_id)), today = todayISO();
  const free = members.filter((m) => !booked.has(m.id) && m.end_date && m.end_date >= today).sort((a, b) => a.name.localeCompare(b.name));
  const open = !c.cancelled_at && new Date(c.starts_at).getTime() > Date.now();
  closeAllModals();
  const mod = openModal({
    title: `${c.title} · ${clsDay(c.starts_at)} ${clsRange(c)}`, wide: true,
    body: `<p class="muted" style="margin:0 0 8px">${esc(L(`${rows.length} of ${c.capacity} spots booked`, `${c.capacity} में से ${rows.length} जगह बुक`))}</p>`
      + (rows.length ? `<ul class="list">${rows.map((r) => `<li><div class="grow"><b>${esc(memberName(mm, r.member_id))}</b><small>${esc((mm.get(r.member_id) || {}).phone || '')}</small></div>${open ? `<button class="btn sm" data-cb="${esc(r.id)}">${esc(L('Remove', 'हटाएँ'))}</button>` : ''}</li>`).join('')}</ul>` : empty(L('No bookings yet', 'अभी कोई बुकिंग नहीं'), ''))
      + (open && rows.length < c.capacity ? `<div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap"><select class="sel" id="clsAdd" style="flex:1;min-width:180px"><option value="">${esc(L('Book a member…', 'सदस्य बुक करें…'))}</option>${free.map((m) => `<option value="${esc(m.id)}">${esc(m.name)}</option>`).join('')}</select><button class="btn pri" id="clsAddBtn">${esc(L('Book', 'बुक करें'))}</button></div>` : ''),
  });
  mod.el.addEventListener('click', async (e) => {
    const rm = e.target.closest('[data-cb]');
    if (rm) { rm.disabled = true; const ok = await actClass(() => DB.rpc('cancel_booking', { p_booking: rm.dataset.cb }), L('Booking removed', 'बुकिंग हटी')); if (ok) classBookings(id); else rm.disabled = false; }
    if (e.target.id === 'clsAddBtn') { const sel = $('#clsAdd', mod.el); if (!sel.value) return; e.target.disabled = true; const ok = await actClass(() => DB.rpc('book_class', { p_class: id, p_member: sel.value }), L('Member booked', 'सदस्य बुक हुआ')); if (ok) classBookings(id); else e.target.disabled = false; }
  });
}

/* ---------- member: book a spot ---------- */
async function vBookClass() {
  const m = (await Q.members())[0]; if (!m) return noMember();
  const [classes, counts, mine] = await Promise.all([Q.classes(), Q.classCounts(), Q.myBookings()]), now = Date.now(), today = todayISO();
  const valid = m.end_date && m.end_date >= today, mineBy = new Map(mine.map((b) => [b.class_id, b]));
  const list = classes.filter((c) => !c.cancelled_at && new Date(c.starts_at).getTime() > now && istDate(c.starts_at) <= addDays(today, 14));
  const days = [...new Set(list.map((c) => istDate(c.starts_at)))];
  const row = (c) => {
    const n = counts.get(c.id) || 0, b = mineBy.get(c.id), full = n >= c.capacity, soon = new Date(c.starts_at).getTime() < now + 2 * 3600000;
    const act1 = b ? (soon ? `<span class="muted" style="font-size:12px">${esc(L('Too late to cancel online', 'अब ऑनलाइन रद्द नहीं'))}</span>` : `<button class="btn sm" data-act="clsCancel" data-id="${esc(b.id)}">${esc(L('Cancel', 'रद्द करें'))}</button>`) : full ? '' : `<button class="btn sm pri" data-act="clsBook" data-id="${esc(c.id)}"${valid ? '' : ' disabled'}>${esc(L('Book', 'बुक करें'))}</button>`;
    return `<li><div class="grow"><b>${esc(clsRange(c))} · ${esc(c.title)}</b><small>${esc(c.coach || '')}${c.coach && c.note ? ' · ' : ''}${esc(c.note || '')} · ${esc(L(`${Math.max(0, c.capacity - n)} spots left`, `${Math.max(0, c.capacity - n)} जगह बाक़ी`))}</small></div>${b ? badge(L('Booked', 'बुक'), 'ok') : full ? badge(L('Full', 'भरी'), 'warn') : ''}${act1}</li>`;
  };
  return pageHead(gymName(), L('Book a class', 'क्लास बुक करें'), L('Reserve your spot for the next two weeks.', 'अगले दो हफ़्ते की क्लास में अपनी जगह रखें।'))
    + (valid ? '' : `<div class="banner bad" role="status">${esc(L('Your membership has ended. Renew to book classes.', 'आपकी सदस्यता ख़त्म हो गई है। क्लास बुक करने के लिए रिन्यू करें।'))}</div>`)
    + `<div class="card" style="padding:4px 18px 16px">${days.length ? days.map((d) => `<h3 style="font-size:13px;margin:14px 0 4px">${esc(clsDay(`${d}T12:00:00+05:30`))}</h3><ul class="list">${list.filter((c) => istDate(c.starts_at) === d).map(row).join('')}</ul>`).join('') : empty(L('No classes scheduled yet', 'अभी कोई क्लास तय नहीं'), L('Your gym has not added classes for the next two weeks.', 'आपके जिम ने अगले दो हफ़्ते की क्लास नहीं जोड़ी हैं।'))}</div>`;
}
async function bookClass(id) { const ok = await actClass(() => DB.rpc('book_class', { p_class: id }), L('Spot booked', 'जगह बुक हुई')); if (ok) render(); }
async function cancelMyBooking(bid) {
  if (!(await askConfirm(L('Cancel your spot?', 'अपनी जगह रद्द करें?'), L('Cancel spot', 'जगह रद्द करें'), 'bad'))) return;
  const ok = await actClass(() => DB.rpc('cancel_booking', { p_booking: bid }), L('Booking cancelled', 'बुकिंग रद्द हुई')); if (ok) render();
}
/* ================= QR code (byte mode, error correction M, versions 1-6): made in the browser, works offline ================= */
const QR_EXP = new Uint8Array(512), QR_LOG = new Uint8Array(256);
(() => { let x = 1; for (let i = 0; i < 255; i++) { QR_EXP[i] = x; QR_LOG[x] = i; x <<= 1; if (x & 256) x ^= 0x11d; } for (let i = 255; i < 512; i++) QR_EXP[i] = QR_EXP[i - 255]; })();
const qrMul = (a, b) => (a && b ? QR_EXP[QR_LOG[a] + QR_LOG[b]] : 0);
/* version: [data codewords per block, blocks, error codewords per block, byte capacity] */
const QR_VER = { 1: [16, 1, 10, 14], 2: [28, 1, 16, 26], 3: [44, 1, 26, 42], 4: [32, 2, 18, 62], 5: [43, 2, 24, 84], 6: [27, 4, 16, 106] };
const QR_ALIGN = { 1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30], 6: [6, 34] };

function qrRemainder(data, ecLen) {
  let gen = [1];
  for (let i = 0; i < ecLen; i++) { const next = new Array(gen.length + 1).fill(0); gen.forEach((c, j) => { next[j] ^= c; next[j + 1] ^= qrMul(c, QR_EXP[i]); }); gen = next; }
  const rem = new Array(ecLen).fill(0);
  data.forEach((b) => { const f = b ^ rem[0]; rem.shift(); rem.push(0); if (f) for (let i = 0; i < ecLen; i++) rem[i] ^= qrMul(gen[i + 1], f); });
  return rem;
}

function qrMatrix(text) {
  const bytes = Array.from(new TextEncoder().encode(text));
  const ver = Number(Object.keys(QR_VER).find((v) => bytes.length <= QR_VER[v][3]));
  if (!ver) throw new Error('QR text too long');
  const [dpb, blocks, epb] = QR_VER[ver], total = dpb * blocks, size = 17 + 4 * ver;
  /* data bits */
  const bits = []; const put = (v, n) => { for (let i = n - 1; i >= 0; i--) bits.push((v >>> i) & 1); };
  put(4, 4); put(bytes.length, 8); bytes.forEach((b) => put(b, 8));
  for (let i = 0; i < 4 && bits.length < total * 8; i++) bits.push(0);
  while (bits.length % 8) bits.push(0);
  const cw = []; for (let i = 0; i < bits.length; i += 8) cw.push(parseInt(bits.slice(i, i + 8).join(''), 2));
  for (let pad = 0xec; cw.length < total; pad ^= 0xec ^ 0x11) cw.push(pad);
  /* blocks, error correction, interleave */
  const data = [], ecs = [];
  for (let b = 0; b < blocks; b++) { const d = cw.slice(b * dpb, (b + 1) * dpb); data.push(d); ecs.push(qrRemainder(d, epb)); }
  const final = []; for (let i = 0; i < dpb; i++) data.forEach((d) => final.push(d[i])); for (let i = 0; i < epb; i++) ecs.forEach((e) => final.push(e[i]));
  const stream = []; final.forEach((c) => put2(stream, c)); function put2(a, v) { for (let i = 7; i >= 0; i--) a.push((v >>> i) & 1); }
  /* function patterns */
  const M = Array.from({ length: size }, () => new Array(size).fill(null)), fn = Array.from({ length: size }, () => new Array(size).fill(false));
  const set = (r, c, v) => { if (r >= 0 && c >= 0 && r < size && c < size) { M[r][c] = v; fn[r][c] = true; } };
  const finder = (r, c) => { for (let dr = -1; dr <= 7; dr++) for (let dc = -1; dc <= 7; dc++) { const on = dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6 && (dr === 0 || dr === 6 || dc === 0 || dc === 6 || (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4)); set(r + dr, c + dc, on); } };
  finder(0, 0); finder(0, size - 7); finder(size - 7, 0);
  for (let i = 8; i < size - 8; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
  const al = QR_ALIGN[ver]; al.forEach((r) => al.forEach((c) => { if (fn[r][c]) return; for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) set(r + dr, c + dc, Math.max(Math.abs(dr), Math.abs(dc)) !== 1); }));
  set(size - 8, 8, true);
  for (let i = 0; i < 9; i++) { if (!fn[8][i]) set(8, i, false); if (!fn[i][8]) set(i, 8, false); }
  for (let i = 0; i < 8; i++) { if (!fn[8][size - 1 - i]) set(8, size - 1 - i, false); if (!fn[size - 1 - i][8]) set(size - 1 - i, 8, false); }
  const reserved = fn.map((r) => r.slice());
  /* place data bits in the zigzag */
  let idx = 0, up = true;
  for (let c = size - 1; c > 0; c -= 2) {
    if (c === 6) c--;
    for (let k = 0; k < size; k++) { const r = up ? size - 1 - k : k; for (let dc = 0; dc < 2; dc++) { const cc = c - dc; if (!reserved[r][cc]) { M[r][cc] = idx < stream.length ? stream[idx] === 1 : false; idx++; } } }
    up = !up;
  }
  /* masks, format information, penalty */
  const maskFn = [(r, c) => (r + c) % 2 === 0, (r) => r % 2 === 0, (r, c) => c % 3 === 0, (r, c) => (r + c) % 3 === 0, (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0, (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0, (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0, (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0];
  const build = (m) => {
    const g = M.map((row, r) => row.map((v, c) => (reserved[r][c] ? v : v !== maskFn[m](r, c))));
    let fmt = (0 << 3 | m) << 10, rem = fmt; for (let i = 14; i >= 10; i--) if ((rem >>> i) & 1) rem ^= 0x537 << (i - 10); fmt = ((((0 << 3) | m) << 10) | rem) ^ 0x5412;
    const bit = (i) => ((fmt >>> i) & 1) === 1;
    for (let i = 0; i <= 5; i++) g[i][8] = bit(i); g[7][8] = bit(6); g[8][8] = bit(7); g[8][7] = bit(8); for (let i = 9; i < 15; i++) g[8][14 - i] = bit(i);
    for (let i = 0; i < 8; i++) g[8][size - 1 - i] = bit(i); for (let i = 8; i < 15; i++) g[size - 15 + i][8] = bit(i);
    g[size - 8][8] = true;
    return g;
  };
  const penalty = (g) => {
    let p = 0;
    const line = (get) => { for (let a = 0; a < size; a++) { let run = 1; for (let b = 1; b < size; b++) { if (get(a, b) === get(a, b - 1)) { run++; if (run === 5) p += 3; else if (run > 5) p++; } else run = 1; } } };
    line((a, b) => g[a][b]); line((a, b) => g[b][a]);
    for (let r = 0; r < size - 1; r++) for (let c = 0; c < size - 1; c++) if (g[r][c] === g[r][c + 1] && g[r][c] === g[r + 1][c] && g[r][c] === g[r + 1][c + 1]) p += 3;
    const pat = [true, false, true, true, true, false, true, false, false, false, false], pat2 = pat.slice().reverse();
    const has = (get, a, b, pt) => pt.every((v, i) => get(a, b + i) === v);
    for (let a = 0; a < size; a++) for (let b = 0; b <= size - 11; b++) { if (has((x, y) => g[x][y], a, b, pat) || has((x, y) => g[x][y], a, b, pat2)) p += 40; if (has((x, y) => g[y][x], a, b, pat) || has((x, y) => g[y][x], a, b, pat2)) p += 40; }
    let dark = 0; g.forEach((r) => r.forEach((v) => { if (v) dark++; })); p += Math.floor(Math.abs((dark * 100) / (size * size) - 50) / 5) * 10;
    return p;
  };
  let best = null, bestP = Infinity; for (let m = 0; m < 8; m++) { const g = build(m), p = penalty(g); if (p < bestP) { bestP = p; best = g; } }
  return best;
}

/* the picture: black squares on white with the 4-square quiet zone scanners need; fixed colours so it scans in dark mode too */
function qrSvg(text, px = 220) {
  const g = qrMatrix(text), n = g.length, q = 4, d = [];
  g.forEach((row, r) => row.forEach((on, c) => { if (on) d.push(`M${c + q} ${r + q}h1v1h-1z`); }));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n + 2 * q} ${n + 2 * q}" width="${px}" height="${px}" shape-rendering="crispEdges" role="img" aria-label="QR code"><rect width="100%" height="100%" fill="#fff"/><path d="${d.join('')}" fill="#000"/></svg>`;
}
/* ================= QR check-in: the member shows a QR pass, staff scan it (camera or a barcode scanner) ================= */
const PASS_RE = /^gymos:([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;
const passCode = (m) => `gymos:${m.id}`;

/* member side: the pass shown on the home page (made in the browser, works offline) */
function memberPassCard(m) {
  return card(L('My check-in pass', 'मेरा चेक-इन पास'), 'door', '', `<div style="padding:4px 18px 18px;text-align:center"><div class="qrbox">${qrSvg(passCode(m), 240)}</div><p class="muted" style="margin:10px 0 0">${esc(L('Show this QR at the front desk to check in. Turn the screen brightness up.', 'चेक-इन के लिए रिसेप्शन पर यह QR दिखाएँ। स्क्रीन की रोशनी बढ़ा लें।'))}</p></div>`);
}

/* staff side: turn one scan into a check-in, or a check-out if the member is already inside today */
async function scanCheckIn(text) {
  const mt = PASS_RE.exec(String(text || '').trim());
  if (!mt) { toast(L('This is not a GymOS pass', 'यह GymOS पास नहीं है'), 'bad'); return false; }
  const id = mt[1].toLowerCase();
  bust('members', 'visits');
  const [members, visits] = await Promise.all([Q.members(), Q.visits()]), m = members.find((x) => x.id === id);
  if (!m) { toast(L('This member is not in your gym', 'यह सदस्य आपके जिम का नहीं है'), 'bad'); return false; }
  const s = memberState(m);
  if (['Expired', 'Frozen', 'Cancelled'].includes(s)) { toast(`${m.name}: ${LANG === 'hi' && STATE_HI[s] ? STATE_HI[s] : s}`, 'bad'); return false; }
  const open = visits.find((v) => v.member_id === id && !v.out_at && istDate(v.in_at) === todayISO());
  const r = open
    ? await act(() => DB.update('visits', open.id, { out_at: new Date().toISOString() }), L(`${m.name} checked out`, `${m.name} चेक-आउट`))
    : await act(() => DB.insert('visits', { gym_id: gymId(), member_id: id }), L(`${m.name} checked in`, `${m.name} चेक-इन`));
  if (r) { bust('visits'); render(); setTimeout(() => { const i = $('#scanIn'); if (i) i.focus(); }, 250); }
  return !!r;
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
/* ================= Staff tasks: a shared to-do list for the gym (owner and trainers) ================= */
Q.tasks = () => cached('gym_tasks', () => DB.select('gym_tasks', { order: 'created_at.desc', limit: 500 }));
U.tk = { f: 'open' };
const PRIO = { High: ['bad', 'ऊँची', 0], Medium: ['warn', 'मध्यम', 1], Low: ['mute', 'कम', 2] };
const prioLabel = (p) => (LANG === 'hi' ? PRIO[p][1] : p);
async function staffNames() {
  try { return new Map((await Q.profiles()).filter((p) => p.gym_id === gymId() && (p.role === 'trainer' || p.role === 'gym_admin')).map((p) => [p.id, p.full_name || p.email || ''])); } catch (e) { return new Map(); }
}

async function vTasks() {
  const [tasks, names] = await Promise.all([Q.tasks(), staffNames()]), me = CTX.profile ? CTX.profile.id : '', today = todayISO();
  const open = tasks.filter((t) => !t.done_at), mine = open.filter((t) => t.assigned_to === me);
  const list = (U.tk.f === 'done' ? tasks.filter((t) => t.done_at) : U.tk.f === 'mine' ? mine : open)
    .slice().sort((a, b) => (a.done_at ? 1 : 0) - (b.done_at ? 1 : 0) || (a.due_on || '9999').localeCompare(b.due_on || '9999') || PRIO[a.priority][2] - PRIO[b.priority][2]);
  const overdue = open.filter((t) => t.due_on && t.due_on < today).length;
  const row = (t) => {
    const late = !t.done_at && t.due_on && t.due_on < today, who = t.assigned_to ? (t.assigned_to === me ? L('You', 'आप') : names.get(t.assigned_to) || '') : '';
    return `<li${t.done_at ? ' style="opacity:.6"' : ''}><button class="btn sm${t.done_at ? '' : ' pri'}" data-act="toggleTask" data-id="${esc(t.id)}" aria-label="${esc(t.done_at ? L('Reopen', 'दोबारा खोलें') : L('Mark done', 'पूरा करें'))}">${t.done_at ? '↺' : '✓'}</button><div class="grow"><b${t.done_at ? ' style="text-decoration:line-through"' : ''}>${esc(t.title)}</b><small>${esc([t.note, who && (L('For ', 'किसके लिए: ') + who), t.due_on && (late ? L('Overdue · ', 'देर · ') : t.due_on === today ? L('Today · ', 'आज · ') : '') + fmtDate(t.due_on)].filter(Boolean).join(' · '))}</small></div>${badge(prioLabel(t.priority), PRIO[t.priority][0])}<button class="btn sm" data-act="editTask" data-id="${esc(t.id)}">${esc(L('Edit', 'बदलें'))}</button></li>`;
  };
  return pageHead(L('Business', 'व्यापार'), L('Tasks', 'काम'), L(`${open.length} open${overdue ? ` · ${overdue} overdue` : ''}`, `${open.length} बाक़ी${overdue ? ` · ${overdue} देर से` : ''}`), `<button class="btn pri" data-act="newTask">${ic('plus')}${esc(L('Add task', 'काम जोड़ें'))}</button>`)
    + chipsHtml('tkF', U.tk.f, [['open', L('Open', 'बाक़ी'), open.length], ['mine', L('Mine', 'मेरे'), mine.length], ['done', L('Done', 'पूरे'), tasks.length - open.length]])
    + `<div class="card" style="padding:4px 18px 16px">${list.length ? `<ul class="list">${list.map(row).join('')}</ul>` : empty(U.tk.f === 'done' ? L('Nothing finished yet', 'अभी कोई काम पूरा नहीं') : L('No open tasks', 'कोई काम बाक़ी नहीं'), L('Add things like "restock whey", "fix treadmill 2" or "call dues members".', 'जैसे "व्हे स्टॉक करना", "ट्रेडमिल 2 ठीक कराना" या "बाक़ी वालों को फ़ोन"।'), `<button class="btn pri" data-act="newTask">${esc(L('Add task', 'काम जोड़ें'))}</button>`)}</div>`;
}

async function taskForm(id) {
  const [tasks, names] = await Promise.all([Q.tasks(), staffNames()]), x = id ? tasks.find((t) => t.id === id) : null, me = CTX.profile ? CTX.profile.id : '';
  if (me && !names.has(me)) names.set(me, L('Me', 'मैं'));
  openForm({
    title: x ? L('Edit task', 'काम बदलें') : L('Add task', 'काम जोड़ें'), submitLabel: L('Save', 'सेव करें'), values: x ? { ...x, assigned_to: x.assigned_to || '' } : {},
    fields: [
      { k: 'title', label: L('Task', 'काम'), req: true, full: true, check: (v) => (v.trim().length > 120 ? L('Up to 120 characters', 'अधिकतम 120 अक्षर') : '') },
      { k: 'priority', label: L('Priority', 'महत्व'), type: 'select', options: ['High', 'Medium', 'Low'].map((p) => ({ v: p, l: prioLabel(p) })), def: x ? x.priority : 'Medium' },
      { k: 'due_on', label: L('Due date', 'आख़िरी तारीख़'), type: 'date' },
      { k: 'assigned_to', label: L('Assigned to', 'किसे'), type: 'select', full: true, options: [{ v: '', l: L('Anyone', 'कोई भी') }, ...[...names].map(([v, l]) => ({ v, l }))], def: x ? x.assigned_to || '' : '' },
      { k: 'note', label: L('Note', 'नोट'), type: 'textarea', full: true, check: (v) => (v.length > 500 ? L('Up to 500 characters', 'अधिकतम 500 अक्षर') : '') },
    ],
    extra: x && isAdmin() ? `<p style="margin:12px 0 0"><button type="button" class="btn sm" data-act="delTask" data-id="${esc(x.id)}">${esc(L('Delete task', 'काम हटाएँ'))}</button></p>` : '',
    onSubmit: async (v) => {
      const row = { title: v.title.trim(), priority: v.priority, due_on: v.due_on || null, assigned_to: v.assigned_to || null, note: v.note ? v.note.trim() : null };
      const ok = await act(() => (x ? DB.update('gym_tasks', x.id, row) : DB.insert('gym_tasks', { ...row, gym_id: gymId() })), L('Saved', 'सेव हुआ'));
      if (ok) { bust('gym_tasks'); render(); } return !!ok;
    },
  });
}
async function toggleTask(id) {
  const t = (await Q.tasks()).find((x) => x.id === id); if (!t) return;
  const ok = await act(() => DB.update('gym_tasks', id, { done_at: t.done_at ? null : new Date().toISOString() }), t.done_at ? L('Reopened', 'दोबारा खोला') : L('Done', 'पूरा हुआ'));
  if (ok) { bust('gym_tasks'); render(); }
}
async function deleteTask(id) {
  const t = (await Q.tasks()).find((x) => x.id === id); if (!t) return;
  if (!(await askConfirm(L(`Delete "${t.title}"?`, `"${t.title}" हटाएँ?`), L('Delete', 'हटाएँ'), 'bad'))) return;
  const ok = await act(() => DB.remove('gym_tasks', id), L('Deleted', 'हटा दिया'));
  if (ok) { closeAllModals(); bust('gym_tasks'); render(); }
}
/* ================= Birthdays: who has a birthday this week, with a ready WhatsApp greeting ================= */
const isLeap = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
/* days from today until the next birthday (0 = today); 29 Feb is celebrated on 28 Feb in other years */
function daysToBirthday(dob, today) {
  const [by, m, d] = String(dob).slice(0, 10).split('-').map(Number), [ty, tm, td] = today.split('-').map(Number);
  const at = (y) => Date.UTC(y, m - 1, m === 2 && d === 29 && !isLeap(y) ? 28 : d), t0 = Date.UTC(ty, tm - 1, td);
  let y = ty, n = at(y); if (n < t0) { y += 1; n = at(y); }
  return { days: Math.round((n - t0) / 864e5), turning: y - by };
}
function birthdayCard(members) {
  const today = todayISO();
  const list = members.filter((m) => m.dob && memberState(m) !== 'Cancelled').map((m) => ({ m, ...daysToBirthday(m.dob, today) })).filter((x) => x.days <= 7).sort((a, b) => a.days - b.days);
  const msg = (m) => L(`Happy birthday ${m.name}! Wishing you a healthy and strong year ahead. - ${gymName()} family`, `जन्मदिन की हार्दिक शुभकामनाएँ ${m.name} जी! आपका नया साल सेहतमंद और ताक़तवर रहे। - ${gymName()} परिवार`);
  const row = ({ m, days, turning }) => `<li class="click" data-act="openMember" data-id="${esc(m.id)}">${avatarM(m)}<div class="grow"><b>${esc(m.name)}</b><small>${esc(days === 0 ? L('Today', 'आज') : days === 1 ? L('Tomorrow', 'कल') : L(`In ${days} days`, `${days} दिन में`))} · ${esc(L(`turns ${turning}`, `${turning} साल के होंगे`))}</small></div>${m.phone ? `<a class="btn wa sm" target="_blank" rel="noopener" href="${esc(waLink(m.phone, msg(m)))}" onclick="event.stopPropagation()">WhatsApp</a>` : ''}</li>`;
  return card(L('Birthdays this week', 'इस हफ़्ते जन्मदिन'), 'gift', '', list.length ? `<ul class="list">${list.map(row).join('')}</ul>` : empty(L('No birthdays this week', 'इस हफ़्ते कोई जन्मदिन नहीं'), L('Add the date of birth in a member\'s profile to see birthdays here.', 'सदस्य की प्रोफ़ाइल में जन्म की तारीख़ भरें, फिर जन्मदिन यहाँ दिखेंगे।')));
}
/* ================= Achievements: badges and a level, worked out from the member's own real visits (last 90 days) ================= */
const BADGES = [
  { id: 'd1', kind: 'days', n: 1, en: 'First step', hi: 'पहला कदम' }, { id: 'd10', kind: 'days', n: 10, en: 'Regular', hi: 'नियमित' },
  { id: 'd25', kind: 'days', n: 25, en: 'Committed', hi: 'पक्का इरादा' }, { id: 'd50', kind: 'days', n: 50, en: 'Iron habit', hi: 'लोहे की आदत' },
  { id: 's3', kind: 'streak', n: 3, en: 'On a roll', hi: 'लय में' }, { id: 's7', kind: 'streak', n: 7, en: 'Week warrior', hi: 'हफ़्ते का योद्धा' },
  { id: 's14', kind: 'streak', n: 14, en: 'Two weeks strong', hi: 'दो हफ़्ते डटे' }, { id: 's30', kind: 'streak', n: 30, en: 'Unstoppable', hi: 'रुकने वाले नहीं' },
];
const LEVELS = [[0, 'Starter', 'शुरुआती'], [10, 'Regular', 'नियमित'], [25, 'Strong', 'मज़बूत'], [50, 'Elite', 'एलीट']];

/* pure: days trained in the window and the best run of days in a row -> every badge with earned flag, the level, and the next goal */
function badgeStatus(daysTrained, bestRun) {
  const val = (b) => (b.kind === 'days' ? daysTrained : bestRun);
  const list = BADGES.map((b) => ({ ...b, earned: val(b) >= b.n, have: Math.min(val(b), b.n) }));
  let lv = LEVELS[0]; LEVELS.forEach((x) => { if (daysTrained >= x[0]) lv = x; });
  const nxt = LEVELS.find((x) => x[0] > daysTrained) || null;
  const todo = list.filter((b) => !b.earned).sort((a, b) => (b.have / b.n) - (a.have / a.n))[0] || null;
  return { list, level: lv, nextLevel: nxt, goal: todo };
}

function achievementsCard(visits) {
  const days = visitDays(visits), st = badgeStatus(days.size, bestStreak(days)), got = st.list.filter((b) => b.earned).length;
  const pill = (b) => `<span class="badge ${b.earned ? 'ok' : ''}" title="${esc(b.kind === 'days' ? L(`Train on ${b.n} different days`, `${b.n} अलग-अलग दिन ट्रेनिंग करें`) : L(`Train ${b.n} days in a row`, `लगातार ${b.n} दिन ट्रेनिंग करें`))}" style="${b.earned ? '' : 'color:var(--muted);border-color:var(--line)'}">${ic(b.earned ? 'check' : 'lock')} ${esc(L(b.en, b.hi))}</span>`;
  const g = st.goal;
  const goal = g ? `<p class="muted" style="margin:12px 0 0">${esc(L('Next badge: ', 'अगला बैज: '))}<b>${esc(L(g.en, g.hi))}</b> · ${esc(g.kind === 'days' ? L(`${g.have} of ${g.n} training days`, `${g.n} में से ${g.have} ट्रेनिंग दिन`) : L(`best run ${g.have} of ${g.n} days in a row`, `लगातार ${g.n} में से सबसे लंबा ${g.have} दिन`))}</p><div style="height:6px;border-radius:6px;background:var(--line);margin-top:6px;overflow:hidden"><div style="height:100%;width:${Math.round((g.have / g.n) * 100)}%;background:var(--crimson)"></div></div>` : `<p class="muted" style="margin:12px 0 0">${esc(L('All badges earned. Keep the habit going!', 'सारे बैज मिल गए। यही आदत बनाए रखें!'))}</p>`;
  return card(L('Achievements', 'उपलब्धियाँ'), 'crown', `<span class="muted" style="font-size:13px">${esc(L(`${got} of ${st.list.length}`, `${st.list.length} में से ${got}`))}</span>`,
    `<p style="margin:0 0 10px"><b>${esc(L('Level: ', 'स्तर: '))}${esc(L(st.level[1], st.level[2]))}</b>${st.nextLevel ? `<span class="muted"> · ${esc(L(`${st.nextLevel[0] - days.size} more training days to ${st.nextLevel[1]}`, `${st.nextLevel[2]} तक ${st.nextLevel[0] - days.size} और ट्रेनिंग दिन`))}</span>` : ''}</p><div style="display:flex;flex-wrap:wrap;gap:8px">${st.list.map(pill).join('')}</div>${goal}<p class="muted" style="margin:10px 0 0;font-size:12px">${esc(L('Counted from your check-ins in the last 90 days.', 'पिछले 90 दिनों की आपकी चेक-इन से गिना गया।'))}</p>`);
}
/* ================= Google review link: the owner pastes it once; a QR for the front desk and a button for members ================= */
/* same rule as the database check: https and a Google address only, no spaces, up to 300 characters */
const REVIEW_RE = /^https:\/\/(search\.google\.com|www\.google\.com|google\.com|g\.page|maps\.app\.goo\.gl|goo\.gl)\/\S+$/;
const reviewOk = (u) => typeof u === 'string' && u.length <= 300 && REVIEW_RE.test(u);
const gymReview = () => { const u = CTX.gym && CTX.gym.review_url; return reviewOk(u) ? u : ''; };

/* staff: a QR the owner can show on the screen or print and stick at the front desk */
function reviewQrCard() {
  const u = gymReview();
  if (!u) return card(L('Google reviews', 'गूगल रिव्यू'), 'globe', '', empty(L('No review link yet', 'अभी रिव्यू लिंक नहीं'), L('Paste your Google review link in Edit gym. A QR for the front desk appears here.', 'जिम बदलें में अपना गूगल रिव्यू लिंक डालें। फ़्रंट डेस्क के लिए QR यहाँ दिखेगा।')));
  let svg = ''; try { svg = qrSvg(u, 200); } catch (e) { svg = ''; }
  return card(L('Google reviews', 'गूगल रिव्यू'), 'globe', '', `<div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap">${svg ? `<div class="qrbox">${svg}</div>` : ''}<div style="flex:1;min-width:200px"><p style="margin:0 0 8px">${esc(L('Ask happy members to scan this and leave a review.', 'खुश सदस्यों से कहें कि इसे स्कैन करके रिव्यू दें।'))}</p>${svg ? '' : `<p class="muted" style="margin:0 0 8px">${esc(L('This link is too long for a QR. Use the short g.page link from Google Business Profile.', 'यह लिंक QR के लिए बहुत लंबा है। गूगल बिज़नेस प्रोफ़ाइल का छोटा g.page लिंक इस्तेमाल करें।'))}</p>`}<a class="btn sm" target="_blank" rel="noopener noreferrer" href="${esc(u)}">${esc(L('Open the review page', 'रिव्यू पेज खोलें'))}</a></div></div>`);
}

/* member home: one clear button */
function reviewMemberCard() {
  const u = gymReview(); if (!u) return '';
  return `<div class="card" style="padding:14px;margin-bottom:14px;display:flex;gap:12px;align-items:center;flex-wrap:wrap"><span style="flex:1;min-width:200px"><b>${esc(L('Enjoying the gym?', 'जिम पसंद आ रहा है?'))}</b><br><span class="muted">${esc(L('A short Google review helps us a lot.', 'गूगल पर छोटा सा रिव्यू हमारे लिए बहुत मायने रखता है।'))}</span></span><a class="btn" target="_blank" rel="noopener noreferrer" href="${esc(u)}">${esc(L('Write a review', 'रिव्यू लिखें'))}</a></div>`;
}
/* ================= Referrals: who brought whom. Counts only, no rewards are promised by the app ================= */
function referralRows(members) {
  const byId = new Map(members.map((m) => [m.id, m])), tally = new Map();
  members.forEach((m) => { if (m.referred_by && byId.has(m.referred_by)) { const a = tally.get(m.referred_by) || []; a.push(m); tally.set(m.referred_by, a); } });
  return [...tally.entries()].map(([id, kids]) => ({ m: byId.get(id), kids })).sort((a, b) => b.kids.length - a.kids.length || a.m.name.localeCompare(b.m.name));
}
function referralCard(members) {
  const rows = referralRows(members).slice(0, 10);
  const msg = (m, n) => L(`Thank you ${m.name}! ${n} friend${n > 1 ? 's' : ''} joined ${gymName()} because of you. We truly appreciate it.`, `धन्यवाद ${m.name} जी! आपकी वजह से ${n} साथी ${gymName()} से जुड़े। हम दिल से आभारी हैं।`);
  const row = ({ m, kids }) => `<li class="click" data-act="openMember" data-id="${esc(m.id)}">${avatarM(m)}<div class="grow"><b>${esc(m.name)}</b><small>${esc(L(`${kids.length} joined`, `${kids.length} जुड़े`))}: ${esc(kids.slice(0, 3).map((k) => k.name).join(', '))}${kids.length > 3 ? '…' : ''}</small></div>${m.phone ? `<a class="btn wa sm" target="_blank" rel="noopener" href="${esc(waLink(m.phone, msg(m, kids.length)))}" onclick="event.stopPropagation()">WhatsApp</a>` : ''}</li>`;
  return card(L('Top referrers', 'सबसे ज़्यादा जुड़वाने वाले'), 'users', '', rows.length ? `<ul class="list">${rows.map(row).join('')}</ul>` : empty(L('No referrals yet', 'अभी कोई रेफ़रल नहीं'), L('When adding a member, pick who referred them. Your best promoters show up here.', 'सदस्य जोड़ते समय चुनें कि किसने जुड़वाया। आपके सबसे अच्छे प्रचारक यहाँ दिखेंगे।')));
}
/* ================= Membership freeze: pause a running membership, the end date moves by the days frozen ================= */
const openFreeze = (memberId) => DB.select('member_freezes', { eq: { member_id: memberId }, filters: { ended_on: 'is.null' }, limit: 1 }).then((r) => r[0] || null);

function freezeForm(m) {
  openForm({
    title: `${L('Freeze membership', 'सदस्यता फ़्रीज़ करें')} · ${m.name}`, submitLabel: L('Freeze', 'फ़्रीज़ करें'),
    fields: [{ k: 'reason', label: L('Reason (optional)', 'कारण (वैकल्पिक)'), full: true, ph: L('Travelling, injury…', 'बाहर जाना, चोट…'), check: (v) => (v.length > 200 ? L('Up to 200 characters', 'अधिकतम 200 अक्षर') : '') }],
    extra: `<p class="muted" style="margin:10px 0 0">${esc(L('The member cannot check in while frozen. When you unfreeze, the end date moves ahead by the days frozen.', 'फ़्रीज़ में सदस्य चेक-इन नहीं कर सकेगा। खोलने पर समाप्ति की तारीख़ फ़्रीज़ के दिनों जितनी आगे बढ़ जाएगी।'))}</p>`,
    onSubmit: async (v) => {
      const ok = await act(() => DB.rpc('freeze_member', { member: m.id, why: v.reason ? v.reason.trim() : null }), L('Membership frozen', 'सदस्यता फ़्रीज़ हुई'));
      if (ok) { bust('members'); render(); } return !!ok;
    },
  });
}

async function unfreezeMember(m) {
  let f = null; try { f = await openFreeze(m.id); } catch (e) { /* the question below still works without the date */ }
  const days = f ? Math.max(diffDays(f.started_on, todayISO()), 0) : 0, nu = m.end_date ? addDays(m.end_date, days) : null;
  const sentence = f ? L(`Frozen since ${fmtDate(f.started_on)} (${days} days). The end date moves from ${fmtDate(m.end_date)} to ${fmtDate(nu)}.`, `${fmtDate(f.started_on)} से फ़्रीज़ (${days} दिन)। समाप्ति ${fmtDate(m.end_date)} से बढ़कर ${fmtDate(nu)} होगी।`) : L('Unfreeze this membership?', 'यह सदस्यता खोलें?');
  if (!(await askConfirm(sentence, L('Unfreeze', 'फ़्रीज़ हटाएँ'), 'primary'))) return;
  const ok = await act(() => DB.rpc('unfreeze_member', { member: m.id }), L('Membership is active again', 'सदस्यता फिर चालू हुई'));
  if (ok !== null && ok !== false) { closeAllModals(); bust('members'); render(); }
}
/* ================= Equipment register: what the gym owns, its condition, and when it is next due for service ================= */
Q.equipment = () => cached('gym_equipment', () => DB.select('gym_equipment', { order: 'name.asc', limit: 500 }));
U.eq = { f: 'all' };
const EQ_STATUS = { Working: ['ok', 'चालू'], 'Needs repair': ['warn', 'मरम्मत चाहिए'], 'Out of order': ['bad', 'बंद'] };
const eqStatusLabel = (s) => (LANG === 'hi' ? EQ_STATUS[s][1] : s);
/* next service date, or null when no schedule or never serviced; days left is negative when overdue */
function eqNext(e) { return e.service_every_days && e.last_service_on ? addDays(e.last_service_on, e.service_every_days) : null; }
function eqDue(e, today) { const n = eqNext(e); return n == null ? null : diffDays(today, n); }

async function vEquipment() {
  const items = await Q.equipment(), today = todayISO();
  const late = items.filter((e) => { const d = eqDue(e, today); return d != null && d < 0; }), bad = items.filter((e) => e.status !== 'Working');
  const list = U.eq.f === 'bad' ? bad : U.eq.f === 'late' ? late : items;
  const row = (e) => {
    const d = eqDue(e, today), n = eqNext(e);
    const when = n == null ? (e.service_every_days ? L('Never serviced', 'सर्विस कभी नहीं हुई') : L('No service schedule', 'सर्विस का शेड्यूल नहीं')) : d < 0 ? L(`Service overdue by ${-d} days`, `सर्विस ${-d} दिन से बाक़ी`) : d === 0 ? L('Service due today', 'सर्विस आज') : L(`Next service ${fmtDate(n)}`, `अगली सर्विस ${fmtDate(n)}`);
    return `<li><div class="grow"><b>${esc(e.name)}</b><small style="${d != null && d < 0 ? 'color:var(--crimson)' : ''}">${esc([when, e.last_service_on && L('Last: ', 'पिछली: ') + fmtDate(e.last_service_on), e.vendor, e.note].filter(Boolean).join(' · '))}</small></div>${badge(eqStatusLabel(e.status), EQ_STATUS[e.status][0])}<button class="btn sm" data-act="eqServiced" data-id="${esc(e.id)}">${esc(L('Serviced today', 'आज सर्विस हुई'))}</button><button class="btn sm" data-act="editEq" data-id="${esc(e.id)}">${esc(L('Edit', 'बदलें'))}</button></li>`;
  };
  return pageHead(L('Business', 'व्यापार'), L('Equipment', 'उपकरण'), L(`${items.length} items${late.length ? ` · ${late.length} service overdue` : ''}${bad.length ? ` · ${bad.length} not working well` : ''}`, `${items.length} उपकरण${late.length ? ` · ${late.length} की सर्विस बाक़ी` : ''}${bad.length ? ` · ${bad.length} ठीक नहीं` : ''}`), `<button class="btn pri" data-act="newEq">${ic('plus')}${esc(L('Add equipment', 'उपकरण जोड़ें'))}</button>`)
    + chipsHtml('eqF', U.eq.f, [['all', L('All', 'सब'), items.length], ['late', L('Service due', 'सर्विस बाक़ी'), late.length], ['bad', L('Needs attention', 'ध्यान चाहिए'), bad.length]])
    + `<div class="card" style="padding:4px 18px 16px">${list.length ? `<ul class="list">${list.map(row).join('')}</ul>` : empty(items.length ? L('Nothing here', 'यहाँ कुछ नहीं') : L('No equipment yet', 'अभी कोई उपकरण नहीं'), L('Add treadmills, cycles and machines with how often each needs service. Overdue ones show here.', 'ट्रेडमिल, साइकिल और मशीनें जोड़ें और बताएँ कितने दिन में सर्विस होनी है। देर वाली यहाँ दिखेंगी।'), items.length ? '' : `<button class="btn pri" data-act="newEq">${esc(L('Add equipment', 'उपकरण जोड़ें'))}</button>`)}</div>`;
}

async function equipmentForm(id) {
  const x = id ? (await Q.equipment()).find((e) => e.id === id) : null;
  openForm({
    title: x ? L('Edit equipment', 'उपकरण बदलें') : L('Add equipment', 'उपकरण जोड़ें'), submitLabel: L('Save', 'सेव करें'), values: x ? { ...x, service_every_days: x.service_every_days || '', last_service_on: x.last_service_on || '', vendor: x.vendor || '', note: x.note || '' } : {},
    fields: [
      { k: 'name', label: L('Name', 'नाम'), req: true, full: true, ph: L('Treadmill 1', 'ट्रेडमिल 1'), check: (v) => (v.trim().length > 80 ? L('Up to 80 characters', 'अधिकतम 80 अक्षर') : '') },
      { k: 'status', label: L('Condition', 'हालत'), type: 'select', options: Object.keys(EQ_STATUS).map((s) => ({ v: s, l: eqStatusLabel(s) })), def: x ? x.status : 'Working' },
      { k: 'service_every_days', label: L('Service every (days)', 'हर कितने दिन सर्विस'), type: 'number', min: 1, step: 1, check: (v) => (v !== '' && (v < 1 || v > 730 || !Number.isInteger(Number(v))) ? L('1 to 730 whole days', '1 से 730 पूरे दिन') : '') },
      { k: 'last_service_on', label: L('Last serviced on', 'पिछली सर्विस'), type: 'date', check: (v) => (v && v > todayISO() ? L('Cannot be in the future', 'आगे की तारीख़ नहीं') : '') },
      { k: 'vendor', label: L('Service vendor / phone', 'सर्विस वाले का नाम / फ़ोन'), full: true, check: (v) => (v.length > 120 ? L('Up to 120 characters', 'अधिकतम 120 अक्षर') : '') },
      { k: 'note', label: L('Note', 'नोट'), type: 'textarea', full: true, check: (v) => (v.length > 500 ? L('Up to 500 characters', 'अधिकतम 500 अक्षर') : '') },
    ],
    extra: x && isAdmin() ? `<p style="margin:12px 0 0"><button type="button" class="btn sm" data-act="delEq" data-id="${esc(x.id)}">${esc(L('Delete equipment', 'उपकरण हटाएँ'))}</button></p>` : '',
    onSubmit: async (v) => {
      const row = { name: v.name.trim(), status: v.status, service_every_days: v.service_every_days === '' ? null : Number(v.service_every_days), last_service_on: v.last_service_on || null, vendor: v.vendor ? v.vendor.trim() : null, note: v.note ? v.note.trim() : null };
      const ok = await act(() => (x ? DB.update('gym_equipment', x.id, row) : DB.insert('gym_equipment', { ...row, gym_id: gymId() })), L('Saved', 'सेव हुआ'));
      if (ok) { bust('gym_equipment'); render(); } return !!ok;
    },
  });
}
async function eqServiced(id) {
  const ok = await act(() => DB.update('gym_equipment', id, { last_service_on: todayISO(), status: 'Working' }), L('Service recorded', 'सर्विस दर्ज हुई'));
  if (ok) { bust('gym_equipment'); render(); }
}
async function deleteEquipment(id) {
  const e = (await Q.equipment()).find((x) => x.id === id); if (!e) return;
  if (!(await askConfirm(L(`Delete "${e.name}"?`, `"${e.name}" हटाएँ?`), L('Delete', 'हटाएँ'), 'bad'))) return;
  const ok = await act(() => DB.remove('gym_equipment', id), L('Deleted', 'हटा दिया'));
  if (ok) { closeAllModals(); bust('gym_equipment'); render(); }
}
/* ================= This week vs last week: the owner's Monday-morning numbers, all from the gym's own data ================= */
/* pure: windows are the last 7 days including today, and the 7 days before that */
function weekStats(members, payments, visits, today) {
  const from = (n) => addDays(today, -n), inW = (d, a, b) => d >= a && d <= b;
  const cur = [from(6), today], prev = [from(13), from(7)];
  const pay = (w) => round2(sum(payments.filter((p) => inW(p.paid_on, w[0], w[1])), (p) => Number(p.amount)));
  const joined = (w) => members.filter((m) => m.joined_on && inW(m.joined_on, w[0], w[1])).length;
  const vis = (w) => visits.filter((v) => inW(istDate(v.in_at), w[0], w[1])).length;
  const people = (w) => new Set(visits.filter((v) => inW(istDate(v.in_at), w[0], w[1])).map((v) => v.member_id)).size;
  const ending = members.filter((m) => m.status === 'Active' && m.end_date && m.end_date >= today && m.end_date <= addDays(today, 7)).length;
  return {
    collected: [pay(cur), pay(prev)], joined: [joined(cur), joined(prev)], visits: [vis(cur), vis(prev)], people: [people(cur), people(prev)], ending,
  };
}
const pctChange = (a, b) => (b > 0 ? Math.round(((a - b) / b) * 100) : null);

async function weeklyCard() {
  const [members, payments, visits, invoices] = await Promise.all([Q.members(), Q.payments(), Q.visits(), Q.invoices()]);
  const t = todayISO(), s = weekStats(members, payments, visits, t), paid = paidByInvoice(payments), dues = sum(invoices, (i) => balanceOf(i, paid));
  const delta = (pair, fmt) => { const c = pctChange(pair[0], pair[1]); const txt = c == null ? L('no data last week', 'पिछले हफ़्ते डेटा नहीं') : `${c > 0 ? '+' : c < 0 ? '−' : ''}${Math.abs(c)}%`; return `<span style="color:${c == null || c === 0 ? 'var(--muted)' : c > 0 ? 'var(--ok)' : 'var(--crimson)'}">${esc(txt)}</span> <span class="muted">${esc(L('vs ' + fmt(pair[1]), 'पिछले हफ़्ते ' + fmt(pair[1])))}</span>`; };
  const plain = (n) => String(n);
  const text = L(`${gymName()}: last 7 days\nCollected ${inr(s.collected[0])} (before: ${inr(s.collected[1])})\nNew members ${s.joined[0]} (before: ${s.joined[1]})\nCheck-ins ${s.visits[0]} by ${s.people[0]} members\nMemberships ending in 7 days: ${s.ending}\nPending dues ${inr(dues)}`, `${gymName()}: पिछले 7 दिन\nवसूली ${inr(s.collected[0])} (पहले: ${inr(s.collected[1])})\nनए सदस्य ${s.joined[0]} (पहले: ${s.joined[1]})\nचेक-इन ${s.visits[0]}, ${s.people[0]} सदस्यों के\n7 दिन में खत्म होने वाली सदस्यताएँ: ${s.ending}\nबकाया ${inr(dues)}`);
  const box = (lab, v, d) => `<div style="min-width:130px;flex:1"><div class="muted" style="font-size:12px">${esc(lab)}</div><div style="font-size:20px;font-weight:700">${v}</div><div style="font-size:12px">${d}</div></div>`;
  return card(L('Last 7 days', 'पिछले 7 दिन'), 'chart', `<a class="btn wa sm" target="_blank" rel="noopener" href="${esc(waLink('', text))}">${esc(L('Share', 'शेयर करें'))}</a>`,
    `<div style="display:flex;gap:14px;flex-wrap:wrap">${box(L('Collected', 'वसूली'), esc(inr(s.collected[0])), delta(s.collected, inr))}${box(L('New members', 'नए सदस्य'), s.joined[0], delta(s.joined, plain))}${box(L('Check-ins', 'चेक-इन'), s.visits[0], delta(s.visits, plain))}${box(L('Members who came', 'आने वाले सदस्य'), s.people[0], delta(s.people, plain))}</div><p class="muted" style="margin:12px 0 0">${esc(L(`${s.ending} memberships end in the next 7 days. Pending dues: ${inr(dues)}.`, `अगले 7 दिन में ${s.ending} सदस्यताएँ खत्म होंगी। कुल बकाया: ${inr(dues)}।`))}</p>`);
}
/* ================= Workout log: sets, reps and weight by the member; personal records and weekly volume worked out from the entries ================= */
const WK_COMMON = ['Squat', 'Bench press', 'Deadlift', 'Overhead press', 'Barbell row', 'Pull-up', 'Push-up', 'Lat pulldown', 'Leg press', 'Dumbbell curl', 'Triceps pushdown', 'Plank (seconds)', 'Treadmill (minutes)'];
const wkOf = (memberId) => DB.select('member_workouts', { eq: { member_id: memberId }, order: 'done_on.desc,created_at.desc', limit: 1000 });
const wkKey = (s) => String(s).trim().replace(/\s+/g, ' ').toLowerCase();
const wkName = (s) => String(s).trim().replace(/\s+/g, ' ');

/* Epley estimate, only meaningful for 1 to 10 reps with real weight */
const est1RM = (w, r) => (w > 0 && r >= 1 && r <= 10 ? (r === 1 ? w : w * (1 + r / 30)) : 0);

/* pure: rows newest first -> best set per exercise (heaviest, then most reps; bodyweight sets compare by reps), sessions, weekly volume */
function workoutStats(rows, today) {
  const best = new Map();
  rows.forEach((r) => {
    const k = wkKey(r.exercise), w = Number(r.weight_kg), reps = Number(r.reps), cur = best.get(k);
    if (!cur || w > cur.weight || (w === cur.weight && reps > cur.reps)) best.set(k, { name: cur ? cur.name : wkName(r.exercise), weight: w, reps, e1rm: est1RM(w, reps), date: r.done_on, id: r.id });
  });
  /* the name shown is the casing used first (oldest entry) */
  [...rows].reverse().forEach((r) => { const b = best.get(wkKey(r.exercise)); if (b && !b.named) { b.name = wkName(r.exercise); b.named = true; } });
  const vol = (a, b) => Math.round(rows.filter((r) => r.done_on >= a && r.done_on <= b).reduce((s, r) => s + Number(r.sets) * Number(r.reps) * Number(r.weight_kg), 0));
  const cur = [addDays(today, -6), today], prev = [addDays(today, -13), addDays(today, -7)];
  const days = (a, b) => new Set(rows.filter((r) => r.done_on >= a && r.done_on <= b).map((r) => r.done_on)).size;
  return { best, volume: [vol(cur[0], cur[1]), vol(prev[0], prev[1])], sessions: [days(cur[0], cur[1]), days(prev[0], prev[1])], isPR: (r) => { const b = best.get(wkKey(r.exercise)); return !!b && b.id === r.id && Number(r.weight_kg) > 0; } };
}

function workoutForm(memberId, rows, after) {
  const seen = []; rows.forEach((r) => { const n = wkName(r.exercise); if (!seen.some((x) => wkKey(x) === wkKey(n))) seen.push(n); });
  const names = [...seen, ...WK_COMMON.filter((c) => !seen.some((x) => wkKey(x) === wkKey(c)))];
  const last = rows[0];
  openForm({
    title: L('Log an exercise', 'एक्सरसाइज़ दर्ज करें'), submitLabel: L('Save', 'सेव करें'),
    values: last ? { sets: last.sets, reps: last.reps } : { sets: 3, reps: 10 },
    fields: [
      { k: 'done_on', label: L('Date', 'तारीख़'), type: 'date', def: todayISO(), check: (v) => (v && v > todayISO() ? L('Cannot be in the future', 'आगे की तारीख़ नहीं') : '') },
      { k: 'exercise', label: L('Exercise', 'एक्सरसाइज़'), req: true, full: true, list: names, check: (v) => (wkName(v).length < 1 || wkName(v).length > 80 ? L('1 to 80 characters', '1 से 80 अक्षर') : '') },
      { k: 'sets', label: L('Sets', 'सेट'), type: 'number', req: true, min: 1, check: (v) => (!Number.isInteger(Number(v)) || v < 1 || v > 30 ? L('Whole number, 1 to 30', 'पूरी संख्या, 1 से 30') : '') },
      { k: 'reps', label: L('Reps', 'रेप्स'), type: 'number', req: true, min: 1, check: (v) => (!Number.isInteger(Number(v)) || v < 1 || v > 200 ? L('Whole number, 1 to 200', 'पूरी संख्या, 1 से 200') : '') },
      { k: 'weight_kg', label: L('Weight (kg), 0 for body weight', 'वज़न (किग्रा), बॉडी वेट के लिए 0'), type: 'number', min: 0, step: '0.5', full: true, def: last ? Number(last.weight_kg) : 0, check: (v) => (v === '' ? '' : v < 0 || v > 1000 ? L('0 to 1000', '0 से 1000') : '') },
      { k: 'note', label: L('Note', 'नोट'), full: true, check: (v) => (v.length > 200 ? L('Up to 200 characters', 'अधिकतम 200 अक्षर') : '') },
    ],
    onSubmit: async (v) => {
      const row = { gym_id: gymId(), member_id: memberId, done_on: v.done_on || todayISO(), exercise: wkName(v.exercise), sets: Number(v.sets), reps: Number(v.reps), weight_kg: v.weight_kg === '' || v.weight_kg == null ? 0 : Number(v.weight_kg), note: v.note ? v.note.trim() : null };
      const before = workoutStats(rows, todayISO()).best.get(wkKey(row.exercise));
      const ok = await act(() => DB.insert('member_workouts', row), L('Saved', 'सेव हुआ'));
      if (!ok) return false;
      const isPR = row.weight_kg > 0 && (!before || row.weight_kg > before.weight || (row.weight_kg === before.weight && row.reps > before.reps));
      if (isPR && before) toast(L('New personal record!', 'नया पर्सनल रिकॉर्ड!'), 'ok');
      if (after) await after(); else render();
      return true;
    },
  });
}
async function deleteWorkout(id) {
  if (!(await askConfirm(L('Delete this entry?', 'यह एंट्री हटाएँ?'), L('Delete', 'हटाएँ'), 'bad'))) return;
  const ok = await act(() => DB.remove('member_workouts', id), L('Deleted', 'हटा दिया')); if (ok) render();
}

/* shared body: staff see it read-only inside the member modal, the member sees it on their page */
function workoutBody(rows, own, memberId) {
  if (!rows.length) return empty(L('No workouts logged yet', 'अभी कोई वर्कआउट दर्ज नहीं'), own ? L('Log your sets after each session to see your records and weekly volume.', 'हर सेशन के बाद अपने सेट दर्ज करें, फिर रिकॉर्ड और साप्ताहिक वॉल्यूम दिखेंगे।') : L('This member has not logged any workouts yet.', 'इस सदस्य ने अभी कोई वर्कआउट दर्ज नहीं किया।'), own ? `<button class="btn pri" data-act="addWorkout" data-id="${esc(memberId)}">${esc(L('Log an exercise', 'एक्सरसाइज़ दर्ज करें'))}</button>` : '');
  const st = workoutStats(rows, todayISO()), prs = [...st.best.values()].sort((a, b) => b.weight - a.weight || b.reps - a.reps).slice(0, 8);
  const chg = (p) => { const c = pctChange(p[0], p[1]); return c == null ? esc(L('no data last week', 'पिछले हफ़्ते डेटा नहीं')) : `<span style="color:${c >= 0 ? 'var(--ok)' : 'var(--crimson)'}">${c > 0 ? '+' : c < 0 ? '−' : ''}${Math.abs(c)}%</span> ${esc(L('vs last week', 'पिछले हफ़्ते से'))}`; };
  const byDate = new Map(); rows.slice(0, 120).forEach((r) => { if (!byDate.has(r.done_on)) byDate.set(r.done_on, []); byDate.get(r.done_on).push(r); });
  return `<div class="tiles" style="margin-bottom:12px">${tile(L('Sessions, last 7 days', 'पिछले 7 दिन के सेशन'), st.sessions[0], chg(st.sessions))}${tile(L('Volume, last 7 days', 'पिछले 7 दिन का वॉल्यूम'), esc(st.volume[0].toLocaleString('en-IN') + ' kg'), chg(st.volume))}</div>`
    + card(L('Personal records', 'पर्सनल रिकॉर्ड'), 'crown', '', `<ul class="list">${prs.map((b) => `<li><div class="grow"><b>${esc(b.name)}</b><small>${esc(fmtDate(b.date))}${b.e1rm ? ` · ${esc(L('est. 1 rep max', 'अनुमानित 1 रेप मैक्स'))} ${esc(num1(b.e1rm))} kg` : ''}</small></div><b>${esc(b.weight > 0 ? `${num1(b.weight)} kg × ${b.reps}` : `${b.reps} ${L('reps', 'रेप्स')}`)}</b></li>`).join('')}</ul>`)
    + `<div style="height:12px"></div>` + card(L('Log', 'लॉग'), 'list', '', [...byDate.entries()].map(([d, rs]) => `<div style="margin-bottom:12px"><div class="muted" style="font-size:12px;margin-bottom:4px">${esc(fmtDate(d))}</div><ul class="list">${rs.map((r) => `<li><div class="grow"><b>${esc(r.exercise)}</b>${st.isPR(r) ? ` ${badge(L('PR', 'रिकॉर्ड'), 'ok')}` : ''}<small>${esc(`${r.sets} × ${r.reps}${Number(r.weight_kg) > 0 ? ' @ ' + num1(r.weight_kg) + ' kg' : ''}`)}${r.note ? ' · ' + esc(r.note) : ''}</small></div>${own ? `<button class="btn sm" data-act="delWorkout" data-id="${esc(r.id)}">${esc(L('Delete', 'हटाएँ'))}</button>` : ''}</li>`).join('')}</ul></div>`).join(''));
}

async function vMyWorkouts() {
  const m = (await Q.members())[0]; if (!m) return noMember();
  const rows = await wkOf(m.id);
  return pageHead(gymName(), L('Workout log', 'वर्कआउट लॉग'), L('Your sets, reps and weights, with personal records.', 'आपके सेट, रेप्स और वज़न, पर्सनल रिकॉर्ड के साथ।'), rows.length ? `<button class="btn pri" data-act="addWorkout" data-id="${esc(m.id)}">${ic('plus')}${esc(L('Add', 'जोड़ें'))}</button>` : '')
    + workoutBody(rows, true, m.id);
}
async function workoutModal(memberId) {
  const members = await Q.members(), m = members.find((x) => x.id === memberId); if (!m) return;
  const rows = await wkOf(memberId);
  closeAllModals(); openModal({ title: L(`${m.name}: workouts`, `${m.name}: वर्कआउट`), wide: true, body: workoutBody(rows, false, memberId) });
}
/* ================= Daily habits: water, meals and sleep, logged by the member. Totals are worked out from the entries ================= */
const WATER_GOAL_ML = 3000;
const MEALS = ['Breakfast', 'Lunch', 'Snack', 'Dinner'], MEAL_HI = { Breakfast: 'नाश्ता', Lunch: 'दोपहर का खाना', Snack: 'स्नैक', Dinner: 'रात का खाना' };
/* typical values for one serving; approximate, so every screen says so: [English, Hindi, serving, kcal, protein g, carbs g, fat g] */
const FOODS = [
  ['Roti', 'रोटी', '1 medium', 120, 3.5, 22, 2.5], ['Cooked rice', 'चावल', '1 katori (150 g)', 195, 4, 43, 0.4], ['Dal', 'दाल', '1 katori (150 g)', 150, 9, 22, 3],
  ['Mixed vegetable sabzi', 'सब्ज़ी', '1 katori (100 g)', 90, 2.5, 9, 5], ['Paneer', 'पनीर', '100 g', 265, 18, 1.2, 20], ['Boiled egg', 'उबला अंडा', '1 large', 78, 6.3, 0.6, 5.3],
  ['Chicken breast, cooked', 'चिकन ब्रेस्ट', '100 g', 165, 31, 0, 3.6], ['Chicken curry', 'चिकन करी', '1 katori (150 g)', 240, 20, 6, 15], ['Milk', 'दूध', '1 glass (250 ml)', 160, 8, 12, 9],
  ['Curd', 'दही', '1 katori (100 g)', 60, 3.5, 4.7, 3.3], ['Banana', 'केला', '1 medium', 105, 1.3, 27, 0.4], ['Apple', 'सेब', '1 medium', 95, 0.5, 25, 0.3],
  ['Oats, cooked', 'ओट्स', '1 bowl (200 g)', 150, 5, 27, 3], ['Poha', 'पोहा', '1 plate (150 g)', 250, 5, 45, 6], ['Idli', 'इडली', '1 piece', 58, 2, 12, 0.4],
  ['Whey protein', 'व्हे प्रोटीन', '1 scoop (30 g)', 120, 24, 3, 1.5], ['Peanuts', 'मूँगफली', '30 g', 170, 7.7, 5, 14], ['Almonds', 'बादाम', '10 nuts', 70, 2.5, 2.6, 6], ['Samosa', 'समोसा', '1 piece', 260, 4, 28, 15],
];
const wlSince = (n) => addDays(todayISO(), -n);
const wlLoad = (memberId, days = 14) => Promise.all([
  DB.select('member_water', { eq: { member_id: memberId }, filters: { drunk_on: 'gte.' + wlSince(days) }, order: 'drunk_on.desc,created_at.desc', limit: 1000 }),
  DB.select('member_meals', { eq: { member_id: memberId }, filters: { eaten_on: 'gte.' + wlSince(days) }, order: 'eaten_on.desc,created_at.desc', limit: 1000 }),
  DB.select('member_sleep', { eq: { member_id: memberId }, filters: { slept_on: 'gte.' + wlSince(days) }, order: 'slept_on.desc', limit: 100 }),
]).then(([water, meals, sleep]) => ({ water, meals, sleep }));

/* pure helpers */
const waterOn = (rows, day) => rows.filter((r) => r.drunk_on === day).reduce((s, r) => s + Number(r.amount_ml), 0);
function mealTotals(rows, day) {
  const t = { kcal: 0, p: 0, c: 0, f: 0, n: 0 };
  rows.filter((r) => r.eaten_on === day).forEach((r) => { t.kcal += Number(r.kcal); t.p += Number(r.protein_g); t.c += Number(r.carbs_g); t.f += Number(r.fat_g); t.n++; });
  ['p', 'c', 'f'].forEach((k) => { t[k] = Math.round(t[k] * 10) / 10; }); return t;
}
/* average hours over nights that were logged in the last n days (null when none) */
function sleepAverage(rows, today, n) {
  const from = addDays(today, -(n - 1)), xs = rows.filter((r) => r.slept_on >= from && r.slept_on <= today);
  return xs.length ? Math.round((xs.reduce((s, r) => s + Number(r.hours), 0) / xs.length) * 10) / 10 : null;
}
const defaultMeal = () => { const h = istParts(new Date().toISOString()).hour; return h < 11 ? 'Breakfast' : h < 16 ? 'Lunch' : h < 19 ? 'Snack' : 'Dinner'; };

function addWater(memberId, ml) {
  return act(() => DB.insert('member_water', { gym_id: gymId(), member_id: memberId, drunk_on: todayISO(), amount_ml: ml }), L(`${ml} ml added`, `${ml} मिली जुड़ा`));
}
function mealForm(memberId, food, after) {
  openForm({
    title: food ? L(food[0], food[1]) : L('Add food', 'खाना जोड़ें'), submitLabel: L('Save', 'सेव करें'),
    values: food ? { food: L(food[0], food[1]), qty: 1, kcal: food[3], protein_g: food[4], carbs_g: food[5], fat_g: food[6], meal: defaultMeal() } : { qty: 1, meal: defaultMeal() },
    fields: [
      { k: 'meal', label: L('Meal', 'भोजन'), type: 'select', options: MEALS.map((m) => ({ v: m, l: L(m, MEAL_HI[m]) })) },
      { k: 'qty', label: L('Servings', 'कितने'), type: 'number', min: 0.5, step: '0.5', check: (v) => (v !== '' && (v < 0.5 || v > 20) ? L('0.5 to 20', '0.5 से 20') : '') },
      { k: 'food', label: L('Food', 'खाना'), req: true, full: true, check: (v) => (v.trim().length < 1 || v.length > 70 ? L('1 to 70 characters', '1 से 70 अक्षर') : '') },
      { k: 'kcal', label: L('Calories per serving', 'कैलोरी (एक सर्विंग)'), type: 'number', req: true, min: 0, check: (v) => (v < 0 || v > 3000 ? L('0 to 3000', '0 से 3000') : '') },
      { k: 'protein_g', label: L('Protein g', 'प्रोटीन ग्राम'), type: 'number', min: 0, check: (v) => (v !== '' && (v < 0 || v > 300) ? L('0 to 300', '0 से 300') : '') },
      { k: 'carbs_g', label: L('Carbs g', 'कार्ब्स ग्राम'), type: 'number', min: 0, check: (v) => (v !== '' && (v < 0 || v > 500) ? L('0 to 500', '0 से 500') : '') },
      { k: 'fat_g', label: L('Fat g', 'फ़ैट ग्राम'), type: 'number', min: 0, check: (v) => (v !== '' && (v < 0 || v > 300) ? L('0 to 300', '0 से 300') : '') },
    ],
    extra: `<p class="muted" style="margin:10px 0 0">${esc(L('Values are typical and approximate. Edit them if you know better.', 'ये आम तौर पर औसत मान हैं। बेहतर पता हो तो बदल दें।'))}</p>`,
    onSubmit: async (v) => {
      const q = v.qty === '' || v.qty == null ? 1 : Number(v.qty), n = (x) => (x === '' || x == null ? 0 : Number(x)), r1 = (x) => Math.round(x * 10) / 10;
      const row = { gym_id: gymId(), member_id: memberId, eaten_on: todayISO(), meal: v.meal, food: (q !== 1 ? `${q}× ` : '') + v.food.trim(), kcal: Math.round(n(v.kcal) * q), protein_g: r1(n(v.protein_g) * q), carbs_g: r1(n(v.carbs_g) * q), fat_g: r1(n(v.fat_g) * q) };
      const ok = await act(() => DB.insert('member_meals', row), L('Saved', 'सेव हुआ')); if (ok) await after(); return !!ok;
    },
  });
}
function sleepForm(memberId, after) {
  openForm({
    title: L('Log last night\'s sleep', 'कल रात की नींद दर्ज करें'), submitLabel: L('Save', 'सेव करें'),
    fields: [
      { k: 'slept_on', label: L('Night of', 'किस रात की'), type: 'date', def: addDays(todayISO(), -1), check: (v) => (v && v > todayISO() ? L('Cannot be in the future', 'आगे की तारीख़ नहीं') : '') },
      { k: 'hours', label: L('Hours slept', 'कितने घंटे सोए'), type: 'number', req: true, min: 0.5, step: '0.5', check: (v) => (v < 0.5 || v > 16 ? L('0.5 to 16 hours', '0.5 से 16 घंटे') : '') },
      { k: 'quality', label: L('How did you feel', 'कैसा महसूस हुआ'), type: 'select', full: true, options: [{ v: '', l: '—' }, ...[1, 2, 3, 4, 5].map((n) => ({ v: String(n), l: `${n} / 5` }))] },
    ],
    onSubmit: async (v) => {
      const row = { gym_id: gymId(), member_id: memberId, slept_on: v.slept_on || addDays(todayISO(), -1), hours: Number(v.hours), quality: v.quality ? Number(v.quality) : null };
      const ok = await act(() => DB.insert('member_sleep', row), L('Saved', 'सेव हुआ'));
      if (ok) await after(); return !!ok;
    },
  });
}
async function deleteHabit(table, id) {
  if (!(await askConfirm(L('Delete this entry?', 'यह एंट्री हटाएँ?'), L('Delete', 'हटाएँ'), 'bad'))) return;
  const ok = await act(() => DB.remove(table, id), L('Deleted', 'हटा दिया')); if (ok) render();
}

function habitsBody(d, own, memberId) {
  const t = todayISO(), ml = waterOn(d.water, t), tot = mealTotals(d.meals, t), pct = Math.min(100, Math.round((ml / WATER_GOAL_ML) * 100));
  const bar = (p, col) => `<div style="height:8px;border-radius:8px;background:var(--line);overflow:hidden;margin:8px 0"><div style="height:100%;width:${p}%;background:${col}"></div></div>`;
  const water = card(L('Water today', 'आज का पानी'), 'pulse', '', `<div style="display:flex;justify-content:space-between;align-items:baseline"><b style="font-size:22px">${esc((ml / 1000).toFixed(2).replace(/\.?0+$/, ''))} L</b><span class="muted">${esc(L(`goal ${WATER_GOAL_ML / 1000} L`, `लक्ष्य ${WATER_GOAL_ML / 1000} लीटर`))}</span></div>${bar(pct, 'var(--crimson)')}`
    + (own ? `<div style="display:flex;gap:8px;flex-wrap:wrap">${[250, 500, 750].map((n) => `<button class="btn sm" data-act="waterAdd" data-id="${esc(memberId)}" data-ml="${n}">+${n} ml</button>`).join('')}</div>` : '')
    + (d.water.filter((r) => r.drunk_on === t).length ? `<ul class="list" style="margin-top:8px">${d.water.filter((r) => r.drunk_on === t).slice(0, 8).map((r) => `<li><div class="grow"><b>${esc(String(r.amount_ml))} ml</b><small>${esc(fmtTime(r.created_at))}</small></div>${own ? `<button class="btn sm" data-act="delHabit" data-t="member_water" data-id="${esc(r.id)}">${esc(L('Delete', 'हटाएँ'))}</button>` : ''}</li>`).join('')}</ul>` : '')
    + `<p class="muted" style="margin:8px 0 0;font-size:12px">${esc(L('A general guide, not medical advice. Your need depends on weather and training.', 'यह सामान्य मार्गदर्शन है, चिकित्सा सलाह नहीं। ज़रूरत मौसम और ट्रेनिंग पर निर्भर है।'))}</p>`);
  const mealRows = MEALS.map((m) => { const rs = d.meals.filter((r) => r.eaten_on === t && r.meal === m); return rs.length ? `<div style="margin-bottom:10px"><div class="muted" style="font-size:12px">${esc(L(m, MEAL_HI[m]))}</div><ul class="list">${rs.map((r) => `<li><div class="grow"><b>${esc(r.food)}</b><small>${esc(`${r.kcal} kcal · P ${num1(r.protein_g)} · C ${num1(r.carbs_g)} · F ${num1(r.fat_g)}`)}</small></div>${own ? `<button class="btn sm" data-act="delHabit" data-t="member_meals" data-id="${esc(r.id)}">${esc(L('Delete', 'हटाएँ'))}</button>` : ''}</li>`).join('')}</ul></div>` : ''; }).join('');
  const food = card(L('Food today', 'आज का खाना'), 'list', '', `<div class="tiles" style="margin-bottom:10px">${tile(L('Calories', 'कैलोरी'), esc(String(tot.kcal)), 'kcal')}${tile(L('Protein', 'प्रोटीन'), esc(num1(tot.p) + ' g'), '')}${tile(L('Carbs', 'कार्ब्स'), esc(num1(tot.c) + ' g'), '')}${tile(L('Fat', 'फ़ैट'), esc(num1(tot.f) + ' g'), '')}</div>`
    + (own ? `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">${FOODS.map((f, i) => `<button class="btn sm" data-act="quickFood" data-id="${esc(memberId)}" data-i="${i}" title="${esc(f[2])}">${esc(L(f[0], f[1]))}</button>`).join('')}<button class="btn sm pri" data-act="customFood" data-id="${esc(memberId)}">${ic('plus')} ${esc(L('Other food', 'दूसरा खाना'))}</button></div>` : '')
    + (mealRows || `<p class="muted" style="margin:0">${esc(L('Nothing logged today.', 'आज कुछ दर्ज नहीं।'))}</p>`) + `<p class="muted" style="margin:8px 0 0;font-size:12px">${esc(L('Typical values per serving, approximate.', 'हर सर्विंग के औसत मान, अनुमानित।'))}</p>`);
  const avg = sleepAverage(d.sleep, t, 7), nights = [...Array(7)].map((_, i) => addDays(t, -(6 - i))), byDay = new Map(d.sleep.map((r) => [r.slept_on, r]));
  const sleep = card(L('Sleep', 'नींद'), 'moon', own ? `<button class="btn sm" data-act="logSleep" data-id="${esc(memberId)}">${ic('plus')} ${esc(L('Log', 'दर्ज करें'))}</button>` : '', `<p style="margin:0 0 8px"><b>${avg == null ? '—' : esc(num1(avg) + ' h')}</b> <span class="muted">${esc(L('average of the nights you logged, last 7 days', 'पिछले 7 दिन में दर्ज रातों का औसत'))}</span></p>`
    + `<div style="display:flex;gap:6px;align-items:flex-end;height:90px">${nights.map((n) => { const r = byDay.get(n), h = r ? Number(r.hours) : 0; return `<div style="flex:1;text-align:center"><div title="${esc(fmtDate(n))}" style="height:${Math.round((h / 12) * 70)}px;min-height:${h ? 3 : 0}px;background:${h >= 7 ? 'var(--ok)' : 'var(--crimson)'};border-radius:4px"></div><small class="muted">${r ? esc(num1(h)) : '·'}</small></div>`; }).join('')}</div>`
    + (d.sleep.length ? `<ul class="list" style="margin-top:8px">${d.sleep.slice(0, 5).map((r) => `<li><div class="grow"><b>${esc(fmtDate(r.slept_on))}</b><small>${esc(num1(r.hours) + ' h')}${r.quality ? ' · ' + esc(`${r.quality}/5`) : ''}</small></div>${own ? `<button class="btn sm" data-act="delHabit" data-t="member_sleep" data-id="${esc(r.id)}">${esc(L('Delete', 'हटाएँ'))}</button>` : ''}</li>`).join('')}</ul>` : '')
    + `<p class="muted" style="margin:8px 0 0;font-size:12px">${esc(L('Most adults feel best with 7 to 9 hours. A general guide, not medical advice.', 'ज़्यादातर वयस्कों को 7 से 9 घंटे ठीक रहते हैं। सामान्य मार्गदर्शन, चिकित्सा सलाह नहीं।'))}</p>`);
  return `<div class="grid2">${water}${sleep}</div><div style="height:14px"></div>${food}`;
}
async function vMyHabits() {
  const m = (await Q.members())[0]; if (!m) return noMember();
  return pageHead(gymName(), L('Daily habits', 'रोज़ की आदतें'), L('Water, food and sleep in one place.', 'पानी, खाना और नींद एक जगह।')) + habitsBody(await wlLoad(m.id), true, m.id);
}
async function habitsModal(memberId) {
  const m = (await Q.members()).find((x) => x.id === memberId); if (!m) return;
  const d = await wlLoad(memberId); closeAllModals(); openModal({ title: L(`${m.name}: daily habits`, `${m.name}: रोज़ की आदतें`), wide: true, body: habitsBody(d, false, memberId) });
}
/* ================= Gym leaderboard: opt-in only. Shows first name, last initial and training days this month ================= */
async function leaderboardCard(m) {
  if (!m.leaderboard_opt_in) {
    return card(L('Gym leaderboard', 'जिम लीडरबोर्ड'), 'crown', '', `<p style="margin:0 0 10px">${esc(L('See who trained the most days this month. If you join, other members of the gym see your first name, last initial and training days. Nothing else. You can leave any time.', 'देखें कि इस महीने किसने सबसे ज़्यादा दिन ट्रेनिंग की। जुड़ने पर जिम के बाकी सदस्य आपका पहला नाम, उपनाम का पहला अक्षर और ट्रेनिंग के दिन देखेंगे। और कुछ नहीं। आप कभी भी निकल सकते हैं।'))}</p><button class="btn pri" data-act="lbJoin">${esc(L('Join the leaderboard', 'लीडरबोर्ड में जुड़ें'))}</button>`);
  }
  let rows = []; try { rows = await DB.rpc('gym_leaderboard'); } catch (e) { rows = null; }
  const body = rows === null ? `<p class="muted" style="margin:0">${esc(L('The leaderboard is not available right now.', 'लीडरबोर्ड अभी उपलब्ध नहीं है।'))}</p>`
    : rows.length ? `<ul class="list">${rows.map((r) => `<li${r.is_me ? ' style="background:var(--ok-soft);border-radius:8px"' : ''}><b style="min-width:28px">#${esc(String(r.rank))}</b><div class="grow"><b>${esc(r.display_name)}</b>${r.is_me ? ` ${badge(L('You', 'आप'), 'ok')}` : ''}</div><span>${esc(L(`${r.days} days`, `${r.days} दिन`))}</span></li>`).join('')}</ul>`
      : `<p class="muted" style="margin:0">${esc(L('No check-ins this month yet. Be the first.', 'इस महीने अभी कोई चेक-इन नहीं। पहले आप बनें।'))}</p>`;
  return card(L('Gym leaderboard', 'जिम लीडरबोर्ड'), 'crown', `<button class="btn sm" data-act="lbLeave">${esc(L('Leave', 'निकलें'))}</button>`, body + `<p class="muted" style="margin:8px 0 0;font-size:12px">${esc(L('Training days this month, counted from check-ins. Only members who joined are listed.', 'इस महीने के ट्रेनिंग दिन, चेक-इन से गिने गए। सिर्फ़ जुड़े हुए सदस्य दिखते हैं।'))}</p>`);
}
async function setLeaderboard(on) {
  if (on && !(await askConfirm(L('Show your first name, last initial and training days to other members?', 'अपना पहला नाम, उपनाम का पहला अक्षर और ट्रेनिंग के दिन बाकी सदस्यों को दिखाएँ?'), L('Join', 'जुड़ें'), 'primary'))) return;
  const ok = await act(() => DB.rpc('set_my_leaderboard', { opt: on }), on ? L('You are on the leaderboard', 'आप लीडरबोर्ड में हैं') : L('You left the leaderboard', 'आप लीडरबोर्ड से निकल गए'));
  if (ok) { bust('members'); render(); }
}
/* ================= Boot: auth gate, role routing, events ================= */
const NAV_GROUPS = { overview: ['Overview', 'अवलोकन'], people: ['People', 'लोग'], money: ['Money', 'पैसा'], business: ['Business', 'व्यापार'], insights: ['Insights', 'जानकारी'], setup: ['Setup', 'सेटअप'], platform: ['Platform', 'प्लेटफ़ॉर्म'], me: ['My gym', 'मेरा जिम'] };
/* entry: [route, icon, English, Hindi, view, group, shownInPhoneBar] */
const NAV = {
  super_admin: [['overview', 'home', 'Overview', 'ओवरव्यू', vSuperHome, 'platform', 1], ['gyms', 'building', 'Gyms', 'जिम', vSuperGyms, 'platform', 1], ['users', 'users', 'Users', 'यूज़र', vSuperUsers, 'platform', 1], ['audit', 'list', 'Audit log', 'ऑडिट लॉग', vSuperAudit, 'platform', 1], ['status', 'pulse', 'Status', 'स्थिति', vSuperStatus, 'platform', 1]],
  gym_admin: [
    ['dashboard', 'home', 'Dashboard', 'डैशबोर्ड', vDashboard, 'overview', 1],
    ['members', 'users', 'Members', 'सदस्य', vMembers, 'people', 1], ['checkin', 'door', 'Check-in', 'चेक-इन', vCheckin, 'people', 1], ['leads', 'users', 'Leads', 'लीड्स', vLeads, 'people'], ['reminders', 'clock', 'Reminders', 'रिमाइंडर', vReminders, 'people'], ['whatsapp', 'msg', 'WhatsApp', 'WhatsApp', vWhatsApp, 'people'],
    ['invoices', 'receipt', 'Invoices', 'इनवॉइस', vInvoices, 'money'], ['payments', 'wallet', 'Payments', 'भुगतान', vPayments, 'money', 1], ['expenses', 'wallet', 'Expenses & profit', 'खर्च और मुनाफ़ा', vExpenses, 'money'], ['staff', 'users', 'Staff & salary', 'स्टाफ़ और वेतन', vStaff, 'money'], ['ledger', 'shield', 'Secure ledger', 'सुरक्षित लेजर', vLedger, 'money'],
    ['store', 'tag', 'Store', 'स्टोर', vStore, 'business'], ['classes', 'clock', 'Classes', 'क्लास', vClasses, 'business'], ['tasks', 'check', 'Tasks', 'काम', vTasks, 'business'], ['equipment', 'gear', 'Equipment', 'उपकरण', vEquipment, 'business'], ['plans', 'tag', 'Plans', 'प्लान', vPlans, 'business'], ['offers', 'crown', 'Offers', 'ऑफ़र', vOffers, 'business'],
    ['retention', 'pulse', 'At risk', 'जोखिम', vRetention, 'insights'], ['peak', 'chart', 'Peak hours', 'भीड़ के समय', vPeak, 'insights'],
    ['settings', 'gear', 'Settings', 'सेटिंग', vSettings, 'setup'],
  ],
  trainer: [['dashboard', 'home', 'Dashboard', 'डैशबोर्ड', vDashboard, 'overview', 1], ['members', 'users', 'Members', 'सदस्य', vMembers, 'people', 1], ['checkin', 'door', 'Check-in', 'चेक-इन', vCheckin, 'people', 1], ['leads', 'users', 'Leads', 'लीड्स', vLeads, 'people'], ['reminders', 'clock', 'Reminders', 'रिमाइंडर', vReminders, 'people'], ['classes', 'clock', 'Classes', 'क्लास', vClasses, 'business'], ['tasks', 'check', 'Tasks', 'काम', vTasks, 'business'], ['equipment', 'gear', 'Equipment', 'उपकरण', vEquipment, 'business'], ['store', 'tag', 'Store', 'स्टोर', vStore, 'business', 1]],
  member: [['mine', 'home', 'Home', 'होम', vMine, 'me', 1], ['plan', 'pulse', 'My plan', 'मेरा प्लान', vMyPlan, 'me', 1], ['pay', 'wallet', 'Payments', 'भुगतान', vMyPay, 'me', 1], ['visits', 'clock', 'Visits', 'विज़िट', vMyVisits, 'me', 1], ['book', 'clock', 'Book a class', 'क्लास बुक करें', vBookClass, 'me', 0], ['train', 'list', 'Workout log', 'वर्कआउट लॉग', vMyWorkouts, 'me', 0], ['habits', 'moon', 'Daily habits', 'रोज़ की आदतें', vMyHabits, 'me', 0], ['progress', 'pulse', 'My progress', 'मेरी प्रगति', vMyProgress, 'me', 0], ['me', 'users', 'Profile', 'प्रोफ़ाइल', vMyProfile, 'me', 1]],
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
  const more = items.length > 5 && items.some((i) => !i[6]), multi = new Set(items.map((i) => i[5])).size > 1; let lastG = '';
  $('#nav').className = 'nav' + (more ? ' has-more' : '');
  $('#nav').innerHTML = items.map((i) => { const head = multi && i[5] && i[5] !== lastG ? `<div class="grp">${esc(L(...(NAV_GROUPS[i[5]] || ['', ''])))}</div>` : ''; lastG = i[5]; return `${head}<a href="#${i[0]}" ${i[6] || !more ? 'data-pri="1" ' : ''}${cur && cur[0] === i[0] ? 'aria-current="page"' : ''}>${ic(i[1])}<span>${esc(L(i[2], i[3]))}</span></a>`; }).join('')
    + (more ? `<button type="button" class="more" data-act="moreNav" aria-label="${esc(L('All pages', 'सभी पेज'))}">${ic('list')}<span>${esc(L('More', 'और'))}</span></button>` : '');
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
  view.innerHTML = lockBanner() + html; refreshBadge(); if ($('#daySum')) loadDaySummary();
  if (focusId) { const el = document.getElementById(focusId); if (el) { el.focus(); try { el.setSelectionRange(caret, caret); } catch (e) {} } }
}
async function enter() {
  try { await loadContext(); } catch (e) { if (e && e.status === 401) return; showGate(`<div class="login"><section class="card"><h1>${esc(L('Could not connect', 'कनेक्ट नहीं हो सका'))}</h1><p>${esc(friendlyError(e))}</p><button class="btn" data-act="retry">${esc(L('Try again', 'फिर कोशिश करें'))}</button> <button class="btn" data-act="signOut">${esc(L('Sign out', 'लॉग आउट'))}</button></section></div>`); return; }
  const p = CTX.profile;
  if (!p || (p.role !== 'super_admin' && !p.gym_id)) { waitingScreen(); return; }
  if (!navFor().length) { waitingScreen(); return; }
  $('#view').dataset.ready = ''; render(); pwaAfterLogin();
}
function onSignedOut() { bust(); CTX.profile = null; CTX.gym = null; CTX.locked = false; RENDER_TOKEN++; loginScreen(L('Please sign in again.', 'कृपया दोबारा लॉगिन करें।')); }

/* ---------- actions ---------- */
const CHIP = { eqF: (v) => { U.eq.f = v; }, tkF: (v) => { U.tk.f = v; }, clsF: (v) => { U.cls.f = v; }, memT: (v) => { U.members.t = v; U.members.page = 1; }, memF: (v) => { U.members.f = v; U.members.page = 1; }, invF: (v) => { U.invoices.f = v; U.invoices.page = 1; }, peakD: (v) => { U.peak.days = v; }, expM: (v) => { U.exp.m = v; }, payM: (v) => { U.pay.m = v; }, sgF: (v) => { U.sg.f = v; }, suF: (v) => { U.su.f = v; }, leadF: (v) => { U.lead.f = v; } };
const BIND = { mq: (v) => { U.members.q = v; U.members.page = 1; }, sgq: (v) => { U.sg.q = v; }, suq: (v) => { U.su.q = v; }, cq: (v) => { U.checkin.q = v; }, iq: (v) => { U.invoices.q = v; U.invoices.page = 1; }, pq: (v) => { U.payments.q = v; U.payments.page = 1; }, rdays: (v) => { const n = Math.min(14, Math.max(1, parseInt(v, 10) || 2)); U_REMIND.days = n; try { localStorage.setItem('gymos-remind-days', String(n)); } catch (e) {} }, thr: (v) => { const n = Math.min(30, Math.max(1, parseInt(v, 10) || 4)); U.retention.thr = n; try { localStorage.setItem('gymos-thr', String(n)); } catch (e) {} } };
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
  newEq: () => equipmentForm(), editEq: (d) => equipmentForm(d.id), eqServiced: (d) => eqServiced(d.id), delEq: (d) => deleteEquipment(d.id),
  newTrainer: () => accountForm('trainer'), openMyPlan: (d) => { const r = (window.__minePlans || [])[Number(d.i)]; if (r) planViewModal(r, null, false); }, moreNav: () => openMoreSheet(), installApp: () => installApp(), installLater: () => installLater(), applyUpdate: () => applyUpdate(), booksCsv: () => exportBooks(), newTask: () => taskForm(), editTask: (d) => taskForm(d.id), toggleTask: (d) => toggleTask(d.id), delTask: (d) => deleteTask(d.id), openScan: () => openScanner(), newClass: () => classForm(), editClass: (d) => classForm(d.id), cancelClass: (d) => cancelClass(d.id), clsBookings: (d) => classBookings(d.id), clsBook: (d) => bookClass(d.id), clsCancel: (d) => cancelMyBooking(d.id), setCommission: (d) => commissionForm(d.id), addProgress: (d) => progressForm(d.id, d.by === '1', d.by === '1' ? null : () => progressModal(d.id)), delProgress: (d) => deleteProgress(d.id, d.m), lbJoin: () => setLeaderboard(true), lbLeave: () => setLeaderboard(false), waterAdd: (d) => addWater(d.id, Number(d.ml)).then((ok) => ok && render()), delHabit: (d) => deleteHabit(d.t, d.id), quickFood: (d) => mealForm(d.id, FOODS[Number(d.i)], () => render()), customFood: (d) => mealForm(d.id, null, () => render()), logSleep: (d) => sleepForm(d.id, () => render()), addWorkout: (d) => Q.members().then(() => wkOf(d.id)).then((rows) => workoutForm(d.id, rows)), delWorkout: (d) => deleteWorkout(d.id), newStaff: () => staffForm(), editStaff: (d) => staffForm(d.id), payStaff: (d) => salaryForm(d.id), staffHist: (d) => staffHistory(d.id), delStaff: (d) => deleteStaff(d.id), delSalPay: (d) => deleteSalaryPay(d.id), newExpense: () => expenseForm(), newProduct: () => productForm(), editProduct: (d) => productForm(d.id), sellProduct: (d) => sellForm(d.id), voidSale: (d) => voidSale(d.id), delProduct: (d) => deleteProduct(d.id), delExpense: (d) => deleteExpense(d.id), newLead: () => leadForm(), editLead: (d) => leadForm(d.id), leadNext: (d) => Q.leads().then((ls) => { const l = ls.find((x) => x.id === d.id); const n = l && nextStage(l.stage); if (n) leadSetStage(l.id, n, L('Moved to ' + stageLabel(n), stageLabel(n) + ' में किया')); }), leadLost: (d) => leadSetStage(d.id, 'Lost', L('Marked lost', 'छूटा हुआ चिह्नित')), leadConvert: (d) => leadConvert(d.id), delLead: (d) => deleteLead(d.id), waSettings: () => waSettingsForm(), waTest: () => waTestForm(), copyTpl: (d) => copyWaTemplate(d.k),
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
  pwaInit(); nativeInit();
})();
