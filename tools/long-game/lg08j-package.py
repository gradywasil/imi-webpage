from pathlib import Path
import json,hashlib,subprocess,difflib,tempfile
out=Path('docs/plan/long-game/evidence/LG-08/mastery-r1')
files=['ops.js','rewards.js','automation.js','vault-save-gate.js','sw.js']
rows={};syntax={};patch=''
for f in files:
 b=Path(f).read_bytes();old=(out/'dirty-before'/f).read_bytes()
 rows[f]={'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest(),'crlf':b.count(b'\r\n'),'lf':b.count(b'\n'),'beforeCRLF':old.count(b'\r\n'),'beforeLF':old.count(b'\n'),'utf8BOM':b.startswith(b'\xef\xbb\xbf')}
 assert (b.count(b'\r\n')==b.count(b'\n'))==(old.count(b'\r\n')==old.count(b'\n'))
 r=subprocess.run(['node','--check',f],capture_output=True,text=True);syntax[f]={'exit':r.returncode,'stdout':r.stdout,'stderr':r.stderr};assert r.returncode==0
 patch+=''.join(difflib.unified_diff(old.decode().splitlines(keepends=True),b.decode().splitlines(keepends=True),fromfile='a/'+f,tofile='b/'+f))
(out/'task.patch').write_bytes(patch.encode())
with tempfile.TemporaryDirectory(prefix='lg08j-patch-') as td:
 for f in files:Path(td,f).write_bytes((out/'dirty-before'/f).read_bytes())
 r=subprocess.run(['git','-c','core.autocrlf=false','apply','--whitespace=nowarn',str((out/'task.patch').resolve())],cwd=td,capture_output=True,text=True);assert r.returncode==0,r.stderr
 matches={f:Path(td,f).read_bytes()==Path(f).read_bytes() for f in files};assert all(matches.values())
(out/'taskpatch-check.json').write_text(json.dumps({'appliedToTaskOwnedTemporaryDirtyBefore':True,'exactRawBytes':matches,'temporaryCopyCleaned':True},indent=2))
(out/'final-source.json').write_text(json.dumps(rows,indent=2));(out/'syntax.json').write_text(json.dumps(syntax,indent=2))
baseline=json.loads((out/'dirty-before-source.json').read_text(encoding='utf-8'));unchanged={f:hashlib.sha256(Path(f).read_bytes()).hexdigest()==v['sha256'] for f,v in baseline.items() if f not in files};assert all(unchanged.values());(out/'unchanged-owners.json').write_text(json.dumps(unchanged,indent=2))
main=json.loads((out/'release-results.json').read_text(encoding='utf-8'));assert main['status']=='PASS'
for f,v in main['source'].items():assert hashlib.sha256(Path(f).read_bytes()).hexdigest()==v,f
assert json.loads((out/'before-default.json').read_text(encoding='utf-8'))==json.loads((out/'confirmation-default.json').read_text(encoding='utf-8'))
(out/'verification.json').write_text(json.dumps({'syntax':syntax,'patchRawBytes':matches,'unchangedOwners':unchanged,'finalMainSourceMatched':True,'mainEvidence':'release-results.json','fiveMinuteReportMetaErrorsEqual':True,'cache':'imi-v67','naturalPacing':False,'independentReview':'pending'},indent=2))
(out/'final-status.txt').write_bytes(subprocess.check_output(['git','status','--short']))
print(json.dumps({'syntax':len(syntax),'exactPatchFiles':len(matches),'unchangedOwners':unchanged,'finalMainSourceMatched':True,'defaultEqual':True}))
