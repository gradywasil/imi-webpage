/* ============================================================
   MINI-GAME ART KIT: a small standalone copy of pixel.js's outline + bevel renderer, so the side games can draw
   their own sprites in the same look without touching the main game's engine. Ramps are [shadow, base, light]
   and match the DEF table in pixel.js. Reuses PXA's banana, coconut and monkey wherever it can.
   ============================================================ */
(() => {
  'use strict';
  const hex = h => [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16));
  const DEF = {
    fur: ['#3b2010', '#6e4220', '#9a6232'], furD: ['#2a170b', '#4f2d14', '#6e4220'], skin: ['#b97c4c', '#e0aa76', '#f6d6a8'],
    ink: ['#0d0708', '#1a0f14', '#3a2a30'], red: ['#6a1a14', '#b8322a', '#e86a50'], banY: ['#c98f0e', '#ffd23a', '#fff08c'],
    stem: ['#2a170b', '#52301a', '#7a4c28'], coco: ['#24130a', '#563418', '#86592e'], leaf: ['#17481f', '#2f8a35', '#74c648'],
    leafD: ['#0f3318', '#1f6a2a', '#3f9a3a'], wood: ['#4a2a12', '#8a5a2b', '#b57d3e'], woodD: ['#2a170b', '#5a3517', '#7d4f26'],
    woodL: ['#7a4a1e', '#c08a4a', '#e8b878'], metal: ['#5a5a66', '#b8b8c4', '#f0f0f8'], paper: ['#c9b88a', '#fff6d6', '#ffffff'],
    star: ['#c8b84a', '#fff7b0', '#ffffff'], orange: ['#a84a0c', '#f08a1a', '#ffc060'], grape: ['#3a2068', '#6a48a8', '#b58cf0'],
    pine: ['#a8681a', '#f2b23a', '#ffe28a'], ice: ['#2a86b8', '#9be8ff', '#ffffff'], gold: ['#b38004', '#ffd23a', '#fffbe0'],
    drop: ['#3a8ec8', '#7ec8f0', '#d6f0ff'],
  };
  const ramps = [null], R = {};
  for (const k in DEF) { R[k] = ramps.length; ramps.push(DEF[k].map(hex)); }
  const outlineOf = id => ramps[id][0].map(v => Math.round(v * 0.5));

  class Px {
    constructor(w, h) { this.w = w; this.h = h; this.c = new Uint8Array(w * h); this.p = new Uint8Array(w * h); this.t = new Uint8Array(w * h); }
    shape(test, ramp, part = 1) {
      for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) if (test(x + .5, y + .5)) { const i = y * this.w + x; this.c[i] = ramp; this.p[i] = part; this.t[i] = 0; }
    }
    dot(x, y, ramp, tone, part = 1) { if (x < 0 || y < 0 || x >= this.w || y >= this.h) return; const i = y * this.w + x; this.c[i] = ramp; this.p[i] = part; this.t[i] = tone + 1; }
    tone(x, y, tone) { if (x < 0 || y < 0 || x >= this.w || y >= this.h) return; const i = y * this.w + x; if (this.c[i]) this.t[i] = tone + 1; }
  }
  const ell = (cx, cy, rx, ry) => (x, y) => { const a = (x - cx) / rx, b = (y - cy) / ry; return a * a + b * b <= 1; };
  const box = (x0, y0, w, h) => (x, y) => x >= x0 && x < x0 + w && y >= y0 && y < y0 + h;
  const cap = (x0, y0, x1, y1, r) => (x, y) => {
    const vx = x1 - x0, vy = y1 - y0; let t = ((x - x0) * vx + (y - y0) * vy) / (vx * vx + vy * vy || 1); t = t < 0 ? 0 : t > 1 ? 1 : t;
    const dx = x - (x0 + vx * t), dy = y - (y0 + vy * t); return dx * dx + dy * dy <= r * r;
  };
  const poly = pts => (x, y) => { let ins = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) ins = !ins; } return ins; };
  const and = (a, b) => (x, y) => a(x, y) && b(x, y);
  const or = (...f) => (x, y) => f.some(g => g(x, y));
  const sub = (a, b) => (x, y) => a(x, y) && !b(x, y);

  function render(px) {
    const { w, h, c, p, t } = px, out = new Uint8ClampedArray(w * h * 4);
    const empty = (x, y) => x < 0 || y < 0 || x >= w || y >= h || c[y * w + x] === 0;
    const put = (i, col) => { out[i * 4] = col[0]; out[i * 4 + 1] = col[1]; out[i * 4 + 2] = col[2]; out[i * 4 + 3] = 255; };
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (c[i]) {
        const r = ramps[c[i]]; let tone = 1;
        if (t[i]) tone = t[i] - 1;
        else {
          const front = (nx, ny) => !empty(nx, ny) && p[ny * w + nx] > p[i];
          if (front(x, y - 1) || front(x - 1, y) || front(x + 1, y) || front(x, y + 1)) tone = 0;
          else if (empty(x, y - 1) || empty(x - 1, y)) tone = 2;
          else if (empty(x, y + 1) || empty(x + 1, y)) tone = 0;
        }
        put(i, r[tone]);
      } else {
        for (const [dx, dy] of [[0, -1], [-1, 0], [1, 0], [0, 1]]) { const nx = x + dx, ny = y + dy; if (!empty(nx, ny)) { put(i, outlineOf(c[ny * w + nx])); break; } }
      }
    }
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    cv.getContext('2d').putImageData(new ImageData(out, w, h), 0, 0);
    return cv;
  }
  const make = (w, h, fn) => { const px = new Px(w, h); fn(px); return render(px); };

  /* ---------- a 3x5 letter font for the tiles ---------- */
  const FONT = {
    A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111', F: '111100110100100',
    G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010', K: '101101110101101', L: '100100100100111',
    M: '101111111101101', N: '110101101101101', O: '010101101101010', P: '110101110100100', Q: '010101101111011', R: '110101110101101',
    S: '011100010001110', T: '111010010010010', U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101',
    Y: '101101010010010', Z: '111001010100111',
    0: '111101101101111', 1: '010110010010111', 2: '111001111100111', 3: '111001111001111', 4: '101101111001001',
    5: '111100111001111', 6: '111100111101111', 7: '111001001010010', 8: '111101111101111', 9: '111101111001111',
  };
  const LETTERS = Object.keys(FONT).filter(k => isNaN(k));
  const tileCache = {};
  function tile(ch) {
    if (tileCache[ch]) return tileCache[ch];
    const cv = make(7, 9, px => { px.shape(box(0, 0, 7, 9), R.paper, 1); });
    const g = cv.getContext('2d'); g.fillStyle = '#1a0f14';
    FONT[ch].split('').forEach((b, i) => { if (b === '1') g.fillRect(2 + (i % 3), 2 + Math.floor(i / 3), 1, 1); });
    return (tileCache[ch] = cv);
  }
  /* a bundle: three tiles fanned out and tied with string */
  function bundle(a, b, c) {
    const cv = document.createElement('canvas'); cv.width = 23; cv.height = 15; const g = cv.getContext('2d');
    g.drawImage(tile(a), 0, 5); g.drawImage(tile(c), 16, 5); g.drawImage(tile(b), 8, 2);
    g.fillStyle = '#52301a'; g.fillRect(2, 12, 19, 1); g.fillStyle = '#c0392b'; g.fillRect(10, 11, 3, 3); g.fillStyle = '#e86a50'; g.fillRect(10, 11, 3, 1);
    return cv;
  }

  /* ---------- recolouring the main game's banana for the rare ones ---------- */
  function recolor(src, mapYellow, mapOther) {
    const cv = document.createElement('canvas'); cv.width = src.width; cv.height = src.height;
    const g = cv.getContext('2d'); g.drawImage(src, 0, 0);
    const img = g.getImageData(0, 0, cv.width, cv.height), d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      if (!d[i + 3]) continue;
      const lum = (d[i] * .3 + d[i + 1] * .59 + d[i + 2] * .11) / 255, yellow = d[i] > 150 && d[i + 1] > 110 && d[i + 2] < 170;
      const col = yellow ? mapYellow(lum) : mapOther && mapOther(lum);
      if (col) { d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; }
    }
    g.putImageData(img, 0, 0); return cv;
  }
  /* a 1px glow ring so the rare ones read at a glance */
  function halo(src, col, spark) {
    const cv = document.createElement('canvas'); cv.width = src.width + 4; cv.height = src.height + 4; const g = cv.getContext('2d');
    const m = document.createElement('canvas'); m.width = cv.width; m.height = cv.height; const mg = m.getContext('2d');
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [-1, 1], [1, -1]]) mg.drawImage(src, 2 + dx, 2 + dy);
    mg.globalCompositeOperation = 'source-in'; mg.fillStyle = col; mg.fillRect(0, 0, m.width, m.height);
    g.globalAlpha = .55; g.drawImage(m, 0, 0); g.globalAlpha = 1; g.drawImage(src, 2, 2);
    g.fillStyle = spark; g.fillRect(src.width - 3, 3, 1, 1); g.fillRect(4, src.height - 2, 1, 1); g.fillRect(src.width - 4, 3, 3, 1); g.fillRect(src.width - 3, 2, 1, 3);
    return cv;
  }
  const rampMap = (r, cuts = [.7, .88]) => lum => hex(lum < cuts[0] ? r[0] : lum < cuts[1] ? r[1] : r[2]);

  let built = null;
  function build() {
    if (built) return built;
    const S = {}, banana = PXA.spr.banana.cv;
    S.banana = banana;
    S.golden = halo(recolor(banana, rampMap(['#c46a00', '#ffb000', '#fff7a8'], [.66, .86]), lum => lum < .3 ? hex('#6a3c00') : null), '#fff08c', '#ffffff');
    S.diamond = halo(recolor(banana, rampMap(['#2a86b8', '#9be8ff', '#ffffff'], [.72, .9]), () => hex('#14486e')), '#bff4ff', '#ffffff');
    S.rotten = recolor(banana, rampMap(['#3a2a10', '#6a5a1c', '#8c7a2a'], [.7, .9]), null);
    S.coconut = PXA.spr['i-coconut'].cv;
    S.heart = make(9, 8, px => { px.shape(or(ell(2.7, 2.7, 2.7, 2.6), ell(6.3, 2.7, 2.7, 2.6), poly([[0.2, 3.4], [8.8, 3.4], [4.5, 7.8]])), R.red, 1); });
    S.heartOff = make(9, 8, px => { px.shape(or(ell(2.7, 2.7, 2.7, 2.6), ell(6.3, 2.7, 2.7, 2.6), poly([[0.2, 3.4], [8.8, 3.4], [4.5, 7.8]])), R.stem, 1); });
    S.apple = make(14, 14, px => {
      px.shape(or(ell(4.8, 8, 4.6, 5), ell(9.2, 8, 4.6, 5)), R.red, 1);
      px.shape(box(6.2, 2.5, 1.6, 3), R.stem, 2); px.shape(ell(10, 3.4, 2.6, 1.3), R.leaf, 3); px.tone(4, 6, 2); px.tone(4, 7, 2);
    });
    S.orange = make(14, 14, px => { px.shape(ell(7, 7.6, 6, 5.8), R.orange, 1); px.shape(ell(8.4, 2, 2.4, 1.2), R.leaf, 2); px.tone(4, 5, 2); px.tone(5, 4, 2); });
    S.grapes = make(14, 15, px => {
      [[4, 4], [8, 4], [12, 4], [6, 7.6], [10, 7.6], [8, 11]].forEach(([x, y], i) => px.shape(ell(x - 1, y + 1.4, 2.5, 2.5), R.grape, 1 + i));
      px.shape(box(5, 0, 1.4, 3), R.stem, 8); px.shape(ell(9, 1.6, 2.6, 1.2), R.leaf, 9);
    });
    S.pine = make(14, 18, px => {
      px.shape(ell(7, 11.4, 5, 6), R.pine, 1);
      for (let i = 0; i < 5; i++) { px.dot(4 + (i % 2) * 3, 8 + i * 2, R.pine, 0); px.dot(7 + (i % 2) * 3, 9 + i * 2, R.pine, 0); }
      px.shape(poly([[7, 0], [9, 5.4], [7, 4], [5, 5.4]]), R.leaf, 2); px.shape(poly([[3, 2], [7, 5.4], [3.6, 5.8]]), R.leafD, 2); px.shape(poly([[11, 2], [7, 5.4], [10.4, 5.8]]), R.leafD, 2);
    });
    S.fruits = [S.apple, S.orange, S.grapes, S.pine, banana];
    /* the barrel: back layer is the open mouth, front layer is the staves + front rim, so a catch can sink between them */
    S.barrelBack = make(30, 12, px => {
      px.shape(ell(15, 6, 14, 5.6), R.woodL, 1); px.shape(ell(15, 6.6, 11.6, 3.6), R.ink, 2);
    });
    S.barrelFront = make(30, 26, px => {
      const body = and(ell(15, 15, 14, 11.4), (x, y) => y >= 6);
      px.shape(body, R.wood, 1);
      for (let x = 4; x < 28; x += 5) px.shape(and(body, box(x, 8, 1, 20)), R.woodD, 2);
      [13, 22].forEach(y0 => px.shape(and(body, box(0, y0, 30, 2)), R.metal, 3));
      px.shape(and(sub(ell(15, 6, 14, 5.6), ell(15, 6.6, 11.6, 3.6)), (x, y) => y >= 6.2), R.woodL, 4);
    });
    S.cloudPuff = make(5, 5, px => { px.shape(ell(2.5, 2.5, 2.2, 2.2), R.paper, 1); });
    return (built = S);
  }

  window.MGArt = { FONT, R, DEF, ramps, Px, make, render, tile, bundle, LETTERS, build, hex, shapes: { ell, box, cap, poly, and, or, sub } };
})();
