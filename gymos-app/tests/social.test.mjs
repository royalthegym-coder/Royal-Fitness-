import fs from 'fs';
import { NORM, VID } from './social.cases.mjs';
const rd = (f) => fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
const sql = rd('supabase/migrations/20261123_social_profiles.sql');
const code = ['src/a-lib.js', 'src/b-ui.js', 'src/c1-data.js', 'src/c3-gym.js', 'src/c43-profile.js', 'src/c44-social.js'].map(rd).join('\n');
const listeners = [];
const doc = { querySelector() { return null; }, querySelectorAll() { return []; }, documentElement: {}, addEventListener(t, f, c) { listeners.push([t, f, c]); } };
let fn;
try {
  fn = new Function('document', 'window', 'localStorage', 'UPI_RE', code + '\n; return { socialNorm, socialHref, ytId, parseVideos, vidList, vidLines, socialText, socialBtns, socialRows, videoGrid, videosCard, connectCard, socialCount, vSocial, socialSettingsCard, socialMemberRow, canEditSocial, playVideo, SOC_CANON, SOC_KINDS, friendlyError, CTX, Q, setLang: (v) => { LANG = v; } };');
} catch (e) { console.error('load', e.message); process.exit(1); }
const S = fn(doc, {}, { getItem() {}, setItem() {} }, /^[A-Za-z0-9._-]{2,}@[A-Za-z]{2,}$/);
const { socialNorm, socialHref, ytId, parseVideos, vidList, vidLines, socialText, socialBtns, socialRows, videoGrid, videosCard, socialCount, vSocial, socialSettingsCard, socialMemberRow, canEditSocial, SOC_CANON, SOC_KINDS, friendlyError, CTX, Q } = S;
S.setLang('en');
let n = 0; const ok = (c, m) => { if (!c) { console.error('FAIL', m); process.exit(1); } n++; };

// 1. the shared case table: what people paste -> the one clean address (the database gives the same answers)
NORM.forEach(([k, v, want]) => { const g = socialNorm(k, v); ok(g === want, `${k} ${JSON.stringify(v)} -> ${JSON.stringify(g)}, wanted ${JSON.stringify(want)}`); });
VID.forEach(([v, want]) => ok(ytId(v) === want, `video ${JSON.stringify(v)} -> ${ytId(v)}, wanted ${want}`));
// running a clean address through again changes nothing
NORM.filter((r) => r[2]).forEach(([k, , want]) => ok(socialNorm(k, want) === want, `${k} is stable: ${want}`));
ok(socialNorm('myspace', 'x') === null && socialNorm('whatsapp', null) === '' && socialNorm('whatsapp', undefined) === '' && socialNorm('whatsapp', 5) === null, 'unknown network, null, undefined and a number are handled');
// whatever comes out is a shape the database accepts, for any input
const junk = ['<script>alert(1)</script>', '"><img src=x onerror=alert(1)>', 'https://www.instagram.com/"onmouseover="x', "https://wa.me/919785300123'", 'https://wa.me/919785300123‮', 'a'.repeat(5000), '../../etc/passwd', 'https://www.facebook.com/a%00b', 'https://www.youtube.com/@a<b>c', '\u0000\u0001', 'https://user:pw@wa.me/919785300123'];
SOC_KINDS.forEach((k) => junk.forEach((j) => { const g = socialNorm(k, j); ok(g === null || g === '' || SOC_CANON[k].test(g), `${k}: ${JSON.stringify(j).slice(0, 30)} gives nothing unsafe`); }));

// 2. the shapes are exactly the ones in the database CHECK constraints
const chk = {}; for (const k of SOC_KINDS) { const m = new RegExp(`social_${k}_chk check \\(${k} is null or ${k} ~ '([^']+)'\\)`).exec(sql); chk[k] = m && m[1]; ok(!!m, `found the ${k} CHECK in the migration`); }
SOC_KINDS.forEach((k) => ok(SOC_CANON[k].source.replace(/\\\//g, '/') === chk[k], `${k}: browser pattern equals the database CHECK`));
ok(/\[A-Za-z0-9_-\]\{11\}/.test(sql) && /char_length\(e ->> 'title'\) > 80/.test(sql) && /jsonb_array_length\(v\) <= 6/.test(sql), 'database video rules: 11-char id, title 80, at most 6');

// 3. only a stored address that still fits is ever used as a link
ok(socialHref('instagram', 'https://www.instagram.com/royalthegym/') !== '' && socialHref('instagram', 'https://www.instagram.com/Royal/') === '', 'a stored address must match exactly (lowercase handle)');
['javascript:alert(1)', 'data:text/html,x', 'http://wa.me/919785300123', 'https://wa.me/919785300123" onclick="x', ' https://wa.me/919785300123', 'https://evil.com/'].forEach((v) => ok(socialHref('whatsapp', v) === '', `not a link: ${v.slice(0, 30)}`));
ok(socialHref('whatsapp', 5) === '' && socialHref('nope', 'https://wa.me/919785300123') === '' && socialHref('whatsapp', null) === '', 'non-strings and unknown networks give no link');
const ROW = { whatsapp: 'https://wa.me/919785300123', instagram: 'https://www.instagram.com/royalthegym/', facebook: 'javascript:alert(1)', youtube: 'https://www.youtube.com/@royalthegym', videos: [{ id: 'dQw4w9WgXcQ', title: '<b>Warm up</b>' }, { id: 'bad id', title: 'x' }, null, { id: 5 }] };
ok(socialCount(ROW) === 3 && socialCount(null) === 0 && socialCount({}) === 0, 'count ignores an address that does not fit');
let html = socialBtns(ROW);
ok((html.match(/<a /g) || []).length === 3 && !/javascript:/.test(html) && /target="_blank" rel="noopener noreferrer"/.test(html) && /href="https:\/\/wa\.me\/919785300123"/.test(html), 'buttons: three links, a bad one dropped, all open in a new safe tab');
ok(socialBtns(null) === '' && socialBtns({}) === '', 'no buttons when nothing is connected');

// 4. names shown for stored addresses
ok(socialText('whatsapp', 'https://wa.me/919785300123') === '+91 97853 00123' && socialText('whatsapp', 'https://wa.me/14155552671') === '+14155552671', 'whatsapp number shown readably');
ok(socialText('whatsapp', 'https://chat.whatsapp.com/ABCdef1234567890') === 'Group invite' && socialText('whatsapp', 'https://whatsapp.com/channel/0029VaABCDEFGH') === 'Channel' && socialText('whatsapp', 'https://wa.me/message/ABCDEFGHIJK1') === 'Chat link', 'whatsapp group, channel and chat link');
ok(socialText('instagram', 'https://www.instagram.com/royalthegym/') === '@royalthegym', 'instagram handle');
ok(socialText('facebook', 'https://www.facebook.com/royal.the.gym') === 'royal.the.gym' && socialText('facebook', 'https://www.facebook.com/profile.php?id=100012345678') === 'Profile 100012345678' && socialText('facebook', 'https://fb.me/abc%E0%A4') === 'Page', 'facebook name, profile id, and an undecodable name');
ok(socialText('youtube', 'https://www.youtube.com/@royalthegym') === '@royalthegym' && socialText('youtube', 'https://www.youtube.com/channel/UCabcdefghijklmnopqrstuv') === 'Channel' && socialText('youtube', 'https://www.youtube.com/c/RoyalTheGym') === 'RoyalTheGym', 'youtube handle, channel and /c/ name');

// 5. the video box
let r = parseVideos('https://youtu.be/dQw4w9WgXcQ  Warm-up routine\nhttps://www.youtube.com/watch?v=abcdefghijk');
ok(r.list && r.list.length === 2 && r.list[0].title === 'Warm-up routine' && r.list[1].title === '' && r.list[1].id === 'abcdefghijk', 'two lines: a title after the link is kept');
ok(parseVideos('').list.length === 0 && parseVideos(null).list.length === 0 && parseVideos('  \n \n').list.length === 0, 'an empty box means no videos');
r = parseVideos('dQw4w9WgXcQ\nhttps://youtu.be/dQw4w9WgXcQ?t=4\nyoutu.be/dQw4w9WgXcQ'); ok(r.list.length === 1, 'the same video three ways is kept once');
r = parseVideos('dQw4w9WgXcQ\nnot a link'); ok(r.err === 'bad' && r.line === 2, 'a bad line is named by number');
r = parseVideos('\n\ndQw4w9WgXcQ\nhttps://evil.com/x'); ok(r.err === 'bad' && r.line === 2, 'line numbers count only filled lines');
const ids = ['aaaaaaaaaaa', 'bbbbbbbbbbb', 'ccccccccccc', 'ddddddddddd', 'eeeeeeeeeee', 'fffffffffff', 'ggggggggggg'];
ok(parseVideos(ids.slice(0, 6).join('\n')).list.length === 6, 'six videos are fine');
ok(parseVideos(ids.join('\n')).err === 'many', 'seven videos are too many');
ok(parseVideos(Array(13).fill('aaaaaaaaaaa').join('\n')).err === 'many', 'more than 12 lines is refused even if they repeat');
ok(parseVideos(Array(12).fill('aaaaaaaaaaa').join('\n')).list.length === 1, '12 repeated lines collapse to one video');
r = parseVideos('dQw4w9WgXcQ ' + 'अ'.repeat(100)); ok(Array.from(r.list[0].title).length === 80, 'a long title is cut at 80 characters');
r = parseVideos('dQw4w9WgXcQ ' + '😀'.repeat(100)); ok(Array.from(r.list[0].title).length === 80 && !/\ud83d$/.test(r.list[0].title), 'a title is cut by characters, never in the middle of an emoji');
r = parseVideos('dQw4w9WgXcQ  Leg\tday\u0001'); ok(r.list[0].title === 'Legday', 'control characters (tabs included) are removed from a title, as the database does');
ok(vidList(ROW).length === 1 && vidList(null).length === 0 && vidList({ videos: 'x' }).length === 0, 'stored videos: only well-formed ones are used');
ok(vidLines([{ id: 'dQw4w9WgXcQ', title: 'Warm up' }, { id: 'abcdefghijk', title: '' }]) === 'https://youtu.be/dQw4w9WgXcQ Warm up\nhttps://youtu.be/abcdefghijk', 'the edit box shows one video per line');
const again = parseVideos(vidLines([{ id: 'dQw4w9WgXcQ', title: 'Warm up' }])); ok(again.list[0].title === 'Warm up' && again.list[0].id === 'dQw4w9WgXcQ', 'editing and saving untouched keeps the video and title');

// 6. what the pages show (English and Hindi), with markup from the database made harmless
html = videoGrid(vidList(ROW));
ok(/data-act="playVideo" data-id="dQw4w9WgXcQ"/.test(html) && /i\.ytimg\.com\/vi\/dQw4w9WgXcQ\/hqdefault\.jpg/.test(html) && !/<b>Warm/.test(html) && /&lt;b&gt;Warm up&lt;\/b&gt;/.test(html), 'video tile: id, thumbnail and an escaped title');
ok(!/onerror|onclick|onload/i.test(html), 'no inline handlers in the video tiles (the page policy forbids them)');
CTX.profile = { role: 'gym_admin' }; CTX.locked = false; CTX.gym = { name: 'Royal <i>The</i> Gym', city: 'Jhunjhunu', timings: '5am-10pm', phone: '9785300123', maps_url: 'https://maps.app.goo.gl/AbC123' };
ok(canEditSocial(false) && !canEditSocial(true), 'a gym admin edits the gym profile, not the platform one');
CTX.profile = { role: 'super_admin' }; ok(!canEditSocial(false) && canEditSocial(true), 'the super admin edits the platform profile only');
CTX.profile = { role: 'member' }; ok(!canEditSocial(false) && !canEditSocial(true), 'a member edits nothing');
CTX.profile = null; ok(!canEditSocial(false) && !canEditSocial(true), 'nobody signed in edits nothing');
html = socialRows(ROW, 'gym'); ok((html.match(/data-act="socialConnect"/g) || []).length === 4 && (html.match(/>Change</g) || []).length === 3 && (html.match(/>Connect</g) || []).length === 1 && /data-kind="facebook"[^>]*data-scope="gym"/.test(html), 'rows: Change on the three connected, Connect on the one that is not');
CTX.locked = true; ok(/disabled/.test(socialRows(ROW, 'gym')) && !/disabled/.test(socialRows(ROW, 'platform')), 'a locked gym cannot change its links; the platform rows are not tied to a gym');
ok(/disabled/.test(videosCard('V', ROW, 'gym', true)) && !/data-act="socialVideos"/.test(videosCard('V', ROW, 'gym', false)), 'locked: the video button is disabled; viewers get no edit button');
CTX.locked = false;
ok(videosCard('V', { videos: [] }, 'gym', false) === '' && /No videos yet/.test(videosCard('V', { videos: [] }, 'gym', true)), 'nothing to show a viewer; an invitation for the owner');

const data = { gym: ROW, platform: { whatsapp: null, instagram: 'https://www.instagram.com/gymos/', facebook: null, youtube: null, videos: [{ id: 'abcdefghijk', title: 'Welcome to GymOS' }] } };
let feed = data; Q.social = async () => feed; Q.branding = async () => ({ logo: 'data:image/png;base64,iVBORw0KGgo=', signature: null });
const page = async (role, d) => { CTX.profile = { role }; feed = d; return vSocial(); };
html = await page('gym_admin', data);
ok(/Royal &lt;i&gt;The&lt;\/i&gt; Gym/.test(html) && !/<i>The<\/i>/.test(html), 'the gym name is escaped');
ok(/class="slogo" src="data:image\/png/.test(html) && /href="tel:9785300123"/.test(html) && /maps\.app\.goo\.gl\/AbC123/.test(html), 'gym card: logo, call and map buttons');
ok(/data-act="socialConnect"/.test(html) && /data-act="socialVideos"/.test(html) && /From GymOS/.test(html) && /Welcome to GymOS/.test(html) && /instagram\.com\/gymos/.test(html), 'owner sees the connect rows, the video editor and the platform links and videos');
ok((html.match(/data-act="socialVideos"/g) || []).length === 1, 'the owner can edit the gym videos but not the platform ones');
html = await page('member', data);
ok(!/data-act="socialConnect"/.test(html) && !/data-act="socialVideos"/.test(html) && /data-soc="whatsapp"/.test(html) && /data-act="playVideo"/.test(html), 'a member sees follow buttons and videos, nothing to edit');
html = await page('trainer', data); ok(!/data-act="socialConnect"/.test(html) && /data-soc="instagram"/.test(html), 'a trainer reads it too');
html = await page('member', { gym: null, platform: null }); ok(/Nothing here yet/.test(html) && !/From GymOS/.test(html), 'a member of a gym that added nothing sees a polite empty card');
html = await page('member', null); ok(/Nothing here yet/.test(html), 'a reply with nothing at all does not break the page');
html = await page('member', { gym: { whatsapp: null, instagram: null, facebook: null, youtube: null, videos: [] }, platform: data.platform }); ok(/Nothing here yet/.test(html) && /From GymOS/.test(html), 'platform links still show when the gym has none');
html = await page('super_admin', data);
ok(/GymOS accounts/.test(html) && /data-scope="platform"/.test(html) && !/slogo/.test(html) && !/data-scope="gym"/.test(html), 'super admin edits the platform profile only, with no gym card');
html = await page('super_admin', { gym: null, platform: null }); ok((html.match(/data-act="socialConnect"/g) || []).length === 4, 'super admin can connect all four when nothing exists yet');
CTX.profile = { role: 'gym_admin' }; feed = data;
html = await socialSettingsCard(); ok(/#social/.test(html) && /3\/4/.test(html) && /data-soc="whatsapp"/.test(html), 'settings card: link to the page, 3 of 4, buttons');
feed = { gym: null, platform: null }; html = await socialSettingsCard(); ok(/0\/4/.test(html) && /Paste your WhatsApp/.test(html), 'settings card: invitation when nothing is connected');
Q.social = async () => { throw new Error('boom'); }; ok((await socialSettingsCard()) === '' && (await socialMemberRow()) === '', 'a failed read never breaks Settings or the member profile');
Q.social = async () => data; CTX.profile = { role: 'member' };
html = await socialMemberRow(); ok(/data-soc="whatsapp"/.test(html) && /href="#social"/.test(html) && /Videos/.test(html), 'member profile row: follow buttons and a Videos link');
Q.social = async () => ({ gym: { whatsapp: null, instagram: null, facebook: null, youtube: null, videos: [] } }); ok((await socialMemberRow()) === '', 'no row at all when the gym has nothing');
CTX.profile = { role: 'trainer' }; ok((await socialSettingsCard()) === '', 'only the owner gets the Settings card');
S.setLang('hi'); Q.social = async () => data; CTX.profile = { role: 'gym_admin' };
html = await vSocial(); ok(/अपने अकाउंट जोड़ें/.test(html) && /बदलें/.test(html) && /जोड़ें/.test(html), 'the owner page reads in Hindi'); S.setLang('en');

// 7. messages the owner can read for every error the database can return
const E = (m) => friendlyError(Object.assign(new Error(m), { status: 400, code: 'P0001' }));
['bad whatsapp link', 'bad instagram link', 'bad facebook link', 'bad youtube link', 'bad video link', 'too many videos'].forEach((m) => ok(E(m) && !/P0001|bad .* link$|^too many videos$/.test(E(m)), `plain words for: ${m}`));
ok(E('bad whatsapp link') !== E('bad instagram link') && /6/.test(E('too many videos')), 'each network has its own message; the video limit names the number');
ok(/YouTube video/.test(E('bad video link')) && /WhatsApp/.test(E('bad whatsapp link')), 'messages name the network');

// 8. the page code never writes an event handler into the page and the CSP allows exactly what the player needs
const src = rd('src/c44-social.js');
ok(!/\son(click|error|load)\s*=/.test(src.replace(/addEventListener/g, '')), 'no inline handler attributes in the social code');
ok(/youtube-nocookie\.com\/embed\//.test(src) && /sandbox="/.test(src) && /referrerpolicy="strict-origin-when-cross-origin"/.test(src), 'the player is youtube-nocookie, sandboxed, with a referrer the player accepts');
const yml = rd('render.yaml');
ok(/img-src 'self' data: blob: https:\/\/i\.ytimg\.com;/.test(yml) && /frame-src https:\/\/www\.youtube-nocookie\.com;/.test(yml) && /script-src 'self';/.test(yml) && /frame-ancestors 'none'/.test(yml), 'CSP: thumbnails from i.ytimg.com and the player from youtube-nocookie only, scripts still only from the app');
ok(listeners.some((l) => l[0] === 'error' && l[2] === true), 'a broken thumbnail is handled by a capture-phase listener');
const errL = listeners.find((l) => l[0] === 'error'); const cls = new Set(); const parent = { classList: { add: (c) => cls.add(c) } };
const im = { tagName: 'IMG', hidden: false, classList: { contains: (c) => c === 'vthimg' }, parentNode: parent }; errL[1]({ target: im }); ok(im.hidden && cls.has('noimg'), 'a thumbnail that fails is hidden and its tile is marked');
const other = { tagName: 'IMG', hidden: false, classList: { contains: () => false }, parentNode: parent }; errL[1]({ target: other }); ok(!other.hidden, 'other images are left alone');
console.log(n + ' checks passed');
