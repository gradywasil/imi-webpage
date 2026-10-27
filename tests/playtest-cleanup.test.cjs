const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');

test('actual Floor drawer, authored completion sales and compact timed buffs', async () => {
  const puppeteer = require(process.env.PUPPETEER_MODULE || 'puppeteer-core');
  const root = path.resolve(__dirname, '..');
  const evidence = path.join(root, 'docs/plan/long-game/evidence/UI-02-playtest-cleanup');
  const phase = process.env.UI02_BEFORE ? 'before' : 'after';
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const name = url.pathname === '/' ? 'index.html' : decodeURIComponent(url.pathname.slice(1));
    const file = path.resolve(root, name);
    if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    const source = phase === 'before' && ['ops.js', 'ops.css'].includes(name) ? path.join(evidence, 'before-' + name) : file;
    fs.readFile(source, (err, bytes) => {
      if (err) { res.writeHead(404).end(); return; }
      res.setHeader('Content-Type', ({'.js':'text/javascript','.css':'text/css','.html':'text/html','.png':'image/png','.svg':'image/svg+xml'})[path.extname(file)] || 'application/octet-stream');
      res.end(bytes);
    });
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  const results = [], errors = [];
  try {
    browser = await puppeteer.launch({ executablePath: process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
    for (const edition of ['index', 'classic']) {
      const page = await browser.newPage();
      await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
      page.on('pageerror', err => errors.push(err.message));
      await page.evaluateOnNewDocument(() => { if (location.protocol !== 'http:') return; localStorage.setItem('imi-tour', 'done'); localStorage.setItem('imi-sound', 'off'); });
      await page.setViewport({width:360,height:560,isMobile:true,hasTouch:true});
      await page.goto(`http://127.0.0.1:${server.address().port}/${edition}.html#play`);
      await page.waitForFunction(() => window.IMI?.ops?.dev);
      await page.evaluate(() => {
        const d = IMI.ops.dev, s = d.S(); s.intro.done = true;
        s.daily = {last:new Date().toDateString(),streak:1};
        s.desks.forEach(x => { x.owned = true; });
        s.stats.letters = 1000;
        for (const key of Object.keys(d.buffs)) d.buffs[key] = performance.now() + 60000;
        d.touchBank();
      });
      await new Promise(resolve => setTimeout(resolve, 600));
      for (const [width,height] of [[360,560],[1280,800]]) {
        await page.setViewport({width,height,isMobile:width<900,hasTouch:width<900});
        await page.waitForFunction(() => window.IMI?.ops?.dev);
        await page.evaluate(() => {
          IMI.ops.dev.S().intro.done = true;
          IMI.ops.dev.S().daily = {last:new Date().toDateString(),streak:1};
          IMI.ops.dev.S().desks.forEach(x => { x.owned = true; });
          IMI.tour?.skip?.();
          for (const key of Object.keys(IMI.ops.dev.buffs)) IMI.ops.dev.buffs[key] = performance.now() + 60000;
          IMI.ops.dev.touchBank();
        });
        await new Promise(resolve => setTimeout(resolve, 3200));
        await page.screenshot({path:path.join(evidence, `${phase}-${edition}-${width}-buffs.png`)});
        if (width === 360) await page.click('.rail-toggle');
        await new Promise(resolve => setTimeout(resolve, 300));
        await page.screenshot({path:path.join(evidence, `${phase}-${edition}-${width}-drawer.png`)});
        results.push(await page.evaluate(({edition,width}) => {
          const rail = document.querySelector('.rail'), button = rail.querySelector('[data-tab="floor"]') || rail.querySelector('.o-tab');
          const r = button.getBoundingClientRect(), x = Math.min(200,r.right-4), y = r.top+r.height/2;
          return {edition,width,drawerOnTop:rail.contains(document.elementFromPoint(x,y)),railZ:getComputedStyle(rail).zIndex,
            rootZ:getComputedStyle(document.querySelector('#opsRoot')).zIndex,
            compact:[...document.querySelectorAll('.o-buff:not(.chal)')].every(el => !el.querySelector('details,.o-buff-desc') && el.children.length === 2),
            buffs:document.querySelectorAll('.o-buff:not(.chal)').length,
            cleared:Object.keys(IMI.ops.dev.buffs).filter(k => IMI.ops.dev.buffs[k] === 0), problem:document.querySelector('#opsRoot').dataset.problem || '',
            pageScroll:document.documentElement.scrollHeight > innerHeight};
        },{edition,width}));
      }
      const sales = await page.evaluate(async () => {
        const d = IMI.ops.dev, s = d.S(), authored = d.RECIPES.filter(r => !r.kid && !r.lib && !r.gen);
        const events = []; IMI.on('celebrate', e => events.push(e.title));
        s.written = Object.fromEntries(authored.slice(0,-1).map(r => [r.id,true]));
        const sell = async r => {
          for (const [w,n] of Object.entries(r.need)) s.bank[w] = n;
          d.touchBank();
          const button = document.createElement('button'); button.dataset.act = 'write'; button.dataset.id = r.id;
          document.querySelector('#opsRoot').append(button); button.click(); button.remove();
          document.querySelector('.o-celebrate')?.click();
          await new Promise(resolve => setTimeout(resolve, 500));
        };
        await sell(authored.at(-1));
        const first = events.length;
        await sell(d.KIDS[0]); await sell(d.LIBS[0]);
        return {first, total:events.length, authored:authored.length, sold:Object.keys(s.written).length, generatedUntouched:!d.RECIPES.some(r => r.gen && s.written[r.id])};
      });
      results.push({edition,sales});
      await page.reload(); await page.waitForFunction(() => window.IMI?.ops?.dev);
      results.push({edition,reloadedSold:await page.evaluate(() => Object.keys(IMI.ops.dev.S().written).length)});
      await page.evaluate(() => { localStorage.setItem('imi-fx','low'); IMI.ops.dev.buffs.snack = performance.now() + 800; IMI.ops.dev.touchBank(); });
      await page.waitForSelector('.o-buff.snack .o-buff-meter[aria-label]');
      await page.waitForFunction(() => !document.querySelector('.o-buff.snack'), {timeout:3000});
      results.push({edition,expired:true});
      await page.close();
    }
    const controlContext = await browser.createBrowserContext();
    const smoke = await controlContext.newPage();
    smoke.on('pageerror', err => errors.push(err.message));
    await smoke.goto(`http://127.0.0.1:${server.address().port}/tools/balance.html?featureProfile=legacy`);
    for (let attempt = 0; attempt < 30 && !await smoke.evaluate(() => !!window.Bot); attempt++) await new Promise(resolve => setTimeout(resolve,100));
    assert.equal(await smoke.evaluate(() => !!window.Bot),true,'balance harness loaded: '+errors.join('; '));
    const control = await smoke.evaluate(() => { Bot.start({profile:'active',strategy:'collect',seed:1,activeMinutes:1}); Bot.run(1); return Bot.report(); });
    fs.writeFileSync(path.join(evidence, `${phase}-control.json`), JSON.stringify(control,null,2));
    await controlContext.close();
    fs.writeFileSync(path.join(evidence, `${phase}-results.json`), JSON.stringify({results,errors},null,2));
    assert.deepEqual(errors, []);
    /* once repairs unlock (the classic page loads the titles the index page sold), a Spoiled snack or Bad review buff becomes a Floor-wide
       repair problem and the buff is cleared (minigame-progression.js): every other timed buff still shows */
    const rotten = { sluggish:'snack', critic:'critic' };
    for (const row of results) {
      if (row.width) { assert.equal(row.drawerOnTop,true,JSON.stringify(row)); assert.equal(row.compact,true,JSON.stringify(row)); assert.equal(row.buffs + row.cleared.length,6,JSON.stringify(row)); assert.equal(row.pageScroll,false); }
      if (row.width && row.cleared.length) { assert.equal(row.cleared.length,1,JSON.stringify(row)); assert.equal(row.problem,rotten[row.cleared[0]],JSON.stringify(row)); }
      if (row.sales) { assert.equal(row.sales.first,1); assert.equal(row.sales.total,1,'collection celebration repeats on extra catalogue sales'); assert.equal(row.sales.generatedUntouched,true); }
      if (row.reloadedSold) assert.equal(row.reloadedSold,18);
    }
  } finally { if (browser) await browser.close(); await new Promise(resolve => server.close(resolve)); }
});
