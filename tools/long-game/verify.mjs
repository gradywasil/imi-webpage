// Controlled foundations use real game functions. These fixtures are not profile progress.
import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
const { default: puppeteer } = await import(pathToFileURL(process.env.PUPPETEER_MODULE).href);
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const evidence = { cases: [], errors: [], httpErrors: [], loadedSources: [] }, reads = [], root = 'docs/plan/long-game/evidence/LG-00';
async function page(fixture, legacy = false) {
  const p = await browser.newPage(); p.on('pageerror', e => evidence.errors.push(e.message));
  p.on('requestfailed', r => evidence.errors.push(`${r.url()}: ${r.failure().errorText}`));
  p.on('response', r => { const path = new URL(r.url()).pathname; if (r.status() >= 400 && path !== '/favicon.ico') evidence.httpErrors.push({ url: r.url(), status: r.status() }); if (r.ok() && /\/(ops|economy|world)\.js$/.test(path)) reads.push(r.buffer().then(b => evidence.loadedSources.push({ legacy, path, sha256: createHash('sha256').update(b).digest('hex') }))); });
  if (legacy) { await p.setRequestInterception(true); const source = await readFile(`${root}/before/source/ops.js`, 'utf8'); p.on('request', r => { if (new URL(r.url()).pathname === '/ops.js') void r.respond({ status: 200, contentType: 'text/javascript', body: source }); else void r.continue(); }); }
  if (fixture) await p.evaluateOnNewDocument(f => { window.__LONG_GAME_FIXTURE = f; }, fixture);
  await p.goto((process.env.LG00_URL || 'http://127.0.0.1:8147') + '/tools/balance.html?verify'); return p;
}
try {
  for (const speed of [1, 2]) {
    const p = await page();
    const result = await p.evaluate(speed => {
      const D = IMI.ops.dev, s = D.S();
      IMI.ops.extensions.register('clock-test', { speed: () => speed });
      s.intro.done = true; s.intro.words = true; s.desks[0].paws = 1; s.desks[0].keeper.on = false; D.ensureCrew(s.desks[0]);
      D.buffs.snack = performance.now() + 20000; D.plant(0, 'E');
      s.challenge = { id: 'timed', start: Date.now() - 1180000 };
      const before = { now: Date.now(), ready: s.garden.beds[0].ready, start: s.challenge.start, buff: D.buffs.snack, secs: s.stats.secs, playSecs: s.stats.playSecs };
      __advance(10000);
      return { speed, before, after: { now: Date.now(), ready: s.garden.beds[0].ready, start: s.challenge?.start, buff: D.buffs.snack, letters: s.stats.letters, secs: s.stats.secs, playSecs: s.stats.playSecs, world: D.sky(), daily: D.dailyState(), clock: IMI.ops.clock.productionNow() }, harvest: D.harvest(0), presentationNow: performance.now() };
    }, speed);
    assert.equal(result.after.now - result.before.now, 10000);
    assert.equal(result.before.ready - result.after.ready, (speed - 1) * 10000);
    assert.equal(result.before.buff - result.after.buff, (speed - 1) * 10000);
    assert.equal(result.before.start - result.after.start, (speed - 1) * 10000);
    evidence.cases.push({ name: 'online-absolute-clocks', ...result }); await p.close();
  }
  const online = evidence.cases.filter(c => c.name === 'online-absolute-clocks');
  assert.equal(online[1].after.letters, online[0].after.letters * 2);
  assert.deepEqual(online[1].after.world, online[0].after.world); assert.deepEqual(online[1].after.daily, online[0].after.daily);
  for (const speed of [1, 2]) {
    const p = await page();
    const result = await p.evaluate(speed => {
      const D = IMI.ops.dev, s = D.S(); IMI.ops.extensions.register('fixed-offline', { speed: () => speed });
      s.intro.done = s.intro.words = true; s.desks[0].paws = 1; s.desks[0].keeper.on = false; D.ensureCrew(s.desks[0]);
      Object.assign(s.desks[0].crew[0], { xp: 100000, lv: 10, talent: 25, trait: 'wordsmith' });
      __skip(20000); return { speed, progress: IMI.ops.simulateAway(20) };
    }, speed);
    evidence.cases.push({ name: 'offline-fixed-crew', ...result }); await p.close();
  }
  const fixed = evidence.cases.filter(c => c.name === 'offline-fixed-crew');
  assert.equal(fixed[1].progress.letters, fixed[0].progress.letters * 2);
  for (const speed of [0.5, 1, 2]) {
    const p = await page();
    const result = await p.evaluate(speed => {
      const D = IMI.ops.dev, s = D.S(); IMI.ops.extensions.register('deadline-check', { speed: () => speed });
      s.intro.done = true; s.challenge = { id: 'timed', start: Date.now() - 1180000 }; __advance(15000);
      return { speed, active: !!s.challenge, start: s.challenge?.start, now: Date.now() };
    }, speed);
    assert.equal(result.active, speed !== 2); evidence.cases.push({ name: 'old-deadline-fail-and-slow', ...result }); await p.close();
  }
  for (const speed of [1, 2]) {
    const p = await page();
    const result = await p.evaluate(speed => {
      const D = IMI.ops.dev, s = D.S(); IMI.ops.extensions.register('keeper-premiere', { speed: () => speed });
      s.intro.done = s.intro.words = true; s.divs.film = 1;
      s.focus = 'controlled-unavailable'; s.autoFocus = false;
      s.desks[0].keeper.def = 1000; s.desks[0].letters = { A: 10000, N: 10000 }; D.buffs.frenzy = performance.now() + 20000;
      D.plant(0, 'E'); __advance(10000);
      const words = s.stats.words, buffActive = D.buffOn('frenzy'); __advance(5000);
      const harvested = D.harvest(0); __advance(85000);
      return { speed, words, buffActive, harvested, premiereStatus: D.DIVS[4].status(), presentationNow: performance.now() };
    }, speed);
    assert.equal(result.buffActive, speed === 1); assert.equal(result.harvested > 0, speed === 2);
    assert.equal(result.premiereStatus, speed === 1 ? 'Next premiere in 3:20.' : 'Next premiere in 1:40.');
    evidence.cases.push({ name: 'keeper-garden-premiere-buff', ...result }); await p.close();
  }
  for (const speed of [1, 2]) {
    const p = await page();
    const result = await p.evaluate(speed => {
      const D = IMI.ops.dev, s = D.S(); IMI.ops.extensions.register('offline-test', { speed: () => speed });
      s.intro.done = true; s.intro.words = true; s.desks[0].paws = 1; s.desks[0].keeper.on = false; D.ensureCrew(s.desks[0]);
      s.written[D.RECIPES[0].id] = true; D.touchBank();
      const rate = D.royBase(), eff = D.awayEff(), cap = D.awayCap(); __skip(480 * 60000);
      const progress = IMI.ops.simulateAway(480 * 60);
      return { speed, rate, eff, cap, progress };
    }, speed);
    assert.equal(result.progress.counted, result.cap); assert.equal(result.progress.capped, true);
    assert.equal(result.progress.roy, Math.floor(result.rate * result.cap * result.eff * speed / 25) * 25);
    evidence.cases.push({ name: 'offline-real-cap-production', ...result }); await p.close();
  }
  for (const speed of [1, 2]) {
    const p = await page();
    const result = await p.evaluate(speed => {
      const D = IMI.ops.dev, s = D.S(); IMI.ops.extensions.register('offline-deadlines', { speed: () => speed });
      s.intro.done = true; D.plant(0, 'Z'); D.buffs.frenzy = performance.now() + 100000;
      const ready = s.garden.beds[0].ready; __skip(70000); IMI.ops.simulateAway(70);
      return { speed, readyShift: ready - s.garden.beds[0].ready, harvested: D.harvest(0), buffActive: D.buffOn('frenzy') };
    }, speed);
    assert.equal(result.readyShift, (speed - 1) * 70000); assert.equal(result.harvested > 0, speed === 2); assert.equal(result.buffActive, speed === 1);
    evidence.cases.push({ name: 'offline-garden-buff', ...result }); await p.close();
    const q = await page();
    const deadline = await q.evaluate(speed => { const D = IMI.ops.dev, s = D.S(); IMI.ops.extensions.register('offline-deadline', { speed: () => speed }); s.challenge = { id: 'timed', start: Date.now() - 1140000 }; __skip(45000); IMI.ops.simulateAway(45); __advance(1000); return { speed, active: !!s.challenge }; }, speed);
    assert.equal(deadline.active, speed === 1); evidence.cases.push({ name: 'offline-deadline', ...deadline }); await q.close();
  }
  const fixture = JSON.parse(await readFile(`${root}/before/old-save.json`, 'utf8'));
  const p = await page(fixture);
  const loaded = await p.evaluate(() => ({ state: IMI.ops.dev.S(), wallet: IMI.bananas.get() }));
  const old = JSON.parse(fixture['imi-ops-v1']);
  const legacyPage = await page(fixture, true), legacyLoaded = await legacyPage.evaluate(() => ({ state: IMI.ops.dev.S(), wallet: IMI.bananas.get() })); await legacyPage.close();
  // Compare every existing field against an actual load of the frozen old runtime.
  for (const [k, v] of Object.entries(legacyLoaded.state)) assert.deepEqual(loaded.state[k], v, 'old field ' + k);
  assert.equal(loaded.wallet, legacyLoaded.wallet);
  const lifecycle = await p.evaluate(() => {
    const E = IMI.ops.extensions, events = [], seen = [];
    const extension = { init(reason, api) { api.state().rewards.fixture ||= { claimed: ['kept'] }; seen.push({ reason, printing: api.state().printing }); }, reset(event, api) { events.push({ ...event, current: api.state().printing }); } };
    const first = E.register('fixture', extension), duplicate = E.register('fixture', extension), previous = E.state();
    previous.meta.foreign = { keep: true }; previous.prem.foreign = { owned: true }; previous.unrecognized = { value: 17 };
    previous.run.earned = Economy.cash(5e5); IMI.ops.dev.doPrint();
    E.save(); Economy.saveScore(IMI.bananas.get());
    return { first, duplicate, changed: previous !== E.state(), seen, events, state: E.state(), records: { 'imi-ops-v1': localStorage.getItem('imi-ops-v1'), 'imi-score': localStorage.getItem('imi-score') } };
  });
  assert.equal(lifecycle.first, true); assert.equal(lifecycle.duplicate, false); assert.equal(lifecycle.changed, true);
  assert.deepEqual(lifecycle.state.rewards.fixture.claimed, ['kept']); assert.equal(lifecycle.state.prem.foreign.owned, true); assert.equal(lifecycle.state.meta.foreign.keep, true);
  evidence.cases.push({ name: 'old-save-load', fixture, old, legacyLoaded, loaded }, { name: 'extension-printing', ...lifecycle });
  const fullReset = await p.evaluate(() => { window.confirm = () => true; IMI.ops.reset(); return IMI.ops.dev.S(); });
  assert.equal(fullReset.prem.foreign, undefined); assert.equal(fullReset.meta.foreign, undefined); assert.deepEqual(fullReset.rewards.fixture.claimed, ['kept']);
  evidence.cases.push({ name: 'full-reset', state: fullReset }); await p.close();
  const reload = await page(lifecycle.records), reloaded = await reload.evaluate(() => IMI.ops.dev.S());
  assert.deepEqual(reloaded.rewards, lifecycle.state.rewards); assert.deepEqual(reloaded.prem, lifecycle.state.prem); assert.deepEqual(reloaded.meta, lifecycle.state.meta);
  evidence.cases.push({ name: 'fresh-document-reload', state: reloaded }); await reload.close();
  // Preserve the original mixed-version capture and separately replay the frozen game with its real wallet writer.
  const frozen = await page(null, true);
  const versioned = await frozen.evaluate(() => { Bot.start({ profile: 'active', strategy: 'collect', seed: 1, activeMinutes: 15 }); Bot.run(15); __advance(5000); Economy.saveScore(IMI.bananas.get()); return { 'imi-ops-v1': localStorage.getItem('imi-ops-v1'), 'imi-score': localStorage.getItem('imi-score') }; }); await frozen.close();
  evidence.cases.push({ name: 'frozen-runtime-versioned-wallet-capture', records: versioned });
  const versionedPage = await page(versioned);
  const played = await versionedPage.evaluate(() => { const before = IMI.bananas.get(); Bot.start({ profile: 'active', strategy: 'collect', seed: 1, activeMinutes: 1 }); Bot.run(1); IMI.ops.extensions.save(); Economy.saveScore(IMI.bananas.get()); return { before, after: IMI.bananas.get(), records: { 'imi-ops-v1': localStorage.getItem('imi-ops-v1'), 'imi-score': localStorage.getItem('imi-score') } }; }); await versionedPage.close();
  assert.equal(played.before, JSON.parse(versioned['imi-score']).score);
  const playedPage = await page(played.records), playedReload = await playedPage.evaluate(() => ({ state: IMI.ops.dev.S(), wallet: IMI.bananas.get() })); await playedPage.close();
  assert.equal(playedReload.wallet, played.after);
  for (const [key, value] of Object.entries(JSON.parse(played.records['imi-ops-v1']))) assert.deepEqual(playedReload.state[key], value, 'played reload ' + key);
  evidence.cases.push({ name: 'versioned-wallet-play-save-reload', played, reloaded: playedReload });
  const unknownRecords = { ...versioned, 'imi-ops-v1': JSON.stringify({ ...JSON.parse(versioned['imi-ops-v1']), unknownFuture: { value: 17 }, prem: { foreign: { receipts: ['retained'] } } }) };
  const unknownPage = await page(unknownRecords), unknown = await unknownPage.evaluate(() => { IMI.ops.extensions.save(); return IMI.ops.dev.S(); }); await unknownPage.close();
  assert.equal(unknown.unknownFuture.value, 17); assert.deepEqual(unknown.prem.foreign.receipts, ['retained']);
  evidence.cases.push({ name: 'unknown-saved-fields', state: unknown });
} catch (e) { evidence.errors.push(e.stack); process.exitCode = 1; }
finally { await Promise.all(reads); await browser.close(); await writeFile(`${root}/foundations.json`, JSON.stringify(evidence, null, 2) + '\n'); if (evidence.httpErrors.length) process.exitCode = 1; }
console.log(evidence.errors.length ? evidence.errors : 'Foundations passed');
