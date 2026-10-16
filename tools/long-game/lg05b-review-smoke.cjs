const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const assert = require('node:assert/strict');
const puppeteer = require('C:/Users/arran/pp/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js');

const root = path.resolve(__dirname, '../..');
const output = path.join(root, 'docs/plan/long-game/evidence/LG-05/review-imprints-r1/fresh-smoke-r6.json');
const mime = {'.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.svg':'image/svg+xml', '.png':'image/png', '.webp':'image/webp'};
const server = http.createServer((req, res) => {
  const file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
  if (!file.startsWith(root + path.sep)) { res.writeHead(403); res.end(); return; }
  fs.readFile(file, (error, data) => {
    if (error) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, {'Content-Type':mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control':'no-store'});
    res.end(data);
  });
});

(async () => {
  let browser;
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const result = {origin, checks:[], errors:[]};
  try {
    browser = await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe', headless:true});
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    await page.setBypassServiceWorker(true);
    page.on('pageerror', error => result.errors.push(error.message));
    await page.goto(origin + '/index.html');
    const fixture = await page.evaluate(() => IMI.ops.dev.S());
    fixture.intro = {...fixture.intro, done:true, train:true, words:true, shop:true};
    fixture.printing = 7;
    fixture.legacy = {stars:17, total:60, ups:{...fixture.legacy.ups, seed:1, crew:1}, futureLegacy:'review-retain'};
    fixture.awards = Object.fromEntries([...fs.readFileSync(path.join(root, 'ops.js'), 'utf8').matchAll(/AW\('([^']+)',/g)].map(match => [match[1], true]));
    fixture.meta.futureReview = {value:'review-retain'};
    fixture.lastSeen = Date.now();
    const seed = await page.evaluateOnNewDocument(state => {
      localStorage.setItem('imi-ops-v1', JSON.stringify(state));
      localStorage.setItem('imi-score', JSON.stringify({economyVersion:1, score:123456, futureWallet:'review-retain'}));
    }, fixture);
    await page.goto(origin + '/index.html?lg01a=1&lg05folio=1&lg05layers=1#play');
    await page.waitForFunction(() => window.Rewards?.owns() && IMI.ops.progression.running());
    await page.removeScriptToEvaluateOnNewDocument(seed.identifier);
    result.before = await page.evaluate(() => ({printing:IMI.ops.dev.S().printing, intro:IMI.ops.dev.S().intro,
      legacy:IMI.ops.dev.S().legacy, layers:IMI.ops.dev.S().meta.layers, rewardOwned:Rewards.owns()}));
    const first = await page.evaluate(() => {
      const s = () => IMI.ops.dev.S();
      const act = (action, id) => Rewards.layerAction({action, id, expected:JSON.parse(JSON.stringify(s().meta.layers ?? null))});
      s().rewards.claims['future:review'] = {value:'review-retain'};
      const quote = Layers.quote(s());
      const preview = IMI.ops.extensions.layerPreview();
      const founded = Rewards.layerAction({action:'found', quote, expected:null});
      const press = act('buy','press');
      const genre = act('genre','mystery');
      const secondGenre = act('genre','poetry');
      const charter = act('buy','charter');
      const duplicate = act('buy','press');
      return {quote, projectedAmount:preview.reward?.amount, founded, press, genre, secondGenre, charter, duplicate,
        state:{printing:s().printing, runEarned:s().run.earned, layers:s().meta.layers, legacy:s().legacy,
          unknown:s().meta.futureReview, claim:s().rewards.claims['layer:imprint:first'], futureClaim:s().rewards.claims['future:review']},
        wallet:JSON.parse(localStorage.getItem('imi-score'))};
    });
    assert.equal(first.quote.seals, 2);
    assert.equal(first.quote.delta, 60);
    assert.equal(first.founded.ok, true);
    assert.equal(first.press.ok, true);
    assert.equal(first.genre.ok, true);
    assert.equal(first.charter.ok, true);
    assert.equal(first.secondGenre.ok, false);
    assert.equal(first.duplicate.ok, false);
    assert.equal(first.state.printing, 0);
    assert.equal(first.state.runEarned, 0);
    assert.equal(first.state.layers.count, 1);
    assert.equal(first.state.layers.baseline, 60);
    assert.equal(first.state.layers.seals, 0);
    assert.equal(first.state.layers.genre, 'mystery');
    assert.equal(first.state.legacy.futureLegacy, 'review-retain');
    assert.equal(first.state.unknown.value, 'review-retain');
    assert.equal(first.state.futureClaim.value, 'review-retain');
    assert.equal(first.state.claim.status, 'committed');
    assert.equal(first.state.claim.descriptor.amount, first.projectedAmount);
    assert.equal(first.wallet.score, 25000);
    assert.equal(first.wallet.futureWallet, 'review-retain');
    result.checks.push('native Core and Rewards D60 foundation, 2 Seals, projected L0, Seed Money, representative retention, press, genre, charter and duplicate refusals');
    await page.reload();
    await page.waitForFunction(() => window.Rewards?.owns() && IMI.ops.progression.running());
    const reloaded = await page.evaluate(() => {
      const s = IMI.ops.dev.S();
      return {layers:s.meta.layers, claim:s.rewards.claims['layer:imprint:first'], letters:Object.values(s.desks[0].letters).reduce((a,b) => a+b,0),
        legacy:s.legacy, unknown:s.meta.futureReview, futureClaim:s.rewards.claims['future:review'], wallet:JSON.parse(localStorage.getItem('imi-score')),
        duplicate:Rewards.layerAction({action:'buy', id:'press', expected:JSON.parse(JSON.stringify(s.meta.layers))})};
    });
    assert.equal(reloaded.layers.count, 1);
    assert.equal(reloaded.layers.seals, 0);
    assert.equal(reloaded.layers.genre, 'mystery');
    assert.equal(reloaded.letters, first.projectedAmount);
    assert.equal(reloaded.claim.status, 'committed');
    assert.equal(reloaded.legacy.futureLegacy, 'review-retain');
    assert.equal(reloaded.unknown.value, 'review-retain');
    assert.equal(reloaded.futureClaim.value, 'review-retain');
    assert.equal(reloaded.wallet.score, 25000);
    assert.equal(reloaded.wallet.futureWallet, 'review-retain');
    assert.equal(reloaded.duplicate.ok, false);
    result.checks.push('reload retains Seal balance, genre, claims, Letters and wallet metadata; duplicate purchase still refuses');
    result.first = first;
    result.reloaded = reloaded;
    await context.close();
  } catch (error) {
    result.errors.push(error.stack || String(error));
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
    result.cleanup = {browserClosed:!!browser, serverClosed:!server.listening, ownedPort:origin};
    fs.mkdirSync(path.dirname(output), {recursive:true});
    fs.writeFileSync(output, JSON.stringify(result,null,2), {flag:'wx'});
    process.stdout.write(JSON.stringify({checks:result.checks, errors:result.errors, cleanup:result.cleanup}) + '\n');
  }
})();
