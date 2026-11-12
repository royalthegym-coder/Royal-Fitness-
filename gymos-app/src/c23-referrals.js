/* ================= Referrals: who brought whom. Counts only, no rewards are promised by the app ================= */
function referralRows(members) {
  const byId = new Map(members.map((m) => [m.id, m])), tally = new Map();
  members.forEach((m) => { if (m.referred_by && byId.has(m.referred_by)) { const a = tally.get(m.referred_by) || []; a.push(m); tally.set(m.referred_by, a); } });
  return [...tally.entries()].map(([id, kids]) => ({ m: byId.get(id), kids })).sort((a, b) => b.kids.length - a.kids.length || a.m.name.localeCompare(b.m.name));
}
function referralCard(members) {
  const rows = referralRows(members).slice(0, 10);
  const msg = (m, n) => L(`Thank you ${m.name}! ${n} friend${n > 1 ? 's' : ''} joined ${gymName()} because of you. We truly appreciate it.`, `धन्यवाद ${m.name} जी! आपकी वजह से ${n} साथी ${gymName()} से जुड़े। हम दिल से आभारी हैं।`);
  const row = ({ m, kids }) => `<li class="click" data-act="openMember" data-id="${esc(m.id)}">${avatarM(m)}<div class="grow"><b>${esc(m.name)}</b><small>${esc(L(`${kids.length} joined`, `${kids.length} जुड़े`))}: ${esc(kids.slice(0, 3).map((k) => k.name).join(', '))}${kids.length > 3 ? '…' : ''}</small></div>${m.phone ? `<a class="btn wa sm" target="_blank" rel="noopener" href="${esc(waLink(m.phone, msg(m, kids.length)))}" onclick="event.stopPropagation()">WhatsApp</a>` : ''}</li>`;
  return card(L('Top referrers', 'सबसे ज़्यादा जुड़वाने वाले'), 'users', '', rows.length ? `<ul class="list">${rows.map(row).join('')}</ul>` : empty(L('No referrals yet', 'अभी कोई रेफ़रल नहीं'), L('When adding a member, pick who referred them. Your best promoters show up here.', 'सदस्य जोड़ते समय चुनें कि किसने जुड़वाया। आपके सबसे अच्छे प्रचारक यहाँ दिखेंगे।')));
}
