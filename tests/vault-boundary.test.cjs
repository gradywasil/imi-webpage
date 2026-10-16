const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
let h,b;
before(async()=>{h=await import('../tools/long-game/lg02-b2-r2-fixture.mjs');b=await h.browser();});
after(async()=>{await b?.close();});
test('pure bounded transition descriptor rejects contradictory clocks, phases and effect/cap encodings',()=>{
  const context={window:{}};vm.runInNewContext(fs.readFileSync('vault.js','utf8'),context);const V=context.window.Vault;
  const s=JSON.parse(h.records()['imi-ops-v1']);s.prem.vault=h.vault();s.prem.vault.transition={version:1,printing:0,phase:'tail',tailStartWallMs:100000,tailEndWallMs:106000,holdStartWallMs:106000,oldEffects:V.oldEffects(s)};
  assert.equal(V.validate(s).status,'valid');
  for(const patch of [{version:2},{phase:'unknown'},{tailStartWallMs:107000},{holdStartWallMs:128000},{printing:1},{tailEndWallMs:Infinity},{tailEndWallMs:null},{oldEffects:{...V.oldEffects(s),capSeconds:null}},{oldEffects:{...V.oldEffects(s),gameTier:4}},{unknown:true}]){
    const next=structuredClone(s);Object.assign(next.prem.vault.transition,patch);const raw=JSON.stringify(next);assert.equal(V.validate(next).status,'unsupported');assert.equal(JSON.stringify(next),raw);
  }
});
for(const stage of ['open','early','complete','settled-delete','close'])test('actual '+stage+' write failure preserves OPEN authority and retries separately',async()=>{
  const f=await h.fixture(b,h.records({garden:{beds:[{ch:'A',desk:0,ready:110000},null]}}));
  try {
    assert.equal(await h.invoke(f,{fail:{key:'imi-ops-v1',stage,remaining:1}}),false);
    const held=await h.capture(f,'boundary-'+stage+'-held');assert.equal(held.closed,0);assert.equal(held.continued,0);
    assert.equal(await f.page.evaluate(()=>{__wall=128000;return Rewards.retry();}),true);
    const v=await h.capture(f,'boundary-'+stage+'-retry');assert.equal(v.closed,1);assert.equal(v.continued,1);assert.equal(v.state.lastSeen,128000);assert.equal(v.state.garden.beds[0].ready,132000);
    assert.equal(v.state.prem.vault.transition,undefined);assert.deepEqual(f.errors,[]);
  }finally{await f.close();}
});
test('signed backward closing shifts only current saved clocks',async()=>{
  const f=await h.fixture(b,h.records({garden:{beds:[{ch:'A',desk:0,ready:110000},null]}}));
  try{assert.equal(await h.invoke(f,{fail:{key:'imi-ops-v1',stage:'close',remaining:1}}),false);assert.equal(await f.page.evaluate(()=>{__wall=101000;return Rewards.retry();}),true);const v=await h.capture(f,'boundary-backward');assert.equal(v.state.lastSeen,101000);assert.equal(v.state.garden.beds[0].ready,105000);}finally{await f.close();}
});
for(const stage of ['tail-delete','early','complete','settled-delete','close'])test('actual saved complete old checkpoint routes startup through '+stage+' and pays only the fixed tail',async()=>{
  const input=await h.oldCheckpoint(b),f=await h.fixture(b,input,{wall:106000,fail:{key:'imi-ops-v1',stage,remaining:1,...(stage==='complete'?{end:106000}:{})}});
  try {
    const held=await h.capture(f,'boundary-old-'+stage+'-held');assert.equal(held.held,true);assert.equal(held.closed,0);
    if(stage==='tail-delete') {
      assert.equal(held.state.rewards.awayCheckpoint.nowMs,100000);assert.equal(held.state.prem.vault.transition.phase,'old');
      assert.deepEqual(await f.page.evaluate(()=>{const cp=IMI.ops.extensions.state().rewards.awayCheckpoint;return [cp===__initialCp,cp.report===__initialReport,cp.sold===__initialSold];}),[true,true,true]);
    }
    assert.equal(await f.page.evaluate(()=>{__wall=128000;return Rewards.retry();}),true);
    const v=await h.capture(f,'boundary-old-'+stage+'-retry');assert.equal(v.closed,1);assert.equal(v.state.lastSeen,128000);
    assert.equal(v.state.rewards.awayCheckpoint,undefined);assert.equal(v.state.prem.vault.transition,undefined);
    const prepared=v.writes.filter(w=>!w.rejected&&w.key==='imi-ops-v1').map(w=>JSON.parse(w.raw).rewards?.awayCheckpoint).filter(cp=>cp?.nowMs===106000);
    assert.ok(prepared.length>0);assert.ok(prepared.every(cp=>cp.awaySec===6));assert.deepEqual(f.errors,[]);
  }finally{await f.close();}
});
test('actual acknowledged partial old checkpoint completes its conserved cursor before tail deletion',async()=>{
  const input=await h.oldCheckpoint(b,'partial');assert.equal(JSON.parse(input['imi-ops-v1']).rewards.awayCheckpoint.phase,'early');
  const f=await h.fixture(b,input,{wall:106000,fail:{key:'imi-ops-v1',stage:'tail-delete',remaining:1}});
  try{const held=await h.capture(f,'boundary-partial-held');assert.equal(held.state.rewards.awayCheckpoint.phase,'complete');assert.equal(held.state.lastSeen,94000);assert.equal(await f.page.evaluate(()=>Rewards.retry()),true);const v=await h.capture(f,'boundary-partial-retry');assert.equal(v.state.lastSeen,106000);assert.equal(v.closed,1);}finally{await f.close();}
});
test('zero tail performs no extra simulation and two separate holds preserve the productive gap',async()=>{
  const f=await h.fixture(b,h.records({garden:{beds:[{ch:'A',desk:0,ready:200000},null]}}));
  try{
    assert.equal(await h.invoke(f,{wall:100000,fail:{key:'imi-ops-v1',stage:'close',remaining:1}}),false);
    const first=await h.capture(f,'boundary-zero-held');assert.equal(first.state.prem.vault.transition.phase,'settled');assert.ok(first.writes.every(w=>!JSON.parse(w.raw).rewards?.awayCheckpoint));
    assert.equal(await f.page.evaluate(()=>{__wall=120000;return Rewards.retry();}),true);
    assert.equal(await h.invoke(f,{id:'boundary:second',wall:124000,fail:{key:'imi-ops-v1',stage:'close',remaining:1}}),false);
    const second=await h.capture(f,'boundary-second-held');assert.equal(second.state.prem.vault.transition.holdStartWallMs,124000);assert.equal(second.state.garden.beds[0].ready,220000);
    assert.equal(await f.page.evaluate(()=>{__wall=134000;return Rewards.retry();}),true);
    const v=await h.capture(f,'boundary-two-holds');assert.equal(v.closed,2);assert.equal(v.state.garden.beds[0].ready,230000);assert.equal(v.state.lastSeen,134000);
  }finally{await f.close();}
});
test('literal holds 106..126 and 130..140 conserve the intervening 126..130 historical work',async()=>{
  const f=await h.fixture(b,h.records({garden:{beds:[{ch:'A',desk:0,ready:300000},null]}}));
  try {
    assert.equal(await h.invoke(f,{id:'boundary:first',wall:106000,fail:{key:'imi-ops-v1',stage:'close',remaining:1}}),false);
    assert.equal(await f.page.evaluate(()=>{__wall=126000;return Rewards.retry();}),true);
    assert.equal(await h.invoke(f,{id:'boundary:second',wall:130000,fail:{key:'imi-ops-v1',stage:'close',remaining:1}}),false);
    const held=await h.capture(f,'boundary-literal-two-held');assert.equal(held.state.prem.vault.transition.holdStartWallMs,130000);assert.equal(held.state.garden.beds[0].ready,320000);
    assert.equal(await f.page.evaluate(()=>{__wall=140000;return Rewards.retry();}),true);
    const v=await h.capture(f,'boundary-literal-two-closed');assert.equal(v.state.garden.beds[0].ready,330000);assert.equal(v.state.lastSeen,140000);assert.equal(v.closed,2);
    const cp=v.writes.filter(w=>!w.rejected&&w.key==='imi-ops-v1').map(w=>JSON.parse(w.raw).rewards?.awayCheckpoint).filter(cp=>cp?.nowMs===130000);assert.ok(cp.length);assert.ok(cp.every(cp=>cp.awaySec===4));
  }finally{await f.close();}
});
for(const [key,stage]of [['imi-score','away-baseline'],['imi-ops-v1','payment'],['imi-score','wallet-credit'],['imi-ops-v1','div'],['imi-ops-v1','complete'],['imi-ops-v1','settled-delete'],['imi-ops-v1','close']])test('actual away income '+stage+' failure conserves cash/head/marker through repeated Retry',async()=>{
  const outcomes=[];
  for(const failure of [false,true]) {
    const f=await h.fixture(b,h.records(),{tune:{ROY_BASE:.01}});
    try {
      const shelf=await h.shelf(f);assert.equal(shelf.running,true);assert.ok(shelf.rate>0);
      assert.equal(await h.invoke(f,{fail:failure?{key,stage,remaining:2}:null}),!failure);
      if(failure){const held=await h.capture(f,'boundary-income-'+stage+'-held');assert.equal(held.closed,0);assert.equal(held.continued,0);let retries=0;while(await f.page.evaluate(()=>Rewards.held())&&retries++<4)await f.page.evaluate(()=>Rewards.retry());assert.ok(retries>=2);}
      const v=await h.capture(f,'boundary-income-'+stage+'-'+failure);assert.equal(v.closed,1);assert.equal(v.continued,1);assert.equal(v.held,false);assert.deepEqual(f.errors,[]);
      outcomes.push({wallet:v.wallet,run:v.state.run,roy:v.state.royTotal,head:v.state.rewards.walletHead,marker:JSON.parse(v.walletRaw).rewardMarker,claims:v.state.rewards.claims,credits:v.state.prem.credits});
    }finally{await f.close();}
  }
  assert.deepEqual(outcomes[1],outcomes[0]);assert.ok(outcomes[0].head.id.startsWith('away:'));assert.deepEqual(outcomes[0].marker,{id:outcomes[0].head.id,amount:outcomes[0].head.amount,sequence:outcomes[0].head.sequence});
});
test('G2 six-second tail locks Deadline at 100.5 before later hold compensation',async()=>{
  const input=h.gameTwo(h.records({challenge:{id:'timed',start:100000-1199000},garden:{beds:[{ch:'A',desk:0,ready:110000},null]}}));
  const f=await h.fixture(b,input,{speed:2});
  try {
    assert.equal(await h.invoke(f,{fail:{key:'imi-ops-v1',stage:'complete',remaining:1}}),false);
    const held=await h.capture(f,'boundary-g2-deadline-held');const cp=held.state.rewards.awayCheckpoint;
    assert.equal(cp.nowMs,106000);assert.equal(cp.awaySec,6);assert.equal(cp.multiplier,2);assert.equal(cp.deadline,.5);assert.equal(held.state.challenge,null);assert.equal(held.state.garden.beds[0].ready,104000);
    assert.equal(await f.page.evaluate(()=>{__wall=128000;return Rewards.retry();}),true);
    const v=await h.capture(f,'boundary-g2-deadline-retry');assert.equal(v.state.challenge,null);assert.equal(v.state.garden.beds[0].ready,126000);assert.equal(v.state.lastSeen,128000);assert.equal(v.closed,1);
  }finally{await f.close();}
});
test('closing overflow stays held and preserves the unshifted acknowledged saved fields',async()=>{
  const f=await h.fixture(b,h.records({garden:{beds:[{ch:'A',desk:0,ready:8.64e15},null]}}));
  try {
    assert.equal(await h.invoke(f,{fail:{key:'imi-ops-v1',stage:'close',remaining:1}}),false);
    const held=await h.capture(f,'boundary-overflow-held');
    assert.equal(await f.page.evaluate(()=>{__wall=128000;return Rewards.retry();}),false);
    const v=await h.capture(f,'boundary-overflow-retry');assert.equal(v.opsRaw,held.opsRaw);assert.equal(v.state.garden.beds[0].ready,8.64e15);assert.equal(v.state.prem.vault.transition.phase,'settled');assert.equal(v.closed,0);
  }finally{await f.close();}
});
for(const [key,stage]of [['imi-ops-v1','early'],['imi-ops-v1','payment'],['imi-score','wallet-credit'],['imi-ops-v1','complete'],['imi-ops-v1','settled-delete'],['imi-ops-v1','close']])test('module-assembled exact saved bytes reload at '+stage+' without native admission or paying held closed time',async()=>{
  const f=await h.fixture(b,h.records({garden:{beds:[{ch:'A',desk:0,ready:110000},null]}}),{tune:{ROY_BASE:.01}});
  let saved,held;
  try {
    await h.shelf(f);assert.equal(await h.invoke(f,{fail:{key,stage,remaining:1}}),false);
    held=await h.capture(f,'boundary-reload-'+stage+'-held');saved={'imi-score':held.walletRaw,'imi-ops-v1':held.opsRaw};
    if(stage==='early'){const s=JSON.parse(held.opsRaw);assert.equal(s.prem.vault.transition.phase,'tail');assert.equal(s.rewards.awayCheckpoint,undefined);}
  }finally{await f.close();}
  const next=await h.fixture(b,saved,{wall:128000,tune:{ROY_BASE:.01}});
  try {
    const v=await h.capture(next,'boundary-reload-'+stage+'-recovered');assert.equal(v.closed,1);assert.equal(v.held,false);assert.equal(v.state.lastSeen,128000);assert.equal(v.state.garden.beds[0].ready,132000);
    assert.equal(v.state.prem.vault.transition,undefined);assert.equal(v.state.rewards.awayCheckpoint,undefined);
    const marker=JSON.parse(v.walletRaw).rewardMarker;assert.equal(marker.id,v.state.rewards.walletHead.id);assert.equal(marker.sequence,v.state.rewards.walletHead.sequence);
    assert.deepEqual(v.state.rewards.claims,held.state.rewards.claims);assert.deepEqual(v.state.prem.credits,held.state.prem.credits);assert.deepEqual(next.errors,[]);
  }finally{await next.close();}
});
