import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';
import { classify, cleanPayload, outcome } from './lib.js';

// Web Push to members' phones (receipt, expiry reminder, owner announcements).
//  - {action:'key'}   (signed-in user): returns the public VAPID key. The key pair is made on first use and the private half never leaves the database.
//  - {action:'test'}  (signed-in user): sends one test notification to the caller's own devices (at most one per minute).
//  - {action:'flush'} (header x-cron-secret, same secret as wa-dispatch): sends the queued messages.
// No secret has to be typed anywhere for this function.

const URL_ = Deno.env.get('SUPABASE_URL')!;
const ANON = Deno.env.get('SUPABASE_ANON_KEY')!;
const SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });
const admin = () => createClient(URL_, SERVICE, { auth: { persistSession: false, autoRefreshToken: false } });

async function vapid(db: any) {
  let { data } = await db.from('push_config').select('public_key,private_key').eq('id', 1).maybeSingle();
  if (!data) {
    const k = webpush.generateVAPIDKeys();
    await db.from('push_config').upsert({ id: 1, public_key: k.publicKey, private_key: k.privateKey }, { onConflict: 'id', ignoreDuplicates: true });
    ({ data } = await db.from('push_config').select('public_key,private_key').eq('id', 1).maybeSingle());
  }
  return data as { public_key: string; private_key: string } | null;
}

/** try every device of one person; returns one result per device */
async function sendTo(db: any, v: any, profileId: string, payload: string): Promise<string[]> {
  const { data: subs } = await db.from('push_subs').select('id,endpoint,p256dh,auth').eq('profile_id', profileId);
  const out: string[] = [];
  for (const s of subs || []) {
    let res = 'retry';
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload,
        { vapidDetails: { subject: URL_, publicKey: v.public_key, privateKey: v.private_key }, TTL: 86400, urgency: 'normal', timeout: 10000 });
      res = 'ok';
    } catch (e: any) { res = classify(e?.statusCode); }
    if (res === 'gone') await db.from('push_subs').delete().eq('id', s.id);
    else if (res === 'ok') await db.from('push_subs').update({ last_ok_at: new Date().toISOString(), fails: 0 }).eq('id', s.id);
    out.push(res);
  }
  return out;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);
  let body: any = {}; try { body = await req.json(); } catch { /* */ }
  const db = admin();

  const cron = req.headers.get('x-cron-secret');
  if (cron) {
    if (body.action !== 'flush') return json({ error: 'bad_action' }, 400);
    const { data: ok } = await db.rpc('wa_cron_ok', { s: cron });
    if (ok !== true) return json({ error: 'forbidden' }, 403);
    const v = await vapid(db); if (!v) return json({ error: 'no_keys' }, 500);
    const { data: rows, error } = await db.rpc('push_claim_batch', { max_rows: 20 });
    if (error) return json({ error: 'claim_failed' }, 500);
    let sent = 0, left = 0;
    for (const r of rows || []) {
      const res = await sendTo(db, v, r.profile_id, cleanPayload(r));
      const o = outcome(res, r.attempts);
      await db.from('push_outbox').update({ status: o.status, error: o.error, sent_at: o.status === 'sent' ? new Date().toISOString() : null }).eq('id', r.id);
      if (o.status === 'sent') sent++; else if (o.status === 'queued') left++;
    }
    return json({ ok: true, claimed: (rows || []).length, sent, retry: left });
  }

  const auth = req.headers.get('Authorization') || '';
  if (!auth) return json({ error: 'sign_in' }, 401);
  const sb = createClient(URL_, ANON, { global: { headers: { Authorization: auth } }, auth: { persistSession: false, autoRefreshToken: false } });
  const { data: u } = await sb.auth.getUser(auth.replace(/^Bearer\s+/i, ''));
  if (!u?.user) return json({ error: 'sign_in' }, 401);

  if (body.action === 'key') {
    const v = await vapid(db); if (!v) return json({ error: 'failed' }, 500);
    return json({ key: v.public_key });
  }
  if (body.action === 'test') {
    const { data: prof } = await db.from('profiles').select('gym_id').eq('id', u.user.id).maybeSingle();
    if (!prof?.gym_id) return json({ error: 'no_gym' }, 400);
    const v = await vapid(db); if (!v) return json({ error: 'failed' }, 500);
    const { error: ie } = await db.from('push_outbox').insert({ gym_id: prof.gym_id, profile_id: u.user.id, kind: 'test', dedupe_key: 'test:' + u.user.id + ':' + Math.floor(Date.now() / 60000), title: 'Test', body: 'Notifications are working. / सूचनाएँ चालू हैं।', url: '/', status: 'sent', attempts: 1, sent_at: new Date().toISOString() });
    if (ie) return json({ error: 'too_soon' }, 429);
    const res = await sendTo(db, v, u.user.id, cleanPayload({ title: 'Test', body: 'Notifications are working. / सूचनाएँ चालू हैं।', url: '/', kind: 'test' }));
    return json({ devices: res.length, delivered: res.filter((x) => x === 'ok').length });
  }
  return json({ error: 'bad_action' }, 400);
});
