// One newly discovered prerequisite, using only the task's isolated origin/context.
const fs=require('node:fs'),assert=require('node:assert/strict');
const pp=require('C:/Users/arran/pp/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js');
const out='docs/plan/long-game/evidence/LG-05/implementation-imprints-r1';
(async()=>{
 const browser=await pp.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{
  const context=await browser.createBrowserContext(),page=await context.newPage();
  const failure=JSON.parse(fs.readFileSync(`${out}/final-r2-mid-reset-first-refusal.json`));
  const inject=await page.evaluateOnNewDocument(({s,w})=>{localStorage.setItem('imi-ops-v1',JSON.stringify(s));localStorage.setItem('imi-score',JSON.stringify(w));},{s:failure.durable,w:failure.savedWallet});
  await page.goto('http://127.0.0.1:8393/index.html#play');await page.removeScriptToEvaluateOnNewDocument(inject.identifier);
  const open=await page.evaluate(()=>({rewards:Rewards.enabled,layers:Layers.enabled,running:!!IMI.ops,pending:!!JSON.parse(localStorage.getItem('imi-ops-v1')).meta.layers.pending,wallet:JSON.parse(localStorage.getItem('imi-score'))}));
  await page.goto('http://127.0.0.1:8393/docs/plan/long-game/evidence/LG-05/owner-approval-abc/receipt.json');
  const after=await page.evaluate(()=>({wallet:JSON.parse(localStorage.getItem('imi-score')),state:JSON.parse(localStorage.getItem('imi-ops-v1'))}));
  const result={controlled:true,expected:'Pending foundation refuses all unrelated progression and preserves both durable keys without required flags.',open,after,markerLost:!after.wallet.rewardMarker,classification:'TRUE UNOWNED COLD-RECOGNITION PREREQUISITE. vault-save-gate.js remains untouched.'};
  fs.writeFileSync(`${out}/cold-boundary-first-failure.json`,JSON.stringify(result,null,2),{flag:'wx'});
  assert(open.running&&result.markerLost);console.log('Confirmed cold-boundary prerequisite; first failure preserved.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
