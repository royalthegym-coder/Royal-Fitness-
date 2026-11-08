/* ================= Staff & salary (owner only): who works here, what they earn, what was paid ================= */
const STAFF_JOBS = ['Trainer', 'Manager', 'Receptionist', 'Cleaner', 'Other'];
const STAFF_JOB_HI = { Trainer: 'ट्रेनर', Manager: 'मैनेजर', Receptionist: 'रिसेप्शनिस्ट', Cleaner: 'सफ़ाई', Other: 'अन्य' };
const jobLabel = (j) => (LANG === 'hi' ? STAFF_JOB_HI[j] || j : j);
const PAY_KINDS = [['salary', 'Salary', 'वेतन'], ['advance', 'Advance', 'एडवांस'], ['bonus', 'Bonus', 'बोनस']];
const kindLabel = (k) => { const x = PAY_KINDS.find((q) => q[0] === k); return x ? L(x[1], x[2]) : k; };

Q.staff = () => cached('staff', () => DB.select('staff_members', { order: 'name.asc', limit: 500 }));
Q.salaryPays = () => cached('salary_payments', () => DB.select('salary_payments', { order: 'paid_on.desc,created_at.desc', limit: 5000 }));

U.pay = { m: 'this' };
const payMonthKey = () => { const now = monthKey(todayISO()); return U.pay.m === 'last' ? shiftMonth(now, -1) : U.pay.m === 'prev' ? shiftMonth(now, -2) : now; };
const monthLabel = (mk) => `${MON[Number(mk.slice(5)) - 1]} ${mk.slice(0, 4)}`;

/* one person, one month: what they should get, what was paid (salary + advance), the bonus on top, what is left */
function staffMonth(st, pays, mk) {
  const mine = pays.filter((p) => p.staff_id === st.id && p.month === mk);
  const paid = sum(mine.filter((p) => p.kind !== 'bonus'), (p) => p.amount), bonus = sum(mine.filter((p) => p.kind === 'bonus'), (p) => p.amount);
  const applies = monthKey(st.joined_on) <= mk && (st.active || mine.length > 0), salary = applies ? Number(st.monthly_salary) : 0;
  return { salary, paid, bonus, left: Math.max(0, salary - paid), applies, count: mine.length };
}

async function vStaff() {
  const [staff, pays] = await Promise.all([Q.staff(), Q.salaryPays()]), mk = payMonthKey();
  const rows = staff.map((s) => ({ s, m: staffMonth(s, pays, mk) })).filter((r) => r.m.applies || r.s.active);
  const due = sum(rows, (r) => r.m.salary), paid = sum(rows, (r) => r.m.paid + r.m.bonus), left = sum(rows, (r) => r.m.left);
  const chips = chipsHtml('payM', U.pay.m, [['this', L('This month', 'यह महीना')], ['last', L('Last month', 'पिछला महीना')], ['prev', L('Two months ago', 'दो महीने पहले')]]);
  const status = (m) => (!m.applies ? badge(L('Not started', 'शुरू नहीं'), 'mute') : m.salary === 0 ? badge('—', 'mute') : m.left === 0 ? badge(L('Paid', 'चुकाया'), 'ok') : m.paid > 0 ? badge(L('Part paid', 'आंशिक'), 'warn') : badge(L('Due', 'बाक़ी'), 'bad'));
  const tbl = rows.length
    ? `<div class="tw"><table class="t"><thead><tr><th>${esc(L('Name', 'नाम'))}</th><th class="r">${esc(L('Salary', 'वेतन'))}</th><th class="r">${esc(L('Paid', 'चुकाया'))}</th><th class="r">${esc(L('Left', 'बाक़ी'))}</th><th>${esc(L('Status', 'स्थिति'))}</th><th></th></tr></thead><tbody>${rows.map(({ s, m }) => `<tr${s.active ? '' : ' style="opacity:.6"'}><td><b>${esc(s.name)}</b><small style="display:block;color:var(--muted)">${esc(jobLabel(s.job))}${s.active ? '' : ' · ' + esc(L('inactive', 'बंद'))}${s.phone ? ' · ' + esc(s.phone) : ''}</small></td><td class="r">${inr(m.salary)}</td><td class="r">${inr(m.paid)}${m.bonus ? `<small style="display:block;color:var(--muted)">+ ${esc(L('bonus', 'बोनस'))} ${inr(m.bonus)}</small>` : ''}</td><td class="r">${inr(m.left)}</td><td>${status(m)}</td><td class="r"><div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end">${s.active ? `<button class="btn sm pri" data-act="payStaff" data-id="${esc(s.id)}">${esc(L('Pay', 'भुगतान'))}</button>` : ''}${m.count && s.phone ? `<a class="btn sm" target="_blank" rel="noopener" href="${esc(waLink(s.phone, slipText(s, m, mk)))}">${esc(L('Slip', 'पर्ची'))}</a>` : ''}<button class="btn sm" data-act="staffHist" data-id="${esc(s.id)}">${esc(L('History', 'इतिहास'))}</button><button class="btn sm" data-act="editStaff" data-id="${esc(s.id)}">${esc(L('Edit', 'बदलें'))}</button></div></td></tr>`).join('')}</tbody></table></div>`
    : empty(L('No staff yet', 'अभी कोई स्टाफ़ नहीं'), L('Add trainers and other staff with their monthly salary. Payments you record here are counted in your profit automatically.', 'ट्रेनर और बाक़ी स्टाफ़ को मासिक वेतन के साथ जोड़ें। यहाँ दर्ज भुगतान मुनाफ़े में अपने-आप गिने जाते हैं।'), `<button class="btn pri" data-act="newStaff">${esc(L('Add staff', 'स्टाफ़ जोड़ें'))}</button>`);
  return pageHead(L('Money', 'पैसा'), L('Staff & salary', 'स्टाफ़ और वेतन'), L('Monthly salary, advances and bonuses. Only the owner can see this page.', 'मासिक वेतन, एडवांस और बोनस। यह पेज सिर्फ़ मालिक देख सकता है।'), `<button class="btn pri" data-act="newStaff">${ic('plus')}${esc(L('Add staff', 'स्टाफ़ जोड़ें'))}</button>`)
    + chips + `<p class="muted" style="margin:0 0 10px">${esc(monthLabel(mk))}</p>`
    + `<div class="tiles">${tile(L('Payroll', 'कुल वेतन'), inr(due), L(`${rows.filter((r) => r.m.salary > 0).length} people`, `${rows.filter((r) => r.m.salary > 0).length} लोग`))}${tile(L('Paid', 'चुकाया'), inr(paid), '', 'var(--ok)')}${tile(L('Left to pay', 'देना बाक़ी'), inr(left), '', left ? 'var(--crimson)' : '')}</div>`
    + `<div class="card">${tbl}</div>`;
}
function slipText(s, m, mk) {
  return L(`Salary slip - ${gymName()}\n${s.name}\nMonth: ${monthLabel(mk)}\nSalary: ${inr(m.salary)}\nPaid: ${inr(m.paid)}${m.bonus ? `\nBonus: ${inr(m.bonus)}` : ''}\nBalance: ${inr(m.left)}\nThank you.`, `वेतन पर्ची - ${gymName()}\n${s.name}\nमहीना: ${monthLabel(mk)}\nवेतन: ${inr(m.salary)}\nचुकाया: ${inr(m.paid)}${m.bonus ? `\nबोनस: ${inr(m.bonus)}` : ''}\nबाक़ी: ${inr(m.left)}\nधन्यवाद।`);
}

function staffForm(id) {
  Q.staff().then((staff) => {
    const x = id ? staff.find((s) => s.id === id) : null;
    openForm({
      title: x ? x.name : L('Add staff', 'स्टाफ़ जोड़ें'), values: x ? { ...x, active: x.active ? '1' : '0' } : {},
      fields: [
        { k: 'name', label: L('Name', 'नाम'), req: true, full: true, check: (v) => (v.trim().length > 120 ? L('Up to 120 characters', 'अधिकतम 120 अक्षर') : '') },
        { k: 'job', label: L('Job', 'काम'), type: 'select', options: STAFF_JOBS.map((j) => ({ v: j, l: jobLabel(j) })), def: x ? x.job : 'Trainer' },
        { k: 'phone', label: L('Phone', 'फ़ोन'), type: 'tel', check: (v) => (v && String(v).replace(/\D/g, '').length < 10 ? L('Enter a 10-digit number', '10 अंकों का नंबर डालें') : '') },
        { k: 'monthly_salary', label: L('Monthly salary (₹)', 'मासिक वेतन (₹)'), type: 'number', req: true, min: 0, check: (v) => (v >= 10000000 ? L('Too large', 'बहुत बड़ी रकम') : '') },
        { k: 'joined_on', label: L('Joined on', 'जॉइन की तारीख़'), type: 'date', def: x ? x.joined_on : todayISO() },
        { k: 'active', label: L('Status', 'स्थिति'), type: 'select', options: [{ v: '1', l: L('Working', 'काम कर रहे हैं') }, { v: '0', l: L('Left', 'छोड़ चुके') }], def: x ? (x.active ? '1' : '0') : '1' },
        { k: 'note', label: L('Note', 'नोट'), type: 'textarea', full: true, check: (v) => (v.length > 300 ? L('Up to 300 characters', 'अधिकतम 300 अक्षर') : '') },
      ],
      extra: x ? `<p style="margin:12px 0 0"><button type="button" class="btn sm" data-act="delStaff" data-id="${esc(x.id)}">${esc(L('Delete person', 'व्यक्ति हटाएँ'))}</button></p>` : '',
      onSubmit: async (v) => {
        const row = { name: v.name.trim(), job: v.job, phone: v.phone ? String(v.phone).trim() : null, monthly_salary: v.monthly_salary, joined_on: v.joined_on || todayISO(), active: v.active === '1', note: v.note ? v.note.trim() : null };
        const ok = await act(() => (x ? DB.update('staff_members', x.id, row) : DB.insert('staff_members', { ...row, gym_id: gymId() })), L('Saved', 'सेव हुआ'));
        if (ok) { bust('staff'); render(); } return !!ok;
      },
    });
  });
}
async function deleteStaff(id) {
  const [staff, pays] = await Promise.all([Q.staff(), Q.salaryPays()]), s = staff.find((x) => x.id === id); if (!s) return;
  if (pays.some((p) => p.staff_id === id)) { toast(L('This person has payment history, so it cannot be deleted. Set the status to "Left" instead.', 'इस व्यक्ति का भुगतान इतिहास है, इसलिए हटा नहीं सकते। स्थिति "छोड़ चुके" कर दें।'), 'bad'); return; }
  if (!(await askConfirm(L(`Delete ${s.name}?`, `${s.name} को हटाएँ?`), L('Delete', 'हटाएँ'), 'bad'))) return;
  const ok = await act(() => DB.remove('staff_members', id), L('Deleted', 'हटा दिया'));
  if (ok) { closeAllModals(); bust('staff'); render(); }
}

function salaryForm(id) {
  Promise.all([Q.staff(), Q.salaryPays()]).then(([staff, pays]) => {
    const s = staff.find((x) => x.id === id); if (!s) return;
    const mk = payMonthKey(), m = staffMonth(s, pays, mk);
    openForm({
      title: L(`Pay ${s.name} · ${monthLabel(mk)}`, `${s.name} को भुगतान · ${monthLabel(mk)}`), submitLabel: L('Record payment', 'भुगतान दर्ज करें'),
      fields: [
        { k: 'kind', label: L('Type', 'प्रकार'), type: 'select', options: PAY_KINDS.map((k) => ({ v: k[0], l: L(k[1], k[2]) })), def: 'salary' },
        { k: 'amount', label: L('Amount (₹)', 'रकम (₹)'), type: 'number', req: true, min: 1, def: m.left || '', check: (v, o) => (v >= 10000000 ? L('Too large', 'बहुत बड़ी रकम') : o.kind !== 'bonus' && Number(v) > m.left ? L(`Only ${inr(m.left)} is left for this month. Choose Bonus for extra money.`, `इस महीने सिर्फ़ ${inr(m.left)} बाक़ी है। ज़्यादा देना हो तो "बोनस" चुनें।`) : '') },
        { k: 'method', label: L('Paid by', 'तरीक़ा'), type: 'select', options: PAY_METHODS.map((q) => ({ v: q, l: q })), def: 'Cash' },
        { k: 'paid_on', label: L('Date', 'तारीख़'), type: 'date', def: todayISO(), check: (v) => (v && v > todayISO() ? L('Cannot be in the future', 'आगे की तारीख़ नहीं') : '') },
        { k: 'note', label: L('Note', 'नोट'), full: true, check: (v) => (v.length > 300 ? L('Up to 300 characters', 'अधिकतम 300 अक्षर') : '') },
      ],
      extra: `<p style="margin:12px 0 0;color:var(--muted)">${esc(L('Salary', 'वेतन'))}: <b>${inr(m.salary)}</b> · ${esc(L('paid', 'चुकाया'))}: <b>${inr(m.paid)}</b> · ${esc(L('left', 'बाक़ी'))}: <b>${inr(m.left)}</b></p>`,
      onSubmit: async (v) => {
        const row = { gym_id: gymId(), staff_id: s.id, month: mk, kind: v.kind, amount: v.amount, method: v.method, paid_on: v.paid_on || todayISO(), note: v.note ? v.note.trim() : null };
        const ok = await act(() => DB.insert('salary_payments', row), L(`${inr(v.amount)} paid to ${s.name}`, `${s.name} को ${inr(v.amount)} दिए`));
        if (ok) { bust('salary_payments'); render(); } return !!ok;
      },
    });
  });
}
async function staffHistory(id) {
  const [staff, pays] = await Promise.all([Q.staff(), Q.salaryPays()]), s = staff.find((x) => x.id === id); if (!s) return;
  const mine = pays.filter((p) => p.staff_id === id);
  openModal({ title: L(`${s.name}: payments`, `${s.name}: भुगतान`), body: mine.length ? `<ul class="list">${mine.map((p) => `<li><div class="grow"><b>${esc(kindLabel(p.kind))} · ${esc(monthLabel(p.month))}</b><small>${esc(fmtDate(p.paid_on))} · ${esc(p.method)}${p.note ? ' · ' + esc(p.note) : ''}</small></div><span class="num">${esc(inr(p.amount))}</span><button class="btn sm" data-act="delSalPay" data-id="${esc(p.id)}" aria-label="${esc(L('Delete', 'हटाएँ'))}">${esc(L('Delete', 'हटाएँ'))}</button></li>`).join('')}</ul>` : empty(L('No payments yet', 'अभी कोई भुगतान नहीं'), '') });
}
async function deleteSalaryPay(id) {
  const p = (await Q.salaryPays()).find((x) => x.id === id); if (!p) return;
  if (!(await askConfirm(L(`Delete this ${kindLabel(p.kind)} payment of ${inr(p.amount)}? It is recorded in the audit log.`, `${inr(p.amount)} का ${kindLabel(p.kind)} भुगतान हटाएँ? यह ऑडिट लॉग में दर्ज रहेगा।`), L('Delete', 'हटाएँ'), 'bad'))) return;
  const ok = await act(() => DB.remove('salary_payments', id), L('Deleted', 'हटा दिया'));
  if (ok) { closeAllModals(); bust('salary_payments'); render(); }
}
