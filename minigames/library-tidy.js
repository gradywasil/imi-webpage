/* ============================================================
   LIBRARY TIDY: titles from the monkeys' own Library fall toward the floor; send each to the right shelf (tap it, or press 1-5).
   Books, kids' stories, films, TV, radio plays, sketches and songs all turn up. Spines are colour coded to their shelf; the game is how fast you can keep up.
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
  const A = MGArt.build(), A3 = MGArt3.build(), { cvs } = MGArt3;
  const host = document.getElementById('stage'), st = MG.stage(host, W, H, { padY: 40 }), g = st.g;
  host.style.cursor = 'pointer';
  const ui = MG.ui(host, st, A3.banana), fx = MG.fx();

  /* hi-res 5x7 text: same 4-unit pitch as the old font, so every layout below still fits */
  const text = (str, x, y, col) => MGArt3.text(g, str, x, y, col, 2 / 3);
  const rectc = (x, c, a, b, w, h) => { x.fillStyle = c; x.fillRect(a, b, w, h); }, seeded = s0 => () => ((s0 = (s0 * 1664525 + 1013904223) >>> 0) / 4294967296);
  const libPose = { t: 0, p: 'cheer' };
  const roomBg = cvs(W * 3, H * 3, (x, tw, th) => {
    const r = seeded(23), FL = FLOOR * 3;
    rectc(x, '#3a2418', 0, 0, tw, th);
    for (let px = 0; px < tw; px += 36) { rectc(x, '#4a2e1e', px + 1, 0, 34, FL); rectc(x, '#583624', px + 1, 0, 1, FL); rectc(x, '#2f1c12', px + 34, 0, 2, FL); for (let i = 0; i < 6; i++) rectc(x, '#42281a', px + 4 + Math.floor(r() * 26), Math.floor(r() * FL), 1, 6 + Math.floor(r() * 14)); }
    for (let y = 66; y < FL; y += 72) { rectc(x, '#1f1008', 0, y, tw, 6); rectc(x, '#6a4326', 0, y + 6, tw, 2); }
    for (const wx of [60, 234]) { rectc(x, '#1a0f14', wx - 3, 30, 72, 150); rectc(x, '#9bd0e8', wx, 33, 66, 144); rectc(x, '#cfeaf6', wx, 33, 66, 40); rectc(x, '#3a2418', wx + 31, 33, 4, 144); rectc(x, '#3a2418', wx, 100, 66, 4); x.fillStyle = 'rgba(255,230,160,.07)'; x.beginPath(); x.moveTo(wx, 177); x.lineTo(wx + 66, 177); x.lineTo(wx + 100, FL); x.lineTo(wx - 34, FL); x.fill(); }
    rectc(x, '#1a0f14', 0, FL, tw, 24); rectc(x, '#c0392b', 0, FL + 3, tw, 7); rectc(x, '#7a4a1e', 0, FL + 9, tw, 15);
    for (let px = 0; px < tw; px += 18) rectc(x, '#e8c43a', px, FL + 4, 9, 5);
    for (let i = 0; i < 30; i++) rectc(x, '#6a3f1a', Math.floor(r() * tw), FL + 12 + Math.floor(r() * 9), 8 + Math.floor(r() * 16), 1);
  });
  /* a book spine on a shelf: leather, gold bands, a lighter edge, the title ticks */
  function spine(x, y, w, h, s, shade) {
    g.fillStyle = '#1a0f14'; g.fillRect(x, y, w, h); g.fillStyle = shade > .5 ? s.col : s.dk; g.fillRect(x + .33, y + .33, w - .67, h - .67);
    g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(x + .33, y + .33, w - .67, .67); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x + .33, y + h - 1, w - .67, .67);
    g.fillStyle = '#ffd23a'; g.fillRect(x + 1.33, y + .67, .67, h - 1.33); g.fillRect(x + w - 2, y + .67, .67, h - 1.33); g.fillStyle = '#fff6d6'; g.fillRect(x + 3.67, y + 2.67, Math.max(2, (w - 8) * (.4 + shade * .4)), .67); g.fillRect(x + 3.67, y + 4, Math.max(1, (w - 8) * .3), .67);
  }
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
    const d = clamp(G.t / 55, 0, 1), lines = wrap(title, 10); let kind = 'normal';
    if (G.t > 12 && Math.random() < .035 + RARE * .6) kind = 'gold'; else if (G.t > 30 && Math.random() < .009 + RARE * .6) kind = 'ice';
    const hint = true, cardH = 7 + lines.length * 6;
    G.cards.push({ title, lines, cat: sh.k, col: sh.col, hint, kind, w: 50, h: cardH, x: W / 2 + rng(-26, 26), y: -cardH, vy: lerp(27, 66, d) * rng(.9, 1.12), state: 'fall', t: 0, born: G.t });
  }
  const active = () => { let a = null; for (const c of G.cards) if (c.state === 'fall' && (!a || c.y > a.y)) a = c; return a; };

  function send(c, shelfIdx, ok) {
    c.state = ok ? 'fly' : 'bounce'; c.t = 0; c.sx = c.x; c.sy = c.y; c.si = shelfIdx; c.tx = shelfX(shelfIdx); c.ty = SHELF_Y + 4;
  }
  function pick(idx) {
    if (!S.playing || G.dead || idx < 0 || idx >= G.shelves.length) return; const c = active(); if (!c) return; const sh = G.shelves[idx]; sh.flash = .15;
    if (c.kind === 'ice') { magic(c, idx); return; }
    if (sh.k === c.cat) {
      const k = c.kind === 'gold' ? 3 : 1, pts = Math.round((10 + 10 * clamp(1 - (c.y + c.h) / FLOOR, 0, 1)) * mult() * k); G.score += pts; G.combo++; G.bestCombo = Math.max(G.bestCombo, G.combo); G.sorted++; c.pts = pts; libPose.t = .4; libPose.p = 'cheer'; send(c, idx, true);
      ui.bump(); fx.burst(shelfX(idx), SHELF_Y + 2, [G.shelves[idx].col, '#fff6d6', '#fff08c'], 8, 50, 100, .4); fx.shock(shelfX(idx), SHELF_Y + 4, G.shelves[idx].col, 16); sfx.clack(Math.min(12, G.combo)); sfx.ding(Math.min(10, G.combo)); ui.floatText(shelfX(idx), SHELF_Y - 8, '+' + pts, k > 1 ? 'gold' : G.combo > 5 ? 'gold' : '');
      if (c.kind === 'gold') { G.goldens++; G.slowT = 6; sfx.golden(); fx.ring(c.x, c.y + c.h / 2, '#ffd23a', 40); fx.burst(c.x, c.y, ['#ffd23a', '#fff08c', '#fffbe0'], 18, 80, 60, .8); ui.say('GOLDEN EDITION<small>x3 · the room slows · 6s</small>'); if (G.hearts < 3) { G.hearts++; ui.floatText(W / 2, 60, '+HEART', 'gold'); } }
      if (G.combo % 6 === 0) { ui.pulseCombo(); ui.floatText(W / 2, 70, `STREAK x${mult()}`, 'gold'); sfx.golden(); }
    } else {
      MG.hitstop(.07); G.misfiled++; G.combo = 0; G.hearts--; G.shake = 5; libPose.t = .6; libPose.p = 'scared'; send(c, idx, false); sfx.bonk(); ui.doFlash('#c0392b'); ui.floatText(shelfX(idx), SHELF_Y - 8, `THAT IS ${CATS.find(q => q.k === c.cat).label}`, 'bad'); fx.burst(shelfX(idx), SHELF_Y, ['#c0392b', '#fff6d6'], 10, 60, 100, .5);
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
    if (sh.n >= CAP) { const bonus = Math.round(100 * mult()); G.full++; G.score += bonus; G.combo++; sfx.golden(); ui.say(`${sh.label} SHELF FULL!<small>+${bonus}</small>`); fx.ring(shelfX(G.shelves.indexOf(sh)), SHELF_Y + 24, '#ffd23a', 40); fx.burst(shelfX(G.shelves.indexOf(sh)), SHELF_Y + 20, ['#ffd23a', '#fff08c', sh.col], 22, 90, 80, .9); sh.n = 0; sh.tint = []; ui.bump(); fx.confetti(shelfX(G.shelves.indexOf(sh)), SHELF_Y + 10, 26); MG.hitstop(.05); render(); }
  }

  /* ---------- update ---------- */
  function update(rdt) {
    fx.update(rdt);
    if (!G || !S.playing) return;
    const slow = G.slowT > 0 ? .5 : 1, dt = rdt * slow; G.t += rdt; G.shake = Math.max(0, G.shake - rdt * 18); if (G.slowT > 0) G.slowT -= rdt;
    ui.setMeter(G.slowT / 6, false);
    if (G.dead > 0) { G.dead -= rdt; if (G.dead <= 0) S.finish([['SORTED', G.sorted], ['MISFILED', G.misfiled], ['DROPPED', G.dropped], ['SHELVES FILLED', G.full], ['BEST STREAK', G.bestCombo], ['GOLD / DIAMOND', `${G.goldens} / ${G.diamonds}`]]); }
    if (G.unlocked === 3 && G.t > 14) { unlock(); } else if (G.unlocked === 4 && G.t > 34) { unlock(); }
    for (const s of G.shelves) if (s.flash > 0) s.flash -= rdt;
    const d = clamp(G.t / 55, 0, 1); G.spawnT -= dt;
    const tail = G.cards.filter(c => c.state === 'fall').reduce((m, c) => Math.min(m, c.y), 1e9);
    if (G.hearts > 0 && G.spawnT <= 0 && tail > 12 && G.cards.filter(c => c.state === 'fall').length < 7) { spawn(); if (d > .4 && Math.random() < d * .35) G.spawnT = .22; else G.spawnT = lerp(2.0, .62, d) * rng(.8, 1.2); }
    for (let i = G.cards.length - 1; i >= 0; i--) {
      const c = G.cards[i]; c.t += dt;
      if (c.state === 'fall') { c.y += c.vy * dt; if (c.y + c.h >= FLOOR) { c.state = 'drop'; c.t = 0; MG.hitstop(.07); G.dropped++; G.combo = 0; G.hearts--; G.shake = 4; sfx.thud(); sfx.miss(); ui.floatText(c.x, FLOOR - 8, 'DROPPED!', 'bad'); fx.burst(c.x, FLOOR, ['#c9b88a', '#fff6d6'], 8, 40, 80, .4); render(true); if (G.hearts <= 0 && !G.dead) { G.dead = 1.1; sfx.over(); } } }
      else if (c.state === 'fly') { const k = clamp(c.t / .26, 0, 1); c.x = lerp(c.sx, c.tx, k); c.y = lerp(c.sy, c.ty, k) - Math.sin(k * Math.PI) * 14; if (k >= 1) { c.state = 'gone'; arrive(c); } }
      else if (c.state === 'bounce') { const k = c.t / .5; c.x += (c.x < W / 2 ? -1 : 1) * 40 * dt; c.y += (-60 + c.t * 260) * dt; if (c.t > .6) c.state = 'gone'; }
      else if (c.state === 'drop') { c.y += 140 * dt; if (c.t > .5) c.state = 'gone'; }
      if (c.state === 'gone') G.cards.splice(i, 1);
    }
    if (botOn) { G.bt += rdt; const c = active(); if (c && G.bt > .8) { G.bt = 0; pick(G.shelves.findIndex(s => s.k === c.cat)); } }
  }
  function unlock() { const c = order[G.unlocked]; G.shelves.push({ ...c, n: 0, flash: 0, tint: [] }); G.unlocked++; sfx.golden(); ui.say(`NEW SHELF: ${c.label}`); }

  /* ---------- draw ---------- */
  function draw() {
    g.clearRect(0, 0, W, H); g.save();
    if (G.shake > .3) g.translate(Math.round(rng(-G.shake, G.shake) * .5), Math.round(rng(-G.shake, G.shake) * .5));
    /* the reading room (baked): panelled wall, window light, the floor line with its warning stripe */
    st.hi(roomBg, 0, 0);
    const warn = G.cards.some(c => c.state === 'fall' && c.y + c.h > FLOOR - 26);
    if (warn && Math.floor(G.t * 8) % 2) { g.fillStyle = '#ff6a5a'; for (let x = 0; x < W; x += 6) g.fillRect(x, FLOOR + 1, 3, 2); }
    /* the librarian: the player's monkey, keeping an eye on the floor */
    const alarm = warn || G.hearts <= 1; MGCrew.draw(st, libPose.t > 0 ? libPose.p : alarm ? 'scared' : Math.floor(G.t * 1.5) % 2 ? 'breathe' : 'idle', W / 2, FLOOR + 5);
    if (libPose.t > 0) libPose.t -= 1 / 60;    /* shelves */
    const n = G.shelves.length, cw = colW();
    G.shelves.forEach((s, i) => {
      const x0 = Math.round(i * cw), w = Math.round(cw) - 1, cx = Math.round(shelfX(i)), fl = s.flash > 0;
      g.fillStyle = '#1a0f14'; g.fillRect(x0, SHELF_Y, w + 1, H - SHELF_Y); g.fillStyle = '#5a3517'; g.fillRect(x0 + 1, SHELF_Y + 1, w - 1, H - SHELF_Y - 2); g.fillStyle = '#2a170b'; g.fillRect(x0 + 3, SHELF_Y + 14, w - 5, CAP * 7 + 2);
      g.fillStyle = fl ? '#fff6d6' : s.col; g.fillRect(x0 + 1, SHELF_Y + 1, w - 1, 11); g.fillStyle = s.dk; g.fillRect(x0 + 1, SHELF_Y + 11, w - 1, 1);
      const lw = s.label.length * 4 - .67; text(s.label, cx - lw / 2, SHELF_Y + 3.6, fl ? '#1a0f14' : '#fff6d6');
      for (let b = 0; b < s.n; b++) spine(x0 + 4, SHELF_Y + 14 + (CAP - 1 - b) * 7 + 1, w - 7, 7, s, s.tint[b] || 0);
      g.fillStyle = '#b57d3e'; g.fillRect(x0 + 3, SHELF_Y + 14 + CAP * 7 + 2, w - 5, 2);
      text(String(i + 1), x0 + 3, SHELF_Y + 14 + CAP * 7 + 6, '#fff6d6');
    });
    /* cards */
    const act = active();
    for (const c of G.cards) {
      if (c.state === 'gone') continue; const x = Math.round(c.x - c.w / 2), y = Math.round(c.y), fall = c.state === 'fall', shake = c.state === 'drop' ? (Math.floor(c.t * 30) % 2) : 0;
      g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(x + 2, y + 2, c.w, c.h);
      g.fillStyle = '#1a0f14'; g.fillRect(x - 1 + shake, y - 1, c.w + 2, c.h + 2);
      const spine = c.kind === 'gold' ? '#ffd23a' : c.kind === 'ice' ? '#9be8ff' : c.hint ? c.col : '#8c8670';
      g.fillStyle = c.kind === 'ice' ? '#e8fbff' : c.kind === 'gold' ? '#fff3b0' : '#fff6d6'; g.fillRect(x + shake, y, c.w, c.h); g.fillStyle = spine; g.fillRect(x + shake, y, 4, c.h); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(x + 3 + shake, y, 1, c.h); g.fillStyle = '#c9b88a'; g.fillRect(x + shake, y + c.h - 1, c.w, 1);
      c.lines.forEach((ln, i) => text(ln, x + 7 + shake, y + 3.4 + i * 6, '#1a0f14'));
      if (fall && c.y + c.h > FLOOR - 26) { g.fillStyle = `rgba(232,58,58,${(.25 + .2 * Math.sin(G.t * 20)).toFixed(2)})`; g.fillRect(x, y, c.w, c.h); }
      if (c.kind !== 'normal' && Math.floor(G.t * 10) % 2 === 0) fx.spark(x + c.w - 4, y + 3, c.kind === 'ice' ? '#9be8ff' : '#fff08c');
      if (c === act) { const b = Math.floor(performance.now() / 200) % 2; g.fillStyle = '#ffd23a'; g.fillRect(x - 5 - b, y + Math.floor(c.h / 2) - 2, 3, 5); g.fillRect(x + c.w + 2 + b, y + Math.floor(c.h / 2) - 2, 3, 5); }
    }
    if (G.slowT > 0) { g.fillStyle = 'rgba(255,210,58,.08)'; g.fillRect(0, 0, W, H); }
    fx.draw(g); g.restore();
  }

  /* ---------- shell + input ---------- */
  const S = MG.shell({
    host, ui, id: 'tidy', title: 'LIBRARY<span>TIDY</span>', sub: 'Shelve the Library, one title at a time.',
    legend: [[A3.banana, '<em>tap</em> a shelf · keys 1-5'], [A3.coconut, '<em class="bad">misfile</em> or drop = -1 heart'], [A3.golden, '<em>x3</em> golden edition'], [A3.diamond, '<em class="ice">first edition</em> tidies all'], [A3.heart, '<em>full shelf</em> = bonus'], [A3.apple, '<em>spine colour</em> = shelf']],
    hint:'read the title, tap the shelf it belongs on', spaceStarts: true, onStart: () => newGame(), score: () => G.score,
  });
  addEventListener('pointerdown', ev => { if (!S.playing || ev.target.closest('.mg-over,.mg-nav')) return; const [px, py] = st.toArt(ev); if (py < SHELF_Y - 4) return; pick(clamp(Math.floor(px / colW()), 0, G.shelves.length - 1)); });
  addEventListener('keydown', e => { if (!S.playing) return; if (e.key >= '1' && e.key <= '5') { pick(+e.key - 1); e.preventDefault(); } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { /* reserved */ } });

  newGame(); S.title();
  if (params.get('autostart')) { S.start(); botOn = !!params.get('bot'); for (let i = 0, n = (+params.get('warp') || 0) * 60; i < n; i++) update(1 / 60); }
  if (params.get('dbg')) setInterval(() => { document.title = `sorted=${G.sorted} hearts=${G.hearts} score=${G.score} t=${Math.round(G.t)} shelves=${G.shelves.length}`; }, 200);
  MG.loop(update, draw);
  window.LT = { get G() { return G; }, S, pick };
})();
