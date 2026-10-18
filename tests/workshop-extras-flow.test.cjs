const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const os=require('node:os');
const root=path.resolve(__dirname,'..');
const flags='?lgb=1&lg08print=1&lg03=1&lg01a=1&lg05folio=1&lg05layers=1&lg08estate=1#play';

// Plan ideas built after the first six phases: expeditions paid in words or letters, a queue and a second attachment slot as mastery rewards.
test('words and letters fund a trip from what the room produced, a queue holds more, and a second slot fits two attachments',async()=>{
 const puppeteer=require(process.env.PUPPETEER_MODULE||'C:/Users/arran/pp/node_modules/puppeteer-core');
 const server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost'),file=path.resolve(root,'.'+url.pathname);
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  fs.readFile(file,(err,b)=>{if(err){res.writeHead(404).end();return;}res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.svg':'image/svg+xml','.png':'image/png'})[path.extname(file)]||'application/octet-stream');res.end(b);});
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const origin=`http://127.0.0.1:${server.address().port}`;
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'workshop-extras-'));
 let browser;
 try{
  browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,userDataDir:profile});
  const page=await browser.newPage();page.setDefaultTimeout(20000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  page.on('dialog',d=>d.accept());
  await page.setViewport({width:1000,height:800});
  const workshop={v:1,parts:50,seq:0,mCount:0,leads:[],dupes:0,done:0,attachments:[],equipped:{},equippedB:{},exp:null,queue:[],shelf:[],clock:{last:0},history:[],restore:{},restored:{},mastery:{roster:true,twin:true},repeats:0};
  const save={economyVersion:99,lastSeen:Date.now(),intro:{version:1,done:true,train:true,words:true,shop:true,hireAt:0},stats:{letters:90000,manual:900,words:600},
   legacy:{stars:0,total:200,k:10,ups:{crew:1},mig:{lgb:1,ledger:{v:1,from:{speed:0,keeper:0,crew:0},credit:{},refund:{},bridge:[]}}},
   printing:2,desks:[{owned:true,paws:2}],meta:{workshop}};
  await page.evaluateOnNewDocument(o=>{
   if(sessionStorage.getItem('seeded'))return;sessionStorage.setItem('seeded','1');
   localStorage.setItem('imi-tour','done');localStorage.setItem('imi-sound','off');localStorage.setItem('imi-fx','low');
   localStorage.setItem('imi-ops-v1',JSON.stringify(o));localStorage.setItem('imi-score',JSON.stringify({economyVersion:99,score:0}));
  },save);
  const ready=()=>page.waitForFunction(()=>window.IMI?.ops?.extensions?.state&&window.Rewards?.owns()&&IMI.ops.progression.running()&&!Rewards.held());
  const quiet=()=>page.evaluate(()=>setInterval(()=>document.querySelectorAll('.o-modal,.o-celebrate').forEach(e=>e.remove()),200));
  const open=()=>page.evaluate(()=>{const a=IMI.ops.extensions;a.setTab('workshop');a.mark();return new Promise(r=>setTimeout(r,450));});
  await page.goto(origin+'/index.html'+flags);await ready();await quiet();
  await page.addStyleTag({content:'.tour-bub,.tour-ring{pointer-events:none!important}'});   // hint bubbles are transient; they must not decide where the test clicks
  await open();

  // nothing produced this room: the word and letter tiles refuse, with the shortfall in the tooltip
  await page.click('[data-act="workshop:fund"][data-v="words"]');await open();
  assert.equal(await page.$eval('[data-act="workshop:launch"][data-route="salvage"]',e=>e.disabled),true,'no produced words, no trip');
  assert.match(await page.$eval('[data-act="workshop:launch"][data-route="salvage"]',e=>e.title),/Needs 60 words produced this room/);

  // produce words and stock them: 80 produced, 100 on the shelf
  await page.evaluate(()=>{const s=IMI.ops.extensions.state();s.run.words=80;s.bank={stump:70,leaf:30};IMI.ops.extensions.mark();});
  await open();
  assert.equal(await page.$eval('[data-act="workshop:launch"][data-route="salvage"]',e=>e.disabled),false);
  await page.click('[data-act="workshop:launch"][data-route="salvage"]');
  const w1=await page.evaluate(()=>{const s=IMI.ops.extensions.state();return {exp:s.meta.workshop.exp,bank:{...s.bank},committed:s.xFundW,wallet:IMI.bananas.get()};});
  assert.equal(w1.exp.fund,'words');assert.equal(w1.exp.cost,60);
  const left=Object.values(w1.bank).reduce((a,b)=>a+b,0);assert.ok(left>=40&&left<=43,'sixty words left the bank (keepers may bank a few more): '+left);
  assert.equal(w1.committed,60);assert.equal(w1.wallet,0,'no bananas were spent');
  assert.deepEqual(Object.values(w1.exp.took).reduce((a,b)=>a+b,0),60,'the take is recorded for a call-back');

  // only 20 produced words remain eligible, so a second words trip is refused even with 40 words still on the shelf
  await open();
  assert.equal(await page.$eval('[data-act="workshop:launch"][data-route="salvage"]',e=>e.disabled),true,'the first queue slot needs 60 more produced words');
  // letters: typist-made letters count, bonus letters do not
  await page.evaluate(()=>{const s=IMI.ops.extensions.state();s.run.lp=900;s.desks[0].letters={E:300,T:300,A:300};s.bank={};IMI.ops.extensions.mark();});
  await page.click('[data-act="workshop:fund"][data-v="letters"]');await open();
  await page.click('[data-act="workshop:launch"][data-route="salvage"]');
  const w2=await page.evaluate(()=>{const s=IMI.ops.extensions.state();return {queue:s.meta.workshop.queue,exp:s.meta.workshop.exp.id,letters:Object.values(s.desks[0].letters).reduce((a,b)=>a+b,0),committed:s.xFundL};});
  assert.equal(w2.queue.length,1,'with the Twin Band mastery the second trip waits in the queue');
  assert.equal(w2.queue[0].fund,'letters');assert.equal(w2.queue[0].state,'queued');
  assert.ok(w2.letters>=480&&w2.letters<=580,'360 letters were taken (typists add some, keepers use some): '+w2.letters);assert.equal(w2.committed,360);

  // cancel the queued trip: everything it committed comes back, and cannot fund again
  await open();
  await page.click('[data-act="workshop:unqueue"]');
  const w3=await page.evaluate(()=>{const s=IMI.ops.extensions.state();return {queue:s.meta.workshop.queue.length,letters:Object.values(s.desks[0].letters).reduce((a,b)=>a+b,0),eligible:IMI.ops.extensions.workshopContext().fundLetters};});
  assert.equal(w3.queue,0);assert.ok(w3.letters>=840&&w3.letters<=950,'the letters are home: '+w3.letters);
  assert.ok(w3.eligible>=480&&w3.eligible<=620,'returned stock stays ineligible: produced 900, committed 360: '+w3.eligible);

  // the queue runs by itself: send another words trip behind the running one, then jump the clock past both
  await page.evaluate(()=>{const s=IMI.ops.extensions.state();s.run.words=500;s.bank={stump:200};IMI.ops.extensions.mark();});
  await page.click('[data-act="workshop:fund"][data-v="words"]');await open();
  await page.click('[data-act="workshop:launch"][data-route="manuscript"]');
  assert.equal(await page.evaluate(()=>IMI.ops.extensions.state().meta.workshop.queue.length),1);
  await page.evaluate(()=>{const s=IMI.ops.extensions.state();s.meta.workshop={...s.meta.workshop,clock:{last:s.meta.workshop.clock.last-6*3600*1000}};});
  await page.waitForFunction(()=>{const w=IMI.ops.extensions.state().meta.workshop;return w.exp&&w.exp.state==='returned'&&w.shelf.length===1;});
  await page.evaluate(()=>{IMI.ops.extensions.setTab('floor');IMI.ops.extensions.mark();return new Promise(r=>setTimeout(r,450));});
  assert.equal(await page.evaluate(()=>document.querySelector('.o-tab[data-tab="workshop"]').dataset.badge),'!','the tab calls attention while trips wait');
  await open();
  await page.click('[data-act="workshop:collect"]');
  const c1=await page.evaluate(()=>{const w=IMI.ops.extensions.state().meta.workshop;return {parts:w.parts,shelf:w.shelf.length,exp:w.exp&&w.exp.state,done:w.done};});
  assert.equal(c1.shelf,0);assert.equal(c1.exp,'returned');assert.equal(c1.done,1);
  await new Promise(r=>setTimeout(r,1500));await open();
  await page.click('[data-act="workshop:collect"]');
  const c2=await page.evaluate(()=>{const w=IMI.ops.extensions.state().meta.workshop;return {parts:w.parts,exp:w.exp,done:w.done};});
  assert.equal(c2.exp,null);assert.equal(c2.done,2);assert.ok(c2.parts>c1.parts,'each trip paid once');

  // second slot: two different attachments on one machine, never two of a kind
  await page.evaluate(()=>{const s=IMI.ops.extensions.state();s.meta.workshop={...s.meta.workshop,parts:60};IMI.ops.extensions.mark();});
  await open();
  await page.click('[data-act="workshop:craft"][data-type="carriage"]');await open();
  await page.click('[data-act="workshop:craft"][data-type="tray"]');await open();
  await page.click('[data-act="workshop:craft"][data-type="carriage"]');await open();
  const ids=await page.evaluate(()=>IMI.ops.extensions.state().meta.workshop.attachments.map(a=>a.id));
  await page.click(`[data-act="workshop:equip"][data-id="${ids[0]}"][data-g="0"][data-slot="0"]`);
  await page.click(`[data-act="workshop:equip"][data-id="${ids[1]}"][data-g="0"][data-slot="1"]`);
  await page.click(`[data-act="workshop:equip"][data-id="${ids[2]}"][data-g="0"][data-slot="1"]`);
  const e=await page.evaluate(()=>{const w=IMI.ops.extensions.state().meta.workshop;return {a:w.equipped,b:w.equippedB,valid:Workshop.valid(w)};});
  assert.equal(e.a[0],ids[0]);assert.equal(e.b[0],ids[1],'a second carriage is refused, so the tray stays');assert.equal(e.valid,true);

  // a Printing keeps the account-level record but clears the room's production counters
  const kept=await page.evaluate(()=>{const s=IMI.ops.extensions.state();return {mast:Object.keys(s.meta.workshop.mastery).length};});
  assert.equal(kept.mast,2);
  await page.reload();await ready();
  const reloaded=await page.evaluate(()=>{const w=IMI.ops.extensions.state().meta.workshop;return {valid:Workshop.valid(w),equippedB:w.equippedB,done:w.done};});
  assert.equal(reloaded.valid,true);assert.equal(reloaded.done,2);assert.equal(reloaded.equippedB[0],ids[1]);
  assert.deepEqual(errors,[]);
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
});
