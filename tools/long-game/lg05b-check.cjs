const fs=require('node:fs'), assert=require('node:assert/strict'), crypto=require('node:crypto');
const pp=require('C:/Users/arran/pp/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js');
const out='docs/plan/long-game/evidence/LG-05/implementation-imprints-r1', run=process.argv[2];
assert(/^[a-z0-9-]+$/.test(run));
const write=(name,x)=>fs.writeFileSync(`${out}/${run}-${name}.json`,JSON.stringify(x,null,2),{flag:'wx'});
(async()=>{
 const browser=await pp.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const checks=[],errors=[],loaded={},reads=[];
 try {
  const context=await browser.createBrowserContext(),page=await context.newPage();
  await page.setBypassServiceWorker(true);await page.setCacheEnabled(false);
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{const f=new URL(r.url()).pathname.slice(1);if(['layers.js','folio.js','ops.js','rewards.js','core.js','economy.js'].includes(f))reads.push(r.buffer().then(b=>loaded[f]=crypto.createHash('sha256').update(b).digest('hex')));});
  const base='http://127.0.0.1:8393/', flags='?lg01a=1&lg05folio=1&lg05layers=1&pg01=1&pg02=1#play';
  await page.goto(base+'index.html');
  const fixture=await page.evaluate(()=>IMI.ops.dev.S());
  fixture.intro={...fixture.intro,done:true,train:true,words:true,shop:true};fixture.printing=7;fixture.lastSeen=Date.now();
  fixture.awards=Object.fromEntries([...fs.readFileSync('ops.js','utf8').matchAll(/AW\('([^']+)',/g)].map(m=>[m[1],true]));
  fixture.legacy={stars:17,total:60,ups:{seed:1,crew:1,speed:2,sales:1,golden:1},futureLegacy:'retain'};
  fixture.chDone={vowel:true,hands:true};fixture.gold=3;fixture.best=51;fixture.daily={last:new Date().toLocaleDateString('en-CA'),streak:4,future:'daily'};
  fixture.futureTop={opaque:['retain',73]};fixture.looks={v30:1};
  fixture.meta={future:{opaque:'retain-meta'},minigames:{version:1,wallet:17,fraction:.375,attempts:2,refillAt:Date.now(),nextSession:9,active:null,settled:7,tree:{typing:1},future:'retain-mg'},
   automation:{version:1,desks:{bamboo:{enabled:false,reservePercent:35}},tiers:{version:1,hire:2},future:'retain-helper'},
   productionGoal:{version:1,enabled:true,band:0,collection:'authored',advance:false,manual:null,future:'retain-pg'},trainingPool:{version:1,enabled:true,future:'retain-training'}};
  const seed=await page.evaluateOnNewDocument(s=>{localStorage.setItem('imi-ops-v1',JSON.stringify(s));localStorage.setItem('imi-score',JSON.stringify({economyVersion:1,score:123456,futureWallet:'retain-wallet'}));},fixture);
  const ready=()=>page.waitForFunction(()=>window.IMI?.ops?.progression?.running()&&Rewards.owns());
  await page.goto(base+'index.html'+flags);await ready();await page.removeScriptToEvaluateOnNewDocument(seed.identifier);
  const initial=await page.evaluate(()=>({state:IMI.ops.dev.S(),wallet:IMI.bananas.get()}));write('fixture',initial);
  checks.push(...await page.evaluate(()=>{
   const checks=[],ok=(v,m)=>{if(!v)throw Error(m);checks.push(m);},s=()=>IMI.ops.dev.S();
   window.layer=(action,extra={})=>Rewards.layerAction({action,expected:JSON.parse(JSON.stringify(s().meta.layers??null)),...extra});
   window.folio=(action,extra={})=>Rewards.folioAction({action,expected:JSON.parse(JSON.stringify(s().meta.folio??null)),...extra});
   s().legacy.total=59;ok((()=>{try{Layers.quote(s());return false;}catch{return true;}})(),'T59 refuses despite displayed Printing8');s().legacy.total=60;
   s().printing=6;ok((()=>{try{Layers.quote(s());return false;}catch{return true;}})(),'displayed Printing7 refuses');s().printing=7;
   s().challenge={id:'vowel'};ok((()=>{try{Layers.quote(s());return false;}catch{return true;}})(),'active challenge blocks foundation');s().challenge=null;
   s().meta.minigames.active={id:9};ok((()=>{try{Layers.quote(s());return false;}catch{return true;}})(),'active saved break blocks foundation');s().meta.minigames.active=null;
   const selection={id:'pocket',leaves:[0,1],reward:{kind:'cash'}};
   ok(folio('choose',{selection}).ok,'prepare neutral Folio provenance through accepted real commands');s().bank={THE:2,APE:1,CAP:1};
   ok(folio('prepare').ok,'acknowledged neutral cash binding creates historical marker');
   ok(!s().meta.layers,'neutral Folio does not initialize layers or backfill stamp');
   s().written={ape:true};s().editions={ape:2,unknownEdition:8};s().bank={THE:12};s().run.earned=987654;
   s().desks[1].owned=true;s().desks[1].paws=0;s().desks[1].keeper.on=false;
   s().desks[0].futureDesk='retain-desk';s().desks[0].up.futureUpgrade='retain-up';s().desks[0].keeper.futureKeeper='retain-keeper';
   s().desks[0].letters={Z:999};s().desks[0].up.fing=2;s().desks[0].keeper.on=false;
   s().pitches=[{id:'lg05b-pitch',title:'The ape.',text:'The ape.',pay:6250}];
   s().rewards.claims['future:claim']={opaque:'retain-claim'};
   window.retained=JSON.parse(JSON.stringify({legacy:s().legacy,prem:s().prem,claims:s().rewards.claims,storedGold:s().rewards.storedGold,
    stats:s().stats,awards:s().awards,chDone:s().chDone,daily:s().daily,meta:s().meta,pitches:s().pitches,gold:s().gold,best:s().best,
    royTotal:s().royTotal,divTotal:s().divTotal,futureTop:s().futureTop,marker:IMI.bananas.acknowledgement()}));
   const q=Layers.quote(s());ok(q.seals===2&&q.delta===60,'actual gate computes D60 -> 2 Seals, excludes pending run income');
   window.offer=IMI.ops.extensions.layerPreview();ok(offer.reward.kind==='L'&&offer.reward.desk===0&&offer.reward.amount===Math.floor(Math.max(50,Math.min(5000,180*offer.reward.rate))),'first L0 locks projected Bamboo productive basis');
   IMI.ops.extensions.setTab('imprints');return checks;
  }));
  await page.setViewport({width:360,height:560});await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
  await page.waitForSelector('[data-act="layers:preview"]');await page.click('[data-act="layers:preview"]');
  await page.waitForSelector('.layer-confirm');await page.screenshot({path:`${out}/${run}-pixel-confirm-360.png`});
  write('confirm-geometry',await page.evaluate(()=>({pageScroll:document.documentElement.scrollHeight>innerHeight,details:(()=>{const x=document.querySelector('.layer-details');return {height:x.clientHeight,scroll:x.scrollHeight};})(),buttons:[...document.querySelectorAll('.layer-confirm button')].map(x=>({text:x.textContent,height:x.getBoundingClientRect().height}))})));
  await page.evaluate(()=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='imi-ops-v1'&&JSON.parse(v).meta?.layers?.count===1)throw Error('LG05B controlled final reset write refusal');return original.call(this,k,v);};window.restoreStorage=()=>Storage.prototype.setItem=original;});
  await page.click('[data-found]');
  const failure=await page.evaluate(()=>({held:Rewards.held(),running:IMI.ops.progression.running(),state:IMI.ops.dev.S(),wallet:IMI.bananas.get(),durable:JSON.parse(localStorage.getItem('imi-ops-v1')),savedWallet:JSON.parse(localStorage.getItem('imi-score')),retained}));
  write('mid-reset-first-refusal',failure);assert(failure.held&&!failure.running);assert(failure.state.meta.layers.pending);assert.equal(failure.wallet,25000);assert.deepEqual(failure.savedWallet.rewardMarker,failure.retained.marker);
  assert.deepEqual(failure.state.meta.layers.pending.candidate.stats,failure.state.stats);
  const retained=failure.retained; retained.stats=failure.state.stats;
  // Keep the same targeted refusal through startup, then exercise the real Retry button.
  const refusal=await page.evaluateOnNewDocument(()=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='imi-ops-v1'&&JSON.parse(v).meta?.layers?.count===1)throw Error('LG05B controlled reload final write refusal');return original.call(this,k,v);};window.restoreStorage=()=>Storage.prototype.setItem=original;});
  await page.reload();await page.waitForFunction(()=>window.Rewards?.held());
  write('reload-held',await page.evaluate(()=>({held:Rewards.held(),state:IMI.ops.dev.S(),wallet:IMI.bananas.get()})));
  await page.removeScriptToEvaluateOnNewDocument(refusal.identifier);await page.evaluate(()=>restoreStorage());await page.click('.o-writer-status button');await ready();
  checks.push(...await page.evaluate(retained=>{
   const checks=[],ok=(v,m)=>{if(!v)throw Error(m);checks.push(m);},s=()=>IMI.ops.dev.S(),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
   window.layer=(action,extra={})=>Rewards.layerAction({action,expected:JSON.parse(JSON.stringify(s().meta.layers??null)),...extra});
   window.folio=(action,extra={})=>Rewards.folioAction({action,expected:JSON.parse(JSON.stringify(s().meta.folio??null)),...extra});
   ok(s().printing===0&&s().run.earned===0&&s().meta.layers.count===1&&s().meta.layers.baseline===60&&s().meta.layers.seals===2&&!s().meta.layers.pending,'reload Retry publishes one Imprint, baseline60, two Seals and Printing1');
   ok(IMI.bananas.get()===25000&&same(IMI.bananas.acknowledgement(),retained.marker),'exact Seed Money replacement excluded from income; wallet marker unchanged');
   for(const key of ['legacy','prem','awards','chDone','daily','pitches','gold','best','royTotal','divTotal','futureTop'])ok(same(s()[key],retained[key]),`retention ${key}`);
   for(const [key,value]of Object.entries(retained.stats))ok(['secs','playSecs','letters','byLetter'].includes(key) ? true : same(s().stats[key],value),`retained statistic ${key}`);
   ok(s().stats.secs>=retained.stats.secs&&s().stats.playSecs>=retained.stats.playSecs,'play clocks retain elapsed pre-confirmation time');
   for(const key of ['future','minigames','automation','productionGoal','trainingPool'])ok(same(s().meta[key],retained.meta[key]),`retention meta.${key}`);
   for(const [id,c]of Object.entries(retained.claims))ok(same(s().rewards.claims[id],c),`retained claim ${id}`);
   ok(same(s().rewards.storedGold,retained.storedGold),'stored gold receipt retention');
   ok(s().editions.ape===3&&s().editions.unknownEdition===8&&Object.keys(s().written).length===0,'written rolls into editions once; earlier unknown edition retained');
   ok(s().desks.filter(d=>d.owned).length===1&&s().desks[0].paws===2&&s().hold&&s().desks[0].up.fing===0&&Object.keys(s().bank).length===0,'room reset with existing Veteran Crew starters');
   ok(s().desks[0].futureDesk==='retain-desk'&&s().desks[0].up.futureUpgrade==='retain-up'&&s().desks[0].keeper.futureKeeper==='retain-keeper','unknown desk upgrade and keeper state retained');
   const c=s().rewards.claims['layer:imprint:first'];window.firstClaim=JSON.parse(JSON.stringify(c));
   ok(c.status==='committed'&&Object.values(s().desks[0].letters).reduce((a,b)=>a+b,0)===c.descriptor.amount,'first Letters delivered once through real balanced inventory path');
   ok(s().meta.folio.imprint===1&&s().meta.folio.printing===0&&Object.keys(s().meta.folio.completed).length===0&&s().meta.folio.gallery.pocket.count===1,'Folio new run clears work/completions and retains gallery');
   ok(!Layers.active(s())&&Object.keys(s().meta.layers.stamps).length===0,'pre-press neutral and no historical stamp backfill');
   ok(!layer('buy',{id:'charter'}).ok&&s().meta.layers.seals===2,'charter prerequisite refuses without spend or grant');
   ok(layer('buy',{id:'press'}).ok&&s().meta.layers.purchases.press&&s().meta.layers.seals===1,'atomic one-Seal Genre press');
   const stale={action:'buy',id:'press',expected:JSON.parse(JSON.stringify(s().meta.layers))};
   ok(!Rewards.layerAction(stale).ok&&s().meta.layers.seals===1,'duplicate purchase refuses without spend');
   ok(layer('genre',{id:'mystery'}).ok&&Layers.active(s()).id==='mystery','manual mystery genre choice works');
   ok(!layer('genre',{id:'poetry'}).ok&&s().meta.layers.genre==='mystery','genre locked for this Imprint');
   s().meta.layers.seals=0;const balance=JSON.stringify(s().meta.layers);ok(!layer('buy',{id:'charter'}).ok&&JSON.stringify(s().meta.layers)===balance,'insufficient Seal balance refuses with no free grant');s().meta.layers.seals=1;
   ok(layer('buy',{id:'charter'}).ok&&s().meta.layers.seals===0&&Layers.charter(s()),'one-Seal Folio charter is functional at Printing1');
   ok(!layer('buy',{id:'mixed'}).ok&&!s().meta.layers.purchases.mixed,'mixed shelf never purchasable');
   const selection={id:'pocket',leaves:[0,1],reward:{kind:'cash'}};
   ok(folio('choose',{selection}).ok,'charter opens actual Folio choice at Printing1');s().bank={THE:2,APE:1,CAP:1};
   ok(folio('prepare').ok&&s().meta.layers.stamps.mystery,'actual acknowledged cash bind earns active mystery stamp');
   ok(s().meta.folio.cashHead.id==='folio:1:0:pocket'&&s().meta.folio.gallery.pocket.count===2,'Imprint-specific Folio cash identity and gallery');
   ok(!folio('prepare').ok&&s().meta.folio.gallery.pocket.count===2,'duplicate bind does not stamp or pay twice');
   window.afterFirst=JSON.parse(JSON.stringify({claim:firstClaim,stamps:s().meta.layers.stamps,prem:s().prem}));
   return checks;
  },retained));
  write('first-foundation',await page.evaluate(()=>({state:IMI.ops.dev.S(),wallet:IMI.bananas.get()})));
  await page.reload();await ready();
  checks.push(...await page.evaluate(()=>{
   const checks=[],ok=(v,m)=>{if(!v)throw Error(m);checks.push(m);},s=()=>IMI.ops.dev.S();
   const layer=(action,extra={})=>Rewards.layerAction({action,expected:JSON.parse(JSON.stringify(s().meta.layers??null)),...extra});
   ok(s().meta.layers.count===1&&s().meta.layers.stamps.mystery&&s().meta.layers.genre==='mystery'&&s().meta.folio.completed.pocket,'reload retains both purchases, genre, stamp and completion');
   const claim=JSON.stringify(s().rewards.claims['layer:imprint:first']),gallery=JSON.stringify(s().meta.folio.gallery),prem=JSON.stringify(s().prem);
   const printingClaim=JSON.stringify(s().rewards.claims['layer:printing:first']);s().run.earned=Economy.cash(500000);IMI.ops.dev.doPrint();
   ok(s().printing===1&&s().meta.layers.genre==='mystery'&&JSON.stringify(s().rewards.claims['layer:printing:first'])===printingClaim,'ordinary Printing retains genre and never repeats first Printing claim');document.querySelectorAll('.o-celebrate').forEach(e=>e.remove());
   s().legacy.total=119;s().printing=7;
   ok((()=>{try{Layers.quote(s());return false;}catch{return true;}})(),'second foundation excludes retained baseline: D59 refuses');
   s().legacy.total=120;s().printing=6;
   ok((()=>{try{Layers.quote(s());return false;}catch{return true;}})(),'second foundation still requires local Printing8');s().printing=7;
   const q=Layers.quote(s());ok(q.delta===60&&q.seals===2,'second foundation requires 60 newly awarded stars');
   ok(layer('found',{quote:q}).ok,'second actual foundation succeeds');
   ok(s().meta.layers.count===2&&s().meta.layers.baseline===120&&s().meta.layers.seals===2&&s().printing===0,'second foundation updates baseline and local Printing exactly once');
   ok(JSON.stringify(s().rewards.claims['layer:imprint:first'])===claim&&Object.keys(s().desks[0].letters).length===0,'second foundation never repays first Letters');
   ok(JSON.stringify(s().meta.folio.gallery)===gallery&&s().meta.layers.stamps.mystery&&JSON.stringify(s().prem)===prem,'second foundation retains gallery, stamps and DB ledger');
   ok(!s().meta.layers.genre&&layer('genre',{id:'poetry'}).ok,'next foundation allows next genre without buying press again');
   ok(!layer('found',{quote:q}).ok&&s().meta.layers.count===2,'stale foundation cannot repeat');
   const expected=[['mystery','CDELN',[1,2],'christie',108],['romance','AEHRT',[0,1],'austen',110.75],['sci-fi','JKQXZ',[4,5],'tolken',101],['horror','GHOTU',[3,4],'poe',107.5],['comedy','BFMPY',[0,3],'twain',103.125],['poetry','AEIOU',[2,5],'dick',110]];
   window.genreEvidence=[];
   for(const [id,letters,bands,muse,denom]of expected){
    const g=Layers.genres.find(g=>g.id===id);ok(g.letters===letters&&JSON.stringify(g.bands)===JSON.stringify(bands)&&g.muse===muse,`exact genre table ${id}`);
   }
   return checks;
  }));
  // Table arithmetic reads the real source constants through the actual frequency path.
  const odds=await page.evaluate(()=>{
   const s=IMI.ops.dev.S(),d=IMI.ops.dev,rows=[];
   for(const g of Layers.genres){s.meta.layers.genre=g.id;s.desks[0].up.vowel=0;const ordinary=d.layerOfflineDist(s.desks[0],0);s.challenge={id:'vowel'};const drought=d.layerOfflineDist(s.desks[0],0);s.challenge=null;
    rows.push({id:g.id,ordinary,drought,weights:(()=>{s.challenge=null;return d.layerFrequency();})(),sale:Layers.saleFactor(s,g.bands[0],()=>false),muse:Layers.saleFactor(s,g.bands[0],id=>id===g.muse),other:Layers.saleFactor(s,[0,1,2,3,4,5].find(b=>!g.bands.includes(b)),()=>false)});}
   s.meta.layers.genre='poetry';return rows;
  });write('odds',odds);
  for(const row of odds){for(const probabilities of [row.ordinary,row.drought]){assert(Object.values(probabilities).every(x=>x>0));assert(Math.abs(Object.values(probabilities).reduce((a,b)=>a+b,0)-1)<1e-12);}const denominator=Object.values(row.weights).reduce((a,b)=>a+b,0);for(const [ch,w]of Object.entries(row.weights))assert(Math.abs(row.ordinary[ch]-w/denominator)<1e-12);assert.equal(denominator,({mystery:108,romance:110.75,'sci-fi':101,horror:107.5,comedy:103.125,poetry:110})[row.id]);assert.equal(row.sale,1.15);assert.equal(row.muse,1.15*1.05);assert.equal(row.other,.95);}
  checks.push('all six actual away distributions positive and normalized, Vowel Drought supported; exact sale/Muse factors');
  const boundary=await page.evaluate(()=>{
   const s=IMI.ops.dev.S(),d=IMI.ops.dev,checks=[],ok=(v,m)=>{if(!v)throw Error(m);checks.push(m);};
   const authored=d.RECIPES.filter(r=>!r.kid&&!r.lib&&!r.gen);s.written=Object.fromEntries(authored.slice(0,3).map(r=>[r.id,true]));s.muses={owned:{christie:true},seated:['christie',null,null]};s.market.v=s.market.v.map(()=>.01);s.meta.layers.genre='mystery';
   const r={pay:1234567,band:1},floor=d.marketMult(1),roy=d.royBase(),sale=d.salePay(r),expected=Economy.round(r.pay*(1+.01*Object.keys(s.awards).length)*floor*(1+.05*s.desks[1].mk)*(1+.02*s.legacy.total)*(1+.1*(s.legacy.ups.sales||0))*(1+.35*s.printing)*1.15*1.05);
   ok(sale===expected,'actual sale applies demand and usable matching Muse after market floor with one final round');
   s.meta.layers.genre='poetry';ok(d.royBase()===roy,'genre leaves actual royalty path unchanged');
   s.meta.layers.genre='mystery';s.written={};ok(d.salePay(r)===Economy.round(r.pay*(1+.01*Object.keys(s.awards).length)*floor*(1+.02*s.legacy.total)*(1+.1*(s.legacy.ups.sales||0))*1.15),'unusable Muse seat supplies no genre fit bonus');
   const F=d.layerFrequency();s.desks[0].up.vowel=2;const away=d.layerOfflineDist(s.desks[0],0);
   return {checks,floor,sale,expected,roy,frequency:F,vowelAway:away};
  });write('boundaries',boundary);checks.push(...boundary.checks);
  await page.evaluate(()=>{const s=IMI.ops.dev.S();s.meta.layers.genre=null;IMI.ops.saveAcknowledged();});
  const geometry=[];
  for(const shell of ['index.html','classic.html']){
   await page.goto(base+shell+flags);await ready();await page.evaluate(()=>IMI.ops.extensions.setTab('imprints'));
   await page.waitForSelector('.layers');await page.$eval('[data-act="layers:genre"]',el=>el.scrollIntoView({block:'center'}));
   await page.screenshot({path:`${out}/${run}-${shell.split('.')[0]}-genre-360.png`});
   geometry.push(await page.evaluate(()=>({style:IMI.edition,pageScroll:document.documentElement.scrollHeight>innerHeight,buttons:[...document.querySelectorAll('.layers button')].filter(x=>!x.disabled).map(x=>({text:x.textContent,height:x.getBoundingClientRect().height})),panes:[...document.querySelectorAll('.o-pane')].filter(x=>!x.hidden&&x.clientHeight).map(x=>({height:x.clientHeight,scroll:x.scrollHeight}))})));
   await page.evaluate(()=>{const s=IMI.ops.dev.S();s.printing=7;s.legacy.total=180;IMI.ops.extensions.setTab('imprints');});
   await page.waitForSelector('[data-act="layers:preview"]:not(:disabled)');await page.click('[data-act="layers:preview"]');await page.waitForSelector('.layer-confirm');
   await page.screenshot({path:`${out}/${run}-${shell.split('.')[0]}-confirm-360.png`});await page.click('[data-cancel]');
   await page.evaluate(()=>{const s=IMI.ops.dev.S();s.printing=0;s.legacy.total=120;IMI.ops.saveAcknowledged();});
  }
  write('geometry',geometry);for(const g of geometry){assert(!g.pageScroll);assert(g.buttons.every(b=>b.height>=40));}
  await reads.reduce((p,q)=>p.then(()=>q),Promise.resolve());
  const final=await page.evaluate(()=>({state:IMI.ops.dev.S(),wallet:IMI.bananas.get(),savedWallet:JSON.parse(localStorage.getItem('imi-score'))}));
  assert.equal(final.savedWallet.futureWallet,'retain-wallet');assert.deepEqual(errors,[]);
  write('result',{checks,errors,loaded,final,limits:'Controlled fixtures. No natural calendar or physical-device claim.'});console.log(`${checks.length} bounded checks PASS`);
 }catch(error){write('failure',{checks,errors,loaded,error:error.stack});throw error;}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
