// Focused actual-browser/storage checks. Only the dedicated MG01 clock is advanced.
import {readFile, writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
const {default:puppeteer} = await import(pathToFileURL(process.env.PUPPETEER_MODULE).href);
const label = process.argv[2];
if (!/^r\d+$/.test(label || '')) throw Error('An exclusive run label is required');
const output = `docs/plan/long-game/evidence/MG-01/implementation-r1/focused-${label}.json`;
const fixture = JSON.parse(await readFile('docs/plan/long-game/evidence/MG-01/implementation-r1/controlled-save.json','utf8'));
const browser = await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--no-sandbox']});
const checks = [], errors = [];
const base = 'http://127.0.0.1:8341';
try {
  for (const lg01 of [false,true]) {
    const context = await browser.createBrowserContext(), page = await context.newPage();
    page.on('pageerror', e => errors.push({lg01,error:e.message}));
    await page.setBypassServiceWorker(true); await page.setCacheEnabled(false);
    await page.evaluateOnNewDocument(() => { window.__mgClock = 0; window.__MG01_CLOCK = () => window.__mgClock; });
    const seedScript = await page.evaluateOnNewDocument((s) => {
      const f = structuredClone(s); delete f.meta.minigames;
      f.lastSeen = Date.now(); f.daily = {last:new Date().toDateString(),streak:1};
      localStorage.setItem('imi-ops-v1',JSON.stringify(f));
      localStorage.setItem('imi-score',JSON.stringify({economyVersion:1,score:0}));
    }, fixture);
    // Seed once. Further navigations must load the actual acknowledged state.
    await page.goto(`${base}/index.html?mg01=1${lg01 ? '&lg01a=1' : ''}#play`);
    await page.removeScriptToEvaluateOnNewDocument(seedScript.identifier);
    await page.waitForFunction(() => !!IMI.ops?.extensions?.state().meta.minigames);
    const m = () => page.evaluate(() => structuredClone(IMI.ops.extensions.state().meta.minigames));
    const check = (name, detail) => checks.push({lg01,name,detail});
    await page.evaluate(() => {IMI.ops.extensions.state().daily.last = new Date().toDateString();IMI.ops.extensions.save();IMI.ops.extensions.setTab('breakroom');});
    const launch = async (type='rewarded') => {
      await page.waitForSelector(`[data-mg01="${type}"][data-game="shuffle"]`);
      await page.evaluate(type => document.querySelector(`[data-mg01="${type}"][data-game="shuffle"]`).click(),type);
      await page.waitForFunction(() => !!document.querySelector('iframe')?.contentWindow.CS);
    };
    const start = async () => {
      await page.evaluate(() => {const c=document.querySelector('iframe').contentWindow;c.CS.S.start();c.CS.S.skipCount();});
      await page.waitForFunction(() => document.querySelector('iframe').contentWindow.CS.S.phase==='play');
    };
    const advance = async seconds => {
      await page.evaluate(() => document.querySelector('iframe').contentWindow.MGHosted.input());
      await page.evaluate(() => new Promise(r=>setTimeout(r,0)));
      for (let i=0;i<seconds*2;i++) {
        await page.evaluate(() => {window.__mgClock+=600;const c=document.querySelector('iframe').contentWindow;for(let j=0;j<5;j++) c.MGHosted.advance(.1);});
        await page.evaluate(() => new Promise(r=>setTimeout(r,0)));
      }
    };
    const click = async action => {await page.evaluate(a=>document.querySelector(`.mg01-overlay [data-mg01="${a}"]`).click(),action);await page.evaluate(()=>new Promise(r=>setTimeout(r,30)));};
    await launch(); await click('close'); assert.equal((await m()).attempts,6);check('cancel before play is free');
    await launch();await start();assert.equal((await m()).attempts,5);
    const identityBefore = await m();
    await page.evaluate(()=>{
      const f=document.querySelector('iframe'),c=f.contentWindow,id=IMI.ops.extensions.state().meta.minigames.active.id;
      const data={bridge:'mg01',game:'shuffle',session:id,sequence:9999,mode:'main',elapsed:1,type:'progress'};
      window.postMessage(data,location.origin);
      c.parent.postMessage({...data,session:id+1},location.origin);
      c.parent.postMessage({...data,game:'barrel'},location.origin);
      c.parent.postMessage({...data,elapsed:Infinity},location.origin);
    });
    await page.evaluate(()=>new Promise(r=>setTimeout(r,20)));assert.deepEqual(await m(),identityBefore);check('wrong source/session/game and nonfinite result refused');
    await advance(12);
    // A natural losing finish below the minute uses the actual shared finish caller.
    await page.evaluate(()=>document.querySelector('iframe').contentWindow.CS.S.finish([['FIXTURE','short loss']]));
    await page.evaluate(()=>new Promise(r=>setTimeout(r,30)));
    assert.equal((await m()).wallet,0);assert.ok((await m()).active.played>=11);check('short loss retains time without paying');
    await start();assert.equal((await m()).attempts,5);await advance(50);
    await page.evaluate(()=>document.querySelector('iframe').contentWindow.CS.S.finish([['FIXTURE','natural finish after 60s']]));
    await page.waitForFunction(()=>IMI.ops.extensions.state().meta.minigames.active===null);
    let result=await m();assert.equal(result.wallet,10);assert.equal(result.attempts,5);check('free retry and 60s base settlement',result);
    await page.evaluate(()=>{const c=document.querySelector('iframe').contentWindow;c.CS.S.finish([]);c.MGHosted.finish(100);});
    await page.evaluate(()=>new Promise(r=>setTimeout(r,30)));assert.equal((await m()).wallet,10);check('duplicate finish cannot pay');
    await start();await advance(10);assert.equal((await m()).wallet,10);await click('close');check('post-bank practice gives zero');
    await launch();await start();await advance(7);await click('close');
    result=await m();assert.equal(result.wallet,11);assert.ok(result.fraction>0);check('quit banks partial and keeps fraction',result);
    await launch();await start();await advance(8);
    const before=await m();
    await page.reload();await page.waitForFunction(()=>!!IMI.ops?.extensions);
    result=await m();assert.equal(result.attempts,before.attempts);assert.equal(result.active.played,before.active.played);
    await page.evaluate(()=>{IMI.ops.extensions.setTab('breakroom');document.querySelector('[data-mg01="resume"]').click();});
    await page.waitForFunction(()=>!!document.querySelector('iframe')?.contentWindow.CS);
    await start();assert.equal((await m()).attempts,before.attempts);check('reload resumes saved credit without charge',result);
    await advance(2);
    await page.evaluate(()=>{
      const original=Storage.prototype.setItem;
      window.__quotaFixture={calls:0,error:null};
      Storage.prototype.setItem=function(key,value){
        if(key==='imi-ops-v1'){
          Storage.prototype.setItem=original;window.__quotaFixture.calls++;
          try{return original.call(this,key,value+' '.repeat(6*1024*1024));}
          catch(e){window.__quotaFixture.error=e.name;throw e;}
        }
        return original.call(this,key,value);
      };
    });
    const wallet=(await m()).wallet;await click('bank');assert.equal((await m()).wallet,wallet);
    const fault=await page.evaluate(()=>({native:window.__quotaFixture,held:!document.querySelector('.mg01-overlay [data-mg01="retry"]').hidden}));
    assert.equal(fault.native.error,'QuotaExceededError');assert.equal(fault.held,true);
    await click('retry');result=await m();assert.ok(result.wallet>wallet);assert.equal(result.active,null);
    await click('retry');assert.deepEqual(await m(),result);check('native quota write refusal then Retry pays once',{fault,result});
    await click('close');
    await launch();await start();await advance(182);assert.equal((await m()).active.played,180);await click('bank');
    result=await m();assert.equal(result.active,null);assert.ok(result.wallet>=wallet+10);check('180s cap and Bank then practice',result);await click('close');
    const retained=await m();
    await page.evaluate(()=>{IMI.ops.extensions.state().run.earned=Economy.cash(500000);IMI.ops.dev.doPrint();});
    assert.deepEqual(await m(),retained);assert.equal(await page.evaluate(()=>IMI.ops.extensions.state().meta.mg01Unknown),'preserve');
    check('actual Printing retains meta and unknown fields');
    // Refill/backward cases use saved real timestamps, never production speed.
    await page.evaluate(()=>{const a=IMI.ops.extensions,x=structuredClone(a.state().meta.minigames);x.attempts=1;x.refillAt=Date.now()-4*60*60*1000;a.commitMinigames(JSON.stringify(a.state().meta.minigames),x);a.setTab('breakroom');});
    await launch('practice');assert.equal((await m()).attempts,3);await click('close');
    await page.evaluate(()=>{const a=IMI.ops.extensions,x=structuredClone(a.state().meta.minigames);x.refillAt=Date.now()+4*60*60*1000;a.commitMinigames(JSON.stringify(a.state().meta.minigames),x);});
    await launch('practice');assert.equal((await m()).attempts,3);await click('close');check('real refill and backward clamp');
    await page.evaluate(()=>{const a=IMI.ops.extensions,x=structuredClone(a.state().meta.minigames);x.version=2;a.state().meta.minigames=x;a.save();});
    const future=await m();await page.evaluate(()=>document.querySelector('[data-mg01="rewarded"]').click());
    assert.equal(await page.$('iframe'),null);assert.deepEqual(await m(),future);check('future data preserved and refused');
    await context.close();
  }
  assert.deepEqual(errors,[]);
} catch(error) {errors.push({failure:error.stack});process.exitCode=1;}
finally {await browser.close();await writeFile(output,JSON.stringify({label,clockFixture:'__MG01_CLOCK only; MGHosted.advance supplies played frame time; forced shared natural finishes labelled fixture',checks,errors},null,2));}
console.log(JSON.stringify({output,checks:checks.length,errors},null,2));
