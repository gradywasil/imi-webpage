const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const puppeteer=require('C:/Users/arran/pp/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js');
const out='docs/plan/long-game/evidence/LG-05/repair-reorder-r2/';
const hash=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const write=(f,v)=>fs.writeFileSync(out+f,JSON.stringify(v,null,2),{flag:'wx'});
(async()=>{
 const browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 const loaded={},errors=[],proof={qualification:'Controlled seeded bound Pocket fixture; actual DOM clicks and native save owner; isolated origin; service worker bypassed.'};
 try{
  const context=await browser.createBrowserContext(),page=await context.newPage();
  await page.setBypassServiceWorker(true);await page.setCacheEnabled(false);
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{const f=new URL(r.url()).pathname.slice(1);if(['folio.js','ops.js','rewards.js','core.js','economy.js'].includes(f))r.buffer().then(b=>loaded[f]=crypto.createHash('sha256').update(b).digest('hex'));});
  const base='http://127.0.0.1:8393/index.html';await page.goto(base);
  const fixture=await page.evaluate(()=>IMI.ops.dev.S());
  fixture.intro.done=true;fixture.printing=3;fixture.lastSeen=Date.now();fixture.rewards={};fixture.meta={};
  for(const d of fixture.desks){d.paws=0;d.keeper.on=false;}
  const reward={kind:'cash'};
  fixture.meta.folio={version:1,printing:3,selection:{id:'pocket',leaves:[0,1],reward,unknown:'selection'},working:false,completed:{pocket:{leaves:[0,1],reward,unknown:'completion'}},gallery:{pocket:{count:1,leaves:[0,1],unknown:'gallery'}},unknown:{retained:true}};
  await page.evaluateOnNewDocument(save=>{if(!sessionStorage.reorderSeeded){localStorage.setItem('imi-ops-v1',JSON.stringify(save));localStorage.setItem('imi-score',JSON.stringify({economyVersion:1,score:0}));sessionStorage.reorderSeeded='1';}},fixture);
  await page.goto(base+'?lg01a=1&lg05folio=1#play');
  await page.waitForFunction(()=>IMI.ops?.progression?.running()&&Rewards.owns());
  const open=async()=>{await page.evaluate(()=>document.querySelector('[data-tab="folio"]').click());await page.waitForSelector('[data-act="folio:reorder"]');};
  const snap=()=>page.evaluate(()=>{const s=IMI.ops.dev.S(),f=s.meta.folio;return {folio:JSON.parse(JSON.stringify(f)),durable:JSON.parse(localStorage.getItem('imi-ops-v1')).meta.folio,text:document.querySelector('.o-pane[data-pane="folio"]')?.innerText||[...document.querySelectorAll('.folio')].map(e=>e.innerText).join('\n'),resources:{bank:s.bank,desks:s.desks,wallet:IMI.bananas.get(),marker:IMI.bananas.acknowledgement(),run:s.run,claims:s.rewards.claims,stats:Object.fromEntries(Object.entries(s.stats).filter(([key])=>!['secs','playSecs'].includes(key))),working:f.working,count:f.gallery.pocket.count}};});
  await open();proof.before=await snap();
  await page.click('[data-act="folio:reorder"][data-id="pocket"]');
  await page.waitForFunction(()=>document.querySelector('.folio')?.innerText.includes('Reading order: The cap. Then The ape.'));
  proof.after=await snap();
  const check=(s,order)=>{for(const r of [s.folio.selection,s.folio.completed.pocket,s.folio.gallery.pocket])assert.deepEqual(r.leaves,order);assert.deepEqual(s.durable,s.folio);assert.deepEqual(s.resources,proof.before.resources);assert.equal(s.folio.unknown.retained,true);assert.equal(s.folio.selection.unknown,'selection');assert.equal(s.folio.completed.pocket.unknown,'completion');assert.equal(s.folio.gallery.pocket.unknown,'gallery');};
  check(proof.after,[1,0]);assert(proof.after.text.includes('The cap. Then The ape.'));
  await page.reload();await page.waitForFunction(()=>IMI.ops?.progression?.running()&&Rewards.owns());await open();proof.reload=await snap();check(proof.reload,[1,0]);
  await page.click('[data-act="folio:reorder"][data-id="pocket"]');await page.waitForFunction(()=>document.querySelector('.folio')?.innerText.includes('Reading order: The ape. Then The cap.'));
  proof.back=await snap();check(proof.back,[0,1]);
  proof.pastPrinting=await page.evaluate(()=>{
   const source=JSON.parse(JSON.stringify(IMI.ops.dev.S())),cases=[];
   for(const selection of [{id:'pocket',leaves:[0,2],reward:{kind:'cash'},unknown:'fresh'},{id:'journey',leaves:[1,2],reward:{kind:'cash'},unknown:'different'}]){
    const s=JSON.parse(JSON.stringify(source));s.printing=4;s.meta.folio={...s.meta.folio,printing:4,completed:{},selection,working:true};
    const before=JSON.parse(JSON.stringify(s)),result=Folio.proposal(s,{action:'reorder',id:'pocket',expected:s.meta.folio});
    cases.push({before:before.meta.folio,after:result.folio,sourceUnchanged:JSON.stringify(before)===JSON.stringify(s),onlyFolioProposal:Object.keys(result)});
   }return cases;
  });
  for(const c of proof.pastPrinting){assert.deepEqual(c.after.selection,c.before.selection);assert.equal(c.after.working,true);assert.deepEqual(c.after.completed,{});assert.deepEqual(c.after.gallery.pocket.leaves,[1,0]);assert.equal(c.after.gallery.pocket.count,1);assert(c.sourceUnchanged);assert.deepEqual(c.onlyFolioProposal,['folio']);}
  assert.deepEqual(errors,[]);for(const [f,h]of Object.entries(loaded))assert.equal(h,hash(f));assert.equal(Object.keys(loaded).length,5);
  write('dom-proof.json',{status:'PASS',...proof,loaded,errors});console.log('PASS: DOM reorder/reload/reverse back, durable records, unchanged resources and past-Printing selection preservation.');
 }catch(e){write('r3-failure.json',{message:e.message,stack:e.stack,proof,loaded,errors});throw e;}finally{await browser.close();write('r3-browser-cleanup.json',{closed:true,isolatedContext:true});}
})().catch(e=>{console.error(e);process.exitCode=1;});
