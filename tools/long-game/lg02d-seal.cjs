const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),cp=require('node:child_process'),assert=require('node:assert/strict'),vm=require('node:vm');
const root=process.cwd(),out=path.resolve('docs/plan/long-game/evidence/LG-02/free-lamp-r1');
const product=['vault-play.js','vault.js','vault-save-gate.js','rewards.js','ops.js','pickups.js','core.js','ops.css','index.html','classic.html','tools/balance.html','sw.js'];
const hash=b=>crypto.createHash('sha256').update(b).digest('hex'),write=(n,v)=>fs.writeFileSync(path.join(out,n),JSON.stringify(v,null,2)+'\n',{flag:'wx'});
function run(name,args,cwd=root){const r=cp.spawnSync(process.execPath,args,{cwd,encoding:'utf8',timeout:240000});write(name,{command:[process.execPath,...args],cwd,status:r.status,signal:r.signal,stdout:r.stdout,stderr:r.stderr,error:r.error?.message});assert.equal(r.status,0,name);return r;}
for(const f of product.filter(f=>f.endsWith('.js')))run('syntax-'+path.basename(f)+'.json',['--check',f]);
for(const f of ['index.html','classic.html','tools/balance.html']){
  const text=fs.readFileSync(f,'utf8'),scripts=[...text.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)];
  scripts.filter(m=>!m[1].includes('src=')).forEach(m=>new vm.Script(m[2],{filename:f}));
  const ordered=['vault.js','vault-play.js','vault-save-gate.js','rewards.js','economy.js'];
  assert(ordered.every((s,i)=>!i||text.indexOf(s)>text.indexOf(ordered[i-1])));
}
write('shell-order-inline.json',{passed:true,shells:['index.html','classic.html','tools/balance.html'],cache:'imi-v74',newAsset:fs.readFileSync('sw.js','utf8').includes("'vault-play.js'")});
run('focused-tests.json',['--test','tests/vault-lamp.test.cjs','tests/vault-lamp-admission.test.cjs']);
run('final-control-command.json',['tools/long-game/lg02d-default.cjs','final']);
assert(fs.readFileSync(path.join(out,'before-default.json')).equals(fs.readFileSync(path.join(out,'final-default.json'))));
write('default-byte-comparison.json',{equal:true,before:hash(fs.readFileSync(path.join(out,'before-default.json'))),final:hash(fs.readFileSync(path.join(out,'final-default.json'))),scope:'Fresh five simulated minutes, seed1 active/collect activeMinutes5; full report/meta/errors bytes, no exclusions. Not a full-hour or all-profile comparison.'});
const before=JSON.parse(fs.readFileSync(path.join(out,'before-source.json'))),unchanged={};
for(const [f,v]of Object.entries(before))if(!product.includes(f)){unchanged[f]={before:v.sha256,after:hash(fs.readFileSync(f))};assert.equal(unchanged[f].before,unchanged[f].after,f);}
write('unchanged-owners.json',unchanged);
const workspace=fs.mkdtempSync(path.join(os.tmpdir(),'lg02d-reconstruction-'));
for(const side of ['a','b','reconstructed'])fs.mkdirSync(path.join(workspace,side));
for(const f of product){
  const source=path.join(out,'before',f);
  if(fs.existsSync(source))for(const side of ['a','reconstructed']){const dest=path.join(workspace,side,f);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(source,dest);}
  const dest=path.join(workspace,'b',f);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(f,dest);
  const frozen=path.join(out,'source',f);fs.mkdirSync(path.dirname(frozen),{recursive:true});fs.writeFileSync(frozen,fs.readFileSync(f),{flag:'wx'});
}
const diff=cp.spawnSync('git',['-c','core.autocrlf=false','diff','--no-index','--binary','--src-prefix=','--dst-prefix=','a','b'],{cwd:workspace});assert.equal(diff.status,1);fs.writeFileSync(path.join(out,'task.patch'),diff.stdout,{flag:'wx'});
const checks=[];
for(const args of [['-c','core.autocrlf=false','apply','--check',path.join(out,'task.patch')],['-c','core.autocrlf=false','apply',path.join(out,'task.patch')]]){const r=cp.spawnSync('git',args,{cwd:path.join(workspace,'reconstructed'),encoding:'utf8'});checks.push({command:['git',...args],status:r.status,stdout:r.stdout,stderr:r.stderr});assert.equal(r.status,0);}
for(const f of product)assert(fs.readFileSync(f).equals(fs.readFileSync(path.join(workspace,'reconstructed',f))),f);
write('patch-reconstruction.json',{workspace,checks,paths:product,allByteEqual:true,patchSha256:hash(diff.stdout),baseline:'Captured dirty bytes, not HEAD. Reconstruction outside the checkout. Directory retained, no recursive deletion.'});
const helpers=fs.readdirSync('tools/long-game').filter(n=>n.startsWith('lg02d-')).map(n=>'tools/long-game/'+n);
const files=[...product,'tests/vault-lamp.test.cjs','tests/vault-lamp-admission.test.cjs',...helpers];
write('source-final.json',Object.fromEntries(files.map(f=>[f,{bytes:fs.statSync(f).size,sha256:hash(fs.readFileSync(f))}])));
const identities={};for(const run of ['cap-final','failure-pixel-final','failure-classic-final','undo-final']){
  const loaded=JSON.parse(fs.readFileSync(path.join(out,run+'-sources-errors.json'))),mismatches=[];
  for(const [url,h]of Object.entries(loaded.sources)){const f=path.join(root,url.replace(/^\//,''));if(fs.existsSync(f)&&hash(fs.readFileSync(f))!==h)mismatches.push(url);}
  identities[run]={errors:loaded.errors,mismatches};
}assert.deepEqual(identities['cap-final'].mismatches,[]);write('loaded-source-comparison.json',identities);
write('final-status.json',{branch:cp.execFileSync('git',['branch','--show-current'],{encoding:'utf8'}).trim(),head:cp.execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),status:cp.execFileSync('git',['status','--porcelain=v1'],{encoding:'utf8'}),index:hash(fs.readFileSync('.git/index')),cachedDiff:cp.execFileSync('git',['diff','--cached','--stat'],{encoding:'utf8'})});
console.log('Final syntax/inline/order, focused tests, five-minute byte equality, unchanged owners and outside-checkout raw patch reconstruction PASS');
