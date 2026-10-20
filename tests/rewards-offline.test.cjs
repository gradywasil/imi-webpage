const { test,before,after } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
let h,browser;
before(async () => { h=await import('../tools/long-game/lg01-b-fixture.mjs'); browser=await h.browser(); });
after(async () => { await browser?.close(); });
const ids = () => [...readFileSync('docs/plan/long-game/LG-01-reward-design.md','utf8').matchAll(/^\| (\w+) \| .*? \| (?:Bronze|Silver|Gold) \| [LCGD]/gm)].map(m=>m[1]);
async function ready(speed=1) {
  const records = await h.records({ awards:Object.fromEntries(ids().filter(id=>id!=='g1').map(id=>[id,true])), printing:1,
    chDone:{ vowel:true,haiku:true,hands:true,timed:true },divs:{ songs:1,tv:0,radio:0,sketch:0,film:0 }, intro:{ version:1,done:true,train:true,words:true,shop:true,hireAt:0 } });
  const f=await h.fixture(browser,{ records,speed });
  await f.page.evaluate(() => { const api=IMI.ops.extensions; api.state().awards.g1=true;
    __OPS_EXTENSIONS.find(([id])=>id==='rewards')[1].award({ id:'g1',tier:0,silent:true },api); });
  return f;
}

for (const speed of [.5,1,1.25,2]) test('stored gold integrates an online frame expiry and exact away duration at speed '+speed,async()=>{
  const online=await ready(speed), away=await ready(speed);
  try {
    const live=await online.page.evaluate(speed=>{
      const d=IMI.ops.dev, stats=JSON.stringify(d.S().stats), caught=d.S().gold;
      const recipe=d.RECIPES.find(r=>!r.kid&&!r.lib&&!r.gen);d.S().written[recipe.id]=true;d.touchBank();
      const royalty=d.royBase(),base=d.divBase()+royalty; const activated=Rewards.activate();const displayedRate=IMI.ops.royRate(); __advance(14975/speed);
      const before=d.S().rewards.activeGold.remainingGameMs;
      __advance(100/speed); const active=d.S().rewards.activeGold;
      __advance(1000/speed); const paid=IMI.bananas.get();
      return { activated,displayedRate,royalty,before,active,paid,base,endBase:d.divBase()+d.royBase(),elapsed:__vnow()-1e6,caught:d.S().gold-caught,
        typed:d.S().stats.letters,manual:d.S().stats.manual,tokens:d.S().rewards.storedGold.tokens };
    },speed);
    await h.capture(online,'gold-online-'+speed);
    assert.equal(live.activated,true); assert.ok(live.before>0 && live.before<=125,JSON.stringify(live));
    assert.equal(live.displayedRate,live.royalty*7);
    assert.equal(live.active,null); assert.equal(live.caught,0); assert.equal(live.typed,0); assert.equal(live.manual,0);
    // Flush the last boosted payout interval, then bound the existing ordinary fractional accumulator.
    const target=live.base*(Math.floor(live.elapsed/50)*.05*speed+90);
    assert.ok(Math.abs(live.paid-target)<25+live.base*(.25+.05*speed),JSON.stringify({live,target}));
    assert.equal(live.tokens['award:g1'].status,'consumed');
    const offline=await away.page.evaluate(speed=>{
      const d=IMI.ops.dev, base=d.divBase(), stats=JSON.stringify(d.S().stats); Rewards.activate();
      __skip(40000/speed); const rep=IMI.ops.simulateAway(40/speed);
      return { rep,base,eff:d.awayEff(),active:d.S().rewards.activeGold,gold:d.S().gold,
        typed:d.S().stats.letters,manual:d.S().stats.manual,persisted:JSON.parse(localStorage.getItem('imi-ops-v1')) };
    },speed);
    assert.equal(offline.rep.div,Math.floor(offline.base*130*offline.eff/25)*25);
    assert.equal(offline.active,null); assert.equal(offline.gold,0); assert.equal(offline.typed,0); assert.equal(offline.manual,0);
    assert.equal(offline.persisted.rewards.awayCheckpoint,undefined);
    assert.deepEqual(online.errors,[]); assert.deepEqual(away.errors,[]);
    await h.capture(away,'gold-away-'+speed);
  } finally { await online.close(); await away.close(); }
});

test('native overlap uses max seven, independent timers, Critic half, cap and efficiency affect only permitted work',async()=>{
  const f=await ready(.5);
  try {
    const result=await f.page.evaluate(()=>{
      const d=IMI.ops.dev; d.buffs.rush=performance.now()+10000;
      const blocked=Rewards.activate(); d.buffs.rush=0; const activated=Rewards.activate();
      d.buffs.rush=performance.now()+30000; d.buffs.critic=performance.now()+10000;
      const base=d.divBase(), eff=d.awayEff(); __skip(80000);
      // Explicit current-native fixture restores the independent remainders at the away seam.
      d.buffs.rush=performance.now()+30000; d.buffs.critic=performance.now()+10000;
      const rep=IMI.ops.simulateAway(80);
      return { blocked,activated,base,eff,rep,active:d.S().rewards.activeGold };
    });
    assert.equal(result.blocked,false); assert.equal(result.activated,true);
    const seconds=40+6*30-.5*10-3*10;
    assert.equal(result.rep.div,Math.floor(result.base*seconds*result.eff/25)*25);
    assert.equal(result.active,null); await h.capture(f,'gold-native-overlap');
    const capped=await ready(.5);
    try {
      const value=await capped.page.evaluate(()=>{ const d=IMI.ops.dev; Rewards.activate(); const cap=d.awayCap(); __skip((cap+1000)*1000);
        const base=d.divBase(),rep=IMI.ops.simulateAway(cap+1000); return { base,rep,cap,eff:d.awayEff(),active:d.S().rewards.activeGold }; });
      assert.equal(value.rep.counted,value.cap); assert.equal(value.rep.div,Math.floor(value.base*(value.cap*.5+90)*value.eff/25)*25);
      assert.equal(value.active,null); await h.capture(capped,'gold-capped');
    } finally { await capped.close(); }
  } finally { await f.close(); }
});

test('activation rejection gives no consumption; fixed Retry, reload and Printing preserve inventory and end active rush',async()=>{
  const f=await ready();
  try {
    const initial=await f.page.evaluate(()=>{ __fault={ stage:'committed',claim:'award:g1',remaining:1 }; const result=Rewards.activate();
      return { result,s:IMI.ops.dev.S(),running:IMI.ops.progression.running() }; });
    assert.equal(initial.result,false); assert.equal(initial.s.rewards.activeGold,undefined); assert.equal(initial.s.rewards.storedGold.tokens['award:g1'].status,'stored');
    assert.equal(initial.running,false); await h.capture(f,'gold-activation-failure');
    assert.equal(await f.page.evaluate(()=>{ __fault=null; return Rewards.retry(); }),true);
    const before=await f.page.evaluate(()=>{ __advance(5000); IMI.ops.extensions.save(); return { 'imi-score':localStorage.getItem('imi-score'),'imi-ops-v1':localStorage.getItem('imi-ops-v1') }; });
    const reload=await h.fixture(browser,{ records:before });
    try {
      assert.equal(await reload.page.evaluate(()=>IMI.ops.dev.S().rewards.activeGold.remainingGameMs),10000);
      const print=await reload.page.evaluate(()=>{ const d=IMI.ops.dev; d.S().run.earned=Economy.cash(5e5); d.doPrint();
        return { printing:d.S().printing,active:d.S().rewards.activeGold,token:d.S().rewards.storedGold.tokens['award:g1'],earned:d.S().prem.earned }; });
      assert.equal(print.printing,2); assert.equal(print.active,null); assert.equal(print.token.status,'consumed'); assert.equal(print.earned,109);
      await h.capture(reload,'gold-printing');
    } finally { await reload.close(); }
  } finally { await f.close(); }
});

test('captured away wallet checkpoint reload cannot replay paid income or already-counted production',async()=>{
  const f=await ready(2);
  try {
    const stopped=await f.page.evaluate(()=>{
      const d=IMI.ops.dev; d.S().desks[0].paws=1; d.ensureCrew(d.S().desks[0]); Rewards.activate();
      __fault={ stage:'away-commit',remaining:1 }; __skip(60000); IMI.ops.simulateAway(60);
      return { running:IMI.ops.progression.running(),records:{ 'imi-score':localStorage.getItem('imi-score'),'imi-ops-v1':localStorage.getItem('imi-ops-v1') },s:d.S(),wallet:IMI.bananas.get() };
    });
    assert.equal(stopped.running,false); assert.ok(stopped.s.rewards.awayCheckpoint.credit); await h.capture(f,'away-interrupted');
    const reload=await h.fixture(browser,{ records:stopped.records,speed:2 });
    try {
      const value=await reload.page.evaluate(()=>({ s:IMI.ops.dev.S(),wallet:IMI.bananas.get(),running:IMI.ops.progression.running() }));
      assert.equal(value.running,true); assert.equal(value.s.rewards.awayCheckpoint,undefined); assert.equal(value.wallet,stopped.wallet);
      assert.equal(value.s.run.earned,value.wallet); assert.equal(value.s.stats.letters,stopped.s.stats.letters);
      assert.deepEqual(value.s.desks[0].letters,stopped.s.desks[0].letters); assert.equal(value.s.divTotal,stopped.s.divTotal);
      assert.equal(value.s.rewards.activeGold,null); assert.deepEqual(reload.errors,[]); await h.capture(reload,'away-checkpoint-reloaded');
    } finally { await reload.close(); }
  } finally { await f.close(); }
});

for(const speed of [1,2])test('original batch production/keeper/RNG conservation against sealed before source at '+speed,async()=>{
  const input=await h.records({ awards:Object.fromEntries(ids().map(id=>[id,true])),printing:1,chDone:{ vowel:true,haiku:true,hands:true,timed:true },intro:{ version:1,done:true,train:true,words:true,shop:true,hireAt:0 } });
  const control=await h.fixture(browser,{ records:input,speed,frozen:true,rngStart:0 }),candidate=await h.fixture(browser,{ records:input,speed,rngStart:0 });
  const run=async f=>f.page.evaluate(()=>{const d=IMI.ops.dev,s=d.S();s.desks[0].paws=3;d.ensureCrew(s.desks[0]);s.desks[0].keeper.def=20;
    if(__fixtureSpeed!==1)s.challenge={id:'timed',start:Date.now()-1150000};__skip(60000);const rep=IMI.ops.simulateAway(60);
    return {rep,letters:s.desks[0].letters,crew:s.desks[0].crew,bank:s.bank,tray:s.desks[0].tray,market:s.market,stats:s.stats,rng:__rngcount,challenge:s.challenge};});
  try{const a=await run(control),b=await run(candidate);
    // Untimed away keepers now work down a queue of the next titles (planAway) instead of stalling on a ready goal, so the bank and the
    // letters left in the drawers may differ from the sealed source; the tray rebuilt from those letters then shuffles a different number of
    // times, which moves the RNG and the market roll after it. Typing, crew levels and timed runs are still conserved exactly.
    if(speed===1){const pick=v=>({typed:v.rep.letters,crew:v.crew,letters:v.stats.letters,challenge:v.challenge});
      assert.deepEqual(pick(b),pick(a));assert.ok(b.rep.words>=a.rep.words,'away keepers bank at least as many words as before');}
    else assert.deepEqual(b,a);assert.deepEqual(control.errors,[]);assert.deepEqual(candidate.errors,[]);
    await h.capture(control,'conserved-before-'+speed);await h.capture(candidate,'conserved-candidate-'+speed);
  }finally{await control.close();await candidate.close();}
});

test('timed first-clear failure checkpoints a production prefix, and captured continuation matches an uninterrupted real caller',async()=>{
  const first=await h.fixture(browser,{records:await h.records()});let input;
  try{input=await first.page.evaluate(()=>{
    const s=IMI.ops.dev.S(),books=IMI.ops.dev.RECIPES.filter(r=>!r.kid&&!r.lib&&!r.gen),r=books[7];s.written=Object.fromEntries(books.slice(0,7).map(r=>[r.id,true]));
    s.intro={version:1,done:true,train:true,words:true,shop:true,hireAt:0};s.awards={};s.chDone={vowel:true,haiku:true,hands:true};s.printing=1;s.rewards={};s.prem={};
    s.pub={tier:3,on:true,rule:'any'};s.bank={...r.need};s.challenge={id:'timed',start:Date.now()};
    s.desks[0].paws=2;IMI.ops.dev.ensureCrew(s.desks[0]);s.desks[0].keeper.on=false;
    return {'imi-score':JSON.stringify({economyVersion:1,score:0}),'imi-ops-v1':JSON.stringify(s)};
  });}finally{await first.close();}
  const parsed=JSON.parse(input['imi-ops-v1']);parsed.awards=Object.fromEntries(ids().map(id=>[id,true]));input['imi-ops-v1']=JSON.stringify(parsed);
  const control=await h.fixture(browser,{records:input,speed:2,rngStart:0}),interrupted=await h.fixture(browser,{records:input,speed:2,rngStart:0});
  try{
    const whole=await control.page.evaluate(()=>{__skip(60000);const rep=IMI.ops.simulateAway(60);return {rep,s:IMI.ops.dev.S(),wallet:IMI.bananas.get(),rng:__workRngCount};});
    const partial=await interrupted.page.evaluate(()=>{__fault={stage:'committed',claim:'challenge:timed:first',remaining:1};__skip(60000);IMI.ops.simulateAway(60);
      return {s:IMI.ops.dev.S(),rng:__rngcount,running:IMI.ops.progression.running(),records:{'imi-score':localStorage.getItem('imi-score'),'imi-ops-v1':localStorage.getItem('imi-ops-v1')}};});
    assert.equal(partial.running,false);assert.ok(partial.s.rewards.awayCheckpoint.st < 3);assert.equal(partial.s.rewards.claims['challenge:timed:first'].status,'prepared');
    assert.ok(partial.s.stats.letters < whole.s.stats.letters);await h.capture(interrupted,'timed-prefix-checkpoint');
    const bad=JSON.parse(partial.records['imi-ops-v1']);bad.rewards.awayCheckpoint.budgets[0]=null;
    const missing=await h.fixture(browser,{records:{...partial.records,'imi-ops-v1':JSON.stringify(bad)},speed:2,rngStart:partial.rng});
    try{assert.equal(await missing.page.evaluate(()=>IMI.ops.progression.running()),false);assert.equal(await missing.page.evaluate(()=>IMI.ops.dev.S().stats.letters),partial.s.stats.letters);await h.capture(missing,'missing-away-sample-held');}
    finally{await missing.close();}
    const reload=await h.fixture(browser,{records:partial.records,speed:2,rngStart:partial.rng});
    try{const resumed=await reload.page.evaluate(()=>({s:IMI.ops.dev.S(),wallet:IMI.bananas.get(),rng:__workRngCount,running:IMI.ops.progression.running()}));
      await h.capture(reload,'timed-prefix-reloaded');await h.capture(control,'timed-uninterrupted');
      assert.equal(resumed.running,true);assert.equal(resumed.s.rewards.awayCheckpoint,undefined);assert.equal(resumed.s.prem.earned,whole.s.prem.earned);
      assert.equal(resumed.s.stats.letters,whole.s.stats.letters);assert.deepEqual(resumed.s.desks[0].letters,whole.s.desks[0].letters);assert.deepEqual(resumed.s.desks[0].crew,whole.s.desks[0].crew);
      assert.deepEqual(resumed.s.bank,whole.s.bank);assert.deepEqual(resumed.s.market,whole.s.market);assert.equal(resumed.wallet,whole.wallet);assert.equal(resumed.rng,whole.rng);
      assert.deepEqual(reload.errors,[]);
    }finally{await reload.close();}
  }finally{await control.close();await interrupted.close();}
});

test('online native Rush and Critic expire independently of the stored remainder without x49',async()=>{
  const f=await ready(1.25);
  try{
    const result=await f.page.evaluate(()=>{const d=IMI.ops.dev;Rewards.activate();d.buffs.rush=performance.now()+30000;d.buffs.critic=performance.now()+5000;
      __advance(15100/1.25);const middle={active:d.S().rewards.activeGold,rush:d.buffOn('rush'),critic:d.buffOn('critic')};
      __advance(15100/1.25);return {middle,after:d.buffOn('rush'),gold:d.S().gold,typed:d.S().stats.letters};});
    assert.equal(result.middle.active,null);assert.equal(result.middle.rush,true);assert.equal(result.middle.critic,false);assert.equal(result.after,false);assert.equal(result.gold,0);assert.equal(result.typed,0);await h.capture(f,'native-timers-independent');
  }finally{await f.close();}
});
