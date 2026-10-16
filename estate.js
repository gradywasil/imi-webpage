/* LG-08B. Fixed, optional Estate reset. Archive follows under a separate lease. */
window.Estate = (() => {
  'use strict';
  const enabled = (window.GameFeatures?.enabled('lg08estate') ?? new URLSearchParams(location.search).get('lg08estate') === '1') && !!window.Layers?.enabled;
  const copy = x => JSON.parse(JSON.stringify(x));
  const same = window.Layers.same, integer = x => Number.isSafeInteger(x) && x >= 0;
  const object = x => !!x && typeof x === 'object' && !Array.isArray(x);
  function current(s) {
    const e = Layers.estateIdentity(s) ?? {version:1,localImprints:Layers.current(s).count,resetEpoch:0};
    return {count:0,starBaseline:0,charters:0,...e};
  }
  function quote(s, recovery = false) {
    if (!enabled || !Rewards.owns()) throw Error('Estate needs its development flags and save ownership.');
    const e = current(s), l = Layers.current(s), total = s.legacy.total, delta = total - e.starBaseline;
    if (!recovery) { Layers.identityReady(s); Layers.settled(s); }
    if (![total,s.legacy.stars,s.printing,delta].every(integer) || e.starBaseline > total || l.baseline > total ||
        !s.intro.done || s.legacy.stars > total || e.localImprints > l.count || e.localImprints < 5 || s.printing < 7 || delta < 360) throw Error('Requires 5 local Imprints, Printing 8 and 360 newly awarded lifetime stars.');
    for (const id of ['garden','pitch','media','muse']) {
      const cfg = s.meta.automation?.[id], m = cfg?.manual;
      if (cfg !== undefined && (!object(cfg) || cfg.version !== 1 || m !== undefined && (!object(m) || m.complete !== undefined && typeof m.complete !== 'boolean')) ||
          id === 'muse' && m?.ids !== undefined && (!Array.isArray(m.ids) || m.ids.some(id => typeof id !== 'string'))) throw Error('Unsupported helper proof. Save preserved.');
    }
    const gain = Math.floor(Math.sqrt(delta / 40));
    if (![e.count + 1,e.resetEpoch + 1,e.charters + gain].every(integer) ||
        !integer(s.legacy.ups.seed ?? 0) || (s.legacy.ups.seed ?? 0) > 3 || !integer(s.legacy.ups.crew ?? 0) || (s.legacy.ups.crew ?? 0) > 1 ||
        Object.values(s.editions).some(n => !integer(n)) || Object.keys(s.written).some(id => !integer((s.editions[id] ?? 0) + 1))) throw Error('Estate counters cannot advance safely. Save preserved.');
    return {count:e.count,localImprints:e.localImprints,resetEpoch:e.resetEpoch,baseline:e.starBaseline,total,delta,gain,printing:s.printing};
  }
  function project(s, fresh, recovery = false) {
    const q = quote(s,recovery), e = current(s), next = Layers.projectRoom(s,fresh);
    next.meta.estate = {...e,count:e.count + 1,resetEpoch:e.resetEpoch + 1,localImprints:0,starBaseline:q.total,charters:e.charters + q.gain};
    delete next.meta.estate.pending;
    next.meta.layers = {...Layers.current(s),baseline:q.total,seals:0,genre:null,highestPrinting:Math.max(Layers.current(s).highestPrinting,s.printing + 1)};
    Layers.finishRoom(s,next);
    // Estate also clears incomplete proof when the optional helper UI is flag-off.
    for (const id of ['garden','pitch','muse']) {
      const m = next.meta.automation?.[id]?.manual;
      if (m && !m.complete) {
        if (id === 'muse') Object.assign(m,{ids:[],...Layers.epochFields(next),imprint:Layers.identity(next),printing:0});
        else if (m.pending != null) m.pending = null;
      }
    }
    return next;
  }
  let api, offer = null, notice = '';
  const sourceKey = s => JSON.stringify([s.meta.estate ?? null,s.meta.layers ?? null,s.legacy,s.printing,IMI.bananas.get(),IMI.bananas.acknowledgement()]);
  function review(s, start) {
    offer = {...copy(start),source:sourceKey(s)};
    return copy(offer);
  }
  function settleArchiveIncome() {
    if (!offer || sourceKey(api.state()) !== offer.source) throw Error('Estate changed. Review it again.');
    if (!api.archiveSettle()) return false;
    // Only the fixed Archive settlement may refresh this already-validated wallet boundary.
    offer.source = sourceKey(api.state());
    return true;
  }
  function installStart(candidate, crew) {
    candidate.desks[0].paws = crew.length; candidate.desks[0].crew = copy(crew);
    if (crew.length) candidate.hold = true;
    for (const t of crew) candidate.looks[t.look] = 1;
  }
  function prepare(s, request) {
    if (!offer || !same(offer.quote,request.quote) || !same(quote(s),offer.quote) || sourceKey(s) !== offer.source) throw Error('Estate changed. Review it again.');
    if (s.meta.estate === undefined) Layers.initializeIdentity(s);
    const candidate = api.estateRoom(s), crew = offer.room.desks[0].crew;
    installStart(candidate,crew);
    if (offer.reward) candidate.rewards.claims['layer:estate:first'] = {status:'prepared',origin:'new',descriptor:copy(offer.reward)};
    const at = Date.now(); candidate.lastSeen = at;
    const p = {version:1,at,id:`estate:e${offer.quote.resetEpoch}:${offer.quote.count + 1}:${offer.quote.total}`,quote:offer.quote,
      sourceEstate:copy(s.meta.estate ?? null),balance:IMI.bananas.get(),marker:IMI.bananas.acknowledgement(),seed:offer.seed,
      crew:copy(crew),reward:offer.reward,candidate};
    const intent = copy(s); intent.lastSeen = at; intent.meta.estate = {...current(s),pending:p};
    pending(intent);
    return intent;
  }
  function pending(s) {
    const e = current(s), p = e.pending, owner = window.IMI.ops.extensions;
    if (!enabled || !object(p) || p.version !== 1 || !object(p.quote) || !object(p.candidate) || !integer(p.balance) || p.balance % Economy.scale ||
        !integer(p.at) || !integer(p.seed) || !Array.isArray(p.crew) || !same(p.marker,IMI.bananas.acknowledgement())) throw Error('Waiting Estate requires its original flags, intent and wallet provenance.');
    const source = copy(s);
    if (p.sourceEstate === null) delete source.meta.estate; else source.meta.estate = copy(p.sourceEstate);
    const q = quote(source,true), base = current(source); delete e.pending;
    if (!same(e,base) || !same(q,p.quote) || p.id !== `estate:e${q.resetEpoch}:${q.count + 1}:${q.total}` ||
        p.seed !== Economy.cash([0,1000,10000,100000][source.legacy.ups.seed || 0]) ||
        ![p.balance,p.seed].includes(IMI.bananas.get()) || !owner.estateCrewValid(p.crew,source)) throw Error('Waiting Estate identity or wallet changed.');
    const expected = owner.estateRoom(source); expected.lastSeen = p.at; installStart(expected,p.crew);
    if (!source.rewards.claims['layer:estate:first']) {
      Rewards.validateEstateReward(p.reward);
      expected.rewards.claims['layer:estate:first'] = {status:'prepared',origin:'new',descriptor:copy(p.reward)};
    } else if (p.reward !== null) throw Error('Estate first reward already exists.');
    if (!same(expected,p.candidate)) throw Error('Waiting Estate successor changed. Save preserved.');
    return p;
  }
  const escape = x => String(x).replace(/[&<>"']/g,c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const button = (action,text,disabled=false) => `<button type="button" class="o-btn" data-act="estate:${action}" ${disabled ? 'disabled' : ''}>${text}</button>`;
  function render(c,pane) {
    api = c;
    try {
      const s = c.state(), e = current(s); let q, why = '';
      try { q = quote(s); } catch(error) { why = error.message; }
      c.morph(pane,`<section class="o-card layers"><h3>The Estate</h3><p>Estates: ${e.count}. Charters: ${e.charters}.</p><p>Local Imprints ${e.localImprints} / 5. Lifetime Imprints ${Layers.current(s).count}.</p><p>Printing ${s.printing + 1} / 8. Newly awarded lifetime stars ${s.legacy.total - e.starBaseline} / 360. Pending run stars do not count.</p><p>${q ? `Endow for ${q.gain} Charters.` : escape(why)}</p>${button('review','Review Estate reset',!q)}${button('back','Back to Imprints')}${window.Archive?.enabled && e.count > 0 ? button('archive','Open Archive') : '<p>Archive opens after the first Estate with its development flag.</p>'}${notice ? `<p role="alert">${escape(notice)}</p>` : ''}</section>`);
    } catch(error) { c.morph(pane,`<section class="o-card layers"><h3>Estate unavailable</h3><p>${escape(error.message)}</p></section>`); }
  }
  function preview() {
    try {
      const s = api.state(), o = api.estatePreview(), focus = document.activeElement;
      const el = document.createElement('div'); el.className = 'o-modal layer-confirm'; el.setAttribute('role','dialog'); el.setAttribute('aria-modal','true'); el.setAttribute('aria-labelledby','estateTitle');
      el.innerHTML = `<div class="o-modal-card"><h3 id="estateTitle">Endow the Estate?</h3><div class="layer-details" tabindex="0"><p>Gain ${o.quote.gain} Charters. Local Imprints ${o.quote.localImprints} / 5; Printing ${s.printing + 1} / 8; newly awarded lifetime stars ${o.quote.delta} / 360.</p><p>Restart at Bamboo, Printing 1, with ${o.seed.toLocaleString('en-US')} Seed Money bananas, excluded from earnings. Veteran Crew supplies ${o.room.desks[0].paws} starting typists.</p><p>${o.reward ? `First Estate: ${o.reward.amount} balanced Letters on starting Bamboo, locked from three minutes of projected production, floor 50, cap 5,000. No Diamond Bananas.` : 'First Estate Letters already claimed. No repeat reward.'}</p><h4>Keep</h4><p>${s.legacy.stars} current / ${s.legacy.total} lifetime Legacy stars and all Legacy upgrades. Keep paid Imprint purchases, stamps/shelf, Folio gallery, lifetime helper unlocks, levels/settings and completed proof, twelve first clears, awards/claims/stored gold, editions/pitch IDs, stats/looks/daily history, DB/receipts, Inspiration/tree/attempts/refill/session IDs, production/training preferences/reserves and unknown save data. Written titles roll into earlier editions once.</p><h4>Reset</h4><p>Lose ${IMI.bananas.get().toLocaleString('en-US')} wallet bananas and ${Layers.current(s).seals} unspent Seals. Clear active genre, local Imprints, room desks/crew/coaching/upgrades, letters/trays/words, garden/Muses/seats, divisions/deals/market/shop/Publisher/lamp, local earnings, temporary work, active buffs and incomplete proof/cadences. Both star baselines become ${o.quote.total}. Lifetime foundations stay ${Layers.current(s).count}.</p></div><div class="o-row"><button class="o-btn" type="button" data-cancel>Cancel</button><button class="o-btn gold" type="button" data-confirm>Endow for ${o.quote.gain} Charters</button></div></div>`;
      const close = () => {el.remove();focus?.focus();};
      el.querySelector('[data-cancel]').onclick = close;
      el.querySelector('[data-confirm]').onclick = () => {const r = Rewards.estateAction({action:'reset',quote:o.quote});notice = r.ok ? 'Estate saved. Your Charters are ready for the Archive slice.' : r.error;close();api.mark();};
      el.onkeydown = event => {if (event.key === 'Escape') close(); if (event.key === 'Tab') {const first=el.querySelector('[data-cancel]'),last=el.querySelector('[data-confirm]');if (event.shiftKey && document.activeElement === first) {event.preventDefault();last.focus();} else if (!event.shiftKey && document.activeElement === last) {event.preventDefault();first.focus();}}};
      document.body.appendChild(el);el.querySelector('[data-cancel]').focus();
    } catch(error) {notice=error.message;api.mark();}
  }
  if (enabled) (window.__OPS_EXTENSIONS ??= []).push(['estate',{
    tab:['estate','','Estate','Endow a new room','Estate',true],
    visible:c => {try {const e=current(c.state());return e.localImprints >= 3 || e.count > 0;} catch {return true;}},
    init:(_reason,c) => {api=c;},render,actions:{archive:() => api.setTab('archive'),review:preview,back:() => api.setTab('imprints')}
  }]);
  return {enabled,current,quote,project,review,prepare,pending,settleArchiveIncome,clearReview:() => {offer=null;}};
})();
