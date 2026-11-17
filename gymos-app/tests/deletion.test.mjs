import fs from 'fs';
const lib = fs.readFileSync(new URL('../src/a-lib.js', import.meta.url), 'utf8');
const src = fs.readFileSync(new URL('../src/c38-privacy.js', import.meta.url), 'utf8');
let fn;
try {
  fn = new Function('document', 'window', 'localStorage', 'U', 'Q', 'cached', lib + '\n' + src + '\n; return { delStatusLabel, delCanRequest, delCanErase, delNoteOk };');
} catch (e) { console.error('load', e.message); process.exit(1); }
const { delStatusLabel, delCanRequest, delCanErase, delNoteOk } = fn({ querySelector() {}, querySelectorAll() { return []; }, documentElement: {} }, {}, { getItem() {}, setItem() {} }, {}, {}, () => {});

let n = 0;
const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exit(1); } n++; };

// status labels: a tone for each state, and every label is a non-empty string
ok(delStatusLabel('pending')[1] === 'warn', 'a waiting request is a warning, not an error');
ok(delStatusLabel('done')[1] === 'ok', 'an erased request is OK');
ok(delStatusLabel('rejected')[1] === 'bad', 'a rejected request needs attention');
ok(delStatusLabel(null)[1] === 'mute' && delStatusLabel(undefined)[1] === 'mute', 'no request is neutral');
ok(delStatusLabel('zzz')[1] === 'mute', 'an unknown status is neutral, never a crash');
for (const s of ['pending', 'done', 'rejected', null]) ok(typeof delStatusLabel(s)[0] === 'string' && delStatusLabel(s)[0].length > 0, 'label text for ' + s);

// a member can file only when nothing is open and nothing was erased
ok(delCanRequest(null) === true && delCanRequest(undefined) === true, 'first request is allowed');
ok(delCanRequest('rejected') === true, 'after a rejection the member may ask again');
ok(delCanRequest('pending') === false, 'no second request while one is waiting');
ok(delCanRequest('done') === false, 'erased data cannot be requested again');

// the owner erases only a pending request while the gym is open
ok(delCanErase('pending', true) === true, 'pending + open can be erased');
ok(delCanErase('pending', false) === false, 'a locked gym cannot erase');
ok(delCanErase('done', true) === false, 'an erased request cannot be erased twice');
ok(delCanErase('rejected', true) === false, 'a rejected request is not erased');
ok(delCanErase('pending', undefined) === false, 'unknown lock state is treated as closed');

// the rejection reason: 3 to 300 characters after trimming, counted as characters
ok(delNoteOk('') === false && delNoteOk(null) === false && delNoteOk(undefined) === false, 'empty reason refused');
ok(delNoteOk('  ab  ') === false, 'two characters after trimming are too short');
ok(delNoteOk('abc') === true, 'three characters is enough');
ok(delNoteOk('नमस्ते') === true, 'Hindi text counts by character');
ok(delNoteOk('x'.repeat(300)) === true && delNoteOk('x'.repeat(301)) === false, 'the 300 limit is exact');
ok(delNoteOk('😀😀') === false, 'two emoji are two characters, too short');

console.log(`deletion: ${n} checks passed`);
