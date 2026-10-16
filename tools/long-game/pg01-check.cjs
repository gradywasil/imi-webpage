// Focused PG-01 fixtures: real Ops consumers and real storage acknowledgements.
const fs = require('node:fs'), assert = require('node:assert/strict');
const puppeteer = require('C:/Users/arran/pp/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js');
const out = 'docs/plan/long-game/evidence/PG-01/implementation-r1';
const run = process.argv[2] || 'r2';
if (!/^r\d+$/.test(run)) throw Error('Expected exclusive run label');
(async () => {
  const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const results = [], errors = [];
  try {
    const page = await browser.newPage();
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('http://127.0.0.1:8362/tools/balance.html?pg01=1');
    await page.waitForFunction(() => !!window.Bot && !!IMI.ops.productionGoal);
    results.push(await page.evaluate(() => {
      const d = IMI.ops.dev, s = d.S(), g = IMI.ops.productionGoal, checks = window.pg01Checks = [];
      const check = (name, ok, facts) => { checks.push({ name, ok: !!ok, facts }); if (!ok) throw Error(name); };
      d.completeIntro(); IMI.bananas.add(100000); d.buy('desk', 1);
      check('actual desk purchase', s.desks[1].owned);
      check('set selected with actual ACK', g.configure({ enabled: true, band: 1, collection: 'library5' }).ok);
      let r = d.focusRecipe();
      check('exact five/library membership', r.band === 1 && r.lib === 5, r.id);
      const lower = Object.keys(r.need).find(w => w.length <= 3);
      for (const desk of s.desks) { desk.letters = Object.fromEntries('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(ch => [ch, 2000])); desk.keeper.def = 100; }
      const words0 = s.stats.words;
      for (let i = 0; i < 100; i++) { d.keeperStep(s.desks[0], 0); d.keeperStep(s.desks[1], 1); }
      check('online keeper includes lower ingredients', d.stock(lower) >= r.need[lower], lower);
      check('keeper stops unrelated banking', Object.keys(s.bank).every(w => r.need[w]) && s.stats.words - words0 === r.total);
      s.pub = { tier: 3, on: true, rule: 'any' };
      check('online Publisher sale', d.pubSell() && s.written[r.id]);
      check('after sale still exact5', d.focusRecipe()?.band === 1 && d.focusRecipe()?.lib === 5, d.focusRecipe()?.id);
      r = d.RECIPES.find(r => r.band === 0 && !r.kid && !r.gen && !r.lib);
      d.action('focus', { id: r.id });
      check('manual outside set overrides', s.meta.productionGoal.manual === r.id && !s.autoFocus);
      s.bank = { ...r.need }; d.touchBank();
      check('Publisher protects manual title', !d.pubSell() && !s.written[r.id]);
      d.writeTitle(r.id, null, { silent: true });
      check('manual sale resumes set', s.meta.productionGoal.manual === null && s.autoFocus && d.focusRecipe()?.lib === 5);
      const manual = d.RECIPES.find(r => r.band === 0 && !r.kid && !s.written[r.id]);
      d.action('focus', { id: manual.id }); d.action('pgreturn');
      check('Return to set', s.meta.productionGoal.manual === null && d.focusRecipe()?.band === 1);
      s.bank = {}; s.desks.forEach(desk => { desk.letters = {}; desk.paws = 6; desk.up.practice = 3; });
      s.pub.rule = 'hot'; r = d.focusRecipe();
      const away = IMI.ops.simulateAway(1800);
      check('offline production lower ingredients', away.words > 0 && s.stats.words > words0, away);
      check('offline set5 persists', s.meta.productionGoal.band === 1 && d.focusRecipe()?.band === 1);
      // A ready controlled title proves offline x1 selling bypasses the online Hot rule and respects budget.
      r = d.focusRecipe(); s.bank = { ...r.need }; d.touchBank(); s.desks.forEach(desk => { desk.paws = 0; });
      s.market.v = s.market.v.map(() => .5);
      const one = IMI.ops.simulateAway(15);
      check('offline average-market sale and one budget', one.pubSold === 1 && s.written[r.id], one);
      g.configure({ band: 1, collection: 'authored', advance: true });
      const full = d.RECIPES.filter(r => r.band === 1 && !r.kid && !r.lib && !r.gen);
      full.forEach(r => { s.written[r.id] = true; }); d.touchBank(); s.focus = null;
      d.action('autofocus');
      check('true exhaustion advances upward', s.meta.productionGoal.band === 2 && !s.focus, g.status());
      check('missing desk wait', g.status().includes('Waiting for desk'));
      s.challenge = { id: 'haiku', start: Date.now() }; d.action('autofocus');
      check('Haiku wait', g.status().includes('Haiku') && s.meta.productionGoal.band === 2);
      s.challenge = null;
      // All real kids currently use band0. Label one later, unlisted kid as a future band1
      // fixture to exercise actual inPlay exclusion without editing source or the rolling list.
      const rolling = d.KIDS[20], oldBand = rolling.band; rolling.band = 1;
      g.configure({ band: 1, collection: 'kids', advance: true });
      check('rolling kids remainder waits', d.RECIPES.some(r => r.kid && r.band === 1 && !s.written[r.id]) && !s.focus && s.meta.productionGoal.band === 1 && g.status().includes('reading list'), g.status());
      rolling.band = oldBand;
      g.configure({ band: 1, collection: 'library5', advance: false });
      s.desks[1].owned = false; s.focus = null; d.action('autofocus');
      check('temporary inaccessible remainder never exhausts', s.meta.productionGoal.band === 1 && !s.focus && g.status().includes('Waiting for desk'));
      s.desks[1].owned = true; d.action('autofocus');
      const protectedCount = d.soldCount();
      check('kids/library progression exclusions retained', protectedCount === Object.keys(s.written).filter(id => !d.RBY[id]?.kid && !d.RBY[id]?.lib).length);
      s.run.earned = Economy.cash(500000); s.meta.productionGoal.futureNote = 'preserve';
      d.action('focus', { id: manual.id }); d.doPrint();
      check('Printing preferences and unknown fields', d.S().printing === 1 && d.S().meta.productionGoal.band === 1 && d.S().meta.productionGoal.collection === 'library5' && d.S().meta.productionGoal.manual === null && d.S().meta.productionGoal.futureNote === 'preserve' && !d.S().focus);
      return { fixture: 'headless balance bridge; explicit inventory/desk/challenge/exhaustion fixtures; actual online/offline Ops methods', checks };
    }));
    // A native shell exercises real Core/Economy/Rewards ownership, reload and refused storage write.
    const native = await browser.newPage(); await native.setBypassServiceWorker(true); await native.setCacheEnabled(false);
    native.on('pageerror', e => errors.push(e.message));
    await native.goto('http://127.0.0.1:8362/classic.html?pg01=1&lg01a=1#play');
    await native.waitForFunction(() => !!window.IMI?.ops?.productionGoal && Rewards.owns());
    results.push(await native.evaluate(() => {
      const d = IMI.ops.dev, g = IMI.ops.productionGoal; d.completeIntro();
      const first = g.configure({ enabled: true, band: 1, collection: 'library5' });
      if (!first.ok) throw Error(first.error);
      const before = JSON.stringify(d.S().meta.productionGoal), stored = JSON.parse(localStorage.getItem('imi-ops-v1')).meta.productionGoal;
      const original = Storage.prototype.setItem;
      let refused = 0;
      Storage.prototype.setItem = function(k, v) { if (k === 'imi-ops-v1') { refused++; throw new DOMException('PG-01 controlled storage refusal', 'QuotaExceededError'); } return original.call(this, k, v); };
      let failure;
      try { failure = g.configure({ band: 2 }); } finally { Storage.prototype.setItem = original; }
      const unchanged = before === JSON.stringify(d.S().meta.productionGoal);
      const retry = g.retry();
      if (failure.ok || !unchanged || refused !== 1 || !retry.ok || d.S().meta.productionGoal.band !== 2) throw Error('Real refusal/Retry failed');
      return { fixture: 'native Core/Economy/Rewards owner; Storage.setItem throws for real write then restored, no success ACK stub', first, stored, failure, unchanged, refused, retry, after: d.S().meta.productionGoal };
    }));
    await native.reload(); await native.waitForFunction(() => !!window.IMI?.ops?.productionGoal && Rewards.owns());
    const reloaded = await native.evaluate(() => ({ policy: IMI.ops.dev.S().meta.productionGoal, focus: IMI.ops.dev.S().focus, auto: IMI.ops.dev.S().autoFocus, status: IMI.ops.productionGoal.status() }));
    assert.equal(reloaded.policy.band, 2); assert.equal(reloaded.focus, null); assert.equal(reloaded.auto, true);
    results.push({ reload: reloaded });
    assert.deepEqual(errors, []);
  } catch (e) { results.push({ failure: e.stack }); process.exitCode = 1; }
  finally { fs.writeFileSync(`${out}/${run}-focused-results.json`, JSON.stringify({ results, errors }, null, 2), { flag: 'wx' }); await browser.close(); }
  console.log(JSON.stringify({ results, errors }, null, 2));
})().catch(e => { console.error(e); process.exitCode = 1; });
