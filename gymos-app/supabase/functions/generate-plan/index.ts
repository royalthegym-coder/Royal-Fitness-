import { createClient } from 'npm:@supabase/supabase-js@2';
import { buildPlans, validateFit, coachPrompt, parseCoach } from './engine.js';

// A gym admin or trainer asks for a diet + workout draft for ONE member of their own gym.
// Runs as the caller (their JWT), so row-level security decides what they may read or write. No service key is used.
// Numbers come from engine.js. If ANTHROPIC_API_KEY is set, Claude only adds a short personal note and tips.

const URL_ = Deno.env.get('SUPABASE_URL')!;
const ANON = Deno.env.get('SUPABASE_ANON_KEY')!;
const AI_KEY = Deno.env.get('ANTHROPIC_API_KEY') || '';
const MODEL = Deno.env.get('PLAN_MODEL') || 'claude-sonnet-5-5';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function coachNote(fit: any, member: any, plans: any) {
  if (!AI_KEY) return null;
  try {
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 15000);
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST', signal: ctl.signal,
      headers: { 'x-api-key': AI_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({ model: MODEL, max_tokens: 700, messages: [{ role: 'user', content: coachPrompt(fit, member, plans) }] }),
    });
    clearTimeout(t);
    if (!r.ok) return null;
    const j = await r.json();
    return parseCoach(j?.content?.[0]?.text ?? '');
  } catch { return null; }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);
  const auth = req.headers.get('Authorization') || '';
  if (!auth) return json({ error: 'sign_in' }, 401);
  let body: any = {}; try { body = await req.json(); } catch { /* */ }
  const memberId = String(body.member_id || '');
  if (!UUID.test(memberId)) return json({ error: 'bad_member' }, 400);

  const sb = createClient(URL_, ANON, { global: { headers: { Authorization: auth } }, auth: { persistSession: false, autoRefreshToken: false } });
  const { data: u } = await sb.auth.getUser(auth.replace(/^Bearer\s+/i, ''));
  if (!u?.user) return json({ error: 'sign_in' }, 401);
  const { data: prof } = await sb.from('profiles').select('role,gym_id').eq('id', u.user.id).maybeSingle();
  if (!prof || !['gym_admin', 'trainer'].includes(prof.role)) return json({ error: 'staff_only' }, 403);

  const { data: member } = await sb.from('members').select('id,gym_id,name,gender').eq('id', memberId).maybeSingle();
  if (!member || member.gym_id !== prof.gym_id) return json({ error: 'not_found' }, 404);
  const { data: fit } = await sb.from('member_fit').select('*').eq('member_id', memberId).maybeSingle();
  if (!fit) return json({ error: 'missing_profile' }, 400);
  const bad = validateFit(fit); if (bad) return json({ error: bad }, 400);

  const seed = Number.isInteger(body.seed) ? body.seed : Math.floor(Math.random() * 2 ** 31);
  const plans = buildPlans(fit, member, seed);
  if (plans.error) return json({ error: plans.error }, 422);
  const coach = await coachNote(fit, member, plans);
  if (coach) { plans.diet.content.coach = coach; plans.workout.content.coach = coach; }

  // replace older drafts, keep anything published
  await sb.from('member_plans').delete().eq('member_id', memberId).eq('status', 'draft');
  const rows = (['diet', 'workout'] as const).map((kind) => ({
    gym_id: member.gym_id, member_id: memberId, kind, status: 'draft', title: plans[kind].title.en,
    summary: { ...plans[kind].summary, title: plans[kind].title }, content: plans[kind].content,
    source: coach ? 'ai' : 'builtin', needs_review: plans.needs_review, created_by: u.user.id,
  }));
  const { data: ins, error } = await sb.from('member_plans').insert(rows).select('id,kind,status,needs_review,source');
  if (error) return json({ error: 'save_failed', detail: error.message }, 403);
  return json({ ok: true, plans: ins, ai: Boolean(coach), needs_review: plans.needs_review });
});
