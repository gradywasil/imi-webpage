const fs=require('node:fs'), assert=require('node:assert/strict');
const pp=require('C:/Users/arran/pp/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js');
const out='docs/plan/long-game/evidence/UI-01/implementation-r2';
(async()=>{
 const browser=await pp.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const results=[],errors=[];
 async function fixture(before=false,opt=true){
  const context=await browser.createBrowserContext(),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  let source=fs.readFileSync(before?out+'/before-ops.js':'ops.js','utf8').replace(/\r\n/g,'\n');
  // Test-only lexical access to actual functions; no product hook or manufactured UI.
  source=source.replace('  startGame();\n  }','  window.__ui01={combo,award,renderBuffs,advanceDeadlines,high:typeof HIGH_MILES === "undefined" ? [] : HIGH_MILES};\n  startGame();\n  }');
  source=source.replace('const rand = Math.random;', 'const rand = () => { window.__uiRng=(window.__uiRng||0)+1; return Math.random(); };');
  await page.setRequestInterception(true);page.on('request',r=>new URL(r.url()).pathname==='/ops.js'?r.respond({status:200,contentType:'text/javascript',body:source}):r.continue());
  await page.goto('http://127.0.0.1:8393/tools/balance.html'+(opt?'?ui01=1':''));await page.waitForFunction(()=>!!window.__ui01);
  return {page,close:()=>context.close()};
 }
 try{
  const lower=[];
  for(const before of [true,false]){
   const f=await fixture(before);lower.push(await f.page.evaluate(()=>{
    const d=IMI.ops.dev;d.completeIntro();__seed(19);const rows=[];
    for(const m of d.MILES){const letters=d.totalLetters(d.S().desks[0]),cash=IMI.bananas.get(),rng=__uiRng||0;__ui01.award(m,0,0);rows.push({n:m.n,letters:d.totalLetters(d.S().desks[0])-letters,cash:IMI.bananas.get()-cash,buffs:Object.fromEntries(Object.entries(d.buffs).map(([k,v])=>[k,Math.max(0,v-performance.now())])),rng:(__uiRng||0)-rng,cooldown:d.ui.mcd[m.n]-performance.now()});}return rows;
   }));await f.close();
  }
  assert.deepEqual(lower[1],lower[0]);results.push({name:'actual lower 10/25/50/100/200 award parity',ok:true,rows:lower[1]});
  const f=await fixture();
  const high=await f.page.evaluate(()=>{
   const d=IMI.ops.dev;d.completeIntro();window.__OPS_HEADLESS=false;IMI.ops.extensions.setTab('floor');
   const rows=[];for(const m of __ui01.high){__ui01.combo.n=m.n-1;__ui01.combo.t=performance.now();const state=JSON.stringify([d.S().desks[0].letters,d.buffs,IMI.bananas.get()]),rng=__uiRng||0;d.comboHit();rows.push({n:m.n,name:m.name,unchanged:state===JSON.stringify([d.S().desks[0].letters,d.buffs,IMI.bananas.get()]),rng:(__uiRng||0)-rng,recognized:document.querySelector('.o-milestone-notice').textContent.includes(m.name),heat:document.querySelector('#opsRoot').dataset.heat});}
   return {rows,noticeCount:document.querySelectorAll('.o-milestone-notice').length,next:document.querySelector('#oMiles').textContent};
  });assert(high.rows.every(r=>r.unchanged&&r.rng===0&&r.recognized&&r.heat==='3'));assert.equal(high.noticeCount,1);results.push({name:'bounded six threshold fixture, six actual comboHit calls, no 5k loop',ok:true,...high});
  const meter=await f.page.evaluate(()=>{
   const d=IMI.ops.dev;Object.keys(d.buffs).forEach(k=>d.buffs[k]=0);d.buffs.frenzy=performance.now()+10000;__ui01.renderBuffs();
   const read=()=>({transform:document.querySelector('.frenzy .o-buff-meter i').style.transform,label:document.querySelector('.frenzy .o-buff-meter').getAttribute('aria-label')});
   const start=read();__skip(2000);__ui01.renderBuffs();const normal=read();__ui01.advanceDeadlines(2000);__ui01.renderBuffs();const accelerated=read();
   Object.keys(d.buffs).forEach(k=>d.buffs[k]=performance.now()+20000);d.S().challenge={id:'vowel',start:Date.now()};IMI.ops.extensions.setTab('training');__ui01.renderBuffs();
   return {start,normal,accelerated,details:document.querySelectorAll('.o-buff details').length,count:document.querySelectorAll('.o-buff').length,host:document.querySelector('.o-buffbar').parentElement.className,tabTop:document.querySelector('#o-training').getBoundingClientRect().top,stripBottom:document.querySelector('.o-buffbar').getBoundingClientRect().bottom};
  });assert.equal(meter.start.transform,'scaleX(1)');assert.equal(meter.normal.transform,'scaleX(0.8)');assert.equal(meter.accelerated.transform,'scaleX(0.6)');assert.equal(meter.details,6);assert.equal(meter.count,7);assert(meter.stripBottom<=meter.tabTop);results.push({name:'actual deadlines: normal and extra game-time drain, all six named details plus challenge, strip above pane',ok:true,...meter});await f.close();
  const off=await fixture(false,false);assert.equal(await off.page.evaluate(()=>__ui01.high.length),0);results.push({name:'independent ui01 default off',ok:true});await off.close();
 }finally{await browser.close();fs.writeFileSync(out+'/focused-results-final.json',JSON.stringify({coverage:'Actual Ops functions on documented virtual balance bridge, test-only lexical accessor. Not native UI or lifecycle proof.',results,errors},null,2),{flag:'wx'});}
 if(errors.length)throw Error(errors.join('\n'));console.log(JSON.stringify({checks:results.length,errors}));
})().catch(e=>{console.error(e);process.exitCode=1;});


