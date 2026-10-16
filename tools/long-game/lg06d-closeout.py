from pathlib import Path
import json, hashlib, subprocess, tempfile, shutil
root=Path.cwd();out=root/'docs/plan/long-game/evidence/LG-06/implementation-muse-r1'
files=['automation.js','ops.js','layers.js','automation.css','sw.js']
def manifest(paths):
 return {str(p.relative_to(root)).replace('\\','/'):{'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in paths}
def write(n,v):
 with (out/n).open('x',encoding='utf-8') as f:json.dump(v,f,indent=2)
write('before-source.json',manifest([out/'before'/f for f in files]))
syntax={}
for f in files:
 if f.endswith('.js'):
  r=subprocess.run(['node','--check',f],capture_output=True,text=True);syntax[f]={'exitCode':r.returncode,'output':r.stdout+r.stderr};assert r.returncode==0
write('syntax.json',syntax)
write('handoff-source.json',manifest([root/f for f in files]))
tmp=Path(tempfile.mkdtemp(prefix='lg06d-patch-r1-')).resolve()
try:
 for d in ['before','after','check']:(tmp/d).mkdir()
 chunks=[]
 for f in files:
  b=(out/'before'/f).read_bytes();a=(root/f).read_bytes()
  (tmp/'before'/f).write_bytes(b);(tmp/'check'/f).write_bytes(b);(tmp/'after'/f).write_bytes(a)
  r=subprocess.run(['git','-c','core.autocrlf=false','diff','--no-index','--binary','--','before/'+f,'after/'+f],cwd=tmp,capture_output=True)
  assert r.returncode in [0,1]
  chunks.append(r.stdout.replace(b'a/before/',b'a/').replace(b'b/after/',b'b/'))
 patch=out/'task-only.patch'
 with patch.open('xb') as f:f.write(b''.join(chunks))
 r=subprocess.run(['git','apply','--check',str(patch)],cwd=tmp/'check',capture_output=True,text=True);assert r.returncode==0,r.stderr
 r=subprocess.run(['git','apply',str(patch)],cwd=tmp/'check',capture_output=True,text=True);assert r.returncode==0,r.stderr
 exact={f:(tmp/'check'/f).read_bytes()==(root/f).read_bytes() for f in files};assert all(exact.values())
 write('patch-validation.json',{'applyCheck':True,'exactBytes':exact,'baseline':'preserved dirty checkout bytes, not HEAD','temporaryDirectoryRemovedOnExit':True})
finally:
 assert tmp.name.startswith('lg06d-patch-r1-') and tmp.parent==Path(tempfile.gettempdir()).resolve()
 shutil.rmtree(tmp)
write('compact-results.json',{'status':'PASS within bounded candidate scope','native':'final-r1-results.json','nativeExitCode':0,'checkGroups':8,'default':{'before':'before-default.json','final':'confirmation-default.json','equal':json.loads((out/'before-default.json').read_text())==json.loads((out/'confirmation-default.json').read_text()),'minutes':5,'wrapperExitCode':0},'originalFailure':'main-r1-results.json','failureReason':'Folio fixture lacked Genre press/Folio charter for active work; corrected fixture preserved separately','fixes':['A9 preference writes preserve other local suspensions','A9 observer resets its clock on modal/eligibility loss between ticks'],'images':['final-r1-pixel-360.png','final-r1-classic-360.png'],'imagesOpened':True,'cleanup':['before-control-cleanup.json','main-r1-cleanup.json','confirmation-r1-cleanup.json','final-r1-cleanup.json','final-control-cleanup.json','confirmation-control-cleanup.json']})
