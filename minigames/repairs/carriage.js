/* ============================================================
   CARRIAGE WON'T RETURN (repair "carriage", verb SLAM, 8 s). The carriage is jammed at the end of the line and the bell has gone quiet.
   The fixer hangs off the return lever. The return gauge's needle swings across the dial: drop your weight on the lever while the needle
   is in the green and the carriage lurches a notch home. Three slams and it zips back with a DING. Each slam shrinks the green and
   quickens the needle (on higher levels the green starts to wander). A yank outside the green is a CLUNK.
   Grade = the mean aim of the 3 slams (bullseye 1, edge of the green .5), x .55 if the carriage never got home, minus .1 per clunk.
   Level: a quicker needle, a narrower green, a wandering green on later slams.
   Controls: tap / click anywhere, or Space / Enter / ↓ / S.
   Layout: 1 sprites · 2 setup · 3 tuning · 4 state · 5 verbs · 6 update · 7 bot · 8 draw · 9 run (as leak.js).
   ============================================================ */
(() => {
  'use strict';
  const { clamp, lerp, sfx } = MG;
  const { R: AR, shapes: { ell, box, cap, and, or } } = MGArt, { make, hl, cvs, text, textW } = MGArt3;
  const ramp = (k, cols) => MGArt.R[k] || (MGArt.R[k] = MGArt.ramps.push(cols.map(MGArt.hex)) - 1);   /* append-only, like the kit's desk ramps */
  const TRACK = ramp('carTrack', ['#9a8a62', '#e2d2a4', '#f4ead0']), LIT = ramp('carLit', ['#2f8a35', '#74c648', '#d4ffb0']);

  /* ---------- 1. sprites that don't need the desk colour (hi-res, 3 px per unit) ---------- */
  /* the return gauge, 84x48 units: brass bezel, cream face, the track the needle sweeps (red at both ends) and ticks. Pivot at hi-res (126, 123). */
  const DW = 252, DH = 144, PX = 126, PY = 123, R0 = 78, R1 = 102, SWING = 66;   /* track radii (hi-res px); needle swing, degrees each side of up */
  const angOf = (x, y) => Math.atan2(x - PX, PY - y) * 180 / Math.PI, track = (x, y) => { const r = Math.hypot(x - PX, y - PY); return r >= R0 && r <= R1 && y < PY; };
  const DIAL = make(DW, DH, px => {
    px.shape(and(ell(PX, PY, 120, 120), (x, y) => y < 141), AR.gold, 1);
    px.shape(and(ell(PX, PY, 111, 111), (x, y) => y < 135), AR.paper, 2);
    px.shape((x, y) => track(x, y) && Math.abs(angOf(x, y)) <= SWING + 3, TRACK, 3);
    px.shape((x, y) => track(x, y) && Math.abs(angOf(x, y)) <= SWING + 3 && Math.abs(angOf(x, y)) >= SWING * .86, AR.red, 4);
    for (let i = -6; i <= 6; i++) {                                              /* ticks round the outside of the track */
      const a = i * SWING / 6 * Math.PI / 180, big = i % 3 === 0, r0 = big ? 103 : 104.5, r1 = big ? 110 : 108;
      px.shape(cap(PX + Math.sin(a) * r0, PY - Math.cos(a) * r0, PX + Math.sin(a) * r1, PY - Math.cos(a) * r1, big ? 1.5 : .9), AR.ink, 5);
    }
    hl(px, 24, 66, 2, 14, 2); hl(px, 34, 44, 2, 8, 2);
  });
  { const x = DIAL.getContext('2d'); text(x, 'RETURN', PX - textW('RETURN', 1) / 2, PY - 62, '#8a7a80', 1); }
  const ZONES = new Map();
  const zoneSpr = (a0, a1, look) => {                                            /* the green (and its yellow bullseye) between angles a0..a1, cached. look: 0 / 1 lit / 2 clunk */
    const k = a0 + '|' + a1 + '|' + look; let cv = ZONES.get(k); if (cv) return cv;
    if (ZONES.size > 90) ZONES.clear();
    const c = (a0 + a1) / 2, core = (a1 - a0) / 6;
    cv = make(DW, DH, px => {
      px.shape((x, y) => { if (!track(x, y)) return false; const a = angOf(x, y); return a >= a0 && a <= a1; }, [AR.leaf, LIT, AR.red][look], 1);
      px.shape((x, y) => track(x, y) && Math.abs(angOf(x, y) - c) <= core, [AR.banY, AR.star, AR.orange][look], 2);
    });
    ZONES.set(k, cv); return cv;
  };
  const HUB = make(24, 24, px => { px.shape(ell(12, 12, 10, 10), AR.metal, 1); px.shape(ell(12, 12, 3.4, 3.4), AR.ink, 2); hl(px, 6, 6, 2, 2, 2); });
  const LAMP = [false, true].map(on => make(24, 24, px => { px.shape(ell(12, 12, 10.5, 10.5), AR.metal, 1); px.shape(ell(12, 12, 7.5, 7.5), on ? LIT : AR.ink, 2); hl(px, 8, 8, 2, 2, 2); }));
  const PAPER = make(138, 84, px => { px.shape(box(0, 0, 138, 84), AR.paper, 1); });
  ['TO BE, OR NOT TO', 'BE: THAT IS THE', 'QUESTION: WHETH'].forEach((l, i) => text(PAPER.getContext('2d'), l, 12, 9 + i * 11, '#3a2a30', 1));
  const BELL = make(42, 33, px => {                                              /* the margin bell, out where you can see it stay silent */
    px.shape(box(6, 24, 30, 6), AR.woodD, 1); px.shape(box(19, 18, 4, 7), AR.metal, 2);
    px.shape(and(ell(21, 20, 15, 15), (x, y) => y < 20), AR.gold, 3); px.shape(ell(21, 5, 3, 3), AR.gold, 4); hl(px, 11, 10, 2, 5, 2);
  });

  /* ---------- 2. setup ---------- */
  const R = MGRepair.setup({
    id: 'carriage', verb: 'SLAM', scoreIcon: LAMP[1],
    how: 'Tap when the needle hits the <em>green</em>',
    legend: [[LAMP[1], '<em>slam</em> in the green, 3 times'], [BELL, 'bring the carriage <em>home</em>']],
    hint: 'tap · click · Space',
  });
  const { st, g, W, H, ui, fx, rng, level: LV } = R;

  /* geometry (units): the gauge up top, the carriage on its rail, the machine body below */
  const DX = 18, DY = 17, NX = DX + PX / 3, NY = DY + PY / 3;                      /* dial sprite corner; needle pivot (60, 58) */
  const PINNED = 22, HOME = 54, NOTCH = (HOME - PINNED) / 3, CAR_Y = 90, PAPER_Y = 76, RAIL = 107, TYPE_X = 63;
  const PIV = { dx: 3, y: 96 }, ARM = 15, A_REST = -130 * Math.PI / 180, A_SLAM = -188 * Math.PI / 180, HANG = 13.3, HIT = 8.7;
  /* the carriage in the desk colour: platen, knobs, frame with its margin scale */
  const CARR = make(180, 54, px => {
    px.shape(cap(18, 18, 162, 18, 13), AR.ink, 1); hl(px, 20, 8, 140, 2, 2);
    px.shape(box(6, 30, 168, 22), R.deskR, 2); hl(px, 7, 31, 166, 1, 2);
    px.shape(box(24, 36, 132, 9), AR.paper, 3);
    for (let i = 0; i <= 22; i++) px.dot(27 + i * 6, i % 5 ? 41 : 38, AR.ink, 1, 4), px.dot(27 + i * 6, 42, AR.ink, 1, 4), px.dot(27 + i * 6, 43, AR.ink, 1, 4);
    px.shape(or(ell(9, 18, 9, 16), ell(171, 18, 9, 16)), AR.metal, 5);
    for (const kx of [9, 171]) for (let j = -2; j <= 2; j++) for (let y = 6; y < 31; y += 2) px.tone(kx + j * 3, y, 0);
    px.shape(ell(9, 18, 4, 4), AR.metal, 6);
  });
  const BODY = make(360, 120, px => {                                            /* units y 110..150 */
    px.shape(or(box(0, 12, 360, 108), ell(180, 12, 180, 12)), R.deskR, 1); hl(px, 0, 13, 360, 2, 2);
    px.shape(box(14, 30, 300, 58), AR.ink, 2);
    for (let r = 0; r < 2; r++) for (let i = 0; i < 9 - r; i++) { const x = 36 + r * 16 + i * 32, y = 44 + r * 28; px.shape(ell(x, y, 13, 11), AR.metal, 3); px.shape(ell(x, y - 2, 10, 8), AR.paper, 4); }
    px.shape(box(118, 98, 124, 18), AR.gold, 2);
    px.shape(or(ell(14, 118, 12, 5), ell(346, 118, 12, 5)), AR.ink, 2);
  });
  { const x = BODY.getContext('2d'), nm = MGRepair.DESKS[R.desk].name.toUpperCase(); text(x, nm, 180 - textW(nm, 1) / 2, 103, '#1a0f14', 1); }
  const ROOM = cvs(W * 3, H * 3, x => {
    const r = (c, a, b, w, hh) => { x.fillStyle = c; x.fillRect(a * 3, b * 3, w * 3, hh * 3); };
    r('#12402a', 0, 0, W, H); for (let sx = 0; sx < W; sx += 8) r('#0f3824', sx, 0, 4, 110);                 /* the Floor's wall */
    r('rgba(0,0,0,.25)', DX + 4, DY + 4, 84, 48);                                                              /* the gauge's shadow */
    r('#1a0f14', 57.67, 60, 4.67, 22); r('#5a5a66', 58, 60, 4, 22); r('#b8b8c4', 58.67, 60, 1, 22);           /* its post */
    r('#1a0f14', 42.67, 64.67, 34.67, 9.67); r('#b38004', 43, 65, 34, 9); r('#ffd23a', 43, 65, 34, 8); r('#fffbe0', 43, 65, 34, .67);   /* the lamp plate */
    x.drawImage(BODY, 0, 110 * 3);
    r('#1a0f14', 0, RAIL - .33, W, 4.67); r('#5a5a66', 0, RAIL, W, 4); r('#b8b8c4', 0, RAIL, W, 2.33); r('#f0f0f8', 0, RAIL, W, .67);   /* the rail */
    for (let sx = 2; sx < W; sx += 5) r('#5a5a66', sx, RAIL + 2.67, 2.67, .67);                                /* its rack teeth */
    for (const [a, c] of [[PINNED - 3.33, '#b8322a'], [HOME + 60.33, '#b8322a']]) { r('#1a0f14', a - .33, RAIL - 4.33, 3.67, 8.67); r(c, a, RAIL - 4, 3, 8); r('#e86a50', a, RAIL - 4, 3, .67); }   /* end stops */
    r('#1a0f14', 0, 150, W, .67); r('#5a3517', 0, 150.67, W, 9.33); r('#8a5a2b', 0, 150.67, W, .67); r('rgba(0,0,0,.35)', 0, 151.33, W, 2);   /* the desk */
  });

  /* ---------- 3. tuning ---------- */
  const TUNE = {
    need: 3,                                                                    /* slams to bring it home */
    T: n => lerp(1.7, 1.4, LV) * Math.pow(.93, n),                              /* seconds per full swing (there and back); n = slams done */
    hw: n => Math.max(.2, lerp(.32, .25, LV) * Math.pow(.8, n)),                /* half-width of the green, in needle units (the needle runs -1..1); the floor keeps the last green >= ~100 ms at level 1 */
    drift: n => n ? LV * .12 : 0,                                               /* the green wanders on later slams at higher levels */
    core: 1 / 3,                                                                /* the bullseye: the middle third of the green */
    miss: .1, part: .55,                                                        /* grade costs: per clunk; an unfinished return keeps 55% */
    down: .06, hold: .22, lock: .46,                                            /* the lever: slams down, held, springs back; no yank till it is up */
  };

  /* ---------- 4. state ---------- */
  let G;
  const zoneAt = (n, z) => { let c; do c = rng(-.78, .78); while (z != null && Math.abs(c - z) < .38); return clamp(c, -.86 + TUNE.hw(n) + TUNE.drift(n), .86 - TUNE.hw(n) - TUNE.drift(n)); };
  function reset() {
    G = {
      ph: 0, zc: zoneAt(0, null), zph: rng(6.28), hwShown: TUNE.hw(0), inZone: false,
      slams: 0, misses: 0, qSum: 0, best: 0, lt: 9, good: false, cx: PINNED, cv: 0, cxT: PINNED, tick: 0,
      zip: -1, rang: false, bellT: 0, feed: 0, early: false, flashBad: 0, lampHit: [0, 0, 0], grind: .5, ghost: null,
      bot: { at: null, wait: .3 },
    };
    ui.setScore(0);
  }
  const needleU = ph => { const f = ph - Math.floor(ph); return .6 * (1 - 4 * Math.abs(f - .5)) - .4 * Math.cos(f * Math.PI * 2); };   /* -1..1, eased at the ends */
  const zoneC = t => G.zc + TUNE.drift(G.slams) * Math.sin(t * 2.1 + G.zph);
  const grade = () => clamp(G.qSum / TUNE.need * (G.slams >= TUNE.need ? 1 : TUNE.part) - TUNE.miss * G.misses, 0, 1);
  const stats = () => [['SLAMS', `${G.slams} / ${TUNE.need}`], ['CLUNKS', G.misses], ['AIM', G.slams ? Math.round(G.qSum / G.slams * 100) + '%' : '-'],
    ...(G.early && R.timer.left >= .5 ? [['TIME LEFT', R.timer.left.toFixed(1) + 's']] : [])];

  /* ---------- 5. verbs: yank the lever. In the green it slams the carriage a notch home; outside it just clunks. ---------- */
  function yank() {
    if (!R.live || G.lt < TUNE.lock || G.zip >= 0) return;
    const u = needleU(G.ph), d = Math.abs(u - zoneC(R.t)) / TUNE.hw(G.slams);
    G.lt = 0; G.good = d <= 1;
    sfx.clack(2); sfx.tone(170, 80, .09, 'square', .06); fx.puff(G.cx + PIV.dx + Math.cos(A_SLAM) * ARM, RAIL - .5, '#c9b88a', 3);   /* the fixer lands on the rail */
    if (!G.good) {                                                              /* CLUNK: the carriage shudders and stays put */
      G.misses++; G.cv -= 26; G.flashBad = .3;
      sfx.bonk(); ui.floatText(NX, NY - 6, 'CLUNK', 'bad'); R.shake(1.6);
      fx.puff(G.cx + 1, RAIL - 1, '#8a7a80', 3); return;
    }
    const q = d <= TUNE.core ? 1 : .85 - .35 * (d - TUNE.core) / (1 - TUNE.core), bull = q === 1;
    G.ghost = { c: zoneC(R.t), hw: TUNE.hw(G.slams), t: .34 };                /* the green it hit blinks out; the next one grows in elsewhere */
    G.qSum += q; G.best = Math.max(G.best, q); G.lampHit[G.slams] = .5; G.slams++; G.hwShown = 0; ui.setScore(G.slams); ui.bump();
    const lx = 49 + (G.slams - 1) * 11;
    fx.ring(lx, 69.5, '#d4ffb0', 9); fx.burst(lx, 69.5, ['#d4ffb0', '#74c648', '#fffbe0'], 6, 30, 60, .35);
    if (G.slams >= TUNE.need) {                                                 /* the last one: it lets go and zips home */
      G.zip = 0; G.cxT = HOME; G.cv += 220; G.early = true;
      sfx.noise(.4, .07, 3200); sfx.tone(260, 1100, .32, 'sawtooth', .03); MG.hitstop(.08); R.shake(3.5);
      ui.floatText(NX, NY - 8, bull ? 'BULLSEYE!' : 'SLAM!', 'gold big');
    } else {
      G.cxT = PINNED + NOTCH * G.slams; G.cv += 150;                            /* it lurches a notch; the green shrinks and jumps; the needle keeps its swing */
      G.zc = zoneAt(G.slams, G.zc);
      sfx.noise(.12, .08, 1800); sfx.tone(120, 55, .16, 'triangle', .09); if (bull) sfx.ding(G.slams + 2);
      MG.hitstop(bull ? .07 : .05); R.shake(bull ? 3 : 2.4);
      ui.floatText(NX, NY - 8, bull ? 'BULLSEYE!' : 'SLAM!', bull ? 'gold' : '');
    }
    fx.burst(G.cx + 30, RAIL, ['#ffd23a', '#fff08c', '#ff8a3a'], 10, 70, 220, .35); fx.puff(G.cx + 3, RAIL - 2, '#c9b88a', 4);
  }

  /* ---------- 6. update ---------- */
  function update(dt) {
    const now = R.t;
    if (R.live || G.zip >= 0) G.ph += dt / TUNE.T(G.slams);
    G.lt += dt; G.flashBad = Math.max(0, G.flashBad - dt); G.bellT = Math.max(0, G.bellT - dt);
    G.lampHit = G.lampHit.map(v => Math.max(0, v - dt)); if (G.ghost) G.ghost.t -= dt;
    G.hwShown = lerp(G.hwShown, TUNE.hw(G.slams), Math.min(1, dt * 14));
    /* the needle crossing into the green: a soft tick, the green lights up */
    const inz = R.live && G.zip < 0 && Math.abs(needleU(G.ph) - zoneC(now)) <= TUNE.hw(G.slams);
    if (inz && !G.inZone) sfx.tone(2400, 2400, .012, 'square', .012);
    G.inZone = inz;
    /* the carriage rides a stiff spring toward its notch; a ratchet click every tooth */
    const x0 = G.cx; G.cv += ((G.cxT - G.cx) * 420 - G.cv * 26) * dt; G.cx = Math.max(PINNED - 1.2, G.cx + G.cv * dt);
    if (Math.floor(G.cx / 2.5) !== Math.floor(x0 / 2.5) && G.cx > x0) sfx.tone(1500, 900, .014, 'square', .018);
    if (G.zip >= 0) {
      G.zip += dt;
      if (!G.rang && (Math.abs(G.cx - HOME) < .6 || G.zip > .5)) {               /* home: DING, the paper feeds a line */
        G.rang = true; G.bellT = .6; sfx.bell(); fx.ring(107, 114, '#fffbe0', 14); fx.burst(107, 113, ['#ffd23a', '#fffbe0'], 8, 40, 80, .4);
        ui.floatText(104, 104, 'DING!', 'gold'); R.end();
      }
    }
    if (G.rang) G.feed = Math.min(1, G.feed + dt * 5);
    /* stuck: it grinds against the stop now and then */
    if (R.live && G.zip < 0 && (G.grind -= dt) <= 0) { G.grind = rng(.7, 1.2); fx.puff(G.cx + 60.5, RAIL - 1, '#8a7a80', 2); }
  }

  /* ---------- 7. bot (?bot=1): watches the needle, waits for a pass it can still read (a beat of lead), times the yank for the middle of
     the green with a human spread (~35 ms) and the odd fumble that lands early or late. A clunk or a slam resets its read. ---------- */
  function bot(dt) {
    const B = G.bot;
    if (G.lt < TUNE.lock || G.zip >= 0) { B.at = null; return; }
    if ((B.wait -= dt) > 0) return;
    if (B.at == null) {
      const step = 1 / 120, rate = 1 / TUNE.T(G.slams); let prev = needleU(G.ph) - zoneC(R.t);
      for (let k = 1; k < 360; k++) {
        const t = k * step, dd = needleU(G.ph + t * rate) - zoneC(R.t + t);
        if (Math.sign(dd) !== Math.sign(prev) && t >= .24) { B.at = t; break; }
        prev = dd;
      }
      if (B.at == null) return;
      const gauss = 2 * (rng() + rng() + rng()) - 3;
      B.at += gauss * .035 + (rng() < .08 ? (rng() < .5 ? -1 : 1) * rng(.07, .15) : 0);
    }
    if ((B.at -= dt) <= 0) { B.at = null; B.wait = rng(.12, .3); yank(); }
  }

  /* ---------- 8. draw ---------- */
  function line(x0, y0, x1, y1, col, s) {                                        /* a straight pixel line in 1/3-unit steps, s units thick */
    const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) * 3)); g.fillStyle = col;
    for (let i = 0; i <= n; i++) { const t = i / n; g.fillRect(Math.round((lerp(x0, x1, t) - s / 2) * 3) / 3, Math.round((lerp(y0, y1, t) - s / 2) * 3) / 3, s, s); }
  }
  const chev = j => Math.round(clamp(Math.min(j, 17 - j), 0, 8) * .9) / 3;      /* a chevron's row offset: rows of 1/3 unit, 6 units tall */
  function leverAngle() {                                                        /* slams down, held under the fixer's weight, then springs back with a wobble */
    const t = G.lt, { down, hold, lock } = TUNE;
    if (t < down) return lerp(A_REST, A_SLAM, t / down);
    if (t < hold) return A_SLAM;
    if (t < lock) { const k = (t - hold) / (lock - hold); return lerp(A_SLAM, A_REST, 1 - Math.pow(1 - k, 3)) + Math.sin(k * 9) * (1 - k) * .1; }
    return A_REST;
  }
  function drawGauge(now) {
    st.hi(DIAL, DX, DY);
    const c = zoneC(R.t), hw = G.hwShown;
    if (G.zip < 0) st.hi(zoneSpr(Math.round((c - hw) * SWING), Math.round((c + hw) * SWING), G.flashBad > 0 && Math.floor(G.flashBad * 20) % 2 ? 2 : G.inZone ? 1 : 0), DX, DY);
    const gh = G.ghost; if (gh && gh.t > 0 && Math.floor(gh.t * 24) % 2) st.hi(zoneSpr(Math.round((gh.c - gh.hw) * SWING), Math.round((gh.c + gh.hw) * SWING), 1), DX, DY);
    const a = needleU(G.ph) * SWING * Math.PI / 180, sx = Math.sin(a), sy = -Math.cos(a);
    line(NX - sx * 6, NY - sy * 6, NX + sx * 32, NY + sy * 32, '#1a0f14', 1.67);
    line(NX - sx * 5.33, NY - sy * 5.33, NX + sx * 31.33, NY + sy * 31.33, '#c0392b', .67);
    line(NX + sx * 27, NY + sy * 27, NX + sx * 31.33, NY + sy * 31.33, '#ff8a6a', .67);
    st.hi(HUB, NX - 4, NY - 4);
    for (let i = 0; i < TUNE.need; i++) {                                        /* one lamp per slam */
      const on = i < G.slams, next = i === G.slams && R.live && Math.floor(now * 3) % 2;
      st.hi(LAMP[on ? 1 : 0], 45 + i * 11, 65.67);
      if (next) { g.fillStyle = 'rgba(212,255,176,.25)'; g.fillRect(46.33 + i * 11, 67, 5.33, 5.33); }
      if (G.lampHit[i] > 0) { g.fillStyle = `rgba(255,255,255,${(G.lampHit[i] * 1.4).toFixed(2)})`; g.fillRect(46.33 + i * 11, 67, 5.33, 5.33); }
    }
  }
  function drawCarriage(now) {
    const cx = Math.round(G.cx * 3) / 3, py = PAPER_Y - G.feed * 3.67;
    st.hi(PAPER, cx + 6, py);
    if (R.live && G.zip < 0 && Math.floor(now * 2.5) % 2) { g.fillStyle = '#c0392b'; g.fillRect(cx + 6 + 4 + 15 * 2, py + 3 + 2 * 3.67 + 2.67, 1.67, .67); }   /* the cursor, stuck at the margin */
    st.hi(CARR, cx, CAR_Y);
    g.fillStyle = '#1a0f14'; g.fillRect(TYPE_X - 2, 98.67, 4.67, 6); g.fillStyle = '#b8322a'; g.fillRect(TYPE_X - 1.67, 99, 4, 1.67); g.fillStyle = '#b8b8c4'; g.fillRect(TYPE_X - 1, 100.67, 2.67, 3.67);   /* the type guide */
    if (R.live && G.zip < 0) {                                                   /* chevrons over the bare rail, running toward home */
      for (let i = 0, x = cx + 63; x + 4 < HOME + 60; x += 7, i++) {
        const k = ((Math.floor(now * 7) - i) % 4 + 4) % 4, col = k === 0 ? '#fff08c' : k === 1 ? '#ffd23a' : '#a8681a';
        g.fillStyle = '#1a0f14'; for (let j = -1; j <= 18; j++) g.fillRect(x + chev(j) - .33, 93 + j / 3, 2, 1 / 3);
        g.fillStyle = col; for (let j = 0; j < 18; j++) g.fillRect(x + chev(j), 93 + j / 3, 1.33, 1 / 3);
      }
    }
  }
  function drawFixer() {
    const cx = Math.round(G.cx * 3) / 3, pvx = cx + PIV.dx, pvy = PIV.y, ang = leverAngle(), tx = pvx + Math.cos(ang) * ARM, ty = pvy + Math.sin(ang) * ARM;
    line(pvx, pvy, tx, ty, '#1a0f14', 2.33); line(pvx, pvy, tx, ty, '#b8b8c4', 1); line(pvx - .33, pvy - .33, tx - .33, ty - .33, '#f0f0f8', .33);
    g.fillStyle = '#1a0f14'; g.fillRect(Math.round(tx * 3) / 3 - 1.67, Math.round(ty * 3) / 3 - 1.67, 3.33, 3.33); g.fillStyle = '#3a2a30'; g.fillRect(Math.round(tx * 3) / 3 - 1, Math.round(ty * 3) / 3 - 1, 2, 2);
    g.fillStyle = '#5a5a66'; g.fillRect(pvx - 1, pvy - 1, 2, 2); g.fillStyle = '#f0f0f8'; g.fillRect(pvx - .67, pvy - .67, .67, .67);
    if (R.done && R.won && G.feed > 0) { g.fillStyle = 'rgba(10,6,4,.4)'; g.fillRect(tx - 5, RAIL - .33, 10, 1); R.crew(tx + 1, RAIL, 'cheer'); return; }   /* home: the fixer drops off and cheers */
    const t = G.lt, down = t < TUNE.hold, sway = Math.round(needleU(G.ph) * 2) * .05;
    if (down) R.crew(tx, ty + HIT, 'holdhit');
    else if (R.done) R.crew(tx, ty + HANG, 'hang', { expr: R.won ? 'giggle' : 'screech' });
    else if (t < TUNE.lock + .2) R.crew(tx, ty + HANG, G.good ? 'swing' : 'hang', { expr: G.good ? 'giggle' : 'screech' });
    else R.crew(tx, ty + HANG, 'hang', { tilt: sway });
  }
  function draw() {
    const now = performance.now() / 1000;
    st.hi(ROOM, 0, 0);
    st.hi(BELL, 101 + (G.bellT > 0 ? Math.round(Math.sin(G.bellT * 50) * G.bellT * 3) / 3 : 0), 111);            /* the bell: silent, then it rocks as it rings */
    drawCarriage(now);
    drawFixer();
    drawGauge(now);
    fx.draw(g);
  }

  /* ---------- 9. input + run ---------- */
  window.CARRIAGE = { get G() { return G; }, TUNE, yank, needleU, zoneC };
  R.run({
    reset, update, draw, grade, stats, bot,
    ended() { G.bot.at = null; },
    down() { yank(); },
    key(ev, k) { if (!ev.repeat && /^( |enter|arrowdown|s)$/.test(k)) yank(); },
  });
})();
