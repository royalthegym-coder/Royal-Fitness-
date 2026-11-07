/* ================= Business pages: Expenses (owner only) and Leads (owner + trainers) ================= */
const EXP_CATS = ['Rent', 'Electricity', 'Salary', 'Equipment', 'Maintenance', 'Supplements', 'Marketing', 'Cleaning', 'Other'];
const EXP_CAT_HI = { Rent: 'किराया', Electricity: 'बिजली', Salary: 'वेतन', Equipment: 'उपकरण', Maintenance: 'मरम्मत', Supplements: 'सप्लीमेंट', Marketing: 'प्रचार', Cleaning: 'सफ़ाई', Other: 'अन्य' };
const LEAD_STAGES = ['New', 'Contacted', 'Trial', 'Converted', 'Lost'];
const LEAD_STAGE_HI = { New: 'नया', Contacted: 'संपर्क हुआ', Trial: 'ट्रायल', Converted: 'सदस्य बना', Lost: 'छूट गया' };
const LEAD_SOURCES = ['Walk-in', 'Instagram', 'Facebook', 'Referral', 'Website', 'Other'];
const LEAD_SOURCE_HI = { 'Walk-in': 'सीधे आए', Instagram: 'इंस्टाग्राम', Facebook: 'फ़ेसबुक', Referral: 'रेफ़रल', Website: 'वेबसाइट', Other: 'अन्य' };
const LEAD_TONE = { New: 'info', Contacted: 'warn', Trial: 'warn', Converted: 'ok', Lost: 'mute' };
const catLabel = (c) => (LANG === 'hi' ? EXP_CAT_HI[c] || c : c);
const stageLabel = (s) => (LANG === 'hi' ? LEAD_STAGE_HI[s] || s : s);
const sourceLabel = (s) => (LANG === 'hi' ? LEAD_SOURCE_HI[s] || s : s);

Q.expenses = () => cached('expenses', () => DB.select('expenses', { order: 'spent_on.desc,created_at.desc', limit: 5000 }));
Q.leads = () => cached('leads', () => DB.select('leads', { order: 'created_at.desc', limit: 2000 }));

U.exp = { m: 'this' };
U.lead = { f: 'all', q: '' };

const shiftMonth = (mk, n) => { const [y, m] = mk.split('-').map(Number), d = new Date(Date.UTC(y, m - 1 + n, 1)); return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`; };
/* months included by the chosen range, as a Set of YYYY-MM; null = every month */
function expRange(key) {
  const now = monthKey(todayISO());
  if (key === 'this') return new Set([now]);
  if (key === 'last') return new Set([shiftMonth(now, -1)]);
  if (key === 'q') return new Set([now, shiftMonth(now, -1), shiftMonth(now, -2)]);
  return null;
}

/* ---------- Expenses ---------- */
async function vExpenses() {
  const [exps, pays] = await Promise.all([Q.expenses(), Q.payments()]);
  const rng = expRange(U.exp.m), inR = (d) => !rng || rng.has(monthKey(d));
  const rows = exps.filter((e) => inR(e.spent_on)), got = sum(pays.filter((p) => inR(p.paid_on)), (p) => p.amount), spent = sum(rows, (e) => e.amount), net = got - spent;
  const byCat = EXP_CATS.map((c) => [c, sum(rows.filter((e) => e.category === c), (e) => e.amount)]).filter((x) => x[1] > 0).sort((a, b) => b[1] - a[1]);
  const chips = chipsHtml('expM', U.exp.m, [['this', L('This month', 'यह महीना')], ['last', L('Last month', 'पिछला महीना')], ['q', L('Last 3 months', 'पिछले 3 महीने')], ['all', L('All time', 'पूरा समय')]]);
  const catHtml = byCat.length
    ? `<ul class="list">${byCat.map(([c, a]) => `<li><div class="grow"><b>${esc(catLabel(c))}</b><div class="cbar"><i style="width:${Math.max(3, Math.round((a / spent) * 100))}%"></i></div></div><div class="amt">${inr(a)}</div></li>`).join('')}</ul>`
    : empty(L('No expenses in this period', 'इस अवधि में कोई खर्च नहीं'), '');
  const tbl = rows.length
    ? `<div class="tw"><table class="t"><thead><tr><th>${esc(L('Date', 'तारीख़'))}</th><th>${esc(L('Item', 'मद'))}</th><th>${esc(L('Category', 'श्रेणी'))}</th><th class="r">${esc(L('Amount', 'रकम'))}</th><th></th></tr></thead><tbody>${rows.map((e) => `<tr><td>${esc(fmtDate(e.spent_on))}</td><td><b>${esc(e.item)}</b>${e.note ? `<small style="display:block;color:var(--muted)">${esc(e.note)}</small>` : ''}</td><td>${badge(catLabel(e.category), 'mute')}</td><td class="r">${inr(e.amount)}</td><td class="r"><button class="btn sm" data-act="delExpense" data-id="${esc(e.id)}" aria-label="${esc(L('Delete', 'हटाएँ'))}">${esc(L('Delete', 'हटाएँ'))}</button></td></tr>`).join('')}</tbody></table></div>`
    : empty(L('No expenses yet', 'अभी कोई खर्च नहीं'), L('Add rent, electricity, salaries and other costs to see your real profit.', 'किराया, बिजली, वेतन जैसे खर्च जोड़ें ताकि असली मुनाफ़ा दिखे।'), `<button class="btn pri" data-act="newExpense">${esc(L('Add expense', 'खर्च जोड़ें'))}</button>`);
  return pageHead(L('Money', 'पैसा'), L('Expenses & profit', 'खर्च और मुनाफ़ा'), L('Fees collected minus what you spent. Only the owner can see this page.', 'आई हुई फ़ीस में से खर्च घटाकर मुनाफ़ा। यह पेज सिर्फ़ मालिक देख सकता है।'), `<button class="btn pri" data-act="newExpense">${ic('plus')}${esc(L('Add expense', 'खर्च जोड़ें'))}</button>`)
    + chips
    + `<div class="tiles">${tile(L('Fees collected', 'फ़ीस आई'), inr(got), '', 'var(--ok)')}${tile(L('Expenses', 'खर्च'), inr(spent), L(`${rows.length} entries`, `${rows.length} प्रविष्टियाँ`), 'var(--warn)')}${tile(net >= 0 ? L('Profit', 'मुनाफ़ा') : L('Loss', 'घाटा'), inr(Math.abs(net)), '', net >= 0 ? 'var(--ok)' : 'var(--crimson)')}</div>`
    + `<div class="two">${card(L('Where the money went', 'पैसा कहाँ गया'), 'chart', '', catHtml)}${card(L('All entries', 'सभी प्रविष्टियाँ'), 'receipt', '', tbl)}</div>`;
}
function expenseForm() {
  openForm({
    title: L('Add expense', 'खर्च जोड़ें'),
    fields: [
      { k: 'item', label: L('What was it for?', 'किस काम का खर्च?'), req: true, full: true, ph: L('Electricity bill', 'बिजली का बिल'), check: (v) => (v.trim().length > 120 ? L('Up to 120 characters', 'अधिकतम 120 अक्षर') : '') },
      { k: 'category', label: L('Category', 'श्रेणी'), type: 'select', options: EXP_CATS.map((c) => ({ v: c, l: catLabel(c) })), def: 'Other' },
      { k: 'amount', label: L('Amount (₹)', 'रकम (₹)'), type: 'number', req: true, min: 1, check: (v) => (v >= 100000000 ? L('Too large', 'बहुत बड़ी रकम') : '') },
      { k: 'spent_on', label: L('Date', 'तारीख़'), type: 'date', def: todayISO(), check: (v) => (v && v > todayISO() ? L('Cannot be in the future', 'आगे की तारीख़ नहीं') : '') },
      { k: 'note', label: L('Note', 'नोट'), type: 'textarea', full: true, check: (v) => (v.length > 300 ? L('Up to 300 characters', 'अधिकतम 300 अक्षर') : '') },
    ],
    onSubmit: async (v) => {
      const row = { gym_id: gymId(), item: v.item.trim(), category: v.category, amount: v.amount, spent_on: v.spent_on || todayISO(), note: v.note ? v.note.trim() : null };
      const ok = await act(() => DB.insert('expenses', row), L('Expense saved', 'खर्च सेव हुआ'));
      if (ok) { bust('expenses'); render(); } return !!ok;
    },
  });
}
async function deleteExpense(id) {
  const e = (await Q.expenses()).find((x) => x.id === id); if (!e) return;
  if (!(await askConfirm(L(`Delete "${e.item}" (${inr(e.amount)})?`, `"${e.item}" (${inr(e.amount)}) हटाएँ?`), L('Delete', 'हटाएँ'), 'bad'))) return;
  const ok = await act(() => DB.remove('expenses', id), L('Deleted', 'हटा दिया'));
  if (ok) { bust('expenses'); render(); }
}

/* ---------- Leads ---------- */
const nextStage = (s) => ({ New: 'Contacted', Contacted: 'Trial', Trial: null, Converted: null, Lost: null })[s] || null;
async function vLeads() {
  const leads = await Q.leads(), t = todayISO(), q = U.lead.q.trim().toLowerCase();
  const cnt = (s) => leads.filter((l) => l.stage === s).length, open = leads.filter((l) => !['Converted', 'Lost'].includes(l.stage));
  const due = open.filter((l) => l.follow_up_on && l.follow_up_on <= t);
  const rate = leads.length ? Math.round((cnt('Converted') / leads.length) * 100) : 0;
  let rows = U.lead.f === 'all' ? leads : U.lead.f === 'due' ? due : leads.filter((l) => l.stage === U.lead.f);
  if (q) rows = rows.filter((l) => `${l.name} ${l.phone || ''}`.toLowerCase().includes(q));
  const chips = chipsHtml('leadF', U.lead.f, [['all', L('All', 'सभी'), leads.length], ['due', L('Follow up today', 'आज फ़ॉलो-अप'), due.length], ...LEAD_STAGES.map((s) => [s, stageLabel(s), cnt(s)])]);
  const hello = (l) => L(`Hi ${l.name}, this is ${gymName()}. Thank you for your interest. Would you like to visit for a free trial session?`, `नमस्ते ${l.name}, ${gymName()} से बात कर रहे हैं। हमारे जिम में रुचि दिखाने के लिए धन्यवाद। क्या आप फ़्री ट्रायल के लिए आना चाहेंगे?`);
  const rowHtml = (l) => {
    const nx = nextStage(l.stage), closed = l.stage === 'Converted' || l.stage === 'Lost', over = !closed && l.follow_up_on && l.follow_up_on <= t;
    return `<tr><td><b>${esc(l.name)}</b><small style="display:block;color:var(--muted)">${esc(sourceLabel(l.source))}${l.interest ? ' · ' + esc(l.interest) : ''}</small>${l.note ? `<small style="display:block;color:var(--muted)">${esc(l.note)}</small>` : ''}</td>`
      + `<td>${l.phone ? `<a href="tel:${esc(String(l.phone).replace(/[^\d+]/g, ''))}">${esc(l.phone)}</a>` : '—'}</td>`
      + `<td>${badge(stageLabel(l.stage), LEAD_TONE[l.stage])}</td>`
      + `<td>${l.follow_up_on ? `<span style="${over ? 'color:var(--crimson);font-weight:600' : ''}">${esc(fmtDate(l.follow_up_on))}</span>` : '—'}</td>`
      + `<td class="r"><div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end">`
      + (l.phone && !closed ? `<a class="btn sm" target="_blank" rel="noopener" href="${esc(waLink(l.phone, hello(l)))}">WhatsApp</a>` : '')
      + (nx ? `<button class="btn sm" data-act="leadNext" data-id="${esc(l.id)}">${esc(L('Mark ', 'चुनें: ') + stageLabel(nx))}</button>` : '')
      + (!closed ? `<button class="btn sm pri" data-act="leadConvert" data-id="${esc(l.id)}">${esc(L('Make member', 'सदस्य बनाएँ'))}</button><button class="btn sm" data-act="leadLost" data-id="${esc(l.id)}">${esc(L('Lost', 'छूटा'))}</button>` : '')
      + `<button class="btn sm" data-act="editLead" data-id="${esc(l.id)}">${esc(L('Edit', 'बदलें'))}</button>`
      + (isAdmin() ? `<button class="btn sm" data-act="delLead" data-id="${esc(l.id)}">${esc(L('Delete', 'हटाएँ'))}</button>` : '') + `</div></td></tr>`;
  };
  const tbl = rows.length
    ? `<div class="tw"><table class="t"><thead><tr><th>${esc(L('Lead', 'संभावित सदस्य'))}</th><th>${esc(L('Phone', 'फ़ोन'))}</th><th>${esc(L('Stage', 'चरण'))}</th><th>${esc(L('Follow-up', 'फ़ॉलो-अप'))}</th><th></th></tr></thead><tbody>${rows.map(rowHtml).join('')}</tbody></table></div>`
    : empty(leads.length ? L('Nothing here', 'यहाँ कुछ नहीं') : L('No leads yet', 'अभी कोई लीड नहीं'), leads.length ? '' : L('Write down every enquiry, set a follow-up date, and turn it into a member with one tap.', 'हर पूछताछ लिखें, फ़ॉलो-अप तारीख़ रखें, और एक टैप में सदस्य बनाएँ।'), leads.length ? '' : `<button class="btn pri" data-act="newLead">${esc(L('Add lead', 'लीड जोड़ें'))}</button>`);
  return pageHead(L('Growth', 'विकास'), L('Leads', 'लीड्स'), L('People who asked about joining. Follow up, then convert them to members.', 'जिन्होंने जॉइन करने के बारे में पूछा। फ़ॉलो-अप करें, फिर सदस्य बनाएँ।'), `<button class="btn pri" data-act="newLead">${ic('plus')}${esc(L('Add lead', 'लीड जोड़ें'))}</button>`)
    + `<div class="tiles">${tile(L('Open leads', 'खुली लीड्स'), open.length, '')}${tile(L('Follow up today', 'आज फ़ॉलो-अप'), due.length, due.length ? L('Call them today', 'आज कॉल करें') : '', due.length ? 'var(--crimson)' : '')}${tile(L('Joined', 'सदस्य बने'), cnt('Converted'), L(`${rate}% of all leads`, `सभी लीड्स का ${rate}%`), 'var(--ok)')}</div>`
    + chips
    + `<div class="card" style="margin-bottom:12px"><input class="in" id="leadQ" type="search" placeholder="${esc(L('Search name or phone', 'नाम या फ़ोन खोजें'))}" value="${esc(U.lead.q)}" aria-label="${esc(L('Search leads', 'लीड खोजें'))}"></div>`
    + `<div class="card">${tbl}</div>`;
}
function leadForm(id) {
  Q.leads().then((leads) => {
    const x = id ? leads.find((l) => l.id === id) : null;
    openForm({
      title: x ? x.name : L('Add lead', 'लीड जोड़ें'), values: x || {},
      fields: [
        { k: 'name', label: L('Name', 'नाम'), req: true, full: true, check: (v) => (v.trim().length > 120 ? L('Up to 120 characters', 'अधिकतम 120 अक्षर') : '') },
        { k: 'phone', label: L('Phone', 'फ़ोन'), type: 'tel', check: (v) => (v && String(v).replace(/\D/g, '').length < 10 ? L('Enter a 10-digit number', '10 अंकों का नंबर डालें') : '') },
        { k: 'source', label: L('Where from', 'कहाँ से'), type: 'select', options: LEAD_SOURCES.map((s) => ({ v: s, l: sourceLabel(s) })), def: x ? x.source : 'Walk-in' },
        { k: 'stage', label: L('Stage', 'चरण'), type: 'select', options: LEAD_STAGES.filter((s) => s !== 'Converted' || (x && x.stage === 'Converted')).map((s) => ({ v: s, l: stageLabel(s) })), def: x ? x.stage : 'New' },
        { k: 'follow_up_on', label: L('Follow up on', 'फ़ॉलो-अप तारीख़'), type: 'date' },
        { k: 'interest', label: L('Interested in', 'किसमें रुचि'), full: true, ph: L('Weight loss, 3-month plan', 'वज़न घटाना, 3 महीने का प्लान'), check: (v) => (v.length > 200 ? L('Up to 200 characters', 'अधिकतम 200 अक्षर') : '') },
        { k: 'note', label: L('Note', 'नोट'), type: 'textarea', full: true, check: (v) => (v.length > 500 ? L('Up to 500 characters', 'अधिकतम 500 अक्षर') : '') },
      ],
      onSubmit: async (v) => {
        const row = { name: v.name.trim(), phone: v.phone ? String(v.phone).trim() : null, source: v.source, stage: v.stage, follow_up_on: v.follow_up_on || null, interest: v.interest ? v.interest.trim() : null, note: v.note ? v.note.trim() : null, updated_at: new Date().toISOString() };
        const ok = await act(() => (x ? DB.update('leads', x.id, row) : DB.insert('leads', { ...row, gym_id: gymId() })), L('Saved', 'सेव हुआ'));
        if (ok) { bust('leads'); render(); } return !!ok;
      },
    });
  });
}
async function leadSetStage(id, stage, msg) {
  const ok = await act(() => DB.update('leads', id, { stage, updated_at: new Date().toISOString() }), msg);
  if (ok) { bust('leads'); render(); }
}
async function leadConvert(id) {
  const l = (await Q.leads()).find((x) => x.id === id); if (!l) return;
  /* the lead is marked Converted only after the member really exists */
  await memberForm(null, { name: l.name, phone: l.phone || '', notes: [l.interest, l.note].filter(Boolean).join(' · ') }, async (saved) => {
    await act(() => DB.update('leads', id, { stage: 'Converted', converted_member_id: saved.id, follow_up_on: null, updated_at: new Date().toISOString() }), L('Lead marked as member', 'लीड सदस्य बन गई'));
    bust('leads');
  });
}
async function deleteLead(id) {
  const l = (await Q.leads()).find((x) => x.id === id); if (!l) return;
  if (!(await askConfirm(L(`Delete lead "${l.name}"?`, `लीड "${l.name}" हटाएँ?`), L('Delete', 'हटाएँ'), 'bad'))) return;
  const ok = await act(() => DB.remove('leads', id), L('Deleted', 'हटा दिया'));
  if (ok) { bust('leads'); render(); }
}
document.addEventListener('input', (e) => {
  if (e.target && e.target.id === 'leadQ') { U.lead.q = e.target.value; clearTimeout(window.__leadT); window.__leadT = setTimeout(async () => { const v = $('#view'); if (!v || !$('#leadQ')) return; v.innerHTML = await vLeads(); const i = $('#leadQ'); if (i) { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } }, 200); }
});
