/* ============================================================
   BANANA HEIST: sneak up to the banana stall, grab the loot, and slip back out, past the keepers' sweeping flashlights.
   WASD / arrows move the monkey in any direction (or hold the pointer to walk toward it); stop and it freezes. Moving in the light fills the alert bar,
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
  const ui = MG.ui(host, st, MGArt3.build().banana), fx = MG.fx();

  /* ---------- hi-res art: the crew's own costumes guard the stall, the player is the crew monkey ---------- */
  const A3 = MGArt3.build(), { cvs } = MGArt3, perk = MGCrew.perk('heist'), SPEED = perk && perk.speed || 1, CARRY = perk && perk.carry || 1, STEALTH = perk && perk.stealth || 1;
  const rect = (x, c, a, b, w, h) => { x.fillStyle = c; x.fillRect(a, b, w, h); };
  const seeded = s => () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  /* guards are other crew members: a miner with a headlamp sweeps, an inspector watches the yard, a cowboy walks the beat */
  const GUARD_LOOK = { sweeper: 'v09', post: 'v13', patrol: 'v30' };
  const guardLook = type => { const want = GUARD_LOOK[type], me = MGCrew.look(); return want !== me ? want : 'v12'; };
  const guardFrame = (type, o) => MGCrew.frame('idle', Object.assign({ look: guardLook(type), expr: 'determined' }, o));
  const bunch = { normal: A3.bananaS, golden: A3.goldenS, diamond: A3.diamondS };
  const crateSpr = (w, h) => cvs(Math.round(w * 3), Math.round(h * 3), (x, cw, ch) => {
    rect(x, '#1a0f14', 0, 0, cw, ch); rect(x, '#b57d3e', 1, 1, cw - 2, ch - 2); rect(x, '#e8b878', 1, 1, cw - 2, 2); rect(x, '#d09a58', 1, 3, cw - 2, 1);
    for (let y = Math.round(ch / 3); y < ch - 3; y += Math.round(ch / 3)) { rect(x, '#7a4a1e', 1, y, cw - 2, 1); rect(x, '#e8b878', 1, y + 1, cw - 2, 1); }
    rect(x, '#7a4a1e', 1, ch - 4, cw - 2, 3); rect(x, '#5a3517', 1, ch - 2, cw - 2, 1);
    for (let px = 9; px < cw - 6; px += 12) { rect(x, '#8a5a2b', px, 4, 1, ch - 9); rect(x, '#d09a58', px + 1, 4, 1, ch - 9); }
    for (let i = 0; i < ch - 8; i++) { const bx = 5 + Math.round(i * (cw - 14) / (ch - 8)); rect(x, '#7a4a1e', bx, 4 + i, 2, 1); }
    [[2, 2], [cw - 5, 2], [2, ch - 6], [cw - 5, ch - 6]].forEach(([a, b]) => { rect(x, '#b8b8c4', a, b, 3, 3); rect(x, '#f0f0f8', a, b, 1, 1); rect(x, '#5a5a66', a + 2, b + 2, 1, 1); });
  });
  /* the static scenery is baked once at 3x: stone floor, the stall with its scalloped awning, the hideout's grass */
  const sceneFloor = cvs(W * 3, H * 3, x => {
    const r = seeded(77); rect(x, '#1a1620', 0, 0, W * 3, H * 3);
    for (let ty = 0; ty < H * 3; ty += 36) for (let tx = ((ty / 36) % 2) * 24 - 24; tx < W * 3; tx += 48) {
      const sh = Math.floor(r() * 3), base = ['#322a3a', '#2e2736', '#372e40'][sh]; rect(x, base, tx + 1, ty + 1, 46, 34); rect(x, '#3e3548', tx + 1, ty + 1, 46, 1); rect(x, '#3a3144', tx + 1, ty + 2, 1, 33); rect(x, '#241d2c', tx + 2, ty + 34, 45, 1);
      for (let i = 0; i < 7; i++) rect(x, r() < .5 ? '#2a2332' : '#3c3346', tx + 3 + Math.floor(r() * 41), ty + 3 + Math.floor(r() * 29), 1 + Math.floor(r() * 2), 1);
      if (r() < .12) { const cx = tx + 6 + Math.floor(r() * 30), cy = ty + 6 + Math.floor(r() * 20); rect(x, '#1e1826', cx, cy, 4, 1); rect(x, '#1e1826', cx + 4, cy + 1, 3, 1); rect(x, '#1e1826', cx + 7, cy + 2, 4, 1); }
    }
  });
  const sceneStall = cvs(W * 3, 40 * 3, x => {
    const SW = W * 3, X0 = 14 * 3, X1 = (W - 14) * 3;
    rect(x, '#1a0f14', X0 - 3, 24, X1 - X0 + 6, 96); rect(x, '#8a5a2b', X0, 54, X1 - X0, 62); rect(x, '#b57d3e', X0, 54, X1 - X0, 5); rect(x, '#d09a58', X0, 54, X1 - X0, 1); rect(x, '#5a3517', X0, 108, X1 - X0, 8);
    for (let px = X0 + 10; px < X1 - 4; px += 20) { rect(x, '#5a3517', px, 60, 1, 46); rect(x, '#a8723a', px + 1, 60, 1, 46); }
    for (let py = 74; py < 106; py += 15) rect(x, '#6e4620', X0, py, X1 - X0, 1);
    rect(x, '#3a2210', X0, 56, X1 - X0, 3);                                                              // the counter's shadow line under the bananas
    const aw = (X1 - X0) / 12;                                                                            // awning stripes with a scalloped hem
    for (let i = 0; i < 12; i++) { const cx = X0 + i * aw; rect(x, '#1a0f14', cx, 25, aw + 1, 37); rect(x, i % 2 ? '#f0f0f8' : '#d8403a', cx + (i ? 0 : 1), 26, aw - (i ? 0 : 1), 35); rect(x, i % 2 ? '#fff' : '#e86a50', cx, 26, aw, 3); rect(x, i % 2 ? '#c4c4d4' : '#a02c26', cx, 54, aw, 4);
      for (let j = 0; j < aw / 2; j++) { const hh = Math.round(Math.sqrt(Math.max(0, (aw / 2) * (aw / 2) - (j - aw / 4) * (j - aw / 4) * 4)) / 2.6); rect(x, '#1a0f14', cx + j * 2, 61, 2, hh + 2); rect(x, i % 2 ? '#f0f0f8' : '#d8403a', cx + j * 2, 61, 2, hh); } }
    rect(x, '#1a0f14', X0 - 3, 23, 3, 40); rect(x, '#1a0f14', X1, 23, 3, 40); rect(x, '#5a3517', X0 - 3, 62, 3, 60); rect(x, '#5a3517', X1, 62, 3, 60);
  });
  const sceneHome = cvs(W * 3, 40 * 3, x => {
    const r = seeded(31); rect(x, '#17481f', 0, 0, W * 3, 120); rect(x, '#1f6a2a', 0, 0, W * 3, 6); rect(x, '#2f8a35', 0, 0, W * 3, 3);
    for (let i = 0; i < 170; i++) rect(x, ['#1f6a2a', '#2f8a35', '#0f3318', '#3f9a3a'][i % 4], Math.floor(r() * W * 3), 6 + Math.floor(r() * 100), 1, 2 + Math.floor(r() * 3));
    for (let i = 0; i < 34; i++) { const bx = i * 11 + Math.floor(r() * 6); [['#0f3318', 7], ['#2f8a35', 5]].forEach(([c, rad], k) => { x.fillStyle = c; for (let j = -rad; j <= rad; j++) { const w = Math.round(Math.sqrt(rad * rad - j * j) * 1.2); x.fillRect(bx - w, 4 + j + (k ? -1 : 0) + 4, w * 2, 1); } }); }
    for (let i = 0; i < 24; i++) rect(x, '#74c648', Math.floor(r() * W * 3), 4 + Math.floor(r() * 12), 2, 1);
  });

  /* ---------- state ---------- */
  let G = null, botOn = false, hold = false, tx = W / 2, ty = HOME_Y, keys = { l: 0, r: 0, u: 0, d: 0, go: 0 }, vy = 0;
  const m = { x: W / 2, y: HOME_Y, vx: 0, ph: 0, phT: 0, move: false, loot: null, face: 0, hide: 0 };

  function newGame() {
    G = { round: 0, score: 0, hearts: 3, combo: 0, bestCombo: 0, t: 0, alert: 0, maxAlert: 0, covers: [], keepers: [], stand: 'normal', loot: 0, shake: 0, caught: 0, heists: 0, ghosts: 0, goldens: 0, diamonds: 0, grab: 0, dead: 0, stun: 0, hurry: 0, over: false, roundT: 0, freezeT: 0, exposed: false, prints: [], spotted: 0 };
    nextRound(); fx.clear(); render();
  }
  const mult = () => ui.mult(G.combo);
  function render(anim) { ui.setScore(G.score); ui.setHearts(G.hearts, anim); ui.setCombo(G.combo, mult()); }

  function nextRound() {
    G.round++; const r = G.round; G.covers = []; G.keepers = []; G.alert = 0; G.maxAlert = 0; G.roundT = 0;
    m.x = tx = W / 2; m.y = ty = HOME_Y; m.loot = null; m.vx = vy = 0; hold = false;
    G.stand = r > 2 && Math.random() < .03 + RARE * .6 ? 'diamond' : r > 1 && Math.random() < .12 + RARE * .6 ? 'golden' : 'normal';
    G.loot = G.stand === 'diamond' ? 1000 : G.stand === 'golden' ? 300 : 100 + Math.min(100, r * 10);
    const n = 3 + Math.min(3, Math.floor(r / 2));
    for (let i = 0; i < n * 3 && G.covers.length < n; i++) {
      const w = rng(12, 22), h = rng(9, 14), x = rng(8, W - 8 - w), y = rng(66, 150);
      if (G.covers.some(c => Math.abs(c.x + c.w / 2 - x - w / 2) < (c.w + w) / 2 + 8 && Math.abs(c.y + c.h / 2 - y - h / 2) < (c.h + h) / 2 + 12)) continue;
      G.covers.push({ x, y, w, h, spr: crateSpr(w, h) });
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
    let da = Math.atan2(dy, dx) - k.a; da = Math.atan2(Math.sin(da), Math.cos(da)); return Math.abs(da) < k.half * STEALTH;
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
    /* free movement: WASD / arrows in any direction, or hold the pointer to walk toward it; Space heads for the goal. Smooth ramp up and down. */
    m.move = false;
    if (G.grab > 0) { G.grab -= dt; m.vx = vy = 0; if (G.grab <= 0) { m.loot = G.stand; sfx.golden(); fx.burst(m.x, STALL_Y + 8, ['#ffd23a', '#fff08c'], 12, 60, 80, .6); ui.floatText(m.x, STALL_Y + 18, 'GOT IT! RUN!', 'gold'); G.hurry = 1.2; } }
    else {
      const dir = m.loot ? 1 : -1, sp = m.loot ? 33 * CARRY : 38 * SPEED; let ix = 0, iy = 0;
      if (G.stun > 0) { /* frozen */ }
      else if (botOn) { if (botHold()) { ix = clamp((botX() - m.x) * 5, -34, 34) / 34; iy = dir; } }
      else {
        ix = keys.r - keys.l; iy = keys.d - keys.u + (keys.go ? dir : 0);
        if (hold) { const dx = tx - m.x, dy = ty - m.y, d = Math.hypot(dx, dy); if (d > 1.5) { const k = Math.min(1, d / 8); ix += dx / d * k; iy += dy / d * k; } }
        const len = Math.hypot(ix, iy); if (len > 1) { ix /= len; iy /= len; }
      }
      const k = Math.min(1, dt * (ix || iy ? 12 : 18));
      m.vx += (ix * sp - m.vx) * k; vy += (iy * sp - vy) * k;
      const hit = (x, y) => G.covers.some(c => x > c.x - 4 && x < c.x + c.w + 4 && y > c.y - 3 && y < c.y + c.h + 5);
      const nx = clamp(m.x + m.vx * dt, 6, W - 6), ny = clamp(m.y + vy * dt, STALL_Y, HOME_Y);
      if (!hit(nx, m.y)) m.x = nx; else m.vx = 0;
      if (!hit(m.x, ny)) m.y = ny; else { vy = 0; if (!hit(nx, m.y) === false && (ix || iy)) m.x += (m.x < W / 2 ? -1 : 1) * 14 * dt; }
      if (m.vx < -3) m.face = -1; else if (m.vx > 3) m.face = 1;
      const spd = Math.hypot(m.vx, vy);
      if (spd > 5) { m.move = true; m.phT -= dt * spd / 34; if (m.phT <= 0) { m.ph ^= 1; m.phT = .2; G.prints.push({ x: m.x + (m.ph ? -2 : 2), y: m.y + 5, t: 0 }); if (m.loot && G.stand !== 'normal') fx.spark(m.x, m.y - 14, G.stand === 'diamond' ? '#9be8ff' : '#fff08c'); } }
      if (!m.loot && m.y <= STALL_Y + 1) { G.grab = .7; m.y = STALL_Y; m.vx = vy = 0; }
      if (m.loot && m.y >= HOME_Y - 1) heistDone();
    }
    /* detection */
    let exposed = false, rate = 0;
    for (const kp of G.keepers) if (lit(kp, m.x, m.y - 3)) { exposed = true; rate = Math.max(rate, m.move ? 1 : .22); }
    if (exposed && !G.exposed && m.move) { G.spotted = .5; sfx.tone(780, 1040, .12, 'square', .05); G.shake = Math.max(G.shake, 1.5); }
    if (G.spotted > 0) G.spotted -= dt;
    for (let i = G.prints.length - 1; i >= 0; i--) { G.prints[i].t += dt; if (G.prints[i].t > 1.8) G.prints.splice(i, 1); }
    G.exposed = exposed; m.hide = !exposed && G.keepers.some(kp => inCone(kp, m.x, m.y - 3) && blocked(kp.x, kp.y, m.x, m.y - 3)) ? 1 : 0;
    if (exposed) { G.alert += rate * dt / 1.05; G.maxAlert = Math.max(G.maxAlert, G.alert); if (rate > .9 && Math.floor(G.t * 8) % 2 === 0) sfx.tick(); } else G.alert = Math.max(0, G.alert - dt * .55);
    if (G.alert >= 1) caught();
  }
  function caught() {
    MG.hitstop(.1); fx.shock(m.x, m.y, '#ff7a6a', 34); G.alert = 0; G.hearts--; G.caught++; G.combo = 0; G.shake = 6; sfx.bonk(); sfx.miss(); ui.doFlash('#c0392b'); ui.floatText(m.x, m.y - 12, 'CAUGHT!', 'bad'); fx.burst(m.x, m.y, ['#ffd23a', '#fff6d6', '#c0392b'], 14, 70, 100, .6);
    m.x = tx = W / 2; m.y = ty = HOME_Y; m.vx = vy = 0; m.loot = null; G.stun = .8; G.hurry = 2.2; render(true);
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
    /* the market floor, the stall and the hideout (baked at 3x) */
    st.hi(sceneFloor, 0, 0); st.hi(sceneStall, 0, 0);
    if (!(m.loot || G.grab > 0.3)) { const sp = bunch[G.stand]; for (const dx of [-14, 0, 14]) st.hi(sp, W / 2 + dx - sp.width / 6, 20 + (dx === 0 ? -1.7 : 0) + Math.round(Math.sin(G.t * 3 + dx) * 1.5) / 3); if (G.stand !== 'normal' && Math.floor(G.t * 10) % 2 === 0) fx.spark(W / 2, 22, G.stand === 'diamond' ? '#9be8ff' : '#fff08c'); }
    st.hi(sceneHome, 0, HOME_Y + 8);    /* the keepers' flashlight beams, blocked by crates (drawn in chunky 2px blocks) */
    for (const kp of G.keepers) {
      const CELL = 4 / 3, x0 = Math.max(0, Math.floor(kp.x - kp.range)), y0 = Math.max(0, Math.floor(kp.y - kp.range)), x1 = Math.min(W, kp.x + kp.range), y1 = Math.min(H, kp.y + kp.range), fade = Math.min(kp.range, 90), tint = kp.type === 'post' ? '255,170,150' : kp.type === 'patrol' ? '200,170,255' : '255,240,150';
      for (let y = y0; y < y1; y += CELL) for (let x = x0; x < x1; x += CELL) {
        const dx = x - kp.x, dy = y - kp.y, d = Math.hypot(dx, dy); if (d > kp.range || d < 3) continue; let da = Math.atan2(dy, dx) - kp.a; da = Math.atan2(Math.sin(da), Math.cos(da)); if (Math.abs(da) > kp.half * STEALTH) continue;
        if (blocked(kp.x, kp.y, x, y)) continue; g.fillStyle = `rgba(${tint},${((.3 * (1 - Math.min(1, d / fade)) + .07) * (G.alert > .5 && Math.floor(G.t * 22) % 2 ? .6 : 1)).toFixed(2)})`; g.fillRect(x, y, CELL, CELL);
      }
    }
    /* crates */
    for (const c of G.covers) { g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(c.x + 2, c.y + c.h, c.w, 3); st.hi(c.spr, c.x, c.y); }
    /* keepers: other crew costumes, facing wherever their flashlight points */
    for (const kp of G.keepers) {
      const fl = Math.cos(kp.a) < 0, gx = kp.x, gy = kp.y + 6;
      g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(Math.round(kp.x) - 4, Math.round(kp.y) + 4, 9, 2);
      MGCrew.draw(st, 'idle', gx, gy, { look: guardLook(kp.type), flip: fl, expr: 'determined' });
      const lx = kp.x + Math.cos(kp.a) * 8, ly = kp.y + 1 + Math.sin(kp.a) * 5; g.fillStyle = '#fff6d6'; g.fillRect(lx - 1, ly - 1, 2, 2); g.fillStyle = '#ffd23a'; g.fillRect(lx - 2 / 3, ly - 2 / 3, 4 / 3, 4 / 3);
      if (G.exposed && Math.floor(G.t * 6) % 2) { g.fillStyle = '#1a0f14'; g.fillRect(kp.x - 2, kp.y - 21, 4, 9); g.fillStyle = '#e83a3a'; g.fillRect(kp.x - 1, kp.y - 20, 2, 5); g.fillRect(kp.x - 1, kp.y - 13.67, 2, 1.67); }
    }    for (const pr of G.prints) { g.globalAlpha = (1 - pr.t / 1.8) * .35; g.fillStyle = '#0a0a12'; g.fillRect(Math.round(pr.x), Math.round(pr.y), 2, 1); g.fillRect(Math.round(pr.x) + 3, Math.round(pr.y) - 1, 1, 1); } g.globalAlpha = 1;
    /* the monkey, with the bunch held overhead when carrying */
    if (!(G.stun > 0 && Math.floor(G.t * 20) % 2)) {
      const hid = m.hide && !m.move, bob = G.grab > 0 ? Math.sin(G.t * 30) / 2 : 0, step = m.move && m.ph ? 2 : '';
      g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(m.x - 4, m.y + 5, 9, 2);
      if (hid) g.globalAlpha = .6;
      const pose = G.grab > 0 ? 'cheer' : m.loot ? 'carry' + step : G.exposed && !m.move ? 'freeze' : m.move ? 'sneak' + step : 'idle';
      MGCrew.draw(st, pose, m.x, m.y + 7 + bob, { flip: m.face < 0 });
      if (m.loot) { const b = bunch[m.loot]; st.hi(b, m.x - b.width / 6, m.y - 14.5); }
      g.globalAlpha = 1;
      if (G.spotted > 0) { const jy = -Math.round(Math.abs(Math.sin(G.spotted * 18)) * 4); g.fillStyle = '#1a0f14'; g.fillRect(Math.round(m.x) - 2, Math.round(m.y) - 40 + jy, 5, 9); g.fillStyle = '#e83a3a'; g.fillRect(Math.round(m.x) - 1, Math.round(m.y) - 39 + jy, 3, 5); g.fillRect(Math.round(m.x) - 1, Math.round(m.y) - 33 + jy, 3, 2); }
      if (G.alert > .02) { g.fillStyle = '#1a0f14'; g.fillRect(Math.round(m.x) - 8, Math.round(m.y) - 31, 17, 4); g.fillStyle = G.alert > .66 ? '#e83a3a' : G.alert > .33 ? '#ffd23a' : '#9be8ff'; g.fillRect(Math.round(m.x) - 7, Math.round(m.y) - 30, Math.round(15 * clamp(G.alert, 0, 1)), 2); }
    }    if (G.alert > .35) { g.fillStyle = `rgba(200,40,30,${((G.alert - .3) * .35).toFixed(2)})`; g.fillRect(0, 0, W, H); }
    fx.draw(g); g.restore();
  }

  /* ---------- shell + input ---------- */
  const S = MG.shell({
    host, ui, id: 'heist', title: 'BANANA<span>HEIST</span>', sub: 'Creep in. Grab the bunch. Slip out.' + (perk ? '<br><small>' + perk.label + '</small>' : ''),
    legend: [[MGCrew.frame('sneak'), '<em>WASD</em> / arrows to move \u00b7 stop = freeze'], [guardFrame('sweeper'), '<em class="bad">sweeper</em> swings its beam'], [guardFrame('post'), '<em class="bad">watchman</em> sees the whole yard'], [guardFrame('patrol'), '<em class="bad">patrol</em> walks a beat'], [crateSpr(14, 11), '<em>crates</em> block every beam'], [A3.diamond, '<em class="ice">x10</em> diamond bunch']],
    hint:'WASD / arrows to move · or hold the mouse / finger to walk toward it', spaceStarts: false, onStart: () => newGame(), score: () => G.score,
  });
  const aim = ev => { const a = st.toArt(ev); tx = clamp(a[0], 6, W - 6); ty = clamp(a[1] + 6, STALL_Y, HOME_Y); };
  const dn = (ev, on) => { hold = on; if (on) { aim(ev); sfx.unlock(); } };
  addEventListener('pointerdown', ev => { if (ev.target.closest('.mg-over,.mg-nav')) return; dn(ev, true); });
  addEventListener('pointermove', ev => { if (hold) aim(ev); });
  addEventListener('pointerup', () => { hold = false; }); addEventListener('pointercancel', () => { hold = false; });
  const KMAP = { arrowleft: 'l', a: 'l', arrowright: 'r', d: 'r', arrowup: 'u', w: 'u', arrowdown: 'd', s: 'd', ' ': 'go' };
  addEventListener('keydown', e => {
    const k = KMAP[e.key.toLowerCase()]; if (!k) return;
    if (e.key === ' ' && !S.playing) { if (!e.repeat && (S.phase === 'title' || S.phase === 'over')) { sfx.unlock(); S.start(); } e.preventDefault(); return; }
    if (S.playing) keys[k] = 1; e.preventDefault();
  });
  addEventListener('keyup', e => { const k = KMAP[e.key.toLowerCase()]; if (k) keys[k] = 0; });
  addEventListener('blur', () => { hold = false; for (const k in keys) keys[k] = 0; });

  newGame(); S.title();
  if (params.get('autostart')) { S.start(); botOn = !!params.get('bot'); if (params.get('round')) { G.round = +params.get('round') - 1; nextRound(); } for (let i = 0, n = (+params.get('warp') || 0) * 60; i < n; i++) update(1 / 60); }
  if (params.get('dbg')) setInterval(() => { document.title = `round=${G.round} heists=${G.heists} hearts=${G.hearts} score=${G.score} caught=${G.caught}`; }, 200);
  MG.loop(update, draw);
  window.BH = { get G() { return G; }, S, m };
})();
