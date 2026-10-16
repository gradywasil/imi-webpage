import hashlib
import json
import pathlib
import subprocess
import tempfile

root = pathlib.Path.cwd()
evidence = root / 'docs/plan/long-game/evidence/LG-09/seasons-r1'
out = root / 'docs/plan/long-game/evidence/LG-09/seasons-review-r1/patch-check.json'
manifest = json.loads((evidence / 'final-source.json').read_text(encoding='utf-8'))
with tempfile.TemporaryDirectory(prefix='lg09k-review-r1-') as directory:
    target = pathlib.Path(directory)
    for name in manifest:
        before = evidence / 'dirty-before' / name
        if before.exists():
            destination = target / name
            destination.parent.mkdir(parents=True, exist_ok=True)
            destination.write_bytes(before.read_bytes())
    command = ['git', '-c', 'core.autocrlf=false', 'apply', '--unsafe-paths']
    check = subprocess.run(command + ['--check', str(evidence / 'task.patch')], cwd=target, capture_output=True, text=True)
    if check.returncode:
        raise RuntimeError(check.stderr)
    applied = subprocess.run(command + [str(evidence / 'task.patch')], cwd=target, capture_output=True, text=True)
    if applied.returncode:
        raise RuntimeError(applied.stderr)
    matches = {name: hashlib.sha256((target / name).read_bytes()).hexdigest() == manifest[name]['sha256'] == hashlib.sha256((root / name).read_bytes()).hexdigest() for name in manifest}
    out.write_text(json.dumps({'checkExit': check.returncode, 'applyExit': applied.returncode, 'exactRawBytes': matches, 'temporaryCopyCleanedOnExit': True}, indent=2), encoding='utf-8')
    if not all(matches.values()):
        raise RuntimeError('Reconstructed bytes differ from final source')
