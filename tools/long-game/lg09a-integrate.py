from pathlib import Path

def edit(f,old,new,n=1):
 p=Path(f);s=p.read_text(encoding='utf-8-sig');assert s.count(old)>=n,(f,old);s=s.replace(old,new,n);p.write_text(s,encoding='utf-8',newline='')
edit('ops.js','  const archiveFeature = window.Archive;','''  const archiveFeature = window.Archive;
  const worksDemo = window.WorksDemo;
  const worksActive = () => !!worksDemo?.active(S);
  const workPaused = () => worksActive() || !!folioGoal();
  const worksAdvance = () => { if (worksActive()) worksDemo.advance(S, trainingIngredients()); };
''')
edit('ops.js','  const takeLetter = (d, ch) => {','''  // Only actual press output enters this route. Generic grants remain ordinary.
  const generatedLetter = (d, i, ch) => { if (!worksDemo?.route(S,i,ch,1)) addLetter(d,ch); };
  const takeLetter = (d, ch) => {''')
edit('ops.js','    addLetter(d, ch);','    generatedLetter(d, i, ch);')
edit('ops.js',"if (ty.trait === 'lucky' && rand() < .05 * trMul(ty)) addLetter(d, roll(d, i, true, ty));","if (ty.trait === 'lucky' && rand() < .05 * trMul(ty)) generatedLetter(d, i, roll(d, i, true, ty));")
edit('ops.js',"if (!auto && buffOn('golden')) addLetter(d, roll(d, i, false));","if (!auto && buffOn('golden')) generatedLetter(d, i, roll(d, i, false));")
edit('ops.js','    rt[i].sheet = (rt[i].sheet + ch).slice(-120); rt[i].n++;','    worksAdvance();\n    rt[i].sheet = (rt[i].sheet + ch).slice(-120); rt[i].n++;')
edit('ops.js','    if (!keepersReady()) return 0;','    if (worksActive() || !keepersReady()) return 0;')
edit('ops.js','    if (!keepersReady()) return;','    if (worksActive() || !keepersReady()) return;')
# Publisher policy alone; preserve recipe-practice and other consumers.
edit('ops.js',"if (folioGoal() || chal('patientpress')", "if (workPaused() || chal('patientpress')",2)
edit('ops.js',"if (folioGoal()) return 'Publisher paused while working on Folio or Archive restoration.';","if (workPaused()) return 'Publisher paused while working on Folio, Archive restoration or Works demo.';")
edit('ops.js',"if (c > 0) { d.letters[ch] = (d.letters[ch] || 0) + c;", "if (c > 0) { const ordinary = c - (worksDemo?.route(S,i,ch,c) || 0); d.letters[ch] = (d.letters[ch] || 0) + ordinary;")
edit('ops.js',"      if (cp && cp.phase === 'work') cp.phase = 'sale';", "      if (!cp || cp.phase === 'work') worksAdvance();\n      if (cp && cp.phase === 'work') cp.phase = 'sale';")
# Validation also runs with flags off, before destructive room reset.
edit('ops.js','try { archiveFeature?.retained(S); } catch { return; }','try { archiveFeature?.retained(S); worksDemo?.retained(S); } catch { return; }',2)
edit('ops.js','    S = f; if (S.meta.archive)', '    S = f; if (S.meta.worksDemo) S.meta.worksDemo = {...S.meta.worksDemo,working:false}; if (S.meta.archive)')
# Existing goal floors are derived without changing odds or selection.
edit('ops.js','  function trainingPoolFacts(cost) {\n    pickAutoFocus();','  function trainingIngredients() {')
edit('ops.js','    return trainingPool.plan(S.desks.map', '''    return required;
  }
  function worksFloors() { return worksDemo?.floors(S,trainingIngredients()) || S.desks.map(() => ({})); }
  function localTrainingHave(d,i) { const floor=worksFloors()[i];return Object.entries(d.letters).reduce((n,[ch,count])=>n+Math.max(0,count-(floor[ch]||0)),0); }
  function trainingPoolFacts(cost) {
    pickAutoFocus();
    const required=trainingIngredients(),demo=worksFloors();
    for(let i=0;i<required.length;i++)for(const [ch,n]of Object.entries(demo[i]))required[i][ch]=(required[i][ch]||0)+n;
    return trainingPool.plan(S.desks.map''')
edit('ops.js','return { ...plan, ok:totalLetters(d) >= plan.cost };','return { ...plan, ok:(worksActive() ? localTrainingHave(d,i) : totalLetters(d)) >= plan.cost };')
edit('ops.js',': totalLetters(d); let lv',': worksActive() ? localTrainingHave(d,i) : totalLetters(d); let lv')
edit('ops.js',"      while (left-- > 0) { const top = Object.keys(d.letters).sort((a, b) => d.letters[b] - d.letters[a])[0]; takeLetter(d, top); }", "      const floor = worksActive() ? worksFloors()[i] : {};\n      while (left-- > 0) { const top = Object.keys(d.letters).filter(ch => d.letters[ch] > (floor[ch] || 0)).sort((a, b) => d.letters[b] - d.letters[a])[0]; takeLetter(d, top); }")
# Run pending hoard progress once per bounded online tick as well as after actual generation.
edit('ops.js','    S.desks.forEach((d, i) => { if (!d.owned) return; keeperT[i]', '    worksAdvance();\n    S.desks.forEach((d, i) => { if (!d.owned) return; keeperT[i]')
edit('ops.js','    ...(archiveFeature?.enabled ? {','''    ...(worksDemo?.enabled ? {
      worksDemoCommit(request) {
        if (!writer?.owns() || !writer.transacting() || window.VaultSaveGate?.blocked || writer.localDisposition()) return {ok:false,error:'Works demo save owner unavailable'};
        try {
          const candidate=worksDemo.proposal(S,request,trainingIngredients());
          candidate.lastSeen=Math.max(S.lastSeen,Date.now());
          const result=Economy.saveStateAcknowledged(candidate);
          if(result.ok){S=candidate;bankV++;mark();}
          return result;
        }catch(error){return {ok:false,refused:true,error:error.message};}
      }
    } : {}),
    ...(archiveFeature?.enabled ? {''')
# Module command save owner with volatile retry, no new durable pending envelope.
edit('rewards.js','  let archiveWaiting = null, archiveIncomeWaiting = false;','''  let worksDemoWaiting = null;
  function worksDemoWrite(request) {
    const result=transaction(() => api.worksDemoCommit(request));
    if(!result.ok && !result.refused)hold('Works demo waiting to save. Retry the same action. ' + result.error);
    return result;
  }
  function worksDemoAction(request) {
    if(!window.WorksDemo?.enabled || !api || !owns() || busy || fault || volatile || transactionRetry || localUnresolved() ||
       !window.IMI.ops.progression.running() || !guard(state()))return {ok:false,error:'Finish waiting saves before using Works demo.'};
    try {
      if(!api.archiveSettle())return {ok:false,error:'Archive income waiting to save'};
      window.WorksDemo.proposal(state(),request);
      worksDemoWaiting=clone(request);
      const result=worksDemoWrite(worksDemoWaiting);
      if(result.ok || result.refused)worksDemoWaiting=null;
      return result;
    }catch(error){return {ok:false,error:error.message};}
  }
  let archiveWaiting = null, archiveIncomeWaiting = false;''')
edit('rewards.js','      normalize(clone(candidate));','      window.WorksDemo?.retained(candidate);\n      normalize(clone(candidate));')
edit('rewards.js',"      if ((state().meta.archive?.pending", "      if (worksDemoWaiting) {const r=worksDemoWrite(worksDemoWaiting);if(!r.ok && !r.refused)return false;worksDemoWaiting=null;}\n      if ((state().meta.archive?.pending")
edit('rewards.js','guard, retry, archiveAction,','guard, retry, worksDemoAction, archiveAction,')
edit('layers.js','    window.Archive?.retained(s);','    window.Archive?.retained(s);\n    window.WorksDemo?.retained(s);',2)
edit('layers.js','  function finishRoom(s, next) {','  function finishRoom(s, next) {\n    if (next.meta.worksDemo) next.meta.worksDemo = {...next.meta.worksDemo,working:false};')
edit('folio.js',"if (s.meta.archive?.working != null) fail('Return from Archive restoration first.');", "if (s.meta.worksDemo?.working) fail('Pause Works demo first.'); if (s.meta.archive?.working != null) fail('Return from Archive restoration first.');")
edit('archive.js',"          if (s.meta.folio?.working", "          if (s.meta.worksDemo?.working) fail('Pause Works demo first.');\n          if (s.meta.folio?.working")
for f in ['index.html','classic.html','tools/balance.html']:
 prefix='../' if f.startswith('tools/') else ''
 edit(f,f'<script src="{prefix}archive.js"></script>',f'<script src="{prefix}archive.js"></script>\n<script src="{prefix}works.js"></script>')
edit('sw.js',"'imi-v61'","'imi-v62'")
edit('sw.js',"  'archive.js'","  'works.js', 'archive.js'")
