/* PIXEL EDITION: extra flash. The pixel twin of classic-fx.js: one low-resolution canvas (one canvas pixel = one art pixel, scaled up with
   image-rendering: pixelated) for sparks, sprite debris, rings, glints and confetti, plus combo words, hit-stop and shake.
   It listens to the events ops.js emits on the IMI bus (press, combo, milestone, shock, celebrate, tab) and to the page's own clicks; it never reads game state.

   Effects tiers (Settings > Effects, core.js):
     Max: everything below, about twice the particles, a trail behind every spark, stronger shake and dust drifting through the room.
     High (and Auto while the frame rate holds): sparks, rings, glints, combo words, ambient embers and glints.
     Low: a few sparks per event, no rings/glints/ambient. Combo words and the key flash stay.
     Reduced motion: this file does nothing at all.
   The canvas only runs a frame loop while a particle is alive, and redraws at most 24 times a second: stepped motion is the pixel look, and it is cheap. */
(() => {
  const root = document.documentElement, IMI = window.IMI;
  if (root.dataset.style !== 'pixel' || !IMI || IMI.reduceMotion || !window.PXA) return;
  const S = 3, TAU = Math.PI * 2, fine = matchMedia('(pointer: fine)').matches;
  const rnd = (a, b) => a + Math.random() * (b - a), pick = a => a[Math.floor(Math.random() * a.length)];
  const LOW = () => IMI.fx.low, MAX = () => IMI.fx.max;
  const $id = id => document.getElementById(id);

  /* =====================  THE CANVAS  ===================== */
  const cv = document.createElement('canvas'); cv.id = 'pfxc'; cv.setAttribute('aria-hidden', 'true'); document.body.appendChild(cv);
  const ctx = cv.getContext('2d');
  let W = 0, H = 0, sized = false;
  function size() { W = Math.ceil(innerWidth / S); H = Math.ceil(innerHeight / S); cv.width = W; cv.height = H; ctx.imageSmoothingEnabled = false; sized = true; }
  let rs = 0; addEventListener('resize', () => { clearTimeout(rs); rs = setTimeout(() => { sized = false; }, 200); });
  const P = []; let raf = 0, last = 0, drawn = 0, dirty = false;
  const cap = () => LOW() ? 60 : MAX() ? 640 : 320;
  const add = p => {
    if (P.length >= cap()) return;
    p.age = 0; p.lx = p.x; p.ly = p.y; P.push(p);
    if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
  };
  const px = (x, y, w = 1, h = 1) => ctx.fillRect(Math.round(x), Math.round(y), w, h);
  function frame(now) {
    raf = 0;
    const dt = Math.min(.08, (now - last) / 1000 || .016); last = now;
    for (let i = P.length - 1; i >= 0; i--) {                         // the simulation runs every frame...
      const p = P[i]; p.age += dt;
      if (p.age >= p.life) { P[i] = P[P.length - 1]; P.pop(); continue; }
      if (p.drag) { const d = Math.max(0, 1 - p.drag * dt); p.vx *= d; p.vy *= d; }
      p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
    }
    if (now - drawn >= 1000 / 24 || !P.length) { drawn = now; draw(); }  // ...but the picture only moves 24 times a second
    if (P.length || dirty) raf = requestAnimationFrame(frame);
  }
  function draw() {
    if (!sized) size();
    ctx.clearRect(0, 0, W, H); dirty = P.length > 0;
    const trail = MAX();
    for (const p of P) {
      const k = p.age / p.life;
      if (p.t === 'px') {
        if (trail && k < .7) { ctx.globalAlpha = .45; ctx.fillStyle = p.c2 || p.color; px(p.lx, p.ly, p.s, p.s); }
        ctx.globalAlpha = 1; ctx.fillStyle = k > .6 && p.c2 ? p.c2 : p.color;
        if (k < .85 || (Math.round(p.x + p.y) & 1)) px(p.x, p.y, p.s, p.s);          // dithered fade-out instead of alpha
      } else if (p.t === 'conf') {
        ctx.globalAlpha = 1; ctx.fillStyle = p.color;
        const flip = Math.sin(p.age * p.flut) > 0; px(p.x, p.y, flip ? 2 : 1, flip ? 1 : 2);
      } else if (p.t === 'spr') {
        ctx.globalAlpha = 1;
        if (k < .8 || (Math.floor(p.age * 24) & 1)) ctx.drawImage(p.spr, Math.round(p.x - p.spr.width / 2), Math.round(p.y - p.spr.height / 2));   // blinks out
      } else if (p.t === 'ring') {
        const r = Math.max(1, Math.round(p.r * (1 - Math.pow(1 - k, 3)))), n = Math.max(8, Math.round(TAU * r)), thin = k > .5;
        ctx.globalAlpha = 1; ctx.fillStyle = k > .7 ? p.c2 : p.color;
        for (let j = 0; j < n; j++) { if (thin && (j & 1)) continue; const a = j / n * TAU; px(p.x + Math.cos(a) * r, p.y + Math.sin(a) * r, 1, 1); }
      } else if (p.t === 'plus') {                                         // a cross-shaped glint that grows then shrinks
        const s = Math.round(p.s * Math.sin(k * Math.PI)); ctx.globalAlpha = 1;
        ctx.fillStyle = p.color; px(p.x - s, p.y, s * 2 + 1, 1); px(p.x, p.y - s, 1, s * 2 + 1);
        ctx.fillStyle = '#ffffff'; px(p.x, p.y, 1, 1);
      }
      p.lx = p.x; p.ly = p.y;
    }
    ctx.globalAlpha = 1;
  }
  const clearAll = () => { P.length = 0; sized = false; if (W) ctx.clearRect(0, 0, W, H); };
  IMI.on('fx', clearAll);

  /* =====================  SPAWNERS (all in page px; the canvas works in art pixels)  ===================== */
  const scale = () => LOW() ? .3 : MAX() ? 1.8 : 1, cnt = n => Math.max(1, Math.round(n * scale()));
  const GOLD = '#ffd23a', CREAM = '#fff6d6', CONF = ['#ffd23a', '#ff5d73', '#7be05a', '#5fc8ff', '#b58cf0', '#ff9a3a', '#fff6d6'];
  const WARM = ['#ffd23a', '#ff9a3a', '#fff6d6'], HOT = ['#ff5d73', '#ff9a3a', '#ffd23a'];
  function sparks(x, y, o = {}) {
    const n = cnt(o.n ?? 8), cols = o.colors || [o.color || GOLD];
    for (let i = 0; i < n; i++) {
      const a = o.angle != null ? o.angle + rnd(-.5, .5) * (o.spread ?? 1) : rnd(0, TAU), v = rnd(o.min ?? 30, o.max ?? 95);
      add({ t: 'px', x: x / S + rnd(-1, 1) * (o.w || 0) / S, y: y / S, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: o.g ?? 170, drag: o.drag ?? 1.4, life: rnd(.35, .8) * (o.life || 1), s: Math.random() < (o.big ?? .25) ? 2 : 1, color: pick(cols), c2: o.c2 || '#ff9a3a' });
    }
  }
  function confetti(x, y, n, o = {}) {
    n = cnt(n);
    for (let i = 0; i < n; i++) add({ t: 'conf', x: x / S + rnd(-1, 1) * (o.w || 0) / S, y: y / S, vx: rnd(-1, 1) * (o.vx ?? 95), vy: rnd(o.vy0 ?? -175, o.vy1 ?? -60), g: o.g ?? 170, drag: o.drag ?? 1.2, life: rnd(1.5, 2.5), flut: rnd(7, 13), color: pick(CONF) });
  }
  function debris(x, y, names, n, o = {}) {                             // the game's own sprites, tumbling (no rotation: pixel art does not rotate)
    n = cnt(n);
    for (let i = 0; i < n; i++) { const s = PXA.spr[pick(names)]; if (!s) continue; add({ t: 'spr', x: x / S, y: y / S, vx: rnd(-1, 1) * (o.vx ?? 60), vy: rnd(o.vy0 ?? -150, o.vy1 ?? -60), g: o.g ?? 190, drag: .5, life: rnd(1.2, 2), spr: s.cv }); }
  }
  const ring = (x, y, color, r = 14, c2 = CREAM) => { if (LOW()) return; add({ t: 'ring', x: x / S, y: y / S, vx: 0, vy: 0, g: 0, life: .5, r: r * (MAX() ? 1.25 : 1), color, c2 }); };
  const glint = (x, y, color = CREAM, s = 4) => { if (LOW()) return; add({ t: 'plus', x: x / S, y: y / S, vx: 0, vy: 0, g: 0, life: rnd(.4, .6), s, color }); };
  const rain = n => confetti(innerWidth / 2, -10, n, { w: innerWidth / 2, vx: 25, vy0: 15, vy1: 80, g: 90, drag: .9 });
  const centre = el => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2, r]; };
  IMI.pfx = { sparks, confetti, debris, ring, glint, rain };

  /* =====================  WORDS, HIT-STOP, SHAKE  ===================== */
  const TIERS = [[15, 'NICE!', '#7be05a'], [35, 'ON FIRE!', '#ff9a3a'], [75, 'UNSTOPPABLE!', '#ff5d73'], [150, 'LEGENDARY!', '#b58cf0'], [300, 'MONKEY GOD!', '#ffd23a']];
  function word(text, color, at) {
    const el = document.createElement('div'); el.className = 'pfx-word'; el.textContent = text;
    el.style.cssText = `left:${at[0]}px;top:${at[1]}px;--c:${color}`; document.body.appendChild(el);
    el.animate([
      { transform: 'translate(-50%,-50%) scale(3)', opacity: 0 },
      { transform: 'translate(-50%,-50%) scale(1)', opacity: 1, offset: .12 },
      { transform: 'translate(-50%,-50%) scale(1.15)', opacity: 1, offset: .2 },
      { transform: 'translate(-50%,-50%) scale(1)', opacity: 1, offset: .28 },
      { transform: 'translate(-50%,-50%) scale(1)', opacity: 1, offset: .8 },
      { transform: 'translate(-50%,-90%) scale(1)', opacity: 0 }
    ], { duration: 1300, easing: 'steps(16)' }).onfinish = () => el.remove();
  }
  const stageBox = () => { const g = IMI.stageGeom && IMI.stageGeom(); if (g) return g.box; const s = $id('oStage'); return s && s.offsetParent ? s.getBoundingClientRect() : null; };   // cached by ops.js: no layout per event
  function hitstop(ms = 90) {                                                    // the room freezes for a beat on the big moments
    const s = $id('oStage'); if (!s || LOW()) return;
    s.classList.add('pfx-stop'); clearTimeout(hitstop.t); hitstop.t = setTimeout(() => s.classList.remove('pfx-stop'), ms);
  }
  function quake(amount = 1) {                                                   // shake in whole art pixels
    if (LOW()) return; const w = document.querySelector('.o-stagewrap'); if (!w) return;
    const a = S * Math.max(1, Math.round(amount * (MAX() ? 2 : 1))), f = [];
    for (let i = 0; i < 6; i++) f.push({ transform: `translate(${pick([-a, 0, a])}px, ${pick([-a, 0, a])}px)` });
    f.push({ transform: 'none' });
    w.animate(f, { duration: 260, easing: 'steps(7)' });
  }

  /* =====================  GAME EVENTS  ===================== */
  IMI.on('press', e => {
    const k = e.key; if (!k || !k.isConnected) return;
    if (!e.auto) k.animate([{ background: '#ffffff', color: '#ffffff' }, { background: '', color: '' }], { duration: 80, easing: 'steps(1, end)' });   // one white impact frame
    if (e.auto && (LOW() || Math.random() >= (MAX() ? .4 : .2))) return;      // most crew presses draw nothing: decide before measuring anything
    const [x, y] = e.x != null ? [e.x, e.y] : centre(k), heat = +($id('oStage')?.dataset.heat || 0), cols = heat >= 3 ? HOT : heat ? WARM : [e.desk, CREAM, e.desk];
    if (e.auto) { sparks(x, y - 6, { n: 2, colors: cols, angle: -Math.PI / 2, spread: 1.6, min: 20, max: 60 }); return; }
    sparks(x, y - 6, { n: 3 + heat * 2, colors: cols, angle: -Math.PI / 2, spread: 2.2, min: 40, max: 115, g: 250 });
    if (e.col & 1) ring(x, y, e.desk, 8 + heat * 3);
    if (e.ding) { const car = $id('oCar'); if (car) { const [cx, cy] = centre(car); glint(cx + 30, cy, CREAM, 6); sparks(cx + 40, cy, { n: 6, colors: WARM, angle: 0, spread: 1.4, min: 30, max: 70 }); } }
  });
  IMI.on('combo', ({ n, heat }) => {
    const t = TIERS.find(x => x[0] === n), b = stageBox();
    if (t && b) {
      const i = TIERS.indexOf(t);
      word(t[1], t[2], [b.left + b.width / 2, b.top + b.height * .3]);
      confetti(b.left + b.width / 2, b.top + b.height * .45, 20 + i * 12, { w: b.width * .25 });
      sparks(b.left + b.width / 2, b.top + b.height * .35, { n: 14, colors: WARM });
      quake(1 + i * .5); if (i >= 2) hitstop(70);
    }
    if (n >= 10 && n % 5 === 0) { const c = $id('oCombo'); if (c && stageBox()) { const [x, y] = centre(c); ring(x, y, heat >= 3 ? '#ff5d73' : GOLD, 16); glint(x - 16, y - 10, CREAM, 5); } }
  });
  IMI.on('milestone', ({ n, x, y }) => {
    confetti(x, y, 24 + Math.min(40, n / 3), { w: 60 });
    debris(x, y, ['banana', 'star', 'leaf'], 4 + Math.min(8, n / 25));
    sparks(x, y, { n: 18, colors: CONF });
    ring(x, y, CREAM, 40); setTimeout(() => ring(x, y, GOLD, 58), 110); if (n >= 100) setTimeout(() => ring(x, y, '#ff5d73', 78), 230);
    if (n >= 50) rain(n >= 100 ? 70 : 36);
    hitstop(n >= 100 ? 140 : 90); quake(n >= 100 ? 2 : 1);
  });
  IMI.on('shock', ({ x, y, color, big, tiny }) => {
    if (tiny) return;
    sparks(x, y, { n: big ? 16 : 7, colors: [color, CREAM], min: 45, max: big ? 140 : 100, g: 130 });
    if (big) glint(x, y, CREAM, 9);
  });
  IMI.on('celebrate', () => {
    let w = 0; const waves = LOW() ? 5 : 16;
    const iv = setInterval(() => {
      rain(7); debris(rnd(0, innerWidth), -20, ['banana', 'star', 'leaf'], 1, { vy0: 10, vy1: 60, g: 80, vx: 30 });
      if (w % 3 === 0) glint(rnd(.15, .85) * innerWidth, rnd(.15, .6) * innerHeight, pick(CONF), 8);
      if (++w >= waves) clearInterval(iv);
    }, 150);
  });

  /* =====================  LANDINGS: every look throws its own particles when it stomps a key (ops.js LOOKS[].fx)  ===================== */
  const LAND = {
    dust:     (x, y, c) => { sparks(x, y, { n: 2, colors: c, angle: Math.PI, spread: .5, min: 15, max: 40, g: -8, drag: 2.5, life: .9, big: .5 }); sparks(x, y, { n: 2, colors: c, angle: 0, spread: .5, min: 15, max: 40, g: -8, drag: 2.5, life: .9, big: .5 }); },
    sparks:   (x, y, c) => sparks(x, y - 4, { n: 5, colors: c, angle: -Math.PI / 2, spread: 2.6, min: 50, max: 130, g: 260, c2: c[0] }),
    stars:    (x, y, c) => { glint(x + rnd(-10, 10), y - rnd(8, 20), pick(c), 4); sparks(x, y - 6, { n: 3, colors: c, angle: -Math.PI / 2, spread: 2, min: 30, max: 70, g: 120 }); },
    drops:    (x, y, c) => sparks(x, y - 2, { n: 5, colors: c, angle: -Math.PI / 2, spread: 2.2, min: 40, max: 90, g: 320, c2: c[1] }),
    bubbles:  (x, y, c) => sparks(x, y - 8, { n: 3, colors: c, angle: -Math.PI / 2, spread: .8, min: 10, max: 30, g: -40, drag: .5, life: 1.3, big: .6, c2: c[1] }),
    steam:    (x, y, c) => sparks(x, y - 10, { n: 4, colors: c, angle: -Math.PI / 2, spread: 1, min: 10, max: 28, g: -30, drag: 1, life: 1.2, big: .7, c2: c[1] }),
    smoke:    (x, y, c) => sparks(x, y - 4, { n: 4, colors: c, angle: -Math.PI / 2, spread: 3, min: 12, max: 40, g: -20, drag: 2, life: 1, big: .8, c2: c[1] }),
    coins:    (x, y, c) => sparks(x, y - 6, { n: 3, colors: c, angle: -Math.PI / 2, spread: 1.4, min: 50, max: 90, g: 260, big: 1, c2: c[1] }),
    confetti: (x, y) => confetti(x, y - 10, 5, { vx: 50, vy0: -110, vy1: -50 }),
    chips:    (x, y, c) => sparks(x, y - 2, { n: 4, colors: c, angle: -Math.PI / 2, spread: 2.4, min: 35, max: 75, g: 280, big: .6, c2: c[2] || c[0] }),
    paper:    (x, y, c) => sparks(x, y - 6, { n: 3, colors: c, angle: -Math.PI / 2, spread: 2, min: 25, max: 50, g: 60, drag: 1.8, life: 1.2, big: 1, c2: c[1] }),
    ink:      (x, y, c) => sparks(x, y - 2, { n: 4, colors: c, angle: -Math.PI / 2, spread: 2.8, min: 25, max: 60, g: 300, big: .7, c2: c[1] }),
    leaves:   (x, y, c) => { debris(x, y - 8, ['leaf'], 1, { vx: 40, vy0: -80, vy1: -40, g: 120 }); sparks(x, y, { n: 2, colors: c, angle: -Math.PI / 2, spread: 2, min: 20, max: 50, g: 120 }); },
    notes:    (x, y, c) => sparks(x + rnd(-6, 6), y - 14, { n: 2, colors: c, angle: -Math.PI / 2, spread: .6, min: 15, max: 35, g: -25, drag: .4, life: 1.3, big: 1, c2: c[1] })
  };
  let landAt = 0;                                                            // a full crew lands ~20 times a second: draw about 10 of them (20 on Max)
  const RCOL = { r: '#5fc8ff', e: '#c9a0ff', l: '#ffd23a' };
  IMI.on('land', ({ x, y, fx, r }) => {                                     // rarer looks land harder: Epic and Legendary push past the throttle, Legendary throws a double helping
    if (LOW() || !fx) return; const now = performance.now(), big = r === 'e' || r === 'l'; if (now - landAt < (MAX() ? 50 : 100) && !big) return; landAt = now; const f = LAND[fx.k]; if (!f) return;
    f(x, y, fx.c); if (r === 'l') f(x, y, fx.c);
    if (big) { ring(x, y, RCOL[r], r === 'l' ? 12 : 9, '#fff6d6'); glint(x + rnd(-8, 8), y - rnd(10, 24), RCOL[r], r === 'l' ? 6 : 4); } else if (MAX()) ring(x, y, r === 'r' ? RCOL.r : fx.c[0], 6);
  });

  /* =====================  CLICKS: a pixel ring under every press, a pop from the buttons that matter  ===================== */
  const PRESSABLE = '.o-btn, .o-desk, .o-tab, .o-word, .o-card.can, .banana-btn, .leaf-link, .toy, .back-btn, .o-seg button';
  const REWARDING = '.o-btn.gold, .o-btn[data-act="up"], .o-btn[data-act="buy"], .o-btn[data-act="hire"], .o-btn[data-act="buyn"], .o-btn[data-act="legbuy"], .o-btn[data-act="commission"], .o-btn[data-act="write"], .o-btn[data-act="plant"], .o-btn[data-act="pull"], .o-btn[data-act="release"], .banana-btn';
  addEventListener('pointerdown', e => {
    if (LOW() || e.button) return;
    const b = e.target.closest && e.target.closest(PRESSABLE); if (!b || b.disabled || b.closest('#oStage')) return;
    ring(e.clientX, e.clientY, CREAM, 10);
    if (b.matches(REWARDING)) { const [x, y] = centre(b); sparks(x, y, { n: 8, colors: WARM, min: 30, max: 80, g: 140, w: 20 }); glint(e.clientX, e.clientY, CREAM, 5); }
  }, { passive: true });

  /* =====================  AMBIENT  ===================== */
  let tick = 0;
  setInterval(() => {
    if (document.hidden || LOW()) return; tick++;
    if (root.dataset.screen === 'menu') {                                       // twinkles on the title letters
      if (tick % 4) return;
      const ls = document.querySelectorAll('.letter'); if (!ls.length) return;
      const [x, y, r] = centre(pick([...ls])); glint(x + rnd(-.3, .3) * r.width, y + rnd(-.35, .1) * r.height, CREAM, pick([3, 4, 5]));
      return;
    }
    const st = $id('oStage'); if (!st || st.closest('.o-pane[hidden]') || root.dataset.screen !== 'game') return;      // no offsetParent: that read forces a layout
    const r = stageBox(), heat = +(st.dataset.heat || 0); if (!r) return;
    if (st.classList.contains('golden')) { const g = IMI.stageGeom && IMI.stageGeom(), kp = g && g.key(pick(g.keys)); if (kp) { const [x, y] = kp; glint(x, y, '#ffe680', 4); } }
    if (st.classList.contains('frenzy') && tick % 2) sparks(r.left + rnd(.1, .9) * r.width, r.bottom - rnd(.15, .4) * r.height, { n: 2, colors: HOT, angle: -Math.PI / 2, spread: 1, min: 25, max: 70, g: -20, life: 1.1 });
    if (heat >= 2 && tick % 2) sparks(r.left + rnd(.2, .8) * r.width, r.bottom - 40, { n: heat, colors: heat >= 3 ? HOT : WARM, angle: -Math.PI / 2, spread: 1.3, min: 20, max: 65, g: -16, life: 1.3, big: 0 });
    if (MAX() && tick % 3 === 0) add({ t: 'px', x: (r.left + rnd(.05, .95) * r.width) / S, y: (r.top + rnd(.2, .9) * r.height) / S, vx: rnd(-4, 4), vy: rnd(-6, -2), g: 0, drag: 0, life: rnd(2.5, 4), s: 1, color: 'rgba(255,246,214,.55)', c2: 'rgba(255,246,214,.3)' });   // dust in the lamplight
  }, 160);

  /* =====================  DEPARTMENTS: cards drop in one after another when a tab opens  ===================== */
  const CARDS = '.o-card, .o-award, .o-plot, .o-shelfrow, .o-day, .o-book, .o-desk, .o-ach';
  IMI.on('tab', ({ tab }) => {
    if (LOW() || tab === 'floor') return;
    const p = $id('o-' + tab); if (!p) return;
    let n = 0;
    for (const el of p.querySelectorAll(CARDS)) {
      if (n >= 12) break; const r = el.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) continue;
      el.animate([{ opacity: 0, transform: 'translateY(18px)' }, { opacity: 1, transform: 'translateY(-3px)', offset: .7 }, { opacity: 1, transform: 'none' }], { duration: 360, delay: 40 + n * 40, easing: 'steps(6)', fill: 'backwards' });
      n++;
    }
  });
})();
