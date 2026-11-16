import { createClient } from 'npm:@supabase/supabase-js@2';
import { MAX_Q, screen, safeReply, buildMessages, cleanReply, replyOk, BEGIN_STATUS } from './lib.js';

// AI fitness coach for gym members.
//  - {action:'status'}            : is the coach on for my gym, and how many questions are left today (signed-in member).
//  - {action:'ask', text:'...'}   : answer one question.
// All limits, the gym switch and everything the model may know about the member come from the database function coach_begin,
// which runs as the signed-in member. Risky topics get a fixed safe answer without calling the model.
// The model is reached through an OpenAI-compatible gateway; the three AI_GATEWAY_* values are Supabase secrets (same ones as daily-summary).
// If they are not set the coach says it is not active yet. It never makes up an answer.

const URL_ = Deno.env.get('SUPABASE_URL')!;
const ANON = Deno.env.get('SUPABASE_ANON_KEY')!;
const SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const GW_URL = (Deno.env.get('AI_GATEWAY_BASE_URL') || 'https://ai-gateway.vercel.sh/v1').replace(/\/+$/, '');
const GW_KEY = Deno.env.get('AI_GATEWAY_API_KEY') || '';
const GW_MODEL = Deno.env.get('AI_GATEWAY_MODEL') || '';
const CONFIGURED = Boolean(GW_KEY && GW_MODEL);

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });
const admin = () => createClient(URL_, SERVICE, { auth: { persistSession: false, autoRefreshToken: false } });

async function askModel(messages: unknown[]): Promise<string | null> {
  try {
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 25000);
    const r = await fetch(`${GW_URL}/chat/completions`, {
      method: 'POST', signal: ctl.signal,
      headers: { Authorization: `Bearer ${GW_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: GW_MODEL, messages, max_tokens: 450, temperature: 0.4 }),
    });
    clearTimeout(t);
    if (!r.ok) return null;
    const j = await r.json();
    const text = String(j?.choices?.[0]?.message?.content ?? '');
    return text.trim() ? text : null;
  } catch { return null; }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);
  const auth = req.headers.get('Authorization') || '';
  if (!auth) return json({ error: 'sign_in' }, 401);
  let body: any = {}; try { body = await req.json(); } catch { /* empty */ }

  const sb = createClient(URL_, ANON, { global: { headers: { Authorization: auth } }, auth: { persistSession: false, autoRefreshToken: false } });
  const { data: u } = await sb.auth.getUser(auth.replace(/^Bearer\s+/i, ''));
  if (!u?.user) return json({ error: 'sign_in' }, 401);

  if (body.action === 'status') {
    const { data, error } = await sb.rpc('coach_status');
    if (error) return json({ error: 'failed' }, 500);
    return json({ ...(data || { enabled: false }), configured: CONFIGURED });
  }

  if (body.action !== 'ask') return json({ error: 'bad_action' }, 400);
  const text = typeof body.text === 'string' ? body.text.trim() : '';
  if (text.length < 2 || text.length > MAX_Q) return json({ error: 'bad_text' }, 400);
  if (!CONFIGURED) return json({ error: 'not_configured' }, 503);

  const { data: b, error: be } = await sb.rpc('coach_begin', { p_text: text });
  if (be) return json({ error: 'failed' }, be.code === '42501' ? 403 : 500);
  if (!b || b.error) return json({ error: b?.error || 'failed', limit: b?.limit }, BEGIN_STATUS[b?.error as string] || 500);

  const db = admin();
  // the gym id is read from the member's own profile so a stored answer always carries the right gym
  const { data: prof } = await db.from('profiles').select('gym_id').eq('id', u.user.id).maybeSingle();
  const saveRow = (content: string, kind: 'ai' | 'safety') => db.from('coach_messages').insert({ gym_id: prof?.gym_id, profile_id: u.user.id, role: 'assistant', kind, content });

  const risky = screen(text);
  if (risky) {
    const reply = safeReply(risky, text);
    await saveRow(reply, 'safety');
    return json({ reply, kind: 'safety', remaining: b.remaining });
  }

  const raw = await askModel(buildMessages(b.gym_name, b.ctx, b.history, text));
  if (raw === null) {
    // the question is not charged when the model could not answer
    await db.from('coach_messages').delete().eq('id', b.msg_id).eq('profile_id', u.user.id);
    return json({ error: 'unavailable' }, 502);
  }
  const cleaned = cleanReply(raw);
  if (!replyOk(cleaned)) {
    const reply = safeReply('reject', text);
    await saveRow(reply, 'safety');
    return json({ reply, kind: 'safety', remaining: b.remaining });
  }
  await saveRow(cleaned, 'ai');
  return json({ reply: cleaned, kind: 'ai', remaining: b.remaining });
});
