from pathlib import Path
p=Path('layers.js');s=p.read_text();a=s.index('    if (next.meta.productionGoal)',s.index('  function projectRoom'));b=s.index('    return next;\n  }',a);cleanup=s[a:b];s=s[:a]+'    return next;\n  }\n  function finishRoom(s, next) {\n'+cleanup+s[b:];s=s.replace('    if (next.meta.folio) next.meta.folio = {...next.meta.folio, ...epochFields(next), imprint:l.count + 1};\n    return next;', '    finishRoom(s,next);\n    if (next.meta.folio) next.meta.folio = {...next.meta.folio, ...epochFields(next), imprint:l.count + 1};\n    return next;');s=s.replace('quote, projectRoom, project,','quote, projectRoom, finishRoom, project,');p.write_text(s)
p=Path('estate.js');s=p.read_text();s=s.replace('    const gain = Math.floor', '''    for (const id of ['garden','pitch','media','muse']) {
      const cfg = s.meta.automation?.[id], m = cfg?.manual;
      if (cfg !== undefined && (!object(cfg) || cfg.version !== 1 || m !== undefined && (!object(m) || m.complete !== undefined && typeof m.complete !== 'boolean')) ||
          id === 'muse' && m?.ids !== undefined && (!Array.isArray(m.ids) || m.ids.some(id => typeof id !== 'string'))) throw Error('Unsupported helper proof. Save preserved.');
    }
    const gain = Math.floor''');s=s.replace('    if (next.meta.folio) next.meta.folio = {...next.meta.folio,...Layers.epochFields(next)};', '''    Layers.finishRoom(s,next);
    // Estate also clears incomplete proof when the optional helper UI is flag-off.
    for (const id of ['garden','pitch','muse']) {
      const m = next.meta.automation?.[id]?.manual;
      if (m && !m.complete) {
        if (id === 'muse') Object.assign(m,{ids:[],...Layers.epochFields(next),imprint:Layers.identity(next),printing:0});
        else if (m.pending != null) m.pending = null;
      }
    }''');p.write_text(s)
# Keep original bytes on all unchanged lines, including mixed shell endings.
import difflib
base=Path('docs/plan/long-game/evidence/LG-08/estate-reset-r1/before')
for before in base.rglob('*'):
 if not before.is_file(): continue
 target=Path(before.relative_to(base));old=before.read_bytes().splitlines(keepends=True);new=target.read_bytes().splitlines(keepends=True)
 a=[x.rstrip(b'\r\n') for x in old];b=[x.rstrip(b'\r\n') for x in new];ending=b'\r\n' if sum(x.endswith(b'\r\n') for x in old)>len(old)/2 else b'\n';result=[]
 for tag,i,j,k,l in difflib.SequenceMatcher(None,a,b,autojunk=False).get_opcodes():
  result.extend(old[i:j] if tag=='equal' else [x+ending for x in b[k:l]] if tag in ('replace','insert') else [])
 target.write_bytes(b''.join(result))
