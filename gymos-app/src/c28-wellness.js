/* ================= Daily habits: water, meals and sleep, logged by the member. Totals are worked out from the entries ================= */
const WATER_GOAL_ML = 3000;
const MEALS = ['Breakfast', 'Lunch', 'Snack', 'Dinner'], MEAL_HI = { Breakfast: 'नाश्ता', Lunch: 'दोपहर का खाना', Snack: 'स्नैक', Dinner: 'रात का खाना' };
/* typical values for one serving; approximate, so every screen says so: [English, Hindi, serving, kcal, protein g, carbs g, fat g] */
const FOODS = [
  ['Roti', 'रोटी', '1 medium', 120, 3.5, 22, 2.5], ['Cooked rice', 'चावल', '1 katori (150 g)', 195, 4, 43, 0.4], ['Dal', 'दाल', '1 katori (150 g)', 150, 9, 22, 3],
  ['Mixed vegetable sabzi', 'सब्ज़ी', '1 katori (100 g)', 90, 2.5, 9, 5], ['Paneer', 'पनीर', '100 g', 265, 18, 1.2, 20], ['Boiled egg', 'उबला अंडा', '1 large', 78, 6.3, 0.6, 5.3],
  ['Chicken breast, cooked', 'चिकन ब्रेस्ट', '100 g', 165, 31, 0, 3.6], ['Chicken curry', 'चिकन करी', '1 katori (150 g)', 240, 20, 6, 15], ['Milk', 'दूध', '1 glass (250 ml)', 160, 8, 12, 9],
  ['Curd', 'दही', '1 katori (100 g)', 60, 3.5, 4.7, 3.3], ['Banana', 'केला', '1 medium', 105, 1.3, 27, 0.4], ['Apple', 'सेब', '1 medium', 95, 0.5, 25, 0.3],
  ['Oats, cooked', 'ओट्स', '1 bowl (200 g)', 150, 5, 27, 3], ['Poha', 'पोहा', '1 plate (150 g)', 250, 5, 45, 6], ['Idli', 'इडली', '1 piece', 58, 2, 12, 0.4],
  ['Whey protein', 'व्हे प्रोटीन', '1 scoop (30 g)', 120, 24, 3, 1.5], ['Peanuts', 'मूँगफली', '30 g', 170, 7.7, 5, 14], ['Almonds', 'बादाम', '10 nuts', 70, 2.5, 2.6, 6], ['Samosa', 'समोसा', '1 piece', 260, 4, 28, 15],
];
const wlSince = (n) => addDays(todayISO(), -n);
const wlLoad = (memberId, days = 14) => Promise.all([
  DB.select('member_water', { eq: { member_id: memberId }, filters: { drunk_on: 'gte.' + wlSince(days) }, order: 'drunk_on.desc,created_at.desc', limit: 1000 }),
  DB.select('member_meals', { eq: { member_id: memberId }, filters: { eaten_on: 'gte.' + wlSince(days) }, order: 'eaten_on.desc,created_at.desc', limit: 1000 }),
  DB.select('member_sleep', { eq: { member_id: memberId }, filters: { slept_on: 'gte.' + wlSince(days) }, order: 'slept_on.desc', limit: 100 }),
]).then(([water, meals, sleep]) => ({ water, meals, sleep }));

/* pure helpers */
const waterOn = (rows, day) => rows.filter((r) => r.drunk_on === day).reduce((s, r) => s + Number(r.amount_ml), 0);
function mealTotals(rows, day) {
  const t = { kcal: 0, p: 0, c: 0, f: 0, n: 0 };
  rows.filter((r) => r.eaten_on === day).forEach((r) => { t.kcal += Number(r.kcal); t.p += Number(r.protein_g); t.c += Number(r.carbs_g); t.f += Number(r.fat_g); t.n++; });
  ['p', 'c', 'f'].forEach((k) => { t[k] = Math.round(t[k] * 10) / 10; }); return t;
}
/* average hours over nights that were logged in the last n days (null when none) */
function sleepAverage(rows, today, n) {
  const from = addDays(today, -(n - 1)), xs = rows.filter((r) => r.slept_on >= from && r.slept_on <= today);
  return xs.length ? Math.round((xs.reduce((s, r) => s + Number(r.hours), 0) / xs.length) * 10) / 10 : null;
}
const defaultMeal = () => { const h = istParts(new Date().toISOString()).hour; return h < 11 ? 'Breakfast' : h < 16 ? 'Lunch' : h < 19 ? 'Snack' : 'Dinner'; };

function addWater(memberId, ml) {
  return act(() => DB.insert('member_water', { gym_id: gymId(), member_id: memberId, drunk_on: todayISO(), amount_ml: ml }), L(`${ml} ml added`, `${ml} मिली जुड़ा`));
}
function mealForm(memberId, food, after) {
  openForm({
    title: food ? L(food[0], food[1]) : L('Add food', 'खाना जोड़ें'), submitLabel: L('Save', 'सेव करें'),
    values: food ? { food: L(food[0], food[1]), qty: 1, kcal: food[3], protein_g: food[4], carbs_g: food[5], fat_g: food[6], meal: defaultMeal() } : { qty: 1, meal: defaultMeal() },
    fields: [
      { k: 'meal', label: L('Meal', 'भोजन'), type: 'select', options: MEALS.map((m) => ({ v: m, l: L(m, MEAL_HI[m]) })) },
      { k: 'qty', label: L('Servings', 'कितने'), type: 'number', min: 0.5, step: '0.5', check: (v) => (v !== '' && (v < 0.5 || v > 20) ? L('0.5 to 20', '0.5 से 20') : '') },
      { k: 'food', label: L('Food', 'खाना'), req: true, full: true, check: (v) => (v.trim().length < 1 || v.length > 70 ? L('1 to 70 characters', '1 से 70 अक्षर') : '') },
      { k: 'kcal', label: L('Calories per serving', 'कैलोरी (एक सर्विंग)'), type: 'number', req: true, min: 0, check: (v) => (v < 0 || v > 3000 ? L('0 to 3000', '0 से 3000') : '') },
      { k: 'protein_g', label: L('Protein g', 'प्रोटीन ग्राम'), type: 'number', min: 0, check: (v) => (v !== '' && (v < 0 || v > 300) ? L('0 to 300', '0 से 300') : '') },
      { k: 'carbs_g', label: L('Carbs g', 'कार्ब्स ग्राम'), type: 'number', min: 0, check: (v) => (v !== '' && (v < 0 || v > 500) ? L('0 to 500', '0 से 500') : '') },
      { k: 'fat_g', label: L('Fat g', 'फ़ैट ग्राम'), type: 'number', min: 0, check: (v) => (v !== '' && (v < 0 || v > 300) ? L('0 to 300', '0 से 300') : '') },
    ],
    extra: `<p class="muted" style="margin:10px 0 0">${esc(L('Values are typical and approximate. Edit them if you know better.', 'ये आम तौर पर औसत मान हैं। बेहतर पता हो तो बदल दें।'))}</p>`,
    onSubmit: async (v) => {
      const q = v.qty === '' || v.qty == null ? 1 : Number(v.qty), n = (x) => (x === '' || x == null ? 0 : Number(x)), r1 = (x) => Math.round(x * 10) / 10;
      const row = { gym_id: gymId(), member_id: memberId, eaten_on: todayISO(), meal: v.meal, food: (q !== 1 ? `${q}× ` : '') + v.food.trim(), kcal: Math.round(n(v.kcal) * q), protein_g: r1(n(v.protein_g) * q), carbs_g: r1(n(v.carbs_g) * q), fat_g: r1(n(v.fat_g) * q) };
      const ok = await act(() => DB.insert('member_meals', row), L('Saved', 'सेव हुआ')); if (ok) await after(); return !!ok;
    },
  });
}
function sleepForm(memberId, after) {
  openForm({
    title: L('Log last night\'s sleep', 'कल रात की नींद दर्ज करें'), submitLabel: L('Save', 'सेव करें'),
    fields: [
      { k: 'slept_on', label: L('Night of', 'किस रात की'), type: 'date', def: addDays(todayISO(), -1), check: (v) => (v && v > todayISO() ? L('Cannot be in the future', 'आगे की तारीख़ नहीं') : '') },
      { k: 'hours', label: L('Hours slept', 'कितने घंटे सोए'), type: 'number', req: true, min: 0.5, step: '0.5', check: (v) => (v < 0.5 || v > 16 ? L('0.5 to 16 hours', '0.5 से 16 घंटे') : '') },
      { k: 'quality', label: L('How did you feel', 'कैसा महसूस हुआ'), type: 'select', full: true, options: [{ v: '', l: '—' }, ...[1, 2, 3, 4, 5].map((n) => ({ v: String(n), l: `${n} / 5` }))] },
    ],
    onSubmit: async (v) => {
      const row = { gym_id: gymId(), member_id: memberId, slept_on: v.slept_on || addDays(todayISO(), -1), hours: Number(v.hours), quality: v.quality ? Number(v.quality) : null };
      const ok = await act(() => DB.insert('member_sleep', row), L('Saved', 'सेव हुआ'));
      if (ok) await after(); return !!ok;
    },
  });
}
async function deleteHabit(table, id) {
  if (!(await askConfirm(L('Delete this entry?', 'यह एंट्री हटाएँ?'), L('Delete', 'हटाएँ'), 'bad'))) return;
  const ok = await act(() => DB.remove(table, id), L('Deleted', 'हटा दिया')); if (ok) render();
}

function habitsBody(d, own, memberId) {
  const t = todayISO(), ml = waterOn(d.water, t), tot = mealTotals(d.meals, t), pct = Math.min(100, Math.round((ml / WATER_GOAL_ML) * 100));
  const bar = (p, col) => `<div style="height:8px;border-radius:8px;background:var(--line);overflow:hidden;margin:8px 0"><div style="height:100%;width:${p}%;background:${col}"></div></div>`;
  const water = card(L('Water today', 'आज का पानी'), 'pulse', '', `<div style="display:flex;justify-content:space-between;align-items:baseline"><b style="font-size:22px">${esc((ml / 1000).toFixed(2).replace(/\.?0+$/, ''))} L</b><span class="muted">${esc(L(`goal ${WATER_GOAL_ML / 1000} L`, `लक्ष्य ${WATER_GOAL_ML / 1000} लीटर`))}</span></div>${bar(pct, 'var(--crimson)')}`
    + (own ? `<div style="display:flex;gap:8px;flex-wrap:wrap">${[250, 500, 750].map((n) => `<button class="btn sm" data-act="waterAdd" data-id="${esc(memberId)}" data-ml="${n}">+${n} ml</button>`).join('')}</div>` : '')
    + (d.water.filter((r) => r.drunk_on === t).length ? `<ul class="list" style="margin-top:8px">${d.water.filter((r) => r.drunk_on === t).slice(0, 8).map((r) => `<li><div class="grow"><b>${esc(String(r.amount_ml))} ml</b><small>${esc(fmtTime(r.created_at))}</small></div>${own ? `<button class="btn sm" data-act="delHabit" data-t="member_water" data-id="${esc(r.id)}">${esc(L('Delete', 'हटाएँ'))}</button>` : ''}</li>`).join('')}</ul>` : '')
    + `<p class="muted" style="margin:8px 0 0;font-size:12px">${esc(L('A general guide, not medical advice. Your need depends on weather and training.', 'यह सामान्य मार्गदर्शन है, चिकित्सा सलाह नहीं। ज़रूरत मौसम और ट्रेनिंग पर निर्भर है।'))}</p>`);
  const mealRows = MEALS.map((m) => { const rs = d.meals.filter((r) => r.eaten_on === t && r.meal === m); return rs.length ? `<div style="margin-bottom:10px"><div class="muted" style="font-size:12px">${esc(L(m, MEAL_HI[m]))}</div><ul class="list">${rs.map((r) => `<li><div class="grow"><b>${esc(r.food)}</b><small>${esc(`${r.kcal} kcal · P ${num1(r.protein_g)} · C ${num1(r.carbs_g)} · F ${num1(r.fat_g)}`)}</small></div>${own ? `<button class="btn sm" data-act="delHabit" data-t="member_meals" data-id="${esc(r.id)}">${esc(L('Delete', 'हटाएँ'))}</button>` : ''}</li>`).join('')}</ul></div>` : ''; }).join('');
  const food = card(L('Food today', 'आज का खाना'), 'list', '', `<div class="tiles" style="margin-bottom:10px">${tile(L('Calories', 'कैलोरी'), esc(String(tot.kcal)), 'kcal')}${tile(L('Protein', 'प्रोटीन'), esc(num1(tot.p) + ' g'), '')}${tile(L('Carbs', 'कार्ब्स'), esc(num1(tot.c) + ' g'), '')}${tile(L('Fat', 'फ़ैट'), esc(num1(tot.f) + ' g'), '')}</div>`
    + (own ? `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px">${FOODS.map((f, i) => `<button class="btn sm" data-act="quickFood" data-id="${esc(memberId)}" data-i="${i}" title="${esc(f[2])}">${esc(L(f[0], f[1]))}</button>`).join('')}<button class="btn sm pri" data-act="customFood" data-id="${esc(memberId)}">${ic('plus')} ${esc(L('Other food', 'दूसरा खाना'))}</button></div>` : '')
    + (mealRows || `<p class="muted" style="margin:0">${esc(L('Nothing logged today.', 'आज कुछ दर्ज नहीं।'))}</p>`) + `<p class="muted" style="margin:8px 0 0;font-size:12px">${esc(L('Typical values per serving, approximate.', 'हर सर्विंग के औसत मान, अनुमानित।'))}</p>`);
  const avg = sleepAverage(d.sleep, t, 7), nights = [...Array(7)].map((_, i) => addDays(t, -(6 - i))), byDay = new Map(d.sleep.map((r) => [r.slept_on, r]));
  const sleep = card(L('Sleep', 'नींद'), 'moon', own ? `<button class="btn sm" data-act="logSleep" data-id="${esc(memberId)}">${ic('plus')} ${esc(L('Log', 'दर्ज करें'))}</button>` : '', `<p style="margin:0 0 8px"><b>${avg == null ? '—' : esc(num1(avg) + ' h')}</b> <span class="muted">${esc(L('average of the nights you logged, last 7 days', 'पिछले 7 दिन में दर्ज रातों का औसत'))}</span></p>`
    + `<div style="display:flex;gap:6px;align-items:flex-end;height:90px">${nights.map((n) => { const r = byDay.get(n), h = r ? Number(r.hours) : 0; return `<div style="flex:1;text-align:center"><div title="${esc(fmtDate(n))}" style="height:${Math.round((h / 12) * 70)}px;min-height:${h ? 3 : 0}px;background:${h >= 7 ? 'var(--ok)' : 'var(--crimson)'};border-radius:4px"></div><small class="muted">${r ? esc(num1(h)) : '·'}</small></div>`; }).join('')}</div>`
    + (d.sleep.length ? `<ul class="list" style="margin-top:8px">${d.sleep.slice(0, 5).map((r) => `<li><div class="grow"><b>${esc(fmtDate(r.slept_on))}</b><small>${esc(num1(r.hours) + ' h')}${r.quality ? ' · ' + esc(`${r.quality}/5`) : ''}</small></div>${own ? `<button class="btn sm" data-act="delHabit" data-t="member_sleep" data-id="${esc(r.id)}">${esc(L('Delete', 'हटाएँ'))}</button>` : ''}</li>`).join('')}</ul>` : '')
    + `<p class="muted" style="margin:8px 0 0;font-size:12px">${esc(L('Most adults feel best with 7 to 9 hours. A general guide, not medical advice.', 'ज़्यादातर वयस्कों को 7 से 9 घंटे ठीक रहते हैं। सामान्य मार्गदर्शन, चिकित्सा सलाह नहीं।'))}</p>`);
  return `<div class="grid2">${water}${sleep}</div><div style="height:14px"></div>${food}`;
}
async function vMyHabits() {
  const m = (await Q.members())[0]; if (!m) return noMember();
  return pageHead(gymName(), L('Daily habits', 'रोज़ की आदतें'), L('Water, food and sleep in one place.', 'पानी, खाना और नींद एक जगह।')) + habitsBody(await wlLoad(m.id), true, m.id);
}
async function habitsModal(memberId) {
  const m = (await Q.members()).find((x) => x.id === memberId); if (!m) return;
  const d = await wlLoad(memberId); closeAllModals(); openModal({ title: L(`${m.name}: daily habits`, `${m.name}: रोज़ की आदतें`), wide: true, body: habitsBody(d, false, memberId) });
}
