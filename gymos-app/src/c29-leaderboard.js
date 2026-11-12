/* ================= Gym leaderboard: opt-in only. Shows first name, last initial and training days this month ================= */
async function leaderboardCard(m) {
  if (!m.leaderboard_opt_in) {
    return card(L('Gym leaderboard', 'जिम लीडरबोर्ड'), 'crown', '', `<p style="margin:0 0 10px">${esc(L('See who trained the most days this month. If you join, other members of the gym see your first name, last initial and training days. Nothing else. You can leave any time.', 'देखें कि इस महीने किसने सबसे ज़्यादा दिन ट्रेनिंग की। जुड़ने पर जिम के बाकी सदस्य आपका पहला नाम, उपनाम का पहला अक्षर और ट्रेनिंग के दिन देखेंगे। और कुछ नहीं। आप कभी भी निकल सकते हैं।'))}</p><button class="btn pri" data-act="lbJoin">${esc(L('Join the leaderboard', 'लीडरबोर्ड में जुड़ें'))}</button>`);
  }
  let rows = []; try { rows = await DB.rpc('gym_leaderboard'); } catch (e) { rows = null; }
  const body = rows === null ? `<p class="muted" style="margin:0">${esc(L('The leaderboard is not available right now.', 'लीडरबोर्ड अभी उपलब्ध नहीं है।'))}</p>`
    : rows.length ? `<ul class="list">${rows.map((r) => `<li${r.is_me ? ' style="background:var(--ok-soft);border-radius:8px"' : ''}><b style="min-width:28px">#${esc(String(r.rank))}</b><div class="grow"><b>${esc(r.display_name)}</b>${r.is_me ? ` ${badge(L('You', 'आप'), 'ok')}` : ''}</div><span>${esc(L(`${r.days} days`, `${r.days} दिन`))}</span></li>`).join('')}</ul>`
      : `<p class="muted" style="margin:0">${esc(L('No check-ins this month yet. Be the first.', 'इस महीने अभी कोई चेक-इन नहीं। पहले आप बनें।'))}</p>`;
  return card(L('Gym leaderboard', 'जिम लीडरबोर्ड'), 'crown', `<button class="btn sm" data-act="lbLeave">${esc(L('Leave', 'निकलें'))}</button>`, body + `<p class="muted" style="margin:8px 0 0;font-size:12px">${esc(L('Training days this month, counted from check-ins. Only members who joined are listed.', 'इस महीने के ट्रेनिंग दिन, चेक-इन से गिने गए। सिर्फ़ जुड़े हुए सदस्य दिखते हैं।'))}</p>`);
}
async function setLeaderboard(on) {
  if (on && !(await askConfirm(L('Show your first name, last initial and training days to other members?', 'अपना पहला नाम, उपनाम का पहला अक्षर और ट्रेनिंग के दिन बाकी सदस्यों को दिखाएँ?'), L('Join', 'जुड़ें'), 'primary'))) return;
  const ok = await act(() => DB.rpc('set_my_leaderboard', { opt: on }), on ? L('You are on the leaderboard', 'आप लीडरबोर्ड में हैं') : L('You left the leaderboard', 'आप लीडरबोर्ड से निकल गए'));
  if (ok) { bust('members'); render(); }
}
