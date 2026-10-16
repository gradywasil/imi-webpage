const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto');
const out='docs/plan/long-game/evidence/LG-02/qa-runtime-b2-r1',fixture='tools/long-game/fixture-lg02-b2-qa-r1-20261013',old='docs/plan/long-game/evidence/LG-02/implementation-b2-r2';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),write=(f,v)=>fs.writeFileSync(out+'/'+f,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
fs.mkdirSync(fixture+'/source/tools',{recursive:true});
const seal=JSON.parse(fs.readFileSync(old+'/before/source-seal.json')),sources={};
for(const f of ['vault-save-gate.js','rewards.js','vault.js','economy.js','world.js','ops.js','tools/bot.js']){
  const bytes=fs.readFileSync(old+'/before/source/'+f);if(sha(bytes)!==seal.identities[f].sha256)throw Error('Frozen source drift: '+f);
  fs.writeFileSync(fixture+'/source/'+f,bytes,{flag:'wx'});sources[f]=sha(bytes);
}
const html=fs.readFileSync('tools/long-game/fixture-lg02-b2-r2-20261013/before-balance-r2.html','utf8').replaceAll('/'+old+'/before/source/','/'+fixture+'/source/');
fs.writeFileSync(fixture+'/frozen-balance.html',html,{flag:'wx'});
write('parity-fixture-identity.json',{sources,htmlSha256:sha(html),basis:'Retained r2 frozen control shell; only source URLs relocated into new owned leaves. Dynamic Bot and readers retain verified unchanged current bytes.'});
const env={...process.env,PUPPETEER_MODULE:'C:/Users/arran/AppData/Local/Temp/pp/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js',GUARD:'240',BALANCE_TUNE:'{}'};
const exclusions=['capturedAt','sourceCommit','sourceHashes','url','wallSeconds'],results=[];
const canonical=r=>{const v={...r};for(const k of exclusions)delete v[k];return JSON.stringify(v,null,2)+'\n';};
for(const [label,flags]of [['default',''],['lg01','lg01a=1'],['both','lg01a=1&lg02=1']]){
  const pair=[];
  for(const [version,page]of [['frozen',fixture+'/frozen-balance.html'],['current','tools/balance.html']]){
    const prefix='parity-'+label+'-'+version,output=out+'/'+prefix+'.raw.json';if(fs.existsSync(output))throw Error('Output collision');
    const args=['--require','./tools/long-game/lg02-b2-qa-r1-output.cjs','tools/balance.mjs','60','active','collect','1','180','{}','--session','60','--commit','7d1e3863c10f642b4ed786786ddda8315038ab9c','--url','http://127.0.0.1:8314/'+page+(flags?'?'+flags:''),'--output',output],started=new Date().toISOString();
    write(prefix+'-command.json',{started,executable:process.execPath,args,env:{PUPPETEER_MODULE:env.PUPPETEER_MODULE,GUARD:env.GUARD,BALANCE_TUNE:env.BALANCE_TUNE},disk:Object.fromEntries(['ops.js','rewards.js','vault.js','tour.js','sw.js','tools/bot.js','tools/balance.html'].map(f=>[f,sha(fs.readFileSync(f))]))});
    const r=cp.spawnSync(process.execPath,args,{env,encoding:'utf8',maxBuffer:8*1024*1024});write(prefix+'-result.json',{started,finished:new Date().toISOString(),exit:r.status,stdout:r.stdout,stderr:r.stderr});
    const raw=JSON.parse(fs.readFileSync(output));pair.push({version,complete:raw.complete,rawSha256:sha(fs.readFileSync(output)),canonicalSha256:sha(canonical(raw)),sourceHashes:raw.sourceHashes,exit:r.status});
  }
  results.push({label,pair,equal:pair[0].canonicalSha256===pair[1].canonicalSha256});
}
write('parity-results.json',{exclusions,results});console.log(JSON.stringify(results));if(results.some(r=>!r.equal||r.pair.some(p=>!p.complete||p.exit)))process.exitCode=1;
