import { createClient } from 'npm:@supabase/supabase-js@2';

/* Lets a gym admin create a login for a trainer or a member of THEIR OWN gym.
   The caller's identity comes from the verified JWT; the role and gym are read from the database, never from the request. */
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
const today = () => new Date(Date.now() + 19800000).toISOString().slice(0, 10);
const ALPHA = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const genPassword = () => Array.from(crypto.getRandomValues(new Uint8Array(14)), (n) => ALPHA[n % ALPHA.length]).join('');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method' }, 405);
  try {
    const url = Deno.env.get('SUPABASE_URL')!, svc = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, anon = Deno.env.get('SUPABASE_ANON_KEY')!;
    const authHeader = req.headers.get('Authorization') ?? '';
    const caller = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
    const { data: u } = await caller.auth.getUser();
    if (!u?.user) return json({ error: 'unauthorized' }, 401);
    const admin = createClient(url, svc, { auth: { persistSession: false } });

    const { data: me } = await admin.from('profiles').select('role,gym_id').eq('id', u.user.id).maybeSingle();
    if (!me || me.role !== 'gym_admin' || !me.gym_id) return json({ error: 'forbidden' }, 403);
    const { data: gym } = await admin.from('gyms').select('status,lock_override,subscription_ends_on').eq('id', me.gym_id).maybeSingle();
    if (!gym) return json({ error: 'forbidden' }, 403);
    const locked = gym.lock_override === 'force_lock' || (gym.lock_override !== 'force_unlock' && (gym.status === 'suspended' || (gym.subscription_ends_on && gym.subscription_ends_on < today())));
    if (locked) return json({ error: 'locked' }, 403);

    const body = await req.json().catch(() => ({}));
    const email = String(body.email ?? '').trim().toLowerCase(), role = String(body.role ?? ''), name = String(body.full_name ?? '').trim().slice(0, 80);
    const memberId = body.member_id ? String(body.member_id) : null;
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 120) return json({ error: 'bad_email' }, 400);
    if (role !== 'trainer' && role !== 'member') return json({ error: 'bad_role' }, 400);
    if (role === 'member') {
      if (!memberId) return json({ error: 'member_required' }, 400);
      const { data: m } = await admin.from('members').select('id,profile_id,gym_id').eq('id', memberId).maybeSingle();
      if (!m || m.gym_id !== me.gym_id) return json({ error: 'member_not_found' }, 404);
      if (m.profile_id) return json({ error: 'already_linked' }, 409);
    }

    const password = genPassword();
    const { data: created, error: cErr } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: name } });
    if (cErr || !created?.user) return json({ error: /already|registered|exists/i.test(cErr?.message ?? '') ? 'email_taken' : 'create_failed' }, /already|registered|exists/i.test(cErr?.message ?? '') ? 409 : 500);

    const { error: aErr } = await admin.rpc('service_assign_profile', { target: created.user.id, new_role: role, gym: me.gym_id, member: role === 'member' ? memberId : null, display_name: name });
    if (aErr) { await admin.auth.admin.deleteUser(created.user.id); return json({ error: 'assign_failed' }, 500); }
    return json({ email, password, role });
  } catch (_e) {
    return json({ error: 'server' }, 500);
  }
});
