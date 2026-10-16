import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const base = 'docs/plan/long-game/evidence/LG-01/repair-runtime-r3/before';
const git = (...args) => execFileSync('git', args, { encoding:'utf8' });
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const files = ['rewards.js','ops.js','ops.css','sw.js','core.js','economy.js','app.js','classic.js','index.html','classic.html','pickups.js','tour.js','pixel-fx.js','classic-fx.js','tools/balance.html','tools/bot.js','tools/long-game-bot.js',...git('ls-files','--cached','--others','--exclude-standard','tests','tools/long-game').trim().split('\n')];
const hashes = {}, served = {};
for (const file of new Set(files)) {
  const bytes = await readFile(file); hashes[file] = sha(bytes);
  await mkdir(base+'/source/'+file.split('/').slice(0,-1).join('/'),{recursive:true});
  await writeFile(base+'/source/'+file,bytes,{flag:'wx'});
  if (['rewards.js','ops.js','ops.css','sw.js','core.js','economy.js','index.html','classic.html'].includes(file)) {
    served[file] = sha(Buffer.from(await (await fetch('http://127.0.0.1:8162/'+file)).arrayBuffer()));
    if (served[file] !== hashes[file]) throw Error('Served mismatch: '+file);
  }
}
const index = await readFile(git('rev-parse','--git-path','index').trim());
await writeFile(base+'/index.bin',index,{flag:'wx'});
await writeFile(base+'/seal.json',JSON.stringify({capturedAt:new Date().toISOString(),cwd:process.cwd(),branch:git('branch','--show-current').trim(),head:git('rev-parse','HEAD').trim(),status:git('status','--porcelain=v1'),staged:git('diff','--cached','--binary'),indexHash:sha(index),hashes,served},null,2)+'\n',{flag:'wx'});
console.log('Fresh source bytes/status/index and served hashes sealed.');
