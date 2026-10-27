/* ============================================================
   SPOILED SNACK (repair "snack", verb SORT, 12 s). A global problem: rotten bananas got into the typists' snack supply.
   The snack belt runs from the delivery crate (top left) down to a hungry typist (bottom right), a steady stream of bananas on it.
   The rotten ones (brown, black-spotted, buzzing with flies) have to be flicked off into the compost bin before the typist catches them;
   the good ones should ride on through. Some fresh ones turn on the way: a fly lands and the banana browns in half a second.
   Freckled ones (from level .25) are just ripe: let them by.
   Grade = (rotten tossed - waste x good ones wasted) / rotten that reached the end of the line (tossed + eaten); waste is .6 at level 0
   and 1.2 at level 1, where half the belt is rotten and flicking everything would otherwise pass. No input = 0.
   Level: a faster, denser belt, more rotten ones, more (and later) turning, freckled decoys.
   Controls: tap or click a banana to flick it into the bin. Keys: a marker sits on the banana nearest the end; ← → (↑ ↓, A D, W S)
   step it back up the belt or forward, Space / Enter flicks the marked one, and the marker falls back to the front when its banana goes.
   Layout: 1 sprites · 2 setup · 3 tuning · 4 state · 5 verbs · 6 update · 7 bot · 8 draw · 9 run.
   ============================================================ */
(() => {
  'use strict';
  const { clamp, lerp, sfx } = MG;
  const { R: AR, shapes: { ell, box, poly, cap, or, and } } = MGArt, { make, hl, cvs, text, textW } = MGArt3;
  const TAU = Math.PI * 2, r3 = v => Math.round(v * 3) / 3, INK = '#1a0f14';

  /* ---------- 1. sprites that don't need the desk colour ---------- */
  /* the belt, in units: from the crate (A) down to the typist (B). s runs 0..1 along it; UP points off its top, DN under it */
  const A = [18, 36], B = [100, 100], LEN = Math.hypot(B[0] - A[0], B[1] - A[1]), U = [(B[0] - A[0]) / LEN, (B[1] - A[1]) / LEN];
  const UP = [U[1], -U[0]], DN = [-U[1], U[0]], TH = Math.atan2(U[1], U[0]), RIDE = 3.6;                 /* a banana's middle rides RIDE above the belt */
  const at = (s, off = 0) => [A[0] + U[0] * s * LEN + UP[0] * off, A[1] + U[1] * s * LEN + UP[1] * off];

  /* a banana in its own space (hi-res px around the middle): a crescent under an arc centre, belly down. ang turns it, mirror swaps the
     stem end, sc scales it; spots are [angle, radius off the arc, size] */
  const ROT_SPOTS = [[-.78, -1, 1.7], [-.5, 2.2, 1.3], [-.2, -2.2, 1.9], [.05, 1.6, 1.3], [.3, -.6, 1.7], [.56, 2.4, 1.3], [.8, -.2, 1.2], [-.62, .4, 1]];
  const FRECKLES = [[-.55, .6, 1.1], [-.15, -1.6, 1], [.22, 1.4, 1.1], [.5, -1, 1], [.72, 1.2, .9]];
  function banana(ramp, ang, o = {}) {
    const sc = o.sc || 1, N = Math.round(48 * sc), h = N / 2, c = Math.cos(ang), s = Math.sin(ang), mx = o.mirror ? -1 : 1;
    const CY = -15, RM = 19, SPAN = 1;
    const loc = f => (x, y) => { const dx = x - h, dy = y - h; return f(mx * (dx * c + dy * s) / sc, (-dx * s + dy * c) / sc); };
    const polar = (x, y) => [Math.hypot(x, y - CY), Math.atan2(x, y - CY)];
    const P = (a, d) => [d * Math.sin(a), CY + d * Math.cos(a)];
    const body = (x, y) => { const [d, a] = polar(x, y); if (Math.abs(a) > SPAN) return false; const t = a / SPAN; return Math.abs(d - RM) <= 6 * Math.sqrt(Math.max(0, 1 - t * t)) + .9; };
    return make(N, N, px => {
      px.shape(loc(body), ramp, 1);
      px.shape(loc((x, y) => { const [d, a] = polar(x, y); return body(x, y) && Math.abs(a) < SPAN - .12 && d > RM + 2 && d < RM + 3.2; }), ramp, 2);     /* ridge */
      px.shape(loc((x, y) => { const [d, a] = polar(x, y); return body(x, y) && Math.abs(a + .1) < .42 && d > RM - 3.6 && d < RM - 2.2; }), ramp, 3);  /* shine */
      const [sx, sy] = P(SPAN - .02, RM), [tx, ty] = P(-SPAN + .02, RM);
      px.shape(loc(cap(sx, sy, sx + 2.4, sy - 4, 2.1)), AR.stem, 4); px.shape(loc(ell(tx, ty, 2.1, 2.1)), AR.stem, 4);                                   /* stem + tip */
      (o.spots || []).forEach(([a, dd, r], i) => { const [x, y] = P(a, RM + dd); px.shape(loc(ell(x, y, r, r)), o.spotR || AR.ink, 5 + i); });
    });
  }
  const FRAMES = (ramp, o) => [false, true].map(mirror => Array.from({ length: 8 }, (_, k) => banana(ramp, TH + k * Math.PI / 4, { ...o, mirror })));   /* [mirror][turn]: 0 = lying on the belt */
  const GOOD = FRAMES(AR.banY), FRECK = FRAMES(AR.banY, { spots: FRECKLES, spotR: AR.coco }), ROT = FRAMES(AR.rotten, { spots: ROT_SPOTS });
  const BN = GOOD[0][0].width / 3;                                               /* 16 units: the banana canvas */
  const ICON = banana(AR.rotten, -.25, { sc: .75, spots: ROT_SPOTS }), SIGN_BAN = banana(AR.rotten, 0, { spots: ROT_SPOTS });

  /* the NO-ROTTEN sign's red ring and slash */
  const NO = make(66, 66, px => { px.shape((x, y) => { const d = Math.hypot(x - 33, y - 33); return (d <= 31 && d >= 25.5) || (d < 26 && cap(14, 14, 52, 52, 3.4)(x, y)); }, AR.red, 1); });
  /* the delivery crate the belt comes out of: planks, a dark mouth on the belt side, a banana stencil */
  const CRATE = make(78, 75, px => {
    px.shape(box(3, 3, 72, 69), AR.wood, 1);
    for (const y of [25, 48]) px.shape(box(3, y, 72, 2), AR.woodD, 2);
    px.shape(or(box(3, 3, 6, 69), box(69, 3, 6, 69)), AR.woodL, 3);
    px.shape(box(45, 50, 30, 20), AR.ink, 4);                                    /* the mouth */
    px.shape(and(ell(30, 14, 15, 7), (x, y) => y > 14 - 3), AR.banY, 5);        /* stencil: a banana */
    px.shape(ell(42, 10, 2, 2), AR.stem, 6);
  });
  /* the compost bin: a green barrel with an open mouth, the lid tipped back */
  const BIN = make(81, 96, px => {
    px.shape(ell(26, 12, 22, 9), AR.leafD, 1);                                  /* the lid, tipped back */
    px.shape(or(poly([[6, 30], [75, 30], [70, 93], [11, 93]]), ell(40.5, 30, 34.5, 9)), AR.leafD, 2);
    for (const y of [46, 74]) px.shape(and(poly([[6, 30], [75, 30], [70, 93], [11, 93]]), box(0, y, 81, 4)), AR.metal, 3);
    px.shape(ell(40.5, 29, 31, 6.5), AR.ink, 4);                                  /* the mouth */
    px.shape(and(ell(40.5, 29, 31, 6.5), (x, y) => y > 30), AR.stem, 5);          /* the rot inside */
    px.shape(or(box(26, 56, 3, 12), box(34, 56, 3, 12), box(42, 56, 3, 12), box(50, 56, 3, 12)), AR.leaf, 6);   /* a stencilled leaf mark */
  });
  const BIN_M = { x: 15.5, y: 117.67 };                                           /* the bin's mouth, units (BIN drawn at 2, 108) */

  /* ---------- 2. setup ---------- */
  const R = MGRepair.setup({
    id: 'snack', verb: 'SORT', scoreIcon: ICON,
    how: '<em>Tap</em> the rotten ones into the bin · let the good ones by',
    legend: [[ROT[0][0], '<em>tap</em> rotten ones off the belt'], [GOOD[0][0], 'good ones go to the <em>typists</em>'], [FRECK[0][0], 'freckles are <em>fine</em>']],
    hint: 'tap · or ← → to pick, Space to flick',
  });
  const { st, g, W, H, ui, fx, rng, level: LV } = R;
  const [RS, RB, RL] = R.deskRamp;
  const TYPIST = (() => { const f = MGRepair.fixer().look, ids = MGCrew.ids(); return ['v18', 'v14', 'v10'].find(i => i !== f && ids.includes(i)) || f; })();   /* the hungry typist: the reporter */

  /* the belt's frame in the desk colour, its legs and end rollers: one hi-res sprite over the whole stage */
  const FLOOR_TOP = 124, FOOT = 140, FX = 58, TX = 105, TFOOT = 131, CATCH = { x: TX - 1, y: TFOOT - 14 };   /* the typist's hands */
  const BELT = make(W * 3, H * 3, px => {
    const p = (s, off) => { const q = at(s, -off); return [q[0] * 3, q[1] * 3]; };   /* off: units under the belt top */
    for (const s of [.3, .74]) { const [lx, ly] = p(s, 4); px.shape(or(box(lx - 3, ly, 6, FOOT * 3 - 6 - ly), box(lx - 7, FOOT * 3 - 9, 14, 4)), AR.metal, 1); }   /* legs + feet */
    px.shape(poly([p(0, .67), p(1, .67), p(1, 5.67), p(0, 5.67)]), R.deskR, 2);                                              /* the side rail */
    px.shape(poly([p(0, 4.33), p(1, 4.33), p(1, 5.67), p(0, 5.67)]), R.deskR, 3);                                             /* its bottom lip */
    for (const s of [0, 1]) { const [cx, cy] = p(s, 2.67); px.shape(ell(cx, cy, 10.5, 10.5), AR.ink, 4); px.shape(ell(cx, cy, 7.5, 7.5), AR.metal, 5); }   /* rollers, the belt round them */
    px.shape(poly([p(0, -.33), p(1, -.33), p(1, 1), p(0, 1)]), AR.ink, 4);                                                   /* the rubber belt along the top */
    for (let s = .08; s < .96; s += .125) { const [bx, by] = p(s, 3); px.shape(ell(bx, by, 2, 2), AR.metal, 6); }             /* bolts */
  });

  /* the room, painted once: wall, skirting, floor, the NO ROTTEN sign, the crate's bracket */
  const ROOM = cvs(W * 3, H * 3, x => {
    x.scale(3, 3); x.imageSmoothingEnabled = false; const r = (c, a, b, w, hh) => { x.fillStyle = c; x.fillRect(a, b, w, hh); }, s = MG.seeded(13);
    r('#12402a', 0, 0, W, FLOOR_TOP); for (let sx = 0; sx < W; sx += 8) r('#0f3824', sx, 0, 4, FLOOR_TOP);
    r('rgba(4,16,10,.35)', 0, 0, W, FLOOR_TOP);
    r('#2a170b', 0, FLOOR_TOP - 3, W, 3); r('#1a0f14', 0, FLOOR_TOP - 3, W, .67);
    for (let y = FLOOR_TOP, i = 0; y < H; y += 6 + i * .67, i++) {
      const bh = 6 + i * .67; r(['#4a2a12', '#5a3517', '#523015'][i % 3], 0, y, W, bh); r('#6a4120', 0, y, W, .67); r('#2a170b', 0, y + bh - .67, W, .67);
      for (let sx = (i * 37) % 31; sx < W; sx += 31 + i * 2) r('#2a170b', sx, y, .67, bh);
      for (let k = 0; k < 5; k++) r('#4a2a12', Math.floor(s() * W), y + 1 + Math.floor(s() * (bh - 2)), 3 + Math.floor(s() * 6), .67);
    }
    r('rgba(0,0,0,.28)', 0, FLOOR_TOP, W, 3);
    /* the sign: a rotten banana under a red NO, and the rule */
    const SX = 66, SY = 14, SW = 48, SH = 34;
    r('#1a0f14', SX - .67, SY - .67, SW + 1.33, SH + 1.33); r('#e8d8a8', SX, SY, SW, SH); r('#fff6d6', SX, SY, SW, .67); r('#c9b88a', SX, SY + SH - .67, SW, .67);
    r('#b8b8c4', SX + SW / 2 - .67, SY + 1, 1.33, 1.33);                                                                         /* a pin */
    x.drawImage(SIGN_BAN, SX + SW / 2 - BN / 2, SY + 14 - BN / 2, BN, BN);
    x.drawImage(NO, SX + SW / 2 - 11, SY + 13 - 11, 22, 22);
    const t1 = 'NO ROTTEN', t2 = 'SNACKS!'; text(x, t1, SX + SW / 2 - textW(t1, 2 / 3) / 2, SY + 25.33, '#b8322a', 2 / 3); text(x, t2, SX + SW / 2 - textW(t2, 1 / 3) / 2, SY + 30.67, '#3a2a30', 1 / 3);
    r('#1a0f14', 0, 42.33, 28.67, 2.67); r('#6a4120', 0, 42.67, 28.33, 2); r('#8a5a2b', 0, 42.67, 28.33, .67);                      /* the crate's shelf */
    r('rgba(10,6,4,.45)', FX - 7, FOOT + .67, 14, 1.67); r('rgba(10,6,4,.45)', TX - 7, TFOOT + .67, 14, 1.67);
  });

  /* ---------- 3. tuning ---------- */
  const TUNE = {
    speed: p => lerp(30, 44, LV) * (1 + .3 * p),                                /* belt speed, units/s; it speeds up through the run */
    gap: () => lerp(15, 12.5, LV) + rng(0, lerp(8, 5, LV)),                    /* belt between one banana and the next, units */
    rotten: lerp(.33, .4, LV), streak: 3,                                       /* share that comes out rotten; never more than 3 in a row */
    turn: lerp(.1, .22, LV), turnAt: () => rng(.32, lerp(.62, .78, LV)), turnT: .5,   /* share of good ones a fly lands on; where (s); how long the browning takes */
    freckle: clamp((LV - .25) * .45, 0, .3),                                    /* share of good ones with harmless freckles */
    hit: 8.5,                                                                   /* a tap flicks the nearest banana within this, units */
    waste: lerp(.6, 1.2, LV),                                                   /* what a wasted good one takes off the grade, in rotten ones */
  };

  /* ---------- 4. state ---------- */
  let G;
  const isRot = b => b.kind === 'rot' || b.turn > 0;
  function newBanana(s, o = {}) {
    let kind = o.kind || (G.streak < TUNE.streak && rng() < TUNE.rotten ? 'rot' : 'good'), turnAt = -1;
    if (kind === 'good' && !o.kind) { const q = rng(); if (q < TUNE.turn) turnAt = Math.max(s + .12, TUNE.turnAt()); else if (q < TUNE.turn + TUNE.freckle) kind = 'freck'; }
    G.streak = kind === 'rot' ? G.streak + 1 : 0;
    return { id: G.id++, s, kind, turnAt, turn: 0, mir: rng() < .5 ? 1 : 0, ph: rng(TAU), bob: 0 };
  }
  function reset() {
    G = {
      belt: [], toss: [], drops: [], stinks: [], id: 0, streak: 0, run: 0, gapNext: 0, beltPos: 0,
      tossed: 0, wasted: 0, sick: 0, fed: 0, combo: 0, best: 0,
      fixPose: 'breathe', fixT: 0, typPose: 'hold0', typT: 0, held: null, binHit: 0, keyed: false, mark: null,
      bot: { cool: .45, wait: 0, aim: null, fooled: new Map(), seen: new Map() },
    };
    /* the belt starts loaded: the one nearest the end is good, a rotten one is in plain view */
    const pre = []; for (let s = .62; s > .03; s -= TUNE.gap() / LEN) pre.push(s);
    pre.forEach((s, i) => G.belt.push(newBanana(s, i === 0 ? { kind: 'good' } : i === 1 && pre.length > 2 ? { kind: 'rot' } : {})));
    G.run = pre[pre.length - 1] * LEN; G.gapNext = TUNE.gap();
    ui.setScore(0);
  }
  const grade = () => { const n = G.tossed + G.sick; return n ? clamp((G.tossed - TUNE.waste * G.wasted) / n, 0, 1) : 0; };
  const stats = () => [['ROTTEN TOSSED', `${G.tossed} / ${G.tossed + G.sick}`], ['GOOD WASTED', G.wasted], ['SNACKS SERVED', G.fed], ['BEST CHAIN', G.best]];
  const mid = b => at(b.s, RIDE + (b.bob || 0));
  const front = () => G.belt.reduce((m, b) => (b.s > .1 && (!m || b.s > m.s) ? b : m), null);   /* the next one due at the end */
  const marked = () => (G.mark && G.belt.includes(G.mark) ? G.mark : (G.mark = front()));            /* the keys' banana; the front one once it goes */
  function step(dir) {                                                           /* move the marker: -1 back up the belt, +1 toward the end */
    const m = marked(); if (!m) return;
    const next = G.belt.reduce((q, b) => (b.s > .1 && (dir > 0 ? b.s > m.s && (!q || b.s < q.s) : b.s < m.s && (!q || b.s > q.s)) ? b : q), null);
    if (next) { G.mark = next; sfx.tone(dir > 0 ? 760 : 620, dir > 0 ? 820 : 560, .04, 'triangle', .03); } else sfx.tone(300, 260, .04, 'triangle', .02);
  }

  /* ---------- 5. verbs: flick (tap, keys and the bot all call it) and serve (the belt does) ---------- */
  function flick(b) {
    if (!R.live || !b) return false;
    G.belt = G.belt.filter(q => q !== b);
    const [x, y] = mid(b), rot = isRot(b), tx = BIN_M.x + rng(-4, 4), ty = BIN_M.y, T = .3 + Math.hypot(tx - x, ty - y) / 300, gy = 320;
    G.toss.push({ b, x, y, vx: (tx - x) / T, vy: (ty - y - .5 * gy * T * T) / T, gy, t: 0, T, spin: 0, rot });
    G.fixPose = 'launch'; G.fixT = .22;
    sfx.noise(.06, .05, 3800); sfx.tone(500, 900, .06, 'triangle', .04);
    if (rot) {
      G.tossed++; G.combo++; G.best = Math.max(G.best, G.combo); ui.setScore(G.tossed); ui.bump(); ui.setCombo(G.combo, 1);
      sfx.tone(240, 120, .09, 'square', .03, .03);
      fx.burst(x, y, ['#6a5a1c', '#2a2008', '#9a8a38'], 7, 34, 120, .4); for (let i = 0; i < 2; i++) fx.spark(x + rng(-4, 4), y - 3, INK);
      if (G.combo % 4 === 0) { ui.floatText(x, y - 9, `${G.combo} IN A ROW!`, 'gold'); sfx.ding(G.combo / 4); ui.pulseCombo(); }
      else ui.floatText(x, y - 7, ['YUCK!', 'OUT!', 'BLECH', 'TOSS!'][G.tossed % 4], 'ice');
    } else {
      G.wasted++; G.combo = 0; ui.setCombo(0, 1); G.fixPose = 'scared'; G.fixT = .45;
      sfx.miss(); ui.floatText(x, y - 7, b.kind === 'freck' ? 'IT WAS RIPE!' : 'WASTE!', 'bad'); fx.burst(x, y, ['#ffd23a', '#fff08c'], 5, 26, 120, .35);
    }
    return true;
  }
  function flickAt(x, y) {
    let best = null, bd = TUNE.hit;
    for (const b of G.belt) { if (b.s < .1) continue; const [bx, by] = mid(b), d = Math.hypot(bx - x, by - y); if (d < bd) { bd = d; best = b; } }
    if (best) return flick(best);
    sfx.tone(300, 200, .04, 'triangle', .025); fx.puff(x, y, '#e8f6ff', 1); return false;   /* a whiff: no harm */
  }
  function serve(d) {                                                            /* off the end of the belt into the typist's hands */
    if (d.rot) {
      G.sick++; G.combo = 0; ui.setCombo(0, 1); G.typPose = 'scared'; G.typT = 1; G.held = null; G.fixPose = 'scared'; G.fixT = .6;
      ui.floatText(TX - 4, CATCH.y - 10, 'BLEH!', 'bad'); ui.doFlash('rgba(130,170,40,.28)'); R.shake(3); sfx.rotten(); sfx.noise(.25, .05, 700);
      G.stinks.push({ x: TX, y: CATCH.y, t: 0 }); for (let i = 0; i < 5; i++) fx.puff(TX + rng(-7, 7), CATCH.y - rng(0, 6), '#9ab84a', 2);
    } else {
      G.fed++; G.typPose = 'carry'; G.typT = .4; G.held = d.b;
      sfx.tone(880, 1320, .06, 'sine', .035); if (G.fed % 3 === 0) ui.floatText(TX + 2, CATCH.y - 10, 'NOM', 'gold');
      fx.burst(CATCH.x, CATCH.y, ['#ffd23a', '#fff08c'], 3, 18, 80, .25);
    }
  }

  /* ---------- 6. update ---------- */
  function update(dt) {
    const v = R.live ? TUNE.speed(R.progress) : 0, ds = v * dt / LEN;
    G.beltPos += v * dt;
    if (R.live && (G.run += v * dt) >= G.gapNext) { G.run -= G.gapNext; G.gapNext = TUNE.gap(); G.belt.push(newBanana(G.run / LEN)); }   /* out of the crate */
    for (const b of G.belt) {
      b.s += ds; b.bob = Math.max(0, b.bob - dt * 20);
      if (b.turnAt > 0 && !b.turn && b.s >= b.turnAt) { b.turn = .001; b.bob = 1.5; sfx.tone(200, 90, .12, 'sawtooth', .025); sfx.noise(.08, .03, 900); }   /* the fly lands: it starts to turn */
      if (b.turn > 0 && b.turn < 1) b.turn = Math.min(1, b.turn + dt / TUNE.turnT);
      if (b.s >= 1) { const [x, y] = mid(b); G.drops.push({ x, y, vx: (CATCH.x - x) / .3, vy: 0, rot: isRot(b), b, spin: 0 }); b.gone = true; }   /* it tips off toward the hands */
    }
    G.belt = G.belt.filter(b => !b.gone);
    for (const d of G.drops) {                                                   /* off the end of the belt, into the typist's hands */
      d.vy += 300 * dt; d.x += d.vx * dt; d.y += d.vy * dt; d.spin += dt * 9;
      if (d.y >= CATCH.y) { d.dead = true; if (R.live) serve(d); }
    }
    G.drops = G.drops.filter(d => !d.dead);
    for (const t of G.toss) {                                                    /* flicked: arcing into the bin */
      const k = Math.min(dt, t.T - t.t); t.t += dt; t.vy += t.gy * k; t.x += t.vx * k; t.y += t.vy * k; t.spin += dt * 22;
      if (t.t >= t.T) { t.dead = true; G.binHit = .25; sfx.thud(); fx.burst(BIN_M.x, BIN_M.y - 1, t.rot ? ['#6a5a1c', '#9a8a38'] : ['#ffd23a', '#c98f0e'], 4, 20, 80, .3); }
    }
    G.toss = G.toss.filter(t => !t.dead);
    for (const s of G.stinks) s.t += dt; G.stinks = G.stinks.filter(s => s.t < 1.6);
    G.binHit = Math.max(0, G.binHit - dt); G.fixT -= dt; G.typT -= dt;
    if (G.fixT <= 0) G.fixPose = 'breathe';
    if (G.typT <= 0) { G.typPose = 'hold0'; G.held = null; }
  }

  /* ---------- 7. bot (?bot=1): watches the belt like a player. It goes for the rotten-looking banana nearest the end, taps after a
     reaction delay (aiming where it is then, a touch behind on a fast belt), notices a turning one only once it has visibly browned, now
     and then misreads freckles as rot, sometimes fumbles a tap onto the wrong spot, and now and then spots a banana late (or never:
     it was watching the bin). Grades land around .7-.95. ---------- */
  function bot(dt) {
    const B = G.bot;
    B.cool -= dt;
    if (B.wait > 0) {
      if ((B.wait -= dt) > 0) return;
      const b = B.aim; B.aim = null; B.cool = rng(.18, .32);
      if (!b || !G.belt.includes(b)) return;
      const [x, y] = mid(b), lag = TUNE.speed(R.progress) * rng(0, .1), slip = rng() < .09 ? (rng() < .5 ? -1 : 1) * rng(10, 15) : 0;
      flickAt(x - U[0] * (lag + slip) + rng(-2, 2), y - U[1] * (lag + slip) + rng(-2, 2));
      return;
    }
    if (B.cool > 0) return;
    const looks = b => {
      if (!B.seen.has(b.id)) B.seen.set(b.id, rng() < .1 ? rng(.8, 1.05) : rng(.12, .45));   /* where on the belt it first catches its eye */
      if (b.s < B.seen.get(b.id)) return false;
      if (b.kind === 'rot') return true;
      if (b.turn > 0) { if (!B.fooled.has(b.id)) B.fooled.set(b.id, rng(.25, .65)); return b.turn >= B.fooled.get(b.id); }   /* how brown before it notices */
      if (b.kind === 'freck') { if (!B.fooled.has(b.id)) B.fooled.set(b.id, rng() < .12); return B.fooled.get(b.id); }
      return false;
    };
    const seen = G.belt.filter(looks);
    if (!seen.length) return;
    B.aim = seen.reduce((m, b) => (b.s > m.s ? b : m)); B.wait = rng(.14, .3);
  }

  /* ---------- 8. draw ---------- */
  const oval = (cx, cy, rx, ry, col) => {
    g.fillStyle = col; const n = Math.max(1, Math.round(ry * 3));
    for (let i = -n; i <= n; i++) { const yy = i / 3, w = rx * Math.sqrt(Math.max(0, 1 - (yy * yy) / (ry * ry))); if (w > 0) g.fillRect(r3(cx - w), r3(cy + yy), Math.round(w * 6) / 3, 1 / 3); }
  };
  const dot = (x, y, s, col) => { g.fillStyle = col; g.fillRect(r3(x - s / 2), r3(y - s / 2), s, s); };
  const spr = (set, mir, k) => set[mir][((k % 8) + 8) % 8];
  function drawBanana(b, x, y, k = 0) {
    const set = b.kind === 'rot' ? ROT : b.kind === 'freck' ? FRECK : GOOD;
    st.hi(spr(set, b.mir, k), x - BN / 2, y - BN / 2);
    if (b.turn > 0 && b.kind !== 'rot') { g.globalAlpha = Math.min(1, b.turn); st.hi(spr(ROT, b.mir, k), x - BN / 2, y - BN / 2); g.globalAlpha = 1; }   /* browning */
  }
  function flies(x, y, n, ph, now) {                                             /* little black flies buzzing round a rotten one */
    for (let i = 0; i < n; i++) {
      const a = now * (5.5 + i * 1.7) + ph + i * 2.4, rx = 5.5 + 1.5 * Math.sin(now * 3 + i), fx2 = x + Math.cos(a) * rx, fy = y - 3.5 + Math.sin(a * 1.3) * 3.2;
      dot(fx2, fy, 1, INK); if (Math.floor(now * 30 + i) % 2) dot(fx2 + (Math.cos(a) > 0 ? -.67 : .67), fy - .67, .67, '#d6e8f0');
    }
  }
  function stink(x, y, ph, now, a = 1) {                                         /* wavy green stink lines */
    for (let i = 0; i < 2; i++) for (let j = 0; j < 6; j++) {
      const u = ((now * .9 + i * .5 + ph) % 1), yy = y - 5 - u * 7 - j * 1.1, xx = x + (i ? 3 : -3) + Math.sin(yy * .8 + now * 4 + i) * 1;
      g.globalAlpha = a * (1 - j / 6) * (1 - u * .6); dot(xx, yy, .67, '#9ab84a');
    }
    g.globalAlpha = 1;
  }
  function drawBelt(now) {
    st.hi(BELT, 0, 0);
    g.fillStyle = '#4a3a40';                                                     /* the belt's ribs, running */
    for (let d = (G.beltPos % 4.5) - 4.5; d < LEN; d += 4.5) { if (d < 0) continue; const [x, y] = at(d / LEN, -.33); g.fillRect(r3(x - .33), r3(y - .33), .67, .67); }
    for (const s of [0, 1]) {                                                    /* the rollers turning */
      const [cx, cy] = at(s, -2.67), a0 = G.beltPos / 2.6;
      for (let k = 0; k < 3; k++) { const a = a0 + k * TAU / 3; dot(cx + Math.cos(a) * 1.6, cy + Math.sin(a) * 1.6, .67, INK); }
      dot(cx, cy, 1, '#5a5a66');
    }
  }
  function drawTypist(now) {                                                    /* the hungry typist at the end of the line, arms up */
    R.crew(TX, TFOOT, G.typPose, { look: TYPIST, hat: 0, flip: true, expr: G.typPose === 'scared' ? 'screech' : undefined });
    if (G.held && G.typPose === 'carry') drawBanana(G.held, TX, TFOOT - 16.33, 6);
    for (const s of G.stinks) { const k = s.t / 1.6; stink(s.x, s.y - 2, s.x * .1, now, 1 - k); flies(s.x, s.y - 4 - k * 4, 2, s.x, now); }
  }
  function draw() {
    const now = performance.now() / 1000;
    st.hi(ROOM, 0, 0);
    st.hi(BIN, 2, 108 + (G.binHit > 0 ? (G.binHit > .12 ? .67 : -.33) : 0));
    drawBelt(now);
    const order = [...G.belt].sort((a, b) => a.s - b.s);
    for (const b of order) { const [x, y] = mid(b); drawBanana(b, x, y); }
    for (const b of order) {                                                     /* flies + stink over the rotten ones, the fly coming in on a turning one */
      const [x, y] = mid(b);
      if (b.kind === 'rot' || b.turn >= .5) { flies(x, y, 2, b.ph, now); stink(x, y, b.ph, now, b.kind === 'rot' ? 1 : (b.turn - .5) * 2); }
      else if (b.turnAt > 0) {
        const k = b.turn > 0 ? 1 : clamp((b.s - (b.turnAt - .16)) / .16, 0, 1);
        if (k > 0) { const fx2 = lerp(x + 22, x + 1, k), fy = lerp(y - 26, y - 3, k) + Math.sin(now * 25) * (1 - k) * 1.5; dot(fx2, fy, 1, INK); if (Math.floor(now * 30) % 2) dot(fx2 - .67, fy - .67, .67, '#d6e8f0'); }
      }
    }
    st.hi(CRATE, 1, 18);
    drawTypist(now);
    for (const d of G.drops) drawBanana(d.b, d.x, d.y, Math.round(d.spin));
    R.crew(FX, FOOT, R.done ? (R.won ? 'cheer' : 'scared') : G.fixPose, { expr: G.fixPose === 'scared' ? 'screech' : undefined });
    for (const t of G.toss) drawBanana(t.b, t.x, t.y, Math.round(t.spin));
    if (G.keyed && R.live) {                                                     /* keys: mark the banana the next press flicks */
      const b = marked(); if (b) { const [x, y] = mid(b), yy = y - 11 + Math.sin(now * 8) * .67; for (let i = 0; i < 5; i++) { const w = 7 - i * 1.67; if (w <= 0) break; g.fillStyle = INK; g.fillRect(r3(x - w / 2 - .33), r3(yy + i * .67 - .33), r3(w + .67), 1); g.fillStyle = '#ffd23a'; g.fillRect(r3(x - w / 2), r3(yy + i * .67), r3(w), .67); } }
    }
    fx.draw(g);
  }

  /* ---------- 9. input + run: a tap flicks the banana under it; keys move the marker and flick the marked one ---------- */
  window.SNACK = { get G() { return G; }, flick, flickAt, TUNE };
  R.run({
    reset, update, draw, grade, stats, bot,
    ended() { G.typPose = R.won ? 'cheer' : 'scared'; G.typT = 9; if (R.won) fx.confetti(TX, CATCH.y - 8, 10, ['#ffd23a', '#fff08c', RB]); },
    down(x, y) { flickAt(x, y); },
    key(ev, k) {
      if (ev.repeat) return;
      if (k === ' ' || k === 'enter') { G.keyed = true; if (flick(marked())) G.mark = null; }
      else if (k === 'arrowleft' || k === 'arrowup' || k === 'a' || k === 'w') { G.keyed = true; step(-1); }
      else if (k === 'arrowright' || k === 'arrowdown' || k === 'd' || k === 's') { G.keyed = true; step(1); }
    },
  });
})();
