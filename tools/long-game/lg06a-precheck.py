exec(open('tools/long-game/lg06a-edit.py',encoding='utf-8-sig').read().split("edit('ops.js'")[0])
edit('automation.js',"letter:'E', desk:'bamboo'", "letter:'E', desk:'mint'")
edit('automation.js',"m.version === 1 && validGarden(m.garden) &&", "m.version === 1 && (!api.gardenEnabled() || validGarden(m.garden)) &&")
edit('automation.js',"  function gardenReady() {\n    return gardenUnlocked() && gardenSetting().enabled && !gardenPending", "  function gardenReady(request = null) {\n    return gardenUnlocked() && gardenSetting().enabled && (!gardenPending || gardenPending === request)")
# Suspended holds can prevent Ops tick entirely, so observe their existing DOM presentation.
edit('automation.js',"  function observeNet() {\n    if (!netItems", "  function observeNet() {\n    if (api && gardenElapsed && (!IMI.ops.progression.running() || Rewards.held() || Rewards.localDisposition())) resetGardenClock();\n    if (!netItems")
# Guard empty function when rewards disabled.
edit('automation.js',"!IMI.ops.progression.running() || Rewards.held() || Rewards.localDisposition()", "!IMI.ops.progression?.running() || window.Rewards?.held?.() || window.Rewards?.localDisposition?.()")
edit('ops.js',"const refuse = error => ({ok:false, retryable:false, error});", "const refuse = error => { layerChoices.delete('garden'); return {ok:false, retryable:false, error}; };")
edit('ops.js',"!helper.gardenReady())", "!helper.gardenReady(p))")
edit('ops.js',"    const candidate = {...S, garden:", "    const affected = new Set(p.action === 'harvest' ? p.crops.map(b => b.desk) : []);\n    const candidate = {...S, garden:")
edit('ops.js',"desks:S.desks.map(d => ({...d, letters:{...d.letters}, tray:d.tray.slice()}))", "desks:S.desks.map((d,i) => affected.has(i) ? {...d, letters:{...d.letters}, tray:d.tray.slice()} : d)")
edit('ops.js',"      S.desks.forEach((d,i) => { d.letters = candidate.desks[i].letters; d.tray = candidate.desks[i].tray; });", "      for (const i of affected) { S.desks[i].letters = candidate.desks[i].letters; S.desks[i].tray = candidate.desks[i].tray; }")
# Narrow reconciliation is lazy, only existing stale evidence is saved; absent/default state is never initialized.
edit('ops.js',"      commitGarden,\n      gardenAttempt", """      commitGarden,
      reconcileGarden() {
        const helper = extensions.get('automation');
        if (!gardenPrototype() || !writer?.owns() || !extensionAPI.automationAllowed() || !helper.validConfig(S.meta.automation) ||
            !S.meta.automation?.garden?.manual?.pending || helper.pendingCrop(S)) return;
        const candidate = {...S, meta:{...S.meta}};
        helper.clearGardenPending(candidate);
        if (writer.guard(candidate) && Economy.saveStateAcknowledged(candidate).ok) { S.meta = candidate.meta; mark(); }
      },
      gardenAttempt""")
edit('automation.js',"reset, validConfig:supported, gardenEvidence", "reset, validConfig:supported, pendingCrop, gardenEvidence")
edit('automation.js',"      serviceNet({replay});", "      serviceNet({replay});\n      if (!replay && !document.hidden && IMI.screen() === 'game' && !gardenPending && !pending) api.reconcileGarden();")
