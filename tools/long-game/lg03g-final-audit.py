from pathlib import Path
import json,hashlib
out=Path('docs/plan/long-game/evidence/LG-03/implementation-challenges-r1')
rows=json.loads((out/'before-identities.json').read_text(encoding='utf-8-sig'))
product={'ops.js','automation.js','rewards.js','sw.js'}
final=[]
for r in rows:
    p=Path(r['path']);h=hashlib.sha256(p.read_bytes()).hexdigest()
    assert p.name in product or h==r['sha256'],p
    final.append({'path':r['path'],'sha256':h,'bytes':p.stat().st_size,'changedInLease':h!=r['sha256']})
assert {r['path'] for r in final if r['changedInLease']}==product
(out/'final-identities.json').write_text(json.dumps(final,indent=2),encoding='utf-8')
patch=(out/'task-only.patch').read_text(encoding='utf-8').splitlines()
print('Product delta:',sum(x.startswith('+') and not x.startswith('+++') for x in patch),'added lines;',sum(x.startswith('-') and not x.startswith('---') for x in patch),'removed lines')
print('Final identities match verified source; all 12 captured unowned files unchanged.')
print('New lease helpers:',', '.join(p.name for p in sorted(Path('tools/long-game').glob('lg03g-*'))))
