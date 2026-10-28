/* STORY SCENES, EARLY CHAPTERS: 0 prologue, 1 first-hire, 3 first-sale (the reference scenes for the rest of the arc).
   A scene is data plus drawing hooks (StoryKit.scene). actors(t, w) is a pure function of t: skipping ahead is just changing t.
   Coordinates are world art pixels: x = 0 is the middle of the stage, y = 0 the ground under the building, SK.FLOOR (8) where the actors stand. */
(function (G) {
  'use strict';
  const SK = G.StoryKit; if (!SK) return;
  const { seg, lerp, ease, FLOOR } = SK;
  const fr = SK.frame;

  /* ---------- shared helpers for scenes ---------- */
  /** The founder's look, and the new hire's: the hire is the last typist hired; if the founder would wear the same look, the founder keeps the plain v01 (or v07). */
  function people(w) {
    const hire = w.lastLook || (w.crew && w.crew[0] && w.crew[0].look) || 'v07';
    let founder = w.founder || { look: 'v01', hat: 0 };
    if ((w.paws || 0) <= 1 && founder.look === hire) founder = { look: hire === 'v01' ? 'v07' : 'v01', hat: 0 };
    return { founder, hire: { look: hire, hat: 0 } };
  }
  /** The first desk: a crate in the clearing, a little wooden desk once there is a hut */
  const deskKind = w => (w.stage === 0 ? 'crate' : 'desk');
  const deskTopY = w => FLOOR - (deskKind(w) === 'crate' ? 13 : 11);
  /** Where a typist stands behind the first desk (raised, so the head clears the machine) */
  const seatY = w => deskTopY(w) + 4;
  /** A typing rhythm between t0 and t1 at fps: { pose, key } */
  const typing = (t, t0, t1, fps = 8) => { if (t < t0 || t >= t1) return null; const b = fr(t - t0, fps); return { pose: b % 2 ? 'st_type_a' : 'st_type_b', key: (b * 5) % 12, beat: b }; };
  /** Key clack cues for a typing run */
  const clacks = (t0, t1, fps = 8, every = 1) => { const out = []; for (let k = 0, t = t0; t < t1; k++, t = t0 + k / fps) if (k % every === 0) out.push({ at: t + 0.001, sfx: 'key', arg: 0.9 + (k % 3) * 0.1 }); return out; };
  /** A camera shake: whole art pixels, a few frames */
  const shake = (t, t0, dur = 0.3, amp = 1) => (t >= t0 && t < t0 + dur ? (fr(t, 30) % 2 ? amp : -amp) : 0);
  /** Sparkles orbiting a point for a while */
  function sparkles(g, t, x, y, t0, t1, n = 4, r = 14) {
    if (t < t0 || t > t1) return;
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 + (t - t0) * 2, ph = fr(t + i * 0.13, 6, 3); SK.sparkle(g, x + Math.round(Math.cos(a) * r), y + Math.round(Math.sin(a) * r * 0.6), ph === 2 ? 1 : 2, ph === 1 ? '#ffffff' : '#fff08c'); }
  }
  /** A screen-space white flash, stepped */
  function flash(g, view, t, t0, dur = 0.12) { if (t < t0 || t > t0 + dur) return; g.fillStyle = 'rgba(255,246,214,.7)'; g.fillRect(0, 0, view.w, view.h); }
  /** Draw the first desk with its typewriter: o = { key, paper, col, lid, noMachine, letter } */
  function desk0(g, w, x, o = {}) {
    const top = SK.desk(g, x, FLOOR, deskKind(w), { label: true });
    if (o.lid) { SK.box(g, x - 15, top - 3, 30, 3, SK.RAMP.wood); }
    if (!o.noMachine) SK.typewriter(g, 0, x, top, o.key == null ? -1 : o.key, { paper: o.paper == null ? 0.4 : o.paper, col: o.col || 0 });
    if (o.letter && !o.noMachine) { const px = x - 5 - Math.round((o.col || 0) * 4); SK.text(g, o.letter, px + 4, top - 18, '#3a2a60'); }
    return top;
  }
  SK.help = { people, deskKind, deskTopY, seatY, typing, clacks, shake, sparkles, flash, desk0 };

  /* =====================================================================
     0. PROLOGUE: a crate in a clearing. The founder finds a battered Bamboo Classic and a torn page, reads it, and presses the first key.
     ===================================================================== */
  const P0 = { walk0: 1.6, walk1: 4.4, step0: 6.1, step1: 6.6, crouch: 6.75, pry: 6.95, lift: 7.9, catch: 8.45, down0: 10.9, down1: 11.5, page0: 11.5, page1: 13.1, insert: 13.4, insertOut: 17.3, shrug: 17.8, feed: 19.0, hop0: 19.7, hop1: 20.2, crack: 20.5, raise: 21.9, clack: 22.4, end: 25.2 };
  const PAGE_LINES = ['INFINITE MONKEYS,', 'INFINITE TYPEWRITERS...', 'EVENTUALLY,', 'SHAKESPEARE.'];
  SK.scene({
    id: 'prologue', title: 'The Clearing', chapter: 0, duration: P0.end,
    sky: { phase: 'day', wx: 0 }, stage: () => 0,
    beats: [
      { at: 0.2, who: 'narrator', text: 'Deep in the jungle: a clearing, a crate, and nobody around.' },
      { at: 4.6, who: 'founder', text: 'A crate! Please be bananas. Please be bananas.' },
      { at: 8.5, who: 'founder', text: 'Not bananas. A battered old Bamboo Classic.', expr: 'giggle' },
      { at: 13.4, who: 'founder', text: '"Infinite monkeys, infinite typewriters... eventually, Shakespeare."' },
      { at: 17.8, who: 'founder', text: 'We have one typewriter. We\'ll need a few more monkeys.', expr: 'giggle' },
      { at: 20.5, who: 'founder', text: 'But first... the very first key.' },
    ],
    cast: w => ({ founder: Object.assign({ name: 'You' }, people(w).founder) }),
    cues: [
      { at: 1.7, sfx: 'tick' }, { at: 4.7, sfx: 'monkey' }, { at: 6.95, sfx: 'crack' }, { at: 7.6, sfx: 'drum' },
      { at: 7.95, sfx: 'whoosh' }, { at: 8.45, sfx: 'fanfare' }, { at: 11.5, sfx: 'attach' }, { at: 11.6, sfx: 'page' }, { at: 13.4, sfx: 'rip' },
      { at: 19.0, sfx: 'page' }, { at: 19.7, sfx: 'whoosh' }, { at: 20.2, sfx: 'drum' },
      { at: 20.7, sfx: 'tick' }, { at: 21.1, sfx: 'tick' }, { at: 21.5, sfx: 'tick' },
      { at: P0.clack, sfx: 'key', arg: 1.4 }, { at: P0.clack + 0.02, sfx: 'stamp' }, { at: P0.clack + 0.35, sfx: 'bell' }, { at: P0.clack + 0.8, sfx: 'levelup' },
    ],
    camera(t) {
      const c = SK.track(t, [
        [0, { x: -16, y: -40, z: -1 }], [1.6, { x: -16, y: -40, z: -1 }], [3.2, { x: -14, y: -30, z: -1 }], [3.21, { x: -14, y: -30, z: 0 }],
        [7.4, { x: -8, y: -30, z: 0 }], [8.6, { x: -10, y: -36, z: 0 }], [13.0, { x: -8, y: -30, z: 0 }],
        [17.79, { x: -8, y: -30, z: 0 }], [17.8, { x: -6, y: -26, z: 1 }], [22.39, { x: -2, y: -26, z: 1 }], [22.4, { x: -1, y: -28, z: 2 }],
        [23.6, { x: -1, y: -28, z: 2 }], [23.61, { x: -4, y: -30, z: 1 }], [25.2, { x: -4, y: -32, z: 1 }],
      ]);
      return { x: c.x + shake(t, P0.clack, 0.3), y: c.y + shake(t, P0.clack + 0.03, 0.25), z: c.z };
    },
    actors(t, w) {
      const A = { f: { x: -130, feet: FLOOR, pose: 'idle', expr: null, flip: false, behind: false }, lid: { on: true }, tw: { where: 'inside' }, page: null, insert: 0, insertN: 0, key: -1, letter: '', pop: null };
      const F = A.f, top = deskTopY({ stage: 0 });
      // walk in
      if (t < P0.walk1) { const wk = SK.walk(t, P0.walk0, P0.walk1, -130, -24); F.x = wk.x; F.pose = wk.pose; F.feet = FLOOR + wk.bob; }
      else { F.x = -24; F.pose = 'idle'; }
      if (t >= 4.6 && t < 6.1) { F.pose = 'st_think'; if (t < 5.6) A.pop = { kind: '?', k: seg(t, 4.6, 4.8) }; }
      if (t >= P0.step0) { const wk = SK.walk(t, P0.step0, P0.step1, -24, -16); F.x = wk.x; F.pose = wk.pose; }
      // pry the lid off: crouch, spring, the lid flies
      if (t >= P0.crouch && t < P0.pry) F.pose = 'crouch';
      if (t >= P0.pry && t < 7.25) { F.pose = 'launch'; F.feet = FLOOR - Math.round(SK.hop(seg(t, P0.pry, 7.25), 1) * -0); }
      if (t >= 7.25 && t < P0.lift) F.pose = 'st_gasp';
      if (t >= P0.pry) { const k = seg(t, P0.pry, 7.6); A.lid = { on: false, k, x: lerp(0, 40, k), y: lerp(top - 3, FLOOR - 2, ease.in(k)) + SK.hop(k, 26), spin: fr(t, 10, 4) }; if (k >= 1) A.lid.spin = 0; }
      // the typewriter jumps out of the crate into the founder's paws
      if (t >= P0.lift && t < P0.catch) { const k = seg(t, P0.lift, P0.catch); A.tw = { where: 'air', x: lerp(0, -16, k), y: lerp(top, FLOOR - 37, ease.out(k)) + SK.hop(k, 14) }; F.pose = 'st_hold'; F.expr = 'screech'; }
      if (t >= P0.catch && t < P0.down0) { const r = t - P0.catch, sq = r < 0.12; A.tw = { where: 'air', x: -16, y: FLOOR - 37 + (sq ? 3 : 0) }; F.pose = sq ? 'crouch' : 'st_hold'; F.expr = 'giggle'; A.spark = true; if (sq) A.tw.y = FLOOR - 30; }
      // set it down on the crate; a torn page flutters out
      if (t >= P0.down0 && t < P0.down1) { const k = seg(t, P0.down0, P0.down1); A.tw = { where: 'air', x: lerp(-16, 0, k), y: lerp(FLOOR - 37, top, ease.inOut(k)) + SK.hop(k, 4) }; F.pose = 'st_carry'; }
      if (t >= P0.down1) A.tw = { where: 'crate' };
      if (t >= P0.page0 && t < P0.page1) {
        const k = seg(t, P0.page0, P0.page1), up = seg(k, 0, 0.3);
        A.page = { x: Math.round(lerp(2, -10, k) + Math.sin(k * 14) * 5), y: Math.round(k < 0.3 ? lerp(top - 4, top - 34, ease.out(up)) : lerp(top - 34, FLOOR - 30, ease.inOut(seg(k, 0.3, 1)))), edge: fr(t, 7, 2) === 1 && k > 0.3 };
        if (t > 12.3) F.pose = 'st_read';
      }
      // read it (the insert), then shrug at the one typewriter
      if (t >= P0.page1 && t < P0.feed) { F.pose = 'st_read'; A.page = { x: -16 - 4, y: FLOOR - 30, held: true }; }
      if (t >= P0.insert && t < P0.insertOut + 0.3) { A.insert = t < P0.insertOut ? seg(t, P0.insert, P0.insert + 0.3) : 1 - seg(t, P0.insertOut, P0.insertOut + 0.3); A.insertN = Math.floor((t - P0.insert - 0.35) * 22); }
      if (t >= P0.shrug && t < P0.feed) { F.pose = fr(t - P0.shrug, 2.2, 2) ? 'idle' : 'st_shrug'; F.expr = 'giggle'; A.page = { x: -20, y: FLOOR - 28, held: true }; }
      // feed the page into the machine, hop up behind the crate, crack the knuckles, the first key
      if (t >= P0.feed && t < P0.hop0) { const k = seg(t, P0.feed, P0.feed + 0.5); F.pose = 'st_offer'; A.page = k < 1 ? { x: Math.round(lerp(-6, -3, k)), y: Math.round(lerp(FLOOR - 26, top - 16, k)) } : null; A.paper = k; }
      if (t >= P0.hop0) A.paper = 1;
      if (t >= P0.hop0 && t < P0.hop1) { const k = seg(t, P0.hop0, P0.hop1); F.x = lerp(-16, 0, k); F.feet = lerp(FLOOR, seatY({ stage: 0 }), k) + SK.hop(k, 12); F.pose = k < 0.15 ? 'crouch' : 'air'; F.behind = k > 0.5; }
      if (t >= P0.hop1) { F.x = 0; F.feet = seatY({ stage: 0 }); F.behind = true; F.pose = t < P0.crack ? 'impact' : 'idle'; }
      if (t >= P0.crack && t < P0.raise) F.pose = fr(t - P0.crack, 2.5, 2) ? 'st_crack_b' : 'st_crack_a';
      if (t >= P0.raise && t < P0.clack) { F.pose = 'launch'; F.feet = seatY({ stage: 0 }) - 2; F.expr = 'determined'; }
      if (t >= P0.clack) {
        const r = t - P0.clack; F.pose = r < 0.35 ? 'st_type_a' : r < 0.9 ? 'impact' : fr(r, 3, 2) ? 'st_cheer' : 'st_type_b'; F.expr = r < 0.35 ? 'screech' : 'giggle';
        A.key = r < 0.3 ? 4 : -1; A.letter = 'I'; A.col = r < 0.3 ? 0 : 0.05;
        if (r > 0.9) F.feet = seatY({ stage: 0 }) + (fr(r, 3, 2) ? -3 : 0);
      }
      return A;
    },
    draw(g, t, w, A, view) {
      const ppl = people(w), F = A.f, top = deskTopY({ stage: 0 });
      const actorF = () => { SK.shadow(g, F.x, FLOOR + 1, 10); SK.actor(g, ppl.founder.look, F.pose, F.x, F.feet, { hat: ppl.founder.hat, expr: F.expr || undefined }); };
      if (F.behind) actorF();
      // the crate, with its lid on or off, and the machine once it is back on it
      desk0(g, { stage: 0 }, 0, { lid: A.lid.on, noMachine: A.tw.where !== 'crate', key: A.key, paper: A.paper ? 0.1 + A.paper * 0.3 : 0, col: A.col || 0, letter: A.letter });
      if (!F.behind) actorF();
      // the lid, tumbling
      if (!A.lid.on) { const L = A.lid, R = SK.RAMP.wood; if (L.spin % 2 === 0) SK.box(g, L.x - 15, L.y - 3, 30, 3, R); else SK.box(g, L.x - 2, L.y - 14, 3, 30 * 0.6, R); }
      if (A.lid.k > 0 && A.lid.k < 1) SK.puff(g, 0, top - 2, seg(t, P0.pry, P0.pry + 0.6), { n: 6, spread: 16, size: 3 });
      if (A.lid.k >= 1) SK.puff(g, 40, FLOOR, seg(t, 7.6, 8.1), { n: 4, spread: 10 });
      // the typewriter in the air / overhead
      if (A.tw.where === 'air') SK.typewriter(g, 0, A.tw.x, A.tw.y, -1, { paper: 0 });
      if (A.spark) sparkles(g, t, -16, FLOOR - 50, P0.catch, P0.down0, 5, 18);
      // the torn page
      if (A.page) { if (A.page.edge) SK.rect(g, A.page.x - 1, A.page.y + 4, 10, 2, SK.RAMP.paper[1]); else SK.page(g, A.page.x, A.page.y, 8, 10, 4); }
      if (A.pop) SK.pop(g, F.x + 1, F.feet - 50, A.pop.kind, A.pop.k);
      if (t > P0.clack && t < P0.clack + 1.6) sparkles(g, t, 0, top - 22, P0.clack + 0.1, P0.clack + 1.6, 6, 20);
    },
    screen(g, t, w, A, view) {
      if (A.insert > 0) drawInsert(g, view, A.insert, A.insertN);
      flash(g, view, t, P0.clack, 0.1);
    },
    onEnd() { const st = document.getElementById('oStage'); if (st) st.focus({ preventScroll: true }); },
  });
  /** The torn page, close up: it slides up over the scene, the lines appear letter by letter */
  function drawInsert(g, view, k, n) {
    const s = 1, tw = Math.max(...PAGE_LINES.map(l => SK.textW(l, s))), pw = tw + 14 * s, ph = PAGE_LINES.length * 8 * s + 18 * s;
    const x = Math.round((view.w - pw) / 2), y0 = Math.round(view.h * 0.42 - ph / 2), y = Math.round(lerp(view.h + 4, y0, ease.out(Math.min(1, k)))), step = Math.floor;
    g.fillStyle = 'rgba(26,15,20,' + (0.5 * k).toFixed(2) + ')'; g.fillRect(0, 0, view.w, view.h);
    const P = SK.RAMP.paper;
    // a ragged sheet: cream, with a torn right edge and a shadow
    g.fillStyle = 'rgba(26,15,20,.45)'; g.fillRect(x + 3 * s, y + 3 * s, pw, ph);
    const body = pw - 5 * s;                                                         // the right edge is torn: a ragged column of teeth
    SK.rect(g, x - 1, y - 1, body + 2, ph + 2, P[4]); SK.rect(g, x, y, body, ph, P[1]); SK.rect(g, x, y, body, s, '#ffffff'); SK.rect(g, x, y + ph - s, body, s, P[2]);
    for (let yy = 0; yy < ph; yy += 2 * s) { const d = (((yy / s) * 7) % 5) * s + s; SK.rect(g, x + body - 1, y + yy - 1, d + 2, 2 * s + 2, P[4]); SK.rect(g, x + body - 1, y + yy, d, 2 * s, P[1]); }
    for (let i = 0; i <= PAGE_LINES.length; i++) SK.rect(g, x + 2 * s, y + 8 * s + i * 8 * s + 6 * s, body - 4 * s, 1, '#c8d8f0');   // ruled lines under each line of text
    SK.rect(g, x + 9 * s, y + 2 * s, 1, ph - 4 * s, '#f0a8a8');                                                                 // the margin
    // a banana-shaped stain in the corner
    g.globalAlpha = 0.35; SK.banana(g, x + pw - 22 * s, y + ph - 9 * s); g.globalAlpha = 1;
    let left = Math.max(0, n);
    PAGE_LINES.forEach((line, i) => { const part = line.slice(0, Math.max(0, left)); left -= line.length; if (part) SK.text(g, part, x + 12 * s, y + 8 * s + i * 8 * s, '#3a2a60', { s }); });
  }

  /* =====================================================================
     1. FIRST HIRE: the clacking draws a curious monkey out of the bushes. A banana, an interview, a knuckle crack: hired.
     ===================================================================== */
  const H = { type1: 4.0, rustle: 4.2, peek0: 6.4, peek1: 7.2, hop0: 7.8, hop1: 8.45, turn: 7.0, walk0: 10.4, walk1: 11.3, offer: 11.4, sniff: 12.4, grab: 13.0, eat1: 14.2, joy: 14.3, joy1: 14.9, go0: 15.2, go1: 16.4, crack: 16.5, type: 17.6, cheer: 18.4, end: 21.6 };
  const BUSH_X = 74;
  SK.scene({
    id: 'first-hire', title: 'Our First Employee', chapter: 1, duration: H.end, sky: w => ({ wx: Math.min(1, w.wx | 0) }),
    beats: [
      { at: 0.3, who: 'founder', text: 'Clack. Clack. DING. The jungle had never heard anything like it.' },
      { at: 4.2, who: 'narrator', text: 'Something in the bushes was listening.' },
      { at: 8.0, who: 'founder', text: 'A visitor! Quick, everybody look professional.', expr: 'screech' },
      { at: 11.4, who: 'founder', text: 'Every good job interview starts with a banana.', expr: 'giggle' },
      { at: 15.2, who: 'hire', text: 'OOK. *crack* *crack* OOK OOK.', expr: 'giggle' },
      { at: 18.4, who: 'founder', text: 'Our first employee. Benefits: bananas.', expr: 'giggle' },
    ],
    cast: w => { const p = people(w); return { founder: Object.assign({ name: 'You' }, p.founder), hire: Object.assign({ name: 'The new hire', bg: '#5a3517' }, p.hire) }; },
    cues: [
      ...clacks(0.2, H.type1, 7), { at: 2.0, sfx: 'bell' }, { at: 3.6, sfx: 'bell' },
      { at: 4.3, sfx: 'rip' }, { at: 5.1, sfx: 'rip' }, { at: 6.45, sfx: 'tick' }, { at: 7.05, sfx: 'tick' },
      { at: 7.8, sfx: 'monkey' }, { at: 7.9, sfx: 'whoosh' }, { at: H.hop1, sfx: 'drum' },
      { at: 11.4, sfx: 'peel' }, { at: H.grab, sfx: 'attach' }, { at: 13.3, sfx: 'chest' }, { at: 13.7, sfx: 'chest' }, { at: H.joy, sfx: 'levelup' },
      { at: 16.6, sfx: 'crit' }, { at: 17.0, sfx: 'crit' },
      ...clacks(H.type, H.end - 0.6, 12, 1), { at: 19.2, sfx: 'bell' }, { at: 20.6, sfx: 'bell' }, { at: H.cheer, sfx: 'fanfare' },
    ],
    camera(t) {
      const c = SK.track(t, [
        [0, { x: 6, y: -28, z: 0 }], [4.0, { x: 6, y: -28, z: 0 }], [5.4, { x: 44, y: -24, z: 0 }], [7.6, { x: 44, y: -24, z: 0 }], [8.9, { x: 30, y: -28, z: 0 }],
        [11.2, { x: 28, y: -26, z: 0 }], [11.21, { x: 30, y: -26, z: 1 }], [14.9, { x: 30, y: -26, z: 1 }], [14.91, { x: 14, y: -28, z: 0 }],
        [16.4, { x: 8, y: -28, z: 0 }], [16.41, { x: 2, y: -28, z: 1 }], [18.39, { x: 0, y: -28, z: 1 }], [18.4, { x: -4, y: -30, z: 0 }], [21.6, { x: -4, y: -32, z: 0 }],
      ]);
      return { x: c.x + shake(t, H.hop1, 0.2), y: c.y, z: c.z };
    },
    actors(t, w) {
      const sy = seatY(w), A = { f: { x: 0, feet: sy, pose: 'idle', behind: true, expr: null, flip: false }, h: null, key: -1, bush: 0, eyes: false, pops: [], banana: null, paper: 0.3 };
      const F = A.f;
      // the founder types away
      const ty = typing(t, 0.2, H.turn, 7); if (ty) { F.pose = ty.pose; A.key = ty.key; A.paper = 0.2 + (t / H.turn) * 0.5; A.col = (ty.beat % 14) / 14; }
      if (t >= H.turn && t < H.walk0) { F.pose = t < H.hop0 + 0.1 ? 'idle' : 'st_gasp'; if (t >= H.hop0 && t < 9.6) A.pops.push({ kind: '!', x: F.x, y: F.feet - 50, k: seg(t, H.hop0, H.hop0 + 0.2) }); }
      // the bush rustles, eyes blink inside, then the hire peeks out and hops over
      if (t >= H.rustle && t < H.peek0) { A.bush = (t < 5.3 || t > 6.0) ? (fr(t, 14, 2) ? 1 : -1) : 0; A.eyes = fr(t, 1.6, 4) !== 3; }
      if (t >= H.peek0 && t < H.hop0) { const k = seg(t, H.peek0, H.peek1); A.h = { x: BUSH_X, feet: lerp(FLOOR + 34, FLOOR + 6, ease.out(k)), pose: 'st_peek', clip: true }; if (t > H.peek1) A.pops.push({ kind: '?', x: BUSH_X, y: FLOOR - 40, k: seg(t, H.peek1, H.peek1 + 0.2) }); A.bush = t < 6.7 ? (fr(t, 14, 2) ? 1 : -1) : 0; }
      if (t >= H.hop0 && t < H.hop1) { const k = seg(t, H.hop0, H.hop1); A.h = { x: lerp(BUSH_X, 52, k), feet: lerp(FLOOR + 6, FLOOR, k) + SK.hop(k, 22), pose: k < 0.1 ? 'crouch' : 'air', clip: k < 0.3 }; A.bush = fr(t, 14, 2) ? 1 : -1; }
      if (t >= H.hop1) A.h = { x: 52, feet: FLOOR, pose: t < H.hop1 + 0.15 ? 'impact' : 'idle', expr: null };
      // the founder hops down from the desk and offers a banana
      if (t >= H.walk0 && t < H.go0) {
        F.behind = false;
        if (t < H.walk1) { const k = seg(t, H.walk0, H.walk1); F.x = lerp(0, 22, k); F.feet = lerp(sy, FLOOR, k) + SK.hop(k, 8); F.pose = 'air'; }
        else { F.x = 22; F.feet = FLOOR; F.pose = t < H.grab ? 'st_offer' : t < H.joy ? 'idle' : 'st_cheer'; F.expr = 'giggle'; }
        if (t >= H.offer && t < H.grab) A.banana = { who: 'f' };
      }
      if (A.h && t >= H.sniff && t < H.grab) { A.h.pose = fr(t, 5, 2) ? 'st_peek' : 'idle'; A.h.x = 48; }
      if (A.h && t >= H.grab && t < H.eat1) { A.h.pose = fr(t, 6, 2) ? 'st_crack_a' : 'st_crack_b'; A.banana = { who: 'h', bite: seg(t, H.grab + 0.2, H.eat1) }; }
      if (A.h && t >= H.joy && t < H.joy1) { const k = seg(t, H.joy, H.joy1); A.h.pose = k < 0.1 ? 'crouch' : 'air'; A.h.feet = FLOOR + SK.hop(k, 14); A.pops.push({ kind: 'heart', x: A.h.x, y: A.h.feet - 50, k: 1 }); }
      if (A.h && t >= H.joy1 && t < H.go0) A.pops.push({ kind: 'heart', x: A.h.x, y: FLOOR - 52, k: 1 });
      // the hire takes the seat, the founder stands aside
      if (t >= H.go0) {
        const k = seg(t, H.go0, H.go1);
        F.behind = false; const wf = SK.walk(t, H.go0, H.go1 - 0.3, 22, -26); F.x = wf.x; F.pose = wf.pose; F.feet = FLOOR; F.flip = false;
        const hk = seg(t, H.go0 + 0.3, H.go1); A.h = { x: lerp(48, 0, hk), feet: lerp(FLOOR, sy, hk) + SK.hop(hk, 14), pose: hk <= 0 ? 'idle' : hk < 1 ? 'air' : 'idle', behind: hk > 0.5 };
        if (k >= 1) { F.pose = t > H.cheer ? (fr(t, 3, 2) ? 'st_cheer' : 'idle') : 'idle'; F.expr = 'giggle'; F.feet = FLOOR + (t > H.cheer && fr(t, 3, 2) ? -2 : 0); }
      }
      if (t >= H.crack && t < H.type) { A.h.pose = fr(t - H.crack, 2.5, 2) ? 'st_crack_b' : 'st_crack_a'; if (fr(t - H.crack, 2.5, 2)) A.pops.push({ kind: 'spark', x: A.h.x, y: A.h.feet - 20, k: 1 }); }
      const ht = typing(t, H.type, 99, 12); if (ht) { A.h.pose = ht.pose; A.key = ht.key; A.paper = 0.2 + ((t - H.type) % 1.4) / 1.4 * 0.8; A.col = (ht.beat % 16) / 16; A.h.expr = 'determined'; A.fly = true; }
      return A;
    },
    draw(g, t, w, A, view) {
      const p = people(w), F = A.f, top = deskTopY(w);
      const drawF = () => { SK.shadow(g, F.x, FLOOR + 1, 10); SK.actor(g, p.founder.look, F.pose, F.x, F.feet, { hat: p.founder.hat, expr: F.expr || undefined, flip: F.flip }); };
      const drawH = () => { if (!A.h) return; if (!A.h.clip) SK.shadow(g, A.h.x, FLOOR + 1, 10); SK.actor(g, p.hire.look, A.h.pose, A.h.x, A.h.feet, { expr: A.h.expr || undefined, clip: A.h.clip ? [-999, -999, 999, FLOOR + 1] : null }); };
      // behind the desk
      if (F.behind) drawF();
      if (A.h && A.h.behind) drawH();
      desk0(g, w, 0, { key: A.key, paper: A.paper, col: A.col || 0 });
      // the bush (with the hire behind it while it hides)
      if (A.h && A.h.clip) drawH();
      SK.prop.bush(g, BUSH_X + A.bush, FLOOR + 1, 7, SK.RAMP.leafD);
      if (A.eyes) { SK.rect(g, BUSH_X - 4 + A.bush, FLOOR - 12, 2, 2, '#fff6d6'); SK.rect(g, BUSH_X + 2 + A.bush, FLOOR - 12, 2, 2, '#fff6d6'); SK.rect(g, BUSH_X - 3 + A.bush, FLOOR - 11, 1, 1, '#1a0f14'); SK.rect(g, BUSH_X + 3 + A.bush, FLOOR - 11, 1, 1, '#1a0f14'); }
      if (A.bush) for (let i = 0; i < 3; i++) { const lk = seg(t, H.rustle + i * 0.3, H.rustle + i * 0.3 + 0.8); if (lk > 0 && lk < 1) SK.rect(g, BUSH_X - 6 + i * 6 + Math.round(Math.sin(lk * 9) * 2), FLOOR - 20 - Math.round(lk * 8) + Math.round(lk * lk * 20), 2, 1, SK.RAMP.leaf[1]); }
      // in front
      if (A.h && !A.h.behind && !A.h.clip) drawH();
      if (!F.behind) drawF();
      // the banana: in the founder's paw, then being eaten
      if (A.banana) {
        if (A.banana.who === 'f') SK.banana(g, F.x + 15, F.feet - 26, { up: true });
        else if (A.h) { const b = A.banana.bite; if (b < 0.75) SK.banana(g, A.h.x - 2, A.h.feet - 30 + Math.round(b * 4), { up: true }); SK.rect(g, A.h.x - 3, A.h.feet - 26 + Math.round(b * 4), 3, 1, '#f6e08a'); if (b > 0.75) { SK.rect(g, A.h.x - 6, FLOOR - 1, 5, 2, '#c98f0e'); SK.rect(g, A.h.x - 5, FLOOR - 2, 1, 1, '#ffd23a'); } }
      }
      // pops: !, ?, hearts, knuckle sparks
      for (const q of A.pops) { if (q.kind === 'spark') { SK.sparkle(g, q.x - 9, q.y, 2); SK.sparkle(g, q.x + 9, q.y - 2, 1); } else SK.pop(g, q.x, q.y, q.kind, q.k); }
      // letters fly off the page while the hire types
      if (A.fly) for (let i = 0; i < 4; i++) { const k = ((t - H.type) * 1.6 + i / 4) % 1, ch = 'OOKBANANA'[(Math.floor((t - H.type) * 1.6 + i / 4) + i) % 9]; SK.text(g, ch, Math.round(-4 + i * 3 + k * (i % 2 ? 18 : -18)), Math.round(top - 26 - k * 22), k < 0.7 ? '#fff6d6' : '#c9b88a', { shadow: '#1a0f14' }); }
      if (t > H.cheer) sparkles(g, t, F.x, F.feet - 52, H.cheer, H.cheer + 1.6, 4, 12);
    },
    screen(g, t, w, A, view) { flash(g, view, t, H.hop1, 0.06); },
  });

  /* =====================================================================
     3. FIRST SALE: the pages become a string-bound book; a toucan pays three bananas for it; up goes the sign.
     ===================================================================== */
  const S3 = { tie0: 0.6, tie1: 2.8, bound: 2.8, fly0: 3.6, land: 5.2, walk0: 7.6, walk1: 8.4, give: 8.6, take: 9.6, drop0: 10.3, leave: 12.0, gone: 13.6, grab: 12.6, sign0: 14.8, sign1: 15.8, hit0: 16.0, hit1: 17.4, up: 17.6, end: 20.4 };
  const STUMP_X = 60, POST_X = -44;
  const BANANAS = [[10.3, 42], [10.75, 46], [11.2, 38]];
  SK.scene({
    id: 'first-sale', title: 'We Are a Publisher', chapter: 3, duration: S3.end, sky: w => ({ wx: Math.min(1, w.wx | 0) }),
    beats: [
      { at: 0.3, who: 'founder', text: 'Enough pages for a book. Mostly in the right order.' },
      { at: 3.6, who: 'narrator', text: 'And then our very first customer swooped in.' },
      { at: 5.4, who: 'toucan', text: 'SQUAWK! One book, please. I pay in bananas.' },
      { at: 8.6, who: 'founder', text: 'One hand-bound original. Mind the string.', expr: 'giggle' },
      { at: 12.2, who: 'founder', text: 'Three bananas! That\'s a lot of bananas.', expr: 'screech' },
      { at: 15.0, who: 'founder', text: 'Somebody get a hammer. We\'re a publisher now.', expr: 'giggle' },
    ],
    cast: w => ({ founder: Object.assign({ name: 'You' }, people(w).founder), toucan: { name: 'Toucan', bg: '#2878b4', draw: g => SK.toucan(g, 8, 22, 0) } }),
    cues: [
      { at: 0.7, sfx: 'page' }, { at: 1.3, sfx: 'page' }, { at: 1.9, sfx: 'page' }, { at: 2.5, sfx: 'rip' }, { at: S3.bound, sfx: 'stamp' }, { at: S3.bound + 0.1, sfx: 'levelup' },
      { at: S3.fly0, sfx: 'whoosh' }, { at: 4.4, sfx: 'whoosh' }, { at: S3.land, sfx: 'tick' }, { at: 5.35, sfx: 'monkey' },
      { at: S3.give, sfx: 'attach' }, { at: S3.take, sfx: 'chest' },
      ...BANANAS.map(([at]) => ({ at: at + 0.35, sfx: 'coin' })), { at: S3.leave, sfx: 'whoosh' }, { at: S3.grab + 0.3, sfx: 'triumph' },
      { at: S3.hit0, sfx: 'hammer' }, { at: S3.hit0 + 0.45, sfx: 'hammer' }, { at: S3.hit0 + 0.9, sfx: 'hammer' }, { at: S3.up, sfx: 'stamp' }, { at: S3.up + 0.2, sfx: 'jackpot' },
    ],
    camera(t) {
      const c = SK.track(t, [
        [0, { x: -12, y: -28, z: 1 }], [2.6, { x: -10, y: -28, z: 1 }], [3.4, { x: 4, y: -34, z: 0 }], [5.2, { x: 18, y: -30, z: 0 }],
        [8.0, { x: 22, y: -28, z: 0 }], [8.01, { x: 38, y: -28, z: 1 }], [11.6, { x: 38, y: -28, z: 1 }], [11.61, { x: 24, y: -34, z: 0 }],
        [14.4, { x: 8, y: -30, z: 0 }], [15.8, { x: -22, y: -34, z: 0 }], [17.59, { x: -24, y: -34, z: 0 }], [17.6, { x: -26, y: -36, z: 1 }], [20.4, { x: -26, y: -36, z: 1 }],
      ]);
      return { x: c.x + shake(t, S3.up, 0.25), y: c.y + shake(t, S3.hit0, 0.08) + shake(t, S3.hit0 + 0.45, 0.08) + shake(t, S3.hit0 + 0.9, 0.08), z: c.z };
    },
    actors(t, w) {
      const A = { f: { x: -20, feet: FLOOR, pose: 'st_carry', expr: null, flip: false }, stack: 0, book: null, toucan: null, bananas: [], sign: null, pops: [] };
      const F = A.f;
      // tie the pages into a book
      if (t < S3.bound) { const k = seg(t, S3.tie0, S3.tie1); A.stack = Math.min(5, 2 + Math.floor(k * 4)); F.pose = k > 0 && k < 1 ? (fr(t, 4, 2) ? 'st_carry' : 'st_crack_a') : 'st_carry'; A.book = { x: F.x - 4, y: F.feet - 26, loose: true }; }
      else if (t < S3.give) { F.pose = t < S3.fly0 + 1 ? 'st_hold' : 'st_carry'; F.expr = 'giggle'; A.book = t < S3.fly0 + 1 ? { x: F.x - 4, y: F.feet - 50 } : { x: F.x - 4, y: F.feet - 26 }; }
      // the toucan flies in and perches on the stump
      if (t >= S3.fly0) {
        if (t < S3.land) { const k = seg(t, S3.fly0, S3.land); A.toucan = { x: lerp(150, STUMP_X, ease.out(k)), y: lerp(-90, FLOOR - 10, ease.inOut(k)) + Math.round(Math.sin(k * 10) * 3), f: fr(t, 8, 2) + 1, flip: true }; }
        else if (t < S3.leave) { A.toucan = { x: STUMP_X, y: FLOOR - 10, f: 0, flip: true }; if (t > S3.take && t < S3.drop0) A.toucan.f = fr(t, 6, 2) ? 0 : 1; }
        else { const k = seg(t, S3.leave, S3.gone); A.toucan = { x: lerp(STUMP_X, 160, ease.in(k)), y: lerp(FLOOR - 10, -110, ease.in(k)), f: fr(t, 9, 2) + 1, flip: false, carry: 'book' }; if (k >= 1) A.toucan = null; }
      }
      // walk over and hand the book across
      if (t >= S3.walk0 && t < S3.grab) {
        const wk = SK.walk(t, S3.walk0, S3.walk1, -20, 24); F.x = wk.x; F.pose = wk.moving ? wk.pose : 'st_offer'; F.expr = 'giggle';
        if (t < S3.take) A.book = wk.moving ? { x: F.x - 4, y: F.feet - 26 } : { x: F.x + 13, y: F.feet - 30 };
        else if (t < S3.take + 0.3) { const k = seg(t, S3.take, S3.take + 0.3); A.book = { x: lerp(F.x + 13, STUMP_X - 4, k), y: lerp(F.feet - 30, FLOOR - 12, k) }; }
        else A.book = { x: STUMP_X - 7, y: FLOOR - 11, beak: true };
        if (t >= S3.take) F.pose = 'idle';
      }
      // three bananas drop from the toucan's beak and bounce
      for (const [at, bx] of BANANAS) {
        if (t < at) continue;
        const k = seg(t, at, at + 0.35), r = t - at - 0.35, y = k < 1 ? lerp(FLOOR - 22, FLOOR - 4, ease.in(k)) : FLOOR - 4 - Math.max(0, Math.round(Math.abs(SK.wobble(r, 5, 14, 6))));
        A.bananas.push({ x: bx, y: Math.round(y), held: false });
      }
      if (t >= S3.drop0 && t < S3.leave) A.pops.push({ kind: '!', x: F.x, y: F.feet - 50, k: seg(t, S3.drop0, S3.drop0 + 0.2) });
      // scoop them up and cheer
      if (t >= S3.grab && t < S3.sign0) { F.x = Math.round(lerp(24, 30, seg(t, S3.grab, S3.grab + 0.3))); const k = seg(t, S3.grab, S3.grab + 0.3); F.pose = k < 1 ? 'crouch' : (fr(t, 3, 2) ? 'st_cheer' : 'st_hold'); F.expr = 'giggle'; F.feet = FLOOR + (k >= 1 && fr(t, 3, 2) ? -3 : 0); if (k >= 1) A.bananas = A.bananas.map((b, i) => ({ x: F.x - 6 + i * 4, y: F.feet - 52 - (i === 1 ? 2 : 0), held: true })); }
      // the sign: walk to the post, three hammer blows, up it goes
      if (t >= S3.sign0) {
        const wk = SK.walk(t, S3.sign0, S3.sign1, 30, POST_X + 30); F.x = wk.x; F.pose = wk.pose; F.flip = false; F.expr = null;
        A.bananas = t < S3.sign1 ? [{ x: F.x - 7, y: F.feet - 22 }, { x: F.x - 3, y: F.feet - 24 }, { x: F.x + 1, y: F.feet - 22 }] : [{ x: 26, y: FLOOR - 4 }, { x: 31, y: FLOOR - 3 }, { x: 36, y: FLOOR - 4 }];
        if (t >= S3.sign1) { F.pose = 'idle'; A.sign = { y: Math.round(lerp(-60, -40, ease.in(seg(t, S3.sign1, S3.hit0)))), tilt: 1 }; }
        if (t >= S3.hit0 && t < S3.hit1) { const hb = Math.floor((t - S3.hit0) / 0.45), ph = (t - S3.hit0) % 0.45; F.pose = ph < 0.2 ? 'st_wave_a' : 'st_point'; F.expr = 'determined'; A.sign = { y: -40 + Math.min(2, hb), tilt: hb < 2 ? 1 : 0 }; A.hit = ph < 0.08 ? hb : -1; }
        if (t >= S3.hit1) { A.sign = { y: -38, tilt: 0, swing: SK.wobble(t - S3.up, 2, 16, 5) }; F.pose = t >= S3.up ? (fr(t, 3, 2) ? 'st_cheer' : 'idle') : 'idle'; F.expr = 'giggle'; F.feet = FLOOR + (t >= S3.up && fr(t, 3, 2) ? -3 : 0); }
      }
      return A;
    },
    draw(g, t, w, A, view) {
      const p = people(w), F = A.f;
      // the first desk (just the machine, nobody at it) and a stump for the customer
      desk0(g, w, 0, { paper: 0.9 });
      SK.box(g, STUMP_X - 6, FLOOR - 9, 13, 9, SK.RAMP.woodD); SK.rect(g, STUMP_X - 5, FLOOR - 9, 11, 2, SK.RAMP.woodL[1]); SK.rect(g, STUMP_X - 2, FLOOR - 8, 4, 1, SK.RAMP.woodL[3]);
      // the signpost (empty until the sign goes up)
      SK.box(g, POST_X - 1, FLOOR - 44, 3, 44, SK.RAMP.woodD);
      if (A.sign) { const sx = POST_X - 12 + Math.round(A.sign.swing || 0), sy = FLOOR + A.sign.y; SK.board(g, sx, sy + (A.sign.tilt ? 1 : 0), 'IMI\nBOOKS', '#2f8a35', '#ffd23a', { trim: '#74c648' }); SK.rect(g, POST_X, sy + 2, 1, 1, '#d8d8e4'); SK.rect(g, POST_X, sy + 12, 1, 1, '#d8d8e4'); }
      if (A.hit >= 0 && A.hit != null) { SK.sparkle(g, POST_X + 2, FLOOR + A.sign.y + 4, 3, '#ffffff'); SK.puff(g, POST_X + 6, FLOOR + A.sign.y + 8, 0.4, { n: 3, spread: 6, size: 2, col: '#e8b878' }); }
      // the founder, the book, the pages
      SK.shadow(g, F.x, FLOOR + 1, 10);
      SK.actor(g, p.founder.look, F.pose, F.x, F.feet, { hat: p.founder.hat, expr: F.expr || undefined, flip: F.flip });
      if (A.book && A.book.loose) { for (let i = 0; i < A.stack; i++) SK.page(g, A.book.x - 1 + (i % 2), A.book.y - i * 2, 9, 10, 3); }
      else if (A.book && !A.book.beak) SK.book(g, A.book.x, A.book.y);
      if (t >= S3.bound && t < S3.bound + 1.2) sparkles(g, t, F.x, F.feet - 46, S3.bound, S3.bound + 1.2, 4, 12);
      // the toucan (holding the book in its beak, then flying off with it)
      if (A.toucan) SK.toucan(g, A.toucan.x, A.toucan.y, A.toucan.f, { flip: A.toucan.flip, carry: A.toucan.carry });
      if (A.book && A.book.beak && A.toucan) SK.book(g, A.toucan.x - 18, A.toucan.y - 15);
      // bananas
      for (const b of A.bananas) SK.banana(g, b.x, b.y);
      for (const q of A.pops) SK.pop(g, q.x, q.y, q.kind, q.k);
      if (t >= S3.up) sparkles(g, t, POST_X, FLOOR - 32, S3.up, S3.up + 1.8, 5, 22);
    },
    screen(g, t, w, A, view) { flash(g, view, t, S3.bound, 0.08); flash(g, view, t, S3.up, 0.1); },
  });
})(typeof globalThis !== 'undefined' ? globalThis : window);
