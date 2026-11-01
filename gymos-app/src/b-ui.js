/* ---------- icons ---------- */
const ICONS = {
  home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
  door: '<path d="M13 4h3a2 2 0 0 1 2 2v14"/><path d="M2 20h3M13 20h9M10 12v.01"/><path d="M13 4.56v16.16a1 1 0 0 1-1.24.97L5 20V5.56a2 2 0 0 1 1.5-1.94l4-1A2 2 0 0 1 13 4.56Z"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  receipt: '<path d="M4 2v20l3-2 3 2 3-2 3 2 3-2V2z"/><path d="M8 7h8M8 11h8M8 15h5"/>',
  wallet: '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
  tag: '<path d="M12.59 2.59A2 2 0 0 0 11.17 2H4a2 2 0 0 0-2 2v7.17a2 2 0 0 0 .59 1.41l8.7 8.7a2.43 2.43 0 0 0 3.42 0l6.58-6.58a2.43 2.43 0 0 0 0-3.42z"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>', x: '<path d="M18 6 6 18M6 6l12 12"/>',
  check: '<path d="M20 6 9 17l-5-5"/>', left: '<path d="m15 18-6-6 6-6"/>', right: '<path d="m9 18 6-6-6-6"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>', msg: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
  globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20"/>',
  crown: '<path d="M3 8l4 4 5-7 5 7 4-4-2 11H5z"/>', clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  pencil: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  shield: '<path d="M12 2 4 5v6c0 5 3.5 9 8 11 4.5-2 8-6 8-11V5z"/><path d="m9 12 2 2 4-4"/>',
  pulse: '<path d="M3 12h4l3-8 4 16 3-8h4"/>', chart: '<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/>',
  building: '<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2"/>',
  lock: '<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  copy: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
  down: '<path d="M12 3v12m0 0-4-4m4 4 4-4M4 21h16"/>', out: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
};
const ic = (n) => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ''}</svg>`;

/* ---------- toast + modal ---------- */
function toast(msg, kind) {
  const el = document.createElement('div');
  el.className = 'toast' + (kind === 'bad' ? ' bad' : '');
  el.setAttribute('role', 'status'); el.textContent = msg;
  $('#toasts').appendChild(el);
  setTimeout(() => el.remove(), kind === 'bad' ? 6000 : 2800);
}
const MODALS = [];
function openModal({ title, body, footer = '', wide = false, onClose }) {
  const prev = document.activeElement;
  const ov = document.createElement('div');
  ov.className = 'ov';
  ov.innerHTML = `<div class="md${wide ? ' wide' : ''}" role="dialog" aria-modal="true" aria-label="${esc(title)}"><header><h2>${esc(title)}</h2><button type="button" class="btn ghost ibtn" data-x aria-label="${esc(L('Close', 'बंद करें'))}">${ic('x')}</button></header><div class="mb">${body}</div>${footer ? `<footer>${footer}</footer>` : ''}</div>`;
  $('#modals').appendChild(ov); MODALS.push(ov);
  const api2 = { el: ov, close() { if (!ov.isConnected) return; ov.remove(); const i = MODALS.indexOf(ov); if (i >= 0) MODALS.splice(i, 1); if (onClose) onClose(); if (prev && prev.focus && prev.isConnected) prev.focus(); } };
  ov.addEventListener('mousedown', (e) => { if (e.target === ov) api2.close(); });
  $('[data-x]', ov).addEventListener('click', api2.close);
  const first = $('input:not([type=hidden]),select,textarea', ov);
  (first || $('[data-x]', ov)).focus();
  return api2;
}
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && MODALS.length) MODALS[MODALS.length - 1].querySelector('[data-x]').click(); });
const closeAllModals = () => { while (MODALS.length) MODALS[MODALS.length - 1].querySelector('[data-x]').click(); };
function askConfirm(msg, label, tone) {
  return new Promise((resolve) => {
    let done = false;
    const m = openModal({ title: L('Please confirm', 'पक्का करें'), body: `<p style="margin:0">${esc(msg)}</p>`, footer: `<button type="button" class="btn" data-no>${esc(L('Cancel', 'रद्द करें'))}</button><button type="button" class="btn ${tone === 'primary' ? 'primary' : 'danger'}" data-yes>${esc(label || L('Confirm', 'पक्का'))}</button>`, onClose: () => { if (!done) resolve(false); } });
    $('[data-no]', m.el).onclick = () => { done = true; m.close(); resolve(false); };
    $('[data-yes]', m.el).onclick = () => { done = true; m.close(); resolve(true); };
  });
}

/* ---------- forms ---------- */
function fieldHtml(f, v) {
  const id = 'f_' + f.k, val = v[f.k] ?? f.def ?? '';
  let inner;
  if (f.type === 'select') inner = `<select class="sel" id="${id}">${f.options.map((o) => `<option value="${esc(o.v)}"${String(o.v) === String(val) ? ' selected' : ''}>${esc(o.l)}</option>`).join('')}</select>`;
  else if (f.type === 'textarea') inner = `<textarea class="ta" id="${id}" placeholder="${esc(f.ph || '')}">${esc(val)}</textarea>`;
  else if (f.type === 'check') return `<label class="ck fl${f.full ? ' full' : ''}"><input type="checkbox" id="${id}"${val ? ' checked' : ''}> ${esc(f.label)}</label>`;
  else inner = `<input class="in" id="${id}" type="${f.type || 'text'}" value="${esc(val)}" placeholder="${esc(f.ph || '')}"${f.type === 'number' ? ` step="${f.step || 'any'}" min="${f.min ?? 0}" inputmode="decimal"` : ''}${f.type === 'tel' ? ' inputmode="tel" autocomplete="off"' : ''}${f.type === 'password' ? ' autocomplete="new-password"' : ''}${f.type === 'email' ? ' autocomplete="username"' : ''}>`;
  return `<label class="fl${f.full ? ' full' : ''}"><span>${esc(f.label)}${f.req ? ' *' : ''}</span>${inner}<small class="err" id="e_${f.k}"></small></label>`;
}
function readForm(root, fields) {
  const out = {}; let ok = true;
  fields.forEach((f) => {
    const el = $('#f_' + f.k, root), er = $('#e_' + f.k, root); if (!el) return;
    let v = f.type === 'check' ? el.checked : el.value.trim();
    if (f.type === 'number') v = v === '' ? '' : parseFloat(v);
    let msg = '';
    if (f.req && (v === '' || v === null || Number.isNaN(v))) msg = L('Required', 'ज़रूरी है');
    else if (f.type === 'number' && v !== '' && (Number.isNaN(v) || v < (f.min ?? 0))) msg = L('Enter a valid number', 'सही संख्या लिखें');
    else if (f.type === 'tel' && v && String(v).replace(/\D/g, '').length < 10) msg = L('Enter a 10-digit number', '10 अंकों का नंबर लिखें');
    else if (f.type === 'email' && v && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) msg = L('Enter a valid email', 'सही ईमेल लिखें');
    else if (f.check) msg = f.check(v, out) || '';
    if (er) er.textContent = msg;
    if (msg) ok = false;
    out[f.k] = v;
  });
  return ok ? out : null;
}
function openForm({ title, fields, values = {}, submitLabel, onSubmit, extra = '', wide = false }) {
  const m = openModal({ title, wide, body: `<form id="mf" novalidate><div class="fg">${fields.map((f) => fieldHtml(f, values)).join('')}</div>${extra}</form>`, footer: `<button type="button" class="btn" data-no>${esc(L('Cancel', 'रद्द करें'))}</button><button type="button" class="btn primary" data-ok>${esc(submitLabel || L('Save', 'सेव करें'))}</button>` });
  const btn = $('[data-ok]', m.el);
  const go = async () => {
    const vals = readForm(m.el, fields);
    if (!vals) { const bad = $('.err:not(:empty)', m.el); if (bad) bad.closest('label').querySelector('input,select,textarea')?.focus(); return; }
    btn.disabled = true;
    try { const r = await onSubmit(vals, m); if (r !== false) m.close(); } catch (e) { toast(friendlyError(e), 'bad'); } finally { btn.disabled = false; }
  };
  btn.onclick = go; $('[data-no]', m.el).onclick = m.close;
  $('#mf', m.el).addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') { e.preventDefault(); go(); } });
  $('#mf', m.el).addEventListener('submit', (e) => e.preventDefault());
  return m;
}
const opts = (arr) => arr.map((x) => (typeof x === 'string' ? { v: x, l: x } : x));

/* ---------- view building blocks ---------- */
const pageHead = (eyebrow, title, sub, actions) => `<div class="ph"><div><div class="eye">${esc(eyebrow)}</div><h1>${esc(title)}</h1>${sub ? `<p>${esc(sub)}</p>` : ''}</div>${actions ? `<div class="acts">${actions}</div>` : ''}</div>`;
const card = (title, icon, link, body, cls) => `<section class="card ${cls || ''}"><h2><span style="display:flex;gap:8px;align-items:center">${ic(icon)}${esc(title)}</span>${link || ''}</h2>${body}</section>`;
const empty = (title, text, btn) => `<div class="empty"><b>${esc(title)}</b>${text ? esc(text) : ''}${btn ? `<div style="margin-top:12px">${btn}</div>` : ''}</div>`;
const tile = (label, value, sub, color) => `<div class="card tile"><div class="l">${esc(label)}</div><div class="v"${color ? ` style="color:${color}"` : ''}>${value}</div>${sub ? `<div class="s">${sub}</div>` : ''}</div>`;
const chipsHtml = (key, cur, items) => `<div class="chips" role="tablist">${items.map(([v, label, n]) => `<button class="chip" role="tab" aria-selected="${cur === v}" data-act="chip" data-key="${key}" data-v="${esc(v)}">${esc(label)}${n != null ? `<span class="c">${n}</span>` : ''}</button>`).join('')}</div>`;
const searchBox = (id, val, ph) => `<div class="srch">${ic('search')}<input class="in" id="${id}" data-bind="${id}" value="${esc(val)}" placeholder="${esc(ph)}" aria-label="${esc(ph)}" autocomplete="off"></div>`;
const avatar = (n) => `<span class="av">${esc(initials(n))}</span>`;
const TONE = { Active: 'ok', Expiring: 'warn', Expired: 'bad', Frozen: 'info', Cancelled: 'mute', Paid: 'ok', Partial: 'warn', Unpaid: 'info', Overdue: 'bad' };
const STATE_HI = { Active: 'सक्रिय', Expiring: 'खत्म होने वाली', Expired: 'खत्म', Frozen: 'फ़्रीज़', Cancelled: 'रद्द', Paid: 'चुकाया', Partial: 'आंशिक', Unpaid: 'बाक़ी', Overdue: 'देर' };
const badge = (label, tone) => `<span class="badge ${tone || TONE[label] || 'mute'}">${esc(LANG === 'hi' && STATE_HI[label] ? STATE_HI[label] : label)}</span>`;
const PAGE = 15;
const pagerHtml = (total, page, key) => { if (total <= PAGE) return ''; const pages = Math.ceil(total / PAGE); return `<div class="pager"><span class="num">${(page - 1) * PAGE + 1}–${Math.min(page * PAGE, total)} / ${total}</span><span style="display:flex;gap:6px"><button class="btn sm" data-act="page" data-key="${key}" data-d="-1" ${page <= 1 ? 'disabled' : ''} aria-label="Previous">${ic('left')}</button><button class="btn sm" data-act="page" data-key="${key}" data-d="1" ${page >= pages ? 'disabled' : ''} aria-label="Next">${ic('right')}</button></span></div>`; };
const loadingHtml = () => `<div role="status" aria-live="polite"><span class="sr">${esc(L('Loading…', 'लोड हो रहा है…'))}</span><div class="skel" style="width:40%;height:28px;margin-bottom:22px"></div><div class="card" style="padding:18px">${'<div class="skel" style="margin:12px 0"></div>'.repeat(5)}</div></div>`;
async function copyText(text, okMsg) {
  try { await navigator.clipboard.writeText(text); toast(okMsg || L('Copied', 'कॉपी हो गया')); return; } catch (e) {}
  const m = openModal({ title: L('Copy this text', 'यह टेक्स्ट कॉपी करें'), body: `<textarea class="ta" id="cpt" readonly style="min-height:90px">${esc(text)}</textarea>` });
  const ta = $('#cpt', m.el); ta.focus(); ta.select();
}
function downloadCsv(filename, rows) {
  const data = '﻿' + rows.map((r) => r.map(csvCell).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([data], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000);
}
