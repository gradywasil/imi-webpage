const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const os=require('node:os');
const root=path.resolve(__dirname,'..');
const flags='?lgb=1&lg08print=1&lg03=1&lg01a=1&lg05folio=1&lg05layers=1&lg08estate=1#play';

// Long-game scope phase D: expeditions fund from earned bananas, run on an account clock, pay once, and feed the Workshop.
test('an expedition is funded from earned bananas, survives the app closing and a Printing, and its Parts fit a machine',async()=>{
 const puppeteer=require(process.env.PUPPETEER_MODULE||'C:/Users/arran/pp/node_modules/puppeteer-core');
 const server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost'),file=path.resolve(root,'.'+url.pathname);
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  fs.readFile(file,(err,b)=>{if(err){res.writeHead(404).end();return;}res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.svg':'image/svg+xml','.png':'image/png'})[path.extname(file)]||'application/octet-stream');res.end(b);});
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const origin=`http://127.0.0.1:${server.address().port}`;
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'workshop-profile-'));
 let browser;
 try{
  browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,userDataDir:profile});
  const page=await browser.newPage();page.setDefaultTimeout(20000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  page.on('dialog',d=>d.accept());
  await page.setViewport({width:1000,height:800});
  const save={economyVersion:99,lastSeen:Date.now(),intro:{version:1,done:true,train:true,words:true,shop:true,hireAt:0},stats:{letters:90000,manual:900,words:600},
   legacy:{stars:0,total:200,k:10,ups:{crew:1},mig:{lgb:1,ledger:{v:1,from:{speed:0,keeper:0,crew:0},credit:{},refund:{},bridge:[]}}},
   printing:2,desks:[{owned:true,paws:2}]};
  await page.evaluateOnNewDocument(o=>{
   if(sessionStorage.getItem('seeded'))return;sessionStorage.setItem('seeded','1');
   localStorage.setItem('imi-tour','done');localStorage.setItem('imi-sound','off');localStorage.setItem('imi-fx','low');
   localStorage.setItem('imi-ops-v1',JSON.stringify(o));localStorage.setItem('imi-score',JSON.stringify({economyVersion:99,score:0}));
  },save);
  const ready=()=>page.waitForFunction(()=>window.IMI?.ops?.extensions?.state&&window.Rewards?.owns()&&IMI.ops.progression.running()&&!Rewards.held());
  const quiet=()=>page.evaluate(()=>setInterval(()=>document.querySelectorAll('.o-modal,.o-celebrate').forEach(e=>e.remove()),200));
  const open=()=>page.evaluate(()=>{const a=IMI.ops.extensions;a.setTab('workshop');a.mark();return new Promise(r=>setTimeout(r,450));});
  await page.goto(origin+'/index.html'+flags);await ready();await quiet();
  await open();
  assert.match(await page.evaluate(()=>document.body.innerText),/Workshop/,'the tab is there at Printing 2');
  // seed money and refunds never fund a trip: plenty of bananas, nothing earned in this room
  await page.evaluate(()=>{IMI.bananas.add(Economy.cash(1e7));IMI.ops.extensions.state().run.earned=0;IMI.ops.extensions.mark();});
  await open();
  assert.equal(await page.$eval('[data-act="workshop:launch"][data-route="salvage"]',e=>e.disabled),true,'bananas that were not earned in this room cannot fund it');
  // earn some: now it can, and the cost leaves the wallet once
  const cost=await page.evaluate(()=>{const c=IMI.ops.extensions.workshopContext();return Economy.round(.2*c.ref);});
  await page.evaluate(c=>{IMI.ops.extensions.state().run.earned=c*3;IMI.ops.extensions.mark();},cost);
  await open();
  const wallet=await page.evaluate(()=>IMI.bananas.get());
  await page.click('[data-act="workshop:launch"][data-route="salvage"]');
  const sent=await page.evaluate(()=>{const s=IMI.ops.extensions.state();return {exp:s.meta.workshop.exp,wallet:IMI.bananas.get(),fund:s.xFund};});
  assert.equal(sent.exp.id,'x1');assert.equal(sent.exp.state,'away');
  assert.equal(wallet-sent.wallet,cost,'the committed bananas leave the wallet once');
  assert.equal(sent.fund,cost);
  // closing the app: persisted, and the elapsed clock catches up on load
  await page.evaluate(()=>{const s=IMI.ops.extensions.state();s.meta.workshop.clock={last:s.meta.workshop.clock.last-901000};IMI.ops.extensions.save();});
  await page.reload();await ready();await quiet();
  await page.waitForFunction(()=>IMI.ops.extensions.state().meta.workshop?.exp?.state==='returned',{timeout:8000});
  await open();
  assert.ok(await page.evaluate(()=>!!document.querySelector('.lgx-strip.back')),'the returned expedition shows the explorer home with a crate');
  assert.ok(await page.evaluate(()=>!!document.querySelector('[data-act="workshop:collect"]')));
  // collect once; a second click pays nothing
  await page.click('[data-act="workshop:collect"]');
  assert.equal(await page.evaluate(()=>IMI.ops.extensions.state().meta.workshop.parts),8);
  assert.equal(await page.evaluate(()=>IMI.ops.extensions.state().meta.workshop.exp),null);
  await page.evaluate(()=>IMI.ops.extensions.state().meta.workshop.exp===null&&document.querySelector('[data-act="workshop:collect"]')?.click());
  assert.equal(await page.evaluate(()=>IMI.ops.extensions.state().meta.workshop.parts),8,'no second payout');
  // craft and fit a Quick Carriage on the first machine
  await open();
  await page.click('[data-act="workshop:craft"][data-type="carriage"]');
  await open();
  await page.click('[data-act="workshop:equip"][data-g="0"]');
  const effect=await page.evaluate(()=>{
   const d=IMI.ops.dev,s=d.S();s.desks[0].paws=2;d.ensureCrew(s.desks[0]);
   const fitted=d.autoRate(s.desks[0]);const keep=s.meta.workshop.equipped;s.meta.workshop.equipped={};const bare=d.autoRate(s.desks[0]);s.meta.workshop.equipped=keep;
   return {ratio:fitted/bare,parts:s.meta.workshop.parts,equipped:{...keep}};
  });
  assert.ok(Math.abs(effect.ratio-1.5)<1e-9,'the carriage makes that machine type 1.5x faster');
  assert.equal(effect.parts,2);
  // a Printing resets the room but not the Workshop, and run-scoped funding starts clean
  const before=await page.evaluate(()=>{const s=IMI.ops.extensions.state();s.pub.on=false;s.desks.forEach(x=>{x.keeper.on=false;});s.run.earned=Economy.starBase;return {printing:s.printing,w:JSON.stringify(s.meta.workshop)};});
  const ok=await page.evaluate(()=>{const a=IMI.ops.extensions;const r=Rewards.printingAction({origin:'manual',quote:a.printingReview()});document.querySelectorAll('.o-modal,.o-celebrate').forEach(e=>e.remove());return r.ok;});
  assert.equal(ok,true);
  const after=await page.evaluate(()=>{const s=IMI.ops.extensions.state();return {printing:s.printing,w:JSON.stringify(s.meta.workshop),fund:s.xFund||0};});
  assert.equal(after.printing,before.printing+1);
  assert.equal(after.w,before.w,'Parts, attachments and the loadout survive Printing');
  assert.equal(after.fund,0,'the new room has funded nothing');
  // an expedition keeps running through a Printing, and can be called back for the unspent share
  await page.evaluate(()=>{const s=IMI.ops.extensions.state();s.run.earned=Economy.cash(1e6);IMI.bananas.add(Economy.cash(1e6));IMI.ops.extensions.mark();});
  await open();
  await page.click('[data-act="workshop:launch"][data-route="manuscript"]');
  const cancelled=await page.evaluate(()=>{const s=IMI.ops.extensions.state(),x=s.meta.workshop.exp,b=IMI.bananas.get();return {cost:x.cost,b,earned:s.run.earned};});
  await page.evaluate(()=>{const s=IMI.ops.extensions.state();s.meta.workshop.exp={...s.meta.workshop.exp,elapsed:900};IMI.ops.extensions.mark();});
  await open();
  await page.evaluate(()=>{window.confirm=()=>true;});
  await page.evaluate(()=>document.querySelector('[data-act="workshop:cancel"]').click());
  assert.deepEqual(errors,[],'no page errors while recalling');
  const refunded=await page.evaluate(()=>({earned:IMI.ops.extensions.state().run.earned,b:IMI.bananas.get(),exp:IMI.ops.extensions.state().meta.workshop.exp,parts:IMI.ops.extensions.state().meta.workshop.parts}));
  assert.equal(refunded.earned,cancelled.earned,'a refund never counts as earned production');
  assert.equal(refunded.exp,null);assert.equal(refunded.parts,2,'no reward for a recalled trip');
  assert.equal(refunded.b-cancelled.b,Math.floor(cancelled.cost*0.5/25)*25,'half the time left, half the bananas back');
  assert.deepEqual(errors,[]);
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
});
