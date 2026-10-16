from pathlib import Path
import subprocess,tempfile,shutil,json
root=Path.cwd();out=root/'docs/plan/long-game/evidence/LG-06/implementation-muse-r1';files=['automation.js','ops.js','layers.js','automation.css','sw.js'];tmp=Path(tempfile.mkdtemp(prefix='lg06d-patch-diagnosis-'))
try:
 for f in files:(tmp/f).write_bytes((out/'before'/f).read_bytes())
 r=subprocess.run(['git','-c','core.autocrlf=false','apply',str(out/'task-only.patch')],cwd=tmp,capture_output=True,text=True)
 report={'exitCode':r.returncode,'stderr':r.stderr,'files':{}}
 for f in files:
  a=(root/f).read_bytes();b=(tmp/f).read_bytes();c=(out/'before'/f).read_bytes();report['files'][f]={'exact':a==b,'normalized':a.replace(b'\r\n',b'\n')==b.replace(b'\r\n',b'\n'),'current':[len(a),a.count(b'\r\n'),a.count(b'\n')],'applied':[len(b),b.count(b'\r\n'),b.count(b'\n')],'before':[len(c),c.count(b'\r\n'),c.count(b'\n')]}
 print(json.dumps(report,indent=2));(out/'patch-initial-diagnosis.json').write_text(json.dumps(report,indent=2))
finally:shutil.rmtree(tmp)
