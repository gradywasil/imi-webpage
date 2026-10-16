import fs from 'node:fs';
import {spawnSync,execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const out='docs/plan/long-game/evidence/LG-02/repair-runtime-a-r2', lane=process.argv[2], suffix=process.argv[3]||'';
if(!['','-final'].includes(suffix))throw Error('Invalid output suffix');
const sha=b=>createHash('sha256').update(b).digest('hex');
const write=(p,v)=>fs.writeFileSync(out+'/'+p,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
const env={...process.env,PUPPETEER_MODULE:'C:/Users/arran/AppData/Local/Temp/pp/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js',CHROME:'C:/Program Files/Google/Chrome/Application/chrome.exe',GUARD:'240',LG01_URL:'http://127.0.0.1:8181',LG01_RUN:'qa-lg02-a-repair-r2-20261013',REPAIR_PHASE:'qa-lg02-a-repair-r2-20261013'};
env.LG01_RUN+=suffix;env.REPAIR_PHASE+=suffix;
if(lane==='seal') {
  const prior=JSON.parse(fs.readFileSync('docs/plan/long-game/evidence/LG-02/qa-runtime-a-r1/start-audit.json'));
  const paths=[...new Set([...Object.keys(prior.inputs),'tools/balance.mjs','tools/bot.js','tools/long-game.mjs','tools/long-game-bot.js'])];
  fs.mkdirSync(out+'/inputs',{recursive:true});
  const entries={};
  for(const p of paths){const b=fs.readFileSync(p);entries[p]=sha(b);const target=out+'/inputs/'+p;fs.mkdirSync(target.slice(0,target.lastIndexOf('/')),{recursive:true});fs.writeFileSync(target,b,{flag:'wx'});}
  for(const p of ['ops.js','pickups.js','tour.js','sw.js'])if(entries[p]!==sha(fs.readFileSync(out+'/before/'+p)))throw Error('Parent frozen source mismatch '+p);
  write('start-seal.json',{at:new Date().toISOString(),branch:execFileSync('git',['branch','--show-current'],{encoding:'utf8'}).trim(),status:execFileSync('git',['status','--short','--untracked-files=no'],{encoding:'utf8'}),indexSha:sha(execFileSync('git',['ls-files','--stage'])),entries});
} else {
  const args=lane==='tests'?['--import','./tools/long-game/lg02-a-repair-output-preload.mjs','--test','--test-concurrency=1',...fs.readdirSync('tests').filter(p=>p==='economy.test.cjs'||p.startsWith('rewards-')||p.startsWith('vault-startup-')).map(p=>'tests/'+p)]:lane==='red'?['--test','tests/vault-startup-strictness.test.cjs']:['tools/balance.mjs','60','active','collect','1','180','--url',env.LG01_URL+'/tools/balance.html','--output',out+'/'+lane+'.raw.json'];
  if(!['tests','red','before-hour','after-hour'].includes(lane))throw Error('Unknown lane');
  if(fs.existsSync(out+'/'+lane+suffix+'.command.json')||fs.existsSync(out+'/'+lane+'.raw.json'))throw Error('Output exists');
  const sourceHashes=Object.fromEntries(['ops.js','pickups.js','tour.js','sw.js','tools/balance.mjs','tests/vault-startup-strictness.test.cjs'].filter(p=>fs.existsSync(p)).map(p=>[p,sha(fs.readFileSync(p))]));
  const r=spawnSync(process.execPath,args,{env,encoding:'utf8',maxBuffer:12*1024*1024});
  write(lane+suffix+'.command.json',{at:new Date().toISOString(),args,env:Object.fromEntries(['PUPPETEER_MODULE','CHROME','GUARD','LG01_URL','LG01_RUN','REPAIR_PHASE'].map(k=>[k,env[k]])),sourceHashes,exit:r.status,stdout:r.stdout,stderr:r.stderr});
  console.log(JSON.stringify({lane,exit:r.status,tail:r.stdout?.slice(-1000),stderr:r.stderr}));process.exitCode=r.status??1;
}
