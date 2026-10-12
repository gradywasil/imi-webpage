/* ============================================================
   ROAD HOP: a monkey out exploring the city. Hop forward across sidewalks and busy roads, grab fruit on the way, steer clear of garbage,
   and keep moving: the garbage truck is always creeping up behind you. Three hearts.
   Rare: the Golden Banana slows the traffic to a crawl; the Diamond Banana stops it and turns all the garbage into bananas.
   Controls: arrow keys / WASD, or swipe (tap = hop forward). Standalone: no connection to the main game's save yet.
   ============================================================ */
(() => {
  'use strict';
  const { rng, clamp, lerp, sfx } = MG;
  const C = 14, COLS = 8, W = C * COLS, ROWS = 14, H = C * ROWS, M = 50, SPAN = W + M * 2;
  const params = new URLSearchParams(location.search), RARE = +params.get('rare') || 0;

  MG.boot();
  const A = MGArt.build(), { R, make, shapes: { ell, box, poly, or } } = MGArt;
  const host = document.getElementById('stage'), st = MG.stage(host, W, H, { padY: 40 }), g = st.g;
  host.style.cursor = 'default';
  const ui = MG.ui(host, st, A.banana), fx = MG.fx();

  /* ---------- sprites ---------- */
  const cvs = (w, h, fn) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); fn(x, w, h); return c; };
  const flip = c => cvs(c.width, c.height, x => { x.translate(c.width, 0); x.scale(-1, 1); x.drawImage(c, 0, 0); });
  const rect = (x, c, a, b, w, h) => { x.fillStyle = c; x.fillRect(a, b, w, h); };
  const PAL = [['#d8403a', '#a02c26', '#ff8a7a'], ['#3a6ad8', '#2a4aa0', '#8aa8ff'], ['#e8c43a', '#b08c14', '#fff08c'], ['#e8e8f0', '#9a9aaa', '#ffffff'], ['#3aa85a', '#247a3c', '#8ae8a8']];
  const car = ([m, d, l]) => cvs(24, 12, x => {
    rect(x, '#1a0f14', 0, 4, 24, 7); rect(x, '#1a0f14', 4, 0, 15, 5); rect(x, m, 1, 5, 22, 5); rect(x, m, 5, 1, 13, 4); rect(x, l, 1, 5, 22, 1); rect(x, l, 5, 1, 13, 1);
    rect(x, '#9ce0ff', 6, 2, 5, 3); rect(x, '#9ce0ff', 12, 2, 5, 3); rect(x, '#d6f0ff', 6, 2, 2, 1); rect(x, d, 1, 9, 22, 1);
    rect(x, '#1a0f14', 3, 9, 6, 3); rect(x, '#1a0f14', 15, 9, 6, 3); rect(x, '#8c8670', 5, 10, 2, 1); rect(x, '#8c8670', 17, 10, 2, 1);
    rect(x, '#fff08c', 22, 6, 2, 2); rect(x, '#e86a50', 0, 6, 1, 2);
  });
  const truck = ([m, d, l]) => cvs(44, 13, x => {
    rect(x, '#1a0f14', 0, 0, 31, 11); rect(x, '#1a0f14', 30, 3, 14, 9); rect(x, '#e8e8f0', 1, 1, 29, 9); rect(x, '#fff', 1, 1, 29, 1); rect(x, '#9a9aaa', 1, 9, 29, 1);
    rect(x, m, 1, 4, 29, 2); rect(x, m, 31, 4, 12, 6); rect(x, l, 31, 4, 12, 1); rect(x, '#9ce0ff', 36, 5, 6, 3); rect(x, d, 31, 9, 12, 1);
    rect(x, '#1a0f14', 3, 10, 6, 3); rect(x, '#1a0f14', 13, 10, 6, 3); rect(x, '#1a0f14', 34, 10, 6, 3); rect(x, '#8c8670', 5, 11, 2, 1); rect(x, '#8c8670', 36, 11, 2, 1);
    rect(x, '#fff08c', 43, 7, 1, 2);
  });
  const bus = ([m, d, l]) => cvs(38, 13, x => {
    rect(x, '#1a0f14', 0, 0, 38, 12); rect(x, m, 1, 1, 36, 10); rect(x, l, 1, 1, 36, 1); rect(x, d, 1, 9, 36, 1);
    for (let i = 0; i < 6; i++) rect(x, '#9ce0ff', 3 + i * 5, 3, 4, 3); rect(x, '#9ce0ff', 32, 3, 4, 5);
    rect(x, '#1a0f14', 4, 10, 6, 3); rect(x, '#1a0f14', 26, 10, 6, 3); rect(x, '#8c8670', 6, 11, 2, 1); rect(x, '#8c8670', 28, 11, 2, 1); rect(x, '#fff08c', 37, 8, 1, 2);
  });
  const VEH = { car: { w: 24, h: 12, mk: car }, truck: { w: 44, h: 13, mk: truck }, bus: { w: 38, h: 13, mk: bus } };
  const vehSpr = {}; for (const t in VEH) vehSpr[t] = PAL.map(p => { const r = VEH[t].mk(p); return [r, flip(r)]; });

  const monkeySpr = [0, 1].map(f => make(13, 14, px => {
    px.shape(ell(6.5, 12.6 - f, 2, 1.2), R.furD, 1); px.shape(ell(3.2, 12.8 - f * 2, 1.4, 1.1), R.fur, 2); px.shape(ell(9.8, 12.8 - f * 2, 1.4, 1.1), R.fur, 2);
    px.shape(ell(6.5, 9.8 - f, 3.7, 3.2), R.fur, 3); px.shape(ell(1.8, 5.2, 1.7, 1.7), R.furD, 4); px.shape(ell(11.2, 5.2, 1.7, 1.7), R.furD, 4);
    px.shape(ell(6.5, 5.3, 4.5, 4.1), R.fur, 5); px.shape(ell(6.5, 6.2, 3, 2.5), R.skin, 6); px.dot(5, 5, R.ink, 1, 7); px.dot(8, 5, R.ink, 1, 7); px.dot(6, 7, R.ink, 1, 7); px.dot(7, 7, R.ink, 1, 7);
  }));
  const S_ = {
    can: make(10, 13, px => { px.shape(box(1, 3, 8, 9), R.metal, 1); px.shape(box(0, 1, 10, 3), R.metal, 2); px.shape(box(4, 0, 2, 2), R.metal, 3); px.shape(or(box(2, 6, 6, 1), box(2, 9, 6, 1)), R.ink, 2); }),
    bush: make(14, 11, px => { px.shape(or(ell(4.5, 6.5, 4.5, 4), ell(9.5, 6.5, 4.5, 4), ell(7, 4.5, 4.5, 3.8)), R.leaf, 1); px.tone(5, 3, 2); px.tone(9, 5, 2); px.dot(6, 6, R.red, 2, 2); px.dot(10, 7, R.red, 2, 2); }),
    tree: make(16, 24, px => { px.shape(box(6, 12, 4, 11), R.stem, 1); px.shape(or(ell(8, 8, 7, 6.6), ell(4.5, 11, 4, 3.5), ell(11.5, 11, 4, 3.5)), R.leaf, 2); px.tone(5, 5, 2, 2); px.tone(6, 4, 2, 2); }),
    bag: make(12, 12, px => { px.shape(or(ell(6, 7.6, 5, 4), poly([[4, 4], [8, 4], [7, 1.4], [5, 1.4]])), R.ink, 1); px.tone(4, 6, 2, 1); px.tone(4, 7, 2, 1); px.dot(5, 1, R.grape, 0, 2); px.dot(7, 1, R.grape, 0, 2); }),
    soda: make(7, 11, px => { px.shape(box(1, 2, 5, 8), R.red, 1); px.shape(box(1, 1, 5, 2), R.metal, 2); px.shape(box(1, 4, 5, 2), R.paper, 3); px.tone(2, 3, 2, 1); }),
    fish: make(14, 8, px => { px.shape(or(ell(6, 4, 4.5, 2.2), poly([[10, 4], [14, 1], [14, 7]])), R.paper, 1); px.dot(3, 3, R.ink, 1, 2); }),
  };
  const GARB = [S_.bag, S_.soda, S_.fish], FOOD = A.fruits;

  /* ---------- state ---------- */
  let G = null, botOn = false;
  const p = { c: 3, r: 3, fc: 3, fr: 3, hop: 0, inv: 0, stun: 0, face: 0, squish: 0, expr: 'normal' };
  const rows = new Map();

  function newGame() {
    rows.clear();
    G = { t: 0, score: 0, hearts: 3, combo: 0, bestCombo: 0, cam: 0, camMin: 0, best: 3, fruit: 0, garb: 0, hits: 0, caught: 0, goldens: 0, diamonds: 0, slowT: 0, stopT: 0, shake: 0, dead: 0, mode: 'walk', left: 1, lastType: 'walk', sinceDia: 0, slow: 1, dirLast: 1 };
    p.c = 3; p.r = 3; p.fc = 3; p.fr = 3; p.hop = 0; p.inv = 0; p.stun = 0; p.squish = 0; p.face = 0; fx.clear();
    for (let r = 0; r < 4; r++) row(r); render();
  }
  const mult = () => ui.mult(G.combo);
  function render(anim) { ui.setScore(G.score); ui.setHearts(G.hearts, anim); ui.setCombo(G.combo, mult()); }

  /* ---------- rows ---------- */
  function foodItem(r) {
    if (Math.random() < .014 + RARE * .3 && r > 8) return 'golden'; if (Math.random() < .005 + Math.min(.01, G.sinceDia / 6000) + RARE * .3 && r > 14) return 'diamond';
    return 'fruit';
  }
  function row(r) {
    if (rows.has(r)) return rows.get(r);
    const d = clamp(r / 90, 0, 1); let rw;
    if (r < 4) rw = { type: 'walk', cells: Array(COLS).fill(null), grass: true };
    else {
      if (G.left <= 0) { /* sequence: a walk row, then a run of road rows */
        if (G.mode === 'walk') { G.mode = 'road'; G.left = 1 + Math.floor(Math.random() * (1 + Math.floor(d * 3))) + (Math.random() < .3 ? 1 : 0); } else { G.mode = 'walk'; G.left = 1 + (Math.random() < .3 ? 1 : 0); }
      }
      G.left--;
      if (G.mode === 'walk') {
        const cells = Array(COLS).fill(null); let blocks = 0;
        for (let c = 0; c < COLS; c++) { const q = Math.random();
          if (q < .2 && blocks < 4) { cells[c] = { k: Math.random() < .42 ? 'tree' : Math.random() < .5 ? 'bush' : 'can', block: true }; blocks++; }
          else if (q < .32) cells[c] = { k: foodItem(r), f: Math.floor(Math.random() * FOOD.length) };
          else if (q < .4 + d * .06) cells[c] = { k: 'garb', f: Math.floor(Math.random() * 3) };
        }
        rw = { type: 'walk', cells, grass: Math.random() < .55 };
      } else {
        const dir = Math.random() < .5 ? 1 : -1, spd = (18 + rng(0, 18) + d * 30) * dir, veh = [], cells = Array(COLS).fill(null);
        let x = rng(0, 40);
        while (x < SPAN) { const t = Math.random() < .6 ? 'car' : Math.random() < .55 ? 'truck' : 'bus', w = VEH[t].w; veh.push({ x0: x, t, w, col: Math.floor(Math.random() * PAL.length) }); x += w + rng(34 - d * 6, 90 - d * 20); }
        for (let c = 0; c < COLS; c++) if (Math.random() < .06) cells[c] = { k: foodItem(r), f: Math.floor(Math.random() * FOOD.length) };
        rw = { type: 'road', dir, spd, veh, cells, lane: G.left === 0 };
      }
    }
    rw.r = r; rows.set(r, rw); return rw;
  }
  const vx = (rw, v) => ((v.x0 + rw.spd * (G.tt || 0)) % SPAN + SPAN) % SPAN - M;
  const blocked = (c, r) => { const rw = rows.get(r); if (!rw || c < 0 || c >= COLS) return true; const it = rw.cells[c]; return !!(it && it.block); };

  /* ---------- player ---------- */
  function go(dc, dr) {
    if (!S.playing || G.dead || p.hop > 0 || p.stun > 0 || p.squish > 0) return;
    const nc = p.c + dc, nr = p.r + dr; row(nr + 8);
    if (nr < Math.floor(G.cam) || blocked(nc, nr)) { if (blocked(nc, nr)) { sfx.tick(); p.bump = .12; } return; }
    p.fc = p.c; p.fr = p.r; p.c = nc; p.r = nr; p.hop = .11; if (dc) p.face = dc; sfx.clack(2);
    if (nr > G.best) { G.best = nr; G.score += 5; ui.setScore(G.score); }
  }
  function arrive() {
    const rw = rows.get(p.r), it = rw && rw.cells[p.c]; p.hop = 0;
    fx.burst(p.c * C + C / 2, rowY(p.r) + C - 2, ['#c9b88a', '#8c8670'], 2, 14, 30, .2); fx.puff(p.c * C + C / 2, rowY(p.r) + C - 1, '#c9b88a', 2); fx.shock(p.c * C + C / 2, rowY(p.r) + C - 2, 'rgba(255,255,255,.7)', 9);
    if (!it || it.block) return; const x = p.c * C + C / 2, y = rowY(p.r) + 6; rw.cells[p.c] = null; const m = mult();
    if (it.k === 'fruit') { fx.ring(x, y, '#ffd23a', 12); fx.confetti(x, y, 5, ['#ffd23a', '#fff08c', '#e86a50']); G.fruit++; G.combo++; G.bestCombo = Math.max(G.bestCombo, G.combo); const pts = Math.round((it.f === 4 ? 15 : 10) * mult()); G.score += pts; sfx.ding(Math.min(10, G.combo)); fx.burst(x, y, ['#ffd23a', '#fff08c', '#e86a50'], 7, 44, 90, .4); ui.floatText(x, y - 8, '+' + pts, m > 1 ? 'gold' : ''); ui.bump(); }
    else if (it.k === 'garb') { G.garb++; G.combo = 0; G.score = Math.max(0, G.score - 10); p.stun = .55; sfx.rotten(); fx.burst(x, y, ['#3a4a3a', '#6a5a1c', '#8c9a2a'], 10, 40, 80, .5); ui.floatText(x, y - 8, 'EW! -10', 'bad'); p.expr = 'scared'; p.et = .6; }
    else if (it.k === 'golden') { MG.hitstop(.05); fx.confetti(x, y, 18, ['#ffd23a', '#fff08c', '#fffbe0']); G.goldens++; G.slowT = 6; G.score += Math.round(100 * m); G.combo++; sfx.golden(); fx.ring(x, y, '#ffd23a', 40); fx.burst(x, y, ['#ffd23a', '#fff08c', '#fffbe0'], 22, 90, 70, .8); ui.say('TRAFFIC JAM<small>cars crawl · 6 seconds</small>'); p.expr = 'screech'; p.et = 1.2; }
    else if (it.k === 'diamond') { MG.hitstop(.1); fx.confetti(x, y, 34); fx.shock(x, y, '#9be8ff', 46); G.diamonds++; G.stopT = 8; G.sinceDia = 0; G.score += Math.round(300 * m); G.combo++; sfx.diamond(); ui.doFlash('#e8fbff'); fx.ring(x, y, '#9be8ff', 56); fx.burst(x, y, ['#9be8ff', '#fff', '#2a86b8'], 30, 110, 50, 1); ui.say('BANANA PARADE<small>traffic stops · garbage turns to bananas</small>', 'ice'); rows.forEach(rw2 => rw2.cells.forEach(c2 => { if (c2 && c2.k === 'garb') { c2.k = 'fruit'; c2.f = 4; } })); p.expr = 'screech'; p.et = 1.5; }
    render();
  }
  function rowY(r) { return Math.round(H - (r - G.cam + 1) * C); }
  function squish(why) {
    if (p.inv > 0 || p.squish > 0 || G.dead) return;
    MG.hitstop(.1); fx.shock(p.c * C + C / 2, rowY(p.r) + 8, '#ff7a6a', 24); G.hearts--; G.hits++; G.combo = 0; G.shake = 6; p.squish = .8; sfx.bonk(); ui.doFlash('#c0392b'); ui.floatText(p.c * C + C / 2, rowY(p.r), why, 'bad'); fx.burst(p.c * C + C / 2, rowY(p.r) + 8, ['#6e4220', '#9a6232', '#fff6d6'], 14, 70, 120, .6); render(true);
    if (G.hearts <= 0) { G.dead = 1.2; sfx.over(); }
  }
  function respawn() {
    /* a car hit sends you to the nearest safe walk row behind you; the truck shoves you a few rows ahead. Never below the camera. */
    const ok = (c, r) => { row(r); return rows.get(r).type === 'walk' && !blocked(c, r); };
    let r = G.truckHit ? Math.ceil(G.cam) + 3 : p.r, dir = G.truckHit ? 1 : -1;
    while (!ok(p.c, r)) { r += dir; if (r < Math.ceil(G.cam) + 1) { r = Math.ceil(G.cam) + 3; dir = 1; } }
    G.truckHit = false; p.r = p.fr = r; p.fc = p.c; p.inv = 1.8; p.squish = 0; p.hop = 0; G.cam = Math.max(G.cam, r - 4);
  }

  /* ---------- update ---------- */
  function update(rdt) {
    fx.update(rdt);
    if (!G || !S.playing) return;
    const dt = rdt; G.t += dt; G.tt = (G.tt || 0) + dt * (G.stopT > 0 ? 0 : G.slowT > 0 ? .22 : 1); G.sinceDia += dt; G.shake = Math.max(0, G.shake - rdt * 20);
    if (G.slowT > 0) G.slowT -= dt; if (G.stopT > 0) G.stopT -= dt; if (p.inv > 0) p.inv -= dt; if (p.stun > 0) p.stun -= dt; if (p.et > 0) { p.et -= dt; if (p.et <= 0) p.expr = 'normal'; } if (p.bump > 0) p.bump -= dt;
    ui.setMeter(G.stopT > 0 ? G.stopT / 8 : G.slowT / 6, G.stopT > 0);
    if (G.dead > 0) { G.dead -= dt; if (G.dead <= 0) S.finish([['ROWS', G.best - 3], ['FRUIT', G.fruit], ['BEST COMBO', G.bestCombo], ['GARBAGE', G.garb], ['SPLATS', G.hits], ['GOLD / DIAMOND', `${G.goldens} / ${G.diamonds}`]]); }
    /* hop + camera + the truck behind */
    if (p.hop > 0) { p.hop -= dt; if (p.hop <= 0) arrive(); }
    if (p.squish > 0) { p.squish -= dt; if (p.squish <= 0 && !G.dead) respawn(); }
    G.camMin += (G.t > 3 ? Math.min(.62, .16 + G.t * .006) : 0) * dt;
    G.cam = Math.max(G.camMin, lerp(G.cam, Math.max(G.cam, p.r - 3), 1 - Math.pow(.0005, dt)));
    for (let r = Math.floor(G.cam) - 1; r < G.cam + ROWS + 3; r++) if (r >= 0) row(r);
    for (const k of rows.keys()) if (k < G.cam - 6) rows.delete(k);
    if (!G.dead && p.r < G.cam + .15 && p.squish <= 0 && p.inv <= 0) { G.caught++; G.truckHit = true; squish('TRUCK!'); }
    G.honkT = (G.honkT || 0) - dt;
    if (Math.random() < .25) { const vr = rows.get(Math.floor(G.cam + 1 + Math.random() * (ROWS - 2))); if (vr && vr.type === 'road' && vr.veh.length) { const v = vr.veh[Math.floor(Math.random() * vr.veh.length)], x = vx(vr, v); if (x > 0 && x + v.w < W) fx.puff(vr.dir > 0 ? x : x + v.w, rowY(vr.r) + C - 3, 'rgba(200,200,210,.8)', 1); } }
    /* traffic */
    const rw = rows.get(p.r);
    if (rw && rw.type === 'road' && p.hop <= 0 && p.squish <= 0 && p.inv <= 0 && !G.dead) {
      const px = p.c * C + C / 2;
      for (const v of rw.veh) { const x = vx(rw, v); if (px + 4 > x && px - 4 < x + v.w) { sfx.bonk(); squish('SPLAT!'); break; }
        const gap = Math.min(Math.abs(px - 4 - (x + v.w)), Math.abs(x - (px + 4))); if (gap < 7 && G.honkT <= 0 && Math.abs(G.tt - (G.lastHonk || -9)) > 1) { G.lastHonk = G.tt; G.honkT = .8; ui.floatText(clamp(x + v.w / 2, 14, W - 14), rowY(p.r) - 4, 'HONK!', 'bad'); sfx.tone(196, 196, .22, 'square', .06); sfx.tone(247, 247, .22, 'square', .05); G.shake = Math.max(G.shake, 1); } }
    }
    if (botOn) bot();
  }
  let botT = 0;
  function bot() {
    botT -= 1 / 60; if (botT > 0 || p.hop > 0 || p.stun > 0) return; botT = .09;
    const nr = p.r + 1, rw = rows.get(nr); if (!rw) return;
    const safe = (c, r) => { const w = rows.get(r); if (!w || blocked(c, r)) return false; if (w.type !== 'road') return true; const px = c * C + C / 2; return w.veh.every(v => { const x = vx(w, v) + w.dir * w.spd * .25 * Math.sign(w.dir); const a = vx(w, v); return !(px + 9 > Math.min(a, a + w.spd * .5) && px - 9 < Math.max(a, a + w.spd * .5) + v.w); }); };
    if (safe(p.c, nr)) go(0, 1); else if (safe(p.c + 1, p.r)) go(1, 0); else if (safe(p.c - 1, p.r)) go(-1, 0);
  }

  /* ---------- draw ---------- */
  function draw() {
    g.clearRect(0, 0, W, H); g.save();
    if (G.shake > .3) g.translate(Math.round(rng(-G.shake, G.shake) * .5), Math.round(rng(-G.shake, G.shake) * .5));
    const r0 = Math.floor(G.cam) - 1, r1 = Math.ceil(G.cam + ROWS) + 1, T = G.tt || 0;
    for (let r = r1; r >= r0; r--) {
      const rw = rows.get(r); if (!rw) continue; const y = rowY(r);
      if (rw.type === 'walk') {
        g.fillStyle = rw.grass ? '#2f8a35' : '#a4a4b4'; g.fillRect(0, y, W, C);
        if (rw.grass) { g.fillStyle = '#287a30'; for (let x = (r & 1) * 2; x < W; x += 4) g.fillRect(x, y + (x % 3) * 4 + 1, 2, 1); g.fillStyle = '#74c648'; for (let i = 0; i < 6; i++) g.fillRect((i * 23 + r * 7) % W, y + 3 + (i * 5) % 9, 1, 1); }
        else { g.fillStyle = '#8c8c9c'; g.fillRect(0, y + C - 1, W, 1); for (let x = 0; x < W; x += 14) g.fillRect(x, y, 1, C); g.fillStyle = '#c4c4d4'; g.fillRect(0, y, W, 1); }
      } else {
        g.fillStyle = '#3a3a48'; g.fillRect(0, y, W, C); g.fillStyle = '#2e2e3a'; for (let i = 0; i < 9; i++) g.fillRect((i * 29 + r * 11) % W, y + 3 + (i * 3) % 8, 3, 1);
        const below = rows.get(r - 1), above = rows.get(r + 1);
        if (!above || above.type !== 'road') { g.fillStyle = '#d8d8e4'; g.fillRect(0, y, W, 1); }
        if (!below || below.type !== 'road') { g.fillStyle = '#d8d8e4'; g.fillRect(0, y + C - 1, W, 1); }
        else { g.fillStyle = '#e8c43a'; for (let x = 4; x < W; x += 16) g.fillRect(x, y + C - 1, 8, 1); }
      }
      /* items */
      rw.cells.forEach((it, c) => {
        if (!it) return; const x = c * C + C / 2, b = Math.round(Math.sin(T * 5 + c) * 1);
        let sp; if (it.block) sp = S_[it.k]; else if (it.k === 'garb') sp = GARB[it.f]; else if (it.k === 'golden') sp = A.golden; else if (it.k === 'diamond') sp = A.diamond; else sp = FOOD[it.f];
        const yy = y + C - 1 - sp.height + (it.k === 'tree' ? 3 : 0) + (it.block ? 0 : b);
        if (!it.block) { g.fillStyle = 'rgba(0,0,0,.22)'; g.fillRect(x - 4, y + C - 3, 8, 2); }
        g.drawImage(sp, Math.round(x - sp.width / 2), Math.round(yy));
        if ((it.k === 'golden' || it.k === 'diamond') && Math.floor(T * 12 + c) % 2 === 0) fx.spark(x, y + 6, it.k === 'diamond' ? '#9be8ff' : '#fff08c');
        if (it.k === 'garb' && Math.floor(T * 8 + c) % 2) { g.fillStyle = '#1a0f14'; g.fillRect(Math.round(x + Math.sin(T * 6 + c) * 4), y + 2 + (c % 3), 1, 1); }
      });
      if (rw.type === 'road') for (const v of rw.veh) { const x = vx(rw, v); if (x > W || x + v.w < 0) continue; const sp = vehSpr[v.t][v.col][rw.dir > 0 ? 0 : 1]; g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(Math.round(x) + 1, y + C - 2, v.w - 2, 2); g.drawImage(sp, Math.round(x), y + C - 1 - sp.height + 1); }
      /* the player lives in his row so tall things in front of him can overlap */
      if (r === p.r) drawPlayer();
    }
    /* the truck behind */
    const gap = p.r - G.cam;
    if (gap < 2.2) { const f = Math.floor(performance.now() / 120) % 2; g.fillStyle = '#1a0f14'; g.fillRect(0, H - 8, W, 8); g.fillStyle = '#5a6a5a'; g.fillRect(0, H - 7, W, 6); g.fillStyle = '#8a9a8a'; g.fillRect(0, H - 7, W, 1); g.fillStyle = f ? '#fff08c' : '#c98f0e'; g.fillRect(10, H - 5, 8, 3); g.fillRect(W - 18, H - 5, 8, 3); g.fillStyle = '#1a0f14'; for (let x = 28; x < W - 28; x += 6) g.fillRect(x, H - 6, 3, 4); if (gap < 1.4) { g.fillStyle = f ? 'rgba(192,57,43,.3)' : 'rgba(192,57,43,.1)'; g.fillRect(0, 0, W, H); } }
    if (G.stopT > 0) { g.fillStyle = 'rgba(155,232,255,.1)'; g.fillRect(0, 0, W, H); } else if (G.slowT > 0) { g.fillStyle = 'rgba(255,210,58,.08)'; g.fillRect(0, 0, W, H); }
    fx.draw(g); g.restore();
  }
  function drawPlayer() {
    if (p.inv > 0 && p.squish <= 0 && Math.floor(performance.now() / 70) % 2 === 0) return;
    const k = p.hop > 0 ? 1 - p.hop / .11 : 1, fc = lerp(p.fc, p.c, k), fr = lerp(p.fr, p.r, k), x = fc * C + C / 2, y = rowY(fr) + C - 1, z = p.hop > 0 ? Math.sin(k * Math.PI) * 5 : 0;
    const sp = monkeySpr[p.hop > 0 ? 1 : (Math.floor(performance.now() / 380) % 2 && p.stun <= 0 ? 1 : 0)];
    g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(Math.round(x - 4), y - 1, 8, 2);
    if (p.squish > 0) { g.drawImage(sp, 0, 0, 13, 14, Math.round(x - 9), y - 3, 18, 4); for (let i = 0; i < 3; i++) { const a = performance.now() / 110 + i * 2.1; g.drawImage(PXA.spr.star.cv, Math.round(x + Math.cos(a) * 8 - 2), Math.round(y - 10 + Math.sin(a) * 2)); } return; }
    const wob = p.bump > 0 ? Math.round(Math.sin(p.bump * 80) * 1) : 0, sh = p.stun > 0 ? Math.round(Math.sin(performance.now() / 40)) : 0;
    g.save(); g.translate(Math.round(x + wob + sh), 0); if (p.face < 0) g.scale(-1, 1); g.drawImage(sp, -6, Math.round(y - 14 - z)); g.restore();
  }

  /* ---------- shell + input ---------- */
  const S = MG.shell({
    host, ui, id: 'roadhop', title: 'ROAD<span>HOP</span>', sub: 'A monkey in the big city.',
    legend: [[A.fruits[0], '<em>10</em> fruit'], [S_.bag, '<em class="bad">garbage</em> = -10, stun'], [vehSpr.car[0][0], '<em class="bad">cars</em> = -1 heart'], [S_.tree, '<em>trees</em> block you'], [A.golden, '<em>jam</em> slow traffic'], [A.diamond, '<em class="ice">parade</em> stop traffic']],
    hint: 'arrows / WASD / swipe · tap = forward · keep moving, the truck is coming', spaceStarts: true, onStart: () => newGame(), score: () => G.score,
  });
  let sw = null;
  addEventListener('pointerdown', ev => { if (ev.target.closest('.mg-over,.mg-nav')) return; sw = { x: ev.clientX, y: ev.clientY, done: false }; });
  addEventListener('pointermove', ev => {
    if (!sw || sw.done || !S.playing) return; const dx = ev.clientX - sw.x, dy = ev.clientY - sw.y, th = 16;
    if (Math.abs(dx) > th && Math.abs(dx) > Math.abs(dy)) { go(dx > 0 ? 1 : -1, 0); sw.done = true; } else if (Math.abs(dy) > th) { go(0, dy < 0 ? 1 : -1); sw.done = true; }
  });
  addEventListener('pointerup', () => { if (sw && !sw.done && S.playing) go(0, 1); sw = null; });
  addEventListener('keydown', e => {
    if (!S.playing) return; const k = e.key.toLowerCase();
    if (k === 'arrowup' || k === 'w' || k === ' ') go(0, 1); else if (k === 'arrowdown' || k === 's') go(0, -1); else if (k === 'arrowleft' || k === 'a') go(-1, 0); else if (k === 'arrowright' || k === 'd') go(1, 0); else return;
    e.preventDefault();
  });

  newGame(); S.title();
  if (params.get('autostart')) { S.start(); botOn = !!params.get('bot'); for (let i = 0, n = (+params.get('warp') || 0) * 60; i < n; i++) update(1 / 60); }
  if (params.get('dbg')) setInterval(() => { document.title = `rows=${G.best} fruit=${G.fruit} hearts=${G.hearts} t=${Math.round(G.t)}`; }, 200);
  MG.loop(update, draw);
  window.RH = { get G() { return G; }, S, p };
})();
