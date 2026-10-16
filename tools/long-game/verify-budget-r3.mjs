// Actual offline differential fixtures; each invocation retains a new, exclusive receipt.
import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

const [mode, output] = process.argv.slice(2);
assert.ok(['minimize', 'sweep', 'compat'].includes(mode) && output, 'Use minimize|sweep|compat <new-output.json>');
const hash = b => createHash('sha256').update(b).digest('hex');
const sourcePath = process.env.BUDGET_SOURCE || 'ops.js', source = await readFile(sourcePath, 'utf8');
// Observation-only wrappers stay in the intercepted fixture, never in production.
const traced = mode === 'sweep' ? source.replace(/function keeperBulk\(d, i, lim(?:, work)?\) \{/, `function keeperBulk(d, i, lim, work) {
    const n = keeperBulkObserved(d, i, lim, work);
    window.__r3Trace.push({ kind: 'keeper', i, lim, n, time: window.__r3Time }); return n;
  }
  function keeperBulkObserved(d, i, lim, work) {`).replace('const stepDt =', 'window.__r3Time = to; const stepDt =').replace('      if (timed) {\n        readyC = null;', `      if (timed) {
        window.__r3Trace.push({ kind: 'prefix', from, to, sky: { ...sky() }, batch: typeof batch === 'undefined' ? null : batch, budgets: typeof budgets === 'undefined' ? null : JSON.parse(JSON.stringify(budgets)), letters: S.stats.letters, words: S.stats.words, bank: { ...S.bank }, inventories: S.desks.map(d => ({ ...d.letters })) });
        readyC = null;`) : source;
const { default: puppeteer } = await import(pathToFileURL(process.env.PUPPETEER_MODULE).href);
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, protocolTimeout: 30000 });
const report = { mode, sourcePath, sourceHash: hash(source), observedHash: hash(traced), cases: [], errors: [], httpErrors: [] };
const specs = mode === 'compat' ? [0.5, 1, 1.25, 1.5, 2].map(speed => ({ name: `compat-${speed}`, speed, away: 60, desks: 1, left: 20, pub: true, keeper: true, supplied: true })).concat([{ name: 'empty-registration', speed: 1, empty: true, away: 60, desks: 6, left: 20, pub: true }]) : mode === 'minimize' ? [
  { name: 'six-desks', desks: 6, away: 60, pub: true, left: 1200 },
  { name: 'one-desk', desks: 1, away: 60, pub: true, left: 1200 },
  { name: 'one-batch', desks: 1, away: 20, pub: true, left: 1200 },
  { name: 'deadline-only', desks: 1, away: 20, pub: false, left: 20 },
  { name: 'no-inserted-boundary', desks: 1, away: 20, pub: false, left: 1200 }
] : [0.5, 1.25, 1.5, 2].flatMap(speed => [19.9, 20, 20.1, 60].map((away, j) => ({
  name: `speed-${speed}-away-${away}`, speed, away, desks: 6, left: [5, 15, 30, 1200][j], pub: j % 2 === 1, keeper: j >= 2
}))).concat([0.5, 1.25, 1.5, 2].flatMap(speed => [false, true].map(pub => ({
  name: `supplied-keeper-${speed}-${pub}`, speed, away: 60, desks: 1, left: 20, pub, keeper: true, supplied: true
})))).concat(['owl', 'rainy'].map(trait => ({ name: `state-rates-${trait}`, trait, dynamic: true, speed: 2, away: 960, desks: 1, left: 1200, pub: true }))).concat([{ name: 'zero-letter-xp', zero: true, speed: 2, away: 20, desks: 6, left: 15, pub: true }]);
try {
  for (const spec of specs) {
    const pair = { spec, results: [] };
    for (const timed of [true, false]) {
      const page = await browser.newPage();
      await page.evaluateOnNewDocument(() => { window.__r3Trace = []; });
      await page.setRequestInterception(true);
      page.on('request', r => { if (new URL(r.url()).pathname === '/ops.js') void r.respond({ status: 200, contentType: 'text/javascript', body: traced }); else void r.continue(); });
      page.on('pageerror', e => report.errors.push(e.message));
      page.on('response', r => { if (r.status() >= 400 && !r.url().endsWith('/favicon.ico')) report.httpErrors.push({ url: r.url(), status: r.status() }); });
      await page.goto('http://127.0.0.1:8148/tools/balance.html?budget-r3', { waitUntil: 'load' });
      const loaded = await page.evaluate(async () => await (await fetch('/ops.js')).text());
      assert.equal(hash(loaded), report.observedHash, 'loaded intercepted source');
      const result = await page.evaluate(({ spec, timed }) => {
        const D = IMI.ops.dev, S = D.S();
        __seed(1);
        if (!spec.empty) IMI.ops.extensions.register('budget-r3', { speed: () => spec.speed || 2 });
        S.intro.done = S.intro.words = S.intro.shop = true;
        S.pub = { tier: 3, on: spec.pub, rule: 'any' };
        S.focus = null; S.autoFocus = true;
        S.challenge = timed ? { id: 'timed', start: Date.now() - (1200 - spec.left) * 1000 } : null;
        S.desks.forEach((d, i) => {
          d.owned = i < spec.desks; d.paws = d.owned ? 1 : 0;
          d.keeper.owned = true; d.keeper.on = !!spec.keeper;
          D.ensureCrew(d);
          d.crew.forEach(t => { t.talent = 0; t.trait = 'scout'; t.xp = 0; });
        });
        if (spec.supplied) {
          S.autoFocus = false;
          const d = S.desks[0], word = D.BAND_WORDS[0][0];
          d.keeper.targets[word] = 100;
          for (const ch of word) d.letters[ch] = (d.letters[ch] || 0) + 100;
        }
        if (spec.dynamic) {
          S.focus = D.RECIPES[0].id; S.autoFocus = false;
          S.desks[0].up.practice = 5;
          S.desks[0].crew[0].trait = spec.trait; S.desks[0].crew[0].xp = 39;
        }
        if (spec.zero) { S.desks[5].crew[0].xp = 40; S.desks[5].crew[0].lv = 1; }
        const snapshot = () => ({ typed: S.stats.letters, words: S.stats.words, bank: { ...S.bank }, wallet: IMI.bananas.get(), desks: S.desks.map(d => ({ letters: { ...d.letters }, xp: d.crew.map(t => t.xp), levels: d.crew.map(t => t.lv) })) });
        const before = snapshot();
        __skip(spec.away * 1000);
        const away = IMI.ops.simulateAway(spec.away);
        return { timed, before, away, after: snapshot(), challenge: S.challenge, done: S.chDone, trace: window.__r3Trace, keeperPeriod: D.keeperPeriod(0), eff: D.awayEff(), nextRandom: Math.random() };
      }, { spec, timed });
      pair.results.push(result);
      await page.close();
    }
    const [timed, plain] = pair.results;
    pair.typedParity = timed.away.letters === plain.away.letters;
    pair.perDeskTyped = pair.results.map(r => r.after.desks.map((d, i) => d.xp.reduce((a, n) => a + n, 0) - r.before.desks[i].xp.reduce((a, n) => a + n, 0)));
    pair.inventory = pair.results.map(r => r.after.desks.map(d => Object.values(d.letters).reduce((a, n) => a + n, 0)));
    report.cases.push(pair);
  }
} catch (e) { report.errors.push(e.stack); }
finally {
  await browser.close();
  await writeFile(output, JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
}
console.log(JSON.stringify({ output, sourceHash: report.sourceHash, errors: report.errors, cases: report.cases.length, typedFailures: report.cases.filter(c => !c.typedParity).map(c => ({ spec: c.spec, typed: c.results.map(r => r.away.letters) })) }, null, 2));
assert.deepEqual(report.errors, []);
assert.deepEqual(report.httpErrors, []);
if (mode === 'sweep') {
  for (const c of report.cases) {
    const [timed, plain] = c.results;
    assert.ok(c.typedParity, c.spec.name + ': typed budget');
    assert.deepEqual(c.perDeskTyped[0], c.perDeskTyped[1], c.spec.name + ': per-desk budgets');
    assert.equal(timed.away.pubSold, 0, 'no-sale controlled fixture');
    assert.equal(timed.away.pubPay + timed.away.roy + timed.away.div, 0, 'no invented income');
    assert.deepEqual(timed.after, plain.after, c.spec.name + ': inventory/bank/XP/wallet');
    assert.equal(timed.nextRandom, plain.nextRandom, c.spec.name + ': RNG retention');
    if (c.spec.supplied) {
      const steps = Math.ceil(c.spec.away / 20), capacity = steps * Math.max(2, Math.ceil(c.spec.away / steps * c.spec.speed * timed.eff / timed.keeperPeriod));
      assert.equal(timed.away.words, Math.min(capacity, steps * 12), c.spec.name + ': original keeper service and twelve passes');
    }
    let previous = null, completedTyped = 0, completedWords = 0;
    const emitted = Array.from({ length: 6 }, () => ({}));
    for (const p of timed.trace.filter(t => t.kind === 'prefix')) {
      assert.ok(p.budgets, 'prefix exposes actual finite budgets');
      if (previous && previous.batch !== p.batch) {
        completedTyped += previous.budgets.reduce((s, b) => s + (b?.typed || 0), 0);
        completedWords += previous.budgets.reduce((s, b) => s + (b?.banked || 0), 0);
        previous.budgets.forEach((b, i) => { for (const [ch, n] of Object.entries(b?.released || {})) emitted[i][ch] = (emitted[i][ch] || 0) + n; });
      }
      assert.equal(p.letters - timed.before.typed, completedTyped + p.budgets.reduce((s, b) => s + (b?.typed || 0), 0), 'actual typed counter equals issued work');
      assert.equal(p.words - timed.before.words, completedWords + p.budgets.reduce((s, b) => s + (b?.banked || 0), 0), 'actual word counter equals consumed service');
      const steps = Math.ceil(c.spec.away / 20), dt = c.spec.away / steps, end = p.to === (p.batch + 1) * dt, fraction = (p.to - p.batch * dt) / dt;
      for (const b of p.budgets.filter(Boolean)) {
        assert.ok(b.typed >= 0 && b.typed <= b.n, 'typed endpoint bound');
        assert.ok(b.banked <= Math.max(2, Math.ceil(b.keeperRaw)), 'keeper endpoint bound');
        assert.ok(b.pass <= 12, 'keeper traversal does not restart');
        if (!end) {
          assert.ok(b.typed <= Math.floor(b.raw * fraction), 'no future typing allowance');
          assert.ok(b.banked <= Math.floor(b.keeperRaw * fraction), 'no future keeper allowance');
        }
        for (const [ch, n] of Object.entries(b.released)) assert.ok(n <= b.inventory[ch] && n <= Math.floor(b.inventory[ch] * b.typed / b.n), 'no future inventory prefix');
      }
      p.inventories.forEach((inventory, i) => {
        const expected = { ...timed.before.desks[i].letters };
        for (const counts of [emitted[i], p.budgets[i]?.released || {}]) for (const [ch, n] of Object.entries(counts)) expected[ch] = (expected[ch] || 0) + n;
        for (const [word, n] of Object.entries(p.bank)) {
          const band = Math.min(5, Math.max(0, Math.ceil((word.length - 3) / 2)));
          if (band === i) for (const ch of word) expected[ch] = (expected[ch] || 0) - (n - (timed.before.bank[word] || 0));
        }
        for (const ch of Object.keys(expected)) if (!expected[ch]) delete expected[ch];
        assert.deepEqual(inventory, expected, 'actual inventory equals released letters less real bank ingredients');
      });
      previous = p;
    }
  }
}
else if (mode === 'minimize') assert.equal(report.cases.find(c => c.spec.name === 'deadline-only').typedParity, true, 'minimal Deadline split conserves production');
