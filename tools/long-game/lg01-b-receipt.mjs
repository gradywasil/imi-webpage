import { readFile,writeFile,mkdir,copyFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import vm from 'node:vm';
const base='docs/plan/long-game/evidence/LG-01/implementation-b';
const output=process.argv[2]||base+'/final';
const json=async path=>JSON.parse((await readFile(path,'utf8')).replace(/^\uFEFF/,''));
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const seal=await json(base+'/before/seal.json');
const runtime=['rewards.js','ops.js','core.js','economy.js','tools/balance.html','sw.js'];
const brief='docs/plan/long-game/LG-01B-reward-transactions.md';
const helper=['tests/rewards-transactions.test.cjs','tests/rewards-offline.test.cjs','tools/long-game/lg01-b-fixture.mjs','tools/long-game/lg01-b-media.mjs','tools/long-game/lg01-b-pacing.mjs','tools/long-game/lg01-b-receipt.mjs'];
const identities={},checks=[];await mkdir(output+'/source',{recursive:true});
for(const path of [...runtime,...helper]){
  const bytes=await readFile(path);identities[path]=hash(bytes);
  const target=output+'/source/'+path;await mkdir(target.slice(0,target.lastIndexOf('/')),{recursive:true});await copyFile(path,target,1);
  if(/\.(?:mjs|cjs|js)$/.test(path)){const result=spawnSync(process.execPath,['--check',path],{encoding:'utf8'});assert.equal(result.status,0,result.stderr);checks.push(path);}
  if(path.endsWith('.html'))for(const [,body]of bytes.toString().matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(body,{filename:path});
}
const preserved=[];
for(const file of seal.files){
  if(!runtime.includes(file.path)&&file.path!==brief){assert.equal(hash(await readFile(file.path)),file.sha256,file.path);preserved.push(file.path);}
}
const copiedWithoutInventoryHash=[];
for(const path of seal.sealedBytes){const expected=seal.files.find(f=>f.path===path)?.sha256,frozen=hash(await readFile(base+'/before/source/'+path));
  if(expected)assert.equal(frozen,expected,path+' sealed bytes');else{assert.equal(frozen,hash(await readFile(path)),path+' preserved before copy');copiedWithoutInventoryHash.push(path);}
}
const beforeOps=await readFile(base+'/before/source/ops.js','utf8'),ops=await readFile('ops.js','utf8');
const awards=source=>source.slice(source.indexOf('  const AW = '),source.indexOf('  function achieve('));
assert.equal(awards(ops),awards(beforeOps));
assert.equal(ops.match(/const awardMult =[^\n]+/)[0],beforeOps.match(/const awardMult =[^\n]+/)[0]);
for(const edition of ['pixel','classic']){
  const identity=(await json(base+'/native-final-'+edition+'-source-identity.json')).structuredContent.value;
  for(const [path,sha]of Object.entries(identity.hashes))assert.equal(sha,hash(await readFile(path)),edition+': '+path);
  for(const [name,path]of Object.entries({credit:'core.js',adapter:'economy.js',tick:'ops.js',basis:'ops.js',save:'ops.js',transaction:'rewards.js'}))assert.ok((await readFile(path,'utf8')).includes(identity[name]),edition+' loaded '+name);
  for(const stage of ['prepared','wallet','committed']){const v=(await json(base+'/native-final2-'+edition+'-'+stage+'.json')).structuredContent.value;
    assert.equal(v.held,true);assert.equal(v.retry,true);assert.equal(v.delta,6250);assert.equal(v.committed,true);assert.equal(v.blocked,true);assert.equal(v.calls,1);assert.equal(v.printing,1);
  }
  const stopped=(await json(base+'/native-final-'+edition+'-away-stopped.json')).structuredContent.value;
  const resumed=(await json(base+'/native-final-'+edition+'-away-reloaded.json')).structuredContent.value;
  assert.equal(stopped.paidSeconds,210);assert.equal(resumed.wallet,stopped.wallet);assert.equal(resumed.letters,stopped.letters);assert.equal(resumed.active,null);assert.equal(resumed.checkpoint,undefined);
}
const excluded=['capturedAt','sourceCommit','sourceHashes','url','wallSeconds'];
const canonical=raw=>JSON.stringify(Object.fromEntries(Object.entries(raw).filter(([key])=>!excluded.includes(key))),null,2)+'\n';
const before=await json(base+'/before/hour-active-collect-1.raw.json'),after=await json(base+'/disabled-source-final.raw.json');
for(const raw of [before,after]){assert.equal(raw.complete,true);assert.equal(raw.actualMinutes,60);assert.deepEqual(raw.errors,[]);assert.deepEqual(raw.httpErrors,[]);}
assert.equal(canonical(before),canonical(after));assert.equal(canonical(after),await readFile(base+'/disabled-source-final.canonical.json','utf8'));
for(const [url,sha]of Object.entries(after.sourceHashes))assert.equal(sha,hash(await readFile(url.slice(1))),url);
for(const edition of ['pixel','classic']){
  const v=(await json(base+'/before/native-'+edition+'.json')).structuredContent.value,wallet=JSON.parse(v.walletRaw),state=JSON.parse(v.opsRaw);
  assert.equal(typeof wallet,'object');assert.equal(wallet.economyVersion,1);assert.equal(typeof wallet.score,'number');assert.equal(state.economyVersion,1);
  for(const [path,sha]of Object.entries(v.hashes))assert.equal(sha,seal.files.find(f=>f.path===path).sha256);
}
const media=await json(base+'/media-final/report.json');
for(const v of media.results){
  if(v.hashes)for(const [url,sha]of Object.entries(v.hashes))assert.equal(sha,hash(await readFile(url.slice(1))),url);
  else {assert.equal(v.media,true);assert.equal(v.core,true);assert.equal(v.imi,true);assert.deepEqual(v.document,v.viewport);assert.equal(v.animation,'none');if(v.status)assert.ok(v.retry.width>=40&&v.retry.height>=40&&v.retry.focused);}
}
const screenshots=[];
for(const shot of await json(base+'/ui-final-screenshot-paths.json')){
  const v=(await json(base+'/'+shot.name+'-geometry.json')).structuredContent.value;
  assert.deepEqual(v.document,v.viewport);assert.equal(v.fx,'low');assert.ok(v.floor[0]>0);
  if(shot.name.includes('-status-'))assert.ok(v.retry.width>=40&&v.retry.height>=40&&v.retry.focused&&v.held);
  screenshots.push({path:base+'/'+shot.name+'.png',sha256:hash(await readFile(base+'/'+shot.name+'.png'))});
}
const testBytes=await readFile(base+'/final-tests-r8.txt'),tests=testBytes.toString(testBytes[0]===255&&testBytes[1]===254?'utf16le':'utf8');
assert.match(tests,/tests 48/);assert.match(tests,/pass 48/);assert.match(tests,/fail 0/);
const pacing=await json(base+'/pacing/enabled-final-details.json');assert.equal(pacing.complete,true);assert.equal(pacing.report.actualMinutes,60);assert.deepEqual(pacing.errors,[]);
for(const [url,sha]of Object.entries(pacing.hashes))assert.equal(sha,hash(await readFile(url.slice(1))),url);
const git=(...args)=>spawnSync('git',args,{encoding:'utf8'}).stdout;
assert.equal(git('branch','--show-current').trim(),'long-game');assert.equal(git('rev-parse','HEAD').trim(),seal.head);assert.equal(git('diff','--cached','--name-only'),seal.staged);
const receipt={capturedAt:new Date().toISOString(),identities,syntaxChecks:checks,inlineScriptsParsed:true,preservedFileCount:preserved.length,preservationMismatches:[],copiedWithoutInventoryHash,originalAwardsBlockUnchanged:true,
  nativeServedAndLoadedIdentities:true,nativeCashCases:6,nativeCheckpointReloads:2,tests:48,testsPassed:48,defaultSixtyMinuteExact:true,excluded,canonicalSha256:hash(canonical(after)),screenshots,
  actualMedia:true,pacing:{coverage:pacing.coverage,payouts:pacing.payouts,final:pacing.report.final,consumedTokens:pacing.consumedTokens},branch:git('branch','--show-current').trim(),head:seal.head,staged:seal.staged,status:git('status','--porcelain=v1','--untracked-files=all')};
await writeFile(output+'/receipt.json',JSON.stringify(receipt,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({syntax:checks.length,preserved:preserved.length,tests:48,canonical:receipt.canonicalSha256,branch:receipt.branch,staged:receipt.staged}));
