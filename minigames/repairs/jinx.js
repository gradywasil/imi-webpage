/* ============================================================
   A BLACK CLOUD (repair "jinx", verb BLOW, 9 s): a little indoor storm cloud has parked over the machine and zaps its keys.
   The fixer stands on a stepladder with a pair of bellows painted in the desk colour. Hold to pump them (a squeeze builds up, so
   long pumps beat jabs) and blow the cloud toward the open window; let go and it creeps back to the keys (harder the nearer it is
   to the window: it clings). The bellows empty while you blow: squeeze them dry and they wheeze (and the cloud takes the chance to
   lunge), so let go for a beat to refill.
   It's an old pair: each refill takes in more or less air (the gauge's dark end-stop), so watch it rather than count. Running
   low shows ~.4 s before they're dry: the bellows + gauge blink red, the gust sputters at the cloud, the fixer strains, a creak.
   Now and then the cloud puffs up, then lunges for the keys: be blowing when it lunges to hold it. Over the keys it charges and zaps.
   Grade: out of the window = 1 - .1 per zap - up to .35 for being slow (never below .45); not out = up to .36 by how far it got.
   Level: a stronger pull back, bellows that empty sooner, more frequent and stronger lunges with shorter tells, quicker zaps.
   Controls: hold the mouse / a finger anywhere, or hold Space / ← / A.
   Layout of this file (as leak.js): 1 sprites · 2 setup · 3 tuning · 4 state · 5 verbs · 6 update · 7 bot · 8 draw · 9 run.
   ============================================================ */
(() => {
  'use strict';
  const { clamp, lerp, sfx } = MG;
  const { R: AR, shapes: { ell, box, poly, cap, or } } = MGArt, { make, hl, cvs, text, textW } = MGArt3;
  /* pixel.js's storm ramp (+ a darker belly and bellows leather), added to MGArt's table for this page (append-only, as the kit does for the desk ramps) */
  const ramp = (k, r) => AR[k] || (AR[k] = MGArt.ramps.push(r.map(MGArt.hex)) - 1);
  const STORM = ramp('storm', ['#252b45', '#454f6e', '#6a7796']), STORM_D = ramp('stormD', ['#14172a', '#2a2f48', '#454f6e']);
  const LEATHER = ramp('leather', ['#3a1a0c', '#6e3418', '#9a5426']);

  /* ---------- 1. sprites that don't need the desk colour (hi-res: 3 px per unit, draw with st.hi) ---------- */
  /* the storm cloud (PXA.weather's storm frame, redrawn at 3x): three puffs over a dark belly. sx/sy stretch it: puffed up, or flattened by the wind */
  const cloudSpr = (sx, sy) => {
    const w = Math.round(81 * sx), h = Math.round(51 * sy), X = v => v * sx, Y = v => v * sy;
    const cv = make(w, h, px => {
      px.shape(or(ell(X(40.5), Y(36), X(38), Y(13)), box(X(10), Y(30), X(61), Y(14))), STORM_D, 1);
      px.shape(ell(X(19), Y(30), X(16), Y(14)), STORM, 2);
      px.shape(ell(X(62), Y(29), X(17), Y(15)), STORM, 2);
      px.shape(ell(X(39), Y(21), X(22), Y(20)), STORM, 3);
      hl(px, Math.round(X(26)), Math.round(Y(6)), Math.round(X(10)), 2, 2); hl(px, Math.round(X(8)), Math.round(Y(21)), Math.round(X(6)), 2, 2); hl(px, Math.round(X(55)), Math.round(Y(17)), Math.round(X(8)), 2, 2);
    });
    cv.cx = cv.width / 6; cv.cy = cv.height / 6; return cv;
  };
  const S0 = 1.3, CLOUD = cloudSpr(S0, S0), PUFF = cloudSpr(S0 * 1.14, S0 * 1.12), FLAT = cloudSpr(S0 * 1.1, S0 * .84), MINI = cloudSpr(.42, .42);
  const glow = c => { c.glow = cvs(c.width, c.height, x => { x.drawImage(c, 0, 0); x.globalCompositeOperation = 'source-atop'; x.fillStyle = '#fff6c8'; x.fillRect(0, 0, c.width, c.height); }); };   /* a pale silhouette for the zap charge */
  [CLOUD, PUFF, FLAT].forEach(glow);
  /* the HUD icon: the little cloud heading into an open window, so the counter reads as how far it got (in %) */
  const TOWIN = cvs(46, 27, x => { const r = (c, a, b, w, h) => { x.fillStyle = c; x.fillRect(a, b, w, h); }; r('#1a0f14', 0, 0, 22, 27); r('#c08a4a', 2, 2, 18, 23); r('#7ed0f4', 5, 5, 12, 17); r('#fff4a0', 7, 7, 4, 4); r('#2f8a35', 5, 19, 12, 3); x.drawImage(MINI, 12, 4); });

  /* ---------- 2. setup: stage, HUD, timer, shell, VERB slam ---------- */
  const R = MGRepair.setup({
    id: 'jinx', verb: 'BLOW', scoreIcon: TOWIN,
    how: 'Hold to <em>blow</em> it out the window · let go to refill',
    legend: [[CLOUD, 'hold to <em>blow</em> it out'], [MINI, 'it <em class="bad">zaps</em> the keys']],
    hint: 'hold · Space or ← to blow',
  });
  const { st, g, W, H, ui, fx, rng, level: LV } = R;

  /* the room: window (left), desk + machine (middle), the fixer's stepladder (right) */
  const CEIL = 19, FLOOR_TOP = 128, WIN = { x: 5, y: 28, w: 28, h: 66 }, RAIL = 49, SILL = WIN.y + WIN.h;
  const DESK_Y = 112, TW_X = 36, TW_Y = DESK_Y - 33, FIX_X = 108, FIX_FOOT = 80;
  const HOME = { x: 59, y: 61 }, EXIT_X = 23, ZAP_X = TW_X + 8, NOZ = { x: 83, y: 69.67 };

  /* the bellows in the desk colour, side view, nozzle to the left: 6 frames from squeezed flat (0) to full of air (5); 28x18 units */
  const BELLOWS = [0, 1, 2, 3, 4, 5].map(k => make(84, 54, px => {
    const o = 3 + k * 3.8, cy = 27, hx = 70;
    px.shape(poly([[16, cy - 2], [hx - 2, cy - o + 2], [hx - 2, cy + o - 2], [16, cy + 2]]), LEATHER, 1);
    for (let x = 24; x < hx - 2; x += 8) { const f = (x - 16) / (hx - 16); for (let y = Math.round(cy - o * f + 3); y < cy + o * f - 2; y++) { px.tone(x, y, 0); px.tone(x + 1, y, 2); } }   /* pleats */
    px.shape(cap(15, cy - 1.6, hx, cy - o, 3), R.deskR, 2); px.shape(cap(15, cy + 1.6, hx, cy + o, 3), R.deskR, 2);
    px.shape(or(ell(hx + 6, cy - o - 1, 5, 3.6), ell(hx + 6, cy + o + 1, 5, 3.6)), AR.woodL, 3);
    px.shape(or(cap(2, cy, 15, cy, 2.8), ell(14, cy, 4.4, 4.4)), AR.gold, 4); px.shape(ell(2.6, cy, 1.6, 1.8), AR.ink, 5);
  }));
  const BELLOWS_HOT = BELLOWS.map(c => cvs(c.width, c.height, x => { x.drawImage(c, 0, 0); x.globalCompositeOperation = 'source-atop'; x.fillStyle = 'rgba(255,70,40,.5)'; x.fillRect(0, 0, c.width, c.height); }));   /* the low-air blink */
  const LADDER = make(66, 228, px => {
    px.shape(cap(9, 6, 2, 224, 2.6), AR.wood, 1); px.shape(cap(54, 6, 62, 224, 2.6), AR.wood, 1);
    for (let y = 44; y < 224; y += 44) { const f = y / 224; px.shape(box(9 - 7 * f, y, 45 + 15 * f, 4.5), AR.woodL, 2); }
    px.shape(box(0, 0, 66, 8), AR.woodL, 3); px.shape(box(2, 8, 62, 3), AR.woodD, 3);
  });
  const TYPEWRITER = MGRepair.parts.typewriter(R.desk);
  const ROOM = cvs(W * 3, H * 3, x => {
    x.scale(3, 3); const r = (c, a, b, w, hh) => { x.fillStyle = c; x.fillRect(a, b, w, hh); }, s = MG.seeded(5), WS = DESK_Y - 4;
    r('#2a170b', 0, 0, W, CEIL);                                                                                       /* ceiling planks + beam */
    for (let y = 0; y < 15; y += 5) { r('#4a2a12', 0, y, W, 4.67); r('#5a3517', 0, y, W, .67); for (let sx = (y * 7) % 23; sx < W; sx += 23) r('#2a170b', sx, y, .67, 4.67); }
    r('#1a0f14', 0, 15, W, 4.33); r('#6a4120', 0, 15.33, W, 3.33); r('#8a5a2b', 0, 15.33, W, .67); r('#3a210d', 0, 18, W, .67);
    r('#12402a', 0, CEIL, W, FLOOR_TOP - CEIL); for (let sx = 0; sx < W; sx += 8) r('#0f3824', sx, CEIL, 4, FLOOR_TOP - CEIL);       /* the Floor's green stripes */
    r('rgba(0,0,0,.3)', 0, CEIL, W, 2.33);
    r('#3a210d', 0, WS, W, FLOOR_TOP - WS); for (let sx = 2; sx < W; sx += 20) { r('#4a2a12', sx, WS + 3, 16, FLOOR_TOP - WS - 6); r('#2a170b', sx, FLOOR_TOP - 3.67, 16, .67); r('#5a3517', sx, WS + 3, 16, .67); }   /* wainscot */
    r('#1a0f14', 0, WS - 1, W, 1.33); r('#8a5a2b', 0, WS - .67, W, .67);
    r('#1a0f14', WIN.x - 2.33, WIN.y - 2.33, WIN.w + 4.67, WIN.h + 2.33);                                              /* window: frame, raised sash, open below */
    r('#c08a4a', WIN.x - 1.67, WIN.y - 1.67, WIN.w + 3.33, WIN.h + 1.67); r('#e8b878', WIN.x - 1.67, WIN.y - 1.67, WIN.w + 3.33, .67); r('#e8b878', WIN.x - 1.67, WIN.y - 1.67, .67, WIN.h);
    x.clearRect(WIN.x, WIN.y, WIN.w, WIN.h);
    r('#1a0f14', WIN.x, RAIL - 3.67, WIN.w, 3.67); r('#c08a4a', WIN.x, RAIL - 3.33, WIN.w, 3); r('#e8b878', WIN.x, RAIL - 3.33, WIN.w, .67);
    r('#1a0f14', WIN.x + WIN.w / 2 - 1, WIN.y, 2, RAIL - WIN.y - 3); r('#c08a4a', WIN.x + WIN.w / 2 - .67, WIN.y, 1.33, RAIL - WIN.y - 3);
    r('rgba(255,255,255,.18)', WIN.x + 2, WIN.y + 2, 1.33, 9); r('rgba(255,255,255,.18)', WIN.x + 17, WIN.y + 2, 1.33, 6);
    r('#1a0f14', WIN.x - 4.33, SILL - .33, WIN.w + 8.67, 4.33); r('#b57d3e', WIN.x - 4, SILL, WIN.w + 8, 3.33); r('#e8b878', WIN.x - 4, SILL, WIN.w + 8, .67); r('#7a4a1e', WIN.x - 4, SILL + 2.67, WIN.w + 8, .67);
    r('#1a0f14', 30, DESK_Y - .33, 63, 4.67); r('#8a5a2b', 30.33, DESK_Y, 62.33, 3.67); r('#b57d3e', 30.33, DESK_Y, 62.33, .67); r('#4a2a12', 30.33, DESK_Y + 3, 62.33, .67);   /* desk */
    for (const lx of [34, 84]) { r('#1a0f14', lx - .33, DESK_Y + 4, 4.67, FLOOR_TOP - DESK_Y - 3); r('#6a4120', lx, DESK_Y + 4, 4, FLOOR_TOP - DESK_Y - 4); r('#8a5a2b', lx, DESK_Y + 4, 1, FLOOR_TOP - DESK_Y - 4); }
    r('#2a170b', 0, FLOOR_TOP - 2.67, W, 3); r('#1a0f14', 0, FLOOR_TOP - 2.67, W, .67);
    for (let y = FLOOR_TOP, i = 0; y < H; y += 6 + i * .67, i++) {                                                        /* floor boards, nearer ones taller */
      const bh = 6 + i * .67; r(['#4a2a12', '#5a3517', '#523015'][i % 3], 0, y, W, bh); r('#6a4120', 0, y, W, .67); r('#2a170b', 0, y + bh - .67, W, .67);
      for (let sx = (i * 37) % 31; sx < W; sx += 31 + i * 2) r('#2a170b', sx, y, .67, bh);
      for (let k = 0; k < 6; k++) r('#4a2a12', Math.floor(s() * W), y + 1 + Math.floor(s() * (bh - 2)), 3 + Math.floor(s() * 6), .67);
    }
    r('rgba(0,0,0,.28)', 0, FLOOR_TOP, W, 3);
    r('rgba(10,6,4,.45)', 96, 154.67, 26, 2.33);                                                                       /* the ladder's shadow */
    x.drawImage(LADDER, 97, FIX_FOOT - .33, 22, 76);
  });

  /* ---------- 3. tuning: one place for every number the level (0..1) and the cloud's progress move ---------- */
  const TUNE = {
    push: lerp(25, 26, LV),                                                    /* units/s the cloud is blown toward the window */
    drift: k => lerp(8, 9, LV) * (1 + k),                                      /* units/s it creeps back; k = how far it got (it clings near the window) */
    drain: 1 / lerp(1.4, 1.1, LV),                                             /* bellows emptied per second of blowing (a full pair lasts 1.4 s .. 1.1 s) */
    fill: 1 / .45,                                                             /* refilled per second when let go */
    cap: () => rng(.5, 1),                                                     /* how full the next refill gets (an old pair): a blind rhythm wheezes now and then */
    warn: .42,                                                                 /* seconds of air left when the low warning starts: time to see it and let go */
    spin: .3,                                                                  /* a squeeze builds from a third to full strength over this long: long steady pumps beat jabs */
    wheeze: lerp(.75, .9, LV),                                                 /* squeezed dry: no blowing for this long */
    surgeEvery: () => lerp(1.6, 1.1, LV) * rng(.8, 1.2),                       /* seconds between lunges */
    pounce: () => rng(.05, .2),                                                /* a wheeze brings the next lunge this close */
    tell: lerp(.55, .32, LV),                                                  /* it puffs up this long before it lunges */
    kick: lerp(40, 54, LV),                                                    /* lunge speed (decays over ~1/3 s: about a third of that in units) */
    charge: 1 / lerp(1, .7, LV),                                               /* zap charge per second while over the keys */
    par: lerp(2.4, 3.3, LV),                                                   /* out by then = no lateness */
  };

  /* ---------- 4. state ---------- */
  let G;
  function reset() {
    G = {
      x: HOME.x, y: HOME.y, vx: 0, lv: 0, bob: rng(6.28),                      /* the cloud: position, blown velocity, lunge velocity, bob phase */
      press: false, blow: false, air: 1, cap: 1, wheeze: 0, pump: 0, pumpT: 0, puffT: 0, wasLow: false, told: 0,  /* input + bellows (cap: how full this refill gets) */
      surge: { t: TUNE.surgeEvery() * .7 + .4, tell: 0, n: 0 }, charge: 1 - 2.1 * TUNE.charge,    /* left alone, the first zap comes at ~2.1 s */
      zapT: 0, bolt: null, scorch: [],
      zaps: 0, lunges: 0, blocks: 0, wheezes: 0, best: 0, out: false, tOut: 0, outT: 0, rain: [], wind: [], hurt: 0, flash: 0,
      bot: { act: null, t: 0, seen: 0, greedy: false, start: rng(.3, .5), beat: 0 },
    };
    ui.setScore(0);
  }
  const prog = () => clamp((HOME.x - G.x) / (HOME.x - EXIT_X), 0, 1);
  const low = () => G.blow && G.air < TUNE.drain * TUNE.warn;                  /* under ~.45 s of air left */
  const build = () => .35 + .65 * clamp(G.pumpT / TUNE.spin, 0, 1);          /* this squeeze's strength, building up */
  const pct = () => G.out ? 100 : Math.min(99, Math.floor(G.best * 100));     /* 100% only once it's out */
  const grade = () => {
    if (G.out) { const late = clamp((G.tOut - TUNE.par) / 3.5, 0, 1); return clamp(1 - .1 * G.zaps - .35 * late, .45, 1); }
    return clamp(.36 * Math.pow(G.best, 1.3) - .04 * G.zaps, 0, .38);
  };
  const stats = () => [['OUT THE WINDOW', G.out ? `IN ${G.tOut.toFixed(1)} S` : `${pct()}% OF THE WAY`], ['ZAPS', G.zaps], ['LUNGES HELD', `${G.blocks} / ${G.lunges}`], ['WHEEZES', G.wheezes]];

  /* ---------- 5. verbs: the player only presses and lets go (G.press); the bellows, the lunges and the zaps follow from that ---------- */
  function wheeze() {
    G.wheeze = TUNE.wheeze; G.wheezes++; G.blow = false; G.cap = TUNE.cap();
    if (G.surge.tell <= 0) G.surge.t = Math.min(G.surge.t, TUNE.pounce());      /* the cloud takes its chance: a lunge while you can't blow */
    sfx.tone(820, 180, .32, 'sawtooth', .035); sfx.noise(.3, .05, 700);
    ui.floatText(FIX_X - 8, FIX_FOOT - 24, 'WHEEZE!', 'bad');
  }
  function lunge() {
    G.lunges++;
    if (G.blow) { G.blocks++; G.lv = TUNE.kick * .2; sfx.ding(2); ui.floatText(G.x, G.y - 18, 'HELD!', 'gold'); fx.burst(G.x + 14, G.y, ['#d6f0ff', '#ffffff'], 6, 30, 0, .3); }
    else { G.lv = TUNE.kick; sfx.tone(160, 60, .22, 'square', .05); sfx.noise(.25, .06, 300); ui.floatText(G.x + 4, G.y - 18, 'RUMBLE', 'bad'); R.shake(1.5); }
  }
  function zap() {
    G.zaps++; G.charge = -.25; G.zapT = .16; G.hurt = .5; G.flash = .12;
    const tx = TW_X + rng(13, 33), ty = TW_Y + rng(18, 25), x0 = G.x + rng(-5, 5), y0 = G.y + 9, pts = [[x0, y0]];
    for (let i = 1; i < 5; i++) pts.push([lerp(x0, tx, i / 5) + rng(-3.5, 3.5), lerp(y0, ty, i / 5)]);
    pts.push([tx, ty]); G.bolt = pts; G.scorch.push([tx, ty, rng(.8, 1.4)]);
    sfx.noise(.28, .12, 4200); sfx.tone(1300, 70, .24, 'sawtooth', .06); MG.hitstop(.05); R.shake(3);
    fx.burst(tx, ty, ['#fff08c', '#ffffff', '#ffd23a'], 12, 55, 120, .45); fx.puff(tx, ty - 2, '#3a2a30', 3);
    ui.floatText(tx, ty - 10, 'ZAP!', 'bad'); ui.doFlash('rgba(255,250,200,.35)');
  }
  function escape() {
    G.out = true; G.tOut = R.t; G.outT = 0; G.blow = false; ui.setScore(100);
    sfx.noise(.4, .08, 1800); sfx.tone(380, 1300, .32, 'triangle', .05);
    fx.burst(EXIT_X + 6, G.y, ['#d6f0ff', '#ffffff', '#fff08c'], 12, 40, 30, .5);
    ui.floatText(EXIT_X + 16, G.y - 20, G.zaps ? 'OUT!' : 'CLEAN!', 'gold');
    R.end();
  }

  /* ---------- 6. update (fixed 60 Hz). R.live is false once end() was called ---------- */
  function update(dt) {
    const now = R.t;
    G.zapT = Math.max(0, G.zapT - dt); G.hurt = Math.max(0, G.hurt - dt); G.flash = Math.max(0, G.flash - dt);
    if (G.out) G.outT += dt;
    /* the live pointer / keys, not just the down event: a hold that began during the GO count blows as soon as play starts */
    const want = R.live && !G.out && (G.press || R.ptr.down || R.held(' ', 'arrowleft', 'a'));
    /* the bellows: blowing empties them, letting go refills them (to this refill's cap), squeezing them dry costs a wheeze */
    if (G.wheeze > 0) { G.wheeze -= dt; G.blow = false; G.air = Math.min(G.cap, G.air + dt / 1.5); }
    else if (want && G.air > 0) {
      if (!G.blow) { sfx.tone(240, 140, .05, 'square', .03); G.pumpT = 0; }
      G.blow = true; G.air -= dt * TUNE.drain; G.pump += dt; G.pumpT += dt;
      const lo = low();
      if (lo && !G.wasLow) {                                                   /* running low: a creak, and (the first two times) a word by the cloud */
        sfx.tone(300, 520, .12, 'sawtooth', .035);
        if (G.told < 2) { G.told++; ui.floatText(clamp(G.x + 20, 30, 92), G.y - 15, 'LET GO!', 'bad'); }
      }
      G.wasLow = lo;
      if ((G.puffT -= dt) <= 0) { G.puffT = lo ? .06 : .075; sfx.noise(.09, .03, 900 + G.air * 1600); if (lo) sfx.tone(1300 + (1 - G.air) * 700, 1200, .03, 'square', .02); }
      if (G.air <= 0) { G.air = 0; wheeze(); }
    } else {
      if (G.blow) G.cap = TUNE.cap();                                          /* let go: this refill gets a new cap */
      G.blow = false; G.wasLow = false; if (G.air < G.cap) G.air = Math.min(G.cap, G.air + dt * TUNE.fill);
    }
    if (G.out || !R.live) { G.vx *= .9; G.lv *= .9; updateFx(dt); return; }
    /* the cloud: pushed left while you blow, creeps back otherwise; a lunge is a decaying kick toward the keys that blowing soaks up */
    const target = G.blow ? -TUNE.push * build() : TUNE.drift(prog());
    G.vx += (target - G.vx) * Math.min(1, dt * 5.5);
    G.lv *= Math.exp(-dt * (G.blow ? 11 : 3));
    G.x = clamp(G.x + (G.vx + G.lv) * dt, EXIT_X - 2, HOME.x + 4); if (G.x >= HOME.x + 4) { G.vx = Math.min(0, G.vx); G.lv = 0; }
    G.y = HOME.y + Math.sin(now * 2.3 + G.bob) * 2 - (G.surge.tell > 0 ? 1.5 : 0);
    G.best = Math.max(G.best, prog()); ui.setScore(pct());
    /* lunges: a puffed-up tell, then the kick (the clock keeps running through a wheeze: the cloud may take its chance) */
    if (G.surge.tell > 0) { if ((G.surge.tell -= dt) <= 0) { G.surge.t = TUNE.surgeEvery(); lunge(); } }
    else if ((G.surge.t -= dt) <= 0) {
      if (G.x < HOME.x - 6) { G.surge.tell = TUNE.tell; G.surge.n++; sfx.noise(.5, .07, 160); sfx.tone(90, 70, .4, 'triangle', .05); }
      else G.surge.t = .3;
    }
    /* zaps: parked over the keys it charges up, crackles, then strikes */
    if (G.x > ZAP_X) { G.charge += dt * TUNE.charge; if (G.charge > .6 && MG.rng() < dt * 14) fx.spark(G.x + rng(-10, 10), G.y + 10, '#fff08c'); if (G.charge >= 1) zap(); }
    else G.charge = Math.max(-.2, G.charge - dt * 1.5);
    if (G.x <= EXIT_X) { escape(); return; }
    updateFx(dt);
  }
  /* rain under the cloud + the gust's streaks: cosmetic */
  function updateFx(dt) {
    if (!G.out && MG.rng() < dt * 30) G.rain.push({ x: G.x + MG.rng(-13, 13), y: G.y + 9, vx: G.blow ? -26 : G.vx * .3 });
    const floorAt = x => x > TW_X + 2 && x < TW_X + 44 ? TW_Y + 2 : x > 30 && x < 93 ? DESK_Y : x > WIN.x - 4 && x < WIN.x + WIN.w + 4 ? SILL : 146;
    for (const d of G.rain) { d.y += 95 * dt; d.x += d.vx * dt; if (d.y >= floorAt(d.x)) { d.dead = true; if (MG.rng() < .35) fx.burst(d.x, d.y - .5, ['#9ad6f6', '#d6f0ff'], 2, 14, 120, .2); } }
    G.rain = G.rain.filter(d => !d.dead);
    const lo = low();                                                          /* running low: the gust sputters, thin and pink-tinged, right where the eye is */
    if (G.blow && MG.rng() < dt * (lo ? 26 : 70)) G.wind.push({ x: NOZ.x - 1, y: NOZ.y + MG.rng(-1.5, 1.5), vx: -MG.rng(110, 150), vy: (G.y - NOZ.y) * MG.rng(1, 1.8) + MG.rng(-10, 10), t: 0, len: lo ? MG.rng(2, 4) : MG.rng(4, 8), curl: !lo && MG.rng() < .25, weak: lo });
    for (const w of G.wind) { w.t += dt; w.x += w.vx * dt; w.y += w.vy * dt; if (!G.out && w.x < G.x + 14 && !w.hit) { w.hit = true; if (MG.rng() < .3) fx.puff(w.x, w.y, '#c8dcf0', 1); } if (w.x < Math.max(WIN.x, G.out ? 0 : G.x - 18) || w.t > .7) w.dead = true; }
    G.wind = G.wind.filter(w => !w.dead);
  }

  /* ---------- 7. bot (?bot=1): presses and lets go like a person watching the bellows and the cloud, with a human reaction time
     (.2-.32 s) on every decision: it lets go when it sees the low warning (unless the cloud is puffed up and there's air left),
     presses again once the refill tops out, and presses when it sees a lunge coming. Now and then it squeezes too long and wheezes. ---------- */
  function bot(dt) {
    const B = G.bot, tell = G.surge.tell > 0;
    if ((B.start -= dt) > 0) return;
    B.beat -= dt;
    if (B.act) { if ((B.t -= dt) <= 0) { G.press = B.act === 'press'; B.act = null; if (G.press) B.greedy = rng() < .03; else B.beat = rng(.18, .4); } return; }
    const later = (act, a = .2, b = .32) => { B.act = act; B.t = rng(a, b); };
    if (G.press) {
      if (G.wheeze > 0) later('release', .15, .3);
      else if (low() && !B.greedy && !(tell && G.air > TUNE.drain * (G.surge.tell + .35))) later('release');   /* holds through a lunge only with air to spare */
    } else if (G.wheeze <= 0) {
      if (tell && B.seen !== G.surge.n) { B.seen = G.surge.n; if (G.air > .25 && rng() < .8) later('press'); }
      else if (B.beat <= 0 || G.air >= G.cap - .02) later('press', .03, .1);   /* a beat to refill, then again (no need to wait for full) */
    }
  }

  /* ---------- 8. draw: back to front ---------- */
  const px3 = v => Math.round(v * 3) / 3;
  const oval = (cx, cy, rx, ry, col) => {
    g.fillStyle = col; const n = Math.max(1, Math.round(ry * 3));
    for (let i = -n; i <= n; i++) { const yy = i / 3, w = rx * Math.sqrt(Math.max(0, 1 - (yy * yy) / (ry * ry))); if (w > 0) g.fillRect(px3(cx - w), px3(cy + yy), Math.round(w * 6) / 3, 1 / 3); }
  };
  function drawOutside() {
    const k = G.out ? clamp(G.outT / .6, 0, 1) : 0;
    g.fillStyle = '#5fb8e8'; g.fillRect(WIN.x, WIN.y, WIN.w, WIN.h); g.fillStyle = '#7ed0f4'; g.fillRect(WIN.x, WIN.y + 20, WIN.w, WIN.h - 20); g.fillStyle = '#a8e0f8'; g.fillRect(WIN.x, WIN.y + 40, WIN.w, WIN.h - 40);
    oval(WIN.x + 21, WIN.y + 10, 4.33, 4.33, '#fff4a0'); oval(WIN.x + 21, WIN.y + 10, 3.33, 3.33, '#ffffff');                       /* the sun, out there all along */
    for (const [cx, r] of [[1, 6], [9, 8], [18, 6.5], [27, 7.5]]) oval(WIN.x + cx, WIN.y + WIN.h - 3, r, r * .9, '#2f8a35');
    g.fillStyle = '#2f8a35'; g.fillRect(WIN.x, WIN.y + WIN.h - 3, WIN.w, 3);
    for (const [cx, r] of [[5, 4], [14, 5], [23, 4]]) oval(WIN.x + cx, WIN.y + WIN.h - 6, r, r * .8, '#74c648');
    if (k > 0 && R.won) {                                                                                                               /* a rainbow once it's gone */
      g.save(); g.beginPath(); g.rect(WIN.x, WIN.y, WIN.w, WIN.h); g.clip(); g.globalAlpha = k * .85;
      ['#ff7a6a', '#ffd23a', '#74c648', '#5fa8f0', '#b58cf0'].forEach((c, i) => { const r = 24 - i * 1.33; g.fillStyle = c; for (let a = 0; a <= 36; a++) { const t = Math.PI + a / 36 * Math.PI; g.fillRect(px3(WIN.x + 14 + Math.cos(t) * r), px3(WIN.y + 56 + Math.sin(t) * r), 1.33, 1.33); } });
      g.restore();
    }
    if (G.out) {                                                                                                                        /* the cloud tumbles away outside */
      const f = clamp(G.outT / 1.1, 0, 1), s = lerp(.75, .2, f), cx = lerp(EXIT_X - 4, WIN.x - 4, f), cy = lerp(G.y, WIN.y + 10, f);
      g.save(); g.beginPath(); g.rect(WIN.x, WIN.y, WIN.w, WIN.h); g.clip(); g.globalAlpha = 1 - f * .6;
      g.drawImage(CLOUD, px3(cx - CLOUD.cx * s), px3(cy - CLOUD.cy * s), CLOUD.width / 3 * s, CLOUD.height / 3 * s); g.restore();
    }
  }
  function drawFace(cx, cy, mood) {
    const eye = (ex, ey, w, h2, pdx, pdy, pupil) => { g.fillStyle = '#1a0f14'; g.fillRect(px3(ex - .67), px3(ey - .67), w + 1.33, h2 + 1.33); g.fillStyle = '#ffffff'; g.fillRect(px3(ex), px3(ey), w, h2); g.fillStyle = pupil; g.fillRect(px3(ex + w / 2 - .67 + pdx), px3(ey + h2 / 2 - .67 + pdy), 1.33, 1.67); };
    const lx = cx - 7.33, rx = cx + 3, ey = cy - 1;
    g.fillStyle = '#1a0f14';
    if (mood === 'blown') {                                                                                                             /* squeezed shut against the wind: > < */
      for (const [x0, d] of [[lx + 1, 1], [rx + 3, -1]]) { g.fillRect(px3(x0), ey - .67, 1.33, 1); g.fillRect(px3(x0 + d), ey + .33, 1.33, 1); g.fillRect(px3(x0), ey + 1.33, 1.33, 1); }
      oval(cx - .33, cy + 4.33, 2, 1.33, '#1a0f14'); return;
    }
    if (mood === 'peek') {                                                                                                              /* the gust is failing: one eye opens on the bellows, a smirk */
      g.fillRect(px3(lx + 1), ey - .67, 1.33, 1); g.fillRect(px3(lx + 2), ey + .33, 1.33, 1); g.fillRect(px3(lx + 1), ey + 1.33, 1.33, 1);
      eye(rx, ey - .33, 3.33, 2.33, 1, 0, '#ff5a3c'); g.fillStyle = '#1a0f14'; g.fillRect(px3(rx - .33), ey - 2, 4, 1);
      g.fillRect(px3(cx - 2.67), cy + 4.33, 4.67, 1); g.fillRect(px3(cx + 2), cy + 3.33, 1, 1); return;
    }
    const big = mood === 'tell' || mood === 'zap', w = big ? 3.67 : 3.33, h2 = big ? 3.33 : 2.33, pupil = mood === 'tell' ? '#ff5a3c' : '#1a0f14';
    const look = mood === 'zap' ? [0, 1] : mood === 'tell' ? [.33, .33] : [.67, .33];                                                    /* eyeing the keys */
    eye(lx, ey - (big ? .67 : 0), w, h2, look[0], look[1], pupil); eye(rx, ey - (big ? .67 : 0), w, h2, look[0], look[1], pupil);
    g.fillStyle = '#1a0f14';                                                                                                             /* angry brows, slanting in */
    g.fillRect(px3(lx - .67), ey - 2.67, 1.67, 1); g.fillRect(px3(lx + 1), ey - 2.33, 1.67, 1); g.fillRect(px3(lx + 2.67), ey - 1.67, 1.33, 1);
    g.fillRect(px3(rx + 2.67), ey - 2.67, 1.67, 1); g.fillRect(px3(rx + 1), ey - 2.33, 1.67, 1); g.fillRect(px3(rx - .33), ey - 1.67, 1.33, 1);
    if (mood === 'tell') { g.fillRect(px3(cx - 3.67), cy + 3.33, 7.33, 2.67); g.fillStyle = '#fff6d6'; for (let i = 0; i < 4; i++) g.fillRect(px3(cx - 3.33 + i * 1.83), cy + 3.67, 1.33, 1); }
    else { g.fillRect(px3(cx - 2), cy + 3.67, 4, 1); g.fillRect(px3(cx - 3), cy + 4.67, 1, 1); g.fillRect(px3(cx + 2), cy + 4.67, 1, 1); }       /* a scowl */
  }
  function drawCloud(now) {
    if (G.out) return;
    const tell = G.surge.tell > 0, spr = tell ? PUFF : G.blow ? FLAT : CLOUD, wob = tell && Math.floor(now * 30) % 2 ? .33 : 0;
    const cx = G.x + (G.blow ? -1 : 0), cy = G.y + (G.blow ? 1.33 : 0);
    g.save();
    if (cx - spr.cx < WIN.x + WIN.w + 3) { g.beginPath(); g.rect(WIN.x + WIN.w + 2.33, 0, W, H); g.rect(WIN.x, RAIL, WIN.w, SILL - RAIL); g.clip(); }   /* squeezing out the window */
    st.hi(spr, cx - spr.cx + wob, cy - spr.cy);
    if (G.charge > .55 || G.zapT > 0) { g.globalAlpha = G.zapT > 0 ? .7 : (G.charge - .55) * (Math.floor(now * 16) % 2 ? 1.3 : .5); st.hi(spr.glow, cx - spr.cx + wob, cy - spr.cy); g.globalAlpha = 1; }
    drawFace(cx + wob, cy - 1, G.zapT > 0 || G.hurt > .3 ? 'zap' : tell ? 'tell' : low() ? 'peek' : G.blow ? 'blown' : 'grump');
    if (tell && Math.floor(now * 8) % 2) { const tx = cx + 16, ty = cy - 19; g.fillStyle = '#1a0f14'; g.fillRect(tx - .67, ty - .67, 4.67, 6); text(g, '!', tx, ty, '#ff5a3c', 2 / 3); }
    g.restore();
  }
  function drawBolt() {
    if (!G.bolt || G.zapT <= 0) return;
    const seg = (a, b, w, col) => { g.fillStyle = col; const n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) * 2); for (let i = 0; i <= n; i++) { const t = i / n; g.fillRect(px3(lerp(a[0], b[0], t) - w / 2), px3(lerp(a[1], b[1], t) - w / 2), w, w); } };
    for (let i = 1; i < G.bolt.length; i++) seg(G.bolt[i - 1], G.bolt[i], 2.33, '#ffd23a');
    for (let i = 1; i < G.bolt.length; i++) seg(G.bolt[i - 1], G.bolt[i], 1, '#ffffff');
  }
  function drawFixer(now) {
    oval(FIX_X, FIX_FOOT + .33, 5.5, 1.2, 'rgba(10,6,4,.45)');
    if (R.done) { R.crew(FIX_X, FIX_FOOT, R.won ? 'cheer' : 'scared', { flip: true }); st.hi(BELLOWS[5], NOZ.x, NOZ.y - 9); return; }
    const pumping = G.blow && Math.floor(G.pump * 9) % 2, lo = low(), blink = lo && Math.floor(now * 10) % 2;
    /* running low the fixer strains (a shaky squeeze) and the bellows blink red */
    R.crew(FIX_X + (lo ? (Math.floor(now * 24) % 2 ? .33 : -.33) : 0), FIX_FOOT, G.wheeze > 0 || G.hurt > .25 ? 'scared' : G.blow ? (pumping || lo ? 'holdhit' : 'carry') : 'carry', { flip: true });
    const by = NOZ.y - 9 + (pumping ? .33 : 0), k = clamp(Math.round(G.air * 5), 0, 5);
    st.hi(blink ? BELLOWS_HOT[k] : BELLOWS[k], NOZ.x, by);
    /* the air gauge under the bellows: a dark end-stop past this refill's cap; blinks red when it's nearly dry */
    const gx = NOZ.x + 6, gy = NOZ.y + 11.33;
    g.fillStyle = '#1a0f14'; g.fillRect(gx - .67, gy - .67, 17.33, 3);
    g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(gx, gy, 16, 1.67);
    if (G.cap < 1) { const cx = gx + px3(16 * G.cap); g.fillStyle = '#4a2a12'; g.fillRect(cx, gy, gx + 16 - cx, 1.67); g.fillStyle = '#1a0f14'; for (let x = cx + 1; x < gx + 16; x += 1.33) g.fillRect(px3(x), gy, 1 / 3, 1.67); g.fillStyle = '#e8b878'; g.fillRect(cx, gy - .33, 1 / 3, 2.33); }
    g.fillStyle = G.wheeze > 0 ? '#6a7796' : blink ? '#ff5a3c' : lo ? '#ffb0a0' : '#9be8ff'; g.fillRect(gx, gy, px3(16 * G.air), 1.67);
    if (G.wheeze > 0 && Math.floor(now * 6) % 2) { const t = 'EMPTY', tw = textW(t, 1 / 3); g.fillStyle = '#1a0f14'; g.fillRect(gx + 8 - tw / 2 - .67, gy + 2.67, tw + 1.33, 3.67); text(g, t, gx + 8 - tw / 2, gy + 3.33, '#ff7a6a', 1 / 3); }
  }
  function draw() {
    const now = performance.now() / 1000;
    drawOutside();
    st.hi(ROOM, 0, 0);
    if (G.out && R.won) { const k = clamp(G.outT / .5, 0, 1); g.globalAlpha = .16 * k; g.fillStyle = '#fff4a0'; for (let y = RAIL; y < FLOOR_TOP + 22; y += 1 / 3) { const f = (y - RAIL) / 90; g.fillRect(px3(WIN.x + f * 30), y, WIN.w + f * 12, 1 / 3); } g.globalAlpha = 1; }   /* a sunbeam */
    st.hi(TYPEWRITER, TW_X, TW_Y);
    for (const [sx, sy, s] of G.scorch) { oval(sx, sy, 1.67 * s, 1.17 * s, '#1a0f14'); oval(sx - .33, sy - .33, .83 * s, .5 * s, '#3a2a30'); }
    const gloom = G.out ? Math.max(0, .34 - G.outT * .7) : .34 - G.best * .14;                                                             /* the cloud's gloom over the room (not the sunny window) */
    if (gloom > 0) { g.fillStyle = `rgba(14,16,40,${gloom.toFixed(3)})`; g.fillRect(0, 0, W, WIN.y - 2.33); g.fillRect(0, SILL + 4, W, H - SILL - 4); g.fillRect(0, WIN.y - 2.33, WIN.x - 4.33, SILL + 6.33 - WIN.y); g.fillRect(WIN.x + WIN.w + 2.33, WIN.y - 2.33, W, SILL + 6.33 - WIN.y); }
    if (G.flash > 0) { g.fillStyle = 'rgba(255,250,210,.22)'; g.fillRect(0, 0, W, H); }
    g.fillStyle = 'rgba(154,214,246,.8)'; for (const d of G.rain) g.fillRect(px3(d.x), px3(d.y), 1 / 3, 2.33);
    drawCloud(now); drawBolt();
    for (const w of G.wind) {                                                                                                               /* the gust: streaks, some with a curl */
      g.globalAlpha = clamp(1 - w.t / .7, 0, 1) * .9; g.fillStyle = w.weak ? '#ffc8bc' : '#e8f6ff'; g.fillRect(px3(w.x), px3(w.y), w.len, 2 / 3); g.fillRect(px3(w.x + w.len * .25), px3(w.y + 2 / 3), w.len * .55, 1 / 3);
      if (w.curl) { g.fillRect(px3(w.x - 1), px3(w.y - 1), 1, 1 / 3); g.fillRect(px3(w.x - 1.67), px3(w.y - .67), 2 / 3, 1); g.fillRect(px3(w.x - 1), px3(w.y + .33), 1, 1 / 3); }
    } g.globalAlpha = 1;
    if (G.blow) { const k = Math.floor(G.pump * 18) % 3; g.fillStyle = 'rgba(232,246,255,.85)'; g.fillRect(NOZ.x - 2.33 - k, NOZ.y - .67 - k * .33, 1, 1.33 + k * .67); g.fillRect(NOZ.x - 4 - k * 1.5, NOZ.y - 1 - k * .67, 1, 2 + k * 1.33); }   /* a puff at the nozzle */
    drawFixer(now);
    fx.draw(g);
  }

  /* ---------- 9. input + run: press and hold anywhere (or Space / ← / A) ---------- */
  window.JINX = { get G() { return G; }, TUNE };
  R.run({
    reset, update, draw, grade, stats, bot,
    ended() { G.press = false; G.blow = false; G.charge = -1; G.surge.tell = 0; },
    down() { G.press = true; },
    up() { G.press = false; },
  });
})();
