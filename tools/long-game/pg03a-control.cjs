const fs=require('node:fs'),http=require('node:http'),path=require('node:path'),crypto=require('node:crypto');
const out='docs/plan/long-game/evidence/PG-03/implementation-a-r1';
const phase=process.argv[2];
const pp=require('C:/Users/arran/pp/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js');
(async()=>{
 const server=http.createServer((req,res)=>{const file=path.join(process.cwd(),decodeURIComponent(new URL(req.url,'http://local').pathname));fs.readFile(file,(e,b)=>{res.statusCode=e?404:200;res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(e?'missing':b);});});
 await new Promise(r=>server.listen(8397,'127.0.0.1',r));
 const browser=await pp.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:8397/tools/balance.html');await page.waitForFunction(()=>!!window.Bot);
 const result=await page.evaluate(()=>{Bot.start({profile:'active',strategy:'collect',seed:1,activeMinutes:5});Bot.run(5);return {report:Bot.report(),meta:IMI.ops.dev.S().meta};});
 const identities=Object.fromEntries(['ops.js','sw.js','ops.css','core.js','economy.js','rewards.js','index.html','classic.html'].map(f=>[f,crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex')]));
 fs.writeFileSync(`${out}/${phase}-control.json`,JSON.stringify({result,errors,identities},null,2),{flag:'wx'});if(errors.length)throw Error(errors.join('\n'));console.log(JSON.stringify(result));
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
