/* CLASSIC EDITION: extra flash. One full-screen canvas for sparks, confetti, rings and glints, plus the small bits of motion the stylesheet cannot do alone.
   It listens to the events ops.js emits on the IMI bus (press, combo, milestone, shock, celebrate) and to the page's own clicks; it never reads game state.

   Effects tiers (Settings > Effects, core.js):
     Max: High plus about 1.7x the particles (cap ~720), a streak behind every spark, sharper canvas, screen shake on the big moments and dust in the lamplight.
     High (and Auto while the frame rate holds): everything. Additive glow, up to ~360 live particles, glints, rings, ambient sparks, title letters that lift toward the pointer.
     Low: the canvas still draws, but with a fifth of the particles, no additive glow, no rings/glints/ambient sparks. One-shot words and the tap squash stay.
     Reduced motion: this file does nothing at all.
   The canvas only runs a frame loop while a particle is alive, and only clears the box the last frame drew in. */
(() => {
  function start() {
  if (window.VaultSaveGate?.blocked) return;
  const { setTimeout, clearTimeout, setInterval, clearInterval, requestAnimationFrame, cancelAnimationFrame } = window.Rewards?.enabled ? Rewards.timers : window;
  const root = document.documentElement, IMI = window.IMI;
  if (root.dataset.style !== 'classic' || !IMI || IMI.reduceMotion) return;
  const fine = matchMedia('(pointer: fine)').matches, TAU = Math.PI * 2;
  const rnd = (a, b) => a + Math.random() * (b - a), pick = a => a[Math.floor(Math.random() * a.length)];
  const LOW = () => IMI.fx.low, MAX = () => IMI.fx.max;
  const $id = id => document.getElementById(id);

  setTimeout(() => { const t = document.getElementById('title'); if (t) t.classList.add('in'); }, 4000);          // after the last letter has landed (see classic-fx.css)

  /* =====================  SPRITES (drawn once, stamped many times)  ===================== */
  const rgbOf = c => {
    if (c[0] === '#') { let h = c.slice(1); if (h.length === 3) h = [...h].map(x => x + x).join(''); const n = parseInt(h, 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
    const m = c.match(/\d+/g); return m ? m.slice(0, 3).map(Number) : [255, 210, 58];
  };
  const cache = {};
  const sprite = (key, size, draw) => cache[key] || (cache[key] = (() => { const k = document.createElement('canvas'); k.width = k.height = size; draw(k.getContext('2d'), size); return k; })());
  const glow = c => sprite('g' + c, 48, (x, s) => {                     // a soft ball: white-hot centre, colour halo
    const [r, g, b] = rgbOf(c), gr = x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.18, `rgba(${r},${g},${b},.95)`); gr.addColorStop(.5, `rgba(${r},${g},${b},.3)`); gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
    x.fillStyle = gr; x.fillRect(0, 0, s, s);
  });
  const soft = c => sprite('f' + c, 48, (x, s) => {                       // a plain soft puff in one colour (dust, smoke, ink)
    const [r, g, b] = rgbOf(c), gr = x.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    gr.addColorStop(0, `rgba(${r},${g},${b},.95)`); gr.addColorStop(.55, `rgba(${r},${g},${b},.55)`); gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
    x.fillStyle = gr; x.fillRect(0, 0, s, s);
  });
  const star = c => sprite('s' + c, 64, (x, s) => {                      // a four-point glint
    const [r, g, b] = rgbOf(c), h = s / 2, halo = x.createRadialGradient(h, h, 0, h, h, h * .55);
    halo.addColorStop(0, `rgba(${r},${g},${b},.55)`); halo.addColorStop(1, `rgba(${r},${g},${b},0)`); x.fillStyle = halo; x.fillRect(0, 0, s, s);
    x.beginPath(); x.moveTo(h, 0); x.quadraticCurveTo(h + 2, h - 2, s, h); x.quadraticCurveTo(h + 2, h + 2, h, s); x.quadraticCurveTo(h - 2, h + 2, 0, h); x.quadraticCurveTo(h - 2, h - 2, h, 0);
    const gr = x.createRadialGradient(h, h, 0, h, h, h); gr.addColorStop(0, '#fff'); gr.addColorStop(.5, '#fff'); gr.addColorStop(1, `rgba(${r},${g},${b},.9)`); x.fillStyle = gr; x.fill();
  });
  const emoji = g => sprite('e' + g, 64, (x) => { x.font = '50px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(g, 32, 35); });

  /* =====================  THE CANVAS  ===================== */
  const cv = document.createElement('canvas'); cv.id = 'cfx'; cv.setAttribute('aria-hidden', 'true'); document.body.appendChild(cv);
  const ctx = cv.getContext('2d');
  let dpr = 1, sized = false;
  const P = []; let raf = 0, last = 0, box = null;
  function size() {
    dpr = Math.min(window.devicePixelRatio || 1, LOW() ? 1 : MAX() ? 2 : 1.5);
    cv.width = Math.round(innerWidth * dpr); cv.height = Math.round(innerHeight * dpr); sized = true; box = null;
  }
  let rs = 0; addEventListener('resize', () => { clearTimeout(rs); rs = setTimeout(() => { sized = false; }, 200); });
  const add = p => {
    if (P.length >= (LOW() ? 70 : MAX() ? 720 : 360)) return;
    p.age = 0; P.push(p);
    if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
  };
  let skip = false;
  function frame(now) {
    raf = 0;
    if (P.length > (MAX() ? 160 : 70) && (skip = !skip)) { raf = requestAnimationFrame(frame); return; }          // busy: draw every other frame, the sim keeps its real dt
    const dt = Math.min(.08, (now - last) / 1000 || .016); last = now;
    if (!sized) size();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (box) ctx.clearRect(box[0], box[1], box[2] - box[0], box[3] - box[1]);
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, add_ = false; ctx.globalAlpha = 1;
    const additive = !LOW(), streak = MAX();
    for (let i = P.length - 1; i >= 0; i--) {
      const p = P[i], k = (p.age += dt) / p.life;
      if (k >= 1) { P[i] = P[P.length - 1]; P.pop(); continue; }
      if (p.drag) { const d = Math.max(0, 1 - p.drag * dt); p.vx *= d; p.vy *= d; }
      p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      let m = p.size + 6;
      if (p.t === 'spark') {
        const a = Math.pow(1 - k, 1.3), s = p.size * (1 - k * .65);
        const lit = additive && !p.solid; if (lit !== add_) { ctx.globalCompositeOperation = lit ? 'lighter' : 'source-over'; add_ = lit; }
        ctx.globalAlpha = a; ctx.drawImage(p.spr, p.x - s / 2, p.y - s / 2, s, s);
        if (streak) { const tx = p.x - p.vx * .03, ty = p.y - p.vy * .03, s2 = s * .7; ctx.globalAlpha = a * .5; ctx.drawImage(p.spr, tx - s2 / 2, ty - s2 / 2, s2, s2); m += Math.abs(p.vx * .03) + Math.abs(p.vy * .03); }
      } else if (p.t === 'conf') {
        ctx.globalCompositeOperation = 'source-over'; add_ = false;
        p.rot += p.vr * dt; ctx.globalAlpha = k > .78 ? (1 - k) / .22 : 1;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.scale(1, Math.cos(p.age * p.flut));
        ctx.fillStyle = p.color; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); m = p.w + 6;
      } else if (p.t === 'ring') {
        const e = 1 - Math.pow(1 - k, 3);
        if (!add_) { ctx.globalCompositeOperation = 'lighter'; add_ = true; }
        ctx.globalAlpha = (1 - k) * .9; ctx.strokeStyle = p.color; ctx.lineWidth = Math.max(1, p.w * (1 - k)); ctx.beginPath(); ctx.arc(p.x, p.y, Math.max(1, p.size * e), 0, TAU); ctx.stroke(); m = p.size + p.w + 4;
      } else if (p.t === 'glint') {
        const s = p.size * Math.sin(k * Math.PI);
        if (!add_) { ctx.globalCompositeOperation = 'lighter'; add_ = true; }
        ctx.globalAlpha = 1; ctx.translate(p.x, p.y); ctx.rotate(p.rot + k * .9); ctx.drawImage(p.spr, -s / 2, -s / 2, s, s); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); m = p.size;
      } else {                                                             // emoji
        ctx.globalCompositeOperation = 'source-over'; add_ = false;
        p.rot += p.vr * dt; ctx.globalAlpha = k > .7 ? (1 - k) / .3 : 1; ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.drawImage(p.spr, -p.size / 2, -p.size / 2, p.size, p.size); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      if (p.x - m < x0) x0 = p.x - m; if (p.y - m < y0) y0 = p.y - m; if (p.x + m > x1) x1 = p.x + m; if (p.y + m > y1) y1 = p.y + m;
    }
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    box = x1 > x0 ? [Math.max(0, Math.floor(x0)), Math.max(0, Math.floor(y0)), Math.min(innerWidth, Math.ceil(x1)), Math.min(innerHeight, Math.ceil(y1))] : null;
    if (P.length) raf = requestAnimationFrame(frame);
  }
  const clearAll = () => { P.length = 0; if (sized) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); } box = null; sized = false; };
  IMI.on('fx', clearAll);                                                     // switching tiers: drop what is in flight, resize for the new tier

  /* =====================  SPAWNERS  ===================== */
  const scale = () => LOW() ? .3 : MAX() ? 1.7 : 1, cnt = n => Math.max(1, Math.round(n * scale()));
  const GOLD = '#ffd23a', CONF = ['#ffd23a', '#ff5d73', '#7be05a', '#5fc8ff', '#b58cf0', '#ff9a3a', '#fff6d6'];
  const WARM = ['#ffd23a', '#ff9a3a', '#fff6d6'], HOT = ['#ff5d73', '#ff9a3a', '#ffd23a'];
  function sparks(x, y, o = {}) {
    const n = cnt(o.n ?? 8), cols = o.colors || [o.color || GOLD];
    for (let i = 0; i < n; i++) {
      const a = o.angle != null ? o.angle + rnd(-.5, .5) * (o.spread ?? 1) : rnd(0, TAU), v = rnd(o.min ?? 90, o.max ?? 280);
      add({ t: 'spark', x: x + rnd(-1, 1) * (o.w || 0), y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: o.g ?? 520, drag: o.drag ?? 1.5, life: rnd(.35, .8) * (o.life || 1), size: rnd(9, 19) * (o.size || 1), spr: (o.solid ? soft : glow)(pick(cols)), solid: !!o.solid });
    }
  }
  function confetti(x, y, n, o = {}) {
    n = cnt(n);
    for (let i = 0; i < n; i++) add({ t: 'conf', x: x + rnd(-1, 1) * (o.w || 0), y, vx: rnd(-1, 1) * (o.vx ?? 280), vy: rnd(o.vy0 ?? -520, o.vy1 ?? -180), g: o.g ?? 520, drag: o.drag ?? 1.3, life: rnd(1.5, 2.5), w: rnd(6, 11), h: rnd(4, 7), rot: rnd(0, TAU), vr: rnd(-10, 10), flut: rnd(7, 13), color: pick(o.colors || CONF), size: 10 });
  }
  const ring = (x, y, color, r = 40, w = 4) => { if (LOW()) return; add({ t: 'ring', x, y, vx: 0, vy: 0, g: 0, life: .55, size: r, w, color, drag: 0 }); };
  const glint = (x, y, color, s = 30) => { if (LOW()) return; add({ t: 'glint', x, y, vx: 0, vy: 0, g: 0, life: rnd(.5, .75), size: s, rot: rnd(0, 1), spr: star(color || '#fff6d6'), drag: 0 }); };
  function emojis(x, y, list, n, o = {}) {
    n = cnt(n);
    for (let i = 0; i < n; i++) add({ t: 'emoji', x: x + rnd(-1, 1) * (o.w || 0), y, vx: rnd(-1, 1) * (o.vx ?? 160), vy: rnd(o.vy0 ?? -420, o.vy1 ?? -160), g: o.g ?? 560, drag: .6, life: rnd(1.4, 2.2), rot: rnd(0, TAU), vr: rnd(-6, 6), size: rnd(20, 32), spr: emoji(pick(list)) });
  }
  const rain = (n, o = {}) => confetti(innerWidth / 2, -14, n, { w: innerWidth / 2, vx: 70, vy0: 40, vy1: 240, g: 260, drag: .9, ...o });
  const centre = el => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2, r]; };
  IMI.cfx = { sparks, confetti, ring, glint, emojis, rain };

  /* =====================  A WORD THAT SLAMS ONTO THE STAGE (combo tiers)  ===================== */
  const TIERS = [[15, 'NICE!', '#7be05a'], [35, 'ON FIRE!', '#ff9a3a'], [75, 'UNSTOPPABLE!', '#ff5d73'], [150, 'LEGENDARY!', '#b58cf0'], [300, 'MONKEY GOD!', '#ffd23a']];
  function word(text, color, at) {
    const el = document.createElement('div'); el.className = 'cfx-word'; el.textContent = text;
    el.style.cssText = `left:${at[0]}px;top:${at[1]}px;--c:${color}`; document.body.appendChild(el);
    el.animate([
      { transform: 'translate(-50%,-50%) scale(.2) rotate(-14deg)', opacity: 0 },
      { transform: 'translate(-50%,-50%) scale(1.35) rotate(3deg)', opacity: 1, offset: .18 },
      { transform: 'translate(-50%,-50%) scale(1) rotate(-3deg)', opacity: 1, offset: .32 },
      { transform: 'translate(-50%,-50%) scale(1.04) rotate(-3deg)', opacity: 1, offset: .75 },
      { transform: 'translate(-50%,-120%) scale(.9) rotate(-3deg)', opacity: 0 }
    ], { duration: 1250, easing: 'cubic-bezier(.3,.7,.3,1)' }).onfinish = () => el.remove();
  }
  const stageBox = () => { const g = IMI.stageGeom && IMI.stageGeom(); if (g) return g.box; const s = $id('oStage'); return s && s.offsetParent ? s.getBoundingClientRect() : null; };   // cached by ops.js: no layout per event
  const punch = (amount = 1) => {                                              // the whole room thumps: a quick zoom on the wall and window
    const s = $id('oStage'); if (!s) return; const sc = s.querySelector('.o-scene'); if (!sc) return;
    sc.animate([{ scale: '1' }, { scale: String(1 + .03 * amount) }, { scale: '1' }], { duration: 260, easing: 'cubic-bezier(.2,.8,.3,1)' });
    if (MAX() && amount >= 1) quake(amount);
  };
  const quake = (amount = 1) => {                                              // Max only: the whole room shakes, decaying
    const w = document.querySelector('.o-stagewrap'); if (!w) return; const a = 3 + amount * 2, f = [];
    for (let i = 0; i < 7; i++) { const d = a * (1 - i / 7); f.push({ translate: `${rnd(-d, d).toFixed(1)}px ${rnd(-d, d).toFixed(1)}px`, rotate: `${rnd(-.4, .4) * (1 - i / 7)}deg` }); }
    f.push({ translate: '0 0', rotate: '0deg' }); w.animate(f, { duration: 380, easing: 'ease-out' });
  };

  /* =====================  GAME EVENTS  ===================== */
  let lastHeat = 0;
  IMI.on('press', e => {
    const k = e.key; if (!k || !k.isConnected) return;
    if (!e.auto) {
      const tw = k.closest('.o-tw'); if (tw) tw.animate([{ scale: '1' }, { scale: '1.014 .978' }, { scale: '1' }], { duration: 140, easing: 'ease-out' });   // the strike squashes the machine, cheaply
    }
    if (LOW() || (e.auto && Math.random() >= .3)) return;                 // most crew presses draw nothing: decide before measuring anything
    const [x, y] = e.x != null ? [e.x, e.y] : centre(k), heat = +($id('oStage')?.dataset.heat || 0), cols = heat >= 3 ? HOT : heat ? WARM : [e.desk, '#fff6d6', e.desk];
    if (e.auto) { sparks(x, y - 6, { n: 2, colors: cols, angle: -Math.PI / 2, spread: 1.6, min: 60, max: 180, size: .7 }); return; }
    sparks(x, y - 6, { n: 4 + heat * 2, colors: cols, angle: -Math.PI / 2, spread: 2.2, min: 120, max: 340, g: 760 });
    if (e.col & 1) ring(x, y, e.desk, 30 + heat * 8, 3);
    if (e.ding) { const car = $id('oCar'); if (car) { const [cx, cy] = centre(car); glint(cx + 30, cy, '#fff6d6', 46); sparks(cx + 40, cy, { n: 6, colors: WARM, angle: 0, spread: 1.4, min: 80, max: 200 }); } punch(.6); }
  });
  IMI.on('combo', ({ n, heat }) => {
    lastHeat = heat;
    const t = TIERS.find(x => x[0] === n), b = stageBox();
    if (t && b) {
      const i = TIERS.indexOf(t);
      word(t[1], t[2], [b.left + b.width / 2, b.top + b.height * .3]);
      confetti(b.left + b.width / 2, b.top + b.height * .45, 22 + i * 12, { w: b.width * .25 });
      sparks(b.left + b.width / 2, b.top + b.height * .35, { n: 14, colors: WARM }); punch(1.4 + i * .3);
    }
    if (n >= 10 && n % 5 === 0) { const c = $id('oCombo'); if (c && stageBox()) { const [x, y] = centre(c); ring(x, y, heat >= 3 ? '#ff5d73' : '#ffd23a', 46, 4); glint(x - 16, y - 10, '#fff6d6', 26); } }
  });
  IMI.on('milestone', ({ n, x, y }) => {
    confetti(x, y, 26 + Math.min(40, n / 3), { w: 60 });
    sparks(x, y, { n: 20, colors: CONF });
    ring(x, y, '#fff6d6', 120, 6); setTimeout(() => ring(x, y, GOLD, 170, 5), 110); if (n >= 100) setTimeout(() => ring(x, y, '#ff5d73', 230, 4), 230);
    if (n >= 50) rain(n >= 100 ? 70 : 36);
    punch(1.6);
  });
  IMI.on('shock', ({ x, y, color, big, tiny }) => {
    if (tiny) return;
    sparks(x, y, { n: big ? 18 : 8, colors: [color, '#fff6d6'], min: 140, max: big ? 420 : 300, g: 380 });
    if (big) glint(x, y, '#fff6d6', 80);
  });
  IMI.on('celebrate', () => {
    let w = 0; const waves = LOW() ? 5 : 16;
    const iv = setInterval(() => { rain(7); emojis(rnd(0, innerWidth), -20, ['🍌', '⭐', '🍃'], 2, { w: 0, vy0: 40, vy1: 200, g: 240, vx: 90 }); if (!LOW() && w % 3 === 0) glint(rnd(.15, .85) * innerWidth, rnd(.15, .6) * innerHeight, pick(CONF), 54); if (++w >= waves) clearInterval(iv); }, 150);
  });

  /* every particle burst the game already asks for also throws canvas sparks of the same flavour */
  const FLAVOUR = { banana: ['#ffd93b', '#fff6a0'], star: ['#ffd23a', '#fff6d6'], spark: ['#fff6d6', '#ffd23a'], leaf: ['#7be05a', '#c8f08a'], leaf2: ['#7be05a', '#c8f08a'], drop: ['#7ec8f0', '#d6f0ff'], coco: ['#d9a066', '#fff6d6'], 'coco-s': ['#d9a066', '#fff6d6'], paw: ['#fff6d6'] };
  const burst0 = IMI.burst;
  IMI.burst = (x, y, names, n = 12) => {
    burst0(x, y, names, n);
    if (n < 6) return;
    sparks(x, y, { n: Math.min(16, n * .7), colors: FLAVOUR[names[0]] || WARM, min: 100, max: 300, g: 420 });
    if (n >= 14) glint(x, y - 6, '#fff6d6', 38);
  };

  /* =====================  LANDINGS: every look throws its own particles when it stomps a key (ops.js LOOKS[].fx)  ===================== */
  const puff = (x, y, c, o) => sparks(x, y, { n: 3, colors: c, min: 20, max: 70, g: -30, drag: 2.2, life: 1.2, size: 1.3, ...o });
  const LAND = {
    dust:     (x, y, c) => { puff(x, y, c, { angle: Math.PI, spread: .6, solid: true }); puff(x, y, c, { angle: 0, spread: .6, solid: true }); },
    sparks:   (x, y, c) => sparks(x, y - 6, { n: 7, colors: c, angle: -Math.PI / 2, spread: 2.6, min: 140, max: 360, g: 760, size: .8 }),
    stars:    (x, y, c) => { glint(x + rnd(-14, 14), y - rnd(14, 40), pick(c), 26); sparks(x, y - 8, { n: 3, colors: c, angle: -Math.PI / 2, spread: 2, min: 80, max: 200, g: 360 }); },
    drops:    (x, y, c) => sparks(x, y - 4, { n: 5, colors: c, angle: -Math.PI / 2, spread: 2.2, min: 110, max: 260, g: 900, size: .8 }),
    bubbles:  (x, y) => emojis(x, y - 20, ['🫧'], 1, { vx: 30, vy0: -120, vy1: -60, g: -60 }),
    steam:    (x, y, c) => puff(x, y - 24, c, { angle: -Math.PI / 2, spread: 1, min: 20, max: 60, g: -80, size: 1.6 }),
    smoke:    (x, y, c) => puff(x, y - 6, c, { n: 5, spread: 6, size: 1.8, solid: true }),
    coins:    (x, y) => emojis(x, y - 16, ['🪙'], 1, { vx: 60, vy0: -320, vy1: -200, g: 900 }),
    confetti: (x, y) => confetti(x, y - 20, 6, { vx: 140, vy0: -320, vy1: -160 }),
    chips:    (x, y, c) => confetti(x, y - 6, 4, { vx: 120, vy0: -260, vy1: -140, colors: c }),
    paper:    (x, y) => emojis(x, y - 20, ['📄'], 1, { vx: 50, vy0: -200, vy1: -120, g: 180 }),
    ink:      (x, y, c) => sparks(x, y - 4, { n: 4, colors: c, angle: -Math.PI / 2, spread: 2.8, min: 70, max: 180, g: 900, size: .9, solid: true }),
    leaves:   (x, y) => emojis(x, y - 16, ['🍃'], 1, { vx: 80, vy0: -240, vy1: -140, g: 300 }),
    notes:    (x, y) => emojis(x + rnd(-10, 10), y - 40, ['🎵', '🎶'], 1, { vx: 20, vy0: -90, vy1: -50, g: -40 })
  };
  let landAt = 0;                                                            // a full crew lands ~20 times a second: draw about 10 of them (20 on Max)
  const RCOL = { r: '#5fc8ff', e: '#c9a0ff', l: '#ffd23a' };
  IMI.on('land', ({ x, y, fx, r }) => {                                     // rarer looks land harder: Epic and Legendary push past the throttle, Legendary throws a double helping
    if (LOW() || !fx) return; const now = performance.now(), big = r === 'e' || r === 'l'; if (now - landAt < (MAX() ? 50 : 100) && !big) return; landAt = now; const f = LAND[fx.k]; if (!f) return;
    f(x, y, fx.c); if (r === 'l') f(x, y, fx.c);
    if (big) { ring(x, y, RCOL[r], r === 'l' ? 44 : 32, 3); glint(x + rnd(-14, 14), y - rnd(20, 44), RCOL[r], r === 'l' ? 40 : 28); sparks(x, y - 6, { n: r === 'l' ? 6 : 3, colors: [RCOL[r], '#fff6d6'], angle: -Math.PI / 2, spread: 2.4, min: 90, max: 240, g: 420 }); } else if (MAX()) ring(x, y, r === 'r' ? RCOL.r : fx.c[0], 22, 2);
  });

  /* =====================  CLICKS: a ripple under every press, a pop from the buttons that matter  ===================== */
  const PRESSABLE = '.o-btn, .o-desk, .o-tab, .o-word, .o-card.can, .banana-btn, .leaf-link, .toy, .back-btn, .o-seg button';
  const REWARDING = '.o-btn.gold, .o-btn[data-act="up"], .o-btn[data-act="buy"], .o-btn[data-act="hire"], .o-btn[data-act="buyn"], .o-btn[data-act="legbuy"], .o-btn[data-act="commission"], .o-btn[data-act="write"], .o-btn[data-act="plant"], .o-btn[data-act="pull"], .o-btn[data-act="release"], .banana-btn';
  addEventListener('pointerdown', e => {
    if (LOW() || e.button) return;
    const b = e.target.closest && e.target.closest(PRESSABLE); if (!b || b.disabled || b.closest('#oStage')) return;
    ring(e.clientX, e.clientY, '#fff6d6', 38, 3);
    if (b.matches(REWARDING)) { const [x, y] = centre(b); sparks(x, y, { n: 8, colors: WARM, min: 90, max: 240, g: 420, w: 20 }); glint(e.clientX, e.clientY, '#fff6d6', 34); }
  }, { passive: true });

  /* =====================  AMBIENT  ===================== */
  let tick = 0;
  setInterval(() => {
    if (document.hidden || LOW()) return; tick++;
    if (root.dataset.screen === 'menu') {                                       // twinkles on the title and the Play button
      if (tick % 4) return;
      const ls = document.querySelectorAll('.letter'), play = $id('playBtn');
      if (Math.random() < .75 && ls.length) { const [x, y, r] = centre(pick([...ls])); glint(x + rnd(-.3, .3) * r.width, y + rnd(-.35, .1) * r.height, '#fff6d6', rnd(20, 36)); }
      else if (play) { const [, , r] = centre(play); glint(r.left + rnd(.1, .9) * r.width, r.top + rnd(.05, .6) * r.height, '#fff6d6', rnd(18, 30)); }
      return;
    }
    const st = $id('oStage'); if (!st || st.closest('.o-pane[hidden]') || root.dataset.screen !== 'game') return;      // no offsetParent: that read forces a layout
    const r = stageBox(), heat = +(st.dataset.heat || 0); if (!r) return;
    if (st.classList.contains('golden')) { const g = IMI.stageGeom && IMI.stageGeom(), kp = g && g.key(pick(g.keys)); if (kp) { const [x, y] = kp; glint(x, y, '#ffe680', rnd(20, 34)); } }
    if (st.classList.contains('frenzy') && tick % 2) sparks(r.left + rnd(.1, .9) * r.width, r.bottom - rnd(.15, .4) * r.height, { n: 2, colors: HOT, angle: -Math.PI / 2, spread: 1, min: 80, max: 220, g: -60, life: 1.1 });
    if (heat >= 2 && tick % 2) sparks(r.left + rnd(.2, .8) * r.width, r.bottom - 40, { n: heat, colors: heat >= 3 ? HOT : WARM, angle: -Math.PI / 2, spread: 1.3, min: 60, max: 200, g: -50, life: 1.3, size: .8 });
    if (MAX() && tick % 3 === 0) add({ t: 'spark', x: r.left + rnd(.05, .95) * r.width, y: r.top + rnd(.2, .9) * r.height, vx: rnd(-10, 10), vy: rnd(-16, -4), g: 0, drag: 0, life: rnd(2.5, 4), size: rnd(5, 9), spr: glow('#fff6d6') });   // dust in the lamplight
  }, 160);

  /* =====================  DEPARTMENTS: cards pop in one after another when a tab opens  ===================== */
  const CARDS = '.o-card, .o-award, .o-plot, .o-shelfrow, .o-day, .o-book, .o-desk, .o-ach';
  IMI.on('tab', ({ tab }) => {
    if (LOW() || tab === 'floor') return;
    const p = $id('o-' + tab); if (!p) return;
    let n = 0;
    for (const el of p.querySelectorAll(CARDS)) {
      if (n >= 12) break; const r = el.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) continue;
      el.animate([{ opacity: 0, transform: 'translateY(26px) scale(.94)' }, { opacity: 1, transform: 'translateY(-3px) scale(1.01)', offset: .7 }, { opacity: 1, transform: 'none' }], { duration: 460, delay: 60 + n * 45, easing: 'cubic-bezier(.3,.8,.3,1)', fill: 'backwards' });
      n++;
    }
  });

  /* =====================  THE TITLE: letters lift toward the pointer  ===================== */
  if (fine) {
    const letters = [...document.querySelectorAll('.letter')]; let centers = [], at = 0, mx = 0, my = 0, pending = 0, lifted = false;
    const measure = () => { centers = letters.map(l => { const r = l.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; }); at = performance.now(); };
    const apply = () => {
      pending = 0; let any = false;
      letters.forEach((l, i) => {
        const c = centers[i], d = Math.hypot(mx - c[0], my - c[1]), v = d < 150 ? Math.round(Math.pow(1 - d / 150, 2) * 30) : 0;
        if (v) any = true; if (+l.dataset.lift !== v) { l.dataset.lift = v; l.style.setProperty('--lift', v); }
      });
      lifted = any;
    };
    addEventListener('pointermove', e => {
      if (LOW() || root.dataset.screen !== 'menu') { if (lifted) { letters.forEach(l => l.style.setProperty('--lift', 0)); lifted = false; } return; }
      if (!centers.length || performance.now() - at > 4000) measure();
      mx = e.clientX; my = e.clientY; if (!pending) pending = requestAnimationFrame(apply);
    }, { passive: true });
  }
  }
  if (window.Rewards?.enabled) Rewards.start(start); else start();
})();
