/* ================= Public enquiry form =================
   Anyone with the gym's link (?enquire=<gym id>) can leave a name and number. No sign-in.
   The database function submit_enquiry does the real work: consent, honeypot, rate limit, de-duplication.
   Each enquiry lands in Leads as source "Website", stage "New". */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const enquiryGymParam = () => { try { const g = new URLSearchParams(location.search).get('enquire'); return g && UUID_RE.test(g) ? g.toLowerCase() : ''; } catch (e) { return ''; } };
const enquiryUrl = () => `${location.origin}/?enquire=${gymId()}`;

/* the visitor is anonymous: always the public key, never a stored session */
async function publicRpc(fn, args) {
  const res = await rawFetch(`/rest/v1/rpc/${fn}`, { method: 'POST', headers: { apikey: CFG.key, Authorization: 'Bearer ' + CFG.key, 'Content-Type': 'application/json' }, body: JSON.stringify(args) });
  let j = null; try { j = await res.json(); } catch (e) { /* an empty body is fine */ }
  if (!res.ok) throw new ApiError((j && (j.message || j.msg)) || res.statusText, res.status, (j && j.code) || String(res.status));
  return j;
}
/* the codes submit_enquiry raises, in the visitor's words */
function enquiryError(e) {
  if (e && e.status === 0) return L('No connection. Check the internet and try again.', 'कनेक्शन नहीं है। इंटरनेट जाँचकर फिर कोशिश करें।');
  const say = {
    enquiries_closed: () => L('This gym is not taking enquiries right now.', 'यह जिम अभी पूछताछ नहीं ले रहा है।'),
    consent_required: () => L('Please tick the box so the gym may contact you.', 'कृपया बॉक्स पर टिक करें ताकि जिम आपसे संपर्क कर सके।'),
    name_invalid: () => L('Enter your name (2 to 80 letters).', 'अपना नाम लिखें (2 से 80 अक्षर)।'),
    phone_invalid: () => L('Enter a valid 10-digit mobile number.', '10 अंकों का सही मोबाइल नंबर लिखें।'),
    text_too_long: () => L('Your message is too long. Please shorten it.', 'संदेश बहुत लंबा है। थोड़ा छोटा करें।'),
    too_many_enquiries: () => L('Too many enquiries right now. Please try again in a while.', 'अभी बहुत पूछताछ आ रही हैं। थोड़ी देर बाद कोशिश करें।'),
  }[String((e && e.message) || '').trim()];
  return say ? say() : L('Could not send. Please try again.', 'भेजा नहीं जा सका। फिर कोशिश करें।');
}

const ENQ = { gid: '', gym: undefined, done: false };
function enquiryShell(inner) {
  showGate(`<div class="login"><section class="card" id="enqCard">${inner}<div style="display:flex;gap:8px;margin-top:14px;align-items:center;flex-wrap:wrap"><button class="btn sm" type="button" id="enqLang">${ic('globe')} ${LANG === 'hi' ? 'English' : 'हिन्दी'}</button><a class="muted" style="font-size:12px" href="privacy.html" target="_blank" rel="noopener">${esc(L('Privacy', 'प्राइवेसी'))}</a></div></section></div>`);
}
function enquiryDraw(keep) {
  const g = ENQ.gym, v = keep || {};
  if (g === undefined) return enquiryShell(`<p class="muted" role="status">${esc(L('Loading…', 'लोड हो रहा है…'))}</p>`);
  if (g === false) return enquiryShell(`<h1>${esc(L('Could not load', 'लोड नहीं हुआ'))}</h1><p class="muted">${esc(L('Check the internet and try again.', 'इंटरनेट जाँचकर फिर कोशिश करें।'))}</p><button class="btn primary" type="button" id="enqRetry">${esc(L('Try again', 'फिर कोशिश करें'))}</button>`);
  if (g === null) return enquiryShell(`<h1>${esc(L('Not available', 'उपलब्ध नहीं'))}</h1><p class="muted">${esc(L('This gym is not taking enquiries right now.', 'यह जिम अभी पूछताछ नहीं ले रहा है।'))}</p>`);
  const head = `<div style="display:flex;gap:10px;align-items:center">${avatar(g)}<div><b>${esc(g)}</b><br><small class="muted">${esc(L('Gym enquiry', 'जिम पूछताछ'))}</small></div></div>`;
  if (ENQ.done) return enquiryShell(`${head}<div class="banner ok" role="status" style="margin:16px 0 0"><b>${esc(L('Thank you!', 'धन्यवाद!'))}</b> ${esc(L(`${g} will contact you soon.`, `${g} जल्दी ही आपसे संपर्क करेगा।`))}</div>`);
  enquiryShell(`${head}<h1>${esc(L('Ask about joining', 'जॉइन करने के बारे में पूछें'))}</h1><p class="muted" style="margin:0">${esc(L(`Leave your name and number. ${g} will call you back.`, `अपना नाम और नंबर छोड़ें। ${g} आपको वापस कॉल करेगा।`))}</p>
    <div class="banner bad" id="enqErr" role="alert" style="margin:12px 0 0" hidden></div>
    <form id="enqForm" novalidate>
      <label class="fl"><span>${esc(L('Your name', 'आपका नाम'))} *</span><input class="in" id="en_name" autocomplete="name" maxlength="80" required value="${esc(v.name || '')}"><small class="err" id="e_en_name"></small></label>
      <label class="fl"><span>${esc(L('Mobile number', 'मोबाइल नंबर'))} *</span><input class="in" id="en_phone" type="tel" inputmode="numeric" autocomplete="tel" placeholder="98765 43210" required value="${esc(v.phone || '')}"><small class="err" id="e_en_phone"></small></label>
      <label class="fl"><span>${esc(L('What are you looking for?', 'आप क्या चाहते हैं?'))}</span><input class="in" id="en_interest" maxlength="200" placeholder="${esc(L('Weight loss, 3-month plan', 'वज़न घटाना, 3 महीने का प्लान'))}" value="${esc(v.interest || '')}"></label>
      <label class="fl"><span>${esc(L('Anything else?', 'कुछ और बताना है?'))}</span><textarea class="ta" id="en_note" maxlength="500" rows="2">${esc(v.note || '')}</textarea></label>
      <input type="text" id="en_hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;width:1px;height:1px;opacity:0" value="">
      <label class="ck fl"><input type="checkbox" id="en_ok"${v.ok ? ' checked' : ''}> ${esc(L(`I agree that ${g} may call or WhatsApp me on this number about membership.`, `मैं सहमत हूँ कि ${g} सदस्यता के बारे में इस नंबर पर कॉल या WhatsApp कर सकता है।`))}</label><small class="err" id="e_en_ok" style="color:var(--crimson);font-size:12px"></small>
      <button class="btn primary" id="en_go" type="submit">${esc(L('Send enquiry', 'पूछताछ भेजें'))}</button>
    </form>`);
  const n = $('#en_name'); if (n && !v.name) n.focus();
}
const enquiryDraft = () => { const f = (id) => { const el = $(id); return el ? (el.type === 'checkbox' ? el.checked : el.value) : ''; }; return { name: f('#en_name'), phone: f('#en_phone'), interest: f('#en_interest'), note: f('#en_note'), ok: f('#en_ok') }; };
async function enquiryLoad() {
  ENQ.gym = undefined; enquiryDraw();
  try { ENQ.gym = (await publicRpc('enquiry_gym', { p_gym: ENQ.gid })) || null; } catch (e) { ENQ.gym = e && e.status === 0 ? false : null; }
  enquiryDraw();
}
function enquiryScreen(gid) {
  ENQ.gid = gid; ENQ.done = false;
  enquiryLoad();
}
document.addEventListener('click', (e) => {
  if (!ENQ.gid) return;
  if (e.target.closest('#enqLang')) { const keep = enquiryDraft(); LANG = LANG === 'hi' ? 'en' : 'hi'; try { localStorage.setItem('gymos-lang', LANG); } catch (x) { /* storage is optional */ } enquiryDraw(keep); }
  else if (e.target.closest('#enqRetry')) enquiryLoad();
});
document.addEventListener('submit', async (e) => {
  if (e.target.id !== 'enqForm') return;
  e.preventDefault();
  const btn = $('#en_go'); if (!btn || btn.disabled) return;
  const d = enquiryDraft(), name = d.name.trim(), phone = indMobile(d.phone), set = (id, t) => { const el = $('#e_' + id); if (el) el.textContent = t; }, top = $('#enqErr');
  top.hidden = true;
  set('en_name', name.length < 2 ? L('Enter your name (at least 2 letters)', 'अपना नाम लिखें (कम से कम 2 अक्षर)') : '');
  set('en_phone', phone ? '' : L('Enter a valid 10-digit mobile number', '10 अंकों का सही मोबाइल नंबर लिखें'));
  set('en_ok', d.ok ? '' : L('Please tick this box', 'कृपया इस बॉक्स पर टिक करें'));
  if (name.length < 2 || !phone || !d.ok) { const first = name.length < 2 ? '#en_name' : !phone ? '#en_phone' : '#en_ok'; const el = $(first); if (el) el.focus(); return; }
  btn.disabled = true;
  try {
    await publicRpc('submit_enquiry', { p_gym: ENQ.gid, p_name: name, p_phone: phone, p_interest: d.interest.trim() || null, p_note: d.note.trim() || null, p_consent: true, p_hp: ($('#en_hp') || {}).value || '' });
    ENQ.done = true; enquiryDraw();
  } catch (err) {
    btn.disabled = false; top.textContent = enquiryError(err); top.hidden = false;
  }
});

/* ---------- staff side: the link, a QR and a share button on the Leads page ---------- */
function enquiryShareText() { const u = enquiryUrl(); return L(`Want to join ${gymName()}? Leave your name and number here and we will call you back: ${u}`, `${gymName()} जॉइन करना चाहते हैं? अपना नाम और नंबर यहाँ छोड़ें, हम आपको कॉल करेंगे: ${u}`); }
function enquiryCard() {
  const u = enquiryUrl(); let svg = ''; try { svg = qrSvg(u, 200); } catch (e) { svg = ''; }
  return card(L('Enquiry form link', 'पूछताछ फ़ॉर्म का लिंक'), 'globe', '', `<div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap">${svg ? `<div class="qrbox">${svg}</div>` : ''}<div style="flex:1;min-width:220px">
    <p style="margin:0 0 8px">${esc(L('Put this link on Instagram, Google or WhatsApp status, or print the QR for the front desk. Every enquiry lands in Leads by itself.', 'यह लिंक इंस्टाग्राम, गूगल या WhatsApp स्टेटस पर डालें, या QR छापकर रिसेप्शन पर लगाएँ। हर पूछताछ अपने आप लीड्स में आ जाती है।'))}</p>
    ${CTX.locked ? `<p class="muted" style="margin:0 0 8px">${esc(L('The gym is locked, so the form is closed until you renew.', 'जिम लॉक है, इसलिए रिन्यू करने तक फ़ॉर्म बंद है।'))}</p>` : ''}
    <input class="in" id="enqUrl" readonly value="${esc(u)}" aria-label="${esc(L('Enquiry form link', 'पूछताछ फ़ॉर्म का लिंक'))}" onfocus="this.select()">
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"><button class="btn sm" data-act="copyEnquiry">${esc(L('Copy link', 'लिंक कॉपी करें'))}</button><a class="btn sm wa" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(enquiryShareText())}">${ic('msg')} ${esc(L('Share on WhatsApp', 'WhatsApp पर भेजें'))}</a><a class="btn sm" target="_blank" rel="noopener" href="${esc(u)}">${esc(L('Preview form', 'फ़ॉर्म देखें'))}</a></div></div></div>`);
}
