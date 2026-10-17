/* Hosted games report play, never read or write the factory save. */
(() => {
  'use strict';
  const q = new URLSearchParams(location.search), game = q.get('game'), session = Number(q.get('session'));
  if (parent === window || q.get('hosted') !== 'mg01' || !/^[a-z]{3,10}$/.test(game || '') || !Number.isSafeInteger(session) || session < 1) return;
  let shell, phase = 'title', mode, input = false, elapsed = 0, sent = 0, sequence = 0, ready;
  const send = (type, extra = {}) => parent.postMessage({ bridge:'mg01', game, session, sequence:++sequence, type, mode, elapsed, ...extra }, location.origin);
  window.MGHosted = {
    attach(value) { shell = value; },
    start(value, callback) { mode = value; input = false; ready = callback; send('start'); },
    phase(value, selected) { phase = value; mode = selected; send('phase', { phase }); if (value !== 'play') input = false; },
    input() { if (phase === 'play' && !input) { input = true; send('input'); } },
    advance(dt) {
      if (phase !== 'play' || !input || document.hidden || !Number.isFinite(dt) || dt <= 0 || dt > .1) return;
      elapsed += dt;
      if (elapsed - sent >= .5) { sent = elapsed; send('progress'); }
    },
    finish(score) { send('finish', { reason:'natural', score }); },
    quit() { send('quit', { reason:'quit' }); }
  };
  addEventListener('message', e => {
    const d = e.data;
    if (e.origin !== location.origin || e.source !== parent || d?.bridge !== 'mg01' || d.game !== game || d.session !== session) return;
    if (d.type === 'start-ok' && ready) { const callback = ready; ready = null; callback(); }
    if (d.type === 'hold') shell?.pause();
    if (d.type === 'resume') shell?.resume();
    if (d.type === 'quit-request') send('quit', { reason:'quit' });
    if (d.type === 'bank-request') send('bank', { reason:'bank' });
  });
  /* any real pointer or key action during play counts as input, so every game is hosted without changes of its own */
  for (const type of ['pointerdown', 'pointermove', 'keydown', 'touchstart']) addEventListener(type, e => { if (e.isTrusted !== false && !e.target?.closest?.('.mg-over,.mg-nav')) window.MGHosted.input(); }, true);
  document.addEventListener('click', e => {
    if (!e.target.closest('.mg-nav a')) return;
    e.preventDefault(); send('quit', { reason:'back' });
  }, true);
  document.documentElement.dataset.hosted = 'mg01';
  if (q.get('low') === '1' || q.get('reduce') === '1') {
    const style = document.createElement('style');
    style.textContent = '*{animation:none!important;transition:none!important}.drifters,.mg-confetti,.mg-float{display:none!important}.mg-legend div,.mg-stats>*{opacity:1!important;transform:none!important}@keyframes mg01-banner{0%,90%{opacity:1}100%{opacity:0}}.mg-banner.show{animation:mg01-banner 2s linear!important;transform:none!important}';
    document.head.appendChild(style);
  }
  const style = document.createElement('style');
  style.textContent = 'body.mg{overflow:hidden}.mg-nav a,.mg-nav button,.mg-btn{min-width:44px;min-height:44px}.mg-over{overflow-y:auto;max-height:100%;box-sizing:border-box}.mg-nav a:focus-visible,.mg-nav button:focus-visible,.mg-btn:focus-visible{outline:3px solid #fff6d6;outline-offset:2px}';
  document.head.appendChild(style);
})();
