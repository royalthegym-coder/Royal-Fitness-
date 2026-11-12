/* ================= Membership freeze: pause a running membership, the end date moves by the days frozen ================= */
const openFreeze = (memberId) => DB.select('member_freezes', { eq: { member_id: memberId }, filters: { ended_on: 'is.null' }, limit: 1 }).then((r) => r[0] || null);

function freezeForm(m) {
  openForm({
    title: `${L('Freeze membership', 'सदस्यता फ़्रीज़ करें')} · ${m.name}`, submitLabel: L('Freeze', 'फ़्रीज़ करें'),
    fields: [{ k: 'reason', label: L('Reason (optional)', 'कारण (वैकल्पिक)'), full: true, ph: L('Travelling, injury…', 'बाहर जाना, चोट…'), check: (v) => (v.length > 200 ? L('Up to 200 characters', 'अधिकतम 200 अक्षर') : '') }],
    extra: `<p class="muted" style="margin:10px 0 0">${esc(L('The member cannot check in while frozen. When you unfreeze, the end date moves ahead by the days frozen.', 'फ़्रीज़ में सदस्य चेक-इन नहीं कर सकेगा। खोलने पर समाप्ति की तारीख़ फ़्रीज़ के दिनों जितनी आगे बढ़ जाएगी।'))}</p>`,
    onSubmit: async (v) => {
      const ok = await act(() => DB.rpc('freeze_member', { member: m.id, why: v.reason ? v.reason.trim() : null }), L('Membership frozen', 'सदस्यता फ़्रीज़ हुई'));
      if (ok) { bust('members'); render(); } return !!ok;
    },
  });
}

async function unfreezeMember(m) {
  let f = null; try { f = await openFreeze(m.id); } catch (e) { /* the question below still works without the date */ }
  const days = f ? Math.max(diffDays(f.started_on, todayISO()), 0) : 0, nu = m.end_date ? addDays(m.end_date, days) : null;
  const sentence = f ? L(`Frozen since ${fmtDate(f.started_on)} (${days} days). The end date moves from ${fmtDate(m.end_date)} to ${fmtDate(nu)}.`, `${fmtDate(f.started_on)} से फ़्रीज़ (${days} दिन)। समाप्ति ${fmtDate(m.end_date)} से बढ़कर ${fmtDate(nu)} होगी।`) : L('Unfreeze this membership?', 'यह सदस्यता खोलें?');
  if (!(await askConfirm(sentence, L('Unfreeze', 'फ़्रीज़ हटाएँ'), 'primary'))) return;
  const ok = await act(() => DB.rpc('unfreeze_member', { member: m.id }), L('Membership is active again', 'सदस्यता फिर चालू हुई'));
  if (ok !== null && ok !== false) { closeAllModals(); bust('members'); render(); }
}
