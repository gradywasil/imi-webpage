// Named owner-authorized real Chrome media, hidden/resume and persisted bfcache lane.
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const out='docs/plan/long-game/evidence/LG-02/implementation-b2-r2',base='http://127.0.0.1:8312';
const run=process.argv[2]||'first';
const native=JSON.parse(await fs.readFile(out+'/native-core-before.json','utf8')).structuredContent.value;
const {default:pp}=await import(pathToFileURL(process.env.PUPPETEER_MODULE).href);
const profile=await fs.mkdtemp(path.join(os.tmpdir(),'lg02-b2-r2-media-'));
const browser=await pp.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,userDataDir:profile});
const report={profile,browser:await browser.version(),flags:browser.process().spawnargs,cases:[],failures:[]};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const state=p=>p.evaluate(()=>({at:Date.now(),hidden:document.hidden,timeOrigin:performance.timeOrigin,media:matchMedia('(prefers-reduced-motion: reduce)').matches,core:Core.reduceMotion,reduce:window.IMI?.reduceMotion,low:window.IMI?.fx?.low,owner:Rewards.owns?.(),held:Rewards.held?.(),blocked:VaultSaveGate.blocked,imi:!!window.IMI,opsRaw:localStorage.getItem('imi-ops-v1'),walletRaw:localStorage.getItem('imi-score'),restored:sessionStorage.getItem('lg02-b2-r2-restored')}));
try {
  for(const edition of ['pixel','classic'])for(const [media,fx]of [['reduce','high'],['reduce','low'],['no-preference','high'],['no-preference','low']]) {
    const context=await browser.createBrowserContext(),page=await context.newPage(),errors=[],hashes={},reads=[];
    const row={edition,media,fx,errors,hashes};report.cases.push(row);
    try {
      page.on('pageerror',e=>errors.push(e.message));
      page.on('response',r=>{const file=new URL(r.url()).pathname.slice(1);if(r.ok()&&['core.js','ops.js','rewards.js','economy.js','vault.js'].includes(file))reads.push(r.buffer().then(b=>hashes[file]=createHash('sha256').update(b).digest('hex')));});
      await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:media}]);
      await page.evaluateOnNewDocument(()=>addEventListener('pageshow',e=>{
        if(!e.persisted)return;
        const before=[localStorage.getItem('imi-ops-v1'),localStorage.getItem('imi-score')];
        const retry=Rewards.retry(),wallet=IMI.bananas.saveAcknowledged();let boot;
        try{Core.boot({edition:'classic'});boot='unexpected';}catch(error){boot=error.message;}
        sessionStorage.setItem('lg02-b2-r2-restored',JSON.stringify({persisted:true,timeOrigin:performance.timeOrigin,owner:Rewards.owns(),retry,wallet,boot,keysSame:JSON.stringify(before)===JSON.stringify([localStorage.getItem('imi-ops-v1'),localStorage.getItem('imi-score')])}));
      },{capture:true}));
      await page.goto(base+'/'+out+'/native-inert.html');
      await page.evaluate(({native,edition,fx})=>{
        const s=JSON.parse(native.opsRaw);s.lastSeen=Date.now();s.garden.beds=[{ch:'A',desk:0,ready:Date.now()+600000},null];
        localStorage.setItem('imi-ops-v1',JSON.stringify(s));localStorage.setItem('imi-score',native.walletRaw);localStorage.setItem('imi-style',edition);localStorage.setItem('imi-fx',fx);localStorage.setItem('imi-tour','{"version":2,"done":true,"tipsOff":true}');
      },{native,edition,fx});
      await page.goto(base+'/'+(edition==='pixel'?'index':'classic')+'.html?s='+edition+'&lg01a=1&lg02=1#play');
      await page.waitForFunction(()=>!!window.IMI?.ops&&Rewards.owns());
      row.initial=await state(page);assert.equal(row.initial.media,media==='reduce');assert.equal(row.initial.core,media==='reduce');assert.equal(row.initial.reduce,media==='reduce');assert.equal(row.initial.low,fx==='low');
      if(media==='reduce')assert.equal(await page.evaluate(()=>getComputedStyle(document.querySelector('.o-pane')).animationName),'none');
      if(media==='reduce'&&fx==='low') {
        await page.evaluate(()=>{
          const set=Storage.prototype.setItem;window.__rejectClosing=true;window.__openDurable=false;
          window.__nativeCheckpoints=[];
          Storage.prototype.setItem=function(k,v){let p;try{p=JSON.parse(v);}catch{}if(k==='imi-ops-v1'&&__rejectClosing&&__openDurable&&!p?.prem?.vault?.transition)throw Error('Native closing failure');set.call(this,k,v);if(p?.prem?.vault?.transition)__openDurable=true;if(p?.rewards?.awayCheckpoint)__nativeCheckpoints.push(p.rewards.awayCheckpoint);};
        });
        const blank=await context.newPage();await blank.goto(base+'/'+out+'/native-inert.html');await blank.bringToFront();row.oldHiddenStart=await state(page);assert.equal(row.oldHiddenStart.hidden,true);
        await sleep(6200);
        row.invoked=await page.evaluate(()=>Rewards.runLocalTransaction({id:'boundary:native-media',kind:'settlement',settle:IMI.ops.extensions.vaultBoundary,build:p=>p,continue:()=>{}}));
        assert.equal(row.invoked,false);row.held=await state(page);assert.equal(row.held.held,true);
        row.checkpoints=await page.evaluate(()=>__nativeCheckpoints);assert.ok(row.checkpoints.length>0);assert.ok(row.checkpoints.every(cp=>cp.awaySec>=6&&cp.awaySec<8&&cp.multiplier===1));
        row.hidden=await state(page);assert.equal(row.hidden.hidden,true);
        await sleep(6200);row.hiddenEnd=await state(page);assert.ok(row.hiddenEnd.at-row.hidden.at>=6000);
        await page.bringToFront();await sleep(150);row.resumed=await state(page);assert.equal(row.resumed.hidden,false);
        for(const snap of [row.hidden,row.hiddenEnd,row.resumed]){assert.equal(snap.opsRaw,row.held.opsRaw);assert.equal(snap.walletRaw,row.held.walletRaw);assert.equal(snap.held,true);}
        await blank.close();
        await page.goto(base+'/'+out+'/native-inert.html?bfcache=1');await page.goBack({waitUntil:'load'});
        await page.bringToFront();
        let blockedReturn=false;
        // A fresh main-context read survives the bfcache-triggered reload itself.
        for(let attempt=0;attempt<100;attempt++) {
          blockedReturn=await page.evaluate(()=>window.VaultSaveGate?.blocked&&!!document.querySelector('.o-vault-gate')).catch(()=>false);
          if(blockedReturn)break;await sleep(100);
        }
        assert.equal(blockedReturn,true);
        row.bfcache=await state(page);const restored=JSON.parse(row.bfcache.restored||'null');
        assert.equal(restored?.persisted,true);assert.equal(restored.owner,false);assert.equal(restored.retry,false);assert.equal(restored.wallet.ok,false);assert.equal(restored.keysSame,true);assert.match(restored.boot,/save ownership/);
        assert.notEqual(row.bfcache.timeOrigin,restored.timeOrigin);assert.equal(row.bfcache.blocked,true);assert.equal(row.bfcache.imi,false);
      }
      await Promise.all(reads);for(const [file,hash]of Object.entries(hashes))assert.equal(hash,createHash('sha256').update(await fs.readFile(file)).digest('hex'));assert.deepEqual(errors,[]);
    }catch(error){row.failure={message:error.message,stack:error.stack};row.failureState=await state(page).catch(e=>({error:e.message}));row.failureDocument=await page.evaluate(()=>({url:location.href,text:document.body.innerText})).catch(e=>({error:e.message}));report.failures.push({edition,media,fx,...row.failure});}
    finally{await context.close();}
  }
}finally{
  await browser.close();const target=await fs.realpath(profile);
  if(path.dirname(target)!==path.resolve(os.tmpdir())||!path.basename(target).startsWith('lg02-b2-r2-media-'))throw Error('Unowned profile cleanup refused');
  await fs.rm(target,{recursive:true,force:true});report.profileCleaned=true;
  await fs.writeFile(out+'/media-lifecycle-'+run+'.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({cases:report.cases.length,failures:report.failures,profileCleaned:true}));if(report.failures.length)process.exitCode=1;
}
