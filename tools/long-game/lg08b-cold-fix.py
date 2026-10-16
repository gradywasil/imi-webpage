from pathlib import Path
p=Path('estate.js');s=p.read_text();s=s.replace('    const e = current(s), p = e.pending;', '    const e = current(s), p = e.pending, owner = window.IMI.ops.extensions;');s=s.replace('!api.estateCrewValid(p.crew,source)', '!owner.estateCrewValid(p.crew,source)').replace('const expected = api.estateRoom(source);', 'const expected = owner.estateRoom(source);');p.write_text(s)
p=Path('tools/long-game/lg08b-cold.cjs');s=p.read_text().replace('/cold-recovery-diagnostic.json','/cold-recovery-final.json');p.write_text(s)
