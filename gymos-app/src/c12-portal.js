/* ================= Portals: navigation sheet, quick search, member portal (5 pages), super admin overview ================= */
U.sg = { q: '', f: 'all' };
U.su = { q: '', f: 'all' };

/* ---------- "More" sheet for phones: every page, grouped ---------- */
function openMoreSheet() {
  const items = navFor(), cur = currentRoute(); let lastG = '', html = '';
  items.forEach((i) => {
    if (i[5] && i[5] !== lastG) { html += `${lastG ? '</div>' : ''}<div class="sheet-grp">${esc(L(...(NAV_GROUPS[i[5]] || ['', ''])))}</div><div class="sheet-links">`; lastG = i[5]; }
    html += `<a href="#${esc(i[0])}"${cur && cur[0] === i[0] ? ' aria-current="page"' : ''}>${ic(i[1])}<span>${esc(L(i[2], i[3]))}</span></a>`;
  });
  const m = openModal({ title: L('All pages', 'सभी पेज'), body: html + (lastG ? '</div>' : '') });
  $$('a', m.el).forEach((a) => a.addEventListener('click', () => m.close()));
}

/* ---------- Quick search (Ctrl/Cmd+K or "/"): jump to any page, member or gym ---------- */
async function openPalette() {
  if (!CTX.profile || CTX.profile.role === 'member' || MODALS.length) return;
  const isSuper = CTX.profile.role === 'super_admin';
  let things = navFor().map((i) => ({ t: 'page', key: i[0], label: L(i[2], i[3]), sub: L('Page', 'पेज'), hay: `${i[2]} ${i[3]}`.toLowerCase() }));
  try {
    if (isSuper) things = things.concat((await Q.overview()).map((g) => ({ t: 'gym', key: g.gym_id, label: g.name, sub: g.city || L('Gym', 'जिम'), hay: `${g.name} ${g.city || ''}`.toLowerCase() })));
    else things = things.concat((await Q.members()).map((x) => ({ t: 'member', key: x.id, label: x.name, sub: x.phone || '', hay: `${x.name} ${x.phone || ''}`.toLowerCase() })));
  } catch (e) { /* pages still work */ }
  const m = openModal({ title: L('Quick search', 'तुरंत खोज'), body: `<input class="in pal-in" id="palQ" type="search" autocomplete="off" placeholder="${esc(isSuper ? L('Page or gym name', 'पेज या जिम का नाम') : L('Page, member name or phone', 'पेज, सदस्य का नाम या फ़ोन'))}" aria-label="${esc(L('Quick search', 'तुरंत खोज'))}"><ul class="pal-list" id="palL" role="listbox"></ul>` });
  const inp = $('#palQ', m.el), list = $('#palL', m.el); let shown = [], sel = 0;
  const go = (r) => { m.close(); if (!r) return; if (r.t === 'page') location.hash = r.key; else if (r.t === 'member') memberModal(r.key); else location.hash = 'gyms'; };
  const paint = () => {
    const q = inp.value.trim().toLowerCase();
    shown = (q ? things.filter((x) => x.hay.includes(q)) : things.filter((x) => x.t === 'page')).slice(0, 12); sel = Math.min(sel, Math.max(0, shown.length - 1));
    list.innerHTML = shown.length ? shown.map((r, i) => `<li role="option" data-i="${i}" aria-selected="${i === sel}">${ic(r.t === 'page' ? 'list' : 'users')}<b>${esc(r.label)}</b><small>${esc(r.sub)}</small></li>`).join('') : `<li style="cursor:default">${esc(L('Nothing found', 'कुछ नहीं मिला'))}</li>`;
  };
  inp.addEventListener('input', () => { sel = 0; paint(); });
  inp.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(shown.length - 1, sel + 1); paint(); } else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(0, sel - 1); paint(); } else if (e.key === 'Enter') { e.preventDefault(); go(shown[sel]); }
  });
  list.addEventListener('click', (e) => { const li = e.target.closest('li[data-i]'); if (li) go(shown[Number(li.dataset.i)]); });
  paint();
}
document.addEventListener('keydown', (e) => {
  const tg = e.target, typing = tg && (tg.tagName === 'INPUT' || tg.tagName === 'TEXTAREA' || tg.tagName === 'SELECT' || tg.isContentEditable);
  if (((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') || (e.key === '/' && !typing && !e.ctrlKey && !e.metaKey)) { if (CTX.profile && CTX.profile.role !== 'member') { e.preventDefault(); openPalette(); } }
});

/* ================= Member portal ================= */
const visitDays = (visits) => new Set(visits.map((v) => istDate(v.in_at)));
function currentStreak(days, t) { let d = days.has(t) ? t : addDays(t, -1), n = 0; while (days.has(d)) { n++; d = addDays(d, -1); } return n; }
function bestStreak(days) { const a = [...days].sort(); let best = 0, run = 0, prev = ''; a.forEach((d) => { run = prev && addDays(prev, 1) === d ? run + 1 : 1; best = Math.max(best, run); prev = d; }); return best; }
const WEEK_HI = ['र', 'सो', 'मं', 'बु', 'गु', 'शु', 'श'], WEEK_EN = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
function monthCal(mk, days, t) {
  const [y, mo] = mk.split('-').map(Number), first = new Date(Date.UTC(y, mo - 1, 1)).getUTCDay(), n = new Date(Date.UTC(y, mo, 0)).getUTCDate();
  let cells = ''; for (let i = 0; i < first; i++) cells += '<i class="pad"></i>';
  for (let d = 1; d <= n; d++) { const ds = `${mk}-${pad(d)}`; cells += `<i class="${days.has(ds) ? 'on' : ''}${ds === t ? ' today' : ''}" title="${esc(fmtDate(ds))}">${d}</i>`; }
  const cnt = [...days].filter((d) => monthKey(d) === mk).length;
  return `<div style="display:flex;justify-content:space-between;margin-bottom:8px"><b>${esc(MON[mo - 1])} ${y}</b><span class="muted">${esc(L(`${cnt} days`, `${cnt} दिन`))}</span></div><div class="cal-h">${(LANG === 'hi' ? WEEK_HI : WEEK_EN).map((w) => `<span>${w}</span>`).join('')}</div><div class="cal">${cells}</div>`;
}
const noMember = () => pageHead(gymName(), L('My gym', 'मेरा जिम'), '') + `<div class="card">${empty(L('Your membership is not linked yet', 'आपकी सदस्यता अभी जुड़ी नहीं है'), L('Ask the front desk to link your account to your membership.', 'फ़्रंट डेस्क से अपना अकाउंट सदस्यता से जुड़वाएँ।'))}</div>`;
const gymPhone = () => (CTX.gym && CTX.gym.phone) || '';

async function vMine() {
  const members = await Q.members(), m = members[0]; if (!m) return noMember();
  const [invoices, payments, visits, plans] = await Promise.all([Q.invoices(), Q.payments(), Q.visits(), Q.plans()]);
  let offers = []; try { offers = (await Q.offers()).filter((o) => offerLive(o, todayISO())); } catch (e) { /* offers are optional */ }
  const paid = paidByInvoice(payments), due = sum(invoices, (i) => balanceOf(i, paid)), s = memberState(m), dl = daysLeft(m), plan = plans.find((p) => p.id === m.plan_id), upi = upiOf(), t = todayISO();
  const days = visitDays(visits), streak = currentStreak(days, t), month = [...days].filter((d) => monthKey(d) === monthKey(t)).length;
  const inNow = visits.some((v) => istDate(v.in_at) === t && !v.out_at);
  const ending = s === 'Expired' || (dl != null && dl <= 7);
  const renewMsg = L(`Hi, I am ${m.name}. I want to renew my membership at ${gymName()}.`, `नमस्ते, मैं ${m.name} हूँ। मैं ${gymName()} में अपनी सदस्यता रिन्यू करना चाहता/चाहती हूँ।`);
  return pageHead(gymName(), `${L('Hello', 'नमस्ते')}, ${m.name}`, CTX.gym && CTX.gym.timings ? L('Gym timings: ', 'जिम का समय: ') + CTX.gym.timings : '')
    + (ending ? `<div class="banner ${s === 'Expired' ? 'bad' : 'warn'}" role="status" style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><span style="flex:1;min-width:200px">${esc(s === 'Expired' ? L('Your membership has ended. Renew to keep training.', 'आपकी सदस्यता ख़त्म हो गई। ट्रेनिंग जारी रखने के लिए रिन्यू करें।') : L(`Your membership ends in ${dl} day(s).`, `आपकी सदस्यता ${dl} दिन में ख़त्म होगी।`))}</span>${gymPhone() ? `<a class="btn sm pri" target="_blank" rel="noopener" href="${esc(waLink(gymPhone(), renewMsg))}">${esc(L('Renew on WhatsApp', 'WhatsApp पर रिन्यू'))}</a>` : ''}</div>` : '')
    + `<div class="tiles">${tile(L('Membership', 'सदस्यता'), badge(s), esc(plan ? plan.name : ''))}${tile(L('Valid till', 'तारीख़ तक'), esc(fmtDate(m.end_date)), dl == null ? '' : dl >= 0 ? esc(L(`${dl} days left`, `${dl} दिन बाक़ी`)) : esc(L(`Expired ${-dl} days ago`, `${-dl} दिन पहले ख़त्म`)))}${tile(L('Visit streak', 'लगातार दिन'), esc(L(`${streak} days`, `${streak} दिन`)), inNow ? esc(L('You are checked in', 'आप अभी चेक-इन हैं')) : esc(L(`${month} visits this month`, `इस महीने ${month} विज़िट`)), streak ? 'var(--ok)' : '')}${tile(L('Balance due', 'बकाया'), esc(inr(due)), due ? esc(L('Please clear it at the desk', 'कृपया डेस्क पर चुकाएँ')) : esc(L('All clear', 'सब चुकता')), due ? 'var(--crimson)' : '')}</div>`
    + (due && upi ? `<div class="card" style="padding:14px;margin-bottom:14px"><b>${esc(L('Pay your dues', 'बकाया चुकाएँ'))}</b><p class="muted" style="margin:6px 0">${esc(L('Pay to this UPI ID, then tell the front desk. The gym records the payment on its side.', 'इस UPI आईडी पर भुगतान करें, फिर फ़्रंट डेस्क को बताएँ। भुगतान जिम अपनी तरफ़ से दर्ज करता है।'))}</p><div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><code class="num">${esc(upi)}</code><button class="btn sm" data-act="copyUpi">${esc(L('Copy UPI ID', 'UPI आईडी कॉपी'))}</button></div></div>` : '')
    + (offers.length ? card(L('Offers for you', 'आपके लिए ऑफ़र'), 'crown', '', `<ul class="list">${offers.slice(0, 4).map((o) => `<li><div class="grow"><b>${esc(o.name)}</b><small>${esc(offerText(o))}${o.ends_on ? ' · ' + esc(L('till ', 'तक ')) + esc(fmtDate(o.ends_on)) : ''}</small></div></li>`).join('')}</ul>`) + '<div style="height:14px"></div>' : '')
    + memberPassCard(m)
    + achievementsCard(visits)
    + card(L('My progress', 'मेरी प्रगति'), 'pulse', `<a href="#progress" style="font-size:13px">${esc(L('Open', 'खोलें'))}</a>`, `<p class="muted" style="margin:0;padding:0 18px 14px">${esc(L('Track your weight and body measurements.', 'अपना वज़न और शरीर के माप ट्रैक करें।'))}</p>`)
    + `<div class="grid2">${card(L('Last visits', 'हाल की विज़िट'), 'clock', `<a href="#visits" style="font-size:13px">${esc(L('All', 'सभी'))}</a>`, visits.length ? `<ul class="list">${visits.slice(0, 4).map((v) => `<li><div class="grow"><b>${esc(fmtDate(v.in_at))}</b><small>${esc(fmtTime(v.in_at))}${v.out_at ? ' – ' + esc(fmtTime(v.out_at)) : ''}</small></div></li>`).join('')}</ul>` : empty(L('No visits yet', 'अभी कोई विज़िट नहीं'), ''))}`
    + `${card(L('Latest invoices', 'हाल के इनवॉइस'), 'receipt', `<a href="#pay" style="font-size:13px">${esc(L('All', 'सभी'))}</a>`, invoices.length ? `<ul class="list">${invoices.slice(0, 4).map((i) => `<li><div class="grow"><b class="num">${esc(i.no || '—')}</b><small>${esc(fmtDate(i.date))}</small></div><span class="num">${esc(inr(i.total))}</span>${badge(invStatus(i, paid))}</li>`).join('')}</ul>` : empty(L('No invoices', 'कोई इनवॉइस नहीं'), ''))}</div>`;
}
async function vMyPlan() {
  const m = (await Q.members())[0]; if (!m) return noMember();
  const html = await mineFitCards(m);
  return pageHead(gymName(), L('My diet & workout plan', 'मेरा डाइट और वर्कआउट प्लान'), L('Prepared for you by your gym. Follow it and tell your trainer how it feels.', 'आपके जिम ने आपके लिए बनाया है। इसे अपनाएँ और ट्रेनर को अनुभव बताएँ।'))
    + (html || `<div class="card">${empty(L('No plan yet', 'अभी कोई प्लान नहीं'), L('Your trainer will publish your diet and workout plan here. Ask at the front desk.', 'आपका ट्रेनर डाइट और वर्कआउट प्लान यहीं पब्लिश करेगा। फ़्रंट डेस्क पर पूछें।'))}</div>`);
}
async function vMyPay() {
  const m = (await Q.members())[0]; if (!m) return noMember();
  const [invoices, payments] = await Promise.all([Q.invoices(), Q.payments()]);
  const paid = paidByInvoice(payments), due = sum(invoices, (i) => balanceOf(i, paid)), total = sum(payments, (p) => p.amount);
  return pageHead(gymName(), L('My payments', 'मेरे भुगतान'), L('Every invoice and receipt for your membership.', 'आपकी सदस्यता के सभी इनवॉइस और रसीदें।'))
    + `<div class="tiles">${tile(L('Paid so far', 'अब तक चुकाया'), esc(inr(total)), '', 'var(--ok)')}${tile(L('Balance due', 'बकाया'), esc(inr(due)), '', due ? 'var(--crimson)' : '')}${tile(L('Receipts', 'रसीदें'), payments.length, '')}</div>`
    + `<div class="grid2">${card(L('Invoices', 'इनवॉइस'), 'receipt', '', invoices.length ? `<ul class="list">${invoices.map((i) => `<li><div class="grow"><b class="num">${esc(i.no || '—')}</b><small>${esc(fmtDate(i.date))}${i.due ? ' · ' + esc(L('due ', 'देय ')) + esc(fmtDate(i.due)) : ''}</small></div><span class="num">${esc(inr(i.total))}</span>${badge(invStatus(i, paid))}</li>`).join('')}</ul>` : empty(L('No invoices', 'कोई इनवॉइस नहीं'), ''))}`
    + `${card(L('Receipts', 'रसीदें'), 'wallet', '', payments.length ? `<ul class="list">${payments.map((p) => `<li class="click" data-act="openReceipt" data-id="${esc(p.id)}"><div class="grow"><b class="num">${esc(p.no || '—')}</b><small>${esc(fmtDate(p.paid_on))} · ${esc(p.method || '')}</small></div><span class="num">${esc(inr(p.amount))}</span></li>`).join('')}</ul>` : empty(L('No payments yet', 'अभी कोई भुगतान नहीं'), ''))}</div>`;
}
async function vMyVisits() {
  const m = (await Q.members())[0]; if (!m) return noMember();
  const visits = await Q.visits(), t = todayISO(), days = visitDays(visits), mk = monthKey(t), prev = monthKey(addDays(`${mk}-01`, -1));
  const inMonth = [...days].filter((d) => monthKey(d) === mk).length;
  return pageHead(gymName(), L('My visits', 'मेरी विज़िट'), L('Your attendance for the last 90 days.', 'पिछले 90 दिनों की आपकी हाज़िरी।'))
    + `<div class="tiles">${tile(L('Current streak', 'अभी लगातार'), esc(L(`${currentStreak(days, t)} days`, `${currentStreak(days, t)} दिन`)), '', 'var(--ok)')}${tile(L('Best streak', 'सबसे लंबा'), esc(L(`${bestStreak(days)} days`, `${bestStreak(days)} दिन`)), '')}${tile(L('This month', 'यह महीना'), inMonth, L('days trained', 'दिन ट्रेनिंग'))}${tile(L('Last 90 days', 'पिछले 90 दिन'), days.size, L('days trained', 'दिन ट्रेनिंग'))}</div>`
    + `<div class="grid2"><div class="card" style="padding:16px">${monthCal(prev, days, t)}</div><div class="card" style="padding:16px">${monthCal(mk, days, t)}</div></div><div style="height:14px"></div>`
    + card(L('Every visit', 'हर विज़िट'), 'clock', '', visits.length ? `<ul class="list">${visits.slice(0, 60).map((v) => `<li><div class="grow"><b>${esc(fmtDate(v.in_at))}</b><small>${esc(fmtTime(v.in_at))}${v.out_at ? ' – ' + esc(fmtTime(v.out_at)) : ''}</small></div></li>`).join('')}</ul>` : empty(L('No visits yet', 'अभी कोई विज़िट नहीं'), L('Show up at the front desk and your first visit will appear here.', 'फ़्रंट डेस्क पर आएँ, आपकी पहली विज़िट यहाँ दिखेगी।')));
}
async function vMyProfile() {
  const m = (await Q.members())[0]; if (!m) return noMember();
  const plans = await Q.plans(), plan = plans.find((p) => p.id === m.plan_id), g = CTX.gym || {}, row = (k, v) => `<dt>${esc(k)}</dt><dd>${v}</dd>`;
  return pageHead(gymName(), L('My profile', 'मेरी प्रोफ़ाइल'), '')
    + `<div class="grid2">${card(L('My membership', 'मेरी सदस्यता'), 'users', '', `<dl class="kv" style="padding:6px 18px 16px">${row(L('Name', 'नाम'), esc(m.name))}${row(L('Phone', 'फ़ोन'), esc(m.phone || '—'))}${row(L('Plan', 'प्लान'), esc(plan ? plan.name : '—'))}${row(L('Started', 'शुरू'), esc(fmtDate(m.start_date)))}${row(L('Valid till', 'तारीख़ तक'), esc(fmtDate(m.end_date)))}${row(L('Goal', 'लक्ष्य'), esc(m.goal || '—'))}${m.trainer_id ? row(L('My trainer', 'मेरा ट्रेनर'), esc(m.trainer_name || '—')) : ''}${row(L('Status', 'स्थिति'), badge(memberState(m)))}</dl>`)}`
    + `${card(L('My gym', 'मेरा जिम'), 'building', '', `<dl class="kv" style="padding:6px 18px 16px">${row(L('Gym', 'जिम'), esc(g.name || '—'))}${row(L('City', 'शहर'), esc(g.city || '—'))}${row(L('Phone', 'फ़ोन'), g.phone ? `<a href="tel:${esc(String(g.phone).replace(/[^\d+]/g, ''))}">${esc(g.phone)}</a>` : '—')}${row(L('Timings', 'समय'), esc(g.timings || '—'))}${row('UPI', g.upi_id ? `${esc(g.upi_id)} <button class="btn sm" data-act="copyUpi">${esc(L('Copy', 'कॉपी'))}</button>` : '—')}</dl>`)}</div><div style="height:14px"></div>`
    + card(L('My account', 'मेरा अकाउंट'), 'lock', '', `<div style="padding:6px 18px 18px"><p class="muted" style="margin:0 0 12px">${esc(SESSION.email || '')}</p><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" data-act="changePw">${ic('lock')} ${esc(L('Change password', 'पासवर्ड बदलें'))}</button><button class="btn" data-act="lang">${ic('globe')} ${LANG === 'hi' ? 'English' : 'हिन्दी'}</button><button class="btn" data-act="signOut">${ic('out')} ${esc(L('Sign out', 'लॉग आउट'))}</button></div></div>`);
}

/* ================= Super admin overview ================= */
const subState = (g, t) => (g.locked ? 'locked' : !g.subscription_ends_on ? 'open' : g.subscription_ends_on < t ? 'expired' : diffDays(t, g.subscription_ends_on) <= 14 ? 'soon' : 'open');
const AUDIT_TXT = () => ({ create_gym: L('Gym created', 'जिम बना'), set_lock: L('Lock changed', 'लॉक बदला'), set_subscription: L('Subscription changed', 'सब्सक्रिप्शन बदला'), assign_user: L('User assigned', 'यूज़र तय हुआ'), update_gym: L('Gym edited', 'जिम बदला'), void_sale: L('Sale cancelled', 'बिक्री रद्द') });
async function vSuperHome() {
  const [rows, audit] = await Promise.all([Q.overview(), Q.audit().catch(() => [])]), t = todayISO();
  const st = (g) => subState(g, t), locked = rows.filter((g) => g.locked), soon = rows.filter((g) => st(g) === 'soon'), expired = rows.filter((g) => st(g) === 'expired' && !g.locked);
  const quiet = rows.filter((g) => !g.locked && (!g.last_visit || diffDays(istDate(g.last_visit), t) > 7));
  const attn = rows.filter((g) => ['locked', 'expired', 'soon'].includes(st(g))).sort((a, b) => String(a.subscription_ends_on || '').localeCompare(String(b.subscription_ends_on || '')));
  const mix = ['trial', 'starter', 'pro'].map((p) => [p, rows.filter((g) => g.plan === p).length]).filter((x) => x[1] > 0);
  const gm = new Map(rows.map((g) => [g.gym_id, g])), at = AUDIT_TXT();
  const attnTbl = attn.length ? `<div class="tw"><table class="t"><thead><tr><th>${esc(L('Gym', 'जिम'))}</th><th>${esc(L('Why', 'वजह'))}</th><th>${esc(L('Valid till', 'तारीख़ तक'))}</th><th></th></tr></thead><tbody>${attn.map((g) => `<tr><td><b>${esc(g.name)}</b><br><small class="muted">${esc(g.city || '')}</small></td><td>${badge(g.locked ? L('Locked', 'लॉक') : st(g) === 'expired' ? L('Expired', 'ख़त्म') : L('Ends soon', 'जल्दी ख़त्म'), g.locked || st(g) === 'expired' ? 'bad' : 'warn')}</td><td class="num">${esc(fmtDate(g.subscription_ends_on))}</td><td class="r" style="white-space:nowrap"><button class="btn sm" data-act="extendGym" data-id="${esc(g.gym_id)}">${esc(L('Subscription', 'सब्सक्रिप्शन'))}</button> <button class="btn sm" data-act="lockGym" data-id="${esc(g.gym_id)}">${ic('lock')} ${esc(L('Lock', 'लॉक'))}</button></td></tr>`).join('')}</tbody></table></div>` : empty(L('Nothing needs attention', 'किसी पर ध्यान की ज़रूरत नहीं'), L('No gym is locked, expired or about to end.', 'कोई जिम लॉक, ख़त्म या जल्दी ख़त्म होने वाला नहीं।'));
  return pageHead(L('Super admin', 'सुपर एडमिन'), L('Platform overview', 'प्लेटफ़ॉर्म ओवरव्यू'), L('Every gym at a glance. Member and payment details are not visible here.', 'हर जिम एक नज़र में। सदस्य और भुगतान का ब्योरा यहाँ नहीं दिखता।'), `<button class="btn primary" data-act="newGym">${ic('plus')} ${esc(L('New gym', 'नया जिम'))}</button>`)
    + `<div class="tiles">${tile(L('Gyms', 'जिम'), rows.length, L(`${rows.length - locked.length} open`, `${rows.length - locked.length} खुले`))}${tile(L('Locked', 'लॉक'), locked.length, '', locked.length ? 'var(--crimson)' : '')}${tile(L('Ending in 14 days', '14 दिन में ख़त्म'), soon.length, expired.length ? esc(L(`${expired.length} already expired`, `${expired.length} पहले ही ख़त्म`)) : '', soon.length ? 'var(--warn)' : '')}${tile(L('Members', 'सदस्य'), sum(rows, (g) => g.members), L(`${sum(rows, (g) => g.staff)} staff`, `${sum(rows, (g) => g.staff)} स्टाफ़`))}</div>`
    + card(L('Needs attention', 'ध्यान चाहिए'), 'pulse', '', attnTbl) + '<div style="height:14px"></div>'
    + `<div class="grid2">${card(L('Plan mix', 'प्लान का बँटवारा'), 'tag', '', mix.length ? `<ul class="list">${mix.map(([p, n]) => `<li><div class="grow"><b>${esc(p)}</b><div class="cbar"><i style="width:${Math.max(4, Math.round((n / rows.length) * 100))}%"></i></div></div><span class="num">${n}</span></li>`).join('')}</ul>` : empty(L('No gyms yet', 'अभी कोई जिम नहीं'), ''))}`
    + `${card(L('Quiet gyms', 'शांत जिम'), 'clock', '', quiet.length ? `<ul class="list">${quiet.map((g) => `<li><div class="grow"><b>${esc(g.name)}</b><small>${esc(g.last_visit ? L('Last check-in ', 'आख़िरी चेक-इन ') + fmtDate(g.last_visit) : L('No check-ins yet', 'अभी तक कोई चेक-इन नहीं'))}</small></div></li>`).join('')}</ul>` : empty(L('All gyms are active', 'सभी जिम सक्रिय हैं'), L('Every open gym had a check-in in the last 7 days.', 'हर खुले जिम में पिछले 7 दिन में चेक-इन हुआ।')))}</div><div style="height:14px"></div>`
    + card(L('Recent admin actions', 'हाल की एडमिन कार्रवाई'), 'list', `<a href="#audit" style="font-size:13px">${esc(L('All', 'सभी'))}</a>`, audit.length ? `<ul class="list">${audit.slice(0, 6).map((r) => `<li><div class="grow"><b>${esc(at[r.action] || r.action)}</b><small>${r.gym_id && gm.get(r.gym_id) ? esc(gm.get(r.gym_id).name) + ' · ' : ''}${esc(fmtDate(r.at))} ${esc(fmtTime(r.at))}</small></div></li>`).join('')}</ul>` : empty(L('No actions yet', 'अभी कोई कार्रवाई नहीं'), ''));
}
