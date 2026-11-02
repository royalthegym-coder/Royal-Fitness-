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
