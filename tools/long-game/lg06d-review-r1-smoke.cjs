const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const puppeteer = require('C:/Users/arran/pp/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js');
const leaf = 'docs/plan/long-game/evidence/LG-06/review-muse-r1';
const fixture = JSON.parse(fs.readFileSync('docs/plan/long-game/evidence/LG-05/implementation-shelf-r1/final-ui-failure.json'));
Object.assign(fixture.state, {lastSeen:Date.now(), printing:0, offers:[], pitches:[], muses:{owned:{hemi:true,austen:true,seuss:true,poe:true},seated:[null,null,null]}});
fixture.state.meta.layers = {version:1,count:0,baseline:0,seals:0,highestPrinting:0,purchases:{},genre:null,stamps:{}};
Object.assign(fixture.state.meta.folio, {imprint:0,printing:0,working:false});
delete fixture.state.meta.automation;
fixture.wallet.score = 100e6;
const root = process.cwd();
const server = http.createServer((req,res) => {
  const file = path.resolve(root,'.' + new URL(req.url,'http://local').pathname);
  if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
  fs.readFile(file,(error,bytes) => {
    const type = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2'}[path.extname(file)] || 'application/octet-stream';
    res.writeHead(error ? 404 : 200, {'Content-Type':type,'Cache-Control':'no-store'}).end(error ? 'missing' : bytes);
  });
});
const result = {status:'UNVERIFIED', controls:'Native Core/Rewards owner; controlled inventory, sales, bank, Imprint and game seconds.', errors:[]};
(async () => {
  let browser;
  try {
    await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
    result.port = server.address().port;
    assert(![8000,8354,8356,8358,8397].includes(result.port));
    browser = await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
    const page = await browser.newPage();
    page.on('pageerror',error => result.errors.push(error.message));
    await page.setBypassServiceWorker(true);
    await page.setCacheEnabled(false);
    const seed = await page.evaluateOnNewDocument(data => {
      localStorage.setItem('imi-ops-v1',JSON.stringify(data.state));
      localStorage.setItem('imi-score',JSON.stringify(data.wallet));
    },fixture);
    const url = `http://127.0.0.1:${result.port}/index.html?lg01a=1&lg03=1&lg05folio=1&lg05layers=1&pg01=1#play`;
    await page.goto(url);
    await page.removeScriptToEvaluateOnNewDocument(seed.identifier);
    await page.waitForFunction(() => window.Rewards?.owns() && IMI.ops?.progression.running(),{timeout:12000});
    result.flow = await page.evaluate(() => {
      const api = IMI.ops.extensions, dev = IMI.ops.dev, s = dev.S();
      const helper = __OPS_EXTENSIONS.find(([name]) => name === 'automation')[1];
      s.desks.forEach(d => { d.paws = 0; d.crew = []; d.keeper.on = false; });
      s.pub.on = false; s.written = {};
      dev.RECIPES.filter(r => !r.gen && !r.kid && !r.lib).slice(0,3).forEach(r => s.written[r.id] = true);
      document.querySelectorAll('.o-modal,.o-celebrate').forEach(e => e.remove());
      const owner = {owns:Rewards.owns(),running:IMI.ops.progression.running(),held:Rewards.held(),guard:Rewards.guard(s)};
      const first = api.seatMuse(0,'hemi'), second = api.seatMuse(0,'austen');
      s.meta.layers.count = 5;
      const title = dev.RECIPES.find(r => !s.written[r.id] && !r.kid && !r.gen && !r.lib && r.band === 0);
      s.focus = title.id; s.autoFocus = false; s.bank = {...title.need}; dev.touchBank();
      helper.actions['muse-toggle']();
      const choice = api.museSelection();
      const before = s.muses.seated.slice(), saved = Storage.prototype.setItem;
      Storage.prototype.setItem = function(key,value) { if (key === 'imi-ops-v1') throw Error('review injected auto save failure'); return saved.call(this,key,value); };
      let failed;
      try { helper.tick({gameSeconds:60,replay:false}); failed = {pending:api.museStatus().pending,seats:s.muses.seated.slice()}; }
      finally { Storage.prototype.setItem = saved; }
      s.market.v[0] += .01;
      const stale = api.retryMuse();
      const afterStale = {pending:api.museStatus().pending,seats:s.muses.seated.slice()};
      helper.tick({gameSeconds:60,replay:false});
      const afterNext = s.muses.seated.slice();
      IMI.ops.saveAcknowledged();
      return {owner,first,second,choice,before,failed,stale,afterStale,afterNext,proof:s.meta.automation.muse.manual};
    });
    assert.deepEqual(result.flow.owner,{owns:true,running:true,held:false,guard:true});
    assert(result.flow.first.ok && result.flow.second.ok && result.flow.proof.complete);
    assert.equal(result.flow.choice.id,'seuss');
    assert(result.flow.failed.pending);
    assert.deepEqual(result.flow.failed.seats,result.flow.before);
    assert(!result.flow.stale.ok && result.flow.stale.retryable === false);
    assert(!result.flow.afterStale.pending);
    assert.deepEqual(result.flow.afterStale.seats,result.flow.before);
    assert.equal(result.flow.afterNext[0],'seuss');
    await page.reload();
    await page.waitForFunction(() => window.Rewards?.owns() && IMI.ops?.progression.running());
    result.reload = await page.evaluate(() => ({seats:IMI.ops.dev.S().muses.seated, proof:IMI.ops.dev.S().meta.automation.muse.manual,guard:Rewards.guard(IMI.ops.dev.S()),held:Rewards.held()}));
    assert.equal(result.reload.seats[0],'seuss');
    assert(result.reload.proof.complete && result.reload.guard && !result.reload.held);
    assert.deepEqual(result.errors,[]);
    result.status = 'PASS';
  } catch (error) { result.status = 'FAIL'; result.error = error.stack; }
  finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
    fs.writeFileSync(`${leaf}/smoke.json`,JSON.stringify(result,null,2),{flag:'wx'});
    fs.writeFileSync(`${leaf}/cleanup.json`,JSON.stringify({browserClosed:true,serverClosed:true,port:result.port,protectedPortsUntouched:true},null,2),{flag:'wx'});
    console.log(JSON.stringify({status:result.status,error:result.error,port:result.port}));
    if (result.status !== 'PASS') process.exitCode = 1;
  }
})();
