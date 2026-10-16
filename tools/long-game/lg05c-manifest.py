from pathlib import Path
import hashlib,json,difflib
out=Path('docs/plan/long-game/evidence/LG-05/implementation-shelf-r1')
owned=['layers.js','layers.css','folio.js','sw.js']
readonly=['ops.js','rewards.js','core.js','economy.js','vault-save-gate.js']
manifest={};patch=[]
for name in owned+readonly:
    before=(out/'before'/name).read_bytes();after=Path(name).read_bytes()
    a=before.decode().splitlines(True);b=after.decode().splitlines(True)
    changes=list(difflib.unified_diff(a,b,fromfile='before/'+name,tofile=name))
    manifest[name]={'before':hashlib.sha256(before).hexdigest(),'final':hashlib.sha256(after).hexdigest(),'changed':before!=after,'added':sum(x.startswith('+') and not x.startswith('+++') for x in changes),'removed':sum(x.startswith('-') and not x.startswith('---') for x in changes)}
    if name in owned:patch.extend(changes)
    else:assert before==after,name+' outside lease changed'
(out/'final-hashes.json').write_text(json.dumps(manifest,indent=2))
(out/'task-only.patch').write_text(''.join(patch))
(out/'first-failures.json').write_text(json.dumps({'editHelper':'Initial PowerShell ANSI encoding produced Python Non-UTF-8 byte 0xb7 before any product edit. Corrected helper encoding. A later quoted shell helper edit failed PowerShell parsing before execution.','nativeFixture':'r1/r2 omitted required locked layer:imprint:first record; r2-ready-failure.json preserves real guard message. r3 assigned absent claims map. Corrected using accepted B record in explicit seeded fixture.','helperReload':'r4 lost runtime-only layer helper across reload. Corrected helper scope.','combinedUI':'r5/r6/r7/r8/final functional assertions pass but combined UI click times out. Preserved failed results and r6/r7/r8/final failure screenshots. Cause not established. Focused native UI actual pointer checks pass independently in debug1/current/confirmation; T3 real button also passes. No combined full-pass claim.','deliberateWriteFailure':'final-first-refusal.json retains deliberate purchase refusal. Existing real Retry succeeds once without double debit.'},indent=2))
print(json.dumps(manifest,indent=2))
