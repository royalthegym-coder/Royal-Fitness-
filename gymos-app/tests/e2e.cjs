/* End-to-end test against a MOCKED Supabase (no network, no real data).
   Run: NODE_PATH=$(npm root -g) node tests/e2e.js */
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const PUB = path.join(__dirname, '..', 'public');
const SB = 'https://ayoeevltbubkyhixqqlg.supabase.co';
const SOC_SQL = fs.readFileSync(path.join(__dirname, '..', 'supabase', 'migrations', '20261123_social_profiles.sql'), 'utf8'), SOC_CHK = {};
for (const k of ['whatsapp', 'instagram', 'facebook', 'youtube']) { const m = new RegExp(`social_${k}_chk check \\(${k} is null or ${k} ~ '([^']+)'\\)`).exec(SOC_SQL); if (!m) throw new Error('no CHECK for ' + k); SOC_CHK[k] = new RegExp(m[1]); }
let fails = 0; const ok = (c, m) => { if (!c) { fails++; console.log('  FAIL', m); } else console.log('  ok  ', m); };
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const jwt = (sub) => `${b64({ alg: 'none' })}.${b64({ sub })}.x`;
const today = () => new Date(Date.now() + 19800000).toISOString().slice(0, 10);
const addD = (d, n) => new Date(Date.parse(d) + n * 864e5).toISOString().slice(0, 10);
let seq = 1; const uid = () => '00000000-0000-4000-8000-' + String(seq++).padStart(12, '0');

const ENGINE = import('../supabase/functions/generate-plan/engine.js');
function draftRows(eng, db, mem, fit, status) {
  const p = eng.buildPlans(fit, mem, 11);
  return ['diet', 'workout'].map((kind) => ({ id: uid(), gym_id: db.G, member_id: mem.id, kind, status, title: p[kind].title.en, summary: { ...p[kind].summary, title: p[kind].title }, content: p[kind].content, source: 'builtin', needs_review: p.needs_review, created_at: new Date().toISOString(), published_at: status === 'published' ? new Date().toISOString() : null }));
}
const FIT = { age: 30, height_cm: 175, weight_kg: 80, goal: 'fat_loss', diet_pref: 'veg', activity: 'moderate', experience: 'intermediate', days_per_week: 4, session_min: 60, equipment: 'gym', injuries: null, conditions: null, allergies: null };
function makeDb(role) {
  const G = '11111111-1111-4111-8111-111111111111', P1 = uid(), P2 = uid();
  const db = { calls: [], gyms: [{ id: G, name: 'Royal The Gym', owner_name: 'Mahesh', phone: '9785300123', city: 'Jhunjhunu', upi_id: '9785300123@okbizaxis', plan: 'pro', status: 'active', subscription_ends_on: addD(today(), 40), lock_override: 'none', review_url: role === 'member' ? 'https://g.page/r/CabcDEF123/review' : null }], plans: [{ id: P1, gym_id: G, name: 'Monthly', months: 1, price: 1000, gst_pct: 18, status: 'Active' }, { id: P2, gym_id: G, name: 'Quarterly', months: 3, price: 2700, gst_pct: 18, status: 'Active' }], members: [], invoices: [], payments: [], visits: [], payment_ledger: [], audit_log: [], profiles: [], offers: [], wa_settings: [], wa_log: [], member_fit: [], member_plans: [], daily_summaries: [], expenses: [], leads: [], products: [], sales: [], product_costs: [], sale_costs: [], staff_members: [], salary_payments: [], member_progress: [], member_workouts: [], member_water: [], member_meals: [], member_sleep: [], referral_rewards: [], member_freezes: [], gym_equipment: [], trainer_commission: [], gym_classes: [], class_bookings: [], gym_tasks: [], staff_attendance: [], online_orders: [], online_pay: [], coach_messages: [], coach_settings: [], push_outbox: [], emi_plans: [], emi_installments: [] };
  const me = '22222222-2222-4222-8222-222222222222';
  db.me = me; db.G = G;
  db.profiles = [{ id: me, gym_id: role === 'super_admin' ? null : G, role, full_name: 'Test', email: 't@x.in', created_at: new Date().toISOString() }, { id: uid(), gym_id: null, role: 'member', full_name: 'New User', email: 'n@x.in', created_at: new Date().toISOString() }];
  const mk = (name, phone, end, extra = {}) => ({ id: uid(), gym_id: G, name, phone, plan_id: P1, start_date: addD(end, -30), end_date: end, status: 'Active', joined_on: addD(end, -30), goal: 'Muscle', gender: null, notes: null, profile_id: null, ...extra });
  db.members = [mk('Rahul Sharma', '9876543210', addD(today(), 20)), mk('Priya Verma', '9812345678', addD(today(), 2)), mk('Old Timer', '9000000001', addD(today(), -10)), mk('Absent Ajay', '9000000002', addD(today(), 15), { joined_on: addD(today(), -60) })];
  db.visits = [{ id: uid(), gym_id: G, member_id: db.members[0].id, in_at: new Date().toISOString(), out_at: null }];
  const inv = { id: uid(), gym_id: G, no: 'INV-0001', member_id: db.members[0].id, date: today(), due: addD(today(), 7), items: [{ label: 'Monthly membership', amount: 1000 }], subtotal: 1000, discount: 0, gst_pct: 18, gst_amt: 180, total: 1180, cancelled: false };
  db.invoices = [inv];
  if (role === 'member') db.members[0].profile_id = me;
  return db;
}
function handler(db, role) {
  const OV = [{ gym_id: db.G, name: 'Royal The Gym', city: 'Jhunjhunu', plan: 'pro', status: 'active', subscription_ends_on: addD(today(), 40), lock_override: 'none', locked: false, members: 4, staff: 1, last_visit: new Date().toISOString() }];
  return async (route) => {
    const req = route.request(), u = new URL(req.url()), p = u.pathname, m = req.method();
    const json = (body, status = 200) => route.fulfill({ status, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(body) });
    if (m === 'OPTIONS') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' } });
    db.calls.push(`${m} ${p}${u.search ? '?' + u.search.slice(1, 40) : ''}`);
    if (db.offline) return route.abort('internetdisconnected'); /* a dropped connection: the app sees a network error (status 0) */
    if (p === '/auth/v1/token') { const b = JSON.parse(req.postData() || '{}'); if (b.password === 'bad') return json({ msg: 'Invalid login credentials' }, 400); return json({ access_token: jwt(db.me), refresh_token: 'r', expires_in: 3600, user: { email: 't@x.in' } }); }
    if (p === '/functions/v1/create-account') { const b = JSON.parse(req.postData()); db.created = b; if (b.email === 'taken@x.in') return json({ error: 'email_taken' }, 409); return json({ email: b.email, password: 'GenPass1234abcd', role: b.role }); }
    if (p === '/functions/v1/razorpay') { const b = JSON.parse(req.postData() || '{}'); (db.rzCalls = db.rzCalls || []).push(b); if (b.action === 'status') return json({ configured: db.rzConf !== false, enabled: !!db.rzEnabled }); if (b.action === 'route_retry') { db.routeRetry = b; return json({ ok: true, result: 'processed' }); } if (db.rzFail) return json({ error: 'gateway' }, 502); return json({ url: db.rzUrl || 'https://rzp.io/i/test1', amount: 1180 }); }
    if (p === '/functions/v1/ai-coach') {
      const b = JSON.parse(req.postData() || '{}'); (db.coachCalls = db.coachCalls || []).push(b);
      const used = () => db.coach_messages.filter((r) => r.role === 'user').length;
      if (b.action === 'status') return json({ enabled: db.coachOn !== false, configured: db.coachConf !== false, limit: 10, used: used(), remaining: 10 - used() });
      if (db.coachFail) return json({ error: db.coachFail }, db.coachFail === 'unavailable' ? 502 : 429);
      const id = db.coach_messages.length + 1, risky = /chest pain/i.test(b.text);
      db.coach_messages.push({ id, role: 'user', kind: 'ai', content: b.text });
      const reply = risky ? 'This is a matter for a doctor.' : 'Eat a banana and some curd 60 minutes before.';
      db.coach_messages.push({ id: id + 1, role: 'assistant', kind: risky ? 'safety' : 'ai', content: reply });
      return json({ reply, kind: risky ? 'safety' : 'ai', remaining: 10 - used() });
    }
    if (p === '/functions/v1/wa-dispatch') { const b = JSON.parse(req.postData() || '{}'); (db.waCalls = db.waCalls || []).push(b); return json({ configured: false }); }
    if (p === '/functions/v1/generate-plan') { const b = JSON.parse(req.postData() || '{}'), eng = await ENGINE, fit = db.member_fit.find((f) => f.member_id === b.member_id), mem = db.members.find((x) => x.id === b.member_id); db.genCalls = (db.genCalls || 0) + 1; if (!fit) return json({ error: 'missing_profile' }, 400); db.member_plans = db.member_plans.filter((r) => !(r.member_id === b.member_id && r.status === 'draft')); draftRows(eng, db, mem, fit, 'draft').forEach((r) => db.member_plans.unshift(r)); return json({ ok: true, plans: [], ai: false, needs_review: false }); }
    if (p === '/functions/v1/daily-summary') { db.sumCalls = (db.sumCalls || 0) + 1; if (db.sumFail) return json({ error: 'facts_failed' }, 500); return json({ day: today(), text: 'आज (' + today() + ') की वसूली ₹500 रही (1 भुगतान)। कुल बकाया ₹680 है (1 सदस्य)। आज 1 सदस्य जिम आए।', source: 'rules', cached: false, facts: {} }); }
    if (p === '/auth/v1/user' && m === 'PUT') { db.pwChanged = JSON.parse(req.postData()).password; return json({ id: db.me }); }
    if (p === '/auth/v1/logout') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } });
    if (p.startsWith('/rest/v1/rpc/')) {
      const fn = p.split('/').pop(); let a = JSON.parse(req.postData() || '{}');
      if (fn === 'admin_gym_overview') return json(OV);
      if (fn === 'verify_gym_ledger') return json([]);
      if (fn === 'class_booked_counts') { const o = {}; db.class_bookings.forEach((b) => (o[b.class_id] = (o[b.class_id] || 0) + 1)); return json(Object.entries(o).map(([class_id, booked]) => ({ class_id, booked }))); }
      if (fn === 'freeze_member') { const mm = db.members.find((x) => x.id === a.member); if (mm.status === 'Frozen') return route.fulfill({ status: 409, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ message: 'already frozen' }) }); mm.status = 'Frozen'; db.member_freezes.push({ id: uid(), member_id: mm.id, started_on: addD(today(), -5), ended_on: null, reason: a.why }); return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } }); }
      if (fn === 'unfreeze_member') { const mm = db.members.find((x) => x.id === a.member), f = db.member_freezes.find((x) => x.member_id === mm.id && !x.ended_on); f.ended_on = today(); f.days_added = 5; mm.status = 'Active'; mm.end_date = addD(mm.end_date, 5); return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '5' }); }
      if (fn === 'book_class') { const c = db.gym_classes.find((x) => x.id === a.p_class), mid = a.p_member || (db.members.find((x) => x.profile_id === db.me) || {}).id; if (db.class_bookings.some((b) => b.class_id === c.id && b.member_id === mid)) return json({ message: 'already booked', code: '23505' }, 409); if (db.class_bookings.filter((b) => b.class_id === c.id).length >= c.capacity) return json({ message: 'class full', code: '23514' }, 400); const b = { id: uid(), gym_id: db.G, class_id: c.id, member_id: mid, cancelled_at: null }; db.class_bookings.push(b); return json(b.id); }
      if (fn === 'cancel_booking') { const i = db.class_bookings.findIndex((b) => b.id === a.p_booking); if (i >= 0) db.class_bookings.splice(i, 1); return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } }); }
      if (fn === 'save_product') { let pr = a.p_id && db.products.find((x) => x.id === a.p_id); if (!pr) { pr = { id: uid(), gym_id: db.G, cost: 0 }; db.products.push(pr); } Object.assign(pr, { name: a.p_name, category: a.p_category, price: a.p_price, stock: a.p_stock, low_at: a.p_low_at, active: a.p_active }); const pc = db.product_costs.find((x) => x.product_id === pr.id); if (pc) pc.cost = a.p_cost; else db.product_costs.push({ product_id: pr.id, gym_id: db.G, cost: a.p_cost }); return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } }); }
      if (fn === 'record_sale') { const pr = db.products.find((x) => x.id === a.p_product); if (!pr || pr.stock < a.p_qty) return json({ message: 'out of stock' }, 400); pr.stock -= a.p_qty; const sid = uid(); db.sale_costs.push({ sale_id: sid, gym_id: db.G, unit_cost: (db.product_costs.find((x) => x.product_id === pr.id) || { cost: 0 }).cost }); db.sales.unshift({ id: sid, gym_id: db.G, product_id: pr.id, product_name: pr.name, qty: a.p_qty, unit_price: pr.price, unit_cost: 0, total: pr.price * a.p_qty, method: a.p_method, member_id: a.p_member, sold_on: today(), voided_at: null }); db.lastSaleArgs = a; return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } }); }
      if (fn === 'void_sale') { const sl = db.sales.find((x) => x.id === a.p_sale); if (sl && !sl.voided_at) { sl.voided_at = new Date().toISOString(); const pr = db.products.find((x) => x.id === sl.product_id); if (pr) pr.stock += sl.qty; } return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } }); }
      if (fn === 'admin_set_referral_reward') { db.gyms[0].referral_reward_days = a.days; return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } }); }
      if (fn === 'admin_grant_referral_reward') { const f = db.members.find((x) => x.id === a.referred), rr = db.members.find((x) => x.id === f.referred_by); if (db.referral_rewards.some((x) => x.referred_id === f.id)) return json({ message: 'reward already given' }, 409); db.referral_rewards.push({ id: uid(), referred_id: f.id, referrer_id: rr.id, days: db.gyms[0].referral_reward_days }); rr.end_date = addD(rr.end_date || today(), db.gyms[0].referral_reward_days); return json(db.gyms[0].referral_reward_days); }
      if (fn === 'push_stats') return json({ members_with_login: 3, subscribed: 1, last_announce: null });
      if (fn === 'push_announce') { (db.annCalls = db.annCalls || []).push(a); if (db.annSoon) return json({ error: 'too_soon' }); db.push_outbox.push({ id: db.push_outbox.length + 1, gym_id: db.G, profile_id: db.me, kind: 'announce', dedupe_key: 'ann:' + Date.now() + ':p', title: a.p_title, body: a.p_body, status: 'sent', created_at: new Date().toISOString() }); return json({ queued: 1 }); }
      if (fn === 'coach_stats') return json({ enabled: db.coachOn !== false, limit: 10, members_with_login: 3, questions_today: db.coach_messages.filter((r) => r.role === 'user').length, questions_7d: 4, members_7d: 2 });
      if (fn === 'set_coach') { db.coachArgs = a; db.coachOn = a.p_enabled; db.coach_settings = [{ gym_id: a.p_gym, enabled: a.p_enabled, daily_limit: a.p_limit || 10 }]; return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } }); }
      if (fn === 'coach_clear') { const n = db.coach_messages.length; db.coach_messages.length = 0; return json(n); }
      if (fn === 'emi_create_plan') { const inv = db.invoices.find((x) => x.id === a.p_invoice), pid = uid(), n = a.p_count, base = Math.floor(Math.round(inv.total * 100) / n) / 100; db.emiCreateArgs = a; db.emi_plans.push({ id: pid, gym_id: db.G, invoice_id: inv.id, member_id: inv.member_id, status: 'active', created_at: new Date().toISOString() }); for (let i = 1; i <= n; i++) db.emi_installments.push({ id: uid(), plan_id: pid, seq: i, due_on: addD(a.p_start, 30 * (i - 1)), amount: i < n ? base : +(inv.total - base * (n - 1)).toFixed(2) }); return json(pid); }
      if (fn === 'emi_cancel_plan') { const pl = db.emi_plans.find((x) => x.id === a.p_plan); if (pl) pl.status = 'cancelled'; return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } }); }
      if (fn === 'emi_schedule') { const pl = db.emi_plans.find((x) => x.invoice_id === a.p_invoice && x.status === 'active'); if (!pl) return json([]); const paid = db.payments.filter((x) => x.invoice_id === a.p_invoice).reduce((s, x) => s + x.amount, 0), t = today(); let cum = 0; return json(db.emi_installments.filter((x) => x.plan_id === pl.id).sort((x, y) => x.seq - y.seq).map((r) => { cum = +(cum + r.amount).toFixed(2); const st = cum <= paid + 0.005 ? 'paid' : r.due_on < t ? 'overdue' : r.due_on === t ? 'due_today' : 'upcoming'; return { plan_id: pl.id, seq: r.seq, due_on: r.due_on, amount: r.amount, cum_amount: cum, paid_since: +paid.toFixed(2), state: st }; })); }
      if (fn === 'set_route_account') { db.routeArgs = a; db.gyms[0].rz_account_id = a.p_account || null; return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } }); }
      if (fn === 'route_summary') { const paidO = db.online_orders.filter((o) => o.status === 'paid'), acc = db.gyms[0].rz_account_id || null, nul = paidO.filter((o) => !o.transfer_status), amt = (xs) => xs.reduce((s, o) => s + o.amount, 0), sent = paidO.filter((o) => ['created', 'pending', 'processed'].includes(o.transfer_status)); return json({ account: acc, sent: sent.length, sent_amount: amt(sent), unrouted: acc ? nul.length : 0, no_account: acc ? 0 : nul.length, no_account_amount: acc ? 0 : amt(nul), failed: paidO.filter((o) => o.transfer_status === 'failed').length, routing: paidO.filter((o) => o.transfer_status === 'routing').length, online_on: !!(db.online_pay[0] && db.online_pay[0].enabled) }); }
      if (fn === 'route_list') return json(db.online_orders.filter((o) => o.status === 'paid' && (!o.transfer_status || ['failed', 'routing'].includes(o.transfer_status))).map((o) => ({ id: o.id, amount: o.amount, paid_at: o.paid_at || null, transfer_status: o.transfer_status || null, transfer_error: o.transfer_error || null, transfer_at: null, member_name: ((db.members.find((m) => m.id === o.member_id) || {}).name) || null })));
      if (fn === 'set_online_pay') { db.onlinePayArgs = a; db.online_pay = [{ gym_id: a.p_gym, enabled: a.p_enabled }]; return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } }); }
      if (fn === 'mark_staff_attendance') { const st = db.staff_members.find((x) => x.id === a.p_staff); if (!st || a.p_day > today() || (st.joined_on && a.p_day < st.joined_on)) return json({ message: 'refused' }, 400); const i = db.staff_attendance.findIndex((x) => x.staff_id === a.p_staff && x.day === a.p_day); if (a.p_status === null) { if (i >= 0) db.staff_attendance.splice(i, 1); } else if (i >= 0) db.staff_attendance[i].status = a.p_status; else db.staff_attendance.push({ id: uid(), gym_id: db.G, staff_id: a.p_staff, day: a.p_day, status: a.p_status }); return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } }); }
      if (fn === 'set_my_leaderboard') { db.members[0].leaderboard_opt_in = !!a.opt; return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } }); }
      if (fn === 'gym_leaderboard') return json(db.members[0].leaderboard_opt_in ? [{ rank: 1, display_name: 'Rohit S.', days: 12, is_me: false }, { rank: 2, display_name: 'Rahul S.', days: 9, is_me: true }] : []);
      if (fn === 'member_deletion_status') return json(db.deletion ? { status: db.deletion.status, requested_at: db.deletion.requested_at, handled_at: db.deletion.handled_at || null, note: db.deletion.note || null } : { status: null });
      if (fn === 'member_request_deletion') { if (!db.deletion) db.deletion = { id: uid(), status: 'pending', requested_at: new Date().toISOString(), member_id: db.members[0].id }; return json({ status: 'pending', requested_at: db.deletion.requested_at, already: false }); }
      if (fn === 'deletion_list') return json(db.deletion ? [{ id: db.deletion.id, status: db.deletion.status, requested_at: db.deletion.requested_at, handled_at: db.deletion.handled_at || null, note: db.deletion.note || null, member_id: db.members[0].id, member_name: db.members[0].name, member_phone: db.members[0].phone, photo_path: db.members[0].photo_path || null }] : []);
      if (fn === 'deletion_reject') { db.deletionArgs = a; db.deletion.status = 'rejected'; db.deletion.note = a.p_note; db.deletion.handled_at = new Date().toISOString(); return json({ ok: true }); }
      if (fn === 'deletion_complete') { db.deletionArgs = a; db.deletion.status = 'done'; db.deletion.handled_at = new Date().toISOString(); Object.assign(db.members[0], { name: 'Deleted member', phone: null, photo_path: null }); return json({ ok: true, member_id: db.members[0].id }); }
      if (fn === 'admin_set_gym_review_url') { db.gyms[0].review_url = a.link; return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } }); }
      if (fn === 'admin_set_gym_timings') { db.gyms[0].timings = a.timing_text; return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } }); }
      if (fn === 'publish_member_plan') { const r = db.member_plans.find((x) => x.id === a.p); db.member_plans.forEach((x) => { if (x.member_id === r.member_id && x.kind === r.kind && x.status === 'published' && x.id !== r.id) x.status = 'archived'; }); r.status = 'published'; return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } }); }
      if (fn === 'unpublish_member_plan') { const r = db.member_plans.find((x) => x.id === a.p); if (r && r.status === 'published') r.status = 'archived'; return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } }); }
      /* ---- admissions, renewals and public enquiries: mirror of the server functions in 20261118_admissions_enquiries.sql ---- */
      if (fn === 'admit_member' || fn === 'renew_member' || fn === 'enquiry_gym' || fn === 'submit_enquiry') {
        /* admit_member(p jsonb) and renew_member(p jsonb) take ONE argument named p. PostgREST matches the body keys to argument names,
           so a flat body is answered "function not found" (404 PGRST202), exactly as production did. */
        if ((fn === 'admit_member' || fn === 'renew_member') && !(Object.keys(a).length === 1 && a.p && typeof a.p === 'object')) {
          (db.rpcShapeErrors = db.rpcShapeErrors || []).push(fn);
          return route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ code: 'PGRST202', message: `Could not find the function public.${fn}(${Object.keys(a).sort().join(', ')}) in the schema cache`, details: null, hint: null }) });
        }
        if (fn === 'admit_member' || fn === 'renew_member') a = a.p;
        const bad = (message) => json({ message, code: 'P0001', details: null, hint: null }, 400);
        const mobile = (v) => { let d = String(v || '').replace(/\D/g, ''); if (d.length === 12 && d.startsWith('91')) d = d.slice(2); if (d.length === 11 && d[0] === '0') d = d.slice(1); return /^[6-9]\d{9}$/.test(d) ? d : null; };
        const addM = (d, n) => { const [y, mo, dd] = d.split('-').map(Number), t = new Date(Date.UTC(y, mo - 1 + n, 1)), last = new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth() + 1, 0)).getUTCDate(); t.setUTCDate(Math.min(dd, last)); return t.toISOString().slice(0, 10); };
        const money = (x) => Math.round(x * 100) / 100;
        const bill = (pl, discount, offerName, memberId) => { const sub = Number(pl.price), disc = Math.min(Math.max(Number(discount) || 0, 0), sub), base = sub - disc, gst = money(base * Number(pl.gst_pct || 0) / 100), items = [{ label: pl.name + ' membership', amount: sub }]; if (disc > 0) items.push({ label: 'Offer: ' + (offerName || 'discount'), amount: 0 }); const inv = { id: uid(), gym_id: db.G, no: 'INV-' + String(db.invoices.length + 1).padStart(4, '0'), member_id: memberId, date: today(), due: addD(today(), 7), items, subtotal: sub, discount: disc, gst_pct: Number(pl.gst_pct || 0), gst_amt: gst, total: money(base + gst), cancelled: false }; db.invoices.unshift(inv); return inv; };
        if (fn === 'admit_member') {
          (db.admitCalls = db.admitCalls || []).push(a);
          if (db.rpcDown) return bad('boom');
          const name = String(a.name || '').trim(); if (name.length < 2 || name.length > 60) return bad('name must be 2 to 60 characters');
          const ph = mobile(a.phone); if (!ph) return bad('enter a valid 10-digit mobile number (starts with 6 to 9)');
          const dup = db.members.find((x) => mobile(x.phone) === ph); if (dup) return bad('phone already registered to ' + dup.name);
          if (a.dob && (a.dob > today() || a.dob < '1900-01-01')) return bad('date of birth is not valid');
          let pl = null, start = null, end = null;
          if (a.plan_id) { pl = db.plans.find((x) => x.id === a.plan_id && x.status === 'Active'); if (!pl) return bad('that plan is not active for this gym'); start = a.start_date || today(); end = addD(addM(start, pl.months), -1); }
          const mem = { id: uid(), gym_id: db.G, name, phone: ph, gender: a.gender || null, dob: a.dob || null, goal: a.goal || null, notes: a.notes || null, plan_id: pl ? pl.id : null, start_date: start, end_date: end, referred_by: a.referred_by || null, trainer_id: a.trainer_id || null, wa_opt_out: !!a.wa_opt_out, status: 'Active', joined_on: today(), profile_id: null };
          db.members.unshift(mem);
          const inv = a.bill && pl ? bill(pl, a.discount, a.offer_name, mem.id) : null;
          return json({ member_id: mem.id, invoice_id: inv ? inv.id : null });
        }
        if (fn === 'renew_member') {
          (db.renewCalls = db.renewCalls || []).push(a);
          if (db.rpcDown) return bad('boom');
          const mem = db.members.find((x) => x.id === a.member_id); if (!mem) return bad('member not found in this gym');
          if (mem.status === 'Frozen') return bad('unfreeze the member before renewing');
          if (!a.start) return bad('start date is required');
          const pl = db.plans.find((x) => x.id === a.plan_id && x.status === 'Active'); if (!pl) return bad('that plan is not active for this gym');
          const sub = Number(pl.price), disc = Math.min(Math.max(Number(a.discount) || 0, 0), sub), total = money(sub - disc + money((sub - disc) * Number(pl.gst_pct || 0) / 100)), pay = Number(a.pay) || 0;
          if (pay < 0) return bad('paid amount cannot be negative');
          if (pay > total) return bad('paid amount is more than the total ' + total.toFixed(2));
          const inv = bill(pl, a.discount, a.offer_name, mem.id);
          Object.assign(mem, { plan_id: pl.id, start_date: a.start, end_date: addD(addM(a.start, pl.months), -1), status: 'Active' });
          let payment = null;
          if (pay > 0) { const n = db.payments.length + 1; payment = { id: uid(), gym_id: db.G, no: 'RCT-' + String(n).padStart(4, '0'), invoice_id: inv.id, member_id: mem.id, amount: pay, method: a.method || 'Cash', paid_on: today() }; db.payments.unshift(payment); db.payment_ledger.push({ id: n, gym_id: db.G, seq: n, payment_id: payment.id, no: payment.no, member_id: mem.id, amount: pay, method: payment.method, paid_on: payment.paid_on, prev_mac: 'x', mac: 'abcdef0123456789abcdef' }); }
          return json({ invoice: inv, payment });
        }
        if (fn === 'enquiry_gym') return json(db.enquiryClosed || a.p_gym !== db.G ? null : db.gyms[0].name);
        (db.enqCalls = db.enqCalls || []).push(a);
        if (a.p_hp) return json({ ok: true });
        if (db.enquiryClosed || a.p_gym !== db.G) return bad('enquiries_closed');
        if (a.p_consent !== true) return bad('consent_required');
        const nm = String(a.p_name || '').trim(); if (nm.length < 2 || nm.length > 80) return bad('name_invalid');
        const ph = mobile(a.p_phone); if (!ph) return bad('phone_invalid');
        if (String(a.p_interest || '').length > 200 || String(a.p_note || '').length > 500) return bad('text_too_long');
        if (db.enquiryBusy) return bad('too_many_enquiries');
        if (db.leads.some((l) => mobile(l.phone) === ph)) return json({ ok: true, duplicate: true });
        db.leads.unshift({ id: uid(), gym_id: db.G, name: nm, phone: ph, source: 'Website', stage: 'New', interest: (a.p_interest || '').trim() || null, note: (a.p_note || '').trim() || null, follow_up_on: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
        return json({ ok: true });
      }
      /* AI operator: named scalar arguments, so a body with other keys is "function not found", as PostgREST answers */
      if (fn === 'operator_set_settings' || fn === 'operator_scan' || fn === 'operator_decide') {
        const want = { operator_set_settings: ['p_dues', 'p_enabled', 'p_expiry', 'p_leads', 'p_stale'], operator_scan: [], operator_decide: ['p_id', 'p_status'] }[fn];
        if (Object.keys(a).sort().join() !== want.join()) { (db.rpcShapeErrors = db.rpcShapeErrors || []).push(fn); return route.fulfill({ status: 404, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ code: 'PGRST202', message: `Could not find the function public.${fn}(${Object.keys(a).sort().join(', ')}) in the schema cache` }) }); }
        if (fn === 'operator_set_settings') { db.opSetArgs = a; db.operator_settings = [{ gym_id: db.G, enabled: a.p_enabled, lead_followups: a.p_leads, expiry_nudges: a.p_expiry, dues_nudges: a.p_dues, lead_stale_days: a.p_stale }]; return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } }); }
        if (fn === 'operator_scan') { db.opScanCalls = (db.opScanCalls || 0) + 1; if (!(db.operator_settings && db.operator_settings[0] && db.operator_settings[0].enabled)) return json({ message: 'operator is off' }, 400); const add = db.opScanAdds || []; add.forEach((x) => db.operator_actions.push(x)); db.opScanAdds = []; return json(add.length); }
        (db.opDecideCalls = db.opDecideCalls || []).push(a);
        const row = db.operator_actions.find((x) => x.id === a.p_id && x.status === 'proposed');
        if (db.opRefuse || !row) return json({ message: 'action not found or already decided' }, 400);
        row.status = a.p_status; return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } });
      }
      /* gym registration profile. gym_set_profile(p jsonb) takes ONE argument named p; the other two take none, so any body key is "function not found". */
      if (fn === 'gym_get_profile' || fn === 'gym_branding' || fn === 'gym_set_profile') {
        const want = fn === 'gym_set_profile' ? 'p' : '';
        if (Object.keys(a).sort().join() !== want || (want && (!a.p || typeof a.p !== 'object' || Array.isArray(a.p)))) {
          (db.rpcShapeErrors = db.rpcShapeErrors || []).push(fn);
          return route.fulfill({ status: 404, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ code: 'PGRST202', message: `Could not find the function public.${fn}(${Object.keys(a).sort().join(', ')}) in the schema cache`, details: null, hint: null }) });
        }
        const E = (message) => route.fulfill({ status: 400, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ message, code: '23514', details: null, hint: null }) });
        const pr = (db.gym_profile = db.gym_profile || { email: null, logo: null, signature: null });
        if (fn === 'gym_branding') return json({ logo: pr.logo, signature: pr.signature });
        if (role !== 'gym_admin') return route.fulfill({ status: 403, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ message: 'not allowed', code: '42501', details: null, hint: null }) });
        if (fn === 'gym_get_profile') return json({ email: pr.email, logo: pr.logo, signature: pr.signature, updated_at: null });
        const q = a.p, IMG = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/, MAP = /^https:\/\/(www\.google\.com\/maps|google\.com\/maps|maps\.google\.com|maps\.app\.goo\.gl|goo\.gl\/maps|g\.page)([/?]\S*)?$/;
        const ph = String(q.phone ?? '').replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '');
        if ('owner' in q && !(String(q.owner ?? '').trim().length >= 2 && String(q.owner).trim().length <= 80)) return E('bad owner name');
        if ('email' in q && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(q.email ?? '').trim())) return E('bad email');
        if ('phone' in q && !/^[6-9]\d{9}$/.test(ph)) return E('bad phone');
        if ('upi' in q && q.upi && !/^[A-Za-z0-9._-]{2,}@[A-Za-z]{2,}$/.test(q.upi)) return E('bad upi');
        if ('maps_url' in q && q.maps_url && !MAP.test(q.maps_url)) return E('bad map link');
        for (const k of ['logo', 'signature']) if (k in q && q[k] !== null && q[k] !== '') { if (typeof q[k] !== 'string' || !IMG.test(q[k])) return E('bad image'); if (q[k].length > (k === 'logo' ? 200000 : 150000)) return E('image too large'); }
        db.profileSetArgs = q; (db.profileSets = db.profileSets || []).push(q);
        const g = db.gyms[0];
        if ('owner' in q) g.owner_name = String(q.owner).trim(); if ('phone' in q) g.phone = ph; if ('upi' in q) g.upi_id = q.upi || null; if ('maps_url' in q) g.maps_url = q.maps_url || null;
        if ('email' in q) pr.email = String(q.email).trim().toLowerCase(); if ('logo' in q) pr.logo = q.logo || null; if ('signature' in q) pr.signature = q.signature || null;
        return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } });
      }
      /* social links and videos. social_view(p_gym default null) needs no argument; social_set / social_set_platform(p jsonb) take ONE argument named p.
         Addresses are checked against the CHECK patterns read from the real migration file, so this mock cannot drift from the database. The database would
         normalise a pasted address itself, but the app always sends the canonical one, so anything else reaching here is a client bug and is refused. */
      if (fn === 'social_view' || fn === 'social_set' || fn === 'social_set_platform') {
        const ks = Object.keys(a).sort().join(), shapeOk = fn === 'social_view' ? (ks === '' || ks === 'p_gym') : (ks === 'p' && a.p && typeof a.p === 'object' && !Array.isArray(a.p));
        if (!shapeOk) { (db.rpcShapeErrors = db.rpcShapeErrors || []).push(fn); return route.fulfill({ status: 404, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ code: 'PGRST202', message: `Could not find the function public.${fn}(${ks}) in the schema cache`, details: null, hint: null }) }); }
        const SE = (message, code = 'P0001', status = 400) => route.fulfill({ status, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ message, code, details: null, hint: null }) });
        const S = (db.social = db.social || { gym: null, platform: null });
        if (fn === 'social_view') { db.socialViews = (db.socialViews || 0) + 1; if (db.socialViewFail) return SE('could not read', 'XX000'); return json({ gym: role === 'super_admin' ? null : S.gym, platform: S.platform }); }
        if (role !== (fn === 'social_set' ? 'gym_admin' : 'super_admin')) return SE('not allowed', '42501', 403);
        if (fn === 'social_set' && db.gyms[0].lock_override === 'force_lock') return SE('gym is locked', '42501', 403);
        if (db.socialFail) return SE(db.socialFail);
        const q = a.p, nx = { whatsapp: null, instagram: null, facebook: null, youtube: null, videos: [], ...((fn === 'social_set' ? S.gym : S.platform) || {}) };
        for (const k of ['whatsapp', 'instagram', 'facebook', 'youtube']) if (k in q) { const v = q[k]; if (v === null) nx[k] = null; else if (typeof v === 'string' && SOC_CHK[k].test(v)) nx[k] = v; else return SE(`bad ${k} link`); }
        if ('videos' in q) {
          if (q.videos === null) nx.videos = [];
          else {
            if (!Array.isArray(q.videos)) return SE('bad video link'); if (q.videos.length > 12) return SE('too many videos');
            const out = [];
            for (const e of q.videos) { const id = e && typeof e === 'object' ? e.id : null, t = e && typeof e.title === 'string' ? e.title : ''; if (typeof id !== 'string' || !/^[A-Za-z0-9_-]{11}$/.test(id) || Array.from(t).length > 80 || /[\x01-\x1f\x7f]/.test(t) || t !== t.trim()) return SE('bad video link'); if (!out.some((o) => o.id === id)) out.push({ id, title: t }); }
            if (out.length > 6) return SE('too many videos'); nx.videos = out;
          }
        }
        nx.updated_at = new Date().toISOString(); (db.socialSets = db.socialSets || []).push({ fn, p: q });
        if (fn === 'social_set') S.gym = nx; else S.platform = nx;
        return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } });
      }
      if (fn === 'admin_update_gym') { Object.assign(db.gyms[0], { name: a.gym_name, owner_name: a.owner, phone: a.phone_no, city: a.city_name, upi_id: a.upi }); return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } }); }
      return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } });
    }
    if (p.startsWith('/storage/v1/object/authenticated/')) return route.fulfill({ status: 200, contentType: 'image/png', headers: { 'access-control-allow-origin': '*' }, body: PNG });
    if (p.startsWith('/storage/v1/object/member-photos/') && m === 'DELETE') { db.photoDeleted = p; return route.fulfill({ status: db.photoFail ? 500 : 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '{}' }); }
    if (p.startsWith('/storage/v1/object/member-photos/') && m === 'POST') { db.uploaded = p; return json({ Key: 'x' }); }
    const t = p.replace('/rest/v1/', ''), rows = db[t];
    if (!rows) return json({ message: 'nope' }, 404);
    if (t === 'member_fit' && m === 'POST') { const b = JSON.parse(req.postData()), ex = rows.find((x) => x.member_id === b.member_id); if (ex) Object.assign(ex, b); else rows.unshift({ ...b }); return json([ex || rows[0]], 201); }
    if (t === 'member_plans' && m === 'DELETE') { const id = u.searchParams.get('id').slice(3); const i = rows.findIndex((x) => x.id === id); if (i >= 0) rows.splice(i, 1); return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } }); }
    if (t === 'member_plans' && m === 'PATCH' && !u.searchParams.get('id')) { let r = rows; u.searchParams.forEach((v, k) => { if (v.startsWith('eq.')) r = r.filter((x) => String(x[k]) === v.slice(3)); }); r.forEach((x) => Object.assign(x, JSON.parse(req.postData()))); return json(r); }
    if (t === 'wa_settings' && m === 'POST') { const b = JSON.parse(req.postData()); if (rows[0]) Object.assign(rows[0], b); else rows.unshift({ ...b }); return json([rows[0]], 201); }
    if (m === 'DELETE') { const id = (u.searchParams.get('id') || '').slice(3); const i = rows.findIndex((x) => x.id === id); if (i >= 0) rows.splice(i, 1); return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } }); }
    if (m === 'GET') { let r = rows; u.searchParams.forEach((v, k) => { if (v.startsWith('eq.')) r = r.filter((x) => String(x[k]) === v.slice(3)); }); return json(r); }
    if (m === 'POST' && Array.isArray(JSON.parse(req.postData()))) { const out = JSON.parse(req.postData()).map((b) => ({ id: uid(), status: 'Active', ...b })); out.forEach((r) => rows.unshift(r)); db.bulk = out; return json(out, 201); }
    if (m === 'POST') {
      const b = JSON.parse(req.postData()), row = { id: uid(), ...b };
      if (t === 'invoices') { row.no = 'INV-' + String(rows.length + 1).padStart(4, '0'); row.date = today(); row.cancelled = false; }
      if (t === 'payments') { row.no = 'RCT-' + String(rows.length + 1).padStart(4, '0'); row.paid_on = today(); db.payment_ledger.push({ id: rows.length + 1, gym_id: db.G, seq: rows.length + 1, payment_id: row.id, no: row.no, member_id: row.member_id, amount: row.amount, method: row.method, paid_on: row.paid_on, prev_mac: 'x', mac: 'abcdef0123456789abcdef' }); }
      if (t === 'visits') { row.in_at = new Date().toISOString(); row.out_at = null; }
      if (t === 'members') { row.status = 'Active'; row.joined_on = today(); }
      if (t.startsWith('member_')) row.created_at = new Date().toISOString();
      rows.unshift(row); return json([row], 201);
    }
    if (m === 'PATCH') { const id = u.searchParams.get('id').slice(3), r = rows.find((x) => x.id === id); if (!r) return json([]); Object.assign(r, JSON.parse(req.postData())); return json([r]); }
    return json({}, 405);
  };
}
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
const server = http.createServer((q, s) => { const u = q.url.split('?')[0], f = path.join(PUB, u === '/' ? 'index.html' : u); if (!f.startsWith(PUB) || !fs.existsSync(f)) { s.writeHead(404); return s.end(); } s.writeHead(200, { 'content-type': f.endsWith('.js') ? 'text/javascript' : f.endsWith('.css') ? 'text/css' : f.endsWith('.webp') ? 'image/webp' : f.endsWith('.png') ? 'image/png' : f.endsWith('.webmanifest') ? 'application/manifest+json' : 'text/html' }); s.end(fs.readFileSync(f)); });

async function session(browser, role, fn, vp = { width: 1280, height: 800 }) {
  const db = makeDb(role), ctx = await browser.newContext({ viewport: vp, serviceWorkers: 'block' }), page = await ctx.newPage(), errs = [];
  page.on('pageerror', (e) => errs.push(e.message)); page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push(m.text()); });
  await ctx.route(SB + '/**', handler(db, role));
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  await fn(page, db);
  ok(errs.length === 0, `${role}: no page errors ${errs.join(' | ')}`);
  await ctx.close();
}
const login = async (page, pw = 'good') => { await page.fill('#l_email', 't@x.in'); await page.fill('#l_pass', pw); await page.click('#l_go'); };
const overflow = (page) => page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);

(async () => {
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const browser = await chromium.launch();

  console.log('login errors + gym admin flow');
  await session(browser, 'gym_admin', async (page, db) => {
    await page.waitForSelector('#loginForm');
    await login(page, 'bad'); await page.waitForSelector('.banner.bad');
    ok(/ग़लत|Wrong/.test(await page.textContent('.banner.bad')), 'wrong password shows a friendly error');
    await login(page); await page.waitForSelector('.tiles');
    ok(/Royal The Gym/.test(await page.textContent('#gymName')), 'dashboard loads with gym name');
    const nav = await page.$$eval('#nav a', (a) => a.length); ok(nav === 29, 'gym admin sees 29 menu items');
    await page.click('a[href="#members"]'); await page.waitForSelector('table.t');
    ok((await page.$$('table.t tbody tr')).length === 4, 'members list shows 4');
    await page.fill('#mq', 'priya'); await page.waitForFunction(() => document.querySelectorAll('table.t tbody tr').length === 1);
    ok(await page.evaluate(() => document.activeElement.id) === 'mq', 'search keeps focus while typing');
    await page.fill('#mq', '');
    await page.waitForFunction(() => document.querySelectorAll('table.t tbody tr').length === 4);
    // new member with auto invoice
    await page.click('[data-act=newMember]'); await page.fill('#f_name', 'Naya Sadasya'); await page.fill('#f_phone', '9999911111'); await page.selectOption('#f_plan_id', { index: 1 });
    await page.click('[data-ok]'); await page.waitForFunction(() => /Naya Sadasya/.test(document.body.innerText));
    ok(db.members.some((m) => m.name === 'Naya Sadasya' && m.end_date), 'member saved with end date from plan');
    ok(db.invoices.length === 2 && !('no' in db.invoices[0] && db.invoices[0].no === undefined), 'first invoice created');
    ok(!db.rpcShapeErrors, 'admit_member is called with the { p: {...} } body PostgREST needs');
    ok(db.admitCalls.length === 1 && db.admitCalls[0].bill === true && db.admitCalls[0].phone === '9999911111' && !!db.admitCalls[0].plan_id, 'admission goes through one admit_member call with the plan and the bill flag');
    ok(!db.calls.some((c) => /^POST \/rest\/v1\/(members|invoices)\b/.test(c)), 'member and first invoice are not written as separate requests');
    // a number added elsewhere after this form opened: the server refuses it and the message names the member
    await page.click('[data-act=newMember]'); await page.waitForSelector('#f_name');
    db.members.unshift({ id: uid(), gym_id: db.G, name: 'Late Joiner', phone: '9777700001', plan_id: null, start_date: null, end_date: null, status: 'Active', joined_on: today(), profile_id: null });
    await page.fill('#f_name', 'Dusra Sadasya'); await page.fill('#f_phone', '9777700001'); await page.click('[data-ok]');
    await page.waitForFunction(() => /Late Joiner/.test((document.querySelector('#toasts') || {}).innerText || ''));
    ok(!db.members.some((m) => m.name === 'Dusra Sadasya') && !!(await page.$('#f_name')), 'server duplicate-phone refusal names the existing member and keeps the form open');
    await page.keyboard.press('Escape'); db.members.shift();
    // renew with payment
    await page.click('tr.click:has-text("Rahul")'); await page.waitForSelector('[data-r]'); await page.click('[data-r]');
    await page.waitForSelector('#rn_sum'); ok(/1,?180/.test(await page.textContent('#rn_sum')), 'renew preview shows total with GST');
    const endBefore = db.members.find((m) => m.name === 'Rahul Sharma').end_date;
    await page.click('[data-ok]'); await page.waitForSelector('a.btn.wa');
    const rahul = db.members.find((m) => m.name === 'Rahul Sharma');
    ok(rahul.end_date > endBefore && db.payments.length === 1 && db.payments[0].amount === 1180, 'renewal extends membership and records full payment');
    ok(!db.rpcShapeErrors, 'renew_member is called with the { p: {...} } body PostgREST needs');
    ok(db.renewCalls.length === 1 && db.renewCalls[0].pay === 1180 && db.invoices.filter((i) => i.member_id === rahul.id).length === 2, 'renewal is one renew_member call: new invoice, new dates and payment together');
    await page.keyboard.press('Escape'); db.payments.length = 0; db.payment_ledger.length = 0;
    // the server fails: nothing is half-saved (no invoice, dates unchanged)
    { const invN = db.invoices.length, endNow = rahul.end_date; db.rpcDown = true;
      await page.click('tr.click:has-text("Rahul")'); await page.waitForSelector('[data-r]'); await page.click('[data-r]'); await page.waitForSelector('#rn_sum'); await page.click('[data-ok]');
      await page.waitForFunction(() => /Could not complete|नहीं हो सका/.test((document.querySelector('#toasts') || {}).innerText || ''));
      ok(db.invoices.length === invN && rahul.end_date === endNow && db.payments.length === 0, 'a failed renewal leaves no invoice, no payment and the same end date');
      db.rpcDown = false; await page.keyboard.press('Escape'); await page.keyboard.press('Escape'); }
    // invalid phone
    await page.click('[data-act=newMember]'); await page.fill('#f_name', 'X'); await page.fill('#f_phone', '123'); await page.click('[data-ok]');
    ok((await page.textContent('#e_phone')).length > 0, 'short phone rejected'); await page.keyboard.press('Escape');
    // birthdays: a future date of birth is refused; a valid one shows on the Reminders page with a WhatsApp greeting
    await page.click('[data-act=newMember]'); await page.fill('#f_name', 'Janam Din'); await page.fill('#f_phone', '9888877777'); await page.fill('#f_dob', addD(today(), 30)); await page.click('[data-ok]');
    ok((await page.textContent('#e_dob')).length > 0 && !db.members.some((m) => m.name === 'Janam Din'), 'future date of birth rejected');
    await page.fill('#f_dob', '1990' + addD(today(), 3).slice(4)); await page.selectOption('#f_referred_by', db.members.find((m) => m.name === 'Rahul Sharma').id); await page.click('[data-ok]'); await page.waitForFunction(() => /Janam Din/.test(document.body.innerText));
    ok(db.members.find((m) => m.name === 'Janam Din').dob === '1990' + addD(today(), 3).slice(4), 'date of birth saved on the member');
    await page.click('a[href="#reminders"]'); await page.waitForSelector('a[data-remind]');
    const bday = await page.$$eval('#view li', (l) => l.filter((x) => /Janam Din/.test(x.textContent) && /turns|साल के होंगे/.test(x.textContent)).map((x) => ({ t: x.textContent, a: (x.querySelector('a.wa') || {}).href })));
    ok(bday.length === 1 && /3 days|3 दिन/.test(bday[0].t) && /wa\.me\/919888877777/.test(bday[0].a) && /जन्मदिन|birthday/i.test(decodeURIComponent(bday[0].a)), 'birthday card lists the member with a WhatsApp greeting');
    ok(db.members.find((m) => m.name === 'Janam Din').referred_by === db.members.find((m) => m.name === 'Rahul Sharma').id, 'referrer saved on the member');
    const refs = await page.$$eval('#view li', (l) => l.filter((x) => /1 joined|1 जुड़े/.test(x.textContent) && /Rahul/.test(x.textContent) && /Janam Din/.test(x.textContent)).map((x) => (x.querySelector('a.wa') || {}).href));
    ok(refs.length === 1 && /wa\.me\/919876543210/.test(refs[0]), 'top referrers card lists Rahul with his referral and a WhatsApp thank-you');
    await page.click('a[href="#members"]'); await page.waitForSelector('[data-act=newMember]');
    // check-in
    await page.click('a[href="#checkin"]'); await page.fill('#cq', 'priya'); await page.waitForSelector('[data-act=checkIn]');
    await page.click('[data-act=checkIn]'); await page.waitForFunction(() => /Checked in|चेक-इन हो गया/.test(document.body.innerText));
    ok(db.visits.length === 2, 'check-in stored');
    await page.fill('#cq', 'old'); await page.waitForSelector('[data-act=checkIn][disabled]'); ok(true, 'expired member cannot check in');
    // payment (partial) -> receipt -> ledger
    await page.click('a[href="#invoices"]'); await page.waitForSelector('tr.click'); await page.click('tr.click:has-text("INV-0001")');
    await page.waitForSelector('[data-p]'); await page.click('[data-p]'); await page.fill('#f_amount', '2000'); await page.click('[data-ok]');
    ok((await page.textContent('#e_amount')).length > 0, 'overpayment rejected'); await page.fill('#f_amount', '500'); await page.focus('#f_amount');
    // two submits in the same tick: the second is ignored while the first save runs, so exactly one payment is stored
    await page.evaluate(() => { const f = document.querySelector('#mf'); const press = () => f.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true })); press(); press(); });
    await page.waitForSelector('a.btn.wa'); ok(/wa\.me\/919876543210/.test(await page.getAttribute('a.btn.wa', 'href')), 'receipt has WhatsApp link to member');
    ok(db.payments.length === 1 && db.payments[0].amount === 500, 'partial payment stored');
    await page.waitForSelector('#rcBox img', { timeout: 8000 }); ok(await page.$eval('#rcBox img', (i) => i.naturalWidth === 800 && i.naturalHeight === 1220), 'receipt image is generated with the logo layout');
    const dlp = page.waitForEvent('download'); await page.click('[data-dl]'); ok(/^RCT-\d{4}\.png$/.test((await dlp).suggestedFilename()), 'receipt downloads as PNG named by receipt number');
    await page.keyboard.press('Escape');
    await page.click('a[href="#ledger"]'); await page.waitForSelector('table.t'); await page.click('[data-act=verifyLedger]'); await page.waitForSelector('.banner.ok');
    ok(true, 'ledger verify shows OK banner');
    // retention + peak + settings
    await page.click('a[href="#retention"]'); await page.waitForSelector('.list');
    ok(/Absent Ajay/.test(await page.textContent('#view')), 'retention lists the absent member');
    await page.click('a[href="#dashboard"]'); await page.waitForSelector('#view a.wa[href^="https://wa.me/?text="]'); ok(/Last 7 days|पिछले 7 दिन/.test(await page.textContent('#view')), 'dashboard shows the last-7-days card with a share button');
    await page.click('a[href="#peak"]'); await page.waitForSelector('.heat'); ok(true, 'peak heatmap renders');
    await page.click('a[href="#settings"]'); await page.click('[data-act=editGym]'); await page.fill('#f_city', 'Jaipur'); await page.fill('#f_timings', 'Mon-Sat 5:30 AM - 10 PM'); await page.click('[data-ok]'); for (let i = 0; i < 20 && db.gyms[0].timings !== 'Mon-Sat 5:30 AM - 10 PM'; i++) await page.waitForTimeout(150); ok(db.gyms[0].timings === 'Mon-Sat 5:30 AM - 10 PM', 'gym timings saved');
    await page.waitForFunction(() => /Jaipur/.test(document.body.innerText)); ok(db.gyms[0].city === 'Jaipur', 'gym settings saved via RPC');
    // Google review link: only Google https links are accepted; a QR and a button appear
    await page.click('[data-act=editGym]'); await page.fill('#f_review', 'http://evil.example.com/x'); await page.click('[data-ok]');
    ok((await page.textContent('#e_review')).length > 0 && !db.gyms[0].review_url, 'non-Google or non-https review link rejected');
    await page.fill('#f_review', 'https://g.page/r/CabcDEF123/review'); await page.click('[data-ok]');
    await page.waitForSelector('.qrbox svg path'); ok(db.gyms[0].review_url === 'https://g.page/r/CabcDEF123/review', 'review link saved and a QR shows on the settings page');
    ok((await page.$$eval('#view a[href="https://g.page/r/CabcDEF123/review"]', (x) => x.length)) === 1, 'settings page links to the review page');
    // gym registration profile: owner details, Google location, logo and signature, saved through gym_set_profile
    await page.waitForSelector('[data-act=gymProfile]');
    ok(/3\/7/.test(await page.textContent('#view')), 'settings shows the registration checklist: owner, mobile and UPI done, 3 of 7');
    await page.click('[data-act=gymProfile]'); await page.waitForSelector('#fi_logo', { state: 'attached' });
    ok((await page.inputValue('#f_owner')) === 'Mahesh' && (await page.inputValue('#f_phone')) === '9785300123' && (await page.inputValue('#f_upi')) === '9785300123@okbizaxis', 'registration form opens with the saved owner, mobile and UPI');
    ok((await page.inputValue('#f_email')) === 't@x.in', 'owner email starts from the login email');
    ok(await page.$eval('#pv_logo', (i) => i.hidden) && await page.$eval('#rm_logo', (b) => b.hidden), 'no logo yet: the preview is hidden and there is nothing to remove');
    await page.fill('#f_email', 'nope'); await page.click('[data-ok]');
    ok((await page.textContent('#e_email')).length > 0 && !db.profileSetArgs, 'a bad email is refused before anything is sent');
    await page.fill('#f_email', 'Owner@Example.com'); await page.fill('#f_maps', 'http://evil.example.com/map'); await page.click('[data-ok]');
    ok((await page.textContent('#e_maps')).length > 0 && !db.profileSetArgs, 'a map link that is not Google https is refused');
    await page.fill('#f_maps', 'https://maps.app.goo.gl/AbC123'); await page.fill('#f_phone', '12345'); await page.click('[data-ok]');
    ok((await page.textContent('#e_phone')).length > 0 && !db.profileSetArgs, 'a short mobile number is refused');
    await page.fill('#f_phone', '+91 97853-00123'); await page.fill('#f_upi', 'abc'); await page.click('[data-ok]');
    ok((await page.textContent('#e_upi')).length > 0 && !db.profileSetArgs, 'a UPI id without @bank is refused');
    await page.fill('#f_upi', 'royal@okicici');
    // photos: a 1200x600 logo is shrunk to fit 400x400; text and svg files are turned away
    const bigPng = Buffer.from(await page.evaluate(async () => { const c = document.createElement('canvas'); c.width = 1200; c.height = 600; const x = c.getContext('2d'); x.fillStyle = '#c9a227'; x.fillRect(0, 0, 1200, 600); x.fillStyle = '#13264d'; x.fillRect(300, 150, 600, 300); const b = await new Promise((r) => c.toBlob(r, 'image/png')); const u = new Uint8Array(await b.arrayBuffer()); let s = ''; u.forEach((n) => { s += String.fromCharCode(n); }); return btoa(s); }), 'base64');
    await page.setInputFiles('#fi_logo', { name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('hello') });
    ok((await page.textContent('#e_logo')).length > 0 && await page.$eval('#pv_logo', (i) => i.hidden), 'a text file is refused as a logo');
    await page.setInputFiles('#fi_logo', { name: 'x.svg', mimeType: 'image/svg+xml', buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>') });
    ok((await page.textContent('#e_logo')).length > 0 && await page.$eval('#pv_logo', (i) => i.hidden), 'an svg file is refused as a logo');
    await page.setInputFiles('#fi_logo', { name: 'logo.png', mimeType: 'image/png', buffer: bigPng });
    await page.waitForFunction(() => { const i = document.querySelector('#pv_logo'); return i && !i.hidden && i.naturalWidth > 0; });
    const lsz = await page.$eval('#pv_logo', (i) => [i.naturalWidth, i.naturalHeight, i.src.slice(0, 15)]);
    ok(lsz[0] === 400 && lsz[1] === 200 && /^data:image\/(webp|png)/.test(lsz[2]) && (await page.textContent('#e_logo')) === '', 'the 1200x600 logo is shrunk to 400x200 and previewed');
    await page.setInputFiles('#fi_signature', { name: 'sign.png', mimeType: 'image/png', buffer: bigPng });
    await page.waitForFunction(() => { const i = document.querySelector('#pv_signature'); return i && !i.hidden && i.naturalWidth > 0; });
    ok(await page.$eval('#pv_signature', (i) => i.naturalWidth === 440 && i.naturalHeight === 220), 'the signature photo is shrunk to fit 600x220 and keeps its shape');
    await page.click('[data-ok]'); for (let i = 0; i < 30 && !db.profileSetArgs; i++) await page.waitForTimeout(150);
    const pa = db.profileSetArgs || {};
    ok(pa.owner === 'Mahesh' && pa.email === 'Owner@Example.com' && pa.phone === '9785300123' && pa.upi === 'royal@okicici' && pa.maps_url === 'https://maps.app.goo.gl/AbC123', 'one save sends owner, email, mobile, UPI and map link together, inside { p }');
    ok(/^data:image\/(webp|png);base64,/.test(pa.logo || '') && /^data:image\/(webp|png);base64,/.test(pa.signature || '') && !(db.rpcShapeErrors || []).some((x) => /gym_/.test(x)), 'the new logo and signature are sent as small image data and the call shape is right');
    ok(db.gyms[0].phone === '9785300123' && db.gyms[0].upi_id === 'royal@okicici' && db.gyms[0].maps_url === 'https://maps.app.goo.gl/AbC123' && db.gym_profile.email === 'owner@example.com' && !!db.gym_profile.logo && !!db.gym_profile.signature, 'the database holds the profile: mobile normalised, email lower-cased, both images stored');
    await page.waitForFunction(() => /7\/7/.test(document.body.innerText)); ok((await page.$$eval('#view a[href="https://maps.app.goo.gl/AbC123"]', (x) => x.length)) === 1 && (await page.$$('#view img.pthumb')).length === 2, 'settings now shows 7 of 7, the map link and both images');
    // the saved values come back when the form is opened again; a second save sends only what changed
    db.profileSetArgs = null; await page.click('[data-act=gymProfile]'); await page.waitForSelector('#fi_logo', { state: 'attached' });
    ok((await page.inputValue('#f_email')) === 'owner@example.com' && (await page.inputValue('#f_maps')) === 'https://maps.app.goo.gl/AbC123' && !(await page.$eval('#pv_logo', (i) => i.hidden)) && !(await page.$eval('#pv_signature', (i) => i.hidden)), 'reopening the form shows the saved email, map link, logo and signature');
    await page.fill('#f_upi', 'royal@okaxis'); await page.click('[data-ok]'); for (let i = 0; i < 30 && !db.profileSetArgs; i++) await page.waitForTimeout(150);
    ok(db.profileSetArgs && !('logo' in db.profileSetArgs) && !('signature' in db.profileSetArgs) && db.gyms[0].upi_id === 'royal@okaxis' && !!db.gym_profile.logo, 'a second save does not resend or touch the images');
    // the receipt carries the owner signature: a taller image
    await page.click('a[href="#payments"]'); await page.waitForSelector('[data-act=openReceipt]'); await page.click('[data-act=openReceipt]'); await page.waitForSelector('#rcBox img', { timeout: 8000 });
    ok(await page.$eval('#rcBox img', (i) => i.naturalWidth === 800 && i.naturalHeight === 1390), 'the receipt shows the owner signature block (taller image) when a signature is saved');
    await page.keyboard.press('Escape');
    // removing the signature takes it off the receipt again
    await page.click('a[href="#settings"]'); await page.waitForSelector('[data-act=gymProfile]'); await page.click('[data-act=gymProfile]'); await page.waitForSelector('#rm_signature', { state: 'attached' });
    db.profileSetArgs = null; await page.click('#rm_signature'); await page.click('[data-ok]'); for (let i = 0; i < 30 && !db.profileSetArgs; i++) await page.waitForTimeout(150);
    ok(db.profileSetArgs && db.profileSetArgs.signature === null && !('logo' in db.profileSetArgs) && db.gym_profile.signature === null && !!db.gym_profile.logo, 'removing the signature clears only the signature');
    await page.click('a[href="#payments"]'); await page.waitForSelector('[data-act=openReceipt]'); await page.click('[data-act=openReceipt]'); await page.waitForSelector('#rcBox img', { timeout: 8000 });
    ok(await page.$eval('#rcBox img', (i) => i.naturalWidth === 800 && i.naturalHeight === 1220), 'without a signature the receipt is back to the standard size');
    await page.keyboard.press('Escape'); await page.click('a[href="#settings"]'); await page.waitForSelector('[data-act=gymProfile]');
    // referral rewards: owner sets the reward, then gives it once after the referred member has paid
    await page.click('[data-act=editGym]'); await page.fill('#f_refdays', '400'); await page.click('[data-ok]'); await page.waitForTimeout(250);
    ok(!db.gyms[0].referral_reward_days, 'a referral reward of 400 days is refused');
    await page.fill('#f_refdays', '15'); await page.click('[data-ok]'); await page.waitForFunction(() => CTX.gym && CTX.gym.referral_reward_days === 15);
    ok(db.gyms[0].referral_reward_days === 15, 'owner switches on a 15 day referral reward');
    await page.click('a[href="#reminders"]'); await page.waitForSelector('a[data-remind]');
    ok(!(await page.$('[data-act=giveReward]')), 'no reward is offered before the friend has paid');
    const janam2 = db.members.find((m) => m.name === 'Janam Din'), refr = db.members.find((m) => m.name === 'Rahul Sharma'), rwdBefore = refr.end_date;
    db.payments.push({ id: uid(), gym_id: db.G, no: 'RCT-9', invoice_id: null, member_id: janam2.id, amount: 500, method: 'Cash', paid_on: today() });
    await page.evaluate(() => { bust('payments', 'members'); }); await page.click('a[href="#members"]'); await page.click('a[href="#reminders"]'); await page.waitForSelector('[data-act=giveReward]');
    await page.click('[data-act=giveReward]'); await page.click('[data-yes]'); await page.waitForFunction(() => !document.querySelector('[data-act=giveReward]'));
    ok(db.referral_rewards.length === 1 && db.referral_rewards[0].referrer_id === refr.id && db.referral_rewards[0].days === 15 && refr.end_date !== rwdBefore, 'reward is given once and the referrer\'s membership is extended');
    db.payments.splice(db.payments.findIndex((x) => x.no === 'RCT-9'), 1); await page.evaluate(() => bust('payments'));
    // bulk import
    await page.click('a[href="#members"]'); await page.waitForSelector('[data-act=importMembers]'); await page.click('[data-act=importMembers]');
    await page.fill('#f_text', 'Name, Phone, Plan, Start\nA One, 9111111111, Monthly, 01-10-2026\nB Two, 9222222222, Nope, 01-10-2026\nC Three, 12345, , \nRahul Dup, 9876543210, , ');
    await page.click('[data-ok]'); await page.waitForSelector('#imp_res .banner.bad');
    ok((await page.$$('#imp_res li')).length === 3 && !db.bulk, 'import reports every bad line and imports nothing');
    await page.fill('#f_text', 'A One, 98111 11111, Monthly, 01-10-2026\nB Two, 9222222222, , \n'); await page.click('[data-ok]'); await page.waitForFunction(() => !document.querySelector('#modals .md'));
    ok(db.bulk && db.bulk.length === 2 && db.bulk[0].end_date === '2026-10-31' && db.bulk[0].phone === '9811111111' && db.bulk[1].plan_id === null, 'valid rows imported with computed end date and cleaned phone');
    // pending dues on the reminders page
    await page.click('a[href="#reminders"]'); await page.waitForSelector('a[data-remind]');
    ok(/पूरी|बकाया|Pending dues/.test(await page.textContent('#view')) && (await page.$$eval('#view a.wa', (a) => a.filter((x) => /UPI/.test(decodeURIComponent(x.href)) && /बकाया/.test(decodeURIComponent(x.href))).length)) >= 1, 'reminders page lists pending dues with a WhatsApp message');
    // members CSV
    await page.click('a[href="#members"]'); await page.waitForSelector('[data-act=membersCsv]'); const dl = page.waitForEvent('download'); await page.click('[data-act=membersCsv]'); ok(/^members-\d{4}-\d{2}-\d{2}\.csv$/.test((await dl).suggestedFilename()), 'members CSV downloads');
    // member photo
    await page.click('a[href="#members"]'); await page.waitForSelector('tr.click'); await page.click('tr.click:has-text("Rahul")'); await page.waitForSelector('#phIn', { state: 'attached' });
    await page.setInputFiles('#phIn', { name: 'a.png', mimeType: 'image/png', buffer: PNG });
    await page.waitForSelector('#modals .av.has', { timeout: 8000 });
    const rah = db.members.find((m) => m.name === 'Rahul Sharma');
    ok(db.uploaded === `/storage/v1/object/member-photos/${db.G}/${rah.id}.jpg` && rah.photo_path === `${db.G}/${rah.id}.jpg`, 'photo uploaded to the gym folder and saved on the member');
    await page.keyboard.press('Escape'); await page.waitForSelector('table.t td .av.has'); ok(true, 'photo shows in the members list column');
    // WhatsApp reminders (2 days before)
    await page.context().route('https://wa.me/**', (r) => r.abort());
    await page.click('a[href="#reminders"]'); await page.waitForSelector('a[data-remind]');
    ok(/Priya/.test(await page.textContent('#view')) && !/Rahul/.test(await page.textContent('#view ul.list')), 'reminders list shows the member ending in 2 days only');
    const wl = decodeURIComponent(await page.getAttribute('a[data-remind]', 'href'));
    ok(/wa\.me\/919812345678/.test(wl) && /सदस्यता/.test(wl) && wl.includes('UPI: ' + db.gyms[0].upi_id), 'reminder opens WhatsApp with a ready Hindi message');
    ok((await page.textContent('#nav a[href="#reminders"] .n')) === '1', 'menu badge counts reminders due');
    await page.click('a[data-remind]', { force: true }); for (let i = 0; i < 20 && !db.members.find((m) => m.name === 'Priya Verma').reminded_on; i++) await page.waitForTimeout(150);
    ok(db.members.find((m) => m.name === 'Priya Verma').reminded_on === today(), 'sending marks the member as reminded today');
    // automatic WhatsApp page: settings, test, opt-out
    await page.click('a[href="#whatsapp"]'); await page.waitForSelector('[data-act=waSettings]');
    ok(/fee_receipt/.test(await page.textContent('#view')) && /membership_expiry/.test(await page.textContent('#view')) && /fee_due/.test(await page.textContent('#view')), 'WhatsApp page lists the three template names');
    ok(/अभी जुड़ा नहीं|Not connected yet/.test(await page.textContent('#view')), 'page shows WhatsApp is not connected yet');
    await page.click('[data-act=waSettings]'); await page.check('#f_auto_receipt'); await page.check('#f_auto_expiry'); await page.fill('#f_expiry_days', '3'); await page.check('#f_auto_dues'); await page.fill('#f_dues_every_days', '5');
    await page.click('[data-ok]'); for (let i = 0; i < 20 && !db.wa_settings.length; i++) await page.waitForTimeout(150);
    ok(db.wa_settings.length === 1 && db.wa_settings[0].auto_receipt === true && db.wa_settings[0].auto_expiry === true && db.wa_settings[0].auto_dues === true && db.wa_settings[0].expiry_days === 3 && db.wa_settings[0].dues_every_days === 5 && db.wa_settings[0].tpl_receipt === 'fee_receipt', 'automatic WhatsApp settings saved');
    await page.click('[data-act=waSettings]'); await page.fill('#f_tpl_dues', 'Bad Name!'); await page.click('[data-ok]');
    ok((await page.textContent('#e_tpl_dues')).length > 0, 'invalid template name rejected'); await page.keyboard.press('Escape');
    await page.click('[data-act=waTest]'); await page.fill('#f_phone', '9812345678'); await page.click('[data-ok]'); for (let i = 0; i < 20 && !(db.waCalls || []).some((c) => c.action === 'test'); i++) await page.waitForTimeout(150);
    ok((db.waCalls || []).some((c) => c.action === 'test' && c.phone === '9812345678'), 'test message request is sent to the dispatcher'); await page.keyboard.press('Escape');
    await page.evaluate((id) => memberForm(id), db.members[0].id); await page.waitForSelector('#f_wa_opt_out'); await page.check('#f_wa_opt_out'); await page.click('[data-ok]');
    for (let i = 0; i < 20 && !db.members[0].wa_opt_out; i++) await page.waitForTimeout(150);
    ok(db.members[0].wa_opt_out === true, 'member can be opted out of automatic WhatsApp');
    // owner's end-of-day summary on the dashboard
    await page.click('a[href="#dashboard"]'); await page.waitForSelector('#daySumText', { timeout: 8000 });
    ok(/वसूली/.test(await page.textContent('#daySumText')) && /बकाया/.test(await page.textContent('#daySumText')), 'dashboard shows the Hindi day summary (collection, dues, check-ins)');
    ok((db.sumCalls || 0) >= 1, 'summary is requested from the summary function');
    db.sumFail = true; await page.click('a[href="#members"]'); await page.click('a[href="#dashboard"]'); await page.waitForFunction(() => /उपलब्ध नहीं|not available/.test((document.querySelector('#daySum') || {}).innerText || ''), null, { timeout: 8000 }); ok(true, 'dashboard stays usable when the summary function fails'); db.sumFail = false;
    // diet + workout plans: body details -> generate -> review -> publish
    await page.evaluate((id) => memberModal(id), db.members[0].id); await page.waitForSelector('[data-fp]'); await page.click('[data-fp]'); await page.waitForSelector('[data-gen]');
    ok(await page.$eval('[data-gen]', (b) => b.disabled), 'Generate is disabled until body details are saved');
    await page.click('[data-fit]'); await page.fill('#f_age', '30'); await page.fill('#f_height_cm', '175'); await page.fill('#f_weight_kg', '80'); await page.fill('#f_age', '5'); await page.click('[data-ok]');
    ok((await page.textContent('#e_age')).length > 0, 'age outside 10-90 rejected'); await page.fill('#f_age', '30'); await page.click('[data-ok]');
    for (let i = 0; i < 20 && !db.member_fit.length; i++) await page.waitForTimeout(150);
    ok(db.member_fit.length === 1 && db.member_fit[0].age === 30 && db.member_fit[0].goal === 'fat_loss' && db.member_fit[0].gym_id === db.G, 'body details saved');
    await page.waitForSelector('[data-gen]:not([disabled])'); await page.click('[data-gen]'); await page.waitForSelector('[data-v]');
    ok(db.member_plans.length === 2 && db.member_plans.every((r) => r.status === 'draft'), 'two drafts created (diet and workout)');
    await page.click('li:has-text("Diet plan") [data-v], li:has-text("डाइट प्लान") [data-v]'); await page.waitForSelector('#planBody');
    const pb = await page.textContent('#planBody'); ok(/kcal|Calories|कैलोरी/.test(pb) && /Option A|विकल्प A/.test(pb), 'diet draft shows calories and meal options'); await page.keyboard.press('Escape');
    await page.click('[data-pub] >> nth=0'); await page.waitForFunction(() => document.querySelectorAll('[data-pub]').length === 1); await page.click('[data-pub]');
    for (let i = 0; i < 20 && db.member_plans.some((r) => r.status !== 'published'); i++) await page.waitForTimeout(150);
    ok(db.member_plans.filter((r) => r.status === 'published').length === 2, 'both plans published');
    await page.click('[data-unpub] >> nth=0'); for (let i = 0; i < 20 && db.member_plans.every((r) => r.status === 'published'); i++) await page.waitForTimeout(150);
    ok(db.member_plans.filter((r) => r.status === 'published').length === 1 && db.member_plans.filter((r) => r.status === 'archived').length === 1, 'a published plan can be taken back'); await page.waitForFunction(() => document.querySelectorAll('[data-v]').length === 1); await page.keyboard.press('Escape');
    // expenses + profit
    await db.payments.push({ id: uid(), gym_id: db.G, member_id: db.members[0].id, amount: 5000, method: 'Cash', paid_on: today(), no: 'RCT-X' });
    await page.evaluate(() => bust('payments')); await page.click('a[href="#expenses"]'); await page.waitForSelector('[data-act=newExpense]');
    await page.waitForFunction(() => /5,500/.test(document.querySelector('.tiles').innerText));
    ok(/5,500/.test(await page.textContent('.tiles')), 'expenses page shows fees collected');
    await page.click('[data-act=newExpense] >> nth=0'); await page.fill('#f_item', 'Bijli bill'); await page.selectOption('#f_category', 'Electricity'); await page.fill('#f_amount', '1200'); await page.click('[data-ok]');
    await page.waitForFunction(() => /Bijli bill/.test(document.body.innerText));
    ok(db.expenses.length === 1 && db.expenses[0].category === 'Electricity' && Number(db.expenses[0].amount) === 1200 && db.expenses[0].gym_id === db.G, 'expense saved with category and amount');
    ok(/4,300/.test(await page.textContent('.tiles')), 'profit = collected minus expenses');
    await page.click('[data-act=newExpense] >> nth=0'); await page.fill('#f_item', 'x'); await page.fill('#f_amount', '0'); await page.click('[data-ok]');
    ok(db.expenses.length === 1, 'zero amount is rejected'); await page.keyboard.press('Escape');
    await page.click('[data-act=delExpense]'); await page.click('[data-yes]'); await page.waitForFunction(() => !/Bijli bill/.test(document.body.innerText));
    ok(db.expenses.length === 0, 'expense deleted after confirmation');
    // staff payroll: add person, part-pay, overpay refused, bonus, profit counts it, history delete, cannot delete person with history
    await page.click('a[href="#staff"]'); await page.waitForSelector('[data-act=newStaff]');
    await page.click('[data-act=newStaff] >> nth=0'); await page.fill('#f_name', 'Vikram Trainer'); await page.fill('#f_monthly_salary', '12000'); await page.click('[data-ok]');
    await page.waitForFunction(() => /Vikram Trainer/.test(document.body.innerText));
    ok(db.staff_members.length === 1 && Number(db.staff_members[0].monthly_salary) === 12000 && db.staff_members[0].active === true && db.staff_members[0].gym_id === db.G, 'staff member saved with salary');
    ok(/12,000/.test(await page.textContent('.tiles')), 'payroll tile shows total monthly salary');
    await page.click('[data-act=payStaff]'); await page.fill('#f_amount', '5000'); await page.click('[data-ok]');
    await page.waitForFunction(() => /Part paid|आंशिक/.test(document.body.innerText));
    ok(db.salary_payments.length === 1 && db.salary_payments[0].kind === 'salary' && Number(db.salary_payments[0].amount) === 5000 && db.salary_payments[0].month === today().slice(0, 7), 'salary payment saved for the month');
    await page.click('[data-act=payStaff]'); await page.fill('#f_amount', '8000'); await page.click('[data-ok]');
    ok(db.salary_payments.length === 1 && /7,000/.test(await page.textContent('.md')), 'paying more than the balance as salary is refused'); await page.selectOption('#f_kind', 'bonus'); await page.fill('#f_amount', '1000'); await page.click('[data-ok]');
    await page.waitForFunction(() => !document.querySelector('.md'));
    ok(db.salary_payments.length === 2 && db.salary_payments[0].kind === 'bonus', 'extra money can be given as bonus');
    await page.click('a[href="#expenses"]'); await page.waitForSelector('[data-act=newExpense]');
    await page.waitForFunction(() => /6,000/.test(document.querySelector('.tiles').innerText));
    ok(/6,000/.test(await page.textContent('.tiles')) && /5,500/.test(await page.textContent('.tiles')), 'salaries paid are counted as expenses on the profit page');
    { const [dl] = await Promise.all([page.waitForEvent('download'), page.click('[data-act=booksCsv]')]); const txt = fs.readFileSync(await dl.path(), 'utf8');
      ok(/Fee/.test(txt) && /Salary/.test(txt) && /Vikram Trainer/.test(txt) && /TOTAL,,,,5500,6000/.test(txt) && /NET,,,,-500,/.test(txt), 'accountant CSV lists fees and salaries with totals'); }
    await page.click('a[href="#staff"]'); await page.waitForSelector('[data-act=staffHist]'); await page.click('[data-act=staffHist]'); await page.waitForSelector('[data-act=delSalPay]');
    ok((await page.$$('[data-act=delSalPay]')).length === 2, 'history lists both payments');
    await page.click('[data-act=delSalPay] >> nth=0'); await page.click('[data-yes]'); await page.waitForFunction(() => !document.querySelector('.md'));
    await page.click('[data-act=editStaff]'); await page.waitForSelector('[data-act=delStaff]'); await page.click('[data-act=delStaff]');
    ok(db.staff_members.length === 1, 'a person with payment history is not deleted'); await page.keyboard.press('Escape');
    await page.click('[data-act=staffHist]'); await page.waitForSelector('[data-act=delSalPay]'); await page.click('[data-act=delSalPay]'); await page.click('[data-yes]'); await page.waitForFunction(() => !document.querySelector('.md'));
    ok(db.salary_payments.length === 0, 'payment deleted after confirmation');
    await page.click('[data-act=editStaff]'); await page.waitForSelector('[data-act=delStaff]'); await page.click('[data-act=delStaff]'); await page.click('[data-yes]');
    await page.waitForFunction(() => !/Vikram Trainer/.test(document.body.innerText));
    ok(db.staff_members.length === 0, 'person without history can be deleted');
    // member progress, staff side
    await page.evaluate((id) => memberModal(id), db.members[0].id); await page.waitForSelector('[data-pg]'); await page.click('[data-pg]'); await page.waitForSelector('[data-act=addProgress]');
    await page.click('[data-act=addProgress]'); await page.fill('#f_weight_kg', '82.5'); await page.fill('#f_waist_cm', '96'); await page.click('[data-ok]');
    await page.waitForFunction(() => /82\.5/.test(document.body.innerText));
    ok(db.member_progress.length === 1 && db.member_progress[0].by_member === false && Number(db.member_progress[0].weight_kg) === 82.5 && db.member_progress[0].member_id === db.members[0].id, 'staff can record a member\'s measurements');
    await page.click('[data-act=addProgress]'); await page.fill('#f_note', 'only a note'); await page.click('[data-ok]'); await page.waitForTimeout(250);
    ok(db.member_progress.length === 1, 'an entry with no measurement is refused');
    await page.fill('#f_weight_kg', '10'); await page.click('[data-ok]'); await page.waitForTimeout(250);
    ok(db.member_progress.length === 1, 'an impossible weight is refused'); await page.keyboard.press('Escape');
    await page.click('[data-act=delProgress]'); await page.click('[data-yes]'); await page.waitForFunction(() => !/82\.5/.test(document.body.innerText));
    ok(db.member_progress.length === 0, 'staff can delete an entry'); await page.keyboard.press('Escape');
    // workouts, staff side: read-only view of what the member logged
    db.member_workouts.push({ id: uid(), gym_id: db.G, member_id: db.members[0].id, done_on: today(), exercise: 'Deadlift', sets: 3, reps: 5, weight_kg: 120, note: null });
    await page.evaluate((id) => memberModal(id), db.members[0].id); await page.waitForSelector('[data-wk]'); await page.click('[data-wk]'); await page.waitForFunction(() => /Deadlift/.test(document.body.innerText) && /120 kg × 5/.test(document.body.innerText));
    ok(!(await page.$('[data-act=delWorkout]')) && !(await page.$('[data-act=addWorkout]')), 'staff see the member\'s workouts but cannot add or delete entries'); await page.keyboard.press('Escape'); db.member_workouts.length = 0;
    // habits, staff side: read-only
    db.member_water.push({ id: uid(), gym_id: db.G, member_id: db.members[0].id, drunk_on: today(), amount_ml: 500, created_at: new Date().toISOString() });
    await page.evaluate((id) => memberModal(id), db.members[0].id); await page.waitForSelector('[data-wl]'); await page.click('[data-wl]'); await page.waitForFunction(() => /0\.5 L/.test(document.body.innerText));
    ok(!(await page.$('[data-act=waterAdd]')) && !(await page.$('[data-act=delHabit]')) && !(await page.$('[data-act=quickFood]')), 'staff see the habits but cannot add or delete'); await page.keyboard.press('Escape'); db.member_water.length = 0;
    // trainer assignment
    const TR = uid(); db.profiles.push({ id: TR, gym_id: db.G, role: 'trainer', full_name: 'Coach Anil', email: 'a@x.in', created_at: new Date().toISOString() }); await page.evaluate(() => bust('profiles'));
    await page.click('a[href="#members"]'); await page.waitForSelector('[data-key=memT]');
    await page.evaluate((id) => memberForm(id), db.members[0].id); await page.waitForSelector('#f_trainer_id');
    ok(/Coach Anil/.test(await page.textContent('#f_trainer_id')), 'owner can pick a trainer from the gym\'s trainers'); await page.selectOption('#f_trainer_id', TR); await page.click('[data-ok]'); await page.waitForFunction(() => !document.querySelector('.md'));
    ok(db.members[0].trainer_id === TR, 'trainer assignment is saved');
    db.members[0].trainer_name = 'Coach Anil'; await page.evaluate(() => { bust('members'); render(); }); await page.waitForFunction(() => /Coach Anil/.test(document.querySelector('#view').innerText));
    await page.click('[data-key=memT][data-v=mine]'); await page.waitForFunction(() => !/Coach Anil/.test(document.querySelector('#view').innerText));
    ok(true, 'My members filter hides members of other trainers');
    await page.click('[data-key=memT][data-v=all]');
    // classes, staff side
    await page.click('a[href="#classes"]'); await page.waitForSelector('[data-act=newClass]'); await page.click('[data-act=newClass] >> nth=0');
    await page.fill('#f_title', 'Yoga Test'); await page.fill('#f_capacity', '1'); await page.fill('#f_date', addD(today(), 1)); await page.fill('#f_time', '07:00'); await page.selectOption('#f_weeks', '2'); await page.click('[data-ok]');
    await page.waitForFunction(() => /Yoga Test/.test(document.querySelector('#view').innerText));
    ok(db.gym_classes.length === 2 && db.gym_classes[0].starts_at.endsWith('T07:00:00+05:30') && Math.abs(new Date(db.gym_classes[0].starts_at) - new Date(db.gym_classes[1].starts_at)) === 7 * 864e5, 'a class can be repeated weekly');
    await page.click('[data-act=newClass] >> nth=0'); await page.fill('#f_title', 'Past'); await page.fill('#f_date', addD(today(), -1)); await page.click('[data-ok]'); await page.waitForTimeout(250);
    ok(db.gym_classes.length === 2, 'a class in the past is refused'); await page.keyboard.press('Escape');
    await page.click('[data-act=clsBookings] >> nth=0'); await page.waitForSelector('#clsAdd'); const priya = db.members.find((x) => x.name === 'Priya Verma'); await page.selectOption('#clsAdd', priya.id); await page.click('#clsAddBtn');
    await page.waitForFunction(() => !document.querySelector('#clsAdd') && /Priya Verma/.test(document.querySelector('.md').innerText));
    ok(db.class_bookings.length === 1 && db.class_bookings[0].member_id === db.members.find((x) => x.name === 'Priya Verma').id, 'staff can book a member into a class');
    ok(!(await page.$('#clsAdd')), 'a full class offers no more booking'); await page.keyboard.press('Escape'); await page.waitForFunction(() => !document.querySelector('.md')); await page.waitForTimeout(300);
    await page.click('[data-act=cancelClass] >> nth=0'); await page.click('[data-yes]'); await page.waitForFunction(() => /Cancelled|रद्द/.test(document.querySelector('#view').innerText));
    ok(db.gym_classes.filter((c) => c.cancelled_at).length === 1, 'staff can cancel a class');
    await page.waitForSelector('.md a.btn.wa'); { const href = await page.getAttribute('.md a.btn.wa', 'href'); ok(/wa\.me/.test(href) && /Yoga%20Test|योगा|Yoga/.test(decodeURIComponent(href)) , 'cancelling a class offers a WhatsApp message to each booked member'); } await page.keyboard.press('Escape');
    // staff tasks
    await page.click('a[href="#tasks"]'); await page.waitForSelector('[data-act=newTask]'); await page.click('[data-act=newTask] >> nth=0');
    await page.fill('#f_title', 'Restock whey'); await page.selectOption('#f_priority', 'High'); await page.fill('#f_due_on', addD(today(), -1)); await page.click('[data-ok]');
    await page.waitForFunction(() => /Restock whey/.test(document.querySelector('#view').innerText));
    ok(db.gym_tasks.length === 1 && db.gym_tasks[0].priority === 'High' && !db.gym_tasks[0].done_at, 'a task can be added');
    ok(/Overdue|देर/.test(await page.textContent('#view')), 'a task past its date shows as overdue');
    await page.click('[data-act=toggleTask]'); await page.waitForFunction(() => !/Restock whey/.test(document.querySelector('#view').innerText));
    ok(!!db.gym_tasks[0].done_at, 'a task can be marked done');
    await page.click('[data-key=tkF][data-v=done]'); await page.waitForSelector('[data-act=toggleTask]'); await page.click('[data-act=toggleTask]'); await page.waitForFunction(() => !document.querySelector('[data-act=toggleTask]'));
    ok(!db.gym_tasks[0].done_at, 'a done task can be reopened');
    await page.click('[data-key=tkF][data-v=open]'); await page.waitForSelector('[data-act=editTask]'); await page.click('[data-act=editTask]'); await page.waitForSelector('[data-act=delTask]'); await page.click('[data-act=delTask]'); await page.click('[data-yes]');
    await page.waitForFunction(() => !/Restock whey/.test(document.querySelector('#view').innerText));
    ok(db.gym_tasks.length === 0, 'the owner can delete a task');
    // equipment register: add with a service schedule, overdue shows, serviced today clears it
    await page.click('a[href="#equipment"]'); await page.waitForSelector('[data-act=newEq]'); await page.click('[data-act=newEq] >> nth=0');
    await page.fill('#f_name', 'Treadmill 1'); await page.fill('#f_service_every_days', '90'); await page.fill('#f_last_service_on', addD(today(), -100)); await page.click('[data-ok]');
    await page.waitForFunction(() => /Treadmill 1/.test(document.querySelector('#view').innerText));
    ok(db.gym_equipment.length === 1 && db.gym_equipment[0].service_every_days === 90, 'equipment saved with a service schedule');
    ok(/overdue by 10 days|10 दिन से बाक़ी/.test(await page.textContent('#view')), 'service overdue shows how many days');
    await page.click('[data-act=newEq] >> nth=0'); await page.fill('#f_name', 'Cable'); await page.fill('#f_last_service_on', addD(today(), 3)); await page.click('[data-ok]');
    ok((await page.textContent('#e_last_service_on')).length > 0 && db.gym_equipment.length === 1, 'a future service date is refused'); await page.keyboard.press('Escape');
    await page.click('[data-act=eqServiced]'); for (let i = 0; i < 30 && db.gym_equipment[0].last_service_on !== today(); i++) await page.waitForTimeout(100);
    ok(db.gym_equipment[0].last_service_on === today(), 'serviced today updates the last service date');
    await page.waitForFunction(() => /Next service|अगली सर्विस/.test(document.querySelector('#view').innerText)); ok(!/overdue by|दिन से बाक़ी/.test(await page.textContent('#view')), 'overdue clears after service');
    // membership freeze: owner freezes, the member cannot check in, unfreezing moves the end date by the days frozen
    await page.click('a[href="#members"]'); await page.waitForSelector('tr.click'); await page.click('tr.click:has-text("Absent Ajay")'); await page.waitForSelector('[data-fz]');
    const ajay = db.members.find((x) => x.name === 'Absent Ajay'), endBefore2 = ajay.end_date;
    await page.click('[data-fz]'); await page.fill('#f_reason', 'Travelling'); await page.click('[data-ok]');
    for (let i = 0; i < 30 && ajay.status !== 'Frozen'; i++) await page.waitForTimeout(100);
    ok(ajay.status === 'Frozen' && db.member_freezes.length === 1 && db.member_freezes[0].reason === 'Travelling', 'owner can freeze a running membership');
    await page.waitForFunction(() => [...document.querySelectorAll('tr.click')].some((r) => /Absent Ajay/.test(r.innerText) && /Frozen|फ़्रोज़न|फ्रीज़|फ़्रीज़/.test(r.innerText)));
    await page.click('a[href="#checkin"]'); await page.waitForSelector('#scanIn'); const nF = db.visits.length; await page.fill('#scanIn', 'gymos:' + ajay.id); await page.keyboard.press('Enter'); await page.waitForTimeout(400);
    ok(db.visits.length === nF, 'a frozen member cannot be checked in');
    await page.click('a[href="#members"]'); await page.waitForSelector('tr.click'); await page.click('tr.click:has-text("Absent Ajay")'); await page.waitForSelector('[data-uf]'); await page.click('[data-uf]'); await page.waitForSelector('[data-yes]');
    ok(/5/.test(await page.textContent('#modals .md')) && !(await page.$('[data-fz]')), 'unfreeze asks first and shows how many days will be added');
    await page.click('[data-yes]'); for (let i = 0; i < 30 && ajay.status !== 'Active'; i++) await page.waitForTimeout(100);
    ok(ajay.status === 'Active' && ajay.end_date === addD(endBefore2, 5), 'unfreezing moves the end date by the frozen days'); await page.waitForFunction(() => !document.querySelector('#modals .md'));
    // QR check-in (barcode-scanner box): check in, check out, refuse expired and foreign codes
    await page.click('a[href="#checkin"]'); await page.waitForSelector('#scanIn');
    { const pr = db.members.find((x) => x.name === 'Absent Ajay'), old = db.members.find((x) => x.name === 'Old Timer'), n0 = db.visits.length, scan = async (code) => { await page.fill('#scanIn', code); await page.press('#scanIn', 'Enter'); await page.waitForTimeout(500); };
      await scan('gymos:' + pr.id); ok(db.visits.length === n0 + 1 && db.visits[0].member_id === pr.id && !db.visits[0].out_at, 'scanning a pass checks the member in');
      await page.waitForSelector('#scanIn'); await scan('gymos:' + pr.id); ok(db.visits.length === n0 + 1 && !db.visits.find((v) => v.member_id === pr.id).out_at, 'a second scan within 2 minutes is a repeat, not a check-out');
      db.visits.find((v) => v.member_id === pr.id).in_at = new Date(Date.now() - 180000).toISOString();
      await page.waitForSelector('#scanIn'); await scan('gymos:' + pr.id); ok(db.visits.length === n0 + 1 && !!db.visits.find((v) => v.member_id === pr.id).out_at, 'after 2 minutes, a scan checks the member out');
      await page.waitForSelector('#scanIn'); await scan('gymos:' + old.id); ok(db.visits.length === n0 + 1, 'an expired member is not checked in by a scan');
      await page.waitForSelector('#scanIn'); await scan('hello'); await scan('gymos:' + uid()); ok(db.visits.length === n0 + 1, 'unknown and foreign codes are refused'); }
    // offline check-in: the scan waits on this device (the roster was saved by the scans above), then syncs when the line returns
    { const m0 = db.members.find((x) => x.status === 'Active' && x.end_date && x.end_date >= today() && !db.visits.some((v) => v.member_id === x.id)), nB = db.visits.length;
      await page.waitForSelector('#scanIn'); db.offline = true;
      await page.fill('#scanIn', 'gymos:' + m0.id); await page.press('#scanIn', 'Enter'); await page.waitForTimeout(700);
      const queued = await page.evaluate(() => localStorage.getItem('gymos-checkin-outbox'));
      ok(db.visits.length === nB && !!queued && /इस डिवाइस पर सेव|saved on this device/.test(await page.textContent('body')), 'offline: the scan waits on this device and nothing is lost');
      ok(/\bSync now\b|अभी सिंक करें/.test(await page.textContent('body')), 'offline: the check-in page shows the waiting scan and a sync button');
      db.offline = false;
      await page.evaluate(() => window.dispatchEvent(new Event('online')));
      for (let i = 0; i < 40 && db.visits.length === nB; i++) await page.waitForTimeout(100);
      ok(db.visits.length === nB + 1 && db.visits[0].member_id === m0.id, 'back online: the queued check-in is written to the server, once');
      ok((await page.evaluate(() => localStorage.getItem('gymos-checkin-outbox'))) === null, 'and the device queue is empty afterwards'); }
    // trainer commission
    const got = db.payments.filter((x) => x.member_id === db.members[0].id && String(x.paid_on).slice(0, 7) === today().slice(0, 7)).reduce((a, x) => a + Number(x.amount), 0);
    await page.evaluate(() => bust('payments', 'members')); await page.click('a[href="#staff"]'); await page.waitForSelector('[data-act=setCommission]');
    ok(/Coach Anil/.test(await page.textContent('#view')), 'commission card lists the trainer');
    await page.click('[data-act=setCommission]'); await page.fill('#f_pct', '10'); await page.click('[data-ok]'); await page.waitForFunction(() => /10%/.test(document.querySelector('#view').innerText));
    ok(db.trainer_commission.length === 1 && Number(db.trainer_commission[0].pct) === 10 && db.trainer_commission[0].trainer_id === TR, 'commission rate saved for the trainer');
    ok((await page.textContent('#view')).replace(/,/g, '').includes(String(Math.round(got / 10))), 'commission = rate x fees from the trainer\'s members');
    await page.click('[data-act=setCommission]'); await page.fill('#f_pct', '150'); await page.click('[data-ok]'); await page.waitForTimeout(250);
    ok(Number(db.trainer_commission[0].pct) === 10, 'a rate above 100% is refused'); await page.keyboard.press('Escape');
    // leads: add, follow up, convert to member
    await page.click('a[href="#leads"]'); await page.waitForSelector('[data-act=newLead]'); await page.click('[data-act=newLead] >> nth=0');
    await page.fill('#f_name', 'Vikram Lead'); await page.fill('#f_phone', '98123'); await page.click('[data-ok]');
    ok((await page.textContent('#e_phone')).length > 0, 'short lead phone rejected'); await page.fill('#f_phone', '9811122233'); await page.fill('#f_follow_up_on', today()); await page.click('[data-ok]');
    await page.waitForFunction(() => /Vikram Lead/.test(document.body.innerText));
    ok(db.leads.length === 1 && db.leads[0].stage === 'New' && db.leads[0].source === 'Walk-in', 'lead saved as New');
    ok(/1/.test(await page.textContent('.tiles .card:nth-child(3) .v')), 'lead due today is counted');
    ok(/wa\.me\/919811122233/.test(await page.$eval('table.t a[href*="wa.me"]', (a) => a.href)), 'WhatsApp button opens the lead chat');
    await page.click('[data-act=leadNext]'); await page.waitForFunction(() => /Contacted|संपर्क हुआ/.test(document.querySelector('table.t tbody').innerText));
    ok(db.leads[0].stage === 'Contacted', 'lead moved to Contacted');
    await page.click('[data-act=leadConvert]'); await page.waitForSelector('#f_name');
    ok((await page.inputValue('#f_name')) === 'Vikram Lead' && (await page.inputValue('#f_phone')) === '9811122233', 'member form is prefilled from the lead');
    await page.click('[data-ok]'); for (let i = 0; i < 25 && db.leads[0].stage !== 'Converted'; i++) await page.waitForTimeout(150);
    const nm = db.members.find((x) => x.name === 'Vikram Lead');
    ok(!!nm && db.leads[0].stage === 'Converted' && db.leads[0].converted_member_id === nm.id, 'lead marked Converted only after the member exists');
    // enquiries from the website: dashboard nudge, a tile, the share link with QR, WhatsApp share
    db.leads.unshift({ id: uid(), gym_id: db.G, name: 'Web Walkin', phone: '9555500001', source: 'Website', stage: 'New', interest: 'Weight loss', note: null, follow_up_on: null, created_at: new Date().toISOString() });
    await page.evaluate(() => { LEADS_AT = 0; location.hash = 'dashboard'; }); await page.waitForSelector('a.banner[href="#leads"]');
    ok(/1/.test(await page.textContent('a.banner[href="#leads"]')), 'dashboard shows a banner for the new website enquiry');
    await page.evaluate(() => { LEADS_AT = 0; location.hash = 'leads'; });
    await page.waitForFunction(() => /Web Walkin/.test(document.body.innerText));
    ok((await page.textContent('.tiles .card:nth-child(1) .v')).trim() === '1', 'Leads tile counts new website enquiries');
    const enqUrl = `http://127.0.0.1:${server.address().port}/?enquire=${db.G}`;
    ok((await page.inputValue('#enqUrl')) === enqUrl && !!(await page.$('.qrbox svg')), 'Leads page shows the gym enquiry link with a QR');
    ok((await page.$eval('a.btn.wa[href*="wa.me/?text="]', (a) => decodeURIComponent(a.href))).includes(enqUrl), 'WhatsApp share carries the enquiry link');
    // store / POS: add product, sell, stock goes down, oversell refused, cancel restores stock, profit page counts store profit
    await page.click('a[href="#store"]'); await page.waitForSelector('[data-act=newProduct]'); await page.click('[data-act=newProduct] >> nth=0');
    await page.fill('#f_name', 'Whey 1kg'); await page.fill('#f_price', '3000'); await page.fill('#f_cost', '2200'); await page.fill('#f_stock', '5'); await page.click('[data-ok]');
    await page.waitForSelector('[data-act=sellProduct]:not([disabled])');
    ok(db.products.length === 1 && db.products[0].stock === 5 && db.products[0].gym_id === db.G, 'product added with stock');
    ok(db.product_costs[0].cost === 2200 && db.products[0].cost === 0, 'cost price saved only in the owner-only table');
    await page.click('[data-act=editProduct]'); await page.waitForSelector('#f_cost'); ok((await page.inputValue('#f_cost')) === '2200', 'edit form shows the saved cost price'); await page.fill('#f_stock', '6'); await page.fill('#f_stock', '5'); await page.keyboard.press('Escape');
    await page.click('[data-act=sellProduct]'); await page.fill('#f_qty', '9'); await page.click('[data-ok]');
    ok((await page.textContent('#e_qty')).length > 0 && db.sales.length === 0, 'selling more than the stock is refused'); await page.fill('#f_qty', '2'); await page.selectOption('#f_member', { index: 1 }); await page.click('[data-ok]');
    for (let i = 0; i < 20 && !db.sales.length; i++) await page.waitForTimeout(150);
    ok(db.sale_costs[0].unit_cost === 2200 && db.sales.length === 1 && db.sales[0].total === 6000 && db.products[0].stock === 3 && db.lastSaleArgs.p_member === db.members[0].id, 'sale recorded, stock reduced to 3, member linked');
    await page.waitForFunction(() => /6,000/.test(document.querySelector('.tiles').innerText));
    await page.click('[data-act=voidSale]'); await page.click('[data-yes]'); for (let i = 0; i < 20 && db.products[0].stock !== 5; i++) await page.waitForTimeout(150);
    ok(db.sales[0].voided_at && db.products[0].stock === 5, 'cancelled sale puts the stock back');
    await page.click('[data-act=sellProduct]'); await page.fill('#f_qty', '1'); await page.click('[data-ok]'); for (let i = 0; i < 20 && db.sales.length < 2; i++) await page.waitForTimeout(150);
    await page.click('a[href="#expenses"]'); await page.waitForSelector('[data-act=newExpense]'); await page.waitForFunction(() => /800/.test(document.querySelector('.tiles').innerText));
    ok(true, 'profit page shows store profit (3000 - 2200 = 800), cancelled sale ignored');
    // offers
    await page.click('a[href="#offers"]'); await page.waitForSelector('[data-act=newOffer]'); await page.click('[data-act=newOffer]');
    await page.fill('#f_name', 'Diwali 10%'); await page.fill('#f_value', '10'); await page.click('[data-ok]'); await page.waitForFunction(() => /Diwali 10%/.test(document.body.innerText));
    ok(db.offers.length === 1 && db.offers[0].kind === 'percent' && db.offers[0].active === true, 'offer created');
    await page.click('[data-act=newOffer]'); await page.fill('#f_name', 'Bad one'); await page.fill('#f_value', '150'); await page.click('[data-ok]');
    ok((await page.textContent('#e_value')).length > 0, 'percent over 100 rejected'); await page.keyboard.press('Escape');
    await page.click('a[href="#members"]'); await page.waitForSelector('tr.click'); await page.click('tr.click:has-text("Priya")'); await page.waitForSelector('[data-r]'); await page.click('[data-r]');
    await page.selectOption('#f_offer', { index: 1 }); await page.waitForFunction(() => document.querySelector('#f_discount').value === '100');
    ok(/1,?062/.test(await page.textContent('#rn_sum')), 'choosing an offer fills the discount and updates the total');
    await page.click('[data-ok]'); await page.waitForSelector('a.btn.wa');
    const oi = db.invoices[0]; ok(oi.discount === 100 && oi.items.some((i) => /Offer: Diwali/.test(i.label)), 'invoice carries the offer discount and label'); await page.keyboard.press('Escape');
    // create member login
    await page.click('a[href="#members"]'); await page.waitForSelector('tr.click'); await page.click('tr.click:has-text("Rahul")'); await page.waitForSelector('[data-l]'); await page.click('[data-l]');
    await page.fill('#f_email', 'taken@x.in'); await page.click('[data-ok]'); await page.waitForFunction(() => /पहले से है|already has an account/.test(document.body.innerText));
    await page.fill('#f_email', 'rahul@x.in'); await page.click('[data-ok]'); await page.waitForSelector('[data-cp]');
    ok(/GenPass1234abcd/.test(await page.textContent('#modals')) && db.created.role === 'member' && !!db.created.member_id, 'member login created and password shown once');
    ok(/wa\.me\/919876543210/.test(await page.getAttribute('#modals a.wa', 'href')), 'login details can be sent by WhatsApp'); await page.keyboard.press('Escape');
    await page.click('a[href="#settings"]'); await page.click('[data-act=newTrainer]'); await page.fill('#f_email', 'coach@x.in'); await page.fill('#f_full_name', 'Coach'); await page.click('[data-ok]'); await page.waitForSelector('[data-cp]');
    ok(db.created.role === 'trainer' && !db.created.member_id, 'trainer login created'); await page.keyboard.press('Escape');
    // change password
    await page.click('#pwBtn'); await page.fill('#f_pw', 'short'); await page.fill('#f_pw2', 'short'); await page.click('[data-ok]');
    ok((await page.textContent('#e_pw')).length > 0, 'short new password rejected');
    await page.fill('#f_pw', 'LongEnough123'); await page.fill('#f_pw2', 'Different123'); await page.click('[data-ok]');
    ok((await page.textContent('#e_pw2')).length > 0, 'mismatched passwords rejected');
    await page.fill('#f_pw2', 'LongEnough123'); await page.click('[data-ok]'); await page.waitForFunction(() => !document.querySelector('#modals .md'));
    ok(db.pwChanged === 'LongEnough123', 'password change sent to auth API');
    // language + overflow
    await page.click('#langBtn'); ok(!(await overflow(page)), 'no horizontal overflow (desktop, EN)');
    await page.click('#outBtn'); await page.waitForSelector('#loginForm'); ok(true, 'sign out returns to login');
  });

  console.log('gym admin on phone, both languages');
  await session(browser, 'gym_admin', async (page) => {
    await login(page); await page.waitForSelector('.tiles');
    ok(!!(await page.$('.nav .more')) && (await page.$$eval('#nav a', (a) => a.filter((x) => x.offsetParent !== null).length)) <= 5, 'phone bar shows only the main pages plus More');
    await page.click('.nav .more'); await page.waitForSelector('.sheet-links a'); ok((await page.$$('.sheet-links a')).length === 29, 'More sheet lists all 29 pages in groups');
    await page.click('.sheet-links a[href="#expenses"]'); await page.waitForFunction(() => location.hash === '#expenses' && !document.querySelector('.ov')); ok(true, 'More sheet opens a page and closes');
    ok((await page.$$('#nav .grp')).length === 6, 'admin menu is split into 6 groups');
    await page.waitForSelector('[data-act=newExpense]'); await page.waitForTimeout(500);
    await page.keyboard.press('Control+k'); await page.waitForSelector('#palQ'); await page.fill('#palQ', 'rahul'); await page.waitForSelector('.pal-list li[data-i]'); await page.keyboard.press('Enter');
    await page.waitForSelector('.md'); ok(/Rahul/.test(await page.textContent('.md')), 'Ctrl+K finds a member and opens their card'); await page.keyboard.press('Escape');
    for (const lang of ['hi', 'en']) {
      for (const r of ['dashboard', 'members', 'reminders', 'whatsapp', 'leads', 'store', 'expenses', 'staff', 'classes', 'tasks', 'equipment', 'checkin', 'plans', 'offers', 'invoices', 'payments', 'ledger', 'retention', 'peak', 'settings']) {
        await page.evaluate((h) => (location.hash = h), r); await page.waitForTimeout(250); await page.waitForSelector('#view .ph');
        if (await overflow(page)) { ok(false, `overflow on ${r} (${lang})`); }
      }
      ok(true, `phone: no overflow in any gym screen (${lang})`); await page.click('#langBtn');
    }
  }, { width: 375, height: 760 });

  console.log('public enquiry form');
  await session(browser, 'gym_admin', async (page, db) => {
    const base = `http://127.0.0.1:${server.address().port}/?enquire=`, open = async (g = db.G) => { await page.goto(base + g); await page.waitForSelector('#enqForm, #enqCard h1'); };
    await open();
    ok(!(await page.$('#loginForm')) && /Royal The Gym/.test(await page.textContent('#enqCard')) && !!(await page.$('#en_name')), 'enquiry link opens the form without signing in, with the gym name');
    await page.fill('#en_name', 'Sonu Prospect'); await page.fill('#en_phone', '98765 11111'); await page.click('#en_go');
    ok((await page.textContent('#e_en_ok')).length > 0 && !db.enqCalls, 'consent is required before anything is sent');
    await page.fill('#en_phone', '12345'); await page.check('#en_ok'); await page.click('#en_go');
    ok((await page.textContent('#e_en_phone')).length > 0 && !db.enqCalls, 'a short phone number is refused before sending');
    await page.fill('#en_phone', '98765 11111'); await page.fill('#en_interest', 'Weight loss'); await page.fill('#en_note', 'Evening batch');
    await page.evaluate(() => { const f = document.querySelector('#enqForm'); const go = () => f.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })); go(); go(); });
    await page.waitForSelector('.banner.ok');
    ok(db.leads.length === 1 && db.enqCalls.length === 1, 'a double submit stores one enquiry');
    const lead = db.leads[0];
    ok(lead.source === 'Website' && lead.stage === 'New' && lead.phone === '9876511111' && lead.name === 'Sonu Prospect' && lead.interest === 'Weight loss' && db.enqCalls[0].p_consent === true && db.enqCalls[0].p_hp === '', 'enquiry lands as Website / New with a clean number and consent');
    ok(/Thank you|धन्यवाद/.test(await page.textContent('.banner.ok')), 'visitor sees a thank-you');
    // a bot fills the hidden field: it is told "thanks" but nothing is stored
    await open(); await page.fill('#en_name', 'Bot Bhai'); await page.fill('#en_phone', '9123456789'); await page.check('#en_ok'); await page.evaluate(() => { document.querySelector('#en_hp').value = 'http://spam.example'; }); await page.click('#en_go'); await page.waitForSelector('.banner.ok');
    ok(db.leads.length === 1, 'honeypot filled: success shown, nothing stored');
    // the same number again within 30 days: success shown, no second lead
    await open(); await page.fill('#en_name', 'Sonu Again'); await page.fill('#en_phone', '9876511111'); await page.check('#en_ok'); await page.click('#en_go'); await page.waitForSelector('.banner.ok');
    ok(db.leads.length === 1, 'same number again: one lead only');
    // busy gym: a friendly message and the form stays
    db.enquiryBusy = true; await open(); await page.fill('#en_name', 'Late Comer'); await page.fill('#en_phone', '9000011111'); await page.check('#en_ok'); await page.click('#en_go'); await page.waitForSelector('#enqErr:not([hidden])');
    ok(/Too many|बहुत/.test(await page.textContent('#enqErr')) && !!(await page.$('#enqForm')) && db.leads.length === 1, 'rate-limit error is shown in plain words and the form stays');
    db.enquiryBusy = false;
    // language switch keeps what was typed
    await open(); await page.fill('#en_name', 'Rakesh'); await page.fill('#en_phone', '9000022222'); await page.check('#en_ok'); await page.click('#enqLang');
    ok((await page.inputValue('#en_name')) === 'Rakesh' && (await page.inputValue('#en_phone')) === '9000022222' && (await page.isChecked('#en_ok')), 'switching language keeps the typed values');
    // closed gym / unknown gym
    db.enquiryClosed = true; await open(); ok(!(await page.$('#enqForm')) && /not taking enquiries|पूछताछ नहीं/.test(await page.textContent('#enqCard')), 'locked or unknown gym shows "not taking enquiries" and no form');
    db.enquiryClosed = false;
    await page.goto(base + 'not-a-uuid'); await page.waitForSelector('#loginForm'); ok(true, 'a malformed enquiry id falls back to the normal sign-in screen');
  });
  console.log('public enquiry form on a phone');
  await session(browser, 'gym_admin', async (page, db) => {
    await page.goto(`http://127.0.0.1:${server.address().port}/?enquire=${db.G}`); await page.waitForSelector('#enqForm');
    ok(!(await overflow(page)), 'enquiry form has no horizontal overflow on a phone');
    ok(await page.$eval('#en_hp', (e) => e.getBoundingClientRect().right < 0 && e.tabIndex === -1), 'honeypot field is off-screen and not reachable by Tab');
  }, { width: 375, height: 760 });

  console.log('locked gym');
  {
    const db = makeDb('gym_admin'); db.gyms[0].subscription_ends_on = addD(today(), -3);
    const ctx = await browser.newContext(), page = await ctx.newPage(); await ctx.route(SB + '/**', handler(db, 'gym_admin'));
    await page.goto(`http://127.0.0.1:${server.address().port}/`); await login(page); await page.waitForSelector('.banner.bad');
    ok(true, 'expired subscription shows locked banner');
    await page.click('a[href="#members"]'); await page.waitForSelector('[data-act=newMember][disabled]'); ok(true, 'write buttons disabled while locked'); await ctx.close();
  }

  console.log('super admin');
  await session(browser, 'super_admin', async (page, db) => {
    await login(page); await page.waitForSelector('.tiles'); ok((await page.$$eval('#nav a', (a) => a.length)) === 6, 'super admin sees 6 menu items');
    ok(/Royal The Gym|ओवरव्यू|Overview/.test(await page.textContent('#view')) && !!(await page.$('.tiles')), 'super admin lands on the platform overview');
    ok(/Nothing needs attention|किसी पर ध्यान/.test(await page.textContent('#view')), 'overview: healthy gym is not flagged');
    ok(!/Check-in|चेक-इन/.test(await page.textContent('#nav')), 'super admin has no gym operations menu');
    await page.click('a[href="#gyms"]'); await page.waitForSelector('table.t'); ok((await page.$$('table.t tbody tr')).length === 1, 'gyms list shows the gym');
    await page.fill('#sgq', 'zzz'); await page.waitForFunction(() => document.querySelectorAll('table.t tbody tr').length === 0); ok(true, 'gym search filters the list');
    await page.fill('#sgq', 'royal'); await page.waitForFunction(() => document.querySelectorAll('table.t tbody tr').length === 1);
    await page.click('[data-act=chip][data-key=sgF][data-v=locked]'); await page.waitForFunction(() => document.querySelectorAll('table.t tbody tr').length === 0); ok(true, 'locked filter hides an open gym');
    await page.click('a[href="#users"]'); await page.waitForSelector('table.t'); await page.click('[data-act=chip][data-key=suF][data-v=waiting]'); await page.waitForFunction(() => document.querySelectorAll('table.t tbody tr').length === 1 && /New User/.test(document.querySelector('table.t').innerText)); ok(true, 'users filter: shows only the user waiting for a gym');
    await page.click('[data-act=chip][data-key=suF][data-v=trainer]'); await page.waitForFunction(() => document.querySelectorAll('table.t tbody tr').length === 0); ok(true, 'users filter: no trainers');
    await page.click('a[href="#status"]'); await page.waitForSelector('.list'); ok(true, 'users + status render');
    await page.keyboard.press('Control+k'); await page.waitForSelector('#palQ'); await page.fill('#palQ', 'audit'); await page.keyboard.press('Enter');
    await page.waitForFunction(() => location.hash === '#audit'); ok(true, 'Ctrl+K quick search jumps to a page'); await page.waitForTimeout(700);
    await page.keyboard.press('Control+k'); await page.waitForSelector('#palQ'); await page.fill('#palQ', 'jhunjhunu'); await page.keyboard.press('Enter');
    await page.waitForFunction(() => location.hash === '#gyms'); ok(true, 'quick search finds a gym');
  });


  console.log('AI coach');
  await session(browser, 'member', async (page, db) => {
    await login(page); await page.waitForSelector('.tiles'); await page.evaluate(() => (location.hash = 'coach')); await page.waitForSelector('#coachIn', { timeout: 15000 });
    ok(/AI coach|AI कोच/.test(await page.textContent('#view h1')) && (await page.$$('[data-act=coachAsk]')).length === 4, 'member: coach page shows the greeting and four starter questions');
    ok(/10 questions left|10 सवाल बाकी/.test(await page.textContent('#coachLeft')), 'member: remaining questions are shown');
    ok(await page.isHidden('[data-act=coachClear]'), 'member: the clear button is hidden on an empty chat');
    await page.click('[data-act=coachAsk]'); await page.waitForFunction(() => /banana/.test(document.querySelector('#coachLog').innerText), null, { timeout: 10000 });
    ok(db.coachCalls.some((c) => c.action === 'ask' && /eat before the gym/i.test(c.text)), 'member: a starter question is sent as the question text');
    ok((await page.$$('[data-act=coachAsk]')).length === 0 && /9 questions left|9 सवाल बाकी/.test(await page.textContent('#coachLeft')), 'member: starter questions disappear and the count goes down');
    await page.fill('#coachIn', 'I get chest pain on stairs'); await page.press('#coachIn', 'Enter');
    await page.waitForFunction(() => /matter for a doctor/.test(document.querySelector('#coachLog').innerText), null, { timeout: 10000 });
    ok((await page.$$('.cbub.safe')).length === 1 && /Safety note|सुरक्षा सूचना/.test(await page.textContent('.cbub.safe')), 'member: a safety answer is marked as a safety note');
    ok((await page.inputValue('#coachIn')) === '', 'member: the box is empty after sending');
    const order = await page.$$eval('#coachLog .cbub', (b) => b.map((x) => x.classList.contains('me') ? 'me' : 'bot').join(','));
    ok(order === 'bot,me,bot,me,bot' && !(await page.isHidden('[data-act=coachClear]')), 'member: newest message is first in the column-reverse log, the greeting stays last, and the clear button appears: ' + order);
    await page.fill('#coachIn', 'x'); await page.click('#coachGo'); await page.waitForTimeout(300);
    ok(db.coachCalls.filter((c) => c.action === 'ask').length === 2, 'member: a one-letter question is refused on the page without calling the server');
    db.coachFail = 'too_fast'; await page.fill('#coachIn', 'Another question please'); await page.click('#coachGo'); await page.waitForTimeout(500);
    ok((await page.inputValue('#coachIn')) === 'Another question please' && (await page.$$('#coachLog .cbub.me')).length === 2, 'member: when the server refuses, the question comes back into the box and no extra bubble stays');
    db.coachFail = 'limit'; await page.fill('#coachIn', 'One more please'); await page.click('#coachGo'); await page.waitForTimeout(500);
    ok((await page.$$('#coachLog .cbub.me')).length === 2 && /0 of 10|आज 10 में से 0/.test(await page.textContent('#coachLeft')), 'member: at the daily limit the question is not kept and the count shows zero');
    db.coachFail = null;
    page.once('dialog', (d) => d.accept()); await page.click('[data-act=coachClear]');
    await page.waitForFunction(() => document.querySelectorAll('[data-act=coachAsk]').length === 4, null, { timeout: 10000 });
    ok(db.coach_messages.length === 0, 'member: clear chat deletes the history and shows the starters again');
  });
  await session(browser, 'member', async (page, db) => {
    db.coachOn = false; await login(page); await page.waitForSelector('.tiles'); await page.evaluate(() => (location.hash = 'coach')); await page.waitForFunction(() => /not switched on|चालू नहीं/.test(document.querySelector('#view').innerText));
    ok((await page.$$('#coachIn')).length === 0, 'member: coach switched off for the gym shows a message and no chat box');
  });
  await session(browser, 'member', async (page, db) => {
    db.coachConf = false; await login(page); await page.waitForSelector('.tiles'); await page.evaluate(() => (location.hash = 'coach')); await page.waitForFunction(() => /being set up|तैयार किया जा रहा/.test(document.querySelector('#view').innerText));
    ok((await page.$$('#coachIn')).length === 0, 'member: gateway keys missing shows "being set up" and no chat box');
  });
  await session(browser, 'gym_admin', async (page, db) => {
    await login(page); await page.waitForSelector('.tiles'); await page.click('a[href="#coach"]'); await page.waitForFunction(() => { const h = document.querySelector('#view h1'); return !!h && /AI coach|AI कोच/.test(h.innerText); });
    const t = await page.textContent('#view');
    ok(/never what they asked|उनके सवाल नहीं/.test(t) && /2 of 3 members asked|3 में से 2/.test(t), 'owner: coach page shows counts and says the owner never sees the questions');
    page.once('dialog', (d) => d.accept()); await page.click('[data-act=coachOff]'); await page.waitForFunction(() => /Off|बंद/.test(document.querySelector('#view .tiles').innerText));
    ok(db.coachArgs && db.coachArgs.p_enabled === false && db.coachArgs.p_gym === db.gyms[0].id, 'owner: switch off sends the gym and false');
    ok((await page.$$('[data-act=coachOff]')).length === 0, 'owner: no off button once it is off');
  });
  await session(browser, 'super_admin', async (page, db) => {
    db.coachOn = false; await login(page); await page.waitForSelector('.tiles'); await page.click('a[href="#gyms"]'); await page.waitForSelector('[data-act=coachGym]');
    await page.click('[data-act=coachGym]'); await page.waitForSelector('#coachLimit');
    await page.fill('#coachLimit', '99'); await page.click('#modals [data-o="1"]'); await page.waitForTimeout(400);
    ok(!db.coachArgs && (await page.$$('#coachLimit')).length === 1, 'super admin: a limit above 50 is refused and nothing is saved');
    await page.fill('#coachLimit', '15'); await page.click('#modals [data-o="1"]'); await page.waitForFunction(() => !document.querySelector('#coachLimit'));
    ok(db.coachArgs.p_enabled === true && db.coachArgs.p_limit === 15 && db.coachArgs.p_gym === db.gyms[0].id, 'super admin: switch on sends the gym, true and the limit');
  });

  console.log('member portal on phone');
  await session(browser, 'member', async (page) => {
    await login(page); await page.waitForSelector('.tiles');
    for (const r of ['mine', 'plan', 'pay', 'visits', 'book', 'train', 'habits', 'progress', 'coach', 'me']) { await page.evaluate((h) => (location.hash = h), r); await page.waitForTimeout(250); await page.waitForSelector('#view .ph'); if (await overflow(page)) ok(false, `member overflow on ${r}`); }
    ok(true, 'phone: no overflow on any member page');
  }, { width: 390, height: 800 });

  console.log('online payment');
  await session(browser, 'member', async (page, db) => {
    db.rzEnabled = false; await login(page); await page.waitForSelector('.tiles'); await page.click('a[href="#pay"]'); await page.waitForSelector('#view .list');
    ok((await page.$$('[data-act=payOnline]')).length === 0, 'member: no Pay online button while the gym has it switched off');
  });
  await session(browser, 'member', async (page, db) => {
    db.rzEnabled = true; await login(page); await page.waitForSelector('.tiles'); await page.click('a[href="#pay"]'); await page.waitForSelector('[data-act=payOnline]');
    const lbl = await page.textContent('[data-act=payOnline]'); ok(/1,180|1180/.test(lbl), 'member: button shows the amount due: ' + lbl);
    await page.evaluate(() => { window.__opened = []; window.open = (u) => { window.__opened.push(u); return {}; }; });
    await page.click('[data-act=payOnline]'); await page.waitForFunction(() => window.__opened.length === 1);
    ok(await page.evaluate(() => window.__opened[0]) === 'https://rzp.io/i/test1', 'member: the Razorpay page is opened');
    const call = db.rzCalls.filter((c) => c.action === 'create'); ok(call.length === 1 && call[0].invoice_id === db.invoices[0].id && !('amount' in call[0]), 'member: only the invoice id is sent, never an amount');
    db.rzUrl = 'https://evil.example.com/pay'; await page.click('[data-act=payOnline]'); await page.waitForTimeout(500);
    ok((await page.evaluate(() => window.__opened.length)) === 1, 'member: a link that is not Razorpay is never opened');
    db.rzUrl = null; db.rzFail = true; await page.click('[data-act=payOnline]'); await page.waitForSelector('.toast, #toasts *'); await page.waitForTimeout(300);
    ok((await page.evaluate(() => window.__opened.length)) === 1 && /could not be created|नहीं बन सका/.test(await page.textContent('body')), 'member: a gateway failure shows a message and opens nothing');
  });
  await session(browser, 'member', async (page, db) => {
    db.rzEnabled = true; db.rzConf = false; await login(page); await page.waitForSelector('.tiles'); await page.click('a[href="#pay"]'); await page.waitForSelector('#view .list');
    ok((await page.$$('[data-act=payOnline]')).length === 0, 'member: no button when the Razorpay keys are not saved on the server');
  });
  await session(browser, 'gym_admin', async (page, db) => {
    db.rzEnabled = true; const m = db.members[0];
    db.online_orders.push({ id: uid(), gym_id: db.G, invoice_id: db.invoices[0].id, member_id: m.id, amount: 1180, status: 'paid', rz_link_id: 'plink_1', rz_payment_id: 'pay_1', paid_at: new Date().toISOString(), created_at: new Date().toISOString() },
      { id: uid(), gym_id: db.G, invoice_id: db.invoices[0].id, member_id: m.id, amount: 300, status: 'review', rz_link_id: 'plink_2', rz_payment_id: 'pay_2', note: 'amount mismatch: paid 5000 paise, expected 30000', created_at: new Date().toISOString() });
    await login(page); await page.waitForSelector('.tiles'); await page.click('a[href="#onlinepay"]'); await page.waitForFunction(() => /razorpay/i.test(document.querySelector('#view').innerText));
    const txt = await page.textContent('#view');
    ok(/Rahul Sharma/.test(txt) && /amount mismatch/.test(txt) && /functions\/v1\/razorpay/.test(txt), 'owner page lists orders, the review reason and the webhook URL');
    ok(/1,180/.test(txt) && (await page.$$eval('#view .tiles .tile, #view .tiles > *', (x) => x.length)) >= 3, 'owner page shows this month\'s received amount and tiles');
  });
  await session(browser, 'super_admin', async (page, db) => {
    await login(page); await page.waitForSelector('.tiles'); await page.click('a[href="#gyms"]'); await page.waitForSelector('[data-act=onlinePayGym]');
    await page.click('[data-act=onlinePayGym]'); await page.waitForSelector('#modals [data-o="1"]'); await page.click('#modals [data-o="1"]');
    await page.waitForFunction(() => !document.querySelector('#modals [data-o]')); ok(db.onlinePayArgs && db.onlinePayArgs.p_enabled === true && db.onlinePayArgs.p_gym === db.gyms[0].id, 'super admin: switch on sends the gym and true');
  });
  await session(browser, 'super_admin', async (page, db) => {
    // Route: a gym without its own linked account, one payment never sent, one failed, one with an unknown outcome
    db.online_pay = [{ gym_id: db.G, enabled: true }];
    const now = new Date().toISOString();
    db.online_orders.push(
      { id: 'ord_fail', gym_id: db.G, invoice_id: 'inv_a', member_id: null, amount: 1180, status: 'paid', rz_payment_id: 'pay_F1', paid_at: now, transfer_status: 'failed', transfer_error: 'Razorpay 400: account not activated' },
      { id: 'ord_nul', gym_id: db.G, invoice_id: 'inv_b', member_id: null, amount: 500, status: 'paid', rz_payment_id: 'pay_N1', paid_at: now, transfer_status: null },
      { id: 'ord_unk', gym_id: db.G, invoice_id: 'inv_c', member_id: null, amount: 300, status: 'paid', rz_payment_id: 'pay_U1', paid_at: now, transfer_status: 'routing', transfer_error: 'unknown outcome: timeout' });
    await login(page); await page.waitForSelector('.tiles'); await page.click('a[href="#gyms"]'); await page.waitForSelector('[data-act=onlinePayGym]');
    await page.click('[data-act=onlinePayGym]'); await page.waitForSelector('#modals #rzAcc');
    let txt = await page.textContent('#modals');
    ok(/No linked account|कोई linked account नहीं/.test(txt) && /Online pay is ON but this gym has no linked account|चालू है पर इस जिम का linked account नहीं/.test(txt) && /Razorpay 400: account not activated/.test(txt), 'super admin: a gym with no linked account is said so, and its failed transfer is listed with the reason');
    await page.fill('#modals #rzAcc', 'acc_ROYAL12345'); await page.click('#modals [data-route-save]');
    await page.waitForSelector('#modals [data-route-retry]');
    ok(db.routeArgs && db.routeArgs.p_account === 'acc_ROYAL12345' && db.routeArgs.p_gym === db.gyms[0].id, 'super admin: saving the account sends the gym and the acc_ id');
    txt = await page.textContent('#modals');
    ok(/(Not sent yet|अभी नहीं भेजा): 1/.test(txt) && /(Failed|असफल): 1/.test(txt) && /(Unknown|पता नहीं): 1/.test(txt), 'super admin: the summary counts not-yet-sent, failed and unknown payments');
    await page.click('#modals [data-route-retry][data-order="ord_fail"]'); await page.click('[data-yes]');
    for (let i = 0; i < 60 && !db.routeRetry; i++) await page.waitForTimeout(100);
    ok(db.routeRetry && db.routeRetry.order_id === 'ord_fail' && db.routeRetry.force === false, 'a retry of a failed transfer is not forced');
    await page.waitForSelector('#modals [data-route-retry][data-order="ord_unk"]');
    await page.click('#modals [data-route-retry][data-order="ord_unk"]'); await page.waitForSelector('[data-yes]');
    ok(/check the Razorpay dashboard|Razorpay डैशबोर्ड में देखें/i.test(await page.textContent('body')), 'an unknown transfer asks for a look at the Razorpay dashboard first');
    await page.click('[data-yes]');
    for (let i = 0; i < 60 && !(db.routeRetry && db.routeRetry.order_id === 'ord_unk'); i++) await page.waitForTimeout(100);
    ok(db.routeRetry && db.routeRetry.order_id === 'ord_unk' && db.routeRetry.force === true, 'an unknown transfer is sent again only with force');
  });

  console.log('EMI plans');
  const addEmi = (db, inv) => {
    db.rzEnabled = true;
    db.emi_plans.push({ id: 'emi_plan_1', gym_id: db.G, invoice_id: inv.id, member_id: inv.member_id, status: 'active', created_at: new Date().toISOString() });
    [[-20, 393.33], [0, 393.33], [30, 393.34]].forEach(([off, amount], i) => db.emi_installments.push({ id: uid(), plan_id: 'emi_plan_1', seq: i + 1, due_on: addD(today(), off), amount }));
    db.payments.push({ id: uid(), gym_id: db.G, invoice_id: inv.id, member_id: inv.member_id, amount: 393.33, no: 'R-EMI-1', paid_on: addD(today(), -20), method: 'Cash', ref: null });
  };
  await session(browser, 'gym_admin', async (page, db) => {
    await login(page); await page.waitForSelector('.tiles'); await page.evaluate(() => (location.hash = 'emi')); await page.waitForSelector('#view h1', { timeout: 15000 });
    ok(/EMI plans|किस्त योजना/.test(await page.textContent('#view h1')) && /No EMI plans yet|अभी कोई किस्त योजना नहीं/.test(await page.textContent('#view')), 'owner: EMI page opens with an empty state');
    await page.click('[data-act=emiNew]'); await page.waitForSelector('#f_inv');
    await page.selectOption('#f_count', '3'); await page.fill('#f_start', addD(today(), 30));
    const chosen = await page.inputValue('#f_inv'), previewRows = await page.$$eval('#emiPrev li', (x) => x.length);
    ok(previewRows === 3, 'owner: the form previews three installments: ' + previewRows);
    await page.click('[data-ok]'); await page.waitForSelector('[data-act=emiCancel]', { timeout: 10000 });
    ok(db.emiCreateArgs && db.emiCreateArgs.p_invoice === chosen && db.emiCreateArgs.p_count === 3 && db.emiCreateArgs.p_start === addD(today(), 30), 'owner: the plan is saved with the chosen invoice, count and first due date');
    ok(/0 of 3 paid|3 में 0 जमा/.test(await page.textContent('#view')), 'owner: the new plan shows 0 of 3 paid');
    await page.click('[data-act=emiCancel]'); await page.waitForSelector('[data-yes]'); await page.click('[data-yes]');
    await page.waitForFunction(() => /No EMI plans yet|अभी कोई किस्त योजना नहीं/.test(document.querySelector('#view').innerText), null, { timeout: 10000 });
    ok(db.emi_plans[0].status === 'cancelled', 'owner: cancelling marks the plan cancelled');
  });
  await session(browser, 'member', async (page, db) => {
    const inv = db.invoices[0]; addEmi(db, inv);
    await login(page); await page.waitForSelector('.tiles'); await page.click('a[href="#pay"]'); await page.waitForSelector('[data-act=payEmi]');
    const label = await page.textContent('[data-act=payEmi]');
    ok(/393\.33/.test(label), 'member: the next installment is offered with its own amount: ' + label.trim());
    const view = await page.textContent('#view');
    ok(/Installment 1|किस्त 1/.test(view) && /Installment 3|किस्त 3/.test(view) && /1 of 3 paid|3 में 1 जमा/.test(view), 'member: all installments are listed with the count paid');
    await page.evaluate(() => { window.__opened = []; window.open = (u) => { window.__opened.push(u); return {}; }; });
    await page.click('[data-act=payEmi]'); await page.waitForFunction(() => window.__opened.length === 1);
    const call = db.rzCalls.filter((c) => c.action === 'create').pop();
    ok(call && call.part === true && call.invoice_id === inv.id && !('amount' in call), 'member: the installment is paid through the server with part = true and no amount sent');
    ok((await page.$$('[data-act=payOnline]')).length >= 1, 'member: the full-balance button stays for paying everything at once');
  });
  await session(browser, 'member', async (page, db) => {
    addEmi(db, db.invoices[0]);
    await login(page); await page.waitForSelector('.tiles'); await page.click('a[href="#pay"]'); await page.waitForSelector('[data-act=payEmi]');
    ok(!(await overflow(page)), 'member: installments card on a phone has no horizontal overflow');
  }, { width: 390, height: 844 });
  console.log('push notifications');
  await session(browser, 'member', async (page) => {
    await login(page); await page.waitForSelector('.tiles'); await page.click('a[href="#me"]'); await page.waitForFunction(() => /Notifications|सूचनाएँ/.test(document.querySelector('#view').innerText), null, { timeout: 15000 });
    ok((await page.$$('[data-act=pushOn]')).length === 0 && /blocked|बंद हैं/.test(await page.textContent('#view')), 'member: blocked browser permission shows an explanation and no switch-on button');
    await page.addInitScript(() => { Object.defineProperty(Notification, 'permission', { get: () => 'default' }); }); await page.reload(); await page.waitForSelector('#l_email, #view .ph'); if (await page.$('#l_email')) await login(page);
    await page.waitForSelector('#view .ph'); await page.evaluate(() => (location.hash = 'me')); await page.waitForSelector('[data-act=pushOn]', { timeout: 15000 });
    ok(/Notifications|सूचनाएँ/.test(await page.textContent('#view')), 'member: Profile has a Notifications card with a switch-on button');
    ok((await page.$$('[data-act=pushTest]')).length === 0, 'member: no test button while notifications are off');
  });
  await session(browser, 'gym_admin', async (page, db) => {
    await login(page); await page.waitForSelector('.tiles'); await page.click('a[href="#announce"]'); await page.waitForFunction(() => { const h = document.querySelector('#view h1'); return !!h && /Announcements|घोषणाएँ/.test(h.innerText); });
    ok(/3/.test(await page.textContent('#view .tiles')) && /No announcements yet|अभी कोई घोषणा नहीं/.test(await page.textContent('#view')), 'owner: announcements page shows who will receive and an empty history');
    await page.click('[data-act=announceNew]'); await page.waitForSelector('#f_title'); await page.fill('#f_title', 'Holiday'); await page.fill('#f_body', 'Gym closed on Sunday');
    await page.click('[data-ok]'); await page.waitForFunction(() => /Holiday/.test(document.querySelector('#view').innerText));
    ok(db.annCalls.length === 1 && db.annCalls[0].p_title === 'Holiday' && db.annCalls[0].p_body === 'Gym closed on Sunday', 'owner: the announcement is sent with title and message');
    ok(/Gym closed on Sunday/.test(await page.textContent('#view')), 'owner: sent announcement appears in the history');
    db.annSoon = true; await page.click('[data-act=announceNew]'); await page.waitForSelector('#f_title'); await page.fill('#f_title', 'Again'); await page.fill('#f_body', 'too soon');
    await page.click('[data-ok]'); await page.waitForTimeout(600);
    ok((await page.$$('#f_title')).length === 1, 'owner: a second announcement within 10 minutes is refused and the form stays open');
    await page.fill('#f_title', 'x'.repeat(61)); await page.click('[data-ok]'); await page.waitForTimeout(300);
    ok(db.annCalls.length === 2, 'owner: an over-long title is stopped before it is sent');
  });

  console.log('installable app (PWA)');
  {
    const base = `http://127.0.0.1:${server.address().port}`;
    const man = JSON.parse(fs.readFileSync(path.join(PUB, 'manifest.webmanifest'), 'utf8')), png = (f) => { const b = fs.readFileSync(path.join(PUB, f)); return [b.readUInt32BE(16), b.readUInt32BE(20)]; };
    ok(man.id && man.start_url && man.scope && man.display === 'standalone' && man.name && man.short_name, 'manifest has id, start_url, scope, display, names');
    ok(man.icons.every((i) => { const [w, h] = png(i.src); return `${w}x${h}` === i.sizes; }), 'every manifest icon exists and has the declared size');
    ok(['any', 'maskable'].every((pu) => man.icons.some((i) => i.purpose === pu && i.sizes === '512x512')) && man.icons.some((i) => i.purpose === 'maskable' && i.sizes === '192x192'), 'icons: any + maskable at 192 and 512');
    ok(/black-translucent/.test(fs.readFileSync(path.join(PUB, 'index.html'), 'utf8')) && fs.existsSync(path.join(PUB, 'apple-touch-icon.png')), 'iOS: status bar style and touch icon present');
    ok(!/__BUILD__/.test(fs.readFileSync(path.join(PUB, 'sw.js'), 'utf8')), 'service worker has a real build id');
    // service worker: installs, caches the shell, and the app opens with no internet
    const ctx = await browser.newContext({ viewport: { width: 390, height: 800 } }), page = await ctx.newPage(), db = makeDb('gym_admin'); await ctx.route(SB + '/**', handler(db, 'gym_admin'));
    await page.goto(base + '/'); await page.evaluate(() => navigator.serviceWorker.ready); await page.waitForFunction(() => caches.keys().then((k) => k.some((n) => n.startsWith('gymos-'))));
    const cached = await page.evaluate(async () => { const k = (await caches.keys()).find((n) => n.startsWith('gymos-')), c = await caches.open(k); return (await c.keys()).map((r) => new URL(r.url).pathname); });
    ok(['/app.js', '/style.css', '/offline.html', '/manifest.webmanifest', '/icon-192.png'].every((f) => cached.includes(f)), 'service worker saved the app files');
    await page.reload(); await page.waitForFunction(() => !!navigator.serviceWorker.controller);
    await ctx.setOffline(true); await page.reload(); await page.waitForSelector('#gate, #app'); ok(await page.evaluate(() => !!document.querySelector('#nav, #gate')), 'app shell opens with no internet');
    await page.waitForSelector('#offBar'); ok(/offline|इंटरनेट नहीं/.test(await page.textContent('#offBar')), 'offline bar is shown');
    ok(await page.evaluate(() => fetch('offline.html').then((r) => r.ok)), 'offline page is available offline');
    await ctx.setOffline(false); await page.waitForFunction(() => !document.querySelector('#offBar')); ok(true, 'offline bar disappears when the internet is back');
    await ctx.close();
    // phone width (375px): the main screens never scroll sideways as a page (a wide table scrolls inside its own box)
    { const ctx = await browser.newContext({ viewport: { width: 375, height: 667 }, serviceWorkers: 'block' }), page = await ctx.newPage(); await ctx.route(SB + '/**', handler(makeDb('gym_admin'), 'gym_admin'));
      await page.goto(base + '/'); await login(page); await page.waitForSelector('.tiles');
      for (const r of ['members', 'checkin', 'leads', 'reminders', 'coach']) {
        await page.evaluate((h) => (location.hash = h), r); await page.waitForTimeout(400);
        const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        ok(over <= 0, `375px: ${r} has no sideways page scroll (overflow ${over}px)`);
      }
      await ctx.close(); }
    // install prompt: Android/Chrome button and iPhone instructions
    const andr = await browser.newContext({ viewport: { width: 390, height: 800 }, serviceWorkers: 'block' }), ap = await andr.newPage(); await andr.route(SB + '/**', handler(makeDb('gym_admin'), 'gym_admin'));
    await ap.goto(base + '/'); await ap.evaluate(() => { const e = new Event('beforeinstallprompt'); e.prompt = () => { window.__prompted = true; }; e.userChoice = Promise.resolve({ outcome: 'accepted' }); window.dispatchEvent(e); });
    await login(ap); await ap.waitForSelector('#installBar [data-act=installApp]'); await ap.click('[data-act=installApp]'); await ap.waitForFunction(() => window.__prompted === true && !document.querySelector('#installBar')); ok(true, 'Android: Install button opens the install prompt');
    await andr.close();
    const ios = await browser.newContext({ viewport: { width: 390, height: 800 }, serviceWorkers: 'block', userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1' }), ip = await ios.newPage(); await ios.route(SB + '/**', handler(makeDb('gym_admin'), 'gym_admin'));
    await ip.goto(base + '/'); await login(ip); await ip.waitForSelector('#installBar'); ok(/Add to Home Screen/.test(await ip.textContent('#installBar')), 'iPhone: shows how to Add to Home Screen');
    await ip.click('#installBar [data-act=installLater]'); await ip.waitForFunction(() => !document.querySelector('#installBar')); await ip.reload(); await login(ip).catch(() => {}); await ip.waitForTimeout(600); ok(!(await ip.$('#installBar')), 'iPhone: "Got it" hides the banner for 14 days'); await ios.close();
  }

  console.log('member + waiting');
  await session(browser, 'member', async (page, db) => { const eng = await ENGINE; db.visits.push({ id: uid(), gym_id: db.G, member_id: db.members[0].id, in_at: new Date().toISOString(), out_at: null }); db.payments.push({ id: uid(), gym_id: db.G, member_id: db.members[0].id, amount: 700, method: 'UPI', paid_on: today(), no: 'RCT-0009' }); draftRows(eng, db, db.members[0], FIT, 'published').forEach((r) => db.member_plans.push(r)); draftRows(eng, db, db.members[0], FIT, 'draft').forEach((r) => db.member_plans.push(r)); await login(page); await page.waitForSelector('.tiles'); ok(/Rahul/.test(await page.textContent('#view')), 'member sees own page');
    ok((await page.$$eval('#nav a', (a) => a.length)) === 11, 'member portal has 11 pages');
    ok(/1/.test(await page.textContent('.tiles .card:nth-child(3) .v')), 'home shows the visit streak');
    await page.click('a[href="#plan"]'); await page.waitForSelector('[data-act=openMyPlan]'); ok((await page.$$('[data-act=openMyPlan]')).length === 2, 'member sees the two published plans');
    await page.click('[data-act=openMyPlan] >> nth=1'); await page.waitForSelector('#planBody'); ok(/Barbell|Dumbbell|Machine|Push|Lat/.test(await page.textContent('#planBody')), 'member can open the workout plan'); await page.keyboard.press('Escape');
    await page.click('a[href="#pay"]'); await page.waitForSelector('[data-act=openReceipt]'); ok((await page.$$('[data-act=openReceipt]')).length === 1, 'payments page lists the receipt');
    await page.click('[data-act=openReceipt]'); await page.waitForSelector('.md'); ok(true, 'member can open a receipt'); await page.keyboard.press('Escape');
    await page.click('a[href="#visits"]'); await page.waitForSelector('.cal'); ok((await page.$$('.cal i.on')).length === 1, 'visits calendar marks the day trained'); 
    await page.click('a[href="#me"]'); await page.waitForSelector('dl.kv'); ok(/Rahul/.test(await page.textContent('#view')) && !!(await page.$('[data-act=changePw]')), 'profile shows membership and account actions');
    { const mk2 = (t, cap) => ({ id: uid(), gym_id: db.G, title: t, coach: 'Coach', starts_at: new Date(Date.now() + 26 * 3600000).toISOString(), duration_min: 60, capacity: cap, note: null, cancelled_at: null }); const open = mk2('Open Yoga', 5), full = mk2('Full Zumba', 1); db.gym_classes.push(open, full); db.class_bookings.push({ id: uid(), gym_id: db.G, class_id: full.id, member_id: db.members[1].id, cancelled_at: null });
      await page.click('a[href="#mine"]'); await page.waitForSelector('.qrbox svg path'); ok(true, 'member home shows a check-in QR pass');
      ok((await page.$$eval('#view a[href^="https://g.page/"]', (x) => x.length)) === 1 && !!(await page.$eval('#view a[href^="https://g.page/"]', (x) => x.rel.includes('noopener'))), 'member home shows a safe Write a review button');
      ok(/Achievements|उपलब्धियाँ/.test(await page.textContent('#view')) && (await page.$$eval('#view .badge.ok', (b) => b.length)) >= 1, 'member home shows earned achievement badges from real visits');
      ok((await page.$$eval('#view a[href^="https://wa.me/?text="]', (x) => x.length)) === 1, 'member home has an invite-a-friend WhatsApp button');
      ok(!!(await page.$('[data-act=lbJoin]')) && !/Rohit/.test(await page.textContent('#view')), 'leaderboard shows only a join button until the member agrees');
      await page.click('[data-act=lbJoin]'); await page.click('[data-yes]'); await page.waitForSelector('[data-act=lbLeave]');
      ok(db.members[0].leaderboard_opt_in === true && /Rohit S\./.test(await page.textContent('#view')) && (await page.$$eval('#view .badge.ok', (b) => b.some((x) => /You|आप/.test(x.textContent)))), 'after joining, the leaderboard lists others by first name and last initial and marks the member');
      await page.click('[data-act=lbLeave]'); await page.waitForSelector('[data-act=lbJoin]'); ok(db.members[0].leaderboard_opt_in === false, 'member can leave the leaderboard');
      await page.click('a[href="#book"]'); await page.waitForSelector('[data-act=clsBook]');
      ok((await page.$$('[data-act=clsBook]')).length === 1 && /Full/.test(await page.textContent('#view')), 'member can book the open class but not the full one');
      await page.click('[data-act=clsBook]'); await page.waitForSelector('[data-act=clsCancel]');
      ok(db.class_bookings.some((b) => b.class_id === open.id && b.member_id === db.members[0].id), 'member booked a spot for themself');
      await page.click('[data-act=clsCancel]'); await page.click('[data-yes]'); await page.waitForSelector('[data-act=clsBook]');
      ok(!db.class_bookings.some((b) => b.class_id === open.id), 'member cancelled their spot'); }
    await page.click('a[href="#progress"]'); await page.waitForSelector('[data-act=addProgress]');
    await page.click('[data-act=addProgress]'); await page.fill('#f_weight_kg', '80'); await page.fill('#f_measured_on', addD(today(), -20)); await page.click('[data-ok]'); await page.waitForFunction(() => document.querySelector('[data-act=addProgress]') && /80/.test(document.body.innerText) && !document.querySelector('.md'));
    await page.click('[data-act=addProgress]'); await page.fill('#f_weight_kg', '77.5'); await page.click('[data-ok]'); await page.waitForFunction(() => /77\.5/.test(document.querySelector('#view').innerText));
    ok(db.member_progress.length === 2 && db.member_progress.every((r) => r.by_member === true), 'member saves own measurements marked as self-entered');
    ok(/−2\.5/.test(await page.textContent('.tiles')) && !!(await page.$('#view svg polyline')), 'progress shows weight change and a chart');
    ok(!(await page.$('[data-act=delProgress]')), 'member cannot delete entries');
    // workout log: validation, personal record, weekly numbers, delete
    await page.click('a[href="#train"]'); await page.waitForSelector('[data-act=addWorkout]'); await page.click('[data-act=addWorkout]');
    await page.fill('#f_exercise', 'Bench press'); await page.fill('#f_sets', '0'); await page.fill('#f_reps', '5'); await page.fill('#f_weight_kg', '60'); await page.click('[data-ok]'); await page.waitForTimeout(250);
    ok(db.member_workouts.length === 0, 'a workout with 0 sets is refused');
    await page.fill('#f_sets', '3'); await page.click('[data-ok]'); await page.waitForFunction(() => /60 kg × 5/.test(document.querySelector('#view').innerText));
    ok(db.member_workouts.length === 1 && db.member_workouts[0].member_id === db.members[0].id && db.member_workouts[0].exercise === 'Bench press' && Number(db.member_workouts[0].weight_kg) === 60, 'member logs an exercise for themself');
    await page.click('[data-act=addWorkout]'); await page.fill('#f_exercise', 'bench  PRESS'); await page.fill('#f_sets', '2'); await page.fill('#f_reps', '3'); await page.fill('#f_weight_kg', '62.5'); await page.click('[data-ok]'); await page.waitForFunction(() => /62\.5 kg × 3/.test(document.querySelector('#view').innerText));
    ok(db.member_workouts[0].exercise === 'bench PRESS' && (await page.$$eval('#view .badge.ok', (b) => b.length)) >= 1 && /1,?\d{3} kg/.test(await page.textContent('#view .tiles')), 'heavier set becomes the personal record and weekly volume is shown (3x5x60 + 2x3x62.5 = 1,275 kg)');
    ok((await page.$$eval('#view .list li b', (b) => b.filter((x) => /Bench press/i.test(x.textContent)).length)) >= 3, 'same exercise typed with other spacing and case is grouped as one');
    await page.click('[data-act=delWorkout]'); await page.click('[data-yes]'); await page.waitForFunction(() => document.querySelectorAll('[data-act=delWorkout]').length === 1);
    ok(db.member_workouts.length === 1, 'member can delete their own entry');
    // daily habits: water, food, sleep
    await page.click('a[href="#habits"]'); await page.waitForSelector('[data-act=waterAdd]');
    await page.click('[data-act=waterAdd][data-ml="250"]'); await page.waitForFunction(() => /0\.25 L/.test(document.querySelector('#view').innerText));
    await page.click('[data-act=waterAdd][data-ml="500"]'); await page.waitForFunction(() => /0\.75 L/.test(document.querySelector('#view').innerText));
    ok(db.member_water.length === 2 && db.member_water.every((r) => r.member_id === db.members[0].id) && db.member_water.reduce((a, r) => a + r.amount_ml, 0) === 750, 'member logs water and the total adds up');
    await page.click('[data-act=quickFood][data-i="0"]'); await page.fill('#f_qty', '2'); await page.click('[data-ok]'); await page.waitForFunction(() => /240 kcal/.test(document.querySelector('#view').innerText));
    ok(db.member_meals.length === 1 && db.member_meals[0].kcal === 240 && /^2× (Roti|रोटी)$/.test(db.member_meals[0].food) && Number(db.member_meals[0].protein_g) === 7, 'a quick food with 2 servings is saved with doubled values');
    await page.click('[data-act=customFood]'); await page.fill('#f_food', 'Mystery'); await page.fill('#f_kcal', '5000'); await page.click('[data-ok]'); await page.waitForTimeout(250);
    ok(db.member_meals.length === 1, 'an impossible calorie value is refused');
    await page.keyboard.press('Escape');
    await page.click('[data-act=logSleep]'); await page.fill('#f_hours', '20'); await page.click('[data-ok]'); await page.waitForTimeout(250);
    ok(db.member_sleep.length === 0, 'sleep of 20 hours is refused');
    await page.fill('#f_hours', '7.5'); await page.selectOption('#f_quality', '4'); await page.click('[data-ok]'); await page.waitForFunction(() => /7\.5 h/.test(document.querySelector('#view').innerText));
    ok(db.member_sleep.length === 1 && Number(db.member_sleep[0].hours) === 7.5 && db.member_sleep[0].quality === 4, 'member logs a night of sleep');
    await page.click('[data-act=delHabit][data-t="member_water"]'); await page.click('[data-yes]'); await page.waitForFunction(() => document.querySelectorAll('[data-act=delHabit][data-t="member_water"]').length === 1);
    ok(db.member_water.length === 1, 'member can delete a water entry');
  });

  console.log('revenue forecast, staff attendance, reorder list');
  await session(browser, 'gym_admin', async (page, db) => {
    const S1 = uid(), plan1 = db.plans[0].id, plan2 = db.plans[1].id, mem = (name, end, plan, status = 'Active') => ({ id: uid(), gym_id: db.G, name, phone: '9000000001', plan_id: plan, start_date: addD(today(), -20), end_date: end, status, joined_on: addD(today(), -25) });
    db.members.length = 0; db.invoices.length = 0; db.payments.length = 0; db.visits.length = 0;
    db.members.push(mem('Due Soon', addD(today(), 5), plan1), mem('Far One', addD(today(), 45), plan2), mem('Frozen One', addD(today(), 3), plan1, 'Frozen'));
    db.staff_members.push({ id: S1, gym_id: db.G, name: 'Vikram Trainer', job: 'Trainer', phone: null, monthly_salary: 12000, joined_on: addD(today(), -40), active: true, shift: 'full', weekly_off: null, note: null },
      { id: uid(), gym_id: db.G, name: 'Naya Joiner', job: 'Trainer', phone: null, monthly_salary: 9000, joined_on: addD(today(), 3), active: true, shift: 'full', weekly_off: null, note: null },
      { id: uid(), gym_id: db.G, name: 'Purana Staff', job: 'Trainer', phone: null, monthly_salary: 9000, joined_on: addD(today(), -90), active: false, shift: 'full', weekly_off: null, note: null });
    db.products.push({ id: 'p-whey', gym_id: db.G, name: 'Whey 1kg', category: 'Supplements', price: 3000, cost: 0, stock: 2, low_at: 3, active: true }, { id: 'p-water', gym_id: db.G, name: 'Water bottle', category: 'Drinks', price: 20, cost: 0, stock: 100, low_at: 3, active: true });
    db.sales.push({ id: uid(), gym_id: db.G, product_id: 'p-whey', product_name: 'Whey 1kg', qty: 6, unit_price: 3000, total: 18000, method: 'Cash', member_id: null, sold_on: addD(today(), -3), voided_at: null, created_at: new Date().toISOString() });
    await login(page); await page.waitForSelector('.tiles');
    await page.click('a[href="#forecast"]'); await page.waitForSelector('[data-act=chip][data-key=fcRate]');
    let txt = await page.textContent('#view');
    ok(/826/.test(txt) && /Due Soon/.test(txt) && !/Frozen One/.test(txt), 'forecast: 70% of one 1,180 renewal, frozen member left out of the list');
    ok(/3,056\.2/.test(txt), 'forecast: 90-day total adds the second bucket (1180 + 3186) x 70%');
    await page.click('[data-act=chip][data-key=fcRate][data-v="100"]'); await page.waitForFunction(() => /1,180/.test(document.querySelector('.tiles').innerText));
    ok(/4,366/.test(await page.textContent('.tiles')), 'forecast: rate 100% shows every renewal in full');
    ok(!(await overflow(page)), 'forecast page: no horizontal overflow');
    await page.click('a[href="#attendance"]'); await page.waitForSelector('[data-act=attMark]');
    txt = await page.textContent('#view');
    ok(/Vikram Trainer/.test(txt) && !/Naya Joiner/.test(txt) && !/Purana Staff/.test(txt), 'attendance lists only active staff who had joined by that day');
    await page.click('[data-act=attMark][data-s=present]'); for (let i = 0; i < 20 && !db.staff_attendance.length; i++) await page.waitForTimeout(150);
    ok(db.staff_attendance.length === 1 && db.staff_attendance[0].status === 'present' && db.staff_attendance[0].day === today(), 'present marked for today');
    await page.click('[data-act=attMark][data-s=half]'); for (let i = 0; i < 20 && db.staff_attendance[0].status !== 'half'; i++) await page.waitForTimeout(150);
    ok(db.staff_attendance.length === 1 && db.staff_attendance[0].status === 'half', 'changing the status keeps one row for the day');
    await page.click('[data-act=attMark][data-s=half]'); for (let i = 0; i < 20 && db.staff_attendance.length; i++) await page.waitForTimeout(150);
    ok(db.staff_attendance.length === 0, 'tapping the same status again clears it');
    await page.click('[data-act=attMark][data-s=present]'); for (let i = 0; i < 20 && !db.staff_attendance.length; i++) await page.waitForTimeout(150);
    await page.waitForFunction(() => /Vikram Trainer10001/.test(document.querySelector('.t tbody tr').textContent));
    ok(true, 'monthly summary: 1 present, 0 half, 0 leave, 0 absent, 1 day worked');
    ok(await page.$eval('[data-act=attDay][data-d="1"]', (b) => b.disabled), 'cannot move to a future day');
    await page.click('[data-act=attDay][data-d="-1"]'); await page.waitForSelector('[data-act=attToday]'); await page.click('[data-act=attMark][data-s=leave]'); for (let i = 0; i < 20 && db.staff_attendance.length < 2; i++) await page.waitForTimeout(150);
    ok(db.staff_attendance.some((r) => r.day === addD(today(), -1) && r.status === 'leave'), 'yesterday can be marked from the day arrows');
    await page.click('[data-act=attToday]'); await page.waitForFunction(() => !document.querySelector('[data-act=attToday]'));
    await page.click('a[href="#staff"]'); await page.waitForSelector('[data-act=editStaff]'); await page.click('[data-act=editStaff]'); await page.waitForSelector('#f_shift');
    await page.selectOption('#f_shift', 'morning'); await page.selectOption('#f_weekly_off', '0'); await page.click('[data-ok]'); for (let i = 0; i < 20 && db.staff_members[0].shift !== 'morning'; i++) await page.waitForTimeout(150);
    ok(db.staff_members[0].shift === 'morning' && db.staff_members[0].weekly_off === 0, 'staff form saves shift and weekly off (0 = Sunday)');
    await page.click('a[href="#store"]'); await page.waitForSelector('[data-act=newProduct]');
    const card = await page.$$eval('section.card', (c) => c.filter((x) => x.querySelector('h2') && /Reorder list|दोबारा मँगाने की सूची/.test(x.querySelector('h2').textContent)).map((x) => ({ t: x.textContent, h: [...x.querySelectorAll('a')].map((a) => a.href) })));
    ok(card.length === 1 && /Whey 1kg/.test(card[0].t) && !/Water bottle/.test(card[0].t), 'reorder list names the low product and not the well-stocked one');
    ok(card[0].h.some((h) => /^https:\/\/wa\.me\//.test(h) && /Whey%201kg%20%C3%97%20/.test(h)), 'reorder list can be sent on WhatsApp with item and quantity');
  });

  console.log('activity log');
  await session(browser, 'gym_admin', async (page, db) => {
    const at = (min) => new Date(Date.now() - min * 60000).toISOString(), row = (action, detail, actor, min) => ({ id: db.audit_log.length + 1, at: at(min), actor, gym_id: db.G, action, detail });
    db.audit_log.push(row('act_payment_add', { no: 'RCT-0007', amount: 400, method: 'UPI', member: 'Rahul Sharma', paid_on: today() }, db.me, 5),
      row('act_sale_add', { product: 'Whey 1kg', qty: 2, total: 6000, method: 'Cash' }, db.me, 20),
      row('act_member_update', { name: 'Rahul Sharma', changes: { status: ['Active', 'Frozen'] } }, null, 40),
      row('act_staff_update', { name: 'Vikram Trainer', changes: { monthly_salary: [12000, 15000] } }, db.me, 60),
      row('act_brand_new_thing', {}, null, 90));
    await login(page); await page.waitForSelector('.tiles');
    await page.click('a[href="#activity"]'); await page.waitForSelector('[data-act=chip][data-key=actF]');
    let txt = await page.textContent('#view');
    ok(/Rahul Sharma/.test(txt) && /RCT-0007/.test(txt) && /Whey 1kg/.test(txt) && /Vikram Trainer/.test(txt), 'activity log lists payment, sale and staff change');
    ok(/act_brand_new_thing/.test(txt), 'an action the page does not know yet is still shown');
    ok(/अपने-आप|Automatic/.test(txt), 'a row with no person is labelled automatic');
    ok((await page.$$('#view .list li')).length === 5, 'all five rows shown under All');
    await page.click('[data-act=chip][data-key=actF][data-v=money]'); await page.waitForFunction(() => document.querySelectorAll('#view .list li').length === 1);
    ok(/RCT-0007/.test(await page.textContent('#view .list')), 'Money filter keeps only the payment');
    await page.click('[data-act=chip][data-key=actF][data-v=store]'); await page.waitForFunction(() => document.querySelectorAll('#view .list li').length === 1 && /Whey 1kg/.test(document.querySelector('#view .list').innerText));
    ok(/Whey 1kg/.test(await page.textContent('#view .list')), 'Store filter keeps only the sale');
    await page.click('[data-act=chip][data-key=actF][data-v=all]');
    { const [dl] = await Promise.all([page.waitForEvent('download'), page.click('[data-act=actCsv]')]); const csv = fs.readFileSync(await dl.path(), 'utf8');
      ok(/When \(IST\)/.test(csv) && /RCT-0007/.test(csv) && /Vikram Trainer/.test(csv), 'activity CSV downloads with the readable sentences'); }
    ok(!(await overflow(page)), 'activity page: no horizontal overflow');
  });
  console.log('trainer does not get owner-only pages');
  await session(browser, 'trainer', async (page) => {
    await login(page); await page.waitForSelector('.tiles');
    ok(!(await page.$('a[href="#forecast"]')) && !(await page.$('a[href="#attendance"]')) && !(await page.$('a[href="#activity"]')), 'trainer has no forecast, attendance or activity page');
    await page.click('a[href="#store"]'); await page.waitForSelector('#view h1');
    ok(!/Reorder list|दोबारा मँगाने की सूची/.test(await page.textContent('#view')), 'trainer does not see the reorder list');
  });
  {
    const db = makeDb('member'); db.profiles[0].gym_id = null; const ctx = await browser.newContext(), page = await ctx.newPage(); await ctx.route(SB + '/**', handler(db, 'member'));
    await page.goto(`http://127.0.0.1:${server.address().port}/`); await login(page); await page.waitForSelector('[data-act=signOut]');
    ok(/मंज़ूरी|approval/.test(await page.textContent('#gate')), 'unassigned user sees the waiting screen'); await ctx.close();
  }


  console.log('data deletion: the member asks; the owner erases or rejects');
  await session(browser, 'member', async (page, db) => {
    await login(page); await page.waitForSelector('.tiles');
    await page.evaluate(() => (location.hash = 'me'));
    await page.waitForSelector('[data-act=delRequest]', { timeout: 15000 });
    ok(/Delete my data|मेरा डेटा हटाएँ/.test(await page.textContent('#view')), 'member: the delete-my-data card is on the profile page');
    await page.click('[data-act=delRequest]'); await page.click('[data-yes]');
    await page.waitForFunction(() => /reached the gym|जिम तक पहुँचा/.test(document.querySelector('#view').innerText), null, { timeout: 10000 });
    ok(db.deletion && db.deletion.status === 'pending', 'member: the request is filed with the gym');
    ok((await page.$$('[data-act=delRequest]')).length === 0, 'member: no second request while one is waiting');
  });
  await session(browser, 'gym_admin', async (page, db) => {
    const id = uid(); db.members[0].photo_path = 'G/photo-1.jpg';
    db.deletion = { id, status: 'pending', requested_at: new Date().toISOString(), member_id: db.members[0].id };
    await login(page); await page.waitForSelector('.tiles');
    await page.click('a[href="#settings"]'); await page.waitForSelector('[data-act=delErase]', { timeout: 10000 });
    ok(/Data deletion requests|डेटा हटाने के अनुरोध/.test(await page.textContent('#view')), 'owner: the deletion queue is on Settings');
    ok(!(await page.isDisabled('[data-act=delErase]')), 'owner: erase is enabled while the gym is open');
    await page.click('[data-act=delErase]'); await page.click('[data-yes]');
    for (let i = 0; i < 20 && !(db.deletion && db.deletion.status === 'done'); i++) await page.waitForTimeout(150);
    ok(db.photoDeleted && /photo-1\.jpg/.test(db.photoDeleted), 'owner: the photo is removed from storage before the record');
    ok(db.deletion.status === 'done' && db.deletionArgs && db.deletionArgs.p_request === id, 'owner: the request is erased');
    ok(db.members[0].name === 'Deleted member' && db.members[0].phone === null, 'owner: the member row is anonymised');
  });
  await session(browser, 'gym_admin', async (page, db) => {
    db.photoFail = true; db.members[0].photo_path = 'G/photo-2.jpg';
    db.deletion = { id: uid(), status: 'pending', requested_at: new Date().toISOString(), member_id: db.members[0].id };
    await login(page); await page.waitForSelector('.tiles');
    await page.click('a[href="#settings"]'); await page.waitForSelector('[data-act=delErase]', { timeout: 10000 });
    await page.click('[data-act=delErase]'); await page.click('[data-yes]');
    for (let i = 0; i < 20 && !db.photoDeleted; i++) await page.waitForTimeout(150);
    await page.waitForTimeout(300);
    ok(db.photoDeleted && db.deletion.status === 'pending' && !db.deletionArgs, 'owner: if the photo cannot be removed, nothing is erased and the request stays open');
  });
  await session(browser, 'gym_admin', async (page, db) => {
    db.deletion = { id: uid(), status: 'pending', requested_at: new Date().toISOString(), member_id: db.members[0].id };
    await login(page); await page.waitForSelector('.tiles');
    await page.click('a[href="#settings"]'); await page.waitForSelector('[data-act=delReject]', { timeout: 10000 });
    await page.click('[data-act=delReject]'); await page.waitForSelector('#delNote');
    await page.fill('#delNote', 'ab'); await page.click('[data-go]'); await page.waitForTimeout(300);
    ok(db.deletion.status === 'pending' && !db.deletionArgs, 'owner: a reason under 3 characters is refused before it is sent');
    await page.fill('#delNote', 'Member asked after the refund was processed'); await page.click('[data-go]');
    for (let i = 0; i < 20 && db.deletion.status !== 'rejected'; i++) await page.waitForTimeout(150);
    ok(db.deletion.status === 'rejected' && db.deletionArgs && db.deletionArgs.p_note === 'Member asked after the refund was processed', 'owner: the rejection is saved with its reason');
  });
  await session(browser, 'gym_admin', async (page, db) => {
    db.gyms[0].lock_override = 'force_lock';
    db.deletion = { id: uid(), status: 'pending', requested_at: new Date().toISOString(), member_id: db.members[0].id };
    await login(page); await page.waitForSelector('.tiles', { timeout: 15000 });
    await page.click('a[href="#settings"]'); await page.waitForSelector('[data-act=delErase]', { timeout: 10000 });
    ok(await page.isDisabled('[data-act=delErase]'), 'owner: a locked gym cannot erase, the button is disabled');
  });

  console.log('AI operator');
  /* leads, members and invoices for the operator page, and the proposals the database would have written for them */
  const opSeed = (db) => {
    const G = db.G, t = today(), now = new Date().toISOString();
    const mk = (name, phone, end) => ({ id: uid(), gym_id: G, name, phone, status: 'Active', start_date: addD(t, -30), end_date: end, joined_on: addD(t, -60), wa_opt_out: false });
    const lead = (name, phone, stage, fu) => ({ id: uid(), gym_id: G, name, phone, source: 'Walk-in', stage, interest: null, note: null, follow_up_on: fu, created_at: now, updated_at: now });
    const asha = lead('Asha Lead', '9811100001', 'New', addD(t, -1)), closed = lead('Closed Lead', '9811100002', 'Converted', addD(t, -1)), later = lead('Later Lead', '9811100003', 'Contacted', addD(t, 5));
    const ravi = mk('Ravi Ending', '9822200002', addD(t, 2)), renewed = mk('Renewed Rita', '9822200003', addD(t, 30)), dues = mk('Dues Dev', '9822200004', addD(t, 40)), paid = mk('Paid Pooja', '9822200005', addD(t, 40));
    db.leads.push(asha, closed, later); db.members.push(ravi, renewed, dues, paid);
    const inv = (m, no, total) => ({ id: uid(), gym_id: G, member_id: m.id, no, date: addD(t, -20), due: addD(t, -5), subtotal: total, discount: 0, gst_pct: 0, gst_amt: 0, total, cancelled: false, items: [], created_at: now });
    const invDue = inv(dues, 'INV-OP-1', 600), invPaid = inv(paid, 'INV-OP-2', 500);
    db.invoices.push(invDue, invPaid);
    db.payments.push({ id: uid(), gym_id: G, invoice_id: invPaid.id, member_id: paid.id, amount: 500, no: 'R-OP-1', paid_on: addD(t, -3), method: 'Cash', ref: null });
    const act = (kind, subject, member, detail) => ({ id: uid(), gym_id: G, kind, subject_id: subject, member_id: member, detail, status: 'proposed', created_at: now });
    /* four of these seven are no longer true today: a converted lead, a lead moved to later, a member who renewed, an invoice that was paid */
    const proposals = [act('lead_followup', asha.id, null, { stage: 'New' }), act('lead_followup', closed.id, null, {}), act('lead_followup', later.id, null, {}), act('expiry_nudge', ravi.id, ravi.id, { end_date: ravi.end_date }), act('expiry_nudge', renewed.id, renewed.id, { end_date: addD(t, 1) }), act('dues_nudge', invDue.id, dues.id, {}), act('dues_nudge', invPaid.id, paid.id, {})];
    return { asha, ravi, dues, invDue, proposals, act, lead, now };
  };
  const opOn = (db) => { db.operator_settings = [{ gym_id: db.G, enabled: true, lead_followups: true, expiry_nudges: true, dues_nudges: true, lead_stale_days: 3 }]; };
  await session(browser, 'gym_admin', async (page, db) => {
    let opReq = 0; page.on('request', (r) => { if (/operator_(actions|settings)/.test(r.url())) opReq++; });
    const S = opSeed(db);
    await login(page); await page.waitForSelector('.tiles', { timeout: 15000 });
    ok(!(await page.$('a.banner[href="#operator"]')), 'operator: no banner while the tables are not installed');
    const before = opReq;
    await page.evaluate(() => (location.hash = 'operator'));
    await page.waitForFunction(() => /Being set up|सेटअप हो रहा है/.test(document.querySelector('#view').innerText), null, { timeout: 10000 });
    await page.evaluate(() => (location.hash = 'dashboard')); await page.waitForSelector('.tiles');
    ok(opReq === before, 'operator: a missing table is not requested again on every visit');
    /* the migration is applied: the tables exist, the operator is still off */
    db.operator_settings = []; db.operator_actions = S.proposals; await page.evaluate(() => { OP_GONE_AT = 0; });
    await page.evaluate(() => (location.hash = 'operator')); await page.waitForSelector('[data-act=opSettings]', { timeout: 10000 });
    ok(/Turn on|चालू करें/.test(await page.textContent('#view')) && !(await page.$('[data-op]')), 'operator: off by default, explains itself and lists nothing');
    await page.click('[data-act=opSettings]'); await page.waitForSelector('#f_enabled');
    ok((await page.isChecked('#f_enabled')) && (await page.inputValue('#f_stale')) === '3', 'operator: the form starts with the rules on and 3 days');
    await page.fill('#f_stale', '20'); await page.click('[data-ok]');
    ok(/1 से 14|1 to 14/.test(await page.textContent('#e_stale')) && !db.opSetArgs, 'operator: 20 days is refused before anything is sent');
    await page.fill('#f_stale', '3'); await page.click('[data-ok]'); await page.waitForSelector('[data-op]', { timeout: 10000 });
    ok(db.opSetArgs && Object.keys(db.opSetArgs).sort().join() === 'p_dues,p_enabled,p_expiry,p_leads,p_stale' && db.opSetArgs.p_enabled === true && db.opSetArgs.p_stale === 3, 'operator: settings are sent with the named arguments');
    ok(db.opScanCalls === 1, 'operator: turning it on scans straight away');
    const names = await page.$$eval('[data-op] b', (b) => b.map((x) => x.textContent));
    ok(names.length === 3 && names.includes('Asha Lead') && names.includes('Ravi Ending') && names.includes('Dues Dev'), 'operator: only proposals that are still true are listed: ' + names.join(','));
    ok(/(All|सभी)\s*3/.test(await page.textContent('.chip[aria-selected=true]')), 'operator: the All chip counts 3');
    const wa = async (who) => decodeURIComponent(await page.locator('[data-op]', { hasText: who }).locator('a.wa').getAttribute('href'));
    const aw = await wa('Asha Lead'), dw = await wa('Dues Dev');
    ok(/wa\.me\/919811100001\?/.test(aw) && /Asha Lead/.test(aw), 'operator: the lead message opens WhatsApp for that number');
    ok(/600/.test(dw) && /INV-OP-1/.test(dw) && /9785300123@okbizaxis/.test(dw), 'operator: the dues message has the amount, the invoice and the UPI id');
    ok(/tel:9811100001/.test(await page.locator('[data-op]', { hasText: 'Asha Lead' }).locator('a[href^="tel:"]').getAttribute('href')), 'operator: a Call link is offered');
    await page.evaluate(() => (location.hash = 'dashboard')); await page.waitForSelector('.tiles');
    const banner = await page.$('a.banner[href="#operator"]');
    ok(banner && /3/.test(await banner.textContent()), 'operator: the dashboard says how many people to follow up');
    await page.evaluate(() => (location.hash = 'operator')); await page.waitForSelector('[data-op]');
    await page.locator('[data-op]', { hasText: 'Asha Lead' }).locator('[data-act=opDone]').click();
    await page.waitForFunction(() => document.querySelectorAll('[data-op]').length === 2, null, { timeout: 10000 });
    const d1 = (db.opDecideCalls || [])[0];
    ok(d1 && d1.p_status === 'done' && db.operator_actions.find((x) => x.id === d1.p_id).subject_id === S.asha.id, 'operator: Done is sent for that lead and the row leaves the list');
    await page.locator('[data-op]', { hasText: 'Ravi Ending' }).locator('[data-act=opSkip]').click();
    await page.waitForFunction(() => document.querySelectorAll('[data-op]').length === 1, null, { timeout: 10000 });
    ok(db.opDecideCalls.length === 2 && db.opDecideCalls[1].p_status === 'skipped', 'operator: Skip is sent as skipped');
    /* another device decided it first: a clear message, and the list is refreshed */
    db.opRefuse = true;
    await page.locator('[data-op]', { hasText: 'Dues Dev' }).locator('[data-act=opDone]').click();
    await page.waitForFunction(() => /already handled|पहले ही हो चुका/.test(document.body.innerText), null, { timeout: 10000 });
    db.opRefuse = false;
    ok(db.opDecideCalls.length === 3 && !!(await page.$('[data-op]')), 'operator: a refused decision explains itself');
    /* scan now picks up a new follow-up */
    const fresh = S.lead('Fresh Lead', '9811100009', 'New', addD(today(), 0)); db.leads.push(fresh);
    db.opScanAdds = [S.act('lead_followup', fresh.id, null, {})];
    await page.evaluate(() => { LEADS_AT = 0; });
    await page.click('[data-act=opScan]');
    await page.waitForFunction(() => /Fresh Lead/.test(document.querySelector('#view').innerText), null, { timeout: 10000 });
    ok(db.opScanCalls === 2 && /Fresh Lead/.test(await page.textContent('#view')), 'operator: Scan now adds the new follow-up');
    await page.click('.chip[data-v=dues_nudge]');
    ok((await page.$$('[data-op]')).length === 1 && /Dues Dev/.test(await page.textContent('#view')), 'operator: the Dues chip shows only dues');
    ok(!db.rpcShapeErrors, 'operator: every call uses the argument names PostgREST needs');
  });
  await session(browser, 'gym_admin', async (page, db) => {
    db.gyms[0].lock_override = 'force_lock';
    const S = opSeed(db); db.operator_actions = S.proposals; opOn(db);
    await login(page); await page.waitForSelector('.tiles', { timeout: 15000 });
    await page.evaluate(() => (location.hash = 'operator')); await page.waitForSelector('[data-op]', { timeout: 10000 });
    ok((await page.isDisabled('[data-act=opDone]')) && (await page.isDisabled('[data-act=opSkip]')) && (await page.isDisabled('[data-act=opScan]')), 'operator: a locked gym cannot decide or scan, the buttons are disabled');
  });
  await session(browser, 'gym_admin', async (page, db) => {
    const S = opSeed(db); db.operator_actions = S.proposals; opOn(db);
    await login(page); await page.waitForSelector('#view', { timeout: 15000 });
    await page.evaluate(() => (location.hash = 'operator')); await page.waitForSelector('[data-op]', { timeout: 10000 });
    ok(!(await overflow(page)), 'operator: the page has no horizontal overflow on a phone');
  }, { width: 390, height: 800 });

  console.log('social links and videos');
  const SOC_ROW = (o = {}) => ({ whatsapp: 'https://wa.me/919785300123', instagram: 'https://www.instagram.com/royalthegym/', facebook: 'https://www.facebook.com/royal.the.gym', youtube: 'https://www.youtube.com/@royalthegym', videos: [{ id: 'dQw4w9WgXcQ', title: 'Warm up <b>routine</b>' }, { id: 'abcdefghijk', title: '' }], updated_at: new Date().toISOString(), ...o });
  const goEn = async (page) => { await page.evaluate(() => localStorage.setItem('gymos-lang', 'en')); await page.reload(); await page.waitForSelector('#loginForm'); };
  const ytStub = async (page) => {
    await page.route('https://i.ytimg.com/**', (r) => (/dQw4w9WgXcQ/.test(r.request().url()) ? r.fulfill({ status: 200, contentType: 'image/png', body: PNG }) : r.abort()));
    await page.route('https://www.youtube-nocookie.com/**', (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>player</title>' }));
  };
  const toSocial = async (page, sel = '[data-act=socialConnect], .shero') => { await page.evaluate(() => (location.hash = 'social')); await page.waitForSelector(sel, { timeout: 10000 }); };
  const waitSets = async (page, db, n) => { for (let i = 0; i < 40 && (db.socialSets || []).length < n; i++) await page.waitForTimeout(150); };
  await session(browser, 'gym_admin', async (page, db) => {
    await goEn(page); await ytStub(page); await login(page); await page.waitForSelector('.tiles');
    ok((await page.$$('#nav a[href="#social"]')).length === 1, 'social: the owner has a Social & videos menu item');
    // Settings: a short card that points to the page
    await page.click('a[href="#settings"]'); await page.waitForSelector('[data-act=gymProfile]');
    ok(/0\/4 connected/.test(await page.textContent('#view')) && (await page.$$('#view a[href="#social"]')).length === 1, 'social: Settings shows 0 of 4 connected with a link to the page');
    await page.click('#view a[href="#social"]'); await page.waitForSelector('[data-act=socialConnect]');
    const kinds = await page.$$eval('[data-act=socialConnect]', (b) => b.map((x) => x.dataset.kind + ':' + x.dataset.scope).join());
    ok(kinds === 'whatsapp:gym,instagram:gym,facebook:gym,youtube:gym', 'social: one Connect button for each of the four networks');
    ok(/Royal The Gym/.test(await page.textContent('.shero')) && (await page.$eval('.shero a[href^="tel:"]', (a) => a.getAttribute('href'))) === 'tel:9785300123' && !(await page.$('.shero a[href*="maps"]')), 'social: the gym card shows the name and a Call button, and no Map button without a map link');
    ok((await page.$$('[data-act=socialVideos]')).length === 1 && /No videos yet/.test(await page.textContent('#view')), 'social: an empty video shelf invites the owner to add videos');
    // a link from another site is refused, and nothing is sent
    await page.click('[data-act=socialConnect][data-kind=instagram]'); await page.waitForSelector('#f_link');
    ok(/Connect Instagram/.test(await page.textContent('.ov h2')) && (await page.$eval('#soc_prev', (e) => e.textContent.trim())) === '', 'social: the connect box opens for Instagram with an empty preview');
    await page.fill('#f_link', 'https://example.com/royalthegym');
    ok(/Not recognised/.test(await page.textContent('#soc_prev .n')), 'social: the preview says a link from another site is not recognised');
    await page.click('[data-ok]'); ok((await page.textContent('#e_link')).length > 0 && !db.socialSets, 'social: a link from another site is refused before anything is sent');
    // a pasted address becomes the one clean address; the preview shows it first
    await page.fill('#f_link', 'https://instagram.com/RoyalTheGym?igsh=abc');
    ok(/Will connect/.test(await page.textContent('#soc_prev .y')) && (await page.$eval('#soc_prev a', (a) => a.getAttribute('href') + '|' + a.textContent)) === 'https://www.instagram.com/royalthegym/|@royalthegym', 'social: the preview shows the clean address and the @handle before saving');
    await page.click('[data-ok]'); await waitSets(page, db, 1);
    ok(db.socialSets && db.socialSets.length === 1 && db.socialSets[0].fn === 'social_set' && JSON.stringify(db.socialSets[0].p) === JSON.stringify({ instagram: 'https://www.instagram.com/royalthegym/' }), 'social: Connect sends only the Instagram address, inside { p }');
    await page.waitForFunction(() => !document.querySelector('.ov') && /@royalthegym/.test(document.querySelector('#view').textContent));
    const ig = await page.$eval('#view a[data-soc=instagram]', (a) => [a.getAttribute('href'), a.target, a.rel]);
    ok(ig[0] === 'https://www.instagram.com/royalthegym/' && ig[1] === '_blank' && /noopener/.test(ig[2]) && /noreferrer/.test(ig[2]), 'social: the connected Instagram button opens in a new tab with noopener noreferrer');
    // WhatsApp: a plain mobile number
    await page.click('[data-act=socialConnect][data-kind=whatsapp]'); await page.waitForSelector('#f_link');
    await page.fill('#f_link', '97853 00123'); ok(/\+91 97853 00123/.test(await page.textContent('#soc_prev')), 'social: a plain mobile number previews as +91 97853 00123');
    await page.click('[data-ok]'); await waitSets(page, db, 2);
    ok(JSON.stringify(db.socialSets[1].p) === JSON.stringify({ whatsapp: 'https://wa.me/919785300123' }), 'social: the mobile number is saved as a wa.me link');
    await page.waitForFunction(() => !document.querySelector('.ov'));
    // Paste button: shown when the browser can read the clipboard, and it fills the box
    await page.evaluate(() => { Object.defineProperty(navigator.clipboard, 'readText', { value: async () => '  https://m.facebook.com/royal.the.gym/?ref=bookmarks  ', configurable: true }); });
    await page.click('[data-act=socialConnect][data-kind=facebook]'); await page.waitForSelector('#f_link');
    ok(await page.$eval('#soc_paste', (b) => !b.hidden), 'social: the Paste button is shown when the clipboard can be read');
    await page.click('#soc_paste'); await page.waitForFunction(() => document.querySelector('#f_link').value.trim().length > 0);
    ok((await page.inputValue('#f_link')) === 'https://m.facebook.com/royal.the.gym/?ref=bookmarks' && (await page.$eval('#soc_prev a', (a) => a.getAttribute('href'))) === 'https://www.facebook.com/royal.the.gym', 'social: Paste fills the box and the preview shows the clean Facebook address');
    await page.click('[data-ok]'); await waitSets(page, db, 3);
    ok(JSON.stringify(db.socialSets[2].p) === JSON.stringify({ facebook: 'https://www.facebook.com/royal.the.gym' }), 'social: the Facebook address is saved clean');
    await page.waitForFunction(() => !document.querySelector('.ov'));
    // no clipboard reading: the Paste button stays hidden
    await page.evaluate(() => { Object.defineProperty(navigator.clipboard, 'readText', { value: undefined, configurable: true }); });
    await page.click('[data-act=socialConnect][data-kind=youtube]'); await page.waitForSelector('#f_link');
    ok(await page.$eval('#soc_paste', (b) => b.hidden), 'social: the Paste button stays hidden when the browser cannot read the clipboard');
    // the database turns an address down: the owner reads plain words, not the raw error
    db.socialFail = 'bad youtube link'; await page.fill('#f_link', '@royalthegym'); await page.click('[data-ok]');
    await page.waitForSelector('.toast.bad'); const tt = await page.textContent('.toast.bad');
    ok(/YouTube/.test(tt) && !/bad youtube link/.test(tt), 'social: a database refusal reads in plain words: ' + tt.slice(0, 60)); db.socialFail = null;
    await page.click('[data-ok]'); await waitSets(page, db, 4);
    ok(JSON.stringify(db.socialSets[3].p) === JSON.stringify({ youtube: 'https://www.youtube.com/@royalthegym' }), 'social: a handle becomes the YouTube channel address');
    await page.waitForFunction(() => !document.querySelector('.ov'));
    ok((await page.$$('#view .soc-btns a[data-soc]')).length === 4 && /4\/4|Connected/.test(await page.textContent('#view')), 'social: all four buttons are on the page once connected');
    // disconnect one
    await page.click('[data-act=socialConnect][data-kind=instagram]'); await page.waitForSelector('#soc_off'); await page.click('#soc_off'); await waitSets(page, db, 5);
    ok(JSON.stringify(db.socialSets[4].p) === JSON.stringify({ instagram: null }) && db.social.gym.instagram === null, 'social: Disconnect sends { instagram: null } and the database clears it');
    await page.waitForFunction(() => !document.querySelector('.ov') && !document.querySelector('#view a[data-soc=instagram]'));
    // an empty box on a network that is not connected does nothing
    await page.click('[data-act=socialConnect][data-kind=instagram]'); await page.waitForSelector('#f_link');
    ok(!(await page.$('#soc_off')), 'social: an unconnected network has no Disconnect button');
    await page.click('[data-ok]'); await page.waitForFunction(() => !document.querySelector('.ov'));
    ok(db.socialSets.length === 5, 'social: saving an empty box on an unconnected network sends nothing');
    // videos: bad line, too many, then valid
    await page.click('[data-act=socialVideos][data-scope=gym]'); await page.waitForSelector('#f_videos');
    await page.fill('#f_videos', 'https://youtu.be/dQw4w9WgXcQ Warm up <b>routine</b>\nnot a link'); await page.click('[data-ok]');
    ok(/2/.test(await page.textContent('#e_videos')) && db.socialSets.length === 5, 'social: a bad line is named by its number and nothing is sent');
    await page.fill('#f_videos', ['aaaaaaaaaaa', 'bbbbbbbbbbb', 'ccccccccccc', 'ddddddddddd', 'eeeeeeeeeee', 'fffffffffff', 'ggggggggggg'].join('\n')); await page.click('[data-ok]');
    ok(/6/.test(await page.textContent('#e_videos')) && db.socialSets.length === 5, 'social: seven videos are refused with the limit of 6');
    await page.fill('#f_videos', 'https://youtu.be/dQw4w9WgXcQ?t=5 Warm up <b>routine</b>\nhttps://www.youtube.com/watch?v=abcdefghijk\nyoutu.be/dQw4w9WgXcQ');
    ok(/2 of 6/.test(await page.textContent('#soc_vcount')), 'social: the box counts two distinct videos out of 6');
    await page.click('[data-ok]'); await waitSets(page, db, 6);
    ok(JSON.stringify(db.socialSets[5].p) === JSON.stringify({ videos: [{ id: 'dQw4w9WgXcQ', title: 'Warm up <b>routine</b>' }, { id: 'abcdefghijk', title: '' }] }), 'social: the video list is saved as ids and titles, the repeated video once');
    await page.waitForFunction(() => !document.querySelector('.ov') && document.querySelectorAll('#view .vgrid .vid').length === 2);
    ok((await page.$$('#view .vgrid .vid b b')).length === 0 && /Warm up <b>routine<\/b>/.test(await page.textContent('#view .vgrid')), 'social: a title with markup is shown as text, never as markup');
    // thumbnails: one loads, one is blocked and falls back to a plain tile
    await page.waitForFunction(() => document.querySelectorAll('#view .vgrid .vth.noimg').length === 1);
    ok(await page.$eval('#view .vgrid .vth img.vthimg[src*="dQw4w9WgXcQ"]', (i) => !i.hidden && i.naturalWidth > 0) && await page.$eval('#view .vgrid .vth.noimg img.vthimg', (i) => i.hidden && /abcdefghijk/.test(i.src)), 'social: a thumbnail that fails is hidden and its tile keeps the play button');
    // play: a nocookie player in a sandbox, with a plain link under it
    await page.click('[data-act=playVideo][data-id=dQw4w9WgXcQ]'); await page.waitForSelector('.vframe iframe');
    const fr = await page.$eval('.vframe iframe', (f) => [f.src, f.getAttribute('sandbox'), f.getAttribute('referrerpolicy')]);
    ok(/^https:\/\/www\.youtube-nocookie\.com\/embed\/dQw4w9WgXcQ\?/.test(fr[0]) && /allow-scripts/.test(fr[1]) && !/allow-top-navigation/.test(fr[1]) && fr[2] === 'strict-origin-when-cross-origin', 'social: the video plays in a youtube-nocookie player in a sandbox without top navigation');
    const wy = await page.$eval('.ov a[href*="watch"]', (a) => [a.getAttribute('href'), a.target, a.rel]);
    ok(wy[0] === 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' && wy[1] === '_blank' && /noopener/.test(wy[2]), 'social: "Watch on YouTube" opens the video in a new tab safely');
    await page.keyboard.press('Escape'); await page.waitForFunction(() => !document.querySelector('.vframe'));
    ok(true, 'social: closing the window removes the player');
    // remove every video: an empty box
    await page.click('[data-act=socialVideos][data-scope=gym]'); await page.waitForSelector('#f_videos');
    ok((await page.inputValue('#f_videos')).split('\n').length === 2 && /youtu\.be\/dQw4w9WgXcQ/.test(await page.inputValue('#f_videos')), 'social: the edit box starts with the saved videos, one per line');
    await page.fill('#f_videos', ''); await page.click('[data-ok]'); await waitSets(page, db, 7);
    ok(JSON.stringify(db.socialSets[6].p) === JSON.stringify({ videos: [] }) && db.social.gym.videos.length === 0, 'social: an empty box removes all videos');
    await page.waitForFunction(() => !document.querySelector('.ov') && /No videos yet/.test(document.querySelector('#view').textContent));
    // the Settings card still works after a failed read
    db.socialViewFail = true; await page.evaluate(() => bust('social')); await page.click('a[href="#settings"]'); await page.waitForSelector('[data-act=gymProfile]');
    ok(!/Social & videos/.test(await page.textContent('#view')) && (await page.$$('#view [data-act=gymProfile]')).length === 1, 'social: Settings still opens, without the social card, when the social data cannot be read'); db.socialViewFail = false;
    await toSocial(page); await page.evaluate(() => { socialConnect('instagram', 'platform'); socialVideos('platform'); }); await page.waitForTimeout(400);
    ok(!(await page.$('.ov')), 'social: a gym owner cannot open the platform editor, even when the action is called directly');
    ok(!(db.rpcShapeErrors || []).some((x) => /^social_/.test(x)), 'social: every call had the right shape (no wrong-argument errors)');
  });
  console.log('social: a locked gym, a trainer, a member and the platform admin');
  await session(browser, 'gym_admin', async (page, db) => {
    db.social = { gym: SOC_ROW(), platform: null }; db.gyms[0].lock_override = 'force_lock';
    await goEn(page); await ytStub(page); await login(page); await page.waitForSelector('.tiles', { timeout: 15000 }); await toSocial(page);
    ok((await page.$$eval('[data-act=socialConnect]', (b) => b.every((x) => x.disabled))) && (await page.isDisabled('[data-act=socialVideos]')), 'social: a locked gym cannot change links or videos');
    ok((await page.$$('#view .soc-btns a[data-soc]')).length === 4 && (await page.$$('#view .vgrid .vid')).length === 2, 'social: a locked gym still shows its links and videos');
    await page.click('[data-act=playVideo][data-id=abcdefghijk]'); await page.waitForSelector('.vframe iframe'); ok(true, 'social: a locked gym can still play its videos'); await page.keyboard.press('Escape');
    ok(!db.socialSets, 'social: nothing was written while locked');
  });
  await session(browser, 'trainer', async (page, db) => {
    db.social = { gym: SOC_ROW(), platform: SOC_ROW({ whatsapp: null, facebook: null, youtube: null, videos: [{ id: 'zzzzzzzzzzz', title: 'Welcome' }] }) };
    await goEn(page); await ytStub(page); await login(page); await page.waitForSelector('.tiles'); await toSocial(page, '.shero');
    ok((await page.$$('#nav a[href="#social"]')).length === 1 && !(await page.$('[data-act=socialConnect]')) && !(await page.$('[data-act=socialVideos]')), 'social: a trainer sees the page but has nothing to edit');
    await page.evaluate(() => { socialConnect('instagram', 'gym'); socialVideos('gym'); }); await page.waitForTimeout(400);
    ok(!(await page.$('.ov')) && !db.socialSets, 'social: the edit actions do nothing for a trainer, even when called directly');
    ok((await page.$$('.shero .soc-btns a[data-soc]')).length === 4 && /From GymOS/.test(await page.textContent('#view')) && (await page.$$('#view .vgrid .vid')).length === 3, 'social: the trainer sees the gym links, the GymOS link and 2 + 1 videos');
  });
  await session(browser, 'member', async (page, db) => {
    db.social = { gym: SOC_ROW(), platform: SOC_ROW({ whatsapp: null, facebook: null, youtube: null, videos: [{ id: 'zzzzzzzzzzz', title: 'Welcome to GymOS' }] }) };
    await goEn(page); await ytStub(page); await login(page); await page.waitForSelector('.tiles');
    await page.evaluate(() => (location.hash = 'me')); await page.waitForSelector('[data-act=changePw]');
    ok((await page.$$('#view .soc-btns a[data-soc]')).length === 4 && (await page.$$('#view .soc-btns a[href="#social"]')).length === 1, 'social: the member profile has the four follow buttons and a Videos link');
    await page.click('#view .soc-btns a[href="#social"]'); await page.waitForSelector('.shero');
    ok(!(await page.$('[data-act=socialConnect]')) && !(await page.$('[data-act=socialVideos]')), 'social: a member cannot edit anything');
    await page.evaluate(() => { socialConnect('instagram', 'gym'); socialVideos('gym'); socialConnect('instagram', 'platform'); socialVideos('platform'); }); await page.waitForTimeout(400);
    ok(!(await page.$('.ov')) && !db.socialSets, 'social: the edit actions do nothing for a member, even when called directly');
    const hrefs = await page.$$eval('.shero a[data-soc]', (a) => a.map((x) => x.dataset.soc + '|' + x.getAttribute('href') + '|' + x.target + '|' + /noopener/.test(x.rel)));
    ok(hrefs.join() === 'whatsapp|https://wa.me/919785300123|_blank|true,instagram|https://www.instagram.com/royalthegym/|_blank|true,facebook|https://www.facebook.com/royal.the.gym|_blank|true,youtube|https://www.youtube.com/@royalthegym|_blank|true', 'social: the four follow buttons open the right pages in new tabs');
    ok(/From GymOS/.test(await page.textContent('#view')) && (await page.$$('#view .vgrid .vid')).length === 3, 'social: the member also sees the GymOS videos');
    await page.click('[data-act=playVideo][data-id=zzzzzzzzzzz]'); await page.waitForSelector('.vframe iframe');
    ok(/Welcome to GymOS/.test(await page.textContent('.ov h2')), 'social: a GymOS video plays with its title'); await page.keyboard.press('Escape');
    ok(!db.socialSets && !(db.rpcShapeErrors || []).some((x) => /^social_/.test(x)), 'social: the member only read data');
    // a gym that has added nothing
    db.social = { gym: null, platform: null }; await page.evaluate(() => { bust('social'); render(); }); await page.waitForSelector('.shero');
    ok(/Nothing here yet/.test(await page.textContent('#view')) && !(await page.$('#view .vgrid')), 'social: a gym with no links or videos shows a polite empty card');
    await page.evaluate(() => (location.hash = 'me')); await page.waitForSelector('[data-act=changePw]');
    ok(!(await page.$('#view .soc-btns')), 'social: the member profile has no social row when there is nothing to show');
  });
  await session(browser, 'super_admin', async (page, db) => {
    db.social = { gym: null, platform: SOC_ROW({ videos: [] }) };
    await goEn(page); await ytStub(page); await login(page); await page.waitForSelector('.tiles');
    ok((await page.$$('#nav a[href="#social"]')).length === 1, 'social: the platform admin has a Platform profile menu item');
    await toSocial(page); ok(!(await page.$('.shero')), 'social: the platform page has no gym card');
    const kinds = await page.$$eval('[data-act=socialConnect]', (b) => b.map((x) => x.dataset.kind + ':' + x.dataset.scope).join());
    ok(kinds === 'whatsapp:platform,instagram:platform,facebook:platform,youtube:platform' && /GymOS accounts/.test(await page.textContent('#view')), 'social: Connect buttons are for the platform accounts');
    await page.click('[data-act=socialConnect][data-kind=instagram]'); await page.waitForSelector('#f_link');
    ok((await page.inputValue('#f_link')) === 'https://www.instagram.com/royalthegym/' && await page.$eval('#soc_off', (b) => !!b), 'social: a connected account opens with its address and a Disconnect button');
    await page.fill('#f_link', '@gymos.app'); await page.click('[data-ok]'); await waitSets(page, db, 1);
    ok(db.socialSets[0].fn === 'social_set_platform' && JSON.stringify(db.socialSets[0].p) === JSON.stringify({ instagram: 'https://www.instagram.com/gymos.app/' }), 'social: the platform admin saves through social_set_platform');
    await page.waitForFunction(() => !document.querySelector('.ov') && /@gymos\.app/.test(document.querySelector('#view').textContent));
    await page.click('[data-act=socialVideos][data-scope=platform]'); await page.waitForSelector('#f_videos'); await page.fill('#f_videos', 'https://youtu.be/zzzzzzzzzzz Welcome to GymOS'); await page.click('[data-ok]'); await waitSets(page, db, 2);
    ok(db.socialSets[1].fn === 'social_set_platform' && db.social.platform.videos.length === 1 && db.social.platform.videos[0].id === 'zzzzzzzzzzz', 'social: platform videos are saved through social_set_platform');
    ok(!(db.rpcShapeErrors || []).some((x) => /^social_/.test(x)), 'social: the platform calls had the right shape');
  });
  await session(browser, 'member', async (page, db) => {
    db.social = { gym: SOC_ROW(), platform: null };
    await goEn(page); await ytStub(page); await login(page); await page.waitForSelector('.tiles'); await toSocial(page, '.shero');
    ok(!(await overflow(page)), 'social: the member page has no horizontal overflow on a phone');
    await page.click('[data-act=playVideo][data-id=dQw4w9WgXcQ]'); await page.waitForSelector('.vframe iframe');
    const box = await page.$eval('.ov .md', (m) => { const r = m.getBoundingClientRect(); return [r.left >= 0, r.right <= innerWidth]; });
    ok(box[0] && box[1], 'social: the video window fits inside a phone screen'); await page.keyboard.press('Escape');
  }, { width: 375, height: 760 });
  await session(browser, 'gym_admin', async (page, db) => {
    db.social = { gym: SOC_ROW(), platform: null };
    await goEn(page); await ytStub(page); await login(page); await page.waitForSelector('.tiles'); await toSocial(page);
    ok(!(await overflow(page)), 'social: the owner page has no horizontal overflow on a phone');
    await page.click('[data-act=socialConnect][data-kind=facebook]'); await page.waitForSelector('#f_link');
    const m = await page.$eval('.ov .md', (e) => { const r = e.getBoundingClientRect(); return [r.left >= 0, r.right <= innerWidth]; }); ok(m[0] && m[1], 'social: the connect box fits inside a phone screen');
  }, { width: 375, height: 760 });
  await browser.close(); server.close();
  console.log(fails ? `\n${fails} FAILED` : '\nALL PASSED'); process.exit(fails ? 1 : 0);
})();
