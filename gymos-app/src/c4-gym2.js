/* ================= Gym screens, part 2: check-in actions, billing, ledger, retention, peak hours, settings, member portal ================= */
async function doCheckIn(memberId) {
  const r = await act(() => DB.insert('visits', { gym_id: gymId(), member_id: memberId }), L('Checked in', 'चेक-इन हो गया'));
  if (r) { bust('visits'); render(); }
}
async function doCheckOut(visitId) {
  const r = await act(() => DB.update('visits', visitId, { out_at: new Date().toISOString() }), L('Checked out', 'चेक-आउट हो गया'));
  if (r) { bust('visits'); render(); }
}

/* ---------- Invoices ---------- */
async function vInvoices() {
  const [invoices, payments, members] = await Promise.all([Q.invoices(), Q.payments(), Q.members()]);
  const paid = paidByInvoice(payments), mm = memberMap(members), st = U.invoices, q = st.q.trim().toLowerCase();
  const tag = (i) => (isOverdue(i, paid) ? 'Overdue' : invStatus(i, paid));
  const counts = { all: invoices.length }; ['Unpaid', 'Partial', 'Overdue', 'Paid', 'Cancelled'].forEach((s) => (counts[s] = invoices.filter((i) => tag(i) === s).length));
  let rows = invoices.filter((i) => (st.f === 'all' || tag(i) === st.f) && (!q || String(i.no || '').toLowerCase().includes(q) || memberName(mm, i.member_id).toLowerCase().includes(q)));
  const total = rows.length; st.page = Math.min(st.page, Math.max(1, Math.ceil(total / PAGE))); rows = rows.slice((st.page - 1) * PAGE, st.page * PAGE);
  return pageHead(L('Billing', 'बिलिंग'), L('Invoices', 'इनवॉइस'), '', `<button class="btn primary" data-act="newInvoice" ${CTX.locked ? 'disabled' : ''}>${ic('plus')} ${esc(L('New invoice', 'नया इनवॉइस'))}</button>`)
    + `<div class="bar">${searchBox('iq', st.q, L('Invoice no. or member', 'इनवॉइस नंबर या सदस्य'))}</div>`
    + chipsHtml('invF', st.f, [['all', L('All', 'सभी'), counts.all], ...['Unpaid', 'Partial', 'Overdue', 'Paid', 'Cancelled'].map((s) => [s, LANG === 'hi' ? STATE_HI[s] || s : s, counts[s]])])
    + `<div class="card">${rows.length ? `<div class="tw"><table class="t"><thead><tr><th>${esc(L('No.', 'नं.'))}</th><th>${esc(L('Member', 'सदस्य'))}</th><th>${esc(L('Date', 'तारीख़'))}</th><th class="r">${esc(L('Total', 'कुल'))}</th><th class="r">${esc(L('Balance', 'बाक़ी'))}</th><th>${esc(L('Status', 'स्थिति'))}</th></tr></thead><tbody>${rows.map((i) => `<tr class="click" data-act="openInvoice" data-id="${esc(i.id)}"><td class="num"><b>${esc(i.no || '—')}</b></td><td>${esc(memberName(mm, i.member_id))}</td><td class="num">${esc(fmtDate(i.date))}</td><td class="r num">${esc(inr(i.total))}</td><td class="r num">${esc(inr(balanceOf(i, paid)))}</td><td>${badge(tag(i))}</td></tr>`).join('')}</tbody></table></div>${pagerHtml(total, st.page, 'invoices')}` : empty(L('No invoices', 'कोई इनवॉइस नहीं'), '', '')}</div>`;
}
async function invoiceForm(memberId) {
  const [members, plans] = await Promise.all([Q.members(), Q.plans()]);
  if (!members.length) { toast(L('Add a member first.', 'पहले सदस्य जोड़ें।'), 'bad'); return; }
  const mod = openForm({
    title: L('New invoice', 'नया इनवॉइस'),
    fields: [
      { k: 'member', label: L('Member', 'सदस्य'), type: 'select', options: members.map((m) => ({ v: m.id, l: `${m.name} · ${m.phone || ''}` })), def: memberId || members[0].id, full: true },
      { k: 'label', label: L('Item', 'विवरण'), req: true, def: plans[0] ? plans[0].name : '', full: true },
      { k: 'amount', label: `${L('Amount', 'राशि')} (₹)`, type: 'number', req: true, def: plans[0] ? plans[0].price : '' }, { k: 'discount', label: `${L('Discount', 'छूट')} (₹)`, type: 'number', def: 0 },
      { k: 'gst', label: 'GST %', type: 'number', def: 18 }, { k: 'due', label: L('Due date', 'आख़िरी तारीख़'), type: 'date', def: addDays(todayISO(), 7) },
    ],
    extra: `<div class="note" id="iv_sum" style="margin-top:10px"></div>`,
    onSubmit: async (v) => {
      const c = computeInvoice([{ amount: v.amount }], v.discount, v.gst === '' ? 18 : v.gst);
      const ok = await act(() => DB.insert('invoices', { gym_id: gymId(), member_id: v.member, items: [{ label: v.label, amount: Number(v.amount) }], ...c, due: v.due || null }), L('Invoice created', 'इनवॉइस बना'));
      if (ok) { bust('invoices'); render(); } return !!ok;
    },
  });
  const sum2 = () => { const g = (k) => parseFloat($('#f_' + k, mod.el).value) || 0; const c = computeInvoice([{ amount: g('amount') }], g('discount'), $('#f_gst', mod.el).value === '' ? 18 : g('gst')); $('#iv_sum', mod.el).textContent = `${L('Total', 'कुल')} ${inr(c.total)} (GST ${inr(c.gst_amt)})`; };
  mod.el.addEventListener('input', sum2); sum2();
}
async function invoiceModal(id) {
  const [invoices, payments, members] = await Promise.all([Q.invoices(), Q.payments(), Q.members()]);
  const i = invoices.find((x) => x.id === id); if (!i) return;
  const paid = paidByInvoice(payments), bal = balanceOf(i, paid), m = members.find((x) => x.id === i.member_id) || {}, mine = payments.filter((p) => p.invoice_id === id);
  const items = Array.isArray(i.items) ? i.items : [];
  closeAllModals();
  const mod = openModal({
    title: `${L('Invoice', 'इनवॉइस')} ${i.no || ''}`, wide: true,
    body: `<div style="display:flex;justify-content:space-between;gap:10px;margin-bottom:10px"><div><b>${esc(m.name || '—')}</b><div class="muted">${esc(m.phone || '')}</div></div><div style="text-align:right"><div class="num">${esc(fmtDate(i.date))}</div>${badge(isOverdue(i, paid) ? 'Overdue' : invStatus(i, paid))}</div></div>
      <table class="t"><tbody>${items.map((it) => `<tr><td>${esc(it.label)}</td><td class="r num">${Number(it.amount) ? esc(inr(it.amount)) : ''}</td></tr>`).join('')}
      ${Number(i.discount) ? `<tr><td>${esc(L('Discount', 'छूट'))}</td><td class="r num">−${esc(inr(i.discount))}</td></tr>` : ''}
      <tr><td>GST ${Number(i.gst_pct)}%</td><td class="r num">${esc(inr(i.gst_amt))}</td></tr><tr><td><b>${esc(L('Total', 'कुल'))}</b></td><td class="r num"><b>${esc(inr(i.total))}</b></td></tr>
      <tr><td>${esc(L('Balance', 'बाक़ी'))}</td><td class="r num" style="color:${bal ? 'var(--crimson)' : 'inherit'}">${esc(inr(bal))}</td></tr></tbody></table>
      <h3 style="font-size:13px;margin:14px 0 4px">${esc(L('Payments', 'भुगतान'))}</h3>${mine.length ? `<ul class="list">${mine.map((p) => `<li class="click" data-act="openReceipt" data-id="${esc(p.id)}"><div class="grow"><b class="num">${esc(p.no || '—')}</b><small>${esc(fmtDate(p.paid_on))} · ${esc(p.method)}</small></div><span class="num">${esc(inr(p.amount))}</span></li>`).join('')}</ul>` : `<div class="muted">${esc(L('No payments yet', 'अभी कोई भुगतान नहीं'))}</div>`}`,
    footer: `${!i.cancelled && !mine.length ? `<button type="button" class="btn danger" data-c>${esc(L('Cancel invoice', 'इनवॉइस रद्द करें'))}</button>` : ''}${!i.cancelled && bal > 0.004 ? `<button type="button" class="btn primary" data-p>${esc(L('Record payment', 'भुगतान दर्ज करें'))}</button>` : ''}`,
  });
  const c = $('[data-c]', mod.el), p = $('[data-p]', mod.el);
  if (CTX.locked) $$('button[data-c],button[data-p]', mod.el).forEach((b) => (b.disabled = true));
  if (c) c.onclick = async () => { if (!(await askConfirm(L('Cancel this invoice? This cannot be undone.', 'यह इनवॉइस रद्द करें? यह वापस नहीं होगा।'), L('Cancel invoice', 'रद्द करें')))) return; const ok = await act(() => DB.update('invoices', id, { cancelled: true }), L('Cancelled', 'रद्द हुआ')); if (ok) { bust('invoices'); mod.close(); render(); } };
  if (p) p.onclick = () => { mod.close(); payForm(id); };
}

/* ---------- Payments ---------- */
async function payForm(invoiceId) {
  const [invoices, payments, members] = await Promise.all([Q.invoices(), Q.payments(), Q.members()]);
  const i = invoices.find((x) => x.id === invoiceId); if (!i) return;
  const bal = balanceOf(i, paidByInvoice(payments)), m = members.find((x) => x.id === i.member_id) || {};
  openForm({
    title: `${L('Payment', 'भुगतान')} · ${m.name || ''}`,
    fields: [
      { k: 'amount', label: `${L('Amount', 'राशि')} (₹)`, type: 'number', req: true, def: bal, min: 0.01, check: (v) => (v > bal + 0.005 ? L(`More than the balance ${inr(bal)}`, `बाक़ी ${inr(bal)} से ज़्यादा`) : '') },
      { k: 'method', label: L('Method', 'तरीक़ा'), type: 'select', options: opts(['UPI', 'Cash', 'Card', 'Bank']) },
      { k: 'ref', label: L('Reference (UTR / note)', 'रेफ़रेंस (UTR / नोट)'), full: true },
    ],
    submitLabel: L('Save payment', 'भुगतान सेव करें'),
    extra: `<div class="note" style="margin-top:10px">${esc(L('Payments cannot be edited after saving. Check the amount.', 'सेव के बाद भुगतान बदला नहीं जा सकता। राशि जाँच लें।'))}</div>`,
    onSubmit: async (v) => {
      const pay = await act(() => DB.insert('payments', { gym_id: gymId(), invoice_id: invoiceId, member_id: i.member_id, amount: v.amount, method: v.method, ref: v.ref || null }));
      if (!pay) return false;
      bust('payments', 'ledger'); render(); receiptModal(pay, m); return true;
    },
  });
}
function receiptText(p, m) {
  return `🧾 ${gymName()}\nरसीद: ${p.no || '—'}\nसदस्य: ${m.name || ''}\nराशि: ${inr(p.amount)} (${p.method})\nतारीख़: ${fmtDate(p.paid_on || todayISO())}\nधन्यवाद! 💪`;
}
async function vPayments() {
  const [payments, members] = await Promise.all([Q.payments(), Q.members()]);
  const mm = memberMap(members), st = U.payments, q = st.q.trim().toLowerCase();
  let rows = payments.filter((p) => !q || String(p.no || '').toLowerCase().includes(q) || memberName(mm, p.member_id).toLowerCase().includes(q));
  const total = rows.length; st.page = Math.min(st.page, Math.max(1, Math.ceil(total / PAGE))); const all = rows; rows = rows.slice((st.page - 1) * PAGE, st.page * PAGE);
  const mk = monthKey(todayISO());
  return pageHead(L('Billing', 'बिलिंग'), L('Payments', 'भुगतान'), '', `<button class="btn" data-act="payCsv">${ic('down')} CSV</button>`)
    + `<div class="tiles">${tile(L('This month', 'इस महीने'), esc(inr(sum(payments.filter((p) => monthKey(p.paid_on) === mk), (p) => p.amount))))}${tile(L('Payments', 'भुगतान'), payments.length)}</div>`
    + `<div class="bar">${searchBox('pq', st.q, L('Receipt no. or member', 'रसीद नंबर या सदस्य'))}</div>`
    + `<div class="card">${rows.length ? `<div class="tw"><table class="t"><thead><tr><th>${esc(L('No.', 'नं.'))}</th><th>${esc(L('Member', 'सदस्य'))}</th><th>${esc(L('Date', 'तारीख़'))}</th><th>${esc(L('Method', 'तरीक़ा'))}</th><th class="r">${esc(L('Amount', 'राशि'))}</th></tr></thead><tbody>${rows.map((p) => `<tr class="click" data-act="openReceipt" data-id="${esc(p.id)}"><td class="num"><b>${esc(p.no || '—')}</b></td><td>${esc(memberName(mm, p.member_id))}</td><td class="num">${esc(fmtDate(p.paid_on))}</td><td>${esc(p.method)}</td><td class="r num">${esc(inr(p.amount))}</td></tr>`).join('')}</tbody></table></div>${pagerHtml(total, st.page, 'payments')}` : empty(L('No payments', 'कोई भुगतान नहीं'), '')}</div>`;
}
async function exportPayments() {
  const [payments, members] = await Promise.all([Q.payments(), Q.members()]), mm = memberMap(members);
  downloadCsv(`payments-${todayISO()}.csv`, [['No', 'Date', 'Member', 'Method', 'Amount', 'Ref'], ...payments.map((p) => [p.no, p.paid_on, memberName(mm, p.member_id), p.method, p.amount, p.ref || ''])]);
}

/* ---------- Ledger (server-side HMAC chain) ---------- */
async function vLedger() {
  const [rows, members] = await Promise.all([Q.ledger(), Q.members()]);
  const mm = memberMap(members), st = U.ledger, res = st.result;
  const verdict = res === null ? '' : res.length === 0
    ? `<div class="banner ok">${ic('shield')} ${esc(L(`Verified: ${rows.length} sealed entries, the chain is intact and every entry matches its payment.`, `जाँच पूरी: ${rows.length} सील प्रविष्टियाँ, चेन सही है और हर प्रविष्टि भुगतान से मेल खाती है।`))}</div>`
    : `<div class="banner bad">${ic('shield')} ${esc(L(`${res.length} problem(s) found`, `${res.length} गड़बड़ मिली`))}<ul>${res.map((r) => `<li>#${r.seq}: ${esc(r.problem)}</li>`).join('')}</ul></div>`;
  const total = rows.length; st.page = Math.min(st.page, Math.max(1, Math.ceil(total / PAGE)));
  const pageRows = rows.slice((st.page - 1) * PAGE, st.page * PAGE);
  return pageHead(L('Billing', 'बिलिंग'), L('Secure ledger', 'सुरक्षित लेजर'), L('Each payment is sealed on the server with a keyed HMAC-SHA256 chain. Any later change breaks the chain.', 'हर भुगतान सर्वर पर कुंजी वाली HMAC-SHA256 चेन से सील होता है। बाद में कोई बदलाव चेन तोड़ देता है।'),
    `<button class="btn primary" data-act="verifyLedger" ${st.busy ? 'disabled' : ''}>${ic('shield')} ${esc(L('Verify now', 'अभी जाँचें'))}</button><button class="btn" data-act="ledgerCsv">${ic('down')} CSV</button>`)
    + verdict
    + `<div class="card">${rows.length ? `<div class="tw"><table class="t"><thead><tr><th>#</th><th>${esc(L('Receipt', 'रसीद'))}</th><th>${esc(L('Member', 'सदस्य'))}</th><th class="r">${esc(L('Amount', 'राशि'))}</th><th>${esc(L('Seal', 'सील'))}</th></tr></thead><tbody>${pageRows.map((r) => `<tr><td class="num">${r.seq}</td><td class="num">${esc(r.no)}</td><td>${esc(memberName(mm, r.member_id))}</td><td class="r num">${esc(inr(r.amount))}</td><td><small class="hash">${esc(String(r.mac).slice(0, 16))}…</small></td></tr>`).join('')}</tbody></table></div>${pagerHtml(total, st.page, 'ledger')}` : empty(L('No sealed payments yet', 'अभी कोई सील भुगतान नहीं'), '')}</div>`;
}
async function runVerify() {
  U.ledger.busy = true; render();
  try { bust('ledger'); U.ledger.result = await DB.rpc('verify_gym_ledger', { g: gymId() }); } catch (e) { toast(friendlyError(e), 'bad'); } finally { U.ledger.busy = false; render(); }
}
async function exportLedger() {
  const [rows, members] = await Promise.all([Q.ledger(), Q.members()]), mm = memberMap(members);
  downloadCsv(`ledger-${todayISO()}.csv`, [['Seq', 'Receipt', 'Date', 'Member', 'Method', 'Amount', 'MAC'], ...[...rows].reverse().map((r) => [r.seq, r.no, r.paid_on, memberName(mm, r.member_id), r.method, r.amount, r.mac])]);
}

/* ---------- Retention ---------- */
async function vRetention() {
  const [members, visits] = await Promise.all([Q.members(), Q.visits()]);
  const thr = U.retention.thr, last = lastVisitMap(visits), today = todayISO();
  const risky = members.filter((m) => ['Active', 'Expiring'].includes(memberState(m))).map((m) => {
    const lv = last.get(m.id), base = lv || m.joined_on || m.start_date, gone = base ? diffDays(base, today) : 999;
    return { m, lv, gone };
  }).filter((x) => x.gone >= thr && !(x.m.joined_on && !x.lv && diffDays(x.m.joined_on, today) < thr)).sort((a, b) => b.gone - a.gone);
  const msg = (m, gone) => `नमस्ते ${m.name} जी, ${gymName()} से। ${gone >= 90 ? 'काफ़ी दिनों' : gone + ' दिन'} से आप जिम नहीं आए। सब ठीक है? आपका इंतज़ार है, कल आइए! 💪`;
  return pageHead(L('Members', 'सदस्य'), L('At risk of leaving', 'छोड़ने का जोखिम'), L('Active members who have not visited for a while. Visit history covers the last 90 days.', 'सक्रिय सदस्य जो कुछ समय से नहीं आए। विज़िट इतिहास पिछले 90 दिन का है।'),
    `<label class="fl" style="margin:0"><span>${esc(L('Absent for at least (days)', 'कम से कम इतने दिन अनुपस्थित'))}</span><input class="in" id="thr" type="number" min="1" max="30" value="${thr}" data-bind="thr" style="width:90px"></label>`)
    + `<div class="card">${risky.length ? `<ul class="list">${risky.map(({ m, lv, gone }) => `<li class="click" data-act="openMember" data-id="${esc(m.id)}">${avatarM(m)}<div class="grow"><b>${esc(m.name)}</b><small>${lv ? esc(L(`Last visit ${fmtShort(lv)}`, `आख़िरी विज़िट ${fmtShort(lv)}`)) : esc(L('No visit in 90 days', '90 दिन में कोई विज़िट नहीं'))}</small></div>${badge(gone >= 90 ? '90+' : L(`${gone} days`, `${gone} दिन`), gone >= 14 ? 'bad' : 'warn')}<a class="btn wa sm" data-stop target="_blank" rel="noreferrer" href="${esc(waLink(m.phone, msg(m, gone)))}">${ic('msg')}</a></li>`).join('')}</ul>` : empty(L('Nobody is overdue for a visit', 'कोई लंबे समय से अनुपस्थित नहीं'), '')}</div>`;
}

/* ---------- Peak hours ---------- */
async function vPeak() {
  const visits = await Q.visits(), days = Number(U.peak.days), since = Date.now() - days * 864e5;
  const grid = Array.from({ length: 7 }, () => Array(24).fill(0)); let n = 0, max = 0;
  visits.filter((v) => new Date(v.in_at).getTime() >= since).forEach((v) => { const { dow, hour } = istParts(v.in_at); grid[dow][hour]++; n++; });
  grid.forEach((r) => r.forEach((c) => { if (c > max) max = c; }));
  const DN = L('Sun,Mon,Tue,Wed,Thu,Fri,Sat', 'रवि,सोम,मंगल,बुध,गुरु,शुक्र,शनि').split(',');
  const hours = [...Array(24).keys()].filter((h) => h >= 5 && h <= 23);
  const byHour = hours.map((h) => [h, sum(grid, (r) => r[h])]).sort((a, b) => b[1] - a[1]).slice(0, 3).filter((x) => x[1] > 0);
  const hl = (h) => `${h % 12 || 12}${h < 12 ? 'am' : 'pm'}`;
  return pageHead(L('Insights', 'इनसाइट'), L('Peak hours', 'भीड़ के समय'), L(`Check-ins by day and hour (India time), last ${days} days: ${n} visits.`, `दिन और घंटे के हिसाब से चेक-इन (भारतीय समय), पिछले ${days} दिन: ${n} विज़िट।`))
    + chipsHtml('peakD', U.peak.days, [['28', L('28 days', '28 दिन')], ['90', L('90 days', '90 दिन')]])
    + (byHour.length ? `<div class="note" style="margin-bottom:12px">${esc(L('Busiest hours: ', 'सबसे व्यस्त घंटे: '))}${byHour.map((x) => `${hl(x[0])} (${x[1]})`).join(', ')}</div>` : '')
    + `<div class="card" style="overflow:auto;padding:14px"><div class="heat" role="img" aria-label="${esc(L('Peak hours heatmap', 'भीड़ का हीटमैप'))}" style="grid-template-columns:44px repeat(${hours.length},minmax(0,1fr))"><span></span>${hours.map((h) => `<span class="hl">${hl(h)}</span>`).join('')}${[1, 2, 3, 4, 5, 6, 0].map((d) => `<span class="hd">${esc(DN[d])}</span>${hours.map((h) => { const c = grid[d][h]; return `<span class="hc" title="${esc(DN[d])} ${hl(h)}: ${c}"><i style="opacity:${c ? (0.2 + 0.8 * c / max).toFixed(2) : 0}"></i>${c ? `<b>${c}</b>` : ''}</span>`; }).join('')}`).join('')}</div></div>`;
}

/* ---------- Settings / team ---------- */
async function vSettings() {
  const g = CTX.gym || {}; let staff = [];
  try { staff = (await Q.profiles()).filter((p) => p.gym_id === gymId()); } catch (e) {}
  return pageHead(L('Setup', 'सेटअप'), L('Gym settings', 'जिम सेटिंग'), '', `<button class="btn primary" data-act="editGym" ${CTX.locked ? 'disabled' : ''}>${ic('pencil')} ${esc(L('Edit', 'बदलें'))}</button>`)
    + `<div class="grid2">${card(L('Gym', 'जिम'), 'building', '', `<ul class="list"><li><div class="grow"><small>${esc(L('Name', 'नाम'))}</small><b>${esc(g.name || '')}</b></div></li><li><div class="grow"><small>${esc(L('Owner', 'मालिक'))}</small><b>${esc(g.owner_name || '—')}</b></div></li><li><div class="grow"><small>${esc(L('Phone', 'फ़ोन'))}</small><b>${esc(g.phone || '—')}</b></div></li><li><div class="grow"><small>${esc(L('City', 'शहर'))}</small><b>${esc(g.city || '—')}</b></div></li><li><div class="grow"><small>UPI</small><b>${esc(g.upi_id || '—')}</b></div></li><li><div class="grow"><small>${esc(L('Gym timings', 'जिम का समय'))}</small><b>${esc(g.timings || '—')}</b></div></li><li><div class="grow"><small>${esc(L('Subscription valid till', 'सब्सक्रिप्शन की तारीख़'))}</small><b>${esc(fmtDate(g.subscription_ends_on))}</b></div>${CTX.locked ? badge(L('Locked', 'लॉक'), 'bad') : badge(L('Open', 'खुला'), 'ok')}</li></ul>`)}
    ${card(L('Team', 'टीम'), 'users', `<button class="btn sm" data-act="newTrainer" ${CTX.locked ? 'disabled' : ''}>${ic('plus')} ${esc(L('Trainer login', 'ट्रेनर लॉगिन'))}</button>`, staff.length ? `<ul class="list">${staff.map((p) => `<li>${avatar(p.full_name || p.email)}<div class="grow"><b>${esc(p.full_name || p.email || '—')}</b><small>${esc(p.email || '')}</small></div>${badge(roleName(p.role), 'mute')}</li>`).join('')}</ul><div class="muted" style="margin-top:8px">${esc(L('Roles are assigned by the platform admin.', 'भूमिकाएँ प्लेटफ़ॉर्म एडमिन तय करता है।'))}</div>` : empty(L('No team listed', 'टीम सूची में नहीं'), ''))}</div>`;
}
function editGymForm() {
  const g = CTX.gym || {};
  openForm({
    title: L('Edit gym', 'जिम बदलें'), values: { name: g.name, owner: g.owner_name, phone: g.phone, city: g.city, upi: g.upi_id, timings: g.timings || '' },
    fields: [
      { k: 'name', label: L('Gym name', 'जिम का नाम'), req: true, full: true, check: (v) => (v.length < 2 ? L('Too short', 'बहुत छोटा') : '') },
      { k: 'owner', label: L('Owner', 'मालिक') }, { k: 'phone', label: L('Phone', 'फ़ोन'), type: 'tel' }, { k: 'city', label: L('City', 'शहर') },
      { k: 'upi', label: L('Merchant UPI ID', 'मर्चेंट UPI आईडी'), ph: 'name@bank', check: (v) => (v && !UPI_RE.test(v) ? L('Example: name@bank', 'उदाहरण: name@bank') : '') },
      { k: 'timings', label: L('Gym timings', 'जिम का समय'), full: true, ph: L('Mon-Sat 5:30 AM - 10 PM, Sun 6-11 AM', 'सोम-शनि सुबह 5:30 - रात 10, रवि 6-11 सुबह'), check: (v) => (v.length > 200 ? L('Up to 200 characters', 'अधिकतम 200 अक्षर') : '') },
    ],
    onSubmit: async (v) => {
      const ok = await act(() => DB.rpc('admin_update_gym', { gym: gymId(), gym_name: v.name, owner: v.owner || null, phone_no: v.phone || null, city_name: v.city || null, upi: v.upi || null }).then(() => DB.rpc('admin_set_gym_timings', { gym: gymId(), timing_text: v.timings || null })), L('Saved', 'सेव हुआ'));
      if (ok) { await loadContext(); render(); } return !!ok;
    },
  });
}

/* ---------- Create a login (trainer / member) ---------- */
function accountForm(role, member) {
  openForm({
    title: role === 'member' ? `${L('Create login', 'लॉगिन बनाएँ')} · ${member.name}` : L('New trainer login', 'नया ट्रेनर लॉगिन'),
    fields: [
      { k: 'email', label: L('Email', 'ईमेल'), type: 'email', req: true, full: true },
      { k: 'full_name', label: L('Name', 'नाम'), req: role === 'trainer', def: member ? member.name : '', full: true },
    ],
    extra: `<div class="note" style="margin-top:10px">${esc(L('A password is generated and shown once. Share it with the person; they can change it after signing in.', 'पासवर्ड अपने-आप बनता है और एक ही बार दिखता है। उसे व्यक्ति को दीजिए; वह लॉगिन के बाद बदल सकता है।'))}</div>`,
    submitLabel: L('Create login', 'लॉगिन बनाएँ'),
    onSubmit: async (v) => {
      const r = await act(() => createAccount({ email: v.email, full_name: v.full_name, role, member_id: member ? member.id : undefined }));
      if (!r) return false;
      bust('members', 'profiles'); render(); showAccessModal(r, member); return true;
    },
  });
}
function showAccessModal(c, member) {
  const url = location.origin;
  const text = `${gymName()} ऐप\nलिंक: ${url}\nईमेल: ${c.email}\nपासवर्ड: ${c.password}\nलॉगिन के बाद पासवर्ड बदल लें।`;
  const mod = openModal({
    title: L('Login created', 'लॉगिन बन गया'),
    body: `<div class="banner">${esc(L('Copy this now. The password is not shown again.', 'अभी कॉपी कर लें। पासवर्ड दोबारा नहीं दिखेगा।'))}</div><div class="card" style="padding:14px"><div class="muted">${esc(L('Email', 'ईमेल'))}</div><b class="num">${esc(c.email)}</b><div class="muted" style="margin-top:8px">${esc(L('Password', 'पासवर्ड'))}</div><b class="num" style="font-size:18px">${esc(c.password)}</b></div>`,
    footer: `${member && member.phone ? `<a class="btn wa" target="_blank" rel="noreferrer" href="${esc(waLink(member.phone, text))}">${ic('msg')} WhatsApp</a>` : ''}<button type="button" class="btn primary" data-cp>${ic('copy')} ${esc(L('Copy', 'कॉपी'))}</button>`,
  });
  $('[data-cp]', mod.el).onclick = () => copyText(text);
}

/* ---------- Import existing members (paste from Excel / Google Sheets) ---------- */
const normName = (x) => String(x || '').toLowerCase().replace(/[\s·.\-_]+/g, '');
function parseDateCell(x) {
  x = String(x || '').trim(); if (!x) return '';
  let m = x.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/), d, mo, y;
  if (m) { y = +m[1]; mo = +m[2]; d = +m[3]; } else if ((m = x.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/))) { d = +m[1]; mo = +m[2]; y = +m[3]; } else return null;
  const iso = `${y}-${pad(mo)}-${pad(d)}`, back = new Date(Date.UTC(y, mo - 1, d));
  return back.getUTCFullYear() === y && back.getUTCMonth() === mo - 1 && back.getUTCDate() === d ? iso : null;
}
function parseImport(text, plans, existingPhones) {
  const rows = [], errors = [], seen = new Set(), byName = new Map(plans.map((p) => [normName(p.name), p]));
  text.split(/\r?\n/).forEach((line, i) => {
    if (!line.trim()) return;
    const c = line.split(/\t|,|;/).map((x) => x.trim()), n = i + 1;
    if (i === 0 && /^(name|नाम)$/i.test(c[0])) return;
    const name = c[0], phone = String(c[1] || '').replace(/\D/g, '').slice(-10), planTxt = c[2] || '', start = parseDateCell(c[3]);
    if (!name || name.length < 2) { errors.push(L(`Line ${n}: name is missing`, `लाइन ${n}: नाम नहीं है`)); return; }
    if (phone.length !== 10) { errors.push(L(`Line ${n} (${name}): phone must be 10 digits`, `लाइन ${n} (${name}): फ़ोन 10 अंकों का हो`)); return; }
    if (existingPhones.has(phone) || seen.has(phone)) { errors.push(L(`Line ${n} (${name}): this phone is already a member`, `लाइन ${n} (${name}): यह फ़ोन पहले से सदस्य है`)); return; }
    let plan = null; if (planTxt) { plan = byName.get(normName(planTxt)); if (!plan) { errors.push(L(`Line ${n} (${name}): plan "${planTxt}" not found`, `लाइन ${n} (${name}): प्लान "${planTxt}" नहीं मिला`)); return; } }
    if (start === null) { errors.push(L(`Line ${n} (${name}): date must be DD-MM-YYYY`, `लाइन ${n} (${name}): तारीख़ DD-MM-YYYY में हो`)); return; }
    if (plan && !start) { errors.push(L(`Line ${n} (${name}): a plan needs a start date`, `लाइन ${n} (${name}): प्लान के साथ शुरू की तारीख़ चाहिए`)); return; }
    seen.add(phone);
    const row = { name, phone, plan_id: plan ? plan.id : null };
    if (plan) { row.start_date = start; row.end_date = addDays(addMonths(start, plan.months), -1); row.joined_on = start; }
    rows.push(row);
  });
  return { rows, errors };
}
async function importForm() {
  const [plans, members] = await Promise.all([Q.plans(), Q.members()]);
  const phones = new Set(members.map((m) => String(m.phone || '').replace(/\D/g, '').slice(-10)));
  const act2 = plans.filter((p) => p.status === 'Active');
  const mod = openForm({
    title: L('Import existing members', 'पुराने सदस्य इम्पोर्ट करें'),
    wide: true,
    fields: [{ k: 'text', label: L('Paste rows: name, phone, plan, start date', 'पंक्तियाँ चिपकाएँ: नाम, फ़ोन, प्लान, शुरू की तारीख़'), type: 'textarea', req: true, full: true, ph: 'Rahul Sharma, 9876543210, Gym · 3 Months, 01-10-2026' }],
    extra: `<div class="note" style="margin-top:10px">${esc(L('One member per line. Copy straight from Excel or Google Sheets. Plan and date can be left empty. Date format: DD-MM-YYYY. Existing dues are not imported; add an invoice if a member owes money.', 'हर लाइन में एक सदस्य। Excel या Google Sheets से सीधे कॉपी करें। प्लान और तारीख़ खाली छोड़ सकते हैं। तारीख़: DD-MM-YYYY। पुराना बकाया इम्पोर्ट नहीं होता; बकाया हो तो इनवॉइस बनाएँ।'))}<br>${esc(L('Plan names: ', 'प्लान के नाम: '))}${act2.map((p) => esc(p.name)).join(' | ')}</div><div id="imp_res" style="margin-top:10px"></div>`,
    submitLabel: L('Check and import', 'जाँचें और इम्पोर्ट करें'),
    onSubmit: async (v) => {
      const { rows, errors } = parseImport(v.text, plans, phones), out = $('#imp_res', mod.el);
      if (errors.length) { out.innerHTML = `<div class="banner bad"><b>${esc(L(`${errors.length} problem(s). Fix these lines and try again; nothing was imported.`, `${errors.length} गड़बड़। ये लाइनें ठीक करके फिर कोशिश करें; कुछ इम्पोर्ट नहीं हुआ।`))}</b><ul style="margin:6px 0 0;padding-left:18px">${errors.slice(0, 12).map((e) => `<li>${esc(e)}</li>`).join('')}${errors.length > 12 ? `<li>…</li>` : ''}</ul></div>`; return false; }
      if (!rows.length) { out.innerHTML = `<div class="banner bad">${esc(L('No rows found.', 'कोई पंक्ति नहीं मिली।'))}</div>`; return false; }
      if (rows.length > 500) { out.innerHTML = `<div class="banner bad">${esc(L('Import at most 500 members at a time.', 'एक बार में अधिकतम 500 सदस्य।'))}</div>`; return false; }
      const saved = await act(() => DB.insertMany('members', rows.map((r) => ({ ...r, gym_id: gymId() }))));
      if (!saved) return false;
      bust('members'); toast(L(`${rows.length} members imported`, `${rows.length} सदस्य इम्पोर्ट हुए`)); render(); return true;
    },
  });
}

async function exportMembers() {
  const [members, plans, invoices, payments] = await Promise.all([Q.members(), Q.plans(), isAdmin() ? Q.invoices() : [], isAdmin() ? Q.payments() : []]);
  const pm = planMap(plans), dues = duesByMember(invoices, paidByInvoice(payments));
  downloadCsv(`members-${todayISO()}.csv`, [['Name', 'Phone', 'Plan', 'Start', 'End', 'Status', 'Dues', 'Goal', 'Notes'], ...members.map((m) => [m.name, m.phone, (pm.get(m.plan_id) || {}).name || '', m.start_date || '', m.end_date || '', memberState(m), dues.get(m.id) || 0, m.goal || '', m.notes || ''])]);
}
