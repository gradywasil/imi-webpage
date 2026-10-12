/* ============================================================
   BANANA PLINKO: aim and drop banana balls down a pegboard into scoring bins. You get a stock of balls; landing in an edge bin
   earns an extra ball. Golden balls pay x3; the rare Diamond ball bursts into five on its first bounce.
   Controls: move the mouse / finger to aim, click / tap / Space to drop. Arrow keys nudge the aim.
   Standalone: no connection to the main game's save yet.
   ============================================================ */
(() => {
  'use strict';
  const { rng, clamp, lerp, sfx, h, spriteImg } = MG;
  const W = 120, H = 208, BALL_R = 3.5, PEG_R = 2.5, DROP_Y = 18, BIN_TOP = 172, BIN_W = 16, BIN_X = 4;
  const VALUES = [100, 25, 10, 5, 10, 25, 100], START_BALLS = 10;
  const params = new URLSearchParams(location.search), RARE = +params.get('rare') || 0;

  MG.boot();
  const A = MGArt.build(), { R, make, shapes: { ell } } = MGArt, FONT = MGArt.FONT;
  const host = document.getElementById('stage'), st = MG.stage(host, W, H, { padY: 40 }), g = st.g;
  host.style.cursor = 'crosshair';
  const ui = MG.ui(host, st, A.banana, 0), fx = MG.fx();
  document.querySelector('.mg-hearts').style.display = 'none';

  const ballSpr = { normal: make(9, 9, px => { px.shape(ell(4.5, 4.5, 3.7, 3.7), R.banY, 1); px.tone(3, 3, 2); }),
    golden: make(9, 9, px => { px.shape(ell(4.5, 4.5, 3.7, 3.7), R.gold, 1); px.tone(3, 3, 2); }),
    diamond: make(9, 9, px => { px.shape(ell(4.5, 4.5, 3.7, 3.7), R.ice, 1); px.tone(3, 3, 2); }) };
  const pegSpr = make(7, 7, px => { px.shape(ell(3.5, 3.5, 2.7, 2.7), R.metal, 1); px.tone(2, 2, 2); });
  const hotSpr = make(7, 7, px => { px.shape(ell(3.5, 3.5, 2.7, 2.7), R.banY, 1); px.tone(2, 2, 2); });
  /* a little ball counter in the HUD, next to the score */
  const ballBox = h('div', 'sc'); ballBox.append(spriteImg(ballSpr.normal, 2), h('b', '', '10')); document.querySelector('.mg-hud').appendChild(ballBox);
  const ballNum = ballBox.querySelector('b');

  /* ---------- board ---------- */
  const pegs = [];
  for (let r = 0; r < 9; r++) { const odd = r % 2, n = odd ? 7 : 8; for (let c = 0; c < n; c++) pegs.push({ x: (odd ? 18 : 11) + c * 14, y: 48 + r * 13, r: PEG_R, hot: 0, row: r }); }
  for (let i = 1; i < 7; i++) pegs.push({ x: BIN_X + i * BIN_W, y: BIN_TOP + 2, r: 1.8, hot: 0, row: 9, post: true });

  /* ---------- state ---------- */
  let G = null, botOn = false, aimX = W / 2, keyDir = 0;
  function newGame() {
    G = { t: 0, score: 0, balls: START_BALLS, dropped: 0, combo: 0, bestCombo: 0, live: [], binFlash: Array(7).fill(0), edges: 0, goldens: 0, diamonds: 0, bestBin: 0, shake: 0, cool: 0, nextKind: 'normal', slow: 1, slowT: 0, over: 0, hitCd: 0, lastLanded: 0 };
    pegs.forEach(p => p.hot = 0); rollNext(); fx.clear(); render();
  }
  const mult = () => ui.mult(G.combo);
  function render() { ui.setScore(G.score); ui.setCombo(G.combo, mult()); ballNum.textContent = G.balls; }
  function rollNext() { G.nextKind = G.dropped > 2 && Math.random() < .03 + RARE * .4 ? 'diamond' : G.dropped > 1 && Math.random() < .12 + RARE * .4 ? 'golden' : 'normal'; }

  function drop() {
    if (!S.playing || G.balls <= 0 || G.cool > 0) return;
    G.balls--; G.dropped++; G.cool = .28; const kind = G.nextKind;
    G.live.push({ x: clamp(aimX, 7, W - 7), y: DROP_Y, vx: rng(-5, 5), vy: 0, kind, age: 0, split: kind === 'diamond', still: 0, v: kind === 'diamond' ? 5 : kind === 'golden' ? 3 : 1 });
    rollNext(); sfx.tick(); render();
    if (kind !== 'normal') ui.floatText(aimX, DROP_Y + 14, kind === 'diamond' ? 'DIAMOND BALL' : 'GOLDEN BALL', kind === 'diamond' ? 'ice' : 'gold');
  }

  /* ---------- physics ---------- */
  function step(b, dt) {
    b.vy += 230 * dt; b.x += b.vx * dt; b.y += b.vy * dt;
    if (b.x < 3 + BALL_R) { b.x = 3 + BALL_R; b.vx = Math.abs(b.vx) * .6; } else if (b.x > W - 3 - BALL_R) { b.x = W - 3 - BALL_R; b.vx = -Math.abs(b.vx) * .6; }
    for (const p of pegs) {
      const dx = b.x - p.x, dy = b.y - p.y, rr = BALL_R + p.r, d2 = dx * dx + dy * dy; if (d2 >= rr * rr) continue;
      const d = Math.sqrt(d2) || .01, nx = dx / d, ny = dy / d, vn = b.vx * nx + b.vy * ny;
      b.x = p.x + nx * (rr + .01); b.y = p.y + ny * (rr + .01);
      if (vn < 0) { const e = 1.52, jitter = rng(-.05, .05); b.vx -= e * vn * nx; b.vy -= e * vn * ny; b.vx += jitter * 60 + (nx === 0 ? rng(-6, 6) : 0); }
      if (!p.post && G.hitCd <= 0) { sfx.ding(p.row % 8); G.hitCd = .035; }
      if (!p.post) { p.hot = .18; fx.burst(p.x, p.y, [b.kind === 'diamond' ? '#9be8ff' : '#fff08c'], 2, 24, 30, .2); }
      if (b.split) {
        b.split = false; ui.say('DIAMOND BURST!', 'ice'); sfx.diamond(); fx.ring(b.x, b.y, '#9be8ff', 30);
        for (let i = 0; i < 4; i++) G.live.push({ x: b.x, y: b.y, vx: (i - 1.5) * 26, vy: -45 - rng(0, 20), kind: 'diamond', age: 0, split: false, still: 0, v: 5 });
      }
    }
    const sp = Math.hypot(b.vx, b.vy); if (sp > 260) { b.vx *= 260 / sp; b.vy *= 260 / sp; }
  }
  function land(b) {
    const i = clamp(Math.floor((b.x - BIN_X) / BIN_W), 0, 6), val = VALUES[i];
    G.binFlash[i] = .4; G.bestBin = Math.max(G.bestBin, val * b.v);
    if (val >= 10) { G.combo++; G.bestCombo = Math.max(G.bestCombo, G.combo); } else G.combo = 0;
    const pts = Math.round(val * b.v * mult()), x = BIN_X + i * BIN_W + BIN_W / 2;
    G.score += pts; ui.bump(); ui.floatText(x, BIN_TOP - 8, '+' + pts, b.kind === 'diamond' ? 'ice' : val >= 25 || b.v > 1 ? 'gold' : '');
    fx.burst(x, BIN_TOP + 2, b.kind === 'diamond' ? ['#9be8ff', '#fff'] : ['#ffd23a', '#fff08c', '#fff6d6'], val >= 25 ? 16 : 6, 60, 120, .5);
    if (b.kind === 'golden') G.goldens++; if (b.kind === 'diamond') G.diamonds++;
    if (val >= 100) { G.edges++; G.balls++; G.shake = 3; sfx.golden(); fx.ring(x, BIN_TOP, '#ffd23a', 34); ui.floatText(x, BIN_TOP - 20, '+1 BALL', 'gold'); }
    else if (val >= 25) sfx.letters(); else sfx.clack();
    if (G.combo > 0 && G.combo % 3 === 0) ui.pulseCombo();
    render();
  }

  /* ---------- update ---------- */
  function update(rdt) {
    fx.update(rdt);
    if (keyDir) aimX = clamp(aimX + keyDir * 70 * rdt, 7, W - 7);
    if (!G || !S.playing) return;
    if (G.slowT > 0) { G.slowT -= rdt; if (G.slowT <= 0) G.slow = 1; }
    const dt = rdt * G.slow; G.t += dt; G.cool -= dt; G.hitCd -= dt; G.shake = Math.max(0, G.shake - rdt * 20);
    G.binFlash = G.binFlash.map(v => Math.max(0, v - rdt)); pegs.forEach(p => { if (p.hot > 0) p.hot -= rdt; });
    if (botOn && G.cool <= 0 && G.balls > 0 && G.live.length < 3) { aimX = rng(12, W - 12); drop(); }
    for (let i = G.live.length - 1; i >= 0; i--) {
      const b = G.live[i]; b.age += dt;
      for (let s = 0; s < 4; s++) step(b, dt / 4);
      if (b.kind !== 'normal' && Math.floor(b.age * 14) % 2 === 0) fx.spark(b.x, b.y, b.kind === 'diamond' ? '#9be8ff' : '#fff08c');
      if (Math.hypot(b.vx, b.vy) < 8) { b.still += dt; if (b.still > .5) { b.vx += rng(-30, 30); b.vy -= 25; b.still = 0; } } else b.still = 0;
      if (b.y > BIN_TOP + 7) { G.live.splice(i, 1); land(b); }
    }
    if (G.balls <= 0 && !G.live.length && !G.over) G.over = 1.1;
    if (G.over > 0) { G.over -= rdt; if (G.over <= 0) { G.over = -1; S.finish([['BALLS DROPPED', G.dropped], ['BEST BIN', G.bestBin], ['EDGE BINS', G.edges], ['BEST CHAIN', G.bestCombo], ['GOLD / DIAMOND', `${G.goldens} / ${G.diamonds}`]]); } }
  }

  /* ---------- draw ---------- */
  function digits(txt, cx, y, col) { const w = txt.length * 4 - 1; g.fillStyle = col; txt.split('').forEach((ch, k) => FONT[ch].split('').forEach((b, i) => { if (b === '1') g.fillRect(Math.round(cx - w / 2) + k * 4 + (i % 3), y + Math.floor(i / 3), 1, 1); })); }
  function draw() {
    g.clearRect(0, 0, W, H); g.save();
    if (G.shake > .3) g.translate(Math.round(rng(-G.shake, G.shake) * .5), Math.round(rng(-G.shake, G.shake) * .5));
    /* board: dark panel, wooden side rails, brass screws */
    g.fillStyle = 'rgba(10,30,20,.55)'; g.fillRect(3, 30, W - 6, BIN_TOP - 30);
    g.fillStyle = '#1a0f14'; g.fillRect(0, 26, 3, H - 26); g.fillRect(W - 3, 26, 3, H - 26); g.fillStyle = '#8a5a2b'; g.fillRect(1, 26, 1, H - 26); g.fillRect(W - 3, 26, 1, H - 26);
    /* drop rail + aim */
    g.fillStyle = '#5a3517'; g.fillRect(3, 24, W - 6, 3); g.fillStyle = '#b57d3e'; g.fillRect(3, 24, W - 6, 1);
    if (S.playing && G.balls > 0) {
      const kind = G.nextKind, x = Math.round(clamp(aimX, 7, W - 7)), bob = Math.floor(performance.now() / 260) % 2;
      g.drawImage(ballSpr[kind], x - 4, DROP_Y - 4 + bob); g.fillStyle = 'rgba(255,246,214,.35)'; for (let y = DROP_Y + 6; y < 46; y += 4) g.fillRect(x, y, 1, 2);
    }
    for (const p of pegs) g.drawImage(p.hot > 0 ? hotSpr : pegSpr, Math.round(p.x - 3.5), Math.round(p.y - 3.5));
    /* bins */
    VALUES.forEach((v, i) => {
      const x = BIN_X + i * BIN_W, f = G.binFlash[i] > 0, col = v >= 100 ? '#c98f0e' : v >= 25 ? '#8a5a2b' : '#5a3517';
      g.fillStyle = '#1a0f14'; g.fillRect(x, BIN_TOP + 3, BIN_W, H - BIN_TOP - 3); g.fillStyle = f ? '#ffd23a' : col; g.fillRect(x + 1, BIN_TOP + 4, BIN_W - 2, H - BIN_TOP - 7);
      g.fillStyle = f ? '#fff6d6' : v >= 100 ? '#ffd23a' : '#b57d3e'; g.fillRect(x + 1, BIN_TOP + 4, BIN_W - 2, 1);
      digits(String(v), x + BIN_W / 2, BIN_TOP + 14, f ? '#1a0f14' : '#fff6d6');
      if (v >= 100) { g.fillStyle = '#74c648'; g.fillRect(x + 4, BIN_TOP + 24, 8, 2); g.fillRect(x + 7, BIN_TOP + 22, 2, 6); }
    });
    for (const b of G.live) g.drawImage(ballSpr[b.kind], Math.round(b.x - 4.5), Math.round(b.y - 4.5));
    fx.draw(g); g.restore();
  }

  /* ---------- shell + input ---------- */
  const S = MG.shell({
    host, ui, id: 'plinko', title: 'BANANA<span>PLINKO</span>', sub: 'Aim, drop, bounce. Chase the edges.',
    legend: [[ballSpr.normal, '<em>10</em> balls to start'], [A.heart, '<em>+1 ball</em> edge bin'], [ballSpr.golden, '<em>x3</em> golden ball'], [ballSpr.diamond, '<em class="ice">x5</em> bursts in five']],
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
  MG.loop(update, draw);
  window.PL = { get G() { return G; }, S };
})();
