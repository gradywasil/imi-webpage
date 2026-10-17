/* LG-05A: a separate, opt-in workstation. No book or reward-catalogue identities. */
window.Folio = (() => {
  'use strict';
  const enabled = (window.GameFeatures?.enabled('lg05folio') ?? new URLSearchParams(location.search).get('lg05folio') === '1');
  const series = [
    {id:'pocket', name:'Pocket tales', leaves:['The ape.', 'The cap.', 'The sun.'], cash:6250, letters:250},
    {id:'journey', name:'Little journeys', leaves:['Pan Wendy.', 'Gold pass.', 'Sweet fudge.'], cash:12500, letters:500},
    {id:'wonder', name:'Forest wonders', leaves:['Alice tunnel.', 'Gorilla forest.', 'Captain whale.'], cash:25000, letters:750}
  ];
  const object = x => !!x && typeof x === 'object' && !Array.isArray(x);
  const integer = x => Number.isSafeInteger(x) && x >= 0;
  const copy = x => JSON.parse(JSON.stringify(x));
  const same = (a,b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
  const entry = id => series.find(x => x.id === id);
  const band = w => Math.max(0, Math.floor((w.length - 2) / 2));
  const pair = x => Array.isArray(x) && x.length === 2 && x.every(n => Number.isInteger(n) && n >= 0 && n < 3) && x[0] !== x[1];
  const rewardValid = r => object(r) && (r.kind === 'cash' || r.kind === 'letters' && integer(r.desk) && r.desk < 6 && /^[A-Z]$/.test(r.letter));
  const selectionValid = x => object(x) && !!entry(x.id) && pair(x.leaves) && rewardValid(x.reward);
  function valid(f) {
    return object(f) && f.version === 1 && window.Layers.epochValid(f) && (f.imprint === undefined || integer(f.imprint)) && integer(f.printing) && typeof f.working === 'boolean' &&
      (f.selection === null || selectionValid(f.selection)) && object(f.completed) && Object.entries(f.completed).every(([id,r]) => entry(id) && object(r) && pair(r.leaves) && rewardValid(r.reward)) &&
      object(f.gallery) && Object.entries(f.gallery).every(([id,r]) => entry(id) && object(r) && integer(r.count) && r.count > 0 && pair(r.leaves)) &&
      (f.cashHead === undefined || markerValid(f.cashHead)) && (f.pending == null || object(f.pending) && selectionValid(f.pending.selection) && integer(f.pending.printing) &&
        f.pending.printing === f.printing && !f.completed[f.pending.selection.id] && (f.pending.selection.reward.kind !== 'cash' ? f.pending.credit === null : markerValid(f.pending.credit) && integer(f.pending.credit.previous) && f.pending.credit.sequence === f.pending.credit.previous + 1 && f.pending.credit.id === cashID(f, f.pending.selection.id) && f.pending.credit.amount === entry(f.pending.selection.id).cash));
  }
  const cashID = (f,id) => f.resetEpoch !== undefined ? window.Layers.identityKey('folio',[f.imprint || 0,f.printing,id],f) : (f.imprint || 0) > 0 ? `folio:${f.imprint}:${f.printing}:${id}` : `folio:${f.printing}:${id}`;
  const markerValid = h => object(h) && typeof h.id === 'string' && /^folio:(?:e(?:0|[1-9]\d*):(?:0|[1-9]\d*):|(?:\d+:)?)\d+:(pocket|journey|wonder)$/.test(h.id) && (!h.id.startsWith('folio:e') || h.id.split(':').slice(1,-1).every(n => integer(Number(n.replace(/^e/,''))))) && integer(h.sequence) && h.sequence > 0 && [6250,12500,25000].includes(h.amount) && h.amount === entry(h.id.split(':').pop())?.cash;
  function current(s) {
    const f = s.meta.folio;
    const imprint = window.Layers?.identity(s) || 0;
    if (f === undefined) return {version:1, printing:s.printing, ...window.Layers.epochFields(s), ...(imprint ? {imprint} : {}), selection:null, working:false, completed:{}, gallery:{}};
    if (!valid(f) || f.pending && (f.printing !== s.printing || (f.imprint || 0) !== imprint || !window.Layers.epochMatches(s,f))) throw Error('Unsupported Folio save. Keep this save and return to production.');
    return f.printing === s.printing && (f.imprint || 0) === imprint && window.Layers.epochMatches(s,f) ? copy(f) : {...copy(f), ...window.Layers.epochFields(s), ...(imprint ? {imprint} : {}), printing:s.printing, selection:null, working:false, completed:{}};
  }
  const unlocked = s => enabled && !!window.Rewards?.enabled && s.intro.done && (s.printing >= 3 || window.Layers?.charter(s));
  function ingredients(selection) {
    const need = {};
    if (selectionValid(selection)) for (const leaf of selection.leaves) for (const w of entry(selection.id).leaves[leaf].toUpperCase().match(/[A-Z]+/g)) need[w] = (need[w] || 0) + 1;
    return need;
  }
  function quote(s, selection) {
    if (!selectionValid(selection)) throw Error('Choose two different leaves and a reward.');
    const need = ingredients(selection), reward = selection.reward, row = entry(selection.id);
    if (!Object.keys(need).every(w => s.desks[band(w)]?.owned && !(s.challenge?.id === 'haiku' && band(w) > 1))) throw Error('Own the ingredient desks before working on this series.');
    if (reward.kind === 'letters' && !s.desks[reward.desk]?.owned) throw Error('Choose an owned desk for the letters.');
    return {need, amount:reward.kind === 'cash' ? row.cash : row.letters, reward};
  }
  function goal(s) {
    if (!unlocked(s)) return null;
    const f = s.meta.folio;
    if (!valid(f) || !window.Layers.epochMatches(s,f) || f.printing !== s.printing || (f.imprint || 0) !== (window.Layers?.identity(s) || 0) || !f.working || f.pending || !f.selection || f.completed[f.selection.id]) return null;
    try { const q = quote(s,f.selection); return {title:'Folio: ' + entry(f.selection.id).name, need:q.need, total:Object.values(q.need).reduce((a,b) => a+b,0)}; } catch { return null; }
  }
  function cashMarker(s, h) {
    const f = s.meta?.folio;
    return valid(f) && markerValid(h) && [f.cashHead, f.pending?.credit].some(r => r && r.id === h.id && r.sequence === h.sequence && r.amount === h.amount);
  }
  // Ops calls this fixed proposal builder. It accepts Folio commands, never arbitrary state.
  function proposal(s, request, marker, manual) {
    const f = current(s), fail = message => { throw Error(message); };
    const action = request.action;
    if (action !== 'finish' && !unlocked(s)) fail('Folio opens free at Printing 4 after the introduction, with safe saving enabled.');
    if (action === 'finish') {
      if (!f.pending || f.printing !== s.printing) fail('No binding is waiting in this Printing.');
      const p = f.pending, selection = p.selection, q = quote(s,selection);
      if (!same(selection,f.selection)) fail('The waiting selection changed.');
      if (selection.reward.kind === 'cash' && !same(marker && {id:marker.id,sequence:marker.sequence,amount:marker.amount}, {id:p.credit.id,sequence:p.credit.sequence,amount:p.credit.amount})) fail('Binding payment is waiting to save.');
      const bank = {...s.bank};
      for (const [w,n] of Object.entries(q.need)) { if (!integer(bank[w]) || bank[w] < n) fail('Binding ingredients changed.'); bank[w] -= n; }
      let letters;
      if (selection.reward.kind === 'letters') {
        const r = selection.reward, before = s.desks[r.desk].letters[r.letter] || 0;
        if (!integer(before) || !integer(before + q.amount)) fail('The letter inventory cannot hold this binding.');
        letters = {desk:r.desk, pool:{...s.desks[r.desk].letters, [r.letter]:before + q.amount}};
      } else f.cashHead = {id:p.credit.id, sequence:p.credit.sequence, amount:p.credit.amount};
      f.completed[selection.id] = {leaves:selection.leaves, reward:selection.reward};
      f.gallery[selection.id] = {...f.gallery[selection.id], count:(f.gallery[selection.id]?.count || 0) + 1, leaves:selection.leaves};
      f.pending = null; f.working = false;
      return {folio:f, bank, letters, earned:selection.reward.kind === 'cash' ? q.amount : 0};
    }
    if (!window.Layers.epochMatches(s,request) || !same(s.meta.folio,request.expected) || f.pending) fail('Folio changed. Choose again.');
    if (action === 'choose') {
      if (request.selection !== null && !selectionValid(request.selection)) fail('Choose two different leaves and a reward.');
      f.selection = copy(request.selection); f.working = false;
    } else if (action === 'return') f.working = false;
    else if (action === 'work' || action === 'prepare') {
      if (s.meta.worksDemo?.working || window.WorksPlay?.current(s)?.working) fail('Pause Works first.');
      const q = quote(s,f.selection);
      if (manual) fail('Sell your manual title or Return to set before working on Folio.');
      if (f.completed[f.selection.id]) fail('This series is already bound this Printing. Read or reorder it freely.');
      if (action === 'work') { if (s.meta.archive?.working != null) fail('Return from Archive restoration first.'); f.working = true; }
      else {
        if (!Object.entries(q.need).every(([w,n]) => integer(s.bank[w]) && s.bank[w] >= n)) fail('Bank every ingredient before binding.');
        const credit = q.reward.kind === 'cash' ? {id:cashID(f,f.selection.id), previous:marker?.sequence || 0, sequence:(marker?.sequence || 0) + 1, amount:q.amount} : null;
        f.pending = {printing:s.printing, selection:copy(f.selection), credit};
      }
    } else if (action === 'reorder') {
      const r = f.gallery[request.id] || f.completed[request.id];
      if (!r) fail('Bind this series before reading it.');
      r.leaves.reverse();
      if (f.completed[request.id]) {
        f.completed[request.id].leaves = [...r.leaves];
        if (f.selection?.id === request.id) f.selection.leaves = [...r.leaves];
      }
    } else fail('Unknown Folio action.');
    return {folio:f};
  }
  let api, message = '';
  function act(action, extra = {}) {
    const result = window.Rewards?.folioAction({action, ...window.Layers.epochFields(api.state()), expected:copy(api.state().meta.folio ?? null), ...extra});
    message = result?.ok ? '' : result?.error || 'Safe saving is unavailable.'; api.mark(); return result;
  }
  const select = selection => act('choose',{selection});
  const escape = s => String(s).replace(/[&<>"']/g,c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const button = (action,text,attrs='') => `<button type="button" class="o-btn" data-act="folio:${action}" ${attrs}>${text}</button>`;
  const rewardText = q => q.reward.kind === 'cash' ? q.amount.toLocaleString('en-US') + ' bananas' : `${q.amount} ${q.reward.letter} letters on ${escape(api.folioDesks[q.reward.desk])}`;
  function render(c, pane) {
    api = c; const s = c.state(); let f;
    try { f = current(s); } catch(e) { c.morph(pane, `<div class="o-card folio"><h3>Folio unavailable</h3><p>${escape(e.message)}</p>${button('back','Return to production')}</div>`); return; }
    let html = `<div class="o-card folio"><h3>Folio</h3><p class="o-dim">Two stories · banked words · one reward</p>${button('back','Return to production')}`;
    if (window.Layers?.enabled) html += button('shelf','Genre shelf');
    if (!unlocked(s)) html += '<p>Finish the introduction and reach Printing 4. Saving must be ready.</p>';
    else if (!f.selection) html += series.map(r => button('series',r.name,`data-id="${r.id}"`)).join('');
    else {
      const x = f.selection, row = entry(x.id), completed = !!f.completed[x.id];
      html += button('list','Back to series') + `<h3>${row.name}</h3><p>Reading order: ${x.leaves.map(i => escape(row.leaves[i])).join(' Then ')}</p>`;
      html += row.leaves.map((leaf,i) => button('leaf',`${x.leaves.includes(i) ? (x.leaves.indexOf(i)+1) + '. ' : ''}${escape(leaf)}`,`data-leaf="${i}" aria-pressed="${x.leaves.includes(i)}"`)).join('') + button('swap','Reverse reading order');
      if (completed) html += '<p class="o-dim">Bound ✓</p>';
      else {
        html += `<h3>Choose your binding reward</h3>${button('cash',row.cash.toLocaleString('en-US') + ' bananas',`aria-pressed="${x.reward.kind === 'cash'}"`)}${button('letters',row.letters + ' chosen letters',`aria-pressed="${x.reward.kind === 'letters'}"`)}`;
        if (x.reward.kind === 'letters') html += `<label>Desk<select data-folio="desk">${s.desks.map((d,i) => d.owned ? `<option value="${i}" ${x.reward.desk === i ? 'selected' : ''}>${escape(c.folioDesks[i])}</option>` : '').join('')}</select></label><label>Letter<select data-folio="letter">${[...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].map(ch => `<option ${ch === x.reward.letter ? 'selected' : ''}>${ch}</option>`).join('')}</select></label>`;
        try {
          const q = quote(s,x), ready = Object.entries(q.need).every(([w,n]) => (s.bank[w] || 0) >= n);
          html += '<h3>Binding preview</h3><ul>' + Object.entries(q.need).map(([w,n]) => `<li>${w} × ${n}, banked ${s.bank[w] || 0}</li>`).join('') + `</ul><p>› <b>${rewardText(q)}</b></p>`;
          html += button('work',f.working ? 'Working on series' : 'Work on series', f.working ? 'disabled' : '') + button('bind','Bind series',ready ? '' : 'disabled');
          if (f.working) html += '<p class="o-dim">Keepers are banking the missing words…</p>';
        } catch(e) { html += `<p>${escape(e.message)}</p>`; }
      }
    }
    if (message) html += `<p role="alert">${escape(message)}</p>`;
    html += '</div><div class="o-card folio"><h3>Completed gallery</h3>' + series.filter(r => f.gallery[r.id]).map(r => `<p>${r.name}, ${f.gallery[r.id].count} bindings</p><p>${f.gallery[r.id].leaves.map(i => escape(r.leaves[i])).join(' Then ')}</p>${button('reorder','Reorder ' + r.name,`data-id="${r.id}"`)}`).join('') + (Object.keys(f.gallery).length ? '' : '<p>Your bound series will appear here.</p>') + '</div>';
    c.morph(pane,html);
  }
  if (enabled) (window.__OPS_EXTENSIONS ??= []).push(['folio', {
    tab:['folio','i-folio', 'Folio','Bind series for one-off rewards','Folio',true], visible:c => c.state().intro.done && (unlocked(c.state()) || c.state().meta.folio !== undefined),
    init:(_reason,c) => { api = c; }, render,
    actions:{
      shelf:() => window.Layers.openShelf(),
      series:el => select({id:el.dataset.id, leaves:[0,1], reward:{kind:'cash'}}),
      list:() => act('choose',{selection:null}),
      leaf:el => { const x = copy(current(api.state()).selection), i = +el.dataset.leaf; if (!x.leaves.includes(i)) { x.leaves = [x.leaves[1],i]; select(x); } },
      swap:() => { const x = copy(current(api.state()).selection); x.leaves.reverse(); select(x); },
      cash:() => { const x = copy(current(api.state()).selection); x.reward = {kind:'cash'}; select(x); },
      letters:() => { const x = copy(current(api.state()).selection); x.reward = {kind:'letters',desk:0,letter:'A'}; select(x); },
      work:() => act('work'), bind:() => act('prepare'),
      back:() => { if (unlocked(api.state()) && valid(api.state().meta.folio)) { if (!act('return')?.ok) return; } api.setTab('floor'); },
      reorder:el => act('reorder',{id:el.dataset.id})
    }
  }]);
  document.addEventListener('change', e => {
    if (!enabled || !e.target.matches('[data-folio]') || !api) return;
    const x = copy(current(api.state()).selection);
    if (e.target.dataset.folio === 'desk') x.reward.desk = +e.target.value; else x.reward.letter = e.target.value;
    select(x);
  });
  return {enabled, valid, current, goal, proposal, cashMarker, ingredients, quote};
})();
