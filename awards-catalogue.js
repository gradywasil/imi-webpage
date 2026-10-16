/* LG-10A approved first tranche. Optional; the original catalogue remains in Ops. */
window.AwardsCatalogue = (() => {
  'use strict';
  const flags = new URLSearchParams(location.search);
  const enabled = (window.GameFeatures?.enabled('lg10awards') ?? flags.get('lg10awards') === '1') && (window.GameFeatures?.enabled('lg01a') ?? flags.get('lg01a') === '1');
  const policy = 'lg10a-db-only-v1';
  const rows = Object.freeze([
    Object.freeze({"id":"lg10-folio-trio","name":"Bound Together","desc":"Bind Pocket tales, Little journeys and Forest wonders in one Printing.","tier":1,"kind":"L"}),
    Object.freeze({"id":"lg10-room-quartet","name":"Four Ways to Work","desc":"Clear Small Crew, Quiet Shop, Patient Press and Bare Metal.","tier":1,"kind":"L"}),
    Object.freeze({"id":"lg10-two-stamps","name":"Different Impressions","desc":"Earn stamps in two different Imprint genres.","tier":1,"kind":"L"}),
    Object.freeze({"id":"lg10-mixed-shelf","name":"Three on the Shelf","desc":"Curate three different earned genre stamps on your Mixed shelf.","tier":1,"kind":"G"}),
    Object.freeze({"id":"lg10-imprint-quartet","name":"Four Imprint Trials","desc":"Clear Hand-planted, One brief, Paper only and Fixed cast.","tier":1,"kind":"D","amount":2}),
    Object.freeze({"id":"lg10-manual-pair","name":"Know the Work","desc":"Save a manual garden cycle and a manual commission followed by its tracked sale.","tier":1,"kind":"L"}),
    Object.freeze({"id":"lg10-manual-quartet","name":"Department Teacher","desc":"Save manual proof for garden, pitching, media and Muse direction.","tier":2,"kind":"G"}),
    Object.freeze({"id":"lg10-estate-two","name":"A Continuing Estate","desc":"Endow the Estate twice in this local history.","tier":2,"kind":"D","amount":4}),
    Object.freeze({"id":"lg10-archive-pair","name":"Restored in Full","desc":"Finish both restoration deposits on two different active Archive titles.","tier":1,"kind":"L"}),
    Object.freeze({"id":"lg10-works-ten","name":"Ten Editions In","desc":"Complete ten editions of A Midsummer Night's Chimp.","tier":1,"kind":"L"}),
  ]);
  const row = id => rows.find(r => r.id === id);
  const source = id => id.startsWith('award:') ? row(id.slice(6)) : undefined;
  const copy = x => JSON.parse(JSON.stringify(x));
  const object = x => !!x && typeof x === 'object' && !Array.isArray(x);
  const fail = () => { throw Error('Unsupported expanded awards. Save preserved.'); };
  function proof(id, s, manual) {
    const meta = s.meta, base = {printing:s.printing, meta:{}, chDone:{}};
    const done = ids => ids.every(k => s.chDone[k] === true);
    let qualifies = false;
    if (id === 'lg10-folio-trio') {
      if (meta.folio === undefined) return null;
      if (!Folio.valid(meta.folio)) fail();
      const f = Folio.current(s);
      qualifies = !f.pending && ['pocket','journey','wonder'].every(k => object(f.completed[k]));
      base.meta = {folio:{version:1,printing:f.printing,...Layers.epochFields(s),...(f.imprint === undefined ? {} : {imprint:f.imprint}),selection:null,working:false,completed:copy(f.completed),gallery:{}},layers:{count:Layers.identity(s)},...(meta.estate === undefined ? {} : {estate:{version:1,localImprints:meta.estate.localImprints,resetEpoch:meta.estate.resetEpoch}})};
    } else if (['lg10-room-quartet','lg10-imprint-quartet'].includes(id)) {
      const ids = id === 'lg10-room-quartet' ? ['smallcrew','quietshop','patientpress','baremetal'] : ['handplanted','onebrief','paperonly','fixedcast'];
      qualifies = done(ids); base.chDone = Object.fromEntries(ids.map(k => [k,s.chDone[k] === true]));
    } else if (['lg10-two-stamps','lg10-mixed-shelf'].includes(id)) {
      const l = Layers.current(s);
      qualifies = id === 'lg10-two-stamps' ? Object.values(l.stamps).filter(v => v === true).length >= 2 : l.purchases.shelf === true && l.shelf?.length === 3;
      base.meta.layers = l;
    } else if (['lg10-manual-pair','lg10-manual-quartet'].includes(id)) {
      if (!manual(s)) fail();
      const a = meta.automation, ids = id === 'lg10-manual-pair' ? ['garden','pitch'] : ['garden','pitch','media','muse'];
      qualifies = a?.version === 1 && ids.every(k => a[k]?.version === 1 && a[k].manual?.complete === true);
      if (qualifies) base.meta.automation = {version:1,...Object.fromEntries(ids.map(k => [k,{version:1,manual:copy(a[k].manual)}]))};
    } else if (id === 'lg10-estate-two') {
      const e = Layers.estateIdentity(s); qualifies = e?.count >= 2;
      if (e) base.meta.estate = e;
    } else if (id === 'lg10-archive-pair') {
      const a = Archive.current(s); qualifies = a.entries.filter(e => e.deposits === 2).length >= 2;
      const entries = a.entries.filter(e => e.deposits === 2).slice(0,2);
      base.meta.archive = {...a,entries,memorial:[],working:null,usedCopies:Object.fromEntries(entries.map(e => [e.title,a.usedCopies[e.title]]))};
    } else if (id === 'lg10-works-ten') {
      WorksPlay.retained(s); qualifies = meta.works?.version === 1 && meta.works.index >= 2000;
      if (qualifies) {base.meta.works = copy(meta.works); base.desks = s.desks.map(() => ({}));}
    } else fail();
    return qualifies ? {rule:1,source:base} : null;
  }
  const fundingEnabled = enabled && (window.GameFeatures?.enabled('lg02funding') ?? flags.get('lg02funding') === '1');
  const fundingPolicy = 'lg02e-db-only-v1';
  const fundingRows = Object.freeze([
    Object.freeze({id:'lg02e-stamps-four',name:'Four kinds of story',desc:'Earn four different Imprint genre stamps.',tier:2,kind:'D',amount:5}),
    Object.freeze({id:'lg02e-stamps-six',name:'Every genre on the shelf',desc:'Earn all six Imprint genre stamps.',tier:2,kind:'D',amount:5}),
    Object.freeze({id:'lg02e-estate-three',name:'An established Estate',desc:'Endow the Estate three times in this local history.',tier:2,kind:'D',amount:5}),
    Object.freeze({id:'lg02e-archive-three',name:'A restored collection',desc:'Finish both restoration deposits on three different active Archive titles.',tier:2,kind:'D',amount:5}),
    Object.freeze({id:'lg02e-manual-gold',name:'Small crew, full repertoire',desc:'Save manual Gold mastery in Small Crew.',tier:2,kind:'D',amount:5}),
    Object.freeze({id:'lg02e-works-quarter',name:'A quarter of the first play',desc:"Complete 25 editions of A Midsummer Night's Chimp.",tier:2,kind:'D',amount:5}),
    Object.freeze({id:'lg02e-works-half',name:'Half of the first play',desc:"Complete 50 editions of A Midsummer Night's Chimp.",tier:2,kind:'D',amount:5}),
  ]);
  const fundingRow = id => fundingRows.find(r => r.id === id);
  function fundingProof(id, s, mastery) {
    const base = {printing:s.printing,meta:{},chDone:{}};
    let qualifies = false;
    if (['lg02e-stamps-four','lg02e-stamps-six'].includes(id)) {
      const l = Layers.current(s), e = Layers.estateIdentity(s);
      qualifies = Object.values(l.stamps).filter(v => v === true).length >= (id === 'lg02e-stamps-four' ? 4 : 6);
      base.meta.layers = l;
      if (e !== undefined) base.meta.estate = e;
    } else if (id === 'lg02e-estate-three') {
      const e = Layers.estateIdentity(s); qualifies = e?.count >= 3;
      if (e !== undefined) base.meta.estate = e;
    } else if (id === 'lg02e-archive-three') {
      const a = Archive.current(s), entries = a.entries.filter(e => e.deposits === 2).slice(0,3);
      qualifies = entries.length === 3;
      base.meta.archive = {...a,entries,memorial:[],working:null,usedCopies:Object.fromEntries(entries.map(e => [e.title,a.usedCopies[e.title]]))};
      delete base.meta.archive.pending;
    } else if (id === 'lg02e-manual-gold') {
      mastery(s);
      qualifies = AutoChallenge.gold(s.meta.challengeMastery?.highest);
      if (qualifies) base.meta.challengeMastery = {version:1,sequence:s.meta.challengeMastery.sequence,highest:copy(s.meta.challengeMastery.highest)};
    } else if (['lg02e-works-quarter','lg02e-works-half'].includes(id)) {
      WorksPlay.retained(s);
      qualifies = s.meta.works?.version === 1 && s.meta.works.index >= (id === 'lg02e-works-quarter' ? 5000 : 10000);
      if (qualifies) {base.meta.works = copy(s.meta.works); base.desks = s.desks.map(() => ({}));}
    } else fail();
    return qualifies ? {rule:1,source:base} : null;
  }
  function fundingValidate(s, mastery) {
    const m = s.meta.speedFundingAwards, claims = s.rewards?.claims || {}, credits = s.prem?.credits || {}, tokens = s.rewards?.storedGold?.tokens || {};
    const key = id => id.startsWith('lg02e-') || id.startsWith('award:lg02e-');
    const maps = [s.awards,claims,credits,tokens];
    const keys = maps.flatMap(x => Object.keys(x || {}).filter(key));
    const activation = s.rewards?.activeGold?.activationId;
    if (typeof activation === 'string' && key(activation)) fail();
    if (m === undefined && !keys.length) return;
    if (!fundingEnabled || !object(m) || m.version !== 1 || m.policy !== fundingPolicy || !Array.isArray(m.historicalIds) ||
        new Set(m.historicalIds).size !== m.historicalIds.length || m.historicalIds.some(id => !fundingRow(id)) || keys.some(id => !fundingRow(id.replace(/^award:/,'')))) fail();
    // A funding bit always retains its validating proof; no lost-proof reconstruction.
    for (const r of fundingRows) {
      const id = 'award:'+r.id, c = claims[id], bit = s.awards[r.id], d = credits[id];
      if (tokens[id] !== undefined || maps.some((x,i) => x?.[i === 0 ? id : r.id] !== undefined)) fail();
      if (bit === undefined && c === undefined && d === undefined) {if (m.historicalIds.includes(r.id)) fail(); continue;}
      if (bit !== true || !object(c) || !['prepared','committed'].includes(c.status) || !['new','historical'].includes(c.origin) ||
          m.historicalIds.includes(r.id) !== (c.origin === 'historical') || !object(c.proof) || c.proof.rule !== 1 || !object(c.proof.source) ||
          !fundingProof(r.id,c.proof.source,mastery) || !object(c.descriptor) || c.descriptor.version !== 1 || c.descriptor.kind !== 'D' || c.descriptor.amount !== 5 || c.descriptor.origin !== c.origin) fail();
      if (c.status === 'committed' ? d?.source !== 'earned' || d.amount !== 5 || d.origin !== c.origin : d !== undefined) fail();
    }
  }
  const funding = Object.freeze({enabled:fundingEnabled,policy:fundingPolicy,rows:fundingRows,row:fundingRow,
    source:id => id.startsWith('award:') ? fundingRow(id.slice(6)) : undefined,proof:fundingProof,validate:fundingValidate});
  function validate(s, manual, mastery) {
    fundingValidate(s, mastery);
    const m = s.meta.expandedAwards, claims = s.rewards?.claims || {}, tokens = s.rewards?.storedGold?.tokens || {}, credits = s.prem?.credits || {};
    const active = s.rewards?.activeGold?.activationId;
    if (typeof active === 'string' && active.startsWith('award:lg10-') && (!source(active) || !tokens[active])) fail();
    const present = m !== undefined || rows.some(r => s.awards[r.id] !== undefined || claims['award:'+r.id] !== undefined || tokens['award:'+r.id] !== undefined || credits['award:'+r.id] !== undefined);
    if ([s.awards,claims,tokens,credits].some(x => Object.keys(x || {}).some(id => (id.startsWith('lg10-') || id.startsWith('award:lg10-')) && !row(id.replace(/^award:/,''))))) fail();
    if (!present) return;
    if (!enabled || !object(m) || m.version !== 1 || m.policy !== policy || !Array.isArray(m.historicalIds) || new Set(m.historicalIds).size !== m.historicalIds.length || m.historicalIds.some(id => !row(id))) fail();
    for (const r of rows) {
      const id = 'award:'+r.id, c = claims[id], bit = s.awards[r.id], t = tokens[id], d = credits[id];
      if (bit === undefined && c === undefined && t === undefined && d === undefined) {if (m.historicalIds.includes(r.id)) fail(); continue;}
      if (bit !== true || !object(c) || !object(c.proof) || c.proof.rule !== 1 || !object(c.proof.source) || !proof(r.id,c.proof.source,manual)) fail();
      const historical = m.historicalIds.includes(r.id);
      if (historical !== (c.origin === 'historical') || !['prepared','committed','waived'].includes(c.status)) fail();
      if (c.status === 'waived' ? !historical || r.kind === 'D' || c.policy !== policy || c.descriptor !== undefined : !object(c.descriptor) || c.descriptor.kind !== r.kind) fail();
      if (r.kind === 'D' && c.status === 'committed' ? d?.source !== 'earned' || d.amount !== r.amount : d !== undefined) fail();
      if (r.kind === 'G' && c.status === 'committed' ? !object(t) || !['stored','consumed'].includes(t.status) || t.status === 'consumed' && t.activationId !== id : t !== undefined) fail();
    }
  }
  return Object.freeze({enabled,policy,rows,row,source,proof,validate,funding});
})();
