// Bounded enabled measurement uses the existing, unchanged policy and simulated UI bridge.
import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {browser,fixture} from './lg01-b-fixture.mjs';
const b=await browser();let f;
try {
  f=await fixture(b);await f.page.waitForFunction(()=>!!window.Bot);
  await f.page.evaluate(()=>Bot.start({profile:'active',strategy:'collect',seed:1,activeMinutes:30}));
  for(let minute=0;minute<60;minute++)await f.page.evaluate(()=>Bot.run(1));
  const value=await f.page.evaluate(()=>{
    const s=IMI.ops.dev.S(),payouts={};
    for(const c of Object.values(s.rewards.claims))if(c.status==='committed'){
      const d=c.descriptor,row=payouts[d.kind]??={claims:0,amount:0};row.claims++;row.amount+=d.amount;
    }
    return {report:Bot.report(),state:s,wallet:JSON.parse(localStorage.getItem('imi-score')),payouts};
  });
  assert.equal(value.report.actualMinutes,60);assert.deepEqual(f.errors,[]);
  await writeFile('docs/plan/long-game/evidence/LG-01/implementation-c-r2/enabled-hour.json',JSON.stringify({coverage:'Actual Ops/Rewards/Economy; simulated UI bridge. No UI-driven automation or final pacing acceptance.',hashes:f.hashes,errors:f.errors,...value},null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({payouts:value.payouts,marks:value.report.marks}));
}finally{await f?.close();await b.close();}
