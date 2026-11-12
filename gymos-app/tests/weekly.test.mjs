import fs from 'fs';
const lib = fs.readFileSync(new URL('../src/a-lib.js', import.meta.url), 'utf8');
const src = fs.readFileSync(new URL('../src/c26-weekly.js', import.meta.url), 'utf8').split('async function weeklyCard')[0];
let fn; try { fn = new Function('document', 'window', 'localStorage', lib + '\n' + src + '; return { weekStats, pctChange };'); } catch (e) { console.error('load', e.message); process.exit(1); }
const { weekStats, pctChange } = fn({ querySelector() {}, querySelectorAll() { return []; }, documentElement: {} }, {}, { getItem() {}, setItem() {} });
let n = 0; const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exit(1); } n++; };
const T = '2026-11-12';
const pay = (d, a) => ({ paid_on: d, amount: a });
const at = (d, h = 6) => ({ member_id: 'm' + d, in_at: d + 'T0' + h + ':00:00+05:30' });
const members = [{ joined_on: '2026-11-10', status: 'Active', end_date: '2026-11-15' }, { joined_on: '2026-11-03', status: 'Active', end_date: '2026-11-30' }, { joined_on: '2026-10-01', status: 'Frozen', end_date: '2026-11-14' }, { joined_on: '2026-11-13', status: 'Active', end_date: '2026-11-13' }];
const s = weekStats(members, [pay('2026-11-12', 1000), pay('2026-11-06', 500), pay('2026-11-05', 700), pay('2026-10-29', 100)], [at('2026-11-12'), at('2026-11-12', 7), at('2026-11-07'), at('2026-11-01')], T);
ok(s.collected[0] === 1500 && s.collected[1] === 700, 'collection windows: 6-12 Nov and 30 Oct-5 Nov (' + s.collected + ')');
ok(s.joined[0] === 1 && s.joined[1] === 1, 'new members per window; a future join date is not counted (' + s.joined + ')');
ok(s.visits[0] === 3 && s.visits[1] === 1, 'check-ins by window (' + s.visits + ')');
ok(s.people[0] === 2, 'distinct people');
ok(s.ending === 2, 'only active memberships ending within 7 days (frozen excluded, future-joined row counted by end date) ' + s.ending);
ok(pctChange(150, 100) === 50 && pctChange(50, 100) === -50 && pctChange(5, 0) === null, 'percent change, no divide by zero');
console.log(n + ' checks passed');
