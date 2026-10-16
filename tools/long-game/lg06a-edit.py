from pathlib import Path

def edit(file, old, new):
 p=Path(file); b=p.read_bytes(); a=old.replace('\n','\r\n').encode(); z=new.replace('\n','\r\n').encode()
 if a not in b:
  a=old.encode(); z=new.encode()
 assert b.count(a)==1,(file,old[:80],b.count(a))
 p.write_bytes(b.replace(a,z))

edit('ops.js','  function plant(i, ch) {','''  const gardenPrototype = () => new URLSearchParams(location.search).get('lg03') === '1' && !!layers?.enabled;
  const cropFor = (ch, desk) => ({ ch, desk, ready:savedWallNow() + gardenTime(ch, desk) * 1000 });
  function grantCrop(state, i) {
    const b = state.garden.beds[i], d = state.desks[b.desk] || state.desks[state.sel], y = gardenYield(b.ch);
    d.letters[b.ch] = (d.letters[b.ch] || 0) + y; for (let k = 0; k < Math.min(y, 8); k++) d.tray.push(b.ch); if (d.tray.length > 80) d.tray.splice(0, d.tray.length - 80);
    state.stats.harvested = (state.stats.harvested || 0) + y; state.garden.beds[i] = null; return y;
  }
  function gardenRequest(action, indices, ch, desk, origin) {
    return {action, indices, ch, desk, origin, state:S, printing:S.printing, imprint:layers.identity(S),
      crops:indices.map(i => S.garden.beds[i])};
  }
  function commitGarden(p) {
    const helper = extensions.get('automation');
    const refuse = error => ({ok:false, retryable:false, error});
    if (!gardenPrototype() || !writer?.owns() || !extensionAPI.automationAllowed()) return refuse('Garden save owner unavailable');
    if (!helper?.validConfig(S.meta.automation) || !['manual','auto'].includes(p.origin) ||
        !['plant','harvest'].includes(p.action) || p.state !== S || p.printing !== S.printing || p.imprint !== layers.identity(S)) return refuse('Garden action changed');
    try { layers.current(S); } catch { return refuse('Unsupported Imprint save'); }
    if (p.origin === 'auto' && !helper.gardenReady()) return refuse('Auto-garden is paused or locked');
    if (!p.indices.length || new Set(p.indices).size !== p.indices.length || p.indices.some((i,n) =>
        !Number.isInteger(i) || i < 0 || i >= S.garden.beds.length || S.garden.beds[i] !== p.crops[n])) return refuse('Crop changed. Choose the action again.');
    if (p.action === 'plant' && (p.indices.length !== 1 || p.crops[0] || !FREQ[p.ch] || !Number.isInteger(p.desk) || !S.desks[p.desk]?.owned || !Number.isFinite(gardenTime(p.ch,p.desk)))) return refuse('Planting target unavailable');
    if (p.action === 'harvest' && p.crops.some(b => !b || !FREQ[b.ch] || !S.desks[b.desk]?.owned || !Number.isFinite(b.ready) || savedWallNow() < b.ready)) return refuse('Crop is absent, unripe or its desk is unavailable');
    const candidate = {...S, garden:{...S.garden, beds:S.garden.beds.slice()}, stats:{...S.stats},
      desks:S.desks.map(d => ({...d, letters:{...d.letters}, tray:d.tray.slice()})), meta:{...S.meta},
      lastSeen:S.rewards.awayCheckpoint ? S.lastSeen : Date.now()};
    let amount = 0;
    if (p.action === 'plant') {
      const crop = cropFor(p.ch,p.desk);
      if (p.origin === 'manual') crop.gardenToken = crypto.randomUUID();
      candidate.garden.beds[p.indices[0]] = crop;
    } else for (const i of p.indices) amount += grantCrop(candidate,i);
    helper.gardenEvidence(candidate,p);
    if (!writer.guard(candidate)) return refuse('Garden save guard refused the candidate');
    const result = layerChoiceResult('garden', Economy.saveStateAcknowledged(candidate));
    if (result.ok) {
      S.garden = candidate.garden; S.stats = candidate.stats; S.meta = candidate.meta; S.lastSeen = candidate.lastSeen;
      S.desks.forEach((d,i) => { d.letters = candidate.desks[i].letters; d.tray = candidate.desks[i].tray; });
      mark();
    }
    return {...result, amount:result.ok ? amount : 0};
  }
  function plant(i, ch, desk = S.sel, origin = 'manual') {
    if (gardenPrototype()) return extensions.get('automation')?.gardenAction(gardenRequest('plant',[i],ch,desk,origin));''')
edit('ops.js','    g.beds[i] = { ch, desk: S.sel, ready: savedWallNow() + gardenTime(ch, S.sel) * 1000 }; IMI.sfx.tick(); mark(); save();','    g.beds[i] = cropFor(ch, S.sel); IMI.sfx.tick(); mark(); save();')
edit('ops.js','''  function harvest(i) {
    const g = S.garden, b = g.beds[i]; if (writer?.localDisposition() || !b || savedWallNow() < b.ready) return 0;
    const d = S.desks[b.desk] || cur(), y = gardenYield(b.ch);
    d.letters[b.ch] = (d.letters[b.ch] || 0) + y; for (let k = 0; k < Math.min(y, 8); k++) d.tray.push(b.ch); if (d.tray.length > 80) d.tray.splice(0, d.tray.length - 80);
    S.stats.harvested = (S.stats.harvested || 0) + y; g.beds[i] = null; return y;
  }''','''  function harvest(i, origin = 'manual') {
    if (gardenPrototype()) return extensions.get('automation')?.gardenAction(gardenRequest('harvest',[i],null,null,origin)).amount || 0;
    const g = S.garden, b = g.beds[i]; if (writer?.localDisposition() || !b || savedWallNow() < b.ready) return 0;
    return grantCrop(S,i);
  }''')
edit('ops.js',"      let got = 0; S.garden.beds.forEach((b, i) => { got += harvest(i) || 0; });", """      let got = 0;
      if (gardenPrototype()) {
        const indices = S.garden.beds.flatMap((b,i) => b && savedWallNow() >= b.ready ? [i] : []);
        if (indices.length) got = extensions.get('automation')?.gardenAction(gardenRequest('harvest',indices,null,null,'manual')).amount || 0;
      } else S.garden.beds.forEach((b, i) => { got += harvest(i) || 0; });""")
edit('ops.js',"JSON.stringify(current?.tiers) !== JSON.stringify(next.tiers) || current?.net", "JSON.stringify(current?.tiers) !== JSON.stringify(next.tiers) || JSON.stringify(current?.garden?.manual) !== JSON.stringify(next.garden?.manual) || current?.net")
edit('ops.js',"      automationDesks: () => DESKS.map", """      gardenEnabled:gardenPrototype,
      clearGardenPending:state => extensions.get('automation')?.clearGardenPending(state),
      commitGarden,
      gardenAttempt(cfg) {
        const desk = DESKS.findIndex(d => d.id === cfg.desk), i = cfg.bed, b = S.garden.beds[i];
        if (!Number.isInteger(i) || i < 0 || i >= S.garden.beds.length || !S.desks[desk]?.owned) return {ok:false, error:'Configured bed or desk is unavailable'};
        if (!b) return plant(i,cfg.letter,desk,'auto');
        if (b.ch !== cfg.letter || b.desk !== desk || savedWallNow() < b.ready) return {ok:false, error:'Waiting for a matching ripe crop'};
        return extensions.get('automation').gardenAction(gardenRequest('harvest',[i],null,null,'auto'));
      },
      automationDesks: () => DESKS.map""")
edit('ops.js',"    S = f; pg?.clearManual(S);", "    S = f; pg?.clearManual(S);\n    if (gardenPrototype()) extensions.get('automation')?.clearGardenPending(S);")
edit('layers.js',"    if (next.meta.productionGoal) next.meta.productionGoal.manual = null;", "    if (next.meta.productionGoal) next.meta.productionGoal.manual = null;\n    window.IMI?.ops?.extensions?.clearGardenPending?.(next);")
edit('sw.js',"const VERSION = 'imi-v53';","const VERSION = 'imi-v54';")
