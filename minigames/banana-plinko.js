/* ============================================================
   BANANA PLINKO: aim and drop a banana (not a ball) down a board of wooden pegs. The banana is a real spinning crescent: it hooks onto pegs, pivots,
   flips and tumbles. Coconut bumpers fire it away like a pinball, a worker monkey paces his ledge and shoves it, and two monkeys swing on vines across
   the board. You get a stock of bananas; an edge bin earns an extra one. Golden banana x3; the rare Diamond banana bursts into five on its first hit.
   Controls: move the mouse / finger to aim, click / tap / Space to drop. Arrow keys nudge the aim. Standalone: no connection to the main game's save yet.
   ============================================================ */
(() => {
  'use strict';
  const { rng, clamp, lerp, sfx, h, spriteImg } = MG;
  const W = 120, H = 208, DROP_Y = 20, BIN_TOP = 576, WORLD_H = BIN_TOP + 32, BIN_W = 16, BIN_X = 4, WALL = 4;
  const VALUES = [100, 25, 10, 5, 10, 25, 100], START_BALLS = 10, G_ACC = 780, PEG_R = 2.8, CIRC_R = 1.9;
  const params = new URLSearchParams(location.search), RARE = +params.get('rare') || 0;

  MG.boot();
  const A = MGArt.build(), { R, make, shapes: { ell, box, or } } = MGArt, FONT = MGArt.FONT;
  const host = document.getElementById('stage'), st = MG.stage(host, W, H, { padY: 40 }), g = st.g;
  host.style.cursor = 'crosshair';
  const ui = MG.ui(host, st, A.banana, 0), fx = MG.fx();
  document.querySelector('.mg-hearts').style.display = 'none';

  /* ---------- the banana: a crescent, rendered at 24 angles so every frame is crisp pixel art ---------- */
  const CA = [0, -5.4], RA = 6.2, SPAN = 60 * Math.PI / 180, STEPS = 24;
  const ARC = [-46, -23, 0, 23, 46].map(d => { const t = Math.PI / 2 + d * Math.PI / 180; return [CA[0] + RA * Math.cos(t), CA[1] + RA * Math.sin(t)]; });
  function crescent(angle, tipPart) {
    const ca = Math.cos(-angle), sa = Math.sin(-angle);
    return (x, y) => {
      const px = x - 9, py = y - 9, lx = px * ca - py * sa, ly = px * sa + py * ca, dx = lx - CA[0], dy = ly - CA[1], d = Math.hypot(dx, dy);
      if (d < 4.6 || d > 7.9) return false; let da = Math.atan2(dy, dx) - Math.PI / 2; da = Math.atan2(Math.sin(da), Math.cos(da));
      const ad = Math.abs(da); return tipPart ? ad > SPAN - .2 && ad <= SPAN : ad <= SPAN;
    };
  }
  const bananaFrames = {};
  for (const kind of ['normal', 'golden', 'diamond']) {
    const ramp = kind === 'golden' ? R.gold : kind === 'diamond' ? R.ice : R.banY;
    bananaFrames[kind] = Array.from({ length: STEPS }, (_, i) => { const a = i / STEPS * Math.PI * 2; return make(18, 18, px => { px.shape(crescent(a, false), ramp, 1); px.shape(crescent(a, true), R.stem, 2); }); });
  }
  const bananaSpr = (kind, a) => bananaFrames[kind][((Math.round(a / (Math.PI * 2) * STEPS) % STEPS) + STEPS) % STEPS];
  const pegSpr = make(9, 9, px => { px.shape(ell(4.5, 4.5, 3.6, 3.6), R.wood, 1); px.tone(3, 3, 2); px.tone(4, 3, 2); px.tone(3, 4, 2); });
  const pegHot = make(9, 9, px => { px.shape(ell(4.5, 4.5, 3.6, 3.6), R.woodL, 1); px.tone(3, 3, 2); });
  const bumpSpr = [make(15, 15, px => { px.shape(ell(7.5, 7.5, 6.8, 6.8), R.red, 1); px.shape(ell(7.5, 7.5, 3.8, 3.8), R.banY, 2); px.tone(4, 4, 2, 1); }), make(15, 15, px => { px.shape(ell(7.5, 7.5, 6.8, 6.8), R.banY, 1); px.shape(ell(7.5, 7.5, 3.8, 3.8), R.paper, 2); })];
  const crateSpr = make(9, 7, px => { px.shape(box(0, 0, 9, 7), R.woodL, 1); px.shape(box(0, 3, 9, 1), R.woodD, 2); });
  const ballBox = h('div', 'sc'); ballBox.append(spriteImg(bananaSpr('normal', 0), 1), h('b', '', '10')); document.querySelector('.mg-hud').appendChild(ballBox);
  const ballNum = ballBox.querySelector('b');

  /* ---------- the board ---------- */
  const pegs = [];
  const peg = (x, y, row) => pegs.push({ x, y, r: PEG_R, hot: 0, row, wood: true });
  /* a tall board: the camera follows the banana, so the next obstacle is never fully in view */
  const WORKERS = [{ y: 114, cx: 60, amp: 34, om: 1.5, ph: 0 }, { y: 374, cx: 60, amp: 34, om: 1.9, ph: 2.4 }];
  const SWINGS = [{ ax: 24, ay: 258, len: 24, amp: 1.0, om: 2.1, ph: 0 }, { ax: 96, ay: 258, len: 24, amp: 1.0, om: 1.8, ph: 2 }, { ax: 30, ay: 402, len: 24, amp: 1.0, om: 1.7, ph: 1 }, { ax: 90, ay: 402, len: 24, amp: 1.0, om: 2.2, ph: 3.5 }];
  const SPINNERS = [{ x: 60, y: 322, arm: 18, om: 2 }, { x: 36, y: 526, arm: 13, om: -2.4 }, { x: 84, y: 526, arm: 13, om: 2.4 }];
  const BUMPERS = [[60, 226], [30, 178], [90, 178], [33, 466], [87, 466], [60, 498]].map(([x, y]) => ({ x, y, r: 6.8, flash: 0 }));
  for (let y = 54, r = 0; y <= 534; y += 20, r++) {
    if (WORKERS.some(w => w.y === y)) continue;                                // the worker's ledge
    const odd = r % 2, n = odd ? 4 : 5;
    const ok = x => !BUMPERS.some(b => Math.hypot(b.x - x, b.y - y) < 17) && !SPINNERS.some(sp => Math.hypot(sp.x - x, sp.y - y) < sp.arm + 6) && !SWINGS.some(sw => y >= sw.ay - 8 && y <= sw.ay + sw.len && Math.abs(x - sw.ax) < 22);
    if (!odd) for (const x of [8.5, W - 8.5]) if (ok(x)) peg(x, y, r);                      // rail pegs: no sliding down the wall to the 100 bin
    for (let c = 0; c < n; c++) { const x = (odd ? 27 : 16) + c * 22; if (ok(x)) peg(x, y, r); }
  }
  for (let i = 1; i < 7; i++) { const x = BIN_X + i * BIN_W; peg(x, BIN_TOP + 2, 9, true); peg(x, BIN_TOP + 8, 9, true); pegs[pegs.length - 1].post = pegs[pegs.length - 2].post = true; pegs[pegs.length - 1].r = pegs[pegs.length - 2].r = 1.8; }
  let cam = 0;
  const ft = (x, y, t, c) => ui.floatText(x, y - Math.round(cam), t, c);

  /* ---------- state ---------- */
  let G = null, botOn = false, aimX = W / 2, keyDir = 0;
  function newGame() {
    G = { t: 0, score: 0, balls: START_BALLS, dropped: 0, combo: 0, bestCombo: 0, live: [], binFlash: Array(7).fill(0), hist: Array(7).fill(0), edges: 0, goldens: 0, diamonds: 0, bestBin: 0, bumps: 0, shoves: 0, shake: 0, cool: 0, nextKind: 'normal', over: 0, hitCd: 0 };
    pegs.forEach(p => p.hot = 0); BUMPERS.forEach(b => b.flash = 0); cam = 0; G.mv = movers(0); rollNext(); fx.clear(); render();
  }
  const mult = () => ui.mult(G.combo);
  function render() { ui.setScore(G.score); ui.setCombo(G.combo, mult()); ballNum.textContent = G.balls; }
  function rollNext() { G.nextKind = G.dropped > 2 && Math.random() < .03 + RARE * .4 ? 'diamond' : G.dropped > 1 && Math.random() < .12 + RARE * .4 ? 'golden' : 'normal'; }

  function newBody(x, y, vx, vy, kind, split) {
    let I = 0; ARC.forEach(([lx, ly]) => { I += (lx * lx + ly * ly) / ARC.length; });
    return { x, y, a: rng(-.5, .5), vx, vy, w: rng(-2, 2), kind, split, age: 0, still: 0, I: I * 1.3, v: kind === 'diamond' ? 5 : kind === 'golden' ? 3 : 1 };
  }
  function drop() {
    if (!S.playing || G.balls <= 0 || G.cool > 0) return;
    G.balls--; G.dropped++; G.cool = .3; const kind = G.nextKind;
    G.live.push(newBody(clamp(aimX, 10, W - 10), DROP_Y, rng(-6, 6), 0, kind, kind === 'diamond')); rollNext(); sfx.tick(); render();
    if (kind !== 'normal') ft(aimX, DROP_Y + 16, kind === 'diamond' ? 'DIAMOND BANANA' : 'GOLDEN BANANA', kind === 'diamond' ? 'ice' : 'gold');
  }

  /* ---------- rigid-body physics: five little circles along the banana's curve ---------- */
  function movers(t) {
    const out = [];
    for (const w of WORKERS) { const wx = w.cx + Math.sin(t * w.om + w.ph) * w.amp, wvx = Math.cos(t * w.om + w.ph) * w.amp * w.om; out.push({ x: wx, y: w.y - 3, r: 5.2, vx: wvx, vy: 0, kind: 'worker' }, { x: wx, y: w.y - 12, r: 4, vx: wvx, vy: 0, kind: 'worker' }); }
    for (const sw of SWINGS) { const th = sw.amp * Math.sin(t * sw.om + sw.ph), dth = sw.amp * sw.om * Math.cos(t * sw.om + sw.ph); out.push({ x: sw.ax + sw.len * Math.sin(th), y: sw.ay + sw.len * Math.cos(th), r: 5.4, vx: sw.len * dth * Math.cos(th), vy: -sw.len * dth * Math.sin(th), kind: 'swinger' }); }
    for (const sp of SPINNERS) { const a = t * sp.om, ca = Math.cos(a), sa = Math.sin(a); for (let k = -3; k <= 3; k++) { const d = k * sp.arm / 3; out.push({ x: sp.x + d * ca, y: sp.y + d * sa, r: 3, vx: -sp.om * d * sa, vy: sp.om * d * ca, kind: 'spinner' }); } }
    return out;
  }
  function contact(b, cx, cy, sr, ovx, ovy, e, kick, label) {
    /* resolve every circle of the banana against one static or moving circle */
    const ca = Math.cos(b.a), sa = Math.sin(b.a); let hit = false;
    for (const [lx, ly] of ARC) {
      const rx = lx * ca - ly * sa, ry = lx * sa + ly * ca, px = b.x + rx, py = b.y + ry, dx = px - cx, dy = py - cy, rr = CIRC_R + sr, d2 = dx * dx + dy * dy;
      if (d2 >= rr * rr) continue; const d = Math.sqrt(d2) || .01, nx = dx / d, ny = dy / d;
      b.x += nx * (rr - d) * .85; b.y += ny * (rr - d) * .85;
      const vpx = b.vx - b.w * ry - ovx, vpy = b.vy + b.w * rx - ovy, vn = vpx * nx + vpy * ny; if (vn >= 0) continue;
      hit = true;
      if (kick) { const sp = Math.hypot(b.vx, b.vy); b.vx = nx * kick + ovx * .2; b.vy = ny < 0 ? ny * kick * .35 + 25 : ny * kick; b.w += rng(-9, 9); return 'kick'; }
      const rn = rx * ny - ry * nx, k = 1 + rn * rn / b.I, j = -(1 + e) * vn / k;
      b.vx += j * nx; b.vy += j * ny; b.w += rn * j / b.I;
      const tx = -ny, ty = nx, vt = vpx * tx + vpy * ty, rt = rx * ty - ry * tx, kt = 1 + rt * rt / b.I; let jt = -vt / kt; const mu = .3 * j; jt = clamp(jt, -mu, mu);   // friction gives the banana its spin
      b.vx += jt * tx; b.vy += jt * ty; b.w += rt * jt / b.I;
    }
    return hit ? 'hit' : null;
  }
  function stepBody(b, dt) {
    b.vy += G_ACC * dt; b.vx *= 1 - .08 * dt; b.w *= 1 - .25 * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.a += b.w * dt;
    const ca = Math.cos(b.a), sa = Math.sin(b.a);
    for (const [lx, ly] of ARC) {                                                       // side walls
      const px = b.x + lx * ca - ly * sa; if (px - CIRC_R < WALL) { b.x += WALL - (px - CIRC_R); b.vx = Math.abs(b.vx) * .5; b.w *= .8; } else if (px + CIRC_R > W - WALL) { b.x -= px + CIRC_R - (W - WALL); b.vx = -Math.abs(b.vx) * .5; b.w *= .8; }
    }
    for (const p of pegs) {
      if (Math.abs(p.y - b.y) > 14 || Math.abs(p.x - b.x) > 14) continue;
      const r = contact(b, p.x, p.y, p.r, 0, 0, .62, 0);
      if (r) { if (!p.post) { p.hot = .2; if (G.hitCd <= 0) { sfx.clack(p.row % 9); G.hitCd = .04; } } if (b.split) { b.split = false; ui.say('DIAMOND BURST!', 'ice'); MG.hitstop(.08); fx.confetti(b.x, b.y, 24, ['#9be8ff', '#fff', '#2a86b8']); sfx.diamond(); fx.ring(b.x, b.y, '#9be8ff', 30); for (let i = 0; i < 4; i++) G.live.push(Object.assign(newBody(b.x, b.y, (i - 1.5) * 34, -50 - rng(0, 25), 'diamond', false), { v: 5 })); } }
    }
    for (const bm of BUMPERS) { if (Math.abs(bm.y - b.y) > 16 || Math.abs(bm.x - b.x) > 16) continue; const r = contact(b, bm.x, bm.y, bm.r, 0, 0, .9, 215); if (r === 'kick') { bm.flash = .2; MG.hitstop(.035); fx.shock(bm.x, bm.y, '#ffd23a', 20); G.bumps++; b.bumpN = (b.bumpN || 0) + 1; const pts = Math.round((b.bumpN <= 3 ? 25 : 5) * mult()); G.score += pts; ft(bm.x, bm.y - 10, 'BUMP +' + pts, 'gold'); sfx.golden(); G.shake = Math.max(G.shake, 1.6); fx.burst(bm.x, bm.y, ['#ffd23a', '#fff08c', '#e86a50'], 10, 70, 30, .35); fx.ring(bm.x, bm.y, '#ffd23a', 14); ui.bump(); render(); } }
    for (const mv of G.mv) { if (Math.abs(mv.y - b.y) > 18 || Math.abs(mv.x - b.x) > 18) continue; const r = contact(b, mv.x, mv.y, mv.r, mv.vx, mv.vy, .75, 0); if (r) { if (b.shoved !== mv.kind || G.t - (b.shoveT || 0) > .4) { b.shoved = mv.kind; b.shoveT = G.t; G.shoves++; sfx.thud(); fx.burst(mv.x, mv.y, ['#c9b88a', '#fff6d6'], 4, 36, 60, .3); } } }
    const sp = Math.hypot(b.vx, b.vy); if (sp > 460) { b.vx *= 460 / sp; b.vy *= 460 / sp; } b.w = clamp(b.w, -28, 28);
  }
  function land(b) {
    const i = clamp(Math.floor((b.x - BIN_X) / BIN_W), 0, 6), val = VALUES[i];
    G.binFlash[i] = .4; G.hist[i]++; G.bestBin = Math.max(G.bestBin, val * b.v);
    if (val >= 10) { G.combo++; G.bestCombo = Math.max(G.bestCombo, G.combo); } else G.combo = 0;
    const pts = Math.round(val * b.v * mult()), x = BIN_X + i * BIN_W + BIN_W / 2;
    G.score += pts; ui.bump(); ft(x, BIN_TOP - 8, '+' + pts, b.kind === 'diamond' ? 'ice' : val >= 25 || b.v > 1 ? 'gold' : '');
    fx.burst(x, BIN_TOP + 2, b.kind === 'diamond' ? ['#9be8ff', '#fff'] : ['#ffd23a', '#fff08c', '#fff6d6'], val >= 25 ? 16 : 6, 60, 120, .5);
    if (b.kind === 'golden') G.goldens++; if (b.kind === 'diamond') G.diamonds++;
    if (val >= 100) { fx.confetti(x, BIN_TOP, 22); MG.hitstop(.05); G.edges++; G.balls++; G.shake = 3; sfx.golden(); fx.ring(x, BIN_TOP, '#ffd23a', 34); ft(x, BIN_TOP - 20, '+1 BANANA', 'gold'); }
    else if (val >= 25) sfx.letters(); else sfx.clack();
    if (G.combo > 0 && G.combo % 3 === 0) ui.pulseCombo();
    render();
  }

  /* ---------- update ---------- */
  function update(rdt) {
    fx.update(rdt);
    if (keyDir) aimX = clamp(aimX + keyDir * 70 * rdt, 10, W - 10);
    if (!G || !S.playing) return;
    const dt = rdt; G.t += dt; G.mv = movers(G.t); G.cool -= dt; G.hitCd -= dt; G.shake = Math.max(0, G.shake - rdt * 20);
    G.binFlash = G.binFlash.map(v => Math.max(0, v - rdt)); pegs.forEach(p => { if (p.hot > 0) p.hot -= rdt; }); BUMPERS.forEach(b => { if (b.flash > 0) b.flash -= rdt; });
    if (botOn && G.cool <= 0 && G.balls > 0 && G.live.length < 3) { aimX = params.get('aim') ? +params.get('aim') + rng(-3, 3) : rng(14, W - 14); drop(); }
    for (let i = G.live.length - 1; i >= 0; i--) {
      const b = G.live[i]; b.age += dt;
      for (let s = 0; s < 4; s++) stepBody(b, dt / 4);
      if (b.kind !== 'normal' && Math.floor(b.age * 14) % 2 === 0) fx.spark(b.x, b.y, b.kind === 'diamond' ? '#9be8ff' : '#fff08c');
      if (Math.hypot(b.vx, b.vy) > 80 && Math.random() < .7) fx.trail(b.x + rng(-2, 2), b.y + rng(-2, 2), b.kind === 'diamond' ? '#9be8ff' : b.kind === 'golden' ? '#ffd23a' : '#fff08c');
      if (Math.hypot(b.vx, b.vy) < 28) { b.still += dt; if (b.still > .25) { b.vx += rng(-60, 60) || 20; b.vy -= 20; b.w += rng(-6, 6); b.still = 0; } } else b.still = 0;
      if (b.age > 70) { b.vy = 120; b.vx = rng(-30, 30); }
      if (b.y > BIN_TOP + 10) { G.live.splice(i, 1); land(b); }
    }
    let lead = null; for (const b of G.live) if (!lead || b.y > lead.y) lead = b;
    cam += ((lead ? clamp(lead.y - H * .42, 0, WORLD_H - H) : 0) - cam) * Math.min(1, rdt * (lead ? 7 : 3));
    if (G.balls <= 0 && !G.live.length && !G.over) G.over = 1.1;
    if (G.over > 0) { G.over -= rdt; if (G.over <= 0) { G.over = -1; S.finish([['BANANAS DROPPED', G.dropped], ['BEST BIN', G.bestBin], ['EDGE BINS', G.edges], ['BUMPER HITS', G.bumps], ['MONKEY SHOVES', G.shoves], ['GOLD / DIAMOND', `${G.goldens} / ${G.diamonds}`]]); } }
  }

  /* ---------- draw ---------- */
  function digits(txt, cx, y, col) { const w = txt.length * 4 - 1; g.fillStyle = col; txt.split('').forEach((ch, k) => FONT[ch].split('').forEach((b, i) => { if (b === '1') g.fillRect(Math.round(cx - w / 2) + k * 4 + (i % 3), y + Math.floor(i / 3), 1, 1); })); }
  function draw() {
    g.clearRect(0, 0, W, H); g.save();
    if (G.shake > .3) g.translate(Math.round(rng(-G.shake, G.shake) * .5), Math.round(rng(-G.shake, G.shake) * .5));
    g.translate(0, -Math.round(cam));
    /* the board: a dark panel with wooden rails */
    g.fillStyle = 'rgba(10,30,20,.55)'; g.fillRect(WALL - 1, 30, W - 2 * WALL + 2, BIN_TOP - 30);
    g.fillStyle = '#1a0f14'; g.fillRect(0, 26, WALL, WORLD_H - 26); g.fillRect(W - WALL, 26, WALL, WORLD_H - 26); g.fillStyle = '#8a5a2b'; g.fillRect(1, 26, 2, WORLD_H - 26); g.fillRect(W - 3, 26, 2, WORLD_H - 26);
    g.fillStyle = '#5a3517'; g.fillRect(3, 24, W - 6, 3); g.fillStyle = '#b57d3e'; g.fillRect(3, 24, W - 6, 1);
    /* the workers' ledges and the swingers' branches */
    for (const w of WORKERS) { g.fillStyle = '#1a0f14'; g.fillRect(WALL, w.y + 3, W - 2 * WALL, 4); g.fillStyle = '#8a5a2b'; g.fillRect(WALL, w.y + 4, W - 2 * WALL, 2); g.fillStyle = '#b57d3e'; g.fillRect(WALL, w.y + 4, W - 2 * WALL, 1); }
    for (const sw of SWINGS) { g.fillStyle = '#1a0f14'; g.fillRect(sw.ax - 7, sw.ay - 5, 14, 5); g.fillStyle = '#7a4a1e'; g.fillRect(sw.ax - 6, sw.ay - 4, 12, 3); g.fillStyle = '#b57d3e'; g.fillRect(sw.ax - 6, sw.ay - 4, 12, 1); }
    /* aim marker */
    if (S.playing && G.balls > 0) { const x = Math.round(clamp(aimX, 10, W - 10)), bob = Math.floor(performance.now() / 260) % 2; g.drawImage(bananaSpr(G.nextKind, Math.PI * 1.5 + 0), x - 9, DROP_Y - 10 + bob); g.fillStyle = 'rgba(255,246,214,.35)'; for (let y = DROP_Y + 8; y < 44; y += 4) g.fillRect(x, y, 1, 2); }
    for (const p of pegs) { if (p.post) { g.fillStyle = '#1a0f14'; g.fillRect(Math.round(p.x) - 2, Math.round(p.y) - 2, 4, WORLD_H - Math.round(p.y)); g.fillStyle = '#8a5a2b'; g.fillRect(Math.round(p.x) - 1, Math.round(p.y) - 1, 2, WORLD_H - Math.round(p.y)); continue; } g.drawImage(p.hot > 0 ? pegHot : pegSpr, Math.round(p.x - 4.5), Math.round(p.y - 4.5)); }
    for (const bm of BUMPERS) { const br = Math.round(Math.sin(performance.now() / 260 + bm.x) * 1 + (bm.flash > 0 ? 3 : 0)); g.fillStyle = bm.flash > 0 ? 'rgba(255,240,150,.55)' : 'rgba(255,200,80,.22)'; g.fillRect(Math.round(bm.x) - 9 - br, Math.round(bm.y) - 1, 2, 3); g.fillRect(Math.round(bm.x) + 8 + br, Math.round(bm.y) - 1, 2, 3); g.fillRect(Math.round(bm.x) - 1, Math.round(bm.y) - 9 - br, 3, 2); g.fillRect(Math.round(bm.x) - 1, Math.round(bm.y) + 8 + br, 3, 2); g.drawImage(bumpSpr[bm.flash > 0 ? 1 : 0], Math.round(bm.x - 7.5), Math.round(bm.y - 7.5)); }
    /* working monkeys, the swingers and the spinners */
    const T = G.t;
    for (const w of WORKERS) {
      const wx = w.cx + Math.sin(T * w.om + w.ph) * w.amp, wdir = Math.cos(T * w.om + w.ph) >= 0 ? 1 : -1;
      g.save(); g.translate(Math.round(wx), 0); if (wdir < 0) g.scale(-1, 1); g.drawImage(A.monkeyS[Math.floor(T * 5) % 2], -6, w.y - 11); g.restore(); g.drawImage(crateSpr, Math.round(wx - 4), w.y - 16 - Math.round(Math.abs(Math.sin(T * 5)) * 1.5));
    }
    for (const sw of SWINGS) { const th = sw.amp * Math.sin(T * sw.om + sw.ph), tx = sw.ax + sw.len * Math.sin(th), ty = sw.ay + sw.len * Math.cos(th); const n = Math.ceil(sw.len); for (let i = 0; i <= n; i++) { const x = Math.round(lerp(sw.ax, tx, i / n)), y = Math.round(lerp(sw.ay, ty, i / n)); g.fillStyle = '#17481f'; g.fillRect(x - 1, y, 3, 1); g.fillStyle = '#2f8a35'; g.fillRect(x, y, 1, 1); } g.drawImage(A.monkeyS[1], Math.round(tx - 6), Math.round(ty - 4)); }
    for (const sp of SPINNERS) {
      const a = T * sp.om, ca = Math.cos(a), sa = Math.sin(a);
      for (let d = -sp.arm; d <= sp.arm; d += 1.5) { const x = Math.round(sp.x + d * ca), y = Math.round(sp.y + d * sa); g.fillStyle = '#1a0f14'; g.fillRect(x - 2, y - 2, 5, 5); }
      for (let d = -sp.arm; d <= sp.arm; d += 1.5) { const x = Math.round(sp.x + d * ca), y = Math.round(sp.y + d * sa); g.fillStyle = '#8a5a2b'; g.fillRect(x - 1, y - 1, 3, 3); g.fillStyle = '#c9a063'; g.fillRect(x - 1, y - 1, 1, 1); }
      g.drawImage(pegHot, Math.round(sp.x - 4.5), Math.round(sp.y - 4.5));
    }
    /* bins */
    VALUES.forEach((v, i) => {
      const x = BIN_X + i * BIN_W, f = G.binFlash[i] > 0, col = v >= 100 ? '#c98f0e' : v >= 25 ? '#8a5a2b' : '#5a3517';
      g.fillStyle = '#1a0f14'; g.fillRect(x, BIN_TOP + 10, BIN_W, WORLD_H - BIN_TOP - 10); g.fillStyle = f ? '#ffd23a' : col; g.fillRect(x + 1, BIN_TOP + 11, BIN_W - 2, WORLD_H - BIN_TOP - 14);
      g.fillStyle = f ? '#fff6d6' : v >= 100 ? '#ffd23a' : '#b57d3e'; g.fillRect(x + 1, BIN_TOP + 11, BIN_W - 2, 1);
      digits(String(v), x + BIN_W / 2, BIN_TOP + 17, f ? '#1a0f14' : '#fff6d6');
      if (v >= 100) { g.fillStyle = '#74c648'; g.fillRect(x + 4, BIN_TOP + 25, 8, 2); g.fillRect(x + 7, BIN_TOP + 23, 2, 6); }
    });
    for (const b of G.live) { const sp = bananaSpr(b.kind, b.a); g.drawImage(sp, Math.round(b.x - 9), Math.round(b.y - 9)); }
    fx.draw(g); g.restore();
    /* depth gauge on the right rail: where the view sits on the board, and where each banana is */
    const gy0 = 30, gh = H - 36, k = gh / WORLD_H;
    g.fillStyle = 'rgba(255,246,214,.22)'; g.fillRect(W - 2, gy0, 1, gh);
    g.fillStyle = 'rgba(255,246,214,.65)'; g.fillRect(W - 3, gy0 + Math.round(cam * k), 3, Math.max(2, Math.round(H * k)));
    for (const b of G.live) { g.fillStyle = '#ffd23a'; g.fillRect(W - 3, gy0 + Math.round(clamp(b.y, 0, WORLD_H) * k) - 1, 3, 2); }
  }

  /* ---------- shell + input ---------- */
  const S = MG.shell({
    host, ui, id: 'plinko', title: 'BANANA<span>PLINKO</span>', sub: 'It hooks, it flips, it tumbles.',
    legend: [[bananaSpr('normal', Math.PI * 1.5), '<em>10</em> bananas to start'], [bumpSpr[0], '<em>bumpers</em> fire it away'], [A.monkeyS[0], '<em>monkeys</em> shove it around'], [A.heart, '<em>+1 banana</em> edge bin'], [bananaSpr('golden', Math.PI * 1.5), '<em>x3</em> golden banana'], [bananaSpr('diamond', Math.PI * 1.5), '<em class="ice">x5</em> bursts in five']],
    hint: 'move to aim · click / tap / Space to drop', spaceStarts: false, onStart: () => newGame(), score: () => G.score,
  });
  addEventListener('pointermove', ev => { aimX = st.toArt(ev)[0]; });
  addEventListener('pointerdown', ev => { if (ev.target.closest('.mg-over,.mg-nav')) return; aimX = st.toArt(ev)[0]; drop(); });
  addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft' || e.key === 'a') keyDir = -1; else if (e.key === 'ArrowRight' || e.key === 'd') keyDir = 1;
    else if (e.key === ' ' && !e.repeat) { if (S.playing) drop(); else if (S.phase === 'title' || S.phase === 'over') { sfx.unlock(); S.start(); } e.preventDefault(); }
  });
  addEventListener('keyup', e => { if ((e.key === 'ArrowLeft' || e.key === 'a') && keyDir < 0 || (e.key === 'ArrowRight' || e.key === 'd') && keyDir > 0) keyDir = 0; });

  newGame(); S.title();
  if (params.get('autostart')) { S.start(); botOn = !!params.get('bot'); for (let i = 0, n = (+params.get('warp') || 0) * 60; i < n; i++) update(1 / 60); }
  if (params.get('dbg')) setInterval(() => { document.title = `hist=${G.hist.join(",")} cam=${Math.round(cam)} score=${G.score} dropped=${G.dropped} live=${G.live.length} bumps=${G.bumps} shoves=${G.shoves} over=${G.over}`; }, 200);
  MG.loop(update, draw);
  window.PL = { get G() { return G; }, S };
})();
