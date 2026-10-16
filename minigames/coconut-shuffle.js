/* ============================================================
   COCONUT SHUFFLE: the monkey hides a banana under a coconut shell, then shuffles. Tap (or press 1-5 / arrows + Space) the right shell.
   Rounds add shells and speed. Rare Golden and Diamond bananas are worth far more (the diamond only flashes for a moment).
   Standalone: no connection to the main game's save yet.
   ============================================================ */
(() => {
  'use strict';
  const { rng, clamp, lerp, sfx, h } = MG;
  const W = 120, H = 150, TABLE = 62, BASE = 106;
  const params = new URLSearchParams(location.search), RARE = +params.get('rare') || 0;

  MG.boot();
  PXA.monkeySets.sh = { k: .7, max: 0, step: 7 }; PXA.monkeySets.sh.angles = [0]; PXA.monkeySets.sh.cache = {};
  const A = MGArt.build(), { R, make, shapes: { ell, box, and, or } } = MGArt;
  const host = document.getElementById('stage'), st = MG.stage(host, W, H, { padY: 40 }), g = st.g;
  host.style.cursor = 'pointer';
  const ui = MG.ui(host, st, A.banana), fx = MG.fx();

  const shellSpr = make(22, 18, px => {
    px.shape(and(ell(11, 15, 10.6, 14), (x, y) => y <= 16), R.coco, 1);
    px.shape(box(0, 13.5, 22, 3), R.stem, 2);
    px.shape(or(ell(8, 8, .9, .9), ell(14, 8, .9, .9), ell(11, 11.4, .9, .9)), R.ink, 3);
    px.tone(5, 5, 2, 1); px.tone(6, 4, 2, 1);
  });

  /* ---------- state ---------- */
  let G = null, botOn = false;
  const dealer = { expr: 'normal', t: 0, blink: 0 };
  const slotX = (i, n) => W / 2 + (i - (n - 1) / 2) * (n <= 3 ? 36 : n === 4 ? 29 : 23);

  function newGame() {
    G = { round: 0, score: 0, hearts: 3, streak: 0, bestStreak: 0, cleared: 0, goldens: 0, diamonds: 0, shells: [], n: 3, stage: 'idle', st: 0, queue: [], swap: null, kind: 'normal', cursor: 1, shake: 0, pickT: 0, chosen: -1, result: null };
    fx.clear(); render();
  }
  const mult = () => 1 + Math.min(4, Math.floor(G.streak / 2)) * .5;
  function render(anim) { ui.setScore(G.score); ui.setHearts(G.hearts, anim); ui.setCombo(G.streak, mult()); }

  /* ---------- rounds ---------- */
  function nextRound() {
    G.round++; const r = G.round;
    G.n = r < 2 ? 3 : r < 4 ? 4 : 5;
    G.kind = r >= 5 && Math.random() < .03 + RARE * .5 ? 'diamond' : r >= 3 && Math.random() < .09 + RARE * .5 ? 'golden' : 'normal';
    const winner = Math.floor(Math.random() * G.n);
    G.shells = Array.from({ length: G.n }, (_, i) => ({ slot: i, lift: 0, banana: i === winner, bad: 0, hop: 0 }));
    const swaps = clamp(6 + Math.floor(r * 1.7), 6, 30) * (G.kind === 'diamond' ? 2 : 1);
    G.dur = clamp(.4 - r * .03, .085, .4) * (G.kind === 'diamond' ? .65 : 1);
    G.pickMax = r < 5 ? 0 : clamp(7 - (r - 5) * .45, 2.4, 7);                       /* a pick timer arrives from round 5 */
    G.queue = []; let last = '';
    for (let i = 0; i < swaps; i++) {
      let pairs, key;
      do {
        const idx = Array.from({ length: G.n }, (_, k) => k).sort(() => Math.random() - .5);
        pairs = [[idx[0], idx[1]]];
        if (r >= 3 && G.n >= 4 && Math.random() < Math.min(.55, .15 + r * .05)) pairs.push([idx[2], idx[3]]);     /* two swaps at once */
        key = pairs.map(q => Math.min(...q) + '' + Math.max(...q)).join('|');
      } while (key === last); last = key;
      G.queue.push({ pairs, fake: r >= 4 && Math.random() < Math.min(.28, .08 + r * .02) });                 /* a fake-out: they slide halfway and snap back */
    }
    G.cursor = Math.floor(G.n / 2); G.swap = null; G.chosen = -1;
    G.stage = 'intro'; G.st = 0; dealer.expr = 'normal';
    ui.say(G.kind === 'golden' ? `ROUND ${r}<small>GOLDEN BANANA · x5</small>` : G.kind === 'diamond' ? `ROUND ${r}<small>DIAMOND · blink and it's gone · x10</small>` : `ROUND ${r}`, G.kind === 'diamond' ? 'ice' : '');
    if (G.kind !== 'normal') sfx.golden();
  }

  /* ---------- pick ---------- */
  function pickSlot(slot) {
    if (G.stage !== 'pick' || slot < 0 || slot >= G.n) return;
    window.MGHosted?.input();
    const sh = G.shells.find(s => s.slot === slot), x = slotX(slot, G.n), ok = sh.banana;
    ui.setMeter(0); G.chosen = slot; G.stage = 'reveal'; G.st = 0; G.result = ok; sh.hop = .25;
    if (ok) {
      const quick = G.pickT < 2.2, base = 50 + 10 * G.round, k = G.kind === 'diamond' ? 10 : G.kind === 'golden' ? 5 : 1;
      G.streak++; G.bestStreak = Math.max(G.bestStreak, G.streak); G.cleared++;
      const pts = Math.round(base * k * mult() * (quick ? 1.25 : 1)); G.score += pts;
      ui.floatText(x, BASE - 26, '+' + pts, G.kind === 'diamond' ? 'ice big' : 'gold big'); if (quick) ui.floatText(x, BASE - 40, 'QUICK!', 'gold');
      ui.bump(); dealer.expr = 'scared'; dealer.t = 1.4;
      fx.burst(x, BASE - 8, ['#ffd23a', '#fff08c', '#fff6d6', '#74c648'], 22, 80, 120, .8); fx.ring(x, BASE - 8, '#ffd23a', 30);
      if (G.kind === 'golden') { G.goldens++; sfx.golden(); if (G.hearts < 3) { G.hearts++; ui.floatText(W / 2, 40, '+HEART', 'gold'); } }
      else if (G.kind === 'diamond') { G.diamonds++; sfx.diamond(); ui.doFlash('#e8fbff'); G.shake = 4; fx.ring(x, BASE - 8, '#9be8ff', 56); }
      else sfx.ding(Math.min(10, G.streak));
      if (G.streak > 0 && G.streak % 2 === 0) ui.pulseCombo();
    } else {
      G.streak = 0; G.hearts--; G.shake = 5; sh.bad = .4; sfx.bonk(); ui.doFlash('#c0392b'); ui.floatText(x, BASE - 26, 'NOPE -1', 'bad');
      fx.burst(x, BASE - 6, ['#563418', '#86592e', '#c0392b'], 12, 60, 160, .5); dealer.expr = 'screech'; dealer.t = 1.4;
    }
    render(true);
  }

  /* ---------- update ---------- */
  function update(dt) {
    fx.update(dt);
    dealer.blink -= dt; if (dealer.blink < -3.2) dealer.blink = .14;
    if (dealer.t > 0) { dealer.t -= dt; if (dealer.t <= 0) dealer.expr = 'normal'; }
    if (!G || !S.playing) return;
    G.st += dt; G.shake = Math.max(0, G.shake - dt * 20);
    G.shells.forEach(s => { if (s.hop > 0) s.hop -= dt; if (s.bad > 0) s.bad -= dt; });
    const lift = (to, rate = 60) => G.shells.forEach(s => { s.lift += clamp(to - s.lift, -rate * dt, rate * dt); });
    switch (G.stage) {
      case 'idle': nextRound(); break;
      case 'intro': lift(0); if (G.st > 1.1) { G.stage = 'show'; G.st = 0; sfx.tick(); } break;
      case 'show': {
        const hold = G.kind === 'diamond' ? .4 : clamp(.95 - G.round * .07, .3, .95);
        lift(G.st < hold + .25 ? 13 : 0, 70); if (G.st > hold + .25 + .35) { G.stage = 'shuffle'; G.st = 0; G.swap = null; } break;
      }
      case 'shuffle': {
        lift(0);
        if (!G.swap) { const q = G.queue.shift(); if (!q) { G.stage = 'pick'; G.st = 0; G.pickT = 0; ui.say('WHERE\'S THE BANANA?', '', 1); break; } G.swap = { pairs: q.pairs, fake: q.fake, t: 0 }; sfx.tick(); }
        G.swap.t += dt / G.dur;
        if (G.swap.t >= 1) {
          if (!G.swap.fake) for (const [a, b] of G.swap.pairs) {
            const sa = G.shells.find(s => s.slot === a), sb = G.shells.find(s => s.slot === b); sa.slot = b; sb.slot = a;
            fx.burst(slotX(a, G.n), BASE + 2, ['#c9b88a'], 2, 14, 30, .2); fx.burst(slotX(b, G.n), BASE + 2, ['#c9b88a'], 2, 14, 30, .2);
          }
          G.swap = null;
        }
        break;
      }
      case 'pick':
        G.pickT += dt; ui.setMeter(G.pickMax ? 1 - G.pickT / G.pickMax : 0, false);
        if (botOn && G.pickT > .6) pickSlot(G.shells.find(s => s.banana).slot);
        if (G.pickMax && G.pickT >= G.pickMax) { ui.setMeter(0); const wrong = G.shells.find(s => !s.banana); ui.floatText(W / 2, BASE - 40, 'TOO SLOW!', 'bad'); pickSlot(wrong.slot); }
        break;
      case 'reveal': {
        const win = G.shells.find(s => s.banana);
        G.shells.forEach(s => { const want = s.slot === G.chosen || (G.st > .55 && !G.result) || (G.st > .35 && G.result) ? 16 : 0; s.lift += clamp(want - s.lift, -80 * dt, 80 * dt); });
        if (G.st > 1.5) { if (G.hearts <= 0) { G.stage = 'dead'; S.finish([['ROUNDS', G.round - 1 + (G.result ? 1 : 0)], ['BEST STREAK', G.bestStreak], ['GOLD / DIAMOND', `${G.goldens} / ${G.diamonds}`]]); } else { G.stage = 'idle'; } }
        break;
      }
    }
  }

  /* ---------- draw ---------- */
  function draw() {
    g.clearRect(0, 0, W, H); g.save();
    if (G.shake > .3) g.translate(Math.round(rng(-G.shake, G.shake) * .5), Math.round(rng(-G.shake, G.shake) * .5));
    /* dealer monkey behind the table */
    const f = PXA.monkeyFrame('sh', dealer.t > 0 ? dealer.expr : dealer.blink > 0 ? 'blink' : 'normal', 0, false, 0, 0);
    const bob = G.stage === 'shuffle' ? Math.round(Math.sin(performance.now() / 70)) : 0;
    g.drawImage(f.cv, Math.round(W / 2 - f.pivot[0]), Math.round(TABLE + 6 - 41.5 * .7 - f.pivot[1] + bob));
    /* table */
    g.fillStyle = '#1a0f14'; g.fillRect(0, TABLE, W, H - TABLE);
    g.fillStyle = '#2f8a35'; g.fillRect(0, TABLE + 4, W, H - TABLE - 4);
    for (let y = TABLE + 4; y < H; y += 2) for (let x = (y / 2) % 2 * 2; x < W; x += 4) { g.fillStyle = '#287a30'; g.fillRect(x, y, 2, 1); }
    g.fillStyle = '#74c648'; for (let i = 0; i < 26; i++) g.fillRect((i * 41) % W, TABLE + 8 + (i * 67) % (H - TABLE - 12), 1, 1);
    g.fillStyle = '#b57d3e'; g.fillRect(0, TABLE, W, 4); g.fillStyle = '#e8b878'; g.fillRect(0, TABLE, W, 1); g.fillStyle = '#5a3517'; g.fillRect(0, TABLE + 3, W, 1);
    g.fillStyle = '#17481f'; g.fillRect(0, TABLE + 4, W, 1);
    /* banana (under the shell that holds it; shells draw over it) */
    const spr = G.kind === 'golden' ? A.golden : G.kind === 'diamond' ? A.diamond : A.banana;
    const items = G.shells.map(s => {
      let x = slotX(s.slot, G.n), dy = 0, z = 0;
      if (G.swap) {
        for (const [pa, pb] of G.swap.pairs) {
          if (s.slot !== pa && s.slot !== pb) continue;
          const t = clamp(G.swap.t, 0, 1), ar = s.slot === pa, to = slotX(ar ? pb : pa, G.n);
          const e = G.swap.fake ? Math.sin(t * Math.PI) * .55 : (t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
          x = lerp(x, to, clamp(e, 0, 1)); dy = Math.sin(t * Math.PI) * (ar ? 9 : -5); z = ar ? 1 : -1;
        }
      }
      const hop = s.hop > 0 ? -Math.sin((.25 - s.hop) / .25 * Math.PI) * 4 : 0, wob = s.bad > 0 ? (Math.floor(s.bad * 40) % 2 ? 2 : -2) : 0;
      return { s, x: x + wob, y: BASE + dy + hop, z };
    }).sort((a, b) => a.z - b.z || a.y - b.y);
    for (const it of items) {
      if (it.s.banana && (G.stage === 'show' || G.stage === 'reveal' || G.stage === 'intro' && false)) {
        g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(Math.round(it.x - 8), BASE + 1, 16, 2);
        g.drawImage(spr, Math.round(it.x - spr.width / 2), Math.round(BASE - spr.height + 3 - (G.stage === 'reveal' && G.result ? Math.abs(Math.sin(G.st * 6)) * 3 : 0)));
        if (G.kind !== 'normal' && Math.floor(performance.now() / 120) % 2 === 0) fx.spark(it.x, BASE - 8, G.kind === 'diamond' ? '#9be8ff' : '#fff08c');
      }
      g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(Math.round(it.x - 9), BASE + 3, 18, 2);
      g.drawImage(shellSpr, Math.round(it.x - 11), Math.round(it.y - 15 - it.s.lift));
    }
    /* cursor */
    if (G.stage === 'pick') { const x = slotX(G.cursor, G.n), b = Math.floor(performance.now() / 200) % 2; g.fillStyle = '#1a0f14'; g.fillRect(x - 3, BASE - 36 + b, 7, 4); g.fillStyle = '#ffd23a'; g.fillRect(x - 2, BASE - 36 + b, 5, 2); g.fillRect(x - 1, BASE - 34 + b, 3, 1); g.fillRect(x, BASE - 33 + b, 1, 1); }
    fx.draw(g);
    g.restore();
  }

  /* ---------- shell + input ---------- */
  const S = MG.shell({
    host, ui, id: 'shuffle', title: 'COCONUT<span>SHUFFLE</span>', sub: 'Watch the banana. Find the shell.',
    legend: [[A.banana, '<em>50+</em> per round'], [A.coconut, '<em class="bad">wrong</em> = -1 heart'], [A.golden, '<em>x5</em> golden round'], [A.diamond, '<em class="ice">x10</em> diamond flash']],
    hint: 'tap a shell · or 1-5 / ← → + Space', onStart: () => { newGame(); },
    score: () => G.score, spaceStarts: true,
  });
  addEventListener('pointerdown', ev => {
    if (!S.playing || ev.target.closest('.mg-over,.mg-nav')) return;
    const [px, py] = st.toArt(ev); if (G.stage !== 'pick' || py < TABLE - 10) return;
    let best = 0, bd = 1e9; for (let i = 0; i < G.n; i++) { const d = Math.abs(px - slotX(i, G.n)); if (d < bd) { bd = d; best = i; } }
    pickSlot(best);
  });
  addEventListener('pointermove', ev => { if (!S.playing || G.stage !== 'pick') return; const [px] = st.toArt(ev); let best = 0, bd = 1e9; for (let i = 0; i < G.n; i++) { const d = Math.abs(px - slotX(i, G.n)); if (d < bd) { bd = d; best = i; } } G.cursor = best; });
  addEventListener('keydown', e => {
    if (!S.playing || G.stage !== 'pick') return;
    if (['ArrowLeft','ArrowRight','a','d'].includes(e.key)) window.MGHosted?.input();
    if (e.key >= '1' && e.key <= '5') pickSlot(+e.key - 1);
    else if (e.key === 'ArrowLeft' || e.key === 'a') G.cursor = Math.max(0, G.cursor - 1);
    else if (e.key === 'ArrowRight' || e.key === 'd') G.cursor = Math.min(G.n - 1, G.cursor + 1);
    else if (e.key === ' ' || e.key === 'Enter') { pickSlot(G.cursor); e.preventDefault(); }
  });

  ['normal', 'scared', 'screech', 'blink'].forEach(e => PXA.monkeyFrame('sh', e, 0, false, 0, 0));
  newGame(); S.title();
  if (params.get('autostart')) { S.start(); botOn = !!params.get('bot'); for (let i = 0, n = (+params.get('warp') || 0) * 60; i < n; i++) update(1 / 60); }
  MG.loop(update, draw);
  window.CS = { get G() { return G; }, S };
})();
