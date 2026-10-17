/* Development-only, earned active-play automation. */
(() => {
  'use strict';
  if (!(window.GameFeatures?.enabled('lg03') ?? new URLSearchParams(location.search).get('lg03') === '1')) return;
  let api, elapsed = 0, shopElapsed = 0, coachElapsed = 0, restoreElapsed = 0, restoreCursor = 0, turn = 0, cursor = 0, pending = null, notice = '';
  const items = [['hold', 'Hold to type'], ['contracts', 'Writing contracts'], ['metro', 'Paw metronome'], ['dbl', 'Double touch'], ['agent', 'Literary agent'], ['analyst', 'Market analyst']];
  const order = items.map(([id]) => id);
  const suspended = new Set();
  const object = v => v !== null && typeof v === 'object' && !Array.isArray(v);
  const saved = () => api.state().meta.automation;
  const unlocked = () => api.state().printing >= 1 && api.state().intro.done;
  const shopUnlocked = () => api.state().printing >= 2 && api.state().intro.done;
  const coachUnlocked = () => !!api.state().chDone.hands && api.state().intro.done;
  const restoreUnlocked = () => api.state().printing >= 4 && !!api.state().chDone.haiku && api.state().intro.done;
  const netUnlocked = () => api.state().printing >= 5 && !!api.state().chDone.timed && api.state().intro.done;
  const helpers = ['hire', 'coach', 'shop', 'restore', 'net', 'garden', 'pitch', 'media', 'muse'];     // these get speed levels; Auto-print and Auto-challenge are one action each
  const bases = [...helpers, 'print', 'challenge'];
  let admission = null;
  const validOwnership = o => o === undefined || object(o) && o.version === 1 && object(o.owned) && bases.every(id => o.owned[id] === undefined || typeof o.owned[id] === 'boolean');
  const owned = (id, source = api.state()) => validOwnership(source.meta.automation?.ownership) && source.meta.automation?.ownership?.owned?.[id] === true;
  function baseGate(id) {
    const gates = {hire:unlocked,coach:coachUnlocked,shop:shopUnlocked,restore:restoreUnlocked,net:netUnlocked,
      garden:gardenUnlocked,pitch:pitchUnlocked,media:mediaUnlocked,muse:museUnlocked,print:printUnlocked,challenge:() => AutoChallenge.earned(api.state())};
    return !!gates[id]?.();
  }
  function captureAdmission() {
    const m = saved();
    if (!supported(m) || m?.ownership !== undefined) { admission = null; return; }
    const retained = {};
    for (const id of bases) {
      const cfg = m?.[id];
      const configured = id === 'hire' ? Object.values(m?.desks || {}).some(d => object(d) && Object.keys(d).length) :
        object(cfg) && (cfg.enabled === true || !cfg.manual ? Object.keys(cfg).some(k => !['version','manual'].includes(k)) :
          id === 'garden' && (cfg.bed !== undefined && cfg.bed !== 0 || cfg.letter !== undefined && cfg.letter !== 'E' || cfg.desk !== undefined && cfg.desk !== 'mint') ||
          id === 'print' && cfg.N !== undefined || id === 'media' && cfg.sequence > 0);
      if (baseGate(id) || configured || m?.tiers?.[id] > 0 ||
          api.state().chDone[{garden:'handplanted',pitch:'onebrief',media:'paperonly',muse:'fixedcast'}[id]]) retained[id] = true;
    }
    admission = {version:1,owned:retained};
  }
  function admit() {
    if (!admission || pending || !api.automationAllowed()) return;
    const m = saved();
    if (printEdit || challengeEdit || m?.print?.pending || m?.challenge?.pending || m?.pitch?.sale || m?.media?.pending || gardenPending || api.museStatus().pending) return;
    write({admission,expected:m === undefined ? null : JSON.stringify(m)});
  }
  function buyBase(el) {
    const id = el.dataset.helper, q = api.quoteAutomationBase(id);
    if (pending || admission || !q.ok) return;
    write({base:id,expected:q.expected});
  }
  function settingsOwned(current, next) {
    if (JSON.stringify(current?.ownership) !== JSON.stringify(next.ownership)) return false;
    if (api.automationDesks().some(d => next.desks?.[d.id]?.enabled && !current?.desks?.[d.id]?.enabled && !owned('hire'))) return false;
    return bases.filter(id => id !== 'hire').every(id => !next[id]?.enabled || current?.[id]?.enabled || owned(id));
  }
  const level = id => saved()?.tiers?.[id] ?? 0;
  const interval = id => [20, 15, 10, 5][level(id)];
  const margin = () => [2, 1.75, 1.5, 1][level('restore')];
  const sequences = ['CSCSCCSCSC', 'CCCSCCSCSC', 'CCCCCCSCSC', 'CCCCCCCCCC'];
  const netSetting = () => ({ version:1, enabled:false, ordinary:0, golden:0, ...saved()?.net });
  const netItems = { ordinary:null, golden:null };
  let netLease = null;
  const cancelNet = (force = false) => {
    for (const kind of ['ordinary', 'golden']) {
      if (force === true || !netItems[kind]?.item.el.isConnected || !netLease && !netItems[kind]?.resuming) netItems[kind] = null;
    }
  };
  const restoreSetting = () => ({ enabled:false, ...saved()?.restore });
  const coachSetting = () => ({ enabled:false, ...saved()?.coach });
  const shopSetting = () => ({ enabled:false, priority:order, ...saved()?.shop });
  const setting = id => ({ enabled:false, reservePercent:25, ...saved()?.desks?.[id] });
  const earnedInterval = id => [60, 45, 30, 15][Math.max(level(id), api.state().chDone[{garden:'handplanted',pitch:'onebrief',media:'paperonly',muse:'fixedcast'}[id]] ? 1 : 0)];
  const gardenSetting = () => ({version:1, enabled:false, bed:0, letter:'E', desk:'mint', ...saved()?.garden});
  let gardenElapsed = 0, gardenLast = null, gardenPending = null, gardenNotice = '';
  const resetGardenClock = () => { gardenElapsed = 0; gardenLast = null; };
  function validGarden(g, owner = api) {
    return g === undefined || object(g) && g.version === 1 &&
      (g.enabled === undefined || typeof g.enabled === 'boolean') &&
      (g.bed === undefined || Number.isSafeInteger(g.bed) && g.bed >= 0) &&
      (g.letter === undefined || typeof g.letter === 'string' && /^[A-Z]$/.test(g.letter)) &&
      (g.desk === undefined || owner.automationDesks().some(d => d.id === g.desk)) &&
      (g.manual === undefined || object(g.manual) && (g.manual.complete === undefined || typeof g.manual.complete === 'boolean') &&
        (g.manual.pending == null || object(g.manual.pending) && Layers.epochValid(g.manual.pending) && typeof g.manual.pending.token === 'string' && g.manual.pending.token.length > 0 &&
          ['imprint','printing','bed','desk'].every(k => Number.isSafeInteger(g.manual.pending[k]) && g.manual.pending[k] >= 0) &&
          typeof g.manual.pending.letter === 'string' && /^[A-Z]$/.test(g.manual.pending.letter) &&
          owner.automationDesks().some(d => d.index === g.manual.pending.desk)));
  }
  function pendingCrop(s) {
    const p = s.meta.automation?.garden?.manual?.pending, b = p && s.garden.beds[p.bed];
    return !!p && Layers.epochMatches(s,p) && p.imprint === Layers.identity(s) && p.printing === s.printing && b?.gardenToken === p.token && b.ch === p.letter && b.desk === p.desk;
  }
  function clearGardenPending(s) {
    const m = s.meta.automation;
    if (!api?.gardenEnabled() || !supported(m) || !m?.garden?.manual?.pending) return;
    s.meta = {...s.meta, automation:{...m, garden:{...m.garden, manual:{...m.garden.manual, pending:null}}}};
  }
  function gardenEvidence(s,p) {
    const m = s.meta.automation, cfg = {...gardenSetting()}, manual = {...cfg.manual};
    if (!pendingCrop(s)) manual.pending = null;
    if (!manual.complete && p.origin === 'manual') {
      if (p.action === 'plant') {
        const bed = p.indices[0], b = s.garden.beds[bed];
        manual.pending = {...Layers.epochFields(s), token:b.gardenToken, imprint:Layers.identity(s), printing:s.printing, bed, letter:b.ch, desk:b.desk};
      } else {
        const old = api.state(), record = old.meta.automation?.garden?.manual?.pending;
        if (pendingCrop(old) && p.indices.includes(record.bed)) { manual.complete = true; manual.pending = null; }
      }
    }
    if (manual.complete) manual.pending = null;
    s.meta.automation = {...m, version:1, garden:{...cfg, manual}};
  }
  function gardenUnlocked() {
    if (!api.gardenEnabled() || !supported(saved()) || !api.state().intro.done || !gardenSetting().manual?.complete) return false;
    try { return Layers.current(api.state()).count >= 1; } catch { return false; }
  }
  function gardenReady(request = null) {
    return api.state().challenge?.id !== 'handplanted' && owned('garden') && gardenUnlocked() && gardenSetting().enabled && (!request || request.config === JSON.stringify(saved().garden)) && (!gardenPending || gardenPending === request) && !pending && !suspended.has('garden') &&
      !document.hidden && IMI.screen() === 'game' && api.automationAllowed();
  }
  function gardenAction(p) {
    if (gardenPending && gardenPending !== p) return {ok:false, amount:0, error:'Retry the waiting garden action first'};
    const result = api.commitGarden(p);
    if (!result.ok && result.retryable !== false) { gardenPending = p; gardenNotice = 'Garden save failed. Auto-garden paused. Retry this action.'; resetGardenClock(); }
    else { gardenPending = null; gardenNotice = result.ok ? (p.action === 'plant' ? 'Planted. Harvest waits for a later attempt.' : `Harvested ${result.amount} letters.`) : result.error; }
    api.mark(); return result;
  }
  function editGarden(field,value) {
    if (!api.gardenEnabled() || !supported(saved())) return;
    // Off is immediate, even while an action or preference is waiting for storage.
    if (field === 'enabled' && !value) { suspended.add('garden'); resetGardenClock(); }
    if (pending) return;
    const current = saved(), next = current === undefined ? {version:1} : JSON.parse(JSON.stringify(current));
    next.garden = {...gardenSetting(), [field]:value};
    if (!supported(next) || value === true && !gardenUnlocked()) return;
    resetGardenClock(); write({expected:current === undefined ? null : JSON.stringify(current), next, garden:true});
  }
  function gardenCard(safe) {
    if (!api.gardenEnabled()) return '';
    const cfg = safe ? gardenSetting() : {}, disabled = !safe || !!pending, on = cfg.enabled && !suspended.has('garden');
    const proof = cfg.manual?.complete ? '' : pendingCrop(api.state()) ? 'Harvest the crop you planted' : 'Plant and harvest once';
    const fields = `<div class="o-auto-fields">${field('Bed', `<select data-lg06a="bed" ${disabled ? 'disabled' : ''}>${api.state().garden.beds.map((_,i) => `<option value="${i}" ${cfg.bed === i ? 'selected' : ''}>${i+1}</option>`).join('')}</select>`)}${field('Letter', `<select data-lg06a="letter" ${disabled ? 'disabled' : ''}>${Array.from({length:26},(_,i) => String.fromCharCode(65+i)).map(ch => `<option ${cfg.letter === ch ? 'selected' : ''}>${ch}</option>`).join('')}</select>`)}${field('Desk', `<select data-lg06a="desk" ${disabled ? 'disabled' : ''}>${api.automationDesks().filter(d => d.owned).map(d => `<option value="${d.id}" ${cfg.desk === d.id ? 'selected' : ''}>${d.name}</option>`).join('')}</select>`)}</div>`;
    const status = api.state().challenge?.id === 'handplanted' ? 'Paused by the challenge' : !safe ? 'Unsupported data' : suspended.has('garden') ? 'Off here · retry the save' : aText(gardenNotice);
    return autoCard('garden', {cls:'lg06a-garden', on, act:'automation:garden-toggle', disabled:!safe || !on && (pending || !gardenUnlocked()), bar:[gardenElapsed, earnedInterval('garden')], proof, body:fields, status, extra:gardenPending ? retryBtn('automation:garden-retry', 'Retry') : ''});
  }
  /* every automation card shares one layout: its own picture, a switch, a speed readout, a timer bar to the next action and a one-line status */
  const AUTO_ICO = {hire:'a-hire',coach:'a-coach',shop:'a-shop',restore:'a-restore',net:'a-net',garden:'a-garden',pitch:'a-pitch',media:'a-media',muse:'a-muse',print:'a-print',challenge:'a-challenge'};
  const AUTO_COL = {hire:'#f2b23a',coach:'#ff8a5c',shop:'#ffd23a',restore:'#9fb4c8',net:'#5fc8ff',garden:'#74c648',pitch:'#ff9a3a',media:'#ff5d73',muse:'#c9a0ff',print:'#e8e0c8',challenge:'#ffffff'};
  const autoPips = (n, max) => `<span class="o-pips">${Array.from({length:max},(_, k) => `<i class="${k < n ? 'on' : ''}"></i>`).join('')}</span>`;
  const speedText = (hid, n) => hid === 'net' ? `${[60,70,80,100][Math.min(3,n)]}%` : hid === 'restore' ? `${[2,1.75,1.5,1][Math.min(3,n)]}× buffer` : ['garden','pitch','media','muse'].includes(hid) ? `${[60,45,30,15][Math.min(3,Math.max(n,api.state().chDone[{garden:'handplanted',pitch:'onebrief',media:'paperonly',muse:'fixedcast'}[hid]] ? 1 : 0))]}s` : `${[20,15,10,5][Math.min(3,n)]}s`;
  const aText = v => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function autoCard(id, o) {
    const tiered = helpers.includes(id), n = level(id), on = !!o.on;
    const sw = `<button type="button" class="o-switch" data-act="${o.act}" ${o.attrs || ''} aria-label="${o.label || names[id]}" aria-pressed="${on}" ${o.disabled ? 'disabled' : ''}><i></i><em>${on ? 'On' : 'Off'}</em></button>`;
    const bar = o.bar ? `<span class="o-prog o-auto-bar${on ? '' : ' idle'}" role="img" aria-label="Time to the next action"><i style="width:${on ? Math.max(0, Math.min(100, Math.round(100 * o.bar[0] / o.bar[1]))) : 0}%"></i></span>` : '';
    const speed = tiered ? `<p class="o-auto-speed">${autoPips(n,3)}<b>${speedText(id, n)}</b></p>` : '';
    return `<section class="o-card o-auto ${o.cls}${on ? ' on' : ''}" style="--c:${AUTO_COL[id]}"><div class="o-row"><h3>${api.shop.cart(AUTO_ICO[id])}${o.title || names[id]}</h3>${sw}</div>${speed}${bar}${o.proof ? `<p class="o-auto-proof"><span aria-hidden="true">✋</span> ${o.proof}</p>` : ''}${o.body || ''}${o.status ? `<p class="o-auto-status" role="status">${o.status}</p>` : ''}${o.extra || ''}</section>`;
  }
  const retryBtn = (act, label) => `<button type="button" class="o-btn sm o-auto-retry" data-act="${act}">${label}</button>`;
  const field = (label, control) => `<label class="o-auto-field"><span>${label}</span>${control}</label>`;
  const pitchSetting = () => ({version:1,enabled:false,...saved()?.pitch});
  let pitchElapsed = 0, pitchLast = null, pitchNotice = '';
  const resetPitchClock = () => { pitchElapsed = 0; pitchLast = null; };
  function pitchUnlocked() {
    if (!api.pitchEnabled() || !supported(saved()) || !api.state().intro.done || !pitchSetting().manual?.complete) return false;
    try { return Layers.current(api.state()).count >= 2; } catch { return false; }
  }
  function pitchReady(retry = false) {
    return api.challengeCommissionAllowed() && owned('pitch') && pitchUnlocked() && pitchSetting().enabled && !pending && !suspended.has('pitch') && (!api.pitchStatus().pending || retry) &&
      !document.hidden && IMI.screen() === 'game' && api.automationAllowed() && !IMI.tour?.active() &&
      !document.querySelector('.o-modal, .o-celebrate, .set-pop:not([hidden])');
  }
  function editPitch() {
    if (!api.pitchEnabled() || !supported(saved())) return;
    const enabled = !pitchSetting().enabled || suspended.has('pitch');
    if (!enabled) { suspended.add('pitch'); resetPitchClock(); }
    if (pending || enabled && !pitchUnlocked()) return;
    const current = saved(), next = current === undefined ? {version:1} : JSON.parse(JSON.stringify(current));
    next.pitch = {...pitchSetting(),enabled}; resetPitchClock();
    write({expected:current === undefined ? null : JSON.stringify(current),next,pitch:true});
  }
  function pitchCard(safe) {
    if (!api.pitchEnabled()) return '';
    const cfg = safe ? pitchSetting() : {}, on = cfg.enabled && !suspended.has('pitch'), st = api.pitchStatus();
    const proof = cfg.manual?.complete ? '' : api.trackedPitch() ? 'Sell the pitch you commissioned' : 'Commission and sell one pitch';
    const status = !api.challengeCommissionAllowed() ? 'Paused by the challenge' : !safe ? 'Unsupported data' : suspended.has('pitch') ? 'Off here · retry the save' : aText(st.pending ? st.notice : pitchNotice || st.notice || '');
    return autoCard('pitch', {cls:'lg06b-pitch', on, act:'automation:pitch-toggle', disabled:!safe || !on && (pending || !pitchUnlocked()), bar:[pitchElapsed, earnedInterval('pitch')], proof, status, extra:st.pending ? retryBtn('automation:pitch-retry', 'Retry') : ''});
  }
  const mediaSetting = () => ({version:1,enabled:false,manual:{complete:false},sequence:0,pending:null,...saved()?.media});
  let mediaElapsed = 0, mediaLast = null, mediaNotice = '';
  const resetMediaClock = () => { mediaElapsed = 0; mediaLast = null; };
  function mediaUnlocked() {
    if (!api.mediaEnabled() || !supported(saved()) || !api.state().intro.done || !mediaSetting().manual?.complete) return false;
    try { return Layers.current(api.state()).count >= 3; } catch { return false; }
  }
  function mediaReady() {
    return api.state().challenge?.id !== 'paperonly' && owned('media') && mediaUnlocked() && mediaSetting().enabled && !mediaSetting().pending && !pending && !suspended.has('media') &&
      !document.hidden && IMI.screen() === 'game' && api.automationAllowed() && !IMI.tour?.active() &&
      !document.querySelector('.o-modal, .o-celebrate, .set-pop:not([hidden])');
  }
  function editMedia() {
    if (!api.mediaEnabled() || !supported(saved())) return;
    const enabled = !mediaSetting().enabled || suspended.has('media');
    if (!enabled) { suspended.add('media'); resetMediaClock(); }
    if (pending || enabled && !mediaUnlocked()) return;
    const current = saved(), next = current === undefined ? {version:1} : JSON.parse(JSON.stringify(current));
    next.media = {...mediaSetting(),enabled}; resetMediaClock();
    write({expected:current === undefined ? null : JSON.stringify(current),next,media:true});
  }
  function mediaCard(safe) {
    if (!api.mediaEnabled()) return '';
    const cfg = safe ? mediaSetting() : {}, on = cfg.enabled && !suspended.has('media'), q = safe ? api.mediaNext() : null;
    const proof = cfg.manual?.complete ? '' : 'Release one by hand';
    const body = q ? `<p class="o-auto-next"><b>${aText(q.name)}</b>${api.shop.price(q.cost)}</p>` : '';
    const status = api.state().challenge?.id === 'paperonly' ? 'Paused by the challenge' : !safe ? 'Unsupported data' : suspended.has('media') ? 'Off here · retry the save' : cfg.pending ? 'Release waiting to finish' : aText(mediaNotice || (q ? '' : 'Nothing affordable yet'));
    return autoCard('media', {cls:'lg06c-media', on, act:'automation:media-toggle', disabled:!safe || !on && (pending || !mediaUnlocked()), bar:[mediaElapsed, earnedInterval('media')], proof, body, status, extra:cfg.pending ? retryBtn('automation:media-retry', 'Retry') : ''});
  }
  const museSetting = () => ({version:1,enabled:false,...saved()?.muse});
  let museElapsed = 0, museLast = null, museNotice = '';
  const resetMuseClock = () => { museElapsed = 0; museLast = null; };
  function validMuse(m) {
    const ids = m?.manual?.ids;
    return m === undefined || object(m) && m.version === 1 && (m.enabled === undefined || typeof m.enabled === 'boolean') &&
      (m.manual === undefined || object(m.manual) && Layers.epochValid(m.manual) && (m.manual.complete === undefined || typeof m.manual.complete === 'boolean') &&
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
    return !api.challengeSeatsLocked() && owned('muse') && museUnlocked() && museSetting().enabled && !suspended.has('muse') && !pending &&
      (!api.museStatus().pending || !!request) && museActive();
  }
  function museSuspend() { suspended.add('muse'); resetMuseClock(); }
  function museEvidence(s,p,introduced) {
    const cfg = museSetting(), manual = {...cfg.manual};
    if (!manual.complete && (!Layers.epochMatches(s,manual) || manual.imprint !== Layers.identity(s) || manual.printing !== s.printing)) manual.ids = [];
    if (!manual.complete) {
      Object.assign(manual,Layers.epochFields(s)); manual.ids = [...(manual.ids || [])]; manual.imprint = Layers.identity(s); manual.printing = s.printing;
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
    const proof = cfg.manual?.complete ? '' : `Seat two Muses by hand ${cfg.manual?.ids?.length || 0}/2`;
    const status = api.challengeSeatsLocked() ? 'Paused by the challenge' : !safe ? 'Unsupported data' : waiting ? 'Seating not saved' : suspended.has('muse') ? 'Off here · turn on to resume' : aText(museNotice);
    return autoCard('muse', {cls:'lg06d-muse', on, act:'automation:muse-toggle', label:'Muse director', disabled:!safe || !on && (pending || waiting || !museUnlocked()), bar:[museElapsed, earnedInterval('muse')], proof, status, extra:waiting ? retryBtn('automation:muse-retry', 'Retry') : ''});
  }
  function validPrint(p) {
    return p === undefined || object(p) && p.version === 1 &&
      (p.enabled === undefined || typeof p.enabled === 'boolean') &&
      (p.N === undefined || Number.isSafeInteger(p.N) && p.N >= 5 && p.N <= 240) &&
      (p.disclosed === undefined || typeof p.disclosed === 'boolean') &&
      (p.manual === undefined || object(p.manual) && (p.manual.complete === undefined || typeof p.manual.complete === 'boolean')) &&
      (p.pending == null || object(p.pending) && p.pending.version === 1 && ['manual','auto'].includes(p.pending.origin));
  }
  const printSetting = () => ({version:1,enabled:false,N:30,...saved()?.print});
  let printElapsed = 0, printNotice = '', printOff = false, printEdit = null, printAttempt = false;
  let sampleLast = null, sampleSpeed = null, sampleActive = false, sampleSeconds = 0, sampleTime = 0, sampleFraction = 0, sampleIndex = 0, samplePaid = 0, sampleGeneration = 0;
  const sampleBuckets = Array(300).fill(0);
  function resetSample() {
    sampleLast = null; sampleActive = false; sampleSeconds = sampleTime = sampleFraction = sampleIndex = samplePaid = 0;
    sampleBuckets.fill(0); sampleGeneration++; api?.mark();
  }
  function printChoice() { printElapsed = 0; printAttempt = false; }
  function sampleUpdate(committed = false) {
    if (!api?.printingEnabled()) return false;
    const now = api.clock.monotonicNow(), speed = api.printSampleSpeed(), active = api.printSampleAllowed(committed);
    if (speed !== sampleSpeed) { resetSample(); sampleSpeed = speed; }
    if (!active) { if (sampleActive) { sampleGeneration++; api.mark(); } sampleLast = null; sampleActive = false; return false; }
    if (!sampleActive) {
      if (committed) return false;
      // Settle the old Archive prefix before admitting any new sample time.
      sampleGeneration++; sampleActive = true; sampleLast = now;
      if (!api.printSampleStart()) { resetSample(); return false; }
      // Settling an unattributable Archive prefix may have discarded the old window.
      if (!sampleActive) { sampleGeneration++; sampleActive = true; sampleLast = now; }
      return true;
    }
    const seconds = sampleLast === null ? 0 : (now - sampleLast) / 1000;
    sampleLast = now;
    if (!Number.isFinite(seconds) || seconds < 0 || seconds > 1) { resetSample(); return false; }
    sampleFraction += seconds;
    sampleTime = Math.min(300,sampleTime + seconds);
    const secondsBefore = sampleSeconds; sampleSeconds = Math.floor(sampleTime + 1e-9);
    if (sampleSeconds !== secondsBefore) api.mark();
    // A posting at the second boundary completes the previous bucket.
    const whole = Math.max(0,Math.ceil(sampleFraction - 1e-9) - 1);
    sampleFraction = Math.max(0,sampleFraction - whole);
    for (let i = 0; i < whole; i++) {
      sampleIndex = (sampleIndex + 1) % 300;
      samplePaid -= sampleBuckets[sampleIndex]; sampleBuckets[sampleIndex] = 0;
    }
    return true;
  }
  function printPosting(amount, generation) {
    if (!sampleUpdate(true) || generation !== sampleGeneration || !Number.isSafeInteger(amount) || amount <= 0 || !Number.isSafeInteger(samplePaid + amount)) return;
    sampleBuckets[sampleIndex] += amount; samplePaid += amount;
  }
  let challengeWasReserved = false, challengeOff = false, challengeEdit = null, challengeElapsed = 0, challengeAttempt = false, challengeNotice = '';
  const challengeSetting = () => saved()?.challenge;
  const challengeOn = () => !!(api?.challengeEnabled() && (owned('challenge') || challengeSetting()?.active) && challengeSetting()?.enabled && !challengeOff && !challengeEdit);
  const challengeReserved = () => !!(api?.challengeEnabled() && (challengeSetting()?.active || challengeSetting()?.pending || challengeOn() && challengeSetting()?.selected?.length && !api.challengeFacts().nextChallenge));
  const challengeControl = () => challengeReserved() && !!challengeSetting()?.active;
  function challengeLocalOff() { challengeOff = true; challengeElapsed = 0; cancelNet(); printChoice(); }
  function challengeSave(fields) {
    if (pending) { challengeNotice = 'Retry the waiting helper save first.'; api.mark(); return; }
    challengeElapsed = 0; challengeEdit = fields.enabled === false ? {enabled:false} : {...challengeEdit,...fields};
    const r = Rewards.challengeAction({action:'settings',fields:challengeEdit,expected:JSON.stringify(challengeSetting() ?? null)});
    if (r.ok) {challengeOff = !challengeEdit.enabled; challengeEdit = null; challengeNotice = '';}
    else challengeNotice = 'Settings waiting. Retry to save Off; reload follows the last saved setting. ' + r.error;
    api.mark();
  }
  const challengeSaveOff = () => challengeSave({enabled:false});
  function challengeReady() {
    if (!challengeOn() || !challengeSetting()?.selected?.length || pending || api.challengeFacts().nextChallenge) return false;
    try {api.challengeReady(); return true;} catch {return false;}
  }
  const challengeAuthorize = () => challengeAttempt && challengeReady();
  function challengeTurn() {
    challengeElapsed = 0; challengeAttempt = true;
    try {
      if (!challengeAuthorize()) return;
      const s = api.state(), run = challengeSetting()?.active;
      let r;
      if (!run) {const quote = api.printingReview('auto-challenge'); r = Rewards.printingAction({origin:'auto-challenge',quote});}
      else if (run.phase === 'completed-awaiting-exit') r = Rewards.challengeAction({action:'exit'});
      else {
        const facts = api.challengeFacts();
        if (facts.available.length || !AutoChallenge.compatible(s)) {challengeLocalOff(); challengeSaveOff(); challengeNotice = facts.available.length ? 'Unavailable in Archive: ' + facts.available.join(', ') : 'PG changed. Continue manually or resolve the conflict.'; return;}
        if (!run.target) r = Rewards.challengeAction({action:'focus'});
        else if (facts.ready) r = Rewards.challengeAction({action:'sale'});
        else challengeNotice = 'Waiting for real letters and keeper words: ' + run.target;
      }
      if (r) challengeNotice = r.ok ? 'Command saved.' : r.error;
    } catch(error) {challengeNotice = error.message;}
    finally {challengeAttempt = false; api.mark();}
  }
  function challengeToggle() {
    if (challengeOn() || challengeEdit?.enabled) {challengeLocalOff(); challengeSaveOff(); return;}
    const s = api.state();
    if ((!owned('challenge') && !challengeSetting()?.active) || !AutoChallenge.earned(s) || challengeEdit || pending || admission) return;
    const enable = () => challengeSave({enabled:true,disclosed:true,selected:['smallcrew'],gold:JSON.parse(JSON.stringify(s.meta.challengeMastery.highest))});
    const el = document.createElement('div'); el.className = 'o-modal'; el.setAttribute('role','dialog'); el.setAttribute('aria-modal','true'); el.setAttribute('aria-labelledby','lg08l-title');
    el.innerHTML = `<div class="o-modal-card o-vault-gate"><h3 id="lg08l-title">${challengeSetting()?.active ? 'Resume exit only?' : 'Enable one Small Crew run?'}</h3><div class="o-vault-gate-content" tabindex="0" role="region" aria-label="One-run reset and Off limits"><p>One ordinary Printing pays your actual pending stars, then resets bananas, machines, typists, word bank, run tools, deals, divisions, Muses and garden. Ordinary history and permanent benefits remain. Requires Estate 3, saved manual Gold, already purchased Veteran Crew and at least one pending Printing star.</p><p>The clerk focuses and sells only the six Bamboo readers, including before Publisher. Real typists and free keepers supply every word. No purchases or grants. Each entry, focus, sale and exit waits 60 eligible game seconds. A1-A9 and Banana net pause during control; A10 is reserved with On/N preserved. Compatible PG remains authoritative; conflicting goals or archived readers wait for your choice.</p><p>Six sales clear ordinary Small Crew with no medal, repeat reward, DB or star payout. The following exit saves Off. Another run needs a new explicit enable. Manual changes hand over with Off. Off prevents new actions and preserves the challenge; already durable commands finish once. Failed Off saves need Retry. Reload follows durable settings. Completed Off can resume only its exit.</p></div><div class="o-row"><button class="o-btn" data-cancel>Keep Off</button><button class="o-btn gold" data-enable>Enable one run</button></div></div>`;
    el.querySelector('[data-cancel]').onclick = () => el.remove();
    el.querySelector('[data-enable]').onclick = () => {el.remove(); enable();};
    el.onkeydown = e => {if (e.key === 'Escape') el.remove(); if (e.key === 'Tab') {const f = [...el.querySelectorAll('[tabindex],button')]; if (e.shiftKey && document.activeElement === f[0]) {e.preventDefault(); f.at(-1).focus();} else if (!e.shiftKey && document.activeElement === f.at(-1)) {e.preventDefault(); f[0].focus();}}};
    document.body.append(el); el.querySelector('[data-cancel]').focus();
  }
  function challengeCard() {
    if (!api.challengeEnabled()) return '';
    const c = challengeSetting(), r = c?.active, esc = x => String(x).replace(/[&<>"]/g,k => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[k]));
    const on = challengeOn(), requestedOn = challengeEdit?.enabled, sold = r?.sold.length ?? c?.last?.sold.length ?? 0;
    const reason = challengeNotice || (!AutoChallenge.valid(c) ? 'Unsupported data' : !AutoChallenge.earned(api.state()) ? 'Locked' : !AutoChallenge.compatible(api.state()) ? 'Production set conflict' : api.challengeFacts().nextChallenge ? 'Your next-challenge pick wins' : !on ? '' : !challengeReady() ? 'Paused while busy' : '');
    const body = `<p class="o-auto-speed"><span class="o-pips">${Array.from({length:6},(_, k) => `<i class="${k < sold ? 'on' : ''}"></i>`).join('')}</span><b>${sold}/6</b>${r?.phase === 'completed-awaiting-exit' ? ' <span class="o-lvl">EXIT</span>' : ''}</p>`;
    const extra = (challengeEdit ? retryBtn('automation:challenge-retry', 'Retry') : '') + (r && r.phase !== 'completed-awaiting-exit' ? `<div class="o-auto-fields"><button type="button" class="o-btn sm" data-act="automation:challenge-continue">Take over</button><button type="button" class="o-btn sm" data-act="automation:challenge-abandon">Abandon</button></div>` : '');
    return autoCard('challenge', {cls:'lg08l-challenge', on, act:'automation:challenge-toggle', title:'Auto-challenge', disabled:!on && !requestedOn && (!AutoChallenge.earned(api.state()) || c?.active && c.active.phase !== 'completed-awaiting-exit' || challengeEdit), body, status:esc(reason), extra});
  }

  function printUnlocked(source = api.state(), owner = api) {
    return owner.printingEnabled() && supported(source.meta.automation,owner) && source.intro.done && source.meta.estate?.count >= 1 && source.meta.automation?.print?.manual?.complete === true;
  }
  function printRule(earned, paid, seconds, N) {
    if (!Number.isSafeInteger(earned) || earned < 0 || !Number.isSafeInteger(paid) || paid < 0 || !Number.isSafeInteger(N) || N < 5 || N > 240) return null;
    const gain = Math.floor(Math.sqrt(earned / 12500000)), target = (gain + 1) ** 2 * 12500000, gap = target - earned;
    if (!Number.isSafeInteger(target) || gap <= 0) return null;
    const rate = seconds === 300 && paid > 0 ? paid / 300 : null, estimate = rate ? gap / (60 * rate) : null;
    return {gain,gap,rate,estimate,eligible:gain >= 1 && estimate !== null && Number.isFinite(estimate) && estimate > N};
  }
  function printDecision() {
    const cfg = printSetting(), earned = api.state().run.earned, r = printRule(earned,samplePaid,sampleSeconds,cfg.N);
    return r?.eligible ? {version:1,seconds:300,paid:samplePaid,N:cfg.N,earned,gain:r.gain,gap:r.gap,estimate:r.estimate,config:JSON.stringify(saved().print)} : null;
  }
  function validPrintDecision(d, source, quote, owner = api) {
    const cfg = source.meta.automation?.print, r = d && printRule(d.earned,d.paid,d.seconds,d.N);
    return !!(owned('print',source) && printUnlocked(source,owner) && cfg.enabled === true && cfg.disclosed === true && d?.version === 1 && d.seconds === 300 &&
      d.N === (cfg.N ?? 30) && d.config === JSON.stringify(cfg) && d.earned === quote.earned && d.gain === quote.gain &&
      r?.eligible && d.gain === r.gain && d.gap === r.gap && d.estimate === r.estimate);
  }
  function printReady() {
    if (challengeReserved() || !owned('print') || !printUnlocked() || !printSetting().enabled || printSetting().disclosed !== true || printOff || printEdit || pending) return false;
    try { api.printingReady(); return true; } catch { return false; }
  }
  function printAuthorize() { sampleUpdate(); return printAttempt && printReady() && !!printDecision(); }
  function savePrint(fields) {
    if (!api.printingEnabled() || !supported(saved()) || pending) return;
    printChoice();
    printEdit = {...(printEdit || {}),...fields};
    const current = saved(), next = JSON.parse(JSON.stringify(current ?? {version:1}));
    next.print = {...printSetting(),...printEdit};
    const r = api.commitAutomation(current === undefined ? null : JSON.stringify(current),next);
    if (r.ok) { printOff = !next.print.enabled; printEdit = null; printNotice = ''; }
    else printNotice = 'Settings waiting to save. Retry to save the requested change.';
    api.mark();
  }
  function turnPrintOff() {
    if (!api.printingEnabled() || !supported(saved()) || !printSetting().enabled && !printEdit?.enabled) return;
    printOff = true; savePrint({enabled:false});
  }
  function togglePrint() {
    printChoice();
    if (printSetting().enabled && !printOff || printEdit?.enabled) { turnPrintOff(); return; }
    if (!owned('print') || !printUnlocked() || printEdit || pending || admission) return;
    const enable = () => savePrint({enabled:true,disclosed:true});
    if (printSetting().disclosed) return enable();
    const el = document.createElement('div'); el.className = 'o-modal'; el.setAttribute('role','dialog'); el.setAttribute('aria-modal','true'); el.setAttribute('aria-labelledby','lg08h-title');
    el.innerHTML = `<div class="o-modal-card o-vault-gate"><h3 id="lg08h-title">Enable Auto-print?</h3><div class="o-vault-gate-content" tabindex="0" role="region" aria-label="Auto-print reset losses"><p>Auto-print can start an ordinary Printing without asking again when your rule is met. It spends your current room to collect pending Legacy stars. You lose bananas, machines, typists, run upgrades, deals, divisions, Muses, garden and word bank. Awards, Legacy, earlier editions and saved Folio, Archive and Works materials and first claims follow ordinary Printing retention. It will not start during a challenge, hosted break, active work or waiting save. You can turn it Off beside Second Printing.</p></div><div class="o-row"><button class="o-btn" data-cancel>Keep Off</button><button class="o-btn gold" data-enable>Enable Auto-print</button></div></div>`;
    const close = () => { el.remove(); api.mark(); };
    el.querySelector('[data-cancel]').onclick = close;
    el.querySelector('[data-enable]').onclick = () => { close(); if (printUnlocked()) enable(); };
    el.onkeydown = e => {
      if (e.key === 'Escape') close();
      if (e.key === 'Tab') { const focus = [...el.querySelectorAll('[tabindex],button')], first = focus[0], last = focus.at(-1); if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); } }
    };
    document.body.appendChild(el); el.querySelector('[data-cancel]').focus();
  }
  function printCard(safe) {
    if (!api.printingEnabled()) return '';
    const cfg = safe ? printSetting() : {enabled:false,N:30}, r = printRule(api.state().run.earned,samplePaid,sampleSeconds,cfg.N), on = safe && cfg.enabled && !printOff;
    const star = n => window.Gems?.amount('star', n) || n;
    const reason = !safe ? 'Unsupported data' : printOff && cfg.enabled ? 'Off here · retry the save' : printNotice || (!printUnlocked() ? 'Locked' : !on ? '' : !printReady() ? 'Paused while busy' : sampleSeconds < 300 ? 'Measuring income…' : !r?.rate ? 'Waiting for income' : !r.gain ? 'Waiting for a star' : !r.eligible ? 'Next star is close' : 'Ready');
    const body = `<div class="o-auto-stats"><span title="Stars if you print now">${star(r?.gain ?? 0)}</span><span class="o-auto-next" title="Time to the next star">⏱ <b>${r?.estimate == null ? '–' : Math.round(r.estimate) + 'm'}</b></span></div><span class="o-prog o-auto-bar${sampleActive ? '' : ' idle'}" role="img" aria-label="Income sample"><i style="width:${Math.min(100, Math.round(100 * sampleSeconds / 300))}%"></i></span><div class="o-auto-fields">${field(`If the next ${window.Gems?.html('star') || 'star'} is over (min)`, `<input id="lg08h-N" type="number" min="5" max="240" step="1" value="${cfg.N}" ${!safe ? 'disabled' : ''}>`)}<button type="button" class="o-btn sm" data-act="automation:print-apply" ${!safe ? 'disabled' : ''}>Set</button></div>`;
    return autoCard('print', {cls:'lg08h-print', on, act:'automation:print-toggle', disabled:!safe || !on && (!printUnlocked() || printEdit || pending), proof:cfg.manual?.complete ? '' : 'Press once by hand', body, status:aText(reason), extra:printEdit ? retryBtn('automation:print-retry', 'Retry') : ''});
  }
  function supported(m, owner = api) {
    return m === undefined || object(m) && m.version === 1 && validOwnership(m.ownership) && validPrint(m.print) && (m.challenge === undefined || !!window.AutoChallenge?.valid(m.challenge)) && (!owner.museEnabled() || validMuse(m.muse)) && (!owner.mediaEnabled() || owner.validMedia(m.media)) && (!owner.gardenEnabled() || validGarden(m.garden,owner)) && (!owner.pitchEnabled() || owner.validPitch(m.pitch)) &&
      (m.tiers === undefined || object(m.tiers) && m.tiers.version === 1 && helpers.every(id =>
        m.tiers[id] === undefined || Number.isInteger(m.tiers[id]) && m.tiers[id] >= 0 && m.tiers[id] <= 3)) &&
      ((m.tiers?.net ?? 0) > 0 ? m.net?.version === 2 : m.net?.version !== 2) && (m.desks === undefined || object(m.desks) && owner.automationDesks().every(({id}) => {
      const d = m.desks[id];
      return d === undefined || object(d) && (d.enabled === undefined || typeof d.enabled === 'boolean') &&
        (d.reservePercent === undefined || Number.isInteger(d.reservePercent) && d.reservePercent >= 0 && d.reservePercent <= 100 && d.reservePercent % 5 === 0);
    })) && (m.shop === undefined || object(m.shop) && m.shop.version === 1 &&
      (m.shop.enabled === undefined || typeof m.shop.enabled === 'boolean') &&
      (m.shop.priority === undefined || Array.isArray(m.shop.priority) && m.shop.priority.length === order.length &&
        new Set(m.shop.priority).size === order.length && m.shop.priority.every(id => order.includes(id)))) &&
      (m.coach === undefined || object(m.coach) && m.coach.version === 1 &&
        (m.coach.enabled === undefined || typeof m.coach.enabled === 'boolean')) &&
      (m.restore === undefined || object(m.restore) && m.restore.version === 1 &&
        (m.restore.enabled === undefined || typeof m.restore.enabled === 'boolean')) &&
      (m.net === undefined || object(m.net) && [1, 2].includes(m.net.version) &&
        (m.net.enabled === undefined || typeof m.net.enabled === 'boolean') &&
        ['ordinary', 'golden'].every(k => m.net[k] === undefined || Number.isInteger(m.net[k]) && m.net[k] >= 0 && m.net[k] < (m.net.version === 2 ? 10 : 5)));
  }
  function reset() { resetMuseClock(); museNotice = ''; resetMediaClock(); mediaNotice = ''; resetPitchClock(); pitchNotice = ''; resetGardenClock(); gardenPending = null; gardenNotice = ''; netLease = null; cancelNet(true); elapsed = shopElapsed = coachElapsed = restoreElapsed = restoreCursor = turn = cursor = 0; pending = null; notice = ''; suspended.clear(); }
  function write(p) {
    const result = p.admission ? api.admitAutomation(saved() === undefined ? null : JSON.stringify(saved()), p.admission) : p.base ? api.buyAutomationBase(p.base,p.expected) : p.upgrade ? api.buyAutomationTier(p.upgrade, p.level, p.expected) : api.commitAutomation(p.expected, p.next);
    if (p.admission && result.ok) admission = null;
    if (p.base && result.retryable === false) { pending = null; notice = result.error; api.mark(); return; }
    if (p.upgrade) {
      if (p.upgrade === 'hire') elapsed = cursor = 0;
      else if (p.upgrade === 'shop') shopElapsed = 0;
      else if (p.upgrade === 'coach') coachElapsed = 0;
      else if (p.upgrade === 'restore') restoreElapsed = restoreCursor = 0;
      else if (p.upgrade === 'garden') resetGardenClock();
      else if (p.upgrade === 'pitch') resetPitchClock();
      else if (p.upgrade === 'media') resetMediaClock();
      else if (p.upgrade === 'muse') resetMuseClock();
      else cancelNet();
      if (result.retryable === false) { pending = null; notice = result.error; api.mark(); return; }
    }
    if (!p.upgrade && !p.base && !p.admission) {
      if (p.muse) resetMuseClock(); else if (p.media) resetMediaClock(); else if (p.pitch) resetPitchClock(); else if (p.garden) resetGardenClock(); else if (p.net) { if (!result.ok) cancelNet(); } else if (p.restore) restoreElapsed = restoreCursor = 0; else if (p.coach) coachElapsed = 0; else if (p.shop) shopElapsed = 0; else elapsed = 0;
    }
    if (!result.ok) { pending = p; notice = 'Could not save this change. Automation is paused. Retry to keep it.'; }
    else {
      const museOff = suspended.has('muse') && !p.muse;
      const mediaOff = suspended.has('media') && !p.media;
      const gardenOff = suspended.has('garden') && !p.garden, pitchOff = suspended.has('pitch') && !p.pitch;
      pending = null; notice = '';
      if (p.muse) suspended.delete('muse'); else suspended.clear();
      if (museOff) suspended.add('muse');
      if (mediaOff) suspended.add('media');
      if (gardenOff) suspended.add('garden');
      if (pitchOff) suspended.add('pitch');
    }
    api.mark();
  }
  function upgrade(el) {
    const id = el.dataset.helper, expectedLevel = Number(el.dataset.level);
    if (pending || !helpers.includes(id) || !api.quoteAutomationTier(id).ok || level(id) !== expectedLevel) return;
    if (id === 'net') cancelNet(true);
    const current = saved();
    write({ upgrade:id, level:expectedLevel, expected:current === undefined ? null : JSON.stringify(current) });
  }
  function tierCard(id, safe) {
    if (!safe) return '<p>Upgrades disabled for unsupported save data.</p>';
    const q = api.quoteAutomationTier(id), n = level(id);
    const effect = id === 'net' ? `${[60,70,80,100][n]}% selection per kind` : id === 'restore' ? `${margin()} times restoration price in wallet` : `Every ${interval(id)} active game seconds`;
    return `<p>${effect}. ${n === 3 ? 'Max level.' : escape(q.error || '')}</p>${n === 3 ? '' : `<button type="button" class="o-btn gold" data-act="automation:upgrade" data-helper="${id}" data-level="${n}" ${pending || !q.ok ? 'disabled' : ''}>Upgrade ${id === 'net' ? 'net' : `auto-${id}`} (${q.price} star${q.price === 1 ? '' : 's'})</button>`}`;
  }
  function netReady() {
    return !challengeControl() && !api.masteryActive() && owned('net') && netUnlocked() && supported(saved()) && netSetting().enabled && !pending && !suspended.has('net') &&
      !document.hidden && IMI.screen() === 'game' && api.automationAllowed() && !IMI.tour?.active() &&
      !document.querySelector('.mg01-overlay, .o-modal, .o-celebrate, .set-pop:not([hidden])');
  }
  function itemLiveDOM(item) {
    if (!item.el.isConnected || item.el.closest('[inert], [hidden]')) return false;
    const style = getComputedStyle(item.el);
    return style.visibility !== 'hidden' && style.display !== 'none';
  }
  function itemVisible(item) {
    if (!itemLiveDOM(item)) return false;
    const r = item.el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 &&
      r.right > 0 && r.bottom > 0 && r.left < innerWidth && r.top < innerHeight;
  }
  function observeNet() {
    if (api) sampleUpdate();
    if (api && museElapsed && !museReady()) resetMuseClock();
    if (api && mediaElapsed && !mediaReady()) resetMediaClock();
    if (api && pitchElapsed && !pitchReady()) resetPitchClock();
    if (api && gardenElapsed && (!IMI.ops.progression?.running() || window.Rewards?.held?.() || window.Rewards?.localDisposition?.())) resetGardenClock();
    if (!netItems.ordinary && !netItems.golden) return;
    if (netLease || !netReady()) return cancelNet();
    for (const kind of ['ordinary', 'golden']) {
      const slot = netItems[kind];
      if (slot?.resuming && slot.item.el.isConnected) continue;
      if (slot && (!slot.item.valid() || !itemLiveDOM(slot.item) || slot.admitted && !itemVisible(slot.item))) netItems[kind] = null;
    }
  }
  function editNet() {
    if (pending || !netUnlocked() || !supported(saved())) return;
    const current = saved(), next = current === undefined ? {version:1} : JSON.parse(JSON.stringify(current));
    const enabled = !netSetting().enabled;
    next.net = { ...netSetting(), enabled };
    cancelNet(true);
    if (!enabled) suspended.add('net');
    write({ expected:current === undefined ? null : JSON.stringify(current), next, net:true });
  }
  function serviceNet({replay}) {
    if (replay && window.VaultPlay?.enabled() && window.Rewards?.localDisposition()) return;
    if (netLease || replay || !netReady()) return cancelNet();
    for (const kind of ['ordinary', 'golden']) {
      if (!netReady()) return cancelNet();
      const slot = netItems[kind];
      if (!slot) continue;
      if (slot.resuming && slot.item.el.isConnected && !itemLiveDOM(slot.item)) continue;
      if (!slot.item.valid() || !itemLiveDOM(slot.item)) { netItems[kind] = null; continue; }
      if (!itemVisible(slot.item)) { if (slot.admitted && !slot.resuming) netItems[kind] = null; continue; }
      delete slot.resuming;
      if (!slot.admitted) {
        const current = saved(), next = JSON.parse(JSON.stringify(current)), cfg = netSetting(), phase = cfg[kind];
        next.net = { ...cfg, [kind]:(phase + 1) % (cfg.version === 2 ? 10 : 5) };
        write({ expected:JSON.stringify(current), next, net:true });
        if (pending) return;
        if ((cfg.version === 2 ? sequences[level('net')][phase] : 'CSCSC'[phase]) === 'S') { netItems[kind] = null; continue; }
        slot.admitted = true; slot.at = api.clock.productionNow();
      } else if (api.clock.productionNow() - slot.at >= 1000) {
        netItems[kind] = null;
        if (netReady() && slot.item.valid() && itemVisible(slot.item)) slot.item.claim();
      }
    }
  }
  function netStatus() {
    if (!netUnlocked()) return 'Locked';
    if (suspended.has('net')) return 'Off here · retry the save';
    if (pending) return 'Paused until the save lands';
    return '';
  }
  function editRestore() {
    if (pending || !restoreUnlocked() || !supported(saved())) return;
    const current = saved(), next = current === undefined ? {version:1} : JSON.parse(JSON.stringify(current));
    const enabled = !restoreSetting().enabled;
    next.restore = { ...restoreSetting(), version:1, enabled };
    if (!enabled) suspended.add('restore');
    write({ expected:current === undefined ? null : JSON.stringify(current), next, restore:true });
  }
  function restoreStatus() {
    if (!restoreUnlocked()) return 'Locked';
    if (suspended.has('restore')) return 'Off here · retry the save';
    if (pending) return 'Paused until the save lands';
    if (!restoreSetting().enabled) return '';
    const desks = api.automationDesks();
    for (let n = 0; n < Math.min(6, desks.length); n++) {
      const d = desks[(restoreCursor + n) % desks.length], q = api.quoteAutomationRestore(d.index);
      if (q.ok) return `Next: ${d.name} · ${Economy.fmt(q.price)}`;
    }
    return 'Saving up';
  }
  function editCoach() {
    if (pending || !coachUnlocked() || !supported(saved())) return;
    const current = saved(), next = current === undefined ? {version:1} : JSON.parse(JSON.stringify(current));
    const enabled = !coachSetting().enabled;
    next.coach = { ...coachSetting(), version:1, enabled };
    if (!enabled) suspended.add('coach');
    write({ expected:current === undefined ? null : JSON.stringify(current), next, coach:true });
  }
  function coachTarget() {
    return api.automationCoachTargets().filter(t => t.ok).sort((a, b) =>
      a.level - b.level || a.coach - b.coach || a.index - b.index || a.paw - b.paw)[0];
  }
  function coachStatus() {
    if (!coachUnlocked()) return 'Locked';
    if (suspended.has('coach')) return 'Off here · retry the save';
    if (pending) return 'Paused until the save lands';
    if (!coachSetting().enabled) return '';
    const t = coachTarget();
    return t ? `Next: ${t.name} · ${t.desk}` : 'Saving up';
  }
  function editShop(field, value) {
    if (pending || !shopUnlocked() || !supported(saved())) return;
    const current = saved(), next = current === undefined ? {version:1} : JSON.parse(JSON.stringify(current));
    next.shop = { ...shopSetting(), version:1, [field]:value };
    if (!supported(next)) return;
    if (field === 'enabled' && !value) suspended.add('shop');
    write({ expected:current === undefined ? null : JSON.stringify(current), next, shop:true });
  }
  function move(el) {
    const priority = [...shopSetting().priority], i = priority.indexOf(el.dataset.item), j = i + Number(el.dataset.direction);
    if (i < 0 || !Number.isInteger(j) || j < 0 || j >= priority.length) return;
    [priority[i], priority[j]] = [priority[j], priority[i]];
    editShop('priority', priority);
  }
  function edit(id, field, value) {
    if (pending || !unlocked() || !supported(saved()) || !api.automationDesks().some(d => d.id === id && d.owned)) return;
    const current = saved(), next = current === undefined ? {version:1, desks:{}} : JSON.parse(JSON.stringify(current));
    next.desks = { ...next.desks, [id]:{ ...setting(id), [field]:value } };
    if (!supported(next)) return;
    if (field === 'enabled' && !value) suspended.add(id);
    write({ expected:current === undefined ? null : JSON.stringify(current), next });
  }
  function status(d) {
    const cfg = setting(d.id);
    if (suspended.has(d.id)) return 'Off here · retry the save';
    if (!cfg.enabled) return '';
    if (pending) return 'Paused until the save lands';
    const q = api.quoteAutomationHire(d.index, cfg.reservePercent);
    return q.ok ? '' : q.error;
  }
  const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
  const destinations = {hire:['training','crew'], coach:['training','crew'], shop:['shop'], restore:['shop'], net:['floor'], garden:['lab'], pitch:['press','pitches'], media:['studios'], muse:['muses'], print:['legacy','press'], challenge:['legacy','challenges']};
  const names = {hire:'Auto-hire',coach:'Auto-coach',shop:'Auto-shop',restore:'Auto-restore',net:'Banana net',garden:'Auto-garden',pitch:'Auto-pitch',media:'Auto-media',muse:'Muse director',print:'Auto-print',challenge:'Auto-challenge'};
  function inlineCard(id, safe, slot) {
    const shop = safe ? shopSetting() : {enabled:false, priority:order}, off = suspended.has('shop') || !shop.enabled;
    const coachOff = !safe || suspended.has('coach') || !coachSetting().enabled;
    const restoreOff = !safe || suspended.has('restore') || !restoreSetting().enabled;
    if (id === 'hire') {
      const d = api.automationDesks().find(d => d.id === slot.dataset.desk && d.owned);
      if (!d || !unlocked()) return '';
      const cfg = safe ? setting(d.id) : {enabled:false, reservePercent:25}, off = suspended.has(d.id) || !cfg.enabled;
      const body = `<div class="o-auto-fields">${field(`Keep <b>${cfg.reservePercent}%</b> letters`, `<select id="lg03-reserve-${d.id}" data-lg03-reserve="${d.id}" aria-label="Letter reserve" ${!safe || pending ? 'disabled' : ''}>${Array.from({length:21}, (_, i) => i * 5).map(n => `<option value="${n}" ${n === cfg.reservePercent ? 'selected' : ''}>${n}%</option>`).join('')}</select>`)}</div>`;
      return autoCard('hire', {cls:'lg03-desk', on:!off, act:'automation:toggle', attrs:`data-desk="${d.id}"`, label:`Auto-hire on ${d.name}`, disabled:!safe || pending, bar:[elapsed, interval('hire')], body, status:safe ? aText(status(d)) : 'Unsupported data'});
    }
    if (id === 'net') {
      if (!netUnlocked()) return '';
      const on = safe && !suspended.has('net') && netSetting().enabled;
      return autoCard('net', {cls:'lg03-net', on, act:'automation:net-toggle', label:'Banana net', disabled:!safe || pending, status:safe ? aText(netStatus()) : 'Unsupported data'});
    }
    if (id === 'restore') return restoreUnlocked() ? autoCard('restore', {cls:'lg03-restore', on:!restoreOff, act:'automation:restore-toggle', disabled:!safe || pending || !restoreUnlocked(), bar:[restoreElapsed, 20], status:safe ? aText(restoreStatus()) : 'Unsupported data'}) : '';
    if (id === 'coach') return coachUnlocked() ? autoCard('coach', {cls:'lg03-coach', on:!coachOff, act:'automation:coach-toggle', disabled:!safe || pending || !coachUnlocked(), bar:[coachElapsed, interval('coach')], status:safe ? aText(coachStatus()) : 'Unsupported data'}) : '';
    if (id === 'shop') {
      if (!shopUnlocked()) return '';
      const list = `<ol class="lg03-priority">${shop.priority.map((pid, i) => {
        const name = items.find(([key]) => key === pid)[1], q = api.quoteAutomationShop(pid), disabled = !safe || pending || !shopUnlocked();
        return `<li class="${q.owned ? 'done' : ''}"><div><strong>${name}</strong>${q.owned ? '<span class="o-lvl">✓</span>' : api.shop.price(q.price)}</div><div class="lg03-order"><button type="button" data-act="automation:shop-move" data-item="${pid}" data-direction="-1" aria-label="Move ${name} up" ${disabled || i === 0 ? 'disabled' : ''}>▲</button><button type="button" data-act="automation:shop-move" data-item="${pid}" data-direction="1" aria-label="Move ${name} down" ${disabled || i === shop.priority.length - 1 ? 'disabled' : ''}>▼</button></div></li>`;
      }).join('')}</ol>`;
      return autoCard('shop', {cls:'lg03-shop', on:!off, act:'automation:shop-toggle', disabled:!safe || pending || !shopUnlocked(), bar:[shopElapsed, interval('shop')], body:list, status:suspended.has('shop') ? 'Off here · retry the save' : pending ? 'Paused until the save lands' : ''});
    }
    const locked = {
      garden:[api.gardenEnabled(),gardenUnlocked(),'Imprint 1, then plant and harvest a new crop by hand.'],
      pitch:[api.pitchEnabled(),pitchUnlocked(),'Imprint 2, then commission and sell a new title by hand.'],
      media:[api.mediaEnabled(),mediaUnlocked(),'Imprint 3, then release media by hand.'],
      muse:[api.museEnabled(),museUnlocked(),'Imprint 5, then seat two different Muses by hand.'],
      print:[api.printingEnabled(),printUnlocked(),'Estate 1, then complete a new manual Printing.'],
      challenge:[api.challengeEnabled(),AutoChallenge.earned(api.state()),'Estate 3, Small Crew clear, manual Gold and purchased Veteran Crew.']
    }[id];
    if (locked && !locked[0]) return '';
    if (locked && !locked[1] && saved()?.[id] === undefined) return '';
    const builders = {garden:gardenCard,pitch:pitchCard,media:mediaCard,muse:museCard,print:printCard,challenge:challengeCard};
    return builders[id]?.(safe) || '';
  }
  function afterRender({pane}) {
    if (!pane) return;
    const safe = supported(saved());
    const slots = [...pane.querySelectorAll('[data-automation]')];
    let recoveryShown = false;
    for (const slot of slots) {
      const id = slot.dataset.automation;
      let html;
      if (id === 'helpers') {
        const art = AUTO_ICO;
        const star = n => window.Gems?.amount('star',n) || n;
        const pips = (n,max) => `<span class="o-pips">${Array.from({length:max},(_,k) => `<i class="${k < n ? 'on' : ''}"></i>`).join('')}</span>`;
        const speed = speedText;
        const shown = bases.filter(id => owned(id) || baseGate(id));
        html = shown.length ? '<div class="lg03-helpers">' + shown.map(id => {
          const have = owned(id), q = have ? null : api.quoteAutomationBase(id), tiered = helpers.includes(id), n = level(id);
          let action = '', fx = '';
          if (!have) action = `<button type="button" class="o-btn gold o-starbtn" data-act="automation:buy" data-helper="${id}" ${!q.ok || pending || admission ? 'disabled' : ''}>${star(q.price)}</button>`;
          else if (tiered && n < 3) { const t = api.quoteAutomationTier(id); action = `<button type="button" class="o-btn gold o-starbtn" data-act="automation:upgrade" data-helper="${id}" data-level="${n}" ${pending || !t.ok ? 'disabled' : ''}>${star(t.price)}</button>`; }
          else action = `<span class="o-lvl">${tiered ? 'MAX' : '✓'}</span>`;
          if (tiered) fx = `<p class="o-leg-fx"><b>${speed(id,have ? n : 0)}</b>${have && n < 3 ? ` <span class="o-leg-next">› ${speed(id,n + 1)}</span>` : ''}</p>`;
          return `<section class="o-card o-leg o-helper${have ? '' : ' off'}"><div class="o-row"><h3>${api.shop.cart(art[id])}${names[id]}</h3>${have ? `<button type="button" class="o-btn sm o-gear" data-act="automation:settings" data-helper="${id}" aria-label="${names[id]} settings">⚙</button>` : ''}</div>${tiered ? pips(have ? n : 0,3) : ''}${fx}${!have && q && !q.ok ? `<p class="o-warn">${escape(q.error)}</p>` : ''}${action}</section>`;
        }).join('') + '</div>' : '';
      } else {
        html = owned(id) ? inlineCard(id,safe,slot) : '';
      }
      if ((html || pending) && !recoveryShown) {
        html = `${api.masteryActive() ? '<p role="status">Helpers paused during manual Small Crew mastery.</p>' : ''}${!safe ? '<p role="status">Unsupported settings preserved. Helpers disabled.</p>' : ''}${pending ? `<p role="status">${escape(notice)}</p><button data-act="automation:retry">Retry save</button>` : ''}` + html;
        recoveryShown = true;
      }
      api.morph(slot,html);
    }
  }
  const hooks = {
    afterRender,
    init(reason, current) { api = current; reset(); captureAdmission(); resetSample(); printChoice(); if (reason === 'load') IMI.onScreen(() => { sampleUpdate(); cancelNet(); resetGardenClock(); resetPitchClock(); resetMediaClock(); resetMuseClock(); }); },
    admit, admissionPending:() => !!admission, owned, baseGate, settingsOwned, admissionAllowed:o => admission !== null && JSON.stringify(o) === JSON.stringify(admission),
    baseRequestAllowed:(id,expected) => !admission && (!pending || pending.base === id && pending.expected === expected),
    identitySettled:() => !admission && !pending && !gardenPending,
    challengeOn, challengeAuthorize, challengeReserved, challengeLocalOff, challengeSaveOff,
    reset, turnPrintOff, printChoice, printRule, printDecision, validPrintDecision, printAuthorize, printPosting, resetSample, sampleUpdate, printSampleToken:(committed = false) => sampleUpdate(committed) ? sampleGeneration : null, printSampleStatus:() => ({seconds:sampleSeconds,paid:samplePaid,active:sampleActive,elapsed:printElapsed,generation:sampleGeneration}), pendingGarden:() => !!gardenPending, pendingChoice:() => !!pending, earnedInterval, validMuse, museReady, museActive, museSuspend, museEvidence, museResult, mediaReady, pitchReady, validConfig:supported, pendingCrop, gardenEvidence, clearGardenPending, gardenAction, gardenReady,
    firstClearFloor(id, current) {
      const helper = {smallcrew:'hire', quietshop:'shop', patientpress:'coach', baremetal:'restore'}[id];
      if (!helper || !supported(current)) return null;
      const next = current === undefined ? {version:1} : JSON.parse(JSON.stringify(current));
      next.tiers = { ...next.tiers, version:1, [helper]:Math.max(next.tiers?.[helper] ?? 0, 1) };
      return next;
    },
    tierRequestAllowed:(id, level, expected) => !pending || pending.upgrade === id && pending.level === level && pending.expected === expected,
    netHold(lease) { if (!netLease) netLease = lease; },
    netRelease(lease) {
      if (netLease !== lease) return;
      cancelNet();
      for (const slot of Object.values(netItems)) if (slot?.admitted) slot.resuming = true;
      netLease = null;
    },
    netDispose() { netLease = null; cancelNet(true); },
    netBlocked:cancelNet,
    netCreated(kind, item) {
      if (netLease) { if (netItems[kind]?.item !== item) netItems[kind] = null; return; }
      if (netReady() && item.valid() && itemLiveDOM(item)) netItems[kind] = {item, admitted:false};
    },
    netCleared(kind, item) { if (netItems[kind]?.item === item) netItems[kind] = null; },
    actions:{ purchases:() => { api.setTab('legacy'); document.querySelector('[data-dept="legacy"][data-sub="upgrades"]')?.click(); api.setTab('legacy'); }, buy:buyBase, settings:el => { const [tab,sub] = destinations[el.dataset.helper] || []; if (!tab) return; api.setTab(tab); if (sub) { document.querySelector(`[data-dept="${tab}"][data-sub="${sub}"]`)?.click(); api.setTab(tab); } if (tab !== 'floor') document.querySelector(`[data-automation="${el.dataset.helper}"]`)?.scrollIntoView({block:'nearest'}); }, 'challenge-toggle':challengeToggle, 'challenge-retry':() => {if (challengeEdit) challengeSave(challengeEdit);}, 'challenge-continue':() => {challengeLocalOff(); const r = Rewards.challengeAction({action:'continue'}); if (!r.ok) challengeNotice = r.error; api.mark();}, 'challenge-abandon':() => {if (confirm('Abandon this Small Crew run? No compensation or reward.')) {challengeLocalOff(); const r = Rewards.challengeAction({action:'abandon'}); if (!r.ok) challengeNotice = r.error; api.mark();}}, 'print-toggle':togglePrint, 'print-retry':() => { if (printEdit) savePrint(printEdit); }, 'print-apply':() => { const raw = document.getElementById('lg08h-N')?.value, N = Number(raw); printChoice(); if (!raw || !Number.isSafeInteger(N) || N < 5 || N > 240) { printNotice = 'Enter a whole number from 5 to 240. Settings unchanged.'; api.mark(); return; } savePrint({N}); }, 'muse-toggle':editMuse, 'muse-retry':() => { resetMuseClock(); const r = api.retryMuse(); if (!r.ok && r.retryable === false) { museNotice = r.error; api.mark(); } }, 'media-toggle':editMedia, 'media-retry':() => { resetMediaClock(); Rewards.retry(); }, 'pitch-toggle':editPitch, 'pitch-retry':() => { resetPitchClock(); api.retryCommission(); }, 'garden-toggle':() => editGarden('enabled', suspended.has('garden') || !gardenSetting().enabled), 'garden-retry':() => { if (gardenPending) gardenAction(gardenPending); }, upgrade, toggle:el => { const id = el.dataset.desk; edit(id, 'enabled', !setting(id).enabled); }, 'net-toggle':editNet, 'restore-toggle':editRestore, 'coach-toggle':editCoach, 'shop-toggle':() => editShop('enabled', !shopSetting().enabled), 'shop-move':move, retry:() => { if (pending) write(pending); } },
    tick({gameSeconds, replay}) {
      if (api.masteryActive()) {cancelNet(); resetSample(); printElapsed = 0; return;}
      const control = challengeControl();
      const reserved = challengeReserved();
      if (reserved && !challengeWasReserved) {resetSample(); printChoice();}
      challengeWasReserved = reserved;
      if (control) {cancelNet(); resetGardenClock(); resetPitchClock(); resetMediaClock(); resetMuseClock(); elapsed = shopElapsed = coachElapsed = restoreElapsed = 0;}
      challengeElapsed = !replay && challengeReady() && Number.isFinite(gameSeconds) && gameSeconds > 0 ? Math.min(60,challengeElapsed + gameSeconds) : 0;
      if (!replay) sampleUpdate();
      const printActive = !replay && printReady();
      if (printActive && Number.isFinite(gameSeconds) && gameSeconds > 0) printElapsed = Math.min(60,printElapsed + gameSeconds);
      if (!control) serviceNet({replay});
      if (!control && !replay && museActive() && !api.museStatus().pending) api.reconcileMuse();
      const museActiveNow = !control && !replay && museReady(), museNow = api.clock.productionNow();
      if (!museActiveNow) resetMuseClock();
      else {
        if (museLast !== null && museNow - museLast > gameSeconds * 1000 + 250) resetMuseClock();
        museLast = museNow;
        if (Number.isFinite(gameSeconds) && gameSeconds > 0) museElapsed = Math.min(earnedInterval('muse'),museElapsed + gameSeconds);
      }
      const mediaActive = !control && !replay && mediaReady(), mediaNow = api.clock.productionNow();
      if (!mediaActive) resetMediaClock();
      else {
        if (mediaLast !== null && mediaNow - mediaLast > gameSeconds * 1000 + 250) resetMediaClock();
        mediaLast = mediaNow;
        if (Number.isFinite(gameSeconds) && gameSeconds > 0) mediaElapsed = Math.min(earnedInterval('media'),mediaElapsed + gameSeconds);
      }
      const pitchActive = !control && !replay && pitchReady(), pitchNow = api.clock.productionNow();
      if (!pitchActive) resetPitchClock();
      else {
        if (pitchLast !== null && pitchNow - pitchLast > gameSeconds * 1000 + 250) resetPitchClock();
        pitchLast = pitchNow;
        if (Number.isFinite(gameSeconds) && gameSeconds > 0) pitchElapsed = Math.min(earnedInterval('pitch'),pitchElapsed + gameSeconds);
      }
      if (!control && !replay && !document.hidden && IMI.screen() === 'game' && !gardenPending && !pending) api.reconcileGarden();
      const gardenActive = !control && !replay && gardenReady(), now = api.clock.productionNow();
      if (!gardenActive) resetGardenClock();
      else {
        if (gardenLast !== null && now - gardenLast > gameSeconds * 1000 + 250) resetGardenClock();
        gardenLast = now;
        if (Number.isFinite(gameSeconds) && gameSeconds > 0) gardenElapsed = Math.min(earnedInterval('garden'),gardenElapsed + gameSeconds);
      }
      if (replay || document.hidden || IMI.screen() !== 'game' || pending || !supported(saved()) || !api.automationAllowed()) return;
      const desks = api.automationDesks();
      if (!Number.isFinite(gameSeconds) || gameSeconds <= 0) return;
      const hireOn = !control && owned('hire') && unlocked() && desks.some(d => setting(d.id).enabled && !suspended.has(d.id));
      const shopOn = !control && owned('shop') && shopUnlocked() && shopSetting().enabled && !suspended.has('shop');
      const coachOn = !control && owned('coach') && coachUnlocked() && coachSetting().enabled && !suspended.has('coach');
      elapsed = hireOn ? Math.min(interval('hire'), elapsed + gameSeconds) : 0;
      shopElapsed = shopOn ? Math.min(interval('shop'), shopElapsed + gameSeconds) : 0;
      coachElapsed = coachOn ? Math.min(interval('coach'), coachElapsed + gameSeconds) : 0;
      const restoreOn = !control && owned('restore') && restoreUnlocked() && restoreSetting().enabled && !suspended.has('restore');
      restoreElapsed = restoreOn ? Math.min(20, restoreElapsed + gameSeconds) : 0;
      const due = [elapsed + 1e-9 >= interval('hire'), shopElapsed + 1e-9 >= interval('shop'), coachElapsed + 1e-9 >= interval('coach'), restoreElapsed + 1e-9 >= 20, gardenActive && gardenElapsed + 1e-9 >= earnedInterval('garden'), pitchActive && pitchElapsed + 1e-9 >= earnedInterval('pitch'), mediaActive && mediaElapsed + 1e-9 >= earnedInterval('media'), museActiveNow && museElapsed + 1e-9 >= earnedInterval('muse'), printActive && printElapsed + 1e-9 >= 60, challengeReady() && challengeElapsed + 1e-9 >= 60];
      let service = -1;
      for (let n = 0; n < due.length; n++) { const i = (turn + n) % due.length; if (due[i]) { service = i; break; } }
      if (service < 0) return;
      turn = (service + 1) % due.length;
      if (service === 0) {
        elapsed = 0;
        for (let n = 0; n < desks.length; n++) {
          const d = desks[cursor]; cursor = (cursor + 1) % desks.length;
          const cfg = setting(d.id);
          if (cfg.enabled && !suspended.has(d.id) && api.hireAutomationOne(d.index, cfg.reservePercent)) break;
        }
      } else if (service === 1) {
        shopElapsed = 0;
        for (const id of shopSetting().priority) if (api.buyAutomationShopOne(id)) break;
      } else if (service === 2) {
        coachElapsed = 0;
        const t = coachTarget();
        if (t) api.coachAutomationOne(t.index, t.paw);
      } else if (service === 3) {
        restoreElapsed = 0;
        for (let n = 0; n < Math.min(6, desks.length); n++) {
          const d = desks[restoreCursor]; restoreCursor = (restoreCursor + 1) % desks.length;
          if (api.restoreAutomationOne(d.index)) break;
        }
      }
      if (service === 9) challengeTurn();
      if (service === 8) {
        printElapsed = 0; printAttempt = true;
        try { if (printAuthorize()) { const quote = api.printingReview('auto'); const result = Rewards.printingAction({origin:'auto',quote}); if (!result.ok) printNotice = result.error; } }
        catch(error) { printNotice = error.message; }
        finally { printAttempt = false; }
      }
      if (service === 7) {
        museElapsed = 0; const q = api.museSelection();
        if (q) api.seatMuse(q.slot,q.id,'auto');
        else museNotice = 'Waiting for a better ready-title sale or useful night seat.';
      }
      if (service === 6) {
        mediaElapsed = 0; const result = api.mediaAttempt(); mediaNotice = result?.ok ? 'Release saved.' : result?.error || 'Waiting for a qualifying release.';
      }
      if (service === 5) {
        pitchElapsed = 0; const result = api.pitchAttempt(); pitchNotice = result?.ok ? 'Commission saved.' : result?.error || 'Waiting for a qualifying offer.';
      }
      if (service === 4) {
        gardenElapsed = 0;
        const result = api.gardenAttempt(gardenSetting());
        if (!gardenPending && !result?.ok) gardenNotice = result?.error || 'Waiting for an eligible crop';
      }
      api.mark();
    }
  };
  new MutationObserver(observeNet).observe(document.body, {subtree:true, childList:true, attributes:true, attributeFilter:['hidden', 'inert', 'class', 'style']});
  document.addEventListener('visibilitychange', () => { sampleUpdate(); cancelNet(); resetGardenClock(); resetPitchClock(); resetMediaClock(); resetMuseClock(); });
  addEventListener('resize', cancelNet);
  document.addEventListener('change', e => { const field = e.target.dataset?.lg06a; if (field) editGarden(field, field === 'bed' ? Number(e.target.value) : e.target.value); const id = e.target.dataset?.lg03Reserve; if (id) edit(id, 'reservePercent', Number(e.target.value)); });
  (window.__OPS_EXTENSIONS ||= []).push(['automation', hooks]);
})();
