/* Ordinary bananas live in the room, separate from decorative reward particles. */
(() => {
  'use strict';
  const IMI = window.IMI, reward = IMI?.ops?.pickup;
  if (!reward || window.__OPS_HEADLESS) return;
  let active = null, next = performance.now() + 20000;
  const clear = () => { if (active) { clearTimeout(active.timer); active.anim?.cancel(); active.el.remove(); active = null; } };
  const eligible = () => IMI.screen() === 'game' && !document.hidden && reward.eligible()
    && !IMI.tour?.active() && !document.querySelector('.o-modal, .o-celebrate, .set-pop:not([hidden])');

  function position() {
    const size = 48, travels = IMI.reduceMotion || IMI.fx.low ? [0] : [60, 0];
    const blockers = [...document.querySelectorAll('#rail, #oTw, #oTray, #oGoal, #oDesks, .o-hopper, .tour-bub, button, a, input, select, textarea')]
      .filter(el => el.getClientRects().length && !el.closest('[hidden]'))
      .map(el => el.getBoundingClientRect());
    const left = (document.querySelector('#rail')?.getBoundingClientRect().right || 0) + 6;
    const width = innerWidth - left - size - 6;
    for (const travel of travels) {
      const height = innerHeight - size - travel - 12;
      if (width <= 0 || height <= 0) continue;
      for (let i = 0; i < 30; i++) {
        const x = left + Math.random() * width, y = 6 + Math.random() * height;
        if (blockers.some(r => x < r.right + 5 && x + size > r.left - 5 && y - (travel ? 12 : 0) < r.bottom + 5 && y + size + travel > r.top - 5)) continue;
        const hit = document.elementFromPoint(x + size / 2, y + size / 2);
        if (hit?.closest('#oStage, .backdrop, #opsRoot')) return { x, y, travel };
      }
    }
    return null;
  }
  function spawn() {
    if (active || !eligible()) return false;
    const at = position(); if (!at) return false;
    const value = reward.value(), el = document.createElement('button');
    el.type = 'button'; el.className = 'o-pickup';
    el.style.left = at.x + 'px'; el.style.top = at.y + 'px';
    el.setAttribute('aria-label', `Collect banana: ${IMI.exact(value)} bananas`);
    el.title = `Collect ${IMI.exact(value)} bananas`;
    el.appendChild(IMI.bananaEl(1.5));
    const label = document.createElement('small'); label.textContent = '+' + IMI.fmt(value); el.appendChild(label);
    document.body.appendChild(el);
    const item = { el, value, timer: setTimeout(clear, 14000), anim: null }; active = item;
    if (at.travel) item.anim = el.animate([
      { transform: 'translateY(-12px)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1, offset: .1 },
      { transform: 'translateY(48px)', opacity: 1, offset: .9 }, { transform: 'translateY(60px)', opacity: 0 }
    ], { duration: 14000, easing: IMI.edition === 'pixel' ? 'steps(28)' : 'linear' });
    el.addEventListener('pointerdown', e => e.stopPropagation());
    el.addEventListener('keydown', e => e.stopPropagation());
    el.addEventListener('click', e => {
      e.stopPropagation(); if (active !== item || !eligible()) return clear();
      const r = el.getBoundingClientRect(); clear(); reward.collect(value, [r.left + r.width / 2, r.top + r.height / 2]);
    });
    return true;
  }
  function step() {
    if (!eligible()) { clear(); next = performance.now() + 12000; return; }
    if (performance.now() >= next) next = performance.now() + (spawn() ? 40000 + Math.random() * 20000 : 5000);
  }
  IMI.on('tab', clear); IMI.on('render', () => { if (!eligible()) clear(); });
  IMI.onScreen(clear); addEventListener('resize', clear);
  document.addEventListener('visibilitychange', clear);
  IMI.pickups = { spawn, clear, active: () => !!active };
  setInterval(step, 1000);
})();
