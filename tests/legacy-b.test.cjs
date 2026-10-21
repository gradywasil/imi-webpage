const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function load(tune, flag = true) {
  const context = { GameFeatures: { enabled: name => flag && name === 'lgb' }, __TUNE: tune ? { LGB: tune } : undefined };
  context.window = context;
  vm.runInNewContext(readFileSync(path.join(__dirname, '..', 'legacy-b.js'), 'utf8'), context);
  return context.LegacyB;
}
const plain = x => JSON.parse(JSON.stringify(x));

test('enabled only with the flag; tracks give the documented multipliers', () => {
  assert.equal(load(null, false).enabled(), false);
  const b = load();
  assert.equal(b.enabled(), true);
  assert.deepEqual([1, 2, 3, 4].map(b.pressMult), [2, 4, 8, 16]);
  assert.deepEqual([1, 2, 3].map(r => b.keeperBonus(r) + 1), [2, 4, 8]);
  assert.equal(b.pressMult(5), 24, 'past the listed ranks every rank is a smaller step: x1.5');
  assert.equal(b.pressMult(99), b.pressMult(60), 'rank is capped at the end of the tail (60 ranks)');
  assert.equal(load({ press: { max: 1, costs: [5], mult: 3 } }).pressMult(9), 3, 'a tuned track without a tail still stops at its own cap');
  const tail = b.shop([{ id: 'speed' }, { id: 'keeper' }]).find(u => u.id === 'speed');
  assert.equal(tail.max, 60);
  assert.ok(tail.costs.every((c, i) => i < 4 || c > tail.costs[i - 1]), 'every tail rank costs more than the one before');
  assert.ok(Math.abs(tail.costs[5] / tail.costs[4] - 2.2) < .05);
  assert.ok(Math.abs(b.powerMult(4) - 5.0625) < 1e-9);
  assert.equal(b.locked('power', {}), '', 'Publishing Power is open from the first star by default');
  const gated = load({ powerNeeds: true });
  assert.equal(gated.locked('power', { speed: 1 }), 'Needs Printing Press I and Quick Keepers I', 'the dependency remains available as a tuning option');
  assert.equal(gated.locked('power', { speed: 1, keeper: 1 }), '');
  assert.equal(b.locked('speed', {}), '');
});

test('the shop swaps the tracks, hides the paid crew and adds Publishing Power after Quick Keepers', () => {
  const b = load();
  const base = [{ id: 'seed' }, { id: 'crew' }, { id: 'speed', max: 10 }, { id: 'keeper', max: 8 }, { id: 'sales' }, { id: 'golden' }];
  const shop = b.shop(base);
  assert.deepEqual(shop.map(u => u.id), ['seed', 'speed', 'keeper', 'power', 'sales', 'golden', 'ledger', 'buyer', 'blueprint', 'foreman']);
  assert.deepEqual(plain(shop.find(u => u.id === 'speed').costs.slice(0, 4)), [5, 15, 40, 100]);
  assert.deepEqual(plain(shop.find(u => u.id === 'keeper').costs.slice(0, 3)), [5, 15, 40]);
  assert.deepEqual(plain(shop.find(u => u.id === 'power').costs.slice(0, 4)), [10, 25, 60, 150]);
  assert.equal(shop.find(u => u.id === 'power').now(4), '×5.06');
  assert.equal(shop.find(u => u.id === 'speed').now(3), '×8');
  assert.equal(base.length, 6, 'the base list is untouched');
});

test('every old rank maps to a new rank that keeps its benefit, and refunds are never negative', () => {
  const b = load();
  for (const [id, max] of [['speed', 10], ['keeper', 8]]) {
    for (let old = 1; old <= max; old++) {
      const rank = b.mapRank(id, old);
      assert.ok(rank >= 1, `${id} ${old} maps`);
      const benefit = id === 'speed' ? b.pressMult(rank) : b.keeperBonus(rank) + 1;
      assert.ok(benefit >= 1 + .1 * old - 1e-9, `${id} ${old} keeps its benefit`);
    }
  }
  for (let speed = 0; speed <= 10; speed++) for (let keeper = 0; keeper <= 8; keeper++) {
    const m = b.migrate({ stars: 7, total: 90, ups: { speed, keeper } }, 3);
    assert.ok(m.refund >= 0);
    assert.equal(m.legacy.total, 90, 'refunds never touch lifetime stars');
    assert.equal(m.legacy.stars, 7 + m.refund);
  }
});

test('migration refunds old spend minus the new credit, keeps the crew, and is idempotent', () => {
  const b = load();
  const legacy = { stars: 4, total: 400, k: 10, ups: { seed: 2, speed: 10, keeper: 8, crew: 1, sales: 3 } };
  const m = b.migrate(plain(legacy), 5);
  const speedBack = b.spent('speed', 10) - 5, keeperBack = b.spent('keeper', 8) - 5;
  assert.equal(m.changed, true);
  assert.deepEqual(plain(m.legacy.ups), { seed: 2, speed: 1, keeper: 1, crew: 1, sales: 3 });
  assert.equal(m.refund, speedBack + keeperBack + 30);
  assert.equal(m.legacy.stars, 4 + speedBack + keeperBack + 30);
  assert.equal(m.legacy.total, 400);
  assert.equal(m.legacy.mig.ledger.refund.crew, 30);
  assert.deepEqual(plain(m.legacy.mig.ledger.from), { speed: 10, keeper: 8, crew: 1 });
  const again = b.migrate(m.legacy, 5);
  assert.equal(again.changed, false, 'second run changes nothing');
  assert.equal(again.legacy, m.legacy);
  assert.equal(b.validLedger(m.legacy.mig), true);
});

test('players without a paid crew are granted it after their first Printing and never refunded for it', () => {
  const b = load();
  const first = b.migrate({ stars: 0, total: 0, ups: {} }, 1);
  assert.equal(first.legacy.ups.crew, 1);
  assert.equal(first.refund, 0);
  assert.equal(first.legacy.mig.ledger.granted.crew, true);
  const none = b.migrate({ stars: 0, total: 0, ups: {} }, 0);
  assert.equal(none.legacy.ups.crew, undefined, 'the first Printing grants it, not the migration');
});

test('brand-new saves are stamped so new-style ranks are never refunded as old purchases', () => {
  const b = load();
  const legacy = { stars: 10, total: 10, ups: { speed: 1 }, mig: b.stamp() };
  assert.equal(b.migrate(legacy, 1).changed, false);
  assert.equal(b.validLedger(undefined), true);
  assert.equal(b.validLedger({ lgb: 99 }), false, 'unknown migration versions are refused, not guessed');
});

test('when a tuned track cannot cover an old benefit the full spend is refunded and the bridge is recorded', () => {
  const b = load({ press: { max: 1, costs: [5], mult: 1.5 } });
  const m = b.migrate({ stars: 0, total: 50, ups: { speed: 10 } }, 2);
  assert.equal(m.legacy.ups.speed, 0);
  assert.equal(m.legacy.mig.ledger.refund.speed, b.spent('speed', 10));
  assert.deepEqual(plain(m.legacy.mig.ledger.bridge), ['speed']);
});

test('publisher bundle sizes, prices and locks follow the plan and never read the wallet', () => {
  const b = load();
  assert.deepEqual([0, 1, 2, 3].map(b.bundleSize), [1, 2, 4, 8]);
  assert.equal(b.bundleSize(99), 8, 'rank is capped');
  assert.equal(b.bundleMax(), 3);
  const round = n => Math.round(n / 25) * 25;
  assert.deepEqual([0, 1, 2].map(r => b.bundleCost(r, 75000, round)), [7500, 18750, 45000], '10%, 25% and 60% of the machine price');
  assert.equal(b.bundleCost(3, 75000), null, 'no fourth rank');
  assert.equal(b.bundleCost(0, 0), null, 'a missing reference price never prices at zero');
  assert.equal(b.bundleLocked(0, 3), 'Unlocks after your first Printing');
  assert.equal(b.bundleLocked(1, 0), 'Needs the Publisher’s assistant');
  assert.equal(b.bundleLocked(1, 1), '');
  const tuned = load({ bundle: { sizes: [1, 3], pct: [.5] } });
  assert.deepEqual([tuned.bundleMax(), tuned.bundleSize(1)], [1, 3], 'the balance harness can retune the track');
});

test('machine drive and keeper batches follow the plan and are capped at their tracks', () => {
  const b = load();
  assert.deepEqual([0, 1, 2, 3].map(r => +b.driveMult(r).toFixed(3)), [1, 1.4, 1.96, 2.744]);
  assert.equal(b.driveMult(9), b.driveMult(3));
  assert.deepEqual([0, 1, 2, 3].map(b.batchCap), [4, 8, 16, 32], 'a legal baseline of four actions, doubling per rank');
  assert.equal(b.batchCap(9), 32);
  assert.deepEqual(plain(b.FAMILIES), ['drive', 'batch', 'bundle', 'dict', 'backlist', 'editorial', 'genre']);
  for (const k of ['drive', 'batch', 'bundle']) assert.equal(b.rankMax(k), 3);
  for (const k of ['dict', 'backlist', 'editorial', 'genre']) assert.equal(b.rankMax(k), 1);
  assert.equal(b.rankLocked('drive', 0, 3), 'Unlocks after your first Printing');
  assert.equal(b.rankLocked('batch', 1, 0), '', 'only bundles need the publisher');
  assert.equal(b.rankLocked('bundle', 1, 0), 'Needs the Publisher’s assistant');
  assert.equal(b.rankCost('batch', 1, 1000), 250);
});

test('shared dictionary is bounded by adjacent machines and backlist logistics steps at catalog milestones', () => {
  const b = load();
  assert.deepEqual([0, 1, 2, 5].map(n => +b.dictChance(1, n).toFixed(3)), [0, .1, .2, .2], 'capped at two neighbours');
  assert.equal(b.dictChance(0, 2), 0, 'nothing before it is bought');
  assert.equal(b.backlistFactor(0, 500), 1, 'nothing before it is bought');
  assert.deepEqual([0, 24, 25, 60, 150, 999].map(n => +b.backlistFactor(1, n).toFixed(2)), [1, 1, .9, .8, .7, .6], 'one step per milestone, at most four');
  assert.equal(b.rankLocked('dict', 1, 3), 'Unlocks at Printing 2');
  assert.equal(b.rankLocked('backlist', 2, 0), '');
  assert.equal(b.rankLocked('drive', 1, 0), '');
  assert.equal(b.rankCost('dict', 0, 1000), 250);
  assert.equal(b.rankCost('dict', 1, 1000), null, 'single rank');
});

test('editorial desk needs the ledger, genre production run needs an Imprint genre, and the genre run trades speed', () => {
  const b = load();
  assert.equal(b.rankLocked('editorial', 1, 0, {}), 'Needs Rebuild Ledger');
  assert.equal(b.rankLocked('editorial', 1, 0, { ledger: true }), '');
  assert.equal(b.rankLocked('genre', 1, 0, { ledger: true }), 'Needs an Imprint genre');
  assert.equal(b.rankLocked('genre', 1, 0, { genre: true }), '');
  assert.equal(b.rankLocked('drive', 1, 0), '', 'other upgrades do not read the extra context');
  assert.equal(b.rankLocked('genre', 0, 0, { genre: true }), 'Unlocks after your first Printing');
  assert.deepEqual([b.genreSpeed(1, true), b.genreSpeed(1, false), b.genreSpeed(0, true)], [1.3, .92, 1], 'a trade-off, and nothing before it is bought');
  assert.equal(b.rankCost('editorial', 0, 1000), 250);
});

test('a bridge keeps the old benefit alive without stacking, and buying a rank replaces it', () => {
  const b = load({ press: { max: 1, costs: [5], mult: 1.5 }, keeper: { max: 1, costs: [5], mult: 1.2 } });
  const m = b.migrate({ stars: 0, total: 50, ups: { speed: 10, keeper: 8 } }, 2).legacy;
  assert.deepEqual(plain(m.mig.ledger.bridge), ['speed', 'keeper']);
  // 10 old ranks gave 1 + 0.1 * 10 = 2x; 8 keeper ranks gave 1.8x
  assert.ok(Math.abs(b.speedMult(m) - 2) < 1e-9, 'the old typing benefit stays while no new rank is owned');
  assert.ok(Math.abs(b.keeperMult(m) - 1.8) < 1e-9);
  assert.deepEqual(plain(b.bridged(m)).map(x => x.id), ['speed', 'keeper']);
  // buying rank I replaces the bridge: the new benefit alone applies, never both multiplied
  const bought = { ...m, ups: { ...m.ups, speed: 1 } };
  assert.ok(Math.abs(b.speedMult(bought) - 1.5) < 1e-9, 'the replacement stands alone');
  assert.equal(b.bridgeMult(bought, 'speed'), 1);
  assert.ok(Math.abs(b.keeperMult(bought) - 1.8) < 1e-9, 'the other bridge is untouched');
  // no ledger bridge, no effect; the default tracks never bridge
  const plainSave = load().migrate({ stars: 0, total: 50, ups: { speed: 10 } }, 2).legacy;
  assert.equal(load().bridged(plainSave).length, 0);
  assert.equal(load().speedMult({ ups: { speed: 2 } }), 4);
});
