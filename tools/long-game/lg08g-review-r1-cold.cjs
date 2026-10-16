const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const puppeteer = require('C:/Users/arran/pp/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js');

const root = process.cwd();
const evidence = path.join(root, 'docs/plan/long-game/evidence/LG-08/printing-review-r1');
const artifact = JSON.parse(fs.readFileSync(path.join(root, 'docs/plan/long-game/evidence/LG-08/printing-ack-r1/final-held.json')));
const expected = JSON.parse(fs.readFileSync(path.join(root, 'docs/plan/long-game/evidence/LG-08/printing-ack-r1/final-source.json')));
const files = Object.keys(expected);
const flags = '?lg08print=1&lg03=1&lg01a=1&lg05folio=1&lg05layers=1&lg08estate=1&lg08archive=1&lg09works=1#play';
const result = {status:'FAIL', checks:[], errors:[], source:{}};
const check = (name, value) => {result.checks.push({name, pass:!!value}); assert(value, name);};
const server = http.createServer((req, res) => {
  const file = path.resolve(root, '.' + new URL(req.url, 'http://localhost').pathname);
  if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
  fs.readFile(file, (error, bytes) => {
    res.writeHead(error ? 404 : 200, {'Content-Type':({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2'})[path.extname(file)] || 'application/octet-stream', 'Cache-Control':'no-store'});
    res.end(error ? 'missing' : bytes);
  });
});

(async () => {
  let browser;
  try {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    result.port = server.address().port;
    check('task ephemeral port', ![8000,8354,8356,8358,8397].includes(result.port));
    browser = await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe', headless:true});
    const page = await browser.newPage();
    page.on('pageerror', error => result.errors.push(error.message));
    page.on('response', async response => {
      const name = new URL(response.url()).pathname.slice(1);
      if (files.includes(name)) result.source[name] = crypto.createHash('sha256').update(await response.buffer()).digest('hex');
    });
    await page.setBypassServiceWorker(true);
    await page.setCacheEnabled(false);
    const injection = await page.evaluateOnNewDocument(a => {
      localStorage.setItem('imi-ops-v1', a.raw);
      localStorage.setItem('imi-score', a.wallet);
      localStorage.setItem('imi-tour', JSON.stringify({version:2,done:true,tipsOff:true}));
      localStorage.setItem('imi-fx', 'low');
    }, {raw:artifact.raw,wallet:artifact.wallet});
    const base = `http://127.0.0.1:${result.port}/index.html`;
    await page.goto(base + '#play');
    await page.removeScriptToEvaluateOnNewDocument(injection.identifier);
    const gate = await page.evaluate(() => ({blocked:VaultSaveGate.blocked, ops:!!window.IMI?.ops, raw:localStorage.getItem('imi-ops-v1'), wallet:localStorage.getItem('imi-score')}));
    check('cold missing flags block before owner and preserve saved bytes', gate.blocked && !gate.ops && gate.raw === artifact.raw && gate.wallet === artifact.wallet);
    await page.click('.o-vault-gate button');
    await page.waitForFunction(() => window.Rewards?.owns() && window.IMI?.ops?.progression.running() && !Rewards.held(), {timeout:15000});
    const pending = artifact.state.meta.automation.print.pending;
    const recovered = await page.evaluate(staleQuote => {
      const s = IMI.ops.extensions.state();
      const claims = JSON.stringify(s.rewards.claims);
      return {printing:s.printing, stars:s.legacy.stars, total:s.legacy.total, epoch:s.meta.estate.resetEpoch, editions:s.editions['ape-in-the-cape'], proof:s.meta.automation.print.manual.complete,
        pending:!!s.meta.automation.print.pending, crew:s.desks[0].crew, balance:IMI.bananas.get(), earned:s.run.earned, claims,
        retry:Rewards.retry(), stale:Rewards.printingAction({origin:'manual',quote:staleQuote}), held:Rewards.held(), running:IMI.ops.progression.running(), guard:Rewards.guard(s)};
    }, pending.quote);
    result.recovered = {...recovered, crew:recovered.crew.map(({name,look,trait,talent,coach,rerolls,hat,shiny}) => ({name,look,trait,talent,coach,rerolls,hat,shiny})), claims:undefined};
    check('cold owner settled and source frozen gain/proof once', recovered.running && recovered.guard && !recovered.held && recovered.proof && !recovered.pending && recovered.printing === artifact.state.printing + 1 && recovered.stars === artifact.state.legacy.stars + pending.quote.gain && recovered.total === artifact.state.legacy.total + pending.quote.gain);
    check('wallet paid seed and room rollover once', recovered.balance === pending.seed && recovered.earned === 0 && recovered.epoch === artifact.state.meta.estate.resetEpoch + 1 && recovered.editions === (artifact.state.editions['ape-in-the-cape'] || 0) + 1);
    const fixedCrew = crew => crew.map(({xp,lv,...fixed}) => fixed);
    check('frozen Veteran Crew retained', JSON.stringify(fixedCrew(recovered.crew)) === JSON.stringify(fixedCrew(pending.crew)));
    check('stale action and redundant Retry refuse', recovered.retry === true && !recovered.stale.ok);
    await page.reload();
    await page.waitForFunction(() => window.Rewards?.owns() && window.IMI?.ops?.progression.running() && !Rewards.held(), {timeout:15000});
    const reloaded = await page.evaluate(() => {const s=IMI.ops.extensions.state();return {printing:s.printing,stars:s.legacy.stars,total:s.legacy.total,epoch:s.meta.estate.resetEpoch,editions:s.editions['ape-in-the-cape'],proof:s.meta.automation.print.manual.complete,pending:!!s.meta.automation.print.pending,claims:JSON.stringify(s.rewards.claims)};});
    check('reload keeps proof and no extra rollover or claim', reloaded.proof && !reloaded.pending && reloaded.printing === recovered.printing && reloaded.stars === recovered.stars && reloaded.total === recovered.total && reloaded.epoch === recovered.epoch && reloaded.editions === recovered.editions && reloaded.claims === recovered.claims);
    check('browser had no page errors', result.errors.length === 0);
    result.source['sw.js'] = crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'sw.js'))).digest('hex');
    check('five loaded and SW disk hashes match final candidate', files.every(file => result.source[file] === expected[file].sha256));
    result.reloaded = {...reloaded,claims:undefined};
    result.status = 'PASS';
  } catch (error) {result.error = error.stack || error.message;}
  finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
    result.cleanup = {browserClosed:true,serverClosed:true,protectedResourcesUntouched:true};
    fs.writeFileSync(path.join(evidence,process.argv[2] || 'fresh-cold.json'), JSON.stringify(result,null,2), {flag:'wx'});
    console.log(JSON.stringify({status:result.status,checks:result.checks.length,error:result.error}));
    if (result.status !== 'PASS') process.exitCode = 1;
  }
})();
