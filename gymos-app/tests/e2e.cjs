/* End-to-end test against a MOCKED Supabase (no network, no real data).
   Run: NODE_PATH=$(npm root -g) node tests/e2e.js */
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const PUB = path.join(__dirname, '..', 'public');
const SB = 'https://ayoeevltbubkyhixqqlg.supabase.co';
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
  const db = { calls: [], gyms: [{ id: G, name: 'Royal The Gym', owner_name: 'Mahesh', phone: '9785300123', city: 'Jhunjhunu', upi_id: '9785300123@okbizaxis', plan: 'pro', status: 'active', subscription_ends_on: addD(today(), 40), lock_override: 'none', review_url: role === 'member' ? 'https://g.page/r/CabcDEF123/review' : null }], plans: [{ id: P1, gym_id: G, name: 'Monthly', months: 1, price: 1000, gst_pct: 18, status: 'Active' }, { id: P2, gym_id: G, name: 'Quarterly', months: 3, price: 2700, gst_pct: 18, status: 'Active' }], members: [], invoices: [], payments: [], visits: [], payment_ledger: [], audit_log: [], profiles: [], offers: [], wa_settings: [], wa_log: [], member_fit: [], member_plans: [], daily_summaries: [], expenses: [], leads: [], products: [], sales: [], product_costs: [], sale_costs: [], staff_members: [], salary_payments: [], member_progress: [], member_freezes: [], gym_equipment: [], trainer_commission: [], gym_classes: [], class_bookings: [], gym_tasks: [] };
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
    if (p === '/auth/v1/token') { const b = JSON.parse(req.postData() || '{}'); if (b.password === 'bad') return json({ msg: 'Invalid login credentials' }, 400); return json({ access_token: jwt(db.me), refresh_token: 'r', expires_in: 3600, user: { email: 't@x.in' } }); }
    if (p === '/functions/v1/create-account') { const b = JSON.parse(req.postData()); db.created = b; if (b.email === 'taken@x.in') return json({ error: 'email_taken' }, 409); return json({ email: b.email, password: 'GenPass1234abcd', role: b.role }); }
    if (p === '/functions/v1/wa-dispatch') { const b = JSON.parse(req.postData() || '{}'); (db.waCalls = db.waCalls || []).push(b); return json({ configured: false }); }
    if (p === '/functions/v1/generate-plan') { const b = JSON.parse(req.postData() || '{}'), eng = await ENGINE, fit = db.member_fit.find((f) => f.member_id === b.member_id), mem = db.members.find((x) => x.id === b.member_id); db.genCalls = (db.genCalls || 0) + 1; if (!fit) return json({ error: 'missing_profile' }, 400); db.member_plans = db.member_plans.filter((r) => !(r.member_id === b.member_id && r.status === 'draft')); draftRows(eng, db, mem, fit, 'draft').forEach((r) => db.member_plans.unshift(r)); return json({ ok: true, plans: [], ai: false, needs_review: false }); }
    if (p === '/functions/v1/daily-summary') { db.sumCalls = (db.sumCalls || 0) + 1; if (db.sumFail) return json({ error: 'facts_failed' }, 500); return json({ day: today(), text: 'आज (' + today() + ') की वसूली ₹500 रही (1 भुगतान)। कुल बकाया ₹680 है (1 सदस्य)। आज 1 सदस्य जिम आए।', source: 'rules', cached: false, facts: {} }); }
    if (p === '/auth/v1/user' && m === 'PUT') { db.pwChanged = JSON.parse(req.postData()).password; return json({ id: db.me }); }
    if (p === '/auth/v1/logout') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } });
    if (p.startsWith('/rest/v1/rpc/')) {
      const fn = p.split('/').pop(), a = JSON.parse(req.postData() || '{}');
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
      if (fn === 'admin_set_gym_review_url') { db.gyms[0].review_url = a.link; return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } }); }
      if (fn === 'admin_set_gym_timings') { db.gyms[0].timings = a.timing_text; return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } }); }
      if (fn === 'publish_member_plan') { const r = db.member_plans.find((x) => x.id === a.p); db.member_plans.forEach((x) => { if (x.member_id === r.member_id && x.kind === r.kind && x.status === 'published' && x.id !== r.id) x.status = 'archived'; }); r.status = 'published'; return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } }); }
      if (fn === 'unpublish_member_plan') { const r = db.member_plans.find((x) => x.id === a.p); if (r && r.status === 'published') r.status = 'archived'; return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } }); }
      if (fn === 'admin_update_gym') { Object.assign(db.gyms[0], { name: a.gym_name, owner_name: a.owner, phone: a.phone_no, city: a.city_name, upi_id: a.upi }); return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } }); }
      return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } });
    }
    if (p.startsWith('/storage/v1/object/authenticated/')) return route.fulfill({ status: 200, contentType: 'image/png', headers: { 'access-control-allow-origin': '*' }, body: PNG });
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
      rows.unshift(row); return json([row], 201);
    }
    if (m === 'PATCH') { const id = u.searchParams.get('id').slice(3), r = rows.find((x) => x.id === id); if (!r) return json([]); Object.assign(r, JSON.parse(req.postData())); return json([r]); }
    return json({}, 405);
  };
}
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
const server = http.createServer((q, s) => { const f = path.join(PUB, q.url === '/' ? 'index.html' : q.url.split('?')[0]); if (!f.startsWith(PUB) || !fs.existsSync(f)) { s.writeHead(404); return s.end(); } s.writeHead(200, { 'content-type': f.endsWith('.js') ? 'text/javascript' : f.endsWith('.css') ? 'text/css' : f.endsWith('.webp') ? 'image/webp' : f.endsWith('.png') ? 'image/png' : f.endsWith('.webmanifest') ? 'application/manifest+json' : 'text/html' }); s.end(fs.readFileSync(f)); });

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
    const nav = await page.$$eval('#nav a', (a) => a.length); ok(nav === 20, 'gym admin sees 20 menu items');
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
    // renew with payment
    await page.click('tr.click:has-text("Rahul")'); await page.waitForSelector('[data-r]'); await page.click('[data-r]');
    await page.waitForSelector('#rn_sum'); ok(/1,?180/.test(await page.textContent('#rn_sum')), 'renew preview shows total with GST');
    const endBefore = db.members.find((m) => m.name === 'Rahul Sharma').end_date;
    await page.click('[data-ok]'); await page.waitForSelector('a.btn.wa');
    const rahul = db.members.find((m) => m.name === 'Rahul Sharma');
    ok(rahul.end_date > endBefore && db.payments.length === 1 && db.payments[0].amount === 1180, 'renewal extends membership and records full payment');
    await page.keyboard.press('Escape'); db.payments.length = 0; db.payment_ledger.length = 0;
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
    ok((await page.textContent('#e_amount')).length > 0, 'overpayment rejected'); await page.fill('#f_amount', '500'); await page.focus('#f_amount'); await page.keyboard.press('Enter'); await page.keyboard.press('Enter');
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
    await page.click('a[href="#peak"]'); await page.waitForSelector('.heat'); ok(true, 'peak heatmap renders');
    await page.click('a[href="#settings"]'); await page.click('[data-act=editGym]'); await page.fill('#f_city', 'Jaipur'); await page.fill('#f_timings', 'Mon-Sat 5:30 AM - 10 PM'); await page.click('[data-ok]'); for (let i = 0; i < 20 && db.gyms[0].timings !== 'Mon-Sat 5:30 AM - 10 PM'; i++) await page.waitForTimeout(150); ok(db.gyms[0].timings === 'Mon-Sat 5:30 AM - 10 PM', 'gym timings saved');
    await page.waitForFunction(() => /Jaipur/.test(document.body.innerText)); ok(db.gyms[0].city === 'Jaipur', 'gym settings saved via RPC');
    // Google review link: only Google https links are accepted; a QR and a button appear
    await page.click('[data-act=editGym]'); await page.fill('#f_review', 'http://evil.example.com/x'); await page.click('[data-ok]');
    ok((await page.textContent('#e_review')).length > 0 && !db.gyms[0].review_url, 'non-Google or non-https review link rejected');
    await page.fill('#f_review', 'https://g.page/r/CabcDEF123/review'); await page.click('[data-ok]');
    await page.waitForSelector('.qrbox svg path'); ok(db.gyms[0].review_url === 'https://g.page/r/CabcDEF123/review', 'review link saved and a QR shows on the settings page');
    ok((await page.$$eval('#view a[href="https://g.page/r/CabcDEF123/review"]', (x) => x.length)) === 1, 'settings page links to the review page');
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
    ok(/wa\.me\/919812345678/.test(wl) && /सदस्यता/.test(wl) && /UPI: 9785300123@okbizaxis/.test(wl), 'reminder opens WhatsApp with a ready Hindi message');
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
      await page.waitForSelector('#scanIn'); await scan('gymos:' + pr.id); ok(db.visits.length === n0 + 1 && !!db.visits.find((v) => v.member_id === pr.id).out_at, 'scanning again checks the member out');
      await page.waitForSelector('#scanIn'); await scan('gymos:' + old.id); ok(db.visits.length === n0 + 1, 'an expired member is not checked in by a scan');
      await page.waitForSelector('#scanIn'); await scan('hello'); await scan('gymos:' + uid()); ok(db.visits.length === n0 + 1, 'unknown and foreign codes are refused'); }
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
    ok((await page.textContent('#e_phone')).length > 0, 'short lead phone rejected'); await page.fill('#f_phone', '9812345678'); await page.fill('#f_follow_up_on', today()); await page.click('[data-ok]');
    await page.waitForFunction(() => /Vikram Lead/.test(document.body.innerText));
    ok(db.leads.length === 1 && db.leads[0].stage === 'New' && db.leads[0].source === 'Walk-in', 'lead saved as New');
    ok(/1/.test(await page.textContent('.tiles .card:nth-child(2) .v')), 'lead due today is counted');
    ok(/wa\.me\/919812345678/.test(await page.$eval('a[href*="wa.me"]', (a) => a.href)), 'WhatsApp button opens the lead chat');
    await page.click('[data-act=leadNext]'); await page.waitForFunction(() => /Contacted|संपर्क हुआ/.test(document.querySelector('table.t tbody').innerText));
    ok(db.leads[0].stage === 'Contacted', 'lead moved to Contacted');
    await page.click('[data-act=leadConvert]'); await page.waitForSelector('#f_name');
    ok((await page.inputValue('#f_name')) === 'Vikram Lead' && (await page.inputValue('#f_phone')) === '9812345678', 'member form is prefilled from the lead');
    await page.click('[data-ok]'); for (let i = 0; i < 25 && db.leads[0].stage !== 'Converted'; i++) await page.waitForTimeout(150);
    const nm = db.members.find((x) => x.name === 'Vikram Lead');
    ok(!!nm && db.leads[0].stage === 'Converted' && db.leads[0].converted_member_id === nm.id, 'lead marked Converted only after the member exists');
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
    await page.click('.nav .more'); await page.waitForSelector('.sheet-links a'); ok((await page.$$('.sheet-links a')).length === 20, 'More sheet lists all 20 pages in groups');
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
    await login(page); await page.waitForSelector('.tiles'); ok((await page.$$eval('#nav a', (a) => a.length)) === 5, 'super admin sees 5 menu items');
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

  console.log('member portal on phone');
  await session(browser, 'member', async (page) => {
    await login(page); await page.waitForSelector('.tiles');
    for (const r of ['mine', 'plan', 'pay', 'visits', 'book', 'progress', 'me']) { await page.evaluate((h) => (location.hash = h), r); await page.waitForTimeout(250); await page.waitForSelector('#view .ph'); if (await overflow(page)) ok(false, `member overflow on ${r}`); }
    ok(true, 'phone: no overflow on any member page');
  }, { width: 390, height: 800 });

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
    ok((await page.$$eval('#nav a', (a) => a.length)) === 7, 'member portal has 7 pages');
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
  });
  {
    const db = makeDb('member'); db.profiles[0].gym_id = null; const ctx = await browser.newContext(), page = await ctx.newPage(); await ctx.route(SB + '/**', handler(db, 'member'));
    await page.goto(`http://127.0.0.1:${server.address().port}/`); await login(page); await page.waitForSelector('[data-act=signOut]');
    ok(/मंज़ूरी|approval/.test(await page.textContent('#gate')), 'unassigned user sees the waiting screen'); await ctx.close();
  }

  await browser.close(); server.close();
  console.log(fails ? `\n${fails} FAILED` : '\nALL PASSED'); process.exit(fails ? 1 : 0);
})();
