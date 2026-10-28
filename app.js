/* PIXEL EDITION: art layer. Sprites, particles, the living title screen and the header toy visuals.
   Sound, the banana counter, screens and toy logic live in core.js; this file hands them an `art` object. */
(() => {
  function start() {
  if (window.VaultSaveGate?.blocked) return;
  const { setTimeout, clearTimeout, setInterval, clearInterval, requestAnimationFrame } = window.Rewards?.enabled ? Rewards.timers : window;
  const { $, rand, pick, restart, reduceMotion } = Core;
  const root = document.documentElement, fine = matchMedia('(pointer: fine)').matches;

  PXA.install();
  const S = PXA.S;
  let sky = 0;
  addEventListener('resize', () => { clearTimeout(sky); sky = setTimeout(() => PXA.paintSky(), 200); });
  const setSpr = (el, name, k = S) => { const s = PXA.spr[name]; el.style.width = s.w * k + 'px'; el.style.height = s.h * k + 'px'; el.style.backgroundImage = `url(${s.url})`; el.style.backgroundSize = '100% 100%'; };
  const onMenu = () => root.dataset.screen === 'menu';

  /* =====================  AMBIENT (the jungle backdrop behind the game)  ===================== */
  if (!reduceMotion) {
    const box = $('#drifters'), names = ['leaf', 'leaf2', 'leaf', 'banana', 'coco-s', 'leaf2'];
    for (let i = 0; i < 14; i++) {
      const e = PXA.el(names[i % names.length], pick([1, 1, 2]));
      if (names[i % names.length] === 'banana') e.classList.add('ambient-banana');
      e.style.left = rand(0, 100) + '%'; e.style.animationDuration = rand(14, 30) + 's'; e.style.animationDelay = -rand(0, 30) + 's';
      box.appendChild(e);
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
      if (!onMenu() || Ti.phase !== 'ready' || Math.hypot(e.clientX - lx, e.clientY - ly) < 48) return;
      lx = e.clientX; ly = e.clientY; fall(lx, ly, trail[n++ % trail.length], 1000);
    });
    addEventListener('pointerdown', e => { if (onMenu() && Ti.phase === 'ready' && !e.target.closest('button, a, .ti-panel')) fall(e.clientX, e.clientY, 'paw', 900); });
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

  /* =====================  THE TITLE SCREEN  =====================
     A living diorama of where the story is now: StoryKit draws the player's building (the clearing on a fresh save, the tower late on) with the
     crew at their machines under the live sky. The founder (desk 0's lead typist, wearing your look and hat) stands at the Bamboo Classic in the
     middle of the front row, and is the star: poke them, and they react to storms, lightning and the rain stopping.
     Opening (about 5 s, x1.45 for returning players, instant with reduced motion, any key/click/tap skips): fade in, the camera cranes down onto
     the scene, the crew cracks their knuckles, then types INFINITE MONKEY INDUSTRIES letter by letter (each letter flies from a typewriter into
     the logo with a clack), the carriage bell rings on the last one, the crew cheers and the menu rises.
     PLAY: the camera punches in on the founder's typewriter in whole zoom steps, an iris closes, and the Floor (or the prologue) takes over.
     The gate: on the first title visit of a page load the opening waits behind a press-any-key screen (a night clearing, fireflies, a typewriter in the dark).
     The press is the user gesture, so it unlocks the audio, starts the `title` tune and runs the opening. Coming back from the game in the same page load
     skips the gate. ?skipintro=1 skips the gate and the opening (tests, screenshots); ?story=<id> and the ?tw=1 debug preview skip the gate too.
     Reduced motion: the gate shows without blinking and the press goes straight to the settled menu, with the music. */
  const SK = window.StoryKit, Mood = window.Mood;
  const menu = $('#menu'), cv = $('#titleCv'), bubble = $('#hmBubble'), titleEl = $('#title'), tiTop = $('#tiTop'), tiBot = $('#tiBot');
  const playBtn = $('#playBtn'), chapEl = $('#playChapter'), storyBtn = $('#storyBtn'), panel = $('#storyPanel'), gear = $('#menuSettings');
  const q = new URLSearchParams(location.search), dbg = q.has('tw'), skipIntro = q.has('skipintro') && q.get('skipintro') !== '0';                 // ?tw=1&stage=4&desks=5&studios=songs,tv&muses=poe&printing=1&phase=night&wx=0 [&t=2.4|&leave=.45 freezes there]
  const now = () => performance.now();
  const T = { fade: .5, crane: 1.75, crack: 1.1, down: 1.8, l0: 1.9, dl: .085, n: 24, fly: .32 };
  T.bell = T.l0 + (T.n - 1) * T.dl + T.fly + .03; T.tag = T.bell + .25; T.ui = T.bell + .4; T.end = T.bell + .95;
  const LEAVE = .86, RETURN = .55;
  const Ti = { phase: 'idle', pressAt: -1e9, it: 0, lt: 0, rt: 0, speed: 1, steps: [], si: 0, view: null, lay: null, w: null, press: [], pokes: {}, cheerUntil: 0, typed: 0, hold: null, holdLeave: null, flights: new Set(), last: 0, acc: 0, bubbleUntil: 0 };

  /* ---- the logo letters ---- */
  let idx = 0;
  const letters = [];
  document.querySelectorAll('#title .word').forEach(word => {
    for (const ch of word.dataset.text) {
      const s = document.createElement('span');
      s.className = 'letter in'; s.textContent = ch; s.setAttribute('aria-hidden', 'true'); s.style.setProperty('--i', idx++);
      s.addEventListener('mouseenter', () => IMI.sfx.tick());
      word.appendChild(s); letters.push(s);
    }
  });

  /* ---- the world: the story's facts (the building stage, the crew, signs, portraits, plaque); the sky stays live ---- */
  function savedFounder() {
    try { const t = JSON.parse(localStorage.getItem('imi-ops-v1'))?.desks?.[0]?.crew?.[0]; if (t && window.CrewArt?.VARIANTS[t.look]) return { look: t.look, hat: +t.hat || 0 }; } catch { /* a fresh or unreadable save keeps the default monkey */ }
    return { look: 'v01', hat: 0 };
  }
  const started = () => { try { return (JSON.parse(localStorage.getItem('imi-ops-v1'))?.stats?.letters || 0) > 0; } catch { return false; } };
  function readWorld() {
    let w = null;
    try { w = IMI.story && IMI.story.world(); } catch { w = null; }
    w = Object.assign({ stage: 0, desks: 1, studios: [], muses: [], printing: 0, crew: [], founder: savedFounder() }, w || {});
    delete w.phase; delete w.wx;                                                    // the sky is read live every frame
    if (dbg) {
      const n = k => (q.get(k) != null ? +q.get(k) : null), list = k => (q.get(k) != null ? q.get(k).split(',').filter(Boolean) : null);
      if (n('stage') != null) { w.stage = n('stage'); w.desks = w.stage + 1; }
      if (n('desks') != null) w.desks = n('desks');
      if (list('studios')) w.studios = list('studios'); if (list('muses')) w.muses = list('muses'); if (n('printing') != null) w.printing = n('printing');
      if (q.get('phase')) w.phase = q.get('phase'); if (n('wx') != null) w.wx = n('wx');
      if (q.get('looks')) w.crew = q.get('looks').split(',').map(l => ({ look: l, hat: 0 }));
      if (q.get('founder')) w.founder = { look: q.get('founder'), hat: n('hat') || 0 };
    }
    w.stage = Math.max(0, Math.min(5, w.stage | 0)); w.desks = Math.max(1, Math.min(6, w.desks | 0));
    return SK.worldOf(Object.assign(w, { founder: w.founder }));
  }

  function refreshWorld() {
    const w = readWorld(), changed = !Ti.w || w.stage !== Ti.w.stage || w.desks !== Ti.w.desks;
    Ti.w = w; if (changed && onMenu()) { Ti.lay = null; layout(); }
  }

  /* ---- composition: pick a whole-number scale and a ground line so the building fits between the logo and the menu ---- */
  const SUBJ_H = [58, 90, 88, 112, 112, 128], HALF = [44, 58, 64, 70, 90, 84], PORTRAIT_TOP = [70, 72, 104, 98, 80, 104];   // art px above the ground
  function layout() {
    const W = menu.clientWidth || innerWidth, H = menu.clientHeight || innerHeight, dpr = devicePixelRatio || 1, w = Ti.w || readWorld();
    const tall = H > W * 1.05, top = tiTop.offsetTop + tiTop.offsetHeight, bot = tiBot.offsetTop, band = Math.max(80, bot - top);
    const st = w.stage, n = w.desks, needH = Math.max(SUBJ_H[st], w.muses.length ? PORTRAIT_TOP[st] : 0) + SK.FLOOR + 8, cap = tall ? 4 : 5;
    let K = 0;
    for (let k = Math.floor(cap * dpr); k >= 1; k--) {
      const cpa = k / dpr, vw = Math.floor(W * dpr / k), two = vw < n * 32 + 20 && n > 2;
      const crewHalf = two ? ((Math.ceil(n / 2) - 1) / 2) * 32 + 24 : ((n - 1) / 2) * 32 + 16;
      if (vw < 2 * Math.max(HALF[st], crewHalf) + 8 || needH * cpa > band * 1.06) continue;
      K = k; break;
    }
    if (!K) K = Math.max(1, Math.round(1.5 * dpr));
    const cpa = K / dpr, ground = bot - (SK.FLOOR + 12) * cpa;                  // the crew stands just above the menu; the building rises toward the logo
    Ti.lay = { K, cpa, dpr, gy: ground / H, tall, W, H, slots: null, baseW: Math.floor(W * dpr / K) };   // the crew layout is fixed at the home scale, so a zoom step never reshuffles it
  }
  /* which crew member stands at which desk: the founder takes the middle of the front row, the others fill in around them */
  function slots() {
    const L = Ti.lay || (layout(), Ti.lay); if (L.slots && L.n === Ti.w.desks) return L.slots;
    const n = Ti.w.desks, pos = SK.crewLayout(n, L.baseW + 22), frontY = Math.max(...pos.map(p => p.y));
    const f = pos.filter(p => p.y === frontY).sort((a, b) => Math.abs(a.x) - Math.abs(b.x) || a.x - b.x)[0];
    let m = 1; const out = pos.slice().sort((a, b) => a.x - b.x).map(p => ({ x: p.x, y: p.y, m: p === f ? 0 : m++ }));
    out.sort((a, b) => a.y - b.y || a.x - b.x);
    L.slots = out; L.n = n;
    return out;
  }
  const deskTop = m => (Ti.w.stage === 0 && m === 0 ? 13 : 11);
  const founderSlot = () => slots().find(s => s.m === 0);
  const target = () => { const s = founderSlot() || { x: 0, y: SK.FLOOR }; return { x: s.x, y: s.y - deskTop(0) - 10 }; };

  /* ---- the crew at work (the title draws its own crew so the founder can be centre stage and react) ---- */
  const FALLBACK = ['v07', 'v13', 'v19', 'v25', 'v28'];
  function typist(s, t, ms) {
    const F = s.m === 0, w = Ti.w, look = F ? w.founder : (w.crew[s.m] || { look: FALLBACK[(s.m - 1) % 5], hat: 0 });
    const speed = 5 + ((s.m * 3) % 4), beat = SK.frame(t + s.m * .37, speed), A = { look: look.look, hat: look.hat || 0, pose: beat % 2 ? 'st_type_a' : 'st_type_b', key: beat % 12, dx: 0, dy: 0, expr: undefined, pop: null };
    const still = () => { A.pose = 'idle'; A.key = -1; };
    if (reduceMotion) still();
    else if (!F) { const cyc = (t + s.m * 2.3) % 9, hk = SK.seg(cyc, 7.6, 8.3); if (hk > 0 && hk < 1) { A.pose = hk < .15 ? 'crouch' : 'air'; A.dy = Math.round(SK.hop((hk - .15) / .85, 9)); A.key = -1; } else if (cyc > 8.3 && cyc < 8.55) { A.pose = 'impact'; A.key = -1; } }
    if (Ti.phase === 'intro') {
      if (Ti.it < T.crack) still();
      else if (Ti.it < T.down) { A.pose = SK.frame(Ti.it, 6, 2) ? 'st_crack_a' : 'st_crack_b'; A.key = -1; }
    }
    for (const p of Ti.press) if (p.m === s.m && ms - p.at < 80) { A.pose = 'st_type_a'; A.key = p.k % 12; A.dy = 0; }
    if (F && Mood) {
      if (Mood.hat) A.hat = 1;                                                       // a leaf over the head in the rain
      if (Mood.scared && !reduceMotion) { A.expr = 'screech'; A.dx = Math.floor(ms / 70) % 2; }
      if (Mood.shaking(ms)) { A.pose = Math.floor(ms / 90) % 2 ? 'st_shrug' : 'idle'; A.key = -1; A.dx = Math.floor(ms / 60) % 2 ? 1 : -1; A.expr = 'giggle'; }
    }
    if (Mood && Mood.startle(ms)) { A.pose = 'st_gasp'; A.key = -1; A.dy = Math.round(SK.hop(SK.seg(ms, Mood.startleUntil - 900, Mood.startleUntil - 600), 4)); if (F) { A.expr = 'screech'; A.pop = '!'; } }
    if (ms < Ti.cheerUntil) { const k = 1 - (Ti.cheerUntil - ms) / 900; A.pose = 'st_cheer'; A.key = -1; A.dy = Math.round(SK.hop(SK.seg(k, 0, .45), F ? 7 : 5)); }
    const pk = Ti.pokes[s.m];
    if (pk != null && ms - pk < 1300) {
      const k = (ms - pk) / 700; A.key = -1;
      if (k < .12) A.pose = 'crouch'; else if (k < .6) { A.pose = 'air'; A.dy = Math.round(SK.hop((k - .12) / .48, F ? 12 : 8)); } else if (k < .72) A.pose = 'impact'; else A.pose = F ? 'st_gasp' : 'st_wave_a';
      A.expr = F ? 'screech' : 'giggle'; if (F && k < 1.4) A.pop = '!';
    }
    return A;
  }
  function drawTypists(g, t, view) {
    const ms = now(), list = slots();
    SK.riser(g, list);
    for (const s of list) {
      const A = typist(s, t, ms), kind = Ti.w.stage === 0 && s.m === 0 ? 'crate' : 'desk', top = deskTop(s.m);
      SK.shadow(g, s.x, s.y + 1, 14);
      SK.actor(g, A.look, A.pose, s.x + A.dx, s.y - top + 2 + A.dy, { hat: A.hat, expr: A.expr });
      const dt = SK.desk(g, s.x, s.y, kind);
      const paper = (s.m === 0 && Ti.phase === 'intro' ? Ti.typed / T.n : (t * .12 + s.m * .3) % 1) * .22,   // a short page: the typist's face stays clear of it
        col = ms < Ti.cheerUntil ? 0 : (SK.frame(t + s.m * .37, 5 + ((s.m * 3) % 4)) % 20) / 20;
      SK.typewriter(g, s.m, s.x, dt, A.key, { paper, col: s.m === 0 && Ti.phase === 'intro' ? Ti.typed / T.n : col });
      if (A.pop) SK.pop(g, s.x + 3, s.y - top - 37 + A.dy, A.pop);
      if (s.m === 0 && ms < Ti.cheerUntil) for (let i = 0; i < 5; i++) if (SK.frame(t + i * .31, 7, 3)) SK.sparkle(g, s.x - 14 + SK.hash(i, 3) * 28, dt - 18 - SK.hash(i, 4) * 26, 1 + (i % 2), i % 2 ? '#fff6d6' : '#ffd23a');
    }
  }

  /* ---- the camera: the opening crane, the PLAY dive, the pull-back when you come back from the game ---- */
  function camera() {
    const L = Ti.lay, home = { x: 0, y: 0, fy: L.gy, z: 0 }, ease = SK.ease, lerp = SK.lerp;
    if (Ti.phase === 'intro') {
      const k = ease.inOut(SK.seg(Ti.it, 0, T.crane)), crane = Ti.w.stage === 5 ? 190 : L.tall ? 110 : 70;
      return { x: Math.round(lerp(18, 0, k)), y: Math.round(lerp(-crane, 0, k)), fy: home.fy, z: 0 };
    }
    const tg = target();
    if (Ti.phase === 'leaving') { const lt = Ti.lt, k = ease.in(SK.seg(lt, 0, .6)); return { x: Math.round(lerp(0, tg.x, k)), y: Math.round(lerp(0, tg.y, k)), fy: lerp(home.fy, .5, k), z: lt < .12 ? 0 : lt < .24 ? 1 : lt < .36 ? 2 : lt < .48 ? 4 : 6 }; }   // a punch-in in whole steps, deeper each cut
    if (Ti.phase === 'return') { const rt = Ti.rt, k = ease.out(SK.seg(rt, 0, RETURN)); return { x: Math.round(lerp(tg.x, 0, k)), y: Math.round(lerp(tg.y, 0, k)), fy: lerp(.5, home.fy, k), z: rt < .14 ? 2 : rt < .28 ? 1 : 0 }; }
    return home;
  }
  /* screen-space effects: the fade in, the bell's flash, the closing iris */
  function screenFx(g, t, view) {
    const ink = '#1a0f14';
    if (Ti.phase === 'intro' && Ti.it < T.fade) { g.globalAlpha = Math.ceil((1 - Ti.it / T.fade) * 5) / 5; g.fillStyle = ink; g.fillRect(0, 0, view.w, view.h); g.globalAlpha = 1; }
    if (Ti.flashAt && now() - Ti.flashAt < 90 && !IMI.fx.low) { g.globalAlpha = .4; g.fillStyle = '#fff6d6'; g.fillRect(0, 0, view.w, view.h); g.globalAlpha = 1; }
    if (Ti.phase === 'leaving' && Ti.lt > .42) {
      const tg = target(), cx = view.ox + tg.x, cy = view.oy + tg.y, k = SK.ease.inOut(SK.seg(Ti.lt, .42, .8)), R = Math.round((Math.hypot(view.w, view.h) / 2 + 6) * (1 - k));
      g.fillStyle = ink;
      for (let y = 0; y < view.h; y++) {
        const dy = y - cy, h = Math.abs(dy) > R ? -1 : Math.floor(Math.sqrt(R * R - dy * dy));
        if (h < 0) { g.fillRect(0, y, view.w, 1); continue; }
        if (cx - h > 0) g.fillRect(0, y, cx - h, 1); if (cx + h + 1 < view.w) g.fillRect(cx + h + 1, y, view.w - cx - h - 1, 1);
      }
    }
  }
  function draw() {
    if (!Ti.lay) layout();
    const c = camera();
    try {
      Ti.view = SK.render(cv, now() / 1000, Ti.w, {
        scale: Ti.lay.K, zoom: c.z, cam: { x: c.x, y: c.y }, fy: c.fy, crew: false, draw: drawTypists, screen: screenFx,
        towerLit: Ti.w.stage === 5 && Ti.phase === 'intro' ? SK.seg(Ti.it, .5, T.down) : undefined,
      });
    } catch (e) { console.error('[title] draw', e); }
    placeBubble();
  }

  /* ---- the opening script ---- */
  function at(t, run) { Ti.steps.push({ t, run }); }
  function script() {
    Ti.steps = []; Ti.si = 0;
    for (let k = 0; k < T.n; k++) at(T.l0 + k * T.dl, fast => typeLetter(k, fast));
    at(T.bell, fast => ring(fast));
    at(T.tag, () => menu.classList.add('tag-in'));
    at(T.ui, () => menu.classList.add('ui-in'));
    at(T.end, () => finishIntro());
  }
  const order = () => slots().map(s => s.m);
  function typeLetter(k, fast) {
    Ti.typed = k + 1;
    const el = letters[k]; if (!el) return;
    const ms = order(), m = k === 0 || k === T.n - 1 ? 0 : ms[k % ms.length];
    Ti.press.push({ m, k, at: now() }); if (Ti.press.length > 12) Ti.press.shift();
    if (fast || IMI.fx.low || !Ti.view) { el.classList.add('in'); return; }
    IMI.sfx.key(1 + (k % 5) * .05);
    const s = slots().find(x => x.m === m), from = s && Ti.view.toCss(s.x, s.y - deskTop(m) - 14), to = el.getBoundingClientRect();
    if (!from) { el.classList.add('in', 'land'); return; }
    const fl = document.createElement('span'); fl.className = 'letter ti-fly'; fl.textContent = el.textContent; fl.setAttribute('aria-hidden', 'true');
    menu.appendChild(fl); Ti.flights.add(fl);
    const fw = fl.offsetWidth, fh = fl.offsetHeight, ex = to.left, ey = to.top, sx = from[0] - fw / 2, sy = from[1] - fh / 2, mx = (sx + ex) / 2, my = Math.min(sy, ey) - 30;
    const anim = fl.animate([
      { transform: `translate(${sx}px, ${sy}px) scale(.3)` },
      { transform: `translate(${mx}px, ${my}px) scale(.8)`, offset: .55 },
      { transform: `translate(${ex}px, ${ey}px) scale(1)` },
    ], { duration: T.fly * 1000 / Ti.speed, easing: 'steps(8)', fill: 'forwards' });
    anim.onfinish = () => { fl.remove(); Ti.flights.delete(fl); el.classList.add('in', 'land'); };
  }
  function ring(fast) {
    letters.forEach(l => l.classList.add('in'));
    if (fast) return;
    IMI.sfx.bell(); setTimeout(() => IMI.sfx.ding(), 90);
    Ti.flashAt = now(); Ti.cheerUntil = now() + 900;
    titleEl.classList.remove('rang'); void titleEl.offsetWidth; titleEl.classList.add('rang');
  }
  function finishIntro() {
    Ti.phase = 'ready'; menu.classList.remove('intro'); menu.classList.add('tag-in', 'ui-in');
  }
  function skip() {
    if (Ti.phase !== 'intro') return;
    for (const f of Ti.flights) f.remove(); Ti.flights.clear();
    Ti.it = T.end; while (Ti.si < Ti.steps.length) Ti.steps[Ti.si++].run(true);
    letters.forEach(l => { l.classList.add('in'); l.classList.remove('land'); }); titleEl.classList.remove('rang');
    Ti.typed = T.n; Ti.press = []; finishIntro();
  }
  function startIntro() {
    Ti.w = readWorld(); layout();
    if (reduceMotion || skipIntro) { Ti.phase = 'ready'; letters.forEach(l => l.classList.add('in')); menu.classList.remove('intro'); menu.classList.add('tag-in', 'ui-in'); return; }
    Ti.speed = started() ? 1.45 : 1;
    Ti.phase = 'intro'; Ti.it = 0; Ti.typed = 0; Ti.press = []; script();
    letters.forEach(l => l.classList.remove('in', 'land'));
    menu.classList.add('intro'); menu.classList.remove('tag-in', 'ui-in');
    if (dbg && q.get('t') != null) Ti.hold = +q.get('t');
  }

  /* ---- skipping: any key, click or tap during the opening (the click that skips never lands on a button that just appeared) ---- */
  let swallow = 0;
  const inertKey = e => e.ctrlKey || e.metaKey || e.altKey || ['Shift', 'Control', 'Alt', 'Meta', 'Tab', 'CapsLock', 'OS'].includes(e.key) || /^F\d+$/.test(e.key);   // the browser's keys, not a press
  const DEBOUNCE = 350;                                          // the press that opens the gate must not also skip the opening it starts
  addEventListener('keydown', e => {
    if (Ti.phase !== 'intro' || !onMenu() || root.classList.contains('story-on')) return;
    if (inertKey(e)) return;
    if (e.repeat || now() - Ti.pressAt < DEBOUNCE) { e.preventDefault(); e.stopImmediatePropagation(); return; }   // a held key never skips, and never reaches a button
    e.preventDefault(); e.stopImmediatePropagation(); skip();
  }, true);
  addEventListener('pointerdown', e => {
    if (Ti.phase !== 'intro' || !onMenu() || root.classList.contains('story-on') || e.target.closest('.set-pop')) return;
    if (now() - Ti.pressAt < DEBOUNCE) return;
    skip(); if (!e.target.closest('.menu-corner')) swallow = now() + 700;
  }, true);
  addEventListener('click', e => { if (now() < swallow && e.target.closest('#menu')) { e.preventDefault(); e.stopImmediatePropagation(); swallow = 0; } }, true);

  /* ---- PLAY: dive into the founder's typewriter, then cut to the Floor (or hand the black screen straight to the prologue) ---- */
  const cover = document.createElement('div'); cover.className = 'ti-cover'; cover.hidden = true; cover.setAttribute('aria-hidden', 'true'); document.body.appendChild(cover);
  let waitStory = false, coverT = 0;
  function expectPrologue() {
    try {
      const st = IMI.story, f = IMI.ops?.snap?.() || {};
      const a = st && st.isOn() && st.list().find(x => x.id === 'prologue');
      return !!(a && !a.seen && a.ready && !(f.typed | 0) && !(f.paws | 0) && !(f.words | 0) && !(f.sold | 0) && !(f.printing | 0));
    } catch { return false; }
  }
  function hideCover(instant) {
    waitStory = false; clearTimeout(coverT);
    if (instant || reduceMotion) { cover.hidden = true; return; }
    let n = 3; const step = () => { cover.style.opacity = String(n / 4); if (n-- <= 0) { cover.hidden = true; cover.style.opacity = '1'; return; } coverT = setTimeout(step, 80); }; step();
  }
  function leave() {
    if (Ti.phase === 'leaving') return;
    if (Ti.phase === 'intro') skip();
    closePanel(false);
    Ti.phase = 'leaving'; Ti.lt = 0; menu.classList.add('leaving'); bubble.classList.remove('show');
    IMI.sfx.whoosh();
    if (dbg && q.get('leave') != null) Ti.holdLeave = +q.get('leave');
  }
  function finishLeave() {
    cover.style.opacity = '1'; cover.hidden = false;
    const pro = expectPrologue();
    if (pro) IMI.music?.play('story');                                             // the prologue's tune starts under the black, so the Floor's never plays for a second in between
    Ti.phase = 'ready'; menu.classList.remove('leaving');
    location.hash = 'play';
    if (pro) { waitStory = true; coverT = setTimeout(() => { if (waitStory) IMI.music?.restore?.(); hideCover(false); }, 1800); } else coverT = setTimeout(() => hideCover(false), 60);
  }
  playBtn.addEventListener('click', e => {
    if (e.button || e.ctrlKey || e.metaKey || e.shiftKey || reduceMotion) return;          // reduced motion: core.js swaps straight to the game
    e.preventDefault(); e.stopImmediatePropagation();
    if (Ti.phase === 'leaving') return;
    IMI.sfx.tick(); leave();
  }, true);

  /* ---- the founder: poke them; they talk about the weather ---- */
  function hitTest(e) {
    const v = Ti.view; if (!v || Ti.phase !== 'ready') return null;
    const r = cv.getBoundingClientRect(), ax = ((e.clientX - r.left) * v.dpr) / v.K - v.ox, ay = ((e.clientY - r.top) * v.dpr) / v.K - v.oy;
    let best = null;
    for (const s of slots()) { const feet = s.y - deskTop(s.m) + 4; if (Math.abs(ax - s.x) <= 13 && ay >= feet - 40 && ay <= s.y + 2 && (!best || s.y > best.y)) best = s; }
    return best;
  }
  function poke(s) {
    Ti.pokes[s.m] = now();
    if (s.m !== 0) { IMI.sfx.attach(); return; }
    bubble.textContent = pick(['OOH OOH!', 'AHH AHH!', 'EEEK!', 'BANANA?!', 'BACK TO WORK!', 'I\'M TYPING HERE!']); Ti.bubbleUntil = now() + 1300; bubble.classList.add('show'); restart(bubble, 'pop');
    IMI.sfx.monkey();
  }
  cv.addEventListener('pointerdown', e => { const s = hitTest(e); if (s) { e.preventDefault(); poke(s); } });
  if (fine) cv.addEventListener('pointermove', e => { cv.style.cursor = hitTest(e) ? 'pointer' : ''; }, { passive: true });
  function founderCss(dy = 0) { const v = Ti.view, s = founderSlot(); if (!v || !s) return null; return v.toCss(s.x, s.y - deskTop(0) - 40 + dy); }
  function placeBubble() {
    if (!bubble.classList.contains('show')) return;
    if (now() > Ti.bubbleUntil || Ti.phase === 'leaving') { bubble.classList.remove('show'); return; }
    const p = founderCss(); if (!p) return;
    bubble.style.left = Math.round(p[0]) + 'px'; bubble.style.top = Math.round(p[1]) + 'px';
  }
  function heroSay(text, ms = 1600) {
    if (!onMenu() || Ti.phase !== 'ready') return;
    bubble.textContent = text; Ti.bubbleUntil = now() + ms; bubble.classList.add('show'); restart(bubble, 'pop');
  }
  const founderBox = () => { const p = founderCss(20); return p ? { x: p[0], y: p[1] } : null; };
  Mood.on('weather', n => heroSay(['SUNNY!', 'DRIZZLE...', 'IT\'S RAINING!', 'STORM!! EEK!'][n]));
  Mood.on('startle', () => { IMI.sfx.monkey(); if (onMenu()) heroSay('EEEK!', 1100); });
  Mood.on('shake', () => {
    IMI.sfx.shake(); heroSay('SHAKE IT OFF!', 1500);
    const b = onMenu() && founderBox(); if (b) burst(b.x, b.y, ['drop', 'drop', 'coco'], 14);
  });
  Mood.on('drip', () => { const b = onMenu() && Ti.phase === 'ready' && Math.random() < .6 && founderBox(); if (b) fall(b.x + rand(-24, 24), b.y + 20, 'drop', 900); });
  let typedKeys = '';                                            // typing "banana" (core.js makes it rain bananas): the crew celebrates
  addEventListener('keydown', e => {
    if (e.key.length !== 1 || e.target.matches('input, textarea')) return;
    typedKeys = (typedKeys + e.key.toLowerCase()).slice(-6);
    if (typedKeys === 'banana' && onMenu() && Ti.phase === 'ready') { Ti.cheerUntil = now() + 900; heroSay('BANANAS!!', 1400); }
  });

  /* ---- the menu: the chapter on PLAY, the STORY list, arrow-key navigation ---- */
  const MACHINE = ['prologue', 'machine-hibiscus', 'machine-lagoon', 'machine-honeycomb', 'machine-orchid', 'machine-moonflower'];
  const chapName = a => (a.chapter === 0 ? 'Prologue' : 'Chapter ' + a.chapter) + ': ' + a.title;
  function storyList() { try { return (IMI.story && IMI.story.list()) || []; } catch { return []; } }
  function chapter() {
    const l = storyList(); if (!l.length) return 'Prologue: The Clearing';
    if (dbg && q.get('chapter')) { const a = l.find(x => x.id === q.get('chapter')); if (a) return chapName(a); }
    const seen = l.filter(a => a.seen).sort((a, b) => b.chapter - a.chapter)[0] || l.find(a => a.id === MACHINE[Ti.w ? Ti.w.stage : 0]) || l[0];
    return chapName(seen);
  }
  const replayable = () => storyList().filter(a => a.seen && a.ready);
  function paintMenu() {
    chapEl.textContent = chapter();
    storyBtn.hidden = !replayable().length;
    if (storyBtn.hidden) closePanel(false);
  }
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function openPanel() {
    const l = storyList(), seen = l.filter(a => a.seen && a.ready), next = l.find(a => !a.seen && a.ready);
    panel.querySelector('.ti-plist').innerHTML = seen.map(a => `<li><button type="button" class="ti-pitem" data-id="${esc(a.id)}"><span class="ti-pch">${a.chapter === 0 ? 'PROLOGUE' : 'CHAPTER ' + a.chapter}</span><span class="ti-pt">${esc(a.title)}</span><i class="ti-pplay" aria-hidden="true"></i></button></li>`).join('')
      + (next ? `<li><span class="ti-pitem locked"><span class="ti-pch">CHAPTER ${next.chapter}</span><span class="ti-pt">Keep typing...</span></span></li>` : '');
    panel.hidden = false; storyBtn.setAttribute('aria-expanded', 'true'); IMI.sfx.page();
    const items = panel.querySelectorAll('.ti-pitem[data-id]'); items[items.length - 1]?.focus({ preventScroll: true });   // the latest chapter
    panel.querySelector('.ti-plist').scrollTop = 1e6;
  }
  function closePanel(focus) { if (panel.hidden) return; panel.hidden = true; storyBtn.setAttribute('aria-expanded', 'false'); if (focus) storyBtn.focus(); }
  storyBtn.addEventListener('click', e => { e.stopPropagation(); IMI.sfx.tick(); if (panel.hidden) { if (IMI.settings?.isOpen?.()) IMI.settings.close(); openPanel(); } else closePanel(true); });   // one panel at a time (this click never reaches the settings' click-outside)
  panel.addEventListener('click', e => {
    if (e.target.closest('.ti-px')) { IMI.sfx.tick(); closePanel(true); return; }
    const b = e.target.closest('.ti-pitem[data-id]'); if (!b) return;
    closePanel(true); IMI.sfx.tick();                             // focus on STORY first: the scene hands it back there
    try { IMI.story.play(b.dataset.id, { replay: true }); } catch (err) { console.error(err); }
  });
  addEventListener('pointerdown', e => { if (!panel.hidden && !e.target.closest('#storyPanel, #storyBtn')) closePanel(false); });
  addEventListener('keydown', e => {
    if (!onMenu() || root.classList.contains('story-on') || Ti.phase === 'intro' || Ti.phase === 'leaving') return;
    if (document.querySelector('.set-pop:not([hidden])')) return;
    if (e.key === 'Escape' && !panel.hidden) { e.preventDefault(); closePanel(true); return; }
    const d = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0;
    if (!d || e.target.matches('input, textarea, select')) return;
    const items = panel.hidden ? [playBtn, storyBtn, gear].filter(b => b && !b.hidden) : [...panel.querySelectorAll('.ti-pitem[data-id], .ti-px')];
    let i = items.indexOf(document.activeElement); i = i < 0 ? 0 : (i + d + items.length) % items.length;
    items[i].focus(); e.preventDefault(); IMI.sfx.tick();
  });

  /* ---- the gate: PRESS ANY KEY. A night clearing (the story kit at night: stars, moon, fireflies) with a typewriter standing in the dark; every few
     seconds one of its keys glows for a beat, the idle hum of the place. The opening and the title tune wait for the press. ---- */
  const gate = $('#gate'), gateCv = $('#gateCv');
  function drawGate(ms) {
    const t = reduceMotion ? 2.3 : ms / 1000;
    const phone = innerWidth < innerHeight, hum = reduceMotion ? -1 : Math.floor(t * 1.2) % 3 === 0 ? Math.floor(t * 9) % 5 : -1;   // one key lights for a beat every few seconds
    try {
      SK.render(gateCv, t, SK.worldOf({ stage: 0, desks: 1 }), {
        safe: phone ? [112, 124] : [168, 100], cam: { x: 0, y: phone ? -26 : -24 }, fy: phone ? .56 : .5, sky: { phase: 'night', wx: 0 }, stage: 0, crew: false, doorman: false,
        draw: (g, tt, v) => {
          const y = SK.FLOOR;
          SK.shadow(g, 0, y + 1, 18);
          const top = SK.desk(g, 0, y, 'crate');
          const R = (x, yy, w, h, c) => { g.fillStyle = c; g.fillRect(x, top + yy, w, h); };   // the typewriter is a silhouette: ink-dark shapes with moonlight on the top edges
          R(-6, -23, 12, 13, '#8e9cc0'); R(-6, -23, 12, 1, '#c8d2ea'); for (let i = 0; i < 4; i++) R(-4, -20 + i * 2, i === 3 ? 5 : 8, 1, '#5a6a90');   // a sheet of paper catching the moon
          R(-11, -11, 22, 3, '#0b1020'); R(-11, -11, 22, 1, '#4a5f8a'); R(-13, -12, 3, 6, '#0b1020'); R(10, -12, 3, 6, '#0b1020'); R(-13, -12, 3, 1, '#4a5f8a'); R(10, -12, 3, 1, '#4a5f8a');   // the platen and its knobs
          R(-11, -8, 22, 4, '#0b1020'); R(-12, -4, 24, 5, '#0b1020'); R(-12, -4, 24, 1, '#3d507a'); R(-11, -8, 22, 1, '#2a3a60');   // the body
          g.fillStyle = '#1c2a4c'; for (let k = 0; k < 5; k++) for (let j = 0; j < 2; j++) g.fillRect(-10 + k * 4 + j * 2, top - 3 + j * 2, 2, 1);   // the keys, barely there
          if (hum >= 0) { const kx = -10 + hum * 4; g.fillStyle = '#ffd23a'; g.fillRect(kx, top - 3, 2, 1); v.light(kx - 1, top - 4, 4, 3, 'rgba(255,210,90,.3)'); }
        },
        screen: (g, tt, v) => {                                  // a deep stepped vignette: the corners fall away into the dark
          g.fillStyle = '#05080f';
          const bands = [[.55, 0], [.4, 3], [.28, 7], [.16, 13]];
          for (const [a, inset] of bands) {
            g.globalAlpha = a * .5;
            const ix = Math.round(v.w * inset / 100 * 2.2), iy = Math.round(v.h * inset / 100 * 1.4);
            g.fillRect(0, 0, v.w, iy); g.fillRect(0, v.h - iy, v.w, iy); g.fillRect(0, 0, ix, v.h); g.fillRect(v.w - ix, 0, ix, v.h);
          }
          g.globalAlpha = .38; g.fillRect(0, 0, v.w, v.h); g.globalAlpha = 1;
        },
      });
    } catch (e) { console.error('[gate] draw', e); }
  }
  function enterGate() {
    Ti.phase = 'gate';
    gate.dataset.input = matchMedia('(hover: none)').matches ? 'touch' : 'key';
    gate.hidden = false; gate.classList.remove('out');
    IMI.music.hold(true);                                        // the title tune is wanted, but nothing plays before the press
    drawGate(now());
    gate.focus({ preventScroll: true });
    if (reduceMotion) addEventListener('resize', () => { if (Ti.phase === 'gate') drawGate(now()); });
  }
  function pressGate(e) {
    if (Ti.phase !== 'gate' || root.dataset.screen !== 'menu') return;
    if (e.type === 'keydown' && (e.repeat || inertKey(e))) return;
    if (e.type !== 'keydown' && e.button) return;
    e.preventDefault(); e.stopImmediatePropagation();
    Ti.pressAt = now(); swallow = now() + 700;                   // the click that follows this press lands on nothing
    gate.classList.add('out'); gate.blur();
    setTimeout(() => { gate.hidden = true; gateCv.width = gateCv.height = 0; }, 400);   // the scene is not drawn again: drop its pixels
    removeEventListener('keydown', pressGate, true); removeEventListener('pointerdown', pressGate, true); gate.removeEventListener('click', pressGate);
    IMI.audio.ctx();                                             // inside the gesture: build and resume the audio context
    IMI.music.hold(false); IMI.music.play('title');              // the tune fades in under the opening (or the settled menu)
    startIntro();                                                // reduced motion: straight to the settled menu
    refreshWorld(); paintMenu();
    if (Ti.phase === 'ready') { relayout(); draw(); }
  }
  addEventListener('keydown', pressGate, true);
  addEventListener('pointerdown', pressGate, true);
  gate.addEventListener('click', pressGate);                    // a screen reader's activate (no key or pointer event comes first)

  /* ---- the loop: draw only while the title is on screen and visible (30 fps, 12 on Effects: Low, every frame while the camera moves) ---- */
  function frame(ms) {
    requestAnimationFrame(frame);
    Mood.update(ms);                                             // wetness drives the CSS dimming everywhere
    const dt = Math.min(.1, Math.max(0, (ms - (Ti.last || ms)) / 1000)); Ti.last = ms;
    if (!onMenu() || document.hidden || root.classList.contains('story-on') || !Ti.w) return;
    if (!Ti.storyReady && IMI.story) { Ti.storyReady = true; refreshWorld(); paintMenu(); }
    if (Ti.phase === 'gate') { if (!reduceMotion && (Ti.acc += dt) >= 1 / 20) { Ti.acc = 0; drawGate(ms); } return; }   // 20 fps behind the gate; reduced motion draws it once
    if (Ti.phase === 'intro') {
      Ti.it = Ti.hold != null ? Math.min(Ti.hold, Ti.it + dt * Ti.speed) : Ti.it + dt * Ti.speed;
      while (Ti.si < Ti.steps.length && Ti.steps[Ti.si].t <= Ti.it) Ti.steps[Ti.si++].run(false);
    } else if (Ti.phase === 'leaving') {
      Ti.lt = Ti.holdLeave != null ? Math.min(Ti.holdLeave, Ti.lt + dt) : Ti.lt + dt;
      if (Ti.lt >= LEAVE) { finishLeave(); return; }
    } else if (Ti.phase === 'return') { Ti.rt += dt; if (Ti.rt >= RETURN) Ti.phase = 'ready'; }
    const moving = Ti.phase !== 'ready' || Ti.flashAt && ms - Ti.flashAt < 120;
    Ti.acc += dt; if (!moving && Ti.acc < (IMI.fx.low || reduceMotion ? 1 / 12 : 1 / 30)) return;
    Ti.acc = 0; draw();
  }

  /* =====================  BOOT  ===================== */
  const IMI = Core.boot({
    edition: 'pixel', S, burst, fall, heroSay, toys,
    bananaEl: mult => PXA.el('banana', mult),
    bannerText: t => '>> ' + t + ' <<',
    paintSound: (btn, on) => setSpr(btn.firstChild, on ? 'drum-on' : 'drum-off', 2),
  });
  { const b = document.createElement('span'); b.className = 'ti-ban'; b.setAttribute('aria-hidden', 'true'); b.appendChild(PXA.el('banana', 1)); playBtn.prepend(b); }
  { const c = document.createElement('canvas'); c.className = 'ti-book'; c.width = 11; c.height = 13; c.setAttribute('aria-hidden', 'true'); const g = c.getContext('2d'); SK.book(g, 1, 1); storyBtn.prepend(c); }
  const relayout = () => { if (onMenu()) { Ti.lay = null; layout(); if (Ti.phase !== 'intro' && Ti.phase !== 'leaving' && Ti.phase !== 'gate') draw(); } };
  let rt = 0; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(relayout, 120); });
  if (window.ResizeObserver) new ResizeObserver(() => { clearTimeout(rt); rt = setTimeout(relayout, 60); }).observe(tiBot);
  IMI.onScreen(name => {
    if (name !== 'menu') { closePanel(false); bubble.classList.remove('show'); return; }
    if (Ti.phase === 'gate') return;                            // back on the title with the gate still up (history): the press has not happened yet
    Ti.w = readWorld(); paintMenu(); relayout();
    if (Ti.phase === 'idle') { startIntro(); return; }
    letters.forEach(l => l.classList.add('in')); menu.classList.remove('intro', 'leaving'); menu.classList.add('tag-in', 'ui-in');
    if (reduceMotion) { Ti.phase = 'ready'; return; }
    Ti.phase = 'return'; Ti.rt = 0;
  });
  IMI.on('story', d => {
    if (d && d.playing && waitStory) hideCover(true);           // the prologue's own fade takes over from our black screen: one fade, not two
    if (d && !d.playing && onMenu()) { IMI.music?.play('title'); refreshWorld(); paintMenu(); }
  });
  setInterval(() => { if (onMenu() && Ti.phase === 'ready' && !document.hidden) { refreshWorld(); paintMenu(); } }, 5000);
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { if (onMenu()) relayout(); });
  if (onMenu()) {
    Ti.w = readWorld();
    if (!skipIntro && !dbg && !q.get('story')) enterGate(); else startIntro();
    setTimeout(() => { refreshWorld(); paintMenu(); }, 0);       // story.js boots after this file: its world (the building, the crew) and the chapter arrive a moment later
    if (dbg && q.get('leave') != null) setTimeout(() => { skip(); leave(); }, 400);
  } else { Ti.phase = 'ready'; Ti.w = readWorld(); }
  if (dbg || skipIntro) window.__title = Ti;
  requestAnimationFrame(frame);
  }
  if (window.Rewards?.enabled) Rewards.start(start); else start();
})();
