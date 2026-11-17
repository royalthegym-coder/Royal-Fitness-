import { createClient } from 'npm:@supabase/supabase-js@2';
import { verifyWebhook, parseEvent, linkPayload } from './lib.js';

// Online fee payment through Razorpay Payment Links. Card/UPI details never touch this app: the member pays on Razorpay's own page.
//  - POST {action:'status'}                 -> { configured, enabled }   (signed-in user)
//  - POST {action:'create', invoice_id, part?} -> { url }               (signed-in member of that invoice, or the gym owner)
//      part: true pays only the next EMI installment (rz_begin_part); otherwise the full balance (rz_begin)
//  - POST with X-Razorpay-Signature         -> Razorpay webhook: verified by HMAC, then recorded ONCE by rz_apply_payment.
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
  console.log('payment', ev.paymentId, data && data.result);
  return json({ ok: true, result: data && data.result });
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
