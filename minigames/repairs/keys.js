/* ============================================================
   BANANA MUSH IN THE KEYS (repair "keys", verb POP, 10 s). Somebody's snack went everywhere: keys are stuck down under banana mush.
   Plunge each stuck key back up. Clean keys are decoys: a tap on one types a typo onto the page. Left alone, mush oozes onto a
   neighbouring key, and more globs keep landing through the run; a heaped glob takes two pops.
   Grade = pops / (pops + keys still stuck + half the spreads), times (1 - 1.3 x the share of taps that were typos). Level: more stuck keys and globs, faster oozing, more heaps.
   Controls: tap / click the stuck keys (the plunger follows the mouse), or type their letters (Space for the space bar).
   Layout: 1 sprites · 2 setup · 3 tuning · 4 state · 5 verbs · 6 update · 7 bot · 8 draw · 9 run (as leak.js).
   ============================================================ */
(() => {
  'use strict';
  const { clamp, lerp, sfx } = MG;
  const { R: AR, shapes: { ell, box, cap, and, or } } = MGArt, { make, hl, cvs, text, textW } = MGArt3;

  /* ---------- 1. sprites that don't need the desk colour (hi-res, 3 px per unit) ---------- */
  const CAPS = {};
  const capSpr = (ch, down, face = AR.paper) => {                               /* a round key cap, 11x12 units; down = pressed into the bed */
    const k = ch + down + face; if (CAPS[k]) return CAPS[k];
    const dy = down ? 3 : 0, cv = make(33, 36, px => {
      if (!down) px.shape(ell(16.5, 20, 16.5, 15.5), AR.woodD, 1);
      px.shape(ell(16.5, 16 + dy, 16.5, 15), AR.metal, 2); px.shape(ell(16.5, 15 + dy, 12.5, 11.5), face, 3);
      px.tone(9, 7 + dy, 2); px.tone(10, 6 + dy, 2); px.tone(8, 8 + dy, 2);
    });
    if (ch !== ' ') text(cv.getContext('2d'), ch, 12, 8 + dy, '#1a0f14', 2);
    return (CAPS[k] = cv);
  };
  const SPACE = [false, true].map(down => { const dy = down ? 3 : 0; return make(150, 30, px => {   /* the space bar, 50x10 units */
    if (!down) px.shape(or(box(4, 9, 142, 19), ell(5, 17, 5, 10), ell(145, 17, 5, 10)), AR.woodD, 1);
    px.shape(or(box(6, 2 + dy, 138, 22), ell(7, 13 + dy, 7, 11), ell(143, 13 + dy, 7, 11)), AR.metal, 2); px.shape(box(9, 5 + dy, 132, 15), AR.paper, 3); hl(px, 10, 6 + dy, 30, 2, 2);
  }); });
  const MUSH_R = AR.pine;                                                       /* banana mush: the kit's pineapple-gold ramp, with rotten flecks */
  const MUSH = [0, 1].map(heavy => [0, 1, 2].map(v => make(45, 39, px => {      /* mush heaped on a key: 15x13 units; heavy ones are taller and carry a scrap of peel */
    const r = MG.seeded(17 + v * 5 + heavy * 3), lobes = [ell(22.5, 21, heavy ? 15 : 13, heavy ? 11 : 9)];
    for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28 + r() * .7, d = heavy ? 11 : 9.5; lobes.push(ell(22.5 + Math.cos(a) * d, 21 + Math.sin(a) * d * .7, 3.4 + r() * 2.6, 3 + r() * 2)); }
    lobes.push(cap(22.5 + (v - 1) * 9, 24, 22.5 + (v - 1) * 9.5, 33 + r() * 4, 2.2));          /* a drip down the side */
    px.shape(or(...lobes), MUSH_R, 1);
    if (heavy) { px.shape(or(ell(22.5, 12, 10, 7), ell(18, 9, 5, 4)), MUSH_R, 2); px.shape(or(cap(11, 8, 27, 4, 2.6), cap(27, 4, 35, 9, 2.2)), AR.banY, 3); }
    for (let i = 0; i < 6 + heavy * 4; i++) { const x = 10 + Math.floor(r() * 25), y = 13 + Math.floor(r() * 14); px.dot(x, y, AR.rotten, 1, 4); px.dot(x + 1, y, AR.rotten, 0, 4); }
    hl(px, 14, heavy ? 8 : 14, 5, 1, 2); hl(px, 13, heavy ? 9 : 15, 1, 2, 2);
  })));
  const GLOB = make(24, 27, px => { px.shape(or(ell(12, 16, 10, 9), ell(7, 8, 4, 4), ell(17, 9, 3, 3)), MUSH_R, 1); px.shape(cap(8, 4, 15, 2, 1.6), AR.banY, 2); px.dot(10, 15, AR.rotten, 1, 3); px.dot(14, 19, AR.rotten, 1, 3); });
  const PLUNGER = [0, 1, 2].map(k => make(45, 66, px => {                       /* a plunger, 15x22 units: 0 rest, 1 squashed on a key, 2 stretched as it pulls */
    const cw = [14, 18, 11][k], ch = [10, 7, 13][k], cy = 66 - ch, top = k === 2 ? 0 : 4;
    px.shape(box(19, top, 7, cy - top), AR.wood, 1); px.shape(box(19, top, 7, 4), AR.woodD, 2);
    px.shape(and(ell(22.5, 66, cw + 1, ch * 2), (x, y) => y < 66), AR.red, 3); px.shape(box(22.5 - cw - 1, 62, cw * 2 + 2, 4), AR.red, 4);
    hl(px, 14, cy + 3, 4, 2, 2);
  }));
  const TYPEBAR_TIPS = 'QWERTYUIOP';

  /* ---------- 2. setup ---------- */
  const R = MGRepair.setup({
    id: 'keys', verb: 'POP', scoreIcon: capSpr('P', true),
    how: 'Pop the <em>mushy</em> keys · clean keys make typos',
    legend: [[MUSH[0][0], '<em>pop</em> stuck keys'], [capSpr('A', false), 'clean key: <em class="bad">typo</em>']],
    hint: 'tap · click · or type the letters',
  });
  const { st, g, W, H, ui, fx, rng, level: LV } = R;

  /* the keyboard: real QWERTY so the letters can be typed; positions are key centres */
  const ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'], ROW_Y = [80, 95, 110], ROW_X = [7.7, 13.5, 19.3], DX = 11.6, SPACE_Y = 124;
  const KEYS = [];
  ROWS.forEach((row, r) => row.split('').forEach((ch, i) => KEYS.push({ ch, r, x: ROW_X[r] + i * DX, y: ROW_Y[r], w: 5.8, h: 7.4 })));
  KEYS.push({ ch: ' ', r: 3, x: 60, y: SPACE_Y, w: 25, h: 5.6 });
  KEYS.forEach((k, i) => { k.i = i; });
  /* neighbours as indices: reset() resolves them against the live keys (the templates carry no state) */
  KEYS.forEach(k => { k.nb = KEYS.filter(o => o !== k && (k.ch === ' ' || o.ch === ' ' ? Math.abs(o.y - k.y) < 16 && Math.abs(o.x - k.x) < 30 && (o.r === 2 || k.r === 2) : Math.hypot(o.x - k.x, o.y - k.y) < 16)).map(o => o.i); });
  const PAPER = { x: 26, y: 0, w: 68, h: 37 }, LINE = 20, LY = 23.33, FOOT = 64, MONKEY_X = 107;   /* LY: the line the pops type onto */
  const PLATEN = make(360, 33, px => { px.shape(cap(30, 16, 330, 16, 12), AR.ink, 1); hl(px, 30, 8, 300, 2, 2); px.shape(or(ell(15, 16, 13, 16), ell(345, 16, 13, 16)), AR.metal, 2); px.shape(or(box(26, 12, 8, 8), box(326, 12, 8, 8)), AR.metal, 3); });
  const BODY = make(360, 336, px => {                                           /* units y 40..152: the machine round the keyboard, in the desk colour */
    px.shape(or(box(0, 12, 360, 312), ell(180, 12, 180, 14)), R.deskR, 1);
    px.shape(or(box(6, 90, 348, 198), ell(180, 90, 174, 8)), AR.ink, 2);        /* the keyboard well */
    px.shape(and(ell(180, 66, 84, 50), (x, y) => y < 66), AR.ink, 2);            /* the opening onto the typebars */
    for (let i = 0; i < 10; i++) { const a = Math.PI * (.12 + i * .084); px.shape(cap(180 + Math.cos(a) * 30, 66 - Math.sin(a) * 18, 180 + Math.cos(a) * 76, 66 - Math.sin(a) * 42, 2.2), AR.metal, 3); }
    px.shape(box(118, 300, 124, 18), AR.gold, 3);
    px.shape(or(ell(14, 330, 12, 6), ell(346, 330, 12, 6)), AR.ink, 2);
    hl(px, 0, 14, 360, 2, 2);
  });
  { const x = BODY.getContext('2d'), nm = MGRepair.DESKS[R.desk].name.toUpperCase(); text(x, nm, 180 - textW(nm, 1) / 2, 306, '#1a0f14', 1); }
  const ROOM = cvs(W * 3, H * 3, x => {
    const r = (c, a, b, w, hh) => { x.fillStyle = c; x.fillRect(a * 3, b * 3, w * 3, hh * 3); };
    r('#12402a', 0, 0, W, H); for (let sx = 0; sx < W; sx += 8) r('#0f3824', sx, 0, 4, 46);                                     /* the Floor's wall */
    r('#1a0f14', PAPER.x - .33, 0, PAPER.w + .67, PAPER.h + .33); r('#fff6d6', PAPER.x, 0, PAPER.w, PAPER.h); r('#ede0b8', PAPER.x, 0, 1, PAPER.h);
    for (let i = 0; i < 3; i++) r('#e6d8aa', PAPER.x + 3, 12.33 + i * 7.33, PAPER.w - 6, .33);                                     /* ruled lines (the first one clears the timer bar) */
    text(x, 'THE QUICK BROWN MONKEY', (PAPER.x + 3) * 3, 9 * 3, '#8a7a80', 1); text(x, 'TYPES ON A STICKY KEY', (PAPER.x + 3) * 3, 16.33 * 3, '#8a7a80', 1);
    r('#1a0f14', 0, 151.33, W, .67); r('#5a3517', 0, 152, W, 8); r('#8a5a2b', 0, 152, W, .67); r('rgba(0,0,0,.35)', 0, 152.67, W, 2);   /* the desk */
    x.drawImage(BODY, 0, 40 * 3);
    x.drawImage(PLATEN, 0, 30 * 3);
    for (let i = 0; i < 3; i++) { const [a, b] = [[8, 52], [96, 50], [44, 136]][i]; x.fillStyle = '#a8681a'; x.fillRect(a * 3, b * 3, 9, 6); x.fillStyle = '#f2b23a'; x.fillRect(a * 3 + 1, b * 3, 6, 4); }   /* mush flecks on the body */
  });

  /* ---------- 3. tuning ---------- */
  const TUNE = {
    start: 3 + Math.round(LV),                                                  /* stuck from the first frame */
    drops: 7 + Math.round(LV * 7),                                            /* more globs through the run */
    pair: p => p < .15 ? 0 : lerp(.15, .5, LV),                                 /* chance a second glob comes with one */
    heavy: p => lerp(.15, .45, LV) * (p < .15 ? .5 : 1),                         /* a heaped glob takes two pops */
    ooze: p => lerp(2.3, 1.9, LV) * lerp(1.1, .85, p),                           /* seconds a stuck key waits before it oozes onto a neighbour (once: see update) */
    warn: .7, fall: .55, last: 1.5,                                             /* ooze warning; glob fall time; no globs in the last 1.5 s */
    typo: 1.3, spreadW: .5,                                                     /* grade costs: typo share of all taps (x1.3), an ooze counts half a stuck key */
  };

  /* ---------- 4. state ---------- */
  let G;
  function reset() {
    const keys = KEYS.map(k => ({ ...k, mush: 0, t: 0, to: null, ooze: 0, oozed: false, pop: 0, bad: 0, down: 0, hit: 0, v: 0 }));
    keys.forEach(k => { k.near = k.nb.map(i => keys[i]); });
    const plan = [], n = TUNE.drops, end = R.seconds - TUNE.last;
    for (let i = 0; i < n; i++) plan.push(lerp(1.1, end, n > 1 ? i / (n - 1) : .5) + rng(-.3, .3));
    G = { keys, plan: plan.sort((a, b) => a - b), globs: [], pops: 0, spreads: 0, typos: 0, combo: 0, bestCombo: 0, typed: [], flyers: [], early: false,
      px: 60, py: 140, plunge: 0, pk: null, mood: 0, moodT: 0, hover: false, bot: { react: .3, aim: null } };
    const pool = G.keys.filter(k => k.ch !== ' ');
    for (let i = 0; i < TUNE.start; i++) { const free = pool.filter(k => !k.mush && !k.near.some(o => o.mush)); stick(free[Math.floor(rng(free.length))], i === 1 && LV >= .5 ? 2 : 1, true); }
    ui.setScore(0);
  }
  const left = () => G.keys.filter(k => k.mush).length;
  const grade = () => clamp(G.pops / Math.max(1, G.pops + left() + TUNE.spreadW * G.spreads) * (1 - TUNE.typo * G.typos / Math.max(1, G.pops + G.typos)), 0, 1);
  const stats = () => [['POPPED', G.pops], ['STILL STUCK', left()], ['OOZED', G.spreads], ['TYPOS', G.typos], ...(G.early && R.timer.left >= .5 ? [['TIME LEFT', R.timer.left.toFixed(1) + 's']] : [])];

  /* ---------- 5. verbs: mush sticks a key down; a tap pops it (or squelches a heap); a tap on a clean key is a typo ---------- */
  const say = (x, y, s, c) => ui.floatText(clamp(x, 3 + s.length * 2.3, W - 3 - s.length * 2.3), y, s, c);   /* a float that stays on the stage at phone scale */
  function stick(k, amount, quiet) {
    k.mush = Math.max(k.mush, amount); k.oozed = false; k.t = 0; k.to = null; k.ooze = TUNE.ooze(R.progress) * rng(.85, 1.15); k.v = Math.floor(rng(3)); k.hit = .2;
    if (quiet) return;
    fx.burst(k.x, k.y - 2, ['#f2b23a', '#ffe28a', '#a8681a'], 8, 36, 150, .4); sfx.noise(.08, .06, 900); sfx.tone(160, 90, .1, 'triangle', .05); R.shake(1);
  }
  function press(k) {                                                           /* the player's verb: the plunger comes down on k */
    if (!R.live) return;
    G.plunge = .24; G.pk = k; G.px = k.x; G.py = k.y;
    if (k.mush) {
      if (k.mush > 1) { k.mush = 1; k.hit = .15; k.t = Math.min(k.t, k.ooze * .5); k.to = null; fx.burst(k.x, k.y - 4, ['#f2b23a', '#ffe28a', '#fff08c'], 7, 40, 120, .35); sfx.noise(.07, .07, 1600); sfx.tone(240, 420, .07, 'triangle', .05); say(k.x, k.y - 10, 'SQUELCH', ''); return; }
      k.mush = 0; k.to = null; k.pop = .3; G.pops++; G.combo++; G.bestCombo = Math.max(G.bestCombo, G.combo); G.mood = 1; G.moodT = .45;
      fx.burst(k.x, k.y - 4, ['#f2b23a', '#ffe28a', '#a8681a', '#fff08c'], 12, 55, 160, .45); fx.ring(k.x, k.y, '#fff08c', 9);
      sfx.tone(320, 980, .1, 'square', .05); sfx.tone(980, 1320, .06, 'sine', .04, .08); sfx.clack(Math.min(10, G.combo));
      ui.setScore(G.pops); ui.bump(); ui.setCombo(G.combo, 1); if (G.combo >= 3) ui.pulseCombo();
      say(k.x, k.y - 11, G.combo >= 4 ? `POP x${G.combo}` : 'POP!', G.combo >= 4 ? 'gold' : '');
      if (G.combo === 6) MG.hitstop(.05);
      G.flyers.push({ ch: k.ch, x0: k.x, y0: k.y - 4, t: 0, bad: false });
      return;
    }
    if (G.globs.some(o => o.k === k && o.t > .6)) return;                       /* a glob is about to land there: the plunger just meets it */
    k.down = .12; k.bad = .3; G.typos++; G.combo = 0; G.mood = -1; G.moodT = .5; ui.setCombo(0, 1);
    sfx.typo(); sfx.clack(0); say(k.x, k.y - 11, 'TYPO!', 'bad'); ui.doFlash('rgba(192,57,43,.25)');
    G.flyers.push({ ch: k.ch, x0: k.x, y0: k.y - 4, t: 0, bad: true });
  }
  const keyAt = (x, y) => { let best = null, bd = 1e9; for (const k of G.keys) { const dx = Math.max(0, Math.abs(x - k.x) - k.w), dy = Math.max(0, Math.abs(y - k.y) - k.h), d = dx * dx + dy * dy; if (d < bd) { bd = d; best = k; } } return bd <= 4 ? best : null; };
  function tapAt(x, y) { const k = keyAt(x, y); if (k) press(k); else { G.px = x; G.py = y; } }
  function drop() {                                                             /* a glob (sometimes two) of mush lobbed in from above */
    const free = G.keys.filter(k => !k.mush && k.pop <= 0 && !G.globs.some(o => o.k === k) && k.ch !== ' ');
    if (!free.length) return false;
    const k = free[Math.floor(rng(free.length))], far = free.filter(o => Math.abs(o.x - k.x) > 30), two = G.plan.length > 1 && far.length && rng() < TUNE.pair(R.progress);
    for (const t of two ? [k, far[Math.floor(rng(far.length))]] : [k]) G.globs.push({ k: t, t: 0, x0: t.x + rng(-20, 20), heavy: rng() < TUNE.heavy(R.progress) ? 2 : 1 });
    if (two) G.plan.splice(1, 1);
    sfx.tone(700, 300, .18, 'sine', .03); return true;
  }

  /* ---------- 6. update ---------- */
  function update(dt) {
    const now = R.t;
    if (R.live) while (G.plan.length && G.plan[0] <= now) { if (!drop()) { G.plan[0] += .25; break; } G.plan.shift(); }
    for (const o of G.globs) { o.t += dt / TUNE.fall; if (o.t >= 1) { o.dead = true; if (R.live) stick(o.k, o.heavy); } }
    G.globs = G.globs.filter(o => !o.dead);
    for (const k of G.keys) {
      k.pop = Math.max(0, k.pop - dt); k.bad = Math.max(0, k.bad - dt); k.down = Math.max(0, k.down - dt); k.hit = Math.max(0, k.hit - dt);
      if (!k.mush || !R.live) continue;
      k.t += dt;
      if (k.oozed) continue;                                                     /* a key oozes once, and a key it oozed onto never does: no runaway chains */
      if (!k.to && k.t >= k.ooze - TUNE.warn) { const c = k.near.filter(o => !o.mush && o.pop <= 0 && !G.globs.some(b => b.k === o)); k.to = c.length ? c[Math.floor(rng(c.length))] : null; if (!k.to) k.t = k.ooze - TUNE.warn - .4; }
      if (k.to && k.t >= k.ooze) {                                              /* it oozes over */
        const o = k.to; k.to = null; k.t = 0; k.ooze = TUNE.ooze(R.progress) * rng(.85, 1.15);
        k.oozed = true; if (!o.mush) { stick(o, 1); o.oozed = true; G.spreads++; G.combo = 0; ui.setCombo(0, 1); G.mood = -1; G.moodT = .5; say(o.x, o.y - 11, 'OOZE!', 'bad'); }
      }
    }
    for (const f of G.flyers) { f.t += dt / .28; if (f.t >= 1 && !f.dead) { f.dead = true; G.typed.push({ ch: f.ch === ' ' ? ' ' : f.ch, bad: f.bad }); if (G.typed.length > LINE) G.typed.shift(); sfx.tone(f.bad ? 200 : 900, f.bad ? 160 : 700, .03, 'square', .03); } }
    G.flyers = G.flyers.filter(f => !f.dead);
    G.plunge = Math.max(0, G.plunge - dt); G.moodT = Math.max(0, G.moodT - dt); if (G.moodT <= 0) G.mood = 0;
    if (R.live && !G.plan.length && !G.globs.length && !left()) { G.early = true; ui.floatText(W / 2, 66, G.typos ? 'ALL KEYS UP!' : 'SPOTLESS!', 'gold big'); R.end(); }
  }

  /* ---------- 7. bot (?bot=1): taps the stuck key closest to oozing, a beat apart like a quick thumb. Aim error from R.rng; now and then it
     catches the clean key next door (a typo) or hesitates. Heaps need two taps, as for a person. ---------- */
  function bot(dt) {
    const B = G.bot;
    if ((B.react -= dt) > 0) return;
    const stuck = G.keys.filter(k => k.mush && k.hit <= 0).sort((a, b) => (b.t / b.ooze) - (a.t / a.ooze));
    if (!stuck.length) { B.react = .08; return; }
    let k = stuck[0];
    if (rng() < .09 && k.near.length) { const c = k.near.filter(o => !o.mush); if (c.length) k = c[Math.floor(rng(c.length))]; }   /* fat-fingered */
    tapAt(k.x + rng(-2.5, 2.5), k.y + rng(-2.5, 2.5));
    B.react = rng(.22, .4) + (rng() < .08 ? rng(.3, .6) : 0);
  }

  /* ---------- 8. draw ---------- */
  function drawKey(k, now) {
    const space = k.ch === ' ', wob = k.bad > 0 ? (Math.floor(k.bad * 40) % 2 ? .33 : -.33) : 0;
    const down = !!k.mush || k.down > 0, bounce = k.pop > 0 ? -Math.sin((1 - k.pop / .3) * Math.PI) * 2.33 : 0;
    const cv = space ? SPACE[down ? 1 : 0] : capSpr(k.ch, down, k.mush ? AR.metal : AR.paper);
    st.hi(cv, k.x - cv.width / 6 + wob, k.y - 6 + bounce);
    if (k.bad > 0) { g.fillStyle = `rgba(232,72,48,${(k.bad * 1.6).toFixed(2)})`; g.fillRect(k.x - 4 + wob, k.y - 4, 8, 7); }
    if (!k.mush) return;
    const warn = k.to ? clamp((k.t - (k.ooze - TUNE.warn)) / TUNE.warn, 0, 1) : 0, puls = warn > 0 && Math.floor(now * 12) % 2 ? .33 : 0, jit = k.hit > 0 ? (Math.floor(k.hit * 50) % 2 ? .33 : -.33) : 0;
    if (k.to && warn > 0) {                                                      /* the ooze reaches toward its next victim */
      const o = k.to, n = Math.round(warn * 10);
      for (let i = 1; i <= n; i++) { const t = i / 12, x = lerp(k.x, o.x, t), y = lerp(k.y, o.y, t) + Math.sin(t * Math.PI) * 1.5; g.fillStyle = '#a8681a'; g.fillRect(Math.round(x * 3) / 3 - 1, Math.round(y * 3) / 3 - .67, 2, 2); g.fillStyle = '#f2b23a'; g.fillRect(Math.round(x * 3) / 3 - .67, Math.round(y * 3) / 3 - .67, 1.33, 1.33); }
    }
    const m = MUSH[k.mush > 1 ? 1 : 0][k.v];
    st.hi(m, k.x - 7.5 + jit - puls / 2, k.y - 6.33 - (k.mush > 1 ? 1.67 : 0) - puls);
    if (!space) { const lx = Math.round((k.x - 1.67 + jit) * 3) / 3, ly = k.y - 3.33 - puls; g.fillStyle = '#ffe28a'; g.fillRect(lx - .67, ly - .67, 4.67, 6); text(g, k.ch, lx, ly, '#1a0f14', 2 / 3); }   /* its letter shows through, for typists */
    if (warn > .4 && Math.floor(now * 6 + k.i) % 3 === 0) { g.fillStyle = '#ffe28a'; g.fillRect(k.x - 2 + (k.i % 3), k.y - 6 - warn * 2, 1, 1); }   /* it bubbles */
  }
  let cur = '';
  function draw() {
    const now = performance.now() / 1000, want = R.live && G.hover ? 'none' : 'pointer';
    if (want !== cur) { cur = want; st.cv.parentNode.style.cursor = want; }      /* the plunger is the cursor while playing */
    st.hi(ROOM, 0, 0);
    /* the page: what the keys type, popped letters in ink and typos in red */
    const line = G.typed.slice(-LINE), ly = LY;
    line.forEach((c, i) => { if (c.ch !== ' ') text(g, c.ch, PAPER.x + 4 + i * 3, ly, c.bad ? '#c0392b' : '#2a1a20', .5); });
    if (R.live && Math.floor(now * 3) % 2) { g.fillStyle = '#c0392b'; g.fillRect(PAPER.x + 4 + Math.min(line.length, LINE - 1) * 3, ly + 4, 2.33, .67); }
    /* the fixer watches from the top of the machine */
    const pose = R.done ? (R.won ? 'cheer' : 'scared') : G.mood > 0 ? 'cheer' : G.mood < 0 ? 'scared' : Math.floor(now * 2.4) % 2 ? 'breathe' : 'idle';
    g.fillStyle = 'rgba(10,6,4,.4)'; g.fillRect(MONKEY_X - 5, FOOT - .33, 10, 1);
    R.crew(MONKEY_X, FOOT, pose, { flip: true });
    for (const k of G.keys) drawKey(k, now);
    for (const o of G.globs) {                                                  /* mush falling in, its shadow growing on the key below */
      const t = Math.min(1, o.t), x = lerp(o.x0, o.k.x, t), y = lerp(-8, o.k.y - 4, t * t);
      g.fillStyle = `rgba(20,10,4,${(.2 + t * .4).toFixed(2)})`; const sw = 2 + t * 6; g.fillRect(Math.round((o.k.x - sw / 2) * 3) / 3, o.k.y - 1, Math.round(sw * 3) / 3, 1.33);
      st.hi(GLOB, x - 4, y - 4.5);
    }
    for (const f of G.flyers) {                                                 /* each pop types its letter onto the page */
      const k = f.t, e = k * k * (3 - 2 * k), tx = PAPER.x + 5 + Math.min(G.typed.length, LINE - 1) * 3, ty = LY + 1.67, x = lerp(f.x0, tx, e), y = lerp(f.y0, ty, e) - Math.sin(k * Math.PI) * 12;
      g.fillStyle = '#1a0f14'; g.fillRect(x - 2.67, y - 3.33, 5.33, 6.67); g.fillStyle = f.bad ? '#ffd0c8' : '#fff6d6'; g.fillRect(x - 2, y - 2.67, 4, 5.33);
      if (f.ch !== ' ') text(g, f.ch, x - 1, y - 1.67, f.bad ? '#c0392b' : '#1a0f14', 1 / 3);
    }
    /* the plunger: hovers over the pointer, comes down on a press, stretches as it pulls the key up */
    if (!R.done && (G.hover || G.plunge > 0 || R.bot)) {
      const k = G.plunge > 0 ? G.pk : null, ph = k ? 1 - G.plunge / .24 : 0, spr = k ? (ph < .3 ? PLUNGER[1] : PLUNGER[2]) : PLUNGER[0];
      const bx = k ? k.x : G.px, by = k ? k.y - 1 - (ph < .3 ? 0 : (ph - .3) * 8) : G.py - 3;
      if (!k) { g.fillStyle = 'rgba(10,6,4,.35)'; g.fillRect(bx - 3, G.py + 1, 6, 1); }
      st.hi(spr, bx - 7.5, by - 21);
    }
    fx.draw(g);
  }

  /* ---------- 9. input + run ---------- */
  window.KEYS = { get G() { return G; }, TUNE, press, tapAt };
  R.run({
    reset, update, draw, grade, stats, bot,
    ended() { G.globs = []; if (R.won) G.keys.forEach(k => { if (!k.mush && k.ch !== ' ' && MG.rng() < .3) fx.spark(k.x, k.y - 4, '#fff08c'); }); },
    down(x, y) { G.hover = true; tapAt(x, y); },
    move(x, y, ev) { if (ev.pointerType === 'mouse') { G.hover = true; if (G.plunge <= 0) { G.px = x; G.py = y; } } },
    key(ev, k) {
      if (ev.repeat) return;
      const key = k === ' ' ? G.keys.find(o => o.ch === ' ') : k.length === 1 ? G.keys.find(o => o.ch === k.toUpperCase()) : null;
      if (key) { G.hover = true; press(key); }
    },
  });
})();
