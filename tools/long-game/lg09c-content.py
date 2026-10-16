from pathlib import Path
import json
m=json.loads(Path('docs/plan/long-game/evidence/LG-09/first-play-design-r1/manifest.json').read_text())
d=json.loads(Path('docs/plan/long-game/evidence/LG-09/first-play-design-r1/proposed-release-descriptor.json').read_text())
template=Path('tools/long-game/lg09c-play-template.txt').read_text()
manifest={k:m[k] for k in ['version','contentId','title','body','bodySha256','orderedTokens','orderedTokensSha256','perLetterBill']}
manifest.update(editions=100,tokenCount=200,letterCount=1000,totalTokens=20000,totalLetters=100000)
Path('works-play.js').write_bytes(template.replace('__MANIFEST__',json.dumps(manifest,separators=(',',':'))).replace('__DESCRIPTOR__',json.dumps(d,separators=(',',':'))).encode())
