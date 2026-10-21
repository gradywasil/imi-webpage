const { test,before,after } = require('node:test');
const assert = require('node:assert/strict');
let h,browser;
before(async () => { h = await import('../tools/long-game/lg01-b-fixture.mjs'); browser = await h.browser(); });
after(async () => { await browser?.close(); });
async function game(overrides = {}, options = {}) {
  return h.fixture(browser,{ records:await h.records({ intro:{version:1,done:true,train:true,words:true,shop:true,hireAt:0},
    written:{'ape-in-the-cape':true}, awards:{s1:true}, ...overrides }), ...options });
}
const refresh = page => page.evaluate(() => { __OPS_EXTENSIONS.find(([id]) => id === 'rewards')[1].afterRender(); return IMI.ops.extensions.state().rewards.goals; });
test('three deterministic families persist without writes on progress or navigation',async () => {
  const f = await game();
  try {
    const first = await refresh(f.page);
    assert.deepEqual(first.ids,['l100','s4','d1']);
    const value = await f.page.evaluate(() => {
      const before = __writes.length, s = IMI.ops.dev.S(); s.stats.letters = 90;
      const hook = __OPS_EXTENSIONS.find(([id]) => id === 'rewards')[1];
      for(let i=0;i<5;i++) hook.afterRender();
      return {writes:__writes.length-before,goals:s.rewards.goals,focus:s.focus};
    });
    assert.equal(value.writes,0); assert.deepEqual(value.goals,first);
    const records = await f.page.evaluate(() => ({'imi-score':localStorage.getItem('imi-score'),'imi-ops-v1':localStorage.getItem('imi-ops-v1')}));
    const reload = await h.fixture(browser,{records});
    try { assert.deepEqual(await refresh(reload.page),first); } finally { await reload.close(); }
    assert.deepEqual(f.errors,[]);
  } finally { await f.close(); }
});
test('completion replaces only its slot and never pays for choosing or viewing',async () => {
  const f = await game();
  try {
    const first = await refresh(f.page);
    await f.page.evaluate(() => {IMI.ops.dev.S().stats.letters=100;IMI.ops.dev.checkAwards(true);});
    const after = await refresh(f.page);
    assert.equal(after.ids[0],'l1k'); assert.deepEqual(after.ids.slice(1),first.ids.slice(1));
    const result = await f.page.evaluate(() => {
      const before=JSON.stringify(IMI.ops.extensions.state()); const wallet=IMI.bananas.get();
      for(let i=0;i<10;i++) Rewards.rewardLine('l100');
      return {same:before===JSON.stringify(IMI.ops.extensions.state()),walletSame:wallet===IMI.bananas.get(),claim:IMI.ops.extensions.state().rewards.claims['award:l100']};
    });
    assert.equal(result.same,true);assert.equal(result.walletSame,true);assert.equal(result.claim.status,'committed');
  } finally { await f.close(); }
});
test('intro and Awards gates defer selection and preserve authored guidance',async () => {
  const f = await game({intro:{version:1,done:false,train:false,words:false,shop:false,hireAt:null},written:{},awards:{}});
  try {assert.equal(await refresh(f.page),undefined);assert.equal(await f.page.evaluate(() => __writes.some(w=>JSON.parse(w.value)?.rewards?.goals)),false);}
  finally {await f.close();}
});
test('current room capacity counts what the owned desks can hold: one desk holds 48 typists, so the 20 and 40 typist awards are reachable',async () => {
  const ids = require('node:fs').readFileSync('rewards.js','utf8').match(/const assignments = \{([\s\S]*?)\n  \};/)[1].match(/\w+(?=:'[LCDG]')/g);
  const f=await game({awards:Object.fromEntries(ids.filter(id=>!['p20','p40'].includes(id)).map(id=>[id,true]))});
  try{const ids2=(await refresh(f.page)).ids;assert.ok(ids2.length>0&&ids2.every(id=>['p20','p40'].includes(id)),'only the crew awards are left to choose from: '+ids2);assert.equal(await f.page.evaluate(()=>IMI.ops.extensions.goalFacts().capacity.crew),48);}
  finally{await f.close();}
});
test('failed selection remains unsaved, repeated Retry persists once with unknown data',async () => {
  const f = await game({rewards:{unknown:'retained'}});
  try {
    await f.page.evaluate(() => {
      const original=Storage.prototype.setItem;window.__goalRejected=0;
      Storage.prototype.setItem=function(k,v){if(k==='imi-ops-v1'&&JSON.parse(v).rewards?.goals&&__goalRejected++<2)throw Error('goal selection failure');return original.call(this,k,v);};
    });
    assert.equal(await refresh(f.page),undefined);
    const value = await f.page.evaluate(() => {
      const before=localStorage.getItem('imi-ops-v1'),first=Rewards.retry(),second=Rewards.retry();
      return {before:JSON.parse(before).rewards.goals,first,second,held:Rewards.held(),goals:IMI.ops.extensions.state().rewards.goals,
        saved:JSON.parse(localStorage.getItem('imi-ops-v1')).rewards.goals,unknown:IMI.ops.extensions.state().rewards.unknown};
    });
    assert.equal(value.before,undefined);assert.equal(value.first,false);assert.equal(value.second,true);assert.equal(value.held,false);
    assert.deepEqual(value.goals,value.saved);assert.equal(value.unknown,'retained');
  } finally {await f.close();}
});
test('Printing keeps lifetime goals, refreshes unreachable desk and current shelf facts',async () => {
  const f = await game({rewards:{goals:{version:1,revealed:true,ids:['l100','s4','d2'],unknown:'retained'}}});
  try {
    await f.page.evaluate(() => {const s=IMI.ops.dev.S();s.desks[1].owned=true;s.run.earned=12500000;IMI.ops.dev.doPrint('haiku');});
    const next=await refresh(f.page);
    assert.equal(next.ids[0],'l100');assert.equal(next.ids[1],'s4');assert.notEqual(next.ids[2],'d2');assert.equal(next.unknown,'retained');
    const facts=await f.page.evaluate(() => IMI.ops.extensions.goalFacts());
    assert.equal(facts.metrics.sold,0);assert.equal(facts.reachable.desks[2],false);
  } finally {await f.close();}
});
test('excluded passive/rotten candidates give truthful fewer/all-complete states',async () => {
  const ids = require('node:fs').readFileSync('rewards.js','utf8').match(/const assignments = \{([\s\S]*?)\n  \};/)[1].match(/\w+(?=:'[LCDG]')/g);
  const awards=Object.fromEntries(ids.filter(id=>['l100','g1','r1','storm','night','away1'].includes(id)===false).map(id=>[id,true]));
  const f=await game({awards,printing:1});
  try {
    const next=await refresh(f.page);assert.deepEqual(next.ids,['l100']);
    assert.match(await f.page.evaluate(()=>Rewards.awardsHeader()),/More goals as your room grows/);
  }finally{await f.close();}
  const complete=await game({awards:Object.fromEntries(ids.map(id=>[id,true])),printing:1});
  try{assert.deepEqual((await refresh(complete.page)).ids,[]);assert.match(await complete.page.evaluate(()=>Rewards.awardsHeader()),/All 68 awards earned/);}
  finally{await complete.close();}
});
