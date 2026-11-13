/* ================= Staff attendance and shifts (owner only). Marks go through the database function mark_staff_attendance, which refuses future dates, days before joining and other gyms. ================= */
U.att = { day: '' };
Q.attendance = () => cached('attendance', () => DB.select('staff_attendance', { order: 'day.desc', limit: 3000 }));
const ATT_STATES = [['present', 'Present', 'हाज़िर'], ['half', 'Half day', 'आधा दिन'], ['leave', 'Leave', 'छुट्टी'], ['absent', 'Absent', 'गैरहाज़िर']];
const SHIFT_LABEL = { full: ['Full day', 'पूरा दिन'], morning: ['Morning', 'सुबह'], evening: ['Evening', 'शाम'] };
const dowOf = (day) => new Date(day + 'T00:00:00Z').getUTCDay();

/* pure: counts for one person in one month ('YYYY-MM'); worked = present + half a day for each half day. Leave and absent are counted, not judged. */
function attendanceSummary(rows, staffId, mk) {
  const mine = rows.filter((r) => r.staff_id === staffId && monthKey(r.day) === mk), c = (s) => mine.filter((r) => r.status === s).length;
  const present = c('present'), half = c('half');
  return { present, half, leave: c('leave'), absent: c('absent'), worked: present + half / 2, marked: mine.length };
}
const isWeeklyOff = (st, day) => st.weekly_off !== null && st.weekly_off !== undefined && Number(st.weekly_off) === dowOf(day);

async function vAttendance() {
  const [staff, rows] = await Promise.all([Q.staff(), Q.attendance()]), today = todayISO();
  if (!U.att.day || U.att.day > today) U.att.day = today;
  const day = U.att.day, mk = monthKey(day), DN = L('Sun,Mon,Tue,Wed,Thu,Fri,Sat', 'रवि,सोम,मंगल,बुध,गुरु,शुक्र,शनि').split(',');
  const list = staff.filter((s) => s.active && (!s.joined_on || s.joined_on <= day)), cur = new Map(rows.filter((r) => r.day === day).map((r) => [r.staff_id, r.status]));
  const marked = list.filter((s) => cur.has(s.id)).length, sh = (s) => L(...(SHIFT_LABEL[s.shift] || SHIFT_LABEL.full));
  const stLabel = (k) => L(...ATT_STATES.find((x) => x[0] === k).slice(1));
  const nav = `<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:12px"><button class="btn sm" data-act="attDay" data-d="-1" aria-label="${esc(L('Previous day', 'पिछला दिन'))}">‹</button><b>${esc(DN[dowOf(day)])}, ${esc(fmtDate(day))}</b><button class="btn sm" data-act="attDay" data-d="1"${day >= today ? ' disabled' : ''} aria-label="${esc(L('Next day', 'अगला दिन'))}">›</button>${day !== today ? `<button class="btn sm" data-act="attToday">${esc(L('Today', 'आज'))}</button>` : ''}<span class="muted">${esc(L(`${marked} of ${list.length} marked`, `${list.length} में से ${marked} दर्ज`))}</span></div>`;
  const body = list.length
    ? `<ul class="list">${list.map((s) => `<li><div class="grow"><b>${esc(s.name)}</b><small>${esc(jobLabel(s.job))} · ${esc(sh(s))}${isWeeklyOff(s, day) ? ' · ' + esc(L('weekly off', 'साप्ताहिक छुट्टी')) : ''}</small></div><div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end">${ATT_STATES.map(([k]) => `<button class="btn sm${cur.get(s.id) === k ? ' pri' : ''}" aria-pressed="${cur.get(s.id) === k}" data-act="attMark" data-id="${esc(s.id)}" data-s="${k}"${CTX.locked ? ' disabled' : ''}>${esc(stLabel(k))}</button>`).join('')}</div></li>`).join('')}</ul><p class="muted" style="margin:10px 0 0">${esc(L('Tap a status to mark it. Tap the same one again to clear it.', 'स्थिति पर टैप करके दर्ज करें। उसी पर दोबारा टैप करें तो हट जाएगी।'))}</p>`
    : empty(L('No staff to mark', 'दर्ज करने के लिए कोई स्टाफ़ नहीं'), L('Add people on the Staff & salary page first. Only people who had joined by this date are listed.', 'पहले "स्टाफ़ और वेतन" पेज पर लोग जोड़ें। इस तारीख़ तक जॉइन कर चुके लोग ही दिखते हैं।'), '<a class="btn pri" href="#staff">' + esc(L('Staff & salary', 'स्टाफ़ और वेतन')) + '</a>');
  const mlabel = new Date(day.slice(0, 7) + '-01T00:00:00Z').toLocaleDateString(LANG === 'hi' ? 'hi-IN' : 'en-IN', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  const sums = list.map((s) => ({ s, a: attendanceSummary(rows, s.id, mk) })), num = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(1));
  const table = sums.length ? `<div class="tw"><table class="t"><thead><tr><th>${esc(L('Name', 'नाम'))}</th><th class="r">${esc(L('Present', 'हाज़िर'))}</th><th class="r">${esc(L('Half', 'आधा'))}</th><th class="r">${esc(L('Leave', 'छुट्टी'))}</th><th class="r">${esc(L('Absent', 'गैर'))}</th><th class="r">${esc(L('Days worked', 'काम के दिन'))}</th></tr></thead><tbody>${sums.map(({ s, a }) => `<tr><td><b>${esc(s.name)}</b></td><td class="r">${a.present}</td><td class="r">${a.half}</td><td class="r">${a.leave}</td><td class="r">${a.absent}</td><td class="r"><b>${num(a.worked)}</b></td></tr>`).join('')}</tbody></table></div>` : '';
  return pageHead(L('People', 'लोग'), L('Staff attendance', 'स्टाफ़ हाज़िरी'), L('Mark who came each day. Only the owner can see this page.', 'रोज़ दर्ज करें कि कौन आया। यह पेज सिर्फ़ मालिक देख सकता है।'))
    + nav + `<div class="card" style="margin-bottom:14px">${body}</div>`
    + (table ? card(L(`Summary for ${mlabel}`, `${mlabel} का सार`), 'list', '', table + `<p class="muted" style="margin:10px 0 0">${esc(L('Days worked counts a half day as 0.5. It is not connected to salary: you decide pay and leave rules, and record salary on the Staff & salary page.', 'काम के दिन में आधा दिन 0.5 गिना जाता है। यह वेतन से जुड़ा नहीं है: वेतन और छुट्टी के नियम आप तय करते हैं और वेतन "स्टाफ़ और वेतन" पेज पर दर्ज होता है।'))}</p>`) : '');
}
async function attMark(id, status) {
  const rows = await Q.attendance(), day = U.att.day, was = (rows.find((r) => r.staff_id === id && r.day === day) || {}).status, next = was === status ? null : status;
  const ok = await act(() => DB.rpc('mark_staff_attendance', { p_staff: id, p_day: day, p_status: next }), next ? L('Marked', 'दर्ज हुआ') : L('Cleared', 'हटाया'));
  if (ok) { bust('attendance'); render(); }
}
