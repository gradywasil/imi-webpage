from pathlib import Path
import json

def edit(name, old, new):
    p=Path(name);b=p.read_bytes();ending='\r\n' if b.count(b'\r\n')==b.count(b'\n') else '\n'
    text=b.decode('utf-8')
    assert old.replace('\n',ending) in text, (name,old)
    p.write_bytes(text.replace(old.replace('\n',ending),new.replace('\n',ending)).encode('utf-8'))

# Only multiset arithmetic is shared; each work retains its own ledger and commands.
edit('works.js','window.WorksDemo = (() => {', '''window.WorksMaterial = (() => {
  const bill = word => {const counts={};for(const ch of word)counts[ch]=(counts[ch]||0)+1;return counts;};
  function consume(desks,trays,word,fresh,protectedFloor=[]) {
    const need=bill(word),pools=fresh?trays:desks.map((d,i)=>d.owned?Object.fromEntries(Object.entries(d.letters).map(([ch,n])=>[ch,Math.max(0,n-(protectedFloor[i]?.[ch]||0))])):{});
    if(!Object.entries(need).every(([ch,n])=>pools.reduce((sum,p)=>sum+(p[ch]||0),0)>=n))return false;
    for(const [ch,n]of Object.entries(need)){
      let left=n;
      for(let i=0;i<pools.length && left;i++){
        const take=Math.min(left,pools[i][ch]||0);if(!take)continue;
        const pool=fresh?trays[i]:desks[i].letters;pool[ch]-=take;if(!pool[ch])delete pool[ch];left-=take;
        if(!fresh){let remove=take;desks[i].tray=desks[i].tray.filter(c=>c!==ch||remove--<=0);}
      }
    }
    return true;
  }
  return {bill,consume};
})();
window.WorksDemo = (() => {''')
edit('works.js',"  const bill = word => {const counts={};for(const ch of word)counts[ch]=(counts[ch]||0)+1;return counts;};\n  //", "  const bill = WorksMaterial.bill;\n  //")
p=Path('works.js').read_bytes().decode().replace('\r\n','\n')
start=p.index('      const need=bill(tokens[w.index%23])');end=p.index('      w.index++;changed=true;',start)
edit('works.js',p[start:end],"      if(!WorksMaterial.consume(desks,w.trays,tokens[w.index%23],w.index>=23,protectedFloor))break;\n")
edit('works.js',"if(s.challenge||s.meta.folio?.working||s.meta.archive?.working!=null)","if(s.challenge||s.meta.works?.working||s.meta.folio?.working||s.meta.archive?.working!=null)")
edit('works.js',"if(s.challenge||s.meta.folio?.working||s.meta.archive?.working!=null||", "if(s.challenge||s.meta.works?.working||s.meta.folio?.working||s.meta.archive?.working!=null||")
edit('ops.js',"  const worksActive = () => !!worksDemo?.active(S);", "  const worksPlay = window.WorksPlay;\n  const activeWork = () => worksPlay?.active(S) ? worksPlay : worksDemo?.active(S) ? worksDemo : null;\n  const worksActive = () => !!activeWork();")
edit('ops.js',"if (worksActive()) worksDemo.advance(S, trainingIngredients());", "activeWork()?.advance(S, trainingIngredients());")
edit('ops.js',"worksDemo?.route(S,i,ch,1)","activeWork()?.route(S,i,ch,1)")
edit('ops.js',"worksDemo?.route(S,i,ch,c)","activeWork()?.route(S,i,ch,c)")
edit('ops.js',"worksDemo?.floors(S,trainingIngredients())", "activeWork()?.floors(S,trainingIngredients())")
edit('ops.js',"return m * (1 + (extensions.get('minigames')?.automaticTypingBonus?.() || 0));", "return m * (1 + (extensions.get('minigames')?.automaticTypingBonus?.() || 0)) * (worksPlay?.factor(S) || 1);")
edit('ops.js',"return sum + factor * (1 + (extensions.get('minigames')?.automaticTypingBonus?.() || 0));", "return sum + factor * (1 + (extensions.get('minigames')?.automaticTypingBonus?.() || 0)) * (worksPlay?.factor(room) || 1);")
edit('ops.js',"worksDemo?.retained(S);", "worksDemo?.retained(S); worksPlay?.retained(S);")
edit('ops.js',"S = f; if (S.meta.worksDemo)","S = f; if (S.meta.works) S.meta.works = {...S.meta.works,working:false}; if (S.meta.worksDemo)")
edit('ops.js',"Folio, Archive restoration or Works demo.","Folio, Archive restoration or Works.")
edit('ops.js',"    ...(worksDemo?.enabled ? {",'''    ...(worksPlay?.enabled ? {
      worksPlayContinue() { if(worksPlay.current(S)?.signed)newsPush('Your first play is signed. Back to your monkeys!'); },
      worksPlayCommit(request) {
        if (!writer?.owns() || !writer.transacting() || window.VaultSaveGate?.blocked || writer.localDisposition() || layerChoices.size || commissionPending || musePending || (!extensionAPI.identitySettled() || !extensionAPI.layerSettled())) return {ok:false,refused:true,error:'Finish waiting work before using Works.'};
        try {
          const candidate=worksPlay.proposal(S,request,trainingIngredients());
          candidate.lastSeen=Math.max(S.lastSeen,Date.now());
          const result=Economy.saveStateAcknowledged(candidate);
          if(result.ok){S=candidate;bankV++;mark();}
          return result;
        }catch(error){return {ok:false,refused:true,error:error.message};}
      }
    } : {}),
    ...(worksDemo?.enabled ? {''')
# Follow the existing fixed demo command's owner and Retry protocol.
p=Path('rewards.js').read_bytes().decode().replace('\r\n','\n')
a=p.index('  let worksDemoWaiting = null;');b=p.index('  let archiveWaiting',a)
block=p[a:b].replace('worksDemo','worksPlay').replace('WorksDemo','WorksPlay').replace('Works demo','Works')
edit('rewards.js','  let worksDemoWaiting = null;',block+'  let worksDemoWaiting = null;')
edit('rewards.js','      if (worksDemoWaiting)', '      if (worksPlayWaiting) {const r=worksPlayWrite(worksPlayWaiting);if(!r.ok && !r.refused)return false;worksPlayWaiting=null;}\n      if (worksDemoWaiting)')
edit('rewards.js','guard, retry, worksDemoAction,','guard, retry, worksPlayAction, worksDemoAction,')
edit('rewards.js','window.WorksDemo?.retained(candidate);','window.WorksDemo?.retained(candidate);\n      window.WorksPlay?.retained(candidate);')
edit('layers.js','window.WorksDemo?.retained(s);','window.WorksDemo?.retained(s);\n    window.WorksPlay?.retained(s);')
edit('layers.js','    if (next.meta.worksDemo)', '    if (next.meta.works) next.meta.works = {...next.meta.works,working:false};\n    if (next.meta.worksDemo)')
for f in ['folio.js','archive.js']:
    edit(f,"if (s.meta.worksDemo?.working) fail('Pause Works demo first.');", "if (s.meta.worksDemo?.working || s.meta.works?.working) fail('Pause Works first.');")
for f in ['index.html','classic.html','tools/balance.html']:
    prefix='../' if f.startswith('tools/') else ''
    edit(f,f'<script src="{prefix}works.js"></script>',f'<script src="{prefix}works.js"></script>\n  <script src="{prefix}works-play.js"></script>')
edit('sw.js',"'imi-v62'","'imi-v63'")
edit('sw.js',"'works.js'","'works.js', 'works-play.js'")
