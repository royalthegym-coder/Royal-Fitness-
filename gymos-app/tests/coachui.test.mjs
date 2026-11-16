import fs from 'fs';
const lib = fs.readFileSync(new URL('../src/a-lib.js', import.meta.url), 'utf8');
const src = fs.readFileSync(new URL('../src/c36-coach.js', import.meta.url), 'utf8').split('async function coachFn')[0];
let fn; try { fn = new Function('document', 'window', 'localStorage', 'U', lib + '\n' + src + '; return { coachErrText, coachRows, coachCanSend, coachLeftLabel, coachOwnerSummary, COACH_ERR, COACH_CHIPS };'); } catch (e) { console.error('load', e.message); process.exit(1); }
const { coachErrText, coachRows, coachCanSend, coachLeftLabel, coachOwnerSummary, COACH_ERR, COACH_CHIPS } = fn({ querySelector() {}, querySelectorAll() { return []; }, documentElement: {} }, {}, { getItem() {}, setItem() {} }, {});
let n = 0; const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exit(1); } n++; };
// every code the server can return has a message in both languages, and unknown codes get a generic one
['not_configured', 'disabled', 'limit', 'gym_limit', 'too_fast', 'bad_text', 'unavailable', 'closed', 'members_only', 'no_member'].forEach((k) => ok(COACH_ERR[k] && COACH_ERR[k][0] && COACH_ERR[k][1], 'message for ' + k));
ok(/not counted|गिना नहीं/.test(coachErrText('unavailable')) && /Something went wrong|कुछ गड़बड़/.test(coachErrText('weird')) && /Something went wrong|कुछ गड़बड़/.test(coachErrText(undefined)), 'unavailable says the question was not counted; unknown codes are generic');
// rows
const rows = coachRows([{ id: 5, role: 'assistant', content: 'b', kind: 'ai' }, { id: 3, role: 'user', content: 'a' }, { id: 4, role: 'system', content: 'x' }, { id: 6, role: 'user', content: '  ' }, null, { id: 7, role: 'assistant', content: 'safe', kind: 'safety' }]);
ok(rows.length === 3 && rows.map((r) => r.id).join() === '3,5,7', 'rows are sorted oldest first and odd ones dropped: ' + rows.map((r) => r.id));
ok(rows[2].safety === true && rows[1].safety === false && rows[0].role === 'user', 'safety flag only for safety rows');
ok(coachRows(null).length === 0 && coachRows('x').length === 0, 'bad input gives no rows');
// can send
ok(coachCanSend('', null) === 'bad_text' && coachCanSend(' a ', null) === 'bad_text' && coachCanSend('x'.repeat(501), null) === 'bad_text', 'too short or too long');
ok(coachCanSend('How much protein?', { remaining: 0 }) === 'limit' && coachCanSend('How much protein?', { remaining: 3 }) === '' && coachCanSend('How much protein?', null) === '' && coachCanSend('How much protein?', {}) === '', 'limit only blocks at zero');
ok(coachCanSend('x'.repeat(500), null) === '' && coachCanSend('ab', null) === '', 'edges are allowed');
ok(/7 of 10|10 में से 7/.test(coachLeftLabel({ remaining: 7, limit: 10 })) && coachLeftLabel(null) === '', 'remaining label');
// owner numbers
const s = coachOwnerSummary({ enabled: true, questions_today: '3', questions_7d: 12, members_7d: 4, members_with_login: 10 });
ok(s.on && s.today === 3 && s.week === 12 && s.users === 4 && s.all === 10 && s.share === 40, 'owner summary');
const z = coachOwnerSummary(null); ok(!z.on && z.today === 0 && z.share === 0, 'owner summary of nothing is zeros, no division by zero');
ok(COACH_CHIPS().length === 4 && COACH_CHIPS().every(([label, q]) => label && q.length > 5 && q.length <= 500), 'starter questions are valid');
console.log(n + ' checks passed');
