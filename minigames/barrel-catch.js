/* ============================================================
   BANANA BARREL: the monkey holds a barrel overhead and scampers left/right to catch what falls.
   Bananas and letter bundles score, coconuts cost a heart, rotten bananas break the combo.
   Rare: the Golden Banana starts a Golden Hour; the Diamond Banana is a jackpot.
   Controls: ← → / A D, or drag / move the mouse (the monkey chases your cursor).
   Standalone: no connection to the main game's save yet.
   ============================================================ */
(() => {
  'use strict';
  const { rng, clamp, lerp, store, sfx, h, spriteImg } = MG;
  const W = 120, H = 208, GROUND = H - 16, FOOT = GROUND + 3;
  const K = 0.7, MAX_LEAN = 21, BARREL_R = 12.5;
  const MODES = { bananas: 'BANANA RUN', fruit: 'FRUIT FALL' };
  const params = new URLSearchParams(location.search), RARE = +params.get('rare') || 0;

  MG.boot();
  const A = MGArt.build(), A3 = MGArt3.build();
  const host = document.getElementById('stage'), st = MG.stage(host, W, H, { padY: 40 }), g = st.g;

  const ui = MG.ui(host, st, A3.banana), fx = MG.fx();
  const rectc = (x, c, a, b, w, h) => { x.fillStyle = c; x.fillRect(a, b, w, h); }, seeded = s0 => () => ((s0 = (s0 * 1664525 + 1013904223) >>> 0) / 4294967296);
  const { R, shapes: { ell, box, and, sub } } = MGArt, make = MGArt3.make, { cvs, hl } = MGArt3;
  /* hi-res barrel: the open mouth is the back layer, the staves and front rim are the front layer, so a catch can sink between them */
  const barrelBack = make(90, 36, px => { px.shape(ell(45, 18, 42, 16.8), R.woodL, 1); px.shape(ell(45, 19.8, 34.8, 10.8), R.ink, 2); px.shape(ell(45, 21, 30, 7), R.woodD, 3); });
  const barrelFront = make(90, 78, px => {
    const body = and(ell(45, 45, 42, 34.2), (x, y) => y >= 18);
    px.shape(body, R.wood, 1);
    for (let x = 12; x < 84; x += 15) px.shape(and(body, box(x, 24, 1.4, 60)), R.woodD, 2);
    for (let x = 8; x < 86; x += 15) px.shape(and(body, box(x, 24, 1, 60)), R.woodL, 2);
    [39, 66].forEach(y0 => { px.shape(and(body, box(0, y0, 90, 5)), R.metal, 3); px.shape(and(body, box(0, y0, 90, 1.4)), R.metal, 4); });
    px.shape(and(sub(ell(45, 18, 42, 16.8), ell(45, 19.8, 34.8, 10.8)), (x, y) => y >= 18.6), R.woodL, 5);
    hl(px, 8, 40, 3, 20, 2); hl(px, 12, 42, 2, 16, 2);
  });
  const groundBg = cvs(W * 3, (H - GROUND + 4) * 3, (x, tw, th) => {
    const r = seeded(19); rectc(x, '#5a3517', 0, 12, tw, th - 12); rectc(x, '#1f6a2a', 0, 0, tw, 14); rectc(x, '#2f8a35', 0, 0, tw, 8); rectc(x, '#74c648', 0, 0, tw, 2);
    for (let i = 0; i < 140; i++) rectc(x, ['#3a1e0b', '#6a4120', '#4a2a12'][i % 3], Math.floor(r() * tw), 16 + Math.floor(r() * (th - 18)), 1 + Math.floor(r() * 3), 1 + Math.floor(r() * 2));
    for (let i = 0; i < 30; i++) { const px0 = Math.floor(r() * tw), py0 = 18 + Math.floor(r() * (th - 22)); rectc(x, '#8c8670', px0, py0, 4, 3); rectc(x, '#b8b2a0', px0, py0, 4, 1); }
    for (let i = 0; i < 110; i++) { const bx = Math.floor(r() * tw), bh = 3 + Math.floor(r() * 7); rectc(x, ['#2f8a35', '#3f9a3a', '#1f6a2a', '#74c648'][i % 4], bx, -bh + 7, 1, bh + 3); }
    rectc(x, '#1a0f14', 0, th - 3, tw, 3);
  });
  /* the crew monkey, tilted about its feet as it runs (cached per pose / expression / 7 degree step) */
  const tiltCache = new Map();
  function tilted(pose, ex, deg) {
    const key = pose + ex + deg; let c = tiltCache.get(key);
    if (!c) { c = cvs(110, 110, x => { x.imageSmoothingEnabled = false; x.translate(55, 55 + 18); x.rotate(deg * Math.PI / 180); x.translate(-32, -55); x.drawImage(MGCrew.frame(pose, { expr: ex }), 0, 0); }); tiltCache.set(key, c); }
    return c;
  }

  const { combo, over, say, floatText, doFlash, bump, pulseCombo } = ui;

  /* ---------- state ---------- */
  let mode = 'bananas', G = null;
  const monkey = { x: W / 2, tx: W / 2, vx: 0, ph: 0, phT: 0, blink: 0, stun: 0, expr: 'normal', exprT: 0, face: 0 };
  const keys = { l: false, r: false };
  let usingKeys = false, botOn = false;     /* ?bot=1 is a dev autoplayer for testing */

  function newGame() {
    G = {
      t: 0, score: 0, hearts: 3, combo: 0, bestCombo: 0, spawnT: .8, shake: 0, slow: 1, slowT: 0,
      items: [], sinks: [], parts: [], rings: [], golden: 0, jackpot: 0, sinceDiamond: 0, sinceGolden: 0, deadT: 0,
      caught: 0, bundles: 0, letters: 0, goldens: 0, diamonds: 0, bonks: 0, rotten: 0, missed: 0,
    };
    monkey.x = monkey.tx = W / 2; monkey.vx = 0; monkey.stun = 0; monkey.expr = 'normal';
    renderHud(true);
  }
  newGame();
  function best() { return store.get('barrel:' + mode, 0); }

  function renderHud(initial) { ui.setScore(G.score); ui.setHearts(G.hearts, !initial); ui.setCombo(G.combo, mult()); }
  function mult() { return 1 + Math.min(4, Math.floor(G.combo / 6)) * .5; }

  /* ---------- spawning ---------- */
  function pickType() {
    if (G.jackpot > 0) return Math.random() < .55 ? 'golden' : 'banana';
    if (G.golden > 0) return 'banana';
    const d = clamp(G.t / 100, 0, 1), since = G.sinceDiamond;
    const w = mode === 'fruit'
      ? { fruit: 56, coconut: lerp(9, 18, d), rotten: 6, golden: 2.2 + RARE * 20, diamond: .45 + Math.min(2.5, since / 60) + RARE * 12 }
      : { banana: 42, bundle: 24, coconut: lerp(10, 20, d), rotten: 6, golden: 2.2 + RARE * 20, diamond: .45 + Math.min(2.5, since / 60) + RARE * 12 };
    if (G.t < 6) { delete w.coconut; delete w.rotten; delete w.golden; delete w.diamond; }
    let tot = 0; for (const k in w) tot += w[k];
    let r = Math.random() * tot; for (const k in w) { r -= w[k]; if (r <= 0) return k; }
    return 'banana';
  }
  function spawn(type) {
    type = type || pickType();
    const d = clamp(G.t / 100, 0, 1);
    const it = { type, x: rng(11, W - 11), y: -10, vy: lerp(46, 108, d) * rng(.86, 1.18), sw: 0, sp: rng(6.28), age: 0, hit: false, bounced: false };
    if (type === 'banana') it.cv = A3.banana;
    else if (type === 'fruit') it.cv = A3.fruits[Math.floor(Math.random() * A3.fruits.length)];
    else if (type === 'bundle') { const L = MGArt.LETTERS, a = L[Math.floor(Math.random() * 26)], b = L[Math.floor(Math.random() * 26)], c = L[Math.floor(Math.random() * 26)]; it.cv = MGArt3.bundleHi(a, b, c); it.sw = 5; it.vy *= .8; }
    else if (type === 'coconut') it.cv = A3.coconut;
    else if (type === 'rotten') it.cv = A3.rotten;
    else if (type === 'golden') { it.cv = A3.golden; it.sw = 7; it.vy *= .78; }
    else if (type === 'diamond') { it.cv = A3.diamond; it.sw = 10; it.vy = 40; it.x = rng(26, W - 26); G.sinceDiamond = 0; }
    it.hw = it.cv.width / 6; it.hh = it.cv.height / 6;
    G.items.push(it); return it;
  }

  /* ---------- particles ---------- */
  function burst(x, y, cols, n, spd = 60, grav = 140, life = .5, size = 1) {
    for (let i = 0; i < n; i++) { const a = rng(Math.PI * 2), s = rng(spd * .3, spd); G.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - spd * .4, g: grav, t: 0, life: life * rng(.7, 1.2), col: cols[i % cols.length], size }); }
  }
  function sparkle(x, y, n = 1, ice) {
    for (let i = 0; i < n; i++) G.parts.push({ x: x + rng(-9, 9), y: y + rng(-9, 9), vx: rng(-8, 8), vy: rng(-14, 4), g: 0, t: 0, life: rng(.35, .7), spark: true, ice });
  }
  const ring = (x, y, col, max = 22) => G.rings.push({ x, y, t: 0, col, max });

  /* ---------- catching ---------- */
  function barrelPos() {
    const a = lean() * MAX_LEAN * Math.PI / 180, pivotY = FOOT - 13;
    return { x: monkey.x + Math.sin(a) * 27, y: FOOT - 31 + Math.abs(Math.sin(a)) * 3, a, pivotY };
  }
  const lean = () => clamp(monkey.vx / 190, -1, 1);
  const catchR = () => BARREL_R + (G.golden > 0 || G.jackpot > 0 ? 5 : 0);

  function onCatch(it, bp) {
    const m = mult();
    it.hit = true; G.sinks.push({ it, t: 0, fromX: it.x, y: it.y });
    if (it.type === 'coconut') {
      MG.hitstop(.09); fx.puff(bp.x, bp.y - 4, '#c9b88a', 5); fx.shock(bp.x, bp.y, '#ff7a6a', 24); G.hearts--; G.bonks++; G.combo = 0; G.shake = 7; monkey.stun = .7; monkey.expr = 'scared'; monkey.exprT = .9;
      sfx.bonk(); doFlash('#c0392b'); burst(bp.x, bp.y, ['#86592e', '#563418', '#fff6d6'], 14, 70, 220, .55);
      floatText(bp.x, bp.y - 16, 'OUCH', 'bad'); G.sinks.pop(); it.dead = true;
      if (G.hearts <= 0) endGame();
      renderHud(); return;
    }
    if (it.type === 'rotten') {
      G.rotten++; G.combo = 0; G.score = Math.max(0, G.score - 15); G.shake = 2; sfx.rotten();
      burst(bp.x, bp.y - 4, ['#6a5a1c', '#3a2a10', '#8c9a2a'], 10, 40, 160, .5); floatText(bp.x, bp.y - 14, 'BLEH -15', 'bad');
      monkey.expr = 'scared'; monkey.exprT = .5; renderHud(); bump(); return;
    }
    G.combo++; G.bestCombo = Math.max(G.bestCombo, G.combo); G.caught++;
    let base = 10, txt = '', cls = '';
    if (it.type === 'banana') { sfx.ding(Math.min(10, G.combo)); burst(bp.x, bp.y - 4, ['#ffd23a', '#fff08c'], 7, 46, 150, .4); }
    else if (it.type === 'fruit') { base = 12; sfx.ding(Math.min(10, G.combo)); burst(bp.x, bp.y - 4, ['#fff6d6', '#ffd23a', '#e86a50'], 7, 46, 150, .4); }
    else if (it.type === 'bundle') { base = 25; G.bundles++; G.letters += 3; sfx.letters(); burst(bp.x, bp.y - 4, ['#fff6d6', '#ede0b8', '#1a0f14'], 10, 50, 120, .5); txt = '+3 LTRS'; }
    else if (it.type === 'golden') {
      MG.hitstop(.06); fx.confetti(bp.x, bp.y - 6, 16, ['#ffd23a', '#fff08c', '#fffbe0']); base = 100; G.goldens++; G.golden = 7; cls = 'gold'; sfx.golden(); G.shake = 3; ring(bp.x, bp.y, '#ffd23a', 40);
      burst(bp.x, bp.y - 4, ['#ffd23a', '#fff08c', '#fffbe0'], 22, 90, 80, .8); monkey.expr = 'screech'; monkey.exprT = 1.2;
      say('GOLDEN HOUR<small>wider barrel · banana rain</small>'); if (G.hearts < 3) { G.hearts++; txt = '+HEART'; }
    }
    else if (it.type === 'diamond') {
      MG.hitstop(.12); fx.confetti(bp.x, bp.y - 6, 34); fx.shock(bp.x, bp.y, '#9be8ff', 46); base = 500; G.diamonds++; G.jackpot = 8; G.golden = 0; cls = 'ice'; sfx.diamond(); G.shake = 5; G.slow = .3; G.slowT = 1.1;
      ring(bp.x, bp.y, '#9be8ff', 60); ring(bp.x, bp.y, '#fff', 36); doFlash('#e8fbff');
      burst(bp.x, bp.y - 4, ['#9be8ff', '#ffffff', '#2a86b8', '#fff08c'], 40, 130, 60, 1.1); monkey.expr = 'screech'; monkey.exprT = 2;
      say('DIAMOND BANANA!<small>jackpot rain · 8 seconds</small>', 'ice'); if (G.hearts < 3) G.hearts++;
    }
    const centre = Math.abs(it.x - bp.x) < 2.4 && base < 100; if (centre) { base += 5; fx.spark(bp.x, bp.y - 6, '#fff'); fx.spark(bp.x, bp.y - 6, '#ffd23a'); txt = txt || 'CENTRE!'; }
    const pts = Math.round(base * m); G.score += pts; bump();
    floatText(bp.x, bp.y - 16, (cls ? '' : '+') + pts + (m > 1 && !cls ? ` x${m}` : ''), cls || (m > 1 ? 'gold' : ''));
    if (txt) floatText(bp.x, bp.y - 26, txt, cls || '');
    if (G.combo > 0 && G.combo % 6 === 0 && G.combo <= 24) { floatText(bp.x, bp.y - 34, `COMBO x${mult()}!`, 'gold big'); sfx.golden(); pulseCombo(); fx.confetti(bp.x, bp.y - 8, 12); fx.shock(bp.x, bp.y - 4, '#ffd23a', 30); }
    renderHud();
  }

  function breakCombo() { if (G.combo >= 3) floatText(monkey.x, GROUND - 30, 'COMBO LOST', 'bad'); G.combo = 0; renderHud(); }

  /* ---------- update ---------- */
  function update(rdt) {
    fx.update(rdt);
    if (S.playing && G.combo >= 12 && Math.random() < .5) { const b0 = barrelPos(); fx.burst(b0.x + rng(-9, 9), b0.y - 6, G.combo >= 24 ? ['#9be8ff', '#fff'] : ['#ff8a2a', '#ffd23a', '#fff08c'], 1, 22, -40, .4); }
    if (!S.playing) { menuFx(rdt); return; }
    if (G.slowT > 0) { G.slowT -= rdt; if (G.slowT <= 0) G.slow = 1; }
    const dt = rdt * G.slow;
    G.t += dt; G.sinceDiamond += dt;
    if (G.golden > 0) G.golden = Math.max(0, G.golden - dt);
    if (G.jackpot > 0) G.jackpot = Math.max(0, G.jackpot - dt);
    const bonus = G.jackpot > 0 ? G.jackpot / 8 : G.golden > 0 ? G.golden / 7 : 0;
    ui.setMeter(bonus, G.jackpot > 0);
    if (G.deadT > 0) { G.deadT -= rdt; if (G.deadT <= 0) showOver(); }

    /* monkey */
    if (botOn) { let b = null; for (const it of G.items) if (!it.hit && it.type !== 'coconut' && it.type !== 'rotten' && it.y > 0 && (!b || it.y > b.y)) b = it; monkey.tx = b ? b.x : W / 2; usingKeys = false; }
    const dying = G.hearts <= 0;
    if (usingKeys) { const dir = (keys.r ? 1 : 0) - (keys.l ? 1 : 0); monkey.tx = dir ? monkey.x + dir * 90 : monkey.x; }
    let want = clamp((monkey.tx - monkey.x) * 9, -235, 235);
    if (monkey.stun > 0 || dying) { monkey.stun -= rdt; want = 0; }
    monkey.vx += (want - monkey.vx) * Math.min(1, rdt * 16);
    monkey.x = clamp(monkey.x + monkey.vx * rdt, 17, W - 17);
    if (Math.abs(monkey.vx) > 24) { monkey.phT -= rdt; if (monkey.phT <= 0) { monkey.ph ^= 1; monkey.phT = .085; if (Math.random() < .5) dust(monkey.x, FOOT); } } else monkey.ph = 0;
    if (monkey.exprT > 0) { monkey.exprT -= rdt; if (monkey.exprT <= 0) monkey.expr = 'normal'; }
    monkey.blink -= rdt; if (monkey.blink < -3.2) monkey.blink = .14;

    /* spawn */
    G.spawnT -= dt;
    if (!dying && G.spawnT <= 0) {
      const d = clamp(G.t / 100, 0, 1), fast = G.jackpot > 0 ? .3 : G.golden > 0 ? .5 : 1;
      G.spawnT = lerp(.95, .36, d) * fast * rng(.7, 1.25);
      if (G.t > 25 && Math.random() < .09 * d) { for (let i = 0; i < 3; i++) setTimeout(() => G && S.playing && spawn(), i * 130); }
      spawn();
    }

    /* items */
    const bp = barrelPos(), mouthY = bp.y, R = catchR();
    for (let i = G.items.length - 1; i >= 0; i--) {
      const it = G.items[i]; if (it.dead) { G.items.splice(i, 1); continue; }
      it.age += dt; const py = it.y;
      it.y += it.vy * dt; if (it.sw) it.x += Math.cos(it.age * 3 + it.sp) * it.sw * dt * 3;
      it.x = clamp(it.x, it.hw, W - it.hw);
      if (it.type === 'golden' || it.type === 'diamond') { it.tr = (it.tr || 0) - dt; if (it.tr <= 0) { it.tr = .05; sparkle(it.x, it.y, 1, it.type === 'diamond'); } }
      if (!it.hit && !it.bounced && py + it.hh * .4 < mouthY && it.y + it.hh * .4 >= mouthY && Math.abs(it.x - bp.x) <= R + it.hw * .35 && G.hearts > 0) {
        onCatch(it, bp); if (it.dead) { G.items.splice(i, 1); continue; }
      }
      if (it.hit) { G.items.splice(i, 1); continue; }
      if (it.y + it.hh >= GROUND) {
        if (it.type === 'coconut' && !it.bounced) { it.bounced = true; it.vy = -it.vy * .42; it.y = GROUND - it.hh; sfx.thud(); burst(it.x, GROUND, ['#563418', '#86592e'], 5, 30, 120, .3); continue; }
        if (it.bounced && it.vy < 0) continue;
        if (it.type === 'coconut' || it.type === 'rotten') { burst(it.x, GROUND, ['#563418', '#6a5a1c'], 5, 28, 120, .3); G.items.splice(i, 1); continue; }
        if (it.type !== 'coconut') { G.missed++; fx.puff(it.x, GROUND, '#c9b88a', 4); if (it.type === 'diamond' || it.type === 'golden') { floatText(it.x, GROUND - 14, 'SO CLOSE!', 'bad'); burst(it.x, GROUND, ['#9be8ff', '#ffd23a'], 12, 50, 120, .5); } else sfx.miss(); breakCombo(); burst(it.x, GROUND, ['#fff6d6', '#ffd23a'], 4, 24, 100, .3); }
        G.items.splice(i, 1);
      }
      if (it.bounced) it.vy += 460 * dt;
    }

    /* things sinking into the barrel */
    for (let i = G.sinks.length - 1; i >= 0; i--) { const s = G.sinks[i]; s.t += dt; if (s.t > .16) G.sinks.splice(i, 1); }

    /* particles + rings */
    for (let i = G.parts.length - 1; i >= 0; i--) { const p = G.parts[i]; p.t += rdt; p.x += p.vx * rdt; p.y += p.vy * rdt; p.vy += (p.g || 0) * rdt; if (p.t >= p.life) G.parts.splice(i, 1); }
    for (let i = G.rings.length - 1; i >= 0; i--) { const r = G.rings[i]; r.t += rdt; if (r.t > .5) G.rings.splice(i, 1); }
    G.shake = Math.max(0, G.shake - rdt * 22);
  }
  function dust(x, y) { if (S.playing) G.parts.push({ x: x + rng(-3, 3), y: y - 1, vx: rng(-8, 8), vy: rng(-14, -4), g: 0, t: 0, life: .3, col: '#c9b88a', size: 1 }); }

  /* the title screen shows a few ambient items falling behind the overlay */
  let ambT = 0;
  function menuFx(dt) {
    if (!G) return; ambT -= dt;
    if (ambT <= 0 && S.phase === 'title') { ambT = .7; const t = ['banana', 'bundle', 'coconut', 'banana'][Math.floor(Math.random() * 4)]; if (G.items.length < 6) { const it = spawn(t === 'bundle' && mode === 'fruit' ? 'banana' : t); it.vy *= .8; } }
    G.items.forEach(it => { it.y += it.vy * dt; });
    G.items = G.items.filter(it => it.y < H + 10);
    monkey.tx = W / 2 + Math.sin(performance.now() / 1100) * 26; monkey.vx += (clamp((monkey.tx - monkey.x) * 5, -80, 80) - monkey.vx) * .1; monkey.x += monkey.vx * dt;
    if (Math.abs(monkey.vx) > 24) { monkey.phT -= dt; if (monkey.phT <= 0) { monkey.ph ^= 1; monkey.phT = .12; } } else monkey.ph = 0;
    for (let i = G.parts.length - 1; i >= 0; i--) { const p = G.parts[i]; p.t += dt; if (p.t >= p.life) G.parts.splice(i, 1); }
  }

  /* ---------- draw ---------- */
  const blit = (cv, cx, cy, flipX) => st.hi(cv, cx - cv.width / 6, cy - cv.height / 6, flipX);
  function draw() {
    g.clearRect(0, 0, W, H);
    g.save();
    if (G.shake > .3) g.translate(Math.round(rng(-G.shake, G.shake) * .5), Math.round(rng(-G.shake, G.shake) * .5));

    /* ground */
    st.hi(groundBg, 0, GROUND - 2);
    if (G.golden > 0 || G.jackpot > 0) { g.fillStyle = G.jackpot > 0 ? 'rgba(155,232,255,.18)' : 'rgba(255,210,58,.14)'; g.fillRect(0, 0, W, H); }

    /* falling things */
    for (const it of G.items) {                                            /* a growing shadow shows where it will land */
      if (it.hit || it.bounced || it.y < 12) continue; const k = clamp(it.y / GROUND, 0, 1), w = 3 + Math.round(k * 8); g.fillStyle = `rgba(0,0,0,${(.1 + k * .22).toFixed(2)})`; g.fillRect(Math.round(it.x - w / 2), GROUND + 1, w, 2);
    }
    for (const it of G.items) {
      if (it.type === 'coconut' && Math.floor(it.age * 5) % 2) { blit(it.cv, it.x, it.y, true); continue; }
      if (it.type === 'golden' || it.type === 'diamond') { const k = Math.floor(it.age * 8) % 2; if (k) { g.globalAlpha = .35; blit(it.cv, it.x - 1, it.y); g.globalAlpha = 1; } }
      blit(it.cv, it.x, it.y);
    }

    /* monkey + barrel */
    const bp = barrelPos(), a = bp.a;
    const ex = monkey.stun > 0 ? 'scared' : (monkey.expr !== 'normal' ? monkey.expr : monkey.blink > 0 ? 'blink' : 'normal');
    const mouthY = bp.y, bx = bp.x, by = mouthY, dying2 = G.hearts <= 0;
    const squash = G.sinks.length ? Math.round(Math.sin(G.sinks[G.sinks.length - 1].t / .16 * Math.PI) * 6) / 3 : 0;
    const bpose = monkey.stun > 0 || dying2 ? 'holdhit' : monkey.exprT > 0 && monkey.expr === 'screech' ? 'hold0' : Math.abs(monkey.vx) > 24 ? (monkey.ph ? 'hold1' : 'hold2') : 'hold0', tex = monkey.stun > 0 ? 'screech' : 'determined';
    const deg = Math.round(a * 180 / Math.PI / 7) * 7; st.hi(tilted(bpose, tex, deg), monkey.x - 55 / 3, FOOT - 73 / 3);    /* barrel back, then what's sinking in, then the front staves */
    st.hi(barrelBack, bx - 15, by - 6);
    if (G.golden > 0 || G.jackpot > 0) { g.globalAlpha = .5 + Math.sin(performance.now() / 90) * .3; g.fillStyle = G.jackpot > 0 ? '#9be8ff' : '#ffd23a'; g.fillRect(bx - 15, by - 7, 30, 1); g.globalAlpha = 1; }
    for (const s of G.sinks) { const k = s.t / .16, it = s.it; g.save(); g.beginPath(); g.rect(bx - 16, by - 40, 32, 40 + 6); g.clip(); blit(it.cv, lerp(it.x, bx, Math.min(1, k * 1.4)), lerp(by - 2, by + 11, k)); g.restore(); }
    st.hi(barrelFront, bx - 15, by - 6 + squash);

    /* particles */
    for (const p of G.parts) {
      const k = 1 - p.t / p.life;
      if (p.spark) { const sp = p.ice ? PXA.spr.star.cv : PXA.spr.star.cv; g.globalAlpha = Math.min(1, k * 2); if (p.ice) { g.fillStyle = Math.floor(p.t * 20) % 2 ? '#fff' : '#9be8ff'; g.fillRect(Math.round(p.x), Math.round(p.y - 1), 1, 3); g.fillRect(Math.round(p.x - 1), Math.round(p.y), 3, 1); } else g.drawImage(sp, Math.round(p.x - 2), Math.round(p.y - 2)); g.globalAlpha = 1; }
      else { g.fillStyle = p.col; g.fillRect(Math.round(p.x), Math.round(p.y), p.size > 1 ? p.size : 1 + (k > .5 ? 1 : 0), p.size > 1 ? p.size : 1 + (k > .5 ? 1 : 0)); }
    }
    for (const r of G.rings) {
      const k = r.t / .5, rad = r.max * k; g.globalAlpha = 1 - k; g.strokeStyle = r.col; g.lineWidth = 1;
      g.beginPath(); g.arc(r.x + .5, r.y + .5, Math.round(rad), 0, Math.PI * 2); g.stroke(); g.globalAlpha = 1;
    }
    fx.draw(g);
    /* stun stars */
    if (monkey.stun > 0) { for (let i = 0; i < 3; i++) { const ang = performance.now() / 120 + i * 2.09; g.drawImage(PXA.spr.star.cv, Math.round(monkey.x + Math.cos(ang) * 9 - 2), Math.round(by + 12 + Math.sin(ang) * 3)); } }
    g.restore();
  }

  /* ---------- flow ---------- */
  const S = MG.shell({
    host, ui, id: 'barrel', title: 'BANANA<span>BARREL</span>', sub: 'Catch what falls. Dodge the coconuts.',
    legend: [[A3.banana, '<em>10</em> banana'], [MGArt3.bundleHi('M', 'K', 'Y'), '<em>25</em> letters'], [A3.golden, '<em>100</em> golden'], [A3.diamond, '<em class="ice">500</em> diamond'], [A3.coconut, '<em class="bad">-1 heart</em> coconut'], [A3.rotten, '<em class="bad">-15</em> rotten']],
    modes: [{ k: 'bananas', label: 'BANANA RUN' }, { k: 'fruit', label: 'FRUIT FALL', cls: 'alt' }], hint: '← → or A D · or drag / move the mouse',
    onStart: m => { mode = m; newGame(); monkey.tx = monkey.x = W / 2; }, onMenu: () => newGame(), score: () => G.score,
  });
  function endGame() { G.deadT = 1.1; sfx.over(); G.slow = .5; G.slowT = 1; combo.classList.remove('on'); ui.setMeter(0); }
  function showOver() { S.finish([['BANANAS & CO', G.caught], ['LETTERS', G.letters], ['BEST COMBO', G.bestCombo], ['GOLDEN', G.goldens], ['DIAMOND', G.diamonds], ['TIME', Math.round(G.t) + 's']]); }

  /* ---------- input ---------- */
  function point(ev) { if (!S.playing) return; usingKeys = false; monkey.tx = clamp(st.toArt(ev)[0], 17, W - 17); }
  addEventListener('pointermove', point);
  addEventListener('pointerdown', ev => { if (ev.target.closest('.mg-over,.mg-nav')) return; point(ev); sfx.unlock(); });
  addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    if (k === 'arrowleft' || k === 'a') { keys.l = true; usingKeys = true; e.preventDefault(); }
    else if (k === 'arrowright' || k === 'd') { keys.r = true; usingKeys = true; e.preventDefault(); }
  });
  addEventListener('keyup', e => { const k = e.key.toLowerCase(); if (k === 'arrowleft' || k === 'a') keys.l = false; if (k === 'arrowright' || k === 'd') keys.r = false; });

  S.title();
  if (params.get('autostart')) {
    S.start(params.get('mode') || 'bananas');
    if (params.get('bot')) botOn = true;
    for (let i = 0, n = (+params.get('warp') || 0) * 60; i < n; i++) update(1 / 60);
  }
  MG.loop(update, draw);
  window.BB = { get G() { return G; }, get monkey() { return monkey; }, spawn, start: S.start, get phase() { return S.phase; } };
})();
