import fs from 'node:fs';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
import {spawnSync,execFileSync} from 'node:child_process';
const out='docs/plan/long-game/evidence/LG-02/repair-runtime-a-r2';
const sha=b=>createHash('sha256').update(b).digest('hex'),read=p=>fs.readFileSync(p,'utf8'),json=p=>JSON.parse(read(p));
const start=json(out+'/start-seal.json'), entries={}, changes=[],syntax=[];
for(const [p,h] of Object.entries(start.entries)) {entries[p]=sha(fs.readFileSync(p));if(entries[p]!==h)changes.push(p);}
const expected=['ops.js','pickups.js','tour.js','sw.js'];
for(const p of expected){const before=read(out+'/before/'+p),after=read(p),nl=before.includes('\r\n')?'\r\n':'\n';const transformed=p==='sw.js'?before.replace('imi-v28','imi-v29'):before.replace('  if (window.VaultSaveGate?.blocked) return;'+nl+"  'use strict';","  'use strict';"+nl+'  if (window.VaultSaveGate?.blocked) return;');if(transformed!==after)throw Error('Unauthorized body delta '+p);const r=spawnSync('git',['diff','--no-index','--',out+'/before/'+p,p],{encoding:'utf8'});fs.writeFileSync(out+'/'+p+'.diff',r.stdout,{flag:'wx'});}
if(JSON.stringify(changes.sort())!==JSON.stringify(expected.sort()))throw Error('Unexpected inspected-source changes '+changes);
for(const p of [...expected,'tests/vault-startup-strictness.test.cjs',...fs.readdirSync('tools/long-game').filter(p=>/^lg02-a-repair-.*\.mjs$/.test(p)).map(p=>'tools/long-game/'+p)]){const r=spawnSync(process.execPath,['--check',p],{encoding:'utf8'});syntax.push({path:p,sha256:sha(fs.readFileSync(p)),exit:r.status,stderr:r.stderr});}
for(const p of ['index.html','classic.html','tools/balance.html'])for(const m of read(p).matchAll(/<script>([\s\S]*?)<\/script>/g))new vm.Script(m[1]);
const canonical=p=>{const r=json(p);if(!r.complete||r.actualMinutes!==60||r.activeMinutes!==180)throw Error('Wrong policy/duration '+p);for(const k of ['capturedAt','sourceCommit','sourceHashes','url','wallSeconds'])delete r[k];return JSON.stringify(r,null,2)+'\n';};
const parity=[];
for(const [label,a,b] of [['fresh-repair',out+'/before-hour.raw.json',out+'/after-hour.raw.json'],['original180', 'docs/plan/long-game/evidence/LG-02/implementation-a/before/default-hour.raw.json',out+'/after-hour.raw.json'],...['enabled','both-flags'].map(l=>['carry-'+l,'docs/plan/long-game/evidence/LG-02/implementation-a/before/'+l+'.raw.json','docs/plan/long-game/evidence/LG-02/implementation-a/after-final/'+l+'.raw.json'])]){const x=canonical(a),y=canonical(b);parity.push({label,a,b,equal:x===y,prettyShaBefore:sha(x),prettyShaAfter:sha(y)});}
const indexSha=sha(execFileSync('git',['ls-files','--stage']));
fs.writeFileSync(out+'/current-audit.json',JSON.stringify({at:new Date().toISOString(),entries,changes,exactFourTransform:true,indexUnchanged:indexSha===start.indexSha,syntax,inlineSyntax:true,parity},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({changes,syntaxFailures:syntax.filter(r=>r.exit),parity}));
if(syntax.some(r=>r.exit)||parity.some(r=>!r.equal)||indexSha!==start.indexSha)process.exitCode=1;
