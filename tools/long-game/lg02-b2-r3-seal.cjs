const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process'),assert=require('node:assert/strict');
const out='docs/plan/long-game/evidence/LG-02/tutorial-repair-b2-r3',hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const read=file=>JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''));
const before=read(out+'/before/source-seal.json');assert.equal(hash(before.index),before.indexSha256);
const runtime=['core.js','ops.js','rewards.js','vault.js'].map(file=>({file,sha256:hash(file)}));
for(const row of runtime)assert.equal(row.sha256,before.inventory.find(r=>r.file===row.file).sha256);
assert.equal(fs.readFileSync(out+'/before/sw.js','utf8').replace("'imi-v32'","'imi-v33'"),fs.readFileSync('sw.js','utf8'));
const r2=read('docs/plan/long-game/evidence/LG-02/implementation-b2-r2/handoff-close-seal.json');
const r2Drift=r2.artifacts.filter(r=>!fs.existsSync(r.file)||hash(r.file)!==r.sha256);assert.deepEqual(r2Drift,[]);
const helpers=fs.readdirSync('tools/long-game').filter(n=>/^lg02-b2-r3-.*\.(cjs|mjs)$/.test(n)).map(n=>'tools/long-game/'+n);
for(const file of [...helpers,'tests/tour-save-hold.test.cjs']){const dest=out+'/closing-source/'+file;fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(file,dest,fs.constants.COPYFILE_EXCL);}
const artifacts=[];
function walk(root){for(const entry of fs.readdirSync(root,{withFileTypes:true})){const file=path.join(root,entry.name);if(entry.isDirectory())walk(file);else{if(entry.name==='dispatch.json')continue;if(entry.name.endsWith('.json'))read(file);artifacts.push({file:file.replaceAll('\\','/'),bytes:fs.statSync(file).size,sha256:hash(file)});}}}
walk(out);
const result={at:new Date().toISOString(),status:'REPAIR CANDIDATE FOR INDEPENDENT WHOLE-B2 REVIEW',head:cp.execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),indexUnchanged:true,runtime,r2SealedRecords:r2.artifacts.length,r2Drift,task:{file:'docs/plan/long-game/LG-02B2-tutorial-repair-r3.md',sha256:hash('docs/plan/long-game/LG-02B2-tutorial-repair-r3.md')},artifacts};
fs.writeFileSync(out+'/closing-seal.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});
assert.deepEqual(artifacts.filter(r=>hash(r.file)!==r.sha256),[]);
console.log(JSON.stringify({artifacts:artifacts.length,r2SealedRecords:r2.artifacts.length,r2Drift:0,indexUnchanged:true,status:result.status}));
