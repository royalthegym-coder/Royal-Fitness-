/* ================= EMI: fixed installment dates for a fee the member already owes =================
   The money stays where it always was: the invoice and its payments. An EMI plan only says how much should be covered by which date.
   Any payment (cash, UPI or online) counts toward the earliest installment that is not covered yet.
   The database works out every state and amount (emi_schedule, emi_create_plan, rz_begin_part). The functions below only split,
   check and display, and they mirror the database rules so the form can show the schedule before anything is saved. */

const EMI_MIN = 2, EMI_MAX = 12, EMI_WINDOW = 62;

/* pure: equal parts in paise, the last part takes the rounding difference (same rule as emi_create_plan) */
function emiSplit(total, count) {
  const paise = Math.round(Number(total) * 100), base = Math.floor(paise / count), out = [];
  for (let i = 1; i <= count; i++) out.push((i < count ? base : paise - base * (count - 1)) / 100);
  return out;
}

/* pure: due date of installment i (1 based) = start + (i-1) months; a day the month does not have becomes its last day (as in Postgres) */
function emiDue(start, i) {
  const [y, m, d] = String(start).split('-').map(Number);
  const t = m - 1 + (i - 1), ty = y + Math.floor(t / 12), tm = ((t % 12) + 12) % 12;
  const last = new Date(Date.UTC(ty, tm + 1, 0)).getUTCDate();
  return `${ty}-${String(tm + 1).padStart(2, '0')}-${String(Math.min(d, last)).padStart(2, '0')}`;
}

/* pure: the whole schedule, for the preview in the form */
function emiPlanPreview(total, count, start) {
  return emiSplit(total, count).map((amount, i) => ({ seq: i + 1, due_on: emiDue(start, i + 1), amount }));
}

/* pure: why a plan cannot be saved yet, '' when it can. Same limits as the database. */
function emiProblem({ total, count, start, today }) {
  const c = Number(count);
  if (!(Number(total) >= 1)) return 'nothing_due';
  if (!Number.isInteger(c) || c < EMI_MIN || c > EMI_MAX) return 'count';
  if (!start || start < today) return 'start_past';
  if (addDays(today, EMI_WINDOW) < start) return 'start_far';
  return '';
}

/* pure: what the member can pay online now for the next unpaid installment (same figure rz_begin_part charges) */
function emiNextPart(rows) {
  const next = (rows || []).find((r) => r.state !== 'paid');
  return next ? round2(Math.max(Number(next.cum_amount) - Number(next.paid_since), 0)) : 0;
}

/* pure: how many installments are paid, and how many are past their date */
function emiCounts(rows) {
  const r = rows || [];
  return { paid: r.filter((x) => x.state === 'paid').length, overdue: r.filter((x) => x.state === 'overdue').length, total: r.length };
}

const EMI_STATE = () => ({ paid: [L('Paid', 'जमा'), 'ok'], overdue: [L('Overdue', 'तारीख़ निकली'), 'bad'], due_today: [L('Due today', 'आज देय'), 'info'], upcoming: [L('Upcoming', 'आगे'), 'mute'] });
const EMI_ERR = () => ({
  nothing_due: L('Nothing is due on this invoice.', 'इस इनवॉइस पर कुछ बकाया नहीं है।'),
  count: L('Choose 2 to 12 installments.', '2 से 12 किस्तें चुनिए।'),
  start_past: L('The first due date cannot be in the past.', 'पहली तारीख़ बीती हुई नहीं हो सकती।'),
  start_far: L('The first due date must be within the next 2 months.', 'पहली तारीख़ अगले 2 महीनों के भीतर होनी चाहिए।'),
});

/* data: read through the database, so the owner sees only their gym and the member only their own plans */
const emiPlans = () => cached('emi_plans', () => DB.select('emi_plans', { eq: { status: 'active' }, order: 'created_at.desc', limit: 500 }));
async function emiSchedules(plans) {
  return Promise.all(plans.map(async (plan) => ({ plan, rows: (await DB.rpc('emi_schedule', { p_invoice: plan.invoice_id }).catch(() => [])) || [] })));
}
const emiMine = () => cached('emi_mine', async () => {
  const plans = (await DB.select('emi_plans', { eq: { status: 'active' }, limit: 50 }).catch(() => [])) || [];
  return (await emiSchedules(plans)).map((x) => ({ invoice_id: x.plan.invoice_id, rows: x.rows }));
});

/* ---------- owner: the EMI page ---------- */
function emiOwnerCard(plan, rows, inv, m, lab) {
  const c = emiCounts(rows);
  const list = `<ul class="list">${rows.map((r) => `<li><div class="grow"><b>${esc(L('Installment ', 'किस्त ') + r.seq)}</b><small>${esc(fmtDate(r.due_on))}</small></div><span class="num">${esc(inr(r.amount))}</span>${lab[r.state] ? badge(lab[r.state][0], lab[r.state][1]) : badge(r.state, 'mute')}</li>`).join('')}</ul>`;
  const warn = c.overdue ? `<p class="muted" style="margin:10px 0 0">${esc(L(`${c.overdue} installment(s) are past their date and not paid.`, `${c.overdue} किस्त तारीख़ निकलने के बाद भी बाकी है।`))}</p>` : '';
  const cancel = `<div style="margin-top:12px"><button type="button" class="btn sm" data-act="emiCancel" data-id="${esc(plan.id)}">${esc(L('Cancel plan', 'योजना रद्द करें'))}</button></div>`;
  const title = `${m ? m.name : '—'} · ${inv ? inv.no || '—' : '—'}`;
  return card(title, 'receipt', badge(L(`${c.paid} of ${c.total} paid`, `${c.total} में ${c.paid} जमा`), 'info'), list + warn + cancel);
}

async function vEmi() {
  const [members, invoices, payments, plans] = await Promise.all([Q.members(), Q.invoices(), Q.payments(), emiPlans()]);
  const mm = memberMap(members), im = new Map(invoices.map((i) => [i.id, i])), lab = EMI_STATE();
  const sched = await emiSchedules(plans);
  const head = pageHead(L('Money', 'पैसा'), L('EMI plans', 'किस्त योजना'), L('Split a fee the member already owes into installments with fixed due dates. Any payment (cash, UPI or online) counts toward the earliest installment that is not covered yet.', 'सदस्य की बकाया फ़ीस को तय तारीख़ों की किस्तों में बाँटिए। कोई भी भुगतान (नकद, UPI या ऑनलाइन) सबसे पहली बिना चुकी किस्त में जुड़ता है।'));
  const top = `<div style="margin:0 0 14px"><button type="button" class="btn primary" data-act="emiNew">${ic('receipt')} ${esc(L('New EMI plan', 'नई किस्त योजना'))}</button></div>`;
  const body = sched.length
    ? `<div class="grid2">${sched.map((x) => emiOwnerCard(x.plan, x.rows, im.get(x.plan.invoice_id), mm.get(x.plan.member_id), lab)).join('')}</div>`
    : empty(L('No EMI plans yet', 'अभी कोई किस्त योजना नहीं'), L('Pick an invoice that is still due and split it into installments.', 'जो इनवॉइस अभी बकाया है, उसे किस्तों में बाँटिए।'));
  return head + top + body;
}

/* owner: new plan. The preview is computed here with the same rules the database uses. */
async function emiForm() {
  const [invoices, payments, plans, members] = await Promise.all([Q.invoices(), Q.payments(), emiPlans(), Q.members()]);
  const paid = paidByInvoice(payments), mm = memberMap(members), planned = new Set(plans.map((p) => p.invoice_id));
  const today = todayISO();
  const open = invoices.filter((i) => !planned.has(i.id) && balanceOf(i, paid) >= 1);
  if (!open.length) { toast(L('No due invoice is without an EMI plan.', 'कोई बकाया इनवॉइस ऐसा नहीं जिस पर किस्त योजना न हो।'), 'bad'); return; }
  const byId = new Map(open.map((i) => [i.id, i]));
  const fields = [
    { k: 'inv', label: L('Invoice', 'इनवॉइस'), type: 'select', req: true, full: true, options: open.map((i) => ({ v: i.id, l: `${i.no || '—'} · ${(mm.get(i.member_id) || {}).name || '—'} · ${inr(balanceOf(i, paid))}` })) },
    { k: 'count', label: L('Number of installments', 'किस्तों की संख्या'), type: 'select', req: true, def: '3', options: Array.from({ length: EMI_MAX - EMI_MIN + 1 }, (_, n) => ({ v: String(n + EMI_MIN), l: String(n + EMI_MIN) })) },
    { k: 'start', label: L('First due date', 'पहली किस्त की तारीख़'), type: 'date', req: true, def: emiDue(today, 2) },
  ];
  const m = openForm({
    title: L('New EMI plan', 'नई किस्त योजना'), submitLabel: L('Create plan', 'योजना बनाएँ'), fields,
    extra: '<div id="emiPrev" style="margin-top:12px"></div>',
    onSubmit: async (v) => {
      const inv = byId.get(v.inv); if (!inv) return false;
      const total = balanceOf(inv, paid), pr = emiProblem({ total, count: v.count, start: v.start, today });
      if (pr) { toast(EMI_ERR()[pr], 'bad'); return false; }
      const ok = await act(() => DB.rpc('emi_create_plan', { p_invoice: v.inv, p_count: Number(v.count), p_start: v.start }), L('EMI plan saved', 'किस्त योजना सेव हुई'));
      if (!ok) return false;
      bust('emi_plans', 'emi_mine'); render(); return true;
    },
  });
  const draw = () => {
    const inv = byId.get($('#f_inv', m.el).value), box = $('#emiPrev', m.el); if (!box) return;
    if (!inv) { box.innerHTML = ''; return; }
    const total = balanceOf(inv, paid), count = Number($('#f_count', m.el).value), start = $('#f_start', m.el).value;
    const pr = emiProblem({ total, count, start, today });
    if (pr) { box.innerHTML = `<p class="muted" style="margin:0">${esc(EMI_ERR()[pr])}</p>`; return; }
    box.innerHTML = `<ul class="list">${emiPlanPreview(total, count, start).map((r) => `<li><div class="grow"><b>${esc(L('Installment ', 'किस्त ') + r.seq)}</b><small>${esc(fmtDate(r.due_on))}</small></div><span class="num">${esc(inr(r.amount))}</span></li>`).join('')}</ul>`;
  };
  m.el.addEventListener('input', draw); m.el.addEventListener('change', draw); draw();
}

async function emiCancelPlan(id) {
  const ok = await askConfirm(L('Cancel this EMI plan? The invoice and the payments already made stay as they are.', 'यह किस्त योजना रद्द करें? इनवॉइस और अब तक के भुगतान जैसे हैं वैसे ही रहेंगे।'), L('Cancel plan', 'योजना रद्द करें'), 'danger');
  if (!ok) return;
  const done = await act(() => DB.rpc('emi_cancel_plan', { p_plan: id }), L('EMI plan cancelled', 'किस्त योजना रद्द हुई'));
  if (done) { bust('emi_plans', 'emi_mine'); render(); }
}

/* ---------- member: installments on the payments page ---------- */
function emiMemberCard(list, invoices, canPay) {
  const lab = EMI_STATE(), im = new Map(invoices.map((i) => [i.id, i]));
  const blocks = (list || []).filter((e) => im.has(e.invoice_id) && e.rows && e.rows.length).map((e) => {
    const inv = im.get(e.invoice_id), c = emiCounts(e.rows), next = emiNextPart(e.rows);
    const rows = e.rows.map((r) => `<li><div class="grow"><b>${esc(L('Installment ', 'किस्त ') + r.seq)}</b><small>${esc(fmtDate(r.due_on))} · ${esc(inr(r.amount))}</small></div>${lab[r.state] ? badge(lab[r.state][0], lab[r.state][1]) : badge(r.state, 'mute')}</li>`).join('');
    const pay = canPay && next >= 1 ? `<div style="margin-top:10px"><button type="button" class="btn sm primary" data-act="payEmi" data-id="${esc(inv.id)}">${esc(L('Pay installment ' + inr(next) + ' online', 'किस्त ' + inr(next) + ' ऑनलाइन भरें'))}</button></div>` : '';
    return `<div style="padding:12px 18px 14px"><div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;align-items:center"><b class="num">${esc(inv.no || '—')}</b><small class="muted">${esc(L(`${c.paid} of ${c.total} paid`, `${c.total} में ${c.paid} जमा`))}</small></div><ul class="list" style="margin-top:6px">${rows}</ul>${pay}</div>`;
  });
  if (!blocks.length) return '';
  return card(L('Installments', 'किस्तें'), 'clock', '', blocks.join(''));
}
