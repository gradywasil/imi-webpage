const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
let h,b;
before(async()=>{h=await import('../tools/long-game/lg02-b2-r2-fixture.mjs');b=await h.browser();});
after(async()=>{await b?.close();});
test('actual owned coordinator closes one hidden six-second interval with separate acknowledgements',async()=>{
  const f=await h.fixture(b);
  try {
    assert.equal(await h.invoke(f),true);
    const v=await h.capture(f,'coordinator-first');
    assert.equal(v.closed,1);assert.equal(v.continued,1);assert.equal(v.state.lastSeen,106000);assert.equal(v.state.prem.vault.transition,undefined);
    assert.equal(v.state.lg02B2UnknownRoot.kept,true);assert.equal(JSON.parse(v.walletRaw).lg02B2UnknownWallet.kept,true);
    assert.ok(v.writes.some(w=>!w.rejected&&JSON.parse(w.raw).prem?.vault?.transition?.phase==='tail'));
    assert.deepEqual(f.errors,[]);
    assert.equal(await h.invoke(f),false);assert.equal(await f.page.evaluate(()=>__continued),1);
  }finally{await f.close();}
});
test('economic kinds, arbitrary settlement callbacks and reentrant prepare/build requests stay unavailable',async()=>{
  const f=await h.fixture(b);
  try{
    const before=await f.page.evaluate(()=>localStorage.getItem('imi-ops-v1'));
    const result=await f.page.evaluate(()=>{
      const base={id:'boundary:invalid',kind:'settlement',settle:IMI.ops.extensions.vaultBoundary,build:p=>p,continue:()=>{}};
      return ['purchase','refund','activation'].map(kind=>Rewards.runLocalTransaction({...base,kind})).concat(Rewards.runLocalTransaction({...base,settle:()=>({done:true})}));
    });
    assert.deepEqual(result,[false,false,false,false]);assert.equal(await f.page.evaluate(()=>localStorage.getItem('imi-ops-v1')),before);
    assert.equal(await h.invoke(f,{build:'p=>{window.__reentrant=Rewards.runLocalTransaction({id:"boundary:reentrant",kind:"settlement",settle:IMI.ops.extensions.vaultBoundary,build:x=>x,continue:()=>{__continued++;}});return p;}'}),true);
    assert.equal(await f.page.evaluate(()=>__reentrant),false);const v=await h.capture(f,'coordinator-unavailable');assert.equal(v.continued,1);assert.equal(v.closed,1);
  }finally{await f.close();}
});
for(const [itemId,cost]of [['lamp-plus:1',100],['typist-speed:1',150]])test('uninstalled '+itemId+' provider cannot acknowledge a false old-effects boundary',async()=>{
  const s=JSON.parse(h.records()['imi-ops-v1']),v=h.vault();
  v.nextSequence=2;v.owned[itemId]='vault:1';v.active[itemId]='vault:1';
  v.purchases['vault:1']={version:1,itemId,catalogueRevision:1,sequence:1,status:'active',cost,debitEarned:cost,debitBought:0,priorTier:0,targetTier:1,createdWallMs:0,activatedWallMs:0,printingAtPurchase:0};
  Object.assign(s.prem,{vault:v,earned:0,earnedTotal:cost,spentEarned:cost,credits:{fixture:{source:'earned',amount:cost}}});
  const f=await h.fixture(b,{...h.records(),'imi-ops-v1':JSON.stringify(s)});
  try{const before=await f.page.evaluate(()=>localStorage.getItem('imi-ops-v1'));assert.equal(await h.invoke(f),false);const after=await h.capture(f,'coordinator-provider-'+itemId.replace(':','-'));assert.equal(after.opsRaw,before);assert.equal(after.state.prem.vault.transition,undefined);assert.equal(after.continued,0);}finally{await f.close();}
});
for(const [name,build]of [['claims','p=>({...p,rewards:{claims:{}}})'],['credits','p=>({...p,prem:{credits:{fake:{source:"bought",amount:1}}}})'],['lastSeen','p=>({...p,lastSeen:999999})'],['prototype','p=>Object.create(p)']])test('rejects unleased '+name+' proposal without publication',async()=>{
  const f=await h.fixture(b);
  try {const before=await f.page.evaluate(()=>localStorage.getItem('imi-ops-v1'));assert.equal(await h.invoke(f,{build}),false);const v=await h.capture(f,'coordinator-reject-'+name);assert.equal(v.opsRaw,before);assert.equal(v.continued,0);assert.equal(v.state.prem.vault,undefined);assert.equal(v.held,true);}finally{await f.close();}
});
test('wallet baseline failure yields one intent; actual Retry closes it once and reentrant dispatch is refused',async()=>{
  const f=await h.fixture(b);
  try {
    assert.equal(await h.invoke(f,{fail:{key:'imi-score',stage:'any',remaining:1}}),false);
    const held=await h.capture(f,'coordinator-wallet-held');assert.equal(held.state.prem.vault,undefined);assert.equal(held.continued,0);
    const result=await f.page.evaluate(()=>{const duplicate=Rewards.runLocalTransaction({id:'boundary:duplicate',kind:'settlement',settle:IMI.ops.extensions.vaultBoundary,build:p=>p,continue:()=>{__continued++;}});const first=Rewards.retry(),second=Rewards.retry();return {duplicate,first,second};});
    assert.equal(result.duplicate,false);assert.equal(result.first,true);
    const v=await h.capture(f,'coordinator-wallet-recovered');assert.equal(v.closed,1);assert.equal(v.continued,1);assert.equal(v.held,false);
  }finally{await f.close();}
});
test('visible award hold conserves the actual tick prefix and resumes its remaining income/RNG work once',async()=>{
  const awards=Object.fromEntries([...require('node:fs').readFileSync('docs/plan/long-game/LG-01-reward-design.md','utf8').matchAll(/^\| (\w+) \| .*? \| (?:Bronze|Silver|Gold) \| [LCGD]/gm)].map(m=>[m[1],m[1]!=='l100']));
  const input=h.records({awards,rewards:{},intro:{version:1,done:true,train:true,words:true,shop:true,hireAt:0}});
  const outcomes=[];
  for(const failure of [false,true]){
    const f=await h.fixture(b,input,{hidden:false,tune:{PAW_BASE:[.01,9,27,81,243,729]}});
    try {
      await f.page.evaluate(()=>{const d=IMI.ops.dev,S=d.S();for(let i=0;i<3;i++){__mono+=250;d.tick();}S.stats.letters=99;S.desks[0].paws=1;});
      const ok=await h.invoke(f,{hidden:false,mono:2000,fail:failure?{key:'imi-ops-v1',stage:'claim',id:'award:l100',status:'prepared',remaining:1}:null});
      assert.equal(ok,!failure);
      if(failure){const held=await h.capture(f,'coordinator-visible-held');assert.equal(held.state.prem.vault,undefined);assert.equal(held.continued,0);assert.equal(await f.page.evaluate(()=>Rewards.retry()),true);}
      const v=await h.capture(f,'coordinator-visible-'+failure);assert.equal(v.state.rewards.claims['award:l100'].status,'committed');assert.equal(v.continued,1);assert.equal(v.closed,1);
      outcomes.push({letters:v.state.stats.letters,words:v.state.stats.words,secs:v.state.stats.secs,playSecs:v.state.stats.playSecs,pool:v.state.desks[0].letters,wallet:v.wallet,earned:v.state.run.earned});
    }finally{await f.close();}
  }
  assert.deepEqual(outcomes[1],outcomes[0]);assert.equal(outcomes[0].secs,1);assert.equal(outcomes[0].playSecs,1);assert.ok(outcomes[0].letters>100);
});
