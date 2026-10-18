/* Long-game phase D/E: the Workshop tab. Rules live in workshop.js, art and effects in longgame-fx.js.
   Pictures and numbers, not sentences; anything you cannot use yet is not drawn; details live in tooltips. */
(() => {
  'use strict';
  const W = window.Workshop, X = window.LGFX;
  if (!W || !X || !(window.LegacyB && window.LegacyB.enabled())) return;
  const { ROUTES, RECIPES, LEADS, DUPLICATE_PARTS } = W;
  const { esc, ico, gem, clock } = X;
  const DESK_ID = ['mint', 'rose', 'blue', 'amber', 'orchid', 'moon'];
  const ROUTE_ART = { salvage: 'x-salvage', manuscript: 'x-manuscript', archive: 'x-archive' };
  const REWARD_ART = { anthology: ['w-typebar', 'x-archive'], almanac: ['b-collector', 'a-challenge'], atlas: ['b-prestige', 'a-challenge'] };
  const RECIPE_ART = { carriage: 'w-carriage', tray: 'w-tray', press: 'w-press', typebar: 'w-typebar' };
  let api = null, lastTick = 0, fresh = null, freshAt = 0, tripKey = '', fundKind = 'bananas';
  const get = st => W.norm(st.meta.workshop === undefined ? W.fresh() : st.meta.workshop);
  const put = (st, w) => { st.meta.workshop = w; };
  const money = n => window.Economy.fmt(n);
  const house = st => st.meta.house;
  const bonus = st => window.House ? window.House.extraParts(house(st), 'manuscript') : 0;
  const discount = st => n => window.House ? window.House.depositNeed(house(st), n) : n;
  const isFresh = id => fresh === id && performance.now() - freshAt < 1400;

  /* bring the clock up to now; ring a bell once when something comes back */
  function settle(st) {
    const w = st.meta.workshop;
    if (!w) return;
    const n = W.advance(w, Date.now());
    if (n === w) return;
    put(st, n);
    const homeNow = (n.shelf || []).length + (n.exp && n.exp.state === 'returned' ? 1 : 0), homeBefore = (w.shelf || []).length + (w.exp && w.exp.state === 'returned' ? 1 : 0);
    if (homeNow > homeBefore) {
      X.sfx('bell'); try { api.fx.say && api.fx.say('Your expedition is home!'); } catch (e) { /* optional */ }
      api.mark(); api.save();
    }
  }
  const visible = c => W.unlocked(c.state().meta.workshop, c.state().printing);
  const badge = c => { const w = c.state().meta.workshop; return w && ((w.exp && w.exp.state === 'returned') || (w.shelf || []).length) ? '!' : ''; };
  /* one amount in the unit that pays for it: a banana gem, or an icon for words and letters */
  const unit = (fund, n) => fund === 'words' ? `<span class="lgx-unit">${ico('coconut', 18)}${n}</span>` : fund === 'letters' ? `<span class="lgx-unit">${ico('type', 18)}${n}</span>` : gem('ban', money(n));
  const noun = fund => fund === 'words' ? 'words' : fund === 'letters' ? 'letters' : 'bananas';

  function routeTile(w, ctx, k) {
    const q = W.quote(w, k, ctx, fundKind), R = ROUTES[k];
    const reward = `${gem('part', q.parts + q.dupParts)}${q.lead ? ico('l-' + q.lead.id, 22) : ''}`;
    return `<button type="button" class="lgx-tile lgx-route${q.ok ? '' : ' dim'}${q.queued ? ' lgx-queued' : ''}" data-act="workshop:launch" data-route="${k}" ${q.ok ? '' : 'disabled'} title="${esc(R.name)}${q.queued ? ' (joins the queue)' : ''}: ${esc(R.blurb)} ${q.ok ? '' : esc(q.why)}" aria-label="${esc(R.name)}">
      <span class="lgx-art">${ico(ROUTE_ART[k], 56)}</span><small>${esc(R.name)}</small>
      <span class="lgx-meta">⏱ ${clock(q.seconds)}</span><span class="lgx-reward">${reward}</span><span class="lgx-cost">${unit(fundKind, q.cost)}</span></button>`;
  }
  /* what pays: bananas earned this room, or words and letters this room produced and still has spare */
  function fundRow(ctx) {
    const one = (k, art, tip, have) => `<button type="button" class="lgx-tile${fundKind === k ? ' on' : ''}" data-act="workshop:fund" data-v="${k}" aria-pressed="${fundKind === k}" title="${esc(tip)}${have === null ? '' : ' (' + Math.floor(have) + ' ready)'}" aria-label="Pay with ${k}"><span class="lgx-art">${art}</span></button>`;
    return `<div class="lgx-row lgx-funds">${one('bananas', gem('ban', ''), 'Pay with bananas earned this room', null)}${one('words', ico('coconut', 28), 'Pay with spare words this room produced', ctx.fundWords)}${one('letters', ico('type', 28), 'Pay with spare letters your typists made this room', ctx.fundLetters)}</div>`;
  }
  function collectBlock(x, count, ctx) {
    const r = ROUTES[x.route], pay = r.parts + (r.lead ? bonus(api.state()) : 0), lead = r.lead && api.state().meta.workshop && (api.state().meta.workshop.mCount || 0) < LEADS.length ? LEADS[api.state().meta.workshop.mCount].id : null;
    return `<div class="lgx-row"><button type="button" class="lgx-tile ready lgx-collect" data-act="workshop:collect" ${ctx.challenge ? 'disabled' : ''} title="${ctx.challenge ? 'Collect after the challenge ends.' : 'Collect' + (count > 1 ? ' (' + count + ' waiting)' : '')}" aria-label="Collect">
        <span class="lgx-art">${ico(ROUTE_ART[x.route], 48)}</span><span class="lgx-reward">${gem('part', pay)}${lead ? ico('l-' + lead, 22) : ''}</span>${count > 1 ? `<span class="lgx-count">${count}</span>` : ''}</button></div>`;
  }
  function tripHtml(w, ctx) {
    const x = w.exp, room = W.queueMax(w);
    const routes = `<div class="lgx-row lgx-routes">${Object.keys(ROUTES).filter(k => !ROUTES[k].needs || w.restored[ROUTES[k].needs]).map(k => routeTile(w, ctx, k)).join('')}</div>`;
    if (!x) return `${fundRow(ctx)}${routes}`;
    let out = '';
    const shelf = w.shelf || [], home = shelf.length + (x.state === 'returned' ? 1 : 0);
    if (shelf.length) out += collectBlock(shelf[0], home, ctx);
    if (x.state === 'away') {
      const left = x.need - x.elapsed, keep = Math.floor(x.cost * left / x.need), f = x.fund || 'bananas';
      out += `${X.strip({ route: x.route, progress: x.elapsed / x.need, state: 'away', left: clock(left) })}
        <div class="lgx-row"><button type="button" class="lgx-tile" data-act="workshop:cancel" title="Call it back: ${money(keep)} of ${money(x.cost)} ${noun(f)} return, the rest is spent, and no reward is paid." aria-label="Call it back"><span class="lgx-art">↩</span><span class="lgx-cost">${unit(f, money(keep))}</span></button></div>`;
    } else if (!shelf.length) {
      out += `${X.strip({ route: x.route, state: 'back' })}${collectBlock(x, 1, ctx)}`;
    }
    if (room) {
      const chips = (w.queue || []).map(q => `<button type="button" class="lgx-tile" data-act="workshop:unqueue" data-id="${q.id}" title="Cancel this queued trip: everything it committed comes back" aria-label="Cancel queued ${esc(ROUTES[q.route].name)}"><span class="lgx-art">${ico(ROUTE_ART[q.route], 30)}</span><small>⏱ ${clock(q.need)}</small></button>`).join('');
      out += `<div class="lgx-row lgx-queue" title="Queued trips start by themselves as each one returns">${chips}</div>`;
      if ((w.queue || []).length < room) out += `${fundRow(ctx)}${routes}`;
    }
    return out;
  }
  function benchHtml(w) {
    return Object.keys(RECIPES).filter(k => !RECIPES[k].needs || w.restored[RECIPES[k].needs]).map(k => {
      const r = RECIPES[k], ok = w.parts >= r.parts;
      return X.tile({ art: RECIPE_ART[k], sz: 48, cost: r.parts, kind: 'part', act: 'workshop:craft', data: { type: k }, ok, cls: ok ? 'ready' : '', label: r.name, why: `${r.name}: ${r.text}` });
    }).join('');
  }
  function fittedHtml(w, ctx) {
    if (!w.attachments.length) return '';
    const second = W.secondSlot(w);
    return w.attachments.map(a => {
      const inA = Object.entries(w.equipped).find(([, id]) => id === a.id), inB = Object.entries(w.equippedB || {}).find(([, id]) => id === a.id);
      const where = inA || inB, g = where ? +where[0] : -1, slot = inB ? 1 : 0;
      const row = s => ctx.groups.map((grp, i) => `<button type="button" class="lgx-mach${g === i && slot === s ? ' on' : ''}${grp.owned ? '' : ' dim'}" data-act="workshop:equip" data-id="${a.id}" data-g="${i}" data-slot="${s}" aria-pressed="${g === i && slot === s}" title="${esc(grp.name)}${s ? ' (second slot)' : ''}${grp.owned ? '' : ' (not built in this room yet; it fits once you build it)'}">${ico('tw-' + DESK_ID[i] + '-0', 38)}</button>`).join('');
      return `<div class="o-card lgx-card${isFresh(a.id) ? ' lgx-new' : ''}"><div class="lgx-head"><span class="lgx-art">${ico(RECIPE_ART[a.type], 40)}</span><b>${esc(RECIPES[a.type].name)}</b>
        ${where ? `<button type="button" class="o-btn sm" data-act="workshop:unequip" data-g="${g}" data-slot="${slot}" title="Take it off the machine" aria-label="Bench">↧</button>` : ''}</div><div class="lgx-row">${row(0)}</div>${second ? `<div class="lgx-row lgx-slotb" title="Second slot">${row(1)}</div>` : ''}</div>`;
    }).join('');
  }
  function libraryHtml(w, ctx, disc) {
    return w.leads.map(id => {
      const R = W.RESTORE[id], done = !!w.restored[id], ready = W.ready(w, id, disc), rows = W.progress(w, id, disc);
      const lines = done ? '' : rows.map(p => `<div class="lgx-row" title="${p.have} of ${p.need} words of ${2 * p.band + 2}-${2 * p.band + 3} letters"><span class="lgx-len">${2 * p.band + 2}-${2 * p.band + 3}</span>${X.pips(p.have, p.need)}
          ${p.have >= p.need ? '' : `<button type="button" class="o-btn sm" data-act="workshop:deposit" data-id="${id}" data-band="${p.band}" ${ctx.challenge ? 'disabled' : ''} aria-label="Deposit words">+</button>`}</div>`).join('');
      const bind = ready ? `<div class="lgx-row" title="Sell one title from this machine to bind the edition"><span class="lgx-tile ready lgx-bind">${ico('tw-' + DESK_ID[R.bind] + '-0', 44)}</span></div>` : '';
      return `<div class="o-card lgx-card${done ? ' chosen' : ''}"><div class="lgx-head"><span class="lgx-art">${ico('l-' + id, 52)}</span><b>${esc(R.name)}</b>
        <span class="lgx-unlocks">${REWARD_ART[id].map(a => ico(a, 24)).join('')}</span></div>${lines}${bind}${done ? '<span class="lgx-stamp">✓</span>' : ''}</div>`;
    }).join('');
  }
  function render(c, pane) {
    const st = c.state(), w = get(st), ctx = { ...c.workshopContext(), bonus: bonus(st) }, disc = discount(st);
    const books = LEADS.map(l => `<span class="lgx-lead${w.leads.includes(l.id) ? ' got' : ''}" title="${w.leads.includes(l.id) ? esc(l.name) : 'Still out there'}">${ico('l-' + l.id, 26)}</span>`).join('');
    const library = libraryHtml(w, ctx, disc), fitted = fittedHtml(w, ctx), bench = benchHtml(w);
    c.morph(pane, `<section class="o-card lgx-card"><div class="lgx-head"><span class="lgx-big">${gem('part', w.parts)}</span><span class="lgx-leads">${books}</span>${X.chipStage(ctx.blocked)}</div>${tripHtml(w, ctx)}</section>
      ${bench ? `<section class="o-card lgx-card"><div class="lgx-row">${bench}</div></section>` : ''}${fitted ? `<div class="o-grid">${fitted}</div>` : ''}${library ? `<div class="o-grid">${library}</div>` : ''}`);
  }
  /* one write path: change the record, then mark and save */
  const commit = (st, w) => { put(st, w); api.mark(); api.save(); };

  (window.__OPS_EXTENSIONS ??= []).push(['workshop', {
    tab: ['workshop', 'i-workshop', 'Workshop', 'Expeditions, Parts and attachments', 'Work'], visible, badge,
    init: (reason, c) => { api = c; if (c.state().meta.workshop !== undefined) settle(c.state()); },
    tick: (_event, c) => { api = c; const now = Date.now(); if (now - lastTick < 1000 || c.state().meta.automation?.print?.pending) return; lastTick = now; settle(c.state()); },
    render,
    actions: {
      fund: el => { const v = el.dataset.v; if (W.FUNDS.includes(v)) { fundKind = v; X.sfx('tick'); api.mark(); } },
      launch: el => {
        const st = api.state(), w = get(st), ctx = { ...api.workshopContext(), bonus: bonus(st) }, kind = fundKind;
        const q = W.quote(w, el.dataset.route, ctx, kind);
        if (!q.ok) { api.mark(); return; }
        let took = null;
        if (kind === 'bananas') { if (!api.workshopSpend(q.cost)) { api.mark(); return; } } else { took = api.workshopFund(kind, q.cost); if (!took) { api.mark(); return; } }
        const r = W.launch(w, el.dataset.route, ctx, Date.now(), kind, took);
        if (!r.ok) { if (kind === 'bananas') api.workshopRefund(q.cost); else api.workshopReturn(kind, took); api.mark(); return; }
        X.sfx('whoosh'); const [x, y] = X.center(el); X.burst(x, y, ['leaf', 'spark'], 10); X.shock(x, y, '#7be05a', false);
        commit(st, r.w);
      },
      cancel: () => {
        const st = api.state(), w = get(st);
        if (!w.exp || w.exp.state !== 'away') return;
        const q = W.cancel(w, window.Economy.floor, Date.now());
        if (!confirm(`Call the expedition back? ${money(q.refund)} ${noun(q.fund)} return; ${money(q.lost)} are already spent, and no reward is paid.`)) return;
        if (q.fund === 'bananas') api.workshopRefund(q.refund); else api.workshopReturn(q.fund, q.give);
        X.sfx('whoosh'); commit(st, q.w);
      },
      unqueue: el => {
        const st = api.state(), q = W.cancelQueued(get(st), el.dataset.id);
        if (!q.ok) return;
        if (q.fund === 'bananas') api.workshopRefund(q.refund); else api.workshopReturn(q.fund, q.give);
        X.sfx('tick'); commit(st, q.w);
      },
      collect: el => {
        const st = api.state();
        if (api.workshopContext().challenge) return;
        const r = W.claim(get(st), bonus(st));
        if (!r.ok) return;
        const [x, y] = X.center(el);
        X.sfx('bell'); X.gain('part', el, Math.min(14, r.parts)); X.float(`+${r.parts}`, x, y - 30, '#cfd8ff', true); X.shock(x, y, '#cfd8ff', true);
        if (r.lead && window.Juice) window.Juice.stamp('NEW LEAD', { tier: 1, sub: LEADS.find(l => l.id === r.lead).name });
        commit(st, r.w);
      },
      craft: el => {
        const st = api.state(), r = W.craft(get(st), el.dataset.type);
        if (!r.ok) { api.mark(); return; }
        X.forge(el, 'CRAFTED'); fresh = r.w.attachments[r.w.attachments.length - 1].id; freshAt = performance.now(); commit(st, r.w);
      },
      equip: el => { const st = api.state(), r = W.equip(get(st), el.dataset.id, +el.dataset.g, +el.dataset.slot || 0); if (r.ok) { X.snap(el); commit(st, r.w); } },
      unequip: el => { const st = api.state(); X.sfx('tick'); commit(st, W.unequip(get(st), el.dataset.g, +el.dataset.slot || 0).w); },
      deposit: el => {
        const st = api.state(), w = get(st), id = el.dataset.id, band = +el.dataset.band, disc = discount(st);
        if (api.workshopContext().challenge) return;
        const want = W.wanted(w, id, band, disc), t = want > 0 ? api.workshopTake(band, want) : { got: 0, took: {} }, taken = t.got;
        if (!taken) { X.sfx('tick'); const [x, y] = X.center(el); X.float('no spare words', x, y - 24, '#ff9a7a', false); return; }
        const r = W.deposit(w, id, band, taken, disc);
        if (!r.ok) { api.workshopGive(t.took); return; }
        if (r.added < taken) { const back = {}; let extra = taken - r.added; for (const [wd, n] of Object.entries(t.took)) { const x = Math.min(n, extra); if (x) back[wd] = x; extra -= x; } api.workshopGive(back); }
        const [x, y] = X.center(el); X.sfx('page'); X.float(`+${r.added}`, x, y - 24, '#ffe28a', false); X.burst(x, y, ['spark'], 6);
        commit(st, r.w);
      }
    }
  }]);
})();
