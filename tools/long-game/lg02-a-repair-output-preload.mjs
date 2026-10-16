import fs from 'node:fs';
import {syncBuiltinESMExports} from 'node:module';
const run=process.env.LG01_RUN;
if(!/^qa-lg02-a-repair-r2-20261013(?:-final)?$/.test(run))throw Error('Unexpected output namespace');
const target=p=>typeof p!=='string'?p:p.replace('docs/plan/long-game/evidence/LG-01/implementation-b/fixture-'+run,'tools/long-game/fixture-lg02-a-repair-r2-20261013/'+(run.endsWith('-final')?'final':'first')).replace('docs/plan/long-game/evidence/LG-01/repair-b-r2/'+run+'-','tools/long-game/'+run+'-');
for(const [owner,names] of [[fs,['writeFileSync','mkdirSync']],[fs.promises,['writeFile','mkdir']]])for(const name of names){const original=owner[name];owner[name]=function(p,...args){const mapped=target(p);if(mapped!==p&&name.startsWith('writeFile'))args[1]={...(typeof args[1]==='object'?args[1]:{encoding:args[1]}),flag:'wx'};return original.call(this,mapped,...args);};}
syncBuiltinESMExports();
