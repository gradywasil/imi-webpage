const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const os=require('node:os');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const flags='?lgb=1&lg08print=1&lg03=1&lg01a=1&lg05folio=1&lg05layers=1&lg08estate=1#play';

// Long-game scope phase F: the Annex works beside the original room, shares only the wallet, is rebuilt by Printing, and time away is settled once.
test('the Annex earns into the one wallet, spends within its allocation, is rebuilt by Printing, can hold the Foreman, and passive time is paid once',async()=>{
 const puppeteer=require(process.env.PUPPETEER_MODULE||'C:/Users/arran/pp/node_modules/puppeteer-core');
 const ctx={};ctx.window=ctx;vm.runInNewContext(fs.readFileSync(path.join(root,'campus.js'),'utf8'),ctx);
 const Campus=ctx.Campus,opened=Campus.openDeed(Campus.fresh(),{estate:1,autoCycles:10,restored:1,mastery:1}).c;
 // a crew that works fast enough to see a sale inside a short test
 opened.room.bands[0]={on:true,typists:6,keeper:6};
 opened.room.wip[0]=.95;
 opened.alloc=0;                       // no spending while we check the income
 const server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost'),file=path.resolve(root,'.'+url.pathname);
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  fs.readFile(file,(err,b)=>{if(err){res.writeHead(404).end();return;}res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.svg':'image/svg+xml','.png':'image/png'})[path.extname(file)]||'application/octet-stream');res.end(b);});
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const origin=`http://127.0.0.1:${server.address().port}`;
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'campus-profile-'));
 let browser;
 try{
  browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,userDataDir:profile});
  const page=await browser.newPage();page.setDefaultTimeout(20000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  page.on('dialog',d=>d.accept());
  await page.setViewport({width:1000,height:800});
  const fx=JSON.parse(fs.readFileSync(path.join(root,'docs/plan/long-game/evidence/LG-09/anthology-r1/confirmation-final-save.json'),'utf8'));
  const save=fx.state;save.lastSeen=Date.now();
  save.legacy.ups={...save.legacy.ups,ledger:1,buyer:1,blueprint:1,foreman:1};
  save.legacy.fm={v:1,enabled:true,policy:'fast',target:10,reserve:0,manual:true,passive:true,autoCycles:6,bp:null,order:[],route:'salvage',
   cycles:Array.from({length:5},()=>({sec:120,gain:10}))};
  save.meta.campus=opened;
  await page.evaluateOnNewDocument((o,wallet)=>{
   if(sessionStorage.getItem('seeded'))return;sessionStorage.setItem('seeded','1');
   localStorage.setItem('imi-tour','done');localStorage.setItem('imi-sound','off');localStorage.setItem('imi-fx','low');
   localStorage.setItem('imi-ops-v1',JSON.stringify(o));localStorage.setItem('imi-score',JSON.stringify(wallet));
  },save,fx.wallet);
  const ready=()=>page.waitForFunction(()=>window.IMI?.ops?.extensions?.state&&window.Rewards?.owns()&&IMI.ops.progression.running()&&!Rewards.held());
  const quiet=()=>page.evaluate(()=>setInterval(()=>document.querySelectorAll('.o-modal,.o-celebrate').forEach(e=>e.remove()),200));
  const show=tab=>page.evaluate(t=>{const a=IMI.ops.extensions;a.setTab(t);a.mark();return new Promise(r=>setTimeout(()=>r(document.body.innerText),500));},tab);
  await page.goto(origin+'/index.html'+flags);await ready();await quiet();

  // the tab shows both buildings side by side, with last output, blocked stage and next purchase
  let text=await show('campus');
  for(const sel of ['.lgx-bld.house','.lgx-bld.annex','.lgx-led','[data-act="campus:alloc"]','[data-act="campus:reserve"]','[data-act="campus:policy"][data-v="farm"]','[data-act="campus:hold"]'])assert.equal(await page.evaluate(s=>!!document.querySelector(s),sel),true,sel+' is drawn');

  // production: the Annex sells titles and the income reaches the wallet once
  const before=await page.evaluate(()=>{const s=IMI.ops.extensions.state();s.pub.on=false;return {wallet:IMI.bananas.get(),earned:s.run.earned};});
  await page.waitForFunction(()=>IMI.ops.extensions.state().meta.campus.room.earned>0,{timeout:20000});
  const made=await page.evaluate(()=>{const s=IMI.ops.extensions.state(),r=s.meta.campus.room;return {roomEarned:r.earned,wallet:IMI.bananas.get(),earned:s.run.earned,sold:r.sold.reduce((a,b)=>a+b,0)};});
  assert.ok(made.sold>=1);
  assert.ok(made.wallet>before.wallet,'the income reached the wallet');
  assert.ok(Math.abs((made.earned-before.earned)-(made.wallet-before.wallet))<=50,'every banana gained is counted as production exactly once');

  // spending: farm tops up the crew within the allocation, from the shared wallet, and not past it
  await page.evaluate(()=>{const s=IMI.ops.extensions.state();s.meta.campus={...s.meta.campus,on:false};});
  const plan=await page.evaluate(()=>{const s=IMI.ops.extensions.state(),c=s.meta.campus;
   s.meta.campus={...c,alloc:5,reserve:0,room:{...c.room,bands:c.room.bands.map((b,i)=>i===0?{on:true,typists:1,keeper:0}:b)}};
   IMI.bananas.add(Economy.cash(40000));return {wallet:IMI.bananas.get(),cost:Campus.typistCost(Math.max(IMI.ops.dev.DESKS[0].price,75000),1)};});
  await page.evaluate(()=>{const s=IMI.ops.extensions.state();s.meta.campus={...s.meta.campus,on:true};});
  await page.waitForFunction(()=>IMI.ops.extensions.state().meta.campus.room.bands[0].typists>1,{timeout:10000});
  const bought=await page.evaluate(()=>{const s=IMI.ops.extensions.state();return {wallet:IMI.bananas.get(),typists:s.meta.campus.room.bands[0].typists};});
  assert.ok(plan.wallet-bought.wallet<=plan.wallet*.05+25,'a purchase never spends past the building\'s 5% allocation');
  assert.ok(bought.typists<=3,'and it stops when the allocation runs out');

  // hold: the Annex can keep the Foreman from pressing; releasing it lets it go
  const held=await page.evaluate(()=>{const s=IMI.ops.extensions.state();s.meta.campus={...s.meta.campus,hold:true,on:false};s.legacy.fm={...s.legacy.fm,enabled:true,policy:'fast'};s.run.earned=Economy.starBase;s.fmSecs=40;return s.printing;});
  await new Promise(r=>setTimeout(r,2500));
  assert.equal(await page.evaluate(()=>IMI.ops.extensions.state().printing),held,'a hold keeps Printing from being pressed');
  await page.evaluate(()=>{const s=IMI.ops.extensions.state();s.meta.campus={...s.meta.campus,hold:false};});
  await page.waitForFunction(p=>IMI.ops.extensions.state().printing===p+1,{timeout:10000},held);
  // Printing rebuilds the Annex from nothing and keeps the deed and settings
  const rebuilt=await page.evaluate(()=>{const c=IMI.ops.extensions.state().meta.campus;return {deed:c.deed,rooms:c.rooms,typists:c.room.bands[0].typists,alloc:c.alloc,machines:c.room.bands.filter(b=>b.on).length,earned:c.room.earned};});
  assert.deepEqual(rebuilt,{deed:true,rooms:1,typists:1,alloc:5,machines:1,earned:0});
  const cycles=await page.evaluate(()=>IMI.ops.extensions.state().legacy.fm);
  assert.equal(cycles.autoCycles,7,'the Foreman Printing is recorded as a cycle');
  assert.equal(cycles.cycles.length,6,'five seeded plus the new one, well inside the eight kept');
  assert.equal(cycles.cycles.at(-1).gain,10,'with the stars that Printing paid');

  // time away: the ordinary cap covers the first stretch, passive Printing the rest, once, without counting as a hand-pressed Printing
  const away=await page.evaluate(()=>{const s=IMI.ops.extensions.state();s.meta.campus={...s.meta.campus,on:true};s.legacy.fm={...s.legacy.fm,enabled:true,policy:'fast',passive:true};return {total:s.legacy.total,printing:s.printing,manual:s.legacy.fm.manual,cap:IMI.ops.dev.awayCap()};});
  await page.evaluate(sec=>IMI.ops.simulateAway(sec),away.cap+3600*10);
  const after=await page.evaluate(()=>{const s=IMI.ops.extensions.state();return {total:s.legacy.total,printing:s.printing,manual:s.legacy.fm.manual,annex:s.meta.campus.room.earned};});
  assert.equal(after.total-away.total,200*10,'ten hours beyond the cap: capped at 200 cycles of the last five median, 10 stars each');
  assert.equal(after.printing,away.printing,'passive time is not a Printing');
  assert.equal(after.manual,away.manual);
  assert.ok(after.annex>0,'the Annex also worked the capped stretch');
  assert.deepEqual(errors,[]);
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
});
