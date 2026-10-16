const fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const pp=require('C:/Users/arran/pp/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js');
const out='docs/plan/long-game/evidence/LG-05/implementation-imprints-r1';
(async()=>{
 const browser=await pp.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const proof=[];
 try{
  const fixture=JSON.parse(fs.readFileSync(`${out}/final-r2-result.json`)).final;
  for(const shell of ['index','classic']){
   const context=await browser.createBrowserContext(),page=await context.newPage(),loaded={},reads=[];
   await page.setViewport({width:360,height:560});await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);await page.setBypassServiceWorker(true);await page.setCacheEnabled(false);
   page.on('response',r=>{const f=new URL(r.url()).pathname.slice(1);if(['layers.js','layers.css','ops.js','folio.js','rewards.js','core.js'].includes(f))reads.push(r.buffer().then(b=>loaded[f]=crypto.createHash('sha256').update(b).digest('hex')));});
   await page.evaluateOnNewDocument(f=>{f.state.lastSeen=Date.now();localStorage.setItem('imi-ops-v1',JSON.stringify(f.state));localStorage.setItem('imi-score',JSON.stringify(f.savedWallet));localStorage.setItem('imi-fx','low');localStorage.setItem('imi-tour','done');},fixture);
   await page.goto(`http://127.0.0.1:8393/${shell}.html?lg01a=1&lg05folio=1&lg05layers=1#play`);await page.waitForFunction(()=>IMI.ops?.progression.running());
   await page.evaluate(()=>IMI.ops.extensions.setTab('imprints'));await page.waitForSelector('[data-act="layers:press"]');
   await page.$eval('[data-act="layers:press"]',el=>el.scrollIntoView({block:'center'}));await page.screenshot({path:`${out}/current3-${shell}-purchases-360.png`});
   await page.$eval('[data-act="layers:genre"]',el=>el.scrollIntoView({block:'center'}));await page.screenshot({path:`${out}/current3-${shell}-genre-360.png`});
   const pane=await page.evaluate(()=>({pageScroll:document.documentElement.scrollHeight>innerHeight,buttons:[...document.querySelectorAll('.layers button')].map(x=>({text:x.textContent,height:x.getBoundingClientRect().height}))}));
   await page.evaluate(()=>{const s=IMI.ops.dev.S();s.printing=7;s.legacy.total=180;IMI.ops.extensions.mark();});await page.waitForFunction(()=>{try{return !!Layers.quote(IMI.ops.dev.S());}catch{return false;}},{timeout:2000}).catch(async e=>{console.error(await page.evaluate(()=>{try{return Layers.quote(IMI.ops.dev.S());}catch(e){return {error:e.message,state:IMI.ops.dev.S()};}}));throw e;});await page.waitForSelector('[data-act="layers:preview"]:not(:disabled)',{timeout:2000});await page.click('[data-act="layers:preview"]');
   await page.waitForSelector('.layer-confirm',{timeout:2000}).catch(async e=>{console.error(await page.evaluate(()=>({text:document.body.innerText,held:Rewards.held(),running:IMI.ops.progression.running()})));throw e;});await page.screenshot({path:`${out}/current3-${shell}-confirm-360.png`});
   const modal=await page.evaluate(()=>{const el=document.querySelector('.layer-details');return {pageScroll:document.documentElement.scrollHeight>innerHeight,scroll:el.scrollHeight,height:el.clientHeight,buttons:[...document.querySelectorAll('.layer-confirm button')].map(x=>({text:x.textContent,height:x.getBoundingClientRect().height}))};});
   await page.click('[data-cancel]');await Promise.all(reads);assert(!pane.pageScroll&&!modal.pageScroll);assert(modal.buttons.every(x=>x.height>=40)&&pane.buttons.every(x=>x.height>=40));
   proof.push({shell,controlledFixture:true,low:true,reducedMotion:true,pane,modal,loaded});await context.close();
  }
  fs.writeFileSync(`${out}/current3-ui.json`,JSON.stringify(proof,null,2),{flag:'wx'});console.log('Current-byte both-style 360 UI PASS');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
