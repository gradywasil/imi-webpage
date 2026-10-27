/* ============================================================
   LIGHTNING BLEW THE FUSES (repair "fuses", verb LIGHT, 40 s): a long repair, the rare big one.
   A bolt kills the power and the fuse room goes black. The fixer, seen from above in a hardhat, finds the way through a maze of
   fuse cabinets by headlamp alone (the cone aims at the pointer) to every tripped breaker, blinking red in the dark, and flips it
   by walking into it. Each one brings the lights back to its part of the room and to some of the Floor's six desks (the strip on
   top). Live wires hang across some passages: they crackle, then arc; get caught in an arc and the fixer is zapped back, stunned,
   lamp flickering. Lightning now and then lights the whole maze for a blink: a glimpse of the way.
   Grade = .75 * breakers flipped / all + .25 * speed (time left when the last one flips; full with 60% (L0) to 45% (L1) of the clock left) - .06 per zap.
   Level: 4-6 breakers, 2-5 live wires that cycle faster with longer arcs, fewer loops in the maze, a shorter, narrower cone, darker dark.
   Controls: the fixer walks toward the mouse and the lamp aims at it · touch: drag, the fixer walks to a point just above the finger
   (so the finger never hides it), or tap a spot to walk there · arrows / WASD. The fixer wears the crew member's fur (look=); a full fix
   ends on the crew member cheering in their own look and hat. Miner costume (look v09): a longer, wider headlamp.
   Reduced motion (?reduce / ?low / the OS setting): no strobes, a steady dim lamp when zapped, softer flashes. ?low=1 also halves the light-map work.
   Layout of this file (as leak.js): 1 sprites · 2 setup · 3 tuning · 4 state · 5 verbs · 6 update · 7 bot · 8 draw · 9 run.
   ============================================================ */
(() => {
  'use strict';
  const { clamp, lerp, sfx } = MG;
  const { R: AR, shapes: { ell, box, cap, poly, and, or, sub } } = MGArt, { make, hl, cvs } = MGArt3;
  const TAU = Math.PI * 2, wrap = a => a - TAU * Math.floor((a + Math.PI) / TAU);
  const DR = MGRepair.deskR(MGRepair.params.desk);                              /* the problem desk's ramp: the breaker boxes wear it */

  /* ---------- 1. sprites (hi-res: 3 px per unit, draw with st.hi) ---------- */
  /* the fixer from above: tail, feet, back, arms, ears, snout, then the hardhat and its lamp on top. Shapes are sampled in a frame rotated
     to each of 16 headings (+x = forward), so every heading is painted crisp with the kit's outline and top-left light. Frames: 0 stand,
     1-2 walk, 4 zapped (arms flung out). Built on first use. */
  const MK = 51, DIRS = 16, MSPR = new Map();
  /* the crew member's own fur and skin (IMI passes look=): their ramps join MGArt's table (append-only), as the kit's desk ramps do */
  const LOOK = window.CrewArt && CrewArt.getVariant ? CrewArt.getVariant(MGCrew.look()) : null;
  const ramp = (k, cs) => { if (MGArt.R[k] == null) { MGArt.R[k] = MGArt.ramps.length; MGArt.ramps.push(cs.map(MGArt.hex)); } return MGArt.R[k]; };
  const FUR = LOOK ? ramp('fusesFur', [LOOK.fur.dark, LOOK.fur.mid, LOOK.fur.light]) : AR.fur, FURD = LOOK ? ramp('fusesFurD', [LOOK.fur.shadow, LOOK.fur.base, LOOK.fur.mid]) : AR.furD;
  const SKIN = LOOK ? ramp('fusesSkin', [LOOK.skin.mid, LOOK.skin.light, LOOK.skin.hi]) : AR.skin;
  function monkeySpr(f, d) {
    const key = f * DIRS + d; if (MSPR.has(key)) return MSPR.get(key);
    const a = d / DIRS * TAU, c = Math.cos(a), s = Math.sin(a), o = MK / 2, Z = 1.38;
    const L = t => (x, y) => { const dx = (x - o) / Z, dy = (y - o) / Z; return t(dx * c + dy * s, -dx * s + dy * c); };
    const sw = f === 1 ? 1 : f === 2 ? -1 : 0, out = f === 4;
    const cv = make(MK, MK, px => {
      px.shape(L(or(cap(-8, 1.5, -12.5, 5.5, 1.8), cap(-12.5, 5.5, -15.5, 1.5, 1.6))), FURD, 1);
      px.shape(L(or(ell(-3 + sw * 4.5, -4.2, 2.6, 2.1), ell(-3 - sw * 4.5, 4.2, 2.6, 2.1))), SKIN, 2);
      px.shape(L(ell(-3, 0, 6.8, 7.4)), FUR, 3);
      if (out) { const y = 11.5, x = 0; px.shape(L(or(ell(x, -y, 2.5, 3.4), ell(x, y, 2.5, 3.4))), FUR, 4); px.shape(L(or(ell(x + 1.5, -y - 2.6, 2, 2), ell(x + 1.5, y + 2.6, 2, 2))), SKIN, 5); }
      else { px.shape(L(or(ell(1 - sw * 3, -8.3, 3.6, 2.4), ell(1 + sw * 3, 8.3, 3.6, 2.4))), FUR, 4); px.shape(L(or(ell(4.2 - sw * 3, -8.5, 1.9, 1.9), ell(4.2 + sw * 3, 8.5, 1.9, 1.9))), SKIN, 5); }
      px.shape(L(or(ell(1.2, -6.6, 2.2, 2.4), ell(1.2, 6.6, 2.2, 2.4), ell(9.4, 0, 2.5, 3.2))), SKIN, 6);   /* ears + snout peek out under the brim */
      px.shape(L(ell(2.6, 0, 7, 7)), AR.banY, 7);                                 /* hardhat brim */
      px.shape(L(ell(2, 0, 4.9, 5.1)), AR.banY, 8);                               /* dome */
      px.shape(L(ell(7.9, 0, 1.9, 2.4)), AR.gold, 9);                             /* the headlamp */
    });
    MSPR.set(key, cv); return cv;
  }
  /* the score icon: a light bulb (lights restored) */
  const BULB = make(24, 30, px => {
    px.shape(or(ell(12, 11, 10, 10), poly([[5, 15], [19, 15], [16.5, 22], [7.5, 22]])), AR.star, 1);
    px.shape(or(cap(9.5, 16, 11, 8.5, .8), cap(14.5, 16, 13, 8.5, .8)), AR.pine, 2);
    px.shape(box(7, 21, 10, 7), AR.metal, 3); px.shape(or(box(7, 23, 10, 1), box(7, 26, 10, 1)), AR.metal, 4); px.shape(box(10, 27, 4, 3), AR.ink, 5);
    hl(px, 6, 5, 3, 5, 2);
  });
  /* a breaker box on a wall, painted for each wall it can hang on. N frame: the wall along the top edge, the box reaching down into the cell;
     the lever sits on the red OFF end when tripped, on the green ON end once flipped. */
  const ORI = { N: (w, h) => (X, Y) => [X, Y], S: (w, h) => (X, Y) => [w - X, h - Y], W: (w, h) => (X, Y) => [Y, X], E: (w, h) => (X, Y) => [Y, h - X] };
  const oriented = (side, w, h, paint) => { const m = ORI[side](w, h), T = f => (X, Y) => f(...m(X, Y)), v = side === 'N' || side === 'S'; return make(v ? w : h, v ? h : w, px => paint(px, T)); };
  const BW = 33, BH = 22;                                                         /* 11 x 7.33 units */
  const breakerSpr = (side, on) => oriented(side, BW, BH, (px, T) => {
    px.shape(T(box(0, 0, BW, BH - 1)), DR, 1);
    px.shape(T(box(4, 2, BW - 8, 10)), AR.ink, 2);                               /* the lever slot */
    px.shape(T(box(2, 15, 21, 5)), on ? AR.leaf : AR.red, 3);                     /* a tag: red while tripped, green once on */
    px.shape(T(on ? box(BW - 16, 1, 11, 12) : box(5, 1, 11, 12)), AR.metal, 4);  /* the lever, thrown to OFF or ON */
    px.shape(T(on ? ell(BW - 10.5, 7, 4, 4) : ell(10.5, 7, 4, 4)), on ? AR.metal : AR.red, 5);
  });
  const BRK = { off: {}, on: {} }; for (const s of 'NSWE') { BRK.off[s] = breakerSpr(s, false); BRK.on[s] = breakerSpr(s, true); }
  /* the Floor strip: a green banker's lamp over each of the six machines, each in its desk colour */
  const SHADE = make(21, 10, px => { px.shape(and(ell(10.5, 10, 10, 9), box(0, 0, 21, 8)), AR.leaf, 1); px.shape(box(0, 7, 21, 2.5), AR.gold, 2); px.shape(box(8.5, 0, 4, 2), AR.gold, 3); });
  const TWS = [0, 1, 2, 3, 4, 5].map(i => make(30, 21, px => {
    px.shape(box(9, 0, 12, 8), AR.paper, 1);
    px.shape(cap(4, 8.5, 26, 8.5, 2.3), AR.ink, 2);
    px.shape(or(poly([[5, 10], [25, 10], [29, 20], [1, 20]]), ell(15, 11, 10, 2.5)), MGRepair.deskR(i), 3);
    for (let k = 0; k < 5; k++) px.shape(ell(7.5 + k * 3.75, 14, 1.3, 1.1), AR.paper, 4);
    for (let k = 0; k < 6; k++) px.shape(ell(5.5 + k * 3.8, 17.4, 1.3, 1.1), AR.paper, 4);
  }));
  /* junk on the fuse-room floor, for the lamp to find */
  const PROPS = [
    make(18, 15, px => { px.shape(or(ell(9, 8, 3, 3), cap(9, 8, 2.5, 3, 2), cap(9, 8, 16, 3.5, 2), cap(9, 8, 10.5, 13.5, 2)), AR.banY, 1); px.shape(ell(9, 8, 1.6, 1.6), AR.stem, 2); }),
    make(18, 18, px => { px.shape(or(sub(ell(9, 9, 8, 7), ell(9, 9, 4.6, 3.8)), cap(15, 12.5, 17.5, 17, 1.2)), AR.ink, 1); }),
    make(18, 18, px => { px.shape(ell(9, 9, 8, 8), AR.metal, 1); px.shape(ell(9, 9.5, 5.6, 5.4), AR.drop, 2); px.shape(cap(3, 4, 16, 2, .9), AR.woodL, 3); }),
    make(15, 18, px => { px.shape(box(1, 1, 13, 16), AR.paper, 1); for (let y = 4; y < 15; y += 3) px.shape(box(3, y, 8, 1), AR.ink, 2); }),
    make(15, 15, px => { px.shape(ell(7.5, 7.5, 6.5, 6.5), AR.coco, 1); px.shape(or(ell(5.5, 8.5, 1, 1), ell(9.2, 8.5, 1, 1), ell(7.3, 11, 1, 1)), AR.ink, 2); }),
    make(18, 18, px => { px.shape(box(1, 1, 16, 16), AR.wood, 1); px.shape(or(cap(3.5, 3.5, 14.5, 14.5, 1.2), cap(14.5, 3.5, 3.5, 14.5, 1.2)), AR.woodD, 2); }),
  ];

  /* ---------- 2. setup: stage, HUD, timer, shell, VERB slam ---------- */
  const R = MGRepair.setup({
    id: 'fuses', verb: 'LIGHT', scoreIcon: BULB, howAt: 0, cursor: 'crosshair',  /* the hint sits over the Floor strip, clear of the top row's breakers */
    how: 'Steer your <em>headlamp</em> to each blinking breaker · dodge the sparks',
    legend: [[BULB, 'flip every <em>breaker</em>'], [BRK.off.N, 'tripped ones blink <em>red</em>']],
    hint: 'mouse · tap / drag · arrow keys',
  });
  const { st, g, W, H, ui, fx, rng, level: LV } = R;
  const MINER = MGCrew.look() === 'v09';
  const LOW = /[?&]low=1/.test(location.search);                                  /* low power: the light map is rebuilt every 2nd step */
  const CALM = LOW || /[?&]reduce=1/.test(location.search) || !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;   /* no strobes: softer flashes, steady lamps */
  const FINGER = 16;                                                              /* touch: the fixer walks to a point this far above the finger */

  /* the room: 6 x 7 cells of 20 units under a 20-unit strip of the Floor; walls are 4 units thick, centred on the cell edges */
  const HEAD = 20, CS = 20, COLS = 6, ROWS = 7, NC = COLS * ROWS, WT = 2, Y0 = HEAD - WT;
  const ccx = i => (i % COLS) * CS + CS / 2, ccy = i => HEAD + Math.floor(i / COLS) * CS + CS / 2;
  const cellAt = (x, y) => clamp(Math.floor(x / CS), 0, COLS - 1) + clamp(Math.floor((y - HEAD) / CS), 0, ROWS - 1) * COLS;
  const SLOT = i => 42 + i * 14;                                                  /* x of desk i in the Floor strip */
  const HDR = cvs(W * 3, HEAD * 3, x => {
    x.scale(3, 3); const r = (c, a, b, w, hh) => { x.fillStyle = c; x.fillRect(a, b, w, hh); };
    r('#12402a', 0, 0, W, HEAD); for (let sx = 0; sx < W; sx += 8) r('#0f3824', sx, 0, 4, HEAD);
    r('#1a0f14', 0, 14.33, W, .67); r('#8a5a2b', 0, 15, W, 3); r('#b57d3e', 0, 15, W, .67); r('#5a3517', 0, 17, W, 1);
    for (let i = 0; i < 6; i++) r('#1a0f14', SLOT(i) - .17, 0, .33, 3);
  });

  /* ---------- 3. tuning: one place for every number the level (0..1) and progress (0..1 over the run) move ---------- */
  const TUNE = {
    n: 4 + Math.round(LV * 2),                                                    /* breakers: 4..6 */
    wires: 2 + Math.round(LV * 3),                                                /* live wires across passages: 2..5 */
    braid: lerp(.45, .15, LV),                                                     /* share of side dead ends opened into loops (kinder in the dark) */
    tour: lerp(36, 44, LV),                                                       /* target length, in cells, of the nearest-first breaker tour */
    fast: lerp(.6, .45, LV),                                                      /* share of the clock left at the last flip for the full speed bonus (the longer L1 tour gets slack) */
    period: p => lerp(3, 2.3, LV) * lerp(1, .88, p),                              /* seconds per spark cycle: quiet, crackle, arc */
    warn: .5, arc: lerp(.5, .72, LV),                                             /* the crackle warns; only the arc zaps */
    cone: lerp(50, 42, LV) * (MINER ? 1.2 : 1), half: lerp(.62, .5, LV) * (MINER ? 1.12 : 1), near: 12,   /* headlamp reach, half-angle, glow around the fixer */
    dark: lerp(.93, .97, LV),                                                      /* how black the dark is */
    bolt: () => lerp(7, 10, LV) * rng(.8, 1.25),                                  /* seconds between lightning glimpses */
    speed: 32, r: 4.2,                                                            /* fixer top speed (units/s) and body radius */
  };

  /* ---------- 4. state ---------- */
  /* the maze: E[i] / S[i] = a wall on the east / south side of cell i. Carved as a recursive backtracker, then the breakers go into far-apart
     dead ends, then some other dead ends are opened into loops. Several tries; the one whose nearest-first tour is closest to TUNE.tour wins. */
  const isOpen = (M, i, j) => j === i + 1 ? !M.E[i] : j === i - 1 ? !M.E[j] : j === i + COLS ? !M.S[i] : j === i - COLS ? !M.S[j] : false;
  const openWall = (M, i, j) => { if (j === i + 1) M.E[i] = 0; else if (j === i - 1) M.E[j] = 0; else if (j === i + COLS) M.S[i] = 0; else M.S[j] = 0; };
  const around = i => { const c = i % COLS, out = []; if (c > 0) out.push(i - 1); if (c < COLS - 1) out.push(i + 1); if (i >= COLS) out.push(i - COLS); if (i + COLS < NC) out.push(i + COLS); return out; };
  const nbrs = (M, i) => around(i).filter(j => isOpen(M, i, j));
  function bfs(src, pass) { const d = new Int16Array(NC).fill(-1), par = new Int16Array(NC).fill(-1), q = [src]; d[src] = 0; for (let k = 0; k < q.length; k++) { const i = q[k]; for (const j of pass(i)) if (d[j] < 0) { d[j] = d[i] + 1; par[j] = i; q.push(j); } } return { d, par }; }
  const pathTo = (par, j) => { const p = []; for (let k = j; k >= 0; k = par[k]) p.push(k); return p.reverse(); };
  function carve(start) {
    const M = { E: new Uint8Array(NC).fill(1), S: new Uint8Array(NC).fill(1) }, seen = new Uint8Array(NC), stack = [start]; seen[start] = 1;
    while (stack.length) {
      const i = stack[stack.length - 1], nb = around(i).filter(j => !seen[j]);
      if (!nb.length) { stack.pop(); continue; }
      const j = nb[Math.floor(rng(nb.length))]; openWall(M, i, j); seen[j] = 1; stack.push(j);
    }
    return M;
  }
  function layout() {
    let best = null;
    for (let tries = 0; tries < 14; tries++) {
      const start = (ROWS - 1) * COLS + 2 + Math.floor(rng(2)), M = carve(start), pass = i => nbrs(M, i), dS = bfs(start, pass).d;
      const pick = [], dists = [dS], far = i => Math.min(...dists.map(d => d[i]));
      let cand = []; for (let i = 0; i < NC; i++) if (dS[i] > 2 && nbrs(M, i).length <= 2) cand.push(i);
      while (pick.length < TUNE.n && cand.length) {                               /* far from the start and from each other; dead ends first */
        const i = cand.map(j => [j, far(j) + (nbrs(M, j).length === 1 ? 3 : 0) + rng(2.5)]).sort((a, b) => b[1] - a[1])[0][0];
        pick.push(i); dists.push(bfs(i, pass).d); cand = cand.filter(j => j !== i && far(j) >= 2);
      }
      if (pick.length < TUNE.n) continue;
      for (let i = 0; i < NC; i++) {                                              /* braid: loops make the dark kinder (never into a breaker's nook) */
        if (pick.includes(i) || nbrs(M, i).length !== 1 || rng() > TUNE.braid) continue;
        const opts = around(i).filter(j => !pick.includes(j) && !isOpen(M, i, j)); if (opts.length) openWall(M, i, opts[Math.floor(rng(opts.length))]);
      }
      let cur = start, tour = 0; const left = pick.slice(), used = [];
      while (left.length) { const { d, par } = bfs(cur, pass); left.sort((a, b) => d[a] - d[b]); const nx = left.shift(), p = pathTo(par, nx); tour += d[nx]; for (let k = 1; k < p.length; k++) used.push([p[k - 1], p[k]]); cur = nx; }
      const score = Math.abs(tour - TUNE.tour);
      if (!best || score < best.score) best = { M, start, pick, used, score, tour };
      if (score <= 2) break;
    }
    return best;
  }
  /* which side of cell i has a wall, as a box mount: the side facing its one opening if it is a dead end */
  const SIDES = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] }, OPP = { N: 'S', S: 'N', W: 'E', E: 'W' };
  const wallOn = (M, i, s) => { const [dc, dr] = SIDES[s], c = i % COLS + dc, r = Math.floor(i / COLS) + dr; return c < 0 || r < 0 || c >= COLS || r >= ROWS || !isOpen(M, i, r * COLS + c); };

  let G, M, SOLID, ZONE, ZI, MAZE, WALLS;
  function reset() {
    const Lyt = layout(); M = Lyt.M;
    const art = MG.seeded((R.seed ^ 0x5eed) >>> 0);
    /* walls as rects (units) and as a 1-unit solid map the light rays stop on */
    WALLS = [];
    for (let i = 0; i < NC; i++) {
      const c = i % COLS, r = Math.floor(i / COLS);
      if (c < COLS - 1 && M.E[i]) WALLS.push({ x: (c + 1) * CS - WT, y: HEAD + r * CS - WT, w: WT * 2, h: CS + WT * 2 });
      if (r < ROWS - 1 && M.S[i]) WALLS.push({ x: c * CS - WT, y: HEAD + (r + 1) * CS - WT, w: CS + WT * 2, h: WT * 2 });
    }
    WALLS.push({ x: -WT, y: Y0, w: WT * 2, h: H - Y0 }, { x: W - WT, y: Y0, w: WT * 2, h: H - Y0 }, { x: 0, y: Y0, w: W, h: WT * 2 }, { x: 0, y: H - WT, w: W, h: WT * 2 });
    SOLID = new Uint8Array(W * H);
    for (const w of WALLS) for (let y = Math.max(0, Math.round(w.y)); y < Math.min(H, Math.round(w.y + w.h)); y++) for (let x = Math.max(0, Math.round(w.x)); x < Math.min(W, Math.round(w.x + w.w)); x++) SOLID[y * W + x] = 1;
    /* breakers: a box on the wall facing the nook's opening, its LED on the front corner */
    const br = Lyt.pick.map((i, k) => {
      const open = Object.keys(SIDES).find(s => !wallOn(M, i, s)), side = open && wallOn(M, i, OPP[open]) ? OPP[open] : Object.keys(SIDES).find(s => wallOn(M, i, s));
      const c = i % COLS, r = Math.floor(i / COLS), L = c * CS + WT, T = HEAD + r * CS + WT, Rt = (c + 1) * CS - WT, B = HEAD + (r + 1) * CS - WT, bw = BW / 3, bh = BH / 3, mx = ccx(i) - bw / 2, my = ccy(i) - bw / 2;
      const bx = side === 'N' ? { x: mx, y: T, w: bw, h: bh } : side === 'S' ? { x: mx, y: B - bh, w: bw, h: bh } : side === 'W' ? { x: L, y: my, w: bh, h: bw } : { x: Rt - bh, y: my, w: bh, h: bw };
      const o = side === 'N' ? [bx.x, bx.y, 1, 0, 0, 1] : side === 'S' ? [bx.x + bw, bx.y + bh, -1, 0, 0, -1] : side === 'W' ? [bx.x, bx.y, 0, 1, 1, 0] : [bx.x + bh, bx.y, 0, 1, -1, 0];
      const at = (lx, ly) => ({ x: o[0] + o[2] * lx + o[4] * ly, y: o[1] + o[3] * lx + o[5] * ly });
      return { i, k, side, box: bx, led: at(bw - 2, bh - 1.67), front: at(bw / 2, bh + TUNE.r + 1), on: false, seen: false, t: -1, ph: rng() };
    });
    /* sections: every cell belongs to its nearest breaker (maze distance); each section's ceiling lamp hangs over its middle cell */
    const zone = new Int8Array(NC).fill(-1), q = [];
    br.forEach((b, k) => { zone[b.i] = k; q.push(b.i); });
    for (let h = 0; h < q.length; h++) for (const j of nbrs(M, q[h])) if (zone[j] < 0) { zone[j] = zone[q[h]]; q.push(j); }
    const lamps = br.map((b, k) => {
      const cells = []; for (let i = 0; i < NC; i++) if (zone[i] === k) cells.push(i);
      let bi = b.i, bs = Infinity; for (const i of cells) { let s = 0; for (const j of cells) s += Math.hypot(ccx(i) - ccx(j), ccy(i) - ccy(j)); if (s < bs) { bs = s; bi = i; } }
      return { x: ccx(bi), y: ccy(bi) };
    });
    ZONE = new Int8Array(W * H).fill(-1); ZI = new Float32Array(W * H);
    for (let y = Y0; y < H; y++) for (let x = 0; x < W; x++) { const z = zone[cellAt(x + .5, y + .5)], p = y * W + x; ZONE[p] = z; const lp = lamps[z]; ZI[p] = .58 + .32 * Math.max(0, 1 - Math.hypot(x + .5 - lp.x, y + .5 - lp.y) / 32); }
    /* live wires: on passages of the tour (where they matter), clear of the start, no two sharing a cell */
    const dS = bfs(Lyt.start, i => nbrs(M, i)).d, wires = [], taken = new Set(), ok = ([i, j]) => dS[i] > 1 && dS[j] > 1 && !taken.has(i) && !taken.has(j);
    const pool = Lyt.used.slice().sort(() => rng() - .5), rest = []; for (let i = 0; i < NC; i++) for (const j of nbrs(M, i)) if (j > i) rest.push([i, j]);
    for (const e of [...pool, ...rest.sort(() => rng() - .5)]) {
      if (wires.length >= TUNE.wires) break; if (!ok(e)) continue;
      const [a, b] = e[0] < e[1] ? e : [e[1], e[0]], vert = b === a + 1, c = a % COLS, r = Math.floor(a / COLS);
      const X = vert ? (c + 1) * CS : ccx(a), Y = vert ? ccy(a) : HEAD + (r + 1) * CS, s0 = (vert ? HEAD + r * CS : c * CS) + WT, s1 = s0 + CS - WT * 2;
      wires.push({ a, b, vert, X, Y, s0, s1, zone: vert ? { x: X - 3, y: s0, w: 6, h: s1 - s0 } : { x: s0, y: Y - 3, w: s1 - s0, h: 6 }, sag: rng() < .5 ? -2.5 : 2.5, ph: rng(), pk: rng(.92, 1.08), s: 0, dead: false });
      taken.add(a); taken.add(b);
    }
    for (const w of wires) w.tips = stubs(w).map(s => s[1]);
    MAZE = paintMaze(br, wires, Lyt.start, art);
    const sx = ccx(Lyt.start), sy = ccy(Lyt.start) + 3, way = ['N', 'E', 'W', 'S'].find(s => !wallOn(M, Lyt.start, s)), face = Math.atan2(SIDES[way][1], SIDES[way][0]);   /* face the way out, so the first beam finds the maze */
    G = {
      br, wires, zone, lamps, start: Lyt.start, tour: Lyt.tour,
      x: sx, y: sy, vx: 0, vy: 0, ang: face, tang: face, tx: sx, ty: sy, mode: 'ptr', walk: 0, step: 0, moving: false, lx: sx, ly: sy - 3,
      tick: 0, stun: 0, inv: 0, zaps: 0, flipped: 0, leftAtDone: 0, intro: 0, struck: false, bang: 0, lampOn: false, lampK: 0, flash: 0, flashT: -1, bolt: TUNE.bolt() * .7, allT: -1,
      zoneT: br.map(() => -1), hdrT: [-9, -9, -9, -9, -9, -9], look: 0, arcs: [], arcT: 0,
      motes: Array.from({ length: 30 }, () => ({ x: rng(W), y: rng(Y0, H), vx: rng(-1.5, 1.5), vy: rng(-1, 1), ph: rng(TAU) })),
      bot: { seen: new Uint8Array(NC), path: [], tgt: null, replan: 0, look: 0, err: [0, 0], wait: 0, brave: false, wire: null, cell: -1, stuck: 0, pause: 0, pang: 0, detour: -1, start: rng(.8, 1.2) },
    };
    ui.setScore(0); shaded = -1; zkey = '';
  }
  const grade = () => clamp(.75 * G.flipped / TUNE.n + .25 * (G.flipped === TUNE.n ? clamp(G.leftAtDone / (R.seconds * TUNE.fast), 0, 1) : 0) - .06 * G.zaps, 0, 1);
  const stats = () => [['BREAKERS', `${G.flipped} / ${TUNE.n}`], ['ZAPS', G.zaps], ['TIME LEFT', G.flipped === TUNE.n ? G.leftAtDone.toFixed(1) + 's' : '-']];

  /* a live wire's two cut ends, hanging from the cabinets on either side of its passage: [[from, tip], [from, tip]] */
  const stubs = w => { const along = w.vert ? (a, s) => [w.X + s, a] : (a, s) => [a, w.Y + s]; return [[along(w.s0, 0), along(w.s0 + 6.5, w.sag)], [along(w.s1, 0), along(w.s1 - 6.5, w.sag * .6)]]; };
  /* the static room: floor boards, junk, then the cabinet walls with their shadows, seams, rivets and trim, then the cut wires */
  function paintMaze(br, wires, start, rnd) {
    return cvs(W * 3, (H - Y0) * 3, x => {
      x.scale(3, 3); x.translate(0, -Y0); const r = (c, a, b, w, hh) => { x.fillStyle = c; x.fillRect(a, b, w, hh); };
      for (let y = Y0, i = 0; y < H; y += 4, i++) {
        r(['#3d2614', '#45291a', '#392212'][i % 3], 0, y, W, 4); r('#553722', 0, y, W, .33); r('#24150a', 0, y + 3.67, W, .33);
        for (let sx = (i * 29) % 37; sx < W; sx += 37 + (i % 3) * 6) { r('#24150a', sx, y, .33, 4); r('#6a4428', sx + 1, y + 1.67, .33, .33); }
        for (let k = 0; k < 4; k++) r('#33200f', Math.floor(rnd() * W), y + 1 + Math.floor(rnd() * 2) + .33, 2 + Math.floor(rnd() * 5), .33);
      }
      for (const w of wires) {                                                    /* warning paint on the floor where a live wire hangs */
        const z = w.zone; for (let yy = 0; yy < z.h; yy += 1 / 3) for (let xx = 0; xx < z.w; xx += 1 / 3) { r(Math.floor((xx + yy) / 1.33) % 2 ? 'rgba(26,15,20,.6)' : 'rgba(242,178,58,.5)', z.x + xx, z.y + yy, 1 / 3, 1 / 3); }
      }
      const nooks = new Set([start, ...br.map(b => b.i)]);
      for (let i = 0; i < NC; i++) {
        if (nooks.has(i) || rnd() > .42) continue;
        const s = PROPS[Math.floor(rnd() * PROPS.length)], px = ccx(i) + (rnd() < .5 ? -1 : 1) * (2.5 + rnd() * 3) - s.width / 6, py = ccy(i) + (rnd() - .5) * 8 - s.height / 6;
        x.drawImage(s, Math.round(px * 3) / 3, Math.round(py * 3) / 3, s.width / 3, s.height / 3);
      }
      for (const w of WALLS) r('rgba(0,0,0,.4)', w.x + 1.33, w.y + 1.33, w.w, w.h);
      for (const w of WALLS) r('#1a0f14', w.x - .33, w.y - .33, w.w + .67, w.h + .67);
      for (const w of WALLS) r('#4f5468', w.x, w.y, w.w, w.h);
      for (const w of WALLS) { r('#7e86a2', w.x, w.y, w.w, .67); r('#7e86a2', w.x, w.y, .67, w.h); r('#363a4c', w.x, w.y + w.h - .67, w.w, .67); r('#363a4c', w.x + w.w - .67, w.y, .67, w.h); }
      for (const w of WALLS) {                                                    /* cabinet seams + rivets, and now and then a copper conduit, hazard tape or a blown fuse */
        const long = w.w > w.h, len = long ? w.w : w.h;
        for (let k = 6; k < len - 3; k += 8) { if (long) { r('#2a2d3c', w.x + k, w.y + .67, .33, w.h - 1.33); r('#a8b0c8', w.x + k - 1, w.y + 1, .33, .33); } else { r('#2a2d3c', w.x + .67, w.y + k, w.w - 1.33, .33); r('#a8b0c8', w.x + 1, w.y + k - 1, .33, .33); } }
        const d = rnd();
        if (d < .28 && len > 20) { if (long) { r('#7a3e18', w.x + 2, w.y + 1.67, w.w - 4, .67); r('#e8904a', w.x + 2, w.y + 1.67, w.w - 4, .33); } else { r('#7a3e18', w.x + 1.67, w.y + 2, .67, w.h - 4); r('#e8904a', w.x + 1.67, w.y + 2, .33, w.h - 4); } }
        else if (d < .42 && len > 12) { const k0 = 3 + Math.floor(rnd() * (len - 10)); for (let k = 0; k < 6; k++) { const c = k % 2 ? '#1a0f14' : '#f2b23a'; if (long) r(c, w.x + k0 + k, w.y + .67, 1, w.h - 1.33); else r(c, w.x + .67, w.y + k0 + k, w.w - 1.33, 1); } }
        else if (d < .56 && len > 12) { const k0 = 4 + Math.floor(rnd() * (len - 10)), fx0 = long ? w.x + k0 : w.x + .67, fy0 = long ? w.y + .67 : w.y + k0; r('#1a0f14', fx0 - .33, fy0 - .33, 3.33, 3.33); r('#e8e0d0', fx0, fy0, 2.67, 2.67); r('#fffaf0', fx0, fy0, 2.67, .67); r('#3a2a30', fx0 + .67, fy0 + 1, 1.33, 1); }
      }
      for (const w of wires) for (const [p0, p1] of stubs(w)) { lineOn(x, p0[0], p0[1], p1[0], p1[1], '#1a0f14', 2); lineOn(x, p0[0], p0[1], p1[0], p1[1], '#4a3a40', .67); dotOn(x, p1[0], p1[1], 1.67, '#1a0f14'); dotOn(x, p1[0], p1[1], 1, '#e8904a'); }
    });
  }

  /* ---------- 5. verbs: walk (pointer, finger, keys or bot all set an aim), flip a breaker by touching it; the wires zap ---------- */
  const rectDist = (x, y, b) => Math.hypot(x - clamp(x, b.x, b.x + b.w), y - clamp(y, b.y, b.y + b.h));
  function push(b) {                                                              /* circle (the fixer) out of a rect */
    const r = TUNE.r, nx = clamp(G.x, b.x, b.x + b.w), ny = clamp(G.y, b.y, b.y + b.h), dx = G.x - nx, dy = G.y - ny, d2 = dx * dx + dy * dy;
    if (d2 >= r * r) return false;
    if (d2 > 1e-6) { const d = Math.sqrt(d2), k = (r - d) / d; G.x += dx * k; G.y += dy * k; }
    else { const l = G.x - b.x, rr = b.x + b.w - G.x, t = G.y - b.y, bt = b.y + b.h - G.y, m = Math.min(l, rr, t, bt); if (m === l) G.x = b.x - r; else if (m === rr) G.x = b.x + b.w + r; else if (m === t) G.y = b.y - r; else G.y = b.y + b.h + r; }
    return true;
  }
  const callout = (x, y, txt, cls) => { const hw = txt.length * (cls === 'big' ? 3 : 2.25) + 1; ui.floatText(clamp(x, hw, W - hw), Math.max(y, Y0 + 5), txt, cls); };   /* kept inside the stage */
  const flicker = t => t < 0 ? 0 : CALM ? Math.min(1, .4 + t * 3) : t < .07 ? .9 : t < .14 ? .1 : t < .22 ? 1 : t < .3 ? .25 : 1;
  function flip(b) {
    const k = G.flipped; b.on = true; b.t = 0; G.flipped++; G.zoneT[b.k] = 0;
    for (let i = Math.floor(k * 6 / TUNE.n); i < Math.floor((k + 1) * 6 / TUNE.n); i++) G.hdrT[i] = -(i - Math.floor(k * 6 / TUNE.n)) * .12;
    const last = G.flipped === TUNE.n, cx = b.box.x + b.box.w / 2, cy = b.box.y + b.box.h / 2;
    ui.setScore(G.flipped); ui.bump(); MG.hitstop(last ? .1 : .06); R.shake(last ? 4 : 2.5);
    sfx.tone(150, 60, .12, 'square', .08); sfx.noise(.06, .09, 1800); sfx.tone(70, 260, .45, 'sawtooth', .025, .06);
    for (let n = 0; n < 4; n++) sfx.tone(1700 + n * 160, 1700 + n * 160, .03, 'sine', .035, .22 + n * .08);
    fx.burst(cx, cy, ['#fff6c0', '#ffd23a', '#7be05a'], 12, 46, 90, .45); fx.ring(cx, cy, '#7be05a', 16); fx.shock(G.lamps[b.k].x, G.lamps[b.k].y, '#fff6c0', 34);
    callout(cx, cy - 8, last ? 'LIGHTS ON!' : `POWER ${G.flipped}/${TUNE.n}`, last ? 'big' : 'gold');
    if (last) { G.leftAtDone = R.timer.left; R.end(); }
  }
  function zap(w) {
    G.zaps++; G.stun = .75; G.inv = 1.6; G.vx = G.vy = 0;
    const side = w.vert ? Math.sign(G.x - w.X) || 1 : Math.sign(G.y - w.Y) || 1, back = 3 + TUNE.r + 1.5;
    if (w.vert) G.x = w.X + side * back; else G.y = w.Y + side * back;
    G.bang = .55; R.shake(5); MG.hitstop(.08);
    sfx.noise(.3, .12, 6000); sfx.tone(95, 40, .35, 'sawtooth', .08); sfx.tone(1900, 300, .12, 'square', .03);
    fx.burst(G.x, G.y, ['#ffffff', '#9be8ff', '#fff08c'], 14, 50, 40, .4);
    callout(G.x, G.y - 9, 'ZAP!', 'bad');
  }
  /* is (x, y) lit right now: a lit section, a lightning glimpse, or the headlamp with a clear line from the lamp */
  function clear(x0, y0, x1, y1) { const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / .5); for (let k = 1; k < n; k++) { const x = x0 + (x1 - x0) * k / n, y = y0 + (y1 - y0) * k / n; if (SOLID[(y | 0) * W + (x | 0)]) return false; } return true; }
  function lit(x, y) {
    const z = G.zone[cellAt(x, y)]; if (z >= 0 && G.zoneT[z] >= 0) return true;
    if (!G.lampOn || G.stun > 0) return false;
    const d = Math.hypot(x - G.lx, y - G.ly);
    return (d < TUNE.near + 4 || (d < TUNE.cone * .95 && Math.abs(wrap(Math.atan2(y - G.ly, x - G.lx) - G.ang)) < TUNE.half + .05)) && clear(G.lx, G.ly, x, y);
  }

  /* ---------- 6. update (fixed 60 Hz). R.live is false once end() was called: stop scoring, let things settle ---------- */
  function update(dt) {
    const p = R.progress;
    G.intro += dt; G.tick++;
    /* the opening: the bolt that blew the fuses, the lights die, then the headlamp clicks on */
    if (!G.struck) { G.struck = true; G.bang = 1; R.shake(6); sfx.noise(1.2, .1, 260, .05); sfx.noise(.25, .09, 5000); sfx.tone(440, 40, .9, 'sawtooth', .05, .12); }
    G.bang = Math.max(0, G.bang - dt * 4);
    if (!G.lampOn && G.intro >= .34) { G.lampOn = true; sfx.tone(1500, 1500, .02, 'square', .04); sfx.tone(950, 950, .02, 'square', .03, .05); if (MINER) callout(G.x, G.y - 12, 'MINER LAMP', 'gold'); }
    G.lampK = G.lampOn ? Math.min(1, G.lampK + dt * 8) : 0;
    /* lightning: now and then a double flash lights the whole maze */
    if (R.live && G.intro > 2 && (G.bolt -= dt) <= 0) { G.bolt = TUNE.bolt(); G.flashT = 0; sfx.noise(1.4, .08, 220, .3); }
    if (G.flashT >= 0) { const t = G.flashT += dt; G.flash = CALM ? (t < .2 ? .6 : Math.max(0, .6 * (1 - (t - .2) / .5))) : t < .06 ? .85 : t < .11 ? .08 : t < .2 ? .7 : Math.max(0, .7 * (1 - (t - .2) / .5)); if (t > .75) { G.flashT = -1; G.flash = 0; } }
    /* the fixer: keys steer directly; otherwise walk toward the aim (pointer, finger or bot), slowing in close. The lamp turns to the aim. */
    let ax = 0, ay = 0, want = 0;
    if (R.live && G.stun <= 0) {
      const kx = R.axisX(), ky = R.axisY();
      if (kx || ky) { const n = Math.hypot(kx, ky); ax = kx / n; ay = ky / n; want = TUNE.speed; G.tang = Math.atan2(ay, ax); G.mode = 'key'; }
      else if (G.mode === 'key') { G.mode = 'ptr'; G.tx = G.x + G.vx / 12; G.ty = G.y + G.vy / 12; }   /* keys let go: stop where the coast ends, facing on */
      else { const dx = G.tx - G.x, dy = G.ty - G.y, d = Math.hypot(dx, dy); if (d > 1.5) G.tang = Math.atan2(dy, dx); if (d > 2.5) { ax = dx / d; ay = dy / d; want = TUNE.speed * Math.min(1, (d - 1.5) / 6); } }
    }
    const k = Math.min(1, dt * 12), ox = G.x, oy = G.y; G.vx = lerp(G.vx, ax * want, k); G.vy = lerp(G.vy, ay * want, k);
    G.x += G.vx * dt; G.y += G.vy * dt;
    for (let it = 0; it < 3; it++) { let hit = false; for (const w of WALLS) if (push(w)) hit = true; for (const b of G.br) if (push(b.box)) hit = true; if (!hit) break; }
    const moved = Math.hypot(G.x - ox, G.y - oy); G.moving = moved > dt * 6; G.walk += moved;
    if (G.moving && (G.step += moved) > 9) { G.step = 0; sfx.tone(150, 110, .03, 'triangle', .014); }
    G.ang = wrap(G.ang + clamp(wrap(G.tang - G.ang), -dt * 12, dt * 12));
    G.lx = G.x + Math.cos(G.ang) * 3.4; G.ly = G.y + Math.sin(G.ang) * 3.4;
    G.stun = Math.max(0, G.stun - dt); G.inv = Math.max(0, G.inv - dt);
    if (G.stun > 0 && MG.rng() < dt * 25) fx.spark(G.x, G.y, MG.rng() < .5 ? '#9be8ff' : '#ffffff');
    /* breakers: touch one to flip it */
    if (R.live && G.stun <= 0) for (const b of G.br) if (!b.on && rectDist(G.x, G.y, b.box) <= TUNE.r + 1.2) { flip(b); if (!R.live) break; }
    /* found one in the dark: a ping */
    if ((G.look -= dt) <= 0) { G.look = .1; for (const b of G.br) if (!b.seen && !b.on && lit(b.led.x, b.led.y)) { b.seen = true; fx.ring(b.led.x, b.led.y, '#ff6a50', 9); if (R.live) sfx.tone(1100, 1500, .06, 'square', .03); } }
    /* live wires: quiet, crackle (a warning), arc. An arc across the fixer zaps it back. */
    for (const w of G.wires) {
      const P = TUNE.period(p) * w.pk; w.ph += dt / P;
      const fr = w.ph % 1, aF = 1 - TUNE.arc / P, wF = aF - TUNE.warn / P, s = w.dead ? 0 : fr < wF ? 0 : fr < aF ? 1 : 2;
      if (s !== w.s) {
        w.s = s; const v = clamp(1 - Math.hypot(w.X - G.x, w.Y - G.y) / 70, 0, 1);
        if (v > 0 && s === 1) { sfx.noise(.07, .03 * v, 6000); sfx.noise(.05, .025 * v, 6000, .22); }
        if (v > 0 && s === 2) { sfx.tone(110, 85, TUNE.arc, 'sawtooth', .035 * v); sfx.noise(.18, .06 * v, 4500); }
      }
      if (s === 2 && R.live && G.inv <= 0 && rectDist(G.x, G.y, w.zone) < TUNE.r) zap(w);
    }
    for (const b of G.br) if (b.t >= 0) b.t += dt;
    G.zoneT = G.zoneT.map(t => t >= 0 ? t + dt : t); G.hdrT = G.hdrT.map(t => t > -5 ? t + dt : t);
    if (G.allT >= 0) G.allT += dt;
    for (const m of G.motes) { m.x += (m.vx + Math.sin(R.t * .7 + m.ph) * 1.2) * dt; m.y += m.vy * dt; if (m.x < 0) m.x += W; if (m.x > W) m.x -= W; if (m.y < Y0) m.y += H - Y0; if (m.y > H) m.y -= H - Y0; }
  }

  /* ---------- 7. bot (?bot=1): plays like a person in the dark. It only knows the cells it has seen lit (headlamp, lit sections, a glimpse
     around it in a lightning flash) and heads for the breaker that looks nearest, planning through unseen cells as if they were open and
     replanning when a wall turns up (with a beat to rethink). It waits out a crackling wire, now and then misjudges one, takes a wrong turn
     at a fork, pauses to look around, aims a little off. ---------- */
  function botPass(i) { const B = G.bot; return around(i).filter(j => !(B.seen[i] || B.seen[j]) || isOpen(M, i, j)); }
  const wireOn = (i, j) => G.wires.find(w => (w.a === i && w.b === j) || (w.a === j && w.b === i));
  function bot(dt) {
    const B = G.bot; if (!R.live || G.intro < B.start) return;
    const me = cellAt(G.x, G.y);
    if ((B.look -= dt) <= 0) {
      B.look = .1; let fresh = false; const mc = me % COLS, mr = Math.floor(me / COLS);
      for (let i = 0; i < NC; i++) if (!B.seen[i] && ((G.flash > .4 && Math.abs(i % COLS - mc) + Math.abs(Math.floor(i / COLS) - mr) <= 2) || lit(ccx(i), ccy(i)))) { B.seen[i] = 1; fresh = true; }
      if (fresh) B.replan = Math.min(B.replan, rng(.08, .25));                    /* a beat to take in what the lamp showed */
    }
    if (G.stun > 0) { B.replan = Math.min(B.replan, .3); return; }
    if (me !== B.cell) {                                                          /* a new cell: at a fork, sometimes look around or take a wrong turn */
      const prev = B.cell; B.cell = me; B.stuck = 0; B.err = [rng(-2.2, 2.2), rng(-2.2, 2.2)];
      if (B.detour === me) { B.detour = -1; B.replan = 0; }
      const exits = botPass(me).filter(j => j !== prev);
      if (exits.length >= 2 && B.tgt && me !== B.tgt.i) {
        if (rng() < .3) { B.pause = rng(.15, .4); B.pang = G.ang; }
        if (B.detour < 0 && rng() < .22) { const alt = exits.filter(j => j !== B.path[B.path.indexOf(me) + 1]); if (alt.length) B.detour = alt[Math.floor(rng(alt.length))]; }
      }
    }
    if (B.detour >= 0 && !botPass(me).includes(B.detour)) { B.detour = -1; B.replan = 0; }
    if ((B.stuck += dt) > 2.5) { B.stuck = 0; B.err = [rng(-5, 5), rng(-5, 5)]; B.replan = 0; }
    if ((B.replan -= dt) <= 0 || !B.tgt || B.tgt.on) {
      B.replan = .5; const { d, par } = bfs(me, botPass), left = G.br.filter(b => !b.on), was = B.path[B.path.indexOf(me) + 1];
      if (!left.length) return;
      B.tgt = left.map(b => [b, (d[b.i] < 0 ? 99 : d[b.i]) * .7 + Math.hypot(b.led.x - G.x, b.led.y - G.y) / CS * .5 + rng(1.2)]).sort((a, b) => a[1] - b[1])[0][0];
      B.path = d[B.tgt.i] < 0 ? [me] : pathTo(par, B.tgt.i);
      if (was != null && B.path[1] != null && B.path[1] !== was && B.detour < 0 && rng() < .6) { B.pause = rng(.12, .3); B.pang = G.ang; }   /* the way it meant to go is walled: rethink */
    }
    if (B.pause > 0) { B.pause -= dt; G.tx = G.x; G.ty = G.y; G.tang = B.pang + Math.sin(R.t * 9) * .6; return; }
    const k = B.path.indexOf(me); if (k > 0) B.path = B.path.slice(k); else if (k < 0) { B.replan = 0; }
    let tx, ty;
    if (me === B.tgt.i || B.path.length < 2) { tx = B.tgt.front.x; ty = B.tgt.front.y; const bx = B.tgt.box; tx = lerp(tx, bx.x + bx.w / 2, .8); ty = lerp(ty, bx.y + bx.h / 2, .8); }
    else {
      const nx = B.detour >= 0 ? B.detour : B.path[1]; tx = ccx(nx) + B.err[0]; ty = ccy(nx) + B.err[1];
      const w = wireOn(me, nx);
      if (w) {                                                                    /* a live wire on the next passage: time the crossing */
        if (B.wire !== w) { B.wire = w; B.brave = rng() < .1; }
        const P = TUNE.period(R.progress) * w.pk, fr = w.ph % 1, aF = 1 - TUNE.arc / P, line = w.vert ? Math.abs(G.x - w.X) : Math.abs(G.y - w.Y);
        const safe = TUNE.r + 3 + 4, toArc = fr < aF ? (aF - fr) * P : 0, cross = (line + 3 + TUNE.r) / TUNE.speed + .2;
        if (w.s === 2) B.wait = rng(.1, .3);
        if (!B.brave && line < safe + 3 && (w.s === 2 || B.wait > 0 || toArc < cross)) {
          B.wait = Math.max(0, B.wait - dt);
          const sd = (w.vert ? Math.sign(G.x - w.X) : Math.sign(G.y - w.Y)) || 1;
          if (w.vert) { tx = w.X + sd * safe; ty = ccy(me); } else { tx = ccx(me); ty = w.Y + sd * safe; }
          B.stuck = 0;
        }
      } else B.wire = null;
    }
    G.mode = 'ptr'; G.tx = tx; G.ty = ty;
  }

  /* ---------- 8. draw: back to front, then the dark on top (a light map at 1 unit, dithered to 5 levels), then whatever glows ---------- */
  /* pixel helpers on any context in units (1/3-unit grid): the stage's g, or a sprite being painted */
  const ovalOn = (c, cx, cy, rx, ry, col) => {
    c.fillStyle = col; const n = Math.max(1, Math.round(ry * 3));
    for (let i = -n; i <= n; i++) { const yy = i / 3, w = rx * Math.sqrt(Math.max(0, 1 - (yy * yy) / (ry * ry))); if (w > 0) c.fillRect(Math.round((cx - w) * 3) / 3, Math.round((cy + yy) * 3) / 3, Math.round(w * 6) / 3, 1 / 3); }
  };
  const dotOn = (c, x, y, s, col) => { c.fillStyle = col; c.fillRect(Math.round((x - s / 2) * 3) / 3, Math.round((y - s / 2) * 3) / 3, s, s); };
  function lineOn(c, x0, y0, x1, y1, col, s) { const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 3)); c.fillStyle = col; for (let k = 0; k <= n; k++) c.fillRect(Math.round((x0 + (x1 - x0) * k / n - s / 2) * 3) / 3, Math.round((y0 + (y1 - y0) * k / n - s / 2) * 3) / 3, s, s); }
  const oval = (...a) => ovalOn(g, ...a), dot = (...a) => dotOn(g, ...a), line = (...a) => lineOn(g, ...a);
  /* a section's ceiling lamp, cold and lit (painted once) */
  const LAMP = [cvs(18, 18, x => { x.scale(3, 3); ovalOn(x, 3, 3, 2, 2, '#1a0f14'); ovalOn(x, 3, 3, 1.33, 1.33, '#8a8a96'); }),
    cvs(24, 24, x => { x.scale(3, 3); ovalOn(x, 4, 4, 3.33, 3.33, 'rgba(255,230,150,.3)'); ovalOn(x, 4, 4, 1.67, 1.67, '#fff6c0'); dotOn(x, 3.67, 3.67, .67, '#ffffff'); })];

  const LT = new Float32Array(W * H), GW = new Float32Array(W * H), GB = new Float32Array(W * H), NR = 180, HIT = new Float32Array(NR);
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + .5) / 16);
  const DK = cvs(W, H, () => {}), dkx = DK.getContext('2d'), DI = dkx.createImageData(W, H), GC = cvs(W, H, () => {}), gcx = GC.getContext('2d'), GI = gcx.createImageData(W, H);
  const D32 = new Uint32Array(DI.data.buffer), G32 = new Uint32Array(GI.data.buffer), LE = new Uint8Array(new Uint16Array([1]).buffer)[0] === 1;
  const rgba = (r, gg, b, a) => (LE ? (a << 24 | b << 16 | gg << 8 | r) : (r << 24 | gg << 16 | b << 8 | a)) >>> 0;
  const DKC = [0, 1, 2, 3, 4].map(q => rgba(6, 6, 20, Math.round(TUNE.dark * 255 * (1 - q / 4))));   /* the dark, at each of the 5 dither levels */
  /* the cone's angle, ray and distance for each whole-unit offset from the lamp (the light map is 1 unit, so the lamp snaps to its grid): no trig per pixel */
  const CR = Math.ceil(TUNE.cone) + 1, CW = CR * 2 + 1, CA = new Float32Array(CW * CW), CI = new Uint8Array(CW * CW), CD = new Float32Array(CW * CW);
  for (let j = 0; j < CW; j++) for (let i = 0; i < CW; i++) { const t = j * CW + i, a = Math.atan2(j - CR, i - CR); CA[t] = a; CI[t] = Math.min(NR - 1, ((a + Math.PI) / TAU * NR) | 0); CD[t] = Math.hypot(i - CR, j - CR); }
  const introLevel = t => CALM ? clamp(1 - t / .4, 0, 1) : t < .06 ? 1 : t < .11 ? .25 : t < .16 ? .85 : t < .21 ? .1 : t < .26 ? .4 : t < .4 ? .12 * (1 - (t - .26) / .14) : 0;
  const allLevel = () => G.allT < 0 ? 0 : !CALM && G.allT < .08 ? .8 : !CALM && G.allT < .15 ? .3 : Math.min(1, .5 + G.allT);
  function cast(lx, ly, ang, half, far, near) {
    for (let i = 0; i < NR; i++) {
      const a = -Math.PI + (i + .5) / NR * TAU, max = Math.abs(wrap(a - ang)) < half + .06 ? far : near, dx = Math.cos(a) * .5, dy = Math.sin(a) * .5;
      let x = lx, y = ly, d = 0;
      while (d < max) { x += dx; y += dy; d += .5; if (x < 0 || y < Y0 || x >= W || y >= H || SOLID[(y | 0) * W + (x | 0)]) break; }
      HIT[i] = d + 1.4;
    }
  }
  const frozen = () => { const ph = R.shell.phase; return ph === 'pause' || ph === 'waiting'; };   /* paused, or waiting for the host: show no glimpse to study */
  let shaded = -1;                                                                /* the step (and pause state) the light map was built for: a 120/144 Hz screen redraws it once per step */
  const ZLT = new Float32Array(W * H), ZGW = new Float32Array(W * H); let zkey = '';   /* the room + lit sections layer, rebuilt only when a level changes */
  function shade() {
    const fz = frozen(), key = (LOW ? G.tick >> 1 : G.tick) * 2 + (fz ? 1 : 0);
    if (shaded === key) { g.drawImage(DK, 0, 0, W, H); return; }
    shaded = key;
    const fl = fz ? 0 : G.flash, base = fz ? 0 : Math.max(introLevel(G.intro), allLevel(), fl), zl = G.zoneT.map(t => flicker(t) * (t > .3 && !CALM && MG.rng() < .004 ? .6 : 1));
    const zk = base + '|' + zl.join();
    if (zk !== zkey) {
      zkey = zk; LT.fill(base); GW.fill(0);
      if (zl.some(v => v > 0)) for (let p = Y0 * W; p < W * H; p++) { const z = ZONE[p]; if (z >= 0 && zl[z] > 0) { const k = zl[z] * ZI[p]; if (k > LT[p]) LT[p] = k; GW[p] = k * .35; } }
      ZLT.set(LT); ZGW.set(GW);
    } else { LT.set(ZLT); GW.set(ZGW); }
    GB.fill(fl * .6);
    const lamp = G.lampOn ? (G.stun > 0 ? (CALM ? .35 : Math.floor(G.stun * 4) % 2 ? .8 : .2) : G.lampK) : 0;   /* zapped: the lamp sputters dim, bright, dim (2 Hz; steady and dim when calm) */
    if (lamp > 0) {
      const ix = Math.floor(G.lx), iy = Math.floor(G.ly), cone = TUNE.cone, c2 = cone * cone, half = TUNE.half, near = TUNE.near, ang = G.ang;
      cast(ix + .5, iy + .5, ang, half, cone + 1, near + 1);
      const x0 = Math.max(0, ix - CR), x1 = Math.min(W - 1, ix + CR), y0 = Math.max(Y0, iy - CR), y1 = Math.min(H - 1, iy + CR);
      for (let y = y0; y <= y1; y++) for (let x = x0, t = (y - iy + CR) * CW + x0 - ix + CR; x <= x1; x++, t++) {
        const d = CD[t]; if (d > cone || d > HIT[CI[t]]) continue;
        let da = CA[t] - ang; if (da > Math.PI) da -= TAU; else if (da < -Math.PI) da += TAU; if (da < 0) da = -da;
        let v = da < half ? (1 - d * d / c2) * (da < half * .6 ? 1 : 1 - (da - half * .6) / (half * .4)) : 0;
        if (d < near && .8 * (1 - d / near) > v) v = .8 * (1 - d / near);
        if (v <= 0) continue; v *= lamp; const p = y * W + x; if (v > LT[p]) LT[p] = v; if (v > GW[p]) GW[p] = v;
      }
    }
    for (const w of G.wires) {                                                    /* an arc lights its passage blue for a moment */
      if (!w.s) continue; const k = w.s === 2 ? (CALM ? .85 : .75 + MG.rng(.25)) : CALM ? .28 : .22 + MG.rng(.15), rad = w.s === 2 ? 22 : 7, r2 = rad * rad;
      for (let y = Math.max(Y0, Math.floor(w.Y - rad)); y < Math.min(H, w.Y + rad); y++) for (let x = Math.max(0, Math.floor(w.X - rad)); x < Math.min(W, w.X + rad); x++) {
        const dx = x + .5 - w.X, dy = y + .5 - w.Y, d2 = dx * dx + dy * dy; if (d2 > r2) continue; const v = k * (1 - Math.sqrt(d2) / rad), p = y * W + x; if (v > LT[p]) LT[p] = v; if (v > GB[p]) GB[p] = v;
      }
    }
    for (let y = Y0; y < H; y++) for (let x = 0, p = y * W, by = (y & 3) * 4; x < W; x++, p++) {   /* dither to 5 levels; the warm (lamp) and cold (arc, flash) glow */
      const q = LT[p] * 4 + BAYER[by + (x & 3)]; D32[p] = DKC[q >= 4 ? 4 : q | 0];
      const w = GW[p], b = GB[p], s = w + b;
      G32[p] = s > .01 ? rgba((255 * w + 150 * b) / s, (200 * w + 205 * b) / s, (110 * w + 255 * b) / s, Math.min(255, (w * .13 + b * .32) * 255)) : 0;
    }
    dkx.putImageData(DI, 0, 0); gcx.putImageData(GI, 0, 0); g.drawImage(DK, 0, 0, W, H);
  }
  const glow = () => { g.globalCompositeOperation = 'lighter'; g.drawImage(GC, 0, 0, W, H); g.globalCompositeOperation = 'source-over'; };
  function drawHeader(now) {
    st.hi(HDR, 0, 0);
    const room = Math.max(introLevel(G.intro), allLevel());
    for (let i = 0; i < 6; i++) {
      const x = SLOT(i), lv = Math.max(room, flicker(G.hdrT[i]));
      st.hi(TWS[i], x - 5, 8.33 + (lv > .5 && Math.floor(now * 7 + i * 1.7) % 4 === 0 ? -.33 : 0));
      st.hi(SHADE, x - 3.5, 2.67);
      if (lv > .5) { g.fillStyle = 'rgba(255,226,140,.2)'; for (let y = 6; y < 15; y++) { const hw = 2.5 + (y - 6) * .5; g.fillRect(x - hw, y, hw * 2, 1); } dot(x, 5.83, 1.67, '#fff6c0'); }
      else { g.fillStyle = `rgba(6,6,20,${(.75 * (1 - lv)).toFixed(2)})`; g.fillRect(x - 7, 0, 14, Y0); }
    }
    g.fillStyle = `rgba(6,6,20,${(.75 * (1 - room)).toFixed(2)})`; g.fillRect(0, 0, SLOT(0) - 7, Y0);
  }
  function drawArc(w, tips, now) {
    if (w.s === 0) { if ((now * 1.7 + w.ph * 5) % 1 < .06) dot(tips[0][0], tips[0][1], .67, '#fff08c'); return; }
    if (w.s === 1) { for (const t of tips) if (MG.rng() < .5) { dot(t[0] + MG.rng(-1.5, 1.5), t[1] + MG.rng(-1.5, 1.5), .67, MG.rng() < .5 ? '#fff08c' : '#ffffff'); } return; }
    const along = w.vert ? (a, s) => [w.X + s, a] : (a, s) => [a, w.Y + s], n = 9, pts = [];
    for (let k = 0; k <= n; k++) { const a = lerp(w.s0, w.s1, k / n); pts.push(along(a, (k === 0 || k === n ? 0 : MG.rng(-2.4, 2.4)) + w.sag * .5 * Math.sin(Math.PI * k / n))); }
    for (let k = 0; k < n; k++) line(pts[k][0], pts[k][1], pts[k + 1][0], pts[k + 1][1], 'rgba(150,200,255,.55)', 1.67);
    for (let k = 0; k < n; k++) line(pts[k][0], pts[k][1], pts[k + 1][0], pts[k + 1][1], '#ffffff', .67);
    if (MG.rng() < .35) { const q = pts[MG.rng(1, n) | 0]; fx.spark(q[0], q[1], MG.rng() < .5 ? '#9be8ff' : '#ffffff'); }
  }
  function draw() {
    const now = performance.now() / 1000;
    drawHeader(now);
    st.hi(MAZE, 0, Y0);
    for (const l of G.lamps) st.hi(LAMP[0], l.x - 3, l.y - 3);                    /* the ceiling lamps, cold */
    for (const b of G.br) st.hi(b.on ? BRK.on[b.side] : BRK.off[b.side], b.box.x, b.box.y);
    g.fillStyle = 'rgba(232,216,176,.55)'; for (const m of G.motes) g.fillRect(Math.round(m.x * 3) / 3, Math.round(m.y * 3) / 3, 1 / 3, 1 / 3);
    shade();                                                                      /* the dark; the fixer stands above it (its own lamp lights it), then the warm glow */
    if (G.allT >= 0) { const fy = Math.min(G.y + 7, H - 2); oval(G.x, fy, 5, 1.67, 'rgba(0,0,0,.42)'); R.crew(G.x, fy - Math.abs(Math.sin(now * 9)) * 1.33, 'cheer'); }   /* a full fix: the crew member stands up and cheers, in their own look and hat */
    else {
      oval(G.x + .67, G.y + 1.33, 5.2, 4.4, 'rgba(0,0,0,.42)');
      const d = ((Math.round(G.ang / TAU * DIRS) % DIRS) + DIRS) % DIRS, f = G.stun > 0 ? 4 : G.moving ? (Math.floor(G.walk / 4.5) % 2 ? 1 : 2) : 0, j = G.stun > 0 && !CALM ? (Math.floor(now * 30) % 2 ? .33 : -.33) : 0;
      st.hi(monkeySpr(f, d), G.x - MK / 6 + j, G.y - MK / 6);
    }
    glow();
    /* what glows: section lamps, breaker LEDs, the headlamp lens, sparks and arcs */
    G.zoneT.forEach((t, z) => { if (flicker(t) > .5) st.hi(LAMP[1], G.lamps[z].x - 4, G.lamps[z].y - 4); });
    for (const b of G.br) {
      const { x, y } = b.led;
      if (b.on) { dot(x, y, 2.67, 'rgba(123,224,90,.35)'); dot(x, y, 1.33, '#7be05a'); continue; }
      const ph = (now * 1.2 + b.ph) % 1;
      if (ph < .55) { dot(x, y, 5, 'rgba(255,80,50,.16)'); dot(x, y, 3.33, 'rgba(255,80,50,.35)'); dot(x, y, 1.67, '#ff5a3c'); dot(x - .33, y - .33, .67, '#ffd0c0'); } else { dot(x, y, 2.33, 'rgba(255,80,50,.12)'); dot(x, y, 1.33, '#8a2a1e'); }
      if (ph < .45 && G.lampOn) { g.globalAlpha = 1 - ph / .45; g.strokeStyle = '#ff6a50'; g.lineWidth = 1 / 3; g.beginPath(); g.arc(x, y, 1.5 + ph * 14, 0, TAU); g.stroke(); g.globalAlpha = 1; }
    }
    for (const w of G.wires) drawArc(w, w.tips, now);
    if (G.lampOn && G.allT < 0 && (G.stun <= 0 || CALM || Math.floor(G.stun * 4) % 2)) { dot(G.lx + Math.cos(G.ang) * .33, G.ly + Math.sin(G.ang) * .33, 1.33, 'rgba(255,246,200,.6)'); dot(G.lx + Math.cos(G.ang) * .33, G.ly + Math.sin(G.ang) * .33, .67, '#ffffff'); }
    fx.draw(g);
    if (G.flash > .5 && !frozen()) { g.fillStyle = 'rgba(210,230,255,.08)'; g.fillRect(0, 0, W, H); }
    if (G.bang > 0) { g.fillStyle = `rgba(226,240,255,${((CALM ? .25 : .85) * G.bang).toFixed(2)})`; g.fillRect(0, 0, W, H); }
  }

  /* ---------- 9. input + run. Mouse: hover to lead the fixer (the lamp follows the pointer); finger: drag and it walks to a point just above the
     finger (never under it), lift and it stops; tap a spot and it walks there; keys: walk. ---------- */
  window.FUSES = { get G() { return G; }, TUNE, flip };                          /* debug handle */
  R.run({
    reset, update, draw, grade, stats, bot,
    ended() {                                                                     /* the whistle: the wires go quiet; a full fix floods the room with light */
      for (const w of G.wires) { w.dead = true; w.s = 0; }
      if (G.flipped === TUNE.n) { G.allT = 0; G.hdrT = G.hdrT.map(t => Math.max(t, 0)); }
    },
    down(x, y, ev) { G.mode = 'ptr'; G.tx = x; G.ty = y - (ev.pointerType === 'touch' ? FINGER : 0); },
    move(x, y, ev) { if (ev.pointerType === 'mouse' || R.ptr.down) { G.mode = 'ptr'; G.tx = x; G.ty = y - (ev.pointerType === 'touch' ? FINGER : 0); } },
    up(x, y, ev, tap) {                                                           /* a tap walks to the spot; letting go of a drag stops */
      if (!G || ev.pointerType === 'mouse') return;
      if (tap && R.live) { G.mode = 'ptr'; G.tx = x; G.ty = y; } else { G.tx = G.x; G.ty = G.y; }
    },
  });
})();
