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
  PXA.monkeySets.mini = { k: K, max: MAX_LEAN, step: 7 };
  { const s = PXA.monkeySets.mini; s.angles = []; for (let a = -s.max; a <= s.max; a += s.step) s.angles.push(a); s.cache = {}; }
  const A = MGArt.build();
  const host = document.getElementById('stage'), st = MG.stage(host, W, H, { padY: 40 }), g = st.g;

  const ui = MG.ui(host, st, A.banana);
  const { combo, over, say, floatText, doFlash, bump, pulseCombo } = ui;

  /* ---------- state ---------- */
  let mode = 'bananas', phase = 'title', G = null;
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
    if (type === 'banana') it.cv = A.banana;
    else if (type === 'fruit') it.cv = A.fruits[Math.floor(Math.random() * A.fruits.length)];
    else if (type === 'bundle') { const L = MGArt.LETTERS, a = L[Math.floor(Math.random() * 26)], b = L[Math.floor(Math.random() * 26)], c = L[Math.floor(Math.random() * 26)]; it.cv = MGArt.bundle(a, b, c); it.sw = 5; it.vy *= .8; }
    else if (type === 'coconut') it.cv = A.coconut;
    else if (type === 'rotten') it.cv = A.rotten;
    else if (type === 'golden') { it.cv = A.golden; it.sw = 7; it.vy *= .78; }
    else if (type === 'diamond') { it.cv = A.diamond; it.sw = 10; it.vy = 40; it.x = rng(26, W - 26); G.sinceDiamond = 0; }
    it.hw = it.cv.width / 2; it.hh = it.cv.height / 2;
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
    const a = lean() * MAX_LEAN * Math.PI / 180, pivotY = FOOT - 41.5 * K;
    return { x: monkey.x + Math.sin(a) * 20, y: pivotY - 25 + Math.abs(Math.sin(a)) * 3, a, pivotY };
  }
  const lean = () => clamp(monkey.vx / 190, -1, 1);
  const catchR = () => BARREL_R + (G.golden > 0 || G.jackpot > 0 ? 5 : 0);

  function onCatch(it, bp) {
    const m = mult();
    it.hit = true; G.sinks.push({ it, t: 0, fromX: it.x, y: it.y });
    if (it.type === 'coconut') {
      G.hearts--; G.bonks++; G.combo = 0; G.shake = 7; monkey.stun = .7; monkey.expr = 'scared'; monkey.exprT = .9;
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
      base = 100; G.goldens++; G.golden = 7; cls = 'gold'; sfx.golden(); G.shake = 3; ring(bp.x, bp.y, '#ffd23a', 40);
      burst(bp.x, bp.y - 4, ['#ffd23a', '#fff08c', '#fffbe0'], 22, 90, 80, .8); monkey.expr = 'screech'; monkey.exprT = 1.2;
      say('GOLDEN HOUR<small>wider barrel · banana rain</small>'); if (G.hearts < 3) { G.hearts++; txt = '+HEART'; }
    }
    else if (it.type === 'diamond') {
      base = 500; G.diamonds++; G.jackpot = 8; G.golden = 0; cls = 'ice'; sfx.diamond(); G.shake = 5; G.slow = .3; G.slowT = 1.1;
      ring(bp.x, bp.y, '#9be8ff', 60); ring(bp.x, bp.y, '#fff', 36); doFlash('#e8fbff');
      burst(bp.x, bp.y - 4, ['#9be8ff', '#ffffff', '#2a86b8', '#fff08c'], 40, 130, 60, 1.1); monkey.expr = 'screech'; monkey.exprT = 2;
      say('DIAMOND BANANA!<small>jackpot rain · 8 seconds</small>', 'ice'); if (G.hearts < 3) G.hearts++;
    }
    const pts = Math.round(base * m); G.score += pts; bump();
    floatText(bp.x, bp.y - 16, (cls ? '' : '+') + pts + (m > 1 && !cls ? ` x${m}` : ''), cls || (m > 1 ? 'gold' : ''));
    if (txt) floatText(bp.x, bp.y - 26, txt, cls || '');
    if (G.combo > 0 && G.combo % 6 === 0 && G.combo <= 24) { floatText(bp.x, bp.y - 34, `COMBO x${mult()}!`, 'gold big'); sfx.golden(); pulseCombo(); }
    renderHud();
  }

  function breakCombo() { if (G.combo >= 3) floatText(monkey.x, GROUND - 30, 'COMBO LOST', 'bad'); G.combo = 0; renderHud(); }

  /* ---------- update ---------- */
  function update(rdt) {
    if (phase !== 'play') { menuFx(rdt); return; }
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
      if (G.t > 25 && Math.random() < .09 * d) { for (let i = 0; i < 3; i++) setTimeout(() => G && phase === 'play' && spawn(), i * 130); }
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
        if (it.type !== 'coconut') { G.missed++; if (it.type === 'diamond' || it.type === 'golden') { floatText(it.x, GROUND - 14, 'SO CLOSE!', 'bad'); burst(it.x, GROUND, ['#9be8ff', '#ffd23a'], 12, 50, 120, .5); } else sfx.miss(); breakCombo(); burst(it.x, GROUND, ['#fff6d6', '#ffd23a'], 4, 24, 100, .3); }
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
  function dust(x, y) { if (phase === 'play') G.parts.push({ x: x + rng(-3, 3), y: y - 1, vx: rng(-8, 8), vy: rng(-14, -4), g: 0, t: 0, life: .3, col: '#c9b88a', size: 1 }); }

  /* the title screen shows a few ambient items falling behind the overlay */
  let ambT = 0;
  function menuFx(dt) {
    if (!G) return; ambT -= dt;
    if (ambT <= 0 && phase === 'title') { ambT = .7; const t = ['banana', 'bundle', 'coconut', 'banana'][Math.floor(Math.random() * 4)]; if (G.items.length < 6) { const it = spawn(t === 'bundle' && mode === 'fruit' ? 'banana' : t); it.vy *= .8; } }
    G.items.forEach(it => { it.y += it.vy * dt; });
    G.items = G.items.filter(it => it.y < H + 10);
    monkey.tx = W / 2 + Math.sin(performance.now() / 1100) * 26; monkey.vx += (clamp((monkey.tx - monkey.x) * 5, -80, 80) - monkey.vx) * .1; monkey.x += monkey.vx * dt;
    if (Math.abs(monkey.vx) > 24) { monkey.phT -= dt; if (monkey.phT <= 0) { monkey.ph ^= 1; monkey.phT = .12; } } else monkey.ph = 0;
    for (let i = G.parts.length - 1; i >= 0; i--) { const p = G.parts[i]; p.t += dt; if (p.t >= p.life) G.parts.splice(i, 1); }
  }

  /* ---------- draw ---------- */
  function arm(sx, sy, ex, ey) {
    const n = Math.max(Math.abs(ex - sx), Math.abs(ey - sy));
    for (let i = 0; i <= n; i++) { const x = Math.round(lerp(sx, ex, i / n)), y = Math.round(lerp(sy, ey, i / n)); g.fillStyle = '#2a170b'; g.fillRect(x - 1, y - 1, 4, 4); }
    for (let i = 0; i <= n; i++) { const x = Math.round(lerp(sx, ex, i / n)), y = Math.round(lerp(sy, ey, i / n)); g.fillStyle = '#6e4220'; g.fillRect(x, y, 2, 2); }
    g.fillStyle = '#2a170b'; g.fillRect(ex - 1, ey - 1, 5, 5); g.fillStyle = '#e0aa76'; g.fillRect(ex, ey, 3, 3);
  }
  const blit = (cv, cx, cy) => g.drawImage(cv, Math.round(cx - cv.width / 2), Math.round(cy - cv.height / 2));

  function draw() {
    g.clearRect(0, 0, W, H);
    g.save();
    if (G.shake > .3) g.translate(Math.round(rng(-G.shake, G.shake) * .5), Math.round(rng(-G.shake, G.shake) * .5));

    /* ground */
    g.fillStyle = '#5a3517'; g.fillRect(0, GROUND + 3, W, H - GROUND);
    g.fillStyle = '#3a1e0b'; for (let x = 3; x < W; x += 9) g.fillRect(x, GROUND + 6 + (x * 7) % 5, 2, 1);
    g.fillStyle = '#1f6a2a'; g.fillRect(0, GROUND, W, 4);
    g.fillStyle = '#74c648'; g.fillRect(0, GROUND, W, 1);
    g.fillStyle = '#2f8a35'; for (let x = 1; x < W; x += 4) g.fillRect(x, GROUND - 1 - ((x * 3) % 3 === 0 ? 1 : 0), 1, 2);
    if (G.golden > 0 || G.jackpot > 0) { g.fillStyle = G.jackpot > 0 ? 'rgba(155,232,255,.18)' : 'rgba(255,210,58,.14)'; g.fillRect(0, 0, W, H); }

    /* falling things */
    for (const it of G.items) {
      if (it.type === 'golden' || it.type === 'diamond') { const k = Math.floor(it.age * 8) % 2; if (k) { g.globalAlpha = .35; blit(it.cv, it.x - 1, it.y); g.globalAlpha = 1; } }
      blit(it.cv, it.x, it.y);
    }

    /* monkey + barrel */
    const bp = barrelPos(), a = bp.a;
    const ex = monkey.stun > 0 ? 'scared' : (monkey.expr !== 'normal' ? monkey.expr : monkey.blink > 0 ? 'blink' : 'normal');
    const f = PXA.monkeyFrame('mini', ex, a, false, monkey.ph, 0);
    const mx = Math.round(monkey.x - f.pivot[0]), my = Math.round(bp.pivotY - f.pivot[1]);
    const mouthY = bp.y, bx = Math.round(bp.x), by = Math.round(mouthY);
    const squash = G.sinks.length ? Math.round(Math.sin(G.sinks[G.sinks.length - 1].t / .16 * Math.PI) * 2) : 0;
    const shY = bp.pivotY + 18 * K, bodyX = monkey.x + Math.sin(a) * 5;
    g.drawImage(f.cv, mx, my);
    /* arms: shoulders up to the barrel's sides */
    arm(Math.round(bodyX - 5), Math.round(shY), bx - 13, by + 15 + squash);
    arm(Math.round(bodyX + 5), Math.round(shY), bx + 11, by + 15 + squash);
    /* barrel back, then what's sinking in, then the front staves */
    g.drawImage(A.barrelBack, bx - 15, by - 6);
    if (G.golden > 0 || G.jackpot > 0) { g.globalAlpha = .5 + Math.sin(performance.now() / 90) * .3; g.fillStyle = G.jackpot > 0 ? '#9be8ff' : '#ffd23a'; g.fillRect(bx - 15, by - 7, 30, 1); g.globalAlpha = 1; }
    for (const s of G.sinks) { const k = s.t / .16, it = s.it; g.save(); g.beginPath(); g.rect(bx - 16, by - 40, 32, 40 + 6); g.clip(); blit(it.cv, lerp(it.x, bx, Math.min(1, k * 1.4)), lerp(by - 2, by + 11, k)); g.restore(); }
    g.drawImage(A.barrelFront, bx - 15, by - 6 + squash);

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
    /* stun stars */
    if (monkey.stun > 0) { for (let i = 0; i < 3; i++) { const ang = performance.now() / 120 + i * 2.09; g.drawImage(PXA.spr.star.cv, Math.round(monkey.x + Math.cos(ang) * 9 - 2), Math.round(by + 12 + Math.sin(ang) * 3)); } }
    g.restore();
  }

  /* ---------- flow ---------- */
  function title() {
    phase = 'title'; host.classList.add('menu-open'); document.body.classList.add('mg-menu');
    over.hidden = false; over.innerHTML = '';
    const t = h('h1', 'mg-title', 'BANANA<span>BARREL</span>');
    const sub = h('p', 'mg-sub', 'Catch what falls. Dodge the coconuts.');
    const leg = h('div', 'mg-legend');
    const item = (cv, label, cls = '') => { const d = h('div'); d.append(spriteImg(cv, 2), h('span', '', label)); leg.appendChild(d); };
    item(A.banana, '<em>10</em> banana'); item(MGArt.bundle('M', 'K', 'Y'), '<em>25</em> letters');
    item(A.golden, '<em>100</em> golden'); item(A.diamond, '<em class="ice">500</em> diamond');
    item(A.coconut, '<em class="bad">-1 heart</em>'); item(A.rotten, '<em class="bad">-15</em> rotten');
    const modes = h('div', 'mg-modes');
    Object.keys(MODES).forEach(k => {
      const b = h('a', 'banana-btn' + (k === 'fruit' ? ' banana-btn-green' : ''), `<span>${MODES[k]}</span>`); b.href = '#'; b.dataset.mode = k;
      b.addEventListener('click', e => { e.preventDefault(); sfx.unlock(); start(k); }); modes.appendChild(b);
    });
    const best2 = store.get('barrel:fruit', 0), best1 = store.get('barrel:bananas', 0);
    over.append(t, sub, leg, modes, h('p', 'mg-hint', '← → or A D · or drag / move the mouse'), h('p', 'mg-best', `BEST  RUN ${best1}  ·  FALL ${best2}`));
  }
  function start(m) {
    mode = m || mode; newGame(); phase = 'play'; over.hidden = true; host.classList.remove('menu-open'); sfx.start();
    monkey.tx = monkey.x = W / 2; say(mode === 'fruit' ? 'FRUIT FALL' : 'BANANA RUN', '', 1200);
  }
  function endGame() { G.deadT = 1.1; sfx.over(); G.slow = .5; G.slowT = 1; combo.classList.remove('on'); ui.setMeter(0); }
  function showOver() {
    phase = 'over'; host.classList.add('menu-open'); ui.hideBanner();
    const prev = store.get('barrel:' + mode, 0), isNew = G.score > prev; if (isNew) store.set('barrel:' + mode, G.score);
    over.hidden = false; over.innerHTML = '';
    const stats = h('div', 'mg-stats');
    [['BANANAS & CO', G.caught], ['LETTERS', G.letters], ['BEST COMBO', G.bestCombo], ['GOLDEN', G.goldens], ['DIAMOND', G.diamonds], ['TIME', Math.round(G.t) + 's']].forEach(([k, v]) => stats.append(h('span', '', k), h('b', '', v)));
    const again = h('a', 'banana-btn', '<span>AGAIN</span>'); again.href = '#'; again.addEventListener('click', e => { e.preventDefault(); start(); });
    const menu = h('a', 'banana-btn banana-btn-green', '<span>MODES</span>'); menu.href = '#'; menu.addEventListener('click', e => { e.preventDefault(); newGame(); title(); });
    over.append(h('p', 'mg-sub', 'THAT\'S A WRAP'), h('h2', 'mg-big', String(G.score)), isNew ? h('p', 'mg-new', 'NEW BEST!') : h('p', 'mg-best', `BEST ${Math.max(prev, G.score)}`), stats, again, menu);
  }
  function pause() {
    if (phase !== 'play') return;
    phase = 'pause'; host.classList.add('menu-open'); over.hidden = false; over.innerHTML = '';
    const r = h('a', 'banana-btn', '<span>RESUME</span>'); r.href = '#'; r.addEventListener('click', e => { e.preventDefault(); resume(); });
    over.append(h('h2', 'mg-big', 'PAUSED'), r);
  }
  function resume() { if (phase === 'pause') { phase = 'play'; over.hidden = true; host.classList.remove('menu-open'); } }
  const doPause = on => on ? pause() : resume();

  /* ---------- input ---------- */
  function point(ev) { if (phase !== 'play') return; usingKeys = false; monkey.tx = clamp(st.toArt(ev)[0], 17, W - 17); }
  addEventListener('pointermove', point);
  addEventListener('pointerdown', ev => { if (ev.target.closest('.mg-over,.mg-nav')) return; point(ev); sfx.unlock(); });
  addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    if (k === 'arrowleft' || k === 'a') { keys.l = true; usingKeys = true; e.preventDefault(); }
    else if (k === 'arrowright' || k === 'd') { keys.r = true; usingKeys = true; e.preventDefault(); }
    else if (k === 'escape' || k === 'p') { phase === 'play' ? doPause(true) : phase === 'pause' && doPause(false); }
    else if ((k === ' ' || k === 'enter') && !e.repeat) {
      if (phase === 'title') start(); else if (phase === 'over') start(); else if (phase === 'pause') doPause(false); e.preventDefault();
    }
  });
  addEventListener('keyup', e => { const k = e.key.toLowerCase(); if (k === 'arrowleft' || k === 'a') keys.l = false; if (k === 'arrowright' || k === 'd') keys.r = false; });
  document.addEventListener('visibilitychange', () => { if (document.hidden) doPause(true); });
  addEventListener('blur', () => doPause(true));
  const mute = document.getElementById('mute');
  const syncMute = () => mute.classList.toggle('off', !sfx.on);
  mute.addEventListener('click', () => { sfx.set(!sfx.on); syncMute(); sfx.unlock(); sfx.tick(); }); syncMute();

  /* pre-warm the monkey frames so the first lean doesn't hitch */
  ['normal', 'scared', 'screech', 'blink'].forEach(e => PXA.monkeySets.mini.angles.forEach(a => [0, 1].forEach(p => PXA.monkeyFrame('mini', e, a * Math.PI / 180, false, p, 0))));

  title();
  if (params.get('autostart')) {
    start(params.get('mode') || 'bananas');
    if (params.get('bot')) botOn = true;
    for (let i = 0, n = (+params.get('warp') || 0) * 60; i < n; i++) update(1 / 60);
  }
  MG.loop(update, draw);
  window.BB = { get G() { return G; }, get monkey() { return monkey; }, spawn, start, get phase() { return phase; } };
})();
