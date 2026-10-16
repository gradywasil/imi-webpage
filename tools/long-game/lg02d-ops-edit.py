from pathlib import Path
exec(Path('tools/long-game/lg02d-edit.py').read_text().split("edit('vault.js'")[0])
edit('ops.js',[("  const productionNow = () => performance.now() + productionExtra;", """  let lampLifetime = null;
  const productiveMono = () => lampLifetime?.mono ?? performance.now();
  const productionNow = () => productiveMono() + productionExtra;
  function lampHold(lease) {
    if (lampLifetime) return;
    lampLifetime = lease;
    lampLiveBuffs = Object.keys(buffs).filter(k => buffs[k] > lease.mono);
    goldObject?.hold(lease); IMI.pickups?.vaultHold(lease);
  }
  let lampLiveBuffs = [];
  function lampRelease(lease) {
    if (lampLifetime !== lease) return;
    const elapsed = performance.now() - lease.mono;
    for (const k of lampLiveBuffs) if (buffs[k]) buffs[k] += elapsed;
    productionExtra -= elapsed; lampLifetime = null; lampLiveBuffs = [];
    last = performance.now();
    goldObject?.resume(lease); IMI.pickups?.vaultResume(lease);
  }
  const lampPending = () => !!(window.VaultPlay?.pending(S) || writer?.localDisposition());"""),("  const buffOn = k => performance.now() < buffs[k];","  const buffOn = k => productiveMono() < buffs[k];"),("  const anyBuff = () => Object.keys(buffs).some(k => performance.now() < buffs[k]);","  const anyBuff = () => Object.keys(buffs).some(k => productiveMono() < buffs[k]);"),("  const awayCap = () => (S.lamp ? LAMP[S.lamp - 1].cap : 2) * 3600;","  const awayCap = () => Math.max((S.lamp ? LAMP[S.lamp - 1].cap : 2) * 3600, window.VaultPlay?.enabled() ? VaultPlay.cap(S) : 0);"),("  function printingQuote(source = S) {", "  function printingQuote(source = S) {\n    if (window.VaultPlay?.pending(source) || writer?.localDisposition()) throw Error('Finish the saved purchase or recovery before Printing.');"),("  function doPrint(chId) {","  function doPrint(chId) {\n    if (lampPending()) return;"),("  function vaultBoundary(id) {", """  function lampCommit(command, validate) {
    if (!writer?.owns() || !writer.transacting() || !writer.boundaryProgressing() || !window.VaultPlay?.enabled() || S.prem.vault?.transition || S.rewards.awayCheckpoint) return {ok:false,error:'Lamp commit requires settled owned work'};
    const candidate = VaultPlay.project(S,command,Date.now());
    validate(candidate);
    const result = Economy.saveStateAcknowledged(candidate);
    if (result.ok) {S.prem=candidate.prem;mark();}
    return result;
  }
  function vaultBoundary(id) {"""),("if (!boundaryJob) { const end=Date.now(); boundaryJob = {id, end, hidden:document.hidden, visible:null, displayEnd:end}; }", "if (!boundaryJob) { const end=lampLifetime?.wall ?? Date.now(); boundaryJob = {id, end, hidden:!started || document.hidden, visible:null, displayEnd:end}; }"),("job.visible ??= {phase:0, desk:0, paw:0, presses:0, debited:false};", "job.visible ??= {phase:0, desk:0, paw:0, presses:0, debited:false, ...(lampLifetime ? {now:lampLifetime.mono} : {})};"),("      candidate.prem.vault.transition = p.transition;", "      if (window.VaultPlay?.enabled()) candidate.prem.vault.freeLamp ??= {version:1,rule:1};\n      candidate.prem.vault.transition = p.transition;"),("      vaultBoundary, vaultCommit,", "      vaultBoundary, vaultCommit, lampCommit, lampHold, lampRelease,\n      vaultContext:() => ({cap:awayCap(),eff:awayEff(),intro:!introActive(),lamp:S.lamp}),\n      lampSaved:command => extensionEvent('lampSaved',command),"),("  function startGame() {\n", "  function startGame() {\n"),("  if (started || !progressing()) return false;", "  if (writer && !started && window.VaultPlay?.enabled() && !writer.lampStartup()) return false;\n  if (started || !progressing()) return false;"),("  for (const [id, hooks] of window.__OPS_EXTENSIONS || []) extensionAPI.register(id, hooks);", "  for (const [id, hooks] of window.__OPS_EXTENSIONS || []) extensionAPI.register(id, hooks);\n  window.VaultPlay?.install(extensionAPI);"),("    reset: () => { if (imprintChallenge()", "    reset: () => { if (resetBlocked()) { IMI.say(resetExplanation); return; } if (imprintChallenge()"),("  const ACTIONS = {", """  const resetExplanation = 'Reset progress is unavailable while this save has Diamond Bananas, reward history or Vault items. Second Printing remains available when no purchase or save recovery is pending.';
  const resetBlocked = () => !!(S.prem.earned || S.prem.bought || S.prem.earnedTotal || S.prem.boughtTotal || S.prem.vault || Object.keys(S.prem.credits || {}).length || Object.keys(S.rewards.claims || {}).length || Object.keys(S.rewards.storedGold?.tokens || {}).length || S.rewards.walletHead || S.rewards.awayCheckpoint);
  const ACTIONS = {"""),("IMI.pickups?.clear(); goldEnd?.(); ticker.anim?.cancel(); boundaryJob = null; boundaryProposal = null;", "IMI.pickups?.clear(true); goldObject?.dispose(); lampLifetime=null; ticker.anim?.cancel(); boundaryJob = null; boundaryProposal = null;"),("const now = performance.now(), on = Object.keys(buffs).filter(buffOn), floor", "const now = productiveMono(), on = Object.keys(buffs).filter(buffOn), floor")])
# Native gold callbacks belong to one object generation; a paused callback cannot end it.
edit('ops.js',[("  let goldEnd = null, goldUntil = 0;", "  let goldEnd = null, goldUntil = 0, goldObject = null;"),("    let netItem;\n    const end = () => { if (done) return;", "    let netItem, heldLease = null, generation = 0;\n    const end = () => { if (done || heldLease) return;"),("el.remove(); goldEnd = null; goldUntil = 0;", "el.remove(); goldEnd = null; goldUntil = 0; goldObject = null;"),("    goldEnd = end;", """    const expire = () => {const token=++generation;return () => {if(token===generation&&!heldLease&&writer?.owns()!==false)end();};};
    goldObject = {
      hold(lease) {if(done||heldLease)return;heldLease=lease;generation++;clearTimeout(expiry);anim?.pause();if(anim)anim.onfinish=null;},
      resume(lease) {if(heldLease!==lease)return;heldLease=null;if(!el.isConnected){end();return;}if(anim){anim.onfinish=expire();anim.play();}else expiry=setTimeout(expire(),Math.max(0,goldUntil-productionNow())/speed());},
      dispose() {heldLease=null;generation++;end();}
    };
    goldEnd = end;"""),("expiry = setTimeout(end, 9000);", "expiry = setTimeout(expire(), 9000);"),("anim.onfinish = end;", "anim.onfinish = expire();"),("trail = setInterval(() => { const r", "trail = setInterval(() => { if(heldLease||done)return; const r"),("try { anim.playbackRate = .4; }", "try { if(!heldLease)anim.playbackRate = .4; }"),("try { anim.playbackRate = 1; }", "try { if(!heldLease)anim.playbackRate = 1; }"),("      if (done) return;\n      const r = el.getBoundingClientRect()", "      if (done || heldLease || productionNow()>=goldUntil) return;\n      const r = el.getBoundingClientRect()"),("valid:() => !rotten && !done && productionNow() < goldUntil", "valid:() => !rotten && !done && !heldLease && productionNow() < goldUntil")])
edit('pickups.js',[("  let active = null, next = now() + 20000;", "  let active = null, next = now() + 20000, held = null, generation = 0;"),("  const clear = () => { if (active)", "  const clear = force => { if (held && force !== true) return; generation++; if (active)"),("  function expire(item) {\n    if (active !== item) return;", "  function expire(item) {\n    if (active !== item || held || item.generation !== generation) return;"),("  function lifetime(item) {\n    if (active !== item) return;", "  function lifetime(item) {\n    if (active !== item || held || item.generation !== generation) return;"),("    if (active || !eligible()) return false;", "    if (active || held || !eligible()) return false;"),("anim: null, scaled: false }; active = item;", "anim: null, scaled: false, generation:++generation }; active = item;"),("      if (active !== item) return;", "      if (active !== item || held || item.generation !== generation) return;"),("    if (active && (active.scaled", "    if (held) return;\n    if (active && (active.scaled"),("  IMI.pickups = { spawn, clear, active: () => !!active };", """  IMI.pickups = { spawn, clear, active: () => !!active,
    vaultHold(lease) {if(held)return;held=lease;if(active){clearTimeout(active.timer);active.anim?.pause();}},
    vaultResume(lease) {if(held!==lease)return;held=null;if(!active)return;if(!active.el.isConnected){clear(true);return;}active.anim?.play();lifetime(active);}
  };""")])
