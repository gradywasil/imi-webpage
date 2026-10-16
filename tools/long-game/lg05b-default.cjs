const fs = require('node:fs'), assert = require('node:assert/strict'), crypto = require('node:crypto');
const pp = require('C:/Users/arran/pp/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js');
const out = 'docs/plan/long-game/evidence/LG-05/implementation-imprints-r1';
(async () => {
  const phase = process.argv[2];
  assert(/^(before|final(?:-r[0-9]+)?)$/.test(phase));
  const browser = await pp.launch({ executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe', headless:true });
  try {
    const page = await browser.newPage(), errors = [], sources = {};
    await page.setBypassServiceWorker(true); await page.setCacheEnabled(false);
    page.on('pageerror', e => errors.push(e.message));
    page.on('response', async r => { const f = new URL(r.url()).pathname.slice(1); if (['ops.js','rewards.js','folio.js','layers.js','tools/bot.js'].includes(f)) sources[f] = crypto.createHash('sha256').update(await r.buffer()).digest('hex'); });
    await page.goto('http://127.0.0.1:8393/tools/balance.html');
    const result = await page.evaluate(() => { Bot.start({profile:'active',strategy:'collect',seed:1,activeMinutes:5}); Bot.run(5); return {report:Bot.report(),meta:IMI.ops.dev.S().meta}; });
    Object.assign(result, {errors, sources});
    fs.writeFileSync(`${out}/${phase}-default.json`, JSON.stringify(result,null,2), {flag:'wx'});
    assert.deepEqual(errors, []); assert.deepEqual(result.meta, {});
    if (phase.startsWith('final')) { const before = JSON.parse(fs.readFileSync(`${out}/before-default.json`)); for (const k of ['report','meta','errors']) assert.deepEqual(result[k], before[k]); }
    console.log(phase + ': five-minute report/meta/errors PASS');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
