import {createServer} from 'node:http';
import {createReadStream,readFileSync,writeFileSync} from 'node:fs';
import {writeFile,mkdir,mkdtemp,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {tmpdir} from 'node:os';
import {join,resolve,relative,extname,isAbsolute} from 'node:path';
import {pathToFileURL} from 'node:url';

const start=Date.now(), deadline=start+1800000;
const root=resolve(import.meta.dirname,'../..');
const args=process.argv.slice(2);
if (args.length!==2 || args[0]!=='--output-dir' || !args[1] || args[1].startsWith('--')) throw Error('Usage: node tools/long-game/regular-pilot.mjs --output-dir <NEW directory>');
const evidence=resolve(root,args[1]);
const evidenceRoot=join(root,'docs/plan/long-game/evidence/LG-13');
if (!relative(evidenceRoot,evidence) || isAbsolute(relative(evidenceRoot,evidence)) || relative(evidenceRoot,evidence).startsWith('..') || evidence===join(evidenceRoot,'regular-pilot-run-r1')) throw Error('Output must be a new directory below evidence/LG-13');
await mkdir(evidence); // Refuse every existing directory, including incomplete prior runs.
const settings={profile:'Regular',seed:1,gameSpeed:1,typistPremiumSpeed:1,days:14,sessionsPerDay:3,sessionSeconds:1200,awaySeconds:27600,wallLimitSeconds:1800,checkpointSeconds:30,frameMs:50,resetPolicy:'session-end pending stars >=1, foundation first, Folio settled',puppeteer:'C:/Users/arran/pp/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js',chrome:'C:/Program Files/Google/Chrome/Application/chrome.exe',outputDirectory:evidence};
const sourceFiles=['classic.html','core.js','classic.js','ops.js','economy.js','rewards.js','layers.js','folio.js','pickups.js','tour.js','estate.js','automation.js','vault-save-gate.js','tools/bot.js','tools/long-game/regular-pilot.mjs','tools/long-game/regular-pilot-policy.js'];
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const hashes=()=>Object.fromEntries(sourceFiles.map(name=>[name,sha(readFileSync(join(root,name)))]));
const write=(name,value)=>writeFile(join(evidence,name),JSON.stringify(value,null,2)+'\n',{flag:'wx'});
const clockSource=(boundary=0,rng=1)=>`(() => {
  const NativeDate=Date, base=Date.UTC(2026,9,15,0,0,0); let time=${boundary}, seq=0;
  const jobs=new Map(); const perf=performance;
  function VirtualDate(...args) { if(!new.target) return new NativeDate(base+time).toString(); return new NativeDate(...(args.length?args:[base+time])); }
  VirtualDate.prototype=NativeDate.prototype; Object.setPrototypeOf(VirtualDate,NativeDate);
  VirtualDate.now=()=>base+time; window.Date=VirtualDate;
  Object.defineProperty(perf,'now',{configurable:true,value:()=>time});
  const schedule=(kind,fn,delay,args)=>{ const id=++seq; jobs.set(id,{id,kind,fn,args,due:time+(kind==='frame'?50:Math.max(1,Number(delay)||1)),period:kind==='interval'?Math.max(1,Number(delay)||1):0}); return id; };
  window.setTimeout=(fn,delay,...args)=>schedule('timeout',fn,delay,args);
  window.setInterval=(fn,delay,...args)=>schedule('interval',fn,delay,args);
  window.requestAnimationFrame=fn=>schedule('frame',fn,50,[]);
  window.clearTimeout=window.clearInterval=window.cancelAnimationFrame=id=>jobs.delete(id);
  function advance(ms) { const end=time+ms; let calls=0;
    while(true) { let next=null; for(const job of jobs.values()) if(job.due<=end && (!next || job.due<next.due || job.due===next.due && job.id<next.id)) next=job;
      if(!next) break; time=next.due;
      if(next.period) next.due+=next.period; else jobs.delete(next.id);
      next.fn(...(next.kind==='frame'?[time]:next.args));
      if(++calls>100000) throw Error('Virtual timer runaway');
    } time=end;
  }
  function skip(ms) { time+=ms; for(const job of jobs.values()) job.due+=ms; }
  window.__pilotClock={now:()=>time,advance,skip,base,pending:()=>jobs.size,seed:()=>seed};
  window.__pilotInitialEmpty=localStorage.getItem('imi-ops-v1')===null && localStorage.getItem('imi-score')===null;
  window.__advance=advance;
  let seed=${rng}; Math.random=()=>{ seed|=0; seed=seed+0x6D2B79F5|0; let t=Math.imul(seed^seed>>>15,1|seed); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; };
})();`;
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.woff2':'font/woff2'};
const before=hashes();
await write('used-source-before.json',before);
await write('settings.json',settings);
const responses={},httpErrors=[],errors=[];
let browser,server,page,cdp,profile,serverAddress,stopReason='unknown',endpointCandidate=false,endpointAcknowledged=false,horizonComplete=false,last=null,lastSampleWallSeconds=null,checkpointNumber=0,pulseBusy=false,pulsePromise,folioActions=0;
const resourcesClosed={browser:'not created',server:'not created'};
const report=()=>{const after=hashes();return {settings,commandLine:process.argv,policySummary:endpointCandidate?'policy-summary.json':null,endpointAcknowledged,horizonComplete,stopReason,wallSeconds:(Date.now()-start)/1000,lastCheckpoint:checkpointNumber?'checkpoint-'+String(checkpointNumber).padStart(4,'0')+'.json':null,last,lastSampleWallSeconds,errors,httpErrors,loadedResponses:responses,sourceDrift:Object.keys(before).filter(key=>before[key]!==after[key]),profile,serverAddress,resourcesClosed,omissions:['no challenges','no minigames','no helper tiers','no premium spending','no board, Hall, Seasons, Muses or extra garden']};};
function durableCheckpoint(reason,sampleError=null) {
  const item={reason,wallSeconds:(Date.now()-start)/1000,sampledWallSeconds:lastSampleWallSeconds,state:last,sampleError,sourceHashes:{...responses},errors:[...errors],httpErrors:[...httpErrors]};
  writeFileSync(join(evidence,'checkpoint-'+String(++checkpointNumber).padStart(4,'0')+'.json'),JSON.stringify(item,null,2)+'\n',{flag:'wx'});
}
function bounded(promise,ms,label) {
  let timer;
  return Promise.race([promise,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error(label+' timed out')),Math.max(1,Math.min(ms,deadline-Date.now())));})]).finally(()=>clearTimeout(timer));
}
const evaluate=(fn,...args)=>bounded(page.evaluate(fn,...args),10000,'page evaluation');
async function sample(compact=true) {
  last=await bounded(page.evaluate(compact=>{
    if (window.RegularPilot) return RegularPilot.snapshot(compact);
    const s=window.IMI?.ops?.dev?.S?.();
    return {url:location.href,clock:window.__pilotClock?.now(),screen:window.IMI?.screen?.(),owner:window.Rewards?.owns?.(),enabled:window.Rewards?.enabled,running:window.IMI?.ops?.progression?.running?.(),guard:s?window.Rewards?.guard?.(s):null,held:window.Rewards?.held?.(),intro:s?.intro,status:document.querySelector('.o-writer-status:not([hidden])')?.textContent?.trim(),rawSaveLength:localStorage.getItem('imi-ops-v1')?.length||0};
  },compact),1000,'live checkpoint sample');
  lastSampleWallSeconds=(Date.now()-start)/1000;
}
async function checkpoint(reason) {
  let error=null;
  try { if(page && !page.isClosed()) await sample(); else error='page unavailable'; }
  catch(e) {error=String(e);}
  durableCheckpoint(reason,error);
}
// Node timers remain native. A blocked renderer cannot prevent durable partial evidence.
const pulse=setInterval(()=>{
  if(pulseBusy) return;
  pulseBusy=true;
  pulsePromise=checkpoint('30 wall seconds').catch(e=>errors.push('checkpoint: '+e.message)).finally(()=>{pulseBusy=false;});
},30000);
const watchdog=setTimeout(()=>{
  stopReason='1800-second wall watchdog'; endpointAcknowledged=false;
  durableCheckpoint('hard watchdog','renderer sampling abandoned at absolute deadline');
  if(browser?.process()) {resourcesClosed.browser=browser.process().kill()?'termination requested; closure unverified':'termination request failed';}
  server?.closeAllConnections(); server?.close();
  if(server) resourcesClosed.server=server.listening?'closure requested; closure unverified':'listener closed';
  writeFileSync(join(evidence,'used-source-after.json'),JSON.stringify(hashes(),null,2)+'\n');
  writeFileSync(join(evidence,'report.json'),JSON.stringify(report(),null,2)+'\n');
  process.exit(2);
},Math.max(1,deadline-Date.now()));
async function readiness(serviceStartup) {
  const until=Math.min(deadline,Date.now()+30000);
  while(Date.now()<until) {
    const ready=await evaluate(()=>!!(window.IMI?.ops?.dev && window.Rewards?.owns?.() && IMI.ops.progression.running()));
    if(ready) return;
    if(serviceStartup) await evaluate(()=>window.__pilotClock?.advance(1000));
    await new Promise(resolve=>setTimeout(resolve,100));
  }
  throw Error('Owner readiness timed out');
}
function unchanged() {
  const after=hashes(),drift=sourceFiles.filter(name=>before[name]!==after[name]);
  if(drift.length) throw Error('Used source drift: '+drift.join(', '));
}
try {
  const puppeteer=(await import(pathToFileURL(settings.puppeteer).href)).default;
  profile=await mkdtemp(join(tmpdir(),'lg13b-regular-'));
  server=createServer(async(req,res)=>{
    try {
      const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname),file=resolve(root,'.'+pathname);
      if(relative(root,file).startsWith('..')) {res.writeHead(403).end();return;}
      const info=await stat(file); if(!info.isFile()) throw Error('not file');
      res.setHeader('Content-Type',mime[extname(file)]||'application/octet-stream'); createReadStream(file).pipe(res);
    } catch {res.writeHead(404).end();}
  });
  await bounded(new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);}),10000,'server listen');
  resourcesClosed.server=false; serverAddress=server.address();
  browser=await puppeteer.launch({executablePath:settings.chrome,headless:true,userDataDir:profile,timeout:Math.min(30000,deadline-Date.now()),args:['--no-first-run','--disable-background-networking']});
  resourcesClosed.browser=false;
  page=await browser.newPage(); page.setDefaultTimeout(10000);
  await page.setViewport({width:1280,height:800});
  await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
  cdp=await page.createCDPSession(); await cdp.send('Network.enable'); await cdp.send('Network.setBypassServiceWorker',{bypass:true}); await cdp.send('Network.setCacheDisabled',{cacheDisabled:true});
  page.on('pageerror',error=>errors.push(String(error)));
  page.on('console',msg=>{if(msg.type()==='error') errors.push(msg.text());});
  page.on('response',async response=>{
    const url=new URL(response.url());if(url.origin!==`http://127.0.0.1:${serverAddress.port}`)return;
    if(response.status()>=400)httpErrors.push({url:url.pathname,status:response.status()});
    try {responses[url.pathname]=sha(await response.buffer());}catch(error){errors.push('response hash '+url.pathname+': '+error.message);}
  });
  let clockScript=await page.evaluateOnNewDocument(clockSource());
  const url=`http://127.0.0.1:${serverAddress.port}/classic.html?lg01a=1&lg03=1&lg05folio=1&lg05layers=1&lg08estate=1&lg08print=1#play`;
  await write('resource-identity.json',{root,profile,serverAddress,browserPid:browser.process()?.pid,serverPid:process.pid,url});
  await bounded(page.goto(url,{waitUntil:'domcontentloaded',timeout:30000}),30000,'navigation');
  await readiness(true);
  const ready=await evaluate(()=>({url:location.href,edition:IMI.edition,screen:IMI.screen(),owner:Rewards.owns(),guard:Rewards.guard(IMI.ops.dev.S()),running:IMI.ops.progression.running(),held:Rewards.held(),flags:Object.fromEntries(new URLSearchParams(location.search)),empty:__pilotInitialEmpty,clock:__pilotClock.now(),score:IMI.bananas.get(),enabled:{Rewards:Rewards.enabled,Folio:Folio.enabled,Layers:Layers.enabled,Estate:Estate.enabled,Printing:IMI.ops.extensions.printingEnabled()},gameSpeed:IMI.ops.clock.speed(),premium:IMI.ops.dev.S().prem,tune:window.__TUNE??null,headlessFixture:!!window.__OPS_HEADLESS,hidden:document.hidden}));
  await write('identity.json',{root,profile,serverAddress,ready,clock:{base:'2026-10-15T00:00:00.000Z',frameMs:50,tickMaxSeconds:.25,startup:'native Node polling with ordered virtual callbacks only while owner unready',reload:'inert same boundary and continuing RNG state'},serviceWorkerBypassed:true,cacheDisabled:true,settings,tools:before});
  if(!ready.empty || ready.edition!=='classic' || ready.screen!=='game' || !ready.guard || ready.held || ready.hidden || ready.tune || ready.headlessFixture || ready.gameSpeed!==1 || Object.values(ready.enabled).some(value=>value!==true)) throw Error('Native empty-save admission identity failed');
  unchanged();
  await page.addScriptTag({path:join(root,'tools/long-game/regular-pilot-policy.js')});
  await checkpoint('readiness');
  outer: for(let day=0;day<14;day++) for(let session=0;session<3;session++) {
    const sessionEnd=(day*86400+session*28800+1200)*1000;
    let clock=await evaluate(()=>__pilotClock.now());
    if(clock>sessionEnd) throw Error('Startup exceeded first session');
    while(clock<sessionEnd) {
      if(Date.now()>=deadline) {stopReason='wall horizon';break outer;}
      const step=await evaluate(()=>{RegularPilot.second();return {clock:__pilotClock.now(),folioActions:RegularPilot.record.folio.length,needsBot:IMI.ops.dev.S().intro.done && typeof Bot==='undefined'};});
      clock=step.clock;
      if(step.folioActions!==folioActions) {folioActions=step.folioActions;await checkpoint('Folio transition');}
      if(step.needsBot) await page.addScriptTag({path:join(root,'tools/bot.js')});
    }
    if(clock!==sessionEnd) throw Error('Session calendar boundary mismatch');
    await evaluate(()=>RegularPilot.sessionEnd());
    await checkpoint(`day ${day+1} session ${session+1} end`); unchanged();
    if(last.layers?.count===1 && last.bound && last.foundation>=1) {endpointCandidate=true;stopReason='first Imprint pending Save/reload';break outer;}
    await evaluate(()=>RegularPilot.away(27600));
    await checkpoint(`day ${day+1} session ${session+1} away`);
    if(day===13 && session===2) {horizonComplete=last.clock===14*86400000;stopReason='14 simulated days';break outer;}
  }
  if(endpointCandidate) {
    await sample(false); await write('policy-summary.json',last);
    const saved=await evaluate(()=>{
      const wallet=IMI.bananas.saveAcknowledged(),state=IMI.ops.extensions.save(),s=IMI.ops.dev.S();
      return {wallet,state,boundary:__pilotClock.now(),seed:__pilotClock.seed(),layers:s.meta.layers,claim:s.rewards.claims['layer:imprint:first'],balance:IMI.bananas.get(),marker:IMI.bananas.acknowledgement(),rawState:localStorage.getItem('imi-ops-v1'),rawWallet:localStorage.getItem('imi-score')};
    });
    await write('endpoint-save.json',saved);
    if(!saved.wallet?.ok || !saved.state?.ok || !saved.claim || saved.claim.status!=='committed') throw Error('Endpoint explicit Save/first claim not acknowledged');
    const raw=JSON.parse(saved.rawState),rawWallet=JSON.parse(saved.rawWallet);
    if(JSON.stringify(raw.meta.layers)!==JSON.stringify(saved.layers) || JSON.stringify(raw.rewards.claims['layer:imprint:first'])!==JSON.stringify(saved.claim) || rawWallet?.score!==saved.balance || JSON.stringify(rawWallet.rewardMarker??null)!==JSON.stringify(saved.marker)) throw Error('Endpoint raw Save readback mismatch');
    await page.removeScriptToEvaluateOnNewDocument(clockScript.identifier);
    clockScript=await page.evaluateOnNewDocument(clockSource(saved.boundary,saved.seed));
    await bounded(page.reload({waitUntil:'domcontentloaded',timeout:30000}),30000,'endpoint reload');
    await readiness(false); // Never replay absence or run productive callbacks during confirmation.
    const reloaded=await evaluate(()=>({clock:__pilotClock.now(),layers:IMI.ops.dev.S().meta.layers,claim:IMI.ops.dev.S().rewards.claims['layer:imprint:first'],balance:IMI.bananas.get(),marker:IMI.bananas.acknowledgement(),guard:Rewards.guard(IMI.ops.dev.S()),held:Rewards.held(),rawState:localStorage.getItem('imi-ops-v1'),rawWallet:localStorage.getItem('imi-score')}));
    await write('endpoint-reload.json',reloaded);
    endpointAcknowledged=reloaded.clock===saved.boundary && reloaded.guard && !reloaded.held && JSON.stringify(reloaded.layers)===JSON.stringify(saved.layers) && JSON.stringify(reloaded.claim)===JSON.stringify(saved.claim) && reloaded.balance===saved.balance && JSON.stringify(reloaded.marker)===JSON.stringify(saved.marker) && reloaded.rawState===saved.rawState && reloaded.rawWallet===saved.rawWallet;
    stopReason=endpointAcknowledged?'first Imprint, Pocket binding and Save/reload acknowledged':'endpoint reload unverified';
  }
} catch(error) {
  endpointAcknowledged=false; errors.push(String(error.stack||error));
  if(stopReason==='unknown' || endpointCandidate) stopReason=endpointCandidate?'endpoint Save/reload error':'readiness or route error';
  await checkpoint('failure');
  await write('failure-state.json',{state:last,sampledWallSeconds:lastSampleWallSeconds,errors});
} finally {
  clearInterval(pulse);
  await pulsePromise;
  // Preserve the progression snapshot after reload, which deliberately does not load policy.
  if(!endpointCandidate) try {await sample(false);}catch(error){errors.push('final sample: '+error.message);}
  durableCheckpoint('stop');
  try {
    if(browser) {await bounded(browser.close(),2000,'browser close');resourcesClosed.browser=browser.process()?.exitCode!=null || browser.process()?.signalCode!=null;}
  } catch(error) {
    errors.push('browser close: '+error.message);
    resourcesClosed.browser=browser?.process()?.exitCode!=null || browser?.process()?.signalCode!=null ? true : browser?.process()?.kill()?'termination requested; closure unverified':false;
  }
  try {
    if(server) {server.closeAllConnections();await bounded(new Promise((resolve,reject)=>server.close(error=>error?reject(error):resolve())),1000,'server close');resourcesClosed.server=!server.listening;}
  } catch(error) {errors.push('server close: '+error.message);resourcesClosed.server=!server?.listening;}
  const after=hashes();
  if(sourceFiles.some(name=>before[name]!==after[name])) {endpointAcknowledged=false;stopReason='used source drift';}
  await write('used-source-after.json',after);
  await write('report.json',report());
  clearTimeout(watchdog);
}
