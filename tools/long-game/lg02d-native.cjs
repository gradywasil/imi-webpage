const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),os=require('node:os'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const pp=require('C:/Users/arran/pp/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js');
const out=path.resolve('docs/plan/long-game/evidence/LG-02/free-lamp-r1'),root=process.cwd(),run=process.argv[2]||'main';
const write=(name,v)=>fs.writeFileSync(path.join(out,run+'-'+name+'.json'),JSON.stringify(v,null,2)+'\n',{flag:'wx'});
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const errors=[],sources={};
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'};
const server=http.createServer((req,res)=>{const url=new URL(req.url,'http://task');if(url.pathname==='/__lg02d_inert'){res.writeHead(200,{'Content-Type':'text/html','Cache-Control':'no-store'}).end('<!doctype html><title>LG02D inert planting document</title>');return;}const f=path.resolve(root,'.'+url.pathname);if(!f.startsWith(root+path.sep)){res.writeHead(403).end();return;}fs.readFile(f,(e,b)=>{res.writeHead(e?404:200,{'Content-Type':mime[path.extname(f)]||'application/octet-stream','Cache-Control':'no-store'});res.end(e?'missing':b);});});
(async()=>{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const port=server.address().port;assert(![8000,8354,8356,8358,8397].includes(port));
  const origin=`http://127.0.0.1:${port}`,profile=fs.mkdtempSync(path.join(os.tmpdir(),'lg02d-'+run+'-'));
  let browser;
  try{
    browser=await pp.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,userDataDir:profile});
    const [page]=await browser.pages();await page.setViewport({width:360,height:560,isMobile:true,deviceScaleFactor:1});
    await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
    await page.setBypassServiceWorker(true);
    page.on('pageerror',e=>{errors.push(e.message);console.log('PAGE ERROR',e.message);});
    page.on('response',async r=>{if(r.ok()&&/\.(js|html|css)$/.test(new URL(r.url()).pathname))sources[new URL(r.url()).pathname]=hash(await r.buffer());});
    await page.evaluateOnNewDocument(origin=>{window.__LG02_LAMP_TASK={origin};if(location.pathname!=='/__lg02d_inert')localStorage.setItem('imi-fx','low');},origin);
    await page.goto(origin+'/__lg02d_inert');
    const blank=await page.evaluate(async()=>({keys:Object.keys(localStorage),controller:navigator.serviceWorker.controller?.scriptURL||null,caches:await caches.keys()}));
    assert.deepEqual(blank.keys,[]);assert.deepEqual(blank.caches,[]);
    write('isolation-before-admission',{origin,serverPid:process.pid,root,port,browserPid:browser.process().pid,profile,browserArgs:browser.process().spawnargs,pages:(await browser.pages()).map(p=>p.url()),blank,networkBypassServiceWorker:true,externalSetup:'New ephemeral loopback listener and newly created task-only profile. One page; inert before each sequential game navigation.'});
    const flags='?lg01a=1&lg02=1&lg02lamp=1',edition=run.includes('classic')?'classic':'pixel',shell=edition==='classic'?'classic.html':'index.html';
    await page.goto(origin+'/'+shell+flags+'#play');
    await page.waitForFunction(()=>window.IMI?.ops?.extensions&&IMI.ops.progression.running());
    const fixture=await page.evaluate(undo=>{const s=JSON.parse(JSON.stringify(IMI.ops.extensions.state()));s.intro={done:true,train:true,words:true,shop:true};s.lamp=3;s.printing=1;s.chDone={vowel:true,haiku:true,hands:true,...(undo?{}:{timed:true})};s.awards=Object.fromEntries(IMI.ops.extensions.rewardAwards().map(r=>[r.id,true]));s.prem={};s.rewards={};s.stats.letters=100;s.daily={last:new Date().toDateString(),streak:1};s.lastSeen=Date.now();s.lg02dUnknown={preserve:'raw-root'};return s;},run.startsWith('undo'));
    await page.goto(origin+'/__lg02d_inert');
    await page.evaluate(s=>{localStorage.setItem('imi-ops-v1',JSON.stringify(s));localStorage.setItem('imi-score',JSON.stringify({economyVersion:1,score:0,lg02dUnknown:'wallet'}));},fixture);
    write('funding-fixture',{qualification:'Controlled prerequisites and historical earned rewards, not natural acquisition/pacing. All existing awards and the four existing challenge first clears plus first Printing; real Rewards migration/validation must acknowledge the named credits before purchase.',fixture});
    await page.goto(origin+'/'+shell+flags+'#play');
    await page.waitForFunction(()=>window.IMI?.ops?.extensions&&IMI.ops.progression.running()&&!Rewards.held());
    const funded=await page.evaluate(()=>({p:IMI.ops.extensions.state().prem,claims:IMI.ops.extensions.state().rewards.claims,marker:IMI.bananas.acknowledgement(),context:IMI.ops.extensions.vaultContext(),native:{reduce:IMI.reduceMotion,match:matchMedia('(prefers-reduced-motion: reduce)').matches,low:IMI.fx.low},cache:navigator.serviceWorker.controller?.scriptURL||null}));
    write('funded',funded);assert.equal(funded.p.earned,run.startsWith('undo')?100:109);assert.equal(funded.context.cap,57600);assert.equal(funded.context.eff,.7);
    if(run.startsWith('cap')){const old=await page.evaluate(()=>IMI.ops.simulateAway(20*3600));write('ordinary-cap',old);assert.equal(old.counted,16*3600);}
    await page.evaluate(()=>IMI.ops.extensions.setTab('vault'));
    await page.waitForSelector('[data-act="vault:review"]');
    write('pre-review-dom',await page.evaluate(()=>({screen:document.documentElement.dataset.screen,tab:IMI.ops.dev.ui.tab,pane:document.getElementById('o-vault')?.outerHTML,modals:[...document.querySelectorAll('.o-modal,.tour-bub')].map(x=>x.outerHTML),body:document.body.innerText})));
    await page.screenshot({path:path.join(out,run+'-pre-review.png')});await page.click('[data-act="vault:review"]');
    await page.waitForSelector('[data-act="vault:confirm"]');
    await page.screenshot({path:path.join(out,run+'-'+edition+'-review.png')});
    write('review-controls',await page.evaluate(()=>({focus:document.activeElement?.dataset.act,controls:[...document.querySelectorAll('.lg02d-lamp-review button')].map(el=>({action:el.dataset.act,height:el.getBoundingClientRect().height,width:el.getBoundingClientRect().width})),bounds:[document.documentElement.scrollWidth,document.documentElement.scrollHeight,innerWidth,innerHeight],paneScroll:[document.getElementById('o-vault').clientHeight,document.getElementById('o-vault').scrollHeight]})));
    await page.evaluate(()=>{document.getElementById('o-vault').scrollTop=0;});await page.screenshot({path:path.join(out,run+'-'+edition+'-review-top.png')});
    await page.keyboard.press('Escape');await page.waitForSelector('[data-act="vault:review"]');assert.equal(await page.evaluate(()=>document.activeElement?.dataset.act),'vault:review');
    await page.click('[data-act="vault:review"]');await page.waitForSelector('[data-act="vault:confirm"]');
    await page.click('[data-act="vault:confirm"]');
    await page.waitForFunction(()=>!!VaultPlay.pending(IMI.ops.extensions.state())||Rewards.held());
    const saved=await page.evaluate(()=>({state:IMI.ops.extensions.state(),raw:localStorage.getItem('imi-ops-v1'),held:Rewards.held(),context:IMI.ops.extensions.vaultContext()}));write('reservation',saved);
    assert.equal(saved.held,false);assert.equal(saved.state.prem.earned,run.startsWith('undo')?0:9);assert.equal(saved.context.cap,57600);assert.equal(saved.state.prem.vault.purchases['vault:1'].status,'undoable');
    await page.screenshot({path:path.join(out,run+'-'+edition+'-reserved.png')});
    if(run.startsWith('undo')){
      const delivered=await page.evaluate(()=>{const a=IMI.ops.extensions;a.state().chDone.timed=true;window.__OPS_EXTENSIONS.find(([id])=>id==='rewards')[1].challenge({id:'timed',first:true},a);return {earned:a.state().prem.earned,claim:a.state().rewards.claims['challenge:timed:first']};});write('new-earning-component',delivered);assert.equal(delivered.earned,9);
      await page.evaluate(()=>{const original=Storage.prototype.setItem;window.__failUndo=1;Storage.prototype.setItem=function(k,v){if(k==='imi-ops-v1'&&__failUndo&&JSON.parse(v).prem?.vault?.purchases?.['vault:1']?.status==='refunded'){__failUndo--;throw Error('LG02D actual refund storage failure');}return original.call(this,k,v);};});
      await page.click('[data-act="vault:undo"]');await page.waitForFunction(()=>Rewards.held());
      await new Promise(r=>setTimeout(r,10500));assert.equal(await page.evaluate(()=>Rewards.lampUndoable('vault:1')),false);
      await page.click('.o-writer-status button');await page.waitForFunction(()=>!Rewards.held());
      const undone=await page.evaluate(()=>({state:IMI.ops.extensions.state(),duplicate:Rewards.lampAction({kind:'refund',purchaseId:'vault:1'}),save:IMI.ops.saveAcknowledged()}));write('exact-refund-after-expiry',undone);assert.equal(undone.state.prem.earned,109);assert.equal(undone.state.prem.spentEarned,0);assert.equal(undone.state.prem.vault.purchases['vault:1'].status,'refunded');assert.equal(undone.state.prem.vault.nextSequence,2);assert.equal(undone.duplicate.duplicate,true);assert.equal(undone.save.ok,true);assert.deepEqual(errors,[]);write('sources-errors',{sources,errors});console.log(run+' exact pre-expiry Undo/current-progress Retry PASS');return;
    }else if(run.startsWith('failure')){
      await page.evaluate(()=>{IMI.ops.extensions.setTab('floor');IMI.ops.spawnGold(false);window.__heldGold=document.querySelector('.o-gold');window.__buffBefore=performance.now()+5000;IMI.ops.dev.buffs.snack=__buffBefore;const original=Storage.prototype.setItem;window.__failActivation=1;Storage.prototype.setItem=function(k,v){if(k==='imi-ops-v1'&&__failActivation&&JSON.parse(v).prem?.vault?.purchases?.['vault:1']?.status==='active'){__failActivation--;throw Error('LG02D actual activation storage failure');}return original.call(this,k,v);};});
      await new Promise(r=>setTimeout(r,4200));
      assert.equal(await page.evaluate(()=>{IMI.ops.extensions.setTab('vault');return Rewards.lampAction({kind:'activate',purchaseId:'vault:1'});}),false);
      const held=await page.evaluate(()=>({state:IMI.ops.extensions.state(),cap:IMI.ops.extensions.vaultContext().cap,goldSame:__heldGold===document.querySelector('.o-gold'),connected:__heldGold?.isConnected,text:document.querySelector('.o-writer-status')?.textContent,buff:IMI.ops.dev.buffs.snack}));write('held',held);assert.equal(held.cap,57600);assert.equal(held.goldSame,true);assert.equal(held.connected,true);
      await page.screenshot({path:path.join(out,run+'-'+edition+'-held.png')});
      await new Promise(r=>setTimeout(r,5500));
      const frozen=await page.evaluate(()=>({same:__heldGold===document.querySelector('.o-gold'),connected:__heldGold?.isConnected,buff:IMI.ops.dev.buffs.snack,held:Rewards.held()}));write('held-after-expiry',frozen);assert.equal(frozen.same,true);assert.equal(frozen.connected,true);assert.equal(frozen.buff,held.buff);assert.equal(frozen.held,true);
      await page.click('.o-writer-status button');
      await page.waitForFunction(()=>!Rewards.held());
      write('held-recovered',await page.evaluate(()=>({same:__heldGold===document.querySelector('.o-gold'),connected:__heldGold?.isConnected,buffDelta:IMI.ops.dev.buffs.snack-__buffBefore,cap:IMI.ops.extensions.vaultContext().cap,duplicate:Rewards.lampAction({kind:'activate',purchaseId:'vault:1'})})));
    }else await page.click('[data-act="vault:keep"]');
    await page.waitForFunction(()=>IMI.ops.extensions.state().prem.vault.purchases['vault:1'].status==='active');
    const active=await page.evaluate(()=>{const save=IMI.ops.saveAcknowledged();return {state:IMI.ops.extensions.state(),context:IMI.ops.extensions.vaultContext(),save,marker:IMI.bananas.acknowledgement()};});write('active-save',active);assert.equal(active.save.ok,true);assert.equal(active.context.cap,86400);assert.equal(active.state.prem.spentEarned,100);assert.equal(active.state.lg02dUnknown.preserve,'raw-root');
    if(run.startsWith('cap')){
      const capped=await page.evaluate(()=>IMI.ops.simulateAway(30*3600));write('active-cap',capped);assert.equal(capped.counted,24*3600);
      const reset=await page.evaluate(()=>{const before=JSON.stringify(IMI.ops.extensions.state());IMI.ops.reset();return {unchanged:before===JSON.stringify(IMI.ops.extensions.state()),balance:IMI.bananas.get()};});write('reset-block',reset);assert.equal(reset.unchanged,true);
      const hidden=await page.evaluate(()=>Rewards.lampAction({kind:'settings',hideStore:true}));assert(hidden);await page.evaluate(()=>IMI.ops.extensions.setTab('vault'));await page.waitForFunction(()=>!document.querySelector('[data-act="vault:review"]'));write('hide-store',await page.evaluate(()=>({settings:IMI.ops.extensions.state().prem.vault.settings,cap:IMI.ops.extensions.vaultContext().cap,history:document.querySelector('#o-vault details')?.textContent})));assert.equal(await page.evaluate(()=>IMI.ops.saveAcknowledged().ok),true);
      const printing=await page.evaluate(()=>{IMI.ops.extensions.state().run.earned=12500000;IMI.ops.dev.doPrint();return {printing:IMI.ops.extensions.state().printing,lamp:IMI.ops.extensions.state().lamp,context:IMI.ops.extensions.vaultContext(),earned:IMI.ops.extensions.state().prem.earned,save:IMI.ops.saveAcknowledged()};});write('ordinary-printing-component',printing);assert.equal(printing.printing,2);assert.equal(printing.lamp,0);assert.equal(printing.context.cap,86400);assert.equal(printing.context.eff,.4);assert.equal(printing.earned,9);assert.equal(printing.save.ok,true);
    }
    await page.goto(origin+'/__lg02d_inert');await page.goto(origin+'/classic.html'+flags+'#play');
    await page.waitForFunction(()=>window.IMI?.ops?.extensions&&IMI.ops.progression.running()&&!Rewards.held());
    await page.evaluate(()=>IMI.ops.extensions.setTab('vault'));
    const reloaded=await page.evaluate(()=>({state:IMI.ops.extensions.state(),context:IMI.ops.extensions.vaultContext(),native:{reduce:IMI.reduceMotion,low:IMI.fx.low},bounds:[document.documentElement.scrollWidth,document.documentElement.scrollHeight,innerWidth,innerHeight]}));write('classic-reload',reloaded);assert.equal(reloaded.context.cap,86400);assert.equal(reloaded.state.prem.earned,9);await page.screenshot({path:path.join(out,run+'-classic-active.png')});
    if(run.startsWith('cap')){
      await page.goto(origin+'/__lg02d_inert');const raw=await page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('imi-ops-v1'));s.prem.vault.freeLamp.rule=99;const raw=JSON.stringify(s);localStorage.setItem('imi-ops-v1',raw);return {ops:raw,wallet:localStorage.getItem('imi-score')};});
      await page.goto(origin+'/classic.html'+flags+'#play');const blocked=await page.evaluate(()=>({blocked:VaultSaveGate.blocked,imi:!!window.IMI,ops:localStorage.getItem('imi-ops-v1'),wallet:localStorage.getItem('imi-score')}));write('unsupported-native-raw',blocked);assert.equal(blocked.blocked,true);assert.equal(blocked.imi,false);assert.equal(blocked.ops,raw.ops);assert.equal(blocked.wallet,raw.wallet);
    }
    assert.deepEqual(errors,[]);write('sources-errors',{sources,errors});console.log(run+' actual-owner path PASS');
  }finally{if(browser)await browser.close();await new Promise(r=>server.close(r));write('resources',{browserClosed:!browser?.connected,serverClosed:!server.listening,profileRetained:profile,origin,unrelatedResourcesTouched:false});}
})().catch(error=>{write('failure',{message:error.message,stack:error.stack,errors,sources});console.error(error);process.exitCode=1;});
