// Owner-authorized LG-01 actual pre-load reduced-motion lane only.
import { readFile,mkdir,writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { browser,base } from './lg01-b-fixture.mjs';
const directory=base+'/media'+(process.env.LG01_RUN?'-'+process.env.LG01_RUN:'');await mkdir(directory,{recursive:true});
const native=JSON.parse(await readFile(base+'/before/native-classic.json','utf8')).structuredContent.value;
const game=JSON.parse(native.opsRaw);
Object.assign(game,{lastSeen:0,awards:{},chDone:{},printing:0,rewards:{},prem:{},meta:{},written:{},divs:{songs:0,tv:0,radio:0,sketch:0,film:0},run:{earned:0},intro:{version:1,done:true,train:true,words:true,shop:true,hireAt:0}});
const b=await browser(),results=[],pid=b.process().pid,version=await b.version();
try{
  for(const edition of ['pixel','classic'])for(const [width,height]of [[1280,800],[390,700],[360,560]]){
    const context=await b.createBrowserContext(),page=await context.newPage(),errors=[],hashes={},reads=[];
    try{
      await page.setViewport({width,height});await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
      page.on('pageerror',error=>errors.push(error.message));
      page.on('response',response=>{const path=new URL(response.url()).pathname;if(response.ok()&&/\/(ops|core|rewards|economy)\.js$|\/(ops|classic|styles)\.css$/.test(path))reads.push(response.buffer().then(bytes=>{hashes[path]=createHash('sha256').update(bytes).digest('hex');}));});
      await page.evaluateOnNewDocument(game=>{localStorage.setItem('imi-score',JSON.stringify({economyVersion:1,score:0}));localStorage.setItem('imi-ops-v1',JSON.stringify(game));localStorage.setItem('imi-fx','low');localStorage.setItem('imi-tour',JSON.stringify({version:2,done:true,tipsOff:true}));},game);
      await page.goto('http://127.0.0.1:8162/'+(edition==='pixel'?'index':'classic')+'.html?lg01a=1&lg01b-media=1#play',{waitUntil:'load'});
      await page.waitForFunction(()=>!!window.IMI?.ops);await page.evaluate(()=>IMI.ops.progression.stop());await new Promise(r=>setTimeout(r,650));
      for(const status of [false,true]){
        if(status)await page.evaluate(()=>{const original=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key==='imi-ops-v1')throw Error('Media fixture storage rejected');original.call(this,key,value);};IMI.ops.progression.resume();IMI.ops.dev.S().stats.letters=100;IMI.ops.dev.checkAwards(true);});
        const value=await page.evaluate(()=>{const root=document.documentElement,b=document.querySelector('.o-writer-status button');return {media:matchMedia('(prefers-reduced-motion: reduce)').matches,core:Core.reduceMotion,imi:IMI.reduceMotion,fx:IMI.fx.mode,document:[root.scrollWidth,root.scrollHeight],viewport:[innerWidth,innerHeight],animation:getComputedStyle(document.querySelector('.o-pane')).animationName,retry:b?{width:b.getBoundingClientRect().width,height:b.getBoundingClientRect().height,focused:document.activeElement===b}:null,held:Rewards.held()};});
        assert.equal(value.media,true);assert.equal(value.core,true);assert.equal(value.imi,true);assert.equal(value.fx,'low');assert.deepEqual(value.document,[width,height]);assert.equal(value.animation,'none');
        if(status){assert.equal(value.held,true);assert.ok(value.retry.height>=40&&value.retry.width>=40);assert.equal(value.retry.focused,true);}
        const name=edition+'-'+(status?'status':'normal')+'-'+width+'x'+height+'.png';await page.screenshot({path:directory+'/'+name});results.push({edition,width,height,status,name,...value});
      }
      await Promise.all(reads);assert.deepEqual(errors,[]);results.push({edition,width,height,hashes,errors});
    }finally{await context.close();}
  }
  await writeFile(directory+'/report.json',JSON.stringify({coverage:'actual pre-load media only; ordinary native functional tests use T3',version,pid,results},null,2)+'\n',{flag:'wx'});
}finally{await b.close();}
console.log('Actual pre-load reduce/Core/IMI, Low, geometry and Retry media lane PASS');
