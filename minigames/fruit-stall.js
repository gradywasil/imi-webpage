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
  const A = MGArt.build(), A3 = MGArt3.build(), { R, shapes: { ell, box, poly, or } } = MGArt, { cvs, text, textW } = MGArt3;
  const host = document.getElementById('stage'), st = MG.stage(host, W, H, { padY: 40 }), g = st.g;
  host.style.cursor = 'pointer';
  const ui = MG.ui(host, st, A3.banana), fx = MG.fx();
  const FRUIT = [A3.apple, A3.orange, A3.grapes, A3.pine, A3.bananaS], NAMES = ['APPLE', 'ORANGE', 'GRAPES', 'PINE', 'BANANA'], KEYC = ['#e86a50', '#f08a1a', '#b58cf0', '#f2b23a', '#ffd23a'];
  const rectc = (x, c, a, b, w, h) => { x.fillStyle = c; x.fillRect(a, b, w, h); }, seeded = s0 => () => ((s0 = (s0 * 1664525 + 1013904223) >>> 0) / 4294967296);

  /* the regulars are other crew members in their own costumes; the keeper out front is the player's monkey */
  const POOL = ['v02', 'v04', 'v05', 'v07', 'v10', 'v14', 'v16', 'v18', 'v23', 'v25', 'v27', 'v28', 'v30'].filter(v => v !== MGCrew.look()).concat(MGCrew.look() === 'v12' ? [] : ['v12']);
  const vendor = { t: 0, pose: 'idle' };

  /* the square behind the stall, baked: cobbled wall, a striped awning with a scalloped hem, hanging lanterns, then the counter and its plank front */
  const sceneBg = cvs(W * 3, H * 3, (x, tw, th) => {
    const r = seeded(17), CY = COUNTER_Y * 3;
    rectc(x, '#2a4a2a', 0, 0, tw, th);
    for (let y = 90; y < CY; y += 30) for (let xx = ((y / 30) % 2) * 18 - 18; xx < tw; xx += 36) { const sh = ['#35603a', '#315a36', '#3a683e'][Math.floor(r() * 3)]; rectc(x, sh, xx + 1, y + 1, 34, 28); rectc(x, '#3f7044', xx + 1, y + 1, 34, 1); rectc(x, '#244424', xx + 1, y + 28, 34, 1); if (r() < .4) rectc(x, '#2a4a2a', xx + 6 + Math.floor(r() * 18), y + 8 + Math.floor(r() * 12), 3, 1); }
    const aw = tw / 10;
    for (let i = 0; i < 10; i++) { const cx = i * aw; rectc(x, i % 2 ? '#f0f0f8' : '#3aa85a', cx, 30, aw + 1, 54); rectc(x, i % 2 ? '#fff' : '#74c648', cx, 30, aw, 4); rectc(x, i % 2 ? '#c4c4d4' : '#247a3c', cx, 74, aw, 10); }
    rectc(x, '#1a0f14', 0, 84, tw, 3);
    for (let i = 0; i < 10; i++) for (let j = 0; j < aw / 2; j++) { const hh = Math.round(Math.sqrt(Math.max(0, (aw / 2) * (aw / 2) - (j - aw / 4) * (j - aw / 4) * 4)) / 2.2); rectc(x, '#1a0f14', i * aw + j * 2, 87, 2, hh + 2); rectc(x, i % 2 ? '#f0f0f8' : '#3aa85a', i * aw + j * 2, 87, 2, hh); }
    for (const lx of [50, 200, 310]) { rectc(x, '#1a0f14', lx + 4, 124, 1, 14); rectc(x, '#1a0f14', lx - 1, 138, 11, 14); rectc(x, '#ffd23a', lx, 139, 9, 12); rectc(x, '#fff08c', lx + 2, 141, 5, 5); x.fillStyle = 'rgba(255,210,58,.12)'; for (let rr = 18; rr > 4; rr -= 4) { x.beginPath(); x.arc(lx + 4.5, 145, rr, 0, 6.3); x.fill(); } }
    rectc(x, '#1a0f14', 0, CY, tw, 36); rectc(x, '#b57d3e', 0, CY + 3, tw, 30); rectc(x, '#e8b878', 0, CY + 3, tw, 6); rectc(x, '#7a4a1e', 0, CY + 27, tw, 6); for (let i = 0; i < 40; i++) rectc(x, '#a8723a', Math.floor(r() * tw), CY + 10 + Math.floor(r() * 14), 10 + Math.floor(r() * 24), 1);
    rectc(x, '#5a3517', 0, CY + 36, tw, th - CY - 36); for (let y = CY + 48; y < th; y += 30) { rectc(x, '#4a2c14', 0, y, tw, 2); rectc(x, '#6a4120', 0, y + 2, tw, 1); } for (let i = 0; i < 50; i++) rectc(x, '#4a2c14', Math.floor(r() * tw), CY + 40 + Math.floor(r() * (th - CY - 44)), 6 + Math.floor(r() * 20), 1);
  });
  /* a fruit bin: slatted crate with a heaped pile, number plate, five stock pips */
  const binBg = cvs(BINW * 3, 48 * 3, (x, bw, bh) => {
    rectc(x, '#1a0f14', 0, 0, bw, bh); rectc(x, '#8a5a2b', 3, 3, bw - 6, bh - 6); rectc(x, '#b57d3e', 3, 3, bw - 6, 6); rectc(x, '#d09a58', 3, 3, bw - 6, 2); rectc(x, '#5a3517', 3, bh - 12, bw - 6, 9);
    for (let y = 36; y < bh - 12; y += 30) { rectc(x, '#7a4a1e', 3, y, bw - 6, 2); rectc(x, '#a8723a', 3, y + 2, bw - 6, 1); }
    for (const nx of [6, bw - 9]) { rectc(x, '#c0c0cc', nx, 8, 3, 3); rectc(x, '#f0f0f8', nx, 8, 1, 1); }
  });
  const miniFruit = FRUIT;

  /* ---------- state ---------- */
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
    G.cust[slot] = { slot, x: slot === 0 ? -14 : slot === 2 ? W + 14 : W / 2, type: Math.floor(Math.random() * POOL.length), hat: 0, need, got: need.map(() => false), kind, patience, max: patience, state: 'in', t: 0, born: G.t, mood: 0 };
    G.walked++; if (kind !== 'normal') { sfx.golden(); ui.say(kind === 'diamond' ? 'DIAMOND CUSTOMER!<small>one of everything · x10</small>' : 'GOLDEN VIP!<small>3 items · x3 tips</small>', kind === 'diamond' ? 'ice' : ''); }
    sfx.tick();
  }

  function serve(fruit) {
    if (!S.playing || G.dead) return; G.binPress[fruit] = .12; fx.burst(4 + fruit * (BINW + 1) + BINW / 2, BIN_Y + 6, [KEYC[fruit], '#fff6d6'], 3, 30, 90, .3);
    vendor.t = .35; vendor.pose = 'cheer'; if (G.restock[fruit] > 0) return;
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
  const stallPose = (c, rage) => c.state === 'in' ? (Math.floor(c.t * 8) % 2 ? 'run1' : 'run2') : c.state === 'happy' ? 'cheer' : c.state === 'angry' ? (Math.floor(c.t * 10) % 2 ? 'run1' : 'run2') : rage ? 'scared' : c.mood > 0 ? 'cheer' : Math.floor(G.t * 1.6 + c.slot) % 2 ? 'breathe' : 'idle';
  function draw() {
    g.clearRect(0, 0, W, H); g.save();
    if (G.shake > .3) g.translate(Math.round(rng(-G.shake, G.shake) * .5), Math.round(rng(-G.shake, G.shake) * .5));
    st.hi(sceneBg, 0, 0);
    /* customers: crew members queue up at the counter */
    for (const c of G.cust) {
      if (!c) continue; const cx = c.x, rage = c.state === 'wait' && c.patience / c.max < .35 || c.state === 'angry';
      const bob = c.state === 'in' ? -Math.abs(Math.sin(c.t * 15)) * 2 : c.state === 'wait' ? Math.sin(G.t * (rage ? 14 : 4) + c.slot) * (rage ? .8 : .3) : c.state === 'happy' ? -Math.abs(Math.sin(c.t * 14)) * 2 : 0;
      const foot = COUNTER_Y + 4 + bob, look = POOL[c.type % POOL.length], flipX = c.state === 'angry' ? c.slot !== 2 : c.state === 'in' ? c.x > SLOTS[c.slot] : c.slot === 2;
      g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(cx - 7, COUNTER_Y + 2, 15, 2);
      MGCrew.draw(st, stallPose(c, rage), cx, foot, { look, flip: flipX, hat: c.kind === 'normal' ? 0 : 5 });
      if (c.kind === 'diamond' && Math.floor(G.t * 8) % 2) fx.spark(cx, foot - 15, '#9be8ff');
      if (c.state !== 'wait' && c.state !== 'in') continue;
      /* order bubble */
      const n = c.need.length, iw = 13.5, bw = n * iw + 4, bx = clamp(Math.round(c.x - bw / 2), 1, W - bw - 1), by = foot - 13 - 28 - (c.kind === 'normal' ? 0 : 6);
      g.fillStyle = '#1a0f14'; g.fillRect(bx - 1, by - 1, bw + 2, 24); g.fillStyle = c.kind === 'diamond' ? '#d6f0ff' : c.kind === 'golden' ? '#fff3b0' : '#fff6d6'; g.fillRect(bx, by, bw, 22); g.fillRect(cx - 1, by + 22, 3, 2); g.fillStyle = '#1a0f14'; g.fillRect(cx - 1, by + 24, 3, 1);
      c.need.forEach((f, i) => { const sp = FRUIT[f], done = c.got[i], sw = sp.width / 3, sh = sp.height / 3; g.globalAlpha = done ? .3 : 1; st.hi(sp, bx + 2 + i * iw + (iw - 1 - sw) / 2, by + 11 - sh / 2); g.globalAlpha = 1; if (done) { g.fillStyle = '#2f8a35'; const ix = bx + 2 + i * iw; g.fillRect(ix + 3, by + 13, 2, 2); g.fillRect(ix + 5, by + 14, 2, 2); g.fillRect(ix + 7, by + 11, 2, 3); g.fillRect(ix + 9, by + 8, 1, 4); } });
      /* patience bar */
      const fr = clamp(c.patience / c.max, 0, 1); g.fillStyle = '#1a0f14'; g.fillRect(cx - 9, COUNTER_Y - 3, 19, 3); g.fillStyle = fr > .55 ? '#74c648' : fr > .3 ? '#ffd23a' : (Math.floor(G.t * 8) % 2 ? '#e86a50' : '#c0392b'); g.fillRect(cx - 8, COUNTER_Y - 2, 17 * fr, 1);
    }
    /* the keeper: the player's own monkey behind the bins */
    if (vendor.t > 0) vendor.t -= 1 / 60;
    MGCrew.draw(st, vendor.t > 0 ? 'cheer' : G.hearts <= 1 && S.playing ? 'scared' : Math.floor(G.t * 1.6) % 2 ? 'breathe' : 'idle', W / 2 + 4, BIN_Y - 1);
    /* flying fruit */
    for (const f of flies) { const k = f.t, x = lerp(f.x0, f.x1, k), y = lerp(f.y0, f.y1, k) - Math.sin(k * Math.PI) * 18, sp = FRUIT[f.f]; st.hi(sp, x - sp.width / 6, y - sp.height / 6); }
    /* the bins */
    for (let i = 0; i < 5; i++) {
      const x = 4 + i * (BINW + 1), press = G.binPress[i] > 0 ? 1 : 0, y = BIN_Y + press;
      st.hi(binBg, x, y);
      const sp = FRUIT[i], sw = sp.width / 3, sh = sp.height / 3, px0 = x + BINW / 2;
      st.hi(sp, px0 - sw / 2 - 5, y + 3); st.hi(sp, px0 - sw / 2 + 5, y + 1 + (i % 2) * 2); st.hi(sp, px0 - sw / 2, y + 8);
      g.fillStyle = '#1a0f14'; g.fillRect(x + 4, y + 29, 14, 12); g.fillStyle = '#fff6d6'; g.fillRect(x + 5, y + 30, 12, 10); text(g, String(i + 1), x + 8.2, y + 31.2, '#1a0f14', 1.3);
      for (let k = 0; k < 5; k++) { g.fillStyle = k < G.stock[i] ? '#74c648' : '#1a0f14'; g.fillRect(x + 3 + k * 3.8, y + 43, 3, 2.33); if (k < G.stock[i]) { g.fillStyle = '#a8ec76'; g.fillRect(x + 3 + k * 3.8, y + 43, 3, .67); } }
      if (G.stock[i] <= 0) { g.fillStyle = 'rgba(26,15,20,.72)'; g.fillRect(x + 1, y + 1, BINW - 2, 46); const lab = G.restock[i] > 0 ? 'WAIT' : 'EMPTY'; text(g, lab, x + BINW / 2 - textW(lab, .9) / 2, y + 14, G.restock[i] > 0 ? '#ffd23a' : '#ff7a6a', .9); if (G.restock[i] > 0) { g.fillStyle = '#ffd23a'; g.fillRect(x + 3, y + 25, 16 * (1 - G.restock[i] / .75), 2); } }
      if (press) { g.fillStyle = 'rgba(255,246,214,.28)'; g.fillRect(x + 1, y + 1, BINW - 2, 46); }
    }
    if (G.rush > 0 && Math.floor(G.t * 4) % 2) { g.fillStyle = 'rgba(255,210,58,.07)'; g.fillRect(0, 0, W, H); }
    fx.draw(g); g.restore();
  }

  /* ---------- shell + input ---------- */
  const S = MG.shell({
    host, ui, id: 'stall', title: 'FRUIT<span>STALL</span>', sub: 'Serve the line before they lose patience.',
    legend: [[FRUIT[0], '<em>tap</em> a bin or press 1-5'], [MGCrew.frame('idle', { look: POOL[0] }), '<em>fast</em> service = tips'], [MGCrew.frame('scared', { look: POOL[1] }), '<em class="bad">angry</em> = -1 heart'], [FRUIT[4], '<em>bins</em> empty: tap to restock'], [A3.golden, '<em>x3</em> golden VIP'], [A3.diamond, '<em class="ice">x10</em> diamond customer']],
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
