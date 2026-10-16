const fs = require('node:fs');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const puppeteer = require('C:/Users/arran/pp/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js');
const reorderMode = process.argv[2] === '--reorder';
const out = 'docs/plan/long-game/evidence/LG-05/review-folio-r1/' + (reorderMode ? 'reorder-followup.json' : 'fresh-cash-smoke.json');
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

(async () => {
  const browser = await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
  const errors = [], loaded = {}, steps = [];
  try {
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    await page.setBypassServiceWorker(true);
    await page.setCacheEnabled(false);
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => {
      const file = new URL(response.url()).pathname.slice(1);
      if (['folio.js','ops.js','rewards.js','core.js','economy.js'].includes(file))
        response.buffer().then(bytes => loaded[file] = crypto.createHash('sha256').update(bytes).digest('hex'));
    });
    const base = 'http://127.0.0.1:8391/index.html';
    await page.goto(base);
    const fixture = await page.evaluate(() => IMI.ops.dev.S());
    fixture.intro.done = true;
    fixture.printing = 3;
    fixture.lastSeen = Date.now();
    fixture.rewards = {};
    fixture.meta = {};
    fixture.desks[0].paws = 0;
    fixture.desks[0].keeper.on = false;
    fixture.bank = {THE:2,APE:1,CAP:1};
    await page.close();
    const test = await context.newPage();
    await test.setBypassServiceWorker(true);
    await test.setCacheEnabled(false);
    test.on('pageerror', error => errors.push(error.message));
    test.on('response', response => {
      const file = new URL(response.url()).pathname.slice(1);
      if (['folio.js','ops.js','rewards.js','core.js','economy.js'].includes(file))
        response.buffer().then(bytes => loaded[file] = crypto.createHash('sha256').update(bytes).digest('hex'));
    });
    await test.evaluateOnNewDocument(save => {
      if (!sessionStorage.reviewSeeded) {
        localStorage.setItem('imi-ops-v1', JSON.stringify(save));
        localStorage.setItem('imi-score', JSON.stringify({economyVersion:1,score:0}));
        sessionStorage.reviewSeeded = '1';
      }
    }, fixture);
    await test.goto(base + '?lg01a=1&lg05folio=1#play');
    await test.waitForFunction(() => IMI.ops?.progression?.running() && Rewards.owns());
    const first = await test.evaluate(() => {
      const s = IMI.ops.dev.S(), sel = {id:'pocket',leaves:[0,1],reward:{kind:'cash'}};
      const action = (name, extra = {}) => Rewards.folioAction({action:name,expected:JSON.parse(JSON.stringify(s.meta.folio ?? null)),...extra});
      const before = {wallet:IMI.bananas.get(),earned:s.run.earned,bank:{...s.bank},claims:JSON.stringify(s.rewards.claims),stats:JSON.stringify(s.stats)};
      const choose = action('choose',{selection:sel}), bind = action('prepare');
      return {choose,bind,before,after:{wallet:IMI.bananas.get(),earned:s.run.earned,bank:{...s.bank},completed:s.meta.folio?.completed?.pocket,claims:JSON.stringify(s.rewards.claims),stats:JSON.stringify(s.stats),marker:IMI.bananas.acknowledgement()}};
    });
    assert(first.choose.ok && first.bind.ok, JSON.stringify(first));
    assert.equal(first.after.wallet, first.before.wallet + 6250);
    assert.equal(first.after.earned, first.before.earned + 6250);
    assert.deepEqual(first.after.bank, {THE:0,APE:0,CAP:0});
    assert.deepEqual(first.after.completed.leaves, [0,1]);
    assert.equal(first.after.claims, first.before.claims);
    assert.equal(first.after.stats, first.before.stats);
    steps.push('Real Core wallet credit, exact word debit, run earnings, completion and unchanged claims/stats');
    const duplicate = await test.evaluate(() => {
      const s=IMI.ops.dev.S(), before=JSON.stringify({bank:s.bank,folio:s.meta.folio,wallet:IMI.bananas.get(),earned:s.run.earned});
      const result=Rewards.folioAction({action:'prepare',expected:JSON.parse(JSON.stringify(s.meta.folio))});
      return {result,unchanged:before===JSON.stringify({bank:s.bank,folio:s.meta.folio,wallet:IMI.bananas.get(),earned:s.run.earned})};
    });
    assert(!duplicate.result.ok && duplicate.unchanged);
    steps.push('Duplicate bind refused without mutation');
    if (reorderMode) {
      const reorder = await test.evaluate(() => {
        const s=IMI.ops.dev.S(), before={selection:[...s.meta.folio.selection.leaves],completed:[...s.meta.folio.completed.pocket.leaves],gallery:[...s.meta.folio.gallery.pocket.leaves]};
        const result=Rewards.folioAction({action:'reorder',expected:JSON.parse(JSON.stringify(s.meta.folio)),id:'pocket'});
        return {result,before,after:{selection:s.meta.folio.selection.leaves,completed:s.meta.folio.completed.pocket.leaves,gallery:s.meta.folio.gallery.pocket.leaves}};
      });
      assert(reorder.result.ok);
      assert.deepEqual(reorder.after.completed,[1,0]);
      assert.deepEqual(reorder.after.gallery,[0,1]);
      assert.deepEqual(reorder.after.selection,[0,1]);
      fs.writeFileSync(out,JSON.stringify({status:'DEFECT REPRODUCED',qualification:'Controlled current-Printing completed Pocket series.',reorder,loaded,errors},null,2),{flag:'wx'});
      console.log('DEFECT REPRODUCED: gallery Reorder changes hidden completion only; selection and gallery order remain unchanged.');
      return;
    }
    await test.reload();
    await test.waitForFunction(() => IMI.ops?.progression?.running() && Rewards.owns());
    const reloaded = await test.evaluate(() => {
      const s=IMI.ops.dev.S();
      return {wallet:IMI.bananas.get(),earned:s.run.earned,bank:s.bank,completed:s.meta.folio?.completed?.pocket,pending:s.meta.folio?.pending,marker:IMI.bananas.acknowledgement()};
    });
    assert.equal(reloaded.wallet, first.after.wallet);
    assert.equal(reloaded.earned, first.after.earned);
    assert.deepEqual(reloaded.completed.leaves, [0,1]);
    assert(!reloaded.pending);
    steps.push('Reload retains exact cash, debit and completion');
    assert.deepEqual(errors, []);
    for (const [file, value] of Object.entries(loaded)) assert.equal(value, hash(file));
    fs.writeFileSync(out, JSON.stringify({status:'PASS',qualification:'Controlled fresh Rewards-enabled browser fixture; service worker bypassed.',steps,first,duplicate,reloaded,errors,loaded},null,2),{flag:'wx'});
    console.log('PASS: ' + steps.join('; '));
  } catch (error) {
    fs.writeFileSync(out,JSON.stringify({status:'FAIL',message:error.message,stack:error.stack,steps,errors,loaded},null,2),{flag:'wx'});
    throw error;
  } finally { await browser.close(); }
})().catch(error => {console.error(error);process.exitCode=1;});
