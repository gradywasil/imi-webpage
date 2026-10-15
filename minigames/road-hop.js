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
  const perk = MGCrew.perk('roadhop'), HOP = .11 * (perk && perk.hop || 1), EXTRA = perk && perk.hearts || 0;
  const ui = MG.ui(host, st, MGArt3.build().banana, 3 + EXTRA), fx = MG.fx();

  /* ---------- sprites (hi-res: 3 pixels per game unit; the crew monkey is the player) ---------- */
  const { cvs, flip } = MGArt3;
  const A3 = MGArt3.build();
  const rect = (x, c, a, b, w, h) => { x.fillStyle = c; x.fillRect(a, b, w, h); };
  const disc = (x, cx, cy, r, c) => { x.fillStyle = c; for (let j = -r; j <= r; j++) { const w = Math.floor(Math.sqrt(r * r - j * j) + .5); x.fillRect(cx - w, cy + j, w * 2 + 1, 1); } };
  /* a trapezoid filled scanline by scanline: top row y0 spans xl0..xr0, bottom row y1 spans xl1..xr1 */
  const trap = (x, c, y0, y1, xl0, xr0, xl1, xr1) => { x.fillStyle = c; for (let y = y0; y <= y1; y++) { const t = y1 === y0 ? 0 : (y - y0) / (y1 - y0), a = Math.round(xl0 + (xl1 - xl0) * t), b = Math.round(xr0 + (xr1 - xr0) * t); x.fillRect(a, y, b - a, 1); } };
  const wheel = (x, cx, cy) => { disc(x, cx, cy, 6, '#1a0f14'); disc(x, cx, cy, 4, '#3a3a46'); disc(x, cx, cy, 2, '#c8c8d4'); rect(x, '#fff', cx - 1, cy - 1, 1, 1); };
  const car = ([m, d, l]) => cvs(72, 36, x => {
    trap(x, '#1a0f14', 2, 15, 21, 51, 11, 61); trap(x, m, 3, 15, 22, 50, 12, 60); trap(x, '#a8e6ff', 5, 14, 23, 33, 17, 33); trap(x, '#a8e6ff', 5, 14, 36, 49, 36, 55);
    rect(x, '#e8fbff', 25, 6, 5, 1); rect(x, '#e8fbff', 22, 8, 3, 1); rect(x, '#e8fbff', 38, 6, 6, 1); rect(x, l, 23, 3, 26, 1); rect(x, m, 34, 4, 2, 11);
    rect(x, '#1a0f14', 1, 15, 70, 17); rect(x, m, 2, 16, 68, 14); rect(x, l, 2, 16, 68, 2); rect(x, d, 2, 27, 68, 3); rect(x, d, 36, 18, 1, 9); rect(x, '#fff6d6', 40, 20, 4, 1);
    rect(x, '#8c8670', 0, 25, 3, 5); rect(x, '#8c8670', 69, 25, 3, 5); rect(x, '#fff08c', 66, 18, 5, 4); rect(x, '#fffbe0', 69, 18, 2, 2); rect(x, '#e86a50', 1, 18, 3, 4); rect(x, '#8a2a20', 1, 21, 3, 1);
    wheel(x, 16, 30); wheel(x, 55, 30);
  });
  const truck = ([m, d, l]) => cvs(132, 39, x => {
    rect(x, '#1a0f14', 0, 0, 94, 33); rect(x, '#f2f2f8', 1, 1, 92, 30); rect(x, '#fff', 1, 1, 92, 2); rect(x, '#b8b8c8', 1, 29, 92, 3); rect(x, m, 1, 11, 92, 7); rect(x, l, 1, 11, 92, 1); rect(x, d, 1, 17, 92, 1);
    for (let i = 0; i < 8; i++) rect(x, '#d0d0dc', 8 + i * 11, 3, 1, 7); rect(x, '#b8b8c8', 90, 3, 1, 26);
    trap(x, '#1a0f14', 8, 33, 94, 126, 94, 132); rect(x, '#1a0f14', 94, 8, 34, 25); rect(x, m, 95, 12, 35, 19); rect(x, l, 95, 12, 35, 2); rect(x, d, 95, 28, 35, 2);
    trap(x, '#a8e6ff', 14, 24, 98, 117, 98, 125); rect(x, '#e8fbff', 100, 15, 6, 1); rect(x, m, 110, 14, 2, 10); rect(x, '#8c8670', 128, 28, 4, 5); rect(x, '#fff08c', 127, 22, 5, 4); rect(x, '#e86a50', 0, 24, 2, 5);
    wheel(x, 16, 33); wheel(x, 42, 33); wheel(x, 108, 33);
  });
  const bus = ([m, d, l]) => cvs(114, 39, x => {
    rect(x, '#1a0f14', 0, 0, 114, 34); rect(x, m, 1, 1, 112, 32); rect(x, l, 1, 1, 112, 2); rect(x, d, 1, 27, 112, 6); rect(x, '#fff6d6', 1, 22, 112, 2);
    for (let i = 0; i < 8; i++) { rect(x, '#a8e6ff', 5 + i * 11, 6, 9, 11); rect(x, '#e8fbff', 6 + i * 11, 7, 3, 1); rect(x, '#8ac6e0', 5 + i * 11, 15, 9, 2); }
    rect(x, '#a8e6ff', 96, 6, 15, 19); rect(x, '#e8fbff', 98, 8, 5, 1); rect(x, d, 92, 4, 2, 24); rect(x, '#1a0f14', 92, 4, 1, 24);
    rect(x, '#fff08c', 111, 24, 3, 6); rect(x, '#e86a50', 0, 24, 3, 5); rect(x, '#fffbe0', 40, 1, 20, 3); rect(x, '#1a0f14', 42, 2, 16, 1);
    wheel(x, 20, 33); wheel(x, 82, 33);
  });
  const PAL = [['#d8403a', '#a02c26', '#ff8a7a'], ['#3a6ad8', '#2a4aa0', '#8aa8ff'], ['#e8c43a', '#b08c14', '#fff08c'], ['#e8e8f0', '#9a9aaa', '#ffffff'], ['#3aa85a', '#247a3c', '#8ae8a8']];
  const VEH = { car: { w: 24, h: 12, mk: car }, truck: { w: 44, h: 13, mk: truck }, bus: { w: 38, h: 13, mk: bus } };
  const vehSpr = {}; for (const t in VEH) vehSpr[t] = PAL.map(p => { const r = VEH[t].mk(p); return [r, flip(r)]; });
  const S_ = { can: A3.trash, bush: A3.bush, tree: A3.tree, bag: A3.bag, soda: A3.soda, fish: A3.fish };
  const GARB = [S_.bag, S_.soda, S_.fish], FOOD = A3.fruits;

  /* ground: one hi-res strip per row, built once with that row's own seed so the grass and slabs never shimmer */
  const seeded = s => () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  function rowTex(rw) {
    const r = seeded(rw.r * 7919 + 13), TW = W * 3, TH = C * 3;
    return cvs(TW, TH, x => {
      if (rw.type === 'walk' && rw.grass) {
        rect(x, '#2f8a35', 0, 0, TW, TH);
        for (let i = 0; i < 70; i++) rect(x, '#287a30', Math.floor(r() * TW), Math.floor(r() * (TH - 4)), 1, 3);
        for (let i = 0; i < 50; i++) rect(x, '#3f9a3a', Math.floor(r() * TW), Math.floor(r() * (TH - 3)), 1, 2);
        for (let i = 0; i < 22; i++) rect(x, '#74c648', Math.floor(r() * TW), Math.floor(r() * (TH - 2)), 1, 1);
        for (let i = 0; i < 4; i++) if (r() < .55) { const fx = 6 + Math.floor(r() * (TW - 12)), fy = 8 + Math.floor(r() * (TH - 16)), c = ['#fff6d6', '#ffd23a', '#f08aa8'][i % 3]; rect(x, c, fx, fy, 3, 1); rect(x, c, fx + 1, fy - 1, 1, 3); rect(x, '#e86a50', fx + 1, fy, 1, 1); }
      } else if (rw.type === 'walk') {
        rect(x, '#a4a4b4', 0, 0, TW, TH);
        for (let i = 0; i < 90; i++) rect(x, r() < .5 ? '#9898a8' : '#b2b2c2', Math.floor(r() * TW), Math.floor(r() * TH), 1, 1);
        for (let sx = 0; sx < TW; sx += 42) { rect(x, '#8c8c9c', sx, 0, 1, TH); rect(x, '#b8b8c8', sx + 1, 2, 1, TH - 4); }
        rect(x, '#c4c4d4', 0, 0, TW, 2); rect(x, '#8c8c9c', 0, TH - 2, TW, 2);
        for (let i = 0; i < 3; i++) if (r() < .5) { const cx = Math.floor(r() * (TW - 10)), cy = 6 + Math.floor(r() * 20); rect(x, '#7c7c8c', cx, cy, 3, 1); rect(x, '#7c7c8c', cx + 3, cy + 1, 2, 1); rect(x, '#7c7c8c', cx + 5, cy + 2, 3, 1); }
      } else {
        rect(x, '#3a3a48', 0, 0, TW, TH);
        for (let i = 0; i < 160; i++) rect(x, r() < .5 ? '#2e2e3a' : '#454556', Math.floor(r() * TW), Math.floor(r() * TH), r() < .3 ? 2 : 1, 1);
        for (let i = 0; i < 3; i++) { const ty = 10 + Math.floor(r() * 22), tx = Math.floor(r() * TW * .7); rect(x, '#303040', tx, ty, 38 + Math.floor(r() * 50), 1); rect(x, '#303040', tx + 2, ty + 5, 30 + Math.floor(r() * 40), 1); }
      }
    });
  }

  /* ---------- state ---------- */
  let G = null, botOn = false;
  const p = { c: 3, r: 3, fc: 3, fr: 3, hop: 0, inv: 0, stun: 0, face: 0, squish: 0, expr: 'normal' };
  const rows = new Map();

  function newGame() {
    rows.clear();
    G = { t: 0, score: 0, hearts: 3 + EXTRA, combo: 0, bestCombo: 0, cam: 0, camMin: 0, best: 3, fruit: 0, garb: 0, hits: 0, caught: 0, goldens: 0, diamonds: 0, slowT: 0, stopT: 0, shake: 0, dead: 0, mode: 'walk', left: 1, lastType: 'walk', sinceDia: 0, slow: 1, dirLast: 1 };
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
    p.fc = p.c; p.fr = p.r; p.c = nc; p.r = nr; p.hop = HOP; if (dc) p.face = dc; sfx.clack(2);
    if (nr > G.best) { G.best = nr; G.score += 5; ui.setScore(G.score); }
  }
  function arrive() {
    const rw = rows.get(p.r), it = rw && rw.cells[p.c]; p.hop = 0;
    fx.burst(p.c * C + C / 2, rowY(p.r) + C - 2, ['#c9b88a', '#8c8670'], 2, 14, 30, .2); fx.puff(p.c * C + C / 2, rowY(p.r) + C - 1, '#c9b88a', 2); fx.shock(p.c * C + C / 2, rowY(p.r) + C - 2, 'rgba(255,255,255,.7)', 9);
    if (!it || it.block) return; const x = p.c * C + C / 2, y = rowY(p.r) + 6; rw.cells[p.c] = null; const m = mult();
    if (it.k === 'fruit') { fx.ring(x, y, '#ffd23a', 12); fx.confetti(x, y, 5, ['#ffd23a', '#fff08c', '#e86a50']); G.fruit++; G.combo++; G.bestCombo = Math.max(G.bestCombo, G.combo); const pts = Math.round((it.f === 4 ? 15 : 10) * mult()); G.score += pts; sfx.ding(Math.min(10, G.combo)); fx.burst(x, y, ['#ffd23a', '#fff08c', '#e86a50'], 7, 44, 90, .4); ui.floatText(x, y - 8, '+' + pts, m > 1 ? 'gold' : ''); ui.bump(); }
    else if (it.k === 'garb') { G.garb++; G.combo = 0; G.score = Math.max(0, G.score - 10); p.stun = perk && perk.soft ? .25 : .55; sfx.rotten(); fx.burst(x, y, ['#3a4a3a', '#6a5a1c', '#8c9a2a'], 10, 40, 80, .5); ui.floatText(x, y - 8, 'EW! -10', 'bad'); p.expr = 'scared'; p.et = .6; }
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
      if (!rw.tex) rw.tex = rowTex(rw);
      st.hi(rw.tex, 0, y);
      if (rw.type === 'road') {
        const below = rows.get(r - 1), above = rows.get(r + 1);
        if (!above || above.type !== 'road') { g.fillStyle = '#d8d8e4'; g.fillRect(0, y, W, 2 / 3); g.fillStyle = '#8a8a9a'; g.fillRect(0, y + 2 / 3, W, 1 / 3); }
        if (!below || below.type !== 'road') { g.fillStyle = '#d8d8e4'; g.fillRect(0, y + C - 1, W, 2 / 3); }
        else { g.fillStyle = '#e8c43a'; for (let x = 4; x < W; x += 16) g.fillRect(x, y + C - 1, 8, 2 / 3); }
      }
      /* items */
      rw.cells.forEach((it, c) => {
        if (!it) return; const x = c * C + C / 2, b = Math.round(Math.sin(T * 5 + c) * 3) / 3;
        let sp; if (it.block) sp = S_[it.k]; else if (it.k === 'garb') sp = GARB[it.f]; else if (it.k === 'golden') sp = A3.golden; else if (it.k === 'diamond') sp = A3.diamond; else sp = FOOD[it.f];
        const yy = y + C - 1 - sp.height / 3 + (it.k === 'tree' ? 3 : 0) + (it.block ? 0 : b);
        if (!it.block) { g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(x - 4, y + C - 3, 8, 2); g.fillStyle = 'rgba(0,0,0,.16)'; g.fillRect(x - 5, y + C - 2.67, 10, .67); }
        st.hi(sp, x - sp.width / 6, yy);
        if ((it.k === 'golden' || it.k === 'diamond') && Math.floor(T * 12 + c) % 2 === 0) fx.spark(x, y + 6, it.k === 'diamond' ? '#9be8ff' : '#fff08c');
        if (it.k === 'garb' && Math.floor(T * 8 + c) % 2) { g.fillStyle = '#1a0f14'; g.fillRect(Math.round(x + Math.sin(T * 6 + c) * 4), y + 2 + (c % 3), 1, 1); }
      });
      if (rw.type === 'road') for (const v of rw.veh) { const x = vx(rw, v); if (x > W || x + v.w < 0) continue; const sp = vehSpr[v.t][v.col][rw.dir > 0 ? 0 : 1]; g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(Math.round(x) + 1, y + C - 2, v.w - 2, 2); st.hi(sp, x, y + C - sp.height / 3); }
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
    const k = p.hop > 0 ? 1 - p.hop / HOP : 1, fc = lerp(p.fc, p.c, k), fr = lerp(p.fr, p.r, k), x = fc * C + C / 2, y = rowY(fr) + C - 1, z = p.hop > 0 ? Math.sin(k * Math.PI) * 5 : 0, now = performance.now();
    g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(x - 4, y - 1, 8, 2); g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(x - 5, y - .33, 10, .67);
    const flipX = p.face < 0;
    if (p.squish > 0) { MGCrew.draw(st, 'squish', x, y + 1, { flip: flipX }); for (let i = 0; i < 3; i++) { const a = now / 110 + i * 2.1; st.hi(A3.star, x + Math.cos(a) * 8 - 3.5, y - 12 + Math.sin(a) * 2); } return; }
    const wob = p.bump > 0 ? Math.sin(p.bump * 80) : 0, sh = p.stun > 0 ? Math.sin(now / 40) : 0;
    const pose = p.hop > 0 ? (k < .4 ? 'launch' : k < .75 ? 'air' : 'fall') : p.stun > 0 || p.expr === 'scared' ? 'scared' : p.expr === 'screech' ? 'cheer' : Math.floor(now / 380) % 2 ? 'breathe' : 'idle';
    MGCrew.draw(st, pose, x + wob + sh, y + 1 - z, { flip: flipX });
  }
  /* ---------- shell + input ---------- */
  const S = MG.shell({
    host, ui, id: 'roadhop', title: 'ROAD<span>HOP</span>', sub: 'A monkey in the big city.' + (perk ? '<br><small>' + perk.label + '</small>' : ''),
    legend: [[A3.fruits[4], '<em>10</em> fruit'], [S_.bag, '<em class="bad">garbage</em> = -10, stun'], [vehSpr.car[0][0], '<em class="bad">cars</em> = -1 heart'], [S_.tree, '<em>trees</em> block you'], [A3.golden, '<em>jam</em> slow traffic'], [A3.diamond, '<em class="ice">parade</em> stop traffic']],
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
