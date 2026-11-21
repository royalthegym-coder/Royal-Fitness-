/* ================= AI operator =================
   Every morning the database lists who the owner should call today (supabase/migrations/20261119_operator.sql):
     - leads that are due for a follow-up, or have been quiet for a few days,
     - members whose plan ends in the next 3 days or ended in the last 7,
     - invoices past their due date that still have a balance.
   It only writes proposals. It never sends a message and never changes a lead, member or invoice:
   the owner taps WhatsApp or Call, then marks the row Done or Skipped.
   The rules are plain SQL, so text a lead typed cannot steer it.
   This page reads the proposals, drops the ones that no longer make sense (a lead that became a member, a member who
   renewed, an invoice that was paid) and writes the message draft from the live lead, member or invoice. */
U.op = { f: 'all' };
/* the tables do not exist until the migration is applied: say "being set up" instead of an error,
   and do not ask again for 5 minutes (the dashboard would otherwise send a failing request on every visit) */
let OP_GONE_AT = 0;
const opMissing = (e) => !!e && (e.status === 404 || e.code === 'PGRST205' || e.code === '42P01');
const opGuard = () => { if (Date.now() - OP_GONE_AT < 300000) throw new ApiError('operator tables are not installed', 404, 'PGRST205'); };
const opNote = (e) => { if (opMissing(e)) OP_GONE_AT = Date.now(); throw e; };
Q.opSettings = () => { opGuard(); return cached('opSettings', async () => (await DB.select('operator_settings', { eq: { gym_id: gymId() } }))[0] || null).catch(opNote); };
Q.opActions = () => { opGuard(); return cached('opActions', () => DB.select('operator_actions', { eq: { status: 'proposed' }, order: 'created_at.desc', limit: 300 })).catch(opNote); };

const OP_KIND = { lead_followup: ['Lead follow-up', 'लीड फ़ॉलो-अप', 'info'], expiry_nudge: ['Renewal', 'रिन्यूअल', 'warn'], dues_nudge: ['Dues', 'बकाया', 'bad'] };
const opKindLabel = (k) => { const x = OP_KIND[k]; return x ? L(x[0], x[1]) : String(k); };

/* the proposals that are still true today, each with its display line and message draft */
async function opVisible() {
  const [acts, leads, members, invoices, payments] = await Promise.all([Q.opActions(), freshLeads(), Q.members(), Q.invoices(), Q.payments()]);
  const lm = new Map(leads.map((l) => [l.id, l])), mm = memberMap(members), im = new Map(invoices.map((i) => [i.id, i])), paid = paidByInvoice(payments), today = todayISO(), gym = gymName(), out = [];
  for (const a of acts) {
    if (a.kind === 'lead_followup') {
      const l = lm.get(a.subject_id);
      if (!l || ['Converted', 'Lost'].includes(l.stage) || (l.follow_up_on && l.follow_up_on > today)) continue;   // closed, or rescheduled to a later day
      const idle = Math.max(0, diffDays(istDate(l.updated_at), today));
      out.push({ a, name: l.name, phone: l.phone, memberId: '',
        line: l.follow_up_on ? L(`Follow-up was due ${fmtDate(l.follow_up_on)}`, `फ़ॉलो-अप की तारीख़ ${fmtDate(l.follow_up_on)} थी`) : L(`No contact for ${idle} days`, `${idle} दिन से बात नहीं हुई`),
        msg: L(`Hi ${l.name}, this is ${gym}. You asked about joining us. Would you like to come for a free trial session today or tomorrow?`, `नमस्ते ${l.name}, ${gym} से बात कर रहे हैं। आपने जॉइन करने के बारे में पूछा था। क्या आप आज या कल फ़्री ट्रायल के लिए आना चाहेंगे?`) });
    } else if (a.kind === 'expiry_nudge') {
      const m = mm.get(a.subject_id);
      if (!m || m.end_date !== (a.detail || {}).end_date || ['Cancelled', 'Frozen'].includes(m.status) || m.wa_opt_out) continue;   // renewed, frozen or opted out since
      const left = diffDays(today, m.end_date);
      const when = left > 0 ? L(`ends on ${fmtDate(m.end_date)}`, `${fmtDate(m.end_date)} को खत्म हो रही है`) : left === 0 ? L('ends today', 'आज खत्म हो रही है') : L(`ended on ${fmtDate(m.end_date)}`, `${fmtDate(m.end_date)} को खत्म हो चुकी है`);
      out.push({ a, name: m.name, phone: m.phone, memberId: m.id,
        line: left > 0 ? L(`Plan ends in ${left} ${left === 1 ? 'day' : 'days'} (${fmtDate(m.end_date)})`, `प्लान ${left} दिन में खत्म (${fmtDate(m.end_date)})`) : left === 0 ? L('Plan ends today', 'प्लान आज खत्म हो रहा है') : L(`Plan ended ${-left} ${left === -1 ? 'day' : 'days'} ago`, `प्लान ${-left} दिन पहले खत्म हुआ`),
        msg: L(`Hi ${m.name}, this is ${gym}. Your membership ${when}. Renew to keep your routine going. Reply here and we will sort it out.`, `नमस्ते ${m.name} जी, ${gym} से। आपकी सदस्यता ${when}। रिन्यू करके अपनी नियमितता बनाए रखें। यहीं जवाब दें, हम आगे का काम कर देंगे।`) });
    } else if (a.kind === 'dues_nudge') {
      const inv = im.get(a.subject_id), bal = inv ? balanceOf(inv, paid) : 0;
      if (!inv || bal <= 0.004) continue;   // paid or cancelled since
      const m = mm.get(inv.member_id);
      if (!m || m.status === 'Cancelled' || m.wa_opt_out) continue;
      const late = inv.due ? Math.max(0, diffDays(inv.due, today)) : 0, upi = upiOf();
      out.push({ a, name: m.name, phone: m.phone, memberId: m.id,
        line: L(`${inr(bal)} pending on ${inv.no || 'an invoice'}, ${late} ${late === 1 ? 'day' : 'days'} late`, `${inv.no || 'इनवॉइस'} पर ${inr(bal)} बाक़ी, ${late} दिन की देर`),
        msg: L(`Hi ${m.name}, this is ${gym}. ${inr(bal)} is pending on invoice ${inv.no || ''}, due ${fmtDate(inv.due)}. Please clear it when you can.${upi ? ` UPI: ${upi}` : ''}`, `नमस्ते ${m.name} जी, ${gym} से। इनवॉइस ${inv.no || ''} पर ${inr(bal)} बाक़ी हैं (देय तारीख़ ${fmtDate(inv.due)})। कृपया जमा कर दें।${upi ? ` UPI: ${upi}` : ''}`) });
    }
  }
  return out;
}

function opRowHtml(r, lock) {
  const ph = String(r.phone || '').replace(/[^\d+]/g, ''), canWa = !!indMobile(r.phone);
  return `<li style="flex-wrap:wrap;gap:10px" data-op="${esc(r.a.id)}">${avatar(r.name)}<div class="grow" style="min-width:170px"><b>${esc(r.name)}</b> ${badge(opKindLabel(r.a.kind), OP_KIND[r.a.kind] ? OP_KIND[r.a.kind][2] : 'mute')}<small style="display:block">${esc(r.line)}</small></div>`
    + `<div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end">`
    + (canWa ? `<a class="btn wa sm" target="_blank" rel="noopener" href="${esc(waLink(r.phone, r.msg))}">WhatsApp</a>` : '')
    + (ph ? `<a class="btn sm" href="tel:${esc(ph)}">${esc(L('Call', 'कॉल'))}</a>` : '')
    + (r.memberId ? `<button class="btn sm" data-act="openMember" data-id="${esc(r.memberId)}">${esc(L('Open', 'खोलें'))}</button>` : '')
    + `<button class="btn sm pri" data-act="opDone" data-id="${esc(r.a.id)}"${lock}>${esc(L('Done', 'हो गया'))}</button><button class="btn sm" data-act="opSkip" data-id="${esc(r.a.id)}"${lock}>${esc(L('Skip', 'छोड़ें'))}</button></div></li>`;
}

async function vOperator() {
  const lock = CTX.locked ? ' disabled' : '';
  const head = (acts) => pageHead(L('Insights', 'इनसाइट'), L('AI operator', 'AI ऑपरेटर'), L('Lists who to call today. It follows fixed rules and sends nothing by itself: you tap WhatsApp or Call.', 'आज किसे कॉल करना है, यह बताता है। यह तय नियमों से चलता है और खुद कोई संदेश नहीं भेजता: आप WhatsApp या कॉल दबाते हैं।'), acts || '');
  let st, rows;
  try { [st, rows] = await Promise.all([Q.opSettings(), opVisible()]); }
  catch (e) {
    if (!opMissing(e)) throw e;
    return head() + `<div class="card">${empty(L('Being set up', 'सेटअप हो रहा है'), L('The operator is not switched on for the app yet. Please check back soon.', 'ऑपरेटर अभी ऐप में चालू नहीं हुआ है। कृपया थोड़ी देर बाद देखें।'))}</div>`;
  }
  const settingsBtn = `<button class="btn" data-act="opSettings"${lock}>${ic('gear')} ${esc(L('Settings', 'सेटिंग'))}</button>`;
  if (!st || !st.enabled) {
    return head(!st ? '' : settingsBtn) + card(L('What it does', 'यह क्या करता है'), 'pulse', '', `<ul class="list">
      <li><div class="grow"><b>${esc(L('Leads to follow up', 'फ़ॉलो-अप वाले लीड्स'))}</b><small>${esc(L('Follow-up date reached, or no contact for a few days.', 'फ़ॉलो-अप की तारीख़ आ गई, या कुछ दिन से बात नहीं हुई।'))}</small></div></li>
      <li><div class="grow"><b>${esc(L('Memberships ending', 'खत्म होती सदस्यता'))}</b><small>${esc(L('Plan ends in 3 days, or ended in the last 7.', 'प्लान 3 दिन में खत्म, या पिछले 7 दिन में खत्म हुआ।'))}</small></div></li>
      <li><div class="grow"><b>${esc(L('Overdue payments', 'देय तारीख़ निकल चुके बकाया'))}</b><small>${esc(L('Invoices past the due date with money still pending.', 'देय तारीख़ के बाद भी जिन इनवॉइस पर पैसा बाक़ी है।'))}</small></div></li></ul>
      <div style="padding:14px 18px 18px"><p class="muted" style="margin:0 0 12px">${esc(L('Every morning it makes one short list. Nothing is sent by itself.', 'हर सुबह यह एक छोटी सूची बनाता है। कुछ भी अपने आप नहीं भेजा जाता।'))}</p>
      <button class="btn primary" data-act="opSettings"${lock}>${esc(L('Turn on', 'चालू करें'))}</button></div>`);
  }
  const f = U.op.f, cnt = (k) => rows.filter((r) => r.a.kind === k).length, shown = f === 'all' ? rows : rows.filter((r) => r.a.kind === f);
  return head(`<button class="btn" data-act="opScan"${lock}>${esc(L('Scan now', 'अभी जाँचें'))}</button>${settingsBtn}`)
    + chipsHtml('opF', f, [['all', L('All', 'सभी'), rows.length], ['lead_followup', opKindLabel('lead_followup'), cnt('lead_followup')], ['expiry_nudge', opKindLabel('expiry_nudge'), cnt('expiry_nudge')], ['dues_nudge', opKindLabel('dues_nudge'), cnt('dues_nudge')]])
    + `<div class="card">${shown.length ? `<ul class="list">${shown.map((r) => opRowHtml(r, lock)).join('')}</ul>` : empty(rows.length ? L('Nothing in this group', 'इस समूह में कुछ नहीं') : L('All clear for today', 'आज के लिए सब ठीक है'), rows.length ? '' : L('Nobody needs a call right now. It checks again every morning around 8:50.', 'अभी किसी को कॉल की ज़रूरत नहीं। यह हर सुबह करीब 8:50 बजे फिर जाँचता है।'))}</div>`
    + `<p class="muted" style="margin:12px 2px">${esc(L('Items you finish or skip do not come back straight away.', 'जो काम आप पूरा करें या छोड़ें, वे तुरंत वापस नहीं आते।'))}</p>`;
}

const OP_BUSY = new Set();
async function opDecide(id, status) {
  if (!id || OP_BUSY.has(id)) return;   // a double tap must not decide twice
  OP_BUSY.add(id);
  try {
    await act(() => DB.rpc('operator_decide', { p_id: id, p_status: status }), status === 'done' ? L('Marked done', 'हो गया चिह्नित') : L('Skipped', 'छोड़ दिया'));
    bust('opActions'); render();   // refresh even after a refusal: another device may have decided it already
  } finally { OP_BUSY.delete(id); }
}
let OP_SCANNING = false;
async function opScan() {
  if (OP_SCANNING) return;
  OP_SCANNING = true;
  try {
    const n = await act(() => DB.rpc('operator_scan', {}));
    if (n === null) return;
    const added = typeof n === 'number' ? n : 0;
    bust('opActions'); toast(added > 0 ? L(`${added} new to do`, `${added} नए काम जुड़े`) : L('Nothing new right now', 'अभी कुछ नया नहीं')); render();
  } finally { OP_SCANNING = false; }
}
async function opSettingsForm() {
  const s = await Q.opSettings().catch(() => null);
  openForm({
    title: L('AI operator settings', 'AI ऑपरेटर सेटिंग'), submitLabel: L('Save', 'सेव करें'),
    values: { enabled: s ? s.enabled : true, leads: s ? s.lead_followups : true, expiry: s ? s.expiry_nudges : true, dues: s ? s.dues_nudges : true, stale: s ? s.lead_stale_days : 3 },
    fields: [
      { k: 'enabled', type: 'check', full: true, label: L('Keep the operator on', 'ऑपरेटर चालू रखें') },
      { k: 'leads', type: 'check', full: true, label: L('Leads due for a follow-up', 'फ़ॉलो-अप वाले लीड्स') },
      { k: 'expiry', type: 'check', full: true, label: L('Members whose plan is ending or just ended', 'जिनका प्लान खत्म होने वाला है या अभी खत्म हुआ') },
      { k: 'dues', type: 'check', full: true, label: L('Overdue payments', 'देय तारीख़ निकल चुके बकाया') },
      { k: 'stale', type: 'number', step: 1, min: 1, req: true, full: true, label: L('Lead with no follow-up date: call after (days)', 'फ़ॉलो-अप तारीख़ न हो तो लीड को इतने दिन बाद कॉल (दिन)'), check: (v) => (Number.isInteger(v) && v >= 1 && v <= 14 ? '' : L('Whole number from 1 to 14', '1 से 14 तक पूरी संख्या')) },
    ],
    extra: `<p class="muted" style="margin:12px 0 0">${esc(L('It only makes a list. Nothing is sent by itself.', 'यह सिर्फ़ सूची बनाता है। कुछ भी अपने आप नहीं भेजा जाता।'))}</p>`,
    onSubmit: async (v) => {
      const ok = await act(() => DB.rpc('operator_set_settings', { p_enabled: v.enabled, p_leads: v.leads, p_expiry: v.expiry, p_dues: v.dues, p_stale: v.stale }), L('Saved', 'सेव हुआ'));
      if (ok === null) return false;
      bust('opSettings', 'opActions');
      if (v.enabled) { try { await DB.rpc('operator_scan', {}); } catch (e) { /* the morning job will do it */ } }   // show today's list right away
      render(); return true;
    },
  });
}
