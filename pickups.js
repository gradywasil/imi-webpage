/* Ordinary bananas live in the room, separate from decorative reward particles. */
(() => {
  function start() {
  'use strict';
  if (window.VaultSaveGate?.blocked) return;
  const { setTimeout, clearTimeout, setInterval, clearInterval, requestAnimationFrame, cancelAnimationFrame } = window.Rewards?.enabled ? Rewards.timers : window;
  const IMI = window.IMI, reward = IMI?.ops?.pickup;
  if (!reward || window.__OPS_HEADLESS) return;
  const now = IMI.ops.clock.productionNow;
  let active = null, next = now() + 20000, held = null, generation = 0;
  const clear = force => { if (held && force !== true) return; generation++; if (active) { reward.netCleared?.('ordinary', active.net); clearTimeout(active.timer); active.anim?.cancel(); active.el.remove(); active = null; } };
  const eligible = () => IMI.screen() === 'game' && !document.hidden && reward.eligible()
    && !IMI.tour?.active() && !document.querySelector('.o-modal, .o-celebrate, .set-pop:not([hidden])');
  const frames = [
    { transform: 'translateY(-12px)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1, offset: .1 },
    { transform: 'translateY(48px)', opacity: 1, offset: .9 }, { transform: 'translateY(60px)', opacity: 0 }
  ];
  function expire(item, token) {
    if (active !== item || held || token !== generation) return;
    if (!item.scaled && IMI.ops.clock.speed() === 1) clear();
    else lifetime(item);
  }
  function lifetime(item) {
    if (active !== item || held || item.generation !== generation) return;
    const speed = IMI.ops.clock.speed();
    if (speed !== 1 && !item.scaled) {
      item.scaled = true;
      if (item.anim) {
        item.anim.effect.setKeyframes(frames.map((f, i) => i === 3 ? { ...f, opacity: 1 } : f));
        item.anim.effect.updateTiming({ fill: 'forwards' });
      }
    }
    const left = item.expires - now();
    if (!eligible() || left <= 0) return clear();
    if (item.anim && speed !== 1) item.anim.playbackRate = speed;
    clearTimeout(item.timer);
    const token = item.generation;
    item.timer = setTimeout(() => expire(item, token), left / speed);
  }

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
    if (active || held || !eligible()) return false;
    const at = position(); if (!at) return false;
    const value = reward.value(), el = document.createElement('button');
    el.type = 'button'; el.className = 'o-pickup';
    el.style.left = at.x + 'px'; el.style.top = at.y + 'px';
    el.setAttribute('aria-label', `Collect banana: ${IMI.exact(value)} bananas`);
    el.title = `Collect ${IMI.exact(value)} bananas`;
    el.appendChild(IMI.bananaEl(1.5));
    const label = document.createElement('small'); label.textContent = '+' + IMI.fmt(value); el.appendChild(label);
    document.body.appendChild(el);
    const token=++generation;
    const item = { el, value, timer: setTimeout(() => expire(item, token), 14000), expires: now() + 14000, anim: null, scaled: false, generation:token }; active = item;
    if (at.travel) item.anim = el.animate(frames, { duration: 14000, easing: IMI.edition === 'pixel' ? 'steps(28)' : 'linear' });
    if (IMI.ops.clock.speed() !== 1) lifetime(item);
    el.addEventListener('pointerdown', e => e.stopPropagation());
    el.addEventListener('keydown', e => e.stopPropagation());
    const claim = () => {
      if (active !== item || held || item.generation !== generation) return;
      if (!eligible() || ((item.scaled || IMI.ops.clock.speed() !== 1) && now() >= item.expires)) return clear();
      const r = el.getBoundingClientRect(); clear(); reward.collect(value, [r.left + r.width / 2, r.top + r.height / 2]);
    };
    el.addEventListener('click', e => { e.stopPropagation(); claim(); });
    item.net = { el, valid:() => active === item && eligible() && now() < item.expires, claim };
    reward.netCreated?.('ordinary', item.net);
    return true;
  }
  function step() {
    if (held) return;
    if (active && (active.scaled || IMI.ops.clock.speed() !== 1)) lifetime(active);
    if (!eligible()) { clear(); next = now() + 12000; return; }
    if (now() >= next) next = now() + (spawn() ? 40000 + Math.random() * 20000 : 5000);
  }
  IMI.on('tab', clear); IMI.on('render', () => { if (!eligible()) clear(); });
  IMI.onScreen(clear); addEventListener('resize', clear);
  document.addEventListener('visibilitychange', clear);
  IMI.pickups = { spawn, clear, active: () => !!active,
    vaultSpeed() {if(active&&!held)lifetime(active);},
    vaultHold(lease) {if(held)return;held=lease;if(active){active.generation=++generation;active.el.dataset.lampHeld='';clearTimeout(active.timer);active.anim?.pause();}},
    vaultResume(lease) {if(held!==lease)return;held=null;if(!active)return;delete active.el.dataset.lampHeld;if(!active.el.isConnected){clear(true);return;}active.anim?.play();lifetime(active);}
  };
  setInterval(step, 1000);
  }
  if (window.Rewards?.enabled) Rewards.start(start); else start();
})();
