/* ============================================================
   LIBRARY TIDY: titles from the monkeys' own Library fall toward the floor; send each to the right shelf (tap it, or press 1-5).
   Books, kids' stories, films, TV, radio plays, sketches and songs all turn up. Early on the spines are colour coded; later you have to know.
   Fill a shelf for a bonus. Misfiled or dropped titles cost hearts. Rare: a Golden Edition pays x3 and slows the room, the Diamond First Edition tidies everything on screen.
   Standalone: titles come from a small snapshot (library-titles.js) of the real Library.
   ============================================================ */
(() => {
  'use strict';
  const { rng, clamp, lerp, sfx, h } = MG;
  const W = 120, H = 208, FLOOR = 132, SHELF_Y = 140, CAP = 6;
  const params = new URLSearchParams(location.search), RARE = +params.get('rare') || 0;
  const CATS = [
    { k: 'books', label: 'BOOKS', col: '#d8403a', dk: '#781c16' }, { k: 'films', label: 'FILMS', col: '#8c58c8', dk: '#4a2a78' }, { k: 'songs', label: 'SONGS', col: '#e86aa0', dk: '#8a2a5a' },
    { k: 'tv', label: 'TV', col: '#3a6ad8', dk: '#1a2872' }, { k: 'kids', label: 'KIDS', col: '#e8c43a', dk: '#8a6a10' }, { k: 'radio', label: 'RADIO', col: '#3aa85a', dk: '#14582a' }, { k: 'sketch', label: 'SKIT', col: '#f08a1a', dk: '#8a4a0a' },
  ];
  const FALLBACK = { books: ['THE APES OF WRATH', 'THE GREAT GIBBONSBY'], films: ['APE OF THUNDER', 'BANANAS FOR THE JURY'], songs: ['ARENA OF THE LAST BANANA', 'BOSS OF THE BREAKROOM'], tv: ['APE SPACE', 'GAME OF GROANS'], kids: ['THE PEA TEST', 'GOODNIGHT BANANA'], radio: ['AFTER THE LAST PEANUT', 'NIGHT WATCH FORECAST'], sketch: ['BREAKING BANANA', 'THE CANOPY CHANNEL'] };
  const TITLES = Object.assign({}, FALLBACK, window.LIB_TITLES || {});

  MG.boot();
  const A = MGArt.build(), FONT = MGArt.FONT;
  const host = document.getElementById('stage'), st = MG.stage(host, W, H, { padY: 40 }), g = st.g;
  host.style.cursor = 'pointer';
  const ui = MG.ui(host, st, A.banana), fx = MG.fx();

  const text = (txt, x, y, col) => { g.fillStyle = col; for (let k = 0; k < txt.length; k++) { const f = FONT[txt[k]]; if (f) f.split('').forEach((b, i) => { if (b === '1') g.fillRect(x + k * 4 + (i % 3), y + Math.floor(i / 3), 1, 1); }); } };
  function wrap(t, max) { const words = t.split(' '), lines = []; let cur = ''; for (const w of words) { if ((cur + ' ' + w).trim().length <= max) cur = (cur + ' ' + w).trim(); else { if (cur) lines.push(cur); cur = w.slice(0, max); } } if (cur) lines.push(cur); return lines.slice(0, 3); }

  /* ---------- state ---------- */
  let G = null, botOn = false, order = [];
  function newGame() {
    order = CATS.slice().sort(() => Math.random() - .5);
    G = { t: 0, score: 0, hearts: 3, combo: 0, bestCombo: 0, cards: [], shelves: order.slice(0, 3).map(c => ({ ...c, n: 0, flash: 0, tint: [] })), spawnT: 1, sorted: 0, misfiled: 0, dropped: 0, full: 0, goldens: 0, diamonds: 0, shake: 0, slowT: 0, dead: 0, unlocked: 3, bt: 0 };
    fx.clear(); render();
  }
  const mult = () => ui.mult(G.combo);
  function render(anim) { ui.setScore(G.score); ui.setHearts(G.hearts, anim); ui.setCombo(G.combo, mult()); }
  const shelfX = (i, n = G.shelves.length) => (i + .5) * W / n, colW = (n = G.shelves.length) => W / n;

  /* ---------- cards ---------- */
  function spawn() {
    const sh = G.shelves[Math.floor(Math.random() * G.shelves.length)], pool = TITLES[sh.k] || FALLBACK[sh.k], title = pool[Math.floor(Math.random() * pool.length)];
    const d = clamp(G.t / 120, 0, 1), lines = wrap(title, 13); let kind = 'normal';
    if (G.t > 12 && Math.random() < .035 + RARE * .6) kind = 'gold'; else if (G.t > 30 && Math.random() < .009 + RARE * .6) kind = 'ice';
    const hint = Math.random() < clamp(1.05 - G.t / 75, 0, 1), cardH = 9 + lines.length * 6;
    G.cards.push({ title, lines, cat: sh.k, col: sh.col, hint, kind, w: 62, h: cardH, x: W / 2 + rng(-12, 12), y: -cardH, vy: lerp(20, 44, d) * rng(.9, 1.1), state: 'fall', t: 0, born: G.t });
  }
  const active = () => { let a = null; for (const c of G.cards) if (c.state === 'fall' && (!a || c.y > a.y)) a = c; return a; };

  function send(c, shelfIdx, ok) {
    c.state = ok ? 'fly' : 'bounce'; c.t = 0; c.sx = c.x; c.sy = c.y; c.si = shelfIdx; c.tx = shelfX(shelfIdx); c.ty = SHELF_Y + 4;
  }
  function pick(idx) {
    if (!S.playing || G.dead || idx < 0 || idx >= G.shelves.length) return; const c = active(); if (!c) return; const sh = G.shelves[idx]; sh.flash = .15;
    if (c.kind === 'ice') { magic(c, idx); return; }
    if (sh.k === c.cat) {
      const k = c.kind === 'gold' ? 3 : 1, pts = Math.round((10 + 10 * clamp(1 - (c.y + c.h) / FLOOR, 0, 1)) * mult() * k); G.score += pts; G.combo++; G.bestCombo = Math.max(G.bestCombo, G.combo); G.sorted++; c.pts = pts; send(c, idx, true);
      ui.bump(); sfx.clack(Math.min(12, G.combo)); sfx.ding(Math.min(10, G.combo)); ui.floatText(shelfX(idx), SHELF_Y - 8, '+' + pts, k > 1 ? 'gold' : G.combo > 5 ? 'gold' : '');
      if (c.kind === 'gold') { G.goldens++; G.slowT = 6; sfx.golden(); fx.ring(c.x, c.y + c.h / 2, '#ffd23a', 40); fx.burst(c.x, c.y, ['#ffd23a', '#fff08c', '#fffbe0'], 18, 80, 60, .8); ui.say('GOLDEN EDITION<small>x3 · the room slows · 6s</small>'); if (G.hearts < 3) { G.hearts++; ui.floatText(W / 2, 60, '+HEART', 'gold'); } }
      if (G.combo % 6 === 0) { ui.pulseCombo(); ui.floatText(W / 2, 70, `STREAK x${mult()}`, 'gold'); sfx.golden(); }
    } else {
      G.misfiled++; G.combo = 0; G.hearts--; G.shake = 5; send(c, idx, false); sfx.bonk(); ui.doFlash('#c0392b'); ui.floatText(shelfX(idx), SHELF_Y - 8, `THAT IS ${CATS.find(q => q.k === c.cat).label}`, 'bad'); fx.burst(shelfX(idx), SHELF_Y, ['#c0392b', '#fff6d6'], 10, 60, 100, .5);
      if (G.hearts <= 0) { G.dead = 1.1; sfx.over(); }
    }
    render(!(sh.k === c.cat));
  }
  function magic(c, idx) {
    G.diamonds++; G.score += 300; sfx.diamond(); ui.doFlash('#e8fbff'); ui.say('FIRST EDITION<small>everything on screen gets tidied · +300</small>', 'ice'); G.shake = 4; fx.ring(c.x, c.y + c.h / 2, '#9be8ff', 56); c.state = 'gone';
    for (const q of G.cards) if (q.state === 'fall') { const si = G.shelves.findIndex(s => s.k === q.cat); q.pts = Math.round(20 * mult()); G.score += q.pts; G.combo++; G.sorted++; send(q, si, true); }
    G.bestCombo = Math.max(G.bestCombo, G.combo); render();
  }
  function arrive(c) {
    const sh = G.shelves[c.si]; if (!sh) return; sh.n++; sh.tint.push(rng(0, 1)); sh.flash = .2; fx.burst(c.tx, c.ty, [sh.col, '#fff6d6'], 6, 40, 80, .35);
    if (sh.n >= CAP) { const bonus = Math.round(100 * mult()); G.full++; G.score += bonus; G.combo++; sfx.golden(); ui.say(`${sh.label} SHELF FULL!<small>+${bonus}</small>`); fx.ring(shelfX(G.shelves.indexOf(sh)), SHELF_Y + 24, '#ffd23a', 40); fx.burst(shelfX(G.shelves.indexOf(sh)), SHELF_Y + 20, ['#ffd23a', '#fff08c', sh.col], 22, 90, 80, .9); sh.n = 0; sh.tint = []; ui.bump(); render(); }
  }

  /* ---------- update ---------- */
  function update(rdt) {
    fx.update(rdt);
    if (!G || !S.playing) return;
    const slow = G.slowT > 0 ? .5 : 1, dt = rdt * slow; G.t += rdt; G.shake = Math.max(0, G.shake - rdt * 18); if (G.slowT > 0) G.slowT -= rdt;
    ui.setMeter(G.slowT / 6, false);
    if (G.dead > 0) { G.dead -= rdt; if (G.dead <= 0) S.finish([['SORTED', G.sorted], ['MISFILED', G.misfiled], ['DROPPED', G.dropped], ['SHELVES FILLED', G.full], ['BEST STREAK', G.bestCombo], ['GOLD / DIAMOND', `${G.goldens} / ${G.diamonds}`]]); }
    if (G.unlocked === 3 && G.t > 22) { unlock(); } else if (G.unlocked === 4 && G.t > 52) { unlock(); }
    for (const s of G.shelves) if (s.flash > 0) s.flash -= rdt;
    const d = clamp(G.t / 120, 0, 1); G.spawnT -= dt;
    const tail = G.cards.filter(c => c.state === 'fall').reduce((m, c) => Math.min(m, c.y), 1e9);
    if (G.hearts > 0 && G.spawnT <= 0 && tail > 24) { spawn(); G.spawnT = lerp(3.4, 1.35, d) * rng(.85, 1.2); }
    for (let i = G.cards.length - 1; i >= 0; i--) {
      const c = G.cards[i]; c.t += dt;
      if (c.state === 'fall') { c.y += c.vy * dt; if (c.y + c.h >= FLOOR) { c.state = 'drop'; c.t = 0; G.dropped++; G.combo = 0; G.hearts--; G.shake = 4; sfx.thud(); sfx.miss(); ui.floatText(c.x, FLOOR - 8, 'DROPPED!', 'bad'); fx.burst(c.x, FLOOR, ['#c9b88a', '#fff6d6'], 8, 40, 80, .4); render(true); if (G.hearts <= 0 && !G.dead) { G.dead = 1.1; sfx.over(); } } }
      else if (c.state === 'fly') { const k = clamp(c.t / .26, 0, 1); c.x = lerp(c.sx, c.tx, k); c.y = lerp(c.sy, c.ty, k) - Math.sin(k * Math.PI) * 14; if (k >= 1) { c.state = 'gone'; arrive(c); } }
      else if (c.state === 'bounce') { const k = c.t / .5; c.x += (c.x < W / 2 ? -1 : 1) * 40 * dt; c.y += (-60 + c.t * 260) * dt; if (c.t > .6) c.state = 'gone'; }
      else if (c.state === 'drop') { c.y += 140 * dt; if (c.t > .5) c.state = 'gone'; }
      if (c.state === 'gone') G.cards.splice(i, 1);
    }
    if (botOn) { G.bt += rdt; const c = active(); if (c && G.bt > .55) { G.bt = 0; pick(G.shelves.findIndex(s => s.k === c.cat)); } }
  }
  function unlock() { const c = order[G.unlocked]; G.shelves.push({ ...c, n: 0, flash: 0, tint: [] }); G.unlocked++; sfx.golden(); ui.say(`NEW SHELF: ${c.label}`); }

  /* ---------- draw ---------- */
  function draw() {
    g.clearRect(0, 0, W, H); g.save();
    if (G.shake > .3) g.translate(Math.round(rng(-G.shake, G.shake) * .5), Math.round(rng(-G.shake, G.shake) * .5));
    /* the reading room: wall, window light, the floor line */
    g.fillStyle = '#3a2418'; g.fillRect(0, 0, W, H); g.fillStyle = '#4a2e1e'; for (let x = 0; x < W; x += 12) g.fillRect(x, 0, 1, FLOOR);
    g.fillStyle = '#2a170b'; for (let y = 22; y < FLOOR; y += 24) g.fillRect(0, y, W, 2);
    g.fillStyle = 'rgba(255,230,160,.06)'; g.fillRect(20, 0, 22, FLOOR); g.fillRect(78, 0, 22, FLOOR);
    g.fillStyle = '#1a0f14'; g.fillRect(0, FLOOR, W, 8); g.fillStyle = '#c0392b'; for (let x = 0; x < W; x += 6) g.fillRect(x, FLOOR + 1, 3, 2); g.fillStyle = '#7a4a1e'; g.fillRect(0, FLOOR + 3, W, 5);
    /* shelves */
    const n = G.shelves.length, cw = colW();
    G.shelves.forEach((s, i) => {
      const x0 = Math.round(i * cw), w = Math.round(cw) - 1, cx = Math.round(shelfX(i)), fl = s.flash > 0;
      g.fillStyle = '#1a0f14'; g.fillRect(x0, SHELF_Y, w + 1, H - SHELF_Y); g.fillStyle = '#5a3517'; g.fillRect(x0 + 1, SHELF_Y + 1, w - 1, H - SHELF_Y - 2); g.fillStyle = '#2a170b'; g.fillRect(x0 + 3, SHELF_Y + 14, w - 5, CAP * 7 + 2);
      g.fillStyle = fl ? '#fff6d6' : s.col; g.fillRect(x0 + 1, SHELF_Y + 1, w - 1, 11); g.fillStyle = s.dk; g.fillRect(x0 + 1, SHELF_Y + 11, w - 1, 1);
      const lw = s.label.length * 4 - 1; text(s.label, Math.round(cx - lw / 2), SHELF_Y + 4, fl ? '#1a0f14' : '#fff6d6');
      for (let b = 0; b < s.n; b++) { const by = SHELF_Y + 14 + (CAP - 1 - b) * 7 + 1, shade = s.tint[b] || 0; g.fillStyle = '#1a0f14'; g.fillRect(x0 + 4, by, w - 7, 7); g.fillStyle = shade > .5 ? s.col : s.dk; g.fillRect(x0 + 5, by + 1, w - 9, 5); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(x0 + 5, by + 1, w - 9, 1); g.fillStyle = '#ffd23a'; g.fillRect(x0 + 7, by + 3, 3, 1); }
      g.fillStyle = '#b57d3e'; g.fillRect(x0 + 3, SHELF_Y + 14 + CAP * 7 + 2, w - 5, 2);
      const kf = FONT[String(i + 1)]; g.fillStyle = '#fff6d6'; if (kf) kf.split('').forEach((b, q) => { if (b === '1') g.fillRect(x0 + 3 + (q % 3), SHELF_Y + 14 + CAP * 7 + 6 + Math.floor(q / 3), 1, 1); });
    });
    /* cards */
    const act = active();
    for (const c of G.cards) {
      if (c.state === 'gone') continue; const x = Math.round(c.x - c.w / 2), y = Math.round(c.y), fall = c.state === 'fall', shake = c.state === 'drop' ? (Math.floor(c.t * 30) % 2) : 0;
      g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(x + 2, y + 2, c.w, c.h);
      g.fillStyle = '#1a0f14'; g.fillRect(x - 1 + shake, y - 1, c.w + 2, c.h + 2);
      const spine = c.kind === 'gold' ? '#ffd23a' : c.kind === 'ice' ? '#9be8ff' : c.hint ? c.col : '#8c8670';
      g.fillStyle = c.kind === 'ice' ? '#e8fbff' : c.kind === 'gold' ? '#fff3b0' : '#fff6d6'; g.fillRect(x + shake, y, c.w, c.h); g.fillStyle = spine; g.fillRect(x + shake, y, 5, c.h); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x + 4 + shake, y, 1, c.h); g.fillStyle = '#c9b88a'; g.fillRect(x + shake, y + c.h - 1, c.w, 1);
      c.lines.forEach((ln, i) => text(ln, x + 8 + shake, y + 4 + i * 6, '#1a0f14'));
      if (c.kind !== 'normal' && Math.floor(G.t * 10) % 2 === 0) fx.spark(x + c.w - 4, y + 3, c.kind === 'ice' ? '#9be8ff' : '#fff08c');
      if (c === act) { const b = Math.floor(performance.now() / 200) % 2; g.fillStyle = '#ffd23a'; g.fillRect(x - 5 - b, y + Math.floor(c.h / 2) - 2, 3, 5); g.fillRect(x + c.w + 2 + b, y + Math.floor(c.h / 2) - 2, 3, 5); }
    }
    if (G.slowT > 0) { g.fillStyle = 'rgba(255,210,58,.08)'; g.fillRect(0, 0, W, H); }
    fx.draw(g); g.restore();
  }

  /* ---------- shell + input ---------- */
  const S = MG.shell({
    host, ui, id: 'tidy', title: 'LIBRARY<span>TIDY</span>', sub: 'Shelve the Library, one title at a time.',
    legend: [[A.fruits[4], '<em>tap</em> a shelf · keys 1-5'], [A.coconut, '<em class="bad">misfile</em> or drop = -1 heart'], [A.golden, '<em>x3</em> golden edition'], [A.diamond, '<em class="ice">first edition</em> tidies all'], [A.heart, '<em>full shelf</em> = bonus'], [A.banana, '<em>spines</em> hint, then fade']],
    hint: 'read the title, tap the shelf it belongs on', spaceStarts: true, onStart: () => newGame(), score: () => G.score,
  });
  addEventListener('pointerdown', ev => { if (!S.playing || ev.target.closest('.mg-over,.mg-nav')) return; const [px, py] = st.toArt(ev); if (py < SHELF_Y - 4) return; pick(clamp(Math.floor(px / colW()), 0, G.shelves.length - 1)); });
  addEventListener('keydown', e => { if (!S.playing) return; if (e.key >= '1' && e.key <= '5') { pick(+e.key - 1); e.preventDefault(); } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { /* reserved */ } });

  newGame(); S.title();
  if (params.get('autostart')) { S.start(); botOn = !!params.get('bot'); for (let i = 0, n = (+params.get('warp') || 0) * 60; i < n; i++) update(1 / 60); }
  if (params.get('dbg')) setInterval(() => { document.title = `sorted=${G.sorted} hearts=${G.hearts} score=${G.score} t=${Math.round(G.t)} shelves=${G.shelves.length}`; }, 200);
  MG.loop(update, draw);
  window.LT = { get G() { return G; }, S, pick };
})();
