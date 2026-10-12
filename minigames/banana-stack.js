/* ============================================================
   BANANA STACK: a monkey rides a swinging banana crate above the tower. Tap to drop it.
   Whatever overhangs the crate below is sliced off; a perfect drop keeps the full width and chains a combo
   (three perfects in a row and the crate grows back). Golden crates (every 10th level) give a bonus; the rare Diamond crate resets your width.
   Standalone: no connection to the main game's save yet.
   ============================================================ */
(() => {
  'use strict';
  const { rng, clamp, lerp, sfx } = MG;
  const W = 120, H = 208, CH = 10, GROUND = H - 22, BASE_W = 50, MAX_W = 56;
  const params = new URLSearchParams(location.search), RARE = +params.get('rare') || 0;

  MG.boot();
  PXA.monkeySets.stk = { k: .7, max: 0, step: 7 }; PXA.monkeySets.stk.angles = [0]; PXA.monkeySets.stk.cache = {};
  const A = MGArt.build();
  const host = document.getElementById('stage'), st = MG.stage(host, W, H, { padY: 40 }), g = st.g;
  host.style.cursor = 'pointer';
  const ui = MG.ui(host, st, A.banana, 0), fx = MG.fx();
  document.querySelector('.mg-hearts').style.display = 'none';

  const THEMES = [['#e8b878', '#b57d3e', '#7a4a1e'], ['#a8ec76', '#4aa23c', '#1f6a2a'], ['#9ce0ff', '#3a8ec8', '#184c78'], ['#e4b0ff', '#8c58c8', '#4a2a78']];
  const GOLD = ['#fff7b0', '#ffd23a', '#b38004'], ICE = ['#ffffff', '#9be8ff', '#2a86b8'];

  /* ---------- state ---------- */
  let G = null, botOn = false;
  const monkey = { expr: 'normal', t: 0, blink: 0 };
  const crateY = lvl => GROUND - (lvl + 1) * CH;

  function newGame() {
    G = { t: 0, score: 0, tower: [{ x: W / 2 - BASE_W / 2, w: BASE_W, kind: 'base', lvl: 0 }], cur: null, dir: 1, cam: 0, camT: 0, perfects: 0, streak: 0, bestStreak: 0, debris: [], dropT: 0, dead: 0, shake: 0, goldens: 0, diamonds: 0, slow: 1, slowT: 0, clouds: [] };
    for (let i = 0; i < 5; i++) G.clouds.push({ x: rng(W), y: rng(-60, H), s: rng(.4, 1) });
    spawnCrate(); fx.clear(); ui.setScore(0); ui.setCombo(0, 1);
  }
  const top = () => G.tower[G.tower.length - 1];
  function spawnCrate() {
    const lvl = G.tower.length, t = top(), w = t.w;
    const kind = lvl % 10 === 0 ? 'gold' : lvl > 8 && Math.random() < .02 + RARE * .5 ? 'ice' : 'wood';
    G.cur = { x: G.dir > 0 ? 0 : W - w, w, kind, lvl, y: 0 }; G.dropT = 0;
  }
  const speed = () => Math.min(135, 44 + G.tower.length * 3.2);

  /* ---------- dropping ---------- */
  function drop() {
    if (!S.playing || !G.cur || G.dropT > 0 || G.dead) return;
    const c = G.cur, t = top(), l = Math.max(c.x, t.x), r = Math.min(c.x + c.w, t.x + t.w), ov = r - l;
    G.dropT = .12; G.landing = true;
    if (ov <= 0) { /* clean miss: the crate tumbles off the tower */
      G.debris.push({ x: c.x, y: crateY(c.lvl), w: c.w, vy: 0, vx: c.x + c.w / 2 > t.x + t.w / 2 ? 30 : -30, kind: c.kind, lvl: c.lvl });
      G.cur = null; G.dead = .9; sfx.over(); G.shake = 4; return;
    }
    const perfect = Math.abs(c.x - t.x) <= 1.6;
    let nx = c.x, nw = c.w;
    if (perfect) { nx = t.x; nw = t.w; G.streak++; G.perfects++; G.bestStreak = Math.max(G.bestStreak, G.streak); }
    else {
      G.streak = 0; nx = l; nw = ov;
      const cutL = c.x < t.x, cw = c.w - ov; /* the overhang falls away */
      G.debris.push({ x: cutL ? c.x : r, y: crateY(c.lvl), w: cw, vy: 0, vx: cutL ? -22 : 22, kind: c.kind, lvl: c.lvl });
    }
    let pts = 10 + (perfect ? 5 * Math.min(G.streak, 8) : 0), cx = nx + nw / 2, cy = crateY(c.lvl);
    if (perfect && G.streak >= 3 && nw < MAX_W) { nw = Math.min(MAX_W, nw + 2); nx = Math.max(0, nx - 1); ui.floatText(cx, cy - 12, 'GROW +', 'gold'); }
    if (c.kind === 'gold') { pts += 50; G.goldens++; nw = Math.min(MAX_W, nw + 6); nx = clamp(nx - 3, 0, W - nw); sfx.golden(); fx.burst(cx, cy, ['#ffd23a', '#fff08c', '#fffbe0'], 18, 80, 70, .8); fx.ring(cx, cy, '#ffd23a', 34); ui.floatText(cx, cy - 22, 'GOLDEN +50', 'gold'); }
    if (c.kind === 'ice') { pts += 200; G.diamonds++; nw = BASE_W; nx = clamp(cx - nw / 2, 0, W - nw); sfx.diamond(); ui.doFlash('#e8fbff'); G.slow = .35; G.slowT = .8; fx.burst(cx, cy, ['#9be8ff', '#fff', '#2a86b8'], 30, 110, 60, 1); fx.ring(cx, cy, '#9be8ff', 56); ui.say('DIAMOND CRATE<small>full width restored · +200</small>', 'ice'); }
    G.tower.push({ x: nx, w: nw, kind: c.kind, lvl: c.lvl, landed: .2 }); G.cur = null; G.score += pts; ui.setScore(G.score); ui.bump();
    if (perfect) {
      sfx.ding(Math.min(12, G.streak * 2)); ui.floatText(cx, cy - 10, G.streak > 1 ? `PERFECT x${G.streak}` : 'PERFECT', 'gold'); fx.ring(cx, cy + 4, '#fff08c', 20); fx.burst(cx, cy + 3, ['#fff08c', '#fff'], 8, 60, 80, .4);
      monkey.expr = 'screech'; monkey.t = .6; ui.setCombo(G.streak, G.streak); if (G.streak >= 3) ui.pulseCombo();
    } else { sfx.thud(); sfx.clack(); fx.burst(nx + nw / 2, cy + 5, ['#c9b88a', '#8c8670'], 5, 26, 70, .3); ui.setCombo(0, 1); G.shake = 1.5; }
    if (c.lvl % 10 === 0 && c.kind !== 'gold') { /* unreachable: gold crates are every 10th */ }
    if (G.tower.length % 10 === 0) ui.floatText(W / 2, 50, `${(G.tower.length - 1)} CRATES!`, 'gold big');
    if (G.tower.length >= 2) { G.dir = Math.random() < .5 ? 1 : -1; }
    G.nextT = .16;
  }

  /* ---------- update ---------- */
  function update(rdt) {
    fx.update(rdt);
    monkey.blink -= rdt; if (monkey.blink < -3.2) monkey.blink = .14; if (monkey.t > 0) { monkey.t -= rdt; if (monkey.t <= 0) monkey.expr = 'normal'; }
    if (!G) return;
    if (G.slowT > 0) { G.slowT -= rdt; if (G.slowT <= 0) G.slow = 1; }
    if (!S.playing) { G.cam = lerp(G.cam, G.camT, .1); return; }
    const dt = rdt * G.slow; G.t += dt; G.shake = Math.max(0, G.shake - rdt * 18);
    const n = G.tower.length, topY = GROUND - n * CH, want = Math.max(0, 96 - topY); G.camT = want; G.cam = lerp(G.cam, G.camT, 1 - Math.pow(.001, dt));
    G.tower.forEach(c => { if (c.landed > 0) c.landed -= dt; });
    for (const c of G.clouds) { c.y += 3 * c.s * dt + (G.camT - G.cam) * .02; if (c.y > H + 10) { c.y = -12; c.x = rng(W); } }
    if (G.dead > 0) { G.dead -= rdt; if (G.dead <= 0) S.finish([['CRATES', G.tower.length - 1], ['PERFECTS', G.perfects], ['BEST CHAIN', G.bestStreak], ['GOLD / DIAMOND', `${G.goldens} / ${G.diamonds}`]]); }
    if (G.dropT > 0) G.dropT -= dt;
    if (G.nextT > 0) { G.nextT -= dt; if (G.nextT <= 0 && !G.dead) spawnCrate(); }
    const c = G.cur;
    if (c) {
      c.x += G.dir * speed() * dt;
      if (c.x <= 0) { c.x = 0; G.dir = 1; } else if (c.x + c.w >= W) { c.x = W - c.w; G.dir = -1; }
      if (botOn) { const t = top(); if (Math.abs(c.x - t.x) < 1.2 || (G.t > 3 && Math.abs(c.x - t.x) < 4 && Math.random() < .2)) drop(); }
    }
    for (let i = G.debris.length - 1; i >= 0; i--) { const d = G.debris[i]; d.vy += 420 * dt; d.y += d.vy * dt; d.x += d.vx * dt; if (d.y > H + 400) G.debris.splice(i, 1); }
  }

  /* ---------- draw ---------- */
  function crate(x, y, w, kind, lvl, sway = 0) {
    const th = kind === 'gold' ? GOLD : kind === 'ice' ? ICE : THEMES[Math.floor(lvl / 10) % THEMES.length];
    x = Math.round(x + sway); y = Math.round(y);
    g.fillStyle = '#1a0f14'; g.fillRect(x - 1, y - 1, w + 2, CH + 2);
    g.fillStyle = th[1]; g.fillRect(x, y, w, CH);
    g.fillStyle = th[0]; g.fillRect(x, y, w, 1); g.fillStyle = th[2]; g.fillRect(x, y + CH - 2, w, 2);
    g.fillStyle = th[2]; for (let px = x + 6; px < x + w - 4; px += 8) g.fillRect(px, y + 1, 1, CH - 3);
    g.fillStyle = '#b8b8c4'; g.fillRect(x, y, 3, 2); g.fillRect(x + w - 3, y, 3, 2); g.fillRect(x, y + CH - 3, 3, 2); g.fillRect(x + w - 3, y + CH - 3, 3, 2);
    if (kind === 'wood' && w > 16) { g.fillStyle = '#ffd23a'; g.fillRect(x + Math.floor(w / 2) - 2, y + 3, 5, 3); g.fillStyle = '#c98f0e'; g.fillRect(x + Math.floor(w / 2) - 2, y + 5, 5, 1); }
    if (kind === 'gold') { g.fillStyle = '#fff'; g.fillRect(x + 3 + (Math.floor(performance.now() / 90) % Math.max(1, w - 8)), y + 1, 1, CH - 3); }
    if (kind === 'ice' && Math.floor(performance.now() / 100) % 3 === 0) { g.fillStyle = '#fff'; g.fillRect(x + 4 + ((x * 3) % Math.max(1, w - 8)), y + 2, 2, 2); }
  }
  function draw() {
    g.clearRect(0, 0, W, H); g.save();
    if (G.shake > .3) g.translate(Math.round(rng(-G.shake, G.shake) * .5), Math.round(rng(-G.shake, G.shake) * .5));
    for (const c of G.clouds) { g.globalAlpha = .55; g.drawImage(PXA.spr.cloud.cv, Math.round(c.x), Math.round(c.y)); g.globalAlpha = 1; }
    g.save(); g.translate(0, Math.round(G.cam));
    /* ground + height markers */
    g.fillStyle = '#5a3517'; g.fillRect(0, GROUND, W, H - GROUND + 400); g.fillStyle = '#1f6a2a'; g.fillRect(0, GROUND, W, 4); g.fillStyle = '#74c648'; g.fillRect(0, GROUND, W, 1);
    for (let m = 5; m < 400; m += 5) { const y = GROUND - m * CH; if (y + G.cam < -6) break; if (y + G.cam > H) continue; g.fillStyle = 'rgba(255,246,214,.35)'; for (let x = 0; x < W; x += 6) g.fillRect(x, y, 3, 1); g.fillStyle = 'rgba(255,246,214,.7)'; if (m % 10 === 0) g.fillRect(W - 14, y - 2, 12, 1); }
    /* the tower, swaying a touch as it grows */
    G.tower.forEach((c, i) => { const sway = Math.sin(G.t * 1.6 + i * .5) * Math.min(i, 40) * .035; crate(c.x, crateY(c.lvl) + (c.landed > 0 ? Math.round(c.landed * 8) % 2 : 0), c.w, c.kind, c.lvl, sway); });
    for (const d of G.debris) crate(d.x, d.y, d.w, d.kind, d.lvl);
    /* the swinging crate with its monkey */
    if (G.cur) {
      const c = G.cur, lift = G.dropT > 0 ? Math.max(0, G.dropT / .12) * 8 : 0, y = crateY(c.lvl) - 14 + (14 - lift) * 0;
      const yy = crateY(c.lvl) - (G.dropT > 0 ? 0 : 14);
      crate(c.x, yy, c.w, c.kind, c.lvl);
      const f = PXA.monkeyFrame('stk', monkey.t > 0 ? monkey.expr : monkey.blink > 0 ? 'blink' : 'normal', 0, false, G.dir > 0 ? 0 : 1, 0);
      g.drawImage(f.cv, Math.round(c.x + c.w / 2 - f.pivot[0]), Math.round(yy - 41.5 * .7 - f.pivot[1] + 1));
      g.fillStyle = 'rgba(255,246,214,.25)'; const t = top(); g.fillRect(Math.round(c.x + c.w / 2), Math.round(yy + CH + 1), 1, Math.max(0, crateY(t.lvl) - yy - CH - 1) | 0);
    }
    g.restore();
    fx.draw(g); g.restore();
  }

  /* ---------- shell + input ---------- */
  const S = MG.shell({
    host, ui, id: 'stack', title: 'BANANA<span>STACK</span>', sub: 'Drop the crate. Line it up. Climb.',
    legend: [[A.banana, '<em>10</em> per crate'], [A.golden, '<em>+50</em> golden crate'], [A.diamond, '<em class="ice">+200</em> diamond crate'], [A.coconut, '<em class="bad">miss</em> = game over']],
    hint: 'tap / click / Space to drop', spaceStarts: false, onStart: () => newGame(), score: () => G.score,
  });
  addEventListener('pointerdown', ev => { if (S.playing && !ev.target.closest('.mg-over,.mg-nav')) drop(); });
  addEventListener('keydown', e => { if (e.key === ' ' && S.playing) { if (!e.repeat) drop(); e.preventDefault(); } else if (e.key === ' ' && !e.repeat && (S.phase === 'title' || S.phase === 'over')) { sfx.unlock(); S.start(); e.preventDefault(); } });

  ['normal', 'screech', 'blink'].forEach(e => [0, 1].forEach(p => PXA.monkeyFrame('stk', e, 0, false, p, 0)));
  newGame(); S.title();
  if (params.get('autostart')) { S.start(); botOn = !!params.get('bot'); for (let i = 0, n = (+params.get('warp') || 0) * 60; i < n; i++) update(1 / 60); }
  MG.loop(update, draw);
  window.BS = { get G() { return G; }, S };
})();
