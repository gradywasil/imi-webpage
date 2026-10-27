/* ============================================================
   STORM FLOOD ON THE FLOOR (repair "flood", BAIL & PATCH, 45 s): the long one, a three-stage event.
   1 PATCH  rain pours through holes in the roof. Hold on a hole: the fixer runs along the beam and nails two boards over it. The storm
            widens open holes as it builds, and a thunderclap cracks one more.
   2 BAIL   the Floor is flooding. From the crates by the window: hold to drop the bucket, let go to heave it out of the window. The water
            sloshes; dunk as the wave rolls in (the closing ring) for a full bucket, and keep the rhythm for a bigger one. Off the crest it
            scoops a slop and the water sloshes back (a beat lost). Thunder surges push water in and holes left open keep pouring (capped, so
            a good rhythm always gains ground). Keep it under the red line, and as low as you can.
   3 FISH   the last surge floats the keepers' word cards off the desks. Tap a card to net it back into the tray before it sinks; skip the
            junk (it stuns the net and costs half a card); an empty dip stuns it too. A rubber duck bobs by: net it for a bonus. Saving
            every card ends it early: the storm clears and the water drains away.
   Grade = .3 patch (holes sealed, how fast) + .33 bail (half dryness over the stage: 1 at ankle depth, 0 at the line; half rhythm:
         dunks on the crest) + .32 fish (cards saved, less half a card per junk netted) + .05 for the duck, rounded to whole percent so
         the card, the stars and the host agree. Level: a fourth hole, an earlier crack, faster widening and seepage, a quicker slosh,
         a third surge, more cards and junk, cards that sink sooner.
   Controls: pointer/touch: hold on a hole (drag along the roof to switch) · hold to dunk, let go or flick up to heave · tap a card.
   Keys: ← → A D move, hold Space/↑/↓ to hammer · hold Space/↓ to dunk, let go (or ↑) to heave · ← → aim the net, Space to scoop.
   Layout as leak.js: 1 sprites · 2 setup · 3 tuning · 4 state · 5 verbs · 6 update · 7 bot · 8 draw · 9 run.
   ============================================================ */
(() => {
  'use strict';
  const { clamp, lerp, sfx } = MG;
  const { R: AR, shapes: { ell, box, poly, cap, and, or } } = MGArt, { make, hl, cvs, text, textW } = MGArt3;
  const TAU = Math.PI * 2, r3 = v => Math.round(v * 3) / 3;
  const SLASH = ['00001', '00010', '00010', '00100', '01000', '01000', '10000'].join('');   /* MGArt3's 5x7 font has no '/' */

  /* ---------- 1. sprites that don't need the desk colour (hi-res: 3 px per unit, draw with st.hi) ---------- */
  const PATCH = make(60, 32, px => {                                             /* two boards to nail over a roof hole: 20 x 10.7 units */
    px.shape(poly([[1, 3], [59, 1], [59, 15], [1, 16]]), AR.woodL, 1);
    px.shape(poly([[1, 17], [59, 16], [58, 30.5], [2, 31]]), AR.wood, 2);
    for (let x = 4; x < 56; x++) { if ((x * 7) % 11 < 5) px.tone(x, 9, 0); if ((x * 5) % 13 < 6) px.tone(x, 23, 0); }
  });
  const NAILS = [[-7.67, -2.67], [7.33, -3], [-7.67, 2.33], [7.33, 2]];          /* nail heads, from the hole's centre, in hammering order */
  const LAMP = make(36, 21, px => { px.shape(poly([[7, 3], [29, 3], [35, 15], [1, 15]]), AR.leaf, 1); px.shape(ell(18, 16, 4.5, 3.4), AR.star, 2); px.shape(box(14, 0, 8, 4), AR.gold, 3); hl(px, 8, 5, 6, 1, 2); });   /* the Floor's green banker's lamp */
  const DUCK = make(39, 33, px => {                                              /* the rubber duck, 13 x 11 units, facing right */
    px.shape(or(ell(17, 23, 14, 8), poly([[2, 13], [11, 18], [6, 25]])), AR.banY, 1);
    px.shape(ell(24, 11, 7.5, 7.5), AR.banY, 2);
    px.shape(or(ell(33, 13.5, 5, 2.4), ell(32, 15.5, 3.6, 1.6)), AR.orange, 3);
    px.shape(ell(14, 22, 6.5, 3.6), AR.banY, 3);
    px.shape(ell(26.5, 9, 1.6, 1.8), AR.ink, 4); px.dot(26, 8, AR.paper, 2, 5);
    hl(px, 19, 6, 3, 2, 2); hl(px, 7, 18, 4, 1, 2);
  });
  const BLOB = make(15, 14, px => { px.shape(or(ell(7.5, 8, 6.5, 5.6), ell(4, 4.5, 3, 3)), AR.ice, 1); });   /* bailed water in flight */
  BLOB.cx = 2.5; BLOB.cy = 2.67;
  const HAMMER = make(24, 24, px => { px.shape(cap(5, 20, 14, 9.5, 1.8), AR.woodL, 1); px.shape(poly([[9, 3], [21, 9.5], [18, 14.5], [6, 8]]), AR.metal, 2); });
  /* a keeper's word card: paper, a red rule, the word in the 5x7 font at 2 px per dot */
  const WORDS = ['APE', 'INK', 'OOK', 'PEN', 'KEY', 'TAP', 'ODE', 'PUN', 'POEM', 'BOOK', 'NOTE', 'WORD', 'VINE', 'TALE', 'PLOT', 'EPIC', 'MUSE', 'YARN'];
  const CARDS = {}, cardOf = w => CARDS[w] || (CARDS[w] = cvs(w.length * 12 + 8, 32, (x, cw) => {
    x.fillStyle = '#1a0f14'; x.fillRect(0, 0, cw, 32); x.fillStyle = '#fff6d6'; x.fillRect(2, 2, cw - 4, 28);
    x.fillStyle = '#ffffff'; x.fillRect(2, 2, cw - 4, 2); x.fillStyle = '#c9b88a'; x.fillRect(2, 27, cw - 4, 3); x.fillStyle = '#e86a50'; x.fillRect(2, 7, cw - 4, 1);
    text(x, w, 5, 11, '#1a0f14', 2);
  }));
  const MINI = cvs(21, 16, x => {                                                /* HUD icon: a little index card */
    x.fillStyle = '#1a0f14'; x.fillRect(0, 0, 21, 16); x.fillStyle = '#fff6d6'; x.fillRect(1, 1, 19, 14); x.fillStyle = '#e86a50'; x.fillRect(1, 4, 19, 1);
    x.fillStyle = '#3a2a30'; for (const [y, w] of [[7, 14], [10, 11], [13, 15]]) x.fillRect(3, y, w, 1);
  });
  const CARD_ICON = cvs(24, 24, x => { x.drawImage(MINI, 1, 4); });
  const A3 = MGArt3.build(), JUNK = [A3.fish, A3.coconut, A3.rotten];          /* things the flood floats in that are not word cards */

  /* ---------- 2. setup: stage, HUD, timer, shell, VERB slam. Each stage slams its own verb (PATCH! BAIL! FISH!) ---------- */
  const R = MGRepair.setup({
    id: 'flood', verb: 'PATCH', scoreIcon: A3.star,                             /* the HUD counts the live grade (%), the same stars the card awards */
    how: '<em>Hold</em> on a roof hole to nail it shut',
    legend: [[PATCH, '<em>patch</em> the roof'], [CARD_ICON, '<em>bail</em>, then <em>fish</em> out the cards'], [DUCK, 'a rubber duck is a <em>bonus</em>']],
    hint: 'hold · tap · ← → and Space',
  });
  const { st, g, W, H, ui, fx, rng, level: LV } = R;
  /* kit markup this file re-uses for the per-stage slams (until the kit grows an R.slam(word, how, at)): repair-kit.js setup() makes
     <div class="mg-verb"><b>WORD</b></div> (the <b> carries mg.css's mg-verb animation, .show makes it visible) and <div class="mg-how">.
     If that markup changes, slam() / setHow() below must follow. */
  const HOST = document.getElementById('stage'), VERB = HOST.querySelector('.mg-verb'), HOW = HOST.querySelector('.mg-how');

  /* sprites in the desk colour: the bucket, the net's hoop, the card tray's label, the typewriter */
  const BUCKET = make(48, 37, px => {
    const body = poly([[3, 8], [45, 8], [40.5, 36], [7.5, 36]]);
    px.shape(body, R.deskR, 1); px.shape(and(body, or(box(0, 14, 48, 3), box(0, 30, 48, 3))), AR.metal, 2);
    px.shape(ell(24, 8, 22.6, 6.6), AR.metal, 3); px.shape(ell(24, 8.6, 19, 4.6), AR.ink, 4);
  });
  const TIPPED = cvs(BUCKET.height, BUCKET.width, x => { x.translate(0, BUCKET.width); x.rotate(-Math.PI / 2); x.drawImage(BUCKET, 0, 0); });   /* mouth to the left (the window) */
  const PAIL = make(24, 24, px => { const b = poly([[3, 8], [21, 8], [18.5, 21], [5.5, 21]]); px.shape(b, R.deskR, 1); px.shape(ell(12, 8, 9.6, 3), AR.metal, 2); px.shape(ell(12, 8.4, 7.4, 1.6), AR.drop, 3); });
  const NET = make(36, 27, px => {                                               /* a hoop seen at an angle over a mesh bag: 12 x 9 units */
    const bag = poly([[4, 6], [32, 6], [25, 25], [11, 25]]);
    px.shape(bag, AR.paper, 1);
    for (let y = 6; y < 26; y++) for (let x = 3; x < 33; x++) if (bag(x + .5, y + .5) && ((x + y) % 4 === 0 || (x - y + 40) % 4 === 0)) px.tone(x, y, 0);
    px.shape(and(ell(18, 6, 16.5, 5), (x, y) => !ell(18, 6, 13.5, 2.8)(x, y)), R.deskR, 2);
  });
  const TRAY = make(42, 24, px => { px.shape(box(1, 3, 40, 20), AR.wood, 1); px.shape(box(4, 3, 34, 4), AR.woodD, 2); px.shape(box(11, 11, 20, 7), R.deskR, 3); });   /* the keeper's card tray, 14 x 8 */
  const TYPEWRITER = MGRepair.parts.typewriter(R.desk);
  const SUN = make(24, 24, px => {                                              /* the finale's sun, for the last banner */
    px.shape(or(box(11, 0, 2, 4), box(11, 20, 2, 4), box(0, 11, 4, 2), box(20, 11, 4, 2), poly([[2, 2], [7, 4], [4, 7]]), poly([[22, 2], [20, 7], [17, 4]]), poly([[2, 22], [4, 17], [7, 20]]), poly([[22, 22], [17, 20], [20, 17]])), AR.gold, 1);
    px.shape(ell(12, 12, 6.6, 6.6), AR.star, 2); hl(px, 9, 8, 3, 1, 2);
  });
  const ICONS = [HAMMER, PAIL, CARD_ICON];

  /* the room, painted once (the roof with its holes is repainted when a hole changes). Windows panes are left clear for the sky. */
  const ROOF = 26, HOLE_Y = 17.5, BEAM = 38, WIN = { x: 4, y: 46, w: 22, h: 38 }, SILL = WIN.y + WIN.h, CRATE_TOP = 94, FIX_X = 33,
    DESK_Y = 102, FLOOR = 150, LINE = 36, LINE_Y = FLOOR - LINE, MAXL = 50, TRAY_X = 58, TRAY_Y = DESK_Y - 8, TW_X = 72, BX = FIX_X - 7,
    X_MIN = 7, X_MAX = W - 7, DUCK_SPOT = [94, DESK_Y - 33 - 9];
  const ROOM = cvs(W * 3, H * 3, x => {
    x.scale(3, 3); const r = (c, a, b, w, hh) => { x.fillStyle = c; x.fillRect(a, b, w, hh); }, s = MG.seeded(23);
    r('#103a26', 0, ROOF, W, 106 - ROOF); for (let sx = 0; sx < W; sx += 8) r('#0d3220', sx, ROOF, 4, 106 - ROOF);      /* the Floor's green stripes, in storm light */
    r('rgba(0,0,0,.35)', 0, ROOF, W, 3);
    r('#3a210d', 0, 106, W, FLOOR - 106);                                                                                  /* wainscot */
    for (let sx = 2; sx < W; sx += 20) { r('#4a2a12', sx, 109, 16, 38); r('#5a3517', sx, 109, 16, .67); r('#2a170b', sx, 146.33, 16, .67); }
    r('#1a0f14', 0, 105, W, 1.33); r('#8a5a2b', 0, 105.33, W, .67);
    r('#1a0f14', 0, LINE_Y - 1, W, 2.67); for (let sx = 0; sx < W; sx += 6) { r('#b8322a', sx, LINE_Y - .67, 3, 2); r('#e8d8a8', sx + 3, LINE_Y - .67, 3, 2); }   /* the line tape */
    r('#1a0f14', WIN.x - 2.33, WIN.y - 2.33, WIN.w + 4.67, WIN.h + 2.33);                                                  /* window: frame, open lower half, sill */
    r('#c08a4a', WIN.x - 1.67, WIN.y - 1.67, WIN.w + 3.33, WIN.h + 1.67); r('#e8b878', WIN.x - 1.67, WIN.y - 1.67, WIN.w + 3.33, .67); r('#e8b878', WIN.x - 1.67, WIN.y - 1.67, .67, WIN.h);
    x.clearRect(WIN.x, WIN.y, WIN.w, WIN.h);
    r('#1a0f14', WIN.x, WIN.y + 16, WIN.w, 3.67); r('#c08a4a', WIN.x, WIN.y + 16.33, WIN.w, 3); r('#e8b878', WIN.x, WIN.y + 16.33, WIN.w, .67);
    r('#1a0f14', WIN.x + WIN.w / 2 - 1, WIN.y, 2, 16.33); r('#c08a4a', WIN.x + WIN.w / 2 - .67, WIN.y, 1.33, 16.33);
    r('#1a0f14', WIN.x - 4.33, SILL - .33, WIN.w + 8.67, 4.33); r('#b57d3e', WIN.x - 4, SILL, WIN.w + 8, 3.33); r('#e8b878', WIN.x - 4, SILL, WIN.w + 8, .67); r('#7a4a1e', WIN.x - 4, SILL + 2.67, WIN.w + 8, .67);
    r('#1a0f14', 0, BEAM - .33, W, 5); r('#6a4120', 0, BEAM, W, 4.33); r('#8a5a2b', 0, BEAM, W, .67); r('#3a210d', 0, BEAM + 3.67, W, .67);   /* the roof beam */
    for (let sx = 9; sx < W; sx += 17) { r('#1a0f14', sx - .33, BEAM + 1.33, 1.67, 1.67); r('#c98f0e', sx, BEAM + 1.67, 1, 1); }
    for (const bx of [0, W - 5]) { r('#1a0f14', bx, BEAM + 4.33, 5, 7); r('#5a3517', bx + .33, BEAM + 4.33, 4.33, 6.33); }
    r('#2a170b', 0, FLOOR, W, H - FLOOR); for (let y = FLOOR, i = 0; y < H; y += 3.33, i++) { r(['#4a2a12', '#5a3517'][i % 2], 0, y, W, 3); for (let sx = (i * 23) % 29; sx < W; sx += 29) r('#2a170b', sx, y, .67, 3.33); }
    const crate = (a, b, w, hh) => {                                                                                       /* a wooden crate, slats + corner posts */
      r('#1a0f14', a - .33, b - .33, w + .67, hh + .67); r('#8a5a2b', a, b, w, hh); r('#b57d3e', a, b, w, .67); r('#b57d3e', a, b, .67, hh);
      r('#5a3517', a, b + hh - .67, w, .67); r('#5a3517', a + w - .67, b, .67, hh);
      for (let yy = b + 4.67; yy < b + hh - 2; yy += 4.67) r('#6a4120', a + 2, yy, w - 4, .67);
      r('#6a4120', a + 1.33, b + 1.33, 1.33, hh - 2.67); r('#6a4120', a + w - 2.67, b + 1.33, 1.33, hh - 2.67);
    };
    crate(20, 136, 13, 14); crate(33, 136, 13, 14); crate(21, 122, 24, 14); crate(23, 108, 20, 14); crate(25, CRATE_TOP, 16, 14);
    text(x, 'IMI', 28.5, 101.33, '#5a3517', 1 / 3);
    r('#1a0f14', 57, DESK_Y - .33, 62, 4.67); r('#8a5a2b', 57.33, DESK_Y, 61.33, 3.67); r('#b57d3e', 57.33, DESK_Y, 61.33, .67); r('#4a2a12', 57.33, DESK_Y + 3, 61.33, .67);   /* the desk */
    r('#1a0f14', 80, DESK_Y + 3.67, 26, LINE_Y - DESK_Y - 3.33); r('#6a4120', 80.33, DESK_Y + 4, 25.33, LINE_Y - DESK_Y - 4.33); r('#c98f0e', 91.67, DESK_Y + 7.33, 2.67, 1.33);   /* the word drawer */
    for (const lx of [59, 113]) { r('#1a0f14', lx - .33, DESK_Y + 4, 4.67, FLOOR - DESK_Y - 4); r('#6a4120', lx, DESK_Y + 4, 4, FLOOR - DESK_Y - 4); r('#8a5a2b', lx, DESK_Y + 4, 1, FLOOR - DESK_Y - 4); }
    for (let k = 0; k < 14; k++) r('rgba(10,30,20,.35)', Math.floor(s() * W), ROOF + 4 + Math.floor(s() * 70), .67, 2 + Math.floor(s() * 5));   /* damp streaks on the wall */
  });

  /* ---------- 3. tuning: one place for every number the level (0..1) and the stage clock move ---------- */
  const K = R.seconds / 45;                                                     /* Steady hands (extra seconds) stretches every stage a little */
  const TUNE = {
    holes: LV >= .7 ? 4 : 3, crack: true, crackAt: lerp(3.8, 3, LV) * K,          /* roof holes at the start; then a thunderclap cracks one more */
    hold: lerp(.85, 1.05, LV), sizeHold: [1, 1, 1.2, 1.4], speed: 95,           /* seconds of hammering per hole (bigger holes take longer); run speed */
    widen: lerp(4.4, 2.9, LV), flow: [0, .7, 1.1, 1.6].map(f => f * lerp(1, .8, LV)),   /* seconds between widenings; water per second through a size 1..3 hole (more holes up the level) */
    p1max: 13 * K, p2dur: 14 * K, gap: 1.5,                                     /* the patch stage's cap, the bail stage's length, the interlude (stage card) */
    period: lerp(1.3, 1, LV), amp: lerp(4.5, 6, LV), perf: lerp(.9, .875, LV),  /* the slosh: seconds per wave, its height at the walls; a dunk this near the crest is perfect (about ±.12 s at every level) */
    bucket: 3.3, dry: 6,                                                        /* water one full bucket takes out; "dry" (ankle deep) is up to here */
    slop: [.05, .6], slopCool: .4,                                              /* off the crest: fill = slop0 + slop1 x crest^4, and the slosh back costs a beat */
    inflow: lerp(.6, .64, LV),                                                  /* bail stage inflow as a share of what a perfect rhythm bails (bucket x 1.4 / period) */
    wlCap: LINE - 10, leakMax: .25,                                             /* the patch stage floods no higher than this; open holes pour at most this share of a perfect rhythm while bailing */
    wDry: .5,                                                                   /* the bail score: this much dryness, the rest rhythm (crest dunks) */
    junkStun: .7, missStun: .3, qGrace: .12,                                    /* the net: stunned after junk / an empty dip; a tap while it is busy counts only this close to it coming free */
    burst: lerp(4, 5, LV), surgeAt: (LV >= .5 ? [3.2, 7.4, 11.2] : [3.6, 9.2]).map(t => t * K),   /* the storm breaking in, then thunder surges */
    cards: 7 + Math.round(LV * 3), junk: 2 + Math.round(LV * 2),                /* fish stage */
    every: lerp(.7, .58, LV), life: lerp(3.5, 3.1, LV), drift: lerp(5.5, 9.5, LV),   /* seconds between things surfacing, before a card sinks; drift speed */
    bolt: [[3.2, 5], [2, 3.4], [4.5, 7]],                                       /* seconds between lightning bolts per stage: the storm peaks while you bail */
  };
  const CAP = TUNE.bucket * 1.4 / TUNE.period;                                  /* 70% of the inflow seeps in steadily (rising), 30% comes as surges */
  TUNE.seep = p => CAP * TUNE.inflow * .7 * lerp(.85, 1.2, p) / 1.025;
  TUNE.surge = CAP * TUNE.inflow * .3 * 14 / TUNE.surgeAt.length;
  const SLOTS = [18, 35, 52, 69, 86, 102];                                      /* where holes can open along the roof */
  const HOLE_R = [[0, 0], [4.6, 2.9], [6.2, 3.7], [7.6, 4.4]];

  /* ---------- 4. state: everything a run changes lives in G, rebuilt by reset() (also on standalone AGAIN) ---------- */
  let G, ROOFC = null;
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng(i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const mkHole = x => ({ x, size: 1, age: 0, prog: 0, nails: 0, done: false, k: Array.from({ length: 11 }, () => [rng(-.18, .18), rng(.78, 1.1)]) });
  function reset() {
    const sl = shuffle(SLOTS.map(x => x + Math.round(rng(-2, 2))));
    G = {
      stage: 'patch', sT: 0, gT: 0, T1: 0, speed1: 0, cracked: false, spare: sl.slice(TUNE.holes), holes: sl.slice(0, TUNE.holes).map(mkHole),
      wl: 3, ph: 0, amp: 0, kick: 0, bumps: [], surgeQ: 0, surgeI: 0, qSum: 0, over: false, overSay: 0, l3: 0, l3from: 0,
      fx: { x: 60, y: BEAM, vx: 0, aim: 60, face: 1, walk: 0, ham: 0, grab: 0, x0: 60, land: 0, landed: false, cheer: 0 },
      hold: false, keyHold: false, keyed: false, aimHole: null, hamH: null,
      bk: { s: 'up', t: 0, c: 0, fill: 0, perfect: false, queued: false, cool: 0 }, combo: 0, bestCombo: 0, bails: 0, perfects: 0, throws: [],
      items: [], queue: [], spawnT: .3, every: TUNE.every, saved: 0, lost: 0, junkHits: 0, duck: false, duckSeen: false, trayBump: 0,
      net: { x: 70, y: 124, s: 'idle', t: 0, fx: 70, tx: 70, dur: .1, tgt: null, held: null, stun: 0, q: null }, netX: 70, keyNet: false,
      flash: 0, boltT: 2.4, boltPts: null, rainK: .55, sun: 0, finT: 0, win: false, verbT: 0, howT: 0, score: -1, hiss: 0, card: { i: 0, t: -.7, d: 1.6 },   /* stage 1's card waits for the kit's PATCH! slam to go */
      bot: { react: .45, target: null, err: null, fumble: 0, rel: 0, skill: rng(.75, 1.25), duck: rng() < .7 },
    };
    paintRoof(); ui.setScore(0); ui.setCombo(0, 1); setHow(null);
  }
  const s1 = () => { const n = G.holes.length, d = G.holes.filter(h => h.done).length; return n ? d / n * (.55 + .45 * G.speed1) : 0; };
  const dryness = () => clamp(G.qSum / TUNE.p2dur, 0, 1);
  const rhythm = () => clamp(G.perfects / (TUNE.p2dur / TUNE.period * .85), 0, 1);   /* crest dunks against ~all the crests the stage has */
  const s2 = () => TUNE.wDry * dryness() + (1 - TUNE.wDry) * rhythm();
  const s3 = () => clamp((G.saved - .5 * G.junkHits) / TUNE.cards, 0, 1);
  /* the duck counts inside the 1.0; whole percent, so the card's verdict, its stars, its GRADE n% and the bridge's grade all agree */
  const grade = () => Math.round(clamp(.3 * s1() + .33 * s2() + .32 * s3() + (G.duck ? .05 : 0), 0, 1) * 100) / 100;
  const stats = () => [
    ['ROOF PATCHED', `${G.holes.filter(h => h.done).length} / ${G.holes.length}`], ['KEPT DRY', `${Math.round(dryness() * 100)}%`],
    ['ON THE WAVE', `${G.perfects} / ${G.bails} BUCKETS`],
    ['CARDS SAVED', `${G.saved} / ${TUNE.cards}${G.junkHits ? ` · ${G.junkHits} JUNK` : ''}`], ['RUBBER DUCK', G.duck ? 'RESCUED' : G.duckSeen ? 'MISSED' : '-'],
  ];

  /* the water: a level (units above the floor) plus the slosh (a standing wave, high at one wall while low at the other), ripples and surge bumps */
  const slosh = x => G.amp * Math.sin(G.ph) * Math.cos(Math.PI * x / W);
  const surfY = (x, now = R.t) => { let y = FLOOR - G.wl - slosh(x) - .4 * Math.sin(x * .45 + now * 3.1); for (const b of G.bumps) y -= b.h * Math.exp(-(((x - b.x) / 9) ** 2)); return y; };
  const crest = () => (Math.sin(G.ph) + 1) / 2;                                 /* 1 when the wave is at its highest under the bucket */
  const open = () => G.holes.filter(h => !h.done);
  const holeFlow = () => open().reduce((a, h) => a + TUNE.flow[h.size] * (1 - .6 * h.prog), 0);

  /* the roof boards, with every hole cut out and splintered (hi-res mask), repainted when a hole opens or widens */
  function paintRoof() {
    const c = cvs(W * 3, ROOF * 3, x => {
      x.scale(3, 3); const r = (cl, a, b, w, hh) => { x.fillStyle = cl; x.fillRect(a, b, w, hh); };
      for (let y = 0, i = 0; y < ROOF - 3; y += 5.33, i++) { r(['#4a2a12', '#523015', '#46280f'][i % 3], 0, y, W, 5.33); r('#5a3517', 0, y, W, .67); r('#2a170b', 0, y + 4.67, W, .67); for (let sx = (i * 29) % 23; sx < W; sx += 23 + i * 3) r('#2a170b', sx, y, .67, 5.33); }
      r('#1a0f14', 0, ROOF - 3, W, 3); r('#6a4120', 0, ROOF - 2.67, W, 2.33); r('#8a5a2b', 0, ROOF - 2.67, W, .67);
    });
    const x = c.getContext('2d'), w = c.width, hh = c.height, img = x.getImageData(0, 0, w, hh), d = img.data, cut = new Uint8Array(w * hh);
    for (const h of G.holes) {
      const P = h.k.map(([da, f], i) => { const a = i / h.k.length * TAU + da; return [(h.x + Math.cos(a) * HOLE_R[h.size][0] * f) * 3, (HOLE_Y + Math.sin(a) * HOLE_R[h.size][1] * f) * 3]; });
      const inP = poly(P), x0 = Math.max(0, Math.floor(Math.min(...P.map(p => p[0])))), x1 = Math.min(w - 1, Math.ceil(Math.max(...P.map(p => p[0])))), y0 = Math.max(0, Math.floor(Math.min(...P.map(p => p[1])))), y1 = Math.min(hh - 1, Math.ceil(Math.max(...P.map(p => p[1]))));
      for (let yy = y0; yy <= y1; yy++) for (let xx = x0; xx <= x1; xx++) if (inP(xx + .5, yy + .5)) cut[yy * w + xx] = 1;
    }
    const put = (i, hex) => { d[i * 4] = parseInt(hex.substr(1, 2), 16); d[i * 4 + 1] = parseInt(hex.substr(3, 2), 16); d[i * 4 + 2] = parseInt(hex.substr(5, 2), 16); d[i * 4 + 3] = 255; };
    for (let yy = 0; yy < hh; yy++) for (let xx = 0; xx < w; xx++) {
      const i = yy * w + xx; if (cut[i]) { d[i * 4 + 3] = 0; continue; }
      const at = (a, b) => a >= 0 && b >= 0 && a < w && b < hh && cut[b * w + a];
      if (at(xx, yy - 1)) put(i, '#e8b878');                                      /* splintered edge below the hole catches the light */
      else if (at(xx - 1, yy) || at(xx + 1, yy) || at(xx, yy + 1)) put(i, '#1a0f14');
      else if (at(xx, yy - 2) || at(xx - 2, yy) || at(xx + 2, yy)) put(i, '#8a5a2b');
    }
    x.putImageData(img, 0, 0); ROOFC = c;
  }

  /* ---------- 5. verbs: hammer a patch (hold), dunk + heave the bucket, net a card. Input hooks and the bot both call these. ---------- */
  /* the kit's VERB <b> runs its CSS animation once, from when it was created: restart it so every slam (the kit's first one too) plays in full */
  const replay = el => { el.style.animation = 'none'; void el.offsetWidth; el.style.animation = ''; };
  const slam = word => {                                                        /* re-use the kit's VERB slam for each stage */
    VERB.style.setProperty('--len', word.length); VERB.firstChild.textContent = word; VERB.classList.remove('show'); void VERB.offsetWidth; VERB.classList.add('show'); replay(VERB.firstChild); G.verbT = .6;
    sfx.clack(8); sfx.tone(660, 1320, .09, 'square', .04, .03);
  };
  function setHow(html, at) {
    HOW.style.top = at === 'top' ? 'calc(var(--sc) * 16)' : ''; HOW.style.bottom = at === 'top' ? 'auto' : '';
    if (!html) { HOW.classList.remove('show'); G.howT = 0; return; }
    HOW.innerHTML = html; HOW.classList.add('show'); G.howT = 2.8;
  }
  function fanfare(up = true) { (up ? [392, 523, 659, 784] : [523, 466, 392, 330]).forEach((f, i) => sfx.tone(f, f, i === 3 ? .2 : .08, 'square', .03, i * .08)); }
  function thunder(big) { sfx.noise(big ? 1.5 : .9, big ? .13 : .06, big ? 260 : 170, .08); sfx.tone(72, 36, big ? 1.1 : .6, 'sawtooth', big ? .05 : .025, .08); }
  function bolt(big) {                                                          /* lightning: the window and the holes flash, thunder rolls */
    const S = G.stage, gap = TUNE.bolt[S === 'patch' ? 0 : S === 'fish' || S === 'toFish' ? 2 : 1];
    G.flash = big ? .24 : .15; G.boltT = MG.rng(gap[0], gap[1]);
    const pts = [[WIN.x + MG.rng(5, WIN.w - 5), WIN.y - 2]]; while (pts[pts.length - 1][1] < WIN.y + 30) { const [a, b] = pts[pts.length - 1]; pts.push([clamp(a + MG.rng(-4, 4), WIN.x + 1, WIN.x + WIN.w - 1), b + MG.rng(4, 7)]); }
    G.boltPts = pts; thunder(big);
    if (big) { R.shake(3); ui.doFlash('rgba(214,240,255,.5)'); }
  }
  /* PATCH */
  const nearestOpen = x => open().reduce((b, h) => !b || Math.abs(h.x - x) < Math.abs(b.x - x) ? h : b, null);
  function nail(h, i) {
    const [dx, dy] = NAILS[i]; sfx.clack(4 + i * 3); sfx.tone(1400 + i * 120, 900, .04, 'square', .04);
    fx.burst(h.x + dx, HOLE_Y + dy, ['#fff08c', '#f0f0f8', '#c08a4a'], 4, 30, 60, .25); fx.spark(h.x + dx, HOLE_Y + dy); R.shake(.8);
  }
  function patched(h) {
    h.done = true; h.prog = 1; G.fx.grab = .25;
    sfx.ding(2); sfx.tone(520, 1040, .12, 'triangle', .05); MG.hitstop(.04);
    fx.burst(h.x, HOLE_Y + 4, ['#c08a4a', '#e8b878', '#7ec8f0', '#d6f0ff'], 10, 40, 140, .45);
    ui.floatText(h.x, HOLE_Y + 12, 'PATCHED!', 'gold'); ui.bump();
  }
  function widened(h) {
    sfx.noise(.16, .05, 700); sfx.tone(160, 90, .12, 'square', .03); fx.burst(h.x, HOLE_Y + 2, ['#4a2a12', '#8a5a2b', '#7ec8f0'], 6, 36, 160, .4);
    if (h.size === 3) ui.floatText(h.x, HOLE_Y + 12, 'GUSHING!', 'bad');
  }
  function crack() {                                                            /* thunder splits the roof: one more hole, already wide */
    G.cracked = true; const x = G.spare.shift(); if (x == null) return;
    const h = mkHole(x); h.size = 2; h.age = TUNE.widen; G.holes.push(h); paintRoof();
    bolt(true); MG.hitstop(.06); ui.floatText(x, HOLE_Y + 13, 'CRACK!', 'bad');
    fx.burst(x, HOLE_Y, ['#4a2a12', '#8a5a2b', '#c08a4a'], 16, 64, 220, .6);
  }
  function pressHole(x) { G.hold = true; G.aimHole = nearestOpen(x); }
  /* BAIL */
  function dunk() {
    const B = G.bk; if (G.stage !== 'bail' || !R.live || B.s !== 'up' || B.cool > 0) return;
    const c = crest(), perfect = c >= TUNE.perf;                                /* off the crest it scoops a slop (and costs a beat): spamming loses to the rhythm */
    Object.assign(B, { s: 'drop', t: 0, c, fill: perfect ? 1 : TUNE.slop[0] + TUNE.slop[1] * Math.pow(c, 4), perfect, queued: false });
    sfx.tone(520, 300, .07, 'triangle', .03);
  }
  function heave() {
    const B = G.bk; if (G.stage !== 'bail' || !R.live) return;
    if (B.s === 'drop') { B.queued = true; return; }
    if (B.s !== 'in') return;
    const amt = TUNE.bucket * B.fill * (1 + .1 * Math.min(G.combo, 4));
    G.wl = Math.max(0, G.wl - amt); G.bails++; B.s = 'heave'; B.t = 0;
    const n = 2 + Math.round(B.fill * 5), x0 = BX - 4, y0 = CRATE_TOP - 20;     /* the water arcs out of the window once the bucket is up */
    for (let i = 0; i < n; i++) { const tx = WIN.x + rng(4, WIN.w - 4), ty = WIN.y + rng(8, 22), T = .3 + i * .03; G.throws.push({ x: x0, y: y0, vx: (tx - x0) / T, vy: (ty - y0 - 150 * T * T) / T, gy: 300, t: -.14 - i * .03, T }); }
    sfx.noise(.2, .07, 2400, .1); sfx.tone(280, 860, .14, 'triangle', .04);
    if (G.overSay > 0 || TUNE.p2dur - G.sT < 1) return;                         /* no words over the OVER THE LINE! banner, or left over for stage 3's card */
    if (B.perfect) ui.floatText(BX + 2, CRATE_TOP - 26, G.combo >= 3 ? `SPLOOSH x${G.combo}` : 'SPLOOSH!', 'gold');
    else ui.floatText(BX + 2, CRATE_TOP - 26, B.fill < .5 ? 'slop...' : 'SLOSH', B.fill < .5 ? 'bad' : '');
  }
  function surge() {                                                            /* thunder, then a wave rolls in under the desk */
    G.surgeQ += TUNE.surge; G.kick = 2.4; G.bumps.push({ x: W + 14, h: 4.5 }); bolt(true);
    ui.floatText(W - 22, LINE_Y - 16, 'SURGE!', 'bad');
  }
  /* FISH */
  function pick(x, y) {                                                         /* the floating thing nearest a tap, generously */
    let best = null, bd = 1e9;
    for (const it of G.items) {
      if (it.s !== 'float' && it.s !== 'rise') continue;
      const dx = Math.abs(it.x - x), dy = y == null ? 0 : Math.abs(it.y + it.h / 2 - y);
      if (dx > it.w / 2 + 5 || dy > 15) continue; const d = dx + dy * .4; if (d < bd) { bd = d; best = it; }
    }
    return best;
  }
  function scoop(x, y) {
    const N = G.net; if (G.stage !== 'fish' || !R.live) return;
    if (N.s !== 'idle' || N.stun > 0) { N.q = [x, y, R.t]; return; }           /* busy: kept only if the net comes free within qGrace (no tap-ahead spam) */
    const it = pick(x, y); N.s = 'go'; N.t = 0; N.fx = N.x; N.tx = clamp(it ? it.x : x, 4, W - 4); G.netX = N.tx; N.tgt = it;   /* the net homes on what you tapped */
    N.dur = Math.max(.08, Math.abs(N.tx - N.fx) / 220); sfx.tone(700, 1000, .05, 'triangle', .03);
  }
  const afloat = it => it && (it.s === 'float' || it.s === 'rise');
  function grab() {
    const N = G.net, T = N.tgt; let best = null, bd = 1e9; N.tgt = null;
    if (afloat(T) && Math.abs(T.x - N.x) <= T.w / 2 + 3) best = T;            /* the tapped thing, not the junk bobbing beside it */
    else for (const it of G.items) { if (!afloat(it)) continue; const d = Math.abs(it.x - N.x); if (d <= it.w / 2 + 3 && d < bd) { bd = d; best = it; } }
    const y = surfY(N.x); fx.burst(N.x, y, ['#d6f0ff', '#7ec8f0'], 6, 34, 150, .35); sfx.noise(.1, .05, 1500);
    if (!best) { sfx.miss(); N.stun = TUNE.missStun; return; }                  /* an empty dip: the net drips for a moment */
    N.held = best; best.s = 'net';
  }
  function toDesk(it) {                                                         /* out of the net: a card flies to the tray, the duck to the machine */
    const d = it.kind === 'duck'; Object.assign(it, { s: 'fly', t: 0, fx: it.x, fy: it.y, tx: d ? DUCK_SPOT[0] + it.w / 2 : TRAY_X + 8, ty: d ? DUCK_SPOT[1] : TRAY_Y - 3 });
    sfx.tone(600, 1200, .1, 'triangle', .04); G.fx.cheer = .3;
  }
  function landed(it) {                                                         /* a netted card reaches the tray; the duck its perch */
    if (it.kind === 'duck') {
      it.s = 'gone'; G.duck = true; MG.hitstop(.06);
      sfx.tone(760, 520, .09, 'square', .05); sfx.tone(760, 520, .09, 'square', .05, .13); sfx.golden();
      fx.confetti(DUCK_SPOT[0] + 6, DUCK_SPOT[1], 14); ui.floatText(DUCK_SPOT[0] + 4, DUCK_SPOT[1] - 4, 'QUACK! BONUS', 'gold'); return;
    }
    it.s = 'saved'; G.saved++; G.trayBump = .2; sfx.letters(); ui.bump();
    fx.burst(TRAY_X + 7, TRAY_Y, ['#fff6d6', '#ffffff', '#ffd23a'], 8, 34, 120, .4);
    ui.floatText(TRAY_X + 7, TRAY_Y - 24, G.saved === TUNE.cards ? 'ALL SAVED!' : 'SAVED!', 'gold');   /* above the n/N counter, not on it */
  }
  function airStep(it, dt) {                                                    /* netted things in the air: cards to the tray, the duck to its perch, junk back in */
    it.t += dt; const fly = it.s === 'fly', k = clamp(it.t / (fly ? .45 : .4), 0, 1), ty = fly ? it.ty : surfY(it.tx) - it.h * .6;
    it.x = lerp(it.fx, it.tx, k); it.y = lerp(it.fy, ty, k) - Math.sin(k * Math.PI) * 16;
    if (k < 1) return;
    if (fly) landed(it); else { it.s = 'float'; fx.burst(it.x, surfY(it.x), ['#d6f0ff', '#7ec8f0'], 5, 30, 120, .3); sfx.noise(.08, .04, 1200); }
  }
  function sink(it) {
    it.s = 'sink'; it.t = 0;
    fx.burst(it.x, surfY(it.x), ['#d6f0ff', '#9ad6f6'], 5, 18, -30, .5);
    if (it.kind === 'card') { G.lost++; sfx.tone(300, 110, .22, 'sine', .05); ui.floatText(it.x, surfY(it.x) - 8, 'GLUG', 'bad'); }
    else if (it.kind === 'duck') ui.floatText(it.x, surfY(it.x) - 8, 'IT GOT AWAY', 'ice');
  }
  function spawn(kind) {
    let x = rng(12, W - 12);
    for (let i = 0; i < 6 && G.items.some(o => (o.s === 'float' || o.s === 'rise') && Math.abs(o.x - x) < 16); i++) x = rng(12, W - 12);
    const it = { kind, s: 'rise', t: 0, x, vx: (rng() < .5 ? -1 : 1) * rng(.6, 1) * TUNE.drift, bob: rng(TAU), life: TUNE.life * rng(.9, 1.1), y: FLOOR };
    if (kind === 'card') it.spr = cardOf(WORDS[Math.floor(rng(WORDS.length))]);
    else if (kind === 'junk') it.spr = JUNK[Math.floor(rng(JUNK.length))];
    else { it.spr = DUCK; it.x = 12; it.vx = TUNE.drift * 1.1 + 3; it.life = 7.5; G.duckSeen = true; sfx.tone(760, 520, .08, 'square', .03); }
    it.max = it.life; it.w = it.spr.width / 3; it.h = it.spr.height / 3; it.y = surfY(it.x) + 4;
    G.items.push(it); fx.burst(it.x, surfY(it.x), ['#d6f0ff', '#7ec8f0'], 6, 30, 120, .35); sfx.noise(.08, .04, 1600);
    if (kind === 'duck') ui.floatText(it.x + 4, surfY(it.x) - 14, 'QUACK?', 'ice');
  }

  /* stage changes: each one slams its verb, moves the hint off the action and gives the player a beat */
  function toBail() {
    const all = !open().length; G.T1 = G.sT;
    if (all) { const par = G.holes.length * (TUNE.hold * 1.1 + .35) + .3; G.speed1 = clamp(1 - (G.T1 - par) / 5, 0, 1); ui.floatText(W / 2, 64, 'ROOF SEALED!', 'gold'); sfx.golden(); }
    else { ui.floatText(W / 2, 64, 'STILL LEAKING!', 'bad'); sfx.miss(); }      /* below the stage card, which rides the beam */
    G.stage = 'toBail'; G.gT = 0; G.hold = G.keyHold = false; G.hamH = null; G.fx.x0 = G.fx.x;
    G.wl = Math.min(G.wl, TUNE.wlCap);                                          /* a weak patch starts the bail high, never hopeless */
    G.surgeQ += TUNE.burst; G.kick = 2.5; G.bumps.push({ x: W + 14, h: 6 }); bolt(true); ui.floatText(W - 24, LINE_Y - 16, 'HERE IT COMES!', 'bad');   /* the storm breaks in */
    G.card = { i: 1, t: -.45, d: TUNE.gap - .3 }; fanfare();                   /* in once the fixer has jumped clear of the beam */
  }
  function toFish() {
    G.stage = 'toFish'; G.gT = 0; G.l3from = G.wl; G.l3 = clamp(G.wl, 15, 30); G.over = false;
    G.bumps.push({ x: W + 14, h: 5 }); G.kick = 2; bolt(true);
    const q = []; for (let i = 0; i < TUNE.cards; i++) q.push('card'); for (let i = 0; i < TUNE.junk; i++) q.push('junk'); shuffle(q);
    if (q[0] !== 'card') { const i = q.indexOf('card'); [q[0], q[i]] = [q[i], q[0]]; }
    q.splice(Math.round(q.length * .4), 0, 'duck'); G.queue = q; G.spawnT = .3; G.netX = G.net.x = 70;
    G.every = clamp((R.timer.left - TUNE.gap - TUNE.life - 1) / q.length, .5, TUNE.every);   /* a slow patch leaves less time: things surface faster */
    ui.setCombo(0, 1); G.card = { i: 2, t: 0, d: TUNE.gap }; fanfare();
  }
  function finale() {                                                           /* the storm passes: rain stops, sun, the water drains (if it went well) */
    if (G.stage === 'fin') return;
    G.stage = 'fin'; G.finT = 0; G.win = grade() >= MG.VERDICT_AT.fixed; G.hold = G.keyHold = false;
    const N = G.net, held = N.held; N.held = null; N.s = 'idle';                /* the net goes away: whatever is in it lands or drops back */
    if (held) { if (R.live && held.kind !== 'junk') toDesk(held); else sink(held); }
    if (!R.live) return;                                                        /* time ran out: the kit's verdict is the banner */
    G.card = { i: 3, t: 0, d: 1.4, win: G.win }; fanfare(G.win); setHow(null);
    if (G.win) { sfx.noise(1, .035, 500, .2); sfx.tone(320, 70, .9, 'sine', .05, .2); sfx.tone(2300, 3100, .07, 'sine', .02, .75); sfx.tone(2500, 3300, .07, 'sine', .02, .87); }   /* the drain gurgles, a bird */
  }

  /* ---------- 6. update (fixed 60 Hz). R.live is false once end() was called: stop scoring, let things settle ---------- */
  function updPatch(dt) {
    const F = G.fx; G.sT += dt; G.rainK = lerp(.55, .9, clamp(G.sT / TUNE.p1max, 0, 1));
    let repaint = false;
    for (const h of open()) { h.age += dt; const s = Math.min(3, 1 + Math.floor(h.age / TUNE.widen)); if (s > h.size) { h.size = s; repaint = true; widened(h); } }
    if (repaint) paintRoof();
    G.wl += holeFlow() * dt * clamp((TUNE.wlCap - G.wl) / 8, 0, 1);              /* rising, slower as it nears the cap */
    /* aim: keys steer directly; a held pointer (or the bot) runs to its hole */
    const ax = R.live ? R.axisX() : 0;
    if (ax) { G.keyed = true; F.aim = clamp(F.x + ax * 30, X_MIN, X_MAX); G.aimHole = null; }
    else if (G.keyed) { G.keyed = false; F.aim = F.x; }
    if (G.keyHold && !ax) { const h = nearestOpen(F.x); if (h && Math.abs(h.x - F.x) < 10) F.aim = h.x; }
    if (G.hold && G.aimHole && !G.aimHole.done) F.aim = G.aimHole.x;
    const want = R.live ? clamp((F.aim - F.x) * 12, -TUNE.speed, TUNE.speed) : 0;
    F.vx = lerp(F.vx, want, Math.min(1, dt * 18)); F.x = clamp(F.x + F.vx * dt, X_MIN, X_MAX);
    if (Math.abs(F.vx) > 6) { F.walk += Math.abs(F.vx) * dt; F.face = Math.sign(F.vx); }
    F.grab = Math.max(0, F.grab - dt);
    /* hammer: held, standing under an open hole */
    const h = R.live && (G.hold || G.keyHold) && F.grab <= 0 ? open().find(o => Math.abs(o.x - F.x) < 2.4) : null;
    G.hamH = h;
    if (h) {
      h.prog = Math.min(1, h.prog + dt / (TUNE.hold * TUNE.sizeHold[h.size])); F.ham += dt;
      while (h.nails < Math.min(4, Math.floor(h.prog * 4 + 1e-6))) nail(h, h.nails++);
      if (h.prog >= 1) patched(h);
    } else F.ham = 0;
    for (const o of open()) if (o !== h) o.prog = Math.max(o.nails / 4, o.prog - dt * .5);        /* let go and the rain pushes the loose boards back */
    if (!R.live) return;
    if (TUNE.crack && !G.cracked && (G.sT >= TUNE.crackAt || !open().length)) crack();
    if ((!open().length && (!TUNE.crack || G.cracked)) || G.sT >= TUNE.p1max) toBail();
  }
  function updToBail(dt) {                                                      /* the fixer jumps down from the beam onto the crates */
    const F = G.fx; G.gT += dt; const k = clamp(G.gT / .7, 0, 1);
    F.x = lerp(F.x0, FIX_X, k); F.y = lerp(BEAM, CRATE_TOP, k) - Math.sin(k * Math.PI) * 24;
    if (k >= 1 && !F.landed) { F.landed = true; F.land = .22; sfx.thud(); sfx.noise(.1, .06, 500); R.shake(2); fx.puff(FIX_X, CRATE_TOP, '#c9b88a', 5); }
    if (G.gT >= TUNE.gap) { G.stage = 'bail'; G.sT = 0; F.y = CRATE_TOP; G.wl2 = G.wl; slam('BAIL!'); setHow('Hold to dunk on the <em>wave</em>, let go to heave', 'top'); }
  }
  function updBail(dt) {
    G.sT += dt; const p = clamp(G.sT / TUNE.p2dur, 0, 1), B = G.bk; G.rainK = lerp(.9, 1, p);
    if (R.live) G.wl += (TUNE.seep(p) + Math.min(holeFlow(), CAP * TUNE.leakMax)) * dt;   /* open holes still pour, but a good rhythm always gains on them */
    if (R.live && G.surgeI < TUNE.surgeAt.length && G.sT >= TUNE.surgeAt[G.surgeI]) { G.surgeI++; surge(); }
    B.cool = Math.max(0, B.cool - dt);
    if (B.s === 'drop' && (B.t += dt) >= .14) {
      B.s = 'in'; B.t = 0; const y = surfY(BX);
      fx.burst(BX, y, ['#d6f0ff', '#7ec8f0'], 5 + Math.round(B.fill * 7), 36, 160, .4); sfx.noise(.12, .06, 1400);
      if (B.perfect) { G.combo++; G.perfects++; G.bestCombo = Math.max(G.bestCombo, G.combo); fx.ring(BX, y, '#ffd23a', 12); sfx.ding(Math.min(6, G.combo)); ui.setCombo(G.combo, 1); if (G.combo >= 3) ui.pulseCombo(); }
      else { G.combo = 0; ui.setCombo(0, 1); }
    } else if (B.s === 'in') { B.t += dt; if (B.queued && B.t >= .05) heave(); }
    else if (B.s === 'heave' && (B.t += dt) >= .42) { B.s = 'up'; B.cool = B.perfect ? .08 : TUNE.slopCool; }   /* a slop sloshes back: the next crest may be gone */
    /* how dry: 1 at ankle depth, falling to nothing at the line */
    const q = 1 - clamp((G.wl - TUNE.dry) / (LINE - TUNE.dry), 0, 1);
    if (R.live) G.qSum += q * dt;
    const over = G.wl > LINE;
    if (over && !G.over && R.live && G.overSay <= 0 && TUNE.p2dur - G.sT > 2) { ui.say('OVER THE LINE!', 'bad'); sfx.typo(); G.overSay = 2.5; R.shake(1.5); }   /* (not so late it lands on stage 3's card) */
    G.over = over; G.overSay -= dt;
    if (R.live && G.sT >= TUNE.p2dur) toFish();
  }
  function updToFish(dt) {                                                      /* the last surge: water settles at wading depth, the cards wash in */
    G.gT += dt; const k = clamp(G.gT / .8, 0, 1); G.wl = lerp(G.l3from, G.l3, k * k * (3 - 2 * k)); G.rainK = lerp(1, .4, k);
    if (G.gT >= TUNE.gap) { G.stage = 'fish'; G.sT = 0; slam('FISH!'); setHow('<em>Tap</em> the word cards to net them · skip the junk', 'top'); }
  }
  function updFish(dt) {
    G.sT += dt; const N = G.net;
    if (R.live && G.queue.length && (G.spawnT -= dt) <= 0) { spawn(G.queue.shift()); G.spawnT = rng() < .22 ? .25 : G.every * rng(.85, 1.25); }   /* now and then two at once */
    for (const it of G.items) {
      if (it.s === 'rise' && (it.t += dt) >= .3) it.s = 'float';
      if (it.s === 'float' || it.s === 'rise') {
        it.x += it.vx * dt; const lo = 4 + it.w / 2, hi = W - 4 - it.w / 2;
        if (it.x < lo) { it.x = lo; it.vx = Math.abs(it.vx); } else if (it.x > hi) { it.x = hi; it.vx = -Math.abs(it.vx); }
        if (R.live && (it.life -= dt) <= 0) sink(it);
      }
      if (it.s === 'fly' || it.s === 'toss') airStep(it, dt);
      if (it.s === 'sink' && (it.t += dt) >= .6) it.s = 'gone';
      /* where it sits: riding the surface, lower as it soaks, a little bob */
      const soak = it.kind === 'card' && it.s === 'float' ? clamp(1.6 - it.life, 0, 1.6) * 1.6 : 0;
      if (it.s === 'float' || it.s === 'rise') it.y = surfY(it.x) - it.h * (it.kind === 'duck' ? .78 : .6) + Math.sin(R.t * 3 + it.bob) * .5 + soak + (it.s === 'rise' ? (1 - it.t / .3) * 5 : 0);
      if (it.s === 'sink') it.y += dt * 14;
    }
    G.items = G.items.filter(it => it.s !== 'gone' && it.s !== 'saved');
    const fl = G.items.filter(it => it.s === 'float');                          /* floating things bump off each other, so no card hides under another */
    for (let i = 0; i < fl.length; i++) for (let j = i + 1; j < fl.length; j++) {
      const [a, b] = fl[i].x < fl[j].x ? [fl[i], fl[j]] : [fl[j], fl[i]], ov = (a.w + b.w) / 2 - (b.x - a.x);
      if (ov <= 0) continue;
      if (a.vx > b.vx) [a.vx, b.vx] = [b.vx, a.vx];
      const p = Math.min(ov / 2, 12 * dt); a.x = Math.max(4 + a.w / 2, a.x - p); b.x = Math.min(W - 4 - b.w / 2, b.x + p);
    }
    /* the net: hover where the pointer is, swoop, dip, lift; cards and the duck fly to the desk, junk gets tossed back */
    N.stun = Math.max(0, N.stun - dt);
    const ax = R.live ? R.axisX() : 0; if (ax) G.netX = clamp(G.netX + ax * 80 * dt, 4, W - 4);
    if (N.s === 'idle') { N.x = lerp(N.x, G.netX, Math.min(1, dt * 14)); N.y = lerp(N.y, surfY(N.x) - 8, Math.min(1, dt * 12)); if (N.q && N.stun <= 0) { const [a, b, t] = N.q; N.q = null; if (R.t - t <= TUNE.qGrace) scoop(a, b); } }
    else if (N.s === 'go') { N.t += dt; if (afloat(N.tgt)) N.tx = clamp(N.tgt.x, 4, W - 4); const k = Math.min(1, N.t / N.dur); N.x = lerp(N.fx, N.tx, k); N.y = surfY(N.x) - 8; if (k >= 1) { N.s = 'dip'; N.t = 0; } }
    else if (N.s === 'dip') { N.t += dt; N.y = surfY(N.x) - 8 + Math.min(1, N.t / .1) * 9; if (N.t >= .1) { grab(); N.s = 'lift'; N.t = 0; } }
    else if (N.s === 'lift') {
      N.t += dt; N.y = surfY(N.x) + 1 - Math.min(1, N.t / .14) * 12;
      if (N.held) { N.held.x = N.x; N.held.y = N.y - N.held.h + 4; }
      if (N.t >= .14) {
        const it = N.held; N.held = null; N.s = 'idle';
        if (it && it.kind === 'junk') { it.s = 'toss'; it.t = 0; it.fx = it.x; it.fy = it.y; it.tx = clamp(it.x + (it.x < W / 2 ? 18 : -18), 10, W - 10); N.stun = TUNE.junkStun; G.junkHits++; sfx.typo(); ui.floatText(it.x, it.y - 4, 'BLEH! JUNK', 'bad'); }
        else if (it) toDesk(it);
      }
    }
    if (R.live && !G.queue.length && !G.items.some(it => it.kind === 'card' && it.s !== 'sink')) finale();
  }
  function updFin(dt) {
    G.finT += dt; G.rainK = Math.max(0, G.rainK - dt * 1.5);
    if (G.win) { G.sun = Math.min(1, G.sun + dt * 2); G.wl = Math.max(0, G.wl - dt * 26); }
    for (const it of G.items) if (it.s === 'float' || it.s === 'rise') { if (it.kind === 'duck' && G.win) continue; sink(it); }
    for (const it of G.items) if (it.kind === 'duck' && (it.s === 'float' || it.s === 'rise')) {   /* a missed duck rides the drain down and sits on the floor */
      const fy = FLOOR - it.h + .67, wy = FLOOR - G.wl - slosh(it.x) * clamp(G.wl / 4, 0, 1) - it.h * .78;
      if (wy < fy - 1) it.x = clamp(it.x + it.vx * dt * .5, 4 + it.w / 2, W - 4 - it.w / 2);
      it.y = Math.min(wy + Math.sin(R.t * 3 + it.bob) * .5 * clamp(G.wl / 4, 0, 1), fy);
    }
    for (const it of G.items) { if (it.s === 'sink' && (it.t += dt) >= .6) it.s = 'gone'; if (it.s === 'sink') it.y += dt * 14; if (it.s === 'fly') airStep(it, dt); }
    G.items = G.items.filter(it => it.s !== 'gone' && it.s !== 'saved');
    if (G.finT >= 1.4 && R.live) R.end();
  }
  function update(dt) {
    const F = G.fx;
    if (G.card) G.card.t += dt;
    if (!G.kick0) { G.kick0 = true; if (VERB.classList.contains('show')) replay(VERB.firstChild); }
    G.flash = Math.max(0, G.flash - dt); G.trayBump = Math.max(0, G.trayBump - dt); F.land = Math.max(0, F.land - dt); F.cheer = Math.max(0, F.cheer - dt);
    if (G.verbT > 0 && (G.verbT -= dt) <= 0) VERB.classList.remove('show');
    if (G.howT > 0 && (G.howT -= dt) <= 0) HOW.classList.remove('show');
    if (G.stage !== 'fin' && (G.boltT -= dt) <= 0) bolt(false);
    if ((G.hiss -= dt) <= 0) { G.hiss = .42; if (G.rainK > .05) sfx.noise(.5, .012 * G.rainK, 3200); }
    /* the slosh: gentle puddles while it pours, a full wave while bailing, calmer once the cards float */
    G.ph += dt * TAU / TUNE.period * (G.stage === 'fish' || G.stage === 'fin' ? .7 : 1);
    G.kick = Math.max(0, G.kick - dt * .7);
    const ampT = G.stage === 'patch' ? Math.min(1.5, G.wl * .15) : G.stage === 'fish' || G.stage === 'fin' || G.stage === 'toFish' ? TUNE.amp * .45 : TUNE.amp;
    G.amp = lerp(G.amp, ampT + G.kick, Math.min(1, dt * 2));
    for (const b of G.bumps) b.x -= 80 * dt; G.bumps = G.bumps.filter(b => b.x > -24);
    if (G.surgeQ > 0) { const d = Math.min(G.surgeQ, dt * 12); G.surgeQ -= d; G.wl += d; }
    if (G.stage === 'patch') updPatch(dt); else if (G.stage === 'toBail') updToBail(dt); else if (G.stage === 'bail') updBail(dt);
    else if (G.stage === 'toFish') updToFish(dt); else if (G.stage === 'fish') updFish(dt); else updFin(dt);
    G.wl = clamp(G.wl, 0, MAXL);
    for (const t of G.throws) {                                                 /* bailed water: each blob reaches the window at t = T */
      const t0 = t.t; t.t += dt; if (t.t < 0) continue;
      const k = Math.min(dt, t.t, t.T - t0); if (k > 0) { t.vy += t.gy * k; t.x += t.vx * k; t.y += t.vy * k; }
      if (t.t >= t.T) { t.dead = true; fx.burst(t.x, t.y, ['#d6f0ff', '#7ec8f0'], 2, 24, 120, .3); }
    }
    G.throws = G.throws.filter(t => !t.dead);
    if (R.live) { const s = Math.round(grade() * 100); if (s !== G.score) { G.score = s; ui.setScore(s); } }
  }

  /* ---------- 7. bot (?bot=1): plays like a person watching the room, through the same verbs, with reaction time, timing error and the odd
     fumble. Patch: the gushing-est hole it can reach. Bail: dunks timed to the ring (±.13 s, now and then badly off). Fish: the card closest to
     sinking (the duck when nothing's urgent), with aim error, now and then netting junk or missing. ---------- */
  function bot(dt) {
    const B = G.bot;
    if (G.stage === 'patch') {
      if (B.fumble > 0) { B.fumble -= dt; G.hold = false; if (B.fumble <= 0) G.hold = !!B.target; return; }
      if (B.target && B.target.done) { B.target = null; G.hold = false; B.react = rng(.25, .5) * B.skill; }
      if (B.target) { if (G.hamH === B.target && rng() < dt * .15 * B.skill) B.fumble = rng(.2, .4); return; }
      if ((B.react -= dt) > 0) return;
      const F = G.fx, list = open(); if (!list.length) return;
      B.target = list.reduce((b, h) => { const v = TUNE.flow[h.size] * 2 - Math.abs(h.x - F.x) / 40; return !b || v > b.v ? { h, v } : b; }, null).h;
      G.aimHole = B.target; G.hold = true;
    } else if (G.stage === 'bail') {
      const K2 = G.bk, T = TUNE.period, tc = (((Math.PI / 2 - G.ph) % TAU) + TAU) % TAU / (TAU / T), d = tc > T / 2 ? tc - T : tc;   /* signed seconds to the nearest crest */
      if (K2.s === 'up' && K2.cool <= 0) {
        if (B.err == null) B.err = rng() < .14 * B.skill ? (rng() < .5 ? -1 : 1) * rng(.16, .32) : rng(-.13, .13) * B.skill;
        if (d <= B.err && d > B.err - .08) { dunk(); B.err = null; B.rel = rng(.06, .2); }
      } else if (K2.s === 'in' && (B.rel -= dt) <= 0) heave();
    } else if (G.stage === 'fish') {
      const N = G.net; if (N.s !== 'idle' || N.stun > 0 || N.q) return;
      if ((B.react -= dt) > 0) return;
      const fl = G.items.filter(i => i.s === 'float'), cards = fl.filter(i => i.kind === 'card').sort((a, b) => a.life - b.life);
      let t = B.duck && fl.find(i => i.kind === 'duck');
      if (!t || (cards[0] && cards[0].life < 2)) t = cards[0] || t;
      if (rng() < .04) t = fl.find(i => i.kind === 'junk') || t;
      if (!t) return;
      const e = rng() < .06 ? (rng() < .5 ? -1 : 1) * rng(9, 13) : rng(-2.5, 2.5);
      scoop(t.x + t.vx * .12 + e, t.y + t.h / 2); B.react = rng(.32, .66) * B.skill;
    }
  }

  /* ---------- 8. draw: back to front. Units, 1/3-unit precision; st.hi() for hi-res sprites ---------- */
  const oval = (cx, cy, rx, ry, col) => {
    g.fillStyle = col; const n = Math.max(1, Math.round(ry * 3));
    for (let i = -n; i <= n; i++) { const yy = i / 3, w = rx * Math.sqrt(Math.max(0, 1 - (yy * yy) / (ry * ry))); if (w > 0) g.fillRect(r3(cx - w), r3(cy + yy), Math.round(w * 6) / 3, 1 / 3); }
  };
  const label = (str, x, y, col, s) => {                                        /* canvas text that also knows '/' */
    [...str].forEach((ch, n) => { const cx = x + n * 6 * s; if (ch !== '/') { text(g, ch, cx, y, col, s); return; } g.fillStyle = col; for (let i = 0; i < 35; i++) if (SLASH[i] === '1') g.fillRect(cx + (i % 5) * s, y + Math.floor(i / 5) * s, s, s); });
  };
  const line = (x0, y0, x1, y1, col, w) => { const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 3)); g.fillStyle = col; for (let i = 0; i <= n; i++) { const k = i / n; g.fillRect(r3(lerp(x0, x1, k) - w / 2), r3(lerp(y0, y1, k) - w / 2), w, w); } };
  function drawSky(now) {
    const fl = G.flash > 0, sun = G.sun > .5;
    g.fillStyle = sun ? '#7ec0f0' : fl ? '#e8f6ff' : '#5a86c0'; g.fillRect(0, 0, W, ROOF);                  /* seen through the roof holes: a lit storm sky */
    if (!sun && !fl) { g.fillStyle = '#8ab0dc'; for (let x = 0; x < W; x += 9) g.fillRect(x + ((x * 7) % 5), 10 + ((x * 3) % 6), 5, 2); g.fillStyle = '#36557f'; g.fillRect(0, 20, W, ROOF - 20); }
    g.fillStyle = sun ? '#7ec0f0' : fl ? '#c8ecff' : '#1d2b4a'; g.fillRect(WIN.x, WIN.y, WIN.w, WIN.h);
    if (sun) { g.fillStyle = '#bfe0ff'; g.fillRect(WIN.x, WIN.y + 20, WIN.w, WIN.h - 20); drawRainbow(); oval(WIN.x + 15, WIN.y + 9, 4, 4, '#fff08c'); oval(WIN.x + 15, WIN.y + 9, 2.67, 2.67, '#ffffff'); }
    else if (!fl) { g.fillStyle = '#263a60'; g.fillRect(WIN.x, WIN.y + 20, WIN.w, WIN.h - 20); }
    const hill = sun ? '#2f8a35' : fl ? '#5a7a8a' : '#10261e';
    for (const [cx, rr] of [[2, 6], [10, 8], [19, 6.5]]) oval(WIN.x + cx, WIN.y + WIN.h - 3, rr, rr * .9, hill);
    g.fillStyle = hill; g.fillRect(WIN.x, WIN.y + WIN.h - 3, WIN.w, 3);
    if (fl && G.boltPts) { g.save(); g.beginPath(); g.rect(WIN.x, WIN.y, WIN.w, WIN.h); g.clip(); const P = G.boltPts; for (let i = 1; i < P.length; i++) line(P[i - 1][0], P[i - 1][1], P[i][0], P[i][1], '#ffffff', 1); g.restore(); }
    if (G.rainK > .02) {
      g.fillStyle = fl ? '#ffffff' : `rgba(126,200,240,${(.3 + .4 * G.rainK).toFixed(2)})`; const n = Math.round(6 + 18 * G.rainK);
      for (let i = 0; i < n; i++) { const x = WIN.x + ((i * 37 + now * 9) % WIN.w), y = WIN.y + ((i * 53 + now * 150) % WIN.h); g.fillRect(r3(x), r3(y), 1 / 3, 2.67); }
      for (let i = 0; i < n; i++) { const x = (i * 41 + now * 11) % W, y = (i * 29 + now * 160) % ROOF; g.fillRect(r3(x), r3(y), 1 / 3, 2); }
    }
  }
  function drawRainbow() {                                                      /* after the storm: a rainbow in the window */
    const cx = WIN.x + 3, cy = WIN.y + WIN.h + 6, cols = ['#ff5a3c', '#ffb347', '#ffd23a', '#7be05a', '#5fa8f0', '#b58cf0'];
    g.globalAlpha = clamp(G.sun * 1.4 - .4, 0, 1);
    cols.forEach((c, i) => { const r = 30 - i; g.fillStyle = c; for (let x = WIN.x; x < WIN.x + WIN.w; x += 1 / 3) { const dx = x + 1 / 6 - cx; if (Math.abs(dx) >= r) continue; const y = r3(cy - Math.sqrt(r * r - dx * dx)); if (y >= WIN.y && y < WIN.y + WIN.h - 4) g.fillRect(r3(x), y, 1 / 3, 1); } });
    g.globalAlpha = 1;
  }
  function drawBeams() {                                                        /* sunlight slanting in from the window */
    g.fillStyle = `rgba(255,236,170,${(.09 * G.sun).toFixed(3)})`;
    for (const [o, w] of [[2, 7], [13, 5]]) for (let y = WIN.y + 2; y < FLOOR; y += 1) { const x = WIN.x + o + (y - WIN.y) * .85; g.fillRect(r3(x), y, w + (y - WIN.y) * .08, 1); }
  }
  function drawHoles(now) {
    const blink = Math.floor(now * 3) % 2;
    for (const h of G.holes) {
      if (h.done || h.prog > 0) {
        st.hi(PATCH, h.x - 10, HOLE_Y - 5.33);
        for (let i = 0; i < h.nails; i++) { const [dx, dy] = NAILS[i]; g.fillStyle = '#1a0f14'; g.fillRect(r3(h.x + dx) - .33, r3(HOLE_Y + dy) - .33, 1.33, 1.33); g.fillStyle = '#f0f0f8'; g.fillRect(r3(h.x + dx), r3(HOLE_Y + dy), .67, .67); }
      }
      if (h.done) continue;
      if (h.prog > 0) { g.fillStyle = '#1a0f14'; g.fillRect(r3(h.x - 7.33), ROOF + .67, 14.67, 2); g.fillStyle = '#ffd23a'; g.fillRect(r3(h.x - 7), ROOF + 1, r3(14 * h.prog), 1.33); }
      else if (G.stage === 'patch' && R.live && blink) {                        /* corner brackets: hold here */
        const [rx, ry] = HOLE_R[h.size], a = rx + 2.33, b = ry + 2; g.fillStyle = '#ffd23a';
        for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const x = r3(h.x + sx * a), y = r3(HOLE_Y + sy * b); g.fillRect(sx < 0 ? x : x - 2, y, 2, .67); g.fillRect(x - (sx < 0 ? 0 : .67), sy < 0 ? y : y - 1.33, .67, 2); }
      }
    }
  }
  const streamEnd = (x, now) => x > TW_X + 2 && x < W - 3 ? DESK_Y - 25 : x > 57 ? DESK_Y : surfY(x, now);   /* onto the machine, the desk or the water */
  function drawStreams(now) {                                                   /* rain pouring through the open holes */
    const fade = Math.min(1, G.rainK / .9); if (fade < .15) return;
    for (const h of open()) {
      const w = (1.6 + h.size * 1.3) * (1 - .6 * h.prog) * fade, x = h.x, y0 = HOLE_Y + 1, y1 = r3(streamEnd(x, now)), len = y1 - y0;
      for (let y = ROOF, i = 0; y < 100; y += 2, i++) { const sw = HOLE_R[h.size][0] * 1.6 + i * .5; g.fillStyle = 'rgba(191,224,255,.06)'; g.fillRect(r3(x - sw / 2), y, r3(sw), 2); }   /* grey storm light falls through */
      for (let y = y0, i = 0; y < y1; y += 2, i++) {                                                            /* the column of water, shimmering */
        const ox = (Math.floor(now * 14 + i) % 3 - 1) / 3, hgt = Math.min(2, y1 - y);
        g.fillStyle = 'rgba(126,200,240,.6)'; g.fillRect(r3(x - w / 2 + ox), y, r3(w), hgt);
        g.fillStyle = 'rgba(214,240,255,.8)'; g.fillRect(r3(x - w * .2 + ox), y, Math.max(1 / 3, r3(w * .4)), hgt);
      }
      oval(x, HOLE_Y + 1.5, w * .5 + 1.5, 1, 'rgba(214,240,255,.75)');                                         /* spilling over the edge */
      g.fillStyle = '#ffffff';
      for (let i = 0; i < 5 + h.size * 3; i++) { const sx = x - w / 2 + ((i * 1.37) % Math.max(.34, w)), sy = y0 + ((now * 170 + i * 23.7) % Math.max(1, len)); g.fillRect(r3(sx), r3(sy), 1 / 3, 3); }
      g.fillStyle = '#d6f0ff'; for (let i = 0; i < 3 + h.size * 2; i++) { const a = now * 9 + i * 2.1; g.fillRect(r3(x + Math.sin(a) * (1.5 + h.size * 1.4)), r3(y1 - 1 - Math.abs(Math.cos(a * 1.3)) * (2 + h.size)), .67, .67); }
      oval(x, y1, w * .9 + 1, .8, 'rgba(214,240,255,.6)');
    }
  }
  function drawLine(now) {                                                      /* the red line, loud while bailing */
    if (G.stage !== 'bail' && G.stage !== 'toBail') return;
    const over = G.wl > LINE, near = G.wl > LINE - 7, blink = Math.floor(now * 6) % 2;
    const col = over ? (blink ? '#ff5a3c' : '#fff6d6') : near ? (blink ? '#ff7a6a' : '#ffb347') : '#ff5a3c';
    for (let x = 0; x < W; x += 4) { g.fillStyle = '#1a0f14'; g.fillRect(x - .33, LINE_Y - .67, 2.67, 1.67); g.fillStyle = col; g.fillRect(x, LINE_Y - .33, 2, 1); }
    const t = 'MAX', tw = textW(t, 2 / 3); g.fillStyle = '#1a0f14'; g.fillRect(2, LINE_Y - 7.67, tw + 2, 6.33); text(g, t, 3, LINE_Y - 7, col, 2 / 3);
  }
  function drawTray(now) {
    const bump = G.trayBump > 0 ? -.67 : 0;
    for (let i = 0; i < Math.min(G.saved, 9); i++) { const cx = TRAY_X + 2.33 + (i % 3) * .67, cy = TRAY_Y - 1.33 - i * .67 + bump; g.fillStyle = '#1a0f14'; g.fillRect(cx - .33, cy - .33, 9.67, 3); g.fillStyle = i % 2 ? '#fff6d6' : '#ede0b8'; g.fillRect(cx, cy, 9, 2.33); g.fillStyle = '#e86a50'; g.fillRect(cx, cy + .67, 9, .33); }
    st.hi(TRAY, TRAY_X, TRAY_Y + bump);
    if (G.stage === 'fish' || G.stage === 'toFish' || (G.stage === 'fin' && G.saved)) {
      const t = `${G.saved}/${TUNE.cards}`, tw = textW(t, 2 / 3), tx = r3(TRAY_X + 7 - tw / 2), ty = TRAY_Y - 15;
      g.fillStyle = '#1a0f14'; g.fillRect(tx - 1, ty - 1, tw + 2, 6.67); label(t, tx, ty, G.saved === TUNE.cards ? '#7be05a' : '#ffd23a', 2 / 3);
    }
  }
  function drawItem(it, now) {
    const x = it.x - it.w / 2, y = it.y;
    if (it.s === 'sink') g.globalAlpha = Math.max(0, 1 - it.t / .6);
    st.hi(it.spr, x, y, it.kind === 'duck' && it.vx < 0);
    if (it.kind === 'card' && (it.s === 'float' || it.s === 'rise' || it.s === 'sink')) {   /* soaking through: it darkens, then blinks before it goes under */
      const k = clamp(1 - it.life / it.max, 0, 1), warn = it.life < 1.6 && Math.floor(now * 8) % 2;
      g.fillStyle = warn ? 'rgba(255,90,60,.35)' : `rgba(30,60,110,${(.45 * k).toFixed(2)})`; g.fillRect(r3(x) + .67, r3(y) + .67, r3(it.w) - 1.33, r3(it.h) - 1.33);
      if (it.life < 1.6 && it.s === 'float' && MG.rng() < .2) fx.puff(it.x + MG.rng(-4, 4), surfY(it.x) - .5, '#d6f0ff', 1);
    }
    g.globalAlpha = 1;
  }
  function drawRing(now) {                                                      /* the approach ring closes on a target as the wave crests under the bucket; gold = dunk now */
    if (G.stage !== 'bail' || !R.live || G.bk.s !== 'up' || G.bk.cool > 0) return;
    const T = TUNE.period, tc = (((Math.PI / 2 - G.ph) % TAU) + TAU) % TAU / (TAU / T), win = .55 * T, hot = crest() >= TUNE.perf;
    if (!hot && tc > win) return;
    const cx = BX, cy = surfY(BX) - 1.5, r = hot ? 3.67 : 3.67 + (tc / win) * 10;
    const dots = (rr, n, col, s) => { for (let i = 0; i < n; i++) { const a = i / n * TAU, x = r3(cx + Math.cos(a) * rr), y = r3(cy + Math.sin(a) * rr * .5); g.fillStyle = '#1a0f14'; g.fillRect(x - .33, y - .33, s + .67, s + .67); g.fillStyle = col; g.fillRect(x, y, s, s); } };
    if (!hot) dots(3.67, 12, '#c98f0e', .67);
    dots(r, 32, hot ? '#ffd23a' : '#d6f0ff', 1);
    if (hot) { const t = 'NOW!', tw = textW(t, 2 / 3), tx = r3(cx - tw / 2); g.fillStyle = '#1a0f14'; g.fillRect(tx - 1, cy - 14, tw + 2, 6.67); text(g, t, tx, cy - 13.33, '#ffd23a', 2 / 3); }
  }
  function drawBucket(now) {
    const B = G.bk, hx = FIX_X - 5, hy = CRATE_TOP - 9;
    let bx = BX, by, tipped = false;
    if (B.s === 'up') by = CRATE_TOP + 1.33 + Math.sin(now * 3) * .33;
    else if (B.s === 'drop') by = lerp(CRATE_TOP + 1.33, surfY(BX) - 6, Math.min(1, B.t / .14));
    else if (B.s === 'in') by = surfY(BX) - 6 + Math.sin(now * 8) * .33;
    else { const k = Math.min(1, B.t / .16); by = lerp(surfY(BX) - 6, CRATE_TOP - 24, k); bx = lerp(BX, BX - 3, k); tipped = B.t > .16; }
    line(hx, hy, bx, by + 1, '#1a0f14', 1); line(hx, hy, bx, by + 1, '#d8b878', 1 / 3);
    if (tipped) { st.hi(TIPPED, bx - 9, by - 2); return; }
    st.hi(BUCKET, bx - 8, by);
    if (B.s === 'in' || (B.s === 'heave' && !tipped)) { const k = B.fill; oval(bx, by + 2.87 + (1 - k) * .67, 1.6 + 4.6 * Math.sqrt(k), .5 + k, '#3a8ec8'); oval(bx - .67, by + 2.54 + (1 - k) * .67, .8 + 2.6 * Math.sqrt(k), .33 + .5 * k, '#7ec8f0'); }
  }
  function drawNet(now) {
    const N = G.net, hx = FIX_X + 5, hy = CRATE_TOP - 10;
    line(hx, hy, N.x, N.y - .5, '#1a0f14', 1.33); line(hx, hy, N.x, N.y - .5, '#c08a4a', .67);
    st.hi(NET, N.x - 6, N.y - 2);
  }
  function drawFixer(now) {
    const F = G.fx, S = G.stage, done = R.done || S === 'fin';
    if (S === 'patch' || (S === 'fin' && F.y < CRATE_TOP - 1)) {
      oval(F.x, BEAM + .33, 5.5, 1, 'rgba(10,6,4,.5)');
      const pose = done ? (R.won || G.win ? 'cheer' : 'scared') : G.hamH ? (Math.floor(F.ham * 9) % 2 ? 'holdhit' : 'hold0') : Math.abs(F.vx) > 8 ? (Math.floor(F.walk / 5) % 2 ? 'hold1' : 'hold2') : 'hold0';
      R.crew(F.x, BEAM, pose, { flip: F.face < 0 });
      if (!done && !G.hamH && F.grab <= 0) st.hi(PATCH, F.x - 10, BEAM - 12.33 - 10 + (pose === 'hold0' ? 0 : -.33));
      return;
    }
    if (S === 'toBail') { const k = G.gT / .7; R.crew(F.x, F.y, k < .45 ? 'air' : k < 1 ? 'fall' : 'squish', { flip: F.x0 > FIX_X }); return; }
    oval(FIX_X, CRATE_TOP + .33, 5.5, 1, 'rgba(10,6,4,.45)');
    if (done) { R.crew(FIX_X, CRATE_TOP, R.won || G.win ? 'cheer' : 'scared', { flip: false }); return; }
    if (F.land > 0) { R.crew(FIX_X, CRATE_TOP, 'squish', { flip: true }); return; }
    if (S === 'bail') {
      const B = G.bk, pose = B.s === 'heave' ? (B.t < .16 ? 'launch' : 'carry') : B.s === 'up' ? 'carry' : 'holdhit';
      R.crew(FIX_X, CRATE_TOP, pose, { flip: true, expr: G.wl > LINE - 4 ? 'screech' : undefined });
    } else {
      const N = G.net, pose = F.cheer > 0 ? 'cheer' : N.s === 'dip' || N.s === 'lift' ? 'holdhit' : 'carry';
      R.crew(FIX_X, CRATE_TOP, pose, { flip: N.x < FIX_X - 4 });
    }
  }
  function drawWater(now) {
    if (G.wl < .05 && !G.bumps.length) return;
    for (let x = 0; x < W; x++) {
      const y = r3(surfY(x + .5, now)); if (y >= H) continue;
      g.fillStyle = 'rgba(46,120,190,.42)'; g.fillRect(x, y, 1, H - y);
      if (H - y > 6) { g.fillStyle = 'rgba(20,60,110,.35)'; g.fillRect(x, y + 5, 1, H - y - 5); }
      g.fillStyle = 'rgba(154,214,246,.9)'; g.fillRect(x, y, 1, .67);
    }
    g.fillStyle = '#ffffff';                                                    /* foam glints riding the crests */
    for (let i = 0; i < 9; i++) { const x = (i * 13.7 + now * (4 + i % 3)) % W, y = surfY(x, now); if (Math.sin(now * 5 + i) > .2) g.fillRect(r3(x), r3(y) - .33, 1.33, 1 / 3); }
    if (G.stage === 'fin' && G.win && G.wl > .3) {                              /* a whirlpool by the desk: the flood drains away */
      const sy = surfY(88, now) + 1;
      for (let i = 0; i < 16; i++) { const a = now * 9 + i * .55, rr = i * .45; g.fillStyle = i % 2 ? '#ffffff' : '#9ad6f6'; g.fillRect(r3(88 + Math.cos(a) * rr), r3(sy + Math.sin(a) * rr * .35), .67, .67); }
    }
  }
  const BANNER = [['PATCH THE ROOF', HAMMER], ['BAIL IT OUT', PAIL], ['FISH THE CARDS', CARD_ICON], ['STORM PASSED!', SUN]], BAN_Y = 52, BAN_H = 21;
  function drawBanner() {                                                       /* the stage card: slides in, holds, slides out (steps, no blur) */
    const C = G.card; if (!C || C.t < 0 || C.t >= C.d || (C.i === 3 && R.done)) return;
    const t = C.t, a = t < .2 ? 1 - t / .2 : t > C.d - .2 ? -(t - C.d + .2) / .2 : 0, ox = Math.round(a * Math.abs(a) * W), y = C.i % 2 ? ROOF : BAN_Y, [name, icon] = BANNER[C.i];   /* stage 2's rides the beam (the fixer's jump is below it), the last one too (the window shows the rainbow) */
    g.fillStyle = '#1a0f14'; g.fillRect(ox, y - 1, W, BAN_H + 2);
    g.fillStyle = '#14402b'; g.fillRect(ox, y, W, BAN_H); g.fillStyle = '#2f6a44'; g.fillRect(ox, y, W, .67);
    g.fillStyle = R.deskColour; g.fillRect(ox, y + 1.67, W, .67); g.fillRect(ox, y + BAN_H - 2.33, W, .67);
    g.fillStyle = '#1a0f14'; g.fillRect(ox + 6, y + 4.33, 12.67, 12.67); g.fillStyle = '#2f6a44'; g.fillRect(ox + 6.67, y + 5, 11.33, 11.33);
    st.hi(icon, ox + 8.33, y + 6.67);
    label(C.i < 3 ? `STAGE ${C.i + 1}/3` : C.win ? 'ALL CLEAR' : 'STILL SOGGY...', ox + 22, y + 4, '#9be8a0', 2 / 3);
    text(g, name, ox + 22.67, y + 11, '#1a0f14', 1); text(g, name, ox + 22, y + 10.33, C.i === 3 && !C.win ? '#c9d6e0' : '#ffd23a', 1);
  }
  function drawPips(now) {                                                      /* the three stages, top right: done ones ticked, the live one bobbing */
    const k = { patch: 0, toBail: 1, bail: 1, toFish: 2, fish: 2, fin: 3 }[G.stage];
    for (let i = 0; i < 3; i++) {
      const x = 91 + i * 9.33, y = 4.67, on = i === k, done = i < k, bob = on ? -Math.round(Math.abs(Math.sin(now * 4)) * 2) / 3 : 0;
      g.fillStyle = '#1a0f14'; g.fillRect(x - .33, y - .33 + bob, 8.67, 8.67); g.fillStyle = on ? '#2f6a44' : done ? '#22442e' : '#2a170b'; g.fillRect(x, y + bob, 8, 8);
      g.globalAlpha = on ? 1 : done ? .7 : .3; st.hi(ICONS[i], x, y + bob); g.globalAlpha = 1;
      if (done) { g.fillStyle = '#1a0f14'; g.fillRect(x + 3.67, y + 4, 4.67, 3.67); g.fillStyle = '#7be05a'; g.fillRect(x + 4, y + 5.67, 1, 1); g.fillRect(x + 5, y + 6.33, 1, 1); g.fillRect(x + 6, y + 5, 1, 1); g.fillRect(x + 7, y + 4.33, .67, 1); }
    }
  }
  function draw() {
    const now = R.t;
    drawSky(now);
    st.hi(ROOM, 0, 0);
    if (ROOFC) st.hi(ROOFC, 0, 0);
    drawHoles(now); drawStreams(now); drawLine(now);
    const lx = 98 + Math.sin(now * 1.3) * 1.2 + (G.flash > 0 ? .33 : 0), ly = 55;
    line(98, BEAM + 4.33, lx, ly, '#1a0f14', .67);
    if (G.flash <= 0 && G.sun < .5) oval(lx, ly + 10, 12, 4, 'rgba(255,226,138,.07)');
    st.hi(LAMP, lx - 6, ly);
    st.hi(TYPEWRITER, TW_X, DESK_Y - 33);
    drawTray(now);
    for (const it of G.items) if (it.s === 'float' || it.s === 'rise' || it.s === 'sink') drawItem(it, now);
    drawFixer(now);
    if (G.stage === 'bail' || (G.stage === 'toFish' && G.gT < .3)) drawBucket(now);
    if (G.stage === 'fish' || G.stage === 'toFish' && G.gT >= .3) drawNet(now);
    drawWater(now);
    for (const it of G.items) if (it.s === 'net' || it.s === 'fly' || it.s === 'toss') drawItem(it, now);   /* in the air: netted, flying to the desk, tossed back */
    if (G.duck) st.hi(DUCK, DUCK_SPOT[0], DUCK_SPOT[1] - (Math.floor(now * 3) % 2) / 3);                    /* rescued: it sits on the machine */
    for (const t of G.throws) if (t.t >= 0) st.hi(BLOB, t.x - BLOB.cx, t.y - BLOB.cy);
    fx.draw(g);
    drawRing(now); drawPips(now);
    if (G.flash > .08) { g.fillStyle = 'rgba(200,236,255,.12)'; g.fillRect(0, 0, W, H); }
    if (G.sun > 0) { drawBeams(); g.fillStyle = `rgba(255,214,120,${(.1 * G.sun).toFixed(2)})`; g.fillRect(0, 0, W, H); }
    drawBanner();
  }

  /* ---------- 9. input + run ---------- */
  window.FLOOD = { get G() { return G; }, TUNE, grade, s1, s2, s3, dryness, rhythm };   /* debug handle */
  const HOLD_KEYS = [' ', 'arrowup', 'arrowdown', 'w', 's'];
  R.run({
    reset, update, draw, grade, stats, bot,
    ended(res) {                                                                /* the whistle: whatever stage it is, the storm moves on */
      if (G.stage !== 'fin') finale();
      G.win = res.grade >= MG.VERDICT_AT.fixed; G.hold = G.keyHold = false; G.bk.s = G.bk.s === 'in' || G.bk.s === 'drop' ? 'up' : G.bk.s;
    },
    down(x, y, ev) {
      if (G.stage === 'patch') pressHole(x);
      else if (G.stage === 'bail') dunk();
      else if (G.stage === 'fish') { G.netX = clamp(x, 4, W - 4); scoop(x, y); }
    },
    move(x, y, ev) {
      if (G.stage === 'patch' && R.ptr.down && G.hold) { const h = nearestOpen(x); if (h) G.aimHole = h; }
      else if (G.stage === 'bail' && R.ptr.down && R.ptr.sy - y > 10) heave();
      else if (G.stage === 'fish' && (ev.pointerType === 'mouse' || R.ptr.down)) G.netX = clamp(x, 4, W - 4);
    },
    up() { G.hold = false; if (R.live && G.stage === 'bail') heave(); },
    key(ev, k) {
      if (ev.repeat) return;
      if (G.stage === 'patch' && HOLD_KEYS.includes(k)) G.keyHold = true;
      else if (G.stage === 'bail') { if (k === ' ' || k === 'arrowdown' || k === 's') dunk(); else if (k === 'arrowup' || k === 'w') heave(); }
      else if (G.stage === 'fish' && HOLD_KEYS.includes(k)) scoop(G.netX, null);
    },
    keyup(ev, k) {
      if (!G) return;
      if (HOLD_KEYS.includes(k)) G.keyHold = false;
      if (R.live && G.stage === 'bail' && (k === ' ' || k === 'arrowdown' || k === 's')) heave();
    },
  });
})();
