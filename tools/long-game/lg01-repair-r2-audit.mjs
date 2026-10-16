import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync,spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const base='docs/plan/long-game/evidence/LG-01/repair-runtime-r2';
const sha=b=>createHash('sha256').update(b).digest('hex');
const json=async p=>JSON.parse((await readFile(p,'utf8')).replace(/^\uFEFF/,''));
const seal=await json(base+'/before/seal.json'),hashes={},changed=[],syntax={};
for(const file of Object.keys(seal.hashes)){hashes[file]=sha(await readFile(file));if(hashes[file]!==seal.hashes[file])changed.push(file);}
assert.deepEqual(changed.sort(),['ops.css','ops.js','rewards.js','sw.js']);
const git=(...args)=>execFileSync('git',args,{encoding:'utf8'});
assert.equal(git('branch','--show-current').trim(),'long-game');assert.equal(git('rev-parse','HEAD').trim(),seal.head);
assert.equal(sha(await readFile(git('rev-parse','--git-path','index').trim())),seal.indexHash);
const source=async(file,before=false)=>readFile(before?base+'/before/source/'+file:file,'utf8');
const ops=await source('ops.js'),oldOps=await source('ops.js',true),rewards=await source('rewards.js'),oldRewards=await source('rewards.js',true);
const awards=s=>s.slice(s.indexOf('  const AWARDS ='),s.indexOf('  function checkAwards'));
assert.ok(awards(ops).length>5000);assert.equal(awards(ops),awards(oldOps));assert.equal((awards(ops).match(/AW\('/g)||[]).length,68);
assert.equal(rewards.slice(0,rewards.indexOf('  // Goal policy stays private.')),oldRewards.slice(0,oldRewards.indexOf('  // Goal policy stays private.')));
assert.equal(rewards.slice(rewards.indexOf('  function afterRender()')),oldRewards.slice(oldRewards.indexOf('  function afterRender()')));
assert.equal((await source('sw.js')).replace('imi-v26','imi-v25'),await source('sw.js',true));
assert.equal((await source('ops.css')).replace(/\.o-buffbar\.o-held-buffs \{ width: max-content; \}\r?\n/,''),await source('ops.css',true));
const served={};for(const file of ['ops.js','rewards.js','sw.js','ops.css','core.js','economy.js','index.html','classic.html']){
  served[file]=sha(Buffer.from(await(await fetch('http://127.0.0.1:8162/'+file)).arrayBuffer()));assert.equal(served[file],hashes[file]);
}
for(const file of ['ops.js','rewards.js','sw.js','tests/rewards-goal-repair.test.cjs',...git('ls-files','--others','--exclude-standard','tools/long-game').trim().split('\n').filter(p=>p.includes('lg01-repair-r2-'))]) {
  const run=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});hashes[file]=sha(await readFile(file));syntax[file]={exit:run.status,stdout:run.stdout,stderr:run.stderr};assert.equal(run.status,0);
}
const exclusions=['capturedAt','sourceCommit','sourceHashes','url','wallSeconds'];
const canonical=r=>JSON.stringify(Object.fromEntries(Object.entries(r).filter(([k])=>!exclusions.includes(k))),null,2)+'\n';
const before=await json(base+'/before/disabled.raw.json'),final=await json(base+'/disabled-final2.raw.json');
for(const r of [before,final]){assert.equal(r.complete,true);assert.equal(r.actualMinutes,60);assert.deepEqual(r.errors,[]);assert.deepEqual(r.httpErrors,[]);}
assert.equal(canonical(before),canonical(final));assert.equal(sha(canonical(final)),'5ef60fd274a856b386ae15ecebc5ac5b7ac3dfd37768bd08d4b060d8ee20a6a9');
const logBytes=await readFile(base+'/tests-final2.log'),log=logBytes[0]===255&&logBytes[1]===254?logBytes.toString('utf16le'):logBytes.toString('utf8');
assert.match(log,/tests 99/);assert.match(log,/pass 99/);assert.match(log,/fail 0/);
const exitBytes=await readFile(base+'/tests-final2-exit.txt');assert.equal(exitBytes.toString(exitBytes[0]===255?'utf16le':'utf8').replace(/\uFEFF/g,'').trim(),'0');
for(const edition of ['pixel','classic']) {
  const native=await json(base+'/before/native-'+edition+'.json');assert.equal(native.isError,false);assert.equal(native.structuredContent.value.serialized,true);
  for(const size of ['1280x800','700x390','390x700','360x560','text200']){
    const r=await json(base+'/native-'+edition+'-final2-held-'+size+'.json');assert.equal(r.result.isError,false);const v=r.result.structuredContent.value;
    assert.equal(v.same,true);assert.equal(v.held,true);assert.equal(v.owner,true);assert.equal(v.running,false);assert.equal(v.collision,false);assert.equal(v.rejections,1);assert.equal(v.retryFocused,true);assert.ok(v.retry.height>=40);
    assert.deepEqual(v.collisions,[]);
  }
  const loaded=await json(base+'/native-'+edition+'-final2-source.json');
  assert.equal(loaded.result.isError,false);
  for(const[file,hash]of Object.entries(loaded.result.structuredContent.value.hashes))assert.equal(hash,hashes[file]);
  assert.equal(loaded.result.structuredContent.value.api.length,68);
  assert.deepEqual(Object.keys(loaded.result.structuredContent.value.api[0]),['id','tier','name']);
  const retry=(await json(base+'/native-'+edition+'-final2-retry.json')).structuredContent.value;
  const reload=(await json(base+'/native-'+edition+'-final2-retry-reload.json')).structuredContent.value;
  assert.equal(retry.held,false);assert.equal(reload.held,false);
  assert.equal(retry.state.rewards.claims['award:l1k'].status,'committed');
  assert.deepEqual(retry.state.rewards.claims['award:l1k'],reload.state.rewards.claims['award:l1k']);
  assert.equal(retry.walletRaw,reload.walletRaw);
  const policy=(await json(base+'/native-'+edition+'-final2-policy.json')).result;
  assert.equal(policy.isError,false);const p=policy.structuredContent.value;
  assert.equal(p.actualCore,true);assert.equal(p.nohands.retained,true);assert.equal(p.nohands.streakExcluded,true);assert.equal(p.nohands.lettersAfterManual,999);assert.equal(p.nohands.letters,1000);assert.equal(p.nohands.manualUnchanged,true);assert.equal(p.nohands.claim.status,'committed');
  assert.equal(p.challenge.metric,3);assert.equal(p.challenge.earned,false);assert.equal(p.challenge.raw.futureChallenge,true);assert.equal(p.challenge.raw.anotherFuture,false);assert.equal(p.challenge.raw.timed,false);
  const saved=(await json(base+'/native-'+edition+'-final2-policy-reload.json')).structuredContent.value.state;
  assert.deepEqual(saved.chDone,p.challenge.raw);assert.equal(saved.rewards.unknown.keep,true);
  const db=(await json(base+'/native-'+edition+'-final2-diamond-display.json')).result;assert.equal(db.isError,false);
  for(const row of db.structuredContent.value.rows){assert.equal(row.same,true);assert.equal(row.shown,row.fixtureBalances[0]+row.fixtureBalances[1]>=1);}
  const growing=(await json(base+'/native-'+edition+'-current-garden-growing.json')).result.structuredContent.value;
  const ripe=(await json(base+'/native-'+edition+'-current-garden-ripe'+(edition==='classic'?'-r2':'')+'.json')).result.structuredContent.value;
  const harvested=(await json(base+'/native-'+edition+'-current-garden-harvest-scalar.json')).result.structuredContent.value;
  const reloaded=(await json(base+'/native-'+edition+'-current-garden-reload'+(edition==='classic'?'-r2':'')+'.json')).structuredContent.value;
  assert.ok(growing.state.garden.beds.every(b=>b.ready>growing.now));assert.equal(growing.goals.ids[0],'gar1');assert.equal(growing.state.stats.harvested,0);
  assert.ok(ripe.beds.every(b=>b.ready<=ripe.now));assert.equal(ripe.goals.ids[0],'gar1');assert.equal(ripe.harvested,0);
  assert.equal(harvested.oneSlot,true);assert.equal(harvested.state.stats.harvested,6);assert.deepEqual(harvested.state.rewards.goals.ids.slice(1),['s4','d1']);
  assert.deepEqual(harvested.state.rewards.claims['award:gar1'],reloaded.state.rewards.claims['award:gar1']);
  assert.deepEqual(harvested.state.rewards.goals,reloaded.state.rewards.goals);
  for(let i=0;i<harvested.writeCount;i++){const write=(await json(base+'/native-'+edition+'-current-garden-write-'+i+'.json')).result;assert.equal(write.isError,false);assert.equal(write.structuredContent.value.key,'imi-ops-v1');assert.ok(JSON.parse(write.structuredContent.value.value).rewards.claims['award:gar1']);}
}
const media=await json(base+'/media-report-final2.json');assert.equal(media.cases.length,10);assert.deepEqual(media.failures,[]);assert.equal(media.profileCleaned,true);
for(const c of media.cases){assert.deepEqual(c.errors,[]);for(const[file,hash]of Object.entries(c.hashes))assert.equal(hash,hashes[file]);}
const screens=await json(base+'/screens-current.json');assert.equal(screens.length,30);
for(const s of screens){assert.equal(s.error,false);assert.deepEqual(s.geometry.document,s.geometry.viewport);assert.equal(s.geometry.floor.overflow,'hidden');if(s.name.includes('enabled')){assert.equal(s.geometry.button.height,44);assert.equal(s.geometry.lines.length,3);}}
const text=[...(await json(base+'/native-text-final2.json')).filter(r=>r.edition==='classic'),...await json(base+'/native-text-final2-pixel-r2.json')];assert.equal(text.length,16);
for(const r of text){assert.equal(r.result.isError,false);const g=r.result.structuredContent.value;assert.equal(g.lines.length,3);assert.equal(g.button.height,39*r.scale+5);assert.deepEqual(g.document,g.viewport);for(const l of g.lines){assert.ok(l.rect.bottom<=g.button.bottom);assert.equal(l.progressFits,true);}}
const images={};for(const file of [...screens.map(s=>s.path),...media.images.map(s=>s.file),...['pixel','classic'].flatMap(e=>['1280x800','700x390','390x700','360x560'].map(size=>base+'/'+e+'-held-final2-'+size+'.png'))])images[file]=sha(await readFile(file));
if(process.argv[2]==='audit-handoff')for(const file of ['ops.js','rewards.js','ops.css','sw.js']){
  const diff=spawnSync('git',['diff','--no-index','--',base+'/before/source/'+file,file],{encoding:'utf8'});assert.equal(diff.status,1);await writeFile(base+'/'+file+'.diff',diff.stdout,{flag:'wx'});
}
await writeFile(base+'/'+(process.argv[2]||'audit-final')+'.json',JSON.stringify({capturedAt:new Date().toISOString(),changed,hashes,served,syntax,images,indexUnchanged:true,awardBlockByteEqual:true,engineByteEqual:true,cacheAssetsByteEqual:true,parity:{complete:true,exclusions,canonicalHash:sha(canonical(final))},tests:{pass:99,fail:0,exit:0,logHash:sha(logBytes),encoding:logBytes[0]===255?'UTF16LE':'UTF8'},status:git('status','--porcelain=v1')},null,2)+'\n',{flag:'wx'});
console.log('PASS: narrow source delta, preserved engine/predicates/index/assets, syntax,99 tests, exact60 parity and both native held-resize matrices.');
