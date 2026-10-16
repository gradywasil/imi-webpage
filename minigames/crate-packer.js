/* ============================================================
   CRATE PACKER: Tetris with a spin. Each job is a truck with its own loading bay (box truck, pickup, van with wheel wells, flatbed, dump truck, semi).
   Odd-shaped stacks of banana crates ride in on a conveyor belt; rotate them and pack the bay completely. Every set of stacks is cut from the real bay,
   so a perfect pack always exists, but the belt keeps coming, and if it backs up the oldest stack falls off the end.
   85% full and the truck leaves; a perfect pack pays double. Rare: the Golden crate fits any single gap, the Diamond crate fills whatever is left.
   Controls: drag a stack into the bay. Tap a stack, press R, right-click or scroll to rotate. Z undoes, N / the arrow button sends the next stack.
   Keyboard: 1-4 pick a stack, arrows move, Space places. Standalone: no connection to the main game's save yet.
   ============================================================ */
(() => {
  'use strict';
  const { rng, clamp, lerp, sfx, h } = MG;
  const W = 120, H = 208, BELT_Y = 142, SLOT_X = [15, 41, 67, 93], BELT_MAX = 4;
  const params = new URLSearchParams(location.search), RARE = +params.get('rare') || 0;

  MG.boot();
  const A = MGArt.build(), A3 = MGArt3.build(), { cvs, text } = MGArt3;
  const host = document.getElementById('stage'), st = MG.stage(host, W, H, { padY: 40 }), g = st.g;
  host.style.cursor = 'grab';
  const ui = MG.ui(host, st, A3.banana, 3), fx = MG.fx();

  /* ---------- crates ---------- */
  const PAL = [['#e8b878', '#b57d3e', '#7a4a1e'], ['#a8ec76', '#4aa23c', '#1f6a2a'], ['#9ce0ff', '#3a8ec8', '#184c78'], ['#e4b0ff', '#8c58c8', '#4a2a78'], ['#ffaba0', '#d8403a', '#781c16'], ['#fff7b0', '#ffd23a', '#b38004'], ['#ffffff', '#9be8ff', '#2a86b8']];
  /* hi-res banana crate: planks, nails, a banana stencil, corner plates (s is the size in game units, the canvas is 3x that) */
  const cellCache = {};
  function cell(ci, s) {
    const id = ci + ':' + s; if (cellCache[id]) return cellCache[id];
    const S3 = s * 3, c = document.createElement('canvas'); c.width = c.height = S3; c.hi = true; const x = c.getContext('2d'), p = PAL[ci];
    x.fillStyle = '#1a0f14'; x.fillRect(0, 0, S3, S3); x.fillStyle = p[1]; x.fillRect(1, 1, S3 - 2, S3 - 2);
    x.fillStyle = p[0]; x.fillRect(1, 1, S3 - 2, 2); x.fillRect(1, 1, 2, S3 - 2); x.fillStyle = p[2]; x.fillRect(1, S3 - 3, S3 - 2, 2); x.fillRect(S3 - 3, 1, 2, S3 - 2);
    if (S3 >= 24) {
      const pl = Math.max(7, Math.floor(S3 / 4));
      for (let y = pl; y < S3 - 3; y += pl) { x.fillStyle = p[2]; x.fillRect(3, y, S3 - 6, 1); x.fillStyle = p[0]; x.fillRect(3, y + 1, S3 - 6, 1); }
      for (const [nx, ny] of [[4, 4], [S3 - 7, 4], [4, S3 - 7], [S3 - 7, S3 - 7]]) { x.fillStyle = '#b8b8c4'; x.fillRect(nx, ny, 3, 3); x.fillStyle = '#f0f0f8'; x.fillRect(nx, ny, 1, 1); x.fillStyle = '#5a5a66'; x.fillRect(nx + 2, ny + 2, 1, 1); }
      if (ci < 5) { const mx = Math.floor(S3 / 2) - 4, my = Math.floor(S3 / 2) - 3; x.fillStyle = '#ffd23a'; x.fillRect(mx, my, 8, 2); x.fillRect(mx + 1, my + 2, 6, 2); x.fillRect(mx + 3, my + 4, 2, 1); x.fillStyle = '#c98f0e'; x.fillRect(mx, my + 3, 8, 1); }
    }
    if (ci === 5) { x.fillStyle = '#fff'; x.fillRect(5, 5, 4, 2); x.fillRect(5, 7, 2, 3); } if (ci === 6) { x.fillStyle = '#fff'; x.fillRect(5, 5, 5, 4); x.fillRect(S3 - 9, S3 - 8, 3, 3); }
    return (cellCache[id] = c);
  }
  const rectc = (x, c, a, b, w, h) => { x.fillStyle = c; x.fillRect(a, b, w, h); }, seeded = s0 => () => ((s0 = (s0 * 1664525 + 1013904223) >>> 0) / 4294967296);
  const wheelSpr = cvs(36, 27, x => { rectc(x, '#1a0f14', 3, 0, 30, 27); rectc(x, '#1a0f14', 0, 4, 36, 19); rectc(x, '#2a2a34', 4, 2, 28, 24); rectc(x, '#3a3a48', 3, 5, 30, 17); rectc(x, '#555566', 6, 3, 24, 3); rectc(x, '#8c8670', 14, 9, 8, 9); rectc(x, '#c8c8d4', 15, 10, 6, 7); rectc(x, '#fff', 15, 10, 2, 2); });
  const beltBg = cvs((W - 4) * 3, 58 * 3, (x, tw, th) => {
    rectc(x, '#1a0f14', 0, 0, tw, th); rectc(x, '#3a3a48', 3, 3, tw - 6, th - 6); rectc(x, '#2a2a38', 3, 21, tw - 6, th - 27);
    rectc(x, '#8c8670', 3, 3, tw - 6, 6); rectc(x, '#c8c4aa', 3, 3, tw - 6, 2); rectc(x, '#8c8670', 3, th - 12, tw - 6, 6); rectc(x, '#5a5a66', 3, th - 8, tw - 6, 2);
    for (let px = 12; px < tw - 6; px += 30) { rectc(x, '#f0f0f8', px, 4, 2, 2); rectc(x, '#5a5a66', px + 1, 5, 1, 1); rectc(x, '#f0f0f8', px, th - 11, 2, 2); }
  });
  /* ---------- the trucks: '#' is cargo space, '.' is wheel well / cab / bulkhead ---------- */
  const TRUCKS = [
    { name: 'BOX TRUCK', body: '#e8e8f0', mask: ['######', '######', '######', '######'] },
    { name: 'PICKUP', body: '#d8403a', mask: ['#######', '#######', '######.'] },
    { name: 'VAN', body: '#3a6ad8', mask: ['######', '######', '######', '######', '#.##.#'] },
    { name: 'FLATBED', body: '#e8c43a', mask: ['#########', '#########', '#########'] },
    { name: 'DUMP TRUCK', body: '#3aa85a', mask: ['.#######.', '#########', '#########', '#########'] },
    { name: 'SEMI', body: '#8c58c8', mask: ['#########', '#########', '#########', '#########', '##.###.##'] },
  ];

  /* ---------- piece geometry ---------- */
  const norm = cs => { const mr = Math.min(...cs.map(c => c[0])), mc = Math.min(...cs.map(c => c[1])); return cs.map(([r, c]) => [r - mr, c - mc]).sort((a, b) => a[0] - b[0] || a[1] - b[1]); };
  const rot90 = cs => norm(cs.map(([r, c]) => [c, -r]));
  const rotCCW = cs => norm(cs.map(([r, c]) => [-c, r]));
  const dims = cs => [Math.max(...cs.map(c => c[0])) + 1, Math.max(...cs.map(c => c[1])) + 1];

  /* cut the bay into stacks of ~4 crates by growing random regions; leftovers join a neighbour */
  function partition(mask) {
    const R = mask.length, C = mask[0].length, id = Array.from({ length: R }, () => Array(C).fill(-1)), regions = [];
    const open = (r, c) => r >= 0 && r < R && c >= 0 && c < C && mask[r][c] === '#';
    const cells = []; for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) if (open(r, c)) cells.push([r, c]);
    cells.sort(() => Math.random() - .5);
    for (const [r0, c0] of cells) {
      if (id[r0][c0] >= 0) continue; const reg = [[r0, c0]], k = regions.length; id[r0][c0] = k; const target = Math.random() < .25 ? 3 : Math.random() < .15 ? 5 : 4;
      while (reg.length < target) {
        const fr = []; for (const [r, c] of reg) for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (open(r + dr, c + dc) && id[r + dr][c + dc] < 0) fr.push([r + dr, c + dc]);
        if (!fr.length) break; const [nr, nc] = fr[Math.floor(Math.random() * fr.length)]; id[nr][nc] = k; reg.push([nr, nc]);
      }
      regions.push(reg);
    }
    for (let k = regions.length - 1; k >= 0; k--) {                                   // fold tiny regions into a neighbour
      if (regions[k].length >= 3) continue; let to = -1;
      for (const [r, c] of regions[k]) for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const n = open(r + dr, c + dc) ? id[r + dr][c + dc] : -1; if (n >= 0 && n !== k && regions[n].length < 6) to = n; }
      if (to >= 0) { regions[k].forEach(([r, c]) => { id[r][c] = to; regions[to].push([r, c]); }); regions[k] = []; }
    }
    return regions.filter(r => r.length).map(reg => { let cs = norm(reg); for (let i = Math.floor(Math.random() * 4); i > 0; i--) cs = rot90(cs); return cs; });
  }

  /* ---------- state ---------- */
  let G = null, botOn = false, drag = null, cursor = { sel: -1, r: 0, c: 0 };
  const mkPiece = (cells, ci, kind) => ({ cells, ci, kind: kind || null, slot: 0, x: W + 20, y: BELT_Y + 28, drop: 0 });
  function newGame() {
    G = { score: 0, hearts: 3, streak: 0, bestStreak: 0, round: 0, trucks: 0, perfects: 0, placed: 0, lost: 0, goldens: 0, diamonds: 0, t: 0, shake: 0, belt: [], falls: [], queue: [], deliverT: 0, undo: [], bay: null, phase: 'in', phaseT: 0, over: false, dead: 0, sent: 0 };
    nextTruck(); fx.clear(); render();
  }
  const mult = () => ui.mult(G.streak);
  function render(anim) { ui.setScore(G.score); ui.setHearts(G.hearts, anim); ui.setCombo(G.streak, mult()); }

  function nextTruck() {
    G.round++; const pool = G.round <= TRUCKS.length ? [TRUCKS[G.round - 1]] : TRUCKS.slice(Math.min(2, G.round % 3));
    const tr = pool[Math.floor(Math.random() * pool.length)]; const rows = tr.mask.length, cols = tr.mask[0].length, cs = clamp(Math.floor(104 / cols), 10, 16);
    const bay = { tr, rows, cols, cs, x: Math.round((W - cols * cs) / 2), y: 38, fill: Array.from({ length: rows }, () => Array(cols).fill(-1)), total: tr.mask.join('').split('#').length - 1, filled: 0, slide: -140, pop: {} };
    G.bay = bay; G.belt = []; G.undo = []; cursor.sel = -1;
    const parts = partition(tr.mask); G.queue = parts.map((cells, i) => mkPiece(cells, (i + G.round) % 5));
    if (Math.random() < .08 + RARE * .6 && G.round > 1) G.queue.splice(Math.floor(Math.random() * G.queue.length), 0, mkPiece([[0, 0]], 5, 'gold'));
    if (G.round > 2 && Math.random() < .03 + RARE * .6) G.queue.splice(Math.floor(Math.random() * G.queue.length), 0, mkPiece([[0, 0]], 6, 'ice'));
    G.queue.sort(() => Math.random() - .5); G.deliverT = 0; G.phase = 'in'; G.phaseT = 0;
    ui.say(`JOB ${G.round}: ${tr.name}<small>${G.queue.length} stacks · rotate and pack it full</small>`);
  }
  const interval = () => lerp(8, 3.6, clamp((G.round - 1) / 9, 0, 1));

  /* ---------- bay logic ---------- */
  const inMask = (r, c) => r >= 0 && r < G.bay.rows && c >= 0 && c < G.bay.cols && G.bay.tr.mask[r][c] === '#';
  function canPlace(p, r, c) {
    if (p.kind === 'ice') return inMask(r, c) && G.bay.fill[r][c] < 0;
    return p.cells.every(([dr, dc]) => inMask(r + dr, c + dc) && G.bay.fill[r + dr][c + dc] < 0);
  }
  function place(p, r, c) {
    const b = G.bay; if (!canPlace(p, r, c) || G.phase !== 'play') return false;
    const cells = []; let pts;
    if (p.kind === 'ice') { for (let rr = 0; rr < b.rows; rr++) for (let cc = 0; cc < b.cols; cc++) if (inMask(rr, cc) && b.fill[rr][cc] < 0) { b.fill[rr][cc] = 6; cells.push([rr, cc]); b.filled++; } G.diamonds++; pts = 300; sfx.diamond(); ui.doFlash('#e8fbff'); ui.say('DIAMOND CRATE<small>fills everything that is left!</small>', 'ice'); fx.ring(W / 2, b.y + 20, '#9be8ff', 60); G.shake = 5; }
    else { p.cells.forEach(([dr, dc]) => { b.fill[r + dr][c + dc] = p.ci; cells.push([r + dr, c + dc]); b.filled++; }); pts = p.cells.length * 4; if (p.kind === 'gold') { pts += 50; G.goldens++; sfx.golden(); fx.ring(b.x + (c + .5) * b.cs, b.y + (r + .5) * b.cs, '#ffd23a', 30); } else sfx.clack(4 + G.placed % 6); }
    cells.forEach(([rr, cc]) => { fx.burst(b.x + (cc + .5) * b.cs, b.y + (rr + .5) * b.cs, ['#c9b88a', '#fff6d6'], 2, 20, 40, .25); fx.puff(b.x + (cc + .5) * b.cs, b.y + (rr + 1) * b.cs - 1, '#c9b88a', 1); b.pop[rr * 20 + cc] = 0; });
    G.placed++; G.score += pts; worker.t = .25; worker.p = 'launch'; ui.bump(); ui.floatText(b.x + (c + .5) * b.cs, b.y + r * b.cs - 4, '+' + pts, p.kind ? 'gold' : '');
    G.belt.splice(G.belt.indexOf(p), 1); G.undo.push({ p, cells, r, c }); if (G.undo.length > 6) G.undo.shift(); cursor.sel = -1; render();
    checkDone(); return true;
  }
  function undo() {
    if (!S.playing || G.phase !== 'play' || !G.undo.length || G.belt.length >= BELT_MAX) { sfx.miss(); return; }
    const u = G.undo.pop(), b = G.bay; if (u.p.kind === 'ice') { sfx.miss(); G.undo.push(u); return; }
    u.cells.forEach(([r, c]) => { b.fill[r][c] = -1; b.filled--; }); G.score = Math.max(0, G.score - 6); G.belt.unshift(u.p); u.p.x = SLOT_X[0]; sfx.tick(); render();
  }
  function deliver() {
    if (!G.queue.length) return; const p = G.queue.shift(); p.x = W + 18; G.belt.push(p); G.sent++; sfx.tick();
    if (G.belt.length > BELT_MAX) { const lost = G.belt.shift(); G.falls.push({ p: lost, x: lost.x, y: BELT_Y + 28, vy: -30 }); G.lost++; G.shake = 4; sfx.bonk(); ui.floatText(SLOT_X[0], BELT_Y - 4, 'DROPPED!', 'bad'); fx.burst(SLOT_X[0], BELT_Y + 20, ['#8a5a2b', '#c9b88a'], 8, 50, 100, .5); if (cursor.sel >= 0) cursor.sel = -1; }
  }
  function checkDone() {
    const b = G.bay; if (b.filled >= b.total) { finishTruck(true); return; }
    if (!G.queue.length && (!G.belt.length || !G.belt.some(fitsAnywhere))) finishTruck(false);      /* nothing left that could still go in */
  }
  function fitsAnywhere(p) {
    let cells = p.cells; for (let k = 0; k < (p.kind || p.cells.length === 1 ? 1 : 4); k++) { const q = { ...p, cells }; for (let r = 0; r < G.bay.rows; r++) for (let c = 0; c < G.bay.cols; c++) if (canPlace(q, r, c)) return true; cells = rot90(cells); }
    return false;
  }
  function finishTruck(full) {
    if (G.phase !== 'play') return; const b = G.bay, cov = b.filled / b.total, ok = cov >= .85;
    G.phase = 'out'; G.phaseT = 0; G.queue = []; G.belt = []; const perfect = cov >= 1;
    if (ok) {
      G.streak++; G.bestStreak = Math.max(G.bestStreak, G.streak); G.trucks++; const base = b.filled * 10, pts = Math.round(base * (perfect ? 2 : 1) * mult() * (1 + Math.max(0, G.round) * 0));
      G.score += pts; ui.bump(); sfx.letters(); sfx.golden(); ui.floatText(W / 2, b.y + b.rows * b.cs / 2, `${Math.round(cov * 100)}% +${pts}`, perfect ? 'ice big' : 'gold big'); worker.t = 1.1; worker.p = 'cheer'; if (perfect) { G.perfects++; ui.say('PERFECT PACK!<small>x2 · every corner filled</small>', 'ice'); sfx.diamond(); fx.ring(W / 2, b.y + 20, '#9be8ff', 56); } else ui.say(`TRUCK AWAY!<small>${Math.round(cov * 100)}% packed</small>`);
      fx.burst(W / 2, b.y + 20, ['#ffd23a', '#fff08c', '#74c648'], 20, 90, 60, .9); fx.confetti(W / 2, b.y + 14, perfect ? 44 : 20); if (perfect) { MG.hitstop(.08); fx.shock(W / 2, b.y + 20, '#9be8ff', 50); } if (G.streak > 1) ui.pulseCombo(); if (perfect && G.hearts < 3) { G.hearts++; ui.floatText(W / 2, 70, '+HEART', 'gold'); }
    } else { G.streak = 0; G.hearts--; G.shake = 5; MG.hitstop(.08); sfx.bonk(); worker.t = 1.1; worker.p = 'scared'; ui.doFlash('#c0392b'); ui.say(`REJECTED<small>only ${Math.round(cov * 100)}% packed</small>`); if (G.hearts <= 0) { G.dead = 1.3; sfx.over(); } }
    render(!ok);
  }

  /* ---------- update ---------- */
  function update(rdt) {
    fx.update(rdt);
    if (!G || !S.playing) return;
    const dt = rdt; G.t += dt; G.shake = Math.max(0, G.shake - rdt * 16); G.phaseT += dt; const b = G.bay;
    if (G.dead > 0) { G.dead -= dt; if (G.dead <= 0) { G.dead = 0; S.finish([['TRUCKS PACKED', G.trucks], ['PERFECT PACKS', G.perfects], ['STACKS PLACED', G.placed], ['STACKS DROPPED', G.lost], ['BEST STREAK', G.bestStreak], ['GOLD / DIAMOND', `${G.goldens} / ${G.diamonds}`]]); } return; }
    if (G.phase === 'in') { b.slide = lerp(b.slide, 0, 1 - Math.pow(.0004, dt)); if (G.phaseT > .8) { b.slide = 0; G.phase = 'play'; G.phaseT = 0; deliver(); G.deliverT = interval(); } }
    else if (G.phase === 'out') { b.slide += (60 + G.phaseT * 260) * dt; if (G.phaseT > 1.1) { if (G.hearts <= 0) return; nextTruck(); } }
    else if (G.phase === 'play') {
      G.deliverT -= dt; if (G.queue.length && G.deliverT <= 0) { deliver(); G.deliverT = interval(); checkDone(); }
      if (!G.queue.length) checkDone();
      if (botOn) botStep(dt);
    }
    G.belt.forEach((p, i) => { p.x += (SLOT_X[i] - p.x) * Math.min(1, dt * 9); });
    for (const k in G.bay.pop) { G.bay.pop[k] += dt / .32; if (G.bay.pop[k] >= 1) delete G.bay.pop[k]; }
    for (let i = G.falls.length - 1; i >= 0; i--) { const f = G.falls[i]; f.vy += 420 * dt; f.y += f.vy * dt; f.x -= 14 * dt; if (f.y > H + 30) G.falls.splice(i, 1); }
    if (G.phase === 'out' && Math.random() < .6) fx.puff(G.bay.x + G.bay.slide - 8, G.bay.y + G.bay.rows * G.bay.cs + 15, 'rgba(190,190,200,.9)', 1);
  }
  let botT = 0;
  function botStep(dt) {
    botT += dt; if (botT < .5 || !G.belt.length) return; botT = 0;
    for (const p of G.belt.slice()) { let cells = p.cells; for (let k = 0; k < 4; k++) { const q = { ...p, cells }; for (let r = 0; r < G.bay.rows; r++) for (let c = 0; c < G.bay.cols; c++) if (canPlace(q, r, c)) { p.cells = cells; place(p, r, c); return; } cells = rot90(cells); } }
  }

  /* ---------- draw ---------- */
  function ghost() {
    if (!drag) return null; const p = drag.p, b = G.bay, [rr, cc] = dims(p.cells), lift = 14;
    const c = Math.round((drag.x - cc * b.cs / 2 - b.x) / b.cs), r = Math.round((drag.y - lift - rr * b.cs / 2 - b.y) / b.cs); return { r, c, ok: canPlace(p, r, c) };
  }
  const worker = { t: 0, p: 'cheer' };
  function drawPiece(p, cx, cy, s, alpha = 1) {
    const [rr, cc] = dims(p.cells), x0 = Math.round(cx - cc * s / 2), y0 = Math.round(cy - rr * s / 2), sp = cell(p.ci, s); g.globalAlpha = alpha;
    p.cells.forEach(([r, c]) => st.hi(sp, x0 + c * s, y0 + r * s)); g.globalAlpha = 1;
    if (p.kind && Math.floor(performance.now() / 120) % 2 === 0) fx.spark(cx, cy, p.kind === 'ice' ? '#9be8ff' : '#fff08c');
  }
  function drawTruck() {
    const b = G.bay, tr = b.tr, ox = Math.round(b.slide * 3) / 3, y = b.y, w = b.cols * b.cs, hh = b.rows * b.cs;
    g.save(); g.translate(ox, 0);
    /* rear view: body with panel seams and rivets, door frame, bumper, tail lights, wheels, the job's name */
    g.fillStyle = '#1a0f14'; g.fillRect(b.x - 7, y - 7, w + 14, hh + 22); g.fillStyle = tr.body; g.fillRect(b.x - 6.67, y - 6.67, w + 13.33, hh + 21.33); g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(b.x - 6.67, y - 6.67, w + 13.33, 1.33); g.fillRect(b.x - 6.67, y - 6.67, .67, hh + 21.33);
    g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(b.x - 6.67, y + hh + 11, w + 13.33, 3.67); g.fillRect(b.x + w + 6, y - 6.67, .67, hh + 21.33);
    g.fillStyle = 'rgba(0,0,0,.18)'; for (let sx = b.x - 4; sx < b.x + w + 4; sx += 9) { g.fillRect(sx, y - 5.67, .33, 3.33); g.fillRect(sx, y + hh + 2, .33, 6); }
    g.fillStyle = '#f0f0f8'; for (const [rx, ry] of [[b.x - 5.33, y - 5.33], [b.x + w + 4.33, y - 5.33], [b.x - 5.33, y + hh + 3], [b.x + w + 4.33, y + hh + 3]]) g.fillRect(rx, ry, .67, .67);
    g.fillStyle = '#1a0f14'; g.fillRect(b.x - 2, y - 2, w + 4, hh + 4); g.fillStyle = '#2a170b'; g.fillRect(b.x - 1.33, y - 1.33, w + 2.67, hh + 2.67);
    for (let r = 0; r < b.rows; r++) for (let c = 0; c < b.cols; c++) {
      const px = b.x + c * b.cs, py = y + r * b.cs;
      if (tr.mask[r][c] !== '#') { g.fillStyle = '#4a4458'; g.fillRect(px, py, b.cs, b.cs); g.fillStyle = '#3a3448'; g.fillRect(px + .67, py + .67, b.cs - 1.33, b.cs - 1.33); g.fillStyle = '#5a5470'; g.fillRect(px + .67, py + .67, b.cs - 1.33, .67); g.fillStyle = '#6a6486'; g.fillRect(px + 1.33, py + 1.33, .67, .67); g.fillRect(px + b.cs - 2, py + b.cs - 2, .67, .67); continue; }
      g.fillStyle = (r + c) % 2 ? '#34200f' : '#2a170b'; g.fillRect(px, py, b.cs, b.cs); g.fillStyle = 'rgba(255,255,255,.04)'; g.fillRect(px, py + b.cs / 2, b.cs, .33);
      const v = b.fill[r][c]; if (v >= 0) { const pt = b.pop[r * 20 + c], off = pt != null ? -Math.round(Math.sin(pt * Math.PI) * 9) / 3 : 0; st.hi(cell(v, b.cs), px, py + off); if (pt != null && pt < .35) { g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(px + 1, py + 1 + off, b.cs - 2, b.cs - 2); } }
    }
    g.fillStyle = '#1a0f14'; g.fillRect(b.x - 6.67, y + hh + 1.67, 4.67, 4.67); g.fillRect(b.x + w + 2, y + hh + 1.67, 4.67, 4.67); g.fillStyle = '#e83a3a'; g.fillRect(b.x - 6, y + hh + 2.33, 3.33, 3.33); g.fillRect(b.x + w + 2.67, y + hh + 2.33, 3.33, 3.33); g.fillStyle = '#ffaba0'; g.fillRect(b.x - 6, y + hh + 2.33, 1.33, 1.33); g.fillRect(b.x + w + 2.67, y + hh + 2.33, 1.33, 1.33);
    g.fillStyle = '#1a0f14'; g.fillRect(b.x - .33, y + hh + 7.67, w + .67, 3.67); g.fillStyle = '#b8b8c4'; g.fillRect(b.x, y + hh + 8, w, 3); g.fillStyle = '#f0f0f8'; g.fillRect(b.x, y + hh + 8, w, .67); g.fillStyle = '#7a7a86'; g.fillRect(b.x, y + hh + 10.33, w, .67);
    g.fillStyle = '#1a0f14'; g.fillRect(b.x + w / 2 - 8.33, y + hh + 3.67, 16.67, 5); g.fillStyle = '#fff6d6'; g.fillRect(b.x + w / 2 - 7.67, y + hh + 4.33, 15.33, 3.67); g.fillStyle = '#1a0f14'; for (let k = 0; k < 6; k++) g.fillRect(b.x + w / 2 - 6 + k * 2.2, y + hh + 5, 1, 2);
    const spin = G.phase === 'out' ? (Math.floor(G.t * 24) % 3) / 3 : 0;
    st.hi(wheelSpr, b.x - 3, y + hh + 11); st.hi(wheelSpr, b.x + w - 9, y + hh + 11);
    g.fillStyle = '#5a5a66'; g.fillRect(b.x + 1.67, y + hh + 14.33 + spin, 4, .67); g.fillRect(b.x + w - 6.33, y + hh + 14.33 + spin, 4, .67);
    /* the job's name on the door */
    const name = tr.name, nw = name.length * 4 - .67; g.fillStyle = '#1a0f14'; g.fillRect(b.x + w / 2 - nw / 2 - 2, y - 14.33, nw + 4, 8); g.fillStyle = '#fff6d6'; g.fillRect(b.x + w / 2 - nw / 2 - 1.33, y - 13.67, nw + 2.67, 6.67);
    text(g, name, b.x + w / 2 - nw / 2, y - 12.8, '#1a0f14', 2 / 3);
    g.restore();
    /* fill gauge */
    if (G.phase === 'play') { const cov = b.filled / b.total, gx = 8, gw = W - 16; g.fillStyle = '#1a0f14'; g.fillRect(gx - 1, BELT_Y - 12, gw + 2, 6); g.fillStyle = '#34200f'; g.fillRect(gx, BELT_Y - 11, gw, 4); g.fillStyle = cov >= .85 ? '#74c648' : '#ffd23a'; g.fillRect(gx, BELT_Y - 11, gw * cov, 4); g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(gx, BELT_Y - 11, gw * cov, .67); g.fillStyle = '#fff6d6'; g.fillRect(gx + gw * .85, BELT_Y - 12, .67, 6); }
  }
  function draw() {
    g.clearRect(0, 0, W, H); g.save();
    if (G.shake > .3) g.translate(Math.round(rng(-G.shake, G.shake) * .5), Math.round(rng(-G.shake, G.shake) * .5));
    drawTruck();
    /* the dock worker: the player's monkey, up by the truck */
    if (worker.t > 0) worker.t -= 1 / 60;
    MGCrew.draw(st, worker.t > 0 ? worker.p : drag ? 'carry' : G.phase === 'play' && G.belt.length >= BELT_MAX ? 'scared' : Math.floor(G.t * 1.5) % 2 ? 'breathe' : 'idle', 15, 32);
    /* ghost in the bay */
    const gp = ghost(), b = G.bay;
    if (gp) { const p = drag.p, col = gp.ok ? 'rgba(255,246,214,.5)' : 'rgba(200,60,40,.5)'; (p.kind === 'ice' ? [[0, 0]] : p.cells).forEach(([dr, dc]) => { const rr = gp.r + dr, cc = gp.c + dc; if (!inMask(rr, cc) && !(rr >= 0 && rr < b.rows && cc >= 0 && cc < b.cols)) return; g.fillStyle = col; g.fillRect(b.x + cc * b.cs, b.y + rr * b.cs, b.cs, b.cs); }); }
    /* the conveyor belt */
    st.hi(beltBg, 2, BELT_Y - 2);
    const off = (G.t * 16) % 8; g.fillStyle = '#4a4a5a'; for (let x = 3 - off; x < W - 3; x += 8) { const xx = Math.max(3, x), ww = Math.min(1.33, W - 3 - xx); if (ww > 0) { g.fillRect(xx, BELT_Y + 7, ww, 42); } } g.fillStyle = '#5a5a6a'; for (let x = 3.67 - off; x < W - 3; x += 8) { const xx = Math.max(3, x); g.fillRect(xx, BELT_Y + 7, .5, 42); }
    G.belt.forEach((p, i) => {
      if (drag && drag.p === p) { drawPiece(p, p.x, BELT_Y + 28, 6, .25); return; }
      const [rr, cc] = dims(p.cells), s = Math.min(7, Math.floor(26 / Math.max(rr, cc))); const sel = cursor.sel === i || (G.sel === p);
      if (sel) { g.fillStyle = 'rgba(255,210,58,.3)'; g.fillRect(Math.round(p.x) - 13, BELT_Y + 3, 27, 48); }
      drawPiece(p, p.x, BELT_Y + 28 + Math.round(Math.sin(G.t * 3 + i * 1.7) * .8), s);
    });
    for (const f of G.falls) drawPiece(f.p, f.x, f.y, 6);
    if (G.belt.length >= BELT_MAX && Math.floor(G.t * 4) % 2) { g.fillStyle = '#e83a3a'; g.fillRect(3, BELT_Y - 1, 3, 54); }
    /* controls: next-delivery timer + send button, rotate */
    const sx = W - 14, nextT = G.queue.length ? clamp(1 - G.deliverT / interval(), 0, 1) : 0;
    g.fillStyle = '#1a0f14'; g.fillRect(sx - 6, BELT_Y + 30, 14, 20); g.fillStyle = '#34342a'; g.fillRect(sx - 5.33, BELT_Y + 30.67, 12.67, 18.67); g.fillStyle = G.queue.length ? '#ffd23a' : '#5a5a6a'; g.fillRect(sx - 5.33, BELT_Y + 49.33 - 18.67 * nextT, 12.67, 18.67 * nextT); g.fillStyle = '#1a0f14'; g.fillRect(sx - 2, BELT_Y + 34, 6, 1.33); g.fillRect(sx - 1, BELT_Y + 35.33, 4, 1.33); g.fillRect(sx, BELT_Y + 36.67, 2, 1.33);
    g.fillStyle = '#1a0f14'; g.fillRect(sx - 6, BELT_Y + 4, 14, 22); g.fillStyle = '#3a6ad8'; g.fillRect(sx - 5.33, BELT_Y + 4.67, 12.67, 20.67); g.fillStyle = '#8aa8ff'; g.fillRect(sx - 5.33, BELT_Y + 4.67, 12.67, 1.33); g.fillStyle = '#2a4aa0'; g.fillRect(sx - 5.33, BELT_Y + 23.67, 12.67, 1.67); text(g, 'R', sx - 1.5, BELT_Y + 11, '#fff6d6', 1);
    /* the stack in your hand */
    if (drag) drawPiece(drag.p, drag.x, drag.y - 14, G.bay.cs);
    /* keyboard cursor */
    if (cursor.sel >= 0 && !drag && G.belt[cursor.sel]) { const p = G.belt[cursor.sel], ok = canPlace(p, cursor.r, cursor.c); (p.kind === 'ice' ? [[0, 0]] : p.cells).forEach(([dr, dc]) => { const rr = cursor.r + dr, cc = cursor.c + dc; if (rr < b.rows && cc < b.cols && rr >= 0 && cc >= 0) { g.fillStyle = ok ? 'rgba(255,246,214,.5)' : 'rgba(200,60,40,.5)'; g.fillRect(b.x + cc * b.cs, b.y + rr * b.cs, b.cs, b.cs); } }); }
    if (G.undo.length && G.phase === 'play') text(g, 'Z UNDO', 6, BELT_Y + 55, 'rgba(255,246,214,.55)', 2 / 3);
    fx.draw(g); g.restore();
  }

  /* ---------- rotate / pick / drop ---------- */
  function rotate(p, dir = 1) { if (!p || p.kind === 'ice' || p.cells.length === 1) return; p.cells = dir > 0 ? rot90(p.cells) : rotCCW(p.cells); sfx.tick(); }
  function beltAt(px, py) { if (py < BELT_Y || py > BELT_Y + 52) return -1; let best = -1, bd = 1e9; G.belt.forEach((p, i) => { const d = Math.abs(px - p.x); if (d < bd) { bd = d; best = i; } }); return best >= 0 && bd < 15 ? best : -1; }
  const S = MG.shell({
    host, ui, id: 'packer', title: 'CRATE<span>PACKER</span>', sub: 'Pack the whole truck. Rotate to fit.',
    legend: [[cell(0, 13), '<em>drag</em> a stack into the bay'], [cell(2, 13), '<em>R</em> / tap / right-click rotates'], [cell(4, 13), '<em>85%</em> full = truck leaves'], [cell(5, 13), '<em>+50</em> golden: fits any gap'], [cell(6, 13), '<em class="ice">+300</em> diamond fills the rest'], [A3.heart, '<em>belt full</em> = a stack drops']],
    hint: 'drag · R rotate · Z undo · N sends the next stack', onStart: () => { newGame(); drag = null; }, score: () => G.score, spaceStarts: false,
  });
  addEventListener('contextmenu', e => { if (S.playing) { e.preventDefault(); const p = drag ? drag.p : G.belt[cursor.sel]; rotate(p); } });
  addEventListener('wheel', e => { if (S.playing && drag) { rotate(drag.p, e.deltaY > 0 ? 1 : -1); } }, { passive: true });
  addEventListener('pointerdown', ev => {
    if (!S.playing || G.over || G.phase !== 'play' || ev.target.closest('.mg-over,.mg-nav')) return; if (ev.button === 2) return; const [px, py] = st.toArt(ev);
    if (px > W - 21 && py >= BELT_Y + 3 && py < BELT_Y + 27) { rotate(G.sel || G.belt[0]); return; }                             // rotate button acts on the selected stack
    if (px > W - 21 && py >= BELT_Y + 28 && py < BELT_Y + 52) { if (G.queue.length) { deliver(); G.deliverT = interval(); G.score += 1; checkDone(); } return; }        // send next
    const i = beltAt(px, py); if (i >= 0) { const p = G.belt[i]; drag = { p, x: px, y: py, sx: px, sy: py, moved: false, wasSel: G.sel === p }; G.sel = p; host.style.cursor = 'grabbing'; sfx.tick(); cursor.sel = -1; }
  });
  addEventListener('pointermove', ev => { if (!drag) return; const [px, py] = st.toArt(ev); drag.x = px; drag.y = py; if (Math.hypot(px - drag.sx, py - drag.sy) > 3) drag.moved = true; });
  addEventListener('pointerup', () => {
    if (!drag) return; const d = drag; drag = null; host.style.cursor = 'grab'; const gp = d.moved ? (() => { drag = d; const q = ghost(); drag = null; return q; })() : null;
    if (!d.moved) { if (d.wasSel) rotate(d.p); return; }                                     // a tap on the selected stack rotates it
    if (gp && gp.ok) place(d.p, gp.r, gp.c); else if (gp) sfx.miss();
  });
  addEventListener('keydown', e => {
    if (!S.playing || G.over || G.phase !== 'play') return; const k = e.key.toLowerCase();
    if (k >= '1' && k <= '4') { const i = +k - 1; if (G.belt[i]) { cursor.sel = i; G.sel = G.belt[i]; const [rr, cc] = dims(G.belt[i].cells); cursor.r = clamp(cursor.r, 0, Math.max(0, G.bay.rows - rr)); cursor.c = clamp(cursor.c, 0, Math.max(0, G.bay.cols - cc)); sfx.tick(); } e.preventDefault(); return; }
    const p = cursor.sel >= 0 ? G.belt[cursor.sel] : null;
    if (k === 'r' || k === 'e') { rotate(p || G.sel || G.belt[0]); e.preventDefault(); }
    else if (k === 'q') { rotate(p || G.sel || G.belt[0], -1); e.preventDefault(); }
    else if (k === 'z') { undo(); e.preventDefault(); }
    else if (k === 'n' || k === 'enter') { if (G.queue.length) { deliver(); G.deliverT = interval(); G.score += 1; checkDone(); } e.preventDefault(); }
    else if (p) {
      const [rr, cc] = dims(p.cells);
      if (k === 'arrowleft' || k === 'a') cursor.c = Math.max(0, cursor.c - 1); else if (k === 'arrowright' || k === 'd') cursor.c = Math.min(G.bay.cols - cc, cursor.c + 1);
      else if (k === 'arrowup' || k === 'w') cursor.r = Math.max(0, cursor.r - 1); else if (k === 'arrowdown' || k === 's') cursor.r = Math.min(G.bay.rows - rr, cursor.r + 1);
      else if (k === ' ') { if (place(p, cursor.r, cursor.c)) { cursor.sel = G.belt.length ? 0 : -1; } else sfx.miss(); } else return; e.preventDefault();
    } else if (k === ' ' && G.belt.length) { cursor.sel = 0; G.sel = G.belt[0]; e.preventDefault(); }
  });

  newGame(); S.title();
  if (params.get('autostart')) { S.start(); botOn = !!params.get('bot'); for (let i = 0, n = (+params.get('warp') || 0) * 60; i < n; i++) update(1 / 60); }
  if (params.get('dbg')) setInterval(() => { document.title = `trucks=${G.trucks} placed=${G.placed} lost=${G.lost} hearts=${G.hearts} score=${G.score} round=${G.round} phase=${G.phase} q=${G.queue.length} belt=${G.belt.length} fill=${G.bay.filled}/${G.bay.total} dt=${G.deliverT.toFixed(1)}`; }, 200);
  MG.loop(update, draw);
  window.CP = { get G() { return G; }, S, place };
})();
