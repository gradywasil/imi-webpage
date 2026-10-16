const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto'), cp = require('node:child_process');
const out = 'docs/plan/long-game/evidence/LG-02/tutorial-repair-b2-r3';
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const git = (...args) => cp.execFileSync('git', args, {encoding:'utf8',maxBuffer:16*1024*1024}).trim();
const write = (name, value) => fs.writeFileSync(out+'/'+name, JSON.stringify(value,null,2)+'\n', {flag:'wx'});
const phase = process.argv[2];
if (phase === 'before') {
  fs.mkdirSync(out+'/before', {recursive:true});
  const files = [...new Set(git('ls-files','--cached','--others','--exclude-standard').split('\n'))].filter(f => fs.existsSync(f) && fs.statSync(f).isFile() && !f.startsWith('.claude/') && !f.startsWith(out+'/') && !f.includes('lg02-b2-r3-'));
  const inventory = files.map(file => ({file, bytes:fs.statSync(file).size, sha256:hash(file)}));
  const index = git('rev-parse','--git-path','index');
  for (const file of ['tour.js','sw.js']) fs.copyFileSync(file,out+'/before/'+file,fs.constants.COPYFILE_EXCL);
  write('before/source-seal.json',{time:new Date().toISOString(),head:git('rev-parse','HEAD'),branch:git('branch','--show-current'),status:git('status','--short'),index:path.resolve(index),indexSha256:hash(index),staged:git('diff','--cached','--binary'),inventory});
  console.log(JSON.stringify({files:inventory.length,runtime:inventory.filter(r=>['core.js','ops.js','rewards.js','vault.js'].includes(r.file))}));
} else if (phase === 'after') {
  const before=JSON.parse(fs.readFileSync(out+'/before/source-seal.json'));
  const permitted=new Set(['tour.js','sw.js','docs/plan/long-game/LG-02B2-tutorial-repair-r3.md']);
  const drift=before.inventory.filter(r=>!permitted.has(r.file)&&(!fs.existsSync(r.file)||hash(r.file)!==r.sha256));
  write('final-readback-audit.json',{time:new Date().toISOString(),head:git('rev-parse','HEAD'),branch:git('branch','--show-current'),indexUnchanged:hash(before.index)===before.indexSha256,readOnlyCount:before.inventory.length-permitted.size,drift,runtime:['core.js','ops.js','rewards.js','vault.js','tour.js','sw.js'].map(file=>({file,sha256:hash(file)}))});
  console.log(JSON.stringify({drift,indexUnchanged:hash(before.index)===before.indexSha256}));
}
