/* ================= Luxury palettes: four accent colours, set as <html data-luxe>. The 3D finish itself is CSS (style.css) ================= */
const LUXE = [['royal', 'Royal gold', 'रॉयल गोल्ड'], ['emerald', 'Emerald velvet', 'पन्ना मखमल'], ['sapphire', 'Sapphire night', 'नीलम रात'], ['ruby', 'Ruby & pearl', 'माणिक और मोती']];

/* pure */
const luxeValid = (id) => LUXE.some((x) => x[0] === id);
const luxeNext = (id) => { const i = LUXE.findIndex((x) => x[0] === id); return LUXE[(i + 1) % LUXE.length][0]; };
const luxeLabel = (id) => { const x = LUXE.find((y) => y[0] === id) || LUXE[0]; return L(x[1], x[2]); };
function luxeRead(store) {
  try { const v = store.getItem('gymos-luxe'); return luxeValid(v) ? v : 'royal'; } catch (e) { return 'royal'; }
}

/* runtime */
function luxeApply(id) {
  const v = luxeValid(id) ? id : 'royal';
  document.documentElement.dataset.luxe = v;
  return v;
}
function luxeChange() {
  const nx = luxeNext(document.documentElement.dataset.luxe || 'royal');
  luxeApply(nx);
  try { localStorage.setItem('gymos-luxe', nx); } catch (e) { /* private window: the palette still changes for this visit */ }
  chrome();
  toast(luxeLabel(nx));
}
/* stat tiles lean toward the pointer. Only with a mouse or pen, and never when the user asks for less motion */
function luxeTilt() {
  if (!window.matchMedia || !matchMedia('(hover: hover) and (pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.addEventListener('pointermove', (e) => {
    const t = e.target && e.target.closest ? e.target.closest('.tile') : null;
    if (!t) return;
    const r = t.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    t.style.setProperty('--rx', (-y * 8).toFixed(2) + 'deg');
    t.style.setProperty('--ry', (x * 10).toFixed(2) + 'deg');
  }, { passive: true });
  document.addEventListener('pointerout', (e) => {
    const t = e.target && e.target.closest ? e.target.closest('.tile') : null;
    if (t && (!e.relatedTarget || !t.contains(e.relatedTarget))) { t.style.removeProperty('--rx'); t.style.removeProperty('--ry'); }
  }, { passive: true });
}
function luxeInit() {
  try { luxeApply(luxeRead(localStorage)); } catch (e) { luxeApply('royal'); }
  luxeTilt();
}
