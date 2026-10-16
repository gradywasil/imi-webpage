import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const base = 'docs/plan/long-game/evidence/LG-01/implementation-c/before';
await mkdir(base + '/source', { recursive:true });
const git = (...args) => execFileSync('git', args, { encoding:'utf8' });
const files = [...new Set([...git('ls-files').trim().split('\n'), ...git('ls-files','--others','--exclude-standard').trim().split('\n')])]
  .filter(path => path && !path.startsWith('docs/plan/long-game/evidence/') && !path.startsWith('.claude/'));
const hashes = {};
for (const path of files) hashes[path] = createHash('sha256').update(await readFile(path)).digest('hex');
for (const path of ['rewards.js','ops.js','ops.css','sw.js','core.js','economy.js','index.html','classic.html','tools/balance.html','tools/bot.js','tools/long-game-bot.js']) {
  await mkdir(base + '/source/' + path.split('/').slice(0,-1).join('/'), { recursive:true });
  await writeFile(base + '/source/' + path, await readFile(path), { flag:'wx' });
}
const index = await readFile(git('rev-parse','--git-path','index').trim());
await writeFile(base + '/index.bin', index, { flag:'wx' });
await writeFile(base + '/seal.json', JSON.stringify({ capturedAt:new Date().toISOString(), cwd:process.cwd(), branch:git('branch','--show-current').trim(), head:git('rev-parse','HEAD').trim(), status:git('status','--porcelain=v1'), staged:git('diff','--cached','--binary'), indexHash:createHash('sha256').update(index).digest('hex'), hashes },null,2)+'\n', { flag:'wx' });
console.log('Pre-edit source/index/status sealed; evidence and unrelated .claude excluded from inventory.');
