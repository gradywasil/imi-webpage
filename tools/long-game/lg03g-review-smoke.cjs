const fs = require('node:fs');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const pp = require('C:/Users/arran/pp/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js');

const output = 'docs/plan/long-game/evidence/LG-03/review-challenges-r1/smoke.json';
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const ready = async page => {
  for (let i = 0; i < 100; i++) {
    if (await page.evaluate(() => !!window.IMI?.ops?.dev && Rewards.owns())) return;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw Error('Rewards-enabled Ops did not become ready');
};

(async () => {
  const browser = await pp.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe', headless:true});
  try {
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    await page.setBypassServiceWorker(true);
    await page.setCacheEnabled(false);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:8379/tools/balance.html');
    const fixture = await page.evaluate(() => {
      const s = IMI.ops.dev.S();
      Object.assign(s.intro, {done:true, train:true, words:true, shop:true});
      s.printing = 4;
      s.legacy = {stars:20, total:30, ups:{}};
      s.chDone = {vowel:true, haiku:true, hands:true, timed:true};
      return s;
    });
    fixture.awards = Object.fromEntries([...fs.readFileSync('ops.js','utf8').matchAll(/AW\('([^']+)',/g)].map(match => [match[1], true]));
    assert.equal(Object.keys(fixture.awards).length, 68);
    fixture.lastSeen = 1700001000000;
    const preload = await page.evaluateOnNewDocument(save => {
      window.__LONG_GAME_FIXTURE = {'imi-ops-v1':JSON.stringify(save),
        'imi-score':JSON.stringify({economyVersion:1, score:0})};
    }, fixture);
    await page.goto('http://127.0.0.1:8379/tools/balance.html?lg03=1&lg01a=1');
    await ready(page);
    await page.removeScriptToEvaluateOnNewDocument(preload.identifier);
    const before = await page.evaluate(() => {
      const d = IMI.ops.dev, s = d.S();
      s.run.earned = 12500000;
      d.doPrint('smallcrew');
      document.querySelectorAll('.o-modal,.o-celebrate').forEach(el => el.remove());
      if (s === d.S() || d.S().challenge?.id !== 'smallcrew') throw Error('actual Printing entry failed: ' + JSON.stringify({same:s === d.S(), printing:s.printing, intro:s.intro.done, star:d.starsNow(), owner:Rewards.owns(), status:IMI.ops.progression.running()}));
      const current = d.S();
      const titles = d.RECIPES.filter(r => !r.kid && !r.lib && !r.gen).slice(0, 6);
      current.written = Object.fromEntries(titles.map(r => [r.id, true]));
      d.touchBank();
      const counts = {sold:d.soldCount(), stars:current.legacy.stars, total:current.legacy.total, db:current.prem.earnedTotal};
      __advance(1100);
      d.tick();
      document.querySelectorAll('.o-modal,.o-celebrate').forEach(el => el.remove());
      return {counts, state:d.S(), stored:JSON.parse(localStorage.getItem('imi-ops-v1'))};
    });
    assert.equal(before.counts.sold, 6);
    assert.equal(before.state.challenge, null);
    assert.equal(before.state.chDone.smallcrew, true);
    assert.equal(before.state.meta.automation.tiers.hire, 1);
    assert.equal(before.stored.chDone.smallcrew, true);
    assert.equal(before.stored.meta.automation.tiers.hire, 1);
    const claim = before.stored.rewards.claims['challenge:smallcrew:first'];
    assert.equal(claim.status, 'committed');
    assert.equal(claim.descriptor.kind, 'L');
    assert.equal(claim.descriptor.amount, Math.floor(Math.max(50, Math.min(5000, 180 * claim.descriptor.rate))));
    assert.equal(before.state.legacy.stars, before.counts.stars);
    assert.equal(before.state.legacy.total, before.counts.total);
    assert.equal(before.state.prem.earnedTotal, before.counts.db);
    const reloadFixture = await page.evaluateOnNewDocument(save => {
      window.__LONG_GAME_FIXTURE = {'imi-ops-v1':JSON.stringify(save),
        'imi-score':JSON.stringify({economyVersion:1, score:0})};
    }, before.stored);
    await page.reload();
    await ready(page);
    await page.removeScriptToEvaluateOnNewDocument(reloadFixture.identifier);
    const after = await page.evaluate(() => {
      const s = IMI.ops.dev.S();
      const initial = JSON.stringify(s.rewards.claims);
      __advance(1100);
      IMI.ops.dev.tick();
      return {done:s.chDone.smallcrew, hire:s.meta.automation.tiers.hire,
        claim:s.rewards.claims['challenge:smallcrew:first'], claimsUnchanged:JSON.stringify(s.rewards.claims) === initial,
        stored:JSON.parse(localStorage.getItem('imi-ops-v1'))};
    });
    assert.equal(after.done, true);
    assert.equal(after.hire, 1);
    assert.deepEqual(after.claim, claim);
    assert.equal(after.claimsUnchanged, true);
    assert.equal(after.stored.meta.automation.tiers.hire, 1);
    assert.deepEqual(after.stored.rewards.claims['challenge:smallcrew:first'], claim);
    assert.deepEqual(errors, []);
    fs.mkdirSync('docs/plan/long-game/evidence/LG-03/review-challenges-r1', {recursive:true});
    fs.writeFileSync(output, JSON.stringify({qualification:'Controlled authored sold-record fixture through actual soldCount/checkChallenge; no natural pacing claim',
      source:{ops:hash('ops.js'), automation:hash('automation.js'), rewards:hash('rewards.js'), sw:hash('sw.js')},
      sold:before.counts.sold, durable:{done:before.stored.chDone.smallcrew, hire:before.stored.meta.automation.tiers.hire,
        claim, stars:before.state.legacy.stars, total:before.state.legacy.total, db:before.state.prem.earnedTotal},
      reload:{done:after.done, hire:after.hire, claimUnchanged:true, claimsUnchanged:after.claimsUnchanged}, errors}, null, 2), {flag:'wx'});
    console.log('PASS controlled completion, durable claim/floor, duplicate tick and reload');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
