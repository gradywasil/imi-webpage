const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function load() {
  const context = {}; context.window = context;
  vm.runInNewContext(readFileSync(path.join(__dirname, '..', 'campus.js'), 'utf8'), context);
  return context.Campus;
}
const plain = x => JSON.parse(JSON.stringify(x));
const ctx = (over = {}) => ({ pawBase: [1.5, 9, 27, 81, 243, 729], keeperBase: [.6, 1.2, 2, 3, 4, 5], avgPay: [100, 300, 900, 2700, 8100, 24300], wordsPerTitle: [4, 6, 8, 10, 12, 14],
  catalog: [40, 40, 40, 40, 40, 40], price: [0, 75000, 750000, 9375000, 125000000, 1562500000], names: ['Bamboo', 'Hibiscus', 'Lagoon', 'Honeycomb', 'Orchid', 'Moonflower'], speed: 1, eff: 1, ...over });
const flags = { estate: 1, autoCycles: 10, restored: 1, mastery: 1 };

test('the Annex opens only when every milestone is met, and says which are missing', () => {
  const C = load(), c = C.fresh();
  const m = C.milestones({ estate: 0, autoCycles: 4, restored: 1, mastery: 0 });
  assert.equal(m.open, false);
  assert.deepEqual(plain(m.rows.map(r => r.done)), [false, false, true, false]);
  assert.match(C.openDeed(c, { estate: 0, autoCycles: 4, restored: 1, mastery: 0 }).why, /milestones/);
  const open = C.openDeed(c, flags);
  assert.equal(open.ok, true);
  assert.equal(open.c.deed, true);
  assert.equal(C.valid(open.c), true);
  assert.equal(C.openDeed(open.c, flags).ok, false, 'a deed is opened once');
});

test('a fresh Annex room is legal and a reset rebuilds it from nothing while the deed and settings stay', () => {
  const C = load(), c = { ...C.openDeed(C.fresh(), flags).c, policy: 'push', alloc: 50, reserve: 20 };
  const grown = { ...c, room: C.buy(c.room, { k: 'typist', b: 0 }) };
  assert.equal(grown.room.bands[0].typists, 2);
  const again = C.afterReset(grown);
  assert.equal(again.room.bands[0].typists, 1, 'the room is rebuilt, not carried over');
  assert.deepEqual([again.deed, again.policy, again.alloc, again.reserve, again.rooms], [true, 'push', 50, 20, 1]);
  assert.equal(C.afterReset(C.fresh()).deed, false, 'no deed, nothing to rebuild');
  assert.equal(C.valid(again), true);
});

test('the rate model is deterministic and bounded by its catalog, its keepers and its sale cadence', () => {
  const C = load(), room = C.newRoom();
  const a = C.advance(room, 600, ctx()), b = C.advance(room, 600, ctx());
  assert.deepEqual(plain(a), plain(b), 'the same inputs give the same room');
  assert.ok(a.income > 0 && a.room.sold[0] > 0);
  // the catalog is finite: a tiny catalog caps the sales however long it runs
  const small = C.advance({ ...C.newRoom(), bands: C.newRoom().bands.map((x, i) => i === 0 ? { on: true, typists: 6, keeper: 6 } : x) }, 3600, ctx({ catalog: [5, 5, 5, 5, 5, 5] }));
  assert.equal(small.room.sold[0], 5);
  assert.equal(small.room.last.blocked, 'catalog');
  // the sale cadence caps total sales per second across every band
  const rich = { ...C.newRoom(), bands: C.newRoom().bands.map(x => ({ on: true, typists: 6, keeper: 6 })) };
  const run = C.advance(rich, 600, ctx({ pawBase: [.05, .05, .05, .05, .05, .05], keeperBase: [.01, .01, .01, .01, .01, .01], catalog: [999, 999, 999, 999, 999, 999] }));
  const sold = run.room.sold.reduce((x, y) => x + y, 0);
  assert.ok(sold <= 600 * C.SALE_RATE + 3, `sold ${sold}, at most one every six seconds`);
  // slower than the work: leftover seconds are reported, never silently dropped
  const wide = ctx({ catalog: [9999, 9999, 9999, 9999, 9999, 9999] });
  const long = C.advance(room, 100000, wide);
  assert.equal(long.left, 100000 - C.MAX_CHUNKS * C.CHUNK);
  const cont = C.advance(long.room, long.left, wide);
  assert.ok(cont.income > 0, 'the remainder can be carried forward');
});

test('income never goes negative or invents titles: sold plus waiting never exceeds the catalog', () => {
  const C = load();
  for (const typists of [1, 3, 6]) {
    const r = C.advance({ ...C.newRoom(), bands: C.newRoom().bands.map((x, i) => i < 2 ? { on: true, typists, keeper: 2 } : x) }, 1800, ctx({ catalog: [12, 7, 1, 1, 1, 1] }));
    r.room.sold.forEach((n, i) => assert.ok(n + r.room.wip[i] <= [12, 7, 1, 1, 1, 1][i] + 1e-9, `band ${i}`));
    assert.ok(r.income >= 0 && r.room.earned >= 0);
  }
});

test('policies buy in their own order and stop at the first thing they cannot afford', () => {
  const C = load(), c = ctx(), room = C.newRoom();
  assert.equal(C.next(room, 'farm', c).step.k, 'typist', 'farm tops up the crew first');
  assert.equal(C.next(room, 'push', c).step.k, 'band', 'push opens the next machine first');
  let r = room;
  for (let n = 0; n < 2; n++) r = C.buy(r, { k: 'typist', b: 0 });
  assert.equal(r.bands[0].typists, 3);
  assert.equal(C.next(r, 'farm', c).step.k, 'keeper');
  r = C.buy(r, { k: 'keeper', b: 0 });
  const n = C.next(r, 'farm', c);
  assert.deepEqual([n.step.k, n.step.b], ['band', 1]);
  assert.equal(n.cost, C.bandCost(c.price[1]));
  assert.match(n.name, /Hibiscus/);
  // fully built means nothing left to buy
  const full = { ...C.newRoom(), bands: C.newRoom().bands.map(() => ({ on: true, typists: 6, keeper: 6 })) };
  assert.equal(C.next(full, 'farm', c), null);
  // prices climb with what is already owned
  assert.ok(C.typistCost(75000, 3) > C.typistCost(75000, 2));
  assert.ok(C.keeperCost(75000, 3) > C.keeperCost(75000, 2));
});

test('the Annex summary and settings validate strictly', () => {
  const C = load(), c = C.openDeed(C.fresh(), flags).c;
  assert.deepEqual(plain(C.summary(c.room)), { bands: 1, typists: 1, keepers: 0, sold: 0, earned: 0 });
  for (const bad of [{ ...c, v: 2 }, { ...c, policy: 'chaos' }, { ...c, alloc: 7 }, { ...c, reserve: 60 }, { ...c, deed: false }, { ...c, room: { ...c.room, bands: c.room.bands.slice(1) } },
    { ...c, room: { ...c.room, bands: c.room.bands.map((b, i) => i === 0 ? { ...b, on: false } : b) } }, { ...c, room: { ...c.room, sold: [-1, 0, 0, 0, 0, 0] } }, null, []])
    assert.equal(C.valid(bad), false, JSON.stringify(bad).slice(0, 80));
  assert.equal(C.valid(undefined), true);
  assert.equal(C.valid(C.fresh()), true);
});

test('every price is a whole number of the banana denomination, so the wallet stays representable', () => {
  const C = load(), c = ctx({ round: n => Math.round(n / 25) * 25 });
  let room = C.newRoom();
  for (let n = 0; n < 40; n++) {
    const plan = C.next(room, n % 2 ? 'push' : 'farm', c);
    if (!plan) break;
    assert.equal(plan.cost % 25, 0, `${plan.name} costs ${plan.cost}`);
    room = C.buy(room, plan.step);
  }
  assert.ok(C.next(C.newRoom(), 'farm', ctx()).cost > 0);
});
