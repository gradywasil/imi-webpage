/* STORY KIT: the shared pixel diorama for the story cutscenes (story.js, story-scenes-*.js) and the living title screen.
   Everything is drawn at ART resolution (1 unit = 1 art pixel) onto a small buffer, then blown up by a whole number onto the screen canvas,
   so every pixel sits on one grid: crisp, never smoothed, never scaled by a fraction. The camera pans in whole art pixels and zooms only
   in whole steps (a zoom is a cut, not a tween).

   World coordinates: x = 0 is the middle of the building, y = 0 is the ground line under the building, y grows downward, so the sky is y < 0.
   The crew and the actors of a scene stand a little in front of the building, on SK.FLOOR (y = 8).

   Read .plan/story/KIT-API.md for the full API. The short version:
     StoryKit.render(canvas, t, world, opts)     size the canvas, draw sky + building + crew + your hooks, blow it up. Returns the view.
     StoryKit.drawWorld(g, t, world, opts)       the same, onto an art-resolution context you own (no sizing, no blow-up).
     StoryKit.actor(g, look, pose, x, feet, o)   a CrewArt monkey (64px sprite) standing with its feet at (x, feet).
     StoryKit.typewriter(g, desk, x, y, key, o)  a little machine in that desk's colour, sitting on y.
     StoryKit.scene(def) / StoryKit.scenes       the cutscene registry story.js plays. */
(function (G) {
  'use strict';
  const SK = (G.StoryKit = G.StoryKit || {});
  const TAU = Math.PI * 2;
  const FLOOR = (SK.FLOOR = 8);

  /* ================= math ================= */
  const clamp = (SK.clamp = (v, a, b) => Math.max(a, Math.min(b, v)));
  const lerp = (SK.lerp = (a, b, k) => a + (b - a) * k);
  /** 0..1 progress of t through [a, b] */
  const seg = (SK.seg = (t, a, b) => clamp((t - a) / (b - a || 1e-9), 0, 1));
  const ease = (SK.ease = {
    linear: k => k,
    in: k => k * k,
    out: k => 1 - (1 - k) * (1 - k),
    inOut: k => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2),
    back: k => { const c = 1.70158; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); },
    pop: k => (k < 0.7 ? ease.out(k / 0.7) * 1.15 : 1.15 - 0.15 * ease.inOut((k - 0.7) / 0.3)),
    step: n => k => Math.floor(k * n) / n,
  });
  /** A hop: 0 at both ends, -h (up) in the middle of k = 0..1 */
  SK.hop = (k, h) => -Math.sin(clamp(k, 0, 1) * Math.PI) * h;
  /** A decaying bounce after a landing, r seconds ago */
  SK.wobble = (r, amp = 3, freq = 18, decay = 7) => (r < 0 ? 0 : amp * Math.exp(-r * decay) * Math.cos(r * freq));
  /** Frame number at fps: use for stepped cycles (walks, blinks) */
  SK.frame = (t, fps, n) => { const f = Math.floor(t * fps); return n ? ((f % n) + n) % n : f; };
  /** Keyframe track: keys = [[t, value, easeName?], ...] sorted by t; value is a number or an object of numbers. Pure in t. */
  SK.track = function (t, keys) {
    if (t <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) {
      const [t1, v1, e] = keys[i];
      if (t < t1) {
        const [t0, v0] = keys[i - 1], k = (ease[e || 'inOut'] || ease.inOut)((t - t0) / (t1 - t0 || 1e-9));
        if (typeof v0 === 'number') return lerp(v0, v1, k);
        const o = {}; for (const key in v1) o[key] = typeof v1[key] === 'number' && typeof v0[key] === 'number' ? lerp(v0[key], v1[key], key === 'z' ? 0 : k) : v1[key];
        if ('z' in v1) o.z = k < 0.5 ? v0.z || 0 : v1.z || 0;   // zoom is a whole step: it cuts at the midpoint
        return o;
      }
    }
    return keys[keys.length - 1][1];
  };
  /** Seeded random (mulberry32) */
  const rng = (SK.rng = seed => () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; });
  const hash = (x, s = 0) => { let h = Math.imul((x | 0) ^ (s * 0x9e3779b9), 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
  SK.hash = hash;

  /* ================= palette (monkey-assets tokens/ramps.json, 5 steps: highlight, light, base, shadow, deep) ================= */
  const RAMP = (SK.RAMP = {
    wood: ['#eed0a4', '#b57d3e', '#8a5a2b', '#5a3517', '#30180a'],
    woodD: ['#b07844', '#7d4f26', '#5a3517', '#3a1e0b', '#200e05'],
    woodL: ['#ffeed0', '#e8b878', '#c08a4a', '#7a4a1e', '#42240a'],
    leaf: ['#a8ec76', '#74c648', '#2f8a35', '#1a5e24', '#0c3012'],
    leafD: ['#62c85e', '#3f9a3a', '#1f6a2a', '#12441a', '#08220c'],
    banY: ['#fffbe0', '#fff08c', '#ffd23a', '#c98f0e', '#5a3a06'],
    paper: ['#ffffff', '#fff6d6', '#ede0b8', '#c9b88a', '#786842'],
    metal: ['#ffffff', '#d8d8e4', '#a4a4b4', '#626274', '#343444'],
    ink: ['#5c4650', '#3a2a30', '#1a0f14', '#12090e', '#0a0408'],
    sky: ['#e4f6ff', '#9ce0ff', '#52b8ec', '#2878b4', '#123e64'],
    sun: ['#fffbe0', '#fff4a0', '#ffc62a', '#d97a0c', '#6e3004'],
    moon: ['#ffffff', '#edf2fc', '#d8e0f0', '#7e8ab0', '#3a4468'],
    storm: ['#9aa8c8', '#6a7796', '#454f6e', '#28304a', '#141828'],
    cloud: ['#ffffff', '#eef4fb', '#d2e2f0', '#a4bcd4', '#5a7490'],
    red: ['#ffaba0', '#e86a50', '#b8322a', '#781c16', '#420a06'],
    rose: ['#ffb8cc', '#f08aa4', '#c8486c', '#8a2040', '#4a0a1e'],
    purple: ['#e4beff', '#b58cf0', '#7a46bc', '#4e2280', '#280c48'],
    blue: ['#8caef8', '#5470d8', '#2e44a8', '#1a2872', '#0c1442'],
    drop: ['#ffffff', '#d6f0ff', '#7ec8f0', '#3a8ec8', '#184c78'],
    stone: ['#f4ecd8', '#d8ccb0', '#b0a488', '#7a6e58', '#3e3628'],
    straw: ['#fff4c0', '#f0d070', '#d0a040', '#94682a', '#4e3412'],
    bamboo: ['#f0f4b0', '#c8d474', '#98aa48', '#5e6e28', '#2e3812'],
    coco: ['#caa078', '#86592e', '#563418', '#381e0c', '#1e0e04'],
    far1: ['#3da05a', '#2e8a48', '#1d6a38', '#134a2a', '#0a2a1c'],
    far2: ['#56b04a', '#3da05a', '#27804a', '#1a5e36', '#10402a'],
    gold: ['#fffbe0', '#fff08c', '#ffd23a', '#b38004', '#4a2e04'],
  });
  const K = { ink: '#1a0f14', cream: '#fff6d6', banana: '#ffd23a', leaf: '#2f8a35' };
  SK.COL = K;
  /* the six machines: ops.js DESKS colours, as [shadow, base, light] (pixel.js dmint..dmoon) */
  const DESK = (SK.DESK = [
    { id: 'mint', name: 'Bamboo Classic', c: ['#2f8a5a', '#78d9a0', '#c4f4d4'] },
    { id: 'rose', name: 'Hibiscus Ribbon', c: ['#a8456a', '#f08aa4', '#ffd0dc'] },
    { id: 'blue', name: 'Lagoon Sprint', c: ['#2c62a8', '#5fa8f0', '#bfe0ff'] },
    { id: 'amber', name: 'Honeycomb Ledger', c: ['#a8681a', '#f2b23a', '#ffe28a'] },
    { id: 'orchid', name: 'Orchid Imperial', c: ['#6a48a8', '#b58cf0', '#e4d4ff'] },
    { id: 'moon', name: 'Moonflower Grand', c: ['#7a80a0', '#dfe3f2', '#ffffff'] },
  ]);
  /* the media studios (ops.js DIVS ids) and their signs */
  const STUDIO = (SK.STUDIO = {
    songs: { name: 'JUNGLE RECORDS', sign: 'JUNGLE\nRECORDS', bg: '#4e2280', fg: '#ffd23a', trim: '#b58cf0' },
    tv: { name: 'CANOPY TV', sign: 'CANOPY\nTV', bg: '#1f6a2a', fg: '#fff6d6', trim: '#74c648' },
    radio: { name: 'VINE RADIO', sign: 'VINE\nRADIO', bg: '#2c62a8', fg: '#fff6d6', trim: '#9ce0ff' },
    sketch: { name: 'MONKEY BUSINESS', sign: 'MONKEY\nBUSINESS', bg: '#b8322a', fg: '#fff6d6', trim: '#ffd23a' },
    film: { name: 'IMI PICTURES', sign: 'IMI\nPICTURES', bg: '#1a0f14', fg: '#ffd23a', trim: '#ffd23a' },
  });
  SK.STAGES = ['clearing', 'hut', 'boathouse', 'hive', 'hall', 'tower'];

  /* ================= pixel primitives (art-resolution context, integer coordinates) ================= */
  const rect = (SK.rect = (g, x, y, w, h, c) => { if (w <= 0 || h <= 0) return; g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); });
  const dot = (g, x, y, c) => rect(g, x, y, 1, 1, c);
  /** A box lit from the top-left: light top row + left column, shadow bottom row + right column, a deep outline. r = a 5-step ramp. */
  const box = (SK.box = (g, x, y, w, h, r, o = {}) => {
    x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
    if (o.outline !== false) rect(g, x - 1, y - 1, w + 2, h + 2, o.ol || r[4]);
    rect(g, x, y, w, h, r[2]);
    if (w > 2 && h > 2) { rect(g, x, y, w, 1, r[1]); rect(g, x, y, 1, h, r[1]); rect(g, x, y + h - 1, w, 1, r[3]); rect(g, x + w - 1, y + 1, 1, h - 1, r[3]); }
  });
  /** A stepped (pixel) disc */
  const disc = (SK.disc = (g, cx, cy, r, c) => {
    cx = Math.round(cx); cy = Math.round(cy); g.fillStyle = c;
    for (let dy = -r; dy <= r; dy++) { const h = Math.floor(Math.sqrt(r * r - dy * dy) + 0.5); g.fillRect(cx - h, cy + dy, h * 2 + 1, 1); }
  });
  /** A stepped ellipse */
  const oval = (g, cx, cy, rx, ry, c) => {
    cx = Math.round(cx); cy = Math.round(cy); g.fillStyle = c;
    for (let dy = -ry; dy <= ry; dy++) { const h = Math.floor(rx * Math.sqrt(Math.max(0, 1 - (dy * dy) / (ry * ry))) + 0.5); g.fillRect(cx - h, cy + dy, h * 2 + 1, 1); }
  };
  SK.oval = oval;
  /** A leafy blob with an outline, a lit top-left and a darker underside */
  const blob = (SK.blob = (g, cx, cy, r, ramp) => {
    disc(g, cx, cy, r + 1, ramp[4]); disc(g, cx, cy, r, ramp[3]); disc(g, cx - 1, cy - 1, r - 1, ramp[2]);
    if (r > 3) disc(g, cx - Math.ceil(r / 3), cy - Math.ceil(r / 3), Math.max(1, Math.floor(r / 3)), ramp[1]);
  });

  /* ---------- a 3x5 pixel font for in-world signs (STYLE_GUIDE: pixel fonts for every visible string, in-canvas text included) ---------- */
  const GLYPH = {
    A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111', F: '111100110100100',
    G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010', K: '101110100110101', L: '100100100100111',
    M: [5, '1000111011101011000110001'], N: [4, '10011101101110011001'], O: '010101101101010', P: '110101110100100', Q: '010101101110011', R: '110101110101101',
    S: '011100010001110', T: '111010010010010', U: '101101101101111', V: '101101101101010', X: '101101010101101',
    W: [5, '1000110001101011101110001'], Y: '101101010010010', Z: '111001010100111', 0: '111101101101111', 1: '010110010010111', 2: '110001010100111', 3: '110001010001110',
    4: '101101111001001', 5: '111100110001110', 6: '011100111101111', 7: '111001010010010', 8: '111101111101111', 9: '111101111001110',
    '.': '000000000000010', ',': '000000000010100', '!': '010010010000010', '?': '110001010000010', '-': '000000111000000', "'": '010010000000000',
    ':': '000010000010000', '/': '001001010100100', '&': '010101010101011', '+': '000010111010000', '#': '101111101111101', ' ': '000000000000000',
  };
  const gw = ch => { const gl = GLYPH[ch]; return Array.isArray(gl) ? gl[0] : 3; };
  /** Width of a string in the 3x5 font at scale s */
  SK.textW = (str, s = 1) => { let w = 0; for (const ch of String(str).toUpperCase()) w += (gw(ch) + 1) * s; return Math.max(0, w - s); };
  /** Draw text in the 3x5 font. o: { align: 'left'|'center'|'right', s: scale, shadow: colour } */
  SK.text = function (g, str, x, y, col, o = {}) {
    const s = o.s || 1; str = String(str).toUpperCase();
    let x0 = Math.round(x - (o.align === 'center' ? SK.textW(str, s) / 2 : o.align === 'right' ? SK.textW(str, s) : 0)); y = Math.round(y);
    const paint = (dx, dy, c) => { g.fillStyle = c; let cx = x0 + dx; for (const ch of str) { const raw = GLYPH[ch] || GLYPH['?'], w = Array.isArray(raw) ? raw[0] : 3, gl = Array.isArray(raw) ? raw[1] : raw; for (let i = 0; i < w * 5; i++) if (gl[i] === '1') g.fillRect(cx + (i % w) * s, y + dy + Math.floor(i / w) * s, s, s); cx += (w + 1) * s; } };
    if (o.shadow) paint(s, s, o.shadow);
    paint(0, 0, col);
  };

  /* ================= small props ================= */
  /** A sign board with 3x5 text. dir: 0 plain, 1 arrow right, -1 arrow left. Returns its width. */
  SK.board = function (g, x, y, text, bg, fg, o = {}) {
    const lines = String(text).split('\n'), tw = Math.max(...lines.map(l => SK.textW(l))), w = tw + 6, h = 3 + lines.length * 6, x0 = Math.round(x);
    rect(g, x0 - 1, y - 1, w + 2, h + 2, K.ink); rect(g, x0, y, w, h, bg); rect(g, x0, y, w, 1, o.trim || 'rgba(255,255,255,.25)'); rect(g, x0, y + h - 1, w, 1, 'rgba(0,0,0,.3)');
    const mid = Math.floor(h / 2), tip = Math.min(5, mid + 1);
    if (o.dir === 1) for (let i = 0; i < tip; i++) { rect(g, x0 + w + i, y + mid - (tip - 1 - i) - 1, 1, (tip - 1 - i) * 2 + 3, K.ink); if (i < tip - 1) rect(g, x0 + w + i - 1, y + mid - (tip - 2 - i), 1, (tip - 2 - i) * 2 + 1, bg); }
    if (o.dir === -1) for (let i = 0; i < tip; i++) { rect(g, x0 - 1 - i, y + mid - (tip - 1 - i) - 1, 1, (tip - 1 - i) * 2 + 3, K.ink); if (i < tip - 1) rect(g, x0 - i, y + mid - (tip - 2 - i), 1, (tip - 2 - i) * 2 + 1, bg); }
    lines.forEach((l, i) => SK.text(g, l, x0 + 3 + Math.floor((tw - SK.textW(l)) / 2), y + 2 + i * 6, fg));
    return w;
  };
  /** A small banana (8x6), lying, or held upright when o.up */
  SK.banana = function (g, x, y, o = {}) {
    x = Math.round(x); y = Math.round(y);
    const B = RAMP.banY, rows = o.up ? [[2, 0, 2], [1, 1, 2], [0, 2, 3], [0, 3, 3], [0, 4, 3], [1, 5, 3], [2, 6, 2]] : [[0, 0, 2], [1, 1, 2], [2, 2, 5], [3, 3, 3]];
    if (o.up) { rows.forEach(([dx, dy, w]) => rect(g, x + dx - 1, y + dy, w + 2, 1, B[4])); rows.forEach(([dx, dy, w]) => rect(g, x + dx, y + dy, w, 1, B[2])); rect(g, x + 1, y + 2, 1, 3, B[1]); rect(g, x + 2, y - 1, 2, 1, '#52301a'); return; }
    // lying crescent: tips up at both ends
    const L = [[0, 0, 1], [7, 0, 1], [0, 1, 2], [6, 1, 2], [1, 2, 6], [2, 3, 4]];
    L.forEach(([dx, dy, w]) => rect(g, x + dx - 1, y + dy - 1, w + 2, 3, B[4]));
    L.forEach(([dx, dy, w]) => rect(g, x + dx, y + dy, w, 1, B[2]));
    rect(g, x + 2, y + 2, 4, 1, B[1]); rect(g, x + 3, y + 3, 2, 1, B[3]); dot(g, x, y - 1, '#52301a'); dot(g, x + 7, y - 1, '#52301a');
  };
  /** A string-bound book (9x11) */
  SK.book = function (g, x, y, o = {}) {
    x = Math.round(x); y = Math.round(y); const c = o.col || RAMP.red;
    rect(g, x - 1, y - 1, 11, 13, K.ink); rect(g, x, y, 9, 11, c[2]); rect(g, x, y, 9, 1, c[1]); rect(g, x, y, 2, 11, c[3]); rect(g, x + 8, y + 1, 1, 10, RAMP.paper[1]);
    rect(g, x + 3, y + 3, 4, 3, RAMP.paper[1]); rect(g, x + 4, y + 4, 2, 1, c[3]);
    if (o.string !== false) { rect(g, x, y + 7, 9, 1, '#c8a060'); rect(g, x + 5, y, 1, 11, '#c8a060'); dot(g, x + 5, y + 7, '#8a6420'); dot(g, x + 4, y + 8, '#c8a060'); dot(g, x + 6, y + 8, '#c8a060'); }
  };
  /** A loose page (w x h) with ink lines; n = how many lines are typed */
  SK.page = function (g, x, y, w = 9, h = 11, n = 4) {
    x = Math.round(x); y = Math.round(y);
    rect(g, x - 1, y - 1, w + 2, h + 2, RAMP.paper[4]); rect(g, x, y, w, h, RAMP.paper[1]); rect(g, x + w - 1, y, 1, h, RAMP.paper[2]);
    for (let i = 0; i < n && 2 + i * 2 < h - 1; i++) rect(g, x + 1, y + 2 + i * 2, w - 3 - ((i * 3) % 3), 1, '#3a2a60');
  };
  /** A four-point sparkle, r = 1..3 */
  SK.sparkle = function (g, x, y, r = 2, c = '#fff6d6') { x = Math.round(x); y = Math.round(y); rect(g, x - r, y, r * 2 + 1, 1, c); rect(g, x, y - r, 1, r * 2 + 1, c); if (r > 1) dot(g, x, y, '#ffffff'); };
  /** A dust puff, k = 0..1 of its life */
  SK.puff = function (g, x, y, k, o = {}) {
    if (k <= 0 || k >= 1) return; const n = o.n || 5, spread = (o.spread || 10) * Math.sqrt(k), c = o.col || RAMP.paper[2];
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI + Math.PI, r = Math.max(1, Math.round((1 - k) * (o.size || 3))); disc(g, x + Math.cos(a) * spread * (i % 2 ? 1 : 0.7), y + Math.sin(a) * spread * 0.45 - k * 3, r, c); }
  };
  /** A pixel heart / exclamation / question pop above a head */
  SK.pop = function (g, x, y, kind, k = 1) {
    x = Math.round(x); y = Math.round(y - (k < 1 ? Math.round((1 - k) * 3) : 0));
    if (kind === '!') { rect(g, x - 2, y - 9, 5, 11, K.ink); rect(g, x - 1, y - 8, 3, 6, K.banana); rect(g, x - 1, y - 1, 3, 2, K.banana); }
    else if (kind === '?') { rect(g, x - 3, y - 9, 7, 11, K.ink); rect(g, x - 2, y - 8, 4, 1, K.cream); rect(g, x + 1, y - 7, 2, 2, K.cream); rect(g, x, y - 5, 2, 2, K.cream); rect(g, x, y - 1, 2, 2, K.cream); }
    else if (kind === 'heart') { const R = RAMP.red; disc(g, x - 2, y - 5, 2, K.ink); disc(g, x + 2, y - 5, 2, K.ink); rect(g, x - 4, y - 5, 9, 2, K.ink); for (let i = 0; i < 4; i++) rect(g, x - 3 + i, y - 3 + i, 7 - 2 * i, 1, K.ink); disc(g, x - 2, y - 5, 1, R[1]); disc(g, x + 2, y - 5, 1, R[1]); rect(g, x - 3, y - 4, 7, 1, R[2]); for (let i = 0; i < 3; i++) rect(g, x - 2 + i, y - 3 + i, 5 - 2 * i, 1, R[2]); }
    else if (kind === 'note') { rect(g, x, y - 8, 1, 7, K.ink); rect(g, x + 1, y - 8, 3, 1, K.ink); rect(g, x + 3, y - 7, 1, 2, K.ink); disc(g, x - 1, y - 1, 1, K.ink); }
  };

  /** A toucan (about 20x14). frame: 0 perched, 1 wings up, 2 wings down. Faces right unless o.flip. Holds o.carry ('book') under it. */
  SK.toucan = function (g, x, y, frame = 0, o = {}) {
    x = Math.round(x); y = Math.round(y); const f = o.flip ? -1 : 1, P = (dx, dy, w, h, c) => rect(g, f > 0 ? x + dx : x - dx - w + 1, y + dy, w, h, c);
    const BK = '#24243a', BKL = '#4a4a66', WH = '#fff6d6', OR = '#ff9a2a', YL = '#ffd23a', RD = '#e8402a', BL = '#5fc8f0';
    // tail and body (outline first)
    P(-9, -6, 5, 3, K.ink); P(-8, -5, 4, 1, BK);
    P(-6, -10, 11, 10, K.ink); P(-5, -9, 9, 8, BK); P(-5, -9, 9, 1, BKL);
    P(1, -9, 4, 6, WH); P(1, -4, 3, 1, YL);                     // white throat and a yellow bib
    // head and the big beak
    P(-2, -14, 8, 6, K.ink); P(-1, -13, 6, 4, BK); P(2, -12, 2, 2, BL); P(3, -12, 1, 1, K.ink);
    P(5, -14, 9, 5, K.ink); P(6, -13, 7, 3, OR); P(6, -13, 7, 1, YL); P(12, -13, 2, 2, RD); P(6, -11, 6, 1, '#c8641a');
    // wing
    if (frame === 1) { P(-5, -17, 7, 8, K.ink); P(-4, -16, 5, 6, BK); P(-4, -16, 5, 1, BKL); }
    else if (frame === 2) { P(-5, -4, 7, 6, K.ink); P(-4, -3, 5, 4, BK); }
    else { P(-4, -8, 6, 5, K.ink); P(-3, -7, 4, 3, BKL); }
    // feet
    if (frame === 0) { P(-2, 0, 1, 2, OR); P(1, 0, 1, 2, OR); }
    if (o.carry === 'book') SK.book(g, x - 4, y + 1, { col: RAMP.red });
  };

  /* ================= trees, plants, the jungle ================= */
  /** A big jungle tree: trunk from y=0 up to top, canopy over it. side: which way the roots flare. */
  function bigTree(g, t, x, top, seed) {
    const r = rng(seed), T = RAMP.woodD, w = 10;
    // roots
    rect(g, x - w / 2 - 4, -3, w + 8, 3, T[4]); rect(g, x - w / 2 - 3, -2, w + 6, 2, T[2]);
    box(g, x - w / 2, top + 10, w, -top - 10, T);
    for (let y = top + 16; y < -4; y += 7) { rect(g, x - 2 + (Math.floor(y / 7) % 2) * 3, y, 1, 4, T[3]); }
    rect(g, x - w / 2 + 1, top + 12, 2, -top - 16, T[1]);
    // vines
    for (let i = 0; i < 3; i++) { const vx = x - 12 + Math.floor(r() * 24), len = 20 + Math.floor(r() * 30), sw = Math.floor(t * 1.2 + i) % 2; for (let y = 0; y < len; y += 1) { const ox = Math.round(Math.sin((y + i * 9) * 0.25)) + (y > len * 0.6 ? sw : 0); dot(g, vx + ox, top + 8 + y, y % 5 === 0 ? RAMP.leaf[1] : RAMP.leaf[3]); } }
    // canopy
    const C = [[0, 0, 14], [-14, 4, 11], [14, 3, 12], [-7, -8, 10], [8, -9, 10], [-22, 9, 7], [22, 10, 7]];
    C.forEach(([dx, dy, rr]) => blob(g, x + dx, top + dy, rr, RAMP.leafD));
    C.slice(0, 5).forEach(([dx, dy, rr]) => disc(g, x + dx - 2, top + dy - 3, Math.floor(rr / 2), RAMP.leaf[2]));
    C.slice(0, 5).forEach(([dx, dy, rr]) => disc(g, x + dx - 3, top + dy - 4, Math.max(1, Math.floor(rr / 4)), RAMP.leaf[1]));
  }
  /** A palm tree leaning by `lean` (-1..1) */
  function palm(g, t, x, h, lean, seed) {
    const sway = Math.floor(t * 1.5 + seed) % 2, T = RAMP.wood; let tx = x, ty = 0;
    for (let i = 0; i < h; i += 3) { const k = i / h; tx = x + Math.round(lean * k * k * 14); ty = -i; rect(g, tx - 2, ty - 3, 5, 3, T[4]); rect(g, tx - 1, ty - 3, 3, 3, (i / 3) % 2 ? T[2] : T[1]); }
    const fronds = [[-1, 0.2], [1, 0.2], [-1, 0.9], [1, 0.9], [0, -1]];
    for (const [d, droop] of fronds) {
      for (let j = 0; j < 14; j++) {
        const fx = tx + (d === 0 ? (j % 2) : d * j) + (j > 8 ? sway * d : 0), fy = ty - 3 + (d === 0 ? -j * 0.6 : Math.round((j * j) / 14 * droop) - (droop < 0.5 ? 2 : 0));
        rect(g, fx - 1, fy - 1, 3, 3, RAMP.leaf[4]); rect(g, fx, fy, 2, 1, RAMP.leaf[2]); if (j % 2) dot(g, fx, fy + 1, RAMP.leaf[3]);
      }
    }
    disc(g, tx, ty - 3, 2, RAMP.coco[2]); dot(g, tx - 1, ty - 4, RAMP.coco[0]);
  }
  /** A low bush */
  function bush(g, x, y, s, ramp = RAMP.leaf) { blob(g, x - s, y - s + 1, s, ramp); blob(g, x + s, y - s, s + 1, ramp); blob(g, x, y - s - 2, s, ramp); }
  /** Ferns: a fan of stepped fronds */
  function fern(g, t, x, y, s = 6) { const sw = Math.floor(t * 2 + x) % 2; for (let k = -2; k <= 2; k++) for (let j = 0; j < s; j++) dot(g, x + k * Math.round(j / 2) + (j > s - 2 ? sw : 0), y - j + Math.abs(k) * Math.round(j / 3), j % 2 ? RAMP.leaf[1] : RAMP.leaf[2]); }
  SK.prop = { bigTree, palm, bush, fern };

  /* ================= the sky ================= */
  const SKIES = {
    day: ['#3a98d8', '#52b8ec', '#7ccaf0', '#9ce0ff', '#c8eef8', '#e4f9d0'],
    dusk: ['#4e2280', '#7a46bc', '#c8486c', '#f08aa4', '#ffa860', '#ffd890'],
    night: ['#050818', '#070b24', '#0a1030', '#0e1640', '#141e55', '#1e2c70'],
    dawn: ['#2e44a8', '#5470d8', '#b58cf0', '#f0a8c8', '#ffd0b0', '#fff4c0'],
    storm: ['#28304a', '#353d5a', '#454f6e', '#56607e', '#6a7796', '#8290ae'],
    stormNight: ['#05060c', '#0a0d18', '#10142a', '#161c34', '#1e2640', '#283050'],
  };
  /** The sky, in screen space: dithered bands from the top down to the horizon row hy. env: { phase, wx } */
  function drawSky(g, t, bw, bh, hy, env, camX) {
    const night = env.phase === 'night', wet = env.wx >= 2;
    const cols = wet ? (night ? SKIES.stormNight : SKIES.storm) : SKIES[env.phase] || SKIES.day;
    const n = cols.length, top = Math.min(-20, hy - 150), span = Math.max(30, hy - top), bandH = span / n;
    rect(g, 0, 0, bw, bh, cols[n - 1]);
    for (let y = 0; y < Math.min(bh, hy + 2); y++) {
      const f = (y - top) / bandH, i = clamp(Math.floor(f), 0, n - 1), fr = f - Math.floor(f);
      g.fillStyle = cols[i]; g.fillRect(0, y, bw, 1);
      if (i < n - 1 && fr > 0.78) { g.fillStyle = cols[i + 1]; for (let x = (y % 2); x < bw; x += 2) g.fillRect(x, y, 1, 1); }   // a 2-row checker dither into the next band
    }
    // stars
    if (night || env.phase === 'dawn' || env.phase === 'dusk') {
      const r = rng(77), N = night ? 70 : 18;
      for (let i = 0; i < N; i++) {
        const sx = Math.floor(((r() * 900 - camX * 0.05) % bw + bw) % bw), sy = Math.floor(r() * Math.max(10, hy - 20)), tw = Math.floor(t * 2 + i * 1.7) % 7;
        if (wet && night && r() < 0.7) continue;
        if (sy > hy - 12) continue;
        g.fillStyle = tw === 0 ? '#ffffff' : i % 4 ? '#fff7b0' : '#c8d8ff'; g.fillRect(sx, sy, 1, 1);
        if (i % 9 === 0 && tw < 3) { g.fillRect(sx - 1, sy, 3, 1); g.fillRect(sx, sy - 1, 1, 3); }
      }
    }
    // the sun or the moon
    const body = (cx, cy, kind) => {
      if (kind === 'moon') { disc(g, cx, cy, 8, '#3a4468'); disc(g, cx, cy, 7, RAMP.moon[2]); disc(g, cx - 1, cy - 1, 6, RAMP.moon[1]); rect(g, cx + 1, cy + 1, 2, 2, RAMP.moon[3]); rect(g, cx - 4, cy + 2, 2, 1, RAMP.moon[3]); dot(g, cx + 1, cy - 3, RAMP.moon[3]); dot(g, cx - 2, cy - 2, RAMP.moon[3]); }
      else { const big = kind === 'low'; disc(g, cx, cy, big ? 11 : 8, big ? '#ffa860' : RAMP.sun[1]); disc(g, cx, cy, big ? 9 : 7, RAMP.sun[2]); disc(g, cx - 1, cy - 1, big ? 7 : 5, RAMP.sun[1]); disc(g, cx - 2, cy - 2, 2, RAMP.sun[0]); }
    };
    if (!wet || env.phase === 'night') {
      const sx = Math.round(bw * 0.78 - camX * 0.02);
      if (night) body(sx, Math.max(14, Math.round(hy * 0.28)), 'moon');
      else if (env.phase === 'day') body(sx, Math.max(14, Math.round(hy * 0.3)), 'sun');
      else body(Math.round(bw * (env.phase === 'dusk' ? 0.72 : 0.24)), hy - 40, 'low');
    }
    // clouds
    const cl = wet ? RAMP.storm : night ? ['#3a4a8a', '#2a3a7a', '#1e2c70', '#141e55', '#0a1030'] : env.phase === 'dusk' ? ['#ffe0c0', '#ffb890', '#f08aa4', '#c8486c', '#7a2a50'] : RAMP.cloud;
    const nC = wet ? 7 : 4;
    for (let i = 0; i < nC; i++) {
      const w0 = 14 + (i * 7) % 12, sp = 1.5 + (i % 3), cx = Math.round((((i * 97 + t * sp - camX * 0.1) % (bw + 60)) + bw + 60) % (bw + 60)) - 30, cy = Math.round(Math.max(8, hy * 0.15) + ((i * 37) % Math.max(8, hy * 0.5)));
      if (cy > hy - 10) continue;
      oval(g, cx, cy + 1, w0 + 1, 4, cl[4]); oval(g, cx, cy, w0, 3, cl[3]); oval(g, cx - 3, cy - 2, Math.round(w0 * 0.6), 3, cl[2]); oval(g, cx + 5, cy - 3, Math.round(w0 * 0.4), 2, cl[1]); rect(g, cx - Math.round(w0 * 0.4), cy - 4, Math.round(w0 * 0.3), 1, cl[0]);
    }
    // birds by day
    if (env.phase === 'day' && !wet) for (let i = 0; i < 3; i++) { const p = ((t * 9 + i * 140) % (bw + 200)) - 100, bx = Math.round(p), by = Math.round(hy * 0.35 + i * 9 + Math.sin(t * 2 + i) * 3), fl = Math.floor(t * 6 + i) % 2; if (bx < -4 || bx > bw + 4) continue; g.fillStyle = '#1a2a3a'; g.fillRect(bx - 2, by - fl, 2, 1); g.fillRect(bx, by, 1, 1); g.fillRect(bx + 1, by - fl, 2, 1); }
  }
  /** Far and mid jungle silhouettes, in screen space with parallax */
  function drawJungle(g, t, bw, hy, camX) {
    // far canopy: a rolling line of treetops
    const F = RAMP.far1, M = RAMP.far2;
    for (let x = 0; x < bw; x++) {
      const wx = x + Math.round(camX * 0.25), h = 26 + Math.round(6 * Math.sin(wx * 0.07) + 4 * Math.sin(wx * 0.19 + 1) + 3 * Math.sin(wx * 0.031));
      g.fillStyle = F[3]; g.fillRect(x, hy - h, 1, h + 1); g.fillStyle = F[2]; g.fillRect(x, hy - h, 1, 2); g.fillStyle = F[4]; g.fillRect(x, hy - h - 1, 1, 1);
    }
    // mid trees: crowns on trunks, every 46 px
    const off = Math.round(camX * 0.5), P = 46;
    for (let k = Math.floor((off - 30) / P); k * P - off < bw + 30; k++) {
      const cx = k * P - off + Math.round(hash(k, 3) * 20), top = hy - 30 - Math.round(hash(k, 5) * 18), rr = 8 + Math.round(hash(k, 7) * 5);
      rect(g, cx - 2, top, 4, hy - top, M[3]); rect(g, cx - 2, top, 1, hy - top, M[2]);
      disc(g, cx, top, rr + 1, M[4]); disc(g, cx, top, rr, M[3]); disc(g, cx - 2, top - 2, rr - 3, M[2]); disc(g, cx - 3, top - 3, Math.max(1, rr - 6), M[1]);
      disc(g, cx + rr - 2, top + 3, rr - 3, M[3]); disc(g, cx - rr + 2, top + 4, rr - 4, M[3]);
    }
  }

  /** Deep ground: below the yard the earth darkens toward the bottom of the view in dithered steps, with a few pebbles (world space, back layer) */
  function groundDepth(l, X0, X1, depth) {
    const E = RAMP.coco, top = FLOOR + 16, span = depth - top;
    if (span < 34) return;
    for (let k = Math.floor(X0 / 23); k * 23 < X1; k++) { const h = hash(k, 31); if (h < 0.55) continue; const px = k * 23 + Math.round(hash(k, 32) * 12), py = top + 3 + Math.round(hash(k, 33) * span * 0.25), pw = 2 + Math.round(h * 4); rect(l, px, py, pw, 1, E[1]); rect(l, px - 1, py + 1, pw + 2, 1, E[3]); }
    for (const [k, col] of [[0.38, E[3]], [0.78, E[4]]]) {
      const y0 = Math.round(top + span * k); l.fillStyle = col;
      for (let y = y0; y < y0 + 2; y++) for (let x = Math.floor(X0 / 2) * 2 + (y % 2); x < X1; x += 2) l.fillRect(x, y, 1, 1);
      l.fillRect(X0, y0 + 2, X1 - X0, depth - y0);
    }
  }
  /** Tall (portrait) views: the canopy hangs over the top of the screen, deepest at the corners, with vines; bushes crowd the bottom corners.
      Screen space, front layer. roofY = the building's top on screen: the canopy never reaches down to it. */
  function tallFrame(f, t, bw, bh, roofY) {
    const D = clamp(Math.round((roofY - 6) * 0.5), 0, Math.max(44, Math.round(bh * 0.16))), Lf = RAMP.leafD, mid = bw / 2;
    if (D >= 8) {
      const depthAt = x => Math.round(D * (0.3 + 0.7 * Math.pow(Math.min(1, Math.abs(x - mid) / mid), 1.6)));
      const cl = []; for (let x = -6, k = 0; x < bw + 10; x += 9, k++) { const r = 5 + Math.round(hash(k, 41) * 5); cl.push([x, depthAt(x) - r + SK.frame(t * 0.7 + hash(k, 42) * 4, 1, 2), r, k]); }
      for (const [x, cy, r] of cl) { rect(f, x - r - 1, -1, r * 2 + 3, cy + 1, Lf[4]); disc(f, x, cy, r + 1, Lf[4]); }
      for (const [x, cy, r] of cl) { rect(f, x - r, -1, r * 2 + 1, cy + 1, Lf[3]); disc(f, x, cy, r, Lf[3]); }
      for (const [x, cy, r, k] of cl) { disc(f, x - 1, cy - 1, r - 2, Lf[2]); if (r > 6) disc(f, x - 2, cy - 2, Math.floor(r / 3), Lf[1]); if (hash(k, 43) > 0.5) { rect(f, x + 2, cy + r, 2, 3, Lf[4]); dot(f, x + 2, cy + r, Lf[2]); } }
      for (let k = 0; k < 8; k++) {
        const side = k % 2 ? 1 : -1, x = Math.round(side < 0 ? 3 + hash(k, 44) * bw * 0.26 : bw - 4 - hash(k, 44) * bw * 0.26), y0 = depthAt(x) - 3, len = 10 + Math.round(hash(k, 45) * 28), sw = SK.frame(t * 1.1 + k, 1, 2);
        for (let y = 0; y < len; y++) dot(f, x + Math.round(Math.sin((y + k * 7) * 0.25)) + (y > len * 0.6 ? sw : 0), y0 + y, y % 5 === 0 ? RAMP.leaf[1] : RAMP.leaf[3]);
      }
    }
    for (const s of [-1, 1]) { const cx = s < 0 ? 3 : bw - 4; blob(f, cx + s * 14, bh + 3, 10, Lf); blob(f, cx, bh - 4, 13, Lf); blob(f, cx - s * 3, bh - 19, 7, Lf); }
  }

  /* ================= the building, stage by stage ================= */
  /* Each builder draws in world coordinates (ground y = 0) and returns anchors: { half, portraits: [[x, y], ...] } (y = top of a 24x24 frame).
     L is the list of lights (emissive rects drawn after the night tint): push [x, y, w, h, colour]. */
  const night = env => env.phase === 'night';
  const winLit = (env, i) => env.phase === 'night' || env.phase === 'dusk' || env.wx >= 2 || (env.phase === 'dawn' && i % 2 === 0);
  function windowBox(g, L, env, x, y, w, h, i, o = {}) {
    rect(g, x - 1, y - 1, w + 2, h + 2, o.frame || RAMP.woodD[4]);
    const lit = o.lit != null ? o.lit : winLit(env, i);
    rect(g, x, y, w, h, lit ? '#3a2410' : o.glass || '#1c2c48');
    if (lit) { L.push([x, y, w, h, o.glow || '#ffd890']); L.push([x, y + h - 2, w, 2, '#ffb84a']); }
    else { rect(g, x, y, Math.max(1, Math.floor(w / 3)), 1, '#5a7ab0'); dot(g, x + 1, y + 1, '#8cb0e0'); }
    if (o.cross !== false) { rect(g, x + Math.floor(w / 2), y, 1, h, o.frame || RAMP.woodD[3]); rect(g, x, y + Math.floor(h / 2), w, 1, o.frame || RAMP.woodD[3]); L.push([x + Math.floor(w / 2), y, 1, h, null]); }
  }
  function bambooWall(g, x0, x1, top, bottom) {
    const B = RAMP.bamboo;
    for (let x = x0, i = 0; x < x1; x += 4, i++) {
      rect(g, x, top, 4, bottom - top, B[4]); rect(g, x + 1, top, 2, bottom - top, i % 2 ? B[2] : B[1]); rect(g, x + 1, top, 1, bottom - top, B[0]);
      for (let y = top + 3 + (i % 3) * 3; y < bottom - 2; y += 9) { rect(g, x, y, 4, 1, B[3]); rect(g, x + 1, y + 1, 2, 1, B[0]); }
    }
  }
  function thatch(g, t, x0, x1, base, peak) {
    const S = RAMP.straw, h = base - peak, cx = (x0 + x1) / 2, half = (x1 - x0) / 2;
    for (let y = 0; y <= h; y++) {
      const k = y / h, w = Math.round(half * (1 - k * 0.92)), yy = base - y;
      rect(g, cx - w - 1, yy, w * 2 + 2, 1, S[4]);
      rect(g, cx - w, yy, w * 2, 1, y % 6 < 2 ? S[3] : y % 6 < 4 ? S[2] : S[1]);
      rect(g, cx - w, yy, 2, 1, S[1]);
    }
    for (let x = Math.round(x0); x < x1; x += 3) { const d = 1 + ((x * 7) % 3), sw = Math.floor(t * 1.4 + x * 0.3) % 2; rect(g, x + sw, base + 1, 2, d, S[3]); dot(g, x + sw, base + d, S[4]); }   // the ragged fringe
    rect(g, cx - 4, peak - 2, 9, 3, RAMP.woodD[4]); rect(g, cx - 3, peak - 1, 7, 1, RAMP.woodD[1]);
  }
  function plankWall(g, x0, x1, top, bottom, R, step = 5) {
    rect(g, x0 - 1, top - 1, x1 - x0 + 2, bottom - top + 1, R[4]);
    for (let y = top, i = 0; y < bottom; y += step, i++) { rect(g, x0, y, x1 - x0, step, i % 2 ? R[2] : R[1]); rect(g, x0, y + step - 1, x1 - x0, 1, R[3]); for (let x = x0 + ((i * 13) % 17) + 4; x < x1 - 2; x += 19) rect(g, x, y, 1, step - 1, R[3]); }
  }
  function lantern(g, L, t, x, y, env) {
    rect(g, x, y - 6, 1, 6, K.ink); rect(g, x - 2, y, 5, 6, K.ink); rect(g, x - 1, y + 1, 3, 4, night(env) || env.phase === 'dusk' ? '#ffe08a' : '#c8a060'); rect(g, x - 2, y - 1, 5, 1, RAMP.woodD[2]);
    if (night(env) || env.phase === 'dusk' || env.wx >= 2) { L.push([x - 1, y + 1, 3, 4, '#fff0b0']); L.push(['glow', x, y + 3, 9, Math.floor(t * 3) % 2 ? 0.22 : 0.18]); }
  }
  /** Stage 0: the clearing. Two great trees, ferns, a log. */
  function stClearing(g, t, env, L) {
    bigTree(g, t, -84, -96, 11); bigTree(g, t, 88, -104, 23);
    palm(g, t, -46, 44, -0.6, 2); palm(g, t, 52, 50, 0.7, 5);
    bush(g, -64, 0, 6, RAMP.leafD); bush(g, 66, 0, 7, RAMP.leafD); bush(g, -30, 0, 4); bush(g, 34, 0, 5);
    // a fallen log
    box(g, 18, -5, 18, 5, RAMP.woodD); rect(g, 35, -5, 2, 5, RAMP.woodL[2]); dot(g, 36, -3, RAMP.woodL[3]);
    return { half: 40, portraits: [[-96, -64], [76, -66], [-96, -36]], roof: -40 };
  }
  /** Stage 1: the bamboo hut with a thatched roof */
  function stHut(g, t, env, L) {
    const W = 44;
    bigTree(g, t, -94, -100, 11); palm(g, t, 62, 54, 0.6, 5);
    rect(g, -W - 3, -3, W * 2 + 6, 3, RAMP.woodD[4]); rect(g, -W - 2, -3, W * 2 + 4, 2, RAMP.woodD[1]);   // the floor beam
    bambooWall(g, -W, W, -52, -3);
    windowBox(g, L, env, -32, -44, 14, 10, 0, { frame: RAMP.bamboo[4] }); windowBox(g, L, env, 18, -44, 14, 10, 1, { frame: RAMP.bamboo[4] });
    // the door: a dark opening with a half-rolled mat
    rect(g, -7, -36, 14, 33, RAMP.woodD[4]); rect(g, -6, -35, 12, 32, '#2a1608'); for (let y = -35; y < -26; y += 2) rect(g, -6, y, 12, 1, RAMP.straw[y % 4 ? 2 : 3]); rect(g, -7, -27, 14, 3, RAMP.straw[3]);
    if (winLit(env, 2)) L.push([-6, -24, 12, 21, '#ffc870']);
    thatch(g, t, -W - 12, W + 12, -50, -86);
    lantern(g, L, t, W + 6, -46, env);
    return { half: W, portraits: [[-104, -66], [-104, -38], [W + 30, -70]], roof: -86 };
  }
  /** Stage 2: the lagoon boathouse on stilts (the ground here is a dock over water) */
  function stBoathouse(g, t, env, L) {
    const W = 56, R = [ '#bfe0ff', '#7aa8d8', '#4a78b0', '#2c4a78', '#14223c' ], Wd = RAMP.wood;
    palm(g, t, -W - 26, 58, -0.6, 2); palm(g, t, W + 30, 50, 0.8, 7);
    plankWall(g, -W, W, -56, -2, Wd, 5);
    // blue-painted trim and the big boat door
    rect(g, -W - 1, -58, W * 2 + 2, 3, R[4]); rect(g, -W, -57, W * 2, 1, R[1]);
    rect(g, -15, -40, 30, 38, R[4]); rect(g, -14, -39, 28, 37, '#10202e'); for (let i = 0; i < 4; i++) rect(g, -14, -39 + i * 2, 28, 1, i % 2 ? R[3] : R[2]);
    rect(g, -14, -35, 28, 2, R[3]);
    if (winLit(env, 3)) L.push([-12, -30, 24, 26, '#ffc870']);
    windowBox(g, L, env, -44, -46, 14, 11, 0, { frame: R[4] }); windowBox(g, L, env, 30, -46, 14, 11, 1, { frame: R[4] });
    // a life ring
    disc(g, 30 + 7, -24, 5, K.ink); disc(g, 37, -24, 4, '#e8402a'); rect(g, 33, -25, 9, 2, '#fff6d6'); rect(g, 36, -28, 2, 9, '#fff6d6'); disc(g, 37, -24, 1, Wd[2]);
    // the gable roof: slate-blue shingles
    for (let y = 0; y <= 26; y++) { const w = Math.round((W + 10) * (1 - y / 30)); rect(g, -w - 1, -58 - y, w * 2 + 2, 1, R[4]); rect(g, -w, -58 - y, w * 2, 1, y % 4 < 2 ? R[2] : R[3]); if (y % 4 === 0) for (let x = -w + (y % 8 ? 2 : 5); x < w; x += 6) dot(g, x, -58 - y, R[4]); }
    rect(g, -W - 11, -58, W * 2 + 22, 2, R[4]);
    lantern(g, L, t, -W - 4, -50, env); lantern(g, L, t, W + 4, -50, env);
    return { half: W, portraits: [[-46, -86, 'stand'], [-12, -98, 'stand'], [22, -86, 'stand']], roof: -84, water: true };
  }
  /** Stage 3: the hive, a two-storey honey-coloured office with honeycomb windows, and bees */
  function hex(g, L, env, x, y, i) {
    const lit = winLit(env, i), rows = [[2, 5], [1, 7], [0, 9], [0, 9], [1, 7], [2, 5]];
    rows.forEach(([dx, w], r) => rect(g, x + dx - 1, y + r - 1, w + 2, 1, '#5a3a06'));
    rows.forEach(([dx, w], r) => { rect(g, x + dx - 1, y + r, w + 2, 1, '#5a3a06'); });
    rect(g, x + 1, y + 6, 7, 1, '#5a3a06');
    rows.forEach(([dx, w], r) => rect(g, x + dx, y + r, w, 1, lit ? '#3a2410' : r < 2 ? '#5a7ab0' : '#1c2c48'));
    if (lit) rows.forEach(([dx, w], r) => L.push([x + dx, y + r, w, 1, r > 3 ? '#ffb84a' : '#ffe08a']));
  }
  function stHive(g, t, env, L) {
    const W = 64, A = RAMP.banY, H = ['#ffe9a8', '#f2c260', '#d8a040', '#a8681a', '#5a3a06'];
    bigTree(g, t, -W - 34, -110, 11); palm(g, t, W + 26, 60, 0.6, 7);
    // ground floor, first floor, a flat roof with a rim
    plankWall(g, -W, W, -46, -2, H, 6);
    plankWall(g, -W + 6, W - 6, -94, -46, H, 6);
    rect(g, -W - 3, -48, W * 2 + 6, 3, '#5a3a06'); rect(g, -W - 2, -48, W * 2 + 4, 1, A[1]);
    rect(g, -W + 3, -98, W * 2 - 6, 4, '#5a3a06'); rect(g, -W + 4, -97, W * 2 - 8, 1, A[1]);
    let i = 0;
    for (let x = -W + 12; x < W - 18; x += 15) hex(g, L, env, x, -84, i++), hex(g, L, env, x + 7, -72 + 2, i++);
    for (let x = -W + 6; x < W - 10; x += 22) if (Math.abs(x + 4) > 14) hex(g, L, env, x, -38, i++);
    // the door with a striped awning
    rect(g, -9, -32, 18, 30, '#5a3a06'); rect(g, -8, -31, 16, 29, '#3a2410'); if (winLit(env, 5)) L.push([-7, -28, 14, 26, '#ffc870']);
    for (let k = 0; k < 7; k++) rect(g, -12 + k * 3 + (k ? 0 : 0), -37, 3, 5, k % 2 ? '#fff6d6' : '#d8a040'); rect(g, -13, -38, 23, 1, '#5a3a06');
    // a big IMI on the roof rim, and the bees
    SK.text(g, 'IMI', 0, -108, A[2], { align: 'center', s: 2, shadow: '#5a3a06' });
    for (let b = 0; b < 6; b++) { const bx = Math.round(Math.sin(t * (1.3 + b * 0.2) + b * 2) * (W + 8)), by = Math.round(-60 + Math.cos(t * (1.7 + b * 0.3) + b) * 34), wf = Math.floor(t * 12 + b) % 2; dot(g, bx, by, '#1a0f14'); dot(g, bx + 1, by, '#ffd23a'); dot(g, bx + 2, by, '#1a0f14'); dot(g, bx + wf, by - 1, '#e4f6ff'); }
    return { half: W, portraits: [[-W + 10, -92], [-12, -92], [W - 34, -92]], roof: -112 };
  }
  /** Stage 4: the grand hall. Stone columns, a pediment, red curtains in the doorway, a red carpet. (The doorman is drawn with the crew.) */
  function stHall(g, t, env, L) {
    const W = 84, S = RAMP.stone, Rd = RAMP.red;
    palm(g, t, -W - 22, 64, -0.5, 2); palm(g, t, W + 24, 60, 0.6, 7);
    rect(g, -W - 4, -6, W * 2 + 8, 6, S[4]); rect(g, -W - 3, -6, W * 2 + 6, 2, S[1]); rect(g, -W - 3, -4, W * 2 + 6, 3, S[2]);   // the steps
    plankWall(g, -W + 2, W - 2, -78, -6, S, 8);
    // the doorway with curtains (its top stays under the portrait row, which hangs below the pediment's lettering)
    const DT = -50, DH = DT + 6;
    rect(g, -17, DT, 34, -DH, S[4]); rect(g, -16, DT + 1, 32, -DH - 1, '#2a0e10');
    if (winLit(env, 4)) L.push([-12, DT + 6, 24, -DT - 12, '#ffc870']);
    for (const s of [-1, 1]) for (let y = 0; y < -DH - 1; y++) { const w = 6 + Math.round(Math.pow(y / (-DH - 1), 2) * 8); const x = s < 0 ? -16 : 16 - w; rect(g, x, DT + 1 + y, w, 1, Rd[2]); rect(g, s < 0 ? x + w - 1 : x, DT + 1 + y, 1, 1, Rd[3]); rect(g, s < 0 ? x + 2 : x + w - 3, DT + 1 + y, 1, 1, Rd[1]); }
    rect(g, -17, DT, 34, 4, Rd[3]); for (let x = -16; x < 16; x += 4) rect(g, x, DT + 4, 2, 2, K.banana);
    // columns
    for (const cx of [-W + 10, -W + 34, W - 38, W - 14]) { rect(g, cx - 1, -76, 10, 70, S[4]); rect(g, cx, -75, 8, 69, S[2]); rect(g, cx + 1, -75, 2, 69, S[0]); rect(g, cx + 5, -75, 1, 69, S[3]); rect(g, cx - 2, -79, 12, 4, S[1]); rect(g, cx - 2, -9, 12, 3, S[1]); }
    // windows between the columns
    windowBox(g, L, env, -W + 21, -60, 9, 16, 0, { frame: S[4] }); windowBox(g, L, env, W - 26, -60, 9, 16, 1, { frame: S[4] });
    // entablature and pediment
    rect(g, -W - 4, -86, W * 2 + 8, 8, S[4]); rect(g, -W - 3, -85, W * 2 + 6, 6, S[1]); rect(g, -W - 3, -80, W * 2 + 6, 1, S[3]);
    SK.text(g, 'INFINITE MONKEY INDUSTRIES', 0, -84, '#5a3a06', { align: 'center' });
    for (let y = 0; y < 24; y++) { const w = Math.round((W + 4) * (1 - y / 24)); rect(g, -w - 1, -87 - y, w * 2 + 2, 1, S[4]); rect(g, -w, -87 - y, w * 2, 1, y < 2 ? S[1] : S[2]); }
    disc(g, 0, -96, 5, S[4]); disc(g, 0, -96, 4, K.banana); disc(g, -1, -97, 2, RAMP.banY[1]);
    // the red carpet down the steps
    rect(g, -9, -6, 18, 6, Rd[3]); rect(g, -8, -6, 16, 6, Rd[2]); rect(g, -8, -6, 16, 1, Rd[1]);
    return { half: W, portraits: [[-39, -75], [-12, -75], [15, -75]], roof: -112, carpet: true };   // between the inner columns, nails clear of the lettering
  }
  /** Stage 5: the IMI tower, art-deco setbacks, a spire and the moonflower crest. o.lit (0..1) lights floors from the bottom up. */
  function stTower(g, t, env, L, o) {
    const S = ['#c8d0e8', '#8a94b8', '#5a6488', '#3a4060', '#1a1e30'], lit = o.towerLit != null ? o.towerLit : null;
    palm(g, t, -96, 64, -0.5, 2); palm(g, t, 98, 60, 0.6, 7);
    const tiers = [[-80, 80, -56, -2], [-50, 50, -150, -56], [-36, 36, -214, -150], [-22, 22, -250, -214]];
    let floor = 0; const floors = 3 + 11 + 7 + 3;
    tiers.forEach(([x0, x1, top, bot], ti) => {
      rect(g, x0 - 1, top - 1, x1 - x0 + 2, bot - top + 1, S[4]); rect(g, x0, top, x1 - x0, bot - top, S[2]); rect(g, x0, top, 2, bot - top, S[1]); rect(g, x1 - 3, top, 3, bot - top, S[3]);
      rect(g, x0 - 2, top - 2, x1 - x0 + 4, 3, S[4]); rect(g, x0 - 1, top - 1, x1 - x0 + 2, 1, S[0]);
      for (let x = x0 + 9; x < x1 - 6; x += 12) rect(g, x, top + 2, 1, bot - top - 4, S[3]);   // pilasters
      for (let y = bot - 9; y > top + 3; y -= 8, floor++) {
        const on = lit != null ? floor / floors < lit : winLit(env, floor) && hash(floor, 9) > 0.1;
        for (let x = x0 + 4; x < x1 - 5; x += 6) {
          if (ti === 0 && Math.abs(x + 1) < 17) continue;
          if (ti === 2 && y > -208 && y < -186 && Math.abs(x + 1) < 16) continue;
          if ((x - x0 - 9) % 12 === 0) continue;
          const wOn = on && hash(floor * 31 + x, 4) > 0.38;
          rect(g, x, y, 3, 4, wOn ? '#3a2410' : '#28304a'); if (wOn) L.push([x, y, 3, 4, hash(x, floor) > 0.5 ? '#ffe08a' : '#ffc870']); else dot(g, x, y, '#5a6ab0');
        }
      }
    });
    // the lobby door and the spire
    rect(g, -15, -36, 30, 34, S[4]); rect(g, -14, -35, 28, 33, '#2a1e30'); for (let x = -14; x < 14; x += 7) rect(g, x, -35, 1, 33, S[3]);
    if (winLit(env, 1) || lit) L.push([-13, -34, 26, 31, '#ffd890']);
    rect(g, -2, -278, 4, 28, S[4]); rect(g, -1, -278, 2, 28, S[1]); dot(g, 0, -280, '#ff5d5d'); if (Math.floor(t * 1.5) % 2) L.push([0, -280, 1, 1, '#ff5d5d']);
    disc(g, 0, -232, 8, S[4]); disc(g, 0, -232, 7, '#dfe3f2'); for (let k = 0; k < 6; k++) { const a = (k / 6) * TAU; disc(g, Math.round(Math.cos(a) * 4), -232 + Math.round(Math.sin(a) * 4), 2, '#ffffff'); } disc(g, 0, -232, 2, K.banana);
    if (night(env) || lit) L.push(['glow', 0, -232, 16, 0.25]);
    SK.text(g, 'IMI', 0, -200, K.banana, { align: 'center', s: 2, shadow: S[4] });
    if (night(env) || lit) L.push(['text', 'IMI', 0, -200, 2]);
    return { half: 80, portraits: [[-46, -96], [-12, -100], [22, -96]], roof: -280 };
  }
  const STAGE_FN = [stClearing, stHut, stBoathouse, stHive, stHall, stTower];

  /* ---------- muse portraits: the 34x39 MuseArt frames, cropped to the face and hung in a gold frame ---------- */
  const museImgs = {};
  function museImage(id) {
    if (museImgs[id] !== undefined) return museImgs[id];
    museImgs[id] = null;
    try {
      const html = G.MuseArt && G.MuseArt.has(id) ? G.MuseArt.html(id) : '', m = /url\(["']?([^"')]+)["']?\)/.exec(html);
      if (m) { const im = new Image(); im.onload = () => { museImgs[id] = im; }; im.src = m[1]; }
    } catch { /* no muse art: an empty frame */ }
    return null;
  }
  SK.museImage = museImage;
  /** A muse portrait: 24x24 gold frame with the muse's face (animated through the six MuseArt frames) */
  SK.portraitFrame = function (g, t, id, x, y) {
    x = Math.round(x); y = Math.round(y); const G2 = RAMP.gold;
    rect(g, x - 1, y - 1, 26, 26, K.ink); rect(g, x, y, 24, 24, G2[2]); rect(g, x, y, 24, 1, G2[1]); rect(g, x, y, 1, 24, G2[1]); rect(g, x + 23, y, 1, 24, G2[3]); rect(g, x, y + 23, 24, 1, G2[3]);
    rect(g, x + 2, y + 2, 20, 20, '#2a1e30');
    const im = museImage(id);
    if (im) { const f = SK.frame(t, 3, 6); g.drawImage(im, f * 34 + 7, 4, 20, 20, x + 2, y + 2, 20, 20); }
    rect(g, x + 10, y - 4, 4, 3, K.ink); dot(g, x + 11, y - 3, G2[1]);   // the nail and wire
  };
  /** The printing plaque on a stone plinth: n = how many printings are done */
  const ordinal = n => n + (n % 100 >= 11 && n % 100 <= 13 ? 'TH' : ['TH', 'ST', 'ND', 'RD'][n % 10] || 'TH');
  SK.plaque = function (g, x, y, n) {
    const top = ordinal(n + 1), w = SK.textW('PRINTING') + 8, x0 = Math.round(x - w / 2), S = RAMP.stone, G2 = RAMP.gold;
    box(g, x0 + 2, y - 7, w - 4, 7, S); rect(g, x0 + 4, y - 5, w - 8, 1, S[3]);
    rect(g, x0 - 1, y - 24, w + 2, 18, K.ink); rect(g, x0, y - 23, w, 16, G2[2]); rect(g, x0, y - 23, w, 1, G2[1]); rect(g, x0, y - 23, 1, 16, G2[1]); rect(g, x0, y - 8, w, 1, G2[3]); rect(g, x0 + w - 1, y - 22, 1, 15, G2[3]);
    SK.text(g, top, x0 + Math.floor((w - SK.textW(top)) / 2), y - 20, '#5a3a06'); SK.text(g, 'PRINTING', x0 + 4, y - 14, '#5a3a06');
    dot(g, x0 + 1, y - 22, G2[0]); dot(g, x0 + w - 2, y - 22, G2[0]);
  };
  /** The studios' signpost: one arrow board per studio, stacked on a pole */
  SK.signpost = function (g, t, x, ids) {
    if (!ids.length) return;
    const h = 22 + ids.length * 16, W = RAMP.woodD;
    rect(g, x - 2, -h - 2, 5, h + 2, W[4]); rect(g, x - 1, -h - 2, 3, h + 2, W[2]); rect(g, x - 1, -h - 2, 1, h + 2, W[1]); rect(g, x - 2, -h - 3, 5, 1, W[1]);
    ids.forEach((id, i) => {
      const S = STUDIO[id] || { name: id, sign: id, bg: K.leaf, fg: K.cream }, dir = i % 2 ? -1 : 1, wob = Math.floor(t * 0.9 + i * 1.3) % 3 === 0 ? 1 : 0, y = -h + i * 16 + wob;
      const label = S.sign || S.name, w = Math.max(...label.split('\n').map(l => SK.textW(l))) + 6;
      SK.board(g, x - Math.floor(w / 2) + dir * 3, y, label, S.bg, S.fg, { dir, trim: S.trim });
      dot(g, x, y + 2, RAMP.metal[2]);
    });
  };

  /* ================= typewriters and desks ================= */
  /** A typewriter in desk `desk`'s colour, its feet on y, centred on x. key: which key is down (-1 none). o: { paper: 0..1 how full, col: carriage 0..1, mk } */
  SK.typewriter = function (g, desk, x, y, key = -1, o = {}) {
    x = Math.round(x) - 11; y = Math.round(y);
    const C = (DESK[desk] || DESK[0]).c, I = RAMP.ink, cr = Math.round((o.col || 0) * 4), paper = o.paper == null ? 0.5 : o.paper;
    // paper behind the platen
    const ph = 3 + Math.round(paper * 5), px = x + 6 - cr;
    rect(g, px - 1, y - 12 - ph, 12, ph + 2, RAMP.paper[4]); rect(g, px, y - 11 - ph, 10, ph + 1, RAMP.paper[1]); rect(g, px + 9, y - 11 - ph, 1, ph + 1, RAMP.paper[2]);
    for (let i = 0; i < ph - 2; i += 2) rect(g, px + 1, y - 10 - ph + i, 6 + ((i * 5) % 3), 1, '#5a4a7a');
    // the platen (roller) and its knobs
    rect(g, x + 2 - cr, y - 13, 18, 4, I[4]); rect(g, x + 3 - cr, y - 12, 16, 2, I[1]); rect(g, x + 3 - cr, y - 12, 16, 1, I[0]);
    rect(g, x - cr, y - 13, 3, 4, K.ink); rect(g, x + 1 - cr, y - 12, 1, 2, RAMP.banY[2]); rect(g, x + 19 - cr, y - 13, 3, 4, K.ink); rect(g, x + 20 - cr, y - 12, 1, 2, RAMP.banY[2]);
    // the carriage return lever
    rect(g, x - 1 - cr, y - 15, 4, 1, RAMP.metal[3]); dot(g, x - 2 - cr, y - 16, RAMP.metal[2]);
    // the body: a cast-iron wedge with the machine's colour band
    rect(g, x, y - 10, 22, 10, K.ink); rect(g, x + 1, y - 9, 20, 8, I[1]); rect(g, x + 1, y - 9, 20, 1, I[0]);
    rect(g, x + 1, y - 7, 20, 2, C[1]); rect(g, x + 1, y - 7, 20, 1, C[2]); rect(g, x + 1, y - 5, 20, 1, C[0]);
    if (o.mk >= 1) { rect(g, x + 1, y - 4, 20, 1, RAMP.banY[2]); }
    // two rows of ivory keys on the front, one of them pressed
    for (let r = 0; r < 2; r++) for (let i = 0; i < 6; i++) {
      const kx = x + 2 + i * 3 + r, ky = y - 4 + r * 2, down = key >= 0 && (key % 12) === r * 6 + i;
      rect(g, kx, ky + (down ? 1 : 0), 2, 1, down ? '#ffffff' : RAMP.paper[1]); if (!down) dot(g, kx + 1, ky, RAMP.paper[3]);
    }
    rect(g, x + 1, y - 1, 20, 1, I[3]); rect(g, x - 1, y, 24, 1, K.ink);
    // the typebar that just struck
    if (key >= 0) { rect(g, x + 10 - cr + (key % 3), y - 14, 1, 3, RAMP.metal[2]); }
  };
  /** A desk for a typewriter: 'crate' (the first one) or 'desk'. Top surface at y - h; returns the top y. */
  SK.desk = function (g, x, y, kind = 'desk', o = {}) {
    x = Math.round(x); y = Math.round(y);
    if (kind === 'crate') {
      const W = RAMP.wood, w = 28, h = 13, x0 = x - 14;
      rect(g, x0 - 1, y - h - 1, w + 2, h + 1, W[4]);
      for (let i = 0; i < 3; i++) { rect(g, x0, y - h + i * 4 + (i ? 1 : 0), w, 4, i % 2 ? W[2] : W[1]); rect(g, x0, y - h + i * 4 + 4, w, 1, W[3]); }
      rect(g, x0, y - h, 3, h, W[3]); rect(g, x0 + w - 3, y - h, 3, h, W[3]); rect(g, x0 + 1, y - h, 1, h, W[1]);
      for (let k = 0; k < w - 6; k++) dot(g, x0 + 3 + k, y - 2 - Math.round((k * (h - 4)) / (w - 6)), W[3]);   // the brace
      if (o.label !== false) { rect(g, x0 + 16, y - 8, 7, 5, W[2]); SK.banana(g, x0 + 16, y - 7); }
      return y - h;
    }
    const W = RAMP.woodL, D = RAMP.woodD, w = 30, x0 = x - 15;
    rect(g, x0 - 1, y - 12, w + 2, 4, K.ink); rect(g, x0, y - 11, w, 2, W[1]); rect(g, x0, y - 9, w, 1, W[3]);
    rect(g, x0 + 2, y - 8, 3, 8, D[4]); rect(g, x0 + w - 5, y - 8, 3, 8, D[4]); rect(g, x0 + 3, y - 8, 1, 8, D[1]); rect(g, x0 + w - 4, y - 8, 1, 8, D[1]);
    rect(g, x0 + 6, y - 8, w - 12, 5, D[4]); rect(g, x0 + 7, y - 8, w - 14, 4, D[2]); dot(g, x, y - 6, RAMP.banY[2]);
    return y - 11;
  };

  /* ================= actors: CrewArt monkeys at art resolution ================= */
  /* Story poses, added to CrewArt.POSES (st_*). armL/armR/legL/legR are paw and foot positions from the body centre (y up is negative). */
  const ST_POSES = {
    st_type_a: { sx: 1, sy: 0.97, y: 1, expr: 'determined', armL: [-9, 3], armR: [10, 9], legL: [-6, 17], legR: [6, 17], headY: 1 },
    st_type_b: { sx: 1, sy: 0.97, y: 1, expr: 'determined', armL: [-10, 9], armR: [9, 3], legL: [-6, 17], legR: [6, 17], headY: 0 },
    st_walk_a: { sx: 1, sy: 1, y: 0, expr: 'determined', armL: [-12, 4], armR: [11, 10], legL: [-8, 15], legR: [5, 18] },
    st_walk_b: { sx: 1, sy: 1, y: -1, expr: 'determined', armL: [-11, 10], armR: [12, 4], legL: [-5, 18], legR: [8, 15] },
    st_wave_a: { sx: 1, sy: 1, y: 0, expr: 'giggle', armL: [-11, 8], armR: [14, -13], legL: [-6, 17], legR: [6, 17] },
    st_wave_b: { sx: 1, sy: 1, y: 0, expr: 'giggle', armL: [-11, 8], armR: [17, -8], legL: [-6, 17], legR: [6, 17] },
    st_offer: { sx: 1, sy: 1, y: 0, expr: 'giggle', armL: [-11, 8], armR: [17, 1], legL: [-6, 17], legR: [6, 17] },
    st_sit: { sx: 1.06, sy: 0.9, y: 4, expr: 'determined', armL: [-12, 7], armR: [12, 7], legL: [-9, 12], legR: [9, 12], headY: 1 },
    st_crack_a: { sx: 1, sy: 1, y: 0, expr: 'determined', armL: [-3, 3], armR: [3, 3], legL: [-6, 17], legR: [6, 17] },
    st_crack_b: { sx: 1.04, sy: 0.96, y: 1, expr: 'giggle', armL: [-7, 0], armR: [7, 0], legL: [-6, 17], legR: [6, 17] },
    st_cheer: { sx: 0.94, sy: 1.08, y: -2, expr: 'giggle', armL: [-14, -13], armR: [14, -13], legL: [-6, 18], legR: [6, 18] },
    st_point: { sx: 1, sy: 1, y: 0, expr: 'determined', armL: [-11, 8], armR: [18, -5], legL: [-6, 17], legR: [6, 17] },
    st_think: { sx: 1, sy: 1, y: 0, expr: 'determined', armL: [-11, 8], armR: [3, -1], legL: [-6, 17], legR: [6, 17], headY: 1 },
    st_hold: { sx: 1, sy: 1, y: 0, expr: 'giggle', armL: [-8, -15], armR: [8, -15], legL: [-8, 17], legR: [8, 17] },
    st_carry: { sx: 1, sy: 1, y: 0, expr: 'giggle', armL: [-7, 2], armR: [7, 2], legL: [-6, 17], legR: [6, 17] },
    st_shrug: { sx: 1.04, sy: 0.97, y: 1, expr: 'giggle', armL: [-15, -2], armR: [15, -2], legL: [-6, 17], legR: [6, 17] },
    st_gasp: { sx: 0.96, sy: 1.05, y: -1, expr: 'screech', armL: [-6, -7], armR: [6, -7], legL: [-6, 18], legR: [6, 18] },
    st_read: { sx: 1, sy: 1, y: 0, expr: 'determined', armL: [-6, -1], armR: [6, -1], legL: [-6, 17], legR: [6, 17], headY: 1 },
    st_peek: { sx: 1, sy: 1, y: 0, expr: 'inspect', armL: [-12, 2], armR: [11, 8], legL: [-6, 17], legR: [6, 17] },
  };
  SK.POSES = ST_POSES;
  function ensurePoses() { const CA = G.CrewArt; if (CA && CA.POSES && !CA.POSES.st_type_a) Object.assign(CA.POSES, ST_POSES); }
  const frames = new Map();
  /** The 64x64 frame of a monkey: look (v01..v30), pose (CrewArt.POSES name), o: { expr, hat, prop: 'banana'|'crown', flip } */
  SK.monkey = function (look, pose = 'idle', o = {}) {
    const CA = G.CrewArt; if (!CA) return null; ensurePoses();
    const P = CA.POSES[pose] || CA.POSES.idle, expr = o.expr || P.expr, hat = o.hat || 0, key = look + '|' + pose + '|' + expr + '|' + hat + '|' + (o.prop || '') + '|' + (o.flip ? 1 : 0);
    let cv = frames.get(key);
    if (!cv) {
      cv = CA.renderCustomMonkey64(look, 'stomp', { x: 32, y: 34 + (P.y || 0), facing: o.flip ? -1 : 1, squashX: P.sx, squashY: P.sy, headY: P.headY || 0, expr, armL: P.armL, armR: P.armR, legL: P.legL, legR: P.legR, squatImpact: !!P.impact, hat, prop: o.prop || null });
      if (frames.size > 600) frames.clear();
      frames.set(key, cv);
    }
    return cv;
  };
  const sils = new Map();
  function silhouette(cv, col) {
    const key = cv; let s = sils.get(key); if (s && s.col === col) return s.cv;
    const c = document.createElement('canvas'); c.width = cv.width; c.height = cv.height; const g = c.getContext('2d'); g.drawImage(cv, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = col; g.fillRect(0, 0, c.width, c.height);
    sils.set(key, { cv: c, col }); return c;
  }
  /** Draw a monkey with its feet at (x, feet). o: { expr, hat, prop, flip, s (whole-number scale), sil (a flat colour: a silhouette), eyes (with sil: glowing eyes), clip: [x0, y0, x1, y1] world clip } */
  SK.actor = function (g, look, pose, x, feet, o = {}) {
    const cv = SK.monkey(look, pose, o); if (!cv) return;
    const s = Math.max(1, Math.round(o.s || 1)), img = o.sil ? silhouette(cv, o.sil) : cv;
    const dx = Math.round(x) - 32 * s, dy = Math.round(feet) - 56 * s;
    g.save(); g.imageSmoothingEnabled = false;
    if (o.clip) { g.beginPath(); g.rect(o.clip[0], o.clip[1], o.clip[2] - o.clip[0], o.clip[3] - o.clip[1]); g.clip(); }
    g.drawImage(img, dx, dy, 64 * s, 64 * s);
    if (o.sil && o.eyes) { rect(g, dx + 27 * s, dy + 27 * s + (o.headY || 0), 2 * s, 2 * s, '#fff6d6'); rect(g, dx + 34 * s, dy + 27 * s, 2 * s, 2 * s, '#fff6d6'); }
    g.restore();
  };
  /** A soft ground shadow under an actor (flat, two-tone, no blur) */
  SK.shadow = function (g, x, y, w = 12) { oval(g, x, y, w, 2, 'rgba(26,15,20,.35)'); };
  /** Where a walking actor is: from x0 to x1 over [t0, t1], with a two-frame walk cycle and a little bob. Returns { x, pose, bob, flip, moving } */
  SK.walk = function (t, t0, t1, x0, x1, o = {}) {
    const k = seg(t, t0, t1), x = lerp(x0, x1, (o.ease ? ease[o.ease] : ease.linear)(k)), moving = t > t0 && t < t1, f = SK.frame(t - t0, o.fps || 7, 2);
    return { x, pose: moving ? (f ? 'st_walk_a' : 'st_walk_b') : o.end || 'idle', bob: moving ? -f : 0, flip: x1 < x0, moving };
  };

  /* ================= the living crew ================= */
  /** Where each owned machine's desk stands: one row in front of the building, or, if the view is narrow, two rows: the back row up on a
      riser (SK.RISE px) and offset half a desk, so its faces show between the front row's heads. Returns [{ i, x, y, row }] (row 0 = back). */
  const RISE = (SK.RISE = 14);
  SK.crewLayout = function (n, viewW) {
    n = clamp(n | 0, 1, 6); const GAP = 32, out = [];
    if (!(viewW && viewW < n * GAP + 20 && n > 2)) { for (let i = 0; i < n; i++) out.push({ i, x: Math.round((i - (n - 1) / 2) * GAP), y: FLOOR, row: 0 }); return out; }
    const front = Math.ceil(n / 2), back = n - front, shift = (front - back) % 2 === 0 ? GAP / 4 : 0;
    for (let j = 0; j < back; j++) out.push({ i: j, x: Math.round((j - (back - 1) / 2) * GAP + shift), y: FLOOR - RISE, row: 0 });
    for (let j = 0; j < front; j++) out.push({ i: back + j, x: Math.round((j - (front - 1) / 2) * GAP - shift), y: FLOOR, row: 1 });
    return out;
  };
  /** The plank riser under a back row of desks (pos from SK.crewLayout); draws nothing for a single row */
  SK.riser = function (g, pos) {
    const back = pos.filter(p => p.y < FLOOR); if (!back.length) return;
    const x0 = Math.min(...back.map(p => p.x)) - 18, x1 = Math.max(...back.map(p => p.x)) + 18, y = back[0].y, W = RAMP.wood;
    rect(g, x0 - 1, y - 1, x1 - x0 + 2, FLOOR - y + 1, W[4]); rect(g, x0, y, x1 - x0, 2, W[1]); rect(g, x0, y + 2, x1 - x0, FLOOR - y - 2, W[2]);
    for (let yy = y + 5; yy < FLOOR - 1; yy += 4) rect(g, x0, yy, x1 - x0, 1, W[3]);
    for (let x = x0 + 6; x < x1 - 2; x += 14) rect(g, x, y + 2, 1, FLOOR - y - 2, W[3]);
  };
  /** The crew at work: every owned machine's lead typist typing at a desk, with the occasional hop. world.crew[i] = { look, hat } or null. */
  function drawCrew(g, t, w, view, o) {
    const n = clamp(w.desks || 1, 1, 6), pos = SK.crewLayout(n, view && view.w), crew = w.crew || [];
    const order = pos.slice().sort((a, b) => a.y - b.y);
    SK.riser(g, pos);
    for (const p of order) {
      const i = p.i, look = (i === 0 ? w.founder : crew[i]) || crew[i] || { look: i === 0 ? 'v01' : ['v07', 'v13', 'v19', 'v25', 'v28'][(i - 1) % 5], hat: 0 };
      const speed = 5 + ((i * 3) % 4), beat = SK.frame(t + i * 0.37, speed), cycle = (t + i * 2.3) % 9, hopK = seg(cycle, 7.6, 8.3);
      let pose = beat % 2 ? 'st_type_a' : 'st_type_b', dy = 0, key = beat % 12;
      if (hopK > 0 && hopK < 1) { pose = hopK < 0.15 ? 'crouch' : 'air'; dy = Math.round(SK.hop((hopK - 0.15) / 0.85, 9)); key = -1; }
      else if (cycle > 8.3 && cycle < 8.55) { pose = 'impact'; key = -1; }
      if (o && o.still) { pose = 'idle'; key = -1; dy = 0; }
      const kind = w.stage === 0 && i === 0 ? 'crate' : 'desk', top = kind === 'crate' ? 13 : 11;
      SK.shadow(g, p.x, p.y + 1, 14);
      SK.actor(g, look.look, pose, p.x, p.y - top + 4 + dy, { hat: look.hat });
      const dt = SK.desk(g, p.x, p.y, kind);
      SK.typewriter(g, i, p.x, dt, key, { paper: ((t * 0.12 + i * 0.3) % 1), col: (beat % 20) / 20, mk: 0 });
    }
    return pos;
  }
  SK.drawCrew = drawCrew;

  /* ================= the whole world ================= */
  const layers = new Map();
  function layerFor(w, h, tag = '') { const k = w + 'x' + h + tag; let c = layers.get(k); if (!c) { if (layers.size > 8) layers.clear(); c = document.createElement('canvas'); c.width = w; c.height = h; layers.set(k, c); } return c; }
  /** The sky right now: { phase, wx } from World (world.js), or day when there is no clock */
  SK.skyNow = function () { try { const a = G.World && G.World.at(Date.now()); if (a) return { phase: a.phase, wx: a.wx }; } catch { /* no clock */ } return { phase: 'day', wx: 0 }; };
  /** Normalise a world facts object (fills defaults). See KIT-API.md for the fields. */
  SK.worldOf = function (w = {}) {
    const stage = clamp(w.stage == null ? 0 : w.stage | 0, 0, 5);
    return { stage, desks: w.desks || stage + 1, studios: w.studios || [], muses: w.muses || [], printing: w.printing || 0, crew: w.crew || [], founder: w.founder || { look: 'v01', hat: 0 }, phase: w.phase, wx: w.wx, firstWord: w.firstWord || null };
  };

  /** Draw the world onto an art-resolution context g (its canvas is the whole view).
      opts: { cam: {x, y}, fy (where on screen the camera point sits, 0..1, default .5), sky: {phase, wx}, crew (default true), crewOpts,
              stage (override), build (0..1: the building rises from the ground), towerLit (0..1),
              back(g, t, view) world hook before the building, draw(g, t, view) world hook after the crew (your actors), front(g, t, view) after the foreground,
              screen(g, t, view) art-res screen-space hook after lights and weather (flashes, inserts), noWeather, noTint,
              frame: true/false forces the tall-view framing on/off (default: on when the view is taller than wide: a hanging canopy and corner bushes) }
      Returns the view: { w, h, ox, oy, cam, env, anchors, crew, light(x, y, w, h, col) }. */
  SK.drawWorld = function (g, t, world, opts = {}) {
    const w = SK.worldOf(world), bw = g.canvas.width, bh = g.canvas.height;
    const env = Object.assign({}, SK.skyNow(), w.phase ? { phase: w.phase } : {}, w.wx != null ? { wx: w.wx } : {}, opts.sky || {});
    const cam = opts.cam || { x: 0, y: -40 }, fy = opts.fy == null ? 0.5 : opts.fy;
    const ox = Math.round(bw / 2 - cam.x), oy = Math.round(bh * fy - cam.y);
    const L = [], view = { w: bw, h: bh, ox, oy, cam, env, world: w, K: opts.K || 1, light: (x, y, ww, hh, col) => L.push([x, y, ww, hh, col]) };
    g.imageSmoothingEnabled = false; g.setTransform(1, 0, 0, 1, 0, 0);
    // 1. sky (screen space, never tinted)
    drawSky(g, t, bw, bh, oy, env, cam.x);
    // 2. the world layer: jungle, ground, building, crew, actors, foreground
    const lc = layerFor(bw, bh), l = lc.getContext('2d'); l.imageSmoothingEnabled = false;
    l.setTransform(1, 0, 0, 1, 0, 0); l.globalCompositeOperation = 'source-over'; l.clearRect(0, 0, bw, bh);
    drawJungle(l, t, bw, oy, cam.x);
    l.setTransform(1, 0, 0, 1, ox, oy);
    const stage = opts.stage != null ? opts.stage : w.stage, X0 = -ox - 2, X1 = bw - ox + 2;
    // ground: a grass edge and earth (or a dock over the lagoon at the boathouse)
    const water = stage === 2, G1 = RAMP.leaf, E = RAMP.coco;
    if (water) {
      const Wt = ['#bfe8ff', '#7ec8f0', '#3a8ec8', '#245e98', '#143a64'];
      rect(l, X0, 2, X1 - X0, bh, Wt[3]); for (let y = 4; y < bh - oy; y += 5) for (let x = X0 + ((y * 7 + Math.floor(t * 2) * 3) % 11); x < X1; x += 11) rect(l, x, y, 4, 1, y % 10 ? Wt[2] : Wt[1]);
      const D = RAMP.wood; rect(l, -72, -1, 144, 4, D[4]); rect(l, -71, -1, 142, 3, D[1]); for (let x = -70; x < 70; x += 6) rect(l, x, 0, 1, 2, D[3]);
      for (let x = -66; x < 70; x += 22) { rect(l, x, 3, 3, 14, D[4]); rect(l, x + 1, 3, 1, 14, D[2]); }
      rect(l, -72, 3, 144, FLOOR + 12, D[4]); rect(l, -70, 3, 140, FLOOR + 10, D[2]); for (let y = 6; y < FLOOR + 14; y += 4) rect(l, -70, y, 140, 1, D[3]);
      // shore on both sides
      for (const s of [-1, 1]) { const x0 = s < 0 ? X0 : 100, x1 = s < 0 ? -100 : X1; rect(l, x0, -1, x1 - x0, bh, E[2]); rect(l, x0, -1, x1 - x0, 3, G1[2]); rect(l, x0, -1, x1 - x0, 1, G1[1]); }
      // a canoe tied up
      const bob = Math.floor(t * 1.5) % 2; rect(l, 78, 6 + bob, 22, 4, RAMP.woodD[4]); rect(l, 79, 6 + bob, 20, 2, RAMP.wood[1]); rect(l, 80, 8 + bob, 18, 1, RAMP.wood[3]);
    } else {
      rect(l, X0, 0, X1 - X0, bh, E[2]);
      for (let k = Math.floor(X0 / 9); k * 9 < X1; k++) { const hx = hash(k, 1); if (hx < 0.5) rect(l, k * 9 + Math.round(hx * 8), 6 + Math.round(hash(k, 2) * 40), 2, 1, hx < 0.2 ? E[1] : E[3]); }
      rect(l, X0, 0, X1 - X0, 4, G1[3]); rect(l, X0, 0, X1 - X0, 2, G1[2]); rect(l, X0, 0, X1 - X0, 1, G1[1]);
      for (let x = Math.floor(X0 / 3) * 3; x < X1; x += 3) if (hash(x, 8) > 0.55) rect(l, x, -1 - (hash(x, 9) > 0.7 ? 1 : 0), 1, 2, G1[hash(x, 6) > 0.5 ? 1 : 2]);
      // a packed-earth yard in front of the building
      if (stage > 0) { const hw = stage >= 4 ? 92 : 70; rect(l, -hw, 4, hw * 2, FLOOR + 4, E[1]); rect(l, -hw, 4, hw * 2, 1, E[3]); for (let x = -hw + 4; x < hw; x += 13) rect(l, x, 7 + (x % 3), 3, 1, E[0]); }
    }
    if (!water) groundDepth(l, X0, X1, bh - oy);
    if (opts.back) opts.back(l, t, view);
    // the building (it can rise from the ground with opts.build)
    const fn = STAGE_FN[clamp(stage, 0, 5)];
    let anchors;
    const build = opts.build == null ? 1 : clamp(opts.build, 0, 1);
    if (build < 1) { l.save(); l.beginPath(); const top = stage === 5 ? -290 : -140; l.rect(X0, Math.round(top * build), X1 - X0, 400); l.clip(); anchors = fn(l, t, env, L, opts); l.restore(); }
    else anchors = fn(l, t, env, L, opts);
    view.anchors = anchors;
    // 3. the light of the hour: a flat tint over the world (never over the sky); lit windows go on after it, so they glow
    const tint = opts.noTint ? null : env.phase === 'night' ? 'rgba(18,22,66,.58)' : env.phase === 'dusk' ? 'rgba(160,60,90,.22)' : env.phase === 'dawn' ? 'rgba(120,90,180,.2)' : env.wx >= 2 ? 'rgba(40,48,80,.3)' : env.wx === 1 ? 'rgba(60,70,100,.12)' : null;
    const dark = env.phase === 'night' || env.phase === 'dusk' || env.wx >= 2;
    const tintFront = tint && env.phase === 'night' ? 'rgba(18,22,66,.4)' : tint;   // the actors catch a little more light than the scenery: a key light
    const tintLayer = (c, col = tint) => { if (!col) return; c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'source-atop'; c.fillStyle = col; c.fillRect(0, 0, bw, bh); c.globalCompositeOperation = 'source-over'; };
    const lights = (c, list) => {
      c.setTransform(1, 0, 0, 1, ox, oy);
      for (const q of list) {
        if (q[0] === 'glow') { if (!dark) continue; c.globalAlpha = q[4]; disc(c, q[1], q[2], q[3], '#ffe08a'); c.globalAlpha = q[4] * 0.8; disc(c, q[1], q[2], Math.round(q[3] * 0.6), '#fff0b0'); c.globalAlpha = 1; continue; }
        if (q[0] === 'text') { if (!dark) continue; SK.text(c, q[1], q[2], q[3], '#ffe680', { align: 'center', s: q[4] }); continue; }
        if (!q[4]) { rect(c, q[0], q[1], q[2], q[3], '#3a2410'); continue; }
        if (!dark && opts.towerLit == null && !q[5]) continue;
        rect(c, q[0], q[1], q[2], q[3], q[4]);
      }
    };
    tintLayer(l); lights(l, L);
    l.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(lc, 0, 0);
    // 4. the front layer: portraits, plaque, signpost, the crew at work, your actors, ferns at the very front
    const fc = layerFor(bw, bh, 'f'), f = fc.getContext('2d'); f.imageSmoothingEnabled = false;
    f.setTransform(1, 0, 0, 1, 0, 0); f.globalCompositeOperation = 'source-over'; f.clearRect(0, 0, bw, bh); f.setTransform(1, 0, 0, 1, ox, oy);
    const LL = []; view.light = (x, y, ww, hh, col) => LL.push([x, y, ww, hh, col, true]);
    if (build >= 1) {
      w.muses.slice(0, 3).forEach((id, i) => { const p = anchors.portraits[i]; if (!p) return; if (p[2] === 'stand') { rect(f, p[0] + 3, p[1] + 24, 2, 16, RAMP.woodD[4]); rect(f, p[0] + 19, p[1] + 24, 2, 16, RAMP.woodD[4]); } SK.portraitFrame(f, t, id, p[0], p[1]); });
      const half = Math.max(anchors.half, ((Math.min(6, w.desks) - 1) / 2) * 32 + 16);
      const doorman = stage === 4 && opts.doorman !== false;
      if (doorman) SK.actor(f, 'v28', SK.frame(t, 0.4, 2) ? 'idle' : 'breathe', -half - 8, FLOOR - 2, { hat: 2 });
      if (w.printing > 0) SK.plaque(f, -half - (doorman ? 40 : 22), FLOOR - 1, w.printing);
      if (w.studios.length) SK.signpost(f, t, half + 30, w.studios);
    }
    if (opts.crew !== false) view.crew = drawCrew(f, t, w, view, opts.crewOpts);
    if (opts.draw) opts.draw(f, t, view);
    for (let k = Math.floor(X0 / 37); k * 37 < X1; k++) { if (hash(k, 11) < 0.55) continue; const fx = k * 37 + Math.round(hash(k, 12) * 20); if (Math.abs(fx) < (stage === 2 ? 76 : 60)) continue; fern(f, t, fx, FLOOR + 10 + Math.round(hash(k, 13) * 6), 7); }
    const tall = opts.frame != null ? !!opts.frame : bh > bw * 1.15;
    if (tall) { f.setTransform(1, 0, 0, 1, 0, 0); tallFrame(f, t, bw, bh, oy + (anchors.roof || -60)); f.setTransform(1, 0, 0, 1, ox, oy); }
    if (opts.front) opts.front(f, t, view);
    tintLayer(f, tintFront); lights(f, LL);
    f.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(fc, 0, 0);
    // 5. fireflies
    g.setTransform(1, 0, 0, 1, ox, oy);
    if (env.phase === 'night' && env.wx < 2) {
      for (let i = 0; i < 14; i++) {
        const on = (Math.floor(t * 1.3 + i * 0.77) % 4) !== 0, fx = Math.round(-120 + hash(i, 21) * 240 + Math.sin(t * 0.7 + i) * 8), fyy = Math.round(-6 - hash(i, 22) * 46 + Math.cos(t * 0.9 + i * 2) * 5);
        if (!on) continue; rect(g, fx, fyy, 1, 1, '#f4ff8a'); g.globalAlpha = 0.35; rect(g, fx - 1, fyy, 3, 1, '#c8f060'); rect(g, fx, fyy - 1, 1, 3, '#c8f060'); g.globalAlpha = 1;
      }
    }
    // 6. weather, in screen space
    g.setTransform(1, 0, 0, 1, 0, 0);
    if (env.wx >= 1 && !opts.noWeather) {
      const n = [0, 40, 90, 150][env.wx], r = rng(5), sp = 160 + env.wx * 40, slant = env.wx >= 3 ? 2 : 1;
      g.fillStyle = env.phase === 'night' ? 'rgba(160,190,230,.55)' : 'rgba(214,240,255,.7)';
      for (let i = 0; i < n; i++) { const x0 = r() * (bw + 40), y0 = r() * (bh + 40), y = ((y0 + t * sp * (0.8 + r() * 0.4)) % (bh + 20)) - 10, x = ((x0 - y * slant * 0.25) % (bw + 20) + bw + 20) % (bw + 20) - 10; g.fillRect(Math.round(x), Math.round(y), 1, 3 + env.wx); }
      if (env.wx >= 3) { const c = t % 7.3; if (c < 0.12 || (c > 0.22 && c < 0.3)) { g.fillStyle = 'rgba(255,255,255,.45)'; g.fillRect(0, 0, bw, bh); } }
    }
    if (opts.screen) opts.screen(g, t, view);
    return view;
  };

  /* ================= sizing and blowing up ================= */
  /** Pick the whole-number scale: the safe box [w, h] (art px) must fit the canvas. zoom adds whole steps. */
  SK.fit = function (devW, devH, safe, zoom = 0) {
    const s = safe || (devW >= devH ? [200, 120] : [124, 150]);
    const k = Math.max(1, Math.floor(Math.min(devW / s[0], devH / s[1])));
    return Math.max(1, k + (zoom | 0));
  };
  const bufs = new Map();
  /** Draw the world into canvas (sized to its CSS box times devicePixelRatio), blown up by a whole number with no smoothing.
      opts: everything drawWorld takes, plus { safe: [w, h], zoom: whole steps, dpr, size: [cssW, cssH], scale: a whole number of device px per art px
      (skips the safe-box fit; zoom still adds) }. Returns the view (with K, the scale in device px). */
  SK.render = function (canvas, t, world, opts = {}) {
    const dpr = opts.dpr || G.devicePixelRatio || 1, cw = opts.size ? opts.size[0] : canvas.clientWidth || canvas.width, ch = opts.size ? opts.size[1] : canvas.clientHeight || canvas.height;
    const W = Math.max(1, Math.round(cw * dpr)), H = Math.max(1, Math.round(ch * dpr));
    if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
    const k = opts.scale ? Math.max(1, (opts.scale | 0) + (opts.zoom | 0)) : SK.fit(W, H, opts.safe, opts.zoom), bw = Math.ceil(W / k), bh = Math.ceil(H / k);
    let b = bufs.get(canvas); if (!b) { b = document.createElement('canvas'); bufs.set(canvas, b); }
    if (b.width !== bw || b.height !== bh) { b.width = bw; b.height = bh; }
    const g = b.getContext('2d');
    const view = SK.drawWorld(g, t, world, Object.assign({}, opts, { K: k }));
    const c = canvas.getContext('2d'); c.imageSmoothingEnabled = false; c.setTransform(1, 0, 0, 1, 0, 0);
    c.drawImage(b, 0, 0, bw * k, bh * k);
    view.K = k; view.dpr = dpr; view.canvas = canvas;
    /** world point -> CSS px on the canvas (to place DOM bubbles over an actor) */
    view.toCss = (x, y) => [((x + view.ox) * k) / dpr, ((y + view.oy) * k) / dpr];
    return view;
  };

  /* ================= portraits and captions (DOM) ================= */
  /** Paint a speaker portrait onto a small canvas (24x24 art px; show it at a whole multiple with CSS, pixelated). spec: { look, hat, expr } | { draw(g) } | null */
  SK.portrait = function (canvas, spec, o = {}) {
    canvas.width = 24; canvas.height = 24; const g = canvas.getContext('2d'); g.imageSmoothingEnabled = false; g.clearRect(0, 0, 24, 24);
    const bg = o.bg || '#1d5a36'; rect(g, 0, 0, 24, 24, bg); for (let y = 16; y < 24; y++) for (let x = y % 2; x < 24; x += 2) dot(g, x, y, 'rgba(0,0,0,.18)');
    if (!spec) return;
    if (spec.draw) { spec.draw(g); return; }
    const cv = SK.monkey(spec.look || 'v01', spec.pose || 'idle', { hat: spec.hat || 0, expr: spec.expr });
    if (cv) g.drawImage(cv, -19, -17 + (spec.dy || 0));   // the head and shoulders: frame x 19-43, y 17-41 (a 64px monkey stands from y 20 to its feet at 56)
  };
  /** The caption UI inside host: a framed box with a portrait, a name and the typed line. Returns { el, show(cast, text), type(n), hide(), done() } */
  SK.caption = function (host) {
    const el = document.createElement('div'); el.className = 'st-cap'; el.hidden = true;
    el.innerHTML = '<canvas class="st-port" width="24" height="24" aria-hidden="true"></canvas><div class="st-capbody"><b class="st-who"></b><p class="st-txt" aria-hidden="true"></p><span class="st-sr" aria-live="polite"></span></div><i class="st-next" aria-hidden="true"></i>';   // the typed line is for eyes; a screen reader gets each whole line once
    host.appendChild(el);
    const port = el.querySelector('.st-port'), who = el.querySelector('.st-who'), txt = el.querySelector('.st-txt'), sr = el.querySelector('.st-sr');
    let full = '', shown = -1;
    return {
      el,
      show(cast, text) {
        full = text || ''; shown = -1; el.hidden = !full;
        const narr = !cast || cast.narrator; el.classList.toggle('narr', narr); port.hidden = narr; who.hidden = narr;
        if (!narr) { SK.portrait(port, cast, { bg: cast.bg }); who.textContent = (cast.name || '').toUpperCase(); }
        txt.textContent = ''; sr.textContent = (narr || !cast.name ? '' : cast.name + ': ') + full; el.classList.remove('done');
      },
      type(n) { n = Math.max(0, Math.min(full.length, Math.floor(n))); if (n === shown) return; shown = n; txt.textContent = full.slice(0, n); el.classList.toggle('done', n >= full.length); },
      hide() { el.hidden = true; full = ''; },
      length: () => full.length,
    };
  };

  /* ================= the scene registry ================= */
  /** Register a cutscene. def: { id, title, chapter, duration, sky?, stage?(w), beats: [{at, who, text}], cast(w) -> { name: {look, hat, name, bg} | {draw, name} },
      camera(t, w) -> {x, y, z}, actors(t, w) -> A (pure in t), draw(g, t, w, A, view), front?, screen?(g, t, w, A, view), cues: [{at, sfx, arg} | {at, fn}], crew?: false } */
  SK.scenes = SK.scenes || {};
  SK.scene = function (def) { if (!def || !def.id) throw new Error('StoryKit.scene: an id is required'); SK.scenes[def.id] = def; return def; };
  /* The key gate: window capture listeners run in the order they were added, and this file loads before ops.js, tour.js and minigame-progression.js,
     so a cutscene (story.js sets SK.keyGate) sees every key first. Without it the rail's, the tour's or a repair's Esc handler would take the Esc meant for SKIP. */
  if (typeof addEventListener === 'function') ['keydown', 'keyup'].forEach(type => addEventListener(type, e => { if (SK.keyGate) SK.keyGate(e); }, true));
})(typeof globalThis !== 'undefined' ? globalThis : window);
