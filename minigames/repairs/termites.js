/* ============================================================
   TERMITES IN THE WORD DRAWER (repair "termites", verb SQUISH, 12 s).
   The keeper's word drawer is pulled open (seen from above): six word cards lie on its floor and termites bore in through holes in the
   drawer walls, a puff of sawdust first, then a pale termite making a beeline for the nearest card. Once it reaches a card it nibbles
   chunks out of the edge until the card is gone, then moves on. The fixer hops wherever you tap and lands with a stomp: every termite
   under its feet is squished. Squish the whole colony and the drawer is clear (it ends early).
   Grade = how much of the six cards is left (each card 0..1, averaged). Level: more termites (15 -> 17), faster, nibbling harder, out
   sooner, more often in pairs, and from .5 a knot-hole in the middle of the floor that lets a couple up between the cards. Extra seconds
   stretch the emergence, so Steady hands buys breathing room. Live termites are the only pale things on the floor: squish goo is dark
   olive and soaks in fast, the sawdust at the holes is plank-coloured.
   Controls: tap / click a spot to hop there and stomp (a tap mid-hop queues the next one); arrows / WASD walk, Space stomps on the spot.
   Layout: 1 sprites · 2 setup · 3 tuning · 4 state · 5 verbs · 6 update · 7 bot · 8 draw · 9 run.
   ============================================================ */
(() => {
  'use strict';
  const { clamp, lerp, sfx } = MG;
  const { R: AR, shapes: { ell, or } } = MGArt, { make, cvs, text, textW } = MGArt3;

  /* ---------- 1. sprites that don't need the desk colour ---------- */
  /* a termite seen from above, head to the right, for the HUD and the legend (in play they are drawn live, at any heading) */
  const BUG = make(27, 15, px => {
    px.shape(or(ell(7, 7.5, 6.5, 4.6), ell(13, 7.5, 3, 2.6)), AR.paper, 1);
    px.shape(ell(19.5, 7.5, 3.6, 3.4), AR.wood, 2); px.shape(or(ell(24, 5.5, 1.6, 1), ell(24, 9.5, 1.6, 1)), AR.woodD, 3);
    [[4, 1], [9, 0], [14, 1], [4, 14], [9, 15], [14, 14]].forEach(([x, y]) => px.dot(x, y, AR.ink, 1, 4));
  });
  const WORDS = 'ape owl yak bee hat cup jam pie nut fig map pen ink key bear frog goat lion seal swan wolf book lamp kite bell drum coin vine leaf nest plum zebra tiger otter koala eagle robin llama banjo chair piano quilt brick mango lemon cloud lizard parrot spider monkey beaver pencil pocket ribbon rocket basket candle hammer jungle garden'.toUpperCase().split(' ');

  /* ---------- 2. setup ---------- */
  const R = MGRepair.setup({
    id: 'termites', verb: 'SQUISH', scoreIcon: BUG,
    how: 'Tap a termite to <em>stomp</em> it before it eats a card',
    legend: [[BUG, '<em>tap</em> a termite: the fixer hops on it'], [BUG, 'it <em class="bad">nibbles</em> the word cards']],
    hint: 'tap · arrows + Space', cursor: 'crosshair',
  });
  const { st, g, W, H, ui, fx, rng, level: LV } = R;

  const IN = { x0: 9, y0: 25, x1: 111, y1: 145 }, CW = 30, CH = 16;
  const CARD_AT = [[36, 51], [84, 51], [36, 85], [84, 85], [36, 119], [84, 119]];
  const HOLES = [
    { x: 31, y: IN.y0, dx: 0, dy: 1 }, { x: 89, y: IN.y0, dx: 0, dy: 1 }, { x: IN.x0, y: 66, dx: 1, dy: 0 }, { x: IN.x0, y: 104, dx: 1, dy: 0 },
    { x: IN.x1, y: 44, dx: -1, dy: 0 }, { x: IN.x1, y: 98, dx: -1, dy: 0 },
  ];
  const KNOT = { x: 60, y: 102, dx: 0, dy: -1, floor: true };
  /* the drawer, painted once: walls with their top faces, a dark plank floor (so pale termites and white cards pop), the bore holes */
  const ROOM = cvs(W * 3, H * 3, x => {
    x.scale(3, 3); const r = (c, a, b, w, hh) => { x.fillStyle = c; x.fillRect(a, b, w, hh); }, s = MG.seeded(3);
    r('#3a210d', 0, 0, W, H);                                                                                 /* the desk around it */
    r('#2a170b', IN.x0, IN.y0, IN.x1 - IN.x0, IN.y1 - IN.y0);
    for (let y = IN.y0, i = 0; y < IN.y1; y += 8.67, i++) {                                                   /* floor planks */
      r(['#4a2a12', '#45270f', '#4f2d14'][i % 3], IN.x0, y, IN.x1 - IN.x0, 8.33); r('#2a170b', IN.x0, y + 8.33, IN.x1 - IN.x0, .34);
      for (let k = 0; k < 5; k++) r('#3d220d', IN.x0 + Math.floor(s() * 96), y + 1 + Math.floor(s() * 6), 4 + Math.floor(s() * 9), .34);
      for (let sx = IN.x0 + (i * 23) % 40; sx < IN.x1; sx += 40 + i % 3 * 7) r('#2a170b', sx, y, .34, 8.33);
    }
    r('rgba(0,0,0,.35)', IN.x0, IN.y0, IN.x1 - IN.x0, 3); r('rgba(0,0,0,.25)', IN.x0, IN.y0, 2.5, IN.y1 - IN.y0); r('rgba(0,0,0,.2)', IN.x1 - 1.5, IN.y0, 1.5, IN.y1 - IN.y0);   /* the walls' shadow */
    const wall = (a, b, w, hh) => { r('#1a0f14', a - .33, b - .33, w + .67, hh + .67); r('#8a5a2b', a, b, w, hh); r('#b57d3e', a, b, w, .67); r('#5a3517', a, b + hh - .67, w, .67); };
    wall(3, 16, W - 6, IN.y0 - 16); wall(3, IN.y0, IN.x0 - 3, IN.y1 - IN.y0); wall(IN.x1, IN.y0, W - 3 - IN.x1, IN.y1 - IN.y0);
    r('#1a0f14', 2.67, IN.y1 - .33, W - 5.33, H - IN.y1 + .33); r('#6a4120', 3, IN.y1, W - 6, H - IN.y1); r('#8a5a2b', 3, IN.y1, W - 6, 2); r('#b57d3e', 3, IN.y1, W - 6, .67);   /* the drawer front */
    r('#1a0f14', W / 2 - 13, IN.y1 + 5.67, 26, 5); r('#c98f0e', W / 2 - 12.67, IN.y1 + 6, 25.33, 4.33); r('#ffd23a', W / 2 - 12.67, IN.y1 + 6, 25.33, .67);
    text(x, 'WORDS', W / 2 - textW('WORDS', 1 / 3) / 2, IN.y1 + 7.33, '#5a3517', 1 / 3);
    const disc = (cx, cy, rx, ry, c) => { x.fillStyle = c; for (let j = -ry; j <= ry; j += 1 / 3) { const w = rx * Math.sqrt(Math.max(0, 1 - (j / ry) ** 2)); x.fillRect(Math.round((cx - w) * 3) / 3, Math.round((cy + j) * 3) / 3, Math.round(w * 6) / 3, 1 / 3); } };
    for (const h of HOLES) {                                                                                  /* bore holes in the walls, with a spill of sawdust */
      const hx = h.x - h.dx * 1.67, hy = h.y - h.dy * 1.67;
      disc(h.x + h.dx * 3.17, h.y + h.dy * 3.17, h.dx ? 1.67 : 3, h.dy ? 1.67 : 3, '#8a6a3a'); disc(h.x + h.dx * 2.83, h.y + h.dy * 2.83, h.dx ? 1 : 2, h.dy ? 1 : 2, '#a07a40');
      disc(hx, hy, 3, 3, '#1a0f14'); disc(hx, hy, 2.33, 2.33, '#5a3517'); disc(hx + .33, hy + .33, 1.67, 1.67, '#0d0708');
    }
  });
  /* a word card: paper, a header stripe in the desk colour (it is that machine's keeper drawer), the word */
  const cardCache = new Map();
  const cardSpr = word => {
    if (!cardCache.has(word)) cardCache.set(word, cvs(CW * 3, CH * 3, (x, w, h) => {
      x.fillStyle = '#1a0f14'; x.fillRect(0, 0, w, h); x.fillStyle = '#c9b88a'; x.fillRect(1, 1, w - 2, h - 2); x.fillStyle = '#fff6d6'; x.fillRect(1, 1, w - 3, h - 3);
      x.fillStyle = R.deskRamp[1]; x.fillRect(1, 1, w - 3, 8); x.fillStyle = R.deskRamp[2]; x.fillRect(1, 1, w - 3, 2); x.fillStyle = R.deskRamp[0]; x.fillRect(1, 8, w - 3, 1);
      x.fillStyle = '#e8d8b0'; x.fillRect(4, 40, w - 9, 1);
      x.save(); x.scale(3, 3); text(x, word, (CW - textW(word, 2 / 3)) / 2, 5.67, '#1a0f14', 2 / 3); x.restore();
    }));
    return cardCache.get(word);
  };

  /* ---------- 3. tuning ---------- */
  const TUNE = {
    count: Math.round(lerp(15, 17, LV)),             /* termites in the colony (two of them are already out at the whistle) */
    window: [.6, lerp(8.2, 7.6, LV) * R.seconds / R.baseSeconds],   /* seconds of the run the rest emerge over (extra seconds stretch it) */
    pairs: lerp(.28, .4, LV),                        /* chance a termite brings a friend from another hole */
    speed: p => lerp(8.5, 9.5, LV) * (1 + .25 * p), /* crawl speed, units/s; a little quicker later in the run */
    chew: lerp(.38, .40, LV),                       /* card eaten per second per nibbling termite */
    tell: .55,                                      /* sawdust puffs this long before a termite comes out */
    knot: LV >= .5 ? 2 : 0,                         /* from .5 a knot-hole in the floor, between the cards: this many come up through it */
    goo: 1.5,                                       /* seconds a squish mark lasts */
    stomp: 7.5,                                     /* squish radius around the fixer's feet */
    walk: 72,                                       /* fixer walk speed with the keys */
  };

  /* ---------- 4. state ---------- */
  let G;
  function reset() {
    const words = WORDS.slice(), cards = CARD_AT.map(([cx, cy]) => { const w = words.splice(Math.floor(rng(words.length)), 1)[0]; return { x: cx - CW / 2, y: cy - CH / 2, cx, cy, word: w, spr: cardSpr(w), hp: 1, bites: [], shake: 0, eaten: false }; });
    const holes = HOLES, plan = [];
    const [t0, t1] = TUNE.window;
    const ts = [0, 1].map(i => {                                                /* two are already crawling at the whistle, so the trouble reads at once */
      const h = HOLES[i ? 4 + Math.floor(rng(2)) : Math.floor(rng(4))], k = rng(7, 11);
      return { x: h.x + h.dx * k, y: h.y + h.dy * k, a: Math.atan2(h.dy, h.dx), st: 'walk', out: true, wig: rng(6.28), vx: 0, vy: 0, chewT: 0 };
    }), n = TUNE.count - ts.length;
    for (let i = 0; plan.length < n; i++) {
      const t = t0 + (t1 - t0) * (plan.length / n) + rng(-.2, .2), h = holes[Math.floor(rng(holes.length))];
      plan.push({ t: Math.max(.5, t), h });
      if (plan.length < n && rng() < TUNE.pairs) { const h2 = holes[(holes.indexOf(h) + 1 + Math.floor(rng(holes.length - 1))) % holes.length]; plan.push({ t: Math.max(.5, t + rng(.05, .25)), h: h2 }); }
    }
    for (let k = 1; k <= TUNE.knot; k++) plan[Math.floor(plan.length * k / (TUNE.knot + 1))].h = KNOT;
    G = {
      cards, plan: plan.sort((a, b) => a.t - b.t), ts, splats: [], puffs: [], squished: 0, missed: 0, combo: 0, bestCombo: 0, cleared: false,
      f: { x: W / 2, y: IN.y1 - 6, hop: null, queue: null, land: 0, face: 1, walk: 0, moving: false },
      bot: { react: .2, target: null },
    };
    for (const t of ts) retarget(t);
    ui.setScore(0);
  }
  const grade = () => G.cards.reduce((a, c) => a + Math.max(0, c.hp), 0) / G.cards.length;
  const stats = () => [['CARDS LEFT', `${Math.round(grade() * 100)}%`], ['WHOLE CARDS', `${G.cards.filter(c => c.hp > .97).length} / ${G.cards.length}`], ['SQUISHED', `${G.squished} / ${TUNE.count}`], ['BEST CHAIN', G.bestCombo]];

  /* ---------- 5. verbs: hop to a spot (tap), stomp where you land ---------- */
  const say = (x, y, txt, cls) => ui.floatText(clamp(x, 8 + txt.length * 2, W - 8 - txt.length * 2), y, txt, cls);   /* float text kept off the stage edges */
  const hopDur = d => clamp(.1 + d / 520, .1, .22);
  function hopTo(x, y) {
    if (!R.live) return;
    x = clamp(x, IN.x0 + 3, IN.x1 - 3); y = clamp(y, IN.y0 + 4, IN.y1 - 2);
    const f = G.f; if (f.hop) { f.queue = { x, y }; return; }
    const d = Math.hypot(x - f.x, y - f.y);
    f.hop = { x0: f.x, y0: f.y, x1: x, y1: y, t: 0, d: hopDur(d), h: 3 + Math.min(9, d * .08) }; f.land = 0;
    if (Math.abs(x - f.x) > 1) f.face = Math.sign(x - f.x);
    sfx.tone(380, 760, .07, 'square', .03);
  }
  function stomp(x, y) {
    let n = 0;
    for (const t of G.ts) if (t.st !== 'dead' && t.out && Math.hypot(t.x - x, t.y - y) < TUNE.stomp) {
      t.st = 'dead'; n++; G.squished++;
      G.splats.push({ x: t.x, y: t.y, a: t.a, t: 0 });
      fx.burst(t.x, t.y, ['#d8e890', '#a89a4a', '#6a5a2a'], 7, 34, 90, .35);
    }
    R.shake(n ? 1.6 : .8); fx.puff(x, y + 1, '#8a5a2b', 3);
    if (n) {
      G.combo += n; G.bestCombo = Math.max(G.bestCombo, G.combo); ui.setScore(G.squished); ui.bump(); ui.setCombo(G.combo, 1); if (G.combo >= 3) ui.pulseCombo();
      sfx.noise(.08, .08, 1800); sfx.tone(220, 70, .12, 'square', .06); sfx.ding(Math.min(6, G.combo));
      if (n > 1) { say(x, y - 20, n > 2 ? 'TRIPLE!' : 'DOUBLE!', 'gold'); MG.hitstop(.05); }
      else if (G.combo % 5 === 0) say(x, y - 20, `${G.combo} IN A ROW!`, 'gold');
      else if (rng() < .4) say(x, y - 18, 'SQUISH!', '');
      if (G.squished >= TUNE.count && R.live) { G.cleared = true; ui.floatText(W / 2, 70, 'DRAWER CLEAR!', 'big'); R.end(); }
    } else { G.missed++; G.combo = 0; ui.setCombo(0, 1); sfx.thud(); }
  }

  /* ---------- 6. update ---------- */
  function retarget(t) {                                                       /* the nearest card still standing (a coin-flip between the two nearest) */
    const live = G.cards.filter(c => !c.eaten).map(c => ({ c, d: Math.hypot(clamp(t.x, c.x, c.x + CW) - t.x, clamp(t.y, c.y, c.y + CH) - t.y) })).sort((a, b) => a.d - b.d);
    t.card = live.length ? live[live.length > 1 && rng() < .3 ? 1 : 0].c : null; t.st = t.card ? 'walk' : 'wander';
  }
  function update(dt) {
    const p = R.progress, f = G.f;
    /* the colony: sawdust puffs at a hole, then a termite comes out */
    if (R.live) for (const s of G.plan) {
      if (!s.puffed && R.t >= s.t - TUNE.tell) { s.puffed = true; G.puffs.push({ h: s.h, t: 0 }); sfx.noise(.12, .025, 900); }
      if (!s.out && R.t >= s.t) {
        s.out = true; const h = s.h, t = { x: h.x + h.dx * 2, y: h.y + h.dy * 2, a: Math.atan2(h.dy, h.dx), st: 'walk', out: true, wig: rng(6.28), vx: 0, vy: 0, chewT: 0 };
        retarget(t); G.ts.push(t);
      }
    }
    for (const pf of G.puffs) { pf.t += dt; if (R.live && MG.rng() < dt * 22) fx.puff(pf.h.x + pf.h.dx * 3 + MG.rng(-2, 2), pf.h.y + pf.h.dy * 3, '#c09858', 1); }
    G.puffs = G.puffs.filter(pf => pf.t < TUNE.tell);
    /* termites: crawl to the nearest card's edge, then nibble it */
    const sp = TUNE.speed(p);
    for (const t of G.ts) {
      if (t.st === 'dead') continue;
      t.wig += dt * 14;
      if (t.card && t.card.eaten) { t.bite = null; retarget(t); }
      if (!R.live) { t.vx = t.vy = 0; continue; }
      if (t.st === 'walk') {
        const c = t.card, ex = clamp(t.x, c.x, c.x + CW), ey = clamp(t.y, c.y, c.y + CH), dx = ex - t.x, dy = ey - t.y, d = Math.hypot(dx, dy);
        if (d < 2.6) { t.st = 'nibble'; t.vx = t.vy = 0; t.a = Math.atan2(c.cy - ey, c.cx - ex); t.bx = ex; t.by = ey; t.bite = null; continue; }
        const want = Math.atan2(dy, dx) + Math.sin(t.wig * .5) * .35; let da = ((want - t.a + Math.PI * 3) % (Math.PI * 2)) - Math.PI; t.a += clamp(da, -dt * 7, dt * 7);
        t.vx = Math.cos(t.a) * sp; t.vy = Math.sin(t.a) * sp; t.x = clamp(t.x + t.vx * dt, IN.x0 + 1, IN.x1 - 1); t.y = clamp(t.y + t.vy * dt, IN.y0 + 1, IN.y1 - 1);
      } else if (t.st === 'nibble') {
        const c = t.card; c.hp = Math.max(0, c.hp - TUNE.chew * dt); c.shake = .1; t.chewT -= dt;
        if (!t.bite) { t.bite = c.bites.find(q => Math.hypot(q.x - (t.bx - c.x), q.y - (t.by - c.y)) < 3); if (!t.bite) c.bites.push(t.bite = { x: t.bx - c.x, y: t.by - c.y, a: 0, r: 0 }); }
        const b = t.bite; b.a += TUNE.chew * dt; b.r = Math.sqrt(2 * b.a * CW * CH / Math.PI);                         /* the bite is a half-disc the size of what it ate */
        const ix = c.cx - (c.x + b.x), iy = c.cy - (c.y + b.y), il = Math.hypot(ix, iy) || 1, dig = Math.max(0, b.r - 1.6);
        t.x = c.x + b.x + ix / il * dig - Math.cos(t.a) * 2.4; t.y = c.y + b.y + iy / il * dig - Math.sin(t.a) * 2.4;  /* it works its way in */
        if (t.chewT <= 0) { t.chewT = .22; sfx.tone(1400 + MG.rng(-200, 200), 900, .025, 'square', .012); if (MG.rng() < .5) fx.burst(t.bx, t.by, ['#fff6d6', '#e8d8b0'], 1, 14, 40, .3); }
        if (c.hp <= 0 && !c.eaten) {
          c.eaten = true; fx.burst(c.cx, c.cy, ['#fff6d6', '#e8d8b0', '#c9b88a'], 14, 40, 70, .6); sfx.rotten(); ui.floatText(c.cx, c.cy - 10, 'CHOMP!', 'bad'); R.shake(2);
          if (G.cards.every(k => k.eaten) && R.live) R.end();
        }
      } else if (t.st === 'wander') { t.a += Math.sin(t.wig * .3) * dt * 3; t.x = clamp(t.x + Math.cos(t.a) * sp * .5 * dt, IN.x0 + 1, IN.x1 - 1); t.y = clamp(t.y + Math.sin(t.a) * sp * .5 * dt, IN.y0 + 1, IN.y1 - 1); }
    }
    for (const c of G.cards) c.shake = Math.max(0, c.shake - dt);
    for (const s of G.splats) s.t += dt; G.splats = G.splats.filter(s => s.t < TUNE.goo);
    G.ts = G.ts.filter(t => t.st !== 'dead');
    /* the fixer: a hop in progress, or walking with the keys */
    if (f.hop) {
      const h = f.hop; h.t += dt; const k = Math.min(1, h.t / h.d);
      f.x = lerp(h.x0, h.x1, k); f.y = lerp(h.y0, h.y1, k);
      if (k >= 1) { f.hop = null; f.land = .14; if (R.live) stomp(f.x, f.y); if (f.queue) { const q = f.queue; f.queue = null; hopTo(q.x, q.y); } }
    } else {
      f.land = Math.max(0, f.land - dt);
      const ax = R.live ? R.axisX() : 0, ay = R.live ? R.axisY() : 0; f.moving = !!(ax || ay);
      if (f.moving) { const n = Math.hypot(ax, ay); f.x = clamp(f.x + ax / n * TUNE.walk * dt, IN.x0 + 3, IN.x1 - 3); f.y = clamp(f.y + ay / n * TUNE.walk * dt, IN.y0 + 4, IN.y1 - 2); f.walk += dt; if (ax) f.face = ax; }
    }
  }

  /* ---------- 7. bot: watches the drawer like a player: usually goes for the termite already chewing a card, otherwise the one that will
     reach a card soonest (counting its own hop); now and then it just goes for the nearest one instead. It looks for 0.15-0.3 s after
     each landing, leads a little, aims within a few units and fumbles about one hop in ten. ---------- */
  function bot(dt) {
    const B = G.bot, f = G.f;
    if (f.hop || f.queue) return;
    if ((B.react -= dt) > 0) return;
    if (B.target && B.target.st !== 'dead') { hopAt(B.target); return; }        /* it committed to this one: go */
    let best = null, bs = 1e9;
    for (const t of G.ts) {
      if (t.st === 'dead' || !t.out) continue;
      const fd = Math.hypot(t.x - f.x, t.y - f.y), c = t.card;
      const eta = t.st === 'nibble' ? -1 : c ? Math.hypot(clamp(t.x, c.x, c.x + CW) - t.x, clamp(t.y, c.y, c.y + CH) - t.y) / TUNE.speed(R.progress) : 3;
      const u = B.near ? fd : eta + fd / 160;
      if (u < bs) { bs = u; best = t; }
    }
    if (!best) return;
    B.target = best; B.react = rng(.12, .25);
  }
  function hopAt(best) {
    const B = G.bot, f = G.f, d = hopDur(Math.hypot(best.x - f.x, best.y - f.y)), miss = rng() < .1, e = miss ? rng(7.5, 11) : rng(0, 3.2), a = rng(Math.PI * 2);
    hopTo(best.x + best.vx * d * rng(.5, 1.2) + Math.cos(a) * e, best.y + best.vy * d * rng(.5, 1.2) + Math.sin(a) * e);
    B.target = null; B.react = rng(.06, .16); B.near = rng() < .25;
  }

  /* ---------- 8. draw ---------- */
  const r3 = v => Math.round(v * 3) / 3;
  const oval = (cx, cy, rx, ry, col) => {
    g.fillStyle = col; const n = Math.max(1, Math.round(ry * 3));
    for (let i = -n; i <= n; i++) { const yy = i / 3, w = rx * Math.sqrt(Math.max(0, 1 - (yy * yy) / (ry * ry))); if (w > 0) g.fillRect(r3(cx - w), r3(cy + yy), Math.max(1 / 3, Math.round(w * 6) / 3), 1 / 3); }
  };
  function drawCard(c) {
    if (c.eaten) {                                                             /* only crumbs left */
      for (let i = 0; i < 7; i++) { const x = c.x + 3 + ((i * 37) % 24), y = c.y + 3 + ((i * 23) % 10); g.fillStyle = '#1a0f14'; g.fillRect(x - .33, y - .33, 2.67, 2); g.fillStyle = i % 2 ? '#c9b88a' : '#a8986a'; g.fillRect(x, y, 2, 1.33); }
      return;
    }
    const sx = c.shake > 0 ? (Math.floor(performance.now() / 50) % 2 ? .33 : -.33) : 0;
    st.hi(c.spr, c.x + sx, c.y);
    if (c.bites.length) {                                                      /* bites out of the edge: the drawer floor shows through */
      g.save(); g.beginPath(); g.rect(c.x + sx, c.y, CW, CH); g.clip();
      for (const b of c.bites) { oval(c.x + sx + b.x, c.y + b.y, b.r + .5, b.r + .5, '#1a0f14'); oval(c.x + sx + b.x, c.y + b.y, b.r, b.r, '#2a170b'); }
      g.restore();
    }
  }
  function drawBug(t, now) {                                                   /* a termite from above at any heading: abdomen, thorax, head, legs */
    const c = Math.cos(t.a) * 1.4, s = Math.sin(t.a) * 1.4, at = (k, n) => [t.x + c * k - s * n, t.y + s * k + c * n], legs = Math.floor(t.wig) % 2 ? .5 : -.5;
    g.fillStyle = '#1a0f14';
    for (const k of [-.9, .1, 1.1]) for (const side of [-1, 1]) { const [lx, ly] = at(k + (side > 0 ? legs : -legs) * (t.st === 'nibble' ? .3 : 1), side * 2.4); g.fillRect(r3(lx) - .17, r3(ly) - .17, .67, .67); const [mx, my] = at(k * .7, side * 1.3); g.fillRect(r3(mx), r3(my), .34, .34); }
    for (const [k, rr] of [[-2.6, 2.1], [-1.4, 2.1], [.2, 1.4], [1.9, 1.6]]) { const [x, y] = at(k, 0); oval(x, y, rr + .4, rr + .4, '#1a0f14'); }
    for (const [k, rr, col] of [[-2.6, 2.1, '#e8d8b0'], [-1.4, 2.1, '#f6ead0'], [.2, 1.4, '#e8d8b0'], [1.9, 1.6, '#7a4a1a']]) { const [x, y] = at(k, 0); oval(x, y, rr, rr, col); }
    const [hx, hy] = at(-1.9, -.7); g.fillStyle = '#ffffff'; g.fillRect(r3(hx), r3(hy), .67, .34);
    const [m1x, m1y] = at(3.1, -.7), [m2x, m2y] = at(3.1, .7); g.fillStyle = '#3a210d'; g.fillRect(r3(m1x) - .17, r3(m1y) - .17, .67, .67); g.fillRect(r3(m2x) - .17, r3(m2y) - .17, .67, .67);
  }
  function drawSplat(s) {                                                     /* dark olive goo (never pale like a live termite), soaking in */
    g.globalAlpha = clamp((TUNE.goo - s.t) / .8, 0, 1) * .9;
    oval(s.x, s.y, 3.6, 2.6, '#4a3a18'); oval(s.x + .33, s.y - .33, 2.8, 1.9, '#6a5a2a'); oval(s.x + .67, s.y - .67, 1.1, .8, '#8a7a3a');
    g.fillStyle = '#4a3a18'; for (const [dx, dy] of [[-4, -1], [4, 1.33], [-2.67, 2.33], [2.33, -2.33], [-1, -3], [1.33, 3]]) g.fillRect(r3(s.x + dx), r3(s.y + dy), .67, .67);
    g.globalAlpha = 1;
  }
  function drawFixer(now) {
    const f = G.f, h = f.hop, k = h ? Math.min(1, h.t / h.d) : 0, z = h ? Math.sin(k * Math.PI) * h.h : 0;
    oval(f.x, f.y + .33, 5.6 - z * .2, 1.6 - z * .05, 'rgba(10,6,4,.5)');
    const pose = R.done ? (R.won ? 'cheer' : 'scared') : h ? (k < .55 ? 'leap' : 'fall') : f.land > 0 ? 'squish' : f.moving ? (Math.floor(f.walk * 9) % 2 ? 'run1' : 'run2') : Math.floor(now * 1.5) % 2 ? 'breathe' : 'idle';
    R.crew(f.x, f.y - z, pose, { flip: f.face < 0 });
  }
  function draw() {
    const now = performance.now() / 1000, f = G.f;
    st.hi(ROOM, 0, 0);
    if (TUNE.knot) { oval(KNOT.x, KNOT.y, 3.6, 2.6, '#1a0f14'); oval(KNOT.x, KNOT.y, 2.6, 1.7, '#0d0708'); oval(KNOT.x - 1, KNOT.y - 3.2, 3.4, .8, '#5a3517'); }
    for (const pf of G.puffs) { const h = pf.h; if (Math.floor(now * 10) % 2) { oval(h.x + h.dx * 2, h.y + h.dy * 2, 3, 3, 'rgba(192,152,88,.55)'); } }
    for (const c of G.cards) drawCard(c);
    for (const s of G.splats) drawSplat(s);
    /* the fixer stands up out of the floor: termites further up the screen go behind it, and show through as ghosts */
    const fy = f.y, behind = G.ts.filter(t => t.y < fy), front = G.ts.filter(t => t.y >= fy);
    for (const t of behind) drawBug(t, now);
    drawFixer(now);
    for (const t of front) drawBug(t, now);
    g.globalAlpha = .5; for (const t of behind) if (Math.abs(t.x - f.x) < 7 && t.y > fy - 18) drawBug(t, now); g.globalAlpha = 1;
    if (f.queue) { g.fillStyle = 'rgba(255,240,140,.7)'; const q = f.queue; g.fillRect(r3(q.x) - 1.67, r3(q.y), 3.33, .67); g.fillRect(r3(q.x) - .33, r3(q.y) - 1.33, .67, 3.33); }
    fx.draw(g);
  }

  /* ---------- 9. input + run ---------- */
  window.TERMITES = { get G() { return G; }, hopTo, TUNE };
  R.run({
    reset, update, draw, grade, stats, bot,
    ended() { if (!G.cleared) for (const t of G.ts) { t.st = 'wander'; } },
    down(x, y) { hopTo(x, y); },
    key(ev, k) { if (!ev.repeat && k === ' ') hopTo(G.f.x, G.f.y); },
  });
})();
