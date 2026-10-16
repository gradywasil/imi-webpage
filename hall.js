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
  function render(state, catalogue, rarity, portrait, esc, ready) {
    const h = state.meta.hall, saved = recorded(h), live = observe(state), waiting = Object.keys(live).filter(id => !saved.has(id)).length;
    const crew = {};
    for (const d of state.desks) if (d.owned) for (const t of d.crew) if (known(t.look)) crew[t.look] = (crew[t.look] || 0) + 1;
    const claimed = !!h?.claims[id], done = complete(h), button = (act,label,ok) => `<button type="button" class="o-btn" data-act="hall:${act}"${ok ? '' : ' disabled'}>${label}</button>`;
    return `<section class="lg09i-hall"><h2>Hall of Monkeys</h2><p>Collect the looks you meet.</p><p><b>Recorded ${saved.size}/30</b> · ${Object.values(crew).reduce((a,b) => a+b,0)} on your crew</p><p role="status" aria-live="polite">${!h ? 'Hall history waiting to save.' : waiting ? `${waiting} discoveries waiting to save.` : 'Discoveries saved.'}</p>${button('save','Save discoveries',ready && !!h && !!waiting)}<details class="o-updetail"><summary class="o-btn">Collection rules</summary><p>Records looks seen in this save, not past spending. Lost history cannot be recovered. Talent, shiny coats and hats are separate.</p></details><section class="o-card lg09i-set"><h3>Track team · ${members.filter(id => saved.has(id)).length}/5</h3><ul>${members.map(id => `<li>${esc(catalogue.find(l => l.id === id).name)}: ${saved.has(id) ? 'Recorded' : 'Not recorded'}</li>`).join('')}</ul><p>One lifetime Royalty Rush. Activate in Awards for ×7 royalties and division income for 15 game seconds. Does not stack.</p>${button('claim',claimed ? 'Track team claimed' : 'Claim Royalty Rush',ready && done && !claimed)}<p>${claimed ? 'Claim saved. This set never grants another token.' : !done ? 'Record all five looks to claim. Existing hires and rerolls use chance.' : !ready ? 'Waiting to save.' : 'All five recorded. Ready to claim.'}</p></section>${Object.entries(rarity).map(([r,info]) => {const looks=catalogue.filter(l => l.r===r);return `<h3>${esc(info.name)} · ${looks.filter(l=>saved.has(l.id)).length}/${looks.length}</h3><div class="lg09i-grid">${looks.map(l => `<div class="o-card lg09i-look"><span aria-hidden="true">${portrait(l.id)}</span><b>${esc(l.name)}</b><span>${esc(info.name)} · ${esc(l.trait)}</span><span>${saved.has(l.id) ? 'Seen' : 'Not recorded'}${crew[l.id] ? ` · ${crew[l.id]} on crew` : ''}</span></div>`).join('')}</div>`;}).join('')}</section>`;
  }
  if (enabled) (window.__OPS_EXTENSIONS ??= []).push(['hall',{actions:{save:() => Rewards.hallAction('save'),claim:() => Rewards.hallAction('claim')}}]);
  return Object.freeze({enabled,id,observe,recorded,complete,validate,goldSource,candidate,render});
})();
