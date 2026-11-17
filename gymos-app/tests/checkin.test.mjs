// Check-in: the pure planner, the device outbox and roster, the replay of queued scans, and the scan flows
// (online, repeat, check-out, offline queue, expired/unknown members, refused rows, a full device store, a locked gym).
import fs from 'fs';
const read = (p) => fs.readFileSync(new URL('../src/' + p, import.meta.url), 'utf8');
const lib = read('a-lib.js'), src = read('c18-scan.js');

// network and page helpers that live in other files: the Supabase reads, toast, render and the member-state rule
const shim = `
const Q = {
  members: async () => { if (globalThis.__offline) throw Object.assign(new Error('net'), { status: 0 }); return globalThis.__members; },
  visits: async () => { if (globalThis.__offline) throw Object.assign(new Error('net'), { status: 0 }); return globalThis.__visits; },
};
const gymId = () => CTX.profile.gym_id;
const toast = (m, t) => { globalThis.__toasts.push([String(m), t || '']); };
const bust = () => {}; const render = () => {}; const currentRoute = () => null; const STATE_HI = {};
const memberState = (m) => (m.status === 'Frozen' ? 'Frozen' : m.status === 'Cancelled' ? 'Cancelled' : m.end_date && m.end_date < todayISO() ? 'Expired' : 'Active');
`;

class MemStore {
  constructor() { this.m = new Map(); this.fail = false; }
  getItem(k) { return this.m.has(k) ? this.m.get(k) : null; }
  setItem(k, v) { if (this.fail) throw new Error('quota'); this.m.set(k, String(v)); }
  removeItem(k) { if (this.fail) throw new Error('quota'); this.m.delete(k); }
}
const store = new MemStore();
const win = { localStorage: store, GYMOS_CONFIG: {} };
const docStub = { addEventListener() {}, querySelector() { return null; }, querySelectorAll() { return []; }, documentElement: { dataset: {} } };

let api;
try {
  api = new Function('document', 'window', 'localStorage', lib + '\n' + shim + '\n' + src +
    '\n; return { PASS_RE, newVisitId, planScan, outboxRead, outboxWrite, rosterSave, rosterLoad, rosterClear, flushCheckIns, scanCheckIn, safeStore, MEM_STORE, OUTBOX_KEY, ROSTER_KEY, SCAN_REPEAT_MS, DB, CTX, saveSession, istDate, todayISO, Q };')(docStub, win, store);
} catch (e) { console.error('load', e.stack || e.message); process.exit(1); }
const { planScan, outboxRead, outboxWrite, rosterSave, rosterLoad, flushCheckIns, scanCheckIn, newVisitId, SCAN_REPEAT_MS, OUTBOX_KEY, ROSTER_KEY, DB, CTX, saveSession, istDate, PASS_RE } = api;

let n = 0;
const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exit(1); } n++; };
const G = '11111111-1111-4111-8111-111111111111', OTHER = '99999999-9999-4999-8999-999999999999';
const M1 = '22222222-2222-4222-8222-222222222222', M2 = '33333333-3333-4333-8333-333333333333', M3 = '44444444-4444-4444-8444-444444444444';
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const iso = (ms) => new Date(ms).toISOString();
const pass = (id) => `gymos:${id}`;
const NOW = Date.now(), TODAY = istDate(new Date(NOW));

function reset() {
  store.m.clear(); store.fail = false;
  globalThis.__members = [{ id: M1, gym_id: G, name: 'Asha', status: 'Active', end_date: '2099-01-01', phone: '9999900001' }, { id: M2, gym_id: G, name: 'Ravi', status: 'Active', end_date: '2099-01-01', phone: '9999900002' }];
  globalThis.__visits = []; globalThis.__offline = false; globalThis.__toasts = []; globalThis.__calls = []; globalThis.__insertErr = null; globalThis.__updateErr = null;
  DB.insert = async (t, row) => { globalThis.__calls.push(['insert', t, row]); if (globalThis.__insertErr) throw globalThis.__insertErr; globalThis.__visits.push({ id: row.id, member_id: row.member_id, gym_id: row.gym_id, in_at: row.in_at, out_at: null }); return row; };
  DB.update = async (t, id, patch) => { globalThis.__calls.push(['update', t, id, patch]); if (globalThis.__updateErr) throw globalThis.__updateErr; const v = globalThis.__visits.find((x) => x.id === id); if (v) Object.assign(v, patch); return { id, ...patch }; };
  CTX.profile = { gym_id: G, role: 'gym_admin' };
  CTX.gym = { status: 'active', lock_override: null, subscription_ends_on: '2099-01-01' };
  saveSession({ access_token: 't', refresh_token: 'r', expires_at: 4102444800, user_id: 'u', email: 'x' });
}
const writes = () => globalThis.__calls.filter((c) => c[0] === 'insert' || c[0] === 'update').length;
const lastToast = () => (globalThis.__toasts.length ? globalThis.__toasts[globalThis.__toasts.length - 1] : ['', '']);

/* ---- pure planner ---- */
ok(PASS_RE.test(pass(M1)) && !PASS_RE.test('gymos:not-a-uuid') && !PASS_RE.test('hello'), 'pass format');
ok(planScan([], [], M1, TODAY, NOW).action === 'in', 'no visits: check in');
ok(planScan(null, undefined, M1, TODAY, NOW).action === 'in', 'bad input never throws: check in');
{ const v = [{ id: 'a', member_id: M1, in_at: iso(NOW - 30000), out_at: null }]; const p = planScan(v, [], M1, TODAY, NOW); ok(p.action === 'repeat' && p.id === 'a', 'open 30 s ago is a repeat, not a check-out'); }
{ const v = [{ id: 'a', member_id: M1, in_at: iso(NOW - 300000), out_at: null }]; const p = planScan(v, [], M1, TODAY, NOW); ok(p.action === 'out' && p.id === 'a', 'open 5 min ago checks out'); }
{ const v = [{ id: 'a', member_id: M1, in_at: iso(NOW - SCAN_REPEAT_MS), out_at: null }]; ok(planScan(v, [], M1, TODAY, NOW).action === 'out', 'exactly 2 minutes is a check-out (boundary)'); }
{ const v = [{ id: 'a', member_id: M1, in_at: iso(NOW - 300000), out_at: iso(NOW - 60000) }]; ok(planScan(v, [], M1, TODAY, NOW).action === 'in', 'a closed visit lets the member check in again'); }
{ const v = [{ id: 'a', member_id: M1, in_at: iso(NOW - 26 * 3600000), out_at: null }]; ok(planScan(v, [], M1, TODAY, NOW).action === 'in', 'an open visit from an earlier day does not block today'); }
{ const v = [{ id: 'a', member_id: M2, in_at: iso(NOW - 30000), out_at: null }]; ok(planScan(v, [], M1, TODAY, NOW).action === 'in', 'another member’s visit is ignored'); }
{ const v = [{ id: 'old', member_id: M1, in_at: iso(NOW - 600000), out_at: null }, { id: 'new', member_id: M1, in_at: iso(NOW - 60000), out_at: null }]; ok(planScan(v, [], M1, TODAY, NOW).id === 'new', 'with two open visits the newest one is used'); }
{ const ob = [{ key: 'k', type: 'in', id: 'q', gym_id: G, member_id: M1, in_at: iso(NOW - 60000) }]; const p = planScan([], ob, M1, TODAY, NOW); ok(p.action === 'repeat' && p.id === 'q', 'a queued check-in counts as open'); }
{ const ob = [{ key: 'k', type: 'in', id: 'q', gym_id: G, member_id: M1, in_at: iso(NOW - 60000) }, { key: 'k2', type: 'out', gym_id: G, visit_id: 'q', out_at: iso(NOW) }]; ok(planScan([], ob, M1, TODAY, NOW).action === 'in', 'a queued check-in that is also queued out is closed'); }
{ const v = [{ id: 'a', member_id: M1, in_at: iso(NOW - 300000), out_at: null }]; const ob = [{ key: 'k2', type: 'out', gym_id: G, visit_id: 'a', out_at: iso(NOW) }]; ok(planScan(v, ob, M1, TODAY, NOW).action === 'in', 'a queued check-out closes a server visit'); }
{ const ob = [{ key: 'k', type: 'in', id: 'q', gym_id: G, member_id: M2, in_at: iso(NOW - 60000) }]; ok(planScan([], ob, M1, TODAY, NOW).action === 'in', 'a queued check-in for another member is ignored'); }

/* ---- ids ---- */
{ const ids = new Set(); for (let i = 0; i < 50; i++) ids.add(newVisitId()); ok([...ids].every((x) => UUID_V4.test(x)) && ids.size === 50, 'visit ids are unique version-4 UUIDs'); }

/* ---- device outbox ---- */
reset();
outboxWrite(store, [{ key: 'a', type: 'in', id: 'a', gym_id: G, member_id: M1, in_at: iso(NOW) }]);
ok(outboxRead(store).length === 1 && outboxRead(store)[0].key === 'a', 'outbox round trip');
store.setItem(OUTBOX_KEY, JSON.stringify([{ key: 'ok', type: 'in', gym_id: G, id: 'x', member_id: M1 }, { type: 'in' }, { key: 'z', type: 'zzz', gym_id: G }, null, { key: 'nogym', type: 'in' }]));
ok(outboxRead(store).length === 1 && outboxRead(store)[0].key === 'ok', 'outbox keeps only well-formed entries');
store.setItem(OUTBOX_KEY, '{not json'); ok(outboxRead(store).length === 0, 'corrupt outbox reads as empty');
store.setItem(OUTBOX_KEY, '{"a":1}'); ok(outboxRead(store).length === 0, 'non-list outbox reads as empty');
outboxWrite(store, []); ok(store.getItem(OUTBOX_KEY) === null, 'an empty outbox is removed from storage');
{ const bad = { getItem: () => null, setItem() { throw new Error('quota'); }, removeItem() {} }; ok(outboxWrite(bad, [{ key: 'a' }]) === false, 'a full device store reports failure, not a crash'); ok(outboxRead({ getItem() { throw new Error('denied'); } }).length === 0, 'a blocked store reads as empty'); }

/* ---- roster snapshot (for offline check-in) ---- */
reset();
rosterSave(store, [{ id: M1, name: 'Asha', status: 'Active', end_date: '2099-01-01', phone: '9999900001' }], [{ id: 'v1', member_id: M1, in_at: iso(NOW), out_at: null }, { id: 'v-old', member_id: M1, in_at: iso(NOW - 6 * 864e5), out_at: null }]);
{ const raw = store.getItem(ROSTER_KEY); ok(!raw.includes('9999900001'), 'the snapshot keeps no phone numbers'); const s = rosterLoad(store, G); ok(s && s.members.length === 1 && s.visits.length === 1 && s.visits[0].id === 'v1', 'the snapshot keeps two days of visits, nothing older'); }
ok(rosterLoad(store, OTHER) === null, 'a snapshot is only used for its own gym');
store.setItem(ROSTER_KEY, '{bad'); ok(rosterLoad(store, G) === null, 'a corrupt snapshot is ignored');
store.removeItem(ROSTER_KEY); ok(rosterLoad(store, G) === null, 'no snapshot means no offline check-in');
reset();
rosterSave(store, [{ id: M1, name: 'Asha', status: 'Active' }], []);
outboxWrite(store, [{ key: 'keep', type: 'in', id: 'keep', gym_id: G, member_id: M1, in_at: iso(NOW) }]);
api.rosterClear();
ok(rosterLoad(store, G) === null && outboxRead(store).length === 1, 'sign-out clears member names but keeps unsent check-ins');

/* ---- the replay ---- */
reset();
outboxWrite(store, [{ key: 'in1', type: 'in', id: 'in1', gym_id: G, member_id: M1, in_at: iso(NOW - 120000) }, { key: 'out1', type: 'out', gym_id: G, visit_id: 'in1', out_at: iso(NOW - 60000) }]);
{ const r = await flushCheckIns(); ok(r.length === 2 && r.every((x) => x.outcome === 'sent'), 'a queued check-in and check-out are both sent');
  ok(globalThis.__calls[0][0] === 'insert' && globalThis.__calls[1][0] === 'update', 'they are sent in order (in before out)');
  ok(outboxRead(store).length === 0, 'the queue is empty after a full replay'); }
reset();
outboxWrite(store, [{ key: 'dup', type: 'in', id: 'dup', gym_id: G, member_id: M1, in_at: iso(NOW) }]);
globalThis.__insertErr = Object.assign(new Error('dup'), { code: '23505', status: 409 });
{ const r = await flushCheckIns(); ok(r.length === 1 && r[0].outcome === 'sent', 'a resend of a recorded check-in counts as sent'); }
reset();
outboxWrite(store, [{ key: 'a', type: 'in', id: 'a', gym_id: G, member_id: M1, in_at: iso(NOW) }, { key: 'b', type: 'in', id: 'b', gym_id: G, member_id: M2, in_at: iso(NOW) }]);
globalThis.__insertErr = Object.assign(new Error('net'), { status: 0 });
{ const r = await flushCheckIns(); ok(r.length === 0 && outboxRead(store).length === 2 && globalThis.__calls.length === 1, 'offline: stops at once and keeps every queued scan'); }
reset();
outboxWrite(store, [{ key: 'a', type: 'in', id: 'a', gym_id: G, member_id: M1, in_at: iso(NOW) }, { key: 'b', type: 'in', id: 'b', gym_id: G, member_id: M2, in_at: iso(NOW) }]);
globalThis.__insertErr = Object.assign(new Error('fk'), { code: '23503', status: 409 });
{ const r = await flushCheckIns(); ok(r.length === 2 && r[0].outcome === 'dropped' && r[1].outcome === 'dropped', 'a refusal that cannot succeed later is dropped, and the queue moves on'); ok(outboxRead(store).length === 0, 'dropped scans leave the queue'); }
reset();
outboxWrite(store, [{ key: 'a', type: 'in', id: 'a', gym_id: G, member_id: M1, in_at: iso(NOW) }]);
globalThis.__insertErr = Object.assign(new Error('locked'), { code: '42501', status: 403 });
{ const r = await flushCheckIns(); ok(r.length === 0 && outboxRead(store).length === 1, 'no access (gym locked): the scan stays queued'); }
reset();
outboxWrite(store, [{ key: 'x', type: 'in', id: 'x', gym_id: OTHER, member_id: M1, in_at: iso(NOW) }]);
{ const r = await flushCheckIns(); ok(r.length === 0 && outboxRead(store).length === 1 && globalThis.__calls.length === 0, 'another gym’s queue on this device is left alone'); }
reset();
{ const r = await flushCheckIns(); ok(Array.isArray(r) && r.length === 0, 'an empty queue sends nothing'); }

/* ---- scan flows ---- */
reset();
ok(await scanCheckIn(pass(M1)) === true, 'online: a pass checks the member in');
{ const c = globalThis.__calls[0]; ok(c && c[0] === 'insert' && UUID_V4.test(c[2].id) && c[2].member_id === M1 && c[2].gym_id === G && istDate(c[2].in_at) === TODAY, 'the check-in is written with its own id, gym, member and time'); }
ok(outboxRead(store).length === 0, 'online: nothing is left in the queue');
ok(/checked in|चेक-इन/.test(lastToast()[0]) && /Asha/.test(lastToast()[0]), 'online: the toast names the member');
ok(rosterLoad(store, G) !== null, 'a successful scan refreshes the offline snapshot');
{ const before = writes(); ok(await scanCheckIn(pass(M1)) === true && writes() === before, 'a second scan within 2 minutes writes nothing'); ok(/already|पहले से/.test(lastToast()[0]), 'and says the member is already in'); }
{ const v = globalThis.__visits.find((x) => x.member_id === M1); v.in_at = iso(Date.now() - 180000); const before = writes(); ok(await scanCheckIn(pass(M1)) === true && writes() === before + 1, 'after 3 minutes a scan checks the member out'); ok(globalThis.__visits.find((x) => x.member_id === M1).out_at !== null, 'the visit is closed'); }
{ ok(await scanCheckIn(pass(M1)) === true && globalThis.__visits.filter((x) => x.member_id === M1).length === 2, 'after a check-out the next scan checks in again as a new visit'); }
reset();
globalThis.__members[1] = { ...globalThis.__members[1], status: 'Frozen' };
{ ok(await scanCheckIn(pass(M2)) === false && writes() === 0, 'a frozen member is refused and nothing is written'); }
reset();
{ ok(await scanCheckIn(pass(M3)) === false && writes() === 0 && /not in your gym|आपके जिम/.test(lastToast()[0]), 'a member of another gym or a missing id is refused'); }
ok(await scanCheckIn('hello') === false && /not a GymOS pass|GymOS पास नहीं/.test(lastToast()[0]), 'a code that is not a pass is refused');
reset();
globalThis.__members.push({ id: M3, gym_id: G, name: 'Old', status: 'Active', end_date: '2000-01-01' });
ok(await scanCheckIn(pass(M3)) === false && writes() === 0, 'an expired member is refused');

/* offline: the snapshot lets the front desk keep working, and the scans sync when the line returns */
reset();
ok(await scanCheckIn(pass(M1)) === true, 'setup: a member is checked in while online (snapshot saved)');
globalThis.__visits = [];
globalThis.__offline = true; globalThis.__insertErr = Object.assign(new Error('net'), { status: 0 });
{ const before = globalThis.__calls.length; ok(await scanCheckIn(pass(M2)) === true, 'offline: a scan is accepted from the snapshot'); ok(outboxRead(store).length === 1, 'offline: the scan waits in the device queue');
  ok(/saved on this device|इस डिवाइस पर सेव/.test(lastToast()[0]), 'offline: the staff are told it will sync'); ok(globalThis.__calls.length === before + 1, 'offline: one send is attempted and fails');
  ok(await scanCheckIn(pass(M2)) === true && outboxRead(store).length === 1, 'offline: a second scan of the same member is a repeat, not a second queued row'); }
globalThis.__offline = false; globalThis.__insertErr = null;
{ const r = await flushCheckIns(); ok(r.length === 1 && r[0].outcome === 'sent' && outboxRead(store).length === 0, 'back online: the queued check-in is sent and the queue is cleared'); ok(globalThis.__visits.some((x) => x.member_id === M2), 'the server now has the offline check-in'); }
reset();
ok(await scanCheckIn(pass(M1)) === true, 'setup for the no-snapshot case');
store.removeItem(ROSTER_KEY); globalThis.__offline = true; globalThis.__members = [];
ok(await scanCheckIn(pass(M2)) === false && /Connect once|एक बार कनेक्ट/.test(lastToast()[0]), 'offline with no snapshot: a clear message, no guess');
reset();
globalThis.__insertErr = Object.assign(new Error('fk'), { code: '23503', status: 409 });
ok(await scanCheckIn(pass(M2)) === false && outboxRead(store).length === 0 && /could not be saved|सेव नहीं/.test(lastToast()[0]), 'a refused check-in is reported, not shown as done');
reset();
store.fail = true;
ok(await scanCheckIn(pass(M2)) === false && writes() === 0 && /cannot store|सेव नहीं हो सकता/.test(lastToast()[0]), 'a full device store refuses the scan and writes nothing');
store.fail = false;
reset();
CTX.gym = { status: 'suspended' };
ok(await scanCheckIn(pass(M1)) === false && writes() === 0 && /Subscription|सब्सक्रिप्शन/.test(lastToast()[0]), 'a locked gym refuses check-in');
reset();

console.log(`checkin: ${n} checks passed`);
