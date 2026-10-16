from pathlib import Path
import json,hashlib,difflib,subprocess,tempfile
out=Path('docs/plan/long-game/evidence/LG-09/works-demo-r1');before=json.loads((out/'dirty-before.json').read_text());changed=[f for f in before if Path(f).read_bytes()!=(out/'before'/f).read_bytes()];products=[f for f in changed if not f.startswith('docs/')]+['works.js'];helpers=[p.as_posix() for p in Path('tools/long-game').glob('lg09a-*')];files=changed+['works.js']+helpers
sha=lambda b:hashlib.sha256(b).hexdigest()
source={f:{'bytes':len(Path(f).read_bytes()),'sha256':sha(Path(f).read_bytes())}for f in products};(out/'final-source.json').write_text(json.dumps(source,indent=2))
readonly={f:sha(Path(f).read_bytes())==before[f]['sha256'] for f in before if f not in changed};assert all(readonly.values());(out/'readonly-preservation.json').write_text(json.dumps(readonly,indent=2))
patch=[]
for f in files:
 old=(out/'before'/f).read_bytes().decode('utf-8') if f in before else ''
 new=Path(f).read_bytes().decode('utf-8');patch.extend(difflib.unified_diff(old.splitlines(keepends=True),new.splitlines(keepends=True),fromfile='a/'+f if f in before else '/dev/null',tofile='b/'+f))
(out/'task.patch').write_bytes(''.join(patch).encode('utf-8'))
with tempfile.TemporaryDirectory(prefix='lg09a-patch-')as tmp:
 for f in changed:
  p=Path(tmp)/f;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes((out/'before'/f).read_bytes())
 cmd=['git','-c','core.autocrlf=false','apply','--no-index','--whitespace=nowarn',str((out/'task.patch').resolve())]
 r=subprocess.run(cmd,cwd=tmp,capture_output=True,text=True);checks={'applyExit':r.returncode,'stdout':r.stdout,'stderr':r.stderr,'files':{f:Path(tmp,f).exists() and Path(tmp,f).read_bytes()==Path(f).read_bytes()for f in files}};(out/'taskpatch-check.json').write_text(json.dumps(checks,indent=2));assert r.returncode==0,checks;assert all(checks['files'].values()),checks
(out/'taskpatch-check.json').write_text(json.dumps(checks,indent=2))
(out/'final-status.txt').write_bytes(subprocess.check_output(['git','status','--short']))
(out/'image-inspection.json').write_text(json.dumps({'openedBy':'implementation agent','geometry':'360x560','images':[f'verified-{ed}-{state}-360.png'for ed in ['pixel','classic']for state in ['work','complete','loss']],'findings':'Actual active work prefix/source/missing visible; completion says no permanent reward with Continue/repeat; loss modal fully readable and actions fit. Other actions internally scroll. No page scroll/overflow. Earlier tour-obscured image retained as historical.'},indent=2))
print(f'{len(products)} product sources packaged; {len(files)}-file task patch reconstructs exact final bytes; {len(readonly)} read-only inputs unchanged')
