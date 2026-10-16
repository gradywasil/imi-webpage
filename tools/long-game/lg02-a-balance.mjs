import { spawnSync } from 'node:child_process';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const phase = process.argv[2];
if (!['before','after'].includes(phase)) throw Error('Expected before or after');
const suffix = process.argv[3] || '';
if (!/^(|-final)$/.test(suffix)) throw Error('Invalid evidence suffix');
const base = 'docs/plan/long-game/evidence/LG-02/implementation-a/' + phase + suffix;
await mkdir(base, { recursive:true });
for (const [lane, search] of [['enabled','?lg01a=1'],['both-flags','?lg01a=1&lg02=1'], ...(phase === 'after' ? [['default-hour','']] : [])]) {
  const output = base + '/' + lane + '.raw.json';
  try { await readFile(output); throw Error('Output exists: ' + output); } catch(e) { if(e.code !== 'ENOENT') throw e; }
  const args = ['tools/balance.mjs','60','active','collect','1','180','--url','http://127.0.0.1:8173/tools/balance.html' + search,'--output',output];
  const run = spawnSync(process.execPath,args,{encoding:'utf8',env:{...process.env,GUARD:'240'}});
  await writeFile(base + '/' + lane + '.command.json', JSON.stringify({args, env:{PUPPETEER_MODULE:process.env.PUPPETEER_MODULE,CHROME:process.env.CHROME,GUARD:'240'},exit:run.status,stdout:run.stdout,stderr:run.stderr},null,2),{flag:'wx'});
  console.log(lane, run.status);
  if(run.status !== 0) throw Error('Balance failed, raw output retained');
}
if (phase === 'after') {
  const results = [];
  for(const lane of ['default-hour','enabled','both-flags']) {
    const canonical = async p => { const raw=JSON.parse(await readFile(p)); if(!raw.complete || raw.actualMinutes !== 60) throw Error('Incomplete '+p); for(const key of ['capturedAt','sourceCommit','sourceHashes','url','wallSeconds']) delete raw[key]; return JSON.stringify(raw,null,2)+'\n'; };
    const before = await canonical('docs/plan/long-game/evidence/LG-02/implementation-a/before/'+lane+'.raw.json'), after = await canonical(base+'/'+lane+'.raw.json');
    results.push({lane,equal:before===after,beforeHash:createHash('sha256').update(before).digest('hex'),afterHash:createHash('sha256').update(after).digest('hex')});
  }
  await writeFile(base+'/parity.json',JSON.stringify(results,null,2),{flag:'wx'}); console.log(results);
  if(results.some(r=>!r.equal)) throw Error('Gameplay parity failed');
}
