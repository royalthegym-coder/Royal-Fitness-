/* ================= Online fee payment (Razorpay Payment Links) =================
   The member taps "Pay online" on an invoice, the razorpay Edge Function asks Razorpay for a one-time link for the amount DUE right now
   (the database works that out, never the browser), and the member pays on Razorpay's own page. When Razorpay confirms through a signed webhook,
   the database records the payment once, so the usual receipt, ledger, activity log and WhatsApp receipt all happen by themselves.
   Card or UPI details never enter this app. Nothing works until the platform admin switches it on for a gym and the Razorpay keys are set. */
Q.onlineOrders = () => cached('online_orders', () => DB.select('online_orders', { order: 'created_at.desc', limit: 60 }));
Q.rzStatus = () => cached('rz_status', async () => {
  try { const r = await Promise.race([payFn({ action: 'status' }), new Promise((_, rej) => setTimeout(() => rej(new Error('t')), 6000))]); return { known: true, configured: r.configured === true, enabled: r.enabled === true }; } catch (e) { return { known: false, configured: false, enabled: false }; }
});

async function payFn(body) {
  if (SESSION && SESSION.expires_at && SESSION.expires_at - 30 < Date.now() / 1000) await refreshSession();
  const res = await rawFetch('/functions/v1/razorpay', { method: 'POST', headers: { apikey: CFG.key, Authorization: 'Bearer ' + (SESSION && SESSION.access_token), 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const j = await res.json().catch(() => ({}));
  if (res.status === 401) { saveSession(null); if (typeof onSignedOut === 'function') onSignedOut(); throw new ApiError('session expired', 401, 'jwt'); }
  if (!res.ok && !j.error) j.error = 'HTTP ' + res.status;
  return j;
}

/* pure: only ever open a Razorpay link over https (the link text comes from a server, but we still check it) */
function safeRzUrl(u) {
  try { const x = new URL(String(u)); return x.protocol === 'https:' && /(^|\.)(rzp\.io|razorpay\.com)$/i.test(x.hostname) ? x.href : ''; } catch (e) { return ''; }
}
/* pure: numbers for the owner's page. paid_at is a timestamp; the month is the Indian calendar month. */
function onlineSummary(orders, mk) {
  const paid = orders.filter((o) => o.status === 'paid');
  return {
    month: round2(sum(paid.filter((o) => o.paid_at && monthKey(istDate(o.paid_at)) === mk), (o) => Number(o.amount))),
    review: orders.filter((o) => o.status === 'review').length,
    open: orders.filter((o) => o.status === 'created' && o.rz_link_id).length,
    paidCount: paid.length,
  };
}
const PAY_ERR = (c) => ({
  not_enabled: L('Online payment is not switched on for this gym yet.', 'इस जिम के लिए ऑनलाइन पेमेंट अभी चालू नहीं है।'),
  gym_closed: L('This gym’s subscription has ended. Please pay at the gym.', 'इस जिम का सब्सक्रिप्शन ख़त्म है। कृपया जिम में भुगतान करें।'),
  cancelled: L('This invoice was cancelled.', 'यह इनवॉइस रद्द हो चुका है।'),
  nothing_due: L('Nothing is due on this invoice.', 'इस इनवॉइस पर कुछ बकाया नहीं है।'),
  not_found: L('Invoice not found.', 'इनवॉइस नहीं मिला।'),
  not_configured: L('Online payment is not set up yet. Please pay at the gym.', 'ऑनलाइन पेमेंट अभी सेट नहीं हुआ है। कृपया जिम में भुगतान करें।'),
  gateway: L('The payment page could not be created. Try again in a minute.', 'पेमेंट पेज नहीं बन सका। एक मिनट बाद फिर कोशिश करें।'),
}[c] || L('Could not start the payment. Try again.', 'पेमेंट शुरू नहीं हो सका। फिर कोशिश करें।'));

/* pure: label for a payment that is not yet with the gym's own account (Route) */
function routeRowLabel(o, hasAcc) {
  if (o.transfer_status === 'failed') return [L('Failed', 'असफल'), 'bad'];
  if (o.transfer_status === 'routing') return [L('Unknown: check Razorpay first', 'पता नहीं: पहले Razorpay देखें'), 'warn'];
  if (!hasAcc) return [L('Waiting for a linked account', 'linked account का इंतज़ार'), 'mute'];
  return [L('Not sent yet', 'अभी नहीं भेजा'), 'info'];
}

/* part = true pays only the next EMI installment (the database works out the amount); otherwise the full balance */
async function payOnline(invoiceId, part) {
  if (U.rzBusy) return; U.rzBusy = true;
  try {
    let r; try { r = await payFn({ action: 'create', invoice_id: invoiceId, part: part === true }); } catch (e) { toast(friendlyError(e), 'bad'); return; }
    const url = safeRzUrl(r.url);
    if (!url) { toast(PAY_ERR(r.error), 'bad'); return; }
    bust('online_orders', 'emi_mine');
    toast(L('Complete the payment on the Razorpay page. It appears here within a minute after you pay.', 'Razorpay के पेज पर भुगतान पूरा करें। भुगतान के बाद यहाँ एक मिनट में दिख जाएगा।'), 'ok');
    const w = window.open(url, '_blank', 'noopener'); if (!w) location.assign(url);
  } finally { U.rzBusy = false; }
}

const ONLINE_STATUS = () => ({ created: [L('Link open', 'लिंक खुला'), 'info'], paid: [L('Paid', 'भुगतान हुआ'), 'ok'], review: [L('Needs your attention', 'आपका ध्यान चाहिए'), 'bad'], closed: [L('Closed', 'बंद'), 'mute'] });

async function vOnlinePay() {
  const [st, orders, members] = await Promise.all([Q.rzStatus(), Q.onlineOrders().catch(() => []), Q.members()]);
  const mm = memberMap(members), S = onlineSummary(orders, monthKey(todayISO())), lab = ONLINE_STATUS();
  const hook = `${CFG.url}/functions/v1/razorpay`;
  const on = (b, yes, no) => badge(b ? yes : no, b ? 'ok' : 'mute');
  const head = pageHead(L('Money', 'पैसा'), L('Online payments', 'ऑनलाइन भुगतान'), L('Members pay their fee on their phone from the Payments page. The money is recorded here by itself and the usual receipt goes out.', 'सदस्य अपने फ़ोन में भुगतान पेज से फ़ीस भर सकते हैं। रकम अपने-आप यहाँ दर्ज होती है और रसीद चली जाती है।'));
  const status = card(L('Status', 'स्थिति'), 'wallet', st.known ? (st.enabled && st.configured ? badge(L('Working', 'चालू'), 'ok') : badge(L('Not active', 'चालू नहीं'), 'info')) : badge(L('Unknown', 'पता नहीं'), 'mute'),
    `<ul class="list"><li><div class="grow"><b>${esc(L('Switched on for your gym', 'आपके जिम के लिए चालू'))}</b><small>${esc(L('Set by the platform admin. The money goes to the gym’s own Razorpay account once it is linked, otherwise to the platform’s account.', 'प्लेटफ़ॉर्म एडमिन तय करता है। जिम का अपना Razorpay अकाउंट जुड़ने पर रकम वहीं जाती है, नहीं तो प्लेटफ़ॉर्म के अकाउंट में।'))}</small></div>${on(st.enabled, L('Yes', 'हाँ'), L('No', 'नहीं'))}</li>`
    + `<li><div class="grow"><b>${esc(L('Razorpay connected on the server', 'सर्वर पर Razorpay जुड़ा'))}</b><small>${esc(L('The three keys below are saved in Supabase', 'नीचे की तीन चाबियाँ Supabase में सेव हैं'))}</small></div>${on(st.configured, L('Yes', 'हाँ'), L('Not yet', 'अभी नहीं'))}</li></ul>`);
  const tiles = `<div class="tiles" style="margin:14px 0">${tile(L('Received this month', 'इस महीने मिला'), inr(S.month), L(`${S.paidCount} online payments in total`, `कुल ${S.paidCount} ऑनलाइन भुगतान`), 'var(--ok)')}${tile(L('Needs attention', 'ध्यान चाहिए'), String(S.review), L('paid on Razorpay, not recorded', 'Razorpay पर चुकाया, यहाँ दर्ज नहीं'), S.review ? 'var(--crimson)' : '')}${tile(L('Links waiting', 'इंतज़ार में लिंक'), String(S.open), '')}</div>`;
  const steps = card(L('Connect Razorpay (platform admin, one time)', 'Razorpay जोड़ें (प्लेटफ़ॉर्म एडमिन, एक बार)'), 'gear', '',
    `<ol class="muted" style="padding-left:20px;margin:0;display:grid;gap:8px;line-height:1.5">
      <li>${esc(L('Create and verify a Razorpay business account (razorpay.com). Use Test mode first.', 'Razorpay का बिज़नेस अकाउंट बनाइए और वेरिफ़ाई कीजिए (razorpay.com)। पहले Test mode में आज़माइए।'))}</li>
      <li>${esc(L('In Razorpay → Settings → API keys, generate a Key ID and Key Secret.', 'Razorpay → Settings → API keys में Key ID और Key Secret बनाइए।'))}</li>
      <li>${esc(L('In Razorpay → Settings → Webhooks add this URL, choose a secret of your own, and tick the events payment_link.paid, payment_link.expired and payment_link.cancelled:', 'Razorpay → Settings → Webhooks में यह URL जोड़िए, अपना एक secret चुनिए और ये events टिक कीजिए: payment_link.paid, payment_link.expired, payment_link.cancelled:'))}<br><code style="word-break:break-all">${esc(hook)}</code></li>
      <li>${esc(L('In Supabase → Edge Functions → Secrets add RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET and RAZORPAY_WEBHOOK_SECRET (the webhook secret from step 3). Never type these anywhere else.', 'Supabase → Edge Functions → Secrets में RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET और RAZORPAY_WEBHOOK_SECRET (चरण 3 वाला secret) जोड़िए। इन्हें कहीं और मत लिखिए।'))}</li>
      <li>${esc(L('Switch the gym on from Super admin → Gyms → “Online pay”, paste the gym’s linked account id (acc_…) in the same dialog, then pay a small test invoice with a Razorpay test card or UPI.', 'Super admin → Gyms → “Online pay” से जिम चालू कीजिए और उसी डायलॉग में जिम का linked account id (acc_…) डालिए, फिर Razorpay के test कार्ड या UPI से छोटा टेस्ट इनवॉइस चुकाकर देखिए।'))}</li>
    </ol>
    <p class="muted" style="margin:10px 0 0">${esc(L('Razorpay charges its own fee per payment (check current rates). The fee is not added to the member’s bill here; it is taken out of the gym’s share. Switch it on only for a gym whose linked account is set up.', 'Razorpay हर भुगतान पर अपना शुल्क लेता है (ताज़ा दरें देखें)। यह शुल्क यहाँ सदस्य के बिल में नहीं जुड़ता, जिम के हिस्से से कटता है। सिर्फ़ उन्हीं जिम के लिए चालू करें जिनका linked account तैयार है।'))}</p>`);
  const list = card(L('Online payments', 'ऑनलाइन भुगतान'), 'receipt', '', orders.length ? `<ul class="list">${orders.map((o) => { const m = mm.get(o.member_id), [l, tone] = lab[o.status] || [o.status, 'mute']; return `<li><div class="grow"><b>${esc(m ? m.name : '—')}</b><small>${esc(fmtDate(istDate(o.created_at)))} ${esc(fmtTime(o.created_at))}${o.status === 'review' && o.note ? ' · ' + esc(o.note) : ''}</small></div><span class="num">${esc(inr(o.amount))}</span>${badge(l, tone)}</li>`; }).join('')}</ul>${S.review ? `<p class="muted" style="margin:10px 0 0">${esc(L('“Needs your attention” means the member paid on Razorpay but the system could not add it to the invoice (for example it was already paid in cash). Refund it from the Razorpay dashboard, or add the payment by hand.', '“आपका ध्यान चाहिए” का मतलब है कि सदस्य ने Razorpay पर चुकाया पर सिस्टम इसे इनवॉइस में जोड़ नहीं सका (जैसे इनवॉइस पहले ही नकद में चुक गया था)। Razorpay डैशबोर्ड से रिफ़ंड कीजिए या भुगतान हाथ से जोड़िए।'))}</p>` : ''}` : empty(L('No online payments yet', 'अभी कोई ऑनलाइन भुगतान नहीं'), ''));
  return head + status + tiles + list + '<div style="height:14px"></div>' + steps;
}

/* Super admin: the gym's own Razorpay linked account (Route) and the paid payments that still need sending to it */
function routeBox(acc, S, failed, on) {
  const hasAcc = !!acc;
  const sumLine = !S ? '' : hasAcc
    ? L(`Sent to the gym: ${S.sent} (${inr(S.sent_amount)}). Not sent yet: ${S.unrouted}. Waiting for an account: ${S.no_account} (${inr(S.no_account_amount)}). Failed: ${S.failed}. Unknown: ${S.routing}.`, `जिम को भेजा: ${S.sent} (${inr(S.sent_amount)})। अभी नहीं भेजा: ${S.unrouted}। खाते का इंतज़ार: ${S.no_account} (${inr(S.no_account_amount)})। असफल: ${S.failed}। पता नहीं: ${S.routing}।`)
    : L(`No linked account. ${S.no_account} payments (${inr(S.no_account_amount)}) stay in the platform account until one is linked.`, `कोई linked account नहीं। ${S.no_account} भुगतान (${inr(S.no_account_amount)}) खाता जुड़ने तक प्लेटफ़ॉर्म के अकाउंट में हैं।`);
  const warn = on && !hasAcc ? `<div class="note">${esc(L('Online pay is ON but this gym has no linked account, so its share stays in the platform account.', 'ऑनलाइन पेमेंट चालू है पर इस जिम का linked account नहीं है, इसलिए इसका हिस्सा प्लेटफ़ॉर्म के अकाउंट में रहेगा।'))}</div>` : '';
  const rows = failed.map((o) => {
    const [lab, tone] = routeRowLabel(o, hasAcc);
    const retry = hasAcc ? `<button type="button" class="btn sm" data-route-retry data-order="${esc(o.id)}" data-force="${o.transfer_status === 'routing' ? 1 : 0}">${esc(o.transfer_status ? L('Send again', 'फिर भेजें') : L('Send now', 'अभी भेजें'))}</button>` : '';
    return `<li><div class="grow"><b>${esc(o.member_name || '—')}</b><small>${esc(o.paid_at ? fmtDate(istDate(o.paid_at)) : '—')}${o.transfer_error ? ' · ' + esc(o.transfer_error) : ''}</small></div><span class="num">${esc(inr(o.amount))}</span>${badge(lab, tone)} ${retry}</li>`;
  }).join('');
  return `<div style="margin-top:16px"><b>${esc(L('Razorpay linked account (Route)', 'Razorpay linked account (Route)'))}</b>`
    + `<p class="muted" style="margin:6px 0">${esc(L('Paste the acc_ id of this gym’s linked account from Razorpay. Only that public id is saved here. Keys and bank details are never typed in this app.', 'इस जिम के linked account का acc_ id Razorpay से डालिए। यहाँ सिर्फ़ यही सार्वजनिक id सेव होती है। चाबियाँ और बैंक विवरण इस ऐप में कभी नहीं डाले जाते।'))}</p>`
    + `<div style="display:flex;gap:8px;align-items:center"><input id="rzAcc" value="${esc(acc)}" placeholder="acc_XXXXXXXX" autocomplete="off" spellcheck="false" maxlength="45" style="flex:1"><button type="button" class="btn" data-route-save>${esc(L('Save', 'सेव'))}</button></div>`
    + `<p class="muted" style="margin:8px 0 0">${esc(sumLine)}</p>${warn}</div>`
    + (failed.length ? `<h4 style="margin:14px 0 6px">${esc(L('Payments to send to the gym', 'जिम को भेजने वाले भुगतान'))}</h4><ul class="list">${rows}</ul>` : `<p class="muted" style="margin:14px 0 0">${esc(L('Nothing waiting to be sent.', 'भेजने के लिए कुछ बाकी नहीं है।'))}</p>`);
}

/* wires the Save button and the retry buttons of the gym dialog; a retry reloads the dialog so the list is current */
function routeBind(id, m, acc) {
  const save = m.el.querySelector('[data-route-save]');
  if (save) save.onclick = async () => {
    const v = (m.el.querySelector('#rzAcc').value || '').trim();
    if (!v && acc && !(await askConfirm(L('Unlink this gym’s account? Its payments stay in the platform account until you link one again.', 'इस जिम का खाता हटाएँ? खाता दोबारा जुड़ने तक इसके भुगतान प्लेटफ़ॉर्म के अकाउंट में रहेंगे।'), L('Unlink', 'हटाएँ'), 'bad'))) return;
    save.disabled = true;
    const ok = await act(() => DB.rpc('set_route_account', { p_gym: id, p_account: v }), L('Saved', 'सेव हुआ'));
    if (ok) { bust('audit'); m.close(); onlinePayForm(id); } else save.disabled = false;
  };
  $$('[data-route-retry]', m.el).forEach((b) => (b.onclick = async () => {
    const force = b.dataset.force === '1';
    if (!(await askConfirm(force ? L('This payment may already have a transfer. Check the Razorpay dashboard for it first. Send again only if there is none.', 'इस भुगतान का ट्रांसफ़र शायद बन चुका है। पहले Razorpay डैशबोर्ड में देखें। सिर्फ़ तभी फिर भेजें जब कोई ट्रांसफ़र न हो।') : L('Send this payment to the gym’s account now?', 'यह भुगतान अभी जिम के खाते में भेजें?'), L('Send', 'भेजें'), force ? 'bad' : ''))) return;
    b.disabled = true;
    let r; try { r = await payFn({ action: 'route_retry', order_id: b.dataset.order, force }); } catch (e) { toast(friendlyError(e), 'bad'); b.disabled = false; return; }
    if (r && r.ok) toast(L('Sent to Razorpay. The status updates here.', 'Razorpay को भेज दिया गया। स्थिति यहाँ अपडेट होगी।'), 'ok');
    else toast(L('Not sent: ', 'नहीं भेजा: ') + ((r && (r.message || r.error)) || '?'), 'bad');
    bust('audit'); m.close(); onlinePayForm(id);
  }));
}

/* Super admin: switch online payment on or off for one gym */
async function onlinePayForm(id) {
  const g = (await Q.overview()).find((x) => x.gym_id === id); if (!g) return;
  let on = false; try { const r = await DB.select('online_pay', { eq: { gym_id: id } }); on = !!(r[0] && r[0].enabled); } catch (e) { /* treated as off */ }
  let acc = ''; try { const r = await DB.select('gyms', { eq: { id } }); acc = (r[0] && r[0].rz_account_id) || ''; } catch (e) { /* treated as not linked */ }
  const [S, failed] = await Promise.all([DB.rpc('route_summary', { p_gym: id }).catch(() => null), DB.rpc('route_list', { p_gym: id }).catch(() => [])]);
  const routeHtml = routeBox(acc, S, Array.isArray(failed) ? failed : [], on);
  const m = openModal({
    title: `${g.name} · ${L('Online pay', 'ऑनलाइन पेमेंट')}`,
    body: `<p style="margin-top:0">${esc(on ? L('Online payment is ON for this gym.', 'इस जिम के लिए ऑनलाइन पेमेंट चालू है।') : L('Online payment is OFF for this gym.', 'इस जिम के लिए ऑनलाइन पेमेंट बंद है।'))}</p><div class="note">${esc(L('Razorpay keeps its fee on each payment. With a linked account below, the gym’s share goes to the gym’s own account. Without one, the money stays in the platform’s Razorpay account, so switch on only when you are ready to pay that gym out.', 'Razorpay हर भुगतान पर अपना शुल्क काटता है। नीचे linked account डालने पर जिम का हिस्सा उसके अपने अकाउंट में जाता है। न डालने पर रकम प्लेटफ़ॉर्म के Razorpay अकाउंट में रहती है, इसलिए जिम को हिसाब देने के लिए तैयार होने पर ही चालू करें।'))}</div>${routeHtml}`,
    footer: `<button type="button" class="btn ${on ? '' : 'primary'}" data-o="1" ${on ? 'disabled' : ''}>${esc(L('Switch on', 'चालू करें'))}</button><button type="button" class="btn ${on ? 'danger' : ''}" data-o="0" ${on ? '' : 'disabled'}>${esc(L('Switch off', 'बंद करें'))}</button>`,
  });
  $$('[data-o]', m.el).forEach((b) => (b.onclick = async () => {
    b.disabled = true;
    const ok = await act(() => DB.rpc('set_online_pay', { p_gym: id, p_enabled: b.dataset.o === '1' }), L('Saved', 'सेव हुआ'));
    if (ok) { bust('audit', 'rz_status'); m.close(); render(); } else b.disabled = false;
  }));
  routeBind(id, m, acc);
}
