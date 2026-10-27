/* ============================================================
   THE KEEPER'S CARD TRAY SPILLED (repair "cards", verb SORT, 15 s).
   The desk's keeper banks words on index cards, filed by length in a tray painted in the machine's colour. Somebody knocked it: word
   cards are strewn across the blotter and the tray sits empty. Its dividers are the six machines' bands (2-3 letters is Bamboo's,
   4-5 Hibiscus's, 6-7 Lagoon's, 8-9 Honeycomb's, 10+ Orchid's and Moonflower's), each tab in that machine's colour. Drag every card into
   the slot for its letter count. A card in the wrong slot pops back out (and shows its count). Cards come in waves: the next one
   flutters down when the blotter is clear, or after a few seconds anyway. File the lot and it ends early.
   Grade = (filed - misfiled) / cards. Level: more slots (3, 4, then 5), so more words sit on a band's edge; bigger, quicker waves.
   Controls: drag a card onto a slot; or tap a card, then tap a slot; keys: <- -> pick a card, 1-5 file it.
   Layout: 1 sprites · 2 setup · 3 tuning · 4 state · 5 verbs · 6 update · 7 bot · 8 draw · 9 run.
   ============================================================ */
(() => {
  'use strict';
  const { clamp, lerp, sfx } = MG;
  const { cvs, text, textW } = MGArt3;

  /* ---------- 1. words + sprites that don't need the desk colour ---------- */
  /* real words from IMI's own pools (ops.js EXTRA_WORDS and the pitch generator's GEN), 2-13 letters */
  const WORDS = `ox up we by no at
    ape cat owl yak bee hat cup pie nut map ink key
    bear frog goat lion seal swan wolf book lamp kite drum coin
    zebra tiger otter koala eagle robin llama acorn clock chair piano mango
    lizard parrot spider monkey pencil ribbon rocket basket candle hammer jungle garden
    gorilla panther sparrow penguin dolphin giraffe blanket compass diamond lantern kitchen library
    elephant flamingo platypus hedgehog kangaroo notebook umbrella mountain
    crocodile orangutan chameleon armadillo dragonfly jellyfish telescope pineapple
    typewriter manuscript woodpecker chimpanzee salamander lighthouse microscope
    hummingbird grasshopper caterpillar masterpiece wheelbarrow
    hippopotamus encyclopedia kaleidoscope refrigerator
    tyrannosaurus`.trim().split(/\s+/).map(w => w.toUpperCase());
  /* the slots: a machine's word band each, tabbed in that machine's colour */
  const BANDS = [[2, 3, '2-3'], [4, 5, '4-5'], [6, 7, '6-7'], [8, 9, '8-9'], [10, 13, '10+']];
  const TS = 2 / 3, CH = 9.33;                                                     /* card text scale (4 units a letter) and card height */
  const cardW = w => textW(w, TS) + 4;
  /* an index card sized to its word, so a long word is a long card: paper, a red rule, the word in ink */
  const cardCache = new Map();
  const cardSpr = word => {
    if (!cardCache.has(word)) cardCache.set(word, cvs(Math.round(cardW(word) * 3), 28, (x, w, h) => {
      x.fillStyle = '#1a0f14'; x.fillRect(0, 0, w, h); x.fillStyle = '#c9b88a'; x.fillRect(1, 1, w - 2, h - 2); x.fillStyle = '#fff6d6'; x.fillRect(1, 1, w - 3, h - 3);
      x.fillStyle = '#ffffff'; x.fillRect(1, 1, w - 3, 1); x.fillStyle = '#f0a0a0'; x.fillRect(2, 4, w - 5, 1); x.fillStyle = '#c8dcf0'; x.fillRect(2, 24, w - 5, 1);
      x.save(); x.scale(3, 3); text(x, word, 2, 2.67, '#1a0f14', TS); x.restore();
    }));
    return cardCache.get(word);
  };
  const filedCache = new Map();
  const filedSpr = (word, w) => {                                                 /* a filed card standing in its slot, seen from above: its top edge and the word */
    const key = word + w;
    if (!filedCache.has(key)) filedCache.set(key, cvs(Math.round(w * 3), 21, (x, cw) => {
      x.fillStyle = '#1a0f14'; x.fillRect(0, 0, cw, 21); x.fillStyle = '#fff6d6'; x.fillRect(1, 1, cw - 2, 19); x.fillStyle = '#ffffff'; x.fillRect(1, 1, cw - 2, 1); x.fillStyle = '#c9b88a'; x.fillRect(cw - 2, 1, 1, 19);
      x.save(); x.beginPath(); x.rect(2, 0, cw - 4, 21); x.clip(); text(x, word, 3, 2.5 / 3 * 3, '#3a2a30', 1); x.restore();
    }));
    return filedCache.get(key);
  };
  const ICON = cvs(36, 27, x => { x.fillStyle = '#1a0f14'; x.fillRect(0, 3, 36, 24); x.fillStyle = '#fff6d6'; x.fillRect(1, 4, 33, 21); x.fillStyle = '#f0a0a0'; x.fillRect(2, 7, 31, 1); x.fillStyle = '#1a0f14'; for (let i = 0; i < 4; i++) x.fillRect(4 + i * 7, 12, 5, 8); });

  /* ---------- 2. setup ---------- */
  const R = MGRepair.setup({
    id: 'cards', verb: 'SORT', scoreIcon: ICON, howAt: 'top',
    how: 'Drag each card to its <em>letter count</em>',
    legend: [[ICON, '<em>drag</em> a word card onto a slot'], [ICON, 'the slots go by <em>letter count</em>'], [ICON, 'a wrong slot <em class="bad">spits it back</em>']],
    hint: 'drag · tap card + slot · keys ← → 1-5',
  });
  const { st, g, W, H, ui, fx, rng, level: LV } = R;

  /* ---------- 3. tuning ---------- */
  const TUNE = {
    slots: 3 + Math.round(LV * 2),                  /* 3 slots (2-7 letters), 4 from .25 (to 9), 5 from .75 (10+) */
    cards: 14,                                      /* cards in the spill */
    first: Math.round(lerp(4, 6, LV)),              /* on the blotter at the whistle; the rest come in waves of about this many */
    wave: lerp(4.4, 3.4, LV),                       /* seconds before the next wave comes anyway */
    misfile: 1,                                     /* grade cost of a card put in the wrong slot, in cards */
  };
  const NB = TUNE.slots, BAND = BANDS.slice(0, NB);
  const bandOf = n => BAND.findIndex(([a, b]) => n >= a && n <= b);
  const POOL = BAND.map(([a, b]) => WORDS.filter(w => w.length >= a && w.length <= b));

  /* the room: the keeper's desk from above, a green blotter for the cards, and the tray in the desk colour with a slot per band */
  const DESK = { x0: 4, y0: 15, x1: 116, y1: 104 }, FIX = { x: 109, y: 32 };
  const TRAY = { x: 2, y: 109, w: 116, y1: 158 }, IN = { x0: TRAY.x + 2.33, x1: TRAY.x + TRAY.w - 2.33, y0: 117, y1: 146 }, SW = (IN.x1 - IN.x0) / NB;
  const LED = { x: 0, y: 0 }, slotX = i => IN.x0 + SW * i, slotAt = x => clamp(Math.floor((x - IN.x0) / SW), 0, NB - 1);
  const ROOM = cvs(W * 3, H * 3, x => {
    x.scale(3, 3); const r = (c, a, b, w, hh) => { x.fillStyle = c; x.fillRect(a, b, w, hh); }, s = MG.seeded(9);
    for (let y = 0, i = 0; y < H; y += 10, i++) {                                                               /* the desk top: long boards */
      r(['#6a4120', '#704525', '#663e1e'][i % 3], 0, y, W, 10); r('#4a2a12', 0, y + 9.67, W, .33);
      for (let k = 0; k < 6; k++) r('#5a3517', Math.floor(s() * W), y + 1 + Math.floor(s() * 8), 5 + Math.floor(s() * 12), .34);
    }
    r('#1a0f14', DESK.x0 - 1.67, DESK.y0 - 1.67, DESK.x1 - DESK.x0 + 3.33, DESK.y1 - DESK.y0 + 3.33);            /* the blotter, with leather corners */
    r('#173f2a', DESK.x0 - 1.33, DESK.y0 - 1.33, DESK.x1 - DESK.x0 + 2.67, DESK.y1 - DESK.y0 + 2.67); r('#1f5a3a', DESK.x0, DESK.y0, DESK.x1 - DESK.x0, DESK.y1 - DESK.y0);
    r('#2a6e48', DESK.x0, DESK.y0, DESK.x1 - DESK.x0, .67); r('#174a30', DESK.x0, DESK.y1 - .67, DESK.x1 - DESK.x0, .67);
    for (let k = 0; k < 40; k++) r('#1c5235', DESK.x0 + Math.floor(s() * 108), DESK.y0 + 2 + Math.floor(s() * 80), 2 + Math.floor(s() * 4), .34);
    const tri = (pts, c) => { x.fillStyle = c; x.beginPath(); pts.forEach(([a, b], i) => i ? x.lineTo(a, b) : x.moveTo(a, b)); x.fill(); };
    for (const [cx, cy, dx, dy] of [[DESK.x0 - 1.33, DESK.y0 - 1.33, 1, 1], [DESK.x1 + 1.33, DESK.y0 - 1.33, -1, 1], [DESK.x0 - 1.33, DESK.y1 + 1.33, 1, -1], [DESK.x1 + 1.33, DESK.y1 + 1.33, -1, -1]]) {
      tri([[cx, cy], [cx + dx * 10, cy], [cx, cy + dy * 10]], '#1a0f14'); tri([[cx, cy], [cx + dx * 8.67, cy], [cx, cy + dy * 8.67]], '#7a4a1e');
      tri([[cx, cy], [cx + dx * 8.67, cy], [cx + dx * 8, cy + dy * .67], [cx, cy + dy * .67]], dy > 0 ? '#a86a32' : '#5a3517');
    }
    /* the tray: back wall with the tabs, the slots, the front panel with the machine's name plate */
    const [d0, d1, d2] = R.deskRamp;
    r('#1a0f14', TRAY.x - .33, TRAY.y + 3.33, TRAY.w + .67, TRAY.y1 - TRAY.y - 3); r(d1, TRAY.x, TRAY.y + 3.67, TRAY.w, TRAY.y1 - TRAY.y - 3.67); r(d2, TRAY.x, TRAY.y + 3.67, TRAY.w, .67); r(d0, TRAY.x + TRAY.w - .67, TRAY.y + 3.67, .67, TRAY.y1 - TRAY.y - 3.67);
    r('#1a0f14', IN.x0 - .33, IN.y0 - .33, IN.x1 - IN.x0 + .67, IN.y1 - IN.y0 + .67); r('#2a170b', IN.x0, IN.y0, IN.x1 - IN.x0, IN.y1 - IN.y0); r('#1a0f14', IN.x0, IN.y0, IN.x1 - IN.x0, 2);
    for (let i = 1; i < NB; i++) { const dx = slotX(i); r('#1a0f14', dx - 1, IN.y0, 2, IN.y1 - IN.y0); r(d1, dx - .67, IN.y0, 1.33, IN.y1 - IN.y0); r(d2, dx - .67, IN.y0, .33, IN.y1 - IN.y0); }
    r('#1a0f14', TRAY.x, IN.y1, TRAY.w, .67); r(d0, TRAY.x + .33, IN.y1 + .67, TRAY.w - .67, .67);
    const nm = R.deskName.toUpperCase(), nw = textW(nm, 1 / 3) + 6, nx = W / 2 - nw / 2, ny = IN.y1 + 4.33;                           /* brass name plate, with a socket for the keeper light */
    LED.x = nx + 1; LED.y = ny + 1.33; r('#1a0f14', LED.x - .33, LED.y - .33, 2.33, 3);
    r('#1a0f14', nx - .33, ny - .33, nw + .67, 5.67); r('#c98f0e', nx, ny, nw, 5); r('#ffd23a', nx, ny, nw, .67); r('#8a5a0e', nx, ny + 4.33, nw, .67);
    text(x, nm, nx + 4.33, ny + 1.33, '#5a3517', 1 / 3);
    BAND.forEach(([, , lab], i) => {                                                                             /* tabs: the band's machine colour, its letter count */
      const [t0, t1, t2] = MGRepair.deskRamp(i), tw = Math.min(SW - 4, 19), tx = slotX(i) + SW / 2 - tw / 2;
      r('#1a0f14', tx - .33, TRAY.y - .33, tw + .67, 9.67); r(t1, tx, TRAY.y, tw, 9.33); r(t2, tx, TRAY.y, tw, .67); r(t0, tx, TRAY.y + 8.67, tw, .67); r(t0, tx + tw - .67, TRAY.y, .67, 9.33);
      text(x, lab, tx + tw / 2 - textW(lab, TS) / 2 + .33, TRAY.y + 2.33, '#1a0f14', TS);
    });
  });

  /* ---------- 4. state ---------- */
  let G;
  function reset() {
    const deck = [], used = new Set(), order = [];
    for (let i = 0; i < TUNE.cards; i++) order.push(i % NB);
    for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(rng(i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    for (const b of order) { const p = POOL[b].filter(w => !used.has(w)), w = p[Math.floor(rng(p.length))]; used.add(w); deck.push(w); }
    G = {
      deck, cards: [], tween: [], files: BAND.map(() => []), flash: BAND.map(() => 0), pop: BAND.map(() => 0),
      dealt: 0, waveT: 0, waves: 0, spilt: false, drag: null, sel: null, keyed: false, done: 0, wrong: 0, combo: 0, bestCombo: 0, cleared: false, endAt: 0, mood: 'idle', moodT: 0, led: 0,
      bot: { st: 'look', t: .35, c: null, slot: 0, x: 0, y: 0, x0: 0, y0: 0, k: 0, d: 0, fumble: false },
    };
    deal(TUNE.first, true);                                                      /* the spill: they sit in the tray until the whistle, then burst out */
    ui.setScore(0);
  }
  const grade = () => clamp((G.done - TUNE.misfile * G.wrong) / TUNE.cards, 0, 1);
  const stats = () => [['FILED', `${G.done} / ${TUNE.cards}`], ['MISFILED', G.wrong], ['BEST CHAIN', G.bestCombo], ['SLOTS', BAND.map(b => b[2]).join(' ')]];

  /* ---------- 5. verbs: grab a card, drag it, let go over a slot (or tap a card, then a slot; or keys) ---------- */
  const say = (x, y, txt, cls) => ui.floatText(clamp(x, 8 + txt.length * 2, W - 8 - txt.length * 2), y, txt, cls);   /* float text kept off the stage edges (and off the blotter: callouts rise from the tray front or the top margin) */
  const onDesk = () => G.cards.filter(c => !c.fly);
  function spot(w) {                                                             /* a free place on the blotter for a card this wide */
    let best = null, bs = 1e9;
    for (let k = 0; k < 50; k++) {
      const x = rng(DESK.x0 + 1, DESK.x1 - 1 - w), y = rng(DESK.y0 + (R.t < 3 ? 12 : 1.5), DESK.y1 - 1 - CH);   /* early on, clear of the how banner along the top */
      let s = x + w > FIX.x - 9 && y < FIX.y + 2 ? 400 : 0;                       /* not under the fixer */
      for (const c of G.cards) { const ox = Math.min(x + w, c.hx + c.w) - Math.max(x, c.hx) + 3, oy = Math.min(y + CH, c.hy + CH) - Math.max(y, c.hy) + 3; if (ox > 0 && oy > 0) s += ox * oy; }
      if (s < bs) { bs = s; best = [x, y]; if (!s) break; }
    }
    return best.map(v => Math.round(v * 3) / 3);
  }
  function deal(n, spill) {                                                       /* a wave: cards flutter down onto the blotter (the first bursts out of the tray) */
    n = Math.min(n, G.deck.length - G.dealt); if (n <= 0) return;
    for (let i = 0; i < n; i++) {
      const word = G.deck[G.dealt++], w = cardW(word), [hx, hy] = spot(w);
      const c = { word, n: word.length, band: bandOf(word.length), spr: cardSpr(word), w, x: hx, y: hy, hx, hy, fly: null, shake: 0 };
      c.fly = spill ? { x0: clamp(slotX(i % NB) + SW / 2 - w / 2 + rng(-6, 6), 0, W - w), y0: IN.y0 + 1 + (i % 2) * 3, t: -i * .06, d: rng(.42, .55), sway: 0, arc: rng(10, 16) }
        : { x0: clamp(hx + rng(-14, 14), 0, W - w), y0: -14 - i * 4, t: -i * .07, d: rng(.45, .6), sway: rng(2, 4) * (rng() < .5 ? -1 : 1) };
      c.x = c.fly.x0; c.y = c.fly.y0;
      G.cards.push(c);
    }
    G.waveT = 0; G.waves++;
    if (!spill) { sfx.noise(.3, .05, 2600); for (let i = 0; i < n; i++) sfx.tone(1700 + i * 90, 1100, .03, 'square', .012, .1 + i * .07); G.mood = 'freeze'; G.moodT = .45; say(W / 2, 10, 'MORE CARDS!', 'ice'); }
  }
  const hit = (x, y) => { for (let i = G.cards.length - 1; i >= 0; i--) { const c = G.cards[i]; if (!c.fly && x >= c.x - 1.5 && x <= c.x + c.w + 1.5 && y >= c.y - 1.5 && y <= c.y + CH + 1.5) return c; } return null; };
  function grab(c, x, y, lift) {
    if (!R.live || !c || c.fly) return false;
    G.cards.splice(G.cards.indexOf(c), 1); G.cards.push(c);                     /* lift it on top */
    G.drag = { c, ox: x - c.x, oy: y - c.y + (lift ? 8 : 0), x, y }; G.sel = null; if (lift) dragTo(x, y);   /* under a finger it rides 8 units above the touch, so it stays in sight */
    sfx.tone(900, 1300, .04, 'square', .02); return true;
  }
  function dragTo(x, y) {                                                        /* over the tray the card hovers just above the tabs, so the target's label stays in sight */
    const d = G.drag; if (!d) return; d.x = x; d.y = y; d.c.x = clamp(x - d.ox, -d.c.w / 2, W - d.c.w / 2); d.c.y = clamp(y - d.oy, 0, (y >= TRAY.y - 3 ? TRAY.y - 2 : H) - CH);
  }
  function letGo(x, y, tap) {
    const d = G.drag; if (!d) return; G.drag = null; const c = d.c;
    if (!R.live) { home(c); return; }
    if (tap) { c.x = c.hx; c.y = c.hy; G.sel = c; sfx.tone(1300, 1300, .03, 'square', .02); return; }   /* a tap picks it for a tap on a slot */
    if (y >= TRAY.y - 3) { file(c, slotAt(x)); return; }
    c.hx = c.x = Math.round(clamp(c.x, DESK.x0, DESK.x1 - c.w) * 3) / 3; c.hy = c.y = Math.round(clamp(c.y, DESK.y0, DESK.y1 - CH) * 3) / 3;   /* put down on the blotter */
    sfx.tone(500, 380, .04, 'triangle', .03);
  }
  function home(c) { c.fly = { x0: c.x, y0: c.y, t: 0, d: .22, sway: 0, back: true }; }
  function file(c, i) {
    if (!R.live || c.fly || !G.cards.includes(c)) return;
    if (G.sel === c) G.sel = null;
    const sx = slotX(i) + SW / 2;
    if (i === c.band) {
      G.cards.splice(G.cards.indexOf(c), 1); G.done++; G.combo++; G.bestCombo = Math.max(G.bestCombo, G.combo);
      G.tween.push({ c, i, x: c.x, y: c.y, t: 0 }); G.pop[i] = .25; G.mood = 'cheer'; G.moodT = .4;
      ui.setScore(G.done); ui.bump(); ui.setCombo(G.combo, 1); if (G.combo >= 3) ui.pulseCombo();
      sfx.clack(2); sfx.ding(Math.min(6, G.combo));
      if (G.combo % 5 === 0) { say(sx, IN.y1 + 1, `${G.combo} IN A ROW!`, 'gold'); MG.hitstop(.05); } else if (rng() < .35) say(sx, IN.y1 + 1, ['FILED!', 'NEAT!', 'TIDY!'][Math.floor(rng(3))], '');
      if (G.done >= TUNE.cards) { G.cleared = true; G.led = 1; say(W / 2, 60, 'ALL FILED!', 'big'); R.end(); }
    } else {                                                                     /* wrong slot: it pops back out to where it came from, with its count */
      G.wrong++; G.combo = 0; ui.setCombo(0, 1); G.flash[i] = .5; G.mood = 'scared'; G.moodT = .5; c.shake = .35; c.known = true;
      sfx.typo(); sfx.tone(240, 120, .14, 'square', .05); R.shake(2.2);
      say(sx, IN.y1 + 1, `${c.n} LETTERS`, 'bad'); fx.burst(sx, IN.y0 + 4, ['#ff7a6a', '#1a0f14'], 6, 30, 60, .35);
      c.x = clamp(sx - c.w / 2, 0, W - c.w); c.y = IN.y0 - 2; home(c);
    }
  }
  function pickKey(dir) {                                                         /* keys: walk the selection through the cards in reading order */
    const list = onDesk().sort((a, b) => (Math.round(a.hy / 11) - Math.round(b.hy / 11)) || a.hx - b.hx);
    if (!list.length) { G.sel = null; return; }
    const i = list.indexOf(G.sel); G.sel = list[i < 0 ? 0 : (i + dir + list.length) % list.length]; G.keyed = true;
    sfx.tone(1100, 1100, .025, 'square', .015);
  }

  /* ---------- 6. update ---------- */
  function update(dt) {
    if (R.live && !G.spilt) { G.spilt = true; sfx.noise(.25, .07, 1800); sfx.tone(300, 120, .12, 'square', .04); R.shake(2.5); G.mood = 'scared'; G.moodT = .6; }   /* crash: the tray tips */
    /* waves: the next one comes when the blotter is clear, or after a while anyway */
    if (R.live && G.dealt < G.deck.length) { G.waveT += dt; const clear = !G.cards.length && !G.drag; if (G.waveT >= TUNE.wave || (clear && G.waveT > .25)) deal(Math.min(TUNE.first, G.deck.length - G.dealt), false); }
    for (const c of G.cards) {
      c.shake = Math.max(0, c.shake - dt);
      const f = c.fly; if (!f) continue;
      f.t += dt; if (f.t < 0) continue;
      const k = Math.min(1, f.t / f.d), e = 1 - (1 - k) ** 3;
      c.x = lerp(f.x0, c.hx, e) + Math.sin(k * Math.PI * 2) * f.sway * (1 - k); c.y = lerp(f.y0, c.hy, e) - (f.arc || 0) * Math.sin(k * Math.PI);
      if (k >= 1) { c.fly = null; c.x = c.hx; c.y = c.hy; if (!f.back) { fx.puff(c.x + c.w / 2, c.y + CH, '#2a6e48', 2); sfx.tone(700, 500, .03, 'triangle', .015); } }
    }
    for (const t of G.tween) {
      t.t += dt;
      if (t.t >= .16 && !t.done) { t.done = true; G.files[t.i].push(t.c.word); const sx = slotX(t.i) + SW / 2; fx.burst(sx, IN.y0 + 3, [MGRepair.deskRamp(t.i)[1], '#fff6d6'], 7, 34, 70, .4); }
    }
    G.tween = G.tween.filter(t => t.t < .16);
    for (let i = 0; i < NB; i++) { G.flash[i] = Math.max(0, G.flash[i] - dt); G.pop[i] = Math.max(0, G.pop[i] - dt); }
    G.moodT = Math.max(0, G.moodT - dt); if (!G.moodT) G.mood = 'idle';
    if (G.sel && !G.cards.includes(G.sel)) G.sel = null;
  }

  /* ---------- 7. bot: plays like a person: looks over the blotter, picks the card nearest the tray, reads it (longer words take longer
     to count), then drags it across at hand speed. Now and then it miscounts a word on the edge of a band (long words more often, and more
     slots mean more edges), but never the same card twice; once in a while it lets go short of the tray. ---------- */
  function bot(dt) {
    const B = G.bot;
    if (!R.live) return;
    if (B.st === 'look') {
      if ((B.t -= dt) > 0) return;
      const list = onDesk().map(c => [c, c.hy + c.w * .1 + rng(0, 14)]).sort((a, b) => b[1] - a[1]); if (!list.length) { B.t = .1; return; }
      const c = B.c = list[0][0], [a, b] = BAND[c.band], edge = (c.n === a && c.band > 0) ? -1 : (c.n === b && c.band < NB - 1) ? 1 : 0;
      B.slot = edge && !c.known && rng() < .08 * c.n / 5 ? c.band + edge : c.band;     /* long words are easier to miscount; one it got wrong it remembers */
      B.st = 'read'; B.t = rng(.2, .34) + .04 * c.n;
    } else if (B.st === 'read') {
      if ((B.t -= dt) > 0) return;
      const c = B.c; if (!G.cards.includes(c) || c.fly) { B.st = 'look'; B.t = .1; return; }
      B.x0 = B.x = c.x + c.w / 2 + rng(-c.w * .3, c.w * .3); B.y0 = B.y = c.y + CH / 2;
      if (!grab(c, B.x, B.y)) { B.st = 'look'; B.t = .1; return; }
      B.tx = clamp(slotX(B.slot) + SW / 2 + rng(-SW * .25, SW * .25), 4, W - 4); B.ty = IN.y0 + rng(4, 12);
      B.k = 0; B.d = .22 + Math.hypot(B.tx - B.x0, B.ty - B.y0) / rng(260, 340); B.fumble = rng() < .04; B.st = 'drag';
    } else if (B.st === 'drag') {
      if (!G.drag) { B.st = 'look'; B.t = .2; return; }
      B.k = Math.min(1, B.k + dt / B.d); const e = B.k * B.k * (3 - 2 * B.k);
      dragTo(lerp(B.x0, B.tx, e), lerp(B.y0, B.ty, e));
      if (B.fumble && B.k > .3) { letGo(G.drag.x, G.drag.y, false); B.st = 'look'; B.t = rng(.2, .35); return; }
      if (B.k >= 1) { letGo(B.tx, B.ty, false); B.st = 'look'; B.t = rng(.08, .2); }
    }
  }

  /* ---------- 8. draw ---------- */
  const r3 = v => Math.round(v * 3) / 3;
  function drawCard(c, lift) {
    const sx = c.shake > 0 ? (Math.floor(performance.now() / 45) % 2 ? .67 : -.67) : 0, x = r3(c.x + sx), y = r3(c.y);
    const sh = lift ? 2 : c.fly && !c.fly.back ? 1 + 3 * (1 - Math.min(1, Math.max(0, c.fly.t) / c.fly.d)) : .67;
    g.fillStyle = 'rgba(8,20,12,.4)'; g.fillRect(x + sh, y + sh, c.w, CH);
    st.hi(c.spr, x - (lift ? .33 : 0), y - (lift ? .67 : 0));
    if (c.known) {                                                                /* spat back once: it now wears its letter count on a red flag */
      const s = String(c.n), bw = textW(s, TS) + 2.67, bx = x + c.w - bw + 2 - (lift ? .33 : 0), by = y - 3.67 - (lift ? .67 : 0);
      g.fillStyle = '#1a0f14'; g.fillRect(bx - .33, by - .33, bw + .67, 7.33); g.fillStyle = '#e8584a'; g.fillRect(bx, by, bw, 6.67); g.fillStyle = '#ff9a8a'; g.fillRect(bx, by, bw, .67);
      text(g, s, bx + 1.33, by + 1, '#fff6d6', TS);
    }
    if (c === G.sel) {                                                            /* picked (tap or keys): a blinking gold frame */
      g.fillStyle = Math.floor(performance.now() / 160) % 2 ? '#ffd23a' : '#fff6d6';
      g.fillRect(x - 1, y - 1, c.w + 2, .67); g.fillRect(x - 1, y + CH + .33, c.w + 2, .67); g.fillRect(x - 1, y - 1, .67, CH + 2); g.fillRect(x + c.w + .33, y - 1, .67, CH + 2);
    }
  }
  function drawTray(now) {
    const hot = G.drag && G.drag.y >= TRAY.y - 3 ? slotAt(G.drag.x) : G.sel && R.ptr.y >= TRAY.y - 3 && R.ptr.type === 'mouse' ? slotAt(R.ptr.x) : -1;
    for (let i = 0; i < NB; i++) {
      const x0 = slotX(i) + (i ? 1 : 0), w = SW - (i ? 1 : 0) - (i < NB - 1 ? 1 : 0), col = MGRepair.deskRamp(i);
      if (i === hot) { g.fillStyle = col[1]; g.globalAlpha = .3 + .1 * Math.sin(now * 12); g.fillRect(x0, IN.y0 + 2, w, IN.y1 - IN.y0 - 2); g.globalAlpha = 1; }
      if (G.flash[i] > 0 && Math.floor(G.flash[i] * 12) % 2) { g.fillStyle = 'rgba(255,90,70,.45)'; g.fillRect(x0, IN.y0 + 2, w, IN.y1 - IN.y0 - 2); }
      const fl = G.files[i], k0 = Math.max(0, fl.length - 8);                   /* filed cards stand on end, back to front, each word showing over the next */
      for (let k = k0; k < fl.length; k++) st.hi(filedSpr(fl[k], w - 3.33), x0 + 1.67 + ((k * 5) % 3 - 1) * .33, IN.y0 + 2.67 + (k - k0) * 3);
      if (G.pop[i] > 0 || i === hot) {                                           /* the tab lifts when it's the target or just took a card */
        const tw = Math.min(SW - 4, 19), tx = slotX(i) + SW / 2 - tw / 2;
        g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(tx, TRAY.y, tw, 9.33);
      }
    }
    g.fillStyle = G.led > 0 ? (Math.floor(now * 5) % 2 ? '#7be05a' : '#c4f4d4') : '#5a1a1a'; g.fillRect(LED.x, LED.y, 1.67, 2.33);     /* the keeper light: dark until the tray is sorted */
  }
  function draw() {
    const now = performance.now() / 1000;
    st.hi(ROOM, 0, 0);
    drawTray(now);
    for (const t of G.tween) {                                                    /* a filed card slides down into its slot, squeezing to the slot's width */
      const k = Math.min(1, t.t / .16), sx = slotX(t.i) + SW / 2, w = lerp(t.c.w, 12, k), x = lerp(t.x, sx - 6, k), y = lerp(t.y, IN.y0 + 2, k), hh = lerp(CH, 2, k);
      g.drawImage(t.c.spr, r3(x), r3(y), Math.max(1, r3(w)), Math.max(1, r3(hh)));
    }
    if (G.endAt) g.globalAlpha = Math.max(.3, 1 - (performance.now() - G.endAt) / 1100);   /* after the whistle the leftovers fade back, so the report reads clean */
    for (const c of G.cards) if (!G.drag || G.drag.c !== c) drawCard(c, false);
    g.globalAlpha = 1;
    const pose = R.done ? (R.won ? 'cheer' : 'scared') : G.mood !== 'idle' ? G.mood : G.drag ? 'hold0' : Math.floor(now * 1.5) % 2 ? 'breathe' : 'idle';
    g.fillStyle = 'rgba(8,20,12,.4)'; g.fillRect(FIX.x - 5, FIX.y - .33, 10, 1.33);
    R.crew(FIX.x, FIX.y, pose, { flip: true });
    if (G.drag) drawCard(G.drag.c, true);
    fx.draw(g);
  }

  /* ---------- 9. input + run ---------- */
  window.CARDS = { get G() { return G; }, TUNE, file, grab, dragTo, letGo };
  R.run({
    reset, update, draw, grade, stats, bot,
    ended() { if (G.drag) { const c = G.drag.c; G.drag = null; home(c); } G.sel = null; G.endAt = performance.now(); },
    down(x, y) {
      const c = hit(x, y);
      if (c) { grab(c, x, y, R.ptr.type === 'touch'); return; }
      if (G.sel && y >= TRAY.y - 3) file(G.sel, slotAt(x));                    /* a tap on a slot files the picked card */
      else G.sel = null;
    },
    move(x, y) { dragTo(x, y); },
    up(x, y, ev, tap) { letGo(x, y, tap); },
    key(ev, k) {
      if (ev.repeat) return;
      if (k === 'arrowleft' || k === 'a' || k === 'arrowup' || k === 'w') pickKey(-1);
      else if (k === 'arrowright' || k === 'd' || k === 'arrowdown' || k === 's' || k === 'tab') { if (k === 'tab') ev.preventDefault(); pickKey(1); }
      else if (/^[1-5]$/.test(k) && +k <= NB) { if (!G.sel) pickKey(0); if (G.sel) file(G.sel, +k - 1); }
    },
  });
})();
