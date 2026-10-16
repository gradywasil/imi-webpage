import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const base = 'docs/plan/long-game/evidence/LG-00/', out = base + 'repair-r2/';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const original = JSON.parse(await readFile(base + 'manifest.json'));
const final = JSON.parse(await readFile(out + 'final-parity/manifest.json'));
const frozen = JSON.parse(await readFile(base + 'before/sources.json'));
const excluded = new Set(['capturedAt', 'sourceCommit', 'sourceHashes', 'url', 'wallSeconds']);
const canonical = raw => JSON.stringify(Object.fromEntries(Object.entries(raw).filter(([key]) => !excluded.has(key))), null, 2) + '\n';
const pairs = [], loadedSources = [];
for (const selected of final.reports) {
  const name = selected.name;
  const beforeRaw = base + 'before/' + name + '.raw.json';
  const afterDirectory = name === 'overnight-active-collect-2' ? 'final-retry-overnight2' : 'final-parity';
  const afterRaw = out + afterDirectory + '/' + name + '.raw.json';
  const before = await readFile(beforeRaw), after = await readFile(afterRaw);
  const b = JSON.parse(before), a = JSON.parse(after), bc = canonical(b), ac = canonical(a);
  const old = original.pairs.find(p => p.name === name);
  const beforeCanonical = base + 'before/' + name + '.canonical.json';
  const afterCanonical = out + afterDirectory + '/' + name + '.canonical.json';
  const row = { name, beforeRaw, afterRaw, beforeCanonical, afterCanonical, beforeRawHash: hash(before), afterRawHash: hash(after), canonicalHash: hash(bc), parity: bc === ac, complete: b.complete && a.complete, emptyErrors: !b.errors.length && !b.httpErrors.length && !a.errors.length && !a.httpErrors.length, originalRawIntact: hash(before) === old.beforeRawHash, receiptsMatch: bc === await readFile(beforeCanonical, 'utf8') && ac === await readFile(afterCanonical, 'utf8') };
  pairs.push(row);
  for (const [phase, raw] of [['before', b], ['after', a]]) for (const [path, received] of Object.entries(raw.sourceHashes)) {
    const file = path.slice(1), expected = phase === 'before' ? frozen[file] ?? hash(await readFile(file)) : final.identities[file] ?? hash(await readFile(file));
    loadedSources.push({ name, phase, file, received, expected, match: received === expected });
  }
}
assert.equal(pairs.length, 19);
assert.ok(pairs.every(p => p.parity && p.complete && p.emptyErrors && p.originalRawIntact && p.receiptsMatch));
assert.ok(loadedSources.every(s => s.match));
await writeFile(out + 'parity-audit.json', JSON.stringify({ excluded: [...excluded], pairs, loadedSources }, null, 2) + '\n', { flag: 'wx' });
console.log({ pairs: pairs.length, loadedSources: loadedSources.length, failures: 0 });
