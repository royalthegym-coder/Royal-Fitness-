/* ================= Automatic WhatsApp: receipt after payment, expiry reminder, due-payment reminder =================
   The database queues the messages (trigger on payments + a daily 09:00 IST job) and the wa-dispatch Edge Function
   sends them through the Meta WhatsApp Cloud API. Nothing is sent until the gym owner connects WhatsApp (see the guide on this page). */
const WA_DEFAULT = { auto_receipt: false, auto_expiry: false, expiry_days: 2, auto_dues: false, dues_every_days: 7, tpl_receipt: 'fee_receipt', tpl_expiry: 'membership_expiry', tpl_dues: 'fee_due', tpl_lang: 'hi' };
Q.waSettings = () => cached('wa_settings', async () => ({ ...WA_DEFAULT, ...((await DB.select('wa_settings', { limit: 1 }))[0] || {}) }));
Q.waLog = () => cached('wa_log', () => DB.select('wa_log', { order: 'created_at.desc', limit: 60 }));

async function waFn(body) {
  if (SESSION && SESSION.expires_at && SESSION.expires_at - 30 < Date.now() / 1000) await refreshSession();
  const res = await rawFetch('/functions/v1/wa-dispatch', { method: 'POST', headers: { apikey: CFG.key, Authorization: 'Bearer ' + (SESSION && SESSION.access_token), 'Content-Type': 'application/json' }, body: JSON.stringify({ gym_id: gymId(), ...body }) });
  const j = await res.json().catch(() => ({}));
  if (res.status === 401) { saveSession(null); if (typeof onSignedOut === 'function') onSignedOut(); throw new ApiError('session expired', 401, 'jwt'); }
  if (!res.ok && !j.error) j.error = 'HTTP ' + res.status;
  return j;
}

/* Template texts the owner pastes into Meta's template manager (category: Utility). Variables are filled by the system. */
function waTemplates(gym) {
  const g = gym || 'Royal The Gym';
  return {
    receipt: { key: 'tpl_receipt', title: L('Fee receipt', 'फ़ीस रसीद'), vars: L('{{1}} name · {{2}} amount · {{3}} receipt no. · {{4}} date · {{5}} balance / fully paid', '{{1}} नाम · {{2}} रकम · {{3}} रसीद नं. · {{4}} तारीख़ · {{5}} बाकी / पूरा चुकाया'),
      text: `नमस्ते {{1}} जी, आपका {{2}} का भुगतान मिल गया। रसीद नं. {{3}}, तारीख़ {{4}}। {{5}}। धन्यवाद! - ${g}` },
    expiry: { key: 'tpl_expiry', title: L('Membership expiry', 'सदस्यता खत्म होने से पहले'), vars: L('{{1}} name · {{2}} end date · {{3}} days left', '{{1}} नाम · {{2}} अंतिम तारीख़ · {{3}} बचे दिन'),
      text: `नमस्ते {{1}} जी, आपकी जिम सदस्यता {{2}} को खत्म हो रही है ({{3}} दिन बाकी)। रिन्यू के लिए जिम आइए या हमें संपर्क कीजिए। - ${g}` },
    dues: { key: 'tpl_dues', title: L('Due payment', 'बकाया भुगतान'), vars: L('{{1}} name · {{2}} amount due · {{3}} UPI ID', '{{1}} नाम · {{2}} बकाया रकम · {{3}} UPI ID'),
      text: `नमस्ते {{1}} जी, आपका {{2}} बकाया है। UPI: {{3}} पर भेज सकते हैं या जिम आकर जमा कीजिए। - ${g}` },
  };
}
const WA_KIND = () => ({ receipt: L('Receipt', 'रसीद'), expiry: L('Expiry', 'एक्सपायरी'), dues: L('Dues', 'बकाया'), test: L('Test', 'टेस्ट') });
const WA_STATUS = () => ({ queued: [L('Waiting', 'कतार में'), 'info'], sent: [L('Sent', 'भेजा'), 'ok'], failed: [L('Failed', 'फ़ेल'), 'bad'], skipped: [L('Skipped', 'छोड़ा'), 'mute'] });

async function vWhatsApp() {
  const [s, log, members] = await Promise.all([Q.waSettings(), Q.waLog().catch(() => []), Q.members()]);
  let conf = null; try { const r = await Promise.race([waFn({ action: 'status' }), new Promise((_, rej) => setTimeout(() => rej(new Error('t')), 6000))]); conf = r.configured === true ? true : r.configured === false ? false : null; } catch (e) { conf = null; }
  const mm = memberMap(members), st = WA_STATUS(), kinds = WA_KIND(), T = waTemplates(gymName());
  const count = (x) => log.filter((l) => l.status === x).length;
  const on = (b) => badge(b ? L('On', 'चालू') : L('Off', 'बंद'), b ? 'ok' : 'mute');
  const connBadge = conf === true ? badge(L('Connected', 'जुड़ा हुआ'), 'ok') : conf === false ? badge(L('Not connected yet', 'अभी जुड़ा नहीं'), 'info') : badge(L('Unknown', 'पता नहीं'), 'mute');
  const lock = CTX.locked ? 'disabled' : '';
  const head = pageHead(L('Setup', 'सेटअप'), L('Automatic WhatsApp', 'ऑटोमैटिक WhatsApp'),
    L('Receipts, expiry reminders and due-payment reminders go to every member by themselves. Members who opted out are skipped.', 'रसीद, एक्सपायरी रिमाइंडर और बकाया रिमाइंडर हर सदस्य को अपने-आप जाते हैं। जिन्होंने मना किया है उन्हें नहीं जाते।'),
    `<button class="btn" data-act="waTest" ${lock}>${ic('msg')} ${esc(L('Send test', 'टेस्ट भेजें'))}</button><button class="btn primary" data-act="waSettings" ${lock}>${ic('gear')} ${esc(L('Settings', 'सेटिंग'))}</button>`);
  const status = card(L('Status', 'स्थिति'), 'msg', connBadge,
    `<ul class="list">
      <li><div class="grow"><b>${esc(L('Fee receipt after every payment', 'हर भुगतान के बाद फ़ीस रसीद'))}</b><small>${esc(L('Sent within seconds of saving the payment', 'पेमेंट सेव होते ही कुछ सेकंड में'))}</small></div>${on(s.auto_receipt)}</li>
      <li><div class="grow"><b>${esc(L(`Expiry reminder ${s.expiry_days} day(s) before`, `एक्सपायरी से ${s.expiry_days} दिन पहले रिमाइंडर`))}</b><small>${esc(L('Every day at 9:00 AM', 'रोज़ सुबह 9:00 बजे'))}</small></div>${on(s.auto_expiry)}</li>
      <li><div class="grow"><b>${esc(L(`Due-payment reminder every ${s.dues_every_days} day(s)`, `बकाया रिमाइंडर हर ${s.dues_every_days} दिन में`))}</b><small>${esc(L('Only for invoices past their due date', 'सिर्फ़ उन इनवॉइस पर जिनकी देय तारीख़ निकल चुकी'))}</small></div>${on(s.auto_dues)}</li>
    </ul>
    ${conf === false ? `<p class="muted" style="margin:10px 0 0">${esc(L('WhatsApp is not connected yet, so messages wait in the queue and are sent once you finish the setup below. Messages older than 3 days are dropped.', 'WhatsApp अभी जुड़ा नहीं है, इसलिए मैसेज कतार में रुके रहेंगे और नीचे का सेटअप पूरा होते ही जाएँगे। 3 दिन से पुराने मैसेज नहीं भेजे जाते।'))}</p>` : ''}`);
  const tiles = `<div class="tiles" style="margin:14px 0">${tile(L('Waiting', 'कतार में'), String(count('queued')), '')}${tile(L('Sent', 'भेजे गए'), String(count('sent')), L('last 60', 'पिछले 60'), 'var(--ok, #1e7a3c)')}${tile(L('Failed', 'फ़ेल'), String(count('failed')), '', count('failed') ? 'var(--crimson)' : '')}</div>`;
  const steps = card(L('Connect WhatsApp (one time, about 30 minutes)', 'WhatsApp जोड़ें (एक बार, लगभग 30 मिनट)'), 'gear', '',
    `<ol class="muted" style="padding-left:20px;margin:0;display:grid;gap:8px;line-height:1.5">
      <li>${esc(L('Create a Meta Business account at business.facebook.com and open the WhatsApp product in developers.facebook.com (WhatsApp Cloud API).', 'business.facebook.com पर Meta Business अकाउंट बनाइए और developers.facebook.com में WhatsApp (Cloud API) चालू कीजिए।'))}</li>
      <li>${esc(L('Add the gym number. It must not be logged in to the normal WhatsApp app. Verify it with the OTP.', 'जिम का नंबर जोड़िए। वह नंबर साधारण WhatsApp ऐप में चालू नहीं होना चाहिए। OTP से वेरिफ़ाई कीजिए।'))}</li>
      <li>${esc(L('In WhatsApp Manager → Message templates, create the three templates below (category Utility, language Hindi) with exactly these names and texts. Approval takes a few minutes to a day.', 'WhatsApp Manager → Message templates में नीचे के तीनों टेम्पलेट (कैटेगरी Utility, भाषा Hindi) ठीक इन्हीं नामों और टेक्स्ट से बनाइए। अनुमोदन में कुछ मिनट से एक दिन लगता है।'))}</li>
      <li>${esc(L('Create a permanent access token (System User in Business Settings, permission whatsapp_business_messaging) and copy the Phone number ID.', 'स्थायी access token बनाइए (Business Settings में System User, अनुमति whatsapp_business_messaging) और Phone number ID कॉपी कीजिए।'))}</li>
      <li>${esc(L('In Supabase → Edge Functions → Secrets add WHATSAPP_TOKEN (the token) and WHATSAPP_PHONE_NUMBER_ID. Then press “Send test” here.', 'Supabase → Edge Functions → Secrets में WHATSAPP_TOKEN (टोकन) और WHATSAPP_PHONE_NUMBER_ID जोड़िए। फिर यहाँ “टेस्ट भेजें” दबाइए।'))}</li>
    </ol>
    <p class="muted" style="margin:10px 0 0">${esc(L('Meta charges per business-initiated conversation (roughly ₹0.1–0.8 for utility messages in India; check current rates). Only message members who gave their number to the gym, and use the member form to switch a member off if they ask to stop.', 'Meta हर बिज़नेस-शुरू की गई बातचीत पर शुल्क लेता है (भारत में utility मैसेज लगभग ₹0.1–0.8; ताज़ा दरें देखें)। सिर्फ़ उन्हें भेजें जिन्होंने जिम को अपना नंबर दिया है, और कोई रोकने को कहे तो सदस्य फ़ॉर्म से उसे बंद कर दीजिए।'))}</p>`);
  const tpls = card(L('Template texts to paste in Meta', 'Meta में चिपकाने के टेम्पलेट'), 'copy', '',
    Object.entries(T).map(([k, t]) => `<div style="margin-bottom:12px"><div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><b>${esc(t.title)} · <code>${esc(s[t.key])}</code></b><button class="btn sm" data-act="copyTpl" data-k="${k}">${ic('copy')} ${esc(L('Copy', 'कॉपी'))}</button></div><div class="muted" style="font-size:12px">${esc(t.vars)}</div><pre style="white-space:pre-wrap;margin:6px 0 0;padding:8px 10px;border:1px solid var(--line);border-radius:8px;font:inherit;font-size:13px">${esc(t.text)}</pre></div>`).join(''));
  const logCard = card(L('Message log', 'मैसेज लॉग'), 'clock', '', log.length ? `<ul class="list">${log.map((l) => { const m = l.member_id ? mm.get(l.member_id) : null, [lab, tone] = st[l.status] || [l.status, 'mute']; return `<li><div class="grow"><b>${esc(m ? m.name : (l.params && l.params[0]) || '—')} · ${esc(kinds[l.kind] || l.kind)}</b><small>${esc(fmtDate(istDate(l.created_at)))} ${esc(fmtTime(l.created_at))} · ${esc(l.to_phone || '')}${l.error ? ' · ' + esc(l.error) : ''}</small></div>${badge(lab, tone)}</li>`; }).join('')}</ul>` : empty(L('No messages yet', 'अभी कोई मैसेज नहीं'), L('They appear here as soon as a payment is saved or a reminder is due.', 'पेमेंट सेव होते या रिमाइंडर का समय आते ही यहाँ दिखेंगे।')));
  return head + status + tiles + steps + '<div style="height:14px"></div>' + tpls + '<div style="height:14px"></div>' + logCard;
}

async function waSettingsForm() {
  const s = await Q.waSettings();
  const tplCheck = (v) => (/^[a-z0-9_]{1,80}$/.test(v) ? '' : L('Lower-case letters, digits and _ only', 'सिर्फ़ छोटे अक्षर, अंक और _'));
  openForm({
    title: L('Automatic WhatsApp settings', 'ऑटोमैटिक WhatsApp सेटिंग'), values: s,
    fields: [
      { k: 'auto_receipt', label: L('Send the fee receipt after every payment', 'हर भुगतान के बाद फ़ीस रसीद भेजें'), type: 'check', full: true },
      { k: 'auto_expiry', label: L('Send a membership expiry reminder', 'सदस्यता एक्सपायरी का रिमाइंडर भेजें'), type: 'check', full: true },
      { k: 'expiry_days', label: L('…this many days before the end date', '…अंतिम तारीख़ से इतने दिन पहले'), type: 'number', min: 1, step: 1, check: (v) => (v >= 1 && v <= 14 && Number.isInteger(v) ? '' : L('1 to 14', '1 से 14')) },
      { k: 'auto_dues', label: L('Send due-payment reminders', 'बकाया भुगतान का रिमाइंडर भेजें'), type: 'check', full: true },
      { k: 'dues_every_days', label: L('…repeat every (days)', '…हर इतने दिन में दोहराएँ'), type: 'number', min: 1, step: 1, check: (v) => (v >= 1 && v <= 30 && Number.isInteger(v) ? '' : L('1 to 30', '1 से 30')) },
      { k: 'tpl_lang', label: L('Template language', 'टेम्पलेट की भाषा'), type: 'select', options: [{ v: 'hi', l: 'Hindi (hi)' }, { v: 'en', l: 'English (en)' }, { v: 'en_US', l: 'English US (en_US)' }], def: s.tpl_lang },
      { k: 'tpl_receipt', label: L('Receipt template name', 'रसीद टेम्पलेट का नाम'), check: tplCheck },
      { k: 'tpl_expiry', label: L('Expiry template name', 'एक्सपायरी टेम्पलेट का नाम'), check: tplCheck },
      { k: 'tpl_dues', label: L('Dues template name', 'बकाया टेम्पलेट का नाम'), check: tplCheck },
    ],
    onSubmit: async (v) => {
      const row = { gym_id: gymId(), auto_receipt: !!v.auto_receipt, auto_expiry: !!v.auto_expiry, expiry_days: v.expiry_days, auto_dues: !!v.auto_dues, dues_every_days: v.dues_every_days, tpl_lang: v.tpl_lang, tpl_receipt: v.tpl_receipt, tpl_expiry: v.tpl_expiry, tpl_dues: v.tpl_dues, updated_at: new Date().toISOString() };
      const ok = await act(() => api('/rest/v1/wa_settings?on_conflict=gym_id', { method: 'POST', body: row, headers: { Prefer: 'resolution=merge-duplicates,return=representation' } }), L('Saved', 'सेव हुआ'));
      if (ok) { bust('wa_settings'); render(); } return !!ok;
    },
  });
}

async function waTestForm() {
  openForm({
    title: L('Send a test WhatsApp', 'टेस्ट WhatsApp भेजें'), values: { phone: (CTX.gym && CTX.gym.phone) || '' },
    fields: [{ k: 'phone', label: L('Mobile number to receive the test', 'टेस्ट पाने वाला मोबाइल नंबर'), type: 'tel', req: true, full: true }],
    onSubmit: async (v) => {
      let r; try { r = await waFn({ action: 'test', phone: v.phone }); } catch (e) { toast(friendlyError(e), 'bad'); return false; }
      if (r.configured === false) { toast(L('WhatsApp is not connected yet. Finish the setup steps first.', 'WhatsApp अभी जुड़ा नहीं है। पहले सेटअप के कदम पूरे कीजिए।'), 'bad'); return false; }
      if (!r.ok) { toast(r.error || L('Could not send', 'भेज नहीं सका'), 'bad'); return false; }
      toast(L('Test message sent. It uses the receipt template.', 'टेस्ट मैसेज भेजा गया। यह रसीद वाले टेम्पलेट से जाता है।')); bust('wa_log'); render(); return true;
    },
  });
}

async function copyWaTemplate(k) { const t = waTemplates(gymName())[k]; if (t) copyText(t.text, L('Template copied', 'टेम्पलेट कॉपी हुआ')); }
