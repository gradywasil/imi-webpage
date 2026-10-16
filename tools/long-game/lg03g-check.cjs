const fs = require('node:fs'), assert = require('node:assert/strict'), crypto = require('node:crypto');
const pp = require('C:/Users/arran/pp/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js');
const out = 'docs/plan/long-game/evidence/LG-03/implementation-challenges-r1';
const hash = f => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const write = (name, value) => fs.writeFileSync(`${out}/${name}.json`, JSON.stringify(value, null, 2), {flag:'wx'});
const ready = async page => {for(let i=0;i<100;i++){if(await page.evaluate(()=>!!window.IMI?.ops?.dev&&Rewards.owns()))return;await new Promise(r=>setTimeout(r,100));}throw Error('Ops not ready: '+await page.evaluate(()=>document.body.innerText));};
(async () => {
  const browser = await pp.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe', headless:true});
  const errors = [], loaded = {}, reads = [], results = [];
  try {
    const context = await browser.createBrowserContext(), page = await context.newPage();
    await page.setBypassServiceWorker(true); await page.setCacheEnabled(false);
    page.on('pageerror', e => errors.push(e.message));
    page.on('response', r => { const f = new URL(r.url()).pathname.slice(1); if (['ops.js','automation.js','rewards.js','economy.js'].includes(f)) reads.push(r.buffer().then(b => loaded[f] = crypto.createHash('sha256').update(b).digest('hex'))); });
    await page.goto('http://127.0.0.1:8373/tools/balance.html');
    const fixture = await page.evaluate(() => {
      const s = IMI.ops.dev.S(); s.intro.done = s.intro.train = s.intro.words = s.intro.shop = true;
      s.printing = 4; s.legacy = {stars:20,total:30,ups:{crew:1}};
      s.chDone = {vowel:true, haiku:true, hands:true, timed:true};
      for (const g of IMI.ops.extensions.goalAwards?.() || []) s.awards[g.id] = true;
      // Freeze all historical awards before Rewards migration so subsequent checks isolate challenge payouts.
      return s;
    });
    const ops = fs.readFileSync('ops.js','utf8');
    fixture.awards = Object.fromEntries([...ops.matchAll(/AW\('([^']+)',/g)].map(m => [m[1],true]));
    assert.equal(Object.keys(fixture.awards).length,68);
    fixture.lastSeen = 1700001000000;
    await page.evaluateOnNewDocument(s => { window.__LONG_GAME_FIXTURE = {'imi-ops-v1':JSON.stringify(s),'imi-score':JSON.stringify({economyVersion:1,score:0})};for(const [k,v]of Object.entries(__LONG_GAME_FIXTURE))localStorage.setItem(k,v); }, fixture);
    await page.goto('http://127.0.0.1:8373/tools/balance.html?lg03=1&lg01a=1');
    await ready(page);
    console.log(await page.evaluate(()=>({running:IMI.ops.progression.running(),status:document.querySelector('.o-writer-status')?.innerText})));
    const result = await page.evaluate(() => {
      const a = IMI.ops.extensions, d = IMI.ops.dev, h = __OPS_EXTENSIONS.find(([id]) => id === 'automation')[1], checks = [], details = {};
      const s = () => a.state(), ok = (v,label) => { if (!v) throw Error(label); checks.push(label); };
      const dismiss = () => document.querySelectorAll('.o-modal,.o-celebrate').forEach(el => el.remove());
      const step = () => { __advance(1100); d.tick(); dismiss(); };
      const titles = d.RECIPES.filter(r => !r.kid && !r.lib && !r.gen);
      const sold = n => { s().written = Object.fromEntries(titles.slice(0,n).map(r => [r.id,true])); d.touchBank(); };
      const wallet = n => { IMI.bananas.spend(IMI.bananas.get()); IMI.bananas.add(n); };
      const start = id => { s().run.earned = 12500000; d.doPrint(id); dismiss(); ok(s().challenge?.id === id, id+' actual Printing entry'); };
      const cfg = () => s().meta.automation;
      const baseDB = s().prem.earnedTotal; ok(baseDB === 109, 'historical fixed DB pool remains 109');
      const old = s(); s().printing = 3; s().run.earned = 12500000; d.doPrint('smallcrew'); ok(s() === old && !s().challenge, 'actual entry refuses before displayed Printing 5');
      s().printing = 4; s().intro.done = false; d.doPrint('smallcrew'); ok(s() === old, 'actual entry rechecks introduction'); s().intro.done = true;
      s().run.earned = 0; d.doPrint('smallcrew'); ok(s() === old, 'actual entry requires one star');
      start('smallcrew');
      s().desks[0].letters = {A:1000000}; d.buyUp('paw',0,Infinity); ok(s().desks[0].paws === 2, 'Small Crew Max stops at two including Veteran Crew');
      ok(!a.hireAutomationOne(0,0) && /Small Crew/.test(a.quoteAutomationHire(0,0).error), 'automatic hire shares cap and feedback');
      const beforeFing = s().desks[0].up.fing; d.buyUp('fing',0,1); ok(s().desks[0].up.fing === beforeFing+1, 'Small Crew permits speed training');
      wallet(1e10); d.buy('desk',1); ok(s().desks[1].owned && s().desks[1].paws === 1,'Small Crew permits new desk');
      s().desks[1].letters = {A:100000}; d.buyUp('paw',1,10); ok(s().desks[1].paws === 2,'Buy 10 shares two-typist cap');
      const desk = a.automationDesks()[1].id;
      s().meta.automation = {version:1,desks:{[desk]:{enabled:true,reservePercent:0}}}; h.init('fixture',a); h.tick({gameSeconds:20}); ok(s().desks[1].paws===2,'scheduler cannot exceed Small Crew cap');
      IMI.ops.simulateAway(20); ok(s().desks.every(x=>!x.owned||x.paws<=2),'away preserves Small Crew cap');
      const finish = (id,n,helper,level=1) => {
        sold(n-1); step(); ok(s().challenge?.id===id,id+' incomplete at target minus one');
        sold(n); const stars=s().legacy.stars,total=s().legacy.total,db=s().prem.earnedTotal;
        step(); const c=s().rewards.claims['challenge:'+id+':first'];
        ok(!s().challenge&&s().chDone[id],id+' actual soldCount/checkChallenge completion at '+n);
        ok(cfg().tiers[helper]===level,id+' retained first-clear tier floor');
        ok(s().legacy.stars===stars&&s().legacy.total===total&&s().prem.earnedTotal===db,id+' no new stars or DB');
        ok(c?.status==='committed'&&c.descriptor.kind==='L'&&c.descriptor.minutes===3&&c.descriptor.floor===50&&c.descriptor.cap===5000&&c.descriptor.amount===Math.floor(Math.max(50,Math.min(5000,180*c.descriptor.rate))),id+' exact locked Letters receipt');
        const durable=JSON.parse(localStorage.getItem('imi-ops-v1'));
        ok(durable.chDone[id]&&durable.meta.automation.tiers[helper]===level&&durable.rewards.claims['challenge:'+id+':first'].status==='committed',id+' completion tier and claim acknowledged together');
        details[id]={target:n,helper,claim:c,stars,total,db};
      };
      finish('smallcrew',6,'hire');
      start('quietshop'); ok(!s().hold&&s().desks[0].paws===2,'Quiet Shop suppresses inherited Veteran Crew Hold only');
      wallet(1e10); d.buy('desk',1); d.buy('desk',2); sold(2);
      for(const key of ['hold','contracts','metro','dbl','agent','analyst']) { d.buy(key); ok(!s()[key]&&!a.buyAutomationShopOne(key)&&a.quoteAutomationShop(key).error==='Blocked by Quiet Shop',key+' manual and automatic acquisition refused'); }
      s().meta.automation={version:1,shop:{version:1,enabled:true}};h.init('fixture',a);h.tick({gameSeconds:20});ok(!s().hold&&!s().contracts,'Quiet Shop scheduler shares shop refusal');
      const rate=d.autoRate(s().desks[0]), pay=d.salePay(titles[0],1); s().market.v[0]=.5;
      for(const key of ['hold','contracts','metro','dbl','agent','analyst'])s()[key]=true;
      ok(d.autoRate(s().desks[0])===rate&&d.salePay(titles[0],1)===pay&&d.marketMult(0)===.5,'loaded Quiet Shop tools have no speed contracts or agent effects');
      a.setTab('floor');const letters=s().stats.manual;document.getElementById('oStage').dispatchEvent(new KeyboardEvent('keydown',{key:' ',bubbles:true,cancelable:true}));__advance(1000);document.dispatchEvent(new KeyboardEvent('keyup',{key:' ',bubbles:true}));ok(s().stats.manual-letters<=1,'inherited Hold cannot repeat manual input');
      IMI.ops.simulateAway(20); ok(s().challenge?.id==='quietshop','Quiet Shop away path completes without tool acquisition');
      finish('quietshop',6,'shop');
      ok(d.autoRate(s().desks[0])>rate,'Quiet Shop constraint lifts on clear');
      start('patientpress');wallet(1e10);sold(3);d.buy('pub');ok(s().pub.tier===0,'Patient Press Publisher purchase disabled');
      s().pub={tier:3,on:true,rule:'any'};const r=titles.find(r=>!s().written[r.id]&&r.band===0);Object.assign(s().bank,r.need);d.touchBank();
      ok(!d.pubSell()&&!s().written[r.id],'Patient Press actual Publisher sale blocked');
      d.writeTitle(r.id,null,{auto:true});ok(!s().written[r.id],'Patient Press automatic write seam blocked');
      IMI.ops.simulateAway(60);ok(!s().written[r.id],'Patient Press away Publisher blocked');
      d.writeTitle(r.id);ok(s().written[r.id],'Patient Press manual sale allowed');
      finish('patientpress',8,'coach');
      start('baremetal'); wallet(1e10);d.buy('mk',0);ok(s().desks[0].mk===0&&!a.restoreAutomationOne(0)&&a.quoteAutomationRestore(0).error==='Blocked by Bare Metal','Bare Metal manual and automation restoration blocked');
      s().meta.automation.restore={version:1,enabled:true};h.init('fixture',a);h.tick({gameSeconds:20});ok(s().desks[0].mk===0,'Bare Metal scheduler shares restoration refusal');
      d.buy('desk',1);ok(s().desks[1].owned,'Bare Metal new desks allowed');IMI.ops.simulateAway(20);ok(s().desks[0].mk===0,'Bare Metal away does not restore');
      // Controlled higher purchased level verifies max(current,1), with unrelated metadata retained.
      s().meta.automation.tiers.restore=3;s().meta.automation.unknown={preserve:true};
      finish('baremetal',8,'restore',3);ok(cfg().unknown.preserve,'floor preserves unknown supported metadata');
      const claims=JSON.stringify(s().rewards.claims), tier=cfg().tiers.restore;
      start('baremetal');sold(8);step();ok(!s().challenge&&JSON.stringify(s().rewards.claims)===claims&&cfg().tiers.restore===tier,'replay creates no extra claim or grant');
      // One real Ops storage refusal before challenge preparation. Retry uses its locked descriptor.
      delete s().chDone.smallcrew;delete s().rewards.claims['challenge:smallcrew:first'];cfg().tiers.hire=0;
      start('smallcrew');sold(6);Rewards.checkpoint();const before=JSON.parse(localStorage.getItem('imi-ops-v1')), set=Storage.prototype.setItem;
      Storage.prototype.setItem=function(k,v){if(k==='imi-ops-v1')throw Error('LG03G deliberate challenge preparation refusal');return set.call(this,k,v);};
      step();const durable=JSON.parse(localStorage.getItem('imi-ops-v1'));
      ok(Rewards.held()&&!IMI.ops.progression.running()&&!durable.chDone.smallcrew&&durable.meta.automation.tiers.hire===0,'refused prepare keeps durable completion and floor together at old state');
      Storage.prototype.setItem=set;ok(Rewards.retry(),'challenge Retry settles existing reward flow');
      const settled=JSON.parse(localStorage.getItem('imi-ops-v1'));ok(settled.chDone.smallcrew&&settled.meta.automation.tiers.hire===1&&settled.rewards.claims['challenge:smallcrew:first'].status==='committed','Retry durably settles floor completion and Letters');
      const after=JSON.stringify(s().rewards.claims);Rewards.retry();ok(JSON.stringify(s().rewards.claims)===after,'duplicate Retry gives no extra reward');
      details.refusal={beforeChallenge:before.challenge,after:settled.rewards.claims['challenge:smallcrew:first']};
      ok(!a.commitAutomation(JSON.stringify(cfg()),{...cfg(),tiers:{...cfg().tiers,hire:3}}).ok,'ordinary configuration still cannot write paid tiers');
      s().chDone.hands=false;ok(!a.quoteAutomationTier('coach').ok,'earned coach floor does not bypass No Hands base gate');s().chDone.hands=true;
      return {checks,details,save:s(),score:localStorage.getItem('imi-score')};
    });
    results.push(result);
    // Reload exact durable candidate without replaying the generated starting fixture.
    await page.evaluateOnNewDocument(f => {window.__LONG_GAME_FIXTURE=f;}, {'imi-ops-v1':JSON.stringify(result.save),'imi-score':result.score});
    await page.reload();await ready(page);
    const reloaded=await page.evaluate(()=>({done:IMI.ops.dev.S().chDone,tiers:IMI.ops.dev.S().meta.automation.tiers,claims:IMI.ops.dev.S().rewards.claims}));
    assert.deepEqual(reloaded.done,result.save.chDone);assert.deepEqual(reloaded.tiers,result.save.meta.automation.tiers);assert.deepEqual(reloaded.claims,result.save.rewards.claims);
    await Promise.all(reads);for(const [f,h]of Object.entries(loaded))assert.equal(h,hash(f));assert.deepEqual(errors,[]);
    write('focused-'+(process.argv[2]||'initial')+'-pass',{qualification:'Actual components with labelled controlled sold records, not natural completion. Balance bridge is simulated; no physical-device or pacing claim.',results,reloaded,loaded,errors});console.log(result.checks.length+' focused checks plus reload passed');
  } catch(error) {write('focused-first-failure-'+Date.now(),{error:error.stack,results,loaded,errors});throw error;}
  finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
