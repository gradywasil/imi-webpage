const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
let h,b;
before(async()=>{h=await import('../tools/long-game/lg02-b2-r2-fixture.mjs');b=await h.browser();});
after(async()=>{await b?.close();});
test('registered/direct Core and Ops finalizers preserve failed boundary and old owner becomes inert',async()=>{
  const f=await h.fixture(b);
  try{
    assert.equal(await h.invoke(f,{fail:{key:'imi-ops-v1',stage:'open',remaining:20}}),false);
    const before=await h.capture(f,'lifecycle-held');
    await f.page.evaluate(()=>{dispatchEvent(new Event('beforeunload'));dispatchEvent(new Event('pagehide'));});
    const v=await h.capture(f,'lifecycle-departed');assert.equal(v.opsRaw,before.opsRaw);assert.equal(v.walletRaw,before.walletRaw);assert.equal(v.writes.length,before.writes.length);
    assert.equal(await f.page.evaluate(()=>Rewards.retry()),false);assert.equal(await f.page.evaluate(()=>IMI.bananas.saveAcknowledged().ok),false);
  }finally{await f.close();}
});
test('unchanged full-shell cold gate blocks even a valid internal Vault save',async()=>{
  const s=JSON.parse(h.records()['imi-ops-v1']);s.prem.vault=h.vault();
  const input={...h.records(),'imi-ops-v1':JSON.stringify(s)},f=await h.fixture(b,input,{fullShell:true});
  try{const v=await f.page.evaluate(()=>({blocked:VaultSaveGate.blocked,enabled:Rewards.enabled,imi:!!window.IMI,raw:localStorage.getItem('imi-ops-v1')}));assert.equal(v.blocked,true);assert.equal(v.enabled,false);assert.equal(v.imi,false);assert.equal(v.raw,input['imi-ops-v1']);}finally{await f.close();}
});
