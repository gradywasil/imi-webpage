const fs = require('node:fs'), assert = require('node:assert/strict'), crypto = require('node:crypto');
const pp = require('C:/Users/arran/pp/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js');
const out = 'docs/plan/long-game/evidence/LG-03/implementation-tiers-r1';
const hash = f => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const write = (f, v) => fs.writeFileSync(`${out}/${f}.json`, JSON.stringify(v, null, 2), {flag:'wx'});
(async () => {
  const browser = await pp.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
  const errors = [], loaded = {}, page = await browser.newPage();
  await page.setCacheEnabled(false); await page.setBypassServiceWorker(true);
  page.on('pageerror', e => errors.push(e.message));
  page.on('response', async r => {const name = new URL(r.url()).pathname.slice(1); if (['ops.js','automation.js','training-pool.js'].includes(name)) loaded[name] = crypto.createHash('sha256').update(await r.buffer()).digest('hex');});
  try {
    await page.goto('http://127.0.0.1:8371/tools/balance.html?lg03=1&pg02=1');
    const result = await page.evaluate(() => {
      const a = IMI.ops.extensions, h = __OPS_EXTENSIONS.find(([id]) => id === 'automation')[1], checks = [], details = {};
      const ok = (v, label) => {if (!v) throw Error(label); checks.push(label);};
      const s = () => a.state(), cfg = () => s().meta.automation;
      const expected = () => cfg() === undefined ? null : JSON.stringify(cfg());
      const buy = (id, n = cfg()?.tiers?.[id] ?? 0, e = expected()) => a.buyAutomationTier(id, n, e);
      const action = id => h.actions.upgrade({dataset:{helper:id,level:String(cfg()?.tiers?.[id] ?? 0)}});
      h.tick({gameSeconds:20}); ok(cfg() === undefined, 'absent config has no initialization write');
      s().legacy.stars = 100; s().legacy.total = 200;
      for (const id of ['hire','shop','coach','restore','net']) ok(!a.quoteAutomationTier(id).ok, `${id} base gate locked`);
      s().printing = 5; s().chDone = {hands:true,haiku:true,timed:true}; s().intro.done = true;
      for (const id of ['hire','shop','coach','restore','net']) {
        for (let level = 0; level < 3; level++) {
          const q = a.quoteAutomationTier(id), stars = s().legacy.stars, e = expected();
          ok(q.ok && q.level === level && q.price === [1,2,4][level], `${id} level ${level} exact quote`);
          ok(buy(id).ok && s().legacy.stars === stars-q.price && cfg().tiers[id] === level+1, `${id} atomic debit and single advance`);
          const durable = JSON.parse(localStorage.getItem('imi-ops-v1'));
          ok(durable.legacy.stars === s().legacy.stars && durable.meta.automation.tiers[id] === level+1, `${id} acknowledged candidate`);
          ok(!buy(id,level,e).ok && s().legacy.stars === stars-q.price, `${id} stale duplicate no second spend`);
        }
        ok(!buy(id).ok, `${id} maximum cannot buy`);
      }
      ok(s().legacy.total === 200 && s().legacy.stars === 65, 'spend only current stars, total unchanged');
      let next = JSON.parse(JSON.stringify(cfg())); next.tiers.hire = 0;
      ok(!a.commitAutomation(expected(),next).ok && cfg().tiers.hire === 3, 'ordinary config cannot change paid levels');
      for (const bad of [{version:2},{version:1,hire:4},{version:1,coach:1.5},{version:1,net:1}]) {
        const candidate = {version:1,tiers:bad};
        ok(!h.validConfig(candidate), 'future or malformed tier data refused');
      }
      s().meta.automation = {version:1,unknown:{preserve:true},tiers:{version:1,hire:0,unknown:'keep'},net:{version:1,enabled:true,ordinary:3,golden:4,unknown:'net'}};
      s().meta.keep = {x:1}; s().prem.keep = {y:2}; s().rewards.keep = {z:3};
      s().legacy.stars = 0; const before = expected();
      ok(!buy('hire').ok && expected() === before && s().legacy.stars === 0, 'insufficient stars publishes nothing');
      s().legacy.stars = 10;
      const set = Storage.prototype.setItem;
      Storage.prototype.setItem = function(k,v) {if (k === 'imi-ops-v1') throw Error('LG03F deliberate storage refusal'); return set.call(this,k,v);};
      action('hire');
      ok(cfg().tiers.hire === 0 && s().legacy.stars === 10, 'real refused write publishes neither field');
      ok(!buy('shop').ok && s().legacy.stars === 10, 'different tier request refused while purchase pending');
      a.setTab('automation'); h.render(s(),document.getElementById('o-automation')); ok(document.querySelector('[data-act="automation:retry"]'), 'refused purchase shows Retry');
      Storage.prototype.setItem = set; h.actions.retry();
      ok(cfg().tiers.hire === 1 && s().legacy.stars === 9, 'Retry buys requested level once');
      h.actions.retry(); ok(s().legacy.stars === 9 && cfg().tiers.hire === 1, 'duplicate Retry does not buy next level');
      ok(cfg().unknown.preserve && cfg().tiers.unknown === 'keep' && s().meta.keep.x === 1 && s().prem.keep.y === 2 && s().rewards.keep.z === 3, 'unknown and shared metadata preserved');
      ok(cfg().net.version === 1 && cfg().net.ordinary === 3 && cfg().net.golden === 4, 'non-net purchase leaves v1 phases untouched');
      action('net'); ok(cfg().net.version === 2 && cfg().net.ordinary === 3 && cfg().net.golden === 4 && cfg().net.unknown === 'net', 'first A5 upgrade atomically maps p to p');
      cfg().net.ordinary = 9; cfg().net.golden = 8;
      action('net'); ok(cfg().net.ordinary === 9 && cfg().net.golden === 8, 'later A5 upgrade preserves phase 9 and 8');
      // Real admission/claim hooks with bounded, visible controlled item instances.
      a.setTab('floor');
      const sequences = ['CSCSCCSCSC','CCCSCCSCSC','CCCCCCSCSC','CCCCCCCCCC'];
      let now = 0; const clock = a.clock.productionNow; a.clock.productionNow = () => now;
      const item = () => {
        const el = document.createElement('button'); el.style.cssText='position:fixed;left:10px;top:10px;width:44px;height:44px'; document.body.append(el);
        let claims = 0; return {el,valid:()=>el.isConnected,claim:()=>{claims++;el.remove();},claims:()=>claims};
      };
      details.net = [];
      for (let n = 0; n < 4; n++) {
        s().meta.automation = {version:1, ...(n ? {tiers:{version:1,net:n}} : {}), net:{version:n?2:1,enabled:true,ordinary:0,golden:0}}; h.init('test',a);
        for (const kind of ['ordinary','golden']) {
          const caught=[];
          for (let p=0;p<10;p++) {
            const i=item(); h.netCreated(kind,i); h.tick({gameSeconds:.01});
            ok(cfg().net[kind] === (p+1)%(n?10:5), 'phase admission acknowledged');
            now+=999; h.tick({gameSeconds:.01}); ok(i.claims()===0,'manual-first delay');
            now+=1; h.tick({gameSeconds:.01}); caught.push(i.claims()? 'C':'S'); i.el.remove();
          }
          ok(caught.join('')===sequences[n], `tier ${n} ${kind} exact net sequence`);
          details.net.push({level:n,kind,sequence:caught.join('')});
        }
      }
      s().meta.automation = {version:1,net:{version:1,enabled:true,ordinary:0,golden:0}}; s().legacy.stars = 10; h.init('test',a);
      const admitted = item(); h.netCreated('ordinary',admitted); h.tick({gameSeconds:.01});
      ok(cfg().net.ordinary === 1,'live item consumes slot before upgrade');
      Storage.prototype.setItem = function(k,v) {if(k==='imi-ops-v1') throw Error('LG03F net upgrade refusal');return set.call(this,k,v);};
      action('net'); Storage.prototype.setItem=set; h.actions.retry(); now+=1000; h.tick({gameSeconds:1});
      ok(admitted.claims()===0 && cfg().net.ordinary===1 && cfg().net.version===2, 'refused upgrade and Retry never resurrect admitted item');
      h.netBlocked(); admitted.el.remove();
      const pendingItem=item(); h.netCreated('golden',pendingItem); action('net'); now+=1000;h.tick({gameSeconds:1});
      ok(pendingItem.claims()===0 && cfg().net.golden===0,'upgrade cancels unadmitted reference without refund or readmission'); pendingItem.el.remove();
      a.clock.productionNow=clock;
      // Parameterized scheduler, retaining actual dispatch and fair four-service turn.
      const originals = Object.fromEntries(['hireAutomationOne','buyAutomationShopOne','automationCoachTargets','coachAutomationOne','restoreAutomationOne'].map(k=>[k,a[k]]));
      let calls=[];
      a.hireAutomationOne=()=>{calls.push('hire');return true;}; a.buyAutomationShopOne=()=>{calls.push('shop');return true;};
      a.automationCoachTargets=()=>[{ok:true,index:0,paw:0,level:1,coach:0}]; a.coachAutomationOne=()=>{calls.push('coach');return true;}; a.restoreAutomationOne=()=>{calls.push('restore');return true;};
      const desk=a.automationDesks()[0].id;
      for(let n=0;n<4;n++) {
        for(const id of ['hire','shop','coach']) {
          s().meta.automation={version:1,tiers:{version:1,[id]:n},desks:{[desk]:{enabled:id==='hire',reservePercent:25}},shop:{version:1,enabled:id==='shop'},coach:{version:1,enabled:id==='coach'}};
          h.init('clock',a);calls=[];const seconds=[20,15,10,5][n]; h.tick({gameSeconds:seconds-.01});ok(!calls.length,`${id} tier ${n} not early`);h.tick({gameSeconds:.01});ok(calls.join()===id,`${id} tier ${n} exact interval`);
          h.tick({gameSeconds:100});ok(calls.length===2,'no catch-up beyond one service');h.tick({gameSeconds:100,replay:true});ok(calls.length===2,'replay no automation');
        }
      }
      s().meta.automation={version:1,desks:{[desk]:{enabled:true}},shop:{version:1,enabled:true},coach:{version:1,enabled:true},restore:{version:1,enabled:true}};
      h.init('fairness',a);calls=[];h.tick({gameSeconds:20});for(let i=0;i<3;i++)h.tick({gameSeconds:.01});ok(calls.join()==='hire,shop,coach,restore','four helpers fair and one mutation per tick');
      Object.assign(a,originals);
      details.margins=[];
      const wallet=n=>{IMI.bananas.spend(IMI.bananas.get());IMI.bananas.add(n);};
      for(let n=0;n<4;n++) {
        s().meta.automation={version:1,tiers:{version:1,restore:n}};s().desks[0].mk=0;const price=IMI.ops.dev.mkCost(0), threshold=price*[2,1.75,1.5,1][n];
        wallet(threshold-1);ok(!a.restoreAutomationOne(0)&&s().desks[0].mk===0,`A4 tier ${n} below margin refused`);
        wallet(threshold);ok(a.restoreAutomationOne(0)&&s().desks[0].mk===1&&IMI.bananas.get()===threshold-price,`A4 tier ${n} inclusive margin restores`);
        details.margins.push({level:n,price,threshold});
      }
      const plan=TrainingPool.plan([{owned:true,id:desk,letters:{a:100,b:100}}],[{a:80}],{version:1,tiers:{version:1,hire:3},desks:{[desk]:{enabled:false,reservePercent:50}}},100);
      ok(plan.ok&&plan.protected===100&&plan.deductions.every(d=>d.ch!=='a'||d.n<=20),'representative Off donor protects title ingredients and reserve with tiers');
      s().meta.automation={version:1,tiers:{version:1,hire:1},net:{version:1,enabled:false,ordinary:3,golden:4}};s().run.earned=12500000;
      const old=s(), retained=JSON.stringify(cfg()); IMI.ops.dev.doPrint();
      ok(s()!==old&&JSON.stringify(cfg())===retained,'actual Printing replacement retains tiers and legacy phase');
      ok(a.quoteAutomationTier('hire').level===1,'shared reads use replacement S');
      return {checks,details,save:s()};
    });
    for (const [f,h] of Object.entries(loaded)) assert.equal(h,hash(f));
    assert.deepEqual(errors,[]);write(`focused-pass${process.argv[2]||''}`,{result,errors,loaded});console.log(`${result.checks.length} focused checks passed`);
  } catch(e) {write(`focused-failure-${Date.now()}`,{error:e.stack,errors,loaded});throw e;}
  finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
