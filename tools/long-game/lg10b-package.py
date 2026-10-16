from pathlib import Path
import json,hashlib,subprocess,difflib,tempfile
out=Path('docs/plan/long-game/evidence/LG-10/awards-r1')
files=['awards-catalogue.js','ops.js','rewards.js','vault-save-gate.js','index.html','classic.html','tools/balance.html','sw.js']
digest=lambda b:hashlib.sha256(b).hexdigest()
rows={};syntax={};patch=''
for f in files:
 b=Path(f).read_bytes();old=(out/'dirty-before'/f).read_bytes() if (out/'dirty-before'/f).exists() else b''
 rows[f]={'bytes':len(b),'sha256':digest(b),'crlf':b.count(b'\r\n'),'lf':b.count(b'\n'),'beforeCRLF':old.count(b'\r\n'),'beforeLF':old.count(b'\n'),'utf8BOM':b.startswith(b'\xef\xbb\xbf')}
 if old and old.count(b'\r\n')==old.count(b'\n'):assert b.count(b'\r\n')==b.count(b'\n'),f
 if f.endswith('.js'):
  r=subprocess.run(['node','--check',f],capture_output=True,text=True);syntax[f]={'exit':r.returncode,'stdout':r.stdout,'stderr':r.stderr};assert r.returncode==0
 patch+=''.join(difflib.unified_diff(old.decode('utf8').splitlines(keepends=True),b.decode('utf8').splitlines(keepends=True),fromfile='a/'+f if old else '/dev/null',tofile='b/'+f))
 target=out/'final-source'/f;target.parent.mkdir(parents=True,exist_ok=True)
 if target.exists():assert target.read_bytes()==b
 else:target.write_bytes(b)
if (out/'task.patch').exists():assert (out/'task.patch').read_bytes()==patch.encode('utf8')
else:(out/'task.patch').write_bytes(patch.encode('utf8'))
td=tempfile.mkdtemp(prefix='lg10b-patch-')
for f in files:
 old=out/'dirty-before'/f
 if old.exists():
  target=Path(td,f);target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(old.read_bytes())
args=['git','-c','core.autocrlf=false','apply','--whitespace=nowarn']
for extra in [['--check'],[]]:
 r=subprocess.run(args+extra+[str((out/'task.patch').resolve())],cwd=td,capture_output=True,text=True);assert r.returncode==0,r.stderr
matches={f:Path(td,f).read_bytes()==Path(f).read_bytes() for f in files};assert all(matches.values())
baseline=json.loads((out/'dirty-before-source.json').read_text(encoding='utf8'));unchanged={f:digest(Path(f).read_bytes())==v['sha256'] for f,v in baseline.items() if f not in files};assert all(unchanged.values())
reused=json.loads(Path('docs/plan/long-game/evidence/LG-10/awards-design-r1/inputs-before.json').read_text(encoding='utf8'));reusedMatches={v['path']:digest(Path(v['path']).read_bytes())==v['sha256'] for v in reused if v['path'] not in files};assert [f for f,v in reusedMatches.items() if not v]==['docs/plan/long-game/README.md']
for name in ['release-results.json','release-display-display.json','release-static.json']:
 e=json.loads((out/name).read_text(encoding='utf8'));assert e['status']=='PASS',name
 for f,h in e['source'].items():assert h==digest(Path(f).read_bytes()),f
assert (out/'before-default.json').read_bytes()==(out/'release-default.json').read_bytes()
registrations={f:Path(f).read_text(encoding='utf8').count('src="'+('../' if f.startswith('tools/') else '')+'awards-catalogue.js"')==1 for f in ['index.html','classic.html','tools/balance.html']};assert all(registrations.values())
for f in registrations:
 b=Path(f).read_bytes();prefix='../' if f.startswith('tools/') else '';tag=f'<script src="{prefix}awards-catalogue.js"></script>\n'.encode();assert b.replace(tag,b'',1)==(out/'dirty-before'/f).read_bytes(),f
sw=Path('sw.js').read_bytes();assert sw.replace(b"'imi-v72'",b"'imi-v71'",1).replace(b"'awards-catalogue.js', ",b'',1)==(out/'dirty-before/sw.js').read_bytes()
outputs={'final-source.json':rows,'syntax.json':syntax,'taskpatch-check.json':{'appliedToTemporaryDirtyBefore':True,'exactRawBytes':matches,'temporaryCopyRetained':td},'unchanged-owners.json':unchanged,'reused-design-input-equality.json':{'qualification':'Reused LG10A source seal compared with current source, not fresh before-task hash capture for these additional inputs','matches':reusedMatches,'knownAuthorityDrift':'long-game README gained owner approval notice after the LG10A design seal and before this task. Read at task start; unchanged by this task, not claimed as design-hash match.'},'verification.json':{'status':'CANDIDATE_READY_FOR_DIFFERENT_MODEL_REVIEW','syntaxFiles':len(syntax),'rawPatchBytes':matches,'freshUnchangedRootOwners':len(unchanged),'reusedDesignInputEquality':len(reusedMatches),'sourceMatched':['release-results.json','release-display-display.json','release-static.json'],'defaultFiveMinuteReportMetaErrorsByteEqual':True,'registrations':registrations,'shellsRegistrationOnlyRawEquality':True,'swAssetsAndCacheOnlyRawEquality':True,'cache':'imi-v72','naturalPacing':False,'independentReview':'not run'}}
for name,value in outputs.items():
 with (out/name).open('x',encoding='utf8') as stream:json.dump(value,stream,indent=2)
with (out/'final-status.txt').open('xb') as stream:stream.write(subprocess.check_output(['git','status','--short']))
print(json.dumps({'exactPatchFiles':len(matches),'syntaxFiles':len(syntax),'readOnlyOwnersUnchanged':len(unchanged),'reusedInputMatches':len(reusedMatches),'sourceMatched':True,'defaultByteEqual':True}))
