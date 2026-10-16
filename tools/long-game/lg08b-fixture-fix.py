from pathlib import Path
p=Path('tools/long-game/lg08b-check.cjs');s=p.read_text();s=s.replace('window.__estateBefore=JSON.parse(before);','window.__estateBefore=JSON.parse(before);window.__markerBefore=IMI.bananas.acknowledgement();');s=s.replace('same(IMI.bananas.acknowledgement(),b.meta.folio.cashHead)','same(IMI.bananas.acknowledgement(),window.__markerBefore)');p.write_text(s)
