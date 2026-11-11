/* ================= QR code (byte mode, error correction M, versions 1-6): made in the browser, works offline ================= */
const QR_EXP = new Uint8Array(512), QR_LOG = new Uint8Array(256);
(() => { let x = 1; for (let i = 0; i < 255; i++) { QR_EXP[i] = x; QR_LOG[x] = i; x <<= 1; if (x & 256) x ^= 0x11d; } for (let i = 255; i < 512; i++) QR_EXP[i] = QR_EXP[i - 255]; })();
const qrMul = (a, b) => (a && b ? QR_EXP[QR_LOG[a] + QR_LOG[b]] : 0);
/* version: [data codewords per block, blocks, error codewords per block, byte capacity] */
const QR_VER = { 1: [16, 1, 10, 14], 2: [28, 1, 16, 26], 3: [44, 1, 26, 42], 4: [32, 2, 18, 62], 5: [43, 2, 24, 84], 6: [27, 4, 16, 106] };
const QR_ALIGN = { 1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30], 6: [6, 34] };

function qrRemainder(data, ecLen) {
  let gen = [1];
  for (let i = 0; i < ecLen; i++) { const next = new Array(gen.length + 1).fill(0); gen.forEach((c, j) => { next[j] ^= c; next[j + 1] ^= qrMul(c, QR_EXP[i]); }); gen = next; }
  const rem = new Array(ecLen).fill(0);
  data.forEach((b) => { const f = b ^ rem[0]; rem.shift(); rem.push(0); if (f) for (let i = 0; i < ecLen; i++) rem[i] ^= qrMul(gen[i + 1], f); });
  return rem;
}

function qrMatrix(text) {
  const bytes = Array.from(new TextEncoder().encode(text));
  const ver = Number(Object.keys(QR_VER).find((v) => bytes.length <= QR_VER[v][3]));
  if (!ver) throw new Error('QR text too long');
  const [dpb, blocks, epb] = QR_VER[ver], total = dpb * blocks, size = 17 + 4 * ver;
  /* data bits */
  const bits = []; const put = (v, n) => { for (let i = n - 1; i >= 0; i--) bits.push((v >>> i) & 1); };
  put(4, 4); put(bytes.length, 8); bytes.forEach((b) => put(b, 8));
  for (let i = 0; i < 4 && bits.length < total * 8; i++) bits.push(0);
  while (bits.length % 8) bits.push(0);
  const cw = []; for (let i = 0; i < bits.length; i += 8) cw.push(parseInt(bits.slice(i, i + 8).join(''), 2));
  for (let pad = 0xec; cw.length < total; pad ^= 0xec ^ 0x11) cw.push(pad);
  /* blocks, error correction, interleave */
  const data = [], ecs = [];
  for (let b = 0; b < blocks; b++) { const d = cw.slice(b * dpb, (b + 1) * dpb); data.push(d); ecs.push(qrRemainder(d, epb)); }
  const final = []; for (let i = 0; i < dpb; i++) data.forEach((d) => final.push(d[i])); for (let i = 0; i < epb; i++) ecs.forEach((e) => final.push(e[i]));
  const stream = []; final.forEach((c) => put2(stream, c)); function put2(a, v) { for (let i = 7; i >= 0; i--) a.push((v >>> i) & 1); }
  /* function patterns */
  const M = Array.from({ length: size }, () => new Array(size).fill(null)), fn = Array.from({ length: size }, () => new Array(size).fill(false));
  const set = (r, c, v) => { if (r >= 0 && c >= 0 && r < size && c < size) { M[r][c] = v; fn[r][c] = true; } };
  const finder = (r, c) => { for (let dr = -1; dr <= 7; dr++) for (let dc = -1; dc <= 7; dc++) { const on = dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6 && (dr === 0 || dr === 6 || dc === 0 || dc === 6 || (dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4)); set(r + dr, c + dc, on); } };
  finder(0, 0); finder(0, size - 7); finder(size - 7, 0);
  for (let i = 8; i < size - 8; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
  const al = QR_ALIGN[ver]; al.forEach((r) => al.forEach((c) => { if (fn[r][c]) return; for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) set(r + dr, c + dc, Math.max(Math.abs(dr), Math.abs(dc)) !== 1); }));
  set(size - 8, 8, true);
  for (let i = 0; i < 9; i++) { if (!fn[8][i]) set(8, i, false); if (!fn[i][8]) set(i, 8, false); }
  for (let i = 0; i < 8; i++) { if (!fn[8][size - 1 - i]) set(8, size - 1 - i, false); if (!fn[size - 1 - i][8]) set(size - 1 - i, 8, false); }
  const reserved = fn.map((r) => r.slice());
  /* place data bits in the zigzag */
  let idx = 0, up = true;
  for (let c = size - 1; c > 0; c -= 2) {
    if (c === 6) c--;
    for (let k = 0; k < size; k++) { const r = up ? size - 1 - k : k; for (let dc = 0; dc < 2; dc++) { const cc = c - dc; if (!reserved[r][cc]) { M[r][cc] = idx < stream.length ? stream[idx] === 1 : false; idx++; } } }
    up = !up;
  }
  /* masks, format information, penalty */
  const maskFn = [(r, c) => (r + c) % 2 === 0, (r) => r % 2 === 0, (r, c) => c % 3 === 0, (r, c) => (r + c) % 3 === 0, (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0, (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0, (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0, (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0];
  const build = (m) => {
    const g = M.map((row, r) => row.map((v, c) => (reserved[r][c] ? v : v !== maskFn[m](r, c))));
    let fmt = (0 << 3 | m) << 10, rem = fmt; for (let i = 14; i >= 10; i--) if ((rem >>> i) & 1) rem ^= 0x537 << (i - 10); fmt = ((((0 << 3) | m) << 10) | rem) ^ 0x5412;
    const bit = (i) => ((fmt >>> i) & 1) === 1;
    for (let i = 0; i <= 5; i++) g[i][8] = bit(i); g[7][8] = bit(6); g[8][8] = bit(7); g[8][7] = bit(8); for (let i = 9; i < 15; i++) g[8][14 - i] = bit(i);
    for (let i = 0; i < 8; i++) g[8][size - 1 - i] = bit(i); for (let i = 8; i < 15; i++) g[size - 15 + i][8] = bit(i);
    g[size - 8][8] = true;
    return g;
  };
  const penalty = (g) => {
    let p = 0;
    const line = (get) => { for (let a = 0; a < size; a++) { let run = 1; for (let b = 1; b < size; b++) { if (get(a, b) === get(a, b - 1)) { run++; if (run === 5) p += 3; else if (run > 5) p++; } else run = 1; } } };
    line((a, b) => g[a][b]); line((a, b) => g[b][a]);
    for (let r = 0; r < size - 1; r++) for (let c = 0; c < size - 1; c++) if (g[r][c] === g[r][c + 1] && g[r][c] === g[r + 1][c] && g[r][c] === g[r + 1][c + 1]) p += 3;
    const pat = [true, false, true, true, true, false, true, false, false, false, false], pat2 = pat.slice().reverse();
    const has = (get, a, b, pt) => pt.every((v, i) => get(a, b + i) === v);
    for (let a = 0; a < size; a++) for (let b = 0; b <= size - 11; b++) { if (has((x, y) => g[x][y], a, b, pat) || has((x, y) => g[x][y], a, b, pat2)) p += 40; if (has((x, y) => g[y][x], a, b, pat) || has((x, y) => g[y][x], a, b, pat2)) p += 40; }
    let dark = 0; g.forEach((r) => r.forEach((v) => { if (v) dark++; })); p += Math.floor(Math.abs((dark * 100) / (size * size) - 50) / 5) * 10;
    return p;
  };
  let best = null, bestP = Infinity; for (let m = 0; m < 8; m++) { const g = build(m), p = penalty(g); if (p < bestP) { bestP = p; best = g; } }
  return best;
}

/* the picture: black squares on white with the 4-square quiet zone scanners need; fixed colours so it scans in dark mode too */
function qrSvg(text, px = 220) {
  const g = qrMatrix(text), n = g.length, q = 4, d = [];
  g.forEach((row, r) => row.forEach((on, c) => { if (on) d.push(`M${c + q} ${r + q}h1v1h-1z`); }));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n + 2 * q} ${n + 2 * q}" width="${px}" height="${px}" shape-rendering="crispEdges" role="img" aria-label="QR code"><rect width="100%" height="100%" fill="#fff"/><path d="${d.join('')}" fill="#000"/></svg>`;
}
