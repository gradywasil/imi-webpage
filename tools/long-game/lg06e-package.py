from pathlib import Path
import difflib, hashlib, json, subprocess, tempfile, shutil

root = Path.cwd()
out = root / 'docs/plan/long-game/evidence/LG-06/implementation-challenges-r1'
sources = ['ops.js', 'automation.js', 'rewards.js', 'sw.js']
identity = lambda p: {'bytes': p.stat().st_size, 'sha256': hashlib.sha256(p.read_bytes()).hexdigest()}
source_manifest = {f: {'before': identity(out/'before'/f), 'final': identity(root/f)} for f in sources}
(out/'handoff-source.json').write_text(json.dumps(source_manifest, indent=2), encoding='utf-8')
patch = ''.join(''.join(difflib.unified_diff((out/'before'/f).read_bytes().decode().splitlines(True),
                (root/f).read_bytes().decode().splitlines(True), fromfile='a/'+f, tofile='b/'+f)) for f in sources)
(out/'task-only.patch').write_bytes(patch.encode())
work = Path(tempfile.mkdtemp(prefix='lg06e-patch-check-'))
try:
    for f in sources:
        shutil.copyfile(out/'before'/f, work/f)
    applied = subprocess.run(['git', '-c', 'core.autocrlf=false', 'apply', '--unsafe-paths', str(out/'task-only.patch')], cwd=work, capture_output=True, text=True)
    if applied.returncode:
        raise RuntimeError(applied.stderr)
    reconstruction = {f: (work/f).read_bytes() == (root/f).read_bytes() for f in sources}
    assert all(reconstruction.values())
finally:
    shutil.rmtree(work)
assert (out/'before/ops.css').read_bytes() == (root/'ops.css').read_bytes()
assert (out/'before/automation.css').read_bytes() == (root/'automation.css').read_bytes()
(out/'packaging-proof.json').write_text(json.dumps({'patchBaseline': 'preserved dirty bytes, not HEAD',
    'gitApplyExitCode': applied.returncode, 'exactBytesReconstructed': reconstruction,
    'optionalCssUnchanged': True, 'ownedTemporaryPatchDirectoryRemoved': not work.exists()}, indent=2), encoding='utf-8')
task = root/'docs/plan/long-game/LG-06E-imprint-challenges.md'
shutil.copyfile(task, out/'before/LG-06E-imprint-challenges.md')
raw = task.read_bytes()
newline = '\r\n' if b'\r\n' in raw else '\n'
status = '''
CANDIDATE IMPLEMENTED 2026-10-15. Sole-writer lease RELEASED. Four product files changed: ops.js, automation.js, rewards.js and sw.js, cache v58. Optional CSS unchanged. Candidate handoff: evidence/LG-06/implementation-challenges-r1/Handoff.md. Authoritative final-manifest.json, handoff-source.json, task-only.patch and packaging-proof.json use preserved dirty-before bytes. Final syntax and native 23-group controlled entry/restriction/clear/reload/replay/failure proof pass; both final 360x560 images opened; five-minute stable default report/meta/errors match before bytes. First helper encoding and three fixture errors remain recorded separately. No true unowned prerequisite, children, dependencies, commit/deploy/default activation, mastery, purchased tiers or next-feature work. Task resources closed. Stop for ONE different-model independent review. Candidate only, not acceptance or pacing evidence.
'''
task.write_bytes(raw + status.replace('\n', newline).encode())
paths = [root/f for f in sources] + [task] + sorted((root/'tools/long-game').glob('lg06e-*')) + sorted(p for p in out.rglob('*') if p.is_file() and p.name not in ['parent-dispatch.json', 'final-manifest.json'])
manifest = {'status': 'candidate; sole-writer lease released; independent review pending', 'branch': 'long-game',
    'sourceManifest': 'handoff-source.json', 'patch': 'task-only.patch', 'patchScope': 'four product files only; helper and evidence files listed individually here',
    'patchBaseline': 'preserved dirty checkout bytes', 'files': {str(p.relative_to(root)).replace('\\','/'): identity(p) for p in paths}}
(out/'final-manifest.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')
print(json.dumps({'sourceIdentities': source_manifest, 'manifestFiles': len(manifest['files']), 'patchReconstruction': reconstruction}))
