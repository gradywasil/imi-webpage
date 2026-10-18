const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const os=require('node:os');
const root=path.resolve(__dirname,'..');
const flags='?lgb=1&lg08print=1&lg03=1&lg01a=1&lg05folio=1&lg05layers=1&lg08estate=1#play';

// Long-game scope phase B (first slice): an old save migrates once, new effects apply, and the first reset hands out a free crew.
test('lgb migrates an old Legacy save once, applies the new tracks, and gives the crew free on Printing',async()=>{
 const puppeteer=require(process.env.PUPPETEER_MODULE||'C:/Users/arran/pp/node_modules/puppeteer-core');
 const server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost'),file=path.resolve(root,'.'+url.pathname);
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  fs.readFile(file,(err,b)=>{if(err){res.writeHead(404).end();return;}res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.svg':'image/svg+xml','.png':'image/png'})[path.extname(file)]||'application/octet-stream');res.end(b);});
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const origin=`http://127.0.0.1:${server.address().port}`;
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'legacy-b-profile-'));
 let browser;
 try{
  browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,userDataDir:profile});
  const page=await browser.newPage();page.setDefaultTimeout(15000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewport({width:1000,height:800});
  const old={economyVersion:99,lastSeen:Date.now(),intro:{version:1,done:true,train:true,words:true,shop:true,hireAt:0},stats:{letters:90000,manual:900,words:600},
   legacy:{stars:4,total:400,k:10,ups:{seed:2,speed:10,keeper:8,crew:1,sales:3}},printing:5,desks:[{owned:true,paws:0}]};
  await page.evaluateOnNewDocument(o=>{
   if(sessionStorage.getItem('seeded'))return;sessionStorage.setItem('seeded','1');
   localStorage.setItem('imi-tour','done');localStorage.setItem('imi-sound','off');localStorage.setItem('imi-fx','low');
   localStorage.setItem('imi-ops-v1',JSON.stringify(o));localStorage.setItem('imi-score',JSON.stringify({economyVersion:99,score:5e9}));
  },old);
  const ready=()=>page.waitForFunction(()=>window.IMI?.ops?.extensions?.state&&window.Rewards?.owns()&&IMI.ops.progression.running()&&!Rewards.held());
  await page.goto(origin+'/index.html'+flags);await ready();
  const spent=await page.evaluate(()=>({speed:LegacyB.spent('speed',10),keeper:LegacyB.spent('keeper',8)}));
  const migrated=await page.evaluate(()=>{const l=IMI.ops.extensions.state().legacy;return {stars:l.stars,total:l.total,ups:l.ups,refund:l.mig.ledger.refund};});
  assert.deepEqual(migrated.ups,{seed:2,speed:1,keeper:1,crew:1,sales:3});
  assert.equal(migrated.total,400,'lifetime stars are untouched');
  assert.equal(migrated.stars,4+(spent.speed-5)+(spent.keeper-5)+30,'spendable stars carry the documented refunds');
  assert.deepEqual(migrated.refund,{speed:spent.speed-5,keeper:spent.keeper-5,crew:30});
  const backup=await page.evaluate(()=>localStorage.getItem('imi-lgb-backup'));
  assert.equal(JSON.parse(backup).legacy.ups.speed,10,'the pre-migration snapshot keeps the old ranks');
  // effects: ratios against the same room with the rank removed
  const fx=await page.evaluate(()=>{
   const d=IMI.ops.dev,s=d.S();s.desks[0].paws=1;d.ensureCrew(s.desks[0]);const t=s.desks[0].crew[0],r=s.desks[1]&&s.desks[1].owned?1:0;
   const out={};
   const at=(key,rank,fn)=>{const keep=s.legacy.ups[key];s.legacy.ups[key]=rank;const v=fn();s.legacy.ups[key]=keep;return v;};
   out.press=at('speed',2,()=>d.typistSpeed(t))/at('speed',1,()=>d.typistSpeed(t));
   out.keeper=at('keeper',1,()=>d.keeperPeriod(0))/at('keeper',3,()=>d.keeperPeriod(0));
   const rec=d.RECIPES[0];
   out.power=at('power',2,()=>d.salePay(rec))/at('power',1,()=>d.salePay(rec));
   return out;
  });
  assert.ok(Math.abs(fx.press-2)<1e-9,'each Printing Press rank doubles automatic typing');
  assert.ok(Math.abs(fx.keeper-4)<.01,'two more Quick Keepers ranks bank four times faster');
  assert.ok(Math.abs(fx.power-1.5)<.02,'each Publishing Power rank pays 1.5x per sale');
  // reload: the migration does not run again
  await page.reload();await ready();
  const again=await page.evaluate(()=>{const l=IMI.ops.extensions.state().legacy;return {stars:l.stars,ups:l.ups};});
  assert.equal(again.stars,migrated.stars,'a second load refunds nothing');
  assert.deepEqual(again.ups,migrated.ups);
  // the shop: no paid crew, Publishing Power present, and its dependency enforced
  const shop=await page.evaluate(()=>{
   const a=IMI.ops.extensions,s=a.state();s.legacy.ups.speed=0;s.legacy.stars=500;s.legacy.total=500;
   IMI.ops.dev.ui.sub.legacy='upgrades';a.setTab('legacy');a.mark();
   return new Promise(r=>setTimeout(()=>{
    const text=document.body.innerText;
    const before={power:s.legacy.ups.power||0,stars:s.legacy.stars};
    try{IMI.ops.dev.action('legbuy',{id:'power'});}catch(e){/* the burst effect needs a real button; the purchase is already made */}
    r({text,power:before.power,stars:before.stars,boughtPower:s.legacy.ups.power||0,starsAfter:s.legacy.stars});
   },400));
  });
  assert.match(shop.text,/Publishing Power/,'Publishing Power is open from the first star, so it is drawn');
  assert.doesNotMatch(shop.text,/Veteran Crew/);
  assert.equal(shop.power,0);
  assert.equal(shop.stars,500);
  assert.equal(shop.boughtPower,1,'the action buys Publishing Power I with no dependencies');
  assert.equal(shop.starsAfter,490,'at its listed price of 10');
  // first Printing under lgb: a player with no paid crew still starts the next room with two typists and Hold
  const room=await page.evaluate(()=>{
   const clear=()=>document.querySelectorAll('.o-modal,.o-celebrate').forEach(e=>e.remove());
   const a=IMI.ops.extensions,s=a.state();
   s.legacy.ups={};delete s.legacy.mig.ledger.granted;s.run.earned=Economy.starBase;s.pub.on=false;s.desks.forEach(d=>{d.paws=0;d.crew=[];d.keeper.on=false;});
   const ok=Rewards.printingAction({origin:'manual',quote:a.printingReview()}).ok;clear();
   const n=IMI.ops.extensions.state();
   return {ok,crew:n.desks[0].crew.length,paws:n.desks[0].paws,hold:n.hold,owned:n.legacy.ups.crew};
  });
  assert.deepEqual(room,{ok:true,crew:2,paws:2,hold:true,owned:1});
  // Publisher Bundles: one publisher action sells 1, 2, 4 or 8 distinct finished titles by rank
  const bundle=await page.evaluate(()=>{
   const d=IMI.ops.dev,s=d.S(),out={};
   s.printing=1;s.autoFocus=true;s.focus=null;s.pub={tier:2,on:true,rule:'any'};s.sb={bundle:0};
   s.desks.forEach((x,i)=>{x.owned=i<2;});
   const ready=()=>{s.written={};const picks=d.RECIPES.filter(r=>r.band<=1&&!r.kid&&!r.lib).slice(0,40);for(const r of picks)for(const w in r.need)s.bank[w]=(s.bank[w]||0)+r.need[w];d.touchBank();};
   const wordsBefore=()=>JSON.stringify(s.bank);
   out.sold=[];out.doubleUse=false;
   for(const rank of [0,1,2,3]){
    s.sb={bundle:rank};s.bank={};ready();
    const before=Object.keys(s.written).length;
    document.querySelectorAll('.o-modal,.o-celebrate').forEach(e=>e.remove());
    d.pubSell();
    out.sold.push(Object.keys(s.written).length-before);
    if(Object.values(s.bank).some(n=>n<0))out.doubleUse=true;
   }
   // buying: priced off the next machine, refused until unlocked, and the price never reads the wallet
   s.pub={tier:1,on:true,rule:'any'};s.sb={};s.printing=0;IMI.bananas.add(Economy.cash(1e8));
   const spend=key=>{const b=IMI.bananas.get();d.buy(key);return b-IMI.bananas.get();};
   out.locked=['drive','batch','bundle'].map(k=>spend(k));out.lockedRank=Object.keys(s.sb).length;
   s.printing=1;out.spends={};
   for(const k of ['drive','batch','bundle'])out.spends[k]=[spend(k),spend(k),spend(k),spend(k)];
   out.ranks={...s.sb};out.ref=d.DESKS[2].price;
   // Machine Drive multiplies automatic typing by 1.4 per rank, on top of everything else
   s.desks[0].paws=1;d.ensureCrew(s.desks[0]);const t=s.desks[0].crew[0];
   const at=r=>{s.sb={...s.sb,drive:r};return d.typistSpeed(t);};
   out.drive=[at(1)/at(0),at(3)/at(2)];
   return out;
  });
  assert.deepEqual(bundle.sold,[1,2,4,8],'one publisher action sells 1, 2, 4 or 8 titles by rank');
  assert.equal(bundle.doubleUse,false,'no word is consumed twice');
  assert.deepEqual(bundle.locked,[0,0,0],'the run upgrades stay locked before the first Printing');
  assert.equal(bundle.lockedRank,0);
  const prices=[.10,.25,.60,0].map(p=>Math.round(p*bundle.ref/25)*25);
  for(const k of ['drive','batch','bundle'])assert.deepEqual(bundle.spends[k],prices,k+': 10%, 25% and 60% of the next machine; no fourth rank');
  assert.deepEqual(bundle.ranks,{drive:3,batch:3,bundle:3});
  assert.ok(bundle.drive.every(x=>Math.abs(x-1.4)<1e-9),'each Machine Drive rank multiplies automatic typing by 1.4');
  // the shop actually renders the three run upgrades once unlocked
  const cards=await page.evaluate(()=>{
   const a=IMI.ops.extensions,s=a.state();s.printing=1;s.pub={tier:1,on:true,rule:'any'};s.sb={};
   IMI.ops.dev.ui.sub.shop='market';a.setTab('shop');a.mark();
   return new Promise(r=>setTimeout(()=>r(document.body.innerText),500));
  });
  for(const name of ['Machine Drive','Keeper batches','Publisher bundles'])assert.match(cards,new RegExp(name),name+' card renders');
  assert.doesNotMatch(cards,/Shared dictionary|Backlist logistics/,'second-Printing upgrades stay hidden at Printing 1');
  const later=await page.evaluate(()=>{IMI.ops.extensions.state().printing=2;IMI.ops.extensions.mark();return new Promise(r=>setTimeout(()=>r(document.body.innerText),500));});
  for(const name of ['Shared dictionary','Backlist logistics'])assert.match(later,new RegExp(name),name+' card renders at Printing 2');
  assert.deepEqual(errors,[]);
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
});
