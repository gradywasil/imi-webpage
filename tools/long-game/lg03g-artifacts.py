from pathlib import Path
import difflib,json,hashlib
out=Path('docs/plan/long-game/evidence/LG-03/implementation-challenges-r1')
parts=[]
for f in ['ops.js','automation.js','rewards.js','sw.js']:
    parts.extend(difflib.unified_diff((out/'before'/f).read_text(encoding='utf-8').splitlines(True),Path(f).read_text(encoding='utf-8').splitlines(True),fromfile='lease-start/'+f,tofile='candidate/'+f))
(out/'task-only.patch').write_text(''.join(parts),encoding='utf-8')
p=Path('docs/plan/long-game/LG-03G-challenges.md');b=p.read_bytes();s=b.decode();mark='## Status and handoff';s=s[:s.index(mark)]+'''## Status and handoff

CANDIDATE IMPLEMENTED 2026-10-14. Awaiting one independent review; not whole LG03 acceptance. Existing lg03=1 plus lg01a=1 reward-enabled opt-in only. No stage/commit/deploy/default activation or LG04 work. Sole product-writer lease released after this handoff.

Handoff: evidence/LG-03/implementation-challenges-r1/handoff.md. Includes lease-start bytes, final hashes, task-only.patch,70 compact functional checks plus reload, no-flags retention and controlled pitched-sale checks, unchanged historical award/reward/purchase/training/PG seams, before/final five-minute report/meta/errors equality, T3 native confirmation/reload and both-style360x560 images. Controlled sold fixtures are not natural-completion proof. First failures retained separately. Confirmation overflow fixed with incumbent classes only; Classic incumbent rounded selection wrapper still clips first-row label ends at360px, recorded for independent review disposition without another UI fix cycle. Full reset source-only; physical device/lifecycle/cache transition/full-hour/profile pacing remain unverified.

Mastery/medals explicitly deferred for later approved work before any gold-dependent automation, including A11. No historical medals fabricated. LG13 pacing and whole LG03 acceptance remain separate. Protected owner ports/tabs/saves untouched; task-owned server/tab cleanup recorded in evidence cleanup.json.
''';p.write_bytes(s.replace('\n','\r\n').encode() if b'\r\n' not in b else s.replace('\r\n','\n').replace('\n','\r\n').encode())
