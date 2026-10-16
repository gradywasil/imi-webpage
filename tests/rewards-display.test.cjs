const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
let h,browser;
before(async()=>{h=await import('../tools/long-game/lg01-b-fixture.mjs');browser=await h.browser();});
after(async()=>{await browser?.close();});
test('all 68 preview lines preserve +1%, fixed effects and read-only accepted basis',async()=>{
  const f=await h.fixture(browser,{records:await h.records()});
  try{
    const value=await f.page.evaluate(()=>{
      const before=JSON.stringify(IMI.ops.extensions.state()),wallet=IMI.bananas.get(),writes=__writes.length;
      const lines=Object.fromEntries(IMI.ops.extensions.rewardAwards().map(a=>[a.id,Rewards.rewardLine(a.id)]));
      return {lines,same:before===JSON.stringify(IMI.ops.extensions.state()),walletSame:wallet===IMI.bananas.get(),writes:__writes.length-writes};
    });
    assert.equal(Object.keys(value.lines).length,68);for(const line of Object.values(value.lines))assert.match(line,/\+1% income/);
    assert.match(value.lines.l100,/Reward now: 50 balanced letters on Bamboo Classic/);
    assert.match(value.lines.s1,/Reward now: 6,250 bananas/);
    assert.match(value.lines.s8,/2 Diamond Bananas/);assert.doesNotMatch(value.lines.s8,/Scales/);
    assert.match(value.lines.g1,/x7 royalties and division income for 15 game seconds/);
    assert.equal(value.same,true);assert.equal(value.walletSame,true);assert.equal(value.writes,0);
  }finally{await f.close();}
});
test('historical waiver, committed receipt and failed preparation have truthful status',async()=>{
  const old=await h.fixture(browser,{records:await h.records({awards:{l100:true,s8:true}})});
  try{const lines=await old.page.evaluate(()=>({l:Rewards.rewardLine('l100'),d:Rewards.rewardLine('s8')}));assert.match(lines.l,/Earned before rewards were added/);assert.match(lines.d,/Reward saved: 2 Diamond Bananas.*Historical backfill/);}
  finally{await old.close();}
  const failed=await h.fixture(browser,{records:await h.records(),fault:{claim:'award:l100',stage:'prepared',remaining:1}});
  try{
    await failed.page.evaluate(()=>{IMI.ops.dev.S().stats.letters=100;IMI.ops.dev.checkAwards(true);});
    assert.match(await failed.page.evaluate(()=>Rewards.rewardLine('l100')),/Progress not saved. Reward waiting to save/);
    await failed.page.evaluate(()=>Rewards.retry());assert.match(await failed.page.evaluate(()=>Rewards.rewardLine('l100')),/Reward saved: 50 balanced letters/);
  }finally{await failed.close();}
});
test('one inventory activation action uses accepted consumption, summary ack is durable',async()=>{
  const f=await h.fixture(browser,{records:await h.records({awards:{s8:true},intro:{version:1,done:true,train:true,words:true,shop:true}})});
  try{
    await f.page.evaluate(()=>{IMI.ops.dev.S().gold=1;IMI.ops.dev.checkAwards(true);});
    const html=await f.page.evaluate(()=>Rewards.awardsHeader());
    assert.equal((html.match(/data-act="rewards:activate"/g)||[]).length,1);assert.match(html,/1 stored/);assert.match(html,/Earlier progress: 2 Diamond Bananas saved/);
    const value=await f.page.evaluate(()=>{
      __OPS_EXTENSIONS.find(([id])=>id==='rewards')[1].actions.acknowledge();
      const activated=Rewards.activate();return {activated,ack:JSON.parse(localStorage.getItem('imi-ops-v1')).rewards.summaryAcknowledged,html:Rewards.awardsHeader()};
    });
    assert.equal(value.activated,true);assert.equal(value.ack,true);assert.doesNotMatch(value.html,/Earlier progress:/);assert.match(value.html,/Active/);
  }finally{await f.close();}
});
