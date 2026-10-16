const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto'),pp=require('C:/Users/arran/pp/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js');
const out='docs/plan/long-game/evidence/LG-05/implementation-shelf-r1',run=process.argv[2];assert(/^[a-z0-9-]+$/.test(run));
(async()=>{const browser=await pp.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});const results=[];
try{const context=await browser.createBrowserContext(),page=await context.newPage(),base=`http://127.0.0.1:${JSON.parse(fs.readFileSync(`${out}/server.json`)).port}/`;
await page.setBypassServiceWorker(true);await page.setViewport({width:360,height:560});await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
const fixture=JSON.parse(fs.readFileSync(`${out}/final-ui-failure.json`));fixture.state.lastSeen=Date.now();
await page.evaluateOnNewDocument(f=>{localStorage.setItem('imi-ops-v1',JSON.stringify(f.state));localStorage.setItem('imi-score',JSON.stringify(f.wallet));},fixture);
for(const shell of ['index.html','classic.html']){await page.goto(base+shell+'?lg01a=1&lg05folio=1&lg05layers=1#play');await page.waitForFunction(()=>window.Rewards?.owns()&&IMI.ops.progression.running());
await page.evaluate(()=>IMI.ops.dev.action('go',{tab:'folio'}));await page.waitForSelector('[data-act="folio:shelf"]',{visible:true});
await page.evaluate(()=>{window.events=[];document.addEventListener('click',e=>events.push({target:e.target.outerHTML}),true);});
await page.click('[data-act="folio:shelf"]');await page.evaluate(()=>new Promise(r=>setTimeout(r,300)));
let debug=await page.evaluate(()=>({tab:IMI.ops.dev.ui.tab,events,action:String(window.__OPS_EXTENSIONS.find(x=>x[0]==='folio')[1].actions.shelf),html:document.querySelector('#o-imprints').innerHTML}));
assert.equal(debug.tab,'imprints','Actual pointer click opens shelf');
debug.geometry=await page.evaluate(()=>{const p=document.querySelector('#o-imprints'),c=p.querySelector('.layer-shelf');return {bodyScroll:document.documentElement.scrollHeight>innerHeight,horizontal:document.documentElement.scrollWidth>innerWidth,pane:{height:p.clientHeight,scrollHeight:p.scrollHeight,overflow:getComputedStyle(p).overflowY},controls:[...c.querySelectorAll('button')].map(b=>({text:b.textContent,height:b.getBoundingClientRect().height})),style:document.documentElement.dataset.style};});
assert(!debug.geometry.bodyScroll&&!debug.geometry.horizontal&&debug.geometry.pane.scrollHeight>debug.geometry.pane.height&&debug.geometry.controls.every(b=>b.height>=40));
debug.math=await page.evaluate(()=>{const s=IMI.ops.dev.S(),original=JSON.parse(JSON.stringify(s.meta.layers)),rows=[];s.meta.layers.stamps=Object.fromEntries(Layers.genres.map(g=>[g.id,true]));
for(const slots of [[],['mystery'],['mystery','horror'],['romance','poetry'],['sci-fi','comedy'],['mystery','romance','comedy'],['mystery','horror','poetry']]){s.meta.layers.shelf=slots;rows.push({slots,bonus:Layers.shelfBonus(s)});}
s.meta.layers.shelf=['mystery','horror','poetry'];const r=IMI.ops.dev.RECIPES.find(r=>r.band===0&&!r.kid&&!r.lib),expected=Economy.round(r.pay*(1+.01*Object.keys(s.awards).filter(k=>s.awards[k]).length)*(1+.02*s.legacy.total)*(1+.1*(s.legacy.ups.sales||0))*(1+.35*s.printing)*.95*1.1),actual=IMI.ops.dev.salePay(r,1);
const fit=Layers.saleFactor(s,1,()=>true);s.meta.layers.genre=null;const neutral=Layers.saleFactor(s,1,()=>true);s.meta.layers=original;return {rows,expected,actual,fit,neutral,recipe:r.id};});
assert.deepEqual(debug.math.rows.map(r=>r.bonus),[0,0,.05,.05,.05,.05,.1]);assert.equal(debug.math.actual,debug.math.expected);assert.equal(debug.math.neutral,1.1);assert(Math.abs(debug.math.fit-1.15*1.05*1.1)<1e-12);
debug.loaded={};for(const file of ['layers.js','layers.css','folio.js']){const bytes=await page.evaluate(async file=>Array.from(new Uint8Array(await(await fetch(file)).arrayBuffer())),file);const digest=crypto.createHash('sha256').update(Buffer.from(bytes)).digest('hex');assert.equal(digest,crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'));debug.loaded[file]=digest;}
await page.screenshot({path:`${out}/${run}-${shell}-360.png`});
await page.evaluate(()=>document.querySelector('[data-act="layers:remove"]').scrollIntoView({block:'start'}));await page.screenshot({path:`${out}/${run}-${shell}-slots-360.png`});
await page.click('[data-act="layers:folio"]');await page.waitForFunction(()=>IMI.ops.dev.ui.tab==='folio');debug.returnToFolio=true;
debug.earlyBridge=await page.evaluate(()=>{const s=IMI.ops.dev.S(),old=s.meta.layers,printing=s.printing;delete s.meta.layers;s.printing=3;Layers.openShelf();const value={tab:IMI.ops.dev.ui.tab,cost:document.querySelector('.layer-shelf').innerText,disabled:document.querySelector('[data-act="layers:shelf"]').disabled,noInitialization:s.meta.layers===undefined};s.meta.layers=old;s.printing=printing;return value;});assert.equal(debug.earlyBridge.tab,'imprints');assert(debug.earlyBridge.disabled&&debug.earlyBridge.noInitialization);
results.push(debug);
}
}finally{fs.writeFileSync(`${out}/${run}-ui.json`,JSON.stringify(results,null,2),{flag:'wx'});await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
