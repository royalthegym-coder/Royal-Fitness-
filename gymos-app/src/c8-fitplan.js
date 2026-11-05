/* ================= Diet + workout plans =================
   Staff add a member's body details, press Generate (Edge Function generate-plan: numbers come from fixed rules, never guessed),
   review the draft, then Publish. Only published plans are visible in the member's own account. */
const tx = (o) => (o ? (LANG === 'hi' ? o.hi || o.en : o.en || o.hi) || '' : '');
const FIT_GOALS = () => [{ v: 'fat_loss', l: L('Fat loss', 'फ़ैट लॉस') }, { v: 'muscle_gain', l: L('Muscle gain', 'मसल गेन') }, { v: 'strength', l: L('Strength', 'ताक़त') }, { v: 'maintain', l: L('Stay fit', 'फ़िट रहना') }, { v: 'endurance', l: L('Endurance', 'स्टैमिना') }];
const planMemberFit = (id) => DB.select('member_fit', { eq: { member_id: id }, limit: 1 }).then((r) => r[0] || null);
const planRows = (id, extra = {}) => DB.select('member_plans', { eq: { member_id: id, ...extra }, order: 'created_at.desc', limit: 20 });

const GEN_ERR = {
  missing_profile: ['Add the body details first.', 'पहले शरीर की जानकारी भरिए।'], missing_age: ['Age is missing.', 'उम्र नहीं भरी है।'], missing_height_cm: ['Height is missing.', 'ऊँचाई नहीं भरी है।'], missing_weight_kg: ['Weight is missing.', 'वज़न नहीं भरा है।'],
  pregnancy: ['A plan is not generated automatically during pregnancy or breastfeeding. Please refer the member to a doctor.', 'गर्भावस्था या स्तनपान में प्लान अपने-आप नहीं बनता। सदस्य को डॉक्टर के पास भेजिए।'],
  staff_only: ['Only gym staff can do this.', 'यह सिर्फ़ जिम स्टाफ़ कर सकता है।'], not_found: ['Member not found.', 'सदस्य नहीं मिला।'], save_failed: ['Could not save the plan. The gym subscription may have expired.', 'प्लान सेव नहीं हो सका। जिम का सब्सक्रिप्शन खत्म हो सकता है।'],
};
async function generatePlanFn(memberId) {
  if (SESSION && SESSION.expires_at && SESSION.expires_at - 30 < Date.now() / 1000) await refreshSession();
  const res = await rawFetch('/functions/v1/generate-plan', { method: 'POST', headers: { apikey: CFG.key, Authorization: 'Bearer ' + (SESSION && SESSION.access_token), 'Content-Type': 'application/json' }, body: JSON.stringify({ member_id: memberId, seed: Math.floor(Math.random() * 2147483647) }) });
  const j = await res.json().catch(() => ({}));
  if (res.status === 401) { saveSession(null); if (typeof onSignedOut === 'function') onSignedOut(); throw new ApiError('session expired', 401, 'jwt'); }
  if (!res.ok) { const m = GEN_ERR[j.error]; const e = new ApiError(m ? L(m[0], m[1]) : 'failed', res.status, 'fn'); e.friendly = m ? L(m[0], m[1]) : null; throw e; }
  return j;
}

/* ---------- rendering (shared by staff and the member's own page) ---------- */
function planHtml(row, staff) {
  const s = row.summary || {}, c = row.content || {};
  const review = staff && row.needs_review && (s.review || []).length ? `<div class="note" style="border-color:var(--crimson);margin-bottom:10px"><b>${esc(L('Needs review before publishing', 'पब्लिश से पहले जाँच ज़रूरी'))}</b><ul style="margin:6px 0 0;padding-left:18px">${s.review.map((r) => `<li>${esc(tx(r))}</li>`).join('')}</ul></div>` : '';
  const coach = c.coach ? `<div class="note" style="margin-bottom:10px">${c.coach.note ? `<p style="margin:0 0 6px">${esc(tx(c.coach.note))}</p>` : ''}${(c.coach.tips || []).length ? `<ul style="margin:0;padding-left:18px">${c.coach.tips.map((t) => `<li>${esc(tx(t))}</li>`).join('')}</ul>` : ''}</div>` : '';
  const notes = (arr) => (arr && arr.length ? `<ul class="muted" style="padding-left:18px;margin:10px 0 0;display:grid;gap:4px">${arr.map((n) => `<li>${esc(tx(n))}</li>`).join('')}</ul>` : '');
  const pn = (s.notes || []);
  if (row.kind === 'diet') {
    const p = s.provides || {};
    const tiles = `<div class="tiles" style="margin-bottom:12px">${tile(L('Calories / day', 'कैलोरी / दिन'), esc(String(s.kcal)), p.kcal ? esc(L(`plan gives ${p.kcal}`, `प्लान में ${p.kcal}`)) : '')}${tile(L('Protein', 'प्रोटीन'), esc(s.protein + ' g'), p.p ? esc(L(`plan gives ${p.p} g`, `प्लान में ${p.p} g`)) : '')}${tile(L('Carbs', 'कार्ब्स'), esc(s.carbs + ' g'))}${tile(L('Fat', 'फ़ैट'), esc(s.fat + ' g'))}</div>`;
    const meals = (c.meals || []).map((m) => `<div style="margin-bottom:12px"><b>${esc(tx(m.name))}</b> <span class="muted">· ${esc(m.time || '')}</span>${m.options.map((o, i) => `<div style="margin:4px 0 0;padding:8px 10px;border:1px solid var(--line);border-radius:8px"><b style="font-size:12px">${esc(L('Option', 'विकल्प'))} ${'AB'[i]}</b> · <span class="muted">${esc(o.kcal)} kcal · P ${esc(o.p)} g</span><div>${o.items.map((it) => `${esc(it.qty)} ${esc(it.unit)} ${esc(tx(it.food))}`).join(' + ')}</div></div>`).join('')}</div>`).join('');
    return review + coach + `<p class="muted" style="margin:0 0 8px">${esc(L('BMI', 'BMI'))} ${esc(s.bmi)} · ${esc(tx(s.bmi_label))} · ${esc(s.weight_kg)} kg · ${esc(s.height_cm)} cm</p>` + tiles + notes(pn) + `<div style="height:10px"></div>` + meals + notes(c.notes);
  }
  const days = (c.days || []).map((d) => `<div style="margin-bottom:12px"><b>${esc(tx(d.day))} · ${esc(tx(d.focus))}</b><div style="overflow-x:auto"><table class="t" style="width:100%;margin-top:4px"><thead><tr><th>${esc(L('Exercise', 'एक्सरसाइज़'))}</th><th>${esc(L('Sets', 'सेट'))}</th><th>${esc(L('Reps', 'रेप'))}</th><th>${esc(L('Rest', 'आराम'))}</th></tr></thead><tbody>${d.exercises.map((e) => `<tr><td>${esc(e.name)}</td><td>${esc(e.sets)}</td><td>${esc(e.reps)}</td><td>${esc(e.rest || '')}</td></tr>`).join('')}</tbody></table></div></div>`).join('');
  return review + coach + days + (c.cardio ? `<p><b>${esc(L('Cardio', 'कार्डियो'))}:</b> ${esc(tx(c.cardio))}</p>` : '') + notes(c.notes);
}
function planText(row, name) {
  const s = row.summary || {}, c = row.content || {}, head = `${gymName()} · ${name || ''}\n${tx(s.title)}\n`;
  if (row.kind === 'diet') return head + `${s.kcal} kcal · P ${s.protein} g · C ${s.carbs} g · F ${s.fat} g\n\n` + (c.meals || []).map((m) => `${tx(m.name)} (${m.time}):\n A) ${m.options[0].items.map((i) => `${i.qty} ${i.unit} ${tx(i.food)}`).join(' + ')}\n B) ${m.options[1] ? m.options[1].items.map((i) => `${i.qty} ${i.unit} ${tx(i.food)}`).join(' + ') : ''}`).join('\n') + '\n\n' + (c.notes || []).map((n) => '• ' + tx(n)).join('\n');
  return head + '\n' + (c.days || []).map((d) => `${tx(d.day)} - ${tx(d.focus)}\n` + d.exercises.map((e) => ` • ${e.name}: ${e.sets} x ${e.reps}`).join('\n')).join('\n\n') + (c.cardio ? '\n\n' + tx(c.cardio) : '');
}
function printPlanHtml(html, title) {
  const area = $('#printArea'); area.innerHTML = `<h2 style="font-family:inherit">${esc(title)}</h2>${html}`;
  document.body.classList.add('printing');
  const done = () => { document.body.classList.remove('printing'); area.innerHTML = ''; window.removeEventListener('afterprint', done); };
  window.addEventListener('afterprint', done); window.print();
}
function planViewModal(row, member, staff) {
  const name = member ? member.name : '';
  const mod = openModal({
    title: `${tx((row.summary || {}).title) || row.title}${name ? ' · ' + name : ''}`, wide: true,
    body: `<div id="planBody">${planHtml(row, staff)}</div><p class="muted" style="margin-top:12px;font-size:12px">${esc(L('General fitness guidance, not medical advice. If you have a health condition, check with your doctor first. Stop any exercise that causes sharp pain.', 'यह सामान्य फ़िटनेस मार्गदर्शन है, चिकित्सा सलाह नहीं। कोई स्वास्थ्य समस्या हो तो पहले डॉक्टर से पूछिए। तेज़ दर्द हो तो एक्सरसाइज़ रोक दीजिए।'))}</p>`,
    footer: `${member && member.phone && staff ? `<a class="btn wa" target="_blank" rel="noreferrer" href="${esc(waLink(member.phone, planText(row, name)))}">${ic('msg')} WhatsApp</a>` : ''}<button type="button" class="btn" data-cp>${ic('copy')} ${esc(L('Copy', 'कॉपी'))}</button><button type="button" class="btn primary" data-pr>${esc(L('Print / PDF', 'प्रिंट / PDF'))}</button>`,
  });
  $('[data-cp]', mod.el).onclick = () => copyText(planText(row, name), L('Plan copied', 'प्लान कॉपी हुआ'));
  $('[data-pr]', mod.el).onclick = () => printPlanHtml(planHtml(row, false), `${gymName()} · ${name} · ${tx((row.summary || {}).title)}`);
}

/* ---------- staff: body details ---------- */
async function fitForm(memberId, after) {
  const [members, fit] = await Promise.all([Q.members(), planMemberFit(memberId)]), m = members.find((x) => x.id === memberId); if (!m) return;
  const num = (k, label, min, extra = {}) => ({ k, label, type: 'number', min, step: 'any', ...extra });
  const sel = (k, label, opts, def) => ({ k, label, type: 'select', options: opts.map(([v, l]) => ({ v, l })), def });
  openForm({
    title: `${L('Body details', 'शरीर की जानकारी')} · ${m.name}`, values: fit || {},
    fields: [
      num('age', L('Age (years)', 'उम्र (साल)'), 10, { req: true, check: (v) => (v >= 10 && v <= 90 ? '' : '10 – 90') }),
      num('height_cm', L('Height (cm)', 'ऊँचाई (सेमी)'), 100, { req: true, check: (v) => (v >= 100 && v <= 230 ? '' : '100 – 230') }),
      num('weight_kg', L('Weight (kg)', 'वज़न (किलो)'), 25, { req: true, check: (v) => (v >= 25 && v <= 250 ? '' : '25 – 250') }),
      num('target_weight_kg', L('Target weight (kg, optional)', 'लक्ष्य वज़न (किलो, ऐच्छिक)'), 25, { check: (v) => (v === '' || (v >= 25 && v <= 250) ? '' : '25 – 250') }),
      sel('goal', L('Goal', 'लक्ष्य'), FIT_GOALS().map((g) => [g.v, g.l]), fit ? fit.goal : 'fat_loss'),
      sel('diet_pref', L('Food preference', 'खाने की पसंद'), [['veg', L('Vegetarian', 'शाकाहारी')], ['egg', L('Eggetarian', 'अंडा खाने वाले')], ['nonveg', L('Non-vegetarian', 'मांसाहारी')], ['vegan', L('Vegan', 'वीगन')]], fit ? fit.diet_pref : 'veg'),
      sel('activity', L('Daily activity (outside the gym)', 'दिन भर की गतिविधि (जिम के बाहर)'), [['low', L('Mostly sitting', 'ज़्यादातर बैठकर')], ['moderate', L('Some walking / standing', 'थोड़ा चलना / खड़े रहना')], ['high', L('On feet / physical work', 'ज़्यादातर खड़े / शारीरिक काम')]], fit ? fit.activity : 'moderate'),
      sel('experience', L('Training experience', 'ट्रेनिंग का अनुभव'), [['beginner', L('Beginner (under 6 months)', 'शुरुआती (6 महीने से कम)')], ['intermediate', L('Intermediate (6 months - 2 years)', 'मध्यम (6 महीने - 2 साल)')], ['advanced', L('Advanced (2+ years)', 'अनुभवी (2+ साल)')]], fit ? fit.experience : 'beginner'),
      sel('days_per_week', L('Days per week', 'हफ़्ते में दिन'), [2, 3, 4, 5, 6].map((d) => [d, String(d)]), fit ? fit.days_per_week : 4),
      sel('session_min', L('Minutes per session', 'एक सेशन के मिनट'), [30, 45, 60, 75, 90].map((d) => [d, String(d)]), fit ? fit.session_min : 60),
      sel('equipment', L('Where', 'कहाँ'), [['gym', L('Gym', 'जिम')], ['home', L('Home (no equipment)', 'घर (बिना उपकरण)')]], fit ? fit.equipment : 'gym'),
      { k: 'injuries', label: L('Injuries / pain (knee, back, shoulder…)', 'चोट / दर्द (घुटना, कमर, कंधा…)'), type: 'textarea', full: true },
      { k: 'conditions', label: L('Health conditions (diabetes, BP, thyroid…) – a doctor must approve the plan', 'स्वास्थ्य समस्या (डायबिटीज़, BP, थायरॉइड…) – प्लान पर डॉक्टर की मंज़ूरी ज़रूरी'), type: 'textarea', full: true },
      { k: 'allergies', label: L('Food allergies', 'खाने की एलर्जी'), type: 'textarea', full: true },
    ],
    onSubmit: async (v) => {
      const t = (x) => (x && String(x).trim() ? String(x).trim().slice(0, 300) : null);
      const row = { member_id: memberId, gym_id: gymId(), age: Math.round(v.age), height_cm: v.height_cm, weight_kg: v.weight_kg, target_weight_kg: v.target_weight_kg === '' ? null : v.target_weight_kg, goal: v.goal, diet_pref: v.diet_pref, activity: v.activity, experience: v.experience, days_per_week: Number(v.days_per_week), session_min: Number(v.session_min), equipment: v.equipment, injuries: t(v.injuries), conditions: t(v.conditions), allergies: t(v.allergies), updated_at: new Date().toISOString() };
      const ok = await act(() => api('/rest/v1/member_fit?on_conflict=member_id', { method: 'POST', body: row, headers: { Prefer: 'resolution=merge-duplicates,return=representation' } }), L('Saved', 'सेव हुआ'));
      if (ok) { if (after) after(); else fitPlanModal(memberId); } return !!ok;
    },
  });
}

/* ---------- staff: generate, review, publish ---------- */
async function fitPlanModal(memberId) {
  const [members, fit, rows] = await Promise.all([Q.members(), planMemberFit(memberId).catch(() => null), planRows(memberId).catch(() => [])]), m = members.find((x) => x.id === memberId); if (!m) return;
  closeAllModals();
  const lock = CTX.locked ? 'disabled' : '', goal = fit ? (FIT_GOALS().find((g) => g.v === fit.goal) || {}).l : '';
  const kindLab = { diet: L('Diet', 'डाइट'), workout: L('Workout', 'वर्कआउट') };
  const stBadge = (r) => badge(r.status === 'published' ? L('Published', 'पब्लिश') : r.status === 'draft' ? L('Draft', 'ड्राफ़्ट') : L('Old', 'पुराना'), r.status === 'published' ? 'ok' : r.status === 'draft' ? 'info' : 'mute');
  const list = rows.filter((r) => r.status !== 'archived');
  const body = `<p class="muted" style="margin:0 0 10px">${fit ? esc(`${fit.age} ${L('yrs', 'साल')} · ${fit.height_cm} cm · ${fit.weight_kg} kg · ${goal} · ${fit.days_per_week} ${L('days/week', 'दिन/हफ़्ता')}`) : esc(L('Body details are not added yet.', 'शरीर की जानकारी अभी नहीं भरी।'))}</p>
    ${list.length ? `<ul class="list">${list.map((r) => `<li><div class="grow"><b>${esc(kindLab[r.kind])} · ${esc(tx((r.summary || {}).title) || r.title)}</b><small>${esc(fmtDate(istDate(r.created_at)))}${r.source === 'ai' ? ' · ' + esc(L('with coach note', 'कोच नोट के साथ')) : ''}${r.needs_review ? ' · ' + esc(L('needs review', 'जाँच ज़रूरी')) : ''}</small></div>${stBadge(r)}<button class="btn sm" data-v="${esc(r.id)}">${esc(L('View', 'देखें'))}</button>${r.status === 'draft' ? `<button class="btn sm primary" data-pub="${esc(r.id)}" ${lock}>${esc(L('Publish', 'पब्लिश'))}</button><button class="btn sm" data-del="${esc(r.id)}" ${lock}>${esc(L('Delete', 'हटाएँ'))}</button>` : `<button class="btn sm" data-unpub="${esc(r.id)}" ${lock}>${esc(L('Unpublish', 'वापस लें'))}</button>`}</li>`).join('')}</ul>` : empty(L('No plan yet', 'अभी कोई प्लान नहीं'), L('Add body details, then press Generate. Review the draft and publish it so the member sees it in their account.', 'शरीर की जानकारी भरिए, फिर Generate दबाइए। ड्राफ़्ट देखकर पब्लिश कीजिए, तब सदस्य को अपने अकाउंट में दिखेगा।'))}
    ${m.profile_id ? '' : `<p class="muted" style="margin-top:10px">${esc(L('This member has no app login yet, so create a login to let them see the plan. You can also share it on WhatsApp.', 'इस सदस्य का ऐप लॉगिन नहीं है, इसलिए प्लान दिखाने के लिए लॉगिन बनाइए। आप इसे WhatsApp पर भी भेज सकते हैं।'))}</p>`}`;
  const mod = openModal({
    title: `${L('Diet & workout', 'डाइट और वर्कआउट')} · ${m.name}`, wide: true, body,
    footer: `<button type="button" class="btn" data-fit ${lock}>${ic('pencil')} ${esc(L('Body details', 'शरीर की जानकारी'))}</button><button type="button" class="btn primary" data-gen ${fit && !CTX.locked ? '' : 'disabled'}>${ic('pulse')} ${esc(L('Generate plan', 'प्लान बनाएँ'))}</button>`,
  });
  $('[data-fit]', mod.el).onclick = () => { mod.close(); fitForm(memberId); };
  $('[data-gen]', mod.el).onclick = async (ev) => {
    const b = ev.currentTarget; b.disabled = true; b.textContent = L('Generating…', 'बन रहा है…');
    try { const r = await generatePlanFn(memberId); toast(r.needs_review ? L('Draft ready. It needs a review before publishing.', 'ड्राफ़्ट तैयार। पब्लिश से पहले जाँच ज़रूरी है।') : L('Draft ready. Review and publish.', 'ड्राफ़्ट तैयार। देखकर पब्लिश कीजिए।')); mod.close(); fitPlanModal(memberId); }
    catch (e) { toast(friendlyError(e), 'bad'); b.disabled = false; b.textContent = L('Generate plan', 'प्लान बनाएँ'); }
  };
  $$('[data-v]', mod.el).forEach((b) => (b.onclick = () => planViewModal(rows.find((r) => r.id === b.dataset.v), m, true)));
  $$('[data-pub]', mod.el).forEach((b) => (b.onclick = async () => {
    const r = rows.find((x) => x.id === b.dataset.pub);
    if (r.needs_review && !(await askConfirm(L('This plan needs a review (health condition, allergy or age). Publish only after the doctor or trainer has approved it. Publish now?', 'इस प्लान की जाँच ज़रूरी है (स्वास्थ्य समस्या, एलर्जी या उम्र)। डॉक्टर या ट्रेनर की मंज़ूरी के बाद ही पब्लिश कीजिए। अभी पब्लिश करें?'), L('Publish', 'पब्लिश'), 'primary'))) return;
    const ok = await act(() => DB.rpc('publish_member_plan', { p: r.id }), L('Published. The member can see it now.', 'पब्लिश हो गया। सदस्य को अब दिखेगा।'));
    if (ok) fitPlanModal(memberId);
  }));
  $$('[data-unpub]', mod.el).forEach((b) => (b.onclick = async () => { const ok = await act(() => DB.rpc('unpublish_member_plan', { p: b.dataset.unpub }), L('Taken back. The member no longer sees it.', 'वापस ले लिया। सदस्य को अब नहीं दिखेगा।')); if (ok) fitPlanModal(memberId); }));
  $$('[data-del]', mod.el).forEach((b) => (b.onclick = async () => { if (!(await askConfirm(L('Delete this draft?', 'यह ड्राफ़्ट हटाएँ?'), L('Delete', 'हटाएँ')))) return; const ok = await act(() => DB.remove('member_plans', b.dataset.del), L('Deleted', 'हटाया')); if (ok) fitPlanModal(memberId); }));
}

/* ---------- member's own page: published plans, while the membership is active ---------- */
async function mineFitCards(m) {
  let rows = []; try { rows = await planRows(m.id, { status: 'published' }); } catch (e) { return ''; }
  if (!rows.length) return '';
  if (memberState(m) === 'Expired') return `<div style="height:14px"></div>` + card(L('My diet & workout plan', 'मेरा डाइट और वर्कआउट प्लान'), 'pulse', '', empty(L('Renew your membership to see your plan', 'प्लान देखने के लिए सदस्यता रिन्यू कीजिए'), L('Your plan is saved and will be back as soon as the membership is renewed.', 'आपका प्लान सुरक्षित है, सदस्यता रिन्यू होते ही फिर दिखेगा।')));
  const latest = ['diet', 'workout'].map((k) => rows.find((r) => r.kind === k)).filter(Boolean);
  window.__minePlans = latest;
  return `<div style="height:14px"></div>` + card(L('My diet & workout plan', 'मेरा डाइट और वर्कआउट प्लान'), 'pulse', '', `<ul class="list">${latest.map((r, i) => `<li class="click" data-act="openMyPlan" data-i="${i}"><div class="grow"><b>${esc(tx((r.summary || {}).title) || r.title)}</b><small>${esc(L('Updated', 'अपडेट'))} ${esc(fmtDate(r.published_at ? istDate(r.published_at) : istDate(r.created_at)))}</small></div>${ic('right')}</li>`).join('')}</ul>`);
}
