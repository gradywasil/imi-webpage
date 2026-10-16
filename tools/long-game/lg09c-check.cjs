const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const pp=require('C:/Users/arran/pp/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js');
const root=process.cwd(),out='docs/plan/long-game/evidence/LG-09/first-play-r1',run=process.argv[2]||'main';
const write=(n,v)=>fs.writeFileSync(`${out}/${run}-${n}.json`,JSON.stringify(v,null,2),{flag:'wx'});
const fixture=JSON.parse(fs.readFileSync('docs/plan/long-game/evidence/LG-08/archive-r1/main-retained-save.json'));
const s=fixture.state,at=Date.now();s.lastSeen=at;s.challenge=null;s.offers=[];s.pitches=[];s.written={};s.bank={};s.printing=3;s.meta.estate.count=3;s.meta.archive.working=null;
s.meta.archive.entries[0].born=at-48*3600000;s.meta.archive.entries[0].age=48*3600000;
s.meta.archive.entries[1]={...s.meta.archive.entries[0],key:2,slot:0,title:'midsummer-chimp',pay:3000000};
s.meta.archive.usedCopies['midsummer-chimp']=1;s.meta.archive.through=at;s.meta.folio.working=false;s.pub={tier:3,on:true,rule:'any'};s.focus=null;s.autoFocus=false;
s.desks.forEach((d,i)=>{d.owned=i<2;d.paws=0;d.crew=[];d.letters=Object.fromEntries([...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].map(ch=>[ch,1000]));d.tray=[];d.keeper.on=true;for(const k of ['practice','stock','ink','vowel','ribbon'])d.up[k]=0;});
const server=http.createServer((req,res)=>{const f=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);if(!f.startsWith(root+path.sep))return res.writeHead(403).end();fs.readFile(f,(e,b)=>{res.writeHead(e?404:200,{'Content-Type':({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2'})[path.extname(f)]||'application/octet-stream','Cache-Control':'no-store'});res.end(e?'missing':b);});});
const helpers=()=>{
 window.rows=[];window.state=()=>IMI.ops.extensions.state();
 window.check=(name,pass,facts)=>{rows.push({name,pass:!!pass,facts});if(!pass)throw Error(name+': '+JSON.stringify(facts));};
 window.request=action=>({action,...Layers.epochFields(state()),content:WorksPlay.identity,expected:WorksPlay.snapshot(state())});window.cmd=action=>Rewards.worksPlayAction(request(action));
 window.total=()=>state().desks.reduce((n,d)=>n+Object.values(d.letters).reduce((a,b)=>a+b,0),0)+(state().meta.works?.trays.reduce((n,p)=>n+Object.values(p).reduce((a,b)=>a+b,0),0)||0);
 window.typed=(ch,auto=true,i=0)=>{const freq=IMI.ops.dev.layerFrequency(),entries=Object.entries(freq),sum=Object.values(freq).reduce((a,b)=>a+b,0);let before=0;for(const [c,n]of entries){if(c===ch){fixtureRand=(before+n/2)/sum;break;}before+=n;}IMI.ops.dev.press(i,auto);};
 document.querySelectorAll('.o-modal,.o-celebrate').forEach(e=>e.remove());
};
(async()=>{let browser;const result={status:'UNVERIFIED',checks:[],errors:[],hashes:{},fixture:'Accepted Archive save with controlled eligible gate and ordinary hoard. Controlled RNG drives real press. Near-finish prefix is SEEDED, not evidence of 99,000 natural generated letters.'};try{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));result.port=server.address().port;assert(![8000,8354,8356,8358,8397].includes(result.port));
 browser=await pp.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});const page=await browser.newPage();await page.evaluateOnNewDocument(()=>{Math.random=()=>window.fixtureRand??.5;});
 await page.setViewport({width:360,height:560,isMobile:true,deviceScaleFactor:1});await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);await page.setBypassServiceWorker(true);await page.setCacheEnabled(false);
 page.on('pageerror',e=>result.errors.push(e.stack||e.message));page.on('response',async r=>{const f=new URL(r.url()).pathname.slice(1);if(['works.js','works-play.js','ops.js','rewards.js','layers.js','folio.js','archive.js'].includes(f))result.hashes[f]=crypto.createHash('sha256').update(await r.buffer()).digest('hex');});
 const base=`http://127.0.0.1:${result.port}`,flags='?lg01a=1&lg05folio=1&lg05layers=1&lg08estate=1&lg08archive=1&lg09works=1&lg09demo=1#play';
 const seed=await page.evaluateOnNewDocument(f=>{localStorage.setItem('imi-ops-v1',JSON.stringify(f.state));localStorage.setItem('imi-score',JSON.stringify(f.wallet));localStorage.setItem('imi-sound','off');localStorage.setItem('imi-fx','low');localStorage.setItem('imi-tour',JSON.stringify({version:2,done:true,tipsOff:true}));Math.random=()=>window.fixtureRand??.5;},fixture);
 await page.goto(base+'/index.html'+flags);await page.removeScriptToEvaluateOnNewDocument(seed.identifier);await page.waitForFunction(()=>window.Rewards?.owns()&&IMI.ops?.progression.running()&&!Rewards.held(),{timeout:15000});await page.evaluate(helpers);
 const capture=async(ed,stage)=>{
   await page.evaluate(()=>{document.querySelectorAll('.o-modal,.o-celebrate').forEach(e=>e.remove());IMI.ops.extensions.setTab('works-play');IMI.ops.extensions.mark();});await new Promise(r=>setTimeout(r,350));
   await page.evaluate(()=>{document.querySelector('#o-works-play').scrollTop=0;});await page.screenshot({path:`${out}/${run}-${ed}-${stage}-360.png`});
   result[`${ed}-${stage}-fit`]=await page.evaluate(()=>{const p=document.querySelector('#o-works-play');return {active:!p.hidden,pageScroll:document.documentElement.scrollHeight>innerHeight,pageWidth:document.documentElement.scrollWidth,innerWidth,paneHeight:p.clientHeight,paneScroll:p.scrollHeight,buttons:[...p.querySelectorAll('button')].map(e=>({text:e.textContent,height:e.getBoundingClientRect().height}))};});
   if(stage==='playbill'){await page.locator('[data-act="works-play:continue"]').scroll();await page.screenshot({path:`${out}/${run}-${ed}-playbill-continue-360.png`});result[`${ed}-continue-visible`]=await page.evaluate(()=>{const r=document.querySelector('[data-act="works-play:continue"]').getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight&&r.height>=40;});}
 };
 result.checks.push(...await page.evaluate(()=>{
 check('normal owner preview has no eager works',Rewards.owns()&&Rewards.guard(state())&&!state().meta.works&&WorksPlay.factor(state())===1);
 IMI.ops.simulateAway(1);check('pre-introduction away settled',!state().rewards.awayCheckpoint&&!state().meta.archive.pending);
 const n=total();check('acknowledged introduction empty fresh trays',cmd('introduce').ok&&state().meta.works.index===0&&state().meta.works.trays.every(p=>!Object.keys(p).length));state().meta.works.future='preserve';
 check('hoard funds exactly first edition then fresh stalls',cmd('work').ok&&state().meta.works.index===200&&n-total()===1000);
 check('keeper Publisher pause retain settings',state().pub.on&&state().desks[0].keeper.on&&IMI.ops.dev.pubStatus().includes('paused'));
 const bank=JSON.stringify(state().bank);IMI.ops.dev.keeperStep(state().desks[0],0);IMI.ops.dev.pubSell();check('actual keeper Publisher paused',JSON.stringify(state().bank)===bank);
 check('Folio work conflict',!Rewards.folioAction({action:'work',...Layers.epochFields(state()),expected:state().meta.folio}).ok);
 check('Archive work conflict',!Rewards.archiveAction({action:'work',key:state().meta.archive.entries[0].key,...Layers.epochFields(state()),revision:Archive.current(state()).revision,at:Date.now()}).ok);
 const dr={action:'introduce',...Layers.epochFields(state()),content:WorksDemo.identity,expected:WorksDemo.snapshot(state())};check('demo introduction cannot cross active consumer',!Rewards.worksDemoAction(dr).ok&&!state().meta.worksDemo);
 const before=total();typed('L',false);typed('A',true,1);check('real manual and auto output reserved once on producing desk',total()===before+2&&state().meta.works.trays[0].L===1&&state().meta.works.trays[1].A===1&&state().meta.works.index===200);
 const trays=JSON.stringify(state().meta.works.trays);IMI.ops.perk('coconut',[0,0]);check('nongeneration grant ordinary',JSON.stringify(state().meta.works.trays)===trays);
 const b=total();for(const ch of 'NNTERS')typed(ch);check('actual generation consumes fresh first word conservatively',state().meta.works.index===201&&total()===b+6-8);
 typed('L',true,1);check('progress save ACK',IMI.ops.saveAcknowledged().ok);return rows.splice(0);
 }));
 await capture('pixel','work');
 await page.reload();await page.waitForFunction(()=>Rewards.owns()&&IMI.ops?.progression.running()&&!Rewards.held(),{timeout:15000});await page.evaluate(helpers);
 result.checks.push(...await page.evaluate(()=>{
 check('reload retains prefix tray unknown field',state().meta.works.index===201&&state().meta.works.future==='preserve'&&state().meta.works.trays[1].L===1);
 const before=total();check('pause retains stock',cmd('pause').ok&&total()===before);check('release once returns ordinary stock',cmd('release').ok&&total()===before&&state().meta.works.trays.every(p=>!Object.keys(p).length));const ordinary=JSON.stringify(state().desks.map(d=>d.letters));check('release twice no duplicate',cmd('release').ok&&JSON.stringify(state().desks.map(d=>d.letters))===ordinary);check('released stock cannot advance fresh prefix',cmd('work').ok&&state().meta.works.index===201);
 // Controlled actual offline crew production. Existing speed/cap/efficiency path is unchanged.
 const d=state().desks[0];d.paws=1;d.crew=[];window.clock=Date.now();window.realNow=Date.now;Date.now=()=>clock;state().meta.archive.through=clock;clock+=60000;
 const old={total:total(),index:state().meta.works.index,by:{...state().stats.byLetter}};const rep=IMI.ops.simulateAway(60);const actual=Object.entries(state().stats.byLetter).reduce((n,[ch,v])=>n+v-(old.by[ch]||0),0);const consumed=WorksPlay.manifest.orderedTokens.slice(old.index%200,state().meta.works.index%200).join('').length;
 check('offline actual per-character output conserved',!!rep&&rep.counted===60&&!state().rewards.awayCheckpoint&&total()-old.total===actual-consumed,{rep,actual,consumed});Date.now=realNow;state().desks[0].paws=0;state().desks[0].crew=[];
 // Seeded prefix is explicitly NOT a naturally generated 99k completion claim.
 state().meta.works.index=19999;state().meta.works.trays=state().desks.map(()=>({}));state().meta.works.working=true;
 window.beforeSign={roy:IMI.ops.dev.royBase(),div:IMI.ops.dev.divBase(),hold:IMI.ops.dev.holdRate(state().desks[0]),archive:Archive.current(state()).entries.map(e=>e.pay),awards:JSON.stringify(state().awards),claims:JSON.stringify(state().rewards.claims),prem:JSON.stringify(state().prem)};
 for(const ch of 'QUEE')typed(ch);check('last word waits for genuine final N',state().meta.works.index===19999&&!state().meta.works.signed&&WorksPlay.factor(state())===1);check('save near-finish ACK',IMI.ops.saveAcknowledged().ok);return rows.splice(0);
 }));
 // Save both editions' real work state before final output.
 await page.goto(base+'/classic.html'+flags);await page.waitForFunction(()=>Rewards.owns()&&IMI.ops?.progression.running()&&!Rewards.held(),{timeout:15000});await page.evaluate(helpers);await capture('classic','work');
 result.checks.push(...await page.evaluate(()=>{typed('N');check('real final output unlocks manual unsigned signature',state().meta.works.index===20000&&!state().meta.works.working&&!state().meta.works.signed&&WorksPlay.factor(state())===1);check('complete unsigned save ACK',IMI.ops.saveAcknowledged().ok);return rows.splice(0);}));
 await capture('classic','signature');
 await page.goto(base+'/index.html'+flags);await page.waitForFunction(()=>Rewards.owns()&&IMI.ops?.progression.running()&&!Rewards.held(),{timeout:15000});await page.evaluate(helpers);await capture('pixel','signature');
 result.checks.push(...await page.evaluate(()=>{
 const d=state().desks[0];d.paws=1;d.crew=[{name:'Fixture',trait:'speedy',look:'speedy',xp:0,talent:0,coach:0}];window.basisBefore={auto:IMI.ops.dev.autoRate(d),hold:IMI.ops.dev.holdRate(d),roy:IMI.ops.dev.royBase(),div:IMI.ops.dev.divBase(),archive:Archive.current(state())};
 const proto=Storage.prototype,original=proto.setItem;let inject=true;proto.setItem=function(k,v){if(k==='imi-ops-v1'&&inject&&JSON.parse(v).meta.works?.signed){inject=false;throw Error('LG09C injected signature candidate save failure');}return original.call(this,k,v);};
 window.signatureHistory=JSON.stringify([state().awards,state().rewards.claims,state().prem]);window.stale=request('sign');check('signature failed ACK leaves unsigned unboosted',!Rewards.worksPlayAction(stale).ok&&!state().meta.works.signed&&!state().meta.works.signature&&!state().meta.works.playbill&&WorksPlay.factor(state())===1&&!IMI.ops.progression.running());proto.setItem=original;
 check('exact Retry signs once receipt Playbill benefit together',Rewards.retry()&&state().meta.works.signed&&state().meta.works.signature.claimId==='works:midsummer-chimp:first'&&state().meta.works.playbill.number===1&&WorksPlay.factor(state())===1.01);
 check('actual automatic rate factor1.01 manual income unchanged',Math.abs(IMI.ops.dev.autoRate(state().desks[0])/basisBefore.auto-1.01)<1e-12&&IMI.ops.dev.holdRate(state().desks[0])===basisBefore.hold&&IMI.ops.dev.royBase()===basisBefore.roy&&IMI.ops.dev.divBase()===basisBefore.div,{before:basisBefore.auto,after:IMI.ops.dev.autoRate(state().desks[0])});
 check('signature grants no generic reward currency or award',JSON.stringify([state().awards,state().rewards.claims,state().prem])===signatureHistory);const raw=JSON.stringify(state().meta.works);check('copied double sign refused',!Rewards.worksPlayAction(stale).ok&&JSON.stringify(state().meta.works)===raw);check('fresh repeated sign and reintroduction refused',!cmd('sign').ok&&!cmd('introduce').ok&&JSON.stringify(state().meta.works)===raw);check('Retry again no replay',Rewards.retry()&&JSON.stringify(state().meta.works)===raw);
 state().desks[0].paws=0;state().desks[0].crew=[];check('signed save acknowledged',IMI.ops.saveAcknowledged().ok);return rows.splice(0);
 }));
 await capture('pixel','playbill');
 await page.goto(base+'/classic.html'+flags);await page.waitForFunction(()=>Rewards.owns()&&IMI.ops?.progression.running()&&!Rewards.held(),{timeout:15000});await page.evaluate(helpers);await capture('classic','playbill');await page.click('[data-act="works-play:continue"]');result.continueAction=await page.evaluate(()=>!document.querySelector('#o-floor').hidden);
 result.checks.push(...await page.evaluate(()=>{
 const raw=JSON.stringify(state().meta.works);check('signed reload no replay stable receipt benefit',WorksPlay.factor(state())===1.01&&!cmd('sign').ok&&JSON.stringify(state().meta.works)===raw);
 state().run.earned=12500000;const printing=state().printing;IMI.ops.dev.doPrint();check('actual Printing retains signed receipt Playbill boost exits work',state().printing===printing+1&&JSON.stringify(state().meta.works)===raw&&!state().meta.works.working&&WorksPlay.factor(state())===1.01);
 check('final normal owner',Rewards.owns()&&Rewards.guard(state())&&IMI.ops.progression.running()&&!Rewards.held());return rows.splice(0);
 }));
 await page.reload();await page.waitForFunction(()=>Rewards.owns()&&IMI.ops?.progression.running()&&!Rewards.held(),{timeout:15000});await page.evaluate(helpers);
 result.checks.push(...await page.evaluate(()=>{check('Printing reload retains signed benefit',state().printing===4&&WorksPlay.factor(state())===1.01&&state().meta.works.playbill.number===1&&!cmd('sign').ok);return rows.splice(0);}));
 write('final-save',await page.evaluate(()=>({state:state(),wallet:JSON.parse(localStorage.getItem('imi-score'))})));
 for(const [f,h]of Object.entries(result.hashes))assert.equal(h,crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex'));assert(result.checks.every(c=>c.pass));assert.deepEqual(result.errors,[]);result.status='PASS';
 }catch(e){result.error=e.stack;throw e;}finally{write('results',result);if(browser)await browser.close();await new Promise(r=>server.close(r));write('cleanup',{browserClosed:true,serverClosed:true,port:result.port,protectedResourcesTouched:false,priorTempPreserved:true});console.log(JSON.stringify(result,null,2));}})().catch(e=>{console.error(e);process.exitCode=1;});
