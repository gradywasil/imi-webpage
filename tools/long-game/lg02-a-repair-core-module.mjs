// Actual-source headless module diagnostics. Ordinary visual/UI acceptance remains T3-owned.
import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const {default:pp}=await import(pathToFileURL(process.env.PUPPETEER_MODULE).href);
const out='docs/plan/long-game/evidence/LG-02/repair-runtime-a-r2', base='http://127.0.0.1:8181';
const browser=await pp.launch({executablePath:process.env.CHROME,headless:true}),report={cases:[],failures:[]};
try {
  for(const edition of ['index','classic'])for(const [label,raw,flags,readFail] of [
    ['empty','{"prem":{"vault":{}}}','',false],['null','{"prem":{"vault":null}}}','?lg02=1',false],
    ['unknown','{"prem":{"vault":{"version":99}}}','?lg01a=1',false],['badJSON','{','',false],
    ['badPrem','{"prem":null}','',false],['readFailure','{}','',true],
    ...['','?lg01a=1','?lg02=1','?lg01a=1&lg02=1'].map(f=>['version1','{"prem":{"vault":{"version":1}}}',f,false])]) {
    const context=await browser.createBrowserContext(),page=await context.newPage(),row={edition,label,flags,readFail,hashes:{},errors:[]},pending=[];report.cases.push(row);
    try {
      page.on('pageerror',e=>row.errors.push(String(e)));
      page.on('response',r=>{const p=new URL(r.url()).pathname.slice(1);if(r.ok()&&[edition+'.html','vault-save-gate.js','rewards.js','economy.js','core.js','ops.js'].includes(p))pending.push(r.buffer().then(async b=>{const h=createHash('sha256').update(b).digest('hex');row.hashes[p]=h;assert.equal(h,createHash('sha256').update(await fs.readFile(p)).digest('hex'));}));});
      await page.evaluateOnNewDocument(({raw,readFail})=>{
        localStorage.setItem('imi-ops-v1',raw);localStorage.setItem('imi-score','{"economyVersion":1,"score":75,"unknown":"keep"}');
        const get=Storage.prototype.getItem;window.__qa={reads:[],writes:[],initial:Object.fromEntries(Object.keys(localStorage).map(k=>[k,get.call(localStorage,k)]))};
        window.__qaRead=()=>Object.fromEntries(Object.keys(localStorage).map(k=>[k,get.call(localStorage,k)]));
        Storage.prototype.getItem=function(k){__qa.reads.push({storage:this===localStorage?'local':'session',key:k});if(readFail&&this===localStorage)throw Error('QA storage read unavailable');return get.call(this,k);};
        for(const n of ['setItem','removeItem','clear']){const f=Storage.prototype[n];Storage.prototype[n]=function(...args){__qa.writes.push({storage:this===localStorage?'local':'session',method:n,args});return f.apply(this,args);};}
      },{raw,readFail});
      await page.goto(base+'/'+edition+'.html'+flags+'#play',{waitUntil:'load'});
      row.value=await page.evaluate(()=>{
        const calls={};for(const [name,fn] of Object.entries({boot:()=>Core.boot({edition:'classic'}),loadScore:()=>Economy.loadScore(),loadState:()=>Economy.loadState(),saveScore:()=>Economy.saveScore(0),saveAck:()=>Economy.saveScoreAcknowledged(0,null),saveState:()=>Economy.saveStateAcknowledged({}),credit:()=>Economy.creditReward(75,{id:'reset',sequence:1,previous:0,amount:25})})){try{calls[name]=fn();}catch(e){calls[name]=String(e);}}
        return {blocked:VaultSaveGate.blocked,imi:!!window.IMI,coreDefined:!!window.Core,rewards:Rewards.enabled,calls,...__qa,after:__qaRead(),action:document.querySelector('.o-vault-gate button')?.textContent,bodyChildren:[...document.body.children].filter(e=>e.tagName!=='SCRIPT').map(e=>({tag:e.tagName,inert:e.inert,display:getComputedStyle(e).display}))};
      });
      assert.equal(row.value.blocked,true);assert.equal(row.value.imi,false);assert.equal(row.value.rewards,false);assert.deepEqual(row.value.writes,[]);assert.deepEqual(row.value.reads,[{storage:'local',key:'imi-ops-v1'}]);assert.deepEqual(row.value.after,row.value.initial);assert.match(row.value.calls.boot,/Vault save blocked/);assert.deepEqual(row.errors,[]);await Promise.all(pending);
    }catch(e){row.failure=String(e);report.failures.push({edition,label,flags,error:String(e)});}finally{await context.close();}
  }
}finally{await browser.close();await fs.writeFile(out+'/core-module.json',JSON.stringify(report,null,2),{flag:'wx'});console.log({cases:report.cases.length,failures:report.failures});}
