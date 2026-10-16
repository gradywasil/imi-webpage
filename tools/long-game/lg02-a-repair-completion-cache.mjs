import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const out = 'docs/plan/long-game/evidence/LG-02/repair-completion-a-r3/cache-transition.json';
const old = await readFile('docs/plan/long-game/evidence/LG-02/repair-runtime-a-r2/before/sw.js');
const { default: puppeteer } = await import(pathToFileURL(process.env.PUPPETEER_MODULE).href);
const browser = await puppeteer.launch({ executablePath: process.env.CHROME, headless: true });
const page = await browser.newPage();
const result = { oldHash: null, steps: [], failure: null };
try {
  await page.setRequestInterception(true);
  page.on('request', request => request.url().endsWith('/sw.js') ? request.respond({ status: 200, contentType: 'application/javascript', body: old }) : request.continue());
  await page.goto('http://127.0.0.1:8181/index.html?lg02=1');
  await page.waitForFunction(async () => (await navigator.serviceWorker.getRegistration())?.active);
  result.steps.push(await page.evaluate(async () => ({ caches: await caches.keys(), active: (await navigator.serviceWorker.getRegistration()).active.scriptURL })));
  assert.ok(result.steps[0].caches.includes('imi-v28'));
  await page.setRequestInterception(false);
  await page.evaluate(async () => (await navigator.serviceWorker.getRegistration()).update());
  await page.waitForFunction(async () => (await caches.keys()).includes('imi-v29'));
  result.steps.push(await page.evaluate(async () => ({ caches: await caches.keys(), active: (await navigator.serviceWorker.getRegistration()).active.scriptURL })));
  assert.ok(result.steps[1].caches.includes('imi-v29'));
} catch (e) { result.failure = e.stack; process.exitCode = 1; }
finally { await browser.close(); await writeFile(out, JSON.stringify(result, null, 2) + '\n', { flag: 'wx' }); }
console.log(JSON.stringify(result));
