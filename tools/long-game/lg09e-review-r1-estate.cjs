const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const puppeteer = require('C:/Users/arran/pp/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js');

const root = process.cwd();
const out = path.join(root, 'docs/plan/long-game/evidence/LG-09/anthology-review-r1');
const source = JSON.parse(fs.readFileSync('docs/plan/long-game/evidence/LG-09/anthology-r1/final-source.json'));
const fixture = JSON.parse(fs.readFileSync('docs/plan/long-game/evidence/LG-09/anthology-r1/confirmation-final-save.json'));
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
const result = {status:'UNVERIFIED',fixture:'Implementation acknowledged completed save; all later near-finish prefixes were seeded, not naturally acquired. Estate gate, Veteran Crew and Archive ages are controlled.',checks:[],pageErrors:[],loadedHashes:{}};
const check = (name, pass, facts) => { result.checks.push({name,pass:!!pass,facts}); assert(pass, name + ': ' + JSON.stringify(facts)); };
(async () => {
  let browser;
  try {
    for (const [file, expected] of Object.entries(source)) check('packaged source '+file, crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex') === expected.sha256);
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    result.port = server.address().port;
    check('owned ephemeral port', ![8000,8354,8356,8358,8397].includes(result.port));
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
      const s = IMI.ops.extensions.state(), clone = x => JSON.parse(JSON.stringify(x));
      const before = {works:clone(s.meta.works),archive:clone(s.meta.archive),epoch:s.meta.estate.resetEpoch,count:s.meta.estate.count,claims:clone(s.rewards.claims),awards:clone(s.awards),premium:clone(s.prem),factor:WorksPlay.factor(s)};
      const normal = Rewards.owns() && IMI.ops.progression.running() && Rewards.guard(s) && !Rewards.held();
      const original = WorksPlay.factor;
      let neutral;
      try { WorksPlay.factor = () => 1; neutral = IMI.ops.extensions.estatePreview(); }
      finally { WorksPlay.factor = original; }
      const offer = IMI.ops.extensions.estatePreview();
      const projected = {rate:offer.basis.letters[0],neutralRate:neutral.basis.letters[0],crew:offer.room.desks[0].crew,neutralCrew:neutral.room.desks[0].crew,factor:WorksPlay.factor(offer.room),quote:offer.quote};
      const settled = clone(IMI.ops.extensions.state().meta.archive);
      const reset = Rewards.estateAction({action:'reset',quote:offer.quote});
      const after = IMI.ops.extensions.state();
      const rate = IMI.ops.dev.autoRate(after.desks[0]);
      let neutralActual;
      try { WorksPlay.factor = () => 1; neutralActual = IMI.ops.dev.autoRate(after.desks[0]); }
      finally { WorksPlay.factor = original; }
      const refusedIntro = Rewards.worksPlayAction({action:'introduce',...Layers.epochFields(after),content:WorksPlay.commandContent(after,'introduce'),expected:WorksPlay.snapshot(after)});
      const duplicate = Rewards.worksPlayAction({action:'sign',...Layers.epochFields(after),content:WorksPlay.commandContent(after,'sign'),expected:WorksPlay.snapshot(after)});
      const afterActions = IMI.ops.extensions.state();
      IMI.ops.extensions.worksPlayContinue();
      return {normal,before,projected,settled,reset,after:{works:clone(afterActions.meta.works),archive:clone(afterActions.meta.archive),epoch:afterActions.meta.estate.resetEpoch,count:afterActions.meta.estate.count,paws:afterActions.desks[0].paws,crew:clone(afterActions.desks[0].crew),claims:clone(afterActions.rewards.claims),awards:clone(afterActions.awards),premium:clone(afterActions.prem),factor:WorksPlay.factor(afterActions),rate,neutralActual},refusedIntro,duplicate};
    });
    result.path = first;
    const records = w => [w,...Object.values(w.anthology.plays)];
    const firstRoot = w => { const x = structuredClone(w); delete x.anthology; return x; };
    const valid = w => records(w).length === 7 && records(w).every((r,i) => r.signed && r.index === 20000 && r.signature?.claimId === ['works:midsummer-chimp:first','works:the-chimpest:first','works:groomio-and-juliet:first','works:ookthello:first','works:macaquebeth:first','works:king-lemur:first','works:chimplet:first'][i] && r.playbill?.number === i+1);
    check('normal owner and completed fixture', first.normal && valid(first.before.works) && first.before.factor === 1.07);
    check('projected starter factor once', first.projected.crew.length === 2 && JSON.stringify(first.projected.crew) === JSON.stringify(first.projected.neutralCrew) && first.projected.factor === 1.07 && Math.abs(first.projected.rate/first.projected.neutralRate-1.07)<1e-12,first.projected);
    check('eligible Estate save acknowledged', first.reset.ok, first.reset);
    check('epoch and Estate count advance once', first.after.epoch === first.before.epoch+1 && first.after.count === first.before.count+1);
    check('all records and completion retained, work exited', valid(first.after.works) && JSON.stringify(first.after.works) === JSON.stringify(first.before.works) && JSON.stringify(firstRoot(first.after.works)) === JSON.stringify(firstRoot(first.before.works)) && first.after.works.anthology.completion?.completionId === 'works:seven-adaptations:completion:v1' && records(first.after.works).every(r=>!r.working));
    check('actual starter rate factor once', first.after.paws === 2 && first.after.crew.length === 2 && first.after.factor === 1.07 && Math.abs(first.after.rate/first.after.neutralActual-1.07)<1e-12,{rate:first.after.rate,neutral:first.after.neutralActual});
    check('Archive receipts and copies retained with legal sequence', !first.after.archive.pending && first.after.archive.sequence >= first.settled.sequence && first.after.archive.entries.length === first.settled.entries.length && JSON.stringify(first.after.archive.usedCopies) === JSON.stringify(first.settled.usedCopies),{before:first.settled.sequence,after:first.after.archive.sequence});
    check('duplicate, introduction and Continue grant nothing', !first.duplicate.ok && !first.refusedIntro.ok && JSON.stringify(first.after.claims) === JSON.stringify(first.before.claims) && JSON.stringify(first.after.awards) === JSON.stringify(first.before.awards) && JSON.stringify(first.after.premium) === JSON.stringify(first.before.premium),{duplicate:first.duplicate,refusedIntro:first.refusedIntro});
    await page.reload();
    await page.waitForFunction(() => Rewards.owns() && IMI.ops?.progression.running() && !Rewards.held(), {timeout:15000});
    const reloaded = await page.evaluate(() => {const s=IMI.ops.extensions.state();return {normal:Rewards.owns()&&Rewards.guard(s)&&IMI.ops.progression.running()&&!Rewards.held(),works:s.meta.works,archive:s.meta.archive,epoch:s.meta.estate.resetEpoch,count:s.meta.estate.count,factor:WorksPlay.factor(s),rate:IMI.ops.dev.autoRate(s.desks[0])};});
    result.reloaded = reloaded;
    check('reload retains seven records, marker and epoch', reloaded.normal && valid(reloaded.works) && JSON.stringify(reloaded.works) === JSON.stringify(first.before.works) && reloaded.epoch === first.after.epoch && reloaded.count === first.after.count && reloaded.factor === 1.07 && reloaded.rate === first.after.rate);
    check('reload Archive retains receipts, allows later income sequence', reloaded.archive.sequence >= first.after.archive.sequence && reloaded.archive.entries.length === first.after.archive.entries.length && JSON.stringify(reloaded.archive.usedCopies) === JSON.stringify(first.after.archive.usedCopies) && !reloaded.archive.pending,{before:first.after.archive.sequence,after:reloaded.archive.sequence});
    for (const [file, hash] of Object.entries(result.loadedHashes)) check('loaded source '+file, hash === source[file].sha256);
    check('all product scripts loaded', ['works-catalogue.js','works-play.js','works.js','ops.js','layers.js','folio.js','archive.js'].every(file=>result.loadedHashes[file]===source[file].sha256));
    check('no page errors', result.pageErrors.length === 0,result.pageErrors);
    result.status='PASS';
  } catch(error) {result.error=error.stack||error.message;process.exitCode=1;}
  finally {if(browser) await browser.close();await new Promise(resolve=>server.close(resolve));result.cleanup={browserClosed:!!browser,serverClosed:true,port:result.port,protectedResourcesTouched:false};fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'estate-path.json'),JSON.stringify(result,null,2),{flag:'wx'});console.log(JSON.stringify({status:result.status,checks:result.checks.map(c=>({name:c.name,pass:c.pass})),error:result.error,cleanup:result.cleanup},null,2));}
})();
