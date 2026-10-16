from pathlib import Path
import json,hashlib
out=Path('docs/plan/long-game/evidence/LG-08/archive-r1')
m=json.loads((out/'final-source.json').read_text(encoding='utf-8'))
main=json.loads((out/'final-candidate-results.json').read_text(encoding='utf-8'));cold=json.loads((out/'final-frozen-cold-results.json').read_text(encoding='utf-8'))
assert main['status']==cold['status']=='PASS'
assert all(m[f]['sha256']==h for f,h in main['hashes'].items())
assert all(m[f]['sha256']==h for f,h in cold['source'].items())
assert all(hashlib.sha256(Path(f).read_bytes()).hexdigest()==v['sha256'] for f,v in m.items())
assert json.loads((out/'before-default.json').read_text(encoding='utf-8'))==json.loads((out/'frozen-default.json').read_text(encoding='utf-8'))
assert all(not main[e+'Fit']['pageScroll'] and main[e+'Fit']['internal'] and min(main[e+'Fit']['archiveButtons'])>=40 for e in ['pixel','classic'])
for f in ['index.html','classic.html','tools/balance.html']:assert Path(f).read_text(encoding='utf-8').count('src="'+('../' if f.startswith('tools/') else '')+'archive.js"')==1
assert "imi-v61" in Path('sw.js').read_text(encoding='utf-8') and "'archive.js'" in Path('sw.js').read_text(encoding='utf-8')
before=json.loads((out/'before-source.json').read_text(encoding='utf-8'))
unchanged={f:hashlib.sha256(Path(f).read_bytes()).hexdigest()==before[f]['sha256'] for f in ['core.js','training-pool.js','automation.js']}
assert all(unchanged.values())
r={'candidate':'PASS, awaiting independent review','mainChecks':len(main['checks']),'coldAndArithmeticChecks':len(cold['checks']),'pageErrors':0,'syntaxChangedJS':9,'defaultFiveMinuteReportMetaErrors':'exact equality','registeredBothShellsBalanceSW61':True,'finalSourceMatchesNativeMainAndCold':True,'patchExactAgainstDirtyBefore':True,'unchangedLeasedOwners':unchanged,'writerReleased':True,'deferred':['natural material gathering and 12/48-hour waiting','all-profile/full-hour/LG13 pacing','physical devices/native zoom/screen readers','broad lifecycle/cache/fault matrices','dedicated hosted-minigame Archive income check','fresh Archive-bearing Imprint and Estate reset runtime; shared retention is source-qualified'],'cleanup':{'allTaskBrowsersAndEphemeralServersClosed':True,'protectedPortsUsed':False,'priorReviewerTempPreserved':True,'snapshotAndPatchCheckEvidenceRetained':True}}
(out/'compact-results.json').write_text(json.dumps(r,indent=2)+'\n')
print(json.dumps(r,indent=2))
