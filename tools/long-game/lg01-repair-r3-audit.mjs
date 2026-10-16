import fs from 'node:fs/promises';
import {execFileSync,spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import vm from 'node:vm';
const base='docs/plan/long-game/evidence/LG-01/repair-runtime-r3';
const run=process.argv[2]||'';
if(!/^[a-z0-9-]*$/.test(run))throw Error('Invalid audit suffix');
const suffix=run?'-'+run:'';
const sha=b=>createHash('sha256').update(b).digest('hex'),read=p=>fs.readFile(p,'utf8');
const seal=JSON.parse(await read(base+'/before/seal.json')),hashes={},served={},syntax=[];
const changed=['rewards.js','ops.js','ops.css','sw.js'];
for(const [file,hash]of Object.entries(seal.hashes)){
  hashes[file]=sha(await fs.readFile(file));
  assert.equal(sha(await fs.readFile(base+'/before/source/'+file)),hash,'Frozen '+file);
  if(!changed.includes(file))assert.equal(hashes[file],hash,'Read-only '+file);
}
for(const file of changed){
  served[file]=sha(Buffer.from(await(await fetch('http://127.0.0.1:8162/'+file)).arrayBuffer()));assert.equal(served[file],hashes[file]);
  const diff=spawnSync('git',['diff','--no-index','--',base+'/before/source/'+file,file],{encoding:'utf8'});assert.equal(diff.status,1);await fs.writeFile(base+'/'+file+suffix+'.diff',diff.stdout,{flag:'wx'});
}
const before=Object.fromEntries(await Promise.all(changed.map(async f=>[f,(await read(base+'/before/source/'+f)).replaceAll('\r\n','\n')])));
const now=Object.fromEntries(await Promise.all(changed.map(async f=>[f,(await read(f)).replaceAll('\r\n','\n')])));
const oldOps=before['ops.js'].replace("    if (writer && !writer.held()) buffBar.classList.remove('o-held-buffs');\n",'').replace(/  \/\/ A reward hold stops rendering,[\s\S]*?(?=  function setTab\(t\))/, '');
const newOps=now['ops.js'].replace(/  if \(writer\) \{\n    let host, next, panel, panelHost, panelNext;[\s\S]*?\n  \}\n\n(?=  function setTab\(t\))/, '');
assert.equal(newOps,oldOps,'Entire Ops outside presentation attachment/removal');
const start=s=>s.slice(s.indexOf('  // Only enabled game callbacks'));
const rewards=start(now['rewards.js']).replace('if (panel && !failed && !transactionRetry) dismissStatus();','if (panel && !failed && !transactionRetry) panel.hidden = true;')
  .replace('    statusPresentation?.(null); statusPresentation = null;\n','')
  .replace('transactionRetry = null; dismissStatus();','transactionRetry = null; if (panel) panel.hidden = true;')
  .replace('    onStatusPresentation: callback => { statusPresentation = callback; presentStatus(); },\n','');
assert.equal(rewards,start(before['rewards.js']),'Rewards engine/goal policy except UI dismissal/cleanup/registration');
const css=now['ops.css'].replace(/\.o-writer-status\.o-writer-held:not\(\[hidden\]\) \{[\s\S]*?\.o-writer-held > button \{[^\n]*\}\n/,'');
assert.equal(css,before['ops.css'].replace('.o-buffbar.o-held-buffs { width: max-content; }\n',''),'CSS outside held panel rules');
assert.equal(now['sw.js'].replace("'imi-v27'","'imi-v26'"),before['sw.js'],'SW version only');
assert.ok(!now['ops.js'].includes('heldBuffLayout'));assert.ok(!now['ops.css'].includes('o-held-buffs'));
const helpers=execFileSync('git',['ls-files','--others','--exclude-standard','tools/long-game'],{encoding:'utf8'}).trim().split('\n').filter(f=>/lg01-repair-r3-.*\.mjs$/.test(f));
for(const file of ['rewards.js','ops.js','sw.js','tests/rewards-held-presentation.test.cjs',...helpers]){const r=spawnSync('node',['--check',file],{encoding:'utf8'});syntax.push({file,exit:r.status,output:r.stdout+r.stderr});assert.equal(r.status,0);hashes[file]=sha(await fs.readFile(file));}
for(const m of (await read('tools/balance.html')).matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g))if(m[1].trim())new vm.Script(m[1]);
const decode=b=>b[0]===255&&b[1]===254?b.subarray(2).toString('utf16le'):b.toString('utf8');
const log=decode(await fs.readFile(base+'/tests-final3.log'));assert.match(log,/tests 101/);assert.match(log,/pass 101/);assert.match(log,/fail 0/);assert.equal(decode(await fs.readFile(base+'/tests-final3-exit.txt')).trim(),'0');
const canonical=r=>{const copy=structuredClone(r);for(const k of ['capturedAt','sourceCommit','sourceHashes','url','wallSeconds'])delete copy[k];return JSON.stringify(copy,null,2)+'\n';};
const raw=JSON.parse(await read(base+'/disabled-final3.raw.json')),rawBefore=JSON.parse(await read(base+'/before/disabled.raw.json'));
assert.equal(canonical(raw),canonical(rawBefore));assert.equal(sha(canonical(raw)),'5ef60fd274a856b386ae15ecebc5ac5b7ac3dfd37768bd08d4b060d8ee20a6a9');
for(const edition of ['pixel','classic']){
  const source=JSON.parse(await read(base+'/'+edition+'-final-source.json')).result.structuredContent.value;
  for(const [f,h]of Object.entries(source.hashes))assert.equal(h,sha(await fs.readFile(f)));
  assert.equal(source.rewardAwards.length,68);assert.ok(source.rewardAwards.every(a=>Object.keys(a).join()==='id,tier,name'));
  const recovery=JSON.parse(await read(base+'/'+edition+'-final4-recovery.json')).result.structuredContent.value;
  for(const k of ['hostSame','styleSame','nodesSame','panelHost'])assert.equal(recovery[k],true,k);
  assert.equal(recovery.hidden,'none');assert.equal(recovery.bars,1);assert.deepEqual(recovery.claim,recovery.savedClaim);assert.equal(recovery.claim.status,'committed');
  const attempts=recovery.writes.filter(w=>JSON.parse(w.value).rewards?.claims?.['award:l1k']);assert.equal(attempts.filter(w=>w.rejected).length,2);assert.equal(attempts.filter(w=>!w.rejected&&JSON.parse(w.value).rewards.claims['award:l1k'].status==='committed').length,1);
}
const held=JSON.parse(await read(base+'/held-final.json'));
for(const s of held){const g=s.geometry;assert.ok(g);for(const k of ['inside','owner','held','sameNodes','stateSame','keysSame','buffsSame','focused','panelInPane'])assert.equal(g[k],true,s.name+' '+k);assert.equal(g.running,false);assert.equal(g.railOverlap,false);assert.equal(g.goalOverlap,false);assert.equal(g.bars,1);assert.equal(g.order,4);assert.ok(g.retry.height>=40);assert.deepEqual(g.document,g.viewport);assert.ok(g.retry.bottom<=g.panel.bottom);}
const screens=JSON.parse(await read(base+'/screens-settled.json'));assert.equal(screens.length,30);
for(const s of screens){const g=s.geometry;assert.deepEqual(g.document,g.viewport);assert.equal(g.floor.overflow,'hidden');assert.equal(g.floor.scrollTop,0);if(g.enabled){assert.equal(g.goals.height,44);if(g.viewport[0]<=720){assert.equal(g.lines.length,3);assert.ok(g.lines.every(l=>l.progressFits));}assert.ok(g.targets.filter(r=>r.width&&r.height).every(r=>r.height>=40));}}
const media=JSON.parse(await read(base+'/media-report-final3.json'));assert.deepEqual(media.failures,[]);assert.equal(media.cases.length,10);assert.equal(media.profileCleaned,true);
const lifecycle=JSON.parse(await read(base+'/lifecycle-final3/lifecycle.json'));assert.deepEqual(lifecycle.errors,[]);assert.equal(lifecycle.profileCleaned,true);assert.equal(lifecycle.cases.length,2);
for(const row of lifecycle.cases){for(const[f,h]of Object.entries(row.hashes))assert.equal(h,sha(await fs.readFile(f)));assert.equal(row.restored.old.persisted,true);assert.equal(row.restored.old.hostRestored,true);assert.equal(row.restored.old.panelChips,0);assert.equal(row.restored.old.keysSame,true);assert.ok(row.hiddenEnd.at-row.hidden.at>=32000);}
for(const edition of ['pixel','classic']){
  for(const lane of ['startup-invalid','startup-invalid-retry','startup-unsupported']){
    const g=JSON.parse(await read(base+'/'+edition+'-'+lane+'.json')).result.structuredContent.value;
    assert.equal(g.owner,false);assert.equal(g.imi,false);assert.equal(g.bar,false);assert.equal(g.content,false);assert.equal(g.ops,'[]');assert.equal(g.score,'{"economyVersion":1,"score":6250}');assert.equal(g.focused,true);assert.ok(g.retry.height>=40);assert.deepEqual(g.document,g.viewport);
  }
  for(const size of ['360x560','700x390']){
    const g=JSON.parse(await read(base+'/'+edition+'-metadata-longest-'+size+'.json')).result.structuredContent.value;
    for(const key of ['inside','held','owner','stateSame','keysSame','buffsSame','sameNodes','focused'])assert.equal(g[key],true);
    assert.equal(g.railOverlap,false);assert.equal(g.goalOverlap,false);assert.ok(g.chips.some(c=>c.text.startsWith('GOLDEN KEYS')));assert.ok(g.chips.some(c=>c.text.startsWith('BAD REVIEW')));
  }
  const g=JSON.parse(await read(base+'/'+edition+'-metadata-recovered.json')).result.structuredContent.value;
  assert.equal(g.held,false);for(const key of ['acknowledged','saved','host','panelHost','nodes'])assert.equal(g[key],true);
}
const images=[];for(const s of [...held,...screens,...media.images.map(m=>({path:m.file}))])images.push({file:s.path,sha256:sha(await fs.readFile(s.path))});
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'}).trim();const index=sha(await fs.readFile(git('rev-parse','--git-path','index')));assert.equal(index,seal.indexHash);assert.equal(git('rev-parse','HEAD'),seal.head);assert.equal(git('branch','--show-current'),seal.branch);
await fs.writeFile(base+'/audit-final'+suffix+'.json',JSON.stringify({at:new Date().toISOString(),branch:seal.branch,head:seal.head,index,hashes,served,syntax,preservation:'Entire scoped bytes outside status/attachment/held CSS/version changes match seal',canonical:sha(canonical(raw)),tests:{passed:101,failed:0,log:'tests-final3.log'},held:held.length,screens:screens.length,images,mediaCases:media.cases.length,lifecycleCases:lifecycle.cases.length,status:git('status','--porcelain=v1')},null,2)+'\n',{flag:'wx'});
console.log('Source/served/preservation/syntax/101 tests/full parity/native/geometry/media/lifecycle audit PASS');
