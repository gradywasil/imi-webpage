const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const os=require('node:os');
const root=path.resolve(__dirname,'..');
const flags='?lgb=1&lg08print=1&lg03=1&lg01a=1&lg05folio=1&lg05layers=1&lg08estate=1#play';

// Long-game scope phase C: the room buys in the saved order, restores the publisher, and the Foreman presses a real, guarded Printing.
test('the Room control buys in order within the reserve, restores the publisher, and the Foreman presses Printing',async()=>{
 const puppeteer=require(process.env.PUPPETEER_MODULE||'C:/Users/arran/pp/node_modules/puppeteer-core');
 const server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost'),file=path.resolve(root,'.'+url.pathname);
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  fs.readFile(file,(err,b)=>{if(err){res.writeHead(404).end();return;}res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.svg':'image/svg+xml','.png':'image/png'})[path.extname(file)]||'application/octet-stream');res.end(b);});
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const origin=`http://127.0.0.1:${server.address().port}`;
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'foreman-profile-'));
 let browser;
 try{
  browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,userDataDir:profile});
  const page=await browser.newPage();page.setDefaultTimeout(20000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewport({width:1000,height:800});
  const save={economyVersion:99,lastSeen:Date.now(),intro:{version:1,done:true,train:true,words:true,shop:true,hireAt:0},stats:{letters:90000,manual:900,words:600},
   legacy:{stars:0,total:200,k:10,ups:{crew:1,ledger:1,buyer:1,blueprint:1,foreman:1},
    mig:{lgb:1,ledger:{v:1,from:{speed:0,keeper:0,crew:0},credit:{},refund:{},bridge:[]}},
    fm:{v:1,enabled:true,policy:'fast',target:10,reserve:0,manual:true,bp:{rule:'fair',on:true,tier:1},
     order:[{k:'desk',i:1},{k:'desk',i:2},{k:'pub',to:1},{k:'sb',key:'drive',to:1}]}},
   printing:4,desks:[{owned:true,paws:2}]};
  await page.evaluateOnNewDocument(o=>{
   if(sessionStorage.getItem('seeded'))return;sessionStorage.setItem('seeded','1');
   localStorage.setItem('imi-tour','done');localStorage.setItem('imi-sound','off');localStorage.setItem('imi-fx','low');
   localStorage.setItem('imi-ops-v1',JSON.stringify(o));localStorage.setItem('imi-score',JSON.stringify({economyVersion:99,score:0}));
  },save);
  const ready=()=>page.waitForFunction(()=>window.IMI?.ops?.extensions?.state&&window.Rewards?.owns()&&IMI.ops.progression.running()&&!Rewards.held());
  await page.goto(origin+'/index.html'+flags);await ready();
  // a player closes welcome and award cards; the room control rightly pauses while one is open
  await page.evaluate(()=>setInterval(()=>document.querySelectorAll('.o-modal,.o-celebrate').forEach(e=>e.remove()),200));
  // no money: nothing is bought, and the publisher comes back for free
  await page.waitForFunction(()=>IMI.ops.extensions.state().pub.tier===1,{timeout:8000});
  const restored=await page.evaluate(()=>{const s=IMI.ops.extensions.state();return {tier:s.pub.tier,rule:s.pub.rule,on:s.pub.on,desk1:s.desks[1].owned};});
  assert.deepEqual(restored,{tier:1,rule:'fair',on:true,desk1:false},'Blueprint restores the remembered assistant for free; Buyer waits without money');
  // money for the first desk only: the second is not bought ahead of order
  await page.evaluate(()=>{const d=IMI.ops.dev;IMI.bananas.add(d.DESKS[1].price+25);});
  await page.waitForFunction(()=>IMI.ops.extensions.state().desks[1].owned,{timeout:8000});
  const after=await page.evaluate(()=>{const s=IMI.ops.extensions.state();return {d1:s.desks[1].owned,d2:s.desks[2].owned,run:s.fmRun};});
  assert.equal(after.d1,true);assert.equal(after.d2,false,'the second desk is not affordable yet');
  assert.deepEqual(after.run,[{k:'desk',i:1}],'the Ledger records what was bought, in order');
  // Off means off
  await page.evaluate(()=>{const s=IMI.ops.extensions.state();s.legacy.fm={...s.legacy.fm,enabled:false};IMI.bananas.add(IMI.ops.dev.DESKS[2].price*2);});
  await new Promise(r=>setTimeout(r,2500));
  assert.equal(await page.evaluate(()=>IMI.ops.extensions.state().desks[2].owned),false,'nothing is bought while Off');
  // The Foreman: enough stars and settled production presses a real Printing with the foreman origin
  const before=await page.evaluate(()=>{const s=IMI.ops.extensions.state();s.legacy.fm={...s.legacy.fm,enabled:true};s.sb={drive:2};s.run.earned=Economy.starBase;s.fmSecs=10;return {printing:s.printing,total:s.legacy.total};});
  await new Promise(r=>setTimeout(r,2500));
  assert.equal(await page.evaluate(()=>IMI.ops.extensions.state().printing),before.printing,'under 30 productive seconds it does not press');
  await page.evaluate(()=>{IMI.ops.extensions.state().fmSecs=31;});
  await page.waitForFunction(p=>IMI.ops.extensions.state().printing===p+1,{timeout:10000},before.printing);
  const next=await page.evaluate(()=>{const s=IMI.ops.extensions.state();return {total:s.legacy.total,crew:s.desks[0].crew.length,order:s.legacy.fm.order,bp:s.legacy.fm.bp,manual:s.legacy.fm.manual,sb:s.sb||null,run:s.fmRun||null,secs:s.fmSecs||0,pending:s.meta.automation?.print?.pending||null};});
  assert.equal(next.total,before.total+10,'the ledger pays exactly the reviewed stars');
  assert.equal(next.crew,2);
  assert.equal(next.pending,null,'the guarded transaction finished');
  assert.equal(next.run,null,'a new room starts a fresh record');
  assert.equal(next.sb,null,'run upgrades reset with the room');
  assert.ok(next.secs<30,'and a fresh production clock');
  assert.equal(next.manual,true,'a Foreman Printing neither grants nor removes the hand-pressed proof');
  assert.equal(next.bp.rule,'fair','the publisher setup is remembered across the reset');
  assert.deepEqual(next.order.slice(0,1),[{k:'desk',i:1}],'the run bought under three steps, so the saved order stands');
  // reload keeps everything and does not pay again
  await page.reload();await ready();
  await page.evaluate(()=>setInterval(()=>document.querySelectorAll('.o-modal,.o-celebrate').forEach(e=>e.remove()),200));
  const again=await page.evaluate(()=>{const s=IMI.ops.extensions.state();return {printing:s.printing,total:s.legacy.total,enabled:s.legacy.fm.enabled};});
  assert.deepEqual(again,{printing:before.printing+1,total:before.total+10,enabled:true});
  // Catalog and Exploration: it sends the chosen route within the reserve, then collects what comes home
  await page.evaluate(()=>{const s=IMI.ops.extensions.state();s.legacy.fm={...s.legacy.fm,enabled:true,policy:'explore',route:'salvage',reserve:0};s.run.earned=Economy.cash(5e6);IMI.bananas.add(Economy.cash(5e6));IMI.ops.extensions.mark();});
  await page.waitForFunction(()=>IMI.ops.extensions.state().meta.workshop?.exp?.route==='salvage',{timeout:8000});
  await page.evaluate(()=>{const s=IMI.ops.extensions.state();s.meta.workshop.clock={last:s.meta.workshop.clock.last-901000};});
  await page.waitForFunction(()=>IMI.ops.extensions.state().meta.workshop.parts===8&&IMI.ops.extensions.state().meta.workshop.exp===null,{timeout:10000});
  const printingNow=await page.evaluate(()=>IMI.ops.extensions.state().printing);
  assert.equal(printingNow,before.printing+1,'exploring never pressed Printing');
  // the Room control card renders once an upgrade is owned
  const text=await page.evaluate(()=>{const a=IMI.ops.extensions;IMI.ops.dev.ui.sub.legacy='upgrades';a.setTab('legacy');a.mark();return new Promise(r=>setTimeout(()=>r(document.body.innerText),500));});
  for(const sel of ['.o-fm','.o-fm .lgx-led','[data-act="fmpolicy"][data-v="fast"]','[data-act="fmpolicy"][data-v="explore"]','[data-act="fmreserve"]','[data-act="fmtoggle"]'])assert.equal(await page.evaluate(s=>!!document.querySelector(s),sel),true,sel+' is drawn');
  assert.ok(typeof text==='string');
  assert.deepEqual(errors,[]);
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
});
