/* ================= Extras: member photos, WhatsApp expiry reminders, offers ================= */

/* ---------- Photos (private Supabase Storage bucket; staff of the gym + the member themself can read) ---------- */
const PHOTO_CACHE = new Map();
const storagePath = (p) => p.split('/').map(encodeURIComponent).join('/');
async function storageAuth() {
  if (SESSION && SESSION.expires_at && SESSION.expires_at - 30 < Date.now() / 1000) await refreshSession();
  return { apikey: CFG.key, Authorization: 'Bearer ' + ((SESSION && SESSION.access_token) || CFG.key) };
}
function photoUrl(path) {
  if (!path) return Promise.resolve(null);
  if (PHOTO_CACHE.has(path)) return PHOTO_CACHE.get(path);
  const p = (async () => {
    const res = await rawFetch('/storage/v1/object/authenticated/member-photos/' + storagePath(path), { headers: await storageAuth() });
    if (!res.ok) throw new Error('photo');
    return URL.createObjectURL(await res.blob());
  })();
  PHOTO_CACHE.set(path, p); p.catch(() => PHOTO_CACHE.delete(path));
  return p;
}
async function uploadPhoto(path, blob) {
  const res = await rawFetch('/storage/v1/object/member-photos/' + storagePath(path), { method: 'POST', headers: { ...(await storageAuth()), 'Content-Type': 'image/jpeg', 'x-upsert': 'true' }, body: blob });
  if (!res.ok) { let j = {}; try { j = await res.json(); } catch (e) {} throw new ApiError(j.message || 'upload failed', res.status, res.status === 400 || res.status === 403 ? '42501' : 'storage'); }
  const old = PHOTO_CACHE.get(path); PHOTO_CACHE.delete(path); if (old) old.then((u) => URL.revokeObjectURL(u)).catch(() => {});
}
function shrinkPhoto(file, max = 360) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file), img = new Image();
    img.onload = () => {
      const s = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(img.width * s)); c.height = Math.max(1, Math.round(img.height * s));
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
      c.toBlob((b) => (b ? resolve(b) : reject(new Error('encode'))), 'image/jpeg', 0.82);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('image')); };
    img.src = url;
  });
}
const avatarM = (m, big) => `<span class="av ph${big ? ' lg' : ''}"${m.photo_path ? ` data-photo="${esc(m.photo_path)}"` : ''}>${esc(initials(m.name))}</span>`;
function hydratePhotos() {
  $$('[data-photo]:not([data-ph-done])').forEach((el) => {
    el.dataset.phDone = '1';
    photoUrl(el.dataset.photo).then((u) => { if (u && el.isConnected) { el.style.backgroundImage = `url("${u}")`; el.classList.add('has'); } }).catch(() => {});
  });
}
let hydrateTimer;
new MutationObserver(() => { clearTimeout(hydrateTimer); hydrateTimer = setTimeout(hydratePhotos, 40); }).observe(document.body, { childList: true, subtree: true });
async function pickMemberPhoto(m, file, modal) {
  try {
    const blob = await shrinkPhoto(file), path = `${gymId()}/${m.id}.jpg`;
    await uploadPhoto(path, blob);
    if (m.photo_path !== path) await DB.update('members', m.id, { photo_path: path });
    bust('members'); toast(L('Photo saved', 'फ़ोटो सेव हुई'));
    if (modal) modal.close(); await render(); memberModal(m.id);
  } catch (e) { toast(e && e.message === 'image' ? L('This file is not a usable image.', 'यह फ़ाइल सही फ़ोटो नहीं है।') : friendlyError(e), 'bad'); throw e; }
}

/* ---------- Offers ---------- */
Q.offers = () => cached('offers', () => DB.select('offers', { order: 'created_at.desc', limit: 500 }));
const offerText = (o) => (o.kind === 'percent' ? `${Number(o.value)}% ${L('off', 'छूट')}` : `₹${Number(o.value)} ${L('off', 'छूट')}`);
const offerDiscount = (o, price) => (o.kind === 'percent' ? round2((Number(price) * Number(o.value)) / 100) : Math.min(Number(o.value), Number(price)));
const offerState = (o, t) => (!o.active ? 'off' : o.starts_on && o.starts_on > t ? 'soon' : o.ends_on && o.ends_on < t ? 'ended' : 'live');
const offerLive = (o, t) => offerState(o, t) === 'live';
const OFFER_TONE = { live: 'ok', soon: 'info', ended: 'mute', off: 'mute' };
const offerStateLabel = (s) => ({ live: L('Live', 'चालू'), soon: L('Scheduled', 'आने वाला'), ended: L('Ended', 'खत्म'), off: L('Off', 'बंद') }[s]);
async function vOffers() {
  const [offers, plans] = await Promise.all([Q.offers(), Q.plans()]), pm = planMap(plans), t = todayISO();
  return pageHead(L('Setup', 'सेटअप'), L('Offers', 'ऑफ़र'), L('A live offer can be picked while renewing or adding a member; the discount is filled in for you.', 'चालू ऑफ़र रिन्यूअल या नए सदस्य के समय चुन सकते हैं; छूट अपने-आप भर जाती है।'), `<button class="btn primary" data-act="newOffer" ${CTX.locked ? 'disabled' : ''}>${ic('plus')} ${esc(L('New offer', 'नया ऑफ़र'))}</button>`)
    + (offers.length ? `<div class="cg">${offers.map((o) => { const s = offerState(o, t); return `<div class="card pc${s === 'live' ? '' : ' off'}"><div style="display:flex;justify-content:space-between;gap:8px"><b>${esc(o.name)}</b>${badge(offerStateLabel(s), OFFER_TONE[s])}</div><div class="pr">${esc(offerText(o))}</div><div class="muted">${esc(o.plan_id ? (pm.get(o.plan_id) || {}).name || '—' : L('All plans', 'सभी प्लान'))}</div><div class="muted">${o.starts_on || o.ends_on ? esc(`${o.starts_on ? fmtDate(o.starts_on) : '…'} → ${o.ends_on ? fmtDate(o.ends_on) : '…'}`) : esc(L('No dates', 'तारीख़ तय नहीं'))}</div>${o.note ? `<div class="muted">${esc(o.note)}</div>` : ''}<div class="acts"><button class="btn sm" data-act="editOffer" data-id="${esc(o.id)}" ${CTX.locked ? 'disabled' : ''}>${ic('pencil')} ${esc(L('Edit', 'बदलें'))}</button><button class="btn sm" data-act="shareOffer" data-id="${esc(o.id)}">${ic('copy')} ${esc(L('Copy message', 'मैसेज कॉपी'))}</button></div></div>`; }).join('')}</div>` : `<div class="card">${empty(L('No offers yet', 'अभी कोई ऑफ़र नहीं'), L('Create an offer such as "Diwali 10% off" for new joiners or renewals.', 'जैसे "दिवाली 10% छूट" जैसा ऑफ़र बनाइए।'), `<button class="btn primary" data-act="newOffer">${esc(L('New offer', 'नया ऑफ़र'))}</button>`)}</div>`);
}
async function offerForm(id) {
  const [offers, plans] = await Promise.all([Q.offers(), Q.plans()]), x = id ? offers.find((o) => o.id === id) : null;
  openForm({
    title: x ? x.name : L('New offer', 'नया ऑफ़र'), values: x || {},
    fields: [
      { k: 'name', label: L('Offer name', 'ऑफ़र का नाम'), req: true, full: true, ph: 'Diwali 10% off', check: (v) => (v.length < 2 ? L('Too short', 'बहुत छोटा') : '') },
      { k: 'kind', label: L('Type', 'प्रकार'), type: 'select', options: [{ v: 'percent', l: L('Percent (%)', 'प्रतिशत (%)') }, { v: 'flat', l: L('Flat amount (₹)', 'सीधी रकम (₹)') }], def: x ? x.kind : 'percent' },
      { k: 'value', label: L('Value', 'मान'), type: 'number', req: true, min: 0.01, check: (v, o) => (o.kind === 'percent' && v > 100 ? L('Up to 100%', 'अधिकतम 100%') : '') },
      { k: 'plan_id', label: L('Applies to', 'किस पर लागू'), type: 'select', options: [{ v: '', l: L('All plans', 'सभी प्लान') }, ...plans.filter((p) => p.status === 'Active').map((p) => ({ v: p.id, l: p.name }))], def: x ? x.plan_id || '' : '', full: true },
      { k: 'starts_on', label: L('Starts', 'शुरू'), type: 'date' }, { k: 'ends_on', label: L('Ends', 'खत्म'), type: 'date', check: (v, o) => (v && o.starts_on && v < o.starts_on ? L('Before the start date', 'शुरू की तारीख़ से पहले') : '') },
      { k: 'active', label: L('Status', 'स्थिति'), type: 'select', options: [{ v: '1', l: L('On', 'चालू') }, { v: '0', l: L('Off', 'बंद') }], def: x ? (x.active ? '1' : '0') : '1' },
      { k: 'note', label: L('Note', 'नोट'), type: 'textarea', full: true },
    ],
    onSubmit: async (v) => {
      const row = { name: v.name, kind: v.kind, value: v.value, plan_id: v.plan_id || null, starts_on: v.starts_on || null, ends_on: v.ends_on || null, active: v.active === '1', note: v.note || null };
      const ok = await act(() => (x ? DB.update('offers', x.id, row) : DB.insert('offers', { ...row, gym_id: gymId() })), L('Saved', 'सेव हुआ'));
      if (ok) { bust('offers'); render(); } return !!ok;
    },
  });
}
async function shareOffer(id) {
  const [offers, plans] = await Promise.all([Q.offers(), Q.plans()]), o = offers.find((x) => x.id === id); if (!o) return;
  const plan = o.plan_id ? plans.find((p) => p.id === o.plan_id) : null;
  copyText(`🎁 ${gymName()}: ${o.name}\n${offerText(o)}${plan ? ' (' + plan.name + ')' : ''}${o.ends_on ? '\nतारीख़ ' + fmtDate(o.ends_on) + ' तक' : ''}\nसंपर्क: ${(CTX.gym && CTX.gym.phone) || ''}`, L('Offer message copied', 'ऑफ़र मैसेज कॉपी हुआ'));
}

/* ---------- Expiry reminders over WhatsApp (one tap: WhatsApp opens with the message ready) ---------- */
const U_REMIND = { days: 2 };
try { const d = Number(localStorage.getItem('gymos-remind-days')); if (d >= 1 && d <= 14) U_REMIND.days = d; } catch (e) {}
const isDueSoon = (m, days) => ['Active', 'Expiring'].includes(memberState(m)) && m.end_date && daysLeft(m) >= 0 && daysLeft(m) <= days;
function remindMsg(m, offer) {
  const left = daysLeft(m);
  const when = left < 0 ? `${fmtDate(m.end_date)} को खत्म हो चुकी है` : left === 0 ? 'आज खत्म हो रही है' : left === 1 ? 'कल खत्म हो रही है' : `${fmtDate(m.end_date)} को (${left} दिन में) खत्म हो रही है`;
  const upi = upiOf();
  return `नमस्ते ${m.name} जी, ${gymName()} से।\nआपकी सदस्यता ${when}.${offer ? `\n🎁 अभी ऑफ़र: ${offer.name} (${offerText(offer)})` : ''}\nरिन्यू के लिए जिम आइए${upi ? ` या UPI: ${upi} पर भुगतान करके हमें बताइए` : ''}।\n${(CTX.gym && CTX.gym.phone) ? 'संपर्क: ' + CTX.gym.phone + '\n' : ''}धन्यवाद! 💪`;
}
function bestOffer(m, offers, plans) {
  const t = todayISO(), pr = (plans.find((p) => p.id === m.plan_id) || {}).price || 0;
  return offers.filter((o) => offerLive(o, t) && (!o.plan_id || o.plan_id === m.plan_id)).sort((a, b) => offerDiscount(b, pr) - offerDiscount(a, pr))[0] || null;
}
async function vReminders() {
  const [members, offers, plans, invoices, payments] = await Promise.all([Q.members(), Q.offers().catch(() => []), Q.plans(), isAdmin() ? Q.invoices() : [], isAdmin() ? Q.payments() : []]);
  const d = U_REMIND.days, today = todayISO();
  const dueMap = duesByMember(invoices, paidByInvoice(payments)), mm = memberMap(members);
  const oldestDue = new Map(); invoices.forEach((i) => { if (!i.cancelled && i.due && balanceOf(i, paidByInvoice(payments)) > 0.004 && (!oldestDue.has(i.member_id) || oldestDue.get(i.member_id) > i.due)) oldestDue.set(i.member_id, i.due); });
  const owing = [...dueMap.entries()].map(([id, amt]) => ({ m: mm.get(id), amt })).filter((x) => x.m).sort((a, b) => b.amt - a.amt);
  const duesMsg = (m, amt) => `नमस्ते ${m.name} जी, ${gymName()} से।\nआपका ${inr(amt)} बकाया है।${upiOf() ? `\nUPI: ${upiOf()} पर भेज सकते हैं` : ''} या जिम आकर जमा कर दीजिए।\n${(CTX.gym && CTX.gym.phone) ? 'संपर्क: ' + CTX.gym.phone + '\n' : ''}धन्यवाद! 🙏`;
  const dueRow = ({ m, amt }) => `<li class="click" data-act="openMember" data-id="${esc(m.id)}">${avatarM(m)}<div class="grow"><b>${esc(m.name)}</b><small>${oldestDue.has(m.id) ? esc(L(`Oldest due date ${fmtDate(oldestDue.get(m.id))}`, `सबसे पुरानी देय तारीख़ ${fmtDate(oldestDue.get(m.id))}`)) : ''}</small></div><b class="num" style="color:var(--crimson)">${esc(inr(amt))}</b><a class="btn wa sm" data-stop target="_blank" rel="noreferrer" href="${esc(waLink(m.phone, duesMsg(m, amt)))}">${ic('msg')}</a></li>`;
  const soon = members.filter((m) => isDueSoon(m, d)).sort((a, b) => daysLeft(a) - daysLeft(b));
  const lapsed = members.filter((m) => memberState(m) === 'Expired' && daysLeft(m) >= -14).sort((a, b) => daysLeft(b) - daysLeft(a));
  const row = (m) => { const left = daysLeft(m), done = m.reminded_on === today; return `<li class="click" data-act="openMember" data-id="${esc(m.id)}">${avatarM(m)}<div class="grow"><b>${esc(m.name)}</b><small>${esc(left < 0 ? L(`Ended ${-left} day(s) ago`, `${-left} दिन पहले खत्म`) : left === 0 ? L('Ends today', 'आज खत्म') : L(`Ends in ${left} day(s) · ${fmtDate(m.end_date)}`, `${left} दिन में खत्म · ${fmtDate(m.end_date)}`))}${m.reminded_on ? ' · ' + esc(L(`reminded ${fmtShort(m.reminded_on)}`, `रिमाइंडर ${fmtShort(m.reminded_on)} को`)) : ''}</small></div>${done ? badge(L('Sent today', 'आज भेजा'), 'ok') : ''}<a class="btn wa sm" data-stop data-remind="${esc(m.id)}" target="_blank" rel="noreferrer" href="${esc(waLink(m.phone, remindMsg(m, bestOffer(m, offers, plans))))}">${ic('msg')} ${esc(done ? L('Again', 'फिर') : L('Remind', 'रिमाइंडर'))}</a></li>`; };
  return pageHead(L('Members', 'सदस्य'), L('Renewal reminders', 'रिन्यूअल रिमाइंडर'), L('WhatsApp opens with a ready message (and your best live offer). Press send. For fully automatic sending open the WhatsApp page.', 'WhatsApp तैयार मैसेज के साथ खुलता है (चालू सबसे अच्छे ऑफ़र के साथ)। बस भेज दीजिए। पूरी तरह अपने-आप भेजने के लिए WhatsApp पेज खोलिए।'),
    `<label class="fl" style="margin:0"><span>${esc(L('Remind this many days before', 'इतने दिन पहले याद दिलाएँ'))}</span><input class="in" id="rdays" type="number" min="1" max="14" value="${d}" data-bind="rdays" style="width:90px"></label>`)
    + card(L(`Ending within ${d} day(s)`, `${d} दिन में खत्म`), 'clock', '', soon.length ? `<ul class="list">${soon.map(row).join('')}</ul>` : empty(L('Nobody is due right now', 'अभी कोई नहीं'), ''))
    + `<div style="height:14px"></div>`
    + card(L('Ended in the last 14 days', 'पिछले 14 दिन में खत्म'), 'clock', '', lapsed.length ? `<ul class="list">${lapsed.map(row).join('')}</ul>` : empty(L('None', 'कोई नहीं'), ''))
    + `<div style="height:14px"></div>` + birthdayCard(members)
    + (isAdmin() ? `<div style="height:14px"></div>` + card(L(`Pending dues · ${inr(sum(owing, (x) => x.amt))}`, `बकाया · ${inr(sum(owing, (x) => x.amt))}`), 'wallet', '', owing.length ? `<ul class="list">${owing.map(dueRow).join('')}</ul>` : empty(L('No pending dues', 'कोई बकाया नहीं'), '')) : '');
}
function markReminded(id) {
  DB.update('members', id, { reminded_on: todayISO() }).then(() => { bust('members'); setTimeout(() => { if (currentRoute() && currentRoute()[0] === 'reminders') render(); }, 700); }).catch(() => {});
}
async function refreshBadge() {
  const a = $('#nav a[href="#reminders"]'); if (!a) return;
  try {
    const ms = await Q.members(), n = ms.filter((m) => isDueSoon(m, U_REMIND.days) && m.reminded_on !== todayISO()).length;
    let b = $('.n', a);
    if (n) { if (!b) { b = document.createElement('span'); b.className = 'n'; a.appendChild(b); } b.textContent = n; } else if (b) b.remove();
  } catch (e) {}
}
