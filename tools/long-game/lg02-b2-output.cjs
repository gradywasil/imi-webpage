// Output-only routing for the immutable LG-01 fixture and away writers.
const fs = require('node:fs');
const path = require('node:path');
const { syncBuiltinESMExports } = require('node:module');
const base = path.resolve('docs/plan/long-game/evidence/LG-02/implementation-b2');
const fixture = path.resolve('docs/plan/long-game/evidence/LG-01/implementation-b');
const away = path.resolve('docs/plan/long-game/evidence/LG-01/repair-b-r2');
const routes = [];
const within = (file, root) => file === root || file.startsWith(root + path.sep);
function route(file, operation) {
  if (typeof file !== 'string') throw Error('Unsupported output path type');
  const original = path.resolve(file);
  let mapped = original;
  if (within(original, fixture)) {
    const relative = path.relative(fixture, original);
    if (relative && !/^fixture-[^\\/]+(?:[\\/]|$)/.test(relative)) throw Error('Unsupported historical fixture output: ' + original);
    mapped = path.join(base, 'test-outputs', 'fixture', relative);
  } else if (within(original, away)) {
    const relative = path.relative(away, original), phase = process.env.REPAIR_PHASE;
    if (relative && (!phase || !relative.startsWith(phase + '-') || /[\\/]/.test(relative))) throw Error('Unsupported historical away output: ' + original);
    mapped = path.join(base, 'test-outputs', 'away', relative);
  } else if (original.startsWith(fixture) || original.startsWith(away)) {
    throw Error('Unsupported historical sibling output: ' + original);
  }
  routes.push({ operation, original, mapped });
  return mapped;
}
const syncWrite = fs.writeFileSync, mkdir = fs.promises.mkdir, asyncWrite = fs.promises.writeFile;
const record = process.env.LG02_B2_ROUTE_RECORD === '1';
fs.writeFileSync = function(file, ...args) { const mapped = route(file, 'writeFileSync'); if (!record) return syncWrite.call(this, mapped, ...args); };
fs.promises.mkdir = async function(file, ...args) { const mapped = route(file, 'mkdir'); if (!record) return mkdir.call(this, mapped, ...args); };
fs.promises.writeFile = async function(file, ...args) { const mapped = route(file, 'writeFile'); if (!record) return asyncWrite.call(this, mapped, ...args); };
syncBuiltinESMExports();
// Callers use only these three inspected write methods; refuse other historical writers.
for (const name of ['appendFileSync', 'mkdirSync', 'renameSync', 'copyFileSync', 'unlinkSync', 'rmSync']) {
  const original = fs[name];
  fs[name] = function(file, ...args) { if (typeof file === 'string' && (within(path.resolve(file), fixture) || within(path.resolve(file), away))) throw Error('Unsupported historical operation: ' + name); return original.call(this, file, ...args); };
}
syncBuiltinESMExports();
module.exports = { routes, route };
process.on('exit', () => {
  const output = path.join(base, 'prerequisites-r1', `routes-${process.pid}.json`);
  syncWrite.call(fs, output, JSON.stringify({ recordOnly:record, routes }, null, 2) + '\n', { flag:'wx' });
});
