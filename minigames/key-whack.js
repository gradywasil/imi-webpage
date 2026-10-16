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
  const A = MGArt.build(), A3 = MGArt3.build(), { R, shapes: { ell, box, or, sub } } = MGArt, make = MGArt3.make, { cvs, text } = MGArt3;
  const rectc = (x, c, a, b, w, h) => { x.fillStyle = c; x.fillRect(a, b, w, h); }, seeded = s0 => () => ((s0 = (s0 * 1664525 + 1013904223) >>> 0) / 4294967296);
  const host = document.getElementById('stage'), st = MG.stage(host, W, H, { padY: 40 }), g = st.g;
  const ui = MG.ui(host, st, MGArt.tile('K')), fx = MG.fx();
  const { over, say, floatText, doFlash, bump, pulseCombo } = ui;

  /* ---------- key sprites: round typewriter caps; faces recolour for hot / golden / diamond, plus blot ---------- */
  const FACE = { up: R.paper, hot: R.banY, gold: R.gold, ice: R.ice };
  const keyCache = {};
  function keySprite(ch, kind, down) {
    const id = ch + kind + (down ? 1 : 0); if (keyCache[id]) return keyCache[id];
    const dy = down ? 3 : 0;
    const cv = make(39, 42, px => {
      if (!down) px.shape(ell(19.5, 22.8, 19.5, 18.9), R.woodD, 1);
      px.shape(ell(19.5, 18.6 + dy, 19.5, 18), R.metal, 2);
      px.shape(ell(19.5, 17.4 + dy, 15, 14.4), kind === 'blot' ? R.paper : FACE[kind] || R.paper, 3);
      if (kind === 'blot') { px.shape(or(ell(18, 18, 12, 9.9), ell(27.6, 12.6, 6, 5.4), ell(9, 25.8, 4.8, 4.2), ell(22.5, 27, 3, 3.6)), R.ink, 4); px.tone(15, 15, 2, 4); }
      else { px.tone(12, 8 + dy, 2, 3); px.tone(13, 8 + dy, 2, 3); px.tone(11, 9 + dy, 2, 3); }
    });
    if (kind !== 'blot') text(cv.getContext('2d'), ch, 14.5, 10 + dy, '#1a0f14', 2);
    return (keyCache[id] = cv);
  }
  const spaceCache = {};
  function spaceSprite(kind, down) {
    const id = kind + (down ? 1 : 0); if (spaceCache[id]) return spaceCache[id];
    const dy = down ? 3 : 0;
    return (spaceCache[id] = make(132, 39, px => {
      if (!down) px.shape(box(3, 12, 126, 24), R.woodD, 1);
      px.shape(or(box(6, dy, 120, 30), box(0, 6 + dy, 132, 18)), R.metal, 2);
      px.shape(box(9, 6 + dy, 114, 18), FACE[kind] || R.paper, 3);
      px.tone(12, 7 + dy, 2, 3); px.tone(13, 7 + dy, 2, 3); px.tone(14, 7 + dy, 2, 3);
    }));
  }
  /* the machine body, baked once: grained wood plate, brass trim, screws, and the platen rail the paper rises from */
  const bodyBg = cvs(W * 3, H * 3, x => {
    const r = seeded(5), BY = 84 * 3, BW = W * 3, BH = (H - 84) * 3;
    rectc(x, '#1a0f14', 0, BY, BW, BH); rectc(x, '#5a3517', 3, BY + 3, BW - 6, BH - 6);
    for (let i = 0; i < 90; i++) rectc(x, r() < .5 ? '#4a2a12' : '#6a4120', 4 + Math.floor(r() * (BW - 14)), BY + 6 + Math.floor(r() * (BH - 14)), 8 + Math.floor(r() * 22), 1);
    rectc(x, '#8a5a2b', 3, BY + 3, BW - 6, 5); rectc(x, '#a8723a', 3, BY + 3, BW - 6, 2); rectc(x, '#30180a', 3, BH + BY - 9, BW - 6, 6);
    for (const [sx, sy] of [[12, BY + 12], [BW - 21, BY + 12], [12, BH + BY - 21], [BW - 21, BH + BY - 21]]) { rectc(x, '#1a0f14', sx - 1, sy - 1, 11, 11); rectc(x, '#c98f0e', sx, sy, 9, 9); rectc(x, '#ffd23a', sx, sy, 9, 2); rectc(x, '#8a5a0a', sx, sy + 7, 9, 2); rectc(x, '#5a3a06', sx + 4, sy + 1, 1, 7); }
    rectc(x, '#1a0f14', (PAPER.x - 2) * 3, 12 * 3, (PAPER.w + 4) * 3, 18); rectc(x, '#5a3517', (PAPER.x - 1) * 3, 13 * 3, (PAPER.w + 2) * 3, 12); rectc(x, '#b57d3e', (PAPER.x - 1) * 3, 13 * 3, (PAPER.w + 2) * 3, 3); rectc(x, '#30180a', (PAPER.x - 1) * 3, 16 * 3, (PAPER.w + 2) * 3, 3);
    for (let sx = (PAPER.x + 3) * 3; sx < (PAPER.x + PAPER.w - 2) * 3; sx += 24) rectc(x, '#8a5a2b', sx, 13 * 3 + 4, 1, 5);
  });
  const paperBg = cvs(PAPER.w * 3, PAPER.h * 3, (x, pw, ph) => {
    const r = seeded(9); rectc(x, '#fff6d6', 0, 0, pw, ph); rectc(x, '#ede0b8', 0, ph - 6, pw, 6);
    for (let i = 0; i < 40; i++) rectc(x, '#f2e6c0', Math.floor(r() * pw), Math.floor(r() * ph), 2, 1);
    for (let ri = 0; ri < LINES; ri++) rectc(x, '#e6d8aa', 6, 4 * 3 + ri * 21 + 15, pw - 12, 1);
    rectc(x, '#e8a0a0', 3 * 3, 0, 1, ph);
  });
  /* ---------- state ---------- */
  let G = null, botOn = false;
  const monkey = { expr: 'normal', exprT: 0, hop: 0, blink: 0 };
  let keys = [];
  function buildKeys() {
    keys = [];
    ROWS.forEach((row, r) => row.split('').forEach((ch, i) => keys.push({ ch, x: ROW_X[r] + i * 14, y: ROW_Y[r], w: 13, h: 13, s: 'idle', t: 0, life: 1, down: 0, bad: 0 })));
    keys.push({ ch: ' ', x: Math.round((W - 44) / 2), y: 136, w: 44, h: 12, s: 'idle', t: 0, life: 1, down: 0, bad: 0 });
  }
  function newGame() {
    G = {
      t: 0, score: 0, hearts: 3, combo: 0, bestCombo: 0, spawnT: .7, shake: 0, parts: [], rings: [], flyers: [], paper: [''], stampT: 0,
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
    if (!S.playing || G.hearts <= 0) return;
    k.down = .09; const x = cx(k), y = cy(k), m = mult();
    if (k.s === 'idle') {
      G.typos++; k.bad = .22; G.combo = 0; sfx.typo(); burst(x, y, ['#c9b88a', '#8c8670'], 3, 20, 60, .25); renderHud(); return;
    }
    if (k.s === 'blot') {
      MG.hitstop(.08); fx.puff(x, y, '#3a2a30', 6); G.hearts--; G.blots++; G.combo = 0; G.shake = 6; k.s = 'idle'; k.bad = .3; sfx.bonk(); doFlash('#2a1020');
      burst(x, y, ['#1a0f14', '#3a2a30', '#5c4650'], 16, 70, 160, .6); floatText(x, y - 10, 'BLOT! -1', 'bad'); express('scared', .8);
      renderHud(); if (G.hearts <= 0) endGame(); return;
    }
    const frac = k.t / k.life, fast = frac > .66; let pts;
    G.whacks++; G.combo++; G.bestCombo = Math.max(G.bestCombo, G.combo);
    if (k.s === 'banana') {
      pts = Math.round(50 * m); G.bananas++; sfx.golden(); burst(x, y - 4, ['#ffd23a', '#fff08c', '#c98f0e'], 14, 70, 90, .7); floatText(x, y - 14, '+' + pts, 'gold');
      if (G.hearts < 3) { G.hearts++; floatText(x, y - 24, '+HEART', 'gold'); }
    } else if (k.s === 'gold') {
      MG.hitstop(.06); fx.confetti(x, y - 4, 16, ['#ffd23a', '#fff08c', '#fffbe0']); pts = Math.round(100 * m); G.goldens++; G.frenzy = 6; sfx.golden(); G.shake = 3; ring(x, y, '#ffd23a', 40);
      burst(x, y, ['#ffd23a', '#fff08c', '#fffbe0'], 22, 90, 70, .8); express('screech', 1); say('GOLD FRENZY<small>more keys · more time · 6s</small>'); floatText(x, y - 14, '+' + pts, 'gold');
    } else if (k.s === 'ice' && k.diamond) {
      MG.hitstop(.12); fx.confetti(x, y - 4, 34); fx.shock(x, y, '#9be8ff', 50); pts = Math.round(100 * m); G.diamonds++; G.mash = 5; G.slow = .35; G.slowT = .9; G.shake = 5; sfx.diamond(); doFlash('#e8fbff');
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
    G.score += pts; bump(); G.flyers.push({ ch: k.ch, x0: x, y0: y, t: 0 }); ring(x, y, '#fff08c', 11); monkey.hop = .12;
    if (G.combo % 6 === 0 && G.combo <= 24) { floatText(W / 2, 80, `COMBO x${mult()}!`, 'gold big'); sfx.golden(); pulseCombo(); express('screech', .5); fx.confetti(W / 2, 84, 14); }
    renderHud();
  }
  const byChar = ch => keys.find(k => k.ch === ch);

  /* ---------- update ---------- */
  function update(rdt) {
    fx.update(rdt);
    if (!S.playing) { if (S.phase === 'title') ambient(rdt); return; }
    if (G.slowT > 0) { G.slowT -= rdt; if (G.slowT <= 0) G.slow = 1; }
    const dt = rdt * G.slow; G.t += dt; G.sinceDiamond += dt;
    if (G.frenzy > 0) G.frenzy = Math.max(0, G.frenzy - dt);
    if (G.mash > 0) { G.mash -= dt; if (G.mash <= 0) { G.mash = 0; keys.forEach(k => { if (k.s === 'ice') k.s = 'idle'; }); say('NICE MASH!', 'ice'); } }
    const bonus = G.mash > 0 ? G.mash / 5 : G.frenzy > 0 ? G.frenzy / 6 : 0; ui.setMeter(bonus, G.mash > 0);
    if (G.deadT > 0) { G.deadT -= rdt; if (G.deadT <= 0) showOver(); }
    if (G.stampT > 0) G.stampT -= rdt;
    for (let i = G.flyers.length - 1; i >= 0; i--) { const f = G.flyers[i]; f.t += rdt / .26; if (f.t >= 1) { G.flyers.splice(i, 1); stamp(f.ch); const row = G.paper[G.paper.length - 1]; fx.burst(PAPER.x + 4 + row.length * 4, PAPER.y + 4 + (G.paper.length - 1) * 7 + 3, ['#ffd23a', '#fff6d6'], 3, 20, 30, .25); } }

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
  const drawLetter = (ch, x, y, col) => text(g, ch, x, y, col, .75);
  function draw() {
    g.clearRect(0, 0, W, H); g.save();
    if (G.shake > .3) g.translate(Math.round(rng(-G.shake, G.shake) * .5), Math.round(rng(-G.shake, G.shake) * .5));
    /* the machine body: wooden plate with a brass trim and a platen roller */
    st.hi(bodyBg, 0, 0);
    /* paper */
    g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(PAPER.x + 2, PAPER.y + 2, PAPER.w, PAPER.h);
    st.hi(paperBg, PAPER.x, PAPER.y);
    const rows = G.paper;
    rows.forEach((row, ri) => {
      const y = PAPER.y + 4 + ri * 7;
      row.split('').forEach((ch, ci) => {
        if (ch === ' ') return;
        const last = ri === rows.length - 1 && ci === row.length - 1 && G.stampT > 0;
        text(g, ch, PAPER.x + 4 + ci * 4, y + (last ? -1 : 0), last ? '#c98f0e' : '#2a1a20', 2 / 3);
      });
    });
    if (S.playing && Math.floor(performance.now() / 350) % 2 === 0) { const row = rows[rows.length - 1], y = PAPER.y + 4 + (rows.length - 1) * 7; g.fillStyle = '#c0392b'; g.fillRect(PAPER.x + 4 + row.length * 4, y + 6, 3, 1); }

    /* monkey on the machine, watching the paper */
    const pose = monkey.exprT > 0 && monkey.expr === 'scared' ? 'scared' : monkey.exprT > 0 && monkey.expr === 'screech' ? 'cheer' : monkey.hop > 0 ? 'launch' : Math.floor(performance.now() / 420) % 2 ? 'breathe' : 'idle';
    MGCrew.draw(st, pose, MONKEY.x, MONKEY.foot + 1, { flip: true });
    /* keys */
    for (const k of keys) {
      const raised = k.s !== 'idle' && (k.s !== 'ice' || k.diamond), mashing = k.s === 'ice' && !k.diamond;
      const kind = k.s === 'idle' ? 'up' : k.s === 'banana' ? 'hot' : k.s === 'ice' ? 'ice' : k.s;
      const bob = raised ? (Math.floor(performance.now() / 120) % 2 ? -3 : -2) : 0;
      const wob = k.bad > 0 ? (Math.floor(k.bad * 40) % 2 ? 1 : -1) : 0;
      const down = k.down > 0;
      const cv = k.ch === ' ' ? spaceSprite(kind === 'blot' ? 'up' : kind, down) : keySprite(k.ch, kind === 'blot' ? 'blot' : kind, down);
      st.hi(cv, k.x + wob, k.y + bob);
      if (k.bad > 0) { g.fillStyle = 'rgba(192,57,43,.45)'; g.fillRect(k.x + 1 + wob, k.y + 1, k.w - 2, k.h - 2); }
      if (k.s === 'banana') st.hi(A3.bananaS, k.x + k.w / 2 - A3.bananaS.width / 6, k.y - 11 + bob);
      if (raised && k.s !== 'blot') { const pul = .35 + .3 * Math.sin(performance.now() / 110 + k.x); g.fillStyle = k.s === 'ice' ? `rgba(155,232,255,${pul.toFixed(2)})` : `rgba(255,230,120,${pul.toFixed(2)})`; g.fillRect(k.x - 1 + wob, k.y + bob - 1, k.w + 2, 1); g.fillRect(k.x - 1 + wob, k.y + bob + k.h, k.w + 2, 1); g.fillRect(k.x - 1 + wob, k.y + bob, 1, k.h); g.fillRect(k.x + k.w + wob, k.y + bob, 1, k.h); }
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
    for (const f of G.flyers) {                                              /* a letter arcs from the key up to where it will be typed */
      const row = G.paper[G.paper.length - 1], tx = PAPER.x + 4 + row.length * 4 + 1, ty = PAPER.y + 4 + (G.paper.length - 1) * 7 + 2, k = f.t, e = k * k * (3 - 2 * k);
      const x = lerp(f.x0, tx, e), y = lerp(f.y0, ty, e) - Math.sin(k * Math.PI) * 14; fx.trail(x, y, '#fff08c'); g.fillStyle = '#1a0f14'; g.fillRect(x - 3.33, y - 4.33, 7.33, 9.33); g.fillStyle = '#fff6d6'; g.fillRect(x - 2.67, y - 3.67, 6, 8); drawLetter(f.ch, x - 1.9, y - 2.4, '#1a0f14');
    }
    fx.draw(g);
    if (G.frenzy > 0 || G.mash > 0) { g.fillStyle = G.mash > 0 ? 'rgba(155,232,255,.1)' : 'rgba(255,210,58,.09)'; g.fillRect(0, 0, W, H); }
    g.restore();
  }

  /* ---------- flow ---------- */
  const S = MG.shell({
    host, ui, id: 'whack', title: 'KEY<span>WHACK</span>', sub: 'Hit the lit keys before they snap back.',
    legend: [[keySprite('K', 'hot'), '<em>10-20</em> lit key'], [keySprite('A', 'blot'), '<em class="bad">-1 heart</em> blot'], [spaceSprite('hot'), '<em>50</em> banana bar'], [keySprite('Q', 'gold'), '<em>100</em> frenzy'], [keySprite('Z', 'ice'), '<em class="ice">100</em> mash!'], [keySprite('M', 'up'), '<em class="bad">miss</em> = -1 heart']],
    hint: 'type the letters · or tap the keys · space bar too', spaceStarts: false, onStart: () => newGame(), onMenu: () => newGame(), score: () => G.score,
  });
  function endGame() { G.deadT = 1; sfx.over(); G.slow = .5; G.slowT = 1; ui.setMeter(0); ui.combo.classList.remove('on'); }
  function showOver() {
    const tries = G.whacks + G.misses + G.typos + G.blots, acc = tries ? Math.round(G.whacks / tries * 100) : 0;
    S.finish([['WHACKS', G.whacks], ['ACCURACY', acc + '%'], ['BEST COMBO', G.bestStreak || G.bestCombo], ['LETTERS/MIN', Math.round(G.whacks / Math.max(1, G.t) * 60)], ['GOLD / DIAMOND', `${G.goldens} / ${G.diamonds}`], ['TIME', Math.round(G.t) + 's']]);
  }

  /* ---------- input ---------- */
  addEventListener('keydown', e => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key;
    if (S.playing) { const ch = k === ' ' ? ' ' : k.length === 1 ? k.toUpperCase() : ''; const key = ch && byChar(ch); if (key && !e.repeat) { press(key); e.preventDefault(); } else if (k === ' ') e.preventDefault(); return; }
    if (k === ' ' && !e.repeat && (S.phase === 'title' || S.phase === 'over')) { sfx.unlock(); S.start(); e.preventDefault(); }
  });
  addEventListener('pointerdown', ev => {
    if (ev.target.closest('.mg-over,.mg-nav')) return; sfx.unlock(); if (!S.playing) return;
    const [px, py] = st.toArt(ev); let best = null, bd = 1e9;
    for (const k of keys) { const dx = Math.max(k.x - 1 - px, 0, px - (k.x + k.w + 1)), dy = Math.max(k.y - 4 - py, 0, py - (k.y + k.h + 1)), d = dx * dx + dy * dy; if (d < bd) { bd = d; best = k; } }
    if (best && bd < 36) press(best);
  });
  newGame(); S.title();
  if (params.get('autostart')) {
    S.start(); botOn = !!params.get('bot');
    for (let i = 0, n = (+params.get('warp') || 0) * 60; i < n; i++) update(1 / 60);
  }
  MG.loop(update, draw);
  window.KW = { get G() { return G; }, keys: () => keys, press, get phase() { return S.phase; } };
})();
