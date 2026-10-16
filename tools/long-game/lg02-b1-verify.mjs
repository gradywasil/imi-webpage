import { readFile, writeFile } from 'node:fs/promises';
import { Script } from 'node:vm';
import { createHash } from 'node:crypto';

const shells = ['index.html', 'classic.html', 'tools/balance.html'];
const receipt = { shells: {}, hashes: {} };
for (const path of [...shells, 'vault.js', 'sw.js']) {
  const text = await readFile(path, 'utf8');
  receipt.hashes[path] = createHash('sha256').update(text).digest('hex');
  if (path.endsWith('.html')) {
    const tags = [...text.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
    const sources = tags.map(match => /\bsrc="([^"]+)"/.exec(match[1])?.[1] || null);
    const reward = sources.findIndex(src => src?.endsWith('rewards.js'));
    if (sources[reward + 1] !== (path.startsWith('tools/') ? '../vault.js' : 'vault.js')) throw Error(`${path}: Vault placement`);
    for (const [i, tag] of tags.entries()) if (!sources[i]) new Script(tag[2], { filename: `${path}:inline-${i}` });
    receipt.shells[path] = { scripts: sources.filter(Boolean), inlineScriptsChecked: tags.filter((_, i) => !sources[i]).length };
  }
}
const sw = await readFile('sw.js', 'utf8');
if (!sw.includes("const VERSION = 'imi-v30';") || !sw.includes("'rewards.js', 'vault.js', 'economy.js'")) throw Error('Worker registration');
await writeFile(process.argv[2] || 'docs/plan/long-game/evidence/LG-02/implementation-b1/after/source-check.json', JSON.stringify(receipt, null, 2) + '\n', { flag: 'wx' });
