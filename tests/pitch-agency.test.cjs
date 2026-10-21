const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
let h, browser, input;
before(async () => {
  h = await import('../tools/long-game/lg01-b-fixture.mjs'); browser = await h.browser();
  input = await h.records({ intro: { version: 1, done: true, train: true, words: true, shop: true, hireAt: 0 } });
});
after(async () => { await browser?.close(); });

/* A late-game build on the real game logic: every machine owned, crews and keepers well along. */
async function room(run, args = {}) {
  const f = await h.fixture(browser, { records: input, speed: 1 });
  try {
    const result = await f.page.evaluate(`(() => { ${build}
${run} })()`);
    assert.deepEqual(f.errors, []);
    return result;
  } finally { await f.close(); }
}
const build = `function setup(opts) {
  const D = IMI.ops.dev, S = D.S();
  S.bank = {}; S.written = {}; S.focus = null; S.autoFocus = true; S.pub = { tier: opts.pub || 0, on: true, rule: 'any', lv: opts.pubLv || 0 }; S.lamp = 0; S.pitchteam = opts.team || 0; S.agencyLv = opts.lv || 0; S.pitches = []; S.pitchShelf = { n: 0, pay: 0 };
  S.desks.forEach((d, i) => { d.owned = i < (opts.desks || 6); d.mk = 2; d.paws = opts.paws || 6; d.keeper = { ...d.keeper, owned: true, on: true, lv: opts.klv || 0 }; d.letters = {}; d.up.fing = opts.fing || 0; });
  D.touchBank();
  return { D, S };
}`;

test('the agency climbs three tiers and then levels with no end, and each level speeds every typewriter', async () => {
  const r = await room(`
    const { D, S } = setup({});
    IMI.bananas.add(1e15);
    Object.keys(D.RBY).filter(id => !D.RBY[id].gen && !D.RBY[id].kid && !D.RBY[id].lib).slice(0, 3).forEach(id => { S.written[id] = true; });
    D.touchBank();
    const out = { tiers: [], speed: [], ind: [] };
    for (let k = 0; k < 3; k++) { D.buy('agency'); out.tiers.push(D.agencyTier()); }
    out.base = D.industryMult();
    for (let k = 0; k < 12; k++) D.buy('agency');
    out.lv = S.agencyLv; out.ind = D.industryMult(); out.speed = [D.runSpeed(9), D.runSpeed(10)];
    return out;`);
  assert.deepEqual(r.tiers, [1, 2, 3]);
  assert.equal(r.base, 1, 'no levels, no bonus');
  assert.equal(r.lv, 12, 'levels keep being bought');
  assert.ok(r.speed[1] / r.speed[0] > 2.2, 'the tenth level doubles on top of the usual step: ' + r.speed);
  assert.ok(r.ind > 1.04 ** 12, 'every typewriter is faster: ' + r.ind);
});

test('an older save that holds true for the pitch assistants is tier one, and an unaffordable tier is refused', async () => {
  const r = await room(`
    const { D, S } = setup({});
    S.pitchteam = true; const old = D.agencyTier();
    S.pitchteam = 0; const before = IMI.bananas.get(); D.buy('agency');
    return { old, afterTier: D.agencyTier(), spent: before - IMI.bananas.get() };`);
  assert.equal(r.old, 1);
  assert.equal(r.afterTier, 0, 'needs the bananas and the sold titles');
  assert.equal(r.spent, 0);
});

test('the Commissioning desk keeps pitches open by itself and folds old sold ones into a shelf total that still pays', async () => {
  const r = await room(`
    const { D, S } = setup({ team: 2 });
    const sold = () => S.pitches.filter(p => S.written[p.id]).length;
    const first = D.agencyCommission(8), again = D.agencyCommission(8);
    let rounds = 0;
    while (sold() < 158 && rounds++ < 400) { S.pitches.forEach(p => { S.written[p.id] = true; }); D.agencyCommission(8); }
    S.pitches.forEach(p => { S.written[p.id] = true; }); S.written = { ...S.written }; D.touchBank();
    const before = { sold: D.soldCount(), pay: D.royBase(), titles: sold(), pitched: S.stats.pitched };
    const dropped = D.retirePitches();
    return { first, again, before, dropped, shelf: S.pitchShelf.n, kept: sold(), open: S.pitches.filter(p => !S.written[p.id]).length, recipes: D.RECIPES.filter(x => x.gen).length,
      sold: D.soldCount(), pay: D.royBase(), pitched: S.stats.pitched, gone: S.pitches.every(p => D.RBY[p.id]) }; `);
  assert.equal(r.first, 3, 'three commissions are kept open at level 0');
  assert.equal(r.again, 0, 'and no more than that');
  assert.ok(r.before.titles > 160 && r.dropped === r.before.titles - 40, 'the oldest sold pitches were folded: ' + JSON.stringify(r));
  assert.equal(r.kept, 40, 'the newest sold pitches stay as titles');
  assert.equal(r.shelf + r.kept + r.open, r.pitched, 'nothing was lost: shelf + titles + open = every pitch ever commissioned');
  assert.equal(r.recipes, r.kept + r.open, 'the recipe list only holds what is still in play');
  assert.equal(r.sold, r.before.sold, 'the sold count did not drop');
  assert.equal(r.pay, r.before.pay, 'royalties did not drop when the pitches were folded');
  assert.ok(r.gone, 'every pitch still listed is still a recipe');
});

test('keeper levels past the old ones keep helping: every tenth level is a bigger step, and the floor is far below the old one', async () => {
  const r = await room(`
    const { D, S } = setup({});
    const at = lv => D.keeperAt(0, lv);
    const out = { l6: at(6), l15: at(15), l16: at(16), l106: at(106) };
    S.desks[0].keeper.lv = 120; IMI.bananas.add(1e18); const before = D.keeperPeriod(0); D.buy('keeper', 0);
    out.floor = before; out.lvAfter = S.desks[0].keeper.lv; return out;`);
  assert.ok(Math.abs(r.l16 / r.l15 - 0.95 * 0.8) < 1e-6, 'level 16 takes the milestone step: ' + r.l16 / r.l15);
  assert.ok(r.l16 < r.l6 * 0.95 ** 10 * 0.81, 'and the milestone stacks with the ordinary steps');
  assert.equal(r.l106, 0.004, 'the floor is 4 ms a word');
  assert.equal(r.lvAfter, 120, 'a keeper at the floor is not sold more levels');
});

test('a desk typing faster than the key-by-key loop can follow types in bulk, and nothing breaks', async () => {
  const r = await room(`
    const { D, S } = setup({ paws: 12, fing: 60, klv: 60, pub: 3, team: 3, lv: 20 });
    const real = performance.now.bind(performance); let t = real() + 1000; performance.now = () => t;
    const l0 = S.stats.letters; let worstRate = 0;
    for (let k = 0; k < 600; k++) { t += 1000 / 60; D.tick(); }
    performance.now = real;
    return { letters: S.stats.letters - l0, words: S.stats.words, pitchSold: S.stats.pitchSold || 0, sold: D.soldCount(), paws: S.desks.reduce((a, d) => a + d.paws, 0) };`);
  assert.ok(r.letters > 8 * 12 * 600, 'beyond the old 8 presses per typist per tick: ' + r.letters);
  assert.ok(r.words > 0 && r.sold > 0, 'the keepers and the sales kept up');
});

test('the press run past the Night shift sells faster and costs more at every level, and the agency sells pitches while you are away', async () => {
  const r = await room(`
    const { D, S } = setup({ pub: 3 });
    IMI.bananas.add(1e15);
    Object.keys(D.RBY).filter(id => !D.RBY[id].gen && !D.RBY[id].kid && !D.RBY[id].lib).slice(0, 3).forEach(id => { S.written[id] = true; });
    D.touchBank();
    const a = IMI.bananas.get(); D.buy('pubrun'); const c1 = a - IMI.bananas.get(); const b = IMI.bananas.get(); D.buy('pubrun'); const c2 = b - IMI.bananas.get();
    const out = { lv: S.pub.lv, c1, c2 };
    const s2 = setup({ pub: 0, team: 3, paws: 8, klv: 10, fing: 10, desks: 2 }); s2.S.written = {}; s2.D.touchBank();
    const rep = IMI.ops.simulateAway(30 * 60);
    out.away = { sold: rep.pubSold, pitches: s2.S.stats.pitchSold || 0 };
    return out;`);
  assert.equal(r.lv, 2);
  assert.ok(r.c2 > r.c1, 'each level costs more: ' + [r.c1, r.c2]);
  assert.ok(r.away.pitches > 0 && r.away.sold === r.away.pitches, 'the agency alone sold pitches while away: ' + JSON.stringify(r.away));
});
