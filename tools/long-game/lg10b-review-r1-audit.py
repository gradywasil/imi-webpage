import hashlib, json, pathlib, shutil, subprocess, tempfile

root = pathlib.Path.cwd()
base = root / 'docs/plan/long-game/evidence/LG-10/awards-r1'
out = root / 'docs/plan/long-game/evidence/LG-10/awards-review-r1'
expected = json.loads((base / 'final-source.json').read_text())
actual = {name: hashlib.sha256((root / name).read_bytes()).hexdigest() for name in expected}
assert all(actual[name] == data['sha256'] for name, data in expected.items())
with tempfile.TemporaryDirectory(prefix='lg10b-review-r1-patch-') as temp:
    temp = pathlib.Path(temp)
    for name in expected:
        source = base / 'dirty-before' / name
        if source.exists():
            target = temp / name
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(source, target)
    patch = base / 'task.patch'
    check = subprocess.run(['git','-c','core.autocrlf=false','apply','--check',str(patch)],cwd=temp,capture_output=True,text=True)
    assert check.returncode == 0, check.stderr
    apply = subprocess.run(['git','-c','core.autocrlf=false','apply',str(patch)],cwd=temp,capture_output=True,text=True)
    assert apply.returncode == 0, apply.stderr
    reconstructed = {name: (temp / name).read_bytes() == (root / name).read_bytes() for name in expected}
    assert all(reconstructed.values())
protected = json.loads((base / 'dirty-before-source.json').read_text())
protected_equal = {name: hashlib.sha256((root / name).read_bytes()).hexdigest() == data['sha256'] for name, data in protected.items() if name not in expected}
assert all(protected_equal.values())
def block(file, start, end):
    text = file.read_text(encoding='utf-8')
    return text[text.index(start):text.index(end,text.index(start))]
original_awards = block(root / 'ops.js','  const AWARDS = [','  ];\n',)
before_awards = block(base / 'dirty-before/ops.js','  const AWARDS = [','  ];\n',)
assert original_awards == before_awards
original_assignments = block(root / 'rewards.js','  const assignments = {','  };\n')
before_assignments = block(base / 'dirty-before/rewards.js','  const assignments = {','  };\n')
assert original_assignments == before_assignments
report={'hashes':actual,'patchExact':reconstructed,'protectedCount':len(protected_equal),'protectedEqual':all(protected_equal.values()),'originalAwardsEqual':True,'originalAssignmentsEqual':True}
(out / 'source-audit.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report,indent=2))
