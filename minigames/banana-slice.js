/* ============================================================
   BANANA SLICE: bananas are tossed up in arcs; drag a blade through them. Don't slice the coconuts, don't let bananas drop.
   Slice several in one swipe for a bonus. Rare: the Golden Banana starts a frenzy (no penalty, double points);
   the Diamond Banana slows time for a few seconds of big points.
   Controls: press and drag (mouse or touch). Standalone: no connection to the main game's save yet.
   ============================================================ */
(() => {
  'use strict';
  const { rng, clamp, lerp, sfx } = MG;
  const W = 120, H = 208, GRAV = 170, R = 9;
  const params = new URLSearchParams(location.search), RARE = +params.get('rare') || 0;

  MG.boot();
  const A = MGArt.build(), A3 = MGArt3.build(), { cvs } = MGArt3;
  const host = document.getElementById('stage'), st = MG.stage(host, W, H, { padY: 40 }), g = st.g;
  host.style.cursor = 'crosshair';
  const ui = MG.ui(host, st, A3.banana), fx = MG.fx();

  /* sprites in four right-angle spins so the tumble stays pixel-clean */
  const spinCache = new Map();
  function spin(cv, k) {
    k &= 3; const sz = Math.max(cv.width, cv.height); let m = spinCache.get(cv); if (!m) spinCache.set(cv, m = {});
    if (m[k]) return m[k];
    const o = document.createElement('canvas'); o.width = o.height = sz; o.hi = true; const c = o.getContext('2d'); c.imageSmoothingEnabled = false;
    c.translate(sz / 2, sz / 2); c.rotate(k * Math.PI / 2); c.drawImage(cv, Math.round(-cv.width / 2), Math.round(-cv.height / 2));
    return (m[k] = o);
  }  const SPR = { banana: A3.banana, golden: A3.golden, diamond: A3.diamond, coconut: A3.coconut };
  const stump = cvs(60, 27, x => { x.fillStyle = '#1a0f14'; x.fillRect(3, 3, 54, 24); x.fillStyle = '#7a4a1e'; x.fillRect(5, 6, 50, 19); x.fillStyle = '#b57d3e'; x.fillRect(5, 6, 50, 3); x.fillStyle = '#e8b878'; x.fillRect(5, 6, 50, 1); x.fillStyle = '#5a3517'; x.fillRect(5, 22, 50, 3); x.fillStyle = '#d09a58'; x.fillRect(8, 0, 44, 8); x.fillStyle = '#1a0f14'; x.fillRect(6, 0, 48, 1); x.fillStyle = '#b57d3e'; for (const r of [7, 13, 19]) x.fillRect(30 - r, 3, r * 2 - 1, 1); });
  const mpose = { t: 0, p: 'cheer' };

  /* ---------- state ---------- */
  let G = null, botOn = false, down = false, trail = [], last = null;
  function newGame() {
    G = { t: 0, score: 0, hearts: 3, combo: 0, bestCombo: 0, items: [], halves: [], waveT: 1, shake: 0, frenzy: 0, slowT: 0, sliced: 0, missed: 0, goldens: 0, diamonds: 0, bonks: 0, burst: 0, burstT: 0, pending: [], slashes: [], sinceDiamond: 0, deadT: 0, bestMulti: 0 };
    trail = []; last = null; fx.clear(); render();
  }
  const mult = () => ui.mult(G.combo);
  function render(anim) { ui.setScore(G.score); ui.setHearts(G.hearts, anim); ui.setCombo(G.combo, mult()); }

  /* ---------- spawning ---------- */
  function toss(type, x) {
    const d = clamp(G.t / 90, 0, 1), x0 = x == null ? rng(16, W - 16) : x, ya = rng(34, 112), vy = -Math.sqrt(2 * GRAV * (H + 12 - ya)), tf = -2 * vy / GRAV;
    G.items.push({ type, x: x0, y: H + 12, vx: (W / 2 - x0) / tf * rng(.2, 1.1), vy: vy * rng(.97, 1.03), k: Math.floor(Math.random() * 4), sp: rng(.12, .26), age: 0 });
  }
  function pickType() {
    const d = clamp(G.t / 90, 0, 1);
    if (G.frenzy > 0) return 'banana';
    if (G.t > 8) { if (Math.random() < .02 + RARE * .3) return 'golden'; if (Math.random() < .007 + Math.min(.015, G.sinceDiamond / 5000) + RARE * .3) return 'diamond'; }
    return G.t > 4 && Math.random() < lerp(.1, .27, d) ? 'coconut' : 'banana';
  }
  function wave() {
    const d = clamp(G.t / 90, 0, 1), n = G.frenzy > 0 ? 3 + Math.floor(Math.random() * 3) : 1 + Math.floor(Math.random() * (1 + d * 3));
    for (let i = 0; i < n; i++) G.pending.push({ t: i * .13 });
    G.waveT = (G.frenzy > 0 ? .55 : lerp(1.5, .8, d)) * rng(.8, 1.2);
  }

  /* ---------- slicing ---------- */
  function segHit(a, b, it) {
    const dx = b[0] - a[0], dy = b[1] - a[1], l2 = dx * dx + dy * dy || 1e-6;
    let t = ((it.x - a[0]) * dx + (it.y - a[1]) * dy) / l2; t = clamp(t, 0, 1);
    const px = a[0] + dx * t - it.x, py = a[1] + dy * t - it.y; return px * px + py * py <= (R + 1) * (R + 1);
  }
  function slice(it, a, b) {
    it.dead = true; const ang = Math.atan2(b[1] - a[1], b[0] - a[0]), nx = -Math.sin(ang), ny = Math.cos(ang);
    const cv = spin(SPR[it.type], it.k);
    G.slashes.push({ x: it.x, y: it.y, dx: Math.cos(ang), dy: Math.sin(ang), t: 0, big: it.type === 'golden' || it.type === 'diamond' });
    mpose.t = G.burst >= 2 ? .5 : .25; mpose.p = 'cheer'; G.halves.push({ x: it.x, y: it.y, vx: it.vx + nx * 34, vy: it.vy + ny * 34 - 20, half: 0, cv, t: 0 }, { x: it.x, y: it.y, vx: it.vx - nx * 34, vy: it.vy - ny * 34 - 20, half: 1, cv, t: 0 });
    if (it.type === 'coconut') {
      MG.hitstop(.09); mpose.t = .8; mpose.p = 'scared'; fx.shock(it.x, it.y, '#ff7a6a', 28); G.hearts--; G.bonks++; G.combo = 0; G.shake = 6; sfx.bonk(); ui.doFlash('#c0392b'); fx.burst(it.x, it.y, ['#563418', '#86592e', '#fff6d6'], 14, 80, 180, .6); ui.floatText(it.x, it.y - 10, 'OUCH -1', 'bad');
      render(true); if (G.hearts <= 0) { G.deadT = 1; sfx.over(); } return;
    }
    G.combo++; G.bestCombo = Math.max(G.bestCombo, G.combo); G.sliced++; G.burst++; G.burstT = .22;
    const m = mult(), f = G.frenzy > 0 ? 2 : 1;
    let base = 10; fx.burst(it.x, it.y, ['#ffd23a', '#fff08c', '#fff6d6'], 8, 55, 140, .45); fx.burst(it.x, it.y, ['#52301a', '#7a4c28'], 3, 70, 200, .6); fx.puff(it.x, it.y, '#fff6d6', 2);
    if (it.type === 'golden') { MG.hitstop(.06); fx.confetti(it.x, it.y, 18, ['#ffd23a', '#fff08c', '#fffbe0']); base = 100; G.goldens++; G.frenzy = 6; sfx.golden(); G.shake = 3; fx.ring(it.x, it.y, '#ffd23a', 40); fx.burst(it.x, it.y, ['#ffd23a', '#fff08c', '#fffbe0'], 22, 90, 80, .8); ui.say('GOLDEN FRENZY<small>double points · no misses · 6s</small>'); if (G.hearts < 3) { G.hearts++; ui.floatText(W / 2, 60, '+HEART', 'gold'); } }
    else if (it.type === 'diamond') { MG.hitstop(.11); fx.confetti(it.x, it.y, 34); fx.shock(it.x, it.y, '#9be8ff', 50); base = 200; G.diamonds++; G.slowT = 3.5; sfx.diamond(); ui.doFlash('#e8fbff'); G.shake = 4; G.sinceDiamond = 0; fx.ring(it.x, it.y, '#9be8ff', 58); fx.burst(it.x, it.y, ['#9be8ff', '#fff', '#2a86b8'], 34, 120, 60, 1); ui.say('DIAMOND TIME<small>time slows · 3 seconds</small>', 'ice'); }
    else { sfx.clack(Math.min(12, G.combo)); if (G.slowT > 0) base = 25; }
    const pts = Math.round(base * m * f); G.score += pts; ui.bump();
    ui.floatText(it.x, it.y - 12, '+' + pts, it.type === 'diamond' ? 'ice' : it.type === 'golden' || m > 1 ? 'gold' : '');
    if (G.burst >= 3) { MG.hitstop(.05); G.shake = Math.max(G.shake, 3); fx.shock(it.x, it.y, '#fff', 26); const bonus = (G.burst - 2) * 15; G.score += bonus; G.bestMulti = Math.max(G.bestMulti, G.burst); ui.floatText(W / 2, 70, `${G.burst}x SLICE +${bonus}`, 'gold big'); sfx.golden(); ui.pulseCombo(); }
    if (G.combo % 8 === 0) { ui.floatText(W / 2, 90, `COMBO x${mult()}!`, 'gold'); ui.pulseCombo(); }
    render();
  }
  function blade(p) {
    if (last) { const a = last, b = p; for (const it of G.items) if (!it.dead && it.y < H + 4 && segHit(a, b, it)) slice(it, a, b); }
    last = p; trail.push({ x: p[0], y: p[1], t: 0 });
  }

  /* ---------- update ---------- */
  function update(rdt) {
    fx.update(rdt);
    for (let i = trail.length - 1; i >= 0; i--) { trail[i].t += rdt; if (trail[i].t > .22) trail.splice(i, 1); }
    if (!G || !S.playing) return;
    const slow = G.slowT > 0 ? .4 : 1, dt = rdt * slow;
    G.t += rdt; G.sinceDiamond += rdt; G.shake = Math.max(0, G.shake - rdt * 22);
    if (G.frenzy > 0) G.frenzy = Math.max(0, G.frenzy - rdt); if (G.slowT > 0) G.slowT = Math.max(0, G.slowT - rdt);
    if (G.burstT > 0) { G.burstT -= rdt; if (G.burstT <= 0) G.burst = 0; }
    ui.setMeter(G.slowT > 0 ? G.slowT / 3.5 : G.frenzy / 6, G.slowT > 0);
    if (G.deadT > 0) { G.deadT -= rdt; if (G.deadT <= 0) S.finish([['SLICED', G.sliced], ['BEST COMBO', G.bestCombo], ['BEST MULTI', G.bestMulti + 'x'], ['GOLD / DIAMOND', `${G.goldens} / ${G.diamonds}`], ['MISSED', G.missed]]); return; }
    G.waveT -= dt; if (G.hearts > 0 && G.waveT <= 0) wave();
    for (let i = G.pending.length - 1; i >= 0; i--) { G.pending[i].t -= dt; if (G.pending[i].t <= 0) { G.pending.splice(i, 1); toss(pickType()); } }
    for (let i = G.items.length - 1; i >= 0; i--) {
      const it = G.items[i]; if (it.dead) { G.items.splice(i, 1); continue; }
      it.age += dt; it.vy += GRAV * dt; it.x += it.vx * dt; it.y += it.vy * dt;
      it.k = Math.floor(it.age / it.sp);
      if (botOn && it.type !== 'coconut' && it.y > 20 && it.y < H - 20 && it.vy > 0) { blade([it.x - 14, it.y - 4]); blade([it.x + 14, it.y + 4]); last = null; }
      if (it.vy > 0 && it.y > H + 14) {
        if (it.type !== 'coconut' && G.frenzy <= 0 && G.hearts > 0) { G.hearts--; G.missed++; G.combo = 0; G.shake = 3; sfx.miss(); ui.floatText(clamp(it.x, 12, W - 12), H - 22, 'MISSED', 'bad'); render(true); if (G.hearts <= 0) { G.deadT = 1; sfx.over(); } }
        G.items.splice(i, 1);
      }
    }
    for (let i = G.slashes.length - 1; i >= 0; i--) { G.slashes[i].t += rdt; if (G.slashes[i].t > .2) G.slashes.splice(i, 1); }
    for (let i = G.halves.length - 1; i >= 0; i--) { const hv = G.halves[i]; hv.t += dt; hv.vy += GRAV * dt; hv.x += hv.vx * dt; hv.y += hv.vy * dt; if (hv.y > H + 20 || hv.t > 1.4) G.halves.splice(i, 1); }
  }

  /* ---------- draw ---------- */
  function draw() {
    g.clearRect(0, 0, W, H); g.save();
    if (G.shake > .3) g.translate(Math.round(rng(-G.shake, G.shake) * .5), Math.round(rng(-G.shake, G.shake) * .5));
    if (G.slowT > 0) { g.fillStyle = 'rgba(155,232,255,.12)'; g.fillRect(0, 0, W, H); }
    if (G.frenzy > 0) { g.fillStyle = 'rgba(255,210,58,.09)'; g.fillRect(0, 0, W, H); }
    /* the keeper, perched on a stump in the corner, watching your blade */
    if (mpose.t > 0) mpose.t -= 1 / 60; st.hi(stump, W - 24, H - 8);
    MGCrew.draw(st, mpose.t > 0 ? mpose.p : G.hearts <= 1 && S.playing ? 'scared' : Math.floor(performance.now() / 420) % 2 ? 'breathe' : 'idle', W - 14, H - 7, { flip: true });
    for (const it of G.items) {
      const cv = spin(SPR[it.type], it.k);
      st.hi(cv, it.x - cv.width / 6, it.y - cv.height / 6);
      if ((it.type === 'golden' || it.type === 'diamond') && Math.floor(it.age * 12) % 2 === 0) fx.spark(it.x, it.y, it.type === 'diamond' ? '#9be8ff' : '#fff08c');
    }
    for (const hv of G.halves) {
      const w = hv.cv.width, hw = w >> 1; g.globalAlpha = clamp(1.4 - hv.t, 0, 1);
      g.drawImage(hv.cv, hv.half ? hw : 0, 0, hw, hv.cv.height, Math.round((hv.x - hw / 3 + (hv.half ? hw / 3 : 0)) * 3) / 3, Math.round((hv.y - hv.cv.height / 6) * 3) / 3, hw / 3, hv.cv.height / 3);
    }
    g.globalAlpha = 1;
    for (const sl of G.slashes) {                                            /* a short white streak where the blade went through */
      const k = 1 - sl.t / .2, len = sl.big ? 22 : 15; g.globalAlpha = k;
      for (let i = -len; i <= len; i += .34) { const w = Math.abs(i) > len * .6 ? .67 : 1.33; g.fillStyle = Math.abs(i) < len * .5 ? '#fff' : '#fff08c'; g.fillRect(sl.x + sl.dx * i, sl.y + sl.dy * i, w, w); }
      g.globalAlpha = 1;
    }
    /* blade trail: a bright core with a warm edge, thinning as it ages */
    for (let i = 1; i < trail.length; i++) {
      const a = trail[i - 1], b = trail[i], k = 1 - b.t / .22, n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) * 3));
      for (let s = 0; s <= n; s++) { const x = lerp(a.x, b.x, s / n), y = lerp(a.y, b.y, s / n), sz = k > .5 ? 1.33 : .67; g.fillStyle = k > .55 ? '#fff' : '#fff08c'; g.fillRect(x - sz / 2, y - sz / 2, sz, sz); if (k > .7 && s % 3 === 0) { g.fillStyle = 'rgba(255,210,58,.5)'; g.fillRect(x - 1.33, y - 1.33, .67, .67); g.fillRect(x + 1, y + 1, .67, .67); } }
    }
    if (down && last) { const f = Math.floor(performance.now() / 70) % 2; g.fillStyle = '#fff'; g.fillRect(Math.round(last[0]) - 1, Math.round(last[1]) - 1, 3, 3); g.fillStyle = f ? '#ffd23a' : '#fff08c'; g.fillRect(Math.round(last[0]) - 2, Math.round(last[1]), 5, 1); g.fillRect(Math.round(last[0]), Math.round(last[1]) - 2, 1, 5); }
    fx.draw(g); g.restore();
  }

  /* ---------- shell + input ---------- */
  const S = MG.shell({
    host, ui, id: 'slice', title: 'BANANA<span>SLICE</span>', sub: 'Swipe the bananas. Spare the coconuts.',
    legend: [[A3.banana, '<em>10</em> per banana'], [A3.coconut, '<em class="bad">slice</em> = -1 heart'], [A3.golden, '<em>100</em> frenzy'], [A3.diamond, '<em class="ice">200</em> slow-mo'],
      [A3.rotten, '<em class="bad">drop</em> = -1 heart'], [A3.heart, '<em>3</em> hearts']],
    hint: 'press and drag to slice · 3+ in a swipe = bonus', onStart: () => newGame(), score: () => G.score,
  });
  addEventListener('pointerdown', ev => { if (!S.playing || ev.target.closest('.mg-over,.mg-nav')) return; down = true; last = null; blade(st.toArt(ev)); });
  addEventListener('pointermove', ev => { if (!S.playing || !down) return; blade(st.toArt(ev)); });
  addEventListener('pointerup', () => { down = false; last = null; }); addEventListener('pointercancel', () => { down = false; last = null; });

  newGame(); S.title();
  if (params.get('autostart')) { S.start(); botOn = !!params.get('bot'); for (let i = 0, n = (+params.get('warp') || 0) * 60; i < n; i++) update(1 / 60); }
  MG.loop(update, draw);
  window.BL = { get G() { return G; }, S };
})();
