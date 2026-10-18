/* Long-game art and effects: the shared pieces behind the Workshop, the Campus, the Imprint specializations and the room control.
   Markup helpers return strings (panes re-render through morph, so everything here is plain markup plus CSS animation).
   One-shot feedback (hammer sparks, restorations, coins) uses Web Animations and the existing Juice / burst / shock effects, because morph() resets classes. */
window.LGFX = (() => {
  'use strict';
  const esc = x => String(x).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const IMI = () => window.IMI;
  const quiet = () => !!(IMI() && IMI().reduceMotion) || document.hidden;
  const low = () => !!(IMI() && IMI().fx && IMI().fx.low);
  const sfx = name => { try { const s = IMI() && IMI().sfx; if (s && s[name]) s[name](); } catch (e) { /* sound is optional */ } };
  const gem = (kind, n) => window.Gems ? window.Gems.amount(kind, n) : `${n}`;
  const ico = (name, sz = 0, cls = '') => `<i class="o-ico ${cls}" data-ico="${name}" data-sz="${sz}"></i>`;
  const clock = sec => { const t = Math.max(0, Math.ceil(sec)); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`; };

  /* ---- one-shot effects, all anchored on a real element ---- */
  const center = el => { try { return IMI().centerOf(el); } catch (e) { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; } };
  function shock(x, y, color, big) {
    if (quiet()) return;
    const r = document.createElement('i'); r.className = 'o-shock' + (big ? ' big' : ''); r.style.cssText = `left:${x}px;top:${y}px;--sc:${color || '#ffd23a'}`;
    r.addEventListener('animationend', () => r.remove()); document.body.appendChild(r);
  }
  function float(text, x, y, color, big) {
    if (quiet()) return;
    const el = document.createElement('div'); el.className = 'o-float' + (big ? ' big' : ''); el.textContent = text;
    el.style.cssText = `left:${x}px;top:${y}px;--pc:${color || '#ffd23a'}`; el.addEventListener('animationend', () => el.remove()); document.body.appendChild(el);
  }
  const burst = (x, y, kinds, n) => { if (!quiet() && IMI() && IMI().burst) IMI().burst(x, y, kinds, low() ? Math.ceil(n / 2) : n); };
  /* hammer sparks off a bench tile */
  function forge(el, label) {
    const [x, y] = center(el); sfx('hammer');
    burst(x, y, ['spark', 'star'], 14); shock(x, y, '#ffb347', false); float(label || 'CRAFTED', x, y - 34, '#ffe28a', true);
    if (!quiet() && el.animate) el.animate([{ transform: 'scale(1) rotate(0)' }, { transform: 'scale(1.18) rotate(-6deg)', offset: .25 }, { transform: 'scale(.94) rotate(4deg)', offset: .55 }, { transform: 'scale(1)' }], { duration: 520, easing: 'cubic-bezier(.3,1.5,.5,1)' });
  }
  /* an attachment snapping into a machine */
  function snap(el) {
    const [x, y] = center(el); sfx('attach'); burst(x, y, ['spark'], 8); shock(x, y, '#9ad8ff', false);
    if (!quiet() && el.animate) el.animate([{ transform: 'translateY(-10px) scale(1.2)' }, { transform: 'translateY(2px) scale(.95)', offset: .6 }, { transform: 'none' }], { duration: 340, easing: 'ease-out' });
  }
  /* Parts, stars or Seals flying into the wallet row */
  const gain = (kind, el, n) => { if (window.Juice && el) window.Juice.fly(kind, center(el), n); };
  /* a collection restored: the biggest moment this part of the game has */
  function restored(name, sub) {
    sfx('jackpot');
    if (window.Juice) { window.Juice.stamp(name, { tier: 2, sub: sub || '' }); window.Juice.shower(2); }
  }
  /* the Annex or a building earning: a coin hops out of it */
  function coin(host, amount) {
    if (quiet() || !host || !host.isConnected) return;
    const [x, y] = center(host), c = document.createElement('div'); c.className = 'lgx-coin';
    c.innerHTML = ico('c-coin', 28); c.style.cssText = `left:${x}px;top:${y - 20}px`; document.body.appendChild(c);
    if (IMI() && IMI().ops && IMI().ops.extensions && IMI().ops.extensions.hydrate) IMI().ops.extensions.hydrate(c);
    sfx('coinlet');
    const a = c.animate([{ transform: 'translate(-50%,-50%) scale(.4)', opacity: 0 }, { transform: 'translate(-50%,-190%) scale(1.15)', opacity: 1, offset: .35 }, { transform: 'translate(-50%,-290%) scale(.9)', opacity: 0 }], { duration: 900, easing: 'ease-out' });
    a.onfinish = () => c.remove();
    if (amount) float(amount, x, y - 74, '#ffd23a', false);
  }

  /* ---- markup pieces ---- */
  /* a square picture button: art on top, a gem-and-number cost underneath. Locked ones are simply dim; the reason lives in the tooltip. */
  function tile({ art, sz = 44, cost, kind = 'part', act, data = {}, ok = true, on = false, why = '', label = '', cls = '' }) {
    const d = Object.entries(data).map(([k, v]) => ` data-${k}="${esc(v)}"`).join('');
    return `<button type="button" class="lgx-tile ${cls}${on ? ' on' : ''}${ok ? '' : ' dim'}" ${act ? `data-act="${act}"` : ''}${d} ${ok || !act ? '' : 'aria-disabled="true"'} ${ok ? '' : 'disabled'} title="${esc(why || label)}" aria-label="${esc(label || why)}">
      <span class="lgx-art">${ico(art, sz)}</span>${label ? `<small>${esc(label)}</small>` : ''}${cost !== undefined ? `<span class="lgx-cost">${gem(kind, cost)}</span>` : ''}</button>`;
  }
  /* a row of pips: filled ones are earned */
  const pips = (have, need, cls = '') => `<span class="lgx-pips ${cls}" role="img" aria-label="${have} of ${need}">${Array.from({ length: need }, (_, i) => `<i class="${i < have ? 'on' : ''}"></i>`).join('')}</span>`;
  const led = state => `<i class="lgx-led ${state}" role="img" aria-label="${state === 'on' ? 'running' : state === 'wait' ? 'waiting' : 'off'}"></i>`;
  const stage = { typing: '⌨️', banking: '🗂️', publishing: '🖨️', funds: '🍌', catalog: '📚' };
  const chipStage = (name, why) => name ? `<span class="lgx-chip" title="${esc(why || 'The room is waiting on ' + name)}">${stage[name] || '⏳'}</span>` : '';

  /* the expedition strip. progress 0..1. state: away | back. The explorer walks to the destination and the jungle drifts behind. */
  function strip({ route = 'salvage', progress = 0, state = 'away', left = '' }) {
    const goal = { salvage: 'x-salvage', manuscript: 'x-manuscript', archive: 'x-archive' }[route] || 'x-salvage', p = Math.max(0, Math.min(1, progress));
    const at = state === 'back' ? 90 : 8 + p * 78;
    return `<div class="lgx-strip ${state} r-${esc(route)}" style="--p:${p.toFixed(3)}" role="img" aria-label="${esc(route)} expedition ${Math.round(p * 100)}%">
      <i class="lgx-sun"></i><i class="lgx-cloud c1"></i><i class="lgx-cloud c2"></i><i class="lgx-cloud c3"></i>
      <i class="lgx-layer far"></i><i class="lgx-layer near"></i><i class="lgx-prop p1"></i><i class="lgx-prop p2"></i><i class="lgx-prop p3"></i><i class="lgx-path"></i>
      <i class="lgx-mote m1"></i><i class="lgx-mote m2"></i><i class="lgx-mote m3"></i><i class="lgx-mote m4"></i><i class="lgx-mote m5"></i>
      <span class="lgx-home">${ico('c-house', 56)}</span><span class="lgx-goal">${ico(goal, 40)}</span>
      <span class="lgx-walker" style="left:${at}%"><span class="lgx-fr f0">${ico('x-explorer-0', 44)}</span><span class="lgx-fr f1">${ico('x-explorer-1', 44)}</span><b class="lgx-dust"></b><b class="lgx-dust d2"></b>
        ${state === 'back' ? `<span class="lgx-crate">${ico('x-salvage', 30)}</span><b class="lgx-spark s1"></b><b class="lgx-spark s2"></b><b class="lgx-spark s3"></b>` : ''}</span>
      ${left ? `<span class="lgx-time">${left}</span>` : ''}</div>`;
  }
  /* a building on the campus: smoke from the chimney and lit windows for every working machine */
  function building({ kind = 'annex', machines = 0, running = true, label = '' }) {
    const wins = [[6, 16], [14, 16], [30, 16], [38, 16]], lit = Math.min(wins.length, machines);
    return `<figure class="lgx-bld ${kind}${running ? ' go' : ''}" title="${esc(label)}">
      <span class="lgx-bhost">${ico(kind === 'annex' ? 'c-annex' : kind === 'studio' ? 'c-studio' : 'c-house', 156)}
      ${wins.slice(0, lit).map(([x, y], i) => `<span class="lgx-win" style="left:${(x - .5) / 48 * 100}%;top:${(y - .5) / 34 * 100}%;--d:${i * .7}s">${ico('c-lit', 20)}</span>`).join('')}
      <span class="lgx-smoke"><i>${ico('c-puff', 18)}</i><i>${ico('c-puff', 18)}</i><i>${ico('c-puff', 18)}</i></span></span><figcaption>${label ? esc(label) : ''}</figcaption></figure>`;
  }
  /* the campus lawn: palms sway either side of the buildings */
  const lawn = inner => `<div class="lgx-ground"><span class="lgx-palm l">${ico('palm', 72)}</span>${inner}<span class="lgx-palm r">${ico('palm', 72)}</span></div>`;
  /* animated emblem for a specialization */
  const emblem = (build, sz = 44) => `<span class="lgx-emblem ${build}">${ico({ rapid: 'b-rapid', collector: 'b-collector', prestige: 'b-prestige' }[build], sz)}<b></b></span>`;

  return Object.freeze({ esc, ico, gem, clock, shock, float, burst, forge, snap, gain, restored, coin, tile, pips, led, chipStage, strip, building, lawn, emblem, center, sfx });
})();
