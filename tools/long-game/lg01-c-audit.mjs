import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const base='docs/plan/long-game/evidence/LG-01/implementation-c',sha=b=>createHash('sha256').update(b).digest('hex');
const before=JSON.parse(await readFile(base+'/before/seal.json','utf8'));
const allowed=['rewards.js','ops.js','ops.css','sw.js','docs/plan/long-game/LG-01C-cards-and-goals.md'];
const hashes={},changed=[],unexpected=[];
for(const [file,hash]of Object.entries(before.hashes)) {
  hashes[file]=sha(await readFile(file));
  if(hash!==hashes[file]) {changed.push(file);if(!allowed.includes(file))unexpected.push(file);}
}
assert.deepEqual(unexpected,[]);
const indexPath=execFileSync('git',['rev-parse','--git-path','index'],{encoding:'utf8'}).trim();
assert.equal(sha(await readFile(indexPath)),before.indexHash);
const old=await readFile(base+'/before/source/ops.js','utf8'),current=await readFile('ops.js','utf8');
const awards=s=>s.slice(s.indexOf('  const AWARDS = ['),s.indexOf('  /* app-style achievement cards'));
assert.equal(awards(old),awards(current));
assert.equal(current.match(/const awardMult = .*;/)[0],old.match(/const awardMult = .*;/)[0]);
assert.equal((await readFile('sw.js','utf8')).replace('imi-v24','imi-v23'),await readFile(base+'/before/source/sw.js','utf8'));
const report={capturedAt:new Date().toISOString(),branch:execFileSync('git',['branch','--show-current'],{encoding:'utf8'}).trim(),changed,unexpected,indexUnchanged:true,awardsByteEqual:true,incomeByteEqual:true,swAssetsByteEqual:true,hashes,status:execFileSync('git',['status','--porcelain=v1'],{encoding:'utf8'})};
for(const log of ['tests-first','tests-c-first','tests-final','tests-final2']) {
  const bytes=await readFile(base+'/'+log+'.log');
  const text=bytes[0]===255&&bytes[1]===254?bytes.toString('utf16le'):bytes.toString('utf8');
  report[log]={sha256:sha(bytes),exit:(await readFile(base+'/'+log+'-exit.txt','utf8')).replace(/\uFEFF/g,'').trim(),tail:text.split(/\r?\n/).slice(-10)};
}
await writeFile(base+'/'+(process.argv[2]||'audit')+'.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log('Source/index/catalogue preservation PASS; '+changed.join(', '));
