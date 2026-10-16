// Authorized isolated Chrome lane: actual pre-load media, hidden ownership and native bfcache.
import { readFile,writeFile,mkdir,mkdtemp,realpath,rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
const {default:pp} = await import(pathToFileURL(process.env.PUPPETEER_MODULE).href);
const out = 'docs/plan/long-game/evidence/LG-01/repair-runtime-r3', base = 'http://127.0.0.1:8172';
const run = process.env.LG01_C_MEDIA_RUN || '';
if (!/^[a-z0-9-]*$/.test(run)) throw Error('Invalid media output suffix');
const input = JSON.parse(await readFile('docs/plan/long-game/evidence/LG-01/implementation-c-r2/post-sale-fixture.json','utf8'));
const profile = await mkdtemp(path.join(os.tmpdir(),'lg01-repair-r3-media-'));
const report = {profile,cases:[],images:[],failures:[]}, sleep = ms => new Promise(r=>setTimeout(r,ms));
const sha = b => createHash('sha256').update(b).digest('hex');
await mkdir(out + '/media',{recursive:true});
const save = () => writeFile(out + '/media-report' + (run ? '-' + run : '') + '.json',JSON.stringify(report,null,2)+'\n');
const browser = await pp.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,userDataDir:profile});
report.browser = await browser.version(); report.flags = browser.process().spawnargs;
async function setup(edition,media='no-preference',fx='low') {
  const context=await browser.createBrowserContext(),page=await context.newPage(),errors=[],hashes={},reads=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('response',r=>{const p=new URL(r.url()).pathname.slice(1);if(r.ok()&&['rewards.js','ops.js','ops.css','core.js','economy.js',edition==='pixel'?'index.html':'classic.html'].includes(p))reads.push(r.buffer().then(b=>hashes[p]=sha(b)));});
  await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:media}]);
  await page.evaluateOnNewDocument(() => addEventListener('pageshow',e=>{if(e.persisted)sessionStorage.setItem('c-restored',JSON.stringify({persisted:true,oldOwner:Rewards.owns(),timeOrigin:performance.timeOrigin}));},{capture:true}));
  await page.goto(base+'/docs/plan/long-game/evidence/LG-01/implementation-a/blank.html');
  await page.evaluate(({input,fx})=>{const s=structuredClone(input);s.daily={last:new Date().toDateString(),streak:1};localStorage.setItem('imi-ops-v1',JSON.stringify(s));localStorage.setItem('imi-score','{"economyVersion":1,"score":6250}');localStorage.setItem('imi-fx',fx);localStorage.setItem('imi-tour','{"version":2,"done":true,"tipsOff":true}');},{input,fx});
  await page.goto(base+'/'+(edition==='pixel'?'index':'classic')+'.html?lg01a=1&lg01c=media#play');
  await page.waitForFunction(()=>document.querySelector('#oGoals:not([hidden])')&&Rewards.owns());
  await Promise.all(reads);
  for(const[p,hash]of Object.entries(hashes))assert.equal(hash,sha(await readFile(p)));
  return {context,page,hashes,errors};
}
const state = page => page.evaluate(()=>({owner:Rewards.owns(),hidden:document.hidden,visibility:document.visibilityState,at:Date.now(),timeOrigin:performance.timeOrigin,goals:IMI.ops.extensions.state().rewards.goals,restored:sessionStorage.getItem('c-restored'),wallet:localStorage.getItem('imi-score'),ops:localStorage.getItem('imi-ops-v1')}));
try {
  for(const edition of ['pixel','classic'])for(const[media,fx]of [['reduce','high'],['reduce','low'],['no-preference','high']]) {
    const f=await setup(edition,media,fx);
    try {
      const value=await f.page.evaluate(()=>{IMI.ops.progression.stop();const pane=document.getElementById('o-floor');pane.classList.add('enter');return {media:matchMedia('(prefers-reduced-motion: reduce)').matches,core:Core.reduceMotion,imi:IMI.reduceMotion,fx:IMI.fx.mode,animation:getComputedStyle(pane).animationName};});
      assert.equal(value.media,media==='reduce');assert.equal(value.core,value.media);assert.equal(value.imi,value.media);assert.equal(value.animation,media==='reduce'||fx==='low'?'none':'o-enterx');
      if(media==='reduce')for(const[w,h]of [[1280,800],[390,700],[360,560]]) {
        await f.page.setViewport({width:w,height:h});await sleep(400);
        const geometry=await f.page.evaluate(()=>({viewport:[innerWidth,innerHeight],document:[document.documentElement.scrollWidth,document.documentElement.scrollHeight],button:document.querySelector(innerWidth<=720?'.o-goals-phone':'.o-goals-desktop button').getBoundingClientRect().toJSON(),lines:[...document.querySelectorAll('.o-goals-phone .o-goal-line')].map(e=>({rect:e.getBoundingClientRect().toJSON(),font:getComputedStyle(e).font}))}));
        assert.deepEqual(geometry.document,geometry.viewport);assert.equal(geometry.button.height,44);
        const file=out+`/media/${run ? run + '-' : ''}${edition}-${fx}-${w}x${h}.png`;await f.page.screenshot({path:file});report.images.push({file,sha256:sha(await readFile(file)),geometry});
      }
      await f.page.evaluate(async()=>{
        IMI.ops.extensions.state().stats.letters=999;IMI.ops.dev.buffs.snack=performance.now()+120000;
        IMI.ops.progression.resume();IMI.ops.extensions.mark();await new Promise(r=>setTimeout(r,350));
        const set=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='imi-ops-v1'&&JSON.parse(v).rewards?.claims?.['award:l1k'])throw Error('R3 media hold');return set.call(this,k,v)};
      });
      await f.page.click('#oStage');await f.page.waitForFunction(()=>Rewards.held());
      const held=await f.page.evaluate(()=>{
        const panel=document.querySelector('.o-writer-status'),bar=document.querySelector('.o-buffbar'),button=panel.querySelector('button');
        return {inside:panel.contains(bar),focused:document.activeElement===button,retry:button.getBoundingClientRect().toJSON(),animation:getComputedStyle(bar.firstChild).animationName,shine:getComputedStyle(bar.firstChild,'::after').animationName,viewport:[innerWidth,innerHeight],document:[document.documentElement.scrollWidth,document.documentElement.scrollHeight]};
      });
      assert.equal(held.inside,true);assert.equal(held.focused,true);assert.ok(held.retry.height>=40);assert.equal(held.animation,'none');assert.equal(held.shine,'none');assert.deepEqual(held.document,held.viewport);
      const heldFile=out+`/media/${run?run+'-':''}${edition}-${media}-${fx}-held.png`;await f.page.screenshot({path:heldFile});report.images.push({file:heldFile,sha256:sha(await readFile(heldFile)),geometry:held});
      report.cases.push({kind:'media',edition,media,fx,value,held,hashes:f.hashes,errors:f.errors});await save();
    }finally{await f.context.close();}
  }
  for(const edition of ['pixel','classic']) {
    const f=await setup(edition), before=await state(f.page), contender=await f.context.newPage();
    try {
      await contender.evaluateOnNewDocument(()=>{window.__writes=[];const set=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){__writes.push({k,v});return set.call(this,k,v);};});
      await contender.goto(base+'/'+(edition==='pixel'?'classic':'index')+'.html?lg01a=1#play');await contender.bringToFront();
      await contender.waitForFunction(()=>document.querySelector('.o-writer-status'));
      const blocked=await contender.evaluate(()=>({owner:Rewards.owns(),imi:!!window.IMI,writes:__writes})),hidden=await state(f.page);
      assert.equal(hidden.hidden,true);assert.equal(blocked.owner,false);assert.deepEqual(blocked.writes,[]);
      await sleep(32000);const end=await state(f.page);await f.page.bringToFront();await sleep(400);const returned=await state(f.page);
      assert.equal(end.hidden,true);assert.equal(end.owner,true);assert.ok(end.at-hidden.at>=32000);assert.equal(returned.hidden,false);assert.deepEqual(returned.goals,before.goals);
      report.cases.push({kind:'hidden',edition,before,hidden,end,returned,blocked,hashes:f.hashes,errors:f.errors});await save();
    }finally{await f.context.close();}
    const cached=await setup(edition);
    try {
      const initial=await state(cached.page);await cached.page.goto(base+'/docs/plan/long-game/evidence/LG-01/implementation-a/blank.html?c=intervening');
      await cached.page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('imi-ops-v1'));s.meta.cFresh='current';s.lastSeen=0;localStorage.setItem('imi-ops-v1',JSON.stringify(s));});
      await cached.page.goBack({waitUntil:'load'});await cached.page.waitForFunction(()=>!!window.IMI?.ops&&Rewards.owns());await sleep(500);
      const final=await state(cached.page),restored=JSON.parse(final.restored);
      assert.equal(restored.persisted,true);assert.equal(restored.oldOwner,false);assert.notEqual(final.timeOrigin,initial.timeOrigin);assert.deepEqual(final.goals,initial.goals);assert.equal(JSON.parse(final.ops).meta.cFresh,'current');
      report.cases.push({kind:'bfcache',edition,initial,final,hashes:cached.hashes,errors:cached.errors});await save();
    }finally{await cached.context.close();}
  }
}catch(error){report.failures.push({error:String(error),stack:error.stack});process.exitCode=1;}
finally {
  await browser.close();const target=await realpath(profile);
  if(path.dirname(target)!==path.resolve(os.tmpdir())||!path.basename(target).startsWith('lg01-repair-r3-media-'))throw Error('Unowned profile path');
  await rm(target,{recursive:true,force:true});report.profileCleaned=true;await save();
}
