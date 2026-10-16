import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { dirname } from 'node:path';
const base = 'docs/plan/long-game/evidence/LG-02/implementation-a';
const git = (...args) => execFileSync('git', args, { encoding:'utf8' });
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const files = [...new Set(git('ls-files', '-z', '--cached', '--others', '--exclude-standard').split('\0').filter(Boolean))]
  .filter(p => !p.startsWith(base + '/') && !p.includes('lg02-a-'));
await mkdir(base + '/before/source', { recursive:true });
const entries = [];
for (const path of files) {
  const bytes = await readFile(path).catch(() => null);
  if (!bytes) { entries.push({ path, absent:true }); continue; }
  const target = base + '/before/source/' + path;
  await mkdir(dirname(target), { recursive:true }); await copyFile(path, target);
  entries.push({ path, bytes:bytes.length, sha256:hash(bytes) });
}
await writeFile(base + '/before/seal.json', JSON.stringify({ capturedAt:new Date().toISOString(), branch:git('branch','--show-current').trim(), head:git('rev-parse','HEAD').trim(), status:git('status','--porcelain=v1'), index:git('ls-files','--stage'), entries },null,2), { flag:'wx' });
console.log(JSON.stringify({ files:entries.length, bytes:entries.reduce((n,e)=>n+(e.bytes||0),0), base }));
