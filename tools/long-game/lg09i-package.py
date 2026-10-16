from pathlib import Path
import json,hashlib,difflib,subprocess,tempfile
out=Path('docs/plan/long-game/evidence/LG-09/hall-r1')
seal=out/'release-seal';seal.mkdir(exist_ok=True)
files=['hall.js','hall.css','ops.js','rewards.js','vault-save-gate.js','index.html','classic.html','tools/balance.html','sw.js']
hash=lambda b:hashlib.sha256(b).hexdigest()
main=json.loads((out/'release-main-results.json').read_text(encoding='utf8'));visual=json.loads((out/'visual-release-results.json').read_text(encoding='utf8'));assert main['status']==visual['status']=='PASS'
qualification={}
for f,h in main['source'].items():
 b=Path(f).read_bytes()
 if hash(b)!=h:
  if f=='hall.js':
   a=b'<button type="button" class="o-btn" data-act="hall:';z=b'<button type="button" data-act="hall:';why='Only the existing o-btn presentation class was added after main. Final visual and pure checks cover final source.'
  elif f=='vault-save-gate.js':
   a=b"hallRecord.claims[hallId].version === 1 && hallRecord.claims[hallId].rule === 1 && hallRecord.claims[hallId].status";z=b"hallRecord.claims[hallId].version === 1 && hallRecord.claims[hallId].status";why='Early envelope now also holds unsupported Hall receipt rule versions. Final cold-envelope and visual checks cover final source; supported main envelope unchanged.'
  else:raise AssertionError(f)
  assert b.count(a)==1 and hash(b.replace(a,z))==h
  qualification[f]={'mainSHA256':h,'finalSHA256':hash(b),'exactSingleReplacementReconstructsMainHash':True,'reason':why}
 assert visual['source'][f]==hash(b),f
rows={};syntax={};patch=''
for f in files:
 b=Path(f).read_bytes();oldfile=out/'dirty-before'/f;old=oldfile.read_bytes() if oldfile.exists() else b''
 b.decode('utf8');rows[f]={'sha256':hash(b),'bytes':len(b),'crlf':b.count(b'\r\n'),'lf':b.count(b'\n'),'beforeCRLF':old.count(b'\r\n'),'beforeLF':old.count(b'\n')}
 patch+=''.join(difflib.unified_diff(old.decode('utf8').splitlines(keepends=True),b.decode('utf8').splitlines(keepends=True),fromfile='a/'+f if old else '/dev/null',tofile='b/'+f))
 p=seal/'final-source'/f;p.parent.mkdir(parents=True,exist_ok=True)
 if p.exists():assert p.read_bytes()==b
 else:
  with p.open('xb') as stream:stream.write(b)
 if f.endswith('.js'):
  r=subprocess.run(['node','--check',f],capture_output=True,text=True);syntax[f]={'exit':r.returncode,'stderr':r.stderr};assert r.returncode==0
if (seal/'task.patch').exists():assert (seal/'task.patch').read_bytes()==patch.encode('utf8')
else:
 with (seal/'task.patch').open('xb') as stream:stream.write(patch.encode('utf8'))
with tempfile.TemporaryDirectory(prefix='lg09i-rawpatch-') as td:
 for f in files:
  p=out/'dirty-before'/f
  if p.exists():
   t=Path(td,f);t.parent.mkdir(parents=True,exist_ok=True);t.write_bytes(p.read_bytes())
 for extra in [['--check'],[]]:
  r=subprocess.run(['git','-c','core.autocrlf=false','apply','--whitespace=nowarn']+extra+[str((seal/'task.patch').resolve())],cwd=td,capture_output=True,text=True);assert r.returncode==0,r.stderr
 matches={f:Path(td,f).read_bytes()==Path(f).read_bytes() for f in files};assert all(matches.values())
baseline=json.loads((out/'dirty-before-source.json').read_text(encoding='utf8'));unchanged={f:hash(Path(f).read_bytes())==v['sha256'] for f,v in baseline.items() if f not in files};assert all(unchanged.values())
assert json.loads((out/'before-default.json').read_text(encoding='utf8'))==json.loads((out/'release-default.json').read_text(encoding='utf8'))
registrations={f:{ext:Path(f).read_text(encoding='utf8').count(('src="' if ext=='js' else 'href="')+('../' if f.startswith('tools/') else '')+'hall.'+ext+'"')==1 for ext in ['js','css']} for f in ['index.html','classic.html','tools/balance.html']};assert all(all(v.values()) for v in registrations.values());assert "'imi-v70'" in Path('sw.js').read_text(encoding='utf8')
compact={'status':'CANDIDATE_READY_FOR_INDEPENDENT_REVIEW','historicalMembers':list(main['initial']['state']['meta']['hall']['historical']),'actualRerolls':len(main['acquisition']['attempts']),'finalMissingLook':next(x for x in main['acquisition']['attempts'] if x['look']=='v05'),'savedNotLiveUntilDiscovery':not main['acquisition']['hall']['discovered'].get('v05'),'claimFailureNoPublishedToken':not main['failure']['state']['rewards']['storedGold']['tokens'].get('hall:athletic-five:first'),'claimRetry':main['claim']['state']['meta']['hall']['claims']['hall:athletic-five:first'],'consumedToken':main['consumedReload']['state']['rewards']['storedGold']['tokens']['hall:athletic-five:first'],'duplicateNoRegrant':main['consumedReload']['duplicate'],'actualLegacyPrintingRetention':all(main['reset']['before'][k]==main['reset']['after'][k] for k in ['hall','tokens','looks']),'printingBefore':main['reset']['before']['printing'],'printingAfter':main['reset']['after']['printing'],'awardsAndPremiumUnchangedByHallClaim':main['failure']['state']['awards']==main['claim']['state']['awards'] and main['failure']['state']['prem']==main['claim']['state']['prem'],'defaultFiveMinuteReportMetaErrorsEqual':True,'visual':visual['fits'],'mainSourceQualification':qualification,'noNaturalPacingClaim':True}
for name,value in {'final-source.json':rows,'syntax.json':syntax,'main-source-qualified.json':qualification,'taskpatch-check.json':{'temporaryDirtyBeforeCheckAndApply':True,'exactRawBytes':matches,'temporaryCopyCleaned':True},'unchanged-owners.json':unchanged,'registrations.json':{'shells':registrations,'swCache':'imi-v70','hallAssetsPresent':True},'compact-evidence.json':compact}.items():
 with (seal/name).open('x',encoding='utf8') as stream:json.dump(value,stream,indent=2)
with (seal/'final-status.txt').open('xb') as stream:stream.write(subprocess.check_output(['git','status','--short']))
print(json.dumps({'productFiles':len(files),'syntaxFiles':len(syntax),'rawPatchExact':all(matches.values()),'readOnlyFilesUnchanged':len(unchanged),'defaultEqual':True,'mainQualifiedPresentationAndEarlyRuleOnly':list(qualification)}))
