const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto'), cp = require('node:child_process');
const out = 'docs/plan/long-game/evidence/LG-02/free-lamp-r1';
const product = ['vault-play.js','vault.js','vault-save-gate.js','rewards.js','ops.js','pickups.js','core.js','ops.css','index.html','classic.html','tools/balance.html','sw.js'];
const hash = b => crypto.createHash('sha256').update(b).digest('hex');
const write = (n,v) => fs.writeFileSync(path.join(out,n),JSON.stringify(v,null,2)+'\n',{flag:'wx'});
const inputs = [...product.filter(f=>fs.existsSync(f)), 'economy.js','app.js','classic.js','tour.js','automation.js','layers.js','estate.js','archive.js','folio.js','works.js','works-play.js','awards-catalogue.js','production-goal.js','training-pool.js','minigame-progression.js','commission-board.js','hall.js','seasons.js','tools/bot.js','tools/balance.mjs'];
if (process.argv[2] === 'before') {
  fs.mkdirSync(path.join(out,'before'),{recursive:true});
  for(const f of inputs) {const dest=path.join(out,'before',f);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,fs.readFileSync(f),{flag:'wx'});}
  write('before-source.json',Object.fromEntries(inputs.map(f=>[f,{bytes:fs.statSync(f).size,sha256:hash(fs.readFileSync(f))}])));
  write('before-status.json',{branch:cp.execFileSync('git',['branch','--show-current'],{encoding:'utf8'}).trim(),head:cp.execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),status:cp.execFileSync('git',['status','--porcelain=v1'],{encoding:'utf8'}),index:hash(fs.readFileSync('.git/index')),absent:product.filter(f=>!fs.existsSync(f))});
}
