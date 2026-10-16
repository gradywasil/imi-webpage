const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const pp=require('C:/Users/arran/pp/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js');
const root=process.cwd(),out='docs/plan/long-game/evidence/LG-09/anthology-r1',run=process.argv[2]||'main';
const write=(n,v)=>fs.writeFileSync(`${out}/${run}-${n}.json`,JSON.stringify(v,null,2),{flag:'wx'});
const fixture=JSON.parse(fs.readFileSync('docs/plan/long-game/evidence/LG-09/first-play-r1/corrected-final-save.json'));
const server=http.createServer((req,res)=>{const f=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);if(!f.startsWith(root+path.sep))return res.writeHead(403).end();fs.readFile(f,(e,b)=>{res.writeHead(e?404:200,{'Content-Type':({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2'})[path.extname(f)]||'application/octet-stream','Cache-Control':'no-store'});res.end(e?'missing':b);});});
const helpers=()=>{
 window.rows=[];window.state=()=>IMI.ops.extensions.state();
 window.check=(name,pass,facts)=>{rows.push({name,pass:!!pass,facts});if(!pass)throw Error(name+': '+JSON.stringify(facts));};
 window.request=action=>({action,...Layers.epochFields(state()),content:WorksPlay.commandContent(state(),action),expected:WorksPlay.snapshot(state())});window.cmd=action=>Rewards.worksPlayAction(request(action));
 window.total=()=>state().desks.reduce((n,d)=>n+Object.values(d.letters).reduce((a,b)=>a+b,0),0)+(state().meta.works?.trays.reduce((n,p)=>n+Object.values(p).reduce((a,b)=>a+b,0),0)||0);
 window.typed=(ch,auto=true,i=0)=>{const freq=IMI.ops.dev.layerFrequency(),entries=Object.entries(freq),sum=Object.values(freq).reduce((a,b)=>a+b,0);let before=0;for(const [c,n]of entries){if(c===ch){fixtureRand=(before+n/2)/sum;break;}before+=n;}IMI.ops.dev.press(i,auto);};
 document.querySelectorAll('.o-modal,.o-celebrate').forEach(e=>e.remove());
};
(async()=>{let browser;const result={status:'UNVERIFIED',checks:[],errors:[],hashes:{},fixture:'Existing accepted first signed save. Unsigned compatibility and each near-finish prefix are CONTROLLED FIXTURES. Each final word uses actual press output and every new introduction/signature uses the actual acknowledged owner. No natural693k acquisition claim.'};try{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));result.port=server.address().port;assert(![8000,8354,8356,8358,8397].includes(result.port));
 browser=await pp.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});const page=await browser.newPage();await page.evaluateOnNewDocument(()=>{Math.random=()=>window.fixtureRand??.5;});
 await page.setViewport({width:360,height:560,isMobile:true,deviceScaleFactor:1});await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);await page.setBypassServiceWorker(true);await page.setCacheEnabled(false);
 page.on('pageerror',e=>result.errors.push(e.stack||e.message));page.on('response',async r=>{const f=new URL(r.url()).pathname.slice(1);if(['works.js','works-catalogue.js','works-play.js','ops.js','rewards.js','layers.js','folio.js','archive.js'].includes(f))result.hashes[f]=crypto.createHash('sha256').update(await r.buffer()).digest('hex');});
 const base=`http://127.0.0.1:${result.port}`,flags='?lg01a=1&lg05folio=1&lg05layers=1&lg08estate=1&lg08archive=1&lg09works=1&lg09demo=1#play';
 const ready=async()=>{await page.waitForFunction(()=>window.Rewards?.owns()&&IMI.ops?.progression.running()&&!Rewards.held(),{timeout:15000});await page.evaluate(helpers);};
 const prepare=f=>{f.state.lastSeen=Date.now();f.state.challenge=null;f.state.meta.folio.working=false;f.state.meta.archive.working=null;f.state.focus=null;f.state.autoFocus=false;f.state.desks.forEach((d,i)=>{d.owned=i<2;d.paws=0;d.crew=[];d.keeper.on=false;d.letters=Object.fromEntries([...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].map(c=>[c,100000]));d.tray=[];for(const k of ['practice','stock','ink','vowel','ribbon'])d.up[k]=0;});return f;};
 const load=async(f,tag)=>{const seed=await page.evaluateOnNewDocument(f=>{localStorage.setItem('imi-ops-v1',JSON.stringify(f.state));localStorage.setItem('imi-score',JSON.stringify(f.wallet));localStorage.setItem('imi-sound','off');localStorage.setItem('imi-fx','low');localStorage.setItem('imi-tour',JSON.stringify({version:2,done:true,tipsOff:true}));},f);await page.goto(base+'/index.html'+flags.replace('#play','&fixture='+tag+'#play'));await page.removeScriptToEvaluateOnNewDocument(seed.identifier);await ready();};
 const capture=async(ed,stage,scroll)=>{
   await page.evaluate(()=>{document.querySelectorAll('.o-modal,.o-celebrate').forEach(e=>e.remove());IMI.ops.extensions.setTab('works-play');IMI.ops.extensions.mark();});await new Promise(r=>setTimeout(r,350));
   await page.evaluate(()=>document.querySelector('#o-works-play').scrollTop=0);
   if(scroll)await page.evaluate(sel=>{const el=document.querySelector(sel);el.scrollIntoView({block:'center'});},scroll);
   await page.screenshot({path:`${out}/${run}-${ed}-${stage}-360.png`});
   result[`${ed}-${stage}-fit`]=await page.evaluate(()=>{const p=document.querySelector('#o-works-play');return {active:!p.hidden,pageScroll:document.documentElement.scrollHeight>innerHeight,pageWidth:document.documentElement.scrollWidth,innerWidth,paneHeight:p.clientHeight,paneScroll:p.scrollHeight,buttons:[...p.querySelectorAll('button')].map(e=>({text:e.textContent,height:e.getBoundingClientRect().height}))};});
 };
 const unsigned=prepare(JSON.parse(JSON.stringify(fixture)));Object.assign(unsigned.state.meta.works,{signed:false,signature:null,playbill:null,index:201,working:false,trays:unsigned.state.desks.map((_,i)=>i?{L:1}:{})});unsigned.state.meta.works.future={compatibility:'keep unsigned'};
 await load(unsigned,'unsigned');
 result.checks.push(...await page.evaluate(expected=>{check('old unsigned loads exact prefix trays identity unknown fields without anthology',JSON.stringify(state().meta.works)===JSON.stringify(expected)&&!state().meta.works.anthology);check('old unsigned resumes exact prefix and trays',cmd('work').ok&&state().meta.works.index===201&&state().meta.works.trays[1].L===1);check('old unsigned pause save ACK',cmd('pause').ok&&IMI.ops.saveAcknowledged().ok);return rows.splice(0);},unsigned.state.meta.works));
 const signed=prepare(JSON.parse(JSON.stringify(fixture)));signed.state.meta.works.future={compatibility:'keep signed'};signed.state.meta.estate.count=0;
 await load(signed,'signed');
 result.checks.push(...await page.evaluate(expected=>{check('old signed loads exact root receipt unknowns factor1.01 without migration',JSON.stringify(state().meta.works)===JSON.stringify(expected)&&WorksPlay.factor(state())===1.01&&!state().meta.works.anthology);window.firstFixed=JSON.stringify(state().meta.works);check('old signed refuses replay',!cmd('sign').ok);check('signed root save ACK',IMI.ops.saveAcknowledged().ok);return rows.splice(0);},signed.state.meta.works));
 await capture('pixel','next-introduction', '[data-act="works-play:introduce"]');
 await page.goto(base+'/classic.html'+flags);await ready();await capture('classic','next-introduction','[data-act="works-play:introduce"]');
 result.checks.push(...await page.evaluate(()=>{
 window.firstFixed=JSON.stringify(state().meta.works);window.rootFields=()=>{const {anthology,...root}=state().meta.works;return JSON.stringify(root);};
 const target=WorksCatalogue().plays[2].manifest;check('skip next introduction refused',!Rewards.worksPlayAction({...request('introduce'),content:JSON.stringify(target)}).ok&&!state().meta.works.anthology);
 check('real next introduction honors retained unlock after gate loss empty trays',cmd('introduce').ok&&WorksPlay.current(state()).index===0&&WorksPlay.current(state()).trays.every(t=>!Object.keys(t).length)&&rootFields()===firstFixed);
 check('cannot introduce another unsigned play',!cmd('introduce').ok&&Object.keys(state().meta.works.anthology.plays).length===1);
 const before=total();check('ordinary hoard funds first1000 only',cmd('work').ok&&WorksPlay.current(state()).index===200&&before-total()===1000);check('ordinary stock cannot prefund fresh edition',cmd('advance').ok&&WorksPlay.current(state()).index===200);
 const d={action:'introduce',...Layers.epochFields(state()),content:WorksDemo.identity,expected:WorksDemo.snapshot(state())};check('demo cannot start alongside later play',!Rewards.worksDemoAction(d).ok&&!state().meta.worksDemo);
 const n=total();for(const ch of 'PROSPER')typed(ch);check('fresh whole word waits for second O',WorksPlay.current(state()).index===200);typed('O');check('actual fresh output completes later first word with conservation',WorksPlay.current(state()).index===201&&total()===n);
 const trays=JSON.stringify(WorksPlay.current(state()).trays);IMI.ops.perk('coconut',[0,0]);check('generic grant remains ordinary',JSON.stringify(WorksPlay.current(state()).trays)===trays);
 check('later work saved',IMI.ops.saveAcknowledged().ok);return rows.splice(0);
 }));
 await capture('classic','later-work');await page.goto(base+'/index.html'+flags);await ready();await capture('pixel','later-work');
 result.checks.push(...await page.evaluate(()=>{
 window.firstFixed=JSON.stringify((({anthology,...root})=>root)(state().meta.works));
 window.rootFields=()=>JSON.stringify((({anthology,...root})=>root)(state().meta.works));
 check('later material boundary persists on reload',WorksPlay.current(state()).index===201&&WorksPlay.factor(state())===1.01);
 for(let i=0;i<6;i++){
   const p=WorksCatalogue().plays[i],id=p.manifest.playId;if(i)check('manual ordered introduction '+id,cmd('introduce').ok&&WorksPlay.current(state()).content===JSON.stringify(p.manifest)&&WorksPlay.current(state()).trays.every(t=>!Object.keys(t).length));
   const w=state().meta.works.anthology.plays[id];
   // Labelled near-finish fixture. Previous consumed words are seeded, never claimed as naturally acquired.
   Object.assign(w,{index:19999,working:true,trays:state().desks.map(()=>({}))});
   const last=p.manifest.orderedTokens.at(-1),before=total();for(const ch of last.slice(0,-1))typed(ch);
   check('last word still incomplete '+id,WorksPlay.current(state()).index===19999&&!WorksPlay.current(state()).signed);
   typed(last.at(-1));check('real final word ready unsigned '+id,WorksPlay.current(state()).index===20000&&!WorksPlay.current(state()).working&&!WorksPlay.current(state()).signed&&total()===before);
   if(i===5)break;
   const old=JSON.stringify([state().awards,state().rewards.claims,state().prem]);
   check('real ordered signature '+id,cmd('sign').ok&&WorksPlay.current(state()).signed&&WorksPlay.factor(state())===1+(i+2)/100);
   check('exact receipt copy and immutable first root '+id,WorksPlay.current(state()).signature.receipt===JSON.stringify(p.descriptor)&&WorksPlay.current(state()).playbill.title===p.descriptor.copy.playbillTitle&&WorksPlay.current(state()).playbill.body===p.descriptor.copy.playbillBody&&rootFields()===firstFixed&&JSON.stringify([state().awards,state().rewards.claims,state().prem])===old);
   check('signature does not introduce next '+id,Object.keys(state().meta.works.anthology.plays).length===i+1&&!cmd('sign').ok);
 }
 check('six points and seventh ready without completion',WorksPlay.factor(state())===1.06&&!state().meta.works.anthology.completion&&!WorksPlay.current(state()).signed);
 const d=state().desks[0];d.paws=1;d.crew=[{name:'Fixture',trait:'speedy',look:'speedy',xp:0,talent:0,coach:0}];
 window.beforeRate={auto:IMI.ops.dev.autoRate(d),hold:IMI.ops.dev.holdRate(d),roy:IMI.ops.dev.royBase(),div:IMI.ops.dev.divBase()};
 const proto=Storage.prototype,original=proto.setItem;let inject=true;proto.setItem=function(k,v){if(k==='imi-ops-v1'&&inject&&JSON.parse(v).meta.works?.anthology?.completion){inject=false;throw Error('LG09E injected seventh signature ACK failure');}return original.call(this,k,v);};
 window.stale=request('sign');const raw=JSON.stringify(state().meta.works);check('seventh ACK failure leaves six points unsigned7 no marker receipt or Playbill7',!Rewards.worksPlayAction(stale).ok&&JSON.stringify(state().meta.works)===raw&&WorksPlay.factor(state())===1.06&&!WorksPlay.current(state()).signature&&!WorksPlay.current(state()).playbill&&!IMI.ops.progression.running());proto.setItem=original;
 check('exact Retry saves seventh signature receipt Playbill factor marker together',Rewards.retry()&&WorksPlay.current(state()).signed&&WorksPlay.current(state()).playbill.number===7&&WorksPlay.factor(state())===1.07&&state().meta.works.anthology.completion.completionId==='works:seven-adaptations:completion:v1');
 check('actual automatic rate1.07 once manual royalty division unchanged',Math.abs(IMI.ops.dev.autoRate(state().desks[0])/beforeRate.auto-1.07/1.06)<1e-12&&IMI.ops.dev.holdRate(state().desks[0])===beforeRate.hold&&IMI.ops.dev.royBase()===beforeRate.roy&&IMI.ops.dev.divBase()===beforeRate.div);
 const saved=JSON.stringify(state().meta.works);check('stale double signature Retry and eighth introduction cannot replay',!Rewards.worksPlayAction(stale).ok&&!cmd('sign').ok&&!cmd('introduce').ok&&Rewards.retry()&&JSON.stringify(state().meta.works)===saved);
 check('first root retained byte-equivalent logical JSON fields',rootFields()===firstFixed);
 state().desks[0].paws=0;state().desks[0].crew=[];check('all seven final save ACK',IMI.ops.saveAcknowledged().ok);return rows.splice(0);
 }));
 await capture('pixel','playbill7-continue','[data-act="works-play:continue"]');await capture('pixel','finish','[data-works-finish]');
 await page.goto(base+'/classic.html'+flags);await ready();await capture('classic','playbill7-continue','[data-act="works-play:continue"]');await capture('classic','finish','[data-works-finish]');
 await page.click('[data-act="works-play:continue"]');
 result.checks.push(...await page.evaluate(()=>{
 const raw=JSON.stringify(state().meta.works);check('Continue returns ordinary production without replay',!document.querySelector('#o-floor').hidden&&WorksPlay.factor(state())===1.07&&JSON.stringify(state().meta.works)===raw);
 check('reload retains all7 and completion exact receipt no replay',Object.values(state().meta.works.anthology.plays).every(w=>w.signed)&&!cmd('sign').ok&&JSON.stringify(state().meta.works)===raw);
 state().run.earned=12500000;const printing=state().printing;window.resetWorks=raw;IMI.ops.dev.doPrint();check('actual Printing retains all7 marker receipts first root exits work',state().printing===printing+1&&JSON.stringify(state().meta.works)===raw&&!WorksPlay.current(state()).working&&WorksPlay.factor(state())===1.07);
 check('normal final owner',Rewards.owns()&&Rewards.guard(state())&&IMI.ops.progression.running()&&!Rewards.held());return rows.splice(0);
 }));
 const saved=await page.evaluate(()=>JSON.stringify(state().meta.works));await page.reload();await ready();
 result.checks.push(...await page.evaluate(saved=>{check('actual reset reload retains exact anthology and cumulative factor',JSON.stringify(state().meta.works)===saved&&WorksPlay.factor(state())===1.07&&!cmd('introduce').ok);return rows.splice(0);},saved));
 write('final-save',await page.evaluate(()=>({state:state(),wallet:JSON.parse(localStorage.getItem('imi-score'))})));
 for(const [f,h]of Object.entries(result.hashes))assert.equal(h,crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex'));
 for(const [k,v]of Object.entries(result))if(k.endsWith('-fit')){assert(v.active&&!v.pageScroll&&v.pageWidth===v.innerWidth,k);assert(v.buttons.every(b=>b.height>=40),k);}
 assert(result.checks.every(c=>c.pass));assert.deepEqual(result.errors,[]);result.status='PASS';
 }catch(e){result.error=e.stack;throw e;}finally{write('results',result);if(browser)await browser.close();await new Promise(r=>server.close(r));write('cleanup',{browserClosed:true,serverClosed:true,port:result.port,protectedResourcesTouched:false,priorTempPreserved:true});console.log(JSON.stringify(result,null,2));}})().catch(e=>{console.error(e);process.exitCode=1;});
