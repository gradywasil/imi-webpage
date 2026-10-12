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
    function noise(dur, vol = .08, lp = 900) {
      if (!on) return; const a = ctx(); if (!a) return;
      const n = Math.floor(a.sampleRate * dur), buf = a.createBuffer(1, n, a.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
      const s = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
      f.type = 'lowpass'; f.frequency.value = lp; g.gain.value = vol; s.buffer = buf; s.connect(f); f.connect(g); g.connect(a.destination); s.start();
    }
    return {
      get on() { return on; }, set(v) { on = v; store.set('sound', v); },
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
      clack(n = 0) { noise(.03, .07, 2600); tone(240 + n * 12, 130, .05, 'square', .05); },
      bell() { tone(1760, 1760, .5, 'sine', .07); tone(2349, 2349, .35, 'sine', .03); },
      typo() { tone(170, 140, .12, 'sawtooth', .05); },
    };
  })();

  /* ---------- pixel stage: a canvas at art resolution, upscaled by a whole number so every pixel stays square ---------- */
  function stage(host, W, H, opts = {}) {
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H; cv.className = 'mg-cv'; host.appendChild(cv);
    const g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
    const st = { cv, g, W, H, sc: 3 };
    function fit() {
      const padX = opts.padX || 16, padY = opts.padY || 24;
      st.sc = Math.max(1, Math.floor(Math.min((innerWidth - padX) / W, (innerHeight - padY) / H)));
      host.style.setProperty('--sc', st.sc + 'px');
      host.style.width = W * st.sc + 'px'; host.style.height = H * st.sc + 'px';
      cv.style.width = W * st.sc + 'px'; cv.style.height = H * st.sc + 'px';
    }
    fit(); addEventListener('resize', fit); addEventListener('orientationchange', fit);
    st.fit = fit;
    st.toArt = ev => { const r = cv.getBoundingClientRect(); return [(ev.clientX - r.left) / r.width * W, (ev.clientY - r.top) / r.height * H]; };
    return st;
  }

  /* ---------- the fixed-step loop: update at 60 Hz, render once per frame, pause when hidden ---------- */
  function loop(update, draw) {
    let last = performance.now(), acc = 0, raf = 0, run = true;
    const STEP = 1 / 60;
    function frame(now) {
      raf = requestAnimationFrame(frame);
      let dt = Math.min(.1, (now - last) / 1000); last = now;
      if (run) { acc += dt; while (acc >= STEP) { update(STEP); acc -= STEP; } }
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
  function boot() {
    backdrop(); PXA.install();
    const dr = document.getElementById('drifters');
    if (dr) for (let i = 0; i < 7; i++) {
      const s = PXA.el(i % 2 ? 'leaf' : 'leaf2', 1); s.style.left = (6 + i * 14) + '%'; s.style.animationDuration = (16 + i * 3) + 's'; s.style.animationDelay = (-i * 4) + 's'; dr.appendChild(s);
    }
    addEventListener('resize', () => PXA.paintSky());
  }

  /* ---------- tiny DOM helpers ---------- */
  const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  function spriteImg(cv, mult = 3, cls = '') { const i = h('canvas', 'mg-ico ' + cls); i.width = cv.width; i.height = cv.height; i.getContext('2d').drawImage(cv, 0, 0); i.style.width = cv.width * mult + 'px'; i.style.height = cv.height * mult + 'px'; return i; }

  /* ---------- shared HUD + overlay: score, hearts, combo chip, meter, banner, flash, floating text ---------- */
  function ui(host, st, scoreIcon, maxHearts = 3) {
    const A = MGArt.build(), q = {};
    const hud = h('div', 'mg-hud'); host.appendChild(hud);
    const scBox = h('div', 'sc'); scBox.append(spriteImg(scoreIcon || A.banana, 2), h('b', '', '0')); hud.appendChild(scBox);
    const scNum = scBox.querySelector('b'), hearts = h('div', 'mg-hearts'); hud.appendChild(hearts);
    const heartEls = Array.from({ length: maxHearts }, () => { const e = spriteImg(A.heart, 2); hearts.appendChild(e); return e; });
    q.combo = h('div', 'mg-combo'); host.appendChild(q.combo);
    q.meter = h('div', 'mg-meter', '<b></b>'); host.appendChild(q.meter); q.meterFill = q.meter.firstChild;
    const banner = h('div', 'mg-banner'); host.appendChild(banner);
    const flash = h('div', 'mg-flash'); host.appendChild(flash);
    q.over = h('div', 'mg-over'); host.appendChild(q.over);
    const retrigger = (e, c) => { e.classList.remove(c); void e.offsetWidth; e.classList.add(c); };
    q.say = (html, cls = '') => { banner.className = 'mg-banner ' + cls; banner.innerHTML = html; void banner.offsetWidth; banner.classList.add('show'); };
    q.hideBanner = () => { banner.className = 'mg-banner'; };
    q.floatText = (x, y, txt, cls = '') => {
      if (host.querySelectorAll('.mg-float').length > 14) return;
      const e = h('div', 'mg-float ' + cls, txt); e.style.left = x * st.sc + 'px'; e.style.top = y * st.sc + 'px';
      host.appendChild(e); e.addEventListener('animationend', () => e.remove());
    };
    q.doFlash = (col = '#fff') => { flash.style.background = col; retrigger(flash, 'go'); };
    q.bump = () => retrigger(scBox, 'bump');
    q.pulseCombo = () => retrigger(q.combo, 'pulse');
    q.setScore = n => { scNum.textContent = n; };
    q.setHearts = (n, animate) => heartEls.forEach((e, i) => {
      const on = i < n ? '1' : '0'; if (e.dataset.on === on) return; e.dataset.on = on;
      const c = e.getContext('2d'); c.clearRect(0, 0, 9, 8); c.drawImage(on === '1' ? A.heart : A.heartOff, 0, 0);
      if (animate && on === '0') retrigger(e, 'lose');
    });
    q.setCombo = (n, m) => { q.combo.classList.toggle('on', n >= 3); q.combo.innerHTML = `${n} COMBO${m > 1 ? ` <i>x${m}</i>` : ''}`; };
    q.setMeter = (frac, ice) => { q.meter.classList.toggle('on', frac > 0); q.meter.classList.toggle('dia', !!ice); q.meterFill.style.transform = `scaleX(${frac})`; };
    q.btn = (label, cls, fn) => { const b = h('a', 'banana-btn ' + (cls || ''), `<span>${label}</span>`); b.href = '#'; b.addEventListener('click', e => { e.preventDefault(); fn(); }); return b; };
    q.mult = c => 1 + Math.min(4, Math.floor(c / 6)) * .5;
    return q;
  }

  window.MG = { ui, rng, clamp, lerp, store, sfx, stage, loop, boot, h, spriteImg };
})();
