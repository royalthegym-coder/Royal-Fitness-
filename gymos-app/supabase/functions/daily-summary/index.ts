import { createClient } from 'npm:@supabase/supabase-js@2';
import { rulesText, aiMessages, aiTextOk } from './summary.js';

// Short Hindi end-of-day summary (today's collection, dues, check-ins) for the gym owner's dashboard.
// Numbers come from the database (daily_facts, aggregate only, no member names). The text is built by fixed rules;
// if an AI gateway is configured it may only re-word it, and the answer is rejected if any number differs.
// Auth: the owner's session (gym_admin / super_admin) or the shared cron value (checked in the database).
// verify_jwt is off because pg_cron has no user session; every path authenticates itself below.

const URL_ = Deno.env.get('SUPABASE_URL')!;
const SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const GW_URL = (Deno.env.get('AI_GATEWAY_BASE_URL') || 'https://ai-gateway.vercel.sh/v1').replace(/\/+$/, '');
const GW_KEY = Deno.env.get('AI_GATEWAY_API_KEY') || '';
const GW_MODEL = Deno.env.get('AI_GATEWAY_MODEL') || '';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });
const sb = createClient(URL_, SERVICE, { auth: { persistSession: false, autoRefreshToken: false } });
const istToday = () => new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function aiText(facts: any): Promise<string | null> {
  if (!GW_KEY || !GW_MODEL) return null;
  try {
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 12000);
    const r = await fetch(`${GW_URL}/chat/completions`, {
      method: 'POST', signal: ctl.signal,
      headers: { Authorization: `Bearer ${GW_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: GW_MODEL, messages: aiMessages(facts), max_tokens: 400, temperature: 0.3 }),
    });
    clearTimeout(t);
    if (!r.ok) return null;
    const j = await r.json();
    const text = String(j?.choices?.[0]?.message?.content ?? '').trim();
    return aiTextOk(text, facts) ? text : null;
  } catch { return null; }
}

async function summarize(gymId: string, day: string) {
  const { data: facts, error } = await sb.rpc('daily_facts', { g: gymId, d: day });
  if (error || !facts) return { error: 'facts_failed' };
  const { data: old } = await sb.from('daily_summaries').select('facts,text_hi,source,created_at').eq('gym_id', gymId).eq('day', day).maybeSingle();
  if (old && JSON.stringify(old.facts) === JSON.stringify(facts)) return { day, facts, text: old.text_hi, source: old.source, cached: true };
  const ai = await aiText(facts);
  const text = ai || rulesText(facts), source = ai ? 'ai' : 'rules';
  const { error: e2 } = await sb.from('daily_summaries').upsert({ gym_id: gymId, day, facts, text_hi: text, source, created_at: new Date().toISOString() }, { onConflict: 'gym_id,day' });
  if (e2) return { error: 'save_failed' };
  return { day, facts, text, source, cached: false };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);
  let body: Record<string, unknown> = {}; try { body = await req.json(); } catch { /* empty */ }

  const secret = req.headers.get('x-cron-secret');
  if (secret) {
    const { data: ok } = await sb.rpc('wa_cron_ok', { s: secret });
    if (ok !== true) return json({ error: 'forbidden' }, 403);
    const { data: gyms } = await sb.from('gyms').select('id').eq('status', 'active').limit(200);
    let done = 0; const day = istToday();
    for (const g of gyms || []) { const r: any = await summarize(g.id, day); if (!r.error) done++; }
    return json({ ok: true, gyms: done });
  }

  const jwt = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!jwt) return json({ error: 'sign_in' }, 401);
  const { data: u } = await sb.auth.getUser(jwt);
  if (!u?.user) return json({ error: 'sign_in' }, 401);
  const { data: prof } = await sb.from('profiles').select('role,gym_id').eq('id', u.user.id).maybeSingle();
  const gymId = String(prof?.role === 'super_admin' ? body.gym_id || '' : prof?.gym_id || '');
  if (!prof || !['gym_admin', 'super_admin'].includes(prof.role) || !UUID.test(gymId)) return json({ error: 'owner_only' }, 403);
  const today = istToday();
  const day = typeof body.day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.day) && body.day <= today ? body.day : today;
  const r: any = await summarize(gymId, day);
  return r.error ? json(r, 500) : json(r);
});
