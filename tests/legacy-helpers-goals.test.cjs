const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {spawn}=require('node:child_process');
const root=path.resolve(__dirname,'..'),evidence=path.join(root,'docs/plan/long-game/evidence/UI-04-legacy-and-compact-goals');
test('Legacy helper purchases and compact acknowledged goals in both editions',async()=>{
 const puppeteer=require(process.env.PUPPETEER_MODULE||'C:/Users/arran/pp/node_modules/puppeteer-core');
 const server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost'),file=path.resolve(root,'.'+url.pathname);
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  const before=url.searchParams.has('ui04Before')||req.headers.referer?.includes('ui04Before=1');
  const source=before&&['ops.js','automation.js','production-goal.js'].includes(path.basename(file))?path.join(evidence,'before',path.basename(file)):file;
  fs.readFile(source,(err,b)=>{if(err){res.writeHead(404).end();return;}res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.svg':'image/svg+xml','.png':'image/png'})[path.extname(file)]||'application/octet-stream');res.end(b);});
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const origin=`http://127.0.0.1:${server.address().port}`,results={origin,checks:[],layouts:[],errors:[]};let browser;
 try{
  browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
  for(const edition of ['index','classic']){
   const context=await browser.createBrowserContext(),page=await context.newPage();page.setDefaultTimeout(8000);page.on('pageerror',e=>results.errors.push(e.message));
   await page.setViewport({width:360,height:560,isMobile:true,hasTouch:true});await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
   await page.evaluateOnNewDocument(()=>{localStorage.setItem('imi-tour','done');localStorage.setItem('imi-sound','off');localStorage.setItem('imi-fx','low');});
   await page.goto(`${origin}/${edition}.html#play`);await page.waitForFunction(()=>window.IMI?.ops?.extensions?.state().meta.automation?.ownership);
   await page.evaluate(()=>{
    const s=IMI.ops.extensions.state();Object.keys(s.intro).forEach(k=>s.intro[k]=true);s.printing=5;s.chDone={hands:true,haiku:true,timed:true};s.legacy.stars=s.legacy.total=20;s.rewards={};s.prem={};s.daily={last:new Date().toDateString(),streak:1};
    IMI.ops.dev.RECIPES.filter(r=>!r.kid&&!r.lib&&!r.gen).slice(0,8).forEach(r=>s.written[r.id]=true);s.desks[1].owned=true;s.stats.words=10;s.stats.letters=1000;
    s.meta.automation={version:1,ownership:{version:1,owned:{shop:true,restore:true}}};
    const manual=IMI.ops.dev.RECIPES.find(r=>r.band===1&&!s.written[r.id]&&!r.kid&&!r.lib&&!r.gen);if(!manual)throw Error('Missing manual fixture');
    s.meta.productionGoal={version:1,enabled:true,band:1,collection:'authored',advance:false,manual:manual.id};s.focus=manual.id;s.autoFocus=false;
    localStorage.setItem('imi-ops-v1',JSON.stringify(s));
   });
   await page.reload();await page.waitForFunction(()=>window.IMI?.ops?.extensions?.automationAllowed());
   const go=async(tab,sub)=>{await page.evaluate(tab=>IMI.ops.extensions.setTab(tab),tab);if(sub)await page.click(`[data-dept="${tab}"][data-sub="${sub}"]`);await new Promise(r=>setTimeout(r,350));};
   await go('press','titles');assert.equal(await page.$eval('#pg01-range',el=>el.value),'1');assert(await page.$('[data-act="pgreturn"]'));
   assert.deepEqual(await page.$$eval('#pg01-range option',els=>els.map(el=>el.textContent)),['Auto','3-letter set','5-letter set','7-letter set','9-letter set','11-letter set','13-letter set']);
   assert.equal(await page.$$eval('[data-act="pgauto"],[data-act="pgband"]',els=>els.length),0);
   await page.click('[data-act="pgreturn"]');await page.waitForFunction(()=>IMI.ops.extensions.state().meta.productionGoal.manual===null);
   await page.waitForSelector('[data-act="pgreturn"]',{hidden:true});
   await page.select('#pg01-range','0');await new Promise(r=>setTimeout(r,350));await page.select('#pg01-range','1');await new Promise(r=>setTimeout(r,350));
   await page.click('.pg01-controls summary');await page.select('[data-in="pgcollection"]','kids');await new Promise(r=>setTimeout(r,350));await page.click('[data-act="pgadvance"]');
   await page.waitForFunction(()=>{const p=IMI.ops.extensions.state().meta.productionGoal;return p.band===1&&p.collection==='kids'&&p.advance;});
   await page.focus('#pg01-range');await page.evaluate(()=>IMI.ops.extensions.mark());await new Promise(r=>setTimeout(r,350));assert.equal(await page.evaluate(()=>document.activeElement.id),'pg01-range');
   await page.reload();await page.waitForFunction(()=>window.IMI?.ops?.extensions);await go('press','titles');
   assert.deepEqual(await page.evaluate(()=>{const p=IMI.ops.extensions.state().meta.productionGoal;return [p.enabled,p.band,p.collection,p.advance,p.manual];}),[true,1,'kids',true,null]);
   await page.evaluate(()=>{window.ui04SetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='imi-ops-v1')throw Error('UI04 controlled refused goal save');return window.ui04SetItem.call(this,k,v);};});
   await page.select('#pg01-range','auto');await page.waitForSelector('[data-act="pgretry"]');assert.equal(await page.evaluate(()=>IMI.ops.extensions.state().meta.productionGoal.enabled),true);
   await page.evaluate(()=>{Storage.prototype.setItem=window.ui04SetItem;});await page.click('[data-act="pgretry"]');await page.waitForFunction(()=>!IMI.ops.extensions.state().meta.productionGoal.enabled);
   await page.select('#pg01-range','1');await new Promise(r=>setTimeout(r,350));await page.click('.pg01-controls summary');await page.select('[data-in="pgcollection"]','authored');await new Promise(r=>setTimeout(r,350));await page.click('[data-act="pgadvance"]');
   await new Promise(r=>setTimeout(r,350));await page.click('.pg01-controls summary');
   await go('legacy','upgrades');
   assert.equal(await page.$$eval('[data-automation="helpers"] .o-card',els=>els.length),11);
   const styles=await page.evaluate(()=>{const ordinary=document.querySelector('[data-act="legbuy"]'),helper=document.querySelector('[data-act="automation:buy"]');const read=el=>{const b=getComputedStyle(el),c=getComputedStyle(el.closest('.o-card'));return {font:b.fontFamily,background:b.background,color:b.color,padding:c.padding,border:c.borderWidth,radius:c.borderRadius};};return [read(ordinary),read(helper)];});assert.deepEqual(styles[0],styles[1]);
   await page.click('[data-act="automation:buy"][data-helper="hire"]');await page.waitForFunction(()=>IMI.ops.extensions.state().meta.automation.ownership.owned.hire);assert.equal(await page.evaluate(()=>IMI.ops.extensions.state().legacy.stars),19);
   await page.waitForSelector('[data-act="automation:upgrade"][data-helper="hire"]');await page.click('[data-act="automation:upgrade"][data-helper="hire"]');await page.waitForFunction(()=>IMI.ops.extensions.state().meta.automation.tiers.hire===1);assert.equal(await page.evaluate(()=>IMI.ops.extensions.state().legacy.stars),18);
   await page.click('[data-act="automation:settings"][data-helper="hire"]');await page.waitForSelector('#o-training:not([hidden]) [data-lg03-reserve]');
   await go('shop');assert.equal(await page.$$eval('#o-shop [data-act="automation:buy"],#o-shop [data-act="automation:upgrade"]',els=>els.length),0);assert(await page.$('#o-shop [data-act="automation:shop-toggle"]'));assert(await page.$('#o-shop [data-act="automation:restore-toggle"]'));
   await page.reload();await page.waitForFunction(()=>window.IMI?.ops?.extensions);assert.deepEqual(await page.evaluate(()=>{const s=IMI.ops.extensions.state();return [s.legacy.stars,s.meta.automation.ownership.owned.hire,s.meta.automation.tiers.hire];}),[18,true,1]);
   for(const [width,height] of [[360,560],[1280,800]]){
    await page.setViewport({width,height,isMobile:width<900,hasTouch:width<900});
    for(const scene of ['legacy','titles']){
     await go(scene==='legacy'?'legacy':'press',scene==='legacy'?'upgrades':'titles');
     if(scene==='legacy')await page.$eval('[data-automation="helpers"]',el=>{el.previousElementSibling.scrollIntoView({block:'start'});el.closest('.o-pane').scrollTop-=el.closest('.o-pane').querySelector('.o-subtabs').offsetHeight+10;});
     else await page.$eval('.pg01-controls',el=>{el.closest('.o-pane').scrollTop=0;});
     const layout=await page.evaluate(scene=>{const pane=document.querySelector('.o-pane:not([hidden])'),controls=[...pane.querySelectorAll(scene==='legacy'?'[data-automation="helpers"] button':'.pg01-controls button,.pg01-controls select,.pg01-controls summary')].filter(el=>el.getBoundingClientRect().height);const ids=[...document.querySelectorAll('[id]')].map(el=>el.id);return {scene,pageScroll:document.documentElement.scrollHeight>innerHeight,overflow:pane.scrollWidth>pane.clientWidth,minHeight:Math.min(...controls.map(el=>el.getBoundingClientRect().height)),duplicates:ids.filter((id,i)=>ids.indexOf(id)!==i),low:document.documentElement.dataset.fx,reduced:IMI.reduceMotion};},scene);
     results.layouts.push({edition,width,height,...layout});assert.equal(layout.pageScroll,false);assert.equal(layout.overflow,false);assert(layout.minHeight>=40,JSON.stringify(layout));assert.deepEqual(layout.duplicates,[]);
     await page.screenshot({path:path.join(evidence,`${edition}-${width}-${scene}.png`)});
     if(scene==='legacy'){await page.$eval('[data-automation="helpers"] .o-card',el=>el.scrollIntoView({block:'center'}));await page.screenshot({path:path.join(evidence,`${edition}-${width}-helper.png`)});}
    }
   }
   await go('press','titles');await page.select('#pg01-range','auto');await page.reload();await page.waitForFunction(()=>window.IMI?.ops?.extensions);assert.equal(await page.evaluate(()=>IMI.ops.extensions.state().meta.productionGoal.enabled),false);
   results.checks.push({edition,manualFixture:true,returnToSet:true,dropdownCollectionAdvanceReload:true,refusedSaveExactRetry:true,purchaseDebitReload:true,settingsNavigation:true,shopSettingsRemain:true,sharedCardStyles:styles,autoReload:true});await context.close();
  }
  for(const before of [true,false]){
   const report=path.join(evidence,before?'economy-before.json':'economy-after.json');
   const run=await new Promise(resolve=>{const child=spawn(process.execPath,[path.join(root,'tools/balance.mjs'),'3','active','collect','1','3','{}','--url',`${origin}/tools/balance.html?featureProfile=legacy${before?'&ui04Before=1':''}`,'--output',report],{env:{...process.env,PUPPETEER_MODULE:'C:/Users/arran/pp/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js'},timeout:60000});let output='';child.stdout.on('data',b=>output+=b);child.stderr.on('data',b=>output+=b);child.on('close',status=>resolve({status,output}));});
   fs.writeFileSync(path.join(evidence,before?'economy-before.log':'economy-after.log'),run.output);assert.equal(run.status,0,run.output);
  }
  assert.deepEqual(results.errors,[]);
 }finally{fs.writeFileSync(path.join(evidence,'browser-results.json'),JSON.stringify(results,null,2));await browser?.close();await new Promise(r=>server.close(r));}
});
