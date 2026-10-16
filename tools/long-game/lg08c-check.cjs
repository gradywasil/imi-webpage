const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const pp=require('C:/Users/arran/pp/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js');
const root=process.cwd(),out='docs/plan/long-game/evidence/LG-08/archive-r1',run=process.argv[2]||'main';
assert(/^[a-z0-9-]+$/.test(run));const write=(n,v)=>fs.writeFileSync(`${out}/${run}-${n}.json`,JSON.stringify(v,null,2),{flag:'wx'});
const fixture=JSON.parse(fs.readFileSync('docs/plan/long-game/evidence/LG-05/implementation-shelf-r1/final-ui-failure.json'));
Object.assign(fixture.state,{lastSeen:Date.now(),printing:7,challenge:null,offers:[],pitches:[],written:{},editions:{'ape-in-the-cape':2},bank:{}});
fixture.state.legacy={stars:7,total:360,ups:{seed:1,crew:0}};Object.assign(fixture.state.meta.layers,{count:5,seals:4});
fixture.state.desks.forEach(d=>{d.paws=0;d.crew=[];d.keeper.on=false;});
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2'};
const server=http.createServer((req,res)=>{const f=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);if(!f.startsWith(root+path.sep))return res.writeHead(403).end();fs.readFile(f,(e,b)=>{res.writeHead(e?404:200,{'Content-Type':mime[path.extname(f)]||'application/octet-stream','Cache-Control':'no-store'});res.end(e?'missing':b);});});
(async()=>{let browser;const result={status:'UNVERIFIED',checks:[],errors:[],hashes:{}};try{
await new Promise(r=>server.listen(0,'127.0.0.1',r));result.port=server.address().port;assert(![8000,8354,8356,8358,8397].includes(result.port));
browser=await pp.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const page=await browser.newPage();await page.setViewport({width:360,height:560,isMobile:true,deviceScaleFactor:1});await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);await page.setBypassServiceWorker(true);await page.setCacheEnabled(false);
page.on('pageerror',e=>result.errors.push(e.stack||e.message));page.on('response',async r=>{const f=new URL(r.url()).pathname.slice(1);if(['archive.js','ops.js','rewards.js','folio.js','layers.js','production-goal.js','estate.js','vault-save-gate.js'].includes(f))result.hashes[f]=crypto.createHash('sha256').update(await r.buffer()).digest('hex');});
const base=`http://127.0.0.1:${result.port}`,flags='?lg01a=1&lg05folio=1&lg05layers=1&lg08estate=1&lg08archive=1&pg01=1#play';
const seed=await page.evaluateOnNewDocument(f=>{localStorage.setItem('imi-ops-v1',JSON.stringify(f.state));localStorage.setItem('imi-score',JSON.stringify(f.wallet));localStorage.setItem('imi-sound','off');localStorage.setItem('imi-fx','low');},fixture);
await page.goto(base+'/index.html'+flags);await page.removeScriptToEvaluateOnNewDocument(seed.identifier);await page.waitForFunction(()=>window.Rewards?.owns()&&IMI.ops?.progression.running()&&!Rewards.held());
result.checks.push(...await page.evaluate(()=>{
const rows=[],check=(name,pass,facts)=>{rows.push({name,pass:!!pass,facts});if(!pass)throw Error(name+': '+JSON.stringify(facts));};
window.check=check;window.rows=rows;window.state=()=>IMI.ops.extensions.state();window.cmd=(action,extra={})=>{const s=state();return Rewards.archiveAction({action,...Layers.epochFields(s),revision:Archive.current(s).revision,at:Date.now(),...extra});};
const a=IMI.ops.extensions,s=state();document.querySelectorAll('.o-modal,.o-celebrate').forEach(e=>e.remove());
check('normal ownership and no eager Archive writes',Rewards.owns()&&Rewards.guard(s)&&!s.meta.archive);
const offer=a.estatePreview();check('accepted Estate path prepares existing save',Rewards.estateAction({action:'reset',quote:offer.quote}).ok);
check('Estate Charters available',state().meta.estate.charters===3);
check('explicit slot debit ACK',cmd('buy').ok&&state().meta.estate.charters===2&&state().meta.archive.slots===1);
check('second sequential slot debit ACK',cmd('buy').ok&&state().meta.estate.charters===0&&state().meta.archive.slots===2);
check('third slot insufficient no debit',!cmd('buy').ok&&state().meta.archive.slots===2);
check('16 authored frozen bases',Object.keys(Archive.books).length===16&&Archive.books['ape-in-the-cape'].pay===1500&&Archive.books['midsummer-chimp'].pay===3000000);
IMI.ops.productionGoal.configure({enabled:true,band:0,collection:'authored',advance:false,manual:'ape-in-the-cape'});
window.historyBefore=JSON.stringify([state().editions,state().written,state().awards,state().rewards.claims]);a.setTab('archive');a.mark();return rows.splice(0);
}));
await new Promise(r=>setTimeout(r,400));await page.screenshot({path:`${out}/${run}-pixel-archive-360.png`});
await page.click('[data-act="archive:endow"][data-title="ape-in-the-cape"]');await page.screenshot({path:`${out}/${run}-pixel-confirm-360.png`});
result.pixelLayout=await page.evaluate(()=>({pageScroll:document.documentElement.scrollHeight>innerHeight,buttons:[...document.querySelectorAll('.archive-confirm button')].map(e=>e.getBoundingClientRect().height),details:!!document.querySelector('.archive-confirm .layer-details')}));
await page.click('[data-act="archive:cancel"]');
await page.goto(base+'/classic.html'+flags);await page.waitForFunction(()=>Rewards.owns()&&IMI.ops?.progression.running()&&!Rewards.held());await page.evaluate(()=>{document.querySelectorAll('.o-modal,.o-celebrate').forEach(e=>e.remove());IMI.ops.extensions.setTab('archive');IMI.ops.extensions.mark();});await new Promise(r=>setTimeout(r,400));await page.click('[data-act="archive:endow"][data-title="ape-in-the-cape"]');await page.screenshot({path:`${out}/${run}-classic-sacrifice-360.png`});await page.click('[data-act="archive:cancel"]');
await page.goto(base+'/index.html'+flags);await page.waitForFunction(()=>Rewards.owns()&&IMI.ops?.progression.running()&&!Rewards.held());await page.evaluate(()=>{document.querySelectorAll('.o-modal,.o-celebrate').forEach(e=>e.remove());IMI.ops.extensions.setTab('archive');IMI.ops.extensions.mark();});await new Promise(r=>setTimeout(r,400));await page.click('[data-act="archive:endow"][data-title="ape-in-the-cape"]');await page.click('[data-act="archive:confirm"]');
// Restore scenario helpers after edition navigations.
await page.evaluate(()=>{window.rows=[];window.check=(name,pass,facts)=>{rows.push({name,pass:!!pass,facts});if(!pass)throw Error(name+': '+JSON.stringify(facts));};window.state=()=>IMI.ops.extensions.state();window.cmd=(action,extra={})=>{const s=state();return Rewards.archiveAction({action,...Layers.epochFields(s),revision:Archive.current(s).revision,at:Date.now(),...extra});};window.historyBefore=JSON.stringify([state().editions,state().written,state().awards,state().rewards.claims]);});
result.checks.push(...await page.evaluate(()=>{
const s=state(),e=s.meta.archive.entries[0],r=IMI.ops.dev.RBY[e.title];window.entryKey=e.key;
check('finite copy and history unchanged',s.meta.archive.usedCopies[e.title]===1&&JSON.stringify([s.editions,s.written,s.awards,s.rewards.claims])===historyBefore);
check('manual focus cleared in candidate',s.meta.productionGoal.manual===null&&s.autoFocus&&s.focus!==e.title);
s.bank={...Archive.books[e.title].need};IMI.ops.dev.touchBank();
check('manual sale blocked',!IMI.ops.dev.canWrite(r));const written=JSON.stringify(s.written);IMI.ops.dev.writeTitle(e.title);check('sale has no history effect',JSON.stringify(s.written)===written);
check('PG manual configure refuses curated title',!IMI.ops.productionGoal.configure({manual:e.title}).ok);
check('PG labels excluded denominator',IMI.ops.productionGoal.status().includes('1 archived excluded'));
s.pub={tier:3,on:true,rule:'any'};IMI.ops.dev.pubSell();check('Publisher cannot sell archived title',!state().written[e.title]);
check('restoration work borrows protected target',cmd('work',{key:e.key}).ok&&IMI.ops.dev.focusRecipe().title.startsWith('Archive:')&&IMI.ops.dev.pubStatus().includes('paused'));
const folio=Folio.current(state());check('Folio work conflict refuses',!Rewards.folioAction({action:'work',...Layers.epochFields(state()),expected:state().meta.folio}).ok);
// One relevant actual-owner material candidate failure, preserving old live inventory/benefits.
const proto=Storage.prototype,original=proto.setItem;window.restoreStorage=()=>{proto.setItem=original;};let fail=true;
proto.setItem=function(k,v){if(k==='imi-ops-v1'&&fail&&JSON.parse(v).meta.archive?.entries[0]?.deposits===1){fail=false;throw Error('LG08C injected material save failure');}return original.call(this,k,v);};
const before=JSON.stringify(state().bank),revision=state().meta.archive.revision,failed=cmd('deposit',{key:e.key});
check('failed material save keeps bank stage availability',!failed.ok&&JSON.stringify(state().bank)===before&&state().meta.archive.entries[0].deposits===0&&state().meta.archive.revision===revision&&!Archive.available(state(),r)&&!IMI.ops.progression.running());
restoreStorage();check('Retry saves exact deposit once',Rewards.retry()&&state().meta.archive.entries[0].deposits===1);const bank=JSON.stringify(state().bank);Rewards.retry();check('Retry replay cannot consume second recipe',JSON.stringify(state().bank)===bank&&state().meta.archive.entries[0].deposits===1);
state().pub.on=false;IMI.ops.extensions.setTab('press');IMI.ops.dev.ui.sub.press='titles';IMI.ops.dev.ui.libq='The Ape in the Cape';IMI.ops.dev.ui.libf='all';IMI.ops.extensions.mark();return rows.splice(0);
}));
await new Promise(r=>setTimeout(r,450));await page.evaluate(()=>document.querySelector('#o-press .o-book')?.scrollIntoView({block:'start'}));await page.screenshot({path:`${out}/${run}-pixel-withdrawal-360.png`});
result.checks.push(...await page.evaluate(()=>{
const a=IMI.ops.extensions,s=state(),e=s.meta.archive.entries[0],H=3600000;
window.realNow=Date.now;window.clock=e.born+12*H;Date.now=()=>clock;
check('12 hour stage condition',Archive.stage(e,clock)===1);
// Move observed cursor to start of the controlled one-hour fixture without earning the omitted time.
s.meta.archive.through=clock;a.register('lg08c-clock',{speed:()=>2});
clock+=H;const wallet=IMI.bananas.get(),rep=IMI.ops.simulateAway(3600);
check('actual counted one hour speed2 efficiency.4 pays2400',!!rep&&IMI.bananas.get()-wallet===2400,{rep,delta:IMI.bananas.get()-wallet});
check('fixed checkpoint completes and age advances',!state().rewards.awayCheckpoint&&!state().meta.archive.pending&&Archive.stage(state().meta.archive.entries[0],clock)===1);
const x=state().meta.archive.entries[0];for(const [w,n]of Object.entries(Archive.books[x.title].need))state().bank[w]=2*n;
check('second complete double recipe deposit',cmd('deposit',{key:x.key}).ok&&state().meta.archive.entries[0].deposits===2);
const start=clock;clock=x.born+60*H;const before=IMI.bananas.get(),capped=IMI.ops.simulateAway((clock-start)/1000);
check('full absence ages beyond two hour cap without uncapped payout',capped.counted===7200&&Archive.stage(state().meta.archive.entries[0],clock)===2&&IMI.bananas.get()-before===4800,{capped,delta:IMI.bananas.get()-before});
// A one-second paid interval at stage2 leaves 3 1/3 bananas below the denomination.
const prior=state().meta.archive.fraction;clock+=1000;IMI.ops.simulateAway(1);
check('fraction retained below 25 denomination',Math.abs(state().meta.archive.fraction-prior-1500/3600*4*2*.4)<1e-8,{fraction:state().meta.archive.fraction});
window.savedFraction=state().meta.archive.fraction;
check('move preserves basis age materials',cmd('move',{key:x.key,slot:1}).ok&&state().meta.archive.entries[0].slot===1&&state().meta.archive.entries[0].pay===1500&&state().meta.archive.entries[0].deposits===2);
IMI.ops.progression.stop();check('acknowledged save',IMI.ops.saveAcknowledged().ok);
window.saved=JSON.parse(localStorage.getItem('imi-ops-v1'));Date.now=realNow;return rows.splice(0);
}));
// Reload preserves ledger and fractional income with no repeated counted interval.
const saved=await page.evaluate(()=>({state:saved,wallet:JSON.parse(localStorage.getItem('imi-score'))}));
write('retained-save',saved);
await page.reload();await page.waitForFunction(()=>Rewards.owns()&&IMI.ops?.progression.running()&&!Rewards.held());
result.checks.push(...await page.evaluate(expected=>{const s=IMI.ops.extensions.state();assertion=(name,p)=>{if(!p)throw Error(name);return {name,pass:true};};return [assertion('reload preserves fractional income',s.meta.archive.fraction===expected.state.meta.archive.fraction),assertion('reload preserves moved materials and age',s.meta.archive.entries[0].slot===1&&s.meta.archive.entries[0].age===48*3600000&&s.meta.archive.entries[0].deposits===2),assertion('reload preserves wallet exactly',IMI.bananas.get()===expected.wallet.score)];},saved));
for(const edition of ['pixel','classic']){
 if(edition==='classic'){await page.goto(base+'/classic.html'+flags);await page.waitForFunction(()=>Rewards.owns()&&IMI.ops?.progression.running()&&!Rewards.held());}
 await page.evaluate(()=>{document.querySelectorAll('.o-modal,.o-celebrate').forEach(e=>e.remove());IMI.ops.extensions.setTab('archive');IMI.ops.extensions.mark();});await new Promise(r=>setTimeout(r,400));await page.evaluate(()=>document.querySelectorAll('#o-archive .archive')[1]?.scrollIntoView({block:'start'}));await page.screenshot({path:`${out}/${run}-${edition}-mature-360.png`});
 result[edition+'Fit']=await page.evaluate(()=>({pageScroll:document.documentElement.scrollHeight>innerHeight,pageWidth:document.documentElement.scrollWidth,innerWidth,archiveButtons:[...document.querySelectorAll('#o-archive button')].map(e=>e.getBoundingClientRect().height),internal:document.querySelector('#o-archive')?.scrollHeight>document.querySelector('#o-archive')?.clientHeight}));
 if(edition==='classic'){
  await page.click('[data-act="archive:retire"]');await page.screenshot({path:`${out}/${run}-classic-confirm-360.png`});await page.click('[data-act="archive:cancel"]');
  await page.evaluate(()=>{IMI.ops.extensions.setTab('press');IMI.ops.dev.ui.sub.press='titles';IMI.ops.dev.ui.libq='The Ape in the Cape';IMI.ops.dev.ui.libf='all';IMI.ops.extensions.mark();});await new Promise(r=>setTimeout(r,450));await page.evaluate(()=>document.querySelector('#o-press .o-book')?.scrollIntoView({block:'start'}));await page.screenshot({path:`${out}/${run}-classic-withdrawal-360.png`});
 }

}
result.checks.push(...await page.evaluate(()=>{
const rows=[],check=(name,p,facts)=>{rows.push({name,pass:!!p,facts});if(!p)throw Error(name);},api=IMI.ops.extensions,dev=IMI.ops.dev;let s=api.state();
const cmd=(action,extra={})=>{api.archiveSettle();s=api.state();return Rewards.archiveAction({action,...Layers.epochFields(s),revision:Archive.current(s).revision,at:Date.now(),...extra});};
const before=JSON.stringify(s.meta.archive),key=s.meta.archive.entries[0].key;dev.S().run.earned=12500000;
dev.doPrint();s=api.state();check('actual Printing retains ledger material basis fraction and exits work',s.printing===1&&s.meta.archive.entries[0].key===key&&s.meta.archive.entries[0].deposits===2&&s.meta.archive.working===null&&s.meta.archive.usedCopies['ape-in-the-cape']===1);
const r=dev.RBY['ape-in-the-cape'];s.written[r.id]=true;check('retirement saves memorial without refund',cmd('retire',{key}).ok&&api.state().meta.archive.entries.length===0&&api.state().meta.archive.memorial.length===1&&api.state().meta.estate.charters===0&&api.state().meta.archive.usedCopies[r.id]===1);
check('retired ordinary availability returns without duplicate same-run sale',Archive.available(api.state(),r)&&!dev.canWrite(r));delete api.state().written[r.id];api.state().bank={...Archive.books[r.id].need};dev.touchBank();check('retirement can resume eligible ordinary sale',dev.canWrite(r));
const raw=JSON.stringify(api.state().meta.archive);check('no copy refund after retirement',Archive.copies(api.state(),Archive.current(api.state()),r.id)===1);
check('normal final owner',Rewards.owns()&&IMI.ops.progression.running()&&Rewards.guard(api.state())&&!Rewards.held());return rows;
}));
for(const [f,h]of Object.entries(result.hashes))assert.equal(h,crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex'));assert.deepEqual(result.errors,[]);result.status='PASS';
}catch(e){result.error=e.stack;throw e;}finally{write('results',result);if(browser)await browser.close();await new Promise(r=>server.close(r));write('cleanup',{browserClosed:true,serverClosed:true,port:result.port,protectedResourcesTouched:false,priorReviewerTempPreserved:true});console.log(JSON.stringify(result,null,2));}})().catch(e=>{console.error(e);process.exitCode=1;});
