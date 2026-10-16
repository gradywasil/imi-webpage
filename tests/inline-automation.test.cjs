const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
test('inline settings, acknowledged recovery and Shop tiers in both editions',async()=>{
 const puppeteer=require(process.env.PUPPETEER_MODULE||'C:/Users/arran/pp/node_modules/puppeteer-core');
 const root=path.resolve(__dirname,'..'), evidence=path.join(root,'docs/plan/long-game/evidence/UI-03A-inline-automation');
 const server=http.createServer((req,res)=>{
  const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  fs.readFile(file,(err,b)=>{if(err){res.writeHead(404).end();return;} res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.svg':'image/svg+xml','.png':'image/png'})[path.extname(file)]||'application/octet-stream');res.end(b);});
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 let browser; const results=[],errors=[];
 try{
  browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
  for(const edition of ['index','classic']){
   const context=await browser.createBrowserContext(); const page=await context.newPage(); page.setDefaultTimeout(6000); page.on('pageerror',e=>errors.push(e.message));
   await page.setViewport({width:360,height:560,isMobile:true,hasTouch:true});
   await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
   await page.evaluateOnNewDocument(()=>{localStorage.setItem('imi-tour','done');localStorage.setItem('imi-sound','off');});
   await page.goto(`http://127.0.0.1:${server.address().port}/${edition}.html#play`);
   await page.waitForFunction(()=>window.IMI?.ops?.extensions);
   await page.evaluate(()=>{
    const api=IMI.ops.extensions,s=api.state();Object.keys(s.intro).forEach(k=>s.intro[k]=true);s.intro.done=true;s.printing=5;s.chDone.hands=s.chDone.haiku=s.chDone.timed=true;s.legacy.stars=20;s.legacy.total=20;
    IMI.ops.dev.RECIPES.filter(r=>!r.kid&&!r.lib&&!r.gen).slice(0,8).forEach(r=>s.written[r.id]=true);s.desks[1].owned=true;s.stats.words=10;s.divTotal=1;s.muses.owned.seuss=true;IMI.bananas.add(10000);s.stats.letters=1000;s.daily={last:new Date().toDateString(),streak:1};s.rewards={};s.prem={};localStorage.setItem('imi-ops-v1',JSON.stringify(s));
   });
   await page.reload(); await page.waitForFunction(()=>window.IMI?.ops?.extensions?.automationAllowed());
   const go=async tab=>{await page.evaluate(tab=>IMI.ops.extensions.setTab(tab),tab);await new Promise(r=>setTimeout(r,350));};
   assert.equal(await page.$('[data-tab="automation"]'),null);
   await go('training');
   const desk=await page.$eval('[data-lg03-reserve]',el=>el.dataset.lg03Reserve);
   await page.click('[data-act="automation:toggle"]');
   await new Promise(r=>setTimeout(r,350));
   await page.select('[data-lg03-reserve]','40');
   await page.waitForFunction(id=>IMI.ops.extensions.state().meta.automation.desks[id].reservePercent===40,{},desk);
   assert.equal(await page.evaluate(id=>IMI.ops.extensions.state().meta.automation.desks[id].enabled,desk),true);
   await page.focus('[data-lg03-reserve]');
   await page.evaluate(()=>{IMI.ops.extensions.state().desks[0].letters.E=123;IMI.ops.extensions.mark();});
   await new Promise(r=>setTimeout(r,400));
   assert.equal(await page.evaluate(()=>document.activeElement.hasAttribute('data-lg03-reserve')),true);
   await page.evaluate(()=>{IMI.ops.extensions.state().sel=1;IMI.ops.extensions.mark();});
   await new Promise(r=>setTimeout(r,400));
   assert.notEqual(await page.$eval('[data-lg03-reserve]',el=>el.dataset.lg03Reserve),desk);
   await page.evaluate(()=>{IMI.ops.extensions.state().sel=0;IMI.ops.extensions.mark();});
   await new Promise(r=>setTimeout(r,400));
   // Fail the real acknowledged storage write, then retry the exact pending change.
   await page.evaluate(()=>{window.ui03SetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='imi-ops-v1')throw Error('UI03 controlled storage failure');return window.ui03SetItem.call(this,k,v);};});
   await page.click('[data-act="automation:toggle"]');
   await new Promise(r=>setTimeout(r,400));
   assert.equal(await page.evaluate(id=>IMI.ops.extensions.state().meta.automation.desks[id].enabled,desk),true);
   assert.match(await page.$eval('[data-automation="hire"]',el=>el.textContent),/Retry/);
   await page.evaluate(()=>{Storage.prototype.setItem=window.ui03SetItem;});
   await page.click('[data-act="automation:retry"]');
   await page.waitForFunction(id=>!IMI.ops.extensions.state().meta.automation.desks[id].enabled,{},desk);
   await go('shop');
   await page.click('[data-act="automation:shop-move"][data-item="contracts"][data-direction="-1"]');
   await page.waitForFunction(()=>IMI.ops.extensions.state().meta.automation.shop.priority[0]==='contracts');
   await page.click('[data-act="automation:upgrade"][data-helper="hire"]');
   await page.waitForFunction(()=>IMI.ops.extensions.state().meta.automation.tiers.hire===1);
   assert.equal(await page.evaluate(()=>IMI.ops.extensions.state().legacy.stars),19);
   await page.reload();await page.waitForFunction(()=>window.IMI?.ops?.extensions);
   assert.equal(await page.evaluate(id=>IMI.ops.extensions.state().meta.automation.desks[id].reservePercent,desk),40);
   assert.equal(await page.evaluate(()=>IMI.ops.extensions.state().meta.automation.shop.priority[0]),'contracts');
   const screens=[['training','hire'],['training','coach'],['shop','helpers'],['shop','shop'],['shop','restore'],['lab','garden'],['press','pitch','pitches'],['studios','media'],['muses','muse'],['legacy','print','press'],['legacy','challenge','challenges'],['floor','net']];
   for(const [tab,helper,sub] of screens){
    await go(tab);
    if(sub){await page.click(`[data-dept="${tab}"][data-sub="${sub}"]`);await new Promise(r=>setTimeout(r,350));}
    const sel=`#o-${tab} [data-automation="${helper}"]`;
    assert(await page.$(sel),sel);
    if(tab!=='floor') await page.$eval(sel,el=>el.scrollIntoView({block:'start'}));
    await page.screenshot({path:path.join(evidence,`${edition}-360-${helper}.png`)});
    results.push(await page.evaluate(({tab,helper})=>{
     const pane=document.querySelector('#o-'+tab),slot=pane.querySelector('[data-automation="'+helper+'"]');
     const ids=[...document.querySelectorAll('[id]')].map(el=>el.id);
     return {edition:document.documentElement.dataset.style,tab,helper,controls:slot.querySelectorAll('button,input,select').length,duplicates:ids.filter((id,i)=>ids.indexOf(id)!==i),pageScroll:document.documentElement.scrollHeight>innerHeight,fits:slot.getBoundingClientRect().left>=0&&slot.getBoundingClientRect().right<=innerWidth,wrongPurchase:[...document.querySelectorAll('[data-act="automation:upgrade"]')].some(el=>!el.closest('#o-shop'))};
    },{tab,helper}));
   }
   await go('training');await page.click('[data-dept="training"][data-sub="book"]');await new Promise(r=>setTimeout(r,350));assert.equal(await page.$('#o-training [data-automation]'),null);
   await go('shop');await page.click('[data-act="automation:settings"][data-helper="hire"]');
   await page.waitForSelector('#o-training:not([hidden]) [data-lg03-reserve]');
   await go('press');await page.click('[data-dept="press"][data-sub="titles"]');await new Promise(r=>setTimeout(r,350));assert.equal(await page.$('#o-press [data-automation="pitch"]'),null);
   await page.evaluate(()=>{
    const api=IMI.ops.extensions,current=api.state().meta.automation;
    const r=api.commitAutomation(JSON.stringify(current),{...current,print:{version:1,enabled:false,N:30}});
    if(!r.ok)throw Error(r.error);
   });
   await go('legacy');await page.click('[data-dept="legacy"][data-sub="press"]');await new Promise(r=>setTimeout(r,350));
   assert.equal(await page.$$eval('#lg08h-N',els=>els.length),1);
   await page.focus('#lg08h-N');
   await page.evaluate(()=>IMI.ops.extensions.mark());await new Promise(r=>setTimeout(r,350));
   assert.equal(await page.evaluate(()=>document.activeElement.id),'lg08h-N');
   await page.$eval('#lg08h-N',el=>{el.value='45';});await page.click('[data-act="automation:print-apply"]');
   await page.waitForFunction(()=>IMI.ops.extensions.state().meta.automation.print.N===45);
   await page.$eval('[data-automation="print"]',el=>el.scrollIntoView({block:'start'}));
   await page.screenshot({path:path.join(evidence,`${edition}-360-retained-print.png`)});
   for(const [width,height,tab,helper] of [[1280,800,'shop','helpers'],[390,700,'training','hire']]){
    await page.setViewport({width,height,isMobile:width<900,hasTouch:width<900});await go(tab);
    if(tab==='training'){await page.click('[data-dept="training"][data-sub="crew"]');await new Promise(r=>setTimeout(r,350));}
    await page.$eval(`[data-automation="${helper}"]`,el=>el.scrollIntoView({block:'start'}));
    await page.screenshot({path:path.join(evidence,`${edition}-${width}-${helper}.png`)});
   }
   await context.close();
  }
  fs.writeFileSync(path.join(evidence,'browser-results.json'),JSON.stringify({results,errors},null,2));
  assert.deepEqual(errors,[]);for(const r of results){assert.deepEqual(r.duplicates,[]);assert.equal(r.pageScroll,false);assert.equal(r.fits,true,JSON.stringify(r));assert.equal(r.wrongPurchase,false);}
 }finally{fs.writeFileSync(path.join(evidence,'browser-results.json'),JSON.stringify({results,errors},null,2));await browser?.close();await new Promise(r=>server.close(r));}
});
