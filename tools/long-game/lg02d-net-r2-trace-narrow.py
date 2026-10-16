from pathlib import Path
p=Path('tools/long-game/lg02d-net-r2-native.cjs');s=p.read_text()
a="      for(const [i,line]of nativeSource.split('\\n').entries())if(line.includes('netItems[kind] = null'))await cdp.send('Debugger.setBreakpointByUrl',{url:origin+'/automation.js',lineNumber:i,condition:'!!window.__netProbe && !!netItems.golden && !netLease'});"
b="""      for(const [i,line]of nativeSource.split('\\n').entries()){
        let condition;
        if(line.includes('if (!netLease || force === true'))condition='!!netItems.golden && (!netLease || force === true || !netItems.golden.item.el.isConnected)';
        if(line.includes('if (slot && (!slot.item.valid()'))condition='kind === "golden" && slot && (!slot.item.valid() || !itemLiveDOM(slot.item) || slot.admitted && !itemVisible(slot.item))';
        if(line.includes('if (!slot.item.valid() || !itemLiveDOM'))condition='kind === "golden" && (!slot.item.valid() || !itemLiveDOM(slot.item))';
        if(line.includes('if (!itemVisible(slot.item))'))condition='kind === "golden" && slot.admitted && !itemVisible(slot.item)';
        if(condition)await cdp.send('Debugger.setBreakpointByUrl',{url:origin+'/automation.js',lineNumber:i,condition:'!!window.__netProbe && ('+condition+')'});
      }"""
assert a in s;s=s.replace(a,b);p.write_text(s)
