/* ============================================================
   REPAIR KIT: the shared frame for IMI's floor-problem repairs, WarioWare-style microgames (8-20 s; the rare big ones 40-45 s).
   repair.html?game=<id> loads this after mg-core.js (with data-runner) and injects repairs/<id>.js. A repair is one IIFE:
     const R = MGRepair.setup({ id, title, verb, how, seconds, W, H, scoreIcon, padY });
     ...state + update + draw...
     R.run({ reset, update, draw, grade, stats, bot, down, move, up, key });
   setup() does the boilerplate (boot, stage, HUD without hearts, fx, the time bar, the shell in one-shot graded mode, the VERB slam);
   run() starts it. The grade (0..1) drives the verdict: MG.verdictOf / MG.VERDICT_AT. See REPAIRS.md for the walk-through.
   URL: game, level 0..1 (.3), desk 0..5, look, hat, seed, bot=1, warp=N, extra=N (Steady hands seconds), plus the hosted-bridge params.
   ============================================================ */
(() => {
  'use strict';
  const { clamp, lerp, sfx, h } = MG;
  const Q = new URLSearchParams(location.search);
  const num = (k, d, a, b) => { const v = Q.get(k); return v == null || v === '' || !Number.isFinite(+v) ? d : clamp(+v, a, b); };
  const flag = k => { const v = Q.get(k); return v != null && v !== '' && v !== '0' && v !== 'false'; };

  /* ---------- the default stage, in game units ----------
     Measured in IMI's hosted overlay well (.mg01-well, the iframe's box) on the real Floor; hosted fit = floor(min((w-10)/(W+8), (h-10)/(H+8))*3)/3 px per unit:
       desktop 1280x800  well 734x600  -> 3.33 px/unit, stage 400x533     desktop 1440x900  well 762x700 -> 4.00, 480x640
       phone 390x844     well 310x625  -> 2.33 px/unit, stage 280x373     phone 360x740     well 280x521 -> 2.00, 240x320
       tablet 1024x768   well 478x568  -> 3.00 px/unit, stage 360x480     landscape 844x390 well 756x290 -> 1.67, 200x267
     120 wide is the most a 390 px phone fits at 2.33 px/unit (128 drops it to 2.00, 144 to 1.67); 160 high is the most 1280x800 fits at 3.33
     (176 drops it to 3.00, 200 to 2.67). Landscape stages read badly on phones. Repairs may override W/H in LIST and setup(). */
  const STAGE = Object.freeze({ W: 120, H: 160 });

  /* ---------- the six machines (ops.js DESKS / pixel.js d* ramps): [shadow, base, light] ---------- */
  const DESKS = Object.freeze([
    { name: 'Bamboo Classic', short: 'Bamboo', ramp: ['#2f8a5a', '#78d9a0', '#c4f4d4'] },
    { name: 'Hibiscus Ribbon', short: 'Hibiscus', ramp: ['#a8456a', '#f08aa4', '#ffd0dc'] },
    { name: 'Lagoon Sprint', short: 'Lagoon', ramp: ['#2c62a8', '#5fa8f0', '#bfe0ff'] },
    { name: 'Honeycomb Ledger', short: 'Honeycomb', ramp: ['#a8681a', '#f2b23a', '#ffe28a'] },
    { name: 'Orchid Imperial', short: 'Orchid', ramp: ['#6a48a8', '#b58cf0', '#e4d4ff'] },
    { name: 'Moonflower Grand', short: 'Moonflower', ramp: ['#7a80a0', '#dfe3f2', '#ffffff'] },
  ].map(d => Object.freeze(d)));
  const deskIx = i => clamp(Math.round(+i) || 0, 0, DESKS.length - 1);
  const deskColour = i => DESKS[deskIx(i)].ramp[1];
  const deskRamp = i => DESKS[deskIx(i)].ramp;
  /* the desk ramps join MGArt's ramp table (append-only), so MGArt3.make sprites can be painted in a desk colour: px.shape(test, deskR(i), part) */
  const DESK_R = DESKS.map((d, i) => { const k = 'desk' + i; if (!MGArt.R[k]) { MGArt.R[k] = MGArt.ramps.length; MGArt.ramps.push(d.ramp.map(MGArt.hex)); } return MGArt.R[k]; });
  const deskR = i => DESK_R[deskIx(i)];

  /* ---------- every repair the runner knows (SPEC 2.4). Economy (family, pay, weights, gates) lives in IMI, not here. ---------- */
  const L = (id, title, verb, seconds, size = 'micro', W = STAGE.W, H = STAGE.H) => Object.freeze({ id, file: 'repairs/' + id + '.js', title, verb, seconds, size, W, H });
  const LIST = Object.freeze([
    L('leak', 'Leak in the ceiling', 'CATCH', 14),
    L('jam', 'Ink jam', 'SCRUB', 10),
    L('keys', 'Banana mush in the keys', 'POP', 10),
    L('carriage', "Carriage won't return", 'SLAM', 8),
    L('ribbon', 'The ribbon is tangled', 'REEL', 12),
    L('overheat', 'Overheating', 'FAN', 10),
    L('nap', 'The keeper nodded off', 'WAKE', 9),
    L('termites', 'Termites in the word drawer', 'SQUISH', 12),
    L('cards', "The keeper's card tray spilled", 'SORT', 15),
    L('slump', 'Titles in a slump', 'SERVE', 15),
    L('typos', 'Typos in the proofs', 'SPOT', 14),
    L('shelf', 'The shelf collapsed', 'SHELVE', 14),
    L('jinx', 'A black cloud', 'BLOW', 9),
    L('raven', 'A raven perched', 'SHOO', 9),
    L('coconut', 'The lucky coconut cracked', 'GLUE', 10),
    L('snack', 'Spoiled snack', 'SORT', 12),
    L('critic', 'Bad review', 'STAMP', 10),
    L('flood', 'Storm flood on the Floor', 'BAIL & PATCH', 45, 'long'),
    L('fuses', 'Lightning blew the fuses', 'LIGHT', 40, 'long'),
    L('tangle', 'The Great Ribbon Tangle', 'UNTANGLE', 40, 'long'),
  ]);
  const byId = Object.freeze(Object.fromEntries(LIST.map(r => [r.id, r])));

  /* ---------- URL params (read once) ---------- */
  const P = Object.freeze({
    id: Q.get('game') || '',
    level: num('level', .3, 0, 1),                     /* difficulty 0..1: tighter timing, more items, faster hazards */
    desk: deskIx(num('desk', 0, 0, 5)),                /* which machine has the problem: tint with deskColour / deskRamp / deskR */
    seed: MG.seed != null ? MG.seed : Math.floor(Math.random() * 4294967296),
    bot: flag('bot'),                                  /* the autoplayer (checks use it) */
    warp: num('warp', 0, 0, 120),                      /* fast-forward N seconds of play once it starts (dev) */
    extra: num('extra', 0, 0, 30),                     /* Steady hands: seconds added to the timer */
  });
  const hash = s => { let x = 2166136261; for (const c of String(s)) x = Math.imul(x ^ c.charCodeAt(0), 16777619); return x >>> 0; };

  /* ---------- the fixer: MGCrew with the typist's look + hat from the URL ---------- */
  const fixer = () => ({ look: MGCrew.look(), hat: MGCrew.hat() });
  function crew(st, x, footY, pose = 'idle', o = {}) { const f = fixer(); MGCrew.draw(st, pose, x, footY, { look: f.look, hat: f.hat, ...o }); }

  /* ---------- typewriter parts, hi-res (3 px per unit, draw with st.hi), cached. Built on MGArt3.make, so they share the kit's outline + bevel. ---------- */
  const { shapes: { ell, box, poly, cap, or } } = MGArt, A = MGArt.R, make = MGArt3.make, { hl, text } = MGArt3;
  const cache = new Map(), memo = (k, fn) => { if (!cache.has(k)) cache.set(k, fn()); return cache.get(k); };
  const parts = {
    /* a round key cap, 13x14 units. o: { face: ramp id (paper), down, mush (banana mush on top), blot (ink blot, no letter) } */
    keycap(ch = 'A', o = {}) {
      const face = o.face || A.paper, dy = o.down ? 3 : 0;
      return memo(['key', ch, face, !!o.down, !!o.mush, !!o.blot].join('|'), () => {
        const cv = make(39, 42, px => {
          if (!o.down) px.shape(ell(19.5, 22.8, 19.5, 18.9), A.woodD, 1);
          px.shape(ell(19.5, 18.6 + dy, 19.5, 18), A.metal, 2);
          px.shape(ell(19.5, 17.4 + dy, 15, 14.4), face, 3);
          if (o.blot) { px.shape(or(ell(18, 18 + dy, 12, 9.9), ell(27.6, 12.6 + dy, 6, 5.4), ell(9, 25.8 + dy, 4.8, 4.2)), A.ink, 4); px.tone(15, 15 + dy, 2); }
          else { px.tone(12, 8 + dy, 2); px.tone(13, 8 + dy, 2); px.tone(11, 9 + dy, 2); }
          if (o.mush) { px.shape(or(ell(20, 9 + dy, 13, 6.5), ell(9, 14 + dy, 5, 4), ell(30, 15 + dy, 4.5, 4.5), ell(25, 21 + dy, 3, 3.4)), A.pine, 5); px.shape(or(ell(15, 9 + dy, 2, 1.6), ell(26, 11 + dy, 1.8, 1.4)), A.rotten, 6); }
        });
        if (!o.blot) text(cv.getContext('2d'), ch, 14.5, 10 + dy, '#1a0f14', 2);
        return cv;
      });
    },
    /* a typebar standing up, 7x22 units: a slug head with its letter on a thin arm; o.ink coats the head */
    typebar(ch = 'A', o = {}) {
      return memo(['bar', ch, !!o.ink].join('|'), () => {
        const cv = make(21, 66, px => {
          px.shape(cap(10.5, 63, 10.5, 16, 1.7), A.metal, 1); px.shape(ell(10.5, 62, 4, 3.4), A.metal, 2);
          px.shape(box(1, 0, 19, 20), A.metal, 3); px.shape(box(3, 2, 15, 16), A.metal, 4); hl(px, 2, 1, 2, 17, 2);
          if (o.ink) { px.shape(or(ell(10.5, 9, 9.4, 8.4), ell(4, 18, 3.4, 3), ell(15, 20, 2.6, 3.2)), A.ink, 5); px.tone(7, 5, 2); px.tone(8, 5, 2); }
        });
        if (!o.ink) text(cv.getContext('2d'), ch, 6, 3, '#3a2a30', 2);
        return cv;
      });
    },
    /* a ribbon spool seen face-on, 15x15 units; wound 0..1 is how much ribbon is on it; o.ramp is the ribbon (red) */
    spool(wound = 1, o = {}) {
      const w = Math.round(clamp(wound, 0, 1) * 10) / 10, rib = o.ramp || A.red;
      return memo(['spool', w, rib].join('|'), () => make(45, 45, px => {
        px.shape(ell(22.5, 22.5, 21, 21), A.metal, 1);
        if (w > 0) px.shape(ell(22.5, 22.5, 8 + 11.5 * w, 8 + 11.5 * w), rib, 2);
        px.shape(ell(22.5, 22.5, 7, 7), A.metal, 3); px.shape(ell(22.5, 22.5, 2.4, 2.4), A.ink, 4);
        for (const [x, y] of [[22.5, 17], [17.5, 25.5], [27.5, 25.5]]) px.shape(ell(x, y, 1.3, 1.3), A.ink, 4);
        hl(px, 9, 7, 6, 2, 2);
      }));
    },
    /* the whole machine, front view, 46x33 units, its body in the desk colour; o.paper false hides the sheet */
    typewriter(desk = P.desk, o = {}) {
      const dr = deskR(desk), paper = o.paper !== false;
      return memo(['tw', dr, paper].join('|'), () => {
        const cv = make(138, 99, px => {
          if (paper) px.shape(poly([[46, 0], [92, 0], [94, 27], [44, 27]]), A.paper, 1);
          px.shape(cap(13, 28, 125, 28, 6.4), A.ink, 2);
          px.shape(or(ell(7, 28, 6, 8), ell(131, 28, 6, 8)), A.metal, 3);
          px.shape(cap(14, 21, 3, 9, 2), A.metal, 3); px.shape(ell(3, 9, 3, 3), A.woodL, 4);
          px.shape(or(poly([[20, 36], [118, 36], [134, 90], [4, 90]]), ell(69, 40, 50, 7)), dr, 5);
          hl(px, 6, 84, 126, 6, 0);
          px.shape(ell(69, 41, 17, 6), A.metal, 6); px.shape(box(59, 39, 20, 3), A.red, 7);
          px.shape(box(61, 47, 16, 4), A.gold, 6);
          [[54, 10], [64, 9], [74, 8]].forEach(([y, n], r) => { for (let i = 0; i < n; i++) { const x = 69 - (n - 1) * 5.5 + i * 11; px.shape(ell(x, y, 5.4, 4.8), A.ink, 8); px.shape(ell(x, y - .6, 4, 3.4), A.paper, 9); } });
          px.shape(box(41, 81, 56, 6), A.ink, 8); px.shape(box(42, 81.5, 54, 4), A.paper, 9);
          px.shape(or(box(10, 90, 16, 6), box(112, 90, 16, 6)), A.ink, 3);
        });
        if (paper) { const x = cv.getContext('2d'), r = MG.seeded(7); x.fillStyle = '#3a2a30'; for (let y = 5; y < 24; y += 5) x.fillRect(50, y, 10 + Math.floor(r() * 26), 2); }
        return cv;
      });
    },
  };

  /* ---------- the runner's error card: an unknown id, a missing file or a script that fails to load ---------- */
  let failed = false;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  function fail(msg, id = P.id) {
    if (failed) return; failed = true;
    window.__repair = { id, grade: null, phase: 'error', error: msg };
    try {
      MG.boot();
      const host = document.getElementById('stage'); host.innerHTML = '';
      const st = MG.stage(host, STAGE.W, STAGE.H, { padY: 40 }), ui = MG.ui(host, st, null, 0), g = st.g;
      host.querySelector('.mg-hud').style.display = 'none';
      g.fillStyle = '#10301f'; g.fillRect(0, 0, STAGE.W, STAGE.H); g.fillStyle = '#0c2618'; for (let x = 0; x < STAGE.W; x += 8) g.fillRect(x, 0, 4, STAGE.H);
      const over = ui.over; host.classList.add('menu-open'); over.hidden = false; over.innerHTML = '';
      const back = window.MGHosted ? ui.btn('CLOSE', 'primary', () => window.MGHosted.quit()) : ui.btn('REPAIR LIST', 'primary', () => { location.href = 'index.html'; });
      over.append(h('h1', 'mg-title', 'OUT OF<span>ORDER</span>'), h('p', 'mg-sub', esc(msg)), h('p', 'mg-hint', id && /^[a-z]{3,10}$/.test(id) ? 'repair: ' + esc(id) : 'repair.html?game=<i>id</i>'), back);
    } catch (e) { document.body.textContent = msg; }
  }

  /* ---------- setup: one call does the boilerplate and hands back everything a repair uses ---------- */
  const END_DELAY = .8, VERB_SECS = .6, HOW_SECS = 2.8;
  function setup(o = {}) {
    const meta = byId[o.id] || {}, id = o.id || P.id;
    const W = o.W || meta.W || STAGE.W, H = o.H || meta.H || STAGE.H, base = o.seconds || meta.seconds || 10, seconds = base + P.extra;
    const verb = String(o.verb || meta.verb || 'FIX').toUpperCase(), title = String(o.title || meta.title || id);   /* setup() options win over LIST */
    MG.boot(); document.title = title + ' · Repair · Infinite Monkey Industries';
    const A3 = MGArt3.build(), host = document.getElementById('stage'), st = MG.stage(host, W, H, { padY: o.padY == null ? 40 : o.padY }), g = st.g;
    host.classList.add('mg-repair'); host.style.cursor = o.cursor || 'pointer';
    const ui = MG.ui(host, st, o.scoreIcon || A3.banana, 0), fx = MG.fx();
    host.querySelector('.mg-hearts').style.display = 'none';
    const timer = MG.countdownTimer(seconds), rng = MG.seeded(P.seed ^ hash(id));
    const verbEl = h('div', 'mg-verb', '<b></b>'), howEl = h('div', 'mg-how'); host.append(verbEl, howEl);
    if (o.howAt != null && o.howAt !== 'bottom') { howEl.style.top = `calc(var(--sc) * ${o.howAt === 'top' ? 14 : +o.howAt || 0})`; howEl.style.bottom = 'auto'; }   /* keep the hint off the action */
    let hooks = {}, started = false, ended = false, endT = 0, result = null, verbOn = false, howOn = false, warping = false, shake = 0;
    const keys = new Set(), ptr = { x: W / 2, y: H / 2, down: false, type: 'mouse', sx: 0, sy: 0, st: 0, moved: 0 };
    const gradeNow = () => { if (!started || !hooks.grade) return 0; const v = +hooks.grade(); return Number.isFinite(v) ? clamp(v, 0, 1) : 0; };

    const R = {
      id, meta, title, verb, W, H, st, g, ui, fx, A3, timer, rng, shell: null,
      level: P.level, desk: P.desk, deskColour: deskColour(P.desk), deskRamp: deskRamp(P.desk), deskR: deskR(P.desk), deskName: DESKS[P.desk].short,
      bot: P.bot, seed: P.seed, seconds, baseSeconds: base, extra: P.extra,
      t: 0,                                                                   /* seconds of live play this run */
      get progress() { return clamp(R.t / seconds, 0, 1); },                  /* 0..1 over the whole time (extra seconds make ramps gentler) */
      get live() { return !!R.shell && R.shell.playing && !ended; },          /* gate input + scoring on this */
      get done() { return ended; },
      get result() { return result; },                                        /* null until end(): { grade, stats, verdict } */
      get won() { return !!result && result.grade >= MG.VERDICT_AT.fixed; },   /* FIXED or PERFECT */
      ptr, held: (...k) => k.some(x => keys.has(String(x).toLowerCase())),
      axisX: () => (R.held('arrowright', 'd') ? 1 : 0) - (R.held('arrowleft', 'a') ? 1 : 0),
      axisY: () => (R.held('arrowdown', 's') ? 1 : 0) - (R.held('arrowup', 'w') ? 1 : 0),
      shake(n = 3) { shake = Math.max(shake, n); },
      crew: (x, footY, pose, co) => crew(st, x, footY, pose, co),
      end, run,
    };

    /* end(grade?, stats?, verdict?): idempotent. Freezes the grade (default hooks.grade()), stings, then shows the card ~0.8 s later.
       update keeps being called meanwhile (R.done is true) so splashes can settle. Returns true the first time. */
    function end(grade, stats, verdict) {
      if (ended || !R.shell || !R.shell.playing) return false;
      ended = true; endT = END_DELAY;
      const gr = clamp(Number(grade == null ? gradeNow() : grade) || 0, 0, 1), v = MG.verdictOf(gr);
      result = { grade: gr, stats: stats || (hooks.stats ? hooks.stats() : []), verdict: verdict || undefined };
      ui.setTimer(timer.frac, null); hideHow();
      if (v === 'PERFECT') { sfx.diamond(); MG.hitstop(.1); fx.confetti(W / 2, H * .42, 30); ui.say('PERFECT!'); }
      else if (v === 'FIXED') { sfx.golden(); fx.confetti(W / 2, H * .42, 14); ui.say('FIXED!', 'good'); }
      else if (v === 'PATCHED') { sfx.rotten(); ui.say('PATCHED', 'warn'); }
      else { sfx.over(); ui.say('NOT FIXED', 'bad'); }
      if (hooks.ended) hooks.ended(result);
      return true;
    }
    function begin() {
      started = true; ended = false; endT = 0; result = null; R.t = 0; shake = 0; verbOn = howOn = false; keys.clear();
      timer.reset(seconds); fx.clear(); ui.setScore(0); ui.setCombo(0, 1); ui.timer(true); ui.setTimer(1, seconds);
      verbEl.classList.remove('show'); howEl.classList.remove('show');
      if (hooks.reset) hooks.reset();
    }
    const hideHow = () => { howOn = false; howEl.classList.remove('show'); };
    function slam() {
      const word = /[!?]$/.test(verb) ? verb : verb + '!';
      verbEl.style.setProperty('--len', word.length); verbEl.firstChild.textContent = word; verbEl.classList.remove('show'); void verbEl.offsetWidth; verbEl.classList.add('show'); verbOn = true;
      sfx.clack(8); sfx.tone(660, 1320, .09, 'square', .04, .03);
      if (o.how) { howEl.innerHTML = o.how; howEl.classList.add('show'); howOn = true; }
    }
    /* the fixed step: fx always; the repair's update only while playing (and through the end delay); the bot before the update */
    function step(dt) {
      fx.update(dt); shake = Math.max(0, shake - dt * 20);
      if (!R.shell.playing) { if (hooks.idle) hooks.idle(dt); return; }
      if (!verbOn && R.t === 0 && !ended) {
        slam();
        if (P.warp > 0 && !warping) { warping = true; for (let i = 0, n = Math.round(P.warp * 60); i < n && !ended; i++) step(1 / 60); warping = false; }
      }
      if (!ended) {
        R.t += dt;
        if (verbOn && R.t >= VERB_SECS) { verbOn = false; verbEl.classList.remove('show'); }
        if (howOn && R.t >= HOW_SECS) hideHow();
        if (P.bot && hooks.bot) hooks.bot(dt);
        if (hooks.update) hooks.update(dt);
        if (!ended && timer.tick(dt)) end();
        if (!ended) ui.setTimer(timer.frac, timer.left);
      } else {
        if (hooks.update) hooks.update(dt);
        if ((endT -= dt) <= 0 && R.shell.phase === 'play') R.shell.finish(result.stats, { grade: result.grade, verdict: result.verdict });
      }
    }
    function draw(alpha) {
      if (!hooks.draw || !started) return;                                   /* never before the first reset() */
      g.save(); if (shake > .3) g.translate(Math.round(MG.rng(-shake, shake)) / 3, Math.round(MG.rng(-shake, shake)) / 3);
      hooks.draw(alpha); g.restore();
    }

    /* input: pointer + keys reach the repair only while it is live (releases always arrive). Positions are in game units. */
    const offUi = ev => ev.target && ev.target.closest && ev.target.closest('.mg-over,.mg-nav');
    addEventListener('pointerdown', ev => {
      if (offUi(ev)) return; sfx.unlock(); const [x, y] = st.toArt(ev);
      Object.assign(ptr, { x, y, down: true, type: ev.pointerType || 'mouse', sx: x, sy: y, st: performance.now(), moved: 0 });
      if (R.live && hooks.down) hooks.down(x, y, ev);
    });
    addEventListener('pointermove', ev => {
      const [x, y] = st.toArt(ev); ptr.x = x; ptr.y = y; if (ptr.down) ptr.moved = Math.max(ptr.moved, Math.hypot(x - ptr.sx, y - ptr.sy));
      if (R.live && hooks.move) hooks.move(x, y, ev);
    });
    const release = ev => {
      if (!ptr.down) return; const [x, y] = st.toArt(ev); ptr.down = false;
      const tap = performance.now() - ptr.st < 280 && ptr.moved < 6;                       /* a quick press that barely moved */
      if (hooks.up) hooks.up(x, y, ev, tap);
    };
    addEventListener('pointerup', release); addEventListener('pointercancel', release);
    const GAME_KEYS = /^(arrow(left|right|up|down)| )$/;
    addEventListener('keydown', ev => {
      if (ev.ctrlKey || ev.metaKey || ev.altKey) return; const k = ev.key.toLowerCase(); keys.add(k);
      if (!R.live) return;
      if (GAME_KEYS.test(k)) ev.preventDefault();
      if (hooks.key) hooks.key(ev, k);
    });
    addEventListener('keyup', ev => { const k = ev.key.toLowerCase(); keys.delete(k); if (hooks.keyup) hooks.keyup(ev, k); });
    addEventListener('blur', () => keys.clear());

    R.shell = MG.shell({
      host, ui, id: 'repair-' + id, title: title.toUpperCase().replace(/[&<>]/g, '').replace(/ (\S+)$/, '<span>$1</span>'), sub: o.how || '', legend: o.legend, hint: o.hint || 'mouse · touch · keys',
      modes: [{ k: 'main', label: 'FIX IT' }], spaceStarts: false, overTitle: title.toUpperCase(),
      grade: true, oneShot: true, autoStart: true, countdown: 'go',
      onStart: begin, score: () => Math.round((result ? result.grade : gradeNow()) * 1000),
    });
    const S = R.shell;
    window.__repair = {
      id, level: P.level, desk: P.desk, seed: P.seed, bot: P.bot, seconds, W, H,
      get phase() { return S.phase; }, get grade() { return S.phase === 'over' || S.phase === 'closed' ? S.grade : null; }, get verdict() { return S.verdict || null; },
      get live() { return R.live; }, get t() { return R.t; }, get liveGrade() { return result ? result.grade : gradeNow(); }, shell: S,
    };

    /* run(hooks): start the repair. hooks: reset() fresh state (also on AGAIN), update(dt), draw(alpha), grade() 0..1 live,
       stats() rows for the card, bot(dt) autoplayer, ended(result) once at the whistle, down/move(x, y, ev), up(x, y, ev, tap),
       key(ev, k), keyup(ev, k), idle(dt) while not playing */
    function run(hk) {
      hooks = hk || {};
      S.title();
      MG.loop(step, draw);
      return R;
    }
    MGRepair.current = R;
    return R;
  }

  window.MGRepair = { LIST, byId, STAGE, DESKS, params: P, setup, crew, fixer, deskColour, deskRamp, deskR, parts, fail, current: null };

  /* ---------- the runner: repair.html loads this with data-runner, then the repair named by ?game= ---------- */
  const me = document.currentScript;
  if (me && me.hasAttribute('data-runner')) {
    const id = P.id, meta = byId[id];
    if (!/^[a-z]{3,10}$/.test(id)) fail(id ? 'That is not a repair id.' : 'No repair was named.');
    else if (!meta) fail(`There is no "${id}" repair on the list.`);
    else {
      window.__repair = { id, grade: null, phase: 'loading' };
      addEventListener('error', () => { if (!MGRepair.current) fail('This repair hit a snag while loading.'); });
      const s = document.createElement('script'); s.src = meta.file; s.onerror = () => fail('This repair is not built yet.');
      document.body.appendChild(s);
    }
  }
})();
