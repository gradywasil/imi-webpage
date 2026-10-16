import fs from 'node:fs/promises';
import { spawnSync, execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import vm from 'node:vm';
const base='docs/plan/long-game/evidence/LG-02/implementation-a',sha=b=>createHash('sha256').update(b).digest('hex');
const suffix=process.argv[2]||'';if(!['','-r2'].includes(suffix))throw Error('Invalid audit suffix');
const leased=['rewards.js','economy.js','core.js','app.js','classic.js','pickups.js','tour.js','pixel-fx.js','classic-fx.js','ops.js','index.html','classic.html','tools/balance.html','ops.css','sw.js','docs/plan/long-game/LG-02A-save-recognition.md'];
const seal=JSON.parse(await fs.readFile(base+'/before/seal.json','utf8')),changed=[],readOnly=[],hashes={},served={};
for(const e of seal.entries) {
  if(e.absent)continue;
  assert.equal(sha(await fs.readFile(base+'/before/source/'+e.path)),e.sha256,'Frozen '+e.path);
  const current=sha(await fs.readFile(e.path));
  if(current!==e.sha256){assert.ok(leased.includes(e.path),'Read-only changed '+e.path);changed.push(e.path);}else readOnly.push(e.path);
}
for(const name of ['vault-save-gate.js',...leased.filter(p=>!p.startsWith('docs/'))]) {
  hashes[name]=sha(await fs.readFile(name));served[name]=sha(Buffer.from(await(await fetch('http://127.0.0.1:8173/'+name,{cache:'no-store'})).arrayBuffer()));assert.equal(served[name],hashes[name]);
  if(name!=='vault-save-gate.js'){const diff=spawnSync('git',['diff','--no-index','--',base+'/before/source/'+name,name],{encoding:'utf8'});assert.equal(diff.status,1);await fs.writeFile(base+'/'+name.replaceAll('/','-')+suffix+'.diff',diff.stdout,{flag:'wx'});}
}
// Verify whole existing bodies, including all awards/production/hold code, outside exact leased guards.
for(const name of ['app.js','classic.js','pickups.js','tour.js','pixel-fx.js','classic-fx.js','ops.js']) {
  const bytes=await fs.readFile(name,'utf8'),before=await fs.readFile(base+'/before/source/'+name,'utf8');assert.equal(bytes.replace('\n  if (window.VaultSaveGate?.blocked) return;',''),before,name+' startup-only');
}
const rewards=await fs.readFile('rewards.js','utf8');assert.equal(rewards.replace('window.VaultSaveGate?.blocked || !enabled','!enabled'),await fs.readFile(base+'/before/source/rewards.js','utf8'));
const css=await fs.readFile('ops.css','utf8'),oldCss=await fs.readFile(base+'/before/source/ops.css','utf8');assert.ok(css.startsWith(oldCss),'Normal CSS intact');
const syntax=[];for(const name of ['vault-save-gate.js',...leased.filter(p=>p.endsWith('.js'))]) {const r=spawnSync(process.execPath,['--check',name],{encoding:'utf8'});assert.equal(r.status,0);syntax.push({name,exit:r.status,stderr:r.stderr});}
for(const name of ['index.html','classic.html','tools/balance.html'])for(const m of (await fs.readFile(name,'utf8')).matchAll(/<script>([\s\S]*?)<\/script>/g))new vm.Script(m[1]);
const index=execFileSync('git',['ls-files','--stage'],{encoding:'utf8'});assert.equal(index,seal.index,'Index unchanged');
await fs.writeFile(base+'/audit-final'+suffix+'.json',JSON.stringify({at:new Date().toISOString(),branch:execFileSync('git',['branch','--show-current'],{encoding:'utf8'}).trim(),changed,readOnlyCount:readOnly.length,readOnly,hashes,served,syntax,indexUnchanged:true,opsAndWrapperBodiesExact:true,rewardEngineExact:true,ordinaryCssExact:true},null,2),{flag:'wx'});
console.log({changed,readOnly:readOnly.length,hashes,indexUnchanged:true});
