const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const os=require('node:os');
const root=path.resolve(__dirname,'..');
const flags='?lg08print=1&lg03=1&lg01a=1&lg05folio=1&lg05layers=1&lg08estate=1#play';

// Long-game scope phase A: the real Printing flow pays the canonical quote at exact boundaries,
// refuses a stale quote, and a reload or repeat press mints nothing.
test('Printing pays the canonical quote at exact thresholds, refuses stale quotes, and mints nothing on repeat',async()=>{
 const puppeteer=require(process.env.PUPPETEER_MODULE||'C:/Users/arran/pp/node_modules/puppeteer-core');
 const server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost'),file=path.resolve(root,'.'+url.pathname);
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  fs.readFile(file,(err,b)=>{if(err){res.writeHead(404).end();return;}res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.svg':'image/svg+xml','.png':'image/png'})[path.extname(file)]||'application/octet-stream');res.end(b);});
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const origin=`http://127.0.0.1:${server.address().port}`;
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'printing-quote-profile-'));
 let browser;
 try{
  browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,userDataDir:profile});
  const page=await browser.newPage();page.setDefaultTimeout(15000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.setViewport({width:1000,height:800});
  await page.evaluateOnNewDocument(()=>{
   if(sessionStorage.getItem('seeded'))return;sessionStorage.setItem('seeded','1');
   localStorage.setItem('imi-tour','done');localStorage.setItem('imi-sound','off');localStorage.setItem('imi-fx','low');
   localStorage.setItem('imi-ops-v1',JSON.stringify({economyVersion:99,lastSeen:Date.now(),intro:{version:1,done:true,train:true,words:true,shop:true,hireAt:0},stats:{letters:90000,manual:900,words:600},
    legacy:{stars:0,total:0,ups:{},k:10},printing:1,desks:[{owned:true,paws:0}]}));
   localStorage.setItem('imi-score',JSON.stringify({economyVersion:99,score:5e9}));
  });
  await page.goto(origin+'/index.html'+flags);
  await page.waitForFunction(()=>window.IMI?.ops?.extensions?.state&&window.Rewards?.owns()&&IMI.ops.progression.running()&&!Rewards.held());
  const quote=await page.evaluate(()=>{
   const clear=()=>document.querySelectorAll('.o-modal,.o-celebrate').forEach(e=>e.remove());
   const a=IMI.ops.extensions,s=()=>a.state(),out={};
   s().pub.on=false;s().desks.forEach(d=>{d.paws=0;d.crew=[];d.keeper.on=false;});
   // 93 stars is an exact threshold where the old float formula reviewed 92
   s().run.earned=Economy.starAt(93);out.deep=a.printingReview().gain;
   s().run.earned=Economy.starAt(93)-1;out.deepBelow=a.printingReview().gain;
   // exact first threshold: reviewed quote and paid stars both equal the economy quote
   s().run.earned=Economy.starBase;
   out.reviewed=a.printingReview().gain;
   // a quote reviewed at 12.5M goes stale once the run reaches the next threshold
   const stale=a.printingReview();
   s().run.earned=Economy.starAt(11);
   out.staleRefused=!Rewards.printingAction({origin:'manual',quote:stale}).ok;
   out.staleLeftState={printing:s().printing,total:s().legacy.total,earned:s().run.earned};
   clear();
   // the fresh quote at exactly 15.125M pays 11, one more than the old float formula allowed to be sure of
   const fresh=a.printingReview();out.freshGain=fresh.gain;
   const before=s().legacy.total,printing=s().printing;
   out.paid=Rewards.printingAction({origin:'manual',quote:fresh}).ok;
   clear();
   out.delta=s().legacy.total-before;out.printingStep=s().printing-printing;out.earnedAfter=s().run.earned;
   out.repeatThrows=(()=>{try{a.printingReview();return false;}catch(e){return e.message;}})();
   return out;
  });
  assert.equal(quote.deep,93,'exact 93-star threshold reviews 93');
  assert.equal(quote.deepBelow,92,'one banana unit below reviews 92');
  assert.equal(quote.reviewed,10,'12.5M reviews 10 stars');
  assert.equal(quote.staleRefused,true,'a quote reviewed before the threshold moved is refused');
  assert.deepEqual(quote.staleLeftState,{printing:1,total:0,earned:15125000},'stale refusal leaves the room untouched');
  assert.equal(quote.freshGain,11,'15.125M reviews 11 stars');
  assert.equal(quote.paid,true);
  assert.equal(quote.delta,11,'ledger pays exactly the reviewed stars');
  assert.equal(quote.printingStep,1);
  assert.equal(quote.earnedAfter,0);
  assert.match(String(quote.repeatThrows),/./,'a second Printing with no new production is refused');
  // instrumentation: the Printing closed one measured cycle and the room is now timing the next
  await page.waitForFunction(()=>IMI.ops.dev.cycles().open?.seconds>0);
  const cycles=await page.evaluate(()=>IMI.ops.dev.cycles());
  assert.equal(cycles.cycles.at(-1)?.kind,'printing','the reset closed a cycle');
  assert.equal(cycles.open.index,cycles.cycles.length,'the next cycle is numbered after the closed ones');
  // reload: the reward is neither lost nor repeated
  await page.reload();
  await page.waitForFunction(()=>window.IMI?.ops?.extensions?.state&&window.Rewards?.owns()&&IMI.ops.progression.running()&&!Rewards.held());
  const after=await page.evaluate(()=>{const s=IMI.ops.extensions.state();return {total:s.legacy.total,stars:s.legacy.stars,printing:s.printing,earned:s.run.earned};});
  assert.deepEqual({total:after.total,stars:after.stars,printing:after.printing},{total:11,stars:11,printing:2},'reload keeps the single payout');
  assert.ok(after.earned<12500000,'the new room (now with its free crew) has earned something small, not a second reward');
  assert.deepEqual(errors,[]);
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
});
