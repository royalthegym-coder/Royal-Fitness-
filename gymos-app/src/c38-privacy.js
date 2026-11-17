/* ================= Data deletion: the member asks, the gym owner erases or rejects ================= */

/* ---- pure helpers (tested in tests/deletion.test.mjs) ---- */
const DEL_STATUS = { pending: ['Requested', 'अनुरोध भेजा गया', 'warn'], done: ['Erased', 'डेटा मिटाया गया', 'ok'], rejected: ['Not done', 'पूरा नहीं हुआ', 'bad'] };
/** [label, tone] for a request status. No request (null) is neutral. */
const delStatusLabel = (status) => { const s = DEL_STATUS[status]; return s ? [L(s[0], s[1]), s[2]] : [L('No request', 'कोई अनुरोध नहीं'), 'mute']; };
/** A member can file when there is no request, or the last one was rejected (a pending or erased one cannot be filed again). */
const delCanRequest = (status) => status == null || status === 'rejected';
/** The owner can erase only a pending request, and only while the gym is open (erasure writes to the data and to storage). */
const delCanErase = (status, gymOpen) => status === 'pending' && gymOpen === true;
/** A rejection reason: 3 to 300 characters after trimming, counted as characters (the database rule). */
const delNoteOk = (s) => { const n = [...String(s == null ? '' : s).trim()].length; return n >= 3 && n <= 300; };

/* ---- member: the profile page card ---- */
async function deletionCard() {
  let st;
  try { st = await DB.rpc('member_deletion_status'); } catch (e) { return ''; }
  if (!st || st.no_member) return '';
  const status = st.status || null, [lab, tone] = delStatusLabel(status), on = (k) => (st[k] ? fmtDate(st[k]) : '—');
  let line = '';
  if (status === 'pending') line = L(`Your request reached the gym on ${on('requested_at')}. The owner will erase your data soon.`, `आपका अनुरोध ${on('requested_at')} को जिम तक पहुँचा। मालिक जल्द आपका डेटा मिटाएगा।`);
  else if (status === 'done') line = L(`Your personal and fitness data was erased on ${on('handled_at')}.`, `आपका व्यक्तिगत और फ़िटनेस डेटा ${on('handled_at')} को मिटा दिया गया।`);
  else if (status === 'rejected') line = L(`The gym did not erase your data. Reason: ${st.note || '—'}`, `जिम ने डेटा नहीं मिटाया। कारण: ${st.note || '—'}`);
  const action = delCanRequest(status)
    ? `<button class="btn danger" data-act="delRequest">${ic('lock')} ${esc(status ? L('Request again', 'फिर से अनुरोध करें') : L('Request account deletion', 'खाता हटाने का अनुरोध करें'))}</button>` : '';
  return card(L('Delete my data', 'मेरा डेटा हटाएँ'), 'lock', '', `<div style="padding:6px 18px 18px"><p class="muted" style="margin:0 0 10px">${esc(L('Ask the gym to erase your name, phone, photo, workouts, meals, sleep, water, check-ins and coach chats. Invoices and payment records stay, as tax law requires, but your name is removed from them.', 'जिम से अपना नाम, फ़ोन, फ़ोटो, वर्कआउट, भोजन, नींद, पानी, चेक-इन और कोच की बातचीत मिटाने को कहें। इनवॉइस और भुगतान के रिकॉर्ड कानून के तहत रहेंगे, पर उन पर से आपका नाम हट जाएगा।'))}</p>${status ? `<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:10px">${badge(lab, tone)}<span class="muted">${esc(line)}</span></div>` : ''}${action}</div>`)
    + '<div style="height:14px"></div>';
}
async function delRequest() {
  if (!(await askConfirm(L('Send the request to the gym? The owner will erase your data. Invoices and payment records stay, as the law requires.', 'जिम को अनुरोध भेजें? मालिक आपका डेटा मिटाएगा। इनवॉइस और भुगतान के रिकॉर्ड कानून के तहत रहेंगे।'), L('Send request', 'अनुरोध भेजें'), 'bad'))) return;
  const r = await act(() => DB.rpc('member_request_deletion'), L('Request sent', 'अनुरोध भेजा गया'));
  if (r) render();
}

/* ---- owner: a card on Settings listing the gym's requests ---- */
async function privacyRequestsCard() {
  const head = L('Data deletion requests', 'डेटा हटाने के अनुरोध');
  let rows;
  try { rows = await DB.rpc('deletion_list', { p_gym: gymId() }); } catch (e) {
    return card(head, 'lock', '', `<div style="padding:6px 18px 18px" class="muted">${esc(L('Could not load the requests. Try again later.', 'अनुरोध लोड नहीं हुए। बाद में फिर कोशिश करें।'))}</div>`) + '<div style="height:14px"></div>';
  }
  rows = Array.isArray(rows) ? rows : [];
  const pending = rows.filter((r) => r.status === 'pending').length;
  const rowHtml = (r) => {
    const [lab, tone] = delStatusLabel(r.status);
    const data = `data-req="${esc(r.id)}" data-name="${esc(r.member_name || '')}" data-photo="${esc(r.photo_path || '')}"`;
    const btns = r.status === 'pending'
      ? `<div style="display:flex;gap:6px;flex-wrap:wrap"><button class="btn sm danger" data-act="delErase" ${data} ${delCanErase(r.status, !CTX.locked) ? '' : 'disabled'}>${esc(L('Erase data', 'डेटा मिटाएँ'))}</button><button class="btn sm" data-act="delReject" data-req="${esc(r.id)}">${esc(L('Reject', 'अस्वीकार'))}</button></div>`
      : '';
    return `<li><div class="grow"><b>${esc(r.member_name || '—')}</b><small>${esc(L('Requested', 'अनुरोध'))}: ${esc(fmtDate(r.requested_at))}${r.note ? ' · ' + esc(r.note) : ''}</small></div>${badge(lab, tone)}${btns}</li>`;
  };
  const body = rows.length
    ? `<ul class="list">${rows.map(rowHtml).join('')}</ul>`
    : `<div class="muted" style="padding:6px 18px 18px">${esc(L('No requests yet.', 'अभी कोई अनुरोध नहीं।'))}</div>`;
  const note = `<p class="muted" style="margin:0;padding:10px 18px 0;font-size:.9rem">${esc(L('Erasing removes the member’s name, phone, photo, fitness, health, attendance and coach data. Invoices, payments and GST records stay, as the law requires.', 'मिटाने पर सदस्य का नाम, फ़ोन, फ़ोटो, फ़िटनेस, स्वास्थ्य, उपस्थिति और कोच का डेटा हटेगा। इनवॉइस, भुगतान और GST के रिकॉर्ड कानून के तहत रहेंगे।'))}</p>`;
  return card(head, 'lock', pending ? badge(L(`${pending} waiting`, `${pending} इंतज़ार में`), 'warn') : '', note + body) + '<div style="height:14px"></div>';
}
/** Removes the member's photo from storage before the record is erased. A failure stops the erase, so nothing is lost half-way. */
async function deletePhotoObject(path) {
  const res = await rawFetch('/storage/v1/object/member-photos/' + storagePath(path), { method: 'DELETE', headers: await storageAuth() });
  if (res.ok || res.status === 404) { PHOTO_CACHE.delete(path); return true; }
  toast(L('Could not remove the photo, so nothing was erased. Try again.', 'फ़ोटो नहीं हटी, इसलिए कुछ नहीं मिटा। फिर से कोशिश करें।'), 'bad');
  return false;
}
async function delErase(d) {
  const name = d.name || L('this member', 'यह सदस्य');
  if (!(await askConfirm(L(`Erase ${name}’s personal, fitness and health data? This cannot be undone. Invoices and payment records stay, as the law requires.`, `${name} का व्यक्तिगत, फ़िटनेस और स्वास्थ्य डेटा मिटाएँ? यह वापस नहीं होगा। इनवॉइस और भुगतान के रिकॉर्ड कानून के तहत रहेंगे।`), L('Erase data', 'डेटा मिटाएँ'), 'bad'))) return;
  if (d.photo && !(await deletePhotoObject(d.photo))) return;
  const r = await act(() => DB.rpc('deletion_complete', { p_request: d.req, p_note: null }), L('Data erased', 'डेटा मिटाया गया'));
  if (r) render();
}
function delRejectForm(d) {
  const m = openModal({
    title: L('Reject the request', 'अनुरोध अस्वीकार करें'),
    body: `<p class="muted" style="margin:0 0 10px">${esc(L('Say why, in a few words. The member sees this reason.', 'कारण कुछ शब्दों में लिखें। सदस्य को यही कारण दिखेगा।'))}</p><div class="fg"><label for="delNote">${esc(L('Reason', 'कारण'))}</label><textarea class="in" id="delNote" rows="3" maxlength="300"></textarea></div>`,
    footer: `<button type="button" class="btn" data-no>${esc(L('Cancel', 'रद्द करें'))}</button><button type="button" class="btn danger" data-go>${esc(L('Reject', 'अस्वीकार'))}</button>`,
  });
  m.el.querySelector('[data-no]').onclick = () => m.close();
  m.el.querySelector('[data-go]').onclick = async () => {
    const note = m.el.querySelector('#delNote').value;
    if (!delNoteOk(note)) { toast(L('Write at least 3 characters.', 'कम से कम 3 अक्षर लिखें।'), 'bad'); return; }
    const r = await act(() => DB.rpc('deletion_reject', { p_request: d.req, p_note: note.trim() }), L('Rejected. The member can see the reason.', 'अस्वीकार किया। सदस्य कारण देख सकता है।'));
    if (r) { m.close(); render(); }
  };
}
