/* LG-09A: separate nonrewarding, finite two-pass material demo. */
window.WorksMaterial = (() => {
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
window.WorksDemo = (() => {
  'use strict';
  const enabled = new URLSearchParams(location.search).get('lg09demo') === '1' && !!window.Archive?.enabled;
  const copy = x => JSON.parse(JSON.stringify(x));
  const object = x => !!x && typeof x === 'object' && !Array.isArray(x);
  const integer = x => Number.isSafeInteger(x) && x >= 0;
  const fail = message => {throw Error(message);};
  const body = READERS.find(r => r.id === 'midsummer-chimp').text;
  const tokens = body.toUpperCase().match(/[A-Z]+/g);
  const bill = WorksMaterial.bill;
  // The full body is the stable content identity, with no asynchronous hash dependency.
  const manifest = {version:1,id:'midsummer-chimp-demo-v1',body,tokens,perLetter:bill(tokens.join('')),passes:2,letters:150,totalLetters:300};
  const identity = JSON.stringify(manifest);
  if(tokens.length!==23 || tokens.join('').length!==150 || !tokens.includes('A'))fail('Midsummer demo content changed.');
  const remaining = index => bill(tokens.slice(Math.max(0,index-23)).join(''));
  function current(s) {
    const w=s.meta.worksDemo;
    if(w===undefined)return null;
    if(!object(w)||w.version!==1||w.content!==identity||w.unlocked!==true||!integer(w.revision)||!integer(w.index)||w.index>46||typeof w.working!=='boolean'||w.index===46&&w.working||!Array.isArray(w.trays)||w.trays.length!==s.desks.length)fail('Unsupported Works demo save. Preserve it for recovery.');
    const cap=remaining(w.index),total={};
    for(const tray of w.trays){
      if(!object(tray))fail('Unsupported Works demo tray.');
      for(const [ch,n]of Object.entries(tray)){
        if(!/^[A-Z]$/.test(ch)||!integer(n)||!integer((total[ch]||0)+n))fail('Unsupported Works demo inventory.');
        total[ch]=(total[ch]||0)+n;
      }
    }
    if(Object.entries(total).some(([ch,n])=>n>(cap[ch]||0)))fail('Works demo tray exceeds remaining bill.');
    return copy(w);
  }
  function retained(s){if(s.meta.worksDemo!==undefined)current(s);}
  const active = s => enabled && !!s.meta.worksDemo?.working && !s.challenge;
  const eligible = s => s.intro.done && Estate.current(s).count>=3 && Archive.current(s).entries.filter(e=>Archive.stage(e,Date.now())===2).length>=2;
  const snapshot = s => copy([s.meta.worksDemo??null,s.desks.map(d=>[d.owned,d.letters,d.tray]),s.challenge,s.focus,s.autoFocus,s.bank,s.meta.productionGoal??null,s.meta.folio??null,s.meta.archive?.working??null]);
  function bump(w){if(!integer(w.revision+1))fail('Works demo revision exhausted.');w.revision++;}
  function inventory(s){
    for(const d of s.desks)if(!object(d.letters)||Object.entries(d.letters).some(([ch,n])=>!/^[A-Z]$/.test(ch)||!integer(n)))fail('Unsupported drawer inventory.');
  }
  // Lowest desk first. No banked words or cash can enter this planner.
  function plan(s,protectedFloor=[]){
    const w=current(s);if(!w||!active(s))return null;
    inventory(s);
    const desks=copy(s.desks);let changed=false;
    for(let step=0;step<46 && w.index<46;step++){
      if(!WorksMaterial.consume(desks,w.trays,tokens[w.index%23],w.index>=23,protectedFloor))break;
      w.index++;changed=true;
    }
    if(!changed)return null;
    if(w.index===46)w.working=false;
    bump(w);return {works:w,desks};
  }
  function advance(s,protectedFloor){const p=plan(s,protectedFloor);if(p){s.meta.worksDemo=p.works;s.desks=p.desks;}return !!p;}
  function route(s,i,ch,n){
    if(!active(s))return 0;
    const w=current(s);if(!w||!s.desks[i]?.owned||!/^[A-Z]$/.test(ch)||!integer(n))fail('Invalid Works demo generation.');
    const left=(remaining(w.index)[ch]||0)-w.trays.reduce((sum,p)=>sum+(p[ch]||0),0),take=Math.min(n,left);
    if(take){w.trays[i][ch]=(w.trays[i][ch]||0)+take;bump(w);s.meta.worksDemo=w;}
    return take;
  }
  function floors(s,original=[]){
    const result=s.desks.map(()=>({}));if(!active(s))return result;
    const w=current(s);if(!w||w.index>=23)return result;
    const need=bill(tokens[w.index]);
    for(const [ch,n]of Object.entries(need)){
      let left=n;
      for(let i=0;i<s.desks.length&&left;i++)if(s.desks[i].owned){const take=Math.min(left,Math.max(0,(s.desks[i].letters[ch]||0)-(original[i]?.[ch]||0)));result[i][ch]=take;left-=take;}
    }
    return result;
  }
  function proposal(s,r,protectedFloor){
    if(!enabled||!Layers.epochMatches(s,r)||r.content!==identity||!Layers.same(snapshot(s),r.expected))fail('Works demo changed. Review the action again.');
    retained(s);inventory(s);
    if(s.rewards.awayCheckpoint||s.meta.archive?.pending||s.meta.folio?.pending||s.meta.layers?.pending||s.meta.estate?.pending||s.meta.automation?.pitch?.sale||s.meta.automation?.media?.pending||s.prem.vault?.transition||Object.values(s.rewards.claims).some(c=>c.status==='prepared'))fail('Finish original production and waiting saves first.');
    const next=copy(s);let w=current(s);
    if(r.action==='introduce'){
      if(s.challenge||window.WorksPlay?.current(s)?.working||s.meta.folio?.working||s.meta.archive?.working!=null)fail('Finish the challenge or return from Folio/Archive work first.');
      if(w||!eligible(s))fail('Introduction requires Estate 3 and two active stage 2 classics.');
      w={version:1,content:identity,unlocked:true,revision:0,index:0,working:false,trays:s.desks.map(()=>({}))};
    }else{
      if(!w)fail('Introduce the demo first.');
      if(r.action==='work'){
        if(s.challenge||window.WorksPlay?.current(s)?.working||s.meta.folio?.working||s.meta.archive?.working!=null||s.meta.folio!==undefined&&!Folio.valid(s.meta.folio))fail('Finish the challenge or return from Folio/Archive work first.');
        if(w.index===46)fail('Demo complete. Continue or review repeat.');
        w.working=true;
      }else if(r.action==='pause')w.working=false;
      else if(r.action==='release'||r.action==='repeat'){
        for(let i=0;i<w.trays.length;i++)for(const [ch,n]of Object.entries(w.trays[i])){
          const d=next.desks[i],total=(d.letters[ch]||0)+n;if(!integer(total))fail('Released drawer inventory would overflow.');
          d.letters[ch]=total;d.tray=[...d.tray,...Array(Math.min(n,80)).fill(ch)].slice(-80);
        }
        w.trays=s.desks.map(()=>({}));w.working=false;if(r.action==='repeat')w.index=0;
      }else if(r.action!=='advance')fail('Unknown Works demo command.');
    }
    bump(w);next.meta.worksDemo=w;
    if(r.action==='work'||r.action==='advance')advance(next,protectedFloor);
    return next;
  }
  let api,notice='';
  const button=(act,text)=>`<button type="button" class="o-btn" data-act="works-demo:${act}">${text}</button>`;
  function act(action){
    if(!api.archiveSettle())return;
    const s=api.state(),r=Rewards.worksDemoAction({action,...Layers.epochFields(s),content:identity,expected:snapshot(s)});
    notice=r.ok?'Demo saved.':r.error;api.mark();
  }
  function confirm(action,text){
    const focus=document.activeElement,el=document.createElement('div');el.className='o-modal layer-confirm works-demo-confirm';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-label','Review demo materials');
    el.innerHTML=`<div class="o-modal-card"><h3>Review demo materials</h3><div class="layer-details" tabindex="0"><p>${text}</p></div><div class="o-row">${button('cancel','Cancel')}${button('confirm','Confirm')}</div></div>`;
    const close=()=>{el.remove();focus?.focus();};el.querySelector('[data-act="works-demo:cancel"]').onclick=close;el.querySelector('[data-act="works-demo:confirm"]').onclick=()=>{act(action);close();};
    el.onkeydown=e=>{if(e.key==='Escape')close();if(e.key==='Tab'){const b=el.querySelectorAll('button');if(e.shiftKey&&document.activeElement===b[0]){e.preventDefault();b[1].focus();}else if(!e.shiftKey&&document.activeElement===b[1]){e.preventDefault();b[0].focus();}}};
    document.body.appendChild(el);el.querySelector('button').focus();
  }
  function render(c,pane){
    api=c;
    try{
      const s=c.state(),w=current(s),total=w?w.trays.reduce((n,p)=>n+Object.values(p).reduce((a,b)=>a+b,0),0):0;
      let html='<section class="o-card layers works-demo"><h3>Pipeline demo, no completed play</h3>';
      if(!w)html+=`<p>Introduction requires Estate 3 and two active curated stage 2 classics. Preview at Printing 4.</p>${eligible(s)?button('introduce','Review introduction'):'<p>Demo locked.</p>'}`;
      else if(w.index===46)html+='<h4>Demo complete, no permanent reward</h4><p>300 actual letters consumed. Ordinary play remains available.</p>'+button('continue','Continue')+button('repeat','Review repeat');
      else{
        const word=tokens[w.index%23],need=bill(word),pools=w.index<23?s.desks.filter(d=>d.owned).map(d=>d.letters):w.trays;
        const missing=Object.entries(need).map(([ch,n])=>[ch,Math.max(0,n-pools.reduce((a,p)=>a+(p[ch]||0),0))]).filter(([,n])=>n);
        html+=`<h4>Pass ${Math.floor(w.index/23)+1}/2, word ${w.index%23+1}/23: ${word}</h4><p>Source: ${w.index<23?'ordinary owned drawers, lowest desk first':'only newly typed reserved trays'}.</p><p>Missing: ${missing.map(([ch,n])=>`${ch} x ${n}`).join(', ')||'none, next bounded update consumes the word unless another goal protects it'}.</p><p>${s.challenge?'Challenge pauses demo supply and progress.':w.working?'Working. Keepers and Publisher paused; their settings and your book selection are retained.':'Paused. Resume manually after resets.'}</p>${button(w.working?'pause':'work',w.working?'Pause demo':'Work / resume demo')}${button('advance','Save material progress')}${button('release','Review release')}${button('repeat','Review repeat')}${button('continue','Return to production')}`;
      }
      html+='<details class="o-updetail"><summary>Demo rules and material sources</summary><p>A Midsummer Night\'s Chimp. 23 words including A, 150 letters per pass, two ordered passes. No permanent reward, anthology count, signature or win. The existing 16-reader Complete Works award is separate.</p></details>';
      html+=`<p>Reserved letters: ${total}. They are outside drawers and survive progression resets, including letters from desks no longer owned. Only actual typing after introduction while working counts. Rewards, garden, conversions and released letters stay ordinary.</p>`;
      if(w)html+=w.trays.map((p,i)=>`<p>Desk ${i+1}${s.desks[i].owned?'':' (unowned)'} reserved: ${Object.entries(p).map(([ch,n])=>`${ch}:${n}`).join(' ')||'empty'}</p>`).join('');
      html+=`<p>Typing and automatic progress use the ordinary short save window. Explicit actions require acknowledged saves. Consumed demo letters are never refunded.</p>${notice?`<p role="status">${notice.replace(/[&<>]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[ch]))}</p>`:''}</section>`;c.morph(pane,html);
    }catch(e){c.morph(pane,'<section class="o-card layers"><h3>Works demo unavailable</h3><p>Unsupported demo save. Preserve it for recovery.</p></section>');}
  }
  if(enabled)(window.__OPS_EXTENSIONS??=[]).push(['works-demo',{tab:['works-demo','i-works','Works demo','Preview, no rewards yet','Works demo',true],visible:c=>{try{return !!c.state().meta.worksDemo||eligible(c.state());}catch{return false;}},init:(_r,c)=>{api=c;},render,actions:{
    introduce:()=>confirm('introduce','Start the separate nonrewarding demo with empty fresh trays. Pre-introduction stock and away output cannot count as fresh. No completed play or permanent benefit is awarded.'),
    work:()=>act('work'),pause:()=>act('pause'),advance:()=>act('advance'),
    release:()=>confirm('release','Return every unspent reserved letter to its originating drawer once, including unowned desks. Fresh status is permanently lost. Consumed letters are not refunded. Work pauses.'),
    repeat:()=>confirm('repeat','Return all unspent reserved letters first and clear demo progress. Consumed letters are not refunded. Returned letters lose fresh status. Main progression and rewards do not change. Work pauses.'),
    continue:()=>{if(api.state().meta.worksDemo?.working)act('pause');if(!api.state().meta.worksDemo?.working)api.setTab('floor');}
  }}]);
  return {enabled,manifest,identity,current,retained,active,eligible,snapshot,remaining,plan,advance,route,floors,proposal};
})();
