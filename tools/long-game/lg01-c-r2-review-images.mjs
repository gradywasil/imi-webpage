// Contact sheets retain every screenshot for visual review; originals stay intact.
import { execFileSync } from 'node:child_process';
execFileSync('python',['-c',String.raw`
import json, pathlib, sys
from PIL import Image, ImageOps, ImageDraw
base=pathlib.Path('docs/plan/long-game/evidence/LG-01/implementation-c-r2')
final=len(sys.argv)>1 and sys.argv[1]=='final'
items=json.loads((base/('screens-final.receipt.json' if final else 'screens.receipt.json')).read_text())
if not final: items += [dict(path=i['file'],name=pathlib.Path(i['file']).stem) for i in json.loads((base/'media-report.json').read_text())['images']]
out=base/('review-final' if final else 'review'); out.mkdir(exist_ok=True)
pages=[]
for start in range(0,len(items),6):
    page=Image.new('RGB',(1440,2100),'#eee8d9'); draw=ImageDraw.Draw(page)
    group=items[start:start+6]
    for j,item in enumerate(group):
        x=(j%3)*480; y=(j//3)*1050
        draw.text((x+8,y+8),item['name'],fill='black')
        img=Image.open(item['path']).convert('RGB')
        img.thumbnail((472,1018))
        page.paste(img,(x+(480-img.width)//2,y+28))
    target=out/f'sheet-{start//6+1:02}.png'
    if target.exists(): raise RuntimeError('Exclusive review sheet already exists')
    page.save(target); pages.append(dict(path=str(target),items=[i['path'] for i in group]))
(out/'manifest.json').write_text(json.dumps(pages,indent=2))
print(f'{len(items)} originals in {len(pages)} review sheets')
`,process.argv[2] || 'initial'],{stdio:'inherit'});
