from pathlib import Path
p=Path('ops.js'); raw=p.read_bytes(); nl='\r\n' if b'\r\n' in raw else '\n'; s=raw.decode().replace('\r\n','\n')
def rep(a,b):
 global s
 assert a in s,a[:100]
 s=s.replace(a,b,1)
rep("{ id: 'baremetal',", "{ id: 'handplanted', name: 'Hand-planted', stars: 0, goalN: 6, helper: 'garden', imprint: true, desc: 'Automatic planting, harvesting and replanting are disabled. Garden by hand. Sell 6 progression titles.', perk: 'Auto-garden attempts every 45 active game seconds after its usual unlock.' },\n    { id: 'onebrief', name: 'One brief', stars: 0, goalN: 8, helper: 'pitch', imprint: true, desc: 'Clear inherited commissions down to one unsold title first; clearance sales do not count. Then sell 8 more progression titles. Commission only with no unsold pitches. High-band titles may need desks reopened; there is no time limit.', perk: 'Auto-pitch attempts every 45 active game seconds after its usual unlock.' },\n    { id: 'paperonly', name: 'Paper only', stars: 0, goalN: 8, helper: 'media', imprint: true, desc: 'No media releases of any quantity. Existing passive income remains. Sell 8 progression titles.', perk: 'Auto-media attempts every 45 active game seconds after its usual unlock.' },\n    { id: 'fixedcast', name: 'Fixed cast', stars: 0, goalN: 8, helper: 'muse', imprint: true, desc: 'Sell 3 progression titles, then seat an invited Muse before sale 4. That sale locks every seat through sale 8, including newly opened seats. Invitations keep their ordinary cost.', perk: 'Muse director attempts every 45 active game seconds after its usual unlock.' },\n    { id: 'baremetal',")
rep("const challengeSelectable = c => !c.helper || challengePrototype && S.printing >= 4 && S.intro.done && !!writer?.owns();", """const challengeSelectable = c => c.imprint ? gardenPrototype() && layers.identity(S) >= 1 && S.printing >= 4 && S.intro.done && !!writer?.owns() :
    !c.helper || challengePrototype && S.printing >= 4 && S.intro.done && !!writer?.owns();
  const imprintChallenge = (s = S) => !!chDef(s.challenge?.id)?.imprint;
  const challengeCount = s => Object.keys(s.written).filter(id => RBY[id] && !RBY[id].kid && !RBY[id].lib).length;
  const challengeBacklog = s => RECIPES.filter(r => r.gen && !s.written[r.id]).length;
  function challengeRun(s = S) {
    const r = s.challenge?.imprintRun;
    if (!r || r.version !== 1 || r.printing !== s.printing || r.imprint !== layers.identity(s)) return null;
    if (s.challenge.id === 'onebrief' && (!['clearance','goal'].includes(r.phase) ||
        !Number.isSafeInteger(r.baseline) || r.baseline < 0 || r.baseline > challengeCount(s))) return null;
    if (s.challenge.id === 'fixedcast' && r.seats != null && (!Array.isArray(r.seats) || r.seats.length !== 3 ||
        !museSame(r.seats,s.muses.seated) || new Set(r.seats.filter(Boolean)).size !== r.seats.filter(Boolean).length ||
        !r.seats.some((id,i) => i < 1 && MUSES.some(m => m.id === id) && s.muses.owned[id]) ||
        r.seats.some(id => id !== null && (!MUSES.some(m => m.id === id) || !s.muses.owned[id])))) return null;
    return r;
  }
  const challengeSales = () => !chal('onebrief') ? soldCount() : challengeRun()?.phase === 'goal' ? Math.max(0,soldCount() - challengeRun().baseline) : 0;
  const challengeCommissionAllowed = () => !chal('onebrief') || challengeRun()?.phase === 'goal' && pitchActive() === 0;
  const challengeSeatsLocked = () => chal('fixedcast') && (!challengeRun() || challengeRun().seats != null || soldCount() >= 4);
  function challengeSaleAllowed(r, s = S) {
    if (!imprintChallenge(s) || r.kid || r.lib) return true;
    const run = challengeRun(s);
    if (!run) return false;
    if (s.challenge.id !== 'fixedcast') return true;
    const n = challengeCount(s);
    return run.seats != null || n < 3 || n === 3 && !musePending && !layerChoices.size &&
      s.muses.seated.some((id,i) => i < 1 && MUSES.some(m => m.id === id) && s.muses.owned[id]);
  }
  function challengeBeforeSale(s,r) {
    if (s.challenge?.id === 'fixedcast' && !r.kid && !r.lib && challengeCount(s) === 3 && challengeRun(s)?.seats == null)
      s.challenge = {...s.challenge,imprintRun:{...challengeRun(s),seats:s.muses.seated.slice()}};
  }
  function challengeAfterSale(s) {
    if (s.challenge?.id === 'onebrief' && challengeRun(s)?.phase === 'clearance' && challengeBacklog(s) <= 1)
      s.challenge = {...s.challenge,imprintRun:{...challengeRun(s),phase:'goal',baseline:challengeCount(s)}};
  }
  const challengeSettled = () => !layerChoices.size && !commissionPending && !musePending && !extensions.get('automation')?.pendingGarden() &&
    !extensions.get('automation')?.pendingChoice() && !S.meta.automation?.pitch?.sale && !S.meta.automation?.media?.pending &&
    !S.rewards.awayCheckpoint && !!writer?.owns() && !writer.held() && !writer.localDisposition() && writer.guard(S);""")
rep("const C = chDef(S.challenge.id), left = C.minutes", "const C = chDef(S.challenge.id);\n    if (C.imprint && !challengeRun()) return 'Run unavailable. Abandon when saves settle.';\n    if (chal('onebrief') && challengeRun().phase === 'clearance') return `Clearance: ${pitchActive()} unsold pitches; reach 1`;\n    if (chal('fixedcast')) return `${soldCount()}/${C.goalN} · ${challengeSeatsLocked() ? 'Cast locked' : soldCount() >= 3 ? 'Seat an invited Muse before sale 4' : 'Choose your cast before sale 4'}`;\n    const left = C.minutes")
rep('return `${soldCount()}/${C.goalN}${left', 'return `${challengeSales()}/${C.goalN}${left')
rep('function endChallenge(kind) {','function endChallenge(kind, acknowledged = false) {')
rep("if (kind === 'done' && C.helper) {", "if (C.imprint && !acknowledged) {\n      if (!challengeSettled()) return;\n      if (kind === 'done') return writer.imprintChallengeClear(C.id);\n    }\n    if (kind === 'done' && C.helper && !C.imprint) {")
rep("const first = !S.chDone[C.id]; S.chDone[C.id] = true;", "const first = !S.chDone[C.id]; S.chDone = {...S.chDone,[C.id]:true};")
rep("if (soldCount() >= C.goalN) endChallenge('done');", "if (!C || C.imprint && !challengeRun()) return;\n    if (challengeSales() >= C.goalN) endChallenge('done');")
rep('const constraint = chId && chDef(chId);', "const constraint = chId && chDef(chId);\n    if ((constraint?.imprint || imprintChallenge()) && (!challengeSettled() || imprintChallenge() && !challengeRun())) return;")
rep('f.run = { earned: 0 }; f.challenge = chId ? { id: chId, start: Date.now() } : null;', """f.run = { earned: 0 }; f.challenge = chId ? { id: chId, start: Date.now() } : null;
    if (constraint?.imprint) f.challenge.imprintRun = {version:1,printing:f.printing,imprint:layers.identity(f),
      ...(chId === 'onebrief' ? {phase:challengeBacklog(f) > 1 ? 'clearance' : 'goal',baseline:0} : {}),
      ...(chId === 'fixedcast' ? {seats:null} : {})};""")
# Shared restrictions, including fallback paths.
rep("if (!pitchPrototype() || !writer?.owns() || !extensionAPI.automationAllowed()", "if (!challengeCommissionAllowed() || !pitchPrototype() || !writer?.owns() || !extensionAPI.automationAllowed()")
rep("if (!pitchPrototype() || !validPitch(p) || !t", "if (!challengeSaleAllowed(RBY[t?.recipe?.id] || {}) || !pitchPrototype() || !validPitch(p) || !t")
rep("if (!trackedPitch() || cfg.sale ||", "if (!challengeSaleAllowed(r) || !trackedPitch() || cfg.sale ||")
rep("candidate = {...S,meta:{...S.meta,automation:{...S.meta.automation,pitch:{...cfg,sale:t}}}};", "candidate = {...S,meta:{...S.meta,automation:{...S.meta.automation,pitch:{...cfg,sale:t}}}};\n        challengeBeforeSale(candidate,r);")
rep("candidate.written[t.recipe.id] = true; candidate.stats.lump", "candidate.written[t.recipe.id] = true; challengeAfterSale(candidate); candidate.stats.lump")
rep("if (request.action === 'prepare') S.meta = candidate.meta;", "if (request.action === 'prepare') { S.meta = candidate.meta; S.challenge = candidate.challenge; }")
rep("['bank','written','stats','run','meta','rewards','focus','autoFocus']", "['bank','written','stats','run','meta','rewards','focus','autoFocus','challenge']")
rep("if (!mediaPrototype() || !writer?.owns() || !extensionAPI.automationAllowed()", "if (chal('paperonly') || !mediaPrototype() || !writer?.owns() || !extensionAPI.automationAllowed()")
rep("if (!mediaPrototype() || !validMedia(S.meta.automation?.media)", "if (chal('paperonly') || !mediaPrototype() || !validMedia(S.meta.automation?.media)")
rep("function releaseDiv(id) {", "function releaseDiv(id) {\n    if (chal('paperonly')) return {ok:false,error:'Media releases are blocked by Paper only.'};")
rep("if (!p || !gardenPrototype()", "if (challengeSeatsLocked() || !p || !gardenPrototype()")
rep("if (!gardenPrototype() || !writer?.owns() || !extensionAPI.automationAllowed())", "if (chal('handplanted') && p.origin === 'auto' || !gardenPrototype() || !writer?.owns() || !extensionAPI.automationAllowed())")
rep("function plant(i, ch, desk = S.sel, origin = 'manual') {", "function plant(i, ch, desk = S.sel, origin = 'manual') {\n    if (chal('handplanted') && origin === 'auto') return {ok:false,retryable:false,error:'Garden by hand during Hand-planted.'};")
rep("function harvest(i, origin = 'manual') {", "function harvest(i, origin = 'manual') {\n    if (chal('handplanted') && origin === 'auto') return 0;")
rep("if (!r || !canWrite(r) || chal('patientpress')", "if (!r || !canWrite(r) || !challengeSaleAllowed(r) || chal('patientpress')")
rep('if (fromEl) gatherWords(fromEl);', 'challengeBeforeSale(S,r);\n    if (fromEl) gatherWords(fromEl);')
rep('dropCaches(); S.written[id] = true; introProgress();', 'dropCaches(); S.written[id] = true; challengeAfterSale(S); introProgress();')
rep("const pubSellable = () => readyList().filter(r =>", "const pubSellable = () => readyList().filter(r => challengeSaleAllowed(r) &&")
# Compact check immediately after each new-challenge sale (bulk loops too).
rep("IMI.emit('sold', { id, pay });", "IMI.emit('sold', { id, pay });\n    if (imprintChallenge()) checkChallenge();")
rep("if (pitchPrototype()) return commission(+el.dataset.i,'manual',el);", "if (!challengeCommissionAllowed()) return;\n      if (pitchPrototype()) return commission(+el.dataset.i,'manual',el);")
rep("museseat: el => { const id", "museseat: el => { if (challengeSeatsLocked()) return; const id")
rep("museout: el => { if (gardenPrototype())", "museout: el => { if (challengeSeatsLocked()) return; if (gardenPrototype())")
# Narrow clear command called only by Rewards, same detached preparation for first/replay.
rep('state: () => S, save, mark, morph, setTab,', """state: () => S, save, mark, morph, setTab,
    challengeCommissionAllowed, challengeSeatsLocked,
    imprintChallengeCommit(request) {
      const C = chDef(S.challenge?.id);
      if (!writer?.owns() || !writer.transacting() || !C?.imprint || request.id !== C.id || !challengeRun() ||
          request.printing !== S.printing || request.imprint !== layers.identity(S) || request.start !== S.challenge.start ||
          challengeSales() < C.goalN || layerChoices.size || musePending || commissionPending ||
          S.meta.automation?.pitch?.sale || S.meta.automation?.media?.pending || S.rewards.awayCheckpoint)
        return {ok:false,refused:true,error:'Challenge changed or a save still needs to settle.'};
      const candidate = {...S,challenge:null,chDone:{...S.chDone,[C.id]:true},rewards:pitchCopy(S.rewards)};
      const id = `challenge:${C.id}:first`;
      if (!S.chDone[C.id] && !candidate.rewards.claims[id]) candidate.rewards.claims[id] = {status:'prepared',origin:'new',descriptor:pitchCopy(request.descriptor)};
      const result = Economy.saveStateAcknowledged(candidate);
      if (result.ok) { S.rewards = candidate.rewards; endChallenge('done',true); }
      return result;
    },""")
# Minimal copy next to existing status.
rep("const act = pitchActive(), full = act >= PITCH_MAX", "const act = pitchActive(), full = act >= PITCH_MAX || !challengeCommissionAllowed()")
rep("full || bananas.get() < plan.cost ? 'disabled'", "chal('paperonly') || full || bananas.get() < plan.cost ? 'disabled'")
rep('<h3 class="o-h">Seated (${M.seated', "${chal('fixedcast') ? `<p role=\"status\">${chProgress()}</p>` : ''}\n      <h3 class=\"o-h\">Seated (${M.seated")
rep('data-act="museout" data-slot="${k}">', 'data-act="museout" data-slot="${k}" ${challengeSeatsLocked() ? \'disabled\' : \'\'}>')
rep('data-act="museseat" data-id="${mu.id}" data-slot="${k}">', 'data-act="museseat" data-id="${mu.id}" data-slot="${k}" ${challengeSeatsLocked() ? \'disabled\' : \'\'}>')
rep('Four more constraints unlock at Printing 5 after the introduction, with reward saving enabled.', 'More constraints unlock at Printing 5 after the introduction, with reward saving enabled. The four Imprint challenges also require a founded Imprint.')
p.write_bytes(s.replace('\n',nl).encode())
# Rewards: only four fixed IDs and one fixed retry command.
p=Path('rewards.js'); raw=p.read_bytes(); nl='\r\n' if b'\r\n' in raw else '\n'; s=raw.decode().replace('\r\n','\n')
rep("'challenge:smallcrew:first':{kind:'L', tier:0},", "'challenge:handplanted:first':{kind:'L', tier:0}, 'challenge:onebrief:first':{kind:'L', tier:0},\n    'challenge:paperonly:first':{kind:'L', tier:0}, 'challenge:fixedcast:first':{kind:'L', tier:0},\n    'challenge:smallcrew:first':{kind:'L', tier:0},")
rep('function deliver(id, claim) {', """let imprintChallengeWaiting = null;
  function finishImprintChallenge() {
    const result = transaction(() => api.imprintChallengeCommit(imprintChallengeWaiting));
    if (!result.ok) return hold('Challenge clear waiting to save. Retry keeps your progress. ' + result.error);
    imprintChallengeWaiting = null;
    return true;
  }
  function imprintChallengeClear(id) {
    if (!['handplanted','onebrief','paperonly','fixedcast'].includes(id) || !owns() || busy || fault || volatile || transactionRetry ||
        localUnresolved() || !window.IMI.ops.progression.running() || !guard(state())) return false;
    const c = state().challenge;
    if (c?.id !== id) return false;
    imprintChallengeWaiting = {id,printing:state().printing,imprint:window.Layers.identity(state()),start:c.start,
      descriptor:state().chDone[id] || state().rewards.claims[`challenge:${id}:first`] ? null : descriptor(`challenge:${id}:first`)};
    return finishImprintChallenge();
  }
  function deliver(id, claim) {""")
rep("if (state().meta.automation?.media?.pending || mediaWaiting) {", "if (imprintChallengeWaiting && !finishImprintChallenge()) return false;\n      if (state().meta.automation?.media?.pending || mediaWaiting) {")
rep('guard, retry, activate, incomeSeconds,', 'guard, retry, imprintChallengeClear, activate, incomeSeconds,')
p.write_bytes(s.replace('\n',nl).encode())
# Automation cadence derives only from retained completions. Higher/unknown metadata remains untouched.
p=Path('automation.js'); raw=p.read_bytes(); nl='\r\n' if b'\r\n' in raw else '\n'; s=raw.decode().replace('\r\n','\n')
rep("const gardenSetting = () =>", "const earnedInterval = id => api.state().chDone[{garden:'handplanted',pitch:'onebrief',media:'paperonly',muse:'fixedcast'}[id]] ? 45 : 60;\n  const gardenSetting = () =>")
for name in ['garden','pitch','media','muse']:
 s=s.replace(f'Math.min(60,{name}Elapsed + gameSeconds)', f"Math.min(earnedInterval('{name}'),{name}Elapsed + gameSeconds)")
 s=s.replace(f'{name}Elapsed + 1e-9 >= 60',f"{name}Elapsed + 1e-9 >= earnedInterval('{name}')")
 # card scope
 a=s.index(f'function {name}Card('); b=s.index('\n  }',a)
 card=s[a:b].replace('60 active game seconds',f"${{earnedInterval('{name}')}} active game seconds").replace('next 60-second',f"next ${{earnedInterval('{name}')}}-second")
 if 'next ${' in card:
  card=card.replace("'Waiting for the next ${",'`Waiting for the next ${').replace("attempt.'",'attempt.`').replace("Folio.'",'Folio.`')
 # visible pause, no clocks bank while restricted
 marker="${!safe ?"
 restriction={'garden':"api.state().challenge?.id === 'handplanted'",'pitch':'!api.challengeCommissionAllowed()', 'media':"api.state().challenge?.id === 'paperonly'",'muse':'api.challengeSeatsLocked()'}[name]
 card=card.replace(marker, f"${{{restriction} ? 'Paused by the current challenge.' : !safe ?")
 s=s[:a]+card+s[b:]
rep('return gardenUnlocked() &&', "return api.state().challenge?.id !== 'handplanted' && gardenUnlocked() &&")
rep('return pitchUnlocked() &&', 'return api.challengeCommissionAllowed() && pitchUnlocked() &&')
rep('return mediaUnlocked() &&', "return api.state().challenge?.id !== 'paperonly' && mediaUnlocked() &&")
rep('return museUnlocked() &&', 'return !api.challengeSeatsLocked() && museUnlocked() &&')
rep('reset, validMuse,', 'reset, pendingGarden:() => !!gardenPending, pendingChoice:() => !!pending, earnedInterval, validMuse,')
p.write_bytes(s.replace('\n',nl).encode())
p=Path('sw.js'); p.write_bytes(p.read_bytes().replace(b'imi-v57',b'imi-v58'))
