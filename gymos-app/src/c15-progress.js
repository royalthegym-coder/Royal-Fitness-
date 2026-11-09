/* ================= Member progress: weight, body fat and body measurements over time ================= */
const PROG_FIELDS = [
  ['weight_kg', 'Weight (kg)', 'वज़न (किग्रा)', 'kg'], ['body_fat_pct', 'Body fat (%)', 'बॉडी फ़ैट (%)', '%'],
  ['waist_cm', 'Waist (cm)', 'कमर (सेमी)', 'cm'], ['chest_cm', 'Chest (cm)', 'छाती (सेमी)', 'cm'],
  ['hips_cm', 'Hips (cm)', 'कूल्हे (सेमी)', 'cm'], ['arm_cm', 'Arm (cm)', 'बाँह (सेमी)', 'cm'], ['thigh_cm', 'Thigh (cm)', 'जाँघ (सेमी)', 'cm'],
];
const progOf = (memberId) => DB.select('member_progress', { eq: { member_id: memberId }, order: 'measured_on.desc,created_at.desc', limit: 300 });
const num1 = (v) => (Math.round(Number(v) * 10) / 10).toString();

/* first and latest value of one measure, oldest-first list given */
function progDelta(asc, key) {
  const xs = asc.filter((r) => r[key] != null);
  if (!xs.length) return null;
  const first = Number(xs[0][key]), last = Number(xs[xs.length - 1][key]);
  return { first, last, diff: Math.round((last - first) * 10) / 10, n: xs.length };
}
const signed = (d) => (d > 0 ? '+' : d < 0 ? '−' : '') + num1(Math.abs(d));

/* small line chart of one measure; plain SVG so it works offline and in both themes */
function progChart(asc, key) {
  const pts = asc.filter((r) => r[key] != null).map((r) => ({ d: r.measured_on, v: Number(r[key]) }));
  if (pts.length < 2) return '';
  const W = 320, H = 110, P = 14, vs = pts.map((p) => p.v), lo = Math.min(...vs), hi = Math.max(...vs), span = hi - lo || 1;
  const t0 = new Date(pts[0].d).getTime(), t1 = new Date(pts[pts.length - 1].d).getTime(), ts = t1 - t0 || 1;
  const xy = pts.map((p) => [P + ((new Date(p.d).getTime() - t0) / ts) * (W - 2 * P), H - P - ((p.v - lo) / span) * (H - 2 * P)]);
  const line = xy.map((q) => q.map((n) => n.toFixed(1)).join(',')).join(' ');
  const label = L(`Trend from ${num1(pts[0].v)} to ${num1(pts[pts.length - 1].v)}`, `${num1(pts[0].v)} से ${num1(pts[pts.length - 1].v)} तक का रुझान`);
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}" style="width:100%;height:auto;display:block"><polyline points="${line}" fill="none" stroke="var(--crimson)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>${xy.map((q) => `<circle cx="${q[0].toFixed(1)}" cy="${q[1].toFixed(1)}" r="3.5" fill="var(--crimson)"/>`).join('')}<text x="${P}" y="11" font-size="10" fill="var(--muted)">${esc(num1(hi))}</text><text x="${P}" y="${H - 2}" font-size="10" fill="var(--muted)">${esc(num1(lo))}</text></svg>`;
}

/* the same view serves the member portal and the staff modal; staff may delete entries */
function progBody(rows, staff, memberId) {
  if (!rows.length) return empty(L('No measurements yet', 'अभी कोई माप नहीं'), L('Add your weight and measurements every couple of weeks to see your progress.', 'हर दो हफ़्ते में अपना वज़न और माप जोड़ें, फिर प्रगति यहाँ दिखेगी।'), `<button class="btn pri" data-act="addProgress" data-id="${esc(memberId)}"${staff ? '' : ' data-by="1"'}>${esc(L('Add measurements', 'माप जोड़ें'))}</button>`);
  const asc = [...rows].reverse(), w = progDelta(asc, 'weight_kg'), wa = progDelta(asc, 'waist_cm'), bf = progDelta(asc, 'body_fat_pct');
  const tl = (lab, d, unit, good) => (d ? tile(lab, esc(num1(d.last) + ' ' + unit), d.n > 1 ? `<span style="color:${d.diff === 0 ? 'var(--muted)' : good(d.diff) ? 'var(--ok)' : 'var(--crimson)'}">${esc(signed(d.diff) + ' ' + unit)} ${esc(L('since first entry', 'पहली एंट्री से'))}</span>` : esc(L('first entry', 'पहली एंट्री'))) : '');
  const down = (d) => d <= 0;
  const chart = progChart(asc, 'weight_kg');
  const cols = PROG_FIELDS.filter((f) => rows.some((r) => r[f[0]] != null));
  return `<div class="tiles" style="margin-bottom:12px">${tl(L('Weight', 'वज़न'), w, 'kg', down)}${tl(L('Waist', 'कमर'), wa, 'cm', down)}${tl(L('Body fat', 'बॉडी फ़ैट'), bf, '%', down)}</div>`
    + (chart ? `<div class="card" style="padding:12px;margin-bottom:12px"><div class="muted" style="font-size:12px;margin-bottom:4px">${esc(L('Weight over time', 'समय के साथ वज़न'))}</div>${chart}</div>` : '')
    + `<div class="tw"><table class="t"><thead><tr><th>${esc(L('Date', 'तारीख़'))}</th>${cols.map((f) => `<th class="r">${esc(L(f[1], f[2]))}</th>`).join('')}${staff ? '<th></th>' : ''}</tr></thead><tbody>${rows.map((r) => `<tr><td>${esc(fmtDate(r.measured_on))}${r.note ? `<small style="display:block;color:var(--muted)">${esc(r.note)}</small>` : ''}</td>${cols.map((f) => `<td class="r">${r[f[0]] != null ? esc(num1(r[f[0]])) : '—'}</td>`).join('')}${staff ? `<td class="r"><button class="btn sm" data-act="delProgress" data-id="${esc(r.id)}" data-m="${esc(memberId)}">${esc(L('Delete', 'हटाएँ'))}</button></td>` : ''}</tr>`).join('')}</tbody></table></div>`;
}

function progressForm(memberId, byMember, after) {
  openForm({
    title: L('Add measurements', 'माप जोड़ें'), submitLabel: L('Save', 'सेव करें'),
    fields: [
      { k: 'measured_on', label: L('Date', 'तारीख़'), type: 'date', def: todayISO(), full: true, check: (v) => (v && v > todayISO() ? L('Cannot be in the future', 'आगे की तारीख़ नहीं') : '') },
      ...PROG_FIELDS.map((f) => ({ k: f[0], label: L(f[1], f[2]), type: 'number', min: 0, check: (v) => (v === '' ? '' : f[0] === 'weight_kg' ? (v < 20 || v > 400 ? L('Between 20 and 400', '20 से 400 के बीच') : '') : f[0] === 'body_fat_pct' ? (v < 2 || v > 70 ? L('Between 2 and 70', '2 से 70 के बीच') : '') : (v < 10 || v > 250 ? L('Between 10 and 250', '10 से 250 के बीच') : '')) })),
      { k: 'note', label: L('Note', 'नोट'), full: true, check: (v) => (v.length > 300 ? L('Up to 300 characters', 'अधिकतम 300 अक्षर') : '') },
    ],
    extra: `<p class="muted" style="margin:10px 0 0">${esc(L('Fill only what you measured.', 'सिर्फ़ वही भरें जो नापा हो।'))}</p>`,
    onSubmit: async (v) => {
      if (!PROG_FIELDS.some((f) => v[f[0]] !== '' && v[f[0]] != null)) { toast(L('Enter at least one measurement', 'कम से कम एक माप भरें'), 'bad'); return false; }
      const row = { gym_id: gymId(), member_id: memberId, measured_on: v.measured_on || todayISO(), by_member: !!byMember, note: v.note ? v.note.trim() : null };
      PROG_FIELDS.forEach((f) => { row[f[0]] = v[f[0]] === '' || v[f[0]] == null ? null : v[f[0]]; });
      const ok = await act(() => DB.insert('member_progress', row), L('Measurements saved', 'माप सेव हुए'));
      if (ok) { if (after) await after(); else render(); } return !!ok;
    },
  });
}

/* staff: a member's progress in a modal */
async function progressModal(memberId) {
  const members = await Q.members(), m = members.find((x) => x.id === memberId); if (!m) return;
  const rows = await progOf(memberId);
  closeAllModals();
  openModal({ title: L(`${m.name}: progress`, `${m.name}: प्रगति`), wide: true, body: progBody(rows, true, memberId) + (rows.length ? `<p style="margin:12px 0 0"><button class="btn pri" data-act="addProgress" data-id="${esc(memberId)}">${ic('plus')} ${esc(L('Add measurements', 'माप जोड़ें'))}</button></p>` : '') });
}
async function deleteProgress(id, memberId) {
  if (!(await askConfirm(L('Delete this entry?', 'यह एंट्री हटाएँ?'), L('Delete', 'हटाएँ'), 'bad'))) return;
  const ok = await act(() => DB.remove('member_progress', id), L('Deleted', 'हटा दिया'));
  if (ok) progressModal(memberId);
}

/* member portal page */
async function vMyProgress() {
  const m = (await Q.members())[0]; if (!m) return noMember();
  const rows = await progOf(m.id);
  return pageHead(gymName(), L('My progress', 'मेरी प्रगति'), L('Your weight and body measurements over time.', 'समय के साथ आपका वज़न और शरीर के माप।'), rows.length ? `<button class="btn pri" data-act="addProgress" data-id="${esc(m.id)}" data-by="1">${ic('plus')}${esc(L('Add', 'जोड़ें'))}</button>` : '')
    + `<div class="card" style="padding:16px">${progBody(rows, false, m.id)}</div>`;
}
