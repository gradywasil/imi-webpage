from pathlib import Path
p=Path('ops.js');s=p.read_text(encoding='utf-8');s=s.replace('      estateRoom:source => Estate.project(source, fresh(), true)','''      estateCrewValid:(crew,source) => crew.length === (source.legacy.ups.crew ? 2 : 0) && crew.every(t =>
        typeof t.name === 'string' && LOOKS.some(l => l.id === t.look && l.trait === t.trait) &&
        Number.isSafeInteger(t.talent) && t.talent >= 0 && t.talent <= 12 && t.coach === 0 && t.rerolls === 0 && t.xp === 0 && t.lv === 1 && t.hat === 0 && typeof t.shiny === 'boolean'),
      estateRoom:source => Estate.project(source, fresh(), true)''');p.write_text(s,encoding='utf-8',newline='\n')
p=Path('rewards.js');s=p.read_text(encoding='utf-8');s=s.replace("'layer:imprint:first':{kind:'L', tier:0},","'layer:imprint:first':{kind:'L', tier:0},\n    'layer:estate:first':{kind:'L', tier:0},")
s=s.replace("id === 'layer:imprint:first' ?", "id === 'layer:estate:first' ? s.meta.estate?.version === 1 && (s.meta.estate.count || 0) > 0 : id === 'layer:imprint:first' ?")
s=s.replace('!candidate.meta.layers?.pending &&','!candidate.meta.layers?.pending && !candidate.meta.estate?.pending &&')
pos=s.index('  let imprintChallengeWaiting = null;')
s=s[:pos]+'''  // Estate has fixed commands and its own Core bridge, never caller-provided wallet values.
  let estateWaiting = null, estateWalletWriting = false;
  function estateWrite(request) {
    const result = transaction(() => api.estateCommit(request));
    if (!result.ok && !result.refused) hold('Estate waiting to save. Retry to finish. ' + result.error);
    return result;
  }
  function finishEstate() {
    try {
      const p = window.Estate.pending(state());
      estateWalletWriting = true;
      let paid;
      try { paid = wallet().replaceEstateAcknowledged(p.id); } finally { estateWalletWriting = false; }
      if (!paid.ok) { hold('Estate wallet waiting to save. Retry to finish. ' + paid.error); return paid; }
      const result = estateWrite({action:'finish'});
      if (!result.ok) { if (result.refused) hold(result.error); return result; }
      estateWaiting = null;
      const c = state().rewards.claims['layer:estate:first'];
      if (c?.status === 'prepared' && !transaction(() => deliver('layer:estate:first',c))) return {ok:false,error:'Estate Letters waiting to save.'};
      return result;
    } catch(error) { hold(error.message); return {ok:false,error:error.message}; }
  }
  function continueEstate(request) {
    if (state().meta.estate?.pending) return finishEstate();
    const baseline = wallet().saveAcknowledged();
    if (!baseline.ok) { hold('Estate baseline waiting to save. ' + baseline.error); return baseline; }
    const result = estateWrite(request);
    return result.ok ? finishEstate() : result;
  }
  function estateAction(request) {
    if (!window.Estate?.enabled || !api || !owns() || busy || volatile || fault || transactionRetry || localUnresolved() ||
        folioWaiting || layerWaiting || pitchWaiting || mediaWaiting || !window.IMI.ops.progression.running() || !guard(state())) return {ok:false,error:'Finish the waiting save before using Estate.'};
    try {
      if (request.action !== 'reset' || !window.Layers.same(window.Estate.quote(state()),request.quote)) invalid('Estate changed. Review it again.');
      estateWaiting = clone(request);
      const result = continueEstate(estateWaiting);
      if (result.refused) estateWaiting = null;
      return result;
    } catch(error) {estateWaiting=null;return {ok:false,error:error.message};}
  }
  function estateWallet(id) {
    if (!estateWalletWriting || !owns() || !window.Estate?.enabled) return null;
    const p = window.Estate.pending(state());
    return p.id === id ? {seed:p.seed,balance:p.balance} : null;
  }
'''+s[pos:]
s=s.replace('  function reconcile() {','  function reconcile() {\n    if (state().meta.estate?.pending && !finishEstate().ok) return false;')
s=s.replace('      if (imprintChallengeWaiting &&', "      if (estateWaiting || state().meta.estate?.pending) { const result = continueEstate(estateWaiting); if (!result.ok) { if (!result.refused) return false; estateWaiting = null; } }\n      if (imprintChallengeWaiting &&")
s=s.replace('guard, retry, imprintChallengeClear,','guard, retry, estateAction, estateWallet, imprintChallengeClear,')
s=s.replace("    layerReward:basis =>", "    estateReward:basis => descriptor('layer:estate:first','new',basis),\n    validateEstateReward:d => {validateDescriptor('layer:estate:first',d);if(d.kind !== 'L' || d.desk !== 0 || d.origin !== 'new') invalid('Invalid Estate Letters');},\n    layerReward:basis =>")
p.write_text(s,encoding='utf-8',newline='\n')
p=Path('core.js');s=p.read_text(encoding='utf-8');needle='          replaceImprintAcknowledged(id) {';s=s.replace(needle,'''          replaceEstateAcknowledged(id) {
            const intent = canWrite() && writer.estateWallet(id);
            if (!intent || ![intent.balance,intent.seed].includes(score)) return {ok:false,error:'No exact owned Estate replacement'};
            if (score === intent.seed) return {ok:true,duplicate:true};
            const result = Economy.saveScoreAcknowledged(intent.seed);
            if (result.ok) { clearTimeout(saveT); saveT = 0; score = intent.seed; paintScore(false, {reward:id}); }
            return result;
          },
'''+needle)
s=s.replace("!IMI.ops?.extensions?.state().meta.automation?.media?.pending ?", "!IMI.ops?.extensions?.state().meta.automation?.media?.pending && !IMI.ops?.extensions?.state().meta.estate?.pending ?")
p.write_text(s,encoding='utf-8',newline='\n')
for name in ['index.html','classic.html','tools/balance.html']:
 p=Path(name);s=p.read_text(encoding='utf-8');prefix='../' if name.startswith('tools/') else '';needle=f'<script src="{prefix}layers.js"></script>';s=s.replace(needle,needle+f'\n<script src="{prefix}estate.js"></script>');p.write_text(s,encoding='utf-8',newline='\n')
p=Path('sw.js');s=p.read_text(encoding='utf-8').replace('imi-v59','imi-v60').replace("'layers.js',", "'estate.js', 'layers.js',");p.write_text(s,encoding='utf-8',newline='\n')
