/* ============================================================
   A RAVEN PERCHED (repair "raven", verb SHOO, 9 s): a raven has settled on the machine, in front of the open window and the moon.
   The fixer claps to shoo it, but only a clap while it LOOKS AWAY startles it. Its head is the tell, a silhouette against the moon:
   beak pointing at the fixer with a glowing eye = watching; beak to the window (or tucked in to preen) = away; face-on = turning.
   A clap while it watches or turns makes it settle in: a twig on its nest, a NEVERMORE, and a long glare. Enough startles and it flies off.
   Grade: gone = 1 - .12 per clap it caught - up to .35 for slow claps (never below .3); still there = up to .38 by shoos landed.
   "Slow" is the player's reaction, not the raven's schedule: the time it spent looking away un-clapped, per shoo (.22 s is free).
   Level: one more shoo needed from .67, shorter looks away, quicker turns, and feints (a glance back, a fake look-away).
   Controls: tap / click anywhere, or Space / Enter.
   Layout of this file (as leak.js): 1 sprites · 2 setup · 3 tuning · 4 state · 5 verbs · 6 update · 7 bot · 8 draw · 9 run.
   ============================================================ */
(() => {
  'use strict';
  const { clamp, lerp, sfx } = MG;
  const { R: AR, shapes: { ell, box, poly, cap, or, and, sub } } = MGArt, { make, hl, cvs, text, textW } = MGArt3;
  /* a blue-black raven ramp and a grey beak, added to MGArt's table for this page (append-only, as the kit does for the desk ramps) */
  const ramp = (k, r) => AR[k] || (AR[k] = MGArt.ramps.push(r.map(MGArt.hex)) - 1);
  const RAVEN = ramp('raven', ['#0c0a14', '#1e1a2c', '#46547e']), BEAK = ramp('beak', ['#24242e', '#4a4a5a', '#8a8aa0']);

  /* ---------- 1. sprites (hi-res, 3 px per unit). The raven's are re-rasterised S times bigger (shapes scaled, pixel ops as blocks),
     so it stays crisp and its head reads on a phone; the art below is laid out on its 1x grid ---------- */
  const S = 4 / 3;
  const big = (w, h, fn, k = S) => k === 1 ? make(w, h, fn) : make(Math.round(w * k), Math.round(h * k), px => {
    const blk = (x, y, f) => { for (let j = Math.floor(y * k); j < Math.floor((y + 1) * k); j++) for (let i = Math.floor(x * k); i < Math.floor((x + 1) * k); i++) f(i, j); };
    fn({ shape: (t, r, p) => px.shape((x, y) => t(x / k, y / k), r, p), dot: (x, y, r, tn, p) => blk(x, y, (i, j) => px.dot(i, j, r, tn, p)), tone: (x, y, tn) => blk(x, y, (i, j) => px.tone(i, j, tn)) });
  });
  /* the body, perched face-on: folded wings, shaggy throat, tail between the feet. 30x28 units; the neck sits at hi-res (45, 27), the feet on the bottom row */
  const bodySpr = fluff => big(90, 84, px => {
    const f = fluff ? 2.5 : 0, rag = fluff ? (x, y) => { const a = Math.atan2(y - 50, x - 45); return Math.sin(a * 14) * 1.6; } : () => 0;
    px.shape(poly([[37, 66], [53, 66], [56, 83], [34, 83]]), RAVEN, 1);                                                            /* tail */
    px.shape((x, y) => { const dx = (x - 45) / (19 + f + rag(x, y)), dy = (y - 50) / (23 + f * .6); return dx * dx + dy * dy <= 1; }, RAVEN, 2);   /* body */
    px.shape(or(poly([[27, 36], [36, 34], [41, 62], [33, 79], [24, 58]]), poly([[63, 36], [54, 34], [49, 62], [57, 79], [66, 58]])), RAVEN, 3);   /* folded wings */
    for (const s of [1, -1]) for (let i = 0; i < 4; i++) { const x0 = 45 + s * (12 + i * 2.5); px.shape(cap(x0, 46 + i * 5, x0 + s * 3, 60 + i * 5, .6), RAVEN, 4); }  /* feather edges */
    px.shape(poly([[34, 28], [38, 40], [41, 32], [45, 42], [49, 32], [52, 40], [56, 28]]), RAVEN, 4);                               /* throat hackles */
    hl(px, 29, 40, 2, 10, 2); hl(px, 31, 37, 3, 2, 2); hl(px, 38, 46, 2, 6, 2);
    px.shape(or(cap(40, 70, 40, 80, 1.6), cap(50, 70, 50, 80, 1.6)), BEAK, 5);                                                    /* legs + toes on the platen */
    px.shape(or(cap(35, 81, 44, 81, 1.4), cap(46, 81, 55, 81, 1.4)), BEAK, 6);
  });
  const BODY = bodySpr(false), FLUFF = bodySpr(true);
  /* wings spread (a hop or flight): 0 = up, 1 = down. 44x30 units, the neck at hi-res (66, 30) */
  const FLAP = [0, 1].map(k => big(132, 90, px => {
    const up = k === 0;
    for (const s of [1, -1]) {
      const tip = up ? [66 + s * 64, 4] : [66 + s * 62, 66], mid = up ? [66 + s * 40, 16] : [66 + s * 40, 50];
      px.shape(poly([[66 + s * 10, 34], mid, tip, [66 + s * 46, up ? 34 : 60], [66 + s * 30, up ? 46 : 56], [66 + s * 14, 54]]), RAVEN, 2);
      for (let i = 0; i < 4; i++) { const t = .35 + i * .17, x = lerp(66 + s * 14, tip[0], t), y = lerp(50, tip[1], t); px.shape(cap(x, y, x + s * 4, y + (up ? 12 : 10), .7), RAVEN, 3); }
    }
    px.shape(ell(66, 52, 18, 21), RAVEN, 4); px.shape(poly([[56, 66], [76, 66], [80, 86], [52, 86]]), RAVEN, 3);
    px.shape(poly([[55, 32], [59, 42], [62, 35], [66, 44], [70, 35], [73, 42], [77, 32]]), RAVEN, 5); hl(px, 52, 40, 2, 10, 2);
    px.shape(or(cap(60, 70, 58, 84, 1.6), cap(72, 70, 74, 84, 1.6)), BEAK, 6);
  }));
  /* heads, 18x14 units, the neck at hi-res (27, 34). 'right' = looking away (to the window), 'left' = watching the fixer (a glowing eye), 'front' = turning */
  const headSpr = (kind, glow, k = S) => {
    const cv = big(54, 42, px => {
      if (kind === 'front') {
        px.shape(ell(27, 20, 13, 12.5), RAVEN, 1); px.shape(poly([[19, 30], [23, 38], [27, 31], [31, 38], [35, 30]]), RAVEN, 1);
        px.shape(poly([[27, 17], [21.5, 24], [27, 36], [32.5, 24]]), BEAK, 2); hl(px, 25, 20, 2, 7, 2);
        for (const ex of [19.5, 34.5]) { px.shape(ell(ex, 16, 2.6, 2.6), AR.ink, 3); px.dot(Math.round(ex) - 1, 15, AR.paper, 2, 4); }
        hl(px, 18, 9, 5, 2, 2); return;
      }
      const R2 = kind === 'right', X = x => R2 ? x : 54 - x;                                                                  /* drawn facing right, mirrored for left */
      px.shape(ell(X(23), 20, 13, 12), RAVEN, 1);
      px.shape(poly([[X(14), 28], [X(17), 38], [X(21), 30], [X(25), 37], [X(28), 29]]), RAVEN, 1);                               /* chin hackles */
      px.shape(poly([[X(31), 13.5], [X(45), 15.5], [X(53), 21.5], [X(47), 23], [X(31), 26.5]]), BEAK, 2);                       /* the big raven beak, hooked */
      px.shape(cap(X(32), 21, X(48), 22, .5), BEAK, 3); hl(px, Math.min(X(33), X(43)), 15, 10, 1, 2);
      px.shape(poly([[X(29), 14], [X(34), 13], [X(33), 18], [X(29), 18]]), RAVEN, 4);                                          /* nasal bristles */
      if (glow) { px.shape(ell(X(27), 17, 3.6, 3.6), AR.gold, 5); px.shape(ell(X(27.5), 17, 1.6, 2.2), AR.ink, 6); px.dot(Math.round(X(26)), 15, AR.paper, 2, 7); px.shape(cap(X(22), 12, X(31), 14.5, 1.3), RAVEN, 8); }
      else { px.shape(ell(X(27), 17, 2.4, 2.4), AR.ink, 5); px.dot(Math.round(X(26)), 16, AR.metal, 2, 6); }
      hl(px, Math.min(X(14), X(22)), 10, 8, 2, 2);
    }, k);
    return cv;
  };
  const HEAD = { left: headSpr('left', true), right: headSpr('right', false), front: headSpr('front') };
  /* preening: the head tucked down to the window side, the long beak poking down into the wing, the eye shut (head away = clap) */
  const preenSpr = (k = S) => big(54, 42, px => {
    px.shape(ell(28, 23, 12, 11), RAVEN, 1); px.shape(poly([[19, 31], [23, 39], [27, 33], [31, 39], [35, 31]]), RAVEN, 1);       /* head + hackles */
    px.shape(poly([[33, 21], [44, 27], [53, 36], [50, 39], [41, 33], [32, 30]]), BEAK, 2);                                    /* the beak, angled down past the head */
    px.shape(cap(35, 25, 50, 36, .6), BEAK, 3); hl(px, 37, 23, 6, 1, 2);
    px.shape(poly([[30, 20], [34, 19], [34, 24], [30, 24]]), RAVEN, 4);                                                    /* nasal bristles */
    px.shape(cap(22, 18.5, 27, 20, .8), AR.metal, 5); hl(px, 20, 13, 8, 2, 2);                                              /* the shut eye: a pale lid line */
  }, k);
  const PREEN = preenSpr();
  const FEATHER = make(9, 18, px => { px.shape(or(ell(4.5, 9, 3.4, 8), cap(4.5, 2, 4.5, 17, .6)), RAVEN, 1); });

  /* ---------- 2. setup ---------- */
  const R = MGRepair.setup({
    id: 'raven', verb: 'SHOO', scoreIcon: FEATHER, howAt: 103,                  /* the hint sits over the desk: the head, the shoo pips (in the sky) and the fixer stay in view */
    how: 'Tap to <em>clap</em>, but only while it <em>looks away</em>',
    legend: [[headSpr('right', false, 1), 'looking away: <em>clap!</em>'], [preenSpr(1), 'preening: <em>clap!</em>'], [headSpr('left', true, 1), 'watching: <em class="bad">don\'t</em>']],
    hint: 'tap · Space to clap',
  });
  const { st, g, W, H, ui, fx, rng, level: LV } = R;

  const CEIL = 17, FLOOR_TOP = 126, FOOT = 151, DESK_Y = 112, TW_X = 58, TW_Y = DESK_Y - 33, RX = 81, RY = TW_Y + 7.33;
  const ARCH = { x: 56, w: 52, cy: 48, r: 26, bot: 100 }, MOON = { x: 82, y: 57, r: 13 }, FIX_X = 38;
  const inArch = (x, y) => x >= ARCH.x && x < ARCH.x + ARCH.w && y < ARCH.bot && (y >= ARCH.cy || (x - ARCH.x - ARCH.w / 2) ** 2 + (y - ARCH.cy) ** 2 <= ARCH.r * ARCH.r);
  const TYPEWRITER = MGRepair.parts.typewriter(R.desk, { paper: false });
  /* the night outside, painted once: dusk-blue sky, stars, the moon right behind the raven's head, the jungle line */
  const SKY = cvs(W * 3, H * 3, x => {
    x.scale(3, 3); const r = (c, a, b, w, hh) => { x.fillStyle = c; x.fillRect(a, b, w, hh); }, s = MG.seeded(21);
    ['#1a1f48', '#222a5c', '#2c3770', '#384686', '#46569a'].forEach((c, i) => r(c, ARCH.x, ARCH.cy - ARCH.r + i * 16, ARCH.w, 16));
    for (let i = 0; i < 26; i++) { const sx = ARCH.x + s() * ARCH.w, sy = 22 + s() * 50; r(s() < .3 ? '#ffffff' : '#c8d0ff', Math.round(sx * 3) / 3, Math.round(sy * 3) / 3, 1 / 3, 1 / 3); }
    const disc = (cx, cy, rr, col) => { x.fillStyle = col; for (let yy = -rr; yy <= rr; yy += 1 / 3) { const w = Math.sqrt(Math.max(0, rr * rr - yy * yy)); x.fillRect(Math.round((cx - w) * 3) / 3, Math.round((cy + yy) * 3) / 3, Math.round(w * 6) / 3, 1 / 3); } };
    disc(MOON.x, MOON.y, MOON.r + 4, 'rgba(120,140,220,.25)'); disc(MOON.x, MOON.y, MOON.r + 2, 'rgba(160,176,240,.3)');
    disc(MOON.x, MOON.y, MOON.r, '#f4ecc4'); disc(MOON.x - 1.5, MOON.y - 1.5, MOON.r - 2.5, '#fff8dc');
    for (const [cx, cy, rr] of [[MOON.x + 5, MOON.y - 5, 2.3], [MOON.x - 6, MOON.y + 4, 1.7], [MOON.x + 3, MOON.y + 7, 1.3]]) disc(cx, cy, rr, '#e2d6a4');
    r('rgba(200,210,255,.35)', ARCH.x + 4, 36, 14, .67); r('rgba(200,210,255,.25)', ARCH.x + 30, 30, 18, .67);
    for (const [cx, rr] of [[2, 7], [12, 9], [24, 6], [36, 8], [48, 7]]) disc(ARCH.x + cx, ARCH.bot - 3, rr, '#0e1e24');
    r('#0e1e24', ARCH.x, ARCH.bot - 4, ARCH.w, 4);
  });
  /* the room, painted once, with the arch left clear */
  const ROOM = cvs(W * 3, H * 3, x => {
    x.scale(3, 3); const r = (c, a, b, w, hh) => { x.fillStyle = c; x.fillRect(a, b, w, hh); }, s = MG.seeded(9), WS = 98;
    r('#2a170b', 0, 0, W, CEIL);
    for (let y = 0; y < 13; y += 5) { r('#4a2a12', 0, y, W, 4.67); r('#5a3517', 0, y, W, .67); for (let sx = (y * 7) % 23; sx < W; sx += 23) r('#2a170b', sx, y, .67, 4.67); }
    r('#1a0f14', 0, 13, W, 4.33); r('#6a4120', 0, 13.33, W, 3.33); r('#8a5a2b', 0, 13.33, W, .67); r('#3a210d', 0, 16, W, .67);
    r('#12402a', 0, CEIL, W, FLOOR_TOP - CEIL); for (let sx = 0; sx < W; sx += 8) r('#0f3824', sx, CEIL, 4, FLOOR_TOP - CEIL);
    r('rgba(0,0,0,.3)', 0, CEIL, W, 2.33);
    r('#3a210d', 0, WS, W, FLOOR_TOP - WS); for (let sx = 2; sx < W; sx += 20) { r('#4a2a12', sx, WS + 3, 16, FLOOR_TOP - WS - 6); r('#2a170b', sx, FLOOR_TOP - 3.67, 16, .67); r('#5a3517', sx, WS + 3, 16, .67); }
    r('#1a0f14', 0, WS - 1, W, 1.33); r('#8a5a2b', 0, WS - .67, W, .67);
    /* the arched window: a thick wooden frame, then cleared */
    for (let y = ARCH.cy - ARCH.r - 3; y < ARCH.bot + 1; y += 1 / 3) for (const [pad, col] of [[3, '#1a0f14'], [2.33, '#c08a4a'], [1.67, '#8a5a2b']]) {
      const half = y >= ARCH.cy ? ARCH.w / 2 + pad : Math.sqrt(Math.max(0, (ARCH.r + pad) ** 2 - (y - ARCH.cy) ** 2));
      if (half > 0) { x.fillStyle = col; x.fillRect(Math.round((ARCH.x + ARCH.w / 2 - half) * 3) / 3, Math.round(y * 3) / 3, Math.round(half * 6) / 3, 1 / 3); }
    }
    for (let y = ARCH.cy - ARCH.r; y < ARCH.bot; y += 1 / 3) { const half = y >= ARCH.cy ? ARCH.w / 2 : Math.sqrt(Math.max(0, ARCH.r ** 2 - (y - ARCH.cy) ** 2)); if (half > 0) x.clearRect(Math.round((ARCH.x + ARCH.w / 2 - half) * 3) / 3, Math.round(y * 3) / 3, Math.round(half * 6) / 3, 1 / 3); }
    r('#1a0f14', ARCH.x - 5, ARCH.bot - .33, ARCH.w + 10, 4.33); r('#b57d3e', ARCH.x - 4.67, ARCH.bot, ARCH.w + 9.33, 3.33); r('#e8b878', ARCH.x - 4.67, ARCH.bot, ARCH.w + 9.33, .67);
    /* a portrait on the left wall: the house poet, Edgar Allan Chimp */
    r('#1a0f14', 9, 30, 27, 33); r('#c98f0e', 10, 31, 25, 31); r('#ffd23a', 10, 31, 25, .67); r('#1a0f14', 12.67, 33.67, 19.67, 25.67); r('#2a3a2a', 13, 34, 19, 25);
    x.fillStyle = '#4f2d14'; for (let yy = 0; yy < 10; yy += 1 / 3) { const w = 5.5 * Math.sqrt(Math.max(0, 1 - ((yy - 5) / 5) ** 2)); x.fillRect(Math.round((22.5 - w) * 3) / 3, 38 + yy, Math.round(w * 6) / 3, 1 / 3); }
    r('#e0aa76', 19.67, 42.33, 5.67, 4); r('#1a0f14', 20.67, 43, .67, .67); r('#1a0f14', 23.33, 43, .67, .67);
    r('#1a0f14', 16, 49, 13, 10); r('#f6f0e0', 21.33, 49, 2.33, 3); r('#b8322a', 21.67, 50, 1.67, 1);
    /* desk */
    r('#1a0f14', 44, DESK_Y - .33, 74, 4.67); r('#8a5a2b', 44.33, DESK_Y, 73.33, 3.67); r('#b57d3e', 44.33, DESK_Y, 73.33, .67); r('#4a2a12', 44.33, DESK_Y + 3, 73.33, .67);
    for (const lx of [48, 110]) { r('#1a0f14', lx - .33, DESK_Y + 4, 4.67, FLOOR_TOP - DESK_Y - 3); r('#6a4120', lx, DESK_Y + 4, 4, FLOOR_TOP - DESK_Y - 4); r('#8a5a2b', lx, DESK_Y + 4, 1, FLOOR_TOP - DESK_Y - 4); }
    r('#2a170b', 0, FLOOR_TOP - 2.67, W, 3); r('#1a0f14', 0, FLOOR_TOP - 2.67, W, .67);
    for (let y = FLOOR_TOP, i = 0; y < H; y += 6 + i * .67, i++) {
      const bh = 6 + i * .67; r(['#4a2a12', '#5a3517', '#523015'][i % 3], 0, y, W, bh); r('#6a4120', 0, y, W, .67); r('#2a170b', 0, y + bh - .67, W, .67);
      for (let sx = (i * 37) % 31; sx < W; sx += 31 + i * 2) r('#2a170b', sx, y, .67, bh);
      for (let k = 0; k < 6; k++) r('#4a2a12', Math.floor(s() * W), y + 1 + Math.floor(s() * (bh - 2)), 3 + Math.floor(s() * 6), .67);
    }
    r('rgba(0,0,0,.28)', 0, FLOOR_TOP, W, 3);
  });
  /* the nest it builds when it settles in: three rings of twigs, painted once */
  const NEST = [1, 2, 3].map(n => cvs(36 * 3, 12 * 3, x => {
    x.scale(3, 3); const s = MG.seeded(40 + n);
    for (let k = 0; k < n * 9; k++) {
      const len = 6 + s() * 8, a = (s() - .5) * .7, cx = 18 + (s() - .5) * (14 + n * 5), cy = 9.5 - Math.floor(k / 9) * 1.7 + (s() - .5) * 1.2;
      for (let i = 0; i <= len * 3; i++) { const px = cx + Math.cos(a) * (i / 3 - len / 2), py = cy + Math.sin(a) * (i / 3 - len / 2); x.fillStyle = '#1a0f14'; x.fillRect(Math.round(px * 3) / 3 - 1 / 3, Math.round(py * 3) / 3 - 1 / 3, 1, 1); x.fillStyle = k % 3 ? '#7a4c28' : '#a8743a'; x.fillRect(Math.round(px * 3) / 3, Math.round(py * 3) / 3, 1 / 3, 1 / 3); }
    }
  }));

  /* ---------- 3. tuning ---------- */
  const TUNE = {
    needed: Math.floor(3 + LV * 1.5),                                          /* startles to shoo it: 3, or 4 from level .67 */
    watch: () => lerp(.75, .45, LV) * rng(.85, 1.45),                          /* seconds it stares at the fixer */
    away: () => lerp(.85, .4, LV) * rng(.95, 1.5),                             /* seconds it looks away: the window to clap in */
    turn: lerp(.22, .13, LV),                                                  /* the face-on turn between the two */
    glance: lerp(0, .3, LV),                                                   /* chance a look away is cut by a glance back (then it looks away again) */
    fake: lerp(0, .25, LV),                                                    /* chance a turn away is faked (it turns back to watch) */
    hop: lerp(.48, .36, LV),                                                   /* a startled hop: claps do nothing meanwhile */
    quick: .22,                                                                /* seconds of looking away per shoo that cost nothing (a quick clap) */
    slow: .5,                                                                  /* ... and this much more costs the whole speed share of the grade */
    cool: .22,                                                                 /* seconds between claps */
  };

  /* ---------- 4. state ---------- */
  let G;
  function reset() {
    G = {
      state: 'watch', st: rng(1.05, 1.35), sT: 0, awayId: 0, glancing: false, look: 'moon',
      startles: 0, settles: 0, claps: 0, best: 0, nest: 0, tGone: 0, goneT: 0, hopY: 0, lag: 0,   /* lag: seconds it looked away and wasn't clapped */
      clapT: 0, clapFx: 0, ouch: 0, feathers: [],
      bot: { wait: 0, seen: -1 },
    };
    ui.setScore(0);
  }
  const gone = () => G.state === 'gone';
  const lagPer = () => G.lag / Math.max(1, G.startles);                     /* the player's reaction: away time per shoo (missed looks add up) */
  const grade = () => gone() ? clamp(1 - .12 * G.settles - .35 * clamp((lagPer() - TUNE.quick) / TUNE.slow, 0, 1), .3, 1)
    : clamp(.38 * G.startles / TUNE.needed - .04 * G.settles, 0, .38);
  const stats = () => [['SHOOED', gone() ? `IN ${G.tGone.toFixed(1)} S` : `${G.startles} / ${TUNE.needed}`], ['REACTION', G.startles ? `${lagPer().toFixed(2)} S` : '-'], ['CAUGHT CLAPPING', G.settles], ['NEST', ['NONE', 'A TWIG', 'COSY', 'MOVED IN'][G.nest]]];

  /* ---------- 5. verbs: clap (the only action). What it does depends on where the raven is looking. ---------- */
  function setState(s, dur) {
    const was = G.state; G.state = s; G.st = dur; G.sT = 0;
    if (s === 'away') { G.awayId++; G.look = rng() < .4 ? 'preen' : 'moon'; sfx.tone(520, 420, .05, 'triangle', .025); }
    if (s === 'watch' && was !== 'hop' && was !== 'settle') sfx.tone(1250, 1350, .04, 'square', .02);       /* a click of the head: it's looking at you */
  }
  function clap() {
    if (!R.live || G.clapT > 0 || gone()) return;
    G.clapT = TUNE.cool; G.clapFx = .14; G.claps++;
    sfx.noise(.07, .14, 6500); sfx.tone(1700, 900, .03, 'square', .03);
    fx.burst(FIX_X, FOOT - 9, ['#fff6d6', '#ffffff'], 4, 26, 0, .2);
    if (G.state === 'hop' || G.state === 'settle') return;                     /* mid-hop or already ruffled: the clap just echoes */
    if (G.state === 'away') startle(); else settleIn();
  }
  function startle() {
    G.startles++; G.best = Math.max(G.best, G.startles); ui.setScore(G.startles); ui.bump();
    sfx.tone(980, 620, .15, 'sawtooth', .05); sfx.tone(900, 560, .13, 'sawtooth', .04, .16); sfx.noise(.12, .06, 1400);
    for (let i = 0; i < 5; i++) G.feathers.push({ x: RX + rng(-8, 8) * S, y: RY - rng(10, 22) * S, vx: rng(-16, 16), vy: rng(-26, -8), a: rng(6.28), t: 0 });
    fx.burst(RX, RY - 14 * S, ['#1e1a2c', '#46547e', '#0c0a14'], 8, 40, 60, .5); R.shake(1.5);
    if (G.startles >= TUNE.needed) { leave(); return; }
    ui.floatText(RX - 10, RY - 31 * S, ['CAW!', 'SHOO!', 'SKRAW!'][G.startles % 3], 'gold');
    setState('hop', TUNE.hop);
  }
  function settleIn() {
    G.settles++; G.nest = Math.min(3, G.nest + 1); G.ouch = .35;
    sfx.tone(320, 230, .32, 'triangle', .06); sfx.typo();
    ui.floatText(RX - 18, RY - 31 * S, G.settles % 2 ? 'NEVERMORE.' : 'CAW.', 'bad'); R.shake(1);
    fx.burst(RX, RY - 1, ['#7a4c28', '#a8743a'], 6, 22, 80, .4);
    setState('settle', .6);
  }
  function leave() {
    G.state = 'gone'; G.st = 0; G.tGone = R.t; G.goneT = 0;
    ui.floatText(RX - 12, RY - 32 * S, 'SHOOED!', 'gold'); MG.hitstop(.06);
    R.end();
  }

  /* ---------- 6. update: the head-turn clock ---------- */
  function update(dt) {
    G.clapT = Math.max(0, G.clapT - dt); G.clapFx = Math.max(0, G.clapFx - dt); G.ouch = Math.max(0, G.ouch - dt);
    for (const f of G.feathers) { f.t += dt; f.vy = Math.min(f.vy + 60 * dt, 12); f.vx *= Math.exp(-dt * 2); f.x += (f.vx + Math.sin(f.t * 6 + f.a) * 10) * dt; f.y += f.vy * dt; }
    G.feathers = G.feathers.filter(f => f.t < 2.2 && f.y < DESK_Y + 30);
    if (gone()) { G.goneT += dt; if (MG.rng() < dt * 8) sfx.noise(.06, .03, 900); return; }
    if (!R.live) return;
    G.sT += dt; if (G.state === 'away') G.lag += dt; G.hopY = G.state === 'hop' ? Math.sin(clamp(G.sT / TUNE.hop, 0, 1) * Math.PI) * 9 : 0;
    if ((G.st -= dt) > 0) return;
    switch (G.state) {
      case 'watch': setState('turnA', TUNE.turn); break;
      case 'turnA': if (rng() < TUNE.fake) setState('watch', TUNE.watch() * .7); else setState('away', TUNE.away()); break;
      case 'away': G.glancing = rng() < TUNE.glance; setState('turnW', TUNE.turn); break;
      case 'turnW': if (G.glancing) { G.glancing = false; setState('away', TUNE.away() * .8); } else setState('watch', TUNE.watch()); break;
      case 'hop': setState('watch', TUNE.watch() + .15); break;                 /* lands glaring */
      case 'settle': setState('watch', TUNE.watch() + .3); break;
    }
  }

  /* ---------- 7. bot (?bot=1): sees the head like a player. When it looks away the bot claps after a reaction time (committed; it can
     hold back if it clearly sees the head swinging round), now and then it jumps the gun while the raven is still watching. ---------- */
  function bot(dt) {
    const B = G.bot;
    if (B.wait > 0) { if ((B.wait -= dt) <= 0) { if (G.state === 'turnW' && G.sT > .1 && rng() < .7) return; clap(); } return; }
    if (G.clapT > 0) return;
    if (G.state === 'away' && B.seen !== G.awayId) { B.seen = G.awayId; B.wait = rng(.25, .42); }
    else if ((G.state === 'watch' || G.state === 'turnA') && rng() < dt * .12) B.wait = rng(.02, .1);
  }

  /* ---------- 8. draw ---------- */
  const px3 = v => Math.round(v * 3) / 3;
  const fixerFrames = new Map(), FIX = MGRepair.fixer();
  const fixerPose = (k, p) => {                                                /* the clap needs hands that meet in front: our own crew-art frames */
    if (!fixerFrames.has(k)) { const cv = CrewArt.renderCustomMonkey64(FIX.look, 'stomp', { x: 32, y: 34 + (p.y || 0), facing: 1, squashX: p.sx || 1, squashY: p.sy || 1, expr: p.expr || 'determined', armL: p.armL, armR: p.armR, legL: [-6, 17], legR: [6, 17], hat: FIX.hat }); cv.hi = true; fixerFrames.set(k, cv); }
    return fixerFrames.get(k);
  };
  const CLAP_OPEN = { armL: [-14, -3], armR: [14, -3] }, CLAP_SHUT = { sx: 1.04, sy: .97, y: 1, expr: 'screech', armL: [-2, -4], armR: [2, -4] };
  const nest = () => { if (G.nest) g.drawImage(NEST[G.nest - 1], px3(RX - 18 * S), px3(RY + 2.67 - 12 * S), 36 * S, 12 * S); };
  function drawRaven(now) {
    if (gone()) {                                                              /* flies off into the moon */
      const f = clamp(G.goneT / 1, 0, 1), s = lerp(S, .3, f), x = lerp(RX, MOON.x + 6, f), y = lerp(RY - 10, MOON.y - 8, f) - Math.sin(f * Math.PI) * 6, fr = FLAP[Math.floor(G.goneT * 10) % 2];
      g.drawImage(fr, px3(x - 22 * s), px3(y - 15 * s), 44 * s, 30 * s); return;
    }
    const y0 = RY - G.hopY;
    if (G.state === 'hop') { const fr = FLAP[Math.floor(G.sT * 14) % 2]; st.hi(fr, RX - 22 * S, y0 - 30 * S); st.hi(HEAD.front, RX - 9 * S, y0 - 31.33 * S); return; }
    const fluffed = G.state === 'settle' || G.nest >= 3, body = fluffed ? FLUFF : BODY, sink = G.nest * .67;
    st.hi(body, RX - 15 * S, y0 - 28 * S + sink); nest();                     /* it sits in its nest: the twigs go over its feet */
    const s = G.state, head = s === 'away' ? (G.look === 'preen' ? PREEN : HEAD.right) : s === 'turnA' || s === 'turnW' ? HEAD.front : HEAD.left;
    const bob = s === 'away' && G.look === 'moon' ? -1 + Math.round(Math.sin(now * 3)) * .33 : s === 'watch' ? Math.round(Math.sin(now * 5)) * .33 : 0;
    const hx = RX - 9 * S, hy = y0 - 30.33 * S + sink + bob;                    /* the neck: (15, 9) on the body, (9, 11.33) on a head, in 1x units */
    st.hi(head, hx, hy + (head === PREEN ? 3 * S : 0));
    if ((s === 'watch' || s === 'settle') && Math.floor(now * 3) % 3 === 0) { g.fillStyle = '#fff6c8'; g.fillRect(px3(hx + 8.33 * S), px3(hy + 4.67 * S), 2 / 3, 2 / 3); }   /* a glint in the watching eye */
  }
  function drawFixer() {
    g.fillStyle = 'rgba(10,6,4,.45)'; g.fillRect(FIX_X - 6, FOOT, 12, 1.33);
    let cv;
    if (R.done) { MGRepair.crew(st, FIX_X, FOOT, R.won ? 'cheer' : 'scared'); return; }
    if (G.ouch > 0) { MGRepair.crew(st, FIX_X, FOOT, 'scared'); return; }
    cv = G.clapFx > 0 ? fixerPose('shut', CLAP_SHUT) : fixerPose('open', CLAP_OPEN);
    st.hi(cv, FIX_X - 32 / 3, FOOT - 55 / 3);
    if (G.clapFx > .06) { g.fillStyle = '#fff6d6'; for (const [dx, dy, w, h2] of [[-5, -13, .67, 2.33], [-3.33, -15, .67, 2], [4.33, -13, .67, 2.33], [2.67, -15, .67, 2], [-.33, -16.33, .67, 2.33]]) g.fillRect(px3(FIX_X + dx), px3(FOOT + dy), w, h2); }   /* clap lines */
  }
  function drawPips() {
    /* the shoos still needed, in the night sky over its head (where the eye is): a feather slot each, lit cream once landed */
    const n = TUNE.needed, x0 = RX - (n * 7.5 - 1.5) / 2, y = 29;
    for (let i = 0; i < n; i++) {
      const x = x0 + i * 7.5, on = i < G.startles;
      g.fillStyle = '#1a0f14'; g.fillRect(px3(x - .67), y - .67, 7.33, 11.33);
      g.fillStyle = on ? '#fff6d6' : 'rgba(200,210,255,.16)'; g.fillRect(px3(x), y, 6, 10);
      g.globalAlpha = on ? 1 : .6; g.drawImage(FEATHER, px3(x + .75), y + .5, 4.5, 9); g.globalAlpha = 1;
      if (on) { g.fillStyle = '#ffd23a'; g.fillRect(px3(x), y + 9.33, 6, .67); }
    }
  }
  function draw() {
    const now = performance.now() / 1000;
    st.hi(SKY, 0, 0); st.hi(ROOM, 0, 0);
    g.globalAlpha = .1; g.fillStyle = '#c8d4ff'; for (let y = ARCH.bot + 4; y < FOOT + 6; y += 1 / 3) { const f = (y - ARCH.bot) / (FOOT - ARCH.bot); g.fillRect(px3(ARCH.x - f * 44), y, ARCH.w - 8 + f * 6, 1 / 3); } g.globalAlpha = 1;   /* moonlight on the floor */
    st.hi(TYPEWRITER, TW_X, TW_Y);
    if (gone() || G.state === 'hop') nest();
    drawRaven(now);
    drawFixer();
    for (const f of G.feathers) { g.globalAlpha = clamp(2.2 - f.t, 0, 1); st.hi(FEATHER, f.x - 1.5, f.y - 3); } g.globalAlpha = 1;
    fx.draw(g);
    drawPips();
  }

  /* ---------- 9. input + run: a tap or Space claps ---------- */
  window.RAVEN = { get G() { return G; }, TUNE, clap };
  R.run({
    reset, update, draw, grade, stats, bot,
    ended() { G.bot.wait = 0; },
    down() { clap(); },
    key(ev, k) { if (!ev.repeat && (k === ' ' || k === 'enter' || k === 'arrowup' || k === 'w')) clap(); },
  });
})();
