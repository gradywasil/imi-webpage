const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const pp = require('C:/Users/arran/pp/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js');
const root = process.cwd();
const out = path.join(root, 'docs/plan/long-game/evidence/LG-09/hall-review-r1');
const attempt = process.argv[2];
assert(/^[a-z0-9-]+$/.test(attempt), 'Provide a unique attempt name');
const seal = JSON.parse(fs.readFileSync('docs/plan/long-game/evidence/LG-09/hall-r1/release-seal/final-source.json'));
const source = Object.fromEntries(Object.keys(seal).map(file => [file, crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')]));
assert(Object.entries(source).every(([file, hash]) => hash === seal[file].sha256), 'Product source differs from release seal');
const raw = JSON.parse(JSON.parse(fs.readFileSync('docs/plan/long-game/evidence/LG-09/hall-r1/release-main-raw-history-fixture.json')));
raw.desks[0].paws = 2;
raw.desks[0].crew[0].look = 'v05';
raw.desks[0].crew[0].name = 'Saved cyclist';
raw.desks[0].crew.push({name:'Repair scout',trait:'scout',talent:0,coach:0,rerolls:0,xp:0,lv:1,hat:0,shiny:false});
raw.looks = {v01:1,v02:true,v03:1,v04:1,v29:2,futureLook:{keep:true}};
raw.meta = {};
raw.rewards = {};
const fixture = JSON.stringify(raw);
const write = (name, value) => fs.writeFileSync(path.join(out, `${attempt}-${name}`), JSON.stringify(value, null, 2), {flag:'wx'});
const server = http.createServer((req, res) => {
  const file = path.resolve(root, '.' + new URL(req.url, 'http://local').pathname);
  if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
  fs.readFile(file, (error, bytes) => {
    res.writeHead(error ? 404 : 200, {'Content-Type':({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2'})[path.extname(file)] || 'application/octet-stream', 'Cache-Control':'no-store'});
    res.end(error ? 'missing' : bytes);
  });
});
(async () => {
  let browser;
  const result = {status:'FAIL', source, errors:[], fixture:{rawSeen:raw.looks, rawCrew:raw.desks[0].crew, hallAbsent:raw.meta.hall === undefined, rewardAbsent:raw.rewards.storedGold === undefined}};
  try {
    fs.mkdirSync(out, {recursive:true});
    write('fresh-history-raw.json', fixture);
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    result.port = server.address().port;
    assert(![8000,8354,8356,8358,8397].includes(result.port));
    browser = await pp.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
    const page = await browser.newPage();
    await page.setBypassServiceWorker(true);
    await page.setCacheEnabled(false);
    page.on('pageerror', error => result.errors.push(error.stack));
    await page.evaluateOnNewDocument(value => {
      if (!localStorage.getItem('imi-ops-v1')) localStorage.setItem('imi-ops-v1', value);
      localStorage.setItem('imi-tour', JSON.stringify({version:2,done:true,tipsOff:true}));
      localStorage.setItem('imi-fx','low');
      localStorage.setItem('imi-sound','off');
      Date.now = () => 1792080000000;
    }, fixture);
    await page.goto(`http://127.0.0.1:${result.port}/index.html?lg09hall=1&lg01a=1#play`);
    await page.waitForFunction(() => window.Rewards?.owns() && window.IMI?.ops?.progression?.running() && !Rewards.held());
    result.initial = await page.evaluate(() => {
      const state = IMI.ops.dev.S(), saved = JSON.parse(localStorage.getItem('imi-ops-v1'));
      return {historical:state.meta.hall.historical, discovered:state.meta.hall.discovered, crew:state.desks[0].crew.map(t => ({name:t.name,look:t.look})), liveLooks:state.looks, rawLooks:saved.looks, rawHall:saved.meta.hall, noToken:!state.rewards.storedGold.tokens[Hall.id], complete:Hall.complete(state.meta.hall), held:Rewards.held()};
    });
    write('fresh-initial.json', result.initial);
    assert.deepEqual(Object.keys(result.initial.historical).sort(), ['v01','v02','v03','v04','v05']);
    assert.equal(result.initial.crew[0].look,'v05');
    assert(!['v01','v02','v03','v04','v05'].includes(result.initial.crew[1].look));
    assert.equal(result.initial.liveLooks[result.initial.crew[1].look],1);
    assert.equal(result.initial.historical[result.initial.crew[1].look],undefined);
    assert.equal(result.initial.discovered[result.initial.crew[1].look],undefined);
    assert.equal(result.initial.rawLooks.futureLook.keep,true);
    assert.equal(result.initial.rawLooks.v29,2);
    assert(result.initial.complete && result.initial.noToken && !result.initial.held);
    await page.evaluate(() => { IMI.ops.dev.ui.sub.training='book'; IMI.ops.extensions.setTab('training'); IMI.ops.extensions.mark(); });
    await page.waitForSelector('[data-act="hall:claim"]:not([disabled])');
    await page.$eval('[data-act="hall:claim"]', el => el.scrollIntoView({block:'center'}));
    await page.click('[data-act="hall:claim"]');
    result.claim = await page.evaluate(() => {
      const state = IMI.ops.dev.S(), saved = JSON.parse(localStorage.getItem('imi-ops-v1'));
      return {receipt:state.meta.hall.claims[Hall.id], token:state.rewards.storedGold.tokens[Hall.id], storedReceipt:saved.meta.hall.claims[Hall.id], storedToken:saved.rewards.storedGold.tokens[Hall.id], valid:Hall.goldSource(state,Hall.id), count:Object.keys(state.rewards.storedGold.tokens).length, discovered:state.meta.hall.discovered, held:Rewards.held()};
    });
    write('fresh-claim.json', result.claim);
    assert(result.claim.valid && !result.claim.held);
    assert.equal(result.claim.receipt.status,'committed');
    assert.equal(result.claim.token.status,'stored');
    assert.deepEqual(result.claim.receipt,result.claim.storedReceipt);
    assert.deepEqual(result.claim.token,result.claim.storedToken);
    assert.equal(result.claim.count,1);
    assert.equal(result.claim.discovered[result.initial.crew[1].look],undefined);
    await page.reload();
    await page.waitForFunction(() => window.Rewards?.owns() && window.IMI?.ops?.progression?.running() && !Rewards.held());
    result.reload = await page.evaluate(() => {
      const state = IMI.ops.dev.S(), before = JSON.stringify([state.meta.hall,state.rewards.storedGold.tokens]);
      const duplicate = Rewards.hallAction('claim');
      return {valid:Hall.goldSource(state,Hall.id), noSecondGrant:before === JSON.stringify([state.meta.hall,state.rewards.storedGold.tokens]), duplicate, count:Object.keys(state.rewards.storedGold.tokens).length, token:state.rewards.storedGold.tokens[Hall.id], held:Rewards.held()};
    });
    write('fresh-reload.json',result.reload);
    assert(result.reload.valid && result.reload.noSecondGrant && !result.reload.duplicate && !result.reload.held);
    assert.equal(result.reload.count,1);
    assert.equal(result.reload.token.status,'stored');
    assert.deepEqual(result.errors,[]);
    result.status='PASS';
  } catch (error) { result.error=error.stack; }
  finally {
    if (browser) await browser.close();
    if (server.listening) await new Promise(resolve => server.close(resolve));
    write('fresh-results.json',result);
    write('fresh-cleanup.json',{browserClosed:!!browser,serverClosed:!server.listening,protectedResourcesUntouched:true});
    console.log(JSON.stringify({status:result.status,error:result.error,repairLook:result.initial?.crew?.[1]?.look}));
    if (result.status !== 'PASS') process.exitCode=1;
  }
})();
