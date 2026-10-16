import { readFile,writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const base='docs/plan/long-game/evidence/LG-01/implementation-c-r2';
const sha=b=>createHash('sha256').update(b).digest('hex');
const json=async p=>JSON.parse((await readFile(p,'utf8')).replace(/^\uFEFF/,''));
const seal=await json(base+'/before/seal.json'),hashes={},changed=[];
for(const[file,hash]of Object.entries(seal.hashes)) {
  hashes[file]=sha(await readFile(file));
  if(hashes[file]!==hash)changed.push(file);
}
assert.deepEqual(changed.sort(),['ops.css','sw.js']);
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'});
assert.equal(git('branch','--show-current').trim(),'long-game');
assert.equal(git('rev-parse','HEAD').trim(),seal.head);
assert.equal(sha(await readFile(git('rev-parse','--git-path','index').trim())),seal.indexHash);
assert.equal((await readFile('sw.js','utf8')).replace('imi-v25','imi-v24'),await readFile(base+'/before/source/sw.js','utf8'));
const exclusions=['capturedAt','sourceCommit','sourceHashes','url','wallSeconds'];
const raw=await json(base+'/disabled-final.raw.json'),before=await json(base+'/before/disabled.raw.json');
const canonical=r=>JSON.stringify(Object.fromEntries(Object.entries(r).filter(([k])=>!exclusions.includes(k))),null,2)+'\n';
for(const r of [raw,before]){assert.equal(r.complete,true);assert.equal(r.actualMinutes,60);assert.deepEqual(r.errors,[]);assert.deepEqual(r.httpErrors,[]);}
assert.equal(canonical(raw),canonical(before));
assert.equal(sha(canonical(raw)),'5ef60fd274a856b386ae15ecebc5ac5b7ac3dfd37768bd08d4b060d8ee20a6a9');
const logBytes=await readFile(base+'/tests-final.log');
const log=logBytes[0]===255&&logBytes[1]===254?logBytes.toString('utf16le'):logBytes.toString('utf8');
assert.match(log,/tests 95/);assert.match(log,/pass 95/);assert.match(log,/fail 0/);
assert.equal((await readFile(base+'/tests-final-exit.txt','utf8')).replace(/\uFEFF/g,'').trim(),'0');
const media=await json(base+'/media-report.json');assert.deepEqual(media.failures,[]);assert.equal(media.cases.length,10);assert.equal(media.profileCleaned,true);
for(const c of media.cases){assert.deepEqual(c.errors,[]);for(const[file,hash]of Object.entries(c.hashes))assert.equal(hash,sha(await readFile(file)));}
const manifests=['screens','screens-final','screens-combo-final','screens-held-settled'];
const images=[];
for(const name of manifests)for(const i of await json(base+'/'+name+'.receipt.json')) {
  assert.equal(sha(await readFile(i.path)),i.sha256);images.push(i.path);
  if(i.geometry){assert.deepEqual(i.geometry.document,i.geometry.viewport);assert.equal(i.geometry.floor.overflow,'hidden');assert.equal(i.geometry.floor.scrollTop,0);}
}
const final=await json(base+'/screens-final.receipt.json');assert.equal(final.length,24);
for(const i of final) {
  assert.ok(i.name.startsWith(i.geometry.edition+'-'));
  if(i.name.includes('-enabled-')){assert.equal(i.geometry.button.height,44);assert.equal(i.geometry.lines.length,3);}
}
const initial=await json(base+'/screens.receipt.json');
for(const i of initial.filter(i=>/-text-/.test(i.name))) {
  const g=i.geometry;assert.equal(g.lines.length,3);assert.ok(g.button.height>=44);
  for(const line of g.lines){assert.ok(line.rect.bottom<=g.button.bottom);assert.equal(line.progressFits,true);}
  assert.ok(g.nextDesk.top>=g.host.bottom);
}
for(const i of await json(base+'/screens-held-settled.receipt.json')) {
  if(i.name.includes('-held-'))assert.ok(i.buffs.buff.top>=i.geometry.host.bottom);
}
for(const i of media.images){assert.equal(sha(await readFile(i.file)),i.sha256);images.push(i.file);}
const served={};
for(const file of ['rewards.js','ops.js','ops.css','sw.js','core.js','economy.js','index.html','classic.html']) {
  const bytes=Buffer.from(await (await fetch('http://127.0.0.1:8162/'+file)).arrayBuffer());
  served[file]=sha(bytes);assert.equal(served[file],sha(await readFile(file)));
}
const report={capturedAt:new Date().toISOString(),changed,hashes,served,indexUnchanged:true,engineAndAwardBlockByteEqual:true,swAssetsByteEqual:true,
  parity:{complete:true,exclusions,canonicalHash:sha(canonical(raw))},tests:{pass:95,fail:0,exit:0,logHash:sha(logBytes),encoding:logBytes[0]===255?'UTF16LE':'UTF8'},
  media:{cases:media.cases.map(c=>({kind:c.kind,edition:c.edition})),currentSource:true,profileCleaned:true},images,
  diagnostics:['Initial pixel-disabled captures followed Classic preference; final24 explicitly bind edition.',
    'Initial pane captures span transition; final24 settle after selecting tab.',
    'Frozen post-hold viewport/navigation projection can retain old fixed buff position; not fit acceptance. Held-settled cases form failure separately at each size.',
    'All-complete-red named probe disproved suspected contradiction; no source defect or fix.',
    'T3 hidden desktop rail toggle timed out; docked expanded rail and focused phone controls used.'],status:git('status','--porcelain=v1')};
await writeFile(base+'/'+(process.argv[2]||'audit-final')+'.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log('PASS: CSS/cache-only source; index/assets/engine preserved; exact60 parity;95 tests; current media; '+images.length+' image hashes.');
