// Authorized actual hidden/bfcache lane. Default launch flags and temporary task storage only.
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const {default:pp}=await import(pathToFileURL(process.env.PUPPETEER_MODULE).href);
const run=process.env.LG01_R3_LIFECYCLE_RUN||'';
if(!/^[a-z0-9-]*$/.test(run))throw Error('Invalid lifecycle suffix');
const out='docs/plan/long-game/evidence/LG-01/repair-runtime-r3'+(run?'/lifecycle-'+run:''),base='http://127.0.0.1:8172';
await fs.mkdir(out,{recursive:true});
const fixture=JSON.parse(await fs.readFile('docs/plan/long-game/evidence/LG-01/implementation-c-r2/post-sale-fixture.json','utf8'));
const profile=await fs.mkdtemp(path.join(os.tmpdir(),'lg01-repair-r3-lifecycle-'));
const browser=await pp.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,userDataDir:profile});
const report={profile,browser:await browser.version(),flags:browser.process().spawnargs,cases:[],errors:[]};
const sleep=ms=>new Promise(r=>setTimeout(r,ms)),sha=b=>createHash('sha256').update(b).digest('hex');
const capture=page=>page.evaluate(()=>({owner:Rewards.owns(),held:Rewards.held(),running:IMI.ops.progression.running(),state:JSON.stringify(IMI.ops.extensions.state()),buffs:JSON.stringify(IMI.ops.dev.buffs),ops:localStorage.getItem('imi-ops-v1'),wallet:localStorage.getItem('imi-score'),writes:__writes,timeOrigin:performance.timeOrigin,hidden:document.hidden,at:Date.now(),inside:document.querySelector('.o-writer-status').contains(document.querySelector('.o-buffbar')),nodesSame:__chips.every((n,i)=>document.querySelector('.o-buffbar').children[i]===n)}));
try {
  for(const edition of ['pixel','classic']){
    const context=await browser.createBrowserContext(),page=await context.newPage();
    const row={edition,hashes:{},errors:[]};report.cases.push(row);const reads=[];
    page.on('pageerror',e=>row.errors.push(String(e)));
    page.on('response',r=>{const p=new URL(r.url()).pathname.slice(1);if(r.ok()&&['ops.js','rewards.js','ops.css','core.js','economy.js'].includes(p))reads.push(r.buffer().then(b=>row.hashes[p]=sha(b)));});
    await page.evaluateOnNewDocument(()=>{
      window.__observers=[];const Native=ResizeObserver;
      window.ResizeObserver=class extends Native{observe(node,options){__observers.push(node.id||node.className);return super.observe(node,options)}};
      addEventListener('pageshow',e=>{
        if(!e.persisted)return;
        const bar=document.querySelector('.o-buffbar'),keys=[localStorage.getItem('imi-score'),localStorage.getItem('imi-ops-v1')];
        const retry=Rewards.retry(),save=IMI.ops.saveAcknowledged(),spend=IMI.bananas.spend(25);
        sessionStorage.setItem('r3-old-document',JSON.stringify({persisted:true,owner:Rewards.owns(),timeOrigin:performance.timeOrigin,hostRestored:bar.parentNode===document.body,nodesSame:__chips.every((n,i)=>bar.children[i]===n),panelChips:document.querySelector('.o-writer-status').querySelectorAll('.o-buff').length,retry,save,spend,keysSame:JSON.stringify(keys)===JSON.stringify([localStorage.getItem('imi-score'),localStorage.getItem('imi-ops-v1')])}));
      },{capture:true});
    });
    await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
    await page.goto(base+'/docs/plan/long-game/evidence/LG-01/implementation-a/blank.html');
    await page.evaluate(s=>{s.lastSeen=0;s.daily={last:new Date().toDateString(),streak:1};s.stats.letters=999;s.rewards={goals:{version:1,revealed:true,ids:['l1k','s4','d1'],unknown:'keep'}};localStorage.setItem('imi-ops-v1',JSON.stringify(s));localStorage.setItem('imi-score','{"economyVersion":1,"score":6250}');localStorage.setItem('imi-tour','{"version":2,"done":true,"tipsOff":true}');},fixture);
    await page.goto(base+'/'+(edition==='pixel'?'index':'classic')+'.html?lg01a=1#play');
    await page.waitForFunction(()=>window.IMI?.ops&&Rewards.owns());
    await page.evaluate(async()=>{
      IMI.ops.dev.buffs.snack=performance.now()+120000;IMI.ops.dev.buffs.frenzy=performance.now()+30000;
      IMI.ops.extensions.state().challenge={id:'vowel',start:Date.now()};IMI.ops.extensions.mark();await new Promise(r=>setTimeout(r,350));
      window.__chips=[...document.querySelector('.o-buffbar').children];window.__writes=[];const set=Storage.prototype.setItem;
      Storage.prototype.setItem=function(k,v){const rejected=k==='imi-ops-v1'&&JSON.parse(v).rewards?.claims?.['award:l1k'];if(k==='imi-ops-v1'||k==='imi-score')__writes.push({key:k,value:v,rejected:!!rejected});if(rejected)throw Error('R3 lifecycle pending reward');return set.call(this,k,v)};
    });
    await page.click('#oStage');await page.waitForFunction(()=>Rewards.held());row.before=await capture(page);
    assert.equal(row.before.inside,true);assert.equal(row.before.nodesSame,true);assert.ok(row.before.writes.some(w=>w.rejected));
    await page.setViewport({width:360,height:560});await sleep(250);row.resize=await capture(page);await sleep(700);row.idle=await capture(page);
    for(const key of ['state','buffs','ops','wallet','writes'])assert.deepEqual(row.idle[key],row.before[key]);
    assert.equal(await page.evaluate(()=>__observers.includes('oGoals')),false);
    const contender=await context.newPage();await contender.evaluateOnNewDocument(()=>{window.__contenderWrites=[];const set=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){__contenderWrites.push({k,v});return set.call(this,k,v)}});
    await contender.goto(base+'/'+(edition==='pixel'?'classic':'index')+'.html?lg01a=1#play');await contender.bringToFront();await contender.waitForFunction(()=>document.querySelector('.o-writer-status'));
    row.contender=await contender.evaluate(()=>({owner:Rewards.owns(),imi:!!window.IMI,writes:__contenderWrites}));row.hidden=await capture(page);
    assert.equal(row.hidden.hidden,true);assert.equal(row.contender.owner,false);assert.equal(row.contender.imi,false);assert.deepEqual(row.contender.writes,[]);
    await sleep(32000);row.hiddenEnd=await capture(page);assert.ok(row.hiddenEnd.at-row.hidden.at>=32000);assert.equal(row.hiddenEnd.owner,true);
    await page.bringToFront();await sleep(350);row.returned=await capture(page);
    for(const key of ['state','buffs','ops','wallet'])assert.deepEqual(row.returned[key],row.before[key]);assert.equal(row.returned.inside,true);assert.equal(row.returned.nodesSame,true);
    await contender.close();
    await page.goto(base+'/docs/plan/long-game/evidence/LG-01/implementation-a/blank.html?r3=intervening');
    await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('imi-ops-v1'));s.meta={...s.meta,r3Fresh:true};s.lastSeen=0;localStorage.setItem('imi-ops-v1',JSON.stringify(s));});
    await page.goBack({waitUntil:'load'});await page.waitForFunction(()=>window.IMI?.ops&&Rewards.owns());await sleep(350);
    row.restored=await page.evaluate(()=>({old:JSON.parse(sessionStorage.getItem('r3-old-document')),owner:Rewards.owns(),held:Rewards.held(),timeOrigin:performance.timeOrigin,state:IMI.ops.extensions.state(),barHost:document.querySelector('.o-buffbar').parentNode===document.body}));
    assert.equal(row.restored.old.persisted,true);assert.equal(row.restored.old.owner,false);assert.equal(row.restored.old.hostRestored,true);assert.equal(row.restored.old.nodesSame,true);assert.equal(row.restored.old.panelChips,0);assert.equal(row.restored.old.keysSame,true);assert.equal(row.restored.old.retry,false);
    assert.notEqual(row.restored.timeOrigin,row.before.timeOrigin);assert.equal(row.restored.state.meta.r3Fresh,true);assert.equal(row.restored.barHost,true);assert.equal(row.restored.state.rewards.claims['award:l1k'],undefined);assert.equal(row.restored.state.stats.letters,999);
    await Promise.all(reads);for(const[p,h]of Object.entries(row.hashes))assert.equal(h,sha(await fs.readFile(p)));assert.deepEqual(row.errors,[]);await context.close();
    await fs.writeFile(out+'/lifecycle-progress.json',JSON.stringify(report,null,2)+'\n');
  }
}catch(e){report.errors.push({message:String(e),stack:e.stack});process.exitCode=1;}
finally {
  await browser.close();const target=await fs.realpath(profile);
  if(path.dirname(target)!==path.resolve(os.tmpdir())||!path.basename(target).startsWith('lg01-repair-r3-lifecycle-'))throw Error('Unowned profile');
  await fs.rm(target,{recursive:true,force:true});report.profileCleaned=true;await fs.writeFile(out+'/lifecycle.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});
}
