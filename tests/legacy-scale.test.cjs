const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const os=require('node:os');
const root=path.resolve(__dirname,'..');
// Second Printing must work while typists keep typing, and saves from before the x10 star scale convert once.
test('Second Printing survives a live room; old star counts convert to the new scale',async()=>{
 const puppeteer=require(process.env.PUPPETEER_MODULE||'C:/Users/arran/pp/node_modules/puppeteer-core');
 const server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost'),file=path.resolve(root,'.'+url.pathname);
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  fs.readFile(file,(err,b)=>{if(err){res.writeHead(404).end();return;}res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.svg':'image/svg+xml','.png':'image/png'})[path.extname(file)]||'application/octet-stream');res.end(b);});
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const origin=`http://127.0.0.1:${server.address().port}`;
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'legacy-scale-profile-'));
 let browser;
 try{
  browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,userDataDir:profile});
  const page=await browser.newPage();page.setDefaultTimeout(10000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewport({width:1000,height:800});
  await page.evaluateOnNewDocument(()=>{
   if(sessionStorage.getItem('seeded'))return;sessionStorage.setItem('seeded','1');
   localStorage.setItem('imi-tour','done');localStorage.setItem('imi-sound','off');localStorage.setItem('imi-fx','low');
   // a save written before stars were counted in tenths: 3 stars earned, 1 unspent, Seed Money level 1
   localStorage.setItem('imi-ops-v1',JSON.stringify({economyVersion:99,lastSeen:Date.now(),intro:{version:1,done:true,train:true,words:true,shop:true,hireAt:0},stats:{letters:90000,manual:900,words:600},
    legacy:{stars:1,total:3,ups:{seed:1}},printing:2,desks:[{owned:true,paws:6}]}));
   localStorage.setItem('imi-score',JSON.stringify({economyVersion:99,score:5e9}));
  });
  await page.goto(`${origin}/index.html?lgb=0#play`);     // this test is about the old economy, which stays available behind lgb=0
  await page.waitForFunction(()=>window.IMI?.ops?.extensions?.state);
  const legacy=await page.evaluate(()=>IMI.ops.extensions.state().legacy);
  assert.deepEqual({stars:legacy.stars,total:legacy.total,k:legacy.k,seed:legacy.ups.seed},{stars:10,total:30,k:10,seed:1});
  // the live room: earn enough for a press, open the dialog, wait while the typists type, then confirm
  await page.evaluate(()=>{const s=IMI.ops.extensions.state();s.run.earned=5e5*25*4;});
  await page.evaluate(()=>IMI.ops.extensions.setTab('legacy'));
  await page.waitForSelector('[data-act="printask"]:not(:disabled)');
  await page.click('[data-act="printask"]');
  await page.waitForSelector('.o-modal [data-ok]');
  const before=await page.evaluate(()=>IMI.ops.extensions.state().stats.letters);
  await new Promise(r=>setTimeout(r,2500));
  assert((await page.evaluate(()=>IMI.ops.extensions.state().stats.letters))>before,'typists should still be typing behind the dialog');
  await page.click('.o-modal [data-ok]');
  await page.waitForFunction(()=>IMI.ops.extensions.state().printing===3,{timeout:8000});
  const after=await page.evaluate(()=>IMI.ops.extensions.state().legacy);
  assert.equal(after.total,30+Math.floor(10*Math.sqrt(4)));
  assert.equal(after.stars,10+Math.floor(10*Math.sqrt(4)));
  // starting perks bought mid-run pay out in this run too
  await page.evaluate(()=>{const s=IMI.ops.extensions.state();s.desks[0].paws=1;s.hold=false;s.legacy.stars+=200;s.legacy.total+=200;IMI.ops.dev.ui.sub.legacy='upgrades';IMI.ops.extensions.setTab('legacy');});
  await page.waitForSelector('[data-act="legbuy"][data-id="crew"]:not(:disabled)');
  await page.$eval('[data-act="legbuy"][data-id="crew"]',el=>el.click());
  assert.deepEqual(await page.evaluate(()=>{const s=IMI.ops.extensions.state();return [s.desks[0].paws,s.desks[0].crew.length,s.hold];}),[3,3,true]);
  const before2=await page.evaluate(()=>IMI.bananas.get());
  await page.$eval('[data-act="legbuy"][data-id="seed"]',el=>el.click());
  assert.equal((await page.evaluate(()=>IMI.bananas.get()))-before2>=25000,true);
  assert.deepEqual(errors,[]);
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
});
