const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
let h, browser, input;
before(async () => {
  h = await import('../tools/long-game/lg01-b-fixture.mjs'); browser = await h.browser();
  input = await h.records({ intro: { version: 1, done: true, train: true, words: true, shop: true, hireAt: 0 } });
});
after(async () => { await browser?.close(); });

/* The real game logic, with the caps that used to stop the endgame removed. */
async function room(body) {
  const f = await h.fixture(browser, { records: input, speed: 1 });
  try {
    const result = await f.page.evaluate(`(() => { const D = IMI.ops.dev, S = D.S(); ${body} })()`);
    assert.deepEqual(f.errors, []);
    return result;
  } finally { await f.close(); }
}

test('restorations go on past Mk III: each is x1.2 typing and costs six times the last', async () => {
  const r = await room(`
    IMI.bananas.add(1e18); const d = S.desks[0], out = { names: [], costs: [], mult: [] };
    for (let k = 0; k < 6; k++) { out.costs.push(D.mkCost(0)); D.buy('mk', 0); out.names.push(D.mkName(d.mk)); out.mult.push(D.mkMult(d.mk)); }
    out.mk = d.mk; return out;`);
  assert.equal(r.mk, 6, 'six restorations bought, none refused');
  assert.deepEqual(r.names, ['Mk II', 'Mk III', 'Mk IV', 'Mk V', 'Mk VI', 'Mk VII']);
  assert.ok(Math.abs(r.mult[2] / r.mult[1] - 1.2) < 1e-9 && Math.abs(r.mult[1] - 1.5) < 1e-9, 'Mk II and III are as before, then x1.2: ' + r.mult);
  assert.ok(Math.abs(r.costs[3] / r.costs[2] - 6) < 1e-6 && Math.abs(r.costs[2] / r.costs[1] - 6) < 1e-6, 'six times each: ' + r.costs);
  assert.equal(r.costs[1] / r.costs[0], 12, 'the first two prices are unchanged');
});

test('shift crews open only on a full crew, add a twelfth of the crew each, and every tenth is a bigger step', async () => {
  const r = await room(`
    const d = S.desks[0]; d.owned = true; d.paws = 0; d.crew = []; d.up.shift = 0; d.letters = { E: 1e15 }; D.touchBank();
    D.buyUp('paw', 0, D.PAW_MAX - 1); D.buyUp('shift', 0, 1); const locked = d.up.shift, eleven = d.paws;
    D.buyUp('paw', 0, 1); const rate0 = D.autoRate(d);
    D.buyUp('shift', 0, 3); const three = d.up.shift, rate3 = D.autoRate(d);
    return { max: D.PAW_MAX, locked, eleven, twelve: d.paws, three, ratio: rate3 / rate0, m10: D.shiftMult(10), m9: D.shiftMult(9), m20: D.shiftMult(20) };`);
  assert.equal(r.eleven, r.max - 1);
  assert.equal(r.twelve, r.max);
  assert.equal(r.locked, 0, 'one short of a full crew is not a full crew');
  assert.equal(r.three, 3);
  assert.ok(Math.abs(r.ratio - 1.25) < 1e-6, 'three shifts is 3/12 more output: ' + r.ratio);
  assert.ok(Math.abs(r.m10 / r.m9 - 1.5 * (1 + 10 / 12) / (1 + 9 / 12)) < 1e-9, 'the tenth shift takes a x1.5 step');
  assert.ok(r.m20 > r.m10 * 1.5, 'and the twentieth another');
});

test('a price too big to count letter by letter is paid the same way the small ones are', async () => {
  const r = await room(`
    const naive = (letters, cost) => { const L = { ...letters }; while (cost-- > 0) { const top = Object.keys(L).filter(c => L[c] > 0).sort((a, b) => L[b] - L[a])[0]; if (!top) break; if (--L[top] <= 0) delete L[top]; } return L; };
    const bad = [];
    for (let t = 0; t < 60; t++) {
      const letters = {}; for (const c of 'ETAOINSHRDLU'.slice(0, 3 + (t % 9))) letters[c] = 1 + Math.floor(Math.random() * 400);
      const total = Object.values(letters).reduce((a, b) => a + b, 0), cost = Math.floor(Math.random() * total * 1.1);
      const d = { letters: { ...letters }, tray: ['E', 'T', 'A'] }; D.spendLetters(d, cost, {});
      const want = naive(letters, cost);
      if (JSON.stringify(Object.entries(want).sort()) !== JSON.stringify(Object.entries(d.letters).sort())) bad.push({ letters, cost, got: d.letters, want });
    }
    const big = { letters: { E: 4e9, T: 3e9, A: 1e9 }, tray: [] }, t0 = performance.now(); D.spendLetters(big, 5e9, {});
    return { bad: bad.slice(0, 2), badN: bad.length, big: big.letters, ms: performance.now() - t0 };`);
  assert.equal(r.badN, 0, JSON.stringify(r.bad));
  assert.equal(r.big.E + r.big.T + r.big.A, 3e9, 'five billion letters came out of eight billion');
  assert.ok(r.ms < 50, 'and it was instant');
});

test('coaching has no last level, and the ones past the tenth are worth more every tenth step', async () => {
  const r = await room(`
    IMI.bananas.add(1e30); const d = S.desks[0]; d.owned = true; d.paws = 0; d.crew = []; d.letters = { E: 1e6 }; D.touchBank(); D.buyUp('paw', 0, 1);
    const t = d.crew[0]; t.coach = 10; D.coachTypist(0, 0); D.coachTypist(0, 0);
    return { coach: t.coach, p: [0, 5, 10, 11, 20, 30].map(D.coachPct) };`);
  assert.equal(r.coach, 12, 'coaching went past ten');
  assert.deepEqual(r.p, [0, 10, 20, 22, 50, 80], 'unchanged up to level 10, then +2% a level plus 10% at every tenth');
});

test('a media catalogue can be remastered again and again, each level raising its income and its price', async () => {
  const r = await room(`
    IMI.bananas.add(1e30); S.divs.songs = 3; S.written = Object.fromEntries(Object.keys(D.RBY).filter(id => !D.RBY[id].gen && !D.RBY[id].kid && !D.RBY[id].lib).slice(0, 4).map(id => [id, true])); D.touchBank();
    const base = D.divBase(); D.remasterDiv('songs'); const one = D.divBase(); D.remasterDiv('songs');
    return { base, ratio1: one / base, ratio2: D.divBase() / one, lv: S.divLv.songs, none: (() => { S.divs.tv = 0; const lv = S.divLv.tv || 0; D.remasterDiv('tv'); return (S.divLv.tv || 0) === lv; })(), m10: D.remasterMult(10), m9: D.remasterMult(9) };`);
  assert.equal(r.lv, 2);
  assert.ok(Math.abs(r.ratio1 - 1.12) < 1e-6 && Math.abs(r.ratio2 - 1.12) < 1e-6, 'x1.12 a level: ' + [r.ratio1, r.ratio2]);
  assert.ok(r.none, 'a division with nothing released cannot be remastered');
  assert.ok(Math.abs(r.m10 / r.m9 - 1.12 * 1.5) < 1e-9, 'every tenth level is a further x1.5');
});

test('a desk holds 48 typists, the later hires cost less than the old curve, and typists keep levelling past ten', async () => {
  const r = await room(`
    const d = S.desks[0]; d.owned = true; d.paws = 0; d.crew = []; d.letters = { E: 1e15 }; D.touchBank();
    D.buyUp('paw', 0, 200); const paws = d.paws;
    const speed = D.deskSpeed(d), crew = d.crew.reduce((a, t) => a + IMI.ops.dev.typistSpeed(t), 0);
    return { paws, crew: d.crew.length, same: Math.abs(speed - crew) < 1e-9, l: [0, 39, 40, 11000, 19799, 19800, 1e6].map(D.levelOf), x: [9, 10, 11].map(D.lvlXp) };`);
  assert.equal(r.paws, 48, 'bought as many as the desk holds');
  assert.equal(r.crew, 48, 'and each one is a named monkey');
  assert.ok(r.same, 'the per-tick desk sum is the sum of the typists');
  assert.deepEqual(r.l.slice(0, 5), [1, 1, 2, 10, 10], 'the first ten levels are unchanged');
  assert.equal(r.l[5], 11, 'level 11 at 1.8x the xp of level 10');
  assert.equal(r.l[6], 17, 'and no last level');
  assert.deepEqual(r.x, [11000, 19800, 35640]);
});

test('the desks report the words they bank each second, and Auto-remaster buys only what the wallet can hold twice over', async () => {
  const r = await room(`
    const d = S.desks[0]; d.owned = true; d.paws = 4; d.crew = []; d.keeper = { ...d.keeper, owned: true, on: true, def: 6, lv: 20 }; d.letters = { E: 4000, T: 4000, A: 4000, O: 4000, I: 4000, N: 4000, S: 4000, H: 4000, R: 4000, D: 4000, L: 4000, U: 4000 };
    D.touchBank(); const real = performance.now.bind(performance); let t = real() + 1000; performance.now = () => t;
    for (let k = 0; k < 240; k++) { t += 1000 / 60; D.tick(); }
    performance.now = real;
    const words = D.wordRate(0), idle = D.wordRate(3);
    S.written = Object.fromEntries(Object.keys(D.RBY).filter(id => !D.RBY[id].gen && !D.RBY[id].kid && !D.RBY[id].lib).slice(0, 4).map(id => [id, true]));
    S.divs.songs = 3; S.divs.tv = 3; D.touchBank(); IMI.bananas.add(1e30);
    const off = D.remasterAuto(); S.divAuto = true; const young = D.remasterAuto(); S.stats.remasters = 3;
    const on = D.remasterAuto(); const lv = { ...S.divLv };
    const broke = (() => { IMI.bananas.spend(IMI.bananas.get() - 1); return D.remasterAuto(); })();
    return { words, idle, off, young, on, lv, broke, count: S.stats.remasters };`);
  assert.ok(r.words > 0, 'desk one banked words: ' + r.words);
  assert.equal(r.idle, 0, 'a desk with no keeper work reports none');
  assert.equal(r.off, 0, 'the switch is off');
  assert.equal(r.young, 0, 'three hand remasters unlock it');
  assert.equal(r.on, 3, 'on, it buys up to three at a time: ' + JSON.stringify(r.lv));
  assert.equal(r.count, 6);
  assert.equal(r.broke, 0, 'with an empty wallet it buys nothing');
});
