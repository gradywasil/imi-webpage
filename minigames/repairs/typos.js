/* ============================================================
   TYPOS IN THE PROOFS (repair "typos", verb SPOT, 14 s).
   The desk's galley proof scrolls up out of the proof press toward the print roller. Every line has exactly one misspelt word: a real
   word from IMI's word pools with two letters swapped, one dropped or one doubled (3-letter words: swapped or doubled), and never a
   real English word. Tap it before the line goes under the roller and the red pen corrects it. Tap a word that was fine and the line
   is botched; a line that reaches the roller uncorrected is a misprint.
   Grade = corrected / (corrected + 2 x botched + misprinted), so guessing can't pass. Level: faster scroll, more words a line,
   subtler typos (more swaps).
   Controls: tap / click the misspelt word; keys 1-4 pick a word on the most urgent line (the one with the red arrow).
   Layout of this file (as leak.js): 1 sprites · 2 setup · 3 tuning · 4 state · 5 verbs · 6 update · 7 bot · 8 draw · 9 run.
   ============================================================ */
(() => {
  'use strict';
  const { clamp, lerp, sfx } = MG;
  const { R: AR, shapes: { ell, box, poly, or } } = MGArt, { make, hl, cvs, text, textW } = MGArt3;

  /* ---------- words: a slice of ops.js's pitch pools (GEN), 3-8 letters, so every proof line reads like a monkey title ---------- */
  const sp = s => s.trim().split(/\s+/);
  const POOL = {
    N: sp(`cat dog bat fox pig cow owl yak hen ram bear bird frog goat lion mole seal swan wolf zebra tiger otter koala eagle robin llama
      moose camel sheep horse whale shark squid snail lizard parrot spider turkey monkey beaver badger donkey gibbon gorilla panther ostrich
      sparrow penguin dolphin giraffe buffalo octopus`),
    T: sp(`hat cup box jam pie map pen pot rug toy van fan bed key book boot lamp kite gift acorn bean ship tent clock chair piano quilt
      brick banjo cake sock drum coin ring bell rope pencil pocket ribbon rocket basket candle carpet hammer window ladder trophy guitar
      blanket cabinet chimney compass diamond lantern notebook umbrella`),
    P: sp(`cave city farm hill nest yard jungle garden kitchen library cabin meadow harbor valley island desert bookshop junkyard workshop`),
    A: sp(`big red hot wet old new odd sad calm dark deep loud pale soft tall slow quick brave lazy wild quiet sleepy sticky gloomy clumsy
      golden hungry jolly mighty rusty shiny sneaky bouncy enormous gigantic fabulous peculiar`),
    V: sp(`ran sat hid dug ate saw made fell grew wore woke found drove shook took chased grabbed guarded painted polished borrowed
      followed repaired washed carried`),
    D: sp(`slowly loudly gently quickly quietly bravely proudly`),
  };
  const WORDS = new Set(Object.values(POOL).flat());
  /* real words (and a few names) that a swap / drop / double of a pool word makes: such a "typo" would leave the line with no visible
     misspelling. Found by enumerating every variant of every pool word against IMI's reader vocabulary, then by eye. */
  const REAL = new Set(sp(`act arm amp bar ban bel bid boo bot cam came chase con cpu dessert dove far fam fog fro fund gat gif git goa got
    hose kit lam lap lay mad might mol money net opt pal quit quite reed rig rna roe rust sail sea sip sleep shoo sot sow stick tae tet ten
    tier tnt too woe wok yar badge gloom bea ben cae cal dee lio lou mae moe rin sal sel wid wil woolf urg
    batt brae cain chai char cion clam cock dogg fond hoot hore hors kola lama lino loin moos nets peen poot redd sark sawn seep shin sook
    wale caret carpe cased garde hores liard meaow sicky sider sneak snaky spier toter widow gabbed pained panted quicky shinny tigger`));
  /* line shapes by how many content words they hold; THE / A / IN are never the typo */
  const SHAPES = {
    2: [['THE', 'A', 'N'], ['A', 'A', 'T'], ['THE', 'N', 'V'], ['THE', 'A', 'T']],
    3: [['A', 'N', 'V'], ['N', 'V', 'THE', 'T'], ['THE', 'N', 'V', 'D'], ['A', 'T', 'IN', 'P'], ['A', 'A', 'N']],
    4: [['A', 'N', 'V', 'T'], ['N', 'V', 'A', 'T'], ['A', 'N', 'V', 'D']],
  };

  /* ---------- 1. sprites that don't need the desk colour ---------- */
  const PEN = make(12, 42, px => {                                                    /* the red proofing pencil (HUD icon, and in the fixer's hand) */
    px.shape(box(3, 6, 6, 28), AR.red, 1); px.shape(box(3, 2, 6, 5), AR.metal, 2); px.shape(box(3, 0, 6, 3), AR.paper, 3);
    px.shape(poly([[3, 34], [9, 34], [6, 41]]), AR.woodL, 4); px.shape(poly([[5, 38.5], [7, 38.5], [6, 41]]), AR.red, 5); hl(px, 4, 7, 1, 25, 2);
  });

  /* ---------- 2. setup ---------- */
  const R = MGRepair.setup({
    id: 'typos', verb: 'SPOT', scoreIcon: PEN, howAt: 'top',
    how: 'Tap the <em>misspelt</em> word on each line',
    legend: [[PEN, 'tap the <em>misspelt</em> word'], [PEN, 'a good word tapped is <em class="bad">botched</em>'], [PEN, 'beat the <em>roller</em> at the top']],
    hint: 'tap the typo · keys 1-4',
  });
  const { st, g, W, H, ui, fx, rng, level: LV } = R;
  const [dSh, dBase, dLi] = R.deskRamp;

  /* the room and the press, painted once. The paper strip is drawn live (it scrolls). */
  const PX0 = 8, PX1 = 112, DEAD = 37, FEED = 130, SP = 19, TS = 2 / 3, CH = 4;      /* page edges; the roller line; where lines feed in; line pitch; text scale + pitch */
  const BACK = cvs(W * 3, H * 3, x => {
    x.scale(3, 3); const r = (c, a, b, w, hh) => { x.fillStyle = c; x.fillRect(a, b, w, hh); };
    r('#20141a', 0, 0, W, H); for (let sx = 0; sx < W; sx += 8) r('#261820', sx, 12, 4, H - 12);
    r('rgba(0,0,0,.35)', PX1, 20, 3, FEED - 20);                                                                                   /* the strip's shadow on the wall */
  });
  const FRONT = cvs(W * 3, H * 3, x => {
    x.scale(3, 3); const r = (c, a, b, w, hh) => { x.fillStyle = c; x.fillRect(a, b, w, hh); };
    /* the print roller at the top: a drum in the desk colour between iron cheeks */
    r('#1a0f14', 0, 19.33, W, 16.67); r(dSh, 3, 20, W - 6, 15.33); r(dBase, 3, 21.33, W - 6, 10); r(dLi, 3, 22.33, W - 6, 2);
    for (const cx of [0, W - 6]) { r('#1a0f14', cx, 16.67, 6, 22); r('#5a5a66', cx + .33, 17, 5.33, 21.33); r('#b8b8c4', cx + .33, 17, 5.33, 9); r('#f0f0f8', cx + .33, 17, 1, 21.33); r('#1a0f14', cx + 2, 26.33, 2, 2); }
    r('#1a0f14', 3, 35.33, W - 6, 1);
    /* the proof press at the bottom: feed rollers + the desk-colour body with its plate */
    r('#1a0f14', 2, FEED - .67, W - 4, 7.67); r('#3a3a44', 2.33, FEED - .33, W - 4.67, 7); r('#5a5a66', 2.33, FEED, W - 4.67, 2.33); r('#8a8a96', 2.33, FEED, W - 4.67, .67);
    r('#1a0f14', 0, FEED + 6.33, W, H - FEED - 6.33); r(dSh, .33, FEED + 6.67, W - .67, H - FEED - 7); r(dBase, .33, FEED + 6.67, W - .67, H - FEED - 9); r(dLi, .33, FEED + 6.67, W - .67, .67);
    for (const bx of [6, W - 10]) { r('#1a0f14', bx - .33, FEED + 10, 4.67, 4.67); r('#b8b8c4', bx, FEED + 10.33, 4, 4); r('#f0f0f8', bx, FEED + 10.33, 1.33, 1.33); }
    const name = (R.deskName + ' PROOFS').toUpperCase(), nw = textW(name, .5) + 6, nx = 64 - nw / 2;
    r('#1a0f14', nx - .67, FEED + 9.33, nw + 1.33, 8.33); r('#c98f0e', nx, FEED + 10, nw, 7); r('#ffd23a', nx, FEED + 10, nw, .67);
    text(x, name, nx + 3, FEED + 11.33, '#1a0f14', .5);
    r('rgba(0,0,0,.25)', .33, H - 3, W - .67, 2.67);
  });

  /* ---------- 3. tuning ---------- */
  const TUNE = {
    every: p => lerp(1.45, 1.12, LV) * lerp(1.06, .8, p),                           /* seconds per line: the strip speeds up through the run */
    words: () => LV < .3 ? (rng() < .55 ? 2 : 3) : LV < .7 ? (rng() < .7 ? 3 : 2) : (rng() < .5 ? 4 : 3),   /* content words a line */
    swap: lerp(.25, .6, LV),                                                       /* share of swapped-letter typos (the subtle kind) */
    maxCh: 23,                                                                     /* characters a line may hold */
  };

  /* ---------- typos: swap two neighbours, drop one (4+ letters), or double one; never a real word, never unchanged ---------- */
  function misspell(w) {
    for (let k = 0; k < 30; k++) {
      const r = rng(), kind = r < TUNE.swap ? 'swap' : r < (1 + TUNE.swap) / 2 && w.length > 3 ? 'drop' : 'double'; let t;
      if (kind === 'swap') { const i = Math.floor(rng(w.length - 1)); if (w[i] === w[i + 1]) continue; t = w.slice(0, i) + w[i + 1] + w[i] + w.slice(i + 2); }
      else if (kind === 'drop') { const i = 1 + Math.floor(rng(w.length - 1)); t = w.slice(0, i) + w.slice(i + 1); }
      else { const i = Math.floor(rng(w.length)); if (w[i] === w[i + 1] || w[i] === w[i - 1]) continue; t = w.slice(0, i + 1) + w[i] + w.slice(i + 1); }
      if (t !== w && !WORDS.has(t) && !REAL.has(t)) { misspell.kind = kind; return t; }
    }
    return w.slice(0, -1) + w[w.length - 1] + w[w.length - 1];
  }
  function makeLine(y) {
    for (let k = 0; k < 40; k++) {
      const shapes = SHAPES[TUNE.words()], shape = shapes[Math.floor(rng(shapes.length))];
      const toks = shape.map(s => POOL[s] ? POOL[s][Math.floor(rng(POOL[s].length))] : s.toLowerCase());
      const can = shape.map((s, i) => POOL[s] ? i : -1).filter(i => i >= 0);           /* any content word, 3-letter ones too: no slot is a safe guess */
      if (!can.length || new Set(toks).size < toks.length) continue;
      misspell.kind = 'double'; const ti = can[Math.floor(rng(can.length))], bad = misspell(toks[ti]);
      const shown = toks.map((t, i) => (i === ti ? bad : t).toUpperCase()), len = shown.join(' ').length;
      if (len > TUNE.maxCh) continue;
      let x = Math.round((W / 2 - (len * CH - (CH - CH * 5 / 6)) / 2) * 3) / 3;
      const words = shown.map((s, i) => { const w = { s, fix: toks[i].toUpperCase(), typo: i === ti, x0: x, x1: x + s.length * CH - CH / 6 }; x += (s.length + 1) * CH; return w; });
      return { y, words, state: 'open', t: 0, hit: -1, n: words.length, swap: misspell.kind === 'swap' };
    }
    return makeLine(y);
  }

  /* ---------- 4. state ---------- */
  let G;
  function reset() {
    G = { lines: [], fixed: 0, botched: 0, printed: 0, combo: 0, bestCombo: 0, spin: 0, fixT: 0, fixPose: 'idle', flash: 0, bot: { line: null, t: 0 } };
    for (let k = 3; k >= 1; k--) G.lines.push(makeLine(FEED - k * SP));            /* three lines are already up when it starts */
    G.next = FEED - SP;                                                             /* the newest line's top: the next feeds in one pitch below it */
    ui.setScore(0);
  }
  const grade = () => G.fixed / Math.max(1, G.fixed + 2 * G.botched + G.printed);   /* a botch counts double: tapping words blind can't pass */
  const stats = () => [['CORRECTED', `${G.fixed} / ${G.fixed + G.botched + G.printed}`], ['BOTCHED', G.botched], ['MISPRINTS', G.printed], ['BEST CHAIN', G.bestCombo]];
  const urgent = () => G.lines.find(l => l.state === 'open' && l.y < FEED - 2);

  /* ---------- 5. verbs: mark a word. The typo gets the red pen; a good word botches the line. Float text goes under the line so the
     correction written above it stays readable. ---------- */
  function mark(l, i) {
    if (!R.live || !l || l.state !== 'open') return;
    const w = l.words[i], cx = (w.x0 + w.x1) / 2; l.hit = i; l.t = 0;
    if (w.typo) {
      l.state = 'fixed'; G.fixed++; G.combo++; G.bestCombo = Math.max(G.bestCombo, G.combo);
      ui.setScore(G.fixed); ui.bump(); ui.setCombo(G.combo, 1); if (G.combo >= 3) ui.pulseCombo();
      sfx.noise(.06, .05, 5000); sfx.ding(Math.min(8, G.combo)); fx.burst(cx, l.y + 2, ['#e84a3a', '#ff7a6a', '#fff6d6'], 7, 34, 60, .35); fx.ring(cx, l.y + 2, '#e84a3a', 10);
      ui.floatText(cx, l.y + 9, G.combo % 5 === 0 ? `${G.combo} IN A ROW!` : ['SPOTTED!', 'GOOD EYE!', 'FIXED!'][G.fixed % 3], 'gold');
      if (G.combo % 5 === 0) { sfx.golden(); MG.hitstop(.05); }
      G.fixT = .4; G.fixPose = 'cheer';
    } else {
      l.state = 'botched'; G.botched++; G.combo = 0; ui.setCombo(0, 1);
      sfx.typo(); R.shake(2); ui.floatText(cx, l.y + 9, 'THAT WAS FINE!', 'bad'); fx.burst(cx, l.y + 2, ['#1a0f14', '#5a5a66'], 6, 30, 80, .35);
      G.fixT = .45; G.fixPose = 'scared';
    }
  }
  function tapAt(x, y) {                                                            /* which word sits under the finger: the nearest line, then the nearest word */
    let best = null, bd = 9;
    for (const l of G.lines) { if (l.state !== 'open' || l.y >= FEED - 1 || l.y < DEAD - 2) continue; const d = Math.abs(y - (l.y + 2.33)); if (d < bd) { bd = d; best = l; } }
    if (!best) return;
    let wi = -1, wd = 5;
    best.words.forEach((w, i) => { const d = x < w.x0 ? w.x0 - x : x > w.x1 ? x - w.x1 : 0; if (d < wd) { wd = d; wi = i; } });
    if (wi >= 0) mark(best, wi);
  }

  /* ---------- 6. update ---------- */
  function update(dt) {
    const p = R.progress, v = R.live ? SP / TUNE.every(p) : 0;
    G.spin += v * dt; G.fixT = Math.max(0, G.fixT - dt); G.flash = Math.max(0, G.flash - dt);
    for (const l of G.lines) {
      l.y -= v * dt; l.t += dt;
      if (l.y < DEAD && !l.gone) {                                                  /* under the roller: printed as it stands */
        l.gone = true;
        if (l.state === 'open' && R.live) {
          l.state = 'printed'; G.printed++; G.combo = 0; ui.setCombo(0, 1); G.flash = .25;
          const w = l.words.find(q => q.typo); sfx.typo(); sfx.noise(.12, .06, 600); R.shake(2.5);
          ui.floatText((w.x0 + w.x1) / 2, DEAD + 6, 'MISPRINT!', 'bad'); fx.burst((w.x0 + w.x1) / 2, DEAD, ['#c0392b', '#1a0f14'], 8, 40, 60, .4);
          G.fixT = .5; G.fixPose = 'scared';
        } else sfx.thud();
      }
    }
    G.lines = G.lines.filter(l => l.y > DEAD - SP - 6);
    G.next -= v * dt;
    if (G.next <= FEED - SP) { G.next += SP; G.lines.push(makeLine(G.next)); }     /* a fresh line feeds in from the press */
  }

  /* ---------- 7. bot: reads the most urgent line (longer lines take longer), taps the typo; now and then the wrong word, or a slow read ---------- */
  function bot(dt) {
    const B = G.bot, l = urgent();
    if (!l) { B.line = null; return; }
    if (B.line !== l) { B.line = l; B.t = rng(.32, .52) + l.n * rng(.07, .12) + (l.swap ? rng(.05, .22) : 0) + (rng() < .08 ? rng(.4, .9) : 0); return; }
    if ((B.t -= dt) > 0) return;
    let i = l.words.findIndex(w => w.typo);
    if (rng() < lerp(.08, .1, LV) + (l.swap ? .05 : 0)) i = (i + 1 + Math.floor(rng(l.n - 1))) % l.n;   /* a fumble: the wrong word (swapped letters fool it more) */
    const w = l.words[i]; tapAt((w.x0 + w.x1) / 2 + rng(-1, 1), l.y + 2.33 + rng(-1.5, 1.5));
  }

  /* ---------- 8. draw ---------- */
  const oval = (cx, cy, rx, ry, col, th = .67) => {                                 /* a pen ring: an ellipse outline in 1/3-unit steps */
    g.fillStyle = col; const n = Math.ceil(Math.max(rx, ry) * 7);
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; g.fillRect(Math.round((cx + Math.cos(a) * rx) * 3) / 3 - th / 2, Math.round((cy + Math.sin(a) * ry) * 3) / 3 - th / 2, th, th); }
  };
  function drawLine(l, now, isUrgent) {
    const y = Math.round(l.y * 3) / 3;
    for (const [i, w] of l.words.entries()) {
      if (l.state === 'fixed' && w.typo) {                                           /* the red pen: ring it, strike it, write it right above */
        g.fillStyle = 'rgba(232,74,58,.16)'; g.fillRect(w.x0 - 1, y - 1, w.x1 - w.x0 + 2, 6.67);
        text(g, w.s, w.x0, y, '#8a7a7a', TS); g.fillStyle = '#d8392b'; g.fillRect(w.x0 - .67, y + 2, w.x1 - w.x0 + 1.33, .67);
        oval((w.x0 + w.x1) / 2, y + 2.33, (w.x1 - w.x0) / 2 + 2.5, 4.33, '#d8392b');
        const fw = textW(w.fix, .5), fx0 = clamp((w.x0 + w.x1) / 2 - fw / 2, PX0 + 1, PX1 - fw - 1); text(g, w.fix, fx0, y - 6.33, '#d8392b', .5);
        continue;
      }
      let col = '#1a0f14';
      if (l.state === 'botched' && w.typo) { g.fillStyle = 'rgba(255,210,58,.55)'; g.fillRect(w.x0 - .67, y - .67, w.x1 - w.x0 + 1.33, 6); }          /* this was the one */
      if (l.state === 'printed' && w.typo) { g.fillStyle = 'rgba(192,57,43,.3)'; g.fillRect(w.x0 - .67, y - .67, w.x1 - w.x0 + 1.33, 6); col = '#8a1a14'; }
      text(g, w.s, w.x0, y, col, TS);
      if (l.state === 'botched' && i === l.hit) {                                    /* a scribbled cross over the good word */
        g.fillStyle = '#d8392b'; const n = Math.round((w.x1 - w.x0) * 3);
        for (let k = 0; k <= n; k++) { const f = k / n, xx = w.x0 - .67 + f * (w.x1 - w.x0 + 1.33); g.fillRect(Math.round(xx * 3) / 3, Math.round((y - .33 + f * 5.33) * 3) / 3, .67, .67); g.fillRect(Math.round(xx * 3) / 3, Math.round((y + 5 - f * 5.33) * 3) / 3, .67, .67); }
      }
    }
    const mx = PX1 - 6;                                                              /* the margin: a tick, a cross, or the arrow on the urgent line */
    if (l.state === 'fixed') { g.fillStyle = '#2f8a35'; g.fillRect(mx, y + 2.33, 1.33, 1.33); g.fillRect(mx + 1, y + 3.33, 1.33, 1.33); g.fillRect(mx + 2, y + 2, 1.33, 1.67); g.fillRect(mx + 3, y + .67, 1.33, 1.67); g.fillRect(mx + 4, y - .33, 1.33, 1.33); }
    else if (l.state === 'botched' || l.state === 'printed') text(g, 'X', mx, y, '#d8392b', TS);
    else if (isUrgent) { const bx = PX0 + 1 + (Math.floor(now * 6) % 2 ? .67 : 0); g.fillStyle = '#d8392b'; g.fillRect(bx, y + .67, .67, 3.33); g.fillRect(bx + .67, y + 1.33, .67, 2); g.fillRect(bx + 1.33, y + 2, .67, .67); }
    if (isUrgent && R.ptr.type !== 'touch') l.words.forEach((w, i) => text(g, String(i + 1), Math.round(((w.x0 + w.x1) / 2 - textW(String(i + 1), .5) / 2) * 3) / 3, y + 6.33, '#b9a37c', .5));   /* faint key numbers for keyboard / mouse players */
  }
  function draw() {
    const now = performance.now() / 1000;
    st.hi(BACK, 0, 0);
    /* the galley strip: cream paper with faint rules that scroll with it, a red margin rule */
    g.fillStyle = '#1a0f14'; g.fillRect(PX0 - .67, DEAD - 4, PX1 - PX0 + 1.33, FEED - DEAD + 6);
    g.fillStyle = '#fff6d6'; g.fillRect(PX0, DEAD - 4, PX1 - PX0, FEED - DEAD + 6);
    g.fillStyle = '#ffffff'; g.fillRect(PX0, DEAD - 4, .67, FEED - DEAD + 6);
    const off = ((G.next - FEED) % SP + SP) % SP;
    g.fillStyle = '#ede0b8'; for (let y = FEED + off - SP + 8.33; y > DEAD - 4; y -= SP) g.fillRect(PX0 + 3, Math.round(y * 3) / 3, PX1 - PX0 - 6, .33);
    g.fillStyle = 'rgba(216,57,43,.35)'; g.fillRect(PX0 + 4.67, DEAD - 4, .33, FEED - DEAD + 6);
    g.save(); g.beginPath(); g.rect(PX0, DEAD - 4, PX1 - PX0, FEED - DEAD + 4); g.clip();
    const u = urgent();
    for (const l of G.lines) drawLine(l, now, l === u && !R.done);
    g.restore();
    /* the danger strip under the roller: a red dashed line with TO PRESS */
    for (let x = PX0; x < PX1; x += 4) { g.fillStyle = Math.floor(now * 4 + x / 4) % 2 ? '#d8392b' : '#ffd23a'; g.fillRect(x, DEAD - 1, 2.67, .67); }
    st.hi(FRONT, 0, 0);
    const k = Math.floor(G.spin / 2.67) % 4;                                        /* the roller turns */
    g.fillStyle = dSh; for (let x = 4 + k * .67; x < W - 6; x += 2.67) g.fillRect(Math.round(x * 3) / 3, 31.33, .67, 3);
    g.fillStyle = dLi; for (let x = 5 + k * .67; x < W - 6; x += 5.33) g.fillRect(Math.round(x * 3) / 3, 22.67, .67, 1.33);
    if (G.flash > 0) { g.fillStyle = `rgba(216,57,43,${(G.flash * 2).toFixed(2)})`; g.fillRect(3, 20, W - 6, 15.33); }
    const tw = textW('TO PRESS', .5); g.fillStyle = '#1a0f14'; g.fillRect(W / 2 - tw / 2 - 1.67, 32, tw + 3.33, 5.33); text(g, 'TO PRESS', W / 2 - tw / 2, 33, '#ffd23a', .5);
    /* the fixer, red pencil up, proofreading from the press */
    const pose = R.done ? (R.won ? 'cheer' : 'scared') : G.fixT > 0 ? G.fixPose : 'hold0';
    R.crew(17, H - 1, pose, { expr: pose === 'hold0' ? 'inspect' : undefined });
    if (pose === 'hold0') st.hi(PEN, 18, H - 1 - 12.33 - PEN.height / 3 + 4);
    fx.draw(g);
  }

  /* ---------- 9. input + run ---------- */
  window.TYPOS = { get G() { return G; }, mark, TUNE, misspell };
  R.run({
    reset, update, draw, grade, stats, bot,
    ended() { for (const l of G.lines) if (l.state === 'open' && l.y < FEED - 2 && R.won) fx.burst(PX1 - 4, l.y + 2, ['#74c648', '#fff6d6'], 3, 20, 40, .3); },
    down(x, y) { tapAt(x, y); },
    key(ev, k) { if (!ev.repeat && k >= '1' && k <= '4') { const l = urgent(); if (l && +k <= l.n) mark(l, +k - 1); } },
  });
})();
