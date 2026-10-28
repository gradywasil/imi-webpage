/* STORY SCENES, THE BUILDING: 2 first-word, and the machine chapters 4-8 (hibiscus, lagoon, honeycomb, orchid, moonflower).
   Every machine chapter shows the building turning from the last stage into the next on screen, and the new typewriter in its desk colour.
   Same rules as story-scenes-early.js: actors(t, w) is pure in t; world art pixels; x = 0 the middle of the building, y = 0 the ground.

   How the buildings change without a cut: the kit raises the NEW building with A.build (clipped bottom-up) while this file draws the OLD
   building (local copies of the kit's stage art, below) in the front layer, clipped above the same line: a renovation line sweeps up.
   The old building is drawn in the FRONT layer on purpose: the kit draws the lights of a clipped building (window mullions, glows) without
   the build clip, and the front-layer copy covers them. Build scenes force a day sky for the same reason. */
(function (G) {
  'use strict';
  const SK = G.StoryKit; if (!SK || !SK.help) return;
  const { seg, lerp, ease, FLOOR, rect, box, disc } = SK;
  const fr = SK.frame, R = SK.RAMP, INK = '#1a0f14', hash = SK.hash;
  const { people, deskTopY, seatY, typing, clacks, shake, sparkles, flash } = SK.help;
  const dot = (g, x, y, c) => rect(g, x, y, 1, 1, c);
  const phone = () => (G.innerWidth || 1) < (G.innerHeight || 0);
  const SAFE = ph => (ph ? [150, 200] : [200, 120]);
  const zw = () => (phone() ? -1 : -2);   // the widest shot of a tall building (desktop needs one step more)
  const DAY = { phase: 'day', wx: 0 };

  /* ---------- shared bits ---------- */
  /** x of desk j in a single row of n desks (the kit's crew layout, one row) */
  const slotX = (n, j) => Math.round((j - (n - 1) / 2) * 32);
  /** The lead typist of machine i (a stock look if the save has none) */
  function lead(w, i) { const c = w.crew && w.crew[i]; return c && c.look ? { look: c.look, hat: c.hat || 0 } : { look: ['v07', 'v13', 'v19', 'v25', 'v28'][(i + 4) % 5], hat: 0 }; }
  const founderOf = w => people(w).founder;
  /** One desk with its machine, the typist (if any) behind it. stage 0 + desk 0 = the crate. o: { feet, expr, paper, col, flip } */
  function station(g, i, x, stage, who, pose, key, o = {}) {
    const kind = stage === 0 && i === 0 ? 'crate' : 'desk', top = FLOOR - (kind === 'crate' ? 13 : 11);
    if (who) { SK.shadow(g, x, FLOOR + 1, 12); SK.actor(g, who.look, pose || 'idle', x, o.feet != null ? o.feet : top + 4, { hat: who.hat, expr: o.expr || undefined }); }
    const t2 = SK.desk(g, x, FLOOR, kind, { label: true });
    SK.typewriter(g, i, x, t2, key == null ? -1 : key, { paper: o.paper == null ? 0.5 : o.paper, col: o.col || 0 });
    return t2;
  }
  /** A typist's pose at desk i: typing out of phase with the others */
  const typer = (t, i, t0, t1, fps = 9) => typing(t + i * 0.37, t0 + i * 0.37, t1 + i * 0.37, fps + (i % 3));
  /** A delivery crate (26x18) stamped IMI in the machine's colour, standing on feet */
  function crate(g, x, feet, desk, o = {}) {
    const W = R.wood, C = SK.DESK[desk].c, w = 26, h = 18, x0 = Math.round(x) - 13, y0 = Math.round(feet) - h;
    rect(g, x0 - 1, y0 - 1, w + 2, h + 2, W[4]);
    for (let i = 0; i < 3; i++) { rect(g, x0, y0 + i * 6, w, 6, i % 2 ? W[2] : W[1]); rect(g, x0, y0 + i * 6 + 5, w, 1, W[3]); }
    rect(g, x0, y0, 3, h, W[3]); rect(g, x0 + w - 3, y0, 3, h, W[3]); rect(g, x0 + 1, y0, 1, h, W[1]);
    rect(g, x0 + 4, y0 + 4, 18, 9, INK); rect(g, x0 + 5, y0 + 5, 16, 7, C[1]); rect(g, x0 + 5, y0 + 5, 16, 1, C[2]); rect(g, x0 + 5, y0 + 11, 16, 1, C[0]);
    SK.text(g, 'IMI', x0 + 7, y0 + 6, INK);
    if (o.lid !== false) box(g, x0 - 1, y0 - 3, w + 2, 3, W);
  }
  /** The crate after it bursts open: base and two sides lying flat; k < .3 the sides are still falling */
  function crateOpen(g, x, feet, k) {
    const W = R.wood, x0 = Math.round(x) - 13;
    if (k < 0.3) { box(g, x0 - 6, feet - 12, 3, 12, W); box(g, x0 + 29, feet - 12, 3, 12, W); }
    else { box(g, x0 - 17, feet - 3, 16, 3, W); box(g, x0 + 27, feet - 3, 16, 3, W); }
    box(g, x0, feet - 3, 26, 3, W);
  }
  /** The new machine unboxed on the crate base, with a reveal burst */
  function unboxed(g, t, desk, x, feet, t0) {
    crateOpen(g, x, feet, seg(t, t0, t0 + 0.4));
    SK.typewriter(g, desk, x, feet - 3, -1, { paper: 0.15 });
    if (t >= t0 && t < t0 + 0.6) SK.puff(g, x, feet - 6, seg(t, t0, t0 + 0.6), { n: 7, spread: 22, size: 3 });
    sparkles(g, t, x, feet - 16, t0, t0 + 1.8, 5, 18);
  }
  /** The renovation line: sawdust and sparkles along the rising seam between old and new */
  function seam(g, t, y, half) {
    for (let i = 0; i < 9; i++) { const x = Math.round(-half + ((i * 37 + Math.floor(t * 8) * 13) % (half * 2))); SK.sparkle(g, x, y - 1, fr(t + i * 0.2, 8, 2) + 1, i % 3 ? '#fff6d6' : '#ffd23a'); }
    for (let i = 0; i < 5; i++) { const k = ((t * 1.7 + i / 5) % 1), x = Math.round(-half + hash(i + Math.floor(t * 1.7 + i / 5) * 7, 31) * half * 2); rect(g, x, Math.round(y + k * 14), 2, 1, R.woodL[1]); }
  }
  /** Draw fn() only above world y (the renovation line) */
  function above(g, view, y, fn) { g.save(); g.beginPath(); g.rect(-view.ox - 4, y - 600, view.w + 8, 600); g.clip(); fn(); g.restore(); }
  /** A light list that forwards to view.light, trimmed to above clipY */
  function lightsTo(view, clipY) {
    return { push(q) {
      if (q[0] === 'glow') { if (clipY == null || q[2] < clipY) view.light('glow', q[1], q[2], q[3], q[4]); return; }
      if (q[0] === 'text') { if (clipY == null || q[3] < clipY) view.light('text', q[1], q[2], q[3], q[4]); return; }
      let [x, y, w, h, c] = q; if (clipY != null) { if (y >= clipY) return; h = Math.min(h, clipY - y); }
      view.light(x, y, w, h, c);
    } };
  }
  /** A flat, stepped dark overlay (screen space) */
  function dim(g, view, a, col = '5,6,16') { if (a <= 0) return; g.fillStyle = 'rgba(' + col + ',' + (Math.round(a * 6) / 6).toFixed(2) + ')'; g.fillRect(0, 0, view.w, view.h); }

  /* ---------- the kit's stage art, copied (building only, no trees) so the OLD building can be drawn while the kit raises the new one ---------- */
  const winLit = (env, i) => env.phase === 'night' || env.phase === 'dusk' || env.wx >= 2 || (env.phase === 'dawn' && i % 2 === 0);
  function windowBox(g, L, env, x, y, w, h, i, o = {}) {
    rect(g, x - 1, y - 1, w + 2, h + 2, o.frame || R.woodD[4]);
    const lit = winLit(env, i);
    rect(g, x, y, w, h, lit ? '#3a2410' : '#1c2c48');
    if (lit) { L.push([x, y, w, h, '#ffd890']); L.push([x, y + h - 2, w, 2, '#ffb84a']); }
    else { rect(g, x, y, Math.max(1, Math.floor(w / 3)), 1, '#5a7ab0'); dot(g, x + 1, y + 1, '#8cb0e0'); }
    rect(g, x + Math.floor(w / 2), y, 1, h, o.frame || R.woodD[3]); rect(g, x, y + Math.floor(h / 2), w, 1, o.frame || R.woodD[3]); L.push([x + Math.floor(w / 2), y, 1, h, null]);
  }
  /** Bamboo poles; n (float) = how many stand, the next one slides down into place */
  function bambooWall(g, x0, x1, top, bottom, n = 99) {
    const B = R.bamboo, whole = Math.floor(n), fall = n - whole;
    for (let x = x0, i = 0; x < x1; x += 4, i++) {
      let dy = 0;
      if (i > whole) break;
      if (i === whole) { if (fall <= 0) break; dy = -Math.round((1 - ease.in(fall)) * 70); }
      const tp = top + dy, bt = bottom + dy;
      rect(g, x, tp, 4, bt - tp, B[4]); rect(g, x + 1, tp, 2, bt - tp, i % 2 ? B[2] : B[1]); rect(g, x + 1, tp, 1, bt - tp, B[0]);
      for (let y = tp + 3 + (i % 3) * 3; y < bt - 2; y += 9) { rect(g, x, y, 4, 1, B[3]); rect(g, x + 1, y + 1, 2, 1, B[0]); }
    }
  }
  /** The thatch; prog 0..1 = rows laid from the eaves up */
  function thatch(g, t, x0, x1, base, peak, prog = 1) {
    const S = R.straw, h = base - peak, cx = (x0 + x1) / 2, half = (x1 - x0) / 2, top = Math.floor(prog * h);
    if (prog <= 0) return;
    for (let y = 0; y <= Math.min(h, top); y++) {
      const k = y / h, w = Math.round(half * (1 - k * 0.92)), yy = base - y;
      rect(g, cx - w - 1, yy, w * 2 + 2, 1, S[4]); rect(g, cx - w, yy, w * 2, 1, y % 6 < 2 ? S[3] : y % 6 < 4 ? S[2] : S[1]); rect(g, cx - w, yy, 2, 1, S[1]);
    }
    for (let x = Math.round(x0); x < x1; x += 3) { const d = 1 + ((x * 7) % 3), sw = Math.floor(t * 1.4 + x * 0.3) % 2; rect(g, x + sw, base + 1, 2, d, S[3]); dot(g, x + sw, base + d, S[4]); }
    if (prog >= 1) { rect(g, cx - 4, peak - 2, 9, 3, R.woodD[4]); rect(g, cx - 3, peak - 1, 7, 1, R.woodD[1]); }
  }
  function plankWall(g, x0, x1, top, bottom, P, step = 5) {
    rect(g, x0 - 1, top - 1, x1 - x0 + 2, bottom - top + 1, P[4]);
    for (let y = top, i = 0; y < bottom; y += step, i++) { rect(g, x0, y, x1 - x0, step, i % 2 ? P[2] : P[1]); rect(g, x0, y + step - 1, x1 - x0, 1, P[3]); for (let x = x0 + ((i * 13) % 17) + 4; x < x1 - 2; x += 19) rect(g, x, y, 1, step - 1, P[3]); }
  }
  function lantern(g, L, t, x, y, env) {
    const on = env.phase === 'night' || env.phase === 'dusk';
    rect(g, x, y - 6, 1, 6, INK); rect(g, x - 2, y, 5, 6, INK); rect(g, x - 1, y + 1, 3, 4, on ? '#ffe08a' : '#c8a060'); rect(g, x - 2, y - 1, 5, 1, R.woodD[2]);
    if (on || env.wx >= 2) { L.push([x - 1, y + 1, 3, 4, '#fff0b0']); L.push(['glow', x, y + 3, 9, Math.floor(t * 3) % 2 ? 0.22 : 0.18]); }
  }
  /** Stage 1, the hut. o: { poles (0..22), thatch (0..1), deco (windows, door, lantern) } */
  const HUT_POLES = 22;
  function hutBody(g, t, env, L, o = {}) {
    const W = 44;
    rect(g, -W - 3, -3, W * 2 + 6, 3, R.woodD[4]); rect(g, -W - 2, -3, W * 2 + 4, 2, R.woodD[1]);
    bambooWall(g, -W, W, -52, -3, o.poles == null ? 99 : o.poles);
    if (o.deco !== false) {
      windowBox(g, L, env, -32, -44, 14, 10, 0, { frame: R.bamboo[4] }); windowBox(g, L, env, 18, -44, 14, 10, 1, { frame: R.bamboo[4] });
      rect(g, -7, -36, 14, 33, R.woodD[4]); rect(g, -6, -35, 12, 32, '#2a1608'); for (let y = -35; y < -26; y += 2) rect(g, -6, y, 12, 1, R.straw[y % 4 ? 2 : 3]); rect(g, -7, -27, 14, 3, R.straw[3]);
      if (winLit(env, 2)) L.push([-6, -24, 12, 21, '#ffc870']);
    }
    thatch(g, t, -W - 12, W + 12, -50, -86, o.thatch == null ? 1 : o.thatch);
    if (o.deco !== false) lantern(g, L, t, W + 6, -46, env);
  }
  /** Stage 2, the boathouse: walls (with lanterns) and the gable roof (dy lifts it) */
  const BH = ['#bfe0ff', '#7aa8d8', '#4a78b0', '#2c4a78', '#14223c'];
  function boatWalls(g, t, env, L) {
    const W = 56, Wd = R.wood;
    plankWall(g, -W, W, -56, -2, Wd, 5);
    rect(g, -W - 1, -58, W * 2 + 2, 3, BH[4]); rect(g, -W, -57, W * 2, 1, BH[1]);
    rect(g, -15, -40, 30, 38, BH[4]); rect(g, -14, -39, 28, 37, '#10202e'); for (let i = 0; i < 4; i++) rect(g, -14, -39 + i * 2, 28, 1, i % 2 ? BH[3] : BH[2]);
    rect(g, -14, -35, 28, 2, BH[3]);
    if (winLit(env, 3)) L.push([-12, -30, 24, 26, '#ffc870']);
    windowBox(g, L, env, -44, -46, 14, 11, 0, { frame: BH[4] }); windowBox(g, L, env, 30, -46, 14, 11, 1, { frame: BH[4] });
    disc(g, 37, -24, 5, INK); disc(g, 37, -24, 4, '#e8402a'); rect(g, 33, -25, 9, 2, '#fff6d6'); rect(g, 36, -28, 2, 9, '#fff6d6'); disc(g, 37, -24, 1, Wd[2]);
    lantern(g, L, t, -W - 4, -50, env); lantern(g, L, t, W + 4, -50, env);
  }
  function boatRoof(g, dx = 0, dy = 0) {
    const W = 56;
    for (let y = 0; y <= 26; y++) { const w = Math.round((W + 10) * (1 - y / 30)), yy = -58 - y + dy; rect(g, dx - w - 1, yy, w * 2 + 2, 1, BH[4]); rect(g, dx - w, yy, w * 2, 1, y % 4 < 2 ? BH[2] : BH[3]); if (y % 4 === 0) for (let x = -w + (y % 8 ? 2 : 5); x < w; x += 6) dot(g, dx + x, yy, BH[4]); }
    rect(g, dx - W - 11, -58 + dy, W * 2 + 22, 2, BH[4]);
  }
  /** Stage 3, the hive */
  function hex(g, L, env, x, y, i) {
    const lit = winLit(env, i), rows = [[2, 5], [1, 7], [0, 9], [0, 9], [1, 7], [2, 5]];
    rows.forEach(([dx, w], r) => rect(g, x + dx - 1, y + r - 1, w + 2, 1, '#5a3a06'));
    rows.forEach(([dx, w], r) => { rect(g, x + dx - 1, y + r, w + 2, 1, '#5a3a06'); });
    rect(g, x + 1, y + 6, 7, 1, '#5a3a06');
    rows.forEach(([dx, w], r) => rect(g, x + dx, y + r, w, 1, lit ? '#3a2410' : r < 2 ? '#5a7ab0' : '#1c2c48'));
    if (lit) rows.forEach(([dx, w], r) => L.push([x + dx, y + r, w, 1, r > 3 ? '#ffb84a' : '#ffe08a']));
  }
  const HONEY = ['#ffe9a8', '#f2c260', '#d8a040', '#a8681a', '#5a3a06'];
  function hiveBody(g, t, env, L) {
    const W = 64, A = R.banY;
    plankWall(g, -W, W, -46, -2, HONEY, 6); plankWall(g, -W + 6, W - 6, -94, -46, HONEY, 6);
    rect(g, -W - 3, -48, W * 2 + 6, 3, '#5a3a06'); rect(g, -W - 2, -48, W * 2 + 4, 1, A[1]);
    rect(g, -W + 3, -98, W * 2 - 6, 4, '#5a3a06'); rect(g, -W + 4, -97, W * 2 - 8, 1, A[1]);
    let i = 0;
    for (let x = -W + 12; x < W - 18; x += 15) hex(g, L, env, x, -84, i++), hex(g, L, env, x + 7, -72 + 2, i++);
    for (let x = -W + 6; x < W - 10; x += 22) if (Math.abs(x + 4) > 14) hex(g, L, env, x, -38, i++);
    rect(g, -9, -32, 18, 30, '#5a3a06'); rect(g, -8, -31, 16, 29, '#3a2410'); if (winLit(env, 5)) L.push([-7, -28, 14, 26, '#ffc870']);
    for (let k = 0; k < 7; k++) rect(g, -12 + k * 3, -37, 3, 5, k % 2 ? '#fff6d6' : '#d8a040'); rect(g, -13, -38, 23, 1, '#5a3a06');
    SK.text(g, 'IMI', 0, -108, A[2], { align: 'center', s: 2, shadow: '#5a3a06' });
  }
  /** The kit's earth ground (any stage but the lagoon), between x0 and x1 */
  function earth(g, view, x0, x1, stage) {
    const G1 = R.leaf, E = R.coco, X0 = -view.ox - 2, X1 = view.w - view.ox + 2, bh = view.h - view.oy + 4;
    g.save(); g.beginPath(); g.rect(x0, -12, x1 - x0, bh + 24); g.clip();
    rect(g, X0, 0, X1 - X0, bh, E[2]);
    for (let k = Math.floor(X0 / 9); k * 9 < X1; k++) { const hx = hash(k, 1); if (hx < 0.5) rect(g, k * 9 + Math.round(hx * 8), 6 + Math.round(hash(k, 2) * 40), 2, 1, hx < 0.2 ? E[1] : E[3]); }
    rect(g, X0, 0, X1 - X0, 4, G1[3]); rect(g, X0, 0, X1 - X0, 2, G1[2]); rect(g, X0, 0, X1 - X0, 1, G1[1]);
    for (let x = Math.floor(X0 / 3) * 3; x < X1; x += 3) if (hash(x, 8) > 0.55) rect(g, x, -1 - (hash(x, 9) > 0.7 ? 1 : 0), 1, 2, G1[hash(x, 6) > 0.5 ? 1 : 2]);
    if (stage > 0) { const hw = stage >= 4 ? 92 : 70; rect(g, -hw, 4, hw * 2, FLOOR + 4, E[1]); rect(g, -hw, 4, hw * 2, 1, E[3]); for (let x = -hw + 4; x < hw; x += 13) rect(g, x, 7 + (x % 3), 3, 1, E[0]); }
    g.restore();
  }
  /** The kit's lagoon dock, trimmed to x0..x1, and stilts under it */
  function dock(g, x0 = -72, x1 = 72) {
    const D = R.wood; if (x1 <= x0) return;
    g.save(); g.beginPath(); g.rect(x0, -4, x1 - x0, 60); g.clip();
    rect(g, -72, -1, 144, 4, D[4]); rect(g, -71, -1, 142, 3, D[1]); for (let x = -70; x < 70; x += 6) rect(g, x, 0, 1, 2, D[3]);
    rect(g, -72, 3, 144, FLOOR + 12, D[4]); rect(g, -70, 3, 140, FLOOR + 10, D[2]); for (let y = 6; y < FLOOR + 14; y += 4) rect(g, -70, y, 140, 1, D[3]);
    g.restore();
  }
  function stilts(g, t, x0 = -72, x1 = 72) {
    const D = R.woodD;
    for (let x = -66; x < 70; x += 22) { if (x < x0 || x > x1) continue; rect(g, x - 1, FLOOR + 15, 5, 13, D[4]); rect(g, x, FLOOR + 15, 3, 12, D[2]); rect(g, x, FLOOR + 15, 1, 12, D[1]); rect(g, x - 3 + fr(t, 2, 2), FLOOR + 26, 9, 1, '#bfe8ff'); }
  }

  /* ---------- little characters and props ---------- */
  function bee(g, x, y, t, i) { x = Math.round(x); y = Math.round(y); rect(g, x - 1, y - 1, 5, 4, INK); rect(g, x, y, 1, 2, '#ffd23a'); rect(g, x + 2, y, 1, 2, '#ffd23a'); rect(g, x + fr(t + i * 0.07, 14, 2), y - 2, 2, 1, '#e4f6ff'); }
  /** A swarm of n bees buzzing around (cx, cy) */
  function swarm(g, t, cx, cy, n, spread, seed = 3) {
    for (let i = 0; i < n; i++) { const a = hash(i, seed) * 6.283 + t * (1.6 + hash(i, seed + 1) * 2.2) * (i % 2 ? 1 : -1), r = spread * (0.25 + 0.75 * hash(i, seed + 2)); bee(g, cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.55, t, i); }
  }
  /** The Head Bee (13x11): spectacles, a ledger. Faces right unless o.flip */
  function headBee(g, x, y, t, o = {}) {
    x = Math.round(x); y = Math.round(y); const f = o.flip ? -1 : 1, P = (dx, dy, w, h, c) => rect(g, f > 0 ? x + dx : x - dx - w + 1, y + dy, w, h, c), wf = fr(t, 16, 2);
    P(-5, -10 + wf, 6, 5, '#5a7490'); P(-4, -9 + wf, 4, 3, '#e4f6ff'); P(0, -12 + wf, 6, 6, '#5a7490'); P(1, -11 + wf, 4, 4, '#e4f6ff');
    P(-7, -5, 12, 9, INK); P(-6, -4, 10, 7, '#ffd23a'); P(-6, -4, 10, 1, '#fff08c'); P(-4, -4, 2, 7, INK); P(0, -4, 2, 7, INK); P(-8, -1, 1, 1, INK);
    P(4, -7, 7, 8, INK); P(5, -6, 5, 6, '#3a2a30');
    P(6, -5, 4, 4, '#d8d8e4'); P(7, -4, 2, 2, INK); P(7, -4, 1, 1, '#ffffff');
    P(6, -10, 1, 3, INK); P(9, -11, 1, 4, INK); P(5, -11, 1, 1, INK); P(10, -12, 1, 1, INK);
    if (o.ledger) { P(1, 2, 7, 6, INK); P(2, 3, 5, 4, '#2f8a35'); P(2, 3, 5, 1, '#74c648'); P(6, 3, 1, 4, R.paper[1]); }
  }
  /** A grumpy little rain cloud */
  function cloudlet(g, t, x, y, mood = 0) {
    const C = R.storm; x = Math.round(x); y = Math.round(y);
    SK.oval(g, x, y + 1, 16, 5, C[4]); SK.oval(g, x, y, 15, 4, C[3]); disc(g, x - 6, y - 3, 6, C[4]); disc(g, x + 5, y - 5, 7, C[4]);
    disc(g, x - 6, y - 3, 5, C[2]); disc(g, x + 5, y - 5, 6, C[2]); SK.oval(g, x, y, 14, 3, C[2]); disc(g, x - 7, y - 5, 2, C[1]); disc(g, x + 3, y - 8, 2, C[1]);
    rect(g, x - 5, y - 2, 2, 2, INK); rect(g, x + 3, y - 2, 2, 2, INK); rect(g, x - 6, y - 4 + mood, 3, 1, INK); rect(g, x + 3, y - 4 + mood, 3, 1, INK);   // angry brows
    rect(g, x - 2, y + 2, 4, 1, INK); dot(g, x - 3, y + 3, INK); dot(g, x + 2, y + 3, INK);                                                          // a frown
  }
  /** Rain from a cloud at (cx, cy): drops stop at stopY(x) with a splash */
  function rainFrom(g, t, cx, cy, stopY, n = 12) {
    for (let i = 0; i < n; i++) {
      const x = Math.round(cx - 13 + i * 2 + (i % 2)), y0 = cy + 4, y1 = stopY(x), span = Math.max(4, y1 - y0), y = y0 + ((t * 120 + i * 23) % span);
      rect(g, x, Math.round(y), 1, 4, R.drop[2]); dot(g, x, Math.round(y), R.drop[0]);
      if (fr(t + i * 0.11, 9, 3) === 0) { dot(g, x - 1, y1 - 1, R.drop[1]); dot(g, x + 1, y1 - 1, R.drop[1]); }
    }
  }
  /** A big banana leaf, used as a parachute (dome over x, bottom edge on y) */
  function leafChute(g, t, x, y) {
    x = Math.round(x); y = Math.round(y); const L = R.leaf;
    for (let r = 0; r <= 9; r++) { const hw = Math.round(Math.sqrt(Math.max(0, 1 - Math.pow((9 - r) / 10, 2))) * 22); rect(g, x - hw - 1, y - 10 + r, hw * 2 + 3, 1, L[4]); rect(g, x - hw, y - 10 + r, hw * 2 + 1, 1, r < 3 ? L[1] : r < 7 ? L[2] : L[3]); }
    rect(g, x - 22, y, 45, 1, L[4]);
    for (let i = -18; i <= 18; i += 6) rect(g, x + i, y - 8 + Math.abs(i) / 6, 1, 6 - Math.abs(i) / 9, L[0]);
    rect(g, x, y - 10, 1, 10, '#c8d474');
    for (const s of [-20, 20]) for (let k = 0; k < 16; k++) dot(g, x + Math.round(lerp(s, s * 0.55, k / 16)), y + 1 + k, '#c8a060');
  }
  /** A lagoon mail boat (hull 40 wide) with a little blue flag */
  function boat(g, t, x, y) {
    x = Math.round(x); y = Math.round(y); const Rr = R.red, B = SK.DESK[2].c;
    rect(g, x + 27, y - 22, 1, 14, INK); rect(g, x + 28, y - 22, 7, 5, INK); rect(g, x + 28, y - 21, 6, 3, B[1]); rect(g, x + 28 + fr(t, 4, 2) * 2, y - 21, 1, 3, B[2]);
    rect(g, x - 28, y - 7, 57, 10, INK); rect(g, x - 27, y - 6, 55, 8, Rr[2]); rect(g, x - 27, y - 6, 55, 2, '#fff6d6'); rect(g, x - 27, y - 4, 55, 1, Rr[1]); rect(g, x - 27, y + 1, 55, 1, Rr[3]);
    rect(g, x - 30, y - 9, 6, 4, INK); rect(g, x + 25, y - 9, 6, 4, INK); rect(g, x - 29, y - 8, 4, 2, Rr[2]); rect(g, x + 26, y - 8, 4, 2, Rr[2]);
    disc(g, x - 18, y - 2, 2, INK); disc(g, x - 18, y - 2, 1, '#e8402a');
    SK.text(g, 'IMI MAIL', x + 2, y - 3, Rr[4], { align: 'center' });
  }
  /** The breaking wave, its face at x, rolling left */
  const WT = ['#e4f6ff', '#9cd8f4', '#4a9ad0', '#2c6ea8', '#143a64'];
  function waveCrest(x) { return dx => (dx < 6 ? 18 + dx * 2 : Math.max(1, Math.round(30 - (dx - 6) * 0.72))); }
  function wave(g, t, x) {
    x = Math.round(x); const hOf = waveCrest(x), base = FLOOR + 18;
    for (let dx = 0; dx < 44; dx++) {
      const h = hOf(dx), top = 2 - h;
      rect(g, x + dx, top, 1, base - top, dx < 2 ? WT[4] : WT[2]);
      if (dx >= 2) { rect(g, x + dx, top, 1, 2, WT[0]); rect(g, x + dx, top + 2, 1, 3, WT[1]); rect(g, x + dx, base - 6, 1, 6, WT[3]); if ((dx + Math.floor(t * 10)) % 5 === 0) rect(g, x + dx, top + 7 + (dx % 4), 1, 2, WT[1]); }
    }
    rect(g, x - 5, 2 - 30, 9, 3, WT[4]); rect(g, x - 4, 2 - 29, 8, 2, WT[0]); rect(g, x - 5, 2 - 27, 2, 3, WT[0]); dot(g, x - 6, 2 - 24, WT[0]);   // the curling lip
    for (let i = 0; i < 10; i++) { const k = (t * 2.2 + i * 0.1) % 1, sx = x - 4 - Math.round(k * 16) + (i % 3) * 3, sy = 2 - 28 + Math.round(SK.hop(k, 8) + k * 20) + (i % 2) * 3; dot(g, sx, sy, i % 3 ? WT[0] : WT[1]); }
  }

  /* =====================================================================
     2. FIRST WORD: the ticker tape of gibberish, a freeze, a close-up of the page: a real word. It gets nailed to a tree.
     ===================================================================== */
  const FW = { type0: 0.2, freeze: 5.0, turn: 5.5, ins0: 6.4, circle: 7.6, ins1: 10.4, cheer: 10.5, rip: 11.2, march0: 12.0, march1: 13.6, pin: 14.0, hit0: 14.4, done: 15.6, step1: 16.2, end: 19.4 };
  const TREE_X = -84, PIN_Y = -42;
  const cleanWord = w => (String(w.firstWord || 'CAT').toUpperCase().replace(/[^A-Z]/g, '') || 'CAT').slice(0, 12);
  /** Gibberish (no vowels, so nothing in it is a word by accident) with the word in the middle of line 3 */
  function pageLines(word) {
    let s = 7; for (const ch of word) s = (s * 31 + ch.charCodeAt(0)) | 0;
    const r = SK.rng(s), C = 'QXZJKVPRBFGHTLNDSC', L = 17, out = [];   // no M/W: they are wider glyphs
    const junk = n => { let o = ''; for (let i = 0; i < n; i++) o += r() < 0.18 && o && o[o.length - 1] !== ' ' && i < n - 1 ? ' ' : C[Math.floor(r() * C.length)]; return o; };
    for (let i = 0; i < 6; i++) {
      if (i !== 3) { out.push(junk(L)); continue; }
      const pad = Math.max(0, L - word.length - 2), a = Math.floor(pad / 2);
      out.push(junk(a) + ' ' + word + ' ' + junk(pad - a));
    }
    return out;
  }
  /** The page close-up: slides up over the scene; the word gets a marker and a red ring */
  function wordInsert(g, view, k, word, circle) {
    const lines = pageLines(word), s = 1, tw = Math.max(...lines.map(l => SK.textW(l))), pw = tw + 18, ph = lines.length * 8 + 16;
    const x = Math.round((view.w - pw) / 2), y0 = Math.round(view.h * 0.4 - ph / 2), y = Math.round(lerp(view.h + 4, y0, ease.out(Math.min(1, k))));
    dim(g, view, 0.5 * k, '26,15,20');
    const P = R.paper;
    g.fillStyle = 'rgba(26,15,20,.45)'; g.fillRect(x + 3, y + 3, pw, ph);
    rect(g, x - 1, y - 1, pw + 2, ph + 2, P[4]); rect(g, x, y, pw, ph, P[1]); rect(g, x, y, pw, 1, '#ffffff'); rect(g, x, y + ph - 1, pw, 1, P[2]);
    for (let i = 0; i < lines.length; i++) rect(g, x + 2, y + 6 + i * 8 + 6, pw - 4, 1, '#c8d8f0');
    rect(g, x + 9, y + 2, 1, ph - 4, '#f0a8a8');
    SK.text(g, '- 4001 -', x + pw / 2 + 4, y + ph - 7, P[3], { align: 'center' });
    const wl = lines[3], wi = wl.indexOf(' ' + word + ' ') + 1, wx = x + 12 + (wi ? SK.textW(wl.slice(0, wi)) + 1 : 0), wy = y + 6 + 3 * 8, ww = SK.textW(word);
    if (circle > 0) {
      const on = circle >= 1 || fr(circle, 6, 2) === 0;
      if (on) { SK.oval(g, wx + Math.floor(ww / 2), wy + 2, Math.ceil(ww / 2) + 5, 6, '#e8402a'); SK.oval(g, wx + Math.floor(ww / 2), wy + 2, Math.ceil(ww / 2) + 4, 5, P[1]); rect(g, wx - 1, wy - 1, ww + 2, 7, '#fff08c'); }
    }
    lines.forEach((l, i) => SK.text(g, l, x + 12, y + 6 + i * 8, i === 3 && circle > 0 ? '#5c4650' : '#3a2a60', { s }));
    if (circle > 0) SK.text(g, word, wx, wy, '#1a0f14');
  }
  /** The torn-off page with the word on it (world space), top-left at (x, y) centred on x */
  function wordPage(g, x, y, word, o = {}) {
    const ww = SK.textW(word), w = Math.max(15, ww + 8), h = 16, x0 = Math.round(x - w / 2), y0 = Math.round(y), P = R.paper;
    rect(g, x0 - 1, y0 - 1, w + 2, h + 2, P[4]); rect(g, x0, y0, w, h, P[1]); rect(g, x0 + w - 1, y0, 1, h, P[2]);
    for (let i = 0; i < w - 4; i += 3) { dot(g, x0 + 2 + i, y0 + 2, '#8a7ab0'); dot(g, x0 + 3 + i, y0 + 13, '#8a7ab0'); }
    rect(g, x0 + Math.floor((w - ww) / 2) - 1, y0 + 5, ww + 2, 7, '#fff08c');
    SK.text(g, word, x0 + Math.floor((w - ww) / 2), y0 + 6, INK);
    for (let i = 0; i < 5; i++) dot(g, x0 + (i * 3) % w, y0 + h, P[1]);   // the torn bottom edge
    if (o.nail) { rect(g, x0 + Math.floor(w / 2) - 1, y0 - 1, 3, 3, INK); dot(g, x0 + Math.floor(w / 2), y0, R.metal[1]); }
  }
  /** The ticker tape: from the machine's platen along a curve to (x1, y1), ink marks scroll along it */
  function tape(g, x0, y0, cx, cy, x1, y1, phase, end) {
    const pts = []; for (let i = 0; i <= 40; i++) { const s = i / 40, a = (1 - s) * (1 - s), b = 2 * (1 - s) * s, c = s * s; pts.push([Math.round(a * x0 + b * cx + c * x1), Math.round(a * y0 + b * cy + c * y1)]); }
    if (end) for (let i = 1; i <= 8; i++) pts.push([x1 + Math.round(Math.sin(i * 0.9) * 3) + i, y1 + i * 2]);
    for (const [x, y] of pts) rect(g, x - 2, y - 2, 4, 4, R.paper[4]);
    for (const [x, y] of pts) rect(g, x - 1, y - 1, 2, 2, R.paper[1]);
    pts.forEach(([x, y], i) => { if ((i + phase) % 3 === 0) dot(g, x, y, '#3a2a60'); });
    if (end) { const [px, py] = pts[pts.length - 1]; for (let i = 0; i < 3; i++) { rect(g, px - 6 + i * 2, py + 1 - i * 2, 9, 3, R.paper[4]); rect(g, px - 5 + i * 2, py + 2 - i * 2, 7, 1, R.paper[1]); } }
  }
  SK.scene({
    id: 'first-word', title: 'A Real Word', chapter: 2, duration: FW.end, stage: () => 0, sky: w => ({ wx: Math.min(1, w.wx | 0) }),
    beats: [
      { at: 0.3, who: 'founder', text: 'Page four thousand. Still gibberish. Lovely, artisanal gibberish.' },
      { at: 5.1, who: 'founder', text: 'Wait. WAIT. Everybody freeze. Nobody touch a single key.', expr: 'screech' },
      { at: 6.6, who: 'founder', text: 'That\'s not gibberish. That\'s CAT. A real, entire word!', expr: 'giggle' },
      { at: 12.0, who: 'founder', text: 'This one is going on the wall. Well. On the tree.', expr: 'giggle' },
      { at: 15.6, who: 'founder', text: 'One word down. Only every other word to go.', expr: 'giggle' },
    ],
    prepare(w) { this.beats[2].text = 'That\'s not gibberish. That\'s ' + cleanWord(w) + '. A real, entire word!'; },
    cast: w => { const p = people(w); return { founder: Object.assign({ name: 'You' }, p.founder), hire: Object.assign({ name: 'The new hire', bg: '#5a3517' }, p.hire) }; },
    cues: [
      ...clacks(FW.type0, FW.freeze, 12), { at: 1.4, sfx: 'bell' }, { at: 2.9, sfx: 'bell' }, { at: 4.3, sfx: 'bell' },
      { at: FW.freeze, sfx: 'stamp' }, { at: FW.turn, sfx: 'monkey' }, { at: FW.ins0, sfx: 'page' }, { at: FW.circle, sfx: 'crit' }, { at: FW.circle + 0.15, sfx: 'levelup' },
      { at: FW.ins1, sfx: 'page' }, { at: FW.cheer + 0.1, sfx: 'triumph' }, { at: FW.rip, sfx: 'rip' },
      { at: FW.march0 + 0.2, sfx: 'drum' }, { at: FW.march0 + 0.8, sfx: 'drum' }, { at: FW.march0 + 1.4, sfx: 'drum' }, { at: FW.pin, sfx: 'attach' },
      { at: FW.hit0, sfx: 'hammer' }, { at: FW.hit0 + 0.4, sfx: 'hammer' }, { at: FW.hit0 + 0.8, sfx: 'hammer' }, { at: FW.done, sfx: 'jackpot' },
    ],
    camera(t) {
      const c = SK.track(t, [
        [0, { x: -12, y: -28, z: 1 }], [4.99, { x: -10, y: -28, z: 1 }], [5.0, { x: -6, y: -32, z: 2 }], [6.39, { x: -6, y: -32, z: 2 }], [6.4, { x: -12, y: -30, z: 1 }],
        [10.4, { x: -12, y: -30, z: 1 }], [10.41, { x: -14, y: -32, z: 0 }], [12.0, { x: -20, y: -34, z: 0 }], [13.8, { x: -60, y: -36, z: 0 }],
        [13.99, { x: -60, y: -36, z: 0 }], [14.0, { x: -74, y: -38, z: 1 }], [15.59, { x: -74, y: -38, z: 1 }], [15.6, { x: -54, y: -38, z: 0 }], [FW.end, { x: -50, y: -40, z: 0 }],
      ]);
      return { x: c.x + shake(t, FW.freeze, 0.15), y: c.y + shake(t, FW.hit0, 0.08) + shake(t, FW.hit0 + 0.4, 0.08) + shake(t, FW.hit0 + 0.8, 0.12), z: c.z };
    },
    actors(t, w) {
      const solo = (w.paws | 0) < 1, sy = seatY({ stage: 0 });
      const A = { solo, f: { x: -34, feet: FLOOR, pose: 'st_read', expr: null, flip: false, behind: false }, h: solo ? null : { x: 0, feet: sy, pose: 'idle', expr: null, behind: true },
        key: -1, col: 0, paper: 0.9, tape: solo ? 'pile' : 'read', phase: 0, held: null, pinned: false, pops: [], fly: -1, hit: -1, insert: 0, circle: 0, banana: false };
      const F = A.f, H = A.h, typist = solo ? F : H;
      if (solo) { F.x = 0; F.feet = sy; F.behind = true; F.pose = 'idle'; }
      // the typing run, then everything freezes mid-stroke
      const run = typing(Math.min(t, FW.freeze - 0.01), FW.type0, FW.freeze, 12);
      if (run) { typist.pose = run.pose; A.key = run.key; A.col = (run.beat % 16) / 16; A.phase = run.beat; A.fly = Math.min(t, FW.freeze) - FW.type0; typist.expr = 'determined'; }
      if (t >= FW.freeze) { typist.pose = 'st_type_a'; A.key = t < FW.turn ? A.key : -1; }
      if (t >= FW.turn && t < FW.cheer) {
        typist.pose = 'st_gasp'; typist.expr = 'screech'; if (!solo) { F.pose = 'st_gasp'; F.expr = 'screech'; }
        A.pops.push({ kind: '!', x: F.x, y: F.feet - 50, k: seg(t, FW.turn, FW.turn + 0.2) }); if (H) A.pops.push({ kind: '!', x: H.x, y: H.feet - 50, k: seg(t, FW.turn + 0.1, FW.turn + 0.3) });
      }
      if (t >= FW.ins0) A.fly = -1;
      if (t >= FW.ins0 && t < FW.ins1 + 0.3) { A.insert = t < FW.ins1 ? seg(t, FW.ins0, FW.ins0 + 0.3) : 1 - seg(t, FW.ins1, FW.ins1 + 0.3); A.circle = t < FW.circle ? 0 : seg(t, FW.circle, FW.circle + 0.6) < 1 ? seg(t, FW.circle, FW.circle + 0.6) : 1; }
      // the cheer: both hop
      if (t >= FW.cheer && t < FW.march0) {
        const hk = (t - FW.cheer) % 0.5 / 0.5;
        if (H) { H.pose = hk < 0.2 ? 'crouch' : 'st_cheer'; H.feet = sy + Math.round(SK.hop(hk, 6)); H.expr = 'giggle'; }
        if (solo) {   // hop down off the crate with the page
          const k = seg(t, FW.cheer, FW.cheer + 0.6); F.x = lerp(0, -20, k); F.feet = lerp(sy, FLOOR, k) + SK.hop(k, 10); F.pose = k < 1 ? 'air' : 'st_hold'; F.behind = k < 0.5; F.expr = 'giggle';
          if (t >= FW.cheer + 0.1) { A.tape = null; A.held = true; A.paper = 0.1; }
        } else {
          F.pose = t < FW.rip ? (hk < 0.2 ? 'crouch' : 'st_cheer') : 'st_hold'; F.feet = FLOOR + (t < FW.rip ? Math.round(SK.hop(hk, 6)) : 0); F.expr = 'giggle';
          if (t >= FW.rip) { A.tape = null; A.held = true; A.paper = 0.1; }
        }
      }
      // march to the big tree with the page overhead
      if (t >= FW.march0) {
        A.tape = null; A.paper = 0.1; F.behind = false; F.expr = 'giggle';
        const x0 = solo ? -20 : -34, wk = SK.walk(t, FW.march0, FW.march1, x0, -62);
        F.x = wk.x; F.pose = 'st_hold'; F.feet = FLOOR + (wk.moving ? -fr(t - FW.march0, 6, 2) : 0); F.flip = t > FW.march1;
        A.held = t < FW.pin;
        if (H) { H.pose = typing(t, FW.march0 + 0.6, 99, 10) ? typing(t, FW.march0 + 0.6, 99, 10).pose : 'idle'; H.expr = 'determined'; const ty = typing(t, FW.march0 + 0.6, 99, 10); if (ty) { A.key = ty.key; A.col = (ty.beat % 16) / 16; } }
      }
      if (t >= FW.pin) { A.pinned = true; F.x = -62; F.flip = true; F.pose = 'st_wave_b'; A.banana = true; }
      if (t >= FW.hit0 && t < FW.done) { const ph = (t - FW.hit0) % 0.4; F.pose = ph < 0.14 ? 'st_wave_a' : 'st_wave_b'; F.expr = 'determined'; A.hit = ph < 0.08 ? Math.floor((t - FW.hit0) / 0.4) : -1; A.banana = true; }
      if (t >= FW.done) {
        A.banana = false; const wk = SK.walk(t, FW.done, FW.step1, -62, -44); F.x = wk.x; F.flip = t < FW.step1; F.pose = wk.moving ? wk.pose : fr(t, 3, 2) ? 'st_cheer' : 'idle'; F.feet = FLOOR + (!wk.moving && fr(t, 3, 2) ? -3 : 0); F.expr = 'giggle';
        if (H) { const k = seg(t, FW.done + 0.3, FW.done + 0.9); H.x = lerp(0, -14, k); H.feet = k < 1 ? lerp(sy, FLOOR, k) + SK.hop(k, 12) : FLOOR + (fr(t + 0.2, 3, 2) ? -3 : 0); H.pose = k <= 0 ? 'idle' : k < 1 ? 'air' : fr(t + 0.2, 3, 2) ? 'st_cheer' : 'idle'; H.behind = k < 0.5; H.expr = 'giggle'; if (k > 0) A.key = -1; }
      }
      return A;
    },
    draw(g, t, w, A, view) {
      const p = people(w), F = A.f, H = A.h, top = deskTopY({ stage: 0 }), word = cleanWord(w);
      const drawF = () => { SK.shadow(g, F.x, FLOOR + 1, 10); SK.actor(g, p.founder.look, F.pose, F.x, F.feet, { hat: p.founder.hat, expr: F.expr || undefined, flip: F.flip }); };
      const drawH = () => { if (!H) return; SK.shadow(g, H.x, FLOOR + 1, 10); SK.actor(g, p.hire.look, H.pose, H.x, H.feet, { expr: H.expr || undefined }); };
      // the page on the tree
      if (A.pinned) { const drop = t < FW.pin + 0.15 ? -2 : 0; wordPage(g, TREE_X, PIN_Y + drop, word, { nail: t >= FW.hit0 + 0.8 }); }
      if (A.hit >= 0) { SK.sparkle(g, TREE_X, PIN_Y, 3, '#ffffff'); SK.puff(g, TREE_X + 4, PIN_Y + 2, 0.4, { n: 3, spread: 6, size: 2, col: '#e8b878' }); }
      if (t >= FW.done) sparkles(g, t, TREE_X, PIN_Y + 8, FW.done, FW.done + 2.2, 5, 16);
      // behind the crate, the crate, in front
      if (F.behind) drawF();
      if (H && H.behind) drawH();
      SK.help.desk0(g, { stage: 0 }, 0, { key: A.key, paper: A.paper, col: A.col });
      if (A.tape === 'read') tape(g, -5, top - 20, -28, top - 42, F.x + 7, F.feet - 25, A.phase, true);
      if (A.tape === 'pile') tape(g, 3, top - 21, 26, top - 40, 22, FLOOR - 14, A.phase, true);
      if (H && !H.behind) drawH();
      if (!F.behind) drawF();
      // the page held overhead
      if (A.held) wordPage(g, F.x, F.feet - 54, word);
      if (A.banana) { const up = F.pose === 'st_wave_a'; SK.banana(g, F.x - (up ? 17 : 20), F.feet - (up ? 38 : 33), { up: true }); }
      // gibberish letters flying off the page (frozen in the air at the freeze)
      if (A.fly >= 0) for (let i = 0; i < 5; i++) { const ft = A.fly * 1.7 + i / 5, k = ft % 1, ch = 'QXZJKVPRBMFG'[(Math.floor(ft) * 7 + i * 5) % 12]; SK.text(g, ch, Math.round(-2 + i * 3 + k * (i % 2 ? 22 : -16)), Math.round(top - 26 - k * 24), k < 0.7 ? '#fff6d6' : '#c9b88a', { shadow: INK }); }
      for (const q of A.pops) SK.pop(g, q.x, q.y, q.kind, q.k);
    },
    screen(g, t, w, A, view) {
      if (t >= FW.freeze && t < FW.freeze + 0.08) flash(g, view, t, FW.freeze, 0.08);
      if (A.insert > 0) wordInsert(g, view, A.insert, cleanWord(w), A.circle);
      flash(g, view, t, FW.done, 0.08);
    },
  });

  /* =====================================================================
     4. HIBISCUS: the second typewriter floats down under a banana leaf; a grumpy cloud rains on it; we build a hut around it, pole by pole.
     ===================================================================== */
  const H4 = { stop: 2.6, land: 5.0, hop0: 5.4, hop1: 6.0, pry: 6.2, open: 6.6, cloud0: 8.0, rain: 8.8, shield: 9.2, build0: 10.2, walls1: 13.2, thatch0: 13.4, thatch1: 15.2, deco: 15.4, done: 16.0, back0: 16.2, back1: 16.7, hire0: 16.4, hire1: 17.0, type2: 17.2, sulk0: 17.0, sulk1: 18.8, end: 20.4 };
  const HX = { d0: -16, d1: 16 };
  const CLOUD_Y = -97;
  const thatchRow = x => Math.max(0, Math.min(36, Math.floor((1 - Math.abs(x) / 56) * 36 / 0.92)));
  SK.scene({
    id: 'machine-hibiscus', title: 'A Roof Over Our Heads', chapter: 4, duration: H4.end, sky: DAY, safe: SAFE,
    beats: [
      { at: 0.3, who: 'founder', text: 'Business is booming. Our second typewriter is on its way!' },
      { at: 6.6, who: 'founder', text: 'The Hibiscus Ribbon! Pink, shiny, and it smells like flowers.', expr: 'giggle' },
      { at: 8.8, who: 'founder', text: 'No no no, not on the new one! We need a roof.', expr: 'screech' },
      { at: 10.6, who: 'founder', text: 'Bamboo walls. Grass roof. Zero building experience.' },
      { at: 16.2, who: 'founder', text: 'Two typewriters, one hut, zero leaks. Probably.', expr: 'giggle' },
    ],
    cast: w => ({ founder: Object.assign({ name: 'You' }, founderOf(w)) }),
    cues: [
      ...clacks(0.2, H4.stop, 9), { at: 1.5, sfx: 'bell' }, { at: 2.4, sfx: 'whoosh' }, { at: H4.stop, sfx: 'monkey' }, { at: 3.8, sfx: 'whoosh' },
      { at: H4.land, sfx: 'stamp' }, { at: H4.land + 0.05, sfx: 'drum' }, { at: H4.hop0, sfx: 'whoosh' }, { at: H4.hop1, sfx: 'drum' },
      { at: H4.pry, sfx: 'crack' }, { at: H4.open, sfx: 'chest' }, { at: H4.open + 0.05, sfx: 'fanfare' },
      { at: H4.cloud0, sfx: 'shake' }, { at: H4.rain, sfx: 'tick' }, { at: H4.rain + 0.15, sfx: 'tick' }, { at: H4.rain + 0.3, sfx: 'tick' }, { at: H4.rain + 0.4, sfx: 'monkey' },
      ...Array.from({ length: 11 }, (_, i) => ({ at: H4.build0 + ((i * 2 + 1) * (H4.walls1 - H4.build0)) / HUT_POLES, sfx: i % 2 ? 'hammer' : 'drum' })),
      ...Array.from({ length: 4 }, (_, i) => ({ at: H4.thatch0 + i * 0.45 + 0.05, sfx: 'whoosh' })), ...Array.from({ length: 4 }, (_, i) => ({ at: H4.thatch0 + i * 0.45 + 0.4, sfx: 'page' })),
      { at: H4.deco, sfx: 'attach' }, { at: H4.deco + 0.25, sfx: 'attach' }, { at: H4.done, sfx: 'stamp' }, { at: H4.done + 0.1, sfx: 'jackpot' },
      { at: H4.back0, sfx: 'whoosh' }, { at: H4.hire0, sfx: 'monkey' }, ...clacks(H4.type2, H4.end - 0.4, 12, 2), { at: 18.4, sfx: 'bell' }, { at: 19.6, sfx: 'bell' },
    ],
    camera(t) {
      const c = SK.track(t, [
        [0, { x: -10, y: -28, z: 1 }], [2.4, { x: -10, y: -28, z: 1 }], [2.41, { x: 10, y: -84, z: 0 }], [H4.land, { x: 12, y: -32, z: 0 }, 'out'],
        [6.49, { x: 10, y: -32, z: 0 }], [6.5, { x: 6, y: -28, z: 1 }], [7.99, { x: 6, y: -28, z: 1 }], [8.0, { x: 8, y: -42, z: -1 }], [10.09, { x: 4, y: -42, z: -1 }],
        [10.1, { x: 0, y: -42, z: -1 }], [17.09, { x: 0, y: -42, z: -1 }], [17.1, { x: 0, y: -32, z: 0 }], [H4.end, { x: 0, y: -33, z: 0 }],
      ]);
      return { x: c.x + shake(t, H4.land, 0.25) + shake(t, H4.done, 0.2), y: c.y, z: c.z };
    },
    actors(t, w) {
      const sy0 = seatY({ stage: 0 }), sy1 = seatY({ stage: 1 });
      const A = { stage: t < H4.done ? 0 : 1, f: { x: HX.d0, feet: sy0, pose: 'idle', expr: null, flip: false, behind: true }, p: null, key: -1, key1: -1, col: 0, paper: 0.6,
        crate: null, chute: null, leaf: null, open: false, cloud: null, raining: false, poles: 0, thatch: 0, deco: false, hut: t < H4.done, pops: [], bundles: [] };
      const F = A.f;
      // typing, then the founder looks up
      const ty = typing(t, 0.2, H4.stop, 9); if (ty) { F.pose = ty.pose; A.key = ty.key; A.col = (ty.beat % 14) / 14; }
      if (t >= H4.stop && t < H4.hop0) { F.pose = t < 3.0 ? 'st_gasp' : 'idle'; if (t < 4.2) A.pops.push({ kind: '!', x: F.x, y: F.feet - 50, k: seg(t, H4.stop, H4.stop + 0.2) }); }
      // the crate under its leaf
      if (t >= 2.2 && t < H4.land) { const k = seg(t, 2.2, H4.land), sw = Math.round(Math.sin(t * 2.6) * 7 * (1 - k)); A.crate = { x: HX.d1 + sw, y: Math.round(lerp(-160, FLOOR, ease.out(k) * 0.3 + k * 0.7)) }; A.chute = { x: A.crate.x, y: A.crate.y - 30 }; }
      if (t >= H4.land && t < H4.open) { A.crate = { x: HX.d1, y: FLOOR }; if (t >= H4.pry) A.crate.x += fr(t, 20, 2) ? 1 : -1; }
      if (t >= H4.land) { const k = seg(t, H4.land, H4.land + 0.9); A.leaf = { x: Math.round(HX.d1 + k * 34), y: Math.round(lerp(FLOOR - 30, FLOOR + 4, ease.in(k))), flat: k >= 1 }; }
      if (t >= H4.open) A.open = true;
      // hop down, pry it open, cheer
      if (t >= H4.hop0) { F.behind = false; const k = seg(t, H4.hop0, H4.hop1); F.x = lerp(HX.d0, 0, k); F.feet = lerp(sy0, FLOOR, k) + SK.hop(k, 12); F.pose = k < 1 ? 'air' : 'impact'; }
      if (t >= H4.hop1 + 0.15) { F.x = 0; F.feet = FLOOR; F.pose = t < H4.open ? 'crouch' : fr(t, 3, 2) ? 'st_cheer' : 'idle'; F.expr = 'giggle'; if (t >= H4.open) { F.x = Math.round(lerp(0, -12, seg(t, H4.open, H4.open + 0.3))); F.feet = FLOOR + (fr(t, 3, 2) ? -3 : 0); } }
      // the cloud, the rain, the shield
      if (t >= H4.cloud0) {
        let cx = HX.d1, cy = CLOUD_Y + (fr(t, 2, 2) ? 1 : 0), mood = 0;
        if (t < H4.rain) cx = Math.round(lerp(-120, HX.d1, ease.out(seg(t, H4.cloud0, H4.rain))));
        if (t >= H4.sulk0) { const k = seg(t, H4.sulk0, H4.sulk1); cx = Math.round(lerp(HX.d1, 170, ease.in(k))); cy = Math.round(lerp(CLOUD_Y, -140, k)); mood = 1; }
        A.cloud = { x: cx, y: cy, mood }; A.raining = t >= H4.rain && t < H4.done + 0.6;
      }
      if (t >= H4.rain && t < H4.build0) {
        F.expr = 'screech'; F.feet = FLOOR;
        if (t < H4.shield) { F.pose = 'st_gasp'; F.x = -12; }
        else { const k = seg(t, H4.shield, H4.shield + 0.3); F.x = lerp(-12, 8, k); F.pose = 'st_hold'; }
      }
      // the build: poles left to right, then the thatch, then windows and door
      if (t >= H4.build0 && t < H4.done) {
        const kw = seg(t, H4.build0, H4.walls1); A.poles = kw * HUT_POLES; A.thatch = seg(t, H4.thatch0, H4.thatch1); A.deco = t >= H4.deco;
        F.expr = 'determined';
        if (t < H4.walls1) { const px = -44 + Math.floor(A.poles) * 4; F.x = Math.round(Math.max(-40, Math.min(40, px + 6))); const fl = A.poles % 1; F.pose = fl > 0.82 ? 'impact' : fr(t, 10, 2) ? 'st_walk_a' : 'st_walk_b'; F.feet = FLOOR + (fl > 0.82 ? 0 : -fr(t, 10, 2)); }
        else if (t < H4.thatch1) {
          const r = (t - H4.thatch0) % 0.45; F.x = Math.round(lerp(40, -26, seg(t, H4.walls1, H4.thatch0))); F.pose = t < H4.thatch0 ? 'st_walk_a' : r < 0.12 ? 'crouch' : r < 0.22 ? 'launch' : 'st_hold';
          for (let j = 0; j < 4; j++) { const t0 = H4.thatch0 + j * 0.45 + 0.12, k = seg(t, t0, t0 + 0.3); if (k > 0 && k < 1) A.bundles.push({ x: Math.round(lerp(-26, j % 2 ? 22 : -24, k)), y: Math.round(lerp(FLOOR - 40, -54 - j * 8, k) + SK.hop(k, 22)) }); }
        } else { F.x = -26; F.pose = fr(t, 3, 2) ? 'st_cheer' : 'idle'; F.expr = 'giggle'; F.feet = FLOOR + (fr(t, 3, 2) ? -3 : 0); }
      }
      // done: back to the desk; the new typist hops in; both type
      if (t >= H4.done) {
        A.crate = null; A.leaf = null; A.open = false;
        const k = seg(t, H4.back0, H4.back1); F.x = lerp(-26, HX.d0, k); F.feet = k < 1 ? lerp(FLOOR, sy1, k) + SK.hop(k, 12) : sy1; F.pose = k <= 0 ? 'st_cheer' : k < 1 ? 'air' : 'impact'; F.behind = k > 0.5; F.expr = 'giggle';
        const hk = seg(t, H4.hire0, H4.hire1); if (hk > 0) A.p = { x: lerp(70, HX.d1, hk), feet: hk < 1 ? lerp(FLOOR, sy1, hk) + SK.hop(hk, 16) : sy1, pose: hk < 1 ? 'air' : 'impact', behind: hk > 0.5 };
        const a = typing(t, H4.type2, 99, 11), b = typing(t + 0.2, H4.type2 + 0.2, 99, 12);
        if (a) { F.pose = a.pose; A.key = a.key; A.col = (a.beat % 14) / 14; F.expr = 'giggle'; }
        if (b && A.p) { A.p.pose = b.pose; A.key1 = b.key; A.p.expr = 'determined'; }
      }
      return A;
    },
    draw(g, t, w, A, view) {
      const F = A.f, fd = founderOf(w), nl = lead(w, 1), env = view.env;
      // the hut going up (front layer, so the clearing's palms stay behind it)
      if (A.hut && t >= H4.build0) hutBody(g, t, env, lightsTo(view), { poles: A.poles, thatch: A.thatch, deco: A.deco });
      if (A.deco && t < H4.done) { SK.puff(g, -25, -39, seg(t, H4.deco, H4.deco + 0.5), { n: 5, spread: 12 }); SK.puff(g, 25, -39, seg(t, H4.deco + 0.25, H4.deco + 0.75), { n: 5, spread: 12 }); }
      // the cloud's rain (stops on the roof, the founder, or the machine)
      if (A.cloud && A.raining) rainFrom(g, t, A.cloud.x, A.cloud.y, x => {
        if (A.thatch > 0 && Math.abs(x) <= 56) return -50 - Math.min(thatchRow(x), Math.floor(A.thatch * 36));
        if (t >= H4.shield && t < H4.build0 && Math.abs(x - F.x) <= 9) return F.feet - 38;
        if (Math.abs(x - HX.d1) <= 10) return A.open ? FLOOR - 18 : FLOOR - 20;
        return FLOOR;
      });
      // behind the desks
      const drawF = () => { SK.shadow(g, F.x, FLOOR + 1, 10); SK.actor(g, fd.look, F.pose, F.x, F.feet, { hat: fd.hat, expr: F.expr || undefined, flip: F.flip }); };
      const stage = A.stage;
      if (F.behind) drawF();
      if (A.p && A.p.behind) SK.actor(g, nl.look, A.p.pose, A.p.x, A.p.feet, { hat: nl.hat, expr: A.p.expr || undefined });
      station(g, 0, HX.d0, stage, null, null, A.key, { paper: A.paper, col: A.col });
      if (stage === 1) station(g, 1, HX.d1, 1, null, null, A.key1, { paper: 0.3 + ((t * 0.2) % 0.6) });
      // the crate, the chute, the leaf, the unboxed machine
      if (A.leaf) { if (A.leaf.flat) { SK.oval(g, A.leaf.x, A.leaf.y, 16, 2, R.leaf[4]); SK.oval(g, A.leaf.x, A.leaf.y - 1, 15, 1, R.leaf[2]); } else leafChute(g, t, A.leaf.x, A.leaf.y); }
      if (A.chute) leafChute(g, t, A.chute.x, A.chute.y);
      if (A.crate && !A.open) crate(g, A.crate.x, A.crate.y, 1);
      if (A.open && t < H4.done) unboxed(g, t, 1, HX.d1, FLOOR, H4.open);
      if (t >= H4.land && t < H4.land + 0.5) SK.puff(g, HX.d1, FLOOR, seg(t, H4.land, H4.land + 0.5), { n: 6, spread: 18 });
      if (A.p && !A.p.behind) { SK.shadow(g, A.p.x, FLOOR + 1, 10); SK.actor(g, nl.look, A.p.pose, A.p.x, A.p.feet, { hat: nl.hat }); }
      if (!F.behind) drawF();
      for (const b of A.bundles) { rect(g, b.x - 4, b.y - 2, 9, 5, R.straw[4]); rect(g, b.x - 3, b.y - 1, 7, 3, R.straw[2]); rect(g, b.x - 3, b.y - 1, 7, 1, R.straw[1]); rect(g, b.x, b.y - 2, 1, 5, R.woodD[3]); }
      if (A.cloud) cloudlet(g, t, A.cloud.x, A.cloud.y, A.cloud.mood);
      for (const q of A.pops) SK.pop(g, q.x, q.y, q.kind, q.k);
      // the ta-da: a dust cloud round the finished hut
      if (t >= H4.done - 0.1 && t < H4.done + 0.8) { const k = seg(t, H4.done - 0.1, H4.done + 0.8); for (let i = 0; i < 6; i++) SK.puff(g, -50 + i * 20, -10 - (i % 2) * 30, k, { n: 6, spread: 26, size: 5, col: R.paper[2] }); }
      if (t >= H4.done) sparkles(g, t, 0, -60, H4.done, H4.done + 1.8, 6, 50);
    },
    screen(g, t, w, A, view) { flash(g, view, t, H4.done, 0.12); },
  });

  /* =====================================================================
     5. LAGOON: the Lagoon Sprint only ships by boat, so the lagoon comes to us: a wave, a mail boat, and the hut becomes a boathouse.
     ===================================================================== */
  const L5 = { stop: 3.4, wave0: 4.0, wave1: 7.4, toot: 7.0, hop0: 8.4, land: 9.0, open: 9.5, walk0: 9.7, walk1: 10.5, wipe0: 10.8, wipe1: 14.8, done: 15.0, leave: 16.6, end: 19.6 };
  const MOOR = 96, WAVE_A = 170, WAVE_B = -140;
  const waveX = t => lerp(WAVE_A, WAVE_B, seg(t, L5.wave0, L5.wave1));
  const passT = x => L5.wave0 + ((WAVE_A - x) / (WAVE_A - WAVE_B)) * (L5.wave1 - L5.wave0);
  const lineL5 = t => Math.round(lerp(2, -92, seg(t, L5.wipe0, L5.wipe1)));
  SK.scene({
    id: 'machine-lagoon', title: 'The Boathouse', chapter: 5, duration: L5.end, sky: DAY, safe: SAFE,
    beats: [
      { at: 0.3, who: 'founder', text: 'The Lagoon Sprint only ships by boat. Small problem: no lagoon.' },
      { at: 3.8, who: 'narrator', text: 'So the lagoon came to us.' },
      { at: 7.2, who: 'captain', text: 'TOOT TOOT! One Lagoon Sprint for Infinite Monkey Industries!', expr: 'giggle' },
      { at: 10.4, who: 'founder', text: 'Fine. If we live on a lagoon now, we live in a boathouse.' },
      { at: 15.4, who: 'founder', text: 'Three typewriters. One boathouse. Zero dry socks.', expr: 'giggle' },
    ],
    cast: w => ({ founder: Object.assign({ name: 'You' }, founderOf(w)), captain: { name: 'The Captain', look: 'v25', hat: 0, bg: '#2c62a8' } }),
    cues: [
      ...clacks(0.2, L5.stop, 9), { at: 1.8, sfx: 'bell' }, { at: L5.stop, sfx: 'drum' }, { at: L5.stop + 0.15, sfx: 'shake' }, { at: L5.stop + 0.3, sfx: 'monkey' },
      { at: L5.wave0, sfx: 'whoosh' }, { at: 5.0, sfx: 'whoosh' }, { at: passT(32), sfx: 'rip' }, { at: passT(0), sfx: 'rip' }, { at: passT(-32), sfx: 'rip' }, { at: 6.6, sfx: 'whoosh' },
      { at: L5.toot, sfx: 'ding' }, { at: L5.toot + 0.25, sfx: 'ding' }, { at: L5.hop0, sfx: 'whoosh' }, { at: L5.land, sfx: 'stamp' }, { at: L5.open, sfx: 'crack' }, { at: L5.open + 0.05, sfx: 'fanfare' },
      ...Array.from({ length: 11 }, (_, i) => ({ at: L5.wipe0 + 0.2 + i * 0.36, sfx: i % 3 === 2 ? 'drum' : 'hammer' })), { at: L5.wipe1, sfx: 'levelup' }, { at: L5.done, sfx: 'jackpot' },
      ...clacks(L5.done + 0.3, L5.end - 0.4, 12, 2), { at: L5.leave, sfx: 'ding' }, { at: L5.leave + 0.25, sfx: 'ding' },
    ],
    camera(t) {
      const c = SK.track(t, [
        [0, { x: -16, y: -32, z: 0 }], [3.4, { x: -14, y: -32, z: 0 }], [4.2, { x: 50, y: -34, z: 0 }], [5.0, { x: 44, y: -34, z: 0 }], [6.6, { x: -12, y: -32, z: 0 }],
        [6.99, { x: -4, y: -32, z: 0 }], [7.0, { x: 70, y: -28, z: 1 }], [8.99, { x: 66, y: -28, z: 1 }], [9.0, { x: 36, y: -32, z: 0 }], [10.6, { x: 30, y: -32, z: 0 }],
        [10.61, { x: 0, y: -42, z: -1 }], [L5.end, { x: 8, y: -42, z: -1 }],
      ]);
      return { x: c.x + shake(t, L5.stop, 0.5), y: c.y + shake(t, L5.land, 0.15), z: c.z };
    },
    actors(t, w) {
      const sy = seatY({ stage: 1 }), xs = [slotX(3, 0), slotX(3, 1), slotX(3, 2)];
      const A = { stage: 2, build: t < L5.wipe0 ? 0 : t < L5.wipe1 ? -lineL5(t) / 140 : 1, line: lineL5(t), wave: t >= L5.wave0 && t < L5.wave1 ? waveX(t) : null, land: t < L5.wave1 ? waveX(t) : -999,
        typ: [], key: [-1, -1, -1], f: null, boat: null, crate: null, open: false, pops: [], crew3: t >= L5.done };
      // the two typists at their desks (hopping over the wave), then the founder gets down
      for (let i = 0; i < 2; i++) {
        const T = { x: xs[i], feet: sy, pose: 'idle', expr: null };
        const ty = typer(t, i, 0.2, L5.stop); if (ty) { T.pose = ty.pose; A.key[i] = ty.key; }
        if (t >= L5.stop && t < 9.6) { T.pose = 'st_gasp'; T.expr = 'screech'; if (t < 4.6) A.pops.push({ kind: '!', x: T.x, y: T.feet - 50, k: seg(t, L5.stop, L5.stop + 0.2) }); }
        const pk = seg(t, passT(xs[i]) - 0.3, passT(xs[i]) + 0.35); if (pk > 0 && pk < 1) { T.pose = pk < 0.12 ? 'crouch' : 'air'; T.feet = sy + Math.round(SK.hop(pk, 18)); }
        if (t >= L5.wave1 && t < 9.6) { T.pose = 'idle'; T.expr = 'giggle'; }
        if (i === 1 && t >= 9.6) { const ty2 = typer(t, 1, 9.6, 99); if (ty2) { T.pose = ty2.pose; A.key[1] = ty2.key; T.expr = 'determined'; } }
        A.typ.push(T);
      }
      if (t >= 9.6) {   // the founder hops down and goes to look at the new machine
        A.typ[0] = null;
        const k = seg(t, 9.6, 10.0), wk = SK.walk(t, 10.0, L5.walk1, -12, 58);
        A.f = k < 1 ? { x: lerp(xs[0], -12, k), feet: lerp(sy, FLOOR, k) + SK.hop(k, 10), pose: 'air' } : { x: wk.x, feet: FLOOR, pose: wk.pose };
        if (t >= L5.walk1) { A.f.pose = t > L5.wipe0 ? (fr(t, 2.5, 2) ? 'st_point' : 'st_cheer') : 'idle'; A.f.flip = true; A.f.expr = 'giggle'; }
      }
      // the boat: rides the crest in, moors; the crate hops onto the dock
      if (t >= L5.wave0) {
        const wx = waveX(t), riding = wx + 16 > MOOR, bx = riding ? wx + 16 : MOOR;
        const by = riding ? 2 - waveCrest(wx)(16) + 4 : Math.round(lerp(-14, 8, ease.out(seg(t, passT(MOOR - 16), passT(MOOR - 16) + 0.6)))) + (fr(t, 1.5, 2) ? 1 : 0);
        A.boat = { x: Math.round(t >= L5.leave ? lerp(MOOR, 230, ease.in(seg(t, L5.leave, L5.end))) : bx), y: Math.round(by) };
        if (t < L5.hop0) A.crate = { x: A.boat.x + 12, y: A.boat.y - 6, inBoat: true };
      }
      if (t >= L5.hop0 && t < L5.open) { const k = seg(t, L5.hop0, L5.land); A.crate = { x: Math.round(lerp(MOOR + 12, xs[2], k)), y: Math.round(lerp(A.boat.y - 6, FLOOR, k) + SK.hop(k, 26)) }; }
      if (t >= L5.open && t < L5.done) A.open = true;
      if (A.crew3) {
        A.f = null; A.typ = xs.map((x, i) => ({ x, feet: sy, pose: 'idle', expr: 'determined' }));
        A.typ.forEach((T, i) => { const ty = typer(t, i, L5.done + 0.3, 99); if (ty) { T.pose = ty.pose; A.key[i] = ty.key; } });
      }
      return A;
    },
    back(g, t, w, A, view) {
      // dry land until the wave reaches it (the hut's clearing), the lagoon, the dock and the stilts behind it
      if (A.land > -200) earth(g, view, -view.ox - 4, Math.round(A.land) + 6, 1);
      stilts(g, t, Math.round(A.land) + 6, 999);
      if (t < L5.done) { SK.prop.bigTree(g, t, -94, -100, 11); SK.prop.palm(g, t, 62, 54, 0.6, 5); }   // the hut's trees, until the dust settles
    },
    draw(g, t, w, A, view) {
      const fd = founderOf(w), env = view.env, who = [fd, lead(w, 1), lead(w, 2)];
      // the old hut above the renovation line, the seam
      if (A.build < 1) above(g, view, A.line, () => hutBody(g, t, env, lightsTo(view, A.line)));
      if (t >= L5.wipe0 && t < L5.wipe1) seam(g, t, A.line, 58);
      // desks and typists
      const n = A.crew3 ? 3 : 2;
      for (let i = 0; i < n; i++) { const T = A.typ[i]; station(g, i, slotX(3, i), A.crew3 ? 2 : 1, T ? who[i] : null, T && T.pose, A.key[i], { feet: T && T.feet, expr: T && T.expr, paper: 0.3 + ((t * 0.15 + i * 0.3) % 0.6), col: ((t * 2 + i) % 4) / 4 }); }
      if (A.open) unboxed(g, t, 2, slotX(3, 2), FLOOR, L5.open);
      if (A.crate && !A.crate.inBoat) crate(g, A.crate.x, A.crate.y, 2);
      if (t >= L5.land && t < L5.land + 0.5) SK.puff(g, slotX(3, 2), FLOOR, seg(t, L5.land, L5.land + 0.5), { n: 6, spread: 16 });
      if (A.f) { SK.shadow(g, A.f.x, FLOOR + 1, 10); SK.actor(g, fd.look, A.f.pose, A.f.x, A.f.feet, { hat: fd.hat, expr: A.f.expr || undefined, flip: A.f.flip }); }
      // the wave sweeps over the yard
      if (A.wave != null) wave(g, t, A.wave);
      // the boat, its captain, the crate
      if (A.boat) {
        const B = A.boat, cp = t >= L5.toot && t < L5.toot + 1.2 ? 'st_wave_a' : t >= L5.leave ? (fr(t, 3, 2) ? 'st_wave_a' : 'st_wave_b') : t > L5.wipe0 ? (fr(t, 2.5, 2) ? 'st_cheer' : 'idle') : 'idle';
        SK.actor(g, 'v25', cp, B.x - 13, B.y - 2, { flip: true, clip: [-999, -999, 999, B.y - 6] });
        if (A.crate && A.crate.inBoat) crate(g, A.crate.x, A.crate.y, 2, { lid: true });
        boat(g, t, B.x, B.y);
      }
      for (const q of A.pops) SK.pop(g, q.x, q.y, q.kind, q.k);
      if (t >= L5.wipe1) sparkles(g, t, 0, -60, L5.wipe1, L5.wipe1 + 1.8, 6, 54);
    },
    screen(g, t, w, A, view) { flash(g, view, t, L5.done, 0.1); },
  });

  /* =====================================================================
     6. HONEYCOMB: a swarm delivers the Honeycomb Ledger, the Head Bee audits us, pulls the lagoon's plug, and a second floor goes up
        under the old roof (which the bees keep).
     ===================================================================== */
  const B6 = { swarm0: 0.4, drop: 3.4, open: 4.2, down0: 4.6, down1: 5.1, bee0: 5.2, ins0: 6.0, ins1: 9.0, yank: 9.6, drain0: 9.9, drain1: 11.6, deck1: 12.6, lift0: 11.8, lift1: 12.6, wipe0: 12.8, floor1: 14.0, wipe1: 16.0, away0: 14.0, away1: 15.6, done: 16.2, end: 20.4 };
  const PLUG = { x: -88, y: 13 };
  const lineB6 = t => Math.round(t < B6.floor1 ? lerp(2, -48, seg(t, B6.wipe0, B6.floor1)) : lerp(-48, -114, seg(t, B6.floor1, B6.wipe1)));
  const LEDGER = [['FLOORS', '1'], ['TYPEWRITERS', '4'], ['MONKEYS', 'LOTS'], ['LAGOON', 'DAMP'], ['ADVICE', 'UP!']];
  function ledgerInsert(g, view, t, k) {
    const pw = 92, ph = 62, x = Math.round((view.w - pw) / 2), y0 = Math.round(view.h * 0.4 - ph / 2), y = Math.round(lerp(view.h + 4, y0, ease.out(Math.min(1, k))));
    dim(g, view, 0.5 * k, '26,15,20');
    rect(g, x + 3, y + 3, pw, ph, 'rgba(26,15,20,.45)');
    rect(g, x - 1, y - 1, pw + 2, ph + 2, '#5a3a06'); rect(g, x, y, pw, ph, '#fff6d6'); rect(g, x, y, pw, 9, '#2f8a35'); rect(g, x, y + 8, pw, 1, '#1a5e24');
    SK.text(g, 'HONEYCOMB LEDGER', x + pw / 2, y + 2, '#fff08c', { align: 'center' });
    const n = Math.floor((t - B6.ins0 - 0.3) * 2.2);
    LEDGER.forEach(([a, b], i) => {
      const ly = y + 12 + i * 8; rect(g, x + 3, ly + 6, pw - 6, 1, '#d8e4c8');
      if (i > n) return;
      SK.text(g, a, x + 4, ly, '#3a2a30'); for (let d = x + 6 + SK.textW(a); d < x + pw - 6 - SK.textW(b); d += 2) dot(g, d, ly + 4, '#a4a4b4');
      SK.text(g, b, x + pw - 4, ly, i === 4 ? '#b8322a' : '#3a2a30', { align: 'right' });
    });
    if (n >= 4) { const ax = x + pw - 16, ay = y + 56; rect(g, ax - 8, ay - 2, 3, 2, '#d8a040'); rect(g, ax - 4, ay - 5, 3, 5, '#d8a040'); rect(g, ax, ay - 9, 3, 9, '#d8a040'); for (let i = 0; i < 4; i++) rect(g, ax + 4 + i, ay - 14 + i, 1, 1, '#b8322a'); rect(g, ax + 3, ay - 15, 3, 1, '#b8322a'); }
  }
  SK.scene({
    id: 'machine-honeycomb', title: 'The Hive', chapter: 6, duration: B6.end, sky: DAY, safe: SAFE,
    beats: [
      { at: 0.3, who: 'narrator', text: 'The Honeycomb Ledger was delivered by its accountants.' },
      { at: 6.0, who: 'bee', text: 'BZZ. Audit complete. Too many monkeys, not enough floors. Build UP.' },
      { at: 9.6, who: 'founder', text: 'Wait. The lagoon has a PLUG?', expr: 'screech' },
      { at: 12.4, who: 'narrator', text: 'The bees took it from there. Including the roof.' },
      { at: 16.4, who: 'founder', text: 'Two floors, four typewriters, and a bee in charge of the books.', expr: 'giggle' },
    ],
    cast: w => ({ founder: Object.assign({ name: 'You' }, founderOf(w)), bee: { name: 'The Head Bee', bg: '#a8681a', draw: g => headBee(g, 9, 16, 0) } }),
    cues: [
      { at: B6.swarm0, sfx: 'shake' }, { at: 1.4, sfx: 'shake' }, { at: 2.4, sfx: 'shake' }, { at: B6.drop, sfx: 'whoosh' }, { at: B6.drop + 0.3, sfx: 'stamp' },
      { at: B6.open, sfx: 'crack' }, { at: B6.open + 0.05, sfx: 'fanfare' }, { at: B6.down0, sfx: 'whoosh' }, { at: B6.bee0, sfx: 'tick' },
      { at: B6.ins0, sfx: 'page' }, ...LEDGER.map((_, i) => ({ at: B6.ins0 + 0.3 + i / 2.2, sfx: 'tick' })), { at: B6.ins0 + 0.3 + 4 / 2.2, sfx: 'coin' }, { at: B6.ins1, sfx: 'page' },
      { at: B6.yank, sfx: 'crack' }, { at: B6.yank + 0.1, sfx: 'whoosh' }, { at: 10.4, sfx: 'shake' }, { at: 11.0, sfx: 'shake' }, { at: B6.drain1, sfx: 'unpeel' },
      ...Array.from({ length: 6 }, (_, i) => ({ at: B6.drain1 + 0.1 + i * 0.16, sfx: 'tick' })), { at: B6.lift0, sfx: 'whoosh' },
      ...Array.from({ length: 8 }, (_, i) => ({ at: B6.wipe0 + 0.15 + i * 0.4, sfx: i % 2 ? 'hammer' : 'attach' })), { at: B6.floor1, sfx: 'stamp' }, { at: B6.wipe1, sfx: 'stamp' }, { at: B6.done, sfx: 'jackpot' },
      ...clacks(B6.done + 0.2, B6.end - 0.4, 12, 2),
    ],
    camera(t) {
      const c = SK.track(t, [
        [0, { x: -20, y: -44, z: -1 }], [3.2, { x: 10, y: -42, z: -1 }], [4.19, { x: 20, y: -42, z: -1 }], [4.2, { x: 30, y: -32, z: 0 }], [5.19, { x: 10, y: -32, z: 0 }],
        [5.2, { x: -40, y: -28, z: 1 }], [9.39, { x: -44, y: -28, z: 1 }], [9.4, { x: -50, y: -32, z: 0 }], [11.6, { x: -40, y: -32, z: 0 }],
        [11.61, { x: 0, y: -42, z: -1 }], [16.19, { x: 0, y: -44, z: -1 }], [16.2, { x: 0, y: -54, z: zw() }], [B6.end, { x: 0, y: -54, z: zw() }],
      ]);
      return { x: c.x, y: c.y + shake(t, B6.drop + 0.3, 0.15) + shake(t, B6.floor1, 0.12) + shake(t, B6.wipe1, 0.15), z: c.z };
    },
    actors(t, w) {
      const sy = seatY({ stage: 2 }), A = { stage: t < B6.drain1 ? 2 : 3, build: t < B6.drain1 ? 1 : t < B6.wipe0 ? 0 : t < B6.wipe1 ? -lineB6(t) / 140 : 1, line: lineB6(t),
        typ: [], key: [-1, -1, -1, -1], f: null, crate: null, open: false, swarm: null, hb: null, insert: 0, chain: null, drain: 0, deck: 1, roof: null, pops: [], crew4: t >= B6.done };
      // the swarm carries the crate in, drops it, then hangs around the building
      const dropX = slotX(4, 3);
      if (t < B6.drop) { const k = seg(t, B6.swarm0, B6.drop); A.swarm = { x: Math.round(lerp(-170, dropX, ease.out(k))), y: Math.round(lerp(-80, -46, k) + Math.sin(t * 3) * 4), n: 40, sp: 18 }; A.crate = { x: A.swarm.x, y: A.swarm.y + 26 }; }
      else if (t < B6.lift0) { A.swarm = { x: Math.round(lerp(dropX, 20, seg(t, B6.drop, B6.drop + 2))), y: -100, n: 36, sp: 28 }; }
      if (t >= B6.drop && t < B6.open) { const k = seg(t, B6.drop, B6.drop + 0.3); A.crate = { x: dropX, y: Math.round(lerp(-20, FLOOR, ease.in(k))) }; }
      if (t >= B6.open && t < B6.done) A.open = true;
      // the typists (desk 0 is the founder's until he gets up)
      for (let i = 0; i < 3; i++) {
        const T = { x: slotX(4, i), feet: sy, pose: 'idle', expr: 'determined' }, ty = typer(t, i, 0.2, i === 0 ? B6.down0 : 99); if (ty) { T.pose = ty.pose; A.key[i] = ty.key; }
        if (t >= B6.yank && t < B6.drain1 && i > 0) { T.pose = 'st_gasp'; T.expr = 'screech'; }
        A.typ.push(T);
      }
      if (t >= B6.down0 && !A.crew4) {
        A.typ[0] = null; const k = seg(t, B6.down0, B6.down1), x0 = slotX(4, 0);
        A.f = { x: lerp(x0, -54, k), feet: k < 1 ? lerp(sy, FLOOR, k) + SK.hop(k, 10) : FLOOR, pose: k < 1 ? 'air' : 'idle', expr: null };
        if (t >= B6.bee0 && t < B6.yank) { A.f.pose = 'st_think'; A.f.expr = 'inspect'; }
        if (t >= B6.yank && t < B6.drain1) { A.f.pose = 'st_gasp'; A.f.expr = 'screech'; if (t < 10.4) A.pops.push({ kind: '!', x: A.f.x, y: FLOOR - 50, k: seg(t, B6.yank, B6.yank + 0.2) }); }
        if (t >= B6.drain1) { A.f.pose = t > B6.wipe0 ? (fr(t, 2.5, 2) ? 'st_cheer' : 'idle') : 'idle'; A.f.expr = 'giggle'; A.f.feet = FLOOR + (t > B6.wipe0 && fr(t, 2.5, 2) ? -3 : 0); }
      }
      // the Head Bee: to the founder, the audit, down to the plug, the yank
      if (t >= B6.bee0 && t < B6.lift0) {
        let x = -30, y = -30 + (fr(t, 3, 2) ? 1 : 0), flip = true;
        if (t < B6.ins0) { const k = seg(t, B6.bee0, B6.ins0); x = Math.round(lerp(40, -30, ease.out(k))); y = Math.round(lerp(-90, -30, k)); }
        if (t >= B6.ins1) { const k = seg(t, B6.ins1, B6.yank); x = Math.round(lerp(-30, PLUG.x + 6, k)); y = Math.round(lerp(-30, -2, k)); flip = true; }
        if (t >= B6.yank) { const k = seg(t, B6.yank, B6.yank + 0.5); x = PLUG.x + 6; y = Math.round(lerp(-2, -34, ease.out(k))); }
        A.hb = { x, y, flip, ledger: t < B6.ins1 + 0.3 };
      }
      if (t < B6.yank + 0.5) A.chain = t < B6.yank ? { y: PLUG.y, top: 2 } : { y: Math.round(lerp(PLUG.y, -20, ease.out(seg(t, B6.yank, B6.yank + 0.5)))), top: null };
      else if (t < B6.drain1) A.chain = { y: -20 + (fr(t, 3, 2) ? 1 : 0), top: null, hang: true };
      if (t >= B6.ins0 && t < B6.ins1 + 0.3) A.insert = t < B6.ins1 ? seg(t, B6.ins0, B6.ins0 + 0.3) : 1 - seg(t, B6.ins1, B6.ins1 + 0.3);
      A.drain = seg(t, B6.drain0, B6.drain1);
      // after the drain: the bees take the dock planks away, lift the roof, carry it off
      if (t >= B6.drain1) A.deck = 1 - seg(t, B6.drain1, B6.deck1);
      if (t >= B6.drain1) {
        const k = seg(t, B6.lift0, B6.lift1), a = seg(t, B6.away0, B6.away1);
        A.roof = { dx: Math.round(lerp(0, 230, ease.in(a))), dy: Math.round(-ease.out(k) * 20 - ease.in(a) * 60) };
        A.swarm = { x: A.roof.dx, y: A.roof.dy - 78, n: 44, sp: 46 };
        if (a >= 1) A.swarm = { x: 240, y: -200, n: 0, sp: 1 };
      }
      if (A.crew4) { A.typ = [0, 1, 2, 3].map(i => { const T = { x: slotX(4, i), feet: sy, pose: 'idle', expr: 'determined' }, ty = typer(t, i, B6.done + 0.2, 99); if (ty) { T.pose = ty.pose; A.key[i] = ty.key; } return T; }); A.f = null; }
      return A;
    },
    back(g, t, w, A, view) {
      if (A.stage === 2) {
        if (A.drain > 0) {   // the lagoon drains toward the plug: earth outside a shrinking pool, the dock redrawn on top
          const rx = Math.round(lerp(260, 0, ease.out(A.drain))), ry = Math.max(1, Math.round(rx * 0.3)), bh = view.h - view.oy + 8;
          g.save(); g.beginPath();
          const band = (a, b, y) => { a = Math.max(-102, a); b = Math.min(102, b); if (b > a) g.rect(a, y, b - a, 1); };
          for (let y = -2; y < bh; y++) { const d = (y - PLUG.y) / ry, hw = Math.abs(d) < 1 ? Math.round(rx * Math.sqrt(1 - d * d)) : -1; if (hw < 0) band(-102, 102, y); else { band(-102, PLUG.x - hw, y); band(PLUG.x + hw, 102, y); } }
          g.clip(); earth(g, view, -102, 102, 3); g.restore();
          for (let i = 0; i < 26 && rx > 2; i++) { const a = i * 0.55 + t * 7, r = (i / 26) * Math.min(rx, 40); dot(g, Math.round(PLUG.x + Math.cos(a) * r), Math.round(PLUG.y + Math.sin(a) * r * 0.3), i % 3 ? R.drop[1] : '#ffffff'); }
          dock(g); stilts(g, t);
        } else stilts(g, t);
      } else {
        const hw = Math.round(72 * A.deck); if (hw > 0) dock(g, -hw, hw);
        if (t < B6.done) { SK.prop.palm(g, t, -82, 58, -0.6, 2); SK.prop.palm(g, t, 86, 50, 0.8, 7); }
      }
    },
    draw(g, t, w, A, view) {
      const fd = founderOf(w), env = view.env, who = [fd, lead(w, 1), lead(w, 2), lead(w, 3)];
      // the old boathouse above the line (front layer), its roof on its own (lifted by the bees)
      if (A.stage === 3 && A.build < 1) above(g, view, A.line, () => boatWalls(g, t, env, lightsTo(view, A.line)));
      if (A.roof) boatRoof(g, A.roof.dx, A.roof.dy);
      if (t >= B6.wipe0 && t < B6.wipe1) seam(g, t, A.line, A.line < -46 ? 58 : 66);
      // dock planks flying up
      if (t >= B6.drain1 && t < B6.deck1 + 0.4) for (let i = 0; i < 8; i++) { const t0 = B6.drain1 + i * 0.12, k = seg(t, t0, t0 + 0.5); if (k <= 0 || k >= 1) continue; const s = i % 2 ? -1 : 1, x = Math.round(s * lerp(70 - i * 8, 30, k)), y = Math.round(lerp(0, -110, ease.in(k))); if (fr(t + i, 8, 2)) rect(g, x - 5, y, 11, 2, R.wood[1]); else rect(g, x, y - 5, 2, 11, R.wood[1]); }
      // desks
      for (let i = 0; i < (A.crew4 ? 4 : 3); i++) { const T = A.typ[i]; station(g, i, slotX(4, i), A.stage, T ? who[i] : null, T && T.pose, A.key[i], { feet: T && T.feet, expr: T && T.expr, paper: 0.3 + ((t * 0.15 + i * 0.3) % 0.6), col: ((t * 2 + i) % 4) / 4 }); }
      if (A.open) unboxed(g, t, 3, slotX(4, 3), FLOOR, B6.open);
      if (A.crate) { crate(g, A.crate.x, A.crate.y, 3); if (t < B6.drop) for (const s of [-1, 1]) for (let k = 0; k < 8; k++) dot(g, A.crate.x + s * 10, A.crate.y - 21 - k * 2, '#c8a060'); }
      if (t >= B6.drop + 0.3 && t < B6.drop + 0.8) SK.puff(g, slotX(4, 3), FLOOR, seg(t, B6.drop + 0.3, B6.drop + 0.8), { n: 6, spread: 16 });
      if (A.f) { SK.shadow(g, A.f.x, FLOOR + 1, 10); SK.actor(g, fd.look, A.f.pose, A.f.x, A.f.feet, { hat: fd.hat, expr: A.f.expr || undefined }); }
      // the plug chain, the bees
      if (A.chain) { const top = A.chain.top != null ? A.chain.top : A.hb ? A.hb.y + 3 : A.chain.y - 10; for (let y = top; y < A.chain.y; y += 2) dot(g, PLUG.x, y, R.metal[y % 4 ? 2 : 1]); rect(g, PLUG.x - 2, A.chain.y, 5, 3, INK); rect(g, PLUG.x - 1, A.chain.y, 3, 2, '#5c4650'); }
      if (A.swarm && A.swarm.n) swarm(g, t, A.swarm.x, A.swarm.y, A.swarm.n, A.swarm.sp);
      if (A.hb) headBee(g, A.hb.x, A.hb.y, t, { flip: A.hb.flip, ledger: A.hb.ledger });
      for (const q of A.pops) SK.pop(g, q.x, q.y, q.kind, q.k);
      if (t >= B6.wipe1) sparkles(g, t, 0, -70, B6.wipe1, B6.wipe1 + 1.8, 6, 60);
    },
    screen(g, t, w, A, view) { if (A.insert > 0) ledgerInsert(g, view, t, A.insert); flash(g, view, t, B6.wipe1, 0.1); },
  });

  /* =====================================================================
     7. ORCHID: a red carpet, a doorman with the Orchid Imperial held high; it will not type without columns. Columns, a pediment,
        and a theatre curtain that rises on the grand hall.
     ===================================================================== */
  const O7 = { roll0: 0.6, roll1: 2.0, walk0: 1.8, walk1: 4.2, cols0: 7.0, ped0: 9.2, ped1: 9.8, curt0: 11.4, curt1: 12.0, swap: 12.4, set0: 12.2, set1: 13.0, post0: 13.1, post1: 14.0, rope: 14.2, rise0: 14.4, rise1: 15.6, hire0: 15.8, hire1: 16.4, end: 19.6 };
  const COLS = [-74, -50, 46, 70];
  const DOOR_X = -92, CARPET_Y = FLOOR + 6;
  function column(g, cx, k) {
    const S = R.stone, h = Math.round(73 * k), top = -6 - h; if (h <= 0) return;
    rect(g, cx - 1, top + 3, 10, h - 3, S[4]); rect(g, cx, top + 4, 8, h - 4, S[2]); rect(g, cx + 1, top + 4, 2, h - 4, S[0]); rect(g, cx + 5, top + 4, 1, h - 4, S[3]);
    rect(g, cx - 2, top, 12, 4, S[1]); rect(g, cx - 2, -9, 12, 3, S[1]);
  }
  function pediment(g, dy) {
    const S = R.stone, W = 84;
    rect(g, -W - 4, -86 + dy, W * 2 + 8, 8, S[4]); rect(g, -W - 3, -85 + dy, W * 2 + 6, 6, S[1]); rect(g, -W - 3, -80 + dy, W * 2 + 6, 1, S[3]);
    SK.text(g, 'INFINITE MONKEY INDUSTRIES', 0, -84 + dy, '#7a5a1a', { align: 'center' });
    for (let y = 0; y < 24; y++) { const w = Math.round((W + 4) * (1 - y / 24)); rect(g, -w - 1, -87 - y + dy, w * 2 + 2, 1, S[4]); rect(g, -w, -87 - y + dy, w * 2, 1, y < 2 ? S[1] : S[2]); }
    disc(g, 0, -96 + dy, 5, S[4]); disc(g, 0, -96 + dy, 4, '#ffd23a'); disc(g, -1, -97 + dy, 2, R.banY[1]);
  }
  /** A theatre curtain hanging down to world y = bottom, wide enough for any view */
  function curtain(g, t, bottom, sway) {
    const Rd = R.red, top = -420; if (bottom <= top) return;
    for (let x = -200; x < 200; x += 6) { const off = Math.round(Math.sin(x * 0.7 + sway) * 1); rect(g, x, top, 6, bottom - top + off, Rd[3]); rect(g, x + 1, top, 3, bottom - top + off, Rd[2]); rect(g, x + 1, top, 1, bottom - top + off, Rd[1]); }
    for (let x = -200; x < 200; x += 3) rect(g, x, bottom - 2 + (x % 2), 2, 4, x % 6 ? '#ffd23a' : '#c98f0e');
    rect(g, -200, bottom - 3, 400, 1, '#b38004');
  }
  function cushion(g, x, y) { x = Math.round(x); y = Math.round(y); const P = R.purple; SK.oval(g, x, y, 13, 3, INK); SK.oval(g, x, y - 1, 12, 2, P[2]); rect(g, x - 9, y - 3, 18, 1, P[1]); for (const s of [-13, 12]) { rect(g, x + s, y, 2, 3, '#ffd23a'); dot(g, x + s, y + 3, '#c98f0e'); } }
  SK.scene({
    id: 'machine-orchid', title: 'The Grand Hall', chapter: 7, duration: O7.end, sky: DAY, safe: SAFE,
    beats: [
      { at: 0.3, who: 'narrator', text: 'First a fanfare. Then a red carpet. Then a monkey in a very tall hat.' },
      { at: 4.4, who: 'doorman', text: 'Presenting: the Orchid Imperial. It does not type without columns.' },
      { at: 6.4, who: 'founder', text: 'Columns. Right. Of course. Everybody: columns!', expr: 'screech' },
      { at: 10.0, who: 'doorman', text: 'Better. But the walls are still... sticky.' },
      { at: 15.6, who: 'founder', text: 'Columns, curtains, a doorman. We are a very serious publisher now.', expr: 'giggle' },
    ],
    cast: w => ({ founder: Object.assign({ name: 'You' }, founderOf(w)), doorman: { name: 'The Doorman', look: 'v28', hat: 2, bg: '#781c16' } }),
    cues: [
      { at: 0.3, sfx: 'fanfare' }, { at: O7.roll0, sfx: 'whoosh' }, { at: O7.roll1, sfx: 'drum' }, ...Array.from({ length: 6 }, (_, i) => ({ at: O7.walk0 + 0.2 + i * 0.38, sfx: 'tick' })),
      { at: 4.3, sfx: 'ding' }, { at: 6.4, sfx: 'monkey' },
      ...COLS.map((_, i) => ({ at: O7.cols0 + i * 0.5 + 0.35, sfx: 'stamp' })), { at: O7.ped0, sfx: 'whoosh' }, { at: O7.ped1, sfx: 'stamp' }, { at: O7.ped1 + 0.02, sfx: 'crack' },
      { at: O7.curt0 - 0.2, sfx: 'crit' }, { at: O7.curt0, sfx: 'whoosh' }, { at: O7.curt1, sfx: 'drum' }, { at: O7.set1, sfx: 'attach' }, { at: O7.rope, sfx: 'tick' },
      { at: O7.rise0, sfx: 'whoosh' }, { at: O7.rise0 + 0.4, sfx: 'triumph' }, { at: O7.rise1, sfx: 'jackpot' }, { at: O7.hire1, sfx: 'drum' }, ...clacks(O7.hire1 + 0.2, O7.end - 0.4, 12, 2),
    ],
    camera(t) {
      const c = SK.track(t, [
        [0, { x: -40, y: -42, z: -1 }], [1.6, { x: -40, y: -42, z: -1 }], [1.61, { x: -60, y: -32, z: 0 }], [4.39, { x: -30, y: -32, z: 0 }], [4.4, { x: -24, y: -28, z: 1 }],
        [6.39, { x: -24, y: -28, z: 1 }], [6.4, { x: -72, y: -28, z: 1 }], [6.99, { x: -72, y: -28, z: 1 }], [7.0, { x: 0, y: -54, z: zw() }], [O7.end, { x: -6, y: -54, z: zw() }],
      ]);
      return { x: c.x, y: c.y + shake(t, O7.ped1, 0.3, 2) + shake(t, O7.curt1, 0.12), z: c.z };
    },
    actors(t, w) {
      const sy = seatY({ stage: 3 }), A = { stage: t < O7.swap ? 3 : 4, doorman: t >= O7.post1, typ: [], key: [-1, -1, -1, -1, -1], f: null, d: null, carpet: 0, cols: [0, 0, 0, 0], ped: null, curtain: null, held: true, set: t >= O7.set1, p: null, pops: [] };
      A.carpet = seg(t, O7.roll0, O7.roll1);
      // the crew: desks 1..3 type all scene, the founder at desk 0 until he jumps up
      for (let i = 0; i < 4; i++) {
        const T = { x: slotX(5, i), feet: sy, pose: 'idle', expr: 'determined' }, ty = typer(t, i, 0.2, i === 0 ? 4.4 : 99); if (ty) { T.pose = ty.pose; A.key[i] = ty.key; }
        if (i > 0 && t >= 4.4 && t < 7.0) { T.pose = 'idle'; T.expr = 'inspect'; A.key[i] = -1; }
        if (i > 0 && t >= O7.ped1 && t < O7.ped1 + 0.8) { T.pose = 'st_gasp'; T.expr = 'screech'; }
        A.typ.push(T);
      }
      if (t >= 4.4) {
        A.typ[0] = null; const k = seg(t, 6.2, 6.7), x0 = slotX(5, 0);
        A.f = { x: lerp(x0, -60, k), feet: k > 0 && k < 1 ? lerp(sy, FLOOR, k) + SK.hop(k, 12) : k >= 1 ? FLOOR : sy, pose: k <= 0 ? 'st_gasp' : k < 1 ? 'air' : 'st_point', expr: k <= 0 ? 'screech' : 'determined', behind: k < 0.5 };
        if (t >= O7.cols0) { A.f.pose = fr(t, 3, 2) ? 'st_cheer' : 'st_point'; A.f.expr = 'giggle'; }
        if (t >= O7.post1) { A.f.pose = fr(t, 3, 2) ? 'st_cheer' : 'idle'; A.f.feet = FLOOR + (fr(t, 3, 2) ? -3 : 0); }
      }
      // the doorman: walks the carpet with the machine held high, sets it on desk 4, takes his post, pulls the rope
      const dx1 = -30, setX = slotX(5, 4) - 20;
      const D = { x: -150, feet: CARPET_Y, pose: 'st_offer', expr: 'inspect', flip: false };
      if (t >= O7.walk0) { const wk = SK.walk(t, O7.walk0, O7.walk1, -150, dx1); D.x = wk.x; D.feet = CARPET_Y + (wk.moving ? -fr(t - O7.walk0, 5, 2) : 0); }
      if (t >= 6.4 && t < O7.set0) D.expr = t > O7.ped1 ? 'giggle' : 'inspect';
      if (t >= O7.curt0 - 0.3 && t < O7.curt0) D.pose = 'st_wave_a';
      if (t >= O7.set0) { const wk = SK.walk(t, O7.set0, O7.set1 - 0.1, dx1, setX); D.x = wk.x; D.feet = t < O7.set1 ? CARPET_Y + (wk.moving ? -fr(t, 5, 2) : 0) : FLOOR; D.pose = 'st_offer'; }
      if (t >= O7.set1) A.held = false;
      if (t >= O7.post0) { const wk = SK.walk(t, O7.post0, O7.post1, setX, DOOR_X); D.x = wk.x; D.feet = FLOOR - 2; D.pose = wk.moving ? wk.pose : 'idle'; D.flip = wk.moving; D.expr = 'inspect'; }
      A.d = t >= O7.post1 ? null : D;
      // the columns, the pediment, the curtain
      COLS.forEach((_, i) => { A.cols[i] = t < O7.swap ? ease.out(seg(t, O7.cols0 + i * 0.5, O7.cols0 + i * 0.5 + 0.35)) : 0; });
      if (t >= O7.ped0 && t < O7.swap) A.ped = Math.round(lerp(-150, 0, ease.in(seg(t, O7.ped0, O7.ped1))));
      if (t >= O7.curt0 && t < O7.rise1) {
        const down = Math.round(lerp(-300, 0, ease.in(seg(t, O7.curt0, O7.curt1)))) + (t > O7.curt1 ? Math.round(SK.wobble(t - O7.curt1, 3, 16, 6)) : 0);
        A.curtain = t < O7.rise0 ? down : Math.round(lerp(0, -300, ease.in(seg(t, O7.rise0, O7.rise1))));
      }
      if (t >= O7.rope && t < O7.rise0 + 0.3 && A.d) A.d.pose = 'st_wave_a';
      // the new typist hops in
      const hk = seg(t, O7.hire0, O7.hire1); if (hk > 0) { A.p = { x: lerp(130, slotX(5, 4), hk), feet: hk < 1 ? lerp(FLOOR, sy, hk) + SK.hop(hk, 16) : sy, pose: hk < 1 ? 'air' : 'idle', behind: hk > 0.5 }; const ty = typer(t, 4, O7.hire1 + 0.1, 99); if (ty) { A.p.pose = ty.pose; A.key[4] = ty.key; } }
      return A;
    },
    draw(g, t, w, A, view) {
      const fd = founderOf(w), who = [fd, lead(w, 1), lead(w, 2), lead(w, 3)], nl = lead(w, 4), sy = seatY({ stage: 3 });
      // in front of the hive: columns, the pediment; then the curtain over the whole front
      A.cols.forEach((k, i) => { column(g, COLS[i], k); if (k > 0 && k < 1) SK.puff(g, COLS[i] + 4, -4, k, { n: 5, spread: 12, col: R.stone[1] }); });
      if (A.ped != null) pediment(g, A.ped);
      if (t >= O7.ped1 && t < O7.ped1 + 0.6) for (const cx of COLS) SK.puff(g, cx + 4, -80, seg(t, O7.ped1, O7.ped1 + 0.6), { n: 5, spread: 14, col: R.stone[1] });
      if (A.curtain != null) curtain(g, t, A.curtain, t * 2);
      // the carpet
      if (A.carpet > 0) { const x0 = -200, x1 = Math.round(lerp(-150, 30, ease.out(A.carpet))); rect(g, x0, CARPET_Y - 2, x1 - x0, 5, R.red[4]); rect(g, x0, CARPET_Y - 1, x1 - x0, 3, R.red[2]); rect(g, x0, CARPET_Y - 1, x1 - x0, 1, '#ffd23a'); rect(g, x0, CARPET_Y + 1, x1 - x0, 1, '#c98f0e'); if (A.carpet < 1) { disc(g, x1, CARPET_Y - 3, 4, R.red[4]); disc(g, x1, CARPET_Y - 3, 3, R.red[2]); dot(g, x1 - 1, CARPET_Y - 4, R.red[1]); } }
      // desks: founder's desk 0 (empty once he is up), 1..3, and desk 4 waiting for the Imperial
      if (A.f && A.f.behind) SK.actor(g, fd.look, A.f.pose, A.f.x, A.f.feet, { hat: fd.hat, expr: A.f.expr });
      if (A.p && A.p.behind) SK.actor(g, nl.look, A.p.pose, A.p.x, A.p.feet, { hat: nl.hat, expr: 'determined' });
      for (let i = 0; i < 4; i++) { const T = A.typ[i]; station(g, i, slotX(5, i), A.stage, T ? who[i] : null, T && T.pose, A.key[i], { feet: T && T.feet, expr: T && T.expr, paper: 0.3 + ((t * 0.15 + i * 0.3) % 0.6), col: ((t * 2 + i) % 4) / 4 }); }
      const top4 = SK.desk(g, slotX(5, 4), FLOOR, 'desk');
      if (A.set) { SK.typewriter(g, 4, slotX(5, 4), top4, A.key[4], { paper: 0.4, col: 0 }); if (t < O7.set1 + 1.2) sparkles(g, t, slotX(5, 4), top4 - 10, O7.set1, O7.set1 + 1.2, 4, 14); }
      if (A.p && !A.p.behind) SK.actor(g, nl.look, A.p.pose, A.p.x, A.p.feet, { hat: nl.hat });
      if (A.f && !A.f.behind) { SK.shadow(g, A.f.x, FLOOR + 1, 10); SK.actor(g, fd.look, A.f.pose, A.f.x, A.f.feet, { hat: fd.hat, expr: A.f.expr, flip: false }); }
      // the doorman (the kit draws him once he is at his post)
      if (A.d) {
        const D = A.d; SK.shadow(g, D.x, D.feet + 1, 10); SK.actor(g, 'v28', D.pose, D.x, D.feet, { hat: 2, expr: D.expr, flip: D.flip });
        if (A.held) { cushion(g, D.x + 20, D.feet - 21); SK.typewriter(g, 4, D.x + 20, D.feet - 23, -1, { paper: 0.2 }); if (t >= O7.walk1 && t < O7.walk1 + 1.4) sparkles(g, t, D.x + 20, D.feet - 34, O7.walk1, O7.walk1 + 1.4, 4, 16); }
        if (t >= O7.rope && t < O7.rise1) { for (let y = -60; y < D.feet - 34; y += 2) dot(g, D.x - 14, y, '#ffd23a'); rect(g, D.x - 16, D.feet - 34, 5, 3, '#c98f0e'); }
      }
      if (t >= O7.rise1) sparkles(g, t, 0, -60, O7.rise1, O7.rise1 + 2, 6, 70);
    },
    screen(g, t, w, A, view) { flash(g, view, t, O7.ped1, 0.1); },
  });

  /* =====================================================================
     8. MOONFLOWER: midnight. The Moonflower Grand comes down a moonbeam; the moon hides; in the dark, flashes show something tall going
        up; the moon comes back on a dark tower, and the tower lights up floor by floor.
     ===================================================================== */
  const M8 = { tilt: 3.2, beam0: 3.6, land: 7.4, walk0: 7.4, walk1: 8.0, open: 8.2, cloud0: 9.6, cloud1: 10.2, dark0: 10.0, dark1: 10.5, swap: 10.6, flashes: [11.0, 11.6, 12.2, 12.8, 13.3], clear0: 13.6, clear1: 14.1, lit0: 14.6, lit1: 17.6, crest: 17.8, wide: 18.4, end: 21.6 };
  const TIERS = [[-80, 80, -56, -2], [-50, 50, -150, -56], [-36, 36, -214, -150], [-22, 22, -250, -214]];
  const moonAt = view => ({ x: Math.round(view.w * 0.78 - view.cam.x * 0.02), y: Math.max(14, Math.round(view.oy * 0.28)) });
  SK.scene({
    id: 'machine-moonflower', title: 'The Tower', chapter: 8, duration: M8.end, sky: { phase: 'night', wx: 0 }, safe: SAFE,
    beats: [
      { at: 0.3, who: 'founder', text: 'The Moonflower Grand only ships at midnight. Nobody knows why.' },
      { at: 3.8, who: 'narrator', text: 'On the stroke of twelve, it came down a moonbeam.' },
      { at: 8.4, who: 'founder', text: 'Ooh. It glows. A typewriter this fancy needs a taller office.', expr: 'giggle' },
      { at: 10.6, who: 'narrator', text: 'Then the moon hid, and something very tall happened.' },
      { at: 14.8, who: 'founder', text: 'Six typewriters. Twenty-four floors. We\'ll grow into it.', expr: 'giggle' },
    ],
    cast: w => ({ founder: Object.assign({ name: 'You' }, founderOf(w)) }),
    cues: [
      { at: 0.2, sfx: 'night' }, { at: 2.2, sfx: 'tick' }, { at: M8.beam0, sfx: 'bell' }, { at: 5.0, sfx: 'coinlet' }, { at: 5.6, sfx: 'coinlet' }, { at: 6.2, sfx: 'coinlet' },
      { at: M8.land, sfx: 'ding' }, { at: M8.open, sfx: 'chest' }, { at: M8.open + 0.1, sfx: 'jackpot' }, { at: M8.cloud0, sfx: 'whoosh' }, { at: M8.dark0, sfx: 'night' },
      ...M8.flashes.map((at, i) => ({ at, sfx: ['hammer', 'crack', 'stamp', 'hammer', 'stamp'][i] })), ...M8.flashes.map(at => ({ at: at + 0.25, sfx: 'drum' })),
      { at: M8.clear0, sfx: 'day' }, ...Array.from({ length: 12 }, (_, i) => ({ at: M8.lit0 + (i + 0.5) * ((M8.lit1 - M8.lit0) / 12), sfx: 'gem', arg: i })),
      { at: M8.crest, sfx: 'jackpot' }, { at: M8.wide, sfx: 'triumph' }, ...clacks(M8.wide + 0.3, M8.end - 0.4, 12, 2),
    ],
    camera(t) {
      const wz = phone() ? -2 : -4, mz = phone() ? -1 : -2;
      const c = SK.track(t, [
        [0, { x: 10, y: -32, z: 0 }], [M8.tilt, { x: 20, y: -34, z: 0 }], [M8.beam0 + 0.4, { x: 30, y: -116, z: 0 }], [M8.land, { x: 56, y: -32, z: 0 }, 'inOut'],
        [8.19, { x: 60, y: -32, z: 0 }], [8.2, { x: 72, y: -28, z: 1 }], [9.59, { x: 72, y: -28, z: 1 }], [9.6, { x: 30, y: -110, z: 0 }], [10.59, { x: 30, y: -110, z: 0 }],
        [10.6, { x: 0, y: -120, z: wz }], [14.39, { x: 0, y: -120, z: wz }], [14.4, { x: 0, y: -50, z: mz }], [M8.lit1, { x: 0, y: -196, z: mz }, 'inOut'],
        [M8.wide - 0.01, { x: 0, y: -196, z: mz }], [M8.wide, { x: 0, y: -118, z: wz }], [M8.end, { x: 0, y: -120, z: wz }],
      ]);
      return { x: c.x, y: c.y + shake(t, M8.crest, 0.15), z: c.z };
    },
    actors(t, w) {
      const sy = seatY({ stage: 4 }), A = { stage: t < M8.swap ? 4 : 5, towerLit: t < M8.swap ? undefined : seg(t, M8.lit0, M8.lit1), typ: [], key: [-1, -1, -1, -1, -1, -1], f: null, crate: null, open: false, cloud: 0, dark: 0, flash: -1, tiers: 0, lantern: null, awake: t >= M8.wide };
      for (let i = 1; i < 5; i++) A.typ[i] = { pose: 'idle', expr: 'determined', feet: sy, zz: true };
      // the founder, with a lantern, by the desks; walks to the landing spot, gasps at the glow
      const F = { x: slotX(6, 5), feet: FLOOR, pose: 'st_offer', expr: null, flip: false };
      if (t >= M8.tilt) { const wk = SK.walk(t, M8.tilt, M8.beam0 + 0.3, slotX(6, 5), slotX(6, 5) + 30); F.x = wk.x; F.pose = wk.moving ? wk.pose : 'st_offer'; }
      if (t >= M8.beam0 + 0.3 && t < M8.land) { F.pose = 'st_gasp'; F.expr = 'screech'; }
      if (t >= M8.walk0) { const wk = SK.walk(t, M8.walk0, M8.walk1, slotX(6, 5) + 30, slotX(6, 5) + 22); F.x = wk.x; F.pose = wk.moving ? wk.pose : 'st_offer'; F.expr = 'giggle'; }
      if (t >= M8.open && t < M8.dark1) { F.pose = fr(t, 3, 2) ? 'st_cheer' : 'st_offer'; F.feet = FLOOR + (fr(t, 3, 2) ? -2 : 0); }
      A.f = F;
      if (t >= M8.beam0 && t < M8.land) A.crate = seg(t, M8.beam0, M8.land);
      if (t >= M8.land && t < M8.open) A.crate = 1;
      if (t >= M8.open && t < M8.wide) A.open = true;
      // the blackout: the cloud over the moon, the dark, the flashes, the clearing
      A.cloud = t < M8.cloud0 ? 0 : t < M8.clear0 ? seg(t, M8.cloud0, M8.cloud1) : 1 + seg(t, M8.clear0, M8.clear1);
      A.dark = t < M8.dark0 ? 0 : t < M8.clear0 ? seg(t, M8.dark0, M8.dark1) : 1 - seg(t, M8.clear0 + 0.1, M8.clear1);
      M8.flashes.forEach((at, i) => { if (t >= at) A.tiers = i + 1; if (t >= at && t < at + 0.2) A.flash = i; });
      // after the reveal: everyone wakes and types, the founder at his desk
      if (A.awake) {
        A.f = null; A.typ = [0, 1, 2, 3, 4, 5].map(i => { const T = { pose: 'idle', expr: 'determined', feet: sy }, ty = typer(t, i, M8.wide + 0.3, 99); if (ty) { T.pose = ty.pose; A.key[i] = ty.key; } return T; });
      } else if (t >= M8.lit0) for (let i = 1; i < 5; i++) { A.typ[i].zz = false; A.typ[i].pose = fr(t + i * 0.3, 3, 2) ? 'st_cheer' : 'idle'; A.typ[i].expr = 'giggle'; }
      return A;
    },
    draw(g, t, w, A, view) {
      const fd = founderOf(w), who = [fd, lead(w, 1), lead(w, 2), lead(w, 3), lead(w, 4), lead(w, 5)], st = A.stage;
      const lastX = slotX(6, 5), top5 = FLOOR - 11;
      // the desks: 0..4 (the founder's empty until the end), 5 = the Moonflower once it is here
      for (let i = 0; i < (A.awake ? 6 : 5); i++) { const T = A.typ[i]; station(g, i, slotX(6, i), st, T ? who[i] : null, T && T.pose, A.key[i], { feet: T && T.feet, expr: T && T.expr, paper: 0.3 + ((t * 0.15 + i * 0.3) % 0.6), col: ((t * 2 + i) % 4) / 4 }); if (T && T.zz) for (let z = 0; z < 2; z++) { const k = ((t * 0.5 + i * 0.27 + z * 0.5) % 1); SK.text(g, 'Z', slotX(6, i) + 6 + Math.round(k * 8), Math.round(sy0(T) - 44 - k * 12), k < 0.7 ? '#fff6d6' : '#9aa8c8', { shadow: INK }); } }
      // the crate on its moonbeam
      if (A.crate != null) {
        const m = moonAt(view), mx = m.x - view.ox, my = m.y - view.oy + 9, k = ease.out(A.crate), cx = Math.round(lerp(mx, lastX, k)), cy = Math.round(lerp(my + 30, FLOOR, k));
        if (A.crate < 1) { for (let i = 0; i < 80; i++) { const s = i / 80, x = Math.round(lerp(mx, cx, s)), y = Math.round(lerp(my, cy - 22, s)); if (y > cy - 22) break; view.light(x, y, 1, 1, i % 4 === Math.floor(t * 12) % 4 ? '#ffffff' : '#c8d8ff'); } sparkles(g, t, cx, cy - 26, 0, 99, 3, 12); }
        crate(g, cx, cy, 5);
        if (A.crate >= 1 && t < M8.land + 0.6) SK.puff(g, lastX, FLOOR, seg(t, M8.land, M8.land + 0.6), { n: 6, spread: 16, col: '#c8d8ff' });
      }
      if (A.open) { unboxed(g, t, 5, lastX, FLOOR, M8.open); view.light(lastX - 10, FLOOR - 9, 20, 1, '#edf2fc'); view.light('glow', lastX, FLOOR - 12, 10, 0.18); }
      if (A.awake) { /* desk 5 is drawn with the row */ }
      // the founder and his lantern
      if (A.f) {
        const F = A.f; SK.shadow(g, F.x, FLOOR + 1, 10); SK.actor(g, fd.look, F.pose, F.x, F.feet, { hat: fd.hat, expr: F.expr || undefined, flip: F.flip });
        const lx = F.x + (F.pose === 'st_offer' ? 17 : F.pose === 'st_cheer' ? 14 : 10), ly = F.feet - (F.pose === 'st_offer' ? 21 : F.pose === 'st_cheer' ? 35 : 18);
        rect(g, lx, ly, 1, 3, INK); rect(g, lx - 2, ly + 3, 5, 6, INK); rect(g, lx - 2, ly + 2, 5, 1, R.woodD[2]); view.light(lx - 1, ly + 4, 3, 4, '#fff0b0'); view.light('glow', lx, ly + 6, 8, fr(t, 3, 2) ? 0.2 : 0.16);
        A.lantern = { x: lx, y: ly + 6 };
      }
      if (st === 5 && A.towerLit >= 1) sparkles(g, t, 0, -232, M8.crest, M8.crest + 2, 6, 16);
    },
    screen(g, t, w, A, view) {
      const m = moonAt(view);
      // the cloud slides over the moon, and away again
      if (A.cloud > 0 && A.cloud < 2) {
        const x = Math.round(m.x + lerp(-60, 0, ease.out(Math.min(1, A.cloud))) + (A.cloud > 1 ? ease.in(A.cloud - 1) * 70 : 0)), y = m.y + 2, C = ['#3a4a8a', '#2a3a7a', '#1e2c70', '#141e55', '#0a1030'];
        SK.oval(g, x, y + 2, 22, 7, C[4]); SK.oval(g, x, y, 21, 6, C[3]); disc(g, x - 8, y - 4, 8, C[3]); disc(g, x + 6, y - 6, 9, C[3]); disc(g, x - 9, y - 6, 4, C[2]); disc(g, x + 4, y - 10, 4, C[2]); rect(g, x - 14, y + 4, 28, 1, C[1]);
      }
      // the blackout, the flashes with the tower's silhouette growing
      if (A.dark > 0) {
        dim(g, view, A.dark * 0.94);
        if (A.flash >= 0) {
          g.fillStyle = '#1e2c70'; g.fillRect(0, 0, view.w, Math.max(0, view.oy));
          for (let i = 0; i < A.tiers && i < 4; i++) { const [x0, x1, y0, y1] = TIERS[i]; rect(g, x0 + view.ox, y0 + view.oy, x1 - x0, y1 - y0, '#05060c'); }
          if (A.tiers >= 5) { rect(g, view.ox - 2, view.oy - 280, 4, 30, '#05060c'); disc(g, view.ox, view.oy - 232, 8, '#05060c'); }
          rect(g, view.ox - 120, view.oy, 240, 8, '#05060c');
          const topY = A.tiers >= 5 ? -280 : TIERS[Math.min(3, A.tiers - 1)][2];
          for (let i = 0; i < 6; i++) SK.sparkle(g, view.ox - 10 + i * 4 + fr(t, 20, 3), view.oy + topY - 2 - (i % 3) * 3, i % 2 ? 1 : 2, i % 2 ? '#ffd23a' : '#ffffff');
        }
        if (A.lantern && A.dark < 1.01) { const x = A.lantern.x + view.ox, y = A.lantern.y + view.oy; rect(g, x - 1, y - 2, 3, 4, '#fff0b0'); g.globalAlpha = 0.25; disc(g, x, y, 6, '#ffe08a'); g.globalAlpha = 1; }
        if (A.stage === 4 || t < M8.clear0) { const x = slotX(6, 5) + view.ox, y = FLOOR - 12 + view.oy; g.globalAlpha = 0.5; rect(g, x - 11, y, 22, 2, '#edf2fc'); g.globalAlpha = 1; }
      }
      flash(g, view, t, M8.crest, 0.08);
    },
  });
  const sy0 = T => (T && T.feet) || seatY({ stage: 4 });
})(typeof globalThis !== 'undefined' ? globalThis : window);
