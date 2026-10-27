/* ============================================================
   LEAK IN THE CEILING (repair "leak", verb CATCH, 14 s): the reference repair every other one copies.
   Rain is getting in over the desk. The fixer runs under the drips with a bucket held overhead; a full bucket has to be tipped out
   of the open window (tap, swipe up, or Space/Up) before it overflows. Drips that reach the floor become puddles and cost grade.
   Grade = caught / (caught + puddles). Level: more leaks, faster drips, shorter warning swell, more drops that split, a smaller bucket.
   Controls: move the mouse / drag a finger / ← → A D; tap, click, swipe up, Space, ↑ or W tips the bucket out of the window.
   Layout of this file (keep it in every repair): 1 sprites · 2 setup · 3 tuning · 4 state · 5 verbs · 6 update · 7 bot · 8 draw · 9 run.
   ============================================================ */
(() => {
  'use strict';
  const { clamp, lerp, sfx } = MG;
  const { R: AR, shapes: { ell, box, poly, and, or } } = MGArt, { make, hl, cvs, text, textW } = MGArt3;

  /* ---------- 1. sprites that don't need the desk colour (hi-res: 3 px per unit, draw with st.hi) ---------- */
  const dropSpr = s => {                                                         /* a teardrop; cx/cy = the centre of its round part, in units */
    const cv = make(Math.round(12 * s), Math.round(16 * s), px => {
      px.shape(or(ell(6 * s, 10.6 * s, 5 * s, 5 * s), poly([[6 * s, 0], [10.8 * s, 9.6 * s], [1.2 * s, 9.6 * s]])), AR.drop, 1);
      hl(px, Math.round(3 * s), Math.round(8 * s), Math.max(1, Math.round(s)), Math.round(2 * s), 2);
    });
    cv.cx = cv.width / 6; cv.cy = 10.6 * s / 3; return cv;
  };
  const DROP = dropSpr(1.35), BIG = dropSpr(1.8);                                /* 5.3x7.3 and 7.3x9.7 units */
  const BLOB = make(15, 14, px => { px.shape(or(ell(7.5, 8, 6.5, 5.6), ell(4, 4.5, 3, 3)), AR.ice, 1); });  /* tipped-out water: rounder, paler than a drip */
  BLOB.cx = 2.5; BLOB.cy = 2.67;
  const HANG = [1, 2, 3, 4].map(k => make(20, 24, px => { const r = 1.8 + k * 1.25; px.shape(or(box(8, 0, 4, 2 + k * .5), ell(10, 2 + r * .9, r, r)), AR.drop, 1); }));   /* a drip swelling on the beam */

  /* ---------- 2. setup: stage, HUD, timer, shell, VERB slam. Everything else comes back on R. ---------- */
  const R = MGRepair.setup({
    id: 'leak', verb: 'CATCH', scoreIcon: DROP, howAt: 82,
    how: 'Get under the drips · <em>tap</em> to tip the bucket out the window',
    legend: [[DROP, '<em>catch</em> every drip'], [HANG[3], 'drips swell, then <em>fall</em>'], [BIG, 'big drops <em class="bad">split</em>']],
    hint: 'move · tap or Space to tip out',
  });
  const { st, g, W, H, ui, fx, rng, level: LV } = R;

  /* sprites in the desk colour: the bucket is painted to match the machine with the problem */
  const BUCKET = make(48, 37, px => {
    const body = poly([[3, 8], [45, 8], [40.5, 36], [7.5, 36]]);
    px.shape(body, R.deskR, 1);
    px.shape(and(body, or(box(0, 14, 48, 3), box(0, 30, 48, 3))), AR.metal, 2);
    px.shape(ell(24, 8, 22.6, 6.6), AR.metal, 3); px.shape(ell(24, 8.6, 19, 4.6), AR.ink, 4);
  });
  const TIPPED = cvs(BUCKET.height, BUCKET.width, x => { x.translate(0, BUCKET.width); x.rotate(-Math.PI / 2); x.drawImage(BUCKET, 0, 0); });   /* mouth to the left (the window) */
  const TYPEWRITER = MGRepair.parts.typewriter(R.desk);

  /* the room, painted once. The window panes are left clear: the storm outside is drawn behind them every frame. */
  const CEIL = 19, FLOOR_TOP = 120, FOOT = 152, WIN = { x: 6, y: 32, w: 26, h: 46 }, SILL = WIN.y + WIN.h;
  const ROOM = cvs(W * 3, H * 3, x => {
    x.scale(3, 3); const r = (c, a, b, w, hh) => { x.fillStyle = c; x.fillRect(a, b, w, hh); }, s = MG.seeded(11);
    r('#2a170b', 0, 0, W, CEIL);                                                                 /* ceiling planks + the beam the leaks come through */
    for (let y = 0; y < 15; y += 5) { r('#4a2a12', 0, y, W, 4.67); r('#5a3517', 0, y, W, .67); for (let sx = (y * 7) % 23; sx < W; sx += 23) r('#2a170b', sx, y, .67, 4.67); }
    r('#1a0f14', 0, 15, W, 4.33); r('#6a4120', 0, 15.33, W, 3.33); r('#8a5a2b', 0, 15.33, W, .67); r('#3a210d', 0, 18, W, .67);
    r('#12402a', 0, CEIL, W, FLOOR_TOP - CEIL); for (let sx = 0; sx < W; sx += 8) r('#0f3824', sx, CEIL, 4, FLOOR_TOP - CEIL);     /* the Floor's green stripes */
    r('rgba(0,0,0,.3)', 0, CEIL, W, 2.33);
    r('#3a210d', 0, 98, W, 20); for (let sx = 2; sx < W; sx += 20) { r('#4a2a12', sx, 101, 16, 14); r('#2a170b', sx, 114.33, 16, .67); r('#5a3517', sx, 101, 16, .67); }
    r('#1a0f14', 0, 97, W, 1.33); r('#8a5a2b', 0, 97.33, W, .67);
    r('#1a0f14', WIN.x - 2.33, WIN.y - 2.33, WIN.w + 4.67, WIN.h + 2.33);                            /* window: frame, open lower half, sill */
    r('#c08a4a', WIN.x - 1.67, WIN.y - 1.67, WIN.w + 3.33, WIN.h + 1.67); r('#e8b878', WIN.x - 1.67, WIN.y - 1.67, WIN.w + 3.33, .67); r('#e8b878', WIN.x - 1.67, WIN.y - 1.67, .67, WIN.h);
    x.clearRect(WIN.x, WIN.y, WIN.w, WIN.h);
    r('#1a0f14', WIN.x, WIN.y + 20, WIN.w, 3.67); r('#c08a4a', WIN.x, WIN.y + 20.33, WIN.w, 3); r('#e8b878', WIN.x, WIN.y + 20.33, WIN.w, .67);           /* the raised sash's rail */
    r('#1a0f14', WIN.x + WIN.w / 2 - 1, WIN.y, 2, 20.33); r('#c08a4a', WIN.x + WIN.w / 2 - .67, WIN.y, 1.33, 20.33);
    r('#1a0f14', WIN.x - 4.33, SILL - .33, WIN.w + 8.67, 4.33); r('#b57d3e', WIN.x - 4, SILL, WIN.w + 8, 3.33); r('#e8b878', WIN.x - 4, SILL, WIN.w + 8, .67); r('#7a4a1e', WIN.x - 4, SILL + 2.67, WIN.w + 8, .67);
    r('#1a0f14', 52, 100.67, 66, 4.67); r('#8a5a2b', 52.33, 101, 65.33, 3.67); r('#b57d3e', 52.33, 101, 65.33, .67); r('#4a2a12', 52.33, 104, 65.33, .67);   /* desk */
    for (const lx of [56, 110]) { r('#1a0f14', lx - .33, 105, 4.67, FLOOR_TOP - 104); r('#6a4120', lx, 105, 4, FLOOR_TOP - 105); r('#8a5a2b', lx, 105, 1, FLOOR_TOP - 105); }
    r('#1a0f14', 84, 104.67, 22, 9.67); r('#6a4120', 84.33, 105, 21.33, 9); r('#c98f0e', 93.67, 108.67, 2.67, 1.33);
    r('#2a170b', 0, 117.33, W, 3); r('#1a0f14', 0, 117.33, W, .67);                                                                                          /* skirting */
    for (let y = FLOOR_TOP, i = 0; y < H; y += 6 + i * .67, i++) {                                                                                             /* floor boards, nearer ones taller */
      const bh = 6 + i * .67; r(['#4a2a12', '#5a3517', '#523015'][i % 3], 0, y, W, bh); r('#6a4120', 0, y, W, .67); r('#2a170b', 0, y + bh - .67, W, .67);
      for (let sx = (i * 37) % 31; sx < W; sx += 31 + i * 2) r('#2a170b', sx, y, .67, bh);
      for (let k = 0; k < 6; k++) r('#4a2a12', Math.floor(s() * W), y + 1 + Math.floor(s() * (bh - 2)), 3 + Math.floor(s() * 6), .67);
    }
    r('rgba(0,0,0,.28)', 0, FLOOR_TOP, W, 3);
  });

  /* ---------- 3. tuning: one place for every number the level (0..1) and progress (0..1 over the run) move ---------- */
  const TUNE = {
    leaks: 3 + Math.round(LV * 2),                                              /* 3..5 drip points along the beam */
    cap: 6 - Math.round(LV * 1.4),                                              /* bucket holds 6 (5 from level .4) */
    every: p => lerp(1, .7, LV) * lerp(1, .72, p),                              /* seconds between drips: speeds up through the run */
    swell: p => lerp(.85, .5, LV) * lerp(1, .8, p),                             /* warning: how long a drip hangs before it falls */
    grav: p => lerp(140, 215, LV) * lerp(1, 1.22, p),                           /* fall acceleration, units/s² */
    split: p => p < .18 ? 0 : lerp(.12, .32, LV) * (.55 + p),                   /* chance a drip is a big one that splits mid-air */
    speed: 104, mouth: 7,                                                       /* fixer top speed (units/s); catch half-width at the bucket mouth */
  };
  const CATCH_Y = FOOT - 21.4, HANDS = FOOT - 12.33, X_MIN = 10, X_MAX = W - 8, START_X = 21;

  /* ---------- 4. state: everything a run changes lives in G, rebuilt by reset() (also on standalone AGAIN) ---------- */
  let G;
  function reset() {
    const n = TUNE.leaks, leaks = [];   /* spread along the beam, clear of the window so a fixer who never moves catches nothing */
    for (let i = 0; i < n; i++) leaks.push({ x: Math.round(lerp(44, 110, n > 1 ? i / (n - 1) : .5) + rng(-3, 3)), swell: -1, dur: 1, big: false, cool: rng(.2, .6), stain: 0 });
    G = {
      leaks, drops: [], puddles: [], throws: [], ripples: [],
      x: START_X, vx: 0, aim: START_X, face: 1, walk: 0,                         /* the fixer: position, velocity, pointer/bot target, facing, walk cycle */
      water: 0, tip: 0, hit: 0, full: 0,                                         /* bucket fill (drops), tip-out timer, catch squash, full wobble */
      spawnT: .35, caught: 0, landed: 0, flicks: 0, combo: 0, bestCombo: 0, swiped: false, keyed: false, flash: 0, bolt: rng(2.5, 4.5),
      bot: { react: 0, target: null, err: 0 },
    };
    ui.setScore(0);
  }
  const grade = () => G.caught / Math.max(1, G.caught + G.landed);
  const stats = () => [['CAUGHT', `${G.caught} / ${G.caught + G.landed}`], ['PUDDLES', G.landed], ['BUCKETS OUT', G.flicks], ['BEST CHAIN', G.bestCombo]];

  /* ---------- 5. verbs: catch (automatic, under a drip) and tip out (the player's action) ---------- */
  function catchDrop(d) {
    if (G.water >= TUNE.cap) {                                                  /* full: it slops over the rim and still hits the floor */
      d.spilled = true; d.vx = (d.x < G.x ? -1 : 1) * rng(14, 22); d.vy *= .4; G.full = .5;
      sfx.miss(); ui.floatText(G.x, CATCH_Y - 8, 'FULL!', 'bad'); fx.burst(d.x, CATCH_Y, ['#7ec8f0', '#d6f0ff'], 5, 30, 160, .35); return;
    }
    d.dead = true; G.water++; G.caught++; G.combo++; G.bestCombo = Math.max(G.bestCombo, G.combo); G.hit = .12;
    sfx.tone(1500 - G.water * 110, 620 - G.water * 40, .07, 'sine', .07); sfx.noise(.03, .03, 3000);
    fx.burst(G.x, CATCH_Y - 1, ['#d6f0ff', '#7ec8f0'], 4, 26, 140, .3); ui.setScore(G.caught); ui.bump(); ui.setCombo(G.combo, 1);
    if (G.combo >= 3) ui.pulseCombo();
    if (G.combo % 5 === 0) { ui.floatText(G.x, CATCH_Y - 14, `${G.combo} IN A ROW!`, 'gold'); sfx.ding(G.combo / 5); }
    if (G.water === TUNE.cap) { sfx.tone(520, 520, .06, 'square', .04); sfx.tone(520, 520, .06, 'square', .04, .1); }
  }
  function land(d) {                                                            /* a drip reached the floor: a puddle grows there */
    d.dead = true; G.landed++; G.combo = 0; ui.setCombo(0, 1);
    const y = FOOT + 1 + rng(-1, 2), p = G.puddles.find(q => Math.abs(q.x - d.x) < q.r + 2);
    if (p) { p.r = Math.min(15, p.r + 1.4); p.x = lerp(p.x, d.x, .25); G.ripples.push({ x: p.x, y: p.y, t: 0, r: p.r }); }
    else G.puddles.push({ x: d.x, y, r: 3.4, t: 0 });
    fx.burst(d.x, y - 1, ['#7ec8f0', '#d6f0ff', '#3a8ec8'], 8, 42, 170, .42); sfx.noise(.1, .06, 1300); sfx.tone(260, 110, .08, 'triangle', .04);
    ui.floatText(d.x, y - 10, 'SPLAT', 'bad'); R.shake(1.6);
  }
  function tipOut() {
    if (!R.live || G.tip > 0) return;
    if (G.water <= 0) { sfx.miss(); return; }
    const n = 2 + G.water * 2, big = G.water >= TUNE.cap - 1, x0 = G.x - 14, y0 = HANDS - 6, T = .42, gy = 300;   /* from the tipped bucket's mouth */
    for (let i = 0; i < n; i++) {                                               /* a stream of water blobs, each aimed to land in the open window */
      const tx = WIN.x + rng(5, WIN.w - 5), ty = WIN.y + rng(26, 38), dt = T + i * .025;
      G.throws.push({ x: x0, y: y0, vx: (tx - x0) / dt, vy: (ty - y0 - .5 * gy * dt * dt) / dt, gy, t: -i * .025, T: dt, big: i % 3 === 0 });
    }
    G.flicks++; G.tip = .34; G.face = -1; G.water = 0; G.full = 0; G.splooshed = false; G.bigFlick = big;
    sfx.noise(.22, .07, 2600); sfx.tone(300, 900, .14, 'triangle', .04); if (big) MG.hitstop(.05);
  }

  /* ---------- 6. update (fixed 60 Hz). R.live is false once end() was called: stop scoring, let things settle ---------- */
  function update(dt) {
    const p = R.progress, speed = TUNE.speed * (1 - .2 * G.water / TUNE.cap);
    /* the fixer: keys steer directly, otherwise ease toward the aim (pointer or bot) */
    const ax = R.axisX(); if (ax) { G.keyed = true; G.aim = clamp(G.x + ax * 30, X_MIN, X_MAX); } else if (G.keyed) { G.keyed = false; G.aim = G.x; }
    const want = R.live ? clamp((G.aim - G.x) * 11, -speed, speed) : 0;
    G.vx = lerp(G.vx, want, Math.min(1, dt * 18)); G.x = clamp(G.x + G.vx * dt, X_MIN, X_MAX);
    if (Math.abs(G.vx) > 6) { G.walk += Math.abs(G.vx) * dt; if (G.tip <= 0) G.face = Math.sign(G.vx); }
    G.tip = Math.max(0, G.tip - dt); G.hit = Math.max(0, G.hit - dt); G.full = Math.max(0, G.full - dt); G.flash = Math.max(0, G.flash - dt);
    if (G.water >= TUNE.cap && R.live && MG.rng() < dt * 3) fx.puff(G.x + rng(-6, 6), CATCH_Y - 1, '#9ad6f6', 1);
    /* the storm outside: now and then a flash of lightning */
    if ((G.bolt -= dt) <= 0) { G.bolt = rng(2.8, 5); G.flash = .16; sfx.noise(.6, .05, 220, .25); }
    /* the beam: drips swell at their leak, then let go */
    if (R.live && (G.spawnT -= dt) <= 0) {
      G.spawnT = TUNE.every(p) * rng(.85, 1.15);
      const free = G.leaks.filter(l => l.swell < 0 && l.cool <= 0);
      if (free.length) { const l = free[Math.floor(rng(free.length))]; l.swell = 0; l.dur = TUNE.swell(p); l.big = rng() < TUNE.split(p); }
    }
    for (const l of G.leaks) {
      l.cool -= dt;
      if (l.swell < 0) continue;
      l.swell += dt / l.dur;
      if (l.swell >= 1) {
        if (R.live) G.drops.push({ x: l.x, y: CEIL + 2, vx: 0, vy: 16, big: l.big, split: l.big ? rng(52, 78) : 0, src: l });
        l.swell = -1; l.cool = .25; l.stain = Math.min(1, l.stain + .08);
      }
    }
    /* falling drips: split, get caught at the bucket mouth, or land */
    const gy = TUNE.grav(p);
    for (const d of G.drops) {
      const y0 = d.y; d.vy += gy * dt; d.y += d.vy * dt; d.x = clamp(d.x + d.vx * dt, 3, W - 3);
      if (d.split && d.y >= d.split) {
        d.split = 0; d.big = false; const s = rng(11, 16);                       /* the halves fly apart in a V: right under the middle catches both */
        d.pair = { d }; G.drops.push(d.pair.e = { x: d.x, y: d.y, vx: s, vy: d.vy * .78, big: false, split: 0, pair: d.pair }); d.vx = -s;
        fx.burst(d.x, d.y, ['#d6f0ff', '#7ec8f0'], 4, 22, 0, .25); sfx.tone(1800, 1200, .04, 'sine', .03);
      }
      if (!d.spilled && R.live && G.tip <= 0 && y0 < CATCH_Y && d.y >= CATCH_Y && Math.abs(d.x - G.x) <= TUNE.mouth) catchDrop(d);
      else if (d.y >= FOOT) land(d);
    }
    G.drops = G.drops.filter(d => !d.dead);
    /* the tipped-out water: arcs into the window and away into the storm */
    for (const t of G.throws) {                                                 /* each blob was aimed to reach the window at t = T */
      const t0 = t.t; t.t += dt; if (t.t < 0) continue;
      const k = Math.min(dt, t.t, t.T - t0); if (k > 0) { t.vy += t.gy * k; t.x += t.vx * k; t.y += t.vy * k; }
      if (t.t >= t.T) {
        t.dead = true; fx.burst(t.x, t.y, ['#d6f0ff', '#7ec8f0'], 2, 24, 120, .3);
        if (!G.splooshed) { G.splooshed = true; ui.floatText(WIN.x + WIN.w / 2 + 8, WIN.y + 18, G.bigFlick ? 'SPLOOSH!' : 'SPLASH', 'gold'); sfx.noise(.25, .08, 900); fx.ring(WIN.x + WIN.w / 2, WIN.y + 32, '#d6f0ff', 12); }
      }
    }
    G.throws = G.throws.filter(t => !t.dead);
    for (const p2 of G.puddles) p2.t += dt;
    for (const r of G.ripples) r.t += dt; G.ripples = G.ripples.filter(r => r.t < .5);
  }

  /* ---------- 7. bot (?bot=1): plays like a person watching the beam. It lines up under the drip that will land soonest and that it can
     still reach (swelling ones count, as a player sees them coming), with a reaction time and a little aim error, now and then a real
     fumble; it stays between the halves of a split drop and tips out when full, or nearly full during a gap. Grades land around .65-.9. ---------- */
  function bot(dt) {
    const B = G.bot, sp = TUNE.speed * (1 - .2 * G.water / TUNE.cap), gy = TUNE.grav(R.progress);
    const fall = (y, vy) => { const h2 = CATCH_Y - y; return h2 <= 0 ? -1 : (-vy + Math.sqrt(vy * vy + 2 * gy * h2)) / gy; };
    const coming = [
      ...G.drops.filter(d => !d.spilled && d.y < CATCH_Y).map(d => { const t = fall(d.y, d.vy); return { key: d.src || d, d, t, x: d.x + d.vx * t }; }),
      ...G.leaks.filter(l => l.swell >= 0).map(l => ({ key: l, d: null, t: (1 - l.swell) * l.dur + fall(CEIL + 2, 16), x: l.x })),
    ].sort((a, b) => a.t - b.t);
    const next = coming[0];
    if (G.tip <= 0 && G.water > 0 && (G.water >= TUNE.cap || (G.water >= TUNE.cap - 1 && (!next || next.t > .5)) || (G.water >= 3 && (!next || next.t > .9)))) { tipOut(); return; }
    if ((B.react -= dt) > 0) return;
    const pick = coming.find(c => Math.abs(c.x - G.x) / sp <= c.t + .02);
    if (!pick) return;
    if (pick.key !== B.target) { B.target = pick.key; B.react = rng(.08, .2); B.err = rng() < .08 ? (rng() < .5 ? -1 : 1) * rng(8, 12) : rng(-3, 3); return; }
    const mate = pick.d && pick.d.pair && coming.find(c => c.d && c.d !== pick.d && c.d.pair === pick.d.pair && c.t - pick.t < .25);
    G.aim = clamp((mate ? (pick.x + mate.x) / 2 : pick.x) + B.err, X_MIN, X_MAX);
  }

  /* ---------- 8. draw: back to front. Units, 1/3-unit precision; st.hi() for hi-res sprites ---------- */
  const oval = (cx, cy, rx, ry, col) => {                                        /* a pixel ellipse in 1/3-unit rows */
    g.fillStyle = col; const n = Math.max(1, Math.round(ry * 3));
    for (let i = -n; i <= n; i++) { const yy = i / 3, w = rx * Math.sqrt(Math.max(0, 1 - (yy * yy) / (ry * ry))); if (w > 0) g.fillRect(Math.round((cx - w) * 3) / 3, Math.round((cy + yy) * 3) / 3, Math.round(w * 6) / 3, 1 / 3); }
  };
  function drawStorm(now) {
    g.fillStyle = G.flash > 0 ? '#c8ecff' : '#1d2b4a'; g.fillRect(WIN.x, WIN.y, WIN.w, WIN.h);
    if (G.flash <= 0) { g.fillStyle = '#263a60'; g.fillRect(WIN.x, WIN.y + 24, WIN.w, WIN.h - 24); }
    for (const [cx, r] of [[2, 6], [10, 8], [19, 6.5], [27, 7.5]]) oval(WIN.x + cx, WIN.y + WIN.h - 3, r, r * .9, G.flash > 0 ? '#5a7a8a' : '#10261e');      /* the jungle outside */
    g.fillStyle = G.flash > 0 ? '#5a7a8a' : '#10261e'; g.fillRect(WIN.x, WIN.y + WIN.h - 3, WIN.w, 3);
    g.fillStyle = G.flash > 0 ? '#ffffff' : 'rgba(126,200,240,.55)';
    for (let i = 0; i < 16; i++) { const x = WIN.x + ((i * 37 + now * 9) % WIN.w), y = WIN.y + ((i * 53 + now * 140) % WIN.h); g.fillRect(Math.round(x * 3) / 3, Math.round(y * 3) / 3, 1 / 3, 2.67); }
    g.fillStyle = 'rgba(255,255,255,.09)'; for (let i = 0; i < 3; i++) g.fillRect(WIN.x + 3 + i * 4, WIN.y + 2 + i * 3, 1.33, 14 - i * 3);      /* glass glints, upper panes */
  }
  function drawBeam() {
    for (const l of G.leaks) {
      g.fillStyle = `rgba(14,8,6,${(.4 + l.stain * .3).toFixed(2)})`;                                                                            /* soaked wood: dark, ragged grain that spreads */
      const rx = 4 + l.stain * 4.5, ry = 5.5 + l.stain * 1.5, cy = CEIL - 7;
      for (let j = -ry; j <= ry; j += .67) { const w = rx * Math.sqrt(1 - (j / ry) ** 2) + (((l.x * 7 + j * 9) % 5 + 5) % 5) * .33 - .67; if (w > .3) g.fillRect(Math.round((l.x - w + ((j * 3) % 2) * .67) * 3) / 3, Math.round((cy + j) * 3) / 3, Math.round(w * 6) / 3, .67); }
      g.fillStyle = '#7ec8f0'; g.fillRect(l.x - .33, CEIL - 3, .67, 1);                                                                          /* a wet glint at the crack */
      g.fillStyle = '#1a0f14'; for (const [dx, dy, w2, h2] of [[-3, -4, .67, .67], [-2.33, -3.33, .67, 1], [-1.67, -2.33, .67, 1], [-1, -1.67, 1.33, .67], [-.33, -1, .67, 1], [.67, -3.67, .67, 1], [1.33, -4, .67, .67]]) g.fillRect(l.x + dx, CEIL + dy, w2, h2);
      g.fillStyle = '#9ad6f6'; g.fillRect(l.x + .33, CEIL - 1.33, .67, .33);                                                                    /* wet glint */
      if (R.won) { g.fillStyle = '#1a0f14'; g.fillRect(l.x - 4.33, CEIL - 4, 8.67, 2.67); g.fillStyle = '#e8d8a8'; g.fillRect(l.x - 4, CEIL - 3.67, 8, 2); g.fillStyle = '#fff6d6'; g.fillRect(l.x - 4, CEIL - 3.67, 8, .67); continue; }   /* patched: tape over the crack */
      if (l.swell >= 0) {
        const k = Math.min(3, Math.floor(l.swell * 4)), wob = l.swell > .75 && Math.floor(l.swell * 40) % 2 ? .33 : 0, spr = l.big && k === 3 ? BIG : HANG[k];
        st.hi(spr, l.x - spr.width / 6 + wob, CEIL - .67);
        if (l.swell > .6) { g.fillStyle = `rgba(214,240,255,${((l.swell - .6) * 2).toFixed(2)})`; g.fillRect(l.x - .33, CEIL + spr.height / 3 + 1 + (l.swell - .6) * 6, .67, 1.33); }     /* a glint below: it's about to go */
      }
    }
  }
  function drawPuddles() {
    for (const p of G.puddles) {
      const r = Math.min(p.r, 3.4 + p.t * 30);                                   /* grows in when it first lands */
      oval(p.x, p.y, r + .67, r * .3 + .67, '#1a3a5a'); oval(p.x, p.y, r, r * .3, '#3a8ec8'); oval(p.x - r * .2, p.y - r * .08, r * .55, r * .12, '#5aa8dc');
      g.fillStyle = '#d6f0ff'; g.fillRect(Math.round((p.x - r * .55) * 3) / 3, Math.round((p.y - r * .14) * 3) / 3, Math.max(.67, Math.round(r * .9) / 3), 1 / 3);
    }
    for (const rp of G.ripples) { const k = rp.t / .5, r = rp.r * (.3 + k * .7); g.globalAlpha = 1 - k; oval(rp.x, rp.y, r, r * .3, '#9ad6f6'); oval(rp.x, rp.y, Math.max(0, r - .67), Math.max(0, r * .3 - .67), '#3a8ec8'); g.globalAlpha = 1; }
  }
  function drawFixer(now) {
    oval(G.x, FOOT + .33, 6.5, 1.67, 'rgba(10,6,4,.5)');                         /* a shadow anchors the fixer to the floor */
    if (R.done) { st.hi(BUCKET, G.x + 1, FOOT - 12.33); R.crew(G.x, FOOT, R.won ? 'cheer' : 'scared', { flip: G.face < 0 }); return; }   /* set down after the whistle */
    const pose = G.tip > 0 ? 'carry' : G.hit > 0 ? 'holdhit' : Math.abs(G.vx) > 8 ? (Math.floor(G.walk / 5) % 2 ? 'hold1' : 'hold2') : 'hold0';
    const sink = G.hit > 0 ? 1 : 0, wob = G.full > 0 || G.water >= TUNE.cap ? (Math.floor(now * 14) % 2 ? .33 : -.33) : 0;
    R.crew(G.x, FOOT, pose, { flip: G.face < 0 });
    if (G.tip > 0) { st.hi(TIPPED, G.x - 4 - TIPPED.width / 3, HANDS - 10); return; }
    const bx = G.x - 8 + wob, by = HANDS - 11.67 + sink;
    st.hi(BUCKET, bx, by);
    if (G.water > 0) {                                                            /* water level shows in the mouth; full bulges over the rim */
      const k = G.water / TUNE.cap, cx = bx + 8, cy = by + 2.87;
      oval(cx, cy + (1 - k) * .67, 1.6 + 4.6 * Math.sqrt(k), .5 + 1 * k, '#3a8ec8'); oval(cx - .67, cy - .33 + (1 - k) * .67, .8 + 2.6 * Math.sqrt(k), .33 + .5 * k, '#7ec8f0');
      if (k >= 1) { oval(cx, cy - .67, 5.33, 1.33, '#7ec8f0'); g.fillStyle = '#d6f0ff'; g.fillRect(cx - 2.33, cy - 1.67, 2, .67); }
    }
    for (let i = 0; i < TUNE.cap; i++) { g.fillStyle = i < G.water ? '#7ec8f0' : 'rgba(26,15,20,.55)'; g.fillRect(bx + 8 - TUNE.cap * 1.17 + i * 2.33 + .33, by + 7.33, 1.33, 1.33); }   /* fill pips on the band */
    if (G.water >= TUNE.cap) {                                                    /* FULL: a blinking tag and the arc to the window */
      if (Math.floor(now * 4) % 2) { const t = 'TIP IT!', tw = textW(t, 2 / 3), tx = clamp(G.x - tw / 2, 2, W - tw - 2); g.fillStyle = '#1a0f14'; g.fillRect(tx - 1, by - 8, tw + 2, 6.67); text(g, t, tx, by - 7, '#ffd23a', 2 / 3); }
      for (let i = 1; i < 12; i++) {                                              /* marching dots: where the water will go */
        const f = i / 12, ax = lerp(G.x - 6, WIN.x + WIN.w / 2, f), ay = lerp(by, WIN.y + 30, f) - Math.sin(f * Math.PI) * 18;
        if ((i + Math.floor(now * 10)) % 3) { g.fillStyle = '#1a0f14'; g.fillRect(Math.round(ax * 3) / 3 - .33, Math.round(ay * 3) / 3 - .33, 1.67, 1.67); g.fillStyle = '#d6f0ff'; g.fillRect(Math.round(ax * 3) / 3, Math.round(ay * 3) / 3, 1, 1); }
      }
    }
  }
  function draw() {
    const now = performance.now() / 1000;
    drawStorm(now);
    st.hi(ROOM, 0, 0);
    st.hi(TYPEWRITER, 64, 100.67 - TYPEWRITER.height / 3);
    g.fillStyle = 'rgba(4,16,10,.3)'; g.fillRect(0, CEIL, W, FLOOR_TOP - CEIL);    /* the back wall sits in shadow so the action pops */
    drawBeam(); drawPuddles(); drawFixer(now);
    for (const d of G.drops) {
      const spr = d.big ? BIG : DROP, len = Math.min(7, d.vy / 30);
      g.fillStyle = 'rgba(214,240,255,.3)'; g.fillRect(Math.round(d.x * 3) / 3 - .33, d.y - spr.cy - len, .67, len);                 /* a speed streak */
      st.hi(spr, d.x - spr.cx, d.y - spr.cy);
    }
    for (const t of G.throws) if (t.t >= 0) st.hi(BLOB, t.x - BLOB.cx, t.y - BLOB.cy);
    fx.draw(g);
    if (G.flash > .08) { g.fillStyle = 'rgba(200,236,255,.07)'; g.fillRect(0, 0, W, H); }
  }

  /* ---------- 9. input + run. Pointer: the mouse steers by hovering, a finger by dragging; a tap or a quick swipe up tips out. ---------- */
  window.LEAK = { get G() { return G; }, tipOut, TUNE };                        /* debug handle, like the arcade games' KW / BS */
  R.run({
    reset, update, draw, grade, stats, bot,
    ended() {                                                                   /* the whistle: drips in the air vanish, a fixed leak gets taped */
      for (const d of G.drops) fx.burst(d.x, d.y, ['#d6f0ff', '#7ec8f0'], 3, 16, 40, .3);
      G.drops = []; G.leaks.forEach(l => { l.swell = -1; });
      if (R.won) G.leaks.forEach(l => fx.burst(l.x, CEIL, ['#e8d8a8', '#fff6d6'], 4, 20, 60, .35));
    },
    down(x, y, ev) { G.swiped = false; if (ev.pointerType === 'mouse') G.aim = clamp(x, X_MIN, X_MAX); },
    move(x, y, ev) {
      if (ev.pointerType === 'mouse' || (R.ptr.down && R.ptr.moved > 3)) G.aim = clamp(x, X_MIN, X_MAX);
      if (R.ptr.down && !G.swiped && R.ptr.sy - y > 12 && performance.now() - R.ptr.st < 350) { G.swiped = true; tipOut(); }
    },
    up(x, y, ev, tap) { if (tap && R.live) tipOut(); },
    key(ev, k) { if (!ev.repeat && (k === ' ' || k === 'arrowup' || k === 'w')) tipOut(); },
  });
})();
