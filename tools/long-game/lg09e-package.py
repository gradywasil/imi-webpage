from pathlib import Path
import json,hashlib,difflib,subprocess
out=Path('docs/plan/long-game/evidence/LG-09/anthology-r1');base=Path('docs/plan/long-game/evidence/LG-09/remaining-play-design-r1')
files=['works-catalogue.js','works-play.js','works.js','ops.js','layers.js','folio.js','archive.js','index.html','classic.html','tools/balance.html','sw.js']
sha=lambda b:hashlib.sha256(b).hexdigest()
rows={};patch=b'';syntax={}
for f in files:
 p=Path(f);b=p.read_bytes();old=(out/'before'/f).read_bytes() if (out/'before'/f).exists() else b''
 target=out/'source'/f;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(b)
 rows[f]={'sha256':sha(b),'bytes':len(b),'beforeSha256':sha(old) if old else None,'encoding':'UTF-8 without BOM','crlf':b.count(b'\r\n'),'lf':b.count(b'\n')}
 if old:assert (b'\r\n' in old)==(b'\r\n' in b),f
 patch+=''.join(difflib.unified_diff(old.decode().splitlines(keepends=True),b.decode().splitlines(keepends=True),fromfile='a/'+f if old else '/dev/null',tofile='b/'+f)).encode()
 if p.suffix=='.js':
  r=subprocess.run(['node','--check',f],capture_output=True,text=True);syntax[f]={'exit':r.returncode,'stderr':r.stderr};assert r.returncode==0
(out/'task.patch').write_bytes(patch)
(out/'final-source.json').write_text(json.dumps(rows,indent=2));(out/'syntax.json').write_text(json.dumps(syntax,indent=2))
readonly={}
for f,r in json.loads((out/'dirty-before.json').read_text(encoding='utf-8')).items():
 if f not in files:readonly[f]={'sha256':sha(Path(f).read_bytes()),'unchanged':sha(Path(f).read_bytes())==r['sha256']};assert readonly[f]['unchanged'],f
(out/'readonly-preservation.json').write_text(json.dumps(readonly,indent=2))
check=out/'patch-check'
for f in files:
 p=out/'before'/f
 q=check/f
 if p.exists():q.parent.mkdir(parents=True,exist_ok=True);q.write_bytes(p.read_bytes())
 elif q.exists():q.unlink()
r=subprocess.run(['git','-c','core.autocrlf=false','apply','--no-index','--directory='+check.as_posix(),str(out/'task.patch')],capture_output=True,text=True)
assert r.returncode==0,r.stderr
assert all((check/f).read_bytes()==Path(f).read_bytes() for f in files)
(out/'taskpatch-check.json').write_text(json.dumps({'status':'PASS','exactReconstruction':True,'files':files,'patchSha256':sha(patch),'gitApplyStderr':r.stderr},indent=2))
save=json.loads((out/'confirmation-final-save.json').read_text(encoding='utf-8'))['state']['meta']['works'];runtime=[]
for i,(id,w) in enumerate([('midsummer-chimp',save),*save['anthology']['plays'].items()]):
 if i:
  m=json.loads((base/(id+'-manifest.json')).read_text(encoding='utf-8'));d=json.loads((base/(id+'-release-descriptor.json')).read_text(encoding='utf-8'));assert json.loads(w['content'])==m;assert json.loads(w['signature']['receipt'])==d;assert w['playbill']['title']==d['copy']['playbillTitle'];assert w['playbill']['body']==d['copy']['playbillBody']
 m=json.loads(w['content']);assert w['index']==20000 and w['signed'];runtime.append({'order':i+1,'playId':id,'contentId':m['contentId'],'bodySha256':m['bodySha256'],'orderedTokensSha256':m['orderedTokensSha256'],'claimId':w['signature']['claimId'],'receiptJsonSha256':sha(w['signature']['receipt'].encode()),'contentJsonSha256':sha(w['content'].encode()),'playbill':w['playbill'],'prefix':w['index']})
completion=json.loads((base/'anthology-completion-proposal.json').read_text(encoding='utf-8'));assert save['anthology']['completion']==dict(completionId=completion['completionId'],**completion['proposedRecord'])
(out/'runtime-identities.json').write_text(json.dumps({'status':'PASS','packageIndexSha256':sha((base/'package-identity.json').read_bytes()),'records':runtime,'completion':save['anthology']['completion']},indent=2))
ops=Path('ops.js').read_text(encoding='utf-8');old=(out/'before/ops.js').read_text(encoding='utf-8')
start=ops.index('  function simulateAway');end=ops.index('\n  function ',start+5)
assert ops[start:end]==old[old.index('  function simulateAway'):old.index('\n  function ',old.index('  function simulateAway')+5)]
(out/'source-qualification.json').write_text(json.dumps({'awayOwnerUnchangedFromDirtyBefore':True,'sharedActualGeneration':['ops.js generatedLetter512 actual press base/bonus','ops.js2113 actual offline per-character output route','ops.js659 and2126 bounded advance'],'factorConsumers':['ops.js377 automatic typistSpeed','ops.js481 projected retained starting crew'],'resetQualification':['fresh actual Printing/reload in confirmation-results','Layers.identityReady49 and settled78 validate every record, including flagoff','Layers.finishRoom110 exits all introduced work; Imprint project and Estate.project both call it','Estate.js unchanged; actual seven-record Estate/Imprint reset not rerun'],'reusedAcceptedEvidence':['LG-09C-accepted.md','first-play-r1/verified-results.json','first-play-review-r1/estate-signed-final.json'],'reuseLimits':'Accepted prior first-play/demo material/away evidence qualifies unchanged shared owners only. No claim of a fresh full old matrix or natural fresh acquisition.'},indent=2))
images=['confirmation-'+ed+'-'+stage+'-360.png' for ed in ['pixel','classic'] for stage in ['later-work','next-introduction']]+['final-'+ed+'-'+stage+'-360.png' for ed in ['pixel','classic'] for stage in ['playbill7','finish','continue']]
(out/'image-inspection.json').write_text(json.dumps({'status':'PASS','openedByImplementationAgent':images,'geometry':'360x560','observed':'Active internal scrolling panes, readable current word/source/shortage; next manual introduction; exact Playbill7 and saved finish/Continue; no page overflow. Actions measured at least40px. Low and reduced-motion selected.','initialCaptureLimit':'main finish captures did not show full copy; retained and superseded by final captures. No product scenario failure.'},indent=2))
(out/'final-status.txt').write_bytes(subprocess.check_output(['git','status','--short']))
print('Packaged11 product files,8 syntax checks, exact patch reconstruction, readonly preservation and7 runtime identities PASS')
