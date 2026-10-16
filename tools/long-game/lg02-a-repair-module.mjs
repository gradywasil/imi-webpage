// Authorized headless balance/module lane, sequential isolated contexts and untouched raw keys.
import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const {default:pp}=await import(pathToFileURL(process.env.PUPPETEER_MODULE).href);
const base='http://127.0.0.1:8181', out='docs/plan/long-game/evidence/LG-02/repair-runtime-a-r2';
const browser=await pp.launch({executablePath:process.env.CHROME,headless:true});
const report={browser:await browser.version(),cases:[],failures:[]};
try {
  for(const raw of ['{','{"prem":null}','{"prem":{"vault":null}}','{"prem":{"vault":{}}}','{"prem":{"vault":{"version":99}}}','{"prem":{"vault":{"version":1},"unknown":"keep"},"unknown":"keep"}']) {
    for(const search of ['', '?lg01a=1','?lg02=1','?lg01a=1&lg02=1']) {
      const context=await browser.createBrowserContext(),page=await context.newPage(),errors=[],hashes={},pending=[];
      try {
        page.on('pageerror',e=>errors.push(String(e)));
        page.on('response',r=>{const name=new URL(r.url()).pathname.slice(1);if(r.ok()&&['tools/balance.html','vault-save-gate.js','rewards.js','economy.js','ops.js'].includes(name))pending.push(r.buffer().then(b=>hashes[name]=createHash('sha256').update(b).digest('hex')));});
        await page.evaluateOnNewDocument(raw=>{
          localStorage.setItem('imi-ops-v1',raw);localStorage.setItem('imi-score','{"economyVersion":1,"score":25,"unknown":"keep"}');localStorage.setItem('unrelated','keep');
          window.__before=Object.fromEntries(Object.keys(localStorage).map(k=>[k,localStorage.getItem(k)]));window.__writes=[];window.__reads=[];window.__rng=0;
          for(const name of ['setItem','removeItem','clear']) {const original=Storage.prototype[name];Storage.prototype[name]=function(...args){__writes.push({name,args});return original.apply(this,args);};}
          const get=Storage.prototype.getItem;Storage.prototype.getItem=function(key){__reads.push(key);return get.call(this,key);};
          const random=Math.random;Math.random=()=>{__rng++;return random();};
        },raw);
        await page.goto(base+'/tools/balance.html'+search,{waitUntil:'load'});
        const value=await page.evaluate(()=>{
          startBalance();const result={blocked:VaultSaveGate.blocked,imi:!!window.IMI,bot:!!window.Bot,writes:__writes,rng:__rng,reads:__reads.slice(),before:__before};
          result.after=Object.fromEntries(Object.keys(localStorage).map(k=>[k,localStorage.getItem(k)]));return result;
        });
        assert.equal(value.blocked,true);assert.equal(value.imi,false);assert.equal(value.bot,false);assert.deepEqual(value.writes,[]);assert.equal(value.rng,0);assert.deepEqual(value.before,value.after);assert.deepEqual(errors,[]);
        await Promise.all(pending);for(const [name,hash]of Object.entries(hashes))assert.equal(hash,createHash('sha256').update(await readFile(name)).digest('hex'));
        report.cases.push({raw,search,hashes,errors,value});
      } finally {await context.close();}
    }
  }
}catch(e){report.failures.push({message:String(e),stack:e.stack});process.exitCode=1;}
finally{await browser.close();await writeFile(out+'/module-r1.json',JSON.stringify(report,null,2),{flag:'wx'});console.log({cases:report.cases.length,failures:report.failures});}
