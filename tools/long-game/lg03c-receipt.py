import ast
import hashlib
import json
import subprocess
from pathlib import Path

out = Path('docs/plan/long-game/evidence/LG-03/implementation-a2-r1')
tree = ast.parse(Path('tools/long-game/lg03c-edit.py').read_text())
block = next(n.value.func.value.func.value.value for n in tree.body
             if isinstance(n, ast.Assign) and any(isinstance(t, ast.Name) and t.id == 'block' for t in n.targets))
ops = Path('ops.js').read_bytes()
block = block.replace('\n', '\r\n').encode()
assert ops.count(block) == 1
assert ops.replace(block, b'') == (out / 'before/ops.js').read_bytes()
sw = Path('sw.js').read_bytes()
assert sw.replace(b"const VERSION = 'imi-v38';", b"const VERSION = 'imi-v37';") == (out / 'before/sw.js').read_bytes()
index = subprocess.check_output(['git', 'ls-files', '-s']).decode()
assert index.splitlines() == (out / 'before/index.txt').read_text(encoding='utf-8-sig').splitlines()
files = ['automation.js', 'automation.css', 'ops.js', 'sw.js', 'tools/long-game/lg03c-edit.py', 'tools/long-game/lg03c-focused.mjs', 'tools/long-game/lg03c-screens.mjs', 'tools/long-game/lg03c-receipt.py']
(out / 'source-after.json').write_text(json.dumps({p:hashlib.sha256(Path(p).read_bytes()).hexdigest() for p in files}, indent=2))
(out / 'bounded-ops-sw-proof.json').write_text(json.dumps({'ops':'PASS: remove only the 17-line named coach API block and exact before bytes return', 'sw':'PASS: reverse only v37 to v38 bump and exact before bytes return', 'index':'PASS: unchanged from before'}, indent=2))
(out / 'status-after.txt').write_bytes(subprocess.check_output(['git', 'status', '--porcelain=v1']))
print('PASS: bounded Ops/SW changes, unchanged index, final source hashes/status recorded')
