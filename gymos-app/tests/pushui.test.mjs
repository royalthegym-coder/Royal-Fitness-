import fs from 'fs';
const lib = fs.readFileSync(new URL('../src/a-lib.js', import.meta.url), 'utf8');
const src = fs.readFileSync(new URL('../src/c35-push.js', import.meta.url), 'utf8').split('async function pushFn')[0];
let fn; try { fn = new Function('document', 'window', 'localStorage', 'U', lib + '\n' + src + '; return { b64ToBytes, pushNeedsInstall, announceGroups };'); } catch (e) { console.error('load', e.message); process.exit(1); }
const { b64ToBytes, pushNeedsInstall, announceGroups } = fn({ querySelector() {}, querySelectorAll() { return []; }, documentElement: {} }, {}, { getItem() {}, setItem() {} }, {});
let n = 0; const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exit(1); } n++; };
const b = b64ToBytes('AQID_-A'); // url-safe base64 without padding
ok(b.length === 5 && b[0] === 1 && b[1] === 2 && b[2] === 3 && b[3] === 255 && b[4] === 224, 'url-safe base64 without padding decodes: ' + [...b]);
ok(b64ToBytes('').length === 0 && b64ToBytes(null).length === 0, 'empty input is fine');
const key = Buffer.alloc(65, 7).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
ok(b64ToBytes(key).length === 65, 'a 65-byte VAPID key round-trips');
const iph = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)';
ok(pushNeedsInstall(iph, false) === true && pushNeedsInstall(iph, true) === false, 'iPhone needs the home-screen install, installed is fine');
ok(pushNeedsInstall('Mozilla/5.0 (Linux; Android 14) Chrome/120', false) === false && pushNeedsInstall('', false) === false && pushNeedsInstall(undefined, false) === false, 'Android and desktop do not');
const R = (key, status, at, extra = {}) => ({ kind: 'announce', dedupe_key: 'ann:' + key + ':p', status, created_at: at, title: 'Holiday', body: 'Closed', ...extra });
const g = announceGroups([R('1', 'sent', '2026-11-10T10:00:00Z'), R('1', 'sent', '2026-11-10T10:00:00Z'), R('1', 'failed', '2026-11-10T10:00:00Z'), R('1', 'queued', '2026-11-10T10:00:00Z'), R('2', 'skipped', '2026-11-12T10:00:00Z', { title: 'New batch' }), { kind: 'receipt', dedupe_key: 'receipt:x', status: 'sent', created_at: '2026-11-13T00:00:00Z' }]);
ok(g.length === 2 && g[0].title === 'New batch' && g[1].title === 'Holiday', 'one line per announcement, newest first, receipts ignored');
ok(g[1].total === 4 && g[1].sent === 2 && g[1].failed === 1 && g[1].waiting === 1, 'counts delivered, not delivered and waiting: ' + JSON.stringify(g[1]));
ok(announceGroups([]).length === 0, 'empty is fine');
console.log(n + ' checks passed');
