/* ================= Owner's dashboard: short Hindi summary of today's collection, dues and check-ins =================
   Built by the daily-summary Edge Function (numbers from the database; an AI gateway may only re-word the text). */
async function fetchDaySummary() {
  if (SESSION && SESSION.expires_at && SESSION.expires_at - 30 < Date.now() / 1000) await refreshSession();
  const res = await rawFetch('/functions/v1/daily-summary', { method: 'POST', headers: { apikey: CFG.key, Authorization: 'Bearer ' + (SESSION && SESSION.access_token), 'Content-Type': 'application/json' }, body: '{}' });
  if (res.status === 401) { saveSession(null); if (typeof onSignedOut === 'function') onSignedOut(); throw new ApiError('session expired', 401, 'jwt'); }
  const j = await res.json().catch(() => ({}));
  if (!res.ok || !j.text) throw new Error(j.error || 'HTTP ' + res.status);
  return j;
}
async function loadDaySummary() {
  const box = $('#daySum'); if (!box) return;
  const hour = new Date(Date.now() + 5.5 * 3600 * 1000).getUTCHours(), evening = hour >= 21;
  const title = evening ? L('Today\'s summary', 'आज का सारांश') : L('Today so far', 'आज अब तक');
  const draw = (body) => { const b = $('#daySum'); if (b) b.innerHTML = body; };
  draw(card(title, 'pulse', '', `<p class="muted" style="margin:0">${esc(L('Preparing…', 'तैयार हो रहा है…'))}</p>`) + '<div style="height:14px"></div>');
  try {
    const [s, past] = await Promise.all([fetchDaySummary(), DB.select('daily_summaries', { order: 'day.desc', limit: 3 }).catch(() => [])]);
    const yday = past.find((r) => r.day !== s.day && r.day < s.day);
    const upd = s.cached ? '' : ` · ${L('updated', 'अपडेट')} ${fmtTime(new Date().toISOString())}`;
    draw(card(title, 'pulse', s.source === 'ai' ? badge('AI', 'info') : '', `<p id="daySumText" style="margin:0;line-height:1.7;font-size:15px">${esc(s.text)}</p><small class="muted">${esc(fmtDate(s.day))}${esc(upd)}</small>${yday ? `<div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--line)"><small class="muted">${esc(L('Last closing summary', 'पिछला अंतिम सारांश'))} · ${esc(fmtDate(yday.day))}</small><p style="margin:4px 0 0;font-size:13px" class="muted">${esc(yday.text_hi)}</p></div>` : ''}`) + '<div style="height:14px"></div>');
  } catch (e) {
    draw(card(title, 'pulse', '', `<p class="muted" style="margin:0">${esc(L('The summary is not available right now.', 'सारांश अभी उपलब्ध नहीं है।'))} <a href="#dashboard" data-act="retry">${esc(L('Try again', 'फिर कोशिश करें'))}</a></p>`) + '<div style="height:14px"></div>');
  }
}
