from pathlib import Path
import json,hashlib
out=Path('docs/plan/long-game/evidence/UI-01/implementation-r2')
before=json.loads((out/'before-short5min.json').read_text(encoding='utf-8-sig'))
after=json.loads((out/'final-after-short5min.json').read_text(encoding='utf-8-sig'))
assert before==after
identities={f:hashlib.sha256(Path(f).read_bytes()).hexdigest() for f in ['ops.js','ops.css','sw.js','production-goal.js','production-goal.css','index.html','classic.html','tools/balance.html']}
accepted=json.loads(Path('docs/plan/long-game/evidence/PG-01/completion-r2/source-identities.json').read_text(encoding='utf-8-sig'))
assert all(identities[f]==accepted[f] for f in ['production-goal.js','production-goal.css','index.html','classic.html','tools/balance.html'])
(out/'verification.json').write_text(json.dumps({'defaultFiveMinuteControlExactParsedEquality':True,'errors':before['errors'],'sourceIdentities':identities,'acceptedPGReadOnlyFilesMatch':True,'syntax':{'ops.js':0,'sw.js':0},'detector':{'findings':[],'runs':1,'limitation':'Run before final grid/filter/next-high visibility selectors; no repeat scan or polishing loop.'}},indent=2),encoding='utf-8')
for f in ['ops.js','ops.css','sw.js']:
 import difflib
 a=(out/('before-'+f)).read_text(encoding='utf-8').splitlines(keepends=True);b=Path(f).read_text(encoding='utf-8').splitlines(keepends=True)
 (out/('ui01-'+f+'.patch')).write_text(''.join(difflib.unified_diff(a,b,fromfile='before/'+f,tofile=f)),encoding='utf-8')
