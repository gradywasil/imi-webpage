const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const pp=require('C:/Users/arran/pp/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js');
const out='docs/plan/long-game/evidence/LG-03/implementation-tiers-r1';
(async()=>{
  const browser=await pp.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
  try {
    const results={};
    for(const mode of ['before','final']) {
      const page=await browser.newPage(),errors=[],sources={};
      await page.setBypassServiceWorker(true);await page.setCacheEnabled(false);
      page.on('pageerror',e=>errors.push(e.message));
      if(mode==='before') {
        await page.setRequestInterception(true);
        page.on('request',r=>{
          const f=new URL(r.url()).pathname.slice(1);
          if(['ops.js','automation.js','sw.js'].includes(f))r.respond({status:200,contentType:'application/javascript',body:fs.readFileSync(`${out}/before/${f}`)});else r.continue();
        });
      }
      page.on('response',async r=>{const f=new URL(r.url()).pathname.slice(1);if(['ops.js','automation.js','economy.js','tools/bot.js'].includes(f))sources[f]=crypto.createHash('sha256').update(await r.buffer()).digest('hex');});
      await page.goto('http://127.0.0.1:8371/tools/balance.html');
      results[mode]=await page.evaluate(()=>{Bot.start({profile:'active',strategy:'collect',seed:1,activeMinutes:5});Bot.run(5);return {report:Bot.report(),meta:IMI.ops.dev.S().meta};});
      Object.assign(results[mode],{errors,sources});await page.close();
    }
    assert.deepEqual(results.before.report,results.final.report);assert.deepEqual(results.before.meta,results.final.meta);assert.deepEqual(results.final.meta,{});
    assert.deepEqual(results.before.errors,[]);assert.deepEqual(results.final.errors,[]);
    fs.writeFileSync(`${out}/default-report-meta-comparison.json`,JSON.stringify({qualification:'Fresh bounded runs. Before product bytes served from lease-start snapshots; reports also match original before/final balance CLI captures. No full-hour claim.',...results},null,2),{flag:'wx'});
    console.log('Stable five-minute report, empty meta and errors match');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
