import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const out='docs/plan/long-game/evidence/LG-02/implementation-b2-r2';
const suffix=process.argv[2]==='final'?'-final':'';
const write=(name,value)=>fs.writeFileSync(out+'/'+name.replace(/\.json$/,suffix+'.json'),JSON.stringify(value,null,2)+'\n',{flag:'wx'});
const exclusions=['capturedAt','sourceCommit','sourceHashes','url','wallSeconds'];
const canonical=file=>{const value=JSON.parse(fs.readFileSync(file));for(const k of exclusions)delete value[k];return JSON.stringify(value,null,2)+'\n';};
const pairs=[];
function compare(label,before,after) {
  const a=canonical(out+'/'+before),b=canonical(out+'/'+after);
  const row={label,before,after,equal:a===b,beforeSha256:createHash('sha256').update(a).digest('hex'),afterSha256:createHash('sha256').update(b).digest('hex')};pairs.push(row);if(!row.equal)process.exitCode=1;
}
compare('fresh pre-edit default','before-hour.raw.json',suffix?'after-hour-final.raw.json':'after-hour-first.raw.json');
const env={...process.env,PUPPETEER_MODULE:'C:/Users/arran/AppData/Local/Temp/pp/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js',GUARD:'240',BALANCE_TUNE:'{}'};
for(const [label,flags]of [['lg01','lg01a=1'],['both','lg01a=1&lg02=1']]) {
  for(const [version,url]of [['frozen','tools/long-game/fixture-lg02-b2-r2-20261013/before-balance-r2.html'],['current','tools/balance.html']]) {
    const output=out+'/'+label+'-'+version+suffix+'.raw.json';
    if(fs.existsSync(output))throw Error('Raw parity collision');
    const args=['tools/balance.mjs','60','active','collect','1','180','{}','--session','60','--commit','7d1e3863c10f642b4ed786786ddda8315038ab9c','--url','http://127.0.0.1:8312/'+url+'?'+flags,'--output',output];
    const run=spawnSync(process.execPath,args,{encoding:'utf8',env,maxBuffer:5*1024*1024});
    write(label+'-'+version+'-command.json',{args,env:{GUARD:env.GUARD,BALANCE_TUNE:env.BALANCE_TUNE,PUPPETEER_MODULE:env.PUPPETEER_MODULE},exit:run.status,stdout:run.stdout,stderr:run.stderr});
    if(run.status!==0)process.exitCode=1;
  }
  compare(label+' opt-in no Vault frozen replay',label+'-frozen'+suffix+'.raw.json',label+'-current'+suffix+'.raw.json');
}
write('parity-results.json',{exclusions,pairs,coverage:'default uses fresh pre-edit BEFORE; opt-in controls replay frozen pre-edit code after edits, without native-Core or pacing claims'});
console.log(JSON.stringify(pairs));
