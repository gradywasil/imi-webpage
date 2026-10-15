/* ============================================================
   MINI-GAME CORE: shared by every side game. Standalone: it never reads or writes the main game's save.
   boot() installs the main game's pixel art + jungle backdrop; stage() makes a crisp integer-scaled canvas;
   sfx is synthesised; store keeps per-game bests under "mg:" keys.
   ============================================================ */
(() => {
  'use strict';
  const rng = (a = 1, b) => b == null ? Math.random() * a : a + Math.random() * (b - a);
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const lerp = (a, b, t) => a + (b - a) * t;

  /* ---------- storage ---------- */
  const store = {
    get(k, d) { try { const v = localStorage.getItem('mg:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('mg:' + k, JSON.stringify(v)); } catch (e) { /* private mode: fine */ } },
  };

  /* ---------- sound ---------- */
  const sfx = (() => {
    let ac = null, on = store.get('sound', true);
    const ctx = () => { if (!ac && !(navigator.userActivation && navigator.userActivation.hasBeenActive)) return null; if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } } if (ac.state === 'suspended') ac.resume(); return ac; };
    function tone(f0, f1, dur, type = 'square', vol = .06, delay = 0) {
      if (!on) return; const a = ctx(); if (!a) return;
      const t = a.currentTime + delay, o = a.createOscillator(), g = a.createGain();
      o.type = type; o.frequency.setValueAtTime(f0, t); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
      o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + dur + .02);
    }
    function noise(dur, vol = .08, lp = 900, delay = 0) {
      if (!on) return; const a = ctx(); if (!a) return;
      const n = Math.floor(a.sampleRate * dur), buf = a.createBuffer(1, n, a.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
      const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
      f.type = 'lowpass'; f.frequency.value = lp; g.gain.value = vol; s.buffer = buf; s.connect(f); f.connect(g); g.connect(a.destination); s.start(a.currentTime + delay);
    }
    return {
      get on() { return on; }, set(v) { on = v; store.set('sound', v); }, tone, noise,
      unlock() { ctx(); },
      ding(n = 0) { tone(660 + n * 55, 990 + n * 80, .09, 'square', .05); },
      letters() { tone(520, 520, .05, 'square', .04); tone(780, 780, .06, 'square', .04, .05); tone(1040, 1040, .08, 'square', .04, .1); },
      golden() { [660, 830, 990, 1320].forEach((f, i) => tone(f, f, .12, 'triangle', .07, i * .07)); },
      diamond() { [880, 1108, 1318, 1760, 2217, 2637].forEach((f, i) => { tone(f, f, .22, 'triangle', .07, i * .06); tone(f * 2, f * 2, .14, 'sine', .03, i * .06); }); },
      bonk() { tone(180, 60, .22, 'square', .1); noise(.14, .1, 500); },
      rotten() { tone(220, 90, .28, 'sawtooth', .06); },
      miss() { tone(300, 200, .08, 'triangle', .04); },
      thud() { noise(.06, .05, 400); },
      start() { [440, 554, 659, 880].forEach((f, i) => tone(f, f, .1, 'square', .05, i * .08)); },
      over() { [440, 370, 311, 220].forEach((f, i) => tone(f, f * .96, .22, 'triangle', .07, i * .16)); },
      tick() { tone(900, 900, .03, 'square', .03); },
      hover() { tone(1250, 1250, .02, 'square', .015); },
      count(i) { tone(520 + i * 150, 520 + i * 150, .09, 'square', .05); },
      clack(n = 0) { noise(.03, .07, 2600); tone(240 + n * 12, 130, .05, 'square', .05); },
      bell() { tone(1760, 1760, .5, 'sine', .07); tone(2349, 2349, .35, 'sine', .03); },
      typo() { tone(170, 140, .12, 'sawtooth', .05); },
    };
  })();

  /* ---------- pixel stage: W x H are the game's own units; the canvas holds K x K pixels per unit (default 3) so sprites can be drawn at the main game's finer
     resolution. g is pre-scaled by K, so existing unit-based drawing is unchanged; st.hi() draws a K-times-detailed sprite at its natural size. ---------- */
  function stage(host, W, H, opts = {}) {
    const K = opts.K || 3, cv = document.createElement('canvas'); cv.width = W * K; cv.height = H * K; cv.className = 'mg-cv'; host.appendChild(cv);
    const g = cv.getContext('2d'); g.imageSmoothingEnabled = false; g.setTransform(K, 0, 0, K, 0, 0);
    const st = { cv, g, W, H, K, sc: 3 };
    st.hi = (img, x, y, flipX) => { const w = img.width / K, hh = img.height / K, rx = Math.round(x * K) / K, ry = Math.round(y * K) / K; if (flipX) { g.save(); g.translate(rx + w, ry); g.scale(-1, 1); g.drawImage(img, 0, 0, w, hh); g.restore(); } else g.drawImage(img, rx, ry, w, hh); };
    function fit() {
      const padX = opts.padX || 8, padY = Math.max(opts.padY || 0, 66), FR = 11;          /* the wooden frame adds about 11 art pixels around the canvas */
      st.sc = Math.max(1, Math.floor(Math.min((innerWidth - padX) / (W + FR), (innerHeight - padY) / (H + FR)) * K) / K);
      host.style.setProperty('--sc', st.sc + 'px');
      host.style.setProperty('--u', clamp(W * st.sc / 360, .8, 2.2).toFixed(2));
      host.style.width = W * st.sc + 'px'; host.style.height = H * st.sc + 'px';
      cv.style.width = W * st.sc + 'px'; cv.style.height = H * st.sc + 'px';
    }
    fit(); addEventListener('resize', fit); addEventListener('orientationchange', fit);
    st.fit = fit;
    st.toArt = ev => { const r = cv.getBoundingClientRect(); return [(ev.clientX - r.left) / r.width * W, (ev.clientY - r.top) / r.height * H]; };
    return st;
  }

  /* ---------- the fixed-step loop: update at 60 Hz, render once per frame, pause when hidden ---------- */
  let freeze = 0;
  const hitstop = sec => { freeze = Math.max(freeze, sec); };                      /* a few frames of stillness on a big hit */
  function loop(update, draw) {
    let last = performance.now(), acc = 0, raf = 0, run = true;
    const STEP = 1 / 60;
    function frame(now) {
      raf = requestAnimationFrame(frame);
      let dt = Math.min(.1, (now - last) / 1000); last = now;
      if (run) { if (freeze > 0) freeze -= dt; else { acc += dt; while (acc >= STEP) { update(STEP); acc -= STEP; } } }
      draw(run ? acc / STEP : 0);
    }
    raf = requestAnimationFrame(frame);
    return { pause() { run = false; }, resume() { run = true; last = performance.now(); }, get running() { return run; } };
  }

  /* ---------- jungle backdrop + pixel art install (the same sky/layers/drifters as the title screen) ---------- */
  function backdrop() {
    const d = document.createElement('div'); d.className = 'backdrop'; d.setAttribute('aria-hidden', 'true');
    d.innerHTML = '<div class="sky" id="sky"></div><div class="layer layer-far"></div><div class="layer layer-mid"></div><div class="layer layer-near"></div><div class="drifters" id="drifters"></div>';
    document.body.prepend(d);
  }
  const ICONS = {
    back: ['.....##...', '....##....', '...##.....', '..##......', '...##.....', '....##....', '.....##...'],
    snd: ['...#......', '..##..#...', '###....#..', '###..#.#..', '###..#.#..', '###....#..', '..##..#...', '...#......'],
    mute: ['...#......', '..##......', '###..#..#.', '###...##..', '###...##..', '###..#..#.', '..##......', '...#......'],
    pause: ['.##..##.', '.##..##.', '.##..##.', '.##..##.', '.##..##.', '.##..##.', '.##..##.'],
    play: ['.#......', '.###....', '.#####..', '.#######', '.#####..', '.###....', '.#......'],
  };
  const iconCache = {};
  function icon(name) {
    if (iconCache[name]) return iconCache[name];
    const rows = ICONS[name], w = rows[0].length + 1, hh = rows.length + 1, c = document.createElement('canvas'); c.width = w; c.height = hh; const x = c.getContext('2d');
    rows.forEach((r, y) => r.split('').forEach((ch, i) => { if (ch === '#') { x.fillStyle = '#1a0f14'; x.fillRect(i + 1, y + 1, 1, 1); } }));
    rows.forEach((r, y) => r.split('').forEach((ch, i) => { if (ch === '#') { x.fillStyle = '#fff6d6'; x.fillRect(i, y, 1, 1); } }));
    return (iconCache[name] = `url(${c.toDataURL()})`);
  }
  function decorateNav() {
    document.querySelectorAll('.mg-nav a').forEach(a => { a.style.backgroundImage = icon('back'); a.textContent = ''; });
    const mute = document.getElementById('mute'); if (mute) { mute.textContent = ''; mute.style.backgroundImage = icon(sfx.on ? 'snd' : 'mute'); }
  }
  function boot() {
    if (new URLSearchParams(location.search).get('flat')) document.head.appendChild(Object.assign(document.createElement('style'), { textContent: '.backdrop,.mg-nav{display:none!important}*{animation-duration:0s!important;animation-delay:0s!important}' }));
    decorateNav();
    backdrop(); PXA.install();
    const dr = document.getElementById('drifters');
    if (dr) for (let i = 0; i < 7; i++) {
      const s = PXA.el(i % 2 ? 'leaf' : 'leaf2', 1); s.style.left = (6 + i * 14) + '%'; s.style.animationDuration = (16 + i * 3) + 's'; s.style.animationDelay = (-i * 4) + 's'; dr.appendChild(s);
    }
    addEventListener('resize', () => PXA.paintSky());
  }

  /* ---------- tiny DOM helpers ---------- */
  const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  function spriteImg(cv, mult = 3, cls = '') { if (cv.hi) mult /= 3; const i = h('canvas', 'mg-ico ' + cls); i.width = cv.width; i.height = cv.height; i.getContext('2d').drawImage(cv, 0, 0); i.style.width = `calc(${cv.width * mult}px * var(--u, 1))`; i.style.height = `calc(${cv.height * mult}px * var(--u, 1))`; return i; }

  /* ---------- shared HUD + overlay: score, hearts, combo chip, meter, banner, flash, floating text ---------- */
  function ui(host, st, scoreIcon, maxHearts = 3) {
    const A = MGArt.build(), q = {}, HEART = window.MGArt3 ? MGArt3.build() : A;
    const hud = h('div', 'mg-hud'); host.appendChild(hud);
    const scBox = h('div', 'sc'); scBox.append(spriteImg(scoreIcon || A.banana, 2), h('b', '', '0')); hud.appendChild(scBox);
    const scNum = scBox.querySelector('b');
    q.combo = h('div', 'mg-combo'); hud.appendChild(q.combo);
    const hearts = h('div', 'mg-hearts'); hud.appendChild(hearts);
    const heartEls = Array.from({ length: maxHearts }, () => { const e = spriteImg(HEART.heart, 2); hearts.appendChild(e); return e; });
    q.meter = h('div', 'mg-meter', '<b></b>'); host.appendChild(q.meter); q.meterFill = q.meter.firstChild;
    const banner = h('div', 'mg-banner'); host.appendChild(banner);
    const flash = h('div', 'mg-flash'); host.appendChild(flash);
    q.over = h('div', 'mg-over'); host.appendChild(q.over);
    const retrigger = (e, c) => { e.classList.remove(c); void e.offsetWidth; e.classList.add(c); };
    q.say = (html, cls = '') => { banner.className = 'mg-banner ' + cls; banner.innerHTML = html; void banner.offsetWidth; banner.classList.add('show'); };
    q.hideBanner = () => { banner.className = 'mg-banner'; };
    q.floatText = (x, y, txt, cls = '') => {
      if (host.querySelectorAll('.mg-float').length > 14) return;
      const e = h('div', 'mg-float ' + cls, txt); e.style.left = clamp(x, 8, st.W - 8) * st.sc + 'px'; e.style.top = y * st.sc + 'px'; e.style.setProperty('--dx', Math.round(rng(-7, 7) * st.sc / 3) + 'px');
      host.appendChild(e); e.addEventListener('animationend', () => e.remove());
    };
    q.doFlash = (col = '#fff') => { flash.style.background = col; retrigger(flash, 'go'); };
    q.bump = () => retrigger(scBox, 'bump');
    q.pulseCombo = () => retrigger(q.combo, 'pulse');
    /* the score rolls up to its new value instead of jumping */
    let shown = 0, target = 0, raf = 0;
    const roll = () => { raf = requestAnimationFrame(() => { raf = 0; const d = target - shown; if (!d) return; shown += Math.abs(d) < 4 ? d : Math.sign(d) * Math.ceil(Math.abs(d) * .22); scNum.textContent = shown; if (shown !== target) roll(); }); };
    q.setScore = n => { target = n; if (n === 0 || n < shown) { shown = n; scNum.textContent = n; return; } if (!raf) roll(); };
    q.setHearts = (n, animate) => heartEls.forEach((e, i) => {
      const on = i < n ? '1' : '0'; if (e.dataset.on === on) return; const was = e.dataset.on; e.dataset.on = on;
      const c = e.getContext('2d'); c.clearRect(0, 0, e.width, e.height); c.drawImage(on === '1' ? HEART.heart : HEART.heartOff, 0, 0);
      if (animate && on === '0') retrigger(e, 'lose'); else if (was === '0' && on === '1') retrigger(e, 'gain');
    });
    q.setCombo = (n, m) => { q.combo.classList.toggle('on', n >= 3); q.combo.innerHTML = `${n} COMBO${m > 1 ? ` <i>x${m}</i>` : ''}`; };
    q.setMeter = (frac, ice) => { q.meter.classList.toggle('on', frac > 0); q.meter.classList.toggle('dia', !!ice); q.meterFill.style.transform = `scaleX(${frac})`; };
    q.btn = (label, cls, fn) => {
      const b = h('a', 'mg-btn ' + (/green|alt/.test(cls || '') ? 'alt ' : '') + (/primary/.test(cls || '') ? 'primary' : ''), `<span>${label}</span>`); b.href = '#';
      b.addEventListener('click', e => { e.preventDefault(); sfx.unlock(); sfx.tick(); fn(); }); b.addEventListener('pointerenter', () => sfx.hover());
      return b;
    };
    q.mult = c => 1 + Math.min(4, Math.floor(c / 6)) * .5;
    return q;
  }

  /* ---------- shell: title / pause / game-over flow, best scores, Esc + blur pause, mute button ---------- */
  function confetti(el, n = 36) {
    const cols = ['#ffd23a', '#fff08c', '#74c648', '#ff7a6a', '#9be8ff', '#e4b0ff'], box = h('div', 'mg-confetti');
    for (let i = 0; i < n; i++) { const p = h('i'); p.style.left = rng(0, 100) + '%'; p.style.background = cols[i % cols.length]; p.style.animationDelay = rng(0, 1.2) + 's'; p.style.animationDuration = rng(1.5, 2.8) + 's'; p.style.setProperty('--cx', Math.round(rng(-60, 60)) + 'px'); box.appendChild(p); }
    el.prepend(box);
  }
  function shell(o) {
    const { host, ui } = o, over = ui.over, modes = o.modes || [{ k: 'main', label: 'START' }];
    const S = { phase: 'title', mode: modes[0].k, get playing() { return S.phase === 'play'; } };
    const bestKey = m => o.id + ':' + m, quick = /autostart/.test(location.search) && !/count=1/.test(location.search);
    const setPhase = ph => { S.phase = ph; document.body.classList.toggle('mg-playing', ph === 'play' || ph === 'pause'); syncPause(); };
    S.best = m => store.get(bestKey(m || S.mode), 0);
    S.title = () => {
      setPhase('title'); host.classList.add('menu-open'); over.hidden = false; over.innerHTML = ''; ui.hideBanner();
      const leg = h('div', 'mg-legend');
      (o.legend || []).forEach(([cv, label], i) => { const d = h('div'); d.style.setProperty('--i', i); d.append(spriteImg(cv, cv.width > 24 ? 1 : 2), h('span', '', label)); leg.appendChild(d); });
      const btns = h('div', 'mg-modes'); modes.forEach((m, i) => btns.appendChild(ui.btn(m.label, (m.cls || '') + (i === 0 ? ' primary' : ''), () => { S.start(m.k); })));
      const best = modes.map(m => (modes.length > 1 ? m.label.split(' ')[0] + ' ' : '') + S.best(m.k)).join('  ·  ');
      const ttl = h('h1', 'mg-title', o.title), longest = Math.max(...o.title.replace(/<[^>]+>/g, ' ').split(/\s+/).map(w => w.length));
      if (longest > 8) ttl.style.fontSize = `max(12px, calc(var(--u) * ${Math.round(27 * 8 / longest)}px))`;
      over.append(ttl, h('p', 'mg-sub', o.sub || ''), leg, btns, h('p', 'mg-hint', o.hint || ''), h('p', 'mg-best', 'BEST  ' + best));
      if (o.onTitle) o.onTitle();
    };
    /* 3-2-1-GO: the game is set up but frozen until the count ends (a tap skips it) */
    let countT = 0;
    S.start = m => {
      S.mode = m || S.mode; over.hidden = true; host.classList.remove('menu-open'); ui.hideBanner(); o.onStart(S.mode);
      host.querySelectorAll('.mg-count').forEach(e => e.remove());
      if (quick) { setPhase('play'); sfx.start(); return; }
      setPhase('count'); const box = h('div', 'mg-count'); host.appendChild(box); let i = 0; const steps = ['3', '2', '1', 'GO!'];
      const step = () => {
        if (S.phase !== 'count') { box.remove(); return; }
        box.innerHTML = `<b class="${i === 3 ? 'go' : ''}">${steps[i]}</b>`; if (i < 3) sfx.count(i); else { sfx.start(); }
        if (i === 3) { countT = setTimeout(() => { box.remove(); if (S.phase === 'count') setPhase('play'); }, 380); return; }
        i++; countT = setTimeout(step, 430);
      };
      step();
      S.skipCount = () => { if (S.phase === 'count') { clearTimeout(countT); box.remove(); setPhase('play'); sfx.start(); } };
    };
    S.skipCount = () => {};
    S.finish = stats => {
      setPhase('over'); host.classList.add('menu-open'); ui.hideBanner(); ui.setMeter(0); ui.combo.classList.remove('on'); host.querySelectorAll('.mg-float,.mg-count').forEach(e => e.remove());
      const score = o.score(), prev = S.best(), isNew = score > prev && score > 0; if (isNew) store.set(bestKey(S.mode), score);
      over.hidden = false; over.innerHTML = '';
      const grid = h('div', 'mg-stats'); (stats || []).forEach(([k, v], i) => { const a = h('span', '', k), b = h('b', '', v); a.style.setProperty('--i', i); b.style.setProperty('--i', i); grid.append(a, b); });
      const big = h('h2', 'mg-big', '0');
      over.append(h('p', 'mg-sub', o.overTitle || "THAT'S A WRAP"), big, isNew ? h('p', 'mg-new', 'NEW BEST!') : h('p', 'mg-best', 'BEST ' + Math.max(prev, score)), grid,
        ui.btn('AGAIN', 'primary', () => S.start()), ui.btn(modes.length > 1 ? 'MODES' : 'MENU', 'alt', () => { if (o.onMenu) o.onMenu(); S.title(); }));
      /* roll the final score up with ticks, then pop it; new bests get confetti */
      let shown = 0; const t0 = performance.now(), dur = clamp(Math.sqrt(score) * 28, 350, 1100);
      const roll = () => { const k = clamp((performance.now() - t0) / dur, 0, 1), v = Math.round(score * (1 - Math.pow(1 - k, 3))); if (v !== shown) { shown = v; big.textContent = v; if (k < 1 && shown % 3 === 0) sfx.tick(); } if (k < 1) requestAnimationFrame(roll); else { big.textContent = score; big.classList.add('hit'); if (isNew) { sfx.golden(); confetti(over); } } };
      requestAnimationFrame(roll);
    };
    S.quit = () => { if (o.onMenu) o.onMenu(); S.title(); };
    S.pause = () => {
      if (S.phase !== 'play') return; setPhase('pause'); host.classList.add('menu-open'); over.hidden = false; over.innerHTML = '';
      over.append(h('h2', 'mg-big', 'PAUSED'), ui.btn('RESUME', 'primary', S.resume), ui.btn('QUIT TO MENU', 'alt', S.quit));
    };
    S.resume = () => { if (S.phase === 'pause') { setPhase('play'); over.hidden = true; host.classList.remove('menu-open'); if (o.onResume) o.onResume(); } };
    addEventListener('keydown', e => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (S.phase === 'count' && !e.repeat) { S.skipCount(); }
      if (e.key === 'Escape') { S.phase === 'play' ? S.pause() : S.resume(); return; }
      if ((e.key === 'Enter' || (e.key === ' ' && o.spaceStarts !== false)) && !e.repeat) {
        if (S.phase === 'title' || S.phase === 'over') { sfx.unlock(); S.start(); e.preventDefault(); } else if (S.phase === 'pause') { S.resume(); e.preventDefault(); }
      }
    });
    document.addEventListener('visibilitychange', () => { if (document.hidden) S.pause(); });
    addEventListener('blur', S.pause);
    /* nav: sound + pause buttons */
    const nav = document.querySelector('.mg-nav'), mute = document.getElementById('mute');
    const pb = h('button'); pb.id = 'pauseBtn'; pb.type = 'button'; pb.title = 'Pause (Esc)'; pb.setAttribute('aria-label', 'Pause'); if (nav) nav.appendChild(pb);
    function syncPause() { if (pb) pb.style.backgroundImage = icon(S.phase === 'pause' ? 'play' : 'pause'); }
    if (pb) { pb.addEventListener('click', () => { S.phase === 'pause' ? S.resume() : S.pause(); pb.blur(); }); syncPause(); }
    if (mute) { const sync = () => { mute.classList.toggle('off', !sfx.on); mute.style.backgroundImage = icon(sfx.on ? 'snd' : 'mute'); }; mute.addEventListener('click', () => { sfx.set(!sfx.on); sync(); sfx.unlock(); sfx.tick(); mute.blur(); }); sync(); }
    addEventListener('pointerdown', () => { sfx.unlock(); if (S.phase === 'count') S.skipCount(); });
    return S;
  }

  /* ---------- particles: pixel squares + expanding rings, shared by every game ---------- */
  function fx() {
    let P = [], Rg = [];
    return {
      burst(x, y, cols, n, spd = 50, grav = 120, life = .5) {
        for (let i = 0; i < n; i++) { const a = rng(Math.PI * 2), s = rng(spd * .3, spd); P.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - spd * .4, g: grav, t: 0, life: life * rng(.7, 1.2), col: cols[i % cols.length] }); }
      },
      spark(x, y, col = '#fff08c') { P.push({ x: x + rng(-8, 8), y: y + rng(-8, 8), vx: rng(-6, 6), vy: rng(-14, 2), g: 0, t: 0, life: rng(.3, .65), col, plus: true }); },
      ring(x, y, col, max = 22) { Rg.push({ x, y, t: 0, col, max }); },
      shock(x, y, col = '#fff', max = 30) { Rg.push({ x, y, t: 0, col, max }); Rg.push({ x, y, t: -.08, col, max: max * .65 }); },       /* two rings, one chasing the other */
      confetti(x, y, n = 24, cols = ['#ffd23a', '#fff08c', '#74c648', '#ff7a6a', '#9be8ff', '#e4b0ff']) { for (let i = 0; i < n; i++) { const a = rng(-Math.PI, 0), s = rng(30, 110); P.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, g: 150, t: 0, life: rng(.9, 1.6), col: cols[i % cols.length], flutter: rng(6.28), big: true }); } },
      puff(x, y, col = '#c9b88a', n = 3) { for (let i = 0; i < n; i++) P.push({ x: x + rng(-2, 2), y, vx: rng(-12, 12), vy: rng(-16, -4), g: -4, t: 0, life: rng(.25, .45), col, soft: true }); },
      trail(x, y, col = '#fff08c') { P.push({ x, y, vx: 0, vy: 0, g: 0, t: 0, life: .28, col, soft: true }); },
      update(dt) {
        for (let i = P.length - 1; i >= 0; i--) { const p = P[i]; p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += (p.g || 0) * dt; if (p.t >= p.life) P.splice(i, 1); }
        for (let i = Rg.length - 1; i >= 0; i--) { Rg[i].t += dt; if (Rg[i].t > .5) Rg.splice(i, 1); }
      },
      draw(g) {
        for (const p of P) {
          const k = 1 - p.t / p.life; g.fillStyle = p.col; g.globalAlpha = Math.min(1, k * 2.2);
          if (p.plus) { g.fillRect(Math.round(p.x), Math.round(p.y) - 1, 1, 3); g.fillRect(Math.round(p.x) - 1, Math.round(p.y), 3, 1); }
          else if (p.big) { const w = Math.floor(Math.abs(Math.sin(p.t * 9 + p.flutter)) * 2) + 1; g.fillRect(Math.round(p.x), Math.round(p.y), w + 1, 2); }
          else if (p.soft) { const s = k > .6 ? 3 : k > .3 ? 2 : 1; g.fillRect(Math.round(p.x) - 1, Math.round(p.y) - 1, s, s); }
          else { const s = k > .5 ? 2 : 1; g.fillRect(Math.round(p.x), Math.round(p.y), s, s); }
        }
        g.globalAlpha = 1;
        for (const r of Rg) { if (r.t < 0) continue; const k = r.t / .5; g.globalAlpha = 1 - k; g.strokeStyle = r.col; g.lineWidth = 1; g.beginPath(); g.arc(r.x + .5, r.y + .5, Math.round(r.max * k), 0, Math.PI * 2); g.stroke(); }
        g.globalAlpha = 1;
      },
      clear() { P = []; Rg = []; },
    };
  }

  window.MG = { fx, shell, ui, hitstop, confetti, icon, rng, clamp, lerp, store, sfx, stage, loop, boot, h, spriteImg };
})();
