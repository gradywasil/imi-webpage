import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
const out = 'docs/plan/long-game/evidence/LG-02/implementation-b2-r2';
const sha = b => createHash('sha256').update(b).digest('hex');
const git = (...args) => execFileSync('git', args, {encoding:'utf8'});
const write = (name, value) => fs.writeFileSync(out + '/' + name, JSON.stringify(value, null, 2) + '\n', {flag:'wx'});
const files = [];
function walk(root) {
  if (!fs.existsSync(root)) return;
  for (const entry of fs.readdirSync(root, {withFileTypes:true})) {
    const file = root + '/' + entry.name;
    if (entry.isDirectory()) walk(file); else files.push(file);
  }
}
for (const root of ['tests', 'tools/long-game']) walk(root);
const sources = ['rewards.js','ops.js','core.js','vault.js','sw.js','economy.js','vault-save-gate.js','pickups.js','world.js','index.html','classic.html','tools/balance.html','tools/balance.mjs','tools/bot.js'];
const identities = {};
fs.mkdirSync(out + '/before/source', {recursive:true});
for (const file of [...sources, ...files.filter(f => /\.(?:cjs|mjs|html)$/.test(f))]) {
  const bytes = fs.readFileSync(file); identities[file] = {sha256:sha(bytes), bytes:bytes.length};
  if (sources.includes(file)) {
    const target = out + '/before/source/' + file;
    fs.mkdirSync(path.dirname(target), {recursive:true});
    if (fs.existsSync(target)) { if (!fs.readFileSync(target).equals(bytes)) throw Error('Frozen source differs: ' + file); }
    else fs.writeFileSync(target, bytes, {flag:'wx'});
  }
}
const index = git('rev-parse','--git-path','index').trim();
write('before/source-seal.json', {at:new Date().toISOString(), cwd:process.cwd(), branch:git('branch','--show-current').trim(), head:git('rev-parse','HEAD').trim(), status:git('status','--porcelain=v1'), indexSha256:sha(fs.readFileSync(index)), staged:git('diff','--cached','--binary'), identities});
const historicalRoots = ['docs/plan/long-game/evidence/LG-01/implementation-b','docs/plan/long-game/evidence/LG-01/repair-b-r2','docs/plan/long-game/evidence/LG-02/implementation-b2'];
files.length = 0;
for (const root of historicalRoots) walk(root);
const inventory = {at:new Date().toISOString(), roots:historicalRoots.map(root => ({root, exists:fs.existsSync(root)})), files:files.map(file => {const b = fs.readFileSync(file); return {file, bytes:b.length, sha256:sha(b)};})};
write('historical-risk-inventory.json', inventory);
const raw = fs.readFileSync(out + '/historical-risk-inventory.json');
const readback = JSON.parse(raw);
if (readback.files.length !== inventory.files.length) throw Error('Inventory readback mismatch');
write('historical-risk-inventory-readback.json', {sha256:sha(raw), bytes:raw.length, files:readback.files.length, roots:readback.roots});
console.log(JSON.stringify({sources:Object.keys(identities).length, historicalFiles:readback.files.length, inventorySha256:sha(raw)}));
