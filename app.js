/* PIXEL EDITION: art layer. Sprites, particles, the title screen's monkey and the header toy visuals.
   Sound, the banana counter, screens and toy logic live in core.js; this file hands them an `art` object. */
(() => {
  function start() {
  if (window.VaultSaveGate?.blocked) return;
  const { setTimeout, clearTimeout, setInterval, clearInterval, requestAnimationFrame, cancelAnimationFrame } = window.Rewards?.enabled ? Rewards.timers : window;
  const { $, rand, pick, restart, reduceMotion } = Core;
  const root = document.documentElement, fine = matchMedia('(pointer: fine)').matches;

  PXA.install();
  const S = PXA.S;
  let sky = 0;
  addEventListener('resize', () => { clearTimeout(sky); sky = setTimeout(() => PXA.paintSky(), 200); });
  const setSpr = (el, name, k = S) => { const s = PXA.spr[name]; el.style.width = s.w * k + 'px'; el.style.height = s.h * k + 'px'; el.style.backgroundImage = `url(${s.url})`; el.style.backgroundSize = '100% 100%'; };
  const onMenu = () => root.dataset.screen === 'menu';

  /* =====================  TITLE LETTERS (the vines hang from the top of the screen, measured from layout)  ===================== */
  let idx = 0;
  const title = $('#title');
  document.querySelectorAll('.word').forEach(word => {
    for (const ch of word.dataset.text) {
      const s = document.createElement('span');
      s.className = 'letter'; s.textContent = ch; s.setAttribute('aria-hidden', 'true'); s.style.setProperty('--i', idx++);
      s.addEventListener('mouseenter', () => IMI.sfx.tick());
      word.appendChild(s);
    }
  });
  function placeVines() {
    if (!onMenu()) return;
    title.querySelectorAll('.lv').forEach(v => v.remove());
    title.querySelectorAll('.letter').forEach(l => {
      const v = document.createElement('span'); v.className = 'lv'; v.style.setProperty('--i', l.style.getPropertyValue('--i'));
      v.style.left = (l.offsetLeft + l.offsetWidth / 2) + 'px'; v.style.top = -title.offsetTop + 'px';   // .word is not positioned, so offsets are relative to .title
      v.style.height = (title.offsetTop + l.offsetTop + 6) + 'px';
      title.prepend(v);
    });
  }
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => requestAnimationFrame(placeVines));
  let vt = 0; addEventListener('resize', () => { clearTimeout(vt); vt = setTimeout(placeVines, 250); });

  /* =====================  AMBIENT  ===================== */
  if (!reduceMotion) {
    const box = $('#drifters'), names = ['leaf', 'leaf2', 'leaf', 'banana', 'coco-s', 'leaf2'];
    for (let i = 0; i < 14; i++) {
      const e = PXA.el(names[i % names.length], pick([1, 1, 2]));
      if (names[i % names.length] === 'banana') e.classList.add('ambient-banana');
      e.style.left = rand(0, 100) + '%'; e.style.animationDuration = rand(14, 30) + 's'; e.style.animationDelay = -rand(0, 30) + 's';
      box.appendChild(e);
    }
    const motes = $('#heroMotes');
    for (let i = 0; i < 22; i++) {
      const m = document.createElement('i');
      m.style.cssText = `left:${rand(0, 100)}%;top:${rand(20, 95)}%;--d:${rand(9, 19)}s;--dl:${-rand(0, 18)}s;--sz:${Math.random() < .3 ? 2 : 1}`;
      motes.appendChild(m);
    }
  }
  const flies = $('#fireflies');
  for (let i = 0; i < 26; i++) {
    const s = document.createElement('span');
    s.style.left = rand(2, 96) + '%'; s.style.top = rand(15, 95) + '%';
    s.style.setProperty('--d', rand(5, 11) + 's'); s.style.setProperty('--dl', -rand(0, 10) + 's');
    flies.appendChild(s);
  }
  if (!reduceMotion && fine) {                                 // the jungle layers lean toward the pointer
    let px = 0, tx = 0, raf = 0;
    const ease = () => { px += (tx - px) * .08; root.style.setProperty('--px', px.toFixed(3)); raf = Math.abs(tx - px) > .002 ? requestAnimationFrame(ease) : 0; };
    addEventListener('pointermove', e => { tx = e.clientX / innerWidth * 2 - 1; if (!raf) raf = requestAnimationFrame(ease); }, { passive: true });
  }

  /* =====================  PIXEL PARTICLES  ===================== */
  const FX = { leaf: 'leaf', banana: 'banana', spark: 'spark', star: 'star', drop: 'drop', coco: 'coco-s', paw: 'paw' };
  function pfx(name, x, y, mult = 1) {
    const e = PXA.el(FX[name] || name, mult); e.classList.add('pfx'); e.style.left = x + 'px'; e.style.top = y + 'px'; document.body.appendChild(e); return e;
  }
  function burst(x, y, names, n = 12) {
    if (reduceMotion) return;
    for (let i = 0; i < n; i++) {
      const p = pfx(names[i % names.length], x, y, pick([1, 1, 2]));
      const ang = rand(0, Math.PI * 2), dist = rand(60, 150), dx = Math.cos(ang) * dist, dy = Math.sin(ang) * dist - 40;
      p.animate([
        { transform: 'translate(-50%,-50%)', opacity: 1 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`, opacity: 1, offset: .55 },
        { transform: `translate(calc(-50% + ${dx * 1.1}px), calc(-50% + ${dy + 100}px))`, opacity: 0 }
      ], { duration: rand(800, 1200), easing: 'steps(12)' }).onfinish = () => p.remove();
    }
  }
  function fall(x, y, name, life = 1100) {
    if (reduceMotion) return;
    const p = pfx(name, x, y, 1), dx = pick([-1, 1]) * rand(6, 30);
    p.animate([{ transform: 'translate(-50%,-50%)', opacity: .95 }, { transform: `translate(calc(-50% + ${dx}px), calc(-50% + 66px))`, opacity: 0 }], { duration: life, easing: 'steps(8)' }).onfinish = () => p.remove();
  }
  if (!reduceMotion && fine) {                                 // a leaf trail follows the pointer around the menu
    let lx = 0, ly = 0, n = 0; const trail = ['leaf', 'banana', 'leaf2', 'coco-s'];
    addEventListener('pointermove', e => {
      if (!onMenu() || Math.hypot(e.clientX - lx, e.clientY - ly) < 48) return;
      lx = e.clientX; ly = e.clientY; fall(lx, ly, trail[n++ % trail.length], 1000);
    });
    addEventListener('pointerdown', e => { if (onMenu() && !e.target.closest('button, a, .hm-hit')) fall(e.clientX, e.clientY, 'paw', 900); });
  }

  /* =====================  HEADER TOYS (sprite sheets; core.js owns cooldowns and effects)  ===================== */
  const K = 1.25;                                              // header sprites are drawn at 1.25 css px per art pixel, not the page's 3
  function play(el, sheet, from, to, ms, done) {
    const dir = Math.sign(to - from) || 1; let i = from; PXA.frame(el, sheet, i, K);
    if (reduceMotion || from === to) { PXA.frame(el, sheet, to, K); done && done(); return 0; }
    const t = setInterval(() => { i += dir; PXA.frame(el, sheet, i, K); if (i === to) { clearInterval(t); done && done(); } }, ms);
    return t;
  }
  const sheetToy = (sheet, shake) => host => {                 // a sprite that peels or cracks when used and resets when recharged
    const el = document.createElement('span'); el.className = 'spr-sheet'; host.appendChild(el);
    const last = sheet().n - 1; PXA.frame(el, sheet(), 0, K); let at = 0, timer = 0, wait = 0;
    return {
      set(used, animate) {
        const to = used ? last : 0; clearInterval(timer); clearTimeout(wait); el.classList.remove('shaking');
        if (!animate) { at = to; PXA.frame(el, sheet(), to, K); return; }
        const go = () => { const from = at; at = to; timer = play(el, sheet(), from, to, used ? 75 : 55); };
        if (used && shake && !reduceMotion) { el.classList.add('shaking'); wait = setTimeout(() => { el.classList.remove('shaking'); go(); }, 450); } else go();
        if (!used) restart(el, 'hop');
      }
    };
  };
  const toys = {
    snack: sheetToy(() => PXA.banana, false),
    coconut: sheetToy(() => PXA.coconut, true),
    weather: host => {
      const el = document.createElement('span'); el.className = 'spr-sheet'; host.appendChild(el); PXA.frame(el, PXA.weather, 0, K);
      return { paint: n => { PXA.frame(el, PXA.weather, n, K); host.parentNode.dataset.state = n; } };
    },
    night: host => {
      const el = document.createElement('span'); el.className = 'spr'; host.appendChild(el); setSpr(el, 'sun', 1.5);
      return { paint: on => setSpr(el, on ? 'moon' : 'sun', 1.5) };
    },
  };

  /* =====================  THE TITLE SCREEN'S MONKEY  ===================== */
  const hero = $('#heroMonkey'), hCv = $('#heroCv'), bubble = $('#hmBubble'), hit = $('#hmHit');
  const H = { wild: null, busy: false, frame: null, expr: 'normal' };
  /* The title-screen monkey is a real typist: the same 64px CrewArt sprite as the floor, wearing your lead typist's look and hat (a fresh
     game gets the plain overalls monkey). It hangs one-handed from the vine, mirrored so it swings out toward the title rather than off the screen edge. Each swing angle is rotated at twice the sprite's resolution with
     nearest-neighbour sampling and drawn at the menu's pixel scale, so every frame stays on the same pixel grid as the rest of the title screen. */
  const HERO_FALLBACK = 'v07', HAND = [25, 13], UP = 2, HW = 176, HH = 118, PIV = [HW / 2, 6];
  const heroArt = { look: HERO_FALLBACK, hat: 0, cache: new Map() };
  function heroLook() {
    let look = HERO_FALLBACK, hat = 0;
    try { const t = JSON.parse(localStorage.getItem('imi-ops-v1'))?.desks?.[0]?.crew?.[0]; if (t && window.CrewArt?.VARIANTS[t.look]) { look = t.look; hat = +t.hat || 0; } } catch { /* a fresh or unreadable save keeps the default monkey */ }
    if (look !== heroArt.look || hat !== heroArt.hat) { heroArt.look = look; heroArt.hat = hat; heroArt.cache.clear(); H.frame = null; }
  }
  function heroFrame(expr, angle, ph, rain) {
    const step = Math.round(angle * 180 / Math.PI / 3), key = expr + step + ph + (rain ? 'r' : '');
    let f = heroArt.cache.get(key); if (f) return f;
    const src = CrewArt.renderCustomMonkey64(heroArt.look, 'stomp', { x: 32, y: 34, facing: -1, expr: expr === 'normal' ? 'determined' : 'screech',
      armR: [32 - HAND[0], HAND[1] - 34], armL: ph ? [-13, -5] : [-12, 2], legL: ph ? [-7, 17] : [-4, 20], legR: ph ? [5, 20] : [7, 17], hat: rain ? 1 : heroArt.hat });
    const from = src.getContext('2d').getImageData(0, 0, 64, 64).data, cv = document.createElement('canvas'); cv.width = HW; cv.height = HH;
    const g = cv.getContext('2d'), img = g.createImageData(HW, HH), a = step * 3 * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a);
    const px = (HAND[0] + .5) * UP, py = (HAND[1] + .5) * UP;
    for (let y = 0; y < HH; y++) for (let x = 0; x < HW; x++) {
      const dx = x + .5 - PIV[0], dy = y + .5 - PIV[1], sx = Math.floor((px + dx * ca + dy * sa) / UP), sy = Math.floor((py - dx * sa + dy * ca) / UP);
      if (sx < 0 || sy < 0 || sx > 63 || sy > 63) continue;
      const i = (sy * 64 + sx) * 4, o = (y * HW + x) * 4; if (!from[i + 3]) continue;
      img.data[o] = from[i]; img.data[o + 1] = from[i + 1]; img.data[o + 2] = from[i + 2]; img.data[o + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    f = { cv, W: HW, H: HH }; heroArt.cache.set(key, f); return f;
  }
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  hit.addEventListener('click', () => {
    if (H.busy) return; H.busy = true; H.expr = 'screech'; H.wild = { t: performance.now() };
    bubble.textContent = pick(['OOH OOH!', 'AHH AHH!', 'EEEK!', 'BANANA?!']); bubble.classList.add('show');
    IMI.sfx.monkey();
    setTimeout(() => { H.busy = false; H.expr = 'normal'; bubble.classList.remove('show'); }, 1300);
  });
  function updateHero(now) {
    let a = reduceMotion ? 0 : 0.2 * Math.sin(now / 1100);
    if (H.wild) { const dt = now - H.wild.t; a += 0.55 * Math.exp(-dt / 800) * Math.sin(dt / 120); if (dt > 4000) H.wild = null; }
    const shakeA = Mood.shakeAmp(now);
    if (shakeA > 0) a += 0.5 * shakeA * Math.sin(now / 55);
    a = clamp(a, -0.6, 0.6);
    let ex = H.expr;
    if (ex === 'normal') { if (Mood.startle(now) || shakeA > 0) ex = 'screech'; else if (Mood.scared) ex = 'scared'; }
    const f = heroFrame(ex, a, ex === 'screech' || H.wild ? Math.floor(now / 130) % 2 : Math.floor(now / 900) % 2, Mood.hat);
    if (f !== H.frame) { PXA.blit(hCv, f); H.frame = f; }
    hCv.style.transform = ex === 'scared' && !reduceMotion ? `translateX(${Math.floor(now / 70) % 2 ? S : 0}px)` : '';
  }
  function frame(now) {
    Mood.update(now);                                            // wetness drives the CSS dimming everywhere
    if (onMenu() && hero.offsetParent !== null) updateHero(now);
    requestAnimationFrame(frame);
  }

  let sayT = 0;
  function heroSay(text, ms = 1600) {
    if (!onMenu() || hero.offsetParent === null || H.busy) return;
    bubble.textContent = text; bubble.classList.add('show'); clearTimeout(sayT); sayT = setTimeout(() => bubble.classList.remove('show'), ms);
  }
  const heroBox = () => hCv.getBoundingClientRect();
  Mood.on('weather', n => heroSay(['SUNNY!', 'DRIZZLE...', 'IT\'S RAINING!', 'STORM!! EEK!'][n]));
  Mood.on('startle', () => { IMI.sfx.monkey(); if (onMenu() && !H.busy) { H.wild = { t: performance.now() }; heroSay('EEEK!', 1100); } });
  Mood.on('shake', () => {
    IMI.sfx.shake(); heroSay('SHAKE IT OFF!', 1500);
    if (onMenu()) { H.wild = { t: performance.now() }; const hr = heroBox(); burst(hr.left + hr.width / 2, hr.top + 150, ['drop', 'drop', 'coco'], 14); }
  });
  Mood.on('drip', () => { if (onMenu() && hero.offsetParent !== null && Math.random() < .6) { const hr = heroBox(); fall(hr.left + hr.width / 2 + rand(-36, 36), hr.top + 260, 'drop', 900); } });

  /* =====================  BOOT  ===================== */
  const IMI = Core.boot({
    edition: 'pixel', S, burst, fall, heroSay, toys,
    bananaEl: mult => PXA.el('banana', mult),
    bannerText: t => '>> ' + t + ' <<',
    paintSound: (btn, on) => setSpr(btn.firstChild, on ? 'drum-on' : 'drum-off', 2),
  });
  heroLook();
  IMI.onScreen(name => { if (name === 'menu') { heroLook(); requestAnimationFrame(placeVines); } });
  requestAnimationFrame(frame);
  }
  if (window.Rewards?.enabled) Rewards.start(start); else start();
})();
