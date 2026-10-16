const fs = require('node:fs');
const path = require('node:path');
const { syncBuiltinESMExports } = require('node:module');

const oldFixture = path.resolve('docs/plan/long-game/evidence/LG-01/implementation-b');
const oldAway = path.resolve('docs/plan/long-game/evidence/LG-01/repair-b-r2');
const target = path.resolve('docs/plan/long-game/evidence/LG-02/repair-runtime-b1-r2/test-outputs');
const routes = [];
function route(file, operation) {
  const original = path.resolve(file);
  let mapped = original;
  if (path.dirname(original) === oldFixture && path.basename(original).startsWith('fixture-') && operation === 'mkdir')
    mapped = path.join(target, 'fixture', path.basename(original));
  else if (original.startsWith(oldFixture + path.sep) && path.basename(path.dirname(original)).startsWith('fixture-'))
    mapped = path.join(target, 'fixture', path.basename(path.dirname(original)), path.basename(original));
  else if (path.dirname(original) === oldAway && path.basename(original).startsWith(process.env.REPAIR_PHASE + '-'))
    mapped = path.join(target, 'away', path.basename(original));
  else if ((original.startsWith(oldFixture + path.sep) || original.startsWith(oldAway + path.sep)) && operation !== 'read')
    throw Error(`Historical output refused: ${operation} ${original}`);
  if (mapped !== original) routes.push({ operation, original, mapped });
  return mapped;
}
const originalWrite = fs.writeFileSync;
fs.writeFileSync = function(file, ...args) { return originalWrite.call(this, route(file, 'write'), ...args); };
const originalMkdir = fs.promises.mkdir;
fs.promises.mkdir = function(file, ...args) { return originalMkdir.call(this, route(file, 'mkdir'), ...args); };
const originalAsyncWrite = fs.promises.writeFile;
fs.promises.writeFile = function(file, ...args) { return originalAsyncWrite.call(this, route(file, 'write'), ...args); };
syncBuiltinESMExports();
process.on('exit', () => {
  if (routes.length) originalWrite.call(fs, path.join(target, `routes-${process.pid}.json`), JSON.stringify(routes, null, 2) + '\n', { flag: 'wx' });
});
