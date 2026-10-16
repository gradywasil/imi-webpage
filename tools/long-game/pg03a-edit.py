from pathlib import Path
import json
p=Path('ops.js'); b=p.read_bytes(); out=Path('docs/plan/long-game/evidence/PG-03/implementation-a-r1')
(out/'before-ops.js').open('xb').write(b)
(out/'before-sw.js').open('xb').write(Path('sw.js').read_bytes())
b=b.replace(b'  const bookRoy =',b"  const royaltyScale = () => new URLSearchParams(location.search).get('pg03') === '1' ? 2 * (1 + .35 * Math.min(S.printing, 7)) : 1;\r\n  const bookRoy =",1)
b=b.replace(b'* ROY_BASE * dealMult()',b'* ROY_BASE * royaltyScale() * dealMult()')
p.write_bytes(b)
p=Path('sw.js'); p.write_bytes(p.read_bytes().replace(b"'imi-v40'",b"'imi-v41'",1))
