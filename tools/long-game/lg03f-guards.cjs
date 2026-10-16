const fs=require('node:fs'),assert=require('node:assert/strict');
const pp=require('C:/Users/arran/pp/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js');
(async()=>{
 const browser=await pp.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.setBypassServiceWorker(true);
  await page.goto('http://127.0.0.1:8371/tools/balance.html?lg01a=1&lg03=1');await page.waitForFunction(()=>!!IMI?.ops?.extensions?.buyAutomationTier&&Rewards.owns());
  const result=await page.evaluate(()=>{
   const a=IMI.ops.extensions,h=__OPS_EXTENSIONS.find(([id])=>id==='automation')[1];
   a.state().intro.done=true;
   for(let i=0;i<2;i++){a.state().run.earned=12500000;IMI.ops.dev.doPrint();}
   const s=a.state();s.legacy.stars=5;Rewards.checkpoint();
   const first=a.buyAutomationTier('hire',0,null);const set=Storage.prototype.setItem;
   Storage.prototype.setItem=function(k,v){if(k==='imi-ops-v1')throw Error('LG03F writer-hold refusal');return set.call(this,k,v);};
   h.actions.upgrade({dataset:{helper:'shop',level:'0'}});const refused={stars:s.legacy.stars,shop:s.meta.automation.tiers.shop??0};
   Storage.prototype.setItem=set;h.actions.retry();const retried={stars:s.legacy.stars,shop:s.meta.automation.tiers.shop};
   Storage.prototype.setItem=function(k,v){if(k==='imi-ops-v1')throw Error('LG03F held guard');return set.call(this,k,v);};Rewards.checkpoint();Storage.prototype.setItem=set;
   const before=s.legacy.stars,held=!a.automationAllowed(),blocked=a.buyAutomationTier('hire',1,JSON.stringify(s.meta.automation));
   const recovered=Rewards.retry();return {first,refused,retried,held,blocked,noDebit:s.legacy.stars===before,recovered};
  });
  assert.equal(result.first.ok,true);assert.deepEqual(result.refused,{stars:4,shop:0});assert.deepEqual(result.retried,{stars:3,shop:1});assert.equal(result.held,true);assert.equal(result.blocked.ok,false);assert.equal(result.noDebit,true);assert.equal(result.recovered,true);assert.deepEqual(errors,[]);
  fs.writeFileSync('docs/plan/long-game/evidence/LG-03/implementation-tiers-r1/writer-guards.json',JSON.stringify({result,errors},null,2),{flag:'wx'});console.log('Actual Rewards save owner, refusal/Retry and held guard pass');
 }finally{await browser.close();}
})().catch(e=>{fs.writeFileSync(`docs/plan/long-game/evidence/LG-03/implementation-tiers-r1/writer-failure-${Date.now()}.json`,JSON.stringify({error:e.stack}),{flag:'wx'});console.error(e);process.exitCode=1;});
