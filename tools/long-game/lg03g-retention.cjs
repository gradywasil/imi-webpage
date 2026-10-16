const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const pp=require('C:/Users/arran/pp/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js');
const out='docs/plan/long-game/evidence/LG-03/implementation-challenges-r1';
(async()=>{const browser=await pp.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});const errors=[],checks=[];try{
const page=await browser.newPage();await page.setBypassServiceWorker(true);await page.setCacheEnabled(false);page.on('pageerror',e=>errors.push(e.message));
const passed=JSON.parse(fs.readFileSync(`${out}/focused-pass.json`)).results[0],s=passed.save;
s.challenge={id:'smallcrew',start:1700001000000,unknown:'preserve'};delete s.chDone.smallcrew;delete s.rewards.claims['challenge:smallcrew:first'];s.meta.automation.tiers.hire=0;
await page.evaluateOnNewDocument(f=>{window.__LONG_GAME_FIXTURE=f;for(const [k,v]of Object.entries(f))localStorage.setItem(k,v);},{'imi-ops-v1':JSON.stringify(s),'imi-score':passed.score});
await page.goto('http://127.0.0.1:8373/tools/balance.html');
const result=await page.evaluate(()=>{
const d=IMI.ops.dev,a=IMI.ops.extensions,s=d.S();const before=JSON.stringify({done:s.chDone,tiers:s.meta.automation.tiers,claims:s.rewards.claims,challenge:s.challenge});
__advance(2000);d.tick();a.save();const after=JSON.stringify({done:s.chDone,tiers:s.meta.automation.tiers,claims:s.rewards.claims,challenge:s.challenge});
return {before,after,state:s,stored:JSON.parse(localStorage.getItem('imi-ops-v1')),rewardsEnabled:Rewards.enabled,cap:d.upCap(d.UPS.find(u=>u.k==='paw'),s.desks[0]),automationAPI:!!a.buyAutomationTier};
});assert.equal(result.before,result.after);assert.equal(result.rewardsEnabled,false);assert.equal(result.cap,2);assert.equal(result.automationAPI,false);assert.equal(result.stored.challenge.unknown,'preserve');assert.equal(result.stored.chDone.smallcrew,undefined);assert.equal(result.stored.meta.automation.tiers.hire,0);checks.push('no-flags loaded active and completed new IDs, claims, tier metadata preserved; restrictions remain; no claimless first clear or automation activation');
// Actual soldCount accepts a registered pitched sale while excluding kid/library records.
const sold=await page.evaluate(()=>{const d=IMI.ops.dev,s=d.S(),p=d.registerPitch({id:'lg03g-controlled-pitch',title:'Controlled fixture',text:'a cat',pay:10});s.pitches.push({id:p.id,title:p.title,text:'a cat',pay:10});s.written=Object.fromEntries(d.RECIPES.filter(r=>r.kid||r.lib).slice(0,2).map(r=>[r.id,true]));const before=d.soldCount();s.bank={...p.need};d.touchBank();d.writeTitle(p.id);return {before,after:d.soldCount(),written:!!s.written[p.id]};});assert.deepEqual(sold,{before:0,after:1,written:true});checks.push('actual controlled pitched sale counts once; kid/library written records excluded');
assert.deepEqual(errors,[]);
fs.writeFileSync(`${out}/retention-and-pitched-sale.json`,JSON.stringify({checks,result,sold,errors,sourceHashes:Object.fromEntries(['ops.js','automation.js','rewards.js'].map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')]))},null,2),{flag:'wx'});console.log(checks.join('\n'));
}catch(e){fs.writeFileSync(`${out}/retention-failure-${Date.now()}.json`,JSON.stringify({error:e.stack,errors}),{flag:'wx'});throw e;}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
