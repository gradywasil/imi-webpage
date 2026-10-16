import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const out='docs/plan/long-game/evidence/LG-02/implementation-b2-r2';
const run=process.argv[2]||'first';if(!['first','second','third'].includes(run))throw Error('Unexpected run');
const sha=b=>createHash('sha256').update(b).digest('hex');
const write=(name,value)=>fs.writeFileSync(out+'/'+(run==='first'?'':run+'-')+name,JSON.stringify(value,null,2)+'\n',{flag:'wx'});
const product=['rewards.js','ops.js','core.js','vault.js','sw.js'],eol=[];
for(const file of product) {
  const original=fs.readFileSync(out+'/before/source/'+file),current=fs.readFileSync(file),text=current.toString('utf8');
  const crlf=original.toString('utf8').includes('\r\n');
  const normalized=Buffer.from(text.replace(/\r?\n/g,crlf?'\r\n':'\n'));
  if(!current.equals(normalized))fs.writeFileSync(file,normalized);
  eol.push({file,originalSha256:sha(original),beforeNormalizationSha256:sha(current),finalSha256:sha(normalized),originalCRLF:crlf});
}
write('line-ending-receipt.json',eol);
const afterRoot=out+'/after'+(run==='first'?'':'-'+run);
fs.mkdirSync(afterRoot+'/source',{recursive:true});
for(const file of product)fs.writeFileSync(afterRoot+'/source/'+file,fs.readFileSync(file),{flag:'wx'});
const seal=JSON.parse(fs.readFileSync(out+'/before/source-seal.json')),readonly=[];
for(const [file,record]of Object.entries(seal.identities)) {
  if(product.includes(file)||file.startsWith('tools/long-game/lg02-b2-r2-'))continue;
  readonly.push({file,before:record.sha256,current:sha(fs.readFileSync(file)),equal:record.sha256===sha(fs.readFileSync(file))});
}
write('read-only-input-preservation.json',readonly);
if(readonly.some(r=>!r.equal))throw Error('Read-only input changed');
const helpers=fs.readdirSync('tools/long-game').filter(n=>/^lg02-b2-r2-.*\.(?:mjs|cjs)$/.test(n)).map(n=>'tools/long-game/'+n);
const newTests=['tests/vault-coordinator.test.cjs','tests/vault-boundary.test.cjs','tests/vault-lifecycle.test.cjs'];
const syntax=[...product,...helpers,...newTests].map(file=>{const r=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});return {file,sha256:sha(fs.readFileSync(file)),exit:r.status,stdout:r.stdout,stderr:r.stderr};});
const syntaxRoot=out+'/syntax'+(run==='first'?'':'-'+run);fs.mkdirSync(syntaxRoot,{recursive:true});
for(const shell of ['index.html','classic.html','tools/balance.html']) {
  let number=0;
  for(const m of fs.readFileSync(shell,'utf8').matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
    if(/\bsrc=|type=["']application\//.test(m[1])||!m[2].trim())continue;
    const file=syntaxRoot+'/'+shell.replaceAll('/','-')+'-'+number+++'.js';fs.writeFileSync(file,m[2],{flag:'wx'});
    const r=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});syntax.push({shell,file,exit:r.status,stderr:r.stderr});
  }
}
write('final-syntax.json',syntax);if(syntax.some(r=>r.exit!==0))throw Error('Syntax failure');
const env={...process.env,PUPPETEER_MODULE:'C:/Users/arran/AppData/Local/Temp/pp/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js',GUARD:'240',LG01_URL:'http://127.0.0.1:8312',LG01_RUN:'lg02-b2-r2-20261013-full-'+run,REPAIR_PHASE:'qa-lg02-b2-r2-20261013-full-'+run,LG02_B2_R2_RECORD:'0',LG02_B2_R2_TEST_RUN:'full-'+run};
const args=['--require','./tools/long-game/lg02-b2-r2-output.cjs',...(run==='third'?['--import','./tools/long-game/lg02-b2-r2-wait-diagnostics.mjs']:[]),'--test','--test-concurrency=1',...fs.readdirSync('tests').filter(n=>n.endsWith('.test.cjs')).sort().map(n=>'tests/'+n)];
const r=spawnSync(process.execPath,args,{encoding:'utf8',env,maxBuffer:30*1024*1024});
write('full-tests-first.json',{args,env:{PUPPETEER_MODULE:env.PUPPETEER_MODULE,GUARD:env.GUARD,LG01_URL:env.LG01_URL,LG01_RUN:env.LG01_RUN,REPAIR_PHASE:env.REPAIR_PHASE,LG02_B2_R2_TEST_RUN:env.LG02_B2_R2_TEST_RUN},exit:r.status,stdout:r.stdout,stderr:r.stderr});
console.log(JSON.stringify({syntax:syntax.length,readonly:readonly.length,testsExit:r.status,tail:r.stdout.slice(-500)}));if(r.status)process.exitCode=1;
