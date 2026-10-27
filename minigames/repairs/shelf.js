/* ============================================================
   THE SHELF COLLAPSED (repair "shelf", verb SHELVE, 14 s).
   The desk's bookshelf snapped off the wall and now hangs on two chains, swinging. Its sections are the word bands, one colour
   each (the six desk colours: 2-3 letters Bamboo green, 4-5 Hibiscus pink, 6-7 Lagoon blue...). The fixer walks the top beam with
   a fallen spine overhead: line it up and let go, and it tumbles down onto the swinging shelf. The right band clunks into place;
   the wrong band bounces it off; missing the shelf drops it on the floor. Lead the swing, or wait for it to turn at the ends.
   Grade = books shelved / books in the pile. The run ends early when the pile is done.
   Level: 3 then 4 bands, a faster and wider swing, more books.
   Controls: move the mouse / drag a finger / ← → A D; click, release the finger, Space, ↓ or S lets go.
   Layout of this file (as leak.js): 1 sprites · 2 setup · 3 tuning · 4 state · 5 verbs · 6 update · 7 bot · 8 draw · 9 run.
   ============================================================ */
(() => {
  'use strict';
  const { clamp, lerp, sfx } = MG;
  const { R: AR } = MGArt, { make, cvs, text, textW } = MGArt3;

  /* ---------- 1. sprites: a book spine in each band colour, pre-turned in 8 steps so it can tumble without smearing pixels ---------- */
  const BANDS = MGRepair.DESKS.map((d, i) => ({ i, label: ['2-3', '4-5', '6-7', '8-9', '10-11', '12-13'][i], name: d.short, col: d.ramp, R: MGRepair.deskR(i) }));
  const SW = 15, SH = 45, BOX = 51, TURNS = 8;                                      /* spine 5x15 units; its square, turnable canvas */
  function spineSpr(rampId, a) {
    const c = Math.cos(a), s = Math.sin(a), m = BOX / 2;
    const at = f => (x, y) => { const dx = x - m, dy = y - m; return f(dx * c + dy * s, -dx * s + dy * c); };   /* test in the book's own frame */
    return make(BOX, BOX, px => {
      px.shape(at((u, v) => Math.abs(u) <= SW / 2 && Math.abs(v) <= SH / 2), rampId, 1);
      px.shape(at((u, v) => Math.abs(u) <= SW / 2 - 1 && Math.abs(Math.abs(v) - 16.5) <= 1.4), AR.gold, 2);
      px.shape(at((u, v) => Math.abs(u) <= 4.5 && Math.abs(v + 1) <= 7), AR.paper, 3);
      px.shape(at((u, v) => Math.abs(u) <= 2.5 && (Math.abs(v + 4) <= .8 || Math.abs(v + .5) <= .8 || Math.abs(v - 3) <= .8)), AR.ink, 4);
    });
  }
  BANDS.forEach(b => { b.spr = Array.from({ length: TURNS }, (_, k) => spineSpr(b.R, k * Math.PI / TURNS)); });
  const ICON = BANDS[MGRepair.params.desk].spr[1];

  /* ---------- 2. setup ---------- */
  const R = MGRepair.setup({
    id: 'shelf', verb: 'SHELVE', scoreIcon: ICON,
    how: 'Drop each book on its <em>colour</em> · the shelf swings',
    legend: [[BANDS[0].spr[0], 'drop each spine on its <em>colour</em>'], [BANDS[2].spr[2], 'the shelf <em>swings</em>: lead it'], [BANDS[1].spr[4], 'wrong band? it <em class="bad">bounces off</em>']],
    hint: 'move · click / release / Space to drop',
  });
  const { st, g, W, H, ui, fx, rng, level: LV } = R;

  /* the library wall, the beam the fixer walks, the broken brackets, the floor: painted once */
  const BEAM = 56, HOOK = 60, SHELF = 118, FLOOR = 146, PILE_X = 111, X_MIN = 8, X_MAX = 98, HANDS = BEAM - 12.33;
  const ROOM = cvs(W * 3, H * 3, x => {
    x.scale(3, 3); const r = (c, a, b, w, hh) => { x.fillStyle = c; x.fillRect(a, b, w, hh); }, s = MG.seeded(21);
    r('#1b2536', 0, 0, W, FLOOR); for (let sx = 0; sx < W; sx += 15) { r('#202c40', sx + 1, BEAM + 6, 13, FLOOR - BEAM - 8); r('#26344a', sx + 1, BEAM + 6, 13, .67); r('#141c2a', sx + 14, BEAM + 6, 1, FLOOR - BEAM - 8); }
    r('#141c2a', 0, 0, W, 13);
    for (let sx = 0; sx < W; sx += 15) { r('#202c40', sx + 1, 15, 13, BEAM - 17); r('#26344a', sx + 1, 15, 13, .67); }
    /* the beam: a sturdy top shelf, still on the wall */
    r('#1a0f14', 0, BEAM - .33, W, 5); r('#8a5a2b', 0, BEAM, W, 4); r('#c08a4a', 0, BEAM, W, .67); r('#5a3517', 0, BEAM + 3.33, W, .67);
    for (const bx of [14, 104]) { r('#1a0f14', bx - .33, BEAM + 4, 4.67, 6); r('#5a3517', bx, BEAM + 4, 4, 5.67); r('#8a5a2b', bx, BEAM + 4, 1, 5.67); }
    for (let bx = 1, i = 0; bx < 26; i++) { const w = 3 + Math.floor(s() * 3) / 3 * 2, h = 9 + Math.floor(s() * 4), c = BANDS[i % 6].col; r('#1a0f14', bx - .33, BEAM - h - .33, w + .67, h + .33); r(c[0], bx, BEAM - h, w, h); r(c[1], bx, BEAM - h, w - .67, h - .67); r('#ffd23a', bx, BEAM - h + 2, w - .67, .67); bx += w + .67; }   /* the books that stayed put */
    /* where the shelf used to sit: two brackets, one snapped */
    r('#1a0f14', 23.67, SHELF + 4.67, 4.67, 9.67); r('#5a5a66', 24, SHELF + 5, 4, 9); r('#b8b8c4', 24, SHELF + 5, 1, 9);
    r('#1a0f14', 91.67, SHELF + 4.67, 4.67, 4.67); r('#5a5a66', 92, SHELF + 5, 4, 4); r('#b8b8c4', 92, SHELF + 5, 1, 4);
    r('#1a0f14', 94.67, SHELF + 9, 2.33, 5.67); r('#5a5a66', 95, SHELF + 9.33, 1.67, 5); r('#1a0f14', 96.33, SHELF + 13.67, 3, 1.67);    /* bent */
    for (const [cx, cy] of [[20, SHELF + 2], [60, SHELF + 2], [96, SHELF + 2]]) { r('rgba(0,0,0,.22)', cx, cy, 1, 1); r('rgba(255,255,255,.06)', cx + 1, cy, 1, 1); }   /* old screw holes */
    /* the floor */
    r('#1a0f14', 0, FLOOR - .67, W, 1.33); r('#3a210d', 0, FLOOR - 4, W, 3.33); r('#5a3517', 0, FLOOR - 4, W, .67);
    for (let y = FLOOR + .67, i = 0; y < H; y += 5 + i, i++) { const bh = 5 + i; r(['#4a2a12', '#5a3517', '#523015'][i % 3], 0, y, W, bh); r('#6a4120', 0, y, W, .67); r('#2a170b', 0, y + bh - .67, W, .67); for (let sx = (i * 23) % 29; sx < W; sx += 29) r('#2a170b', sx, y, .67, bh); }
    /* a plate on the beam: whose shelf this is */
    const name = (R.deskName + ' SHELF').toUpperCase(), nw = textW(name, .5) + 4, nx = 58 - nw / 2;
    r('#1a0f14', nx - .67, BEAM + 5, nw + 1.33, 6.33); r(R.deskRamp[1], nx, BEAM + 5.33, nw, 5.67); r(R.deskRamp[2], nx, BEAM + 5.33, nw, .67);
    text(x, name, nx + 2, BEAM + 6.67, '#1a0f14', .5);
    r('rgba(0,0,0,.3)', 0, BEAM + 4.33, W, 1);
  });

  /* ---------- 3. tuning ---------- */
  const TUNE = {
    bands: LV < .45 ? 3 : 4,                                                       /* sections on the shelf */
    books: Math.round(lerp(9, 12, LV)),                                            /* spines in the fallen pile */
    swing: lerp(15, 16, LV),                                                       /* how far the shelf swings each way (units): always more than half a band */
    period: p => lerp(2.2, 1.65, LV) * lerp(1.05, .88, p),                         /* seconds for a full swing: quicker as it goes */
    grav: 520, v0: 18, speed: 112, pop: .26,                                       /* fall; fixer top speed; a new book reaching the hands */
  };
  const NB = TUNE.bands, SECW = NB === 3 ? 24 : 22, LEN = NB * SECW, ARM = LEN / 2 - 4, CHAIN = SHELF - HOOK;
  const fallT = (() => { const h = SHELF - 7.5 - (HANDS - 7.5); return (-TUNE.v0 + Math.sqrt(TUNE.v0 * TUNE.v0 + 2 * TUNE.grav * h)) / TUNE.grav; })();

  /* ---------- 4. state ---------- */
  let G;
  function reset() {
    const others = BANDS.filter(b => b.i !== R.desk); for (let i = others.length - 1; i > 0; i--) { const j = Math.floor(rng(i + 1)); [others[i], others[j]] = [others[j], others[i]]; }
    const bands = [BANDS[R.desk], ...others.slice(0, NB - 1)]; for (let i = bands.length - 1; i > 0; i--) { const j = Math.floor(rng(i + 1)); [bands[i], bands[j]] = [bands[j], bands[i]]; }
    const pile = []; for (let i = 0; i < TUNE.books; i++) { let b; do b = Math.floor(rng(NB)); while (i > 1 && b === pile[i - 1] && b === pile[i - 2]); pile.push(b); }
    G = {
      bands, pile, held: null, pop: .45, falling: [], floor: [], sec: bands.map(() => [{ t: 9, sq: 0 }]),     /* each section starts with one book standing in it */
      x: 30, vx: 0, aim: 30, face: 1, walk: 0, keyed: false, dropQ: 0,
      phase: rng(Math.PI * 2), amp: 1, dip: 0, dipV: 0, creak: 0,
      shelved: 0, wrong: 0, missed: 0, combo: 0, bestCombo: 0, fixT: 0, fixPose: 'carry',
      bot: { plan: null, react: 0 },
    };
    ui.setScore(0);
  }
  const grade = () => G.shelved / TUNE.books;
  const stats = () => [['SHELVED', `${G.shelved} / ${TUNE.books}`], ['WRONG BAND', G.wrong], ['ON THE FLOOR', G.missed], ['BEST CHAIN', G.bestCombo]];

  /* the swing: two parallel chains, so the board stays level and rides a shallow arc */
  const angleAt = ph => Math.asin(clamp(TUNE.swing * G.amp / CHAIN, -.6, .6)) * Math.sin(ph);
  const boardX = (ph = G.phase) => 60 + CHAIN * Math.sin(angleAt(ph));
  const boardY = (ph = G.phase) => HOOK + CHAIN * Math.cos(angleAt(ph)) + G.dip;
  const secLeft = (cx, i) => cx - LEN / 2 + i * SECW;

  /* ---------- 5. verbs: let go of the book overhead. A tap ahead of the fixer waits until he gets there (at most 1 s); keys let go at once. ---------- */
  function drop(now) {
    if (!R.live || G.held == null) return;
    if (!now && Math.abs(G.x - G.aim) > 1.5) { G.dropQ = 1; return; }
    G.dropQ = 0;
    G.falling.push({ b: G.held, x: G.x, y: HANDS - 7.5, vx: 0, vy: TUNE.v0, rot: 0, spin: (rng() < .5 ? -1 : 1) * rng(7, 11), state: 'fall' });
    G.held = null; G.pop = G.pile.length ? TUNE.pop : -1; G.fixT = .22; G.fixPose = 'carry';
    sfx.tone(520, 300, .07, 'triangle', .04); G.bot.plan = null;
  }
  function landOn(f, cx, by) {                                                      /* a spine meets the board: right band, wrong band, or off the end */
    const u = f.x - (cx - LEN / 2); if (u < -1.5 || u > LEN + 1.5) return false;   /* a hair past either end still counts as the end section */
    const i = clamp(Math.floor(u / SECW), 0, NB - 1), band = G.bands[i];
    if (G.bands[f.b] === band) {
      G.sec[i].push({ t: 0, sq: 1 }); f.state = 'done'; G.shelved++; G.combo++; G.bestCombo = Math.max(G.bestCombo, G.combo);
      G.dipV += 26; ui.setScore(G.shelved); ui.bump(); ui.setCombo(G.combo, 1); if (G.combo >= 3) ui.pulseCombo();
      sfx.clack(6); sfx.ding(Math.min(8, G.combo + 1)); fx.burst(f.x, by - 2, [band.col[2], band.col[1], '#fff6d6'], 8, 36, 90, .35); fx.ring(f.x, by - 6, band.col[2], 10);
      ui.floatText(f.x, by - 20, G.combo % 4 === 0 ? `${G.combo} IN A ROW!` : 'SHELVED!', 'gold');
      if (G.combo % 4 === 0) { sfx.golden(); MG.hitstop(.05); }
      G.fixT = .4; G.fixPose = 'cheer';
    } else {                                                                        /* the wrong band: it bounces off and the shelf lurches */
      f.state = 'bounce'; f.vy = -62; f.vx = (f.x < cx ? -1 : 1) * rng(22, 34); f.spin *= 1.4; G.wrong++; G.combo = 0; ui.setCombo(0, 1);
      G.amp = Math.min(1.45, G.amp + .16); G.dipV += 14;
      sfx.bonk(); R.shake(2.5); ui.floatText(f.x, by - 20, 'WRONG BAND!', 'bad'); fx.burst(f.x, by - 2, ['#ff7a6a', '#fff6d6'], 6, 40, 90, .35);
      G.fixT = .5; G.fixPose = 'scared';
    }
    return true;
  }

  /* ---------- 6. update ---------- */
  function update(dt) {
    const p = R.progress;
    G.phase += dt * Math.PI * 2 / TUNE.period(p); G.amp = Math.max(1, G.amp - dt * .25);
    G.dipV -= (G.dip * 120 + G.dipV * 9) * dt; G.dip += G.dipV * dt;               /* the board bobs on its chains when something lands */
    if (Math.cos(G.phase) * Math.cos(G.phase - dt * 6) < 0 && (G.creak -= 1) <= 0) { G.creak = 1; sfx.tone(180, 150, .12, 'sawtooth', .012); }   /* creak at the turn */
    /* the fixer on the beam: keys steer, otherwise ease toward the aim (pointer or bot) */
    const ax = R.axisX(); if (ax) { G.keyed = true; G.aim = clamp(G.x + ax * 30, X_MIN, X_MAX); } else if (G.keyed) { G.keyed = false; G.aim = G.x; }
    const want = R.live ? clamp((G.aim - G.x) * 12, -TUNE.speed, TUNE.speed) : 0;
    G.vx = lerp(G.vx, want, Math.min(1, dt * 18)); G.x = clamp(G.x + G.vx * dt, X_MIN, X_MAX);
    if (Math.abs(G.vx) > 6) { G.walk += Math.abs(G.vx) * dt; G.face = Math.sign(G.vx); }
    G.fixT = Math.max(0, G.fixT - dt);
    if (G.dropQ > 0 && ((G.dropQ -= dt) <= 0 || Math.abs(G.x - G.aim) <= 1.5)) drop(true);
    if (G.held == null && G.pop > 0 && R.live) { G.pop -= dt; if (G.pop <= 0) { G.held = G.pile.shift(); sfx.tone(700, 900, .05, 'square', .03); } }
    /* spines in the air */
    const cx = boardX(), by = boardY();
    for (const f of G.falling) {
      const y0 = f.y; f.vy += TUNE.grav * dt; f.x += f.vx * dt; f.y += f.vy * dt; f.rot += f.spin * dt;
      if (f.state === 'fall' && y0 + 7.5 < by && f.y + 7.5 >= by) landOn(f, cx, by);
      if (f.state !== 'done' && f.y + 2.5 >= FLOOR) {                                /* on the floor, flat */
        if (f.state === 'fall') { G.missed++; G.combo = 0; ui.setCombo(0, 1); ui.floatText(f.x, FLOOR - 12, 'MISSED!', 'bad'); sfx.miss(); G.fixT = .4; G.fixPose = 'scared'; }
        f.state = 'done'; G.floor.push({ x: clamp(f.x, 6, W - 6), b: f.b, k: rng() < .5 ? 4 : 3 + Math.floor(rng(3)) });
        sfx.thud(); fx.puff(f.x, FLOOR - 1, '#8a6a4a', 4);
      }
    }
    G.falling = G.falling.filter(f => f.state !== 'done');
    for (const s of G.sec) for (const b of s) { b.t += dt; b.sq = Math.max(0, b.sq - dt * 5); }
    if (R.live && G.held == null && !G.pile.length && !G.falling.length) R.end();    /* the pile is done: finish early */
  }

  /* ---------- 7. bot: watches the swing like a person, picks the soonest moment it can be over its band when the book arrives,
     walks there and lets go; a little aim and timing slop, and now and then a real fumble ---------- */
  function bot(dt) {
    const B = G.bot;
    if (G.held == null) { B.plan = null; B.react = rng(.12, .26); return; }
    if ((B.react -= dt) > 0) return;
    const w = 2 * Math.PI / TUNE.period(R.progress);
    if (!B.plan) {
      /* a person's slop: aim a few units off, let go a beat early or late; sometimes misjudge the swing badly or misread the colour */
      const i = rng() < .025 ? (G.held + (rng() < .5 ? NB - 1 : 1)) % NB : G.held;
      const err = rng() < lerp(.17, .14, LV) ? (rng() < .5 ? -1 : 1) * SECW * rng(.6, .95) : rng(-6, 6), jit = rng() < .1 ? (rng() < .5 ? -1 : 1) * rng(.2, .34) : rng(-.12, .12);
      for (let d = .05; d < 2.4; d += 1 / 30) {
        const tx = secLeft(boardX(G.phase + w * (d + fallT)), i) + SECW / 2 + err;
        if (tx < X_MIN || tx > X_MAX) continue;
        if (Math.abs(tx - G.x) / (TUNE.speed * .8) + .08 <= d) { B.plan = { tx, at: d + jit, t: 0 }; break; }
      }
      if (!B.plan) return;
    }
    B.plan.t += dt; G.aim = B.plan.tx;
    if (B.plan.t >= B.plan.at) { if (Math.abs(G.x - B.plan.tx) < 2.5) drop(true); else if (B.plan.t > B.plan.at + .25) B.plan = null; }
  }

  /* ---------- 8. draw ---------- */
  const spr = (b, rot) => { const k = ((Math.round(rot / (Math.PI / TURNS)) % TURNS) + TURNS) % TURNS; return G.bands[b].spr[k]; };
  function drawChain(x0, y0, x1, y1) {
    const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 2.33);
    for (let k = 0; k <= n; k++) { const f = k / n, x = Math.round(lerp(x0, x1, f) * 3) / 3, y = Math.round(lerp(y0, y1, f) * 3) / 3; g.fillStyle = '#1a0f14'; g.fillRect(x - .67, y - .67, 1.67, 1.67); g.fillStyle = k % 2 ? '#8a8a96' : '#b8b8c4'; g.fillRect(x - .33, y - .33, 1, 1); }
  }
  function drawBoard(now) {
    const cx = boardX(), by = Math.round(boardY() * 3) / 3, x0 = Math.round((cx - LEN / 2) * 3) / 3;
    drawChain(60 - ARM, HOOK, cx - ARM, by - 1); drawChain(60 + ARM, HOOK, cx + ARM, by - 1);
    G.bands.forEach((band, i) => {                                                 /* the books standing in each section */
      const s = G.sec[i], sx = x0 + i * SECW + 1.67, room = SECW - 3.33, step = Math.min(5.33, (room - 5) / Math.max(1, s.length - 1));
      s.forEach((b, k) => { const sp = band.spr[0], sq = b.sq > 0 ? b.sq : 0; st.hi(sp, sx + 2.5 + k * step - sp.width / 6, by - 7.5 - sp.height / 6 + sq * 1.33); });
    });
    g.fillStyle = '#1a0f14'; g.fillRect(x0 - .67, by - .33, LEN + 1.33, 4.33);       /* the board, with a band plate under each section */
    g.fillStyle = '#8a5a2b'; g.fillRect(x0, by, LEN, 3.33); g.fillStyle = '#c08a4a'; g.fillRect(x0, by, LEN, .67);
    G.bands.forEach((band, i) => {
      const sx = x0 + i * SECW; g.fillStyle = '#1a0f14'; g.fillRect(sx + 1, by + 3.67, SECW - 2, 6.33);
      g.fillStyle = band.col[1]; g.fillRect(sx + 1.33, by + 3.67, SECW - 2.67, 6); g.fillStyle = band.col[2]; g.fillRect(sx + 1.33, by + 3.67, SECW - 2.67, .67); g.fillStyle = band.col[0]; g.fillRect(sx + 1.33, by + 9, SECW - 2.67, .67);
      const tw = textW(band.label, .5); text(g, band.label, sx + SECW / 2 - tw / 2, by + 5.33, '#1a0f14', .5);
      if (i) { g.fillStyle = '#1a0f14'; g.fillRect(sx - .67, by - 7, 1.33, 7); g.fillStyle = '#b8b8c4'; g.fillRect(sx - .33, by - 6.67, .67, 6.67); }   /* bookends */
    });
  }
  function drawPile() {
    const n = G.pile.length;
    for (let k = 0; k < Math.min(4, n); k++) { const b = G.pile[k], col = G.bands[b].col, y = BEAM - 3.33 * (k + 1), x = PILE_X - 7 + (k % 2) * .67; g.fillStyle = '#1a0f14'; g.fillRect(x - .33, y - .33, 15.67, 3.67); g.fillStyle = col[1]; g.fillRect(x, y, 15, 3); g.fillStyle = col[2]; g.fillRect(x, y, 15, .67); g.fillStyle = '#ffd23a'; g.fillRect(x + 2, y + .67, .67, 2); g.fillRect(x + 12.33, y + .67, .67, 2); }
    if (n > 4) { const t = '+' + (n - 4), tw = textW(t, .5); text(g, t, PILE_X - tw / 2, BEAM - 3.33 * 4 - 5, '#fff6d6', .5); }
  }
  function draw() {
    const now = performance.now() / 1000;
    st.hi(ROOM, 0, 0);
    for (const f of G.floor) { const sp = G.bands[f.b].spr[f.k]; st.hi(sp, f.x - sp.width / 6, FLOOR + 1 - sp.height / 6); }
    drawBoard(now); drawPile();
    /* the fixer on the beam, the next spine overhead (it pops over from the pile) */
    const walking = Math.abs(G.vx) > 8, pose = R.done ? (R.won ? 'cheer' : 'scared') : G.fixT > 0 ? G.fixPose : G.held != null ? (walking ? (Math.floor(G.walk / 5) % 2 ? 'hold1' : 'hold2') : 'hold0') : 'idle';
    R.crew(G.x, BEAM, pose, { flip: G.face < 0 });
    if (G.held != null && !R.done) {
      const sp = G.bands[G.held].spr[0], hx = G.x, hy = HANDS - 7.5;
      st.hi(sp, hx - sp.width / 6, hy - sp.height / 6);
      const tx = Math.round(hx * 3) / 3;                                            /* a faint drop line so the aim is readable */
      for (let y = HANDS + 2; y < boardY() - 16; y += 4) { g.fillStyle = 'rgba(255,246,214,.18)'; g.fillRect(tx - .33, y, .67, 1.67); }
    } else if (G.pop > 0 && G.pop < TUNE.pop && G.pile.length) {
      const f = 1 - G.pop / TUNE.pop, sp = G.bands[G.pile[0]].spr[Math.round(f * 4) % TURNS], x = lerp(PILE_X, G.x, f), y = lerp(BEAM - 6, HANDS - 7.5, f) - Math.sin(f * Math.PI) * 10;
      st.hi(sp, x - sp.width / 6, y - sp.height / 6);
    }
    for (const f of G.falling) { const sp = spr(f.b, f.rot); st.hi(sp, f.x - sp.width / 6, f.y - sp.height / 6); }
    fx.draw(g);
  }

  /* ---------- 9. input + run. Pointer: the mouse aims by hovering (or dragging), a finger by dragging; letting go drops the book. ---------- */
  window.SHELF = { get G() { return G; }, drop, TUNE, boardX, SECW };
  R.run({
    reset, update, draw, grade, stats, bot,
    ended() { if (R.won) G.bands.forEach((b, i) => fx.burst(boardX() - LEN / 2 + (i + .5) * SECW, boardY() - 8, [b.col[2], '#fff6d6'], 5, 30, 60, .4)); },
    down(x, y, ev) { G.aim = clamp(x, X_MIN, X_MAX); },
    move(x, y, ev) { if (ev.pointerType === 'mouse' || R.ptr.down) G.aim = clamp(x, X_MIN, X_MAX); },
    up(x, y, ev) { if (R.live) drop(); },                                          /* any release lets go: a click, or a drag as on touch */
    key(ev, k) { if (!ev.repeat && (k === ' ' || k === 'arrowdown' || k === 's' || k === 'enter')) drop(true); },
  });
})();
