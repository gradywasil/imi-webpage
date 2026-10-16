from pathlib import Path
import difflib,hashlib,json,re,subprocess,tempfile
out=Path('docs/plan/long-game/evidence/LG-02/speed-funding-r1')
products=['awards-catalogue.js','ops.js','rewards.js','vault-save-gate.js','sw.js']
tooling=['tests/speed-funding-awards.test.cjs','tools/long-game/lg02f-default.cjs','tools/long-game/lg02f-check.cjs','tools/long-game/lg02f-display.cjs','tools/long-game/lg02f-seal.py']
task='docs/plan/long-game/LG-02F-speed-funding-awards.md'
sha=lambda b:hashlib.sha256(b).hexdigest()
write=lambda name,obj:(out/name).write_text(json.dumps(obj,indent=2),encoding='utf8')
source={};syntax={};patch=''
for f in products+tooling+[task]:
 b=Path(f).read_bytes();old=(out/'before'/f).read_bytes() if f in products else (out/'before-task.md').read_bytes() if f==task else b''
 source[f]={'sha256':sha(b),'bytes':len(b),'CRLF':b.count(b'\r\n'),'LF':b.count(b'\n'),'beforeCRLF':old.count(b'\r\n'),'beforeLF':old.count(b'\n'),'BOM':b.startswith(b'\xef\xbb\xbf')}
 if f.endswith(('.js','.cjs')):
  r=subprocess.run(['node','--check',f],capture_output=True,text=True);syntax[f]={'exit':r.returncode,'stderr':r.stderr};assert r.returncode==0
 patch+=''.join(difflib.unified_diff(old.decode('utf8').splitlines(keepends=True),b.decode('utf8').splitlines(keepends=True),fromfile='a/'+f if old else '/dev/null',tofile='b/'+f))
 target=out/'final'/f;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(b)
 # Every unchanged logical line keeps its original byte sequence, including its line ending.
 a=old.splitlines(keepends=True);z=b.splitlines(keepends=True);plain=lambda lines:[v.rstrip(b'\r\n') for v in lines]
 for tag,i,j,k,l in difflib.SequenceMatcher(None,plain(a),plain(z),autojunk=False).get_opcodes():
  if tag=='equal':assert a[i:j]==z[k:l],f
(out/'task.patch').write_bytes(patch.encode('utf8'))
td=Path(tempfile.mkdtemp(prefix='lg02f-patch-'))
for f in products+[task]:
 target=td/f;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes((out/'before'/f).read_bytes() if f in products else (out/'before-task.md').read_bytes())
for extra in [['--check'],[]]:
 r=subprocess.run(['git','-c','core.autocrlf=false','apply','--whitespace=nowarn']+extra+[str((out/'task.patch').resolve())],cwd=td,capture_output=True,text=True);assert r.returncode==0,r.stderr
matches={f:(td/f).read_bytes()==Path(f).read_bytes() for f in source};assert all(matches.values())
before=json.loads((out/'before-source.json').read_text(encoding='utf8'));owners={f:sha(Path(f).read_bytes())==v['sha256'] for f,v in before.items() if f not in products};assert all(owners.values())
index=subprocess.check_output(['git','ls-files','--stage']);assert index==(out/'before-index.txt').read_bytes()
old=lambda f:(out/'before'/f).read_bytes();new=lambda f:Path(f).read_bytes()
block=lambda s,start,end:s[s.index(start):s.index(end,s.index(start))]
assert block(old('ops.js'),b'  const AWARDS = [',b'  function achieve(')==block(new('ops.js'),b'  const AWARDS = [',b'  function achieve(')
assert block(old('rewards.js'),b'  const assignments = {',b'  const object =')==block(new('rewards.js'),b'  const assignments = {',b'  const object =')
assert block(old('rewards.js'),b'  function expandedInitialize()',b'  function expandedDiscover(')==block(new('rewards.js'),b'  function expandedInitialize()',b'  function expandedDiscover(')
assert block(old('awards-catalogue.js'),b'  const rows =',b'  function validate(')==block(new('awards-catalogue.js'),b'  const rows =',b'  const fundingEnabled =')
assert new('sw.js').replace(b'imi-v76',b'imi-v75',1)==old('sw.js')
assert (out/'before-default.json').read_bytes()==(out/'release-default.json').read_bytes()
for name in ['release-results.json','release-ui-display.json']:
 r=json.loads((out/name).read_text(encoding='utf8'));assert r['status']=='PASS'
 for f,h in r['source'].items():assert sha(Path(f).read_bytes())==h,f
catalogue=json.loads(subprocess.check_output(['node','-e',"global.window={};global.location={search:'?lg02funding=1&lg10awards=1&lg01a=1'};require('./awards-catalogue.js');console.log(JSON.stringify(window.AwardsCatalogue.funding.rows))"],text=True))
designRows=[]
for line in Path('docs/plan/long-game/LG-02E-speed-funding-design.md').read_text(encoding='utf8').splitlines():
 if line.startswith('| `lg02e-'):
  cells=line.split('|');name,desc=cells[2].strip().split('. ',1);designRows.append({'id':cells[1].strip().strip('`'),'name':name,'desc':desc,'tier':2,'kind':'D','amount':5})
assert catalogue==designRows and len(catalogue)==7
write('exact-seven.json',{'approvedDesignOrderCopyTierD5Equal':True,'rows':catalogue,'newDB':35,'namedTotal':150,'maxIncomePoints':7,'maxAwardFactor':1.85})
r=subprocess.run(['node','--test','tests/speed-funding-awards.test.cjs'],capture_output=True,text=True,encoding='utf8');(out/'focused-tests.txt').write_text(r.stdout+r.stderr,encoding='utf8');assert r.returncode==0
# Compare only task-relevant proof inputs against the earlier design seal; this is reused evidence.
design=json.loads(Path('docs/plan/long-game/evidence/LG-02/speed-funding-design-r1/inputs-before.json').read_text(encoding='utf-8-sig'))
reused={v['path']:sha(Path(v['path']).read_bytes())==v['sha256'] for v in design['inputs'] if v['path'] in owners}
write('final-source.json',source);write('syntax.json',syntax);write('unchanged-owners.json',owners)
write('taskpatch-check.json',{'temporaryCopyRetained':str(td),'coreAutocrlfFalseCheckAndApply':True,'exactBytes':matches,'indexEqual':True,'unchangedLineBytesPreserved':True,'swVersionOnly':True})
write('reused-source-qualification.json',{'qualification':'Current proof-owner hash comparison to design seal only. No old whole-file Ops/Rewards runtime claim after new edits. Old reward/Lamp behaviors reused only for unchanged regions and their documented isolated limits.','proofInputMatches':reused})
write('verification.json',{'status':'CANDIDATE_READY_FOR_DIFFERENT_MODEL_REVIEW','productFiles':products,'syntax':True,'focusedTests':4,'defaultFiveSimulatedMinuteReportMetaErrorsByteEqual':True,'actualLiveOwner':'release-results.json','historicalRetry':'release-held-db.json and release-retry-db.json','initialACKAndPreparedRecovery':'release-ui-display.json','actual360ScreensPersonallyRead':True,'unchangedOwners':len(owners),'original68AndAssignmentsAndLG10SnapshotUnchanged':True,'exactRawPatch':True,'indexEqual':True,'cache':'imi-v76','noAcceptance':True,'speedImplemented':False,'writerLease':'released','children':0})
(out/'final-status.txt').write_bytes(subprocess.check_output(['git','status','--short']))
print(json.dumps({'rawPatchFiles':len(matches),'syntaxFiles':len(syntax),'protectedOwners':len(owners),'indexEqual':True,'defaultByteEqual':True,'originalBlocksUnchanged':True}))
