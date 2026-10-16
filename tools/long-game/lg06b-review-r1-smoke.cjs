const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const assert = require('node:assert/strict');
const pp = require('C:/Users/arran/pp/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js');

const out = 'docs/plan/long-game/evidence/LG-06/review-pitch-r1/smoke-final.json';
const fixture = JSON.parse(fs.readFileSync('docs/plan/long-game/evidence/LG-05/implementation-shelf-r1/final-ui-failure.json'));
fixture.state.lastSeen = Date.now();
fixture.state.printing = 0;
fixture.state.meta.layers = {version:1,count:0,baseline:0,seals:0,highestPrinting:0,purchases:{},genre:null,stamps:{}};
fixture.state.meta.folio.imprint = 0;
fixture.state.meta.folio.printing = 0;
fixture.state.meta.folio.working = false;
fixture.state.offers = [];
fixture.state.pitches = [];
delete fixture.state.meta.automation;

const root = process.cwd();
const mime = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2'};
const server = http.createServer((req,res) => {
  const file = path.resolve(root, '.' + new URL(req.url,'http://local').pathname);
  if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
  fs.readFile(file,(error,bytes) => {
    res.writeHead(error ? 404 : 200,{'Content-Type':mime[path.extname(file)] || 'application/octet-stream','Cache-Control':'no-store'});
    res.end(error ? 'missing' : bytes);
  });
});

(async () => {
  let browser, page;
  const result = {status:'UNVERIFIED',qualification:'Actual Core/Rewards owner; controlled offers, bank, Imprint count and game seconds; active Publisher path.',checks:[],errors:[]};
  try {
    await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
    result.port = server.address().port;
    assert(![8000,8354,8356,8358,8397].includes(result.port));
    browser = await pp.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
    page = await browser.newPage();
    await page.setBypassServiceWorker(true);
    await page.setCacheEnabled(false);
    page.on('pageerror',error => result.errors.push(error.message));
    const seed = await page.evaluateOnNewDocument(data => {
      localStorage.setItem('imi-ops-v1',JSON.stringify(data.state));
      localStorage.setItem('imi-score',JSON.stringify(data.wallet));
      localStorage.setItem('imi-fx','low');
    },fixture);
    const url = `http://127.0.0.1:${result.port}/index.html?lg01a=1&lg03=1&lg05folio=1&lg05layers=1&pg01=1#play`;
    await page.goto(url);
    await page.removeScriptToEvaluateOnNewDocument(seed.identifier);
    await page.waitForFunction(() => window.Rewards?.owns() && IMI.ops?.progression.running(),{timeout:12000});
    const first = await page.evaluate(() => {
      const d = IMI.ops.dev, a = IMI.ops.extensions, h = __OPS_EXTENSIONS.find(([id]) => id === 'automation')[1], s = d.S();
      const ready = {owns:Rewards.owns(),running:IMI.ops.progression.running(),held:Rewards.held(),guard:Rewards.guard(s)};
      s.desks.forEach(x => { x.owned = true; x.paws = 0; x.crew = []; x.keeper.on = false; });
      s.offers = [d.genPitch(0),d.genPitch(0),d.genPitch(0)];
      const title = s.offers[0];
      const button = document.createElement('button');
      button.dataset.act = 'commission';
      button.dataset.i = '0';
      document.getElementById('opsRoot').append(button);
      button.click();
      button.remove();
      const r = d.RBY[title.id];
      if (!r) return {ready,title:title.id,commission:{offers:s.offers,pitches:s.pitches,meta:s.meta.automation,guard:Rewards.guard(s),held:Rewards.held()}};
      Object.assign(s.bank,r.need); d.touchBank();
      s.autoFocus = true; s.focus = null; s.market.v = s.market.v.map(() => 1.2);
      s.pub = {tier:3,on:true,rule:0};
      document.querySelectorAll('.o-celebrate,.o-modal').forEach(e => e.remove());
      const before = {wallet:IMI.bananas.get(),sold:s.stats.pitchSold || 0,earned:s.run.earned,bank:JSON.parse(JSON.stringify(s.bank))};
      const publisher = d.pubSell();
      const cfg = s.meta.automation.pitch;
      const sale = {publisher,manualComplete:cfg.manual.complete,receipt:cfg.manual.receipt,written:!!s.written[title.id],sold:s.stats.pitchSold,earned:s.run.earned,wallet:IMI.bananas.get(),walletHead:s.rewards.walletHead,held:Rewards.held(),guard:Rewards.guard(s)};
      s.pub.on = false;
      s.meta.layers.count = 2;
      s.offers = [d.genPitch(0),d.genPitch(0),d.genPitch(0)];
      s.autoFocus = true; s.focus = null;
      h.actions['pitch-toggle']();
      const autoBefore = s.stats.pitched;
      h.tick({gameSeconds:59,replay:false});
      const at59 = s.stats.pitched;
      h.tick({gameSeconds:1,replay:false});
      const auto = {enabled:s.meta.automation.pitch.enabled,before:autoBefore,at59,at60:s.stats.pitched,held:Rewards.held(),guard:Rewards.guard(s)};
      IMI.ops.saveAcknowledged();
      return {ready,title:title.id,before,sale,auto};
    });
    result.checks.push(first);
    assert.deepEqual(first.ready,{owns:true,running:true,held:false,guard:true});
    assert(first.sale.publisher && first.sale.manualComplete && first.sale.written && first.sale.sold === first.before.sold + 1);
    assert(first.sale.wallet > first.before.wallet && first.sale.earned > first.before.earned);
    assert(first.sale.receipt?.id.includes(first.title) && first.sale.walletHead?.origin === 'pitch-sale');
    assert(!first.sale.held && first.sale.guard);
    assert(first.auto.enabled && first.auto.at59 === first.auto.before && first.auto.at60 === first.auto.before + 1 && !first.auto.held && first.auto.guard);
    await page.reload();
    await page.waitForFunction(() => window.Rewards?.owns() && IMI.ops?.progression.running(),{timeout:12000});
    const reload = await page.evaluate(() => {
      const s = IMI.ops.dev.S(), p = s.meta.automation.pitch;
      return {owns:Rewards.owns(),running:IMI.ops.progression.running(),held:Rewards.held(),guard:Rewards.guard(s),manualComplete:p.manual.complete,receipt:p.manual.receipt,enabled:p.enabled,autoTitleCount:s.stats.pitched,written:!!s.written[p.manual.receipt.id.split(':').at(-1)]};
    });
    result.checks.push(reload);
    assert(reload.owns && reload.running && !reload.held && reload.guard && reload.manualComplete && reload.enabled && reload.written);
    assert.equal(reload.autoTitleCount,first.auto.at60);
    assert.deepEqual(result.errors,[]);
    result.status = 'PASS';
  } catch (error) { result.status = 'FAIL'; result.error = error.stack; }
  finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
    result.cleanup = {browserClosed:true,serverClosed:true,ephemeralProfile:true,ownerPortsUntouched:true};
    fs.writeFileSync(out,JSON.stringify(result,null,2),{flag:'wx'});
    console.log(JSON.stringify({status:result.status,error:result.error,port:result.port}));
    if (result.status !== 'PASS') process.exitCode = 1;
  }
})();
