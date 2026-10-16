const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto'),vm=require('node:vm');
const pp=require('C:/Users/arran/pp/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js');
const out='docs/plan/long-game/evidence/LG-05/repair-cold-r2/run-20261014-cold';
const input='docs/plan/long-game/evidence/LG-05/implementation-imprints-r1';
const write=(name,value)=>fs.writeFileSync(`${out}/${name}.json`,JSON.stringify(value,null,2),{flag:'wx'});
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const source=fs.readFileSync('vault-save-gate.js','utf8'),old=fs.readFileSync(`${out}/before-vault-save-gate.js`,'utf8');
const fixture=JSON.parse(fs.readFileSync(`${input}/final-r2-mid-reset-first-refusal.json`));
const raw={s:JSON.stringify(fixture.durable),w:JSON.stringify(fixture.savedWallet)};
// Execute the real early component, with no writers or recovery implementation substituted.
function blocked(code,state,search='') {
 const context={window:{},localStorage:{getItem:()=>state===null?null:JSON.stringify(state)},location:{search},URLSearchParams,document:{documentElement:{dataset:{}},readyState:'loading',addEventListener(){}}};
 vm.runInNewContext(code,context);return context.window.VaultSaveGate.blocked;
}
(async()=>{
 const checks=[],errors=[],loaded={};
 for(const state of [null,{}, {meta:{layers:{version:1,count:3,pending:null}}}, {prem:{vault:{version:1}}}, {prem:{vault:{version:2}}},{prem:null}]) {
  for(const flags of ['', '?lg01a=1&lg02=1']) assert.equal(blocked(source,state,flags),blocked(old,state,flags));
 }
 checks.push('Empty, dormant/completed Layers and old Vault component behavior matches starting bytes');
 for(let mask=0;mask<8;mask++) {
  const flags=['lg01a','lg05folio','lg05layers'].filter((_,i)=>mask&(1<<i)).map(k=>`${k}=1`).join('&');
  assert.equal(blocked(source,fixture.durable,'?'+flags),mask!==7);
 }
 for(const pending of [false,0,'future',{},[]]) {const s=structuredClone(fixture.durable);s.meta.layers.pending=pending;assert(blocked(source,s,'?lg01a=1&lg05folio=1&lg05layers=1'));}
 const future=structuredClone(fixture.durable);future.meta.layers.version=2;assert(blocked(source,future,'?lg01a=1&lg05folio=1&lg05layers=1'));
 const both=structuredClone(fixture.durable);both.prem.vault={version:1};assert(blocked(source,both,'?lg01a=1&lg05folio=1&lg05layers=1&lg02=1'));
 checks.push('All eight flag combinations; malformed/future pending blocks; Vault coexistence cannot bypass Vault');
 const browser=await pp.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try {
  const context=await browser.createBrowserContext(),page=await context.newPage(),base='http://127.0.0.1:8397/';
  await page.setBypassServiceWorker(true);await page.setCacheEnabled(false);await page.setViewport({width:360,height:560});
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(new URL(r.url()).pathname==='/vault-save-gate.js')r.buffer().then(b=>loaded.gate=hash(b));});
  const seed=await page.evaluateOnNewDocument(({s,w})=>{localStorage.setItem('imi-ops-v1',s);localStorage.setItem('imi-score',w);},raw);
  await page.goto(base+'index.html?keep=cold#play');await page.removeScriptToEvaluateOnNewDocument(seed.identifier);
  const preserved=async stage=>{
   const value=await page.evaluate(()=>({s:localStorage.getItem('imi-ops-v1'),w:localStorage.getItem('imi-score'),blocked:window.VaultSaveGate?.blocked,running:!!window.IMI?.ops}));
   assert.equal(value.s,raw.s);assert.equal(value.w,raw.w);
   return {stage,stateHash:hash(value.s),walletHash:hash(value.w),blocked:value.blocked,running:value.running,marker:JSON.parse(value.w).rewardMarker,unknown:JSON.parse(value.w).futureWallet};
  };
  const preservation=[await preserved('load')];assert(preservation[0].blocked&&!preservation[0].running);
  await page.goto(base+'docs/plan/long-game/evidence/LG-05/owner-approval-abc/receipt.json');preservation.push(await preserved('departure'));
  await page.goto(base+'index.html?keep=cold#play');preservation.push(await preserved('return'));await page.reload();preservation.push(await preserved('reload'));
  write('preservation',preservation);checks.push('Both raw durable strings unchanged across actual blocked load/departure/return/reload, marker and unknown wallet field retained');
  const geometry=[];
  for(const shell of ['index.html','classic.html']) {
   await page.goto(base+shell+'?keep=cold#play');await page.waitForSelector('.o-vault-gate');
   geometry.push(await page.evaluate(()=>{const p=document.querySelector('.o-vault-gate'),b=p.querySelector('button'),r=b.getBoundingClientRect();return {title:p.querySelector('h1').textContent,pageScroll:document.documentElement.scrollHeight>innerHeight,horizontal:document.documentElement.scrollWidth>innerWidth,buttonHeight:r.height,buttonBottom:r.bottom,content:p.querySelector('.o-vault-gate-content').clientHeight};}));
   await page.screenshot({path:`${out}/${shell}-360.png`});
  }
  assert(geometry.every(g=>!g.pageScroll&&!g.horizontal&&g.buttonHeight>=40&&g.buttonBottom<=560&&g.content>0));write('geometry',geometry);
  // Hold the same final reset stage as the original proof, then follow the real Resume control.
  const refusal=await page.evaluateOnNewDocument(()=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='imi-ops-v1'&&JSON.parse(v).meta?.layers?.count===1)throw Error('LG05B cold check final write refusal');return original.call(this,k,v);};window.restoreStorage=()=>Storage.prototype.setItem=original;});
  await Promise.all([page.waitForNavigation(),page.click('.o-vault-gate button')]);
  await page.waitForFunction(()=>window.Rewards?.held()&&window.IMI?.ops);
  const url=new URL(page.url());assert.equal(url.pathname,'/classic.html');assert.equal(url.hash,'#play');assert.equal(url.searchParams.get('keep'),'cold');
  assert.deepEqual([...url.searchParams.keys()].sort(),['keep','lg01a','lg05folio','lg05layers'].sort());
  const held=await page.evaluate(()=>({gate:VaultSaveGate.blocked,held:Rewards.held(),running:IMI.ops.progression.running(),pending:!!IMI.ops.dev.S().meta.layers.pending,wallet:JSON.parse(localStorage.getItem('imi-score'))}));
  assert(!held.gate&&held.held&&!held.running&&held.pending);assert.deepEqual(held.wallet.rewardMarker,fixture.savedWallet.rewardMarker);assert.equal(held.wallet.futureWallet,'retain-wallet');
  await page.removeScriptToEvaluateOnNewDocument(refusal.identifier);await page.evaluate(()=>restoreStorage());await page.click('.o-writer-status button');
  await page.waitForFunction(()=>IMI.ops.progression.running()&&Rewards.owns());
  const finished=await page.evaluate(()=>({s:IMI.ops.dev.S(),w:JSON.parse(localStorage.getItem('imi-score'))}));
  const s=finished.s,c=s.rewards.claims['layer:imprint:first'];assert.equal(s.meta.layers.count,1);assert.equal(s.meta.layers.seals,2);assert.equal(s.meta.layers.baseline,60);assert(!s.meta.layers.pending);assert.equal(s.printing,0);assert.equal(s.run.earned,0);assert.equal(finished.w.score,25000);
  assert.equal(c.status,'committed');assert.equal(Object.values(s.desks[0].letters).reduce((a,b)=>a+b,0),c.descriptor.amount);
  assert.deepEqual(finished.w.rewardMarker,fixture.savedWallet.rewardMarker);assert.equal(finished.w.futureWallet,'retain-wallet');
  for(const key of ['legacy','prem','chDone','daily','pitches','gold','best','royTotal','divTotal','futureTop'])assert.deepEqual(s[key],fixture.durable.meta.layers.pending.candidate[key]);
  for(const key of ['future','minigames','automation','productionGoal','trainingPool'])assert.deepEqual(s.meta[key],fixture.durable.meta.layers.pending.candidate.meta[key]);
  assert.deepEqual(s.editions,fixture.durable.meta.layers.pending.candidate.editions);
  await page.evaluate(()=>Rewards.retry());
  const again=await page.evaluate(()=>({count:IMI.ops.dev.S().meta.layers.count,seals:IMI.ops.dev.S().meta.layers.seals,claim:IMI.ops.dev.S().rewards.claims['layer:imprint:first'],letters:IMI.ops.dev.S().desks[0].letters,score:IMI.bananas.get()}));
  assert.equal(again.count,1);assert.equal(again.seals,2);assert.deepEqual(again.claim,c);assert.deepEqual(again.letters,s.desks[0].letters);assert.equal(again.score,25000);
  checks.push('Resume retains path/hash/other query and adds exactly three flags; actual held recovery Retry finishes once with retained seed, Seals, claim/Letters, marker and sentinels');
  write('recovery',{url:url.href,held,finished:{count:s.meta.layers.count,seals:s.meta.layers.seals,baseline:s.meta.layers.baseline,printing:s.printing,seed:finished.w.score,letters:c.descriptor.amount,claim:c,marker:finished.w.rewardMarker,unknown:finished.w.futureWallet},duplicate:again});
  assert.deepEqual(errors,[]);assert.equal(loaded.gate,hash(source));write('result',{checks,errors,loaded,fixtureHash:hash(fs.readFileSync(`${input}/final-r2-mid-reset-first-refusal.json`)),firstFailureHash:hash(fs.readFileSync(`${input}/cold-boundary-first-failure.json`))});
  console.log(checks.join('\n'));
 } catch(e) {write('first-failure',{checks,errors,error:e.stack});throw e;} finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
