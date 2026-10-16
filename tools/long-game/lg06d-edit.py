from pathlib import Path

def edit(file, fn):
 p=Path(file); b=p.read_bytes(); nl='\r\n' if b'\r\n' in b else '\n'; s=fn(b.decode().replace('\r\n','\n')); p.write_bytes(s.replace('\n',nl).encode())
def rep(s,a,b):
 assert a in s,a[:100]
 return s.replace(a,b,1)
ops=r'''  // A9 seats have no payment: one detached Ops acknowledgement publishes the whole choice.
  let musePending = null;
  const museSame = (a,b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
  function clearMuseIncomplete(s) {
    const a = s.meta.automation, m = a?.muse;
    if (!gardenPrototype() || !extensions.get('automation')?.validMuse(m) || !m?.manual || m.manual.complete) return;
    s.meta = {...s.meta, automation:{...a, muse:{...m, manual:{...m.manual, ids:[], complete:false, imprint:layers.identity(s), printing:s.printing}}}};
  }
  function museContext() {
    const manual = pg?.active(pgContext) ? S.meta.productionGoal.manual : !S.autoFocus ? S.focus : null;
    const selected = manual && !S.written[manual] ? manual : null;
    const titles = RECIPES.filter(r => !S.written[r.id] && inPlay(r) &&
      Object.entries(r.need).every(([w,n]) => S.desks[bandOf(w.length)].owned && !(chal('haiku') && bandOf(w.length) > 1) && stock(w) >= n) &&
      (selected ? r.id === selected : !pg || pg.allowsSale(pgContext,r)));
    const quote = saleContext();
    quote.state = {meta:{layers:S.meta.layers === undefined ? undefined : JSON.parse(JSON.stringify(S.meta.layers))}};
    return {titles:titles.map(r => ({id:r.id,band:r.band,pay:r.pay})), quote, markets:S.market.v.map((_,b) => marketMult(b)),
      night:!!sky().night, productive:S.desks.some(d => d.owned && autoRate(d) > 0), slots:museSlots(),
      owned:MUSES.filter(m => S.muses.owned[m.id]).map(m => m.id), paused:!!folioGoal()};
  }
  function museScore(seats,c) {
    const on = id => seats.slice(0,c.slots).includes(id);
    let q = 0;
    for (const r of c.titles) q = Math.max(q,salePay(r,c.markets[r.band],on,c.quote));
    return [q,c.night && c.productive && on('poe') ? 1.25 : 1];
  }
  const museBetter = (a,b) => a[0] > b[0] || a[0] === b[0] && a[1] > b[1];
  function museSelection() {
    const c = museContext(), seats = S.muses.seated;
    let score = museScore(seats,c), best = null;
    if (c.paused) return null;
    for (let slot = 0; slot < c.slots; slot++) for (const id of c.owned) {
      if (seats.includes(id)) continue;
      const next = seats.slice(); next[slot] = id;
      const value = museScore(next,c);
      if (museBetter(value,score)) { score = value; best = {slot,id,score:value,context:JSON.stringify(c)}; }
    }
    return best;
  }
  function seatMuse(slot,id,origin = 'manual') {
    const p = {slot,id,origin,state:S,printing:S.printing,imprint:layers.identity(S),
      seats:S.muses.seated.slice(), config:JSON.stringify(S.meta.automation ?? null)};
    if (origin === 'auto') { const q = museSelection(); if (!q || q.slot !== slot || q.id !== id) return {ok:false,retryable:false,error:'No better seating choice'}; p.context = q.context; }
    return commitMuse(p);
  }
  function commitMuse(p) {
    const helper = extensions.get('automation');
    const refuse = error => { musePending = null; layerChoices.delete('muse'); mark(); return {ok:false,retryable:false,error}; };
    if (!p || !gardenPrototype() || !writer?.owns() || !extensionAPI.automationAllowed() || !helper.validConfig(S.meta.automation)) return refuse('Muse save owner unavailable');
    if (!['manual','auto'].includes(p.origin) || p.state !== S || p.printing !== S.printing || p.imprint !== layers.identity(S) ||
        p.config !== JSON.stringify(S.meta.automation ?? null) || !museSame(p.seats,S.muses.seated) ||
        !Number.isInteger(p.slot) || p.slot < 0 || p.slot >= museSlots() ||
        p.id !== null && (!MUSES.some(m => m.id === p.id) || !S.muses.owned[p.id]) || p.seats[p.slot] === p.id) return refuse('Seating changed. Choose again.');
    try { layers.current(S); } catch { return refuse('Unsupported Imprint save'); }
    if (p.origin === 'auto') {
      if (!helper.museReady(p)) return refuse('Muse director is paused or locked');
      const q = museSelection();
      if (!q || q.slot !== p.slot || q.id !== p.id || q.context !== p.context) return refuse('Sale or night choice changed. Wait for a new attempt.');
    } else if (!helper.museActive()) return refuse('Manual seating is paused');
    const seats = p.seats.slice(), old = p.id === null ? -1 : seats.indexOf(p.id);
    if (old >= 0) seats[old] = null;
    seats[p.slot] = p.id;
    if (new Set(seats.filter(Boolean)).size !== seats.filter(Boolean).length) return refuse('Duplicate Muse seats');
    if (p.origin === 'manual') helper.museSuspend();
    const candidate = {...S, muses:{...S.muses,seated:seats}, meta:{...S.meta}, lastSeen:S.rewards.awayCheckpoint ? S.lastSeen : Date.now()};
    helper.museEvidence(candidate,p,old < 0);
    if (!writer.guard(candidate)) return refuse('Muse save guard refused the choice');
    const result = layerChoiceResult('muse',Economy.saveStateAcknowledged(candidate));
    musePending = result.ok ? null : p;
    if (result.ok) { S.muses = candidate.muses; S.meta = candidate.meta; S.lastSeen = candidate.lastSeen; IMI.sfx[p.id === null ? 'tick' : 'ding'](); }
    helper.museResult(result); mark(); return result;
  }
'''
def opsedit(s):
 s=rep(s,"const museSale = band => (museOn('seuss') && band <= 1 ? 1.2 : 1) * (museOn('tolken') && band >= 3 ? 1.25 : 1);","const museSale = (band, on = museOn) => (on('seuss') && band <= 1 ? 1.2 : 1) * (on('tolken') && band >= 3 ? 1.25 : 1);")
 s=rep(s,'  /* every muse sits for a portrait:',ops+'  /* every muse sits for a portrait:')
 old="  const salePay = (r, m = marketMult(r.band)) => roundMoney(r.pay * (toolOn('contracts') ? 1.25 : 1) * awardMult() * m * (1 + .05 * (S.desks[r.band].mk || 0)) * museSale(r.band) * legacyMult() * editionMult() * (1 + (extensions.get('minigames')?.titleSaleBonus?.() || 0)) * (layers?.saleFactor(S, r.band, museOn) || 1));"
 new="""  const saleContext = () => ({contracts:toolOn('contracts') ? 1.25 : 1, awards:awardMult(), desks:S.desks.map(d => 1 + .05 * (d.mk || 0)),
    legacy:legacyMult(), edition:editionMult(), minigames:1 + (extensions.get('minigames')?.titleSaleBonus?.() || 0), state:S});
  const salePay = (r, m = marketMult(r.band), on = museOn, c = saleContext()) => roundMoney(r.pay * c.contracts * c.awards * m * c.desks[r.band] * museSale(r.band,on) * c.legacy * c.edition * c.minigames * (layers?.saleFactor(c.state, r.band, on) || 1));"""
 s=rep(s,old,new)
 s=rep(s,'    clearPitchPending(S); commissionPending = null;',"    clearMuseIncomplete(S); musePending = null; layerChoices.delete('muse');\n    clearPitchPending(S); commissionPending = null;")
 s=rep(s,'      gardenEnabled:gardenPrototype,',"""      museEnabled:gardenPrototype, seatMuse, commitMuse, museContext, museScore, museSelection, clearMuseIncomplete,
      museStatus:() => ({pending:!!musePending}),
      retryMuse:() => musePending ? commitMuse(musePending) : {ok:false,retryable:false,error:'No waiting seating choice'},
      reconcileMuse() {
        const m = S.meta.automation?.muse?.manual;
        if (!gardenPrototype() || !writer?.owns() || !extensionAPI.automationAllowed() || !extensions.get('automation').validConfig(S.meta.automation) ||
            !m || m.complete || m.imprint === layers.identity(S) && m.printing === S.printing) return;
        const candidate = {...S,meta:{...S.meta}}; clearMuseIncomplete(candidate);
        if (writer.guard(candidate) && Economy.saveStateAcknowledged(candidate).ok) { S.meta = candidate.meta; mark(); }
      },
      gardenEnabled:gardenPrototype,""")
 s=rep(s,"!pitchSame(current?.media?.pending,next.media?.pending) ||", "!pitchSame(current?.media?.pending,next.media?.pending) || !museSame(current?.muse?.manual,next.muse?.manual) ||")
 s=rep(s,"museseat: el => { const id = el.dataset.id, k = +el.dataset.slot;", "museseat: el => { const id = el.dataset.id, k = +el.dataset.slot; if (gardenPrototype()) return seatMuse(k,id);")
 s=rep(s,"museout: el => { S.muses.seated[+el.dataset.slot]", "museout: el => { if (gardenPrototype()) return seatMuse(+el.dataset.slot,null); S.muses.seated[+el.dataset.slot]")
 return s
edit('ops.js',opsedit)
auto=r'''  const museSetting = () => ({version:1,enabled:false,...saved()?.muse});
  let museElapsed = 0, museLast = null, museNotice = '';
  const resetMuseClock = () => { museElapsed = 0; museLast = null; };
  function validMuse(m) {
    const ids = m?.manual?.ids;
    return m === undefined || object(m) && m.version === 1 && (m.enabled === undefined || typeof m.enabled === 'boolean') &&
      (m.manual === undefined || object(m.manual) && (m.manual.complete === undefined || typeof m.manual.complete === 'boolean') &&
        (ids === undefined || Array.isArray(ids) && ids.length <= 2 && new Set(ids).size === ids.length && ids.every(id => ['seuss','poe','dick','hemi','christie','woolf','austen','tolken','twain'].includes(id))) &&
        (!m.manual.complete || ids?.length === 2) &&
        ['imprint','printing'].every(k => m.manual[k] === undefined ? !ids?.length || m.manual.complete : Number.isSafeInteger(m.manual[k]) && m.manual[k] >= 0));
  }
  function museUnlocked() {
    if (!api.museEnabled() || !supported(saved()) || !api.state().intro.done || !museSetting().manual?.complete) return false;
    try { return Layers.current(api.state()).count >= 5; } catch { return false; }
  }
  function museActive() {
    return api.museEnabled() && !document.hidden && IMI.screen() === 'game' && api.automationAllowed() &&
      !IMI.tour?.active() && !document.querySelector('.o-modal, .o-celebrate, .set-pop:not([hidden])');
  }
  function museReady(request = null) {
    return museUnlocked() && museSetting().enabled && !suspended.has('muse') && !pending &&
      (!api.museStatus().pending || !!request) && museActive();
  }
  function museSuspend() { suspended.add('muse'); resetMuseClock(); }
  function museEvidence(s,p,introduced) {
    const cfg = museSetting(), manual = {...cfg.manual};
    if (!manual.complete && (manual.imprint !== Layers.identity(s) || manual.printing !== s.printing)) manual.ids = [];
    if (!manual.complete) {
      manual.ids = [...(manual.ids || [])]; manual.imprint = Layers.identity(s); manual.printing = s.printing;
      if (p.origin === 'manual' && p.id && introduced && !manual.ids.includes(p.id)) manual.ids.push(p.id);
      manual.complete = manual.ids.length === 2;
    }
    s.meta.automation = {...s.meta.automation,version:1,muse:{...cfg,manual,...(p.origin === 'manual' ? {enabled:false} : {})}};
  }
  function museResult(result) { resetMuseClock(); museNotice = result.ok ? 'Seating saved.' : 'Seating not saved. Retry the waiting choice.'; }
  function editMuse() {
    if (!api.museEnabled() || !supported(saved())) return;
    const enabled = !!suspended.has('muse') || !museSetting().enabled;
    if (!enabled) museSuspend();
    if (pending || enabled && (!museUnlocked() || api.museStatus().pending)) return;
    const current = saved(), next = current === undefined ? {version:1} : JSON.parse(JSON.stringify(current));
    next.muse = {...museSetting(),enabled}; resetMuseClock();
    write({expected:current === undefined ? null : JSON.stringify(current),next,muse:true});
  }
  function museCard(safe) {
    if (!api.museEnabled()) return '';
    const cfg = safe ? museSetting() : {}, on = cfg.enabled && !suspended.has('muse'), waiting = api.museStatus().pending;
    const progress = cfg.manual?.complete ? 'Two manual Muses saved.' : `Seat two different owned Muses by hand: ${cfg.manual?.ids?.length || 0}/2.`;
    return `<section class="o-card lg06d-muse"><h3>Muse director</h3><p>Free. Imprint 5 + introduction. ${progress}</p><p>Every 60 active game seconds, improve one seat: best ready-title sale first, productive night typing second. No offline seating.</p><p>May replace royalty, keeper or division benefits.</p><button data-act="automation:muse-toggle" aria-pressed="${!!on}" ${!safe || !on && (pending || waiting || !museUnlocked()) ? 'disabled' : ''}>Muse director: ${on ? 'On' : 'Off'}</button><p role="status">${!safe ? 'Unsupported settings preserved. Actions disabled.' : waiting ? 'Seating not saved. Retry the waiting choice.' : suspended.has('muse') ? 'Off locally. Turn On to resume.' : museNotice || (on ? 'Waiting for the next 60-second attempt. Pauses for Folio.' : 'Off')}</p>${waiting ? '<button data-act="automation:muse-retry">Retry seating</button>' : ''}</section>`;
  }
'''
def autoedit(s):
 s=rep(s,'  function supported(m) {',auto+'  function supported(m) {')
 s=rep(s,'m.version === 1 && (!api.mediaEnabled()', 'm.version === 1 && (!api.museEnabled() || validMuse(m.muse)) && (!api.mediaEnabled()')
 s=rep(s,'function reset() { resetMediaClock();', "function reset() { resetMuseClock(); museNotice = ''; resetMediaClock();")
 s=rep(s,'if (p.media) resetMediaClock();', 'if (p.muse) resetMuseClock(); else if (p.media) resetMediaClock();')
 s=rep(s,"const mediaOff = suspended.has('media')", "const museOff = suspended.has('muse') && !p.muse;\n      const mediaOff = suspended.has('media')")
 s=rep(s,"if (mediaOff) suspended.add('media');", "if (museOff) suspended.add('muse');\n      if (mediaOff) suspended.add('media');")
 s=rep(s,'${mediaCard(safe)}', '${museCard(safe)}${mediaCard(safe)}')
 s=s.replace('resetGardenClock(); resetPitchClock(); resetMediaClock();','resetGardenClock(); resetPitchClock(); resetMediaClock(); resetMuseClock();')
 s=rep(s,'reset, mediaReady,', 'reset, validMuse, museReady, museActive, museSuspend, museEvidence, museResult, mediaReady,')
 s=rep(s,"actions:{ 'media-toggle'", "actions:{ 'muse-toggle':editMuse, 'muse-retry':() => { resetMuseClock(); const r = api.retryMuse(); if (!r.ok && r.retryable === false) { museNotice = r.error; api.mark(); } }, 'media-toggle'")
 s=rep(s,'      serviceNet({replay});', '''      serviceNet({replay});
      if (!replay && museActive() && !api.museStatus().pending) api.reconcileMuse();
      const museActiveNow = !replay && museReady(), museNow = api.clock.productionNow();
      if (!museActiveNow) resetMuseClock();
      else {
        if (museLast !== null && museNow - museLast > gameSeconds * 1000 + 250) resetMuseClock();
        museLast = museNow;
        if (Number.isFinite(gameSeconds) && gameSeconds > 0) museElapsed = Math.min(60,museElapsed + gameSeconds);
      }''')
 s=rep(s,'mediaActive && mediaElapsed + 1e-9 >= 60];','mediaActive && mediaElapsed + 1e-9 >= 60, museActiveNow && museElapsed + 1e-9 >= 60];')
 s=rep(s,'      if (service === 6) {', '''      if (service === 7) {
        museElapsed = 0; const q = api.museSelection();
        if (q) api.seatMuse(q.slot,q.id,'auto');
        else museNotice = 'Waiting for a better ready-title sale or useful night seat.';
      }
      if (service === 6) {''')
 return s
edit('automation.js',autoedit)
edit('layers.js',lambda s:rep(s,'    window.IMI?.ops?.extensions?.clearPitchPending?.(next);','    window.IMI?.ops?.extensions?.clearPitchPending?.(next);\n    window.IMI?.ops?.extensions?.clearMuseIncomplete?.(next);'))
edit('automation.css',lambda s:s+'''\n.lg06d-muse { font-size: 13px; line-height: 1.4; }
.lg06d-muse p { margin: .4rem 0; overflow-wrap: anywhere; }
.lg06d-muse button { min-height: 44px; max-width: 100%; }
html[data-style="classic"] .lg06d-muse { border-radius: 12px; }
''')
edit('sw.js',lambda s:rep(s,"'imi-v56'","'imi-v57'"))
