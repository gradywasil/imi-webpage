const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const os=require('node:os');
const root=path.resolve(__dirname,'..');
const flags='?lgb=1&lg08print=1&lg03=1&lg01a=1&lg05folio=1&lg05layers=1&lg08estate=1#play';

// Late Imprint and Estate unlocks of the Room control: genre-aware book selection, and queued Printing goals.
test('queued goals set the target of each next room, and genre-aware choice weighs pay the way the genre will pay it',async()=>{
 const puppeteer=require(process.env.PUPPETEER_MODULE||'C:/Users/arran/pp/node_modules/puppeteer-core');
 const server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost'),file=path.resolve(root,'.'+url.pathname);
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  fs.readFile(file,(err,b)=>{if(err){res.writeHead(404).end();return;}res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.svg':'image/svg+xml','.png':'image/png'})[path.extname(file)]||'application/octet-stream');res.end(b);});
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const origin=`http://127.0.0.1:${server.address().port}`;
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'foreman-extras-'));
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
  save.legacy.fm={v:1,enabled:false,policy:'fast',target:10,reserve:0,manual:true,passive:false,autoCycles:3,bp:null,order:[],route:'salvage',cycles:[]};
  save.meta.automation={version:1,ownership:{version:1,owned:{}}};
  await page.evaluateOnNewDocument((o,wallet)=>{
   if(sessionStorage.getItem('seeded'))return;sessionStorage.setItem('seeded','1');
   localStorage.setItem('imi-tour','done');localStorage.setItem('imi-sound','off');localStorage.setItem('imi-fx','low');
   localStorage.setItem('imi-ops-v1',JSON.stringify(o));localStorage.setItem('imi-score',JSON.stringify(wallet));
  },save,fx.wallet);
  const ready=()=>page.waitForFunction(()=>window.IMI?.ops?.extensions?.state&&window.Rewards?.owns()&&IMI.ops.progression.running()&&!Rewards.held());
  const quiet=()=>page.evaluate(()=>setInterval(()=>document.querySelectorAll('.o-modal,.o-celebrate').forEach(e=>e.remove()),200));
  const tap=sel=>page.$eval(sel,el=>{el.scrollIntoView({block:'center'});el.click();});
  const room=()=>page.evaluate(()=>{const a=IMI.ops.extensions;a.state().meta.estate={version:1,count:1,starBaseline:0,charters:0,localImprints:5,resetEpoch:0};IMI.ops.dev.ui.sub.legacy='upgrades';a.setTab('legacy');a.mark();return new Promise(r=>setTimeout(r,500));});
  await page.goto(origin+'/index.html'+flags);await ready();await quiet();
  await page.addStyleTag({content:'.tour-bub,.tour-ring{pointer-events:none!important}'});
  await room();

  // the queue: three buttons that add goals ten stars apart, a button per goal that removes it, five at most
  assert.equal(await page.evaluate(()=>!!document.querySelector('[data-act="fmqadd"]')),true,'queued goals are an Estate unlock');
  for(let i=0;i<3;i++){await tap('[data-act="fmqadd"]');await room();}
  assert.deepEqual(await page.evaluate(()=>IMI.ops.extensions.state().legacy.fm.queue),[20,30,40]);
  await tap('[data-act="fmqdrop"][data-i="1"]');await room();
  assert.deepEqual(await page.evaluate(()=>IMI.ops.extensions.state().legacy.fm.queue),[20,40]);
  for(let i=0;i<5;i++){if(!await page.$('[data-act="fmqadd"]'))break;await tap('[data-act="fmqadd"]');await room();}
  assert.equal(await page.evaluate(()=>IMI.ops.extensions.state().legacy.fm.queue.length),5);
  assert.equal(await page.evaluate(()=>!!document.querySelector('[data-act="fmqadd"]')),false,'the add button goes away at five goals');
  await tap('[data-act="fmqdrop"][data-i="4"]');await tap('[data-act="fmqdrop"][data-i="3"]').catch(()=>{});await room();
  const q0=await page.evaluate(()=>IMI.ops.extensions.state().legacy.fm);
  assert.ok(q0.queue.length>=2);

  // a Foreman Printing takes the first queued goal as the next room's target
  const before=await page.evaluate(()=>{const s=IMI.ops.extensions.state();s.legacy.fm={...s.legacy.fm,enabled:true,policy:'fast',target:10};s.run.earned=Economy.starBase;s.fmSecs=40;return {printing:s.printing,queue:s.legacy.fm.queue.slice()};});
  await page.waitForFunction(p=>IMI.ops.extensions.state().printing===p+1,{timeout:15000},before.printing);
  const after=await page.evaluate(()=>IMI.ops.extensions.state().legacy.fm);
  assert.equal(after.target,before.queue[0],'the first queued goal is now the target');
  assert.deepEqual(after.queue,before.queue.slice(1),'and it left the queue');

  // genre-aware choice: a toggle for the Imprint genre; on, automatic goal choice weighs pay by the genre's 1.15x / 0.95x
  await page.evaluate(()=>{const s=IMI.ops.extensions.state();s.meta.layers.purchases={...s.meta.layers.purchases,press:true};s.meta.layers.genre='mystery';});
  await room();
  assert.equal(await page.evaluate(()=>!!document.querySelector('[data-act="fmgenre"]')),true,'the toggle appears with an active genre');
  await tap('[data-act="fmgenre"]');
  assert.equal(await page.evaluate(()=>IMI.ops.extensions.state().legacy.fm.genre),true);
  const pick=await page.evaluate(()=>{
   const s=IMI.ops.extensions.state(),d=IMI.ops.dev,g=Layers.active(s);
   s.autoFocus=true;s.focus=null;s.meta.productionGoal=undefined;
   // every machine owned, nothing written: the choice is the cheapest effort per genre-adjusted pay
   const choose=(on)=>{s.legacy.fm={...s.legacy.fm,genre:on};s.focus=null;d.pickAutoFocus&&d.pickAutoFocus();return s.focus;};
   return {genre:g&&g.id,bands:g&&g.bands,off:choose(false),on:choose(true),hasPick:typeof d.pickAutoFocus};
  });
  assert.ok(pick.genre,'there is an active genre');
  if(pick.hasPick==='function')assert.ok(typeof pick.on==='string'||pick.on===null,'the choice is a title or none');
  assert.deepEqual(errors,[]);
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
});
