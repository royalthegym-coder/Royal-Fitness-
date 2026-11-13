/* ================= Store reorder list: what to buy again, from the gym's own sales of the last 30 days. Simple rules, no AI. ================= */
/* pure: a product is listed when it is at or below its warning level, or when, at the pace it sold over the last `lookback` days, it runs out within `horizon` days.
   The suggested quantity brings stock up to `horizon` days of sales plus the warning level (at least twice the warning level). Voided sales are ignored. */
function reorderCalc(products, sales, today, horizon = 14, lookback = 30) {
  const since = addDays(today, -(lookback - 1)), sold = new Map();
  sales.filter((s) => !s.voided_at && s.sold_on >= since && s.sold_on <= today).forEach((s) => sold.set(s.product_id, (sold.get(s.product_id) || 0) + Number(s.qty)));
  const rows = products.filter((p) => p.active).map((p) => {
    const units = sold.get(p.id) || 0, perDay = units / lookback, cover = perDay > 0 ? p.stock / perDay : null;
    const need = p.stock <= p.low_at || (cover !== null && cover < horizon);
    const target = Math.max(Math.ceil(perDay * horizon) + p.low_at, p.low_at * 2), qty = Math.max(target - p.stock, 1);
    return { p, units, perDay, cover, qty, need };
  }).filter((r) => r.need);
  return rows.sort((a, b) => (a.p.stock === 0 ? 0 : 1) - (b.p.stock === 0 ? 0 : 1) || (a.cover === null ? 1e9 : a.cover) - (b.cover === null ? 1e9 : b.cover) || (a.p.name < b.p.name ? -1 : 1));
}
const reorderText = (rows, gym) => `नमस्ते, ${gym} के लिए ये सामान चाहिए:\n` + rows.map((r) => `• ${r.p.name} × ${r.qty}`).join('\n') + '\nकृपया रेट और डिलीवरी का समय बताइए।';

function reorderCard(prods, sales, pcost) {
  const rows = reorderCalc(prods, sales, todayISO()); if (!rows.length) return '';
  const est = round2(sum(rows, (r) => r.qty * (pcost.get(r.p.id) || 0))), t = reorderText(rows, gymName());
  const left = (r) => (r.p.stock === 0 ? badge(L('Out of stock', 'स्टॉक ख़त्म'), 'bad') : r.cover === null ? badge(L('Low', 'कम'), 'warn') : badge(L(`~${Math.max(Math.floor(r.cover), 0)} days left`, `लगभग ${Math.max(Math.floor(r.cover), 0)} दिन का स्टॉक`), r.cover < 7 ? 'bad' : 'warn'));
  return `<div style="margin-bottom:14px">${card(L('Reorder list', 'दोबारा मँगाने की सूची'), 'tag', `<a class="btn sm" target="_blank" rel="noopener" href="${esc(waLink('', t))}">${esc(L('Send on WhatsApp', 'WhatsApp पर भेजें'))}</a>`,
    `<ul class="list">${rows.map((r) => `<li><div class="grow"><b>${esc(r.p.name)}</b><small>${esc(L(`${r.p.stock} in stock · sold ${r.units} in 30 days`, `${r.p.stock} स्टॉक में · 30 दिन में ${r.units} बिके`))}</small></div>${left(r)}<span class="num">× ${r.qty}</span></li>`).join('')}</ul>`
    + `<p class="muted" style="margin:10px 0 0">${esc(L('Quantity covers about 14 days of sales plus your warning level.', 'मात्रा लगभग 14 दिन की बिक्री और आपकी चेतावनी सीमा के बराबर है।'))}${est > 0 ? ' ' + esc(L(`Cost about ${inr(est)}.`, `लागत लगभग ${inr(est)}।`)) : ''}</p>`)}</div>`;
}
