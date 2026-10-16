import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import vm from 'node:vm';
const base = 'docs/plan/long-game/evidence/LG-01/implementation-a';
const json = async path => JSON.parse((await readFile(path, 'utf8')).replace(/^\uFEFF/, ''));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const seal = await json(`${base}/before/seal.json`);
const sources = ['rewards.js', 'economy.js', 'core.js', 'app.js', 'classic.js', 'ops.js', 'ops.css', 'index.html', 'classic.html', 'tools/balance.html', 'sw.js', 'tour.js', 'pickups.js', 'pixel-fx.js', 'classic-fx.js'];
const identities = {}, checks = [];
for (const path of [...sources, 'tools/long-game/lg01-a-canonical.mjs', 'tools/long-game/lg01-a-receipt.mjs']) {
  const bytes = await readFile(path); identities[path] = hash(bytes);
  const destination = `${base}/candidate/source/${path}`;
  await mkdir(destination.slice(0, destination.lastIndexOf('/')), { recursive: true });
  await copyFile(path, destination);
  if (/\.m?js$/.test(path)) { const result = spawnSync(process.execPath, ['--check', path], { encoding: 'utf8' }); assert.equal(result.status, 0, result.stderr); checks.push(path); }
  if (path.endsWith('.html')) for (const [, body] of bytes.toString().matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)) new vm.Script(body, { filename: path });
}
const preserved = [];
for (const file of seal.files) {
  assert.equal(hash(await readFile(`${base}/before/source/${file.path}`)), file.sha256);
  if (!sources.includes(file.path)) { assert.equal(hash(await readFile(file.path)), file.sha256, file.path); preserved.push(file.path); }
}
const functionSource = { coreBoot: 'core.js', loadScore: 'economy.js', loadState: 'economy.js', scoreAck: 'economy.js', tick: 'ops.js', saveAck: 'ops.js', resume: 'ops.js', credit: 'core.js' };
for (const edition of ['pixel', 'classic']) {
  const native = (await json(`${base}/native-candidate-identity-${edition}.json`)).result.structuredContent.value;
  for (const [path, identity] of Object.entries(native.hashes)) assert.equal(identity, identities[path], edition + ': ' + path);
  for (const [name, source] of Object.entries(functionSource)) assert.ok((await readFile(source, 'utf8')).includes(native.loadedFunctions[name]), edition + ': loaded ' + name);
}
const before = await json(`${base}/before/hour-active-collect-1.raw.json`), candidate = await json(`${base}/disabled-candidate.raw.json`);
for (const [raw, final] of [[before, false], [candidate, true]]) {
  assert.equal(raw.complete, true); assert.equal(raw.actualMinutes, 60); assert.deepEqual(raw.errors, []); assert.deepEqual(raw.httpErrors, []);
  for (const [url, identity] of Object.entries(raw.sourceHashes)) { const path = url.slice(1), expected = final ? hash(await readFile(path)) : seal.files.find(file => file.path === path)?.sha256; if (expected) assert.equal(identity, expected, url); }
}
assert.equal(await readFile(`${base}/before/hour-active-collect-1.canonical.json`, 'utf8'), await readFile(`${base}/disabled-candidate.canonical.json`, 'utf8'));
const git = args => spawnSync('git', args, { encoding: 'utf8' }).stdout.trim();
assert.equal(git(['branch', '--show-current']), 'long-game'); assert.equal(git(['diff', '--cached', '--name-only']), seal.staged.join('\n'));
await writeFile(`${base}/candidate/receipt.json`, JSON.stringify({ identities, syntaxChecks: checks, inlineScriptsParsed: true, preservedSealedReadOnlySources: preserved, nativeServedAndLoadedFunctionsMatch: true, completeSixtyMinuteParity: true, branch: git(['branch', '--show-current']), status: git(['status', '--porcelain=v1']), staged: git(['diff', '--cached', '--name-only']) }, null, 2) + '\n', { flag: 'wx' });
console.log('Candidate source, native function identities, syntax, preserved sources and complete canonical parity PASS');
