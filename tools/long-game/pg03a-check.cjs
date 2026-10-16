const fs=require('node:fs'),assert=require('node:assert/strict'),pp=require('C:/Users/arran/pp/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js');
const out='docs/plan/long-game/evidence/PG-03/implementation-a-r1';
(async()=>{const browser=await pp.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});const results=[];
try{
 const context=await browser.createBrowserContext(),page=await context.newPage();
 await page.setRequestInterception(true);page.on('request',r=>new URL(r.url()).pathname==='/ops.js'?r.respond({status:200,contentType:'text/javascript',body:fs.readFileSync('ops.js','utf8').replace('  startGame();','  window.__pg03a={bookRoy,royaltyScale};\n  startGame();')}):r.continue());
 await page.evaluateOnNewDocument(()=>window.__TUNE={ROY_BASE:.000023});
 await page.goto('http://127.0.0.1:8397/tools/balance.html?pg03=1&lg01a=1');await page.waitForFunction(()=>!!IMI.ops?.dev);
 results.push(await page.evaluate(()=>{const d=IMI.ops.dev;d.completeIntro();const r=d.RECIPES.find(r=>!r.kid&&!r.lib&&!r.gen);Object.assign(d.S().bank,r.need);d.touchBank();d.writeTitle(r.id,null,{silent:true});const rows=[];for(const p of [0,4,7,12]){d.S().printing=p;rows.push({printing:p,factor:__pg03a.royaltyScale(),book:__pg03a.bookRoy(r),aggregate:d.royBase(),tuned:d.ROY_BASE});}return {name:'actual formula and tuned base',rows};}));
 for(const row of results[0].rows){assert.equal(row.factor,2*(1+.35*Math.min(row.printing,7)));assert.equal(row.book,row.aggregate);assert.equal(row.tuned,.000023);}
 results.push(await page.evaluate(()=>{const d=IMI.ops.dev;d.S().printing=0;IMI.bananas.add(1000000);const before=IMI.bananas.get(),rate=d.royBase();d.buy('deal','reprints');const once=IMI.bananas.get();d.buy('deal','reprints');return {name:'sale and Reprints duplicate',before,once,twice:IMI.bananas.get(),rate,afterRate:d.royBase(),deals:d.S().deals,ack:IMI.ops.saveAcknowledged()};}));
 const deal=results.at(-1);assert.equal(deal.before-deal.once,62500);assert.equal(deal.once,deal.twice);assert.equal(deal.afterRate,deal.rate*1.5);console.log(JSON.stringify(deal));assert(deal.ack.ok);
 const fixture=await page.evaluate(()=>({'imi-ops-v1':localStorage.getItem('imi-ops-v1'),'imi-score':localStorage.getItem('imi-score')}));
 await page.evaluateOnNewDocument(f=>window.__LONG_GAME_FIXTURE=f,fixture);await page.reload();await page.waitForFunction(()=>!!IMI.ops?.dev);assert.equal(await page.evaluate(()=>IMI.ops.dev.S().deals.reprints),true);results.push({name:'acknowledged state and wallet reloaded',ok:true});
 results.push(await page.evaluate(()=>{const d=IMI.ops.dev;for(const desk of d.S().desks)desk.paws=0;const rate=d.royBase(),eff=d.awayEff(),rep=IMI.ops.simulateAway(630);return {name:'bounded offline',rate,eff,rep,expected:Economy.floor(rate*630*eff)};}));assert.equal(results.at(-1).rep.roy,results.at(-1).expected);
 results.push(await page.evaluate(()=>{const d=IMI.ops.dev,old=d.S();old.printing=3;old.run.earned=Economy.cash(500000);d.doPrint();return {name:'actual Printing replaces S and clears shelf/deals',replaced:old!==d.S(),printing:d.S().printing,factor:__pg03a.royaltyScale(),written:Object.keys(d.S().written),deals:Object.keys(d.S().deals),rate:d.royBase()};}));const reset=results.at(-1);assert(reset.replaced);assert.equal(reset.factor,4.8);assert.equal(reset.rate,0);assert.equal(reset.written.length+reset.deals.length,0);
 assert.deepEqual(JSON.parse(fs.readFileSync(out+'/before-control.json')).result,JSON.parse(fs.readFileSync(out+'/after-control.json')).result);
 fs.writeFileSync(out+'/focused-results-final.json',JSON.stringify(results,null,2),{flag:'wx'});console.log(JSON.stringify(results));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});

