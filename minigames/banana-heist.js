/* ============================================================
   BANANA HEIST: sneak up to the banana stall, grab the loot, and slip back out, past the keepers' sweeping flashlights.
   Hold to creep forward (and steer toward your finger / ← →); let go and the monkey freezes. Moving in the light fills the alert bar,
   standing still in it fills it slowly, and a crate between you and the keeper blocks the beam completely. Three hearts.
   Rare: a Golden bunch pays x3, the Diamond bunch x10. Sneak the whole way (barely any alert) for a GHOST bonus.
   Standalone: no connection to the main game's save yet.
   ============================================================ */
(() => {
  'use strict';
  const { rng, clamp, lerp, sfx } = MG;
  const W = 120, H = 208, STALL_Y = 34, HOME_Y = 178, RANGE = 74, HALF = .27;
  const params = new URLSearchParams(location.search), RARE = +params.get('rare') || 0;

  MG.boot();
  const A = MGArt.build(), { R, make, shapes: { ell, box, poly, or } } = MGArt;
  const host = document.getElementById('stage'), st = MG.stage(host, W, H, { padY: 40 }), g = st.g;
  host.style.cursor = 'pointer';
  const ui = MG.ui(host, st, A.banana), fx = MG.fx();

  const keeperOf = body => make(11, 11, px => { px.shape(ell(5.5, 8.4, 5, 2.8), body, 1); px.shape(ell(5.5, 5, 3.2, 3.2), R.skin, 2); px.shape(or(ell(5.5, 3.2, 3.8, 1.8), box(2, 3, 7, 1.2)), R.leafD, 3); });
  const KSPR = { sweeper: keeperOf(R.leaf), post: keeperOf(R.red), patrol: keeperOf(R.grape) }, keeperSpr = KSPR.sweeper;
  const sackSpr = make(10, 10, px => { px.shape(or(ell(5, 6, 4.5, 3.8), poly([[3, 3], [7, 3], [6, 0.5], [4, 0.5]])), R.paper, 1); px.tone(4, 5, 2, 1); });
  const bunch = { normal: A.banana, golden: A.golden, diamond: A.diamond };

  /* ---------- state ---------- */
  let G = null, botOn = false, hold = false, tx = W / 2, keyX = 0;
  const m = { x: W / 2, y: HOME_Y, vx: 0, ph: 0, phT: 0, move: false, loot: null, face: 0, hide: 0 };

  function newGame() {
    G = { round: 0, score: 0, hearts: 3, combo: 0, bestCombo: 0, t: 0, alert: 0, maxAlert: 0, covers: [], keepers: [], stand: 'normal', loot: 0, shake: 0, caught: 0, heists: 0, ghosts: 0, goldens: 0, diamonds: 0, grab: 0, dead: 0, stun: 0, hurry: 0, over: false, roundT: 0, freezeT: 0, exposed: false, prints: [], spotted: 0 };
    nextRound(); fx.clear(); render();
  }
  const mult = () => ui.mult(G.combo);
  function render(anim) { ui.setScore(G.score); ui.setHearts(G.hearts, anim); ui.setCombo(G.combo, mult()); }

  function nextRound() {
    G.round++; const r = G.round; G.covers = []; G.keepers = []; G.alert = 0; G.maxAlert = 0; G.roundT = 0;
    m.x = tx = W / 2; m.y = HOME_Y; m.loot = null; m.vx = 0; hold = hold && false;
    G.stand = r > 2 && Math.random() < .03 + RARE * .6 ? 'diamond' : r > 1 && Math.random() < .12 + RARE * .6 ? 'golden' : 'normal';
    G.loot = G.stand === 'diamond' ? 1000 : G.stand === 'golden' ? 300 : 100 + Math.min(100, r * 10);
    const n = 3 + Math.min(3, Math.floor(r / 2));
    for (let i = 0; i < n * 3 && G.covers.length < n; i++) {
      const w = rng(12, 22), h = rng(9, 14), x = rng(8, W - 8 - w), y = rng(66, 150);
      if (G.covers.some(c => Math.abs(c.x + c.w / 2 - x - w / 2) < (c.w + w) / 2 + 8 && Math.abs(c.y + c.h / 2 - y - h / 2) < (c.h + h) / 2 + 12)) continue;
      G.covers.push({ x, y, w, h });
    }
    /* the crew: sweepers from round 1, then watchtower guards who see the whole yard, then patrols who walk their beat */
    const crew = ['sweeper'];
    if (r >= 2) crew.push('post'); if (r >= 3) crew.push('patrol'); if (r >= 5) crew.push('patrol'); if (r >= 6) crew.push('sweeper'); if (r >= 7) crew.push('post'); if (r >= 9) crew.push('patrol');
    const spots = [[6, 80], [W - 6, 110], [6, 140], [W - 6, 60]]; let si = 0;
    crew.slice(0, 6).forEach((type, i) => {
      if (type === 'sweeper') { const [kx, ky] = spots[si++ % 4], left = kx < W / 2; G.keepers.push({ type, x: kx, y: ky + rng(-8, 8), range: RANGE, half: HALF, base: left ? -.35 : Math.PI + .35, amp: rng(.55, .9), spd: (.55 + r * .05) * rng(.85, 1.2) * (i % 2 ? -1 : 1), ph: rng(6.28), a: 0 }); }
      else if (type === 'post') { const kx = Math.random() < .5 ? 5 : W - 5, ky = rng(86, 170); G.keepers.push({ type, x: kx, y: ky, range: 320, half: .42, base: Math.atan2(100 - ky, W / 2 - kx), amp: 1, spd: 0, ph: rng(6.28), a: 0 }); }
      else {
        const vert = Math.random() < .35; let lane = 0;
        for (let t = 0; t < 12; t++) { lane = vert ? rng(14, W - 14) : rng(62, 166); if (!G.covers.some(c => vert ? lane > c.x - 8 && lane < c.x + c.w + 8 : lane > c.y - 8 && lane < c.y + c.h + 8)) break; }
        G.keepers.push({ type, vert, x: vert ? lane : rng(10, 30), y: vert ? rng(66, 90) : lane, x0: vert ? lane : 8, x1: vert ? lane : W - 8, y0: 62, y1: 168, dir: Math.random() < .5 ? 1 : -1, pause: 0, range: 66, half: .33, spd: 20 + r * 1.6, ph: rng(6.28), a: 0 });
      }
    });
    ui.say(`HEIST ${r}<small>${G.stand === 'diamond' ? 'DIAMOND BUNCH · x10' : G.stand === 'golden' ? 'golden bunch · x3' : 'grab the bananas'}</small>`, G.stand === 'diamond' ? 'ice' : '');
    if (G.stand !== 'normal') sfx.golden();
  }

  /* ---------- visibility ---------- */
  function segRect(x0, y0, x1, y1, c) {
    let t0 = 0, t1 = 1; const dx = x1 - x0, dy = y1 - y0;
    for (const [p, q] of [[-dx, x0 - c.x], [dx, c.x + c.w - x0], [-dy, y0 - c.y], [dy, c.y + c.h - y0]]) { if (p === 0) { if (q < 0) return false; } else { const r = q / p; if (p < 0) { if (r > t1) return false; if (r > t0) t0 = r; } else { if (r < t0) return false; if (r < t1) t1 = r; } } }
    return true;
  }
  const blocked = (kx, ky, px, py) => G.covers.some(c => segRect(kx, ky, px, py, c));
  function inCone(k, px, py) {
    const dx = px - k.x, dy = py - k.y, d = Math.hypot(dx, dy); if (d > k.range || d < 1) return false;
    let da = Math.atan2(dy, dx) - k.a; da = Math.atan2(Math.sin(da), Math.cos(da)); return Math.abs(da) < k.half;
  }
  const lit = (k, px, py) => inCone(k, px, py) && !blocked(k.x, k.y, px, py);

  /* ---------- update ---------- */
  function update(rdt) {
    fx.update(rdt);
    if (!G || !S.playing) return;
    const dt = rdt; G.t += dt; G.roundT += dt; G.shake = Math.max(0, G.shake - rdt * 18); if (G.stun > 0) G.stun -= dt; if (G.hurry > 0) G.hurry -= dt;
    if (G.dead > 0) { G.dead -= dt; if (G.dead <= 0) { G.over = true; S.finish([['HEISTS', G.heists], ['GHOST RUNS', G.ghosts], ['BEST CHAIN', G.bestCombo], ['TIMES CAUGHT', G.caught], ['GOLD / DIAMOND', `${G.goldens} / ${G.diamonds}`]]); } return; }
    const k = G.hurry > 0 ? 1.7 : 1;
    for (const kp of G.keepers) {
      if (kp.type === 'sweeper') kp.a = kp.base + Math.sin(G.t * kp.spd * k + kp.ph) * kp.amp;
      else if (kp.type === 'post') kp.a = kp.base + Math.sin(G.t * .5 * k + kp.ph) * .2;
      else {
        const fwd = kp.vert ? (kp.dir > 0 ? Math.PI / 2 : -Math.PI / 2) : (kp.dir > 0 ? 0 : Math.PI);
        if (kp.pause > 0) { kp.pause -= dt * k; kp.a = fwd + Math.sin(G.t * 3 + kp.ph) * .8; }
        else {
          if (kp.vert) { kp.y += kp.dir * kp.spd * k * dt; if (kp.y > kp.y1) { kp.y = kp.y1; kp.dir = -1; kp.pause = 1.1; } if (kp.y < kp.y0) { kp.y = kp.y0; kp.dir = 1; kp.pause = 1.1; } }
          else { kp.x += kp.dir * kp.spd * k * dt; if (kp.x > kp.x1) { kp.x = kp.x1; kp.dir = -1; kp.pause = 1.1; } if (kp.x < kp.x0) { kp.x = kp.x0; kp.dir = 1; kp.pause = 1.1; } }
          kp.a = fwd + Math.sin(G.t * 2 + kp.ph) * .2;
        }
      }
    }
    /* the monkey creeps while you hold */
    const want = botOn ? botHold() : hold || keyHold;
    m.move = false;
    if (G.grab > 0) { G.grab -= dt; if (G.grab <= 0) { m.loot = G.stand; sfx.golden(); fx.burst(m.x, STALL_Y + 8, ['#ffd23a', '#fff08c'], 12, 60, 80, .6); ui.floatText(m.x, STALL_Y + 18, 'GOT IT! RUN!', 'gold'); G.hurry = 1.2; } }
    else if (want && G.stun <= 0) {
      const dir = m.loot ? 1 : -1, sp = m.loot ? 30 : 36, lx = botOn ? botX() : keyX ? m.x + keyX * 30 : tx;
      m.vx = clamp((lx - m.x) * 5, -34, 34); let nx = m.x + m.vx * dt, ny = m.y + dir * sp * dt;
      nx = clamp(nx, 6, W - 6); ny = clamp(ny, STALL_Y, HOME_Y);
      const hit = (x, y) => G.covers.some(c => x > c.x - 4 && x < c.x + c.w + 4 && y > c.y - 3 && y < c.y + c.h + 5);
      if (!hit(nx, m.y)) m.x = nx; if (!hit(m.x, ny)) m.y = ny; else if (!hit(nx, m.y) === false) { /* wedged: slide sideways around the crate */ m.x += (m.x < W / 2 ? -1 : 1) * 12 * dt; }
      m.move = true; m.phT -= dt; if (m.phT <= 0) { m.ph ^= 1; m.phT = .2; G.prints.push({ x: m.x + (m.ph ? -2 : 2), y: m.y + 5, t: 0 }); if (m.loot && G.stand !== 'normal') fx.spark(m.x, m.y - 14, G.stand === 'diamond' ? '#9be8ff' : '#fff08c'); }
      if (!m.loot && m.y <= STALL_Y + 1) { G.grab = .7; m.y = STALL_Y; }
      if (m.loot && m.y >= HOME_Y - 1) heistDone();
    } else m.vx = 0;
    /* detection */
    let exposed = false, rate = 0;
    for (const kp of G.keepers) if (lit(kp, m.x, m.y - 3)) { exposed = true; rate = Math.max(rate, m.move ? 1 : .22); }
    if (exposed && !G.exposed && m.move) { G.spotted = .5; sfx.tone(780, 1040, .12, 'square', .05); G.shake = Math.max(G.shake, 1.5); }
    if (G.spotted > 0) G.spotted -= dt;
    for (let i = G.prints.length - 1; i >= 0; i--) { G.prints[i].t += dt; if (G.prints[i].t > 1.8) G.prints.splice(i, 1); }
    G.exposed = exposed; m.hide = !exposed && G.keepers.some(kp => inCone(kp, m.x, m.y - 3) && blocked(kp.x, kp.y, m.x, m.y - 3)) ? 1 : 0;
    if (exposed) { G.alert += rate * dt / 1.05; G.maxAlert = Math.max(G.maxAlert, G.alert); if (rate > .9 && Math.floor(G.t * 8) % 2 === 0) sfx.tick(); } else G.alert = Math.max(0, G.alert - dt * .55);
    if (G.alert >= 1) caught();
    if (botOn) m.vx = m.vx;
  }
  let keyHold = false;
  function caught() {
    MG.hitstop(.1); fx.shock(m.x, m.y, '#ff7a6a', 34); G.alert = 0; G.hearts--; G.caught++; G.combo = 0; G.shake = 6; sfx.bonk(); sfx.miss(); ui.doFlash('#c0392b'); ui.floatText(m.x, m.y - 12, 'CAUGHT!', 'bad'); fx.burst(m.x, m.y, ['#ffd23a', '#fff6d6', '#c0392b'], 14, 70, 100, .6);
    m.x = tx = W / 2; m.y = HOME_Y; m.loot = null; G.stun = .8; G.hurry = 2.2; render(true);
    if (G.hearts <= 0) { G.dead = 1.1; sfx.over(); }
  }
  function heistDone() {
    const ghost = G.maxAlert < .3, k = G.stand === 'diamond' ? 10 : G.stand === 'golden' ? 3 : 1; G.combo++; G.bestCombo = Math.max(G.bestCombo, G.combo); G.heists++;
    const quick = Math.max(0, 1 - G.roundT / 40), pts = Math.round(G.loot * (1 + quick * .5) * (ghost ? 2 : 1) * mult() / (k === 1 ? 1 : 1));
    G.score += pts; ui.bump(); fx.confetti(m.x, HOME_Y - 6, ghost ? 36 : 20); if (G.stand !== 'normal') MG.hitstop(.08); sfx.letters(); sfx.ding(Math.min(10, G.combo * 2)); fx.burst(m.x, HOME_Y, ['#ffd23a', '#fff08c', '#74c648'], 18, 80, 90, .8);
    ui.floatText(m.x, HOME_Y - 20, '+' + pts, 'gold big'); if (ghost) { G.ghosts++; ui.floatText(m.x, HOME_Y - 34, 'GHOST x2', 'ice'); sfx.golden(); }
    if (G.stand === 'golden') { G.goldens++; sfx.golden(); } if (G.stand === 'diamond') { G.diamonds++; sfx.diamond(); ui.doFlash('#e8fbff'); fx.ring(m.x, HOME_Y, '#9be8ff', 60); }
    if (G.combo > 1) ui.pulseCombo(); if (G.hearts < 3 && G.combo % 4 === 0) { G.hearts++; ui.floatText(W / 2, 90, '+HEART', 'gold'); }
    render(); nextRound();
  }
  /* dev autoplayer: creep when the way is clear, freeze when a beam is about to cross */
  function botHold() {
    const dir = m.loot ? 1 : -1, ny = m.y + dir * 14;
    for (const kp of G.keepers) {
      const angles = kp.type === 'sweeper' ? [kp.a, kp.base + Math.sin((G.t + .5) * kp.spd + kp.ph) * kp.amp] : [kp.a];
      for (const pt of [[m.x, m.y - 3], [m.x + m.vx * .3, ny - 3]]) for (const aa of angles) if (lit({ x: kp.x, y: kp.y, a: aa, range: kp.range, half: kp.half }, pt[0], pt[1])) return false;
    }
    return true;
  }
  function botX() { const tgt = m.loot ? W / 2 : W / 2; for (const c of G.covers) if (Math.abs(c.x + c.w / 2 - m.x) < c.w / 2 + 6 && Math.abs(c.y - m.y) < 22) return m.x + (m.x < c.x + c.w / 2 ? -20 : 20); return tgt; }

  /* ---------- draw ---------- */
  function draw() {
    g.clearRect(0, 0, W, H); g.save();
    if (G.shake > .3) g.translate(Math.round(rng(-G.shake, G.shake) * .5), Math.round(rng(-G.shake, G.shake) * .5));
    /* the market floor */
    g.fillStyle = '#26202c'; g.fillRect(0, 0, W, H); g.fillStyle = '#322a3a'; for (let y = 0; y < H; y += 12) for (let x = ((y / 12) % 2) * 8; x < W; x += 16) g.fillRect(x, y, 15, 11);
    g.fillStyle = '#1a1620'; for (let y = 0; y < H; y += 12) g.fillRect(0, y + 11, W, 1);
    /* the stall with its awning */
    g.fillStyle = '#1a0f14'; g.fillRect(14, 8, W - 28, 30); g.fillStyle = '#8a5a2b'; g.fillRect(15, 20, W - 30, 17); g.fillStyle = '#b57d3e'; g.fillRect(15, 20, W - 30, 2); g.fillStyle = '#5a3517'; g.fillRect(15, 35, W - 30, 2);
    for (let i = 0; i < 12; i++) { g.fillStyle = i % 2 ? '#e8e8f0' : '#d8403a'; g.fillRect(15 + i * 7.5, 9, 7.5, 11); } g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(15, 19, W - 30, 2);
    if (!(m.loot || G.grab > 0.3)) { const sp = bunch[G.stand]; for (const dx of [-14, 0, 14]) g.drawImage(sp, Math.round(W / 2 + dx - sp.width / 2), 22 + (dx === 0 ? -2 : 0)); if (G.stand !== 'normal' && Math.floor(G.t * 10) % 2 === 0) fx.spark(W / 2, 26, G.stand === 'diamond' ? '#9be8ff' : '#fff08c'); }
    /* home: the hideout */
    g.fillStyle = '#17481f'; g.fillRect(0, HOME_Y + 8, W, H - HOME_Y - 8); g.fillStyle = '#2f8a35'; for (let x = 0; x < W; x += 6) g.fillRect(x, HOME_Y + 8 + (x % 12 ? 1 : 0), 5, 4); g.fillStyle = '#74c648'; for (let x = 2; x < W; x += 9) g.fillRect(x, HOME_Y + 9, 2, 1);
    /* the keepers' flashlight beams, blocked by crates (drawn in chunky 2px blocks) */
    for (const kp of G.keepers) {
      const x0 = Math.max(0, Math.floor(kp.x - kp.range)), y0 = Math.max(0, Math.floor(kp.y - kp.range)), x1 = Math.min(W, kp.x + kp.range), y1 = Math.min(H, kp.y + kp.range), fade = Math.min(kp.range, 90), tint = kp.type === 'post' ? '255,170,150' : kp.type === 'patrol' ? '200,170,255' : '255,240,150';
      for (let y = y0 - (y0 & 1); y < y1; y += 2) for (let x = x0 - (x0 & 1); x < x1; x += 2) {
        const dx = x - kp.x, dy = y - kp.y, d = Math.hypot(dx, dy); if (d > kp.range || d < 3) continue; let da = Math.atan2(dy, dx) - kp.a; da = Math.atan2(Math.sin(da), Math.cos(da)); if (Math.abs(da) > kp.half) continue;
        if (blocked(kp.x, kp.y, x, y)) continue; g.fillStyle = `rgba(${tint},${((.3 * (1 - Math.min(1, d / fade)) + .07) * (G.alert > .5 && Math.floor(G.t * 22) % 2 ? .6 : 1)).toFixed(2)})`; g.fillRect(x, y, 2, 2);
      }
    }
    /* crates */
    for (const c of G.covers) { g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(c.x + 2, c.y + c.h, c.w, 3); g.fillStyle = '#1a0f14'; g.fillRect(c.x - 1, c.y - 1, c.w + 2, c.h + 2); g.fillStyle = '#b57d3e'; g.fillRect(c.x, c.y, c.w, c.h); g.fillStyle = '#e8b878'; g.fillRect(c.x, c.y, c.w, 1); g.fillStyle = '#7a4a1e'; g.fillRect(c.x, c.y + c.h - 2, c.w, 2); for (let x = c.x + 5; x < c.x + c.w - 3; x += 6) g.fillRect(Math.round(x), c.y + 1, 1, c.h - 3); g.fillStyle = '#b8b8c4'; g.fillRect(c.x, c.y, 2, 2); g.fillRect(c.x + c.w - 2, c.y, 2, 2); }
    /* keepers */
    for (const kp of G.keepers) {
      g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(Math.round(kp.x) - 4, Math.round(kp.y) + 4, 9, 2);
      g.drawImage(KSPR[kp.type], Math.round(kp.x - 5.5), Math.round(kp.y - 5.5));
      g.fillStyle = '#ffd23a'; g.fillRect(Math.round(kp.x + Math.cos(kp.a) * 6), Math.round(kp.y + Math.sin(kp.a) * 6), 2, 2);
      if (kp.type === 'post') { g.fillStyle = '#1a0f14'; g.fillRect(Math.round(kp.x) - 3, Math.round(kp.y) - 8, 7, 2); g.fillStyle = '#9ce0ff'; g.fillRect(Math.round(kp.x) - 2, Math.round(kp.y) - 8, 2, 1); g.fillRect(Math.round(kp.x) + 1, Math.round(kp.y) - 8, 2, 1); }
      if (G.exposed && Math.floor(G.t * 6) % 2) { g.fillStyle = '#e83a3a'; g.fillRect(Math.round(kp.x) - 1, Math.round(kp.y) - 12, 2, 4); g.fillRect(Math.round(kp.x) - 1, Math.round(kp.y) - 7, 2, 1); }
    }
    for (const pr of G.prints) { g.globalAlpha = (1 - pr.t / 1.8) * .35; g.fillStyle = '#0a0a12'; g.fillRect(Math.round(pr.x), Math.round(pr.y), 2, 1); g.fillRect(Math.round(pr.x) + 3, Math.round(pr.y) - 1, 1, 1); } g.globalAlpha = 1;
    /* the monkey, with the sack when carrying */
    if (!(G.stun > 0 && Math.floor(G.t * 20) % 2)) {
      const sp = A.monkeyS[m.move && m.ph ? 1 : 0], hid = m.hide && !m.move, bob = G.grab > 0 ? Math.round(Math.sin(G.t * 30)) : 0;
      g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(Math.round(m.x - 4), Math.round(m.y + 5), 9, 2);
      if (hid) g.globalAlpha = .6;
      g.save(); g.translate(Math.round(m.x), 0); g.drawImage(sp, -6, Math.round(m.y - 11 + bob)); if (m.loot) { const b = bunch[m.loot]; g.drawImage(b, -b.width / 2 | 0, Math.round(m.y - 24)); } g.restore(); g.globalAlpha = 1;
      if (G.spotted > 0) { const jy = -Math.round(Math.abs(Math.sin(G.spotted * 18)) * 4); g.fillStyle = '#1a0f14'; g.fillRect(Math.round(m.x) - 2, Math.round(m.y) - 40 + jy, 5, 9); g.fillStyle = '#e83a3a'; g.fillRect(Math.round(m.x) - 1, Math.round(m.y) - 39 + jy, 3, 5); g.fillRect(Math.round(m.x) - 1, Math.round(m.y) - 33 + jy, 3, 2); }
      if (G.alert > .02) { g.fillStyle = '#1a0f14'; g.fillRect(Math.round(m.x) - 8, Math.round(m.y) - 31, 17, 4); g.fillStyle = G.alert > .66 ? '#e83a3a' : G.alert > .33 ? '#ffd23a' : '#9be8ff'; g.fillRect(Math.round(m.x) - 7, Math.round(m.y) - 30, Math.round(15 * clamp(G.alert, 0, 1)), 2); }
    }
    if (G.alert > .35) { g.fillStyle = `rgba(200,40,30,${((G.alert - .3) * .35).toFixed(2)})`; g.fillRect(0, 0, W, H); }
    fx.draw(g); g.restore();
  }

  /* ---------- shell + input ---------- */
  const S = MG.shell({
    host, ui, id: 'heist', title: 'BANANA<span>HEIST</span>', sub: 'Creep in. Grab the bunch. Slip out.',
    legend: [[A.monkeyS[0], '<em>hold</em> to creep · release = freeze'], [KSPR.sweeper, '<em class="bad">sweeper</em> swings its beam'], [KSPR.post, '<em class="bad">watchman</em> sees the whole yard'], [KSPR.patrol, '<em class="bad">patrol</em> walks a beat'], [sackSpr, '<em>crates</em> block the beam'], [sackSpr, '<em>crates</em> block every beam'], [A.diamond, '<em class="ice">x10</em> diamond bunch']],
    hint: 'hold mouse / finger / Space / ↑ · steer to your finger or ← →', spaceStarts: false, onStart: () => newGame(), score: () => G.score,
  });
  const dn = (ev, on) => { hold = on; if (on) { tx = clamp(st.toArt(ev)[0], 6, W - 6); sfx.unlock(); } };
  addEventListener('pointerdown', ev => { if (ev.target.closest('.mg-over,.mg-nav')) return; dn(ev, true); });
  addEventListener('pointermove', ev => { if (hold) tx = clamp(st.toArt(ev)[0], 6, W - 6); });
  addEventListener('pointerup', () => { hold = false; }); addEventListener('pointercancel', () => { hold = false; });
  addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    if (k === ' ' || k === 'arrowup' || k === 'w') { if (S.playing) keyHold = true; else if (k === ' ' && !e.repeat && (S.phase === 'title' || S.phase === 'over')) { sfx.unlock(); S.start(); } e.preventDefault(); }
    else if (k === 'arrowleft' || k === 'a') { keyX = -1; e.preventDefault(); } else if (k === 'arrowright' || k === 'd') { keyX = 1; e.preventDefault(); }
  });
  addEventListener('keyup', e => { const k = e.key.toLowerCase(); if (k === ' ' || k === 'arrowup' || k === 'w') keyHold = false; if (['arrowleft', 'a', 'arrowright', 'd'].includes(k)) keyX = 0; });
  addEventListener('blur', () => { hold = false; keyHold = false; });

  newGame(); S.title();
  if (params.get('autostart')) { S.start(); botOn = !!params.get('bot'); if (params.get('round')) { G.round = +params.get('round') - 1; nextRound(); } for (let i = 0, n = (+params.get('warp') || 0) * 60; i < n; i++) update(1 / 60); }
  if (params.get('dbg')) setInterval(() => { document.title = `round=${G.round} heists=${G.heists} hearts=${G.hearts} score=${G.score} caught=${G.caught}`; }, 200);
  MG.loop(update, draw);
  window.BH = { get G() { return G; }, S, m };
})();
