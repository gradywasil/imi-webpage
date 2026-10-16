from pathlib import Path
import json
out=Path('docs/plan/long-game/evidence/LG-08/estate-reset-r1')
for p in (out/'before').rglob('*'):
 if p.is_file():
  b=p.read_bytes(); f=Path(p.relative_to(out/'before')); now=f.read_bytes(); print(str(f),b.count(b'\r\n'),b.count(b'\n'),now.count(b'\r\n'),now.count(b'\n'))
