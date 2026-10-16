const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync,writeFileSync}=require('node:fs');
const path='docs/plan/long-game/evidence/LG-01/repair-b-r2';
const probe=readFileSync(path+'/probe.js','utf8');
let h,browser,input;
before(async()=>{
  h=await import('../tools/long-game/lg01-b-fixture.mjs');browser=await h.browser();
  const ids=[...readFileSync('docs/plan/long-game/LG-01-reward-design.md','utf8').matchAll(/^\| (\w+) \| .*? \| (?:Bronze|Silver|Gold) \| [LCGD]/gm)].map(m=>m[1]);
  input=await h.records({awards:Object.fromEntries(ids.map(id=>[id,true])),printing:1,chDone:{vowel:true,haiku:true,hands:true,timed:true},
    meta:{repair:'preserve'},rewards:{unknown:'preserve'},intro:{version:1,done:true,train:true,words:true,shop:true,hireAt:0}});
});
after(async()=>{await browser?.close();});
const save=(name,data)=>writeFileSync(path+'/'+process.env.REPAIR_PHASE+'-'+name+'.json',JSON.stringify(data,null,2)+'\n',{flag:'wx'});
const scalar=v=>({wallet:v.wallet,run:v.state.run.earned,roy:v.state.royTotal,div:v.state.divTotal,lump:v.state.stats.lump,
  written:v.state.written,bank:v.state.bank,checkpoint:v.state.rewards.awayCheckpoint});
async function run(options,reload=false){
  const f=await h.fixture(browser,{records:input,speed:options.timed?2:1,rngStart:0});
  try{
    const first=await f.page.evaluate('('+probe+')('+JSON.stringify(options)+')');
    const retries=[];
    if(!reload) for(let i=0;i<options.failures+1;i++) retries.push(await f.page.evaluate(()=>({ok:Rewards.retry(),rejected:__repairProbe.rejected(),value:__repairProbe.snap()})));
    const final=await f.page.evaluate(()=>__repairProbe.snap());
    const writes=await f.page.evaluate(()=>__repairWrites);
    let resumed,initialReference;
    if(reload){
      const loaded=await h.fixture(browser,{records:first.stopped.records,speed:options.timed?2:1,rngStart:0});
      try{
        resumed=await loaded.page.evaluate(()=>({wallet:IMI.bananas.get(),state:IMI.ops.dev.S(),running:IMI.ops.progression.running()}));
        if(options.stage==='initial') {
          assert.deepEqual(scalar(resumed),scalar(first.before),'unacknowledged absence request is absent after reload');
          const fresh=await h.fixture(browser,{records:first.before.records,speed:1,rngStart:0});
          try{initialReference=await fresh.page.evaluate(()=>{__skip(3600000);IMI.ops.simulateAway(3600);return {wallet:IMI.bananas.get(),state:IMI.ops.dev.S()};});}
          finally{await fresh.close();}
          await loaded.page.evaluate(()=>{__skip(3600000);IMI.ops.simulateAway(3600);});
          resumed=await loaded.page.evaluate(()=>({wallet:IMI.bananas.get(),state:IMI.ops.dev.S(),running:IMI.ops.progression.running()}));
        }
        assert.deepEqual(loaded.errors,[]);
      }
      finally{await loaded.close();}
    }
    return {hashes:f.hashes,errors:f.errors,first,retries,final,writes,resumed,initialReference};
  }finally{await f.close();}
}
for(const lane of ['sale','roy','div']) test('real away '+lane+' baseline Retry preserves payment and lifetime effects',async()=>{
  const control=await run({lane,failures:0}),fault=await run({lane,failures:2});save(lane+'-retry',{control,fault});
  assert.equal(fault.first.rejected,1,'intended baseline must reject');
  assert.equal(fault.first.stopped.running,false);assert.equal(fault.retries.at(-1).ok,true);
  assert.deepEqual(scalar(fault.final),scalar(control.final));assert.deepEqual(fault.errors,[]);
  assert.equal(fault.retries[0].rejected,2,'Retry must reach repeated baseline fault');
  assert.equal(fault.final.state.meta.repair,'preserve');assert.equal(fault.final.state.rewards.unknown,'preserve');
});
if(process.env.REPAIR_PHASE!=='red') for(const stage of ['baseline','prepare','wallet','final']) test('successive royalty then division '+stage,async()=>{
  const options={lane:'div',successive:true},control=await run({...options,failures:0}),fault=await run({...options,stage,failures:2});
  save('income-'+stage,{control,fault});assert.equal(fault.first.rejected,1);assert.equal(fault.retries[0].rejected,2);
  assert.deepEqual(scalar(fault.final),scalar(control.final));assert.equal(fault.final.state.rewards.walletHead.sequence,2);
});
if(process.env.REPAIR_PHASE!=='red') for(const lane of ['sale','roy','div']) for(const stage of ['baseline','prepare','wallet','final','delete','initial']) test('acknowledged-key reload '+lane+' '+stage,async()=>{
  const control=await run({lane,failures:0}),fault=await run({lane,stage,failures:1},true);save(lane+'-'+stage+'-reload',{control,fault});
  assert.equal(fault.first.rejected,1,'intended '+stage+' must reject');assert.equal(fault.first.stopped.running,false);
  assert.deepEqual(scalar(fault.resumed),scalar(fault.initialReference||control.final));assert.equal(fault.resumed.running,true);
});
if(process.env.REPAIR_PHASE!=='red') for(const timed of [false,true]) for(const stage of ['baseline','prepare','wallet','final','delete']) test('successive '+(timed?'timed':'bulk')+' sale Retry '+stage,async()=>{
  const options={lane:'sale',timed,multiple:true},control=await run({...options,failures:0}),fault=await run({...options,stage,failures:2});
  save((timed?'timed':'bulk')+'-'+stage,{control,fault});assert.equal(fault.first.rejected,1);assert.equal(fault.retries[0].rejected,2);
  assert.deepEqual(scalar(fault.final),scalar(control.final));assert.ok(Object.keys(fault.final.state.written).length>1);
});
if(process.env.REPAIR_PHASE!=='red') test('paid wallet recovery can fail its repeated baseline without repeating run or lifetime income',async()=>{
  const f=await h.fixture(browser,{records:input,rngStart:0});
  try{
    const first=await f.page.evaluate('('+probe+')({lane:"div",stage:"final",failures:1})');
    assert.equal(first.rejected,1);
    const result=await f.page.evaluate(()=>{
      const original=Storage.prototype.setItem;let rejected=0;
      Storage.prototype.setItem=function(k,v){if(k==='imi-score'&&!rejected++){__repairWrites.push({key:k,value:v,rejected:true,stage:'recovery-baseline'});throw Error('recovery baseline');}return original.call(this,k,v);};
      IMI.ops.dev.S().run.earned+=9000;IMI.ops.dev.S().divs.songs=2;
      const a=Rewards.retry(),stopped=__repairProbe.snap(),b=Rewards.retry();
      return {a,stopped,b,final:__repairProbe.snap(),writes:__repairWrites};
    });save('paid-recovery-baseline',{first,result});
    assert.equal(result.a,false);assert.equal(result.b,true);assert.equal(result.stopped.wallet,189000);
    assert.equal(result.final.wallet,189000);assert.equal(result.final.state.divTotal,189000);assert.equal(result.final.state.run.earned,198000);
    assert.equal(result.final.state.rewards.awayCheckpoint,undefined);
  }finally{await f.close();}
});
if(process.env.REPAIR_PHASE!=='red') test('baseline recovery stops again at the enclosing live Deadline first-clear, then completes once',async()=>{
  const records={...input},s=JSON.parse(records['imi-ops-v1']);s.chDone.timed=false;records['imi-ops-v1']=JSON.stringify(s);
  const f=await h.fixture(browser,{records,speed:2,rngStart:0,fault:{stage:'committed',claim:'challenge:timed:first',remaining:1}});
  try{
    const first=await f.page.evaluate('('+probe+')({lane:"sale",timed:true,multiple:true,failures:1})');
    const result=await f.page.evaluate(()=>{
      const a=Rewards.retry(),middle=__repairProbe.snap(),b=Rewards.retry();return {a,middle,b,final:__repairProbe.snap(),writes:__repairWrites,fixtureWrites:__writes};
    });save('nested-deadline',{first,result});
    assert.equal(first.rejected,1);assert.equal(result.middle.running,false);assert.equal(result.middle.state.rewards.claims['challenge:timed:first'].status,'prepared');
    assert.ok(result.fixtureWrites.some(w=>w.rejected&&JSON.parse(w.value).rewards?.claims?.['challenge:timed:first']?.status==='committed'));
    assert.equal(result.final.state.rewards.claims['challenge:timed:first'].status,'committed');assert.equal(result.final.state.prem.earned,109);
    assert.equal(result.final.state.challenge,null);assert.equal(result.final.state.rewards.awayCheckpoint,undefined);
    assert.equal(result.final.state.run.earned,result.final.wallet);
  }finally{await f.close();}
});
