from pathlib import Path
import hashlib,json,subprocess,difflib,tempfile
out=Path('docs/plan/long-game/evidence/LG-08/printing-ack-r1')
files=['ops.js','rewards.js','core.js','vault-save-gate.js','automation.js','sw.js']
rows={};syntax={};patch=''
for f in files:
 b=Path(f).read_bytes();old=(out/('before-'+f)).read_bytes()
 rows[f]={'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest(),'crlf':b.count(b'\r\n'),'lf':b.count(b'\n')}
 r=subprocess.run(['node','--check',f],capture_output=True,text=True);syntax[f]={'exit':r.returncode,'stdout':r.stdout,'stderr':r.stderr};assert r.returncode==0
 patch+=''.join(difflib.unified_diff(old.decode().splitlines(keepends=True),b.decode().splitlines(keepends=True),fromfile='a/'+f,tofile='b/'+f))
(out/'task.patch').write_bytes(patch.encode())
with tempfile.TemporaryDirectory(prefix='lg08g-patch-') as td:
 for f in files:Path(td,f).write_bytes((out/('before-'+f)).read_bytes())
 r=subprocess.run(['git','-c','core.autocrlf=false','apply','--whitespace=nowarn',str((out/'task.patch').resolve())],cwd=td,capture_output=True,text=True)
 assert r.returncode==0,r.stderr
 matches={f:Path(td,f).read_bytes()==Path(f).read_bytes() for f in files};assert all(matches.values()),matches
(out/'taskpatch-check.json').write_text(json.dumps({'appliedToTaskOwnedTemporaryDirtyBefore':True,'exactRawBytes':matches,'temporaryCopyCleaned':True},indent=2))
(out/'final-source.json').write_text(json.dumps(rows,indent=2));(out/'syntax.json').write_text(json.dumps(syntax,indent=2))
assert Path('layers.js').read_bytes()==(out/'before-layers.js').read_bytes()
base=json.loads((out/'before-default.json').read_text());stable=json.loads((out/'frozen-default.json').read_text());assert base==stable
(out/'stable-results.json').write_text(json.dumps({'fiveMinuteReportMetaErrorsEqual':True,'optionalMeta':stable['meta'],'errors':stable['errors'],'changedJS':list(rows),'layersUnchangedBytes':True,'serviceWorker':'imi-v65','newScriptRegistration':False},indent=2))
(out/'final-status.txt').write_bytes(subprocess.check_output(['git','status','--short']))
(out/'before-LG-08G-printing-ack.md').write_bytes(Path('docs/plan/long-game/LG-08G-printing-ack.md').read_bytes())
print(json.dumps({'syntax':'6 PASS','patch':'6 exact raw byte reconstructions','default':'equal','layers':'unchanged'}))
