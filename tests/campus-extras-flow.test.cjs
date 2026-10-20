const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const os=require('node:os');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const flags='?lgb=1&lg08print=1&lg03=1&lg01a=1&lg05folio=1&lg05layers=1&lg08estate=1#play';

// Plan ideas past the Annex: a third building, campus scheduling, staff transfers, and queued Foreman goals / genre-aware choice on the Room control.
test('the Studio earns beside the Annex, scheduling pushes until a machine count, a transfer keeps the head count, and Printing rebuilds both',async()=>{
 const puppeteer=require(process.env.PUPPETEER_MODULE||'C:/Users/arran/pp/node_modules/puppeteer-core');
 const ctx={};ctx.window=ctx;vm.runInNewContext(fs.readFileSync(path.join(root,'campus.js'),'utf8'),ctx);
 const Campus=ctx.Campus;
 let campus=Campus.openDeed(Campus.fresh(),{estate:1,autoCycles:10,restored:1,mastery:1}).c;
 campus={...campus,rooms:5,alloc:0};
 campus=Campus.openStudio(campus,{estate:2,annexRooms:5,autoCycles:25}).c;
 campus.room.bands[0]={on:true,typists:6,keeper:6};campus.room.bands[1]={on:true,typists:3,keeper:2};
 campus.studio.alloc=0;campus.studio.room.bands[0]={on:true,typists:6,keeper:6};campus.studio.room.bands[1]={on:true,typists:1,keeper:0};
 campus.studio.room.wip[0]=.95;campus.studio.room.pub=1;      // close to a first sale so a short test sees one
 const server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost'),file=path.resolve(root,'.'+url.pathname);
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  fs.readFile(file,(err,b)=>{if(err){res.writeHead(404).end();return;}res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.svg':'image/svg+xml','.png':'image/png'})[path.extname(file)]||'application/octet-stream');res.end(b);});
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const origin=`http://127.0.0.1:${server.address().port}`;
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'campus-extras-'));
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
  save.legacy.fm={v:1,enabled:false,policy:'fast',target:10,reserve:0,manual:true,passive:false,autoCycles:30,bp:null,order:[],route:'salvage',cycles:[]};
  save.meta.campus=campus;
  save.meta.automation={version:1,ownership:{version:1,owned:{}}};      // an older save would first be asked to admit its helpers, which swallows other clicks
  await page.evaluateOnNewDocument((o,wallet)=>{
   if(sessionStorage.getItem('seeded'))return;sessionStorage.setItem('seeded','1');
   localStorage.setItem('imi-tour','done');localStorage.setItem('imi-sound','off');localStorage.setItem('imi-fx','low');
   localStorage.setItem('imi-ops-v1',JSON.stringify(o));localStorage.setItem('imi-score',JSON.stringify(wallet));
  },save,fx.wallet);
  const ready=()=>page.waitForFunction(()=>window.IMI?.ops?.extensions?.state&&window.Rewards?.owns()&&IMI.ops.progression.running()&&!Rewards.held());
  const tap=sel=>page.$eval(sel,el=>{el.scrollIntoView({block:'center'});el.click();});
  const quiet=()=>page.evaluate(()=>setInterval(()=>document.querySelectorAll('.o-modal,.o-celebrate').forEach(e=>e.remove()),200));
  const show=tab=>page.evaluate(t=>{const a=IMI.ops.extensions;a.setTab(t);a.mark();return new Promise(r=>setTimeout(()=>r(document.body.innerText),500));},tab);
  await page.goto(origin+'/index.html'+flags);await ready();await quiet();
  await page.addStyleTag({content:'.tour-bub,.tour-ring{pointer-events:none!important}'});
  await show('campus');
  for(const sel of ['.lgx-bld.house','.lgx-bld.annex','.lgx-bld.studio','[data-building="studio"]','[data-building="annex"]','[data-act="campus:move"][data-from="annex"]','[data-act="campus:sched"][data-kind="studio"]'])
   assert.equal(await page.evaluate(s=>!!document.querySelector(s),sel),true,sel+' is drawn');

  // the Studio is a precision building: it sells and its income reaches the wallet once
  const before=await page.evaluate(()=>{const s=IMI.ops.extensions.state();s.pub.on=false;return {wallet:IMI.bananas.get(),earned:s.run.earned};});
  await page.waitForFunction(()=>IMI.ops.extensions.state().meta.campus.studio.room.earned>0,{timeout:30000});
  const made=await page.evaluate(()=>{const s=IMI.ops.extensions.state(),c=s.meta.campus;return {studio:c.studio.room.earned,annex:c.room.earned,wallet:IMI.bananas.get(),earned:s.run.earned};});
  assert.ok(made.earned>before.earned,'the income was counted as production');
  assert.ok(Math.abs((made.earned-before.earned)-(made.wallet-before.wallet))<=100,'every banana gained is counted as production exactly once, from both buildings');

  // a transfer: one typist from the Annex to the Studio, nothing else changes
  const sum=()=>page.evaluate(()=>{const c=IMI.ops.extensions.state().meta.campus,t=r=>r.bands.reduce((a,b)=>a+b.typists,0);return {annex:t(c.room),studio:t(c.studio.room),moved:c.moved||0,wallet:IMI.bananas.get()};});
  await page.evaluate(()=>{const s=IMI.ops.extensions.state();s.meta.campus={...s.meta.campus,on:false,studio:{...s.meta.campus.studio,on:false}};});   // freeze the models while we count
  const a0=await sum();
  await tap('[data-act="campus:move"][data-from="annex"][data-to="studio"]');
  const a1=await sum();
  assert.equal(a1.annex+a1.studio,a0.annex+a0.studio,'the head count never changes');
  assert.equal(a1.studio,a0.studio+1);assert.equal(a1.annex,a0.annex-1);assert.equal(a1.moved,1);
  assert.equal((await page.evaluate(()=>IMI.ops.extensions.campusMove('annex','studio'))).ok,true);
  const a2=await sum();assert.equal(a2.annex+a2.studio,a0.annex+a0.studio,'still the same head count after a second move');assert.equal(a2.moved,2);
  // keep moving until the Annex has only its first typist left: the transfer then refuses and its button disables
  for(let i=0;i<30;i++){const r=await page.evaluate(()=>IMI.ops.extensions.campusMove('annex','studio'));if(!r.ok)break;}
  const drained=await page.evaluate(()=>{const c=IMI.ops.extensions.state().meta.campus;return {band0:c.room.bands[0].typists,band1:c.room.bands[1].typists,studioMax:Math.max(...c.studio.room.bands.map(b=>b.typists))};});
  assert.equal(drained.band1,0,'the second machine gave up all its typists');assert.equal(drained.band0,6,'the first machine could not move: the first Studio machine is already full');assert.ok(drained.studioMax<=6,'a machine never exceeds six typists');
  await show('campus');
  assert.equal(await page.$eval('[data-act="campus:move"][data-from="annex"]',e=>e.disabled),true);
  assert.equal(await page.$eval('[data-act="campus:move"][data-from="studio"]',e=>e.disabled),false,'the other way is still open');
  // the Original room's staff is never part of it
  assert.equal(await page.evaluate(()=>IMI.ops.extensions.campusMove('annex','house').ok),false);

  // scheduling: push until three machines, then follow the saved policy
  await tap('[data-building="studio"] [data-act="campus:sched"]');
  const s1=await page.evaluate(()=>IMI.ops.extensions.state().meta.campus.studio.sched);
  assert.deepEqual(s1,{on:true,until:3});
  await tap('[data-building="studio"] [data-act="campus:until"][data-d="1"]');
  assert.equal(await page.evaluate(()=>IMI.ops.extensions.state().meta.campus.studio.sched.until),4);
  assert.equal(await page.evaluate(()=>!!document.querySelector('[data-building="studio"] .lgx-sched')),true,'the pushed policy is marked while the schedule overrides it');

  // a hold from the Studio keeps the Foreman from pressing
  const held=await page.evaluate(()=>{const s=IMI.ops.extensions.state();s.meta.campus={...s.meta.campus,studio:{...s.meta.campus.studio,hold:true}};s.legacy.fm={...s.legacy.fm,enabled:true,policy:'fast'};s.run.earned=Economy.starBase;s.fmSecs=40;return s.printing;});
  await new Promise(r=>setTimeout(r,2500));
  assert.equal(await page.evaluate(()=>IMI.ops.extensions.state().printing),held,'the Studio can hold Printing too');
  await page.evaluate(()=>{const s=IMI.ops.extensions.state();s.meta.campus={...s.meta.campus,studio:{...s.meta.campus.studio,hold:false}};});
  await page.waitForFunction(p=>IMI.ops.extensions.state().printing===p+1,{timeout:15000},held);

  // Printing rebuilds both buildings from nothing; deeds, settings and the transfer ledger stay
  const rebuilt=await page.evaluate(()=>{const c=IMI.ops.extensions.state().meta.campus;return {rooms:c.rooms,studioRooms:c.studio.rooms,annexBands:c.room.bands.filter(b=>b.on).length,studioBands:c.studio.room.bands.filter(b=>b.on).length,studioEarned:c.studio.room.earned,sched:c.studio.sched,moved:c.moved,valid:Campus.valid(c)};});
  assert.deepEqual(rebuilt,{rooms:6,studioRooms:1,annexBands:1,studioBands:1,studioEarned:0,sched:{on:true,until:4},moved:rebuilt.moved,valid:true});
  assert.ok(rebuilt.moved>=2);

  // away: both buildings work the capped stretch and are paid once
  await page.evaluate(()=>{const s=IMI.ops.extensions.state();s.meta.campus={...s.meta.campus,on:true,studio:{...s.meta.campus.studio,on:true,room:{...s.meta.campus.studio.room,bands:s.meta.campus.studio.room.bands.map((b,i)=>i===0?{on:true,typists:6,keeper:6}:b)}},room:{...s.meta.campus.room,bands:s.meta.campus.room.bands.map((b,i)=>i===0?{on:true,typists:6,keeper:6}:b)}};s.legacy.fm={...s.legacy.fm,enabled:false};});
  await page.evaluate(()=>IMI.ops.simulateAway(3600));
  const away=await page.evaluate(()=>{const c=IMI.ops.extensions.state().meta.campus;return {annex:c.room.earned,studio:c.studio.room.earned};});
  assert.ok(away.annex>0&&away.studio>0,'both buildings worked while the player was away');
  assert.deepEqual(errors,[]);
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
});
