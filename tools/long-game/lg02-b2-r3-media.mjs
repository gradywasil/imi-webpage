import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import * as h from './lg02-b2-r3-fixture.mjs';
const write=(name,value)=>fs.writeFileSync(h.out+'/'+name+'.json',JSON.stringify(value,null,2)+'\n',{flag:'wx'});
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
write('media-command-before',{started:new Date().toISOString(),command:[process.execPath,...process.argv.slice(1)],env:{PUPPETEER_MODULE:process.env.PUPPETEER_MODULE},sources:['tour.js','sw.js','core.js','ops.js','rewards.js','vault.js','tools/long-game/lg02-b2-r3-media.mjs','tools/long-game/lg02-b2-r3-fixture.mjs'].map(file=>({file,sha256:sha(fs.readFileSync(file))})),scope:'Authorized actual pre-load reduced-motion preference and Effects Low in isolated Chrome. Ordinary native UI matrix uses T3.'});
const browser=await h.browser(),processInfo={pid:browser.process().pid,args:browser.process().spawnargs},results=[];
const profile=processInfo.args.find(a=>a.startsWith('--user-data-dir='))?.slice('--user-data-dir='.length);
try{
 for(const edition of ['pixel','classic'])for(const preference of ['reduce','no-preference']){
  const context=await browser.createBrowserContext(),page=await context.newPage(),loaded={},reads=[],errors=[];
  try{
   await page.setViewport({width:390,height:700});
   await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:preference}]);
   await page.evaluateOnNewDocument(()=>localStorage.setItem('imi-fx','low'));
   page.on('pageerror',e=>errors.push(e.message));
   page.on('response',r=>{const url=new URL(r.url());if(r.ok()&&/\/(tour|core|ops|rewards|vault)\.js$/.test(url.pathname))reads.push(r.buffer().then(bytes=>{loaded[url.pathname.slice(1)]=sha(bytes);}));});
   await page.goto('http://127.0.0.1:8313/'+(edition==='pixel'?'index':'classic')+'.html?s='+edition+'&lg01a=1&lg02=1&r3=media#play');
   await page.waitForFunction(()=>!!window.IMI?.tour&&!document.querySelector('.tour-bub').hidden);
   const before=await page.evaluate(()=>({media:matchMedia('(prefers-reduced-motion: reduce)').matches,core:IMI.reduceMotion,fx:document.documentElement.dataset.fx,still:document.querySelector('.tour-ring').classList.contains('still'),tour:localStorage.getItem('imi-tour')}));
   assert.equal(before.media,preference==='reduce');assert.equal(before.core,before.media);assert.equal(before.still,before.media);assert.equal(before.fx,'low');
   assert.equal((await page.evaluate(h.holdExpression)).held,true);
   assert.equal(await page.evaluate(()=>document.querySelector('.tour-bub').hidden&&document.querySelector('.tour-ring').hidden),true);
   const keys=await page.evaluate(()=>[localStorage.getItem('imi-ops-v1'),localStorage.getItem('imi-score')]);
   await page.click('.o-writer-status button');assert.equal(await page.evaluate(()=>Rewards.held()),true);assert.deepEqual(await page.evaluate(()=>[localStorage.getItem('imi-ops-v1'),localStorage.getItem('imi-score')]),keys);
   await page.click('.o-writer-status button');
   const after=await page.evaluate(()=>({held:Rewards.held(),continued:__r3Continued,bubbleHidden:document.querySelector('.tour-bub').hidden,still:document.querySelector('.tour-ring').classList.contains('still'),tour:localStorage.getItem('imi-tour'),intro:IMI.ops.introActive(),page:[document.documentElement.scrollWidth,document.documentElement.scrollHeight]}));
   assert.equal(after.held,false);assert.equal(after.continued,1);assert.equal(after.bubbleHidden,false);assert.equal(after.still,before.media);assert.equal(after.tour,before.tour);assert.equal(after.intro,true);assert.deepEqual(after.page,[390,700]);
   await Promise.all(reads);for(const [file,hash]of Object.entries(loaded))assert.equal(hash,sha(fs.readFileSync(file)));assert.deepEqual(errors,[]);
   results.push({edition,preference,before,after,loaded,errors,pass:true});
  }finally{await context.close();}
 }
}finally{
 await browser.close();
 write('media-results',{results,processInfo,profile:profile?path.resolve(profile):null,profileAbsent:profile?!fs.existsSync(profile):null,coverage:'Actual Chrome media preference before full-shell load; controlled real storage failures. No physical device/audio/lifecycle/bfcache claim.'});
}
console.log(JSON.stringify({passed:results.length,expected:4,profileAbsent:profile?!fs.existsSync(profile):null}));
