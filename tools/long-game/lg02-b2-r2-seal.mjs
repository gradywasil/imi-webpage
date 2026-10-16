import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const root=process.cwd(),out='docs/plan/long-game/evidence/LG-02/implementation-b2-r2';
const sha=b=>createHash('sha256').update(b).digest('hex');
const read=f=>JSON.parse(fs.readFileSync(out+'/'+f));
const write=(f,v)=>fs.writeFileSync(out+'/'+f,JSON.stringify(v,null,2)+'\n',{flag:'wx'});
const git=(...args)=>{const r=spawnSync('git',args,{encoding:'utf8',maxBuffer:20*1024*1024});if(r.status)throw Error(r.stderr);return r.stdout;};
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(d+'/'+e.name):[d+'/'+e.name]);
const original=read('before/source-seal.json'),product=['core.js','ops.js','rewards.js','vault.js','sw.js'];
const preservation=Object.entries(original.identities).filter(([f])=>!product.includes(f)&&!f.startsWith('tools/long-game/lg02-b2-r2-')).map(([f,r])=>({file:f,before:r.sha256,after:sha(fs.readFileSync(f))}));
if(preservation.some(r=>r.before!==r.after))throw Error('Read-only input changed');
const history=read('historical-risk-inventory.json'),oldFiles=history.roots.flatMap(r=>r.exists?walk(r.root):[]).sort();
if(JSON.stringify(oldFiles)!==JSON.stringify(history.files.map(r=>r.file).sort()))throw Error('Historical file set changed');
for(const r of history.files)if(sha(fs.readFileSync(r.file))!==r.sha256)throw Error('Historical bytes changed: '+r.file);
const routes=walk(out).filter(f=>/\/routes-\d+\.json$/.test(f)).map(f=>({file:f,...JSON.parse(fs.readFileSync(f))}));
for(const r of routes)for(const entry of r.routes){const rel=path.relative(path.resolve(out),entry.mapped);if(rel.startsWith('..')||path.isAbsolute(rel))throw Error('Uncontained route');if(!r.recordOnly&&!fs.existsSync(entry.mapped))throw Error('Missing routed output');}
const current=product.map(file=>({file,sha256:sha(fs.readFileSync(file)),beforeSha256:original.identities[file].sha256,frozenFinalEqual:fs.readFileSync(file).equals(fs.readFileSync(out+'/after-third/source/'+file))}));
if(current.some(r=>!r.frozenFinalEqual))throw Error('Tested final source changed');
const swBefore=fs.readFileSync(out+'/before/source/sw.js','utf8'),swAfter=fs.readFileSync('sw.js','utf8');
if(swBefore.replace('imi-v31','imi-v32')!==swAfter)throw Error('Worker change exceeds version');
const index=git('rev-parse','--git-path','index').trim(),indexSha256=sha(fs.readFileSync(index));
if(indexSha256!==original.indexSha256||git('diff','--cached','--binary')!==original.staged)throw Error('Index changed');
if(git('diff','main','--','minigames').trim())throw Error('Minigames changed');
const syntax=fs.readdirSync('tools/long-game').filter(f=>/^lg02-b2-r2-.*\.(mjs|cjs)$/.test(f)).map(f=>{const r=spawnSync(process.execPath,['--check','tools/long-game/'+f],{encoding:'utf8'});return {file:f,exit:r.status,stderr:r.stderr};});
if(syntax.some(r=>r.exit))throw Error('Helper syntax failed');
const value=f=>{const r=read(f);return r.structuredContent?.value||JSON.parse(r.content[0].text).value;};
const input=read('final-blockedInput.json');
for(const f of ['final-blocked-pixel.json','final-blocked-classic.json','final-finalCacheBalance.json']){const r=value(f);if(!r.blocked||r.opsRaw!==input['imi-ops-v1']||r.walletRaw!==input['imi-score'])throw Error('Blocked bytes changed');}
for(const edition of ['classic','pixel']){const a=value('final-'+edition+'HeldFailure.json'),b=value('final-'+edition+'HeldRepeat.json'),c=value('final-'+edition+'HeldRecovered.json');if(a.opsRaw!==b.opsRaw||a.walletRaw!==b.walletRaw||b.continued!==0||!b.held||c.continued!==1||c.held||JSON.parse(c.opsRaw).prem.vault.transition)throw Error('Native Retry conservation failed');}
for(const pair of read('parity-results-final.json').pairs){if(!pair.equal)throw Error('Parity failed');const r=read(pair.after);if(r.actualMinutes!==60)throw Error('Incomplete parity');for(const[f,h]of Object.entries(r.sourceHashes))if(sha(fs.readFileSync(f.slice(1)))!==h)throw Error('Parity source mismatch');}
const media=read('media-lifecycle-transport-final.json');if(media.cases.length!==8||media.failures.length||!media.profileCleaned)throw Error('Media incomplete');
for(const file of product){const r=spawnSync('git',['diff','--no-index','--',out+'/before/source/'+file,file],{encoding:'utf8',maxBuffer:10*1024*1024});if(r.status!==1)throw Error('Missing product diff');fs.writeFileSync(out+'/final-diff-'+file+'.patch',r.stdout,{flag:'wx'});}
write('final-audit.json',{at:new Date().toISOString(),root,branch:git('branch','--show-current').trim(),head:git('rev-parse','HEAD').trim(),status:git('status','--porcelain=v1'),indexSha256,indexUnchanged:true,current,readOnly:preservation,historicalFiles:oldFiles.length,historicalInventorySha256:sha(fs.readFileSync(out+'/historical-risk-inventory.json')),historicalUnchanged:true,routes:routes.map(r=>({file:r.file,recordOnly:r.recordOnly,operations:r.routes.length})),syntax,workerVersionOnly:true,minigamesDiffMainEmpty:true,nativeBlockedBytesUnchanged:true,nativeRetryConserved:true,parityBoundToFinalSource:true,mediaCases:8});
const artifacts=walk(out).filter(f=>!f.endsWith('/dispatch.json')).map(file=>({file,bytes:fs.statSync(file).size,sha256:sha(fs.readFileSync(file))}));
write('final-artifact-seal.json',{at:new Date().toISOString(),artifacts});
console.log(JSON.stringify({source:current,historical:oldFiles.length,readonly:preservation.length,artifacts:artifacts.length}));
