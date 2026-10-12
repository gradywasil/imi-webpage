/* CORE: everything the pixel and classic editions share.
   Synth sound, the banana counter, the menu/game screens, the header toys (snack banana, coconut, weather, night)
   and the window.IMI bridge that ops.js (the game) talks to. Each edition passes in an `art` object with its own
   particles, icons and toy visuals; this file never touches sprites or SVG itself. */
window.Core = (() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const html = document.documentElement;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const centerOf = el => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };
  const restart = (el, cls) => { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };
  const { fmt, exact, rate: fmtRate } = Economy;
  const fmtHud = fmt;

  /* =====================  SOUND (synthesized, no assets)  ===================== */
  const audio = { ctx: null, on: localStorage.getItem('imi-sound') !== 'off' };
  function ac() {
    if (!audio.ctx) { const C = window.AudioContext || window.webkitAudioContext; if (C) audio.ctx = new C(); }
    if (audio.ctx && audio.ctx.state === 'suspended') audio.ctx.resume();
    return audio.ctx;
  }
  function tone(f0, dur, { type = 'sine', vol = 0.16, f1 = f0, delay = 0, vibrato = 0 } = {}) {
    if (!audio.on) return; const c = ac(); if (!c) return;
    const t = c.currentTime + delay, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    if (vibrato) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = 28; lg.gain.value = vibrato; l.connect(lg).connect(o.frequency); l.start(t); l.stop(t + dur); }
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur + 0.02);
  }
  const noiseBufs = new Map();                              // a decaying burst of noise is the same every time, so each length is built once and replayed
  function noiseBuf(c, dur) {
    const key = dur + '@' + c.sampleRate; let buf = noiseBufs.get(key);
    if (!buf) {
      const len = Math.floor(c.sampleRate * dur); buf = c.createBuffer(1, len, c.sampleRate); const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
      noiseBufs.set(key, buf);
    }
    return buf;
  }
  function noise(dur, { vol = 0.2, freq = 1800, delay = 0 } = {}) {
    if (!audio.on) return; const c = ac(); if (!c) return;
    const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(), t = c.currentTime + delay;
    s.buffer = noiseBuf(c, dur); f.type = 'bandpass'; f.frequency.value = freq; g.gain.value = vol;
    s.connect(f).connect(g).connect(c.destination); s.start(t);
  }
  /* pixel gets chiptune squares, classic gets rounder triangles */
  let lastKey = 0;                                          // a big crew types dozens of times a second: no more than one clack per 35ms
  function makeSfx(px) {
    const lead = px ? 'square' : 'triangle';
    return {
      peel()    { noise(.25, { freq: 3000, vol: .18 }); tone(300, .22, { type: lead, f1: 800, vol: .07 }); tone(600, .18, { type: lead, f1: 1200, delay: .12, vol: .05 }); },
      unpeel()  { tone(700, .25, { type: lead, f1: 240, vol: .07 }); },
      crack()   { noise(.12, { freq: 900, vol: .5 }); tone(140, .18, { type: 'square', f1: 50, vol: .22 }); noise(.35, { freq: 5000, vol: .15, delay: .08 }); },
      shake()   { for (let i = 0; i < 4; i++) noise(.05, { freq: 700, vol: .25, delay: i * .1 }); },
      monkey()  { tone(520, .2, { type: 'sawtooth', f1: 380, vibrato: 90, vol: .08 }); tone(600, .2, { type: 'sawtooth', f1: 400, delay: .24, vibrato: 90, vol: .08 }); tone(760, .4, { type: 'sawtooth', f1: 300, delay: .5, vibrato: 140, vol: .08 }); },
      coin()    { tone(988, .08, { type: 'square', vol: .06 }); tone(1319, .22, { type: 'square', delay: .08, vol: .06 }); },
      drum()    { tone(220, .2, { f1: 70, vol: .35 }); noise(.05, { freq: 300, vol: .3 }); },
      day()     { tone(523, .14, { type: lead, vol: .06 }); tone(659, .14, { type: lead, delay: .1, vol: .06 }); tone(784, .26, { type: lead, delay: .2, vol: .06 }); },
      night()   { tone(784, .16, { type: lead, vol: .06 }); tone(587, .16, { type: lead, delay: .12, vol: .06 }); tone(392, .36, { type: lead, delay: .24, vol: .06 }); },
      tick()    { tone(1200, .03, { type: 'square', vol: .03 }); },
      key(p = 1) { const t = performance.now(); if (t - lastKey < 35) return; lastKey = t; noise(.03, { freq: 2600 * p, vol: .1 }); tone((170 + Math.random() * 60) * p, .04, { type: 'square', f1: 70 * p, vol: .04 }); },
      combo(n)  { const sc = [0, 2, 4, 7, 9], k = Math.min(n - 5, 10); tone(523.25 * Math.pow(2, (sc[k % 5] + 12 * Math.floor(k / 5)) / 12), .07, { type: lead, vol: .03 }); },   // a rising pentatonic run while a tap streak holds
      rip()     { noise(.16, { freq: 4200, vol: .12 }); noise(.08, { freq: 1500, vol: .08, delay: .05 }); },
      chest()   { noise(.08, { freq: 500, vol: .3 }); tone(220, .12, { type: 'square', f1: 440, delay: .05, vol: .05 }); },
      coinlet() { tone(1760 + Math.random() * 220, .05, { type: lead, vol: .018 }); },
      triumph() { [523, 659, 784, 1047, 1319, 1568].forEach((f, i) => tone(f, .3, { type: lead, delay: i * .09, vol: .06 })); [262, 392, 523].forEach(f => tone(f, 1.2, { type: 'triangle', delay: .55, vol: .07 })); },
      ding()    { tone(1568, .32, { type: 'triangle', vol: .07 }); },
      fanfare() { [523, 659, 784, 1047].forEach((f, i) => tone(f, .2, { type: 'square', delay: i * .1, vol: .07 })); },
    };
  }

  /* =====================  BOOT  ===================== */
  function boot(art) {
    const px = art.edition === 'pixel', sfx = makeSfx(px);

    /* ---------- sound buttons (the menu and the game header each have one) ---------- */
    const soundBtns = [...document.querySelectorAll('[data-sound]')];
    let paintOpt = () => {};
    const paintSound = () => { soundBtns.forEach(b => { b.setAttribute('aria-pressed', String(audio.on)); art.paintSound(b, audio.on); }); paintOpt(); };
    paintSound();
    soundBtns.forEach(b => b.addEventListener('click', () => {
      audio.on = !audio.on; localStorage.setItem('imi-sound', audio.on ? 'on' : 'off'); paintSound();
      restart(b, 'hit'); if (audio.on) sfx.drum();
    }));

    /* ---------- the banana counter ---------- */
    const hud = $('#hud'), scoreEl = $('#score');
    let score = Economy.loadScore();
    let shown = score, tweening = false, saveT = 0;
    const inGame = () => html.dataset.screen === 'game';
    const persist = () => { clearTimeout(saveT); saveT = 0; Economy.saveScore(score); };
    addEventListener('pagehide', persist);
    document.addEventListener('visibilitychange', () => { if (document.hidden) persist(); });
    scoreEl.textContent = fmtHud(score);
    const watchers = [];
    function tweenScore() {                                  // the counter rolls toward the real total
      const d = score - shown;
      if (!(Math.abs(d) > Math.max(1, Math.abs(score) * Number.EPSILON * 4))) { shown = score; scoreEl.textContent = fmtHud(shown); tweening = false; return; }
      shown += d * 0.16 + Math.sign(d); scoreEl.textContent = fmtHud(shown); requestAnimationFrame(tweenScore);
    }
    function paintScore(bump) {
      if (!saveT) saveT = setTimeout(persist, 1500);
      hud.title = 'Bananas: ' + exact(score);
      hud.setAttribute('aria-label', 'Bananas: ' + exact(score));
      if (reduceMotion || !inGame()) { shown = score; scoreEl.textContent = fmtHud(score); } else if (!tweening) { tweening = true; requestAnimationFrame(tweenScore); }
      if (bump && inGame()) restart(hud, 'bump');
      watchers.forEach(f => f(score));
    }
    /* a "+n" with a banana flies from `from` into the counter, then the total changes */
    function earn(n, from) {
      score += n; paintScore(true); sfx.coin();
      if (reduceMotion || !inGame()) return;
      const [fx, fy] = from || [innerWidth / 2, innerHeight / 2], [hx, hy] = centerOf(hud);
      const f = document.createElement('div'); f.className = 'fly-plus'; f.textContent = `+${fmt(n)}`; f.style.left = fx + 'px'; f.style.top = fy + 'px';
      const b = art.bananaEl(1); b.style.marginLeft = '6px'; b.style.verticalAlign = 'middle'; f.appendChild(b); document.body.appendChild(f);
      f.animate([
        { transform: 'translate(-50%,-50%)', opacity: 0 }, { transform: 'translate(-50%,-90px)', opacity: 1, offset: .3 },
        { transform: `translate(${hx - fx - f.offsetWidth / 2}px, ${hy - fy}px)`, opacity: .9 }
      ], { duration: 900, easing: art.ease || 'steps(14)' }).onfinish = () => f.remove();
    }
    function spend(n) {
      if (n > score) return false; score -= n; paintScore(true); sfx.tick();
      if (n >= 1 && !reduceMotion && inGame()) {             // the price drops out of the counter
        const [x, y] = centerOf(hud), f = document.createElement('div'); f.className = 'fly-minus'; f.textContent = '-' + fmt(n);
        f.style.left = x + 'px'; f.style.top = (y + 18) + 'px'; document.body.appendChild(f);
        f.animate([{ transform: 'translate(-50%, 0)', opacity: 1 }, { transform: 'translate(-50%, 46px)', opacity: 0 }], { duration: 900, easing: art.ease || 'steps(8)' }).onfinish = () => f.remove();
      }
      return true;
    }

    /* ---------- banners and the toast ---------- */
    function banner(text) {
      sfx.fanfare();
      const b = document.createElement('div'); b.className = 'banner'; b.textContent = art.bannerText(text); document.body.appendChild(b);
      b.animate([
        { transform: 'translate(-50%, -140px)', opacity: 0 }, { transform: 'translate(-50%, 0)', opacity: 1, offset: .2 },
        { transform: 'translate(-50%, 0)', opacity: 1, offset: .8 }, { transform: 'translate(-50%, -80px)', opacity: 0 }
      ], { duration: 2600, easing: art.ease || 'steps(10)' }).onfinish = () => b.remove();
      if (inGame()) { const [x, y] = centerOf(hud); art.burst(x, y + 60, ['banana', 'spark', 'star'], 16); }
    }
    const toast = $('#toast'); let toastT = 0;
    function say(msg) {
      toast.textContent = msg; toast.hidden = false; restart(toast, 'pop');
      clearTimeout(toastT); toastT = setTimeout(() => { toast.hidden = true; }, 2400);
    }

    /* ---------- screens: the menu and the game are two full-screen views, #play in the URL is the game ---------- */
    const screenFns = [], queued = [];
    const apply = first => {
      const next = location.hash === '#play' ? 'game' : 'menu';
      if (html.dataset.screen === next && !first) return;
      html.dataset.screen = next;
      const el = $(next === 'game' ? '#game' : '#menu'); if (el && !reduceMotion && !first) restart(el, 'enter');
      screenFns.forEach(f => f(next));
      if (next === 'game') while (queued.length) queued.shift()();
    };
    const play = () => { location.hash = 'play'; };
    const leave = () => { history.pushState(null, '', location.pathname + location.search); apply(); };
    addEventListener('hashchange', () => apply());
    $('#playBtn').addEventListener('click', e => { e.preventDefault(); sfx.tick(); play(); });
    $('#menuBtn').addEventListener('click', () => { sfx.tick(); leave(); });
    addEventListener('keydown', e => { if (e.key === 'Escape' && inGame() && !document.querySelector('.o-modal, .o-celebrate')) leave(); });

    /* ---------- header toys ---------- */
    const TOYS = {
      snack:   { cd: 90, name: 'Snack break', tip: 'Peel a banana: typists work 50% faster for 20 seconds', sound: 'peel' },
      coconut: { cd: 60, name: 'Coconut crack', tip: 'Crack a coconut open for a pile of letters', sound: 'crack' },
      weather: { name: 'Weather', gauge: true, tip: 'The sky outside. Tap for the forecast. Rain and storms move the market and some typists' },
      night:   { name: 'Day and night', gauge: true, tip: 'The time of day. Tap for the forecast. Night owls and TV love the dark' },
    };
    const dock = $('#toyDock'), toys = {};
    const readyAt = JSON.parse(localStorage.getItem('imi-toys') || '{}');
    for (const [id, T] of Object.entries(TOYS)) {
      const el = document.createElement('button'); el.type = 'button'; el.className = 'toy'; el.dataset.toy = id; el.title = T.tip;
      el.setAttribute('aria-label', T.name); el.innerHTML = '<span class="toy-art"></span>' + (T.cd ? '<i class="toy-cd"></i>' : '') + (T.gauge ? '<i class="toy-eta"></i>' : '');
      dock.appendChild(el);
      toys[id] = { el, art: art.toys[id](el.firstChild), timer: 0 };
    }
    function coolDown(id) {                                  // the ring drains while the toy recharges, then it perks up
      const T = TOYS[id], o = toys[id], left = (readyAt[id] || 0) - Date.now();
      clearTimeout(o.timer); o.el.classList.toggle('cooling', left > 0); o.el.setAttribute('aria-disabled', String(left > 0));
      if (left <= 0) return o.art.set(false, false);
      o.art.set(true, false);
      o.el.style.setProperty('--cd', T.cd * 1000 + 'ms'); o.el.style.setProperty('--cd-at', -(T.cd * 1000 - left) + 'ms');
      const ring = o.el.querySelector('.toy-cd'); restart(ring, 'run');
      o.timer = setTimeout(() => {
        o.el.classList.remove('cooling'); o.el.setAttribute('aria-disabled', 'false'); o.art.set(false, true);
        if (inGame()) { sfx.ding(); restart(o.el, 'ready'); } else o.el.classList.add('ready');
      }, left);
    }
    function useToy(id) {
      const T = TOYS[id], o = toys[id], now = Date.now();
      if (IMI.ops?.introActive()) { say('Finish learning the room to unlock boosts.'); return; }
      if ((readyAt[id] || 0) > now) { sfx.tick(); say(`${T.name} is recharging (${Math.ceil((readyAt[id] - now) / 1000)}s)`); restart(o.el, 'nope'); return; }
      const at = centerOf(o.el), msg = IMI.ops ? IMI.ops.perk(id, at) : '';
      readyAt[id] = now + T.cd * 1000; try { localStorage.setItem('imi-toys', JSON.stringify(readyAt)); } catch { /* storage blocked */ }
      sfx[T.sound](); o.el.classList.remove('ready'); o.art.set(true, true); coolDown(id);
      art.burst(at[0], at[1] + 20, id === 'snack' ? ['leaf', 'spark', 'banana'] : ['drop', 'coco', 'drop'], 10);
      if (msg) say(msg);
      emit('toy', { id });
    }
    Object.entries(toys).forEach(([id, o]) => { if (TOYS[id].cd) { o.el.addEventListener('click', () => useToy(id)); coolDown(id); } });
    document.addEventListener('visibilitychange', () => { if (!document.hidden) Object.keys(toys).forEach(id => TOYS[id].cd && coolDown(id)); });

    /* ---------- the sky ----------
       Day, night and weather follow the World clock (world.js), the same for everyone and computed from the time, so nothing is saved and
       time away counts. The two toys are gauges: they show the sky now and how long until it changes; tapping one reads out the forecast. */
    const WX_SAY = ['Clear skies.', 'Drizzle. Cozy.', 'Rain. The water is rising.', 'STORM! Hold on to the vines.'];
    const WX_NOW = ['Clear', 'Drizzle', 'Rain', 'Storm'], PHASE_NOW = { day: 'Day', dusk: 'Dusk', night: 'Night', dawn: 'Dawn' };
    function setNight(on, announce) {
      document.body.classList.toggle('night', on); toys.night.art.paint(on); toys.night.el.setAttribute('aria-pressed', String(on));
      if (announce) { (on ? sfx.night : sfx.day)(); say(on ? 'LIGHTS OUT. Night owls rejoice.' : 'RISE AND SHINE.'); }
    }
    Weather.on('change', (n, lv) => toys.weather.art.paint(n, lv));
    Weather.init({ style: art.edition, S: art.S });
    const mmss = ms => { const t = Math.max(0, Math.ceil(ms / 1000)); return Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0'); };
    const baro = () => (IMI.ops && IMI.ops.baro ? IMI.ops.baro() : 0);
    let skyNow = null, soonFor = 0, shownEta = {};
    function paintGauges(t, at) {
      const wxEta = World.untilNext(t, 'wx'), nightEta = World.untilNext(t, 'night');
      const set = (id, text, label) => { const o = toys[id]; if (shownEta[id] !== text) { shownEta[id] = text; o.el.querySelector('.toy-eta').textContent = text; } o.el.setAttribute('aria-label', label); };
      set('weather', mmss(wxEta), `Weather: ${WX_NOW[at.wx]}. Changes in ${mmss(wxEta)}.`);
      set('night', mmss(nightEta), `${PHASE_NOW[at.phase]}. ${at.night ? 'Sunrise' : 'Night'} in ${mmss(nightEta)}.`);
    }
    function skyStep(quiet) {                                  // once a second, and the moment you come back to the tab
      const t = Date.now(), at = World.at(t), prev = skyNow; skyNow = at;
      if (!prev || prev.night !== at.night) setNight(at.night, !quiet && !!prev && inGame() && !document.hidden);
      if (!prev || prev.wx !== at.wx) { Weather.setState(at.wx, quiet || !prev); if (prev && !quiet && inGame() && !document.hidden && !(prev.night !== at.night)) say(WX_SAY[at.wx]); }
      if (prev && (prev.night !== at.night || prev.wx !== at.wx)) emit('sky', { ...at, prev });
      const nx = World.next(t, 1)[0];                          // headline a change shortly before it happens
      if (nx && nx.at - t < 45000 && soonFor !== nx.at) { soonFor = nx.at; emit('skysoon', { ev: nx, etaMs: nx.at - t }); }
      paintGauges(t, at);
    }
    function forecastText(id) {                                // what tapping a gauge says; the barometer (Shop) adds what is coming
      const t = Date.now(), at = World.at(t), tier = baro(), kind = id === 'weather' ? 'wx' : 'night';
      const head = id === 'weather' ? `${WX_NOW[at.wx]} now.` : `${PHASE_NOW[at.phase]} now.`;
      if (tier < 1) return `${head} ${id === 'weather' ? 'The weather changes' : (at.night ? 'Sunrise' : 'Night')} in ${mmss(World.untilNext(t, kind))}. A barometer (Shop) shows what is coming.`;
      const list = World.next(t, tier >= 2 ? 4 : 2, id === 'weather' ? 'wx' : 'any').map(e => `${World.label(e)} in ${mmss(e.at - t)}`);
      return `${head} Next: ${list.join(', ')}.`;
    }
    ['weather', 'night'].forEach(id => toys[id].el.addEventListener('click', () => { sfx.tick(); restart(toys[id].el, 'hit'); say(forecastText(id)); emit('toy', { id }); }));
    /* ---------- settings popover (game header): art style, sound, reset, tutorial replay ---------- */
    const setBtn = $('#settingsBtn');
    if (setBtn) {
      const pop = document.createElement('div'); pop.className = 'set-pop'; pop.hidden = true; pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-label', 'Settings');
      const cur = (window.StyleSwap && StyleSwap.current) || art.edition;
      const row = (label, body) => `<div class="set-row"><span class="set-lab">${label}</span>${body}</div>`;
      pop.innerHTML = row('Style', `<span class="set-seg"><button type="button" data-style="pixel" aria-pressed="${cur === 'pixel'}">Pixel</button><button type="button" data-style="classic" aria-pressed="${cur === 'classic'}">Classic</button></span>`)
        + row('Effects', '<span class="set-seg" title="Max adds glow, extra particles, trails and screen shake for fast machines. Low turns off looping decoration and trims particles so the game runs smoother. Auto switches to Low on weak phones or when the game cannot hold its frame rate; it never picks Max.">' + ['auto', 'max', 'high', 'low'].map(m => `<button type="button" data-fx="${m}" aria-pressed="false">${m[0].toUpperCase() + m.slice(1)}</button>`).join('') + '</span>')
        + row('Sound', '<button type="button" class="set-btn" data-set="sound"></button>')
        + row('Tutorial', '<button type="button" class="set-btn" data-set="tour">Replay</button>').replace('class="set-row"', 'class="set-row" data-tour hidden')
        + row('Tips', '<button type="button" class="set-btn" data-set="tips"></button>').replace('class="set-row"', 'class="set-row" data-tour hidden')
        + row('Game', '<button type="button" class="set-btn" data-set="reset">Reset</button>');
      document.body.appendChild(pop);
      const soundOpt = $('[data-set="sound"]', pop);
      paintOpt = () => { soundOpt.textContent = audio.on ? 'On' : 'Off'; soundOpt.setAttribute('aria-pressed', String(audio.on)); };
      paintOpt();
      const close = () => { pop.hidden = true; setBtn.setAttribute('aria-expanded', 'false'); };
      const tipsOpt = $('[data-set="tips"]', pop);
      const paintTour = () => { const t = window.IMI && IMI.tour; pop.querySelectorAll('[data-tour]').forEach(r => { r.hidden = !t; }); if (t) { tipsOpt.textContent = t.tipsOn() ? 'On' : 'Off'; tipsOpt.setAttribute('aria-pressed', String(t.tipsOn())); } };   // tour.js loads after this, so look it up when the popover opens
      setBtn.addEventListener('click', e => { e.stopPropagation(); sfx.tick(); paintTour(); paintFx(); pop.hidden = !pop.hidden; setBtn.setAttribute('aria-expanded', String(!pop.hidden)); });
      pop.addEventListener('click', e => {
        const b = e.target.closest('button'); if (!b) return;
        if (b.dataset.fx) { setFx(b.dataset.fx); return; }
        if (b.dataset.style) { if (b.dataset.style !== cur && window.StyleSwap) { close(); StyleSwap.swap(); } return; }
        const act = b.dataset.set;
        if (act === 'sound') { audio.on = !audio.on; localStorage.setItem('imi-sound', audio.on ? 'on' : 'off'); paintSound(); if (audio.on) sfx.drum(); return; }
        if (act === 'tips') { IMI.tour.tipsOn(!IMI.tour.tipsOn()); paintTour(); return; }
        close();
        if (act === 'reset') IMI.ops && IMI.ops.reset();
        else if (act === 'tour') IMI.tour.replay();
      });
      document.addEventListener('click', e => { if (!pop.hidden && !pop.contains(e.target)) close(); });
      addEventListener('keydown', e => { if (e.key === 'Escape' && !pop.hidden) { e.stopImmediatePropagation(); close(); setBtn.focus(); } }, true);
      screenFns.push(() => close());
    }

    /* typing "banana" anywhere makes it rain bananas */
    let typed = '';
    addEventListener('keydown', e => {
      if (e.target.matches('input, textarea') || e.key.length !== 1) return;
      typed = (typed + e.key.toLowerCase()).slice(-6);
      if (typed !== 'banana') return;
      typed = ''; if (window.IMI?.ops?.introActive()) return;
      banner('BANANA RAIN!'); earn(Economy.cash(5));
      if (reduceMotion) return;
      for (let i = 0; i < 40; i++) setTimeout(() => {
        const b = art.bananaEl(rand(2, 4)); b.className += ' pfx'; b.style.cssText += `;left:${rand(0, innerWidth)}px;top:-60px;z-index:250`; document.body.appendChild(b);
        b.animate([{ transform: 'translateY(0)' }, { transform: `translateY(${innerHeight + 160}px)` }], { duration: rand(1800, 3200), easing: art.ease || 'steps(24)' }).onfinish = () => b.remove();
      }, i * 70);
    });

    /* ---------- tiny event bus: ops.js emits, tour.js listens ---------- */
    const bus = {};
    const on = (n, f) => { (bus[n] || (bus[n] = [])).push(f); };
    const off = (n, f) => { bus[n] = (bus[n] || []).filter(x => x !== f); };
    const emit = (n, d) => { (bus[n] || []).slice().forEach(f => { try { f(d); } catch (e) { console.error(e); } }); };

    /* ---------- effects level ----------
       Max = High plus the heavy extras (html[data-fxmax], IMI.fx.max): glow, more particles, trails, screen shake. Only ever chosen by hand.
       High = everything. Low = no looping decoration (CSS keys off html[data-fx="low"]), fewer particles, lighter typist drawing (ops.js reads IMI.fx.low).
       Auto (the default) starts on Low for very weak phones, and drops to Low if the frame rate stays poor while you play; it never switches back up on its own. */
    const FXK = 'imi-fx', FXA = 'imi-fx-auto';
    const fx = { mode: 'auto', low: false, max: false };
    const weakDevice = () => (navigator.deviceMemory && navigator.deviceMemory <= 2) || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2);
    function applyFx() {
      const m = localStorage.getItem(FXK), was = fx.low, wasMax = fx.max; fx.mode = m === 'high' || m === 'low' || m === 'max' ? m : 'auto';
      fx.low = fx.mode === 'low' || (fx.mode === 'auto' && (localStorage.getItem(FXA) === '1' || !!weakDevice()));
      fx.max = fx.mode === 'max';
      html.dataset.fx = fx.low ? 'low' : 'high';
      if (fx.max) html.dataset.fxmax = ''; else delete html.dataset.fxmax;
      if (fx.low !== was || fx.max !== wasMax) emit('fx', { low: fx.low, max: fx.max });
    }
    function paintFx() {
      document.querySelectorAll('.set-pop [data-fx]').forEach(b => { b.setAttribute('aria-pressed', String(b.dataset.fx === fx.mode)); if (b.dataset.fx === 'auto') b.textContent = fx.mode === 'auto' && fx.low ? 'Auto: Low' : 'Auto'; });
    }
    function setFx(mode) {
      try { localStorage.setItem(FXK, mode); if (mode === 'auto') localStorage.removeItem(FXA); } catch { /* storage blocked */ }
      applyFx(); paintFx(); sfx.tick();
    }
    function watchFrameRate() {                              // 4-second windows; two bad ones in a row switch Auto to Low
      let last = 0, t0 = 0, n = 0, bad = 0, strikes = 0;
      const step = now => {
        requestAnimationFrame(step);
        const dt = now - last; last = now;
        if (document.hidden || !inGame() || fx.mode !== 'auto' || fx.low || dt > 1000 || dt <= 0) { n = bad = strikes = 0; t0 = now; return; }
        n++; if (dt > 45) bad++;
        if (now - t0 < 4000) return;
        // a bad window: under ~5fps on average, or over a third of its frames slower than ~22fps
        if (n < 20 || bad / n > .35) { if (++strikes >= 2) { try { localStorage.setItem(FXA, '1'); } catch { /* storage blocked */ } applyFx(); say('Smoother mode on. Change it under Settings > Effects.'); } } else strikes = 0;
        n = bad = 0; t0 = now;
      };
      requestAnimationFrame(step);
    }

    /* ---------- the bridge ops.js plays through ---------- */
    window.IMI = {
      on, off, emit,
      edition: art.edition, reduceMotion, sfx, centerOf, fmt, fmtRate, exact, say, banner, heroSay: art.heroSay,
      fx, setFx, bananaEl: art.bananaEl, forecastText,
      burst: (x, y, names, n = 12) => art.burst(x, y, names, fx.low ? Math.max(2, Math.ceil(n / 3)) : fx.max ? Math.round(n * 1.6) : n),     // Low: a third of the particles, Max: more
      fall: (x, y, name, life) => { if (fx.low && Math.random() < .5) return; art.fall(x, y, name, life); },
      bananas: { get: () => score, add: n => { score += n; paintScore(false); }, spend, earn, watch: f => watchers.push(f) },
      screen: () => html.dataset.screen,
      onScreen: f => screenFns.push(f),
      whenPlaying: f => (inGame() ? f() : queued.push(f)),     // modals wait for the game screen instead of covering the menu
    };
    on('render', () => { for (const id of ['snack', 'coconut']) toys[id].el.hidden = !!IMI.ops?.introActive(); });
    apply(true); applyFx(); watchFrameRate();
    skyStep(true); setInterval(() => skyStep(false), 1000);                // the sky starts once the event bus exists
    document.addEventListener('visibilitychange', () => { if (!document.hidden) skyStep(true); });
    return window.IMI;
  }
  return { boot, $, rand, pick, centerOf, restart, reduceMotion };
})();
