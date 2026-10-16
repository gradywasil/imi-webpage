exec(open('tools/long-game/lg06b-edit.py',encoding='utf-8-sig').read().split("edit('ops.js'")[0])
edit('rewards.js',"    if (r.walletHead && (!object(r.walletHead) || r.walletHead.origin !== 'away' || typeof r.walletHead.id !== 'string' || !r.walletHead.id.startsWith('away:') ||", """    if (r.walletHead && (!object(r.walletHead) || !['away','pitch-sale'].includes(r.walletHead.origin) || typeof r.walletHead.id !== 'string' ||
        !(r.walletHead.origin === 'away' ? r.walletHead.id.startsWith('away:') : r.walletHead.id.startsWith('pitch-sale:') &&
          candidate.meta.automation?.pitch?.manual?.complete === true &&
          JSON.stringify(candidate.meta.automation.pitch.manual.receipt) === JSON.stringify({id:r.walletHead.id,sequence:r.walletHead.sequence,amount:r.walletHead.amount})) ||""")
edit('rewards.js',"      return !volatile && !fault && !writing && !candidate.meta.layers?.pending;", "      return !volatile && !fault && !writing && !candidate.meta.layers?.pending && !candidate.meta.automation?.pitch?.sale;")
edit('rewards.js',"  // Folio alone owns these commands", """  // One predecessor sale only. Ops validates its exact recipe, quote and durable word deduction.
  let pitchWaiting = null;
  function pitchWrite(request) {
    const result = transaction(() => api.pitchSaleCommit(request));
    if (!result.ok) hold('Tracked pitch sale waiting. Retry to finish. ' + result.error);
    return result;
  }
  function finishPitch() {
    try {
      const t = api.pitchSaleValidate();
      const paid = wallet().creditReward({id:t.id,previous:t.previous,sequence:t.sequence,amount:t.pay});
      if (!paid.ok) { hold('Tracked pitch payment waiting. Retry to finish. ' + paid.error); return paid; }
      return pitchWrite({action:'finish'});
    } catch(error) { hold(error.message); return {ok:false,error:error.message}; }
  }
  function continuePitch(request) {
    if (state().meta.automation?.pitch?.sale) return finishPitch();
    const baseline = wallet().saveAcknowledged();
    if (!baseline.ok) { hold('Tracked pitch baseline waiting. Retry to finish. ' + baseline.error); return baseline; }
    const result = pitchWrite(request);
    if (!result.ok) return result;
    pitchWaiting = null;
    return finishPitch();
  }
  function pitchSale(request) {
    if (!api?.pitchEnabled?.() || !owns() || busy || volatile || fault || transactionRetry || localUnresolved() || folioWaiting || layerWaiting ||
        !window.IMI.ops.progression.running() || !guard(state()) || request.action !== 'prepare') return {ok:false,error:'Finish the waiting save before selling this pitch.'};
    pitchWaiting = clone(request);
    return continuePitch(pitchWaiting);
  }
  // Folio alone owns these commands""")
edit('rewards.js',"  function reconcile() {", "  function reconcile() {\n    if (state().meta.automation?.pitch?.sale && !finishPitch().ok) return false;")
edit('rewards.js',"      if (layerWaiting) { const result", "      if (state().meta.automation?.pitch?.sale || pitchWaiting) { const result = continuePitch(pitchWaiting); if (!result.ok) return false; pitchWaiting = null; }\n      if (layerWaiting) { const result")
edit('rewards.js',"guard, retry, activate, incomeSeconds, consumeGold, awayCredit, folioAction, layerAction, layerWallet,", "guard, retry, activate, incomeSeconds, consumeGold, awayCredit, folioAction, layerAction, layerWallet, pitchSale,")
edit('automation.js','  function supported(m) {', '''  const pitchSetting = () => ({version:1,enabled:false,...saved()?.pitch});
  let pitchElapsed = 0, pitchLast = null, pitchNotice = '';
  const resetPitchClock = () => { pitchElapsed = 0; pitchLast = null; };
  function pitchUnlocked() {
    if (!api.pitchEnabled() || !supported(saved()) || !api.state().intro.done || !pitchSetting().manual?.complete) return false;
    try { return Layers.current(api.state()).count >= 2; } catch { return false; }
  }
  function pitchReady() {
    return pitchUnlocked() && pitchSetting().enabled && !pending && !suspended.has('pitch') && !api.pitchStatus().pending &&
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
    const cfg = safe ? pitchSetting() : {}, on = cfg.enabled && !suspended.has('pitch'), status = api.pitchStatus();
    const text = v => String(v).replace(/[&<>"']/g,c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const progress = cfg.manual?.complete ? 'Manual commission and sale saved.' : api.trackedPitch() ? 'Commission saved. Bank its words and sell that exact title during visible play.' : 'Commission a new title by hand, then sell it during visible play. Older sales do not count.';
    return `<section class="o-card lg06b-pitch"><h3>Auto-pitch</h3><p>Free. Requires Imprint 2 and introduction complete. ${progress}</p><p>Every 60 active game seconds, commission the lowest reachable band with demand at least x1.00, then offer order. Respects production sets, manual titles and Folio. Eight open commissions maximum. No offline actions or automatic repitch.</p><button data-act="automation:pitch-toggle" aria-pressed="${!!on}" ${!safe || !on && (pending || !pitchUnlocked()) ? 'disabled' : ''}>Auto-pitch: ${on ? 'On' : 'Off'}</button><p role="status">${!safe ? 'Unsupported pitch data preserved. Actions disabled.' : suspended.has('pitch') ? 'Off locally. Retry to save Off.' : text(status.pending ? status.notice : pitchNotice || status.notice || (on ? 'Waiting for the next 60-second attempt.' : 'Off'))}</p>${status.pending ? '<button data-act="automation:pitch-retry">Retry commission</button>' : ''}</section>`;
  }
  function supported(m) {''')
edit('automation.js',"m.version === 1 && (!api.gardenEnabled() || validGarden(m.garden)) &&", "m.version === 1 && (!api.gardenEnabled() || validGarden(m.garden)) && (!api.pitchEnabled() || api.validPitch(m.pitch)) &&")
edit('automation.js',"function reset() { resetGardenClock();", "function reset() { resetPitchClock(); pitchNotice = ''; resetGardenClock();")
edit('automation.js',"if (p.garden) resetGardenClock(); else if (p.net)", "if (p.pitch) resetPitchClock(); else if (p.garden) resetGardenClock(); else if (p.net)")
edit('automation.js',"const gardenOff = suspended.has('garden') && !p.garden;", "const gardenOff = suspended.has('garden') && !p.garden, pitchOff = suspended.has('pitch') && !p.pitch;")
edit('automation.js',"if (gardenOff) suspended.add('garden');", "if (gardenOff) suspended.add('garden');\n      if (pitchOff) suspended.add('pitch');")
edit('automation.js',"    if (api && gardenElapsed", "    if (api && pitchElapsed && !pitchReady()) resetPitchClock();\n    if (api && gardenElapsed")
edit('automation.js',"${gardenCard(safe)}", "${pitchCard(safe)}${gardenCard(safe)}")
edit('automation.js',"IMI.onScreen(() => { cancelNet(); resetGardenClock(); });", "IMI.onScreen(() => { cancelNet(); resetGardenClock(); resetPitchClock(); });")
edit('automation.js',"reset, validConfig:supported, pendingCrop", "reset, pitchReady, validConfig:supported, pendingCrop")
edit('automation.js',"actions:{ 'garden-toggle':", "actions:{ 'pitch-toggle':editPitch, 'pitch-retry':() => { resetPitchClock(); api.retryCommission(); }, 'garden-toggle':")
edit('automation.js',"      serviceNet({replay});", """      serviceNet({replay});
      const pitchActive = !replay && pitchReady(), pitchNow = api.clock.productionNow();
      if (!pitchActive) resetPitchClock();
      else {
        if (pitchLast !== null && pitchNow - pitchLast > gameSeconds * 1000 + 250) resetPitchClock();
        pitchLast = pitchNow;
        if (Number.isFinite(gameSeconds) && gameSeconds > 0) pitchElapsed = Math.min(60,pitchElapsed + gameSeconds);
      }""")
edit('automation.js',"gardenActive && gardenElapsed + 1e-9 >= 60];", "gardenActive && gardenElapsed + 1e-9 >= 60, pitchActive && pitchElapsed + 1e-9 >= 60];")
edit('automation.js',"      if (service === 4) {", "      if (service === 5) {\n        pitchElapsed = 0; const result = api.pitchAttempt(); pitchNotice = result?.ok ? 'Commission saved.' : result?.error || 'Waiting for a qualifying offer.';\n      }\n      if (service === 4) {")
edit('automation.js',"cancelNet(); resetGardenClock(); });", "cancelNet(); resetGardenClock(); resetPitchClock(); });")
# New intent recognition is independent of the unchanged Imprint/Vault branches.
edit('vault-save-gate.js',"let blocked = false, resume = false, imprint = false;", "let blocked = false, resume = false, imprint = false, pitch = false;")
edit('vault-save-gate.js',"      if (object(state) && own(state, 'prem')) {", """      const cfg = object(state) && state.meta?.automation?.pitch;
      if (object(cfg) && own(cfg,'sale') && cfg.sale !== null) {
        pitch = true;
        const flags = new URLSearchParams(location.search), t = cfg.sale;
        const known = cfg.version === 1 && object(t) && t.version === 1 && typeof t.id === 'string' && t.id.startsWith('pitch-sale:') &&
          object(t.recipe) && typeof t.recipe.id === 'string' && object(cfg.manual) && object(cfg.manual.pending);
        resume = known && ['lg03','lg01a','lg05folio','lg05layers'].some(flag => flags.get(flag) !== '1');
        blocked = blocked || !known || resume;
      }
      if (object(state) && own(state, 'prem')) {""")
edit('vault-save-gate.js',"title.textContent = imprint ?", "title.textContent = pitch ? 'Pitch sale recovery' : imprint ?")
edit('vault-save-gate.js',"message.textContent = imprint ?", "message.textContent = pitch ? (resume ? 'This save has an unfinished pitch sale. Resume with its recovery flags to finish safely.' : 'This unfinished pitch sale cannot be opened safely. Your saved data has not been changed.') : imprint ?")
edit('vault-save-gate.js',"scope.textContent = imprint ?", "scope.textContent = pitch ? 'Recovery stays on this local test origin. Other progression waits until the tracked sale is settled.' : imprint ?")
edit('vault-save-gate.js',"for (const flag of imprint ?", "for (const flag of pitch ? ['lg03','lg01a','lg05folio','lg05layers'] : imprint ?")
p=Path('automation.css'); b=p.read_bytes(); p.write_bytes(b+b'\n.lg06b-pitch p { line-height: 1.5; overflow-wrap: anywhere; }\n.lg06b-pitch button { min-height: 40px; max-width: 100%; }\n')
