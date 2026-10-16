from pathlib import Path
import hashlib,json,subprocess

out=Path('docs/plan/long-game/evidence/LG-09/commission-board-r1')
files=['ops.js','rewards.js','vault-save-gate.js','index.html','classic.html','tools/balance.html','sw.js','core.js','economy.js','layers.js','estate.js','archive.js','production-goal.js','training-pool.js','automation.js','auto-challenge.js','folio.js','works.js','works-play.js','minigame-progression.js','ops.css']
rows={}
for f in files:
 b=Path(f).read_bytes(); rows[f]={'sha256':hashlib.sha256(b).hexdigest(),'bytes':len(b)}
 target=out/'dirty-before'/f; target.parent.mkdir(parents=True,exist_ok=True)
 with target.open('xb') as stream: stream.write(b)
with (out/'dirty-before-source.json').open('x') as stream: json.dump(rows,stream,indent=2)
with (out/'dirty-before-status.txt').open('xb') as stream: stream.write(subprocess.check_output(['git','status','--short']))
text=Path('tools/long-game/lg08l-default.cjs').read_text().replace("LG-08/auto-challenge-r1","LG-09/commission-board-r1")
with Path('tools/long-game/lg09g-default.cjs').open('x') as stream: stream.write(text)
