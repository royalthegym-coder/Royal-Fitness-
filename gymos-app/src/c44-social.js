/* ================= Social links and videos: WhatsApp, Instagram, Facebook and YouTube =================
   "Connect" here means: paste a link or a handle, and the app keeps one clean address on the official site.
   Nothing is fetched from those sites and no login or token is stored (that would need an app approved by Meta / Google).
   The gym owner connects the gym's accounts; the super admin connects the platform's own. Everyone signed in can read both.
   Rules mirror supabase/migrations/20261123_social_profiles.sql. The browser sends the clean address, the server checks it again. */
const SOC_KINDS = ['whatsapp', 'instagram', 'facebook', 'youtube'];
const SOC_NAME = { whatsapp: 'WhatsApp', instagram: 'Instagram', facebook: 'Facebook', youtube: 'YouTube' };
/* plain glyphs, not brand logos: the name next to each one says which network it is */
const SOC_ICON = { whatsapp: 'msg', instagram: 'camera', facebook: 'users', youtube: 'play' };
Object.assign(ICONS, {
  share: '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/>',
  play: '<path d="M8 5v14l11-7z"/>',
  camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/><circle cx="12" cy="13" r="3"/>',
});

/* the only shapes that are ever stored (same as the CHECK constraints). An address read from the database is shown as a link only if it still fits. */
const SOC_CANON = {
  whatsapp: /^https:\/\/(wa\.me\/([0-9]{10,15}|message\/[A-Za-z0-9]{10,20})|chat\.whatsapp\.com\/[A-Za-z0-9]{10,40}|whatsapp\.com\/channel\/[A-Za-z0-9]{10,40})$/,
  instagram: /^https:\/\/www\.instagram\.com\/[a-z0-9._]{1,30}\/$/,
  facebook: /^https:\/\/(www\.facebook\.com\/(profile\.php\?id=[0-9]{5,20}|[A-Za-z0-9._%-]{1,100}(\/[A-Za-z0-9._%-]{1,100}){0,2})|fb\.me\/[A-Za-z0-9._-]{1,60})$/,
  youtube: /^https:\/\/www\.youtube\.com\/(@[A-Za-z0-9._-]{3,30}|channel\/UC[A-Za-z0-9_-]{22}|c\/[A-Za-z0-9._%-]{1,60}|user\/[A-Za-z0-9._%-]{1,60})$/,
};
const SOC_CTRL = /[\x01-\x1f\x7f]/g;
const SOC_RES_IG = ['p', 'reel', 'reels', 'stories', 'explore', 'accounts', 'tv', 'direct', 'about', 'legal', 'web', 'developer'];
const SOC_RES_FB = ['share', 'sharer', 'sharer.php', 'dialog', 'login', 'login.php', 'l.php', 'plugins', 'tr', 'permalink.php', 'photo', 'photo.php', 'watch', 'reel', 'reels', 'story.php', 'profile.php', 'events', 'marketplace', 'gaming', 'help', 'policies', 'settings', 'hashtag', 'ads'];
const YT_ID = /^[A-Za-z0-9_-]{11}$/;
const socialHref = (kind, v) => (typeof v === 'string' && SOC_CANON[kind] && SOC_CANON[kind].test(v) ? v : '');
const socialAddScheme = (s) => (!/^https?:\/\//i.test(s) && /^(www\.|m\.)?[a-z0-9-]+\.[a-z]{2,}\//i.test(s) ? 'https://' + s : s);

/* one link, handle or number in -> one clean address out. '' for blank (that clears the field), null when it is not a link of that network. */
function socialNorm(kind, raw) {
  let s = String(raw == null ? '' : raw).replace(SOC_CTRL, '').trim(), m, out;
  if (s === '') return '';
  if (s.length > 300 || !SOC_CANON[kind]) return null;
  s = socialAddScheme(s);
  if (kind === 'whatsapp') {
    if (/^\+?[0-9][0-9 ()-]{8,18}$/.test(s)) { /* a plain phone number */
      const d = s.replace(/\D/g, ''), mob = indMobile(s);
      if (mob) out = 'https://wa.me/91' + mob;
      else if (s[0] === '+' && d.length >= 8 && d.length <= 15) out = 'https://wa.me/' + d;
      else return null;
    } else if ((m = /^https?:\/\/(?:www\.)?wa\.me\/(\+?[0-9]{10,15})\/?(?:[?#].*)?$/i.exec(s)) || (m = /^https?:\/\/(?:api\.|web\.)?whatsapp\.com\/send\/?\?(?:[^#]*&)?phone=(\+?[0-9]{10,15})(?:[&#].*)?$/i.exec(s))) {
      let d = m[1].replace(/\D/g, ''); if (d.length === 10 && /^[6-9]/.test(d)) d = '91' + d;
      out = 'https://wa.me/' + d;
    } else if ((m = /^https?:\/\/(?:www\.)?wa\.me\/message\/([A-Za-z0-9]{10,20})\/?(?:[?#].*)?$/i.exec(s))) out = 'https://wa.me/message/' + m[1];
    else if ((m = /^https?:\/\/chat\.whatsapp\.com\/([A-Za-z0-9]{10,40})\/?(?:[?#].*)?$/i.exec(s))) out = 'https://chat.whatsapp.com/' + m[1];
    else if ((m = /^https?:\/\/(?:www\.)?whatsapp\.com\/channel\/([A-Za-z0-9]{10,40})\/?(?:[?#].*)?$/i.exec(s))) out = 'https://whatsapp.com/channel/' + m[1];
    else return null;
  } else if (kind === 'instagram') {
    m = /^@?([A-Za-z0-9._]{1,30})$/.exec(s) || /^https?:\/\/(?:www\.|m\.)?(?:instagram\.com|instagr\.am)\/([A-Za-z0-9._]{1,30})\/?(?:[?#].*)?$/i.exec(s);
    if (!m || SOC_RES_IG.includes(m[1].toLowerCase()) || /^\.+$/.test(m[1])) return null;
    out = 'https://www.instagram.com/' + m[1].toLowerCase() + '/';
  } else if (kind === 'facebook') {
    if ((m = /^https?:\/\/(?:www\.|m\.|web\.|mbasic\.)?facebook\.com\/profile\.php\?(?:[^#]*&)?id=([0-9]{5,20})(?:[&#].*)?$/i.exec(s))) out = 'https://www.facebook.com/profile.php?id=' + m[1];
    else if ((m = /^https?:\/\/fb\.me\/([A-Za-z0-9._-]{1,60})\/?(?:[?#].*)?$/i.exec(s))) out = 'https://fb.me/' + m[1];
    else {
      m = /^https?:\/\/(?:www\.|m\.|web\.|mbasic\.)?(?:facebook\.com|fb\.com)\/([A-Za-z0-9._%-]{1,100}(?:\/[A-Za-z0-9._%-]{1,100}){0,2})\/?(?:[?#].*)?$/i.exec(s) || /^@?([A-Za-z0-9.]{5,50})$/.exec(s);
      if (!m || SOC_RES_FB.includes(m[1].split('/')[0].toLowerCase()) || /(^|\/)\.+(\/|$)/.test(m[1])) return null;
      out = 'https://www.facebook.com/' + m[1];
    }
  } else {
    if ((m = /^https?:\/\/(?:www\.|m\.)?youtube\.com\/(@[A-Za-z0-9._-]{3,30}|channel\/UC[A-Za-z0-9_-]{22}|c\/[A-Za-z0-9._%-]{1,60}|user\/[A-Za-z0-9._%-]{1,60})(?:\/(?:videos|featured|shorts|streams|playlists|about))?\/?(?:[?#].*)?$/i.exec(s))) out = 'https://www.youtube.com/' + m[1];
    else if ((m = /^@?([A-Za-z0-9._-]{3,30})$/.exec(s))) out = 'https://www.youtube.com/@' + m[1];
    else return null;
  }
  return SOC_CANON[kind].test(out) ? out : null; /* anything the database would refuse is refused here too */
}

/* a YouTube video link (watch, youtu.be, shorts, embed, live) or a bare 11-character id -> the id, or null */
function ytId(v) {
  let s = String(v == null ? '' : v).replace(SOC_CTRL, '').trim();
  if (YT_ID.test(s)) return s;
  if (s.length > 300) return null;
  s = socialAddScheme(s);
  const m = /^https?:\/\/(?:www\.|m\.|music\.)?youtube\.com\/watch\?(?:[^#]*&)?v=([A-Za-z0-9_-]{11})(?:[&#].*)?$/i.exec(s)
    || /^https?:\/\/youtu\.be\/([A-Za-z0-9_-]{11})\/?(?:[?#].*)?$/i.exec(s)
    || /^https?:\/\/(?:www\.|m\.)?youtube(?:-nocookie)?\.com\/(?:shorts|embed|live|v)\/([A-Za-z0-9_-]{11})\/?(?:[?#].*)?$/i.exec(s);
  return m ? m[1] : null;
}
/* the video box: one video per line, "link  optional title". At most 6 different videos. */
function parseVideos(text) {
  const lines = String(text || '').split(/\r?\n/).map((x) => x.trim()).filter(Boolean), list = [];
  if (lines.length > 12) return { err: 'many' };
  for (let i = 0; i < lines.length; i++) {
    const sp = lines[i].search(/\s/), id = ytId(sp < 0 ? lines[i] : lines[i].slice(0, sp));
    if (!id) return { err: 'bad', line: i + 1 };
    if (!list.some((x) => x.id === id)) list.push({ id, title: sp < 0 ? '' : Array.from(lines[i].slice(sp + 1).replace(SOC_CTRL, '').trim()).slice(0, 80).join('') });
  }
  return list.length > 6 ? { err: 'many' } : { list };
}
const vidList = (row) => (row && Array.isArray(row.videos) ? row.videos.filter((v) => v && typeof v.id === 'string' && YT_ID.test(v.id)) : []);
const vidLines = (list) => list.map((v) => 'https://youtu.be/' + v.id + (v.title ? ' ' + v.title : '')).join('\n');

/* a short readable name for a stored address */
function socialText(kind, url) {
  const u = String(url || '');
  if (kind === 'whatsapp') {
    const n = /^https:\/\/wa\.me\/(\d{10,15})$/.exec(u);
    if (n) return n[1].length === 12 && n[1].startsWith('91') ? `+91 ${n[1].slice(2, 7)} ${n[1].slice(7)}` : '+' + n[1];
    if (u.includes('chat.whatsapp.com')) return L('Group invite', 'ग्रुप इनवाइट');
    if (u.includes('/channel/')) return L('Channel', 'चैनल');
    return L('Chat link', 'चैट लिंक');
  }
  if (kind === 'instagram') return '@' + u.split('/')[3];
  if (kind === 'facebook') {
    const id = /profile\.php\?id=(\d+)/.exec(u);
    if (id) return L('Profile ', 'प्रोफ़ाइल ') + id[1];
    try { return decodeURIComponent(u.replace(/^https:\/\/(?:www\.facebook\.com|fb\.me)\//, '')); } catch (e) { return L('Page', 'पेज'); }
  }
  const p = u.replace('https://www.youtube.com/', '');
  return p.startsWith('@') ? p : p.startsWith('channel/') ? L('Channel', 'चैनल') : p.split('/')[1] || p;
}
const SOC_LABEL = (k) => ({ whatsapp: L('WhatsApp number or link', 'WhatsApp नंबर या लिंक'), instagram: L('Instagram profile link or @handle', 'Instagram प्रोफ़ाइल लिंक या @हैंडल'), facebook: L('Facebook page link', 'Facebook पेज का लिंक'), youtube: L('YouTube channel link or @handle', 'YouTube चैनल का लिंक या @हैंडल') }[k]);
const SOC_PH = { whatsapp: '98765 43210', instagram: '@royalthegym', facebook: 'https://www.facebook.com/…', youtube: '@royalthegym' };
const SOC_HINT = (k) => ({
  whatsapp: L('Paste your business mobile number, a wa.me link, or a group invite link.', 'अपना बिज़नेस मोबाइल नंबर, wa.me लिंक या ग्रुप इनवाइट लिंक चिपकाएँ।'),
  instagram: L('Open your profile in Instagram, tap Share profile, then Copy link, and paste it here.', 'Instagram में अपनी प्रोफ़ाइल खोलें, Share profile फिर Copy link दबाएँ और यहाँ चिपकाएँ।'),
  facebook: L('Open your Facebook page, copy the link from the address bar or the Share button, and paste it here.', 'अपना Facebook पेज खोलें, एड्रेस बार या Share बटन से लिंक कॉपी करें और यहाँ चिपकाएँ।'),
  youtube: L('Open your channel, copy its link (it looks like youtube.com/@name) and paste it here.', 'अपना चैनल खोलें, उसका लिंक (youtube.com/@नाम जैसा) कॉपी करें और यहाँ चिपकाएँ।'),
}[k]);
const canEditSocial = (platform) => !!CTX.profile && CTX.profile.role === (platform ? 'super_admin' : 'gym_admin');

/* ---------- small pieces ---------- */
const socialCount = (row) => SOC_KINDS.filter((k) => socialHref(k, row && row[k])).length;
/* one button per connected network; each opens in a new tab */
const socialBtns = (row) => SOC_KINDS.map((k) => { const h = socialHref(k, row && row[k]); return h ? `<a class="btn sm soc-b" href="${esc(h)}" target="_blank" rel="noopener noreferrer" data-soc="${k}">${ic(SOC_ICON[k])} ${esc(k === 'whatsapp' ? L('Chat on WhatsApp', 'WhatsApp पर चैट') : SOC_NAME[k])}</a>` : ''; }).join('');
/* editor view: one row per network with Connect / Change */
function socialRows(row, scope) {
  const off = scope === 'platform' ? '' : CTX.locked ? 'disabled' : '';
  return `<ul class="list soc-list">${SOC_KINDS.map((k) => {
    const h = socialHref(k, row && row[k]);
    const val = h ? `<a href="${esc(h)}" target="_blank" rel="noopener noreferrer">${esc(socialText(k, h))}</a>` : `<span class="muted">${esc(L('Not connected', 'जुड़ा नहीं'))}</span>`;
    return `<li><span class="soc-i">${ic(SOC_ICON[k])}</span><div class="grow"><b>${esc(SOC_NAME[k])}</b><small data-soc-val="${k}">${val}</small></div><button class="btn sm${h ? '' : ' primary'}" data-act="socialConnect" data-kind="${k}" data-scope="${scope}" ${off}>${esc(h ? L('Change', 'बदलें') : L('Connect', 'जोड़ें'))}</button></li>`;
  }).join('')}</ul>`;
}
const connectCard = (title, row, scope) => { const n = socialCount(row); return card(title, 'share', badge(`${n}/4 ${L('connected', 'जुड़े')}`, n === 4 ? 'ok' : n ? 'info' : 'warn'), socialRows(row, scope)); };
const videoGrid = (list) => `<div class="vgrid">${list.map((v, i) => { const t = v.title || L(`Video ${i + 1}`, `वीडियो ${i + 1}`); return `<button type="button" class="vid" data-act="playVideo" data-id="${esc(v.id)}" data-title="${esc(v.title || '')}" aria-label="${esc(L('Play: ', 'चलाएँ: ') + t)}"><span class="vth"><img class="vthimg" src="https://i.ytimg.com/vi/${esc(v.id)}/hqdefault.jpg" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer"><span class="vplay">${ic('play')}</span></span><b>${esc(t)}</b></button>`; }).join('')}</div>`;
function videosCard(title, row, scope, canEdit) {
  const list = vidList(row);
  if (!list.length && !canEdit) return '';
  const off = scope === 'platform' ? '' : CTX.locked ? 'disabled' : '';
  const btn = canEdit ? `<button class="btn sm" data-act="socialVideos" data-scope="${scope}" ${off}>${ic('pencil')} ${esc(list.length ? L('Edit', 'बदलें') : L('Add videos', 'वीडियो जोड़ें'))}</button>` : '';
  return card(title, 'play', btn, list.length ? videoGrid(list) : empty(L('No videos yet', 'अभी कोई वीडियो नहीं'), L('Add up to 6 YouTube videos. Everyone will see them here.', '6 तक YouTube वीडियो जोड़ें। सबको वे यहाँ दिखेंगे।')));
}
/* the gym's front card: logo, name, where and when, and the connected accounts */
async function socialHero(row) {
  const g = CTX.gym || {}; let b = null; try { b = await Q.branding(); } catch (e) { /* the card works without a logo */ }
  const logo = b && imgOk(b.logo, 'logo') ? `<img class="slogo" src="${b.logo}" alt="${esc(L('Gym logo', 'जिम का लोगो'))}">` : `<span class="slogo ph">${ic('building')}</span>`;
  const call = g.phone ? `<a class="btn sm soc-b" href="tel:${esc(String(g.phone).replace(/[^\d+]/g, ''))}">${ic('clock')} ${esc(L('Call', 'कॉल'))}</a>` : '';
  const map = mapsOk(g.maps_url) ? `<a class="btn sm soc-b" href="${esc(g.maps_url)}" target="_blank" rel="noopener noreferrer">${ic('globe')} ${esc(L('Map', 'मैप'))}</a>` : '';
  const btns = call + map + socialBtns(row);
  return `<section class="card shero">${logo}<div class="grow"><h2>${esc(g.name || 'Royal The Gym')}</h2><small class="muted">${esc([g.city, g.timings].filter(Boolean).join(' · ') || '')}</small>${btns ? `<div class="soc-btns" style="margin-top:10px">${btns}</div>` : ''}</div></section>`;
}

/* ---------- the page ---------- */
async function vSocial() {
  const role = CTX.profile.role, sup = role === 'super_admin', adm = role === 'gym_admin';
  const d = (await Q.social()) || {}, gy = d.gym || null, pl = d.platform || null, spacer = '<div style="height:14px"></div>', blocks = [];
  if (!sup) {
    blocks.push(await socialHero(gy));
    if (adm) blocks.push(connectCard(L('Connect your accounts', 'अपने अकाउंट जोड़ें'), gy, 'gym'));
    else if (!socialCount(gy) && !vidList(gy).length) blocks.push(card(L('Follow your gym', 'अपने जिम को फ़ॉलो करें'), 'share', '', empty(L('Nothing here yet', 'अभी कुछ नहीं'), L('Your gym has not added its social links or videos yet.', 'आपके जिम ने अभी सोशल लिंक या वीडियो नहीं जोड़े हैं।'))));
    const v = videosCard(L('Gym videos', 'जिम के वीडियो'), gy, 'gym', adm); if (v) blocks.push(v);
    if (pl && (socialCount(pl) || vidList(pl).length)) {
      if (socialCount(pl)) blocks.push(card(L('From GymOS', 'GymOS की ओर से'), 'globe', '', `<div class="soc-pad"><div class="soc-btns">${socialBtns(pl)}</div></div>`));
      const pv = videosCard(L('GymOS videos', 'GymOS के वीडियो'), pl, 'platform', false); if (pv) blocks.push(pv);
    }
  } else {
    blocks.push(connectCard(L('GymOS accounts', 'GymOS के अकाउंट'), pl, 'platform'));
    blocks.push(videosCard(L('GymOS videos', 'GymOS के वीडियो'), pl, 'platform', true));
  }
  return pageHead(sup ? L('Super admin', 'सुपर एडमिन') : gymName(), sup ? L('Platform profile', 'प्लेटफ़ॉर्म प्रोफ़ाइल') : L('Social & videos', 'सोशल और वीडियो'),
    sup ? L('The GymOS links and videos. Every gym owner, trainer and member can see them.', 'GymOS के लिंक और वीडियो। हर जिम मालिक, ट्रेनर और सदस्य इन्हें देख सकता है।')
      : adm ? L('Connect your gym’s accounts by pasting a link. Trainers and members see them here.', 'लिंक चिपकाकर अपने जिम के अकाउंट जोड़ें। ट्रेनर और सदस्य इन्हें यहाँ देखेंगे।')
        : L('Follow your gym and watch its videos.', 'अपने जिम को फ़ॉलो करें और उसके वीडियो देखें।'))
    + blocks.join(spacer);
}
/* Settings: a short card for the owner */
async function socialSettingsCard() {
  if (!isAdmin()) return '';
  let d = null; try { d = await Q.social(); } catch (e) { return ''; }
  const row = d && d.gym, n = socialCount(row);
  return card(L('Social & videos', 'सोशल और वीडियो'), 'share', `<a class="btn sm" href="#social">${ic('pencil')} ${esc(n ? L('Manage', 'संभालें') : L('Connect', 'जोड़ें'))}</a>`,
    `<div style="margin-bottom:8px">${badge(`${n}/4 ${L('connected', 'जुड़े')}`, n === 4 ? 'ok' : n ? 'info' : 'warn')}</div>`
    + (n ? `<div class="soc-btns">${socialBtns(row)}</div>` : `<div class="muted">${esc(L('Paste your WhatsApp, Instagram, Facebook and YouTube links so members can reach you in one tap.', 'WhatsApp, Instagram, Facebook और YouTube के लिंक चिपकाएँ ताकि सदस्य एक टैप में आप तक पहुँचें।'))}</div>`));
}
/* member profile: "Follow us" buttons and a way to the videos; empty when the gym has added nothing, and never blocks the page */
async function socialMemberRow() {
  try {
    const d = await Q.social(), row = d && d.gym; if (!row) return '';
    const btns = socialBtns(row), vids = vidList(row).length ? `<a class="btn sm soc-b" href="#social">${ic('play')} ${esc(L('Videos', 'वीडियो'))}</a>` : '';
    return btns || vids ? `<div class="soc-btns">${btns}${vids}</div>` : '';
  } catch (e) { return ''; }
}

/* ---------- connect one account ---------- */
async function socialSave(scope, patch, okMsg) {
  const ok = await act(() => DB.rpc(scope === 'platform' ? 'social_set_platform' : 'social_set', { p: patch }), okMsg);
  if (ok) { bust('social'); render(); }
  return !!ok;
}
async function socialConnect(kind, scope) {
  const platform = scope === 'platform';
  if (!SOC_KINDS.includes(kind) || !canEditSocial(platform)) return;
  let d; try { d = await Q.social(); } catch (e) { toast(friendlyError(e), 'bad'); return; }
  const row = (d && (platform ? d.platform : d.gym)) || null, cur = socialHref(kind, row && row[kind]), name = SOC_NAME[kind];
  const m = openForm({
    title: L(`Connect ${name}`, `${name} जोड़ें`),
    values: { link: cur },
    submitLabel: cur ? L('Save', 'सेव करें') : L('Connect', 'जोड़ें'),
    fields: [{ k: 'link', label: SOC_LABEL(kind), full: true, ph: SOC_PH[kind], check: (v) => (v && socialNorm(kind, v) === null ? L(`This does not look like a ${name} link`, `यह ${name} का लिंक नहीं लग रहा`) : '') }],
    extra: `<div class="soc-tools"><button type="button" class="btn sm" id="soc_paste" hidden>${ic('copy')} ${esc(L('Paste', 'पेस्ट'))}</button>${cur ? `<button type="button" class="btn sm danger" id="soc_off">${esc(L('Disconnect', 'हटाएँ'))}</button>` : ''}</div><div class="soc-prev" id="soc_prev" role="status" aria-live="polite"></div><small class="muted">${esc(SOC_HINT(kind))}</small>`,
    onSubmit: async (v) => {
      const n = socialNorm(kind, v.link);
      if (!n && !cur) return true; /* nothing to connect and nothing to remove */
      return socialSave(scope, { [kind]: n || null }, n ? L(`${name} connected`, `${name} जुड़ गया`) : L(`${name} removed`, `${name} हटा दिया`));
    },
  });
  const inp = $('#f_link', m.el), prev = $('#soc_prev', m.el);
  const showPrev = () => {
    const raw = inp.value.trim(), n = raw ? socialNorm(kind, raw) : '';
    prev.innerHTML = !raw ? '' : n ? `<span class="y">${ic('check')} ${esc(L('Will connect:', 'जुड़ेगा:'))}</span> <a href="${esc(n)}" target="_blank" rel="noopener noreferrer">${esc(socialText(kind, n))}</a>` : `<span class="n">${esc(L('Not recognised yet', 'अभी पहचाना नहीं गया'))}</span>`;
  };
  inp.addEventListener('input', showPrev); showPrev();
  const pb = $('#soc_paste', m.el);
  if (navigator.clipboard && typeof navigator.clipboard.readText === 'function') {
    pb.hidden = false;
    pb.addEventListener('click', async () => {
      try { const t = await navigator.clipboard.readText(); if (t && t.trim()) { inp.value = t.trim(); showPrev(); inp.focus(); } } catch (e) { toast(L('Could not read the clipboard. Press and hold the box, then paste.', 'क्लिपबोर्ड नहीं पढ़ सका। बॉक्स को दबाए रखकर पेस्ट करें।'), 'bad'); }
    });
  }
  const off = $('#soc_off', m.el);
  if (off) off.addEventListener('click', async () => { off.disabled = true; const ok = await socialSave(scope, { [kind]: null }, L(`${name} removed`, `${name} हटा दिया`)); if (ok) m.close(); else off.disabled = false; });
}

/* ---------- the video shelf ---------- */
async function socialVideos(scope) {
  const platform = scope === 'platform';
  if (!canEditSocial(platform)) return;
  let d; try { d = await Q.social(); } catch (e) { toast(friendlyError(e), 'bad'); return; }
  const cur = vidList(platform ? d && d.platform : d && d.gym);
  const m = openForm({
    title: L('Videos', 'वीडियो'), wide: true, values: { videos: vidLines(cur) },
    fields: [{
      k: 'videos', type: 'textarea', full: true, label: L('YouTube video links, one per line (up to 6)', 'YouTube वीडियो के लिंक, हर लाइन में एक (अधिकतम 6)'), ph: 'https://youtu.be/…  Warm-up routine',
      check: (v) => { const r = parseVideos(v); return r.err === 'bad' ? L(`Line ${r.line} is not a YouTube video link`, `लाइन ${r.line} YouTube वीडियो का लिंक नहीं है`) : r.err === 'many' ? L('At most 6 videos', 'अधिकतम 6 वीडियो') : ''; },
    }],
    extra: `<div class="soc-prev" id="soc_vcount" role="status" aria-live="polite"></div><small class="muted">${esc(L('Copy a video link from YouTube (Share, then Copy). You can write a title after the link. Leave the box empty to remove all videos.', 'YouTube से वीडियो का लिंक कॉपी करें (Share फिर Copy)। लिंक के बाद शीर्षक लिख सकते हैं। सारे वीडियो हटाने के लिए बॉक्स खाली छोड़ें।'))}</small>`,
    onSubmit: async (v) => { const r = parseVideos(v.videos); if (!r.list) return false; return socialSave(scope, { videos: r.list }, r.list.length ? L('Videos saved', 'वीडियो सेव हुए') : L('Videos removed', 'वीडियो हटा दिए')); },
  });
  const ta = $('#f_videos', m.el), cnt = $('#soc_vcount', m.el);
  const upd = () => { const r = parseVideos(ta.value); cnt.innerHTML = r.list ? `<span class="y">${esc(L(`${r.list.length} of 6 videos`, `6 में से ${r.list.length} वीडियो`))}</span>` : ''; };
  ta.addEventListener('input', upd); upd();
}
/* play one video in a window. youtube-nocookie keeps the player from setting cookies until it is played. A plain link stays under it. */
function playVideo(id, title) {
  if (!YT_ID.test(String(id || ''))) return;
  openModal({
    title: title || L('Video', 'वीडियो'), wide: true,
    body: `<div class="vframe"><iframe src="https://www.youtube-nocookie.com/embed/${esc(id)}?rel=0&amp;modestbranding=1&amp;playsinline=1" title="${esc(title || L('Video', 'वीडियो'))}" loading="lazy" allow="accelerometer; autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin" sandbox="allow-scripts allow-same-origin allow-presentation allow-popups allow-popups-to-escape-sandbox"></iframe></div>`
      + `<p style="margin:12px 0 0"><a href="https://www.youtube.com/watch?v=${esc(id)}" target="_blank" rel="noopener noreferrer">${esc(L('Watch on YouTube', 'YouTube पर देखें'))}</a></p>`,
  });
}
/* a thumbnail that cannot load (offline, blocked) leaves the play button on a plain tile. This is a listener, not an inline handler: the page policy forbids those. */
document.addEventListener('error', (e) => { const t = e.target; if (t && t.tagName === 'IMG' && t.classList.contains('vthimg')) { t.hidden = true; if (t.parentNode) t.parentNode.classList.add('noimg'); } }, true);
