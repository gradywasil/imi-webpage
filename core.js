/* CORE: the pixel edition's shell.
   Synth sound and music (the mixer), the banana counter, the menu/game screens, the header toys (snack banana, coconut, weather, night)
   and the window.IMI bridge that ops.js (the game) talks to. The edition passes in an `art` object with its own
   particles, icons and toy visuals (app.js); this file never touches sprites itself. */
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

  /* =====================  AUDIO (synthesized, no assets)  =====================
     Four buses on one AudioContext:  sfx / music / ambient -> master -> compressor -> speakers.  Each is a GainNode.
     Levels are 0..1 (what the sliders show), persisted as JSON in localStorage `imi-mix`; the gain applied is the level squared so the
     slider feels even. The old on/off flag (`imi-sound`=off) migrates to master 0, and the mute button remembers the level it muted from.
     Nothing makes sound before the first user gesture (the browser would refuse it anyway), and no context exists until then. */
  const BUSES = ['master', 'music', 'sfx', 'ambient'];
  const MIX_DEFAULT = { master: 1, music: .35, sfx: 1, ambient: 1 };
  const MIX_KEY = 'imi-mix';
  const lvl = (v, d) => { v = Number(v); return Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : d; };
  const audio = { ctx: null, nodes: null, activated: false, blocked: !!window.VaultSaveGate?.blocked, duck: false, migrated: false, hear: [] };
  const mix = (() => {
    let saved = {}; try { if (!audio.blocked) saved = JSON.parse(localStorage.getItem(MIX_KEY) || '{}') || {}; } catch { /* corrupt or blocked storage: defaults */ }   // a Vault-blocked page reads nothing but the save (tests/vault-startup-gate)
    const m = {}; for (const b of BUSES) m[b] = lvl(saved[b], MIX_DEFAULT[b]);
    m.prev = lvl(saved.prev, 1) || 1;                                    // the master level to come back to when un-muting
    let legacy = null; try { if (!audio.blocked) legacy = localStorage.getItem('imi-sound'); } catch { /* storage blocked */ }
    if (legacy === 'off' || legacy === 'on') {                           // the retired single switch
      if (legacy === 'off') { if (m.master > 0) m.prev = m.master; m.master = 0; }
      audio.migrated = true;
    }
    return m;
  })();
  const audible = bus => !audio.blocked && mix.master > 0 && mix[bus] > 0;
  const activated = () => audio.activated || !!(navigator.userActivation && navigator.userActivation.hasBeenActive);
  const taper = v => v * v;
  function applyMix() {
    const n = audio.nodes; if (!n) return;
    const t = audio.ctx.currentTime;
    for (const b of BUSES) n[b].gain.setTargetAtTime(audio.blocked ? 0 : taper(mix[b]), t, .03);
    n.duck.gain.setTargetAtTime(audio.duck ? .3 : 1, t, .12);
  }
  function buildGraph(c) {
    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -10; comp.knee.value = 14; comp.ratio.value = 3; comp.attack.value = .004; comp.release.value = .2; comp.connect(c.destination);
    const n = { comp };
    for (const b of BUSES) n[b] = c.createGain();
    n.duck = c.createGain();                                             // music tracks plug in here, so a cutscene line can dip the music without touching its slider
    n.master.connect(comp); n.sfx.connect(n.master); n.ambient.connect(n.master); n.music.connect(n.master); n.duck.connect(n.music);
    audio.nodes = n;
    for (const b of BUSES) n[b].gain.value = audio.blocked ? 0 : taper(mix[b]);
    n.duck.gain.value = audio.duck ? .3 : 1;
  }
  function ac() {
    if (!audio.ctx) {
      if (!activated()) return null;
      const C = window.AudioContext || window.webkitAudioContext; if (!C) return null;
      try { audio.ctx = new C(); } catch { return null; }
      buildGraph(audio.ctx);
    }
    if (audio.ctx.state === 'suspended') audio.ctx.resume();
    return audio.ctx;
  }
  /* the node a sound plugs into for a given bus (null until the first gesture) */
  const outOf = bus => { if (!ac()) return null; return bus === 'music' ? audio.nodes.duck : audio.nodes[bus] || audio.nodes.sfx; };
  const mixTell = () => audio.hear.slice().forEach(f => { try { f(); } catch (e) { console.error(e); } });
  let mixSaveable = false;                                             // Core.boot turns this on: only the save owner writes preferences
  function saveMix() { if (!mixSaveable) return; try { localStorage.setItem(MIX_KEY, JSON.stringify(mix)); localStorage.removeItem('imi-sound'); } catch { /* storage blocked */ } }
  function setLevel(bus, v) {
    if (!BUSES.includes(bus)) return;
    mix[bus] = lvl(v, mix[bus]);
    if (bus === 'master' && mix.master > 0) mix.prev = mix.master;
    applyMix(); saveMix(); mixTell(); music.reconcile();
  }
  function setMuted(on) {
    if (on === (mix.master === 0)) return;
    if (on) { mix.prev = mix.master || mix.prev; mix.master = 0; } else mix.master = mix.prev || 1;
    applyMix(); saveMix(); mixTell(); music.reconcile();
  }

  function tone(f0, dur, { type = 'sine', vol = 0.16, f1 = f0, delay = 0, vibrato = 0 } = {}) {
    if (!audible('sfx')) return; const c = ac(); if (!c) return;
    const t = c.currentTime + delay, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    if (vibrato) { const l = c.createOscillator(), lg = c.createGain(); l.frequency.value = 28; lg.gain.value = vibrato; l.connect(lg).connect(o.frequency); l.start(t); l.stop(t + dur); }
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(audio.nodes.sfx); o.start(t); o.stop(t + dur + 0.02);
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
    if (!audible('sfx')) return; const c = ac(); if (!c) return;
    const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(), t = c.currentTime + delay;
    s.buffer = noiseBuf(c, dur); f.type = 'bandpass'; f.frequency.value = freq; g.gain.value = vol;
    s.connect(f).connect(g).connect(audio.nodes.sfx); s.start(t);
  }
  /* pixel gets chiptune squares */
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
      /* the dopamine set: every one climbs, snaps or sparkles so a win never sounds like the last one */
      levelup() { [659, 784, 988, 1319].forEach((f, i) => tone(f, .11, { type: lead, delay: i * .055, vol: .05 })); },
      gem(k = 0) { const sc = [0, 2, 4, 7, 9], f = 880 * Math.pow(2, (sc[k % 5] + 12 * Math.min(2, Math.floor(k / 5))) / 12); tone(f, .1, { type: lead, vol: .04 }); tone(f * 2, .12, { delay: .03, vol: .02 }); },
      streak(n = 2) { const f = 523.25 * Math.pow(2, Math.min(n, 15) / 12); tone(f, .09, { type: lead, vol: .06 }); tone(f * 1.5, .16, { type: lead, delay: .06, vol: .05 }); },
      crit()    { tone(1568, .06, { type: 'square', f1: 3136, vol: .05 }); noise(.05, { freq: 5200, vol: .1 }); tone(2093, .14, { type: lead, delay: .05, vol: .04 }); },
      hammer()  { noise(.05, { freq: 2400, vol: .22 }); tone(190, .12, { type: 'square', f1: 90, vol: .13 }); tone(1480, .22, { type: 'triangle', delay: .03, vol: .035 }); },
      attach()  { tone(660, .05, { type: 'square', vol: .05 }); tone(990, .09, { type: 'square', delay: .05, vol: .045 }); },
      bell()    { tone(1319, .55, { type: 'triangle', vol: .06 }); tone(1760, .6, { type: 'triangle', delay: .09, vol: .04 }); tone(2217, .45, { type: 'triangle', delay: .18, vol: .025 }); },
      page()    { noise(.14, { freq: 3200, vol: .09 }); noise(.08, { freq: 1800, vol: .05, delay: .06 }); },
      whoosh()  { noise(.28, { freq: 1300, vol: .09 }); tone(220, .28, { f1: 1100, vol: .035 }); },
      stamp()   { noise(.1, { freq: 300, vol: .4 }); tone(110, .22, { type: 'square', f1: 45, vol: .22 }); },
      jackpot() { [523, 659, 784, 1047, 1319, 1568, 2093].forEach((f, i) => tone(f, .28, { type: lead, delay: i * .07, vol: .065 })); [262, 392, 523, 659].forEach(f => tone(f, 1.6, { type: 'triangle', delay: .5, vol: .06 })); noise(.5, { freq: 6000, vol: .12, delay: .45 }); for (let i = 0; i < 8; i++) tone(1760 + Math.random() * 900, .06, { delay: .9 + i * .07, vol: .03 }); },
    };
  }

  /* =====================  MUSIC (procedural chiptune loops)  =====================
     The look-ahead scheduler pattern from monkey-assets/audio/music.js: a setInterval wakes ~11x a second and schedules every note that
     falls in the next 0.4 s on the audio clock, so the loop never drifts or stutters when the main thread is busy.
     Tracks:  title (warm, jaunty, typewriter percussion, a bell), floor (sparse and gentle, for hours: it leans on the sky), story (a cutscene underscore).
     Each track plays through its own gain into the music bus, so changing track is a crossfade. */
  const mf = n => 440 * Math.pow(2, (n - 69) / 12);
  const XFADE = 1.6;
  function mv(out, t, n, dur, { type = 'triangle', vol = .08, a = .01 } = {}) {         // one note at absolute time t; n is a MIDI number
    const c = audio.ctx, o = c.createOscillator(), g = c.createGain(), f = mf(n);
    o.type = type; o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + a); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    o.connect(g).connect(out); o.start(t); o.stop(t + dur + .05);
  }
  function mn(out, t, dur, { vol = .06, freq = 2600, q = 1.2 } = {}) {                  // a short filtered burst of noise: the typewriter's clack
    const c = audio.ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = noiseBuf(c, dur); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q; g.gain.value = vol;
    s.connect(f).connect(g).connect(out); s.start(t);
  }
  const bell = (out, t, n, vol = .05) => { mv(out, t, n, 1.1, { vol, a: .004 }); mv(out, t, n + 12.4, .6, { type: 'sine', vol: vol * .35, a: .004 }); };

  const CH = { C: { r: 0, t: [0, 4, 7, 11] }, Am: { r: -3, t: [-3, 0, 4, 7] }, F: { r: -7, t: [-7, -3, 0, 4] }, G: { r: -5, t: [-5, -1, 2, 5] }, Em: { r: -8, t: [-8, -5, -1, 2] } };
  /* melody lines in semitones above C5, eight eighth-notes a bar, null = rest */
  const TITLE_PROG = ['C', 'Am', 'F', 'G', 'C', 'F', 'G', 'C'];
  const TITLE_MEL = [
    [[4, null, 7, null, 12, null, 7, 4], [9, null, 7, null, 4, null, 0, null], [5, null, 9, null, 12, null, 9, 5], [7, null, 2, null, 7, null, null, null],
     [4, 7, 12, null, 11, null, 7, null], [9, null, 12, null, 9, 5, null, null], [7, null, 11, null, 14, null, 11, 7], [12, null, null, null, null, null, null, null]],
    [[12, null, 11, 12, 14, null, 12, null], [9, null, 12, 9, 7, null, 4, null], [5, 9, 12, null, 17, null, 12, 9], [14, null, 11, null, 7, null, 2, null],
     [4, null, 7, 12, null, 7, 4, null], [5, null, 9, null, 12, null, 9, null], [7, 11, 14, null, 17, null, 14, 11], [12, null, 7, null, 4, null, 0, null]]
  ];
  const TRACKS = {
    /* warm and jaunty: oom-pah bass and chords, a square-wave tune with a triangle shadow, typewriter clacks for drums, a bell at the carriage return. 108 bpm, 16 bars */
    title: {
      level: 3.2, sp: 60 / 108 / 2,
      step(i, t, out) {
        const sp = this.sp, bar = Math.floor(i / 8) % 16, s = i % 8, ch = CH[TITLE_PROG[bar % 8]];
        if (s === 0) mv(out, t, 48 + ch.r, sp * 3.2, { vol: .24 });
        if (s === 4) mv(out, t, 48 + ch.r + 7, sp * 2.4, { vol: .16 });
        if (s === 2 || s === 6) for (const k of ch.t.slice(0, 3)) mv(out, t, 60 + k, sp * .8, { type: 'square', vol: .028, a: .006 });
        const m = TITLE_MEL[bar < 8 ? 0 : 1][bar % 8][s];
        if (m != null) { mv(out, t, 72 + m, sp * 1.7, { type: 'square', vol: .05, a: .006 }); mv(out, t, 60 + m, sp * 1.7, { vol: .06, a: .01 }); }
        if (s === 2 || s === 6) mn(out, t, .035, { vol: .09, freq: 2600 });                // the clack on the backbeat
        else if (s % 2 && Math.random() < .75) mn(out, t, .02, { vol: .022, freq: 3400 + Math.random() * 900 });   // fingers on the keys in between
        if (s === 0 || s === 4) mn(out, t, .06, { vol: .08, freq: 700, q: .8 });          // the space-bar thunk on the downbeat
        if (bar % 8 === 7 && s === 5) mn(out, t, .28, { vol: .05, freq: 1500, q: .6 });   // the carriage slides back...
        if (bar % 8 === 7 && s === 7) bell(out, t, 91, bar === 15 ? .07 : .05);           // ...ding
        if (bar % 4 === 1 && s === 7) bell(out, t, 98, .03);
        return sp;
      }
    },
    /* the Floor: a pad and a root note under sparse random plucks that echo. Every fourth bar has no plucks at all, and the key drifts every 16 bars so it never
       becomes wallpaper. Night: slower, a darker chord cycle and lower notes. Rain: shorter, higher drips. */
    floor: {
      level: 3, sp: 60 / 72 / 2,
      step(i, t, out, st) {
        const bar = Math.floor(i / 8), s = i % 8;
        if (s === 0 || !st.sky) { try { const a = window.World ? World.at(Date.now()) : null; st.sky = { night: !!(a && a.night), wx: a ? a.wx : 0 }; } catch { st.sky = { night: false, wx: 0 }; } }
        const { night, wx } = st.sky, rain = wx >= 1, sp = night ? 60 / 58 / 2 : rain ? 60 / 66 / 2 : this.sp;
        const prog = night ? ['Am', 'F', 'C', 'Em'] : ['C', 'Am', 'F', 'G'], ch = CH[prog[bar % 4]];
        const key = [0, 5, 7, 0][Math.floor(bar / 16) % 4], root = key + ch.r;
        if (s === 0) {
          for (const k of ch.t.slice(0, 3)) mv(out, t, 60 + key + k, sp * 8.6, { type: 'sine', vol: night ? .045 : .05, a: sp * 2.4 });   // the pad
          if (bar % 2 === 0) mv(out, t, 48 + root, sp * 5, { vol: .17, a: .03 });                                                       // a low root every other bar
        }
        if (bar % 4 !== 3 && s !== 0) {
          const p = night ? .13 : rain ? .26 : .2;
          if (Math.random() < p) {
            const pool = [...ch.t, ch.t[0] + 14], oct = night ? 60 : rain ? 84 : 72;
            const n = oct + key + pool[Math.floor(Math.random() * pool.length)], d = rain ? sp * 1.4 : sp * 3;
            mv(out, t, n, d, { vol: rain ? .05 : .06, a: .005 });
            mv(out, t + sp * .75, n, d * .8, { vol: .028, a: .005 }); mv(out, t + sp * 1.5, n, d * .6, { vol: .014, a: .005 });         // the echo
          }
          if (Math.random() < .05) mn(out, t, .02, { vol: .012, freq: 3000 });                                                             // a far-off key
        }
        return sp;
      }
    },
    /* a cutscene underscore: held chords, a music-box arpeggio, two bells. 80 bpm, 8 bars. */
    story: {
      level: 3, sp: 60 / 80 / 2,
      step(i, t, out) {
        const sp = this.sp, bar = Math.floor(i / 8) % 8, s = i % 8, ch = CH[['C', 'Am', 'F', 'C', 'F', 'Am', 'G', 'G'][bar]];
        if (s === 0) { for (const k of ch.t.slice(0, 3)) mv(out, t, 60 + k, sp * 8.4, { type: 'sine', vol: .05, a: sp * 1.6 }); mv(out, t, 48 + ch.r, sp * 4, { vol: .17 }); }
        if (s === 4) mv(out, t, 48 + ch.r + 7, sp * 3, { vol: .09 });
        if (s % 2 === 0) { const n = 72 + ch.t[[0, 1, 2, 1][s / 2]]; mv(out, t, n, sp * 3, { vol: .05, a: .005 }); mv(out, t, n + 12, sp * 1.2, { type: 'sine', vol: .018, a: .005 }); }
        if (s === 4) mn(out, t, .02, { vol: .02, freq: 3000 });
        if ((bar === 3 || bar === 7) && s === 6) bell(out, t, 91, .04);
        return sp;
      }
    }
  };

  const music = (() => {
    let want = null, cur = null, screenTrack = null, held = false;
    function startTrack(id) {
      const c = ac(), def = TRACKS[id]; if (!c || !def) return null;
      const out = c.createGain(), now = c.currentTime;
      out.gain.setValueAtTime(0, now); out.gain.linearRampToValueAtTime(def.level, now + XFADE); out.connect(audio.nodes.duck);
      const inst = { id, out, i: 0, next: 0, st: {}, timer: 0 };
      const pump = () => {
        if (document.hidden) { inst.next = 0; return; }                                // timers crawl in a background tab: stop scheduling, restart cleanly on return
        const nowT = c.currentTime;
        if (!inst.next || inst.next < nowT - .25) inst.next = nowT + .06;
        while (inst.next < nowT + .4) inst.next += def.step(inst.i++, inst.next, out, inst.st);
      };
      inst.timer = setInterval(pump, 90); pump();
      return inst;
    }
    function stopTrack(inst, fade = XFADE) {
      clearInterval(inst.timer);
      const c = audio.ctx; if (!c) return;
      try { inst.out.gain.cancelScheduledValues(c.currentTime); inst.out.gain.setValueAtTime(inst.out.gain.value, c.currentTime); inst.out.gain.linearRampToValueAtTime(0, c.currentTime + fade); } catch { /* already gone */ }
      setTimeout(() => { try { inst.out.disconnect(); } catch { /* already gone */ } }, (fade + 1.2) * 1000);   // the last scheduled notes ring out silently
    }
    /* make the world match what was asked for: the wanted track plays if the music can be heard and a gesture has unlocked the speakers */
    function reconcile() {
      const go = !held && want && TRACKS[want] && audible('music') && ac();
      if (go) { if (!cur || cur.id !== want) { if (cur) stopTrack(cur); cur = startTrack(want); } }
      else if (cur) { stopTrack(cur, .4); cur = null; }
    }
    const api = {
      reconcile,
      play(id) { if (!TRACKS[id]) return; want = id; reconcile(); },
      stop() { if (want === 'story' && screenTrack) { api.play(screenTrack); return; } want = null; reconcile(); },      // ending a cutscene hands the screen's tune back
      duck(on) { audio.duck = !!on; applyMix(); },
      hold(on) { held = !!on; reconcile(); },                                              // the title's press-any-key gate: the tune is wanted but waits for the press
      current: () => (cur ? cur.id : null),
      wanted: () => want,
      tracks: Object.keys(TRACKS),
      /* the screens set the background track; a cutscene borrows it with play('story') and calls restore() to hand it back */
      setScreen(id) { screenTrack = id; if (want !== 'story') api.play(id); },
      restore() { if (screenTrack) api.play(screenTrack); else api.stop(); },
    };
    return api;
  })();
  /* the first gesture unlocks the speakers: create the context and start whatever the screen asked for */
  const unlockEvents = ['pointerdown', 'keydown', 'touchend', 'click'];
  function unlockAudio() {
    audio.activated = true;
    if (!ac()) return;
    music.reconcile();
    if (audio.ctx.state === 'running') unlockEvents.forEach(e => removeEventListener(e, unlockAudio, true));
  }
  unlockEvents.forEach(e => addEventListener(e, unlockAudio, true));

  /* =====================  BOOT  ===================== */
  function boot(art) {
    if (window.VaultSaveGate?.blocked) throw new Error('Vault save blocked');
    const writer = window.Rewards?.enabled ? window.Rewards : null;
    if (writer && !writer.owns()) throw new Error('Core boot requires save ownership');
    const { setTimeout, clearTimeout, setInterval, requestAnimationFrame } = writer ? writer.timers : window;
    const canWrite = () => !writer || writer.owns();
    const px = art.edition === 'pixel', sfx = makeSfx(px);

    /* ---------- the mixer: preferences are saved from here on, and any [data-sound] toy is a quick mute ---------- */
    mixSaveable = true; if (audio.migrated) saveMix();
    try { localStorage.removeItem('imi-style'); } catch { /* the retired art-style preference; storage blocked */ }
    const soundBtns = [...document.querySelectorAll('[data-sound]')];
    const paintSound = () => soundBtns.forEach(b => { const on = mix.master > 0; b.setAttribute('aria-pressed', String(on)); art.paintSound(b, on); });
    audio.hear.push(paintSound); paintSound();
    soundBtns.forEach(b => b.addEventListener('click', () => {
      setMuted(mix.master > 0); restart(b, 'hit'); if (mix.master > 0) sfx.drum();
    }));

    /* ---------- the banana counter ---------- */
    const hud = $('#hud'), scoreEl = $('#score');
    let score = Economy.loadScore();
    let shown = score, tweening = false, saveT = 0;
    const inGame = () => html.dataset.screen === 'game';
    const flushAcknowledged = () => { clearTimeout(saveT); saveT = 0; return canWrite() && !IMI.ops?.extensions?.state().meta.automation?.media?.pending && !IMI.ops?.extensions?.state().meta.estate?.pending && !IMI.ops?.extensions?.state().meta.automation?.print?.pending ? Economy.saveScoreAcknowledged(score) : { ok: false, error: 'Not the save owner' }; };
    const persist = () => { if (writer?.localDisposition()) { clearTimeout(saveT); saveT = 0; return {ok:false,error:'Historical boundary owns the wallet'}; } if (writer) return IMI.ops && !IMI.ops.progression.running() ? { ok: false, error: 'Progression paused' } : flushAcknowledged(); clearTimeout(saveT); saveT = 0; Economy.saveScore(score); };
    if (writer) writer.onPagehide(persist);
    addEventListener('pagehide', persist);
    document.addEventListener('visibilitychange', () => { if (document.hidden) persist(); });
    scoreEl.textContent = fmtHud(score);
    const watchers = [];
    function tweenScore() {                                  // the counter rolls toward the real total
      const d = score - shown;
      if (!(Math.abs(d) > Math.max(1, Math.abs(score) * Number.EPSILON * 4))) { shown = score; scoreEl.textContent = fmtHud(shown); tweening = false; return; }
      shown += d * 0.16 + Math.sign(d); scoreEl.textContent = fmtHud(shown); requestAnimationFrame(tweenScore);
    }
    function paintScore(bump, event) {
      if (!saveT) saveT = setTimeout(persist, 1500);
      hud.title = 'Bananas: ' + exact(score);
      hud.setAttribute('aria-label', 'Bananas: ' + exact(score));
      if (reduceMotion || !inGame()) { shown = score; scoreEl.textContent = fmtHud(score); } else if (!tweening) { tweening = true; requestAnimationFrame(tweenScore); }
      if (bump && inGame()) restart(hud, 'bump');
      watchers.forEach(f => { if (event) f(score, event); else f(score); });
    }
    /* a "+n" with a banana flies from `from` into the counter, then the total changes */
    function earn(n, from) {
      if (!canWrite() || (writer && !IMI.ops?.progression.running())) return false;
      if (writer && !Economy.saveScoreAcknowledged(score + n).ok) return false;
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
      if (!canWrite() || (writer && IMI.ops && !IMI.ops.progression.running())) return false;
      if (writer && n <= score && !Economy.saveScoreAcknowledged(score - n).ok) return false;
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
    screenFns.push(next => music.setScreen(next === 'game' ? 'floor' : 'title'));          // the title tune on the menu, the Floor tune in the game (nothing sounds before the first tap)
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
      if (!canWrite() || (writer && !IMI.ops?.progression.running())) return;
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
    /* ---------- settings panel ----------
       One panel, opened by the gear on the game rail or the gear on the title screen (or IMI.settings.open()). Four groups: Audio (the mixer),
       Display & effects, Help & story, Account & data. It scrolls inside itself, closes on Esc or a click outside, and hands focus back to whatever opened it. */
    let vaultSettings = null, paintVaultSettings = () => {};
    const settings = { registerVault: row => { if (vaultSettings) throw Error('Vault Settings already registered'); vaultSettings = row; paintVaultSettings(); }, open() {}, close() {}, isOpen: () => false };
    const setBtn = $('#settingsBtn'), menuGear = $('#menuSettings');
    if (setBtn || menuGear) {
      const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
      const pop = document.createElement('div'); pop.className = 'set-pop'; pop.hidden = true; pop.id = 'settingsPop'; pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-label', 'Settings'); pop.tabIndex = -1;
      const row = (label, body, attrs = '') => `<div class="set-row"${attrs}><span class="set-lab">${label}</span>${body}</div>`;
      const BUS_NAME = { master: 'Master', music: 'Music', sfx: 'Effects', ambient: 'Ambience' };
      const BUS_TIP = { master: 'Everything', music: 'The title and Floor tunes', sfx: 'Typing, coins and dings', ambient: 'Rain and thunder' };
      const slider = b => `<label class="set-slide" title="${BUS_TIP[b]}"><span class="set-lab">${BUS_NAME[b]}</span><output class="set-val" data-val="${b}">0%</output><input type="range" min="0" max="100" step="1" data-bus="${b}" aria-label="${BUS_NAME[b]} volume"></label>`;
      const FX_TIP = 'Max adds glow, extra particles, trails and screen shake for fast machines. Low turns off looping decoration and trims particles so the game runs smoother. Auto switches to Low on weak phones or when the game cannot hold its frame rate; it never picks Max.';
      pop.innerHTML = `<div class="set-head"><b class="set-title">Settings</b><button type="button" class="set-x" data-set="close" aria-label="Close settings">X</button></div>`
        + `<div class="set-body">`
        + `<section class="set-grp" aria-labelledby="setH1"><h3 class="set-h" id="setH1">Audio</h3>${BUSES.map(slider).join('')}`
        +   `<div class="set-row"><span class="set-lab">Mute all</span><button type="button" class="set-btn" data-set="mute" aria-pressed="false">Mute</button></div></section>`
        + `<section class="set-grp" aria-labelledby="setH2"><h3 class="set-h" id="setH2">Display &amp; effects</h3>`
        +   `<div class="set-row stack" title="${FX_TIP}"><span class="set-lab">Effects</span><span class="set-seg">${['auto', 'max', 'high', 'low'].map(m => `<button type="button" data-fx="${m}" aria-pressed="false">${m[0].toUpperCase() + m.slice(1)}</button>`).join('')}</span></div></section>`
        + `<section class="set-grp" aria-labelledby="setH3"><h3 class="set-h" id="setH3">Help &amp; story</h3>`
        +   row('Tutorial', '<button type="button" class="set-btn" data-set="tour">Replay</button>', ' data-tour hidden')
        +   row('Tips', '<button type="button" class="set-btn" data-set="tips"></button>', ' data-tour hidden')
        +   row('Story auto-play', '<button type="button" class="set-btn" data-set="story-auto"></button>', ' data-story hidden')
        +   '<div class="set-scenes" data-story hidden></div></section>'
        + `<section class="set-grp" aria-labelledby="setH4"><h3 class="set-h" id="setH4">Account &amp; data</h3>`
        +   row('Cloud sync', '<button type="button" class="set-btn" data-set="cloud"></button>', ' data-cloud hidden')
        +   '<div data-vault></div>'
        +   row('Game', '<button type="button" class="set-btn" data-set="reset">Reset</button>') + '</section>'
        + `</div>`;
      document.body.appendChild(pop);
      const vaultHost = $('[data-vault]', pop);
      paintVaultSettings = () => { vaultHost.innerHTML = vaultSettings?.render() || ''; };
      const sliders = [...pop.querySelectorAll('input[data-bus]')], muteBtn = $('[data-set="mute"]', pop);
      const paintAudio = () => {
        for (const inp of sliders) {
          const v = Math.round(mix[inp.dataset.bus] * 100); inp.value = v; inp.style.setProperty('--v', v + '%'); inp.setAttribute('aria-valuetext', v + ' percent');
          $(`[data-val="${inp.dataset.bus}"]`, pop).textContent = v + '%';
        }
        const muted = mix.master === 0; muteBtn.textContent = muted ? 'Muted' : 'Mute'; muteBtn.setAttribute('aria-pressed', String(muted));
      };
      audio.hear.push(paintAudio); paintAudio();
      const tipsOpt = $('[data-set="tips"]', pop);
      const paintTour = () => { const t = window.IMI && IMI.tour; pop.querySelectorAll('[data-tour]').forEach(r => { r.hidden = !t; }); if (t) { tipsOpt.textContent = t.tipsOn() ? 'On' : 'Off'; tipsOpt.setAttribute('aria-pressed', String(t.tipsOn())); } };   // tour.js loads after this, so look it up when the panel opens
      const storyAuto = $('[data-set="story-auto"]', pop), sceneBox = $('.set-scenes', pop);
      const paintStory = () => {                                // story.js loads after this too: the rows only show once IMI.story exists
        const st = window.IMI && IMI.story; pop.querySelectorAll('[data-story]').forEach(r => { r.hidden = !st; });
        if (!st) return;
        storyAuto.textContent = st.isOn() ? 'On' : 'Off'; storyAuto.setAttribute('aria-pressed', String(st.isOn()));
        const seen = (st.list() || []).filter(x => x.seen && x.ready), chap = x => (x.chapter === 0 ? 'Prologue' : 'Ch. ' + x.chapter) + ': ' + x.title;   // the same list, in the same words, as the title screen's STORY panel (app.js)
        sceneBox.innerHTML = seen.length ? '<p class="set-note">Scenes you have seen. Replay any of them.</p>' + seen.map(x => row(esc(chap(x)), `<button type="button" class="set-btn" data-replay="${esc(x.id)}" aria-label="Replay ${esc(chap(x))}">Replay</button>`)).join('') : '<p class="set-note">Scenes you have seen will wait here to be replayed.</p>';
      };
      const cloudRow = $('[data-cloud]', pop), cloudOpt = $('[data-set="cloud"]', pop), CLOUD = { local: 'Sign in', syncing: 'Syncing', synced: 'Synced', offline: 'Offline', error: 'Retry' };
      const paintCloud = () => { const s = window.MonkeyCloud ? MonkeyCloud.status() : 'off'; cloudRow.hidden = s === 'off'; cloudOpt.textContent = CLOUD[s] || 'Open'; };   // Monkey Cloud (cloud-sync.js): the row only shows once a cloud config ships

      let openFrom = null;
      const gears = [setBtn, menuGear].filter(Boolean);
      const isOpen = () => !pop.hidden;
      const focusable = el => el && el.isConnected && el.getClientRects().length ? el : null;
      function open(from) {
        const onTitle = html.dataset.screen === 'menu';
        openFrom = from || (onTitle ? menuGear : setBtn) || document.activeElement;
        pop.classList.toggle('on-title', onTitle);
        paintAudio(); paintTour(); paintStory(); paintCloud(); paintFx(); paintVaultSettings();
        pop.hidden = false; pop.scrollTop = 0; pop.querySelector('.set-body').scrollTop = 0;
        gears.forEach(g => g.setAttribute('aria-expanded', 'true'));
        (sliders[0] || pop).focus({ preventScroll: true });
      }
      function close(refocus) {
        if (pop.hidden) return;
        pop.hidden = true; gears.forEach(g => g.setAttribute('aria-expanded', 'false'));
        if (refocus) (focusable(openFrom) || focusable($('#railToggle')) || document.body).focus?.();
        openFrom = null;
      }
      Object.assign(settings, { open: from => { if (!isOpen()) open(from && from.nodeType === 1 ? from : null); }, close: () => close(true), isOpen });
      gears.forEach(g => g.addEventListener('click', e => { e.stopPropagation(); sfx.tick(); if (isOpen()) close(true); else open(g); }));

      pop.addEventListener('input', e => {
        const inp = e.target.closest('input[data-bus]'); if (!inp) return;
        const v = +inp.value; inp.style.setProperty('--v', v + '%'); setLevel(inp.dataset.bus, v / 100);
        $(`[data-val="${inp.dataset.bus}"]`, pop).textContent = v + '%'; inp.setAttribute('aria-valuetext', v + ' percent'); paintSound();
      });
      pop.addEventListener('change', e => {                                  // let go of a slider: a blip so you can judge the level
        const b = e.target.closest('input[data-bus]')?.dataset.bus;
        if (b === 'sfx' || b === 'master') sfx.coin();
      });
      pop.addEventListener('click', e => {
        const b = e.target.closest('button'); if (!b) return;
        if (b.dataset.fx) { setFx(b.dataset.fx); return; }
        if (b.dataset.replay) { close(true); window.IMI?.story?.play(b.dataset.replay, { replay: true }); return; }   // focus goes back to the gear first, so the scene hands it back there
        const act = b.dataset.set;
        if (act === 'close') { close(true); return; }
        if (act?.startsWith('lamp-') && vaultSettings) { close(); vaultSettings.action(act); paintVaultSettings(); return; }
        if (act === 'mute') { setMuted(mix.master > 0); if (mix.master > 0) sfx.drum(); return; }
        if (act === 'tips') { IMI.tour.tipsOn(!IMI.tour.tipsOn()); paintTour(); return; }
        if (act === 'story-auto') { IMI.story.on(!IMI.story.isOn()); paintStory(); return; }
        close(act === 'cloud');
        if (act === 'reset') IMI.ops && IMI.ops.reset();
        else if (act === 'tour') IMI.tour.replay();
        else if (act === 'cloud') { (focusable(setBtn) || focusable($('#railToggle')) || setBtn || menuGear).focus(); window.MonkeyCloud?.openPanel(); }   // the panel hands focus back to whatever had it when it opened: on phones the gear sits in the closed rail, so its toggle
      });
      document.addEventListener('click', e => { if (isOpen() && !pop.contains(e.target)) close(false); });
      addEventListener('keydown', e => { if (e.key === 'Escape' && isOpen()) { e.stopImmediatePropagation(); e.preventDefault(); close(true); } }, true);
      screenFns.push(() => close(false));
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
    const emit = (n, d) => { if (!canWrite()) return; (bus[n] || []).slice().forEach(f => { try { f(d); } catch (e) { console.error(e); } }); };

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
      on, off, emit, settings,
      audio: { buses: BUSES.slice(), get: b => (BUSES.includes(b) ? mix[b] : 0), set: setLevel, muted: () => mix.master === 0, mute: on => setMuted(on === undefined ? mix.master > 0 : !!on), ctx: ac, out: outOf, hear: f => { audio.hear.push(f); } },
      music: { play: id => music.play(id), stop: () => music.stop(), duck: on => music.duck(on), hold: on => music.hold(on), restore: () => music.restore(), current: music.current, wanted: music.wanted, tracks: music.tracks },
      edition: art.edition, reduceMotion, sfx, centerOf, fmt, fmtRate, exact, say, banner, heroSay: art.heroSay,
      fx, setFx, bananaEl: art.bananaEl, forecastText,
      burst: (x, y, names, n = 12) => art.burst(x, y, names, fx.low ? Math.max(2, Math.ceil(n / 3)) : fx.max ? Math.round(n * 1.6) : n),     // Low: a third of the particles, Max: more
      fall: (x, y, name, life) => { if (fx.low && Math.random() < .5) return; art.fall(x, y, name, life); },
      bananas: { get: () => score, add: n => { if (!canWrite() || (writer && IMI.ops && !IMI.ops.progression.running())) return false; if (writer && !Economy.saveScoreAcknowledged(score + n).ok) return false; score += n; paintScore(false); }, spend, earn, watch: f => watchers.push(f),
        ...(writer ? { saveAcknowledged: flushAcknowledged, acknowledgement: Economy.walletAcknowledgement,
          resetAcknowledged() {
            if (!canWrite() || !IMI.ops?.progression.running()) return { ok:false, error:'Progression paused' };
            const result = Economy.saveScoreAcknowledged(0, null);
            if (result.ok) { clearTimeout(saveT); saveT = 0; score = 0; paintScore(false); }
            return result;
          },
          debitMediaAcknowledged(id) {
            const intent = canWrite() && writer.mediaWallet(id);
            if (!intent || ![intent.balance,intent.after].includes(score)) return {ok:false,error:'No exact owned media debit'};
            const result = Economy.saveScoreAcknowledged(intent.after);
            if (result.ok) { clearTimeout(saveT); saveT = 0; score = intent.after; paintScore(false); }
            return result;
          },
          replacePrintingAcknowledged(id) {
            const intent = canWrite() && writer.printingWallet(id);
            if (!intent || ![intent.balance,intent.seed].includes(score)) return {ok:false,status:'refused',error:'No exact owned Printing replacement'};
            const result = Economy.saveScoreAcknowledged(intent.seed);
            if (!result.ok) return {...result,status:'held'};
            clearTimeout(saveT); saveT = 0; score = intent.seed; paintScore(false,{reward:id});
            return {ok:true,status:'acknowledged',id};
          },
          replaceEstateAcknowledged(id) {
            const intent = canWrite() && writer.estateWallet(id);
            if (!intent || ![intent.balance,intent.seed].includes(score)) return {ok:false,error:'No exact owned Estate replacement'};
            if (score === intent.seed) return {ok:true,duplicate:true};
            const result = Economy.saveScoreAcknowledged(intent.seed);
            if (result.ok) { clearTimeout(saveT); saveT = 0; score = intent.seed; paintScore(false, {reward:id}); }
            return result;
          },
          replaceImprintAcknowledged(id) {
            const intent = canWrite() && writer.layerWallet(id);
            if (!intent) return {ok:false, error:'No owned Imprint wallet intent'};
            // Exact replacement is replayable while the prepared reset holds progression.
            // Preserve rewardMarker and all wallet metadata through Economy's default marker.
            const result = Economy.saveScoreAcknowledged(intent.seed);
            if (result.ok) { clearTimeout(saveT); saveT = 0; score = intent.seed; paintScore(false, {reward:id}); }
            return result;
          },
          creditReward({ id, sequence, previous, amount } = {}) {
            if (!canWrite()) return { ok: false, error: 'Not the save owner' };
            const result = Economy.creditReward(score, { id, sequence, previous, amount });
            if (!result.ok) return result;
            if (!result.duplicate) { clearTimeout(saveT); saveT = 0; score = result.score; paintScore(false, { reward:id }); }
            return { ok:true, duplicate:result.duplicate, marker:result.marker };
          }
        } : {}) },
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
