const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const puppeteer = require('C:/Users/arran/pp/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js');

const root = process.cwd();
const out = path.join(root, 'docs/plan/long-game/evidence/LG-06/review-challenges-r1');
const fixture = JSON.parse(fs.readFileSync('docs/plan/long-game/evidence/LG-05/implementation-shelf-r1/final-ui-failure.json'));
Object.assign(fixture.state, {lastSeen:Date.now(), printing:4, offers:[], pitches:[], challenge:null, chDone:{}, muses:{owned:{},seated:[null,null,null]}});
fixture.state.meta.layers = {version:1,count:1,baseline:0,seals:0,highestPrinting:4,purchases:{},genre:null,stamps:{}};
Object.assign(fixture.state.meta.folio, {imprint:1,printing:4,working:false});
delete fixture.state.meta.automation;
fixture.wallet.score = 100e6;
const mime = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2'};
const server = http.createServer((req,res) => {
  const file = path.resolve(root, '.' + new URL(req.url,'http://local').pathname);
  if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
  fs.readFile(file,(error,data) => { res.writeHead(error ? 404 : 200, {'Content-Type':mime[path.extname(file)] || 'application/octet-stream','Cache-Control':'no-store'}); res.end(error ? 'missing' : data); });
});

(async () => {
  let browser, context;
  const result = {status:'UNVERIFIED', controls:'Controlled save, earned run, inherited recipes, bank and owned desks; actual Core/Rewards owner, next Printing and shared sales.', stages:[], errors:[]};
  try {
    await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
    result.port = server.address().port;
    assert(![8000,8354,8356,8358,8397].includes(result.port));
    browser = await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
    context = await browser.createBrowserContext();
    const page = await context.newPage();
    page.on('pageerror', error => result.errors.push(error.message));
    await page.setBypassServiceWorker(true);
    await page.setCacheEnabled(false);
    const seed = await page.evaluateOnNewDocument(f => {
      localStorage.setItem('imi-ops-v1',JSON.stringify(f.state));
      localStorage.setItem('imi-score',JSON.stringify(f.wallet));
    },fixture);
    await page.goto(`http://127.0.0.1:${result.port}/index.html?lg01a=1&lg03=1&lg05folio=1&lg05layers=1#play`);
    await page.removeScriptToEvaluateOnNewDocument(seed.identifier);
    await page.waitForFunction(() => window.Rewards?.owns() && IMI.ops?.progression.running());
    result.stages.push(await page.evaluate(() => {
      const d = IMI.ops.dev, s = d.S();
      s.pub.on = false;
      s.desks.forEach(x => { x.paws=0; x.crew=[]; x.keeper.on=false; });
      document.querySelectorAll('.o-modal,.o-celebrate').forEach(x => x.remove());
      for (let i=0;i<3;i++) { const p=d.genPitch(0); s.pitches.push(p); d.registerPitch(p); s.written[p.id]=true; }
      s.run.earned=12.5e6;
      d.doPrint('onebrief');
      const n=d.S(); n.pub.on=false;
      n.desks.forEach(x => { x.paws=0; x.crew=[]; x.keeper.on=false; });
      document.querySelectorAll('.o-modal,.o-celebrate').forEach(x => x.remove());
      window.reviewSell = r => { for (const w in r.need) n.bank[w]=r.need[w]; n.desks.forEach(x => x.owned=true); d.touchBank(); d.writeTitle(r.id,null,{silent:true,mult:1}); };
      const entry={stage:'entry',printing:n.printing,challenge:structuredClone(n.challenge),backlog:d.pitchActive(),sold:d.soldCount(),owns:Rewards.owns(),running:IMI.ops.progression.running(),held:Rewards.held(),guard:Rewards.guard(n)};
      const inherited=d.RECIPES.filter(r => r.gen && !n.written[r.id]);
      reviewSell(inherited[0]);
      const first={stage:'first clearance sale',challenge:structuredClone(n.challenge),backlog:d.pitchActive(),sold:d.soldCount()};
      reviewSell(inherited[1]);
      const baseline={stage:'threshold sale',challenge:structuredClone(n.challenge),backlog:d.pitchActive(),sold:d.soldCount()};
      reviewSell(inherited[2]);
      const progress={stage:'first goal sale',challenge:structuredClone(n.challenge),backlog:d.pitchActive(),sold:d.soldCount()};
      IMI.ops.saveAcknowledged();
      return [entry,first,baseline,progress];
    }));
    const [entry,first,baseline,progress] = result.stages[0];
    assert(entry.owns && entry.running && !entry.held && entry.guard && entry.printing===5 && entry.backlog===3);
    assert(first.challenge.imprintRun.phase==='clearance' && first.sold===1 && first.backlog===2);
    assert(baseline.challenge.imprintRun.phase==='goal' && baseline.challenge.imprintRun.baseline===2 && baseline.sold===2 && baseline.backlog===1);
    assert(progress.challenge.imprintRun.baseline===2 && progress.sold===3 && progress.backlog===0);
    await page.reload();
    await page.waitForFunction(() => window.Rewards?.owns() && IMI.ops?.progression.running());
    result.stages.push(await page.evaluate(() => {
      const d=IMI.ops.dev,s=d.S();
      return {stage:'reload',challenge:s.challenge,backlog:d.pitchActive(),sold:d.soldCount(),owns:Rewards.owns(),held:Rewards.held(),guard:Rewards.guard(s)};
    }));
    const reload=result.stages[1];
    assert(reload.owns && !reload.held && reload.guard && reload.challenge.imprintRun.phase==='goal' && reload.challenge.imprintRun.baseline===2 && reload.sold===3 && reload.backlog===0);
    assert.deepEqual(result.errors,[]);
    result.status='PASS';
  } catch (error) { result.status='FAIL'; result.error=error.stack; process.exitCode=1; }
  finally {
    if (context) await context.close();
    if (browser) await browser.close();
    if (server.listening) await new Promise(resolve => server.close(resolve));
    fs.mkdirSync(out,{recursive:true});
    fs.writeFileSync(path.join(out,'onebrief-smoke.json'),JSON.stringify(result,null,2),{flag:'wx'});
    fs.writeFileSync(path.join(out,'onebrief-cleanup.json'),JSON.stringify({browserClosed:!!browser,serverClosed:!server.listening,port:result.port,protectedPortsUntouched:true},null,2),{flag:'wx'});
    console.log(JSON.stringify({status:result.status,error:result.error,stages:result.stages.length,port:result.port}));
  }
})();
