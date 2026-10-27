/* ============================================================
   THE RIBBON IS TANGLED (repair "ribbon", verb REEL, 12 s).
   The desk's ribbon has spilled out of the machine: loops over the keys, down the desk and across the floor. A take-up spool with a
   crank stands on the floor; circle-drag the crank (or tap ← → in turn) to reel the slack back in. The tension dial on the wall reads
   how hard you crank: hold it in the red too long and the ribbon SNAPS, whipping a loop back out (a bigger one the harder you were
   cranking, so spinning flat out loses more than it reels). Knots on the ribbon widen the red
   zone while they pass the guide, so ease off for them.
   Grade = .8 x reeled + up to .2 for time left on the base clock once it is all in (3.5 s to spare = 1; Steady hands' extra seconds help
   you finish but don't count as spare), minus a charge per snap, so frantic cranking that snaps it over and over can't buy PERFECT.
   Level: more ribbon, an earlier redline, less grace, more knots, bigger snaps.
   Controls: drag in circles anywhere (mouse or finger; the crank follows one finger, a second one resting on the glass is ignored) · ← → (A D) alternately.
   Layout: 1 sprites · 2 setup · 3 tuning · 4 state · 5 verbs · 6 update · 7 bot · 8 draw · 9 run.
   ============================================================ */
(() => {
  'use strict';
  const { clamp, lerp, sfx } = MG;
  const { R: AR, shapes: { ell, box, or } } = MGArt, { make, hl, cvs, text, textW } = MGArt3;
  const TAU = Math.PI * 2, r3 = v => Math.round(v * 3) / 3, wrap = a => ((a + Math.PI) % TAU + TAU) % TAU - Math.PI;

  /* ---------- 1. sprites that don't need the desk colour (hi-res: 3 px per unit, draw with st.hi) ---------- */
  const FLANGE = make(147, 147, px => {                                          /* the spool's back plate, r 24 units */
    px.shape(ell(73.5, 73.5, 72, 72), AR.metal, 1);
    px.shape(ell(73.5, 73.5, 64, 64), AR.metal, 2);
    for (let k = 0; k < 8; k++) { const a = k * TAU / 8 + .2; px.shape(ell(73.5 + Math.cos(a) * 68, 73.5 + Math.sin(a) * 68, 2, 2), AR.woodD, 3); }
  });
  /* the dial, value v 0..1 sweeps 210 deg (lower left) to -30 deg (lower right); zones are painted in, one face per red line */
  const angOf = v => (210 - 240 * v) * Math.PI / 180;
  const dialFace = red => make(114, 114, px => {
    const c = 57, val = (x, y) => { let a = Math.atan2(-(y - c), x - c) * 180 / Math.PI; if (a < -90) a += 360; return (210 - a) / 240; };
    const band = (v0, v1) => (x, y) => { const d = Math.hypot(x - c, y - c), v = val(x, y); return d >= 36 && d <= 46 && v >= v0 && v <= v1; };
    px.shape(ell(c, c, 56, 56), AR.gold, 1); px.shape(ell(c, c, 49, 49), AR.paper, 2);
    px.shape(band(0, .42), AR.metal, 3); px.shape(band(.42, red), AR.leaf, 4); px.shape(band(red, 1), AR.red, 5);
    for (let i = 0; i <= 8; i++) { const a = angOf(i / 8), r0 = i % 2 ? 30 : 27; for (let r = r0; r <= 34; r += .5) px.dot(Math.round(c + Math.cos(a) * r), Math.round(c - Math.sin(a) * r), AR.ink, 1, 6); }
    hl(px, 22, 14, 14, 3, 2);
  });

  /* ---------- 2. setup ---------- */
  const ICON = MGRepair.parts.spool(.75, { ramp: MGRepair.deskR(MGRepair.params.desk) });
  const R = MGRepair.setup({
    id: 'ribbon', verb: 'REEL', scoreIcon: ICON, howAt: 57,
    how: '<em>Circle</em> the crank to reel it in · keep the dial out of the <em>red</em>',
    legend: [[ICON, '<em>circle</em> the crank to reel'], [MGRepair.parts.spool(.2), 'too fast <em class="bad">snaps</em> it']],
    hint: 'drag in circles · or ← → in turn',
  });
  const { st, g, W, H, ui, fx, rng, level: LV } = R;
  const [RS, RB, RL] = R.deskRamp, INK = '#1a0f14';
  const TYPEWRITER = MGRepair.parts.typewriter(R.desk);

  /* the room, painted once: wall, the desk with the machine, the dial's plaque, floor boards and the spool's stand */
  const DESK_Y = 48, FLOOR_TOP = 122, FLOOR_Y = 151, SP = { x: 70, y: 100 }, FL_R = 24, CRANK = 26.5, DIAL = { x: 93, y: 31, r: 19 };
  const TW = { x: 4, y: DESK_Y - 33 }, A = [TW.x + 23, TW.y + 14], FIX = { x: 36 }, GUIDE = [FIX.x + 3, FLOOR_Y - 10];
  const ROOM = cvs(W * 3, H * 3, x => {
    x.scale(3, 3); const r = (c, a, b, w, hh) => { x.fillStyle = c; x.fillRect(a, b, w, hh); }, s = MG.seeded(5);
    r('#12402a', 0, 0, W, FLOOR_TOP); for (let sx = 0; sx < W; sx += 8) r('#0f3824', sx, 0, 4, FLOOR_TOP);
    r('rgba(4,16,10,.35)', 0, 0, W, FLOOR_TOP);
    r('#1a0f14', 71.67, 9.67, 42.67, 49.67); r('#5a3517', 72, 10, 42, 49); r('#7d4f26', 72, 10, 42, .67); r('#2a170b', 72, 58.33, 42, .67);  /* dial plaque */
    for (const [px2, py] of [[74, 12], [111, 12], [74, 56], [111, 56]]) { r('#1a0f14', px2 - .33, py - .33, 1.67, 1.67); r('#b8b8c4', px2, py, 1, 1); }
    r('#1a0f14', 77.67, 51.67, 30.67, 6); r('#e8d8a8', 78, 52, 30, 5.33); r('#fff6d6', 78, 52, 30, .67);
    r('#1a0f14', 0, DESK_Y - .33, 60.33, 9.67); r('#8a5a2b', 0, DESK_Y, 60, 3); r('#b57d3e', 0, DESK_Y, 60, .67); r('#5a3517', 0, DESK_Y + 3, 60, 6); r('#4a2a12', 0, DESK_Y + 8.33, 60, .67);   /* desk */
    for (const lx of [3, 52]) { r('#1a0f14', lx - .33, DESK_Y + 9, 5.33, FLOOR_TOP - DESK_Y - 7); r('#6a4120', lx, DESK_Y + 9, 4.67, FLOOR_TOP - DESK_Y - 7); r('#8a5a2b', lx, DESK_Y + 9, 1, FLOOR_TOP - DESK_Y - 7); }
    r('#2a170b', 0, FLOOR_TOP - 3, W, 3); r('#1a0f14', 0, FLOOR_TOP - 3, W, .67);                                                              /* skirting */
    for (let y = FLOOR_TOP, i = 0; y < H; y += 6 + i * .67, i++) {                                                                            /* floor boards */
      const bh = 6 + i * .67; r(['#4a2a12', '#5a3517', '#523015'][i % 3], 0, y, W, bh); r('#6a4120', 0, y, W, .67); r('#2a170b', 0, y + bh - .67, W, .67);
      for (let sx = (i * 37) % 31; sx < W; sx += 31 + i * 2) r('#2a170b', sx, y, .67, bh);
      for (let k = 0; k < 5; k++) r('#4a2a12', Math.floor(s() * W), y + 1 + Math.floor(s() * (bh - 2)), 3 + Math.floor(s() * 6), .67);
    }
    r('rgba(0,0,0,.28)', 0, FLOOR_TOP, W, 3);
    const leg = (x0, x1) => { for (let k = 0; k <= 1; k += 1 / 90) { const lx = lerp(x0, x1, k), ly = lerp(SP.y, FLOOR_Y + 2, k); r('#1a0f14', lx - 2, ly - .33, 4, 1); r('#6a4120', lx - 1.67, ly, 3.33, .67); } };
    leg(SP.x - 4, SP.x - 17); leg(SP.x + 4, SP.x + 17);                                                                                            /* the spool's A-frame */
    r('#1a0f14', SP.x - 13.33, 136.67, 26.67, 3); r('#8a5a2b', SP.x - 13, 137, 26, 2.33); r('#b57d3e', SP.x - 13, 137, 26, .67);
    r('rgba(10,6,4,.45)', SP.x - 22, FLOOR_Y + 1.33, 44, 1.67);
  });
  const TEXTW = textW('TENSION', 2 / 3);

  /* ---------- 3. tuning ---------- */
  const TUNE = {
    turns: lerp(21.5, 22, LV),                                                      /* crank turns to reel it all in (a fuller spool reels more per turn) */
    redAt: lerp(2.95, 2.6, LV),                                                 /* turns per second that reach the red line */
    red: .78, knotRed: lerp(.57, .5, LV),                                      /* where red starts on the dial; and while a knot is in the guide */
    snapT: lerp(.45, .3, LV),                                                   /* seconds in the red before it snaps */
    snapLoss: lerp(.06, .09, LV), stun: lerp(.8, .55, LV),                      /* how much a snap pulls back out; the crank is dead meanwhile */
    snapCost: lerp(.06, .03, LV),                                               /* grade off per snap (higher levels already lose more ribbon) */
    knots: 1 + Math.round(LV * 2), knotLen: .045, knotWarn: .06,                /* knots; how much ribbon one takes to pass the guide; the red creeps down over this much before */
  };
  TUNE.omRef = TAU * TUNE.redAt / TUNE.red;                                     /* angular speed (rad/s) that pins the needle at 1 */
  const FACES = Array.from({ length: 7 }, (_, i) => dialFace(lerp(TUNE.red, TUNE.knotRed, i / 6)));   /* the red line creeping down as a knot comes */
  const woundR = w => 8.5 + 13.5 * w;

  /* ---------- 4. state ---------- */
  let G;
  function reset() {
    const knots = [];
    for (let i = 0; i < TUNE.knots; i++) knots.push({ w0: clamp(lerp(.24, .82, (i + .5) / TUNE.knots) + rng(-.05, .05), .15, .9), warned: false, done: false, bad: false });
    G = {
      w: 0, wd: 0, phi: -Math.PI / 2 - .5, acc: 0, om: 0, T: 0, over: 0, stun: 0, whip: 0, turnAcc: 0,
      grab: false, pid: null, busy: 0, pa: {}, kq: 0, lastSide: 0, snaps: 0, clean: 0, left: 0, full: false, squeal: 0, pose: 0,
      knots, bot: { om: 0, want: .6, think: 0, fumble: -3 },
    };
    ui.setScore(0);
  }
  const grade = () => clamp(.8 * G.w + (G.full ? .2 * clamp((G.left - R.extra) / 3.5, 0, 1) : 0) - TUNE.snapCost * G.snaps, 0, 1);   /* all in = FIXED; PERFECT needs time to spare; every snap costs */
  const stats = () => [['REELED', `${Math.floor(G.w * 100)}%`], ['SNAPS', G.snaps ? `${G.snaps} (-${Math.round(G.snaps * TUNE.snapCost * 100)}%)` : 0], ['KNOTS', `${G.clean} / ${G.knots.length}`], ['TIME LEFT', G.full ? Math.max(0, G.left - R.extra).toFixed(1) + 's' : '-']];
  const inGuide = () => G.knots.find(k => !k.done && G.w >= k.w0 && G.w < k.w0 + TUNE.knotLen);
  const knotK = () => G.knots.reduce((m, k) => k.done ? m : Math.max(m, clamp((G.w - k.w0 + TUNE.knotWarn) / TUNE.knotWarn, 0, 1) * (G.w < k.w0 + TUNE.knotLen ? 1 : 0)), 0);   /* 0..1: how close a knot is to the guide */
  const redNow = () => lerp(TUNE.red, TUNE.knotRed, knotK());

  /* ---------- 5. verbs: crank (pointer, keys and bot all turn it), snap, finish ---------- */
  function crank(d) {
    if (!R.live || G.stun > 0 || G.full) return;
    G.phi += d; G.acc += Math.abs(d);
    G.w = Math.min(1, G.w + Math.abs(d) / TAU / TUNE.turns * (.8 + .4 * G.w)); ui.setScore(Math.round(G.w * 100));
    if ((G.turnAcc += Math.abs(d)) >= TAU / 4) { G.turnAcc -= TAU / 4; sfx.tone(320 + G.T * 700, 260 + G.T * 600, .025, 'square', .025); }
    for (const k of G.knots) {
      if (!k.warned && G.w > k.w0 - .1) { k.warned = true; ui.floatText(SP.x, SP.y - 33, 'EASE OFF!', 'gold'); sfx.tone(700, 500, .08, 'triangle', .04); sfx.tone(700, 500, .08, 'triangle', .04, .12); }
      if (!k.done && G.w >= k.w0 + TUNE.knotLen) {
        k.done = true;
        if (!k.bad) { G.clean++; ui.floatText(SP.x - 14, SP.y - 26, 'SMOOTH', 'ice'); sfx.ding(2); fx.burst(SP.x - woundR(G.w), SP.y, [RL, '#fff6d6'], 6, 30, 60, .35); }
      }
    }
    if (G.w >= 1) finish();
  }
  function snap() {
    const k = inGuide(); if (k) k.bad = true;
    const hard = clamp((G.T / TUNE.red - 1.3) * 1.5, 0, 4);                       /* way past the red (G.T / red = turns/s over redAt): it whips out up to 5x as much */
    G.snaps++; G.w = Math.max(0, G.w - TUNE.snapLoss * (1 + hard)); G.stun = TUNE.stun; G.whip = .5; G.T = 0; G.om = 0; G.over = 0; G.kq = 0;
    ui.setScore(Math.round(G.w * 100)); ui.floatText(SP.x - 18, SP.y - 20, 'SNAP!', 'bad'); ui.doFlash('rgba(255,90,60,.35)');
    R.shake(4); MG.hitstop(.07); sfx.noise(.16, .1, 2400); sfx.tone(520, 70, .25, 'sawtooth', .06);
    fx.burst(SP.x - woundR(G.w), SP.y, [RB, RL, '#1a0f14'], 12, 60, 140, .5);
  }
  function finish() {
    G.full = true; G.left = R.timer.left; G.T = Math.min(G.T, .5);
    fx.burst(SP.x, SP.y, [RL, RB, '#fff6d6', '#ffd23a'], 20, 70, 90, .7); fx.shock(SP.x, SP.y, '#fff6d6', 30);
    ui.floatText(SP.x, SP.y - 30, 'ALL REELED!', 'gold'); R.end();
  }

  /* ---------- 6. update ---------- */
  function update(dt) {
    const step = Math.min(G.kq, 24 * dt); if (step > 0) { G.kq -= step; crank(step); }            /* key presses play out as a quick third of a turn */
    const omNow = G.acc / dt; G.acc = 0;
    G.om = lerp(G.om, omNow, 1 - Math.exp(-dt / .13));
    const target = G.full ? 0 : G.om / TUNE.omRef;
    G.T = lerp(G.T, target, Math.min(1, dt * (target > G.T ? 9 : 7)));
    G.wd = lerp(G.wd, G.w, Math.min(1, dt * (G.w < G.wd ? 7 : 16)));
    G.stun = Math.max(0, G.stun - dt); G.whip = Math.max(0, G.whip - dt); G.pose += dt;
    if (G.stun > 0) G.phi -= dt * 9 * G.stun;                                                       /* the snapped loop spins the spool back */
    const red = redNow();
    if (R.live && G.T >= red) {
      G.over += dt; if ((G.squeal -= dt) <= 0) { G.squeal = .09; sfx.tone(1100 + G.over * 2400, 1500 + G.over * 2400, .07, 'sawtooth', .025); }
      if (MG.rng() < dt * 30) fx.spark(SP.x - woundR(G.w), SP.y, '#ffd23a');
      if (G.over >= TUNE.snapT) snap();
    } else G.over = Math.max(0, G.over - dt * 2);
  }

  /* ---------- 7. bot (?bot=1): cranks in circles like a person watching the dial. It aims for a needle just under the red, wavers a
     little, eases off when it sees a knot tagged near the guide or the needle touch red (after a reaction delay), and now and then
     gets carried away. Grades land around .65-.9. ---------- */
  function bot(dt) {
    const B = G.bot;
    if (G.stun > 0 || G.full) { B.om = 0; return; }
    if ((B.think -= dt) <= 0) {
      B.think = rng(.12, .24);
      const near = G.knots.some(k => !k.done && G.w > k.w0 - TUNE.knotWarn * rng(.8, 1.3) && G.w < k.w0 + TUNE.knotLen), red = redNow();
      B.want = near ? Math.max(TUNE.knotRed, red - .1) * rng(.66, .88) : TUNE.red * rng(.68, .93);   /* near a knot it reads the creeping red line, with a margin */
      if (G.T > red - .02) B.want = red * rng(.55, .75);                        /* it saw the needle touch red */
      if (B.fumble <= -3 && rng() < .008) B.fumble = rng(.35, .6);              /* carried away, about every other run (never twice in 3 s) */
    }
    B.fumble -= dt; if (B.fumble > 0) B.want = 1.1;
    B.om = lerp(B.om, B.want * TUNE.omRef, Math.min(1, dt * 6));
    crank(B.om * (1 + .1 * Math.sin(R.t * 8.3)) * dt);
  }

  /* ---------- 8. draw ---------- */
  const oval = (cx, cy, rx, ry, col) => {
    g.fillStyle = col; const n = Math.max(1, Math.round(ry * 3));
    for (let i = -n; i <= n; i++) { const yy = i / 3, w = rx * Math.sqrt(Math.max(0, 1 - (yy * yy) / (ry * ry))); if (w > 0) g.fillRect(r3(cx - w), r3(cy + yy), Math.round(w * 6) / 3, 1 / 3); }
  };
  const dot = (x, y, s, col) => { g.fillStyle = col; g.fillRect(r3(x - s / 2), r3(y - s / 2), s, s); };
  const line = (x0, y0, x1, y1, s, col) => { const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2); for (let i = 0; i <= n; i++) dot(lerp(x0, x1, i / n), lerp(y0, y1, i / n), s, col); };

  /* the slack ribbon: a curve through the machine, the desk edge, the floor and the spool, with loops that shrink as it reels in
     (the ones nearest the spool go first). Built fresh each frame from the shown amount (wd), so a snap visibly throws loops back out. */
  const LOOPS = [[0, .35, 4, 6, .5], [0, .75, 3.5, 5, -.6], [1, .25, 5.5, 4, .4], [1, .62, 4.5, 3, -.5], [2, .3, 7.5, 2, .2], [2, .72, 6, 1, -.3], [4, .5, 4.5, 0, .6]];   /* [segment, t, radius, order from the spool, tilt] */
  const cr = (p0, p1, p2, p3, t, i) => { const t2 = t * t, t3 = t2 * t; return .5 * (2 * p1[i] + (p2[i] - p0[i]) * t + (2 * p0[i] - 5 * p1[i] + 4 * p2[i] - p3[i]) * t2 + (3 * p1[i] - p0[i] - 3 * p2[i] + p3[i]) * t3); };
  function ribbonPath(wd) {
    const s = 1 - wd, E = [SP.x - woundR(wd), SP.y + 1], lin = t => [lerp(A[0], E[0], t), lerp(A[1], E[1], t)];
    const mix = (p, q, k) => [lerp(p[0], q[0], k), lerp(p[1], q[1], k)], k1 = Math.sqrt(s), k2 = Math.pow(s, .6);
    const K = [A, mix(lin(.2), [40, DESK_Y + 2], k1), mix(lin(.45), [14, FLOOR_Y - 1], k2), mix(lin(.7), [24, FLOOR_Y], k2), mix(lin(.86), GUIDE, Math.min(1, s * 3)), E];
    const P = [K[0], ...K, K[K.length - 1]], pts = [];
    for (let sgi = 0; sgi < K.length - 1; sgi++) {
      const p0 = P[sgi], p1 = P[sgi + 1], p2 = P[sgi + 2], p3 = P[sgi + 3], n = Math.max(4, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) * 1.6));
      for (let i = 0; i < n; i++) {
        const t = i / n, x = cr(p0, p1, p2, p3, t, 0), y = Math.min(FLOOR_Y, cr(p0, p1, p2, p3, t, 1)); pts.push([x, y]);
        for (const L of LOOPS) {
          if (L[0] !== sgi || Math.abs(t - L[1]) >= .5 / n) continue;
          const rr = L[2] * clamp(s * LOOPS.length - (LOOPS.length - 1 - L[3]), 0, 1); if (rr < .8) continue;
          const flat = sgi === 0 ? .5 : lerp(1, .42, clamp((y - (FLOOR_Y - 14)) / 12, 0, 1)), ry = rr * flat, up = flat < .7 ? -1 : 1, m = Math.ceil(rr * 5), ct = Math.cos(L[4] * flat), sn = Math.sin(L[4] * flat);
          for (let j = 1; j < m; j++) { const a = j / m * TAU, lx = Math.sin(a) * rr * (L[3] % 2 ? 1 : -1), ly = up * ry * (1 - Math.cos(a)); pts.push([x + lx * ct - ly * sn, Math.min(FLOOR_Y + 1, y + lx * sn + ly * ct)]); }
        }
      }
    }
    pts.push(E);
    return pts;
  }
  /* where knot k sits along the slack right now (null once it is reeled in) */
  let lastPath = null;
  function knotAt(k, pts = lastPath || ribbonPath(G.wd)) {
    const f = (k.w0 - G.wd) / Math.max(.001, 1 - G.wd); if (f < -.02 || f > 1) return null;
    let total = 0; const segL = []; for (let i = pts.length - 1; i > 0; i--) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); segL.push(l); total += l; }
    let want = Math.max(0, f) * total, i = pts.length - 1; for (const l of segL) { if (want <= l) { const q = want / (l || 1); return [lerp(pts[i][0], pts[i - 1][0], q), lerp(pts[i][1], pts[i - 1][1], q)]; } want -= l; i--; }
    return pts[0];
  }
  function drawRibbon(now) {
    const pts = lastPath = ribbonPath(G.wd), hot = G.T >= redNow() && R.live, wf = [];
    for (let i = 0, len = 0; i < pts.length; i++) { if (i) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); wf.push(Math.abs(Math.cos(len * .3 + G.phi * .4))); }   /* a flat ribbon twisting */
    pts.forEach(([x, y], i) => dot(x, y, 1.33 + 1.67 * wf[i], INK));
    pts.forEach(([x, y], i) => dot(x, y, .67 + 1.67 * wf[i], hot && Math.floor(now * 16) % 2 ? '#ff7a6a' : wf[i] > .45 ? RB : RS));
    g.fillStyle = RL; pts.forEach(([x, y], i) => { if (wf[i] > .7) g.fillRect(r3(x - .67), r3(y - .67), .67, .67); });
    for (const k of G.knots) {                                                                     /* knots: a dark lump with two ends, tagged as they near the guide */
      if (k.done) continue; const p = knotAt(k, pts); if (!p) continue;
      const near = G.w > k.w0 - .1, blink = near && Math.floor(now * 6) % 2;
      for (const sx of [-1, 1]) { oval(p[0] + sx * 2.33, p[1] - .67, 2.33, 1.67, INK); oval(p[0] + sx * 2.33, p[1] - .67, 1.67, 1, blink ? '#ffd23a' : RB); oval(p[0] + sx * 2.33, p[1] - .67, .67, .33, INK); }   /* a bow: two little loops */
      oval(p[0], p[1], 2.33, 2.33, INK); oval(p[0], p[1], 1.67, 1.67, blink ? '#ffd23a' : RB); oval(p[0] + .33, p[1] + .33, 1, 1, RS);   /* and the hard knot */
      line(p[0] - 1, p[1] - 1, p[0] + 1, p[1] + 1, .67, INK); line(p[0] + 1, p[1] - 1, p[0] - 1, p[1] + 1, .67, INK);
      if (near && !R.done) { const t = 'KNOT!', tw = textW(t, 2 / 3), tx = clamp(p[0] - tw / 2, 1, W - tw - 1), ty = p[1] - 11.67; g.fillStyle = INK; g.fillRect(tx - 1, ty - 1, tw + 2, 6.67); text(g, t, tx, ty, '#ffd23a', 2 / 3); }
    }
    if (G.whip > 0) {                                                                              /* the snapped end lashes out, wriggling */
      const k = Math.sin(G.whip / .5 * Math.PI), ex = SP.x - woundR(G.wd), ey = SP.y, wl = [];
      for (let i = 0; i <= 40; i++) { const u = i / 40; wl.push([ex - u * 26 * k, ey - u * 22 * k + Math.sin(u * 10 - now * 40) * 4 * u * k]); }
      for (const [x, y] of wl) dot(x, y, 2.67, INK);
      for (const [x, y] of wl) dot(x, y, 2, Math.floor(now * 20) % 2 ? '#ff7a6a' : RB);
    }
  }
  function drawSpool(now) {
    const rw = woundR(G.wd);
    st.hi(FLANGE, SP.x - FLANGE.width / 6, SP.y - FLANGE.height / 6);
    oval(SP.x, SP.y, rw + .67, rw + .67, INK); oval(SP.x, SP.y, rw, rw, RB); oval(SP.x + .67, SP.y + .67, rw - 1, rw - 1, RS); oval(SP.x - .33, SP.y - .33, rw - 1.33, rw - 1.33, RB);
    for (let rr = 9; rr < rw - 1.5; rr += 2.67) { g.fillStyle = RS; for (let a = 0; a < TAU; a += 1 / rr) g.fillRect(r3(SP.x + Math.cos(a) * rr), r3(SP.y + Math.sin(a) * rr), 1 / 3, 1 / 3); }   /* wound layers */
    g.fillStyle = RL; for (let a = 3.5; a < 4.6; a += .7 / rw) g.fillRect(r3(SP.x + Math.cos(a) * (rw - 1.33)), r3(SP.y + Math.sin(a) * (rw - 1.33)), .67, .67);              /* sheen, top left */
    line(SP.x + Math.cos(G.phi + 1.2) * 8, SP.y + Math.sin(G.phi + 1.2) * 8, SP.x + Math.cos(G.phi + 1.2) * (rw - .67), SP.y + Math.sin(G.phi + 1.2) * (rw - .67), .67, INK);   /* the outer end: shows it turning */
    oval(SP.x, SP.y, 7.33, 7.33, INK); oval(SP.x, SP.y, 6.67, 6.67, '#b8b8c4'); oval(SP.x - .67, SP.y - .67, 5, 5, '#d8d8e2'); oval(SP.x + 1, SP.y + 1, 4.5, 4.5, '#b8b8c4');   /* hub */
    for (let k = 0; k < 3; k++) { const a = G.phi + k * TAU / 3; oval(SP.x + Math.cos(a) * 4, SP.y + Math.sin(a) * 4, 1.33, 1.33, INK); }
  }
  function drawCrank(now) {
    const kx = SP.x + Math.cos(G.phi) * CRANK, ky = SP.y + Math.sin(G.phi) * CRANK, hot = G.grab;
    line(SP.x, SP.y, kx, ky, 3, INK); line(SP.x, SP.y, kx, ky, 2, '#b8b8c4'); line(SP.x - .33, SP.y - .33, kx - .33, ky - .33, .67, '#f0f0f8');
    oval(SP.x, SP.y, 2, 2, INK); oval(SP.x, SP.y, 1.33, 1.33, '#f0f0f8');
    oval(kx, ky, 4.33, 4.33, INK); oval(kx, ky, 3.67, 3.67, hot ? '#e8b878' : '#c08a4a'); oval(kx + .67, ky + .67, 2.67, 2.67, '#7a4a1e'); oval(kx - .33, ky - .33, 2.67, 2.67, hot ? '#e8b878' : '#c08a4a'); dot(kx - 1.33, ky - 1.33, 1, '#fff6d6');
    if (!G.grab && !R.done && R.t < 3 && Math.floor(now * 3) % 2) {                                    /* a hint arc: which way to go round */
      for (let a = 0; a < 2.4; a += .1) dot(SP.x + Math.cos(G.phi + .35 + a) * (CRANK + 5), SP.y + Math.sin(G.phi + .35 + a) * (CRANK + 5), 1, a > 2 ? '#ffd23a' : 'rgba(255,240,140,.7)');
    }
  }
  function drawDial(now) {
    const red = redNow(), kk = knotK(), knot = kk > 0, face = FACES[Math.round(kk * 6)];
    st.hi(face, DIAL.x - 19, DIAL.y - 19);
    if (knot && !R.done) {                                                                        /* a knot near: the red sector throbs */
      g.globalAlpha = .2 + .5 * (.5 + .5 * Math.sin(now * 14)); g.fillStyle = '#ffb08a';
      for (let v = red; v <= 1; v += .008) { const q = angOf(v), c = Math.cos(q), sn = Math.sin(q); for (let r = 12.33; r <= 15; r += .67) g.fillRect(r3(DIAL.x + c * r - .33), r3(DIAL.y - sn * r - .33), .67, .67); }
      g.globalAlpha = 1;
    }
    const jit = G.T > red - .12 ? (MG.rng() - .5) * .05 * (1 + G.over * 6) : 0, a = angOf(clamp(G.T + jit, 0, 1.04));
    line(DIAL.x, DIAL.y, DIAL.x + Math.cos(a) * 13, DIAL.y - Math.sin(a) * 13, 1.33, INK); line(DIAL.x, DIAL.y, DIAL.x + Math.cos(a) * 12.67, DIAL.y - Math.sin(a) * 12.67, .67, '#d0302a');
    oval(DIAL.x, DIAL.y, 2.33, 2.33, INK); oval(DIAL.x, DIAL.y, 1.67, 1.67, '#b8b8c4');
    if (knot && !R.done) { const t = 'EASE OFF', tw = textW(t, 2 / 3); g.fillStyle = INK; g.fillRect(DIAL.x - tw / 2 - 1, 51.33, tw + 2, 6.67); text(g, t, DIAL.x - tw / 2, 52.33, Math.floor(now * 8) % 2 ? '#ffd23a' : '#ff7a6a', 2 / 3); }   /* over the label plate */
    else text(g, 'TENSION', 93 - TEXTW / 2, 52.33, G.T >= red && Math.floor(now * 10) % 2 ? '#d0302a' : '#3a2a30', 2 / 3);
  }
  function drawFixer() {                                                                            /* the fixer feeds the ribbon onto the spool by hand */
    let pose = 'carry';
    if (R.done) pose = R.won ? 'cheer' : 'scared';
    else if (G.stun > 0) pose = G.stun > TUNE.stun - .2 ? 'squish' : 'fall';
    else if (G.T >= redNow() - .04) pose = 'holdhit';
    else if (G.om > 2) pose = Math.floor(G.pose * 7) % 2 ? 'carry' : 'carry2';
    oval(FIX.x, FLOOR_Y + 1.33, 6, 1.33, 'rgba(10,6,4,.45)');
    R.crew(FIX.x, FLOOR_Y + 1, pose);
  }
  function draw() {
    const now = performance.now() / 1000;
    st.hi(ROOM, 0, 0);
    st.hi(TYPEWRITER, TW.x, TW.y);
    drawDial(now); drawSpool(now); drawFixer(); drawRibbon(now); drawCrank(now);
    fx.draw(g);
  }

  /* ---------- 9. input + run. Drag in circles (the angle around the spool's hub turns the crank); keys alternate ← → ---------- */
  /* the crank follows one pointer (G.pid), so a resting second finger is ignored. Another finger takes over only by cranking while the
     grabbed one sits idle (.3 s), or with a fresh first touch (isPrimary: nothing else on the glass), which also clears a grab whose
     release went to another pointer. G.pa keeps each pointer's last angle round the hub. */
  function grabAt(x, y, ev) { G.grab = true; G.pid = ev ? ev.pointerId : null; G.busy = R.t; G.pa[G.pid] = Math.atan2(y - SP.y, x - SP.x); }
  const mine = ev => !ev || G.pid == null || ev.pointerId === G.pid;
  window.RIBBON = { get G() { return G; }, crank, TUNE };
  R.run({
    reset, update, draw, grade, stats, bot,
    ended() { G.grab = false; G.kq = 0; if (R.won) fx.confetti(SP.x, SP.y - 10, 10, [RB, RL, '#fff6d6']); },
    down(x, y, ev) { if (G.grab && !mine(ev) && ev.isPrimary === false) { G.pa[ev.pointerId] = Math.atan2(y - SP.y, x - SP.x); return; } grabAt(x, y, ev); },
    move(x, y, ev) {
      if (!G.grab) { if (R.ptr.down) grabAt(x, y, ev); return; }                 /* pressed before the start */
      if (ev && ev.pointerType === 'mouse' && !ev.buttons) { if (mine(ev)) G.grab = false; return; }   /* a hovering mouse; if it held the crank, its release went elsewhere */
      if (Math.hypot(x - SP.x, y - SP.y) < 4) return;                       /* too near the hub: the angle is noise */
      const id = ev ? ev.pointerId : null, a = Math.atan2(y - SP.y, x - SP.x), d = id in G.pa ? clamp(wrap(a - G.pa[id]), -1.2, 1.2) : 0; G.pa[id] = a;
      if (!mine(ev)) { if (Math.abs(d) > .05 && R.t - G.busy > .3) { G.pid = id; G.busy = R.t; } return; }   /* this one cranks while the grabbed one idles: hand over */
      crank(d); if (Math.abs(d) > .05) G.busy = R.t;
    },
    up(x, y, ev) { if (mine(ev)) G.grab = false; if (ev) delete G.pa[ev.pointerId]; },
    key(ev, k) {
      if (ev.repeat) return; const side = k === 'arrowleft' || k === 'a' ? -1 : k === 'arrowright' || k === 'd' ? 1 : 0; if (!side) return;
      if (side !== G.lastSide) { G.kq += TAU / 3; G.lastSide = side; } else sfx.thud();
    },
  });
})();
