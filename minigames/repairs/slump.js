/* ============================================================
   TITLES IN A SLUMP (repair "slump", verb SERVE, 15 s).
   Nobody is buying the desk's titles. Bored readers queue at the bookshop counter, each with a wish bubble: a genre, shown as
   a cover colour plus an icon. Tap the matching stack and the book flies to the reader at the counter; the wrong book bounces off
   their head and the fixer fumbles (the stacks are out of reach for a beat). Readers who wait too long storm out. The sales chart
   on the wall climbs with every sale (the slump turning round).
   Grade = sold / (sold + walked out + 2 x wrong books), so guessing costs more than it earns.
   Level: 3 then 4 genres, faster arrivals, less patience, two-book wishes.
   Controls: tap / click a stack, or keys 1-4.
   Layout of this file (as leak.js): 1 sprites · 2 setup · 3 tuning · 4 state · 5 verbs · 6 update · 7 bot · 8 draw · 9 run.
   ============================================================ */
(() => {
  'use strict';
  const { clamp, lerp, sfx } = MG;
  const { R: AR, DEF, shapes: { box } } = MGArt, { make, hl, cvs, text, textW } = MGArt3;

  /* ---------- 1. sprites that don't need the desk colour ---------- */
  const px7 = s => s.split(' ').map(r => [...r].map(c => c === '#'));               /* a 7x7 icon from '#' rows */
  const GENRES = [                                                                  /* IMI's imprint genres (layers.js): a cover ramp + an icon */
    { k: 'MYSTERY', rk: 'drop', gl: '#1a0f14', g: px7('.#####. ##...## ....##. ...##.. ...##.. ....... ...##..') },
    { k: 'ROMANCE', rk: 'red', gl: '#fff6d6', g: px7('.##.##. ####### ####### .#####. ..###.. ...#... .......') },
    { k: 'SCI-FI', rk: 'grape', gl: '#fff6d6', g: px7('..###.. .##.##. ####### #.#.#.# ####### .#...#. #.....#') },
    { k: 'HORROR', rk: 'ink', gl: '#fff6d6', g: px7('.#####. ####### #..#..# ####### .##.##. .#####. .#.#.#.') },
    { k: 'COMEDY', rk: 'banY', gl: '#1a0f14', g: px7('.#####. ####### ##.#.## ####### #.###.# ##...## .#####.') },
    { k: 'POETRY', rk: 'leaf', gl: '#fff6d6', g: px7('.....## ....### ...###. ..###.. .###... .#..... #......') },
  ];
  /* a front cover, face-out: spine strip, page block, the genre icon. p = hi-res px per icon pixel (3: 11.7x14 units, 2: 8x9.3) */
  function coverSpr(G, p, rampOver) {
    const gw = 7 * p, sp = p + 1, w = sp + gw + 2 * p + p + 2, h = gw + 5 * p + 2;
    const cv = make(w, h, px => {
      px.shape(box(w - p - 2, 2, p, h - 4), AR.paper, 1);
      px.shape(box(1, 1, w - p - 3, h - 2), rampOver || AR[G.rk], 2);
      hl(px, 2, 2, sp - 1, h - 4, 0);                                                /* the spine, in shadow */
    });
    if (G) {
      const x = cv.getContext('2d'), gx = 1 + sp + p, gy = Math.round((h - gw) / 2) - 1;
      G.g.forEach((row, j) => row.forEach((on, i) => { if (on) { x.fillStyle = 'rgba(13,7,8,.45)'; x.fillRect(gx + i * p + 1, gy + j * p + 1, p, p); } }));
      G.g.forEach((row, j) => row.forEach((on, i) => { if (on) { x.fillStyle = G.gl; x.fillRect(gx + i * p, gy + j * p, p, p); } }));
    }
    return cv;
  }
  GENRES.forEach(G => { G.col = DEF[G.rk]; G.big = coverSpr(G, 3); G.small = coverSpr(G, 2); });
  const BOOK_ICON = coverSpr(null, 2, MGRepair.deskR(MGRepair.params.desk));          /* the HUD counter: a plain book in the desk colour */
  const READERS = ['v02', 'v04', 'v05', 'v07', 'v10', 'v14', 'v16', 'v18', 'v23', 'v25', 'v27', 'v28', 'v30', 'v12'].filter(v => v !== MGCrew.look() && MGCrew.ids().includes(v));

  /* ---------- 2. setup ---------- */
  const R = MGRepair.setup({
    id: 'slump', verb: 'SERVE', scoreIcon: BOOK_ICON, howAt: 54,                  /* in the strip between the chart and the bubbles: the chart + SLUMP stay in view */
    how: 'Tap the book they <em>wish</em> for',
    legend: [[GENRES[1].big, 'readers <em>wish</em> for a genre'], [GENRES[4].big, '<em>tap</em> the matching stack'], [GENRES[3].big, 'too slow and they <em class="bad">walk out</em>']],
    hint: 'tap a stack · keys 1-4',
  });
  const { st, g, W, H, ui, fx, rng, level: LV } = R;

  /* the shop, painted once: wallpaper, a back shelf, the door, the chart frame (BACK); the counter and the floor (FRONT) */
  const COUNTER = 104, FOOT = 107, SLOT = [42, 58, 73, 88, 103], DOOR_X = 127, FIX_X = 12, STACK_Y = 106, BASE = 151, BOOK_H = 3.67;
  const CH = { x: 7, y: 28, w: 44, h: 22 };                                          /* the chart's plot area */
  const [dSh, dBase, dLi] = R.deskRamp;
  const BACK = cvs(W * 3, H * 3, x => {
    x.scale(3, 3); const r = (c, a, b, w, hh) => { x.fillStyle = c; x.fillRect(a, b, w, hh); }, s = MG.seeded(5);
    r('#120a0c', 0, 0, W, 12); r('#183232', 0, 12, W, COUNTER - 12);                                                            /* wallpaper */
    for (let sx = 0; sx < W; sx += 6) r('#1c3a37', sx, 14, 3, 52);
    for (let y = 20; y < 64; y += 8) for (let sx = (y % 16 ? 3 : 0); sx < W; sx += 6) r('#21433f', sx + 1, y, 1, 1);
    r('#132828', 0, 67, W, COUNTER - 67); for (let sx = 0; sx < W; sx += 12) r('#112424', sx, 68, 1, COUNTER - 68);
    r('#1a0f14', 0, 65.33, W, 2); r('#8a5a2b', 0, 65.67, W, .67); r('#5a3517', 0, 66.33, W, .67);                                /* chair rail */
    r('#1a0f14', 0, 12, W, 2.67); r('#5a3517', 0, 12.33, W, 2); r('#8a5a2b', 0, 12.33, W, .67);                                  /* cornice */
    /* the back shelf of unsold titles, dusty and dim */
    for (const sy of [30, 46]) {
      r('#1a0f14', 59, sy + 11, 38, 2.33); r('#6a4120', 59.33, sy + 11.33, 37.33, 1.33); r('#8a5a2b', 59.33, sy + 11.33, 37.33, .33);
      for (let bx = 60.33; bx < 95;) { const bw = 2.33 + Math.floor(s() * 4) / 3 * 2, bh = 7 + Math.floor(s() * 4); const c = ['#5a3a4a', '#3a4a5a', '#5a5030', '#3a5040', '#4a3a5a'][Math.floor(s() * 5)]; r('#0d0708', bx, sy + 11 - bh, bw, bh); r(c, bx + .33, sy + 11.33 - bh, bw - .67, bh - .67); r('rgba(255,255,255,.1)', bx + .33, sy + 11.33 - bh, bw - .67, .33); bx += bw + .33; }
      r('rgba(200,200,180,.08)', 60, sy + 2, 36, 1);                                                                              /* dust */
    }
    /* the door, with its OPEN card and a little bell */
    const DY = 32;
    r('#1a0f14', 98.67, DY - .67, 21.33, COUNTER - DY + .67); r('#8a5a2b', 99.33, DY, 20, COUNTER - DY); r('#b57d3e', 99.33, DY, 20, .67); r('#b57d3e', 99.33, DY, .67, COUNTER - DY);
    r('#1a0f14', 101.67, DY + 3, 15.33, 24); r('#2c4a62', 102.33, DY + 3.67, 14, 22.67); r('#3a6080', 102.33, DY + 3.67, 14, 6); r('rgba(255,255,255,.18)', 104, DY + 5.33, 1, 8); r('rgba(255,255,255,.18)', 105.33, DY + 5.33, .67, 4);
    r('#1a0f14', 101.67, DY + 30, 15.33, COUNTER - DY - 32); r('#6a4120', 102.33, DY + 30.67, 14, COUNTER - DY - 33.33); r('#5a3517', 104, DY + 33, 10.67, 18); r('#5a3517', 104, DY + 54, 10.67, 18);
    r('#c98f0e', 116, DY + 36, 1.33, 3); r('#ffd23a', 116, DY + 36, .67, 1);
    r('#1a0f14', 103.67, DY + 13.33, 11.33, 7); r('#fff6d6', 104, DY + 13.67, 10.67, 6.33); text(x, 'OPEN', 104.73, DY + 15.33, '#b8322a', .4);
    r('#1a0f14', 108.67, DY - 4, 3.33, 3.67); r('#ffd23a', 109, DY - 3.67, 2.67, 2.67); r('#fff08c', 109, DY - 3.67, 1, 1);
    /* the chart board: the frame here, the line drawn live */
    r('#1a0f14', 3, 16.33, 52.67, 39.67); r('#8a5a2b', 3.67, 17, 51.33, 38.33); r('#b57d3e', 3.67, 17, 51.33, .67);
    r('#1a0f14', 5.33, 18.67, 48, 35); r('#fff6d6', 5.67, 19, 47.33, 34.33); r('#ede0b8', 5.67, 52, 47.33, 1.33);
    text(x, 'SALES', 7.33, 20.67, '#1a0f14', .5);
    for (let i = 0; i <= 4; i++) r('#e0d0a8', CH.x, CH.y + i * CH.h / 4, CH.w, .33);
    r('#1a0f14', CH.x, CH.y, .67, CH.h + .33); r('#1a0f14', CH.x, CH.y + CH.h, CH.w, .67);
    r('#1a0f14', 28.33, 12, .67, 4.67); r('#1a0f14', 30, 12, .67, 4.67);                                                          /* it hangs from the cornice */
    /* the sign: this desk's imprint, in the desk colour */
    const name = (R.deskName + ' BOOKS').toUpperCase(), sw = textW(name, .5) + 5, sx0 = 88 - sw / 2;
    r('#1a0f14', sx0 - .67, 18.33, sw + 1.33, 9); r(dSh, sx0, 19, sw, 7.67); r(dBase, sx0, 19, sw, 6.67); r(dLi, sx0, 19, sw, .67);
    r('#1a0f14', sx0 + 4, 14.67, .67, 3.67); r('#1a0f14', sx0 + sw - 4.67, 14.67, .67, 3.67);
    text(x, name, sx0 + 2.5, 20.67, '#1a0f14', .5);
    x.fillStyle = 'rgba(255,214,140,.05)'; for (let k = 0; k < 4; k++) x.fillRect(20 - k * 6, 70 + k * 3, 44 + k * 12, COUNTER - 70 - k * 3);   /* warm light over the till */
  });
  const FRONT = cvs(W * 3, H * 3, x => {
    x.scale(3, 3); const r = (c, a, b, w, hh) => { x.fillStyle = c; x.fillRect(a, b, w, hh); }, s = MG.seeded(9), C = COUNTER;
    r('#1a0f14', 0, C - .67, W, 1.33); r('#e8b878', 0, C - .33, W, .67); r('#c08a4a', 0, C + .33, W, 2.33); r('#7a4a1e', 0, C + 2.67, W, .67);
    r('#1a0f14', 0, C + 3.33, W, 9); r('#6a4120', 0, C + 3.67, W, 8);
    r(dSh, 0, C + 4.33, W, 2); r(dBase, 0, C + 4.33, W, 1.33); r(dLi, 0, C + 4.33, W, .33);                                        /* the desk-colour trim */
    for (let sx = 5; sx < W; sx += 10) { r('#4a2a12', sx, C + 6.67, .67, 5); r('#7a4a1e', sx + .67, C + 6.67, .33, 5); }
    for (let y = C + 12.33, i = 0; y < H; y += 6 + i, i++) {                                                                        /* floor boards */
      const bh = 6 + i; r(['#4a2a12', '#5a3517', '#523015'][i % 3], 0, y, W, bh); r('#6a4120', 0, y, W, .67); r('#2a170b', 0, y + bh - .67, W, .67);
      for (let sx = (i * 23) % 29; sx < W; sx += 29 + i * 3) r('#2a170b', sx, y, .67, bh);
      for (let k = 0; k < 5; k++) r('#4a2a12', Math.floor(s() * W), y + 1 + Math.floor(s() * (bh - 2)), 3 + Math.floor(s() * 5), .67);
    }
    r('rgba(0,0,0,.35)', 0, C + 12.33, W, 2.33);
    /* the till, on the counter between the fixer and the reader */
    r('#1a0f14', 22.33, C - 10, 11.33, 9.67); r('#5a5a66', 22.67, C - 9.67, 10.67, 9.33); r('#b8b8c4', 22.67, C - 9.67, 10.67, 6); r('#f0f0f8', 22.67, C - 9.67, 10.67, .67);
    r('#1a0f14', 24, C - 13, 8, 3.67); r('#2a3a2a', 24.33, C - 12.67, 7.33, 3); r('#7be05a', 25, C - 11.67, 4, 1);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) r('#3a2a30', 24 + i * 3, C - 8 + j * 2, 2, 1.33);
  });

  /* ---------- 3. tuning ---------- */
  const TUNE = {
    genres: LV < .45 ? 3 : 4,                                                      /* stacks under the counter */
    every: p => lerp(.86, .64, LV) * lerp(1.2, lerp(.47, .72, LV), p),              /* seconds between readers at the door: the rush builds (at level 1 not past a quick hand) */
    patience: lerp(3.8, 2.9, LV),                                                    /* seconds a reader stands in line before storming out */
    double: p => LV < .35 || p < .12 ? 0 : lerp(.12, .32, (LV - .35) / .65),       /* chance a reader wants two books */
    walk: 100, fly: .2,                                                             /* queue walking speed (units/s); book flight time */
    fumble: .35,                                                                    /* after a wrong book the stacks are out of reach this long */
  };
  const N = TUNE.genres, CW = (W - 4) / N, stackX = k => 2 + CW * (k + .5);

  /* ---------- 4. state ---------- */
  let G;
  function newReader(i, x) {
    const dbl = rng() < TUNE.double(R.progress), a = Math.floor(rng(N));
    let b = Math.floor(rng(N - 1)); if (b >= a) b++;
    const last = G && G.lastWant, want = dbl ? [a, b] : [a === last && rng() < .5 ? b : a];
    if (G) G.lastWant = want[0];
    const max = TUNE.patience * (dbl ? 1.45 : 1);
    return { look: READERS[Math.floor(rng(READERS.length))], x, want, got: want.map(() => false), pat: max, max, t: 0, mood: 0, bump: 0, state: 'q', walk: rng(10) };
  }
  function reset() {
    const order = GENRES.map((_, i) => i); for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(rng(i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    G = {
      shelf: order.slice(0, N).map(i => GENRES[i]),                                  /* which genre sits in each stack this run */
      q: [], gone: [], books: [], lastWant: -1,
      spawnT: .9, sold: 0, walked: 0, wrong: 0, combo: 0, bestCombo: 0,
      sales: .16, chart: [.82, .86, .8, .72, .74, .6, .52, .4, .3, .26, .2, .16], chartT: 0,
      press: Array(N).fill(0), fixT: 0, fixPose: 'idle', fumble: 0,
      bot: { who: null, t: 0 },
    };
    G.q.push(newReader(0, SLOT[0]), newReader(1, SLOT[1]));                          /* two readers are already waiting when it starts */
    G.q[1].pat -= .6;
    ui.setScore(0);
  }
  const grade = () => G.sold / Math.max(1, G.sold + G.walked + 2 * G.wrong);       /* a wrong book counts double: mashing the stacks can't pass */
  const stats = () => [['SOLD', G.sold], ['WALKED OUT', G.walked], ['WRONG BOOKS', G.wrong], ['BEST CHAIN', G.bestCombo]];

  /* ---------- 5. verbs: serve a stack's book to the reader at the counter ---------- */
  const atCounter = () => { const r = G.q[0]; return r && Math.abs(r.x - SLOT[0]) < 8 ? r : null; };
  function serve(k) {
    if (!R.live || k < 0 || k >= N) return;
    if (G.fumble > 0) { sfx.tone(140, 110, .03, 'square', .02); return; }          /* still fumbling the last one: no book */
    G.press[k] = .14; sfx.clack(4 + k);
    const r = atCounter();
    if (!r) { sfx.miss(); ui.floatText(stackX(k), STACK_Y + 6, 'NO ONE YET', ''); return; }
    const i = r.want.findIndex((w, j) => w === k && !r.got[j]);
    G.books.push({ gi: k, x0: stackX(k), y0: 132, x1: r.x - 3, y1: FOOT - 13, t: 0, ok: i >= 0, vx: 0, vy: 0 });
    G.fixT = .22; G.fixPose = 'carry';
    if (i < 0) {                                                                    /* the wrong book: it bounces off, they lose patience */
      G.wrong++; G.combo = 0; ui.setCombo(0, 1); r.pat = Math.max(.4, r.pat - 1); r.bump = .35; G.fumble = TUNE.fumble; G.fixT = TUNE.fumble; G.fixPose = 'squish';
      G.sales = Math.max(0, G.sales - .04);
      sfx.typo(); R.shake(1.5); ui.floatText(r.x, 64, 'NOT THAT!', 'bad');
      return;
    }
    r.got[i] = true;
    if (!r.got.every(Boolean)) { sfx.ding(2); fx.burst(r.x, FOOT - 22, [G.shelf[k].col[2], '#fff6d6'], 4, 26, 80, .3); return; }
    /* every wish granted: SOLD. They leave happy; the queue shuffles up. */
    G.q.shift(); r.state = 'happy'; r.t = -TUNE.fly; G.gone.push(r);
    G.sold++; G.combo++; G.bestCombo = Math.max(G.bestCombo, G.combo); G.sales = Math.min(1, G.sales + .1 + .02 * r.want.length);
    ui.setScore(G.sold); ui.bump(); ui.setCombo(G.combo, 1); if (G.combo >= 3) ui.pulseCombo();
    sfx.tone(1318, 1318, .05, 'square', .04, TUNE.fly); sfx.tone(1760, 1760, .09, 'square', .04, TUNE.fly + .05); sfx.noise(.05, .03, 4000, TUNE.fly);   /* ka-ching */
    if (G.combo % 5 === 0) { ui.floatText(W / 2, 58, `${G.combo} IN A ROW!`, 'gold'); sfx.golden(); MG.hitstop(.05); G.fixT = .6; G.fixPose = 'cheer'; }
    else ui.floatText(r.x, 64, r.want.length > 1 ? 'SOLD x2!' : 'SOLD!', 'gold');
  }
  function walkOut(r, why = 'HMPH!') {                                              /* out of patience: HMPH, and out the door */
    G.q.splice(G.q.indexOf(r), 1); r.state = 'angry'; r.t = 0; G.gone.push(r);
    G.walked++; G.combo = 0; ui.setCombo(0, 1); G.sales = Math.max(0, G.sales - .12);
    sfx.bonk(); R.shake(2.5); ui.floatText(Math.min(r.x, W - 14), 64, why, 'bad'); fx.burst(r.x, FOOT - 20, ['#c0392b', '#ff7a6a', '#fff6d6'], 8, 50, 90, .45);
    G.fixT = .5; G.fixPose = 'scared';
  }

  /* ---------- 6. update ---------- */
  function update(dt) {
    const p = R.progress;
    for (let k = 0; k < N; k++) G.press[k] = Math.max(0, G.press[k] - dt);
    G.fixT = Math.max(0, G.fixT - dt); G.fumble = Math.max(0, G.fumble - dt);
    if (R.live && (G.spawnT -= dt) <= 0) {                                          /* the door: a new reader walks in */
      G.spawnT = TUNE.every(p) * rng(.8, 1.2);
      if (G.q.length < SLOT.length) { G.q.push(newReader(G.q.length, DOOR_X)); sfx.tone(2093, 2093, .06, 'sine', .025); sfx.tone(2637, 2637, .08, 'sine', .02, .07); }
      else { const r = newReader(0, DOOR_X - 6); G.q.push(r); walkOut(r, 'FULL!'); }  /* the line is out the door: this one gives up at once */
    }
    for (let i = 0; i < G.q.length; i++) {
      const r = G.q[i], tx = SLOT[i], d = tx - r.x;
      r.x += Math.sign(d) * Math.min(Math.abs(d), TUNE.walk * dt); r.walk += Math.abs(d) > .4 ? dt : 0;
      r.t += dt; r.bump = Math.max(0, r.bump - dt);
      if (R.live && Math.abs(d) < .5) { r.pat -= dt; if (r.pat <= 0) { walkOut(r); i--; } }   /* only standing in line wears patience down */
    }
    for (const r of G.gone) {
      r.t += dt;
      if (r.t > 0 && (r.state === 'angry' || r.t > .35)) { r.x += (r.state === 'angry' ? 1 : -1) * (r.state === 'angry' ? 90 : 60) * dt; r.walk += dt; }
      if (r.x < -16 || r.x > W + 16) r.dead = true;
    }
    G.gone = G.gone.filter(r => !r.dead);
    for (const b of G.books) {                                                      /* books in flight; a wrong one bounces off */
      b.t += dt;
      if (b.t >= TUNE.fly && !b.landed) {
        b.landed = true;
        if (b.ok) { b.dead = true; fx.burst(b.x1, b.y1, [G.shelf[b.gi].col[2], '#ffd23a', '#fff6d6'], 6, 34, 90, .35); }
        else { b.x = b.x1; b.y = b.y1; b.vx = rng(-34, -18); b.vy = -46; fx.burst(b.x1, b.y1, ['#ff7a6a', '#fff6d6'], 4, 30, 90, .3); }
      }
      if (b.landed && !b.ok) { b.vy += 320 * dt; b.x += b.vx * dt; b.y += b.vy * dt; if (b.y > H + 10) b.dead = true; }
    }
    G.books = G.books.filter(b => !b.dead);
    if (R.live && (G.chartT -= dt) <= 0) { G.chartT = .3; G.chart.push(G.sales); if (G.chart.length > 23) G.chart.shift(); }
  }

  /* ---------- 7. bot: reads the wish of the reader at the counter (a beat to read it), taps that stack; now and then the wrong one ---------- */
  function bot(dt) {
    const B = G.bot, r = atCounter();
    if (!r) { B.who = null; return; }
    if (B.who !== r) { B.who = r; B.t = rng(.32, .6) + (rng() < .08 ? rng(.3, .7) : 0); return; }
    if ((B.t -= dt) > 0) return;
    const i = r.want.findIndex((w, j) => !r.got[j]); if (i < 0) return;
    let k = r.want[i]; if (rng() < .07) k = (k + 1 + Math.floor(rng(N - 1))) % N;
    serve(k); B.t = rng(.2, .34);
  }

  /* ---------- 8. draw ---------- */
  const PAT = f => f > .55 ? '#74c648' : f > .3 ? '#ffd23a' : '#e86a50';
  function drawChart(now) {
    const n = G.chart.length, sx = CH.w / 22, yOf = v => CH.y + CH.h - 1 - v * (CH.h - 2.5);
    for (let i = 1; i < n; i++) {                                                   /* the line: green going up, red going down */
      const a = G.chart[i - 1], b = G.chart[i], x0 = CH.x + 1 + (i - 1) * sx, col = b >= a ? '#2f8a35' : '#b8322a';
      for (let s = 0; s <= 6; s++) { const f = s / 6, x = x0 + f * sx, y = yOf(lerp(a, b, f)); g.fillStyle = col; g.fillRect(Math.round(x * 3) / 3, Math.round(y * 3) / 3 - .33, 1, 1); }
    }
    const v = G.chart[n - 1], up = v >= G.chart[Math.max(0, n - 4)], ex = CH.x + 1 + (n - 1) * sx, ey = Math.round(yOf(v) * 3) / 3;
    g.fillStyle = up ? '#2f8a35' : '#b8322a';                                        /* the arrowhead */
    if (up) { g.fillRect(ex - .33, ey - 2.67, 1, 1); g.fillRect(ex - 1.33, ey - 1.67, 3, 1); g.fillRect(ex - 2.33, ey - .67, 5, 1); }
    else { g.fillRect(ex - 2.33, ey, 5, 1); g.fillRect(ex - 1.33, ey + 1, 3, 1); g.fillRect(ex - .33, ey + 2, 1, 1); }
    if (!up && Math.floor(now * 3) % 2) text(g, 'SLUMP', 33, 20.67, '#b8322a', .5);
    else if (up && v > .55) text(g, 'UP!', 39, 20.67, '#2f8a35', .5);
  }
  function readerPose(r) {
    if (r.state === 'happy') return r.t < 0 ? 'idle' : r.t < .35 ? 'cheer' : Math.floor(r.walk * 9) % 2 ? 'run1' : 'run2';
    if (r.state === 'angry') return Math.floor(r.walk * 10) % 2 ? 'run1' : 'run2';
    if (r.bump > 0) return 'squish';
    if (Math.abs(r.x - (SLOT[G.q.indexOf(r)] ?? r.x)) > .5) return Math.floor(r.walk * 9) % 2 ? 'run1' : 'run2';
    if (R.done) return R.won ? 'cheer' : 'idle';
    return r.pat / r.max < .33 ? 'scared' : Math.floor(r.t * 1.5 + r.walk) % 2 ? 'breathe' : 'idle';
  }
  function drawReader(r, now) {
    const pose = readerPose(r), angry = r.state === 'angry', fl = r.state === 'happy' ? true : !angry;
    const shake = r.state === 'q' && r.pat / r.max < .33 && !R.done ? (Math.floor(now * 18) % 2 ? .33 : -.33) : 0;
    MGCrew.draw(st, pose, r.x + shake, FOOT, { look: r.look, flip: fl, hat: 0, expr: angry ? 'roaring' : undefined });
    if (r.state === 'happy' && r.t >= 0) { const c = G.shelf[r.want[0]].small; st.hi(c, r.x + (r.t < .35 ? -4 : -9), FOOT - 18); }     /* off with their book */
  }
  function bubble(r, i, now) {
    if (r.state !== 'q') return;
    const front = i === 0, n = r.want.length, frac = clamp(r.pat / r.max, 0, 1), low = frac < .33 && !R.done;
    const shake = low && Math.floor(now * 14) % 2 ? .33 : 0, spr = front ? 'big' : 'small';
    const cw = G.shelf[r.want[0]][spr].width / 3, ch = G.shelf[r.want[0]][spr].height / 3, pad = front ? 2 : 1.33;
    const bw = n * cw + (n - 1) * 1.33 + pad * 2, bh = ch + pad * 2 + (front ? 2.33 : 1.67), bx = Math.round((clamp(r.x - bw / 2, 1, W - bw - 1) + shake) * 3) / 3, by = Math.round(((front ? 85.67 : 87) - bh) * 3) / 3;
    g.fillStyle = '#1a0f14'; g.fillRect(bx - .67, by - .67, bw + 1.33, bh + 1.33); g.fillRect(r.x - 1.33, by + bh, 2.67, 2); g.fillRect(r.x - .67, by + bh + 2, 1.33, 1);
    g.fillStyle = low ? '#ffe0d8' : '#fff6d6'; g.fillRect(bx, by, bw, bh); g.fillRect(r.x - .67, by + bh, 1.33, 1.67);
    g.fillStyle = '#ffffff'; g.fillRect(bx, by, bw, .67);
    r.want.forEach((w, j) => {
      const c = G.shelf[w][spr], x = bx + pad + j * (cw + 1.33), y = by + pad;
      g.globalAlpha = r.got[j] ? .3 : 1; st.hi(c, x, y); g.globalAlpha = 1;
      if (r.got[j]) { g.fillStyle = '#2f8a35'; g.fillRect(x + cw / 2 - 3, y + ch / 2, 2, 2); g.fillRect(x + cw / 2 - 1, y + ch / 2 + 1.33, 2, 2); g.fillRect(x + cw / 2 + 1, y + ch / 2 - 2, 2, 3.33); }
    });
    const pw = bw - pad * 2, py = by + bh - (front ? 1.67 : 1.33);                    /* patience */
    g.fillStyle = '#1a0f14'; g.fillRect(bx + pad - .33, py - .33, pw + .67, front ? 1.33 : 1);
    g.fillStyle = low && Math.floor(now * 8) % 2 ? '#c0392b' : PAT(frac); g.fillRect(bx + pad, py, pw * frac, front ? .67 : .33 + .33);
  }
  function drawStack(k, now) {
    const G0 = G.shelf[k], cx = stackX(k), press = G.press[k] > 0 ? 1 : 0, bw = Math.min(CW - 7, 27), [sh, base, li] = G0.col, s = MG.seeded(k * 31 + 7), bh = BOOK_H;
    for (let i = 0; i < 5; i++) {                                                   /* the pile: books lying flat, spines out */
      const w = bw - Math.floor(s() * 4), x = Math.round((cx - w / 2 + (s() - .5) * 3) * 3) / 3, y = BASE - (i + 1) * bh + press * (i + 1) * .33;
      g.fillStyle = '#1a0f14'; g.fillRect(x - .33, y - .33, w + .67, bh + .67);
      g.fillStyle = base; g.fillRect(x, y, w, bh - .33); g.fillStyle = li; g.fillRect(x, y, w, .67); g.fillStyle = sh; g.fillRect(x, y + bh - 1, w, .67);
      g.fillStyle = '#ffd23a'; g.fillRect(x + 1.67, y + .67, .67, bh - 1.67); g.fillRect(x + w - 2.33, y + .67, .67, bh - 1.67);
      g.fillStyle = G0.gl === '#1a0f14' ? 'rgba(26,15,20,.5)' : 'rgba(255,246,214,.55)'; g.fillRect(x + 4, y + 1.33, Math.max(2, w * .35), .67);
    }
    const c = G0.big, top = BASE - 5 * bh + press * 1.33;
    st.hi(c, cx - c.width / 6, top - c.height / 3 + .67);                          /* the face-out copy on top */
    const lab = String(k + 1), lx = cx - 2.33;
    g.fillStyle = '#1a0f14'; g.fillRect(lx - .67, BASE + 1.33, 6, 6); g.fillStyle = '#fff6d6'; g.fillRect(lx - .33, BASE + 1.67, 5.33, 5.33);
    text(g, lab, lx + .83, BASE + 2.5, '#1a0f14', .67);
    if (press) { g.fillStyle = 'rgba(255,246,214,.2)'; g.fillRect(cx - CW / 2 + 1, COUNTER + 13, CW - 2, BASE - COUNTER - 6); }
    if (G.fumble > 0) { g.fillStyle = 'rgba(13,7,8,.45)'; g.fillRect(cx - CW / 2 + 1, COUNTER + 13, CW - 2, BASE - COUNTER - 6); }   /* fumbling: out of reach */
  }
  function draw() {
    const now = performance.now() / 1000;
    st.hi(BACK, 0, 0); drawChart(now);
    for (const r of G.gone) if (r.state === 'angry') drawReader(r, now);
    for (let i = G.q.length - 1; i >= 0; i--) drawReader(G.q[i], now);
    for (const r of G.gone) if (r.state === 'happy') drawReader(r, now);
    const fp = R.done ? (R.won ? 'cheer' : 'scared') : G.fixT > 0 ? G.fixPose : Math.floor(now * 1.4) % 2 ? 'breathe' : 'idle';
    R.crew(FIX_X, FOOT, fp);
    st.hi(FRONT, 0, 0);
    for (let i = G.q.length - 1; i >= 0; i--) bubble(G.q[i], i, now);
    for (let k = 0; k < N; k++) drawStack(k, now);
    for (const b of G.books) {
      const c = G.shelf[b.gi].small; let x, y;
      if (!b.landed) { const f = clamp(b.t / TUNE.fly, 0, 1); x = lerp(b.x0, b.x1, f); y = lerp(b.y0, b.y1, f) - Math.sin(f * Math.PI) * 16; }
      else { x = b.x; y = b.y; }
      st.hi(c, x - c.width / 6, y - c.height / 6);
    }
    fx.draw(g);
  }

  /* ---------- 9. input + run ---------- */
  window.SLUMP = { get G() { return G; }, serve, TUNE };
  R.run({
    reset, update, draw, grade, stats, bot,
    ended() { G.books = G.books.filter(b => b.landed); if (R.won) for (const r of G.q) fx.burst(r.x, FOOT - 18, ['#ffd23a', '#fff08c', '#74c648'], 5, 30, 80, .45); },
    down(x, y) { if (y >= STACK_Y) serve(clamp(Math.floor((x - 2) / CW), 0, N - 1)); },
    key(ev, k) { if (!ev.repeat && k >= '1' && k <= '4') serve(+k - 1); },
  });
})();
