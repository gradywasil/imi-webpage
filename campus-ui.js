/* Long-game phase F: the Campus tab. Rules and the building models live in campus.js, art and effects in longgame-fx.js.
   The Annex, then the Studio, share one card; scheduling and staff transfers appear when their gates are open. */
(() => {
  'use strict';
  const C = window.Campus, X = window.LGFX;
  if (!C || !X || !(window.LegacyB && window.LegacyB.enabled())) return;
  const { esc, ico, gem } = X;
  const DESK_ID = ['mint', 'rose', 'blue', 'amber', 'orchid', 'moon'];
  const money = n => window.Economy.fmt(n);
  const lastSold = {};
  const get = st => st.meta.campus === undefined ? C.fresh() : st.meta.campus;
  const visible = c => get(c.state()).deed || c.campusFlags().estate >= 1;
  const annexReady = c => { const cp = get(c.state()); return !cp.deed && C.milestones(c.campusFlags()).open; };
  const studioReady = c => { const cp = get(c.state()); return cp.deed && !cp.studio && C.studioMilestones(c.campusFlags()).open; };
  const badge = c => annexReady(c) || studioReady(c) ? '!' : '';
  const POLICY = { farm: ['s-garden', 'Farm: fill out each machine, then open the next'], push: ['u-rapid', 'Push: open the next machine first, and ask the Foreman to hold Printing'] };
  const BLD = { annex: { art: 'c-annex', name: 'Annex' }, studio: { art: 'c-studio', name: 'Studio' } };

  function milestonesHtml(kind, m, art) {
    const B = BLD[kind];
    return `<section class="o-card lgx-card"><div class="lgx-head"><span class="lgx-art">${ico(B.art, 64)}</span><b>${B.name}</b></div>
      <div class="lgx-row">${m.rows.map(r => `<span class="lgx-tile${r.done ? ' on' : ' dim'}" title="${esc(r.text)}">${`<span class="lgx-art">${ico(art[r.id], 36)}</span>`}${X.pips(Math.min(r.have, r.need), Math.min(r.need, 10), r.need > 5 ? 'many' : '')}</span>`).join('')}
        ${m.open ? `<button type="button" class="lgx-tile ready" data-act="campus:${kind === 'annex' ? 'open' : 'openstudio'}" title="Open the ${B.name}" aria-label="Open the ${B.name}"><span class="lgx-art">${ico(B.art, 52)}</span></button>` : ''}</div></section>`;
  }
  const stepArt = s => s ? (s.k === 'band' ? ico('tw-' + DESK_ID[s.b] + '-0', 30) : ico(s.k === 'typist' ? 'i-monkey' : 's-keeper', 26)) : '';
  const stepper = (act, d, label, kind) => `<button type="button" class="o-btn sm" data-act="${act}" data-kind="${kind}" data-d="${d}" aria-label="${label}">${d > 0 ? '+' : '−'}</button>`;
  const bar = pct => `<span class="o-prog lgx-bar" role="img" aria-label="${pct}%"><i style="width:${pct}%"></i></span>`;

  function originalHtml(c) {
    const o = c.campusOriginal(), last = o.last;
    return `<div class="o-card lgx-card"><div class="lgx-head">${X.led(o.enabled ? (o.status && /Paused|Saving|Settling/.test(o.status) ? 'wait' : 'on') : 'off')}<b>Room</b>${X.chipStage(o.blocked)}
      <span class="lgx-facts" title="${esc(o.status || '')}"><span>${ico('i-type', 22)} ${o.machines}</span><span>${ico('i-monkey', 22)} ${o.typists}</span>${last ? `<span>⏱ ${X.clock(last.seconds)}</span>` : ''}</span></div></div>`;
  }
  function buildingHtml(kind, cp) {
    const b = C.view(cp, kind), room = b.room, s = C.summary(room), l = room.last, step = l.step, B = BLD[kind], now = C.policyOf(b);
    const seg = id => `<button type="button" class="lgx-tile${b.policy === id ? ' on' : ''}${now === id && b.policy !== id ? ' lgx-sched' : ''}" data-act="campus:policy" data-kind="${kind}" data-v="${id}" aria-pressed="${b.policy === id}" title="${esc(POLICY[id][1])}" aria-label="${id}"><span class="lgx-art">${ico(POLICY[id][0], 32)}</span></button>`;
    const sched = C.schedulingOpen(cp) ? `<div class="lgx-row" title="Schedule: push until this many machines are open, then follow the saved policy">
        <button type="button" class="lgx-tile${b.sched && b.sched.on ? ' on' : ''}" data-act="campus:sched" data-kind="${kind}" aria-pressed="${!!(b.sched && b.sched.on)}" aria-label="Schedule"><span class="lgx-art">${ico('i-insp', 28)}</span></button>
        ${b.sched && b.sched.on ? `${stepper('campus:until', -1, 'Fewer machines', kind)}<b>${ico('i-type', 20)} ${b.sched.until}</b>${stepper('campus:until', 1, 'More machines', kind)}` : ''}</div>` : '';
    return `<div class="o-card lgx-card" data-building="${kind}"><div class="lgx-head">${X.led(b.on ? (l.rate > 0 ? 'on' : 'wait') : 'off')}<b>${B.name}</b>${X.chipStage(l.blocked)}
      <button type="button" class="o-btn sm${b.on ? ' gold' : ''}" data-act="campus:toggle" data-kind="${kind}" aria-pressed="${b.on}" aria-label="${b.on ? 'Running' : 'Paused'}">${b.on ? '▶' : '❚❚'}</button></div>
      <div class="lgx-facts"><span title="Machines">${ico('i-type', 22)} ${s.bands}</span><span title="Typists">${ico('i-monkey', 22)} ${s.typists}</span><span title="Titles sold this room">${ico('i-log', 22)} ${s.sold}</span><span title="Earned this room">${gem('ban', money(room.earned))}</span>
        ${l.rate > 0 ? `<span title="Bananas a second">${gem('ban', money(l.rate))}/s</span>` : ''}</div>
      ${step ? `<div class="lgx-row lgx-next${step.ok ? ' go' : ''}" title="${esc(l.next || '')}">${stepArt(step)}${gem('ban', money(step.cost))}</div>` : ''}
      <div class="lgx-row">${seg('farm')}${seg('push')}<button type="button" class="lgx-tile${b.hold ? ' on' : ''}" data-act="campus:hold" data-kind="${kind}" aria-pressed="${b.hold}" title="While on, the Foreman will not press Printing" aria-label="Hold Printing"><span class="lgx-art">${ico('s-hold', 32)}</span></button></div>
      ${sched}
      <div class="lgx-row" title="How much of the wallet it may spend">${ico('banana', 22)}${bar(b.alloc)}${stepper('campus:alloc', -5, 'Lower allocation', kind)}<b>${b.alloc}%</b>${stepper('campus:alloc', 5, 'Raise allocation', kind)}</div>
      <div class="lgx-row" title="How much of the wallet it keeps unspent">${ico('s-lamp', 22)}${bar(b.reserve * 2)}${stepper('campus:reserve', -5, 'Lower reserve', kind)}<b>${b.reserve}%</b>${stepper('campus:reserve', 5, 'Raise reserve', kind)}</div></div>`;
  }
  /* one typist at a time between the two buildings: pictures and a direction, no sentences */
  function transferHtml(cp) {
    const dir = (from, to) => `<button type="button" class="lgx-tile" data-act="campus:move" data-from="${from}" data-to="${to}" ${C.movable(cp, from, to) >= 0 ? '' : 'disabled'} title="Move a typist from the ${BLD[from].name} to the ${BLD[to].name}" aria-label="Move a typist from the ${BLD[from].name} to the ${BLD[to].name}">
      <span class="lgx-art">${ico(BLD[from].art, 24)}${ico('i-monkey', 24)}${ico(BLD[to].art, 24)}</span></button>`;
    return `<section class="o-card lgx-card"><div class="lgx-row lgx-transfer" title="Staff transfers: one typist moves between the buildings. Nothing is paid and nothing is created.">${dir('annex', 'studio')}${dir('studio', 'annex')}<span class="lgx-facts" title="Typists moved so far">${ico('i-monkey', 22)} ${cp.moved || 0}</span></div></section>`;
  }
  function render(c, pane) {
    const cp = get(c.state()), flags = c.campusFlags();
    if (!cp.deed) { c.morph(pane, milestonesHtml('annex', C.milestones(flags), { estate: 'i-estate', cycles: 'a-foreman', restored: 'l-anthology', mastery: 'b-prestige' })); lastSold.annex = lastSold.studio = null; return; }
    const o = c.campusOriginal(), kinds = C.active(cp);
    const lawn = X.building({ kind: 'house', machines: o.machines, running: o.enabled, label: 'Room' }) + kinds.map(k => X.building({ kind: k, machines: C.summary(C.view(cp, k).room).bands, running: !!C.view(cp, k).on, label: BLD[k].name })).join('');
    const studio = cp.studio ? buildingHtml('studio', cp) : (C.view(cp, 'annex').room && cp.rooms >= 1 ? milestonesHtml('studio', C.studioMilestones(flags), { estate: 'i-estate', rooms: 'c-annex', cycles: 'a-foreman' }) : '');
    c.morph(pane, `<section class="o-card lgx-card">${X.lawn(lawn)}</section>
      <div class="o-grid" style="align-items:start">${originalHtml(c)}${kinds.includes('annex') ? buildingHtml('annex', cp) : ''}${studio}</div>${cp.studio ? transferHtml(cp) : ''}`);
    for (const k of kinds) {                // a coin hops out of a building whenever it sells a title
      const sold = C.view(cp, k).room.sold.reduce((a, b) => a + b, 0);
      if (lastSold[k] !== null && lastSold[k] !== undefined && sold > lastSold[k]) { const host = pane.querySelector('.lgx-bld.' + k + ' .lgx-bhost'); if (host) X.coin(host, ''); }
      lastSold[k] = sold;
    }
  }
  const kindOf = el => C.KINDS.includes(el.dataset.kind) ? el.dataset.kind : 'annex';
  const patch = (api, kind, p) => { api.campusPatchBuilding(kind, p) || api.mark(); };
  const cur = (api, kind) => C.view(get(api.state()), kind);
  (window.__OPS_EXTENSIONS ??= []).push(['campus', {
    tab: ['campus', 'i-campus', 'Campus', 'The Estate\'s buildings', 'Campus'], visible, badge, render,
    init: (_reason, api) => { void api; },
    actions: {
      open: (el, api) => {
        const r = api.campusOpen(); if (!r.ok) { api.mark(); return; }
        X.sfx('jackpot'); if (api.fx && api.fx.celebrate) api.fx.celebrate('The Annex is open', 'A second building', `<p class="o-cel-sub">${ico('c-annex', 64)}</p>`);
        if (window.Juice) window.Juice.shower(2);
        api.mark();
      },
      openstudio: (el, api) => {
        const r = api.campusOpenStudio(); if (!r.ok) { api.mark(); return; }
        X.sfx('jackpot'); if (api.fx && api.fx.celebrate) api.fx.celebrate('The Studio is open', 'A third building', `<p class="o-cel-sub">${ico('c-studio', 64)}</p>`);
        if (window.Juice) window.Juice.shower(2);
        api.mark();
      },
      toggle: (el, api) => { const k = kindOf(el); X.sfx('tick'); patch(api, k, { on: !cur(api, k).on }); },
      hold: (el, api) => { const k = kindOf(el); X.sfx('attach'); patch(api, k, { hold: !cur(api, k).hold }); },
      policy: (el, api) => { if (C.POLICIES.includes(el.dataset.v)) { X.sfx('attach'); patch(api, kindOf(el), { policy: el.dataset.v }); } },
      alloc: (el, api) => { const k = kindOf(el); patch(api, k, { alloc: Math.max(0, Math.min(100, cur(api, k).alloc + (+el.dataset.d || 0))) }); },
      reserve: (el, api) => { const k = kindOf(el); patch(api, k, { reserve: Math.max(0, Math.min(50, cur(api, k).reserve + (+el.dataset.d || 0))) }); },
      sched: (el, api) => { const k = kindOf(el); if (!C.schedulingOpen(get(api.state()))) return; const s = cur(api, k).sched || { on: false, until: 3 }; X.sfx('attach'); patch(api, k, { sched: { ...s, on: !s.on } }); },
      until: (el, api) => { const k = kindOf(el); const s = cur(api, k).sched || { on: true, until: 3 }; patch(api, k, { sched: { ...s, until: Math.max(1, Math.min(C.BANDS, s.until + (+el.dataset.d || 0))) } }); },
      move: (el, api) => {
        const r = api.campusMove(el.dataset.from, el.dataset.to);
        if (!r.ok) { api.mark(); return; }
        X.sfx('attach'); const [x, y] = X.center(el); X.float('+1 ' + 'typist', x, y - 24, '#ffe28a', false); X.burst(x, y, ['spark'], 6);
        api.mark();
      }
    }
  }]);
})();
