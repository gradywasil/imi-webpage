/* ============================================================
   THE KEEPER NODDED OFF (repair "nap", verb WAKE, 9 s).
   The desk's word keeper has dozed off flat on its back across the desk, head pillowed on its own card tray, a snot bubble swelling with
   every snore, and the keeper light on the machine has gone dark. The fixer stands on the wall shelf with a banana and lobs it onto the
   keeper's nose. The snore-o-meter beside the bed shows the breath the banana will land on: toss when the needle is mid-green, on the
   bright mark (the bottom of the snore). Three good bonks wake the keeper; a bonk off the green makes it grumble and roll over, which
   undoes one. The sweet spot sits a hair after the middle and a banana just late still counts, so a phone's touch lag doesn't sink it.
   Grade, woken: .40 + .48 x timing x .8 per roll-over + .12 x time left (no floor: every roll-over costs); timing per bonk = 1 - .75 x
   distance from the sweet spot. Still asleep: .12 per bonk x timing - .04 per roll-over (under .4: PATCHED at best).
   Level: quicker breaths, a shorter green, a less regular rhythm and, from about .25, snorts that dip toward the green and stop short.
   Controls: tap / click anywhere, or Space / Down / Enter / S.
   Layout: 1 sprites · 2 setup · 3 tuning · 4 state · 5 verbs · 6 update · 7 bot · 8 draw · 9 run.
   ============================================================ */
(() => {
  'use strict';
  const { clamp, lerp, sfx } = MG;
  const { R: AR, shapes: { ell, box, cap, or } } = MGArt, { make, cvs, text, textW } = MGArt3;
  const E = (cx, cy, rx, ry) => ell(cx * 3, cy * 3, rx * 3, ry * 3), C = (x0, y0, x1, y1, r) => cap(x0 * 3, y0 * 3, x1 * 3, y1 * 3, r * 3);

  /* ---------- 1. sprites that don't need the desk colour (hi-res, 3 px per unit; shapes written in units) ---------- */
  if (!AR.napFur) { AR.napFur = MGArt.ramps.length; MGArt.ramps.push(['#3c3846', '#77727f', '#aaa5b4'].map(MGArt.hex)); }   /* the keeper: an old silver monkey, so it stands off the wood */
  const FUR = AR.napFur, SKIN = AR.skin, A3 = MGArt3.build();
  /* the keeper lying on its back, side view, head end to the right (the head is its own sprite). k = 0..1 is how full the breath is. 42x37 units; the desk is at y 30 */
  const body = (k, away) => make(126, 111, px => {
    px.shape(or(C(14, 24, 11, 14, 3), C(11, 14, 7.5, 27, 2.4)), FUR, 1); px.shape(E(8, 28.6, 2.7, 1.5), SKIN, 2);                       /* far leg, knee up */
    px.shape(or(C(10, 27, 5, 30.5, 1.2), C(5, 30.5, 3, 35, 1.1)), FUR, 3);                                                               /* tail over the edge */
    px.shape(E(24, 23 - k, 15, 7 + 1.4 * k), FUR, 4);                                                                                       /* torso */
    if (!away) px.shape(E(25.5, 19.6 - 1.8 * k, 10.5, 3.4 + 1.3 * k), SKIN, 5);                                                            /* belly, rising and falling */
    px.shape(or(C(12, 22, 6.5, 12, 3.2), C(6.5, 12, 3, 27, 2.6)), FUR, 6); px.shape(E(3.4, 28.4, 3, 1.7), SKIN, 7);     /* near leg */
    px.shape(C(29, 27, 28.3, 34, 2), FUR, 8); px.shape(E(28.3, 35, 2, 1.6), SKIN, 9);                                                     /* an arm dangling off the desk */
    if (!away) { px.shape(C(35, 20 - k, 28.5, 17 - 1.6 * k, 2.1), FUR, 10); px.shape(E(27, 16.6 - 1.6 * k, 2.2, 1.7), SKIN, 11); }      /* a paw on the belly */
  });
  const BODY = [0, 1, 2, 3].map(i => body(i / 3, false)), BODY_AWAY = body(.4, true);
  /* the head, 29x26 units (drawn at 1.3x the body's scale so the face reads on a phone), snout up and to the right.
     kind: sleep | stir | awake | away (rolled over: the back of its head) */
  const HS = 1.3, Eh = (cx, cy, rx, ry) => E(cx * HS, cy * HS, rx * HS, ry * HS), Ch = (x0, y0, x1, y1, r) => C(x0 * HS, y0 * HS, x1 * HS, y1 * HS, r * HS);
  const head = kind => make(87, 78, px => {
    px.shape(Eh(9, 11, 8.3, 7.8), FUR, 1);
    if (kind === 'away') { px.shape(Eh(13.6, 12.6, 3, 3.2), FUR, 2); px.shape(Eh(13.4, 12.8, 1.8, 2.1), SKIN, 3); px.shape(Ch(5, 5.4, 11, 4.2, .7), AR.banY, 4); return; }
    px.shape(Ch(1.8, 6.2, 6, 10.4, .7), AR.banY, 2); px.shape(Eh(1.7, 6, .85, .85), AR.red, 3);                                              /* the keeper's pencil, behind the ear */
    px.shape(Eh(4.6, 13.2, 3, 3.2), FUR, 4); px.shape(Eh(4.9, 13.4, 1.8, 2.1), SKIN, 5);                                                   /* ear */
    px.shape(Eh(12.2, 8.4, 4.8, 4), SKIN, 6); px.shape(Eh(15.3, 5.4, 4.2, 3.6), SKIN, 7);                                                 /* face + snout */
    if (kind === 'sleep') px.shape(Eh(18.5, 7.6, 1.15, 1), AR.ink, 8);                                                                     /* snoring mouth */
    else if (kind === 'stir') px.shape(Eh(18.3, 7.8, 1.7, 1.5), AR.ink, 8);
    else px.shape(or(Ch(16.3, 8.6, 17.6, 9.1, .42), Ch(17.6, 9.1, 18.9, 7.8, .42)), AR.ink, 8);
    px.shape(or(Eh(16.2, 3.4, .55, .45), Eh(17.9, 4.3, .55, .45)), AR.ink, 9);                                                              /* nostrils */
    if (kind === 'sleep') px.shape(or(Ch(10.2, 7.2, 11.5, 8, .38), Ch(11.5, 8, 12.9, 7.2, .38)), AR.ink, 10);                              /* a closed eye */
    else {
      const big = kind === 'awake'; px.shape(Eh(11.6, 7.4, big ? 2 : 1.6, big ? 1.9 : 1.3), AR.paper, 10);
      px.shape(Eh(big ? 12.1 : 11.7, big ? 6.9 : 7.5, .75, .75), AR.ink, 11);
      if (big) px.shape(Ch(9.8, 4.6, 13.2, 4.2, .4), AR.furD, 12);                                                                         /* brow up */
    }
  });
  const HEAD = { sleep: head('sleep'), stir: head('stir'), awake: head('awake'), away: head('away') };
  /* the banana in four quarter turns, so it can tumble without smudging the pixels */
  const turn = (src, q) => q === 0 ? src : cvs(q % 2 ? src.height : src.width, q % 2 ? src.width : src.height, (x, w, h) => { x.translate(w / 2, h / 2); x.rotate(q * Math.PI / 2); x.drawImage(src, -src.width / 2, -src.height / 2); });
  const BAN = [0, 1, 2, 3].map(q => turn(A3.bananaS, q));

  /* ---------- 2. setup ---------- */
  const R = MGRepair.setup({
    id: 'nap', verb: 'WAKE', scoreIcon: A3.bananaS,
    how: 'Toss when the needle is <em>mid-green</em>',
    legend: [[A3.bananaS, '<em>tap</em> to toss the banana'], [HEAD.sleep, 'the needle shows where it lands: aim for the <em>bright mark</em>'], [HEAD.away, 'off the green: it <em class="bad">rolls over</em>']],
    hint: 'tap · Space',
  });
  const { st, g, W, H, ui, fx, rng, level: LV } = R;

  /* the room, painted once */
  const DESK_Y = 124, SHELF_Y = 56, SHELF_X = 104, FIX_X = 112, TRAY = { x: 76, w: 29, y: DESK_Y - 8 }, BX = 40, BY = DESK_Y - 30, HX = 74, HY = TRAY.y - 24.33;
  const NOSE = { x: HX + 21.33, y: HY + 3.67 }, GAUGE = { x: 62, y: 44, w: 8, h: 46 }, LED = { x: 39.3, y: DESK_Y - 20.7 }, WIN = { x: 7, y: 22, w: 24, h: 32 };
  const TYPEWRITER = MGRepair.parts.typewriter(R.desk);
  const ROOM = cvs(W * 3, H * 3, x => {
    x.scale(3, 3); const r = (c, a, b, w, hh) => { x.fillStyle = c; x.fillRect(a, b, w, hh); }, s = MG.seeded(5);
    r('#12402a', 0, 0, W, DESK_Y); for (let sx = 0; sx < W; sx += 8) r('#0f3824', sx, 0, 4, DESK_Y);                                   /* the Floor's green stripes */
    r('#2a170b', 0, 0, W, 3.33); r('#5a3517', 0, 2.33, W, .67); r('rgba(0,0,0,.3)', 0, 3.33, W, 2);                                        /* moulding */
    r('#3a210d', 0, 102, W, DESK_Y - 102); for (let sx = 2; sx < W; sx += 20) { r('#4a2a12', sx, 105, 16, 16); r('#5a3517', sx, 105, 16, .67); r('#2a170b', sx, 120.33, 16, .67); }
    r('#1a0f14', 0, 101, W, 1.33); r('#8a5a2b', 0, 101.33, W, .67);
    /* night window: it's late, which is why the keeper is out cold */
    r('#1a0f14', WIN.x - 2.33, WIN.y - 2.33, WIN.w + 4.67, WIN.h + 4.67); r('#c08a4a', WIN.x - 1.67, WIN.y - 1.67, WIN.w + 3.33, WIN.h + 3.33); r('#e8b878', WIN.x - 1.67, WIN.y - 1.67, WIN.w + 3.33, .67);
    r('#14203e', WIN.x, WIN.y, WIN.w, WIN.h); r('#1d2b4a', WIN.x, WIN.y + 14, WIN.w, WIN.h - 14);
    for (let i = 0; i < 9; i++) r(i % 3 ? '#8aa0d0' : '#fff6d6', WIN.x + 1 + Math.floor(s() * (WIN.w - 2)), WIN.y + 1 + Math.floor(s() * 18), .67, .67);
    const disc = (cx, cy, rr, c) => { for (let j = -rr; j <= rr; j += 1 / 3) { const w = rr * Math.sqrt(Math.max(0, 1 - (j / rr) ** 2)); r(c, Math.round((cx - w) * 3) / 3, Math.round((cy + j) * 3) / 3, Math.round(w * 6) / 3, 1 / 3); } };
    disc(WIN.x + 17, WIN.y + 7, 3.4, '#fff6d6'); disc(WIN.x + 18.67, WIN.y + 5.67, 3, '#14203e');                                             /* a crescent moon */
    for (const [cx, rr] of [[3, 5], [10, 6.5], [18, 5], [24, 6]]) for (let j = -rr; j <= 0; j += .33) { const w = rr * Math.sqrt(1 - (j / rr) ** 2); r('#0c1c16', WIN.x + cx - w, WIN.y + WIN.h + j, w * 2, .34); }
    r('#1a0f14', WIN.x + WIN.w / 2 - .67, WIN.y, 1.33, WIN.h); r('#c08a4a', WIN.x + WIN.w / 2 - .33, WIN.y, .67, WIN.h);
    r('#1a0f14', WIN.x, WIN.y + WIN.h / 2 - .67, WIN.w, 1.33); r('#c08a4a', WIN.x, WIN.y + WIN.h / 2 - .33, WIN.w, .67);
    r('#1a0f14', WIN.x - 4, WIN.y + WIN.h + 1.67, WIN.w + 8, 3.33); r('#b57d3e', WIN.x - 3.67, WIN.y + WIN.h + 2, WIN.w + 7.33, 2.67); r('#e8b878', WIN.x - 3.67, WIN.y + WIN.h + 2, WIN.w + 7.33, .67);
    /* the wall shelf the fixer throws from, with the banana supply */
    r('#1a0f14', SHELF_X - .33, SHELF_Y - .33, W - SHELF_X + 1, 4); r('#8a5a2b', SHELF_X, SHELF_Y, W - SHELF_X, 3.33); r('#b57d3e', SHELF_X, SHELF_Y, W - SHELF_X, .67); r('#5a3517', SHELF_X, SHELF_Y + 2.67, W - SHELF_X, .67);
    for (const bx of [SHELF_X + 4]) { r('#1a0f14', bx - .33, SHELF_Y + 3.33, 2.67, 9); r('#5a3517', bx, SHELF_Y + 3.33, 2, 8.33); x.fillStyle = '#1a0f14'; x.beginPath(); x.moveTo(bx + 2, SHELF_Y + 3.33); x.lineTo(bx + 9, SHELF_Y + 3.33); x.lineTo(bx + 2, SHELF_Y + 11); x.fill(); x.fillStyle = '#5a3517'; x.beginPath(); x.moveTo(bx + 2, SHELF_Y + 4); x.lineTo(bx + 7.5, SHELF_Y + 4); x.lineTo(bx + 2, SHELF_Y + 10); x.fill(); }
    /* the banker's lamp over the desk (the Floor's own) */
    r('#1a0f14', 47.67, 0, 1, 24); r('#3a2a30', 47.67, 0, .33, 24);
    x.fillStyle = '#1a0f14'; x.beginPath(); x.moveTo(40.33, 31.67); x.lineTo(43, 23.67); x.lineTo(53, 23.67); x.lineTo(55.67, 31.67); x.fill();
    x.fillStyle = '#1f6a2a'; x.beginPath(); x.moveTo(41.33, 31); x.lineTo(43.67, 24.33); x.lineTo(52.33, 24.33); x.lineTo(54.67, 31); x.fill();
    r('#3f9a3a', 44, 24.67, 3, .67); r('#3f9a3a', 43.33, 26, 1, 3); r('#0f3318', 41.33, 30.33, 13.33, .67); r('#ffe28a', 45.67, 31, 4.67, 1.33); r('#fff7b0', 46.67, 31, 2.67, .67);
    /* the desk */
    r('#1a0f14', 0, DESK_Y - .33, W, 4); r('#8a5a2b', 0, DESK_Y, W, 3.33); r('#b57d3e', 0, DESK_Y, W, .67); r('#4a2a12', 0, DESK_Y + 2.67, W, .67);
    r('#1a0f14', 0, DESK_Y + 3.33, W, 18.67); r('#6a4120', 0, DESK_Y + 3.67, W, 18);
    for (const [dx, dw] of [[6, 46], [68, 46]]) { r('#1a0f14', dx, DESK_Y + 6, dw, 13); r('#7d4f26', dx + .33, DESK_Y + 6.33, dw - .67, 12.33); r('#8a5a2b', dx + .33, DESK_Y + 6.33, dw - .67, .67); r('#1a0f14', dx + dw / 2 - 4, DESK_Y + 11.33, 8, 2.67); r('#c98f0e', dx + dw / 2 - 3.67, DESK_Y + 11.67, 7.33, 2); r('#ffd23a', dx + dw / 2 - 3.67, DESK_Y + 11.67, 7.33, .67); }
    for (let y = DESK_Y + 22, i = 0; y < H; y += 5 + i * .67, i++) { const bh = 5 + i * .67; r(['#4a2a12', '#5a3517', '#523015'][i % 3], 0, y, W, bh); r('#6a4120', 0, y, W, .67); r('#2a170b', 0, y + bh - .67, W, .67); for (let sx = (i * 37) % 31; sx < W; sx += 31 + i * 2) r('#2a170b', sx, y, .67, bh); }
    r('rgba(0,0,0,.3)', 0, DESK_Y + 22, W, 2.5);
  });
  /* the card tray in the desk colour: the back with its cards (behind the head) and the front panel (in front) */
  const TRAY_BACK = cvs(TRAY.w * 3, 14 * 3, x => {
    x.scale(3, 3); const r = (c, a, b, w, hh) => { x.fillStyle = c; x.fillRect(a, b, w, hh); };
    [[1.5, 3, 6], [7, 0, 7], [13.5, 2.33, 6], [20, .67, 7]].forEach(([cx, cy, cw]) => { r('#1a0f14', cx - .33, cy - .33, cw + .67, 14); r('#fff6d6', cx, cy, cw, 14); r('#ffffff', cx, cy, cw, .67); r('#c9b88a', cx + cw - .67, cy, .67, 14); r('#3a2a30', cx + 1, cy + 2, cw - 2.33, .67); r('#3a2a30', cx + 1, cy + 3.67, cw - 3.33, .67); });
  });
  const TRAY_FRONT = make(TRAY.w * 3, 26, px => { px.shape(box(0, 0, TRAY.w * 3, 26), R.deskR, 1); px.shape(box(0, 0, TRAY.w * 3, 3), R.deskR, 2); px.shape(box(TRAY.w * 1.5 - 9, 6, 18, 6), AR.metal, 3); });

  /* ---------- 3. tuning ---------- */
  const TUNE = {
    ex: lerp(.52, .34, LV),                         /* exhale: needle sinks to the top of the green */
    zone: lerp(.4, .28, LV),                        /* the bottom of the snore: the green window, in seconds (kept above reaction time at 1) */
    inh: lerp(.66, .44, LV),                        /* inhale: back up */
    top: lerp(.16, .06, LV),                        /* a hold at the top of the breath */
    jit: lerp(.05, .14, LV),                        /* how irregular each breath is (fraction) */
    snort: LV < .25 ? 0 : lerp(.12, .32, LV),       /* chance a breath is a snort that dips and stops short of the green */
    quick: .06,                                     /* each good bonk makes the sleep lighter: breaths this much quicker */
    first: 1.15,                                    /* the long first snore, while the VERB shows */
    stir: [.35, .85], roll: [.85, 1.4], reload: .16, /* seconds: eyes open after a good bonk, a roll-over (both random, so a blind tap
                                                       rhythm can't lock onto the restart: read the needle), grabbing the next banana */
    lead: .04,                                      /* the sweet spot sits this far after mid-green: a tap on the mark arrives a touch late */
    early: .05, late: .08,                          /* a banana this close before / after the green still counts (at the edge) */
    T: .34, gy: 1000,                               /* the lob: flight time and gravity */
  };
  const ZONE_V = .2;                                /* the green is the bottom fifth of the meter */

  /* ---------- 4. state ---------- */
  let G;
  function reset() {
    G = {
      segs: [], wake: 0, bad: 0, qs: [], awake: false, awakeAt: 0, awakeT: 0, ban: null, reload: 0, pose: null, poseT: 0, bump: 0, zs: [], cycles: 0,
      led: 0, lastSeg: null, fly: null, snorkAt: 0, awakeLeft: 0, bot: { at: 0, seg: null, dip: false },
    };
    seg('top', 0, TUNE.first, 1, 1); plan(TUNE.first, true);
    ui.setScore(0);
  }
  const acc = () => G.qs.length ? G.qs.reduce((a, b) => a + b, 0) / G.qs.length : 0;
  function grade() {
    if (G.awake) return clamp(.4 + .48 * acc() * Math.pow(.8, G.bad) + .12 * G.awakeLeft, 0, 1);
    return clamp(G.wake * .12 * (.6 + .4 * acc()) - .04 * G.bad, 0, .39);
  }
  const stats = () => [['BONKS', `${G.qs.length}`], ['ROLL-OVERS', G.bad], ['TIMING', G.qs.length ? Math.round(acc() * 100) + '%' : '-'], ['KEEPER', G.awake ? `AWAKE · ${G.awakeAt.toFixed(1)}s` : 'ASLEEP']];

  /* the breathing schedule: segments { k, a, b, v0, v1 } on the keeper's clock. k: top | ex | zone | in | dip | stir | roll | awake */
  function seg(k, a, d, v0, v1) { G.segs.push({ k, a, b: a + d, v0, v1 }); return a + d; }
  function plan(t, fresh) {                                                     /* breaths from t on, past any run length */
    const sp = 1 + TUNE.quick * G.wake, j = () => (1 + rng(-TUNE.jit, TUNE.jit)) / sp;
    if (!fresh) t = seg('top', t, TUNE.top * 2 * j(), 1, 1);
    for (let n = 0; t < 60; n++) {
      if (n > 0 && rng() < TUNE.snort) { t = seg('dip', t, TUNE.ex * .75 * j(), 1, .42); t = seg('in', t, TUNE.inh * .7 * j(), .42, 1); t = seg('top', t, TUNE.top * j(), 1, 1); continue; }
      t = seg('ex', t, TUNE.ex * j(), 1, ZONE_V); t = seg('zone', t, TUNE.zone * j(), ZONE_V, 0); t = seg('in', t, TUNE.inh * j(), 0, 1); t = seg('top', t, TUNE.top * j(), 1, 1);
    }
  }
  function cut(t) { G.segs = G.segs.filter(s => s.a < t); const s = G.segs[G.segs.length - 1]; if (s && s.b > t) { s.v1 = vOf(s, t); s.b = t; s.cut = true; } }
  const segAt = t => { for (const s of G.segs) if (t < s.b) return s; return G.segs[G.segs.length - 1]; };
  function vOf(s, t) {
    const u = s.b > s.a ? clamp((t - s.a) / (s.b - s.a), 0, 1) : 1;
    if (s.k === 'ex' || s.k === 'dip') return s.v0 + (s.v1 - s.v0) * (1 - (1 - u) * (1 - u));
    if (s.k === 'zone') return lerp(s.v0, s.v1, u);
    if (s.k === 'in') return s.v0 + (s.v1 - s.v0) * (u < .5 ? 2 * u * u : 1 - 2 * (1 - u) * (1 - u));
    return s.v0;
  }
  const vAt = t => vOf(segAt(t), t);

  /* ---------- 5. verbs: toss (the player's one action) and what happens when the banana lands ---------- */
  const HAND = { x: FIX_X - 3, y: SHELF_Y - 16 };
  function toss() {
    if (!R.live || G.awake || G.ban || G.reload > 0) { if (R.live && !G.awake) sfx.tick(); return; }
    const tx = NOSE.x - HAND.x, ty = NOSE.y - 3.4 - HAND.y, T = TUNE.T;
    G.ban = { x: HAND.x, y: HAND.y, vx: tx / T, vy: (ty - .5 * TUNE.gy * T * T) / T, t: 0 };
    G.pose = 'carry'; G.poseT = .18; sfx.tone(520, 980, .09, 'triangle', .05); sfx.noise(.05, .03, 2400);
  }
  const offOf = (z, t) => { const half = (z.b - z.a) / 2; return clamp(Math.abs(t - (z.a + half + TUNE.lead)) / Math.max(.01, half), 0, 1); };   /* 0 on the sweet spot .. 1 */
  function land() {
    const t = R.t, s = segAt(t); G.ban = null; G.reload = TUNE.reload;
    let off = -1;
    if (s.k === 'zone') off = offOf(s, t);
    else if (s.k === 'ex' && s.b - t < TUNE.early && !s.cut) off = 1;
    else if (s.k === 'in' && t - s.a < TUNE.late && s.v0 === 0) { const z = G.segs[G.segs.indexOf(s) - 1]; off = z && z.k === 'zone' ? offOf(z, t) : 1; }
    G.fly = { x: NOSE.x, y: NOSE.y - 3, vx: rng(18, 34) * (rng() < .5 ? -1 : 1), vy: -rng(55, 75), t: 0, q: 0 };   /* the banana bounces off */
    if (s.k === 'roll' || s.k === 'awake') { sfx.thud(); ui.floatText(NOSE.x, NOSE.y - 14, 'ZZZ...', 'ice'); return; }
    if (off < 0) return rollOver(t);
    const q = 1 - .75 * off; G.qs.push(q); G.wake++; G.bump = .25;
    sfx.bonk(); sfx.ding(G.wake + 2); MG.hitstop(.06); R.shake(2.2);
    fx.burst(NOSE.x, NOSE.y - 2, ['#ffd23a', '#fff08c', '#ffffff'], 10, 46, 60, .45); fx.ring(NOSE.x, NOSE.y - 2, '#fff08c', 14);
    ui.floatText(NOSE.x - 6, NOSE.y - 18, off < .3 ? 'BONK!!' : 'BONK!', 'gold');
    G.pose = 'cheer'; G.poseT = .3; ui.setScore(G.wake); ui.bump();
    if (G.wake >= 3) return wakeUp(t);
    const d = rng(...TUNE.stir); cut(t); seg('stir', t, d, 1, 1); plan(t + d, false);
    ui.floatText(HX + 4, HY - 6, G.wake === 1 ? 'HUH?' : 'WHA..?', '');
  }
  function rollOver(t) {
    G.bad++; const was = G.wake; G.wake = Math.max(0, G.wake - 1); ui.setScore(G.wake);
    sfx.typo(); sfx.noise(.35, .06, 260); sfx.tone(140, 90, .3, 'sawtooth', .04, .05); R.shake(1.6);
    fx.puff(BX + 26, DESK_Y - 2, '#c9b88a', 6); ui.floatText(HX + 2, HY - 6, was ? 'MRRF! (-1)' : 'MRRF!', 'bad');
    G.pose = 'scared'; G.poseT = .45;
    const d = rng(...TUNE.roll); cut(t); seg('roll', t, d, 1, 1); plan(t + d, false);
  }
  function wakeUp(t) {
    G.awake = true; G.awakeAt = t; G.awakeLeft = R.timer.total > 0 ? R.timer.left / R.timer.total : 0;
    cut(t); seg('awake', t, 99, 1, 1);
    sfx.bell(); MG.hitstop(.1); ui.doFlash('#fff6d6'); fx.burst(TRAY.x + TRAY.w / 2, TRAY.y, ['#fff6d6', '#ffffff', '#c9b88a'], 16, 70, 160, .8);
    ui.floatText(HX + 6, HY - 10, 'AWAKE!', 'big');
    R.end();
  }

  /* ---------- 6. update ---------- */
  function update(dt) {
    const t = R.t, s = segAt(t);
    if (s !== G.lastSeg) {                                                      /* the keeper's sounds + Zs follow its own clock */
      if (R.live) {
        if (s.k === 'in') { sfx.noise(Math.min(.5, s.b - s.a), .045, 230); sfx.tone(92, 70, Math.min(.45, s.b - s.a), 'sawtooth', .018); }
        else if (s.k === 'ex') { sfx.tone(1100, 640, .22, 'sine', .018); G.zs.push({ x: HX + 24, y: HY + 6, t: 0 }); G.cycles++; }
        else if (s.k === 'dip') { G.snorkAt = s.b; }
      }
      G.lastSeg = s;
    }
    if (G.snorkAt && t >= G.snorkAt) { G.snorkAt = 0; if (R.live) { sfx.noise(.12, .07, 420); ui.floatText(HX + 24, HY - 2, 'SNRK!', 'ice'); } }
    G.reload = Math.max(0, G.reload - dt); G.poseT = Math.max(0, G.poseT - dt); G.bump = Math.max(0, G.bump - dt);
    if (G.ban) {
      const b = G.ban; b.t += dt; const k = Math.min(b.t, TUNE.T);
      b.x = HAND.x + b.vx * k; b.y = HAND.y + b.vy * k + .5 * TUNE.gy * k * k;
      if (b.t >= TUNE.T) { if (R.live) land(); else G.ban = null; }
    }
    if (G.fly) { const f = G.fly; f.t += dt; f.vy += 300 * dt; f.x += f.vx * dt; f.y += f.vy * dt; if (f.y > H + 10) G.fly = null; }
    for (const z of G.zs) { z.t += dt; z.y -= dt * 9; z.x += dt * 5; } G.zs = G.zs.filter(z => z.t < 1.4);
    G.led += dt; if (G.awake) G.awakeT += dt;
  }

  /* ---------- 7. bot: reads the snore-o-meter like a player who has caught the rhythm. When the needle starts down it aims for the mark
     in the middle of the green that should follow, with a human spread in its timing, a phone's touch lag (.05 s) and a rare real fumble.
     If the needle turns back up early (a snort) it notices and holds the toss, unless it was already committed. Grades land around
     .65-.9. ---------- */
  const gauss = () => Math.sqrt(-2 * Math.log(rng() || 1e-9)) * Math.cos(rng(Math.PI * 2));
  function bot() {
    const B = G.bot, s = segAt(R.t + TUNE.T);
    if (s !== B.seg) {
      B.seg = s;
      if ((s.k === 'ex' || s.k === 'dip') && !B.at) {
        const sp = 1 + TUNE.quick * G.wake, exLen = s.k === 'dip' ? (s.b - s.a) / .75 : s.b - s.a;
        const err = rng() < .05 + .05 * LV ? rng(-.3, .3) : gauss() * (.065 + .02 * LV);
        B.at = Math.max(R.t + .01, s.a + exLen + TUNE.zone / sp / 2 - TUNE.T + .05 + err); B.dip = s.k === 'dip';
      } else if (s.k === 'in' && B.at && B.dip && B.at - R.t > .12) B.at = 0;
      else if (s.k === 'roll' || s.k === 'stir') B.at = 0;
    }
    if (B.at && R.t >= B.at) { B.at = 0; toss(); }
  }

  /* ---------- 8. draw ---------- */
  const oval = (cx, cy, rx, ry, col) => {
    g.fillStyle = col; const n = Math.max(1, Math.round(ry * 3));
    for (let i = -n; i <= n; i++) { const yy = i / 3, w = rx * Math.sqrt(Math.max(0, 1 - (yy * yy) / (ry * ry))); if (w > 0) g.fillRect(Math.round((cx - w) * 3) / 3, Math.round((cy + yy) * 3) / 3, Math.round(w * 6) / 3, 1 / 3); }
  };
  const r3 = v => Math.round(v * 3) / 3;
  function drawGauge(now) {
    const { x, y, w, h } = GAUGE, s = segAt(R.t + TUNE.T), v = vOf(s, R.t + TUNE.T), off = s.k === 'roll' || s.k === 'stir' || s.k === 'awake', zh = h * ZONE_V, inZone = s.k === 'zone' && R.live && !G.awake;
    g.fillStyle = '#1a0f14'; g.fillRect(x - 1, y - 1, w + 2, h + 2);
    g.fillStyle = '#c98f0e'; g.fillRect(x - .67, y - .67, w + 1.33, h + 1.33); g.fillStyle = '#ffd23a'; g.fillRect(x - .67, y - .67, w + 1.33, .67); g.fillRect(x - .67, y - .67, .67, h + 1.33);
    g.fillStyle = '#1d1418'; g.fillRect(x, y, w, h);
    for (let i = 1; i < 5; i++) { g.fillStyle = '#3a2a30'; g.fillRect(x + w - 2.33, r3(y + (h - zh) * i / 5), 2, .67); }
    g.fillStyle = off ? '#2a3a2a' : inZone ? (Math.floor(now * 12) % 2 ? '#9cff6a' : '#7be05a') : '#2f8a35'; g.fillRect(x, y + h - zh, w, zh);
    if (!off) {
      g.fillStyle = inZone ? '#ffffff' : '#74c648'; g.fillRect(x, y + h - zh, w, .67);
      const blink = inZone && Math.floor(now * 12) % 2, my = r3(y + h - zh / 2);                   /* the sweet spot: a lighter band over the middle of the green, a bright mark at its heart */
      g.fillStyle = inZone ? (blink ? '#e8ffc8' : '#c4f4a0') : '#55b444'; g.fillRect(x, r3(y + h - zh * .75), w, r3(zh / 2));
      g.fillStyle = inZone ? '#1f6a2a' : '#ffffff'; g.fillRect(x, my - .33, w, .67);
      g.fillStyle = '#1a0f14'; g.fillRect(x + w + .67, my - 1.33, 2.67, 2.67); g.fillStyle = '#ffffff'; g.fillRect(x + w + 1, my - 1, 2, 2); g.fillStyle = '#9cff6a'; g.fillRect(x + w + 2.33, my - 1, .67, 2);
    }
    text(g, 'Z', x + 1.33, y - 7.33, '#9ad6f6', 2 / 3); text(g, 'z', x + 5, y - 5, '#9ad6f6', 1 / 3);
    /* the bulb at the foot and the needle */
    oval(x + w / 2, y + h + 3.33, 3.4, 3, '#1a0f14'); oval(x + w / 2, y + h + 3.33, 2.7, 2.3, off ? '#2a3a2a' : inZone ? '#9cff6a' : '#2f8a35');
    if (off) { text(g, s.k === 'roll' ? '?' : '!', x + 2.33, y + h / 2 - 2.33, s.k === 'roll' ? '#ff7a6a' : '#ffd23a', 2 / 3); return; }
    const ny = r3(y + (1 - v) * h);
    g.fillStyle = '#1a0f14'; g.fillRect(x - 3.67, ny - 1.33, w + 4.67, 2.67);
    g.fillStyle = inZone ? '#ffffff' : '#ffd23a'; g.fillRect(x - 3.33, ny - 1, 2.67, 2); g.fillRect(x - .67, ny - .33, w + .67, .67);
    g.fillStyle = '#c98f0e'; g.fillRect(x - 3.33, ny + .33, 2.67, .67);
    const u = inZone && s.b > s.a ? (R.t + TUNE.T - s.a) / (s.b - s.a) : -1;              /* NOW! only while the needle is on the bright band */
    if (u >= .25 && u <= .75) { const t = 'NOW!', tw = textW(t, 1 / 3); g.fillStyle = '#1a0f14'; g.fillRect(x + w / 2 - tw / 2 - .67, y + h + 7.33, tw + 1.33, 3.67); text(g, t, x + w / 2 - tw / 2, y + h + 8, '#9cff6a', 1 / 3); }
  }
  function drawKeeper(now) {
    const s = segAt(R.t), v = vOf(s, R.t), away = s.k === 'roll', awake = G.awake, hop = awake ? Math.max(0, Math.sin(Math.min(1, G.awakeT / .45) * Math.PI)) * 5 : 0;
    const bodyCv = away ? BODY_AWAY : BODY[clamp(Math.round(v * 3), 0, 3)];
    oval(BX + 22, DESK_Y + .33, 18, 1.33, 'rgba(10,6,4,.35)');
    st.hi(bodyCv, BX, BY - hop);
    st.hi(TRAY_BACK, TRAY.x, TRAY.y - 11 - (awake ? hop * .6 : 0));
    const kind = awake ? 'awake' : away ? 'away' : s.k === 'stir' ? 'stir' : 'sleep', bob = G.bump > 0 ? .67 : r3((1 - v) * .67);
    st.hi(HEAD[kind], HX + (away ? 1 : 0), HY + bob - hop);
    st.hi(TRAY_FRONT, TRAY.x, TRAY.y);
    for (let i = 0; i < 3; i++) {                                               /* the wake pips on the tray front */
      const px2 = TRAY.x + 7 + i * 7.5, on = i < G.wake;
      oval(px2, TRAY.y + 5.33, 2, 1.67, '#1a0f14'); oval(px2, TRAY.y + 5.33, 1.33, 1.1, on ? '#7be05a' : '#3a2a30');
      if (on) { g.fillStyle = '#d8ffb0'; g.fillRect(px2 - .67, TRAY.y + 4.67, .67, .67); }
    }
    if (!away && !awake && s.k !== 'stir') {                                    /* the snot bubble: swells on the way down, biggest at the bottom, sucked back in */
      let r = .6;
      if (s.k === 'ex' || s.k === 'dip') r = .6 + (1 - v) * 2.4;
      else if (s.k === 'zone') r = 2.4 + ((s.b > s.a ? (R.t - s.a) / (s.b - s.a) : 1)) * 2;
      else if (s.k === 'in') r = Math.max(.6, 4.4 * (1 - (R.t - s.a) / Math.max(.05, (s.b - s.a) * .5)));
      const cx = NOSE.x - r * .2 + 1, cy = NOSE.y - r * .85;
      oval(cx, cy, r + .4, r + .4, 'rgba(26,15,20,.55)'); oval(cx, cy, r, r, 'rgba(176,232,255,.55)');
      g.fillStyle = '#ffffff'; g.fillRect(r3(cx - r * .45), r3(cy - r * .5), r > 2 ? 1 : .67, r > 2 ? 1 : .67);
    }
    if (awake) {                                                                /* a big "!" pops over the keeper */
      const k = Math.min(1, G.awakeT / .2), y = HY - 12 - hop - k * 3;
      g.fillStyle = '#1a0f14'; g.fillRect(HX + 12.33, y - .67, 4.67, 11.67); g.fillStyle = '#ffd23a'; g.fillRect(HX + 13, y, 3.33, 6.67); g.fillRect(HX + 13, y + 8, 3.33, 2.33);
      g.fillStyle = '#fff08c'; g.fillRect(HX + 13, y, 1, 6.67);
    }
    for (const z of G.zs) { g.globalAlpha = clamp(1.4 - z.t, 0, 1); const sc = z.t < .5 ? 2 / 3 : 1; text(g, 'Z', r3(z.x) + .33, r3(z.y) + .33, '#1a0f14', sc); text(g, 'Z', r3(z.x), r3(z.y), '#cfe8ff', sc); g.globalAlpha = 1; }
  }
  function drawLed(now) {                                                       /* the keeper light on the machine: dark red while it sleeps, green once it's back at work */
    const on = G.awake && Math.floor(now * 4) % 2 === 0;
    if (G.awake && on) oval(LED.x, LED.y, 4.5, 4.5, 'rgba(156,255,106,.25)');
    oval(LED.x, LED.y, 2.4, 2.4, '#1a0f14'); oval(LED.x, LED.y, 1.75, 1.75, G.awake ? (on ? '#9cff6a' : '#2f8a35') : '#5a1a14');
    g.fillStyle = G.awake ? '#e6ffd0' : '#8a3a30'; g.fillRect(LED.x - .67, LED.y - .67, .67, .67);
  }
  function drawFixer(now) {
    const pose = R.done ? (R.won ? 'cheer' : 'scared') : G.poseT > 0 ? G.pose : G.reload > 0 ? 'crouch' : G.ban ? 'idle' : Math.floor(now * 1.6) % 2 ? 'hold0' : 'hold1';
    st.hi(BAN[1], W - 6.33, SHELF_Y - 10); st.hi(BAN[1], W - 4, SHELF_Y - 9.67);                              /* the supply */
    R.crew(FIX_X, SHELF_Y, pose, { flip: true });
    if (!G.ban && G.reload <= 0 && !R.done && G.poseT <= 0) st.hi(A3.bananaS, FIX_X - 5.33, SHELF_Y - 21.33);   /* the banana held overhead */
  }
  function draw() {
    const now = performance.now() / 1000;
    st.hi(ROOM, 0, 0);
    g.fillStyle = `rgba(255,226,138,${(.07 + .01 * Math.sin(now * 7)).toFixed(3)})`;                       /* the lamp's warm cone */
    g.beginPath(); g.moveTo(42, 32); g.lineTo(54, 32); g.lineTo(84, DESK_Y); g.lineTo(14, DESK_Y); g.fill();
    st.hi(TYPEWRITER, -1, DESK_Y - 33);
    drawLed(now); drawGauge(now); drawKeeper(now); drawFixer(now);
    if (G.ban) { const b = G.ban, spr = BAN[Math.floor(b.t * 14) % 4]; st.hi(spr, r3(b.x - spr.width / 6), r3(b.y - spr.height / 6)); }
    if (G.fly) { const f = G.fly, spr = BAN[Math.floor(f.t * 16) % 4]; st.hi(spr, r3(f.x - spr.width / 6), r3(f.y - spr.height / 6)); }
    fx.draw(g);
  }

  /* ---------- 9. input + run ---------- */
  window.NAP = { get G() { return G; }, toss, TUNE, segAt: t => segAt(t) };
  R.run({
    reset, update, draw, grade, stats, bot,
    ended() { if (!G.awake) ui.floatText(HX + 8, HY - 8, 'ZZZ...', 'ice'); },
    down() { toss(); },
    key(ev, k) { if (!ev.repeat && (k === ' ' || k === 'arrowdown' || k === 'enter' || k === 's')) toss(); },
  });
})();
