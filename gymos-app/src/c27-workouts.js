/* ================= Workout log: sets, reps and weight by the member; personal records and weekly volume worked out from the entries ================= */
const WK_COMMON = ['Squat', 'Bench press', 'Deadlift', 'Overhead press', 'Barbell row', 'Pull-up', 'Push-up', 'Lat pulldown', 'Leg press', 'Dumbbell curl', 'Triceps pushdown', 'Plank (seconds)', 'Treadmill (minutes)'];
const wkOf = (memberId) => DB.select('member_workouts', { eq: { member_id: memberId }, order: 'done_on.desc,created_at.desc', limit: 1000 });
const wkKey = (s) => String(s).trim().replace(/\s+/g, ' ').toLowerCase();
const wkName = (s) => String(s).trim().replace(/\s+/g, ' ');

/* Epley estimate, only meaningful for 1 to 10 reps with real weight */
const est1RM = (w, r) => (w > 0 && r >= 1 && r <= 10 ? (r === 1 ? w : w * (1 + r / 30)) : 0);

/* pure: rows newest first -> best set per exercise (heaviest, then most reps; bodyweight sets compare by reps), sessions, weekly volume */
function workoutStats(rows, today) {
  const best = new Map();
  rows.forEach((r) => {
    const k = wkKey(r.exercise), w = Number(r.weight_kg), reps = Number(r.reps), cur = best.get(k);
    if (!cur || w > cur.weight || (w === cur.weight && reps > cur.reps)) best.set(k, { name: cur ? cur.name : wkName(r.exercise), weight: w, reps, e1rm: est1RM(w, reps), date: r.done_on, id: r.id });
  });
  /* the name shown is the casing used first (oldest entry) */
  [...rows].reverse().forEach((r) => { const b = best.get(wkKey(r.exercise)); if (b && !b.named) { b.name = wkName(r.exercise); b.named = true; } });
  const vol = (a, b) => Math.round(rows.filter((r) => r.done_on >= a && r.done_on <= b).reduce((s, r) => s + Number(r.sets) * Number(r.reps) * Number(r.weight_kg), 0));
  const cur = [addDays(today, -6), today], prev = [addDays(today, -13), addDays(today, -7)];
  const days = (a, b) => new Set(rows.filter((r) => r.done_on >= a && r.done_on <= b).map((r) => r.done_on)).size;
  return { best, volume: [vol(cur[0], cur[1]), vol(prev[0], prev[1])], sessions: [days(cur[0], cur[1]), days(prev[0], prev[1])], isPR: (r) => { const b = best.get(wkKey(r.exercise)); return !!b && b.id === r.id && Number(r.weight_kg) > 0; } };
}

function workoutForm(memberId, rows, after) {
  const seen = []; rows.forEach((r) => { const n = wkName(r.exercise); if (!seen.some((x) => wkKey(x) === wkKey(n))) seen.push(n); });
  const names = [...seen, ...WK_COMMON.filter((c) => !seen.some((x) => wkKey(x) === wkKey(c)))];
  const last = rows[0];
  openForm({
    title: L('Log an exercise', 'एक्सरसाइज़ दर्ज करें'), submitLabel: L('Save', 'सेव करें'),
    values: last ? { sets: last.sets, reps: last.reps } : { sets: 3, reps: 10 },
    fields: [
      { k: 'done_on', label: L('Date', 'तारीख़'), type: 'date', def: todayISO(), check: (v) => (v && v > todayISO() ? L('Cannot be in the future', 'आगे की तारीख़ नहीं') : '') },
      { k: 'exercise', label: L('Exercise', 'एक्सरसाइज़'), req: true, full: true, list: names, check: (v) => (wkName(v).length < 1 || wkName(v).length > 80 ? L('1 to 80 characters', '1 से 80 अक्षर') : '') },
      { k: 'sets', label: L('Sets', 'सेट'), type: 'number', req: true, min: 1, check: (v) => (!Number.isInteger(Number(v)) || v < 1 || v > 30 ? L('Whole number, 1 to 30', 'पूरी संख्या, 1 से 30') : '') },
      { k: 'reps', label: L('Reps', 'रेप्स'), type: 'number', req: true, min: 1, check: (v) => (!Number.isInteger(Number(v)) || v < 1 || v > 200 ? L('Whole number, 1 to 200', 'पूरी संख्या, 1 से 200') : '') },
      { k: 'weight_kg', label: L('Weight (kg), 0 for body weight', 'वज़न (किग्रा), बॉडी वेट के लिए 0'), type: 'number', min: 0, step: '0.5', full: true, def: last ? Number(last.weight_kg) : 0, check: (v) => (v === '' ? '' : v < 0 || v > 1000 ? L('0 to 1000', '0 से 1000') : '') },
      { k: 'note', label: L('Note', 'नोट'), full: true, check: (v) => (v.length > 200 ? L('Up to 200 characters', 'अधिकतम 200 अक्षर') : '') },
    ],
    onSubmit: async (v) => {
      const row = { gym_id: gymId(), member_id: memberId, done_on: v.done_on || todayISO(), exercise: wkName(v.exercise), sets: Number(v.sets), reps: Number(v.reps), weight_kg: v.weight_kg === '' || v.weight_kg == null ? 0 : Number(v.weight_kg), note: v.note ? v.note.trim() : null };
      const before = workoutStats(rows, todayISO()).best.get(wkKey(row.exercise));
      const ok = await act(() => DB.insert('member_workouts', row), L('Saved', 'सेव हुआ'));
      if (!ok) return false;
      const isPR = row.weight_kg > 0 && (!before || row.weight_kg > before.weight || (row.weight_kg === before.weight && row.reps > before.reps));
      if (isPR && before) toast(L('New personal record!', 'नया पर्सनल रिकॉर्ड!'), 'ok');
      if (after) await after(); else render();
      return true;
    },
  });
}
async function deleteWorkout(id) {
  if (!(await askConfirm(L('Delete this entry?', 'यह एंट्री हटाएँ?'), L('Delete', 'हटाएँ'), 'bad'))) return;
  const ok = await act(() => DB.remove('member_workouts', id), L('Deleted', 'हटा दिया')); if (ok) render();
}

/* shared body: staff see it read-only inside the member modal, the member sees it on their page */
function workoutBody(rows, own, memberId) {
  if (!rows.length) return empty(L('No workouts logged yet', 'अभी कोई वर्कआउट दर्ज नहीं'), own ? L('Log your sets after each session to see your records and weekly volume.', 'हर सेशन के बाद अपने सेट दर्ज करें, फिर रिकॉर्ड और साप्ताहिक वॉल्यूम दिखेंगे।') : L('This member has not logged any workouts yet.', 'इस सदस्य ने अभी कोई वर्कआउट दर्ज नहीं किया।'), own ? `<button class="btn pri" data-act="addWorkout" data-id="${esc(memberId)}">${esc(L('Log an exercise', 'एक्सरसाइज़ दर्ज करें'))}</button>` : '');
  const st = workoutStats(rows, todayISO()), prs = [...st.best.values()].sort((a, b) => b.weight - a.weight || b.reps - a.reps).slice(0, 8);
  const chg = (p) => { const c = pctChange(p[0], p[1]); return c == null ? esc(L('no data last week', 'पिछले हफ़्ते डेटा नहीं')) : `<span style="color:${c >= 0 ? 'var(--ok)' : 'var(--crimson)'}">${c > 0 ? '+' : c < 0 ? '−' : ''}${Math.abs(c)}%</span> ${esc(L('vs last week', 'पिछले हफ़्ते से'))}`; };
  const byDate = new Map(); rows.slice(0, 120).forEach((r) => { if (!byDate.has(r.done_on)) byDate.set(r.done_on, []); byDate.get(r.done_on).push(r); });
  return `<div class="tiles" style="margin-bottom:12px">${tile(L('Sessions, last 7 days', 'पिछले 7 दिन के सेशन'), st.sessions[0], chg(st.sessions))}${tile(L('Volume, last 7 days', 'पिछले 7 दिन का वॉल्यूम'), esc(st.volume[0].toLocaleString('en-IN') + ' kg'), chg(st.volume))}</div>`
    + card(L('Personal records', 'पर्सनल रिकॉर्ड'), 'crown', '', `<ul class="list">${prs.map((b) => `<li><div class="grow"><b>${esc(b.name)}</b><small>${esc(fmtDate(b.date))}${b.e1rm ? ` · ${esc(L('est. 1 rep max', 'अनुमानित 1 रेप मैक्स'))} ${esc(num1(b.e1rm))} kg` : ''}</small></div><b>${esc(b.weight > 0 ? `${num1(b.weight)} kg × ${b.reps}` : `${b.reps} ${L('reps', 'रेप्स')}`)}</b></li>`).join('')}</ul>`)
    + `<div style="height:12px"></div>` + card(L('Log', 'लॉग'), 'list', '', [...byDate.entries()].map(([d, rs]) => `<div style="margin-bottom:12px"><div class="muted" style="font-size:12px;margin-bottom:4px">${esc(fmtDate(d))}</div><ul class="list">${rs.map((r) => `<li><div class="grow"><b>${esc(r.exercise)}</b>${st.isPR(r) ? ` ${badge(L('PR', 'रिकॉर्ड'), 'ok')}` : ''}<small>${esc(`${r.sets} × ${r.reps}${Number(r.weight_kg) > 0 ? ' @ ' + num1(r.weight_kg) + ' kg' : ''}`)}${r.note ? ' · ' + esc(r.note) : ''}</small></div>${own ? `<button class="btn sm" data-act="delWorkout" data-id="${esc(r.id)}">${esc(L('Delete', 'हटाएँ'))}</button>` : ''}</li>`).join('')}</ul></div>`).join(''));
}

async function vMyWorkouts() {
  const m = (await Q.members())[0]; if (!m) return noMember();
  const rows = await wkOf(m.id);
  return pageHead(gymName(), L('Workout log', 'वर्कआउट लॉग'), L('Your sets, reps and weights, with personal records.', 'आपके सेट, रेप्स और वज़न, पर्सनल रिकॉर्ड के साथ।'), rows.length ? `<button class="btn pri" data-act="addWorkout" data-id="${esc(m.id)}">${ic('plus')}${esc(L('Add', 'जोड़ें'))}</button>` : '')
    + workoutBody(rows, true, m.id);
}
async function workoutModal(memberId) {
  const members = await Q.members(), m = members.find((x) => x.id === memberId); if (!m) return;
  const rows = await wkOf(memberId);
  closeAllModals(); openModal({ title: L(`${m.name}: workouts`, `${m.name}: वर्कआउट`), wide: true, body: workoutBody(rows, false, memberId) });
}
