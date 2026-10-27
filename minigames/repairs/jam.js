/* ============================================================
   INK JAM (repair "jam", verb SCRUB, 10 s). The ribbon has spat ink all over the typebar heads in the basket.
   The fixer stands on the keys with a rag on a stick: rub each blotted head clean before the ink sets. Only a moving rag cleans,
   and the ring of dots round a blot is its drying clock. New splats arc down off the ribbon through the run.
   Grade = the mean cleaned share over every blot that landed (a set blot keeps half of what was rubbed off before it dried).
   Level: more blots, faster drying, thicker ink, more double splats.
   Controls: move the mouse / drag a finger over a blot and keep rubbing; keys: ← → (A D) hop between heads, hold Space / ↑ / ↓ to rub.
   Layout: 1 sprites · 2 setup · 3 tuning · 4 state · 5 verbs · 6 update · 7 bot · 8 draw · 9 run (as leak.js).
   ============================================================ */
(() => {
  'use strict';
  const { clamp, lerp, sfx } = MG;
  const { R: AR, shapes: { ell, box, cap, and, or, sub } } = MGArt, { make, hl, cvs, text, textW } = MGArt3;

  /* ---------- 1. sprites that don't need the desk colour (hi-res, 3 px per unit) ---------- */
  const LETTERS = 'ETAOINSHR';                                                  /* etaoin shrdlu: the old linotype's "this line is ruined" */
  const HEADS = {};
  const headSpr = (ch, shine) => HEADS[ch + shine] || (HEADS[ch + shine] = (() => {   /* a typebar slug, face-on, 11x11 units */
    const cv = make(33, 33, px => { px.shape(box(2, 2, 29, 29), AR.metal, 1); px.shape(box(6, 6, 21, 21), AR.metal, 2); hl(px, 3, 3, 2, 26, 2); if (shine) { hl(px, 7, 7, 19, 2, 2); hl(px, 7, 9, 2, 16, 2); } });
    text(cv.getContext('2d'), ch, 9, 6, '#1a0f14', 3); return cv;
  })());
  const splatOf = (s, v) => {                                                   /* a splat 16 units across at s = 1: a body, lobes round it, a few flung drops */
    const r = MG.seeded(31 + v * 7), parts = [ell(24, 24, 12 * s, 11 * s)];
    for (let i = 0; i < 7; i++) { const a = i / 7 * 6.28 + r() * .6, d = (9 + r() * 3) * s, rr = (3.2 + r() * 2.4) * s; parts.push(ell(24 + Math.cos(a) * d, 24 + Math.sin(a) * d, rr, rr)); }
    if (s > .6) for (let i = 0; i < 2 + v % 2; i++) { const a = r() * 6.28, d = (17 + r() * 3) * s, rr = 1.6 + r() * 1.2; parts.push(ell(24 + Math.cos(a) * d, 24 + Math.sin(a) * d, rr, rr)); }
    return or(...parts);
  };
  const CRUST = MGArt.R.jamCrust || (MGArt.R.jamCrust = MGArt.ramps.push(['#2a2630', '#4e4856', '#746c7c'].map(MGArt.hex)) - 1);   /* set ink: a dull slate crust */
  const BLOT = [0, 1, 2].map(v => [1, .8, .6, .4].map(s => [false, true].map(dry => {   /* [variant][size][dry] */
    const cv = make(48, 48, px => {
      px.shape(splatOf(s, v), dry ? CRUST : AR.ink, 1);
      if (dry) { const r = MG.seeded(5 + v); for (let i = 0; i < 16 * s; i++) { const x = 24 + Math.round((r() - .5) * 20 * s), y = 24 + Math.round((r() - .5) * 18 * s); px.tone(x, y, 2); px.tone(x + 1, y, 2); } }
    });
    const x = cv.getContext('2d'), P = (a, b, w, hh, c) => { x.fillStyle = c; x.fillRect(Math.round(24 + a * s), Math.round(24 + b * s), Math.max(1, Math.round(w * s)), Math.max(1, Math.round(hh * s))); };
    if (!dry) { P(-8, -7, 6, 2, '#6f7fb8'); P(-8, -5, 2, 4, '#6f7fb8'); P(-6, -7, 2, 1, '#d6e0ff'); P(4, 5, 3, 1, '#3a4670'); }   /* wet ink shines */
    else for (const [a, b, w, hh] of [[-7, -1, 7, 1], [0, -1, 1, 6], [0, 4, 6, 1], [5, -5, 1, 5], [-4, -6, 1, 5]]) P(a, b, w, hh, '#1a0f14');   /* dried: dull and cracked */
    return cv;
  })));
  const GLOB = make(15, 19, px => { px.shape(or(ell(7.5, 12.5, 6, 6), and(cap(7.5, 1, 7.5, 10, 4), (x, y) => y > 0)), AR.ink, 1); px.tone(4, 10, 2); px.tone(4, 11, 2); px.tone(5, 9, 2); });
  const RAG = [0, 1, 2, 3].map(dirt => make(36, 30, px => {                     /* a red shop rag, bunched; it soaks up ink as it works */
    const body = or(ell(18, 17, 16, 10), ell(9, 10, 7, 6.5), ell(26, 9, 8, 6.5));
    px.shape(body, AR.red, 1); px.shape(and(body, or(box(0, 11, 36, 2), box(0, 20, 36, 2))), AR.paper, 2);
    px.shape(and(body, or(cap(11, 6, 15, 16, .8), cap(24, 5, 21, 15, .8), cap(6, 18, 14, 24, .8))), AR.red, 3); px.tone(12, 9, 0); px.tone(23, 8, 0);
    const spots = [[12, 19, 3.4, 2.6], [24, 14, 2.6, 2.2], [17, 24, 2.8, 2], [27, 21, 2.2, 2], [8, 13, 2, 1.8]];
    if (dirt) px.shape(and(body, or(...spots.slice(0, dirt * 2 - 1).map(([x, y, a, b]) => ell(x, y, a, b)))), AR.ink, 4);
  }));
  const BOTTLE = make(66, 36, px => {                                           /* the ink bottle that tipped over and started all this */
    px.shape(or(cap(15, 19, 36, 19, 13), box(36, 13, 12, 12)), AR.grape, 1); px.shape(box(48, 11, 8, 16), AR.woodD, 2);
    px.shape(box(13, 10, 21, 18), AR.paper, 3); hl(px, 8, 9, 3, 6, 2);
  });
  text(BOTTLE.getContext('2d'), 'INK', 15, 15, '#1a0f14', 1);
  const ICON = BLOT[0][1][0];

  /* ---------- 2. setup ---------- */
  const R = MGRepair.setup({
    id: 'jam', verb: 'SCRUB', scoreIcon: ICON,
    how: 'Rub the <em>ink</em> off the heads before it sets',
    legend: [[BLOT[1][0][0], '<em>rub</em> wet ink off'], [BLOT[1][0][1], 'set ink <em class="bad">stays</em>']],
    hint: 'move · drag to rub · ← → and Space',
  });
  const { st, g, W, H, ui, fx, rng, level: LV } = R;

  /* geometry: the basket fans out under the type guide; the fixer walks the key row below it */
  const HUB = { x: 60, y: 50 }, RH = 46, HALF = 5.5, FOOT = 123, HANDS = FOOT - 12.33, Y0 = 36;
  const SPOTS = LETTERS.split('').map((ch, i) => { const a = (16 + i * 18.5) * Math.PI / 180; return { ch, i, a, x: HUB.x + Math.cos(a) * RH, y: HUB.y + Math.sin(a) * RH }; });
  const SPOOL = MGRepair.parts.spool(.7, { ramp: AR.red });
  /* the machine body in the desk colour: a frame round the opening onto the basket, the key row and the name plate */
  const BODY = make(360, 300, px => {                                            /* units y 36..136 */
    const hole = or(ell(180, (HUB.y - Y0) * 3, 174, 171), box(15, 0, 330, (HUB.y - Y0) * 3));
    px.shape(sub(or(box(0, 6, 360, 294), ell(180, 6, 180, 12)), hole), R.deskR, 1);
    hl(px, 0, 216, 360, 3, 0);
    for (let i = 0; i < 10; i++) { const x = 36 + i * 32; px.shape(ell(x, 249, 13, 11), AR.ink, 2); px.shape(ell(x, 247, 11, 9), AR.paper, 3); }   /* the key row the fixer stands on */
    px.shape(box(118, 272, 124, 18), AR.gold, 2);
    px.shape(or(ell(12, 296, 10, 6), ell(348, 296, 10, 6)), AR.ink, 2);
  });
  { const x = BODY.getContext('2d'), nm = MGRepair.DESKS[R.desk].name.toUpperCase(); text(x, nm, 180 - textW(nm, 1) / 2, 278, '#1a0f14', 1); }
  const FAN = make(360, 216, px => {                                             /* units y 36..108: the segment, the bars and the felt rest they lie on */
    const U = (x, y) => [x * 3, (y - Y0) * 3], [hx, hy] = U(HUB.x, HUB.y);
    px.shape((x, y) => { const dx = x - hx, dy = y - hy, r = Math.hypot(dx, dy) / 3, a = Math.atan2(dy, dx) * 180 / Math.PI; return r >= 50 && r <= 55 && a >= 6 && a <= 174; }, AR.leafD, 1);
    for (const s of SPOTS) { const [a, b] = U(HUB.x + Math.cos(s.a) * 15, HUB.y + Math.sin(s.a) * 15), [c, d] = U(s.x - Math.cos(s.a) * 4, s.y - Math.sin(s.a) * 4); px.shape(cap(a, b, c, d, 2.4), AR.metal, 2); }
    px.shape((x, y) => { const dx = x - hx, dy = y - hy, r = Math.hypot(dx, dy) / 3; return dy > -6 && r >= 10 && r <= 16; }, AR.metal, 3);
    for (const s of SPOTS) { const [a, b] = U(HUB.x + Math.cos(s.a) * 10.5, HUB.y + Math.sin(s.a) * 10.5), [c, d] = U(HUB.x + Math.cos(s.a) * 15.5, HUB.y + Math.sin(s.a) * 15.5); px.shape(cap(a, b, c, d, 1), AR.ink, 4); }
    px.shape(box(hx - 9, hy - 18, 18, 14), AR.metal, 5); px.shape(box(hx - 5, hy - 15, 10, 8), AR.ink, 6);   /* the type guide the bars strike through */
  });
  const PLATEN = make(360, 36, px => { px.shape(cap(30, 18, 330, 18, 13), AR.ink, 1); hl(px, 30, 9, 300, 2, 2); px.shape(or(ell(15, 18, 13, 17), ell(345, 18, 13, 17)), AR.metal, 2); px.shape(or(box(26, 14, 8, 8), box(326, 14, 8, 8)), AR.metal, 3); });
  const ROOM = cvs(W * 3, H * 3, x => {
    const r = (c, a, b, w, hh) => { x.fillStyle = c; x.fillRect(a * 3, b * 3, w * 3, hh * 3); };
    r('#1d1418', 0, 0, W, H); r('#160f12', 0, 0, W, 30);
    r('#1a0f14', 33.67, 0, 52.67, 31); r('#fff6d6', 34, 0, 52, 30.67); r('#ede0b8', 34, 0, 1, 30.67);                            /* the sheet in the machine (its lines start under the timer bar) */
    for (let i = 0; i < 4; i++) text(x, i === 3 ? 'ETAOIN SHR' : 'ETAOIN SHRDLU', 112, 16 + i * 15, i === 3 ? '#8a7a80' : '#3a2a30', 1);
    x.fillStyle = '#1a0f14'; for (const [a, b, w] of [[150, 70, 12], [196, 33, 7], [168, 76, 4]]) { x.fillRect(a, b, w, w * .8); x.fillRect(a + w * .3, b + w * .7, 2, w * .6); }   /* ink spatter on the page */
    r('#2a1d22', 0, Y0, W, H - Y0);
    x.drawImage(FAN, 0, Y0 * 3);
    x.drawImage(BODY, 0, Y0 * 3);
    x.drawImage(PLATEN, 0, 22 * 3);
    r('#1a0f14', 14, 40.33, 92, 5); r('#b8322a', 14, 40.67, 92, 2); r('#e86a50', 14, 40.67, 92, .67); r('#2a1d22', 14, 42.67, 92, 2);   /* the ribbon, red over black */
    for (let i = 0; i < 3; i++) { r('#0d0708', 42 + i * 13, 42.67, 3 + i, 2.33); }                                                   /* ink oozing from it */
    x.drawImage(SPOOL, (13 - 7.5) * 3, (43 - 7.5) * 3); x.drawImage(SPOOL, (107 - 7.5) * 3, (43 - 7.5) * 3);
    r('#3a210d', 0, 136, W, 24); r('#1a0f14', 0, 136, W, .67); for (let y = 137; y < H; y += 6) { r('#4a2a12', 0, y, W, 5.33); r('#5a3517', 0, y, W, .67); }   /* the desk */
    r('rgba(0,0,0,.4)', 4, 136.67, 112, 2.33);
    x.fillStyle = '#0d0708'; for (const [a, b, w, hh] of [[24, 147.33, 26, 4], [30, 146, 14, 6.67], [46, 149.67, 12, 2.33], [60, 150.33, 3, 1.33]]) x.fillRect(a * 3, b * 3, w * 3, hh * 3);   /* its puddle */
    r('#3a4670', 31, 147, 7, .67);
    x.drawImage(BOTTLE, 6 * 3, 140 * 3);
  });

  /* ---------- 3. tuning ---------- */
  const TUNE = {
    blots: 9 + Math.round(LV * 2),                                              /* 9..11 blots over the run */
    first: 3,                                                                   /* inky from the first frame */
    set: p => lerp(2.45, 2.4, LV) * lerp(1.2, .85, p),                          /* seconds a blot stays wet (the first ones get a grace) */
    ink: lerp(1.05, 1.12, LV),                                                  /* how thick: rag travel needed = ink / rub */
    pair: p => p < .2 ? 0 : lerp(.15, .35, LV),                                 /* chance a splat hits two neighbouring heads */
    rub: 1 / 66, reach: 7.5, stepMax: 2.5,                                      /* ink off per unit of rag travel; rag-to-head reach; rub cap per step (150 u/s: a frantic wipe is no faster) */
    setKeep: .5,                                                                /* a blot that sets keeps half of what was rubbed off it */
    last: 1.4, fly: .42,                                                        /* no splats in the last 1.4 s; glob flight time */
  };
  const X_MIN = 6, X_MAX = W - 6, Y_MIN = 46, Y_MAX = 112;

  /* ---------- 4. state ---------- */
  let G;
  function reset() {
    const heads = SPOTS.map(s => ({ ...s, blot: null, shine: 0, cool: 0 }));
    const plan = [], late = TUNE.blots - TUNE.first, end = R.seconds - TUNE.last;
    for (let i = 0; i < late; i++) plan.push(lerp(.9, end, late > 1 ? i / (late - 1) : .5) + rng(-.35, .35));
    G = {
      heads, plan: plan.sort((a, b) => a - b), globs: [], left: late, landed: 0, cleaned: 0, setN: 0, score: 0, combo: 0, bestCombo: 0,
      rx: 96, ry: 110, ax: 96, ay: 110, jump: true, mx: 92, face: -1, walk: 0, rubT: 0, squeak: 0, dirt: 0, bank: 0, keyed: false, sel: 1, scrub: 0, wig: 0, early: false,
      bot: { target: null, react: .25, err: [0, 0], ph: 0 },
    };
    const pick = [0, 2, 4, 6, 8].sort(() => rng() - .5).slice(0, TUNE.first);
    for (const i of pick) land(G.heads[i], true);
    ui.setScore(0);
  }
  const blotScore = b => clamp(1 - b.ink / b.ink0, 0, 1);
  const grade = () => { let s = G.score; for (const h of G.heads) if (h.blot && !h.blot.set) s += blotScore(h.blot); return s / Math.max(1, G.landed); };
  const stats = () => [['CLEANED', `${G.cleaned} / ${G.landed}`], ['INK SET', G.setN], ['BEST CHAIN', G.bestCombo], ...(G.early && R.timer.left >= .5 ? [['TIME LEFT', R.timer.left.toFixed(1) + 's']] : [])];

  /* ---------- 5. verbs: a splat lands; rubbing takes ink off; ink cleaned or set ---------- */
  const say = (x, y, s, c) => ui.floatText(clamp(x, 3 + s.length * 2.3, W - 3 - s.length * 2.3), y, s, c);   /* a float that stays on the stage at phone scale */
  function land(h, quiet) {
    h.blot = { ink: TUNE.ink, ink0: TUNE.ink, age: 0, setT: TUNE.set(R.progress), v: Math.floor(rng(3)), hit: .2 }; G.landed++;
    if (quiet) return;
    fx.burst(h.x, h.y, ['#1a0f14', '#3a2a30', '#0d0708'], 9, 40, 140, .4); sfx.noise(.09, .07, 700); sfx.tone(190, 70, .1, 'triangle', .05); R.shake(1.2);
  }
  function splat() {                                                            /* a glob arcs off the ribbon onto a clean head (or two neighbours) */
    const free = G.heads.filter(h => !h.blot && h.cool <= 0 && !G.globs.some(o => o.h === h));
    if (!free.length) return false;
    const h = free[Math.floor(rng(free.length))], two = G.left > 1 && rng() < TUNE.pair(R.progress) && free.find(o => Math.abs(o.i - h.i) === 1);
    for (const t of two ? [h, two] : [h]) { G.globs.push({ h: t, t: 0, x0: 45 + rng(30), y0: 43 }); G.left--; }
    sfx.tone(520, 260, .09, 'sine', .04); return true;
  }
  function rubAt(x, y, d) {                                                     /* d units of rag travel at (x, y): only the nearest wet head in reach takes it (a sweep can't clean two at once) */
    let h = null, hd = TUNE.reach;
    for (const o of G.heads) { const dd = Math.hypot(o.x - x, o.y - y); if (o.blot && !o.blot.set && dd <= hd) { h = o; hd = dd; } }
    if (!h) return;
    const b = h.blot; b.ink -= d * TUNE.rub; G.dirt = Math.min(3, G.dirt + d * .004); G.scrub = .12;
    if (MG.rng() < d * .12) fx.burst(x + MG.rng(-3, 3), y + MG.rng(-2, 2), ['#1a0f14', '#3a2a30'], 1, 26, 90, .3);
    if ((G.squeak -= d) <= 0) { G.squeak = 9; sfx.tone(G.wig ? 1500 : 1180, G.wig ? 1300 : 1050, .045, 'sine', .025); G.wig = !G.wig; }
    if (b.ink <= 0) clean(h);
  }
  function clean(h) {
    h.blot = null; h.shine = .6; h.cool = .5; G.score++; G.cleaned++; G.combo++; G.bestCombo = Math.max(G.bestCombo, G.combo);
    fx.burst(h.x, h.y, ['#f0f0f8', '#fffbe0', '#9be8ff'], 8, 34, 40, .4); fx.ring(h.x, h.y, '#fffbe0', 10); for (let i = 0; i < 3; i++) fx.spark(h.x, h.y, '#ffffff');
    sfx.ding(Math.min(8, G.combo)); sfx.tone(1900, 2600, .08, 'sine', .04, .04);
    ui.setScore(G.cleaned); ui.bump(); ui.setCombo(G.combo, 1); if (G.combo >= 3) ui.pulseCombo();
    say(h.x, h.y - 10, G.combo >= 3 ? `${G.combo} CLEAN!` : 'CLEAN!', G.combo >= 3 ? 'gold' : '');
  }
  function setIn(h) {
    const b = h.blot; b.set = true; G.score += blotScore(b) * TUNE.setKeep; G.setN++; G.combo = 0; ui.setCombo(0, 1);
    sfx.noise(.16, .06, 2400); sfx.tone(240, 120, .14, 'sawtooth', .035); fx.puff(h.x, h.y - 2, '#5c4650', 4); fx.ring(h.x, h.y, '#ff5a3a', 8);
    say(h.x, h.y - 13, 'SET!', 'bad');
  }

  /* ---------- 6. update ---------- */
  function update(dt) {
    const p = R.progress, now = R.t;
    /* keys: hop the rag between heads, hold Space / up / down to rub in place (about as fast as a brisk hand on the pointer) */
    const kr = R.held(' ', 'arrowup', 'arrowdown', 'w', 's');
    if (G.keyed) {
      const s = G.heads[G.sel], tx = s.x + (kr ? Math.cos(now * 44) * 3.8 : 0), ty = s.y + (kr ? Math.sin(now * 57) * 3 : 0), k = Math.min(1, dt * (kr ? 40 : 16));
      G.ax = lerp(G.ax, tx, k); G.ay = lerp(G.ay, ty, k);
    }
    /* the rag goes where it is aimed; only its travel over wet ink cleans (a jump is not a rub). The rub cap is banked over 3 steps, so a
       pointer that only moves every other step (a phone at 30 fps) rubs as fast as one that moves every step */
    const ox = G.rx, oy = G.ry; G.rx = clamp(G.ax, X_MIN, X_MAX); G.ry = clamp(G.ay, Y_MIN, Y_MAX);
    G.bank = Math.min(TUNE.stepMax * 3, G.bank + TUNE.stepMax);
    const d = G.jump ? 0 : Math.min(G.bank, Math.hypot(G.rx - ox, G.ry - oy)); G.jump = false; G.bank -= d;
    G.scrub = Math.max(0, G.scrub - dt);
    if (R.live && d > .05) rubAt(G.rx, G.ry, d);
    /* the fixer shuffles along the key row under the rag */
    const want = clamp(G.rx + (G.rx < 60 ? 9 : -9), 12, W - 12), v = clamp((want - G.mx) * 6, -70, 70);
    G.mx += v * dt; if (Math.abs(v) > 6) { G.walk += Math.abs(v) * dt; G.face = Math.sign(v); }
    /* splats arrive on the plan */
    if (R.live) while (G.plan.length && G.plan[0] <= now) { if (!splat()) { G.plan[0] += .2; break; } G.plan.shift(); while (G.plan.length && G.left < G.plan.length) G.plan.pop(); }
    for (const o of G.globs) { o.t += dt / TUNE.fly; if (o.t >= 1 && !o.dead) { o.dead = true; if (R.live) land(o.h); } }
    G.globs = G.globs.filter(o => !o.dead);
    /* wet ink dries; a blot that reaches its time sets for good */
    for (const h of G.heads) {
      h.shine = Math.max(0, h.shine - dt); h.cool -= dt;
      const b = h.blot; if (!b) continue; b.hit = Math.max(0, b.hit - dt);
      if (R.live && !b.set && (b.age += dt) >= b.setT) setIn(h);
    }
    /* everything landed and nothing wet or flying: done early */
    if (R.live && !G.plan.length && !G.globs.length && G.left <= 0 && G.heads.every(h => !h.blot || h.blot.set)) {
      G.early = true; if (G.setN === 0) ui.floatText(W / 2, 70, 'SPOTLESS!', 'gold big'); R.end();
    }
  }

  /* ---------- 7. bot (?bot=1): goes for the wet blot closest to setting that it can still save, travels like a hand, rubs in small circles.
     Reaction time, aim error and the odd fumble (a sloppy wiggle off the head, a moment's hesitation) come from R.rng. ---------- */
  function bot(dt) {
    const B = G.bot, wet = G.heads.filter(h => h.blot && !h.blot.set);
    if (B.target && (!B.target.blot || B.target.blot.set)) { B.target = null; B.react = rng(.15, .34); }
    if ((B.react -= dt) > 0) return;
    if (!B.target) {
      const need = h => h.blot.ink / (TUNE.rub * 130) + Math.hypot(h.x - G.rx, h.y - G.ry) / 170;
      const ok = wet.filter(h => h.blot.setT - h.blot.age > need(h) * .8).sort((a, b) => (a.blot.setT - a.blot.age) - (b.blot.setT - b.blot.age));
      B.target = ok[0] || wet[0] || null; if (!B.target) return;
      const sloppy = rng() < .14; B.err = sloppy ? [rng(-7.5, 7.5), rng(-7.5, 7.5)] : [rng(-3, 3), rng(-2.5, 2.5)]; B.ph = rng(6.28);
      if (rng() < .08) { B.react = rng(.4, .8); return; }
    }
    const tx = B.target.x + B.err[0], ty = B.target.y + B.err[1], dx = tx - G.ax, dy = ty - G.ay, dist = Math.hypot(dx, dy);
    if (dist > 4) { const s = Math.min(dist, 150 * dt); G.ax += dx / dist * s; G.ay += dy / dist * s; }
    else { B.ph += dt * 42; G.ax = tx + Math.cos(B.ph) * 3.2; G.ay = ty + Math.sin(B.ph * 1.3) * 2.4; }
  }

  /* ---------- 8. draw ---------- */
  function clock(h, f, now) {                                                  /* the drying clock: 8 dots on the outer side of a wet blot; they go out as it dries */
    const n = Math.ceil(f * 8), col = f > .5 ? '#fff6d6' : f > .25 ? '#ffd23a' : (Math.floor(now * 9) % 2 ? '#ff5a3a' : '#ffb0a0');
    for (let i = 0; i < n; i++) {
      const a = h.a - 1.25 + i / 7 * 2.5, dx = Math.round((h.x + Math.cos(a) * 9.67) * 3) / 3, dy = Math.round((h.y + Math.sin(a) * 9.67) * 3) / 3;
      g.fillStyle = '#1a0f14'; g.fillRect(dx - .67, dy - .67, 2, 2); g.fillStyle = col; g.fillRect(dx - .33, dy - .33, 1.33, 1.33);
    }
  }
  function pole(x0, y0, x1, y1) {                                               /* the rag's stick: an outlined wooden line in 1/3-unit steps */
    const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) * 3));
    for (const [c, o, s] of [['#1a0f14', -.67, 1.67], ['#8a5a2b', -.33, 1]]) { g.fillStyle = c; for (let i = 0; i <= n; i++) { const t = i / n; g.fillRect(Math.round(lerp(x0, x1, t) * 3) / 3 + o, Math.round(lerp(y0, y1, t) * 3) / 3 + o, s, s); } }
    g.fillStyle = '#c08a4a'; for (let i = 0; i <= n; i += 2) { const t = i / n; g.fillRect(Math.round(lerp(x0, x1, t) * 3) / 3 - .33, Math.round(lerp(y0, y1, t) * 3) / 3 - .33, .33, .33); }
  }
  function draw() {
    const now = performance.now() / 1000;
    st.hi(ROOM, 0, 0);
    for (const h of G.heads) {
      const b = h.blot, jit = b && b.hit > 0 ? (Math.floor(b.hit * 40) % 2 ? .33 : -.33) : 0;
      st.hi(headSpr(h.ch, h.shine > 0 || (R.done && R.won)), h.x - HALF, h.y - HALF);
      if (!b) { if (h.shine > 0 && Math.floor(h.shine * 12) % 2) { g.fillStyle = '#ffffff'; g.fillRect(h.x + 3, h.y - 7, .67, 2.67); g.fillRect(h.x + 2, h.y - 6, 2.67, .67); } continue; }
      const f = b.ink / b.ink0, k = b.set ? (f > .89 ? 0 : f > .67 ? 1 : f > .45 ? 2 : 3) : (f > .8 ? 0 : f > .58 ? 1 : f > .32 ? 2 : 3);
      st.hi(BLOT[b.v][k][b.set ? 1 : 0], h.x - 8 + jit, h.y - 8);
      if (!b.set && R.live) clock(h, 1 - b.age / b.setT, now);
      if (!b.set && Math.floor(now * 3 + h.i * .7) % 4 === 0) { g.fillStyle = '#ffffff'; g.fillRect(h.x - 3.67 * (f > .6 ? 1 : .6), h.y - 3.33 * (f > .6 ? 1 : .6), .67, .67); }   /* wet ink glints */
    }
    for (const o of G.globs) {                                                  /* glob in flight: a lob off the ribbon */
      const t = Math.min(1, o.t), x = lerp(o.x0, o.h.x, t), y = lerp(o.y0, o.h.y, t) - Math.sin(t * Math.PI) * 14;
      g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(o.h.x - 2 * t, o.h.y + 3, 4 * t, 1);
      st.hi(GLOB, x - 2.5, y - 4);
    }
    /* the fixer, its stick and the rag */
    const hx = G.mx + G.face * -1, rub = G.scrub > 0 && R.live;
    g.fillStyle = 'rgba(10,6,4,.45)'; g.fillRect(G.mx - 5, FOOT - .33, 10, 1);
    if (R.done) R.crew(G.mx, FOOT, R.won ? 'cheer' : 'scared', { flip: G.face < 0 });
    else R.crew(G.mx, FOOT, rub ? 'holdhit' : Math.abs(G.mx - clamp(G.rx + (G.rx < 60 ? 9 : -9), 12, W - 12)) > 2 ? (Math.floor(G.walk / 4) % 2 ? 'hold1' : 'hold2') : 'hold0', { flip: G.face < 0 });
    if (!R.done) {
      pole(hx, HANDS + (rub ? 4 : 0), G.rx, G.ry + 3);
      const wob = rub ? (Math.floor(now * 30) % 2 ? .67 : -.67) : 0;
      st.hi(RAG[Math.floor(G.dirt)], G.rx - 6 + wob, G.ry - 5);
    }
    fx.draw(g);
  }

  /* ---------- 9. input + run ---------- */
  window.JAM = { get G() { return G; }, TUNE, rubAt };
  const nearest = (x, y) => G.heads.reduce((a, h) => Math.hypot(h.x - x, h.y - y) < Math.hypot(a.x - x, a.y - y) ? h : a, G.heads[0]);
  R.run({
    reset, update, draw, grade, stats, bot,
    ended() { G.globs = []; if (R.won) G.heads.forEach(h => { if (!h.blot) fx.burst(h.x, h.y, ['#fffbe0', '#9be8ff'], 2, 18, 30, .3); }); },
    down(x, y, ev) { G.keyed = false; G.ax = x; G.ay = y; if (ev.pointerType !== 'mouse') G.jump = true; },
    move(x, y, ev) { if (ev.pointerType === 'mouse' || R.ptr.down) { if (G.keyed && ev.pointerType === 'mouse' && Math.hypot(x - G.ax, y - G.ay) < 2) return; G.keyed = false; G.ax = x; G.ay = y; } },
    key(ev, k) {
      const dir = k === 'arrowleft' || k === 'a' ? 1 : k === 'arrowright' || k === 'd' ? -1 : 0;   /* the fan runs right to left */
      if (dir) { if (!G.keyed) { G.keyed = true; G.sel = nearest(G.rx, G.ry).i; if (Math.hypot(G.heads[G.sel].x - G.rx, G.heads[G.sel].y - G.ry) > 3) return; } G.sel = clamp(G.sel + dir, 0, G.heads.length - 1); }
      else if (/^( |arrowup|arrowdown|w|s)$/.test(k) && !G.keyed) { G.keyed = true; G.sel = nearest(G.rx, G.ry).i; }
    },
  });
})();
