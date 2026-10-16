// Repeat outputs only, retaining exclusive writes and every test/browser assertion.
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import {syncBuiltinESMExports} from 'node:module';
const suffix=process.env.LG01_REPAIR_REPEAT;
if(suffix&&!/^[a-z0-9-]+$/.test(suffix))throw Error('Invalid output suffix');
const route=name=>!suffix||typeof name!=='string'?name:name
  .replace('/repair-b-r2/repair-lg01-runtime-r3-','/repair-b-r2/repair-lg01-runtime-r3-'+suffix+'-')
  .replace('/fixture-repair-lg01-runtime-r3-20261012/','/fixture-repair-lg01-runtime-r3-20261012/'+suffix+'-');
const sync=fs.writeFileSync,asyncWrite=fsp.writeFile;
fs.writeFileSync=(name,...args)=>sync(route(name),...args);
fsp.writeFile=(name,...args)=>asyncWrite(route(name),...args);
syncBuiltinESMExports();
