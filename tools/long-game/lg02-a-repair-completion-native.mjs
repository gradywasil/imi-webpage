import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const root = 'docs/plan/long-game/evidence/LG-02';
const out = `${root}/repair-completion-a-r3/${process.env.LG02_COMPLETION_OUTPUT || 'native.json'}`;
const fixture = JSON.parse(await readFile(`${root}/implementation-a/before/native-classic.json`, 'utf8'));
const { default: puppeteer } = await import(pathToFileURL(process.env.PUPPETEER_MODULE).href);
const browser = await puppeteer.launch({ executablePath: process.env.CHROME, headless: true });
const result = { cases: [], errors: [] };
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
async function run(edition, blocked) {
  const page = await browser.newPage();
  const row = { edition, blocked, hashes: {}, errors: [] };
  result.cases.push(row);
  const pending = [];
  page.on('pageerror', e => row.errors.push(e.message));
  page.on('response', r => {
    const name = new URL(r.url()).pathname.slice(1);
    if (r.ok() && ['index.html', 'classic.html', 'ops.js', 'pickups.js', 'tour.js', 'sw.js', 'core.js', 'app.js', 'classic.js', 'vault-save-gate.js'].includes(name)) pending.push(r.buffer().then(b => { row.hashes[name] = sha(b); }));
  });
  try {
    await page.evaluateOnNewDocument(({ records, blocked }) => {
      if (sessionStorage.getItem('lg02CompletionSeeded')) return;
      sessionStorage.setItem('lg02CompletionSeeded', '1');
      for (const [key, value] of Object.entries(records)) localStorage.setItem(key, value);
      const ops = JSON.parse(localStorage.getItem('imi-ops-v1'));
      ops.prem ??= {};
      if (blocked) ops.prem.vault = { version: 99, unknown: 'keep' };
      else { delete ops.prem.vault; ops.unknownCompletion = { keep: true }; }
      localStorage.setItem('imi-ops-v1', JSON.stringify(ops));
      localStorage.setItem('imi-style', 'pixel');
      window.__initialRecords = Object.fromEntries(Object.keys(localStorage).map(k => [k, localStorage.getItem(k)]));
      window.__writes = [];
      for (const method of ['setItem', 'removeItem', 'clear']) {
        const original = Storage.prototype[method];
        Storage.prototype[method] = function(...args) { window.__writes.push({ method, args }); return original.apply(this, args); };
      }
    }, { records: fixture.records, blocked });
    await page.goto(`http://127.0.0.1:8181/${edition === 'pixel' ? 'index' : 'classic'}.html?lg02=1`);
    await page.waitForFunction(() => window.VaultSaveGate && (VaultSaveGate.blocked || !!window.IMI?.ops));
    row.initial = await page.evaluate(() => ({ gate: VaultSaveGate.blocked, game: !!window.IMI?.ops, records: Object.fromEntries(Object.keys(localStorage).map(k => [k, localStorage.getItem(k)])), initial: __initialRecords, writes: __writes.slice() }));
    assert.equal(row.initial.gate, blocked);
    if (blocked) {
      assert.equal(row.initial.game, false);
      assert.deepEqual(row.initial.records, row.initial.initial);
      assert.deepEqual(row.initial.writes, []);
      row.action = await page.evaluate(() => {
        const before = Object.fromEntries(Object.keys(localStorage).map(k => [k, localStorage.getItem(k)]));
        try { window.IMI?.ops?.extensions?.save(); window.Core?.boot?.({ edition: 'classic' }); } catch {}
        return { recordsEqual: JSON.stringify(before) === JSON.stringify(Object.fromEntries(Object.keys(localStorage).map(k => [k, localStorage.getItem(k)]))), writes: __writes.slice() };
      });
      assert.equal(row.action.recordsEqual, true);
      assert.deepEqual(row.action.writes, []);
    } else {
      row.played = await page.evaluate(() => {
        const before = IMI.ops.dev.S().stats.manual;
        IMI.ops.dev.press(0, false);
        IMI.ops.extensions.save();
        return { before, after: IMI.ops.dev.S().stats.manual, records: Object.fromEntries(Object.keys(localStorage).map(k => [k, localStorage.getItem(k)])) };
      });
      assert.equal(row.played.after, row.played.before + 1);
      assert.deepEqual(JSON.parse(row.played.records['imi-ops-v1']).unknownCompletion, { keep: true });
      await page.reload();
      await page.waitForFunction(() => !!window.IMI?.ops);
      row.reloaded = await page.evaluate(() => ({ manual: IMI.ops.dev.S().stats.manual, unknown: IMI.ops.dev.S().unknownCompletion, records: Object.fromEntries(Object.keys(localStorage).map(k => [k, localStorage.getItem(k)])) }));
      assert.ok(row.reloaded.manual >= row.played.after);
      assert.deepEqual(row.reloaded.unknown, { keep: true });
    }
    await Promise.all(pending);
    for (const [name, hash] of Object.entries(row.hashes)) assert.equal(hash, sha(await readFile(name)), name);
    assert.deepEqual(row.errors, []);
    row.pass = true;
  } catch (e) { row.failure = e.stack; result.errors.push({ edition, blocked, error: e.stack }); }
  finally { await page.close(); }
}
try { for (const edition of ['pixel', 'classic']) for (const blocked of [false, true]) await run(edition, blocked); }
finally { await browser.close(); await writeFile(out, JSON.stringify(result, null, 2) + '\n', { flag: 'wx' }); }
if (result.errors.length) process.exitCode = 1;
console.log(JSON.stringify({ cases: result.cases.map(({ edition, blocked, pass, failure }) => ({ edition, blocked, pass, failure })), errors: result.errors.length }));
