const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const assert = require('node:assert/strict');
const pp = require('C:/Users/arran/pp/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js');
const root = process.cwd();
const out = path.join(root, 'docs/plan/long-game/evidence/LG-06/review-garden-r1');
const fixture = JSON.parse(fs.readFileSync('docs/plan/long-game/evidence/LG-05/implementation-shelf-r1/final-ui-failure.json'));
fixture.state.lastSeen = Date.now();
fixture.state.printing = 0;
fixture.state.garden.beds = [null, null];
fixture.state.meta.layers = {version:1,count:0,baseline:0,seals:0,highestPrinting:0,purchases:{},genre:null,stamps:{}};
fixture.state.meta.folio.imprint = 0;
fixture.state.meta.folio.printing = 0;
delete fixture.state.meta.automation;
const mime = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2'};
const server = http.createServer((req,res) => {
  const file = path.resolve(root, '.' + new URL(req.url, 'http://local').pathname);
  if (!file.startsWith(root + path.sep)) return void res.writeHead(403).end();
  fs.readFile(file, (error, bytes) => { res.writeHead(error ? 404 : 200, {'Content-Type':mime[path.extname(file)] || 'application/octet-stream','Cache-Control':'no-store'}); res.end(error ? 'missing' : bytes); });
});
(async () => {
  let browser;
  const result = {qualification:'Isolated native Chrome, controlled Imprint and game/wall time; no natural pacing claim',checks:[],errors:[]};
  try {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    result.server = {port:server.address().port,root};
    browser = await pp.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
    const page = await browser.newPage();
    await page.setBypassServiceWorker(true);
    await page.setCacheEnabled(false);
    page.on('pageerror', error => result.errors.push(error.message));
    const seed = await page.evaluateOnNewDocument(f => { localStorage.setItem('imi-ops-v1',JSON.stringify(f.state)); localStorage.setItem('imi-score',JSON.stringify(f.wallet)); }, fixture);
    const url = `http://127.0.0.1:${result.server.port}/index.html?lg01a=1&lg03=1&lg05folio=1&lg05layers=1#play`;
    await page.goto(url);
    await page.removeScriptToEvaluateOnNewDocument(seed.identifier);
    await page.waitForFunction(() => window.Rewards?.owns() && window.IMI?.ops?.progression.running(), {timeout:12000});
    result.owner = await page.evaluate(() => ({owns:Rewards.owns(),running:IMI.ops.progression.running(),held:Rewards.held(),guard:Rewards.guard(IMI.ops.dev.S())}));
    assert.deepEqual(result.owner,{owns:true,running:true,held:false,guard:true});
    const main = await page.evaluate(() => {
      const d=IMI.ops.dev, s=d.S(), h=window.__OPS_EXTENSIONS.find(([id])=>id==='automation')[1];
      d.action('seed',{ch:'E'}); d.action('plant',{i:'0'});
      const token=s.garden.beds[0]?.gardenToken, pending=s.meta.automation.garden.manual.pending;
      const planted=typeof token==='string' && pending?.token===token && !pending.complete;
      s.garden.beds[0].ready=Date.now()-1;
      d.harvest(0);
      const complete=s.meta.automation.garden.manual.complete===true && s.garden.beds[0]===null;
      const once=s.stats.harvested, duplicate=d.harvest(0)===0 && s.stats.harvested===once;
      s.meta.layers.count=1;
      h.actions['garden-toggle']();
      const enabled=s.meta.automation.garden.enabled===true;
      const wall=Date.now; let offset=0; Date.now=()=>wall()+offset;
      for(let i=0;i<3;i++){offset+=60000;h.tick({gameSeconds:60,replay:false});}
      Date.now=wall;
      return {planted,complete,duplicate,enabled,autoReplanted:!!s.garden.beds[0],harvested: s.stats.harvested,manualComplete:s.meta.automation.garden.manual.complete, stored:JSON.parse(localStorage.getItem('imi-ops-v1')).meta.automation.garden};
    });
    result.checks.push({name:'manual cycle, duplicate refusal, unlock, 60/120/180 service',...main});
    assert(main.planted && main.complete && main.duplicate && main.enabled && main.autoReplanted && main.manualComplete);
    await page.reload();
    await page.waitForFunction(() => window.Rewards?.owns() && window.IMI?.ops?.progression.running(), {timeout:12000});
    const reload=await page.evaluate(() => {const s=IMI.ops.dev.S();return {enabled:s.meta.automation.garden.enabled,manualComplete:s.meta.automation.garden.manual.complete,crop:!!s.garden.beds[0],held:Rewards.held(),guard:Rewards.guard(s)};});
    result.checks.push({name:'save and reload',...reload});
    assert(reload.enabled && reload.manualComplete && reload.crop && !reload.held && reload.guard);
    assert.deepEqual(result.errors,[]);
    result.status='PASS';
  } catch(error) { result.status='FAIL'; result.error=error.stack; process.exitCode=1; }
  finally {
    if(browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
    result.cleanup={browserClosed:!!browser,serverClosed:true,onlyDynamicLoopbackPort:true};
    fs.writeFileSync(path.join(out,'smoke.json'),JSON.stringify(result,null,2),{flag:'wx'});
    console.log(JSON.stringify({status:result.status,checks:result.checks.length,error:result.error}));
  }
})();
