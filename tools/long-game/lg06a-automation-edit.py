exec(open('tools/long-game/lg06a-edit.py',encoding='utf-8-sig').read().split("edit('ops.js'")[0])
edit('automation.js',"  function reset() { cancelNet();", "  function reset() { resetGardenClock(); gardenPending = null; gardenNotice = ''; cancelNet();")
edit('automation.js',"  function supported(m) {",'''  const gardenSetting = () => ({version:1, enabled:false, bed:0, letter:'E', desk:'bamboo', ...saved()?.garden});
  let gardenElapsed = 0, gardenLast = null, gardenPending = null, gardenNotice = '';
  const resetGardenClock = () => { gardenElapsed = 0; gardenLast = null; };
  function validGarden(g) {
    return g === undefined || object(g) && g.version === 1 &&
      (g.enabled === undefined || typeof g.enabled === 'boolean') &&
      (g.bed === undefined || Number.isSafeInteger(g.bed) && g.bed >= 0) &&
      (g.letter === undefined || typeof g.letter === 'string' && /^[A-Z]$/.test(g.letter)) &&
      (g.desk === undefined || api.automationDesks().some(d => d.id === g.desk)) &&
      (g.manual === undefined || object(g.manual) && (g.manual.complete === undefined || typeof g.manual.complete === 'boolean') &&
        (g.manual.pending == null || object(g.manual.pending) && typeof g.manual.pending.token === 'string' &&
          ['imprint','printing','bed','desk'].every(k => Number.isSafeInteger(g.manual.pending[k]) && g.manual.pending[k] >= 0) &&
          /^[A-Z]$/.test(g.manual.pending.letter)));
  }
  function pendingCrop(s) {
    const p = s.meta.automation?.garden?.manual?.pending, b = p && s.garden.beds[p.bed];
    return !!p && p.imprint === Layers.identity(s) && p.printing === s.printing && b?.gardenToken === p.token && b.ch === p.letter && b.desk === p.desk;
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
        manual.pending = {token:b.gardenToken, imprint:Layers.identity(s), printing:s.printing, bed, letter:b.ch, desk:b.desk};
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
  function gardenReady() {
    return gardenUnlocked() && gardenSetting().enabled && !gardenPending && !pending && !suspended.has('garden') &&
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
    const progress = cfg.manual?.complete ? 'Manual cycle complete.' : pendingCrop(api.state()) ? 'Manual planting saved. Harvest that same ripe crop by hand.' : 'Plant a new crop, then harvest it ripe by hand. Older crops and statistics do not count.';
    return `<section class="o-card lg06a-garden"><h3>Auto-garden</h3><p>Free. Requires Imprint 1, introduction complete and one saved manual plant-to-harvest cycle. ${progress}</p><p>One action every 60 active game seconds: plant an empty bed, or harvest its matching ripe crop. Replant on a later attempt. No offline actions.</p><label>Bed<select data-lg06a="bed" ${disabled ? 'disabled' : ''}>${api.state().garden.beds.map((_,i) => `<option value="${i}" ${cfg.bed === i ? 'selected' : ''}>Bed ${i+1}</option>`).join('')}</select></label><label>Letter<select data-lg06a="letter" ${disabled ? 'disabled' : ''}>${Array.from({length:26},(_,i) => String.fromCharCode(65+i)).map(ch => `<option ${cfg.letter === ch ? 'selected' : ''}>${ch}</option>`).join('')}</select></label><label>Desk<select data-lg06a="desk" ${disabled ? 'disabled' : ''}>${api.automationDesks().filter(d => d.owned).map(d => `<option value="${d.id}" ${cfg.desk === d.id ? 'selected' : ''}>${d.name}</option>`).join('')}</select></label><button data-act="automation:garden-toggle" aria-pressed="${!!on}" ${!safe || !on && (pending || !gardenUnlocked()) ? 'disabled' : ''}>Auto-garden: ${on ? 'On' : 'Off'}</button><p role="status">${!safe ? 'Unsupported garden data preserved. Actions disabled.' : suspended.has('garden') ? 'Off locally. Retry to save Off.' : gardenNotice || (on ? 'Waiting for the next 60-second attempt.' : 'Off')}</p>${gardenPending ? '<button data-act="automation:garden-retry">Retry garden action</button>' : ''}</section>`;
  }
  function supported(m) {''')
edit('automation.js',"return m === undefined || object(m) && m.version === 1 &&", "return m === undefined || object(m) && m.version === 1 && validGarden(m.garden) &&")
edit('automation.js',"      if (p.net) {", "      if (p.garden) resetGardenClock(); else if (p.net) {")
edit('automation.js',"    api.morph(pane, `<div", "    api.morph(pane, `<div") if False else None
edit('automation.js',"</p>${!safe ? '<p role=\"status\">Unsupported automation save.","</p>${gardenCard(safe)}${!safe ? '<p role=\"status\">Unsupported automation save.")
edit('automation.js',"    reset, validConfig:supported,", "    reset, validConfig:supported, gardenEvidence, clearGardenPending, gardenAction, gardenReady,")
edit('automation.js',"visible:() => unlocked() || coachUnlocked(), render,", "visible:() => unlocked() || coachUnlocked() || api.gardenEnabled() && api.state().intro.done, render,")
edit('automation.js',"if (reason === 'load') IMI.onScreen(cancelNet);", "if (reason === 'load') IMI.onScreen(() => { cancelNet(); resetGardenClock(); });")
edit('automation.js',"    actions:{ upgrade, toggle:", "    actions:{ 'garden-toggle':() => editGarden('enabled', suspended.has('garden') || !gardenSetting().enabled), 'garden-retry':() => { if (gardenPending) gardenAction(gardenPending); }, upgrade, toggle:")
edit('automation.js',"      if (replay || document.hidden || IMI.screen() !== 'game' || pending || !supported(saved()) || !api.automationAllowed()) return;", """      const gardenActive = !replay && gardenReady(), now = api.clock.productionNow();
      if (!gardenActive) resetGardenClock();
      else {
        if (gardenLast !== null && now - gardenLast > gameSeconds * 1000 + 250) resetGardenClock();
        gardenLast = now;
        if (Number.isFinite(gameSeconds) && gameSeconds > 0) gardenElapsed = Math.min(60,gardenElapsed + gameSeconds);
      }
      if (replay || document.hidden || IMI.screen() !== 'game' || pending || !supported(saved()) || !api.automationAllowed()) return;""")
edit('automation.js',"restoreElapsed + 1e-9 >= 20];", "restoreElapsed + 1e-9 >= 20, gardenActive && gardenElapsed + 1e-9 >= 60];")
edit('automation.js',"      } else {\n        restoreElapsed = 0;", "      } else if (service === 3) {\n        restoreElapsed = 0;")
edit('automation.js',"      api.mark();\n    }\n  };", """      if (service === 4) {
        gardenElapsed = 0;
        const result = api.gardenAttempt(gardenSetting());
        if (!gardenPending && !result?.ok) gardenNotice = result?.error || 'Waiting for an eligible crop';
      }
      api.mark();
    }
  };""")
edit('automation.js',"  document.addEventListener('visibilitychange', cancelNet);", "  document.addEventListener('visibilitychange', () => { cancelNet(); resetGardenClock(); });")
edit('automation.js',"  document.addEventListener('change', e => { const id", "  document.addEventListener('change', e => { const field = e.target.dataset?.lg06a; if (field) editGarden(field, field === 'bed' ? Number(e.target.value) : e.target.value); const id")
edit('automation.css',".lg03-panel { max-width: 760px; margin: 0 auto; }", ".lg03-panel { max-width: 760px; margin: 0 auto; }\n.lg06a-garden label { display: grid; gap: 6px; margin: 12px 0; }\n.lg06a-garden select { width: 100%; min-width: 0; }\n.lg06a-garden p { line-height: 1.5; }")
