const fs=require('node:fs'),cp=require('node:child_process'),crypto=require('node:crypto');
const out='docs/plan/long-game/evidence/LG-02/tutorial-repair-b2-r3',phase=process.argv[2];
const output=out+'/'+phase+'-hour.raw.json';
if(!['before','after','after-final'].includes(phase)||fs.existsSync(output))throw Error('Invalid phase or output collision');
const env={...process.env,PUPPETEER_MODULE:'C:/Users/arran/AppData/Local/Temp/pp/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js',GUARD:'240',BALANCE_TUNE:'{}'};
const args=['tools/balance.mjs','60','active','collect','1','180','{}','--session','60','--commit','7d1e3863c10f642b4ed786786ddda8315038ab9c','--url','http://127.0.0.1:8313/tools/balance.html','--output',output];
const started=new Date().toISOString(),run=cp.spawnSync(process.execPath,args,{env,encoding:'utf8',maxBuffer:5*1024*1024});
fs.writeFileSync(out+'/'+phase+'-parity-command.json',JSON.stringify({started,finished:new Date().toISOString(),executable:process.execPath,args,env:{PUPPETEER_MODULE:env.PUPPETEER_MODULE,GUARD:env.GUARD,BALANCE_TUNE:env.BALANCE_TUNE},exit:run.status,stdout:run.stdout,stderr:run.stderr},null,2)+'\n',{flag:'wx'});
console.log(run.stdout);console.error(run.stderr);process.exitCode=run.status||0;
if(phase.startsWith('after')){
 const exclusions=['capturedAt','sourceCommit','sourceHashes','url','wallSeconds'];
 const reports=['before',phase].map(p=>JSON.parse(fs.readFileSync(out+'/'+p+'-hour.raw.json')));
 const canonical=reports.map(r=>{const copy={...r};for(const k of exclusions)delete copy[k];return JSON.stringify(copy);});
 const result={exclusions,complete:reports.map(r=>r.complete),equal:canonical[0]===canonical[1],sha256:canonical.map(s=>crypto.createHash('sha256').update(s).digest('hex'))};
 fs.writeFileSync(out+'/'+phase+'-parity-results.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(result);
 if(!result.equal||reports.some(r=>!r.complete))process.exitCode=1;
}
