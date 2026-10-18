const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
let h,browser;
before(async()=>{h=await import('../tools/long-game/lg01-b-fixture.mjs');browser=await h.browser();});
after(async()=>{await browser?.close();});

// Real status/Retry/Ops attachment callers on the simulated balance bridge, not native lifecycle proof.
test('failed Retry preserves authoritative chip nodes and held state; recovery restores their original host and style',async()=>{
  const f=await h.fixture(browser,{records:await h.records({intro:{version:1,done:true,train:true,words:true,shop:true,hireAt:0},written:{'ape-in-the-cape':true},awards:{l100:true,s1:true}}),fault:{claim:'award:l1k',stage:'prepared',remaining:1}});
  try {
    const held=await f.page.evaluate(()=>{
      window.__OPS_HEADLESS=false;IMI.ops.extensions.setTab('floor');
      IMI.ops.dev.buffs.frenzy=performance.now()+30000;IMI.ops.dev.buffs.snack=performance.now()+120000;
      IMI.ops.dev.S().challenge={id:'vowel',start:Date.now()};IMI.ops.extensions.mark();__advance(400);
      const bar=document.querySelector('.o-buffbar');window.__chips=[...bar.children];window.__host=bar.parentNode;window.__style=bar.getAttribute('style');
      IMI.ops.dev.S().stats.letters=1000;IMI.ops.dev.checkAwards(true);
      window.__held={state:JSON.stringify(IMI.ops.dev.S()),ops:localStorage.getItem('imi-ops-v1'),wallet:localStorage.getItem('imi-score'),buffs:JSON.stringify(IMI.ops.dev.buffs),text:bar.textContent};
      return {held:Rewards.held(),inside:document.querySelector('.o-writer-status').contains(bar),sameNodes:__chips.every((n,i)=>bar.children[i]===n),count:__chips.length,rejected:__writes.filter(w=>w.rejected).length};
    });
    assert.equal(held.held,true);assert.equal(held.rejected,1);assert.equal(held.count,3);assert.equal(held.inside,true);assert.equal(held.sameNodes,true);
    const repeated=await f.page.evaluate(()=>{
      const set=Storage.prototype.setItem;let reject=true;
      Storage.prototype.setItem=function(k,v){if(reject&&k==='imi-ops-v1'){reject=false;__writes.push({key:k,value:v,rejected:true});throw new DOMException("Failed to execute 'setItem' on 'Storage': Setting the value of 'imi-ops-v1' exceeded the quota.",'QuotaExceededError');}return set.call(this,k,v);};
      document.querySelector('.o-writer-status button').click();
      const bar=document.querySelector('.o-buffbar'),panel=document.querySelector('.o-writer-status');
      return {inside:panel.contains(bar),sameNodes:__chips.every((n,i)=>bar.children[i]===n),sameState:__held.state===JSON.stringify(IMI.ops.dev.S()),sameKeys:__held.ops===localStorage.getItem('imi-ops-v1')&&__held.wallet===localStorage.getItem('imi-score'),sameBuffs:__held.buffs===JSON.stringify(IMI.ops.dev.buffs),sameText:__held.text===bar.textContent,focused:document.activeElement===panel.lastChild,status:panel.textContent};
    });
    for(const key of ['inside','sameNodes','sameState','sameKeys','sameBuffs','sameText','focused'])assert.equal(repeated[key],true,key);
    assert.match(repeated.status,/exceeded the quota/);
    const recovered=await f.page.evaluate(()=>{
      document.querySelector('.o-writer-status button').click();const bar=document.querySelector('.o-buffbar');
      return {held:Rewards.held(),hidden:document.querySelector('.o-writer-status').hidden,host:bar.parentNode===__host,style:bar.getAttribute('style')===__style,sameNodes:__chips.every((n,i)=>bar.children[i]===n),bars:document.querySelectorAll('.o-buffbar').length,claim:IMI.ops.dev.S().rewards.claims['award:l1k'],saved:JSON.parse(localStorage.getItem('imi-ops-v1')).rewards.claims['award:l1k']};
    });
    assert.equal(recovered.held,false);for(const key of ['hidden','host','style','sameNodes'])assert.equal(recovered[key],true,key);assert.equal(recovered.bars,1);assert.equal(recovered.claim.status,'committed');assert.deepEqual(recovered.claim,recovered.saved);
    await h.capture(f,'held-presentation-recovery');assert.deepEqual(f.errors,[]);
  }finally{await f.close();}
});

test('Awards metadata holds work without chips and across successive holds; departure restores nodes and refuses stale Retry',async()=>{
  const f=await h.fixture(browser,{records:await h.records({intro:{version:1,done:true,train:true,words:true,shop:true,hireAt:0},written:{'ape-in-the-cape':true},awards:{l100:true,s1:true}})});
  try {
    await f.page.evaluate(()=>{window.__OPS_HEADLESS=false;IMI.ops.extensions.setTab('records');window.__rejectUI=1;const set=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k==='imi-ops-v1'&&__rejectUI-->0){__writes.push({key:k,value:v,rejected:true});throw Error('Metadata hold');}return set.call(this,k,v);};});
    await f.page.click('[data-act="rewards:acknowledge"]');
    const empty=await f.page.evaluate(()=>({held:Rewards.held(),count:document.querySelector('.o-buffbar').children.length,inside:document.querySelector('.o-writer-status').contains(document.querySelector('.o-buffbar')),tab:IMI.ops.dev.ui.tab}));
    assert.equal(empty.held,true);assert.equal(empty.count,0);assert.equal(empty.inside,true);assert.equal(empty.tab,'records');
    await f.page.click('.o-writer-status button');
    assert.equal(await f.page.evaluate(()=>IMI.ops.dev.S().rewards.summaryAcknowledged),true);
    const departed=await f.page.evaluate(()=>{
      IMI.ops.dev.buffs.critic=performance.now()+120000;IMI.ops.extensions.mark();__advance(400);
      window.__chips=[...document.querySelector('.o-buffbar').children];IMI.ops.dev.S().stats.letters=1000;
      __rejectUI=1;IMI.ops.dev.checkAwards(true);const inside=document.querySelector('.o-writer-status').contains(document.querySelector('.o-buffbar'));
      dispatchEvent(new Event('pagehide'));const before=[localStorage.getItem('imi-score'),localStorage.getItem('imi-ops-v1')],retry=Rewards.retry(),bar=document.querySelector('.o-buffbar');
      return {inside,host:bar.parentNode===document.querySelector('.o-wrap'),sameNodes:__chips.every((n,i)=>bar.children[i]===n),panelChips:document.querySelector('.o-writer-status').querySelectorAll('.o-buff').length,owner:Rewards.owns(),retry,keysSame:JSON.stringify(before)===JSON.stringify([localStorage.getItem('imi-score'),localStorage.getItem('imi-ops-v1')])};
    });
    assert.equal(departed.inside,true);assert.equal(departed.host,true);assert.equal(departed.sameNodes,true);assert.equal(departed.panelChips,0);assert.equal(departed.owner,false);assert.equal(departed.retry,false);assert.equal(departed.keysSame,true);
    await h.capture(f,'held-presentation-departed');assert.deepEqual(f.errors,[]);
  }finally{await f.close();}
});
