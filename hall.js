/* LG-09I: acknowledged local observations, one fixed lifetime set. */
window.Hall = (() => {
  'use strict';
  const flags = new URLSearchParams(location.search);
  const enabled = (window.GameFeatures?.enabled('lg09hall') ?? flags.get('lg09hall') === '1') && (window.GameFeatures?.enabled('lg01a') ?? flags.get('lg01a') === '1');
  const id = 'hall:athletic-five:first', members = ['v01','v02','v03','v04','v05'];
  const object = v => v !== null && typeof v === 'object' && !Array.isArray(v);
  const known = id => /^v(0[1-9]|[12][0-9]|30)$/.test(id);
  const bit = v => v === 1 || v === true;
  const recorded = h => new Set(['historical','discovered'].flatMap(k => Object.entries(h?.[k] || {}).filter(([id,v]) => known(id) && bit(v)).map(([id]) => id)));
  function observe(state) {
    const seen = Object.fromEntries(Object.entries(state?.looks || {}).filter(([id,v]) => known(id) && bit(v)).map(([id]) => [id,1]));
    for (const d of state?.desks || []) if (d?.owned === true) for (const t of d.crew || []) if (known(t?.look)) seen[t.look] = 1;
    return seen;
  }
  const complete = h => members.every(id => recorded(h).has(id));
  function validate(state) {
    const h = state.meta?.hall;
    if (h === undefined) return;
    if (!enabled || !object(h) || h.version !== 1 || h.backfillPolicy !== 1 || !object(h.historical) || !object(h.discovered) || !object(h.claims)) throw Error('Unsupported Hall record');
    const c = h.claims[id];
    if (c !== undefined && (!object(c) || c.version !== 1 || c.rule !== 1 || c.id !== id || c.status !== 'committed' || c.reward !== 'RoyaltyRush' ||
        !Array.isArray(c.members) || c.members.join('|') !== members.join('|') || !complete(h))) throw Error('Invalid Track team receipt');
  }
  // The only Hall gold-source predicate, shared by every Rewards consumer.
  function goldSource(state, source) {
    if (source !== id) return false;
    validate(state);
    const c = state.meta?.hall?.claims[id], t = state.rewards?.storedGold?.tokens?.[id];
    return !!c && object(t) && t.origin === id && (t.status === 'stored' && t.activationId === undefined || t.status === 'consumed' && t.activationId === id);
  }
  function candidate(state, action, historical) {
    validate(state);
    const next = JSON.parse(JSON.stringify(state));
    if (action === 'init') {
      if (next.meta.hall !== undefined) throw Error('Hall already initialized');
      next.meta.hall = {version:1,backfillPolicy:1,historical:{...historical},discovered:{},claims:{}};
    } else {
      const h = next.meta.hall;
      if (!h) throw Error('Save Hall history first');
      if (action === 'save') h.discovered = {...h.discovered,...observe(state)};
      else if (action === 'claim') {
        if (!complete(h) || h.claims[id] !== undefined || next.rewards.storedGold.tokens[id] !== undefined) throw Error('Track team cannot be claimed');
        h.claims[id] = {version:1,rule:1,id,status:'committed',reward:'RoyaltyRush',members:[...members]};
        next.rewards.storedGold.tokens[id] = {status:'stored',origin:id};
      } else throw Error('Unknown Hall action');
    }
    if (action !== 'init' && !state.rewards.awayCheckpoint) next.lastSeen = Date.now();
    validate(next);
    return next;
  }
  /* The Look book keeps its original silhouette cards (ops.js); this is only the Track team set and the save control above them. */
  function render(state, catalogue, esc, ready, art) {
    const h = state.meta.hall, saved = recorded(h), live = observe(state), waiting = Object.keys(live).filter(id => !saved.has(id)).length;
    const claimed = !!h?.claims[id], done = complete(h), button = (act,label,ok,tip = '') => `<button type="button" class="o-btn sm" data-act="hall:${act}"${tip ? ` title="${tip}"` : ''}${ok ? '' : ' disabled'}>${label}</button>`;
    /* five portraits: the ones you have saved are in colour, the rest are silhouettes */
    const faces = members.map(i => `<span class="o-trk${saved.has(i) ? ' on' : live[i] ? ' new' : ''}" title="${esc(catalogue.find(l => l.id === i).name)}">${art ? art(i) : ''}</span>`).join('');
    return `<section class="o-card lg09i-set"><div class="o-row"><h3>Track team</h3><span class="o-lvl" role="status" aria-live="polite">${members.filter(i => saved.has(i)).length}/5${waiting ? ` · ${waiting} new` : ''}</span></div><div class="o-trackrow">${faces}</div><div class="o-row o-left">${button('save','Save discoveries',ready && !!h && !!waiting)}${button('claim',claimed ? 'Claimed' : 'Claim Royalty Rush',ready && done && !claimed,'×7 royalties and division income for 15 game seconds, once')}</div></section>`;
  }
  if (enabled) (window.__OPS_EXTENSIONS ??= []).push(['hall',{actions:{save:() => Rewards.hallAction('save'),claim:() => Rewards.hallAction('claim')}}]);
  return Object.freeze({enabled,id,observe,recorded,complete,validate,goldSource,candidate,render});
})();
