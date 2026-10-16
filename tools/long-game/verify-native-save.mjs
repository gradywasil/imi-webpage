// Verify the frozen save through the real Core wallet bridge in fresh documents.
import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
const base = 'docs/plan/long-game/evidence/LG-00', result = { errors: [], httpErrors: [] };
const foundation = JSON.parse(await readFile(`${base}/foundations-before-render-fix.json`, 'utf8'));
const records = foundation.cases.find(c => c.name === 'frozen-runtime-versioned-wallet-capture').records;
const { default: puppeteer } = await import(pathToFileURL(process.env.PUPPETEER_MODULE).href);
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
async function open(records, epoch, edition) {
  const p = await browser.newPage(); p.on('pageerror', e => result.errors.push(e.message));
  p.on('response', r => { if (r.status() >= 400 && !r.url().endsWith('/favicon.ico')) result.httpErrors.push({ url: r.url(), status: r.status() }); });
  await p.evaluateOnNewDocument(({ records, epoch }) => { for (const key of ['imi-ops-v1', 'imi-score']) localStorage.setItem(key, records[key]); Date.now = () => epoch + performance.now(); }, { records, epoch });
  await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await p.goto(`${process.env.LG00_URL || 'http://127.0.0.1:8148'}/${edition === 'pixel' ? 'index' : 'classic'}.html?s=${edition}&lg00=native-save#play`);
  await p.waitForFunction(() => !!window.IMI?.ops && IMI.screen() === 'game'); return p;
}
try {
  const epoch = JSON.parse(records['imi-ops-v1']).lastSeen;
  const page = await open(records, epoch, 'pixel');
  result.loaded = await page.evaluate(() => ({ state: IMI.ops.dev.S(), wallet: IMI.bananas.get() }));
  assert.equal(result.loaded.wallet, JSON.parse(records['imi-score']).score);
  result.played = await page.evaluate(() => { IMI.ops.dev.press(0, false); IMI.ops.extensions.save(); dispatchEvent(new Event('pagehide')); return { state: IMI.ops.dev.S(), wallet: IMI.bananas.get(), records: { 'imi-ops-v1': localStorage.getItem('imi-ops-v1'), 'imi-score': localStorage.getItem('imi-score') } }; });
  assert.equal(result.played.state.stats.manual, result.loaded.state.stats.manual + 1); await page.close();
  const reload = await open(result.played.records, result.played.state.lastSeen, 'classic');
  result.reloaded = await reload.evaluate(() => ({ state: IMI.ops.dev.S(), wallet: IMI.bananas.get() }));
  assert.equal(result.reloaded.wallet, result.played.wallet);
  for (const field of ['written', 'legacy', 'editions', 'chDone', 'meta', 'rewards', 'prem', 'bank']) assert.deepEqual(result.reloaded.state[field], result.played.state[field], field);
  assert.ok(result.reloaded.state.stats.manual >= result.played.state.stats.manual);
  assert.equal(result.reloaded.state.economyVersion, result.loaded.state.economyVersion); await reload.close();
} catch (e) { result.errors.push(e.stack); process.exitCode = 1; }
finally { await browser.close(); await writeFile(`${base}/native-save.json`, JSON.stringify(result, null, 2) + '\n'); }
if (result.httpErrors.length) process.exitCode = 1;
console.log(JSON.stringify({ loadedWallet: result.loaded?.wallet, playedWallet: result.played?.wallet, reloadedWallet: result.reloaded?.wallet, errors: result.errors, httpErrors: result.httpErrors }));
