const fs = require('node:fs'), path = require('node:path'), http = require('node:http'), assert = require('node:assert/strict');
const pp = require('C:/Users/arran/pp/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js');
const root = process.cwd(), out = 'docs/plan/long-game/evidence/LG-08/estate-review-r1';
const fixture = JSON.parse(fs.readFileSync('docs/plan/long-game/evidence/LG-05/implementation-shelf-r1/final-ui-failure.json'));
Object.assign(fixture.state, {lastSeen:Date.now(),printing:7,challenge:null,offers:[],pitches:[],written:{'ape-in-the-cape':true},editions:{'ape-in-the-cape':2}});
fixture.state.legacy = {stars:7,total:360,ups:{seed:1,crew:1,speed:2}};
fixture.state.meta.layers.count = 5;
fixture.state.desks.forEach(d => {d.paws=0;d.crew=[];d.keeper.on=false;});
const mime = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2'};
const server = http.createServer((req,res) => {
  const file = path.resolve(root,'.'+new URL(req.url,'http://local').pathname);
  if (!file.startsWith(root+path.sep)) return res.writeHead(403).end();
  fs.readFile(file,(error,bytes) => {res.writeHead(error?404:200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(error?'missing':bytes);});
});
(async () => {
  let browser; const result = {status:'FAIL',errors:[]};
  try {
    await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
    result.port=server.address().port;
    assert(![8000,8354,8356,8358,8397].includes(result.port));
    browser=await pp.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--user-data-dir='+fs.mkdtempSync(path.join(require('node:os').tmpdir(),'lg08b-review-'))]});
    const page=await browser.newPage();
    await page.setViewport({width:360,height:560,isMobile:true,deviceScaleFactor:1});
    await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
    await page.setBypassServiceWorker(true); await page.setCacheEnabled(false);
    page.on('pageerror',error => result.errors.push(error.stack||error.message));
    const seed=await page.evaluateOnNewDocument(data => {localStorage.setItem('imi-ops-v1',JSON.stringify(data.state));localStorage.setItem('imi-score',JSON.stringify(data.wallet));localStorage.setItem('imi-fx','low');},fixture);
    const url=`http://127.0.0.1:${result.port}/index.html?lg01a=1&lg05folio=1&lg05layers=1&lg08estate=1#play`;
    await page.goto(url); await page.removeScriptToEvaluateOnNewDocument(seed.identifier);
    await page.waitForFunction(() => Rewards.owns()&&IMI.ops?.progression.running()&&!Rewards.held());
    result.before=await page.evaluate(() => {
      const s=IMI.ops.extensions.state(), before=JSON.stringify(s), raw=localStorage.getItem('imi-ops-v1'), offer=IMI.ops.extensions.estatePreview();
      assertReview(Rewards.owns()&&IMI.ops.progression.running()&&Rewards.guard(s)&&!Rewards.held(),'owner');
      assertReview(!s.meta.estate&&before===JSON.stringify(s)&&raw===localStorage.getItem('imi-ops-v1'),'pure preview');
      assertReview(offer.quote.gain===3&&offer.room.desks[0].paws===2&&offer.basis.letters[0]>0,'crew and basis');
      function assertReview(ok,name) {if(!ok)throw Error(name);}
      IMI.ops.extensions.setTab('estate');IMI.ops.extensions.mark();
      return {owner:true,guard:true,held:false,quote:offer.quote,crew:offer.room.desks[0].paws,basis:offer.basis,reward:offer.reward};
    });
    await page.waitForFunction(() => document.querySelector('.layers')?.textContent.includes('Local Imprints 5 / 5'));
    await page.click('[data-act="estate:review"]');
    result.confirm=await page.evaluate(() => ({text:document.querySelector('.layer-confirm')?.innerText,buttons:[...document.querySelectorAll('.layer-confirm button')].map(b=>b.getBoundingClientRect().height),pageScroll:document.documentElement.scrollHeight>innerHeight}));
    assert(result.confirm.text.includes('2 starting typists'));assert(result.confirm.buttons.every(h=>h>=40));assert(!result.confirm.pageScroll);
    await page.click('[data-confirm]');
    await page.waitForFunction(() => {const s=IMI.ops?.extensions.state();return s?.meta.estate?.count===1&&s.rewards.claims['layer:estate:first']?.status==='committed'&&!Rewards.held();},{timeout:10000});
    await page.waitForFunction(() => {const text=document.querySelector('.o-pane:not([hidden]) .layers')?.textContent||[...document.querySelectorAll('.layers')].find(e=>e.getBoundingClientRect().height>0)?.textContent||'';return text.includes('Estates: 1. Charters: 3.')&&text.includes('Local Imprints 0 / 5.')&&text.includes('Printing 1 / 8.');},{timeout:10000});
    result.after=await page.evaluate(() => {const s=IMI.ops.extensions.state();return {estate:s.meta.estate,layers:{count:s.meta.layers.count,baseline:s.meta.layers.baseline,seals:s.meta.layers.seals},printing:s.printing,crew:s.desks[0].crew.length,paws:s.desks[0].paws,hold:s.hold,editions:s.editions['ape-in-the-cape'],claim:s.rewards.claims['layer:estate:first'],wallet:IMI.bananas.get(),owner:Rewards.owns(),guard:Rewards.guard(s),held:Rewards.held(),running:IMI.ops.progression.running(),pageScroll:document.documentElement.scrollHeight>innerHeight,render:[...document.querySelectorAll('.layers')].find(e=>e.getBoundingClientRect().height>0)?.textContent,save:IMI.ops.saveAcknowledged()};});
    assert.equal(result.after.estate.count,1);assert.equal(result.after.estate.charters,3);assert.equal(result.after.estate.localImprints,0);assert.equal(result.after.estate.resetEpoch,1);assert.equal(result.after.estate.starBaseline,360);assert.equal(result.after.layers.baseline,360);assert.equal(result.after.layers.count,5);assert.equal(result.after.crew,2);assert.equal(result.after.paws,2);assert.equal(result.after.editions,3);assert.equal(result.after.claim.status,'committed');assert(result.after.owner&&result.after.guard&&result.after.running&&!result.after.held&&!result.after.pageScroll&&result.after.save.ok);
    await page.screenshot({path:`${out}/veteran-pixel-result-360.png`});
    await page.reload();await page.waitForFunction(() => Rewards.owns()&&IMI.ops?.progression.running()&&!Rewards.held());
    result.reload=await page.evaluate(() => {const s=IMI.ops.extensions.state();return {estate:s.meta.estate,crew:s.desks[0].crew.length,editions:s.editions['ape-in-the-cape'],claim:s.rewards.claims['layer:estate:first'],wallet:IMI.bananas.get(),guard:Rewards.guard(s)};});
    assert.equal(result.reload.estate.count,1);assert.equal(result.reload.estate.charters,3);assert.equal(result.reload.crew,2);assert.equal(result.reload.editions,3);assert.equal(result.reload.claim.status,'committed');assert.equal(result.reload.wallet,result.after.wallet);assert(result.reload.guard);assert.deepEqual(result.errors,[]);
    result.status='PASS';
  } catch(error) {result.error=error.stack||String(error);}
  finally {if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));result.cleanup={browserClosed:true,serverClosed:true,protectedPortsUntouched:true};fs.writeFileSync(`${out}/veteran-smoke.json`,JSON.stringify(result,null,2),{flag:'wx'});console.log(JSON.stringify({status:result.status,error:result.error}));if(result.status!=='PASS')process.exitCode=1;}
})();
