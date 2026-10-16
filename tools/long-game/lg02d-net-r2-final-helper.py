from pathlib import Path
p=Path('tools/long-game/lg02d-net-r2-native.cjs');s=p.read_text();a=s.index('      const cancellations=[];');b=s.index('      const held=await page.evaluate',a);s=s[:a]+s[b:];s=s.replace("write('cancellation-trace',cancellations);",'');s=s.replace('sameSlot:netItems.golden===selected,','sameSlot:netItems.golden===selected,resuming:!!selected.resuming,');p.write_text(s)
