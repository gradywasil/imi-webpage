from pathlib import Path
import json,hashlib
out=Path('docs/plan/long-game/evidence/LG-08/estate-reset-r1');m=json.loads((out/'final-source.json').read_text())
assert all(hashlib.sha256(Path(p).read_bytes()).hexdigest()==v['sha256'] for p,v in m.items())
r=json.loads((out/'stable-results.json').read_text());assert r['status']=='PASS' and not r['errors']
assert all(m[p]['sha256']==h for p,h in r['hashes'].items())
assert json.loads((out/'cold-recovery-final.json').read_text())['status']=='PASS'
assert json.loads((out/'before-default.json').read_text())==json.loads((out/'stable-default.json').read_text())
print('Final source identities match stable native evidence; cold recovery PASS; default control equal; writer released.')
