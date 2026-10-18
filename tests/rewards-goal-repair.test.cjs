const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
let h,browser;
before(async()=>{h=await import('../tools/long-game/lg01-b-fixture.mjs');browser=await h.browser();});
after(async()=>{await browser?.close();});
async function game(overrides={}) {
  return h.fixture(browser,{records:await h.records({intro:{version:1,done:true,train:true,words:true,shop:true,hireAt:0},written:{'ape-in-the-cape':true},awards:{s1:true,l100:true},...overrides})});
}
const refresh=page=>page.evaluate(()=>{__OPS_EXTENSIONS.find(([id])=>id==='rewards')[1].afterRender();return structuredClone(IMI.ops.extensions.state().rewards.goals);});
test('planting every bed keeps the unfinished goal through growth and ripeness; harvest replaces one slot',async()=>{
  const f=await game({rewards:{goals:{version:1,revealed:true,ids:['gar1','s4','d1'],unknown:'keep'}}});
  try {
    const first=await refresh(f.page);
    await f.page.evaluate(()=>{window.__OPS_HEADLESS=false;IMI.ops.extensions.setTab('lab');__advance(400);});
    await f.page.click('[data-act="plant"][data-i="0"]');
    await f.page.click('[data-act="plant"][data-i="1"]');
    const growing=await f.page.evaluate(()=>({beds:IMI.ops.dev.S().garden.beds,harvested:IMI.ops.dev.S().stats.harvested||0,award:!!IMI.ops.dev.S().awards.gar1,now:Date.now()}));
    assert.equal(growing.beds.length,2);assert.ok(growing.beds.every(b=>b.ready>growing.now));assert.equal(growing.harvested,0);assert.equal(growing.award,false);
    assert.deepEqual(await refresh(f.page),first);
    await f.page.evaluate(()=>{__advance(31000);IMI.ops.extensions.mark();__advance(400);});
    assert.equal(await f.page.$eval('[data-act="harvest"][data-i="0"]',e=>e.textContent.includes('Harvest')),true);
    assert.deepEqual(await refresh(f.page),first);
    await f.page.click('[data-act="harvest"][data-i="0"]');
    await f.page.evaluate(()=>IMI.ops.dev.checkAwards(true));
    const next=await refresh(f.page),value=await h.capture(f,'goal-repair-garden');
    assert.equal(value.state.awards.gar1,true);assert.ok(value.state.stats.harvested>0);assert.notEqual(next.ids[0],'gar1');assert.deepEqual(next.ids.slice(1),first.ids.slice(1));assert.equal(next.unknown,'keep');
    const claim=value.state.rewards.claims['award:gar1'];assert.equal(claim.status,'committed');
    for(let i=0;i<3;i++)await refresh(f.page);
    assert.deepEqual(await f.page.evaluate(()=>IMI.ops.dev.S().rewards.claims['award:gar1']),claim);
    assert.deepEqual(f.errors,[]);
  }finally{await f.close();}
});
test('No Hands keeps automatic lifetime production goals while rejecting manual streak goals',async()=>{
  const f=await game({challenge:{id:'hands',start:0},stats:{letters:999,manual:0,words:5,byLetter:{}},rewards:{goals:{version:1,revealed:true,ids:['l1k','s4','d1']}}});
  try {
    await f.page.evaluate(()=>{const d=IMI.ops.dev.S().desks[0];d.paws=1;IMI.ops.dev.ensureCrew(d);});
    assert.equal((await refresh(f.page)).ids[0],'l1k');
    const value=await f.page.evaluate(()=>{
      const s=IMI.ops.dev.S(),before=s.stats.letters;IMI.ops.dev.press(0,false);const manual=s.stats.letters;
      IMI.ops.dev.press(0,true,0);IMI.ops.dev.checkAwards(true);
      return {before,manual,letters:s.stats.letters,award:s.awards.l1k,claim:s.rewards.claims['award:l1k']};
    });
    assert.equal(value.manual,value.before);assert.equal(value.letters,1000);assert.equal(value.award,true);assert.equal(value.claim.status,'committed');assert.ok(value.claim.descriptor.amount>=50);
    await f.page.evaluate(()=>{IMI.ops.dev.S().rewards.goals.ids=['c10','s4','d1'];});
    assert.ok(!(await refresh(f.page)).ids.includes('c10'));
    await h.capture(f,'goal-repair-nohands');assert.deepEqual(f.errors,[]);
  }finally{await f.close();}
});
test('known challenge progress agrees with actual ch4 earning and preserves unknown and false raw entries',async()=>{
  const raw={vowel:true,haiku:true,hands:true,timed:false,futureChallenge:true,anotherFuture:false};
  const f=await game({printing:1});
  try {
    await refresh(f.page);
    await f.page.evaluate(raw=>{const s=IMI.ops.dev.S();s.chDone=raw;s.challenge={id:'timed',start:Date.now()};s.rewards.goals.ids=['l1k','s4','ch4'];},raw);
    await refresh(f.page);
    const before=await f.page.evaluate(()=>{IMI.ops.dev.checkAwards(true);return {html:Rewards.awardsHeader(),awarded:!!IMI.ops.dev.S().awards.ch4,raw:IMI.ops.dev.S().chDone};});
    assert.equal(before.awarded,false);assert.match(before.html,/3\/4/);assert.doesNotMatch(before.html,/4\/4/);assert.deepEqual(before.raw,raw);
    await f.page.evaluate(()=>{IMI.ops.dev.S().chDone.timed=true;IMI.ops.dev.checkAwards(true);});
    const completed=await h.capture(f,'goal-repair-challenges');assert.equal(completed.state.awards.ch4,true);assert.equal(completed.state.rewards.claims['award:ch4'].status,'committed');
    assert.equal(completed.state.chDone.futureChallenge,true);assert.equal(completed.state.chDone.anotherFuture,false);
    assert.deepEqual(f.errors,[]);
  }finally{await f.close();}
});
test('inventory reveals earned or bought Diamond balance at one without writes, payout or ledger changes',async()=>{
  const f=await game();
  try {
    for(const [earned,bought,visible] of [[0,0,false],[1,0,true],[0,1,true],[2,3,true]]) {
      const value=await f.page.evaluate(({earned,bought})=>{
        const s=IMI.ops.dev.S();s.prem.earned=earned;s.prem.bought=bought;
        const before=JSON.stringify(s),wallet=IMI.bananas.get(),writes=__writes.length,html=Rewards.awardsHeader();
        return {html,same:before===JSON.stringify(s),walletSame:wallet===IMI.bananas.get(),writes:__writes.length-writes};
      },{earned,bought});
      assert.equal(value.html.includes('o-reward-wallet'),visible);assert.doesNotMatch(value.html,/data-act="rewards:activate"/,'no stored token, so no activation row is drawn');assert.equal(value.same,true);assert.equal(value.walletSame,true);assert.equal(value.writes,0);
      if(visible)assert.ok(value.html.includes(`aria-label="${earned+bought} Diamond Bananas"`));
    }
    await h.capture(f,'goal-repair-diamond-display');assert.deepEqual(f.errors,[]);
  }finally{await f.close();}
});
