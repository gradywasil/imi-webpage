from pathlib import Path
import difflib,json,hashlib
out=Path('docs/plan/long-game/evidence/LG-09/works-demo-r1');before=json.loads((out/'dirty-before.json').read_text());proof={}
for f in before:
 old=(out/'before'/f).read_bytes();new=Path(f).read_bytes()
 if old==new:continue
 a=old.decode('utf-8').splitlines(keepends=True);b=new.decode('utf-8').splitlines(keepends=True);result=[]
 for tag,i,j,k,l in difflib.SequenceMatcher(a=[x.rstrip('\r\n') for x in a],b=[x.rstrip('\r\n') for x in b],autojunk=False).get_opcodes():
  if tag=='equal':result.extend(a[i:j])
  else:
   for q,line in enumerate(b[k:l]):
    base=a[min(i+q,len(a)-1)];eol='\r\n' if base.endswith('\r\n') else '\n';result.append(line.rstrip('\r\n')+(eol if line.endswith('\n') else ''))
 restored=''.join(result).encode('utf-8');assert restored.replace(b'\r\n',b'\n')==new.replace(b'\r\n',b'\n')
 Path(f).write_bytes(restored);proof[f]={'testedSha256':hashlib.sha256(new).hexdigest(),'finalSha256':hashlib.sha256(restored).hexdigest(),'normalizedSha256':hashlib.sha256(restored.replace(b'\r\n',b'\n')).hexdigest(),'onlyLineEndingsChangedSinceVerified':True}
(out/'line-ending-source-equivalence.json').write_text(json.dumps(proof,indent=2))
