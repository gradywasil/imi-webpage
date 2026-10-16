from pathlib import Path
import subprocess,tempfile,shutil,hashlib,json
root=Path.cwd();out=root/'docs/plan/long-game/evidence/LG-08/estate-reset-r1';base=out/'before'
files=['estate.js','layers.js','ops.js','rewards.js','core.js','vault-save-gate.js','index.html','classic.html','tools/balance.html','sw.js']
manifest={};patch=b''
for name in files:
 before=base/name;after=root/name
 args=['git','-c','core.autocrlf=false','diff','--no-index','--binary','--no-ext-diff','--no-textconv','--',str(before) if before.exists() else 'NUL',str(after)]
 r=subprocess.run(args,capture_output=True);assert r.returncode in (0,1),r.stderr
 data=r.stdout
 lines=data.splitlines(keepends=True)
 for i,line in enumerate(lines):
  if line.startswith(b'diff --git '):lines[i]=f'diff --git a/{name} b/{name}\n'.encode()
  elif line.startswith(b'--- '):lines[i]=(f'--- a/{name}\n' if before.exists() else '--- /dev/null\n').encode()
  elif line.startswith(b'+++ '):lines[i]=f'+++ b/{name}\n'.encode()
 patch+=b''.join(lines)
 b=after.read_bytes();manifest[name]={'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest(),'before':{'bytes':before.stat().st_size,'sha256':hashlib.sha256(before.read_bytes()).hexdigest()} if before.exists() else None}
 dest=out/'final-source'/name;dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(b)
(out/'task-only.patch').write_bytes(patch)
with tempfile.TemporaryDirectory(prefix='lg08b-patch-') as d:
 temp=Path(d)
 for name in files:
  if (base/name).exists():
   dst=temp/name;dst.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(base/name,dst)
 r=subprocess.run(['git','-c','core.autocrlf=false','apply','--no-index',str(out/'task-only.patch')],cwd=temp,capture_output=True);assert r.returncode==0,r.stderr.decode()
 checks={name:(temp/name).read_bytes()==(root/name).read_bytes() for name in files};assert all(checks.values()),checks
(out/'patch-verification.json').write_text(json.dumps({'exactRawBytesReconstructed':checks,'temporaryVerificationDirectoryRemoved':True},indent=2))
(out/'final-source.json').write_text(json.dumps(manifest,indent=2))
checks={}
for name in files:
 if name.endswith('.js'):
  r=subprocess.run(['node','--check',name],capture_output=True);checks[name]={'exitCode':r.returncode,'stderr':r.stderr.decode()};assert r.returncode==0
(out/'syntax.json').write_text(json.dumps(checks,indent=2))
print('Exact dirty-before patch reconstruction and seven JS syntax checks PASS')
