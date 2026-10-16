const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto'),vm=require('node:vm');
const pp=require('C:/Users/arran/pp/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js');
const out='docs/plan/long-game/evidence/LG-05/implementation-shelf-r1',run=process.argv[2];
assert(/^[a-z0-9-]+$/.test(run));
const write=(name,x)=>fs.writeFileSync(`${out}/${run}-${name}.json`,JSON.stringify(x,null,2),{flag:'wx'});
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
(async()=>{
 const result={checks:[],errors:[],loaded:{},fixture:'Controlled native Core save. Genre stamps are seeded earned-stamp fixtures, not evidence of natural earning.'};
 const check=(v,m)=>{assert(v,m);result.checks.push(m);};
 const sandbox={window:{},location:{search:''},URLSearchParams};vm.runInNewContext(fs.readFileSync('layers.js','utf8'),sandbox);
 check(sandbox.window.Layers.saleFactor({meta:{layers:{version:99}}},0,()=>true)===1,'Default disabled saleFactor is exactly 1, even for unsupported dormant data');
 const browser=await pp.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const base=`http://127.0.0.1:${JSON.parse(fs.readFileSync(`${out}/server.json`)).port}/`,flags='?lg01a=1&lg05folio=1&lg05layers=1#play';
 try {
  const context=await browser.createBrowserContext(),page=await context.newPage(),reads=[];
  await page.setBypassServiceWorker(true);await page.setCacheEnabled(false);await page.setViewport({width:360,height:560});await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
  page.on('pageerror',e=>result.errors.push(e.message));
  page.on('response',r=>{const f=new URL(r.url()).pathname.slice(1);if(['layers.js','layers.css','folio.js','ops.js','rewards.js','core.js','economy.js'].includes(f))reads.push(r.buffer().then(b=>result.loaded[f]=hash(b)));});
  await page.goto(base+'index.html');
  const fixture=await page.evaluate(()=>IMI.ops.dev.S());
  fixture.intro={...fixture.intro,done:true,train:true,words:true,shop:true};fixture.lastSeen=Date.now();fixture.printing=0;
  fixture.awards=Object.fromEntries([...fs.readFileSync('ops.js','utf8').matchAll(/AW\('([^']+)',/g)].map(m=>[m[1],true]));
  fixture.meta.layers={version:1,count:1,baseline:60,seals:2,highestPrinting:8,purchases:{press:true,charter:true},genre:'mystery',stamps:{mystery:true,horror:true,romance:true,poetry:true},futureShelf:{keep:73}};
  fixture.meta.futureShelf='retain';fixture.legacy.total=60;
  fixture.rewards.claims={...fixture.rewards.claims,'layer:imprint:first':JSON.parse(fs.readFileSync('docs/plan/long-game/evidence/LG-05/implementation-imprints-r1/final-r2-result.json')).final.state.rewards.claims['layer:imprint:first']};
  const seed=await page.evaluateOnNewDocument(s=>{localStorage.setItem('imi-ops-v1',JSON.stringify(s));localStorage.setItem('imi-score',JSON.stringify({economyVersion:1,score:123456,futureWallet:'retain'}));},fixture);
  const ready=async()=>{try{await page.waitForFunction(()=>window.Rewards?.owns()&&IMI.ops.progression.running(),{timeout:12000});}catch(e){write('ready-failure',await page.evaluate(()=>({text:document.body.innerText,held:window.Rewards?.held(),owns:window.Rewards?.owns(),gate:window.VaultSaveGate?.blocked,state:window.IMI?.ops?.dev.S()})));throw e;}};
  await page.goto(base+'index.html'+flags);await ready();await page.removeScriptToEvaluateOnNewDocument(seed.identifier);
  const initial=await page.evaluate(()=>{
   const s=IMI.ops.dev.S(),copy=x=>JSON.parse(JSON.stringify(x));window.layer=(action,id)=>Rewards.layerAction({action,id,expected:copy(IMI.ops.dev.S().meta.layers)});
   const original=copy(s.meta.layers),fail=[];
   delete s.meta.layers.purchases.charter;fail.push(layer('buy','shelf'));s.meta.layers=copy(original);
   s.meta.layers.seals=1;fail.push(layer('buy','shelf'));s.meta.layers=copy(original);
   fail.push(layer('slot','mystery'));
   const stale=copy(s.meta.layers);stale.seals=3;fail.push(Rewards.layerAction({action:'buy',id:'shelf',expected:stale}));
   const folio=Rewards.folioAction({action:'choose',expected:null,selection:{id:'pocket',leaves:[0,1],reward:{kind:'cash'}}});
   const work=Rewards.folioAction({action:'work',expected:copy(s.meta.folio)}),f=copy(s.meta.folio);
   const originalWrite=Storage.prototype.setItem;window.restoreShelfWrite=()=>Storage.prototype.setItem=originalWrite;
   Storage.prototype.setItem=function(k,v){if(k==='imi-ops-v1'&&JSON.parse(v).meta?.layers?.purchases?.shelf)throw Error('LG05C deliberate shelf purchase write refusal');return originalWrite.call(this,k,v);};
   const refused=layer('buy','shelf');return {fail,folio,work,f,refused,live:copy(s.meta.layers),saved:JSON.parse(localStorage.getItem('imi-ops-v1')).meta.layers,held:Rewards.held()};
  });write('first-refusal',initial);
  check(initial.fail.every(x=>!x.ok)&&initial.folio.ok&&initial.work.ok,'Prerequisite, insufficient, unowned-slot and stale requests refuse; existing Folio work starts');
  check(!initial.refused.ok&&initial.held&&!initial.live.purchases.shelf&&initial.live.seals===2&&!initial.saved.purchases.shelf,'Failed acknowledged purchase grants nothing and debits nothing');
  await page.evaluate(()=>restoreShelfWrite());await page.click('.o-writer-status button');await ready();
  const purchase=await page.evaluate(()=>({l:IMI.ops.dev.S().meta.layers,f:IMI.ops.dev.S().meta.folio,duplicate:layer('buy','shelf')}));
  check(purchase.l.purchases.shelf&&purchase.l.seals===0&&!purchase.duplicate.ok,'Real Retry buys once for exactly two current Seals; duplicate refuses');assert.deepEqual(purchase.f,initial.f);
  const cases=await page.evaluate(()=>{
   const s=IMI.ops.dev.S(),l=s.meta.layers,copy=x=>JSON.parse(JSON.stringify(x)),before=copy(l),rows=[];
   for(const slots of [[],['mystery'],['mystery','horror'],['mystery','romance','poetry'],['mystery','horror','romance'],['mystery','romance']]){l.shelf=slots;rows.push({slots,bonus:Layers.shelfBonus(s),factor:Layers.saleFactor(s,1,()=>true)});}s.meta.layers=before;
   const commands=[layer('slot','mystery'),layer('slot','horror'),layer('slot','mystery'),layer('slot','sci-fi'),layer('slot','romance'),layer('slot','poetry'),layer('slot','invalid')];
   const saved=copy(s.meta.layers),bad=[];
   for(const mutate of [x=>x.version=2,x=>x.purchases.shelf='yes',x=>x.shelf=['mystery','mystery'],x=>x.shelf=['sci-fi'],x=>x.shelf=['mystery','horror','romance','poetry']]){const x=copy(saved);mutate(x);s.meta.layers=x;const raw=JSON.stringify(x);bad.push({factor:Layers.saleFactor(s,1,()=>true),edit:layer('clear'),preserved:JSON.stringify(s.meta.layers)===raw});}s.meta.layers=saved;
   const neutral=copy(s);neutral.meta.layers.genre=null;
   const noPair=copy(s);noPair.meta.layers.stamps.comedy=true;noPair.meta.layers.shelf=['mystery','romance','comedy'];
   return {rows,commands,bad,l:s.meta.layers,neutralFactor:Layers.saleFactor(neutral,1,()=>false),noPair:Layers.shelfBonus(noPair),f:s.meta.folio};
  });write('cases',cases);
  assert.deepEqual(cases.rows.map(x=>x.bonus),[0,0,.05,.1,.1,0]);check(cases.noPair===.05&&cases.neutralFactor===1.1,'Exact additive empty/one/two/pair/three cases, cap 10%, and neutral active genre retains shelf effect');
  check(cases.commands.map(x=>x.ok).join(',')==='true,true,false,false,true,false,false'&&cases.bad.every(x=>x.factor===1&&!x.edit.ok&&x.preserved),'Reject duplicate, unearned, fourth, invalid and unsupported saves without mutation');assert.deepEqual(cases.f,initial.f);
  const boundary=await page.evaluate(()=>{
   const s=IMI.ops.dev.S(),d=IMI.ops.dev,r=d.RECIPES.find(r=>!r.kid&&!r.lib&&r.band===0),oldShelf=s.meta.layers.shelf;
   s.written[r.id]=true;const royalty=d.royBase();s.meta.layers.shelf=[];const royaltyWithout=d.royBase(),without=d.salePay(r,1);s.meta.layers.shelf=oldShelf;delete s.written[r.id];
   const withShelf=d.salePay(r,1),run=s.run.earned,wallet=IMI.bananas.get();s.bank={...r.need};d.touchBank();d.writeTitle(r.id);
   const sold={run:s.run.earned-run,wallet:IMI.bananas.get()-wallet,written:!!s.written[r.id]};
   s.bank={THE:2,APE:1,CAP:1};d.touchBank();const before=IMI.bananas.get(),f=Rewards.folioAction({action:'prepare',expected:JSON.parse(JSON.stringify(s.meta.folio))});
   return {royalty,royaltyWithout,without,withShelf,sold,folio:f,folioPaid:IMI.bananas.get()-before,stamp:s.meta.layers.stamps,unknown:s.meta.layers.futureShelf};
  });write('boundaries',boundary);
  check(boundary.royalty===boundary.royaltyWithout&&boundary.withShelf>boundary.without,'Actual shared sale quote increases; actual royalty path is unchanged');
  check(boundary.sold.written&&boundary.sold.wallet===boundary.sold.run&&boundary.sold.run>0,'Actual native title sale pays wallet and run earnings once');
  check(boundary.folio.ok&&boundary.folioPaid===6250,'Actual Folio binding still pays exactly 6250 with 10% shelf');
  await page.reload();await ready();
  const retained=await page.evaluate(()=>({l:IMI.ops.dev.S().meta.layers,folio:IMI.ops.dev.S().meta.folio,unknown:IMI.ops.dev.S().meta.futureShelf}));
  check(retained.l.seals===0&&retained.l.shelf.join(',')==='mystery,horror,romance'&&retained.folio.completed.pocket&&retained.unknown==='retain','Ordinary reload retains purchase, slots, stamp fixture, Folio completion and unknown sentinel');
  const retention=await page.evaluate(()=>{
   const layer=(action,id)=>Rewards.layerAction({action,id,expected:JSON.parse(JSON.stringify(IMI.ops.dev.S().meta.layers))});
   const d=IMI.ops.dev,s=d.S(),before=JSON.parse(JSON.stringify(s.meta.layers));s.run.earned=Economy.cash(500000);d.doPrint();
   const printed=JSON.parse(JSON.stringify(d.S().meta.layers)),state=d.S();state.printing=7;state.legacy.total=120;
   const fresh=JSON.parse(JSON.stringify(state)),projected=Layers.project(state,fresh);
   const controls={remove:layer('remove','horror'),clear:layer('clear'),a:layer('slot','romance'),b:layer('slot','mystery')};
   return {before,printed,projected:projected.meta.layers,controls,after:d.S().meta.layers};
  });write('retention',retention);
  assert.deepEqual(retention.printed,retention.before);assert.deepEqual(retention.projected.shelf,retention.before.shelf);assert.deepEqual(retention.projected.stamps,retention.before.stamps);assert.deepEqual(retention.projected.purchases,retention.before.purchases);
  check(Object.values(retention.controls).every(x=>x.ok)&&retention.after.seals===0,'Actual Printing and actual foundation projector retain shelf; acknowledged remove/clear/reorder costs no Seals');
  result.geometry=[];
  for(const shell of ['index.html','classic.html']){
   await page.goto(base+shell+flags);await ready();await page.evaluate(()=>IMI.ops.dev.action('go',{tab:'folio'}));await page.waitForSelector('[data-act="folio:shelf"]',{visible:true});
   await page.evaluate(()=>new Promise(r=>setTimeout(r,350)));await page.click('[data-act="folio:shelf"]');try{await page.waitForSelector('.layer-shelf',{visible:true,timeout:5000});}catch(e){write('ui-failure',await page.evaluate(()=>{const b=document.querySelector('[data-act="folio:shelf"]'),r=b.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);const before={text:document.body.innerText,tab:IMI.ops.dev.ui.tab,state:IMI.ops.dev.S(),wallet:JSON.parse(localStorage.getItem('imi-score')),hit:hit?.outerHTML,running:IMI.ops.progression.running(),visible:IMI.ops.dev.tabVisible('imprints')};Layers.openShelf();return {...before,directTab:IMI.ops.dev.ui.tab,directText:document.body.innerText};}));await page.screenshot({path:`${out}/${run}-ui-failure.png`});throw e;}
   await page.screenshot({path:`${out}/${run}-${shell}-360.png`});
   result.geometry.push(await page.evaluate(()=>{const p=document.querySelector('#o-imprints'),card=p.querySelector('.layer-shelf');return {style:document.documentElement.dataset.style,bodyScroll:document.documentElement.scrollHeight>innerHeight,horizontal:document.documentElement.scrollWidth>innerWidth,pane:{height:p.clientHeight,scrollHeight:p.scrollHeight,overflow:getComputedStyle(p).overflowY},controls:[...card.querySelectorAll('button')].map(b=>({text:b.textContent,height:b.getBoundingClientRect().height})),text:card.innerText};}));
  }
  check(result.geometry.every(g=>!g.bodyScroll&&!g.horizontal&&g.pane.scrollHeight>g.pane.height&&g.controls.every(b=>b.height>=40)),'Both styles at 360x560 use internal panes and >=40px shelf controls, with no page scroll');
  await Promise.all(reads);for(const [f,h]of Object.entries(result.loaded))assert.equal(h,hash(fs.readFileSync(f)),f+' executing identity');check(!result.errors.length,'Current loaded source hashes match disk; no browser page errors');
  write('ui-fixture',await page.evaluate(()=>({s:IMI.ops.dev.S(),w:JSON.parse(localStorage.getItem('imi-score'))})));
 } catch(e){result.failure={message:e.message,stack:e.stack};throw e;} finally{write('result',result);await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
