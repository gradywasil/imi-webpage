import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as h from './lg02-b2-r2-fixture.mjs';
const out='docs/plan/long-game/evidence/LG-02/qa-runtime-b2-r1',browser=await h.browser(),rows=[];
async function check(name,fn){const row={name};rows.push(row);try{row.evidence=await fn();row.pass=true;}catch(e){row.pass=false;row.error={message:e.message,stack:e.stack};}}
try{
  // The existing visible test compares output pools, but never the actual RNG cursor.
  await check('visible multi-paw RNG and work after two nested preparation failures',async()=>{
    const awards=Object.fromEntries([...fs.readFileSync('docs/plan/long-game/LG-01-reward-design.md','utf8').matchAll(/^\| (\w+) \| .*? \| (?:Bronze|Silver|Gold) \| [LCGD]/gm)].map(m=>[m[1],m[1]!=='l100'])),results=[];
    for(const failures of [0,2]){
      const f=await h.fixture(browser,h.records({awards,rewards:{},intro:{version:1,done:true,train:true,words:true,shop:true,hireAt:0}}),{hidden:false,tune:{PAW_BASE:[.01,9,27,81,243,729]}});
      try{
        await f.page.evaluate(()=>{const d=IMI.ops.dev;for(let i=0;i<3;i++){__mono+=250;d.tick();}d.S().stats.letters=99;d.S().desks[0].paws=3;});
        const invoked=await h.invoke(f,{hidden:false,mono:2000,fail:failures?{key:'imi-ops-v1',stage:'claim',id:'award:l100',status:'prepared',remaining:failures}:null});
        const retries=[];if(failures)for(let n=0;n<3&&await f.page.evaluate(()=>Rewards.held());n++)retries.push(await f.page.evaluate(()=>Rewards.retry()));
        const value=await f.page.evaluate(()=>({rng:__rng,calls:__rngCalls,stats:IMI.ops.dev.S().stats,bank:IMI.ops.dev.S().bank,desks:IMI.ops.dev.S().desks,wallet:IMI.bananas.get(),continued:__continued,closed:__closed,held:Rewards.held()}));
        results.push({failures,invoked,retries,value});await h.capture(f,'independent-rng-'+failures);assert.deepEqual(f.errors,[]);
      }finally{await f.close();}
    }
    fs.writeFileSync(out+'/adversarial-rng-input-output.json',JSON.stringify(results,null,2),{flag:'wx'});
    assert.deepEqual(results[1].value,results[0].value);assert.deepEqual(results[1].retries,[false,true]);return results.map(r=>({failures:r.failures,rng:r.value.rng,calls:r.value.calls,retries:r.retries}));
  });
  for(const name of ['unexplained-wallet-marker','missing-eligible-claim','contradictory-earned-credit'])await check(name,async()=>{
    const f=await h.fixture(browser);
    try{
      const result=await f.page.evaluate(name=>{
        const s=IMI.ops.extensions.state();
        if(name==='unexplained-wallet-marker')Economy.saveScoreAcknowledged(IMI.bananas.get(),{id:'unknown:qa',sequence:1,amount:25});
        if(name==='missing-eligible-claim')s.awards.l100=true;
        if(name==='contradictory-earned-credit'){s.prem.earned=2;s.prem.earnedTotal=2;s.prem.credits.fake={source:'bought',amount:2};}
        const before=[localStorage.getItem('imi-ops-v1'),localStorage.getItem('imi-score')];
        const result=Rewards.runLocalTransaction({id:'boundary:qa-invalid',kind:'settlement',settle:IMI.ops.extensions.vaultBoundary,build:p=>p,continue:()=>__continued++});
        return {result,held:Rewards.held(),continued:__continued,vault:!!s.prem.vault,keysSame:JSON.stringify(before)===JSON.stringify([localStorage.getItem('imi-ops-v1'),localStorage.getItem('imi-score')])};
      },name);
      await h.capture(f,'independent-'+name);assert.deepEqual(result,{result:false,held:true,continued:0,vault:false,keysSame:true});return result;
    }finally{await f.close();}
  });
  await check('held hidden, ordinary save and pending Core timer preserve keys',async()=>{
    const f=await h.fixture(browser);
    try{
      await h.invoke(f,{fail:{key:'imi-ops-v1',stage:'close',remaining:4}});
      const result=await f.page.evaluate(async()=>{
        const keys=[localStorage.getItem('imi-ops-v1'),localStorage.getItem('imi-score')],count=__writes.length;
        __hidden=true;document.dispatchEvent(new Event('visibilitychange'));dispatchEvent(new Event('beforeunload'));
        const save=IMI.ops.saveAcknowledged();IMI.ops.extensions.save();__mono+=5000;IMI.ops.dev.tick();
        await new Promise(r=>window.setTimeout(r,1700));
        return {save:save.ok,same:JSON.stringify(keys)===JSON.stringify([localStorage.getItem('imi-ops-v1'),localStorage.getItem('imi-score')]),writes:__writes.length-count,continued:__continued,held:Rewards.held()};
      });await h.capture(f,'independent-held-finalizers');assert.deepEqual(result,{save:false,same:true,writes:0,continued:0,held:true});return result;
    }finally{await f.close();}
  });
}finally{await browser.close();fs.writeFileSync(out+'/adversarial-results.json',JSON.stringify({coverage:'Real module assembly and acknowledgements; controlled clocks, no full-shell Vault admission or native lifecycle claim',rows},null,2),{flag:'wx'});console.log(JSON.stringify(rows));if(rows.some(r=>!r.pass))process.exitCode=1;}
