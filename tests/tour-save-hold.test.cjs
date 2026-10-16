const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
let h,browser;
before(async()=>{h=await import('../tools/long-game/lg02-b2-r3-fixture.mjs');browser=await h.browser();});
after(async()=>{await browser?.close();});

for(const edition of ['pixel','classic'])test(edition+' actual inserted/moved recovery hides immediately and repeated Retry restores the same mandatory step once',async()=>{
 const f=await h.fixture(browser,{edition,track:true});
 try{
  const before=await f.page.evaluate(()=>({tour:localStorage.getItem('imi-tour'),text:document.querySelector('.tour-txt').textContent,barHost:document.querySelector('.o-buffbar').parentNode===document.body}));
  const immediate=await f.page.evaluate(async expression=>{window.__r3RenderCount=0;IMI.on('render',()=>__r3RenderCount++);const result=eval(expression),rendersAtReturn=__r3RenderCount;await Promise.resolve();return {...result,bubbleHidden:document.querySelector('.tour-bub').hidden,ringHidden:document.querySelector('.tour-ring').hidden,renderDelta:__r3RenderCount-rendersAtReturn,focus:document.activeElement===document.querySelector('.o-writer-status button')};},h.holdExpression);
  assert.equal(immediate.held,true);assert.equal(immediate.bubbleHidden,true);assert.equal(immediate.ringHidden,true);assert.equal(immediate.renderDelta,0,'hide at mutation delivery without productive render/timer');assert.equal(immediate.focus,true);
  const held=await h.capture(f,edition+'-held');
  assert.equal(held.bubbleHidden,true);assert.equal(held.ringHidden,true);assert.equal(held.intro,true);assert.equal(held.continued,0);assert.equal(held.tour,before.tour);
  const moved=await f.page.evaluate(async()=>{const panel=document.querySelector('.o-writer-status'),host=panel.parentNode;document.body.appendChild(panel);await Promise.resolve();const bodyHidden=document.querySelector('.tour-bub').hidden;host.appendChild(panel);await Promise.resolve();return {bodyHidden,opsHidden:document.querySelector('.tour-bub').hidden,focus:document.activeElement===panel.lastChild,chips:panel.contains(document.querySelector('.o-buffbar')),observation:__r3Observers.flatMap(o=>o.targets)};});
  assert.equal(moved.bodyHidden,true);assert.equal(moved.opsHidden,true);assert.equal(moved.chips,true);
  assert.equal(moved.observation.some(t=>t.options.subtree),false,'no body/ops subtree mutation stream');
  await f.page.focus('.o-writer-status button');await f.page.keyboard.press('Enter');
  const failed=await h.capture(f,edition+'-repeated-failure');assert.equal(failed.held,true);assert.equal(failed.continued,0);assert.deepEqual(failed.keys,held.keys);assert.equal(failed.tour,before.tour);
  assert.equal(await f.page.evaluate(()=>document.activeElement===document.querySelector('.o-writer-status button')),true);
  await f.page.keyboard.press('Space');
  const restored=await h.capture(f,edition+'-restored');assert.equal(restored.held,false);assert.equal(restored.bubbleHidden,false);assert.equal(restored.continued,1);assert.equal(restored.intro,true);assert.equal(restored.tour,before.tour);assert.equal(restored.text,before.text);
  assert.equal(await f.page.evaluate(()=>document.querySelector('.o-buffbar').parentNode===document.body),before.barHost);
  assert.equal(await f.page.evaluate(()=>Rewards.runLocalTransaction({id:'boundary:tour-r-three',kind:'settlement',settle:IMI.ops.extensions.vaultBoundary,build:p=>p,continue:()=>__r3Continued++})),false);
  assert.deepEqual(f.errors,[]);
 }finally{await f.close();}
});

test('panel already visible when the tour starts restores guidance after real migration Retry',async()=>{
 const f=await h.fixture(browser,{startupHold:true});
 try{
  const held=await h.capture(f,'startup-held');assert.equal(held.held,true);assert.equal(held.bubbleHidden,true);
  await f.page.keyboard.press('Enter');
  await f.page.waitForFunction(()=>!document.querySelector('.tour-bub').hidden);
  const restored=await h.capture(f,'startup-restored');assert.equal(restored.held,false);assert.equal(restored.intro,true);assert.equal(restored.tour,held.tour);assert.deepEqual(f.errors,[]);
 }finally{await f.close();}
});

test('pending one-shot tip survives longer than its timeout in recovery and resumes its remaining display time',async()=>{
 const f=await h.fixture(browser,{tip:true});
 try{
  await f.page.evaluate(()=>IMI.emit('daily'));
  const before=await h.capture(f,'tip-before');assert.match(before.text,/Come back tomorrow/);assert.equal(before.bubbleHidden,false);
  await f.page.evaluate(h.holdExpression);
  await new Promise(resolve=>setTimeout(resolve,11500));
  const held=await h.capture(f,'tip-held-past-expiry');assert.equal(held.bubbleHidden,true);assert.equal(held.tour,before.tour);
  await f.page.evaluate(()=>{__r3Reject=0;return Rewards.retry();});
  const restored=await h.capture(f,'tip-restored');assert.equal(restored.bubbleHidden,false);assert.equal(restored.text,before.text);assert.equal(restored.tour,before.tour);assert.equal(restored.continued,1);
  await f.page.waitForFunction(()=>document.querySelector('.tour-bub').hidden,{timeout:13000});
  assert.deepEqual(f.errors,[]);
 }finally{await f.close();}
});

test('owner departure disconnects recovery observation, hides guidance and refuses old Retry',async()=>{
 const f=await h.fixture(browser,{track:true});
 try{
  await f.page.evaluate(h.holdExpression);
  const result=await f.page.evaluate(async()=>{__r3Reject=0;dispatchEvent(new Event('pagehide'));const keys=[localStorage.getItem('imi-ops-v1'),localStorage.getItem('imi-score')],retry=Rewards.retry();document.querySelector('.o-writer-status').hidden=true;await Promise.resolve();return {owner:Rewards.owns(),retry,disconnected:__r3Observers.every(o=>o.disconnected),bubbleHidden:document.querySelector('.tour-bub').hidden,ringHidden:document.querySelector('.tour-ring').hidden,keysSame:JSON.stringify(keys)===JSON.stringify([localStorage.getItem('imi-ops-v1'),localStorage.getItem('imi-score')])};});
  assert.deepEqual(result,{owner:false,retry:false,disconnected:true,bubbleHidden:true,ringHidden:true,keysSame:true});
  await h.capture(f,'owner-loss');assert.deepEqual(f.errors,[]);
 }finally{await f.close();}
});

for(const flags of ['','lg01a=1','lg01a=1&lg02=1'])test('ordinary no-recovery tutorial remains mandatory with flags '+flags,async()=>{
 const f=await h.fixture(browser,{flags});
 try{
  const before=await f.page.evaluate(()=>({manual:IMI.ops.dev.S().stats.manual,intro:IMI.ops.introActive(),skip:document.querySelector('.tour-skip').hidden,bubble:document.querySelector('.tour-bub').hidden}));
  assert.equal(before.intro,true);assert.equal(before.skip,true);assert.equal(before.bubble,false);
  await f.page.focus('#oStage');await f.page.keyboard.press('Enter');
  assert.equal(await f.page.evaluate(()=>IMI.ops.dev.S().stats.manual),before.manual+1);
  assert.equal(await f.page.evaluate(()=>IMI.ops.introActive()),true);assert.deepEqual(f.errors,[]);
 }finally{await f.close();}
});
