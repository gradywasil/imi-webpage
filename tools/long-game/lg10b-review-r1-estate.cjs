const fs = require('node:fs'), http = require('node:http'), os = require('node:os'), path = require('node:path'), assert = require('node:assert/strict');
const pp = require('C:/Users/arran/pp/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js');
const root = process.cwd(), out = path.join(root, 'docs/plan/long-game/evidence/LG-10/awards-review-r1', process.argv[2] || 'attempt-1');
fs.mkdirSync(out, {recursive:true});
const save = (name, value) => fs.writeFileSync(path.join(out,name+'.json'), JSON.stringify(value,null,2), {flag:'wx'});
const server = http.createServer((req,res) => {
  const file = path.resolve(root,'.'+new URL(req.url,'http://local').pathname);
  if (!file.startsWith(root+path.sep)) return res.writeHead(403).end();
  fs.readFile(file,(err,bytes) => {res.writeHead(err?404:200,{'Content-Type':path.extname(file)==='.js'?'text/javascript':'text/html','Cache-Control':'no-store'});res.end(err?'missing':bytes);});
});
(async () => {let browser,page; const result={status:'FAIL',fixture:'LABELLED validated raw second-Estate proof before expandedAwards snapshot; no natural Estate acquisition',errors:[]};
  const profile=fs.mkdtempSync(path.join(os.tmpdir(),'lg10b-review-r1-'));
  try {
    await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
    const port=server.address().port; assert(![8000,8354,8356,8358,8397].includes(port));
    browser=await pp.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,userDataDir:profile});
    result.resources={profile,port,browserPid:browser.process().pid}; save('resources',result.resources);
    page=await browser.newPage(); await page.setBypassServiceWorker(true); page.on('pageerror',e=>result.errors.push(e.stack));
    const original=JSON.parse(fs.readFileSync('docs/plan/long-game/evidence/LG-10/awards-r1/release-prerequisites.json'));
    const state=original.state; delete state.meta.folio; delete state.meta.expandedAwards; state.bank={};
    state.meta.layers={version:1,count:5,baseline:0,seals:0,highestPrinting:8,purchases:{press:true,charter:true},genre:null,stamps:{}};
    state.meta.estate={version:1,count:2,localImprints:0,resetEpoch:2,starBaseline:0,charters:0};
    for(const id of ['layer:imprint:first','layer:estate:first']) state.rewards.claims[id]={status:'committed',origin:'new',descriptor:{version:1,kind:'L',amount:50,desk:0,rate:0,minutes:3,floor:50,cap:5000,speed:1,origin:'new'}};
    assert.equal(state.meta.expandedAwards,undefined); save('raw-fixture',{state,walletRaw:original.walletRaw});
    await page.evaluateOnNewDocument(f=>{Date.now=()=>1792080000000;localStorage.setItem('imi-ops-v1',JSON.stringify(f.state));if(f.walletRaw)localStorage.setItem('imi-score',f.walletRaw);localStorage.setItem('imi-tour',JSON.stringify({version:2,done:true,tipsOff:true}));localStorage.setItem('imi-fx','low');}, {state,walletRaw:original.walletRaw});
    const url=`http://127.0.0.1:${port}/index.html?lg10awards=1&lg01a=1&lg03=1&lg05folio=1&lg05layers=1&lg08estate=1#play`;
    await page.goto(url); await page.waitForFunction(()=>window.Rewards?.owns()&&window.IMI?.ops?.progression.running()&&!Rewards.held(),{timeout:15000});
    const snap=await page.evaluate(()=>({state:IMI.ops.dev.S(),raw:localStorage.getItem('imi-ops-v1'),guard:Rewards.guard(IMI.ops.dev.S())})); save('ack-snapshot',snap);
    const id='award:lg10-estate-two', c=snap.state.rewards.claims[id];
    assert(snap.guard); assert.deepEqual(snap.state.meta.expandedAwards.historicalIds,['lg10-estate-two']);
    assert.equal(snap.state.awards['lg10-estate-two'],true); assert.equal(c.status,'committed'); assert.equal(c.origin,'historical');
    assert.equal(c.descriptor.amount,4); assert.equal(snap.state.prem.credits[id].amount,4); assert.equal(snap.state.prem.credits[id].source,'earned');
    assert.equal(c.proof.source.meta.estate.count,2);
    const before=await page.evaluate(()=>{const s=IMI.ops.dev.S();return {earned:s.prem.earned,claims:JSON.stringify(s.rewards.claims),credits:JSON.stringify(s.prem.credits),awardCount:IMI.ops.dev.awardCount?.()};});
    await page.evaluate(()=>Rewards.retry());
    await page.reload(); await page.waitForFunction(()=>window.Rewards?.owns()&&window.IMI?.ops?.progression.running()&&!Rewards.held(),{timeout:15000});
    const after=await page.evaluate(()=>{const s=IMI.ops.dev.S();Rewards.retry();return {earned:s.prem.earned,claims:JSON.stringify(s.rewards.claims),credits:JSON.stringify(s.prem.credits),historicalIds:s.meta.expandedAwards.historicalIds,guard:Rewards.guard(s)};});
    save('reload-duplicate',{before,after}); assert(after.guard); assert.equal(after.earned,before.earned); assert.equal(after.claims,before.claims); assert.equal(after.credits,before.credits);
    result.status='PASS'; result.summary='Acknowledged historical Estate count 2; one 4 DB credit, retained proof and income bit; retry and reload gave no second credit.';
  } catch(e) {result.error=e.stack;if(page)try{result.diagnostic=await page.evaluate(()=>({text:document.body.innerText.slice(0,3000),held:window.Rewards?.held?.(),gate:window.VaultSaveGate?.blocked,state:window.IMI?.ops?.dev?.S()?.meta}));}catch{}}
  finally {if(browser) await browser.close(); if(server.listening) await new Promise(resolve=>server.close(resolve));result.resources={...result.resources,browserClosed:true,serverClosed:true,profileRetained:profile};save('fresh-result',result); console.log(JSON.stringify({status:result.status,error:result.error,summary:result.summary}));if(result.status!=='PASS')process.exitCode=1;}
})();
