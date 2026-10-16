// Audit the retained evidence and select complete final-source parity receipts.
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const base = 'docs/plan/long-game/evidence/LG-00';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const json = async path => JSON.parse(await readFile(path, 'utf8'));
const before = await json(`${base}/before/manifest.json`), pairs = [];
for (const report of before.reports) {
  const name = report.name, retry = name === 'hour-active-hoard-1' ? 'after-retry-hoard1' : name === 'hour-active-hoard-3' ? 'after-retry-hoard3' : 'after-render-fix';
  const raw = `${base}/${retry}/${name}.raw.json`, canonical = `${base}/${retry}/${name}.canonical.json`, result = await json(raw);
  assert.equal(result.complete, true, name); assert.deepEqual(result.errors, []); assert.deepEqual(result.httpErrors, []);
  assert.deepEqual(await readFile(canonical), await readFile(report.canonicalPath), name);
  assert.equal(result.sourceHashes['/ops.js'], hash(await readFile('ops.js')));
  pairs.push({ name, beforeRaw: report.rawPath, beforeRawHash: report.rawHash, beforeCanonical: report.canonicalPath, canonicalHash: report.canonicalHash, afterRaw: raw, afterRawHash: hash(await readFile(raw)), afterCanonical: canonical, parity: true });
}
const profiles = {};
for (const name of ['Casual', 'Regular', 'Hardcore', 'Away']) {
  const path = `${base}/profiles/${name}-render-fix.json`, r = await json(path);
  profiles[name] = { path, sourceHashes: r.sourceHashes, horizonComplete: r.horizonComplete, stopped: r.stopped, errors: r.errors, httpErrors: r.httpErrors, calendarMinutes: r.report.calendarMinutes, activeMinutes: r.report.activeMinutes, endpoints: r.report.endpoints, finiteComplete: r.report.finiteComplete, capSeconds: [...new Set(r.report.away.map(a => a.capSeconds))], efficiencies: [...new Set(r.report.away.map(a => a.efficiency))] };
}
const inventory = [];
async function walk(dir) { for (const entry of await readdir(dir, { withFileTypes: true })) { const path = dir + '/' + entry.name; if (entry.isDirectory()) await walk(path); else if (path !== `${base}/manifest.json`) { const bytes = await readFile(path); inventory.push({ path, bytes: bytes.length, sha256: hash(bytes) }); } } }
await walk(base);
const sourceFiles = ['ops.js', 'pickups.js', 'sw.js', 'tools/bot.js', 'tools/balance.mjs', 'tools/balance.html', 'tools/long-game.mjs', 'tools/long-game-bot.js', ...(await readdir('tools/long-game')).filter(p => p.endsWith('.mjs')).map(p => 'tools/long-game/' + p)];
const sources = Object.fromEntries(await Promise.all(sourceFiles.map(async path => [path, hash(await readFile(path))])));
await writeFile(`${base}/manifest.json`, JSON.stringify({ status: 'candidate for manager acceptance', capturedAt: new Date().toISOString(), sources, canonicalExcluded: before.excluded, pairs, profiles, screenshots: `${base}/screens/headless-final-isolated/manifest.json`, inventory }, null, 2) + '\n');
console.log(JSON.stringify({ parityPairs: pairs.length, sources, profiles }));
