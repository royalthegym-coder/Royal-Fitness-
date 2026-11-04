/* ================= Fee receipt: generated with the gym logo; share as an image, download, or print / save as PDF ================= */
function amountWords(n) {
  n = Math.round(Number(n) * 100) / 100;
  const r = Math.floor(n), ps = Math.round((n - r) * 100);
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const two = (x) => (x < 20 ? a[x] : b[Math.floor(x / 10)] + (x % 10 ? ' ' + a[x % 10] : ''));
  const three = (x) => (x >= 100 ? a[Math.floor(x / 100)] + ' Hundred' + (x % 100 ? ' ' : '') : '') + (x % 100 ? two(x % 100) : '');
  const cr = Math.floor(r / 1e7), lk = Math.floor((r % 1e7) / 1e5), th = Math.floor((r % 1e5) / 1e3), rest = r % 1e3;
  let s = '';
  if (cr) s += three(cr) + ' Crore '; if (lk) s += two(lk) + ' Lakh '; if (th) s += two(th) + ' Thousand '; if (rest) s += three(rest);
  s = s.trim() || 'Zero';
  return `Rupees ${s}${ps ? ' and ' + two(ps) + ' Paise' : ''} Only`;
}
async function receiptData(p, m) {
  const [members, plans, invoices, payments] = await Promise.all([Q.members(), Q.plans(), Q.invoices(), Q.payments()]);
  const mem = members.find((x) => x.id === p.member_id) || m || {}, inv = invoices.find((i) => i.id === p.invoice_id) || null;
  return { p, m: mem, plan: plans.find((x) => x.id === mem.plan_id) || null, inv, balance: inv ? balanceOf(inv, paidByInvoice(payments)) : 0, gym: CTX.gym || {} };
}
let LOGO_IMG;
function loadLogo() {
  if (!LOGO_IMG) LOGO_IMG = new Promise((resolve) => { const i = new Image(); i.onload = () => resolve(i); i.onerror = () => resolve(null); i.src = 'logo.webp'; });
  return LOGO_IMG;
}
async function receiptBlob(d) {
  const W = 800, H = 1220, c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d'), F = '"Quicksand","Noto Sans Devanagari","Mukta",system-ui,-apple-system,"Segoe UI",sans-serif', GOLD = '#a67c1d', INK = '#1b1b1b', MUTE = '#666';
  const txt = (s, px, py, o = {}) => { x.font = `${o.w || 500} ${o.s || 26}px ${F}`; x.fillStyle = o.c || INK; x.textAlign = o.a || 'left'; x.fillText(String(s), px, py); };
  x.fillStyle = '#fff'; x.fillRect(0, 0, W, H);
  x.strokeStyle = GOLD; x.lineWidth = 6; x.strokeRect(22, 22, W - 44, H - 44); x.lineWidth = 1.5; x.strokeRect(34, 34, W - 68, H - 68);
  const logo = await loadLogo(); if (logo) x.drawImage(logo, W / 2 - 80, 58, 160, 160);
  txt((d.gym.name || 'Royal The Gym').toUpperCase(), W / 2, 262, { a: 'center', w: 800, s: 38, c: '#13264d' });
  txt([d.gym.city, d.gym.phone ? '📞 ' + d.gym.phone : ''].filter(Boolean).join('  ·  '), W / 2, 300, { a: 'center', s: 22, c: MUTE });
  x.fillStyle = GOLD; x.fillRect(W / 2 - 120, 322, 240, 3);
  txt('FEE RECEIPT  /  फ़ीस रसीद', W / 2, 376, { a: 'center', w: 800, s: 32, c: GOLD });
  const rows = [
    ['Receipt No. / रसीद नं.', d.p.no || '—'], ['Date / तारीख़', fmtDate(d.p.paid_on || todayISO())],
    ['Member / सदस्य', d.m.name || '—'], ['Phone / फ़ोन', d.m.phone || '—'],
    ['Plan / प्लान', d.plan ? d.plan.name : '—'], ['Valid / अवधि', d.m.start_date && d.m.end_date ? `${fmtDate(d.m.start_date)} → ${fmtDate(d.m.end_date)}` : '—'],
    ['Invoice / इनवॉइस', d.inv ? `${d.inv.no || ''}  (${inr(d.inv.total)})` : '—'], ['Paid via / तरीक़ा', d.p.method + (d.p.ref ? ` · ${d.p.ref}` : '')],
  ];
  let y = 436;
  rows.forEach(([k, v], i) => { if (i % 2 === 0) { x.fillStyle = '#faf6ea'; x.fillRect(62, y - 34, W - 124, 50); } txt(k, 78, y, { s: 22, c: MUTE }); txt(v, W - 78, y, { a: 'right', w: 700, s: 25 }); y += 50; });
  y += 14;
  x.fillStyle = '#13264d'; x.beginPath(); x.roundRect(62, y, W - 124, 136, 18); x.fill();
  txt('AMOUNT RECEIVED  /  प्राप्त राशि', W / 2, y + 40, { a: 'center', s: 21, c: '#e7d9a8' });
  txt(inr(d.p.amount), W / 2, y + 96, { a: 'center', w: 800, s: 56, c: '#ffffff' });
  y += 176;
  txt(amountWords(d.p.amount), W / 2, y, { a: 'center', s: 21, c: MUTE, w: 600 });
  y += 42;
  if (d.balance > 0.004) txt(`Balance due / बाक़ी: ${inr(d.balance)}`, W / 2, y, { a: 'center', w: 800, s: 28, c: '#b3261e' });
  else txt('✓ Fully paid / पूरा चुकाया', W / 2, y, { a: 'center', w: 800, s: 28, c: '#1e7a3c' });
  txt('Thank you! Train like royalty 💪  /  धन्यवाद!', W / 2, H - 96, { a: 'center', w: 700, s: 26, c: '#13264d' });
  txt('Computer-generated receipt. Valid without signature.', W / 2, H - 66, { a: 'center', s: 16, c: MUTE });
  txt('कंप्यूटर द्वारा बनी रसीद, हस्ताक्षर की ज़रूरत नहीं।', W / 2, H - 46, { a: 'center', s: 16, c: MUTE });
  return new Promise((resolve, reject) => c.toBlob((b) => (b ? resolve(b) : reject(new Error('png'))), 'image/png'));
}
function downloadBlob(name, blob) {
  const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000);
}
function printImage(url) {
  const area = $('#printArea'); area.innerHTML = `<img alt="" src="${url}" style="width:100%">`;
  const img = $('img', area), go = () => { document.body.classList.add('printing'); const done = () => { document.body.classList.remove('printing'); area.innerHTML = ''; window.removeEventListener('afterprint', done); }; window.addEventListener('afterprint', done); window.print(); };
  if (img.complete) go(); else img.onload = go;
}
function receiptModal(p, m) {
  m = m || {};
  let url = null, blob = null;
  const mod = openModal({
    title: L('Receipt', 'रसीद'), wide: true,
    body: `<div id="rcBox" class="muted" style="text-align:center;min-height:160px;display:grid;place-items:center">${esc(L('Preparing receipt…', 'रसीद बन रही है…'))}</div>`,
    footer: `<a class="btn wa" target="_blank" rel="noreferrer" href="${esc(waLink(m.phone, receiptText(p, m)))}">${ic('msg')} ${esc(L('WhatsApp text', 'WhatsApp मैसेज'))}</a><button type="button" class="btn" data-sh disabled>${ic('copy')} ${esc(L('Share image', 'फ़ोटो भेजें'))}</button><button type="button" class="btn" data-dl disabled>${ic('down')} ${esc(L('Download', 'डाउनलोड'))}</button><button type="button" class="btn primary" data-pr disabled>${esc(L('Print / PDF', 'प्रिंट / PDF'))}</button>`,
    onClose: () => { if (url) URL.revokeObjectURL(url); },
  });
  const name = `${(p.no || 'receipt').replace(/[^\w-]+/g, '_')}.png`;
  (async () => {
    try {
      blob = await receiptBlob(await receiptData(p, m)); url = URL.createObjectURL(blob);
      if (!mod.el.isConnected) { URL.revokeObjectURL(url); return; }
      $('#rcBox', mod.el).style.display = 'block'; $('#rcBox', mod.el).innerHTML = `<img alt="${esc(L('Receipt', 'रसीद'))}" src="${url}" style="width:100%;max-width:440px;border-radius:8px;border:1px solid var(--line)">`;
      $$('[data-sh],[data-dl],[data-pr]', mod.el).forEach((b) => (b.disabled = false));
    } catch (e) { const bx = $('#rcBox', mod.el); if (bx) bx.textContent = L('Could not draw the receipt image. Use the WhatsApp text instead.', 'रसीद की फ़ोटो नहीं बन सकी। WhatsApp मैसेज इस्तेमाल करें।'); }
  })();
  $('[data-dl]', mod.el).onclick = () => blob && downloadBlob(name, blob);
  $('[data-pr]', mod.el).onclick = () => url && printImage(url);
  $('[data-sh]', mod.el).onclick = async () => {
    if (!blob) return;
    const file = new File([blob], name, { type: 'image/png' });
    try { if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: `${gymName()} ${L('receipt', 'रसीद')}`, text: receiptText(p, m) }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
    downloadBlob(name, blob); toast(L('Sharing is not supported here, so the image was downloaded. Send it on WhatsApp from your gallery.', 'यहाँ सीधे शेयर नहीं हो सकता, इसलिए फ़ोटो डाउनलोड हुई। गैलरी से WhatsApp पर भेजें।'));
  };
}
