from pathlib import Path
import hashlib,json,difflib,tempfile,subprocess
out=Path('docs/plan/long-game/evidence/LG-10/awards-contrast-r2')
h=lambda b:hashlib.sha256(b).hexdigest()
original=json.loads(Path('docs/plan/long-game/evidence/LG-10/awards-r1/final-source.json').read_text())
r={'sevenUnchanged':{},'files':{},'rawPatchReconstruction':{},'swVersionOnly':False}
for f,v in original.items():
 if f!='sw.js':
  actual=h(Path(f).read_bytes());r['sevenUnchanged'][f]={'sha256':actual,'expected':v['sha256'],'equal':actual==v['sha256']};assert actual==v['sha256']
patch=b''
for f in ['ops.css','sw.js']:
 before=(out/'before'/f).read_bytes();after=Path(f).read_bytes();p=out/'final'/f;p.parent.mkdir(exist_ok=True);p.write_bytes(after)
 r['files'][f]={'beforeSha256':h(before),'finalSha256':h(after),'beforeBytes':len(before),'finalBytes':len(after),'beforeCRLF':before.count(b'\r\n'),'finalCRLF':after.count(b'\r\n')}
 patch+=b''.join(difflib.diff_bytes(difflib.unified_diff,before.splitlines(keepends=True),after.splitlines(keepends=True),fromfile=('a/'+f).encode(),tofile=('b/'+f).encode()))
r['swVersionOnly']=(out/'before/sw.js').read_bytes().replace(b'imi-v72',b'imi-v73')==Path('sw.js').read_bytes();assert r['swVersionOnly']
(out/'task.patch').write_bytes(patch)
tmp=Path(tempfile.mkdtemp(prefix='lg10b-contrast-r2-patch-'));r['reconstructionDirectory']=str(tmp)
for f in ['ops.css','sw.js']:(tmp/f).write_bytes((out/'before'/f).read_bytes())
patchpath=(out/'task.patch').resolve()
for args in [['--check'],[]]:subprocess.run(['git','-c','core.autocrlf=false','apply',*args,str(patchpath)],cwd=tmp,check=True)
for f in ['ops.css','sw.js']:
 r['rawPatchReconstruction'][f]=(tmp/f).read_bytes()==Path(f).read_bytes();assert r['rawPatchReconstruction'][f]
r['swSyntax']=subprocess.run(['node','--check','sw.js'],capture_output=True,text=True).returncode==0;assert r['swSyntax']
r['classicImageByteEqual']=(out/'before-classic-awards-360.png').read_bytes()==(out/'after-classic-awards-360.png').read_bytes()
for phase in ['before','after']:
 d=json.loads((out/f'{phase}-display.json').read_text());assert d['status']=='PASS';r[phase+'Fit']=d['fits']
r['status']='CANDIDATE COMPLETE; visual recheck pending';r['writerLease']='released';r['acceptance']=False
(out/'result.json').write_text(json.dumps(r,indent=2)+'\n')
print(json.dumps(r['files'],indent=2));print('classic image byte equality',r['classicImageByteEqual'])
