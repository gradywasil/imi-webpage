const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const puppeteer = require('C:/Users/arran/pp/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js');

const root = process.cwd();
const out = path.join(root, 'docs/plan/long-game/evidence/LG-09/first-play-review-r1');
const source = JSON.parse(fs.readFileSync('docs/plan/long-game/evidence/LG-09/first-play-r1/final-source.json'));
const fixture = JSON.parse(fs.readFileSync('docs/plan/long-game/evidence/LG-09/first-play-r1/verified-final-save.json'));
const state = fixture.state, now = Date.now();
state.lastSeen = now;
state.printing = 7;
state.legacy.total = 720;
state.legacy.stars = 367;
state.legacy.ups.crew = 1;
state.meta.estate.localImprints = 5;
state.meta.estate.starBaseline = 360;
state.meta.layers.baseline = 360;
state.meta.archive.through = now;
for (const entry of state.meta.archive.entries) { entry.born = now - 48 * 3600000; entry.age = 48 * 3600000; }
const server = http.createServer((req, res) => {
  const file = path.resolve(root, '.' + new URL(req.url, 'http://local').pathname);
  if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
  fs.readFile(file, (error, body) => {
    res.writeHead(error ? 404 : 200, {'Content-Type':({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2'})[path.extname(file)] || 'application/octet-stream','Cache-Control':'no-store'});
    res.end(error ? 'missing' : body);
  });
});
const result = {status:'UNVERIFIED', fixture:'Reused acknowledged signed implementation save; controlled Estate 3 gate, Printing 8, five local Imprints, 360 new stars, mature Archive ages and Veteran Crew. Earlier 99,000-letter prefix was seeded in implementation.', checks:[], pageErrors:[], loadedHashes:{}};
const check = (name, pass, facts) => { result.checks.push({name,pass:!!pass,facts}); assert(pass, name + ': ' + JSON.stringify(facts)); };
const clone = value => JSON.parse(JSON.stringify(value));
(async () => {
  let browser;
  try {
    for (const [file, expected] of Object.entries(source)) check('packaged source ' + file, crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex') === expected.sha256);
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    result.port = server.address().port;
    check('task owned port', ![8000,8354,8356,8358,8397].includes(result.port));
    browser = await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
    const page = await browser.newPage();
    await page.setBypassServiceWorker(true);
    await page.setCacheEnabled(false);
    page.on('pageerror', error => result.pageErrors.push(error.stack || error.message));
    page.on('response', async response => { const file = new URL(response.url()).pathname.slice(1); if (source[file]) result.loadedHashes[file] = crypto.createHash('sha256').update(await response.buffer()).digest('hex'); });
    const seed = await page.evaluateOnNewDocument(data => {
      localStorage.setItem('imi-ops-v1', JSON.stringify(data.state));
      localStorage.setItem('imi-score', JSON.stringify(data.wallet));
      localStorage.setItem('imi-tour', JSON.stringify({version:2,done:true,tipsOff:true}));
      localStorage.setItem('imi-sound', 'off');
      localStorage.setItem('imi-fx', 'low');
      Math.random = () => .5;
    }, fixture);
    await page.goto(`http://127.0.0.1:${result.port}/index.html?lg01a=1&lg05folio=1&lg05layers=1&lg08estate=1&lg08archive=1&lg09works=1#play`);
    await page.removeScriptToEvaluateOnNewDocument(seed.identifier);
    await page.waitForFunction(() => Rewards.owns() && IMI.ops?.progression.running() && !Rewards.held(), {timeout:15000});
    const first = await page.evaluate(() => {
      const s = IMI.ops.extensions.state();
      const before = {works:JSON.parse(JSON.stringify(s.meta.works)), archive:JSON.parse(JSON.stringify(s.meta.archive)), epoch:s.meta.estate.resetEpoch, count:s.meta.estate.count, claims:JSON.stringify(s.rewards.claims), awards:JSON.stringify(s.awards), premium:JSON.stringify(s.prem), factor:WorksPlay.factor(s)};
      const normal = Rewards.owns() && IMI.ops.progression.running() && Rewards.guard(s) && !Rewards.held();
      const originalFactor = WorksPlay.factor;
      WorksPlay.factor = () => 1;
      const neutral = IMI.ops.extensions.estatePreview();
      WorksPlay.factor = originalFactor;
      const offer = IMI.ops.extensions.estatePreview();
      const quoted = {rate:offer.basis.letters[0], neutralRate:neutral.basis.letters[0], crew:offer.room.desks[0].crew, neutralCrew:neutral.room.desks[0].crew, projectedFactor:WorksPlay.factor(offer.room), reward:offer.reward};
      const settled = JSON.parse(JSON.stringify(IMI.ops.extensions.state().meta.archive));
      const reset = Rewards.estateAction({action:'reset',quote:offer.quote});
      const after = IMI.ops.extensions.state();
      const actualRate = IMI.ops.dev.autoRate(after.desks[0]);
      const duplicate = Rewards.worksPlayAction({action:'sign',...Layers.epochFields(after),content:WorksPlay.identity,expected:WorksPlay.snapshot(after)});
      return {normal,before,quoted,settled,reset,after:{works:after.meta.works,archive:after.meta.archive,epoch:after.meta.estate.resetEpoch,count:after.meta.estate.count,paws:after.desks[0].paws,crew:after.desks[0].crew,claims:JSON.stringify(after.rewards.claims),awards:JSON.stringify(after.awards),premium:JSON.stringify(after.prem),factor:WorksPlay.factor(after),actualRate},duplicate};
    });
    result.path = first;
    check('normal owner before reset', first.normal);
    check('fixed signed receipt and Playbill present', first.before.works.signed && first.before.works.signature.claimId === 'works:midsummer-chimp:first' && first.before.works.playbill.number === 1 && first.before.works.index === 20000 && first.before.factor === 1.01);
    check('projected Veteran Crew uses factor exactly once', first.quoted.crew.length === 2 && JSON.stringify(first.quoted.crew) === JSON.stringify(first.quoted.neutralCrew) && first.quoted.projectedFactor === 1.01 && Math.abs(first.quoted.rate / first.quoted.neutralRate - 1.01) < 1e-12, first.quoted);
    check('eligible Estate reset acknowledged', first.reset.ok, first.reset);
    check('Estate epoch and count advance once', first.after.epoch === first.before.epoch + 1 && first.after.count === first.before.count + 1);
    check('fixed receipt Playbill and prefix retained', JSON.stringify(first.after.works) === JSON.stringify(first.before.works) && !first.after.works.working);
    check('actual starting crew receives factor once', first.after.paws === 2 && first.after.crew.length === 2 && first.after.factor === 1.01 && first.after.actualRate > 0, {projected:first.quoted.rate,actual:first.after.actualRate});
    check('Archive settled without duplicate', !first.after.archive.pending && first.after.archive.sequence === first.settled.sequence && first.after.archive.entries.length === first.settled.entries.length && JSON.stringify(first.after.archive.usedCopies) === JSON.stringify(first.settled.usedCopies), {before:first.settled.sequence,after:first.after.archive.sequence});
    check('no second Works signature or generic reward', !first.duplicate.ok && first.after.claims === first.before.claims && first.after.awards === first.before.awards && first.after.premium === first.before.premium, first.duplicate);
    await page.reload();
    await page.waitForFunction(() => Rewards.owns() && IMI.ops?.progression.running() && !Rewards.held(), {timeout:15000});
    const reloaded = await page.evaluate(() => { const s=IMI.ops.extensions.state(); const duplicate=Rewards.worksPlayAction({action:'sign',...Layers.epochFields(s),content:WorksPlay.identity,expected:WorksPlay.snapshot(s)}); return {normal:Rewards.owns() && Rewards.guard(s) && IMI.ops.progression.running() && !Rewards.held(),works:s.meta.works,archive:s.meta.archive,epoch:s.meta.estate.resetEpoch,count:s.meta.estate.count,factor:WorksPlay.factor(s),rate:IMI.ops.dev.autoRate(s.desks[0]),duplicate}; });
    result.reloaded = reloaded;
    check('reload keeps signed receipt Playbill prefix and epoch', reloaded.normal && JSON.stringify(reloaded.works) === JSON.stringify(first.before.works) && reloaded.epoch === first.after.epoch && reloaded.count === first.after.count && reloaded.factor === 1.01);
    check('reload keeps crew rate and refuses Works replay', reloaded.rate === first.after.actualRate && !reloaded.duplicate.ok, reloaded.duplicate);
    check('reload has only ordinary Archive settlement', reloaded.archive.sequence >= first.after.archive.sequence && reloaded.archive.entries.length === first.after.archive.entries.length && JSON.stringify(reloaded.archive.usedCopies) === JSON.stringify(first.after.archive.usedCopies) && !reloaded.archive.pending, {before:first.after.archive.sequence,after:reloaded.archive.sequence});
    for (const [file, hash] of Object.entries(result.loadedHashes)) check('loaded source ' + file, hash === source[file].sha256);
    check('no page errors', result.pageErrors.length === 0, result.pageErrors);
    result.status = 'PASS';
  } catch (error) { result.error = error.stack || error.message; process.exitCode = 1; }
  finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
    result.cleanup = {browserClosed:!!browser,serverClosed:true,port:result.port,protectedResourcesTouched:false};
    fs.mkdirSync(out, {recursive:true});
    fs.writeFileSync(path.join(out,'estate-signed-final.json'),JSON.stringify(result,null,2),{flag:'wx'});
    console.log(JSON.stringify({status:result.status,checks:result.checks.map(c=>({name:c.name,pass:c.pass})),error:result.error,cleanup:result.cleanup},null,2));
  }
})();
