/* CLASSIC EDITION: art layer. Emoji particles, SVG toys and the title screen's monkey.
   Sound, the banana counter, screens and toy logic live in core.js; this file hands them an `art` object. */
(() => {
  function start() {
  if (window.VaultSaveGate?.blocked) return;
  const { setTimeout, clearTimeout, setInterval, clearInterval, requestAnimationFrame, cancelAnimationFrame } = window.Rewards?.enabled ? Rewards.timers : window;
  const { $, rand, pick, centerOf, reduceMotion } = Core;
  const root = document.documentElement, fine = matchMedia('(pointer: fine)').matches;
  const onMenu = () => root.dataset.screen === 'menu';

  /* =====================  TITLE LETTERS  ===================== */
  let idx = 0;
  document.querySelectorAll('.word').forEach(word => {
    for (const ch of word.dataset.text) {
      const s = document.createElement('span');
      s.className = 'letter'; s.textContent = ch; s.setAttribute('aria-hidden', 'true'); s.style.setProperty('--i', idx++);
      s.addEventListener('mouseenter', () => IMI.sfx.tick());
      word.appendChild(s);
    }
  });

  /* =====================  AMBIENT  ===================== */
  if (!reduceMotion) {
    const icons = ['🍃', '🍌', '🌿', '🥥', '🍃'], box = $('#drifters');
    for (let i = 0; i < 14; i++) {
      const s = document.createElement('span');
      s.textContent = icons[i % icons.length]; s.style.left = rand(0, 100) + '%'; s.style.fontSize = rand(18, 40) + 'px';
      if (icons[i % icons.length] === '🍌') s.classList.add('ambient-banana');
      s.style.animationDuration = rand(14, 30) + 's'; s.style.animationDelay = -rand(0, 30) + 's'; box.appendChild(s);
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
    s.style.setProperty('--d', rand(5, 11) + 's'); s.style.setProperty('--dl', -rand(0, 10) + 's'); flies.appendChild(s);
  }
  if (!reduceMotion && fine) {                                 // the jungle layers lean toward the pointer
    let px = 0, tx = 0, raf = 0;
    const ease = () => { px += (tx - px) * .08; root.style.setProperty('--px', px.toFixed(3)); raf = Math.abs(tx - px) > .002 ? requestAnimationFrame(ease) : 0; };
    addEventListener('pointermove', e => { tx = e.clientX / innerWidth * 2 - 1; if (!raf) raf = requestAnimationFrame(ease); }, { passive: true });
  }

  /* =====================  PARTICLES  ===================== */
  const GLYPH = { leaf: '🍃', banana: '🍌', spark: '✨', star: '⭐', drop: '💧', coco: '🥥', paw: '🐾', leaf2: '🌿', 'coco-s': '🥥' };
  const glyph = k => GLYPH[k] || k;
  /* Emoji text is slow to lay out (every particle needs emoji font fallback and shaping, and bursts make dozens a second), so each glyph is drawn to a bitmap once
     and particles are plain image boxes, the same cost as the pixel edition's sprites. */
  const bitmaps = {};
  function glyphUrl(g) {
    if (bitmaps[g]) return bitmaps[g];
    const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d');
    x.font = '52px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(g, 32, 36);
    return (bitmaps[g] = `url(${c.toDataURL()})`);
  }
  function sprite(g, size) {
    const p = document.createElement('i');
    Object.assign(p.style, { display: 'inline-block', width: size + 'px', height: size + 'px', backgroundImage: glyphUrl(g), backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' });
    return p;
  }
  function burst(x, y, names, n = 12) {
    if (reduceMotion) return;
    for (let i = 0; i < n; i++) {
      const p = sprite(glyph(names[i % names.length]), rand(16, 30));
      Object.assign(p.style, { position: 'fixed', left: x + 'px', top: y + 'px', pointerEvents: 'none', zIndex: 100 });
      document.body.appendChild(p);
      const ang = rand(0, Math.PI * 2), dist = rand(60, 150), dx = Math.cos(ang) * dist, dy = Math.sin(ang) * dist - 40;
      p.animate([
        { transform: 'translate(-50%,-50%) scale(.3) rotate(0)', opacity: 1 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(1) rotate(${rand(0, 360)}deg)`, opacity: 1, offset: .6 },
        { transform: `translate(calc(-50% + ${dx * 1.1}px), calc(-50% + ${dy + 90}px)) scale(.8) rotate(540deg)`, opacity: 0 }
      ], { duration: rand(900, 1300), easing: 'cubic-bezier(.2,.7,.4,1)' }).onfinish = () => p.remove();
    }
  }
  function fall(x, y, name, life = 1200, size = 20) {
    if (reduceMotion) return;
    const p = sprite(glyph(name), size);
    Object.assign(p.style, { position: 'fixed', left: x + 'px', top: y + 'px', pointerEvents: 'none', zIndex: 90 });
    document.body.appendChild(p);
    const dx = rand(-30, 30);
    p.animate([{ transform: 'translate(-50%,-50%) rotate(0) scale(1)', opacity: .9 }, { transform: `translate(calc(-50% + ${dx}px), calc(-50% + 70px)) rotate(${rand(-200, 200)}deg) scale(.6)`, opacity: 0 }], { duration: life, easing: 'ease-in' }).onfinish = () => p.remove();
  }
  if (!reduceMotion && fine) {                                 // a leaf trail follows the pointer around the menu
    let lx = 0, ly = 0, n = 0; const trail = ['leaf', 'banana', 'leaf2', 'coco'];
    addEventListener('pointermove', e => {
      if (!onMenu() || Math.hypot(e.clientX - lx, e.clientY - ly) < 46) return;
      lx = e.clientX; ly = e.clientY; fall(lx, ly, trail[n++ % trail.length], 1100, rand(12, 20));
    });
    addEventListener('pointerdown', e => { if (onMenu() && !e.target.closest('button, a, .hero-monkey')) fall(e.clientX, e.clientY, 'paw', 900, 26); });
  }

  /* =====================  HEADER TOYS (SVG; core.js owns cooldowns and effects)  ===================== */
  const BANANA = `<svg viewBox="0 0 120 120" class="banana-svg" aria-hidden="true"><defs>
      <clipPath id="bTop"><path d="M52 6 C45 8 43 16 44 28 C45 50 38 74 50 94 L74 94 C82 74 80 46 75 26 C73 14 69 6 62 6 Z"/></clipPath>
      <clipPath id="bAll"><path d="M52 6 C45 8 43 16 44 28 C45 50 38 74 50 94 C55 102 68 102 74 94 C82 74 80 46 75 26 C73 14 69 6 62 6 Z"/></clipPath></defs>
    <g class="banana-body">
      <g class="b-fruit"><path d="M54 12 C49 14 48 20 49 30 C50 50 45 72 55 90 L70 90 C77 72 75 48 71 29 C69 19 66 12 61 12 Z"/><path class="b-bite" d="M57 18 C55 40 57 62 60 84"/></g>
      <g clip-path="url(#bAll)"><rect x="30" y="72" width="60" height="40" class="b-peel"/></g>
      <path class="b-stem" d="M56 100 L56 112 L68 112 L66 100 Z"/>
      <g class="strip s-left"><g clip-path="url(#bTop)"><rect x="30" y="0" width="29" height="76" class="b-peel"/><path d="M44 10 C42 40 44 60 50 74" class="b-line"/></g></g>
      <g class="strip s-right"><g clip-path="url(#bTop)"><rect x="59" y="0" width="30" height="76" class="b-peel b-peel-dark"/><path d="M76 10 C78 40 76 60 72 74" class="b-line"/></g></g>
      <g class="strip s-mid"><g clip-path="url(#bTop)"><rect x="51" y="0" width="18" height="76" class="b-peel b-peel-mid"/></g></g>
      <path class="b-tip" d="M52 6 C54 3 60 3 62 6 C60 9 54 9 52 6 Z"/></g></svg>`;
  const COCONUT = `<svg viewBox="0 0 120 120" class="coconut-svg" aria-hidden="true"><defs>
      <radialGradient id="cShell" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="#9b6a3a"/><stop offset="0.55" stop-color="#6b4423"/><stop offset="1" stop-color="#3d2410"/></radialGradient>
      <clipPath id="cTop"><rect x="0" y="0" width="120" height="62"/></clipPath><clipPath id="cBot"><rect x="0" y="58" width="120" height="70"/></clipPath></defs>
    <g class="half half-bottom" clip-path="url(#cBot)"><g class="half-inner"><circle cx="60" cy="60" r="44" fill="url(#cShell)"/><ellipse class="c-flesh" cx="60" cy="60" rx="38" ry="9"/><ellipse class="c-milk" cx="60" cy="61" rx="30" ry="6"/></g></g>
    <g class="half half-top" clip-path="url(#cTop)"><g class="half-inner"><circle cx="60" cy="60" r="44" fill="url(#cShell)"/>
      <g class="c-hair"><path d="M30 40 l6 4 M50 28 l3 7 M74 30 l-2 7 M88 46 l-7 3 M40 52 l5 2 M80 56 l-6 1"/></g>
      <circle cx="48" cy="46" r="5" class="c-eye"/><circle cx="68" cy="44" r="5" class="c-eye"/><circle cx="58" cy="56" r="4.5" class="c-eye"/></g></g></svg>`;
  const WEATHER = `<svg viewBox="0 0 120 100" class="wx-svg" aria-hidden="true">
    <g class="wx-sun"><circle cx="88" cy="26" r="13" fill="#ffd93b" stroke="#e0a912" stroke-width="2"/>
      <g stroke="#ffd93b" stroke-width="4" stroke-linecap="round"><path d="M88 4v6M88 42v6M66 26h6M104 26h6M72 10l4 4M100 38l4 4M72 42l4-4M100 14l4-4"/></g></g>
    <path class="wx-cloud" d="M30 70 C14 70 12 48 30 46 C32 28 56 24 64 40 C78 34 94 44 90 60 C100 62 100 70 88 70 Z"/>
    <g class="wx-drops" stroke="#7ec8f0" stroke-width="4" stroke-linecap="round">
      <path class="d d1" d="M30 78l-3 9"/><path class="d d2" d="M58 80l-3 9"/><path class="d d3" d="M84 78l-3 9"/>
      <path class="d d4" d="M44 84l-3 9"/><path class="d d5" d="M72 84l-3 9"/><path class="d d6" d="M96 82l-3 9"/></g>
    <path class="wx-bolt" d="M62 60 L50 80 L60 80 L53 98 L76 72 L64 72 L72 60Z" fill="#ffd93b" stroke="#a8740f" stroke-width="2" stroke-linejoin="round"/></svg>`;
  const svgToy = (svg, shake) => host => {                      // peels or cracks when used, resets when recharged
    host.innerHTML = svg; let wait = 0;
    return {
      set(used, animate) {
        clearTimeout(wait); host.classList.remove('shaking');
        if (used && animate && shake && !reduceMotion) { host.classList.add('shaking'); wait = setTimeout(() => { host.classList.remove('shaking'); host.classList.add('on'); }, 450); } else host.classList.toggle('on', used);
      }
    };
  };
  const toys = {
    snack: svgToy(BANANA, false),
    coconut: svgToy(COCONUT, true),
    weather: host => { host.innerHTML = WEATHER; return { paint: n => { host.parentNode.dataset.state = n; } }; },
    night: host => ({ paint: on => { host.textContent = on ? '🌙' : '☀️'; } }),
  };

  /* =====================  THE TITLE SCREEN'S MONKEY (eyes follow the pointer)  ===================== */
  const hero = $('#heroMonkey'), bubble = $('#hmBubble'), pupils = [...hero.querySelectorAll('.m-pupil')];
  let bubbleTimer = 0, heroBusy = false, sayT = 0;
  hero.addEventListener('click', () => {
    if (heroBusy) return; heroBusy = true;
    hero.classList.add('wild', 'screech'); bubble.textContent = pick(['OOH OOH!', 'AHH AHH!', 'EEEK!', 'BANANA?!']);
    bubble.classList.add('show'); IMI.sfx.monkey();
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(() => { hero.classList.remove('wild', 'screech'); bubble.classList.remove('show'); heroBusy = false; }, 1200);
  });
  addEventListener('pointermove', e => {
    if (!onMenu() || hero.offsetParent === null) return;
    const [cx, cy] = centerOf($('svg', hero));
    const a = Math.atan2(e.clientY - (cy - 20), e.clientX - cx), d = Math.min(1.6, Math.hypot(e.clientX - cx, e.clientY - cy) / 150);
    pupils.forEach(p => { p.style.transform = `translate(${(Math.cos(a) * d).toFixed(2)}px, ${(Math.sin(a) * d).toFixed(2)}px)`; });
  });
  function heroSay(text, ms = 1600) {
    if (!onMenu() || hero.offsetParent === null || heroBusy) return;
    bubble.textContent = text; bubble.classList.add('show'); clearTimeout(sayT); sayT = setTimeout(() => bubble.classList.remove('show'), ms);
  }
  function frame(now) {
    Mood.update(now);                                            // wetness drives the CSS dimming everywhere
    if (onMenu() && hero.offsetParent !== null) {
      const shakeA = Mood.shakeAmp(now), startle = Mood.startle(now) || shakeA > 0;
      hero.classList.toggle('rainy', Mood.hat); hero.classList.toggle('startle', startle);
      hero.classList.toggle('scared', Mood.scared && !startle && !heroBusy);
      hero.classList.toggle('shiver', Mood.scared && !reduceMotion && !hero.classList.contains('shake') && !hero.classList.contains('wild'));
    }
    requestAnimationFrame(frame);
  }
  Mood.on('weather', n => heroSay(['Sunny!', 'Drizzle…', "It's raining!", 'STORM!! EEK!'][n]));
  Mood.on('startle', () => { IMI.sfx.monkey(); if (onMenu() && !heroBusy) { hero.classList.add('wild'); setTimeout(() => hero.classList.remove('wild'), 1100); heroSay('EEEEK!', 1100); } });
  Mood.on('shake', () => {
    IMI.sfx.shake(); heroSay('Shake it off!', 1500);
    if (onMenu()) { hero.classList.add('shake'); setTimeout(() => hero.classList.remove('shake'), 1500); const hr = hero.getBoundingClientRect(); burst(hr.left + hr.width / 2, hr.top + 260, ['drop', 'drop'], 14); }
  });
  Mood.on('drip', () => { if (onMenu() && hero.offsetParent !== null && Math.random() < .6) { const hr = hero.getBoundingClientRect(); fall(hr.left + hr.width / 2 + rand(-30, 30), hr.top + 300, 'drop', 900, 18); } });

  /* =====================  BOOT  ===================== */
  const IMI = Core.boot({
    edition: 'classic', burst, fall: (x, y, name, life) => fall(x, y, name, life, 20), heroSay, toys, ease: 'cubic-bezier(.5,0,.3,1)',
    bananaEl: mult => { const b = sprite('🍌', Math.round(14 * mult * 1.25)); b.style.verticalAlign = 'middle'; return b; },
    bannerText: t => '🍌 ' + t + ' 🍌',
    paintSound: (btn, on) => { btn.firstChild.textContent = on ? '🔊' : '🔇'; },
  });
  requestAnimationFrame(frame);
  }
  if (window.Rewards?.enabled) Rewards.start(start); else start();
})();
