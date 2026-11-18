import { createClient } from 'npm:@supabase/supabase-js@2';

// Sends queued WhatsApp template messages (receipt / expiry / dues) through the Meta WhatsApp Cloud API.
// Auth: either the shared cron secret (pg_cron / database trigger) or a signed-in gym admin / super admin.
// verify_jwt is off because the pg_cron caller has no user JWT; every path authenticates itself below.

const URL_ = Deno.env.get('SUPABASE_URL')!;
const SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const TOKEN = Deno.env.get('WHATSAPP_TOKEN') || '';
const PHONE_ID = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID') || '';
const GRAPH = 'v21.0';
const MAX_AGE_MS = 3 * 24 * 3600 * 1000; // never send a message that is more than 3 days old

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });
const sb = createClient(URL_, SERVICE, { auth: { persistSession: false, autoRefreshToken: false } });

const clean = (v: unknown) => String(v ?? '').replace(/[\r\n\t]+/g, ' ').replace(/ {2,}/g, ' ').trim().slice(0, 500) || '-';

type Row = { id: number; gym_id: string; kind: string; to_phone: string; params: unknown[]; created_at: string; attempts: number };

async function sendOne(row: Row, tpl: Record<string, string>) {
  const name = row.kind === 'receipt' || row.kind === 'test' ? tpl.tpl_receipt : row.kind === 'expiry' ? tpl.tpl_expiry : tpl.tpl_dues;
  const body = {
    messaging_product: 'whatsapp',
    to: row.to_phone,
    type: 'template',
    template: {
      name,
      language: { code: tpl.tpl_lang || 'hi' },
      components: [{ type: 'body', parameters: (row.params || []).map((p) => ({ type: 'text', text: clean(p) })) }],
    },
  };
  const r = await fetch(`https://graph.facebook.com/${GRAPH}/${PHONE_ID}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const j = await r.json().catch(() => ({}));
  return { ok: r.ok, status: r.status, id: j?.messages?.[0]?.id as string | undefined, err: j?.error ? `${j.error.code ?? ''} ${j.error.message ?? ''}`.trim().slice(0, 300) : '' };
}

async function flush(onlyGym?: string) {
  if (!TOKEN || !PHONE_ID) return { configured: false, sent: 0, failed: 0, left: 'queued until WhatsApp is configured' };
  let sent = 0, failed = 0;
  for (let round = 0; round < 5; round++) {
    const { data, error } = await sb.rpc('wa_claim_batch', { max_rows: 20 });
    if (error) return { configured: true, sent, failed, error: error.message };
    const rows = (data || []) as Row[];
    if (!rows.length) break;
    const tplCache = new Map<string, Record<string, string>>();
    for (const row of rows) {
      if (onlyGym && row.gym_id !== onlyGym) { await sb.from('wa_log').update({ claimed_at: null, attempts: Math.max(0, row.attempts - 1) }).eq('id', row.id); continue; }
      if (Date.now() - new Date(row.created_at).getTime() > MAX_AGE_MS) {
        await sb.from('wa_log').update({ status: 'skipped', error: 'too old to send' }).eq('id', row.id); continue;
      }
      if (!tplCache.has(row.gym_id)) {
        const { data: s } = await sb.from('wa_settings').select('tpl_receipt,tpl_expiry,tpl_dues,tpl_lang').eq('gym_id', row.gym_id).maybeSingle();
        tplCache.set(row.gym_id, (s || { tpl_receipt: 'fee_receipt', tpl_expiry: 'membership_expiry', tpl_dues: 'fee_due', tpl_lang: 'hi' }) as Record<string, string>);
      }
      let res;
      try { res = await sendOne(row, tplCache.get(row.gym_id)!); } catch (e) { res = { ok: false, status: 0, id: undefined, err: 'network: ' + String((e as Error).message).slice(0, 200) }; }
      if (res.ok) {
        sent++;
        await sb.from('wa_log').update({ status: 'sent', sent_at: new Date().toISOString(), wa_message_id: res.id ?? null, error: null }).eq('id', row.id);
      } else {
        const transient = res.status === 0 || res.status === 429 || res.status >= 500;
        if (transient && row.attempts < 3) { await sb.from('wa_log').update({ error: res.err || `HTTP ${res.status}`, claimed_at: null }).eq('id', row.id); }
        else { failed++; await sb.from('wa_log').update({ status: 'failed', error: res.err || `HTTP ${res.status}` }).eq('id', row.id); }
      }
    }
  }
  return { configured: true, sent, failed };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);
  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch { /* empty body is fine */ }

  const secret = req.headers.get('x-cron-secret');
  if (secret) {
    const { data: ok } = await sb.rpc('wa_cron_ok', { s: secret });
    if (ok !== true) return json({ error: 'forbidden' }, 403);
    return json(await flush());
  }

  // signed-in admin path
  const jwt = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!jwt) return json({ error: 'sign in required' }, 401);
  const { data: u } = await sb.auth.getUser(jwt);
  if (!u?.user) return json({ error: 'sign in required' }, 401);
  const { data: prof } = await sb.from('profiles').select('role,gym_id').eq('id', u.user.id).maybeSingle();
  const gymId = String(body.gym_id || prof?.gym_id || '');
  const allowed = prof && (prof.role === 'super_admin' || (prof.role === 'gym_admin' && prof.gym_id === gymId));
  if (!allowed || !gymId) return json({ error: 'admins only' }, 403);

  const action = String(body.action || 'flush');
  if (action === 'status') return json({ configured: Boolean(TOKEN && PHONE_ID) });
  if (action === 'test') {
    const { data: gym } = await sb.from('gyms').select('name,status').eq('id', gymId).maybeSingle();
    const ph = String(body.phone || '').replace(/\D/g, '');
    const to = ph.length === 10 && /^[6-9]/.test(ph) ? '91' + ph : ph.length === 12 && ph.startsWith('91') ? ph : '';
    if (!to) return json({ error: 'Enter a valid 10-digit Indian mobile number' }, 400);
    if (!TOKEN || !PHONE_ID) return json({ configured: false, error: 'WhatsApp is not configured yet' }, 200);
    const stamp = Date.now();
    const { data: row, error } = await sb.from('wa_log').insert({
      gym_id: gymId, kind: 'test', dedupe_key: 'test:' + stamp, to_phone: to, status: 'queued', attempts: 1, claimed_at: new Date().toISOString(),
      params: ['Test Member', 'Rs 1', 'TEST-0001', new Date().toLocaleDateString('en-GB', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric' }), 'Fully paid'],
    }).select('*').single();
    if (error || !row) return json({ error: error?.message || 'could not queue' }, 500);
    const { data: s } = await sb.from('wa_settings').select('tpl_receipt,tpl_expiry,tpl_dues,tpl_lang').eq('gym_id', gymId).maybeSingle();
    let res;
    try { res = await sendOne(row as Row, (s || { tpl_receipt: 'fee_receipt', tpl_lang: 'hi' }) as Record<string, string>); } catch (e) { res = { ok: false, status: 0, id: undefined, err: 'network: ' + String((e as Error).message).slice(0, 200) }; }
    await sb.from('wa_log').update(res.ok ? { status: 'sent', sent_at: new Date().toISOString(), wa_message_id: res.id ?? null } : { status: 'failed', error: res.err || `HTTP ${res.status}` }).eq('id', row.id);
    return json({ configured: true, ok: res.ok, error: res.ok ? null : res.err || `HTTP ${res.status}`, gym: gym?.name });
  }
  return json(await flush(gymId));
});
