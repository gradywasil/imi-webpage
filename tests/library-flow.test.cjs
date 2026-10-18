const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const os=require('node:os');
const root=path.resolve(__dirname,'..');
const flags='?lgb=1&lg08print=1&lg03=1&lg01a=1&lg05folio=1&lg05layers=1&lg08estate=1#play';

// Long-game scope phase E: Imprint upgrades and specializations, Lost Library restoration, and special editions, in the real room.
test('Imprint upgrades and builds act in the room; a collection is deposited, bound and unlocks its rewards; a special edition pays the Workshop',async()=>{
 const puppeteer=require(process.env.PUPPETEER_MODULE||'C:/Users/arran/pp/node_modules/puppeteer-core');
 const server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost'),file=path.resolve(root,'.'+url.pathname);
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  fs.readFile(file,(err,b)=>{if(err){res.writeHead(404).end();return;}res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.svg':'image/svg+xml','.png':'image/png'})[path.extname(file)]||'application/octet-stream');res.end(b);});
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const origin=`http://127.0.0.1:${server.address().port}`;
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'library-profile-'));
 let browser;
 try{
  browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,userDataDir:profile});
  const page=await browser.newPage();page.setDefaultTimeout(20000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  page.on('dialog',d=>d.accept());
  await page.setViewport({width:1000,height:800});
  // a progressed save with a real Imprint (and its first-Imprint reward claim); the old save migrates into the long-game package on load
  const fx=JSON.parse(fs.readFileSync(path.join(root,'docs/plan/long-game/evidence/LG-09/anthology-r1/confirmation-final-save.json'),'utf8'));
  const save=fx.state;save.lastSeen=Date.now();save.meta.layers.seals=8;save.meta.layers.shelf=[];save.meta.layers.purchases={press:true};
  save.meta.workshop={v:1,parts:20,seq:0,mCount:2,leads:['anthology','almanac'],dupes:0,done:2,attachments:[],equipped:{},exp:null,clock:{last:0},history:[],
   restore:{anthology:{dep:{0:6,1:3},armed:false}},restored:{almanac:true},mastery:{},repeats:0};
  await page.evaluateOnNewDocument((o,wallet)=>{
   if(sessionStorage.getItem('seeded'))return;sessionStorage.setItem('seeded','1');
   localStorage.setItem('imi-tour','done');localStorage.setItem('imi-sound','off');localStorage.setItem('imi-fx','low');
   localStorage.setItem('imi-ops-v1',JSON.stringify(o));localStorage.setItem('imi-score',JSON.stringify(wallet));
  },save,fx.wallet);
  const ready=()=>page.waitForFunction(()=>window.IMI?.ops?.extensions?.state&&window.Rewards?.owns()&&IMI.ops.progression.running()&&!Rewards.held());
  const quiet=()=>page.evaluate(()=>setInterval(()=>document.querySelectorAll('.o-modal,.o-celebrate').forEach(e=>e.remove()),200));
  const show=tab=>page.evaluate(t=>{const a=IMI.ops.extensions;a.setTab(t);a.mark();return new Promise(r=>setTimeout(()=>r(document.body.innerText),500));},tab);
  await page.goto(origin+'/index.html'+flags);await ready();await quiet();

  // --- Imprint upgrades, bought with Press Seals through the guarded Imprint path
  let text=await show('imprints');
  assert.match(text,/Specialization/);assert.match(text,/Rebuild Blueprint/);
  for(const id of ['blueprint','style','exchange','touring']){
   await page.evaluate(i=>document.querySelector(`[data-act="layers:${i}"]`).click(),id);
   await page.waitForFunction(i=>IMI.ops.extensions.state().meta.layers.purchases[i]===true,{timeout:8000},id);
   await show('imprints');
  }
  assert.equal(await page.evaluate(()=>IMI.ops.extensions.state().meta.layers.seals),0,'2 + 1 + 2 + 3 Seals spent');
  // Rebuild Blueprint: every room has Keeper Batches I without buying it
  await page.waitForFunction(()=>IMI.ops.extensions.state().sb?.batch===1,{timeout:8000});

  // --- a build: Collector is open (almanac restored), Prestige is not (atlas is not)
  text=await show('imprints');
  assert.equal(await page.evaluate(()=>!!document.querySelector('[data-act="house:choose"][data-id="prestige"]')),false,'a build you have not earned is not drawn');
  await page.evaluate(()=>document.querySelector('[data-act="house:choose"][data-id="collector"]').click());
  assert.equal(await page.evaluate(()=>IMI.ops.extensions.state().meta.house.build),'collector');
  const prices=await page.evaluate(()=>{const d=IMI.ops.dev,s=d.S(),r=d.RECIPES.find(x=>!x.kid&&!x.lib&&!x.gen);s.editions[r.id]=0;const first=d.salePay(r,1);s.editions[r.id]=2;const again=d.salePay(r,1);s.meta.house.build=null;const bare=d.salePay(r,1);s.editions[r.id]=0;const bare0=d.salePay(r,1);s.meta.house.build='collector';return {first,again,bare,bare0};});
  assert.ok(Math.abs(prices.again/prices.bare-1.15)<.01,'reissues pay 1.15x');
  assert.ok(Math.abs(prices.first/prices.bare0-.92)<.01,'first editions pay 0.92x: the trade-off');
  // Touring Staff: one chosen machine types faster
  await page.evaluate(()=>document.querySelector('[data-act="house:band"][data-g="2"]').click());
  const tour=await page.evaluate(()=>{const d=IMI.ops.dev,s=d.S();s.desks[2].owned=true;s.desks[2].paws=2;d.ensureCrew(s.desks[2]);const on=d.autoRate(s.desks[2]);s.meta.house.band=null;const off=d.autoRate(s.desks[2]);s.meta.house.band=2;return on/off;});
  assert.ok(Math.abs(tour-1.25)<1e-9,'touring staff: 1.25x on exactly that machine');
  // a build cannot change once the room has sold a title
  const swapped=await page.evaluate(()=>{const d=IMI.ops.dev,s=d.S(),r=d.RECIPES.find(x=>!x.kid&&!x.lib&&!x.gen);s.written[r.id]=true;d.touchBank();IMI.ops.extensions.mark();return new Promise(res=>setTimeout(()=>{document.querySelector('[data-act="house:choose"][data-id="rapid"]')?.click();res(s.meta.house.build);},300));});
  assert.equal(swapped,'collector','after a sale the build is locked until the next room');
  await page.evaluate(()=>{const s=IMI.ops.extensions.state();s.written={};IMI.ops.dev.touchBank();});

  // --- Lost Library: one more deposit finishes the anthology's words, then a sale of the right band binds it
  await page.evaluate(()=>{IMI.ops.extensions.state().meta.house.build=null;});     // the Collector's discount would already finish it; test the full price here
  text=await show('workshop');
  assert.ok(await page.evaluate(()=>!!document.querySelector('[data-act="workshop:deposit"][data-id="anthology"][data-band="1"]')),'the library shows its deposit button');
  assert.equal(await page.evaluate(()=>!!document.querySelector('[data-act="workshop:launch"][data-route="archive"]')),false,'the route card stays undrawn until restored');
  assert.equal(await page.evaluate(()=>!!document.querySelector('[data-act="workshop:craft"][data-type="typebar"]')),false,'and so does the recipe');
  const words=await page.evaluate(()=>{const d=IMI.ops.dev,s=d.S();const ws=d.BAND_WORDS[1].slice(-4);s.bank={};ws.forEach(w=>{s.bank[w]=1;});s.focus=null;d.touchBank();return ws;});
  await show('workshop');
  await page.evaluate(()=>document.querySelector('[data-act="workshop:deposit"][data-id="anthology"][data-band="1"]').click());
  const dep=await page.evaluate(()=>{const s=IMI.ops.extensions.state();return {armed:s.meta.workshop.restore.anthology.armed,dep:s.meta.workshop.restore.anthology.dep,left:Object.values(s.bank).reduce((a,b)=>a+b,0)};});
  assert.equal(dep.armed,true,JSON.stringify(dep));assert.equal(dep.dep[1],4);
  assert.equal(dep.left,3,'exactly one word was taken');
  text=await show('workshop');
  assert.ok(await page.evaluate(()=>!!document.querySelector('.lgx-bind')),'a collection ready to bind shows its machine');
  const bound=await page.evaluate(()=>{const d=IMI.ops.dev,s=d.S();const r=d.RECIPES.find(x=>x.band===1&&!x.kid&&!x.lib&&!x.gen&&!s.written[x.id]);for(const w in r.need)s.bank[w]=r.need[w];d.touchBank();d.writeTitle(r.id);return s.meta.workshop.restored;});
  assert.equal(bound.anthology,true,'selling a title of the right band binds the edition');
  text=await show('workshop');
  assert.ok(await page.evaluate(()=>!!document.querySelector('[data-act="workshop:launch"][data-route="archive"]')),'the route is offered once restored');
  assert.ok(await page.evaluate(()=>!!document.querySelector('[data-act="workshop:craft"][data-type="typebar"]')),'and so is the recipe');

  // --- Special edition: Roster Edition opens (almanac), constrains the room, and its first clear is a lasting mastery
  const entered=await page.evaluate(()=>{const d=IMI.ops.dev,s=d.S();s.challenge=null;s.run.earned=Economy.starBase;s.pub.on=false;s.written={};d.doPrint('roster');document.querySelectorAll('.o-modal,.o-celebrate').forEach(e=>e.remove());return IMI.ops.extensions.state().challenge?.id;});
  assert.equal(entered,'roster');
  const blocked=await page.evaluate(()=>{const d=IMI.ops.dev,s=d.S();IMI.bananas.add(Economy.cash(1e9));d.buy('desk',1);d.buy('desk',2);d.buy('desk',3);return [s.desks[2].owned,s.desks[3].owned];});
  assert.deepEqual(blocked,[true,false],'machines past the third are blocked');
  assert.equal(await page.evaluate(()=>IMI.ops.extensions.workshopContext().challenge),true,'workshop rewards stay out while it runs');
  await page.evaluate(()=>{const d=IMI.ops.dev,s=d.S();const ids=d.RECIPES.filter(r=>!r.kid&&!r.lib&&!r.gen).slice(0,9).map(r=>r.id);ids.forEach(id=>{s.written[id]=true;});d.touchBank();});
  await page.waitForFunction(()=>!IMI.ops.extensions.state().challenge,{timeout:8000});
  const mastery=await page.evaluate(()=>{const w=IMI.ops.extensions.state().meta.workshop;return {mastery:w.mastery,repeats:w.repeats,parts:w.parts};});
  assert.equal(mastery.mastery.roster,true);assert.equal(mastery.repeats,0,'the first clear is the mastery, not a repeat payout');
  assert.deepEqual(errors,[]);
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
});
