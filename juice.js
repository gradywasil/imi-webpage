/* The dopamine layer: reusable bursts for rewards and progress.
   - Juice.fly(kind, from, n): little gems leave a point and land in the matching counter, each with a rising chime
   - Juice.stamp(text, {tier}): a big slam-in banner that grows with the size of the win
   - Juice.chain(key, ms): how many times in a row something has happened inside a window (buy chains, sale chains)
   - Juice.shower(tier): confetti volleys across the screen for the biggest moments
   Gameplay rolls (lucky sales, crit taps, inspired typists) live in ops.js; this file only draws and sounds. */
window.Juice = (() => {
  'use strict';
  const rand = (a, b) => a + Math.random() * (b - a);
  const reduce = () => !!window.IMI?.reduceMotion, low = () => !!window.IMI?.fx?.low;
  const sfx = () => window.IMI?.sfx || {};
  const restart = (el, cls) => { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };
  const chains = {};
  function chain(key, ms = 3500) {
    const now = performance.now(), c = chains[key] ||= { n: 0, t: 0 };
    c.n = now - c.t < ms ? c.n + 1 : 1; c.t = now; return c.n;
  }
  chain.peek = key => chains[key]?.n || 0;
  /* the counter a kind of gem lands in: bananas in the main counter, the rest in the wallet row under it */
  const targetOf = kind => {
    const chip = kind === 'ban' ? null : document.querySelector(`#hudGems .hud-gem.${kind}:not([hidden])`);
    return chip || document.getElementById('hud');
  };
  function landed(el, kind) {
    if (!el) return;
    if (el.id === 'hud') restart(el, 'sip'); else restart(el, 'pop');
  }
  function fly(kind, from, count = 5, opts = {}) {
    const IMI = window.IMI; if (!IMI || !window.Gems) return;
    const tgt = targetOf(kind);
    count = Math.max(1, Math.min(low() ? 3 : 14, Math.round(count)));
    const [hx, hy] = tgt ? IMI.centerOf(tgt) : [innerWidth / 2, 30];
    if (reduce() || !tgt || document.hidden) { opts.done?.(); return; }
    const [fx, fy] = from || [innerWidth / 2, innerHeight / 2];
    sfx().whoosh?.();
    for (let k = 0; k < count; k++) setTimeout(() => {
      const g = document.createElement('div'); g.className = 'j-fly'; g.innerHTML = window.Gems.html(kind, 'big');
      g.style.left = fx + 'px'; g.style.top = fy + 'px'; document.body.appendChild(g);
      const sx = rand(-90, 90), sy = rand(-110, -30);
      g.animate([
        { transform: 'translate(-50%,-50%) scale(.2)', opacity: 0 },
        { transform: `translate(calc(-50% + ${sx}px), calc(-50% + ${sy}px)) scale(1.25) rotate(${rand(-25, 25)}deg)`, opacity: 1, offset: .32 },
        { transform: `translate(calc(-50% + ${hx - fx}px), calc(-50% + ${hy - fy}px)) scale(.55)`, opacity: 1 }
      ], { duration: 700 + rand(0, 240), easing: 'cubic-bezier(.4,0,.55,1)' }).onfinish = () => {
        g.remove(); landed(tgt, kind); sfx().gem?.(k);
        if (k === count - 1) opts.done?.();
      };
    }, k * (count > 8 ? 55 : 90));
  }
  /* a stamp slams into the upper screen. tier 1 gold, 2 orange with rays, 3 rainbow with a sunburst */
  function stamp(text, o = {}) {
    document.querySelectorAll('.j-stamp').forEach(e => e.remove());
    const tier = o.tier || 1, el = document.createElement('div');
    el.className = `j-stamp t${tier}`; el.setAttribute('role', 'status');
    el.innerHTML = `<i class="j-rays"></i><b>${text}</b>${o.sub ? `<small>${o.sub}</small>` : ''}`;
    if (o.color) el.style.setProperty('--jc', o.color);
    document.body.appendChild(el);
    sfx().stamp?.();
    el.addEventListener('animationend', e => { if (e.animationName === 'j-stamp-out') el.remove(); });
    setTimeout(() => el.remove(), 4200);
    return el;
  }
  function confetti(x, y, n = 14) { window.IMI?.burst(x, y, ['banana', 'star', 'spark', 'leaf'], n); }
  /* volleys of confetti across the screen: the size of the moment sets the count */
  function shower(tier = 2) {
    if (reduce() || !window.IMI) return;
    const volleys = low() ? 2 : 3 + tier * 2;
    for (let k = 0; k < volleys; k++) setTimeout(() => {
      const x = innerWidth * (.08 + Math.random() * .84), y = innerHeight * (k % 2 ? .12 + Math.random() * .1 : .55 + Math.random() * .25);
      confetti(x, y, 12 + tier * 4);
      window.dispatchEvent(new CustomEvent('juice:burst', { detail: { x, y } }));
    }, 160 + k * 170);
  }
  function pop(el) { if (el && !reduce()) restart(el, 'j-pop'); }
  return Object.freeze({ fly, stamp, chain, confetti, shower, pop });
})();
