/* Hosted games report play, never read or write the factory save. The host (minigame-progression.js) draws the chrome around the game:
   name, reward, pause, sound and the way out. Inside the frame there is only the game itself, on the main game's panel. */
(() => {
  'use strict';
  const q = new URLSearchParams(location.search), game = q.get('game'), session = Number(q.get('session')), origin = q.get('origin');
  if (parent === window || q.get('hosted') !== 'mg01' || !/^[a-z]{3,10}$/.test(game || '') || !Number.isSafeInteger(session) || session < 1) return;
  if (origin != null && origin !== location.origin) return;                     /* same origin only: a foreign ?origin= leaves the game standalone */
  let bests = {}; try { bests = JSON.parse(q.get('bests') || '{}') || {}; } catch (e) { /* no bests */ }
  let shell, phase = 'title', mode, input = false, elapsed = 0, sent = 0, sequence = 0, ready;
  const score = () => { const n = Math.floor(Number(shell?.score?.())); return Number.isFinite(n) && n > 0 ? Math.min(n, 1e9) : 0; };
  const text = (v, n) => typeof v === 'string' && v.trim() ? v.trim().slice(0, n) : undefined;
  const send = (type, extra = {}) => parent.postMessage({ bridge:'mg01', game, session, sequence:++sequence, type, mode, elapsed, score:score(), ...extra }, location.origin);
  window.MGHosted = {
    skipTitle: q.get('skip') === '1',
    best: key => Number(bests[key]) || 0, setBest(key, value) { bests[key] = value; },
    attach(value) { shell = value; },
    start(value, callback) { mode = value; input = false; ready = callback; send('start'); },
    phase(value, selected) { phase = value; mode = selected; send('phase', { phase }); if (value !== 'play') input = false; },
    input() { if (phase === 'play' && !input) { input = true; send('input'); } },
    advance(dt) {
      if (phase !== 'play' || !input || document.hidden || !Number.isFinite(dt) || dt <= 0 || dt > .1) return;
      elapsed += dt;
      if (elapsed - sent >= .5) { sent = elapsed; send('progress'); }
    },
    /* grade (0..1, 3 decimals) only when the game is graded (repairs) */
    finish(final, grade) {
      const g = grade == null || grade === '' ? NaN : Number(grade);
      send('finish', { reason:'natural', score:Math.max(0, Math.min(1e9, Math.floor(Number(final)) || 0)), ...(Number.isFinite(g) ? { grade:Math.round(Math.max(0, Math.min(1, g)) * 1000) / 1000 } : {}) });
    },
    quit(reason) { send('quit', { reason:reason === 'done' ? 'done' : 'quit' }); }
  };
  addEventListener('message', e => {
    const d = e.data;
    if (e.origin !== location.origin || e.source !== parent || d?.bridge !== 'mg01' || d.game !== game || d.session !== session) return;
    if (d.type === 'start-ok' && ready) { const callback = ready; ready = null; callback(); }
    if (d.type === 'hold') shell?.pause();
    if (d.type === 'resume') shell?.resume();
    if (d.type === 'pause') { if (shell?.phase === 'play') shell.pause(); else if (shell?.phase === 'pause') shell.resume(); }
    if (d.type === 'mute') window.MG?.sfx.set(!!d.on);
    if (d.type === 'reward') shell?.reward?.({ total:Number(d.total) || 0, best:Number(d.best) || 0, label:text(d.label, 24), verdict:text(d.verdict, 16), note:text(d.note, 90) });
    if (d.type === 'quit-request') send('quit', { reason:'quit' });
    if (d.type === 'bank-request') send('bank', { reason:'bank' });
  });
  /* any real pointer or key action during play counts as input, so every game is hosted without changes of its own */
  for (const type of ['pointerdown', 'pointermove', 'keydown', 'touchstart']) addEventListener(type, e => { if (e.isTrusted !== false && !e.target?.closest?.('.mg-over,.mg-nav')) window.MGHosted.input(); }, true);
  document.documentElement.dataset.hosted = 'mg01';
  if (q.get('low') === '1' || q.get('reduce') === '1') {
    const style = document.createElement('style');
    style.textContent = '*{animation:none!important;transition:none!important}.drifters,.mg-confetti,.mg-float{display:none!important}.mg-legend div,.mg-stats>*,.mg-stars>*,.mg-verdict{opacity:1!important;transform:none!important}@keyframes mg01-banner{0%,90%{opacity:1}100%{opacity:0}}.mg-banner.show{animation:mg01-banner 2s linear!important;transform:none!important}';
    document.head.appendChild(style);
  }
  /* the game sits straight on the main game's wooden panel: no jungle, no back arrow, no sound button, a lighter frame, and a reward line on the game-over card */
  const style = document.createElement('style');
  style.textContent = `
    html,body.mg{background:transparent!important}
    body.mg{overflow:hidden;padding-top:0;min-height:100vh;min-height:100dvh}
    .backdrop,.mg-nav{display:none!important}
    .mg-wrap{animation:none}
    .mg-stage{outline:calc(var(--sc,3px)*1) solid #1a0f14;box-shadow:0 0 0 calc(var(--sc,3px)*2) #3a210d,0 0 0 calc(var(--sc,3px)*3) #c98f4a,0 0 0 calc(var(--sc,3px)*4) #1a0f14,0 calc(var(--sc,3px)*3) 0 calc(var(--sc,3px)*4) rgba(0,0,0,.4)}
    .mg-btn{min-width:44px;min-height:44px}
    .mg-btn:focus-visible{outline:3px solid #fff6d6;outline-offset:2px}
    .mg-over{overflow-y:auto;max-height:100%;box-sizing:border-box}
    .mg-reward{display:flex;flex-direction:column;align-items:center;gap:calc(var(--u)*3px);animation:mg-pop-in .35s steps(4) both}
    .mg-reward b{font-weight:400;font-size:max(18px,calc(var(--u)*30px));color:#ffe28a;text-shadow:3px 3px 0 var(--wood-dark)}
    .mg-reward span{font-size:max(8px,calc(var(--u)*9px));color:#fff6d6;letter-spacing:1px}
    .mg-reward em{font-style:normal;font-size:max(8px,calc(var(--u)*10px));color:#7be05a}
    .mg-reward i{font-style:normal;font-size:max(9px,calc(var(--u)*12px));color:#7be05a;text-shadow:2px 2px 0 var(--ink)}
    .mg-reward small{max-width:100%;font-family:var(--font-body);font-size:max(15px,calc(var(--u)*17px));line-height:1.05;color:#bff4ff;text-wrap:balance}
  `;
  document.head.appendChild(style);
})();
