// Owner-authorized LG02 actual media/hidden/native bfcache lane, one game document at a time.
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const {default:pp}=await import(pathToFileURL(process.env.PUPPETEER_MODULE).href);
const base='http://127.0.0.1:8173', out='docs/plan/long-game/evidence/LG-02/implementation-a';
const fixture=JSON.parse(await fs.readFile(out+'/before/native-classic.json','utf8'));
const profile=await fs.mkdtemp(path.join(os.tmpdir(),'lg02-a-media-'));
const browser=await pp.launch({executablePath:process.env.CHROME,headless:true,userDataDir:profile});
const report={profile,browser:await browser.version(),flags:browser.process().spawnargs,cases:[],failures:[]};
const run=process.argv[2]||'r1';if(!['r1','r2'].includes(run))throw Error('Invalid run');
const sleep=ms=>new Promise(r=>setTimeout(r,ms)),sha=b=>createHash('sha256').update(b).digest('hex');
const state=page=>page.evaluate(()=>({at:Date.now(),hidden:document.hidden,timeOrigin:performance.timeOrigin,blocked:VaultSaveGate.blocked,imi:!!window.IMI,records:Object.fromEntries(Object.keys(localStorage).map(k=>[k,localStorage.getItem(k)])),writes:window.__writes,media:matchMedia('(prefers-reduced-motion: reduce)').matches,core:Core.reduceMotion,reduce:window.IMI?.reduceMotion,low:window.IMI?.fx?.low,restored:sessionStorage.getItem('lg02-a-restored')}));
try {
  for(const edition of ['pixel','classic']) for(const [media,fx,blocked]of [['reduce','high',false],['reduce','low',false],['no-preference','high',false],['no-preference','low',false],['reduce','low',true]]) {
    if(run==='r2' && !blocked)continue;
    const context=await browser.createBrowserContext(),page=await context.newPage(),hashes={},pending=[],errors=[];
    const row={edition,media,fx,blocked,hashes,errors};report.cases.push(row);
    try {
      page.on('pageerror',e=>errors.push(String(e)));
      page.on('response',r=>{const name=new URL(r.url()).pathname.slice(1);if(r.ok()&&['index.html','classic.html','vault-save-gate.js','rewards.js','core.js','economy.js','ops.js','ops.css'].includes(name))pending.push(r.buffer().then(b=>hashes[name]=sha(b)));});
      await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:media}]);
      await page.evaluateOnNewDocument(()=>{
        window.__writes=[];for(const name of ['setItem','removeItem','clear']){const original=Storage.prototype[name];Storage.prototype[name]=function(...args){__writes.push({storage:this===localStorage?'local':'session',name,args});return original.apply(this,args);};}
        addEventListener('pageshow',e=>{if(!e.persisted)return;const before=JSON.stringify(Object.fromEntries(Object.keys(localStorage).map(k=>[k,localStorage.getItem(k)])));let boot;try{Core.boot({edition:'classic'});boot='unexpected';}catch(e){boot=String(e);}sessionStorage.setItem('lg02-a-restored',JSON.stringify({persisted:true,timeOrigin:performance.timeOrigin,blocked:VaultSaveGate.blocked,imi:!!window.IMI,boot,keysSame:before===JSON.stringify(Object.fromEntries(Object.keys(localStorage).map(k=>[k,localStorage.getItem(k)])))}));},{capture:true});
      });
      await page.goto(base+'/docs/plan/long-game/evidence/LG-02/implementation-a/blank.html');
      await page.evaluate(({fixture,fx,blocked,edition})=>{const s=structuredClone(fixture.ops);if(blocked)s.prem.vault={version:1};s.lastSeen=Date.now();localStorage.setItem('imi-ops-v1',JSON.stringify(s));localStorage.setItem('imi-score',fixture.records['imi-score']);localStorage.setItem('imi-style',edition);localStorage.setItem('imi-fx',fx);localStorage.setItem('imi-tour','{"version":2,"done":true,"tipsOff":true}');},{fixture,fx,blocked,edition});
      await page.goto(base+'/'+(edition==='pixel'?'index':'classic')+'.html?lg01a=1&lg02=1#play',{waitUntil:'load'});
      await page.waitForFunction(()=>VaultSaveGate.blocked?!!document.querySelector('.o-vault-gate'):!!window.IMI?.ops);
      row.initial=await state(page);assert.equal(row.initial.media,media==='reduce');assert.equal(row.initial.core,media==='reduce');assert.equal(row.initial.blocked,blocked);
      if(blocked){assert.equal(row.initial.imi,false);assert.deepEqual(row.initial.writes,[]);}
      else{assert.equal(row.initial.reduce,media==='reduce');assert.equal(row.initial.low,fx==='low');row.effects=await page.evaluate(()=>({html:document.documentElement.dataset.fx,fx:IMI.fx,animation:getComputedStyle(document.querySelector('.o-pane')).animationName}));if(media==='reduce')assert.equal(row.effects.animation,'none');}
      if(fx==='low' && media==='reduce') {
        const blank=await context.newPage();await blank.goto('about:blank');await blank.bringToFront();row.hidden=await state(page);assert.equal(row.hidden.hidden,true);
        await sleep(32000);row.hiddenEnd=await state(page);await page.bringToFront();await sleep(300);row.returned=await state(page);await blank.close();
        assert.ok(row.hiddenEnd.at-row.hidden.at>=32000);assert.equal(row.returned.hidden,false);if(blocked)for(const snap of [row.hidden,row.hiddenEnd,row.returned]){assert.deepEqual(snap.records,row.initial.records);assert.deepEqual(snap.writes,[]);assert.equal(snap.imi,false);}
        await page.goto(base+'/docs/plan/long-game/evidence/LG-02/implementation-a/blank.html?bfcache=1');
        await page.goBack({waitUntil:'load'});if(!blocked)await page.waitForFunction(old=>performance.timeOrigin!==old&&window.IMI?.ops&&Rewards.owns(),{},row.initial.timeOrigin);row.bfcache=await state(page);
        const restored=JSON.parse(row.bfcache.restored||'null');assert.equal(restored?.persisted,true);assert.equal(restored.blocked,blocked);assert.equal(restored.keysSame,true);assert.match(restored.boot,blocked?/Vault save blocked/:/requires save ownership/);if(blocked){assert.equal(restored.imi,false);assert.deepEqual(row.bfcache.writes,[{storage:'session',name:'setItem',args:['lg02-a-restored',row.bfcache.restored]}]);}else assert.notEqual(row.bfcache.timeOrigin,row.initial.timeOrigin);
      }
      await Promise.all(pending);for(const [name,hash]of Object.entries(hashes))assert.equal(hash,sha(await fs.readFile(name)));assert.deepEqual(errors,[]);
    }catch(e){row.failure={message:String(e),stack:e.stack};report.failures.push({edition,media,fx,blocked,...row.failure});}
    finally{await context.close();}
  }
}finally {
  await browser.close();const target=await fs.realpath(profile);if(path.dirname(target)!==path.resolve(os.tmpdir())||!path.basename(target).startsWith('lg02-a-media-'))throw Error('Unowned profile');await fs.rm(target,{recursive:true,force:true});report.profileCleaned=true;
  await fs.writeFile(out+'/media-lifecycle-'+run+'.json',JSON.stringify(report,null,2),{flag:'wx'});console.log({cases:report.cases.length,failures:report.failures,profileCleaned:true});if(report.failures.length)process.exitCode=1;
}
