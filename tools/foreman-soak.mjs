// Phase C exit check: does the room run itself? Seeds a player who owns the room-control upgrades and a saved purchase
// order, then advances the balance harness's virtual clock with NO bot and NO input, and records every Printing the
// Foreman presses.
//   node tools/foreman-soak.mjs [cycles=10] [maxMinutes=600] [target=10] [policy=fast]
// Needs `node tools/test-runner.mjs --serve` (or any static server) on CC_URL (default http://127.0.0.1:8312) and PUPPETEER_MODULE.
// Virtual minutes are the harness's clock, not wall time. The room starts the way a real one does after a Printing: two
// free typists, Hold, and the remembered publisher restored by the Blueprint.
import { pathToFileURL } from 'node:url';
const [cyclesArg = '10', maxArg = '600', targetArg = '10', policy = 'fast'] = process.argv.slice(2);
const cycles = +cyclesArg, maxMinutes = +maxArg, target = +targetArg;
const { default: puppeteer } = await import(pathToFileURL(process.env.PUPPETEER_MODULE).href);
const browser = await puppeteer.launch({ executablePath: process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, protocolTimeout: 0 });
const errors = [];
try {
  const page = await browser.newPage();
  page.on('pageerror', e => errors.push(e.message));
  const save = {
    economyVersion: 99, lastSeen: 1.7e12 + 1e6, intro: { version: 1, done: true, train: true, words: true, shop: true, hireAt: 0 },
    stats: { letters: 90000, manual: 900, words: 600 },
    legacy: { stars: 0, total: 200, k: 10, ups: { crew: 1, ledger: 1, buyer: 1, blueprint: 1, foreman: 1 },
      mig: { lgb: 1, ledger: { v: 1, from: { speed: 0, keeper: 0, crew: 0 }, credit: {}, refund: {}, bridge: [] } },
      fm: { v: 1, enabled: true, policy, target, reserve: 0, manual: true, bp: { rule: 'fair', on: true, tier: 1 },
        order: [{ k: 'desk', i: 1 }, { k: 'desk', i: 2 }, { k: 'pub', to: 1 }, { k: 'sb', key: 'drive', to: 1 }, { k: 'desk', i: 3 }] } },
    printing: 4, desks: [{ owned: true, paws: 2 }]
  };
  await page.evaluateOnNewDocument(o => {
    window.__LONG_GAME_FIXTURE = { 'imi-ops-v1': JSON.stringify(o), 'imi-score': JSON.stringify({ economyVersion: 99, score: 0 }) };
  }, save);
  await page.goto(`${process.env.CC_URL || 'http://127.0.0.1:8312'}/tools/balance.html?long-game&featureProfile=legacy&lgb=1`);
  let up = false;
  for (let i = 0; i < 600 && !up; i++) { up = await page.evaluate(() => !!window.IMI?.ops?.dev).catch(() => false); if (!up) await new Promise(r => setTimeout(r, 100)); }
  if (!up) throw new Error('Harness did not start');
  const rows = [];
  let minutes = 0, lastPrinting = 4, lastMinute = 0, stalled = 0;
  while (rows.length < cycles && minutes < maxMinutes) {
    const r = await page.evaluate(() => {
      document.querySelectorAll('.o-modal,.o-celebrate').forEach(e => e.remove());
      for (let i = 0; i < 60; i++) __advance(1000);
      const s = IMI.ops.dev.S();
      return { printing: s.printing, desks: s.desks.filter(d => d.owned).length, earned: s.run.earned, pub: s.pub.tier, stars: s.legacy.stars, total: s.legacy.total };
    });
    minutes++;
    if (r.printing > lastPrinting) {
      rows.push({ printing: r.printing, minutes: minutes - lastMinute, desks: r.desks, pub: r.pub, total: r.total });
      lastPrinting = r.printing; lastMinute = minutes; stalled = 0;
    } else if (minutes - lastMinute > 120) { stalled = minutes - lastMinute; break; }
  }
  const end = await page.evaluate(() => { const d = IMI.ops.dev, s = d.S(); return { printing: s.printing, starsNow: d.starsNow(), earned: s.run.earned, desks: s.desks.filter(x => x.owned).length, cycles: d.cycles?.().cycles.length }; });
  console.log(JSON.stringify({ policy, target, completed: rows.length, minutes, stalledMinutes: stalled, rows, end, errors }, null, 1));
  if (rows.length < cycles || errors.length) process.exitCode = 1;
} finally { await browser.close(); }
