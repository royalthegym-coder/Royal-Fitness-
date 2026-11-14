/* ================= Activity log (owner only): every payment, sale and key change, written by the database itself. Read-only: nobody can edit or delete these rows. ================= */
U.act = { f: 'all', n: 200 };
const ACT_GROUPS = [['money', 'Money', 'पैसा'], ['members', 'Members', 'सदस्य'], ['store', 'Store', 'स्टोर'], ['staff', 'Staff', 'स्टाफ़']];
const ACT_WORD = { Active: ['Active', 'सक्रिय'], Frozen: ['Frozen', 'फ़्रीज़'], Cancelled: ['Cancelled', 'रद्द'], salary: ['salary', 'वेतन'], advance: ['advance', 'एडवांस'], bonus: ['bonus', 'बोनस'], true: ['working', 'काम पर'], false: ['left', 'छोड़ा'] };
const ACT_FIELD = { plan: ['plan', 'प्लान'], start_date: ['start date', 'शुरू की तारीख़'], end_date: ['ends on', 'ख़त्म होने की तारीख़'], status: ['status', 'स्थिति'], monthly_salary: ['salary', 'वेतन'], active: ['status', 'स्थिति'], job: ['job', 'काम'], price: ['price', 'क़ीमत'], name: ['name', 'नाम'] };

/* pure: one log row -> its group and a plain sentence in English or Hindi. Unknown actions are shown as they are, never hidden. */
function activityInfo(action, d, hi) {
  d = d || {}; const T = (en, h) => (hi ? h : en), who = d.member || d.name || '—', w = (x) => { const k = String(x); return ACT_WORD[k] ? T(...ACT_WORD[k]) : k; };
  const val = (f, x) => (x === null || x === undefined ? '—' : /date|_on$/.test(f) ? fmtShort(x) : f === 'price' || f === 'monthly_salary' ? inr(x) : w(x));
  const changes = (c) => Object.entries(c || {}).map(([f, v]) => `${T(...(ACT_FIELD[f] || [f, f]))}: ${val(f, v[0])} → ${val(f, v[1])}`).join('; ');
  const A = {
    act_payment_add: ['money', T(`Payment ${inr(d.amount)} received from ${who} (${d.method}), receipt ${d.no}`, `${who} से ${inr(d.amount)} मिले (${d.method}), रसीद ${d.no}`)],
    act_payment_delete: ['money', T(`Payment ${inr(d.amount)} from ${who} deleted, receipt ${d.no}`, `${who} का ${inr(d.amount)} का भुगतान हटाया, रसीद ${d.no}`)],
    act_invoice_add: ['money', T(`Invoice ${d.no} for ${who}, ${inr(d.total)}`, `${who} के लिए इनवॉइस ${d.no}, ${inr(d.total)}`)],
    act_invoice_cancel: ['money', T(`Invoice ${d.no} for ${who} cancelled (${inr(d.total)})`, `${who} का इनवॉइस ${d.no} रद्द (${inr(d.total)})`)],
    act_invoice_delete: ['money', T(`Invoice ${d.no} for ${who} deleted`, `${who} का इनवॉइस ${d.no} हटाया`)],
    act_expense_add: ['money', T(`Expense added: ${d.item}, ${inr(d.amount)} (${d.category})`, `खर्च जोड़ा: ${d.item}, ${inr(d.amount)} (${d.category})`)],
    act_expense_update: ['money', T(`Expense changed: ${d.item}, ${inr(d.was_amount)} → ${inr(d.amount)}`, `खर्च बदला: ${d.item}, ${inr(d.was_amount)} → ${inr(d.amount)}`)],
    act_expense_delete: ['money', T(`Expense deleted: ${d.item}, ${inr(d.amount)}`, `खर्च हटाया: ${d.item}, ${inr(d.amount)}`)],
    act_salary_add: ['money', T(`${w(d.kind)} ${inr(d.amount)} paid to ${d.staff || '—'} for ${d.month}`, `${d.staff || '—'} को ${d.month} का ${w(d.kind)} ${inr(d.amount)} दिया`)],
    act_salary_delete: ['money', T(`${w(d.kind)} ${inr(d.amount)} entry for ${d.staff || '—'} (${d.month}) deleted`, `${d.staff || '—'} का ${d.month} का ${w(d.kind)} ${inr(d.amount)} दर्ज हटाया`)],
    act_member_add: ['members', T(`New member ${d.name}${d.plan ? ', plan ' + d.plan : ''}${d.end_date ? ', till ' + fmtShort(d.end_date) : ''}`, `नया सदस्य ${d.name}${d.plan ? ', प्लान ' + d.plan : ''}${d.end_date ? ', ' + fmtShort(d.end_date) + ' तक' : ''}`)],
    act_member_update: ['members', T(`${d.name}: ${changes(d.changes)}`, `${d.name}: ${changes(d.changes)}`)],
    act_member_delete: ['members', T(`Member ${d.name} deleted`, `सदस्य ${d.name} हटाया`)],
    act_freeze: ['members', T(`${who} frozen from ${fmtShort(d.started_on)}${d.reason ? ' (' + d.reason + ')' : ''}`, `${who} को ${fmtShort(d.started_on)} से फ़्रीज़ किया${d.reason ? ' (' + d.reason + ')' : ''}`)],
    act_unfreeze: ['members', T(`${who} unfrozen, ${d.days_added} days added`, `${who} का फ़्रीज़ हटा, ${d.days_added} दिन जुड़े`)],
    act_sale_add: ['store', T(`Sold ${d.qty} × ${d.product} for ${inr(d.total)} (${d.method})`, `${d.qty} × ${d.product} बेचा, ${inr(d.total)} (${d.method})`)],
    act_sale_void: ['store', T(`Sale cancelled: ${d.qty} × ${d.product} (${inr(d.total)})`, `बिक्री रद्द: ${d.qty} × ${d.product} (${inr(d.total)})`)],
    act_product_add: ['store', T(`Product added: ${d.name}, ${inr(d.price)}`, `प्रोडक्ट जोड़ा: ${d.name}, ${inr(d.price)}`)],
    act_product_update: ['store', T(`${d.name}: ${changes(d.changes)}`, `${d.name}: ${changes(d.changes)}`)],
    act_product_delete: ['store', T(`Product deleted: ${d.name}`, `प्रोडक्ट हटाया: ${d.name}`)],
    act_staff_add: ['staff', T(`Staff added: ${d.name} (${d.job}), salary ${inr(d.monthly_salary)}`, `स्टाफ़ जोड़ा: ${d.name} (${d.job}), वेतन ${inr(d.monthly_salary)}`)],
    act_staff_update: ['staff', T(`${d.name}: ${changes(d.changes)}`, `${d.name}: ${changes(d.changes)}`)],
    act_staff_delete: ['staff', T(`Staff deleted: ${d.name}`, `स्टाफ़ हटाया: ${d.name}`)],
  };
  return A[action] ? { group: A[action][0], text: A[action][1] } : { group: 'other', text: String(action) };
}

async function vActivity() {
  const gid = gymId();
  let rows = [], profs = [];
  [rows, profs] = await Promise.all([DB.select('audit_log', { eq: { gym_id: gid }, filters: { action: 'like.act_*' }, order: 'at.desc', limit: U.act.n }), Q.profiles().catch(() => [])]);
  const pm = new Map(profs.map((p) => [p.id, p.full_name || p.email || '']));
  const hi = LANG === 'hi', items = rows.map((r) => ({ r, ...activityInfo(r.action, r.detail, hi) })), by = (g) => items.filter((x) => x.group === g).length;
  const shown = items.filter((x) => U.act.f === 'all' || x.group === U.act.f);
  const who = (r) => (r.actor ? pm.get(r.actor) || L('Staff login', 'स्टाफ़ लॉगिन') : L('Automatic', 'अपने-आप'));
  const mark = { money: 'ok', members: '', store: 'warn', staff: '', other: '' };
  const list = shown.length
    ? `<ul class="list">${shown.map((x) => `<li><div class="grow"><b>${esc(x.text)}</b><small>${esc(fmtDate(x.r.at))}, ${esc(fmtTime(x.r.at))} · ${esc(who(x.r))}</small></div>${badge(L(...(ACT_GROUPS.find((g) => g[0] === x.group) || ['', 'Other', 'अन्य']).slice(1)), mark[x.group] || '')}</li>`).join('')}</ul>`
    + (rows.length >= U.act.n && U.act.n < 1000 ? `<p style="margin:12px 0 0"><button class="btn" data-act="actMore">${esc(L('Show older', 'पुराना दिखाएँ'))}</button></p>` : '')
    : empty(L('Nothing recorded yet', 'अभी कुछ दर्ज नहीं'), L('Payments, sales and key changes appear here from now on.', 'भुगतान, बिक्री और ज़रूरी बदलाव अब से यहाँ दिखेंगे।'));
  return pageHead(L('Insights', 'इनसाइट'), L('Activity log', 'गतिविधि लॉग'), L('Who did what and when: payments, invoices, sales, expenses, salary, members and staff changes. Recorded by the database itself; it cannot be edited or deleted. Only the owner can see this page.', 'किसने क्या और कब किया: भुगतान, इनवॉइस, बिक्री, खर्च, वेतन, सदस्य और स्टाफ़ के बदलाव। इसे डेटाबेस अपने-आप दर्ज करता है; इसे बदला या हटाया नहीं जा सकता। यह पेज सिर्फ़ मालिक देख सकता है।'),
    `<button class="btn" data-act="actCsv"${shown.length ? '' : ' disabled'}>${ic('list')} CSV</button>`)
    + chipsHtml('actF', U.act.f, [['all', L('All', 'सभी'), items.length], ...ACT_GROUPS.map((g) => [g[0], L(g[1], g[2]), by(g[0])])])
    + `<div class="card">${list}</div>`
    + `<div class="note" style="margin-top:14px">${esc(L('History starts from the day this feature was switched on. Older payments and sales are still on their own pages.', 'इतिहास उस दिन से शुरू है जब यह सुविधा चालू हुई। पुराने भुगतान और बिक्री अपने-अपने पेज पर हैं।'))}</div>`;
}
async function activityCsv() {
  const [rows, profs] = await Promise.all([DB.select('audit_log', { eq: { gym_id: gymId() }, filters: { action: 'like.act_*' }, order: 'at.desc', limit: Math.max(U.act.n, 1000) }), Q.profiles().catch(() => [])]);
  const pm = new Map(profs.map((p) => [p.id, p.full_name || p.email || '']));
  downloadCsv(`activity-${todayISO()}.csv`, [['When (IST)', 'By', 'Type', 'What'], ...rows.map((r) => { const i = activityInfo(r.action, r.detail, LANG === 'hi'); return [`${istDate(r.at)} ${fmtTime(r.at)}`, r.actor ? pm.get(r.actor) || 'staff login' : 'automatic', i.group, i.text]; })]);
}
