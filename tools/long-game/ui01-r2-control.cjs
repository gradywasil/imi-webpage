// Exclusive five-minute default control. Uses the read-only balance page, not historical writers.
const fs = require('node:fs');
const puppeteer = require('C:/Users/arran/pp/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js');
const phase = process.argv[2];
if (!['before', 'after'].includes(phase)) throw Error('Expected before or after');
(async () => {
  const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    const page = await browser.newPage(), errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto('http://127.0.0.1:8393/tools/balance.html');
    await page.waitForFunction(() => !!window.Bot);
    const result = await page.evaluate(() => {
      Bot.start({ profile: 'active', strategy: 'collect', seed: 1, activeMinutes: 5 });
      Bot.run(5);
      return { report: Bot.report(), productionGoal: IMI.ops.dev.S().meta.productionGoal ?? null };
    });
    fs.writeFileSync(`docs/plan/long-game/evidence/UI-01/implementation-r2/${phase}-short5min.json`, JSON.stringify({ ...result, errors }, null, 2), { flag: 'wx' });
    if (errors.length) throw Error(errors.join('\n'));
    console.log(JSON.stringify(result));
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });

