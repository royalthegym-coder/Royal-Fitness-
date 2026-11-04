/* ================= Boot: auth gate, role routing, events ================= */
const NAV = {
  super_admin: [['gyms', 'building', 'Gyms', 'जिम', vSuperGyms], ['users', 'users', 'Users', 'यूज़र', vSuperUsers], ['audit', 'list', 'Audit log', 'ऑडिट लॉग', vSuperAudit], ['status', 'pulse', 'Status', 'स्थिति', vSuperStatus]],
  gym_admin: [['dashboard', 'home', 'Dashboard', 'डैशबोर्ड', vDashboard], ['members', 'users', 'Members', 'सदस्य', vMembers], ['reminders', 'clock', 'Reminders', 'रिमाइंडर', vReminders], ['checkin', 'door', 'Check-in', 'चेक-इन', vCheckin], ['plans', 'tag', 'Plans', 'प्लान', vPlans], ['offers', 'crown', 'Offers', 'ऑफ़र', vOffers], ['invoices', 'receipt', 'Invoices', 'इनवॉइस', vInvoices], ['payments', 'wallet', 'Payments', 'भुगतान', vPayments], ['ledger', 'shield', 'Secure ledger', 'सुरक्षित लेजर', vLedger], ['retention', 'pulse', 'At risk', 'जोखिम', vRetention], ['peak', 'chart', 'Peak hours', 'भीड़ के समय', vPeak], ['settings', 'gear', 'Settings', 'सेटिंग', vSettings]],
  trainer: [['dashboard', 'home', 'Dashboard', 'डैशबोर्ड', vDashboard], ['members', 'users', 'Members', 'सदस्य', vMembers], ['reminders', 'clock', 'Reminders', 'रिमाइंडर', vReminders], ['checkin', 'door', 'Check-in', 'चेक-इन', vCheckin]],
  member: [['mine', 'home', 'My gym', 'मेरा जिम', vMine]],
};
const navFor = () => NAV[CTX.profile ? CTX.profile.role : ''] || [];
let RENDER_TOKEN = 0, WAITING = false;

function currentRoute() {
  const items = navFor(), h = location.hash.replace('#', '');
  return items.find((i) => i[0] === h) || items[0];
}

/* ---------- context ---------- */
async function loadContext() {
  const rows = await DB.select('profiles', { eq: { id: SESSION.user_id } });
  CTX.profile = rows[0] || null; CTX.gym = null; CTX.locked = false;
  if (!CTX.profile) return;
  if (CTX.profile.gym_id) {
    const g = await DB.select('gyms', { eq: { id: CTX.profile.gym_id } });
    CTX.gym = g[0] || null;
    CTX.locked = CTX.profile.role !== 'super_admin' && gymLocked(CTX.gym);
  }
}

/* ---------- screens ---------- */
function showGate(html) { $('#app').hidden = true; const g = $('#gate'); g.hidden = false; g.innerHTML = html; }
function loginScreen(msg) {
  showGate(`<div class="login"><section class="card"><div class="brand" style="padding:0"><span class="crest">${ic('crown')}</span><div><b>Royal The Gym</b><small>GymOS</small></div></div>
    <h1>${esc(L('Sign in', 'लॉगिन करें'))}</h1><p class="muted" style="margin:0">${esc(L('Use the email and password given by your gym.', 'अपने जिम से मिला ईमेल और पासवर्ड इस्तेमाल करें।'))}</p>
    ${msg ? `<div class="banner bad" style="margin:12px 0 0" role="alert">${esc(msg)}</div>` : ''}
    <form id="loginForm" novalidate><label class="fl"><span>${esc(L('Email', 'ईमेल'))}</span><input class="in" id="l_email" type="email" autocomplete="username" required></label>
    <label class="fl"><span>${esc(L('Password', 'पासवर्ड'))}</span><input class="in" id="l_pass" type="password" autocomplete="current-password" required></label>
    <button class="btn primary" id="l_go" type="submit">${esc(L('Sign in', 'लॉगिन'))}</button></form>
    <div style="display:flex;gap:8px;margin-top:14px"><button class="btn sm" type="button" data-act="lang">${ic('globe')} ${LANG === 'hi' ? 'English' : 'हिन्दी'}</button></div></section></div>`);
  const em = $('#l_email'); if (em) em.focus();
}
function waitingScreen() {
  showGate(`<div class="login"><section class="card"><h1>${esc(L('Waiting for approval', 'मंज़ूरी का इंतज़ार'))}</h1><p>${esc(L('Your account is created, but it is not linked to a gym yet. Ask your gym owner or the platform admin to assign you.', 'आपका अकाउंट बन गया है, पर अभी किसी जिम से नहीं जुड़ा। अपने जिम मालिक या प्लेटफ़ॉर्म एडमिन से जुड़वाएँ।'))}</p><p class="muted">${esc(SESSION.email || '')}</p>
    <div style="display:flex;gap:8px"><button class="btn" data-act="retry">${esc(L('Check again', 'फिर जाँचें'))}</button><button class="btn" data-act="signOut">${ic('out')} ${esc(L('Sign out', 'लॉग आउट'))}</button></div></section></div>`);
}
function chrome() {
  $('#gate').hidden = true; $('#app').hidden = false;
  const items = navFor(), cur = currentRoute();
  $('#nav').innerHTML = items.map((i) => `<a href="#${i[0]}" ${cur && cur[0] === i[0] ? 'aria-current="page"' : ''}>${ic(i[1])}<span>${esc(L(i[2], i[3]))}</span></a>`).join('');
  $('#date').textContent = fmtDate(todayISO());
  $('#gymName').textContent = CTX.gym ? CTX.gym.name : 'Royal The Gym';
  $('#pills').innerHTML = `<span class="pill">${esc(roleName(CTX.profile.role))}</span>${CTX.locked ? ` <span class="pill demo">${esc(L('Locked', 'लॉक'))}</span>` : ''}`;
  $('#who').textContent = SESSION.email || '';
  $('#langBtn').innerHTML = `${ic('globe')} ${LANG === 'hi' ? 'EN' : 'हि'}`;
  $('#langBtn').setAttribute('aria-label', L('Switch language', 'भाषा बदलें'));
  $('#themeBtn').innerHTML = ic(document.documentElement.dataset.theme === 'light' ? 'moon' : 'sun');
  $('#themeBtn').setAttribute('aria-label', L('Switch theme', 'थीम बदलें'));
  $('#pwBtn').innerHTML = ic('lock'); $('#pwBtn').setAttribute('aria-label', L('Change password', 'पासवर्ड बदलें')); $('#pwBtn').title = L('Change password', 'पासवर्ड बदलें');
  $('#outBtn').innerHTML = `${ic('out')}`; $('#outBtn').setAttribute('aria-label', L('Sign out', 'लॉग आउट'));
  document.documentElement.lang = LANG === 'hi' ? 'hi' : 'en';
}
function lockBanner() {
  if (!CTX.locked || !CTX.gym) return '';
  const forced = CTX.gym.lock_override === 'force_lock' || CTX.gym.status === 'suspended';
  return `<div class="banner bad" role="alert">${ic('lock')} ${esc(forced ? L('This gym is locked by the platform admin. You can view data but not change it.', 'यह जिम प्लेटफ़ॉर्म एडमिन ने लॉक किया है। आप डेटा देख सकते हैं, बदल नहीं सकते।') : L(`Subscription ended on ${fmtDate(CTX.gym.subscription_ends_on)}. You can view data but not change it. Renew to continue.`, `सब्सक्रिप्शन ${fmtDate(CTX.gym.subscription_ends_on)} को खत्म हुआ। आप डेटा देख सकते हैं, बदल नहीं सकते। जारी रखने के लिए रिन्यू करें।`))}</div>`;
}
async function render() {
  if (!CTX.profile) return;
  const token = ++RENDER_TOKEN, route = currentRoute(), view = $('#view');
  if (!route) { view.innerHTML = empty(L('Nothing to show', 'दिखाने को कुछ नहीं'), ''); return; }
  chrome();
  const focusId = document.activeElement && document.activeElement.dataset && document.activeElement.dataset.bind ? document.activeElement.id : null;
  const caret = focusId ? document.activeElement.selectionStart : 0;
  if (!view.dataset.ready || view.dataset.route !== route[0]) { view.innerHTML = loadingHtml(); }
  let html;
  try { html = await route[4](); } catch (e) {
    if (token !== RENDER_TOKEN) return;
    if (e && e.status === 401) return;
    view.dataset.ready = '1'; view.dataset.route = route[0];
    view.innerHTML = `<div class="card">${empty(L('Could not load this page', 'यह पेज लोड नहीं हो सका'), friendlyError(e), `<button class="btn" data-act="retry">${esc(L('Try again', 'फिर कोशिश करें'))}</button>`)}</div>`;
    return;
  }
  if (token !== RENDER_TOKEN) return;
  view.dataset.ready = '1'; view.dataset.route = route[0];
  view.innerHTML = lockBanner() + html; refreshBadge();
  if (focusId) { const el = document.getElementById(focusId); if (el) { el.focus(); try { el.setSelectionRange(caret, caret); } catch (e) {} } }
}
async function enter() {
  try { await loadContext(); } catch (e) { if (e && e.status === 401) return; showGate(`<div class="login"><section class="card"><h1>${esc(L('Could not connect', 'कनेक्ट नहीं हो सका'))}</h1><p>${esc(friendlyError(e))}</p><button class="btn" data-act="retry">${esc(L('Try again', 'फिर कोशिश करें'))}</button> <button class="btn" data-act="signOut">${esc(L('Sign out', 'लॉग आउट'))}</button></section></div>`); return; }
  const p = CTX.profile;
  if (!p || (p.role !== 'super_admin' && !p.gym_id)) { waitingScreen(); return; }
  if (!navFor().length) { waitingScreen(); return; }
  $('#view').dataset.ready = ''; render();
}
function onSignedOut() { bust(); CTX.profile = null; CTX.gym = null; CTX.locked = false; RENDER_TOKEN++; loginScreen(L('Please sign in again.', 'कृपया दोबारा लॉगिन करें।')); }

/* ---------- actions ---------- */
const CHIP = { memF: (v) => { U.members.f = v; U.members.page = 1; }, invF: (v) => { U.invoices.f = v; U.invoices.page = 1; }, peakD: (v) => { U.peak.days = v; } };
const BIND = { mq: (v) => { U.members.q = v; U.members.page = 1; }, cq: (v) => { U.checkin.q = v; }, iq: (v) => { U.invoices.q = v; U.invoices.page = 1; }, pq: (v) => { U.payments.q = v; U.payments.page = 1; }, rdays: (v) => { const n = Math.min(14, Math.max(1, parseInt(v, 10) || 2)); U_REMIND.days = n; try { localStorage.setItem('gymos-remind-days', String(n)); } catch (e) {} }, thr: (v) => { const n = Math.min(30, Math.max(1, parseInt(v, 10) || 4)); U.retention.thr = n; try { localStorage.setItem('gymos-thr', String(n)); } catch (e) {} } };
const ACTIONS = {
  newGym: () => gymForm(), extendGym: (d) => extendForm(d.id), lockGym: (d) => lockForm(d.id), assignUser: (d) => assignForm(d.id),
  newMember: () => memberForm(), openMember: (d) => memberModal(d.id), checkIn: (d) => doCheckIn(d.id), checkOut: (d) => doCheckOut(d.id),
  newPlan: () => planForm(), editPlan: (d) => planForm(d.id), newInvoice: () => invoiceForm(), openInvoice: (d) => invoiceModal(d.id),
  openReceipt: async (d) => { const [pays, ms] = await Promise.all([Q.payments(), Q.members()]); const p = pays.find((x) => x.id === d.id); if (p) { closeAllModals(); receiptModal(p, ms.find((m) => m.id === p.member_id)); } },
  payCsv: () => exportPayments(), verifyLedger: () => runVerify(), ledgerCsv: () => exportLedger(), editGym: () => editGymForm(),
  copyUpi: () => copyText(upiOf(), L('UPI ID copied', 'UPI आईडी कॉपी हुई')),
  chip: (d) => { CHIP[d.key] && CHIP[d.key](d.v); render(); },
  page: (d) => { const s = U[d.key]; if (s) { s.page = Math.max(1, s.page + Number(d.d)); render(); } },
  retry: () => { bust(); CTX.profile ? render() : enter(); },
  lang: () => { LANG = LANG === 'hi' ? 'en' : 'hi'; try { localStorage.setItem('gymos-lang', LANG); } catch (e) {} if (CTX.profile) render(); else if (SESSION) enter(); else loginScreen(); },
  theme: () => { const r = document.documentElement, nx = r.dataset.theme === 'light' ? 'dark' : 'light'; r.dataset.theme = nx; try { localStorage.setItem('gymos-theme', nx); } catch (e) {} chrome(); },
  importMembers: () => importForm(), membersCsv: () => exportMembers(), newOffer: () => offerForm(), editOffer: (d) => offerForm(d.id), shareOffer: (d) => shareOffer(d.id),
  newTrainer: () => accountForm('trainer'),
  changePw: () => openForm({
    title: L('Change password', 'पासवर्ड बदलें'),
    fields: [
      { k: 'pw', label: L('New password (8+ characters)', 'नया पासवर्ड (कम से कम 8 अक्षर)'), type: 'password', req: true, full: true, check: (v) => (v.length < 8 ? L('At least 8 characters', 'कम से कम 8 अक्षर') : '') },
      { k: 'pw2', label: L('Repeat new password', 'नया पासवर्ड दोबारा'), type: 'password', req: true, full: true, check: (v, o) => (v !== o.pw ? L('Passwords do not match', 'पासवर्ड मेल नहीं खाते') : '') },
    ],
    onSubmit: async (v) => { const ok = await act(() => Auth.changePassword(v.pw), L('Password changed', 'पासवर्ड बदल गया')); return !!ok; },
  }),
  signOut: async () => { await Auth.signOut(); bust(); CTX.profile = null; RENDER_TOKEN++; loginScreen(); },
};
document.addEventListener('click', (e) => {
  const link = e.target.closest('a[href]');
  if (link && link.dataset.remind) markReminded(link.dataset.remind);
  if (link && (link.hasAttribute('data-stop') || link.classList.contains('wa'))) return; /* let WhatsApp links open; do not trigger the row */
  if (link && !e.target.closest('[data-act]')) return;
  const el = e.target.closest('[data-act]'); if (!el || el.disabled) return;
  const fn = ACTIONS[el.dataset.act]; if (!fn) return;
  e.preventDefault();
  Promise.resolve(fn(el.dataset)).catch((err) => { if (!(err && err.status === 401)) toast(friendlyError(err), 'bad'); });
});
let bindTimer;
document.addEventListener('input', (e) => {
  const id = e.target.dataset && e.target.dataset.bind; if (!id || !BIND[id]) return;
  BIND[id](e.target.value); clearTimeout(bindTimer); bindTimer = setTimeout(render, id === 'thr' || id === 'rdays' ? 500 : 220);
});
document.addEventListener('submit', async (e) => {
  if (e.target.id !== 'loginForm') return;
  e.preventDefault();
  const email = $('#l_email').value.trim(), pass = $('#l_pass').value, btn = $('#l_go');
  if (!email || !pass) { loginScreen(L('Enter email and password.', 'ईमेल और पासवर्ड लिखें।')); return; }
  btn.disabled = true;
  try { await Auth.signIn(email, pass); bust(); await enter(); } catch (err) { loginScreen(friendlyError(err)); const el = $('#l_email'); if (el) el.value = email; }
});
window.addEventListener('hashchange', () => { closeAllModals(); if (CTX.profile) render(); });

/* ---------- start ---------- */
(function start() {
  try { const t = localStorage.getItem('gymos-theme'); if (t) document.documentElement.dataset.theme = t; } catch (e) {}
  $('#langBtn').onclick = () => ACTIONS.lang(); $('#themeBtn').onclick = () => ACTIONS.theme(); $('#outBtn').onclick = () => ACTIONS.signOut(); $('#pwBtn').onclick = () => ACTIONS.changePw();
  if (SESSION && SESSION.refresh_token) enter(); else loginScreen();
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
  window.addEventListener('offline', () => toast(L('You are offline. Changes cannot be saved until the internet is back.', 'इंटरनेट नहीं है। इंटरनेट आने तक बदलाव सेव नहीं होंगे।'), 'bad'));
})();
