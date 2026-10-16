// Output-only adapter for the two inspected immutable test writers.
const fs = require('node:fs');
const path = require('node:path');
const { syncBuiltinESMExports } = require('node:module');
const base = path.resolve('docs/plan/long-game/evidence/LG-02/implementation-b2-r2');
const fixture = path.resolve('docs/plan/long-game/evidence/LG-01/implementation-b');
const away = path.resolve('docs/plan/long-game/evidence/LG-01/repair-b-r2');
const routes = [];
const within = (file, root) => file === root || file.startsWith(root + path.sep);
function route(file, operation) {
  if (typeof file !== 'string') throw Error('Unsupported output path type');
  const original = path.resolve(file);
  let mapped;
  if (within(original, fixture)) {
    const relative = path.relative(fixture, original);
    if (relative && !/^fixture-[^\\/]+(?:[\\/]|$)/.test(relative)) throw Error('Unsupported historical fixture output: ' + original);
    mapped = path.join(base, 'test-outputs', 'fixture', relative);
  } else if (within(original, away)) {
    const relative = path.relative(away, original), phase = process.env.REPAIR_PHASE;
    if (relative && (!phase || !relative.startsWith(phase + '-') || /[\\/]/.test(relative))) throw Error('Unsupported historical away output: ' + original);
    mapped = path.join(base, 'test-outputs', 'away', relative);
  } else if (within(original, base)) mapped = original;
  else throw Error('Unleased output refused: ' + operation + ' ' + original);
  routes.push({operation, original, mapped});
  return mapped;
}
const syncWrite = fs.writeFileSync, mkdir = fs.promises.mkdir, asyncWrite = fs.promises.writeFile;
const recordOnly = process.env.LG02_B2_R2_RECORD === '1';
function exclusive(args) {
  const opts = args[1];
  args[1] = {...(typeof opts === 'object' ? opts : {encoding:opts}), flag:'wx'};
  return args;
}
fs.writeFileSync = function(file, ...args) { const mapped = route(file, 'writeFileSync'); if (!recordOnly) return syncWrite.call(this, mapped, ...exclusive(args)); };
fs.promises.mkdir = async function(file, ...args) { const mapped = route(file, 'mkdir'); if (!recordOnly) return mkdir.call(this, mapped, ...args); };
fs.promises.writeFile = async function(file, ...args) { const mapped = route(file, 'writeFile'); if (!recordOnly) return asyncWrite.call(this, mapped, ...exclusive(args)); };
syncBuiltinESMExports();
// The inspected writers need no other filesystem mutation methods.
for (const [owner, names] of [[fs, ['appendFileSync','mkdirSync','renameSync','copyFileSync','unlinkSync','rmSync','writeSync','openSync']], [fs.promises, ['appendFile','rename','copyFile','unlink','rm','open']]]) {
  for (const name of names) {
    const original = owner[name];
    owner[name] = function(file, ...args) {
      if (name === 'openSync' && (args[0] === 'r' || args[0] === undefined)) return original.call(this, file, ...args);
      const candidates=/^(rename|copyFile)/.test(name)?[file,args[0]]:[file];
      if (candidates.some(p=>typeof p==='string'&&(path.resolve(p).startsWith(fixture)||path.resolve(p).startsWith(away)))) throw Error('Unsupported historical operation: ' + name);
      return original.call(this, file, ...args);
    };
  }
}
syncBuiltinESMExports();
module.exports = {routes, route};
process.on('exit', () => syncWrite(path.join(base, `routes-${process.pid}.json`), JSON.stringify({recordOnly, routes}, null, 2) + '\n', {flag:'wx'}));
