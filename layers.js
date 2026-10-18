/* LG-05B. Voluntary Imprint foundations, with no default save initialization. */
window.Layers = (() => {
  'use strict';
  const flags = new URLSearchParams(location.search);
  const enabled = (window.GameFeatures?.enabled('lg05layers') ?? flags.get('lg05layers') === '1') && (window.GameFeatures?.enabled('lg05folio') ?? flags.get('lg05folio') === '1') && !!window.Rewards?.enabled;
  const genres = [
    {id:'mystery', name:'Mystery', letters:'CDELN', bands:[1,2], muse:'christie', text:'The lost hat was under the map.'},
    {id:'romance', name:'Romance', letters:'AEHRT', bands:[0,1], muse:'austen', text:'Two shy apes share a picnic and a kind note.'},
    {id:'sci-fi', name:'Sci-fi', letters:'JKQXZ', bands:[4,5], muse:'tolken', text:'Our moon robot grows a pea.'},
    {id:'horror', name:'Horror', letters:'GHOTU', bands:[3,4], muse:'poe', text:'The attic ghost just wants a warm hat.'},
    {id:'comedy', name:'Comedy', letters:'BFMPY', bands:[0,3], muse:'twain', text:'The mayor slipped into a tub of jam.'},
    {id:'poetry', name:'Poetry', letters:'AEIOU', bands:[2,5], muse:'dick', text:'Rain taps; leaves clap; we nap.'}
  ];
  const STAR_K = window.Economy?.starScale ?? 10;                 // Legacy stars are counted in tenths of the old unit
  const object = x => !!x && typeof x === 'object' && !Array.isArray(x);
  const integer = x => Number.isSafeInteger(x) && x >= 0;
  const copy = x => JSON.parse(JSON.stringify(x));
  const same = (a,b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
  const genre = id => genres.find(g => g.id === id);
  /* long-game Imprint upgrades, in Press Seals: Rebuild Blueprint, House Style, Editorial Exchange, Touring Staff */
  const EXTRA = {blueprint:2, style:1, exchange:2, touring:3};
  const EXTRA_ART = {blueprint:'a-blueprint', style:'f-genre', exchange:'f-batch', touring:'a-foreman'};
  const EXTRA_NAME = {blueprint:'Rebuild Blueprint', style:'House Style', exchange:'Editorial Exchange', touring:'Touring Staff'};
  const EXTRA_TEXT = {blueprint:'Every room starts with Keeper Batches I.', style:'A new Imprint keeps the genre you chose.', exchange:'Surplus words of a band become the missing word of the current goal in that band, three for one, a couple of times a spell.', touring:'Pick one machine: it types 1.25x faster. Nothing else changes.'};
  function current(s) {
    estateIdentity(s);
    const l = s.meta.layers;
    if (l === undefined) return {version:1, count:0, baseline:0, seals:0, highestPrinting:0, purchases:{}, genre:null, stamps:{}};
    if (!object(l) || l.version !== 1 || !['count','baseline','seals','highestPrinting'].every(k => integer(l[k])) ||
        !object(l.purchases) || ['press','charter','shelf'].some(k => l.purchases[k] !== undefined && typeof l.purchases[k] !== 'boolean') ||
        l.purchases.charter && !l.purchases.press || l.purchases.shelf && !l.purchases.charter || l.genre !== null && !genre(l.genre) || !object(l.stamps) ||
        Object.entries(l.stamps).some(([id,v]) => !genre(id) || v !== true) ||
        l.shelf !== undefined && (!Array.isArray(l.shelf) || l.shelf.length > 3 || new Set(l.shelf).size !== l.shelf.length ||
          l.shelf.some(id => !genre(id) || !l.stamps[id]) || l.shelf.length > 0 && !l.purchases.shelf)) throw Error('Unsupported Imprint save. It has been preserved.');
    return copy(l);
  }
  // Optional identity only. No caller installs this namespace during ordinary play.
  function estateIdentity(s) {
    const e = s.meta.estate;
    if (e === undefined) return undefined;
    if (!object(e) || e.version !== 1 || !integer(e.localImprints) || !integer(e.resetEpoch) || ['count','starBaseline','charters'].some(k => e[k] !== undefined && !integer(e[k]))) throw Error('Unsupported Estate identity. Save preserved.');
    return copy(e);
  }
  const epochValid = p => p.resetEpoch === undefined || integer(p.resetEpoch);
  const epochFields = s => { const e = estateIdentity(s); return e === undefined ? {} : {resetEpoch:e.resetEpoch}; };
  const epochMatches = (s,p) => { try { return epochValid(p) && p.resetEpoch === estateIdentity(s)?.resetEpoch; } catch { return false; } };
  const identityKey = (prefix,parts,p) => {
    if (!epochValid(p)) throw Error('Unsupported reset epoch.');
    return [prefix, ...(p.resetEpoch === undefined ? [] : ['e' + p.resetEpoch]), ...parts].join(':');
  };
  function identityReady(s) {
    estateIdentity(s);
    window.Archive?.retained(s);
    window.WorksDemo?.retained(s);
    window.WorksPlay?.retained(s);
    if (s.meta.folio?.pending || s.meta.layers?.pending || s.meta.automation?.pitch?.sale || s.meta.automation?.media?.pending ||
        s.rewards?.awayCheckpoint || s.prem?.vault?.transition || Object.values(s.rewards?.claims || {}).some(c => c.status === 'prepared') ||
        window.Rewards?.held?.() || window.IMI?.ops?.extensions?.identitySettled?.() === false) throw Error('Finish original pending recovery before changing reset identity.');
  }
  function initializeIdentity(s) {
    identityReady(s);
    if (estateIdentity(s) !== undefined) throw Error('Estate identity is already initialized.');
    return {version:1, localImprints:current(s).count, resetEpoch:0};
  }
  function advanceIdentity(s, foundation = false) {
    const e = estateIdentity(s);
    if (e === undefined) return undefined;
    identityReady(s);
    if (!integer(e.resetEpoch + 1) || foundation && !integer(e.localImprints + 1)) throw Error('Reset identity cannot advance safely.');
    return {...e, resetEpoch:e.resetEpoch + 1, localImprints:e.localImprints + (foundation ? 1 : 0)};
  }
  const identity = s => integer(s.meta.layers?.count) ? s.meta.layers.count : 0;
  const active = s => {
    if (!enabled) return null;
    try { const l = current(s); return l.count && l.purchases.press ? genre(l.genre) : null; } catch { return null; }
  };
  const charter = s => {
    if (!enabled) return false;
    try { const l = current(s); return l.count > 0 && l.purchases.charter === true; } catch { return false; }
  };
  function settled(s, shelfEdit = false) {
    window.Archive?.retained(s);
    window.WorksDemo?.retained(s);
    window.WorksPlay?.retained(s);
    if (window.IMI.ops.extensions.layerSettled && !window.IMI.ops.extensions.layerSettled()) throw Error('Finish the waiting production, training, helper or Break Room choice first.');
    if (s.challenge || s.meta.minigames?.active || s.meta.folio?.pending || !shelfEdit && s.meta.folio?.working ||
        s.rewards.awayCheckpoint || s.prem.vault?.transition || s.meta.layers?.pending ||
        Object.values(s.rewards.claims || {}).some(c => c.status === 'prepared')) throw Error('Finish the challenge, break, Folio work and waiting saves first.');
    if (s.meta.folio !== undefined && !window.Folio.valid(s.meta.folio) || s.meta.minigames !== undefined && s.meta.minigames.version !== 1 ||
        s.meta.productionGoal !== undefined && s.meta.productionGoal.version !== 1 || s.meta.trainingPool !== undefined && s.meta.trainingPool.version !== 1 ||
        s.meta.automation !== undefined && s.meta.automation.version !== 1) throw Error('Unsupported retained progression. This save has been preserved.');
  }
  function quote(s) {
    if (!enabled || !window.Rewards.owns()) throw Error('Imprints require all three development flags and save ownership.');
    const l = current(s), total = s.legacy.total, delta = total - l.baseline;
    settled(s);
    advanceIdentity(s, true);
    if (!s.intro.done || s.printing < 7 || !integer(total) || total < 60 * STAR_K || delta < 60 * STAR_K) throw Error('Requires Printing 8 and ' + 60 * STAR_K + ' newly awarded lifetime Legacy stars since the last foundation.');
    if (!integer(l.count + 1) || !integer(l.seals + Math.floor(Math.sqrt(delta / (15 * STAR_K))))) throw Error('The Imprint balance cannot represent this foundation.');
    return {...epochFields(s), count:l.count, baseline:l.baseline, total, printing:s.printing, seals:Math.floor(Math.sqrt(delta / (15 * STAR_K))), delta};
  }
  // Overwrite only room fields. Everything else, including unknown top-level/meta data, survives.
  function projectRoom(s, fresh) {
    const next = copy(s);
    const room = ['focus','autoFocus','printing','run','challenge','muses','garden','divs','offers','market','agent','analyst','pitchteam','carbon','baro','pub','lamp','deals','hold','metro','dbl','contracts','sel','written','bank','desks'];
    for (const key of room) next[key] = object(fresh[key]) ? {...next[key], ...fresh[key]} : copy(fresh[key]);
    // These maps are room inventory; old keys must not survive the merge above.
    for (const key of ['written','bank','deals']) next[key] = {};
    next.desks = fresh.desks.map((d,i) => ({...s.desks[i], ...d, up:{...s.desks[i]?.up, ...d.up}, keeper:{...s.desks[i]?.keeper, ...d.keeper}}));
    for (const key of ['sb','fmRun','fmSecs','fmBp','xFund','xFundW','xFundL','hxCount','sbBp']) delete next[key];
    if (window.Campus && next.meta?.campus) next.meta = {...next.meta, campus:window.Campus.afterReset(next.meta.campus)};     // the Annex is rebuilt with the room; its deed and settings stay     // run-scoped state of the long-game package never outlives its room
    next.editions = {...s.editions};
    for (const id of Object.keys(s.written)) next.editions[id] = (next.editions[id] || 0) + 1;
    next.legacy = copy(s.legacy);
    return next;
  }
  function finishRoom(s, next) {
    window.WorksPlay?.exit(next);
    if (next.meta.worksDemo) next.meta.worksDemo = {...next.meta.worksDemo,working:false};
    if (next.meta.archive) next.meta.archive = {...next.meta.archive,working:null};
    if (next.meta.productionGoal) next.meta.productionGoal.manual = null;
    window.IMI?.ops?.extensions?.clearGardenPending?.(next);
    window.IMI?.ops?.extensions?.clearPitchPending?.(next);
    window.IMI?.ops?.extensions?.clearMuseIncomplete?.(next);
    if (next.meta.folio) next.meta.folio = {...window.Folio.current(s), ...epochFields(next), imprint:identity(next), printing:0, selection:null, working:false, completed:{}, pending:null};
    next.rewards.activeGold = null;
    return next;
  }
  function project(s, fresh) {
    const q = quote(s), l = current(s), next = projectRoom(s, fresh);
    const estate = advanceIdentity(s, true);
    if (estate !== undefined) next.meta.estate = estate;
    next.meta.layers = {...l, count:l.count + 1, baseline:q.total, seals:l.seals + q.seals,
      highestPrinting:Math.max(l.highestPrinting, s.printing + 1), genre:window.LegacyB?.enabled() && l.purchases.style ? l.genre : null};
    finishRoom(s,next);
    if (next.meta.folio) next.meta.folio = {...next.meta.folio, ...epochFields(next), imprint:l.count + 1};
    return next;
  }
  function proposal(s, request) {
    if (!enabled) throw Error('Imprints are disabled.');
    const l = current(s);
    if (!epochMatches(s,request) || !same(s.meta.layers,request.expected)) throw Error('Imprints changed. Review the current offer.');
    settled(s, ['slot','remove','clear'].includes(request.action) || request.action === 'buy' && request.id === 'shelf');
    if (!s.intro.done || !l.count) throw Error('Found the first Imprint before buying its benefits.');
    if (request.action === 'buy') {
      const extra = window.LegacyB?.enabled() ? EXTRA : {}, cost = request.id === 'shelf' ? 2 : extra[request.id] ?? 1;
      if (!['press','charter','shelf',...Object.keys(extra)].includes(request.id) || l.purchases[request.id] || l.seals < cost ||
          request.id === 'charter' && !l.purchases.press || request.id === 'shelf' && !l.purchases.charter || extra[request.id] && !l.purchases.press) throw Error('Purchase unavailable, already owned, or insufficient Seals.');
      l.seals -= cost; l.purchases[request.id] = true;
    } else if (request.action === 'genre') {
      if (!l.purchases.press || l.genre || !genre(request.id)) throw Error('Choose one genre per Imprint after buying Genre press.');
      l.genre = request.id;
    } else if (['slot','remove','clear'].includes(request.action)) {
      if (!l.purchases.shelf) throw Error('Buy Mixed shelf before curating stamps.');
      const slots = l.shelf || [];
      if (request.action === 'slot') {
        if (!genre(request.id) || !l.stamps[request.id] || slots.includes(request.id)) throw Error('Choose a different earned stamp.');
        if (slots.length === 3) throw Error('Shelf full. Remove a stamp before choosing another.');
        l.shelf = [...slots, request.id];
      } else if (request.action === 'remove') {
        if (!slots.includes(request.id)) throw Error('That stamp is not on the shelf.');
        l.shelf = slots.filter(id => id !== request.id);
      } else l.shelf = [];
    } else throw Error('Unknown Imprint command.');
    return l;
  }
  function stamp(s) {
    const g = active(s);
    if (!g) return null;
    const l = current(s); l.stamps[g.id] = true; return l;
  }
  function pending(s) {
    const l = current(s), p = l.pending;
    if (!enabled || !object(p) || !epochMatches(s,p) || p.id !== identityKey('imprint',[l.count + 1,p.total],p) || p.total !== s.legacy.total ||
        !integer(p.seed) || p.seed % window.Economy.scale || !object(p.candidate) || p.candidate.printing !== 0 ||
        p.candidate.meta.layers?.count !== l.count + 1 || p.candidate.meta.layers?.baseline !== p.total || p.candidate.meta.layers?.pending ||
        !same(p.marker,window.IMI.bananas.acknowledgement())) throw Error('Waiting Imprint requires its original flags, intent and wallet provenance.');
    current(p.candidate);
    const e = estateIdentity(s), next = estateIdentity(p.candidate);
    if (e === undefined ? next !== undefined : !next || next.resetEpoch !== e.resetEpoch + 1 || next.localImprints !== e.localImprints + 1) throw Error('Waiting foundation identity changed.');
    return p;
  }
  function shelfBonus(s) {
    if (!enabled) return 0;
    try {
      const l = current(s), slots = l.shelf || [];
      if (!l.count || !l.purchases.shelf) return 0;
      const pair = [['mystery','horror'],['romance','poetry'],['sci-fi','comedy']].some(p => p.every(id => slots.includes(id)));
      return (slots.length === 3 ? .05 : 0) + (pair ? .05 : 0);
    } catch { return 0; }
  }
  const saleFactor = (s, band, museOn) => { const g = active(s); return (g ? (g.bands.includes(band) ? 1.15 : .95) * (museOn(g.muse) ? 1.05 : 1) : 1) * (1 + shelfBonus(s)); };
  const weights = (s, base) => { const g = active(s); return g ? Object.fromEntries(Object.entries(base).map(([ch,n]) => [ch,n * (g.letters.includes(ch) ? 1.25 : 1)])) : base; };
  let api, notice = '', confirmation = null, shelfFirst = false;
  const escape = s => String(s).replace(/[&<>"']/g,c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const genreText = g => `${g.letters}; bands ${g.bands.map(b => `${2*b+2}-${2*b+3}`).join(', ')}. Muse fit: ${escape(api.layerMuseName(g.muse))}. ${g.text}`;
  const button = (action,text,attrs='') => `<button type="button" class="o-btn" data-act="layers:${action}" ${attrs}>${text}</button>`;
  function act(action,id) {
    const result = window.Rewards.layerAction({action,id,...epochFields(api.state()),expected:copy(api.state().meta.layers ?? null)});
    notice = result.ok ? '' : result.error; api.mark();
    if (result.ok && action === 'buy' && EXTRA[id] && window.LGFX) { window.LGFX.sfx('levelup'); if (window.Juice) window.Juice.stamp(EXTRA_NAME[id], { tier: 1 }); }
    return result;
  }
  function shelfUI(s, l) {
    const slots = l.shelf || [], bonus = shelfBonus(s), owned = l.purchases.shelf;
    return `<section class="o-card layers layer-shelf"><h3>Genre shelf</h3>${button('folio','Return to Folio')}<p>Mixed shelf: ${owned ? 'owned' : '2 current Press Seals. Requires Genre press and Folio charter.'}</p>${owned ? '' : button('shelf','Buy Mixed shelf · 2 Seals',!l.count || !l.purchases.charter || l.seals < 2 ? 'disabled' : '')}<p>Title-sale bonus: +${Math.round(bonus * 100)}%.</p><details class="o-updetail"><summary class="o-btn">Shelf bonus rules</summary><p>${slots.length === 3 ? 'Three distinct stamps: +5%.' : 'Three distinct stamps give +5%.'} ${bonus > (slots.length === 3 ? .05 : 0) ? 'Complementary pair: +5%.' : 'A complementary pair gives +5%.'} Maximum +10%. Royalties and Folio rewards stay the same.</p><p>Pairs: Mystery + Horror, Romance + Poetry, Sci-fi + Comedy. Order is free and does not change the bonus.</p></details><h4>Slots ${slots.length} / 3</h4>${slots.map((id,i) => `<p>${i+1}. ${escape(genre(id).name)}</p>${button('remove','Remove ' + genre(id).name,`data-id="${id}"`)}`).join('') || '<p>No stamps slotted.</p>'}${owned ? button('clear','Clear shelf',slots.length ? '' : 'disabled') : ''}${slots.length === 3 ? '<p>Shelf full. Remove a stamp to choose another.</p>' : ''}<h4>Genre stamps</h4>${genres.map(g => `<p>${g.name}: ${l.stamps[g.id] ? 'earned' : 'not earned. Bind Folio in this genre to earn it.'}</p>${owned && l.stamps[g.id] ? button('slot',slots.includes(g.id) ? g.name + ' slotted' : 'Slot ' + g.name,`data-id="${g.id}" ${slots.includes(g.id) || slots.length === 3 ? 'disabled' : ''}`) : ''}`).join('')}</section>`;
  }
  function render(c, pane) {
    api = c; const s = c.state(); let l, q, why = '';
    try { l = current(s); try { q = quote(s); } catch(e) { why = e.message; } }
    catch(e) { c.morph(pane, `<div class="o-card layers"><h3>Imprints unavailable</h3><p>${escape(e.message)}</p>${button('back','Back to Legacy')}</div>`); return; }
    let html = `<div class="o-card layers"><h3>Imprints</h3>${button('back','Back to Legacy')}<p>Imprints ${l.count} · Press Seals ${l.seals}</p><span class="o-prog" role="img" aria-label="Awarded stars toward the next Imprint"><i style="width:${Math.max(0, Math.min(100, Math.round(100 * (s.legacy.total - l.baseline) / (60 * STAR_K))))}%"></i></span><p class="o-dim">${s.legacy.total - l.baseline} / ${60 * STAR_K} · Printing ${s.printing + 1} / 8</p>${q ? `<p>+${q.seals} Seals</p>` : /^Requires Printing 8/.test(why) ? '' : `<p class="o-dim">${escape(why)}</p>`}${button('preview','Review foundation',q ? '' : 'disabled')}</div>`;
    if (l.count) {
      html += `<div class="o-card layers"><h3>Permanent purchases</h3>${button('press',l.purchases.press ? 'Genre press owned' : 'Buy Genre press · 1 Seal',l.purchases.press || l.seals < 1 ? 'disabled' : '')}${button('charter',l.purchases.charter ? 'Folio charter owned' : 'Buy Folio charter · 1 Seal',l.purchases.charter || !l.purchases.press || l.seals < 1 ? 'disabled' : '')}${window.LegacyB?.enabled() && window.LGFX && l.purchases.press ? `<div class="lgx-row">${Object.entries(EXTRA).map(([id,cost]) => window.LGFX.tile({art:EXTRA_ART[id],sz:44,cost:l.purchases[id] ? undefined : cost,kind:'seal',act:'layers:' + id,ok:!l.purchases[id] && l.seals >= cost,on:!!l.purchases[id],label:EXTRA_NAME[id],why:EXTRA_NAME[id] + '. ' + EXTRA_TEXT[id]})).join('')}</div>` : ''}</div>${window.LegacyB?.enabled() && window.HouseUI ? window.HouseUI.html(api) : ''}`;
      html += `<div class="o-card layers"><h3>${l.genre ? escape(genre(l.genre).name) + ' Imprint' : 'Neutral Imprint'}</h3>`;
      if (l.purchases.press && !l.genre) html += genres.map(g => `${button('genre',g.name,`data-id="${g.id}"`)}<p>${genreText(g)}</p>`).join('');
      else if (l.genre) html += `<p>${genreText(genre(l.genre))}</p>`;
      html += `<p>Permanent Folio stamps: ${genres.filter(g => l.stamps[g.id]).map(g => g.name).join(', ') || 'None yet. Bind in an active genre to earn its stamp.'}</p></div>`;
    }
    html = shelfFirst ? shelfUI(s,l) + html : html + shelfUI(s,l);
    if (notice) html += `<p class="layers" role="alert">${escape(notice)}</p>`;
    c.morph(pane, html);
  }
  function preview() {
    try {
      const s = api.state(), offer = api.layerPreview(); confirmation?.remove();
      const el = document.createElement('div'); confirmation = el; el.className = 'o-modal layer-confirm'; el.setAttribute('role','dialog'); el.setAttribute('aria-modal','true'); el.setAttribute('aria-labelledby','layerTitle');
      el.innerHTML = `<div class="o-modal-card"><h3 id="layerTitle">Found an Imprint?</h3><div class="layer-details" tabindex="0"><p>Gain exactly ${offer.quote.seals} Press Seals. Baseline becomes ${offer.quote.total} awarded lifetime stars. Restart at Printing 1 with ${offer.seed.toLocaleString('en-US')} Seed Money bananas, excluded from run income.</p><p>${offer.reward ? `First foundation: ${offer.reward.amount} balanced letters on starting Bamboo, locked now from its projected productive rate.` : 'First foundation Letters already claimed. No repeat reward.'}</p><h4>Lose this room</h4><p>${s.desks.filter(d => d.owned).length} desks, ${s.desks.reduce((n,d) => n+d.paws,0)} typists, ${window.IMI.bananas.get().toLocaleString('en-US')} bananas, all held letters/trays and banked words. Reset training/coaching/Mk, run earnings, local Printing multiplier, active buffs, Shop, Publisher, lamp, market, divisions, deals, garden and Muse invitations/seats. Clear current book/cadences/Folio selection and current completions.</p><h4>Retain permanently</h4><p>${s.legacy.stars} current and ${s.legacy.total} lifetime Legacy stars, all Legacy upgrades, helper levels/settings, challenge clears/mastery, awards/claims/stored gold, stats/looks, daily history, pitches/IDs and all earlier editions. Current written titles become earlier editions once. Keep DB/premium entitlements, Inspiration/fraction/tree/attempts/refill/session IDs, production/training preferences/reserves, Folio gallery/stamps, Seals/purchases/shelf and unknown save fields. Veteran Crew still supplies its starters. Choose a new genre after founding.</p></div><div class="o-row"><button class="o-btn" type="button" data-cancel>Cancel</button><button class="o-btn gold" type="button" data-found>Found for ${offer.quote.seals} Seals</button></div></div>`;
      const close = () => { el.remove(); confirmation = null; };
      el.querySelector('[data-cancel]').onclick = close;
      el.querySelector('[data-found]').onclick = () => { const result = window.Rewards.layerAction({action:'found', quote:offer.quote, expected:copy(s.meta.layers ?? null)}); notice = result.ok ? '' : result.error; close(); api.mark(); };
      el.onkeydown = e => { if (e.key === 'Escape') close(); if (e.key === 'Tab') { const first = el.querySelector('[data-cancel]'), last = el.querySelector('[data-found]'); if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); } } };
      document.body.appendChild(el); el.querySelector('[data-cancel]').focus();
    } catch(e) { notice = e.message; api.mark(); }
  }
  if (enabled) (window.__OPS_EXTENSIONS ??= []).push(['layers', {
    tab:['imprints','i-imprint', 'Imprints','Reset again for Press Seals','Imprints',true], visible:c => shelfFirst || c.state().printing >= 7 || identity(c.state()) > 0,
    init:(_reason,c) => { api = c; }, render,
    actions:{open:() => { shelfFirst = false; api.setTab('imprints'); }, back:() => api.setTab('legacy'), preview,
      folio:() => api.setTab('folio'), shelf:() => act('buy','shelf'),
      slot:el => act('slot',el.dataset.id), remove:el => act('remove',el.dataset.id), clear:() => act('clear'),
      press:() => act('buy','press'), charter:() => act('buy','charter'), genre:el => act('genre',el.dataset.id),
      blueprint:() => act('buy','blueprint'), style:() => act('buy','style'), exchange:() => act('buy','exchange'), touring:() => act('buy','touring')}
  }]);
  return {enabled, current, estateIdentity, epochValid, epochFields, epochMatches, identityKey, identityReady, initializeIdentity, advanceIdentity, identity, active, charter, settled, quote, projectRoom, finishRoom, project, proposal, stamp, pending, saleFactor, shelfBonus, openShelf:() => { shelfFirst = true; api.setTab('imprints'); }, weights, genres, same};
})();
