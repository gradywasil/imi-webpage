/* ============================================================
   FRUIT STALL: customers walk up with orders in speech bubbles; tap the fruit bins (or press 1-5) to hand over what they asked for.
   Fruit goes to whoever needs it most urgently. Serve fast for bigger tips; anyone who runs out of patience storms off and costs a heart.
   Rare: a golden VIP orders three things and pays x3; the Diamond customer orders one of everything and pays x10.
   Standalone: no connection to the main game's save yet.
   ============================================================ */
(() => {
  'use strict';
  const { rng, clamp, lerp, sfx, h } = MG;
  const W = 120, H = 208, SLOTS = [20, 60, 100], COUNTER_Y = 108, BIN_Y = 146, BINW = 22;
  const params = new URLSearchParams(location.search), RARE = +params.get('rare') || 0;

  MG.boot();
  const A = MGArt.build(), { R, make, shapes: { ell, box, poly, or } } = MGArt, FONT = MGArt.FONT;
  const host = document.getElementById('stage'), st = MG.stage(host, W, H, { padY: 40 }), g = st.g;
  host.style.cursor = 'pointer';
  const ui = MG.ui(host, st, A.banana), fx = MG.fx();
  const FRUIT = [A.apple, A.orange, A.grapes, A.pine, A.banana], NAMES = ['APPLE', 'ORANGE', 'GRAPES', 'PINE', 'BANANA'], KEYC = ['#e86a50', '#f08a1a', '#b58cf0', '#f2b23a', '#ffd23a'];
  const mini = FRUIT.map(sp => { const c = document.createElement('canvas'); c.width = c.height = 11; const x = c.getContext('2d'); x.imageSmoothingEnabled = false; const k = Math.min(11 / sp.width, 11 / sp.height); x.drawImage(sp, Math.round((11 - sp.width * k) / 2), Math.round((11 - sp.height * k) / 2), Math.round(sp.width * k), Math.round(sp.height * k)); return c; });

  /* the regulars: four kinds of creature, each recoloured by a hat */
  const TYPES = [
    { name: 'monkey', fur: R.fur, skin: R.skin }, { name: 'orangutan', fur: R.orange, skin: R.skin }, { name: 'gorilla', fur: R.metal, skin: R.furD }, { name: 'parrot', fur: R.red, skin: R.banY },
  ];
  const BODY = [R.red, R.leaf, R.wood, R.grape];
  const creature = (t, body) => make(17, 18, px => {
    px.shape(ell(8.5, 15.5, 6.8, 3.2), body, 1);
    if (t.name !== 'parrot') { px.shape(or(ell(2, 7.5, 2.2, 2.2), ell(15, 7.5, 2.2, 2.2)), t.fur, 2); px.shape(ell(8.5, 8, 6.4, 5.8), t.fur, 3); px.shape(ell(8.5, 9.6, 4.4, 3.6), t.skin, 4); }
    else { px.shape(ell(8.5, 8, 6, 6), t.fur, 3); px.shape(poly([[8.5, 9], [14.5, 10], [10, 13]]), t.skin, 4); px.shape(ell(8.5, 2.6, 2.2, 1.8), R.banY, 2); }
    px.dot(6, 7, R.paper, 2, 5); px.dot(11, 7, R.paper, 2, 5);
  });
  const CRE = TYPES.map((t, i) => creature(t, BODY[i]));

  /* ---------- state ---------- */
  const cust2xCv = document.createElement('canvas'); cust2xCv.width = 17; cust2xCv.height = 28; const cust2x = cust2xCv.getContext('2d');
  let G = null, botOn = false;
  function newGame() {
    G = { t: 0, score: 0, hearts: 3, combo: 0, bestCombo: 0, cust: [null, null, null], spawnT: .8, served: 0, walked: 0, goldens: 0, diamonds: 0, shake: 0, binPress: [0, 0, 0, 0, 0], stock: [5, 5, 5, 5, 5], restock: [0, 0, 0, 0, 0], rush: 0, wrong: 0, dead: 0, lastRush: 0, sinceDia: 0 };
    fx.clear(); render();
  }
  const mult = () => ui.mult(G.combo);
  function render(anim) { ui.setScore(G.score); ui.setHearts(G.hearts, anim); ui.setCombo(G.combo, mult()); }

  /* ---------- customers ---------- */
  function spawn() {
    const free = G.cust.map((c, i) => c ? -1 : i).filter(i => i >= 0); if (!free.length) return;
    const slot = free[Math.floor(Math.random() * free.length)], d = clamp(G.t / 50, 0, 1);
    let size = 1 + (Math.random() < .45 + d * .4 ? 1 : 0) + (Math.random() < .12 + d * .55 ? 1 : 0) + (Math.random() < d * .4 ? 1 : 0), kind = 'normal';
    if (G.t > 15 && Math.random() < .04 + RARE * .6) { kind = 'golden'; size = 3; }
    else if (G.t > 40 && Math.random() < .008 + Math.min(.015, G.sinceDia / 6000) + RARE * .6) { kind = 'diamond'; size = 5; G.sinceDia = 0; }
    let need; if (kind === 'diamond') need = [0, 1, 2, 3, 4]; else { need = []; for (let i = 0; i < size; i++) need.push(Math.floor(Math.random() * 5)); }
    const patience = (kind === "diamond" ? 18 : 4.6 + size * 1.9) * lerp(1, .55, d);
    G.cust[slot] = { slot, x: slot === 0 ? -14 : slot === 2 ? W + 14 : W / 2, type: Math.floor(Math.random() * 4), hat: Math.floor(Math.random() * 6), need, got: need.map(() => false), kind, patience, max: patience, state: 'in', t: 0, born: G.t, mood: 0 };
    G.walked++; if (kind !== 'normal') { sfx.golden(); ui.say(kind === 'diamond' ? 'DIAMOND CUSTOMER!<small>one of everything · x10</small>' : 'GOLDEN VIP!<small>3 items · x3 tips</small>', kind === 'diamond' ? 'ice' : ''); }
    sfx.tick();
  }

  function serve(fruit) {
    if (!S.playing || G.dead) return; G.binPress[fruit] = .12; fx.burst(4 + fruit * (BINW + 1) + BINW / 2, BIN_Y + 6, [KEYC[fruit], '#fff6d6'], 3, 30, 90, .3);
    if (G.restock[fruit] > 0) return;
    if (G.stock[fruit] <= 0) { G.restock[fruit] = .75; sfx.tick(); ui.floatText(4 + fruit * (BINW + 1) + BINW / 2, BIN_Y - 6, 'RESTOCKING', ''); return; }
    let best = null; for (const c of G.cust) { if (!c || c.state !== 'wait') continue; if (c.need.some((n, i) => n === fruit && !c.got[i])) { if (!best || c.patience < best.patience) best = c; } }
    const x = 4 + fruit * (BINW + 1) + BINW / 2;
    if (!best) { G.wrong++; G.combo = 0; G.score = Math.max(0, G.score - 2); sfx.typo(); ui.floatText(x, BIN_Y - 6, 'NO ONE WANTS THAT', 'bad'); G.shake = 1.5; render(); return; }
    const i = best.need.findIndex((n, k) => n === fruit && !best.got[k]); best.got[i] = true; G.stock[fruit]--; sfx.ding(Math.min(10, best.got.filter(Boolean).length * 2 + G.combo)); best.mood = 1;
    fx.burst(best.x, COUNTER_Y - 14, [KEYC[fruit], '#fff6d6'], 6, 44, 80, .35); flyFruit(fruit, x, BIN_Y, best.x, COUNTER_Y - 16);
    if (best.got.every(Boolean)) finishOrder(best);
  }
  const flies = []; function flyFruit(f, x0, y0, x1, y1) { flies.push({ f, x0, y0, x1, y1, t: 0 }); }

  function finishOrder(c) {
    G.served++; G.combo++; G.bestCombo = Math.max(G.bestCombo, G.combo); const m = mult(), frac = c.patience / c.max, k = c.kind === 'diamond' ? 10 : c.kind === 'golden' ? 3 : 1;
    const base = c.need.length * 10, tip = Math.round(base * frac * .8), pts = Math.round((base + tip) * m * k);
    G.score += pts; ui.bump(); c.state = 'happy'; c.t = 0; sfx.letters(); sfx.golden(); fx.confetti(c.x, COUNTER_Y - 20, k > 1 ? 30 : 12, ['#ffd23a', '#fff08c', '#c98f0e']); if (k > 1) MG.hitstop(.07);
    ui.floatText(c.x, COUNTER_Y - 38, '+' + pts, k > 1 ? (c.kind === 'diamond' ? 'ice big' : 'gold big') : m > 1 ? 'gold' : ''); if (tip > 4) ui.floatText(c.x, COUNTER_Y - 50, `TIP +${tip}`, 'gold');
    fx.ring(c.x, COUNTER_Y - 16, c.kind === 'diamond' ? '#9be8ff' : '#ffd23a', 30); fx.burst(c.x, COUNTER_Y - 18, c.kind === 'diamond' ? ['#9be8ff', '#fff'] : ['#ffd23a', '#fff08c', '#74c648'], 14, 70, 60, .7);
    if (c.kind === 'golden') { G.goldens++; if (G.hearts < 3) { G.hearts++; ui.floatText(c.x, COUNTER_Y - 62, '+HEART', 'gold'); } }
    if (c.kind === 'diamond') { G.diamonds++; sfx.diamond(); ui.doFlash('#e8fbff'); G.shake = 4; if (G.hearts < 3) G.hearts = 3; }
    if (G.combo > 1 && G.combo % 3 === 0) { ui.pulseCombo(); ui.floatText(W / 2, 80, `STREAK x${m}`, 'gold'); }
    render();
  }
  function leave(c) {
    c.state = 'angry'; c.t = 0; G.hearts--; G.combo = 0; G.shake = 4; sfx.bonk(); ui.doFlash('#c0392b'); ui.floatText(c.x, COUNTER_Y - 38, 'STORMS OFF!', 'bad'); fx.burst(c.x, COUNTER_Y - 18, ['#c0392b', '#fff6d6'], 10, 60, 100, .5); render(true);
    if (G.hearts <= 0) { G.dead = 1.1; sfx.over(); }
  }

  /* ---------- update ---------- */
  function update(rdt) {
    fx.update(rdt);
    for (let i = flies.length - 1; i >= 0; i--) { flies[i].t += rdt / .28; if (flies[i].t >= 1) flies.splice(i, 1); }
    if (!G || !S.playing) return;
    const dt = rdt; G.t += dt; G.sinceDia += dt; G.shake = Math.max(0, G.shake - rdt * 18);
    for (let i = 0; i < 5; i++) { if (G.binPress[i] > 0) G.binPress[i] -= dt; if (G.restock[i] > 0) { G.restock[i] -= dt; if (G.restock[i] <= 0) { G.restock[i] = 0; G.stock[i] = 5; sfx.clack(5); } } }
    if (G.dead > 0) { G.dead -= dt; if (G.dead <= 0) S.finish([['CUSTOMERS SERVED', G.served], ['BEST STREAK', G.bestCombo], ['WRONG TAPS', G.wrong], ['TIME OPEN', Math.round(G.t) + 's'], ['VIP / DIAMOND', `${G.goldens} / ${G.diamonds}`]]); }
    /* rush hour every 35s */
    if (G.t - G.lastRush > 22 && G.t > 14) { G.lastRush = G.t; G.rush = 7; ui.say('RUSH HOUR!<small>customers pile in</small>'); sfx.golden(); }
    if (G.rush > 0) G.rush -= dt;
    G.spawnT -= dt; if (G.hearts > 0 && G.spawnT <= 0) { spawn(); G.spawnT = lerp(3.4, 1.15, clamp(G.t / 50, 0, 1)) * (G.rush > 0 ? .4 : 1) * rng(.8, 1.2); }
    for (let i = 0; i < 3; i++) {
      const c = G.cust[i]; if (!c) continue; c.t += dt;
      if (c.state === 'in') { const tx = SLOTS[i]; c.x += (tx - c.x) * Math.min(1, dt * 6); if (c.t > .7) { c.state = 'wait'; c.x = tx; } }
      else if (c.state === 'wait') { c.patience -= dt * (G.dead > 0 ? 0 : 1); if (c.mood > 0) c.mood -= dt * 3; if (c.patience <= 0) leave(c); }
      else if (c.state === 'happy') { c.x += (c.x < W / 2 ? -1 : 1) * 0 * dt; if (c.t > .9) G.cust[i] = null; }
      else if (c.state === 'angry') { c.x += (i === 0 ? -1 : i === 2 ? 1 : 0) * 70 * dt; if (c.t > .8) G.cust[i] = null; }
    }
    if (botOn) { G.bt = (G.bt || 0) + dt; if (G.bt > .62) { G.bt = 0; const c = G.cust.filter(q => q && q.state === 'wait').sort((a, b) => a.patience - b.patience)[0]; if (c) { const idx = c.need.map((n, k) => k).filter(k => !c.got[k]); const open = idx.find(k => G.restock[c.need[k]] <= 0); if (open != null) serve(c.need[open]); } } }
  }

  /* ---------- draw ---------- */
  function hatCol(i) { return ['#d8403a', '#3a6ad8', '#e8c43a', '#e8e8f0', '#3aa85a', '#8c58c8'][i]; }
  function draw() {
    g.clearRect(0, 0, W, H); g.save();
    if (G.shake > .3) g.translate(Math.round(rng(-G.shake, G.shake) * .5), Math.round(rng(-G.shake, G.shake) * .5));
    /* the market square, the awning, the counter */
    g.fillStyle = '#2a4a2a'; g.fillRect(0, 0, W, H); g.fillStyle = '#35603a'; for (let y = 34; y < COUNTER_Y; y += 10) for (let x = ((y / 10) % 2) * 6; x < W; x += 12) g.fillRect(x, y, 11, 9);
    for (let i = 0; i < 10; i++) { g.fillStyle = i % 2 ? '#e8e8f0' : '#3aa85a'; g.fillRect(i * 12, 12, 12, 14); } g.fillStyle = '#1a0f14'; g.fillRect(0, 26, W, 1); for (let i = 0; i < 10; i++) { g.fillStyle = i % 2 ? '#e8e8f0' : '#3aa85a'; g.fillRect(i * 12, 27, 12, 3); g.fillStyle = '#1a0f14'; g.fillRect(i * 12 + 5, 30, 2, 1); }
    g.fillStyle = '#1a0f14'; g.fillRect(0, COUNTER_Y, W, 12); g.fillStyle = '#b57d3e'; g.fillRect(0, COUNTER_Y + 1, W, 10); g.fillStyle = '#e8b878'; g.fillRect(0, COUNTER_Y + 1, W, 2); g.fillStyle = '#7a4a1e'; g.fillRect(0, COUNTER_Y + 9, W, 2);
    g.fillStyle = '#5a3517'; g.fillRect(0, COUNTER_Y + 12, W, H - COUNTER_Y - 12); g.fillStyle = '#4a2c14'; for (let y = COUNTER_Y + 16; y < H; y += 10) g.fillRect(0, y, W, 1);
    /* customers */
    for (const c of G.cust) {
      if (!c) continue; const cx = Math.round(c.x), sp = CRE[c.type], bob = c.state === 'in' ? -Math.round(Math.abs(Math.sin(c.t * 15)) * 3) : c.state === 'wait' ? Math.round(Math.sin(G.t * (c.patience / c.max < .35 ? 14 : 4) + c.slot) * (c.patience / c.max < .35 ? 1.2 : .6)) : c.state === 'happy' ? -Math.abs(Math.round(Math.sin(c.t * 14) * 3)) : 0;
      const top = COUNTER_Y - 4 + bob - 36, y = top;              /* customers are drawn at 2x so you can read them */
      g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(cx - 14, COUNTER_Y - 4, 29, 3);
      const t = cust2x; t.clearRect(0, 0, 17, 28); const X = 8, Y = 10;
      t.drawImage(sp, 0, Y);
      t.fillStyle = hatCol(c.hat); t.fillRect(X - 5, Y + 1, 11, 2); t.fillRect(X - 3, Y - 1, 7, 2); t.fillStyle = '#1a0f14'; t.fillRect(X - 6, Y + 3, 13, 1);
      if (c.kind === 'golden') { t.fillStyle = '#ffd23a'; t.fillRect(X - 4, Y - 5, 9, 3); t.fillRect(X - 4, Y - 7, 2, 2); t.fillRect(X - 1, Y - 8, 2, 3); t.fillRect(X + 3, Y - 7, 2, 2); t.fillStyle = '#b38004'; t.fillRect(X - 4, Y - 3, 9, 1); }
      if (c.kind === 'diamond') { t.fillStyle = '#9be8ff'; t.fillRect(X - 4, Y - 5, 9, 3); t.fillRect(X - 4, Y - 8, 2, 3); t.fillRect(X - 1, Y - 9, 2, 4); t.fillRect(X + 3, Y - 8, 2, 3); t.fillStyle = '#fff'; t.fillRect(X, Y - 5, 1, 1); if (Math.floor(G.t * 8) % 2) fx.spark(cx, top + 4, '#9be8ff'); }
      const rage = c.state === 'wait' && c.patience / c.max < .35 || c.state === 'angry';
      t.fillStyle = '#1a0f14'; if (rage) { t.fillRect(X - 5, Y + 6, 3, 1); t.fillRect(X + 3, Y + 6, 3, 1); t.fillRect(X - 2, Y + 13, 5, 1); t.fillRect(X - 3, Y + 14, 1, 1); t.fillRect(X + 3, Y + 14, 1, 1); } else if (c.state === 'happy' || c.mood > 0) { t.fillRect(X - 3, Y + 12, 7, 1); t.fillRect(X - 4, Y + 11, 1, 1); t.fillRect(X + 4, Y + 11, 1, 1); } else t.fillRect(X - 1, Y + 12, 3, 1);
      g.drawImage(cust2xCv, 0, 0, 17, 28, cx - 17, top - 20, 34, 56);
      if (c.state !== 'wait' && c.state !== 'in') continue;
      /* order bubble */
      const n = c.need.length, bw = n * 12 + 4, bx = clamp(Math.round(c.x - bw / 2), 1, W - bw - 1), by = y - 22 - (c.kind === 'normal' ? 0 : 8);
      g.fillStyle = '#1a0f14'; g.fillRect(bx - 1, by - 1, bw + 2, 16); g.fillStyle = c.kind === 'diamond' ? '#d6f0ff' : c.kind === 'golden' ? '#fff3b0' : '#fff6d6'; g.fillRect(bx, by, bw, 14); g.fillRect(cx - 1, by + 14, 3, 2); g.fillStyle = '#1a0f14'; g.fillRect(cx - 1, by + 16, 3, 1);
      c.need.forEach((f, i) => { const ix = bx + 2 + i * 12, done = c.got[i]; g.globalAlpha = done ? .3 : 1; g.drawImage(mini[f], ix, by + 2); g.globalAlpha = 1; if (done) { g.fillStyle = '#2f8a35'; g.fillRect(ix + 2, by + 8, 2, 2); g.fillRect(ix + 4, by + 9, 2, 2); g.fillRect(ix + 6, by + 6, 2, 3); g.fillRect(ix + 8, by + 3, 1, 4); } });
      /* patience bar */
      const fr = clamp(c.patience / c.max, 0, 1); g.fillStyle = '#1a0f14'; g.fillRect(cx - 9, COUNTER_Y - 2, 19, 3); g.fillStyle = fr > .55 ? '#74c648' : fr > .3 ? '#ffd23a' : (Math.floor(G.t * 8) % 2 ? '#e86a50' : '#c0392b'); g.fillRect(cx - 8, COUNTER_Y - 1, Math.round(17 * fr), 1);
    }
    /* flying fruit */
    for (const f of flies) { const k = f.t, x = lerp(f.x0, f.x1, k), y = lerp(f.y0, f.y1, k) - Math.sin(k * Math.PI) * 18; g.drawImage(mini[f.f], Math.round(x - 5), Math.round(y - 5)); }
    /* the bins */
    for (let i = 0; i < 5; i++) {
      const x = 4 + i * (BINW + 1), press = G.binPress[i] > 0 ? 1 : 0, y = BIN_Y + press;
      g.fillStyle = '#1a0f14'; g.fillRect(x, y, BINW, 48); g.fillStyle = '#8a5a2b'; g.fillRect(x + 1, y + 1, BINW - 2, 46); g.fillStyle = '#b57d3e'; g.fillRect(x + 1, y + 1, BINW - 2, 2); g.fillStyle = '#5a3517'; g.fillRect(x + 1, y + 44, BINW - 2, 3); for (let yy = y + 12; yy < y + 44; yy += 10) { g.fillStyle = '#7a4a1e'; g.fillRect(x + 1, yy, BINW - 2, 1); }
      const sp = FRUIT[i], px0 = x + BINW / 2; g.drawImage(sp, Math.round(px0 - sp.width / 2) - 4, y + 6 - (press ? 0 : 0)); g.drawImage(sp, Math.round(px0 - sp.width / 2) + 4, y + 3 + (i % 2) * 2); g.drawImage(sp, Math.round(px0 - sp.width / 2), y + 12);
      g.fillStyle = '#1a0f14'; g.fillRect(x + 4, y + 33, 14, 11); g.fillStyle = '#fff6d6'; g.fillRect(x + 5, y + 34, 12, 9); const f = FONT[String(i + 1)]; if (f) { g.fillStyle = '#1a0f14'; f.split('').forEach((b, q) => { if (b === '1') g.fillRect(x + 10 + (q % 3), y + 36 + Math.floor(q / 3), 1, 1); }); }
      for (let k = 0; k < 5; k++) { g.fillStyle = k < G.stock[i] ? '#74c648' : '#1a0f14'; g.fillRect(x + 3 + k * 4, y + 28, 3, 3); }
      if (G.stock[i] <= 0) { g.fillStyle = 'rgba(26,15,20,.72)'; g.fillRect(x + 1, y + 1, BINW - 2, 46); const lab = G.restock[i] > 0 ? 'WAIT' : 'EMPTY'; g.fillStyle = G.restock[i] > 0 ? '#ffd23a' : '#ff7a6a'; lab.split('').forEach((ch, k) => { const f = FONT[ch]; if (f) f.split('').forEach((b, q) => { if (b === '1') g.fillRect(x + 3 + k * 4 + (q % 3) - (lab.length === 4 ? -2 : 0), y + 12 + Math.floor(q / 3), 1, 1); }); }); if (G.restock[i] > 0) { g.fillStyle = '#ffd23a'; g.fillRect(x + 3, y + 22, Math.round(16 * (1 - G.restock[i] / .75)), 2); } }
      if (press) { g.fillStyle = 'rgba(255,246,214,.28)'; g.fillRect(x + 1, y + 1, BINW - 2, 46); }
    }
    if (G.rush > 0 && Math.floor(G.t * 4) % 2) { g.fillStyle = 'rgba(255,210,58,.07)'; g.fillRect(0, 0, W, H); }
    fx.draw(g); g.restore();
  }

  /* ---------- shell + input ---------- */
  const S = MG.shell({
    host, ui, id: 'stall', title: 'FRUIT<span>STALL</span>', sub: 'Serve the line before they lose patience.',
    legend: [[FRUIT[0], '<em>tap</em> a bin or press 1-5'], [CRE[0], '<em>fast</em> service = tips'], [CRE[1], '<em class="bad">angry</em> = -1 heart'], [FRUIT[4], '<em>bins</em> empty: tap to restock'], [A.golden, '<em>x3</em> golden VIP'], [A.diamond, '<em class="ice">x10</em> diamond customer']],
    hint: 'tap the fruit they ask for · keys 1-5', spaceStarts: true, onStart: () => newGame(), score: () => G.score,
  });
  addEventListener('pointerdown', ev => { if (!S.playing || ev.target.closest('.mg-over,.mg-nav')) return; const [px, py] = st.toArt(ev); if (py < BIN_Y - 6) return; const i = clamp(Math.floor((px - 3) / (BINW + 1)), 0, 4); serve(i); });
  addEventListener('keydown', e => { if (!S.playing) return; if (e.key >= '1' && e.key <= '5') { serve(+e.key - 1); e.preventDefault(); } });

  newGame(); S.title();
  if (params.get('autostart')) { S.start(); botOn = !!params.get('bot'); for (let i = 0, n = (+params.get('warp') || 0) * 60; i < n; i++) update(1 / 60); }
  if (params.get('dbg')) setInterval(() => { document.title = `served=${G.served} hearts=${G.hearts} score=${G.score} t=${Math.round(G.t)}`; }, 200);
  MG.loop(update, draw);
  window.FS = { get G() { return G; }, S, serve };
})();
