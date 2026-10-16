// Output-only routing preserves exclusive evidence when a suite is repeated.
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import { syncBuiltinESMExports } from 'node:module';
const suffix = process.env.LG01_C_R2_REPEAT;
if (suffix && !/^[a-z0-9-]+$/.test(suffix)) throw Error('Invalid evidence suffix');
const route = name => !suffix || typeof name !== 'string' ? name : name
  .replace('/repair-b-r2/implementation-c-r2-', '/repair-b-r2/implementation-c-r2-' + suffix + '-')
  .replace('/fixture-implementation-c-r2-20261012/', '/fixture-implementation-c-r2-20261012/' + suffix + '-');
const sync = fs.writeFileSync, asyncWrite = fsp.writeFile;
fs.writeFileSync = (name,...args) => sync(route(name),...args);
fsp.writeFile = (name,...args) => asyncWrite(route(name),...args);
syncBuiltinESMExports();
