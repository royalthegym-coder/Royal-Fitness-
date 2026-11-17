import { createClient } from 'npm:@supabase/supabase-js@2';
import { verifyWebhook, parseEvent, linkPayload, routeNetPaise, transferPayload, transferState, failureKind, MIN_TRANSFER_PAISE } from './lib.js';

// Online fee payment through Razorpay Payment Links. Card/UPI details never touch this app: the member pays on Razorpay's own page.
//  - POST {action:'status'}                 -> { configured, enabled }   (signed-in user)
//  - POST {action:'create', invoice_id, part?} -> { url }               (signed-in member of that invoice, or the gym owner)
//      part: true pays only the next EMI installment (rz_begin_part); otherwise the full balance (rz_begin)
//  - POST {action:'route_retry', order_id, force?} -> { ok, result }  (super admin only) sends one recorded payment to the gym again.
//  - POST with X-Razorpay-Signature         -> Razorpay webhook: verified by HMAC, then recorded ONCE by rz_apply_payment.
//      Route: once recorded, the money (captured − Razorpay fee − GST on it) goes to the gym's linked account (gyms.rz_account_id)
//      when one is set. Without one it stays in the platform account. A routing failure never fails the webhook: it is stored on the order.
// The amount is taken from the database (what is due right now), never from the browser.
// Environment values (set in the Supabase dashboard, never in chat): RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET.

const URL_ = Deno.env.get('SUPABASE_URL')!;
const ANON = Deno.env.get('SUPABASE_ANON_KEY')!;
const SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const KEY_ID = Deno.env.get('RAZORPAY_KEY_ID') || '';
const KEY_SECRET = Deno.env.get('RAZORPAY_KEY_SECRET') || '';
const HOOK_SECRET = Deno.env.get('RAZORPAY_WEBHOOK_SECRET') || '';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const configured = () => !!(KEY_ID && KEY_SECRET && HOOK_SECRET);
const admin = () => createClient(URL_, SERVICE, { auth: { persistSession: false, autoRefreshToken: false } });

const TRANSFER_OK = ['created', 'pending', 'processed'];

async function rzApi(method: string, path: string, body?: unknown): Promise<{ ok: boolean; status: number; body: any; text: string }> {
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 15000);
  try {
    const r = await fetch('https://api.razorpay.com' + path, {
      method, signal: ctl.signal,
      headers: { Authorization: 'Basic ' + btoa(`${KEY_ID}:${KEY_SECRET}`), 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await r.text();
    let j: any = {}; try { j = JSON.parse(text); } catch { /* not JSON */ }
    return { ok: r.ok, status: r.status, body: j, text };
  } finally { clearTimeout(t); }
}

// Lets background work finish after the webhook has answered (EdgeRuntime exists on Supabase Edge Functions; elsewhere we simply wait).
async function later(p: Promise<unknown>) {
  const rt = (globalThis as any).EdgeRuntime;
  if (rt && typeof rt.waitUntil === 'function') rt.waitUntil(p); else await p;
}

/** Sends one recorded payment's money to the gym's linked account. Never throws: the outcome is stored on the order. Returns the outcome. */
async function routePayment(db: any, paymentId: string): Promise<string> {
  // The claim is the only guard against two transfers for one payment: Razorpay's transfer API has no idempotency key.
  const { data: c, error: ce } = await db.rpc('rz_route_claim', { p_payment: paymentId });
  if (ce) { console.error('rz_route_claim', ce.message); return 'claim_failed'; }
  if (!c || !c.claimed) return String(c?.reason || 'not_claimed');
  const orderId = String(c.order_id);
  const record = (status: string, transfer: string | null, amount: number | null, error: string | null) =>
    db.rpc('rz_route_result', { p_order: orderId, p_status: status, p_transfer: transfer, p_amount: amount, p_error: error });

  // 1. What Razorpay captured and kept. If this cannot be read, nothing was sent, so a retry is safe.
  let pay: any = null;
  try { const r = await rzApi('GET', `/v1/payments/${encodeURIComponent(paymentId)}`); if (r.ok) pay = r.body; else console.error('payment lookup', r.status); }
  catch (e) { console.error('payment lookup', String(e)); }
  const net = pay ? routeNetPaise({ captured: pay.amount, fee: pay.fee, tax: pay.tax }) : null;
  if (net === null) { await record('failed', null, null, 'could not read the fee from Razorpay'); return 'failed'; }
  if (net < MIN_TRANSFER_PAISE) { await record('failed', null, null, 'nothing left for the gym after Razorpay fees'); return 'failed'; }

  // 2. One transfer.
  let body: any;
  try { body = transferPayload({ account: c.account, netPaise: net, orderId }); }
  catch (e) { await record('failed', null, null, String((e as Error).message)); return 'failed'; }
  let res: { ok: boolean; status: number; body: any; text: string };
  try { res = await rzApi('POST', `/v1/payments/${encodeURIComponent(paymentId)}/transfers`, body); }
  catch (e) {
    // The request may have reached Razorpay before the connection broke, so the outcome is unknown and the order stays 'routing'.
    console.error('transfer', String(e));
    await record('routing', null, null, 'unknown outcome: ' + String(e).slice(0, 200));
    return 'routing';
  }
  if (!res.ok) {
    const kind = failureKind(res.status);
    await record(kind, null, null, `Razorpay ${res.status}: ` + String(res.body?.error?.description || res.text || '').slice(0, 250));
    return kind;
  }
  const item = res.body?.items?.[0];
  if (!item?.id) { await record('routing', null, null, 'unexpected reply from Razorpay: no transfer id'); return 'routing'; }
  const state = transferState(item.status);
  await record(state, String(item.id), net / 100, null);
  return state;
}

async function webhook(req: Request, sig: string) {
  const raw = await req.text();
  if (!(await verifyWebhook(raw, sig, HOOK_SECRET))) return json({ error: 'bad_signature' }, 401);
  const ev = parseEvent(raw);
  if (!ev) return json({ ok: true, ignored: true });
  const db = admin();
  if (ev.kind === 'closed') {
    const { error } = await db.rpc('rz_close', { p_link: ev.linkId });
    return error ? json({ error: 'retry' }, 500) : json({ ok: true });
  }
  const { data, error } = await db.rpc('rz_apply_payment', { p_link: ev.linkId, p_payment: ev.paymentId, p_paise: ev.paise, p_method: ev.method });
  if (error) { console.error('rz_apply_payment', error.message); return json({ error: 'retry' }, 500); } // Razorpay retries on non-2xx
  const result = data && data.result;
  console.log('payment', ev.paymentId, result);
  if (result === 'recorded') await later(routePayment(db, ev.paymentId).then((r) => console.log('route', ev.paymentId, r)).catch((e) => console.error('route', String(e))));
  return json({ ok: true, result });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);
  const sig = req.headers.get('x-razorpay-signature');
  if (sig) return await webhook(req, sig);

  const auth = req.headers.get('Authorization') || '';
  if (!auth) return json({ error: 'sign_in' }, 401);
  let body: any = {}; try { body = await req.json(); } catch { /* */ }
  const sb = createClient(URL_, ANON, { global: { headers: { Authorization: auth } }, auth: { persistSession: false, autoRefreshToken: false } });
  const { data: u } = await sb.auth.getUser(auth.replace(/^Bearer\s+/i, ''));
  if (!u?.user) return json({ error: 'sign_in' }, 401);

  if (body.action === 'status') {
    const { data } = await sb.rpc('rz_status');
    return json({ configured: configured(), enabled: data === true });
  }
  if (body.action === 'route_retry') {
    // The user's own session decides: route_retry_allow refuses anyone who is not a super admin (42501).
    if (!configured()) return json({ error: 'not_configured' }, 503);
    const orderId = String(body.order_id || '');
    if (!UUID.test(orderId)) return json({ error: 'bad_order' }, 400);
    const { data: pid, error: re } = await sb.rpc('route_retry_allow', { p_order: orderId, p_force: body.force === true });
    if (re) return json({ error: 'refused', message: re.message }, re.code === '42501' ? 403 : 409);
    const result = await routePayment(admin(), String(pid));
    return json({ ok: TRANSFER_OK.includes(result), result });
  }
  if (body.action !== 'create') return json({ error: 'bad_action' }, 400);
  if (!configured()) return json({ error: 'not_configured' }, 503);
  const invoiceId = String(body.invoice_id || '');
  if (!UUID.test(invoiceId)) return json({ error: 'bad_invoice' }, 400);

  const { data: b, error: be } = await sb.rpc(body.part === true ? 'rz_begin_part' : 'rz_begin', { p_invoice: invoiceId });
  if (be) return json({ error: 'failed' }, 500);
  if (b?.error) return json({ error: b.error }, b.error === 'not_found' ? 404 : 409);
  if (b?.reuse && b.url) return json({ url: b.url, amount: b.amount, reused: true });

  const { data: g } = await sb.from('gyms').select('name').eq('id', b.gym_id).maybeSingle();
  const payload = linkPayload({ orderId: b.order_id, amount: b.amount, invoiceNo: b.part ? `${b.invoice_no} EMI` : b.invoice_no, memberName: b.member_name, gymName: g?.name, nowSec: Date.now() / 1000 });
  const db = admin();
  let link: any = null;
  try {
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 15000);
    const r = await fetch('https://api.razorpay.com/v1/payment_links', {
      method: 'POST', signal: ctl.signal,
      headers: { Authorization: 'Basic ' + btoa(`${KEY_ID}:${KEY_SECRET}`), 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    clearTimeout(t);
    if (r.ok) link = await r.json(); else console.error('razorpay', r.status, (await r.text()).slice(0, 300));
  } catch (e) { console.error('razorpay fetch', String(e)); }
  if (!link?.id || !link?.short_url) {
    await db.rpc('rz_attach', { p_order: b.order_id, p_link: '', p_url: '' });
    return json({ error: 'gateway' }, 502);
  }
  const { error: ae } = await db.rpc('rz_attach', { p_order: b.order_id, p_link: link.id, p_url: link.short_url });
  if (ae) return json({ error: 'failed' }, 500);
  return json({ url: link.short_url, amount: b.amount });
});
