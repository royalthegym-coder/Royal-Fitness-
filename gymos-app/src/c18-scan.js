/* ================= QR check-in: the member shows a QR pass, staff scan it (camera or a barcode scanner) ================= */
const PASS_RE = /^gymos:([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;
const passCode = (m) => `gymos:${m.id}`;

/* member side: the pass shown on the home page (made in the browser, works offline) */
function memberPassCard(m) {
  return card(L('My check-in pass', 'मेरा चेक-इन पास'), 'door', '', `<div style="padding:4px 18px 18px;text-align:center"><div class="qrbox">${qrSvg(passCode(m), 240)}</div><p class="muted" style="margin:10px 0 0">${esc(L('Show this QR at the front desk to check in. Turn the screen brightness up.', 'चेक-इन के लिए रिसेप्शन पर यह QR दिखाएँ। स्क्रीन की रोशनी बढ़ा लें।'))}</p></div>`);
}

/* staff side: turn one scan into a check-in, or a check-out if the member is already inside today */
async function scanCheckIn(text) {
  const mt = PASS_RE.exec(String(text || '').trim());
  if (!mt) { toast(L('This is not a GymOS pass', 'यह GymOS पास नहीं है'), 'bad'); return false; }
  const id = mt[1].toLowerCase();
  bust('members', 'visits');
  const [members, visits] = await Promise.all([Q.members(), Q.visits()]), m = members.find((x) => x.id === id);
  if (!m) { toast(L('This member is not in your gym', 'यह सदस्य आपके जिम का नहीं है'), 'bad'); return false; }
  const s = memberState(m);
  if (['Expired', 'Frozen', 'Cancelled'].includes(s)) { toast(`${m.name}: ${LANG === 'hi' && STATE_HI[s] ? STATE_HI[s] : s}`, 'bad'); return false; }
  const open = visits.find((v) => v.member_id === id && !v.out_at && istDate(v.in_at) === todayISO());
  const r = open
    ? await act(() => DB.update('visits', open.id, { out_at: new Date().toISOString() }), L(`${m.name} checked out`, `${m.name} चेक-आउट`))
    : await act(() => DB.insert('visits', { gym_id: gymId(), member_id: id }), L(`${m.name} checked in`, `${m.name} चेक-इन`));
  if (r) { bust('visits'); render(); setTimeout(() => { const i = $('#scanIn'); if (i) i.focus(); }, 250); }
  return !!r;
}

/* camera scanner, where the browser has a built-in QR reader (Chrome on Android and desktop); otherwise the code box below still works */
const canScanCamera = () => 'BarcodeDetector' in window && !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
async function openScanner() {
  if (!canScanCamera()) { toast(L('This browser cannot scan with the camera. Use Chrome, or a barcode scanner with the code box.', 'यह ब्राउज़र कैमरे से स्कैन नहीं कर सकता। Chrome चलाएँ, या कोड बॉक्स में बारकोड स्कैनर इस्तेमाल करें।'), 'bad'); return; }
  let stream;
  try { stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false }); } catch (e) { toast(L('Camera permission was not given', 'कैमरे की अनुमति नहीं मिली'), 'bad'); return; }
  const mod = openModal({ title: L('Scan member pass', 'सदस्य का पास स्कैन करें'), body: `<video id="scanVid" playsinline muted style="width:100%;border-radius:10px;background:#000"></video><p class="muted" style="margin:8px 0 0">${esc(L('Hold the member\'s QR in front of the camera.', 'सदस्य का QR कैमरे के सामने रखें।'))}</p>` });
  const vid = $('#scanVid', mod.el); vid.srcObject = stream; try { await vid.play(); } catch (e) { /* the user may have closed the window */ }
  const det = new window.BarcodeDetector({ formats: ['qr_code'] });
  let busy = false;
  const stop = () => stream.getTracks().forEach((t) => t.stop());
  const loop = async () => {
    if (!mod.el.isConnected) { stop(); return; }
    if (!busy) { try { const found = await det.detect(vid); if (found.length) { busy = true; const ok = await scanCheckIn(found[0].rawValue); if (ok && mod.el.isConnected) mod.close(); else setTimeout(() => { busy = false; }, 2500); } } catch (e) { /* a frame that cannot be read is skipped */ } }
    setTimeout(loop, 300);
  };
  loop();
}

/* a barcode scanner that types the code and presses Enter (a "keyboard wedge" scanner) fills this box */
document.addEventListener('keydown', async (e) => {
  if (e.key !== 'Enter' || !e.target || e.target.id !== 'scanIn') return;
  e.preventDefault(); const v = e.target.value; e.target.value = ''; if (v.trim()) await scanCheckIn(v);
});
