import { readFile,writeFile,copyFile,mkdir } from 'node:fs/promises';
import { constants } from 'node:fs';
import { createHash } from 'node:crypto';
const base = 'docs/plan/long-game/evidence/LG-01/implementation-c';
const manifest = JSON.parse(await readFile(base + '/' + process.argv[2],'utf8'));
await mkdir(base + '/screens',{recursive:true});
for (const item of manifest) {
  const path = base + '/screens/' + item.name + '.png';
  await copyFile(item.screenshotPath,path,constants.COPYFILE_EXCL);
  item.path = path; item.sha256 = createHash('sha256').update(await readFile(path)).digest('hex');
}
await writeFile(base + '/' + process.argv[2] + '.receipt.json',JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
console.log(manifest.length + ' native T3 images copied with exclusive writes.');
