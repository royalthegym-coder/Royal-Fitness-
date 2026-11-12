/* ================= Equipment register: what the gym owns, its condition, and when it is next due for service ================= */
Q.equipment = () => cached('gym_equipment', () => DB.select('gym_equipment', { order: 'name.asc', limit: 500 }));
U.eq = { f: 'all' };
const EQ_STATUS = { Working: ['ok', 'चालू'], 'Needs repair': ['warn', 'मरम्मत चाहिए'], 'Out of order': ['bad', 'बंद'] };
const eqStatusLabel = (s) => (LANG === 'hi' ? EQ_STATUS[s][1] : s);
/* next service date, or null when no schedule or never serviced; days left is negative when overdue */
function eqNext(e) { return e.service_every_days && e.last_service_on ? addDays(e.last_service_on, e.service_every_days) : null; }
function eqDue(e, today) { const n = eqNext(e); return n == null ? null : diffDays(today, n); }

async function vEquipment() {
  const items = await Q.equipment(), today = todayISO();
  const late = items.filter((e) => { const d = eqDue(e, today); return d != null && d < 0; }), bad = items.filter((e) => e.status !== 'Working');
  const list = U.eq.f === 'bad' ? bad : U.eq.f === 'late' ? late : items;
  const row = (e) => {
    const d = eqDue(e, today), n = eqNext(e);
    const when = n == null ? (e.service_every_days ? L('Never serviced', 'सर्विस कभी नहीं हुई') : L('No service schedule', 'सर्विस का शेड्यूल नहीं')) : d < 0 ? L(`Service overdue by ${-d} days`, `सर्विस ${-d} दिन से बाक़ी`) : d === 0 ? L('Service due today', 'सर्विस आज') : L(`Next service ${fmtDate(n)}`, `अगली सर्विस ${fmtDate(n)}`);
    return `<li><div class="grow"><b>${esc(e.name)}</b><small style="${d != null && d < 0 ? 'color:var(--crimson)' : ''}">${esc([when, e.last_service_on && L('Last: ', 'पिछली: ') + fmtDate(e.last_service_on), e.vendor, e.note].filter(Boolean).join(' · '))}</small></div>${badge(eqStatusLabel(e.status), EQ_STATUS[e.status][0])}<button class="btn sm" data-act="eqServiced" data-id="${esc(e.id)}">${esc(L('Serviced today', 'आज सर्विस हुई'))}</button><button class="btn sm" data-act="editEq" data-id="${esc(e.id)}">${esc(L('Edit', 'बदलें'))}</button></li>`;
  };
  return pageHead(L('Business', 'व्यापार'), L('Equipment', 'उपकरण'), L(`${items.length} items${late.length ? ` · ${late.length} service overdue` : ''}${bad.length ? ` · ${bad.length} not working well` : ''}`, `${items.length} उपकरण${late.length ? ` · ${late.length} की सर्विस बाक़ी` : ''}${bad.length ? ` · ${bad.length} ठीक नहीं` : ''}`), `<button class="btn pri" data-act="newEq">${ic('plus')}${esc(L('Add equipment', 'उपकरण जोड़ें'))}</button>`)
    + chipsHtml('eqF', U.eq.f, [['all', L('All', 'सब'), items.length], ['late', L('Service due', 'सर्विस बाक़ी'), late.length], ['bad', L('Needs attention', 'ध्यान चाहिए'), bad.length]])
    + `<div class="card" style="padding:4px 18px 16px">${list.length ? `<ul class="list">${list.map(row).join('')}</ul>` : empty(items.length ? L('Nothing here', 'यहाँ कुछ नहीं') : L('No equipment yet', 'अभी कोई उपकरण नहीं'), L('Add treadmills, cycles and machines with how often each needs service. Overdue ones show here.', 'ट्रेडमिल, साइकिल और मशीनें जोड़ें और बताएँ कितने दिन में सर्विस होनी है। देर वाली यहाँ दिखेंगी।'), items.length ? '' : `<button class="btn pri" data-act="newEq">${esc(L('Add equipment', 'उपकरण जोड़ें'))}</button>`)}</div>`;
}

async function equipmentForm(id) {
  const x = id ? (await Q.equipment()).find((e) => e.id === id) : null;
  openForm({
    title: x ? L('Edit equipment', 'उपकरण बदलें') : L('Add equipment', 'उपकरण जोड़ें'), submitLabel: L('Save', 'सेव करें'), values: x ? { ...x, service_every_days: x.service_every_days || '', last_service_on: x.last_service_on || '', vendor: x.vendor || '', note: x.note || '' } : {},
    fields: [
      { k: 'name', label: L('Name', 'नाम'), req: true, full: true, ph: L('Treadmill 1', 'ट्रेडमिल 1'), check: (v) => (v.trim().length > 80 ? L('Up to 80 characters', 'अधिकतम 80 अक्षर') : '') },
      { k: 'status', label: L('Condition', 'हालत'), type: 'select', options: Object.keys(EQ_STATUS).map((s) => ({ v: s, l: eqStatusLabel(s) })), def: x ? x.status : 'Working' },
      { k: 'service_every_days', label: L('Service every (days)', 'हर कितने दिन सर्विस'), type: 'number', min: 1, step: 1, check: (v) => (v !== '' && (v < 1 || v > 730 || !Number.isInteger(Number(v))) ? L('1 to 730 whole days', '1 से 730 पूरे दिन') : '') },
      { k: 'last_service_on', label: L('Last serviced on', 'पिछली सर्विस'), type: 'date', check: (v) => (v && v > todayISO() ? L('Cannot be in the future', 'आगे की तारीख़ नहीं') : '') },
      { k: 'vendor', label: L('Service vendor / phone', 'सर्विस वाले का नाम / फ़ोन'), full: true, check: (v) => (v.length > 120 ? L('Up to 120 characters', 'अधिकतम 120 अक्षर') : '') },
      { k: 'note', label: L('Note', 'नोट'), type: 'textarea', full: true, check: (v) => (v.length > 500 ? L('Up to 500 characters', 'अधिकतम 500 अक्षर') : '') },
    ],
    extra: x && isAdmin() ? `<p style="margin:12px 0 0"><button type="button" class="btn sm" data-act="delEq" data-id="${esc(x.id)}">${esc(L('Delete equipment', 'उपकरण हटाएँ'))}</button></p>` : '',
    onSubmit: async (v) => {
      const row = { name: v.name.trim(), status: v.status, service_every_days: v.service_every_days === '' ? null : Number(v.service_every_days), last_service_on: v.last_service_on || null, vendor: v.vendor ? v.vendor.trim() : null, note: v.note ? v.note.trim() : null };
      const ok = await act(() => (x ? DB.update('gym_equipment', x.id, row) : DB.insert('gym_equipment', { ...row, gym_id: gymId() })), L('Saved', 'सेव हुआ'));
      if (ok) { bust('gym_equipment'); render(); } return !!ok;
    },
  });
}
async function eqServiced(id) {
  const ok = await act(() => DB.update('gym_equipment', id, { last_service_on: todayISO(), status: 'Working' }), L('Service recorded', 'सर्विस दर्ज हुई'));
  if (ok) { bust('gym_equipment'); render(); }
}
async function deleteEquipment(id) {
  const e = (await Q.equipment()).find((x) => x.id === id); if (!e) return;
  if (!(await askConfirm(L(`Delete "${e.name}"?`, `"${e.name}" हटाएँ?`), L('Delete', 'हटाएँ'), 'bad'))) return;
  const ok = await act(() => DB.remove('gym_equipment', id), L('Deleted', 'हटा दिया'));
  if (ok) { closeAllModals(); bust('gym_equipment'); render(); }
}
