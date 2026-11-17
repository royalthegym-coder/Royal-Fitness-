// Luxury palettes: the list, the cycle, the stored choice, and tolerance of bad or blocked storage.
import fs from 'fs';
const lib = fs.readFileSync(new URL('../src/a-lib.js', import.meta.url), 'utf8');
const src = fs.readFileSync(new URL('../src/c39-luxe.js', import.meta.url), 'utf8');
const docStub = { addEventListener() {}, querySelector() { return null; }, querySelectorAll() { return []; }, documentElement: { dataset: {} } };
let api;
try {
  api = new Function('document', 'window', 'localStorage', lib + '\n' + src + '\n; return { LUXE, luxeValid, luxeNext, luxeLabel, luxeRead };')(docStub, {}, { getItem() { return null; }, setItem() {}, removeItem() {} });
} catch (e) { console.error('load', e.message); process.exit(1); }
const { LUXE, luxeValid, luxeNext, luxeLabel, luxeRead } = api;

let n = 0;
const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exit(1); } n++; };

// four palettes, unique ids, both languages named
ok(LUXE.length === 4, 'four palettes');
ok(new Set(LUXE.map((x) => x[0])).size === 4, 'palette ids are unique');
ok(LUXE.every((x) => x[1] && x[2]), 'every palette has an English and a Hindi name');
ok(LUXE[0][0] === 'royal', 'the first palette is the default, royal gold');

// the cycle goes through all four and comes back
let id = 'royal', seen = [];
for (let i = 0; i < 4; i++) { seen.push(id); id = luxeNext(id); }
ok(seen.join() === 'royal,emerald,sapphire,ruby' && id === 'royal', 'the cycle visits all four and returns to royal');

// validation
ok(luxeValid('ruby') && luxeValid('emerald') && !luxeValid('neon') && !luxeValid(undefined) && !luxeValid(''), 'only known ids are valid');
ok(luxeNext('neon') === 'royal', 'an unknown current palette moves to the first one, never to nothing');

// labels always resolve
ok(/Ruby|माणिक/.test(luxeLabel('ruby')) && luxeLabel('neon') === luxeLabel('royal'), 'labels fall back to royal for an unknown id');

// stored choice
ok(luxeRead({ getItem: () => 'emerald' }) === 'emerald', 'a stored valid palette is used');
ok(luxeRead({ getItem: () => 'neon' }) === 'royal', 'a stored unknown palette falls back to royal');
ok(luxeRead({ getItem: () => null }) === 'royal', 'nothing stored means royal');
ok(luxeRead({ getItem() { throw new Error('denied'); } }) === 'royal', 'blocked storage means royal, never a crash');

console.log(`luxe: ${n} checks passed`);
