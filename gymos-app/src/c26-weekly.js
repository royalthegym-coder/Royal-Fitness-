/* ================= This week vs last week: the owner's Monday-morning numbers, all from the gym's own data ================= */
/* pure: windows are the last 7 days including today, and the 7 days before that */
function weekStats(members, payments, visits, today) {
  const from = (n) => addDays(today, -n), inW = (d, a, b) => d >= a && d <= b;
  const cur = [from(6), today], prev = [from(13), from(7)];
  const pay = (w) => round2(sum(payments.filter((p) => inW(p.paid_on, w[0], w[1])), (p) => Number(p.amount)));
  const joined = (w) => members.filter((m) => m.joined_on && inW(m.joined_on, w[0], w[1])).length;
  const vis = (w) => visits.filter((v) => inW(istDate(v.in_at), w[0], w[1])).length;
  const people = (w) => new Set(visits.filter((v) => inW(istDate(v.in_at), w[0], w[1])).map((v) => v.member_id)).size;
  const ending = members.filter((m) => m.status === 'Active' && m.end_date && m.end_date >= today && m.end_date <= addDays(today, 7)).length;
  return {
    collected: [pay(cur), pay(prev)], joined: [joined(cur), joined(prev)], visits: [vis(cur), vis(prev)], people: [people(cur), people(prev)], ending,
  };
}
const pctChange = (a, b) => (b > 0 ? Math.round(((a - b) / b) * 100) : null);

async function weeklyCard() {
  const [members, payments, visits, invoices] = await Promise.all([Q.members(), Q.payments(), Q.visits(), Q.invoices()]);
  const t = todayISO(), s = weekStats(members, payments, visits, t), paid = paidByInvoice(payments), dues = sum(invoices, (i) => balanceOf(i, paid));
  const delta = (pair, fmt) => { const c = pctChange(pair[0], pair[1]); const txt = c == null ? L('no data last week', 'पिछले हफ़्ते डेटा नहीं') : `${c > 0 ? '+' : c < 0 ? '−' : ''}${Math.abs(c)}%`; return `<span style="color:${c == null || c === 0 ? 'var(--muted)' : c > 0 ? 'var(--ok)' : 'var(--crimson)'}">${esc(txt)}</span> <span class="muted">${esc(L('vs ' + fmt(pair[1]), 'पिछले हफ़्ते ' + fmt(pair[1])))}</span>`; };
  const plain = (n) => String(n);
  const text = L(`${gymName()}: last 7 days\nCollected ${inr(s.collected[0])} (before: ${inr(s.collected[1])})\nNew members ${s.joined[0]} (before: ${s.joined[1]})\nCheck-ins ${s.visits[0]} by ${s.people[0]} members\nMemberships ending in 7 days: ${s.ending}\nPending dues ${inr(dues)}`, `${gymName()}: पिछले 7 दिन\nवसूली ${inr(s.collected[0])} (पहले: ${inr(s.collected[1])})\nनए सदस्य ${s.joined[0]} (पहले: ${s.joined[1]})\nचेक-इन ${s.visits[0]}, ${s.people[0]} सदस्यों के\n7 दिन में खत्म होने वाली सदस्यताएँ: ${s.ending}\nबकाया ${inr(dues)}`);
  const box = (lab, v, d) => `<div style="min-width:130px;flex:1"><div class="muted" style="font-size:12px">${esc(lab)}</div><div style="font-size:20px;font-weight:700">${v}</div><div style="font-size:12px">${d}</div></div>`;
  return card(L('Last 7 days', 'पिछले 7 दिन'), 'chart', `<a class="btn wa sm" target="_blank" rel="noopener" href="${esc(waLink('', text))}">${esc(L('Share', 'शेयर करें'))}</a>`,
    `<div style="display:flex;gap:14px;flex-wrap:wrap">${box(L('Collected', 'वसूली'), esc(inr(s.collected[0])), delta(s.collected, inr))}${box(L('New members', 'नए सदस्य'), s.joined[0], delta(s.joined, plain))}${box(L('Check-ins', 'चेक-इन'), s.visits[0], delta(s.visits, plain))}${box(L('Members who came', 'आने वाले सदस्य'), s.people[0], delta(s.people, plain))}</div><p class="muted" style="margin:12px 0 0">${esc(L(`${s.ending} memberships end in the next 7 days. Pending dues: ${inr(dues)}.`, `अगले 7 दिन में ${s.ending} सदस्यताएँ खत्म होंगी। कुल बकाया: ${inr(dues)}।`))}</p>`);
}
