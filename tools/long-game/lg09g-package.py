from pathlib import Path
import json,hashlib,subprocess,difflib,tempfile

out=Path('docs/plan/long-game/evidence/LG-09/commission-board-r1')
files=['commission-board.js','commission-board.css','ops.js','rewards.js','vault-save-gate.js','index.html','classic.html','tools/balance.html','sw.js']
digest=lambda b:hashlib.sha256(b).hexdigest()
rows={};syntax={};patch=''
for f in files:
 b=Path(f).read_bytes();old=(out/'dirty-before'/f).read_bytes() if (out/'dirty-before'/f).exists() else b''
 b.decode('utf8');rows[f]={'bytes':len(b),'sha256':digest(b),'crlf':b.count(b'\r\n'),'lf':b.count(b'\n'),'beforeCRLF':old.count(b'\r\n'),'beforeLF':old.count(b'\n'),'utf8BOM':b.startswith(b'\xef\xbb\xbf')}
 if old and old.count(b'\r\n')==old.count(b'\n'):assert b.count(b'\r\n')==b.count(b'\n')
 if f.endswith('.js'):
  r=subprocess.run(['node','--check',f],capture_output=True,text=True);syntax[f]={'exit':r.returncode,'stdout':r.stdout,'stderr':r.stderr};assert r.returncode==0
 patch+=''.join(difflib.unified_diff(old.decode('utf8').splitlines(keepends=True),b.decode('utf8').splitlines(keepends=True),fromfile='a/'+f if old else '/dev/null',tofile='b/'+f))
 target=out/'final-source'/f;target.parent.mkdir(parents=True,exist_ok=True)
 if target.exists():assert target.read_bytes()==b
 else:
  with target.open('xb') as stream:stream.write(b)
if (out/'task.patch').exists():assert (out/'task.patch').read_bytes()==patch.encode('utf8')
else:
 with (out/'task.patch').open('xb') as stream:stream.write(patch.encode('utf8'))
with tempfile.TemporaryDirectory(prefix='lg09g-patch-') as td:
 for f in files:
  old=out/'dirty-before'/f
  if old.exists():
   target=Path(td,f);target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(old.read_bytes())
 args=['git','-c','core.autocrlf=false','apply','--whitespace=nowarn']
 for extra in [['--check'],[]]:
  r=subprocess.run(args+extra+[str((out/'task.patch').resolve())],cwd=td,capture_output=True,text=True);assert r.returncode==0,r.stderr
 matches={f:Path(td,f).read_bytes()==Path(f).read_bytes() for f in files};assert all(matches.values())
baseline=json.loads((out/'dirty-before-source.json').read_text(encoding='utf8'));unchanged={f:digest(Path(f).read_bytes())==v['sha256'] for f,v in baseline.items() if f not in files};assert all(unchanged.values())
main=json.loads((out/'sealed-results.json').read_text(encoding='utf8'));cold=json.loads((out/'sealed-cold-cold.json').read_text(encoding='utf8'));visual=json.loads((out/'sealed-image-visual.json').read_text(encoding='utf8'))
for evidence in [main,cold,visual]:
 assert evidence['status']=='PASS'
 for f,h in evidence['source'].items():assert h==digest(Path(f).read_bytes()),f
assert json.loads((out/'before-default.json').read_text(encoding='utf8'))==json.loads((out/'sealed-default.json').read_text(encoding='utf8'))
registrations={f:{kind:Path(f).read_text(encoding='utf8').count(('src="' if kind=='js' else 'href="')+('../' if f.startswith('tools/') else '')+'commission-board.'+kind+'"')==1 for kind in ['js','css']} for f in ['index.html','classic.html','tools/balance.html']}
assert all(all(r.values()) for r in registrations.values());assert "'imi-v69'" in Path('sw.js').read_text(encoding='utf8')
metrics={'fixedReward':main['start']['state']['meta']['commissionBoard']['active']['descriptor'],'manualLetters':main['production']['after']['letters']-main['production']['before']['letters'],'keeperWords':main['production']['after']['words']-main['production']['before']['words'],'sale':main['sale']['state']['meta']['commissionBoard']['receipt'],'postPrintingBasis':main['reset']['rateAfter'],'postPrintingBoardEqual':main['reset']['before']==main['reset']['after'],'claimHeldPaid':True,'actualRetryDuplicateNoExtraCredit':main['retry']['wallet']==main['held']['wallet']==main['retry']['duplicateWallet'],'fits':visual['fits']}
outputs={'final-source.json':rows,'syntax.json':syntax,'taskpatch-check.json':{'appliedToTemporaryDirtyBefore':True,'exactRawBytes':matches,'temporaryCopyCleaned':True},'unchanged-owners.json':unchanged,'compact-evidence.json':metrics,'verification.json':{'status':'CANDIDATE_PASS_REVIEW_PENDING','syntax':syntax,'rawPatchBytes':matches,'unchangedOwners':unchanged,'main':'sealed-results.json','cold':'sealed-cold-cold.json','arithmetic':'sealed-cold-arithmetic.json','visual':'sealed-image-visual.json','sourceMatched':True,'defaultFiveMinuteReportMetaErrorsEqual':True,'registrations':registrations,'cache':'imi-v69','naturalPacing':False,'independentReview':'pending'}}
for name,value in outputs.items():
 with (out/name).open('x',encoding='utf8') as stream:json.dump(value,stream,indent=2)
with (out/'final-status.txt').open('xb') as stream:stream.write(subprocess.check_output(['git','status','--short']))
print(json.dumps({'exactPatchFiles':len(matches),'syntaxFiles':len(syntax),'readOnlyOwnersUnchanged':all(unchanged.values()),'sourceMatchedMainColdVisual':True,'defaultEqual':True}))
