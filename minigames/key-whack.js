/* ============================================================
   KEY WHACK: a typewriter keyboard where keys pop up lit; press or tap the matching key before it snaps back.
   Every hit stamps its letter on the paper. Ink blots are decoys, the banana space bar is a bonus,
   the Golden key starts a frenzy and the Diamond key lights the whole keyboard for a mash.
   Controls: type the letters / space, or tap the keys. Esc pauses.
   Standalone: no connection to the main game's save yet.
   ============================================================ */
(() => {
  'use strict';
  const { rng, clamp, lerp, store, sfx, h, spriteImg } = MG;
  const W = 148, H = 156, ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'], ROW_X = [4, 11, 18], ROW_Y = [90, 105, 120];
  const COLS = 23, LINES = 7, PAPER = { x: 6, y: 17, w: 98, h: 56 }, MONKEY = { x: 127, foot: 83 }, K = .7;
  const params = new URLSearchParams(location.search), RARE = +params.get('rare') || 0;

  MG.boot();
  PXA.monkeySets.kw = { k: K, max: 0, step: 7 }; PXA.monkeySets.kw.angles = [0]; PXA.monkeySets.kw.cache = {};
  const A = MGArt.build(), { R, make, shapes: { ell, box, or, sub } } = MGArt, FONT = MGArt.FONT;
  const host = document.getElementById('stage'), st = MG.stage(host, W, H, { padY: 40 }), g = st.g;
  const ui = MG.ui(host, st, MGArt.tile('K'));
  const { over, say, floatText, doFlash, bump, pulseCombo } = ui;

  /* ---------- key sprites: round typewriter caps; faces recolour for hot / golden / diamond, plus blot ---------- */
  const FACE = { up: R.paper, hot: R.banY, gold: R.gold, ice: R.ice };
  const keyCache = {};
  function keySprite(ch, kind, down) {
    const id = ch + kind + (down ? 1 : 0); if (keyCache[id]) return keyCache[id];
    const dy = down ? 1 : 0;
    const cv = make(13, 14, px => {
      if (!down) px.shape(ell(6.5, 7.6, 6.5, 6.3), R.woodD, 1);
      px.shape(ell(6.5, 6.2 + dy, 6.5, 6), R.metal, 2);
      px.shape(ell(6.5, 5.8 + dy, 5, 4.8), kind === 'blot' ? R.paper : FACE[kind] || R.paper, 3);
      if (kind === 'blot') { px.shape(or(ell(6, 6, 4, 3.3), ell(9.2, 4.2, 2, 1.8), ell(3, 8.6, 1.6, 1.4), ell(7.5, 9, 1, 1.2)), R.ink, 4); px.tone(5, 5, 2, 4); }
    });
    if (kind !== 'blot') {
      const c = cv.getContext('2d'); c.fillStyle = '#1a0f14';
      FONT[ch].split('').forEach((b, i) => { if (b === '1') c.fillRect(5 + (i % 3), 3 + dy + Math.floor(i / 3), 1, 1); });
    }
    return (keyCache[id] = cv);
  }
  const spaceCache = {};
  function spaceSprite(kind, down) {
    const id = kind + (down ? 1 : 0); if (spaceCache[id]) return spaceCache[id];
    const dy = down ? 1 : 0;
    return (spaceCache[id] = make(44, 13, px => {
      if (!down) px.shape(box(1, 4, 42, 8), R.woodD, 1);
      px.shape(or(box(2, dy, 40, 10), box(0, 2 + dy, 44, 6)), R.metal, 2);
      px.shape(box(3, 2 + dy, 38, 6), FACE[kind] || R.paper, 3);
    }));
  }

  /* ---------- state ---------- */
  let phase = 'title', G = null, botOn = false;
  const monkey = { expr: 'normal', exprT: 0, hop: 0, blink: 0 };
  let keys = [];
  function buildKeys() {
    keys = [];
    ROWS.forEach((row, r) => row.split('').forEach((ch, i) => keys.push({ ch, x: ROW_X[r] + i * 14, y: ROW_Y[r], w: 13, h: 13, s: 'idle', t: 0, life: 1, down: 0, bad: 0 })));
    keys.push({ ch: ' ', x: Math.round((W - 44) / 2), y: 136, w: 44, h: 12, s: 'idle', t: 0, life: 1, down: 0, bad: 0 });
  }
  function newGame() {
    G = {
      t: 0, score: 0, hearts: 3, combo: 0, bestCombo: 0, spawnT: .7, shake: 0, parts: [], rings: [], paper: [''], stampT: 0,
      frenzy: 0, mash: 0, sinceDiamond: 0, deadT: 0, whacks: 0, misses: 0, typos: 0, blots: 0, bananas: 0, goldens: 0, diamonds: 0, slow: 1, slowT: 0,
    };
    buildKeys(); monkey.expr = 'normal'; monkey.exprT = 0; renderHud(true);
  }
  const mult = () => ui.mult(G.combo);
  function renderHud(initial) { ui.setScore(G.score); ui.setHearts(G.hearts, !initial); ui.setCombo(G.combo, mult()); }
  const express = (e, t) => { monkey.expr = e; monkey.exprT = t; };

  /* ---------- particles ---------- */
  function burst(x, y, cols, n, spd = 50, grav = 120, life = .5) {
    for (let i = 0; i < n; i++) { const a = rng(Math.PI * 2), s = rng(spd * .3, spd); G.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - spd * .4, g: grav, t: 0, life: life * rng(.7, 1.2), col: cols[i % cols.length] }); }
  }
  const ring = (x, y, col, max = 20) => G.rings.push({ x, y, t: 0, col, max });
  const cx = k => k.x + k.w / 2, cy = k => k.y + k.h / 2;

  /* ---------- the paper ---------- */
  function stamp(ch) {
    const rows = G.paper;
    if (ch === ' ') { rows[rows.length - 1] += ' '; } else rows[rows.length - 1] += ch;
    G.stampT = .14;
    if (rows[rows.length - 1].length >= COLS) { sfx.bell(); rows.push(''); if (rows.length > LINES) rows.shift(); }
  }

  /* ---------- spawning ---------- */
  const hotCount = () => keys.filter(k => k.s !== 'idle' && k.s !== 'ice').length;
  function spawnKey() {
    const d = clamp(G.t / 90, 0, 1), cap = G.frenzy > 0 ? 8 : Math.min(4, 1 + Math.floor(G.t / 18));
    if (G.mash > 0 || hotCount() >= cap) return;
    const idle = keys.filter(k => k.s === 'idle' && k.ch !== ' ');
    const k = idle[Math.floor(Math.random() * idle.length)]; if (!k) return;
    const life = lerp(2.5, 1.05, d) * (G.frenzy > 0 ? 1.3 : 1);
    const r = Math.random(), armed = G.t > 6;
    const pDia = armed ? .006 + Math.min(.02, G.sinceDiamond / 4000) + RARE * .2 : 0, pGold = armed ? .02 + RARE * .2 : 0;
    const sp = keys[keys.length - 1], banana = armed && G.t > 12 && sp.s === 'idle' && Math.random() < .055;
    if (banana) { sp.s = 'banana'; sp.life = sp.t = 2.8; }
    if (r < pDia) { k.s = 'ice'; k.diamond = true; k.life = k.t = life * 1.3; G.sinceDiamond = 0; }
    else if (r < pDia + pGold) { k.s = 'gold'; k.life = k.t = life * 1.2; }
    else if (armed && G.t > 10 && r < pDia + pGold + .12) { k.s = 'blot'; k.life = k.t = 2.3; }
    else { k.s = 'hot'; k.life = k.t = life; }
  }

  /* ---------- pressing ---------- */
  function press(k) {
    if (phase !== 'play' || G.hearts <= 0) return;
    k.down = .09; const x = cx(k), y = cy(k), m = mult();
    if (k.s === 'idle') {
      G.typos++; k.bad = .22; G.combo = 0; sfx.typo(); burst(x, y, ['#c9b88a', '#8c8670'], 3, 20, 60, .25); renderHud(); return;
    }
    if (k.s === 'blot') {
      G.hearts--; G.blots++; G.combo = 0; G.shake = 6; k.s = 'idle'; k.bad = .3; sfx.bonk(); doFlash('#2a1020');
      burst(x, y, ['#1a0f14', '#3a2a30', '#5c4650'], 16, 70, 160, .6); floatText(x, y - 10, 'BLOT! -1', 'bad'); express('scared', .8);
      renderHud(); if (G.hearts <= 0) endGame(); return;
    }
    const frac = k.t / k.life, fast = frac > .66; let pts;
    G.whacks++; G.combo++; G.bestCombo = Math.max(G.bestCombo, G.combo);
    if (k.s === 'banana') {
      pts = Math.round(50 * m); G.bananas++; sfx.golden(); burst(x, y - 4, ['#ffd23a', '#fff08c', '#c98f0e'], 14, 70, 90, .7); floatText(x, y - 14, '+' + pts, 'gold');
      if (G.hearts < 3) { G.hearts++; floatText(x, y - 24, '+HEART', 'gold'); }
    } else if (k.s === 'gold') {
      pts = Math.round(100 * m); G.goldens++; G.frenzy = 6; sfx.golden(); G.shake = 3; ring(x, y, '#ffd23a', 40);
      burst(x, y, ['#ffd23a', '#fff08c', '#fffbe0'], 22, 90, 70, .8); express('screech', 1); say('GOLD FRENZY<small>more keys · more time · 6s</small>'); floatText(x, y - 14, '+' + pts, 'gold');
    } else if (k.s === 'ice' && k.diamond) {
      pts = Math.round(100 * m); G.diamonds++; G.mash = 5; G.slow = .35; G.slowT = .9; G.shake = 5; sfx.diamond(); doFlash('#e8fbff');
      ring(x, y, '#9be8ff', 56); ring(x, y, '#fff', 34); burst(x, y, ['#9be8ff', '#fff', '#2a86b8'], 36, 120, 50, 1);
      express('screech', 2); say('DIAMOND MASH!<small>smash every key · 5s</small>', 'ice'); floatText(x, y - 14, '+' + pts, 'ice');
      keys.forEach(o => { if (o !== k) { o.s = 'ice'; o.life = o.t = 5; o.diamond = false; } });
    } else if (k.s === 'ice') {
      pts = Math.round(30 * m); sfx.clack(Math.min(12, G.combo)); burst(x, y - 3, ['#9be8ff', '#fff'], 5, 40, 100, .3); floatText(x, y - 12, '+' + pts, 'ice');
    } else {
      pts = Math.round((10 + (G.mash > 0 ? 15 : Math.round(frac * 10))) * m); sfx.clack(Math.min(12, G.combo));
      burst(x, y - 3, ['#ffd23a', '#fff08c', '#fff6d6'], 6, 44, 130, .38);
      floatText(x, y - 12, '+' + pts + (fast && G.mash <= 0 ? ' FAST' : ''), fast || m > 1 ? 'gold' : '');
    }
    k.s = 'idle'; k.diamond = false;
    G.score += pts; bump(); stamp(k.ch); monkey.hop = .12;
    if (G.combo % 6 === 0 && G.combo <= 24) { floatText(W / 2, 80, `COMBO x${mult()}!`, 'gold big'); sfx.golden(); pulseCombo(); express('screech', .5); }
    renderHud();
  }
  const byChar = ch => keys.find(k => k.ch === ch);

  /* ---------- update ---------- */
  function update(rdt) {
    if (phase !== 'play') { if (phase === 'title') ambient(rdt); return; }
    if (G.slowT > 0) { G.slowT -= rdt; if (G.slowT <= 0) G.slow = 1; }
    const dt = rdt * G.slow; G.t += dt; G.sinceDiamond += dt;
    if (G.frenzy > 0) G.frenzy = Math.max(0, G.frenzy - dt);
    if (G.mash > 0) { G.mash -= dt; if (G.mash <= 0) { G.mash = 0; keys.forEach(k => { if (k.s === 'ice') k.s = 'idle'; }); say('NICE MASH!', 'ice'); } }
    const bonus = G.mash > 0 ? G.mash / 5 : G.frenzy > 0 ? G.frenzy / 6 : 0; ui.setMeter(bonus, G.mash > 0);
    if (G.deadT > 0) { G.deadT -= rdt; if (G.deadT <= 0) showOver(); }
    if (G.stampT > 0) G.stampT -= rdt;

    G.spawnT -= dt;
    if (G.hearts > 0 && G.spawnT <= 0) { const d = clamp(G.t / 90, 0, 1); G.spawnT = lerp(.85, .38, d) * (G.frenzy > 0 ? .5 : 1) * rng(.75, 1.2); spawnKey(); }

    for (const k of keys) {
      if (k.down > 0) k.down -= rdt; if (k.bad > 0) k.bad -= rdt;
      if (k.s === 'idle') continue;
      k.t -= dt;
      if (botOn && k.s !== 'blot' && k.s !== 'banana' && k.life - k.t > .28) { press(k); continue; }
      if (botOn && k.s === 'banana' && k.life - k.t > .3) { press(k); continue; }
      if (k.t <= 0) {
        const x = cx(k), y = cy(k);
        if (k.s === 'blot') { floatText(x, y - 10, 'DODGED'); G.score += 5; ui.setScore(G.score); }
        else if (k.s === 'banana') { floatText(x, y - 10, 'MISSED IT', 'bad'); }
        else if (k.s === 'ice') { /* mash keys just fade */ }
        else {
          G.misses++; G.combo = 0; G.hearts--; G.shake = 3; sfx.miss(); burst(x, y, ['#c9b88a', '#8c8670'], 5, 26, 80, .3); floatText(x, y - 10, 'MISS', 'bad'); express('scared', .4);
          renderHud(); if (G.hearts <= 0) endGame();
        }
        k.s = 'idle'; k.diamond = false;
      }
    }
    monkey.hop = Math.max(0, monkey.hop - rdt);
    if (monkey.exprT > 0) { monkey.exprT -= rdt; if (monkey.exprT <= 0) monkey.expr = 'normal'; }
    monkey.blink -= rdt; if (monkey.blink < -3) monkey.blink = .14;
    for (let i = G.parts.length - 1; i >= 0; i--) { const p = G.parts[i]; p.t += rdt; p.x += p.vx * rdt; p.y += p.vy * rdt; p.vy += (p.g || 0) * rdt; if (p.t >= p.life) G.parts.splice(i, 1); }
    for (let i = G.rings.length - 1; i >= 0; i--) { G.rings[i].t += rdt; if (G.rings[i].t > .5) G.rings.splice(i, 1); }
    G.shake = Math.max(0, G.shake - rdt * 22);
  }
  let ambT = 0;
  function ambient(dt) {
    ambT -= dt; monkey.blink -= dt; if (monkey.blink < -3) monkey.blink = .14;
    if (ambT <= 0) { ambT = .5 + Math.random() * .5; const k = keys[Math.floor(Math.random() * 26)]; if (k && k.s === 'idle' && k.ch !== ' ') { k.s = 'hot'; k.life = k.t = .9; } }
    keys.forEach(k => { if (k.s !== 'idle') { k.t -= dt; if (k.t <= 0) k.s = 'idle'; } });
  }

  /* ---------- draw ---------- */
  function drawLetter(ch, x, y, col) { g.fillStyle = col; FONT[ch].split('').forEach((b, i) => { if (b === '1') g.fillRect(x + (i % 3), y + Math.floor(i / 3), 1, 1); }); }
  function draw() {
    g.clearRect(0, 0, W, H); g.save();
    if (G.shake > .3) g.translate(Math.round(rng(-G.shake, G.shake) * .5), Math.round(rng(-G.shake, G.shake) * .5));
    /* the machine body: wooden plate with a brass trim and a platen roller */
    g.fillStyle = '#1a0f14'; g.fillRect(0, 84, W, H - 84); g.fillStyle = '#5a3517'; g.fillRect(1, 85, W - 2, H - 86);
    g.fillStyle = '#8a5a2b'; g.fillRect(1, 85, W - 2, 2); g.fillStyle = '#30180a'; g.fillRect(1, H - 3, W - 2, 2);
    g.fillStyle = '#c98f0e'; for (const [x, y] of [[4, 88], [W - 6, 88], [4, H - 7], [W - 6, H - 7]]) g.fillRect(x, y, 2, 2);
    g.fillStyle = '#1a0f14'; g.fillRect(PAPER.x - 2, 12, PAPER.w + 4, 6);
    g.fillStyle = '#5a3517'; g.fillRect(PAPER.x - 1, 13, PAPER.w + 2, 4); g.fillStyle = '#b57d3e'; g.fillRect(PAPER.x - 1, 13, PAPER.w + 2, 1); g.fillStyle = '#30180a'; g.fillRect(PAPER.x - 1, 16, PAPER.w + 2, 1);
    /* paper */
    g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(PAPER.x + 2, PAPER.y + 2, PAPER.w, PAPER.h);
    g.fillStyle = '#fff6d6'; g.fillRect(PAPER.x, PAPER.y, PAPER.w, PAPER.h); g.fillStyle = '#ede0b8'; g.fillRect(PAPER.x, PAPER.y + PAPER.h - 2, PAPER.w, 2);
    const rows = G.paper;
    rows.forEach((row, ri) => {
      const y = PAPER.y + 4 + ri * 7;
      row.split('').forEach((ch, ci) => {
        if (ch === ' ') return;
        const last = ri === rows.length - 1 && ci === row.length - 1 && G.stampT > 0;
        drawLetter(ch, PAPER.x + 4 + ci * 4, y + (last ? -1 : 0), last ? '#c98f0e' : '#1a0f14');
      });
    });
    if (phase === 'play' && Math.floor(performance.now() / 350) % 2 === 0) { const row = rows[rows.length - 1], y = PAPER.y + 4 + (rows.length - 1) * 7; g.fillStyle = '#c0392b'; g.fillRect(PAPER.x + 4 + row.length * 4, y + 6, 3, 1); }

    /* monkey on the machine, watching the paper */
    const ex = monkey.exprT > 0 ? monkey.expr : monkey.blink > 0 ? 'blink' : 'normal';
    const f = PXA.monkeyFrame('kw', ex, 0, false, monkey.hop > 0 ? 1 : 0, 0);
    const hop = monkey.hop > 0 ? 3 : 0;
    g.drawImage(f.cv, Math.round(MONKEY.x - f.pivot[0]), Math.round(MONKEY.foot - 41.5 * K - f.pivot[1] - hop));

    /* keys */
    for (const k of keys) {
      const raised = k.s !== 'idle' && (k.s !== 'ice' || k.diamond), mashing = k.s === 'ice' && !k.diamond;
      const kind = k.s === 'idle' ? 'up' : k.s === 'banana' ? 'hot' : k.s === 'ice' ? 'ice' : k.s;
      const bob = raised ? (Math.floor(performance.now() / 120) % 2 ? -3 : -2) : 0;
      const wob = k.bad > 0 ? (Math.floor(k.bad * 40) % 2 ? 1 : -1) : 0;
      const down = k.down > 0;
      const cv = k.ch === ' ' ? spaceSprite(kind === 'blot' ? 'up' : kind, down) : keySprite(k.ch, kind === 'blot' ? 'blot' : kind, down);
      g.drawImage(cv, k.x + wob, k.y + bob + (down ? 0 : 0));
      if (k.bad > 0) { g.fillStyle = 'rgba(192,57,43,.45)'; g.fillRect(k.x + 1 + wob, k.y + 1, k.w - 2, k.h - 2); }
      if (k.s === 'banana') g.drawImage(A.banana, Math.round(k.x + k.w / 2 - 9), k.y - 14 + bob);
      if (raised) {
        const frac = clamp(k.t / k.life, 0, 1), bw = Math.max(1, Math.round((k.ch === ' ' ? 40 : 11) * frac));
        g.fillStyle = '#1a0f14'; g.fillRect(k.x + (k.ch === ' ' ? 1 : 0), k.y + k.h + 1, (k.ch === ' ' ? 42 : 13), 3);
        g.fillStyle = k.s === 'blot' ? '#7a8aa0' : frac > .5 ? '#74c648' : frac > .25 ? '#ffd23a' : '#e86a50';
        g.fillRect(k.x + 1 + (k.ch === ' ' ? 1 : 0), k.y + k.h + 2, bw, 1);
        if (k.s !== 'blot' && Math.floor(performance.now() / 160) % 2) { g.fillStyle = k.s === 'gold' ? '#fffbe0' : '#fff08c'; g.fillRect(k.x - 1, k.y + bob + 2, 1, 1); g.fillRect(k.x + k.w, k.y + bob + 5, 1, 1); }
      }
      if (mashing && Math.floor(performance.now() / 90 + k.x) % 5 === 0) { g.fillStyle = '#fff'; g.fillRect(k.x + 3 + (k.x * 7) % 6, k.y - 1, 1, 1); }
    }

    for (const p of G.parts) { const kk = 1 - p.t / p.life, s = kk > .5 ? 2 : 1; g.fillStyle = p.col; g.fillRect(Math.round(p.x), Math.round(p.y), s, s); }
    for (const r of G.rings) { const kk = r.t / .5; g.globalAlpha = 1 - kk; g.strokeStyle = r.col; g.lineWidth = 1; g.beginPath(); g.arc(r.x + .5, r.y + .5, Math.round(r.max * kk), 0, Math.PI * 2); g.stroke(); g.globalAlpha = 1; }
    if (G.frenzy > 0 || G.mash > 0) { g.fillStyle = G.mash > 0 ? 'rgba(155,232,255,.1)' : 'rgba(255,210,58,.09)'; g.fillRect(0, 0, W, H); }
    g.restore();
  }

  /* ---------- flow ---------- */
  function title() {
    phase = 'title'; host.classList.add('menu-open'); over.hidden = false; over.innerHTML = '';
    const leg = h('div', 'mg-legend');
    const item = (cv, label) => { const d = h('div'); d.append(spriteImg(cv, 2), h('span', '', label)); leg.appendChild(d); };
    item(keySprite('K', 'hot'), '<em>10-20</em> lit key'); item(keySprite('A', 'blot'), '<em class="bad">-1 heart</em> blot');
    item(spaceSprite('hot'), '<em>50</em> banana bar'); item(keySprite('Q', 'gold'), '<em>100</em> frenzy');
    item(keySprite('Z', 'ice'), '<em class="ice">100</em> mash!'); item(keySprite('M', 'up'), '<em class="bad">miss</em> = -1 heart');
    over.append(h('h1', 'mg-title', 'KEY<span>WHACK</span>'), h('p', 'mg-sub', 'Hit the lit keys before they snap back.'), leg,
      ui.btn('START', '', () => { sfx.unlock(); start(); }), h('p', 'mg-hint', 'type the letters · or tap the keys · space bar too'), h('p', 'mg-best', `BEST ${store.get('whack:best', 0)}`));
  }
  function start() { newGame(); phase = 'play'; over.hidden = true; host.classList.remove('menu-open'); sfx.start(); ui.say('KEY WHACK', '', 1200); }
  function endGame() { G.deadT = 1; sfx.over(); G.slow = .5; G.slowT = 1; ui.setMeter(0); ui.combo.classList.remove('on'); }
  function showOver() {
    phase = 'over'; host.classList.add('menu-open'); ui.hideBanner();
    const prev = store.get('whack:best', 0), isNew = G.score > prev; if (isNew) store.set('whack:best', G.score);
    const tries = G.whacks + G.misses + G.typos + G.blots, acc = tries ? Math.round(G.whacks / tries * 100) : 0;
    over.hidden = false; over.innerHTML = '';
    const stats = h('div', 'mg-stats');
    [['WHACKS', G.whacks], ['ACCURACY', acc + '%'], ['BEST COMBO', G.bestCombo], ['LETTERS/MIN', Math.round(G.whacks / Math.max(1, G.t) * 60)], ['GOLD / DIAMOND', `${G.goldens} / ${G.diamonds}`], ['TIME', Math.round(G.t) + 's']].forEach(([k, v]) => stats.append(h('span', '', k), h('b', '', v)));
    over.append(h('p', 'mg-sub', 'END OF SHIFT'), h('h2', 'mg-big', String(G.score)), isNew ? h('p', 'mg-new', 'NEW BEST!') : h('p', 'mg-best', `BEST ${Math.max(prev, G.score)}`), stats, ui.btn('AGAIN', '', start), ui.btn('MENU', 'banana-btn-green', () => { newGame(); title(); }));
  }
  function pause() { if (phase !== 'play') return; phase = 'pause'; host.classList.add('menu-open'); over.hidden = false; over.innerHTML = ''; over.append(h('h2', 'mg-big', 'PAUSED'), ui.btn('RESUME', '', resume)); }
  function resume() { if (phase === 'pause') { phase = 'play'; over.hidden = true; host.classList.remove('menu-open'); } }

  /* ---------- input ---------- */
  addEventListener('keydown', e => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key;
    if (k === 'Escape') { phase === 'play' ? pause() : phase === 'pause' && resume(); return; }
    if (phase === 'play') { const ch = k === ' ' ? ' ' : k.length === 1 ? k.toUpperCase() : ''; const key = ch && byChar(ch); if (key && !e.repeat) { press(key); e.preventDefault(); } else if (k === ' ') e.preventDefault(); return; }
    if ((k === 'Enter' || k === ' ') && !e.repeat) { if (phase === 'title' || phase === 'over') start(); else if (phase === 'pause') resume(); e.preventDefault(); }
  });
  addEventListener('pointerdown', ev => {
    if (ev.target.closest('.mg-over,.mg-nav')) return; sfx.unlock(); if (phase !== 'play') return;
    const [px, py] = st.toArt(ev); let best = null, bd = 1e9;
    for (const k of keys) { const dx = Math.max(k.x - 1 - px, 0, px - (k.x + k.w + 1)), dy = Math.max(k.y - 4 - py, 0, py - (k.y + k.h + 1)), d = dx * dx + dy * dy; if (d < bd) { bd = d; best = k; } }
    if (best && bd < 36) press(best);
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  addEventListener('blur', pause);
  const mute = document.getElementById('mute'), syncMute = () => mute.classList.toggle('off', !sfx.on);
  mute.addEventListener('click', () => { sfx.set(!sfx.on); syncMute(); sfx.unlock(); sfx.tick(); }); syncMute();

  ['normal', 'scared', 'screech', 'blink'].forEach(e => [0, 1].forEach(p => PXA.monkeyFrame('kw', e, 0, false, p, 0)));
  newGame(); title();
  if (params.get('autostart')) {
    start(); botOn = !!params.get('bot');
    for (let i = 0, n = (+params.get('warp') || 0) * 60; i < n; i++) update(1 / 60);
  }
  MG.loop(update, draw);
  window.KW = { get G() { return G; }, keys: () => keys, press, get phase() { return phase; } };
})();
