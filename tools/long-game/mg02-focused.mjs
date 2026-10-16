// Focused MG-02 checks on an isolated origin, using native acknowledged writes.
import {readFile, writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
const {default:puppeteer} = await import(pathToFileURL(process.env.PUPPETEER_MODULE).href);
const out = 'docs/plan/long-game/evidence/MG-02/implementation-r1';
const fixture = JSON.parse(await readFile('docs/plan/long-game/evidence/MG-01/implementation-r1/controlled-save.json','utf8'));
const browser = await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--no-sandbox']});
const checks=[], errors=[];
try {
  const page=await browser.newPage(); page.on('pageerror',e=>errors.push(e.message));
  await page.setBypassServiceWorker(true);
  const seed=await page.evaluateOnNewDocument(s=>{
    s.lastSeen=Date.now();s.daily={last:new Date().toDateString(),streak:1};
    s.meta.minigames={version:1,wallet:190,fraction:.25,attempts:6,refillAt:Date.now()-86400000,nextSession:1,active:null,settled:0,unknown:'retained'};
    localStorage.setItem('imi-ops-v1',JSON.stringify(s));
    localStorage.setItem('imi-score',JSON.stringify({economyVersion:1,score:0}));
  },fixture);
  await page.goto('http://127.0.0.1:8342/index.html?mg01=1&s=pixel#play');
  await page.removeScriptToEvaluateOnNewDocument(seed.identifier);
  await page.waitForFunction(()=>!!window.IMI?.ops?.dev);
  const m=()=>page.evaluate(()=>structuredClone(IMI.ops.extensions.state().meta.minigames));
  const stats=()=>page.evaluate(()=>{const d=IMI.ops.dev;return {typing:d.typistSpeed({xp:0}),keeper:d.keeperPeriod(0),sale:d.salePay({pay:100000,band:0},1),hold:d.holdRate(d.S().desks[0]),roy:d.royBase(),div:d.divBase(),speed:IMI.ops.clock.speed(),cap:d.awayCap(),eff:d.awayEff()};});
  await page.evaluate(()=>IMI.ops.extensions.setTab('breakroom'));
  await page.waitForSelector('[data-node="warm-up"]');
  const before=await stats();
  const click=async id=>{await page.evaluate(id=>document.querySelector(`[data-node="${id}"]`).click(),id);await new Promise(r=>setTimeout(r,300));};
  await click('nimble-paws');assert.equal((await m()).wallet,190);
  await click('warm-up');assert.equal((await m()).wallet,180);assert.equal((await stats()).typing,before.typing*1.02);
  assert.equal(await page.$eval('[data-node="nimble-paws"]',b=>b.disabled),false);
  await click('warm-up');assert.equal((await m()).wallet,180);checks.push('prerequisite, Warm-up 2%, unlock and duplicate');
  await page.evaluate(()=>{const original=Storage.prototype.setItem;window.mg02Fault={};Storage.prototype.setItem=function(k,v){if(k==='imi-ops-v1'){Storage.prototype.setItem=original;try{return original.call(this,k,v+' '.repeat(6*1024*1024));}catch(e){window.mg02Fault.error=e.name;throw e;}}return original.call(this,k,v);};});
  await click('nimble-paws');assert.equal((await m()).wallet,180);assert.equal((await stats()).typing,before.typing*1.02);
  assert.equal(await page.evaluate(()=>mg02Fault.error),'QuotaExceededError');
  await page.evaluate(()=>document.querySelector('[data-mg01="retry"]').click());await new Promise(r=>setTimeout(r,300));
  assert.equal((await m()).wallet,140);await click('nimble-paws');assert.equal((await m()).wallet,140);checks.push('real quota refusal, unchanged effects, Retry commits once');
  for(const id of ['fresh-eyes','good-stories','room-for-play']) await click(id);
  const full=await m(), after=await stats();assert.equal(full.wallet,0);assert.equal(full.attempts,6);assert.equal(full.unknown,'retained');assert.equal(full.fraction,.25);
  assert.equal(after.typing,before.typing*1.05);assert.equal(after.keeper,before.keeper/1.03);assert.equal(after.sale,Math.round(before.sale*1.03/25)*25);
  for(const k of ['hold','roy','div','speed','cap','eff']) assert.equal(after[k],before[k]);checks.push({name:'all nodes, matched shared formulas and excluded rates',before,after,full});
  await page.reload();await page.waitForFunction(()=>!!window.IMI?.ops?.dev);assert.deepEqual(await m(),full);checks.push('reload retains acknowledged tree');
  await page.evaluate(()=>{const a=IMI.ops.extensions,x=structuredClone(a.state().meta.minigames);x.refillAt=Date.now()-2*7200000;a.commitMinigames(JSON.stringify(a.state().meta.minigames),x);a.setTab('breakroom');});
  await page.waitForSelector('[data-mg01="practice"]');await page.evaluate(()=>document.querySelector('[data-mg01="practice"]').click());assert.equal((await m()).attempts,8);
  await page.evaluate(()=>document.querySelector('[data-mg01="close"]').click());
  await page.evaluate(()=>{const a=IMI.ops.extensions,x=structuredClone(a.state().meta.minigames);x.attempts=7;x.refillAt=Date.now()+7200000;a.commitMinigames(JSON.stringify(a.state().meta.minigames),x);});
  await page.evaluate(()=>document.querySelector('[data-mg01="practice"]').click());assert.equal((await m()).attempts,7);await page.evaluate(()=>document.querySelector('[data-mg01="close"]').click());checks.push('capacity eight, unchanged two-hour refill and backward clamp');
  const retained=await m();await page.evaluate(()=>{const d=IMI.ops.dev;d.S().run.earned=12500000;d.doPrint();});assert.deepEqual(await m(),retained);assert.equal((await stats()).typing,1.05);checks.push('actual Printing retains metadata and reads current state');
  await page.evaluate(()=>{const a=IMI.ops.extensions,x=structuredClone(a.state().meta.minigames);x.nodes=['future-node'];a.commitMinigames(JSON.stringify(a.state().meta.minigames),x);a.setTab('breakroom');});
  await page.waitForSelector('[data-node="warm-up"]');const future=await m();await click('warm-up');assert.deepEqual(await m(),future);assert.equal((await stats()).typing,1);checks.push('unsupported node data retained and refused');
  assert.deepEqual(errors,[]);
}catch(e){errors.push(e.stack);process.exitCode=1;}
finally{await browser.close();await writeFile(`${out}/focused-r1.json`,JSON.stringify({checks,errors},null,2));}
console.log(JSON.stringify({checks:checks.length,errors}));
