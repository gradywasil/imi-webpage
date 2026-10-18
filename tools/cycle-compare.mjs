// Long-game phase B check: how fast do repeat Printings come with and without the lgb Legacy package?
// node tools/cycle-compare.mjs [off|on] [cycles=5] [maxMinutes=240] [seed=1]
// Needs `python -m http.server 8123` in the repo root and PUPPETEER_MODULE pointing at puppeteer-core.
// The bot prints as soon as the minimum reward (10 stars) is available, then spends every star it can, so the
// numbers answer one question: does the second and fifth run reach the same 12.5M faster? They are not a pacing promise.
import { pathToFileURL } from 'node:url';
const [mode = 'off', cyclesArg = '5', maxArg = '240', seedArg = '1'] = process.argv.slice(2);
const cycles = +cyclesArg, maxMinutes = +maxArg, seed = +seedArg;
if (!['off', 'on'].includes(mode) || !Number.isInteger(cycles) || !(maxMinutes > 0) || !Number.isInteger(seed)) throw new Error('Usage: cycle-compare.mjs [off|on] [cycles] [maxMinutes] [seed]');
const { default: puppeteer } = await import(pathToFileURL(process.env.PUPPETEER_MODULE).href);
const browser = await puppeteer.launch({ executablePath: process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, protocolTimeout: 0 });
const errors = [];
try {
  const page = await browser.newPage();
  page.on('pageerror', e => errors.push(e.message));
  if (process.env.CC_TUNE) await page.evaluateOnNewDocument(t => { window.__TUNE = { LGB: t }; }, JSON.parse(process.env.CC_TUNE));
  await page.goto(`${process.env.CC_URL || 'http://127.0.0.1:8123'}/tools/balance.html?long-game&featureProfile=legacy${mode === 'on' ? '&lgb=1' : ''}`);
  // concurrent Chrome starts can be slow or deliver a stale load event, so wait for the harness itself
  let up = false;
  for (let i = 0; i < 600 && !up; i++) { up = await page.evaluate(() => !!(window.Bot && window.IMI?.ops?.dev)).catch(() => false); if (!up) await new Promise(r => setTimeout(r, 100)); }
  if (!up) throw new Error('Harness did not start');
  await page.evaluate(({ seed, mode, noBundle, profile, order0 }) => {
    window.__noBundle = noBundle; if (order0) window.__order = order0.split(','); window.__profile = profile;
    const D = IMI.ops.dev, order = mode === 'on' ? (window.__order || ['speed', 'keeper', 'power', 'seed', 'sales', 'golden']) : ['crew', 'seed', 'speed', 'keeper', 'sales', 'golden'];
    const cc = window.__cc = { sec: 0, last: 0, rows: [], blocked: 0 };
    Bot.start({ profile: window.__profile || 'active', strategy: 'collect', seed, activeMinutes: Infinity, tapRate: 3, realActions: true, usePublisher: true });
    const spend = () => {
      for (let guard = 0; guard < 30; guard++) {
        const s = D.S(), u = D.LEG.find(x => { const lv = D.legLvl(x.id); return order.includes(x.id) && lv < x.max && s.legacy.stars >= x.costs[lv] && (!window.LegacyB?.enabled() || !LegacyB.locked(x.id, s.legacy.ups)); });
        if (!u) return;
        const pick = order.map(id => D.LEG.find(x => x.id === id)).find(x => x && D.legLvl(x.id) < x.max && D.S().legacy.stars >= x.costs[D.legLvl(x.id)] && (!window.LegacyB?.enabled() || !LegacyB.locked(x.id, D.S().legacy.ups)));
        try { D.action('legbuy', { id: pick.id }); } catch { /* the burst effect needs a real button */ }
      }
    };
    cc.line = {};
    const stamp = () => {
      const s = D.S(), t = +((cc.sec - cc.last) / 60).toFixed(1), owned = s.desks.filter(d => d.owned).length, e = s.run.earned / D.starBase;
      for (let n = 2; n <= owned; n++) cc.line['desk' + n] ??= t;
      for (const f of [.01, .1, .5]) if (e >= f) cc.line['earn' + f * 100 + '%'] ??= t;
      if (s.pub.tier) cc.line.pub ??= t;
    };
    cc.step = seconds => {
      for (let i = 0; i < seconds; i++) {
        Bot.run(1 / 60); cc.sec++; stamp();
        document.querySelector('.o-celebrate [data-close]')?.click();
        const s = D.S();
        // the ordinary-shop upgrades of the package: buy a rank once the bot holds twice its price, so machines still come first
        if (mode === 'on' && !window.__noBundle && s.printing >= 1 && cc.sec % 5 === 0) {
          const next = s.desks.findIndex(d => !d.owned), ref = D.DESKS[next < 0 ? D.DESKS.length - 1 : next].price;
          for (const key of LegacyB.FAMILIES) {
            if (key === 'bundle' && s.pub.tier < 1) continue;
            if (s.printing < LegacyB.minPrinting(key)) continue;
            const rank = (s.sb && s.sb[key]) || 0, cost = LegacyB.rankCost(key, rank, ref, Economy.round);
            if (cost && IMI.bananas.get() >= 2 * cost) { D.buy(key); break; }
          }
        }
        if (D.starsNow() >= 10 && !s.challenge) {
          const before = s.printing, stars = D.starsNow(), cycle = IMI.ops.dev.cycles?.();
          D.doPrint();
          if (D.S().printing === before) { cc.blocked++; continue; }
          const closed = cycle && IMI.ops.dev.cycles().cycles.at(-1);
          cc.rows.push({ printing: D.S().printing, minutes: +((cc.sec - cc.last) / 60).toFixed(2), stars, crew: D.S().desks[0].crew.length, ups: { ...D.S().legacy.ups },
            line: cc.line, toPriorPeak: closed?.toPriorPeak, firstSale: closed?.firstSale, blocked: closed?.blocked, manual: closed?.manual });
          cc.last = cc.sec; cc.line = {}; spend();
        }
      }
    };
  }, { seed, mode, noBundle: process.env.CC_NOBUNDLE === '1', profile: process.env.CC_PROFILE || 'active', order0: process.env.CC_ORDER || '' });
  while (true) {
    const done = await page.evaluate(() => { window.__cc.step(60); return { rows: window.__cc.rows.length, minutes: window.__cc.sec / 60, blocked: window.__cc.blocked }; });
    if (done.rows >= cycles || done.minutes >= maxMinutes || done.blocked > 50) break;
  }
  const out = await page.evaluate(() => { const s = IMI.ops.dev.S(); return { minutes: window.__cc.sec / 60, rows: window.__cc.rows, blocked: window.__cc.blocked, end: { earned: s.run.earned, stars: IMI.ops.dev.starsNow(), desks: s.desks.filter(d => d.owned).length, marks: Bot.report().marks.slice(-6) } }; });
  console.log(JSON.stringify({ mode, seed, ...out, errors }, null, 1));
} finally { await browser.close(); }
