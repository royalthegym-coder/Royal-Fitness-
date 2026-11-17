import fs from 'fs';
const lib = fs.readFileSync(new URL('../src/a-lib.js', import.meta.url), 'utf8');
const src = fs.readFileSync(new URL('../src/c34-onlinepay.js', import.meta.url), 'utf8').split('const ONLINE_STATUS')[0];
let fn; try { fn = new Function('document', 'window', 'localStorage', 'U', 'Q', 'cached', lib + '\n' + src + '; return { safeRzUrl, onlineSummary, PAY_ERR, routeRowLabel };'); } catch (e) { console.error('load', e.message); process.exit(1); }
const { safeRzUrl, onlineSummary, PAY_ERR, routeRowLabel } = fn({ querySelector() {}, querySelectorAll() { return []; }, documentElement: {} }, {}, { getItem() {}, setItem() {} }, {}, {}, () => {});
let n = 0; const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exit(1); } n++; };
ok(safeRzUrl('https://rzp.io/i/abc123') === 'https://rzp.io/i/abc123', 'rzp.io link is allowed');
ok(safeRzUrl('https://pages.razorpay.com/pl_x') === 'https://pages.razorpay.com/pl_x', 'razorpay.com subdomain is allowed');
ok(safeRzUrl('http://rzp.io/i/abc') === '', 'plain http is refused');
ok(safeRzUrl('https://rzp.io.evil.com/i/abc') === '' && safeRzUrl('https://evilrzp.io/i') === '' && safeRzUrl('https://evil.com/razorpay.com') === '', 'look-alike hosts are refused');
ok(safeRzUrl('javascript:alert(1)') === '' && safeRzUrl('') === '' && safeRzUrl(null) === '' && safeRzUrl(undefined) === '' && safeRzUrl('not a url') === '', 'junk is refused');
const O = (status, amount, paid_at, extra = {}) => ({ status, amount, paid_at, ...extra });
const s = onlineSummary([
  O('paid', 1000, '2026-11-02T10:00:00Z'), O('paid', 500.5, '2026-11-14T20:00:00Z'), O('paid', 700, '2026-10-30T10:00:00Z'),
  O('review', 300, null), O('created', 100, null, { rz_link_id: 'p1' }), O('created', 100, null), O('closed', 50, null),
], '2026-11');
ok(s.month === 1500.5, 'only this month\'s paid orders count: ' + s.month);
ok(s.paidCount === 3 && s.review === 1 && s.open === 1, 'counts: ' + JSON.stringify(s));
ok(onlineSummary([O('paid', 100, '2026-10-31T19:00:00Z')], '2026-11').month === 100, 'a payment at 00:30 IST on 1 Nov belongs to November');
ok(onlineSummary([], '2026-11').month === 0, 'empty list is fine');
ok(PAY_ERR('nothing_due') !== PAY_ERR('gateway') && PAY_ERR('zzz').length > 5, 'every code has a message, unknown codes too');
// Route: what the super admin sees for a payment that has not reached the gym's account
ok(routeRowLabel({ transfer_status: 'failed' }, true)[1] === 'bad', 'failed is a problem');
ok(routeRowLabel({ transfer_status: 'routing' }, true)[1] === 'warn', 'an unknown outcome asks for a look at Razorpay first');
ok(routeRowLabel({ transfer_status: null }, false)[1] === 'mute', 'no account yet: waiting, not a problem');
ok(routeRowLabel({ transfer_status: null }, true)[1] === 'info', 'account linked, not sent yet');
ok(routeRowLabel({ transfer_status: 'failed' }, false)[1] === 'bad', 'a failure is shown even without an account');
console.log(n + ' checks passed');
