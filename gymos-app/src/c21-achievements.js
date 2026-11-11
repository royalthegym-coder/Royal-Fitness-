/* ================= Achievements: badges and a level, worked out from the member's own real visits (last 90 days) ================= */
const BADGES = [
  { id: 'd1', kind: 'days', n: 1, en: 'First step', hi: 'पहला कदम' }, { id: 'd10', kind: 'days', n: 10, en: 'Regular', hi: 'नियमित' },
  { id: 'd25', kind: 'days', n: 25, en: 'Committed', hi: 'पक्का इरादा' }, { id: 'd50', kind: 'days', n: 50, en: 'Iron habit', hi: 'लोहे की आदत' },
  { id: 's3', kind: 'streak', n: 3, en: 'On a roll', hi: 'लय में' }, { id: 's7', kind: 'streak', n: 7, en: 'Week warrior', hi: 'हफ़्ते का योद्धा' },
  { id: 's14', kind: 'streak', n: 14, en: 'Two weeks strong', hi: 'दो हफ़्ते डटे' }, { id: 's30', kind: 'streak', n: 30, en: 'Unstoppable', hi: 'रुकने वाले नहीं' },
];
const LEVELS = [[0, 'Starter', 'शुरुआती'], [10, 'Regular', 'नियमित'], [25, 'Strong', 'मज़बूत'], [50, 'Elite', 'एलीट']];

/* pure: days trained in the window and the best run of days in a row -> every badge with earned flag, the level, and the next goal */
function badgeStatus(daysTrained, bestRun) {
  const val = (b) => (b.kind === 'days' ? daysTrained : bestRun);
  const list = BADGES.map((b) => ({ ...b, earned: val(b) >= b.n, have: Math.min(val(b), b.n) }));
  let lv = LEVELS[0]; LEVELS.forEach((x) => { if (daysTrained >= x[0]) lv = x; });
  const nxt = LEVELS.find((x) => x[0] > daysTrained) || null;
  const todo = list.filter((b) => !b.earned).sort((a, b) => (b.have / b.n) - (a.have / a.n))[0] || null;
  return { list, level: lv, nextLevel: nxt, goal: todo };
}

function achievementsCard(visits) {
  const days = visitDays(visits), st = badgeStatus(days.size, bestStreak(days)), got = st.list.filter((b) => b.earned).length;
  const pill = (b) => `<span class="badge ${b.earned ? 'ok' : ''}" title="${esc(b.kind === 'days' ? L(`Train on ${b.n} different days`, `${b.n} अलग-अलग दिन ट्रेनिंग करें`) : L(`Train ${b.n} days in a row`, `लगातार ${b.n} दिन ट्रेनिंग करें`))}" style="${b.earned ? '' : 'color:var(--muted);border-color:var(--line)'}">${ic(b.earned ? 'check' : 'lock')} ${esc(L(b.en, b.hi))}</span>`;
  const g = st.goal;
  const goal = g ? `<p class="muted" style="margin:12px 0 0">${esc(L('Next badge: ', 'अगला बैज: '))}<b>${esc(L(g.en, g.hi))}</b> · ${esc(g.kind === 'days' ? L(`${g.have} of ${g.n} training days`, `${g.n} में से ${g.have} ट्रेनिंग दिन`) : L(`best run ${g.have} of ${g.n} days in a row`, `लगातार ${g.n} में से सबसे लंबा ${g.have} दिन`))}</p><div style="height:6px;border-radius:6px;background:var(--line);margin-top:6px;overflow:hidden"><div style="height:100%;width:${Math.round((g.have / g.n) * 100)}%;background:var(--crimson)"></div></div>` : `<p class="muted" style="margin:12px 0 0">${esc(L('All badges earned. Keep the habit going!', 'सारे बैज मिल गए। यही आदत बनाए रखें!'))}</p>`;
  return card(L('Achievements', 'उपलब्धियाँ'), 'crown', `<span class="muted" style="font-size:13px">${esc(L(`${got} of ${st.list.length}`, `${st.list.length} में से ${got}`))}</span>`,
    `<p style="margin:0 0 10px"><b>${esc(L('Level: ', 'स्तर: '))}${esc(L(st.level[1], st.level[2]))}</b>${st.nextLevel ? `<span class="muted"> · ${esc(L(`${st.nextLevel[0] - days.size} more training days to ${st.nextLevel[1]}`, `${st.nextLevel[2]} तक ${st.nextLevel[0] - days.size} और ट्रेनिंग दिन`))}</span>` : ''}</p><div style="display:flex;flex-wrap:wrap;gap:8px">${st.list.map(pill).join('')}</div>${goal}<p class="muted" style="margin:10px 0 0;font-size:12px">${esc(L('Counted from your check-ins in the last 90 days.', 'पिछले 90 दिनों की आपकी चेक-इन से गिना गया।'))}</p>`);
}
