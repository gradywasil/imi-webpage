// Internal module assembly with actual Core/Ops/Rewards/Economy and controlled clocks.
// Omitting the cold gate here is an assembly boundary, never native Vault admission.
import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const out='docs/plan/long-game/evidence/LG-02/implementation-b2-r2';
const {default:puppeteer}=await import(pathToFileURL(process.env.PUPPETEER_MODULE).href);
export const browser=()=>puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--no-sandbox']});
export function records(overrides={}) {
  const native=JSON.parse(fs.readFileSync(out+'/native-core-before.json')).structuredContent.value;
  const s=JSON.parse(native.opsRaw);
  Object.assign(s,{lastSeen:100000,stats:{...s.stats,secs:0,playSecs:0},...overrides});
  return {'imi-score':native.walletRaw,'imi-ops-v1':JSON.stringify(s)};
}
export function vault() { return {version:1,nextSequence:1,purchases:{},owned:{},active:{},selections:{},settings:{hideStore:false}}; }
export function gameTwo(input=records()) {
  const s=JSON.parse(input['imi-ops-v1']),v=vault(),costs=[150,300,500,800];
  for(let i=0;i<4;i++) {
    const id='vault:'+(i+1),itemId='game-speed:'+(i+1);
    v.purchases[id]={version:1,itemId,catalogueRevision:1,sequence:i+1,status:'active',cost:costs[i],debitEarned:costs[i],debitBought:0,priorTier:i,targetTier:i+1,createdWallMs:0,activatedWallMs:0,printingAtPurchase:0};
    v.owned[itemId]=id;
  }
  v.nextSequence=5;v.active['game-speed:4']='vault:4';
  Object.assign(s.prem,{vault:v,earned:0,earnedTotal:1750,spentEarned:1750,credits:{'fixture:earned':{source:'earned',amount:1750,origin:'controlled fixture, no production grant'}}});
  return {...input,'imi-ops-v1':JSON.stringify(s)};
}
export async function fixture(browser, input=records(), {hidden=true,wall=100000,mono=1000,speed=1,fullShell=false,fail=null,tune={}}={}) {
  const context=await browser.createBrowserContext(), page=await context.newPage(), errors=[], hashes={}, reads=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.ok()&&/\/(core|ops|rewards|economy|vault)\.js$/.test(new URL(r.url()).pathname))reads.push(r.buffer().then(b=>{hashes[new URL(r.url()).pathname]=createHash('sha256').update(b).digest('hex');}));});
  if(!fullShell) {
    const html=fs.readFileSync('index.html','utf8').replace('<head>','<head><base href="/">').replace(/<script src="vault-save-gate\.js"><\/script>/,'')
      .replace(/<script>[\s\S]*?<\/script>/g,script=>script.includes('VaultSaveGate')?'':script);
    if(html.includes('src="vault-save-gate.js"'))throw Error('Assembly gate tag not removed');
    await page.setRequestInterception(true);
    page.on('request',r=>{if(new URL(r.url()).pathname==='/tools/long-game/fixture-lg02-b2-r2-20261013/assembly.html')void r.respond({status:200,contentType:'text/html',body:html});else void r.continue();});
  }
  await page.evaluateOnNewDocument(({input,hidden,wall,mono,speed,fail,tune,inert})=>{
    for(const [k,v]of Object.entries(input))localStorage.setItem(k,v);
    localStorage.setItem('imi-fx','low');
    window.__TUNE=tune;if(inert){let real;Object.defineProperty(window,'VaultPlay',{configurable:true,get:()=>real,set:v=>{real=Object.freeze({...v,rawCheck:()=>true,startupCheck:()=>true,install:()=>{}});}});}
    window.__rng=1;window.__rngCalls=0;Math.random=()=>{__rngCalls++;__rng=(__rng*16807)%2147483647;return (__rng-1)/2147483646;};
    window.__wall=wall;window.__mono=mono;window.__hidden=hidden;window.__writes=[];window.__fail=fail;window.__closed=0;window.__continued=0;
    Date.now=()=>__wall;performance.now=()=>__mono;
    // Main ticks are advanced explicitly in these virtual-clock unit fixtures.
    const interval=window.setInterval;window.setInterval=(fn,ms,...args)=>interval(fn,ms===50?60000:ms,...args);
    Object.defineProperty(document,'hidden',{get:()=>__hidden});
    window.__OPS_EXTENSIONS=[['boundary-fixture-clock',{speed:()=>speed,init:(_,api)=>{const cp=api.state().rewards.awayCheckpoint;window.__initialCp=cp;window.__initialReport=cp?.report;window.__initialSold=cp?.sold;},vaultClosed:()=>{__closed++;}}]];
    const set=Storage.prototype.setItem;
    Storage.prototype.setItem=function(k,v){
      let p;try{p=JSON.parse(v);}catch{}
      const f=__fail,t=p?.prem?.vault?.transition,cp=p?.rewards?.awayCheckpoint;
      const matches=f&&k===f.key&&(!f.end||cp?.nowMs===f.end)&&(!f.afterOpen||window.__openWritten)&&(f.stage==='any'||f.stage==='open'&&!!t||f.stage==='tail-delete'&&t?.phase==='tail'&&!cp||f.stage==='ordinary-delete'&&window.__cpWritten&&!cp&&!t||f.stage==='settled-delete'&&t?.phase==='settled'&&!cp||f.stage==='close'&&!t&&__openWritten||f.stage===cp?.phase||f.stage==='payment'&&!!cp?.credit||f.stage==='away-baseline'&&window.IMI?.ops?.extensions.state().rewards.awayCheckpoint?.credit||f.stage==='wallet-credit'&&p.rewardMarker?.id?.startsWith('away:')||f.stage==='claim'&&p?.rewards?.claims?.[f.id]?.status===f.status);
      if(matches&&f.remaining-->0){__writes.push({key:k,raw:v,rejected:true});throw Error('Injected '+f.stage+' storage failure');}
      set.call(this,k,v);if(t)window.__openWritten=true;if(cp)window.__cpWritten=true;__writes.push({key:k,raw:v,rejected:false});
    };
  },{input,hidden,wall,mono,speed,fail,tune,inert:!fullShell});
  const route=fullShell?'/index.html':'/tools/long-game/fixture-lg02-b2-r2-20261013/assembly.html';
  await page.goto((process.env.LG01_URL||'http://127.0.0.1:8312')+route+'?featureProfile=legacy&s=pixel&lg01a=1&lg02=1#play');
  if(!fullShell)await page.waitForFunction(()=>!!window.IMI?.ops);
  await Promise.all(reads);
  return {page,errors,hashes,close:()=>context.close()};
}
export async function oldCheckpoint(browser,phase='complete') {
  const f=await fixture(browser,records({lastSeen:94000}));
  try {
    await f.page.evaluate(phase=>{__fail={key:'imi-ops-v1',stage:phase==='complete'?'ordinary-delete':'complete',remaining:1};IMI.ops.simulateAway(6);},phase);
    const input=await f.page.evaluate(()=>({'imi-score':localStorage.getItem('imi-score'),'imi-ops-v1':localStorage.getItem('imi-ops-v1')}));
    const s=JSON.parse(input['imi-ops-v1']);
    if(!s.rewards.awayCheckpoint)throw Error('Actual old checkpoint not retained');
    s.prem.vault=vault();input['imi-ops-v1']=JSON.stringify(s);
    return input;
  }finally{await f.close();}
}
export async function shelf(f) {
  return f.page.evaluate(()=>{
    const d=IMI.ops.dev,s=d.S(),r=d.RECIPES.find(r=>!r.kid&&!r.lib&&r.band===0);
    s.intro.done=true;for(const [word,n]of Object.entries(r.need))s.bank[word]=n;d.touchBank();d.writeTitle(r.id);d.checkAwards(true);
    return {id:r.id,rate:d.royBase(),marker:IMI.bananas.acknowledgement(),running:IMI.ops.progression.running()};
  });
}
export async function invoke(f,{wall=106000,mono=1250,hidden=true,fail=null,build='p=>p',id='boundary:test'}={}) {
  return f.page.evaluate(({wall,mono,hidden,fail,build,id})=>{
    __wall=wall;__mono=mono;__hidden=hidden;__fail=fail;
    return Rewards.runLocalTransaction({id,kind:'settlement',settle:IMI.ops.extensions.vaultBoundary,build:eval('('+build+')'),continue:()=>{__continued++;}});
  },{wall,mono,hidden,fail,build,id});
}
export async function capture(f,name) {
  const value=await f.page.evaluate(()=>({state:IMI?.ops?.extensions.state(),wallet:IMI?.bananas?.get(),opsRaw:localStorage.getItem('imi-ops-v1'),walletRaw:localStorage.getItem('imi-score'),writes:__writes,closed:__closed,continued:__continued,held:Rewards.held?.(),running:IMI?.ops?.progression.running()}));
  const run=process.env.LG02_B2_R2_TEST_RUN||'first';
  fs.writeFileSync(out+'/'+run+'-'+name+'.json',JSON.stringify({coverage:'internal module assembly; controlled clocks; actual storage acknowledgements; no native admission/lifecycle claim',hashes:f.hashes,errors:f.errors,...value},null,2)+'\n',{flag:'w'});
  return value;
}
