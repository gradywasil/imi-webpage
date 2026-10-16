from pathlib import Path
import json,hashlib,difflib
out=Path('docs/plan/long-game/evidence/PG-03/implementation-a-r1')
before=json.loads((out/'before-control.json').read_text());after=json.loads((out/'after-control.json').read_text())
assert before['result']==after['result']
assert all(before['identities'][f]==h for f,h in after['identities'].items() if f not in ['ops.js','sw.js'])
for f in ['ops.js','sw.js']:
 (out/(f+'.final.patch')).open('x').write(''.join(difflib.unified_diff((out/('before-'+f)).read_text(encoding='utf-8').splitlines(True),Path(f).read_text(encoding='utf-8').splitlines(True),fromfile='pre-edit/'+f,tofile='candidate/'+f)))
manifest={'branch':'long-game','origin':'http://127.0.0.1:8397','sourceHashes':after['identities'],'defaultControlExactEqual':True,'defaultMeta':after['result']['meta'],'nativeLoadedOpsMatchesDisk':True,'T3ObservedCaches':['imi-v41','imi-v41-runtime'],'T3FetchedOpsSHA256':'68b4a82ab425232dfb58ca8392a2582ee3ffc4b5b1f4ad2f325067d8697698f8','T3FetchedSwSHA256':'51a1ef444a0f9397375cde16cbb8a3d452681b96c27be488b1d0a14344b69cb4','status':'candidate; independent review next','preservedParentDispatch':True}
(out/'manifest.json').open('x').write(json.dumps(manifest,indent=2))
p=Path('docs/plan/long-game/PG-03A-royalty-prototype.md');b=p.read_bytes();old=b'OWNER APPROVED; AUTHORIZED IMPLEMENTATION 2026-10-14 after UI-01 local acceptance. Only exact capped multiplier is approved. Final balance and shared-training prices remain open. Source writer is free.'
new=b'''CANDIDATE IMPLEMENTED 2026-10-14; independent review next, not acceptance. Exact default-off pg03=1 factor is shared by bookRoy and royBase. Current tuned ROY_BASE semantics remain unchanged. sw.js imi-v40 -> imi-v41. Ops writer released.

Handoff: evidence/PG-03/implementation-a-r1/manifest.json, focused-results-final.json, native-results.json and exclusive before/after controls. Product delta is ops.js three lines and sw.js cache version only; before-source snapshots and patches distinguish it from existing dirty work. New tools/long-game/pg03a-{control.cjs,edit.py,check.cjs,native.cjs,handoff.py} are task-owned helpers. Parent dispatch.json untouched.

PASS: changed-JS syntax; fresh pre-edit/final five-minute active collect seed1 default results exactly equal with empty meta; actual lexical functions at Printings0/4/7/12 with TUNE.ROY_BASE=.000023, bookRoy/royBase parity and cap; actual Printing replaces S, factor follows current S and clears shelf/deals. One bounded630-second offline check pays25 at40% efficiency with denomination flooring. Native controlled sale/Reprints/duplicate/acknowledged save/reload in both editions; actual Shop/shelf/Records rates agree at0.0459/s, 360x560 with no page overflow. Native loaded Ops/CSS match disk SHA256. T3 ordinary UI first on fresh8397 incognito; fetched identities match final source, caches only imi-v41 and imi-v41-runtime. Images inspected for representative readouts. No protected origin/tab/save used.

Preserved fixture failures: nonexistent reprint ID refused correctly; arithmetic-only Printing12 lacked reward history and acknowledged save refused; native wallet reload initially reconciled pending sale/deal awards. Final native fixture settles actual awards before comparing saved wallet. No product repairs for these setup errors. Earlier focused offline zero-payout result retained; final bounded check exercises positive payout.

Higher royBase naturally raises royalty-based daily prizes, pickups and repitch costs. These consumers are not retuned. All DEALS prices/gates/multipliers, categories/progression exclusions, sales/Good Stories, Rush and online/offline integration remain outside the exact two-path multiplier delta.

Deferred under skeleton policy: long-horizon/full-hour/profile pacing, physical phones, broad lifecycle/fault/cache-transition/accessibility campaigns. No final balance or shared-training price approval. No children, dependencies, staging, commits, deployment or default activation. Independent review must assess this candidate before acceptance.'''.replace(b'\n',b'\r\n')
assert old in b;p.write_bytes(b.replace(old,new))
