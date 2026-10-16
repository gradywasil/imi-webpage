import { readFile, writeFile, readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import vm from 'node:vm';
const base='docs/plan/long-game/evidence/LG-02/implementation-a';
const changed=['vault-save-gate.js','rewards.js','economy.js','core.js','app.js','classic.js','pickups.js','tour.js','pixel-fx.js','classic-fx.js','ops.js','sw.js'];
const syntax=[];
for(const path of changed) {const run=spawnSync(process.execPath,['--check',path],{encoding:'utf8'});syntax.push({path,exit:run.status,stdout:run.stdout,stderr:run.stderr});}
for(const path of ['index.html','classic.html','tools/balance.html']) {
  let i=0;for(const match of (await readFile(path,'utf8')).matchAll(/<script>([\s\S]*?)<\/script>/g)) {new vm.Script(match[1],{filename:path+':inline-'+(++i)});syntax.push({path,inline:i,exit:0});}
}
await writeFile(base+'/syntax.json',JSON.stringify(syntax,null,2),{flag:'wx'});
if(syntax.some(s=>s.exit!==0))throw Error('Syntax failed');
const tests=(await readdir('tests')).filter(p=>p==='economy.test.cjs'||p.startsWith('rewards-')||p==='vault-startup-gate.test.cjs').map(p=>'tests/'+p);
const args=['--import','./tools/long-game/lg02-a-output-preload.mjs','--test','--test-concurrency=1',...tests];
const run=spawnSync(process.execPath,args,{encoding:'utf8',env:{...process.env,LG01_URL:'http://127.0.0.1:8173',LG01_RUN:'lg02-a-implementation-r1-20261012',REPAIR_PHASE:'qa-lg02-a-implementation-r1-20261012'},maxBuffer:10*1024*1024});
await writeFile(base+'/regressions-r1.json',JSON.stringify({args,env:{PUPPETEER_MODULE:process.env.PUPPETEER_MODULE,CHROME:process.env.CHROME,LG01_URL:'http://127.0.0.1:8173',LG01_RUN:'lg02-a-implementation-r1-20261012',REPAIR_PHASE:'qa-lg02-a-implementation-r1-20261012'},exit:run.status,stdout:run.stdout,stderr:run.stderr},null,2),{flag:'wx'});
console.log(run.stdout);console.error(run.stderr);process.exitCode=run.status??1;
