/* ============================================================
   VINE SWING: hold to grab a vine and swing, release to fly, hold again to catch the next one. One button.
   Bananas hang along the arcs; bats knock you off; the river below ends the run. The longer you stay on a vine the harder you swing.
   Rare: the Golden Banana widens your grab, the Diamond Banana pulls every banana to you for a few seconds.
   Controls: hold mouse / finger / Space. Standalone: no connection to the main game's save yet.
   ============================================================ */
(() => {
  'use strict';
  const { rng, clamp, lerp, sfx } = MG;
  const W = 176, H = 120, WATER = H - 9, GRAV = 270, SWING_G = 320;
  const params = new URLSearchParams(location.search), RARE = +params.get('rare') || 0;

  MG.boot();
  PXA.monkeySets.vs = { k: .5, max: 42, step: 7 }; { const s = PXA.monkeySets.vs; s.angles = []; for (let a = -s.max; a <= s.max; a += s.step) s.angles.push(a); s.cache = {}; }
  const A = MGArt.build(), { R, make, shapes: { ell, poly, box } } = MGArt;
  const host = document.getElementById('stage'), st = MG.stage(host, W, H, { padY: 40 }), g = st.g;
  const ui = MG.ui(host, st, A.banana, 0), fx = MG.fx();
  document.querySelector('.mg-hearts').style.display = 'none';

  const batSpr = [0, 1].map(f => make(13, 8, px => {
    px.shape(ell(6.5, 4.5, 2, 2.4), R.ink, 2);
    px.shape(f ? poly([[4.5, 4], [0, 1], [1, 5.5], [4.5, 6]]) : poly([[4.5, 3], [0, 6], [1.5, 7], [4.5, 5.5]]), R.grape, 1);
    px.shape(f ? poly([[8.5, 4], [13, 1], [12, 5.5], [8.5, 6]]) : poly([[8.5, 3], [13, 6], [11.5, 7], [8.5, 5.5]]), R.grape, 1);
  }));
  const gem = A.diamond, gold = A.golden;

  /* ---------- state ---------- */
  let G = null, hold = false, botOn = false;
  const m = { x: 0, y: 0, vx: 0, vy: 0, vine: null, th: 0, om: 0, r: 60, cd: 0, stun: 0, armed: false, last: null, expr: 'normal', et: 0, blink: 0 };

  function newVine(prev) {
    const d = prev ? prev.ax : 0, tough = clamp(d / 3000, 0, 1);
    return { ax: prev ? prev.ax + rng(lerp(34, 46, tough), lerp(46, 64, tough)) : 40, ay: -6, len: rng(58, 80), th: 0, ph: rng(6.28) };
  }
  function newGame() {
    G = { t: 0, vines: [], picks: [], bats: [], cam: 0, dist: 0, bananas: 0, goldens: 0, diamonds: 0, score: 0, assist: 0, magnet: 0, shake: 0, dead: 0, best: 0, genX: 0, splash: null, grabs: 0, bestSwing: 0 };
    let v = newVine(null); G.vines.push(v); for (let i = 0; i < 6; i++) { v = newVine(v); G.vines.push(v); }
    G.vines.forEach(decorate);
    const v0 = G.vines[0]; m.vine = v0; m.r = 56; m.th = .75; m.om = 0; m.armed = false; m.cd = 0; m.stun = 0; m.last = v0; m.x = v0.ax + Math.sin(m.th) * m.r; m.y = v0.ay + Math.cos(m.th) * m.r;
    G.cam = m.x - 60; fx.clear(); ui.setScore(0); ui.setCombo(0, 1);
    ui.say('HOLD TO SWING<small>release to fly · hold to catch</small>');
  }
  /* each new vine brings bananas along the arc after it, and sometimes a bat or a rare banana */
  function decorate(v, i, arr) {
    const nx = arr[i + 1] || null; if (!nx || v.done) return; v.done = true;
    const gap = nx.ax - v.ax, d = v.ax / 10, n = 1 + Math.floor(Math.random() * 2) + (Math.random() < .2 ? 1 : 0);
    for (let k = 0; k < n; k++) { const t = (k + 1) / (n + 1), type = Math.random() < .018 + RARE * .3 && d > 20 ? 'golden' : Math.random() < .006 + RARE * .3 && d > 40 ? 'diamond' : 'banana'; G.picks.push({ x: v.ax + gap * t, y: 28 + Math.sin(t * Math.PI) * -14 + rng(18, 44), type, got: false, ph: Math.random() * 6 }); }
    if (d > 30 && Math.random() < clamp(.25 + d / 600, 0, .55)) G.bats.push({ x: v.ax + gap * rng(.35, .65), y: rng(34, 70), ph: Math.random() * 6, amp: rng(8, 18), spd: rng(1.5, 3), hit: false });
  }
  function extend() { const last = G.vines[G.vines.length - 1]; if (last.ax < G.cam + W + 140) { const v = newVine(last); G.vines.push(v); decorate(last, G.vines.length - 2, G.vines); } }

  /* ---------- update ---------- */
  function update(rdt) {
    fx.update(rdt);
    m.blink -= rdt; if (m.blink < -3.2) m.blink = .14; if (m.et > 0) { m.et -= rdt; if (m.et <= 0) m.expr = 'normal'; }
    if (!G || !S.playing) return;
    const dt = rdt; G.t += dt; G.shake = Math.max(0, G.shake - rdt * 20); if (G.assist > 0) G.assist -= dt; if (G.magnet > 0) G.magnet -= dt;
    ui.setMeter(G.magnet > 0 ? G.magnet / 6 : G.assist / 7, G.magnet > 0);
    if (G.dead > 0) { G.dead -= rdt; if (G.dead <= 0) S.finish([['DISTANCE', Math.round(G.dist) + 'm'], ['BANANAS', G.bananas], ['VINES GRABBED', G.grabs], ['BEST SWING', Math.round(G.bestSwing) + 'm'], ['GOLD / DIAMOND', `${G.goldens} / ${G.diamonds}`]]); }
    G.vines.forEach(v => { if (v !== m.vine) v.th = Math.sin(G.t * 1.3 + v.ph) * .035; });
    if (m.cd > 0) m.cd -= dt; if (m.stun > 0) m.stun -= dt;
    const want = botOn ? botHold() : hold;
    if (G.dead <= 0) {
      if (want) m.armed = true;
      if (m.vine) {
        const v = m.vine; m.om += (-(SWING_G / m.r) * Math.sin(m.th) - .12 * m.om) * dt;
        if (want && Math.abs(m.om) < 3.6) m.om += Math.sign(m.om || 1) * 1.05 * dt;       /* holding builds the swing */
        m.th += m.om * dt; v.th = m.th; m.x = v.ax + m.r * Math.sin(m.th); m.y = v.ay + m.r * Math.cos(m.th);
        if (!want && m.armed) release();
      } else {
        m.vy += GRAV * dt; m.x += m.vx * dt; m.y += m.vy * dt;
        if (want && m.cd <= 0 && m.stun <= 0) tryGrab();
        if (m.y + 20 > WATER) die();
      }
    }
    G.dist = Math.max(G.dist, (m.x - 40) / 8); if (G.dist > G.best) G.best = G.dist;
    G.score = Math.floor(G.dist) + G.bananas * 8 + G.goldens * 40 + G.diamonds * 150; ui.setScore(G.score);
    G.cam = lerp(G.cam, m.x - 62, 1 - Math.pow(.0005, dt)); extend();
    G.vines = G.vines.filter(v => v.ax > G.cam - 120 || v === m.vine);
    G.picks = G.picks.filter(p => !p.got && p.x > G.cam - 30); G.bats = G.bats.filter(b => b.x > G.cam - 40);

    for (const p of G.picks) {
      if (G.magnet > 0 && Math.abs(p.x - m.x) < 90) { p.x += (m.x - p.x) * Math.min(1, 6 * dt); p.y += (m.y - 4 - p.y) * Math.min(1, 6 * dt); }
      if (Math.hypot(p.x - m.x, p.y - (m.y + 12)) < 11) collect(p);
    }
    for (const b of G.bats) {
      b.y0 = b.y0 == null ? b.y : b.y0; b.cy = b.y0 + Math.sin(G.t * b.spd + b.ph) * b.amp;
      if (!b.hit && Math.hypot(b.x - m.x, b.cy - (m.y + 12)) < 10) {
        b.hit = true; sfx.bonk(); G.shake = 5; ui.doFlash('#2a1020'); fx.burst(m.x, m.y, ['#6a48a8', '#1a0f14', '#fff6d6'], 10, 60, 120, .5); ui.floatText((m.x - G.cam), m.y - 10, 'BAT!', 'bad'); m.expr = 'scared'; m.et = .8;
        if (m.vine) { m.vx = m.vine ? m.r * Math.cos(m.th) * m.om : 0; m.vy = 0; m.vine = null; } m.stun = .6; m.vx *= .6; m.vy = -30;
      }
    }
  }
  function release() {
    const v = m.vine; m.vx = m.r * Math.cos(m.th) * m.om; m.vy = -m.r * Math.sin(m.th) * m.om; m.vine = null; m.cd = .22; m.last = v; sfx.tick();
    m.from = m.x; fx.burst(m.x, m.y, ['#74c648', '#2f8a35'], 4, 24, 60, .3);
  }
  function tryGrab() {
    const reach = G.assist > 0 ? 10 : 6;
    for (const v of G.vines) {
      if (v === m.last && Math.abs(m.x - m.from) < 12) continue;
      const dx = m.x - v.ax, dy = m.y - v.ay; if (Math.abs(dx) > reach || dy < 14 || dy > v.len + 4) continue;
      m.vine = v; m.r = clamp(Math.hypot(dx, dy), 22, v.len); m.th = Math.atan2(dx, dy); m.om = (m.vx * Math.cos(m.th) - m.vy * Math.sin(m.th)) / m.r; m.last = v; G.grabs++;
      G.bestSwing = Math.max(G.bestSwing, (m.x - (m.from || m.x)) / 8);
      sfx.clack(Math.min(10, G.grabs)); fx.burst(m.x, m.y, ['#74c648', '#a8ec76'], 5, 30, 60, .3);
      if (Math.abs(dx) < 2.2) { ui.floatText(m.x - G.cam, m.y - 14, 'NICE CATCH', 'gold'); G.score += 0; }
      return;
    }
  }
  function collect(p) {
    p.got = true; const x = p.x - G.cam;
    if (p.type === 'banana') { G.bananas++; sfx.ding(Math.min(10, G.bananas % 12)); fx.burst(p.x, p.y, ['#ffd23a', '#fff08c'], 6, 40, 80, .35); ui.floatText(x, p.y - 8, '+8'); }
    else if (p.type === 'golden') { G.goldens++; G.assist = 7; sfx.golden(); fx.ring(p.x, p.y, '#ffd23a', 30); fx.burst(p.x, p.y, ['#ffd23a', '#fff08c', '#fffbe0'], 18, 80, 60, .8); ui.say('GOLDEN GRIP<small>wide grab · 7 seconds</small>'); ui.floatText(x, p.y - 8, '+40', 'gold'); }
    else { G.diamonds++; G.magnet = 6; sfx.diamond(); ui.doFlash('#e8fbff'); fx.ring(p.x, p.y, '#9be8ff', 50); fx.burst(p.x, p.y, ['#9be8ff', '#fff', '#2a86b8'], 30, 110, 50, 1); ui.say('DIAMOND MAGNET<small>bananas fly to you · 6s</small>', 'ice'); ui.floatText(x, p.y - 8, '+150', 'ice'); }
    ui.bump();
  }
  function die() {
    G.dead = 1; sfx.over(); G.shake = 4; G.splash = { x: m.x, t: 0 }; m.vx = 0; m.vy = 0; fx.burst(m.x, WATER, ['#7ec8f0', '#d6f0ff', '#3a8ec8'], 24, 90, 220, .8); fx.ring(m.x, WATER, '#d6f0ff', 24); m.expr = 'scared'; m.et = 2;
  }
  /* dev autoplayer: hold on the way up, release on a forward upswing, aim for a vine ahead */
  function botHold() {
    if (m.vine) return !(m.om > 0 && m.th > .3 + Math.min(.4, (m.vine.len - 60) * .01) && nextVine() && nextVine().ax - m.x < 62);
    return true;
  }
  const nextVine = () => G.vines.find(v => v.ax > m.x + 6);

  /* ---------- draw ---------- */
  function vineLine(ax, ay, th, len, lit) {
    const tx = ax + Math.sin(th) * len, ty = ay + Math.cos(th) * len, n = Math.ceil(len);
    for (let i = 0; i <= n; i += 1) {
      const t = i / n, x = Math.round(lerp(ax, tx, t)), y = Math.round(lerp(ay, ty, t));
      g.fillStyle = '#17481f'; g.fillRect(x - 1, y, 3, 1); g.fillStyle = lit ? '#a8ec76' : '#2f8a35'; g.fillRect(x, y, 1, 1);
      if (i % 9 === 4) { g.fillStyle = '#74c648'; g.fillRect(x + (i % 18 < 9 ? 1 : -3), y, 3, 1); g.fillRect(x + (i % 18 < 9 ? 2 : -3), y - 1, 1, 1); }
    }
    g.fillStyle = '#17481f'; g.fillRect(Math.round(tx) - 1, Math.round(ty), 3, 3); g.fillStyle = '#74c648'; g.fillRect(Math.round(tx), Math.round(ty), 1, 2);
  }
  function arm(sx, sy, ex, ey) {
    const n = Math.max(Math.abs(ex - sx), Math.abs(ey - sy), 1);
    for (let i = 0; i <= n; i++) { const x = Math.round(lerp(sx, ex, i / n)), y = Math.round(lerp(sy, ey, i / n)); g.fillStyle = '#2a170b'; g.fillRect(x - 1, y - 1, 3, 3); }
    for (let i = 0; i <= n; i++) { const x = Math.round(lerp(sx, ex, i / n)), y = Math.round(lerp(sy, ey, i / n)); g.fillStyle = '#6e4220'; g.fillRect(x, y, 1, 1); }
    g.fillStyle = '#2a170b'; g.fillRect(ex - 1, ey - 1, 4, 4); g.fillStyle = '#e0aa76'; g.fillRect(ex, ey, 2, 2);
  }
  function draw() {
    g.clearRect(0, 0, W, H); g.save();
    if (G.shake > .3) g.translate(Math.round(rng(-G.shake, G.shake) * .5), Math.round(rng(-G.shake, G.shake) * .5));
    const cam = Math.round(G.cam);
    /* distant trunks (parallax) and the canopy */
    g.fillStyle = 'rgba(10,42,28,.55)'; for (let i = -1; i < 6; i++) { const x = ((i * 53 - cam * .45) % (W + 60) + W + 60) % (W + 60) - 20; g.fillRect(Math.round(x), 0, 6 + (i & 1) * 3, WATER); }
    g.fillStyle = '#0c3012'; g.fillRect(0, 0, W, 5); g.fillStyle = '#1f6a2a'; for (let x = -((cam * .9) % 14); x < W; x += 14) { g.fillRect(Math.round(x), 4, 9, 3); g.fillRect(Math.round(x) + 3, 7, 4, 2); }
    g.save(); g.translate(-cam, 0);
    for (const v of G.vines) vineLine(v.ax, v.ay, v.th, v.len, v === m.vine);
    /* pickups */
    for (const p of G.picks) {
      const bob = Math.round(Math.sin(G.t * 4 + p.ph) * 1.5), sp = p.type === 'diamond' ? gem : p.type === 'golden' ? gold : A.banana;
      g.drawImage(sp, Math.round(p.x - sp.width / 2), Math.round(p.y - sp.height / 2) + bob);
      if (p.type !== 'banana' && Math.floor(G.t * 10 + p.ph) % 2) fx.spark(p.x, p.y, p.type === 'diamond' ? '#9be8ff' : '#fff08c');
    }
    for (const b of G.bats) { if (b.cy == null) continue; g.drawImage(batSpr[Math.floor(G.t * 9 + b.ph) % 2], Math.round(b.x - 6), Math.round(b.cy - 4)); }
    /* monkey */
    if (!(G.splash && G.dead > 0)) {
      const air = !m.vine, a = m.vine ? -m.th : clamp(m.vx / 140, -.6, .6), ex = m.et > 0 ? m.expr : m.stun > 0 ? 'scared' : m.blink > 0 ? 'blink' : 'normal';
      const f = PXA.monkeyFrame('vs', ex, a, false, air ? Math.floor(G.t * 6) % 2 : 0, 0), k = .5, ac = Math.cos(a), as = Math.sin(a);
      const loc = (lx, ly) => [m.x + lx * ac - ly * as, m.y + lx * as + ly * ac], P = loc(0, 7);
      const hx = Math.round(m.x), hy = Math.round(m.y - 1), sh = [loc(-3, 7 + 9), loc(3, 7 + 9)];
      if (m.vine || hold || botOn) { arm(Math.round(sh[0][0]), Math.round(sh[0][1]), hx - 1, hy); arm(Math.round(sh[1][0]), Math.round(sh[1][1]), hx + 1, hy); }
      g.drawImage(f.cv, Math.round(P[0] - f.pivot[0]), Math.round(P[1] - f.pivot[1]));
    }
    fx.draw(g);
    g.restore();
    /* river */
    g.fillStyle = '#184c78'; g.fillRect(0, WATER, W, H - WATER); g.fillStyle = '#3a8ec8'; g.fillRect(0, WATER, W, 2);
    for (let x = 0; x < W; x += 3) { const y = WATER + 1 + Math.round(Math.sin((x + cam) * .22 + G.t * 3) * 1); g.fillStyle = '#7ec8f0'; g.fillRect(x, y, 2, 1); }
    g.fillStyle = '#d6f0ff'; for (let i = 0; i < 6; i++) g.fillRect(Math.round(((i * 37 - cam * 1.1) % W + W) % W), WATER + 4 + (i % 2) * 2, 4, 1);
    /* croc eyes lurk while you're low */
    if (m.y > WATER - 40 && G.dead <= 0) { const ex = Math.round(((m.x - cam) + 6 * Math.sin(G.t)) ); g.fillStyle = '#2f8a35'; g.fillRect(ex - 3, WATER - 1, 8, 3); g.fillStyle = '#ffd23a'; g.fillRect(ex - 2, WATER - 2, 2, 2); g.fillRect(ex + 3, WATER - 2, 2, 2); g.fillStyle = '#1a0f14'; g.fillRect(ex - 1, WATER - 2, 1, 2); g.fillRect(ex + 4, WATER - 2, 1, 2); }
    g.restore();
  }

  /* ---------- shell + input ---------- */
  const S = MG.shell({
    host, ui, id: 'vine', title: 'VINE<span>SWING</span>', sub: 'One button. Swing, fly, catch.',
    legend: [[A.banana, '<em>8</em> per banana'], [batSpr[0], '<em class="bad">bats</em> knock you off'], [A.golden, '<em>+40</em> wide grab'], [A.diamond, '<em class="ice">+150</em> banana magnet']],
    hint: 'HOLD mouse / finger / Space · release to let go', spaceStarts: false, onStart: () => newGame(), score: () => G.score, overTitle: 'SPLASH!',
  });
  const down = on => { hold = on; if (on && S.playing) sfx.unlock(); };
  addEventListener('pointerdown', ev => { if (ev.target.closest('.mg-over,.mg-nav')) return; down(true); });
  addEventListener('pointerup', () => down(false)); addEventListener('pointercancel', () => down(false)); addEventListener('blur', () => down(false));
  addEventListener('keydown', e => { if (e.key === ' ') { if (S.playing) down(true); else if (!e.repeat && (S.phase === 'title' || S.phase === 'over')) { sfx.unlock(); S.start(); } e.preventDefault(); } });
  addEventListener('keyup', e => { if (e.key === ' ') down(false); });

  ['normal', 'scared', 'blink', 'screech'].forEach(e => PXA.monkeySets.vs.angles.forEach(a => [0, 1].forEach(p => PXA.monkeyFrame('vs', e, a * Math.PI / 180, false, p, 0))));
  newGame(); S.title();
  if (params.get('autostart')) { S.start(); botOn = !!params.get('bot'); for (let i = 0, n = (+params.get('warp') || 0) * 60; i < n; i++) update(1 / 60); }
  if (params.get('dbg')) setInterval(() => { document.title = `d=${Math.round(G.dist)} b=${G.bananas} grabs=${G.grabs} dead=${G.dead > 0 || S.phase === 'over'}`; }, 200);
  MG.loop(update, draw);
  window.VS = { get G() { return G; }, S, m };
})();
