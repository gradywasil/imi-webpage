const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const pp=require('C:/Users/arran/pp/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js');
const out='docs/plan/long-game/evidence/LG-08/printing-ack-r1',run=process.argv[2]||'main',root=process.cwd();
const write=(n,x)=>fs.writeFileSync(`${out}/${run}-${n}.json`,JSON.stringify(x,null,2),{flag:'wx'});
const fixture=JSON.parse(fs.readFileSync('docs/plan/long-game/evidence/LG-09/anthology-r1/confirmation-final-save.json'));
fixture.state.lastSeen=Date.now();fixture.state.run.earned=50000000;fixture.state.challenge=null;fixture.state.meta.estate.count=0;
fixture.state.legacy.ups.seed=1;fixture.state.legacy.ups.crew=1;fixture.state.written={'ape-in-the-cape':true};fixture.state.editions['ape-in-the-cape']=2;
fixture.state.pub.on=false;fixture.state.desks.forEach(d=>{d.paws=0;d.crew=[];d.keeper.on=false;});fixture.state.meta.archive.through=Date.now();
fixture.state.meta.minigames ??= {version:1};fixture.state.futurePrinting={keep:37};fixture.state.meta.minigames.futurePrinting={session:'keep',fraction:.37};fixture.state.prem.futurePrinting={receipt:'keep'};fixture.wallet.futurePrinting='keep';
fixture.state.meta.automation={version:1,media:{version:1,sequence:23,manual:{complete:true}},futurePrinting:{keep:true}};
const server=http.createServer((req,res)=>{const f=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);if(!f.startsWith(root+path.sep))return res.writeHead(403).end();fs.readFile(f,(e,b)=>{res.writeHead(e?404:200,{'Content-Type':({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2'})[path.extname(f)]||'application/octet-stream','Cache-Control':'no-store'});res.end(e?'missing':b);});});
const flags='?lg08print=1&lg03=1&lg01a=1&lg05folio=1&lg05layers=1&lg08estate=1&lg08archive=1&lg09works=1#play';
(async()=>{let browser;const result={checks:[],errors:[]};try{
await new Promise(r=>server.listen(0,'127.0.0.1',r));assert(![8000,8354,8356,8358,8397].includes(server.address().port));browser=await pp.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});const page=await browser.newPage();page.on('pageerror',e=>result.errors.push(e.message));await page.setBypassServiceWorker(true);
const base=`http://127.0.0.1:${server.address().port}`;
const seed=await page.evaluateOnNewDocument(f=>{localStorage.setItem('imi-ops-v1',JSON.stringify(f.state));localStorage.setItem('imi-score',JSON.stringify(f.wallet));localStorage.setItem('imi-tour',JSON.stringify({version:2,done:true,tipsOff:true}));localStorage.setItem('imi-fx','low');},fixture);await page.goto(base+'/index.html'+flags);await page.removeScriptToEvaluateOnNewDocument(seed.identifier);await page.waitForFunction(()=>Rewards.owns()&&IMI.ops?.progression.running()&&!Rewards.held());
result.checks.push(...await page.evaluate(()=>{
const a=IMI.ops.extensions,d=IMI.ops.dev,rows=[],copy=x=>JSON.parse(JSON.stringify(x)),check=(name,pass)=>{rows.push({name,pass:!!pass});if(!pass)throw Error(name);},refuses=()=>{try{a.printingReview();return false;}catch{return true;}};
document.querySelectorAll('.o-modal,.o-celebrate').forEach(e=>e.remove());
let s=a.state();let q=a.printingReview(),raw=localStorage.getItem('imi-ops-v1'),wallet=localStorage.getItem('imi-score');s=a.state();s.run.earned+=25;let before=JSON.stringify(s);check('stale reviewed earnings refuse without writes',!Rewards.printingAction({origin:'manual',quote:q}).ok&&JSON.stringify(s)===before&&localStorage.getItem('imi-ops-v1')===raw&&localStorage.getItem('imi-score')===wallet);s.run.earned-=25;
q=a.printingReview();s=a.state();d.ui.nextCh='hands';check('chosen challenge invalidates ordinary confirmation',!Rewards.printingAction({origin:'manual',quote:q}).ok);d.ui.nextCh='';
const epoch=s.meta.estate.resetEpoch;s.meta.estate.resetEpoch=Number.MAX_SAFE_INTEGER;check('epoch overflow refuses',refuses());s.meta.estate.resetEpoch=epoch;
const folio=copy(s.meta.folio);s.meta.folio.working=true;check('active Folio work refuses',refuses());s.meta.folio=folio;
const overlay=document.createElement('div');overlay.className='mg01-overlay';document.body.append(overlay);check('hosted overlay refuses',refuses());overlay.remove();
s.meta.trainingPool={version:2,enabled:true};check('unsupported training namespace refuses without erasure',refuses()&&s.meta.trainingPool.version===2);delete s.meta.trainingPool;
s.meta.automation.print={version:2,manual:{complete:true}};check('future print version preserved and refuses',refuses()&&s.meta.automation.print.version===2);delete s.meta.automation.print;
q=a.printingReview();s=a.state();const source=JSON.stringify(s);check('Core cannot accept caller wallet amount or raw successor',!IMI.bananas.replacePrintingAcknowledged({seed:999}).ok&&JSON.stringify(s)===source);
s.legacy.ups.crew=0;s.run.earned=50000000;delete s.meta.estate;delete s.meta.archive;delete s.meta.works;delete s.meta.worksDemo;
const absent=a.printingReview(),r=Rewards.printingAction({origin:'manual',quote:absent});check('manual proof with absent identity does not install Estate',r.status==='acknowledged'&&a.state().meta.estate===undefined&&a.state().meta.automation.print.manual.complete);
// A newly selected challenge remains the historical reset path and cannot mint proof.
const n=a.state();delete n.meta.automation.print;n.run.earned=50000000;document.querySelectorAll('.o-celebrate').forEach(e=>e.remove());d.doPrint('hands');check('challenge Printing keeps old path without new proof',a.state().challenge?.id==='hands'&&!a.state().meta.automation.print);
return rows;
}));
// Explicit flag-off ordinary control from the same historical path.
await page.goto(base+'/index.html'+flags.replace('lg08print=1&',''));await page.waitForFunction(()=>Rewards.owns()&&IMI.ops?.progression.running()&&!Rewards.held());
const off=await page.evaluate(()=>{const a=IMI.ops.extensions,s=a.state();document.querySelectorAll('.o-modal,.o-celebrate').forEach(e=>e.remove());delete s.meta.automation.print;s.challenge=null;s.run.earned=50000000;const p=s.printing;IMI.ops.dev.doPrint();return {printing:a.state().printing,previous:p,proof:a.state().meta.automation.print,enabled:a.printingEnabled()};});assert.equal(off.printing,off.previous+1);assert(!off.proof&&!off.enabled);result.checks.push({name:'flag-off ordinary Printing retains historical path without proof',pass:true});
// The early gate only recognizes the envelope; malformed candidate is blocked before Core.
const held=JSON.parse(fs.readFileSync(`${out}/final-stable-held.json`));const broken=JSON.parse(held.raw);delete broken.meta.automation.print.pending.candidate;
const raw=JSON.stringify(broken);const inject=await page.evaluateOnNewDocument(({raw,wallet})=>{localStorage.setItem('imi-ops-v1',raw);localStorage.setItem('imi-score',wallet);},{raw,wallet:held.wallet});await page.goto(base+'/index.html'+flags);await page.removeScriptToEvaluateOnNewDocument(inject.identifier);
const malformed=await page.evaluate(()=>({blocked:VaultSaveGate.blocked,ops:!!window.IMI?.ops,raw:localStorage.getItem('imi-ops-v1')}));assert(malformed.blocked&&!malformed.ops&&malformed.raw===raw);result.checks.push({name:'malformed envelope blocks before Core and preserves save',pass:true});
assert.deepEqual(result.errors,[]);result.status='PASS';
}catch(e){result.status='FAIL';result.error=e.stack;}finally{if(browser)await browser.close();await new Promise(r=>server.close(r));write('guards',result);write('cleanup',{browserClosed:true,serverClosed:true});console.log(JSON.stringify(result));if(result.status!=='PASS')process.exitCode=1;}})();
