import difflib
import hashlib
import json
from pathlib import Path

out = Path('docs/plan/long-game/evidence/LG-03/implementation-a5-r1')
files = ['automation.js', 'pickups.js', 'ops.js', 'sw.js']
before = {f: (out / ('before-' + f)).read_text(encoding='utf-8') for f in files}
after = {f: Path(f).read_text(encoding='utf-8') for f in files}

def section(text, start, end):
    return text[text.index(start):text.index(end, text.index(start))]

checks = {
    'golden tables and reward routine unchanged': section(before['ops.js'], '  const GOLD_FX', '  let goldEnd') == section(after['ops.js'], '  const GOLD_FX', '  let goldEnd'),
    'Rewards presentation callback byte content unchanged': section(before['ops.js'], '    writer.onStatusPresentation', '\n  function setTab') == section(after['ops.js'], '    writer.onStatusPresentation', '\n  function setTab'),
    'four purchase scheduler body unchanged': section(before['automation.js'], '      const desks = api.automationDesks();\n      if (!Number.isFinite', '\n  document.addEventListener') == section(after['automation.js'], '      const desks = api.automationDesks();\n      if (!Number.isFinite', '\n  new MutationObserver'),
    'ordinary placement unchanged': section(before['pickups.js'], '  function position()', '  function spawn()') == section(after['pickups.js'], '  function position()', '  function spawn()'),
    'ordinary captured payout line preserved': 'const r = el.getBoundingClientRect(); clear(); reward.collect(value, [r.left + r.width / 2, r.top + r.height / 2]);' in after['pickups.js'],
    'golden end-before-original-effect line preserved': 'end(); if (!introActive()) goldEffect(roulette(rotten ? ROT_FX : GOLD_FX), x, y);' in after['ops.js'],
    'full reset remains fresh state and extension reset': "S = fresh(); extensionEvent('init', 'full-reset'); extensionEvent('reset', { kind: 'full-reset' });" in after['ops.js'],
    'cache only change': before['sw.js'].replace("'imi-v43'", "'imi-v44'") == after['sw.js'],
}
baseline = json.loads((out / 'default-before.json').read_text())['identities']
readonly = {f: hashlib.sha256(Path(f).read_bytes()).hexdigest() == digest for f, digest in baseline.items() if f not in files}
checks['read-only source identities unchanged'] = all(readonly.values())
result = {'checks': checks, 'readonly': readonly, 'identities': {f: hashlib.sha256(Path(f).read_bytes()).hexdigest() for f in baseline}, 'fullResetQualification': 'source only; no destructive reset executed'}
with (out / 'source-boundary-final.json').open('x') as f:
    json.dump(result, f, indent=2)
with (out / 'task-delta.patch').open('x', encoding='utf-8') as f:
    for name in files:
        f.writelines(difflib.unified_diff(before[name].splitlines(True), after[name].splitlines(True), 'before/' + name, 'candidate/' + name))
assert all(checks.values()), checks
print('Source boundaries and read-only identities passed')
