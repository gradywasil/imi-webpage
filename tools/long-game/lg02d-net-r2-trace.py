from pathlib import Path
p=Path('tools/long-game/lg02d-net-r2-native.cjs')
s=p.read_text()
a="      const held=await page.evaluate(()=>{"
b="""      const cancellations=[];
      cdp.on('Debugger.paused',async event=>{try{const r=await cdp.send('Debugger.evaluateOnCallFrame',{callFrameId:event.callFrames[0].callFrameId,returnByValue:true,expression:'({probe:window.__netProbe?.(),valid:netItems.golden?.item.valid(),live:netItems.golden&&itemLiveDOM(netItems.golden.item),visible:netItems.golden&&itemVisible(netItems.golden.item),hidden:document.hidden,disposition:Rewards.localDisposition(),running:IMI.ops.progression.running(),lease:!!netLease})'});cancellations.push({frames:event.callFrames.map(f=>({name:f.functionName,line:f.location.lineNumber})),state:r.result.value});}finally{await cdp.send('Debugger.resume');}});
      for(const [i,line]of nativeSource.split('\\n').entries())if(line.includes('netItems[kind] = null'))await cdp.send('Debugger.setBreakpointByUrl',{url:origin+'/automation.js',lineNumber:i,condition:'!!window.__netProbe && !!netItems.golden && !netLease'});
      const held=await page.evaluate(()=>{"
"""
assert s.count(a)==1
s=s.replace(a,b)
s=s.replace("write('native-resumed',resumed);","write('native-resumed',resumed);write('cancellation-trace',cancellations);")
p.write_text(s)
