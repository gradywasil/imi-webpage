/* ============================================================
   THE LUCKY COCONUT CRACKED (repair "coconut", verb GLUE, 10 s): the desk's lucky coconut has split in two on its velvet cushion.
   The crack is full of wet gold glue. The fixer stands on the top half: hold to press it shut (the fixer squats on it) and slide
   it so the chalk line on the top half stays inside the chalk band on the bottom half while the glue sets. On wet glue the lid
   keeps sliding, and slides faster the further off it is. The typewriter beside it DINGs, then SLAMs its carriage and shoves the
   lid away from it (the DING shows the shove + a gold 'lean here' notch: lean left first and the lid rides it out). Out of the band
   the glue tears a little. When the seam has set gold from end to end, the charm is sealed.
   Grade: sealed = 1 - .06 per slip - up to .3 for being slow (never below .45); not sealed = up to .38 by how much had set.
   Level: a narrower band, slower glue, a slipperier lid, more frequent and harder slams with shorter warnings.
   Controls: hold the mouse / a finger and drag sideways; or hold Space / ↓ and steer with ← → (A D).
   Layout of this file (as leak.js): 1 sprites · 2 setup · 3 tuning · 4 state · 5 verbs · 6 update · 7 bot · 8 draw · 9 run.
   ============================================================ */
(() => {
  'use strict';
  const { clamp, lerp, sfx } = MG;
  const { R: AR, shapes: { ell, box, poly, cap, or, and } } = MGArt, { make, hl, cvs, text, textW } = MGArt3;
  /* pixel.js's coconut flesh + milk ramps, added to MGArt's table for this page (append-only, as the kit does for the desk ramps) */
  const ramp = (k, r) => AR[k] || (AR[k] = MGArt.ramps.push(r.map(MGArt.hex)) - 1);
  const FLESH = ramp('flesh', ['#c9cfc4', '#fbfbf2', '#ffffff']), MILK = ramp('milk', ['#b4d4e2', '#d6ebf2', '#eef8fc']);

  /* ---------- 1. sprites that don't need the desk colour (hi-res: 3 px per unit, draw with st.hi) ---------- */
  /* the coconut (PXA.coconut's crack frames, redrawn at 3x): a zigzag crack across the middle, eyes on the top half, a grin on the bottom */
  const RR = 19, ZP = 6, ZA = 1.2, HC = RR + 2;                                  /* radius, the crack's zigzag period + depth (units), sprite half-size */
  const tri = u => 1 - 4 * Math.abs(u - Math.floor(u + .5));                     /* -1..1 triangle wave */
  const zig = dx => ZA * tri(dx / ZP);                                           /* the crack's height at dx from the centre, units */
  const cocoSpr = (top, open) => make(HC * 6, HC * 6, px => {
    const c = HC * 3, r = RR * 3, circ = ell(c, c, r, r * 1.02), seam = x => c + zig((x - c) / 3) * 3, s = MG.seeded(31);
    px.shape((x, y) => circ(x, y) && (top ? y < seam(x) : y >= seam(x)), AR.coco, 1);
    for (let n = 0; n < 110; n++) { const a = s() * 6.283, m = Math.sqrt(s()) * (r - 4), x = c + Math.cos(a) * m, y = c + Math.sin(a) * m, t = s() < .5 ? 0 : 2, k = s() < .5 ? 1 : -1; for (let i = 0; i < 3; i++) px.tone(x + i * k, y + i, t, 1); }   /* hairy fibres */
    if (top) {
      for (let a = 3.45; a < 4.55; a += .02) for (let d = 5; d < 9; d++) px.tone(c + Math.cos(a) * (r - d), c + Math.sin(a) * (r - d) * 1.02, 2, 1);   /* the shine, top-left */
      for (const ex of [c - 19, c + 19]) { px.shape(ell(ex, c - 27, 6, 7), AR.paper, 2); px.shape(ell(ex + (ex < c ? 1.5 : -1.5), c - 25, 3.2, 4), AR.ink, 3); for (const [dx, dy] of [[-1, -28], [0, -28], [-1, -27]]) px.dot(Math.round(ex + (ex < c ? 1.5 : -1.5) + dx), c + dy, AR.paper, 2, 4); }   /* the painted eyes, looking in a little */
    } else {
      let p = null; for (let x = c - 21; x <= c + 21; x += 3) { const u = (x - c) / 21, y = c + 20 + (1 - u * u) * 9; if (p) px.shape(cap(p[0], p[1], x, y, 2.2), AR.paper, 2); p = [x, y]; }   /* the painted lucky grin */
      for (const ex of [c - 24, c + 24]) px.shape(cap(ex - 1, c + 19, ex + 1, c + 17, 1.6), AR.paper, 2);
      if (open) { px.shape(ell(c, c, r - 6, 9.6), FLESH, 4); px.shape(and(ell(c, c + 2.5, r - 15, 5.5), (x, y) => y > c - 1), MILK, 5); }   /* the white inside, seen from above */
    }
  });
  const TOP = cocoSpr(true), BOT = cocoSpr(false, false), BOT_OPEN = cocoSpr(false, true);
  const MINI = make(30, 30, px => { px.shape(ell(15, 15, 12, 12), AR.coco, 1); for (const ex of [10, 20]) px.shape(ell(ex, 10.5, 1.8, 2), AR.ink, 2); hl(px, 6, 7, 4, 2, 2); for (let x = 4; x < 27; x++) px.dot(x, 15 + (Math.floor(x / 3) % 2), AR.gold, 2, 3); });
  /* the legend's 'lean left' chalk arrow */
  const LEAN = cvs(42, 27, x => {
    const r = (c, a, b, w, h) => { x.fillStyle = c; x.fillRect(a, b, w, h); };
    for (let cx = 1; cx < 14; cx++) { const h = (cx - 1) * .95 + 1.5; r('#1a0f14', cx, 13.5 - h, 1, 2 * h); }
    r('#1a0f14', 12, 9, 29, 9);
    for (let cx = 3; cx < 13; cx++) { const h = (cx - 3) * .95; r('#fff6d6', cx, 13.5 - h, 1, 2 * h); }
    r('#fff6d6', 12, 11, 27, 5);
  });
  /* the lucky horseshoe on the wall, open end up so the luck doesn't run out */
  const SHOE = make(42, 45, px => {
    px.shape(and(or(ell(21, 24, 18, 19), box(3, 0, 36, 24)), (x, y) => !(((x - 21) / 9) ** 2 + ((y - 24) / 10) ** 2 <= 1 || (y < 24 && Math.abs(x - 21) < 9))), AR.metal, 1);
    for (const [x, y] of [[8, 10], [34, 10], [6, 28], [36, 28], [14, 39], [28, 39]]) px.shape(ell(x, y, 1.6, 1.6), AR.ink, 2);
  });

  /* ---------- 2. setup: stage, HUD, timer, shell, VERB slam ---------- */
  const R = MGRepair.setup({
    id: 'coconut', verb: 'GLUE', scoreIcon: MINI, howAt: 'top',
    how: 'Hold it <em>shut</em> · keep the line in the <em>band</em>',
    legend: [[MINI, 'hold to <em>press</em> it shut, drag to <em>line it up</em>'], [LEAN, '<em>DING!</em> = a slam: lean <em>left</em> first']],
    hint: 'hold + drag · Space + ← →',
  });
  const { st, g, W, H, ui, fx, rng, level: LV } = R;

  /* the room: the desk's typewriter (left), the cracked charm on its cushion (right), the fixer on top of it */
  const CEIL = 19, DESK_Y = 118, FLOOR_TOP = 132, CX = 78, CY = DESK_Y - 22, TW_X = 2, TW_Y = DESK_Y - 33, LIFT = 4.5;
  const seamAt = x => CY + zig(x - CX);
  /* the velvet cushion in the desk colour, buttoned, gold piping and tassels (58x18 units); LIP is its front roll, drawn over the coconut */
  const cushion = lip => make(174, 54, px => {
    const body = ell(87, 26, 84, 20);
    px.shape(lip ? and(body, (x, y) => y > 28) : body, R.deskR, 1);
    if (!lip) hl(px, 34, 9, 52, 2, 2);
    for (const bx of [30, 87, 144]) { const by = 26 + 20 * Math.sqrt(Math.max(0, 1 - ((bx - 87) / 84) ** 2)) - 9; for (const [dx, dy] of [[-4, -1], [4, -1], [-2, 2], [2, 2]]) px.tone(bx + dx, by + dy, 0, 1); px.shape(ell(bx, by, 2.2, 2), AR.gold, 2); }   /* buttons + tufts */
    for (let x = 8; x < 166; x += 2) { const u = (x - 87) / 84, y = 26 + 20 * Math.sqrt(Math.max(0, 1 - u * u)) - 3; px.shape(ell(x, y, 1.7, 1.7), AR.gold, 3); }   /* piping */
    for (const tx of [6, 168]) { const d = tx < 87 ? -2 : 2; px.shape(cap(tx, 26, tx + d, 40, 2.4), AR.gold, 4); px.shape(ell(tx + d, 45, 3.6, 5.5), AR.gold, 5); }   /* tassels */
  });
  const CUSH = cushion(false), LIP = cushion(true);
  const TYPEWRITER = MGRepair.parts.typewriter(R.desk, { paper: false });
  const ROOM = cvs(W * 3, H * 3, x => {
    x.scale(3, 3); const r = (c, a, b, w, hh) => { x.fillStyle = c; x.fillRect(a, b, w, hh); }, s = MG.seeded(13), WS = DESK_Y - 16;
    r('#2a170b', 0, 0, W, CEIL);                                                                                       /* ceiling planks + beam */
    for (let y = 0; y < 15; y += 5) { r('#4a2a12', 0, y, W, 4.67); r('#5a3517', 0, y, W, .67); for (let sx = (y * 7) % 23; sx < W; sx += 23) r('#2a170b', sx, y, .67, 4.67); }
    r('#1a0f14', 0, 15, W, 4.33); r('#6a4120', 0, 15.33, W, 3.33); r('#8a5a2b', 0, 15.33, W, .67); r('#3a210d', 0, 18, W, .67);
    r('#12402a', 0, CEIL, W, FLOOR_TOP - CEIL); for (let sx = 0; sx < W; sx += 8) r('#0f3824', sx, CEIL, 4, FLOOR_TOP - CEIL);       /* the Floor's green stripes */
    r('rgba(0,0,0,.3)', 0, CEIL, W, 2.33);
    r('#3a210d', 0, WS, W, FLOOR_TOP - WS); for (let sx = 2; sx < W; sx += 20) { r('#4a2a12', sx, WS + 3, 16, FLOOR_TOP - WS - 6); r('#2a170b', sx, FLOOR_TOP - 3.67, 16, .67); r('#5a3517', sx, WS + 3, 16, .67); }   /* wainscot */
    r('#1a0f14', 0, WS - 1, W, 1.33); r('#8a5a2b', 0, WS - .67, W, .67);
    /* the wall calendar: Friday the 13th, of course */
    r('#1a0f14', 10.67, 28, 1.33, 3); r('#1a0f14', 6, 30.67, 26, 30); r('#fff6d6', 6.67, 31.33, 24.67, 28.67); r('#b8322a', 6.67, 31.33, 24.67, 7); r('#e86a50', 6.67, 31.33, 24.67, .67);
    text(x, 'FRI', 19 - textW('FRI', 2 / 3) / 2, 32.67, '#fff6d6', 2 / 3); text(x, '13', 19 - textW('13', 4 / 3) / 2, 42, '#1a0f14', 4 / 3);
    for (let i = 0; i < 6; i++) r('#c9b88a', 8.67 + i * 3.67, 54, 2.33, 1.33); r('#c9b88a', 6.67, 58, 24.67, .67);
    x.drawImage(SHOE, 101, 30, 14, 15); r('#1a0f14', 107.33, 28.67, 1.33, 1.33);
    /* desk */
    r('#1a0f14', 0, DESK_Y - .33, W, 4.67); r('#8a5a2b', 0, DESK_Y, W, 3.67); r('#b57d3e', 0, DESK_Y, W, .67); r('#4a2a12', 0, DESK_Y + 3, W, .67);
    for (const lx of [8, 108]) { r('#1a0f14', lx - .33, DESK_Y + 4, 4.67, FLOOR_TOP - DESK_Y - 3); r('#6a4120', lx, DESK_Y + 4, 4, FLOOR_TOP - DESK_Y - 4); r('#8a5a2b', lx, DESK_Y + 4, 1, FLOOR_TOP - DESK_Y - 4); }
    r('#1a0f14', 46, DESK_Y + 4, 30, 8.67); r('#6a4120', 46.33, DESK_Y + 4, 29.33, 8.33); r('#c98f0e', 59.67, DESK_Y + 7.67, 2.67, 1.33);   /* a drawer */
    r('#2a170b', 0, FLOOR_TOP - 2.67, W, 3); r('#1a0f14', 0, FLOOR_TOP - 2.67, W, .67);
    for (let y = FLOOR_TOP, i = 0; y < H; y += 6 + i * .67, i++) {                                                        /* floor boards, nearer ones taller */
      const bh = 6 + i * .67; r(['#4a2a12', '#5a3517', '#523015'][i % 3], 0, y, W, bh); r('#6a4120', 0, y, W, .67); r('#2a170b', 0, y + bh - .67, W, .67);
      for (let sx = (i * 37) % 31; sx < W; sx += 31 + i * 2) r('#2a170b', sx, y, .67, bh);
      for (let k = 0; k < 6; k++) r('#4a2a12', Math.floor(s() * W), y + 1 + Math.floor(s() * (bh - 2)), 3 + Math.floor(s() * 6), .67);
    }
    r('rgba(0,0,0,.28)', 0, FLOOR_TOP, W, 3);
    r('rgba(10,6,4,.4)', CX - 30, DESK_Y - .33, 60, 1.67);                                                             /* the cushion's shadow */
  });

  /* ---------- 3. tuning: one place for every number the level (0..1) moves ---------- */
  const TUNE = {
    tol: lerp(3.8, 3, LV),                                                     /* half-width of the chalk band, units */
    setT: lerp(3.3, 4, LV),                                                    /* seconds of dead-centre pressing for the glue to set (at the band's edge, half speed) */
    slide: lerp(5, 7.5, LV),                                                    /* units/s the wet glue lets the lid wander */
    unstable: lerp(.5, .8, LV),                                                /* per second: the further off it is, the faster it slides off */
    tear: .06,                                                                 /* glue torn off by a slip */
    every: () => lerp(2.5, 1.8, LV) * rng(.85, 1.2),                           /* seconds between carriage slams */
    tell: lerp(.6, .45, LV),                                                   /* DING ... then the SLAM */
    kick: lerp(3.8, 3, LV) * 8 * lerp(1.35, 1.5, LV),                          /* the slam's shove, units/s; it decays over ~1/8 s, so it moves the lid ~1.4x the band's
                                                                                  half-width: from the centre it slips out, leaned to the left edge first it stays in */
    key: lerp(10.5, 10, LV),                                                   /* ← → steering, units/s (about the lid's own wander: easy to stop on the band) */
    par: lerp(3.8, 5.4, LV * LV),                                              /* sealed by then = no lateness (the slams pile up late in the level range) */
  };

  /* ---------- 4. state ---------- */
  let G;
  function reset() {
    const side = rng() < .5 ? -1 : 1;
    G = {
      off: side * rng(7, 10), lift: LIFT, lv: 0, slip: 0, slipTo: 0, retarget: 0, jv: 0,   /* the lid: offset, lift (+ spring speed), wander, slam shove */
      press: false, px: null, kv: 0, steer: 0, sv: 0,                                     /* input */
      set: 0, tick: 0, inBand: false, sinceSlip: 9, slips: 0, sealed: false, tSet: 0,
      jolt: { t: TUNE.every() * .7 + .9, tell: 0, clk: 0, id: 0, check: 0, slips: 0 }, jolts: 0, ridden: 0, paper: 0, twHop: 0,
      hurt: 0, glint: -1, endT: 0, taped: false, fall: 0, fallDir: 1,
      bot: { hist: [], lag: Math.round(rng(.1, .16) * 60), wait: rng(.25, .45), react: rng(.3, .5), gain: rng(3.2, 4.5), damp: rng(.25, .4), max: 45, hv: 0, want: 0, bias: 0, biasTo: 0, bt: 0, aimErr: .6, freeze: 0, lapse: .7, fumble: .06, lean: rng(.25, .5), readP: .45, jid: 0, reads: false },
    };
    ui.setScore(0);
  }
  const grade = () => G.sealed ? clamp(1 - .06 * G.slips - .3 * clamp((G.tSet - TUNE.par) / 3, 0, 1), .45, 1)
    : clamp(.38 * Math.pow(G.set, 1.2) - .03 * G.slips, 0, .38);
  const stats = () => [['GLUE SET', G.sealed ? `IN ${G.tSet.toFixed(1)} S` : `${Math.round(G.set * 100)}%`], ['SLIPS', G.slips], ['SLAMS RIDDEN', `${G.ridden} / ${G.jolts}`],
    ['SEAM', G.sealed ? (G.slips ? 'GOLD' : 'FLAWLESS') : G.set >= .25 ? 'TAPED UP' : 'IN BITS']];

  /* ---------- 5. verbs: press (G.press) and slide (nudge); the glue, the slips and the slams follow from those ---------- */
  function nudge(dx) { if (!R.live) return; G.off = clamp(G.off + dx, -RR * .8, RR * .8); G.steer += dx; }
  function squelch() {
    sfx.tone(210, 110, .09, 'square', .04); sfx.noise(.12, .05, 700);
    for (const sx of [-1, 1]) fx.burst(CX + sx * (RR - 1), CY, ['#fff2c0', '#ffd23a'], 4, 18, 60, .3);
  }
  function slipOut() {
    G.set = Math.max(0, G.set - TUNE.tear); G.tick = Math.floor(G.set * 10); ui.setScore(Math.round(G.set * 100));
    if (G.sinceSlip > .45) { G.slips++; G.hurt = .4; ui.floatText(CX + G.off - 8, CY - 30, 'SLIP!', 'bad'); sfx.tone(520, 190, .16, 'sawtooth', .045); R.shake(1); }
    G.sinceSlip = 0;
    const sx = G.off > 0 ? CX - RR + 3 : CX + RR - 3; fx.burst(sx, CY, ['#fff2c0', '#e8d48a'], 5, 22, 90, .4);
  }
  function slam() {
    const J = G.jolt; G.jolts++; J.check = .6; J.slips = G.slips;
    G.jv = TUNE.kick * (G.lift < .6 ? 1 : 1.2); G.paper = 0; G.twHop = .22;
    sfx.noise(.16, .12, 900); sfx.tone(140, 70, .14, 'square', .06); sfx.thud(); R.shake(2.5); MG.hitstop(.04);
    ui.floatText(TW_X + 38, TW_Y + 3, 'SLAM!', 'gold big'); fx.puff(TW_X + 23, DESK_Y - 1, '#8a6a4a', 3);
  }
  function seal() {
    G.sealed = true; G.tSet = R.t; G.glint = 0; ui.setScore(100);
    sfx.ding(3); sfx.tone(660, 1320, .25, 'triangle', .05, .05); MG.hitstop(.07);
    for (let i = -3; i <= 3; i++) fx.burst(CX + i * 5.5, seamAt(CX + i * 5.5), ['#ffd23a', '#fff08c', '#ffffff'], 4, 34, 40, .5);
    ui.floatText(CX - 14, CY - 34, G.slips ? 'SEALED!' : 'LUCKY!', 'gold');
    R.end();
  }

  /* ---------- 6. update (fixed 60 Hz). R.live is false once end() was called ---------- */
  function update(dt) {
    G.hurt = Math.max(0, G.hurt - dt); G.twHop = Math.max(0, G.twHop - dt); G.sinceSlip += dt;
    if (dt > 0) { G.sv += (G.steer / dt - G.sv) * .2; G.steer = 0; }
    if (R.done) { endAnim(dt); return; }
    if (!R.live) return;
    /* the live pointer / keys, not just the down event: a hold that began during the GO count presses as soon as play starts */
    const pressing = G.press || R.ptr.down || R.held(' ', 'arrowdown', 's', 'enter'), ax = R.axisX();
    /* ← →: a steady, gentle push that stops when you let go (a tap nudges about a unit), so a held arrow doesn't overshoot the band */
    G.kv = ax ? ax * TUNE.key : G.kv * Math.exp(-dt * 25); if (Math.abs(G.kv) > .05) nudge(G.kv * dt);
    /* the lid: pressed shut, or springing back up off the wet glue */
    const wasOpen = G.lift > 1;
    if (pressing) { G.lift = Math.max(0, G.lift - dt * 40); G.lv = 0; if (wasOpen && G.lift <= 1) squelch(); }
    else { G.lv += ((LIFT - G.lift) * 70 - G.lv * 9) * dt; G.lift = clamp(G.lift + G.lv * dt, 0, LIFT + 2); }
    const closed = G.lift < .6;
    /* sliding on the wet glue: a wander that changes its mind, plus a pull off-centre; a slam's shove decays fast */
    if ((G.retarget -= dt) <= 0) { G.retarget = rng(.35, .8); G.slipTo = rng(-1, 1) * TUNE.slide; }
    G.slip += (G.slipTo - G.slip) * Math.min(1, dt * 3.5);
    G.off = clamp(G.off + ((closed ? G.slip + TUNE.unstable * G.off : G.slip * .2) + G.jv) * dt, -RR * .8, RR * .8);
    G.jv *= Math.exp(-dt * 8);
    /* the glue sets while it's pressed shut with the line inside the band (faster dead centre); leaving the band while pressed tears it */
    const a = Math.abs(G.off), tol = TUNE.tol, inNow = closed && pressing && a <= (G.inBand ? tol + .5 : tol);
    if (inNow && !G.inBand) sfx.tone(880, 1180, .05, 'triangle', .03);
    else if (!inNow && G.inBand && closed && pressing) slipOut();
    G.inBand = inNow;
    if (inNow) {
      G.set = Math.min(1, G.set + dt / TUNE.setT * lerp(1, .5, a / tol)); ui.setScore(Math.round(G.set * 100));
      const k = Math.floor(G.set * 10); if (k > G.tick) { G.tick = k; sfx.tone(480 + k * 70, 540 + k * 70, .05, 'triangle', .03); const sx = RR * (1 - G.set); for (const d of [-1, 1]) fx.spark(CX + d * sx, seamAt(CX + d * sx), '#ffd23a'); }
      if (G.set >= 1) { seal(); return; }
    } else if (closed && pressing && MG.rng() < dt * 6) fx.burst(G.off > 0 ? CX - RR + 2 : CX + RR - 2, CY + 1, ['#fff2c0'], 1, 10, 80, .3);   /* glue oozing out of the gap */
    /* the typewriter: DING, a burst of typing, then the carriage SLAMS back and shoves the lid away from it (to the right) */
    const J = G.jolt;
    if (J.check > 0 && (J.check -= dt) <= 0 && G.slips === J.slips && G.inBand) { G.ridden++; ui.floatText(CX + G.off - 10, CY - 30, 'STEADY!', 'gold'); sfx.ding(1); }
    if (J.tell > 0) {
      J.tell -= dt; G.paper = -4 * (1 - J.tell / TUNE.tell);
      if ((J.clk -= dt) <= 0) { J.clk = .065; sfx.clack(MG.rng(0, 6) | 0); }
      if (J.tell <= 0) { J.t = TUNE.every(); slam(); }
    } else if ((J.t -= dt) <= 0) { J.tell = TUNE.tell; J.clk = .12; J.id++; sfx.bell(); ui.floatText(TW_X + 16, TW_Y - 6, 'DING!', 'ice'); if (J.id <= 2) ui.floatText(CX - 4, DESK_Y + 15, 'LEAN LEFT!', 'gold'); }
  }
  /* after the whistle: sealed = a gold glint runs along the seam; partly set = taped up; barely set = the lid slides off onto the cushion */
  function endAnim(dt) {
    const t0 = G.endT; G.endT += dt; G.jv = 0;
    if (G.sealed) { G.lift = Math.max(0, G.lift - dt * 40); G.glint = G.endT; return; }
    if (G.taped) { G.lift = Math.max(0, G.lift - dt * 40); if (t0 < .12 && G.endT >= .12) { sfx.noise(.18, .08, 3000); sfx.thud(); } return; }
    G.fall = clamp(G.endT / .45, 0, 1); if (t0 < .45 && G.endT >= .45) { sfx.bonk(); R.shake(2); fx.puff(CX + G.fallDir * 26, DESK_Y - 6, '#8a6a4a', 3); }
  }

  /* ---------- 7. bot (?bot=1): sees the lid like a player (with a reaction lag), presses after a beat and steers it back toward
     the band like a hand would: a top speed, an aim that wanders a little off centre, and now and then a moment of looking away
     (the hand stops). When it hears the DING it sometimes leans against the slam before it lands; rarely it lets go by mistake. ---------- */
  function bot(dt) {
    const B = G.bot; B.hist.push(G.off); if (B.hist.length > 40) B.hist.shift();
    if (!R.live) return;
    if (B.wait > 0) { if ((B.wait -= dt) <= 0) G.press = true; }
    else if (G.press && rng() < dt * B.fumble) { G.press = false; B.wait = rng(.18, .35); }
    if ((B.react -= dt) > 0) return;
    const J = G.jolt; if (J.tell > 0 && B.jid !== J.id) { B.jid = J.id; B.reads = rng() < B.readP; B.readP = Math.min(.9, B.readP + .2); }   /* it learns the DING */
    if ((B.bt -= dt) <= 0) { B.bt = rng(.4, .9); B.biasTo = rng(-1, 1) * TUNE.tol * B.aimErr; }
    B.bias += (B.biasTo - B.bias) * Math.min(1, dt * 3);
    if (B.freeze > 0) { B.freeze -= dt; B.want = 0; }
    else if (rng() < dt * B.lapse) B.freeze = rng(.15, .35);
    else {
      const n = B.hist.length, seen = B.hist[Math.max(0, n - 1 - B.lag)], seenV = (seen - B.hist[Math.max(0, n - 7 - B.lag)]) * 10;
      const aim = (J.tell > 0 && TUNE.tell - J.tell > B.lean * TUNE.tell && B.reads ? -TUNE.tol * .7 : 0) + B.bias;
      B.want = clamp(-(seen - aim) * B.gain - seenV * B.damp, -B.max, B.max);
    }
    B.hv += (B.want - B.hv) * Math.min(1, dt * 14);
    nudge(B.hv * dt);
  }

  /* ---------- 8. draw: back to front ---------- */
  const px3 = v => Math.round(v * 3) / 3;
  function lidPos() {                                                         /* [x, y, tilt]: the lid's centre; it tips off sideways when it falls */
    if (!G.fall) return [CX + G.off, CY - G.lift, 0];
    const f = G.fall * G.fall, d = G.fallDir;
    return [lerp(CX + G.off, CX + d * 24, f), lerp(CY - G.lift, CY + 5, f), d * .55 * f];
  }
  function drawSeam(lx) {
    /* the glue bead along the crack: wet cream, setting to gold from both ends inward; a glint runs along it once it's sealed */
    const edge = RR * (1 - G.set), wide = G.lift < .6, gl = G.glint >= 0 ? lerp(CX - RR, CX + RR, clamp(G.glint / .5, 0, 1)) : -99;
    for (let x = CX - RR + 1.33; x < CX + RR - 1.33; x += 1 / 3) {
      const y = px3(seamAt(x)), gold = G.sealed || Math.abs(x - CX) >= edge, shine = Math.abs(x - gl) < 2;
      g.fillStyle = gold ? '#c98f0e' : '#d8c890'; g.fillRect(px3(x), y - (wide ? .33 : 0), 1 / 3, wide ? 1.33 : 1);
      g.fillStyle = shine ? '#ffffff' : gold ? '#ffd23a' : '#fff2c0'; g.fillRect(px3(x), y - (wide ? .33 : 0), 1 / 3, .67);
    }
    if (!wide && !G.fall) {                                                    /* lifted: strings of glue stretch up to the lid */
      g.fillStyle = 'rgba(255,242,192,.85)';
      for (const dx of [-12, -5, 4, 11]) { const x = CX + dx, top = lx[1] + zig(x - lx[0]), bot = seamAt(x); if (Math.abs(x - lx[0]) < RR - 3 && bot - top > .7) { const w = clamp(1.6 - (bot - top) * .25, 1 / 3, 1); g.fillRect(px3(x - w / 2 + Math.sin(performance.now() / 200 + dx) * .2), px3(top), px3(w) || 1 / 3, px3(bot - top)); } }
    }
  }
  function drawBand(lx) {
    /* the chalk band on the bottom half, with two posts standing up past the crack to frame the arrow; the bold chalk arrow on the lid
       (ink-edged, so it doesn't read as part of the painted face): green while it sets, red when it's out */
    const tol = TUNE.tol, y0 = CY + ZA + .67, y1 = CY + 5.33, yT = CY - 4.67, live = R.live && !G.sealed, pressing = G.lift < .6, J = G.jolt;
    const a = Math.abs(G.off), inside = a <= tol, blink = Math.floor(performance.now() / 120) % 2;
    g.fillStyle = !live ? 'rgba(255,246,214,.14)' : inside ? (pressing ? 'rgba(120,255,140,.32)' : 'rgba(255,246,214,.2)') : pressing && blink ? 'rgba(255,90,60,.38)' : 'rgba(255,90,60,.2)';
    g.fillRect(px3(CX - tol), y0, px3(tol * 2), y1 - y0);
    const chalk = !live ? '#e8dcc0' : inside && pressing ? '#b8ffc4' : '#fff6d6';
    for (const sd of [-1, 1]) {
      const ex = sd < 0 ? CX - tol - 1 : CX + tol, fx0 = sd < 0 ? ex : ex - 1;
      g.fillStyle = '#1a0f14'; g.fillRect(px3(ex - .33), yT - .33, 1.67, y1 - yT + .67); g.fillRect(px3(fx0 - .33), y1 - 1, 2.67, 1.33);
      g.fillStyle = chalk; g.fillRect(px3(ex), yT, 1, y1 - yT); g.fillRect(px3(fx0), y1 - .67, 2, .67);
    }
    if (live && J.tell > 0 && Math.floor(performance.now() / 110) % 2) {    /* DING: lean here (toward the typewriter) before the slam shoves it */
      const nx = px3(CX - tol * .7);
      g.fillStyle = 'rgba(255,210,58,.45)'; g.fillRect(px3(CX - tol), y0, px3(tol * .6), y1 - y0);
      g.fillStyle = '#ffd23a'; g.fillRect(nx - .33, y0, 2 / 3, y1 - y0);
      g.fillStyle = '#1a0f14'; g.fillRect(nx - 2.33, y1 + .33, 4.67, 3);
      g.fillStyle = '#ffd23a'; g.fillRect(nx - 1 / 3, y1 + .67, 2 / 3, .67); g.fillRect(nx - 1, y1 + 1.33, 2, .67); g.fillRect(nx - 1.67, y1 + 2, 3.33, .67);
    }
    if (G.fall) return;
    const mx = lx[0], my = lx[1] - ZA - .67;                                   /* the arrow on the lid, its tip at the crack */
    g.fillStyle = '#1a0f14'; g.fillRect(px3(mx - 1.67), px3(my - 5.67), 3.33, 4); g.fillRect(px3(mx - 2.67), px3(my - 2.67), 5.33, 1.67); g.fillRect(px3(mx - 1.67), px3(my - 1.33), 3.33, 1.33);
    g.fillStyle = !live ? '#e8dcc0' : inside && pressing ? '#b8ffc4' : inside ? '#ffffff' : '#ffb0a0';
    g.fillRect(px3(mx - 1), px3(my - 5), 2, 3.33); g.fillRect(px3(mx - 2), px3(my - 2), 4, .67); g.fillRect(px3(mx - 1.33), px3(my - 1.33), 2.67, .67); g.fillRect(px3(mx - .67), px3(my - .67), 1.33, .67);
  }
  function drawShove() {
    /* DING: a blinking chalk arrow from the carriage toward the charm, the way the slam will shove the lid */
    const J = G.jolt; if (!R.live || J.tell <= 0 || !(Math.floor(performance.now() / 110) % 2)) return;
    const x0 = TW_X + 47.67, x1 = CX - RR - 1.67, y = CY - 3;
    g.fillStyle = '#1a0f14'; g.fillRect(x0 - .67, y - .67, x1 - x0, 2.67); g.fillRect(x1 - 2.67, y - 2, 2, 5.33); g.fillRect(x1 - .67, y - 1, 1.33, 3.33);
    g.fillStyle = '#fff6d6'; g.fillRect(x0, y, x1 - x0 - 1.33, 1.33); g.fillRect(x1 - 2.33, y - 1.33, .67, 4); g.fillRect(x1 - 1.67, y - .67, .67, 2.67); g.fillRect(x1 - 1, y, .67, 1.33);
  }
  function drawTape() {
    for (const [dx, k] of [[-9, 0], [7, 1]]) {
      const x = CX + G.off * .5 + dx, h = clamp(G.endT / .12, 0, 1) * 12;
      g.fillStyle = 'rgba(26,15,20,.6)'; g.fillRect(px3(x - .33), px3(CY - 6 - .33), 5.67, px3(h + .67));
      g.fillStyle = k ? '#e8d8a8' : '#f2e4b8'; g.fillRect(px3(x), px3(CY - 6), 5, px3(h));
      g.fillStyle = '#c9b88a'; for (let y = 0; y < h; y += 2) g.fillRect(px3(x), px3(CY - 6 + y), 5, 1 / 3);
    }
  }
  function drawFixer(lx) {
    const fx0 = lx[0], fy = lx[1] - RR * 1.02 + .67;
    const tilt = clamp(Math.round(G.sv / 18), -2, 2) * .12;
    if (G.fall) { R.crew(CX - G.fallDir * 6, CY + .67, 'scared', { flip: G.fallDir > 0 }); return; }   /* left standing in the bottom half */
    if (R.done) { R.crew(fx0, fy, G.sealed ? 'cheer' : 'breathe'); return; }
    const pose = G.hurt > 0 ? 'scared' : G.lift < .6 ? 'crouch' : 'air';
    R.crew(fx0, fy, pose, { tilt: pose === 'scared' ? 0 : tilt });
  }
  function draw() {
    const now = performance.now() / 1000, J = G.jolt;
    st.hi(ROOM, 0, 0);
    /* the typewriter: shivers while it types after the DING, hops on the SLAM */
    const shiv = J.tell > 0 && Math.floor(now * 30) % 2 ? .33 : 0, hop = G.twHop > 0 ? -Math.sin(G.twHop / .22 * Math.PI) * 1.33 : 0;
    const px0 = TW_X + 15 + G.paper + shiv;
    g.fillStyle = '#1a0f14'; g.fillRect(px3(px0 - .33), px3(TW_Y + hop - .33), 16.33, 10); g.fillStyle = '#fff6d6'; g.fillRect(px3(px0), px3(TW_Y + hop), 15.67, 9.67);
    g.fillStyle = '#8a8070'; for (let i = 0; i < 3; i++) g.fillRect(px3(px0 + 2), px3(TW_Y + hop + 2 + i * 2), 8 + ((i * 5) % 4) + (i === 2 ? -G.paper : 0), 1 / 3);
    st.hi(TYPEWRITER, TW_X + shiv, TW_Y + hop);
    if (J.tell > 0 && Math.floor(now * 8) % 2) { const tx = TW_X + 36, ty = TW_Y - 4; g.fillStyle = '#1a0f14'; g.fillRect(tx - .67, ty - .67, 4.67, 6); text(g, '!', tx, ty, '#ff5a3c', 2 / 3); }
    /* the charm: cushion, bottom half, the lid, the glue, the chalk marks, the cushion's front roll, and the fixer standing on it */
    st.hi(CUSH, CX - 29, DESK_Y - 16.67);
    const lx = lidPos(), open = G.lift >= .6 || G.fall > 0;
    if (!open) { const l = Math.max(CX - RR, lx[0] - RR) + 1, r = Math.min(CX + RR, lx[0] + RR) - 1; if (r > l) { g.fillStyle = '#24130a'; g.fillRect(px3(l), px3(CY - ZA - .67), px3(r - l), ZA * 2 + 1.33); } }   /* the dark crack showing through a misaligned seam */
    st.hi(open ? BOT_OPEN : BOT, CX - HC, CY - HC);
    if (G.fall > .3) drawSeam(lx);
    if (lx[2]) { g.save(); g.translate(px3(lx[0]), px3(lx[1])); g.rotate(lx[2]); g.drawImage(TOP, -HC, -HC, HC * 2, HC * 2); g.restore(); } else st.hi(TOP, lx[0] - HC, lx[1] - HC);
    if (G.fall <= .3) drawSeam(lx);
    if (G.sealed ? G.glint < .3 : !R.done) drawBand(lx);                    /* the chalk marks go once it's over */
    drawShove();
    if (G.taped) drawTape();
    st.hi(LIP, CX - 29, DESK_Y - 16.67);
    drawFixer(lx);
    fx.draw(g);
  }

  /* ---------- 9. input + run: press and hold anywhere, drag sideways (or hold Space / ↓ and steer with ← →) ---------- */
  window.COCONUT = { get G() { return G; }, TUNE };
  R.run({
    reset, update, draw, grade, stats, bot,
    ended() { G.press = false; G.px = null; G.jolt.tell = 0; G.paper = 0; if (!G.sealed) { if (G.set >= .25) G.taped = true; else { G.fall = .001; G.fallDir = G.off >= 0 ? 1 : -1; } } },
    down(x) { G.press = true; G.px = x; },
    move(x) { if (R.ptr.down) { if (G.px == null) G.px = x; nudge(x - G.px); G.px = x; } },   /* G.px is null if the hold began during the GO count */
    up() { G.press = false; G.px = null; },
  });
})();
