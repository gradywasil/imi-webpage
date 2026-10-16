// Read-back only: compare preserved inputs and verify new receipts without rerunning writers.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto'),vm=require('node:vm');
const out='docs/plan/long-game/evidence/LG-02/qa-runtime-b2-r1',tag=process.argv[2]||'first';
const read=f=>JSON.parse(fs.readFileSync(f,'utf8').replace(/^\uFEFF/,'')),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const git=(...a)=>cp.execFileSync('git',a,{encoding:'utf8',maxBuffer:32*1024*1024}).trim();
const before=read(out+'/before-inventory.json'),risk=read(out+'/historical-risk-inventory.json'),drift=[],allowed=[];
for(const [file,id]of Object.entries(before.identities)){
  const current=fs.existsSync(file)?sha(fs.readFileSync(file)):null;
  if(current!==id.sha256)(file==='docs/plan/long-game/LG-02B2-QA-r1.md'?allowed:drift).push({file,before:id.sha256,current});
}
const riskDrift=Object.entries(risk.identities).filter(([f,id])=>!fs.existsSync(f)||sha(fs.readFileSync(f))!==id.sha256).map(([f])=>f);
const own=f=>f.startsWith(out+'/')||f.startsWith('tools/long-game/lg02-b2-qa-r1-')||f.startsWith('tools/long-game/fixture-lg02-b2-qa-r1-20261013/')||f==='docs/plan/long-game/LG-02B2-QA-runtime-r1.md';
const files=cp.execFileSync('git',['ls-files','--cached','--others','--exclude-standard','-z'],{encoding:'utf8',maxBuffer:32*1024*1024}).split('\0').filter(Boolean);
const unexpectedNew=files.filter(f=>!f.startsWith('.claude/')&&!before.identities[f]&&!own(f));
const syntax=[];
for(const file of ['core.js','ops.js','rewards.js','vault.js','tour.js','sw.js',...files.filter(f=>f.startsWith('tools/long-game/lg02-b2-qa-r1-')&&/\.(?:mjs|cjs|js)$/.test(f))]){
  const r=cp.spawnSync(process.execPath,['--check',file],{encoding:'utf8'});syntax.push({file,exit:r.status,stderr:r.stderr});
}
const html='tools/long-game/fixture-lg02-b2-qa-r1-20261013/frozen-balance.html';let inline=0;
for(const m of fs.readFileSync(html,'utf8').matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g))if(!/\bsrc\s*=/.test(m[1])&&m[2].trim()){new vm.Script(m[2],{filename:html});inline++;}
const exclusions=['capturedAt','sourceCommit','sourceHashes','url','wallSeconds'],canonical=f=>{const v=read(f);for(const k of exclusions)delete v[k];return sha(JSON.stringify(v,null,2)+'\n');};
const parity=[];
for(const [label,historical]of [['default',['before-hour.raw.json','after-hour-final.raw.json']],['lg01',['lg01-frozen-final.raw.json','lg01-current-final.raw.json']],['both',['both-frozen-final.raw.json','both-current-final.raw.json']]]){
  const names=[...historical.map(n=>'docs/plan/long-game/evidence/LG-02/implementation-b2-r2/'+n),...['frozen','current'].map(n=>out+'/parity-'+label+'-'+n+'.raw.json')];
  const hashes=names.map(canonical);parity.push({label,files:names,hashes,equal:new Set(hashes).size===1,complete:names.every(n=>read(n).complete)});
}
const indexSha256=sha(fs.readFileSync(git('rev-parse','--git-path','index'))),head=git('rev-parse','HEAD'),branch=git('branch','--show-current');
const report={at:new Date().toISOString(),preserved:Object.keys(before.identities).length,drift,allowed,riskCount:Object.keys(risk.identities).length,riskDrift,unexpectedNew,indexSha256,indexUnchanged:indexSha256===before.indexSha256,head,branch,identityUnchanged:head===before.head&&branch===before.branch,stagedUnchanged:git('diff','--cached','--binary')===before.staged,syntax,inline,parity};
fs.writeFileSync(out+'/preservation-'+tag+'.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({...report,syntax:syntax.length,parity:parity.map(r=>({label:r.label,equal:r.equal,complete:r.complete}))}));
if(drift.length||riskDrift.length||unexpectedNew.length||!report.indexUnchanged||!report.identityUnchanged||!report.stagedUnchanged||syntax.some(s=>s.exit)||parity.some(p=>!p.equal||!p.complete))process.exitCode=1;
