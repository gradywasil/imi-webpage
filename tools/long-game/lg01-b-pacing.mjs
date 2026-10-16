// Bounded reward-enabled evidence, unchanged Bot policy, simulated UI bridge.
import { mkdir,writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { browser,fixture,base } from './lg01-b-fixture.mjs';
const b=await browser();let f;
try{
  f=await fixture(b);await f.page.waitForFunction(()=>!!window.Bot);
  await f.page.evaluate(()=>Bot.start({profile:'active',strategy:'collect',seed:1,activeMinutes:30}));
  for(let minute=0;minute<60;minute++)await f.page.evaluate(()=>Bot.run(1));
  const value=await f.page.evaluate(()=>{const s=IMI.ops.dev.S(),claims=s.rewards.claims,totals={};
    for(const c of Object.values(claims))if(c.status==='committed'){const d=c.descriptor;const row=totals[d.kind]??={claims:0,amount:0};row.claims++;row.amount+=d.amount;}
    return {report:Bot.report(),state:s,wallet:JSON.parse(localStorage.getItem('imi-score')),payouts:totals,
      storedTokens:Object.values(s.rewards.storedGold.tokens).filter(t=>t.status==='stored').length,
      consumedTokens:Object.values(s.rewards.storedGold.tokens).filter(t=>t.status==='consumed').length};
  });
  assert.equal(value.report.actualMinutes,60);assert.deepEqual(f.errors,[]);
  await mkdir(base+'/pacing',{recursive:true});
  await writeFile(base+'/pacing/enabled-final-details.json',JSON.stringify({coverage:'actual Ops/Rewards/Economy; simulated UI bridge, not native Core or final pacing acceptance',complete:true,profile:'active',strategy:'collect',seed:1,activeMinutes:30,hashes:f.hashes,errors:f.errors,...value},null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({complete:true,payouts:value.payouts,storedTokens:value.storedTokens,consumedTokens:value.consumedTokens,final:value.report.final}));
}finally{await f?.close();await b.close();}
