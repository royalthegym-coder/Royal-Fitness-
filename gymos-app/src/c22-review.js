/* ================= Google review link: the owner pastes it once; a QR for the front desk and a button for members ================= */
/* same rule as the database check: https and a Google address only, no spaces, up to 300 characters */
const REVIEW_RE = /^https:\/\/(search\.google\.com|www\.google\.com|google\.com|g\.page|maps\.app\.goo\.gl|goo\.gl)\/\S+$/;
const reviewOk = (u) => typeof u === 'string' && u.length <= 300 && REVIEW_RE.test(u);
const gymReview = () => { const u = CTX.gym && CTX.gym.review_url; return reviewOk(u) ? u : ''; };

/* staff: a QR the owner can show on the screen or print and stick at the front desk */
function reviewQrCard() {
  const u = gymReview();
  if (!u) return card(L('Google reviews', 'गूगल रिव्यू'), 'globe', '', empty(L('No review link yet', 'अभी रिव्यू लिंक नहीं'), L('Paste your Google review link in Edit gym. A QR for the front desk appears here.', 'जिम बदलें में अपना गूगल रिव्यू लिंक डालें। फ़्रंट डेस्क के लिए QR यहाँ दिखेगा।')));
  let svg = ''; try { svg = qrSvg(u, 200); } catch (e) { svg = ''; }
  return card(L('Google reviews', 'गूगल रिव्यू'), 'globe', '', `<div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap">${svg ? `<div class="qrbox">${svg}</div>` : ''}<div style="flex:1;min-width:200px"><p style="margin:0 0 8px">${esc(L('Ask happy members to scan this and leave a review.', 'खुश सदस्यों से कहें कि इसे स्कैन करके रिव्यू दें।'))}</p>${svg ? '' : `<p class="muted" style="margin:0 0 8px">${esc(L('This link is too long for a QR. Use the short g.page link from Google Business Profile.', 'यह लिंक QR के लिए बहुत लंबा है। गूगल बिज़नेस प्रोफ़ाइल का छोटा g.page लिंक इस्तेमाल करें।'))}</p>`}<a class="btn sm" target="_blank" rel="noopener noreferrer" href="${esc(u)}">${esc(L('Open the review page', 'रिव्यू पेज खोलें'))}</a></div></div>`);
}

/* member home: one clear button */
function reviewMemberCard() {
  const u = gymReview(); if (!u) return '';
  return `<div class="card" style="padding:14px;margin-bottom:14px;display:flex;gap:12px;align-items:center;flex-wrap:wrap"><span style="flex:1;min-width:200px"><b>${esc(L('Enjoying the gym?', 'जिम पसंद आ रहा है?'))}</b><br><span class="muted">${esc(L('A short Google review helps us a lot.', 'गूगल पर छोटा सा रिव्यू हमारे लिए बहुत मायने रखता है।'))}</span></span><a class="btn" target="_blank" rel="noopener noreferrer" href="${esc(u)}">${esc(L('Write a review', 'रिव्यू लिखें'))}</a></div>`;
}
