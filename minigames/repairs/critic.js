/* ============================================================
   BAD REVIEW (repair "critic", verb STAMP, 10 s): the global problem a rotten banana sets off.
   A critic panned us, and the clippings are rolling in on the press-room belt. The fixer rides a big rubber RAVE stamp over the belt:
   slam it on every bad review (one or two stars, the critic owl's mugshot) as it passes under, and let the good ones (four or five stars,
   a heart) ride. Dead centre prints a clean RAVE; early or late prints it crooked, worth less. Stamping a good review OVERHYPES it; a bad
   review that gets past is PANNED. Stamped clippings get pinned on the Wall of Raves; the owl on the back-issue pile takes it personally.
   Grade = (clean raves + .6 x crooked - 1.5 x overhyped - .25 x smudges on the bare belt) / bad reviews that reached the stamp, so
   mashing the stamp can't pass. Level: a faster belt, closer clippings, more good reviews mixed in, a narrower clean window.
   Controls: tap / click anywhere, Space, ↓, S or Enter slams the stamp.
   Layout of this file (as leak.js): 1 sprites · 2 setup · 3 tuning · 4 state · 5 verbs · 6 update · 7 bot · 8 draw · 9 run.
   ============================================================ */
(() => {
  'use strict';
  const { clamp, lerp, sfx } = MG;
  const { R: AR, shapes: { ell, box, poly, and, or, sub, cap } } = MGArt, { make, hl, cvs, text, textW } = MGArt3;

  /* ---------- 1. sprites that don't need the desk colour ---------- */
  const CLW = 30, CLH = 31;                                                          /* a clipping, in units */
  const BAD_Q = ['DULL!', 'YAWN!', 'AWFUL!', 'BORING', 'A FLOP', 'TRIPE!', 'SNOOZE', 'DREARY', 'ROTTEN', 'MEH.', 'UGH!', 'STINKS'];
  const GOOD_Q = ['WOW!', 'BRAVO!', 'GENIUS!', 'SUPERB', 'A ROMP!', 'MAGIC!', 'A GEM!', 'JOYFUL', 'STUNNER', 'LOVE IT'];
  const PAPERS = ['CANOPY TIMES', 'VINE GAZETTE', 'THE DAILY PEEL', 'JUNGLE HERALD', 'BANANA BUGLE', 'TREETOP POST'];
  const starAt = (ox, oy, s = 1) => poly([[7, 0], [9, 4.8], [14, 5.2], [10.2, 8.6], [11.4, 13.6], [7, 11], [2.6, 13.6], [3.8, 8.6], [0, 5.2], [5, 4.8]].map(([x, y]) => [ox + x * s, oy + y * s]));
  const STAR = make(16, 16, px => { px.shape(starAt(1, 1), AR.gold, 1); px.tone(6, 5, 2); px.tone(7, 4, 2); });
  const HOLE = make(16, 16, px => { px.shape(starAt(1, 1), AR.paper, 1); });
  const owlHead = (px, cx, cy, s, angry) => {                                       /* the critic's mugshot (and the HUD-sized head) */
    px.shape(or(poly([[cx - 8 * s, cy - 2 * s], [cx - 9 * s, cy - 9 * s], [cx - 3 * s, cy - 6 * s]]), poly([[cx + 8 * s, cy - 2 * s], [cx + 9 * s, cy - 9 * s], [cx + 3 * s, cy - 6 * s]]), ell(cx, cy + 1 * s, 9 * s, 8 * s)), AR.woodD, 1);
    px.shape(or(ell(cx - 3.6 * s, cy, 3.8 * s, 3.6 * s), ell(cx + 3.6 * s, cy, 3.8 * s, 3.6 * s)), AR.woodL, 2);
    px.shape(or(ell(cx - 3.6 * s, cy + .4 * s, 2.3 * s, 2.3 * s), ell(cx + 3.6 * s, cy + .4 * s, 2.3 * s, 2.3 * s)), AR.banY, 3);
    px.shape(or(ell(cx - 3.3 * s, cy + .8 * s, 1.1 * s, 1.1 * s), ell(cx + 3.3 * s, cy + .8 * s, 1.1 * s, 1.1 * s)), AR.ink, 4);
    if (angry) px.shape(or(cap(cx - 7 * s, cy - 3.4 * s, cx - 1 * s, cy - 1 * s, .9 * s), cap(cx + 7 * s, cy - 3.4 * s, cx + 1 * s, cy - 1 * s, .9 * s)), AR.ink, 5);
    px.shape(poly([[cx - 1.4 * s, cy + 2.4 * s], [cx + 1.4 * s, cy + 2.4 * s], [cx, cy + 5 * s]]), AR.pine, 5);
    px.shape(sub(ell(cx + 3.6 * s, cy + .4 * s, 3.4 * s, 3.4 * s), ell(cx + 3.6 * s, cy + .4 * s, 2.5 * s, 2.5 * s)), AR.gold, 6);   /* the monocle */
  };
  const MUG = make(23, 23, px => owlHead(px, 11.5, 12, 1.15, true));
  const HEART = make(21, 21, px => { px.shape(or(ell(6.5, 7.5, 5.2, 5), ell(14.5, 7.5, 5.2, 5), poly([[1.6, 9], [19.4, 9], [10.5, 19]])), AR.red, 1); hl(px, 4, 5, 2, 2, 2); });
  /* an imprint: a framed word in stamp ink, turned a little and worn, sampled pixel by pixel so it stays crisp.
     RAVE! is ours (red); PANNED is the critic's (black), printed on a bad review that got past. */
  function imprint(word, s0, a, cols, seed) {
    const tw = textW(word, s0), w = Math.ceil(tw + 5.67), h = 7 * s0 + 5.33, m = cvs(w * 3, h * 3, x => {
      x.scale(3, 3); x.fillStyle = '#000';
      x.fillRect(0, 0, w, 1); x.fillRect(0, h - 1, w, 1); x.fillRect(0, 0, 1, h); x.fillRect(w - 1, 0, 1, h);
      text(x, word, (w - tw) / 2 - .17, 2.67, '#000', s0); text(x, word, (w - tw) / 2 + .17, 2.67, '#000', s0);
    });
    const d = m.getContext('2d').getImageData(0, 0, m.width, m.height).data, c = Math.cos(a), s = Math.sin(a), rnd = MG.seeded(seed);
    const OW = Math.ceil(m.width * Math.abs(c) + m.height * Math.abs(s)) + 2, OH = Math.ceil(m.width * Math.abs(s) + m.height * Math.abs(c)) + 2;
    return cvs(OW, OH, x => {
      for (let y = 0; y < OH; y++) for (let i = 0; i < OW; i++) {
        const dx = i + .5 - OW / 2, dy = y + .5 - OH / 2, u = Math.floor(dx * c + dy * s + m.width / 2), v = Math.floor(-dx * s + dy * c + m.height / 2);
        if (u < 0 || v < 0 || u >= m.width || v >= m.height || !d[(v * m.width + u) * 4 + 3]) continue;
        const r = rnd(); if (r < .09) continue;                                     /* worn rubber: a few gaps */
        x.fillStyle = r < .2 ? cols[0] : cols[1]; x.fillRect(i, y, 1, 1);
      }
    });
  }
  const INK = imprint('RAVE!', 2 / 3, -.17, ['#a81e1e', '#d8322a'], 31), PANNED = imprint('PANNED', .5, .14, ['#0d0708', '#2a1a20'], 37);
  const PIN = cvs(27, 30, x => {                                                     /* a pinned clipping on the Wall of Raves (9x10 units) */
    x.fillStyle = '#1a0f14'; x.fillRect(0, 2, 27, 28); x.fillStyle = '#efe4c4'; x.fillRect(1, 3, 25, 26); x.fillStyle = '#fffaf0'; x.fillRect(1, 3, 25, 1);
    x.fillStyle = '#b9ac88'; for (const [yy, ww] of [[6, 21], [9, 17], [21, 19], [24, 14]]) x.fillRect(3, yy, ww, 1);
    x.fillStyle = '#d8322a'; x.fillRect(3, 12, 21, 1); x.fillRect(3, 18, 21, 1); x.fillRect(3, 12, 1, 7); x.fillRect(23, 12, 1, 7); x.fillRect(6, 14, 15, 3);
    x.fillStyle = '#1a0f14'; x.fillRect(11, 0, 5, 4); x.fillStyle = '#e84a3a'; x.fillRect(12, 0, 3, 3); x.fillStyle = '#ff9a8a'; x.fillRect(12, 0, 1, 1);   /* the pushpin */
  });
  /* the critic on his pile of back issues: four moods */
  function owlSpr(m) {
    return make(72, 78, px => {
      const puff = m === 'ruffle' ? 3 : 0, cx = 36;
      px.shape(or(poly([[cx - 21, 22], [cx - 24, 3], [cx - 9, 14]]), poly([[cx + 21, 22], [cx + 24, 3], [cx + 9, 14]])), AR.woodD, 1);   /* ear tufts */
      px.shape(ell(cx, 46, 25 + puff, 29 + puff / 2), AR.woodD, 1);                                                                      /* body */
      if (puff) for (const [fx0, fy0, dx] of [[cx - 27, 40, -6], [cx - 26, 56, -6], [cx + 27, 40, 6], [cx + 26, 56, 6]]) px.shape(poly([[fx0, fy0 - 4], [fx0 + dx, fy0], [fx0, fy0 + 4]]), AR.woodD, 1);
      px.shape(ell(cx, 57, 15, 16), AR.woodL, 2);                                                                                        /* belly + chevrons */
      for (let j = 0; j < 3; j++) for (let i = -2; i <= 2; i++) if (Math.abs(i) + j < 4) { px.dot(cx + i * 5, 50 + j * 6, AR.wood, 0, 3); px.dot(cx + i * 5 + 1, 51 + j * 6, AR.wood, 0, 3); }
      px.shape(or(ell(cx - 23, 52, 7, 17), ell(cx + 23, 52, 7, 17)), AR.wood, 3);                                                       /* wings */
      px.shape(or(ell(cx - 10, 27, 11, 10.5), ell(cx + 10, 27, 11, 10.5)), AR.woodL, 4);                                                 /* the face discs */
      const eyeR = m === 'ruffle' ? 8 : 7;
      if (m === 'laugh' || m === 'dizzy') {
        px.shape(or(ell(cx - 10, 28, eyeR, eyeR), ell(cx + 10, 28, eyeR, eyeR)), AR.woodL, 5);
        if (m === 'laugh') px.shape(or(and(sub(ell(cx - 10, 31, 5.5, 5), ell(cx - 10, 32.6, 4.4, 4.4)), box(0, 0, 80, 31)), and(sub(ell(cx + 10, 31, 5.5, 5), ell(cx + 10, 32.6, 4.4, 4.4)), box(0, 0, 80, 31))), AR.ink, 6);
        else for (const ex of [cx - 10, cx + 10]) px.shape(or(cap(ex - 3.5, 24.5, ex + 3.5, 31.5, 1), cap(ex + 3.5, 24.5, ex - 3.5, 31.5, 1)), AR.ink, 6);   /* X X */
      } else {
        px.shape(or(ell(cx - 10, 28, eyeR, eyeR), ell(cx + 10, 28, eyeR, eyeR)), AR.banY, 5);
        const pr = m === 'ruffle' ? 2.2 : 3.2;
        px.shape(or(ell(cx - 9, 29, pr, pr), ell(cx + 9, 29, pr, pr)), AR.ink, 6);
        if (m === 'scowl') {                                                                                                               /* heavy lids + brows */
          px.shape(or(and(ell(cx - 10, 28, eyeR, eyeR), (x, y) => y < 25.5 + (x - (cx - 17)) * .22), and(ell(cx + 10, 28, eyeR, eyeR), (x, y) => y < 25.5 + ((cx + 17) - x) * .22)), AR.woodD, 7);
          px.shape(or(cap(cx - 20, 20, cx - 3, 25, 1.6), cap(cx + 20, 20, cx + 3, 25, 1.6)), AR.ink, 8);
        }
      }
      if (m === 'laugh') px.shape(poly([[cx - 4, 35], [cx + 4, 35], [cx + 3, 41], [cx - 3, 41]]), AR.red, 9);                             /* HOO HOO: beak open */
      px.shape(poly([[cx - 4, 33], [cx + 4, 33], [cx, m === 'laugh' ? 36 : 41]]), AR.pine, 10);
      if (m === 'laugh') px.shape(poly([[cx - 3, 40], [cx + 3, 40], [cx, 44]]), AR.pine, 10);
      const mx = m === 'ruffle' ? cx + 14 : cx + 10, my = m === 'ruffle' ? 40 : 28;                                                     /* the monocle (pops out when ruffled) */
      px.shape(sub(ell(mx, my, 9.5, 9.5), ell(mx, my, 7.6, 7.6)), AR.gold, 11);
      for (let k = 0; k < 6; k++) px.dot(Math.round(mx + 6 + k * .6), Math.round(my + 8 + k * 3), AR.gold, 1, 12);
      px.shape(or(poly([[cx - 7, 45], [cx, 48], [cx - 7, 51]]), poly([[cx + 7, 45], [cx, 48], [cx + 7, 51]]), ell(cx, 48, 2, 2)), AR.red, 13);   /* bow tie */
      px.shape(or(ell(cx - 8, 75, 4.5, 2.4), ell(cx + 8, 75, 4.5, 2.4)), AR.pine, 14);
    });
  }
  const OWL = { scowl: owlSpr('scowl'), laugh: owlSpr('laugh'), ruffle: owlSpr('ruffle'), dizzy: owlSpr('dizzy') };

  /* ---------- 2. setup ---------- */
  const ICON = make(30, 30, px => {                                                  /* the HUD counter: a little rubber stamp in the desk colour */
    px.shape(ell(15, 6, 7, 5), MGRepair.deskR(MGRepair.params.desk), 1); px.shape(box(12, 9, 6, 7), AR.woodL, 2);
    px.shape(box(3, 15, 24, 8), AR.wood, 3); px.shape(box(4, 23, 22, 4), AR.red, 4);
  });
  const R = MGRepair.setup({
    id: 'critic', verb: 'STAMP', scoreIcon: ICON,
    how: 'Stamp <em>RAVE</em> on the bad reviews only',
    legend: [[MUG, 'stamp the <em>bad</em> reviews'], [HEART, 'let the good ones <em>ride</em>'], [INK, 'dead centre = a <em>clean</em> RAVE']],
    hint: 'tap / click / Space to stamp',
  });
  const { st, g, W, H, ui, fx, rng, level: LV } = R;
  const [dSh, dBase, dLi] = R.deskRamp;

  /* the stamp, in the desk colour: knob, neck, block with its brass RAVE plate, red rubber pad. 26x25.3 units; pad bottom on the last row. */
  const STAMP = make(78, 76, px => {
    px.shape(box(4, 66, 70, 9), AR.red, 1);
    px.shape(box(1, 39, 76, 28), AR.wood, 2); px.shape(box(1, 63, 76, 3), AR.woodD, 3);
    px.shape(box(20, 44, 38, 15), AR.gold, 4);
    px.shape(box(31, 19, 16, 21), AR.woodL, 2);
    px.shape(ell(39, 13, 18, 11), R.deskR, 5); hl(px, 28, 6, 6, 3, 2); hl(px, 4, 41, 2, 20, 2);
  });
  text(STAMP.getContext('2d'), 'RAVE', 27, 48, '#5a3a08', 1);

  /* the press room, painted once: wall, Wall of Raves, the critic's pile of back issues, the lamp (BACK); the belt's front (FRONT) */
  const SX = 42, BT = 96, BB = 137, CY = 102, DOWN = 120, LIFT = 23, OWL_X = 101, OWL_Y = 46;
  const BOARD = { x: 4, y: 20, w: 31, h: 35 };
  const BACK = cvs(W * 3, H * 3, x => {
    x.scale(3, 3); const r = (c, a, b, w, hh) => { x.fillStyle = c; x.fillRect(a, b, w, hh); }, s = MG.seeded(17);
    r('#120a0c', 0, 0, W, 14); r('#1d2236', 0, 14, W, BT - 14);                                                                    /* wallpaper: night-blue stripes */
    for (let sx = 0; sx < W; sx += 7) r('#21283e', sx, 16, 3.33, 46);
    r('#1a0f14', 0, 13.33, W, 2.67); r('#5a3517', 0, 13.67, W, 2); r('#8a5a2b', 0, 13.67, W, .67);                                  /* cornice */
    r('#1a0f14', 0, 61.33, W, 2); r('#8a5a2b', 0, 61.67, W, .67); r('#5a3517', 0, 62.33, W, .67);                                  /* chair rail, wainscot */
    r('#171b2c', 0, 63, W, BT - 63); for (let sx = 2; sx < W; sx += 13) { r('#1b2033', sx, 66, 11, BT - 70); r('#232a40', sx, 66, 11, .67); r('#12152a', sx, BT - 4.67, 11, .67); }
    /* the Wall of Raves: a corkboard, empty pin holes for now */
    const B = BOARD; r('#1a0f14', B.x - 1.67, B.y - 1.67, B.w + 3.33, B.h + 3.33); r('#8a5a2b', B.x - 1.33, B.y - 1.33, B.w + 2.67, B.h + 2.67); r('#b57d3e', B.x - 1.33, B.y - 1.33, B.w + 2.67, .67);
    r('#1a0f14', B.x - .33, B.y - .33, B.w + .67, B.h + .67); r('#a8743c', B.x, B.y, B.w, B.h);
    for (let k = 0; k < 90; k++) r(s() < .5 ? '#94642f' : '#bc8a50', B.x + Math.floor(s() * B.w * 3) / 3, B.y + Math.floor(s() * B.h * 3) / 3, .67, .67);
    const lw = textW('RAVES', .5) + 4; r('#1a0f14', B.x + B.w / 2 - lw / 2 - .67, B.y - 3.33, lw + 1.33, 5.67); r('#fff6d6', B.x + B.w / 2 - lw / 2 - .33, B.y - 3, lw + .67, 5);
    text(x, 'RAVES', B.x + B.w / 2 - lw / 2 + 2, B.y - 2.33, '#d8322a', .5);
    /* the critic's pile of back issues, tied with a red NEWS band */
    for (let y = OWL_Y, i = 0; y < BT - 1; y += 2.33, i++) {
      const jx = Math.round((s() - .5) * 4 * 3) / 3, w = 26 + Math.floor(s() * 3);
      r('#1a0f14', OWL_X - w / 2 + jx - .33, y - .33, w + .67, 2.67); r(i % 2 ? '#d8cfb4' : '#efe4c4', OWL_X - w / 2 + jx, y, w, 2); r('#9a8f74', OWL_X - w / 2 + jx, y + 1.67, w, .33);
      if (s() < .5) r('#8a8a96', OWL_X - w / 2 + jx + 2 + Math.floor(s() * 8), y + .67, 6 + Math.floor(s() * 8), .67);
    }
    r('#1a0f14', OWL_X - 15, 70.67, 30, 7.33); r('#b8322a', OWL_X - 14.67, 71, 29.33, 6.67); r('#e86a50', OWL_X - 14.67, 71, 29.33, .67);
    const nw = textW('NEWS', .67); text(x, 'NEWS', OWL_X - nw / 2, 72.33, '#fff6d6', .67);
    /* the lamp over the stamp */
    r('#1a0f14', SX - .33, 16, .67, 3);
    r('#1a0f14', SX - 7.33, 18.67, 14.67, 5.67); r('#1f6a2a', SX - 7, 19, 14, 5); r('#3f9a3a', SX - 7, 19, 14, .67); r('#0f3318', SX - 7, 23.33, 14, .67);
    r('#fff08c', SX - 3, 24, 6, 1); r('#fff6d6', SX - 1.67, 24, 3.33, .67);
    x.fillStyle = 'rgba(255,236,170,.05)'; for (let k = 0; k < 5; k++) { x.beginPath(); x.moveTo(SX - 6 + k, 24.67); x.lineTo(SX + 6 - k, 24.67); x.lineTo(SX + 30 - k * 5, BT + 30); x.lineTo(SX - 30 + k * 5, BT + 30); x.fill(); }
    /* the stamp press: two guide posts the stamp rides between */
    for (const px0 of [SX - 16, SX + 14.33]) { r('#1a0f14', px0 - .33, 66, 2.33, BT - 66); r('#8a8a96', px0, 66, 1.67, BT - 66); r('#d0d0dc', px0, 66, .67, BT - 66); r('#1a0f14', px0 - 1, 63.67, 3.67, 3); r('#b8b8c4', px0 - .67, 64, 3, 2.33); r('#f0f0f8', px0 - .67, 64, 1, 1); }
    /* the belt's far rail */
    r('#1a0f14', 0, BT - 1, W, 4.33); r('#5a5a66', 0, BT - .67, W, 3.67); r('#8a8a96', 0, BT - .67, W, .67);
    for (let sx = 4; sx < W; sx += 16) { r('#1a0f14', sx, BT + .33, 1.33, 1.33); r('#b8b8c4', sx, BT + .33, .67, .67); }
  });
  const FRONT = cvs(W * 3, (H - BB) * 3, x => {
    x.scale(3, 3); const r = (c, a, b, w, hh) => { x.fillStyle = c; x.fillRect(a, b, w, hh); };
    r('#1a0f14', 0, 0, W, 4.33); r('#5a5a66', 0, .33, W, 3.67); r('#b8b8c4', 0, .33, W, .67); r('#3a3a44', 0, 3.33, W, .67);       /* the near rail */
    r('#1a0f14', 0, 4.33, W, H - BB - 4.33); r(dSh, 0, 4.67, W, H - BB - 4.67); r(dBase, 0, 4.67, W, H - BB - 7); r(dLi, 0, 4.67, W, .67);   /* the belt's side in the desk colour */
    for (const bx of [4, W - 8]) { r('#1a0f14', bx - .33, 8, 4.67, 4.67); r('#b8b8c4', bx, 8.33, 4, 4); r('#f0f0f8', bx, 8.33, 1.33, 1.33); }
    const name = 'IMI PRESS ROOM', nw = textW(name, .5) + 6, nx = W / 2 - nw / 2;
    r('#1a0f14', nx - .67, 7.33, nw + 1.33, 8.33); r('#c98f0e', nx, 8, nw, 7); r('#ffd23a', nx, 8, nw, .67);
    text(x, name, nx + 3, 9.33, '#1a0f14', .5);
    r('rgba(0,0,0,.25)', 0, H - BB - 3, W, 3);
  });

  /* ---------- 3. tuning ---------- */
  const TUNE = {
    v: p => lerp(44, 56, LV) * lerp(1, 1.3, p),                                      /* belt speed, units/s: it speeds up through the run */
    gap: () => rng(lerp(8, 4, LV), lerp(20, 15, LV)),                                /* space between clippings */
    good: lerp(.36, .46, LV),                                                        /* share of good reviews (leave those alone) */
    clean: lerp(8.5, 7.5, LV),                                                       /* how far off centre a stamp still prints a clean RAVE */
    drop: .05, hold: .06, rise: .16,                                                 /* stamp: up to contact, on the paper, back up (s) */
  };
  const HIT = CLW / 2 + 4, CROOKED = .6, OVER = 1.5, SMUDGE = .25;                   /* farther off than HIT the stamp misses the clipping */

  /* ---------- 4. state ---------- */
  let G;
  function newClip(x) {
    const s = G.seq, last2 = s.slice(-2), last3 = s.slice(-3);
    let bad = rng() >= TUNE.good;
    if (!s.length) bad = true;                                                       /* the first one through is always a pan */
    else if (last2.length === 2 && last2.every(b => !b)) bad = true;
    else if (last3.length === 3 && last3.every(b => b)) bad = false;
    s.push(bad);
    const pick = a => { let v; do v = a[Math.floor(rng(a.length))]; while (G.recent.includes(v)); return v; };   /* no repeats on the belt at once */
    const c = { x, bad, stars: bad ? 1 + Math.floor(rng(2)) : 4 + Math.floor(rng(2)), q: pick(bad ? BAD_Q : GOOD_Q), paper: pick(PAPERS), seed: Math.floor(rng(1e6)), res: false, stamp: null, sq: 0 };
    G.recent = [...G.recent, c.q, c.paper].slice(-6); c.spr = clipSpr(c); return c;
  }
  function reset() {
    G = {
      clips: [], marks: [], fly: [], pins: [], seq: [], recent: [], off: 0, v: 0,
      stamp: { h: 1, mode: 'rest', t: 0 },
      pts: 0, bad: 0, clean: 0, crooked: 0, panned: 0, over: 0, smudge: 0, slams: 0, combo: 0, bestCombo: 0, lane: 0, popT: -9,
      owl: { m: 'scowl', t: 0, bob: 0 }, say: null, fixT: 0, fixPose: 'idle', flash: 0,
      bot: { seen: new Map() },
    };
    G.clips.push(newClip(96));
    while (G.clips[G.clips.length - 1].x < W + CLW) G.clips.push(newClip(G.clips[G.clips.length - 1].x + CLW + TUNE.gap()));
    ui.setScore(0);
  }
  const grade = () => clamp((G.pts - OVER * G.over - SMUDGE * G.smudge) / Math.max(1, G.bad), 0, 1);
  const stats = () => [['RAVES', `${G.clean + G.crooked} / ${G.bad}`], ['CROOKED', G.crooked], ['PANNED', G.panned], ['OVERHYPED', G.over]];   /* smudges show live as SMUDGE (a 5th row would push CONTINUE off a 360 px phone) */

  /* ---------- 5. verbs: slam the stamp. It drops in TUNE.drop s, and the clipping under it at contact gets the RAVE. ---------- */
  const ready = () => G.stamp.mode === 'rest' || (G.stamp.mode === 'up' && G.stamp.h > .45);
  function slam() {
    if (!R.live || !ready()) return false;
    G.stamp.mode = 'down'; G.slams++; sfx.tone(320, 140, .05, 'triangle', .035);
    return true;
  }
  function owl(m, t, say) { G.owl.m = m; G.owl.t = t; if (say) G.say = { txt: say, t: .9 }; }
  function pop(txt, cls) {                                                          /* float text over the stamp: a quick follow-up goes a lane lower, so two don't stack */
    G.lane = R.t - G.popT < .45 ? (G.lane + 1) % 3 : 0; G.popT = R.t; ui.floatText(SX, DOWN - 30 + 8 * G.lane, txt, cls);
  }
  function contact() {
    let c = null, bd = 1e9;
    for (const k of G.clips) { const d = Math.abs(k.x - SX); if (d < bd) { bd = d; c = k; } }
    R.shake(1.6); sfx.thud(); sfx.noise(.05, .05, 1400);
    if (!c || bd > HIT) {                                                           /* nothing under it: ink on the belt, which costs a little */
      G.marks.push({ x: SX }); G.smudge++; G.combo = 0; ui.setCombo(0, 1); pop('SMUDGE', 'bad'); fx.puff(SX, DOWN + 1, '#4a4458', 3); G.fixT = .2; G.fixPose = 'squish'; return;
    }
    c.sq = .16;
    if (c.stamp) { fx.burst(SX, DOWN - 2, ['#d8322a'], 3, 20, 60, .25); G.fixT = .2; G.fixPose = 'squish'; return; }   /* stamped twice: no harm */
    c.stamp = { ix: SX - c.x };
    if (c.bad) {
      const clean = bd <= TUNE.clean; c.res = true; c.clean = clean;
      G.bad++; G.pts += clean ? 1 : CROOKED; clean ? G.clean++ : G.crooked++;
      G.combo = clean ? G.combo + 1 : 0; G.bestCombo = Math.max(G.bestCombo, G.combo); ui.setCombo(G.combo, 1); if (G.combo >= 3) ui.pulseCombo();
      ui.setScore(G.clean + G.crooked); ui.bump();
      fx.burst(SX, DOWN - 3, ['#d8322a', '#ff7a6a', '#fff6d6'], clean ? 10 : 6, 44, 80, .4);
      if (clean) {
        fx.ring(SX, DOWN - 3, '#ffd23a', 13); sfx.ding(Math.min(8, G.combo + 1)); MG.hitstop(.04);
        pop(G.combo > 1 && G.combo % 4 === 0 ? `${G.combo} RAVES!` : 'RAVE!', 'gold');
        if (G.combo > 1 && G.combo % 4 === 0) sfx.golden();
        G.fixT = .3; G.fixPose = 'cheer';
      } else { sfx.ding(1); pop('CROOKED', 'ice'); G.fixT = .25; G.fixPose = 'squish'; }
      owl('ruffle', .6, clean ? 'HOO?!' : null); sfx.noise(.12, .04, 3200, .05);
    } else {                                                                         /* a good review, stamped: OVERHYPED */
      c.res = true; c.over = true; G.over++; G.combo = 0; ui.setCombo(0, 1);
      sfx.typo(); R.shake(2.6); G.flash = .2; pop('OVERHYPED!', 'bad');
      fx.burst(SX, DOWN - 3, ['#1a0f14', '#d8322a'], 6, 30, 80, .35);
      owl('laugh', .7, 'HOO HOO'); G.fixT = .45; G.fixPose = 'scared';
    }
  }
  function passed(c) {                                                              /* it rode past the stamp unmarked */
    c.res = true;
    if (c.bad) {
      G.bad++; G.panned++; G.combo = 0; ui.setCombo(0, 1); c.panned = true;
      sfx.bonk(); R.shake(1.8); ui.floatText(c.x, CY - 6, 'PANNED!', 'bad'); fx.burst(c.x, CY + 8, ['#6a5a1c', '#9a8a38', '#1a0f14'], 6, 30, 60, .35);
      owl('laugh', .8, 'HOO HOO'); sfx.tone(560, 430, .1, 'sine', .04, .05); sfx.tone(560, 430, .12, 'sine', .04, .2);
      G.fixT = .4; G.fixPose = 'scared';
    } else { c.ok = true; sfx.tone(1180, 1180, .04, 'sine', .02); }
  }

  /* ---------- 6. update ---------- */
  function update(dt) {
    const p = R.progress;
    G.v = R.done ? G.v * Math.exp(-dt * 6) : TUNE.v(p);
    const dx = G.v * dt; G.off += dx;
    for (const c of G.clips) { c.x -= dx; c.sq = Math.max(0, c.sq - dt); }
    for (const m of G.marks) m.x -= dx;
    G.marks = G.marks.filter(m => m.x > -20);
    const last = G.clips[G.clips.length - 1];
    if (!R.done && (!last || last.x < W + CLW)) G.clips.push(newClip((last ? last.x : W) + CLW + TUNE.gap()));
    /* the stamp: down, a beat on the paper, back up */
    const s = G.stamp;
    if (s.mode === 'down') { s.h -= dt / TUNE.drop; if (s.h <= 0) { s.h = 0; s.mode = 'hold'; s.t = TUNE.hold; if (R.live) contact(); } }
    else if (s.mode === 'hold') { if ((s.t -= dt) <= 0) s.mode = 'up'; }
    else if (s.mode === 'up') { s.h += dt / TUNE.rise; if (s.h >= 1) { s.h = 1; s.mode = 'rest'; } }
    /* clippings that rode past; stamped ones fly up to the Wall of Raves, the rest slide off the end */
    for (const c of G.clips) {
      if (!c.res && R.live && c.x < SX - HIT) passed(c);
      if (c.stamp && c.bad && !c.flown && c.x < 14) {
        c.flown = c.dead = true; const n = G.pins.length + G.fly.length, col = n % 3, row = Math.floor(n / 3) % 3;
        G.fly.push({ c, x0: c.x, y0: CY + CLH / 2, x1: BOARD.x + 5.5 + col * 10 + (row % 2) * 1.33, y1: BOARD.y + 5 + row * 10.67 + (n >= 9 ? 2 : 0), t: 0, T: .42 });
        sfx.tone(600, 1100, .12, 'triangle', .03);
      }
      if (c.x < -CLW / 2 - 2) c.dead = true;
    }
    G.clips = G.clips.filter(c => !c.dead);
    for (const f of G.fly) {
      f.t += dt;
      if (f.t >= f.T && !f.done) { f.done = true; G.pins.push({ x: f.x1, y: f.y1, tilt: (G.pins.length % 3) - 1 }); sfx.clack(7); fx.burst(f.x1, f.y1, ['#fff6d6', '#d8322a'], 4, 20, 40, .3); }
    }
    G.fly = G.fly.filter(f => !f.done);
    G.owl.t -= dt; if (G.owl.t <= 0 && !R.done) G.owl.m = 'scowl';
    G.owl.bob += dt; if (G.say && (G.say.t -= dt) <= 0) G.say = null;
    G.fixT = Math.max(0, G.fixT - dt); G.flash = Math.max(0, G.flash - dt);
  }

  /* ---------- 7. bot: reads each clipping as it comes on (a beat per clipping, now and then a misread), then times the slam to the
     belt like a person: it starts the stamp when the bad review will be centred by the time the pad lands, with a little timing slop and
     the odd real fumble. Good reviews it lets ride. ---------- */
  function bot(dt) {
    const B = G.bot, v = Math.max(1, G.v || TUNE.v(R.progress));
    for (const c of G.clips) if (!B.seen.has(c) && c.x - CLW / 2 < W - 4) {
      const slip = rng() < lerp(.14, .18, LV) ? (rng() < .5 ? -1 : 1) * rng(.15, .3) : rng(-.1, .1);
      B.seen.set(c, { at: R.t + rng(.22, .42), bad: rng() < lerp(.05, .08, LV) ? !c.bad : c.bad, slip });
    }
    if (!ready()) return;
    for (const c of G.clips) {
      if (c.stamp || c.x < SX - HIT) continue;
      const k = B.seen.get(c); if (!k || R.t < k.at) return;                          /* still reading the next one */
      if (!k.bad) continue;                                                          /* a good one (it thinks): let it ride */
      if ((c.x - SX) / v <= G.stamp.h * TUNE.drop + k.slip) slam();
      return;
    }
  }

  /* ---------- 8. draw ---------- */
  function clipSpr(c) {
    return cvs(CLW * 3, CLH * 3, x => {
      x.imageSmoothingEnabled = false; x.scale(3, 3); const r = (col, a, b, w, h) => { x.fillStyle = col; x.fillRect(a, b, w, h); }, s = MG.seeded(c.seed);
      r('#1a0f14', 0, 0, CLW, CLH - 2); for (let i = 0; i < CLW; i += 2) r('#1a0f14', i, CLH - 2, 2, (i / 2) % 2 ? 1.33 : 2);    /* scissor-cut bottom edge */
      r('#efe4c4', .33, .33, CLW - .67, CLH - 2.33); for (let i = 0; i < CLW; i += 2) r('#efe4c4', i + .33, CLH - 2.33, 1.33, (i / 2) % 2 ? 1.33 : 2);
      r('#fffaf0', .33, .33, CLW - .67, .67); r('#fffaf0', .33, .33, .67, CLH - 3); r('#d4c59c', CLW - 1, 1, .67, CLH - 3.67);
      const mw = textW(c.paper, 1 / 3); text(x, c.paper, Math.round((CLW / 2 - mw / 2) * 3) / 3, 1.67, '#5a4a3a', 1 / 3);
      r('#5a4a3a', 1.67, 4.67, CLW - 3.33, .33); r('#5a4a3a', 1.67, 5.33, CLW - 3.33, .33);
      const qw = textW(c.q, 2 / 3); text(x, c.q, Math.round((CLW / 2 - qw / 2) * 3) / 3, 7, '#1a0f14', 2 / 3);
      for (let i = 0; i < 5; i++) x.drawImage(i < c.stars ? STAR : HOLE, 2 + i * 5.33, 13, 16 / 3, 16 / 3);
      const ic = c.bad ? MUG : HEART; x.drawImage(ic, 2, 19.67 + (c.bad ? 0 : .67), ic.width / 3, ic.height / 3);
      for (let j = 0; j < 3; j++) r('#b9ac88', 11, 20.33 + j * 2.33, Math.round((16 - s() * 6) * 3) / 3, .67);
    });
  }
  const rx = v => Math.round(v * 3) / 3;
  function drawBelt() {
    g.fillStyle = '#26222e'; g.fillRect(0, BT + 3.33, W, BB - BT - 3.33);
    const o = ((G.off % 7) + 7) % 7;
    for (let x = -o; x < W; x += 7) { g.fillStyle = '#2f2a39'; g.fillRect(rx(x), BT + 3.33, 1.33, BB - BT - 3.33); g.fillStyle = '#1c1922'; g.fillRect(rx(x) + 1.33, BT + 3.33, .33, BB - BT - 3.33); }
    g.globalAlpha = .28; for (const m of G.marks) st.hi(INK, rx(m.x - INK.width / 6), rx(DOWN - 3 - INK.height / 6)); g.globalAlpha = 1;
    /* the stamp zone: yellow arrows on both rails */
    g.fillStyle = '#ffd23a'; for (let k = 0; k < 3; k++) { g.fillRect(SX - 2.33 + k * .67, BT + .33 + k * .67, 4.67 - k * 1.33, .67); g.fillRect(SX - 2.33 + k * .67, BB + 2.67 - k * .67, 4.67 - k * 1.33, .67); }
  }
  function drawClip(c, now) {
    const x0 = rx(c.x - CLW / 2), y0 = CY + (c.sq > 0 ? .67 : 0);
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(x0 + 1, y0 + 1.33, CLW, CLH - 1.33);
    st.hi(c.spr, x0, y0);
    if (c.stamp) st.hi(INK, rx(c.x + c.stamp.ix - INK.width / 6), rx(DOWN - 3.67 - INK.height / 6 + (c.sq > 0 ? .67 : 0)));
    if (c.panned) { g.fillStyle = 'rgba(58,42,30,.3)'; g.fillRect(x0 + .33, y0 + .33, CLW - .67, CLH - 2.67); st.hi(PANNED, rx(c.x - PANNED.width / 6), rx(y0 + 16 - PANNED.height / 6)); }
    if (c.ok) { g.fillStyle = '#2f8a35'; const mx = x0 + CLW - 7, my = y0 + 21; g.fillRect(mx, my + 2, 1.33, 1.33); g.fillRect(mx + 1, my + 3, 1.33, 1.33); g.fillRect(mx + 2, my + 1.67, 1.33, 1.67); g.fillRect(mx + 3, my + .33, 1.33, 1.67); g.fillRect(mx + 4, my - .67, 1.33, 1.33); }
  }
  function drawOwl(now) {
    const m = G.owl.m, spr = OWL[m], bob = m === 'laugh' ? (Math.floor(now * 10) % 2 ? -.67 : 0) : m === 'ruffle' ? (Math.floor(now * 20) % 2 ? .33 : -.33) : (Math.floor(now * 1.2) % 2 ? .33 : 0);
    st.hi(spr, rx(OWL_X - spr.width / 6 + (m === 'ruffle' ? bob : 0)), rx(OWL_Y + .67 - spr.height / 3 + (m === 'ruffle' ? 0 : bob)));
    if (G.say) {
      const t = G.say.txt, tw = textW(t, .5), bw = tw + 4, bx = OWL_X - 15 - bw, by = 23;
      g.fillStyle = '#1a0f14'; g.fillRect(bx - .67, by - .67, bw + 1.33, 7.33); g.fillRect(bx + bw, by + 2.33, 2.33, 1.33);
      g.fillStyle = '#fff6d6'; g.fillRect(bx, by, bw, 6); g.fillRect(bx + bw - .33, by + 2.67, 2, .67);
      text(g, t, bx + 2, by + 1.33, '#b8322a', .5);
    }
  }
  function drawStamp(now) {
    const s = G.stamp, pb = DOWN - LIFT * s.h, top = pb - STAMP.height / 3;
    const k = 1 - s.h; g.fillStyle = `rgba(10,6,10,${(.16 + .3 * k).toFixed(2)})`; g.fillRect(rx(SX - 11 + s.h * 2), DOWN - 1.33, rx(22 - s.h * 4), 2.67);   /* its shadow, darker as it lands */
    st.hi(STAMP, SX - STAMP.width / 6, rx(top));
    const pose = R.done ? (R.won ? 'cheer' : 'scared') : s.mode === 'down' || s.mode === 'hold' ? 'squish' : G.fixT > 0 ? G.fixPose : s.mode === 'up' ? 'launch' : Math.floor(now * 1.6) % 2 ? 'breathe' : 'idle';
    R.crew(SX, rx(top + 2), pose);
  }
  function draw() {
    const now = performance.now() / 1000;
    st.hi(BACK, 0, 0);
    for (const p of G.pins) st.hi(PIN, rx(p.x - 4.5 + p.tilt * .33), rx(p.y - 1));
    drawOwl(now); drawBelt();
    for (const c of G.clips) drawClip(c, now);
    st.hi(FRONT, 0, BB);
    if (G.flash > 0) { g.fillStyle = `rgba(216,50,42,${(G.flash * .6).toFixed(2)})`; g.fillRect(0, BT, W, BB - BT); }
    drawStamp(now);
    for (const f of G.fly) {                                                         /* a stamped clipping on its way to the Wall of Raves */
      const t = clamp(f.t / f.T, 0, 1), x = lerp(f.x0, f.x1, t), y = lerp(f.y0, f.y1, t) - Math.sin(t * Math.PI) * 14, k = lerp(1, .3, t);
      g.fillStyle = '#1a0f14'; g.fillRect(rx(x - CLW * k / 2) - .33, rx(y - CLH * k / 2) - .33, rx(CLW * k) + .67, rx(CLH * k) + .67);
      g.drawImage(f.c.spr, rx(x - CLW * k / 2), rx(y - CLH * k / 2), rx(CLW * k), rx(CLH * k));
    }
    fx.draw(g);
  }

  /* ---------- 9. input + run ---------- */
  window.CRITIC = { get G() { return G; }, slam, TUNE };
  R.run({
    reset, update, draw, grade, stats, bot,
    ended() {
      if (R.won) { owl('dizzy', 99, G.over || G.panned ? 'HMPH.' : 'HOO...'); fx.burst(OWL_X, OWL_Y - 14, ['#86592e', '#c08a4a', '#fff6d6'], 10, 40, 60, .5); }
      else owl('laugh', 99, 'HOO HOO');
    },
    down() { slam(); },
    key(ev, k) { if (!ev.repeat && (k === ' ' || k === 'arrowdown' || k === 's' || k === 'enter')) slam(); },
  });
})();
