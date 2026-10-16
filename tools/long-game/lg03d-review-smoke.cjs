const fs = require('node:fs');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const pp = require('C:/Users/arran/pp/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js');

(async () => {
  const browser = await pp.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
  try {
    const page = await browser.newPage(), loaded = {}, errors = [];
    await page.setBypassServiceWorker(true);
    await page.setCacheEnabled(false);
    page.on('pageerror', e => errors.push(e.message));
    page.on('response', async r => {
      const name = new URL(r.url()).pathname.slice(1);
      if (['automation.js','ops.js'].includes(name)) loaded[name] = crypto.createHash('sha256').update(await r.buffer()).digest('hex');
    });
    await page.goto('http://127.0.0.1:8366/tools/balance.html?lg03=1');
    await page.waitForFunction(() => !!window.IMI?.ops?.extensions?.restoreAutomationOne);
    const result = await page.evaluate(() => {
      const s = IMI.ops.dev.S(), api = IMI.ops.extensions, h = __OPS_EXTENSIONS.find(([id]) => id === 'automation')[1];
      s.printing = 4; s.chDone.haiku = true; s.intro.done = true; s.desks[0].mk = 0;
      s.meta.automation = {version:1,restore:{version:1,enabled:true}};
      const price = IMI.ops.dev.mkCost(0);
      const wallet = n => { IMI.bananas.spend(IMI.bananas.get()); IMI.bananas.add(n); };
      wallet(2 * price - 1); h.init('review',api); h.tick({gameSeconds:20});
      const below = {mk:s.desks[0].mk,wallet:IMI.bananas.get(),quote:api.quoteAutomationRestore(0)};
      wallet(2 * price); h.tick({gameSeconds:20});
      const equal = {mk:s.desks[0].mk,wallet:IMI.bananas.get()};
      return {price,below,equal};
    });
    assert.equal(result.below.mk,0); assert.equal(result.below.wallet,2*result.price-1);
    assert.equal(result.below.quote.ok,false);
    assert.equal(result.equal.mk,1); assert.equal(result.equal.wallet,result.price);
    assert.deepEqual(errors,[]);
    for (const name of ['automation.js','ops.js']) assert.equal(loaded[name],crypto.createHash('sha256').update(fs.readFileSync(name)).digest('hex'));
    fs.writeFileSync('docs/plan/long-game/evidence/LG-03/review-a4-r1/fresh-smoke.json',JSON.stringify({result,loaded,errors},null,2),{flag:'wx'});
    console.log(JSON.stringify({result,loaded,errors}));
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
