// Serial immutable suites, with contemporaneous command and output receipts.
const fs=require('node:fs'),cp=require('node:child_process'),crypto=require('node:crypto');
const out='docs/plan/long-game/evidence/LG-02/qa-runtime-b2-r1',run=process.argv[2];
if(!/^[a-z0-9-]+$/.test(run||''))throw Error('Exclusive run label required');
const write=(name,value)=>fs.writeFileSync(out+'/'+run+'-'+name+'.json',JSON.stringify(value,null,2)+'\n',{flag:'wx'});
const sha=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const before=JSON.parse(fs.readFileSync(out+'/before-inventory.json','utf8'));
const files=[...fs.readdirSync('tests').filter(n=>n.endsWith('.test.cjs')).map(n=>'tests/'+n),'core.js','ops.js','rewards.js','vault.js','tour.js','sw.js'];
for(const f of files)if(sha(f)!==before.identities[f].sha256)throw Error('Source drift: '+f);
const env={...process.env,PUPPETEER_MODULE:'C:/Users/arran/AppData/Local/Temp/pp/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js',GUARD:'240',LG01_URL:'http://127.0.0.1:8314',LG01_RUN:'lg02-b2-qa-r1-20261013-'+run,REPAIR_PHASE:'qa-lg02-b2-qa-r1-20261013-'+run,LG02_B2_R2_TEST_RUN:'qa-'+run,LG02_B2_R3_RUN:'qa-'+run};
const args=['--require','./tools/long-game/lg02-b2-qa-r1-output.cjs','--import','./tools/long-game/lg02-b2-qa-r1-transport.mjs','--test','--test-concurrency=1',...files.filter(f=>f.startsWith('tests/')).sort()];
const started=new Date().toISOString();
write('command',{started,executable:process.execPath,args,env:Object.fromEntries(Object.entries(env).filter(([k])=>['PUPPETEER_MODULE','GUARD','LG01_URL','LG01_RUN','REPAIR_PHASE','LG02_B2_R2_TEST_RUN','LG02_B2_R3_RUN'].includes(k))),sources:Object.fromEntries(files.map(f=>[f,sha(f)])),transport:'Only hardcoded r3 origin 8313 relocated to owned 8314; test inputs/assertions/timeouts/Chrome options unchanged.'});
const result=cp.spawnSync(process.execPath,args,{env,encoding:'utf8',maxBuffer:32*1024*1024});
write('result',{started,finished:new Date().toISOString(),exit:result.status,signal:result.signal,error:result.error?.message,stdout:result.stdout,stderr:result.stderr});
console.log(JSON.stringify({exit:result.status,summary:result.stdout?.split('\n').filter(l=>/^# (tests|pass|fail|skipped|duration)/.test(l))}));process.exitCode=result.status||0;
