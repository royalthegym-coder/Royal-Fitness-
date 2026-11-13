/* ================= Revenue forecast: what renewals can bring in over the next 90 days, from the gym's own data. A plain estimate, not AI. ================= */
U.fc = { rate: '70' };
const FC_MONTHS = 6;

/* pure: members with a live membership (not frozen, not cancelled) that ends in 0-30, 31-60, 61-90 days, priced at their current plan (GST included).
   rate = the owner's own guess of how many of them renew (0-100). Nothing here predicts a person; it only adds up what is due and multiplies by that guess. */
function forecastCalc(members, plans, invoices, payments, today, rate) {
  const r = Math.min(Math.max(Number(rate) || 0, 0), 100) / 100, pm = new Map(plans.map((p) => [p.id, p]));
  const priceOf = (m) => { const p = pm.get(m.plan_id); return p ? round2(Number(p.price) * (1 + Number(p.gst_pct || 0) / 100)) : 0; };
  const live = members.filter((m) => m.end_date && m.status !== 'Frozen' && m.status !== 'Cancelled');
  const mk = (from, to) => {
    const rows = live.filter((m) => { const d = diffDays(today, m.end_date); return d >= from && d <= to; }).map((m) => ({ m, price: priceOf(m), end: m.end_date })).sort((a, b) => (a.end < b.end ? -1 : a.end > b.end ? 1 : 0));
    const gross = round2(sum(rows, (x) => x.price));
    return { from, to, rows, count: rows.length, gross, expected: round2(gross * r), noPlan: rows.filter((x) => !x.price).length };
  };
  const buckets = [mk(0, 30), mk(31, 60), mk(61, 90)];
  const gone = live.filter((m) => { const d = diffDays(today, m.end_date); return d < 0 && d >= -30; });
  const paid = new Map(); payments.forEach((p) => paid.set(p.invoice_id, round2((paid.get(p.invoice_id) || 0) + Number(p.amount))));
  const dues = round2(sum(invoices.filter((i) => !i.cancelled), (i) => Math.max(round2(Number(i.total) - (paid.get(i.id) || 0)), 0)));
  const [y, mo] = today.split('-').map(Number), history = [];
  for (let i = FC_MONTHS - 1; i >= 0; i--) { const d = new Date(Date.UTC(y, mo - 1 - i, 1)), key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`; history.push({ mk: key, amt: round2(sum(payments.filter((p) => monthKey(p.paid_on) === key), (p) => Number(p.amount))) }); }
  const full = history.slice(-4, -1), avg3 = full.length ? round2(sum(full, (h) => h.amt) / full.length) : 0;
  return { buckets, winback: { count: gone.length, gross: round2(sum(gone, priceOf)) }, dues, history, avg3, rate: Math.round(r * 100) };
}

async function vForecast() {
  const [members, plans, invoices, payments] = await Promise.all([Q.members(), Q.plans(), Q.invoices(), Q.payments()]);
  const f = forecastCalc(members, plans, invoices, payments, todayISO(), U.fc.rate), b = f.buckets, top = Math.max(1, ...f.history.map((h) => h.amt));
  const names = [L('Next 30 days', 'अगले 30 दिन'), L('31 to 60 days', '31 से 60 दिन'), L('61 to 90 days', '61 से 90 दिन')];
  const mm = (k) => { const [y, m] = k.split('-').map(Number); return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString(LANG === 'hi' ? 'hi-IN' : 'en-IN', { month: 'short', year: '2-digit', timeZone: 'UTC' }); };
  const first = b[0].rows.slice(0, 40);
  return pageHead(L('Insights', 'इनसाइट'), L('Revenue forecast', 'आमदनी का अनुमान'), L('Memberships that end soon, priced at each member’s current plan. It is an estimate from your own data.', 'जिन सदस्यों की मेंबरशिप जल्द ख़त्म हो रही है, उनके मौजूदा प्लान के भाव से। यह आपके अपने डेटा से लगाया अनुमान है।'))
    + `<div class="note" style="margin-bottom:12px">${esc(L('How many of them will renew? Pick your own guess:', 'इनमें से कितने रिन्यू करेंगे? अपना अंदाज़ा चुनें:'))}</div>`
    + chipsHtml('fcRate', U.fc.rate, [['50', '50%'], ['70', '70%'], ['90', '90%'], ['100', '100%']])
    + `<div class="tiles">${tile(L('Expected, next 30 days', 'अपेक्षित, अगले 30 दिन'), inr(b[0].expected), L(`${b[0].count} ending · ${inr(b[0].gross)} if all renew`, `${b[0].count} ख़त्म · सब रिन्यू करें तो ${inr(b[0].gross)}`), 'var(--ok)')}`
    + `${tile(L('Expected, 90 days', 'अपेक्षित, 90 दिन'), inr(sum(b, (x) => x.expected)), L(`${sum(b, (x) => x.count)} memberships`, `${sum(b, (x) => x.count)} मेंबरशिप`))}`
    + `${tile(L('Unpaid dues', 'बाक़ी रकम'), inr(f.dues), L('on open invoices', 'खुले इनवॉइस पर'), f.dues ? 'var(--crimson)' : '')}`
    + `${tile(L('Usual month', 'आम महीना'), inr(f.avg3), L('average of the last 3 full months', 'पिछले 3 पूरे महीनों का औसत'))}</div>`
    + `<div class="grid2">${card(L('Renewals due', 'रिन्यू होने हैं'), 'clock', '', `<ul class="list">${b.map((x, i) => `<li><div class="grow"><b>${esc(names[i])}</b><small>${esc(L(`${x.count} memberships · ${inr(x.gross)} if all renew`, `${x.count} मेंबरशिप · सब रिन्यू करें तो ${inr(x.gross)}`))}${x.noPlan ? ' · ' + esc(L(`${x.noPlan} without a plan, counted as ₹0`, `${x.noPlan} का प्लान नहीं, ₹0 गिना`)) : ''}</small></div><span class="num">${inr(x.expected)}</span></li>`).join('')}`
      + `<li><div class="grow"><b>${esc(L('Ended in the last 30 days', 'पिछले 30 दिन में ख़त्म'))}</b><small>${esc(L(`${f.winback.count} members not renewed yet · ${inr(f.winback.gross)} if they come back`, `${f.winback.count} सदस्य अभी रिन्यू नहीं हुए · लौटें तो ${inr(f.winback.gross)}`))}</small></div></li></ul>`)}`
    + `${card(L('Money collected', 'जमा हुई रकम'), 'wallet', '', `<ul class="list">${f.history.map((h) => `<li><div class="grow"><small>${esc(mm(h.mk))}</small><div style="height:8px;border-radius:4px;background:var(--line);margin-top:4px"><div style="height:8px;border-radius:4px;background:var(--ok);width:${Math.round((h.amt / top) * 100)}%"></div></div></div><span class="num">${inr(h.amt)}</span></li>`).join('')}</ul>`)}</div>`
    + card(L('Who is due in the next 30 days', 'अगले 30 दिन में किसकी बारी'), 'users', '', first.length
      ? `<ul class="list">${first.map((x) => `<li class="click" data-act="openMember" data-id="${esc(x.m.id)}">${avatarM(x.m)}<div class="grow"><b>${esc(x.m.name)}</b><small>${esc(L(`Ends ${fmtShort(x.end)}`, `${fmtShort(x.end)} को ख़त्म`))}</small></div><span class="num">${x.price ? inr(x.price) : '—'}</span></li>`).join('')}</ul>${b[0].rows.length > first.length ? `<p class="muted" style="margin:8px 0 0">${esc(L(`Showing the first ${first.length} of ${b[0].rows.length}.`, `${b[0].rows.length} में से पहले ${first.length} दिखाए।`))}</p>` : ''}`
      : empty(L('Nobody is due in the next 30 days', 'अगले 30 दिन में किसी की मेंबरशिप ख़त्म नहीं हो रही'), ''))
    + `<div class="note" style="margin-top:14px">${esc(L('This is not a promise or an AI prediction. It adds up the plan prices of memberships that end in each period and multiplies by the percentage you chose. Frozen and cancelled members are left out. Prices include GST.', 'यह कोई वादा या AI की भविष्यवाणी नहीं है। यह हर अवधि में ख़त्म होने वाली मेंबरशिप के प्लान की क़ीमत जोड़कर आपके चुने प्रतिशत से गुणा करता है। फ़्रीज़ और रद्द सदस्य शामिल नहीं हैं। क़ीमतों में GST शामिल है।'))}</div>`;
}
