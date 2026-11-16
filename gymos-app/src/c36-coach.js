/* ================= AI coach =================
   A member asks short fitness questions in the app. The Edge Function ai-coach answers (general guidance only, never medical advice).
   The gym owner sees counts only, never what a member asked, and can switch the coach off. The platform admin switches it on per gym
   and sets the daily limit. When the AI gateway keys are not saved on the server, the page says the coach is not active yet. */

/* pure */
const COACH_ERR = {
  not_configured: ['The coach is not active yet. Please try again later.', 'कोच अभी चालू नहीं है। कृपया बाद में कोशिश करें।'],
  disabled: ['The AI coach is switched off for your gym.', 'आपके जिम में AI कोच बंद है।'],
  limit: ['You have used today\'s questions. Come back tomorrow.', 'आज के सवाल पूरे हो गए। कल फिर पूछिए।'],
  gym_limit: ['The coach is very busy today. Try again tomorrow.', 'कोच पर आज बहुत भीड़ है। कल फिर कोशिश करें।'],
  too_fast: ['Please wait a few seconds before the next question.', 'अगले सवाल से पहले कुछ सेकंड रुकिए।'],
  bad_text: ['Write a question of 2 to 500 characters.', '2 से 500 अक्षर का सवाल लिखिए।'],
  unavailable: ['The coach could not answer right now. Your question was not counted. Try again in a minute.', 'कोच अभी जवाब नहीं दे सका। आपका सवाल गिना नहीं गया। एक मिनट बाद फिर कोशिश करें।'],
  closed: ['Your gym account is paused.', 'आपके जिम का अकाउंट रुका हुआ है।'],
  members_only: ['The coach is for members.', 'कोच सिर्फ़ सदस्यों के लिए है।'],
  no_member: ['Your membership is not linked yet. Ask the front desk.', 'आपकी सदस्यता अभी जुड़ी नहीं है। फ़्रंट डेस्क से पूछिए।'],
};
const coachErrText = (code) => { const m = COACH_ERR[code]; return m ? L(m[0], m[1]) : L('Something went wrong. Try again.', 'कुछ गड़बड़ हुई। फिर कोशिश करें।'); };
const COACH_CHIPS = () => [
  [L('What should I eat before the gym?', 'जिम से पहले क्या खाऊँ?'), 'What should I eat before the gym?'],
  [L('How much protein do I need?', 'मुझे कितना प्रोटीन चाहिए?'), 'How much protein do I need each day?'],
  [L('How do I stay regular?', 'रोज़ जिम आना कैसे जारी रखूँ?'), 'How do I stay regular with the gym?'],
  [L('What to do after a workout?', 'वर्कआउट के बाद क्या करूँ?'), 'What should I do after a workout?'],
];
/* rows come newest first or oldest first; the page wants oldest first */
function coachRows(rows) {
  return (Array.isArray(rows) ? rows : []).filter((r) => r && (r.role === 'user' || r.role === 'assistant') && typeof r.content === 'string' && r.content.trim())
    .slice().sort((a, b) => Number(a.id) - Number(b.id)).map((r) => ({ id: r.id, role: r.role, text: r.content, safety: r.kind === 'safety' }));
}
/* '' when the question may be sent, otherwise a COACH_ERR key */
function coachCanSend(text, st) {
  const t = String(text || '').trim();
  if (t.length < 2 || t.length > 500) return 'bad_text';
  if (st && st.remaining !== undefined && Number(st.remaining) <= 0) return 'limit';
  return '';
}
const coachLeftLabel = (st) => (st ? L(`${st.remaining} of ${st.limit} questions left today`, `आज ${st.limit} में से ${st.remaining} सवाल बाकी`) : '');
function coachOwnerSummary(s) {
  const x = s || {}, q7 = Number(x.questions_7d) || 0, users = Number(x.members_7d) || 0, all = Number(x.members_with_login) || 0;
  return { on: !!x.enabled, today: Number(x.questions_today) || 0, week: q7, users, all, share: all ? Math.round((users / all) * 100) : 0 };
}

async function coachFn(body) {
  if (SESSION && SESSION.expires_at && SESSION.expires_at - 30 < Date.now() / 1000) await refreshSession();
  const res = await rawFetch('/functions/v1/ai-coach', { method: 'POST', headers: { apikey: CFG.key, Authorization: 'Bearer ' + (SESSION && SESSION.access_token), 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const j = await res.json().catch(() => ({}));
  if (res.status === 401) { saveSession(null); if (typeof onSignedOut === 'function') onSignedOut(); throw new ApiError('session expired', 401, 'jwt'); }
  if (!res.ok && !j.error) j.error = 'failed';
  return j;
}

/* ---------- member: chat page ---------- */
const coachBubble = (m) => `<div class="cbub ${m.role === 'user' ? 'me' : 'bot'}${m.safety ? ' safe' : ''}">${m.safety ? `<small class="cnote">${esc(L('Safety note', 'सुरक्षा सूचना'))}</small>` : ''}<span>${esc(m.text)}</span></div>`;
async function vCoach() {
  const m = (await Q.members())[0]; if (!m) return noMember();
  const st = await coachFn({ action: 'status' }).catch((e) => { if (e && e.status === 401) throw e; return null; });
  const head = pageHead(gymName(), L('AI coach', 'AI कोच'), L('Ask short questions about training, food and habits. General guidance, not medical advice.', 'ट्रेनिंग, खान-पान और आदतों पर छोटे सवाल पूछिए। यह सामान्य सलाह है, मेडिकल सलाह नहीं।'));
  if (!st) return head + `<div class="card">${empty(L('Could not reach the coach', 'कोच से संपर्क नहीं हो सका'), L('Check your internet and try again.', 'इंटरनेट जाँचकर फिर कोशिश करें।'), `<button class="btn" data-act="retry">${esc(L('Try again', 'फिर कोशिश करें'))}</button>`)}</div>`;
  if (!st.enabled) return head + `<div class="card">${empty(L('The AI coach is not switched on at your gym yet', 'आपके जिम में AI कोच अभी चालू नहीं है'), L('Ask the front desk or your trainer.', 'फ़्रंट डेस्क या अपने ट्रेनर से पूछिए।'))}</div>`;
  COACH_ST = st;
  if (!st.configured) return head + `<div class="card">${empty(L('The coach is being set up', 'कोच तैयार किया जा रहा है'), L('It will be available soon.', 'यह जल्दी ही उपलब्ध होगा।'))}</div>`;
  const rows = coachRows(await DB.select('coach_messages', { order: 'id.desc', limit: 40 }).catch(() => []));
  const log = rows.length ? rows.slice().reverse().map(coachBubble).join('') : `<div class="cbub bot"><span>${esc(L('Hi! Ask me about workouts, food and staying regular. For pain, illness or medicines, please see a doctor.', 'नमस्ते! वर्कआउट, खान-पान और नियमितता के बारे में पूछिए। दर्द, बीमारी या दवाइयों के लिए डॉक्टर को दिखाइए।'))}</span></div>`;
  const chips = rows.length ? '' : `<div class="cchips">${COACH_CHIPS().map(([label, q]) => `<button type="button" class="chip" data-act="coachAsk" data-q="${esc(q)}">${esc(label)}</button>`).join('')}</div>`;
  return head + `<section class="card coach"><div class="clog" id="coachLog" aria-live="polite">${log}</div>${chips}
    <div class="cform"><textarea class="in" id="coachIn" rows="2" maxlength="500" placeholder="${esc(L('Type your question…', 'अपना सवाल लिखिए…'))}" aria-label="${esc(L('Your question', 'आपका सवाल'))}"></textarea><button type="button" class="btn primary" id="coachGo" data-act="coachSend">${ic('msg')} ${esc(L('Ask', 'पूछें'))}</button></div>
    <div class="cmeta"><span id="coachLeft" class="muted">${esc(coachLeftLabel(st))}</span><button type="button" class="btn sm" id="coachClr" data-act="coachClear"${rows.length ? '' : ' hidden'}>${esc(L('Clear chat', 'चैट मिटाएँ'))}</button></div></section>
    <div class="note" style="margin-top:12px">${esc(L('Your questions are private: your gym owner sees only how many questions were asked, not what you wrote. The coach uses your profile, plan and visits to answer.', 'आपके सवाल निजी हैं: जिम मालिक को सिर्फ़ सवालों की गिनती दिखती है, आपने क्या लिखा यह नहीं। कोच आपके प्रोफ़ाइल, प्लान और विज़िट के आधार पर जवाब देता है।'))}</div>`;
}
let COACH_ST = null;
/* a question the server did not keep: remove its bubble, and put the text back into the box when asked */
function coachDropLast(box, input, q, restore) {
  const first = box && box.querySelector('.cbub.me'); if (first) first.remove();
  if (restore && input) input.value = q;
}
async function coachSend(text) {
  if (U.coachBusy) return;
  const box = $('#coachLog'), input = $('#coachIn'), btn = $('#coachGo'); if (!box) return;
  const q = String(text !== undefined ? text : (input ? input.value : '')).trim();
  const bad = coachCanSend(q, COACH_ST); if (bad) { toast(coachErrText(bad), 'bad'); return; }
  U.coachBusy = true; if (btn) btn.disabled = true;
  const chips = $('.cchips'); if (chips) chips.remove();
  box.insertAdjacentHTML('afterbegin', coachBubble({ role: 'user', text: q }) + '<div class="cbub bot typing" id="coachTyping"><span>…</span></div>');
  if (input) input.value = '';
  try {
    const r = await coachFn({ action: 'ask', text: q });
    const t = $('#coachTyping'); if (t) t.remove();
    if (r.error) {
      toast(coachErrText(r.error), 'bad'); coachDropLast(box, input, q, r.error !== 'limit');
      if (r.error === 'limit' && COACH_ST) { COACH_ST.remaining = 0; const left = $('#coachLeft'); if (left) left.textContent = coachLeftLabel(COACH_ST); }
      return;
    }
    box.insertAdjacentHTML('afterbegin', coachBubble({ role: 'assistant', text: r.reply, safety: r.kind === 'safety' }));
    const clr = $('#coachClr'); if (clr) clr.hidden = false;
    if (COACH_ST) COACH_ST.remaining = r.remaining; const left = $('#coachLeft'); if (left && COACH_ST) left.textContent = coachLeftLabel(COACH_ST);
  } catch (e) { const t = $('#coachTyping'); if (t) t.remove(); coachDropLast(box, input, q, true); if (!(e && e.status === 401)) toast(friendlyError(e), 'bad'); } finally { U.coachBusy = false; if (btn) btn.disabled = false; }
}
async function coachClear() {
  if (!confirm(L('Delete this whole chat?', 'पूरी चैट मिटा दें?'))) return;
  const ok = await act(() => DB.rpc('coach_clear', {}), L('Chat deleted', 'चैट मिट गई'));
  if (ok !== null) render();
}

/* ---------- gym owner: usage and the off switch ---------- */
async function vCoachAdmin() {
  const s = coachOwnerSummary(await DB.rpc('coach_stats', {}).catch(() => null));
  return pageHead(L('Insights', 'जानकारी'), L('AI coach', 'AI कोच'), L('A fitness assistant your members can ask short questions. You see counts only, never what they asked.', 'एक फ़िटनेस सहायक, जिससे सदस्य छोटे सवाल पूछ सकते हैं। आपको सिर्फ़ गिनती दिखती है, उनके सवाल नहीं।'))
    + `<div class="tiles">${tile(L('Status', 'स्थिति'), esc(s.on ? L('On', 'चालू') : L('Off', 'बंद')), '', s.on ? 'var(--ok)' : '')}${tile(L('Questions today', 'आज के सवाल'), String(s.today))}${tile(L('Last 7 days', 'पिछले 7 दिन'), String(s.week), L(`${s.users} of ${s.all} members asked`, `${s.all} में से ${s.users} सदस्यों ने पूछा`))}</div>`
    + card(L('How it works', 'यह कैसे काम करता है'), 'pulse', s.on ? badge('On', 'ok') : badge('Off', 'mute'), `<div style="padding:6px 18px 18px;display:grid;gap:10px">
      <p class="muted" style="margin:0">${esc(L('Members open AI coach in the app and ask about workouts, food and habits. It knows their profile, published plan and visits, but never phone numbers, payments or other members.', 'सदस्य ऐप में AI कोच खोलकर वर्कआउट, खान-पान और आदतों के बारे में पूछते हैं। कोच को उनका प्रोफ़ाइल, प्रकाशित प्लान और विज़िट पता होते हैं, फ़ोन नंबर, भुगतान या दूसरे सदस्य नहीं।'))}</p>
      <p class="muted" style="margin:0">${esc(L('For pain, illness, pregnancy, eating problems, medicines or low mood it does not use AI: it gives a fixed safe answer and asks the member to see a doctor and tell the trainer.', 'दर्द, बीमारी, गर्भावस्था, खाने की समस्या, दवाइयों या मन के भारीपन पर यह AI इस्तेमाल नहीं करता: तय सुरक्षित जवाब देता है और डॉक्टर को दिखाने व ट्रेनर को बताने को कहता है।'))}</p>
      <p class="muted" style="margin:0">${esc(s.on ? L('You can switch it off here any time. Only the platform admin can switch it on and set the daily limit.', 'आप इसे यहाँ कभी भी बंद कर सकते हैं। चालू करना और रोज़ की सीमा तय करना सिर्फ़ प्लेटफ़ॉर्म एडमिन के हाथ में है।') : L('It is off for your gym. Ask the platform admin to switch it on.', 'आपके जिम में यह बंद है। चालू कराने के लिए प्लेटफ़ॉर्म एडमिन से कहिए।'))}</p>
      ${s.on ? `<div><button class="btn danger" data-act="coachOff">${esc(L('Switch off for my gym', 'मेरे जिम के लिए बंद करें'))}</button></div>` : ''}</div>`);
}
async function coachOff() {
  if (!confirm(L('Switch the AI coach off for your members?', 'सदस्यों के लिए AI कोच बंद करें?'))) return;
  const g = CTX.profile && CTX.profile.gym_id; if (!g) return;
  const ok = await act(() => DB.rpc('set_coach', { p_gym: g, p_enabled: false }), L('Switched off', 'बंद हो गया'));
  if (ok !== null) { bust(); render(); }
}

/* ---------- platform admin: per-gym switch and daily limit ---------- */
async function coachGymForm(id) {
  const g = (await Q.overview()).find((x) => x.gym_id === id); if (!g) return;
  const [st, set] = await Promise.all([DB.rpc('coach_stats', { p_gym: id }).catch(() => null), DB.select('coach_settings', { eq: { gym_id: id } }).catch(() => [])]);
  const s = coachOwnerSummary(st), lim = (set[0] && set[0].daily_limit) || 10;
  const m = openModal({
    title: `${g.name} · ${L('AI coach', 'AI कोच')}`,
    body: `<p style="margin-top:0">${esc(s.on ? L('The AI coach is ON for this gym.', 'इस जिम में AI कोच चालू है।') : L('The AI coach is OFF for this gym.', 'इस जिम में AI कोच बंद है।'))} ${esc(L(`Questions today ${s.today}, last 7 days ${s.week}.`, `आज ${s.today} सवाल, पिछले 7 दिन ${s.week}।`))}</p>
      <label class="fl"><span>${esc(L('Questions per member per day (1 to 50)', 'हर सदस्य के रोज़ के सवाल (1 से 50)'))}</span><input class="in" id="coachLimit" type="number" min="1" max="50" value="${esc(String(lim))}"></label>
      <div class="note">${esc(L('Every question costs money on your AI gateway account. The coach works only when AI_GATEWAY_API_KEY and AI_GATEWAY_MODEL are saved in Supabase (Edge Functions → Secrets); until then members see that it is being set up.', 'हर सवाल पर आपके AI गेटवे अकाउंट से पैसे लगते हैं। कोच तभी चलता है जब Supabase (Edge Functions → Secrets) में AI_GATEWAY_API_KEY और AI_GATEWAY_MODEL सेव हों; तब तक सदस्यों को दिखता है कि यह तैयार हो रहा है।'))}</div>`,
    footer: `<button type="button" class="btn primary" data-o="1">${esc(s.on ? L('Save limit', 'सीमा सेव करें') : L('Switch on', 'चालू करें'))}</button><button type="button" class="btn ${s.on ? 'danger' : ''}" data-o="0" ${s.on ? '' : 'disabled'}>${esc(L('Switch off', 'बंद करें'))}</button>`,
  });
  $$('[data-o]', m.el).forEach((b) => (b.onclick = async () => {
    const limit = Math.round(Number($('#coachLimit', m.el).value));
    if (b.dataset.o === '1' && !(limit >= 1 && limit <= 50)) { toast(L('Limit must be 1 to 50.', 'सीमा 1 से 50 के बीच रखिए।'), 'bad'); return; }
    b.disabled = true;
    const ok = await act(() => DB.rpc('set_coach', { p_gym: id, p_enabled: b.dataset.o === '1', p_limit: b.dataset.o === '1' ? limit : null }), L('Saved', 'सेव हुआ'));
    if (ok !== null) { bust('audit'); m.close(); render(); } else b.disabled = false;
  }));
}
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey && e.target && e.target.id === 'coachIn' && !e.isComposing) { e.preventDefault(); coachSend(); }
});
