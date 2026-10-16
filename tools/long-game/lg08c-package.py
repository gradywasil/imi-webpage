from pathlib import Path
import subprocess,json,hashlib,shutil,os
out=Path('docs/plan/long-game/evidence/LG-08/archive-r1')
before=json.loads((out/'before-source.json').read_text())
files=[f for f in before if Path(f).read_bytes()!=(out/'before'/f).read_bytes()]+['archive.js']
manifest={f:{'bytes':Path(f).stat().st_size,'sha256':hashlib.sha256(Path(f).read_bytes()).hexdigest()} for f in files}
(out/'final-source.json').write_text(json.dumps(manifest,indent=2)+'\n')
syntax=[];patch=b''
for f in files:
 dest=out/'final-source'/f;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(f,dest)
 if f.endswith('.js'):
  r=subprocess.run(['node','--check',f],capture_output=True);syntax.append({'file':f,'exit':r.returncode,'stderr':r.stderr.decode()});assert r.returncode==0
 old=out/'before'/f
 args=['git','-c','core.autocrlf=false','diff','--no-index','--binary','--',old.as_posix() if old.exists() else 'NUL',f]
 r=subprocess.run(args,capture_output=True);assert r.returncode in [0,1],r.stderr
 part=r.stdout
 if old.exists():
  oldname=old.as_posix().encode();part=part.replace(b'a/'+oldname,b'a/'+f.encode()).replace(b'b/'+oldname,b'b/'+f.encode())
 else:
  part=part.replace(b'a/NUL',b'a/'+f.encode())
 patch+=part
(out/'task-only.patch').write_bytes(patch)
(out/'syntax.json').write_text(json.dumps(syntax,indent=2)+'\n')
# Apply the task patch to exact dirty-before bytes in a task-owned evidence directory.
check=out/'patch-check-finalbytes';check.mkdir()
for f in files:
 old=out/'before'/f
 if old.exists():
  dest=check/f;dest.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(old,dest)
r=subprocess.run(['git','-c','core.autocrlf=false','apply','--unsafe-paths',str((out/'task-only.patch').resolve())],cwd=check,capture_output=True,env={**os.environ,'GIT_CEILING_DIRECTORIES':str(check.parent.resolve())})
verification={'applyExit':r.returncode,'stderr':r.stderr.decode(),'files':{f:hashlib.sha256((check/f).read_bytes()).hexdigest()==manifest[f]['sha256'] for f in files if (check/f).exists()}}
(out/'patch-verification.json').write_text(json.dumps(verification,indent=2)+'\n')
assert r.returncode==0,r.stderr
assert len(verification['files'])==len(files) and all(verification['files'].values())
print(json.dumps({'files':files,'syntax':len(syntax),'patchExact':True},indent=2))
