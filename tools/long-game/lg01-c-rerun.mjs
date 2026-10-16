// Redirect only output names so the first run's exclusive artifacts remain intact.
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import { syncBuiltinESMExports } from 'node:module';
const route = name => typeof name !== 'string' ? name : name
  .replace('/repair-b-r2/implementation-c-', '/repair-b-r2/implementation-c-' + (process.env.LG01_C_REPEAT || 'rerun') + '-')
  .replace('/fixture-implementation-c-20261012/', '/fixture-implementation-c-20261012/' + (process.env.LG01_C_REPEAT || 'rerun') + '-');
const sync = fs.writeFileSync, asyncWrite = fsp.writeFile;
fs.writeFileSync = (name,...args) => sync(route(name),...args);
fsp.writeFile = (name,...args) => asyncWrite(route(name),...args);
syncBuiltinESMExports();
