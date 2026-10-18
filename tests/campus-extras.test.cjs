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
const open = { estate: 1, autoCycles: 10, restored: 1, mastery: 1 };
const studioFlags = { estate: 2, annexRooms: 5, autoCycles: 25 };
function withStudio(C) {
  let c = C.openDeed(C.fresh(), open).c;
  c = { ...c, rooms: 5 };
  return C.openStudio(c, studioFlags).c;
}

test('the Studio opens only after the Annex, two Estates, five Annex rebuilds and 25 Foreman Printings', () => {
  const C = load(), annexOnly = C.fresh();
  assert.match(C.openStudio(annexOnly, studioFlags).why, /Annex first/);
  const c = { ...C.openDeed(annexOnly, open).c, rooms: 5 };
  for (const missing of [{ ...studioFlags, estate: 1 }, { ...studioFlags, annexRooms: 4 }, { ...studioFlags, autoCycles: 24 }]) {
    const r = C.openStudio(c, missing);
    assert.equal(r.ok, false); assert.match(r.why, /milestones/);
  }
  const ms = C.studioMilestones({ estate: 2, annexRooms: 2, autoCycles: 30 });
  assert.deepEqual(plain(ms.rows.map(r => r.done)), [true, false, true]); assert.equal(ms.open, false);
  const done = C.openStudio(c, studioFlags);
  assert.equal(done.ok, true); assert.equal(C.valid(done.c), true);
  assert.equal(C.openStudio(done.c, studioFlags).ok, false, 'the Studio is opened once');
  assert.deepEqual(plain(C.active(done.c)), ['annex', 'studio']);
});

test('the Studio is a precision building: fewer titles, better paid, sold more slowly than the Annex', () => {
  const C = load(), c = withStudio(C), base = ctx();
  const a = C.contextFor('annex', base), s = C.contextFor('studio', base);
  assert.equal(a.avgPay[0], 100); assert.equal(s.avgPay[0], 150);
  assert.equal(s.catalog[0], 8); assert.equal(a.catalog[0], 40);
  assert.ok(s.saleRate < a.saleRate);
  // same machines, same time: the Annex sells more titles, the Studio earns more per title
  const room = { ...C.newRoom(), bands: C.newRoom().bands.map((b, i) => i === 0 ? { on: true, typists: 6, keeper: 3 } : b) };
  const ra = C.advance(room, 600, a), rs = C.advance(room, 600, s);
  const soldA = ra.room.sold[0], soldS = rs.room.sold[0];
  assert.ok(soldA > soldS, `the Annex sells more titles (${soldA} vs ${soldS})`);
  assert.ok(soldS <= 8, 'the Studio can never sell past its small catalog');
  assert.ok(rs.income / Math.max(1, soldS) > ra.income / Math.max(1, soldA), 'each Studio title pays more');
  assert.ok(Math.abs(C.advance(room, 300, ctx()).income - C.advance(room, 300, C.contextFor('annex', ctx())).income) < 1e-9, 'the Annex rate model is unchanged');
  assert.equal(c.studio.rooms, 0);
});

test('every reset rebuilds both buildings from nothing while deeds, settings and ledgers stay', () => {
  const C = load();
  let c = withStudio(C);
  c = C.withBuilding(c, 'studio', { policy: 'push', alloc: 40, banked: 99, room: { ...c.studio.room, earned: 500 } });
  const after = C.afterReset(c);
  assert.equal(after.studio.room.earned, 0); assert.equal(after.room.earned, 0);
  assert.equal(after.studio.policy, 'push'); assert.equal(after.studio.alloc, 40); assert.equal(after.studio.banked, 99);
  assert.equal(after.studio.rooms, 1); assert.equal(after.rooms, c.rooms + 1);
  assert.equal(C.valid(after), true);
  assert.equal(C.afterReset(C.fresh()).deed, false, 'no deed, nothing to rebuild');
});

test('policy scheduling pushes until the chosen number of machines is open, then follows the saved policy', () => {
  const C = load(); let c = C.openDeed(C.fresh(), open).c;
  assert.equal(C.schedulingOpen(c), false, 'it opens after three Annex rebuilds');
  c = { ...c, rooms: 3 }; assert.equal(C.schedulingOpen(c), true);
  assert.equal(C.policyOf(c), 'farm', 'off means off');
  c = { ...c, sched: { on: true, until: 3 } };
  assert.equal(C.policyOf(c), 'push', 'one machine open, fewer than three');
  const grown = { ...c, room: { ...c.room, bands: c.room.bands.map((b, i) => i < 3 ? { ...b, on: true } : b) } };
  assert.equal(C.policyOf(grown), 'farm', 'three machines open: back to the saved policy');
  assert.equal(C.valid(c), true);
  assert.equal(C.valid({ ...c, sched: { on: true, until: 0 } }), false);
  assert.equal(C.valid({ ...c, sched: { on: 'yes', until: 3 } }), false);
});

test('a staff transfer moves one typist between the buildings, never changes the head count, and never leaves a band without its first typist', () => {
  const C = load(); let c = withStudio(C);
  const total = k => C.view(c, k).room.bands.reduce((a, b) => a + b.typists, 0);
  const open2 = (k, n) => { const b = C.view(c, k); c = C.withBuilding(c, k, { room: { ...b.room, bands: b.room.bands.map((x, i) => i < n ? { ...x, on: true, typists: 3 } : x) } }); };
  open2('annex', 2); open2('studio', 2);
  const before = total('annex') + total('studio');
  assert.equal(C.movable(c, 'annex', 'studio'), 1, 'the highest shared band goes first');
  const m = C.move(c, 'annex', 'studio');
  assert.equal(m.ok, true); assert.equal(m.band, 1);
  c = m.c;
  assert.equal(total('annex') + total('studio'), before, 'head count is conserved');
  assert.equal(C.view(c, 'studio').room.bands[1].typists, 4); assert.equal(C.view(c, 'annex').room.bands[1].typists, 2);
  assert.equal(c.moved, 1); assert.equal(C.valid(c), true);
  // drain the Annex's band 1 and band 0 down to its last typist
  for (let i = 0; i < 20; i++) { const r = C.move(c, 'annex', 'studio'); if (!r.ok) break; c = r.c; }
  assert.equal(C.view(c, 'annex').room.bands[0].typists, 1, 'the first machine keeps its last typist');
  assert.equal(C.view(c, 'annex').room.bands[1].typists, 0);
  assert.ok(C.view(c, 'studio').room.bands.every(b => b.typists <= C.MAX_TYPISTS));
  assert.equal(C.move(c, 'annex', 'annex').ok, false, 'a building cannot move staff to itself');
  assert.equal(C.move(C.fresh(), 'annex', 'studio').ok, false);
  assert.equal(total('annex') + total('studio'), before);
});

test('records from before the Studio still load and rebuild', () => {
  const C = load();
  const old = plain(C.openDeed(C.fresh(), open).c); delete old.studio; delete old.sched; delete old.moved;
  assert.equal(C.valid(old), true);
  const after = C.afterReset(old);
  assert.equal(after.rooms, 1); assert.equal(C.valid(after), true);
  assert.equal(C.holding(old), false);
  assert.equal(C.holding({ ...old, hold: true }), true);
});

test('a room that has run for fractional seconds is still a valid record, so settings save and the game reloads', () => {
  const C = load(); let c = C.openDeed(C.fresh(), open).c;
  const run = C.advance(c.room, 7.3, ctx());
  assert.ok(!Number.isInteger(run.room.t), 'live ticks add fractional time');
  c = { ...c, room: run.room };
  assert.equal(C.validRoom(run.room), true);
  assert.equal(C.valid(c), true);
  assert.equal(C.valid({ ...c, room: { ...run.room, t: -1 } }), false, 'time never runs backwards');
  assert.equal(C.valid({ ...c, room: { ...run.room, t: NaN } }), false);
});
