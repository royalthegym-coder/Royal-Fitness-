/* ================= Super admin ================= */
const UPI_RE = /^[A-Za-z0-9._-]{2,}@[A-Za-z]{2,}$/;
async function vSuperGyms() {
  const rows = await Q.overview();
  const lockBadge = (g) => (g.locked ? badge(L('Locked', 'लॉक'), 'bad') : badge(L('Open', 'खुला'), 'ok'));
  const ovr = (g) => (g.lock_override === 'none' ? '' : `<br><small class="muted">${esc(g.lock_override === 'force_lock' ? L('forced lock', 'जबरन लॉक') : L('forced open', 'जबरन खुला'))}</small>`);
  return pageHead(L('Super admin', 'सुपर एडमिन'), L('Gyms', 'जिम'), L('Every gym, its subscription and lock. Member and payment details are not visible here.', 'हर जिम, उसकी सदस्यता और लॉक। सदस्य और भुगतान का ब्योरा यहाँ नहीं दिखता।'), `<button class="btn primary" data-act="newGym">${ic('plus')} ${esc(L('New gym', 'नया जिम'))}</button>`)
    + `<div class="tiles">${tile(L('Gyms', 'जिम'), rows.length)}${tile(L('Locked now', 'अभी लॉक'), rows.filter((g) => g.locked).length, '', rows.some((g) => g.locked) ? 'var(--crimson)' : '')}${tile(L('Members in total', 'कुल सदस्य'), sum(rows, (g) => g.members))}${tile(L('Ending in 7 days', '7 दिन में खत्म'), rows.filter((g) => g.subscription_ends_on && diffDays(todayISO(), g.subscription_ends_on) >= 0 && diffDays(todayISO(), g.subscription_ends_on) <= 7).length)}</div>`
    + `<div class="card">${rows.length ? `<div class="tw"><table class="t"><thead><tr><th>${esc(L('Gym', 'जिम'))}</th><th>${esc(L('Plan', 'प्लान'))}</th><th>${esc(L('Valid till', 'तारीख़ तक'))}</th><th>${esc(L('State', 'स्थिति'))}</th><th class="r">${esc(L('Members', 'सदस्य'))}</th><th class="r">${esc(L('Staff', 'स्टाफ़'))}</th><th>${esc(L('Last visit', 'आख़िरी विज़िट'))}</th><th></th></tr></thead><tbody>${rows.map((g) => `<tr><td class="edge ${g.locked ? 'e-bad' : 'e-ok'}"><b>${esc(g.name)}</b><br><small class="muted">${esc(g.city || '')}</small></td><td>${esc(g.plan)}${g.status === 'suspended' ? '<br>' + badge(L('Suspended', 'निलंबित'), 'warn') : ''}</td><td class="num">${esc(fmtDate(g.subscription_ends_on))}</td><td>${lockBadge(g)}${ovr(g)}</td><td class="r num">${g.members}</td><td class="r num">${g.staff}</td><td class="num">${g.last_visit ? esc(fmtShort(g.last_visit)) : '—'}</td><td class="r" style="white-space:nowrap"><button class="btn sm" data-act="extendGym" data-id="${esc(g.gym_id)}">${esc(L('Subscription', 'सब्सक्रिप्शन'))}</button> <button class="btn sm" data-act="lockGym" data-id="${esc(g.gym_id)}">${ic('lock')} ${esc(L('Lock', 'लॉक'))}</button></td></tr>`).join('')}</tbody></table></div>` : empty(L('No gyms yet', 'अभी कोई जिम नहीं'), L('Create the first gym, then assign its admin in Users.', 'पहला जिम बनाएँ, फिर Users में उसका एडमिन तय करें।'), `<button class="btn primary" data-act="newGym">${esc(L('New gym', 'नया जिम'))}</button>`)}</div>`;
}
function gymForm() {
  openForm({
    title: L('New gym', 'नया जिम'),
    fields: [
      { k: 'name', label: L('Gym name', 'जिम का नाम'), req: true, full: true, check: (v) => (v.length < 2 ? L('Too short', 'बहुत छोटा') : '') },
      { k: 'owner', label: L('Owner', 'मालिक') }, { k: 'phone', label: L('Phone', 'फ़ोन'), type: 'tel' },
      { k: 'city', label: L('City', 'शहर') }, { k: 'upi', label: L('Merchant UPI ID', 'मर्चेंट UPI आईडी'), ph: 'name@bank', check: (v) => (v && !UPI_RE.test(v) ? L('Example: name@bank', 'उदाहरण: name@bank') : '') },
      { k: 'ends', label: L('Subscription valid till', 'सब्सक्रिप्शन की तारीख़'), type: 'date', req: true, def: addDays(todayISO(), 30), full: true },
    ],
    onSubmit: async (v) => { const ok = await act(() => DB.rpc('admin_create_gym', { gym_name: v.name, owner: v.owner || null, phone_no: v.phone || null, city_name: v.city || null, upi: v.upi || null, ends_on: v.ends })); if (ok) { bust('overview', 'gyms'); toast(L('Gym created', 'जिम बन गया')); render(); } return !!ok; },
  });
}
async function extendForm(id) {
  const g = (await Q.overview()).find((x) => x.gym_id === id); if (!g) return;
  const start = g.subscription_ends_on && g.subscription_ends_on > todayISO() ? g.subscription_ends_on : todayISO();
  openForm({
    title: `${g.name} · ${L('Subscription', 'सब्सक्रिप्शन')}`,
    fields: [
      { k: 'plan', label: L('Plan', 'प्लान'), type: 'select', options: opts(['trial', 'starter', 'pro']), def: g.plan },
      { k: 'ends', label: L('Valid till', 'तारीख़ तक'), type: 'date', req: true, def: g.subscription_ends_on || addDays(todayISO(), 30) },
      { k: 'status', label: L('Status', 'स्थिति'), type: 'select', options: [{ v: 'active', l: L('Active', 'सक्रिय') }, { v: 'suspended', l: L('Suspended', 'निलंबित') }], def: g.status, full: true },
    ],
    extra: `<div class="row" style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">${[30, 90, 365].map((d) => `<button type="button" class="btn sm" data-quick="${d}">+${d} ${esc(L('days', 'दिन'))}</button>`).join('')}</div>`,
    onSubmit: async (v) => { const ok = await act(() => DB.rpc('admin_set_subscription', { gym: id, plan_name: v.plan, ends_on: v.ends, new_status: v.status }), L('Subscription saved', 'सब्सक्रिप्शन सेव हुआ')); if (ok) { bust('overview', 'gyms', 'audit'); render(); } return !!ok; },
  }).el.addEventListener('click', (e) => { const q = e.target.closest('[data-quick]'); if (q) $('#f_ends').value = addDays(start, Number(q.dataset.quick)); });
}
async function lockForm(id) {
  const g = (await Q.overview()).find((x) => x.gym_id === id); if (!g) return;
  const m = openModal({
    title: `${g.name} · ${L('Lock control', 'लॉक नियंत्रण')}`,
    body: `<p style="margin-top:0">${esc(g.locked ? L('This gym is locked: staff can read but not change data.', 'यह जिम लॉक है: स्टाफ़ पढ़ सकता है, बदल नहीं सकता।') : L('This gym is open.', 'यह जिम खुला है।'))}</p><div class="note">${esc(L('"Reset" lets the subscription date decide again. Forced open ignores an expired date until you reset it.', '"रीसेट" से फिर तारीख़ तय करती है। जबरन खुला रखने पर खत्म तारीख़ अनदेखी होती है, जब तक आप रीसेट न करें।'))}</div>`,
    footer: `<button type="button" class="btn danger" data-o="force_lock">${esc(L('Force lock', 'जबरन लॉक'))}</button><button type="button" class="btn" data-o="force_unlock">${esc(L('Force open', 'जबरन खोलें'))}</button><button type="button" class="btn primary" data-o="none">${esc(L('Reset', 'रीसेट'))}</button>`,
  });
  $$('[data-o]', m.el).forEach((b) => (b.onclick = async () => {
    b.disabled = true;
    const ok = await act(() => DB.rpc('admin_set_gym_lock', { gym: id, override: b.dataset.o }), L('Saved', 'सेव हुआ'));
    if (ok) { bust('overview', 'gyms', 'audit'); m.close(); render(); } else b.disabled = false;
  }));
}
async function vSuperUsers() {
  const [profiles, gyms] = await Promise.all([Q.profiles(), Q.gyms()]);
  const gm = new Map(gyms.map((g) => [g.id, g]));
  return pageHead(L('Super admin', 'सुपर एडमिन'), L('Users', 'यूज़र'), L('Accounts are created in the Supabase dashboard. Assign each one a role and a gym here.', 'अकाउंट Supabase डैशबोर्ड में बनते हैं। यहाँ हर एक को भूमिका और जिम दें।'))
    + `<div class="card">${profiles.length ? `<div class="tw"><table class="t"><thead><tr><th>${esc(L('User', 'यूज़र'))}</th><th>${esc(L('Role', 'भूमिका'))}</th><th>${esc(L('Gym', 'जिम'))}</th><th></th></tr></thead><tbody>${profiles.map((p) => `<tr><td><b>${esc(p.full_name || p.email || '—')}</b><br><small class="muted">${esc(p.email || '')}</small></td><td>${badge(roleName(p.role), p.role === 'super_admin' ? 'warn' : p.role === 'gym_admin' ? 'info' : 'mute')}</td><td>${p.gym_id ? esc((gm.get(p.gym_id) || {}).name || '—') : p.role === 'super_admin' ? '—' : `<span class="muted">${esc(L('No gym (waiting)', 'जिम नहीं (इंतज़ार में)'))}</span>`}</td><td class="r"><button class="btn sm" data-act="assignUser" data-id="${esc(p.id)}">${ic('pencil')} ${esc(L('Assign', 'तय करें'))}</button></td></tr>`).join('')}</tbody></table></div>` : empty(L('No users yet', 'अभी कोई यूज़र नहीं'), L('Create an account in Supabase → Authentication → Users first.', 'पहले Supabase → Authentication → Users में अकाउंट बनाएँ।')) }</div>`;
}
async function assignForm(id) {
  const [profiles, gyms] = await Promise.all([Q.profiles(), Q.gyms()]);
  const p = profiles.find((x) => x.id === id); if (!p) return;
  if (p.id === SESSION.user_id) { toast(L('You cannot change your own role here.', 'अपनी भूमिका यहाँ नहीं बदल सकते।'), 'bad'); return; }
  const m = openForm({
    title: p.full_name || p.email || 'User',
    fields: [
      { k: 'role', label: L('Role', 'भूमिका'), type: 'select', options: ['gym_admin', 'trainer', 'member', 'super_admin'].map((r) => ({ v: r, l: roleName(r) })), def: p.role === 'super_admin' ? 'gym_admin' : p.role, full: true },
      { k: 'gym', label: L('Gym', 'जिम'), type: 'select', options: [{ v: '', l: '—' }, ...gyms.map((g) => ({ v: g.id, l: g.name }))], def: p.gym_id || '', full: true, check: (v, o) => (o.role !== 'super_admin' && !v ? L('Choose a gym', 'जिम चुनें') : '') },
    ],
    onSubmit: async (v) => {
      if (v.role === 'super_admin' && !(await askConfirm(L('Make this person a super admin? They will control every gym.', 'इसे सुपर एडमिन बनाएँ? यह हर जिम को नियंत्रित करेगा।'), L('Yes, make super admin', 'हाँ, सुपर एडमिन बनाएँ')))) return false;
      const ok = await act(() => DB.rpc('admin_assign_user', { target: id, new_role: v.role, gym: v.role === 'super_admin' ? null : v.gym }), L('Saved', 'सेव हुआ'));
      if (ok) { bust('profiles', 'overview', 'audit'); render(); } return !!ok;
    },
  });
}
async function vSuperAudit() {
  const [rows, gyms] = await Promise.all([Q.audit(), Q.gyms()]);
  const gm = new Map(gyms.map((g) => [g.id, g]));
  const txt = (r) => ({ create_gym: L('Gym created', 'जिम बना'), set_lock: L('Lock changed', 'लॉक बदला'), set_subscription: L('Subscription changed', 'सब्सक्रिप्शन बदला'), assign_user: L('User assigned', 'यूज़र तय हुआ'), update_gym: L('Gym details changed', 'जिम का ब्योरा बदला') }[r.action] || r.action);
  return pageHead(L('Super admin', 'सुपर एडमिन'), L('Audit log', 'ऑडिट लॉग'), L('Every admin action, newest first. This log cannot be edited.', 'हर एडमिन कार्रवाई, नई सबसे ऊपर। इस लॉग को बदला नहीं जा सकता।'))
    + `<div class="card">${rows.length ? `<div class="tw"><table class="t"><thead><tr><th>${esc(L('When', 'कब'))}</th><th>${esc(L('Action', 'कार्रवाई'))}</th><th>${esc(L('Gym', 'जिम'))}</th><th>${esc(L('Detail', 'ब्योरा'))}</th></tr></thead><tbody>${rows.map((r) => `<tr><td class="num">${esc(fmtShort(r.at))} ${esc(fmtTime(r.at))}</td><td>${esc(txt(r))}</td><td>${esc((gm.get(r.gym_id) || {}).name || '—')}</td><td><small class="hash">${esc(JSON.stringify(r.detail || {}))}</small></td></tr>`).join('')}</tbody></table></div>` : empty(L('Nothing logged yet', 'अभी कुछ दर्ज नहीं'), '')}</div>`;
}
async function vSuperStatus() {
  const t0 = performance.now(); let ok = true, ms = 0, errTxt = '';
  try { await api('/rest/v1/rpc/admin_gym_overview', { method: 'POST', body: {} }); ms = Math.round(performance.now() - t0); } catch (e) { ok = false; errTxt = friendlyError(e); }
  const row = (a, b, tone) => `<li><div class="grow"><b>${esc(a)}</b></div>${tone ? badge(b, tone) : `<span class="num">${esc(b)}</span>`}</li>`;
  return pageHead(L('Super admin', 'सुपर एडमिन'), L('System status', 'सिस्टम स्थिति'), '')
    + card(L('What this page can really check', 'यह पेज असल में क्या जाँच सकता है'), 'pulse', '', `<ul class="list">${row(L('Database (Supabase) reachable', 'डेटाबेस (Supabase) पहुँच में'), ok ? L('Yes', 'हाँ') : L('No', 'नहीं'), ok ? 'ok' : 'bad')}${ok ? row(L('Response time', 'जवाब का समय'), ms + ' ms') : row(L('Error', 'त्रुटि'), errTxt)}${row(L('India time now', 'अभी भारतीय समय'), `${fmtDate(todayISO())} ${fmtTime(new Date().toISOString())}`)}${row(L('Signed in as', 'लॉगिन'), SESSION.email || '')}</ul>`)
    + `<div class="note" style="margin-top:14px">${esc(L('Cloudflare, n8n and WhatsApp are not connected to this app, so it does not show their health. Check them in their own dashboards.', 'Cloudflare, n8n और WhatsApp इस ऐप से जुड़े नहीं हैं, इसलिए इनकी सेहत यहाँ नहीं दिखती। इन्हें इनके अपने डैशबोर्ड में देखें।'))}</div>`;
}
