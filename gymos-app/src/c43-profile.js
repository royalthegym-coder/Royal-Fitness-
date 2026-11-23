/* ================= Gym registration profile: owner name, email, mobile, UPI, Google location, logo and signature =================
   Saved in the database through gym_set_profile (owner only). Images are shrunk and re-encoded in the browser first (this also strips
   photo metadata), stored as small data URLs, and used on fee receipts. The server checks every value again. */
const MAPS_RE = /^https:\/\/(www\.google\.com\/maps|google\.com\/maps|maps\.google\.com|maps\.app\.goo\.gl|goo\.gl\/maps|g\.page)([/?]\S*)?$/;
const mapsOk = (u) => typeof u === 'string' && u.length <= 500 && MAPS_RE.test(u);
const IMG_RE = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/;
const IMG_LIMIT = { logo: 200000, signature: 150000 };
const IMG_BOX = { logo: [400, 400], signature: [600, 220] };
const imgOk = (s, kind) => typeof s === 'string' && s.length <= (IMG_LIMIT[kind] || 0) && IMG_RE.test(s);
/* largest size inside the box with the same shape; never enlarges */
const fitSize = (w, h, bw, bh) => { const s = Math.min(1, bw / w, bh / h); return { w: Math.max(1, Math.round(w * s)), h: Math.max(1, Math.round(h * s)) }; };
const PROFILE_PARTS = ['owner', 'email', 'phone', 'upi', 'maps', 'logo', 'signature'];
/* which of the seven registration items are still empty */
function profileMissing(g, p) {
  g = g || {}; p = p || {};
  const has = { owner: !!g.owner_name, email: !!p.email, phone: !!g.phone, upi: !!g.upi_id, maps: mapsOk(g.maps_url), logo: imgOk(p.logo, 'logo'), signature: imgOk(p.signature, 'signature') };
  return PROFILE_PARTS.filter((k) => !has[k]);
}
const profileErr = (en, hi) => Object.assign(new Error(en), { friendly: L(en, hi) });

function loadImg(src) {
  return new Promise((resolve) => { const i = new Image(); i.onload = () => resolve(i); i.onerror = () => resolve(null); i.src = src; });
}
/* a chosen photo → a small png / webp data URL that fits the server limit, or an error the owner can read */
async function fileToData(file, kind) {
  if (!file || !/^image\/(png|jpe?g|webp)$/i.test(file.type || '')) throw profileErr('Choose a PNG, JPG or WebP image.', 'PNG, JPG या WebP फ़ोटो चुनें।');
  if (file.size > 8e6) throw profileErr('That photo is over 8 MB. Choose a smaller one.', 'यह फ़ोटो 8 MB से बड़ी है। छोटी फ़ोटो चुनें।');
  const url = URL.createObjectURL(file);
  let img; try { img = await loadImg(url); } finally { URL.revokeObjectURL(url); }
  if (!img || !img.naturalWidth) throw profileErr('This image could not be read.', 'यह फ़ोटो पढ़ी नहीं जा सकी।');
  const [bw, bh] = IMG_BOX[kind];
  for (let k = 0, f = 1; k < 5; k++, f *= 0.75) {
    const d = fitSize(img.naturalWidth, img.naturalHeight, bw * f, bh * f), c = document.createElement('canvas'); c.width = d.w; c.height = d.h;
    c.getContext('2d').drawImage(img, 0, 0, d.w, d.h);
    let out = c.toDataURL('image/webp', 0.9);
    if (!out.startsWith('data:image/webp')) out = c.toDataURL('image/png'); /* a browser without webp writing */
    if (imgOk(out, kind)) return out;
  }
  throw profileErr('This image is too detailed. Choose a simpler or smaller one.', 'यह फ़ोटो बहुत भारी है। सरल या छोटी फ़ोटो चुनें।');
}

/* ---------- Settings card ---------- */
function profileCard(g, p) {
  const miss = profileMissing(g, p), done = PROFILE_PARTS.length - miss.length, ok = miss.length === 0;
  const row = (label, val) => `<li><div class="grow"><small>${esc(label)}</small><b>${val}</b></div></li>`;
  const thumb = (src, kind, alt) => (imgOk(src, kind) ? `<img class="pthumb" src="${src}" alt="${esc(alt)}">` : '—');
  const map = mapsOk(g.maps_url) ? `<a href="${esc(g.maps_url)}" target="_blank" rel="noopener noreferrer">${esc(L('Open in Google Maps', 'गूगल मैप्स में खोलें'))}</a>` : '—';
  return card(L('Registration profile', 'रजिस्ट्रेशन प्रोफ़ाइल'), 'shield', `<button class="btn sm" data-act="gymProfile" ${CTX.locked ? 'disabled' : ''}>${ic('pencil')} ${esc(ok ? L('Edit', 'बदलें') : L('Complete', 'पूरा करें'))}</button>`,
    `<div style="margin-bottom:8px">${badge(`${done}/${PROFILE_PARTS.length} ${L('done', 'पूरा')}`, ok ? 'ok' : 'warn')}</div>`
    + `<ul class="list">${row(L('Owner', 'मालिक'), esc(g.owner_name || '—'))}${row(L('Email', 'ईमेल'), esc((p && p.email) || '—'))}${row(L('Mobile', 'मोबाइल'), esc(g.phone || '—'))}${row('UPI', esc(g.upi_id || '—'))}${row(L('Google location', 'गूगल लोकेशन'), map)}${row(L('Logo', 'लोगो'), thumb(p && p.logo, 'logo', L('Gym logo', 'जिम का लोगो')))}${row(L('Digital signature', 'डिजिटल हस्ताक्षर'), thumb(p && p.signature, 'signature', L('Owner signature', 'मालिक के हस्ताक्षर')))}</ul>`
    + `<div class="muted" style="margin-top:8px">${esc(L('The logo and signature are printed on every fee receipt.', 'लोगो और हस्ताक्षर हर फ़ीस रसीद पर छपते हैं।'))}</div>`);
}
async function profileCardHtml() {
  if (!isAdmin()) return '';
  let p = null; try { p = await Q.gymProfile(); } catch (e) { /* the card still opens the form */ }
  return profileCard(CTX.gym || {}, p);
}

/* ---------- the form ---------- */
const imgBlock = (kind, title, hint) => `<div class="fl full imgup"><span>${esc(title)}</span><div class="imgrow"><div class="imgbox ${kind}"><img id="pv_${kind}" alt="" hidden><em id="ph_${kind}">${esc(L('Nothing uploaded', 'कुछ अपलोड नहीं हुआ'))}</em></div>`
  + `<div class="imgbtns"><label class="btn sm" id="pick_${kind}">${ic('plus')} ${esc(L('Choose photo', 'फ़ोटो चुनें'))}<input type="file" id="fi_${kind}" accept="image/png,image/jpeg,image/webp" hidden></label> <button type="button" class="btn sm" id="rm_${kind}">${esc(L('Remove', 'हटाएँ'))}</button><small class="muted">${esc(hint)}</small></div></div><small class="err" id="e_${kind}"></small></div>`;

async function profileForm() {
  if (!isAdmin()) return;
  const g = CTX.gym || {}, cur = await act(() => DB.rpc('gym_get_profile')); if (!cur) return;
  const S = { logo: imgOk(cur.logo, 'logo') ? cur.logo : null, signature: imgOk(cur.signature, 'signature') ? cur.signature : null }, dirty = {};
  const m = openForm({
    title: L('Gym registration', 'जिम रजिस्ट्रेशन'), wide: true,
    values: { owner: g.owner_name || '', email: cur.email || (CTX.profile && CTX.profile.email) || '', phone: g.phone || '', upi: g.upi_id || '', maps: g.maps_url || '' },
    fields: [
      { k: 'owner', label: L('Owner name', 'मालिक का नाम'), req: true, check: (v) => (v.length < 2 || v.length > 80 ? L('2 to 80 characters', '2 से 80 अक्षर') : '') },
      { k: 'email', label: L('Owner email', 'मालिक का ईमेल'), type: 'email', req: true },
      { k: 'phone', label: L('Mobile number', 'मोबाइल नंबर'), type: 'tel', req: true },
      { k: 'upi', label: L('UPI ID', 'UPI आईडी'), ph: 'name@bank', check: (v) => (v && !UPI_RE.test(v) ? L('Example: name@bank', 'उदाहरण: name@bank') : '') },
      { k: 'maps', label: L('Google location (map link)', 'गूगल लोकेशन (मैप लिंक)'), full: true, ph: 'https://maps.app.goo.gl/…', check: (v) => (v && !mapsOk(v) ? L('Paste the Google Maps share link (maps.app.goo.gl or google.com/maps), starting with https://', 'गूगल मैप्स का शेयर लिंक (maps.app.goo.gl या google.com/maps) चिपकाएँ, https:// से शुरू') : '') },
    ],
    extra: `<div class="fg" style="margin-top:12px">${imgBlock('logo', L('Gym logo', 'जिम का लोगो'), L('Square works best. It is shrunk to fit.', 'चौकोर सबसे अच्छा रहता है। अपने-आप छोटा हो जाएगा।'))}${imgBlock('signature', L('Owner digital signature', 'मालिक के डिजिटल हस्ताक्षर'), L('Sign on white paper and photograph it, or upload a PNG with a clear background.', 'सफ़ेद काग़ज़ पर हस्ताक्षर करके फ़ोटो लें, या साफ़ बैकग्राउंड वाली PNG डालें।'))}</div>`,
    onSubmit: async (v) => {
      const p = { owner: v.owner, email: v.email, phone: v.phone, upi: v.upi || null, maps_url: v.maps || null };
      Object.keys(dirty).forEach((k) => { p[k] = S[k]; }); /* only the photos that changed are sent; null removes one */
      const ok = await act(() => DB.rpc('gym_set_profile', { p }), L('Profile saved', 'प्रोफ़ाइल सेव हुई'));
      if (ok) { bust('gymProfile', 'branding'); await loadContext(); render(); }
      return !!ok;
    },
  });
  const paint = (kind) => {
    const im = $('#pv_' + kind, m.el), ph = $('#ph_' + kind, m.el), src = S[kind];
    if (src) { im.src = src; im.hidden = false; ph.hidden = true; } else { im.removeAttribute('src'); im.hidden = true; ph.hidden = false; }
    $('#rm_' + kind, m.el).hidden = !src;
  };
  ['logo', 'signature'].forEach((kind) => {
    paint(kind);
    $('#fi_' + kind, m.el).addEventListener('change', async (e) => {
      const f = e.target.files && e.target.files[0], er = $('#e_' + kind, m.el); e.target.value = ''; er.textContent = '';
      if (!f) return;
      try { S[kind] = await fileToData(f, kind); dirty[kind] = true; paint(kind); } catch (x) { er.textContent = x.friendly || friendlyError(x); }
    });
    $('#rm_' + kind, m.el).addEventListener('click', () => { S[kind] = null; dirty[kind] = true; $('#e_' + kind, m.el).textContent = ''; paint(kind); });
  });
}
