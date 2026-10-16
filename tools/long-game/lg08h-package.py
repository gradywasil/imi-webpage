from pathlib import Path
import json,hashlib,subprocess,difflib,tempfile
out=Path('docs/plan/long-game/evidence/LG-08/auto-print-r1')
files=['automation.js','ops.js','rewards.js','vault-save-gate.js','sw.js','automation.css']
rows={};syntax={};patch=''
for f in files:
 b=Path(f).read_bytes();old=(out/('before-'+f)).read_bytes()
 rows[f]={'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest(),'crlf':b.count(b'\r\n'),'lf':b.count(b'\n'),'beforeCRLF':old.count(b'\r\n'),'beforeLF':old.count(b'\n'),'utf8BOM':b.startswith(b'\xef\xbb\xbf')}
 assert (b.count(b'\r\n')==b.count(b'\n')) == (old.count(b'\r\n')==old.count(b'\n'))
 if f.endswith('.js'):
  r=subprocess.run(['node','--check',f],capture_output=True,text=True);syntax[f]={'exit':r.returncode,'stdout':r.stdout,'stderr':r.stderr};assert r.returncode==0
 patch+=''.join(difflib.unified_diff(old.decode('utf-8').splitlines(keepends=True),b.decode('utf-8').splitlines(keepends=True),fromfile='a/'+f,tofile='b/'+f))
(out/'task.patch').write_bytes(patch.encode('utf-8'))
with tempfile.TemporaryDirectory(prefix='lg08h-patch-') as td:
 for f in files:Path(td,f).write_bytes((out/('before-'+f)).read_bytes())
 r=subprocess.run(['git','-c','core.autocrlf=false','apply','--whitespace=nowarn',str((out/'task.patch').resolve())],cwd=td,capture_output=True,text=True)
 assert r.returncode==0,r.stderr
 matches={f:Path(td,f).read_bytes()==Path(f).read_bytes() for f in files};assert all(matches.values())
(out/'taskpatch-check.json').write_text(json.dumps({'appliedToTaskOwnedTemporaryDirtyBefore':True,'exactRawBytes':matches,'temporaryCopyCleaned':True},indent=2))
(out/'final-source.json').write_text(json.dumps(rows,indent=2));(out/'syntax.json').write_text(json.dumps(syntax,indent=2))
unchanged={f:Path(f).read_bytes()==(out/('before-'+f)).read_bytes() for f in ['core.js']};assert all(unchanged.values())
control=json.loads((out/'before-control-source.json').read_text());unchanged.update({f:hashlib.sha256(Path(f).read_bytes()).hexdigest()==control[f]['sha256'] for f in ['layers.js','estate.js']});assert all(unchanged.values())
(out/'unchanged-owners.json').write_text(json.dumps(unchanged,indent=2))
(out/'final-status.txt').write_bytes(subprocess.check_output(['git','status','--short']))
print(json.dumps({'syntax':len(syntax),'patch':matches,'unchanged':unchanged}))
