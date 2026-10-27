/* ============================================================
   OVERHEATING (repair "overheat", verb FAN, 10 s).
   The desk's machine is running red-hot: steam out of the vents, the heat dial already in the yellow and creeping toward the red. The
   fixer holds a big fan-palm leaf overhead; every tap swings it across and sends a gust up at the machine. Each full gust blows off the
   same amount of heat, the heat drifts back up all the time (faster and faster through the run), and the steam whistle shrieks before
   each spike, so fan ahead of it. Too much air is as bad as too little: below the green the typed page flutters off the platen (TOO MUCH
   AIR!), so blind mashing parks the needle in the blue. Watch the needle: ease off while it is low, burst on the whistle.
   A swing takes a moment, so mashing faster than the leaf can travel only gives half-strokes.
   Grade = time-weighted: green counts 1, yellow and blue 1/2 (0 before the first stroke, so no input = 0), red 0. Level: faster heat, bigger and more frequent spikes, a hotter start, a narrower green.
   Controls: tap or click anywhere, or wave the pointer side to side while pressed; Space / arrows / Enter.
   Layout: 1 sprites · 2 setup · 3 tuning · 4 state · 5 verbs · 6 update · 7 bot · 8 draw · 9 run.
   ============================================================ */
(() => {
  'use strict';
  const { clamp, lerp, sfx } = MG;
  const { R: AR, shapes: { ell, box, poly, cap, or, and } } = MGArt, { make, hl, cvs, text, textW } = MGArt3;
  const TAU = Math.PI * 2, r3 = v => Math.round(v * 3) / 3, INK = '#1a0f14';

  /* ---------- 1. sprites that don't need the desk colour ---------- */
  /* the fan-palm leaf: a stalk from the hands and a pleated fan at the end, painted at a few angles (deg; -90 points straight up) */
  const LEAF_L = 17, LEAF_R = 19, LEAF_N = 9, LEAF_A0 = -134, LEAF_A1 = -46;
  const leafAt = (deg, k = 3, o = {}) => {                                       /* k = hi-res px per unit; pivot at (cx, cy) of the canvas */
    const a = deg * Math.PI / 180, ext = (LEAF_L + LEAF_R + 2) * k, w = Math.ceil(ext * 2), hh = Math.ceil(ext * 1.25), cx = w / 2, cy = ext + 2;
    const cv = make(w, hh, px => {
      const loc = f => (x, y) => { const dx = x - cx, dy = y - cy, c = Math.cos(-a), s = Math.sin(-a); return f((dx * c - dy * s) / k, (dx * s + dy * c) / k); };   /* leaf space: +x along the stalk */
      const fan = (x, y) => { const fx = x - LEAF_L, d = Math.hypot(fx, y), t = Math.atan2(y, fx); return fx > -2 && d < LEAF_R - (Math.abs(Math.sin(t * 9)) * 2.2) * (d > LEAF_R - 4 ? 1 : 0) && Math.abs(t) < 1.05; };
      px.shape(loc((x, y) => x > -1 && x < LEAF_L + 2 && Math.abs(y) < .9), AR.stem, 1);
      px.shape(loc(fan), AR.leaf, 2);
      px.shape(loc((x, y) => { const fx = x - LEAF_L, t = Math.atan2(y, fx); return fan(x, y) && Math.abs(Math.sin(t * 9)) < .22 && Math.hypot(fx, y) > 3; }), AR.leafD, 3);   /* pleats */
      px.shape(loc((x, y) => Math.hypot(x - LEAF_L, y) < 2.6), AR.stem, 4);
      if (o.glint) px.shape(loc((x, y) => { const fx = x - LEAF_L, t = Math.atan2(y, fx); return fan(x, y) && t < -.6 && t > -.85 && Math.hypot(fx, y) > 6; }), AR.leaf, 5);
    });
    cv.px = cx / k; cv.py = cy / k; return cv;
  };
  const LEAVES = Array.from({ length: LEAF_N }, (_, i) => leafAt(lerp(LEAF_A0, LEAF_A1, i / (LEAF_N - 1))));
  const ICON = make(45, 45, px => {                                              /* the HUD's leaf, drawn small on its own */
    const a = -Math.PI / 4, cx = 6, cy = 39, L = 14, RR = 25, c = Math.cos(-a), sn = Math.sin(-a);
    const loc = f => (x, y) => { const dx = x - cx, dy = y - cy; return f(dx * c - dy * sn, dx * sn + dy * c); };
    const fan = (x, y) => { const fx = x - L, d = Math.hypot(fx, y), t = Math.atan2(y, fx); return fx > -3 && d < RR - (d > RR - 6 ? Math.abs(Math.sin(t * 7)) * 4 : 0) && Math.abs(t) < 1.05; };
    px.shape(loc((x, y) => x > -2 && x < L + 3 && Math.abs(y) < 1.6), AR.stem, 1); px.shape(loc(fan), AR.leaf, 2);
    px.shape(loc((x, y) => { const fx = x - L, t = Math.atan2(y, fx); return fan(x, y) && Math.abs(Math.sin(t * 7)) < .2 && Math.hypot(fx, y) > 5; }), AR.leafD, 3);
  });
  /* a typed page blown off the platen: 8 turns of a little sheet with two typed lines */
  const PAGES = Array.from({ length: 8 }, (_, i) => make(24, 24, px => {
    const a = i * Math.PI / 8, c = Math.cos(a), s = Math.sin(a), loc = f => (x, y) => { const dx = x - 12, dy = y - 12; return f(dx * c + dy * s, -dx * s + dy * c); };
    px.shape(loc((x, y) => Math.abs(x) < 6.5 && Math.abs(y) < 8), AR.paper, 1);
    px.shape(loc((x, y) => (Math.abs(y + 3) < .8 || Math.abs(y + .5) < .8 || Math.abs(y - 2) < .8) && x > -4.5 && x < (y > 1 ? 1 : 4.5)), AR.ink, 2);
  }));
  /* the heat dial: value v 0..1 sweeps 210 deg (lower left) to -30 deg (lower right); blue below the green is too much air */
  const angOf = v => (210 - 240 * v) * Math.PI / 180;
  const dialFace = (cold, green, red) => make(114, 114, px => {
    const c = 57, val = (x, y) => { let a = Math.atan2(-(y - c), x - c) * 180 / Math.PI; if (a < -90) a += 360; return (210 - a) / 240; };
    const band = (v0, v1) => (x, y) => { const d = Math.hypot(x - c, y - c), v = val(x, y); return d >= 36 && d <= 46 && v >= v0 && v <= v1; };
    px.shape(ell(c, c, 56, 56), AR.metal, 1); px.shape(ell(c, c, 49, 49), AR.paper, 2);
    px.shape(band(0, cold), AR.ice, 3); px.shape(band(cold, green), AR.leaf, 7); px.shape(band(green, red), AR.pine, 4); px.shape(band(red, 1), AR.red, 5);
    for (let i = 0; i <= 8; i++) { const a = angOf(i / 8), r0 = i % 2 ? 30 : 27; for (let r = r0; r <= 34; r += .5) px.dot(Math.round(c + Math.cos(a) * r), Math.round(c - Math.sin(a) * r), AR.ink, 1, 6); }
    hl(px, 22, 14, 14, 3, 2);
  });

  /* ---------- 2. setup ---------- */
  const R = MGRepair.setup({
    id: 'overheat', verb: 'FAN', scoreIcon: ICON,
    how: '<em>Tap</em> to fan it · keep the needle in the <em>green</em>',
    legend: [[ICON, '<em>tap</em> to swing the leaf'], [MGRepair.parts.typewriter(MGRepair.params.desk), 'the whistle means a <em class="bad">spike</em>'], [PAGES[1], 'too much air blows the <em>page</em> off']],
    hint: 'tap · or Space / arrows',
  });
  const { st, g, W, H, ui, fx, rng, level: LV } = R;
  const [DS, DB, DL] = R.deskRamp;

  /* the machine, half again the kit's size (the kit's typewriter painter, scaled), in the desk colour; plus a red-hot copy to fade over it */
  const K = 1.35, A = AR, dr = R.deskR;
  const MACHINE = make(Math.ceil(138 * K), Math.ceil(99 * K), px => {
    const S = f => (x, y) => f(x / K, y / K);
    px.shape(S(poly([[46, 0], [92, 0], [94, 27], [44, 27]])), A.paper, 1);
    px.shape(S(cap(13, 28, 125, 28, 6.4)), A.ink, 2);
    px.shape(S(or(ell(7, 28, 6, 8), ell(131, 28, 6, 8))), A.metal, 3);
    px.shape(S(cap(14, 21, 3, 9, 2)), A.metal, 3); px.shape(S(ell(3, 9, 3, 3)), A.woodL, 4);
    px.shape(S(or(poly([[20, 36], [118, 36], [134, 90], [4, 90]]), ell(69, 40, 50, 7))), dr, 5);
    for (let y = 0; y < Math.round(4 * K); y++) for (let x = Math.round(6 * K); x < Math.round(132 * K); x++) px.tone(x, Math.round(84 * K) + y, 0);
    px.shape(S(ell(69, 41, 17, 6)), A.metal, 6); px.shape(S(box(59, 39, 20, 3)), A.red, 7);
    px.shape(S(box(61, 47, 16, 4)), A.gold, 6);
    [[54, 10], [64, 9], [74, 8]].forEach(([y, n]) => { for (let i = 0; i < n; i++) { const x = 69 - (n - 1) * 5.5 + i * 11; px.shape(S(ell(x, y, 5.4, 4.8)), A.ink, 8); px.shape(S(ell(x, y - .6, 4, 3.4)), A.paper, 9); } });
    px.shape(S(box(41, 81, 56, 6)), A.ink, 8); px.shape(S(box(42, 81.5, 54, 4)), A.paper, 9);
    for (const vx of [14, 112]) for (let i = 0; i < 4; i++) px.shape(S(box(vx + i * 3.4, 62, 1.6, 14)), A.ink, 10);   /* side vents */
    px.shape(S(or(box(10, 90, 16, 8), box(112, 90, 16, 8))), A.ink, 3);
    px.shape(S(or(box(110, 10, 5, 18), ell(112.5, 9, 4.2, 3.4))), A.gold, 11);                                          /* the steam whistle */
  });
  { const x = MACHINE.getContext('2d'), r = MG.seeded(7); x.fillStyle = '#3a2a30'; for (let y = 5; y < 24; y += 4.6) x.fillRect(Math.round(50 * K), Math.round(y * K), Math.round((10 + Math.floor(r() * 26)) * K), 2); }   /* typed lines on the page */
  /* red-hot whatever the desk colour: a red wash with a white-yellow core band, and a glowing rim (the silhouette grown by 1 unit) */
  const HOT = cvs(MACHINE.width, MACHINE.height, x => { x.drawImage(MACHINE, 0, 0); x.globalCompositeOperation = 'source-atop'; x.fillStyle = 'rgba(255,40,20,.8)'; x.fillRect(0, 0, MACHINE.width, MACHINE.height); x.fillStyle = 'rgba(255,236,170,.5)'; x.fillRect(0, 66, MACHINE.width, 42); x.fillStyle = 'rgba(255,250,220,.35)'; x.fillRect(0, 78, MACHINE.width, 18); });
  const RIM = cvs(MACHINE.width + 6, MACHINE.height + 6, x => {
    for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) if (dx * dx + dy * dy <= 10) x.drawImage(MACHINE, 3 + dx, 3 + dy);
    x.globalCompositeOperation = 'source-in'; x.fillStyle = '#ff3a1a'; x.fillRect(0, 0, MACHINE.width + 6, MACHINE.height + 6);
    x.globalCompositeOperation = 'destination-out'; x.drawImage(MACHINE, 3, 3);
  });
  const MW = MACHINE.width / 3, MH = MACHINE.height / 3;                          /* 62.33 x 44.67 units */

  /* the room, painted once */
  const DESK_Y = 96, FLOOR_TOP = 114, FOOT = 141, MX = r3(60 - MW / 2), MY = r3(DESK_Y - MH + 1), DIAL = { x: 60, y: 25 }, PIV = { x: 60, y: FOOT - 12.33 };   /* the fixer stands clear of the hint line */
  const ROOM = cvs(W * 3, H * 3, x => {
    x.scale(3, 3); const r = (c, a, b, w, hh) => { x.fillStyle = c; x.fillRect(a, b, w, hh); }, s = MG.seeded(9);
    r('#12402a', 0, 0, W, FLOOR_TOP); for (let sx = 0; sx < W; sx += 8) r('#0f3824', sx, 0, 4, FLOOR_TOP);
    r('rgba(4,16,10,.35)', 0, 0, W, FLOOR_TOP);
    r('#1a0f14', 37.67, 2.67, 44.67, 49); r('#5a3517', 38, 3, 44, 48.33); r('#7d4f26', 38, 3, 44, .67); r('#2a170b', 38, 50.67, 44, .67);   /* dial plaque */
    for (const [px2, py] of [[40, 5], [79, 5], [40, 48], [79, 48]]) { r('#1a0f14', px2 - .33, py - .33, 1.67, 1.67); r('#b8b8c4', px2, py, 1, 1); }
    r('#1a0f14', 50.67, 44.67, 18.67, 5.67); r('#e8d8a8', 51, 45, 18, 5); r('#fff6d6', 51, 45, 18, .67);
    r('#1a0f14', 6, DESK_Y - .33, 108.33, 9.67); r('#8a5a2b', 6.33, DESK_Y, 107.67, 3); r('#b57d3e', 6.33, DESK_Y, 107.67, .67); r('#5a3517', 6.33, DESK_Y + 3, 107.67, 6); r('#4a2a12', 6.33, DESK_Y + 8.33, 107.67, .67);   /* desk */
    for (const lx of [9, 106]) { r('#1a0f14', lx - .33, DESK_Y + 9, 5.33, FLOOR_TOP - DESK_Y - 7); r('#6a4120', lx, DESK_Y + 9, 4.67, FLOOR_TOP - DESK_Y - 7); r('#8a5a2b', lx, DESK_Y + 9, 1, FLOOR_TOP - DESK_Y - 7); }
    r('#2a170b', 0, FLOOR_TOP - 3, W, 3); r('#1a0f14', 0, FLOOR_TOP - 3, W, .67);
    for (let y = FLOOR_TOP, i = 0; y < H; y += 6 + i * .67, i++) {
      const bh = 6 + i * .67; r(['#4a2a12', '#5a3517', '#523015'][i % 3], 0, y, W, bh); r('#6a4120', 0, y, W, .67); r('#2a170b', 0, y + bh - .67, W, .67);
      for (let sx = (i * 37) % 31; sx < W; sx += 31 + i * 2) r('#2a170b', sx, y, .67, bh);
      for (let k = 0; k < 5; k++) r('#4a2a12', Math.floor(s() * W), y + 1 + Math.floor(s() * (bh - 2)), 3 + Math.floor(s() * 6), .67);
    }
    r('rgba(0,0,0,.28)', 0, FLOOR_TOP, W, 3);
  });

  /* ---------- 3. tuning ---------- */
  const TUNE = {
    cold: lerp(.3, .34, LV), green: .5, red: .75, start: lerp(.55, .62, LV),   /* the dial's zones (blue below cold); the heat at the whistle (already in the yellow) */
    heat: p => lerp(.205, .26, LV) * (1 + 2 * p), hot: 1.1,                     /* the heat drifts toward hot at this rate (per s); three times as fast by the end */
    every: () => lerp(2.3, 1.6, LV) * rng(.85, 1.15), first: lerp(1.7, 1.2, LV),    /* seconds between spikes; the first one */
    spike: () => lerp(.23, .27, LV) * rng(.9, 1.1), spikeT: .5, warn: .65,     /* heat a spike adds, over spikeT s; the whistle warns warn s ahead */
    cool: lerp(.1, .12, LV), swing: .15,                                        /* heat one full stroke blows off (a fixed amount, so the rate has to follow the dial); seconds for the leaf to cross */
  };
  /* model (.plan/scratch/fix-speed-b/oh-search.cjs, 12 seeds, level 0 / .5 / 1): blind steady tapping peaks near 3.5-4 a second at about
     .78 / .74 / .73; 5 a second about .59, 7+ a second .51 (parked in the blue); a watcher with perfect reactions .97 / .96 / .92 */
  const DIAL_F = dialFace(TUNE.cold, TUNE.green, TUNE.red);

  /* ---------- 4. state ---------- */
  let G;
  function reset() {
    G = {
      H: TUNE.start, coolQ: 0, spikeQ: 0, spikeLeft: 0, next: TUNE.first, warnT: 0,
      side: 1, ang: LEAF_A1, since: 1, strokes: 0, gusts: [], swish: 0, steam: [], steamT: 0, pages: [], pageT: 0,
      tot: 0, score: 0, green: 0, redT: 0, coldT: 0, zone: 2, peak: 0, spikes: 0, beaten: 0, spikeMax: 0, pose: 0, shake: 0, sayCool: 0, sayAir: 0,
      bot: { think: 0, rate: 0, acc: 0, lazy: 0, lazyCd: 2, react: 0, heard: false },
    };
    ui.setScore(0);
  }
  const grade = () => (G.tot > 0 ? G.score / G.tot : 0);
  const pct = v => `${Math.round(v / Math.max(.001, G.tot) * 100)}%`;
  const stats = () => [['IN THE GREEN', pct(G.green)], ['TOO HOT', pct(G.redT)], ['TOO MUCH AIR', pct(G.coldT)], ['SPIKES HELD', `${G.beaten} / ${G.spikes}`]];
  const zoneOf = h => h < TUNE.cold ? 0 : h < TUNE.green ? 1 : h < TUNE.red ? 2 : 3;   /* blue, green, yellow, red */

  /* ---------- 5. verbs: a stroke of the leaf (taps, waves, keys and the bot all call it). Cosmetics use MG.rng only, so the
     gameplay stream (rng: spikes and the bot) stays the same draw for draw whatever the frame rate ---------- */
  const cr = MG.rng;
  function stroke() {
    if (!R.live) return;
    const k = clamp(G.since / TUNE.swing, .3, 1);                               /* a half-finished swing is a weaker gust */
    G.since = 0; G.side = -G.side; G.strokes++; G.swish = .12;
    G.coolQ += TUNE.cool * k;                                                   /* a gust blows off a fixed amount of heat */
    sfx.noise(.09, .05 + .04 * k, 1400 + 1600 * k); sfx.tone(180 + 120 * k, 90, .07, 'triangle', .03);
    for (let i = 0; i < 3 + Math.round(k * 3); i++) G.gusts.push({ x: PIV.x + cr(-22, 22), y: PIV.y - 24 + cr(-5, 5), vx: -G.side * cr(10, 40), vy: -cr(80, 120) * (.6 + .4 * k), t: 0, life: cr(.28, .4), k });   /* air off the leaf, up at the machine */
    for (const c of G.steam) { c.vx += -G.side * cr(14, 30) * k; c.vy -= cr(6, 16) * k; }
  }

  /* ---------- 6. update ---------- */
  function update(dt) {
    const p = R.progress;
    G.since += dt; G.swish = Math.max(0, G.swish - dt); G.pose += dt; G.shake = Math.max(0, G.shake - dt); G.sayCool -= dt; G.sayAir -= dt;
    const tgt = G.side > 0 ? LEAF_A1 : LEAF_A0, sp = (LEAF_A1 - LEAF_A0) / TUNE.swing;   /* the leaf crosses at a fixed speed */
    G.ang += clamp(tgt - G.ang, -sp * dt, sp * dt);
    if (R.live) {
      /* the whistle, then the spike */
      G.next -= dt;
      if (G.next <= TUNE.warn && G.warnT <= 0) { G.warnT = TUNE.warn; sfx.tone(1700, 2300, .45, 'sine', .04); sfx.noise(.5, .03, 5000); }
      if (G.warnT > 0) { G.warnT -= dt; if (cr() < dt * 30) fx.puff(MX + 112.5 * K / 3 + cr(-1, 1), MY + 2, '#f0f0f8', 1); if (cr() < dt * 12) sfx.clack(cr(8)); }
      if (G.next <= 0) {
        const amt = TUNE.spike(); G.spikeQ += amt; G.spikeLeft = TUNE.spikeT; G.spikes++; G.spikeMax = 0; G.next = TUNE.every(); G.warnT = 0; G.shake = .4;
        ui.floatText(MX + 14, MY + 20, 'HOT!', 'bad'); R.shake(2.5); sfx.noise(.35, .08, 1800); sfx.tone(140, 320, .3, 'sawtooth', .05);
        for (let i = 0; i < 6; i++) fx.puff(MX + cr(8, MW - 8), MY + cr(14, 22), '#f0f0f8', 2);
        fx.burst(MX + MW / 2, MY + 20, ['#ffd23a', '#ff7a2a', '#ff5a3c'], 10, 50, 60, .5);
      }
      if (G.spikeLeft > 0) {
        const d = G.spikeQ * Math.min(1, dt / G.spikeLeft); G.H += d; G.spikeQ -= d; G.spikeLeft -= dt;
        G.spikeMax = Math.max(G.spikeMax, G.H);
        if (G.spikeLeft <= 0) { if (G.spikeMax < TUNE.red) { G.beaten++; ui.floatText(MX + MW - 12, MY + 20, 'HELD!', 'ice'); sfx.ding(1); } }
      }
      G.H += TUNE.heat(p) * (TUNE.hot - G.H) * dt;
      /* the gusts land a beat after the stroke */
      const c = G.coolQ * Math.min(1, dt * 12); G.H -= c; G.coolQ -= c;
      G.H = clamp(G.H, .06, 1.15); G.peak = Math.max(G.peak, G.H);
      /* grading: green counts in full, yellow and blue half (once you are fanning), red nothing */
      const z = zoneOf(G.H); G.tot += dt; G.score += dt * [G.strokes ? .5 : 0, 1, G.strokes ? .5 : 0, 0][z]; if (z === 1) G.green += dt; if (z === 3) G.redT += dt; if (z === 0) G.coldT += dt;
      if (z === 3 && G.zone < 3) { ui.say('TOO HOT!', 'bad'); sfx.tone(300, 200, .2, 'square', .04); ui.doFlash('rgba(255,60,20,.25)'); }
      if (z < 3 && G.zone === 3) { ui.floatText(MX + MW / 2, MY + 26, 'PHEW', 'ice'); ui.hideBanner(); }
      if (z === 1 && G.zone > 1 && G.sayCool <= 0) { G.sayCool = 1.5; ui.floatText(DIAL.x + 16, DIAL.y + 8, 'COOL', 'ice'); sfx.tone(900, 1300, .08, 'sine', .035); }
      if (z === 0 && G.zone > 0) {                                                 /* over-fanned: the page starts to go */
        G.pageT = 0;
        if (G.sayAir <= 0) { G.sayAir = 1.6; ui.floatText(60, MY + 6, 'TOO MUCH AIR!', 'bad'); sfx.noise(.18, .05, 6000); sfx.tone(600, 380, .12, 'triangle', .03); }
      }
      G.zone = z; ui.setScore(Math.round(grade() * 100));
    } else if (R.done && R.won) G.H = Math.max(lerp(TUNE.cold, TUNE.green, .4), G.H - dt * .8);   /* fixed: it cools down into the green */
    /* too much air: typed pages flutter off the platen and blow away */
    if (R.live && G.H < TUNE.cold && (G.pageT -= dt) <= 0) {
      const x = MX + cr(22, 40), side = x < 60 ? -1 : 1;                           /* they blow out sideways, clear of the dial */
      G.pageT = cr(.18, .32); G.pages.push({ x, y: MY + cr(2, 6), vx: side * cr(30, 55), vy: -cr(6, 16), t: 0, life: cr(.9, 1.3), f: Math.floor(cr(8)), ph: cr(TAU) });
      if (cr() < .5) sfx.noise(.07, .025, 5200);
    }
    for (const q of G.pages) { q.t += dt; q.x += q.vx * dt; q.y += (q.vy + Math.sin(q.t * 11 + q.ph) * 14) * dt; q.vy += 26 * dt; q.vx *= 1 - dt * .6; }
    G.pages = G.pages.filter(q => q.t < q.life);
    /* steam and embers by heat */
    const hk = clamp((G.H - .3) / .6, 0, 1);
    if ((G.steamT -= dt * (2.5 + hk * 14)) <= 0) {                                 /* steam billows from the vents and the platen ends */
      G.steamT += 1; const side = MG.rng() < .5 ? 0 : 1, top = MG.rng() < .4;
      G.steam.push({ x: top ? MX + (side ? MW - 6 : 6) : MX + (side ? MW - 9 : 9) + MG.rng(-3, 3), y: MY + (top ? 9 : 26), vx: (side ? 1 : -1) * MG.rng(2, 8), vy: -MG.rng(10, 18), r: MG.rng(2, 3), t: 0, life: MG.rng(.8, 1.3) });
    }
    for (const c of G.steam) { c.t += dt; c.x += c.vx * dt; c.y += c.vy * dt; c.vx *= 1 - dt * 1.5; c.r += dt * 3.6; }
    G.steam = G.steam.filter(c => c.t < c.life && c.y > -6);
    if (hk > .6 && cr() < dt * 10 * hk) fx.spark(MX + cr(10, MW - 10), MY + cr(14, 30), cr() < .5 ? '#ffd23a' : '#ff7a2a');
    for (const w of G.gusts) { w.t += dt; w.x += w.vx * dt; w.y += w.vy * dt; w.vy *= 1 - dt * 2; }
    G.gusts = G.gusts.filter(w => w.t < w.life);
  }

  /* ---------- 7. bot (?bot=1): taps like a person watching the dial and listening for the whistle. It aims somewhere in the green
     (a new guess every glance): easy taps while the needle is above its aim, a rest below it, nothing at all near the blue, and a hard
     burst when the needle nears the yellow, a spike lands or (after a reaction delay) the whistle blows. A jittery rhythm, and now and
     then it zones out for a moment. Grades land around .7-.9. ---------- */
  function bot(dt) {
    const B = G.bot;
    B.lazyCd -= dt;
    if (G.warnT > 0 && !B.heard) B.react = rng(.12, .32); B.heard = G.warnT > 0;
    if ((B.think -= dt) <= 0) {
      B.think = rng(.15, .3);
      const aim = lerp(TUNE.cold, TUNE.green, rng(.35, .65));
      const alarm = (G.warnT > 0 && TUNE.warn - G.warnT > B.react) || G.spikeLeft > 0 || G.H > TUNE.green - rng(.01, .05);
      B.rate = G.H < TUNE.cold + rng(.01, .04) ? 0 : alarm ? rng(4.8, 6.8) : G.H > aim ? rng(2.4, 4.2) : rng(0, 1.2);
      if (B.lazyCd <= 0 && rng() < .06) { B.lazy = rng(.5, 1); B.lazyCd = 2.5; }
    }
    if (B.lazy > 0) { B.lazy -= dt; return; }
    B.acc += B.rate * dt; if (B.acc >= 1) { B.acc -= 1 + rng(-.2, .2); stroke(); }
  }

  /* ---------- 8. draw ---------- */
  const oval = (cx, cy, rx, ry, col) => {
    g.fillStyle = col; const n = Math.max(1, Math.round(ry * 3));
    for (let i = -n; i <= n; i++) { const yy = i / 3, w = rx * Math.sqrt(Math.max(0, 1 - (yy * yy) / (ry * ry))); if (w > 0) g.fillRect(r3(cx - w), r3(cy + yy), Math.round(w * 6) / 3, 1 / 3); }
  };
  const dot = (x, y, s, col) => { g.fillStyle = col; g.fillRect(r3(x - s / 2), r3(y - s / 2), s, s); };
  const line = (x0, y0, x1, y1, s, col) => { const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2); for (let i = 0; i <= n; i++) dot(lerp(x0, x1, i / n), lerp(y0, y1, i / n), s, col); };
  function drawDial(now) {
    st.hi(DIAL_F, DIAL.x - 19, DIAL.y - 19);
    const jit = G.H > .6 ? (MG.rng() - .5) * .03 * (1 + (G.H - .6) * 8) : 0, a = angOf(clamp(G.H + jit, 0, 1.04));
    line(DIAL.x, DIAL.y, DIAL.x + Math.cos(a) * 13, DIAL.y - Math.sin(a) * 13, 1.33, INK); line(DIAL.x, DIAL.y, DIAL.x + Math.cos(a) * 12.67, DIAL.y - Math.sin(a) * 12.67, .67, '#d0302a');
    oval(DIAL.x, DIAL.y, 2.33, 2.33, INK); oval(DIAL.x, DIAL.y, 1.67, 1.67, '#b8b8c4');
    const t = 'HEAT', tw = textW(t, .5), blink = Math.floor(now * 10) % 2;
    text(g, t, DIAL.x - tw / 2, 45.67, G.H >= TUNE.red && blink ? '#d0302a' : G.H < TUNE.cold && R.live && blink ? '#2a86b8' : '#3a2a30', .5);
  }
  function drawMachine(now) {
    const hk = clamp((G.H - .3) / .45, 0, 1), jx = G.H > .62 || G.shake > 0 ? (Math.floor(now * 30) % 2 ? .33 : -.33) : 0;
    for (let i = 4; i >= 1; i--) oval(60, MY + MH * .6, MW * .5 + i * 4 * hk, MH * .5 + i * 3 * hk, `rgba(255,${90 + i * 20},30,${(hk * .1).toFixed(3)})`);   /* heat glow */
    if (G.H >= TUNE.green) { g.globalAlpha = clamp(.35 + (G.H - TUNE.green) * 2.6, 0, 1) * (.6 + .4 * Math.sin(now * (G.H >= TUNE.red ? 16 : 8))); st.hi(RIM, MX + jx - 1, MY - 1); g.globalAlpha = 1; }   /* the red-hot rim, any desk colour */
    st.hi(MACHINE, MX + jx, MY);
    if (hk > 0) { g.globalAlpha = hk * (.75 + .25 * Math.sin(now * 9)); st.hi(HOT, MX + jx, MY); g.globalAlpha = 1; }
    if (hk > .2) for (const vx of [14, 112]) for (let i = 0; i < 4; i++) { g.fillStyle = `rgba(255,${Math.round(120 + 100 * hk)},40,${(hk).toFixed(2)})`; g.fillRect(r3(MX + jx + (vx + i * 3.4) * K / 3 + .33), r3(MY + 62 * K / 3 + .67), .67, r3(14 * K / 3 - 1.33)); }   /* the vents glow */
    g.fillStyle = `rgba(255,150,60,${(hk * .8).toFixed(2)})`;                                                /* heat shimmer over the machine */
    for (const sx of [MX + 7, MX + MW - 7]) for (let j = 0; j < 14; j += .67) g.fillRect(r3(sx + Math.sin(j * .9 - now * 9) * 1.4), r3(MY - 3 - j), .67, .67);
    if (G.warnT > 0) {                                                                                      /* the whistle: a jet of steam and a "!" */
      const wx = MX + 112.5 * K / 3, wy = MY + 2;
      for (let i = 0; i < 5; i++) { const u = (now * 3 + i / 5) % 1; oval(wx + u * 6, wy - 2 - u * 12, 1 + u * 3, .8 + u * 2.4, `rgba(240,240,248,${(.8 - u * .7).toFixed(2)})`); }
      if (Math.floor(now * 8) % 2) { g.fillStyle = INK; g.fillRect(wx - 9.33, wy - 12.33, 5.67, 8.67); g.fillStyle = '#ffd23a'; g.fillRect(wx - 9, wy - 12, 5, 8); text(g, '!', wx - 8.17, wy - 11.17, INK, .67); }
    }
  }
  function drawLeaf() {
    const fi = a => clamp(Math.round((a - LEAF_A0) / (LEAF_A1 - LEAF_A0) * (LEAF_N - 1)), 0, LEAF_N - 1), f = fi(G.ang), L = LEAVES[f];
    if (G.swish > 0) { const b = LEAVES[clamp(f + (G.side > 0 ? -2 : 2), 0, LEAF_N - 1)]; g.globalAlpha = .35; st.hi(b, PIV.x - b.px, PIV.y - b.py); g.globalAlpha = 1; }   /* a smear behind the swing */
    st.hi(L, PIV.x - L.px, PIV.y - L.py);
  }
  function drawFixer() {
    let pose = G.swish > 0 ? (G.side > 0 ? 'hold1' : 'hold2') : 'hold0';
    if (R.done && !R.won) pose = 'holdhit';
    oval(PIV.x, FOOT + .33, 6.5, 1.67, 'rgba(10,6,4,.5)');
    R.crew(PIV.x, FOOT, pose, { flip: G.side < 0, expr: G.H >= TUNE.red ? 'screech' : undefined });
  }
  function draw() {
    const now = performance.now() / 1000, hot = clamp((G.H - .45) / .5, 0, 1);
    st.hi(ROOM, 0, 0);
    drawDial(now); drawMachine(now);
    for (const c of G.steam) {                                                                              /* steam: a white clump of three puffs, shaded underneath */
      const k = 1 - c.t / c.life, a = Math.min(1, k * 1.6) * .9, r = c.r;
      g.globalAlpha = a; oval(c.x - r * .55, c.y + r * .15, r * .62, r * .5, '#b8bccc'); oval(c.x + r * .5, c.y + r * .2, r * .6, r * .48, '#b8bccc'); oval(c.x, c.y + r * .25, r * .8, r * .55, '#b8bccc');
      oval(c.x - r * .55, c.y, r * .55, r * .45, '#e8eaf2'); oval(c.x + r * .5, c.y + .05, r * .52, r * .42, '#e8eaf2'); oval(c.x, c.y - r * .2, r * .7, r * .55, '#f4f5fa');
      oval(c.x - r * .25, c.y - r * .45, r * .3, r * .2, '#ffffff'); g.globalAlpha = 1;
    }
    for (const q of G.pages) { const P = PAGES[(q.f + Math.floor(q.t * 14)) % 8]; g.globalAlpha = Math.min(1, (q.life - q.t) * 4); st.hi(P, q.x - 4, q.y - 4); g.globalAlpha = 1; }   /* pages blowing off */
    fx.draw(g);
    for (const w of G.gusts) { const k = 1 - w.t / w.life; g.globalAlpha = k; line(w.x, w.y, w.x - w.vx * .06, w.y - w.vy * .06, .67 + w.k * .33, '#e8f6ff'); g.globalAlpha = 1; }
    drawFixer(); drawLeaf();
    if (hot > 0) { g.fillStyle = `rgba(255,60,20,${(hot * .12).toFixed(3)})`; g.fillRect(0, 0, W, H); }
    if (G.H >= TUNE.red && R.live) { const a = (.25 + .2 * Math.sin(now * 14)).toFixed(2); g.fillStyle = `rgba(255,40,20,${a})`; g.fillRect(0, 0, W, 2); g.fillRect(0, H - 2, W, 2); g.fillRect(0, 0, 2, H); g.fillRect(W - 2, 0, 2, H); }
  }

  /* ---------- 9. input + run: a tap is a stroke; so is each turn of a side-to-side wave while pressed ---------- */
  let waveDir = 0, waveX = 0;
  window.OVERHEAT = { get G() { return G; }, stroke, TUNE };
  R.run({
    reset, update, draw, grade, stats, bot,
    ended() { G.gusts = []; G.warnT = 0; if (R.won) for (let i = 0; i < 8; i++) fx.puff(MX + cr(8, MW - 8), MY + cr(10, 30), '#9be8ff', 2); },
    down(x) { stroke(); waveDir = 0; waveX = x; },
    move(x) {
      if (!R.ptr.down) return;
      const d = x - waveX; if (Math.abs(d) < 5) return;
      const dir = Math.sign(d); if (dir !== waveDir && waveDir !== 0) stroke(); waveDir = dir; waveX = x;
    },
    key(ev, k) { if (!ev.repeat && (k === ' ' || k === 'enter' || k.startsWith('arrow') || k === 'a' || k === 'd' || k === 'w' || k === 's')) stroke(); },
  });
})();
