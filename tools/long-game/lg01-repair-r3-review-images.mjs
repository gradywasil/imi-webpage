// Review sheets only; every tile maps to an unchanged original and its SHA-256.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const base='docs/plan/long-game/evidence/LG-01/repair-runtime-r3';
const mode=process.argv[2]||'current';
if(!['current','held'].includes(mode))throw Error('Invalid review mode');
const review=mode==='held'?'review-held':'review-settled';
const screens=JSON.parse(await readFile(base+(mode==='held'?'/held-final.json':'/screens-settled.json'),'utf8'));
const media=mode==='current'?JSON.parse(await readFile(base+'/media-report-final3.json','utf8')):{images:[]};
const groups=new Map();
for(const s of screens){const key=s.name.replace(/-\d+x\d+|-(?:390|360)-2(?=-(?:top|bottom))/g,'');if(!groups.has(key))groups.set(key,[]);groups.get(key).push(s.path);}
for(const s of media.images){const key=s.file.replace(/-\d+x\d+\.png$/, '').split('/').at(-1);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(s.file);}
await mkdir(base+'/'+review,{recursive:true});
const manifest=[];
for(const[name,files]of groups){
  const output=base+'/'+review+'/'+name+'.png';
  const script=`import json,sys\nfrom PIL import Image,ImageDraw\na=json.loads(sys.stdin.read());tiles=[]\nfor f in a['files']:\n im=Image.open(f).convert('RGB');im.thumbnail((390,800));tiles.append((f,im))\nout=Image.new('RGB',(390*len(tiles),max(im.height for _,im in tiles)+40),'#eeeeee');d=ImageDraw.Draw(out)\nfor i,(f,im) in enumerate(tiles):\n out.paste(im,(390*i,40));d.text((390*i+4,6),f.split('/')[-1],fill='black')\nout.save(a['output'])`;
  const result=spawnSync('python',['-c',script],{input:JSON.stringify({files,output}),encoding:'utf8'});if(result.status!==0)throw Error(result.stderr);
  manifest.push({name,output,tiles:await Promise.all(files.map(async(file)=>({file,sha256:createHash('sha256').update(await readFile(file)).digest('hex')})))});
}
await writeFile(base+'/'+review+'/manifest.json',JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
console.log(manifest.map(m=>m.output).join('\n'));
