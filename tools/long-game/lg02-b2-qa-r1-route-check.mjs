import fs from 'node:fs';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import path from 'node:path';
import router from './lg02-b2-qa-r1-output.cjs';
const roots=['LG-01/implementation-b','LG-01/repair-b-r2','LG-02/implementation-b2-r2','LG-02/tutorial-repair-b2-r3'].map(p=>'docs/plan/long-game/evidence/'+p);
const run=process.pid;
for(const root of roots)await mkdir(root,{recursive:true});
await mkdir(roots[0]+'/fixture-route-'+run+'/nested',{recursive:true});
const files=[roots[0]+'/fixture-route-'+run+'/sync.json',path.resolve(roots[0]+'/fixture-route-'+run+'/nested/async.json'),roots[1]+'/'+process.env.REPAIR_PHASE+'-'+run+'-probe.json',roots[2]+'/qa-route-'+run+'.json',roots[3]+'/qa-route-'+run+'.json'];
for(const [i,file]of files.entries()){
  if(i%2)await writeFile(file,'sentinel');else fs.writeFileSync(file,'sentinel');
  assert.throws(()=>fs.writeFileSync(file,'overwrite'),/EEXIST/);
  await assert.rejects(writeFile(file,'overwrite'),/EEXIST/);
  assert.equal(fs.readFileSync(router.route(file,'verify'),'utf8'),'sentinel');
}
for(const file of [roots[0]+'/unleased.json',roots[0]+'-sibling/a.json',roots[1]+'/old.json',roots[1]+'/'+process.env.REPAIR_PHASE+'-nested/a.json'])assert.throws(()=>fs.writeFileSync(file,'refused'));
for(const fn of [()=>fs.renameSync(files[0],files[0]+'.moved'),()=>fs.unlinkSync(files[0]),()=>fs.mkdirSync(roots[0]+'/unsupported'),()=>fs.appendFileSync(files[0],'bad'),()=>fs.openSync(files[0],'w')])assert.throws(fn,/Unsupported mutation/);
assert.throws(()=>fs.promises.rename(files[0],files[0]+'.moved'),/Unsupported mutation/);
const h=await import('./lg01-b-fixture.mjs');
await h.capture({page:{evaluate:async()=>({routingProbe:true})},hashes:{},errors:[]},'qa-route-probe');
fs.writeFileSync('docs/plan/long-game/evidence/LG-02/qa-runtime-b2-r1/route-check-'+run+'.json',JSON.stringify({passed:true,actualSyncAndPromises:true,collisions:10,unsupported:10,immutableWriter:true,gameplayProof:false,routes:router.routes},null,2));
console.log('Exclusive router checks passed');
