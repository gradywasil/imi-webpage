// Exclusive task evidence; actual components, controlled clocks only where stated.
const fs = require('node:fs'), assert = require('node:assert/strict'), crypto = require('node:crypto');
const pp = require('C:/Users/arran/pp/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js');
const out = 'docs/plan/long-game/evidence/LG-03/implementation-a5-r1', origin = 'http://127.0.0.1:8365';
const mode = process.argv[2];
const write = (name, value) => fs.writeFileSync(`${out}/${name}${process.argv[3]||''}.json`, JSON.stringify(value, null, 2), {flag:'wx'});
const identities = () => Object.fromEntries(['automation.js','pickups.js','ops.js','sw.js','core.js','economy.js','rewards.js','automation.css','index.html','classic.html'].map(f => [f, crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')]));
(async () => {
  const browser = await pp.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
  const errors = [], loaded = {};
  const page = await browser.newPage();
  await page.setCacheEnabled(false); await page.setBypassServiceWorker(true);
  page.on('pageerror', e => errors.push(e.message));
  page.on('response', async r => { if (/\/(automation|pickups|ops)\.js$/.test(new URL(r.url()).pathname)) loaded[r.url()] = crypto.createHash('sha256').update(await r.buffer()).digest('hex'); });
  try {
    if (mode === 'hold') {
      const seed=JSON.parse(fs.readFileSync(`${out}/focused-details.json`)).result.save;
      await page.evaluateOnNewDocument(s=>{s.lastSeen=Date.now();s.daily={last:new Date().toDateString(),streak:1};localStorage.setItem('imi-ops-v1',JSON.stringify(s));localStorage.setItem('imi-score',JSON.stringify({economyVersion:1,score:1000000}));localStorage.setItem('imi-tour',JSON.stringify({version:2,done:true,tipsOff:true,tips:{}}));},seed);
      await page.goto(`${origin}/classic.html?lg01a=1&lg03=1#play`);
      await page.waitForFunction(()=>!!IMI?.pickups&&Rewards.owns()&&IMI.ops.progression.running());
      const result=await page.evaluate(async ()=>{
        const api=IMI.ops.extensions,h=__OPS_EXTENSIONS.find(([id])=>id==='automation')[1];
        IMI.reduceMotion=true;api.setTab('floor');api.state().meta.automation.net.ordinary=api.state().meta.automation.net.golden=0;Rewards.checkpoint();
        let time=performance.now();performance.now=()=>time;
        IMI.pickups.spawn();IMI.ops.spawnGold(false);const ordinary=document.querySelector('.o-pickup'),between=document.querySelector('.o-gold');h.tick({gameSeconds:.05});
        const collect=IMI.ops.pickup.collect;IMI.ops.pickup.collect=function(...args){const result=collect.apply(this,args);document.getElementById('settingsBtn').click();return result;};
        time+=1000;h.tick({gameSeconds:1});IMI.ops.pickup.collect=collect;
        const guardBetween=!ordinary.isConnected&&between.isConnected;
        document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));time+=1500;h.tick({gameSeconds:1.5});
        if(!guardBetween||!between.isConnected)throw Error('Guard between ordinary and golden claims');between.click();
        api.state().meta.automation.net.golden=0;Rewards.checkpoint();IMI.ops.spawnGold(false);const menuGold=document.querySelector('.o-gold');h.tick({gameSeconds:.05});
        document.getElementById('menuBtn').click();
        const back=new Promise(resolve=>addEventListener('hashchange',resolve,{once:true}));location.hash='play';await back;
        time+=1500;h.tick({gameSeconds:1.5});const menuCancelled=menuGold.isConnected;
        if(!menuCancelled)throw Error('Menu recovery caught old gold');menuGold.click();
        api.state().meta.automation.net.golden=0;Rewards.checkpoint();
        IMI.ops.spawnGold(false);const el=document.querySelector('.o-gold');h.tick({gameSeconds:.05});
        const admitted=api.state().meta.automation.net.golden===1;
        const set=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='imi-ops-v1')throw Error('LG03E deliberate held save');return set.call(this,k,v);};
        Rewards.checkpoint();Storage.prototype.setItem=set;
        const held=!!document.querySelector('.o-writer-held .o-writer-content'),stopped=!IMI.ops.progression.running(),heldBuffBar=!!document.querySelector('.o-writer-content .o-buffbar');
        const recovered=Rewards.retry();time+=1500;h.tick({gameSeconds:1.5});
        const buffBarImmediatelyAfterRetry=!!document.querySelector('.o-buffbar');api.setTab('floor');
        const result={guardBetween,menuCancelled,admitted,held,heldBuffBar,stopped,recovered,stillPresent:el.isConnected,gold:api.state().gold,buffBarImmediatelyAfterRetry,restoredBuffBarAfterProductRender:!!document.querySelector('.o-buffbar')};
        if(!admitted||!held||!heldBuffBar||!stopped||!recovered||!el.isConnected||!result.restoredBuffBarAfterProductRender)throw Error(JSON.stringify(result));
        return result;
      });
      assert.deepEqual(errors,[]);write('held-recovery',{result,errors,loaded,identities:identities()});console.log('Actual Rewards hold/Retry cancels item permanently; incumbent callback retained');
    } else if (mode === 'focused') {
      await page.setViewport({width:1280,height:800});
      await page.evaluateOnNewDocument(() => localStorage.setItem('imi-tour',JSON.stringify({version:2,done:true,tipsOff:true,tips:{}})));
      await page.goto(`${origin}/classic.html?lg03=1&mg01=1#play`);
      await page.waitForFunction(() => !!IMI?.pickups && !!IMI.ops.extensions.commitAutomation);
      const result = await page.evaluate(async () => {
        const api=IMI.ops.extensions, h=__OPS_EXTENSIONS.find(([id])=>id==='automation')[1], checks=[], admissions=[], attempts=[];
        const ok=(v,label)=>{if(!v)throw Error(label);checks.push(label);};
        let time=performance.now(); performance.now=()=>time;
        const tick=(ms=0,replay=false)=>{time+=ms;h.tick({gameSeconds:ms/1000,replay});};
        const state=()=>IMI.ops.dev.S(), cfg=()=>state().meta.automation, phase=k=>cfg().net[k];
        const toggle=()=>h.actions['net-toggle'](), reset=()=>h.init('controlled production clock; actual native components',api);
        IMI.reduceMotion=true;
        const s=state();s.intro.done=true;s.intro.train=s.intro.words=s.intro.shop=true;s.printing=5;s.chDone.timed=true;
        s.daily={last:new Date().toDateString(),streak:1};api.setTab('floor');
        const last={},created=h.netCreated;
        h.netCreated=(k,item)=>{last[k]=item;const claim=item.claim;item.claim=()=>{attempts.push(k);return claim();};created(k,item);};
        const spawn=k=>{if(k==='ordinary')ok(IMI.pickups.spawn(),'actual ordinary spawn');else IMI.ops.spawnGold(false);const el=document.querySelector(k==='ordinary'?'.o-pickup':'.o-gold');ok(!!el,`actual ${k} instance`);return el;};
        const clear=()=>{IMI.pickups.clear();document.querySelector('.o-gold')?.click();};
        tick(1000);ok(!cfg(),'absent config has no initialization write');
        for(let bits=0;bits<8;bits++){
          s.printing=bits&1?5:4;s.chDone.timed=!!(bits&2);s.intro.done=!!(bits&4);toggle();
          ok(!!cfg()?.net?.enabled===(bits===7),`earned gate combination ${bits}`);
        }
        ok(cfg().net.ordinary===0&&cfg().net.golden===0,'acknowledged On initializes separate phase zero');
        IMI.tour.skip();api.setTab('floor');
        cfg().unknown='preserve';cfg().net.unknown='preserve-net';
        toggle();const old=spawn('ordinary');toggle();tick(1500);ok(old.isConnected&&phase('ordinary')===0,'enable excludes existing instance');clear();
        const storage=Storage.prototype.setItem;
        const fail=()=>{Storage.prototype.setItem=function(k,v){if(k==='imi-ops-v1')throw Error('LG03E deliberate acknowledgement refusal');return storage.call(this,k,v);};};
        const recover=()=>{Storage.prototype.setItem=storage;};
        toggle();fail();toggle();recover();ok(!cfg().net.enabled,'refused enable stays Off');h.actions.retry();ok(cfg().net.enabled,'actual Retry acknowledges On');
        for(const k of ['ordinary','golden']){
          const other=k==='ordinary'?'golden':'ordinary',otherPhase=phase(other),selected=[];
          for(let i=0;i<5;i++){
            const el=spawn(k),before=attempts.length;
            tick();ok(phase(k)===(i+1)%5&&phase(other)===otherPhase,`${k} admission ${i} advances only its stream`);
            ok(JSON.parse(localStorage.getItem('imi-ops-v1')).meta.automation.net[k]===phase(k),'phase acknowledged before capture');
            tick(999);ok(el.isConnected,'manual first second');tick(1);
            const caught=!el.isConnected;selected.push(caught);admissions.push({kind:k,phase:i,caught});
            ok(attempts.length-before===(caught?1:0),'one attempt per selected instance');
            if(!caught){el.click();ok(!el.isConnected,'skip remains manually collectible');}
            tick(1000);ok(attempts.length-before===(caught?1:0),'consumed instance never attempted twice');
          }
          ok(JSON.stringify(selected)==='[true,false,true,false,true]',`${k} Catch Skip Catch Skip Catch`);
        }
        const manual=spawn('ordinary'),n=s.stats.pickups;tick();manual.click();tick(1000);ok(s.stats.pickups===n+1,'manual first wins single consumption');
        clear();cfg().net.ordinary=cfg().net.golden=0;reset();
        const o=spawn('ordinary'),g=spawn('golden'),before=attempts.length,earned=s.stats.pickupEarned,value=IMI.ops.pickup.value();
        tick();s.stats.playSecs+=600;tick(1000);
        ok(!o.isConnected&&!g.isConnected&&attempts.slice(before).join()==='ordinary,golden','simultaneous budget is two, ordinary then golden');
        ok(s.stats.pickupEarned-earned===value,'ordinary pays captured value despite subsequent value change');
        tick(5000);ok(attempts.length===before+2,'no repeated attempts or historical catch-up');
        cfg().net.ordinary=0;reset();const refused=spawn('ordinary'),phaseBefore=phase('ordinary');fail();tick();recover();
        ok(phase('ordinary')===phaseBefore,'actual phase acknowledgement refusal keeps phase');
        h.actions.retry();ok(phase('ordinary')===1,'Retry saves pending phase only');const afterRetry=attempts.length;tick(2000);
        ok(refused.isConnected&&attempts.length===afterRetry,'Retry never resurrects failed instance');clear();
        cfg().net.ordinary=0;reset();const disabled=spawn('ordinary');tick();fail();toggle();recover();tick(1500);
        ok(cfg().net.enabled&&disabled.isConnected,'failed disable suspends locally despite persisted On');h.actions.retry();ok(!cfg().net.enabled,'Retry saves Off');toggle();tick(1500);ok(disabled.isConnected,'Off On never readmits old item');clear();
        cfg().net.ordinary=0;reset();const expired=spawn('ordinary');tick();const count=attempts.length;tick(14000);ok(attempts.length===count,'actual ordinary expiry refuses net');IMI.pickups.clear();
        cfg().net.golden=0;reset();IMI.ops.spawnGold(true);const rotten=document.querySelector('.o-gold');tick(2000);ok(rotten.isConnected&&phase('golden')===0,'actual rotten consumes no phase or attempt');rotten.click();
        const expGold=spawn('golden');tick();const gc=attempts.length;tick(9000);ok(expGold.isConnected&&attempts.length===gc,'actual golden deadline refuses even before legacy timer fires');expGold.click();
        cfg().net.golden=0;reset();IMI.reduceMotion=false;const flying=spawn('golden'),anim=flying.getAnimations()[0];anim.pause();anim.currentTime=0;
        tick();ok(phase('golden')===0,'gold starts outside viewport without admission');anim.currentTime=anim.effect.getTiming().duration*.5;tick();ok(phase('golden')===1,'gold first viewport entry admits once');tick(1000);ok(!flying.isConnected,'entered flying gold captured');IMI.reduceMotion=true;
        cfg().net.golden=0;reset();const replay=spawn('golden');tick(0,true);tick(2000);ok(replay.isConnected&&phase('golden')===0,'replay cancels without phase or later capture');replay.click();
        cfg().net.golden=0;reset();const blocked=spawn('golden');tick();document.getElementById('settingsBtn').click();await Promise.resolve();
        document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));await Promise.resolve();tick(2000);ok(blocked.isConnected,'actual Settings open and close permanently cancels catch');blocked.click();
        cfg().net.golden=0;reset();const inert=spawn('golden');tick();inert.inert=true;await Promise.resolve();inert.inert=false;await Promise.resolve();tick(1500);ok(inert.isConnected,'inert then recovery never catches');inert.click();
        cfg().net.golden=0;reset();const hidden=spawn('golden');tick();Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));Object.defineProperty(document,'hidden',{configurable:true,value:false});tick(2000);ok(hidden.isConnected,'hidden visibility recovery has no catch-up');hidden.click();
        s.run.earned=Economy.cash(5e8);cfg().net.golden=0;reset();const modalGold=spawn('golden');tick();IMI.ops.dev.action('printask');ok(!!document.querySelector('.o-modal'),'actual Printing modal exists');await Promise.resolve();
        document.querySelector('.o-modal [data-cancel]').click();
        ok(!document.querySelector('.o-modal'),'actual modal closed');tick(2000);ok(modalGold.isConnected,'modal close never replays cancelled catch');modalGold.click();
        cfg().net.golden=0;reset();const hostedGold=spawn('golden');tick();api.setTab('breakroom');document.querySelector('[data-mg01="practice"]').click();
        ok(!!document.querySelector('.mg01-overlay iframe')&&hostedGold.inert,'actual hosted iframe makes gold inert');await Promise.resolve();
        ok(!IMI.pickups.spawn(),'ordinary actual eligibility refuses behind hosted minigame');
        document.querySelector('[data-mg01="close"]').click();await Promise.resolve();api.setTab('floor');tick(2000);ok(hostedGold.isConnected,'hosted close never catches old item');hostedGold.click();
        const future={version:1,net:{version:2,enabled:true,ordinary:4,golden:4},unknown:'future'};s.meta.automation=future;reset();toggle();const futureEl=spawn('golden');tick(2000);ok(s.meta.automation===future&&futureEl.isConnected,'future net preserved and edits/capture refused');futureEl.click();
        s.meta.automation={version:1,net:{version:1,enabled:true,ordinary:2,golden:4,unknown:'keep'},unknown:'keep'};reset();const printingGold=spawn('golden');tick();const retained=structuredClone(cfg());IMI.ops.dev.doPrint();
        ok(state()!==s&&JSON.stringify(cfg())===JSON.stringify(retained)&&!printingGold.isConnected,'actual Printing replaces S, retains phases/config, clears item');tick(2000);
        api.save();return {checks,admissions,attempts,save:structuredClone(state()),fixture:'Native Classic actual components; controlled performance.now, direct extension ticks; real acknowledgement writes and Storage refusal; actual manual clicks'};
      });
      write('focused-details',{result,errors,loaded,identities:identities()});
      assert.deepEqual(errors,[]);
      await page.reload();await page.waitForFunction(()=>!!IMI?.pickups);
      const reload=await page.evaluate(()=>({config:IMI.ops.dev.S().meta.automation,items:!!document.querySelector('.o-gold,.o-pickup')}));
      assert.deepEqual(reload.config,result.save.meta.automation);assert.equal(reload.items,false);
      write('focused-pass',{checks:result.checks,reload,errors,loaded,identities:identities()});
      console.log(`${result.checks.length} focused checks and native reload passed`);
    } else if (mode === 'before' || mode === 'final') {
      await page.goto(`${origin}/tools/balance.html`); await page.waitForFunction(() => !!window.Bot);
      const result = await page.evaluate(() => { Bot.start({profile:'active',strategy:'collect',seed:1,activeMinutes:5}); Bot.run(5); return {report:Bot.report(),meta:IMI.ops.dev.S().meta}; });
      write(`default-${mode}`, {result,errors,loaded,identities:identities()});
      assert.deepEqual(errors, []);
      if (mode === 'final') assert.deepEqual(result, JSON.parse(fs.readFileSync(`${out}/default-before.json`)).result);
      console.log(`${mode}: five-minute stable report/meta/errors`);
    }
  } catch(e) { const state=await page.evaluate(()=>({url:location.href,screen:IMI?.screen(),tour:IMI?.tour?.active(),tab:IMI?.ops?.dev.ui.tab,settings:document.querySelector('.set-pop')?.hidden,body:document.body.innerText.slice(-1500),state:IMI?.ops?.dev.S()})).catch(()=>null);write(`${mode}-failure-${Date.now()}`, {error:e.stack,errors,loaded,state,identities:identities()}); throw e; }
  finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode=1; });
