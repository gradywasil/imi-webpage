/* ============================================================
   WEATHER — rain, rising water, lightning, rain audio.
   One simulation, two renderers (pixel / classic), chosen from <html data-style>.
   Pages create the UI; this module owns the canvases and the state (saved in localStorage).
   ============================================================ */
(() => {
  'use strict';
  const LV = [
    { name: 'CLEAR',   rate: 0,   wind: 0,    water: 0,   dim: 0,   vol: 0 },
    { name: 'DRIZZLE', rate: 80,  wind: -40,  water: 28,  dim: .10, vol: .03 },
    { name: 'RAIN',    rate: 260, wind: -95,  water: 76,  dim: .20, vol: .065 },
    { name: 'STORM',   rate: 560, wind: -220, water: 130, dim: .32, vol: .10, bolts: true },
  ];
  const rand = (a, b) => a + Math.random() * (b - a);
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pack = h => (255 << 24) | (parseInt(h.substr(5, 2), 16) << 16) | (parseInt(h.substr(3, 2), 16) << 8) | parseInt(h.substr(1, 2), 16);

  const Weather = { state: 0, levels: LV, onChange: null, _h: {} };
  Weather.on = (evt, fn) => { (Weather._h[evt] = Weather._h[evt] || []).push(fn); };
  const emit = (evt, ...a) => (Weather._h[evt] || []).forEach(f => f(...a));
  let pixel = false, S = 1, rc, wc, rx, wx, W = 0, H = 0, dpr = 1;
  const drops = [], splashes = [], ripples = [];
  let level = 0, carry = 0, last = 0, bolt = null, nextBolt = 0, flash, wimg = null, w32 = null, t = 0, started = false;

  /* ---------- sound ---------- */
  const A = { ctx: null, src: null, gain: null, unlocked: false };
  const soundOn = () => localStorage.getItem('imi-sound') !== 'off';
  function audioCtx() { if (!A.ctx) { const C = window.AudioContext || window.webkitAudioContext; if (C) A.ctx = new C(); } if (A.ctx && A.ctx.state === 'suspended') A.ctx.resume(); return A.ctx; }
  function startRainLoop() {
    const c = audioCtx(); if (!c || A.src) return;
    const len = c.sampleRate * 3, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    let b0 = 0; for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; b0 = .97 * b0 + .03 * w; d[i] = (w * .6 + b0 * 6) * .35; }
    A.src = c.createBufferSource(); A.src.buffer = buf; A.src.loop = true;
    const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 500;
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 6000;
    A.gain = c.createGain(); A.gain.gain.value = 0;
    A.src.connect(hp).connect(lp).connect(A.gain).connect(c.destination); A.src.start();
  }
  function applyVolume() {
    if (!A.unlocked) return; startRainLoop(); if (!A.gain) return;
    A.gain.gain.setTargetAtTime(soundOn() ? LV[Weather.state].vol : 0, A.ctx.currentTime, .4);
  }
  function thunder() {
    if (!soundOn()) return; const c = audioCtx(); if (!c) return;
    const dur = 2.2, len = Math.floor(c.sampleRate * dur), buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 1.6) * (1 + .6 * Math.sin(i / c.sampleRate * 38));
    const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = buf; f.type = 'lowpass'; f.frequency.value = 220; g.gain.value = .9; s.connect(f).connect(g).connect(c.destination); s.start();
  }
  addEventListener('pointerdown', () => { if (!A.unlocked) { A.unlocked = true; applyVolume(); } }, { once: true });
  setInterval(() => applyVolume(), 700);

  /* ---------- water + surfaces ---------- */
  const waveBase = (x, tt) => Math.sin(x * 0.012 + tt * 1.6) * 3 + Math.sin(x * 0.027 - tt * 2.3) * 1.8;
  function waveAt(x, tt) {
    let y = waveBase(x, tt);
    for (const r of ripples) { const d = Math.abs(x - r.x), env = Math.exp(-d * .014) * Math.max(0, 1 - r.age / 1.5); y += Math.sin(d * .12 - r.age * 10) * r.amp * env; }
    return y;
  }
  function surfaces() {
    const out = [];
    document.querySelectorAll('.tagline, .hero-live, .o-ticker, .o-stage').forEach(el => {          // rain splashes on whatever is on screen
      const r = el.getBoundingClientRect(); if (r.bottom < 0 || r.top > H || r.top < 70) return; out.push(r);
    });
    return out;
  }
  /* the side rail, department pages and the desk strip are a roof: rain splashes on their top edge and never falls across the text */
  function shelters() {
    if (document.documentElement.dataset.screen !== 'game') return [];
    const out = [];
    document.querySelectorAll('#rail, .o-pane:not([hidden]):not(#o-floor), .o-wrap:not([data-tab="floor"]) .o-desks').forEach(el => {
      const r = el.getBoundingClientRect(); if (r.width && r.bottom > 0 && r.top < H) out.push(r);
    });
    return out;
  }
  let surfC = [], roofC = [], rectsAt = -1;
  addEventListener('resize', () => { rectsAt = -1; });
  function splash(x, y, n) {
    for (let k = 0; k < n && splashes.length < 420; k++) splashes.push({ x, y, vx: rand(-90, 90), vy: -rand(90, 230), age: 0, max: rand(.25, .5) });
  }

  /* ---------- simulation ---------- */
  function update(dt) {
    const lv = LV[Weather.state], target = lv.water, k = reduceMotion ? .5 : 1;
    level += Math.max(-26 * dt, Math.min(14 * dt, target - level));
    if (level < .05 && target === 0) level = 0;
    carry += lv.rate * k * dt;
    while (carry >= 1) {
      carry -= 1; const z = rand(.55, 1);
      drops.push({ x: rand(-120, W + 120) - lv.wind * .6, y: rand(-30, -4), vy: rand(700, 980) * z, vx: lv.wind * rand(.85, 1.15) * z, z });
    }
    if (Weather.state > 0 || drops.length) { if (t - rectsAt > .5 || t < rectsAt) { rectsAt = t; surfC = surfaces(); roofC = shelters(); } } else { surfC = roofC = []; }   // measured twice a second, not every frame: each read forces a layout
    const surf = surfC, roof = drops.length ? roofC : [];
    for (let i = drops.length - 1; i >= 0; i--) {
      const d = drops[i], py = d.y; d.x += d.vx * dt; d.y += d.vy * dt;
      let hit = false;
      for (const r of roof) if (d.x >= r.left && d.x <= r.right && d.y >= r.top && d.y <= r.bottom) { if (py <= r.top) splash(d.x, r.top, 2); hit = true; break; }
      if (!hit) for (const r of surf) if (py <= r.top && d.y >= r.top && d.x >= r.left && d.x <= r.right) { splash(d.x, r.top, 3); hit = true; break; }
      if (!hit && level > 1) { const sy = H - level + waveBase(d.x, t); if (d.y >= sy) { if (ripples.length < 16 && Math.random() < .4) ripples.push({ x: d.x, age: 0, amp: rand(.8, 2) }); splash(d.x, sy, 1); hit = true; } }
      else if (!hit && d.y >= H - 3) { splash(d.x, H - 3, 2); hit = true; }
      if (hit || d.y > H + 60 || d.x < -260 || d.x > W + 260) { drops[i] = drops[drops.length - 1]; drops.pop(); }
    }
    for (let i = splashes.length - 1; i >= 0; i--) {
      const s = splashes[i]; s.age += dt; s.vy += 900 * dt; s.x += s.vx * dt; s.y += s.vy * dt;
      if (s.age > s.max) { splashes[i] = splashes[splashes.length - 1]; splashes.pop(); }
    }
    for (let i = ripples.length - 1; i >= 0; i--) { ripples[i].age += dt; if (ripples[i].age > 1.5) { ripples[i] = ripples[ripples.length - 1]; ripples.pop(); } }
    // lightning
    if (lv.bolts && !reduceMotion) {
      if (nextBolt === 0) nextBolt = t + rand(3, 7);
      if (t >= nextBolt) { strike(); nextBolt = t + rand(6, 13); }
    } else nextBolt = 0;
    if (bolt && t - bolt.born > .45) bolt = null;
  }
  function strike() {
    const pts = [[rand(.15, .85) * W, 0]], endY = rand(.45, .78) * H;
    while (pts[pts.length - 1][1] < endY) { const [x, y] = pts[pts.length - 1]; pts.push([x + rand(-46, 46), y + rand(26, 56)]); }
    bolt = { pts, born: t }; emit('bolt');
    const pix = pixel;
    flash.animate([{ opacity: 0 }, { opacity: .8, offset: .06 }, { opacity: .05, offset: .22 }, { opacity: .55, offset: .32 }, { opacity: 0 }],
      { duration: 520, easing: pix ? 'steps(1)' : 'ease-out' });
    setTimeout(thunder, rand(350, 1100));
  }

  /* ---------- classic renderer (smooth) ---------- */
  function drawClassic() {
    rx.clearRect(0, 0, W, H);
    if (drops.length || splashes.length) {
      const cols = ['rgba(170,205,245,.35)', 'rgba(190,222,255,.55)', 'rgba(215,238,255,.82)'], wid = [1, 1.3, 1.8], paths = [new Path2D(), new Path2D(), new Path2D()];
      for (const d of drops) { const b = d.z > .85 ? 2 : d.z > .7 ? 1 : 0; paths[b].moveTo(d.x, d.y); paths[b].lineTo(d.x - d.vx * .035, d.y - d.vy * .035); }
      rx.lineCap = 'round';
      paths.forEach((p, i) => { rx.strokeStyle = cols[i]; rx.lineWidth = wid[i]; rx.stroke(p); });
      const sp = new Path2D();
      for (const s of splashes) { const r = 2 * (1 - s.age / s.max) + .5; sp.moveTo(s.x + r, s.y); sp.arc(s.x, s.y, r, 0, 6.283); }
      rx.fillStyle = 'rgba(220,240,255,.85)'; rx.fill(sp);
    }
    if (level > 2) {                                   // translucent front lip of the water
      const night = document.body.classList.contains('night'), ft = H - Math.min(level, 60) * .5;
      rx.beginPath(); rx.moveTo(0, H);
      for (let x = 0; x <= W; x += 6) rx.lineTo(x, ft + waveAt(x, t + 1.3) * .8);
      rx.lineTo(W, H); rx.closePath();
      const g = rx.createLinearGradient(0, ft - 4, 0, H); g.addColorStop(0, night ? 'rgba(60,100,190,.35)' : 'rgba(90,200,245,.38)'); g.addColorStop(1, night ? 'rgba(20,40,110,.5)' : 'rgba(30,110,190,.55)');
      rx.fillStyle = g; rx.fill();
      rx.beginPath(); for (let x = 0; x <= W; x += 6) { const y = ft + waveAt(x, t + 1.3) * .8; x ? rx.lineTo(x, y) : rx.moveTo(x, y); }
      rx.strokeStyle = 'rgba(255,255,255,.55)'; rx.lineWidth = 2; rx.stroke();
    }
    if (bolt) {
      const a = 1 - (t - bolt.born) / .45;
      rx.save(); rx.shadowColor = 'rgba(190,210,255,1)'; rx.shadowBlur = 24; rx.strokeStyle = `rgba(255,255,255,${Math.max(0, a)})`; rx.lineWidth = 3; rx.lineJoin = 'round';
      rx.beginPath(); bolt.pts.forEach(([x, y], i) => i ? rx.lineTo(x, y) : rx.moveTo(x, y)); rx.stroke(); rx.restore();
    }
    // water body (behind the page content)
    wx.clearRect(0, 0, W, H);
    if (level > .5) {
      const night = document.body.classList.contains('night'), top = H - level;
      const back = new Path2D(); back.moveTo(0, H);
      for (let x = 0; x <= W; x += 6) back.lineTo(x, top - 9 + waveBase(x, t * .8 + 2) * 1.1);
      back.lineTo(W, H); back.closePath();
      wx.fillStyle = night ? 'rgba(50,90,170,.45)' : 'rgba(110,205,240,.5)'; wx.fill(back);
      const main = new Path2D(); main.moveTo(0, H);
      const ys = []; for (let x = 0; x <= W; x += 6) { const y = top + waveAt(x, t); ys.push(y); main.lineTo(x, y); }
      main.lineTo(W, H); main.closePath();
      const g = wx.createLinearGradient(0, top - 6, 0, H); g.addColorStop(0, night ? '#3a68b8' : '#5cc8f0'); g.addColorStop(.35, night ? '#223f88' : '#2f95d4'); g.addColorStop(1, night ? '#0c1f4a' : '#1a5a9c');
      wx.globalAlpha = .9; wx.fillStyle = g; wx.fill(main); wx.globalAlpha = 1;
      wx.strokeStyle = night ? 'rgba(170,200,255,.18)' : 'rgba(255,255,255,.16)'; wx.lineWidth = 2;               // caustic streaks
      for (let j = 1; j < 5; j++) { wx.beginPath(); for (let x = 0; x <= W; x += 10) { const y = top + 14 * j + Math.sin(x * .02 + t * 1.4 + j * 2) * 3; x ? wx.lineTo(x, y) : wx.moveTo(x, y); } wx.stroke(); }
      wx.beginPath(); ys.forEach((y, i) => i ? wx.lineTo(i * 6, y) : wx.moveTo(0, y));
      wx.strokeStyle = 'rgba(255,255,255,.7)'; wx.lineWidth = 2.5; wx.lineCap = 'round'; wx.stroke();
    }
  }

  /* ---------- pixel renderer (low-res canvas, hard pixels) ---------- */
  const PAL = {
    day:   [pack('#e6fbff'), pack('#8fe4f6'), pack('#4cbbe8'), pack('#3298d6'), pack('#2670b8'), pack('#1d5496')],
    night: [pack('#9fb8e8'), pack('#4f78c8'), pack('#3a5fb0'), pack('#2c4a96'), pack('#223a7c'), pack('#192c60')],
  };
  function drawPixel() {
    const cw = rc.width, ch = rc.height;
    rx.clearRect(0, 0, cw, ch);
    const dc = ['#6f9fd8', '#a9d2f4', '#e6f6ff'];
    for (const d of drops) {
      const L = Math.max(3, Math.min(10, Math.round(d.vy * .03 / S))), slope = d.vx / d.vy, x0 = d.x / S, y0 = Math.floor(d.y / S);
      rx.fillStyle = dc[d.z > .85 ? 2 : d.z > .7 ? 1 : 0];
      for (let i = 0; i < L; i++) rx.fillRect(Math.round(x0 - i * slope), y0 - i, 1, 1);
      if (d.z > .85) { rx.fillStyle = '#ffffff'; rx.fillRect(Math.round(x0), y0, 1, 1); }
    }
    rx.fillStyle = '#e6f6ff';
    for (const s of splashes) rx.fillRect(Math.floor(s.x / S), Math.floor(s.y / S), s.age < s.max * .5 ? 2 : 1, 1);
    const night = document.body.classList.contains('night'), P = night ? PAL.night : PAL.day, Hs = ch;
    if (level > 2) {                                    // dithered front lip
      const ft = Math.round(Hs - Math.min(level, 60) * .5 / S);
      for (let x = 0; x < cw; x++) {
        const y = ft + Math.round(waveAt(x * S, t + 1.3) * .8 / S);
        rx.fillStyle = night ? '#9fb8e8' : '#e6fbff'; rx.fillRect(x, y, 1, 1);
        rx.fillStyle = night ? '#4f78c8' : '#6fd0f0';
        for (let yy = y + 1; yy < Hs; yy += 1) if (((x + yy) & 1) === 0 && yy < y + 1 + Math.max(2, Math.round(level / S * .5))) rx.fillRect(x, yy, 1, 1);
      }
    }
    if (bolt) {
      const a = 1 - (t - bolt.born) / .45; rx.fillStyle = a > .5 ? '#ffffff' : '#bfd0ff';
      for (let i = 1; i < bolt.pts.length; i++) {
        const [ax, ay] = bolt.pts[i - 1], [bx, by] = bolt.pts[i], n = Math.max(1, Math.round(Math.abs(by - ay) / S));
        for (let j = 0; j <= n; j++) { const f = j / n; rx.fillRect(Math.round((ax + (bx - ax) * f) / S), Math.round((ay + (by - ay) * f) / S), 1, 1); rx.fillRect(Math.round((ax + (bx - ax) * f) / S) + 1, Math.round((ay + (by - ay) * f) / S), 1, 1); }
      }
    }
    // water body
    if (!wimg || wimg.width !== wc.width || wimg.height !== wc.height) { wimg = wx.createImageData(wc.width, wc.height); w32 = new Uint32Array(wimg.data.buffer); }
    w32.fill(0);
    if (level > .5) {
      const caus = Math.floor(t * 3);
      for (let x = 0; x < cw; x++) {
        const surf = Math.round(Hs - level / S + waveAt(x * S, t) / S);
        if (surf < 0) continue;
        const spark = ((x * 73856093) ^ (Math.floor(t * 8) * 19349663)) % 61 === 0;
        if (spark && surf > 0) w32[(surf - 1) * cw + x] = P[0];
        for (let y = Math.max(0, surf); y < Hs; y++) {
          const d = y - surf, e = d + ((BAYER[(y & 3) * 4 + (x & 3)] - 7.5) / 16) * 2.2;
          let c = e < 1 ? P[0] : e < 3 ? P[1] : e < 6 ? P[2] : e < 11 ? P[3] : e < 19 ? P[4] : P[5];
          if (d > 3 && d < 15 && (x * 7 + y * 13 + caus) % 23 === 0) c = P[1];
          w32[y * cw + x] = c;
        }
      }
    }
    wx.putImageData(wimg, 0, 0);
  }

  /* ---------- main loop ---------- */
  function tick(now) {
    requestAnimationFrame(tick);
    const dt = Math.min(.05, (now - (last || now)) / 1000); last = now; t += dt;
    const idle = Weather.state === 0 && level === 0 && !drops.length && !splashes.length && !bolt;
    if (idle) { if (!tick.cleared) { rx.clearRect(0, 0, rc.width, rc.height); wx.clearRect(0, 0, wc.width, wc.height); tick.cleared = true; } return; }
    tick.cleared = false;
    update(dt);
    pixel ? drawPixel() : drawClassic();
  }

  function resize() {
    W = innerWidth; H = innerHeight;
    if (pixel) { rc.width = wc.width = Math.ceil(W / S); rc.height = wc.height = Math.ceil(H / S); wimg = null; }
    else { dpr = Math.min(2, devicePixelRatio || 1); rc.width = wc.width = Math.round(W * dpr); rc.height = wc.height = Math.round(H * dpr); rx.setTransform(dpr, 0, 0, dpr, 0, 0); wx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    rx.imageSmoothingEnabled = wx.imageSmoothingEnabled = false;
  }

  /* ---------- public API ---------- */
  Weather.setState = (n, quiet) => {
    const prev = Weather.state; Weather.state = ((n % LV.length) + LV.length) % LV.length;
    localStorage.setItem('imi-weather', Weather.state);
    rc.style.backgroundColor = `rgba(8,18,40,${LV[Weather.state].dim})`;
    document.body.classList.toggle('raining', Weather.state > 0);
    if (!quiet && (!navigator.userActivation || navigator.userActivation.hasBeenActive)) { A.unlocked = true; audioCtx(); }      // the sky changes by itself now: no audio until the page has been touched
    applyVolume();
    if (Weather.onChange) Weather.onChange(Weather.state, LV[Weather.state]);
    emit('change', Weather.state, LV[Weather.state], prev, !!quiet);
  };
  Weather.next = () => Weather.setState(Weather.state + 1);
  Weather.waterTop = () => (level > 2 ? H - level : null);                       // css-px y of the water surface, or null if dry
  Weather.disturb = (x, n = 8) => { ripples.push({ x, age: 0, amp: 3.2 }); splash(x, H - level, n); };   // something fell in
  Weather.init = ({ style, S: scale = 3 } = {}) => {
    if (started) return; started = true;
    pixel = (style || document.documentElement.dataset.style) === 'pixel'; S = pixel ? scale : 1;
    const css = document.createElement('style');
    css.textContent = `
      .wx-water { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
      .wx-rain { position: fixed; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 15; transition: background-color .9s; }
      html[data-style="pixel"] .wx-water, html[data-style="pixel"] .wx-rain { image-rendering: pixelated; }
      html[data-style="pixel"] .wx-rain { transition-timing-function: steps(6); }
      .wx-flash { position: fixed; inset: 0; background: #eef4ff; opacity: 0; pointer-events: none; z-index: 16; }
      body.raining .drifters { opacity: .25; }`;
    document.head.appendChild(css);
    wc = document.createElement('canvas'); wc.className = 'wx-water'; wc.setAttribute('aria-hidden', 'true');
    rc = document.createElement('canvas'); rc.className = 'wx-rain'; rc.setAttribute('aria-hidden', 'true');
    flash = document.createElement('div'); flash.className = 'wx-flash';
    (document.querySelector('.backdrop') || document.body).appendChild(wc); document.body.appendChild(rc); document.body.appendChild(flash);
    wx = wc.getContext('2d'); rx = rc.getContext('2d');
    resize(); addEventListener('resize', () => { clearTimeout(resize.t); resize.t = setTimeout(resize, 150); });
    const q = new URLSearchParams(location.search).get('wx');   // ?wx=0..3 overrides the saved weather
    const saved = (q !== null ? parseInt(q, 10) : parseInt(localStorage.getItem('imi-weather'), 10)) || 0;
    level = LV[saved].water;                              // restored weather starts already flooded, no re-fill
    Weather.setState(saved, true);
    const warm = parseFloat(new URLSearchParams(location.search).get('wxwarm')) || 0;   // test hook: pre-simulate N seconds
    for (let i = 0; i < warm * 30; i++) { t += 1 / 30; update(1 / 30); }
    requestAnimationFrame(tick);
  };
  window.Weather = Weather;
})();
