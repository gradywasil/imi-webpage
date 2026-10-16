/* ============================================================
   MINI-GAME ART KIT, HIGH RESOLUTION: sprites drawn at 3x the games' units (about the detail of the 64px crew monkeys) with the same outline + bevel
   renderer as mg-art.js. Every canvas here is in hi-res pixels; draw them with st.hi(img, x, y). Sizes noted as WxH hi-res px (divide by 3 for game units).
   ============================================================ */
(() => {
  'use strict';
  const { R, shapes: { ell, box, poly, and, or, sub, cap } } = MGArt;
  const make = (w, h, fn) => { const c = MGArt.make(w, h, fn); c.hi = true; return c; };
  const hl = (px, x, y, w, h, t = 2) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) px.tone(x + i, y + j, t); };
  const dots = (px, list, ramp, tone, part = 8) => list.forEach(([x, y]) => px.dot(x, y, ramp, tone, part));
  const cvs = (w, h, fn) => { const c = document.createElement('canvas'); c.width = w; c.height = h; c.hi = true; fn(c.getContext('2d'), w, h); return c; };
  const flip = c => { const f = cvs(c.width, c.height, x => { x.translate(c.width, 0); x.scale(-1, 1); x.drawImage(c, 0, 0); }); f.hi = true; return f; };

  /* a banana: a tapering crescent. kind picks the ramp; stem + tip are dark */
  function bananaSprite(ramp, o = {}, sc = 1) {
    const W = Math.round(44 * sc), H = Math.round(36 * sc), cx = 20 * sc, cy = 3 * sc, rm = 20 * sc, span = 1.0, rot = .38;
    const polar = (x, y) => { const dx = x - cx, dy = y - cy; return [Math.hypot(dx, dy), Math.atan2(dx, dy) - rot]; };
    return make(W, H, px => {
      const body = (x, y) => { const [d, a] = polar(x, y); if (Math.abs(a) > span) return false; const t = a / span, h = 6.2 * sc * Math.pow(Math.max(0, 1 - t * t), .5) + .9; return Math.abs(d - rm) <= h; };
      px.shape(body, ramp, 1);
      px.shape((x, y) => { const [d, a] = polar(x, y); return body(x, y) && Math.abs(a) < span - .12 && d > rm + 2 * sc && d < rm + 2 * sc + 1.2; }, ramp, 2);   // ridge
      px.shape((x, y) => { const [d, a] = polar(x, y); return body(x, y) && Math.abs(a + .1) < .42 && d > rm - 3.6 * sc && d < rm - 2.2 * sc; }, ramp, 3);        // shine
      const at = a => [cx + Math.sin(a + rot) * rm, cy + Math.cos(a + rot) * rm];
      const [sx, sy] = at(span - .02), [tx, ty] = at(-span + .02);
      px.shape(and(cap(sx, sy, sx + 2.4 * sc, sy - 4 * sc, Math.max(1.2, 2.1 * sc)), () => true), R.stem, 4);                      // stem
      px.shape(ell(tx, ty, Math.max(1.2, 2.1 * sc), Math.max(1.2, 2.1 * sc)), R.stem, 4);                                                    // tip
      if (o.spots) dots(px, o.spots, R.stem, 1, 5);
    });
  }  const spotsRotten = [[9, 20], [13, 26], [19, 27], [25, 25], [31, 20], [17, 24], [34, 14]];

  /* ---------- fruit ---------- */
  const apple = () => make(36, 38, px => {
    px.shape(or(ell(12.6, 23, 12, 12.6), ell(23.4, 23, 12, 12.6)), R.red, 1); px.shape(sub(ell(18, 11.4, 4.2, 2.8), box(0, 14, 40, 10)), 0, 1);
    px.shape(box(17, 6, 2.4, 8), R.stem, 2); px.shape(ell(26, 9, 6.4, 3.2), R.leaf, 3); px.shape(box(21, 9, 4, 1.4), R.leafD, 3);
    hl(px, 8, 15, 4, 6, 2); dots(px, [[9, 14], [10, 13]], R.red, 2, 1);
  });
  const orange = () => make(36, 38, px => {
    px.shape(ell(18, 21.6, 16.4, 15.4), R.orange, 1); px.shape(ell(18, 6.4, 2.2, 1.6), R.stem, 2); px.shape(ell(25, 6.6, 6.4, 3), R.leaf, 3);
    hl(px, 9, 11, 5, 6, 2); dots(px, [[12, 22], [20, 17], [24, 26], [15, 28], [27, 19], [20, 31], [10, 25]], R.orange, 0, 4);
  });
  const grapes = () => make(36, 42, px => {
    [[10, 14], [18, 14], [26, 14], [14, 21], [22, 21], [18, 28], [18, 35]].forEach(([x, y], i) => { px.shape(ell(x, y, 6.4, 6.4), R.grape, 1 + i); px.tone(x - 3, y - 3, 2); px.tone(x - 2, y - 3, 2); px.tone(x - 3, y - 2, 2); });
    px.shape(box(17, 1, 2.2, 7), R.stem, 9); px.shape(ell(25, 4, 6.4, 2.8), R.leaf, 10);
  });
  const pine = () => make(36, 54, px => {
    px.shape(ell(18, 36, 12.6, 15.4), R.pine, 1);
    for (let j = 0; j < 7; j++) for (let i = 0; i < 5; i++) px.dot(9 + i * 4.6 + (j % 2) * 2 | 0, 25 + j * 4, R.pine, 0, 2);
    px.shape(poly([[18, 0], [22, 18], [14, 18]]), R.leaf, 3); px.shape(poly([[10, 4], [19, 18], [12, 18]]), R.leafD, 3); px.shape(poly([[26, 4], [17, 18], [24, 18]]), R.leafD, 3);
    hl(px, 9, 28, 3, 8, 2);
  });
  const coconut = () => make(30, 30, px => {
    px.shape(ell(15, 15, 13.4, 13.4), R.coco, 1); hl(px, 7, 7, 5, 4, 2);
    px.shape(ell(10.6, 17, 1.6, 1.7), R.ink, 2); px.shape(ell(15.6, 17, 1.6, 1.7), R.ink, 2); px.shape(ell(13, 21, 1.5, 1.6), R.ink, 2);
  });
  const heart = (ramp) => make(27, 24, px => { px.shape(or(ell(8.2, 8.2, 8.2, 7.8), ell(18.8, 8.2, 8.2, 7.8), poly([[.6, 10.4], [26.4, 10.4], [13.5, 23.4]])), ramp, 1); hl(px, 4, 4, 3, 3, 2); });

  /* ---------- street props (road hop) ---------- */
  const tree = () => make(54, 78, px => {
    px.shape(or(box(22, 40, 10, 36), poly([[18, 76], [22, 66], [32, 66], [36, 76]])), R.stem, 1); hl(px, 24, 44, 2, 22, 2);
    px.shape(ell(27, 24, 24, 21), R.leafD, 2); px.shape(or(ell(14, 38, 14, 12), ell(40, 38, 14, 12)), R.leafD, 2);
    px.shape(ell(24, 20, 20, 17), R.leaf, 3); px.shape(or(ell(15, 35, 11, 9), ell(38, 35, 11, 9)), R.leaf, 3);
    px.shape(or(ell(18, 14, 8, 6), ell(34, 22, 6, 5), ell(14, 31, 5, 4)), R.leaf, 4); hl(px, 14, 10, 6, 3, 2);
  });
  const bush = () => make(48, 36, px => {
    px.shape(or(ell(13, 22, 12.6, 11), ell(35, 22, 12.6, 11), ell(24, 14, 14, 11.4)), R.leafD, 1);
    px.shape(or(ell(13, 20, 10.4, 9), ell(35, 20, 10.4, 9), ell(24, 12.4, 12, 9.4)), R.leaf, 2); hl(px, 18, 6, 6, 3, 2);
    [[10, 22], [20, 17], [30, 24], [38, 19], [26, 10]].forEach(([x, y]) => { px.shape(ell(x, y, 2.2, 2.2), R.red, 3); px.tone(x - 1, y - 1, 2); });
  });
  const trash = () => make(33, 42, px => {
    px.shape(box(3, 9, 27, 31), R.metal, 1); for (let x = 8; x < 28; x += 6) px.shape(box(x, 13, 1.4, 24), R.metal, 2);
    px.shape(box(0, 5, 33, 6), R.metal, 3); px.shape(box(12, 0, 9, 6), R.metal, 4); px.shape(box(14, 2, 5, 1.4), R.ink, 5); px.shape(box(3, 36, 27, 4), R.ink, 2);
    hl(px, 4, 10, 2, 24, 2);
  });
  const bag = () => make(36, 36, px => {
    px.shape(ell(18, 23, 14.4, 11.6), R.ink, 1); px.shape(poly([[11, 13], [25, 13], [22, 4], [14, 4]]), R.ink, 1);
    px.shape(ell(18, 3.4, 5.4, 2.6), R.grape, 2); px.shape(box(16, 8, 4, 1.6), R.grape, 2);
    hl(px, 9, 17, 2, 7, 2); dots(px, [[24, 24], [25, 20], [15, 28]], R.ink, 2, 3);
  });
  const soda = () => make(24, 36, px => {
    px.shape(box(3, 7, 18, 26), R.red, 1); px.shape(box(3, 3, 18, 5), R.metal, 2); px.shape(box(3, 12, 18, 8), R.paper, 3); px.shape(box(8, 14, 8, 1.6), R.red, 4);
    px.shape(box(8, 0, 8, 4), R.metal, 2); hl(px, 4, 9, 2, 22, 2);
  });
  const fish = () => make(45, 27, px => {
    px.shape(or(ell(18, 13.6, 14.6, 6.4), poly([[29, 13.6], [43, 3], [43, 24]])), R.paper, 1);
    px.shape(or(box(10, 12, 20, 1.6), poly([[12, 12], [14, 12], [13, 8]]), poly([[18, 12], [20, 12], [19, 8]]), poly([[24, 12], [26, 12], [25, 8]]), poly([[12, 14], [14, 14], [13, 18]]), poly([[18, 14], [20, 14], [19, 18]]), poly([[24, 14], [26, 14], [25, 18]])), R.metal, 2);
    px.shape(ell(7, 12, 1.8, 1.8), R.ink, 3);
  });
  const star = () => make(21, 21, px => { px.shape(poly([[10.5, 0], [13, 8], [21, 8], [14.6, 13], [17, 21], [10.5, 16], [4, 21], [6.4, 13], [0, 8], [8, 8]]), R.star, 1); });

  /* ---------- a 5x7 pixel font (hi-res): text(g, str, x, y, colour, s) draws it with each font pixel s game units wide ---------- */
  const G57 = {};
  `A:01110 10001 10001 11111 10001 10001 10001|B:11110 10001 10001 11110 10001 10001 11110|C:01110 10001 10000 10000 10000 10001 01110|D:11110 10001 10001 10001 10001 10001 11110|
E:11111 10000 10000 11110 10000 10000 11111|F:11111 10000 10000 11110 10000 10000 10000|G:01110 10001 10000 10111 10001 10001 01111|H:10001 10001 10001 11111 10001 10001 10001|
I:01110 00100 00100 00100 00100 00100 01110|J:00111 00010 00010 00010 00010 10010 01100|K:10001 10010 10100 11000 10100 10010 10001|L:10000 10000 10000 10000 10000 10000 11111|
M:10001 11011 10101 10101 10001 10001 10001|N:10001 11001 10101 10011 10001 10001 10001|O:01110 10001 10001 10001 10001 10001 01110|P:11110 10001 10001 11110 10000 10000 10000|
Q:01110 10001 10001 10001 10101 10010 01101|R:11110 10001 10001 11110 10100 10010 10001|S:01111 10000 10000 01110 00001 00001 11110|T:11111 00100 00100 00100 00100 00100 00100|
U:10001 10001 10001 10001 10001 10001 01110|V:10001 10001 10001 10001 10001 01010 00100|W:10001 10001 10001 10101 10101 10101 01010|X:10001 10001 01010 00100 01010 10001 10001|
Y:10001 10001 01010 00100 00100 00100 00100|Z:11111 00001 00010 00100 01000 10000 11111|0:01110 10001 10011 10101 11001 10001 01110|1:00100 01100 00100 00100 00100 00100 01110|
2:01110 10001 00001 00010 00100 01000 11111|3:11110 00001 00001 01110 00001 00001 11110|4:00010 00110 01010 10010 11111 00010 00010|5:11111 10000 11110 00001 00001 10001 01110|
6:00110 01000 10000 11110 10001 10001 01110|7:11111 00001 00010 00100 01000 01000 01000|8:01110 10001 10001 01110 10001 10001 01110|9:01110 10001 10001 01111 00001 00010 01100|
.:00000 00000 00000 00000 00000 01100 01100|,:00000 00000 00000 00000 01100 00100 01000|!:00100 00100 00100 00100 00100 00000 00100|?:01110 10001 00001 00110 00100 00000 00100|
-:00000 00000 00000 11111 00000 00000 00000|::00000 01100 01100 00000 01100 01100 00000|':00100 00100 01000 00000 00000 00000 00000|+:00000 00100 00100 11111 00100 00100 00000|
 :00000 00000 00000 00000 00000 00000 00000`.split(/\|\n?/).forEach(e => { G57[e[0]] = e.slice(2).replace(/ /g, ''); });
  /* width in game units of a string drawn at scale s (6 font columns per glyph including the gap) */
  const textW = (str, s) => str.length * 6 * s - s;
  function text(g, str, x, y, col, s = 1 / 3) {
    g.fillStyle = col;
    for (let n = 0; n < str.length; n++) { const gl = G57[str[n]] || G57[str[n].toUpperCase()]; if (!gl) continue; for (let i = 0; i < 35; i++) if (gl[i] === '1') g.fillRect(x + (n * 6 + i % 5) * s, y + Math.floor(i / 5) * s, s, s); }
  }

  /* three letter tiles fanned out and tied with string (hi-res) */
  function bundleHi(a, b, c) {
    return cvs(69, 45, x => {
      const tile = (ch, tx, ty, rot) => { x.save(); x.translate(tx + 10, ty + 13); x.rotate(rot); x.fillStyle = '#1a0f14'; x.fillRect(-10, -13, 21, 27); x.fillStyle = '#fff6d6'; x.fillRect(-9, -12, 19, 25); x.fillStyle = '#ede0b8'; x.fillRect(-9, 9, 19, 4); text(x, ch, -5, -8, '#1a0f14', 2); x.restore(); };
      tile(a, 3, 12, -.22); tile(c, 45, 12, .22); tile(b, 24, 4, 0);
      x.fillStyle = '#52301a'; x.fillRect(8, 36, 53, 3); x.fillStyle = '#c0392b'; x.fillRect(30, 33, 9, 9); x.fillStyle = '#e86a50'; x.fillRect(30, 33, 9, 2); x.fillStyle = '#1a0f14'; x.fillRect(29, 32, 11, 1);
    });
  }
  let built = null;
  function build() {
    if (built) return built;
    const S = {};
    S.banana = bananaSprite(R.banY);
    S.golden = bananaSprite(R.gold);
    S.diamond = bananaSprite(R.ice);
    S.rotten = bananaSprite(R.rotten, { spots: spotsRotten });
    S.bananaS = bananaSprite(R.banY, {}, .7); S.goldenS = bananaSprite(R.gold, {}, .7); S.diamondS = bananaSprite(R.ice, {}, .7);
    S.apple = apple(); S.orange = orange(); S.grapes = grapes(); S.pine = pine(); S.coconut = coconut();
    S.heart = heart(R.red); S.heartOff = heart(R.stem);
    S.tree = tree(); S.bush = bush(); S.trash = trash(); S.bag = bag(); S.soda = soda(); S.fish = fish(); S.star = star();
    S.fruits = [S.apple, S.orange, S.grapes, S.pine, S.banana];
    return (built = S);
  }
  window.MGArt3 = { build, hl, dots, cvs, flip, make, text, textW, G57, bundleHi };
})();
