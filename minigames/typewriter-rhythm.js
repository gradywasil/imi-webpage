/* ============================================================
   TYPEWRITER RHYTHM: keys fall down four lanes to a jungle beat; hit D F J K (or the arrow keys, or tap the lane) as each one reaches the line.
   Every hit plays a note of the tune, so you are playing the melody. Misses drain the ink; run out of ink and the shift is over.
   Three tunes (Easy / Normal / Hard). Rare: a Golden key doubles points for 8 seconds; a Diamond key plays itself for 6 seconds.
   Standalone: no connection to the main game's save yet.
   ============================================================ */
(() => {
  'use strict';
  const { rng, clamp, lerp, sfx, h } = MG;
  const W = 120, H = 208, LANES = 4, LW = 24, LX0 = 12, HIT_Y = 168, PERFECT = .065, GOOD = .12, MISS_AT = .15;
  const KEYS = ['D', 'F', 'J', 'K'], ALT = [['d', 'arrowleft'], ['f', 'arrowdown'], ['j', 'arrowup'], ['k', 'arrowright']];
  const LANE_FREQ = [440, 523.25, 587.33, 659.25];
  const params = new URLSearchParams(location.search), RARE = +params.get('rare') || 0;
  const SONGS = {
    easy: { label: 'JUNGLE GROOVE', bpm: 96, bars: 24, dens: .55, dbl: 0, fall: 1.75 },
    normal: { label: 'CARRIAGE RETURN', bpm: 118, bars: 30, dens: .75, dbl: .06, fall: 1.5 },
    hard: { label: 'BANANA RUSH', bpm: 146, bars: 36, dens: .95, dbl: .14, fall: 1.3 },
  };
  const ROOTS = [110, 130.81, 146.83, 164.81];

  MG.boot();
  const A = MGArt.build(), A3 = MGArt3.build(), { R, shapes: { ell } } = MGArt, make = MGArt3.make, { cvs, text, textW } = MGArt3;
  const host = document.getElementById('stage'), st = MG.stage(host, W, H, { padY: 40 }), g = st.g;
  host.style.cursor = 'pointer';
  const ui = MG.ui(host, st, MGArt.tile('K'), 0), fx = MG.fx();
  document.querySelector('.mg-hearts').style.display = 'none';
  /* the ink bar replaces the hearts */
  const ink = h('div', 'mg-ink'); ink.style.cssText = 'width:calc(var(--sc)*24);height:calc(var(--sc)*4);background:#1a0f14;box-shadow:0 0 0 calc(var(--sc)*.7) #5a3517;position:relative;margin-top:calc(var(--sc)*.5)';
  const inkFill = h('b'); inkFill.style.cssText = 'display:block;height:100%;background:#2a86b8;width:60%;box-shadow:inset 0 calc(var(--sc)*-1) 0 rgba(0,0,0,.3)'; ink.appendChild(inkFill); document.querySelector('.mg-hud').appendChild(ink);

  /* ---------- key caps (the notes and the keys under them), hi-res ---------- */
  const rectc = (x, c, a, b, w, h) => { x.fillStyle = c; x.fillRect(a, b, w, h); }, seeded = s0 => () => ((s0 = (s0 * 1664525 + 1013904223) >>> 0) / 4294967296);
  const capCache = {};
  function cap(ch, kind, down) {
    const id = ch + kind + (down ? 1 : 0); if (capCache[id]) return capCache[id];
    const face = { up: R.paper, hot: R.banY, gold: R.gold, ice: R.ice }[kind] || R.paper, dy = down ? 3 : 0;
    const cv = make(39, 42, px => { if (!down) px.shape(ell(19.5, 22.8, 19.5, 18.9), R.woodD, 1); px.shape(ell(19.5, 18.6 + dy, 19.5, 18), R.metal, 2); px.shape(ell(19.5, 17.4 + dy, 15, 14.4), face, 3); px.tone(12, 8 + dy, 2, 3); px.tone(13, 8 + dy, 2, 3); px.tone(11, 9 + dy, 2, 3); });
    text(cv.getContext('2d'), ch, 14.5, 10 + dy, '#1a0f14', 2);
    return (capCache[id] = cv);
  }
  /* the page the notes fall across (baked): paper with fibres, alternate lane tint, lane rules; and the carriage tray above it */
  const pageBg = cvs((LANES * LW + 6) * 3, H * 3, (x, tw, th) => {
    const r = seeded(33); rectc(x, '#1a0f14', 0, 0, tw, th); rectc(x, '#fff6d6', 6, 0, tw - 12, th);
    for (let i = 0; i < LANES; i += 2) rectc(x, '#ede0b8', 6 + i * LW * 3, 0, LW * 3, th);
    for (let i = 0; i < 240; i++) rectc(x, r() < .5 ? '#f2e6c0' : '#e6d8aa', 6 + Math.floor(r() * (tw - 12)), Math.floor(r() * th), 2 + Math.floor(r() * 3), 1);
    for (let i = 1; i < LANES; i++) { rectc(x, '#c9b88a', 6 + i * LW * 3, 0, 2, th); rectc(x, '#fff6d6', 8 + i * LW * 3, 0, 1, th); }
    rectc(x, '#e8a0a0', 8, 0, 1, th);
  });
  const trayBg = cvs((LANES * LW + 6) * 3, 28 * 3, (x, tw, th) => {
    const r = seeded(41); rectc(x, '#5a3517', 0, 0, tw, th); for (let i = 0; i < 40; i++) rectc(x, r() < .5 ? '#4a2a12' : '#6a4120', Math.floor(r() * (tw - 20)), 3 + Math.floor(r() * (th - 12)), 10 + Math.floor(r() * 26), 1);
    rectc(x, '#8a5a2b', 0, 0, tw, 5); rectc(x, '#a8723a', 0, 0, tw, 2); rectc(x, '#7a4a1e', 0, th - 9, tw, 6); rectc(x, '#1a0f14', 0, th - 3, tw, 3);
    for (const sx of [8, tw - 17]) { rectc(x, '#1a0f14', sx - 1, 8, 11, 11); rectc(x, '#c98f0e', sx, 9, 9, 9); rectc(x, '#ffd23a', sx, 9, 9, 2); rectc(x, '#5a3a06', sx + 4, 10, 1, 7); }
  });

  /* ---------- the chart: bars of sixteenth steps ---------- */
  const TEMPLATES = [[0, 4, 8, 12], [0, 2, 4, 6, 8, 10, 12, 14], [0, 3, 6, 8, 11, 14], [0, 4, 6, 8, 12, 14], [0, 2, 6, 8, 10, 14], [0, 4, 8, 10, 12], [0, 6, 8, 14], [0, 2, 4, 8, 12, 13, 14]];
  function makeChart(sg) {
    const step = 60 / sg.bpm / 4, notes = []; let last = -1, run = 0;
    for (let bar = 0; bar < sg.bars; bar++) {
      const t0 = (bar + 2) * 16 * step;                                      // two bars of count-in
      const tpl = bar % 4 === 3 ? TEMPLATES[Math.floor(Math.random() * 3)] : TEMPLATES[Math.floor(Math.random() * TEMPLATES.length)];
      for (const s of tpl) {
        if (Math.random() > sg.dens + (s % 4 === 0 ? .25 : 0)) continue;
        let lane; do { lane = Math.floor(Math.random() * LANES); } while (lane === last && run >= 2);
        run = lane === last ? run + 1 : 1; last = lane;
        const n = { t: t0 + s * step, lane, kind: 'note', hit: false, miss: false, step: bar * 16 + s + 32 };
        const r = Math.random(); if (bar > 3 && r < .02 + RARE * .08) n.kind = 'gold'; else if (bar > 8 && r < .026 + RARE * .05) n.kind = 'ice';
        notes.push(n);
        if (sg.dbl && Math.random() < sg.dbl && s % 4 === 0) { let l2; do { l2 = Math.floor(Math.random() * LANES); } while (l2 === lane); notes.push({ t: n.t, lane: l2, kind: 'note', hit: false, miss: false, step: n.step }); }
      }
    }
    return { notes, step, length: (sg.bars + 3) * 16 * step };
  }

  /* ---------- state ---------- */
  let G = null, botOn = false;
  const mk = { bob: 0, expr: 'normal', t: 0, blink: 0 }, keyDown = Array(LANES).fill(0), keyFlash = Array(LANES).fill(0);
  const songNow = () => G.song;
  function newGame(mode) {
    const sg = SONGS[mode] || SONGS.normal, ch = makeChart(sg);
    G = { mode, sg, ch, notes: ch.notes.sort((a, b) => a.t - b.t), song: -60 / sg.bpm * 4, score: 0, combo: 0, bestCombo: 0, perfect: 0, good: 0, miss: 0, ink: 60, gold: 0, auto: 0, goldens: 0, diamonds: 0, shake: 0, bg: 0, nextStep: -16, done: 0, typed: '', judge: null, over: false, failed: false, beatN: 0 };
    keyDown.fill(0); fx.clear(); render();
  }
  const mult = () => ui.mult(G.combo);
  function render() { ui.setScore(G.score); ui.setCombo(G.combo, mult()); inkFill.style.width = clamp(G.ink, 0, 100) + '%'; inkFill.style.background = G.ink < 25 ? '#c0392b' : '#2a86b8'; }

  /* ---------- the band: scheduled just ahead of the playhead ---------- */
  function band() {
    const step = G.ch.step, ahead = .28;
    while (G.nextStep * step - G.song < ahead) {
      const s = G.nextStep, ts = G.nextStep * step, delay = Math.max(0, ts - G.song), bar = Math.floor(s / 16), sp = ((s % 16) + 16) % 16, root = ROOTS[((bar % 4) + 4) % 4];
      if (s >= -16 && s < 0) { if (sp % 4 === 0) sfx.tone(sp === 0 ? 1200 : 900, sp === 0 ? 1200 : 900, .04, 'square', .03, delay); }
      else if (s >= 0) {
        if (sp === 0 || sp === 10 || (sp === 8 && bar % 2)) sfx.tone(120, 42, .16, 'sine', .11, delay);
        if (sp === 4 || sp === 12) sfx.noise(.09, .05, 2200, delay);
        if (sp % 2 === 0) sfx.noise(.025, .018, 6000, delay);
        if ([0, 3, 6, 8, 11, 14].includes(sp)) sfx.tone(root, root, .2, 'triangle', .09, delay);
        if (sp === 0 && bar % 2 === 0) { sfx.tone(root * 4, root * 4, .6, 'sine', .018, delay); sfx.tone(root * 6, root * 6, .6, 'sine', .014, delay); }
      }
      if (sp === 0 && s >= 0) G.pulse = ts;
      G.nextStep++;
    }
  }

  /* ---------- judging ---------- */
  function judge(n, dt) {
    const a = Math.abs(dt), perfect = a <= PERFECT || G.auto > 0; n.hit = true;
    let pts = perfect ? 10 : 5; G.combo++; G.bestCombo = Math.max(G.bestCombo, G.combo); if (perfect) G.perfect++; else G.good++;
    const m = mult() * (G.gold > 0 ? 2 : 1); let label = perfect ? 'PERFECT' : 'GOOD';
    if (n.kind === 'gold') { pts += 20; G.gold = 8; G.goldens++; sfx.golden(); ui.say('GOLDEN INK<small>double points · 8 seconds</small>'); fx.ring(laneX(n.lane), HIT_Y, '#ffd23a', 36); fx.burst(laneX(n.lane), HIT_Y, ['#ffd23a', '#fff08c', '#fffbe0'], 18, 80, 60, .8); }
    if (n.kind === 'ice') { pts += 30; G.auto = 6; G.diamonds++; sfx.diamond(); ui.doFlash('#e8fbff'); ui.say('DIAMOND SOLO<small>the typewriter plays itself · 6s</small>', 'ice'); fx.ring(laneX(n.lane), HIT_Y, '#9be8ff', 50); fx.burst(laneX(n.lane), HIT_Y, ['#9be8ff', '#fff'], 24, 100, 50, 1); }
    pts = Math.round(pts * m); G.score += pts; G.ink = Math.min(100, G.ink + (perfect ? 2.2 : 1.2));
    sfx.tone(LANE_FREQ[n.lane] * (G.combo % 8 === 0 ? 2 : 1), LANE_FREQ[n.lane], .14, 'square', .06); sfx.noise(.02, .04, 3000);
    fx.shock(laneX(n.lane), HIT_Y + 2, perfect ? '#fff08c' : '#9ce0ff', perfect ? 22 : 14); for (let i = 0; i < (perfect ? 5 : 2); i++) fx.burst(laneX(n.lane) + rng(-5, 5), HIT_Y - 2, perfect ? ['#fff08c', '#fff', '#ffd23a'] : ['#9ce0ff', '#fff'], 1, 26, -90, .5);
    keyFlash[n.lane] = .18; ui.bump(); G.typed = (G.typed + KEYS[n.lane]).slice(-14);
    fx.burst(laneX(n.lane), HIT_Y, perfect ? ['#fff08c', '#fff', '#ffd23a'] : ['#c9b88a', '#fff6d6'], perfect ? 7 : 4, 50, 80, .35);
    G.judge = { txt: label, t: .45, c: perfect ? '#fff08c' : '#9ce0ff', lane: n.lane }; mk.expr = perfect ? 'screech' : 'normal'; mk.t = .18;
    if (G.combo % 10 === 0) { ui.floatText(W / 2, 90, `${G.combo} COMBO!`, 'gold big'); ui.pulseCombo(); sfx.golden(); G.bg = .5; fx.confetti(W / 2, 90, 18); fx.shock(W / 2, 88, '#ffd23a', 44); }
    render();
  }
  function missNote(n) {
    fx.puff(laneX(n.lane), HIT_Y, '#8c8670', 3); n.miss = true; G.miss++; G.combo = 0; G.ink -= 9; sfx.miss(); G.judge = { txt: 'MISS', t: .5, c: '#ff7a6a', lane: n.lane }; mk.expr = 'scared'; mk.t = .4; G.shake = 1.5; render();
    if (G.ink <= 0 && !G.over) { G.over = true; G.failed = true; G.done = 1; sfx.over(); ui.say('OUT OF INK!', ''); }
  }
  function press(lane) {
    if (!S.playing || G.over) return; keyDown[lane] = .09; keyFlash[lane] = Math.max(keyFlash[lane], .06);
    let best = null, bd = 1e9; for (const n of G.notes) { if (n.lane !== lane || n.hit || n.miss) continue; const d = Math.abs(n.t - G.song); if (d < bd) { bd = d; best = n; } if (n.t - G.song > GOOD) break; }
    if (best && bd <= GOOD) judge(best, best.t - G.song); else { sfx.tone(180, 150, .05, 'square', .02); }
  }

  /* ---------- update ---------- */
  const laneX = l => LX0 + l * LW + LW / 2;
  function update(rdt) {
    fx.update(rdt);
    mk.blink -= rdt; if (mk.blink < -3.2) mk.blink = .14; if (mk.t > 0) { mk.t -= rdt; if (mk.t <= 0) mk.expr = 'normal'; }
    for (let i = 0; i < LANES; i++) { if (keyDown[i] > 0) keyDown[i] -= rdt; if (keyFlash[i] > 0) keyFlash[i] -= rdt; }
    if (!G || !S.playing) return;
    const dt = rdt; G.song += dt; G.shake = Math.max(0, G.shake - rdt * 16); if (G.bg > 0) G.bg -= dt; if (G.gold > 0) G.gold -= dt; if (G.judge) { G.judge.t -= dt; if (G.judge.t <= 0) G.judge = null; }
    if (G.auto > 0) G.auto -= dt;
    ui.setMeter(G.auto > 0 ? G.auto / 6 : G.gold / 8, G.auto > 0);
    band();
    mk.bob = G.pulse != null ? Math.max(0, 1 - (G.song - G.pulse) / (60 / G.sg.bpm)) : 0;
    for (const n of G.notes) {
      if (n.hit || n.miss) continue;
      if ((G.auto > 0 || botOn) && G.song >= n.t - (botOn ? rng(-.03, .04) : 0) && !G.over) { judge(n, 0); continue; }
      if (G.song - n.t > MISS_AT) { missNote(n); }
      if (n.t - G.song > G.sg.fall + .2) break;
    }
    if (!G.over && G.song > G.ch.length) { G.over = true; G.done = 1.2; }
    if (G.over && G.done > 0) { G.done -= dt; if (G.done <= 0) finishSong(); }
  }
  function finishSong() {
    const total = G.perfect + G.good + G.miss, acc = total ? (G.perfect + G.good * .5) / total : 0, rank = G.failed ? 'F' : acc > .95 ? 'S' : acc > .85 ? 'A' : acc > .7 ? 'B' : 'C';
    S.finish([['TUNE', G.sg.label], ['RANK', rank], ['ACCURACY', Math.round(acc * 100) + '%'], ['PERFECT / GOOD', `${G.perfect} / ${G.good}`], ['MISSES', G.miss], ['BEST COMBO', G.bestCombo], ['GOLD / DIAMOND', `${G.goldens} / ${G.diamonds}`]]);
  }

  /* ---------- draw ---------- */
  function draw() {
    g.clearRect(0, 0, W, H); g.save();
    if (G.shake > .3) g.translate(Math.round(rng(-G.shake, G.shake) * .5), Math.round(rng(-G.shake, G.shake) * .5));
    /* the page the notes fall across */
    st.hi(pageBg, LX0 - 3, 0); g.fillStyle = 'rgba(0,0,0,.08)'; for (let y = (G.song * 20) % 8; y < H; y += 8) g.fillRect(LX0, y, LANES * LW, .67);
    if (mk.bob > .05) { g.fillStyle = `rgba(255,230,150,${(mk.bob * .13).toFixed(2)})`; g.fillRect(LX0, 0, LANES * LW, H); }
    if (G.bg > 0) { g.fillStyle = `rgba(255,210,58,${G.bg * .3})`; g.fillRect(LX0, 0, LANES * LW, H); }
    if (G.gold > 0) { g.fillStyle = 'rgba(255,210,58,.12)'; g.fillRect(LX0, 0, LANES * LW, H); } if (G.auto > 0) { g.fillStyle = 'rgba(155,232,255,.16)'; g.fillRect(LX0, 0, LANES * LW, H); }
    /* hit line + flashes */
    g.fillStyle = '#7a4a1e'; g.fillRect(LX0 - 1, HIT_Y + 8, LANES * LW + 2, 3); g.fillStyle = '#b57d3e'; g.fillRect(LX0 - 1, HIT_Y + 8, LANES * LW + 2, 1.33); g.fillStyle = '#e8b878'; g.fillRect(LX0 - 1, HIT_Y + 8, LANES * LW + 2, .67);
    for (let i = 0; i < LANES; i++) { if (keyFlash[i] > 0) { g.fillStyle = `rgba(255,240,150,${(keyFlash[i] / .18 * .55).toFixed(2)})`; g.fillRect(LX0 + i * LW + 1, 40, LW - 1, HIT_Y - 32); } }
    /* paper typed so far (the melody you've played) */
    st.hi(trayBg, LX0 - 3, 0);
    /* notes */
    const fall = G.sg.fall, tray = HIT_Y - 28;
    for (let i = G.notes.length - 1; i >= 0; i--) {
      const n = G.notes[i]; if (n.hit) continue; const dt = n.t - G.song; if (dt > fall + .1 || dt < -.5) continue;
      const y = HIT_Y - dt / fall * (HIT_Y - 22); if (y < 14) continue;
      if (!n.miss) { for (let k = 1; k <= 7; k++) { g.fillStyle = `rgba(255,220,100,${(.32 - k * .04).toFixed(2)})`; g.fillRect(Math.round(laneX(n.lane)) - 3, Math.round(y) - 7 - k * 2, 6, 2); } }
      g.globalAlpha = n.miss ? .35 : 1; const kind = n.kind === 'gold' ? 'gold' : n.kind === 'ice' ? 'ice' : 'hot'; st.hi(cap(KEYS[n.lane], kind, false), laneX(n.lane) - 6.5, y - 7); g.globalAlpha = 1;
      if (n.kind !== 'note' && Math.floor(G.song * 10 + n.lane) % 2 === 0) fx.spark(laneX(n.lane), y, n.kind === 'ice' ? '#9be8ff' : '#fff08c');
    }
    /* the keys */
    for (let i = 0; i < LANES; i++) { const down = keyDown[i] > 0 || keyFlash[i] > .1; st.hi(cap(KEYS[i], 'up', down), laneX(i) - 6.5, HIT_Y - 6 + (down ? 1 : 0)); if (keyFlash[i] > 0) { g.fillStyle = `rgba(255,246,214,${keyFlash[i] / .18})`; g.fillRect(Math.round(laneX(i) - 8), HIT_Y - 8, 16, 1); } }
    /* judgement text */
    if (G.judge) { const j = G.judge, y = HIT_Y - 34 - (1 - j.t / .5) * 6; g.fillStyle = '#1a0f14'; const txt = j.txt, w = textW(txt, 2 / 3); g.fillRect(laneX(j.lane) - w / 2 - 1, y - 1, w + 2, 6.67); text(g, txt, laneX(j.lane) - w / 2, y, j.c, 2 / 3); }
    /* the dancing monkey up top */
    const dpose = mk.t > 0 && mk.expr === 'scared' ? 'scared' : mk.t > 0 && mk.expr === 'screech' ? 'cheer' : mk.bob > .55 ? 'launch' : mk.bob > .2 ? 'air' : 'idle';
    MGCrew.draw(st, dpose, W / 2, 27 - mk.bob * 2);    fx.draw(g); g.restore();
  }

  /* ---------- shell + input ---------- */
  const S = MG.shell({
    host, ui, id: 'rhythm', title: 'TYPEWRITER<span>RHYTHM</span>', sub: 'Play the keys to the beat.',
    legend: [[cap('D', 'hot'), '<em>D F J K</em> or arrows'], [cap('J', 'up', true), '<em>tap</em> a lane on touch'], [cap('F', 'gold'), '<em>x2</em> golden ink'], [cap('K', 'ice'), '<em class="ice">auto</em> diamond solo']],
    modes: Object.keys(SONGS).map((k, i) => ({ k, label: SONGS[k].label, cls: i === 1 ? 'banana-btn-green' : '' })), hint: 'miss too many and the ink runs out', spaceStarts: false,
    onStart: m => newGame(m), score: () => G.score, overTitle: 'SHIFT OVER',
  });
  addEventListener('pointerdown', ev => { if (!S.playing || ev.target.closest('.mg-over,.mg-nav')) return; const [px, py] = st.toArt(ev); if (px < LX0 || px > LX0 + LANES * LW || py < 28) return; press(clamp(Math.floor((px - LX0) / LW), 0, LANES - 1)); });
  addEventListener('keydown', e => { const k = e.key.toLowerCase(); if (e.repeat || e.ctrlKey || e.metaKey) return; const lane = ALT.findIndex(a => a.includes(k)); if (lane >= 0) { if (S.playing) { press(lane); e.preventDefault(); } } else if (k === ' ' && (S.phase === 'title' || S.phase === 'over')) { sfx.unlock(); S.start(); e.preventDefault(); } });

  newGame('normal'); S.title();
  if (params.get('autostart')) { S.start(params.get('mode') || 'normal'); botOn = !!params.get('bot'); for (let i = 0, n = (+params.get('warp') || 0) * 60; i < n; i++) update(1 / 60); }
  if (params.get('dbg')) setInterval(() => { document.title = `song=${G.song.toFixed(1)}/${G.ch.length.toFixed(1)} score=${G.score} combo=${G.combo} p=${G.perfect} g=${G.good} m=${G.miss} ink=${Math.round(G.ink)} over=${G.over}`; }, 200);
  MG.loop(update, draw);
  window.TR = { get G() { return G; }, S, press };
})();
