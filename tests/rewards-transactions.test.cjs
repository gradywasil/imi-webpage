const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
let h, browser;
before(async () => { h = await import('../tools/long-game/lg01-b-fixture.mjs'); browser = await h.browser(); });
after(async () => { await browser?.close(); });
const catalogue = () => [...readFileSync('docs/plan/long-game/LG-01-reward-design.md','utf8').matchAll(/^\| (\w+) \| (.*?) \| (Bronze|Silver|Gold) \| ([LCGD])/gm)]
  .map(([,id,name,tier,kind]) => ({ id,name,tier:['Bronze','Silver','Gold'].indexOf(tier),kind }));

test('all 68 actual award descriptors and 73 historical claims preserve source and allocate exactly 109 earned DB', async () => {
  const rows = catalogue(); assert.equal(rows.length,68);
  const input = await h.records({ awards:Object.fromEntries(rows.map(r => [r.id,true])), chDone:{ vowel:true,haiku:true,hands:true,timed:true }, printing:1,
    prem:{ bought:17,boughtTotal:17,credits:{ 'receipt:old':{ source:'bought',amount:17,unknown:'retain' } },future:{ keep:1 } }, rewards:{ future:'retain' }, meta:{ unknown:'retain' } });
  const f = await h.fixture(browser,{ records:input });
  try {
    const value = await f.page.evaluate(() => ({ descriptors:IMI.ops.extensions.rewardAwards(), s:IMI.ops.dev.S(), wallet:IMI.bananas.get() }));
    assert.deepEqual(value.descriptors, rows.map(({id,name,tier}) => ({id,name,tier})));
    assert.equal(Object.keys(value.s.rewards.claims).length,73);
    assert.equal(value.s.prem.earned,109); assert.equal(value.s.prem.earnedTotal,109); assert.equal(value.s.prem.bought,17);
    assert.equal(value.s.prem.credits['receipt:old'].unknown,'retain'); assert.equal(value.s.rewards.future,'retain'); assert.equal(value.s.meta.unknown,'retain');
    assert.equal(value.wallet,0); assert.deepEqual(value.s.rewards.storedGold.tokens,{});
    for (const row of rows) assert.equal(value.s.rewards.claims['award:'+row.id].status,row.kind === 'D' ? 'committed' : 'waived');
    const capture = await h.capture(f,'historical-all');
    const saved = { 'imi-score':JSON.stringify(capture.wallet), 'imi-ops-v1':JSON.stringify(capture.persistedOps) };
    const reload = await h.fixture(browser,{ records:saved });
    try { assert.equal(await reload.page.evaluate(() => IMI.ops.dev.S().prem.earned),109); assert.deepEqual(reload.errors,[]); await h.capture(reload,'historical-reload'); }
    finally { await reload.close(); }
    assert.deepEqual(f.errors,[]);
  } finally { await f.close(); }
});

test('every live assignment uses the actual module, stable ID and approved locked formula', async () => {
  const f = await h.fixture(browser);
  try {
    const rows = catalogue();
    const result = await f.page.evaluate(rows => {
      const api = IMI.ops.extensions, hook = __OPS_EXTENSIONS.find(([id]) => id === 'rewards')[1], before = JSON.stringify(IMI.ops.dev.S().stats);
      let random = 0; const original = Math.random; Math.random = () => { random++; return original(); };
      for (const r of rows) { api.state().awards[r.id] = true; hook.award({ id:r.id,tier:r.tier,silent:true },api); }
      for (const id of ['vowel','haiku','hands','timed']) { api.state().chDone[id] = true; hook.challenge({ id,kind:'done',first:true },api); }
      api.state().printing = 1; hook.reset({ kind:'printing',previousPrinting:0 },api);
      const once = JSON.stringify(api.state());
      for (const r of rows) hook.award({ id:r.id,tier:r.tier,silent:false },api);
      hook.challenge({ id:'timed',kind:'done',first:false },api); hook.reset({ kind:'printing',previousPrinting:1 },api);
      Math.random = original;
      return { s:api.state(),statsUnchanged:before === JSON.stringify(api.state().stats), duplicateUnchanged:once === JSON.stringify(api.state()),random,wallet:IMI.bananas.get() };
    },rows);
    assert.equal(result.s.prem.earned,109); assert.equal(Object.keys(result.s.rewards.claims).length,73);
    assert.equal(result.random,0); assert.equal(result.statsUnchanged,true); assert.equal(result.duplicateUnchanged,true);
    let cash = 0, letters = 0, tokens = 0;
    for (const row of rows) {
      const c = result.s.rewards.claims['award:'+row.id]; assert.equal(c.status,'committed'); assert.equal(c.descriptor.kind,row.kind);
      if (row.kind === 'L') { assert.equal(c.descriptor.amount,50); assert.equal(c.descriptor.desk,0); letters += 50; }
      if (row.kind === 'C') { assert.equal(c.descriptor.amount,6250); assert.equal(c.deltaApplied,true); cash += 6250; }
      if (row.kind === 'G') tokens++;
    }
    assert.equal(result.wallet,cash); assert.equal(result.s.run.earned,cash);
    assert.equal(Object.values(result.s.desks[0].letters).reduce((a,b) => a+b,0),letters);
    assert.equal(Object.keys(result.s.rewards.storedGold.tokens).length,tokens);
    assert.deepEqual(f.errors,[]); await h.capture(f,'live-all');
  } finally { await f.close(); }
});

for (const stage of ['prepared','wallet','committed']) test('cash caller failure and same-process fixed Retry at '+stage, async () => {
  const f = await h.fixture(browser);
  try {
    const failed = await f.page.evaluate(stage => {
      const d = IMI.ops.dev, s = d.S(), recipe = d.RECIPES.find(r => !r.kid && !r.lib && !r.gen);
      s.intro.done = true; for (const [word,n] of Object.entries(recipe.need)) s.bank[word] = n;
      d.writeTitle(recipe.id,null,{ silent:true });
      window.__fault = { stage,claim:'award:s1',remaining:1 };
      d.checkAwards(true);
      return { s:d.S(),wallet:IMI.bananas.get(),run:d.S().run.earned,running:IMI.ops.progression.running(),persisted:JSON.parse(localStorage.getItem('imi-ops-v1')) };
    },stage);
    assert.equal(failed.running,false); assert.equal(failed.s.awards.s1,true);
    const pending = failed.s.rewards.claims['award:s1'];
    assert.equal(stage === 'prepared' ? pending === undefined : pending.status === 'prepared',true);
    const paid = stage === 'committed' ? 6250 : 0;
    assert.equal(failed.wallet - failed.run,paid);
    await h.capture(f,'cash-'+stage+'-failure');
    const final = await f.page.evaluate(() => { __fault = null; const s = IMI.ops.dev.S(); s.run.earned += 333;
      const retry = Rewards.retry(); return { retry,s:IMI.ops.dev.S(),wallet:IMI.bananas.get() }; });
    assert.equal(final.retry,true); assert.equal(final.s.rewards.claims['award:s1'].status,'committed');
    assert.equal(final.s.rewards.claims['award:s1'].descriptor.amount,6250);
    assert.equal(final.wallet,failed.run+6250); assert.equal(final.s.run.earned,failed.run+6250+333);
    assert.equal(final.s.rewards.claims['award:s1'].deltaApplied,true);
    const again = await f.page.evaluate(() => { IMI.ops.dev.checkAwards(true); return IMI.bananas.get(); }); assert.equal(again,final.wallet);
    assert.deepEqual(f.errors,[]); await h.capture(f,'cash-'+stage+'-retry');
  } finally { await f.close(); }
});

test('cash reload applies only missing current-run delta, never the preparation run snapshot', async () => {
  const f = await h.fixture(browser);
  try {
    await f.page.evaluate(() => { const s=IMI.ops.dev.S(); s.awards.s1=true; __fault={ stage:'committed',claim:'award:s1',remaining:1 };
      __OPS_EXTENSIONS.find(([id]) => id === 'rewards')[1].award({ id:'s1',tier:0,silent:true },IMI.ops.extensions); });
    const frozen = await h.capture(f,'cash-reload-checkpoint');
    frozen.persistedOps.run.earned = 9000; frozen.persistedOps.meta.currentRunWitness='keep';
    const reload = await h.fixture(browser,{ records:{ 'imi-score':JSON.stringify(frozen.wallet),'imi-ops-v1':JSON.stringify(frozen.persistedOps) } });
    try {
      const value = await reload.page.evaluate(() => ({ s:IMI.ops.dev.S(),wallet:IMI.bananas.get() }));
      assert.equal(value.wallet,6250); assert.equal(value.s.run.earned,15250); assert.equal(value.s.meta.currentRunWitness,'keep');
      assert.equal(value.s.rewards.claims['award:s1'].deltaApplied,true);
      assert.deepEqual(reload.errors,[]); await h.capture(reload,'cash-reloaded');
    } finally { await reload.close(); }
  } finally { await f.close(); }
});

test('migration failure pauses before startup, and later missing durable L/C samples hold for repair', async () => {
  const f = await h.fixture(browser,{ records:await h.records({ stats:{ letters:100,words:0,byLetter:{} } }),fault:{ stage:'migration',remaining:1 } });
  try {
    assert.equal(await f.page.evaluate(() => IMI.ops.progression.running()),false);
    assert.deepEqual(await f.page.evaluate(() => IMI.ops.dev.S().awards),{});
    await h.capture(f,'migration-failure');
    assert.equal(await f.page.evaluate(() => { __fault=null; return Rewards.retry(); }),true);
    assert.equal(await f.page.evaluate(() => IMI.ops.dev.S().rewards.claims['award:l100'].origin),'new');
    const input = await f.page.evaluate(() => { const s=JSON.parse(localStorage.getItem('imi-ops-v1')); delete s.rewards.claims['award:l100'];
      return { 'imi-score':localStorage.getItem('imi-score'),'imi-ops-v1':JSON.stringify(s) }; });
    const broken = await h.fixture(browser,{ records:input });
    try { assert.equal(await broken.page.evaluate(() => IMI.ops.progression.running()),false); assert.equal(await broken.page.evaluate(() => IMI.ops.dev.S().rewards.claims['award:l100']),undefined); await h.capture(broken,'missing-sample-hold'); }
    finally { await broken.close(); }
  } finally { await f.close(); }
});

for (const speed of [.5,1,1.25,2]) test('actual sustained rates, lucky expectation, highest desk and all tier bounds at '+speed, async () => {
  const f=await h.fixture(browser,{ speed });
  try {
    const value=await f.page.evaluate(()=>{
      const api=IMI.ops.extensions,d=IMI.ops.dev,s=d.S(),hook=__OPS_EXTENSIONS.find(([id])=>id==='rewards')[1];
      s.desks[1].owned=true; s.desks[1].paws=1; d.ensureCrew(s.desks[1]); const t=s.desks[1].crew[0]; t.trait='lucky'; t.look='unknown'; t.talent=0; t.coach=0; t.xp=0;
      s.desks[1].up.fing=2; s.metro=true; s.sel=0;
      const basis=api.rewardBasis(); const stats=JSON.stringify(s.stats),xp=t.xp;
      for(const k of ['frenzy','golden','snack','sluggish','rush','critic'])d.buffs[k]=performance.now()+60000;
      s.dbl=true; const buffed=api.rewardBasis();
      const locked=[];
      for(const id of ['l100','l10k','w1k']) { s.awards[id]=true;hook.award({ id,tier:0,silent:true },api); locked.push(api.state().rewards.claims['award:'+id].descriptor); }
      s.divs.songs=1; const cashBasis=api.rewardBasis().bananas;s.awards.mu1=true;hook.award({id:'mu1',tier:0,silent:true},api);const cashMiddle=api.state().rewards.claims['award:mu1'].descriptor;
      s.divs.film=1000000000;
      const cashCaps=[];
      for(const id of ['s1','b1m','b1b']) { s.awards[id]=true;hook.award({ id,tier:0,silent:true },api);cashCaps.push(api.state().rewards.claims['award:'+id].descriptor); }
      s.desks[1].paws=1000000; s.desks[1].crew=Array.from({length:20},()=>({ ...t,talent:100000000 }));
      const letterCaps=[];
      for(const id of ['c10','c100','gar500']) { s.awards[id]=true;hook.award({ id,tier:0,silent:true },api);letterCaps.push(api.state().rewards.claims['award:'+id].descriptor); }
      return { basis,buffed,locked,cashBasis,cashMiddle,cashCaps,letterCaps,statsUnchanged:stats===JSON.stringify(s.stats),xpUnchanged:xp===t.xp,letters:api.state().desks[1].letters };
    });
    assert.deepEqual(value.basis,value.buffed); assert.equal(value.basis.desk,1); assert.ok(value.basis.letters[1]>0);
    for(const [index,minutes] of [[0,3],[1,5],[2,10]]) {
      const d=value.locked[index]; assert.equal(d.minutes,minutes); assert.equal(d.desk,1);
      assert.equal(d.amount,Math.floor(Math.max(50,Math.min([5000,20000,100000][index],60*minutes*value.basis.letters[1]))));
    }
    assert.deepEqual(value.cashCaps.map(d=>d.amount),[250000,25000000,2500000000]);
    assert.equal(value.cashMiddle.rate,value.cashBasis);assert.equal(value.cashMiddle.amount,Math.round(Math.max(6250,Math.min(250000,300*value.cashBasis))/25)*25);
    assert.deepEqual(value.letterCaps.map(d=>d.amount),[5000,20000,20000]);
    assert.equal(value.statsUnchanged,true); assert.equal(value.xpUnchanged,true);
    assert.deepEqual(f.errors,[]); await h.capture(f,'rates-'+speed);
  } finally { await f.close(); }
});

test('fixed missing receipt reconciliation keeps new origin and rejects contradictory source metadata',async()=>{
  const input=await h.records({ awards:{ s8:true,g1:true },rewards:{ migration:{ version:1,policy:'db-only',oldAwardIds:[],oldChallengeIds:[],oldPrinting:0 } } });
  const f=await h.fixture(browser,{ records:input });
  try {
    const value=await f.page.evaluate(()=>IMI.ops.dev.S());
    assert.equal(value.rewards.claims['award:s8'].origin,'recovered'); assert.equal(value.rewards.claims['award:g1'].origin,'recovered');
    assert.equal(value.prem.earned,2); assert.equal(value.rewards.storedGold.tokens['award:g1'].status,'stored');
    const saved=await f.page.evaluate(()=>{ const s=JSON.parse(localStorage.getItem('imi-ops-v1'));delete s.rewards.claims['award:s8'];delete s.rewards.claims['award:g1'];
      return { 'imi-score':localStorage.getItem('imi-score'),'imi-ops-v1':JSON.stringify(s) }; });
    const recovered=await h.fixture(browser,{ records:saved });
    try { assert.equal(await recovered.page.evaluate(()=>IMI.ops.dev.S().prem.earned),2); assert.equal(await recovered.page.evaluate(()=>IMI.ops.progression.running()),true);await h.capture(recovered,'fixed-source-reconstructed'); }
    finally { await recovered.close(); }
    const bad=JSON.parse(saved['imi-ops-v1']);bad.prem.credits['award:s8'].amount=3;
    const broken=await h.fixture(browser,{ records:{ ...saved,'imi-ops-v1':JSON.stringify(bad) } });
    try { assert.equal(await broken.page.evaluate(()=>IMI.ops.progression.running()),false); assert.equal(await broken.page.evaluate(()=>IMI.ops.dev.S().prem.earned),2);await h.capture(broken,'contradictory-source-hold'); }
    finally { await broken.close(); }
  } finally { await f.close(); }
});

test('all enabled save routes refuse milestone without metadata and Printing cannot run through a pending claim',async()=>{
  const f=await h.fixture(browser);
  try {
    const result=await f.page.evaluate(()=>{ const s=IMI.ops.dev.S();s.awards.l100=true;s.run.earned=Economy.cash(5e5);
      const prior=localStorage.getItem('imi-ops-v1'),ack=IMI.ops.saveAcknowledged();IMI.ops.dev.doPrint();
      dispatchEvent(new Event('beforeunload'));document.dispatchEvent(new Event('visibilitychange'));__advance(6000);
      return { ack,printing:IMI.ops.dev.S().printing,same:prior===localStorage.getItem('imi-ops-v1'),running:IMI.ops.progression.running() }; });
    assert.equal(result.ack.ok,false);assert.equal(result.printing,0);assert.equal(result.same,true);assert.equal(result.running,false);
    await h.capture(f,'all-save-metadata-hold');
  } finally { await f.close(); }
});

for(const [id,db] of [['vowel',5],['haiku',7],['hands',7],['timed',9]])test('actual challenge '+id+' first/repeat/fail/abandon histories',async()=>{
  const input=await h.records({ awards:Object.fromEntries(catalogue().map(r=>[r.id,true])) });
  const f=await h.fixture(browser,{ records:input });
  try {
    const value=await f.page.evaluate(id=>{
      const d=IMI.ops.dev,s=d.S(),C=d.CHALLENGES.find(c=>c.id===id),before=s.prem.earned;
      s.challenge={ id,start:Date.now() }; d.action('chabandon'); const abandoned=!!s.chDone[id];
      if(id==='timed'){s.challenge={ id,start:Date.now()-C.minutes*60000-1 };__advance(1100);}
      const failed=!!s.chDone[id];
      const books=d.RECIPES.filter(r=>!r.kid&&!r.lib&&!r.gen); for(const r of books.slice(0,C.goalN)){for(const [w,n]of Object.entries(r.need))s.bank[w]=n;d.writeTitle(r.id,null,{ silent:true });}
      s.challenge={ id,start:Date.now() };__advance(1100); const first=s.prem.earned-before, stars=s.legacy.stars;
      s.challenge={ id,start:Date.now() };__advance(1100);
      return { abandoned,failed,first,total:s.prem.earned-before,stars,repeatStars:s.legacy.stars,receipt:s.rewards.claims['challenge:'+id+':first'] };
    },id);
    assert.equal(value.abandoned,false);assert.equal(value.failed,false);assert.equal(value.first,db);assert.equal(value.total,db);assert.equal(value.stars,value.repeatStars);
    assert.equal(value.receipt.status,'committed');assert.equal(value.receipt.origin,'new');assert.deepEqual(f.errors,[]);await h.capture(f,'challenge-'+id);
  } finally { await f.close(); }
});

test('actual first Printing and full reset preserve continuing receipts then start an empty new timeline',async()=>{
  const f=await h.fixture(browser);
  try {
    const result=await f.page.evaluate(()=>{ const d=IMI.ops.dev,s=d.S(),r=d.RECIPES.find(r=>!r.kid&&!r.lib&&!r.gen);
      s.intro.done=true;for(const [w,n]of Object.entries(r.need))s.bank[w]=n;d.writeTitle(r.id,null,{ silent:true });d.checkAwards(true);
      const sale=s.rewards.claims['award:s1'];s.run.earned=Economy.cash(5e5);d.doPrint();d.checkAwards(true);
      const first={ s1:IMI.ops.dev.S().rewards.claims['award:s1'],layer:IMI.ops.dev.S().rewards.claims['layer:printing:first'],pr1:IMI.ops.dev.S().rewards.claims['award:pr1'],earned:IMI.ops.dev.S().prem.earned };
      IMI.ops.dev.S().run.earned=Economy.cash(5e5);d.doPrint();const repeat=IMI.ops.dev.S().prem.earned;
      window.confirm=()=>true;IMI.ops.reset();return { sale,first,repeat,reset:IMI.ops.dev.S(),running:IMI.ops.progression.running(),marker:IMI.bananas.acknowledgement() };
    });
    assert.equal(result.sale.descriptor.kind,'C');assert.deepEqual(result.first.s1,result.sale);assert.equal(result.first.layer.descriptor.amount,5);assert.equal(result.first.pr1.descriptor.amount,2);
    assert.equal(result.first.earned,result.repeat);assert.deepEqual(result.reset.rewards.migration.oldAwardIds,[]);assert.deepEqual(result.reset.rewards.migration.oldChallengeIds,[]);
    assert.equal(result.reset.prem.earned,0);assert.equal(result.reset.printing,0);assert.equal(result.running,true);assert.equal(result.marker,null);assert.deepEqual(f.errors,[]);await h.capture(f,'printing-reset');
  } finally { await f.close(); }
});

test('committed cash with a missing wallet marker is held, never recredited to repair contradictory storage',async()=>{
  const f=await h.fixture(browser);let input;
  try{input=await f.page.evaluate(()=>{const api=IMI.ops.extensions;api.state().awards.s1=true;__OPS_EXTENSIONS.find(([id])=>id==='rewards')[1].award({id:'s1',tier:0,silent:true},api);
    const s=JSON.parse(localStorage.getItem('imi-ops-v1'));s.rewards.claims['award:s1'].deltaApplied=false;
    return {'imi-score':JSON.stringify({economyVersion:1,score:0}),'imi-ops-v1':JSON.stringify(s)};
  });}finally{await f.close();}
  const broken=await h.fixture(browser,{records:input});
  try{assert.equal(await broken.page.evaluate(()=>IMI.ops.progression.running()),false);assert.equal(await broken.page.evaluate(()=>IMI.bananas.get()),0);await h.capture(broken,'committed-cash-missing-marker');}
  finally{await broken.close();}
});

test('synchronous acknowledged wallet watchers cannot reenter Printing or ordinary mutation during a cash claim',async()=>{
  const f=await h.fixture(browser);
  try{
    const result=await f.page.evaluate(()=>{
      const d=IMI.ops.dev,api=IMI.ops.extensions;
      api.state().run.earned=Economy.cash(5e5);let calls=0,spend;
      IMI.bananas.watch((_,event)=>{if(event?.reward){calls++;d.doPrint();spend=IMI.bananas.spend(25);}});
      api.state().awards.s1=true;__OPS_EXTENSIONS.find(([id])=>id==='rewards')[1].award({id:'s1',tier:0,silent:true},api);
      return {calls,spend,printing:api.state().printing,wallet:IMI.bananas.get(),run:api.state().run.earned,claim:api.state().rewards.claims['award:s1'],running:IMI.ops.progression.running()};
    });
    assert.equal(result.calls,1);assert.equal(result.spend,false);assert.equal(result.printing,0);assert.equal(result.wallet,6250);assert.equal(result.run,12506250);
    assert.equal(result.claim.status,'committed');assert.equal(result.running,true);await h.capture(f,'watcher-reentry-serialized');
  }finally{await f.close();}
});

for(const [id,kind]of [['l100','L'],['s8','D'],['g1','G']])for(const stage of ['prepared','committed'])test(kind+' destination remains unpublished at '+stage+' failure and fixed Retry preserves future claims',async()=>{
  const f=await h.fixture(browser);
  try{
    const stopped=await f.page.evaluate(({id,stage})=>{
      const api=IMI.ops.extensions;api.state().rewards.claims['future:policy']={status:'opaque',keep:{field:true}};
      if(id==='l100')api.state().desks[1].owned=true;
      __fault={stage,claim:'award:'+id,remaining:1};api.state().awards[id]=true;
      __OPS_EXTENSIONS.find(([key])=>key==='rewards')[1].award({id,tier:0,silent:true},api);
      return {running:IMI.ops.progression.running(),claim:api.state().rewards.claims['award:'+id],letters:api.state().desks[1].letters,earned:api.state().prem.earned,tokens:api.state().rewards.storedGold.tokens};
    },{id,stage});
    assert.equal(stopped.running,false);assert.deepEqual(stopped.letters,{});assert.equal(stopped.earned,0);assert.deepEqual(stopped.tokens,{});
    assert.equal(stage==='prepared'?stopped.claim===undefined:stopped.claim.status==='prepared',true);await h.capture(f,'own-key-'+id+'-'+stage+'-failed');
    const resumed=await f.page.evaluate(id=>{__fault=null;if(id==='l100')IMI.ops.dev.S().desks[2].owned=true;const retry=Rewards.retry();return {retry,s:IMI.ops.dev.S()};},id);
    assert.equal(resumed.retry,true);const c=resumed.s.rewards.claims['award:'+id];assert.equal(c.status,'committed');assert.deepEqual(resumed.s.rewards.claims['future:policy'],{status:'opaque',keep:{field:true}});
    if(kind==='L'){assert.equal(c.descriptor.desk,1);assert.equal(c.descriptor.amount,50);assert.equal(resumed.s.desks[1].letters.A,2);assert.equal(resumed.s.desks[1].letters.Y,1);assert.equal(resumed.s.desks[1].letters.Z,1);assert.equal(Object.values(resumed.s.desks[1].letters).reduce((a,b)=>a+b,0),50);}
    if(kind==='D')assert.equal(resumed.s.prem.credits['award:s8'].amount,2);
    if(kind==='G')assert.equal(resumed.s.rewards.storedGold.tokens['award:g1'].status,'stored');
    assert.deepEqual(f.errors,[]);await h.capture(f,'own-key-'+id+'-'+stage+'-retried');
  }finally{await f.close();}
});

test('actual Gold letter rate saturates its independent 100000 cap',async()=>{
  const f=await h.fixture(browser);
  try{
    const result=await f.page.evaluate(()=>{const d=IMI.ops.dev,api=IMI.ops.extensions;d.S().desks[0].paws=1;d.ensureCrew(d.S().desks[0]);d.S().desks[0].crew[0].talent=1e9;
      d.S().awards.w1k=true;__OPS_EXTENSIONS.find(([id])=>id==='rewards')[1].award({id:'w1k',tier:2,silent:true},api);return api.state().rewards.claims['award:w1k'].descriptor;});
    assert.equal(result.minutes,10);assert.equal(result.cap,100000);assert.equal(result.amount,100000);await h.capture(f,'gold-letter-cap');
  }finally{await f.close();}
});
