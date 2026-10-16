from pathlib import Path
import json,hashlib,difflib,subprocess,tempfile,re

out=Path('docs/plan/long-game/evidence/LG-09/first-play-r1')
before=json.loads((out/'dirty-before.json').read_text(encoding='utf-8'))
sha=lambda b:hashlib.sha256(b).hexdigest()
changed=[f for f in before if Path(f).read_bytes()!=(out/'before'/f).read_bytes()]
products=[f for f in changed if not f.startswith('docs/')]+['works-play.js']
allowed={'works.js','ops.js','rewards.js','layers.js','folio.js','archive.js','index.html','classic.html','tools/balance.html','sw.js','docs/plan/long-game/LG-09C-first-play.md'}
assert set(changed)<=allowed
source={f:{'bytes':len(Path(f).read_bytes()),'sha256':sha(Path(f).read_bytes())} for f in products}
for f in products:
    p=out/'source'/f;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(Path(f).read_bytes())
(out/'final-source.json').write_text(json.dumps(source,indent=2))
readonly={f:sha(Path(f).read_bytes())==before[f]['sha256'] for f in before if f not in changed}
assert all(readonly.values());(out/'readonly-preservation.json').write_text(json.dumps(readonly,indent=2))
endings={}
for f in changed:
    if f.endswith('.md'):continue
    a=(out/'before'/f).read_bytes();b=Path(f).read_bytes()
    mode=lambda x:'CRLF' if x.count(b'\r\n')==x.count(b'\n') else 'LF' if b'\r' not in x else 'mixed'
    endings[f]={'before':mode(a),'final':mode(b)};assert mode(a)==mode(b)
(out/'line-endings.json').write_text(json.dumps(endings,indent=2))
runtime=Path('works-play.js').read_text(encoding='utf-8')
manifest=json.loads(re.search(r'  const manifest = (.*);',runtime).group(1))
(out/'runtime-manifest.json').write_text(json.dumps(manifest,indent=2))
design=Path('docs/plan/long-game/evidence/LG-09/first-play-design-r1')
authority=Path('docs/plan/long-game/evidence/LG-09/owner-approval-first-play/receipt.json')
descriptor=json.loads((design/'proposed-release-descriptor.json').read_text(encoding='utf-8'))
assert sha((design/'manifest.json').read_bytes())==descriptor['manifestFileSha256']
assert sha(manifest['body'].encode())==descriptor['bodySha256']
(out/'release-authority.json').write_text(json.dumps({'approvalReceipt':json.loads(authority.read_text(encoding='utf-8')),'approvalReceiptSha256':sha(authority.read_bytes()),'frozenManifestFileSha256':sha((design/'manifest.json').read_bytes()),'frozenDescriptorFileSha256':sha((design/'proposed-release-descriptor.json').read_bytes()),'fixedDescriptor':descriptor,'historicalLabelsPreserved':True},indent=2))
old=(out/'before/ops.js').read_text(encoding='utf-8');new=Path('ops.js').read_text(encoding='utf-8')
def function(text,name):
    a=text.index('  function '+name+'(');b=text.find('\n  function ',a+1);return text[a:b if b!=-1 else len(text)]
offlineEqual=function(old,'simulateAway')==function(new,'simulateAway').replace('activeWork()?.route(S,i,ch,c)','worksDemo?.route(S,i,ch,c)')
assert offlineEqual
anchors={}
for f,terms in {
    'ops.js':['const activeWork','const generatedLetter','return m *','const holdRate','const rewardBasis','return sum + factor','function simulateAway','const speedSum','const ordinary = c -','function doPrint','worksPlayCommit','function worksFloors'],
    'works.js':['window.WorksMaterial','WorksMaterial.consume'],
    'works-play.js':['const identity','function current','function factor','function plan','function route','function proposal',"r.action==='sign'"],
    'rewards.js':['window.WorksPlay?.retained','let worksPlayWaiting','if (worksPlayWaiting)'],
    'layers.js':['window.WorksPlay?.retained','if (next.meta.works)']}.items():
    lines=Path(f).read_text(encoding='utf-8').splitlines();anchors[f]={term:[i+1 for i,line in enumerate(lines) if term in line] for term in terms}
qualification={'finalRawHashes':{f:v['sha256'] for f,v in source.items()},'anchors':anchors,'offlineOwnerIdenticalToDirtyBeforeExceptConsumerRoute':offlineEqual,'freshNative':'verified-results.json; 35 checks; raw loaded hashes match final-source','freshPure':'pure-source-checks.json; 15 checks','sourceQualified':['held input invokes existing press','Lucky and Golden Keys second rolls use generatedLetter','automatic typistSpeed feeds live cadence, away speedSum, display and rewardBasis; only Works family factor added','startingRoom factor reads retained projected room once','manual holdRate and Archive own integration have no Works multiplier','Imprint and Estate use Layers validation/finishRoom retention hooks'],'reusedAcceptedEvidence':['LG-09A-accepted.md','LG-09A-works-review-result-r1.md','evidence/LG-09/works-review-r1/estate-path.json','evidence/LG-09/works-demo-r1/verified-results.json'],'reuseLimits':'Prior native material/away/reset results establish accepted shared-path behavior, not a rerun against changed source. Offline cap/phase/efficiency owner is text-identical apart from active consumer routing. Shared debit is freshly pure checked for both demo and permanent bills. Fresh permanent reset is Printing only.'}
(out/'source-qualification.json').write_text(json.dumps(qualification,indent=2))
native=json.loads((out/'verified-results.json').read_text(encoding='utf-8'));assert native['status']=='PASS'
for f,h in native['hashes'].items():assert h==source[f]['sha256']
assert all(not native[k]['pageScroll'] and native[k]['active'] and native[k]['pageWidth']==360 and all(b['height']>=40 for b in native[k]['buttons']) for k in native if k.endswith('-fit'))
assert native['pixel-continue-visible'] and native['classic-continue-visible'] and native['continueAction']
(out/'image-inspection.json').write_text(json.dumps({'openedBy':'implementation agent','images':[f'verified-{ed}-{state}-360.png' for ed in ['pixel','classic'] for state in ['work','signature','playbill','playbill-continue']],'findings':'Final active rendered panes inspected in both editions at360x560; work source/progress/missing stock visible; signature copy and sign action fit; Playbill copy visible and Continue reachable by internal pane scroll, with no page overflow and>=40px actions. Parent should open final images independently.','low':True,'reducedMotion':True},indent=2))
helpers=[p.as_posix() for p in Path('tools/long-game').glob('lg09c-*')]
files=changed+['works-play.js']+helpers
patch=[]
for f in files:
    old=(out/'before'/f).read_bytes().decode('utf-8') if f in before else ''
    new=Path(f).read_bytes().decode('utf-8');patch.extend(difflib.unified_diff(old.splitlines(keepends=True),new.splitlines(keepends=True),fromfile='a/'+f if f in before else '/dev/null',tofile='b/'+f))
(out/'task.patch').write_bytes(''.join(patch).encode('utf-8'))
with tempfile.TemporaryDirectory(prefix='lg09c-patch-') as tmp:
    for f in changed:
        p=Path(tmp)/f;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes((out/'before'/f).read_bytes())
    r=subprocess.run(['git','-c','core.autocrlf=false','apply','--no-index','--whitespace=nowarn',str((out/'task.patch').resolve())],cwd=tmp,capture_output=True,text=True)
    checks={'applyExit':r.returncode,'stdout':r.stdout,'stderr':r.stderr,'files':{f:Path(tmp,f).exists() and Path(tmp,f).read_bytes()==Path(f).read_bytes() for f in files}}
    (out/'taskpatch-check.json').write_text(json.dumps(checks,indent=2));assert r.returncode==0 and all(checks['files'].values()),checks
(out/'final-status.txt').write_bytes(subprocess.check_output(['git','status','--short']))
print(f'{len(products)} final product files; {len(files)}-file exact task patch; {len(readonly)} captured read-only files preserved')
