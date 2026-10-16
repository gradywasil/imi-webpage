const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const pp=require('C:/Users/arran/pp/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js');
const out='docs/plan/long-game/evidence/LG-03/implementation-challenges-r1';
(async()=>{const browser=await pp.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});try{
const page=await browser.newPage(),errors=[],sources={},reads=[];await page.setBypassServiceWorker(true);await page.setCacheEnabled(false);
page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{const f=new URL(r.url()).pathname.slice(1);if(['ops.js','automation.js','rewards.js','economy.js','tools/bot.js'].includes(f))reads.push(r.buffer().then(b=>sources[f]=crypto.createHash('sha256').update(b).digest('hex')));});
await page.goto('http://127.0.0.1:8373/tools/balance.html');const result=await page.evaluate(()=>{Bot.start({profile:'active',strategy:'collect',seed:1,activeMinutes:5});Bot.run(5);return {report:Bot.report(),meta:IMI.ops.dev.S().meta};});await Promise.all(reads);Object.assign(result,{errors,sources});
const mode=process.argv[2];if(!['before','final'].includes(mode))throw Error('Expected before or final');fs.writeFileSync(`${out}/${mode}-default.json`,JSON.stringify(result,null,2),{flag:'wx'});if(mode==='final'){const before=JSON.parse(fs.readFileSync(`${out}/before-default.json`));for(const key of ['report','meta','errors'])assert.deepEqual(result[key],before[key]);}assert.deepEqual(errors,[]);console.log(mode+' five-minute default complete');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
