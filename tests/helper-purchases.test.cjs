const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const os=require('node:os');
const {spawn}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const evidence=path.join(root,'docs/plan/long-game/evidence/UI-03C-helper-purchases');
test('acknowledged helper purchases, frozen admission and both edition layouts',async()=>{
 const puppeteer=require(process.env.PUPPETEER_MODULE||'C:/Users/arran/pp/node_modules/puppeteer-core');
 const server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost'),file=path.resolve(root,'.'+url.pathname);
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  // The accepted dirty source is the control, on the same task-owned server.
  const source=(url.searchParams.has('ui03cBefore')||req.headers.referer?.includes('ui03cBefore=1'))&&['ops.js','automation.js','auto-challenge.js'].includes(path.basename(file))?path.join(evidence,'before',path.basename(file)):file;
  fs.readFile(source,(err,b)=>{if(err){res.writeHead(404).end();return;}res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.svg':'image/svg+xml','.png':'image/png'})[path.extname(file)]||'application/octet-stream');res.end(b);});
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const origin=`http://127.0.0.1:${server.address().port}`;
 const profile=fs.mkdtempSync(path.join(os.tmpdir(),'ui03c-helper-profile-'));
 const results={origin,profile,checks:[],layouts:[],errors:[]};let browser;
 const record=(name,value=true)=>results.checks.push({name,value});
 try{
  browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,userDataDir:profile});
  for(const edition of ['index','classic']){
   const page=await browser.newPage();page.setDefaultTimeout(8000);page.on('pageerror',e=>results.errors.push(e.message));
   await page.setViewport({width:360,height:560,isMobile:true,hasTouch:true});
   await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
   await page.evaluateOnNewDocument(()=>{localStorage.setItem('imi-tour','done');localStorage.setItem('imi-sound','off');localStorage.setItem('imi-fx','low');});
   await page.goto(`${origin}/${edition}.html#play`);
   await page.waitForFunction(()=>window.IMI?.ops?.extensions?.state().meta.automation?.ownership);
   await page.evaluate(()=>{
    const s=IMI.ops.extensions.state();Object.keys(s.intro).forEach(k=>s.intro[k]=true);s.intro.done=true;s.printing=1;s.legacy.stars=100;s.legacy.total=100;s.chDone={hands:true};s.rewards={};s.prem={};
    s.meta.automation={version:1,ownership:{version:1,owned:{}}};s.daily={last:new Date().toDateString(),streak:1};localStorage.setItem('imi-ops-v1',JSON.stringify(s));
   });
   await page.reload();await page.waitForFunction(()=>window.IMI?.ops?.extensions?.automationAllowed());
   const go=async tab=>{await page.evaluate(tab=>IMI.ops.extensions.setTab(tab),tab);await new Promise(r=>setTimeout(r,400));if(tab==='legacy'){await page.click('[data-dept="legacy"][data-sub="upgrades"]');await new Promise(r=>setTimeout(r,400));}};
   await go('legacy');
   assert.equal(await page.$$eval('[data-act="automation:settings"]',els=>els.length),0);
   assert.equal(await page.$('[data-act="automation:buy"][data-helper="shop"]'),null);
   await page.click('[data-act="automation:buy"][data-helper="hire"]');
   await page.waitForFunction(()=>IMI.ops.extensions.state().meta.automation.ownership.owned.hire);
   assert.equal(await page.evaluate(()=>IMI.ops.extensions.state().legacy.stars),90);
   assert.equal(await page.evaluate(()=>Object.values(IMI.ops.extensions.state().meta.automation.desks||{}).some(d=>d.enabled)),false);
   const duplicate=await page.evaluate(()=>{const api=IMI.ops.extensions,q=api.quoteAutomationBase('hire');return api.buyAutomationBase('hire',q.expected);});assert.equal(duplicate.ok,false);
   await go('legacy');
   await page.waitForSelector('[data-act="automation:upgrade"][data-helper="hire"]');
   await page.click('[data-act="automation:settings"][data-helper="hire"]');
   await new Promise(r=>setTimeout(r,400));
   record(edition+' settings navigation',await page.evaluate(()=>({screen:IMI.screen(),ui:IMI.ops.dev.ui.tab,intro:IMI.ops.extensions.state().intro,desks:IMI.ops.extensions.state().desks.map(d=>d.owned),training:document.querySelector('#o-training').outerHTML.slice(0,1200),running:IMI.ops.extensions.automationAllowed()})));
   await page.screenshot({path:path.join(evidence,edition+'-settings-debug.png')});
   await page.waitForSelector('#o-training:not([hidden]) [data-act="automation:toggle"]');
   await page.click('[data-act="automation:toggle"]');
   await page.waitForFunction(()=>Object.values(IMI.ops.extensions.state().meta.automation.desks||{}).some(d=>d.enabled));
   await page.reload();await page.waitForFunction(()=>window.IMI?.ops?.extensions?.automationAllowed());
   assert.deepEqual(await page.evaluate(()=>{const s=IMI.ops.extensions.state();return {stars:s.legacy.stars,owned:s.meta.automation.ownership.owned.hire,on:Object.values(s.meta.automation.desks).some(d=>d.enabled)};}),{stars:90,owned:true,on:true});
   record(edition+' actual Buy/settings/enable/save/reload and duplicate refusal');
   if(edition==='index')fs.writeFileSync(path.join(evidence,'projection-fixture.json'),JSON.stringify(await page.evaluate(()=>IMI.ops.extensions.state()),null,2));
   await go('legacy');
   await page.evaluate(()=>{window.helperSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='imi-ops-v1')throw Error('UI03C controlled failed purchase save');return window.helperSetItem.call(this,k,v);};});
   record(edition+' failed-buy preflight',await page.evaluate(()=>({q:IMI.ops.extensions.quoteAutomationBase('coach'),button:document.querySelector('[data-act="automation:buy"][data-helper="coach"]').outerHTML})));
   await page.click('[data-act="automation:buy"][data-helper="coach"]');
   await new Promise(r=>setTimeout(r,400));
   record(edition+' failed-buy state',await page.evaluate(()=>({m:IMI.ops.extensions.state().meta.automation,text:document.querySelector('[data-automation="helpers"]').textContent})));
   await page.waitForSelector('[data-act="automation:retry"]');
   assert.deepEqual(await page.evaluate(()=>{const s=IMI.ops.extensions.state();return [s.legacy.stars,!!s.meta.automation.ownership.owned.coach];}),[90,false]);
   await page.evaluate(()=>{Storage.prototype.setItem=window.helperSetItem;});await page.$eval('[data-act="automation:retry"]',el=>el.click());
   await page.waitForFunction(()=>IMI.ops.extensions.state().meta.automation.ownership.owned.coach);
   assert.equal(await page.evaluate(()=>IMI.ops.extensions.state().legacy.stars),75);record(edition+' failed detached save and exact Retry debits once');
   await page.evaluate(()=>{const api=IMI.ops.extensions;api.state().printing=2;api.mark();});
   const stale=await page.evaluate(()=>{const api=IMI.ops.extensions,q=api.quoteAutomationBase('shop'),s=api.state(),before=s.legacy.stars;
    const next=JSON.parse(JSON.stringify(s.meta.automation));next.desks[Object.keys(next.desks)[0]].reservePercent=40;
    if(!api.commitAutomation(q.expected,next).ok)throw Error('fixture settings save failed');
    const r=api.buyAutomationBase('shop',q.expected);return {ok:r.ok,stars:s.legacy.stars,before,owned:!!s.meta.automation.ownership.owned.shop};});
   assert.equal(stale.ok,false);assert.equal(stale.stars,stale.before);assert.equal(stale.owned,false);record(edition+' stale quote refuses without debit');
   const enforce=await page.evaluate(()=>{const api=IMI.ops.extensions,s=api.state(),m=s.meta.automation,results=[];
    for(const id of ['shop','restore','net','garden','pitch','media','muse','print']){const next=JSON.parse(JSON.stringify(m));next[id]={...next[id],version:1,enabled:true};results.push([id,api.commitAutomation(JSON.stringify(m),next).ok]);}
    const next=JSON.parse(JSON.stringify(m));next.ownership.owned.shop=true;results.push(['forged ownership',api.commitAutomation(JSON.stringify(m),next).ok]);
    results.push(['tier without base',api.buyAutomationTier('shop',0,JSON.stringify(m)).ok]);
    results.push(['A11 selection',(()=>{try{AutoChallenge.selection(s);return true;}catch{return false;}})()]);return results;});
   enforce.forEach(([id,ok])=>assert.equal(ok,false,id));record(edition+' settings/base tier/A11 selection enforcement',enforce);
   await page.evaluate(()=>{const api=IMI.ops.extensions;api.state().legacy.stars=0;api.mark();});await go('legacy');
   assert.equal(await page.$eval('[data-act="automation:buy"][data-helper="shop"]',el=>el.disabled),true);
   for(const [width,height] of [[360,560],[1280,800]]){
    await page.setViewport({width,height,isMobile:width===360,hasTouch:width===360});await go('legacy');
    await page.$eval('[data-automation="helpers"] .o-card',el=>el.scrollIntoView({block:'start'}));
    const layout=await page.evaluate(()=>{const slot=document.querySelector('[data-automation="helpers"]');return {pageScroll:document.documentElement.scrollHeight>innerHeight,fit:slot.getBoundingClientRect().right<=innerWidth,minHeight:Math.min(...[...slot.querySelectorAll('button')].map(el=>el.getBoundingClientRect().height)),low:document.documentElement.dataset.fx,reduced:IMI.reduceMotion};});
    assert.equal(layout.pageScroll,false);assert.equal(layout.fit,true);assert(layout.minHeight>=40);assert.equal(layout.low,'low');assert.equal(layout.reduced,true);
    results.layouts.push({edition,width,height,...layout});await page.screenshot({path:path.join(evidence,`${edition}-${width}-shop.png`)});
   }
   await page.evaluate(()=>{const s=IMI.ops.extensions.state();s.printing=1;s.chDone={};s.legacy.stars=200;s.meta.automation={version:1,tiers:{version:1,hire:1},garden:{version:1,enabled:false,bed:0,letter:'E',desk:'mint',manual:{complete:false}},pitch:{version:1,enabled:false},print:{version:1,manual:{complete:true}},future:{keep:'unknown'}};s.rewards={};s.prem={};localStorage.setItem('imi-ops-v1',JSON.stringify(s));sessionStorage.setItem('ui03cFailAdmission','1');});
   await page.evaluateOnNewDocument(()=>{if(sessionStorage.getItem('ui03cFailAdmission')){window.helperSetItem=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='imi-ops-v1'&&JSON.parse(v).meta.automation?.ownership)throw Error('UI03C controlled failed admission');return window.helperSetItem.call(this,k,v);};}});
   await page.reload();await page.waitForFunction(()=>window.IMI?.ops?.extensions?.automationAllowed());await go('legacy');await page.waitForSelector('[data-act="automation:retry"]');
   assert.equal(await page.evaluate(()=>IMI.ops.extensions.state().meta.automation.ownership),undefined);
   const stoppedAt=await page.evaluate(()=>IMI.ops.extensions.state().stats.playSecs);
   await new Promise(r=>setTimeout(r,150));
   assert.equal(await page.evaluate(()=>IMI.ops.extensions.state().stats.playSecs),stoppedAt);
   await page.evaluate(()=>{const s=IMI.ops.extensions.state();s.printing=5;Storage.prototype.setItem=window.helperSetItem;sessionStorage.removeItem('ui03cFailAdmission');});
   await page.$eval('[data-act="automation:retry"]',el=>el.click());await page.waitForFunction(()=>IMI.ops.extensions.state().meta.automation.ownership);
   assert.deepEqual(await page.evaluate(()=>IMI.ops.extensions.state().meta.automation.ownership.owned),{hire:true,pitch:true});
   assert.deepEqual(await page.evaluate(()=>IMI.ops.extensions.state().meta.automation.future),{keep:'unknown'});
   await page.reload();await page.waitForFunction(()=>window.IMI?.ops?.extensions?.automationAllowed());
   assert.deepEqual(await page.evaluate(()=>IMI.ops.extensions.state().meta.automation.ownership.owned),{hire:true,pitch:true});record(edition+' old save admission frozen across failed save, future gates and reload; incomplete proof not earned');
   const grants=await page.evaluate(()=>{const hook=window.__OPS_EXTENSIONS.find(([id])=>id==='automation')[1],s=IMI.ops.extensions.state(),next=hook.firstClearFloor('quietshop',s.meta.automation);return {tier:next.tiers.shop,owned:!!next.ownership.owned.shop};});assert.deepEqual(grants,{tier:1,owned:false});record(edition+' future first-clear preserves tier without granting base');
   const tiers=await page.evaluate(()=>{const api=IMI.ops.extensions,s=api.state(),out=[];for(const level of [1,2]){const q=api.quoteAutomationTier('hire'),r=api.buyAutomationTier('hire',level,JSON.stringify(s.meta.automation));out.push({price:q.price,ok:r.ok,stars:s.legacy.stars,level:s.meta.automation.tiers.hire});}return out;});
   assert.deepEqual(tiers,[{price:50,ok:true,stars:150,level:2},{price:120,ok:true,stars:30,level:3}]);record(edition+' grandfathered existing tier keeps the paid upgrade path',tiers);
   await page.evaluate(()=>{const s=IMI.ops.extensions.state();s.meta.automation.ownership={version:99,owned:{hire:true},future:['keep']};localStorage.setItem('imi-ops-v1',JSON.stringify(s));});
   await page.reload();await page.waitForFunction(()=>window.IMI?.ops?.extensions);await go('legacy');
   assert.deepEqual(await page.evaluate(()=>IMI.ops.extensions.state().meta.automation.ownership),{version:99,owned:{hire:true},future:['keep']});
   assert.equal(await page.evaluate(()=>IMI.ops.extensions.quoteAutomationBase('net').ok),false);record(edition+' unsupported ownership preserved and blocked');
   await page.evaluate(()=>{localStorage.removeItem('imi-ops-v1');});await page.close();
  }
  // Brief unchanged default economy control on the same task-owned HTTP origin.
  for(const before of [true,false]){
   const report=path.join(evidence,before?'economy-before.json':'economy-after.json');
   const run=await new Promise(resolve=>{const child=spawn(process.execPath,[path.join(root,'tools/balance.mjs'),'3','active','collect','1','3','{}','--url',`${origin}/tools/balance.html?featureProfile=legacy${before?'&ui03cBefore=1':''}`,'--output',report],{env:{...process.env,PUPPETEER_MODULE:'C:/Users/arran/pp/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js'},timeout:60000});let stdout='',stderr='';child.stdout.on('data',b=>stdout+=b);child.stderr.on('data',b=>stderr+=b);child.on('close',status=>resolve({status,stdout,stderr}));});
   fs.writeFileSync(path.join(evidence,before?'economy-before.log':'economy-after.log'),run.stdout+run.stderr);assert.equal(run.status,0,run.stdout+run.stderr);
  }
  assert.deepEqual(results.errors,[]);
 }finally{fs.writeFileSync(path.join(evidence,'browser-results.json'),JSON.stringify(results,null,2));await browser?.close();await new Promise(r=>server.close(r));}
});


test('actual detached successor projections retain ownership; A11 selection requires its base',()=>{
 const vm=require('node:vm');
 const ctx=vm.createContext({window:null,location:{search:''},URLSearchParams,GameFeatures:{enabled:()=>true},Rewards:{enabled:true,owns:()=>true},IMI:{ops:{extensions:{identitySettled:()=>true,layerSettled:()=>true}}}});ctx.window=ctx;
 for(const file of ['layers.js','estate.js','auto-challenge.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),ctx);
 const s=JSON.parse(fs.readFileSync(path.join(evidence,'projection-fixture.json'),'utf8'));
 s.printing=7;s.legacy.total=4000;s.legacy.stars=100;
 s.meta.layers={version:1,count:5,baseline:0,seals:0,highestPrinting:8,purchases:{},genre:null,stamps:{}};
 s.meta.estate={version:1,count:3,localImprints:5,resetEpoch:0,starBaseline:0,charters:0};
 delete s.meta.folio;
 const marker=JSON.stringify(s.meta.automation.ownership), fresh=JSON.parse(JSON.stringify(s));
 const imprint=ctx.Layers.project(s,fresh),estate=ctx.Estate.project(s,fresh,true);
 const source=fs.readFileSync(path.join(root,'ops.js'),'utf8');
 ctx.layers=ctx.Layers;ctx.fresh=()=>JSON.parse(JSON.stringify(fresh));ctx.printingQuote=()=>({printing:7,stars:100,total:4000,gain:10});ctx.worksPlay=null;ctx.pg=null;ctx.lgb=null;ctx.pitchCopy=x=>JSON.parse(JSON.stringify(x));
 vm.runInContext(source.slice(source.indexOf('  function printingRoom('),source.indexOf('  function printingPending()')),ctx);
 const printing=ctx.printingRoom(s,[],123,'manual',null);
 for(const next of [imprint,estate,printing])assert.equal(JSON.stringify(next.meta.automation.ownership),marker);
 const ids=['ape-in-the-cape','goodnight-baboon','very-hungry-capuchin','three-little-twigs','chimp-in-the-hat','green-eggs-and-hamster','peter-panzee','swing-in-the-willows','charlie-chimpolate','wild-apes'];
 const gold={version:1,rule:1,origin:'manual',medal:'gold',target:10,sequence:1,resetEpoch:0,printing:7,imprint:5,id:'mastery:e0:1',required:ids,sold:ids,contained:['bronze','silver','gold']};
 s.chDone.smallcrew=true;s.legacy.ups.crew=1;s.meta.challengeMastery={highest:gold};
 s.meta.automation.challenge={version:1,sequence:0,cursor:0,enabled:true,disclosed:true,selected:['smallcrew'],gold};
 assert.equal(!!ctx.AutoChallenge.earned(s),true);
 assert.throws(()=>ctx.AutoChallenge.selection(s),/A11 requires/);
 s.meta.automation.ownership.owned.challenge=true;
 assert.equal(ctx.AutoChallenge.selection(s).mode,'smallcrew-auto');
 fs.writeFileSync(path.join(evidence,'projection-results.json'),JSON.stringify({printing:true,imprint:true,estate:true,A11EarnedWithoutBaseRefused:true,A11OwnedSelection:true},null,2));
});

test('execution owners reject enabled but unowned later helpers and Banana net',()=>{
 const vm=require('node:vm'),s=JSON.parse(fs.readFileSync(path.join(evidence,'projection-fixture.json'),'utf8'));
 s.printing=5;s.meta.estate={count:3};s.meta.layers={count:5};s.meta.automation={version:1,ownership:{version:1,owned:{}},
  garden:{version:1,enabled:true,manual:{complete:true}},pitch:{version:1,enabled:true,manual:{complete:true}},
  media:{version:1,enabled:true,manual:{complete:true}},muse:{version:1,enabled:true,manual:{complete:true,ids:['seuss','poe']}},
  print:{version:1,enabled:true,disclosed:true,manual:{complete:true}},net:{version:1,enabled:true}};
 const noop=()=>{},ctx=vm.createContext({window:null,location:{search:''},URLSearchParams,GameFeatures:{enabled:()=>true},
  Layers:{current:()=>({count:5}),epochValid:()=>true},IMI:{screen:()=> 'game',onScreen:noop,tour:{active:()=>false}},
  document:{hidden:false,body:{},querySelector:()=>null,addEventListener:noop},addEventListener:noop,MutationObserver:class{observe(){}}});ctx.window=ctx;
 vm.runInContext(fs.readFileSync(path.join(root,'automation.js'),'utf8'),ctx);
 const api={state:()=>s,automationDesks:()=>[],mark:noop,automationAllowed:()=>true,gardenEnabled:()=>true,pitchEnabled:()=>true,mediaEnabled:()=>true,museEnabled:()=>true,printingEnabled:()=>true,
  validPitch:()=>true,validMedia:()=>true,challengeEnabled:()=>false,challengeCommissionAllowed:()=>true,challengeSeatsLocked:()=>false,pitchStatus:()=>({pending:false}),museStatus:()=>({pending:false}),masteryActive:()=>false};
 const hook=ctx.__OPS_EXTENSIONS[0][1];hook.init('load',api);
 for(const key of ['gardenReady','pitchReady','mediaReady','museReady'])assert.equal(hook[key](),false,key);
 assert.equal(hook.validPrintDecision({},s,{}),false);
 let tested=0;hook.netCreated('ordinary',{valid:()=>{tested++;return true;}});assert.equal(tested,0);
 for(const id of ['garden','pitch','media','muse'])s.meta.automation.ownership.owned[id]=true;
 for(const key of ['gardenReady','pitchReady','mediaReady','museReady'])assert.equal(hook[key](),true,key);
});
