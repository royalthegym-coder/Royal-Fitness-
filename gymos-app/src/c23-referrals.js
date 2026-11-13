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

/* ---------- referral rewards: bonus days for the referrer once the friend has paid; the owner gives each reward once ---------- */
async function referralRewardsCard(members) {
  const days = Number(CTX.gym && CTX.gym.referral_reward_days) || 0;
  if (!days) return '';
  let rewards = []; try { rewards = await DB.select('referral_rewards', { limit: 2000 }); } catch (e) { return ''; }
  const done = new Set(rewards.map((r) => r.referred_id)), paid = new Set((await Q.payments()).filter((p) => Number(p.amount) > 0).map((p) => p.member_id)), byId = new Map(members.map((m) => [m.id, m]));
  const waiting = members.filter((m) => m.referred_by && paid.has(m.id) && !done.has(m.id) && byId.has(m.referred_by) && byId.get(m.referred_by).status !== 'Cancelled');
  const row = (m) => { const rf = byId.get(m.referred_by); return `<li><div class="grow"><b>${esc(rf.name)}</b><small>${esc(L(`brought ${m.name}, who has paid`, `${m.name} को जुड़वाया, जिन्होंने भुगतान कर दिया`))}</small></div><button class="btn sm pri" data-act="giveReward" data-id="${esc(m.id)}">${esc(L(`Give ${days} days`, `${days} दिन दें`))}</button></li>`; };
  return card(L('Referral rewards', 'रेफ़रल इनाम'), 'users', '', waiting.length ? `<ul class="list">${waiting.map(row).join('')}</ul><p class="muted" style="margin:8px 0 0;font-size:12px">${esc(L(`Each reward adds ${days} days to the referrer's membership and can be given only once per friend.`, `हर इनाम से जुड़वाने वाले की सदस्यता ${days} दिन बढ़ती है, और हर साथी के लिए सिर्फ़ एक बार दिया जा सकता है।`))}</p>` : empty(L('No rewards waiting', 'कोई इनाम बाकी नहीं'), L(`When a referred member pays, the referrer earns ${days} bonus days. They show up here for you to give.`, `जब जुड़वाया हुआ सदस्य भुगतान करता है, जुड़वाने वाले को ${days} बोनस दिन मिलते हैं। वे यहाँ आपके देने के लिए दिखेंगे।`)));
}
async function giveReward(referredId) {
  const members = await Q.members(), m = members.find((x) => x.id === referredId), rf = m && members.find((x) => x.id === m.referred_by); if (!rf) return;
  const days = Number(CTX.gym.referral_reward_days) || 0;
  if (!(await askConfirm(L(`Add ${days} days to ${rf.name}'s membership?`, `${rf.name} की सदस्यता में ${days} दिन जोड़ें?`), L('Give', 'दें'), 'primary'))) return;
  const ok = await act(() => DB.rpc('admin_grant_referral_reward', { referred: referredId }), L('Reward given', 'इनाम दे दिया'));
  if (ok) { bust('members'); render(); }
}

/* member home: a ready invitation to share, and the bonus days earned so far */
async function inviteCard(m) {
  const days = Number(CTX.gym && CTX.gym.referral_reward_days) || 0;
  let earned = 0; try { earned = (await DB.select('referral_rewards', { eq: { referrer_id: m.id }, limit: 500 })).reduce((s, r) => s + Number(r.days), 0); } catch (e) { earned = 0; }
  const text = L(`Hi! I train at ${gymName()} and I like it. Join and tell them ${m.name} sent you.`, `नमस्ते! मैं ${gymName()} में ट्रेनिंग करता/करती हूँ और मुझे पसंद है। आप भी जुड़ें और बताएँ कि ${m.name} ने भेजा है।`);
  return `<div class="card" style="padding:14px;margin-bottom:14px"><div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap"><span style="flex:1;min-width:200px"><b>${esc(L('Invite a friend', 'दोस्त को बुलाएँ'))}</b><br><span class="muted">${esc(days ? L(`When your friend joins and pays, you get ${days} bonus days.`, `दोस्त के जुड़ने और भुगतान करने पर आपको ${days} बोनस दिन मिलते हैं।`) : L('Train together, stay consistent.', 'साथ ट्रेनिंग करें, लगातार रहें।'))}${earned ? ' ' + esc(L(`Earned so far: ${earned} days.`, `अब तक मिले: ${earned} दिन।`)) : ''}</span></span><a class="btn wa" target="_blank" rel="noopener noreferrer" href="${esc(waLink('', text))}">${esc(L('Share on WhatsApp', 'WhatsApp पर भेजें'))}</a></div></div>`;
}
