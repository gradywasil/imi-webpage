from pathlib import Path
s=Path('tools/long-game/lg02d-native.cjs').read_text(encoding='utf-8-sig')
s=s.replace("evidence/LG-02/free-lamp-r1", "evidence/LG-02/free-lamp-net-r2")
s=s.replace("const flags='?lg01a=1&lg02=1&lg02lamp=1'", "const flags='?lg01a=1&lg02=1&lg02lamp=1&lg03=1'")
s=s.replace("s.lamp=3;s.printing=1;", "s.lamp=3;s.printing=5;s.meta.automation={version:1,net:{version:1,enabled:true,ordinary:0,golden:0}};")
a=s.index("    if(run.startsWith('undo')){")
b=s.index("    await page.waitForFunction(()=>IMI.ops.extensions.state().prem.vault.purchases['vault:1'].status==='active');",a)
s=s[:a]+'''    if(run.startsWith('failure')){
      const cdp=await page.createCDPSession();await cdp.send('Debugger.enable');
      const nativeSource=fs.readFileSync('automation.js','utf8');
      const line=nativeSource.split('\\n').findIndex(s=>s.includes('} else if (api.clock.productionNow() - slot.at >= 1000)'));
      const paused=new Promise(resolve=>cdp.once('Debugger.paused',resolve));
      const bp=await cdp.send('Debugger.setBreakpointByUrl',{url:origin+'/automation.js',lineNumber:line,condition:'kind === "golden" && slot.admitted && !window.__netProbe'});
      await page.evaluate(()=>{IMI.ops.extensions.setTab('floor');window.__nativeNow=performance.now();performance.now=()=>window.__nativeNow;IMI.ops.spawnGold(false);window.__nativeGold=document.querySelector('.o-gold');});
      const pause=await Promise.race([paused,new Promise((_,reject)=>setTimeout(()=>reject(Error('Native admitted net breakpoint timed out')),10000))]);
      const probe=await cdp.send('Debugger.evaluateOnCallFrame',{callFrameId:pause.callFrames[0].callFrameId,returnByValue:true,expression:`(() => {
        const selected=netItems.golden,originalItem=selected.item,at=selected.at;
        window.__netProbe=()=>({sameSlot:netItems.golden===selected,sameItem:selected.item===originalItem,sameNode:originalItem.el===window.__nativeGold,connected:originalItem.el.isConnected,admitted:selected.admitted,at:selected.at,originalAt:at,now:api.clock.productionNow(),mono:performance.now(),remaining:1000-(api.clock.productionNow()-at),phase:saved().net.golden,lease:netLease&&{id:netLease.id,mono:netLease.mono,wall:netLease.wall},held:Rewards.held(),gold:api.state().gold});
        return window.__netProbe();
      })()`});
      assert(!probe.exceptionDetails);write('native-admitted',probe.result.value);assert.equal(probe.result.value.admitted,true);assert.equal(probe.result.value.phase,1);assert.equal(probe.result.value.sameNode,true);
      await cdp.send('Debugger.removeBreakpoint',{breakpointId:bp.breakpointId});await cdp.send('Debugger.resume');
      const held=await page.evaluate(()=>{
        window.__nativeNow+=250;
        const original=Storage.prototype.setItem;window.__activationFaults=1;
        Storage.prototype.setItem=function(k,v){if(k==='imi-ops-v1'&&__activationFaults&&JSON.parse(v).prem?.vault?.purchases?.['vault:1']?.status==='active'){__activationFaults--;throw Error('LG02D net r2 actual activation storage failure');}return original.call(this,k,v);};
        const result=Rewards.lampAction({kind:'activate',purchaseId:'vault:1'});
        return {result,probe:__netProbe(),context:IMI.ops.extensions.vaultContext(),receipt:IMI.ops.extensions.state().prem.vault.purchases['vault:1'],text:document.querySelector('.o-writer-status')?.textContent};
      });
      write('native-held',held);assert.equal(held.result,false);assert.equal(held.probe.sameSlot,true);assert.equal(held.probe.phase,1);assert.equal(held.probe.remaining,750);assert(held.probe.lease);assert.equal(held.context.cap,57600);assert.equal(held.receipt.status,'undoable');
      await page.screenshot({path:path.join(out,run+'-pixel-held.png')});
      const frozen=await page.evaluate(()=>{window.__nativeNow+=12000;dispatchEvent(new Event('resize'));document.dispatchEvent(new Event('visibilitychange'));window.__OPS_EXTENSIONS.find(([id])=>id==='automation')[1].tick({gameSeconds:0,replay:false});return __netProbe();});
      write('native-held-callbacks',frozen);assert.equal(frozen.sameSlot,true);assert.equal(frozen.remaining,750);assert.equal(frozen.phase,1);assert.equal(frozen.lease.id,held.probe.lease.id);
      await new Promise(r=>setTimeout(r,9300));
      const after=await page.evaluate(()=>__netProbe());write('native-held-after-real-expiry',after);assert.equal(after.connected,true);assert.equal(after.sameSlot,true);assert.equal(after.remaining,750);
      await page.click('.o-writer-status button');await page.waitForFunction(()=>!Rewards.held());
      const resumed=await page.evaluate(()=>({probe:__netProbe(),cap:IMI.ops.extensions.vaultContext().cap,duplicate:Rewards.lampAction({kind:'activate',purchaseId:'vault:1'})}));write('native-resumed',resumed);
      assert.equal(resumed.probe.sameSlot,true);assert.equal(resumed.probe.remaining,750);assert.equal(resumed.probe.lease,null);assert.equal(resumed.cap,86400);assert.equal(resumed.duplicate.duplicate,true);
      await page.evaluate(()=>{window.__nativeNow+=749;});await new Promise(r=>setTimeout(r,150));
      const early=await page.evaluate(()=>__netProbe());write('native-before-dwell',early);assert.equal(early.sameSlot,true);assert.equal(early.connected,true);assert.equal(early.remaining,1);assert.equal(early.gold,held.probe.gold);
      await page.evaluate(()=>{window.__nativeNow+=1;});await page.waitForFunction(()=>!__nativeGold.isConnected);
      const caught=await page.evaluate(()=>__netProbe());write('native-caught',caught);assert.equal(caught.sameSlot,false);assert.equal(caught.phase,1);assert.equal(caught.gold,held.probe.gold+1);
      await page.evaluate(()=>{window.__nativeNow+=100;});await new Promise(r=>setTimeout(r,150));
      const once=await page.evaluate(()=>__netProbe());write('native-caught-once',once);assert.equal(once.gold,caught.gold);assert.equal(once.phase,1);
      await cdp.detach();
    }else await page.click('[data-act="vault:keep"]');
''' + s[b:]
a=s.index("    if(run.startsWith('cap')){\n      const capped=")
b=s.index("    await page.goto(origin+'/__lg02d_inert');await page.goto(origin+'/classic.html'",a)
s=s[:a]+'''    const capped=await page.evaluate(()=>IMI.ops.simulateAway(30*3600));write('active-cap',capped);assert.equal(capped.counted,24*3600);
    assert.equal(await page.evaluate(()=>IMI.ops.saveAcknowledged().ok),true);
''' + s[b:]
a=s.index("    if(run.startsWith('cap')){\n      await page.goto(origin+'/__lg02d_inert');const raw=")
b=s.index("    assert.deepEqual(errors,[])",a)
s=s[:a]+s[b:]
s=s.replace("write('funding-fixture',{qualification:", "write('funding-fixture',{clockQualification:'Failure lane freezes performance.now before native spawn, advances 250ms before hold, 12000ms during hold, then 749+1 active ms. Native selection/service/connected gold object are actual source, debugger reads closure identity only. Controlled timing, not natural timing.',qualification:")
Path('tools/long-game/lg02d-net-r2-native.cjs').write_text(s,encoding='utf-8',newline='\n')
s=Path('tools/long-game/lg02d-default.cjs').read_text(encoding='utf-8-sig').replace("evidence/LG-02/free-lamp-r1", "evidence/LG-02/free-lamp-net-r2").replace("fs.readFileSync(out+'/before-default.json')", "fs.readFileSync('docs/plan/long-game/evidence/LG-02/free-lamp-r1/before-default.json')")
Path('tools/long-game/lg02d-net-r2-default.cjs').write_text(s,encoding='utf-8',newline='\n')
