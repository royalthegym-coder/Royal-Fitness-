import fs from 'fs';
const lib = fs.readFileSync(new URL('../src/a-lib.js', import.meta.url), 'utf8');
const src = fs.readFileSync(new URL('../src/c37-emi.js', import.meta.url), 'utf8');
let fn; try { fn = new Function('document', 'window', 'localStorage', 'U', lib + '\n' + src + '; return { emiSplit, emiDue, emiPlanPreview, emiProblem, emiNextPart, emiCounts, EMI_ERR, EMI_STATE, EMI_MIN, EMI_MAX };'); } catch (e) { console.error('load', e.message); process.exit(1); }
const { emiSplit, emiDue, emiPlanPreview, emiProblem, emiNextPart, emiCounts, EMI_ERR, EMI_STATE, EMI_MIN, EMI_MAX } = fn({ querySelector() {}, querySelectorAll() { return []; }, documentElement: {} }, {}, { getItem() {}, setItem() {} }, {});
let n = 0; const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exit(1); } n++; };
const TODAY = '2026-11-17';

// split: same numbers as emi_create_plan in the database (verified there in the rollback test)
ok(JSON.stringify(emiSplit(1000, 3)) === '[333.33,333.33,333.34]', 'split 1000 into 3: ' + JSON.stringify(emiSplit(1000, 3)));
ok(JSON.stringify(emiSplit(600, 2)) === '[300,300]', 'split 600 into 2');
ok(JSON.stringify(emiSplit(0.1, 2)) === '[0.05,0.05]', 'paise split');
// property: parts always add up to the total exactly, and no part is off by more than the rounding paise
let bad = '';
for (let t = 0; t < 2000; t++) {
  const total = Math.round(Math.random() * 1e6) / 100 + 1, count = EMI_MIN + Math.floor(Math.random() * (EMI_MAX - EMI_MIN + 1));
  const parts = emiSplit(total, count), paise = parts.map((p) => Math.round(p * 100));
  const sum = paise.reduce((a, b) => a + b, 0);
  if (sum !== Math.round(total * 100) || paise.some((p) => p <= 0) || Math.max(...paise) - Math.min(...paise) > count) { bad = `${total} x ${count} -> ${paise}`; break; }
}
ok(!bad, 'split always adds up: ' + bad);

// due dates: start + months, clamped to the last day of the month like Postgres
ok(emiDue('2026-11-17', 1) === '2026-11-17' && emiDue('2026-11-17', 2) === '2026-12-17' && emiDue('2026-11-17', 3) === '2027-01-17', 'monthly steps across a year end');
ok(emiDue('2026-01-31', 2) === '2026-02-28', 'Jan 31 + 1 month = Feb 28 (non leap)');
ok(emiDue('2028-01-31', 2) === '2028-02-29', 'Jan 31 + 1 month = Feb 29 (leap)');
ok(emiDue('2026-08-31', 4) === '2026-11-30', 'Aug 31 + 3 months = Nov 30');
ok(emiDue('2026-12-15', 2) === '2027-01-15', 'December rolls into January');
const prev = emiPlanPreview(1000, 3, '2026-11-18');
ok(prev.map((r) => r.due_on).join() === '2026-11-18,2026-12-18,2027-01-18' && prev.map((r) => r.amount).join() === '333.33,333.33,333.34', 'preview rows');

// what may be saved: the same limits as the database
ok(emiProblem({ total: 0, count: 3, start: '2026-11-18', today: TODAY }) === 'nothing_due', 'nothing due');
ok(emiProblem({ total: 1000, count: 1, start: '2026-11-18', today: TODAY }) === 'count', 'one installment is not a plan');
ok(emiProblem({ total: 1000, count: 13, start: '2026-11-18', today: TODAY }) === 'count', 'more than 12 is refused');
ok(emiProblem({ total: 1000, count: 2.5, start: '2026-11-18', today: TODAY }) === 'count', 'fractional count is refused');
ok(emiProblem({ total: 1000, count: 3, start: '2026-11-16', today: TODAY }) === 'start_past', 'start in the past');
ok(emiProblem({ total: 1000, count: 3, start: '', today: TODAY }) === 'start_past', 'no start');
ok(emiProblem({ total: 1000, count: 3, start: '2027-01-19', today: TODAY }) === 'start_far', 'start beyond 62 days');
ok(emiProblem({ total: 1000, count: 3, start: TODAY, today: TODAY }) === '', 'start today is fine');
ok(emiProblem({ total: 1000, count: 3, start: '2027-01-18', today: TODAY }) === '', 'start on the 62nd day is fine');
ok(emiProblem({ total: 1000, count: String(EMI_MAX), start: TODAY, today: TODAY }) === '', 'the form sends the count as text');
ok(Object.keys(EMI_ERR()).every((k) => EMI_ERR()[k].length > 5), 'every refusal has a message');
ok(Object.keys(EMI_STATE()).join() === 'paid,overdue,due_today,upcoming', 'every state has a label');

// what the member pays online now: the rest of the next unpaid installment, never more than that
const rowsA = [{ seq: 1, state: 'paid', cum_amount: 333.33, paid_since: 333.33 }, { seq: 2, state: 'upcoming', cum_amount: 666.66, paid_since: 333.33 }, { seq: 3, state: 'upcoming', cum_amount: 1000, paid_since: 333.33 }];
ok(emiNextPart(rowsA) === 333.33, 'next installment amount');
ok(emiNextPart([{ state: 'paid', cum_amount: 333.33, paid_since: 333.33 }, { state: 'paid', cum_amount: 666.66, paid_since: 666.66 }, { state: 'upcoming', cum_amount: 1000, paid_since: 666.66 }]) === 333.34, 'last installment after two payments');
ok(emiNextPart([{ state: 'paid', cum_amount: 333.33, paid_since: 333.33 }, { state: 'overdue', cum_amount: 666.66, paid_since: 400 }]) === 266.66, '400 paid so far, 666.66 needed up to installment 2, so 266.66 is left');
ok(emiNextPart([{ state: 'paid', cum_amount: 100, paid_since: 100 }]) === 0, 'everything paid: nothing to pay');
ok(emiNextPart([]) === 0 && emiNextPart(null) === 0, 'no schedule: nothing to pay');

// counts for the summary line
const c = emiCounts(rowsA.concat([{ state: 'overdue' }]));
ok(c.paid === 1 && c.overdue === 1 && c.total === 4, 'counts');
ok(emiCounts(null).total === 0, 'counts of nothing');

console.log(n + ' checks passed');
