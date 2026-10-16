// Task-owned controlled fixtures. Native UI is inspected separately through T3 preview.
const fs = require('node:fs'), assert = require('node:assert/strict'), crypto = require('node:crypto');
const pp = require('C:/Users/arran/pp/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js');
const out = 'docs/plan/long-game/evidence/LG-03/implementation-a4-r1', origin = 'http://127.0.0.1:8364';
const phase = process.argv[2], label = process.argv[3] || '';
const write = (name, data) => fs.writeFileSync(`${out}/${name}${label}.json`, JSON.stringify(data, null, 2), {flag:'wx'});
const identities = () => Object.fromEntries(['automation.js','ops.js','sw.js','training-pool.js','automation.css','core.js','economy.js','rewards.js','index.html','classic.html'].map(f => [f, crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')]));
(async () => {
  const browser = await pp.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
  const errors = [], loaded = {};
  let page;
  try {
    page = await browser.newPage();
    await page.setCacheEnabled(false);
    page.on('pageerror', e => errors.push(e.message));
    page.on('response', async r => { if (/\/(automation|ops|sw)\.js$/.test(new URL(r.url()).pathname)) loaded[r.url()] = crypto.createHash('sha256').update(await r.buffer()).digest('hex'); });
    await page.goto(`${origin}/tools/balance.html${['focused','bounded'].includes(phase) ? '?lg03=1&pg02=1' : ''}`);
    await page.waitForFunction(() => !!window.Bot);
    if (phase === 'bounded') {
      const result=await page.evaluate(()=>{
        const D=IMI.ops.dev,s=D.S(),api=IMI.ops.extensions,h=__OPS_EXTENSIONS.find(([id])=>id==='automation')[1],checks=[];
        const ok=(v,label)=>{if(!v)throw Error(label);checks.push(label);},tick=n=>h.tick({gameSeconds:n});
        s.printing=4;s.chDone={haiku:true,hands:true};s.intro.done=true;IMI.bananas.add(1e12);
        s.desks[0].paws=1;D.ensureCrew(s.desks[0]);s.desks[0].letters={Z:100000};
        s.meta.automation={version:1,desks:{mint:{enabled:true,reservePercent:25}},shop:{version:1,enabled:true},coach:{version:1,enabled:true},restore:{version:1,enabled:true}};
        h.init('independent edit-clock fixture',api);tick(19);h.actions['restore-toggle']();h.actions['restore-toggle']();
        tick(1);ok(s.desks[0].paws===2&&!s.hold,'A4 edits preserve A1 clock');tick(.05);ok(s.hold,'A4 edits preserve A3 clock');
        tick(.05);ok(s.desks[0].crew.some(t=>t.coach===1)&&s.desks[0].mk===0,'A4 edits preserve A2 clock and restart A4 only');
        s.meta.automation.desks.mint.enabled=false;s.meta.automation.shop.enabled=false;s.meta.automation.coach.enabled=false;
        s.desks.forEach(d=>d.owned=false);h.init('bounded failed scan fixture',api);let scans=0;const restore=api.restoreAutomationOne;
        api.restoreAutomationOne=i=>{scans++;return restore(i);};tick(20);api.restoreAutomationOne=restore;ok(scans===6,'failed scan examines exactly six desks at most');
        s.desks[0].owned=s.desks[1].owned=true;s.desks[0].letters={};s.desks[1].letters={};s.bank={};
        s.meta.trainingPool={version:1,enabled:true};const r=D.RECIPES.find(r=>r.title==='Peter Panzee');s.focus=r.id;s.autoFocus=false;
        const needs=s.desks.map(()=>({}));for(const[w,n]of Object.entries(r.need))for(const ch of w){const i=D.DESKS.findIndex(d=>w.length>=d.lo&&w.length<=d.hi);needs[i][ch]=(needs[i][ch]||0)+n;s.desks[i].letters[ch]=needs[i][ch];}
        s.desks[0].letters.Z=10000;const q=api.quoteAutomationHire(1,25),paws=s.desks[1].paws;
        ok(q.ok&&api.hireAutomationOne(1,25)&&s.desks[1].paws===paws+1,'actual shared protected Auto-hire still buys one');
        ok(needs.every((need,i)=>Object.entries(need).every(([ch,n])=>s.desks[i].letters[ch]>=n)),'actual hire preserves all current title ingredients');
        return {checks};
      });
      // One real native hosted interval, no manual restoration and no rewarded play/grants.
      const fixture=JSON.parse(fs.readFileSync(`${out}/focused-details.json`)).result.save;
      fixture.desks[0].mk=0;fixture.meta.automation.restore.enabled=true;
      await page.setBypassServiceWorker(true);
      const seed=await page.evaluateOnNewDocument(s=>{s.lastSeen=Date.now();localStorage.setItem('imi-ops-v1',JSON.stringify(s));localStorage.setItem('imi-score',JSON.stringify({economyVersion:1,score:1e12}));localStorage.setItem('imi-tour',JSON.stringify({version:2,done:true,tipsOff:true,tips:{}}));},fixture);
      await page.goto(`${origin}/classic.html?lg03=1&mg01=1#play`);await page.removeScriptToEvaluateOnNewDocument(seed.identifier);
      await page.waitForFunction(()=>!!window.IMI?.ops?.extensions?.quoteAutomationRestore);
      await page.evaluate(()=>IMI.ops.extensions.setTab('breakroom'));
      await page.click('[data-mg01="practice"]');await page.waitForSelector('.mg01-frame');
      const before=await page.evaluate(()=>({mk:IMI.ops.dev.S().desks[0].mk,at:performance.now(),screen:IMI.screen()}));
      await page.waitForFunction(()=>IMI.ops.dev.S().desks[0].mk===1,{timeout:25000});
      const after=await page.evaluate(()=>({mk:IMI.ops.dev.S().desks[0].mk,at:performance.now(),hosted:!!document.querySelector('.mg01-frame'),screen:IMI.screen()}));
      assert.equal(before.mk,0);assert.ok(after.hosted&&after.screen==='game');assert.deepEqual(errors,[]);
      write('bounded-pass',{result,hosted:{before,after},errors,loaded,identities:identities()});console.log(`${result.checks.length} bounded preservation checks and real hosted restoration passed`);
    } else if (phase === 'ui') {
      const fixture=JSON.parse(fs.readFileSync(`${out}/focused-details.json`)).result.save;
      fixture.meta.automation.restore.enabled=false;
      const screens=[];
      await page.setBypassServiceWorker(true);await page.setViewport({width:360,height:560});
      for(const edition of ['pixel','classic']) {
        const seedScript=await page.evaluateOnNewDocument(s=>{s.lastSeen=Date.now();s.daily={last:new Date().toDateString(),streak:1};localStorage.setItem('imi-ops-v1',JSON.stringify(s));localStorage.setItem('imi-score',JSON.stringify({economyVersion:1,score:1e12}));localStorage.setItem('imi-tour',JSON.stringify({version:2,done:true,tipsOff:true,tips:{}}));},fixture);
        await page.goto(`${origin}/${edition==='pixel'?'index':'classic'}.html?lg03=1#play`);
        await page.removeScriptToEvaluateOnNewDocument(seedScript.identifier);
        await page.waitForFunction(()=>!!window.IMI?.ops?.extensions?.quoteAutomationRestore);
        await page.evaluate(()=>IMI.ops.extensions.setTab('automation'));
        await page.waitForSelector('.lg03-restore');
        await new Promise(r=>setTimeout(r,1000));
        await page.evaluate(()=>{const p=document.getElementById('o-automation'),c=document.querySelector('.lg03-restore');p.scrollTop+=c.getBoundingClientRect().top-p.getBoundingClientRect().top;});
        const layout=await page.evaluate(()=>{const p=document.getElementById('o-automation'),b=document.querySelector('[data-act="automation:restore-toggle"]'),r=b.getBoundingClientRect();return {width:innerWidth,height:innerHeight,pageWidth:document.documentElement.scrollWidth,pageHeight:document.documentElement.scrollHeight,pane:{height:p.clientHeight,scrollHeight:p.scrollHeight,width:p.clientWidth,scrollWidth:p.scrollWidth},button:{x:r.x,y:r.y,width:r.width,height:r.height},off:b.getAttribute('aria-pressed')==='false',hasRestore:__OPS_EXTENSIONS.find(([id])=>id==='automation')[1].tick.toString().includes('restoreElapsed')};});
        assert.ok(layout.hasRestore&&layout.off&&layout.pageWidth===360&&layout.pageHeight===560&&layout.pane.scrollWidth<=layout.pane.width&&layout.pane.scrollHeight>layout.pane.height&&layout.button.width>=40&&layout.button.height>=40);
        await page.screenshot({path:`${out}/${edition}-360-off.png`});
        await page.click('[data-act="automation:restore-toggle"]');
        await page.waitForFunction(()=>IMI.ops.dev.S().meta.automation.restore.enabled&&document.querySelector('[data-act="automation:restore-toggle"]').getAttribute('aria-pressed')==='true');
        const ack=await page.evaluate(()=>JSON.parse(localStorage.getItem('imi-ops-v1')).meta.automation.restore);
        assert.equal(ack.enabled,true);
        await page.screenshot({path:`${out}/${edition}-360-on.png`});
        await page.reload();await page.waitForFunction(()=>!!window.IMI?.ops?.extensions?.quoteAutomationRestore);
        const reload=await page.evaluate(()=>IMI.ops.dev.S().meta.automation.restore);assert.equal(reload.enabled,true);assert.equal(reload.unknown,'keep');
        screens.push({edition,layout,ack,reload,source:'Native Core, bypassed worker, response hashes captured; desktop UA at 360x560'});
      }
      assert.deepEqual(errors,[]);
      write('native-ui',{screens,errors,loaded,identities:identities()});console.log('Both native 360 cards, actual clicks/ACK/reload passed');
    } else if (phase !== 'focused') {
      const result = await page.evaluate(() => { Bot.start({profile:'active',strategy:'collect',seed:1,activeMinutes:5}); Bot.run(5); return {report:Bot.report(),meta:IMI.ops.dev.S().meta}; });
      write(`default-${phase}`, {result, errors, loaded, identities:identities()});
      assert.deepEqual(errors, []);
      if (phase !== 'before') assert.deepEqual(result, JSON.parse(fs.readFileSync(`${out}/default-before.json`)).result);
      console.log(`${phase}: five-minute default report/meta/errors captured`);
    } else {
      const result = await page.evaluate(() => {
        const D=IMI.ops.dev, api=IMI.ops.extensions, h=__OPS_EXTENSIONS.find(([id])=>id==='automation')[1], s=D.S(), checks=[];
        const ok=(v,label)=>{if(!v)throw Error(label);checks.push(label);};
        const tick=n=>h.tick({gameSeconds:n}), reset=()=>h.init('controlled gameSeconds fixture',api), toggle=()=>h.actions['restore-toggle']();
        const wallet=n=>{IMI.bananas.spend(IMI.bananas.get());IMI.bananas.add(n);};
        const cfg=()=>D.S().meta.automation, levels=()=>D.S().desks.map(d=>d.mk).join();
        tick(100);ok(!cfg(),'absent config remains absent');
        wallet(1e12);
        for(let bits=0;bits<8;bits++){
          s.printing=bits&1?4:3;s.chDone.haiku=!!(bits&2);s.intro.done=!!(bits&4);
          ok(api.quoteAutomationRestore(0).ok===(bits===7),`gate combination ${bits}`);
        }
        for(const i of [-1,.5,6,'0'])ok(!api.quoteAutomationRestore(i).ok,`invalid desk ${i}`);
        s.desks[1].owned=false;ok(!api.quoteAutomationRestore(1).ok,'unowned refused');
        const inventory=JSON.stringify(s.desks.map(d=>d.letters));s.sel=0;D.ui.buyN='max';
        const base=D.MK_BASE[0];s.desks[0].mk=0;
        let price=D.mkCost(0);ok(price===base*.8,'actual discounted Mk II cost');
        wallet(price*2-1);ok(!api.restoreAutomationOne(0)&&s.desks[0].mk===0&&IMI.bananas.get()===price*2-1,'below 2x refuses without spend');
        wallet(price*2);ok(api.restoreAutomationOne(0)&&s.desks[0].mk===1&&IMI.bananas.get()===price,'2x equality buys actual Mk II');
        price=D.mkCost(0);ok(price===base*12*.8,'actual discounted Mk III cost');
        wallet(price*2);ok(api.restoreAutomationOne(0)&&s.desks[0].mk===2&&IMI.bananas.get()===price,'2x equality buys actual Mk III');
        ok(!api.restoreAutomationOne(0),'cap refused');
        ok(JSON.parse(localStorage.getItem('imi-ops-v1')).desks[0].mk===2,'manual restoration save reused');
        ok(s.sel===0&&D.ui.buyN==='max'&&JSON.stringify(s.desks.map(d=>d.letters))===inventory,'selection Max and letter piles unchanged');
        s.desks[0].mk=0;wallet(base*2);ok(api.quoteAutomationRestore(0).ok,'quote before changed state');
        s.desks[0].mk=1;ok(!api.restoreAutomationOne(0),'execution requotes changed price');
        wallet(1e12);s.desks[0].owned=false;ok(!api.restoreAutomationOne(0),'execution rechecks ownership');s.desks[0].owned=true;
        s.intro.done=false;ok(!api.restoreAutomationOne(0),'execution rechecks gate');s.intro.done=true;
        const allowed=api.automationAllowed;api.automationAllowed=()=>false;ok(!api.restoreAutomationOne(0),'automationAllowed false fixture');api.automationAllowed=allowed;
        s.meta.automation={version:1,unknown:{keep:true},restore:{version:1,enabled:false,unknown:'keep'}};
        toggle();ok(cfg().restore.enabled&&JSON.parse(localStorage.getItem('imi-ops-v1')).meta.automation.restore.enabled&&cfg().restore.unknown==='keep'&&cfg().unknown.keep,'actual enable ACK preserves unknown');
        s.desks.forEach(d=>{d.mk=0;d.owned=false;});s.desks[0].owned=true;s.desks[2].owned=true;
        reset();tick(19);ok(s.desks[0].mk===0,'independent 20-second clock');tick(1);ok(s.desks[0].mk===1,'first round-robin desk');tick(20);ok(s.desks[2].mk===1&&s.desks[0].mk===1,'round-robin skips unowned');
        s.desks[2].mk=2;tick(20);ok(s.desks[0].mk===2,'round-robin skips capped');
        s.desks[0].mk=0;s.desks[2].mk=0;wallet(D.mkCost(0)*2);reset();tick(20);tick(20);ok(s.desks[2].mk===0,'round-robin skips expensive');
        wallet(0);reset();tick(200);wallet(1e12);tick(.05);ok(s.desks[2].mk===0,'failed scan consumes attempt and drops excess');tick(19.95);ok(s.desks[0].mk===2,'next interval after refusal');
        s.desks[0].mk=0;s.desks[2].mk=0;reset();tick(200);const once=levels();tick(.05);ok(levels()===once,'large dt only one level no burst');
        reset();const noReplay=levels();h.tick({gameSeconds:100,replay:true});IMI.ops.simulateAway(120);D.tick({phase:9,realDt:100,multiplier:1,now:performance.now()});
        Object.defineProperty(document,'hidden',{configurable:true,value:true});tick(100);delete document.hidden;
        const screen=IMI.screen;IMI.screen=()=> 'menu';tick(100);IMI.screen=screen;tick(19);ok(levels()===noReplay,'no hidden menu offline or replay accrual');
        s.desks[0].mk=0;s.desks[2].mk=0;reset();tick(19);toggle();toggle();tick(1);ok(s.desks[0].mk===0,'own setting edits reset A4 clock');tick(19);ok(s.desks[0].mk===1,'own setting reset restarts cursor');
        reset();tick(19);h.actions['shop-toggle']();h.actions['shop-toggle']();tick(1);ok(s.desks[0].mk===2,'other helper edits preserve A4 clock');
        s.chDone.hands=true;s.desks[0].paws=2;D.ensureCrew(s.desks[0]);const [a,b]=s.desks[0].crew;
        Object.assign(a,{xp:120,lv:1,coach:0});Object.assign(b,{xp:0,lv:10,coach:1});
        s.meta.trainingPool={version:1,enabled:true};s.desks[0].letters={A:100000};s.desks[0].keeper.on=false;
        cfg().desks={mint:{enabled:true,reservePercent:25}};cfg().shop={version:1,enabled:true};cfg().coach={version:1,enabled:true};s.hold=false;s.desks[0].mk=0;s.desks[2].mk=0;
        wallet(1e12);reset();let paws=s.desks[0].paws;
        tick(20);ok(s.desks[0].paws===paws+1&&!s.hold&&b.coach===1&&s.desks[0].mk===0,'fair service A1 only');
        s.desks[0].crew[paws].xp=1000;
        tick(.05);ok(s.hold&&b.coach===1&&s.desks[0].mk===0,'fair service A3 only');
        tick(.05);ok(a.coach===0&&b.coach===2&&s.desks[0].mk===0,'fair service A2 only XP-first');
        tick(.05);ok(s.desks[0].mk===1&&s.desks[2].mk===0,'fair service A4 only');
        // Refused hire still occupies its slot; other due helpers wait for another tick.
        s.desks[0].letters={};s.contracts=false;reset();const oldCoach=b.coach;
        tick(20);ok(!s.contracts&&b.coach===oldCoach&&s.desks[0].mk===1,'refusal consumes shared service slot');tick(.05);ok(s.contracts,'next helper served after refusal');
        cfg().desks.mint.enabled=false;cfg().shop.enabled=false;cfg().coach.enabled=false;
        const r=D.RECIPES.find(r=>r.title==='Peter Panzee');s.focus=r.id;s.autoFocus=false;s.bank={};
        s.desks[0].letters={};s.desks[1].owned=true;s.desks[1].letters={};
        for(const [w,n] of Object.entries(r.need))for(const ch of w){const d=s.desks[D.DESKS.findIndex(d=>w.length>=d.lo&&w.length<=d.hi)];d.letters[ch]=(d.letters[ch]||0)+n;}
        s.desks[0].letters.Z=10000;const protectedBefore=api.trainingPoolFacts(0);s.desks[0].mk=0;reset();tick(20);
        ok(JSON.stringify(api.trainingPoolFacts(0))===JSON.stringify(protectedBefore),'restoration leaves protected shared training unchanged');
        // Actual acknowledged config failure and Retry, plus immediate local failed-disable suspension.
        toggle();const native=Storage.prototype.setItem, raw=localStorage.getItem('imi-ops-v1');let refusals=0;
        Storage.prototype.setItem=function(k,v){if(k==='imi-ops-v1'){refusals++;throw new DOMException('LG03D quota fixture','QuotaExceededError');}return native.call(this,k,v);};
        toggle();const before=levels();tick(100);ok(!cfg().restore.enabled&&localStorage.getItem('imi-ops-v1')===raw&&levels()===before,'failed enable stays Off pending spending paused');
        const pane=document.getElementById('o-automation');h.render(api,pane);ok(pane.textContent.includes('Retry save'),'pending exposes Retry');
        Storage.prototype.setItem=native;h.actions.retry();ok(cfg().restore.enabled&&JSON.parse(localStorage.getItem('imi-ops-v1')).meta.automation.restore.enabled,'actual Retry ACK');
        Storage.prototype.setItem=function(k,v){if(k==='imi-ops-v1'){refusals++;throw new DOMException('LG03D disable quota fixture','QuotaExceededError');}return native.call(this,k,v);};
        toggle();tick(100);h.render(api,pane);ok(cfg().restore.enabled&&levels()===before&&pane.textContent.includes('Off locally. Retry to save Off.'),'failed disable suspended locally');
        Storage.prototype.setItem=native;h.actions.retry();ok(!cfg().restore.enabled,'disable Retry ACK');
        cfg().restore={version:2,enabled:true,unknown:'future'};const future=JSON.stringify(cfg());reset();toggle();tick(100);ok(JSON.stringify(cfg())===future&&levels()===before,'future config preserved edit and spend refused');
        cfg().restore={version:1,enabled:true,unknown:'keep'};reset();tick(19);s.run.earned=Economy.cash(500000);const config=JSON.stringify(cfg());D.doPrint('');const printed=D.S();
        ok(printed!==s&&JSON.stringify(printed.meta.automation)===config,'actual Printing retains config on replacement S');
        wallet(1e12);tick(1);ok(printed.desks[0].mk===0,'Printing resets A4 clock');tick(19);ok(printed.desks[0].mk===1,'post Printing current S restoration');
        const smoke={before:{letters:printed.stats.letters,mk:printed.desks[0].mk}};printed.desks[0].paws=1;D.ensureCrew(printed.desks[0]);__advance(40000);smoke.after={letters:printed.stats.letters,mk:printed.desks[0].mk};
        ok(smoke.after.letters>smoke.before.letters&&smoke.after.mk===2,'actual Ops tick production and automatic restoration smoke');
        return {checks,refusals,smoke,save:structuredClone(printed)};
      });
      write('focused-details', {result, errors, loaded, identities:identities()});
      assert.deepEqual(errors, []);
      const shell=await browser.newPage();await shell.setBypassServiceWorker(true);
      await shell.evaluateOnNewDocument(s=>{s.lastSeen=Date.now();localStorage.setItem('imi-ops-v1',JSON.stringify(s));localStorage.setItem('imi-score',JSON.stringify({economyVersion:1,score:1e12}));},result.save);
      await shell.goto(`${origin}/classic.html?lg03=1#play`);await shell.waitForFunction(()=>!!window.IMI?.ops?.extensions?.quoteAutomationRestore);
      const reload=await shell.evaluate(()=>({config:IMI.ops.dev.S().meta.automation.restore,printing:IMI.ops.dev.S().printing,haiku:IMI.ops.dev.S().chDone.haiku}));
      assert.equal(reload.config.enabled,true);assert.equal(reload.config.unknown,'keep');assert.ok(reload.printing>=4&&reload.haiku);
      write('focused-pass', {checks:result.checks,reload,errors,loaded,identities:identities()});console.log(`${result.checks.length} focused checks passed; native reload passed`);
    }
  } catch (e) {
    const state=await page?.evaluate(()=>({url:location.href,screen:window.IMI?.screen(),tab:window.IMI?.ops?.dev.ui.tab,body:document.body.innerText,hook:window.__OPS_EXTENSIONS?.find(([id])=>id==='automation')?.[1].render.toString()})).catch(()=>null);
    write(`${phase}-failure-${Date.now()}`, {failure:e.stack,errors,loaded,state,identities:identities()});
    throw e;
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
