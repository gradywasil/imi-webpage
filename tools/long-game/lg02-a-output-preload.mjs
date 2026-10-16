// Redirect only this run's immutable LG01 helpers' output leaves, never inputs or assertions.
import fs from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
const fixture = 'docs/plan/long-game/evidence/LG-01/implementation-b/fixture-lg02-a-implementation-r1-20261012';
const qa = 'docs/plan/long-game/evidence/LG-01/repair-b-r2/qa-lg02-a-implementation-r1-20261012-';
const target = path => typeof path !== 'string' ? path : path.startsWith(fixture) ?
  'tools/long-game/fixture-lg02-a-implementation-r1-20261012' + path.slice(fixture.length) : path.startsWith(qa) ?
  'tools/long-game/qa-lg02-a-implementation-r1-20261012-' + path.slice(qa.length) : path;
for(const name of ['writeFileSync','mkdirSync']) { const original=fs[name];fs[name]=function(path,...args){return original.call(this,target(path),...args);}; }
for(const name of ['writeFile','mkdir']) { const original=fs.promises[name];fs.promises[name]=function(path,...args){return original.call(this,target(path),...args);}; }
syncBuiltinESMExports();
