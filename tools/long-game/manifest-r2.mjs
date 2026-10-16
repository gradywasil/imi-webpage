// Seal only this repair's artifacts; original manifests remain read-only.
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const root = 'docs/plan/long-game/evidence/LG-00/repair-r2';
const output = process.argv[2] || root + '/manifest-r2.json';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const sources = {};
for (const file of ['ops.js', 'pickups.js', 'sw.js', 'tools/long-game.mjs', 'tools/long-game-bot.js',
  'tools/long-game/verify-chronology-r2.mjs', 'tools/long-game/verify-cold-r2.mjs', 'tools/long-game/verify-performance-r2.mjs',
  'tools/long-game/audit-parity-r2.mjs', 'tools/long-game/inspect-live-r2.mjs', 'tools/long-game/manifest-r2.mjs',
  'docs/plan/long-game/LG-00-results-r2.md', 'docs/plan/long-game/LG-00-foundations.md', 'docs/plan/long-game/LG-00-repair-r2.md']) {
  sources[file] = hash(await readFile(file));
}
const profiles = {};
for (const name of ['Regular', 'Regular-final', 'Hardcore', 'Casual', 'Away']) {
  const path = `${root}/${name}.json`, raw = JSON.parse(await readFile(path));
  profiles[name] = { path, sha256: hash(await readFile(path)), sourceHashes: raw.sourceHashes, wallSeconds: raw.wallSeconds,
    stopped: raw.stopped, horizonComplete: raw.horizonComplete, errors: raw.errors, httpErrors: raw.httpErrors,
    calendarMinutes: raw.report.calendarMinutes, activeMinutes: raw.report.activeMinutes,
    finiteComplete: raw.report.finiteComplete, endpoints: raw.report.endpoints, checkpoints: raw.checkpoints };
}
const files = {};
async function inventory(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) await inventory(path);
    else if (path !== output) files[path] = hash(await readFile(path));
  }
}
await inventory(root);
const parity = JSON.parse(await readFile(root + '/parity-audit.json'));
await writeFile(output, JSON.stringify({ capturedAt: new Date().toISOString(), workspace: process.cwd(), status: 'candidate for independent review',
  sources, profiles, parity: { path: root + '/parity-audit.json', pairs: parity.pairs.length, loadedSources: parity.loadedSources.length },
  screens: root + '/screens/stable/manifest.json', files }, null, 2) + '\n', { flag: 'wx' });
console.log({ output, files: Object.keys(files).length, finiteRegular: profiles['Regular-final'].finiteComplete });
