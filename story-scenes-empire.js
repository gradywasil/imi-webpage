/* STORY SCENES, THE EMPIRE: 9 media-records, 10 media-tv, 11 media-radio, 12 media-troupe, 13 first-muse, 14 second-printing.
   Same rules as story-scenes-early.js (the reference): actors(t, w) is pure in t, world art pixels, x = 0 the middle of the stage, SK.FLOOR where people stand.
   Every scene draws the CURRENT building behind (w.stage) and adds its new thing as part of the action: a studio's sign goes up, a muse's portrait is hung,
   the run is bound into one book. The studio signpost and the muse portraits the kit would draw are held back in prepare(w) and drawn here, so they can
   arrive on cue. */
(function (G) {
  'use strict';
  const SK = G.StoryKit; if (!SK) return;
  const { seg, lerp, ease, FLOOR, rect, hash } = SK;
  const fr = SK.frame, R = SK.RAMP, INK = '#1a0f14', CREAM = '#fff6d6';
  const ORDER = ['songs', 'tv', 'radio', 'sketch', 'film'];
  const FALLBACK = ['v07', 'v13', 'v19', 'v25', 'v28', 'v04', 'v10'];

  /* =====================  helpers for these scenes  ===================== */
  const shake = (t, t0, dur = 0.3, amp = 1) => (t >= t0 && t < t0 + dur ? (fr(t, 30) % 2 ? amp : -amp) : 0);
  const clacks = (t0, t1, fps = 8) => { const out = []; for (let k = 0, t = t0; t < t1; k++, t = t0 + k / fps) out.push({ at: t + 0.001, sfx: 'key', arg: 0.9 + (k % 3) * 0.1 }); return out; };
  const beatCues = (t0, t1, dt, sfx = 'drum') => { const out = []; for (let t = t0; t < t1; t += dt) out.push({ at: +t.toFixed(3), sfx }); return out; };
  /** Sparkles orbiting a point for a while */
  function sparkles(g, t, x, y, t0, t1, n = 4, r = 14, col = '#fff08c') {
    if (t < t0 || t > t1) return;
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 + (t - t0) * 2, ph = fr(t + i * 0.13, 6, 3); SK.sparkle(g, x + Math.round(Math.cos(a) * r), y + Math.round(Math.sin(a) * r * 0.6), ph === 2 ? 1 : 2, ph === 1 ? '#ffffff' : col); }
  }
  /** A screen-space flash */
  function flash(g, view, t, t0, dur = 0.12, col = 'rgba(255,246,214,.7)') { if (t < t0 || t > t0 + dur) return; g.fillStyle = col; g.fillRect(0, 0, view.w, view.h); }
  /** A pixel line (Bresenham) */
  function line(g, x0, y0, x1, y1, c) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1); g.fillStyle = c;
    const dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1, dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1; let err = dx + dy;
    for (let n = 0; n < 2000; n++) { g.fillRect(x0, y0, 1, 1); if (x0 === x1 && y0 === y1) break; const e2 = 2 * err; if (e2 >= dy) { err += dy; x0 += sx; } if (e2 <= dx) { err += dx; y0 += sy; } }
  }
  /** A sagging rope / vine / cable between two points */
  function rope(g, x0, y0, x1, y1, sag, c, c2) {
    const n = Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0) / 4)); let px = x0, py = y0;
    for (let i = 1; i <= n; i++) { const k = i / n, x = lerp(x0, x1, k), y = lerp(y0, y1, k) + Math.sin(k * Math.PI) * sag; line(g, px, py, x, y, c); if (c2 && i % 2) rect(g, Math.round(x), Math.round(y), 1, 1, c2); px = x; py = y; }
  }
  /** The founder and a crew of distinct looks (the machines' lead typists first, then stock looks) */
  function people(w) {
    const founder = w.founder || { look: 'v01', hat: 0 }, seen = new Set([founder.look]), crew = [];
    for (const c of (w.crew || []).slice(1)) if (c && c.look && !seen.has(c.look)) { seen.add(c.look); crew.push({ look: c.look, hat: c.hat || 0 }); }
    for (const l of FALLBACK) if (!seen.has(l)) { seen.add(l); crew.push({ look: l, hat: 0 }); }
    return { founder, crew };
  }
  const castOf = (w, extra = {}) => { const p = people(w); return Object.assign({ founder: Object.assign({ name: 'You' }, p.founder), crew: Object.assign({ name: 'The crew', bg: '#5a3517' }, p.crew[0]) }, extra); };
  /** Draw a monkey with a ground shadow. o: { expr, flip, prop, clip, ground (shadow y), noShadow } */
  function actor(g, who, pose, x, feet, o = {}) {
    if (!o.noShadow) SK.shadow(g, x, (o.ground == null ? FLOOR : o.ground) + 1, 10);
    SK.actor(g, who.look, pose, x, feet, { hat: who.hat, expr: o.expr || undefined, flip: o.flip, prop: o.prop, clip: o.clip, sil: o.sil, eyes: o.eyes });
  }
  const ordinal = n => n + (n % 100 >= 11 && n % 100 <= 13 ? 'TH' : ['TH', 'ST', 'ND', 'RD'][n % 10] || 'TH');

  /* ---- the studio signpost, held back so the new board arrives on cue ---- */
  function studioPrep(w, id) {
    const all = (w.studios || []).slice(); if (!all.includes(id)) all.push(id);
    w._signs = { before: ORDER.filter(s => s !== id && all.includes(s)), after: ORDER.filter(s => all.includes(s)) };
    w.studios = [];
  }
  const signpostX = (w, view) => Math.max(view.anchors.half, ((Math.min(6, w.desks || 1) - 1) / 2) * 32 + 16) + 30;
  function signpost(g, t, w, view, after) { const s = w._signs; if (!s) return; const ids = after ? s.after : s.before; if (ids.length) SK.signpost(g, t, signpostX(w, view), ids); }

  /** A big marquee: 2x letters on a board framed by a rail of bulbs. on: 0 dark, 0..1 bulbs light up in turn, 1 chasing. Returns { x0, w, h }. */
  function marquee(g, t, cx, top, lines, S, on, view, o = {}) {
    const s = o.s || 2, tw = Math.max(...lines.map(l => SK.textW(l, s))), w = tw + 16, lh = 5 * s + 3, h = lines.length * lh + 11, x0 = Math.round(cx - w / 2), y0 = Math.round(top);
    rect(g, x0 - 1, y0 - 1, w + 2, h + 2, INK); rect(g, x0, y0, w, h, o.rail || '#5a3a06'); rect(g, x0, y0, w, 1, o.railHi || '#b38004');
    rect(g, x0 + 4, y0 + 4, w - 8, h - 8, INK); rect(g, x0 + 5, y0 + 5, w - 10, h - 10, S.bg); rect(g, x0 + 5, y0 + 5, w - 10, 1, S.trim); rect(g, x0 + 5, y0 + h - 6, w - 10, 1, 'rgba(0,0,0,.3)');
    const B = [];
    for (let x = x0 + 1; x < x0 + w - 2; x += 4) B.push([x, y0 + 1]);
    for (let y = y0 + 5; y < y0 + h - 2; y += 4) B.push([x0 + w - 3, y]);
    for (let x = x0 + w - 3 - 4; x > x0; x -= 4) B.push([x, y0 + h - 3]);
    for (let y = y0 + h - 7; y > y0 + 2; y -= 4) B.push([x0 + 1, y]);
    const ph = fr(t, 8);
    B.forEach(([x, y], i) => { const lit = on >= 1 ? (i + ph) % 3 !== 0 : on > 0 && i / B.length < on; rect(g, x, y, 2, 2, lit ? '#fff08c' : '#2a1a0a'); if (lit) view.light(x, y, 2, 2, '#fffbe0'); });
    lines.forEach((l, i) => { const lx = x0 + Math.floor((w - SK.textW(l, s)) / 2), ly = y0 + 6 + i * lh; SK.text(g, l, lx, ly, on > 0 ? S.fg : o.dim || S.fg, { s, shadow: INK }); });
    return { x0, w, h };
  }
  /** A music note (kind 0: a quaver, 1: two beamed) with its foot at (x, y) */
  function note(g, x, y, col, kind = 0) {
    x = Math.round(x); y = Math.round(y);
    if (kind === 0) {
      rect(g, x - 1, y - 2, 5, 4, INK); rect(g, x + 1, y - 9, 3, 8, INK); rect(g, x + 3, y - 9, 3, 5, INK);
      rect(g, x, y - 1, 3, 2, col); rect(g, x + 2, y - 8, 1, 7, col); rect(g, x + 3, y - 8, 1, 1, col); rect(g, x + 4, y - 7, 1, 2, col); rect(g, x, y - 1, 1, 1, '#ffffff');
    } else {
      rect(g, x - 1, y - 2, 4, 4, INK); rect(g, x + 4, y - 3, 4, 4, INK); rect(g, x + 1, y - 10, 3, 9, INK); rect(g, x + 6, y - 11, 3, 9, INK); rect(g, x + 1, y - 11, 8, 3, INK);
      rect(g, x, y - 1, 2, 2, col); rect(g, x + 5, y - 2, 2, 2, col); rect(g, x + 2, y - 9, 1, 8, col); rect(g, x + 7, y - 10, 1, 8, col); rect(g, x + 2, y - 10, 6, 1, col); rect(g, x, y - 1, 1, 1, '#ffffff');
    }
  }
  const NOTE_COLS = ['#ffd23a', '#f08aa4', '#9ce0ff', '#a8ec76', '#e4beff'];
  /** A vinyl record, r = radius, spinning */
  function record(g, t, x, y, r) {
    x = Math.round(x); y = Math.round(y); if (r < 1) return;
    SK.disc(g, x, y, r + 1, INK); SK.disc(g, x, y, r, '#2a2434');
    for (let k = r - 2; k > r * 0.45; k -= 2) { SK.disc(g, x, y, k, k % 4 ? '#221c2c' : '#302a3c'); }
    SK.disc(g, x, y, Math.max(1, Math.round(r * 0.4)), '#7a46bc'); SK.disc(g, x - 1, y - 1, Math.max(1, Math.round(r * 0.2)), '#b58cf0'); rect(g, x, y, 1, 1, INK);
    const a = t * 7; for (const s of [0, Math.PI]) { const gx = x + Math.round(Math.cos(a + s) * (r - 2)), gy = y + Math.round(Math.sin(a + s) * (r - 2)); rect(g, gx, gy, 1, 1, '#9a94b0'); }
  }
  /** An open book (17x8), held at chest height */
  function openBook(g, x, y, col = R.red) {
    x = Math.round(x); y = Math.round(y);
    rect(g, x - 9, y - 1, 19, 9, INK); rect(g, x - 8, y + 6, 17, 1, col[2]);
    rect(g, x - 8, y, 8, 6, R.paper[1]); rect(g, x + 1, y, 8, 6, R.paper[1]); rect(g, x, y, 1, 7, R.paper[3]); rect(g, x - 8, y, 8, 1, '#ffffff');
    for (let i = 0; i < 3; i++) { rect(g, x - 7, y + 2 + i * 1.5 | 0, 5 - (i % 2), 1, '#5a4a7a'); rect(g, x + 2, y + 2 + i * 1.5 | 0, 5 - ((i + 1) % 2), 1, '#5a4a7a'); }
  }
  /** Spotlight beams sweeping up from the bottom of the screen (screen space) */
  function beams(g, view, t, t0, k = 1) {
    if (t < t0) return;
    const on = Math.min(1, (t - t0) / 0.3) * k; g.globalAlpha = 0.16 * on;
    for (const [bx, s] of [[0.12, 1], [0.88, -1]]) {
      const ang = s * (0.35 + Math.sin((t - t0) * 1.4 + (s > 0 ? 0 : 2)) * 0.28), x0 = view.w * bx;
      for (let y = view.h; y > -4; y -= 2) { const d = view.h - y, cx = x0 + d * Math.tan(ang), hw = 1 + d * 0.1; g.fillStyle = '#fff6d6'; g.fillRect(Math.round(cx - hw), y, Math.round(hw * 2), 2); }
    }
    g.globalAlpha = 1;
  }
  /** Confetti falling from the top of the screen (screen space) */
  function confetti(g, view, t, t0, n = 46) {
    if (t < t0) return;
    const C = ['#ffd23a', '#f08aa4', '#9ce0ff', '#a8ec76', '#e4beff', '#fff6d6', '#e86a50'];
    for (let i = 0; i < n; i++) {
      const sp = 22 + hash(i, 2) * 26, y = Math.round(-6 - hash(i, 3) * 70 + (t - t0) * sp), x = Math.round(hash(i, 1) * view.w + Math.sin(t * 3 + i) * 3);
      if (y < -3 || y > view.h) continue; const f = fr(t + i * 0.1, 8, 2);
      rect(g, x, y, f ? 2 : 1, f ? 1 : 2, C[i % C.length]);
    }
  }
  /** Stepped pixel ring arcs (left and right of a point, like a radio icon) */
  function waves(g, cx, cy, r, col, spread = 0.75) {
    const n = Math.max(6, Math.round(r * 1.6));
    for (let i = 0; i <= n; i++) { const a = -spread + (2 * spread * i) / n; if (r > 34 && i % 2) continue; for (const s of [1, -1]) rect(g, Math.round(cx + s * Math.cos(a) * r), Math.round(cy + Math.sin(a) * r * 0.8), 1, 1, col); }
  }
  /** The working floor: every desk with its typist; pose(i, t) decides each one's pose (null = empty desk) */
  function floorCrew(g, t, w, view, pose, o = {}) {
    const p = people(w), n = Math.max(1, Math.min(6, w.desks || 1)), pos = SK.crewLayout(n, view.w).slice().sort((a, b) => a.y - b.y);
    for (const q of pos) {
      const i = q.i, who = i === 0 ? (o.founderAt0 ? p.founder : o.fill0 ? p.crew[p.crew.length - 1] : null) : (w.crew && w.crew[i]) || p.crew[(i - 1) % p.crew.length];
      const kind = (o.stage != null ? o.stage : w.stage) === 0 && i === 0 ? 'crate' : 'desk', top = kind === 'crate' ? 13 : 11;
      const ps = who ? pose(i, t) : null;
      if (ps) { SK.shadow(g, q.x, q.y + 1, 14); SK.actor(g, who.look, ps.pose, q.x, q.y - top + 4 + (ps.dy || 0), { hat: who.hat, expr: ps.expr }); }
      const dt = SK.desk(g, q.x, q.y, kind);
      SK.typewriter(g, i, q.x, dt, ps && ps.key != null ? ps.key : -1, { paper: ((i * 0.3) % 1) * 0.6 + 0.2, col: ps && ps.col != null ? ps.col : 0.3 });
      if (ps && ps.pop) SK.pop(g, q.x, q.y - top - 34, ps.pop, 1);
    }
    return pos;
  }
  const typePose = (i, t) => { const b = fr(t + i * 0.37, 5 + ((i * 3) % 4)); return { pose: b % 2 ? 'st_type_a' : 'st_type_b', key: b % 12, col: (b % 20) / 20 }; };

  /* =====================================================================
     9. MEDIA: JUNGLE RECORDS. The founder hums a line from a book; the notes will not stay on the page. The crew dances, the notes spin into a record,
        and the Jungle Records marquee is hauled up on ropes and lights up. The turning point: from publisher to media empire.
     ===================================================================== */
  const M9 = { read: 0.3, hum: 3.4, crew: 7.6, ring0: 7.6, beat: 9.0, gather0: 10.6, gather1: 11.2, toss: 11.0, drop: 11.7, catch: 12.3, cut: 13.6, run1: 14.2, pull0: 14.3, tug: 0.42, nTug: 4, lock: 16.0, lights: 16.4, end: 21.0 };
  const POLE = 44, PULLEY = -92, BOARD_FINAL = -86, BOARD_START = FLOOR + 2;
  const HUM = [[3.5, 2], [3.85, 4], [4.2, 5], [4.55, 4], [4.9, 2], [5.6, 4], [5.95, 5], [6.3, 7], [6.65, 5], [7.0, 4], [7.7, 5], [8.05, 7], [8.4, 9], [8.75, 7]];
  SK.scene({
    id: 'media-records', title: 'Why Stop at Books?', chapter: 9, duration: M9.end, sky: w => ({ wx: Math.min(1, w.wx | 0) }),
    prepare(w) { studioPrep(w, 'songs'); },
    beats: [
      { at: 0.3, who: 'founder', text: 'Another fine book. Shame you can\'t dance to it.' },
      { at: 3.4, who: 'founder', text: 'Hm, hm-hmm... "It was the best of times, it was the worst of times..."', expr: 'giggle' },
      { at: 7.6, who: 'crew', text: 'Ook? OOK! Boss, that one is CATCHY.', expr: 'screech' },
      { at: 11.0, who: 'founder', text: 'Why stop at books? Songs! Records! A whole label!', expr: 'screech' },
      { at: 13.8, who: 'founder', text: 'Everybody pull! On three. One, two... OOK!', expr: 'determined' },
      { at: 16.6, who: 'narrator', text: 'And just like that, a little publisher became a media empire.' },
    ],
    cast: w => castOf(w),
    cues: [
      { at: 0.35, sfx: 'page' }, { at: 2.4, sfx: 'page' }, ...HUM.map(([at, k]) => ({ at, sfx: 'gem', arg: k })),
      { at: 7.6, sfx: 'monkey' }, ...beatCues(M9.beat, M9.cut - 0.1, 0.45), ...beatCues(M9.beat + 0.225, M9.gather0, 0.45, 'tick'),
      { at: M9.gather0, sfx: 'whoosh' }, { at: M9.toss, sfx: 'page' }, { at: M9.gather1, sfx: 'levelup' }, { at: M9.drop, sfx: 'whoosh' }, { at: M9.catch, sfx: 'attach' }, { at: M9.catch + 0.05, sfx: 'fanfare' },
      { at: M9.cut, sfx: 'whoosh' }, ...[0, 1, 2, 3].map(k => ({ at: M9.pull0 + k * M9.tug + M9.tug * 0.5, sfx: 'chest' })), { at: M9.lock, sfx: 'stamp' },
      { at: M9.lights, sfx: 'jackpot' }, { at: M9.lights + 0.1, sfx: 'crit' }, { at: 17.2, sfx: 'fanfare' }, ...beatCues(17.6, 20.6, 0.45),
    ],
    camera(t) {
      const c = SK.track(t, [
        [0, { x: 0, y: -30, z: 1 }], [3.39, { x: 0, y: -30, z: 1 }], [3.4, { x: 0, y: -30, z: 2 }], [7.59, { x: 0, y: -32, z: 2 }], [7.6, { x: 0, y: -36, z: 1 }],
        [10.4, { x: 0, y: -36, z: 1 }], [11.2, { x: 0, y: -46, z: 1 }], [13.59, { x: 0, y: -42, z: 1 }], [13.6, { x: 0, y: -44, z: 0 }],
        [16.39, { x: 0, y: -48, z: 0 }], [16.4, { x: 0, y: -52, z: -1 }], [21, { x: 0, y: -54, z: -1 }],
      ]);
      return { x: c.x + shake(t, M9.lights, 0.35), y: c.y + shake(t, M9.lock, 0.12) + shake(t, M9.beat, 0.15), z: c.z };
    },
    actors(t, w) {
      const A = { f: { x: 0, feet: FLOOR, pose: 'st_read', expr: null }, c1: { x: -66, feet: FLOOR, pose: 'idle', expr: null, flip: false }, c2: { x: 66, feet: FLOOR, pose: 'idle', expr: null, flip: true },
        book: 'open', bookFly: null, notes: [], rec: null, board: BOARD_START, after: false, pops: [] };
      const F = A.f;
      // humming: the founder sways with the book; notes float out of the pages
      if (t >= M9.hum && t < M9.toss) { F.expr = 'giggle'; F.feet = FLOOR + (fr(t, 2.8, 2) ? 0 : -1); }
      for (let i = 0; i < 22; i++) {
        const s0 = M9.hum + 0.15 + i * 0.3, a = t - s0; if (a < 0 || a > 2.6 || s0 > M9.gather0) continue;
        const dir = i % 2 ? 1 : -1;
        A.notes.push({ x: Math.round(dir * 3 + Math.sin(a * 3 + i) * 5 + dir * a * 9), y: Math.round(FLOOR - 28 - a * 17), col: NOTE_COLS[i % 5], kind: i % 3 === 2 ? 1 : 0 });
      }
      // the crew perks up, then dances
      if (t >= M9.crew - 0.4 && t < M9.beat) { A.c1.pose = 'st_gasp'; A.c2.pose = 'st_think'; A.pops.push({ kind: '!', x: A.c1.x, y: FLOOR - 50, k: seg(t, M9.crew - 0.4, M9.crew - 0.2) }); }
      if (t >= M9.beat && t < M9.cut) {
        const b = fr(t - M9.beat, 1 / 0.45), up = b % 2 === 0;
        A.c1.pose = up ? 'st_cheer' : 'crouch'; A.c1.feet = FLOOR + (up ? -3 : 0); A.c1.expr = 'giggle';
        A.c2.pose = up ? 'crouch' : 'st_cheer'; A.c2.feet = FLOOR + (up ? 0 : -3); A.c2.expr = 'giggle';
      }
      // a ring of notes orbits the founder, then gathers above into a spinning record
      if (t >= M9.ring0 && t < M9.gather1) {
        const g0 = seg(t, M9.gather0, M9.gather1), rr = lerp(30, 0, ease.in(g0)), cy = lerp(FLOOR - 30, FLOOR - 66, ease.inOut(g0));
        for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + (t - M9.ring0) * 2.4; A.notes.push({ x: Math.round(Math.cos(a) * rr), y: Math.round(cy + Math.sin(a) * rr * 0.45), col: NOTE_COLS[i % 5], kind: i % 2 }); }
      }
      if (t >= M9.toss) {
        A.book = null; const k = seg(t, M9.toss, M9.toss + 0.5);
        A.bookFly = { x: Math.round(lerp(-4, -26, k)), y: Math.round(lerp(FLOOR - 27, FLOOR - 9, ease.in(k)) + SK.hop(k, 14)) };
        F.pose = t < M9.drop ? 'st_gasp' : 'st_hold'; F.expr = 'screech';
      }
      if (t >= M9.gather1 && t < M9.drop) { const k = seg(t, M9.gather1, M9.gather1 + 0.3); A.rec = { x: 0, y: FLOOR - 66 + Math.round(Math.sin(t * 6)), r: Math.round(10 * ease.pop(k)) }; }
      if (t >= M9.drop && t < M9.catch) { const k = seg(t, M9.drop, M9.catch); A.rec = { x: 0, y: Math.round(lerp(FLOOR - 66, FLOOR - 40, ease.in(k))), r: 10 }; }
      if (t >= M9.catch && t < M9.cut) { const sq = t - M9.catch < 0.12; F.pose = sq ? 'crouch' : 'st_hold'; F.expr = 'giggle'; A.rec = { x: 0, y: sq ? FLOOR - 33 : FLOOR - 41, r: 10 }; A.spark = true; }
      // the hoist: the crew runs to the poles and hauls the marquee up out of the ground, four tugs
      if (t >= M9.cut) {
        A.bookFly = null;
        const w1 = SK.walk(t, M9.cut, M9.run1, -66, -58, { fps: 10 }), w2 = SK.walk(t, M9.cut, M9.run1, 66, 58, { fps: 10 });
        A.c1.x = w1.x; A.c1.pose = w1.pose; A.c1.expr = 'determined'; A.c1.feet = FLOOR; A.c2.x = w2.x; A.c2.pose = w2.pose; A.c2.flip = true; A.c2.expr = 'determined'; A.c2.feet = FLOOR;
        F.pose = 'st_carry'; F.expr = 'determined'; A.rec = { x: 0, y: FLOOR - 22, r: 7, front: true };
        const pk = (t - M9.pull0) / M9.tug, done = Math.max(0, Math.min(M9.nTug, Math.floor(pk))), ph = pk - Math.floor(pk), step = (BOARD_START - BOARD_FINAL) / M9.nTug;
        if (t >= M9.pull0 && t < M9.lock) {
          const pose = ph < 0.5 ? 'st_hold' : 'crouch'; A.c1.pose = A.c2.pose = pose; A.pull = ph < 0.5 ? 0 : 1;
          A.board = BOARD_START - step * done - (ph >= 0.5 ? step * ease.out(seg(ph, 0.5, 1)) : 0);
        } else if (t >= M9.lock) { A.board = BOARD_FINAL + Math.round(SK.wobble(t - M9.lock, 2, 18, 6)); A.c1.pose = A.c2.pose = 'idle'; }
        if (t < M9.pull0) A.board = BOARD_START;
      }
      if (t >= M9.lights) {
        A.after = true; const up = fr(t - M9.lights, 3, 2) === 0;
        F.pose = up ? 'st_hold' : 'st_cheer'; F.feet = FLOOR + (up ? -4 : 0); F.expr = 'giggle'; A.rec = { x: 0, y: F.feet - 41, r: 10 };
        A.c1.pose = up ? 'st_cheer' : 'idle'; A.c2.pose = up ? 'idle' : 'st_cheer'; A.c1.expr = A.c2.expr = 'giggle'; A.c1.feet = FLOOR + (up ? -3 : 0); A.c2.feet = FLOOR + (up ? 0 : -3);
      }
      return A;
    },
    draw(g, t, w, A, view) {
      const p = people(w), F = A.f, S = SK.STUDIO.songs;
      signpost(g, t, w, view, A.after);
      // two bamboo poles with pulleys; the marquee rises out of the ground between them
      for (const s of [-1, 1]) { const x = s * POLE; SK.box(g, x - 1, PULLEY, 3, FLOOR - PULLEY, R.bamboo); for (let y = PULLEY + 8; y < FLOOR - 2; y += 10) rect(g, x - 2, y, 5, 1, R.bamboo[3]); SK.disc(g, x, PULLEY - 1, 3, INK); SK.disc(g, x, PULLEY - 1, 2, R.metal[2]); rect(g, x, PULLEY - 1, 1, 1, INK); }
      const lit = t >= M9.lights ? 1 : 0;
      g.save(); g.beginPath(); g.rect(-400, -400, 800, 400 + FLOOR + 1); g.clip();
      const mq = marquee(g, t, 0, Math.round(A.board), ['JUNGLE', 'RECORDS'], S, lit, view);
      g.restore();
      // ropes: pulley -> board corners, pulley -> the crew's paws
      const paw = (c, s) => [c.x + s * 8, c.feet - (A.pull ? 25 : 37)];
      for (const [c, s] of [[A.c1, 1], [A.c2, -1]]) {
        const px = s * -POLE, bx = s < 0 ? mq.x0 + mq.w - 2 : mq.x0 + 1, by = Math.min(FLOOR, Math.round(A.board));
        line(g, px + s * 2, PULLEY - 1, bx, by, '#c8a060');
        const [hx, hy] = t >= M9.cut ? paw(c, s) : [px + s * -2, FLOOR - 2];
        if (t >= M9.cut) rope(g, px - s * 3, PULLEY, hx, hy, t >= M9.pull0 && t < M9.lock ? 0 : 3, '#c8a060'); else line(g, px - s * 3, PULLEY, px - s * 3, FLOOR - 1, '#c8a060');
      }
      // the crew, the founder, the book, the record
      actor(g, p.crew[0], A.c1.pose, A.c1.x, A.c1.feet, { expr: A.c1.expr, flip: A.c1.flip });
      actor(g, p.crew[1], A.c2.pose, A.c2.x, A.c2.feet, { expr: A.c2.expr, flip: A.c2.flip });
      actor(g, p.founder, F.pose, F.x, F.feet, { expr: F.expr });
      if (A.book) openBook(g, F.x, F.feet - 27);
      if (A.bookFly) SK.book(g, A.bookFly.x, A.bookFly.y, { col: R.red, string: false });
      if (A.rec) record(g, t, A.rec.x, A.rec.y, A.rec.r);
      for (const n of A.notes) note(g, n.x, n.y, n.col, n.kind);
      for (const q of A.pops) SK.pop(g, q.x, q.y, q.kind, q.k);
      if (A.spark) sparkles(g, t, 0, FLOOR - 44, M9.catch, M9.cut, 5, 18);
      if (t >= M9.lights) { sparkles(g, t, 0, BOARD_FINAL + 16, M9.lights, M9.lights + 2, 6, 40); sparkles(g, t, signpostX(w, view), -40, M9.lights, M9.lights + 1.6, 4, 14); }
      if (t >= M9.lock && t < M9.lock + 0.5) SK.puff(g, 0, FLOOR, seg(t, M9.lock, M9.lock + 0.5), { n: 7, spread: 30, size: 3 });
    },
    screen(g, t, w, A, view) { beams(g, view, t, M9.lights); confetti(g, view, t, M9.lights); flash(g, view, t, M9.gather1, 0.06); flash(g, view, t, M9.lights, 0.12); },
  });

  /* =====================================================================
     10. MEDIA: CANOPY TV. A camera rolls in, a lamp clicks on, the clapper claps; on the monitor, the founder's close-up. The jungle tunes in
         (lots of eyes in the dark), and the giant TV behind the set switches on: Canopy TV is on the air.
     ===================================================================== */
  const M10 = { push0: 0.4, push1: 2.4, lamp0: 0.5, lamp1: 2.3, set: 2.4, click: 3.2, star: 3.6, slate0: 5.8, slate1: 6.6, clap: 7.6, ins: 8.6, wink: 10.2, insOut: 12.4, eyes: 12.6, on: 15.4, end: 19.0 };
  const CAM_X = -48, STAR_X = 22, LAMP_X = 70, TV_X = 22, TV_TOP = -88;
  SK.scene({
    id: 'media-tv', title: 'Lights, Camera, Ook', chapter: 10, duration: M10.end, sky: w => ({ wx: Math.min(1, w.wx | 0) }),
    prepare(w) { studioPrep(w, 'tv'); },
    beats: [
      { at: 0.3, who: 'narrator', text: 'Books: done. Songs: done. Next, the glowing box everybody stares at.' },
      { at: 3.6, who: 'founder', text: 'Places, everyone! Somebody find my good side. Either side. Both!', expr: 'giggle' },
      { at: 6.6, who: 'crew', text: 'CANOPY TV! Scene one, take one!', expr: 'screech' },
      { at: 8.6, who: 'founder', text: 'Lights... camera... OOK.', expr: 'wink' },
      { at: 12.6, who: 'narrator', text: 'Ten million viewers on the first night. Mostly owls. Owls love primetime.' },
      { at: 15.4, who: 'founder', text: 'That\'s a wrap! Canopy TV is on the air.', expr: 'giggle' },
    ],
    cast: w => castOf(w, { crew: Object.assign({ name: 'The clapper', bg: '#1f6a2a' }, people(w).crew[1]) }),
    cues: [
      { at: 0.5, sfx: 'whoosh' }, { at: 1.2, sfx: 'tick' }, { at: 1.8, sfx: 'tick' }, { at: M10.push1, sfx: 'chest' }, { at: M10.set, sfx: 'attach' },
      { at: M10.click, sfx: 'stamp' }, { at: M10.click + 0.05, sfx: 'ding' }, { at: M10.star, sfx: 'fanfare' },
      { at: M10.slate0, sfx: 'whoosh' }, { at: 7.1, sfx: 'tick' }, { at: M10.clap, sfx: 'crack' }, { at: M10.clap + 0.02, sfx: 'stamp' },
      { at: M10.ins, sfx: 'whoosh' }, { at: M10.ins + 0.3, sfx: 'bell' }, { at: M10.wink, sfx: 'crit' }, { at: M10.wink + 0.15, sfx: 'monkey' },
      { at: M10.insOut, sfx: 'whoosh' }, ...[0, 1, 2, 3, 4, 5].map(i => ({ at: M10.eyes + 0.3 + i * 0.3, sfx: 'tick' })), { at: 14.3, sfx: 'night' },
      { at: M10.on, sfx: 'shake' }, { at: M10.on + 0.35, sfx: 'ding' }, { at: M10.on + 0.9, sfx: 'jackpot' }, { at: M10.on + 1.0, sfx: 'fanfare' },
    ],
    camera(t) {
      const c = SK.track(t, [
        [0, { x: -24, y: -42, z: 0 }], [2.6, { x: 0, y: -44, z: 0 }], [5.8, { x: 6, y: -44, z: 0 }], [6.59, { x: -10, y: -36, z: 0 }], [6.6, { x: -12, y: -32, z: 1 }],
        [8.59, { x: -12, y: -32, z: 1 }], [8.6, { x: 0, y: -44, z: 0 }], [12.39, { x: 0, y: -44, z: 0 }], [12.4, { x: 0, y: -48, z: -1 }], [15.19, { x: 4, y: -50, z: -1 }],
        [15.2, { x: TV_X - 8, y: -48, z: 0 }], [19, { x: TV_X - 8, y: -50, z: 0 }],
      ]);
      return { x: c.x + shake(t, M10.clap, 0.2), y: c.y + shake(t, M10.on + 0.9, 0.25), z: c.z };
    },
    actors(t, w) {
      const A = { f: { x: STAR_X, feet: FLOOR, pose: 'idle', expr: null }, op: { x: -150, feet: FLOOR, pose: 'idle', flip: false }, cl: { x: 150, feet: FLOOR, pose: 'idle', flip: true, expr: null }, camX: -130, lamp: { x: 150, carried: true, on: 0 }, slate: null, eyes: 0, tv: 0 };
      // the operator pushes the camera in; the clapper carries the lamp in from the right
      const wp = SK.walk(t, M10.push0, M10.push1, -150, CAM_X - 18); A.op.x = wp.x; A.op.pose = wp.moving ? (fr(t, 4, 2) ? 'st_walk_a' : 'st_carry') : 'st_peek'; A.camX = A.op.x + 18; A.op.expr = 'determined';
      const wl = SK.walk(t, M10.lamp0, M10.lamp1, 150, LAMP_X + 14); A.cl.x = wl.x; A.cl.pose = wl.moving ? wl.pose : 'idle'; A.lamp.x = A.cl.x - 14;
      if (t >= M10.lamp1) { A.lamp = { x: LAMP_X, carried: false, on: 0 }; A.cl.x = LAMP_X + 14; A.cl.pose = t < M10.set + 0.3 ? 'crouch' : t < M10.click ? 'idle' : t < M10.click + 0.4 ? 'st_point' : 'idle'; A.cl.flip = true; }
      if (t >= M10.click) A.lamp.on = 1;
      // the star warms up, then poses
      if (t < M10.star) A.f.pose = fr(t, 1.6, 2) ? 'st_think' : 'idle';
      else if (t < M10.slate0) { A.f.pose = fr(t - M10.star, 2.5, 2) ? 'st_wave_a' : 'st_wave_b'; A.f.expr = 'giggle'; }
      else A.f.pose = 'idle';
      // the slate: the clapper walks into frame, snaps it shut, and walks back
      if (t >= M10.slate0 && t < M10.ins) {
        const w1 = SK.walk(t, M10.slate0, M10.slate1, LAMP_X + 14, -14); A.cl.x = w1.x; A.cl.pose = w1.moving ? w1.pose : 'st_offer'; A.cl.flip = true; A.cl.expr = 'screech';
        const open = t < M10.clap; A.slate = { x: A.cl.x - 17, y: FLOOR - 28, open: open ? (t > M10.clap - 0.5 ? 1 : 2) : 0 };
        if (!w1.moving) A.cl.flip = true;
      }
      if (t >= M10.ins) { A.cl.x = LAMP_X + 14; A.cl.pose = 'idle'; A.cl.flip = true; A.cl.expr = null; A.f.pose = 'idle'; A.f.expr = 'giggle'; }
      if (t >= M10.eyes) A.eyes = seg(t, M10.eyes + 0.2, M10.eyes + 2.2);
      if (t >= M10.on) { A.tv = seg(t, M10.on, M10.on + 1.2); if (A.tv >= 1) { const up = fr(t, 3, 2) === 0; A.f.pose = up ? 'st_cheer' : 'idle'; A.f.feet = FLOOR + (up ? -3 : 0); A.cl.pose = up ? 'idle' : 'st_cheer'; A.op.pose = up ? 'st_cheer' : 'idle'; A.op.expr = A.cl.expr = 'giggle'; } else { A.f.pose = 'st_gasp'; A.f.expr = 'screech'; A.op.pose = 'st_gasp'; } }
      return A;
    },
    draw(g, t, w, A, view) {
      const p = people(w), op = p.crew[0], cl = p.crew[1];
      signpost(g, t, w, view, A.tv >= 1);
      // the giant TV behind the set
      bigTV(g, t, TV_X, TV_TOP, A.tv, view);
      // the lamp on its stand, with its beam on the star
      lampStand(g, view, A.lamp.x, A.lamp.on, A.lamp.carried ? FLOOR - 12 : FLOOR);
      // the camera on its tripod
      tvCamera(g, t, A.camX, FLOOR, t >= M10.clap && t < M10.on + 1.2);
      actor(g, op, A.op.pose, A.op.x, A.op.feet, { expr: A.op.expr });
      actor(g, p.founder, A.f.pose, A.f.x, A.f.feet, { expr: A.f.expr });
      actor(g, cl, A.cl.pose, A.cl.x, A.cl.feet, { expr: A.cl.expr, flip: A.cl.flip });
      if (A.slate) clapper(g, A.slate.x, A.slate.y, A.slate.open);
      if (t >= M10.clap && t < M10.clap + 0.3) { SK.sparkle(g, A.slate ? A.slate.x + 4 : 0, FLOOR - 34, 3, '#ffffff'); SK.pop(g, -14, FLOOR - 50, '!', 1); }
      // the audience: eyes in the dark of the jungle, blinking on one pair at a time
      if (A.eyes > 0) OWLS.forEach(([x, y], i) => { const k = A.eyes * OWLS.length - i; if (k <= 0) return; owl(g, view, t, x, y + Math.round(SK.hop(Math.min(1, k * 2), 4)), fr(t + i * 0.7, 1.3, 7) === 0, i % 2 ? 1 : -1); });
      if (A.tv >= 1) sparkles(g, t, TV_X, TV_TOP + 20, M10.on + 1.2, M10.on + 3, 6, 40);
    },
    screen(g, t, w, A, view) {
      if (t >= M10.ins - 0.01 && t < M10.insOut + 0.3) monitorInsert(g, t, w, view, t < M10.insOut ? seg(t, M10.ins, M10.ins + 0.3) : 1 - seg(t, M10.insOut, M10.insOut + 0.3));
      flash(g, view, t, M10.click, 0.06); flash(g, view, t, M10.clap, 0.06, 'rgba(255,255,255,.55)');
      if (A.tv >= 1) confetti(g, view, t, M10.on + 1.0, 30);
    },
  });
  const OWLS = [[-104, -2], [96, -4], [-82, -2], [118, -2], [-126, -2], [74, -2]];
  /** A little owl (the audience): big yellow eyes, ear tufts, facing dir */
  function owl(g, view, t, x, y, blink, dir) {
    x = Math.round(x); y = Math.round(y); const B = ['#c8a070', '#9a6a3e', '#7a4a24', '#4a2a12'];
    rect(g, x - 4, y - 10, 9, 11, INK); rect(g, x - 3, y - 9, 7, 9, B[2]); rect(g, x - 2, y - 5, 5, 5, B[0]); rect(g, x - 3, y - 9, 7, 1, B[1]);
    for (let i = 0; i < 2; i++) rect(g, x - 2 + i * 2, y - 4 + i, 1, 1, B[1]);
    rect(g, x - 4, y - 11, 2, 2, INK); rect(g, x + 3, y - 11, 2, 2, INK); rect(g, x - 3, y - 10, 1, 1, B[2]); rect(g, x + 3, y - 10, 1, 1, B[2]);
    if (blink) { rect(g, x - 3, y - 7, 3, 1, B[3]); rect(g, x + 1, y - 7, 3, 1, B[3]); }
    else { for (const ex of [x - 3, x + 1]) { rect(g, ex, y - 8, 3, 3, '#fff08c'); rect(g, ex + 1 + (dir > 0 ? 1 : 0) - 1, y - 7, 1, 1, INK); } view.light(x - 3, y - 8, 1, 1, '#ffffff'); view.light(x + 1, y - 8, 1, 1, '#ffffff'); }
    rect(g, x, y - 5, 1, 2, '#ff9a2a'); rect(g, x - 2, y + 1, 1, 1, '#ff9a2a'); rect(g, x + 2, y + 1, 1, 1, '#ff9a2a');
  }
  /** The camera on a tripod, lens to the right; rec = the red light blinks */
  function tvCamera(g, t, x, y, rec) {
    x = Math.round(x); const M = R.metal, I = R.ink;
    line(g, x, y - 16, x - 8, y, INK); line(g, x, y - 16, x + 8, y, INK); line(g, x, y - 16, x, y, INK); line(g, x + 1, y - 15, x + 8, y - 1, M[3]);
    rect(g, x - 3, y - 18, 7, 3, INK);
    SK.box(g, x - 9, y - 29, 18, 11, I);  rect(g, x - 8, y - 28, 16, 1, I[0]); rect(g, x - 8, y - 24, 16, 2, '#2f8a35');
    SK.box(g, x + 9, y - 27, 6, 7, M); rect(g, x + 15, y - 28, 2, 9, INK); rect(g, x + 14, y - 26, 1, 3, '#9ce0ff');
    for (const [rx, ph] of [[-4, 0], [4, 1]]) { SK.disc(g, x + rx, y - 34, 5, INK); SK.disc(g, x + rx, y - 34, 4, I[1]); const s = fr(t, 6, 2) ^ ph; rect(g, x + rx - (s ? 3 : 0), y - 34 - (s ? 0 : 3), s ? 7 : 1, s ? 1 : 7, I[0]); rect(g, x + rx, y - 34, 1, 1, M[1]); }
    rect(g, x - 7, y - 27, 2, 2, rec && fr(t, 2, 2) ? '#ff5d5d' : '#5a1a1a');
  }
  /** A studio lamp on a stand, aimed left at the star; on = 1 lights it and casts a beam */
  function lampStand(g, view, x, on, feet) {
    x = Math.round(x); const M = R.metal;
    { line(g, x, feet, x, feet - 30, INK); line(g, x - 6, feet, x, feet - 6, INK); line(g, x + 6, feet, x, feet - 6, INK); rect(g, x, feet - 30, 1, 24, M[3]); }
    const hy = feet - 38; SK.box(g, x - 4, hy, 9, 8, R.ink); rect(g, x - 5, hy + 1, 1, 6, on ? '#fff6d6' : M[2]); rect(g, x - 1, hy - 2, 3, 2, INK);
    if (on) {
      view.light(x - 5, hy + 1, 1, 6, '#ffffff');
      for (let d = 1; d < 46; d += 2) { const cy = hy + 4 + d * 0.62, hh = 2 + d * 0.32; view.light(x - 5 - d, Math.round(cy - hh), 2, Math.round(hh * 2), 'rgba(255,246,200,.16)'); }
    }
  }
  /** A clapperboard; open: 0 shut, 1 a little, 2 wide */
  function clapper(g, x, y, open) {
    x = Math.round(x); y = Math.round(y);
    rect(g, x - 1, y - 1, 12, 9, INK); rect(g, x, y, 10, 7, '#24243a'); rect(g, x + 1, y + 2, 8, 1, CREAM); rect(g, x + 1, y + 4, 5, 1, CREAM); rect(g, x + 7, y + 4, 2, 1, '#ffd23a');
    const by = y - 3 - open * 2;
    for (let i = 0; i < 11; i++) { const yy = by + Math.round((i * open) / 5); rect(g, x - 1 + i, yy - 1, 1, 4, INK); rect(g, x - 1 + i, yy, 1, 2, Math.floor(i / 2) % 2 ? CREAM : INK); }
  }
  /** The giant TV behind the set: dark until on (0..1): a white line, a growing glow, colour bars, then the Canopy TV logo */
  function bigTV(g, t, cx, top, on, view) {
    const W = 72, H = 42, x0 = Math.round(cx - W / 2), y0 = top, sx = x0 + 5, sy = y0 + 5, sw = W - 14, sh = H - 10;
    // legs and the antenna
    for (const lx of [x0 + 8, x0 + W - 10]) { rect(g, lx - 1, y0 + H, 4, FLOOR - (y0 + H), INK); rect(g, lx, y0 + H, 2, FLOOR - (y0 + H), R.woodD[2]); }
    line(g, cx - 2, y0 - 1, cx - 12, y0 - 14, INK); line(g, cx + 2, y0 - 1, cx + 12, y0 - 14, INK); rect(g, cx - 13, y0 - 15, 2, 2, R.metal[2]); rect(g, cx + 11, y0 - 15, 2, 2, R.metal[2]);
    // the cabinet: wood, a dark screen, two knobs on the right
    SK.box(g, x0, y0, W, H, R.wood); rect(g, sx - 1, sy - 1, sw + 2, sh + 2, INK);
    rect(g, sx, sy, sw, sh, '#1c2430'); rect(g, sx + 2, sy + 2, 6, 1, '#3a4a5e'); rect(g, sx + 2, sy + 3, 2, 3, '#3a4a5e');
    for (const ky of [sy + 6, sy + 18]) { SK.disc(g, x0 + W - 5, ky, 2, INK); SK.disc(g, x0 + W - 5, ky, 1, R.metal[1]); }
    rect(g, x0 + W - 7, sy + 26, 5, 1, INK); rect(g, x0 + W - 7, sy + 28, 5, 1, INK);
    if (on <= 0) return;
    const k1 = seg(on, 0, 0.15), k2 = seg(on, 0.15, 0.35), k3 = seg(on, 0.35, 0.65);
    if (on < 0.35) { const lw = Math.round(sw * k1), lh = Math.max(1, Math.round(sh * k2)); rect(g, sx + Math.round((sw - lw) / 2), sy + Math.round((sh - lh) / 2), lw, lh, '#ffffff'); view.light(sx + Math.round((sw - lw) / 2), sy + Math.round((sh - lh) / 2), lw, lh, '#ffffff'); return; }
    if (on < 0.65) { const C = ['#ffffff', '#fff08c', '#9ce0ff', '#a8ec76', '#f08aa4', '#e86a50', '#5470d8']; const bw = Math.ceil(sw / C.length); C.forEach((c, i) => { rect(g, sx + i * bw, sy, Math.min(bw, sw - i * bw), sh, c); view.light(sx + i * bw, sy, Math.min(bw, sw - i * bw), sh - 8, c); }); rect(g, sx, sy + sh - 8, sw, 8, '#24243a'); if (k3 > 0.5) for (let x = sx; x < sx + sw; x += 3) view.light(x, sy + sh - 6, 1, 1, '#ffffff'); return; }
    const S = SK.STUDIO.tv; rect(g, sx, sy, sw, sh, S.bg);
    // a palm silhouette on the logo, the 2x letters, scanlines
    for (let x = sx + 2; x < sx + sw - 2; x += 4) { rect(g, x, sy + 2, 2, 1, S.trim); rect(g, x + 2, sy + sh - 3, 2, 1, S.trim); }
    const mx = sx + Math.round(sw / 2); SK.text(g, 'CANOPY', mx, sy + 6, S.fg, { align: 'center', s: 2, shadow: INK }); SK.text(g, 'TV', mx, sy + 19, '#ffd23a', { align: 'center', s: 2, shadow: INK });
    g.fillStyle = 'rgba(0,0,0,.12)'; for (let y = sy + 1; y < sy + sh; y += 2) g.fillRect(sx, y, sw, 1);
    view.light(sx + 3, sy + 4, 1, 1, '#ffffff');
  }
  /** The monitor insert: the TV cabinet slides up over the scene; on screen, the founder's close-up, REC and LIVE */
  function monitorInsert(g, t, w, view, k) {
    if (k <= 0) return;
    const p = people(w), sw = Math.min(view.w - 30, 112), sh = Math.round(sw * 0.62), W = sw + 22, H = sh + 14, x0 = Math.round((view.w - W) / 2), y1 = Math.round(view.h * 0.4 - H / 2), y0 = Math.round(lerp(view.h + 20, y1, ease.out(k)));
    g.fillStyle = 'rgba(26,15,20,' + (0.55 * k).toFixed(2) + ')'; g.fillRect(0, 0, view.w, view.h);
    // antenna and the wood cabinet
    line(g, x0 + W / 2 - 2, y0, x0 + W / 2 - 16, y0 - 16, INK); line(g, x0 + W / 2 + 2, y0, x0 + W / 2 + 16, y0 - 16, INK);
    SK.box(g, x0, y0, W, H, R.wood); rect(g, x0 + 2, y0 + H - 3, W - 4, 1, R.wood[3]);
    const sx = x0 + 5, sy = y0 + 6; rect(g, sx - 1, sy - 1, sw + 2, sh + 2, INK);
    g.save(); g.beginPath(); g.rect(sx, sy, sw, sh); g.clip();
    // the set behind the star: a green backdrop with stripes, the lamp's glow
    rect(g, sx, sy, sw, sh, '#2f8a35'); for (let x = sx + ((t * 6) | 0) % 8 - 8; x < sx + sw; x += 8) rect(g, x, sy, 3, sh, '#3f9a3a');
    SK.disc(g, sx + Math.round(sw * 0.7), sy + Math.round(sh * 0.35), Math.round(sh * 0.32), '#74c648');
    const s = sh >= 60 ? 3 : 2, wink = t >= M10.wink && t < M10.wink + 1.2;
    const pose = wink ? 'st_point' : fr(t, 2, 2) ? 'idle' : 'breathe';
    SK.actor(g, p.founder.look, pose, sx + Math.round(sw / 2), sy + 4 + 36 * s, { hat: p.founder.hat, s, expr: wink ? 'wink' : 'giggle' });
    if (wink && t < M10.wink + 0.5) SK.sparkle(g, sx + Math.round(sw / 2) + 9 * s, sy + 14 * s, 3, '#ffffff');
    // scanlines, REC, LIVE
    g.fillStyle = 'rgba(0,0,0,.14)'; for (let y = sy + (fr(t, 10, 2)); y < sy + sh; y += 2) g.fillRect(sx, y, sw, 1);
    if (fr(t, 2, 2)) { SK.disc(g, sx + 5, sy + 5, 2, '#ff5d5d'); } SK.text(g, 'REC', sx + 9, sy + 3, CREAM, { shadow: INK });
    rect(g, sx + sw - 20, sy + sh - 9, 18, 7, '#b8322a'); SK.text(g, 'LIVE', sx + sw - 18, sy + sh - 8, CREAM);
    g.restore();
    for (const ky of [sy + 8, sy + 20]) { SK.disc(g, x0 + W - 6, ky, 2, INK); SK.disc(g, x0 + W - 6, ky, 1, R.metal[1]); }
  }

  /* =====================================================================
     11. MEDIA: VINE RADIO. Rain. The founder climbs a palm with a radio mast; down below the crew tunes the set. Static... a signal!
         Then lightning hits the mast, the waves go everywhere, and the Vine Radio sign drops down on two vines.
     ===================================================================== */
  const M11 = { walk0: 0.6, walk1: 3.0, climb0: 3.1, climb1: 6.4, raise: 6.5, plant: 7.1, tune: 7.9, signal: 8.6, bolt: 11.6, fry: 11.7, sign0: 13.4, sign1: 14.0, end: 19.0 };
  const PALM_X = 38, PALM_H = 86, RADIO_X = -36, CLIMB_TOP = -50;
  const trunkX = y => PALM_X + Math.round(0.15 * Math.pow(Math.min(1, Math.max(0, -y / PALM_H)), 2) * 14);
  const MAST_X = trunkX(-PALM_H) + 1, MAST_BASE = -PALM_H - 2, MAST_H = 26, MAST_TOP = MAST_BASE - MAST_H;
  SK.scene({
    id: 'media-radio', title: 'On the Air', chapter: 11, duration: M11.end, sky: () => ({ wx: 2 }),
    prepare(w) { studioPrep(w, 'radio'); },
    beats: [
      { at: 0.3, who: 'narrator', text: 'Rainy season. Nobody goes out. Everybody stays in and listens.' },
      { at: 3.2, who: 'founder', text: 'Higher... higher... a little higher... nobody touch the coconuts.', expr: 'determined' },
      { at: 8.0, who: 'crew', text: 'Static... static... OOK! Boss, we have a signal!', expr: 'screech' },
      { at: 11.8, who: 'founder', text: 'WE\'RE ON THE AIR! Also slightly crispy.', expr: 'screech' },
      { at: 14.6, who: 'founder', text: 'Vine Radio: live from the top of a very wet palm tree.', expr: 'giggle' },
    ],
    cast: w => castOf(w, { crew: Object.assign({ name: 'The engineer', bg: '#2c62a8' }, people(w).crew[0]) }),
    cues: [
      ...[0, 1, 2, 3].map(i => ({ at: M11.walk0 + 0.2 + i * 0.6, sfx: 'tick' })),
      ...[0, 1, 2, 3, 4, 5].map(i => ({ at: M11.climb0 + i * 0.55 + 0.3, sfx: 'page' })), { at: M11.raise, sfx: 'whoosh' }, { at: M11.plant, sfx: 'hammer' }, { at: M11.plant + 0.35, sfx: 'hammer' }, { at: M11.plant + 0.5, sfx: 'attach' },
      { at: M11.tune, sfx: 'shake' }, { at: 8.2, sfx: 'shake' }, { at: M11.signal, sfx: 'ding' }, { at: M11.signal + 0.2, sfx: 'levelup' },
      ...[0, 1, 2, 3].map(i => ({ at: M11.signal + 0.6 + i * 0.5, sfx: 'gem', arg: [4, 7, 5, 9][i] })),
      { at: M11.bolt, sfx: 'crack' }, { at: M11.bolt + 0.02, sfx: 'stamp' }, { at: M11.bolt + 0.15, sfx: 'shake' }, { at: 12.0, sfx: 'monkey' },
      { at: M11.sign0, sfx: 'whoosh' }, { at: M11.sign1, sfx: 'chest' }, { at: M11.sign1 + 0.1, sfx: 'jackpot' }, { at: 15.0, sfx: 'fanfare' },
    ],
    camera(t) {
      const c = SK.track(t, [
        [0, { x: -24, y: -36, z: 0 }], [3.0, { x: 10, y: -40, z: 0 }], [6.4, { x: 24, y: -74, z: 0 }], [7.79, { x: 24, y: -74, z: 0 }], [7.8, { x: 2, y: -62, z: -1 }],
        [11.89, { x: 2, y: -62, z: -1 }], [11.9, { x: 26, y: -80, z: 1 }], [13.39, { x: 26, y: -80, z: 1 }], [13.4, { x: 4, y: -60, z: -1 }], [19, { x: 4, y: -62, z: -1 }],
      ]);
      return { x: c.x + shake(t, M11.bolt, 0.5, 2), y: c.y + shake(t, M11.bolt + 0.03, 0.4) + shake(t, M11.sign1, 0.15), z: c.z };
    },
    actors(t, w) {
      const A = { f: { x: -110, feet: FLOOR, pose: 'idle', expr: null, flip: false }, c: { pose: 'idle', expr: null }, mast: null, wire: false, waves: [], static: false, bolt: false, smoke: 0, sign: null };
      const F = A.f;
      // walk to the palm with the mast under an arm
      if (t < M11.climb0) { const wk = SK.walk(t, M11.walk0, M11.walk1, -110, PALM_X - 10); F.x = wk.x; F.pose = wk.moving ? wk.pose : 'idle'; F.feet = FLOOR + wk.bob; A.mast = { kind: 'carry' }; F.expr = 'determined'; }
      // climb: six pulls up the trunk
      if (t >= M11.climb0 && t < M11.raise) {
        const k = seg(t, M11.climb0, M11.climb1), n = 6, i = Math.min(n - 1, Math.floor(k * n)), ph = k * n - i, step = (FLOOR - CLIMB_TOP) / n;
        F.feet = Math.round(FLOOR - step * (i + ease.inOut(seg(ph, 0.4, 1)))); F.x = trunkX(F.feet - 20) - 9; F.pose = ph < 0.4 ? 'st_hold' : 'crouch'; F.expr = 'determined'; A.mast = { kind: 'back' };
        if (k >= 1) { F.pose = 'st_hold'; }
      }
      if (t >= M11.raise) { F.feet = CLIMB_TOP; F.x = trunkX(CLIMB_TOP - 20) - 9; F.pose = 'st_hold'; F.expr = 'determined'; const k = seg(t, M11.raise, M11.plant); A.mast = { kind: 'up', k }; if (t >= M11.plant) A.wire = true; }
      if (t >= M11.plant && t < M11.bolt) F.pose = t < M11.plant + 0.5 ? (fr(t, 6, 2) ? 'st_hold' : 'st_crack_a') : fr(t, 1.2, 2) ? 'st_hold' : 'st_wave_a';
      // the engineer tunes in: static, then a signal and the waves
      if (t >= M11.tune && t < M11.signal) { A.c.pose = fr(t, 5, 2) ? 'st_point' : 'st_crack_a'; A.static = true; A.c.expr = 'determined'; }
      if (t >= M11.signal && t < M11.bolt) { A.c.pose = fr(t, 2, 2) ? 'st_cheer' : 'idle'; A.c.expr = 'giggle'; }
      const wave = (s0, life, speed, col) => { const a = t - s0; if (a >= 0 && a <= life) A.waves.push({ r: Math.round(4 + a * speed), col }); };
      for (let i = 0; i < 6; i++) wave(M11.signal + i * 0.5, 1.4, 36, '#fff6d6');
      for (let i = 0; i < 22; i++) wave(M11.bolt + i * 0.33, 1.3, 56, NOTE_COLS[i % 5]);
      // lightning!
      if (t >= M11.bolt && t < M11.bolt + 0.35) A.bolt = fr(t - M11.bolt, 14, 2) === 0;
      if (t >= M11.fry && t < M11.sign0) { F.pose = fr(t, 10, 2) ? 'st_gasp' : 'st_hold'; F.expr = 'screech'; A.smoke = seg(t, M11.fry, M11.fry + 1.6); A.c.pose = 'st_gasp'; A.c.expr = 'screech'; }
      // the sign drops on two vines; the founder whoops from the top of the palm
      if (t >= M11.sign0) {
        const k = seg(t, M11.sign0, M11.sign1); A.sign = { y: Math.round(lerp(-80, -44, ease.in(k))), sw: k >= 1 ? Math.round(SK.wobble(t - M11.sign1, 3, 7, 1.6)) : 0, k };
        const up = fr(t, 3, 2) === 0; F.pose = up ? 'st_cheer' : 'st_hold'; F.expr = 'giggle'; A.c.pose = up ? 'idle' : 'st_cheer'; A.c.expr = 'giggle';
      }
      return A;
    },
    draw(g, t, w, A, view) {
      const p = people(w), F = A.f;
      signpost(g, t, w, view, A.sign && A.sign.k >= 1);
      // the palm
      SK.prop.palm(g, t, PALM_X, PALM_H, 0.15, 3);
      // the radio set on a crate, a leaf umbrella, the engineer behind
      const top = SK.desk(g, RADIO_X, FLOOR, 'crate', { label: false });
      SK.actor(g, p.crew[0].look, A.c.pose, RADIO_X, top + 4, { hat: p.crew[0].hat, expr: A.c.expr || undefined });
      SK.desk(g, RADIO_X, FLOOR, 'crate', { label: false });
      radioSet(g, t, view, RADIO_X, top, A.static, t >= M11.signal);
      line(g, RADIO_X - 15, FLOOR - 2, RADIO_X - 15, top - 34, R.woodD[3]); leaf(g, RADIO_X - 15, top - 34);
      // the wire up to the mast
      if (A.wire) rope(g, RADIO_X + 9, top - 10, MAST_X, MAST_BASE + 2, 10, INK);
      // the mast
      if (A.mast && A.mast.kind === 'up') { const y0 = Math.round(lerp(F.feet - 36, MAST_BASE, ease.out(A.mast.k))); mast(g, t, view, MAST_X, y0, MAST_H, t >= M11.plant); }
      // the founder on the trunk (with the mast on their back while climbing)
      if (A.mast && A.mast.kind === 'back') mast(g, t, view, F.x - 8, F.feet - 6, 30, false, true);
      const zap = t >= M11.bolt && t < M11.bolt + 0.6 && fr(t - M11.bolt, 12, 2) === 0;
      actor(g, p.founder, zap ? 'st_gasp' : F.pose, F.x, F.feet, { expr: F.expr, noShadow: F.feet < FLOOR - 2, sil: zap ? '#1a1420' : undefined, eyes: zap });
      if (F.feet < FLOOR - 30) { g.save(); g.beginPath(); g.rect(-400, -400, 800, 400 - PALM_H - 2); g.clip(); SK.prop.palm(g, t, PALM_X, PALM_H, 0.15, 3); g.restore(); }
      if (A.mast && A.mast.kind === 'carry') { rect(g, F.x - 16, F.feet - 21, 32, 3, INK); rect(g, F.x - 15, F.feet - 20, 30, 1, R.metal[2]); rect(g, F.x + 13, F.feet - 22, 2, 5, INK); }
      // broadcast waves from the mast top
      for (const wv of A.waves) waves(g, MAST_X, MAST_TOP, wv.r, wv.col, 0.55);
      // a charred, smoking founder
      if (A.smoke > 0 && A.smoke < 1) { for (let i = 0; i < 3; i++) SK.puff(g, F.x - 6 + i * 6, F.feet - 36 - i * 2, (A.smoke + i * 0.2) % 1, { n: 4, spread: 8, size: 3, col: '#8a8a96' }); sparkles(g, t, F.x, F.feet - 22, M11.fry, M11.fry + 0.9, 4, 16, '#9ce0ff'); }
      // the sign on two vines
      if (A.sign) {
        const cx = MAST_X + 2 + A.sign.sw, y = A.sign.y, S = SK.STUDIO.radio;
        const mq = marquee(g, t, cx, y, ['VINE', 'RADIO'], S, A.sign.k >= 1 ? 1 : 0, view, { rail: '#1f6a2a', railHi: '#74c648' });
        for (const vx of [mq.x0 + 6, mq.x0 + mq.w - 7]) { rope(g, vx - A.sign.sw, -PALM_H + 1, vx, y, 0, '#1f6a2a', '#74c648'); }
        if (A.sign.k >= 1) sparkles(g, t, cx, y + 16, M11.sign1, M11.sign1 + 1.4, 5, 32);
      }
    },
    screen(g, t, w, A, view) {
      if (A.bolt) { const x1 = MAST_X + view.ox, y1 = MAST_TOP + view.oy; let px = x1 + 22, py = -2; for (let i = 1; i <= 7; i++) { const nx = i === 7 ? x1 : lerp(x1 + 22, x1, i / 7) + Math.round((hash(i, 7) - 0.5) * 14), ny = i === 7 ? y1 : lerp(-2, y1, i / 7); for (const d of [-1, 1]) line(g, px + d, py, nx + d, ny, '#fff08c'); line(g, px, py, nx, ny, '#ffffff'); px = nx; py = ny; } }
      flash(g, view, t, M11.bolt, 0.08, 'rgba(255,255,255,.75)'); flash(g, view, t, M11.bolt + 0.16, 0.05, 'rgba(255,255,255,.5)'); flash(g, view, t, M11.sign1, 0.06);
    },
  });
  /** A tall radio mast with crossbars; its tip blinks red once it is live. back = carried on the back (diagonal) */
  function mast(g, t, view, x, base, h, live, back) {
    x = Math.round(x); base = Math.round(base);
    if (back) { line(g, x, base, x + 6, base - h, INK); line(g, x + 1, base, x + 7, base - h, R.metal[2]); return; }
    rect(g, x - 1, base - h, 3, h, INK); rect(g, x, base - h, 1, h, R.metal[1]);
    for (let y = base - h + 6, i = 0; y < base - 2; y += 8, i++) { const hw = 2 + i; rect(g, x - hw, y, hw * 2 + 1, 1, INK); line(g, x - hw, y, x, y - 4, R.metal[3]); line(g, x + hw, y, x, y - 4, R.metal[3]); }
    const on = live && fr(t, 2, 2) === 0; rect(g, x - 1, base - h - 3, 3, 3, INK); rect(g, x, base - h - 2, 1, 1, on ? '#ff5d5d' : '#7a1a1a'); if (on) view.light(x, base - h - 2, 1, 1, '#ff8a8a');
  }
  /** The wooden radio on the crate: a grille, a dial and two knobs; static squiggles or little notes out of it */
  function radioSet(g, t, view, x, top, stat, live) {
    const x0 = x - 10, y0 = top - 13; SK.box(g, x0, y0, 20, 13, R.woodL);
    rect(g, x0 + 2, y0 + 2, 9, 9, R.woodD[3]); for (let y = y0 + 3; y < y0 + 11; y += 2) rect(g, x0 + 2, y, 9, 1, R.woodD[1]);
    rect(g, x0 + 13, y0 + 2, 5, 4, '#fff08c'); rect(g, x0 + 15 + (live ? 1 : fr(t, 6, 3) - 1), y0 + 2, 1, 4, '#b8322a'); if (live) view.light(x0 + 13, y0 + 2, 5, 4, '#fff08c');
    SK.disc(g, x0 + 14, y0 + 9, 1, INK); SK.disc(g, x0 + 17, y0 + 9, 1, INK);
    rect(g, x0 + 4, y0 - 4, 1, 4, INK); rect(g, x0 + 4, y0 - 5, 1, 1, R.metal[1]);
    if (stat) for (let i = 0; i < 3; i++) { let px = x0 + 6, py = y0 - 3 - i * 5; for (let s = 0; s < 4; s++) { const nx = px + 3, ny = py - 1 + Math.round((hash(fr(t, 12) + s + i * 7, 3) - 0.5) * 6); line(g, px, py, nx, ny, '#fff6d6'); px = nx; py = ny; } }
    if (live && !stat) { const k = ((t * 1.2) % 1); note(g, x0 + 18 + Math.round(k * 8), y0 - 2 - Math.round(k * 16), NOTE_COLS[fr(t, 1.2) % 5], fr(t, 1.2) % 2); }
  }
  /** A big leaf as an umbrella, on a stick */
  function leaf(g, x, y) {
    for (let i = 0; i < 9; i++) { const w = Math.round(Math.sin((i / 8) * Math.PI) * 9) + 2; rect(g, x - w - 1, y - 6 + i, w * 2 + 3, 1, R.leaf[4]); rect(g, x - w, y - 6 + i, w * 2 + 1, 1, i < 3 ? R.leaf[1] : R.leaf[2]); }
    rect(g, x, y - 5, 1, 8, R.leaf[3]); for (let i = 0; i < 4; i++) { rect(g, x - 2 - i * 2, y - 3 + i, 2, 1, R.leaf[3]); rect(g, x + 1 + i * 2, y - 3 + i, 2, 1, R.leaf[3]); }
  }

  /* =====================================================================
     12. MEDIA: MONKEY BUSINESS TROUPE. A stage, red curtains, an audience. The MC (the founder) asks for a suggestion: "a typewriter!"
         The troupe becomes one: a typist, a machine and a carriage that dings back. The house roars, bananas fly, and the marquee flies in.
     ===================================================================== */
  const M12 = { intro: 0.3, roll: 2.4, open0: 3.4, open1: 4.6, heckle: 7.4, huddle: 8.2, act: 8.8, actEnd: 12.6, laugh: 12.6, fly0: 13.6, fly1: 14.2, bow: 14.6, end: 19.0 };
  const STAGE_W = 54, PROS_TOP = -66, MQ_FINAL = -112;
  const AUD = [[-78, 0], [-46, 2], [-14, 1], [16, 3], [48, 1], [80, 0]];
  SK.scene({
    id: 'media-troupe', title: 'Curtain Up', chapter: 12, duration: M12.end, sky: w => ({ wx: Math.min(1, w.wx | 0) }),
    prepare(w) { studioPrep(w, 'sketch'); },
    beats: [
      { at: 0.3, who: 'founder', text: 'Ladies, gentlemen and assorted primates... the Monkey Business Troupe!', expr: 'giggle' },
      { at: 4.8, who: 'narrator', text: 'They had rehearsed nothing. That was the whole idea.' },
      { at: 7.4, who: 'fan', text: 'Do a TYPEWRITER!', expr: 'screech' },
      { at: 9.0, who: 'founder', text: 'A typewriter made of monkeys. Which is... our entire business.', expr: 'giggle' },
      { at: 12.8, who: 'narrator', text: 'The house went bananas. Literally. Bananas everywhere.' },
      { at: 14.6, who: 'founder', text: 'Monkey Business! No script, no plan, no refunds.', expr: 'giggle' },
    ],
    cast: w => castOf(w, { fan: { name: 'Somebody in row 3', look: 'v19', hat: 0, expr: 'screech', bg: '#4e2280' } }),
    cues: [
      { at: 0.4, sfx: 'fanfare' }, ...beatCues(M12.roll, M12.open0, 0.08), { at: M12.open0, sfx: 'whoosh' }, { at: M12.open0 + 0.05, sfx: 'stamp' }, { at: M12.open1, sfx: 'jackpot' },
      { at: M12.heckle, sfx: 'monkey' }, { at: M12.huddle, sfx: 'whoosh' },
      ...clacks(M12.act + 0.2, M12.act + 1.8, 5), { at: M12.act + 1.9, sfx: 'bell' }, { at: M12.act + 2.0, sfx: 'whoosh' },
      ...clacks(M12.act + 2.3, M12.act + 3.4, 6), { at: M12.act + 3.5, sfx: 'bell' }, { at: M12.act + 3.6, sfx: 'whoosh' },
      { at: M12.laugh, sfx: 'monkey' }, ...[0, 1, 2, 3].map(i => ({ at: M12.laugh + 0.5 + i * 0.18, sfx: 'coin' })), { at: M12.laugh + 0.2, sfx: 'triumph' },
      { at: M12.fly0, sfx: 'whoosh' }, { at: M12.fly1, sfx: 'stamp' }, { at: M12.fly1 + 0.1, sfx: 'jackpot' }, { at: M12.bow, sfx: 'fanfare' }, ...beatCues(15.2, 18.6, 0.6, 'chest'),
    ],
    camera(t) {
      const c = SK.track(t, [
        [0, { x: -44, y: -32, z: 1 }], [2.39, { x: -40, y: -32, z: 1 }], [2.4, { x: 0, y: -40, z: 0 }], [7.39, { x: 0, y: -40, z: 0 }], [7.4, { x: 14, y: -24, z: 1 }],
        [8.79, { x: 14, y: -24, z: 1 }], [8.8, { x: 0, y: -32, z: 1 }], [12.59, { x: 0, y: -32, z: 1 }], [12.6, { x: 0, y: -40, z: 0 }],
        [13.59, { x: 0, y: -44, z: 0 }], [13.6, { x: 0, y: -54, z: -1 }], [19, { x: 0, y: -56, z: -1 }],
      ]);
      return { x: c.x + shake(t, M12.fly1, 0.2), y: c.y + shake(t, M12.open0, 0.15), z: c.z };
    },
    actors(t, w) {
      const A = { f: { x: -76, feet: FLOOR, pose: 'st_wave_a', expr: 'giggle', flip: false }, tr: [{ x: -26, feet: 0, pose: 'st_cheer', expr: 'giggle', flip: false }, { x: 0, feet: 0, pose: 'st_cheer', expr: 'giggle', flip: false }, { x: 26, feet: 0, pose: 'st_cheer', expr: 'giggle', flip: true }],
        open: seg(t, M12.open0, M12.open1), aud: AUD.map(() => 0), pops: [], letters: [], bananas: [], mq: null, after: false };
      const F = A.f, [a, b, c] = A.tr;
      if (t < M12.roll) F.pose = fr(t, 2.5, 2) ? 'st_wave_a' : 'st_wave_b';
      else if (t < M12.open1) { F.pose = 'st_point'; F.expr = 'determined'; }
      else if (t < M12.act) { F.pose = 'idle'; F.expr = 'giggle'; }
      // a frozen "ta-da" when the curtain opens, then they look at each other
      if (t >= M12.open1 && t < M12.heckle) { const k = fr(t - M12.open1, 1.2, 3); a.pose = k === 1 ? 'st_shrug' : 'st_cheer'; b.pose = k === 2 ? 'st_shrug' : 'st_cheer'; c.pose = k === 0 ? 'st_cheer' : 'st_shrug'; }
      // the heckler
      if (t >= M12.heckle && t < M12.act) { A.aud[3] = Math.round(SK.hop(seg(t, M12.heckle, M12.heckle + 0.4), 5)); A.pops.push({ kind: '!', x: AUD[3][0], y: FLOOR - 16 + A.aud[3], k: seg(t, M12.heckle, M12.heckle + 0.2) }); a.pose = b.pose = c.pose = 'st_think'; }
      // the act: a typist (a), a machine (b, crouched) and a carriage (c) that creeps left with each key, then DINGs back
      if (t >= M12.huddle && t < M12.actEnd) {
        const k = seg(t, M12.huddle, M12.act);
        a.x = Math.round(lerp(-26, -30, k)); b.x = Math.round(lerp(0, -6, k));
        b.pose = 'crouch'; b.expr = 'determined'; b.flip = false;
        const r = t - M12.act;
        if (r >= 0) {
          const key = fr(r, 5); a.pose = key % 2 ? 'st_type_a' : 'st_type_b'; a.expr = 'determined';
          const cyc = r < 2.0 ? r : r - 2.0, keys = Math.floor(cyc * (r < 2.0 ? 5 : 6)), ret = r < 2.0 ? r > 1.9 : r > 3.5;
          c.x = ret ? 30 : Math.max(10, 30 - keys * 2); c.pose = ret ? 'impact' : 'st_hold'; c.expr = ret ? 'screech' : 'giggle'; c.flip = true;
          if (r > 1.9 && r < 2.3) { c.x = Math.round(lerp(10, 30, seg(r, 1.9, 2.05))); c.pose = r < 2.05 ? 'air' : 'impact'; A.ding = true; }
          if (r > 3.5 && r < 3.9) { c.x = Math.round(lerp(14, 30, seg(r, 3.5, 3.65))); c.pose = r < 3.65 ? 'air' : 'impact'; A.ding = true; }
          if (r > 3.9) { c.x = 30; c.pose = 'st_hold'; }
          A.paper = Math.min(12, Math.floor(((r < 2.0 ? r : r - 2.0) * 5)));
          for (let i = 0; i < 3; i++) { const lk = ((r * 1.4 + i / 3) % 1), ch = 'OOKBANANA'[(Math.floor(r * 1.4 + i / 3) + i) % 9]; A.letters.push({ ch, x: Math.round(b.x + 2 + lk * (i % 2 ? 16 : -12)), y: Math.round(-44 - lk * 18), k: lk }); }
          F.pose = r > 1.2 && r < 3 ? (fr(r, 3, 2) ? 'st_cheer' : 'idle') : 'idle'; F.expr = 'giggle'; F.feet = FLOOR + (r > 1.2 && r < 3 && fr(r, 3, 2) ? -2 : 0);
        } else { a.pose = 'st_crack_a'; c.pose = 'idle'; c.x = Math.round(lerp(26, 30, k)); }
      }
      // the house laughs; bananas fly onto the stage
      if (t >= M12.laugh) {
        A.aud = AUD.map((q, i) => (t < M12.fly0 + 2 ? (fr(t + i * 0.13, 5, 2) ? -2 : 0) : 0));
        a.x = -26; b.x = 0; c.x = 26; a.pose = b.pose = c.pose = 'st_cheer'; b.expr = 'giggle'; c.expr = 'giggle'; c.flip = true;
        [[1, -20], [2, 8], [4, 18], [0, -36]].forEach(([ai, tx], i) => { const s0 = M12.laugh + 0.2 + i * 0.18, k = seg(t, s0, s0 + 0.5); if (t < s0) return; A.bananas.push({ x: Math.round(lerp(AUD[ai][0], tx, k)), y: Math.round(lerp(FLOOR + 6, -4, k) + SK.hop(k, 30)) }); });
        if (t < M12.fly0) A.pops.push({ kind: 'heart', x: 0, y: -44, k: 1 });
      }
      // the marquee flies in; the troupe bows, one after another
      if (t >= M12.fly0) { const k = seg(t, M12.fly0, M12.fly1); A.mq = { y: Math.round(lerp(-190, MQ_FINAL, ease.back(k))), on: k >= 1 ? 1 : 0 }; }
      if (t >= M12.fly1) A.after = true;
      if (t >= M12.bow) { A.tr.forEach((q, i) => { const r = (t - M12.bow - i * 0.25) % 2.4; q.pose = r >= 0 && r < 0.7 ? 'crouch' : 'st_cheer'; q.expr = 'giggle'; }); const wk = SK.walk(t, M12.bow, M12.bow + 0.6, -76, -62); F.x = wk.x; F.pose = wk.moving ? wk.pose : fr(t, 2, 2) ? 'st_wave_a' : 'st_wave_b'; F.expr = 'giggle'; F.feet = FLOOR; }
      return A;
    },
    draw(g, t, w, A, view) {
      const p = people(w), S = SK.STUDIO.sketch;
      signpost(g, t, w, view, A.after);
      // the flying marquee, on its two cables
      if (A.mq) { const mq = marquee(g, t, 0, A.mq.y, ['MONKEY', 'BUSINESS'], S, A.mq.on, view); for (const x of [mq.x0 + 8, mq.x0 + mq.w - 9]) line(g, x, A.mq.y - 1, x, A.mq.y - 140, '#2a2a34'); }
      // the stage: posts, a valance with gold fringe, the boards
      for (const s of [-1, 1]) { const x = s * (STAGE_W + 2); SK.box(g, x - 3, PROS_TOP, 6, -PROS_TOP + 1, R.woodD); rect(g, x - 2, PROS_TOP + 1, 1, -PROS_TOP - 2, R.woodD[1]); }
      SK.box(g, -STAGE_W - 5, PROS_TOP - 8, STAGE_W * 2 + 10, 8, R.red); for (let x = -STAGE_W - 4; x < STAGE_W + 4; x += 3) rect(g, x, PROS_TOP, 2, 2, '#ffd23a');
      rect(g, -STAGE_W - 1, PROS_TOP + 2, STAGE_W * 2 + 2, -PROS_TOP - 2, '#2a0e10'); rect(g, -STAGE_W - 1, -6, STAGE_W * 2 + 2, 6, '#3a1418');
      // the troupe (behind the curtains while closed)
      A.tr.forEach((q, i) => actor(g, p.crew[i], q.pose, q.x, q.feet, { expr: q.expr, flip: q.flip, ground: q.feet }));
      if (A.paper != null) SK.page(g, A.tr[1].x - 5, A.tr[1].feet - 31 - A.paper, 11, 6 + A.paper, Math.floor(A.paper / 2) + 1);
      for (const L of A.letters) SK.text(g, L.ch, L.x, L.y, L.k < 0.7 ? CREAM : '#c9b88a', { shadow: INK });
      if (A.ding) { SK.pop(g, 32, -44, '!', 1); SK.sparkle(g, 40, -34, 2, '#ffffff'); }
      curtains(g, t, A.open);
      // the boards (in front of the feet line), footlights
      SK.box(g, -STAGE_W - 2, 0, STAGE_W * 2 + 4, FLOOR - 1, R.wood); for (let x = -STAGE_W + 6; x < STAGE_W; x += 12) { rect(g, x, 3, 1, FLOOR - 4, R.wood[3]); }
      for (let x = -STAGE_W + 4; x < STAGE_W; x += 10) { rect(g, x - 1, -2, 4, 2, INK); rect(g, x, -2, 2, 1, A.open > 0 ? '#fff08c' : '#7a5a1a'); if (A.open > 0) view.light(x, -2, 2, 1, '#fffbe0'); }
      // the MC, bananas, pops
      actor(g, p.founder, A.f.pose, A.f.x, A.f.feet, { expr: A.f.expr });
      for (const bn of A.bananas) SK.banana(g, bn.x, bn.y);
      for (const q of A.pops) SK.pop(g, q.x, q.y, q.kind, q.k);
      if (t >= M12.open0 && t < M12.open1 + 1) sparkles(g, t, 0, -30, M12.open1, M12.open1 + 1, 6, 34);
      if (t >= M12.fly1) sparkles(g, t, 0, MQ_FINAL + 18, M12.fly1, M12.fly1 + 1.6, 6, 44);
    },
    front(g, t, w, A, view) {
      // the audience: dark heads along the front of the stage
      AUD.forEach(([x, dy], i) => { const feet = FLOOR + 30 + dy + A.aud[i]; SK.actor(g, FALLBACK[i % FALLBACK.length], 'idle', x, feet, { sil: '#140c18', eyes: true, clip: [x - 20, -999, x + 20, FLOOR + 30 + dy - 16] }); });
    },
    screen(g, t, w, A, view) { flash(g, view, t, M12.open0, 0.06); flash(g, view, t, M12.fly1, 0.1); if (t >= M12.fly1) beams(g, view, t, M12.fly1, 0.8); },
  });
  /** Red velvet curtains: open 0 closed .. 1 gathered at the sides */
  function curtains(g, t, open) {
    const Rd = R.red, hw = STAGE_W, wEach = Math.round(hw * (1 - open * 0.82)), top = PROS_TOP + 2, bot = 0;
    for (const s of [-1, 1]) {
      const x0 = s < 0 ? -hw : hw - wEach;
      for (let y = top; y < bot; y++) {
        const k = (y - top) / (bot - top), pinch = open > 0 ? Math.round(Math.sin(k * Math.PI) * open * 4) : 0, xa = s < 0 ? x0 : x0 + pinch, ww = wEach - pinch;
        rect(g, xa, y, ww, 1, Rd[2]);
        for (let x = 3; x < ww; x += 5) rect(g, s < 0 ? xa + x : xa + ww - 1 - x, y, 1, 1, Rd[3]);
        for (let x = 1; x < ww; x += 5) rect(g, s < 0 ? xa + x : xa + ww - 1 - x, y, 1, 1, Rd[1]);
        rect(g, s < 0 ? xa + ww - 1 : xa, y, 1, 1, Rd[4]);
      }
      if (open > 0.3) { const tx = s < 0 ? -hw + 1 : hw - 6; rect(g, tx, Math.round(lerp(top, bot, 0.55)), 5, 2, '#ffd23a'); }
    }
  }

  /* =====================================================================
     13. FIRST MUSE: a red carpet, a famous visitor (the seated muse: its own costume, its own portrait from muse-art.js). The floor is starstruck,
         somebody faints, the muse signs our first book, and its portrait goes up on the wall.
     ===================================================================== */
  const MUSE = {
    seuss: ['Dr. Zoos', 'One ape, two ape, red ape, you ape! I like this place. I will stay.'],
    shakes: ['William Shakespaw', 'To type, or not to type? Type, obviously. I shall stay.'],
    poe: ['Edgar Allan Chimp', 'Quoth the raven: "Keep typing." I shall stay. Forevermore.'],
    dick: ['Emily Dickinsimian', 'Because I could not stop for lunch - I stayed. And so I shall.'],
    chimpens: ['Charles Chimpens', 'It is the best of offices, it is the worst of chairs. I will stay.'],
    hemi: ['Ernest Hemingwape', 'The monkeys typed. It was good. It was true. I will stay.'],
    christie: ['Agatha Chrisbanana', 'Somebody here took my banana. Until I know who, I am staying.'],
    homer: ['Homape', 'Sing, O muse, of the typing apes! Ah. I am the muse. I will stay.'],
    woolf: ['Virginia Woolfkin', 'A muse must have a room of her own. This one will do nicely.'],
    potter: ['Beatrix Potape', 'What a tidy little burrow. I shall stay, if the garden is good.'],
    austen: ['Jane Apesten', 'It is a truth universally acknowledged: a good typist needs a muse.'],
    fitz: ['F. Scott Fitzgerape', 'So we type on, keys against the current. I will stay. Green light!'],
    tolken: ['J.R.R. Tolkong', 'One desk to rule them all. I shall stay. Is there second breakfast?'],
    carroll: ['Lewis Carrolangutan', 'Curiouser and curiouser! A room full of typing apes. I will stay.'],
    twain: ['Mark Twainana', 'Reports of your genius were greatly underestimated. I will stay.'],
  };
  const PORTRAIT_AT = [[-96, -64], [-104, -66], [-46, -86], [-54, -92], [-46, -76], [-46, -96]];   // the kit's first portrait anchor per stage (camera only; drawing uses view.anchors)
  const M13 = { kick: 1.0, roll1: 2.6, in0: 2.6, in1: 6.0, gasp: 4.0, faint: 5.0, speak: 6.4, sign0: 9.8, walk1: 10.6, scrib: 11.0, snap: 12.6, ins: 12.7, insOut: 15.4, hang0: 15.8, hang1: 16.4, end: 19.5 };
  const FG = FLOOR, MUSE_X = 30;
  const museOf = w => w._muse || 'shakes';
  SK.scene({
    id: 'first-muse', title: 'A Famous Visitor', chapter: 13, duration: M13.end, sky: w => ({ wx: Math.min(1, w.wx | 0) }),
    prepare(w) {
      const ms = (w.muses || []).filter(id => MUSE[id]); w._muse = ms[0] || 'shakes'; w._slot = Math.max(0, (w.muses || []).indexOf(w._muse)); w.muses = (w.muses || []).slice(0, w._slot);
      SK.museImage(w._muse);
      const [name, quote] = MUSE[w._muse];
      this.beats[1].text = 'Is that... THE ' + name + '?! Everybody act natural!';
      this.beats[2].text = quote;
    },
    beats: [
      { at: 0.3, who: 'narrator', text: 'Word got around the jungle. Somebody FAMOUS wanted a tour of the floor.' },
      { at: 4.0, who: 'founder', text: 'Is that... THE muse?! Everybody act natural!', expr: 'screech' },
      { at: 6.4, who: 'muse', text: '...' },
      { at: 9.8, who: 'founder', text: 'Could you sign our first book? Just there, next to the banana stain.', expr: 'giggle' },
      { at: 12.8, who: 'narrator', text: 'We had a portrait painted on the spot. Well, quite quickly.' },
      { at: 16.4, who: 'founder', text: 'Our first muse. We may never wash this paw again.', expr: 'giggle' },
    ],
    cast: w => { const id = museOf(w); return castOf(w, { muse: { name: MUSE[id][0], bg: '#5a3a06', draw: g => museFace(g, id) } }); },
    cues: [
      { at: 0.4, sfx: 'tick' }, { at: M13.kick, sfx: 'whoosh' }, ...[0, 1, 2, 3].map(i => ({ at: M13.kick + 0.2 + i * 0.35, sfx: 'tick' })), { at: M13.roll1, sfx: 'drum' },
      { at: M13.in0, sfx: 'fanfare' }, ...[0, 1, 2, 3, 4, 5, 6].map(i => ({ at: M13.in0 + 0.3 + i * 0.45, sfx: 'coinlet' })), { at: M13.gasp, sfx: 'monkey' }, { at: M13.faint, sfx: 'whoosh' }, { at: M13.faint + 0.45, sfx: 'drum' },
      { at: M13.speak, sfx: 'bell' }, { at: M13.sign0, sfx: 'page' }, { at: M13.scrib, sfx: 'rip' }, { at: M13.scrib + 0.4, sfx: 'rip' }, { at: M13.scrib + 0.8, sfx: 'levelup' },
      { at: M13.snap, sfx: 'crit' }, { at: M13.snap + 0.05, sfx: 'stamp' }, { at: M13.ins + 0.3, sfx: 'triumph' },
      { at: M13.insOut, sfx: 'whoosh' }, { at: M13.hang1, sfx: 'hammer' }, { at: M13.hang1 + 0.3, sfx: 'hammer' }, { at: M13.hang1 + 0.45, sfx: 'jackpot' },
    ],
    camera(t, w) {
      const pa = PORTRAIT_AT[Math.max(0, Math.min(5, w.stage | 0))], sl = w._slot || 0;
      const c = SK.track(t, [
        [0, { x: -8, y: -24, z: 0 }], [2.6, { x: 30, y: -24, z: 0 }], [4.0, { x: 6, y: -24, z: 0 }], [4.79, { x: 0, y: -24, z: 0 }], [4.8, { x: -30, y: -20, z: 1 }],
        [6.39, { x: -30, y: -20, z: 1 }], [6.4, { x: 22, y: -20, z: 1 }], [9.79, { x: 22, y: -20, z: 1 }], [9.8, { x: 6, y: -24, z: 0 }],
        [15.79, { x: 6, y: -24, z: 0 }], [15.8, { x: Math.round((pa[0] + 12 + sl * 34 - 14) / 2), y: Math.min(-30, pa[1] + 34), z: 0 }], [19.5, { x: Math.round((pa[0] + 12 + sl * 34 - 14) / 2), y: Math.min(-32, pa[1] + 32), z: 0 }],
      ]);
      return { x: c.x + shake(t, M13.hang1, 0.12), y: c.y + shake(t, M13.faint + 0.45, 0.15), z: c.z };
    },
    actors(t, w) {
      const A = { f: { x: -14, feet: FG, pose: 'idle', expr: null, flip: false }, c1: { x: -46, feet: FG, pose: 'idle', expr: null }, c2: { x: -78, feet: FG, pose: 'idle', expr: null }, m: null, roll: null, carpet: -10, pops: [], floor: 'type', book: null, scrib: 0, dizzy: false };
      const F = A.f, C = A.c1, C2 = A.c2;
      if (t < M13.gasp - 0.6) { C2.pose = fr(t, 1.5, 2) ? 'st_think' : 'idle'; }
      else if (t < M13.hang0) { C2.pose = t < M13.speak ? 'st_gasp' : fr(t, 3, 2) ? 'st_cheer' : 'st_gasp'; C2.expr = t < M13.speak ? 'screech' : 'giggle'; C2.feet = FG + (t >= M13.speak && fr(t, 3, 2) ? -2 : 0); if (t >= M13.speak) A.pops.push({ kind: 'heart', x: C2.x, y: FG - 50 + (fr(t, 3, 2) ? -2 : 0), k: 1 }); }
      else { C2.pose = fr(t + 0.3, 3, 2) ? 'st_cheer' : 'idle'; C2.expr = 'giggle'; }
      // the carpet: kicked, it unrolls to the right edge
      if (t >= M13.kick - 0.3 && t < M13.kick + 0.2) { C.pose = t < M13.kick ? 'crouch' : 'launch'; C.expr = 'determined'; }
      const rk = seg(t, M13.kick, M13.roll1); A.carpet = Math.round(lerp(-6, 150, ease.out(rk))); if (rk < 1) A.roll = { x: A.carpet, r: Math.max(2, Math.round(5 - rk * 3)) };
      // the visitor walks in, regal, with a sparkle trail
      if (t >= M13.in0) { const wk = SK.walk(t, M13.in0, M13.in1, 140, MUSE_X, { fps: 4 }); A.m = { x: Math.round(wk.x), pose: wk.moving ? wk.pose : 'idle', flip: true, expr: 'giggle', moving: wk.moving }; }
      // starstruck: the floor stops, the founder gasps, the crew member faints
      if (t >= M13.gasp - 0.6) A.floor = 'gasp';
      if (t >= M13.gasp - 0.6 && t < M13.sign0) { F.pose = 'st_gasp'; F.expr = 'screech'; A.pops.push({ kind: '!', x: F.x, y: FG - 50, k: seg(t, M13.gasp - 0.6, M13.gasp - 0.4) }); }
      if (t >= M13.gasp - 0.6 && t < M13.faint) { C.pose = 'st_gasp'; C.expr = 'screech'; A.pops.push({ kind: 'heart', x: C.x, y: FG - 50, k: 1 }); }
      if (t >= M13.faint) { const k = seg(t, M13.faint, M13.faint + 0.45); C.pose = k < 0.3 ? 'launch' : k < 1 ? 'fall' : t < M13.faint + 0.6 ? 'impact' : 'st_sit'; C.feet = FG + Math.round(SK.hop(k, 8)); C.expr = k >= 1 ? 'giggle' : 'screech'; if (k >= 1) A.dizzy = true; }
      if (t >= M13.speak && t < M13.sign0 && A.m) { A.m.pose = fr(t - M13.speak, 1.6, 2) ? 'st_wave_a' : 'idle'; A.m.expr = 'giggle'; F.pose = 'st_gasp'; F.expr = 'giggle'; A.pops.push({ kind: 'heart', x: F.x, y: FG - 50, k: 1 }); }
      // the autograph: the founder walks up with the first book
      if (t >= M13.sign0) {
        const wk = SK.walk(t, M13.sign0, M13.walk1, -14, MUSE_X - 26); F.x = wk.x; F.pose = wk.moving ? wk.pose : 'st_offer'; F.expr = 'giggle';
        A.book = wk.moving ? { x: F.x - 4, y: FG - 26 } : { x: F.x + 12, y: FG - 30 };
        if (A.m && t >= M13.scrib) { A.m.pose = t < M13.scrib + 1.2 ? (fr(t, 6, 2) ? 'st_point' : 'st_offer') : 'st_wave_b'; A.scrib = seg(t, M13.scrib, M13.scrib + 1.2); A.m.expr = 'wink'; }
        if (t >= M13.snap) { F.pose = 'st_cheer'; A.book = { x: F.x - 4, y: FG - 52 }; }
      }
      // the portrait goes up on the wall
      if (t >= M13.hang0) { A.hang = seg(t, M13.hang0, M13.hang1); const up = fr(t, 3, 2) === 0; F.pose = up ? 'st_cheer' : 'idle'; F.feet = FG + (up ? -2 : 0); A.floor = 'cheer'; }
      return A;
    },
    draw(g, t, w, A, view) {
      const p = people(w), id = museOf(w), F = A.f, C = A.c1;
      // the portrait being hung (others hang already)
      if (A.hang > 0) { const pa = view.anchors.portraits[w._slot || 0] || view.anchors.portraits[0]; const y = Math.round(lerp(pa[1] - 30, pa[1], ease.in(A.hang))); if (pa[2] === 'stand' && A.hang >= 1) { rect(g, pa[0] + 3, pa[1] + 24, 2, 16, R.woodD[4]); rect(g, pa[0] + 19, pa[1] + 24, 2, 16, R.woodD[4]); } SK.portraitFrame(g, t, id, pa[0], y); if (A.hang >= 1) sparkles(g, t, pa[0] + 12, pa[1] + 12, M13.hang1, M13.hang1 + 2, 5, 20); }
      // the red carpet
      rect(g, -6, FG - 2, A.carpet + 6, 4, R.red[3]); rect(g, -6, FG - 2, A.carpet + 6, 1, R.red[1]); rect(g, -6, FG - 1, A.carpet + 6, 2, R.red[2]); for (let x = -4; x < A.carpet; x += 6) rect(g, x, FG, 2, 1, '#ffd23a');
      if (A.roll) { SK.disc(g, A.roll.x, FG - A.roll.r, A.roll.r + 1, INK); SK.disc(g, A.roll.x, FG - A.roll.r, A.roll.r, R.red[2]); rect(g, A.roll.x - 1, FG - A.roll.r - 1, 2, 2, R.red[4]); }
      // people
      actor(g, p.crew[1], A.c2.pose, A.c2.x, A.c2.feet, { expr: A.c2.expr, ground: FG });
      actor(g, p.crew[0], C.pose, C.x, C.feet, { expr: C.expr, ground: FG });
      if (A.dizzy) for (let i = 0; i < 3; i++) { const a = t * 4 + (i * Math.PI * 2) / 3; SK.sparkle(g, C.x + Math.round(Math.cos(a) * 9), C.feet - 34 + Math.round(Math.sin(a) * 3), 1, '#fff08c'); }
      actor(g, p.founder, F.pose, F.x, F.feet, { expr: F.expr, ground: FG });
      if (A.m) { actor(g, { look: 'muse_' + id, hat: 0 }, A.m.pose, A.m.x, FG, { expr: A.m.expr, flip: A.m.flip, ground: FG }); if (A.m.moving) for (let i = 0; i < 3; i++) { const k = ((t * 1.5 + i / 3) % 1); SK.sparkle(g, A.m.x + 10 + Math.round(k * 18), FG - 8 - i * 9 - Math.round(k * 4), k < 0.5 ? 2 : 1, i % 2 ? '#ffffff' : '#fff08c'); } }
      if (A.m && t < M13.in1 + 0.4) for (let i = 0; i < 3; i++) { const ph = (t * 2.2 + i * 0.37) % 1; if (ph < 0.12) { const fx = Math.round(-60 + hash(Math.floor(t * 2.2 + i * 0.37), i + 3) * 200), fy = -20 - Math.round(hash(Math.floor(t * 2.2), i + 9) * 50); SK.sparkle(g, fx, fy, 3, '#ffffff'); SK.disc(g, fx, fy, 1, '#ffffff'); view.light(fx - 1, fy - 1, 3, 3, '#ffffff'); } }
      if (A.book) { SK.book(g, A.book.x, A.book.y); if (A.scrib > 0) { const n = Math.round(A.scrib * 7); for (let i = 0; i < n; i++) rect(g, A.book.x + 1 + i, A.book.y + 8 + (i % 2), 1, 1, '#1a3478'); if (A.scrib >= 1) sparkles(g, t, A.book.x + 4, A.book.y + 4, M13.scrib + 1.2, M13.snap, 3, 8); } }
      for (const q of A.pops) SK.pop(g, q.x, q.y, q.kind, q.k);
    },
    screen(g, t, w, A, view) {
      flash(g, view, t, M13.snap, 0.1, 'rgba(255,255,255,.85)');
      if (t >= M13.ins && t < M13.insOut + 0.35) portraitInsert(g, t, w, view, t < M13.insOut ? seg(t, M13.ins, M13.ins + 0.35) : 1 - seg(t, M13.insOut, M13.insOut + 0.35));
    },
  });
  /** The muse's face for the caption portrait: its MuseArt frame if loaded, else its costume monkey */
  function museFace(g, id) {
    const im = SK.museImage(id);
    if (im) { g.drawImage(im, 5, 4, 24, 24, 0, 0, 24, 24); return; }
    const cv = SK.monkey('muse_' + id, 'idle'); if (cv) g.drawImage(cv, -19, -17);
  }
  /** The portrait, close up: the muse's animated MuseArt at 2x in a big gold frame, with a name plate */
  function portraitInsert(g, t, w, view, k) {
    if (k <= 0) return;
    const id = museOf(w), im = SK.museImage(id), s = view.w >= 150 && view.h >= 120 ? 2 : 2, fw = 34 * s, fh = 39 * s, G2 = R.gold;
    const W = fw + 12, H = fh + 12, x0 = Math.round((view.w - W) / 2), y1 = Math.max(4, Math.round(view.h * 0.4 - (H + 12) / 2)), y0 = Math.round(lerp(-H - 20, y1, ease.back(Math.min(1, k))));
    g.fillStyle = 'rgba(26,15,20,' + (0.6 * k).toFixed(2) + ')'; g.fillRect(0, 0, view.w, view.h);
    // light rays behind the frame
    g.globalAlpha = 0.18 * k; for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2 + t * 0.4; for (let d = 30; d < 140; d += 3) rect(g, Math.round(x0 + W / 2 + Math.cos(a) * d), Math.round(y0 + H / 2 + Math.sin(a) * d), 2, 2, '#fff08c'); } g.globalAlpha = 1;
    rect(g, x0 - 2, y0 - 2, W + 4, H + 4, INK); rect(g, x0 - 1, y0 - 1, W + 2, H + 2, G2[3]); rect(g, x0, y0, W, H, G2[2]); rect(g, x0, y0, W, 2, G2[1]); rect(g, x0, y0, 2, H, G2[1]); rect(g, x0 + W - 2, y0, 2, H, G2[3]); rect(g, x0, y0 + H - 2, W, 2, G2[3]);
    for (const [cx, cy] of [[x0 + 3, y0 + 3], [x0 + W - 4, y0 + 3], [x0 + 3, y0 + H - 4], [x0 + W - 4, y0 + H - 4]]) { rect(g, cx - 1, cy - 1, 3, 3, G2[0]); rect(g, cx, cy, 1, 1, G2[3]); }
    rect(g, x0 + 5, y0 + 5, fw + 2, fh + 2, INK);
    if (im) { const f = fr(t, 4, 6); g.imageSmoothingEnabled = false; g.drawImage(im, f * 34, 0, 34, 39, x0 + 6, y0 + 6, fw, fh); }
    else { rect(g, x0 + 6, y0 + 6, fw, fh, '#2a1e30'); SK.actor(g, 'muse_' + id, 'idle', x0 + 6 + fw / 2, y0 + 6 + fh + 6, { s }); }
    // the name plate
    const name = MUSE[id][0].toUpperCase().replace(/[^A-Z0-9 .'&-]/g, ''), nw = SK.textW(name) + 8, nx = Math.round(x0 + W / 2 - nw / 2), ny = y0 + H + 3;
    rect(g, nx - 1, ny - 1, nw + 2, 9, INK); rect(g, nx, ny, nw, 7, G2[2]); rect(g, nx, ny, nw, 1, G2[1]); SK.text(g, name, nx + 4, ny + 1, '#5a3a06');
    if (k >= 1) { SK.sparkle(g, x0 - 3 + fr(t, 3, 2) * (W + 6), y0 + 8, 2, '#ffffff'); SK.sparkle(g, x0 + W + 2 - fr(t + 0.3, 3, 2) * (W + 4), y0 + H - 8, 2, '#fff08c'); }
  }

  /* =====================================================================
     14. SECOND PRINTING: the finale of a run. Night over the empire; the lights go out one by one until only the founder is lit. The run is bound
         into one book: its pages flip through the stages we built (the kit's own world drawing, in miniature). Sold out. Then dawn: a clearing,
         a fresh bamboo desk, a Legacy plaque, and the very first key again. "Let's write it again. Better."
     ===================================================================== */
  const M14 = { look: 0.3, dim0: 4.8, dimStep: 0.8, book: 7.4, ins: 8.4, pages0: 9.2, pages1: 14.2, close: 14.4, sold: 15.0, fade0: 15.8, dawn: 16.4, walk0: 16.6, walk1: 18.0, plaque0: 18.2, plaque1: 18.8, place: 19.0, go0: 19.6, hop0: 20.0, hop1: 20.5, crack: 20.6, raise: 21.8, key: 22.2, end: 25.0 };
  const STAGE_NAMES = ['THE CLEARING', 'THE HUT', 'THE BOATHOUSE', 'THE HIVE', 'THE GRAND HALL', 'THE TOWER'];
  const ROOF = [-40, -86, -84, -112, -112, -280];
  const PLAQUE_X = -52;
  let SKY = null;   // the sky of the moment: set by actors(t) from t alone (night over the empire, then dawn), read by def.sky
  const empOf = w => w._emp || { stage: Math.max(3, w.stage | 0), desks: Math.max(4, w.desks | 0), studios: (w.studios && w.studios.length ? w.studios : ['songs', 'tv']), muses: w.muses || [] };
  SK.scene({
    id: 'second-printing', title: 'Let\'s Write It Again', chapter: 14, duration: M14.end,
    sky: () => SKY || { phase: 'night', wx: 0 },
    prepare(w) {
      const e = w.empire;
      w._emp = e && e.stage != null ? { stage: Math.max(0, Math.min(5, e.stage | 0)), desks: Math.max(1, Math.min(6, (e.desks || e.stage + 1) | 0)), studios: ORDER.filter(id => (e.studios || []).includes(id)), muses: (e.muses || []).slice(0, 3) }
        : { stage: Math.max(3, w.stage | 0), desks: Math.max(4, w.desks | 0), studios: (w.studios && w.studios.length ? w.studios.slice() : ['songs', 'tv']), muses: (w.muses || []).slice(0, 3) };
      w._printing = Math.max(1, w.printing | 0);
      w.studios = []; w.muses = []; w.printing = 0;
      for (const id of w._emp.muses) SK.museImage(id);
    },
    beats: [
      { at: 0.3, who: 'founder', text: 'Look at it. Books, songs, shows... all from one battered typewriter.' },
      { at: 4.8, who: 'narrator', text: 'But every printing has a last page. One by one, the lights went out.' },
      { at: 8.4, who: 'founder', text: 'So we bound the whole story into one book. Every desk. Every hire. Every pun.' },
      { at: 14.6, who: 'founder', text: 'The first edition. Sold out. Time for a second printing.', expr: 'giggle' },
      { at: 16.6, who: 'narrator', text: 'Dawn. A clearing, a fresh bamboo desk, and one shiny new plaque.' },
      { at: 22.2, who: 'founder', text: 'Let\'s write it again. Better.', expr: 'determined' },
    ],
    cast: w => castOf(w),
    cues: [
      ...clacks(0.2, M14.dim0, 6), { at: 0.4, sfx: 'night' },
      ...[0, 1, 2, 3].map(i => ({ at: M14.dim0 + i * M14.dimStep, sfx: 'tick' })), ...[0, 1, 2, 3].map(i => ({ at: M14.dim0 + i * M14.dimStep + 0.02, sfx: 'drum' })),
      { at: M14.book, sfx: 'levelup' }, { at: M14.ins, sfx: 'whoosh' }, { at: M14.ins + 0.3, sfx: 'chest' },
      ...Array.from({ length: 50 }, (_, i) => ({ at: +(M14.pages0 + i * 0.1).toFixed(2), fn: w => pageCue(w, M14.pages0 + i * 0.1) })),
      { at: M14.close, sfx: 'stamp' }, { at: M14.close + 0.1, sfx: 'chest' }, { at: M14.sold, sfx: 'stamp' }, { at: M14.sold + 0.1, sfx: 'jackpot' },
      { at: M14.dawn, sfx: 'day' }, ...[0, 1, 2].map(i => ({ at: M14.walk0 + 0.2 + i * 0.5, sfx: 'tick' })),
      { at: M14.plaque0, sfx: 'shake' }, { at: M14.plaque1, sfx: 'stamp' }, { at: M14.plaque1 + 0.1, sfx: 'triumph' }, { at: M14.place, sfx: 'attach' },
      { at: M14.hop0, sfx: 'whoosh' }, { at: M14.hop1, sfx: 'drum' }, { at: M14.crack + 0.2, sfx: 'crack' }, { at: M14.crack + 0.6, sfx: 'crack' },
      { at: M14.key, sfx: 'key', arg: 1.4 }, { at: M14.key + 0.02, sfx: 'stamp' }, { at: M14.key + 0.35, sfx: 'bell' }, { at: M14.key + 0.8, sfx: 'fanfare' },
    ],
    camera(t, w) {
      const e = empOf(w), roof = ROOF[e.stage], top = Math.max(roof * 0.55, -150);
      const c = SK.track(t, [
        [0, { x: 0, y: top, z: -1 }], [4.0, { x: 0, y: -44, z: -1 }], [4.79, { x: 0, y: -40, z: -1 }], [4.8, { x: 0, y: -34, z: 0 }], [8.39, { x: 0, y: -20, z: 0 }], [8.4, { x: 0, y: -40, z: 0 }], [16.39, { x: 0, y: -40, z: 0 }], [16.4, { x: -30, y: -34, z: 0 }], [19.6, { x: -18, y: -30, z: 0 }],
        [19.99, { x: -14, y: -30, z: 0 }], [20.0, { x: -8, y: -28, z: 1 }], [22.19, { x: -6, y: -28, z: 1 }], [22.2, { x: -2, y: -28, z: 2 }], [23.4, { x: -2, y: -28, z: 2 }], [23.41, { x: -10, y: -30, z: 1 }], [25, { x: -10, y: -32, z: 1 }],
      ]);
      return { x: c.x + shake(t, M14.key, 0.3) + shake(t, M14.close, 0.2), y: c.y + shake(t, M14.plaque1, 0.15) + shake(t, M14.key + 0.03, 0.25), z: c.z };
    },
    actors(t, w) {
      const e = empOf(w), dawn = t >= M14.dawn;
      SKY = dawn ? { phase: 'dawn', wx: 0 } : { phase: 'night', wx: 0 };
      const A = { stage: dawn ? 0 : e.stage, towerLit: !dawn && e.stage === 5 ? 1 - seg(t, M14.dim0, M14.dim0 + 4 * M14.dimStep) : undefined, f: { x: 0, feet: FLOOR + 16, pose: 'idle', expr: null, flip: false }, crew: 'type', iris: 0, book: null, plaque: 0, key: -1, letter: '', paper: 0.3 };
      const F = A.f;
      if (!dawn) {
        // the founder watches the empire hum; then the lights go, step by step
        F.pose = t < M14.dim0 ? (fr(t, 0.8, 2) ? 'idle' : 'breathe') : 'idle'; F.expr = t < M14.dim0 ? 'giggle' : null;
        if (t >= M14.dim0) { A.crew = 'still'; A.iris = Math.min(4, 1 + Math.floor((t - M14.dim0) / M14.dimStep)); }
        if (t >= M14.book) { F.pose = 'st_read'; A.book = { open: true, x: F.x, y: F.feet - 27, glow: true }; F.expr = 'giggle'; }
        else if (t >= M14.dim0 + 3 * M14.dimStep) { F.pose = 'st_think'; }
        return A;
      }
      // dawn: walk in with the book; the plaque rises; set the book down; behind the desk; the first key again
      const wk = SK.walk(t, M14.walk0, M14.walk1, -120, -26); F.x = wk.x; F.feet = FLOOR + wk.bob; F.pose = wk.moving ? wk.pose : 'st_carry'; F.expr = 'giggle';
      A.book = { x: F.x - 4, y: F.feet - 26 };
      A.plaque = seg(t, M14.plaque0, M14.plaque1);
      if (t >= M14.plaque0 && t < M14.place) { F.pose = 'st_gasp'; F.expr = 'screech'; F.flip = true; }
      if (t >= M14.place) { F.flip = true; F.pose = t < M14.go0 ? 'st_offer' : F.pose; A.book = { x: PLAQUE_X + 8, y: FLOOR - 11, rest: true }; }
      if (t >= M14.go0) { const w2 = SK.walk(t, M14.go0, M14.hop0, -26, -16); F.x = w2.x; F.flip = false; F.pose = w2.moving ? w2.pose : 'idle'; }
      const seat = FLOOR - 8;
      if (t >= M14.hop0 && t < M14.hop1) { const k = seg(t, M14.hop0, M14.hop1); F.x = lerp(-16, 0, k); F.feet = lerp(FLOOR, seat, k) + SK.hop(k, 12); F.pose = k < 0.15 ? 'crouch' : 'air'; F.behind = k > 0.5; }
      if (t >= M14.hop1) { F.x = 0; F.feet = seat; F.behind = true; F.pose = t < M14.crack ? 'impact' : 'idle'; F.expr = 'determined'; }
      if (t >= M14.crack && t < M14.raise) F.pose = fr(t - M14.crack, 2.5, 2) ? 'st_crack_b' : 'st_crack_a';
      if (t >= M14.raise && t < M14.key) { F.pose = 'launch'; F.feet = seat - 2; }
      if (t >= M14.key) { const r = t - M14.key; F.pose = r < 0.35 ? 'st_type_a' : r < 0.9 ? 'impact' : fr(r, 3, 2) ? 'st_cheer' : 'st_type_b'; F.expr = r < 0.35 ? 'determined' : 'giggle'; A.key = r < 0.3 ? 4 : -1; A.letter = 'I'; A.col = r < 0.3 ? 0 : 0.05; if (r > 0.9) F.feet = seat + (fr(r, 3, 2) ? -3 : 0); }
      return A;
    },
    draw(g, t, w, A, view) {
      const p = people(w), e = empOf(w), F = A.f;
      if (t < M14.dawn) {
        // the empire: its muses on the wall, its signpost, its plaque of earlier printings, the whole crew at work
        e.muses.forEach((id, i) => { const pa = view.anchors.portraits[i]; if (!pa) return; if (pa[2] === 'stand') { rect(g, pa[0] + 3, pa[1] + 24, 2, 16, R.woodD[4]); rect(g, pa[0] + 19, pa[1] + 24, 2, 16, R.woodD[4]); } SK.portraitFrame(g, t, id, pa[0], pa[1]); });
        const ew = Object.assign({}, w, { stage: e.stage, desks: e.desks });
        if (e.studios.length) SK.signpost(g, t, signpostX(ew, view), e.studios);
        if (w._printing > 1) SK.plaque(g, -Math.max(view.anchors.half, ((e.desks - 1) / 2) * 32 + 16) - 22, FLOOR - 1, w._printing - 1);
        floorCrew(g, t, ew, view, (i, tt) => (A.crew === 'type' ? typePose(i, tt) : { pose: i === 0 ? 'idle' : 'st_think', expr: null }), { fill0: true });
        actor(g, p.founder, F.pose, F.x, F.feet, { expr: F.expr, ground: F.feet });
        if (A.book) { openBook(g, A.book.x, A.book.y, R.red); sparkles(g, t, A.book.x, A.book.y + 2, M14.book, M14.ins, 4, 12); view.light(A.book.x - 7, A.book.y, 15, 6, 'rgba(255,240,180,.35)'); }
        return;
      }
      // dawn in the clearing
      const top = bambooDesk(g, 0, FLOOR);
      if (F.behind) actor(g, p.founder, F.pose, F.x, F.feet, { expr: F.expr });
      bambooDesk(g, 0, FLOOR);
      SK.typewriter(g, 0, 0, top, A.key, { paper: t >= M14.key ? 0.4 : 0.15, col: A.col || 0 });
      if (A.letter) SK.text(g, A.letter, -1, top - 18, '#3a2a60');
      if (t < M14.key && fr(t, 0.7, 3) === 0) SK.sparkle(g, 7, top - 9, 1, '#ffffff');
      // the Legacy plaque rises out of the ground
      if (A.plaque > 0) { g.save(); g.beginPath(); g.rect(-400, -400, 800, 400 + FLOOR); g.clip(); SK.plaque(g, PLAQUE_X, FLOOR - 1 + Math.round((1 - ease.out(A.plaque)) * 26), w._printing); g.restore(); if (A.plaque < 1) SK.puff(g, PLAQUE_X, FLOOR, seg(t, M14.plaque0, M14.plaque1 + 0.3), { n: 6, spread: 18, size: 3 }); else sparkles(g, t, PLAQUE_X, FLOOR - 16, M14.plaque1, M14.plaque1 + 1.6, 4, 18); }
      if (!F.behind) actor(g, p.founder, F.pose, F.x, F.feet, { expr: F.expr, flip: F.flip });
      if (A.book) SK.book(g, A.book.x, A.book.y, { col: R.red, string: false });
      if (t > M14.key && t < M14.key + 1.6) sparkles(g, t, 0, top - 22, M14.key + 0.1, M14.key + 1.6, 6, 20);
    },
    screen(g, t, w, A, view) {
      // the lights going out: an iris that closes on the founder in steps
      if (t < M14.ins && A.iris > 0) { const cx = Math.round(A.f.x + view.ox), cy = Math.round(A.f.feet - 22 + view.oy), r = [999, 150, 90, 56, 34][A.iris]; iris(g, view, cx, cy, Math.round(r * 1.25), 0.45); iris(g, view, cx, cy, r, 0.55); }
      if (t >= M14.ins && t < M14.fade0 + 0.6) bookInsert(g, t, w, view);
      // fade to black, then up on the dawn
      if (t >= M14.fade0 && t < M14.dawn + 0.5) { const k = t < M14.dawn ? seg(t, M14.fade0, M14.dawn) : 1 - seg(t, M14.dawn, M14.dawn + 0.5); g.fillStyle = 'rgba(10,6,16,' + (Math.round(k * 6) / 6).toFixed(2) + ')'; g.fillRect(0, 0, view.w, view.h); }
      flash(g, view, t, M14.key, 0.1); flash(g, view, t, M14.plaque1, 0.06);
    },
  });
  /** A page-turn sound when a flip starts in the 0.1 s before `at` (the page length depends on how many stages the run reached) */
  function pageCue(w, at) {
    const n = empOf(w).stage + 1, pd = pageDur(n);
    for (let j = 0; j < n - 1; j++) { const s0 = M14.pages0 + (j + 0.78) * pd; if (s0 > at - 0.1 && s0 <= at) { try { G.IMI.sfx.page(); } catch { /* sound is optional */ } } }
  }
  const pageDur = n => Math.max(0.9, Math.min(1.8, (M14.pages1 - M14.pages0) / n));
  /** Darkness over the screen with a round hole (stepped, pixel edges) */
  function iris(g, view, cx, cy, r, a) {
    g.fillStyle = 'rgba(8,6,16,' + a + ')';
    for (let y = 0; y < view.h; y++) { const dy = y - cy; if (Math.abs(dy) > r) { g.fillRect(0, y, view.w, 1); continue; } const h = Math.floor(Math.sqrt(r * r - dy * dy) + 0.5); if (cx - h > 0) g.fillRect(0, y, cx - h, 1); if (cx + h + 1 < view.w) g.fillRect(cx + h + 1, y, view.w - cx - h - 1, 1); }
  }
  /** A fresh bamboo desk (green bamboo legs and slats); returns the top y */
  function bambooDesk(g, x, y) {
    const B = R.bamboo, w = 32, x0 = x - 16, top = y - 12;
    for (const lx of [x0 + 2, x0 + w - 5]) { rect(g, lx - 1, top + 2, 5, y - top - 2, B[4]); rect(g, lx, top + 2, 3, y - top - 2, B[2]); rect(g, lx, top + 2, 1, y - top - 2, B[0]); rect(g, lx - 1, top + 7, 5, 1, B[4]); }
    rect(g, x0 + 4, y - 4, w - 8, 2, B[4]); rect(g, x0 + 5, y - 4, w - 10, 1, B[1]);
    rect(g, x0 - 1, top - 1, w + 2, 4, B[4]); for (let i = 0; i < w; i += 4) { rect(g, x0 + i, top, 4, 2, B[(i / 4) % 2 ? 1 : 2]); rect(g, x0 + i, top, 1, 2, B[0]); }
    return top;
  }
  /* ---- the bound book: the run's stages, in miniature, one per page ---- */
  const vigs = new Map();
  function vignette(w, i, vw, vh, t) {
    const key = vw + 'x' + vh + ':' + i; let cv = vigs.get(key);
    if (!cv) { if (vigs.size > 16) vigs.clear(); cv = document.createElement('canvas'); cv.width = vw; cv.height = vh; vigs.set(key, cv); }
    const e = empOf(w), last = i === e.stage, g = cv.getContext('2d');
    const world = { stage: i, desks: i + 1, crew: w.crew, founder: w.founder, studios: last ? e.studios : [], muses: last ? e.muses : [], printing: 0, phase: 'day', wx: 0 };
    SK.drawWorld(g, t, world, { cam: { x: 0, y: [-30, -40, -44, -52, -54, -62][i] }, fy: 0.55, crew: true, sky: { phase: 'day', wx: 0 }, noWeather: true });
    return cv;
  }
  function bookInsert(g, t, w, view) {
    const e = empOf(w), n = e.stage + 1, spread = view.w >= 150, k = seg(t, M14.ins, M14.ins + 0.4), out = seg(t, M14.fade0, M14.fade0 + 0.4);
    g.fillStyle = 'rgba(10,6,16,' + (Math.round(Math.min(1, k * 1.2) * 6) / 6 * 0.92).toFixed(2) + ')'; g.fillRect(0, 0, view.w, view.h);
    const pw = spread ? Math.min(86, Math.floor((view.w - 36) / 2)) : Math.min(96, view.w - 18), ph = spread ? Math.min(78, view.h - 52) : Math.min(116, Math.round(view.h * 0.5));
    const bw = spread ? pw * 2 + 4 : pw, x0 = Math.round((view.w - bw) / 2), yC = Math.round(view.h * 0.41 - ph / 2), y0 = Math.round(lerp(view.h + 10, yC, ease.out(k)) + out * 6);
    const pd = pageDur(n), pi = Math.max(0, Math.min(n - 1, Math.floor((t - M14.pages0) / pd))), pk = (t - M14.pages0 - pi * pd) / pd, flip = t >= M14.pages0 && pi < n - 1 && pk > 0.78 ? seg(pk, 0.78, 1) : 0;
    const closed = t >= M14.close;
    // the cover (leather) behind the pages
    const coverW = Math.min(view.w - 16, Math.max(pw, 96)), cw = closed ? coverW + 6 : bw + 8, cx0 = closed ? Math.round((view.w - cw) / 2) : x0 - 4;
    rect(g, cx0 - 1, y0 - 4, cw + 2, ph + 10, INK); rect(g, cx0, y0 - 3, cw, ph + 8, R.red[3]); rect(g, cx0, y0 - 3, cw, 1, R.red[2]);
    if (closed) { coverPage(g, t, w, cx0 + 3, y0, coverW, ph); return; }
    const page = (px, idx, side) => {
      rect(g, px, y0, pw, ph, R.paper[1]); rect(g, side < 0 ? px : px + pw - 1, y0, 1, ph, R.paper[2]); rect(g, side < 0 ? px + pw - 2 : px, y0, 2, ph, R.paper[3]);
      if (idx < 0) return titlePage(g, px, y0, pw, ph, w);
      const vw = pw - 10, vh = ph - 20, vx = px + 5, vy = y0 + 5;
      rect(g, vx - 1, vy - 1, vw + 2, vh + 2, INK); g.drawImage(vignette(w, idx, vw, vh, t), vx, vy);
      g.fillStyle = 'rgba(255,214,150,.16)'; g.fillRect(vx, vy, vw, vh);
      SK.text(g, idx === 0 ? 'PROLOGUE' : 'CHAPTER ' + (idx + 3), px + pw / 2, vy + vh + 3, '#a8946a', { align: 'center' });
      SK.text(g, STAGE_NAMES[idx], px + pw / 2, vy + vh + 9, '#3a2a60', { align: 'center' });
    };
    const clipTo = (fx, ww, fn) => { if (ww <= 0) return; g.save(); g.beginPath(); g.rect(fx, y0, ww, ph); g.clip(); fn(); g.restore(); };
    if (spread) {
      const L = x0, Rx = x0 + pw + 4;
      page(L, pi - 1, -1); page(Rx, flip > 0 ? pi + 1 : pi, 1);
      if (flip > 0 && flip < 0.5) { const ww = Math.round(pw * (1 - flip * 2)); clipTo(Rx, ww, () => { page(Rx, pi, 1); g.fillStyle = 'rgba(120,104,66,' + (flip * 0.6).toFixed(2) + ')'; g.fillRect(Rx, y0, pw, ph); }); rect(g, Rx + ww - 1, y0, 1, ph, R.paper[4]); }
      if (flip >= 0.5) { const ww = Math.round(pw * (flip * 2 - 1)), fx = L + pw - ww; clipTo(fx, ww, () => { page(L, pi, -1); g.fillStyle = 'rgba(120,104,66,' + ((1 - flip) * 0.6).toFixed(2) + ')'; g.fillRect(L, y0, pw, ph); }); rect(g, fx, y0, 1, ph, R.paper[4]); }
      rect(g, x0 + pw, y0 - 1, 4, ph + 2, R.red[4]); rect(g, x0 + pw + 1, y0 - 1, 2, ph + 2, R.red[3]);
    } else {
      page(x0, flip > 0 ? pi + 1 : pi, 1);
      if (flip > 0) { const ww = Math.round(pw * (1 - flip)); clipTo(x0, ww, () => page(x0, pi, 1)); rect(g, x0 + ww - 1, y0, 2, ph, R.paper[4]); }
    }
  }
  function titlePage(g, px, y0, pw, ph, w) {
    const cx = px + Math.round(pw / 2);
    SK.text(g, 'THE STORY', cx, y0 + 12, '#5a3a06', { align: 'center', s: pw >= 76 ? 2 : 1 });
    SK.text(g, 'SO FAR', cx, y0 + (pw >= 76 ? 25 : 20), '#5a3a06', { align: 'center', s: pw >= 76 ? 2 : 1 });
    const by = y0 + (pw >= 76 ? 39 : 30); rect(g, cx - 18, by + 2, 12, 1, '#c9b88a'); rect(g, cx + 7, by + 2, 12, 1, '#c9b88a'); SK.banana(g, cx - 4, by);
    SK.text(g, 'INFINITE MONKEY', cx, by + 9, '#3a2a60', { align: 'center' }); SK.text(g, 'INDUSTRIES', cx, by + 16, '#3a2a60', { align: 'center' });
    SK.text(g, ordinal(w._printing || 1) + ' PRINTING', cx, y0 + ph - 10, '#a8946a', { align: 'center' });
  }
  function coverPage(g, t, w, x, y, pw, ph) {
    const G2 = R.gold, cx = x + Math.round(pw / 2), big = pw >= 84 ? 2 : 1, ty = y + 11;
    rect(g, x + 3, y + 3, pw - 6, ph - 6, G2[3]); rect(g, x + 4, y + 4, pw - 8, ph - 8, R.red[3]); rect(g, x + 6, y + 6, pw - 12, ph - 12, G2[3]); rect(g, x + 7, y + 7, pw - 14, ph - 14, R.red[2]);
    for (const [px, py] of [[x + 9, y + 9], [x + pw - 10, y + 9], [x + 9, y + ph - 10], [x + pw - 10, y + ph - 10]]) SK.sparkle(g, px, py, 1, G2[1]);
    SK.text(g, 'THE STORY', cx, ty, G2[2], { align: 'center', s: big, shadow: R.red[4] }); SK.text(g, 'SO FAR', cx, ty + 6 * big + 2, G2[2], { align: 'center', s: big, shadow: R.red[4] });
    const ey = Math.max(ty + 12 * big + 14, y + Math.round(ph * 0.45)); SK.disc(g, cx, ey, 8, R.red[4]); SK.disc(g, cx, ey, 7, G2[3]); SK.disc(g, cx, ey, 6, G2[2]); SK.text(g, 'IMI', cx, ey - 2, R.red[4], { align: 'center' });
    SK.text(g, ordinal(w._printing || 1) + ' PRINTING', cx, y + ph - 15, G2[1], { align: 'center' });
    if (t >= M14.sold) {
      const k = seg(t, M14.sold, M14.sold + 0.12), s = k < 1 ? 3 : 2, tw = SK.textW('SOLD OUT', s) + 8, sx = Math.round(cx - tw / 2), sy = (ph > 100 ? y + Math.round(ph * 0.7) : ey + 2) - Math.round((5 * s + 6) / 2);
      rect(g, sx - 1, sy - 1, tw + 2, 5 * s + 8, '#fff6d6'); rect(g, sx, sy, tw, 5 * s + 6, '#c8322a'); rect(g, sx + 1, sy + 1, tw - 2, 5 * s + 4, '#e8402a'); SK.text(g, 'SOLD OUT', cx, sy + 3, '#fff6d6', { align: 'center', s });
    }
    if (t < M14.close + 0.5) SK.puff(g, cx, y + ph + 2, seg(t, M14.close, M14.close + 0.5), { n: 7, spread: 40, size: 3, col: '#c9b88a' });
    sparkles(g, t, cx, ey, M14.close, M14.fade0, 4, 22);
  }
})(typeof globalThis !== 'undefined' ? globalThis : window);
