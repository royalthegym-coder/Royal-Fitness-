import fs from 'fs';
const lib = fs.readFileSync(new URL('../src/a-lib.js', import.meta.url), 'utf8');
const src = fs.readFileSync(new URL('../src/c43-profile.js', import.meta.url), 'utf8');
let fn; try { fn = new Function('document', 'window', 'localStorage', 'U', 'UPI_RE', lib + '\n' + src + '; return { mapsOk, imgOk, fitSize, profileMissing, friendlyError, IMG_LIMIT };'); } catch (e) { console.error('load', e.message); process.exit(1); }
const { mapsOk, imgOk, fitSize, profileMissing, friendlyError } = fn({ querySelector() {}, querySelectorAll() { return []; }, documentElement: {} }, {}, { getItem() {}, setItem() {} }, {}, /^[A-Za-z0-9._-]{2,}@[A-Za-z]{2,}$/);
let n = 0; const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exit(1); } n++; };

// Google location: the same hosts the database accepts
['https://maps.app.goo.gl/AbC123', 'https://www.google.com/maps/place/Royal+The+Gym/@28.1,75.4,17z', 'https://google.com/maps?q=28.1,75.4', 'https://maps.google.com/?q=28.1,75.4', 'https://goo.gl/maps/xyz', 'https://g.page/r/abc/review'].forEach((u) => ok(mapsOk(u), 'accepted ' + u));
['', null, undefined, 5, 'http://maps.app.goo.gl/x', 'https://maps.app.goo.gl.evil.com/x', 'https://evil.com/maps', 'https://www.google.com/search?q=x', 'https://www.google.com/maps/place/a b', 'javascript:alert(1)', 'https://maps.app.goo.gl/' + 'a'.repeat(500)].forEach((u) => ok(!mapsOk(u), 'refused ' + String(u).slice(0, 40)));

// images: png / jpeg / webp data URLs inside the size limit; nothing else
const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
ok(imgOk(PNG, 'logo') && imgOk(PNG, 'signature') && imgOk('data:image/webp;base64,UklGRhoAAABXRUJQ', 'logo') && imgOk('data:image/jpeg;base64,/9j/4AAQ', 'signature'), 'png, webp and jpeg data urls are accepted');
ok(!imgOk('data:image/svg+xml;base64,PHN2Zz4=', 'logo') && !imgOk('data:image/gif;base64,R0lGOD', 'logo') && !imgOk('https://x.com/a.png', 'logo') && !imgOk('data:image/png;base64,AAAA<script>', 'logo') && !imgOk(null, 'logo') && !imgOk(5, 'logo') && !imgOk('', 'logo'), 'svg, gif, links, markup, empty and non-text are refused');
ok(imgOk('data:image/png;base64,' + 'A'.repeat(200000 - 22), 'logo') && !imgOk('data:image/png;base64,' + 'A'.repeat(200000 - 21), 'logo'), 'logo limit is 200000 characters');
ok(imgOk('data:image/png;base64,' + 'A'.repeat(150000 - 22), 'signature') && !imgOk('data:image/png;base64,' + 'A'.repeat(150000 - 21), 'signature'), 'signature limit is 150000 characters');
ok(!imgOk(PNG, 'other') && !imgOk(PNG), 'an unknown kind is refused');

// shrinking a photo: keeps the shape, never enlarges
let f = fitSize(2000, 1000, 400, 400); ok(f.w === 400 && f.h === 200, '2:1 photo fits a 400 box: ' + JSON.stringify(f));
f = fitSize(1000, 2000, 400, 400); ok(f.w === 200 && f.h === 400, 'tall photo');
f = fitSize(100, 50, 400, 400); ok(f.w === 100 && f.h === 50, 'a small photo is not enlarged');
f = fitSize(3000, 400, 600, 220); ok(f.w === 600 && f.h === 80, 'wide signature photo');
f = fitSize(1, 5000, 400, 400); ok(f.w === 1 && f.h === 400, 'a sliver never reaches 0 pixels');

// completion checklist
const g = { owner_name: 'Mahesh', phone: '9785300123', upi_id: 'a@b', maps_url: 'https://maps.app.goo.gl/x' };
ok(profileMissing({}, null).join() === 'owner,email,phone,upi,maps,logo,signature', 'nothing filled: seven items missing');
ok(profileMissing(g, { email: 'a@b.co', logo: PNG, signature: PNG }).length === 0, 'everything filled: nothing missing');
ok(profileMissing(g, { email: 'a@b.co', logo: PNG }).join() === 'signature', 'only the signature missing');
ok(profileMissing({ ...g, maps_url: 'http://bad' }, { email: 'a@b.co', logo: PNG, signature: PNG }).join() === 'maps', 'a bad map link counts as missing');
ok(profileMissing(g, { email: 'a@b.co', logo: 'data:image/svg+xml;base64,AAAA', signature: PNG }).join() === 'logo', 'a bad image counts as missing');
ok(profileMissing(undefined, undefined).length === 7, 'missing arguments do not throw');

// every server message has plain words (both languages come from L, which picks one)
['bad owner name', 'bad email', 'bad phone', 'bad upi', 'bad map link', 'image too large', 'bad image'].forEach((m) => { const t = friendlyError(Object.assign(new Error(m), { status: 400, code: '23514' })); ok(t && !/out of the allowed range|Something went wrong/.test(t), 'friendly text for: ' + m + ' -> ' + t); });
ok(/too large|बहुत बड़ी/.test(friendlyError(new Error('image too large'))) && /PNG/.test(friendlyError(new Error('bad image'))), 'too-large and bad-image are different messages');
console.log(n + ' checks passed');
