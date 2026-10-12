/* ============================================================
   CRATE PACKER: you have a loading bay and three odd-shaped stacks of banana crates. Drag them onto the 8x8 floor; every full row or column ships out.
   Chain shipments for a bigger combo multiplier. The game ends when none of your three stacks fit anywhere.
   Rare: a Golden crate ships its whole row and column (+100); the Diamond crate ships the entire bay (+500).
   Controls: drag a stack onto the floor, or press 1-3 to pick, arrows to move, Space to place. Standalone: no connection to the main game's save yet.
   ============================================================ */
(() => {
  'use strict';
  const { rng, clamp, lerp, sfx, h } = MG;
  const W = 120, H = 208, N = 8, CELL = 13, GX = (W - N * CELL) / 2, GY = 32, TRAY_Y = 152, MINI = 7;
  const params = new URLSearchParams(location.search), RARE = +params.get('rare') || 0;

  MG.boot();
  const A = MGArt.build();
  const host = document.getElementById('stage'), st = MG.stage(host, W, H, { padY: 40 }), g = st.g;
  host.style.cursor = 'grab';
  const ui = MG.ui(host, st, A.banana, 0), fx = MG.fx();
  document.querySelector('.mg-hearts').style.display = 'none';

  /* ---------- crate cells ---------- */
  const PAL = [['#e8b878', '#b57d3e', '#7a4a1e'], ['#a8ec76', '#4aa23c', '#1f6a2a'], ['#9ce0ff', '#3a8ec8', '#184c78'], ['#e4b0ff', '#8c58c8', '#4a2a78'], ['#ffaba0', '#d8403a', '#781c16'], ['#fff7b0', '#ffd23a', '#b38004'], ['#ffffff', '#9be8ff', '#2a86b8']];
  const cellCache = {};
  function cell(ci, s) {
    const id = ci + ':' + s; if (cellCache[id]) return cellCache[id];
    const c = document.createElement('canvas'); c.width = c.height = s; const x = c.getContext('2d'), p = PAL[ci];
    x.fillStyle = '#1a0f14'; x.fillRect(0, 0, s, s); x.fillStyle = p[1]; x.fillRect(1, 1, s - 2, s - 2);
    x.fillStyle = p[0]; x.fillRect(1, 1, s - 2, 1); x.fillRect(1, 1, 1, s - 2); x.fillStyle = p[2]; x.fillRect(1, s - 2, s - 2, 1); x.fillRect(s - 2, 1, 1, s - 2);
    if (s >= 11) { x.fillStyle = p[2]; x.fillRect(2, Math.floor(s / 2), s - 4, 1); x.fillStyle = '#b8b8c4'; x.fillRect(2, 2, 2, 2); x.fillRect(s - 4, 2, 2, 2); x.fillRect(2, s - 4, 2, 2); x.fillRect(s - 4, s - 4, 2, 2); if (ci < 5) { x.fillStyle = '#ffd23a'; x.fillRect(Math.floor(s / 2) - 1, 5, 3, 2); } }
    if (ci === 5) { x.fillStyle = '#fff'; x.fillRect(3, 3, 2, 1); } if (ci === 6) { x.fillStyle = '#fff'; x.fillRect(3, 3, 2, 2); }
    return (cellCache[id] = c);
  }

  /* ---------- the stacks (every rotation is generated) ---------- */
  const BASE = [
    [[0, 0]], [[0, 0], [0, 1]], [[0, 0], [0, 1], [0, 2]], [[0, 0], [0, 1], [0, 2], [0, 3]], [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]],
    [[0, 0], [0, 1], [1, 0], [1, 1]], [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2]], [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2]],
    [[0, 0], [1, 0], [1, 1]], [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2]], [[0, 0], [0, 1], [0, 2], [1, 1]], [[0, 1], [0, 2], [1, 0], [1, 1]], [[0, 0], [0, 1], [1, 1], [1, 2]],
    [[0, 0], [1, 0], [2, 0], [2, 1]], [[0, 0], [0, 1], [1, 0], [2, 0]],
  ];
  const WEIGHT = [3, 5, 5, 3, 1.5, 5, 2.5, 1.2, 5, 2, 3, 3, 3, 3, 3];
  const norm = cs => { const mr = Math.min(...cs.map(c => c[0])), mc = Math.min(...cs.map(c => c[1])); return cs.map(([r, c]) => [r - mr, c - mc]).sort((a, b) => a[0] - b[0] || a[1] - b[1]); };
  const rotate = cs => norm(cs.map(([r, c]) => [c, -r]));
  const SHAPES = []; BASE.forEach((b, i) => { const seen = new Set(); let cur = norm(b); for (let k = 0; k < 4; k++) { const key = JSON.stringify(cur); if (!seen.has(key)) { seen.add(key); SHAPES.push({ cells: cur, w: WEIGHT[i] / 1 }); } cur = rotate(cur); } });
  const size = cs => [Math.max(...cs.map(c => c[0])) + 1, Math.max(...cs.map(c => c[1])) + 1];

  /* ---------- state ---------- */
  let G = null, botOn = false, drag = null, cursor = { slot: -1, r: 3, c: 3 };
  function newGame() {
    G = { board: Array.from({ length: N }, () => Array(N).fill(-1)), tray: [], score: 0, streak: 0, noClear: 0, bestStreak: 0, placed: 0, shipped: 0, goldens: 0, diamonds: 0, perfects: 0, shake: 0, flash: [], dead: 0, t: 0, over: false };
    deal(); fx.clear(); render();
  }
  const mult = () => ui.mult(G.streak);
  function render() { ui.setScore(G.score); ui.setCombo(G.streak, mult()); }
  function fits(cells, r, c) { return cells.every(([dr, dc]) => { const rr = r + dr, cc = c + dc; return rr >= 0 && rr < N && cc >= 0 && cc < N && G.board[rr][cc] < 0; }); }
  function canPlaceAnywhere(p) { if (p.kind) { for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (G.board[r][c] < 0) return true; return false; } for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) if (fits(p.cells, r, c)) return true; return false; }
  function makePiece() {
    if (G.placed > 6 && Math.random() < .045 + RARE * .5) return { cells: [[0, 0]], kind: 'gold', ci: 5 };
    if (G.placed > 14 && Math.random() < .012 + RARE * .4) return { cells: [[0, 0]], kind: 'ice', ci: 6 };
    let tot = SHAPES.reduce((a, s) => a + s.w, 0), r = Math.random() * tot, s = SHAPES[0]; for (const sh of SHAPES) { r -= sh.w; if (r <= 0) { s = sh; break; } }
    return { cells: s.cells, ci: Math.floor(Math.random() * 5) };
  }
  function deal() {
    let tries = 0, t;
    do { t = [makePiece(), makePiece(), makePiece()]; tries++; } while (tries < 40 && !t.some(canPlaceAnywhere));
    G.tray = t.map((p, i) => ({ ...p, used: false, pop: .3 + i * .08 }));
    if (!G.tray.some(canPlaceAnywhere)) endGame();
  }

  /* ---------- placing + shipping ---------- */
  function place(slot, r, c) {
    const p = G.tray[slot]; if (!p || p.used) return false;
    const rwd = p.kind ? G.board[r] && G.board[r][c] < 0 : fits(p.cells, r, c); if (!rwd) return false;
    p.used = true; G.placed++; let pts = p.cells.length, lines = 0; const cleared = [];
    p.cells.forEach(([dr, dc]) => { G.board[r + dr][c + dc] = p.ci; });
    sfx.clack(3); p.cells.forEach(([dr, dc]) => fx.burst(GX + (c + dc) * CELL + 6, GY + (r + dr) * CELL + 6, ['#c9b88a', '#fff6d6'], 2, 18, 30, .2));
    const rowsFull = [], colsFull = [];
    for (let i = 0; i < N; i++) { if (G.board[i].every(v => v >= 0)) rowsFull.push(i); if (G.board.every(row => row[i] >= 0)) colsFull.push(i); }
    const killCells = new Set(); rowsFull.forEach(i => { for (let j = 0; j < N; j++) killCells.add(i * N + j); }); colsFull.forEach(j => { for (let i = 0; i < N; i++) killCells.add(i * N + j); });
    lines = rowsFull.length + colsFull.length;
    if (p.kind === 'gold') { for (let j = 0; j < N; j++) { killCells.add(r * N + j); killCells.add(j * N + c); } lines = Math.max(lines, 2); G.goldens++; pts += 100; sfx.golden(); ui.say('GOLDEN CRATE<small>row + column shipped</small>'); fx.ring(GX + c * CELL + 6, GY + r * CELL + 6, '#ffd23a', 50); }
    if (p.kind === 'ice') { for (let i = 0; i < N * N; i++) killCells.add(i); lines = Math.max(lines, 8); G.diamonds++; pts += 500; sfx.diamond(); ui.doFlash('#e8fbff'); ui.say('DIAMOND CRATE<small>the whole bay ships out! +500</small>', 'ice'); G.shake = 6; fx.ring(W / 2, GY + 52, '#9be8ff', 70); }
    if (killCells.size) {
      G.noClear = 0; G.streak++; G.bestStreak = Math.max(G.bestStreak, G.streak); G.shipped += killCells.size;
      const m = mult(); pts += Math.round(10 * lines * lines * m * (killCells.size >= 16 ? 1.5 : 1));
      killCells.forEach(k => { const rr = Math.floor(k / N), cc = k % N, ci = G.board[rr][cc]; if (ci >= 0) { G.flash.push({ r: rr, c: cc, ci, t: 0 }); fx.burst(GX + cc * CELL + 6, GY + rr * CELL + 6, [PAL[ci][0], PAL[ci][1], '#fff6d6'], 4, 50, 120, .5); G.board[rr][cc] = -1; } });
      if (!p.kind) { sfx.letters(); if (lines >= 2) sfx.golden(); ui.floatText(W / 2, GY + 56, lines === 1 ? 'SHIPPED!' : lines + ' LINES!', 'gold big'); G.shake = Math.max(G.shake, 2 + lines); }
      if (G.streak >= 2) { ui.floatText(W / 2, GY + 70, `CHAIN x${G.streak}`, 'gold'); ui.pulseCombo(); }
      if (G.board.every(row => row.every(v => v < 0))) { G.perfects++; pts += 300; ui.floatText(W / 2, GY + 40, 'EMPTY BAY +300', 'ice big'); sfx.diamond(); fx.ring(W / 2, GY + 52, '#9be8ff', 70); }
    } else { G.noClear++; if (G.noClear >= 3) G.streak = 0; }
    G.score += pts; ui.bump(); ui.floatText(GX + c * CELL + 6, GY + r * CELL - 2, '+' + pts, killCells.size ? 'gold' : ''); render();
    if (G.tray.every(q => q.used)) deal(); else if (!G.tray.some(q => !q.used && canPlaceAnywhere(q))) endGame();
    return true;
  }
  function endGame() { if (G.over) return; G.over = true; G.dead = 1.1; sfx.over(); ui.say('NO ROOM!', ''); G.shake = 4; }
  const hint = () => { for (const [i, p] of G.tray.entries()) { if (p.used) continue; for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) { const ok = p.kind ? G.board[r][c] < 0 : fits(p.cells, r, c); if (ok) return [i, r, c]; } } return null; };

  /* ---------- update ---------- */
  function update(rdt) {
    fx.update(rdt);
    if (!G || !S.playing) return;
    G.t += rdt; G.shake = Math.max(0, G.shake - rdt * 16);
    for (let i = G.flash.length - 1; i >= 0; i--) { G.flash[i].t += rdt; if (G.flash[i].t > .3) G.flash.splice(i, 1); }
    G.tray.forEach(p => { if (p.pop > 0) p.pop -= rdt; });
    if (G.dead > 0) { G.dead -= rdt; if (G.dead <= 0) { G.dead = 0; S.finish([['CRATES PLACED', G.placed], ['SHIPPED', G.shipped], ['BEST CHAIN', G.bestStreak], ['EMPTY BAYS', G.perfects], ['GOLD / DIAMOND', `${G.goldens} / ${G.diamonds}`]]); } }
    if (botOn && !G.over) { G.bt = (G.bt || 0) + rdt; if (G.bt > .22) { G.bt = 0; const h2 = hint(); if (h2) place(h2[0], h2[1], h2[2]); } }
  }

  /* ---------- draw ---------- */
  function slotX(i) { return 20 + i * 40; }
  function trayScale(p) { const [rr, cc] = size(p.cells); return Math.min(MINI, Math.floor(34 / Math.max(rr, cc))); }
  function ghostPos() {
    if (!drag) return null; const p = G.tray[drag.slot], [rr, cc] = size(p.cells); const c = Math.round((drag.x - cc * CELL / 2 - GX) / CELL), r = Math.round((drag.y - 14 - rr * CELL / 2 - GY) / CELL);
    return { r, c, ok: p.kind ? G.board[r] && G.board[r][c] < 0 : fits(p.cells, r, c) };
  }
  function draw() {
    g.clearRect(0, 0, W, H); g.save();
    if (G.shake > .3) g.translate(Math.round(rng(-G.shake, G.shake) * .5), Math.round(rng(-G.shake, G.shake) * .5));
    /* the bay: wooden frame around a dark floor with a grid */
    g.fillStyle = '#1a0f14'; g.fillRect(GX - 4, GY - 4, N * CELL + 8, N * CELL + 8); g.fillStyle = '#5a3517'; g.fillRect(GX - 3, GY - 3, N * CELL + 6, N * CELL + 6); g.fillStyle = '#b57d3e'; g.fillRect(GX - 3, GY - 3, N * CELL + 6, 1);
    g.fillStyle = '#2a170b'; g.fillRect(GX, GY, N * CELL, N * CELL);
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) { g.fillStyle = (r + c) % 2 ? '#34200f' : '#2a170b'; g.fillRect(GX + c * CELL, GY + r * CELL, CELL, CELL); }
    const gp = ghostPos(), p0 = drag && G.tray[drag.slot], willClear = new Set();
    if (gp && gp.ok) {
      /* preview which rows/columns would ship */
      const tmp = G.board.map(r => r.slice()); p0.cells.forEach(([dr, dc]) => { tmp[gp.r + dr][gp.c + dc] = 1; });
      for (let i = 0; i < N; i++) { if (tmp[i].every(v => v >= 0)) for (let j = 0; j < N; j++) willClear.add(i * N + j); if (tmp.every(row => row[i] >= 0)) for (let j = 0; j < N; j++) willClear.add(j * N + i); }
      if (p0.kind === 'gold') for (let j = 0; j < N; j++) { willClear.add(gp.r * N + j); willClear.add(j * N + gp.c); } if (p0.kind === 'ice') for (let i = 0; i < N * N; i++) willClear.add(i);
    }
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) { const v = G.board[r][c]; if (v >= 0) { g.drawImage(cell(v, CELL), GX + c * CELL, GY + r * CELL); if (willClear.has(r * N + c)) { g.fillStyle = 'rgba(255,246,214,' + (.25 + .2 * Math.sin(G.t * 12)) + ')'; g.fillRect(GX + c * CELL, GY + r * CELL, CELL, CELL); } } }
    for (const f of G.flash) { const k = 1 - f.t / .3; g.globalAlpha = k; g.fillStyle = '#fff'; g.fillRect(GX + f.c * CELL, GY + f.r * CELL, CELL, CELL); g.globalAlpha = 1; }
    /* ghost on the floor */
    if (gp) { const col = gp.ok ? 'rgba(255,246,214,.45)' : 'rgba(200,60,40,.45)'; p0.cells.forEach(([dr, dc]) => { const rr = gp.r + dr, cc = gp.c + dc; if (rr < 0 || rr >= N || cc < 0 || cc >= N) return; g.fillStyle = col; g.fillRect(GX + cc * CELL, GY + rr * CELL, CELL, CELL); }); }
    /* the tray */
    g.fillStyle = '#1a0f14'; g.fillRect(2, TRAY_Y - 6, W - 4, 52); g.fillStyle = '#3a2210'; g.fillRect(3, TRAY_Y - 5, W - 6, 50); g.fillStyle = '#5a3517'; g.fillRect(3, TRAY_Y - 5, W - 6, 1);
    G.tray.forEach((p, i) => {
      if (p.used || (drag && drag.slot === i)) { if (drag && drag.slot === i) { g.globalAlpha = .3; drawPiece(p, slotX(i), TRAY_Y + 20, trayScale(p)); g.globalAlpha = 1; } return; }
      const k = p.pop > 0 ? 1 - p.pop / .38 : 1, sc = trayScale(p), off = Math.round((1 - k) * 12);
      const sel = cursor.slot === i; if (sel) { g.fillStyle = 'rgba(255,210,58,.3)'; g.fillRect(slotX(i) - 19, TRAY_Y - 3, 38, 46); }
      g.globalAlpha = canPlaceAnywhere(p) ? 1 : .35; drawPiece(p, slotX(i), TRAY_Y + 20 + off, sc); g.globalAlpha = 1;
    });
    /* keyboard cursor */
    if (cursor.slot >= 0 && !drag && G.tray[cursor.slot] && !G.tray[cursor.slot].used) { const p = G.tray[cursor.slot], ok = p.kind ? G.board[cursor.r][cursor.c] < 0 : fits(p.cells, cursor.r, cursor.c); p.cells.forEach(([dr, dc]) => { const rr = cursor.r + dr, cc = cursor.c + dc; if (rr < N && cc < N) { g.fillStyle = ok ? 'rgba(255,246,214,.5)' : 'rgba(200,60,40,.5)'; g.fillRect(GX + cc * CELL, GY + rr * CELL, CELL, CELL); } }); }
    /* the piece in your hand */
    if (drag) { const p = G.tray[drag.slot]; drawPiece(p, drag.x, drag.y - 14, CELL); }
    fx.draw(g); g.restore();
  }
  function drawPiece(p, cx, cy, s) {
    const [rr, cc] = size(p.cells), x0 = Math.round(cx - cc * s / 2), y0 = Math.round(cy - rr * s / 2), sp = cell(p.ci, s);
    p.cells.forEach(([r, c]) => g.drawImage(sp, x0 + c * s, y0 + r * s));
    if (p.kind && Math.floor(performance.now() / 120) % 2 === 0) fx.spark(cx, cy, p.kind === 'ice' ? '#9be8ff' : '#fff08c');
  }

  /* ---------- shell + input ---------- */
  const S = MG.shell({
    host, ui, id: 'packer', title: 'CRATE<span>PACKER</span>', sub: 'Fill the bay. Ship the lines.',
    legend: [[cell(0, 13), '<em>full row/col</em> ships'], [cell(2, 13), '<em>chain</em> shipments = combo'], [cell(5, 13), '<em>+100</em> golden: row + col'], [cell(6, 13), '<em class="ice">+500</em> diamond: all']],
    hint: 'drag stacks onto the floor · or 1-3, arrows, Space', onStart: () => { newGame(); cursor = { slot: -1, r: 3, c: 3 }; }, score: () => G.score, spaceStarts: false,
  });
  addEventListener('pointerdown', ev => {
    if (!S.playing || G.over || ev.target.closest('.mg-over,.mg-nav')) return; const [px, py] = st.toArt(ev); if (py < TRAY_Y - 8) return;
    let best = -1, bd = 1e9; G.tray.forEach((p, i) => { if (p.used) return; const d = Math.abs(px - slotX(i)); if (d < bd) { bd = d; best = i; } });
    if (best >= 0 && bd < 21) { drag = { slot: best, x: px, y: py }; host.style.cursor = 'grabbing'; cursor.slot = -1; sfx.tick(); }
  });
  addEventListener('pointermove', ev => { if (!drag) return; const [px, py] = st.toArt(ev); drag.x = px; drag.y = py; });
  addEventListener('pointerup', () => {
    if (!drag) return; const gp = ghostPos(), d = drag; drag = null; host.style.cursor = 'grab';
    if (gp && gp.ok) place(d.slot, gp.r, gp.c); else if (gp) { sfx.miss(); }
  });
  addEventListener('keydown', e => {
    if (!S.playing || G.over) return; const k = e.key.toLowerCase();
    if (k >= '1' && k <= '3') { const i = +k - 1; if (G.tray[i] && !G.tray[i].used) { cursor.slot = i; const [rr, cc] = size(G.tray[i].cells); cursor.r = clamp(cursor.r, 0, N - rr); cursor.c = clamp(cursor.c, 0, N - cc); sfx.tick(); } e.preventDefault(); return; }
    if (cursor.slot < 0) { if ([' ', 'enter'].includes(k)) { const i = G.tray.findIndex(p => !p.used); if (i >= 0) cursor.slot = i; e.preventDefault(); } return; }
    const p = G.tray[cursor.slot], [rr, cc] = p ? size(p.cells) : [1, 1];
    if (k === 'arrowleft' || k === 'a') cursor.c = Math.max(0, cursor.c - 1); else if (k === 'arrowright' || k === 'd') cursor.c = Math.min(N - cc, cursor.c + 1);
    else if (k === 'arrowup' || k === 'w') cursor.r = Math.max(0, cursor.r - 1); else if (k === 'arrowdown' || k === 's') cursor.r = Math.min(N - rr, cursor.r + 1);
    else if (k === ' ' || k === 'enter') { if (place(cursor.slot, cursor.r, cursor.c)) { const n = G.tray.findIndex(q => !q.used); cursor.slot = n; } else sfx.miss(); }
    else return; e.preventDefault();
  });

  newGame(); S.title();
  if (params.get('autostart')) { S.start(); botOn = !!params.get('bot'); for (let i = 0, n = (+params.get('warp') || 0) * 60; i < n; i++) update(1 / 60); }
  if (params.get('dbg')) setInterval(() => { document.title = `score=${G.score} placed=${G.placed} shipped=${G.shipped} over=${G.over}`; }, 200);
  MG.loop(update, draw);
  window.CP = { get G() { return G; }, S, place };
})();
