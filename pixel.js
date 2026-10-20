/* ============================================================
   PIXEL ENGINE + SPRITES  (everything is drawn procedurally at
   low resolution, then shown scaled with image-rendering: pixelated)
   ============================================================ */
(() => {
  'use strict';
  const S = 3;                                   // css px per art pixel (keep in sync with --s in CSS)
  const rgb = h => [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16));
  const rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };

  /* ---------- palette ramps: [shadow, base, light] ---------- */
  const DEF = {
    fur: ['#3b2010', '#6e4220', '#9a6232'], furD: ['#2a170b', '#4f2d14', '#6e4220'],
    furL: ['#7e4a24', '#b07238', '#d49a52'],
    skin: ['#b97c4c', '#e0aa76', '#f6d6a8'], white: ['#c9d3d8', '#ffffff', '#ffffff'],
    ink: ['#0d0708', '#1a0f14', '#3a2a30'], red: ['#6a1a14', '#b8322a', '#e86a50'],
    banY: ['#c98f0e', '#ffd23a', '#fff08c'], banIn: ['#d8b44a', '#f6e08a', '#fff6c0'],
    banG: ['#5c9a22', '#9ccf3f', '#cdee74'], fruit: ['#dcc67c', '#fff1bd', '#ffffff'],
    stem: ['#2a170b', '#52301a', '#7a4c28'], coco: ['#24130a', '#563418', '#86592e'],
    flesh: ['#e6ebe6', '#fbfbf2', '#ffffff'], milk: ['#b4d4e2', '#d6ebf2', '#eef8fc'],
    leaf: ['#17481f', '#2f8a35', '#74c648'], leafD: ['#0f3318', '#1f6a2a', '#3f9a3a'],
    vine: ['#17481f', '#2f8a35', '#6fc04a'], wood: ['#4a2a12', '#8a5a2b', '#b57d3e'],
    woodD: ['#2a170b', '#5a3517', '#7d4f26'], woodL: ['#7a4a1e', '#c08a4a', '#e8b878'],
    sun: ['#d97a0c', '#ffc62a', '#fff4a0'], moon: ['#7e8ab0', '#d8e0f0', '#ffffff'],
    cloud: ['#a9c4dc', '#ffffff', '#ffffff'], metal: ['#5a5a66', '#b8b8c4', '#f0f0f8'],
    paper: ['#c9b88a', '#fff6d6', '#ffffff'], gray: ['#5c5848', '#8c8670', '#b9b29a'],
    far1: ['#134a2a', '#1d6a38', '#2e8a48'], far2: ['#1a5e36', '#27804a', '#3da05a'],
    drop: ['#3a8ec8', '#7ec8f0', '#d6f0ff'], star: ['#c8b84a', '#fff7b0', '#ffffff'],
    sky: ['#4a98c8', '#7ed0f4', '#c8ecff'], blue: ['#1c2c78', '#2e44a8', '#5470d8'], storm: ['#252b45', '#454f6e', '#6a7796'],
    /* the six machines (ops.js DESKS colours) */
    ice: ['#1d5fb0', '#52d0ff', '#ddf8ff'], gem: ['#4a2aa0', '#a86cff', '#ecd8ff'],
    dmint: ['#2f8a5a', '#78d9a0', '#c4f4d4'], drose: ['#a8456a', '#f08aa4', '#ffd0dc'], dblue: ['#2c62a8', '#5fa8f0', '#bfe0ff'],
    damber: ['#a8681a', '#f2b23a', '#ffe28a'], dorchid: ['#6a48a8', '#b58cf0', '#e4d4ff'], dmoon: ['#7a80a0', '#dfe3f2', '#ffffff'],
  };
  const ramps = [null], R = {};
  for (const k in DEF) { R[k] = ramps.length; ramps.push(DEF[k].map(rgb)); }
  const outlineOf = id => ramps[id][0].map(v => Math.round(v * 0.5));

  /* ---------- pixel buffer ---------- */
  class Px {
    constructor(w, h) { this.w = w; this.h = h; this.c = new Uint8Array(w * h); this.p = new Uint8Array(w * h); this.t = new Uint8Array(w * h); }
    shape(test, ramp, part = 1, map = null) {
      const { w, h } = this, bb = !map && test.bb;
      const x0 = bb ? Math.max(0, Math.floor(bb[0])) : 0, y0 = bb ? Math.max(0, Math.floor(bb[1])) : 0;
      const x1 = bb ? Math.min(w - 1, Math.ceil(bb[2])) : w - 1, y1 = bb ? Math.min(h - 1, Math.ceil(bb[3])) : h - 1;
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const q = map ? map(x + .5, y + .5) : [x + .5, y + .5];
        if (test(q[0], q[1])) { const i = y * w + x; this.c[i] = ramp; this.p[i] = part; this.t[i] = 0; }
      }
    }
    dot(x, y, ramp, tone, part = 1) { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= this.w || y >= this.h) return; const i = y * this.w + x; this.c[i] = ramp; this.p[i] = part; this.t[i] = tone + 1; }
    tone(x, y, tone, onlyPart) { x |= 0; y |= 0; if (x < 0 || y < 0 || x >= this.w || y >= this.h) return; const i = y * this.w + x; if (this.c[i] && (onlyPart == null || this.p[i] === onlyPart)) this.t[i] = tone + 1; }
    has(x, y) { x |= 0; y |= 0; return x >= 0 && y >= 0 && x < this.w && y < this.h && this.c[y * this.w + x] !== 0; }
  }
  /* shape tests (local coords). .bb lets Px.shape skip empty area */
  const bbx = (f, a, b, c, d) => (f.bb = [a, b, c, d], f);
  const ell = (cx, cy, rx, ry) => bbx((x, y) => { const a = (x - cx) / rx, b = (y - cy) / ry; return a * a + b * b <= 1; }, cx - rx, cy - ry, cx + rx, cy + ry);
  const cap = (x0, y0, x1, y1, r) => bbx((x, y) => { const vx = x1 - x0, vy = y1 - y0; let t = ((x - x0) * vx + (y - y0) * vy) / (vx * vx + vy * vy || 1); t = t < 0 ? 0 : t > 1 ? 1 : t; const dx = x - (x0 + vx * t), dy = y - (y0 + vy * t); return dx * dx + dy * dy <= r * r; }, Math.min(x0, x1) - r, Math.min(y0, y1) - r, Math.max(x0, x1) + r, Math.max(y0, y1) + r);
  const box = (x0, y0, w, h) => bbx((x, y) => x >= x0 && x < x0 + w && y >= y0 && y < y0 + h, x0, y0, x0 + w, y0 + h);
  const poly = pts => { let a = 1e9, b = 1e9, c = -1e9, d = -1e9; pts.forEach(([x, y]) => { a = Math.min(a, x); b = Math.min(b, y); c = Math.max(c, x); d = Math.max(d, y); }); return bbx((x, y) => { let ins = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) ins = !ins; } return ins; }, a, b, c, d); };
  const and = (a, b) => (x, y) => a(x, y) && b(x, y);
  const or = (...f) => (x, y) => f.some(g => g(x, y));
  const sub = (a, b) => (x, y) => a(x, y) && !b(x, y);
  const rot = (px, py, a, abs) => { const ca = Math.cos(a), sa = Math.sin(a), ox = abs ? px : 0, oy = abs ? py : 0; return (x, y) => { const dx = x - px, dy = y - py; return [ox + dx * ca + dy * sa, oy - dx * sa + dy * ca]; }; };

  /* ---------- render: outline + bevel shading ---------- */
  function render(px, wx = false, wy = false) {
    const { w, h, c, p, t } = px, out = new Uint8ClampedArray(w * h * 4);
    const nx_ = x => wx ? (x + w) % w : x, ny_ = y => wy ? (y + h) % h : y;
    const empty = (x, y) => { x = nx_(x); y = ny_(y); return x < 0 || y < 0 || x >= w || y >= h || c[y * w + x] === 0; };
    const put = (i, col) => { out[i * 4] = col[0]; out[i * 4 + 1] = col[1]; out[i * 4 + 2] = col[2]; out[i * 4 + 3] = 255; };
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (c[i]) {
        const r = ramps[c[i]]; let tone = 1;
        if (t[i]) tone = t[i] - 1;
        else {
          const front = (nx, ny) => !empty(nx, ny) && p[ny_(ny) * w + nx_(nx)] > p[i];
          if (front(x, y - 1) || front(x - 1, y) || front(x + 1, y) || front(x, y + 1)) tone = 0;
          else if (empty(x, y - 1) || empty(x - 1, y)) tone = 2;
          else if (empty(x, y + 1) || empty(x + 1, y)) tone = 0;
        }
        put(i, r[tone]);
      } else {
        for (const [dx, dy] of [[0, -1], [-1, 0], [1, 0], [0, 1]]) {
          const nx = x + dx, ny = y + dy;
          if (!empty(nx, ny)) { put(i, outlineOf(c[ny_(ny) * w + nx_(nx)])); break; }
        }
      }
    }
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    cv.getContext('2d').putImageData(new ImageData(out, w, h), 0, 0);
    return cv;
  }
  const make = (w, h, fn, wx, wy) => { const px = new Px(w, h); fn(px); return render(px, wx, wy); };
  const url = cv => cv.toDataURL();
  function sheet(frames) {
    const fw = frames[0].width, fh = frames[0].height, cv = document.createElement('canvas');
    cv.width = fw * frames.length; cv.height = fh; const g = cv.getContext('2d');
    frames.forEach((f, i) => g.drawImage(f, i * fw, 0));
    return { url: url(cv), fw, fh, n: frames.length, frames };
  }

  /* ============================================================
     SPRITES
     ============================================================ */

  /* ---------- WEATHER ICON (4 states: clear, drizzle, rain, storm) ---------- */
  function weatherFrame(i) {
    return make(40, 38, px => {
      if (i === 0) {
        px.shape(ell(31, 9, 5.2, 5.2), R.sun, 1);
        for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; px.shape(cap(31 + Math.cos(a) * 7.4, 9 + Math.sin(a) * 7.4, 31 + Math.cos(a) * 9.4, 9 + Math.sin(a) * 9.4, .9), R.sun, 1); }
      }
      const ramp = i < 2 ? R.cloud : i === 2 ? R.gray : R.storm;
      px.shape(or(ell(11, 17, 8, 6), ell(20, 12.5, 9, 8), ell(29, 17, 8, 6), box(11, 17, 18, 6)), ramp, 2);
      const spots = [[], [[10, 28], [20, 30], [30, 28]], [[7, 27], [13, 31], [19, 27], [25, 31], [31, 27], [35, 31]], [[7, 27], [12, 31], [30, 27], [35, 31], [10, 34], [33, 34]]][i];
      spots.forEach(([x, y]) => px.shape(cap(x, y, x - 1, y + 3, .7), R.drop, 3));
      if (i === 3) px.shape(poly([[23, 20], [16, 29], [21, 29], [17, 37], [28, 26], [22, 26], [26, 20]]), R.sun, 4);
    });
  }

  /* ---------- BANANA TOGGLE: procedural peel animation ---------- */
  const easeOutBack = t => { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
  function bananaFrame(p) {
    const W = 36, H = 66, yH = 30;
    return make(W, H, px => {
      const cx = y => 18 + (22 - y) * 0.13;
      const hw = y => { const u = (y - 22.5) / 20.5, v = 1 - u * u; return v > 0 ? 7.4 * Math.sqrt(v) : 0; };
      const body = (x, y) => y >= 3 && y <= 42 && Math.abs(x - cx(y)) <= hw(y);
      const inset = (x, y) => y >= 5 && y <= yH + 3 && Math.abs(x - cx(y)) <= hw(y) - 1.6;
      px.shape(inset, R.fruit, 1);
      px.shape((x, y) => body(x, y) && y >= yH, R.banY, 2);
      px.shape(cap(cx(42) - .5, 41, cx(42) - 2.5, 48, 1.9), R.stem, 3);
      const th = 150 * Math.PI / 180 * easeOutBack(p);
      const L = (x, y) => body(x, y) && y < yH && x < cx(y) - hw(y) / 3;
      const M = (x, y) => body(x, y) && y < yH && Math.abs(x - cx(y)) <= hw(y) / 3;
      const Rr = (x, y) => body(x, y) && y < yH && x > cx(y) + hw(y) / 3;
      const tip = (x, y) => M(x, y) && y < 5.8;
      const pl = [cx(yH) - hw(yH) * .66, yH], pr = [cx(yH) + hw(yH) * .66, yH];
      const inner = Math.abs(th) > 1.45;
      px.shape(L, inner ? R.banIn : R.banY, 4, rot(pl[0], pl[1], -th, true));
      px.shape(Rr, inner ? R.banIn : R.banY, 5, rot(pr[0], pr[1], th, true));
      const sy = 1 - 1.5 * (p * p * (3 - 2 * p));
      if (Math.abs(sy) > .12) {
        const mapM = (x, y) => [x, yH + (y - yH) / sy];
        px.shape(M, sy < 0 ? R.banIn : R.banY, 6, mapM);
        px.shape(tip, R.stem, 7, mapM);
      }
      for (let y = 8; y < yH; y += 3) { px.tone(cx(y) - hw(y) * .45, y, 2, 1); }      // fruit shine
      for (let y = 9; y < yH; y += 4) { px.tone(cx(y) + hw(y) * .3, y, 0, 1); }
    });
  }
  const BANANA_FRAMES = 7;

  /* ---------- COCONUT ---------- */
  function coconutFrame(i) {
    const W = 36, H = 42, cx = 18, cy = 21, rr = 12.5, d = [0, 0, 1.5, 3.5, 5.5][Math.min(i, 4)];
    const yc = x => cy + (Math.floor(x / 4) % 2 ? 0.8 : -0.8);
    const r = rng(11), hair = [];
    for (let n = 0; n < 46; n++) { const a = r() * 6.283, m = Math.sqrt(r()) * (rr - 1.5); hair.push([cx + Math.cos(a) * m, cy + Math.sin(a) * m, r() < .5 ? 0 : 2]); }
    return make(W, H, px => {
      const circ = ell(cx, cy, rr, rr * 1.02);
      const top = (x, y) => circ(x, y) && y < yc(x), bot = (x, y) => circ(x, y) && y >= yc(x);
      const mT = (x, y) => [x, y + d], mB = (x, y) => [x, y - d];
      px.shape(top, R.coco, 1, mT); px.shape(bot, R.coco, 1, mB);
      hair.forEach(([x, y, t]) => { const up = y < yc(x), yy = y + (up ? -d : d); px.tone(x, yy, t, 1); px.tone(x + 1, yy, t, 1); });
      if (d >= 1) {
        const inner = ell(cx, cy, rr - 2.4, rr - 2.4);
        px.shape((x, y) => inner(x, y) && y < yc(x) && y > yc(x) - 1.6, R.flesh, 2, mT);
        px.shape(and(ell(cx, yc(cx), rr - 2.2, 3.4), (x, y) => y >= yc(x) - 3.4), R.flesh, 2, mB);
        px.shape(and(ell(cx, yc(cx) + .6, rr - 4.6, 2), (x, y) => y >= yc(x) - 1.5), R.milk, 3, mB);
      }
      px.shape(or(ell(14.2, 16.4, 1.5, 1.5), ell(21.4, 15.8, 1.5, 1.5), ell(17.8, 19.2, 1.4, 1.4)), R.ink, 4, mT);
      if (i === 1) for (let x = 6; x < 31; x++) px.dot(x, yc(x), R.ink, 0, 9);     // crack line
      if (i === 0) { px.tone(12, 10, 2, 1); px.tone(13, 9, 2, 1); px.tone(14, 9, 2, 1); }
    });
  }
  const COCO_FRAMES = 5;

  /* ---------- small sprites ---------- */
  const crescent = (cx, cy, r, ox, oy, r2) => sub(ell(cx, cy, r, r), ell(cx + ox, cy + oy, r2, r2));
  const spr = {};
  const reg = (name, cv) => { spr[name] = { url: url(cv), w: cv.width, h: cv.height, cv }; };
  reg('banana', make(18, 18, px => {
    px.shape(crescent(8.5, 9.5, 7.6, 3.6, -3.4, 7.2), R.banY, 1);
    px.shape(and(crescent(8.5, 9.5, 7.6, 3.6, -3.4, 7.2), (x, y) => x < 4 && y < 8), R.stem, 2);
    px.shape(and(crescent(8.5, 9.5, 7.6, 3.6, -3.4, 7.2), (x, y) => x > 13 && y > 10), R.stem, 2);
  }));
  reg('leaf', make(11, 11, px => {
    px.shape(poly([[1, 9], [2, 4], [6, 1], [9, 1], [9, 5], [6, 9], [2, 9.5]]), R.leaf, 1);
    for (let i = 0; i < 6; i++) px.tone(2 + i, 8 - i, 0, 1);
  }));
  reg('leaf2', make(11, 11, px => {
    px.shape(poly([[9, 9], [8, 4], [4, 1], [1, 1], [1, 5], [4, 9], [8, 9.5]]), R.leafD, 1);
    for (let i = 0; i < 6; i++) px.tone(8 - i, 8 - i, 0, 1);
  }));
  reg('coco-s', make(12, 12, px => {
    px.shape(ell(6, 6, 4.8, 4.8), R.coco, 1); px.shape(or(ell(4.6, 5, .8, .8), ell(7.4, 4.8, .8, .8), ell(6, 7.2, .8, .8)), R.ink, 2);
  }));
  reg('drop', make(9, 11, px => { px.shape(poly([[4.5, 1], [7.5, 6], [7, 8.5], [4.5, 10], [2, 8.5], [1.5, 6]]), R.drop, 1); px.tone(3, 6, 2, 1); }));
  reg('paw', make(11, 11, px => {
    px.shape(or(ell(5.5, 7, 3, 2.6), poly([[3, 6], [8, 6], [8, 8]])), R.furD, 1);
    [[2, 4], [4.2, 2.4], [6.8, 2.4], [9, 4]].forEach(([x, y]) => px.shape(ell(x, y, 1.3, 1.5), R.furD, 2));
  }));
  reg('spark', make(9, 9, px => { px.shape(or(box(4, 0, 1, 9), box(0, 4, 9, 1), box(3, 3, 3, 3)), R.star, 1); }));
  reg('star', make(5, 5, px => { px.shape(or(box(2, 0, 1, 5), box(0, 2, 5, 1)), R.star, 1); }));
  reg('sun', make(24, 24, px => {
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; px.shape(cap(12 + Math.cos(a) * 8.6, 12 + Math.sin(a) * 8.6, 12 + Math.cos(a) * 10.6, 12 + Math.sin(a) * 10.6, 1.1), R.sun, 1); }
    px.shape(ell(12, 12, 7, 7), R.sun, 2);
    px.shape(or(ell(9.5, 11, .9, 1.2), ell(14.5, 11, .9, 1.2)), R.ink, 3);
    px.shape(or(box(10, 14.5, 4, .9), box(9, 13.8, 1, .8), box(14, 13.8, 1, .8)), R.ink, 3);
  }));
  reg('moon', make(24, 24, px => {
    px.shape(ell(12, 12, 8, 8), R.moon, 1);
    px.shape(or(ell(9, 9, 1.8, 1.8), ell(15, 14, 2.2, 2.2), ell(8, 15, 1.2, 1.2)), R.moon, 2);
    for (let x = 0; x < 24; x++) for (let y = 0; y < 24; y++) if (px.has(x, y) && px.p[y * 24 + x] === 2) px.tone(x, y, 0, 2);
    px.shape(or(box(8, 11.5, 3, .9), box(13, 11.5, 3, .9)), R.ink, 3);
  }));
  reg('cloud', make(24, 12, px => { px.shape(or(ell(6, 8, 5, 3.4), ell(12, 6, 5, 4.2), ell(18, 8, 5, 3.4), box(6, 8, 12, 3.5)), R.cloud, 1); }));
  const drum = (r1, r2, name) => reg(name, make(26, 20, px => {
    px.shape(poly([[3, 7], [23, 7], [20, 18], [6, 18]]), R.woodL, 1);
    px.shape(box(5, 12, 16, 1.4), R.woodD, 2);
    px.shape(ell(13, 7, 10.5, 4), r1, 3); px.shape(ell(13, 7, 8, 2.6), r2, 4);
  }));
  drum(R.paper, R.paper, 'drum-on'); drum(R.gray, R.gray, 'drum-off');

  /* ---------- crate icons (16x16) ---------- */
  reg('i-banana', spr.banana.cv);
  reg('i-coconut', make(16, 16, px => { px.shape(ell(8, 8, 6.4, 6.4), R.coco, 1); px.shape(or(ell(6, 7, 1, 1), ell(10, 6.6, 1, 1), ell(8, 9.6, 1, 1)), R.ink, 2); px.tone(5, 4, 2, 1); px.tone(6, 3, 2, 1); }));
  reg('i-monkey', make(16, 16, px => {
    px.shape(or(ell(2.5, 8, 2.4, 2.4), ell(13.5, 8, 2.4, 2.4)), R.fur, 1); px.shape(ell(8, 8, 6.4, 6.2), R.fur, 2);
    px.shape(or(ell(6, 8, 3, 3), ell(10, 8, 3, 3), ell(8, 10.6, 3.8, 2.8)), R.skin, 3);
    px.shape(or(ell(6.2, 7.6, 1, 1), ell(9.8, 7.6, 1, 1)), R.ink, 4); px.shape(box(6.5, 11, 3, 1), R.ink, 4);
  }));
  reg('i-type', make(16, 16, px => {
    px.shape(box(2, 7, 12, 7), R.metal, 1); px.shape(box(4, 2, 8, 6), R.paper, 2); px.shape(box(3, 5, 10, 1), R.ink, 3);
    for (let x = 0; x < 4; x++) for (let y = 0; y < 2; y++) px.dot(4 + x * 2.5, 9 + y * 2.4, R.ink, 1, 4);
  }));
  reg('i-palm', make(16, 16, px => {
    px.shape(poly([[7, 15], [9, 15], [9.5, 7], [7.5, 7]]), R.woodD, 1);
    [[2, 4, 6, 7], [14, 4, 10, 7], [3, 9, 7, 7.5], [13, 9, 9, 7.5], [8, 1, 8, 7]].forEach(([x, y, a, b]) => px.shape(cap(a + .5, b, x, y, 1.5), R.leaf, 2));
    px.shape(or(ell(7.5, 7.5, 1.2, 1.2), ell(9.2, 8, 1.1, 1.1)), R.coco, 3);
  }));
  reg('i-log', make(16, 16, px => {
    px.shape(box(2, 4, 12, 9), R.woodL, 1); px.shape(ell(3, 8.5, 3, 4.5), R.wood, 2);
    px.shape(ell(3, 8.5, 1.4, 2.4), R.woodL, 3); px.shape(or(box(8, 6, 4, .9), box(6, 10, 6, .9)), R.woodD, 4);
  }));

  const trophy = (ramp, name) => reg(name, make(16, 16, px => {
    px.shape(poly([[3, 2], [13, 2], [12.5, 7], [10, 10], [6, 10], [3.5, 7]]), ramp, 1);
    px.shape(or(ell(2, 5, 1.6, 2.4), ell(14, 5, 1.6, 2.4)), ramp, 2);
    px.shape(box(7, 9.5, 2, 3.5), ramp, 1);
    px.shape(box(4, 13, 8, 2), R.woodD, 3);
    px.tone(5, 3, 2, 1); px.tone(5, 4, 2, 1);
  }));
  trophy(R.woodL, 'trophy-0'); trophy(R.metal, 'trophy-1'); trophy(R.banY, 'trophy-2');

  reg('i-reel', make(16, 16, px => {
    px.shape(ell(8, 8, 6.8, 6.8), R.metal, 1);
    [[8, 4], [11.8, 8], [8, 12], [4.2, 8]].forEach(([x, y]) => px.shape(ell(x, y, 1.6, 1.6), R.ink, 2));
    px.shape(ell(8, 8, 1.5, 1.5), R.ink, 2);
  }));

  reg('i-quill', make(16, 16, px => {
    px.shape(poly([[13, 1], [14.5, 2.5], [8, 10], [5, 11], [6, 8]]), R.white, 1);
    px.shape(cap(5.5, 10.5, 2, 14.5, .8), R.ink, 2);
  }));

  /* ---------- tab icons for the later-game departments: Break Room, Folio, Imprints, Estate, Archive, Works ---------- */
  reg('i-game', make(16, 16, px => {
    px.shape(or(box(3, 5, 10, 7), ell(3.5, 8.5, 2.6, 3.5), ell(12.5, 8.5, 2.6, 3.5)), R.blue, 1);
    px.shape(or(box(3.5, 7.5, 3, 1), box(4.5, 6.5, 1, 3)), R.white, 2);
    px.shape(or(ell(10.4, 7.6, .9, .9), ell(11.9, 9.3, .9, .9)), R.banY, 3);
    px.shape(box(6.5, 6.4, 3, .8), R.ink, 4);
  }));
  reg('i-folio', make(16, 16, px => {
    px.shape(box(3, 2, 10, 12), R.red, 1); px.shape(box(3, 2, 2, 12), R.woodD, 2);
    px.shape(box(6, 4, 5, 3), R.paper, 3); px.shape(or(box(7, 5, 3, .6), box(7, 6, 2, .6)), R.ink, 4);
    px.shape(box(10, 11, 2, 4.5), R.banY, 3);
  }));
  reg('i-imprint', make(16, 16, px => {
    px.shape(or(ell(8, 3.5, 2.4, 2.4), box(7, 5, 2, 4)), R.wood, 1);
    px.shape(box(3, 9, 10, 3), R.woodL, 2); px.shape(box(2, 12.5, 12, 2), R.red, 3);
    px.shape(box(5, 10, 6, .8), R.woodD, 4);
  }));
  reg('i-estate', make(16, 16, px => {
    px.shape(box(3, 8, 10, 6.5), R.woodL, 1); px.shape(poly([[1.5, 8.4], [8, 2], [14.5, 8.4]]), R.red, 2);
    px.shape(box(10, 2.5, 2, 3.4), R.gray, 3); px.shape(box(7, 10.5, 2.4, 4), R.woodD, 3); px.shape(box(4, 9.5, 2, 2), R.sky, 4);
  }));
  reg('i-archive', make(16, 16, px => {
    px.shape(box(3, 2, 10, 13), R.metal, 1); px.shape(or(box(4, 3.5, 8, 4.5), box(4, 9, 8, 4.5)), R.gray, 2);
    px.shape(or(box(6.5, 5, 3, 1), box(6.5, 10.5, 3, 1)), R.banY, 3); px.shape(or(box(5, 4, 6, .6), box(5, 9.6, 6, .6)), R.paper, 4);
  }));
  reg('i-works', make(16, 16, px => {
    px.shape(box(2, 2.5, 12, 3.2), R.red, 1); px.shape(box(3, 6.4, 11, 3.2), R.blue, 1); px.shape(box(2, 10.3, 12, 3.2), R.leaf, 1);
    px.shape(or(box(10, 3.4, 3, .8), box(10.5, 7.3, 2.5, .8), box(10, 11.2, 3, .8)), R.paper, 2);
  }));

  /* ---------- currency icons: the diamond banana, the Legacy star and the Inspiration bulb (animated by gems.css) ---------- */
  reg('dbanana', make(20, 20, px => {
    const body = crescent(9.5, 10.5, 7.6, 3.6, -3.4, 7.2);
    px.shape(body, R.ice, 1);
    px.shape(and(body, (x, y) => x < 5 && y < 9), R.gem, 2);
    px.shape(and(body, (x, y) => x > 14 && y > 11), R.gem, 2);
    px.shape(or(cap(5.4, 10.6, 5.6, 12.4, .45), cap(7.6, 14.2, 9.4, 15.2, .45), cap(11, 15.6, 12.6, 15, .45)), R.moon, 3);
    px.shape(or(cap(7.8, 11.6, 8.8, 12.6, .4), cap(6.2, 7.4, 6.2, 8.6, .4)), R.moon, 3);
  }));
  reg('i-star', make(16, 16, px => {
    px.shape(poly([[8, 1], [10, 6], [15, 6.4], [11, 9.8], [12.6, 15], [8, 12], [3.4, 15], [5, 9.8], [1, 6.4], [6, 6]]), R.banY, 1);
    px.shape(poly([[8, 3], [9, 6.6], [7, 6.6]]), R.sun, 2);
  }));
  reg('i-insp', make(16, 16, px => {
    px.shape(ell(8, 6.8, 5, 5.2), R.sun, 1);
    px.shape(ell(6.4, 5, 1.4, 1.8), R.star, 2);
    px.shape(box(6, 11, 4, 2.4), R.metal, 2);
    px.shape(box(6.6, 13.6, 2.8, 1.4), R.gray, 3);
  }));

  /* ---------- helper icons: one picture per automation (a-*), shared by the Legacy cards and the inline controls ---------- */
  reg('a-hire', make(16, 16, px => {                                   // a monkey with a plus badge
    px.shape(or(ell(4.2, 5.2, 1.6, 1.6), ell(11.8, 5.2, 1.6, 1.6)), R.fur, 1); px.shape(ell(8, 7.6, 4.6, 4.4), R.fur, 2);
    px.shape(or(ell(6.6, 8.2, 1.7, 1.5), ell(9.4, 8.2, 1.7, 1.5), ell(8, 9.8, 2.2, 1.3)), R.skin, 3);
    px.shape(or(ell(6.6, 6.8, .6, .6), ell(9.4, 6.8, .6, .6)), R.ink, 4);
    px.shape(ell(12.6, 12.4, 3, 3), R.leaf, 5); px.shape(or(box(11.4, 12, 2.4, .8), box(12.2, 11.2, .8, 2.4)), R.white, 6);
  }));
  reg('a-coach', make(16, 16, px => {                                  // a whistle
    px.shape(box(2, 6, 7, 4.4), R.metal, 1); px.shape(ell(10.6, 8.6, 3.4, 3.4), R.metal, 2); px.shape(ell(10.6, 8.6, 1.2, 1.2), R.ink, 3);
    px.shape(box(2, 5, 3, 1.4), R.metal, 3); px.shape(cap(10.6, 5.4, 13.6, 2.8, .8), R.red, 4);
  }));
  reg('a-shop', make(16, 16, px => {                                   // a coin bag
    px.shape(poly([[5, 4], [11, 4], [13.4, 11], [12, 14.4], [4, 14.4], [2.6, 11]]), R.woodL, 1);
    px.shape(box(5.4, 3, 5.2, 2), R.wood, 2); px.shape(cap(5, 4, 11, 4, .6), R.red, 3);
    px.shape(ell(8, 10, 2.4, 2.4), R.banY, 4); px.shape(box(7.5, 8.8, 1, 2.4), R.sun, 5);
  }));
  reg('a-restore', make(16, 16, px => {                                // a wrench
    px.shape(cap(5, 11, 11.4, 4.6, 1.3), R.metal, 1);
    px.shape(sub(ell(12.6, 3.4, 3.2, 3.2), box(12.6, .6, 4, 3.2)), R.metal, 2);
    px.shape(ell(4.2, 12, 2.4, 2.4), R.metal, 2); px.shape(ell(3.6, 12.6, 1.1, 1.1), R.ink, 3);
  }));
  reg('a-net', make(16, 16, px => {                                    // a butterfly net holding a banana
    px.shape(sub(ell(7, 6, 5, 5), box(0, 0, 16, 5.2)), R.cloud, 1); px.shape(or(cap(2, 6, 12, 6, .5), cap(2, 6, 2, 6.4, .5)), R.metal, 2);
    px.shape(cap(11, 9.4, 14.4, 14, .8), R.wood, 3);
    px.shape(crescent(6.6, 5.4, 3, 1.4, -1.2, 2.4), R.banY, 4);
  }));
  reg('a-garden', make(16, 16, px => {                                 // a sprout in a pot
    px.shape(poly([[3.4, 9.4], [12.6, 9.4], [11.4, 14.6], [4.6, 14.6]]), R.wood, 1); px.shape(box(2.8, 8.4, 10.4, 1.8), R.woodL, 2);
    px.shape(cap(8, 8.4, 8, 4.4, .55), R.leaf, 3); px.shape(poly([[8, 5.6], [3, 4.4], [3.6, 7.6]]), R.leaf, 4); px.shape(poly([[8, 4.4], [13.2, 2.4], [12.4, 6.2]]), R.leafD, 4);
  }));
  reg('a-pitch', make(16, 16, px => {                                  // a sealed envelope
    px.shape(box(2, 4, 12, 9, ), R.paper, 1); px.shape(poly([[2, 4], [8, 9], [14, 4]]), R.gray, 2);
    px.shape(ell(8, 9.4, 1.8, 1.8), R.red, 3);
  }));
  reg('a-media', make(16, 16, px => {                                  // a clapperboard
    px.shape(box(2, 6, 12, 8), R.ink, 1); px.shape(box(2.6, 7.4, 10.8, 5.8), R.storm, 2);
    px.shape(poly([[2, 2.6], [14, 1], [14.4, 4.6], [2.4, 6]]), R.paper, 3);
    px.shape(or(poly([[4.4, 2.4], [6.6, 2.1], [5.4, 5.4], [3.2, 5.7]]), poly([[8.8, 1.9], [11, 1.6], [9.8, 4.9], [7.6, 5.2]])), R.ink, 4);
    px.shape(or(ell(6, 10, .8, .8), ell(8.4, 10, .8, .8), ell(10.8, 10, .8, .8)), R.paper, 5);
  }));
  reg('a-muse', make(16, 16, px => {                                   // a lyre
    px.shape(or(cap(4, 3, 4, 10, .9), cap(12, 3, 12, 10, .9)), R.banY, 1); px.shape(sub(ell(8, 9, 4.6, 5), box(0, 0, 16, 8)), R.banY, 1);
    px.shape(or(cap(6, 3, 6, 11, .35), cap(8, 3, 8, 12, .35), cap(10, 3, 10, 11, .35)), R.paper, 2);
    px.shape(box(5, 13.4, 6, 1.6), R.woodL, 3);
  }));
  reg('a-print', make(16, 16, px => {                                  // a printing press: platen, stack and a fresh sheet
    px.shape(box(2, 9, 12, 5), R.metal, 1); px.shape(box(2, 7.4, 12, 2), R.gray, 2);
    px.shape(box(4, 2, 8, 6.6), R.paper, 3); px.shape(or(box(5.4, 3.6, 5, .7), box(5.4, 5, 5, .7), box(5.4, 6.4, 3, .7)), R.ink, 4);
    px.shape(or(ell(12, 11.5, .9, .9)), R.red, 5);
  }));
  reg('a-challenge', make(16, 16, px => {                              // a checkered flag
    px.shape(box(2.4, 1.4, 1.6, 13.6), R.wood, 1);
    px.shape(box(4, 2, 9.4, 7), R.white, 2);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) if ((r + c) % 2 === 0) px.shape(box(4 + c * 1.88, 2 + r * 1.75, 1.88, 1.75), R.ink, 3);
  }));

  reg('s-team', make(16, 16, px => {
    [[5, 7, 1], [11, 7, 1], [8, 9, 2]].forEach(([x, y, z]) => {
      px.shape(or(ell(x - 3, y, 1.4, 1.4), ell(x + 3, y, 1.4, 1.4)), R.fur, z); px.shape(ell(x, y, 3.2, 3.2), R.fur, z + 1);
      px.shape(or(ell(x - 1, y + .4, 1.2, 1.2), ell(x + 1, y + .4, 1.2, 1.2), ell(x, y + 1.8, 1.6, 1.1)), R.skin, z + 2);
      px.shape(or(ell(x - 1, y - .2, .5, .5), ell(x + 1, y - .2, .5, .5)), R.ink, z + 3);
    });
    px.shape(box(2, 13, 12, 2), R.paper, 5); px.shape(or(box(3, 13.6, 4, .6), box(9, 13.6, 4, .6)), R.ink, 6);
  }));
  reg('s-carbon', make(16, 16, px => {
    px.shape(box(4, 2, 9, 11), R.paper, 1); px.shape(box(3, 4, 9, 11), R.ink, 2); px.shape(box(2, 5, 9, 10), R.paper, 3);
    px.shape(or(box(3.5, 7, 6, .8), box(3.5, 9, 6, .8), box(3.5, 11, 4, .8)), R.ink, 4);
  }));

  /* ---------- card art for the department pages (ops.js ICO_PX): upgrades, deals, shop tools, and every machine at each restoration ---------- */
  const keycap = (px, x, y, w = 8, h = 7) => { px.shape(box(x, y + 1, w, h - 1), R.gray, 1); px.shape(box(x, y, w, h - 2), R.paper, 2); };
  reg('u-fing', make(16, 16, px => {
    px.shape(or(ell(9, 11, 4.2, 3.6), box(5, 9, 8, 4)), R.skin, 1); px.shape(cap(7, 9, 7, 2.5, 1.3), R.skin, 2);
    px.shape(or(box(12, 3, 3, 1), box(11, 6, 4, 1)), R.white, 3);
  }));
  reg('u-rapid', make(16, 16, px => { keycap(px, 2, 6, 12, 9); px.shape(poly([[9, 1], [5, 8.5], [8, 8.5], [6.5, 14], [11.5, 6.5], [8.5, 6.5]]), R.banY, 3); }));
  reg('u-vowel', make(16, 16, px => {
    keycap(px, 2, 3, 12, 12);
    px.shape(or(cap(5.5, 12, 8, 5, .7), cap(10.5, 12, 8, 5, .7), box(6.3, 9.4, 3.6, 1)), R.leafD, 3);
  }));
  reg('u-ink', make(16, 16, px => {
    px.shape(or(box(4, 6, 8, 9), ell(8, 6.5, 4, 1.6)), R.blue, 1); px.shape(box(6, 2, 4, 3.5), R.metal, 2);
    px.shape(box(5, 9, 6, 3), R.paper, 3); px.shape(ell(8, 10.5, 1, 1), R.blue, 4);
  }));
  reg('u-practice', make(16, 16, px => {
    px.shape(poly([[1, 4], [7.5, 5], [7.5, 14], [1, 13]]), R.paper, 1); px.shape(poly([[8.5, 5], [15, 4], [15, 13], [8.5, 14]]), R.paper, 1);
    px.shape(box(7.5, 5, 1, 9.5), R.woodD, 2);
    [7, 9, 11].forEach(y => { px.shape(box(2.5, y, 4, .8), R.ink, 3); px.shape(box(9.5, y, 4, .8), R.ink, 3); });
  }));
  reg('u-stock', make(16, 16, px => {
    px.shape(box(2, 6, 12, 9), R.woodL, 1); px.shape(or(box(2, 9.5, 12, 1), box(2, 12.5, 12, 1)), R.wood, 2);
    px.shape(box(4, 2, 8, 4.5), R.paper, 3); px.shape(box(5, 3.5, 6, .8), R.ink, 4);
  }));
  reg('u-ribbon', make(16, 16, px => {
    px.shape(or(ell(4.5, 9, 3.6, 3.6), ell(11.5, 9, 3.6, 3.6)), R.metal, 1);
    px.shape(or(ell(4.5, 9, 2.4, 2.4), ell(11.5, 9, 2.4, 2.4)), R.red, 2); px.shape(box(4.5, 6.6, 7, 1.3), R.red, 3);
    px.shape(or(ell(4.5, 9, .8, .8), ell(11.5, 9, .8, .8)), R.ink, 4);
  }));
  reg('d-reprints', make(16, 16, px => {
    px.shape(box(2, 11, 12, 3), R.red, 1); px.shape(box(3, 7.5, 11, 3), R.blue, 2); px.shape(box(2, 4, 12, 3), R.banY, 3);
    [12, 8.5, 5].forEach(y => px.shape(box(11, y, 2, 1), R.paper, 4));
  }));
  reg('d-tour', make(16, 16, px => {
    px.shape(box(7, 3, 2, 12.5), R.woodD, 1);
    px.shape(poly([[3, 3], [12, 3], [14, 5], [12, 7], [3, 7]]), R.woodL, 2); px.shape(poly([[13, 8], [4, 8], [2, 10], [4, 12], [13, 12]]), R.wood, 2);
  }));
  reg('d-translations', make(16, 16, px => {
    px.shape(ell(8, 8, 6.6, 6.6), R.drop, 1);
    px.shape(or(ell(5.5, 6, 2.6, 2), ell(10.5, 10.5, 2.4, 2.6), ell(11, 4.5, 1.4, 1)), R.leaf, 2);
  }));
  reg('d-clubs', make(16, 16, px => {
    px.shape(or(ell(6, 6, 5, 3.6), poly([[3, 8], [5, 8], [2, 11.5]])), R.white, 1);
    px.shape(or(ell(10.5, 10, 4.4, 3.2), poly([[12, 12], [14, 12], [14.5, 15]])), R.banIn, 2);
    [4, 6, 8].forEach(x => px.dot(x, 6, R.ink, 1, 3));
  }));
  reg('d-option', make(16, 16, px => {
    px.shape(box(2, 7, 12, 8), R.ink, 1); px.shape(poly([[2, 3.5], [13.5, 1], [14, 4], [2.5, 6.5]]), R.ink, 2);
    [[4, 3.5], [8, 2.6], [12, 1.8]].forEach(([x, y]) => px.shape(poly([[x, y], [x + 1.6, y - .4], [x + 2.4, y + 2.4], [x + .8, y + 2.8]]), R.white, 3));
    px.shape(box(3.5, 9, 9, 1), R.white, 3);
  }));
  reg('s-hold', make(16, 16, px => { keycap(px, 1, 9, 14, 6); px.shape(cap(8, 2, 8, 8.5, 1.8), R.skin, 3); px.shape(or(box(3, 5, 2, 1), box(11, 5, 2, 1)), R.white, 4); }));
  reg('s-metro', make(16, 16, px => {
    px.shape(poly([[5, 1.5], [11, 1.5], [14, 15], [2, 15]]), R.wood, 1); px.shape(poly([[6.5, 4], [9.5, 4], [11, 13], [5, 13]]), R.woodL, 2);
    px.shape(cap(8, 12, 11, 3.5, .6), R.metal, 3); px.shape(box(9.6, 5.5, 2.4, 1.6), R.banY, 4);
  }));
  reg('s-dbl', make(16, 16, px => { keycap(px, 0.5, 6, 7, 8); keycap(px, 8.5, 6, 7, 8); px.shape(or(cap(4, 1, 4, 5, 1.2), cap(12, 1, 12, 5, 1.2)), R.skin, 3); }));
  reg('s-contracts', make(16, 16, px => {
    px.shape(box(3, 2.5, 10, 11.5), R.paper, 1); px.shape(or(ell(3, 2.5, 1.6, 1.4), ell(13, 14, 1.6, 1.4)), R.woodL, 2);
    [5, 7, 9].forEach(y => px.shape(box(5, y, 6, .8), R.ink, 3)); px.shape(ell(10.5, 11.5, 2, 2), R.red, 4);
  }));
  reg('s-lamp', make(16, 16, px => {
    px.shape(poly([[4, 2], [12, 2], [14.5, 8], [1.5, 8]]), R.banY, 1); px.shape(box(7, 8, 2, 5), R.metal, 2);
    px.shape(box(3.5, 13, 9, 2.5), R.woodD, 3); px.shape(box(6, 8, 4, 1.2), R.fruit, 4);
  }));
  reg('s-agent', make(16, 16, px => {
    px.shape(box(1.5, 5.5, 13, 9.5), R.woodD, 1); px.shape(sub(box(5, 2, 6, 4), box(6.5, 3.5, 3, 2.5)), R.woodD, 2);
    px.shape(box(1.5, 9, 13, 1), R.wood, 3); px.shape(box(7, 8.5, 2, 2.5), R.banY, 4);
  }));
  reg('s-analyst', make(16, 16, px => {
    px.shape(box(1.5, 1.5, 13, 13), R.paper, 1);
    px.shape(box(3.5, 9, 2.4, 4), R.banG, 2); px.shape(box(7, 7, 2.4, 6), R.banG, 2); px.shape(box(10.5, 4.5, 2.4, 8.5), R.banG, 2);
    px.shape(or(cap(3.5, 8, 7.5, 5.5, .55), cap(7.5, 5.5, 12.5, 3, .55)), R.red, 3);
  }));
  reg('s-baro', make(16, 16, px => {
    px.shape(ell(8, 8, 7, 7), R.wood, 1); px.shape(ell(8, 8, 5, 5), R.paper, 2);
    px.shape(cap(8, 8, 11, 5, .6), R.red, 3); px.shape(ell(8, 8, 1, 1), R.ink, 4);
    [[4.5, 8], [8, 4.5], [11.5, 8]].forEach(([x, y]) => px.dot(x, y, R.ink, 1, 4));
  }));
  reg('s-pub', make(16, 16, px => {
    px.shape(box(6.5, 1.5, 3, 7), R.wood, 1); px.shape(ell(8, 2.5, 2.6, 1.8), R.woodL, 2);
    px.shape(box(3, 8.5, 10, 3), R.woodD, 3); px.shape(box(2, 12.5, 12, 2.5), R.red, 4);
  }));
  reg('s-garden', make(16, 16, px => {
    px.shape(poly([[3, 9], [13, 9], [11.5, 15], [4.5, 15]]), R.woodL, 1); px.shape(box(2.5, 8.5, 11, 2), R.wood, 2);
    px.shape(cap(8, 9, 8, 4, .7), R.leafD, 3); px.shape(or(ell(5.5, 4.5, 2.6, 1.4), ell(10.5, 3.5, 2.6, 1.4)), R.leaf, 4);
  }));
  reg('s-keeper', make(16, 16, px => {
    px.shape(box(1.5, 8, 13, 7), R.woodL, 1); px.shape(box(2.5, 9, 11, 2), R.wood, 2);
    [[3, 4], [7, 2.5], [11, 4.5]].forEach(([x, y]) => px.shape(box(x, y, 3, 4), R.paper, 3));
    px.dot(4, 5.5, R.ink, 1, 4); px.dot(8, 4, R.ink, 1, 4); px.dot(12, 6, R.ink, 1, 4);
  }));
  /* a machine per desk colour and restoration: Mk II adds brass trim, Mk III a gold bell and a shine */
  ['mint', 'rose', 'blue', 'amber', 'orchid', 'moon'].forEach(c => [0, 1, 2].forEach(mk => reg(`tw-${c}-${mk}`, make(26, 20, px => {
    const body = R['d' + c];
    px.shape(box(6, 1, 14, 6), R.paper, 1); px.shape(or(box(7, 3, 9, .8), box(7, 4.8, 6, .8)), R.ink, 2);
    px.shape(box(2, 6, 22, 2.4), mk ? R.banY : R.metal, 3); px.shape(or(ell(2, 7.2, 1.8, 1.8), ell(24, 7.2, 1.8, 1.8)), R.ink, 4);
    px.shape(poly([[3, 9], [23, 9], [25, 19], [1, 19]]), body, 3);
    if (mk) px.shape(box(2.6, 17, 21, 1), R.banY, 4);
    for (let r = 0; r < 3; r++) for (let k = 0; k < 7 - r; k++) px.dot(5 + r + k * 2.6, 11 + r * 2.2, R.paper, 2, 5);
    if (mk >= 2) { px.shape(ell(21.5, 4, 1.8, 1.6), R.banY, 5); px.dot(4, 10, R.star, 2, 6); px.dot(5, 10, R.star, 2, 6); }
  }))));

  /* ---------- 9-slice frames (16x16, slice 6) ---------- */
  function frame(ring, corners, nails) {
    return make(16, 16, px => {
      const cut = (c, x, y) => c > 0 && x + y < c;
      const outer = (x, y) => !(cut(corners[0], x, y) || cut(corners[1], 15.99 - x, y) || cut(corners[2], 15.99 - x, 15.99 - y) || cut(corners[3], x, 15.99 - y));
      px.shape(and(box(0, 0, 16, 16), outer), ring, 1);
      px.shape(sub(and(box(1, 1, 14, 14), (x, y) => !(cut(corners[0] - 1, x - 1, y - 1) || cut(corners[1] - 1, 14.99 - x, y - 1) || cut(corners[2] - 1, 14.99 - x, 14.99 - y) || cut(corners[3] - 1, x - 1, 14.99 - y))), box(5, 5, 6, 6)), ring, 2);
      px.shape(sub(box(0, 0, 16, 16), (x, y) => outer(x, y) && !(x > 6 && x < 10 && y > 6 && y < 10)), 0, 0);
      if (nails) [[2, 2], [13, 2], [2, 13], [13, 13]].forEach(([x, y]) => px.dot(x, y, R.metal, 1, 5));
    });
  }
  function frameS(ring, corners) {
    return make(10, 10, px => {
      const cut = (c, x, y) => c > 0 && x + y < c;
      const outer = (x, y) => !(cut(corners[0], x, y) || cut(corners[1], 9.99 - x, y) || cut(corners[2], 9.99 - x, 9.99 - y) || cut(corners[3], x, 9.99 - y));
      px.shape(and(box(0, 0, 10, 10), outer), ring, 1);
      px.shape(and(box(0, 0, 10, 10), (x, y) => x > 3 && x < 7 && y > 3 && y < 7), 0, 0);
    });
  }
  const frames = {
    wood: frame(R.wood, [2, 2, 2, 2], true), dark: frame(R.woodD, [3, 3, 3, 3], false),
    leaf: frame(R.leaf, [5, 1, 5, 1], false), paper: frame(R.paper, [2, 2, 2, 2], false),
    yellow: frame(R.banY, [2, 2, 2, 2], false), sky: frame(R.woodD, [4, 4, 4, 4], false),
    darkS: frameS(R.woodD, [2, 2, 2, 2]), leafS: frameS(R.leaf, [4, 1, 4, 1]), paperS: frameS(R.paper, [2, 2, 2, 2]), yellowS: frameS(R.banY, [2, 2, 2, 2]),
  };

  /* ---------- tiles ---------- */
  function plankTile() {
    const W = 24, H = 24, r = rng(5), px = new Px(W, H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x; px.c[i] = R.wood; px.p[i] = 1; px.t[i] = 2; }
    for (let y = 0; y < H; y++) { px.dot(0, y, R.wood, 0); px.dot(12, y, R.wood, 0); px.dot(1, y, R.wood, 2); px.dot(13, y, R.wood, 2); }
    for (let n = 0; n < 26; n++) { const x = 2 + Math.floor(r() * 10) + (r() < .5 ? 0 : 12), y = Math.floor(r() * 20), l = 2 + Math.floor(r() * 3), t = r() < .6 ? 0 : 2; for (let j = 0; j < l; j++) px.dot(x, y + j, R.wood, t); }
    for (let n = 0; n < 2; n++) { const x = 4 + n * 12 + Math.floor(r() * 4), y = 4 + Math.floor(r() * 14); px.dot(x, y, R.wood, 0); px.dot(x + 1, y, R.wood, 0); px.dot(x, y + 1, R.wood, 0); }
    return render2(px);
  }
  /* ---------- long-game art: the Workshop, the room-control upgrades, the new shop families, builds, the Library and the Annex ---------- */
  const cog = (px, cx, cy, r, ramp, part) => {
    for (let a = 0; a < 8; a++) { const t = a * Math.PI / 4; px.shape(cap(cx + Math.cos(t) * r * .62, cy + Math.sin(t) * r * .62, cx + Math.cos(t) * r, cy + Math.sin(t) * r, r * .27), ramp, part); }
    px.shape(ell(cx, cy, r * .78, r * .78), ramp, part + 1);
  };
  const book = (px, x, y, w, h, ramp, trim) => { px.shape(box(x, y, w, h), ramp, 1); px.shape(box(x, y, 1.6, h), R.woodD, 2); px.shape(box(x + 2.6, y + h * .24, w - 4.4, 1.2), trim, 3); px.shape(box(x + 2.6, y + h * .5, w - 6, 1), trim, 3); };
  /* currencies (also drawn by gems.js) */
  reg('i-part', make(16, 16, px => { cog(px, 8, 8, 6.6, R.metal, 1); px.shape(ell(8, 8, 2.1, 2.1), R.ink, 4); px.dot(5, 4, R.white, 2, 5); px.dot(6, 3, R.white, 2, 5); }));
  reg('i-seal', make(16, 16, px => {
    px.shape(poly([[4.5, 10], [7, 10], [5.8, 15.2], [3.8, 13.4]]), R.red, 1); px.shape(poly([[9, 10], [11.5, 10], [12.2, 13.4], [10.2, 15.2]]), R.red, 1);
    px.shape(ell(8, 7.4, 6.2, 6.2), R.banY, 2); px.shape(ell(8, 7.4, 4.4, 4.4), R.red, 3);
    px.shape(poly([[8, 4.2], [9, 6.6], [11.4, 6.8], [9.6, 8.4], [10.2, 10.8], [8, 9.4], [5.8, 10.8], [6.4, 8.4], [4.6, 6.8], [7, 6.6]]), R.banY, 4);
  }));
  /* tabs */
  reg('i-workshop', make(16, 16, px => {
    px.shape(poly([[1, 6.6], [14.4, 6.6], [13, 9.6], [2.6, 9.6]]), R.metal, 1); px.shape(box(4.6, 9.4, 6.8, 2.4), R.gray, 2); px.shape(box(3.4, 11.6, 9.2, 3), R.metal, 3);
    px.shape(cap(10, 1.6, 12.8, 5.6, 1), R.wood, 4); px.shape(box(8.4, 0.6, 4.4, 2.8), R.metal, 5);
  }));
  reg('i-campus', make(16, 16, px => {
    px.shape(box(2, 7, 12, 8), R.woodL, 1); px.shape(poly([[0.6, 7.6], [8, 1.4], [15.4, 7.6]]), R.red, 2); px.shape(box(11, 2, 2.4, 4), R.gray, 3);
    px.shape(or(box(3.4, 9, 2.4, 2.4), box(10.2, 9, 2.4, 2.4)), R.ice, 4); px.shape(box(6.8, 10.4, 2.6, 4.6), R.woodD, 5);
  }));
  /* room-control upgrades */
  reg('a-ledger', make(16, 16, px => { px.shape(box(3, 1.6, 10, 12.8), R.red, 1); px.shape(box(3, 1.6, 1.8, 12.8), R.woodD, 2); px.shape(box(5.8, 4, 5.6, 4.6), R.paper, 3); px.shape(or(box(6.4, 5, 4.2, .8), box(6.4, 6.6, 3, .8)), R.ink, 4); px.shape(box(5.8, 10, 5.6, 1.2), R.banY, 3); }));
  reg('a-buyer', make(16, 16, px => {
    px.shape(poly([[1.4, 3.4], [3.8, 3.4], [5, 5.4], [14, 5.4], [12.6, 10.4], [5.6, 10.4]]), R.metal, 1);
    px.shape(or(ell(6.4, 13, 1.5, 1.5), ell(11.6, 13, 1.5, 1.5)), R.ink, 2); px.shape(or(ell(6.6, 7.6, 1.4, 1.8), ell(9.6, 7.6, 1.4, 1.8)), R.banY, 3); px.shape(cap(10.6, 6.6, 12, 4, .9), R.banG, 3);
  }));
  reg('a-blueprint', make(16, 16, px => {
    px.shape(box(2.6, 2.8, 11, 9.4), R.blue, 1); px.shape(or(box(4.2, 4.4, 8, .7), box(4.2, 6.6, 8, .7), box(4.2, 8.8, 8, .7), box(6, 4, .7, 6.4), box(9, 4, .7, 6.4)), R.sky, 2);
    px.shape(ell(8, 7.8, 2, 2), R.white, 3); px.shape(ell(12.8, 12.6, 2.4, 2.4), R.paper, 4); px.shape(ell(12.8, 12.6, 1, 1), R.ink, 5);
  }));
  reg('a-foreman', make(16, 16, px => {
    px.shape(ell(8, 8.4, 6, 4.8), R.banY, 1); px.shape(box(1.6, 10.2, 12.8, 2.4), R.sun, 2); px.shape(box(6.8, 2.8, 2.4, 4.2), R.sun, 3);
    px.shape(or(ell(5.4, 13.6, 1.6, 1.4), ell(10.6, 13.6, 1.6, 1.4)), R.skin, 4); px.dot(6, 11.5, R.ink, 1, 6); px.dot(10, 11.5, R.ink, 1, 6);
  }));
  /* the new shop families */
  reg('f-drive', make(16, 16, px => { cog(px, 8, 8, 6.8, R.banY, 1); px.shape(ell(8, 8, 2.2, 2.2), R.ink, 4); px.shape(cap(3.4, 5, 5.4, 3.4, .5), R.banIn, 5); }));
  reg('f-batch', make(16, 16, px => { [[1.6, 9.6], [2.4, 6], [1.6, 2.4]].forEach(([x, y], i) => { px.shape(box(x, y, 12, 4.4), i === 1 ? R.paper : R.woodL, 1 + i * 2); px.shape(box(x + 1.4, y - 1, 4, 1.4), R.wood, 2 + i * 2); }); px.dot(12, 4, R.ink, 1, 8); }));
  reg('f-bundle', make(16, 16, px => { px.shape(box(2, 9, 12, 5), R.red, 1); px.shape(box(3, 4, 11, 5), R.leaf, 2); px.shape(box(1.6, 0.6, 11, 4), R.blue, 3); px.shape(box(6.8, 0.6, 1.8, 14), R.banY, 4); px.shape(box(2, 11, 12, 1), R.woodD, 5); }));
  reg('f-dict', make(16, 16, px => {
    px.shape(poly([[1, 3.4], [7.6, 4.6], [7.6, 14], [1, 12.8]]), R.paper, 1); px.shape(poly([[15, 3.4], [8.4, 4.6], [8.4, 14], [15, 12.8]]), R.paper, 1);
    px.shape(box(7.4, 3.6, 1.2, 10.6), R.red, 2); px.shape(or(box(2.4, 6, 3.8, .8), box(2.4, 8.2, 3.8, .8), box(10, 6, 3.8, .8), box(10, 8.2, 3.8, .8)), R.ink, 3); px.shape(cap(4, 11, 5, 9.6, .5), R.red, 4);
  }));
  reg('f-backlist', make(16, 16, px => {
    px.shape(box(0.8, 13, 14.4, 2.2), R.wood, 1);
    [[1.6, 4, 2.6, R.red], [4.6, 2, 2.4, R.blue], [7.4, 5, 2.6, R.leaf], [10.6, 3, 2.4, R.banY]].forEach(([x, y, w, r], i) => { px.shape(box(x, y, w, 9.2 - (y - 2)), r, 2 + i); px.shape(box(x, y + 1.6, w, .8), R.paper, 7); });
  }));
  reg('f-editorial', make(16, 16, px => {
    px.shape(cap(3, 12.6, 11, 4.2, 1.7), R.red, 1); px.shape(poly([[1.4, 14.6], [3.4, 11.6], [4.6, 13]]), R.skin, 2); px.shape(poly([[1.4, 14.6], [2.2, 13.4], [2.8, 14.2]]), R.ink, 3);
    px.shape(cap(11.6, 3.6, 13.4, 1.8, 1.6), R.metal, 2); px.shape(cap(9.4, 12, 11.2, 13.8, .9), R.banG, 3); px.shape(cap(11.2, 13.8, 14.6, 9.8, .9), R.banG, 3);
  }));
  reg('f-genre', make(16, 16, px => {
    px.shape(ell(5.6, 7.6, 4.6, 5.4), R.banY, 1); px.shape(ell(10.6, 8.6, 4.4, 5.2), R.ice, 2);
    px.shape(or(ell(4, 6.4, .9, .9), ell(7.2, 6.4, .9, .9)), R.ink, 3); px.shape(cap(3.8, 9, 5.6, 10.6, .6), R.ink, 3); px.shape(cap(5.6, 10.6, 7.4, 9, .6), R.ink, 3);
    px.shape(or(ell(9, 7.8, .9, .9), ell(12.2, 7.8, .9, .9)), R.ink, 4); px.shape(cap(9, 11.4, 10.6, 10, .6), R.ink, 4); px.shape(cap(10.6, 10, 12.2, 11.4, .6), R.ink, 4);
  }));
  /* expedition routes */
  reg('x-salvage', make(16, 16, px => {
    px.shape(box(1.6, 6.2, 12.8, 8), R.wood, 1); px.shape(box(1.2, 4, 13.6, 3), R.woodL, 2); px.shape(cap(5.4, 4, 5.4, 2.4, .8), R.metal, 3); px.shape(cap(5.4, 2.4, 10.6, 2.4, .8), R.metal, 3); px.shape(cap(10.6, 2.4, 10.6, 4, .8), R.metal, 3);
    px.shape(box(1.6, 9.4, 12.8, 1.2), R.woodD, 4); cog(px, 8, 11.4, 2.6, R.metal, 5);
  }));
  reg('x-manuscript', make(16, 16, px => {
    px.shape(box(3.6, 3, 8.8, 10), R.paper, 1); px.shape(or(ell(8, 3, 5.6, 1.7), ell(8, 13, 5.6, 1.7)), R.woodL, 2);
    px.shape(or(box(5, 5.6, 6, .8), box(5, 7.6, 6, .8), box(5, 9.6, 4, .8)), R.ink, 3); px.shape(ell(11, 10.6, 1.5, 1.5), R.red, 4);
  }));
  reg('x-archive', make(16, 16, px => {
    px.shape(cap(3, 14, 12, 3, 1), R.wood, 1); px.shape(poly([[1.4, 4], [5, 1.4], [10.6, 1.8], [14.6, 5.4], [11.6, 5], [8, 3.8], [4.4, 4.8]]), R.metal, 2);
    px.shape(or(box(8, 11, 6, 3.4), box(9, 9.4, 5, 2.2)), R.paper, 3); px.shape(box(8, 12.2, 6, .8), R.red, 4);
  }));
  /* attachments */
  reg('w-carriage', make(16, 16, px => {
    px.shape(box(0.8, 7, 14.4, 3), R.metal, 1); px.shape(cap(11.4, 7.6, 14.4, 2.6, 1), R.woodD, 2); px.shape(ell(14.6, 2.4, 1.7, 1.7), R.red, 3);
    px.shape(or(box(2.4, 10, 2, 3), box(7, 10, 2, 3), box(11.6, 10, 2, 3)), R.gray, 4); px.shape(poly([[3.4, 4.8], [6.6, 4.8], [5, 2.6]]), R.banY, 5);
  }));
  reg('w-tray', make(16, 16, px => {
    px.shape(box(1.6, 10, 12.8, 4.6), R.woodL, 1); px.shape(box(1.6, 12.2, 12.8, 1), R.wood, 2);
    [[2.6, 3.4], [6, 2], [9.4, 3.8]].forEach(([x, y], i) => { px.shape(box(x, y, 3.2, 8), R.paper, 3 + i); px.shape(box(x + .6, y + 1.8, 2, .8), R.ink, 7); px.shape(box(x + .6, y + 3.6, 2, .8), R.ink, 7); });
  }));
  reg('w-press', make(16, 16, px => {
    px.shape(box(3, 12.4, 10, 2.8), R.metal, 1); px.shape(box(7, 3.4, 2, 9), R.gray, 2); px.shape(box(5, 10, 6, 2.4), R.red, 3);
    px.shape(cap(2.4, 3, 13.6, 3, 1.1), R.woodD, 4); px.shape(or(ell(2.2, 3, 1.5, 1.5), ell(13.8, 3, 1.5, 1.5)), R.woodL, 5);
  }));
  reg('w-typebar', make(16, 16, px => {
    px.shape(cap(3, 14.4, 6.4, 8, 1), R.metal, 1); px.shape(cap(6.4, 8, 9.6, 4.4, 1), R.metal, 1); px.shape(box(8.4, 1.4, 5.6, 4.6), R.gray, 2);
    px.shape(or(box(9.4, 2.4, 1, 2.6), box(11.4, 2.4, 1, 2.6), box(9.4, 3.4, 3, .8)), R.paper, 3); px.shape(ell(3, 14.4, 1.8, 1.4), R.ink, 4); px.shape(cap(10, 6.4, 10, 8.4, .5), R.red, 4);
  }));
  /* specializations */
  reg('b-rapid', make(16, 16, px => {
    px.shape(ell(8, 9.4, 6.2, 4.4), R.metal, 1); px.shape(box(2, 9.4, 12, 3.6), R.gray, 2); px.shape(ell(8, 9.4, 2.2, 2.2), R.ink, 3);
    px.shape(poly([[10.4, 0.8], [5.4, 7.6], [8.2, 7.6], [6, 13.6], [12, 5.8], [9, 5.8]]), R.banY, 4);
  }));
  reg('b-collector', make(16, 16, px => {
    book(px, 2.6, 2, 10.6, 12.4, R.leaf, R.banIn);
    px.shape(poly([[8.6, 4.8], [9.8, 7.4], [12.6, 7.6], [10.4, 9.4], [11.2, 12.2], [8.6, 10.6], [6, 12.2], [6.8, 9.4], [4.6, 7.6], [7.4, 7.4]]), R.banY, 4);
  }));
  reg('b-prestige', make(16, 16, px => {
    px.shape(poly([[2, 13], [1.4, 4.6], [5.2, 8.6], [8, 2.2], [10.8, 8.6], [14.6, 4.6], [14, 13]]), R.banY, 1); px.shape(box(2, 11.4, 12, 2.6), R.sun, 2);
    px.shape(or(ell(8, 6.6, .9, .9), ell(4.2, 8.4, .8, .8), ell(11.8, 8.4, .8, .8)), R.red, 3); px.dot(8, 12.6, R.ice, 2, 4);
  }));
  /* Lost Library covers */
  reg('l-anthology', make(16, 16, px => { book(px, 2.6, 1.6, 10.8, 12.8, R.red, R.banIn); px.shape(box(10, 1.6, 1.8, 6, 0), R.banY, 4); }));
  reg('l-almanac', make(16, 16, px => { book(px, 2.6, 1.6, 10.8, 12.8, R.blue, R.sky); px.shape(ell(9.2, 9.6, 2.2, 2.2), R.moon, 4); px.shape(ell(10, 9.2, 1.8, 1.8), R.blue, 5); }));
  reg('l-atlas', make(16, 16, px => { book(px, 2.6, 1.6, 10.8, 12.8, R.leafD, R.banIn); px.shape(ell(8.6, 9.8, 3, 3), R.sky, 4); px.shape(or(ell(7.6, 9.2, 1.2, 1), ell(9.8, 10.8, 1.2, .9)), R.leaf, 5); }));
  /* the explorer walks the expedition strip (two frames) and the Annex stands on the Campus tab */
  const explorer = leg => make(16, 16, px => {
    px.shape(box(2.4, 6.4, 3.4, 5), R.leaf, 1);                                              // backpack
    px.shape(ell(8.6, 10, 3.6, 3.6), R.fur, 2); px.shape(cap(7, 12.4, leg ? 5.6 : 7, 15, 1), R.fur, 3); px.shape(cap(10.2, 12.4, leg ? 11.4 : 10.4, 15, 1), R.fur, 3);
    px.shape(ell(9.6, 6.6, 3.4, 3.2), R.fur, 4); px.shape(ell(10.6, 7.4, 2, 1.7), R.skin, 5); px.dot(10.4, 6.4, R.ink, 1, 6);
    px.shape(ell(9.6, 4.4, 4.2, 2.1), R.paper, 7); px.shape(box(5.4, 4.6, 8.4, 1), R.red, 8);   // pith helmet
  });
  reg('x-explorer-0', explorer(false)); reg('x-explorer-1', explorer(true));
  reg('c-annex', make(48, 34, px => {
    px.shape(box(2, 12, 44, 21), R.woodL, 1); px.shape(poly([[0, 13], [24, 1], [48, 13]]), R.red, 2); px.shape(box(35, 1, 5, 9), R.gray, 3);
    [[6, 16], [14, 16], [30, 16], [38, 16]].forEach(([x, y]) => px.shape(box(x, y, 5, 6), R.blue, 4)); px.shape(box(21, 22, 6, 11), R.woodD, 5); px.shape(box(2, 31.6, 44, 1.4), R.wood, 6);
    px.shape(box(20, 14, 8, 4), R.paper, 7); px.shape(box(21, 15, 6, 2), R.ink, 8);
  }));
  reg('c-house', make(48, 34, px => {
    px.shape(box(2, 12, 44, 21), R.woodL, 1); px.shape(poly([[0, 13], [24, 1], [48, 13]]), R.leafD, 2); px.shape(box(35, 1, 5, 9), R.gray, 3);
    [[6, 16], [14, 16], [30, 16], [38, 16]].forEach(([x, y]) => px.shape(box(x, y, 5, 6), R.blue, 4)); px.shape(box(21, 22, 6, 11), R.woodD, 5); px.shape(box(2, 31.6, 44, 1.4), R.wood, 6);
  }));
  reg('c-studio', make(48, 34, px => {
    px.shape(box(2, 12, 44, 21), R.paper, 1); px.shape(poly([[0, 13], [24, 1], [48, 13]]), R.blue, 2); px.shape(box(35, 1, 5, 9), R.gray, 3);
    px.shape(box(13, 15, 22, 9), R.sky, 4); px.shape(box(23, 15, 2, 9), R.white, 5); px.shape(box(6, 17, 4, 5), R.banY, 6); px.shape(box(38, 17, 4, 5), R.banY, 6);
    px.shape(box(21, 25, 6, 8), R.woodD, 7); px.shape(box(2, 31.6, 44, 1.4), R.wood, 8);
  }));
  reg('c-lit', make(6, 7, px => { px.shape(box(0, 0, 6, 7), R.banY, 1); px.dot(1, 1, R.star, 2, 2); px.dot(2, 1, R.star, 2, 2); }));
  reg('c-puff', make(8, 8, px => { px.shape(or(ell(3, 4.4, 2.6, 2.4), ell(5.2, 3.4, 2.4, 2.2)), R.white, 1); }));
  reg('c-coin', make(8, 8, px => { px.shape(ell(4, 4, 3.4, 3.4), R.banY, 1); px.dot(3, 3, R.star, 2, 2); }));

  const render2 = px => { // render without outline (tiles)
    const { w, h, c, t } = px, out = new Uint8ClampedArray(w * h * 4);
    for (let i = 0; i < w * h; i++) { const col = ramps[c[i]][(t[i] || 2) - 1]; out[i * 4] = col[0]; out[i * 4 + 1] = col[1]; out[i * 4 + 2] = col[2]; out[i * 4 + 3] = 255; }
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h; cv.getContext('2d').putImageData(new ImageData(out, w, h), 0, 0); return cv;
  };
  function vineTile(W, H, horizontal) {
    const px = new Px(horizontal ? H : W, horizontal ? W : H);
    const map = horizontal ? (x, y) => [y, x] : null;
    const cx = y => W / 2 + W * 0.16 * Math.sin(2 * Math.PI * y / H);
    for (let y = -1; y <= H; y++) px.shape(cap(cx(y), y, cx(y + 1), y + 1, 1.5), R.vine, 1, map);
    const leaf = (y, dir) => { const x = cx(y), L = Math.max(3, W * .34); px.shape(poly([[x, y], [x + dir * L * .5, y - L * .5], [x + dir * L, y - L * .35], [x + dir * L * .7, y + L * .15]]), R.leaf, 2, map); };
    leaf(H * .3, 1); leaf(H * .8, -1);
    return make2(px);
  }
  const make2 = px => render(px, true, true);

  /* ---------- background layers ---------- */
  function layerTile(W, H, fn) { const px = new Px(W, H); fn(px, rng(W * 7 + H)); return render(px, true, false); }
  const wrap = (px, shapeFn, ramp, part, W) => [-W, 0, W].forEach(o => px.shape(shapeFn(o), ramp, part));
  const farTile = () => layerTile(256, 96, (px, r) => {
    let part = 1;
    [[R.far2, 62, 11, 22, 14], [R.far1, 76, 12, 24, 14]].forEach(([ramp, base, a, b, n]) => {
      for (let i = 0; i < n; i++) { const x = r() * 256, rad = a + r() * (b - a), y = base + (r() - .5) * 8; wrap(px, o => ell(x + o, y, rad * 1.2, rad), ramp, part++, 256); }
      px.shape(box(0, base + 6, 256, 96), ramp, part++);
    });
  });
  const midTile = () => layerTile(256, 300, (px, r) => {
    let part = 1;
    [34, 150, 226].forEach((x, ti) => {
      const w = 13 + Math.floor(r() * 6);
      wrap(px, o => poly([[x - w / 2 + o, 0], [x + w / 2 + o, 0], [x + w / 2 + 2 + o, 300], [x - w / 2 - 2 + o, 300]]), R.woodD, part++, 256);
      for (let n = 0; n < 90; n++) { const yy = Math.floor(r() * 300), xx = x - w / 2 + 1 + Math.floor(r() * (w - 2)); px.tone(xx, yy, r() < .6 ? 0 : 2, null); px.tone(xx, yy + 1, r() < .6 ? 0 : 2, null); }
      for (let n = 0; n < 5; n++) { const yy = 30 + r() * 250; wrap(px, o => ell(x + o + (r() < .5 ? -1 : 1), yy, 2, 2.6), R.wood, part++, 256); }
    });
    for (let n = 0; n < 16; n++) { const x = r() * 256, y = 4 + r() * 26, rad = 9 + r() * 12; wrap(px, o => ell(x + o, y, rad * 1.3, rad * .8), n % 2 ? R.leafD : R.leaf, part++, 256); }
    for (let n = 0; n < 11; n++) {
      const x0 = r() * 256, len = 50 + r() * 120, ph = r() * 6, amp = 2 + r() * 2;
      for (let y = 8; y < len; y += 2) wrap(px, o => cap(x0 + o + amp * Math.sin(y / 9 + ph), y, x0 + o + amp * Math.sin((y + 2) / 9 + ph), y + 2, 1.1), R.vine, part, 256);
      part++;
      for (let y = 20; y < len; y += 16) { const lx = x0 + amp * Math.sin(y / 9 + ph), d = (y / 16) % 2 ? 1 : -1; wrap(px, o => poly([[lx + o, y], [lx + o + d * 3, y - 3], [lx + o + d * 6, y - 1.5], [lx + o + d * 4, y + 1.5]]), R.leaf, part++, 256); }
    }
  });
  const nearTile = () => layerTile(256, 96, (px, r) => {
    let part = 1;
    for (let f = 0; f < 7; f++) {
      const bx = (f + r() * .6) * 37, th = (r() - .5) * 1.7, L = 44 + r() * 38, droop = (r() - .5) * 26;
      const P = t => [bx + Math.sin(th) * L * t + droop * t * t, 96 - Math.cos(th) * L * t + Math.abs(droop) * .4 * t * t];
      for (let t = 0; t < 1; t += 0.04) { const a = P(t), b = P(t + .04); wrap(px, o => cap(a[0] + o, a[1], b[0] + o, b[1], 1.3), R.leafD, part, 256); }
      part++;
      for (let t = .14; t < .98; t += .07) {
        const a = P(t), b = P(t + .03), dx = b[0] - a[0], dy = b[1] - a[1], ang = Math.atan2(dy, dx), ln = (1 - t) * 15 + 5;
        [-1, 1].forEach(s => { const aa = ang + s * 1.05; wrap(px, o => cap(a[0] + o, a[1], a[0] + o + Math.cos(aa) * ln, a[1] + Math.sin(aa) * ln, 1.4), (Math.floor(t * 100) + f) % 2 ? R.leaf : R.leafD, part++ % 250 + 1, 256); });
      }
    }
  });

  /* ---------- runtime canvases sized to the viewport ---------- */
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  function ditherSky(w, h, pal) {
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const g = cv.getContext('2d'), img = g.createImageData(w, h), cols = pal.map(rgb);
    for (let y = 0; y < h; y++) {
      const t = y / Math.max(1, h - 1) * (cols.length - 1), i = Math.min(cols.length - 2, Math.floor(t)), f = t - i;
      for (let x = 0; x < w; x++) { const c = cols[f > (BAYER[(y & 3) * 4 + (x & 3)] + .5) / 16 ? i + 1 : i], o = (y * w + x) * 4; img.data[o] = c[0]; img.data[o + 1] = c[1]; img.data[o + 2] = c[2]; img.data[o + 3] = 255; }
    }
    g.putImageData(img, 0, 0); return cv;
  }
  function starField(w, h, seed, n) {
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d'), r = rng(seed);
    for (let i = 0; i < n; i++) { const x = Math.floor(r() * w), y = Math.floor(r() * h * .7); g.fillStyle = r() < .25 ? '#ffffff' : '#fff7b0'; g.fillRect(x, y, 1, 1); if (r() < .2) { g.fillRect(x - 1, y, 3, 1); g.fillRect(x, y - 1, 1, 3); } }
    return cv;
  }
  const SKY_DAY = ['#e4f9b0', '#b8ec78', '#86d65a', '#56b04a', '#2f8040', '#1c5a34', '#10402a', '#0a2a1c'];
  const SKY_NIGHT = ['#2a3a8a', '#1e2c70', '#141e55', '#0e1640', '#0a1030', '#070b24', '#050818', '#03050e'];

  /* ---------- install: expose everything as CSS vars + helper API ---------- */
  const PXA = {
    S, R, spr, frames,
    banana: null, coconut: null,
    css(name, u) { document.documentElement.style.setProperty('--' + name, `url(${u})`); },
    el(name, mult = 1) { const d = document.createElement('div'), s = spr[name]; d.className = 'spr'; d.style.cssText = `width:${s.w * S * mult}px;height:${s.h * S * mult}px;background-image:url(${s.url});background-size:100% 100%`; return d; },
    frame(el, sh, i, k = S) { el.style.width = sh.fw * k + 'px'; el.style.height = sh.fh * k + 'px'; el.style.backgroundImage = `url(${sh.url})`; el.style.backgroundSize = `${sh.fw * sh.n * k}px ${sh.fh * k}px`; el.style.backgroundPosition = `${-i * sh.fw * k}px 0`; },
    blit(canvas, f) { if (canvas.width !== f.W) { canvas.width = f.W; canvas.height = f.H; canvas.style.width = f.W * S + 'px'; canvas.style.height = f.H * S + 'px'; } const g = canvas.getContext('2d'); g.clearRect(0, 0, canvas.width, canvas.height); g.drawImage(f.cv, 0, 0); },
    paintSky() {
      const w = Math.ceil(innerWidth / S), h = Math.ceil(innerHeight / S), px = S;
      const day = ditherSky(w, h, SKY_DAY), night = ditherSky(w, h, SKY_NIGHT);
      const set = (id, cv) => { const e = document.getElementById(id); if (e) { e.style.backgroundImage = `url(${cv.toDataURL()})`; e.style.backgroundSize = `${w * px}px ${h * px}px`; } };
      set('sky', day); set('nightSky', night);
      set('starsA', starField(w, h, 3, Math.floor(w * h / 260))); set('starsB', starField(w, h, 9, Math.floor(w * h / 300)));
    },
    install() {
      ['dbanana', 'i-star', 'i-insp', 'banana', 'i-part', 'i-seal'].forEach(n => this.css('g-' + n, spr[n].url));
      this.css('plank', url(plankTile())); this.css('vine-v', url(vineTile(16, 48, false))); this.css('vine-thin', url(vineTile(8, 24, false)));
      this.css('vine-h', url(vineTile(16, 48, true)));
      this.css('frame-wood', url(frames.wood)); this.css('frame-dark', url(frames.dark)); this.css('frame-leaf', url(frames.leaf));
      this.css('frame-paper', url(frames.paper)); this.css('frame-dark-s', url(frames.darkS)); this.css('frame-leaf-s', url(frames.leafS)); this.css('frame-paper-s', url(frames.paperS)); this.css('frame-yellow-s', url(frames.yellowS)); this.css('frame-yellow', url(frames.yellow)); this.css('frame-sky', url(frames.sky));
      this.css('layer-far', url(farTile())); this.css('layer-mid', url(midTile())); this.css('layer-near', url(nearTile()));
      this.css('thumb-log', url(make(8, 12, px => { px.shape(box(0, 0, 8, 12), R.woodL, 1); px.shape(box(0, 5, 8, 2), R.woodD, 2); })));
      this.css('banana-s', spr.banana.url);
      this.banana = sheet(Array.from({ length: BANANA_FRAMES }, (_, i) => bananaFrame(i / (BANANA_FRAMES - 1))));
      this.coconut = sheet(Array.from({ length: COCO_FRAMES }, (_, i) => coconutFrame(i)));
      this.weather = sheet([0, 1, 2, 3].map(weatherFrame));
      // banana buttons (fixed-size crescent sprites)
      const btn = (ramp) => make(100, 30, px => {
        const body = sub(ell(50, 7, 49, 21), ell(50, -9, 54, 21));
        px.shape(body, ramp, 1);
        px.shape(and(body, (x, y) => x < 6), R.stem, 2); px.shape(and(body, (x, y) => x > 94), R.stem, 2);
      });
      this.css('btn-yellow', url(btn(R.banY))); this.css('btn-green', url(btn(R.banG)));
      this.paintSky();
      document.querySelectorAll('[data-spr]').forEach(e => { const s = spr[e.dataset.spr], m = +(e.dataset.mult || 1); e.style.width = s.w * S * m + 'px'; e.style.height = s.h * S * m + 'px'; e.style.backgroundImage = `url(${s.url})`; e.style.backgroundSize = '100% 100%'; });
    },
  };
  window.PXA = PXA;
})();
