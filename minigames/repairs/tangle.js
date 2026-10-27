/* ============================================================
   THE GREAT RIBBON TANGLE (repair "tangle", verb UNTANGLE, 40 s, long): a planar untangle puzzle on the ribbon rack.
   Every machine's ribbon got knotted together. Spools in the six desk colours hang on a pegboard, joined by two-tone ribbons that
   sag between them; every crossing (or a ribbon caught under a spool) is a red knot. Drag spools until nothing crosses. Two tangles
   per repair, the second bigger; the clock stops while one reels out and the next drops in.
   Puzzles are generated solvable: spread the spools out, lay ribbons greedily (shortest first, never crossing), keep a spanning tree
   plus extras, then scramble the spools (never into one that a single spool put home would solve, nor with its knots in a heap).
   Grade = .55 × knots undone (per tangle, weighted by spools) + only when both are clear .45 × (.5 × speed + .5 × move economy),
   speed = (time left / 62% of the clock)^1.5, capped at 1; move economy = (par / moves)^1.5, capped at 1, par = 60% of the spools,
   so a fast flail with three times par in moves tops out at FIXED; PERFECT wants a quick and tidy solve.
   Level: more spools (5 + 6 → 6 + 7), more ribbons (6 + 8 → 9 + 11), a messier scramble.
   Controls: drag a spool (mouse / finger: one finger owns the carry; on touch the spool rides just above the fingertip so it stays
   in sight); keys: Space or Tab picks the next spool (Shift+Tab / Q the last; it sets down the one in hand), arrows / WASD carry it
   (nudging one spool is one move, however many nudges).
   Layout: 1 sprites · 2 setup · 3 tuning + puzzle maker · 4 state · 5 verbs · 6 update · 7 bot · 8 draw · 9 run.
   ============================================================ */
(() => {
  'use strict';
  const { clamp, lerp, sfx } = MG;
  const { R: AR, DEF, shapes: { ell, sub } } = MGArt, { make, hl, cvs, text, textW } = MGArt3;
  const TAU = Math.PI * 2, SPIN = 8, q3 = v => Math.round(v * 3) / 3;

  /* ---------- 1. sprites that don't need the desk colour (hi-res: 3 px per unit, draw with st.hi) ---------- */
  /* a spool face-on, 15x15 units (the kit's parts.spool plus winding grooves), its hub turned k/SPIN of a third of a turn so it can spin */
  const spoolSpr = (ramp, k) => make(45, 45, px => {
    px.shape(ell(22.5, 22.5, 21, 21), AR.metal, 1); px.shape(ell(22.5, 22.5, 17.4, 17.4), ramp, 2);
    for (let y = 0; y < 45; y++) for (let x = 0; x < 45; x++) { const d = Math.hypot(x - 22, y - 22); if ((d > 12.4 && d < 13.4) || (d > 15.4 && d < 16.3 && (x * 7 + y * 3) % 4)) px.tone(x, y, 0); }   /* wound layers */
    px.shape(ell(22.5, 22.5, 7.4, 7.4), AR.metal, 3); px.shape(ell(22.5, 22.5, 2.4, 2.4), AR.ink, 4);
    for (let i = 0; i < 3; i++) { const a = (k / SPIN + i) * TAU / 3; px.shape(ell(22.5 + Math.sin(a) * 4.7, 22.5 - Math.cos(a) * 4.7, 1.4, 1.4), AR.ink, 4); }
    hl(px, 9, 7, 6, 2, 2);
  });
  const SPR = new Map(), spoolImg = (ramp, k) => { const key = ramp * SPIN + k; if (!SPR.has(key)) SPR.set(key, spoolSpr(ramp, k)); return SPR.get(key); };
  /* a knot: three red loops snarled together; frame 1 is the pulse */
  const KNOT = [1, 1.13].map(s => make(24, 24, px => {                                          /* 8x8 units, centred */
    const ring = (cx, cy, rx, ry, w) => { cx = 12 + (cx - 12) * s; cy = 12 + (cy - 12) * s; return sub(ell(cx, cy, rx * s, ry * s), ell(cx, cy, rx * s - w, ry * s - w)); };
    px.shape(ring(9.6, 12.8, 6.4, 5.1, 2.2), AR.red, 1); px.shape(ring(14, 10, 5.3, 5.6, 2.2), AR.red, 2); px.shape(ring(12, 14.8, 5.9, 4, 2.1), AR.red, 3);
    px.shape(ell(12, 12, 2, 2), AR.red, 4);
  }));
  /* ribbon colours: the six desks, then deep leaf green for a seventh spool (orange read as the amber desk). r = ramp id for sprites, c = [shadow, base, light] */
  const PAL = [...MGRepair.DESKS.map((d, i) => ({ r: MGRepair.deskR(i), c: d.ramp })), { r: AR.leaf, c: DEF.leaf }];

  /* ---------- 2. setup: stage, HUD, timer, shell, VERB slam. Everything else comes back on R. ---------- */
  const R = MGRepair.setup({
    id: 'tangle', verb: 'UNTANGLE', scoreIcon: KNOT[0], cursor: 'grab',
    how: 'Drag the spools till <em>no ribbons cross</em>',
    legend: [[spoolImg(PAL[1].r, 0), '<em>drag</em> the spools'], [KNOT[0], 'every crossing is a <em>knot</em>']],
    hint: 'drag · Space picks a spool, arrows carry it',
  });
  const { st, g, W, H, ui, fx, rng, level: LV } = R;

  /* the ribbon rack, painted once: the Floor's green wall, a wooden frame round a pegboard, floorboards below where the fixer stands */
  const TOP = 16, BOT = 139, FOOT = 157, X0 = 11, X1 = W - 11, Y0 = TOP + 10, Y1 = BOT - 10, BOARD = ['#2e1d10', '#3d2716', '#4f341e'];
  const ROOM = cvs(W * 3, H * 3, x => {
    x.scale(3, 3); const r = (c, a, b, w, hh) => { x.fillStyle = c; x.fillRect(a, b, w, hh); }, s = MG.seeded(29);
    r('#12402a', 0, 0, W, TOP); for (let sx = 0; sx < W; sx += 8) r('#0f3824', sx, 0, 4, TOP); r('rgba(0,0,0,.3)', 0, 0, W, TOP);
    r('#1a0f14', 0, TOP - 1.67, W, BOT - TOP + 3);
    r('#8a5a2b', 0, TOP - 1.33, W, BOT - TOP + 2.33); r('#b57d3e', 0, TOP - 1.33, W, .67); r('#5a3517', 0, BOT + .33, W, .67);
    r('#1a0f14', 2, TOP + 1, W - 4, BOT - TOP - 1.67); r(BOARD[1], 2.33, TOP + 1.33, W - 4.67, BOT - TOP - 2.33);
    for (let k = 0; k < 220; k++) r(s() < .5 ? BOARD[0] : BOARD[2], 3 + Math.floor(s() * (W - 8) * 3) / 3, TOP + 2 + Math.floor(s() * (BOT - TOP - 5) * 3) / 3, .67 + Math.floor(s() * 4) / 3, 1 / 3);   /* fibre flecks */
    for (let y = TOP + 5; y < BOT - 3; y += 6) for (let hx = 5; hx < W - 4; hx += 6) { r('#140b06', hx, y, 1, 1); r(BOARD[2], hx, y + 1, 1, .33); }                                              /* peg holes */
    r('rgba(0,0,0,.4)', 2.33, TOP + 1.33, W - 4.67, 1); r('rgba(0,0,0,.25)', 2.33, TOP + 1.33, 1, BOT - TOP - 2.33);                                                                                 /* the frame's shadow */
    for (let y = BOT + 1, i = 0; y < H; y += 5 + i * .67, i++) {                                                                                                                                         /* floorboards, nearer ones taller */
      const bh = 5 + i * .67; r(['#4a2a12', '#5a3517', '#523015'][i % 3], 0, y, W, bh); r('#6a4120', 0, y, W, .67); r('#2a170b', 0, y + bh - .67, W, .67);
      for (let sx = (i * 37) % 31; sx < W; sx += 31 + i * 2) r('#2a170b', sx, y, .67, bh);
    }
    r('rgba(0,0,0,.35)', 0, BOT + 1, W, 2.33);
  });

  /* ---------- 3. tuning: every number the level (0..1) moves, in one place ---------- */
  const N1 = LV < .75 ? 5 : 6, N2 = LV < .6 ? 6 : 7;
  const TUNE = {
    tangles: [[N1, Math.round(N1 * lerp(1.2, 1.5, LV))], [N2, Math.round(N2 * lerp(1.33, 1.6, LV))]],   /* [spools, ribbons]: 5/6 + 6/8 at level 0, 5/7 + 6/9 at .5, 6/9 + 7/11 at 1 */
    mess: lerp(1.05, 1.15, LV),                                 /* a scramble starts with about mess × ribbons knots */
    sag: d => clamp(1.5 + d * .05, 1.5, 5),                     /* how far a ribbon droops between its spools (units) */
    grab: 11, gap: 16, snag: 5, keys: 62, rise: 8,              /* grab reach; spools keep this far apart; a ribbon this close under a spool is caught on it; key speed; a finger carries its spool this far above the tip */
    fast: .62, grow: 1.5,                                       /* the full speed bonus needs 62% of the clock left when the last tangle clears; it falls off as left^grow */
    par: .6, neat: 1.5,                                         /* par moves = 60% of the spools; move economy = (par / moves)^neat */
  };

  /* the puzzle maths. A ribbon is a quadratic curve sagging 'sag' below its chord; logic tests it as a 12-piece polyline [x0, y0, x1, y1, ...] */
  const SEG = 12;
  function curve(ax, ay, bx, by, sag = TUNE.sag(Math.hypot(bx - ax, by - ay))) {
    const cx = (ax + bx) / 2, cy = (ay + by) / 2 + 2 * sag, P = new Array(2 * SEG + 2);
    for (let i = 0; i <= SEG; i++) { const t = i / SEG, u = 1 - t; P[2 * i] = u * u * ax + 2 * u * t * cx + t * t * bx; P[2 * i + 1] = u * u * ay + 2 * u * t * cy + t * t * by; }
    return P;
  }
  const side = (ax, ay, bx, by, px, py) => (bx - ax) * (py - ay) - (by - ay) * (px - ax);
  function meets(P, Q, out) {                                   /* proper crossings of two polylines (their points go to out) */
    let n = 0;
    for (let i = 0; i < P.length - 2; i += 2) {
      const ax = P[i], ay = P[i + 1], bx = P[i + 2], by = P[i + 3];
      for (let j = 0; j < Q.length - 2; j += 2) {
        const cx = Q[j], cy = Q[j + 1], dx = Q[j + 2], dy = Q[j + 3];
        if (Math.max(ax, bx) < Math.min(cx, dx) || Math.max(cx, dx) < Math.min(ax, bx) || Math.max(ay, by) < Math.min(cy, dy) || Math.max(cy, dy) < Math.min(ay, by)) continue;
        const d1 = side(ax, ay, bx, by, cx, cy), d2 = side(ax, ay, bx, by, dx, dy), d3 = side(cx, cy, dx, dy, ax, ay), d4 = side(cx, cy, dx, dy, bx, by);
        if (d1 * d2 < 0 && d3 * d4 < 0) { n++; if (out) { const t = d3 / (d3 - d4); out.push([ax + (bx - ax) * t, ay + (by - ay) * t]); } }
      }
    }
    return n;
  }
  function near(P, x, y) {                                      /* [distance, nearest x, nearest y] from a point to a polyline */
    let best = 1e9, nx = 0, ny = 0;
    for (let i = 0; i < P.length - 2; i += 2) {
      const ax = P[i], ay = P[i + 1], vx = P[i + 2] - ax, vy = P[i + 3] - ay, t = clamp(((x - ax) * vx + (y - ay) * vy) / (vx * vx + vy * vy || 1), 0, 1), qx = ax + vx * t, qy = ay + vy * t, d = Math.hypot(x - qx, y - qy);
      if (d < best) { best = d; nx = qx; ny = qy; }
    }
    return [best, nx, ny];
  }
  const gapOf = (P, Q) => { let m = 1e9; for (let i = 0; i < P.length; i += 2) m = Math.min(m, near(Q, P[i], P[i + 1])[0]); for (let j = 0; j < Q.length; j += 2) m = Math.min(m, near(P, Q[j], Q[j + 1])[0]); return m; };
  /* knots: ribbons that cross (two that share a spool can't) plus ribbons running under a spool that isn't theirs */
  function knotsOf(pos, edges, list) {
    const C = edges.map(([a, b]) => curve(pos[a].x, pos[a].y, pos[b].x, pos[b].y));
    let n = 0;
    for (let i = 0; i < edges.length; i++) for (let j = i + 1; j < edges.length; j++) {
      const [a, b] = edges[i], [c, d] = edges[j];
      if (a === c || a === d || b === c || b === d) continue;
      const pts = list ? [] : null; n += meets(C[i], C[j], pts);
      if (list) pts.forEach((p, k) => list.push({ key: `${i}x${j}.${k}`, x: p[0], y: p[1], e: [i, j] }));
    }
    for (let i = 0; i < edges.length; i++) for (let s = 0; s < pos.length; s++) {
      if (s === edges[i][0] || s === edges[i][1]) continue;
      const [d, x, y] = near(C[i], pos[s].x, pos[s].y);
      if (d < TUNE.snag) {
        n++; if (!list) continue;
        /* mark it where the ribbon goes under the spool's rim (the end nearer the ribbon's middle), so the spool itself stays visible */
        const [a, b] = edges[i], ux = pos[b].x - pos[a].x, uy = pos[b].y - pos[a].y, l = Math.hypot(ux, uy) || 1, h = Math.sqrt(Math.max(0, 42 - d * d)), mx = (pos[a].x + pos[b].x) / 2, my = (pos[a].y + pos[b].y) / 2;
        const p1 = [x + ux / l * h, y + uy / l * h], p2 = [x - ux / l * h, y - uy / l * h], p = Math.hypot(p1[0] - mx, p1[1] - my) < Math.hypot(p2[0] - mx, p2[1] - my) ? p1 : p2;
        list.push({ key: `${i}s${s}`, x: p[0], y: p[1], e: [i], s });
      }
    }
    return n;
  }
  /* best-candidate sampling: n points over a box, each the farthest of `tries` random picks from those already placed */
  function spread(n, x0, y0, x1, y1, tries) {
    const P = [];
    for (let i = 0; i < n; i++) {
      let best = null, bd = -1;
      for (let k = 0; k < tries; k++) { const x = rng(x0, x1), y = rng(y0, y1), d = P.reduce((m, p) => Math.min(m, Math.hypot(p.x - x, p.y - y)), 1e9); if (d > bd) { bd = d; best = { x, y }; } }
      P.push(best);
    }
    return P;
  }
  const minGap = P => { let m = 1e9; for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) m = Math.min(m, Math.hypot(P[i].x - P[j].x, P[i].y - P[j].y)); return m; };
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng(i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  /* a solvable tangle: spread the spools, lay ribbons shortest first (never crossing, never under a spool, never hugging another ribbon,
     never leaving a spool at a sliver angle to a sibling), keep a random spanning tree plus extras, then scramble into a mess */
  function makeTangle(n, e, cols) {
    let pick = null;
    for (let tries = 0; tries < 150; tries++) {
      const T = spread(n, X0 + 5, Y0 + 3, X1 - 5, Y1 - 5, 40), pairs = [], ok = [], C = [];
      for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) { const d = Math.hypot(T[a].x - T[b].x, T[a].y - T[b].y); if (d < 80) pairs.push([a, b, d]); }
      pairs.sort((p, q) => p[2] - q[2]);
      for (const [a, b] of pairs) {
        const P = curve(T[a].x, T[a].y, T[b].x, T[b].y);
        if (T.some((p, s) => s !== a && s !== b && near(P, p.x, p.y)[0] < 9)) continue;
        if (ok.some(([c, d], k) => {
          const v = c === a || c === b ? c : d === a || d === b ? d : -1;
          if (v < 0) return meets(P, C[k]) > 0 || gapOf(P, C[k]) < 4;
          const o1 = v === a ? b : a, o2 = v === c ? d : c, ux = T[o1].x - T[v].x, uy = T[o1].y - T[v].y, wx = T[o2].x - T[v].x, wy = T[o2].y - T[v].y;
          return (ux * wx + uy * wy) / Math.hypot(ux, uy) / Math.hypot(wx, wy) > .9;
        })) continue;
        ok.push([a, b]); C.push(P);
      }
      const root = [...Array(n).keys()], find = i => root[i] === i ? i : (root[i] = find(root[i])), edges = [], rest = [];
      for (const ed of shuffle(ok.slice())) { const ra = find(ed[0]), rb = find(ed[1]); if (ra !== rb) { root[ra] = rb; edges.push(ed); } else rest.push(ed); }
      if (edges.length < n - 1) continue;
      while (edges.length < e && rest.length) edges.push(rest.pop());
      const want = Math.max(3, Math.round(edges.length * TUNE.mess)); let best = null;
      for (let k = 0; k < 40; k++) {
        const S = shuffle(spread(n, X0, Y0, X1, Y1, 6));
        if (minGap(S) < TUNE.gap + 3) continue;
        const L = [], kn = knotsOf(S, edges, L), home = S.filter((p, i) => Math.hypot(p.x - T[i].x, p.y - T[i].y) < 14).length; let score = Math.abs(kn - want) + home * 2 + (kn < 3 ? 20 : 0);
        for (let a = 0; a < L.length; a++) for (let b = a + 1; b < L.length; b++) if (Math.hypot(L[a].x - L[b].x, L[a].y - L[b].y) < 5) score += .5;   /* knots in a heap read badly: spread them */
        if (best && score >= best.score) continue;
        const easy = S.some((p, i) => knotsOf(S.map((q, j) => j === i ? T[i] : q), edges) === 0);   /* one spool put home would undo it all: a one-move puzzle */
        if (easy) score += 12;
        if (!best || score < best.score) best = { S, kn, score, easy };
      }
      if (!best) continue;
      const full = edges.length >= e && best.kn >= Math.ceil(want * .7) && !best.easy;       /* every ribbon asked for, a proper mess, more than one move deep */
      if (!pick || (full && !pick.full) || (full === pick.full && edges.length + best.kn > pick.edges.length + pick.kn)) pick = { T, edges, S: best.S, kn: best.kn, full };
      if (full) break;
    }
    if (!pick) { const T = spread(n, X0, Y0, X1, Y1, 40); pick = { T, edges: T.slice(1).map((p, i) => [i, i + 1]), S: T, kn: 0 }; }   /* never seen: a calm rack, not a crash */
    return { n, edges: pick.edges, target: pick.T, start: pick.S, k0: pick.kn, cols, t0: 0, time: 0 };
  }
  const colsFor = n => [R.desk, ...shuffle([0, 1, 2, 3, 4, 5].filter(i => i !== R.desk)), 6].slice(0, n);   /* the problem desk's colour always plays */

  /* ---------- 4. state: everything a run changes lives in G, rebuilt by reset() (also on standalone AGAIN) ---------- */
  let G;
  function reset() {
    const tangles = TUNE.tangles.map(([n, e]) => makeTangle(n, e, colsFor(n)));
    G = {
      tangles, ti: 0, sp: [], ed: [], knots: [], k: 0, age: {}, dirty: true,      /* the tangle on the rack: spools, ribbons, knots now (age: how long each knot has shown) */
      phase: 'play', pt: 0, clock: 0, drag: null, sel: -1, keyT: 0, keyed: false, mouse: false, /* phase: play | clear (it reels out) | drop (the next falls in) */
      moves: 0, par: tangles.reduce((s, T) => s + Math.ceil(T.n * TUNE.par), 0), lastKey: -1, cleared: 0, left: 0, snd: 0,   /* lastKey: the spool the keys last carried (more nudges are the same move) */
      mx: 20, mvx: 0, face: 1, walk: 0, cheer: 0, scare: 0,                       /* the fixer on the floor */
      bot: { wait: 0, job: null, ph: '' }, gone: [],                              /* gone: the last tangle's spools flying off */
    };
    load(0, false);
  }
  function load(i, fall) {
    const T = G.tangles[i];
    G.ti = i; G.phase = fall ? 'drop' : 'play'; G.pt = 0; G.sel = G.lastKey = -1; G.drag = null; G.knots = []; G.age = {}; T.t0 = G.clock;
    G.sp = T.start.map((p, j) => ({ x: p.x, y: fall ? -12 - j * 8 : p.y, ty: p.y, vy: fall ? 90 : 0, landed: !fall, col: PAL[T.cols[j]], spin: rng(TAU), lift: 0, hop: 0 }));
    G.ed = T.edges.map(([a, b]) => ({ a, b, s: 2, v: fall ? 0 : rng(-40, 40) }));
    for (const s of G.sp) for (let k = 0; k < SPIN; k++) spoolImg(s.col.r, k);   /* paint the spin frames now, not mid-drag */
    if (fall) ui.setScore(T.k0); else recount(true);
  }
  /* re-read the knots; new ones snag, vanished ones pop (when not silent). snap: a fresh tangle's knots pull tight one by one, left to right */
  function recount(silent, snap) {
    const T = G.tangles[G.ti], list = [], age = {};
    G.k = knotsOf(G.sp, T.edges, list); G.dirty = false;
    /* knots that bunch up (crossings beside a spool, snags on one rim) are drawn pushed apart, up to 3 units off the true spot, so each reads */
    for (const k of list) { k.px = k.x; k.py = k.y; }
    for (let it = 0; it < 5; it++) for (let a = 0; a < list.length; a++) for (let b = a + 1; b < list.length; b++) {
      const p = list[a], q = list[b], dx = q.px - p.px, dy = q.py - p.py, d = Math.hypot(dx, dy); if (d >= 6) continue;
      const ux = d > .01 ? dx / d : 1, uy = d > .01 ? dy / d : 0, m = (6 - d) / 2;
      p.px -= ux * m; p.py -= uy * m; q.px += ux * m; q.py += uy * m;
      for (const o of [p, q]) { const ox = o.px - o.x, oy = o.py - o.y, l = Math.hypot(ox, oy); if (l > 3) { o.px = o.x + ox / l * 3; o.py = o.y + oy / l * 3; } }
    }
    if (snap) list.slice().sort((p, q) => p.x - q.x).forEach((k, i) => { age[k.key] = -.1 - i * .07; });
    else for (const k of list) age[k.key] = G.age[k.key] != null ? G.age[k.key] : 0;
    if (!silent && G.snd <= 0) {
      const gone = G.knots.filter(k => !(k.key in age)), born = list.filter(k => !(k.key in G.age));
      for (const k of gone) { fx.burst(k.px, k.py, ['#fff6d6', '#e86a50', '#ffd23a'], 6, 34, 60, .35); fx.ring(k.px, k.py, '#fff6d6', 7); }
      if (gone.length) { sfx.tone(880 + Math.min(4, gone.length) * 110, 1560, .07, 'triangle', .05); G.snd = .06; }
      else if (born.length) { sfx.tone(250, 160, .09, 'sawtooth', .03); G.snd = .06; }
    }
    G.knots = list; G.age = age; ui.setScore(G.k);
  }
  const fin = () => G.cleared + (G.phase === 'play' && G.k === 0 ? 1 : 0);                      /* untangled with a spool still in hand at the whistle counts */
  function grade() {
    const Ts = G.tangles, all = Ts.reduce((s, T) => s + T.n, 0), cl = fin(); let c = 0;
    Ts.forEach((T, i) => { if (i < cl) c += T.n; else if (i === G.ti && G.phase === 'play') c += T.n * clamp(1 - G.k / Math.max(1, T.k0), 0, 1); });
    if (cl < Ts.length) return .55 * c / all;
    const speed = Math.pow(clamp(G.left / (R.seconds * TUNE.fast), 0, 1), TUNE.grow), tidy = Math.pow(clamp(G.par / Math.max(1, G.moves), 0, 1), TUNE.neat);
    return .55 + .45 * (.5 * speed + .5 * tidy);
  }
  function stats() {
    let un = 0, tot = 0; const cl = fin();
    G.tangles.forEach((T, i) => { if (i <= G.ti) tot += T.k0; if (i < cl) un += T.k0; else if (i === G.ti && G.phase === 'play') un += Math.max(0, T.k0 - G.k); });
    return [['TANGLES', `${cl} / ${G.tangles.length}`], ['KNOTS UNDONE', `${un} / ${tot}`], [`MOVES · PAR ${G.par}`, G.moves], ['TIME LEFT', cl >= G.tangles.length ? `${Math.floor(G.left)}s` : '-']];
  }

  /* ---------- 5. verbs: pick up a spool, carry it, set it down (pointer, keys and bot all go through these) ---------- */
  function pick(x, y) {
    let best = -1, bd = TUNE.grab;
    G.sp.forEach((s, i) => { const d = Math.hypot(s.x - x, s.y - y); if (d < bd) { bd = d; best = i; } });
    return best;
  }
  function grab(i, ox = 0, oy = 0) {
    if (!R.live || G.phase !== 'play' || G.drag || i < 0) return false;
    const s = G.sp[i]; G.drag = { i, ox, oy, sx: s.x, sy: s.y, k0: G.k, run: 0 }; G.sel = i;
    sfx.clack(5); sfx.tone(420, 640, .05, 'square', .03); fx.puff(s.x, s.y + 6, '#9a7a5a', 2);
    return true;
  }
  function dragTo(x, y) {
    const D = G.drag; if (!D) return;
    const s = G.sp[D.i], nx = clamp(x, X0, X1), ny = clamp(y, Y0, Y1), d = Math.hypot(nx - s.x, ny - s.y);
    if (d < .01) return;
    s.spin += d / 6 * (nx < s.x ? -1 : 1); s.x = nx; s.y = ny; D.run += d; G.dirty = true;
    if (D.run > 9) { D.run = 0; sfx.noise(.025, .02, 2600); }                                     /* ribbon paying out */
    for (const e of G.ed) if (e.a === D.i || e.b === D.i) e.v += Math.min(d, 4) * 1.6;           /* its ribbons swing */
  }
  function settle(i) {                                                                             /* a spool set down on another slides off it */
    const s = G.sp[i];
    for (let it = 0; it < 8; it++) {
      let hit = false;
      G.sp.forEach((o, j) => {
        if (j === i) return; const dx = s.x - o.x, dy = s.y - o.y, d = Math.hypot(dx, dy); if (d >= TUNE.gap) return;
        const a = d > .01 ? Math.atan2(dy, dx) : rng(TAU); s.x = clamp(o.x + Math.cos(a) * (TUNE.gap + .5), X0, X1); s.y = clamp(o.y + Math.sin(a) * (TUNE.gap + .5), Y0, Y1); hit = true;
      });
      if (!hit) break;
    }
  }
  function drop() {
    const D = G.drag; if (!D) return; G.drag = null;
    const s = G.sp[D.i]; settle(D.i); G.dirty = true;
    if (Math.hypot(s.x - D.sx, s.y - D.sy) > 2 && !(D.key && G.lastKey === D.i)) { G.moves++; G.lastKey = D.key ? D.i : -1; }   /* key nudges of one spool are one move */
    s.hop = .2; sfx.thud(); sfx.clack(2); fx.puff(s.x, s.y + 7, '#9a7a5a', 3);
    if (!R.live) return;
    recount(false);
    const k = D.k0 - G.k;
    if (k >= 2 && G.k > 0) { ui.floatText(s.x, s.y - 12, `-${k} KNOTS`, 'gold'); sfx.ding(Math.min(4, k)); }
    else if (k < 0) G.scare = .6;
  }
  function cycle(dir) {                                                                            /* keys: pick the next spool, left to right (setting down one the keys carry) */
    if (!R.live || G.phase !== 'play' || (G.drag && !G.drag.key)) return;
    if (G.drag) drop(); G.lastKey = -1;
    const order = [...G.sp.keys()].sort((a, b) => G.sp[a].x - G.sp[b].x || G.sp[a].y - G.sp[b].y), at = order.indexOf(G.sel);
    G.sel = order[at < 0 ? (dir > 0 ? 0 : order.length - 1) : (at + dir + order.length) % order.length]; G.keyed = true;
    sfx.tick(); fx.ring(G.sp[G.sel].x, G.sp[G.sel].y, '#ffd23a', 11);
  }
  const busy = () => { const c = G.sp.map(() => 0), E = G.tangles[G.ti].edges; for (const k of G.knots) { for (const i of k.e) { c[E[i][0]]++; c[E[i][1]]++; } if (k.s != null) c[k.s] += 2; } return c; };
  const busiest = () => { const c = busy(); return c.indexOf(Math.max(...c)); };
  function solve() {
    const T = G.tangles[G.ti], last = G.ti === G.tangles.length - 1;
    G.cleared++; G.phase = 'clear'; G.pt = 0; G.sel = -1; T.time = G.clock - T.t0; G.cheer = 1.3;
    if (last) G.left = R.timer.left;
    MG.hitstop(.08); R.shake(2.5);
    [523, 659, 784, 1047].forEach((f, i) => sfx.tone(f, f, .1, 'triangle', .06, i * .06));
    for (const e of G.ed) { const A = G.sp[e.a], B = G.sp[e.b]; fx.burst((A.x + B.x) / 2, (A.y + B.y) / 2 + e.s, [A.col.c[2], B.col.c[2], '#fff6d6'], 4, 30, 40, .4); }
    if (last) R.end();                                                                             /* the kit stings FIXED / PERFECT */
    else { ui.say('UNTANGLED!<small>here comes a bigger one</small>', 'good'); fx.confetti(W / 2, H * .4, 16); }
  }

  /* ---------- 6. update (fixed 60 Hz). R.live is false once end() was called: stop scoring, let things settle ---------- */
  const REEL = [.25, .65], CLEAR = .7;                                                             /* a cleared tangle: glows, reels in (REEL), then its spools fly off */
  function update(dt) {
    const live = R.live; G.pt += dt; if (live) G.clock += dt;
    if (live && G.phase !== 'play') R.timer.add(dt);                                               /* the clock stops between tangles */
    G.cheer = Math.max(0, G.cheer - dt); G.scare = Math.max(0, G.scare - dt); G.snd = Math.max(0, G.snd - dt);
    /* keys: arrows / WASD carry the picked spool (the busiest one if none is picked) */
    const ax = R.axisX(), ay = R.axisY();
    if (live && G.phase === 'play' && (ax || ay) && (!G.drag || G.drag.key)) {
      if (!G.drag) { if (G.sel < 0) G.sel = busiest(); grab(G.sel); G.drag.key = true; G.keyed = true; }
      const s = G.sp[G.drag.i], m = TUNE.keys * dt / Math.hypot(ax, ay); dragTo(s.x + ax * m, s.y + ay * m); G.keyT = .25;
    } else if (G.drag && G.drag.key && (G.keyT -= dt) <= 0) drop();
    /* spools: falling in with a bounce, lifting while carried, the drop hop */
    for (const s of G.sp) {
      if (!s.landed) {
        s.vy += 760 * dt; s.y += s.vy * dt;
        if (s.y >= s.ty) { s.y = s.ty; if (s.vy > 120) { s.vy *= -.28; sfx.thud(); fx.puff(s.x, s.y + 7, '#9a7a5a', 3); } else { s.vy = 0; s.landed = true; s.hop = .15; } }
      }
      s.hop = Math.max(0, s.hop - dt); s.lift = lerp(s.lift, G.drag && G.sp[G.drag.i] === s ? 1 : 0, Math.min(1, dt * 16));
      if (G.phase === 'clear') s.spin += dt * (G.pt > REEL[0] && !(R.done && G.cleared >= G.tangles.length) ? 26 : 3);
    }
    for (const o of G.gone) { o.vy -= 600 * dt; o.y += o.vy * dt; o.x += o.vx * dt; o.spin += dt * 30; }
    G.gone = G.gone.filter(o => o.y > -12);
    /* ribbons: a damped spring on the sag. Taut while a cleared tangle glows; slack when the time ran out */
    const taut = G.phase === 'clear', limp = R.done && !R.won;
    for (const e of G.ed) {
      const A = G.sp[e.a], B = G.sp[e.b], want = taut ? .4 : TUNE.sag(Math.hypot(B.x - A.x, B.y - A.y)) * (limp ? 1.6 : 1);
      e.v += ((want - e.s) * 170 - e.v * 9) * dt; e.s = clamp(e.s + e.v * dt, -3, 9); e.w = want;
    }
    if (G.phase === 'play') {
      if (live && G.dirty) recount(false);
      let n = 0;
      for (const k of G.knots) {
        const a = G.age[k.key]; G.age[k.key] += dt;
        if (a < 0 && a + dt >= 0) { n++; fx.burst(k.px, k.py, ['#e86a50', '#fff6d6'], 3, 26, 40, .25); }               /* a knot pulls tight */
      }
      if (n) { sfx.tone(300 + G.knots.filter(k => G.age[k.key] >= 0).length * 35, 170, .06, 'sawtooth', .035); sfx.clack(1); }
      if (live && G.k === 0 && !G.drag) solve();
    } else if (G.phase === 'drop') {
      if (G.sp.every(s => s.landed) && G.pt > .45) { G.phase = 'play'; G.tangles[G.ti].t0 = G.clock; recount(true, true); R.shake(1.5); }
    } else if (G.phase === 'clear' && G.ti < G.tangles.length - 1 && !R.done) {                             /* reel the cleared ribbons home, the spools fly off, the next tangle falls in */
      if (G.pt - dt < REEL[0] && G.pt >= REEL[0]) { sfx.tone(180, 900, .4, 'sawtooth', .02); sfx.noise(.35, .03, 1800); }
      if (G.pt >= CLEAR) {
        G.gone = G.sp.map(s => ({ x: s.x, y: s.y, vx: rng(-25, 25), vy: -rng(90, 150), spin: s.spin, col: s.col }));
        for (const s of G.sp) fx.puff(s.x, s.y + 4, '#fff6d6', 2);
        sfx.noise(.2, .05, 3000); sfx.tone(500, 1400, .18, 'triangle', .04); sfx.tone(700, 300, .3, 'square', .025, .15);
        load(G.ti + 1, true);
      }
    }
    /* the fixer follows the spool in hand along the floor */
    const tx = G.drag ? G.sp[G.drag.i].x : G.mx, want = live ? clamp((clamp(tx, 10, W - 10) - G.mx) * 7, -75, 75) : 0;
    G.mvx = lerp(G.mvx, want, Math.min(1, dt * 14)); G.mx = clamp(G.mx + G.mvx * dt, 10, W - 10);
    if (Math.abs(G.mvx) > 5) { G.walk += Math.abs(G.mvx) * dt; G.face = Math.sign(G.mvx); }
  }

  /* ---------- 7. bot (?bot=1): plays like a person who has spotted how it untangles. It studies each new tangle (longer for more ribbons),
     then moves one spool at a time: the one on the most knots, to a free spot of a planar layout it has worked out, along a slightly bowed
     path at hand speed, with a reach delay, a pause to look between moves and a little aim error. Now and then it just tries a knotted
     spool somewhere nearby, or fumbles one into the wrong place; both cost time and moves. Grades land around .7-.9. ---------- */
  function bot(dt) {
    const B = G.bot;
    if (B.ph !== G.phase) { B.ph = G.phase; if (G.phase === 'play') B.wait = rng(1.3, 2) + G.ed.length * rng(.14, .22); }
    if (!R.live || G.phase !== 'play') return;
    const J = B.job;
    if (J) {
      if (!G.drag) { B.job = null; return; }
      J.t += dt; if (J.t < 0) return;
      const k = clamp(J.t / J.dur, 0, 1), e = k * k * (3 - 2 * k), bow = Math.sin(k * Math.PI) * J.bow;
      dragTo(lerp(J.fx, J.tx, e) - J.ny * bow, lerp(J.fy, J.ty, e) + J.nx * bow);
      if (k >= 1) { drop(); B.job = null; B.wait = rng(.75, 1.4) + G.k * .05; }   /* a look round: longer while it's still a mess */
      return;
    }
    if (G.k === 0 || (B.wait -= dt) > 0) return;
    const T = G.tangles[G.ti], c = busy(), free = i => G.sp.every((o, j) => j === i || Math.hypot(o.x - T.target[i].x, o.y - T.target[i].y) > TUNE.gap);
    let cand = G.sp.map((s, i) => ({ i, d: Math.hypot(s.x - T.target[i].x, s.y - T.target[i].y), k: c[i] })).filter(o => o.d > 4);
    if (!cand.length) cand = c.map((k, i) => ({ i, d: 1, k })).filter(o => o.k > 0);
    if (!cand.length) return;
    cand.sort((a, b) => b.k - a.k || b.d - a.d);
    let p = cand.find(o => free(o.i)), aside = null;
    if (!p) {                                                                                      /* every wanted spot is taken: clear one first */
      const o = cand[0], tg = T.target[o.i], occ = G.sp.findIndex((q, j) => j !== o.i && Math.hypot(q.x - tg.x, q.y - tg.y) <= TUNE.gap);
      p = { i: occ >= 0 ? occ : o.i };
      if (occ >= 0) { let bd = -1; for (let k = 0; k < 24; k++) { const x = rng(X0, X1), y = rng(Y0, Y1), d = Math.min(...G.sp.map(q => Math.hypot(q.x - x, q.y - y)), ...T.target.map(q => Math.hypot(q.x - x, q.y - y))); if (d > bd) { bd = d; aside = { x, y }; } } }
    }
    const roll = rng(), knotted = cand.filter(o => o.k > 0);
    if (roll < .1 && knotted.length) p = knotted[Math.floor(rng(knotted.length))];                 /* a try: shove a knotted spool somewhere */
    const s = G.sp[p.i];
    let tx = aside ? aside.x : T.target[p.i].x, ty = aside ? aside.y : T.target[p.i].y;
    if (roll < .1 && knotted.length) { const a = rng(TAU), r = rng(15, 30); tx = s.x + Math.cos(a) * r; ty = s.y + Math.sin(a) * r; }
    else if (roll < .19) { const a = rng(TAU), r = rng(12, 22); tx += Math.cos(a) * r; ty += Math.sin(a) * r; }   /* a fumble */
    else { tx += rng(-2.5, 2.5); ty += rng(-2.5, 2.5); }
    tx = clamp(tx, X0, X1); ty = clamp(ty, Y0, Y1);
    const L = Math.hypot(tx - s.x, ty - s.y) || 1;
    if (!grab(p.i)) return;
    G.drag.bot = true;
    B.job = { fx: s.x, fy: s.y, tx, ty, nx: (tx - s.x) / L, ny: (ty - s.y) / L, bow: rng(-5, 5), t: -rng(.15, .3), dur: clamp(L / rng(55, 85), .35, 1.5) };
  }

  /* ---------- 8. draw: back to front. Units, 1/3-unit precision; st.hi() for hi-res sprites.
     The pixel stamps of one colour go into one path and one fill (rects on the 1/3 grid stay crisp): far cheaper than a fillRect each ---------- */
  const oval = (cx, cy, rx, ry, col) => {
    g.fillStyle = col; g.beginPath(); const n = Math.max(1, Math.round(ry * 3));
    for (let i = -n; i <= n; i++) { const yy = i / 3, w = rx * Math.sqrt(Math.max(0, 1 - (yy * yy) / (ry * ry))); if (w > 0) g.rect(q3(cx - w), q3(cy + yy), Math.round(w * 6) / 3, 1 / 3); }
    g.fill();
  };
  const ringAt = (cx, cy, r, col, sz = 2 / 3) => { g.fillStyle = col; g.beginPath(); const n = Math.max(8, Math.round(r * 2.2)); for (let i = 0; i < n; i++) { const a = i / n * TAU; g.rect(q3(cx + Math.cos(a) * r - sz / 2), q3(cy + Math.sin(a) * r - sz / 2), sz, sz); } g.fill(); };
  const drawn = s => ({ x: s.x, y: s.y - s.lift * 1.67 - Math.sin(Math.min(1, s.hop / .2) * Math.PI) * 1.2 });
  /* a ribbon: a flat band from spool A to spool B, A's colour to the middle and B's after, ink edges, the sheen on its upper side.
     It twists once in each half (pinches to an edge, then shows its other face: the sheen swaps sides). Stamped square by square along
     the curve so it stays crisp; a knotted ribbon is dull and kinked. f < 1 draws only f of it (reeling in). c: the context to paint on */
  const LANES = [[-1.17, 0, 2], [0, 1, 5], [1.17, 2, 2]], SADL = [[-1.17, 0, 2], [0, 0, 5], [1.17, 1, 2]];   /* [offset, ramp tone, width in hi-res px] */
  function ribbon(c, e, A, B, f, edge, sad) {
    const ax = A.x, ay = A.y, bx = B.x, by = B.y, sag = e.s, cx = (ax + bx) / 2, cy = (ay + by) / 2 + 2 * sag;
    const n = Math.max(6, Math.ceil((Math.hypot(bx - ax, by - ay) + Math.abs(sag) * 2) * 2.4)), tw = clamp(5 / Math.max(10, Math.hypot(bx - ax, by - ay)), .05, .12);
    let ux = -(by - ay), uy = bx - ax; if (uy > 0 || (uy === 0 && ux > 0)) { ux = -ux; uy = -uy; }
    const P = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n; if (f < 1 && t > f / 2 && t < 1 - f / 2) continue;
      const u = 1 - t, dx = 2 * u * (cx - ax) + 2 * t * (bx - cx), dy = 2 * u * (cy - ay) + 2 * t * (by - cy), l = Math.hypot(dx, dy) || 1;
      let nx = -dy / l, ny = dx / l; if (nx * ux + ny * uy < 0) { nx = -nx; ny = -ny; }
      let x = u * u * ax + 2 * u * t * cx + t * t * bx, y = u * u * ay + 2 * u * t * cy + t * t * by;
      if (sad) { const w = (i % 6 < 3 ? .33 : -.33); x += nx * w; y += ny * w; }
      const w = 1 - .6 * Math.max(0, 1 - Math.abs((t < .5 ? .25 : .75) - t) / tw), fl = t > .25 && t < .75 ? -1 : 1;   /* the twist: width, which face */
      P.push([x, y, nx * fl, ny * fl, t, 1 / (Math.abs(nx) + Math.abs(ny)), w]);
    }
    c.fillStyle = edge; c.beginPath();
    for (const [x, y, , , , k, w] of P) { const s = Math.max(2, Math.round(11 * k * w)) / 3; c.rect(q3(x - s / 2), q3(y - s / 2), s, s); }
    c.fill();
    for (let half = 0; half < 2; half++) {
      const col = (half ? B : A).col.c;
      for (const [off, tone, lw] of sad ? SADL : LANES) {
        c.fillStyle = col[tone]; c.beginPath();
        for (const [x, y, nx, ny, t, k, w] of P) { if ((t >= .5) !== !!half) continue; const s = Math.max(1, Math.round(lw * k * w)) / 3, o = off * w; c.rect(q3(x + nx * o - s / 2), q3(y + ny * o - s / 2), s, s); }
        c.fill();
      }
    }
  }
  /* ribbons at rest, away from the spool in hand, are painted once onto RIB and reused until one of them stirs or knots up */
  const RIB = cvs(W * 3, H * 3, x => x.scale(3, 3)), rg = RIB.getContext('2d'); let ribKey = '';
  const still = e => G.phase === 'play' && Math.abs(e.v) < 1.2 && Math.abs(e.s - e.w) < .08;
  function drawSpool(s, i, y, now) {
    const fr = ((Math.floor(s.spin / (TAU / 3) * SPIN) % SPIN) + SPIN) % SPIN;
    st.hi(spoolImg(s.col.r, fr), s.x - 7.5, y - 7.5);
    const hot = (G.keyed && G.sel === i && G.phase === 'play' && R.live) || (!G.drag && R.live && G.phase === 'play' && G.mouse && R.ptr.type === 'mouse' && pick(R.ptr.x, R.ptr.y) === i);
    if (hot || (G.drag && G.drag.i === i && !G.drag.bot)) {                                       /* picked / under the mouse: corner brackets */
      const c = Math.floor(now * 6) % 2 ? '#ffd23a' : '#fff6d6', r = 9.33;
      g.fillStyle = '#1a0f14'; for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { g.fillRect(q3(s.x + sx * r - (sx > 0 ? 3 : 0) - .33), q3(y + sy * r - (sy > 0 ? 1 : 0) - .33), 3.67, 1.67); g.fillRect(q3(s.x + sx * r - (sx > 0 ? 1 : 0) - .33), q3(y + sy * r - (sy > 0 ? 3 : 0) - .33), 1.67, 3.67); }
      g.fillStyle = c; for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { g.fillRect(q3(s.x + sx * r - (sx > 0 ? 3 : 0)), q3(y + sy * r - (sy > 0 ? 1 : 0)), 3, 1); g.fillRect(q3(s.x + sx * r - (sx > 0 ? 1 : 0)), q3(y + sy * r - (sy > 0 ? 3 : 0)), 1, 3); }
    }
  }
  function draw() {
    const now = performance.now() / 1000, last = G.ti === G.tangles.length - 1;
    st.hi(ROOM, 0, 0);
    const reel = G.phase === 'clear' && !last ? clamp(1 - (G.pt - REEL[0]) / (REEL[1] - REEL[0]), 0, 1) : 1, pos = G.sp.map(drawn);
    /* shadows on the board, then ribbons (the carried spool's last, so they lift over the rest), then spools, then knots on top */
    G.sp.forEach((s, i) => { if (s.landed || s.y > s.ty - 30) oval(s.x + 1 + s.lift * 1.5, (s.landed ? s.y : s.ty) + 2 + s.lift * 2, 7.2, 6.6, `rgba(8,4,2,${(.42 - s.lift * .14 - (s.landed ? 0 : .25 * (s.ty - s.y) / 30)).toFixed(2)})`); });
    const clip = G.phase === 'drop';                                                               /* a falling tangle comes in from behind the frame */
    if (clip) { g.save(); g.beginPath(); g.rect(2.33, TOP + 1.33, W - 4.67, BOT - TOP - 2.33); g.clip(); }
    if (reel > 0) {
      const hot = G.drag ? G.drag.i : -1, sad = new Set(); for (const k of G.knots) if (G.age[k.key] >= 0) for (const i of k.e) sad.add(i);
      const glow = G.phase === 'clear' && G.pt < .45 ? (Math.floor(G.pt * 16) % 2 ? '#fff6d6' : '#ffd23a') : '#1a0f14';
      const order = G.ed.map((e, i) => i).sort((a, b) => (G.ed[a].a === hot || G.ed[a].b === hot) - (G.ed[b].a === hot || G.ed[b].b === hot));
      const one = (c, i) => { const e = G.ed[i]; ribbon(c, e, { x: pos[e.a].x, y: pos[e.a].y, col: G.sp[e.a].col }, { x: pos[e.b].x, y: pos[e.b].y, col: G.sp[e.b].col }, reel, glow, G.phase === 'play' && sad.has(i)); };
      const rest = order.filter(i => { const e = G.ed[i]; return e.a !== hot && e.b !== hot && still(e); });
      let key = G.ti + glow;
      for (const i of rest) { const e = G.ed[i]; key += `|${i}${sad.has(i) ? 's' : ''}:${q3(pos[e.a].x)},${q3(pos[e.a].y)},${q3(pos[e.b].x)},${q3(pos[e.b].y)}`; }
      if (key !== ribKey) { ribKey = key; rg.clearRect(0, 0, W, H); for (const i of rest) one(rg, i); }
      if (rest.length) st.hi(RIB, 0, 0);
      for (const i of order) if (!rest.includes(i)) one(g, i);                                    /* the carried spool's last, so they lift over the rest */
    }
    G.sp.forEach((s, i) => { if (!(G.drag && G.drag.i === i)) drawSpool(s, i, pos[i].y, now); });
    if (G.drag) drawSpool(G.sp[G.drag.i], G.drag.i, pos[G.drag.i].y, now);
    if (clip) g.restore();
    for (const o of G.gone) st.hi(spoolImg(o.col.r, ((Math.floor(o.spin / (TAU / 3) * SPIN) % SPIN) + SPIN) % SPIN), o.x - 7.5, o.y - 7.5);
    if (G.phase === 'play') for (const k of G.knots) {                                            /* knots: a pulsing halo, then the snarl (popping in when new) */
      const a = G.age[k.key] || 0, ph = (now * 1.6 + k.x * .07 + k.y * .05) % 1;
      if (a < 0) continue;                                                                         /* not pulled tight yet */
      if (a < .4) ringAt(k.px, k.py, 3 + a * 15, `rgba(255,226,160,${(1 - a / .4).toFixed(2)})`);  /* a fresh knot pops */
      else ringAt(k.px, k.py, 3.67 + ph * 3, `rgba(255,214,90,${(.5 * (1 - ph)).toFixed(2)})`);
      const spr = KNOT[a < .12 || Math.floor(now * 3 + k.x * .1) % 2 ? 1 : 0]; st.hi(spr, k.px - 4, k.py - 4);
    }
    /* the fixer on the floor: arms up under the spool in hand, cheering a cleared tangle, aghast when a move makes it worse */
    oval(G.mx, FOOT + .33, 6.5, 1.67, 'rgba(10,6,4,.5)');
    const run = Math.abs(G.mvx) > 8, step = Math.floor(G.walk / 5) % 2;
    const pose = R.done ? (R.won ? 'cheer' : 'scared') : G.cheer > 0 ? 'cheer' : G.scare > 0 ? 'scared' : G.drag ? (run ? (step ? 'hold1' : 'hold2') : 'hold0') : run ? (step ? 'run1' : 'run2') : (Math.floor(now * 1.3) % 2 ? 'breathe' : 'idle');
    R.crew(G.mx, FOOT, pose, { flip: G.face < 0 });
    const lab = `TANGLE ${G.ti + 1} OF ${G.tangles.length}`, tw = textW(lab, 2 / 3), lx = W - 3.33 - tw;   /* which tangle, top right */
    text(g, lab, lx + .67, 7.33, '#1a0f14', 2 / 3); text(g, lab, lx, 6.67, G.cleared > G.ti ? '#7be05a' : '#ffd23a', 2 / 3);
    fx.draw(g);
  }

  /* ---------- 9. input + run ---------- */
  window.TANGLE = { get G() { return G; }, TUNE, knotsOf, makeTangle, grab, dragTo, drop };                   /* debug handle */
  R.run({
    reset, update, draw, grade, stats, bot,
    ended() {
      if (G.phase === 'play' && G.k === 0) { G.cleared++; G.phase = 'clear'; G.pt = 0; G.cheer = 1.3; G.knots = []; }   /* beat the whistle with a spool in hand */
      G.drag = null; if (!R.won) G.scare = 9;
    },
    /* the pointer that grabbed a spool owns it (a second finger can't take it over); on touch the spool slides up over the first 6 units of
       the drag to ride TUNE.rise above the fingertip, so a tap never shifts it */
    down(x, y, ev) {
      if (G.drag) return; const i = pick(x, y);
      if (i >= 0 && grab(i, G.sp[i].x - x, G.sp[i].y - y)) { Object.assign(G.drag, { pid: ev.pointerId, gx: x, gy: y, far: 0, rise: ev.pointerType === 'touch' ? TUNE.rise : 0 }); G.lastKey = -1; }
    },
    move(x, y, ev) {
      if (ev.pointerType === 'mouse') G.mouse = true;
      const D = G.drag; if (!D || D.pid !== ev.pointerId) return;
      D.far = Math.max(D.far, Math.hypot(x - D.gx, y - D.gy)); dragTo(x + D.ox, y + D.oy - D.rise * clamp(D.far / 6, 0, 1));
    },
    key(ev, k) { if (!ev.repeat && (k === ' ' || k === 'tab' || k === 'e' || k === 'q')) { ev.preventDefault(); cycle(ev.shiftKey || k === 'q' ? -1 : 1); } },
  });
  /* releases are heard here, not through the kit's up(): the kit tracks one pointer, so a second finger lifting first would swallow the carrying finger's release */
  const lift = ev => { if (G && G.drag && G.drag.pid === ev.pointerId) drop(); };
  addEventListener('pointerup', lift); addEventListener('pointercancel', lift);
})();
