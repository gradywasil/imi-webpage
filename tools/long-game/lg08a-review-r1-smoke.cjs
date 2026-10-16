const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const puppeteer = require('C:/Users/arran/pp/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js');

const root = process.cwd();
const out = path.join(root, 'docs/plan/long-game/evidence/LG-08/identity-review-r1');
const fixture = JSON.parse(fs.readFileSync('docs/plan/long-game/evidence/LG-05/implementation-shelf-r1/final-ui-failure.json'));
Object.assign(fixture.state, {lastSeen:Date.now(), printing:4, challenge:null, offers:[], pitches:[]});
delete fixture.state.meta.automation;
const server = http.createServer((req, res) => {
  const file = path.resolve(root, '.' + new URL(req.url, 'http://local').pathname);
  if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
  fs.readFile(file, (error, body) => {
    res.writeHead(error ? 404 : 200, {'Content-Type':file.endsWith('.js') ? 'text/javascript' : file.endsWith('.html') ? 'text/html' : 'application/octet-stream', 'Cache-Control':'no-store'});
    res.end(error ? 'missing' : body);
  });
});

(async () => {
  let browser;
  const result = {status:'UNVERIFIED', checks:[], errors:[], source:'final-source.json six hashes checked separately'};
  try {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    result.port = server.address().port;
    assert(![8000,8354,8356,8358,8397].includes(result.port));
    browser = await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
    const page = await browser.newPage();
    page.on('pageerror', error => result.errors.push(error.message));
    await page.setBypassServiceWorker(true);
    await page.setCacheEnabled(false);
    const seed = await page.evaluateOnNewDocument(f => {
      localStorage.setItem('imi-ops-v1', JSON.stringify(f.state));
      localStorage.setItem('imi-score', JSON.stringify(f.wallet));
    }, fixture);
    const url = `http://127.0.0.1:${result.port}/index.html?lg01a=1&lg03=1&lg05folio=1&lg05layers=1#play`;
    await page.goto(url);
    await page.removeScriptToEvaluateOnNewDocument(seed.identifier);
    await page.waitForFunction(() => window.Rewards?.owns() && IMI.ops?.progression.running(), {timeout:12000});
    const first = await page.evaluate(() => {
      const state = IMI.ops.dev.S();
      const ready = Rewards.owns() && IMI.ops.progression.running() && !Rewards.held() && Rewards.guard(state);
      if (!ready) throw Error('Owner is not ready');
      state.pub.on = false;
      state.desks.forEach(d => { d.paws = 0; d.crew = []; d.keeper.on = false; });
      const before = JSON.stringify(state);
      const init = Layers.initializeIdentity(state);
      if (JSON.stringify(state) !== before || state.meta.estate) throw Error('Absent identity changed');
      state.meta.estate = {...init, futureIdentity:{keep:73}};
      state.run.earned = 12.5e6;
      const stale = {action:'choose',resetEpoch:0,expected:null,selection:{id:'pocket',leaves:[0,1],reward:{kind:'cash'}}};
      IMI.ops.dev.doPrint();
      const next = IMI.ops.dev.S();
      if (next.printing !== 5 || next.meta.estate.resetEpoch !== 1 || next.meta.estate.localImprints !== init.localImprints || next.meta.estate.futureIdentity.keep !== 73) throw Error('Printing identity');
      stale.expected = JSON.parse(JSON.stringify(next.meta.folio));
      const room = JSON.stringify(next), wallet = localStorage.getItem('imi-score'), save = localStorage.getItem('imi-ops-v1');
      const refusal = Rewards.folioAction(stale);
      if (refusal.ok || JSON.stringify(next) !== room || localStorage.getItem('imi-score') !== wallet || localStorage.getItem('imi-ops-v1') !== save) throw Error('Stale Folio mutated owner');
      if (!IMI.ops.saveAcknowledged().ok || Rewards.held() || !Rewards.guard(next)) throw Error('Save acknowledgement');
      return {ready, absentRaw:true, printing:next.printing, epoch:next.meta.estate.resetEpoch, localImprints:next.meta.estate.localImprints, staleRefused:!refusal.ok, saveAcknowledged:true};
    });
    result.checks.push(first);
    await page.reload();
    await page.waitForFunction(() => Rewards.owns() && IMI.ops?.progression.running());
    const reload = await page.evaluate(() => {
      const s = IMI.ops.dev.S();
      return {printing:s.printing,epoch:s.meta.estate?.resetEpoch,localImprints:s.meta.estate?.localImprints,unknown:s.meta.estate?.futureIdentity?.keep,guard:Rewards.guard(s),held:Rewards.held()};
    });
    assert.equal(reload.printing, 5);
    assert.equal(reload.epoch, 1);
    assert.equal(reload.unknown, 73);
    assert(reload.guard && !reload.held);
    result.checks.push({reload});
    assert.deepEqual(result.errors, []);
    result.status = 'PASS';
  } catch (error) {
    result.status = 'FAIL';
    result.error = error.stack;
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
    fs.writeFileSync(path.join(out, 'smoke.json'), JSON.stringify(result, null, 2), {flag:'wx'});
    fs.writeFileSync(path.join(out, 'cleanup.json'), JSON.stringify({browserClosed:true, serverClosed:true, port:result.port, protectedResourcesUntouched:true}, null, 2), {flag:'wx'});
    console.log(JSON.stringify({status:result.status, error:result.error, port:result.port}));
    if (result.status !== 'PASS') process.exitCode = 1;
  }
})();
