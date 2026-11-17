// Pure helpers for the razorpay Edge Function (no network). Tested in tests/razorpay.test.mjs.

const enc = new TextEncoder();
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');

/** HMAC-SHA256 of the raw request body, as lowercase hex. */
export async function hmacHex(key, raw) {
  const k = await crypto.subtle.importKey('raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', k, enc.encode(raw)));
}

/** Constant-time string compare. */
export function safeEqual(a, b) {
  const x = String(a), y = String(b);
  let d = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) d |= (x.charCodeAt(i) || 0) ^ (y.charCodeAt(i) || 0);
  return d === 0;
}

/** True only when the signature header matches HMAC(key, raw body). An empty key or header never verifies. */
export async function verifyWebhook(raw, signature, key) {
  if (!key || !signature || typeof raw !== 'string') return false;
  return safeEqual(await hmacHex(key, raw), String(signature).trim().toLowerCase());
}

/** rupees (two decimals) -> whole paise, without float drift. */
export const toPaise = (rupees) => Math.round(Number(rupees) * 100 + 1e-9);

/** Razorpay events we act on. Returns null for anything else (the caller answers 200 and ignores it). */
export function parseEvent(body) {
  let e = body;
  if (typeof e === 'string') { try { e = JSON.parse(e); } catch { return null; } }
  if (!e || typeof e !== 'object' || typeof e.event !== 'string') return null;
  const link = e.payload && e.payload.payment_link && e.payload.payment_link.entity;
  if (!link || typeof link.id !== 'string') return null;
  if (e.event === 'payment_link.paid') {
    const pay = e.payload.payment && e.payload.payment.entity;
    if (!pay || typeof pay.id !== 'string') return null;
    if (link.status !== 'paid' || pay.status !== 'captured') return null;
    const paise = Number(pay.amount);
    if (!Number.isInteger(paise) || paise <= 0) return null;
    return { kind: 'paid', linkId: link.id, paymentId: pay.id, paise, method: String(pay.method || '') };
  }
  if (e.event === 'payment_link.expired' || e.event === 'payment_link.cancelled') return { kind: 'closed', linkId: link.id };
  return null;
}

/** Body for POST /v1/payment_links. The amount is whatever the DATABASE said is due, never a number from the browser. */
export function linkPayload({ orderId, amount, invoiceNo, memberName, gymName, nowSec, ttlMin = 120 }) {
  const clean = (s, n) => String(s || '').replace(/[\r\n\t]+/g, ' ').trim().slice(0, n);
  return {
    amount: toPaise(amount), currency: 'INR', accept_partial: false,
    reference_id: String(orderId),
    description: clean(`${gymName || 'Gym'} fee ${invoiceNo || ''}`, 100),
    customer: memberName ? { name: clean(memberName, 50) } : undefined,
    notify: { sms: false, email: false }, reminder_enable: false,
    expire_by: Math.floor(nowSec) + ttlMin * 60,
    notes: { order_id: String(orderId) },
  };
}

/* ---- Route: sending a recorded payment to the gym's own linked account ---- */

/** Razorpay refuses a transfer under Rs 1. */
export const MIN_TRANSFER_PAISE = 100;

/** Transfer states we store: Razorpay's own words. */
export const ROUTE_STATES = ['created', 'pending', 'processed', 'failed', 'reversed', 'partially_reversed'];

/** An acc_ id is public (it identifies the gym's linked account). Keys and bank details never reach this code. */
export const isAccountId = (s) => typeof s === 'string' && /^acc_[A-Za-z0-9]{6,40}$/.test(s);

/**
 * What the gym is owed for one captured payment, in paise: captured − Razorpay's fee − the GST on that fee.
 * Returns null unless all three are whole, non-negative paise (a missing fee or tax is NOT treated as zero: that would overpay).
 * A result below MIN_TRANSFER_PAISE (including negative) means there is nothing to send.
 * Conservative on purpose: if Razorpay's fee already includes that GST, the gym is short by the GST on the fee, never over.
 */
export function routeNetPaise({ captured, fee, tax }) {
  const vals = [captured, fee, tax].map((x) => (x === undefined || x === null || x === '' ? NaN : Number(x)));
  if (!vals.every((n) => Number.isInteger(n) && n >= 0) || vals[0] <= 0) return null;
  return vals[0] - vals[1] - vals[2];
}

/** Body for POST /v1/payments/{id}/transfers. Throws before anything is sent when a value would be refused. */
export function transferPayload({ account, netPaise, orderId }) {
  if (!isAccountId(account)) throw new Error('bad_account');
  if (!Number.isInteger(netPaise) || netPaise < MIN_TRANSFER_PAISE) throw new Error('amount_too_small');
  return { transfers: [{ account, amount: netPaise, currency: 'INR', notes: { order_id: String(orderId) } }] };
}

/** A transfer state from Razorpay, kept to the states we store. Anything unexpected becomes 'pending' (check it in the dashboard). */
export const transferState = (s) => (ROUTE_STATES.includes(s) ? s : 'pending');

/**
 * What a failed Razorpay call means. A 4xx is a refusal: nothing was created, so a retry is safe ('failed').
 * A 5xx, a timeout or a broken connection (status 0) may have created a transfer: the outcome is unknown ('routing').
 */
export const failureKind = (httpStatus) => (httpStatus >= 400 && httpStatus < 500 ? 'failed' : 'routing');
