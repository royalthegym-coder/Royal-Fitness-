/* ================= Gym screens (gym_admin; trainers get Members + Check-in) ================= */
const U = { members: { q: '', f: 'all', page: 1 }, checkin: { q: '' }, invoices: { f: 'all', q: '', page: 1 }, payments: { q: '', page: 1 }, ledger: { result: null, busy: false, page: 1 }, retention: { thr: 4 }, peak: { days: '28' } };
try { const t = Number(localStorage.getItem('gymos-thr')); if (t >= 1 && t <= 30) U.retention.thr = t; } catch (e) {}
const isAdmin = () => CTX.profile.role === 'gym_admin';
const gymName = () => (CTX.gym ? CTX.gym.name : 'Royal The Gym');
const memberName = (map, id) => (map.get(id) || {}).name || '—';
const upiOf = () => (CTX.gym && CTX.gym.upi_id) || '';

/* ---------- Dashboard ---------- */
async function vDashboard() {
  const [members, invoices, payments, visits] = await Promise.all([Q.members(), Q.invoices(), Q.payments(), Q.visits()]);
  const paid = paidByInvoice(payments), today = todayISO(), mk = monthKey(today);
  const states = members.map(memberState);
  const active = states.filter((s) => s === 'Active' || s === 'Expiring').length, expiring = states.filter((s) => s === 'Expiring').length, expired = states.filter((s) => s === 'Expired').length;
  const todayIn = visits.filter((v) => istDate(v.in_at) === today), onFloor = todayIn.filter((v) => !v.out_at).length;
  const collected = sum(payments.filter((p) => monthKey(p.paid_on) === mk), (p) => p.amount);
  const dues = sum(invoices, (i) => balanceOf(i, paid)), overdueN = invoices.filter((i) => isOverdue(i, paid)).length;
  const soon = members.filter((m) => memberState(m) === 'Expiring').sort((a, b) => a.end_date.localeCompare(b.end_date)).slice(0, 6);
  return pageHead(gymName(), L('Dashboard', 'डैशबोर्ड'), fmtDate(today))
    + (isAdmin() ? '<div id="daySum"></div>' : '')
    + `<div class="tiles">${tile(L('Active members', 'सक्रिय सदस्य'), active, `${expired} ${esc(L('expired', 'खत्म'))}`)}${tile(L('Expiring in 7 days', '7 दिन में खत्म'), expiring, '', expiring ? 'var(--warn)' : '')}${tile(L('Check-ins today', 'आज चेक-इन'), todayIn.length, `${onFloor} ${esc(L('on the floor now', 'अभी फ़्लोर पर'))}`)}${isAdmin() ? tile(L('Collected this month', 'इस महीने जमा'), esc(inr(collected))) + tile(L('Dues pending', 'बकाया'), esc(inr(dues)), overdueN ? `${overdueN} ${esc(L('overdue', 'देर'))}` : '', dues ? 'var(--crimson)' : '') : ''}</div>`
    + `<div class="grid2">${card(L('Renewals coming up', 'जल्द खत्म होने वाले'), 'clock', '', soon.length ? `<ul class="list">${soon.map((m) => `<li class="click" data-act="openMember" data-id="${esc(m.id)}">${avatarM(m)}<div class="grow"><b>${esc(m.name)}</b><small>${esc(L(`Ends ${fmtDate(m.end_date)}`, `${fmtDate(m.end_date)} को खत्म`))}</small></div>${waBtnRenew(m)}</li>`).join('')}</ul>` : empty(L('No renewals due this week', 'इस हफ़्ते कोई रिन्यूअल नहीं'), ''))}
    ${card(L('Today at the gym', 'आज जिम में'), 'door', `<a href="#checkin">${esc(L('Check-in', 'चेक-इन'))}</a>`, todayIn.length ? `<ul class="list">${todayIn.slice(0, 6).map((v) => `<li><div class="grow"><b>${esc(memberName(memberMap(members), v.member_id))}</b><small>${esc(fmtTime(v.in_at))}${v.out_at ? ' – ' + esc(fmtTime(v.out_at)) : ''}</small></div>${v.out_at ? '' : badge(L('Inside', 'अंदर'), 'ok')}</li>`).join('')}</ul>` : empty(L('No check-ins yet today', 'आज अभी कोई चेक-इन नहीं'), ''))}</div>`;
}
const waBtnRenew = (m) => `<a class="btn wa sm" data-stop data-remind="${esc(m.id)}" target="_blank" rel="noreferrer" href="${esc(waLink(m.phone, `नमस्ते ${m.name} जी, ${gymName()} से। आपकी सदस्यता ${fmtDate(m.end_date)} को समाप्त हो रही है। रिन्यूअल के लिए हमसे संपर्क करें। 💪`))}">${ic('msg')} WhatsApp</a>`;

/* ---------- Members ---------- */
async function vMembers() {
  const [members, plans, invoices, payments, visits] = await Promise.all([Q.members(), Q.plans(), isAdmin() ? Q.invoices() : [], isAdmin() ? Q.payments() : [], Q.visits()]);
  const pm = planMap(plans), last = lastVisitMap(visits), dues = duesByMember(invoices, paidByInvoice(payments));
  const st = U.members, q = st.q.trim().toLowerCase();
  const counts = { all: members.length }; STATE_FILTERS.forEach((s) => (counts[s] = members.filter((m) => memberState(m) === s).length));
  let rows = members.filter((m) => (st.f === 'all' || memberState(m) === st.f) && (!q || m.name.toLowerCase().includes(q) || String(m.phone || '').includes(q)));
  const total = rows.length; st.page = Math.min(st.page, Math.max(1, Math.ceil(total / PAGE))); rows = rows.slice((st.page - 1) * PAGE, st.page * PAGE);
  return pageHead(L('People', 'लोग'), L('Members', 'सदस्य'), '', `<button class="btn" data-act="membersCsv">${ic('down')} CSV</button>${isAdmin() ? `<button class="btn" data-act="importMembers" ${CTX.locked ? 'disabled' : ''}>${ic('down')} ${esc(L('Import', 'इम्पोर्ट'))}</button>` : ''}<button class="btn primary" data-act="newMember" ${CTX.locked ? 'disabled' : ''}>${ic('plus')} ${esc(L('New member', 'नया सदस्य'))}</button>`)
    + `<div class="bar">${searchBox('mq', st.q, L('Search name or phone', 'नाम या फ़ोन खोजें'))}</div>`
    + chipsHtml('memF', st.f, [['all', L('All', 'सभी'), counts.all], ...STATE_FILTERS.map((s) => [s, LANG === 'hi' ? STATE_HI[s] : s, counts[s]])])
    + `<div class="card">${rows.length ? `<div class="tw"><table class="t"><thead><tr><th>${esc(L('Photo', 'फ़ोटो'))}</th><th>${esc(L('Member', 'सदस्य'))}</th><th>${esc(L('Plan', 'प्लान'))}</th><th>${esc(L('Status', 'स्थिति'))}</th><th class="r">${esc(L('Valid till', 'तारीख़ तक'))}</th><th>${esc(L('Last visit', 'आख़िरी विज़िट'))}</th>${isAdmin() ? `<th class="r">${esc(L('Dues', 'बकाया'))}</th>` : ''}</tr></thead><tbody>${rows.map((m) => { const s = memberState(m), d = dues.get(m.id) || 0; return `<tr class="click" data-act="openMember" data-id="${esc(m.id)}"><td class="edge e-${TONE[s] || 'mute'}">${avatarM(m)}</td><td><b>${esc(m.name)}</b><br><small class="muted">${esc(m.phone || '')}</small></td><td>${esc((pm.get(m.plan_id) || {}).name || '—')}</td><td>${badge(s)}</td><td class="r num">${esc(fmtDate(m.end_date))}</td><td class="num">${last.get(m.id) ? esc(fmtShort(last.get(m.id))) : '—'}</td>${isAdmin() ? `<td class="r num" style="color:${d ? 'var(--crimson)' : 'inherit'}">${d ? esc(inr(d)) : '—'}</td>` : ''}</tr>`; }).join('')}</tbody></table></div>${pagerHtml(total, st.page, 'members')}` : empty(members.length ? L('No members match', 'कोई सदस्य मेल नहीं खाता') : L('No members yet', 'अभी कोई सदस्य नहीं'), '', members.length ? '' : `<button class="btn primary" data-act="newMember">${esc(L('Add the first member', 'पहला सदस्य जोड़ें'))}</button>`)}</div>`;
}
const GOALS = ['Fat Loss', 'Muscle', 'Strength', 'General Fitness', 'Rehab'];
async function memberForm(id) {
  const [members, plans, offers] = await Promise.all([Q.members(), Q.plans(), isAdmin() ? Q.offers() : []]);
  const liveOffers = offers.filter((o) => offerLive(o, todayISO()));
  const x = id ? members.find((m) => m.id === id) : null;
  const act2 = plans.filter((p) => p.status === 'Active');
  const fields = [
    { k: 'name', label: L('Name', 'नाम'), req: true, full: true }, { k: 'phone', label: L('Phone', 'फ़ोन'), type: 'tel', req: true },
    { k: 'gender', label: L('Gender', 'लिंग'), type: 'select', options: [{ v: '', l: '—' }, { v: 'Male', l: L('Male', 'पुरुष') }, { v: 'Female', l: L('Female', 'महिला') }, { v: 'Other', l: L('Other', 'अन्य') }] },
    { k: 'goal', label: L('Goal', 'लक्ष्य'), type: 'select', options: [{ v: '', l: '—' }, ...GOALS.map((g) => ({ v: g, l: g }))] },
    { k: 'plan_id', label: L('Plan', 'प्लान'), type: 'select', options: [{ v: '', l: L('No plan yet', 'अभी प्लान नहीं') }, ...act2.map((p) => ({ v: p.id, l: `${p.name} · ${inr(p.price)}` }))], def: x ? x.plan_id || '' : '' },
    { k: 'start_date', label: L('Start date', 'शुरू की तारीख़'), type: 'date', def: x ? x.start_date : todayISO() },
    { k: 'notes', label: L('Notes', 'नोट'), type: 'textarea', full: true },
  ];
  if (isAdmin()) fields.push({ k: 'wa_opt_out', label: L('Do not send automatic WhatsApp messages (member asked to stop)', 'ऑटोमैटिक WhatsApp मैसेज न भेजें (सदस्य ने मना किया)'), type: 'check', full: true });
  if (!x && isAdmin()) { fields.push({ k: 'bill', label: L('Create the first invoice for the plan', 'प्लान का पहला इनवॉइस बनाएँ'), type: 'check', def: true, full: true }); if (liveOffers.length) fields.push({ k: 'offer', label: L('Offer (applies to the invoice)', 'ऑफ़र (इनवॉइस पर लागू)'), type: 'select', options: [{ v: '', l: L('No offer', 'कोई ऑफ़र नहीं') }, ...liveOffers.map((o) => ({ v: o.id, l: `${o.name} · ${offerText(o)}` }))], full: true }); }
  openForm({
    title: x ? x.name : L('New member', 'नया सदस्य'), fields, values: x || {},
    onSubmit: async (v) => {
      const plan = plans.find((p) => p.id === v.plan_id);
      const start = v.start_date || todayISO();
      const row = { name: v.name, phone: v.phone, gender: v.gender || null, goal: v.goal || null, notes: v.notes || null, plan_id: plan ? plan.id : null };
      if (isAdmin()) row.wa_opt_out = !!v.wa_opt_out;
      if (plan && (!x || x.plan_id !== plan.id || x.start_date !== start)) { row.start_date = start; row.end_date = addDays(addMonths(start, plan.months), -1); }
      const saved = await act(() => (x ? DB.update('members', x.id, row) : DB.insert('members', { ...row, gym_id: gymId() })), L('Saved', 'सेव हुआ'));
      if (!saved) return false;
      if (!x && plan && v.bill && isAdmin()) {
        const off = liveOffers.find((o) => o.id === v.offer && (!o.plan_id || o.plan_id === plan.id)), disc = off ? offerDiscount(off, plan.price) : 0;
        const items = [{ label: `${plan.name} membership`, amount: Number(plan.price) }]; if (off && disc > 0) items.push({ label: `Offer: ${off.name}`, amount: 0 });
        await act(() => DB.insert('invoices', { gym_id: gymId(), member_id: saved.id, items, ...computeInvoice([{ amount: plan.price }], disc, plan.gst_pct), due: addDays(todayISO(), 7) }), L('Invoice created', 'इनवॉइस बना'));
      }
      bust('members', 'invoices'); render(); return true;
    },
  });
}
async function renewForm(id) {
  const [members, plans, invoices, payments, offers] = await Promise.all([Q.members(), Q.plans(), Q.invoices(), Q.payments(), Q.offers()]);
  const liveOffers = offers.filter((o) => offerLive(o, todayISO()));
  const m = members.find((x) => x.id === id); if (!m) return;
  const act2 = plans.filter((p) => p.status === 'Active'); if (!act2.length) { toast(L('Add a plan first.', 'पहले प्लान जोड़ें।'), 'bad'); return; }
  const startDef = m.end_date && m.end_date >= todayISO() ? addDays(m.end_date, 1) : todayISO();
  const cur = act2.find((p) => p.id === m.plan_id) || act2[0];
  const preview = (root, src) => { const p = act2.find((x) => x.id === $('#f_plan', root).value); if (src === 'offer' || src === 'plan') { const o = liveOffers.find((x) => x.id === $('#f_offer', root).value); $('#f_discount', root).value = o && (!o.plan_id || o.plan_id === p.id) ? offerDiscount(o, p.price) : 0; } const disc = parseFloat($('#f_discount', root).value) || 0; const c = computeInvoice([{ amount: p.price }], disc, p.gst_pct); const out = $('#rn_sum', root); if (out) out.textContent = `${L('Total', 'कुल')} ${inr(c.total)} (GST ${inr(c.gst_amt)})`; const pay = $('#f_pay', root); if (pay && !pay.dataset.touched) pay.value = c.total; };
  const mod = openForm({
    title: `${L('Renew', 'रिन्यू')} · ${m.name}`,
    fields: [
      { k: 'plan', label: L('Plan', 'प्लान'), type: 'select', options: act2.map((p) => ({ v: p.id, l: `${p.name} · ${inr(p.price)}` })), def: cur.id, full: true },
      { k: 'offer', label: L('Offer', 'ऑफ़र'), type: 'select', options: [{ v: '', l: L('No offer', 'कोई ऑफ़र नहीं') }, ...liveOffers.map((o) => ({ v: o.id, l: `${o.name} · ${offerText(o)}` }))], full: true },
      { k: 'start', label: L('Starts on', 'शुरू'), type: 'date', req: true, def: startDef }, { k: 'discount', label: `${L('Discount', 'छूट')} (₹)`, type: 'number', def: 0 },
      { k: 'pay', label: `${L('Paid now', 'अभी जमा')} (₹)`, type: 'number', def: 0 }, { k: 'method', label: L('Method', 'तरीक़ा'), type: 'select', options: opts(['UPI', 'Cash', 'Card', 'Bank']) },
    ],
    extra: `<div class="note" id="rn_sum" style="margin-top:10px"></div>`,
    submitLabel: L('Renew', 'रिन्यू करें'),
    onSubmit: async (v) => {
      const p = act2.find((x) => x.id === v.plan), c = computeInvoice([{ amount: p.price }], v.discount, p.gst_pct);
      if (Number(v.pay) > c.total + 0.005) { $('#e_pay', mod.el).textContent = L(`More than the total ${inr(c.total)}`, `कुल ${inr(c.total)} से ज़्यादा`); return false; }
      const off = liveOffers.find((x) => x.id === v.offer && (!x.plan_id || x.plan_id === p.id)), items = [{ label: `${p.name} membership`, amount: Number(p.price) }];
      if (off && c.discount > 0) items.push({ label: `Offer: ${off.name}`, amount: 0 });
      const inv = await act(() => DB.insert('invoices', { gym_id: gymId(), member_id: m.id, items, ...c, due: addDays(todayISO(), 7) })); if (!inv) return false;
      const upd = await act(() => DB.update('members', m.id, { plan_id: p.id, start_date: v.start, end_date: addDays(addMonths(v.start, p.months), -1), status: 'Active' })); if (!upd) { toast(L('Invoice created but the membership was not updated. Edit the member.', 'इनवॉइस बना पर सदस्यता अपडेट नहीं हुई। सदस्य को बदलें।'), 'bad'); bust(); render(); return true; }
      if (Number(v.pay) > 0) { const pay = await act(() => DB.insert('payments', { gym_id: gymId(), invoice_id: inv.id, member_id: m.id, amount: Number(v.pay), method: v.method })); if (pay) { bust(); render(); receiptModal(pay, m); return true; } }
      toast(L('Membership renewed', 'सदस्यता रिन्यू हुई')); bust(); render(); return true;
    },
  });
  mod.el.addEventListener('input', (e) => { if (e.target.id === 'f_pay') e.target.dataset.touched = '1'; preview(mod.el); }); mod.el.addEventListener('change', (e) => preview(mod.el, e.target.id === 'f_offer' ? 'offer' : e.target.id === 'f_plan' ? 'plan' : '')); preview(mod.el);
}
async function memberModal(id) {
  const [members, plans, visits] = await Promise.all([Q.members(), Q.plans(), Q.visits()]);
  const m = members.find((x) => x.id === id); if (!m) return;
  const [invoices, payments] = isAdmin() ? await Promise.all([Q.invoices(), Q.payments()]) : [[], []];
  const paid = paidByInvoice(payments), mine = invoices.filter((i) => i.member_id === id), s = memberState(m), dl = daysLeft(m), due = sum(mine, (i) => balanceOf(i, paid));
  const vs = visits.filter((v) => v.member_id === id).slice(0, 6), plan = plans.find((p) => p.id === m.plan_id);
  closeAllModals();
  const mod = openModal({
    title: m.name, wide: true,
    body: `<div style="display:flex;gap:14px;align-items:center;margin-bottom:12px">${avatarM(m, true)}<div class="grow"><b>${esc(m.phone || '')}</b><div class="muted">${esc(plan ? plan.name : L('No plan', 'प्लान नहीं'))} · ${esc(m.goal || '')}${m.profile_id ? ' · ' + esc(L('app login linked', 'ऐप लॉगिन जुड़ा')) : ''}</div></div>${badge(s)}</div>
      <div class="tiles" style="margin-bottom:12px">${tile(L('Valid till', 'तारीख़ तक'), esc(fmtDate(m.end_date)), dl == null ? '' : dl >= 0 ? L(`${dl} days left`, `${dl} दिन बाक़ी`) : L(`${-dl} days ago`, `${-dl} दिन पहले`))}${isAdmin() ? tile(L('Dues', 'बकाया'), esc(inr(due)), '', due ? 'var(--crimson)' : '') : ''}</div>
      ${m.notes ? `<p class="muted">${esc(m.notes)}</p>` : ''}
      <h3 style="font-size:13px;margin:10px 0 4px">${esc(L('Recent visits', 'हाल की विज़िट'))}</h3>${vs.length ? `<ul class="list">${vs.map((v) => `<li><div class="grow"><b>${esc(fmtDate(v.in_at))}</b><small>${esc(fmtTime(v.in_at))}${v.out_at ? ' – ' + esc(fmtTime(v.out_at)) : ''}</small></div></li>`).join('')}</ul>` : `<div class="muted">${esc(L('No visits in the last 90 days', 'पिछले 90 दिन में कोई विज़िट नहीं'))}</div>`}
      ${isAdmin() ? `<h3 style="font-size:13px;margin:14px 0 4px">${esc(L('Invoices', 'इनवॉइस'))}</h3>${mine.length ? `<ul class="list">${mine.slice(0, 5).map((i) => `<li class="click" data-act="openInvoice" data-id="${esc(i.id)}"><div class="grow"><b class="num">${esc(i.no)}</b><small>${esc(fmtDate(i.date))}</small></div><span class="num">${esc(inr(i.total))}</span>${badge(invStatus(i, paid))}</li>`).join('')}</ul>` : `<div class="muted">—</div>`}` : ''}`,
    footer: `${waBtnRenew(m).replace('data-stop ', '')}${isAdmin() && !m.profile_id ? `<button type="button" class="btn" data-l>${ic('lock')} ${esc(L('Create login', 'लॉगिन बनाएँ'))}</button>` : ''}<button type="button" class="btn" data-fp>${ic('pulse')} ${esc(L('Diet & workout', 'डाइट / वर्कआउट'))}</button><button type="button" class="btn" data-ph>${ic('plus')} ${esc(L('Photo', 'फ़ोटो'))}</button><input type="file" id="phIn" accept="image/*" hidden><button type="button" class="btn" data-e>${ic('pencil')} ${esc(L('Edit', 'बदलें'))}</button>${isAdmin() ? `<button type="button" class="btn primary" data-r>${esc(L('Renew', 'रिन्यू'))}</button>` : ''}`,
  });
  $('[data-e]', mod.el).onclick = () => { mod.close(); memberForm(id); };
  const phb = $('[data-ph]', mod.el), phIn = $('#phIn', mod.el);
  phb.onclick = () => phIn.click();
  phIn.onchange = async () => { const f = phIn.files[0]; if (!f) return; phb.disabled = true; try { await pickMemberPhoto(m, f, mod); } catch (e) { phb.disabled = CTX.locked; } };
  const fp = $('[data-fp]', mod.el); if (fp) fp.onclick = () => fitPlanModal(id);
  const lg = $('[data-l]', mod.el); if (lg) lg.onclick = () => { mod.close(); accountForm('member', m); };
  const r = $('[data-r]', mod.el); if (r) r.onclick = () => { mod.close(); renewForm(id); };
  if (CTX.locked) { $$('[data-e],[data-r],[data-l],[data-ph]', mod.el).forEach((b) => (b.disabled = true)); }
}

/* ---------- Check-in ---------- */
async function vCheckin() {
  const [members, visits] = await Promise.all([Q.members(), Q.visits()]);
  const today = todayISO(), todays = visits.filter((v) => istDate(v.in_at) === today), open = new Map(todays.filter((v) => !v.out_at).map((v) => [v.member_id, v]));
  const q = U.checkin.q.trim().toLowerCase(), mm = memberMap(members);
  const found = q ? members.filter((m) => m.name.toLowerCase().includes(q) || String(m.phone || '').includes(q)).slice(0, 8) : [];
  return pageHead(L('Floor', 'फ़्लोर'), L('Check-in', 'चेक-इन'), L(`${todays.length} today · ${open.size} inside`, `आज ${todays.length} · अंदर ${open.size}`))
    + `<div class="bar">${searchBox('cq', U.checkin.q, L('Type a name or phone', 'नाम या फ़ोन लिखें'))}</div>`
    + (q ? `<div class="card" style="margin-bottom:14px">${found.length ? `<ul class="list">${found.map((m) => { const s = memberState(m), inV = open.get(m.id), blocked = ['Expired', 'Frozen', 'Cancelled'].includes(s); return `<li>${avatarM(m)}<div class="grow"><b>${esc(m.name)}</b><small>${esc(m.phone || '')} · ${esc(LANG === 'hi' ? STATE_HI[s] : s)}${m.end_date ? ' · ' + esc(fmtShort(m.end_date)) : ''}</small></div>${inV ? `<button class="btn sm" data-act="checkOut" data-id="${esc(inV.id)}">${esc(L('Check out', 'चेक-आउट'))}</button>` : `<button class="btn primary sm" data-act="checkIn" data-id="${esc(m.id)}" ${blocked || CTX.locked ? 'disabled' : ''}>${esc(blocked ? L('Renew first', 'पहले रिन्यू') : L('Check in', 'चेक-इन'))}</button>`}</li>`; }).join('')}</ul>` : empty(L('No match', 'कोई मेल नहीं'), '')}</div>` : '')
    + card(L('Today', 'आज'), 'clock', '', todays.length ? `<ul class="list">${todays.map((v) => `<li><div class="grow"><b>${esc(memberName(mm, v.member_id))}</b><small>${esc(fmtTime(v.in_at))}${v.out_at ? ' – ' + esc(fmtTime(v.out_at)) : ''}</small></div>${v.out_at ? badge(L('Done', 'पूरा'), 'mute') : `<button class="btn sm" data-act="checkOut" data-id="${esc(v.id)}">${esc(L('Check out', 'चेक-आउट'))}</button>`}</li>`).join('')}</ul>` : empty(L('Nobody yet today', 'आज अभी कोई नहीं'), ''));
}

/* ---------- Plans ---------- */
async function vPlans() {
  const [plans, members] = await Promise.all([Q.plans(), Q.members()]);
  const n = (p) => members.filter((m) => m.plan_id === p.id).length;
  return pageHead(L('Setup', 'सेटअप'), L('Plans', 'प्लान'), L('Plans are archived, not deleted, so old invoices stay correct.', 'प्लान हटते नहीं, आर्काइव होते हैं, ताकि पुराने इनवॉइस सही रहें।'), `<button class="btn primary" data-act="newPlan" ${CTX.locked ? 'disabled' : ''}>${ic('plus')} ${esc(L('New plan', 'नया प्लान'))}</button>`)
    + (plans.length ? `<div class="cg">${plans.map((p) => `<div class="card pc${p.status === 'Archived' ? ' off' : ''}"><b>${esc(p.name)}</b><div class="pr">${esc(inr(p.price))}</div><div class="muted">${p.months} ${esc(L('months', 'महीने'))} · GST ${p.gst_pct}%</div><div class="muted">${n(p)} ${esc(L('members', 'सदस्य'))}</div><div class="acts"><button class="btn sm" data-act="editPlan" data-id="${esc(p.id)}" ${CTX.locked ? 'disabled' : ''}>${ic('pencil')} ${esc(L('Edit', 'बदलें'))}</button></div></div>`).join('')}</div>` : `<div class="card">${empty(L('No plans yet', 'अभी कोई प्लान नहीं'), L('Add your membership plans to start billing.', 'बिलिंग शुरू करने के लिए प्लान जोड़ें।'), `<button class="btn primary" data-act="newPlan">${esc(L('New plan', 'नया प्लान'))}</button>`)}</div>`);
}
async function planForm(id) {
  const plans = await Q.plans(), x = id ? plans.find((p) => p.id === id) : null;
  openForm({
    title: x ? x.name : L('New plan', 'नया प्लान'),
    fields: [
      { k: 'name', label: L('Name', 'नाम'), req: true, full: true }, { k: 'months', label: L('Months', 'महीने'), type: 'number', req: true, min: 1, step: 1, def: 1, check: (v) => (v > 60 || !Number.isInteger(v) ? L('Whole months, up to 60', 'पूरे महीने, अधिकतम 60') : '') },
      { k: 'price', label: `${L('Price', 'कीमत')} (₹)`, type: 'number', req: true }, { k: 'gst_pct', label: 'GST %', type: 'number', def: 18, check: (v) => (v > 40 ? L('Up to 40', 'अधिकतम 40') : '') },
      { k: 'status', label: L('Status', 'स्थिति'), type: 'select', options: [{ v: 'Active', l: L('Active', 'सक्रिय') }, { v: 'Archived', l: L('Archived', 'आर्काइव') }], def: x ? x.status : 'Active' },
    ],
    values: x || {},
    onSubmit: async (v) => { const row = { name: v.name, months: v.months, price: v.price, gst_pct: v.gst_pct === '' ? 18 : v.gst_pct, status: v.status }; const ok = await act(() => (x ? DB.update('plans', x.id, row) : DB.insert('plans', { ...row, gym_id: gymId() })), L('Saved', 'सेव हुआ')); if (ok) { bust('plans'); render(); } return !!ok; },
  });
}
