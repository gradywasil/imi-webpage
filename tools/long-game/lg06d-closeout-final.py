from pathlib import Path
import json,subprocess,tempfile,shutil
root=Path.cwd();out=root/'docs/plan/long-game/evidence/LG-06/implementation-muse-r1';files=['automation.js','ops.js','layers.js','automation.css','sw.js'];tmp=Path(tempfile.mkdtemp(prefix='lg06d-patch-final-')).resolve()
def write(n,v):
 with (out/n).open('x',encoding='utf-8') as f:json.dump(v,f,indent=2)
try:
 for f in files:(tmp/f).write_bytes((out/'before'/f).read_bytes())
 for args in [['--check'],[]]:
  r=subprocess.run(['git','-c','core.autocrlf=false','apply',*args,str(out/'task-only.patch')],cwd=tmp,capture_output=True,text=True);assert r.returncode==0,r.stderr
 exact={f:(tmp/f).read_bytes()==(root/f).read_bytes() for f in files};assert all(exact.values())
 write('patch-validation.json',{'applyCheck':True,'exactBytes':exact,'baseline':'preserved dirty checkout bytes, not HEAD','gitConfiguration':'core.autocrlf=false','initialFailure':'Initial apply inherited global autocrlf; byte assertion failed. patch-initial-diagnosis.json records corrected apply. No product changes.','temporaryDirectoryRemovedOnExit':True})
finally:
 assert tmp.name.startswith('lg06d-patch-final-') and tmp.parent==Path(tempfile.gettempdir()).resolve();shutil.rmtree(tmp)
write('compact-results.json',{'status':'PASS within bounded candidate scope','native':'final-r1-results.json','nativeExitCode':0,'checkGroups':8,'default':{'before':'before-default.json','final':'confirmation-default.json','equal':json.loads((out/'before-default.json').read_text())==json.loads((out/'confirmation-default.json').read_text()),'minutes':5,'wrapperExitCode':0},'originalFailure':'main-r1-results.json','failureReason':'Folio fixture lacked Genre press/Folio charter for active work; corrected fixture preserved separately','fixes':['A9 preference writes preserve other local suspensions','A9 observer resets its clock on modal/eligibility loss between ticks'],'images':['final-r1-pixel-360.png','final-r1-classic-360.png'],'imagesOpened':True,'cleanup':['before-control-cleanup.json','main-r1-cleanup.json','confirmation-r1-cleanup.json','final-r1-cleanup.json','final-control-cleanup.json','confirmation-control-cleanup.json']})
