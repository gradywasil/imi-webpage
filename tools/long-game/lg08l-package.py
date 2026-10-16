from pathlib import Path
import json,hashlib,subprocess,difflib,tempfile
out=Path('docs/plan/long-game/evidence/LG-08/auto-challenge-r1')
files=['auto-challenge.js','ops.js','rewards.js','automation.js','vault-save-gate.js','index.html','classic.html','tools/balance.html','sw.js','automation.css']
rows={};syntax={};patch=''
for f in files:
 b=Path(f).read_bytes();old=(out/'dirty-before'/f).read_bytes() if (out/'dirty-before'/f).exists() else b''
 b.decode('utf8');rows[f]={'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest(),'crlf':b.count(b'\r\n'),'lf':b.count(b'\n'),'beforeCRLF':old.count(b'\r\n'),'beforeLF':old.count(b'\n'),'utf8BOM':b.startswith(b'\xef\xbb\xbf')}
 if old:assert (b.count(b'\r\n')==b.count(b'\n'))==(old.count(b'\r\n')==old.count(b'\n'))
 if f.endswith('.js'):
  r=subprocess.run(['node','--check',f],capture_output=True,text=True);syntax[f]={'exit':r.returncode,'stdout':r.stdout,'stderr':r.stderr};assert r.returncode==0
 patch+=''.join(difflib.unified_diff(old.decode('utf8').splitlines(keepends=True),b.decode('utf8').splitlines(keepends=True),fromfile='a/'+f if old else '/dev/null',tofile='b/'+f))
 target=out/'final-source'/f;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(b)
(out/'task.patch').write_bytes(patch.encode('utf8'))
with tempfile.TemporaryDirectory(prefix='lg08l-patch-') as td:
 for f in files:
  old=out/'dirty-before'/f
  if old.exists():
   target=Path(td,f);target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(old.read_bytes())
 args=['git','-c','core.autocrlf=false','apply','--whitespace=nowarn']
 r=subprocess.run(args+['--check',str((out/'task.patch').resolve())],cwd=td,capture_output=True,text=True);assert r.returncode==0,r.stderr
 r=subprocess.run(args+[str((out/'task.patch').resolve())],cwd=td,capture_output=True,text=True);assert r.returncode==0,r.stderr
 matches={f:Path(td,f).read_bytes()==Path(f).read_bytes() for f in files};assert all(matches.values())
(out/'taskpatch-check.json').write_text(json.dumps({'appliedToTaskOwnedTemporaryDirtyBefore':True,'exactRawBytes':matches,'temporaryCopyCleaned':True},indent=2),encoding='utf8')
(out/'final-source.json').write_text(json.dumps(rows,indent=2),encoding='utf8');(out/'syntax.json').write_text(json.dumps(syntax,indent=2),encoding='utf8')
baseline=json.loads((out/'dirty-before-source.json').read_text(encoding='utf8'));unchanged={f:hashlib.sha256(Path(f).read_bytes()).hexdigest()==v['sha256'] for f,v in baseline.items() if f not in files};assert all(unchanged.values());(out/'unchanged-owners.json').write_text(json.dumps(unchanged,indent=2),encoding='utf8')
main=json.loads((out/'exact-results.json').read_text(encoding='utf8'));assert main['status']=='PASS'
for f,v in main['source'].items():assert hashlib.sha256(Path(f).read_bytes()).hexdigest()==v,f
recovery=json.loads((out/'release-recovery-results.json').read_text(encoding='utf8'));assert recovery['status']=='PASS'
for f,h in recovery['hashes'].items():assert recovery['loaded'][f]==h==hashlib.sha256(Path(f).read_bytes()).hexdigest(),f
visual=json.loads((out/'release-visual-results.json').read_text(encoding='utf8'));assert visual['status']=='PASS'
for f,h in visual['source'].items():assert h==hashlib.sha256(Path(f).read_bytes()).hexdigest(),f
assert json.loads((out/'before-default.json').read_text(encoding='utf8'))==json.loads((out/'confirmation-default.json').read_text(encoding='utf8'))
registrations={f:Path(f).read_text(encoding='utf8').count('src="'+('../' if f.startswith('tools/') else '')+'auto-challenge.js"')==1 for f in ['index.html','classic.html','tools/balance.html']};assert all(registrations.values());assert "'imi-v68'" in Path('sw.js').read_text(encoding='utf8')
(out/'verification.json').write_text(json.dumps({'syntax':syntax,'patchRawBytes':matches,'unchangedOwners':unchanged,'mainEvidence':'exact-results.json','finalMainSourceMatched':True,'loadedRecoverySourcesMatched':True,'fiveMinuteReportMetaErrorsEqual':True,'registrations':registrations,'cache':'imi-v68','naturalPacing':False,'independentReview':'pending'},indent=2),encoding='utf8')
(out/'final-status.txt').write_bytes(subprocess.check_output(['git','status','--short']))
print(json.dumps({'syntax':len(syntax),'exactPatchFiles':len(matches),'unchangedOwners':unchanged,'finalMainSourceMatched':True,'defaultEqual':True}))
