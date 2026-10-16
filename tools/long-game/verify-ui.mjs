// Fallback only after T3 preview explicitly reported its desktop host unavailable.
import { mkdir, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const { default: puppeteer } = await import(pathToFileURL(process.env.PUPPETEER_MODULE).href);
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const suffix = process.argv[2] || '';
if (suffix && !/^-[a-z0-9-]+$/.test(suffix)) throw new Error('Invalid evidence suffix');
const out = 'docs/plan/long-game/evidence/LG-00/screens/headless-final' + suffix, evidence = { captures: [], checks: [], errors: [], httpErrors: [], sources: {} }, reads = [];
await mkdir(out, { recursive: true });
try {
  for (const [edition, file] of [['pixel', 'index'], ['classic', 'classic']]) {
    const context = await browser.createBrowserContext(), page = await context.newPage();
    page.on('pageerror', e => evidence.errors.push(e.message));
    page.on('requestfailed', r => evidence.errors.push(r.url() + ': ' + r.failure().errorText));
    page.on('response', r => { const path = new URL(r.url()).pathname; if (r.status() >= 400 && path !== '/favicon.ico') evidence.httpErrors.push({ url: r.url(), status: r.status() }); if (r.ok() && /\/(ops|pickups)\.(js|css)$/.test(path)) reads.push(r.buffer().then(b => { evidence.sources[path] = createHash('sha256').update(b).digest('hex'); })); });
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    await page.goto(`http://localhost:8147/${file}.html?s=${edition}&lg00=headless-final#play`);
    await page.waitForFunction(() => window.IMI?.ops && IMI.screen() === 'game' && document.querySelector('#oStage')?.getBoundingClientRect().height > 0);
    await page.evaluate(async () => { await document.fonts.ready; IMI.setFx('low'); for (let i = 0; i < 25; i++) IMI.ops.dev.press(0, false); });
    for (const [width, height] of [[1280, 800], [390, 700], [360, 560]]) {
      await page.setViewport({ width, height });
      const metrics = await page.evaluate(() => { const d = document.documentElement; return { edition: IMI.edition, viewport: [innerWidth, innerHeight], document: [d.scrollWidth, d.scrollHeight], reduced: IMI.reduceMotion, low: IMI.fx.low, manual: IMI.ops.dev.S().stats.manual, controls: [...document.querySelectorAll('#oStage,[data-act="keyhelp"],#settingsBtn')].filter(e => e.getClientRects().length).map(e => { const r = e.getBoundingClientRect(); return { id: e.id, action: e.dataset.act, width: r.width, height: r.height }; }) }; });
      assert.equal(metrics.edition, edition); assert.deepEqual(metrics.document, [width, height]); assert.equal(metrics.reduced, true); assert.equal(metrics.low, true);
      const path = `${out}/${edition}-${width}x${height}.png`; await page.screenshot({ path }); evidence.captures.push({ edition, path, metrics });
    }
    await page.setViewport({ width: 1280, height: 800 });
    const render = await page.evaluate(() => {
      IMI.ops.dev.completeIntro(); IMI.tour.skip(); const api = IMI.ops.extensions, before = api.state().meta.uiCount || 0; let after = 0;
      api.register('ui-fixture', { tab: ['ui-fixture', 'banana', 'Fixture', 'Controlled test', 'Fixture'], render(api, pane) { api.morph(pane, '<button class="o-btn" data-act="ui-fixture:tap">Test action</button>'); }, afterRender() { after++; }, actions: { tap(el, api) { api.state().meta.uiCount = (api.state().meta.uiCount || 0) + 1; api.mark(); } } });
      api.setTab('ui-fixture'); const el = document.querySelector('[data-act="ui-fixture:tap"]'), r = el.getBoundingClientRect(); el.click();
      return { edition: IMI.edition, count: api.state().meta.uiCount - before, after, width: r.width, height: r.height, screen: IMI.screen(), paneHidden: document.getElementById('o-ui-fixture').hidden };
    });
    // This artificial button proves delegation, not future product control sizing.
    evidence.checks.push({ name: 'delegated-render-and-action', ...render }); assert.equal(render.count, 1); assert.equal(render.after, 1);
    await page.evaluate(() => { IMI.ops.extensions.setTab('floor'); IMI.ops.extensions.register('speed-test', { speed: () => 2 }); IMI.pickups.clear(); });
    // Claim the real daily crate before timing a pickup, so a modal cannot imitate clock expiry.
    await page.waitForFunction(() => !!document.querySelector('.o-daily'));
    if (await page.$('.o-daily')) {
      await page.click('.o-daily .o-btn');
      await page.waitForFunction(() => document.querySelector('.o-daily .o-btn')?.textContent === 'Collect');
      await page.click('.o-daily .o-btn'); evidence.checks.push({ name: 'daily-crate-fixture-dismissal', edition });
    }
    await page.waitForFunction(() => !IMI.tour.active() && !document.querySelector('.o-modal,.o-celebrate'));
    const pickup = await page.evaluate(() => { let spawned = false, attempts = 0; while (!spawned && attempts++ < 10) spawned = IMI.pickups.spawn(); const el = document.querySelector('.o-pickup'), r = el?.getBoundingClientRect(); if (el) el.dataset.lg00 = 'original'; return { spawned, attempts, width: r?.width, height: r?.height, animations: el?.getAnimations().length, realStart: performance.now(), gameStart: IMI.ops.clock.productionNow() }; });
    assert.equal(pickup.spawned, true); assert.equal(pickup.width, 48); assert.equal(pickup.height, 48); assert.equal(pickup.animations, 0);
    await page.waitForFunction(() => !document.querySelector('[data-lg00="original"]'), { polling: 100, timeout: 12000 });
    const expiry = await page.evaluate(() => ({ realEnd: performance.now(), gameEnd: IMI.ops.clock.productionNow(), modal: !!document.querySelector('.o-modal,.o-celebrate'), eligible: IMI.ops.pickup.eligible() }));
    assert.equal(expiry.modal, false); assert.equal(expiry.eligible, true); assert.ok(expiry.realEnd - pickup.realStart >= 6500 && expiry.realEnd - pickup.realStart < 10000); assert.ok(expiry.gameEnd - pickup.gameStart >= 14000);
    evidence.checks.push({ name: 'reduced-motion-low-pickup-speed2', edition, ...pickup, ...expiry });
    await context.close();
  }
} catch (e) { evidence.errors.push(e.stack); process.exitCode = 1; }
finally { await Promise.all(reads); await browser.close(); await writeFile(`${out}/manifest.json`, JSON.stringify(evidence, null, 2) + '\n'); }
if (evidence.errors.length || evidence.httpErrors.length) process.exitCode = 1;
console.log(JSON.stringify({ captures: evidence.captures.length, checks: evidence.checks, errors: evidence.errors, httpErrors: evidence.httpErrors }));
