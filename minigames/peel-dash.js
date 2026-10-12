/* ============================================================
   PEEL DASH: the monkey sprints down a three-lane jungle path. Switch lanes (swipe, arrow keys or A/D), jump low things (swipe up, W, Space).
   Collect bananas and letter bundles; rocks must be dodged, logs and peels can be jumped. Three hearts, and it keeps getting faster.
   Rare: the Golden Banana is a 5 second invincible dash; the Diamond Banana turns the road into a banana river (x3).
   Standalone: no connection to the main game's save yet.
   ============================================================ */
(() => {
  'use strict';
  const { rng, clamp, lerp, sfx } = MG;
  const W = 120, H = 208, LANE = 32, LX = [W / 2 - LANE, W / 2, W / 2 + LANE], PY = 184;
  const params = new URLSearchParams(location.search), RARE = +params.get('rare') || 0;

  MG.boot();
  PXA.monkeySets.pd = { k: .7, max: 14, step: 7 }; { const s = PXA.monkeySets.pd; s.angles = []; for (let a = -s.max; a <= s.max; a += s.step) s.angles.push(a); s.cache = {}; }
  const A = MGArt.build(), { R, make, shapes: { ell, box, poly, or, and } } = MGArt;
  const host = document.getElementById('stage'), st = MG.stage(host, W, H, { padY: 40 }), g = st.g;
  host.style.cursor = 'default';
  const ui = MG.ui(host, st, A.banana), fx = MG.fx();

  /* obstacle sprites */
  const SPR = {
    log: make(28, 11, px => { px.shape(box(0, 1, 28, 9), R.wood, 1); px.shape(or(box(0, 4, 28, 1), box(0, 7, 28, 1)), R.woodD, 2); px.shape(ell(2, 5.5, 2, 4.5), R.woodL, 3); px.shape(ell(26, 5.5, 2, 4.5), R.woodL, 3); }),
    rock: make(24, 19, px => { px.shape(poly([[1, 18], [3, 8], [8, 2], [16, 1], [21, 6], [23, 18]]), R.metal, 1); px.shape(poly([[3, 17], [5, 9], [9, 6], [12, 17]]), R.metal, 2); px.tone(8, 3, 2); px.tone(9, 3, 2); px.tone(7, 4, 2); }),
    peel: make(18, 10, px => { px.shape(or(ell(9, 6, 3, 2.5), poly([[9, 6], [1, 3], [2, 8]]), poly([[9, 6], [17, 3], [16, 8]]), poly([[9, 6], [5, 1], [8, 2]])), R.banY, 1); px.shape(or(ell(2, 4, 1.4, 1.2), ell(16, 4, 1.4, 1.2)), R.stem, 2); }),
  };
  const bundles = Array.from({ length: 4 }, () => { const L = MGArt.LETTERS, r = () => L[Math.floor(Math.random() * 26)]; return MGArt.bundle(r(), r(), r()); });

  /* ---------- state ---------- */
  let G = null, botOn = false;
  const p = { lane: 1, x: LX[1], vx: 0, z: 0, vz: 0, ph: 0, phT: 0, inv: 0, spin: 0, expr: 'normal', et: 0, blink: 0 };

  function newGame() {
    G = { t: 0, score: 0, hearts: 3, combo: 0, bestCombo: 0, items: [], rows: 0, rowDist: 40, dist: 0, scroll: 0, shake: 0, dash: 0, road: 0, bananas: 0, letters: 0, hits: 0, jumps: 0, goldens: 0, diamonds: 0, sinceDia: 0, dead: 0, slow: 1, slowT: 0, lines: [] };
    p.lane = 1; p.x = LX[1]; p.vx = 0; p.z = 0; p.vz = 0; p.inv = 0; p.spin = 0; p.expr = 'normal'; fx.clear(); render();
  }
  const mult = () => ui.mult(G.combo);
  function render(anim) { ui.setScore(G.score); ui.setHearts(G.hearts, anim); ui.setCombo(G.combo, mult()); }
  const speed = () => Math.min(190, 78 + G.t * 1.7) * (G.dash > 0 ? 1.55 : 1);

  /* ---------- level generation ---------- */
  const add = (type, lane, y) => G.items.push({ type, lane, y, x: LX[lane], got: false, ph: Math.random() * 6 });
  function bananaType() {
    const d = G.t;
    if (G.road > 0) return 'banana';
    if (d > 10 && Math.random() < .018 + RARE * .3) return 'golden';
    if (d > 20 && Math.random() < .005 + Math.min(.01, G.sinceDia / 8000) + RARE * .3) return 'diamond';
    return 'banana';
  }
  function row() {
    const d = clamp(G.t / 90, 0, 1), y = -24, free = Math.floor(Math.random() * 3), r = Math.random(); G.rows++;
    if (G.road > 0) { const l = Math.floor(Math.random() * 3); add('banana', l, y); add('banana', (l + 1) % 3, y - 14); if (Math.random() < .5) add('banana', (l + 2) % 3, y - 28); return; }
    if (G.rows < 4) { add('banana', free, y); add('banana', free, y - 14); return; }
    if (r < .26) { /* one obstacle, bananas in the lane you'd dodge into */
      const l = Math.floor(Math.random() * 3), t = ['rock', 'log', 'peel'][Math.floor(Math.random() * 3)]; add(t, l, y);
      const o = (l + 1 + Math.floor(Math.random() * 2)) % 3; add(bananaType(), o, y - 8); if (Math.random() < .6) add('banana', o, y - 22);
    } else if (r < .5) { /* two obstacles, one clear lane with a banana line */
      for (let l = 0; l < 3; l++) { if (l === free) { add(bananaType(), l, y); add('banana', l, y - 14); } else add(Math.random() < .55 ? 'rock' : 'log', l, y); }
    } else if (r < .62 + d * .06) { /* a wall of logs: jump it, bananas land after */
      for (let l = 0; l < 3; l++) add('log', l, y); for (let l = 0; l < 3; l++) if (Math.random() < .7) add('banana', l, y - 26);
    } else if (r < .74) { /* peels zig-zag */
      add('peel', free, y); add('peel', (free + 1) % 3, y - 22); add('banana', (free + 2) % 3, y - 11); add('banana', (free + 2) % 3, y - 25);
    } else if (r < .86) { /* letters */
      const l = Math.floor(Math.random() * 3); add('bundle', l, y); add(Math.random() < .5 ? 'rock' : 'log', (l + 1) % 3, y);
    } else { const l = Math.floor(Math.random() * 3); for (let i = 0; i < 4; i++) add(bananaType(), clamp(l + (i > 1 ? 1 : 0) * (Math.random() < .5 ? 1 : -1), 0, 2), y - i * 13); }
  }

  /* ---------- player actions ---------- */
  function move(dir) { if (!S.playing || G.dead) return; const nl = clamp(p.lane + dir, 0, 2); if (nl !== p.lane) { p.lane = nl; sfx.tick(); fx.burst(p.x, PY - 4, ['#fff6d6', '#ffd23a'], 4, 30, 20, .25); fx.puff(p.x, PY, '#e8b878', 3); } }
  function jump() { if (!S.playing || G.dead || p.z > 0) return; p.vz = 150; G.jumps++; fx.shock(p.x, PY, '#e8b878', 14); sfx.clack(4); fx.burst(p.x, PY, ['#c9b88a', '#8c8670'], 4, 22, 40, .3); }

  function hit(it) {
    if (p.inv > 0) return;
    MG.hitstop(.08); fx.shock(p.x, PY - 8, '#ff7a6a', 26); G.hearts--; G.hits++; G.combo = 0; G.shake = 6; p.inv = 1.4; p.spin = .5; p.expr = 'scared'; p.et = 1; sfx.bonk(); ui.doFlash('#c0392b');
    fx.burst(p.x, PY - 8, ['#ffd23a', '#c9b88a', '#fff6d6'], 12, 70, 150, .5); ui.floatText(p.x, PY - 30, it.type === 'peel' ? 'SLIP!' : 'OOF!', 'bad'); G.t = Math.max(0, G.t - 6);
    render(true); if (G.hearts <= 0) { G.dead = 1.1; sfx.over(); G.slow = .5; G.slowT = 1; }
  }
  function pick(it) {
    it.got = true; const m = mult(), x = it.x, y = it.y;
    G.combo++; G.bestCombo = Math.max(G.bestCombo, G.combo);
    if (it.type === 'banana') { G.bananas++; const pts = Math.round(10 * m * (G.road > 0 ? 3 : 1)); G.score += pts; sfx.ding(Math.min(10, G.combo)); fx.burst(x, y, ['#ffd23a', '#fff08c'], 6, 40, 80, .35); ui.floatText(x, y - 10, '+' + pts, m > 1 ? 'gold' : ''); }
    else if (it.type === 'bundle') { G.letters += 3; const pts = Math.round(25 * m); G.score += pts; sfx.letters(); fx.burst(x, y, ['#fff6d6', '#ede0b8', '#1a0f14'], 10, 50, 100, .5); ui.floatText(x, y - 10, '+3 LTRS ' + pts, 'gold'); }
    else if (it.type === 'golden') { MG.hitstop(.05); fx.confetti(x, y, 16, ['#ffd23a', '#fff08c', '#fffbe0']); G.goldens++; G.dash = 5; p.inv = 5; G.score += Math.round(100 * m); sfx.golden(); fx.ring(x, y, '#ffd23a', 40); fx.burst(x, y, ['#ffd23a', '#fff08c', '#fffbe0'], 22, 90, 70, .8); ui.say('GOLDEN DASH<small>invincible · smash everything · 5s</small>'); p.expr = 'screech'; p.et = 1.5; }
    else { MG.hitstop(.1); fx.confetti(x, y, 32); fx.shock(x, y, '#9be8ff', 46); G.diamonds++; G.road = 5; G.score += Math.round(200 * m); G.slow = .4; G.slowT = .8; sfx.diamond(); ui.doFlash('#e8fbff'); G.sinceDia = 0; fx.ring(x, y, '#9be8ff', 56); fx.burst(x, y, ['#9be8ff', '#fff', '#2a86b8'], 30, 110, 50, 1); ui.say('BANANA RIVER<small>x3 bananas · 5 seconds</small>', 'ice'); G.items = G.items.filter(o => o.got || o.type === 'banana'); p.expr = 'screech'; p.et = 1.5; }
    ui.bump(); if (G.combo % 8 === 0) { ui.pulseCombo(); ui.floatText(W / 2, 90, `COMBO x${mult()}!`, 'gold'); } render();
  }

  /* ---------- update ---------- */
  function update(rdt) {
    fx.update(rdt);
    p.blink -= rdt; if (p.blink < -3.2) p.blink = .14; if (p.et > 0) { p.et -= rdt; if (p.et <= 0) p.expr = 'normal'; }
    if (!G || !S.playing) return;
    if (G.slowT > 0) { G.slowT -= rdt; if (G.slowT <= 0) G.slow = 1; }
    const dt = rdt * G.slow; G.t += dt; G.sinceDia += dt; G.shake = Math.max(0, G.shake - rdt * 22);
    if (G.dash > 0) { G.dash -= dt; if (G.dash <= 0) { p.inv = Math.max(p.inv, .8); } }
    if (G.road > 0) G.road -= dt; if (p.inv > 0) p.inv -= dt; if (p.spin > 0) p.spin -= dt;
    ui.setMeter(G.road > 0 ? G.road / 5 : G.dash / 5, G.road > 0);
    if (G.dead > 0) { G.dead -= rdt; if (G.dead <= 0) S.finish([['DISTANCE', Math.round(G.dist) + 'm'], ['BANANAS', G.bananas], ['LETTERS', G.letters], ['BEST COMBO', G.bestCombo], ['OOFS', G.hits], ['GOLD / DIAMOND', `${G.goldens} / ${G.diamonds}`]]); return; }
    const v = speed(); G.scroll += v * dt; G.dist += v * dt / 9; G.score += Math.floor(G.dist) - Math.floor(G.dist - v * dt / 9);
    ui.setScore(G.score);
    G.rowDist -= v * dt; if (G.rowDist <= 0) { row(); G.rowDist = lerp(88, 60, clamp(G.t / 90, 0, 1)) * (G.road > 0 ? .5 : 1) + rng(0, 14); }
    /* player */
    p.vx += (LX[p.lane] - p.x) * 18 * dt; p.vx *= Math.pow(.0005, dt); p.x += (LX[p.lane] - p.x) * Math.min(1, dt * 16);
    if (p.z > 0 || p.vz > 0) { p.vz -= 430 * dt; p.z += p.vz * dt; if (p.z <= 0) { p.z = 0; p.vz = 0; fx.burst(p.x, PY, ['#c9b88a'], 3, 18, 30, .25); } }
    p.phT -= dt * v / 90; if (p.phT <= 0) { p.ph ^= 1; p.phT = .2; if (p.z <= 0) fx.puff(p.x + (p.ph ? -3 : 3), PY, '#e8b878', 1); }
    if (v > 110 && Math.random() < (v - 100) / 260) G.lines.push({ x: rng(16, W - 16), y: -6, l: rng(8, 20), t: 0 });
    for (let i = G.lines.length - 1; i >= 0; i--) { const q = G.lines[i]; q.y += v * 2.2 * dt; if (q.y > H + 20) G.lines.splice(i, 1); }
    if (botOn) bot(v);
    for (let i = G.items.length - 1; i >= 0; i--) {
      const it = G.items[i]; it.y += v * dt;
      if (G.dash > 0 && it.type !== 'banana' && it.type !== 'bundle' && it.type !== 'golden' && it.type !== 'diamond' && !it.got && Math.abs(it.y - (PY - 10)) < 26 && Math.abs(it.x - p.x) < 16) { it.got = true; fx.burst(it.x, it.y, ['#8c8670', '#c9b88a', '#8a5a2b'], 10, 70, 140, .5); sfx.thud(); G.score += 5; }
      if (G.dash > 0 && !it.got && it.type !== 'rock' && it.type !== 'log' && it.type !== 'peel' && Math.abs(it.y - (PY - 10)) < 70 && Math.abs(it.x - p.x) < 36) { it.x += (p.x - it.x) * Math.min(1, 8 * dt); }
      if (!it.got && Math.abs(it.y - (PY - 10)) < 12 && Math.abs(it.x - p.x) < 13) {
        if (it.type === 'banana' || it.type === 'bundle' || it.type === 'golden' || it.type === 'diamond') pick(it);
        else if (it.type === 'rock') hit(it);
        else if (p.z < 6) hit(it);
      }
      if (it.y > H + 24 || it.got) G.items.splice(i, 1);
    }
  }
  /* dev autoplayer: dodge rocks, jump logs/peels, drift to bananas */
  function bot(v) {
    const ahead = G.items.filter(o => !o.got && o.y < PY - 8 && o.y > PY - 70).sort((a, b) => b.y - a.y);
    const danger = l => ahead.some(o => o.lane === l && (o.type === 'rock'));
    const low = ahead.some(o => o.lane === p.lane && (o.type === 'log' || o.type === 'peel') && o.y > PY - 46);
    if (danger(p.lane)) { const opt = [p.lane - 1, p.lane + 1].filter(l => l >= 0 && l <= 2 && !danger(l)); if (opt.length) p.lane = opt[0]; }
    else if (low && p.z === 0) jump();
  }

  /* ---------- draw ---------- */
  function draw() {
    g.clearRect(0, 0, W, H); g.save();
    if (G.shake > .3) g.translate(Math.round(rng(-G.shake, G.shake) * .5), Math.round(rng(-G.shake, G.shake) * .5));
    const sc = Math.round(G.scroll);
    /* the path */
    g.fillStyle = 'rgba(10,30,18,.5)'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#c08a4a'; g.fillRect(12, 0, W - 24, H); g.fillStyle = '#b57d3e';
    for (let y = -(sc % 24); y < H; y += 24) { g.fillRect(12, y, W - 24, 12); }
    g.fillStyle = '#8a5a2b'; g.fillRect(12, 0, 2, H); g.fillRect(W - 14, 0, 2, H); g.fillStyle = '#5a3517'; g.fillRect(10, 0, 2, H); g.fillRect(W - 12, 0, 2, H);
    g.fillStyle = '#e8b878'; for (let i = 0; i < 22; i++) g.fillRect(14 + (i * 37) % (W - 30), (((i * 53 + sc * 1) % (H + 20)) + H + 20) % (H + 20) - 10, 2, 1);
    g.fillStyle = 'rgba(90,53,23,.5)'; for (const x of [W / 2 - LANE / 2, W / 2 + LANE / 2]) for (let y = -(sc % 20); y < H; y += 20) g.fillRect(x, y, 1, 8);
    /* side jungle */
    for (let i = 0; i < 8; i++) { const y = (((i * 31 - sc * 1.15) % (H + 40)) + H + 40) % (H + 40) - 20; g.fillStyle = '#17481f'; g.fillRect(0, y, 10, 14); g.fillRect(W - 10, y + 7, 10, 14); g.fillStyle = '#2f8a35'; g.fillRect(0, y, 8, 3); g.fillRect(W - 8, y + 7, 8, 3); g.fillStyle = '#74c648'; g.fillRect(2, y + 1, 3, 1); g.fillRect(W - 6, y + 8, 3, 1); }
    g.fillStyle = 'rgba(255,246,214,.35)'; for (const q of G.lines) g.fillRect(Math.round(q.x), Math.round(q.y - q.l), 1, Math.round(q.l));
    /* dash/road tint */
    if (G.dash > 0) { g.fillStyle = 'rgba(255,210,58,.12)'; g.fillRect(0, 0, W, H); for (let i = 0; i < 8; i++) { g.fillStyle = 'rgba(255,246,214,.5)'; g.fillRect(16 + (i * 29) % (W - 32), (((sc * 3 + i * 41) % H)), 1, 10); } }
    if (G.road > 0) { g.fillStyle = 'rgba(155,232,255,.12)'; g.fillRect(0, 0, W, H); }
    /* items, far to near */
    const items = G.items.slice().sort((a, b) => a.y - b.y);
    for (const it of items) {
      const bob = it.type === 'banana' || it.type === 'golden' || it.type === 'diamond' || it.type === 'bundle' ? Math.round(Math.sin(G.t * 5 + it.ph) * 1.5) : 0;
      const sp = it.type === 'banana' ? A.banana : it.type === 'golden' ? A.golden : it.type === 'diamond' ? A.diamond : it.type === 'bundle' ? bundles[Math.floor(it.ph) % 4] : SPR[it.type];
      if (it.type === 'rock' || it.type === 'log' || it.type === 'peel') { g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(Math.round(it.x - sp.width / 2 + 1), Math.round(it.y + sp.height / 2 - 1), sp.width, 2); }
      g.drawImage(sp, Math.round(it.x - sp.width / 2), Math.round(it.y - sp.height / 2) + bob);
      if ((it.type === 'golden' || it.type === 'diamond') && Math.floor(G.t * 12 + it.ph) % 2 === 0) fx.spark(it.x, it.y, it.type === 'diamond' ? '#9be8ff' : '#fff08c');
    }
    /* monkey */
    const flick = p.inv > 0 && G.dash <= 0 && Math.floor(performance.now() / 70) % 2 === 0;
    if (!flick) {
      const lean = clamp((LX[p.lane] - p.x) / 14, -1, 1) * -.24, ex = p.et > 0 ? p.expr : p.blink > 0 ? 'blink' : 'normal';
      const f = PXA.monkeyFrame('pd', ex, p.spin > 0 ? 0 : lean, false, p.z > 0 ? 1 : p.ph, 0), jy = Math.round(p.z);
      g.fillStyle = 'rgba(0,0,0,.28)'; const sw = Math.max(8, 16 - jy / 2); g.fillRect(Math.round(p.x - sw / 2), PY + 1, sw, 2);
      if (G.dash > 0) { g.globalAlpha = .4; g.drawImage(f.cv, Math.round(p.x - f.pivot[0]), Math.round(PY - 41.5 * .7 - f.pivot[1]) - jy + 12); g.globalAlpha = 1; }
      g.drawImage(f.cv, Math.round(p.x - f.pivot[0]), Math.round(PY - 41.5 * .7 - f.pivot[1]) - jy);
    }
    fx.draw(g); g.restore();
  }

  /* ---------- shell + input ---------- */
  const S = MG.shell({
    host, ui, id: 'peeldash', title: 'PEEL<span>DASH</span>', sub: 'Run. Dodge. Grab bananas.',
    legend: [[A.banana, '<em>10</em> per banana'], [SPR.rock, '<em class="bad">rock</em> = dodge it'], [SPR.log, '<em>log</em> = jump it'], [SPR.peel, '<em class="bad">peel</em> = jump it'], [A.golden, '<em>dash</em> invincible'], [A.diamond, '<em class="ice">river</em> x3']],
    hint: 'swipe / ← → to change lane · swipe up / ↑ / Space to jump', spaceStarts: false, onStart: () => newGame(), score: () => G.score,
  });
  let sw = null;
  addEventListener('pointerdown', ev => { if (ev.target.closest('.mg-over,.mg-nav')) return; sw = { x: ev.clientX, y: ev.clientY, done: false }; });
  addEventListener('pointermove', ev => {
    if (!sw || sw.done || !S.playing) return; const dx = ev.clientX - sw.x, dy = ev.clientY - sw.y, th = 18;
    if (Math.abs(dx) > th && Math.abs(dx) > Math.abs(dy)) { move(dx > 0 ? 1 : -1); sw.done = true; } else if (dy < -th) { jump(); sw.done = true; }
  });
  addEventListener('pointerup', ev => {
    if (sw && !sw.done && S.playing) { const [px] = st.toArt(ev); if (px < W / 3) move(-1); else if (px > W * 2 / 3) move(1); else jump(); } sw = null;
  });
  addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    if (k === 'arrowleft' || k === 'a') { move(-1); e.preventDefault(); } else if (k === 'arrowright' || k === 'd') { move(1); e.preventDefault(); }
    else if (k === 'arrowup' || k === 'w' || k === ' ') { if (S.playing) jump(); else if (k === ' ' && !e.repeat && (S.phase === 'title' || S.phase === 'over')) { sfx.unlock(); S.start(); } e.preventDefault(); }
  });

  ['normal', 'scared', 'screech', 'blink'].forEach(e => PXA.monkeySets.pd.angles.forEach(a => [0, 1].forEach(q => PXA.monkeyFrame('pd', e, a * Math.PI / 180, false, q, 0))));
  newGame(); S.title();
  if (params.get('autostart')) { S.start(); botOn = !!params.get('bot'); for (let i = 0, n = (+params.get('warp') || 0) * 60; i < n; i++) update(1 / 60); }
  if (params.get('dbg')) setInterval(() => { document.title = `d=${Math.round(G.dist)} b=${G.bananas} hearts=${G.hearts} t=${Math.round(G.t)}`; }, 200);
  MG.loop(update, draw);
  window.PD = { get G() { return G; }, S, p };
})();
