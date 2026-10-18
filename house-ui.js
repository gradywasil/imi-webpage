/* Long-game phase E: the specialization card shown in the Imprints pane, and its actions. Rules live in house.js, art in longgame-fx.js. */
window.HouseUI = (() => {
  'use strict';
  const H = window.House, X = window.LGFX;
  if (!H || !X || !(window.LegacyB && window.LegacyB.enabled())) return null;
  const { esc, ico } = X;
  const DESK_ID = ['mint', 'rose', 'blue', 'amber', 'orchid', 'moon'];
  const get = st => st.meta.house === undefined ? H.fresh() : st.meta.house;

  function html(api) {
    const st = api.state(), h = get(st), ctx = api.houseContext();
    if (!ctx.imprints) return '';
    const builds = Object.entries(H.BUILDS).filter(([id]) => H.available(ctx.restored, id)).map(([id, b]) => {
      const on = h.build === id;
      return `<button type="button" class="lgx-tile lgx-build${on ? ' on' : ''}" data-act="house:choose" data-id="${id}" aria-pressed="${on}" title="${esc(b.name)}: ${esc(b.gain)} Trade-off: ${esc(b.cost)}" aria-label="${esc(b.name)}">
        <span class="lgx-art">${X.emblem(id, 52)}</span><small>${esc(b.name)}</small>${on ? '<span class="lgx-stamp">✓</span>' : ''}</button>`;
    }).join('');
    const names = ctx.groups.map((g, i) => `<button type="button" class="lgx-mach${h.band === i ? ' on' : ''}" data-act="house:band" data-g="${i}" aria-pressed="${h.band === i}" title="${esc(g)}">${ico('tw-' + DESK_ID[i] + '-0', 38)}</button>`).join('');
    const touring = ctx.purchases.touring ? `<div class="lgx-row" title="Touring Staff: one machine types ${H.TOURING}x faster">${ico('a-foreman', 28)}${names}<button type="button" class="o-btn sm" data-act="house:band" data-g="none" aria-label="No machine">✕</button></div>` : '';
    return `<section class="o-card layers house lgx-card"><div class="lgx-head"><b>Specialization</b></div>
      <div class="lgx-row">${builds}</div>${touring}</section>`;
  }
  const write = (api, r, el) => {
    if (!r.ok) { X.sfx('tick'); if (el) { const [x, y] = X.center(el); X.float(r.why, x, y - 24, '#ff9a7a', false); } api.mark(); return; }
    api.state().meta.house = r.h; if (el) X.snap(el); api.mark(); api.save();
  };
  (window.__OPS_EXTENSIONS ??= []).push(['house', {
    actions: {
      choose: (el, api) => { const r = H.choose(get(api.state()), el.dataset.id, api.houseContext()); if (r.ok && r.h.build) X.sfx('levelup'); write(api, r, el); },
      band: (el, api) => write(api, H.setBand(get(api.state()), el.dataset.g === 'none' ? null : +el.dataset.g, api.houseContext()), el)
    }
  }]);
  return { html };
})();
