/* LG-09E: the owner-approved seven-play anthology. No demo conversion. */
window.WorksPlay = (() => {
  'use strict';
  const enabled = (window.GameFeatures?.enabled('lg09works') ?? new URLSearchParams(location.search).get('lg09works') === '1') && !!window.Archive?.enabled;
  const copy = x => JSON.parse(JSON.stringify(x));
  const object = x => !!x && typeof x === 'object' && !Array.isArray(x);
  const integer = x => Number.isSafeInteger(x) && x >= 0;
  const fail = message => {throw Error(message);};
  // Frozen approved bytes and ordered bill. Historical proposal status in the descriptor stays intact.
  const manifest = {"version":1,"contentId":"works:midsummer-chimp:script:v1","title":"A Midsummer Night's Chimp","body":"Lanterns glowed across the summer meadow. Pip the monkey carried bananas for dawn. Two fairies trailed him, arguing about which fairy had borrowed which banana.\n\n\"Nobody stole breakfast,\" Pip said. \"Food follows whoever holds the basket.\"\n\nBehind them, sleepy dreamers planned a forest show. One monkey played a mountain. One played moonlight. Their chief wanted quiet, but the mountain kept sneezing.\n\nPip tried to help. He shook flower dust, hoping actors would learn their lines. Alas, the mountain dreamed of moonlight, moonlight dreamed of bananas, and their chief said that actors needed pajamas.\n\nThe fairies giggled when Pip sneezed. Then both felt the basket was their queen. They bowed. The basket said nothing, which seemed quite royal.\n\n\"I have mixed things up,\" sighed Pip.\n\nThen sunshine lit the glade. Pip swept away the dust and told his story. The mountain hugged him. Moonlight hugged him. Their chief asked for breakfast before hearing more lines.\n\nThe fairies gave back each borrowed banana. They all shared toast under the lanterns, while Pip said sorry with a grand bow.\n\nTheir show began after breakfast. The mountain sneezed again. They clapped, even the fairies, who agreed that mountains needed hankies.\n\nThe basket stayed queen.","bodySha256":"5bf83f2ed0029f171997dc8c9f428927ff0e7fe87dd6454da0a229b2ee09980a","orderedTokens":["LANTERNS","GLOWED","ACROSS","THE","SUMMER","MEADOW","PIP","THE","MONKEY","CARRIED","BANANAS","FOR","DAWN","TWO","FAIRIES","TRAILED","HIM","ARGUING","ABOUT","WHICH","FAIRY","HAD","BORROWED","WHICH","BANANA","NOBODY","STOLE","BREAKFAST","PIP","SAID","FOOD","FOLLOWS","WHOEVER","HOLDS","THE","BASKET","BEHIND","THEM","SLEEPY","DREAMERS","PLANNED","A","FOREST","SHOW","ONE","MONKEY","PLAYED","A","MOUNTAIN","ONE","PLAYED","MOONLIGHT","THEIR","CHIEF","WANTED","QUIET","BUT","THE","MOUNTAIN","KEPT","SNEEZING","PIP","TRIED","TO","HELP","HE","SHOOK","FLOWER","DUST","HOPING","ACTORS","WOULD","LEARN","THEIR","LINES","ALAS","THE","MOUNTAIN","DREAMED","OF","MOONLIGHT","MOONLIGHT","DREAMED","OF","BANANAS","AND","THEIR","CHIEF","SAID","THAT","ACTORS","NEEDED","PAJAMAS","THE","FAIRIES","GIGGLED","WHEN","PIP","SNEEZED","THEN","BOTH","FELT","THE","BASKET","WAS","THEIR","QUEEN","THEY","BOWED","THE","BASKET","SAID","NOTHING","WHICH","SEEMED","QUITE","ROYAL","I","HAVE","MIXED","THINGS","UP","SIGHED","PIP","THEN","SUNSHINE","LIT","THE","GLADE","PIP","SWEPT","AWAY","THE","DUST","AND","TOLD","HIS","STORY","THE","MOUNTAIN","HUGGED","HIM","MOONLIGHT","HUGGED","HIM","THEIR","CHIEF","ASKED","FOR","BREAKFAST","BEFORE","HEARING","MORE","LINES","THE","FAIRIES","GAVE","BACK","EACH","BORROWED","BANANA","THEY","ALL","SHARED","TOAST","UNDER","THE","LANTERNS","WHILE","PIP","SAID","SORRY","WITH","A","GRAND","BOW","THEIR","SHOW","BEGAN","AFTER","BREAKFAST","THE","MOUNTAIN","SNEEZED","AGAIN","THEY","CLAPPED","EVEN","THE","FAIRIES","WHO","AGREED","THAT","MOUNTAINS","NEEDED","HANKIES","THE","BASKET","STAYED","QUEEN"],"orderedTokensSha256":"4c624d91610817033dc153d7927e0067ab88c4df1e0325d806b3ebf273ce2270","perLetterBill":{"A":92,"B":23,"C":13,"D":53,"E":134,"F":22,"G":26,"H":73,"I":70,"J":1,"K":14,"L":33,"M":26,"N":68,"O":63,"P":26,"Q":4,"R":51,"S":58,"T":80,"U":22,"V":4,"W":25,"X":1,"Y":15,"Z":3},"editions":100,"tokenCount":200,"letterCount":1000,"totalTokens":20000,"totalLetters":100000};
  const descriptor = {"status":"PROPOSED_UNAPPROVED","claimId":"works:midsummer-chimp:first","contentId":"works:midsummer-chimp:script:v1","version":1,"bodySha256":"5bf83f2ed0029f171997dc8c9f428927ff0e7fe87dd6454da0a229b2ee09980a","orderedTokensSha256":"4c624d91610817033dc153d7927e0067ab88c4df1e0325d806b3ebf273ce2270","manifestFileSha256":"e1f739609eb9c5160eb923775a7e257575efc6367205afdf2c6f3c3d7bb019e0","candidateEditions":100,"reward":{"family":"Works","automaticTypistRatePercentagePoints":1,"familyCapPercentagePoints":7,"playbillNumber":1},"laterTextVersionMayRepay":false,"grants":{"diamondBananas":0,"cash":0,"letters":0,"goldenBananas":0}};
  const bill=WorksMaterial.bill,identity=JSON.stringify(manifest);
  const frozen=window.WorksCatalogue();
  const releases=[{manifest,descriptor,copy:{beforeSigning:beforeSignCopy(),completion:"A Midsummer Night's Chimp is signed! Your automatic typists are 1% faster. Playbill 1 is yours.",playbillTitle:"Playbill 1: A Midsummer Night's Chimp",playbillBody:'100 editions, one royal basket, and breakfast for everyone. Signed by your monkey troupe. Automatic typists: +1 percentage point from Works.',continueButton:'Continue playing',continueMessage:'Your first play is signed. Back to your monkeys!'}},...frozen.plays.map(p=>({...p,copy:p.descriptor.copy}))].map(p=>({...p,identity:JSON.stringify(p.manifest),receipt:JSON.stringify(p.descriptor),suffix:Array.from({length:201},(_,i)=>bill(p.manifest.orderedTokens.slice(i).join('')))}));
  function beforeSignCopy(){return 'All 100 editions are ready. Sign your play to make your automatic typists 1% faster and keep Playbill 1.';}
  const completionRecord={completionId:frozen.completion.completionId,...frozen.completion.proposedRecord};
  for(const p of releases){
    const m=p.manifest,t=m.orderedTokens;
    if(JSON.stringify(m.body.toUpperCase().match(/[A-Z]+/g))!==JSON.stringify(t)||t.length!==200||t.join('').length!==1000||Object.entries(m.perLetterBill).some(([ch,n])=>(bill(t.join(''))[ch]||0)!==n))fail('Approved Works content changed.');
  }
  const release=w=>releases.find(p=>p.identity===w?.content)||releases[0];
  function remaining(index,p=releases[0]){
    if(index===20000)return {};
    const start=Math.max(200,index),ed=Math.floor(start/200),offset=start%200,result={};
    for(const ch of Object.keys(p.manifest.perLetterBill))result[ch]=(p.suffix[offset][ch]||0)+Math.max(0,99-ed)*p.manifest.perLetterBill[ch];
    return result;
  }
  function validate(s,w,p){
    if(!object(w)||w.version!==1||w.content!==p.identity||w.editions!==100||w.unlocked!==true||!integer(w.revision)||!integer(w.index)||w.index>20000||typeof w.working!=='boolean'||w.index===20000&&w.working||w.working&&s.meta.worksDemo?.working||!Array.isArray(w.trays)||w.trays.length!==s.desks.length||typeof w.signed!=='boolean')fail('Unsupported Works save. Preserve it for recovery.');
    const cap=remaining(w.index,p),total={};
    for(const tray of w.trays){
      if(!object(tray))fail('Unsupported Works tray.');
      for(const [ch,n]of Object.entries(tray)){
        if(!/^[A-Z]$/.test(ch)||!integer(n)||!integer((total[ch]||0)+n))fail('Unsupported Works inventory.');
        total[ch]=(total[ch]||0)+n;
      }
    }
    if(Object.entries(total).some(([ch,n])=>n>(cap[ch]||0)))fail('Works tray exceeds remaining bill.');
    if(w.signed ? w.index!==20000||!object(w.signature)||w.signature.claimId!==p.descriptor.claimId||w.signature.receipt!==p.receipt||w.signature.content!==p.identity||!object(w.playbill)||w.playbill.number!==p.descriptor.reward.playbillNumber||w.playbill.title!==p.copy.playbillTitle||w.playbill.body!==p.copy.playbillBody : w.signature!==null||w.playbill!==null)fail('Unsupported Works signature. Preserve it for recovery.');
  }
  function records(s){
    const root=s.meta.works;if(root===undefined)return [];
    validate(s,root,releases[0]);const result=[root],a=root.anthology;
    if(a!==undefined){
      if(!object(a)||a.version!==1||!object(a.plays)||!Object.keys(a.plays).length||Object.keys(a.plays).some(id=>!releases.slice(1).some(p=>p.manifest.playId===id)))fail('Unsupported Works anthology. Preserve it for recovery.');
      for(const p of releases.slice(1)){
        const w=a.plays[p.manifest.playId];
        if(w===undefined)break;
        if(!result.at(-1).signed||w.anthology!==undefined)fail('Works introductions must follow signed plays.');
        validate(s,w,p);result.push(w);
      }
      if(result.length!==Object.keys(a.plays).length+1||a.active!==releases[result.length-1].manifest.playId)fail('Unsupported Works order.');
      if(a.completion!==undefined&&(result.length!==7||!result.every(w=>w.signed)||!Layers.same(a.completion,completionRecord)))fail('Unsupported Works completion.');
      if(result.length===7&&result[6].signed&&a.completion===undefined)fail('Missing acknowledged Works completion.');
    }
    return result;
  }
  function current(s){return copy(records(s).at(-1)||null);}
  function retained(s){records(s);}
  function factor(s){if(!enabled)return 1;try{return 1+records(s).filter(w=>w.signed).length/100;}catch{return 1;}}
  const active=s=>enabled&&!s.challenge&&!!current(s)?.working;
  function store(s,w){
    if(w.content===identity)s.meta.works=w;
    else s.meta.works.anthology.plays[release(w).manifest.playId]=w;
  }
  function exit(s){retained(s);if(s.meta.works){s.meta.works.working=false;for(const w of Object.values(s.meta.works.anthology?.plays||{}))w.working=false;}}
  function commandContent(s,action){const list=records(s);return action==='introduce'&&list.length&&list.at(-1).signed?releases[list.length]?.identity:release(list.at(-1)).identity;}
  function continueMessage(s){const w=current(s);return w?.signed?(s.meta.works.anthology?.completion?frozen.completion.copy.continueMessage:release(w).copy.continueMessage):'';}
  const eligible=s=>s.intro.done&&Estate.current(s).count>=3&&Archive.current(s).entries.filter(e=>Archive.stage(e,Date.now())===2).length>=2;
  const snapshot=s=>copy([s.meta.works??null,s.meta.worksDemo??null,s.desks.map(d=>[d.owned,d.letters,d.tray]),s.challenge,s.focus,s.autoFocus,s.bank,s.meta.productionGoal??null,s.meta.folio??null,s.meta.archive?.working??null]);
  function bump(w){if(!integer(w.revision+1))fail('Works revision exhausted.');w.revision++;}
  function inventory(s){for(const d of s.desks)if(!object(d.letters)||Object.entries(d.letters).some(([ch,n])=>!/^[A-Z]$/.test(ch)||!integer(n)))fail('Unsupported drawer inventory.');}
  function plan(s,protectedFloor=[]){
    const w=current(s);if(!w||!active(s))return null;
    const tokens=release(w).manifest.orderedTokens;
    inventory(s);const desks=copy(s.desks);let changed=false;
    // One edition per update, including when all remaining trays are affordable.
    for(let step=0;step<200&&w.index<20000;step++){
      if(!WorksMaterial.consume(desks,w.trays,tokens[w.index%200],w.index>=200,protectedFloor))break;
      w.index++;changed=true;
    }
    if(!changed)return null;if(w.index===20000)w.working=false;
    bump(w);return {works:w,desks};
  }
  function advance(s,protectedFloor){const p=plan(s,protectedFloor);if(p){store(s,p.works);s.desks=p.desks;}return !!p;}
  function route(s,i,ch,n){
    if(!active(s))return 0;
    const w=current(s);if(!w||!s.desks[i]?.owned||!/^[A-Z]$/.test(ch)||!integer(n))fail('Invalid Works generation.');
    const left=(remaining(w.index,release(w))[ch]||0)-w.trays.reduce((sum,p)=>sum+(p[ch]||0),0),take=Math.min(n,left);
    if(take){w.trays[i][ch]=(w.trays[i][ch]||0)+take;bump(w);store(s,w);}
    return take;
  }
  function floors(s,original=[]){
    const result=s.desks.map(()=>({}));if(!active(s))return result;
    const w=current(s);if(!w||w.index>=200)return result;
    for(const [ch,n]of Object.entries(bill(release(w).manifest.orderedTokens[w.index]))){
      let left=n;
      for(let i=0;i<s.desks.length&&left;i++)if(s.desks[i].owned){const take=Math.min(left,Math.max(0,(s.desks[i].letters[ch]||0)-(original[i]?.[ch]||0)));result[i][ch]=take;left-=take;}
    }
    return result;
  }
  function proposal(s,r,protectedFloor){
    if(!enabled||!Layers.epochMatches(s,r)||r.content!==commandContent(s,r.action)||!Layers.same(snapshot(s),r.expected))fail('Works changed. Review the action again.');
    retained(s);inventory(s);
    if(s.meta.minigames?.active||s.rewards.awayCheckpoint||s.meta.archive?.pending||s.meta.folio?.pending||s.meta.layers?.pending||s.meta.estate?.pending||s.meta.automation?.pitch?.sale||s.meta.automation?.media?.pending||s.prem.vault?.transition||Object.values(s.rewards.claims).some(c=>c.status==='prepared'))fail('Finish original production and waiting saves first.');
    const next=copy(s);let w=current(s),p=release(w);
    const conflict=s.challenge||s.meta.worksDemo?.working||s.meta.folio?.working||s.meta.archive?.working!=null||s.meta.folio!==undefined&&!Folio.valid(s.meta.folio);
    if(r.action==='introduce'){
      if(conflict)fail('Finish the challenge or pause other work first.');
      if(w){
        const list=records(s);if(!w.signed||list.length===7)fail('Sign the current play before introducing the next.');
        p=releases[list.length];
        next.meta.works.anthology??={version:1,active:p.manifest.playId,plays:{}};
        next.meta.works.anthology.active=p.manifest.playId;
      }else if(!eligible(s))fail('Introduction requires Estate 3 and two active stage 2 classics.');
      w={version:1,content:p.identity,editions:100,unlocked:true,revision:0,index:0,working:false,trays:s.desks.map(()=>({})),signed:false,signature:null,playbill:null};
    }else{
      if(!w)fail('Introduce your first play first.');
      if(w.signed)fail('This play is already signed.');
      if(r.action==='work'){
        if(conflict)fail('Finish the challenge or pause other work first.');
        if(w.index===20000)fail('All editions are ready. Sign your play.');
        w.working=true;
      }else if(r.action==='pause')w.working=false;
      else if(r.action==='release'){
        for(let i=0;i<w.trays.length;i++)for(const [ch,n]of Object.entries(w.trays[i])){
          const d=next.desks[i],total=(d.letters[ch]||0)+n;if(!integer(total))fail('Released drawer inventory would overflow.');
          d.letters[ch]=total;d.tray=[...d.tray,...Array(Math.min(n,80)).fill(ch)].slice(-80);
        }
        w.trays=s.desks.map(()=>({}));w.working=false;
      }else if(r.action==='sign'){
        if(w.index!==20000||w.working||conflict)fail('Finish all 100 editions and waiting work before signing.');
        w.signed=true;w.signature={claimId:p.descriptor.claimId,receipt:p.receipt,content:p.identity};
        w.playbill={number:p.descriptor.reward.playbillNumber,title:p.copy.playbillTitle,body:p.copy.playbillBody};
      }else if(r.action!=='advance')fail('Unknown Works command.');
    }
    bump(w);store(next,w);
    if(r.action==='sign'&&p===releases[6])next.meta.works.anthology.completion=copy(completionRecord);
    retained(next);
    if(r.action==='work'||r.action==='advance')advance(next,protectedFloor);
    return next;
  }
  let api,notice='';
  const esc=x=>String(x).replace(/[&<>\"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
  const button=(act,text)=>`<button type="button" class="o-btn" data-act="works-play:${act}">${text}</button>`;
  function act(action){
    if(!api.archiveSettle())return;
    const s=api.state(),r=Rewards.worksPlayAction({action,...Layers.epochFields(s),content:commandContent(s,action),expected:snapshot(s)});
    notice=r.ok?'Play saved.':r.error;api.mark();
  }
  function confirm(action,text){
    const focus=document.activeElement,el=document.createElement('div');el.className='o-modal layer-confirm';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-label','Review play materials');
    el.innerHTML=`<div class="o-modal-card"><h3>Review play materials</h3><div class="layer-details" tabindex="0"><p>${text}</p></div><div class="o-row">${button('cancel','Cancel')}${button('confirm','Confirm')}</div></div>`;
    const close=()=>{el.remove();focus?.focus();};el.querySelector('[data-act="works-play:cancel"]').onclick=close;el.querySelector('[data-act="works-play:confirm"]').onclick=()=>{act(action);close();};
    el.onkeydown=e=>{if(e.key==='Escape')close();if(e.key==='Tab'){const b=el.querySelectorAll('button');if(e.shiftKey&&document.activeElement===b[0]){e.preventDefault();b[1].focus();}else if(!e.shiftKey&&document.activeElement===b[1]){e.preventDefault();b[0].focus();}}};
    document.body.appendChild(el);el.querySelector('button').focus();
  }
  function render(c,pane){
    api=c;
    try{
      const s=c.state(),w=current(s),p=release(w),manifest=p.manifest,tokens=manifest.orderedTokens,list=records(s),total=w?w.trays.reduce((n,p)=>n+Object.values(p).reduce((a,b)=>a+b,0),0):0;
      let html=`<section class="o-card layers"><h3>${manifest.title}</h3>`;
      if(!w)html+=`<p>100 ordered editions. First 1,000 letters from ordinary drawers, then 99,000 newly typed letters. Introduction requires Estate 3 and two active curated stage 2 classics. Preview at Printing 4.</p>${eligible(s)?button('introduce','Review introduction'):'<p>First play locked.</p>'}`;
      else if(w.signed)html+=`<p role="status">${p.copy.completion}</p><h4>${p.copy.playbillTitle}</h4><p>${p.copy.playbillBody}</p>${s.meta.works?.anthology?.completion?`<h3 data-works-finish>${frozen.completion.copy.heading}</h3><p>${frozen.completion.copy.body}</p>`:''}${button('continue','Continue playing')}`;
      else if(w.index===20000)html+=`<p>${p.copy.beforeSigning}</p>${button('sign','Sign my play')}${button('continue','Return to production')}`;
      else{
        const word=tokens[w.index%200],pools=w.index<200?s.desks.filter(d=>d.owned).map(d=>d.letters):w.trays;
        const missing=Object.entries(bill(word)).map(([ch,n])=>[ch,Math.max(0,n-pools.reduce((a,p)=>a+(p[ch]||0),0))]).filter(([,n])=>n);
        html+=`<h4>Edition ${Math.floor(w.index/200)+1}/100, word ${w.index%200+1}/200: ${word}</h4><p>Source: ${w.index<200?'ordinary owned drawers, lowest desk first':'only newly typed reserved trays'}.</p><p>Missing: ${missing.map(([ch,n])=>`${ch} x ${n}`).join(', ')||'none, next bounded update consumes the word unless another goal protects it'}.</p><p>${s.challenge?'Challenge pauses Works supply and progress.':s.meta.worksDemo?.working?'Pause Works demo before resuming.':w.working?'Working. Keepers and Publisher paused; settings and book selection retained.':'Paused. Resume manually after resets.'}</p>${button(w.working?'pause':'work',w.working?'Pause play':'Work / resume play')}${button('advance','Save material progress')}${button('release','Review release')}${button('continue','Return to production')}`;
      }
      if(w?.signed&&list.length<7)html+=`<h4>Next: ${releases[list.length].manifest.title}</h4><p>Introduce manually with empty fresh trays. Previous material stays ordinary.</p>${button('introduce','Review next introduction')}`;
      if(list.some(r=>r.signed))html+=`<details class="o-updetail"><summary>Saved Playbills</summary>${list.filter(r=>r.signed).map(r=>`<h4>${esc(r.playbill.title)}</h4><p>${esc(r.playbill.body)}</p><details class="o-updetail"><summary>Read ${esc(release(r).manifest.title)}</summary>${release(r).manifest.body.split('\n\n').map(p=>`<p>${esc(p)}</p>`).join('')}</details>`).join('')}</details>`;
      html+=`<details class="o-updetail"><summary>Read the play</summary>${manifest.body.split('\n\n').map(p=>`<p>${esc(p)}</p>`).join('')}</details><p>Reserved letters: ${total}. Only actual typing after introduction while working counts. Rewards, garden, conversions and released letters stay ordinary. Reserved letters survive progression resets, including stock from unowned desks. Release returns unspent letters once and permanently loses freshness. Consumed letters are never refunded.</p>`;
      if(w)html+=w.trays.map((p,i)=>`<p>Desk ${i+1}${s.desks[i].owned?'':' (unowned)'} reserved: ${Object.entries(p).map(([ch,n])=>`${ch}:${n}`).join(' ')||'empty'}</p>`).join('');
      html+=`<p>Typing and automatic progress use the ordinary short save window. Explicit actions and the once-only signature require acknowledged saves. Works automatic typists: ${list.length<=1?(w?.signed?'+1 percentage point':'no signed benefit'):list.filter(r=>r.signed).length+' percentage points'}; family cap 7 points.</p>${notice?`<p role="status">${esc(notice)}</p>`:''}</section>`;c.morph(pane,html);
    }catch(e){c.morph(pane,'<section class="o-card layers"><h3>Works unavailable</h3><p>Unsupported Works save. Preserve it for recovery.</p></section>');}
  }
  if(enabled)(window.__OPS_EXTENSIONS??=[]).push(['works-play',{tab:['works-play','','Works','Seven monkey adaptations','Works',true],visible:c=>!!c.state().meta.works||c.state().printing>=3,init:(_r,c)=>{api=c;},render,actions:{
    introduce:()=>confirm('introduce',!current(api.state())?'Introduce your first permanent play with empty fresh trays. Complete 100 ordered editions: 1,000 ordinary letters, then 99,000 genuinely new typed letters. Sign manually afterward for +1 percentage point automatic typist rate and Playbill 1. Pre-introduction stock and away output cannot count as fresh.':'Introduce the next permanent play with empty fresh trays. Complete 100 ordered editions: 1,000 ordinary letters, then 99,000 genuinely new typed letters. Sign manually afterward for +1 percentage point automatic typist rate and its numbered Playbill. Pre-introduction stock and away output cannot count as fresh.'),
    work:()=>act('work'),pause:()=>act('pause'),advance:()=>act('advance'),sign:()=>act('sign'),
    release:()=>confirm('release','Return every unspent reserved letter to its producing drawer once, including unowned desks. Fresh status is permanently lost. Consumed letters are not refunded. Permanent progress remains. Work pauses.'),
    continue:()=>{if(current(api.state())?.working)act('pause');if(!current(api.state())?.working){notice=continueMessage(api.state());api.setTab('floor');if(notice)api.worksPlayContinue();}}
  }}]);
  return {enabled,manifest:copy(manifest),descriptor:copy(descriptor),identity,current,retained,factor,active,eligible,snapshot,remaining,plan,advance,route,floors,proposal,exit,commandContent,continueMessage};
})();
