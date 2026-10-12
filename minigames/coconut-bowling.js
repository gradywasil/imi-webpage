/* ============================================================
   COCONUT BOWLING: a full ten-frame game with real bowling scoring, played in three taps: stop the sliding coconut, stop the swinging aim,
   stop the power bar. Steer a little while it rolls (left/right or move the pointer). Bamboo pins; one pin in a while is Golden (+50 bonus),
   and the rare Diamond pin turns your next coconut into a diamond one that crushes everything it touches.
   Controls: tap / click / Space for each step. Standalone: no connection to the main game's save yet.
   ============================================================ */
(() => {
  'use strict';
  const { rng, clamp, lerp, sfx, h, spriteImg } = MG;
  const W = 120, H = 208, CX = 60, LANE = 30, PIT = 28, FOUL = 186;
  const params = new URLSearchParams(location.search), RARE = +params.get('rare') || 0;

  MG.boot();
  PXA.monkeySets.bw = { k: .5, max: 0, step: 7 }; PXA.monkeySets.bw.angles = [0]; PXA.monkeySets.bw.cache = {};
  const A = MGArt.build(), { R, make, shapes: { ell, box, poly, or } } = MGArt;
  const host = document.getElementById('stage'), st = MG.stage(host, W, H, { padY: 40 }), g = st.g;
  host.style.cursor = 'pointer';
  const ui = MG.ui(host, st, A.banana, 0), fx = MG.fx();
  document.querySelector('.mg-hearts').style.display = 'none';
  const frameBox = h('div', 'sc'); frameBox.append(h('b', '', 'FRAME 1')); document.querySelector('.mg-hud').appendChild(frameBox);
  const frameTxt = frameBox.querySelector('b'); frameTxt.style.minWidth = '0';

  const pinSpr = { normal: make(7, 12, px => { px.shape(or(ell(3.5, 3, 2.6, 2.6), ell(3.5, 8, 3.2, 3.8), box(2.5, 4, 2, 3)), R.paper, 1); px.shape(box(0, 5, 7, 1.4), R.red, 2); }),
    golden: make(7, 12, px => { px.shape(or(ell(3.5, 3, 2.6, 2.6), ell(3.5, 8, 3.2, 3.8), box(2.5, 4, 2, 3)), R.gold, 1); px.shape(box(0, 5, 7, 1.4), R.banY, 2); }),
    diamond: make(7, 12, px => { px.shape(or(ell(3.5, 3, 2.6, 2.6), ell(3.5, 8, 3.2, 3.8), box(2.5, 4, 2, 3)), R.ice, 1); px.shape(box(0, 5, 7, 1.4), R.ice, 2); }) };
  const lying = {}; for (const k in pinSpr) { const s = pinSpr[k], c = document.createElement('canvas'); c.width = s.height; c.height = s.width; const x = c.getContext('2d'); x.translate(0, s.width); x.rotate(-Math.PI / 2); x.drawImage(s, 0, 0); lying[k] = c; }
  const ballSpr = { normal: make(11, 11, px => { px.shape(ell(5.5, 5.5, 4.8, 4.8), R.coco, 1); px.shape(or(ell(4, 4, .8, .8), ell(7, 4, .8, .8), ell(5.5, 6.4, .8, .8)), R.ink, 2); px.tone(3, 2, 2, 1); }),
    diamond: make(11, 11, px => { px.shape(ell(5.5, 5.5, 4.8, 4.8), R.ice, 1); px.tone(3, 2, 2, 1); px.tone(4, 2, 2, 1); }) };

  const HOME = [[60, 74], [54, 66], [66, 66], [48, 58], [60, 58], [72, 58], [42, 50], [54, 50], [66, 50], [78, 50]];

  /* ---------- standard ten-pin scoring ---------- */
  function score(rolls) {
    const out = []; let i = 0, total = 0, pending = false;
    for (let f = 0; f < 10 && i < rolls.length; f++) {
      let r, t = null;
      if (f < 9) {
        if (rolls[i] === 10) { r = [10]; const b1 = rolls[i + 1], b2 = rolls[i + 2]; if (b1 != null && b2 != null && !pending) { total += 10 + b1 + b2; t = total; } else pending = true; i += 1; }
        else {
          r = [rolls[i]]; const b = rolls[i + 1];
          if (b != null) { r.push(b); const nx = rolls[i + 2]; if (rolls[i] + b === 10) { if (nx != null && !pending) { total += 10 + nx; t = total; } else pending = true; } else if (!pending) { total += rolls[i] + b; t = total; } i += 2; }
          else { pending = true; i += 1; }
        }
      } else {
        r = rolls.slice(i, i + 3); const need = r[0] === 10 || (r.length > 1 && r[0] + r[1] === 10) ? 3 : 2;
        if (r.length >= need && !pending) { total += r.reduce((x, y) => x + y, 0); t = total; } else pending = true;
      }
      out.push({ r, t });
    }
    return out;
  }
  /* live score: every finished total, plus the raw pins from frames still waiting on their bonus balls */
  function bowlTotal(rolls) { const fr = score(rolls); let t = 0, open = 0; for (const f of fr) { if (f.t != null) t = f.t; else open += f.r.reduce((x, y) => x + y, 0); } return t + open; }

  /* ---------- state ---------- */
  let G = null, botOn = false;
  const mk = { expr: 'normal', t: 0, blink: 0 };
  function newGame() {
    G = { rolls: [], frame: 0, ball: 0, up: Array(10).fill(true), kind: HOME.map(() => 'normal'), pins: [], bonus: 0, stage: 'pos', st: 0, t: 0, x: CX, ang: 0, pow: 0, bx: CX, by: 180, vx: 0, vy: 0, rolling: false, steer: 0, shake: 0, strikes: 0, spares: 0, gutters: 0, goldens: 0, diamonds: 0, dia: false, trail: [], settle: 0, done: 0, sweep: [], fell: 0, lastKnocked: 0, speedMul: 1, msg: null };
    setRack(true); fx.clear(); render();
  }
  function setRack(full) {
    if (full) {
      G.up = Array(10).fill(true); G.kind = HOME.map(() => 'normal');
      if (G.frame > 0 && Math.random() < .12 + RARE * .5) G.kind[Math.floor(Math.random() * 10)] = 'golden';
      if (G.frame > 1 && Math.random() < .035 + RARE * .5) G.kind[Math.floor(Math.random() * 10)] = 'diamond';
    }
    G.pins = HOME.map(([x, y], i) => ({ i, x, y, vx: 0, vy: 0, up: G.up[i], kind: G.kind[i], down: false, dir: 0 }));
  }
  const total = () => bowlTotal(G.rolls) + G.bonus;
  function render() { ui.setScore(total()); const f = Math.min(G.frame + 1, 10); frameTxt.textContent = `FRAME ${f}  BALL ${G.ball + 1}`; }

  /* ---------- the three-tap throw ---------- */
  const spd = () => 1 + G.frame * .06;
  function tap() {
    if (!S.playing || G.done) return;
    if (G.stage === 'pos') { G.stage = 'angle'; G.st = 0; sfx.tick(); }
    else if (G.stage === 'angle') { G.stage = 'power'; G.st = 0; sfx.tick(); }
    else if (G.stage === 'power') { launch(); }
  }
  function launch() {
    const p = G.pow, s = lerp(70, 205, p) * (G.dia ? 1.15 : 1);
    G.bx = G.x; G.by = 180; G.vx = Math.sin(G.ang) * s; G.vy = -Math.cos(G.ang) * s; G.rolling = true; G.diaRoll = G.dia; G.stage = 'roll'; G.st = 0; G.settle = 0; G.trail = []; G.fell = 0; G.gutter = false; G.hit = false;
    sfx.thud(); sfx.clack(6); G.pins.forEach(pn => { pn.down = false; }); mk.expr = 'normal';
  }

  /* ---------- physics ---------- */
  const BR = 4.8, PR = 3;
  function collide(a, b, ma, mb, e) {
    const dx = b.x - a.x, dy = b.y - a.y, rr = a.r + b.r, d2 = dx * dx + dy * dy; if (d2 >= rr * rr || d2 === 0) return false;
    const d = Math.sqrt(d2), nx = dx / d, ny = dy / d, over = rr - d; a.x -= nx * over * mb / (ma + mb); a.y -= ny * over * mb / (ma + mb); b.x += nx * over * ma / (ma + mb); b.y += ny * over * ma / (ma + mb);
    const rv = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny; if (rv > 0) return true;
    const j = -(1 + e) * rv / (1 / ma + 1 / mb); a.vx -= j * nx / ma; a.vy -= j * ny / ma; b.vx += j * nx / mb; b.vy += j * ny / mb; return true;
  }
  function physics(dt) {
    const ball = { x: G.bx, y: G.by, vx: G.vx, vy: G.vy, r: BR }, standing = G.pins.filter(p => p.up);
    const mass = G.dia ? 6 : 3.2;
    for (const pn of G.pins) { pn.r = PR; }
    for (let s = 0; s < 3; s++) {
      const h = dt / 3;
      if (G.rolling) {
        if (!G.gutter) { ball.vx += G.steer * 42 * h * (ball.y > 110 ? 1 : 0); }
        if (G.hit) ball.vy = Math.min(ball.vy, -32);       /* after the first hit the ball keeps rolling on into the pit */
        ball.x += ball.vx * h; ball.y += ball.vy * h;
        if (!G.gutter && Math.abs(ball.x - CX) > LANE + 1) { G.gutter = true; G.gutters++; fx.puff(ball.x, ball.y, '#8c8670', 5); ball.vx = 0; ball.x = CX + Math.sign(ball.x - CX) * (LANE + 5); ui.floatText(ball.x, ball.y - 6, 'GUTTER', 'bad'); sfx.miss(); mk.expr = 'scared'; mk.t = 1.4; }
        if (G.gutter) ball.x = CX + Math.sign(ball.x - CX) * (LANE + 5);
        if (ball.y <= PIT) { G.rolling = false; ball.vx = ball.vy = 0; }
      }
      for (const pn of G.pins) {
        if (!pn.up) continue;
        if (G.rolling && collide(ball, pn, mass, 1, .85)) { if (!G.hit) { G.hit = true; sfx.thud(); MG.hitstop(.06); fx.shock(ball.x, ball.y, '#fff6d6', 22); fx.confetti(ball.x, ball.y, 6, ['#fff6d6', '#e8b878']); } if (Math.hypot(pn.vx, pn.vy) > 8) pn.down = true; G.shake = Math.max(G.shake, G.dia ? 3 : 1.4); sfx.clack(Math.min(14, G.fell++)); }
        pn.x += pn.vx * h; pn.y += pn.vy * h; const damp = Math.max(0, 1 - 2.4 * h); pn.vx *= damp; pn.vy *= damp;
        if (pn.y < PIT + 4) { pn.y = PIT + 4; pn.vy = Math.abs(pn.vy) * .2; }
        if (Math.hypot(pn.x - HOME[pn.i][0], pn.y - HOME[pn.i][1]) > 4.5 || Math.hypot(pn.vx, pn.vy) > 20) { if (!pn.down) { pn.down = true; } }
        if (pn.down) { if (Math.abs(pn.vx) + Math.abs(pn.vy) > 4) pn.dir = Math.abs(pn.vx) > Math.abs(pn.vy) ? (pn.vx > 0 ? 1 : 3) : (pn.vy > 0 ? 2 : 0); }
      }
      for (let i = 0; i < G.pins.length; i++) for (let j = i + 1; j < G.pins.length; j++) {
        const a = G.pins[i], b = G.pins[j]; if (!a.up || !b.up) continue;
        if (collide(a, b, 1, 1, .8)) { if (Math.hypot(a.vx, a.vy) > 6) a.down = true; if (Math.hypot(b.vx, b.vy) > 6) b.down = true; }
      }
    }
    G.bx = ball.x; G.by = ball.y; G.vx = ball.vx; G.vy = ball.vy;
    for (const pn of G.pins) if (pn.up && pn.down && (pn.x < CX - LANE - 2 || pn.x > CX + LANE + 2)) { pn.vx *= .6; }
  }
  const moving = () => G.pins.some(p => p.up && Math.hypot(p.vx, p.vy) > 3) || G.rolling;

  /* ---------- after a roll ---------- */
  function endRoll() {
    const down = G.pins.filter(p => p.up && p.down); down.forEach(p => { G.up[p.i] = false; G.sweep.push({ x: p.x, y: p.y, k: p.kind, dir: p.dir, t: 0 }); });
    const n = down.length; G.rolls.push(n); if (G.diaRoll) G.dia = false;
    /* bonuses for special pins */
    for (const p of down) { if (p.kind === 'golden') { G.goldens++; G.bonus += 50; sfx.golden(); fx.burst(p.x, p.y, ['#ffd23a', '#fff08c', '#fffbe0'], 18, 80, 60, .8); ui.floatText(p.x, p.y - 8, 'GOLD PIN +50', 'gold'); } if (p.kind === 'diamond') { G.diamonds++; G.bonus += 200; G.dia = true; sfx.diamond(); ui.doFlash('#e8fbff'); fx.ring(p.x, p.y, '#9be8ff', 50); fx.burst(p.x, p.y, ['#9be8ff', '#fff'], 24, 100, 50, 1); ui.say('DIAMOND PIN<small>+200 · next coconut is unstoppable</small>', 'ice'); } }
    let label = null;
    const f = G.frame, standingNow = G.up.filter(Boolean).length;
    let nextFull = false, nextBall = G.ball + 1, nextFrame = f, over = false;
    if (f < 9) {
      if (G.ball === 0 && n === 10) { label = 'STRIKE'; G.strikes++; nextFull = true; nextBall = 0; nextFrame = f + 1; }
      else if (G.ball === 0) { nextBall = 1; }
      else { if (standingNow === 0) { label = 'SPARE'; G.spares++; } nextFull = true; nextBall = 0; nextFrame = f + 1; }
    } else {
      if (G.ball === 0) { if (n === 10) { label = 'STRIKE'; G.strikes++; nextFull = true; } nextBall = 1; }
      else if (G.ball === 1) { const a = G.rolls[G.rolls.length - 2]; if (a === 10) { if (n === 10) { label = 'STRIKE'; G.strikes++; nextFull = true; } nextBall = 2; } else if (a + n === 10) { label = 'SPARE'; G.spares++; nextFull = true; nextBall = 2; } else over = true; }
      else { if (n === 10 || standingNow === 0) { label = n === 10 ? 'STRIKE' : 'SPARE'; if (n === 10) G.strikes++; } over = true; }
    }
    if (label) cheer(label); else if (n === 0 && !G.gutter) { ui.floatText(CX, 120, 'MISS', 'bad'); }
    if (n > 0 && !label) ui.floatText(CX, 110, `${n} PIN${n > 1 ? 'S' : ''}`, n >= 7 ? 'gold' : '');
    G.ball = nextBall; G.frame = nextFrame; render();
    if (over || G.frame > 9) { G.done = 1.4; sfx.over(); return; }
    G.next = { full: nextFull }; G.stage = 'between'; G.st = 0;
  }
  function cheer(label) {
    if (label === 'STRIKE') { MG.hitstop(.12); fx.confetti(CX, 62, 40); fx.shock(CX, 60, '#ffd23a', 60); sfx.golden(); G.shake = 5; ui.say('STRIKE!', ''); fx.ring(CX, 60, '#ffd23a', 50); fx.burst(CX, 60, ['#ffd23a', '#fff08c', '#fff6d6', '#74c648'], 30, 100, 80, 1); mk.expr = 'screech'; mk.t = 1.6; ui.doFlash('#fff6d6'); }
    else { fx.confetti(CX, 62, 18, ['#74c648', '#a8ec76', '#fff']); sfx.letters(); ui.say('SPARE!', ''); fx.burst(CX, 60, ['#74c648', '#a8ec76', '#fff'], 18, 70, 70, .8); mk.expr = 'screech'; mk.t = 1; }
  }

  /* ---------- update ---------- */
  function update(rdt) {
    fx.update(rdt);
    mk.blink -= rdt; if (mk.blink < -3.2) mk.blink = .14; if (mk.t > 0) { mk.t -= rdt; if (mk.t <= 0) mk.expr = 'normal'; }
    for (let i = G.sweep.length - 1; i >= 0; i--) { G.sweep[i].t += rdt; if (G.sweep[i].t > 1) G.sweep.splice(i, 1); }
    if (!G || !S.playing) return;
    const dt = rdt; G.t += dt; G.st += dt; G.shake = Math.max(0, G.shake - rdt * 18);
    if (G.done > 0) { G.done -= dt; if (G.done <= 0) finish(); return; }
    const m = spd();
    if (G.stage === 'pos') G.x = CX + Math.sin(G.st * 3.2 * m) * (LANE - 6);
    else if (G.stage === 'angle') G.ang = Math.sin(G.st * 3.6 * m) * .33;
    else if (G.stage === 'power') G.pow = (Math.sin(G.st * 3.4 * m - Math.PI / 2) + 1) / 2;
    else if (G.stage === 'roll') {
      physics(dt); if (G.rolling && !G.gutter) { G.trail.push([G.bx, G.by]); if (G.trail.length > 8) G.trail.shift(); if (Math.random() < .5) fx.puff(G.bx + rng(-2, 2), G.by + 5, G.dia ? '#9be8ff' : '#e8c890', 1); }
      for (const pn of G.pins) if (pn.up && pn.down && Math.hypot(pn.vx, pn.vy) > 30 && Math.random() < .5) fx.trail(pn.x, pn.y, '#fff6d6');
      if (!moving()) { G.settle += dt; if (G.settle > .55) { G.stage = 'resolve'; endRoll(); } } else G.settle = 0;
    }
    else if (G.stage === 'between') { if (G.st > 1.1) { setRack(G.next.full); G.stage = 'pos'; G.st = 0; G.x = CX; G.pow = 0; render(); } }
    if (botOn && ['pos', 'angle', 'power'].includes(G.stage)) bot();
  }
  function bot() {
    G.bt = (G.bt || 0) + 1 / 60; if (G.bt < .25) return; G.bt = 0;
    if (G.stage === 'pos') { if (Math.abs(G.x - CX) < 14) tap(); } else if (G.stage === 'angle') { const want = Math.atan2(CX + rng(-4, 4) - G.x, 120); if (Math.abs(G.ang - want) < .05) tap(); } else if (G.stage === 'power') { if (G.pow > .72 && G.pow < .88) tap(); }
  }
  function finish() {
    const fr = score(G.rolls);
    S.finish([['STRIKES', G.strikes], ['SPARES', G.spares], ['GUTTERS', G.gutters], ['BONUS PINS', `${G.goldens} gold · ${G.diamonds} diamond`], ['BOWLING SCORE', bowlTotal(G.rolls)], ['BONUS', G.bonus]]);
  }

  /* ---------- draw ---------- */
  function digits(txt, x, y, col) { g.fillStyle = col; txt.split('').forEach((ch, k) => { const f = MGArt.FONT[ch]; if (f) f.split('').forEach((b, i) => { if (b === '1') g.fillRect(x + k * 4 + (i % 3), y + Math.floor(i / 3), 1, 1); }); }); }
  function draw() {
    g.clearRect(0, 0, W, H); g.save();
    if (G.shake > .3) g.translate(Math.round(rng(-G.shake, G.shake) * .5), Math.round(rng(-G.shake, G.shake) * .5));
    /* alley: rails, gutters, wooden lane with arrows, pit */
    g.fillStyle = '#1a0f14'; g.fillRect(0, 0, W, H); g.fillStyle = '#0a2a1c'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#5a3517'; g.fillRect(CX - LANE - 14, 20, 14, H - 20); g.fillRect(CX + LANE, 20, 14, H - 20); g.fillStyle = '#b57d3e'; g.fillRect(CX - LANE - 14, 20, 2, H - 20); g.fillRect(CX + LANE, 20, 2, H - 20);
    g.fillStyle = '#1a0f14'; g.fillRect(CX - LANE - 8, 24, 8, H - 24); g.fillRect(CX + LANE, 24, 8, H - 24); g.fillStyle = '#2a170b'; g.fillRect(CX - LANE - 6, 24, 4, H - 24); g.fillRect(CX + LANE + 2, 24, 4, H - 24);
    for (let i = 0; i < 12; i++) { g.fillStyle = i % 2 ? '#e8b878' : '#d9a05c'; g.fillRect(CX - LANE + i * 5, PIT, 5, H - PIT); } g.fillStyle = '#b57d3e'; for (let i = 0; i <= 12; i++) g.fillRect(CX - LANE + i * 5, PIT, 1, H - PIT);
    g.fillStyle = '#7a4a1e'; for (const [x, y] of [[-10, 140], [-5, 146], [0, 152], [5, 146], [10, 140]]) g.fillRect(CX + x - 1, y, 3, 6);
    g.fillStyle = '#e8b878'; g.fillRect(CX - LANE, FOUL + 2, LANE * 2, 2); g.fillStyle = '#1a0f14'; g.fillRect(CX - LANE, FOUL + 4, LANE * 2, 1);
    g.fillStyle = '#0c0608'; g.fillRect(CX - LANE - 8, 14, LANE * 2 + 16, 14); g.fillStyle = '#2a170b'; g.fillRect(CX - LANE - 8, 14, LANE * 2 + 16, 2);
    /* pin shadows + standing pins, back to front */
    const pins = G.pins.filter(p => p.up && !p.down).sort((a, b) => a.y - b.y);
    for (const p of pins) { g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(Math.round(p.x - 3), Math.round(p.y + 4), 7, 2); }
    for (const p of G.pins.filter(p => p.up && p.down)) { const s = lying[p.kind]; g.drawImage(s, Math.round(p.x - s.width / 2), Math.round(p.y - s.height / 2)); }
    for (const p of pins) { const s = pinSpr[p.kind]; g.drawImage(s, Math.round(p.x - 3.5), Math.round(p.y - 9)); if (p.kind !== 'normal' && Math.floor(G.t * 8 + p.i) % 2 === 0) fx.spark(p.x, p.y - 4, p.kind === 'diamond' ? '#9be8ff' : '#fff08c'); }
    for (const s of G.sweep) { g.globalAlpha = 1 - s.t; const sp = lying[s.k]; g.drawImage(sp, Math.round(s.x - sp.width / 2), Math.round(s.y - sp.height / 2 - s.t * 18)); g.globalAlpha = 1; }
    /* trail + ball */
    for (let i = 0; i < G.trail.length; i++) { g.globalAlpha = i / G.trail.length * .4; g.fillStyle = G.dia ? '#9be8ff' : '#563418'; g.fillRect(Math.round(G.trail[i][0]) - 2, Math.round(G.trail[i][1]) - 2, 5, 5); } g.globalAlpha = 1;
    const showBall = G.stage !== 'between' && G.stage !== 'resolve' && (G.stage !== 'roll' || G.rolling);
    if (showBall) { const bx = G.stage === 'roll' ? G.bx : G.x, by = G.stage === 'roll' ? G.by : 180, s = ballSpr[G.dia ? 'diamond' : 'normal']; g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(Math.round(bx - 4), Math.round(by + 4), 9, 2); g.drawImage(s, Math.round(bx - 5.5), Math.round(by - 5.5)); }
    /* aim arrow + power bar */
    if (G.stage === 'angle' || G.stage === 'power') { const len = 56; for (let i = 6; i < len; i += 3) { g.fillStyle = i < 48 ? '#fff6d6' : '#ffd23a'; g.fillRect(Math.round(G.x + Math.sin(G.ang) * i), Math.round(180 - Math.cos(G.ang) * i), 2, 2); } }
    if (G.stage === 'power') { const bx = 26, bw = 68; g.fillStyle = '#1a0f14'; g.fillRect(bx - 1, 196, bw + 2, 7); g.fillStyle = '#2f8a35'; g.fillRect(bx + Math.round(bw * .72), 197, Math.round(bw * .16), 5); g.fillStyle = '#5a3517'; g.fillRect(bx, 197, Math.round(bw * .72), 5); g.fillRect(bx + Math.round(bw * .88), 197, Math.round(bw * .12), 5); g.fillStyle = '#fff'; g.fillRect(bx + Math.round(bw * G.pow) - 1, 195, 3, 9); }
    if (G.stage === 'pos') { g.fillStyle = 'rgba(255,246,214,.5)'; for (let x = CX - LANE + 4; x < CX + LANE - 3; x += 4) g.fillRect(x, 184, 2, 1); }
    /* monkey bowler waiting by the foul line */
    const f = PXA.monkeyFrame('bw', mk.t > 0 ? mk.expr : mk.blink > 0 ? 'blink' : 'normal', 0, false, 0, 0), mx = G.stage === 'roll' || G.stage === 'between' ? CX : G.x;
    if (G.stage !== 'power') g.drawImage(f.cv, Math.round(mx - f.pivot[0]), 192 - 6 + (G.stage === 'between' ? 0 : 0));
    fx.draw(g); g.restore();
  }

  /* ---------- shell + input ---------- */
  const S = MG.shell({
    host, ui, id: 'bowling', title: 'COCONUT<span>BOWLING</span>', sub: 'Ten frames. Three taps a throw.',
    legend: [[ballSpr.normal, '<em>3 taps</em> slide, aim, power'], [pinSpr.normal, '<em>10</em> bamboo pins'], [pinSpr.golden, '<em>+50</em> golden pin'], [pinSpr.diamond, '<em class="ice">+200</em> diamond pin']],
    hint: 'tap / click / Space · steer while it rolls with ← → or the pointer', spaceStarts: false, onStart: () => newGame(), score: () => total(),
  });
  addEventListener('pointerdown', ev => { if (ev.target.closest('.mg-over,.mg-nav')) return; tap(); });
  addEventListener('pointermove', ev => { if (S.playing && G.stage === 'roll') { const [px] = st.toArt(ev); G.steer = clamp((px - G.bx) / 30, -1, 1); } });
  addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    if (k === ' ' || k === 'enter') { if (S.playing) { if (!e.repeat) tap(); } else if (k === ' ' && !e.repeat && (S.phase === 'title' || S.phase === 'over')) { sfx.unlock(); S.start(); } e.preventDefault(); }
    else if (k === 'arrowleft' || k === 'a') G.steer = -1; else if (k === 'arrowright' || k === 'd') G.steer = 1;
  });
  addEventListener('keyup', e => { const k = e.key.toLowerCase(); if (['arrowleft', 'a', 'arrowright', 'd'].includes(k)) G.steer = 0; });

  ['normal', 'scared', 'screech', 'blink'].forEach(e => PXA.monkeyFrame('bw', e, 0, false, 0, 0));
  newGame(); S.title();
  if (params.get('autostart')) { S.start(); botOn = !!params.get('bot'); for (let i = 0, n = (+params.get('warp') || 0) * 60; i < n; i++) update(1 / 60); }
  if (params.get('dbg')) setInterval(() => { document.title = `rolls=${G.rolls.join(",")} score=${total()} stage=${G.stage} done=${G.done} ball=${Math.round(G.bx)},${Math.round(G.by)} v=${Math.round(G.vx)},${Math.round(G.vy)} rolling=${G.rolling} mov=${G.pins.filter(p=>p.up&&Math.hypot(p.vx,p.vy)>3).length}`; }, 200);
  MG.loop(update, draw);
  window.CB = { get G() { return G; }, S, score };
})();
