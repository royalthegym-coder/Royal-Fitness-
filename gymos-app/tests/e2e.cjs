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

function makeDb(role) {
  const G = '11111111-1111-4111-8111-111111111111', P1 = uid(), P2 = uid();
  const db = { calls: [], gyms: [{ id: G, name: 'Royal The Gym', owner_name: 'Mahesh', phone: '9785300123', city: 'Jhunjhunu', upi_id: '9785300123@okbizaxis', plan: 'pro', status: 'active', subscription_ends_on: addD(today(), 40), lock_override: 'none' }], plans: [{ id: P1, gym_id: G, name: 'Monthly', months: 1, price: 1000, gst_pct: 18, status: 'Active' }, { id: P2, gym_id: G, name: 'Quarterly', months: 3, price: 2700, gst_pct: 18, status: 'Active' }], members: [], invoices: [], payments: [], visits: [], payment_ledger: [], audit_log: [], profiles: [] };
  const me = '22222222-2222-4222-8222-222222222222';
  db.me = me; db.G = G;
  db.profiles = [{ id: me, gym_id: role === 'super_admin' ? null : G, role, full_name: 'Test', email: 't@x.in', created_at: new Date().toISOString() }, { id: uid(), gym_id: null, role: 'member', full_name: 'New User', email: 'n@x.in', created_at: new Date().toISOString() }];
  const mk = (name, phone, end, extra = {}) => ({ id: uid(), gym_id: G, name, phone, plan_id: P1, start_date: addD(end, -30), end_date: end, status: 'Active', joined_on: addD(end, -30), goal: 'Muscle', gender: null, notes: null, profile_id: null, ...extra });
  db.members = [mk('Rahul Sharma', '9876543210', addD(today(), 20)), mk('Priya Verma', '9812345678', addD(today(), 3)), mk('Old Timer', '9000000001', addD(today(), -10)), mk('Absent Ajay', '9000000002', addD(today(), 15), { joined_on: addD(today(), -60) })];
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
    if (p === '/auth/v1/user' && m === 'PUT') { db.pwChanged = JSON.parse(req.postData()).password; return json({ id: db.me }); }
    if (p === '/auth/v1/logout') return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } });
    if (p.startsWith('/rest/v1/rpc/')) {
      const fn = p.split('/').pop(), a = JSON.parse(req.postData() || '{}');
      if (fn === 'admin_gym_overview') return json(OV);
      if (fn === 'verify_gym_ledger') return json([]);
      if (fn === 'admin_update_gym') { Object.assign(db.gyms[0], { name: a.gym_name, owner_name: a.owner, phone: a.phone_no, city: a.city_name, upi_id: a.upi }); return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } }); }
      return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } });
    }
    const t = p.replace('/rest/v1/', ''), rows = db[t];
    if (!rows) return json({ message: 'nope' }, 404);
    if (m === 'GET') { let r = rows; u.searchParams.forEach((v, k) => { if (v.startsWith('eq.')) r = r.filter((x) => String(x[k]) === v.slice(3)); }); return json(r); }
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
const server = http.createServer((q, s) => { const f = path.join(PUB, q.url === '/' ? 'index.html' : q.url.split('?')[0]); if (!f.startsWith(PUB) || !fs.existsSync(f)) { s.writeHead(404); return s.end(); } s.writeHead(200, { 'content-type': f.endsWith('.js') ? 'text/javascript' : f.endsWith('.css') ? 'text/css' : 'text/html' }); s.end(fs.readFileSync(f)); });

async function session(browser, role, fn, vp = { width: 1280, height: 800 }) {
  const db = makeDb(role), ctx = await browser.newContext({ viewport: vp }), page = await ctx.newPage(), errs = [];
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
    const nav = await page.$$eval('#nav a', (a) => a.length); ok(nav === 10, 'gym admin sees 10 menu items');
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
    // check-in
    await page.click('a[href="#checkin"]'); await page.fill('#cq', 'priya'); await page.waitForSelector('[data-act=checkIn]');
    await page.click('[data-act=checkIn]'); await page.waitForFunction(() => /Checked in|चेक-इन हो गया/.test(document.body.innerText));
    ok(db.visits.length === 2, 'check-in stored');
    await page.fill('#cq', 'old'); await page.waitForSelector('[data-act=checkIn][disabled]'); ok(true, 'expired member cannot check in');
    // payment (partial) -> receipt -> ledger
    await page.click('a[href="#invoices"]'); await page.waitForSelector('tr.click'); await page.click('tr.click:has-text("INV-0001")');
    await page.waitForSelector('[data-p]'); await page.click('[data-p]'); await page.fill('#f_amount', '2000'); await page.click('[data-ok]');
    ok((await page.textContent('#e_amount')).length > 0, 'overpayment rejected'); await page.fill('#f_amount', '500'); await page.click('[data-ok]');
    await page.waitForSelector('a.btn.wa'); ok(/wa\.me\/919876543210/.test(await page.getAttribute('a.btn.wa', 'href')), 'receipt has WhatsApp link to member');
    ok(db.payments.length === 1 && db.payments[0].amount === 500, 'partial payment stored'); await page.keyboard.press('Escape');
    await page.click('a[href="#ledger"]'); await page.waitForSelector('table.t'); await page.click('[data-act=verifyLedger]'); await page.waitForSelector('.banner.ok');
    ok(true, 'ledger verify shows OK banner');
    // retention + peak + settings
    await page.click('a[href="#retention"]'); await page.waitForSelector('.list');
    ok(/Absent Ajay/.test(await page.textContent('#view')), 'retention lists the absent member');
    await page.click('a[href="#peak"]'); await page.waitForSelector('.heat'); ok(true, 'peak heatmap renders');
    await page.click('a[href="#settings"]'); await page.click('[data-act=editGym]'); await page.fill('#f_city', 'Jaipur'); await page.click('[data-ok]');
    await page.waitForFunction(() => /Jaipur/.test(document.body.innerText)); ok(db.gyms[0].city === 'Jaipur', 'gym settings saved via RPC');
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
    for (const lang of ['hi', 'en']) {
      for (const r of ['dashboard', 'members', 'checkin', 'plans', 'invoices', 'payments', 'ledger', 'retention', 'peak', 'settings']) {
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
  await session(browser, 'super_admin', async (page) => {
    await login(page); await page.waitForSelector('.tiles'); ok((await page.$$eval('#nav a', (a) => a.length)) === 4, 'super admin sees 4 menu items');
    ok(!/Check-in|चेक-इन/.test(await page.textContent('#nav')), 'super admin has no gym operations menu');
    await page.click('a[href="#users"]'); await page.waitForSelector('table.t'); await page.click('a[href="#status"]'); await page.waitForSelector('.list'); ok(true, 'users + status render');
  });

  console.log('member + waiting');
  await session(browser, 'member', async (page) => { await login(page); await page.waitForSelector('.tiles'); ok(/Rahul/.test(await page.textContent('#view')), 'member sees own page'); ok((await page.$$eval('#nav a', (a) => a.length)) === 1, 'member sees one menu item'); });
  {
    const db = makeDb('member'); db.profiles[0].gym_id = null; const ctx = await browser.newContext(), page = await ctx.newPage(); await ctx.route(SB + '/**', handler(db, 'member'));
    await page.goto(`http://127.0.0.1:${server.address().port}/`); await login(page); await page.waitForSelector('[data-act=signOut]');
    ok(/मंज़ूरी|approval/.test(await page.textContent('#gate')), 'unassigned user sees the waiting screen'); await ctx.close();
  }

  await browser.close(); server.close();
  console.log(fails ? `\n${fails} FAILED` : '\nALL PASSED'); process.exit(fails ? 1 : 0);
})();
