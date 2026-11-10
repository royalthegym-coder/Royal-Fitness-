/* ================= Classes: the gym schedules classes, members book a spot (capacity enforced in the database) ================= */
Q.classes = () => cached('gym_classes', () => DB.select('gym_classes', { filters: { starts_at: 'gte.' + sinceISO(1) }, order: 'starts_at.asc', limit: 500 }));
Q.classCounts = () => cached('class_counts', async () => { const rows = (await DB.rpc('class_booked_counts', { g: gymId() })) || []; return new Map(rows.map((r) => [r.class_id, r.booked])); });
Q.myBookings = () => cached('class_bookings', () => DB.select('class_bookings', { filters: { cancelled_at: 'is.null' }, limit: 500 }));
U.cls = { f: 'up' };
const bustClasses = () => bust('gym_classes', 'class_counts', 'class_bookings');

/* the database refuses with a plain sentence; show it in the person's language */
function classMsg(e) {
  const m = String((e && e.message) || '');
  const T = [['class full', 'This class is full.', 'यह क्लास भर चुकी है।'], ['already booked', 'You already have a spot in this class.', 'इस क्लास में आपकी जगह पहले से है।'], ['membership expired', 'Your membership has ended. Please renew to book.', 'आपकी सदस्यता ख़त्म हो चुकी है। बुक करने के लिए रिन्यू करें।'], ['already started', 'This class has already started.', 'यह क्लास शुरू हो चुकी है।'], ['class cancelled', 'This class was cancelled.', 'यह क्लास रद्द हो गई है।'], ['too late to cancel', 'Too late to cancel online (less than 2 hours left). Please ask the gym.', 'रद्द करने में देर हो चुकी (2 घंटे से कम बचे)। जिम से कहें।'], ['gym locked', 'The gym subscription has ended.', 'जिम का सब्सक्रिप्शन ख़त्म हो गया है।']];
  const t = T.find((x) => m.includes(x[0]));
  return t ? L(t[1], t[2]) : friendlyError(e);
}
async function actClass(fn, okMsg) {
  try { const r = await fn(); if (okMsg) toast(okMsg); bustClasses(); return r === undefined || r === null ? true : r; } catch (e) { if (e && e.status === 401) return null; toast(classMsg(e), 'bad'); return null; }
}
const clsDay = (iso) => { const d = istDate(iso), t = todayISO(); return d === t ? L('Today', 'आज') : d === addDays(t, 1) ? L('Tomorrow', 'कल') : fmtDate(d); };
const clsRange = (c) => `${fmtTime(c.starts_at)} – ${fmtTime(new Date(new Date(c.starts_at).getTime() + c.duration_min * 60000).toISOString())}`;
const toIST = (date, time) => `${date}T${time}:00+05:30`;

/* ---------- staff: schedule ---------- */
async function vClasses() {
  const [classes, counts] = await Promise.all([Q.classes(), Q.classCounts()]), now = Date.now();
  const list = classes.filter((c) => (U.cls.f === 'up' ? new Date(c.starts_at).getTime() >= now : new Date(c.starts_at).getTime() < now));
  const days = [...new Set(list.map((c) => istDate(c.starts_at)))];
  const row = (c) => {
    const n = counts.get(c.id) || 0, full = n >= c.capacity, off = !!c.cancelled_at, past = new Date(c.starts_at).getTime() < now;
    return `<li${off ? ' style="opacity:.55"' : ''}><div class="grow"><b>${esc(clsRange(c))} · ${esc(c.title)}</b><small>${esc(c.coach || '')}${c.coach && c.note ? ' · ' : ''}${esc(c.note || '')}</small></div>${off ? badge(L('Cancelled', 'रद्द'), 'bad') : full ? badge(L('Full', 'भरी'), 'warn') : ''}<span class="num" title="${esc(L('Booked / capacity', 'बुक / क्षमता'))}">${n} / ${c.capacity}</span><div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn sm" data-act="clsBookings" data-id="${esc(c.id)}">${esc(L('Bookings', 'बुकिंग'))}</button>${off || past ? '' : `<button class="btn sm" data-act="editClass" data-id="${esc(c.id)}">${esc(L('Edit', 'बदलें'))}</button><button class="btn sm" data-act="cancelClass" data-id="${esc(c.id)}">${esc(L('Cancel class', 'क्लास रद्द'))}</button>`}</div></li>`;
  };
  const body = days.length ? days.map((d) => `<h3 style="font-size:13px;margin:14px 0 4px">${esc(clsDay(`${d}T12:00:00+05:30`))}</h3><ul class="list">${list.filter((c) => istDate(c.starts_at) === d).map(row).join('')}</ul>`).join('') : empty(U.cls.f === 'up' ? L('No upcoming classes', 'कोई आने वाली क्लास नहीं') : L('Nothing in the last day', 'पिछले दिन कुछ नहीं'), L('Add yoga, Zumba, HIIT or any batch. Members book a spot from their app.', 'योगा, ज़ुम्बा, HIIT या कोई भी बैच जोड़ें। सदस्य अपने ऐप से जगह बुक करेंगे।'), `<button class="btn pri" data-act="newClass">${esc(L('Add class', 'क्लास जोड़ें'))}</button>`);
  return pageHead(L('Business', 'व्यापार'), L('Classes', 'क्लास'), L('Schedule classes and see who booked. Members cannot book more than the capacity.', 'क्लास का समय तय करें और देखें किसने बुक किया। क्षमता से ज़्यादा बुकिंग नहीं होती।'), `<button class="btn pri" data-act="newClass">${ic('plus')}${esc(L('Add class', 'क्लास जोड़ें'))}</button>`)
    + chipsHtml('clsF', U.cls.f, [['up', L('Upcoming', 'आने वाली')], ['recent', L('Earlier (last day)', 'बीती (पिछला दिन)')]])
    + `<div class="card" style="padding:4px 18px 16px">${body}</div>`;
}

function classForm(id) {
  Q.classes().then((classes) => {
    const x = id ? classes.find((c) => c.id === id) : null, d0 = x ? istDate(x.starts_at) : todayISO(), p = x ? istParts(x.starts_at) : { hour: 7, min: 0 };
    openForm({
      title: x ? L('Edit class', 'क्लास बदलें') : L('Add class', 'क्लास जोड़ें'), submitLabel: L('Save', 'सेव करें'),
      values: x ? { ...x, date: d0, time: `${pad(p.hour)}:${pad(p.min)}` } : {},
      fields: [
        { k: 'title', label: L('Class name', 'क्लास का नाम'), req: true, full: true, ph: L('Morning Yoga', 'सुबह का योगा'), check: (v) => (v.trim().length > 80 ? L('Up to 80 characters', 'अधिकतम 80 अक्षर') : '') },
        { k: 'coach', label: L('Coach', 'कोच'), check: (v) => (v.length > 80 ? L('Up to 80 characters', 'अधिकतम 80 अक्षर') : '') },
        { k: 'capacity', label: L('Spots', 'जगह'), type: 'number', req: true, min: 1, def: 15, step: 1, check: (v) => (v > 500 ? L('At most 500', 'अधिकतम 500') : '') },
        { k: 'date', label: L('Date', 'तारीख़'), type: 'date', req: true, def: d0 },
        { k: 'time', label: L('Start time', 'शुरू का समय'), type: 'time', req: true, def: `${pad(p.hour)}:${pad(p.min)}` },
        { k: 'duration_min', label: L('Minutes', 'मिनट'), type: 'number', req: true, min: 10, def: 60, step: 5, check: (v) => (v > 240 ? L('At most 240', 'अधिकतम 240') : '') },
        ...(x ? [] : [{ k: 'weeks', label: L('Repeat weekly for', 'हर हफ़्ते दोहराएँ'), type: 'select', options: [1, 2, 4, 8, 12].map((n) => ({ v: String(n), l: n === 1 ? L('Just once', 'सिर्फ़ एक बार') : L(`${n} weeks`, `${n} हफ़्ते`) })), def: '1' }]),
        { k: 'note', label: L('Note', 'नोट'), full: true, check: (v) => (v.length > 200 ? L('Up to 200 characters', 'अधिकतम 200 अक्षर') : '') },
      ],
      onSubmit: async (v) => {
        const at = (d) => toIST(d, v.time), now = Date.now();
        if (new Date(at(v.date)).getTime() <= now && !x) { toast(L('Pick a time in the future', 'आगे का समय चुनें'), 'bad'); return false; }
        const base = { title: v.title.trim(), coach: v.coach ? v.coach.trim() : null, capacity: Math.round(v.capacity), duration_min: Math.round(v.duration_min), note: v.note ? v.note.trim() : null };
        const ok = await actClass(() => (x ? DB.update('gym_classes', x.id, { ...base, starts_at: at(v.date) }) : DB.insert('gym_classes', Array.from({ length: Number(v.weeks || 1) }, (_, i) => ({ ...base, gym_id: gymId(), starts_at: at(addDays(v.date, 7 * i)) })))), x ? L('Saved', 'सेव हुआ') : L('Class added', 'क्लास जुड़ी'));
        if (ok) render(); return !!ok;
      },
    });
  });
}
async function cancelClass(id) {
  const c = (await Q.classes()).find((x) => x.id === id); if (!c) return;
  const n = (await Q.classCounts()).get(id) || 0;
  if (!(await askConfirm(L(`Cancel "${c.title}" on ${clsDay(c.starts_at)}?${n ? ` ${n} booked member(s) will see it as cancelled.` : ''}`, `${clsDay(c.starts_at)} की "${c.title}" रद्द करें?${n ? ` बुक किए ${n} सदस्यों को यह रद्द दिखेगी।` : ''}`), L('Cancel class', 'क्लास रद्द करें'), 'bad'))) return;
  const ok = await actClass(() => DB.update('gym_classes', id, { cancelled_at: new Date().toISOString() }), L('Class cancelled', 'क्लास रद्द हुई'));
  if (ok) render();
}

/* staff: who booked a class; add or remove a member */
async function classBookings(id) {
  const [classes, members] = await Promise.all([Q.classes(), Q.members()]), c = classes.find((x) => x.id === id); if (!c) return;
  const rows = await DB.select('class_bookings', { eq: { class_id: id }, filters: { cancelled_at: 'is.null' }, order: 'created_at.asc', limit: 600 });
  const mm = new Map(members.map((m) => [m.id, m])), booked = new Set(rows.map((r) => r.member_id)), today = todayISO();
  const free = members.filter((m) => !booked.has(m.id) && m.end_date && m.end_date >= today).sort((a, b) => a.name.localeCompare(b.name));
  const open = !c.cancelled_at && new Date(c.starts_at).getTime() > Date.now();
  closeAllModals();
  const mod = openModal({
    title: `${c.title} · ${clsDay(c.starts_at)} ${clsRange(c)}`, wide: true,
    body: `<p class="muted" style="margin:0 0 8px">${esc(L(`${rows.length} of ${c.capacity} spots booked`, `${c.capacity} में से ${rows.length} जगह बुक`))}</p>`
      + (rows.length ? `<ul class="list">${rows.map((r) => `<li><div class="grow"><b>${esc(memberName(mm, r.member_id))}</b><small>${esc((mm.get(r.member_id) || {}).phone || '')}</small></div>${open ? `<button class="btn sm" data-cb="${esc(r.id)}">${esc(L('Remove', 'हटाएँ'))}</button>` : ''}</li>`).join('')}</ul>` : empty(L('No bookings yet', 'अभी कोई बुकिंग नहीं'), ''))
      + (open && rows.length < c.capacity ? `<div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap"><select class="sel" id="clsAdd" style="flex:1;min-width:180px"><option value="">${esc(L('Book a member…', 'सदस्य बुक करें…'))}</option>${free.map((m) => `<option value="${esc(m.id)}">${esc(m.name)}</option>`).join('')}</select><button class="btn pri" id="clsAddBtn">${esc(L('Book', 'बुक करें'))}</button></div>` : ''),
  });
  mod.el.addEventListener('click', async (e) => {
    const rm = e.target.closest('[data-cb]');
    if (rm) { rm.disabled = true; const ok = await actClass(() => DB.rpc('cancel_booking', { p_booking: rm.dataset.cb }), L('Booking removed', 'बुकिंग हटी')); if (ok) classBookings(id); else rm.disabled = false; }
    if (e.target.id === 'clsAddBtn') { const sel = $('#clsAdd', mod.el); if (!sel.value) return; e.target.disabled = true; const ok = await actClass(() => DB.rpc('book_class', { p_class: id, p_member: sel.value }), L('Member booked', 'सदस्य बुक हुआ')); if (ok) classBookings(id); else e.target.disabled = false; }
  });
}

/* ---------- member: book a spot ---------- */
async function vBookClass() {
  const m = (await Q.members())[0]; if (!m) return noMember();
  const [classes, counts, mine] = await Promise.all([Q.classes(), Q.classCounts(), Q.myBookings()]), now = Date.now(), today = todayISO();
  const valid = m.end_date && m.end_date >= today, mineBy = new Map(mine.map((b) => [b.class_id, b]));
  const list = classes.filter((c) => !c.cancelled_at && new Date(c.starts_at).getTime() > now && istDate(c.starts_at) <= addDays(today, 14));
  const days = [...new Set(list.map((c) => istDate(c.starts_at)))];
  const row = (c) => {
    const n = counts.get(c.id) || 0, b = mineBy.get(c.id), full = n >= c.capacity, soon = new Date(c.starts_at).getTime() < now + 2 * 3600000;
    const act1 = b ? (soon ? `<span class="muted" style="font-size:12px">${esc(L('Too late to cancel online', 'अब ऑनलाइन रद्द नहीं'))}</span>` : `<button class="btn sm" data-act="clsCancel" data-id="${esc(b.id)}">${esc(L('Cancel', 'रद्द करें'))}</button>`) : full ? '' : `<button class="btn sm pri" data-act="clsBook" data-id="${esc(c.id)}"${valid ? '' : ' disabled'}>${esc(L('Book', 'बुक करें'))}</button>`;
    return `<li><div class="grow"><b>${esc(clsRange(c))} · ${esc(c.title)}</b><small>${esc(c.coach || '')}${c.coach && c.note ? ' · ' : ''}${esc(c.note || '')} · ${esc(L(`${Math.max(0, c.capacity - n)} spots left`, `${Math.max(0, c.capacity - n)} जगह बाक़ी`))}</small></div>${b ? badge(L('Booked', 'बुक'), 'ok') : full ? badge(L('Full', 'भरी'), 'warn') : ''}${act1}</li>`;
  };
  return pageHead(gymName(), L('Book a class', 'क्लास बुक करें'), L('Reserve your spot for the next two weeks.', 'अगले दो हफ़्ते की क्लास में अपनी जगह रखें।'))
    + (valid ? '' : `<div class="banner bad" role="status">${esc(L('Your membership has ended. Renew to book classes.', 'आपकी सदस्यता ख़त्म हो गई है। क्लास बुक करने के लिए रिन्यू करें।'))}</div>`)
    + `<div class="card" style="padding:4px 18px 16px">${days.length ? days.map((d) => `<h3 style="font-size:13px;margin:14px 0 4px">${esc(clsDay(`${d}T12:00:00+05:30`))}</h3><ul class="list">${list.filter((c) => istDate(c.starts_at) === d).map(row).join('')}</ul>`).join('') : empty(L('No classes scheduled yet', 'अभी कोई क्लास तय नहीं'), L('Your gym has not added classes for the next two weeks.', 'आपके जिम ने अगले दो हफ़्ते की क्लास नहीं जोड़ी हैं।'))}</div>`;
}
async function bookClass(id) { const ok = await actClass(() => DB.rpc('book_class', { p_class: id }), L('Spot booked', 'जगह बुक हुई')); if (ok) render(); }
async function cancelMyBooking(bid) {
  if (!(await askConfirm(L('Cancel your spot?', 'अपनी जगह रद्द करें?'), L('Cancel spot', 'जगह रद्द करें'), 'bad'))) return;
  const ok = await actClass(() => DB.rpc('cancel_booking', { p_booking: bid }), L('Booking cancelled', 'बुकिंग रद्द हुई')); if (ok) render();
}
