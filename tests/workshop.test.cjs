const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function load() {
  const context = {}; context.window = context;
  vm.runInNewContext(readFileSync(path.join(__dirname, '..', 'workshop.js'), 'utf8'), context);
  return context.Workshop;
}
const plain = x => JSON.parse(JSON.stringify(x));
const ctx = (over = {}) => ({ printing: 2, ref: 1000, fundable: 10000, challenge: false, round: n => Math.round(n / 25) * 25, ...over });
const T0 = 1_000_000_000_000;

function sendAndReturn(W, w, route, now = T0) {
  const r = W.launch(w, route, ctx(), now);
  assert.equal(r.ok, true, r.why);
  return W.advance(r.w, now + W.ROUTES[route].seconds * 1000).exp ? W.advance(r.w, now + W.ROUTES[route].seconds * 1000) : r.w;
}

test('a fresh record is valid and the tab unlocks at Printing 2 or once anything exists', () => {
  const W = load(), w = W.fresh();
  assert.equal(W.valid(w), true);
  assert.equal(W.valid(undefined), true);
  assert.equal(W.unlocked(w, 1), false);
  assert.equal(W.unlocked(w, 2), true);
  assert.equal(W.unlocked({ ...w, parts: 1 }, 0), true, 'earned Parts are never hidden again');
});

test('a route is quoted before launch with its cost, time and exact rewards, and every refusal says why', () => {
  const W = load(), w = W.fresh();
  const s = W.quote(w, 'salvage', ctx()), m = W.quote(w, 'manuscript', ctx());
  assert.deepEqual([s.ok, s.cost, s.seconds, s.parts, s.lead], [true, 200, 900, 8, null]);
  assert.deepEqual([m.ok, m.cost, m.seconds, m.parts, m.lead.id], [true, 300, 1800, 3, 'anthology']);
  assert.match(W.quote(w, 'salvage', ctx({ printing: 1 })).why, /Unlocks at Printing 2/);
  assert.match(W.quote(w, 'salvage', ctx({ fundable: 199 })).why, /earned this room/);
  assert.match(W.quote(w, 'salvage', ctx({ challenge: true })).why, /challenge/);
  assert.match(W.quote(w, 'salvage', ctx({ ref: 0 })).why, /No machine/);
  const out = W.launch(w, 'salvage', ctx(), T0).w;
  assert.match(W.quote(out, 'manuscript', ctx()).why, /One expedition at a time/);
});

test('departure commits once under a unique id, and the first trip pays for a whole attachment', () => {
  const W = load();
  let w = W.launch(W.fresh(), 'salvage', ctx(), T0).w;
  assert.equal(w.exp.id, 'x1');
  assert.equal(W.valid(w), true);
  w = W.advance(w, T0 + 900_000);
  assert.equal(w.exp.state, 'returned');
  const c = W.claim(w);
  assert.equal(c.ok, true);
  assert.equal(c.w.parts, 8);
  assert.ok(c.w.parts >= W.RECIPES.carriage.parts, 'one meaningful configuration from one trip');
  assert.equal(c.w.exp, null);
  assert.equal(W.claim(c.w).ok, false, 'a reward is paid exactly once');
  assert.equal(W.launch(c.w, 'salvage', ctx(), T0 + 901_000).w.exp.id, 'x2', 'the next trip gets a new id');
});

test('the clock only moves forward: closing the app counts, a clock set back adds nothing and never subtracts', () => {
  const W = load();
  const w = W.launch(W.fresh(), 'manuscript', ctx(), T0).w;
  let n = W.advance(w, T0 + 600_000);
  assert.equal(n.exp.elapsed, 600);
  assert.equal(n.exp.state, 'away');
  const back = W.advance(n, T0 + 100_000);
  assert.equal(back.exp.elapsed, 600, 'a clock set back changes nothing');
  assert.equal(back.clock.last, T0 + 100_000, 'and counting restarts from the new time');
  const again = W.advance(back, T0 + 160_000);
  assert.equal(again.exp.elapsed, 660);
  const long = W.advance(again, T0 + 99 * 3600_000);
  assert.equal(long.exp.elapsed, long.exp.need, 'a long absence completes it once, capped at its length');
  assert.equal(W.advance(long, T0 + 200 * 3600_000), long, 'a returned expedition does not tick further');
  assert.equal(W.valid(long), true);
});

test('calling it back after departure returns only the unspent share once and forfeits the reward', () => {
  const W = load();
  const w = W.advance(W.launch(W.fresh(), 'salvage', ctx(), T0).w, T0 + 450_000);
  const c = W.cancel(w, n => Math.floor(n / 25) * 25);
  assert.equal(c.ok, true);
  assert.equal(c.refund, 100, 'half the time left, half the bananas back');
  assert.equal(c.lost, 100, 'the consumed share is disclosed');
  assert.equal(c.w.exp, null);
  assert.equal(c.w.parts, 0);
  assert.equal(W.cancel(c.w).ok, false, 'there is nothing left to refund twice');
  const done = W.advance(W.launch(W.fresh(), 'salvage', ctx(), T0).w, T0 + 900_000);
  assert.equal(W.cancel(done).ok, false, 'a returned expedition is collected, not cancelled');
});

test('manuscript leads are deterministic, never repeat, and duplicates pay a bounded bonus instead of a farm', () => {
  const W = load();
  let w = W.fresh();
  const got = [];
  for (let n = 0; n < 5; n++) {
    const c = W.claim(sendAndReturn(W, w, 'manuscript', T0 + n * 5_000_000));
    assert.equal(c.ok, true);
    w = c.w; got.push([c.lead, c.parts, c.dup]);
  }
  assert.deepEqual(got, [['anthology', 3, false], ['almanac', 3, false], ['atlas', 3, false], [null, 3 + W.DUPLICATE_PARTS, true], [null, 3 + W.DUPLICATE_PARTS, true]]);
  assert.deepEqual(plain(w.leads), ['anthology', 'almanac', 'atlas']);
  assert.equal(w.dupes, 2);
  assert.equal(W.quote(w, 'manuscript', ctx()).dupParts, W.DUPLICATE_PARTS);
  assert.equal(W.valid(w), true);
  assert.ok(w.history.length <= 40);
});

test('crafting spends Parts once, deterministically, and refuses without them', () => {
  const W = load();
  let w = { ...W.fresh(), parts: 14 };
  assert.match(W.craft({ ...w, parts: 9 }, 'press').why, /Needs 10 Parts/);
  const a = W.craft(w, 'carriage');
  assert.equal(a.w.parts, 8);
  const b = W.craft(a.w, 'tray');
  assert.equal(b.w.parts, 0);
  assert.deepEqual(plain(b.w.attachments.map(x => x.type)), ['carriage', 'tray']);
  assert.notEqual(b.w.attachments[0].id, b.w.attachments[1].id);
  assert.equal(W.craft(w, 'nope').ok, false);
});

test('an attachment lives in exactly one machine; moving it unequips the old one in the same step', () => {
  const W = load();
  let w = { ...W.fresh(), parts: 16 };
  w = W.craft(W.craft(w, 'carriage').w, 'tray').w;
  const [c, t] = w.attachments.map(a => a.id);
  w = W.equip(w, c, 1).w;
  assert.equal(W.typeAt(w, 1), 'carriage');
  w = W.equip(w, c, 3).w;
  assert.equal(W.typeAt(w, 1), undefined, 'it left the first machine');
  assert.equal(W.typeAt(w, 3), 'carriage');
  w = W.equip(w, t, 3).w;
  assert.equal(W.typeAt(w, 3), 'tray', 'a machine holds one attachment');
  assert.equal(Object.values(w.equipped).filter(id => id === c).length, 0, 'the displaced one is back on the bench, not duplicated');
  assert.equal(W.valid(w), true);
  assert.equal(W.equip(w, 'ghost', 1).ok, false);
  assert.equal(W.equip(w, t, 9).ok, false);
  assert.equal(W.valid({ ...w, equipped: { 1: t, 2: t } }), false, 'a duplicated placement is refused on load');
  assert.equal(W.unequip(w, 3).w.equipped[3], undefined);
});

test('effects are distinct and bounded: carriage speeds typing, tray doubles banking, press only helps reissued titles', () => {
  const W = load();
  let w = { ...W.fresh(), parts: 24 };
  for (const k of ['carriage', 'tray', 'press']) w = W.craft(w, k).w;
  const [c, t, p] = w.attachments.map(a => a.id);
  w = W.equip(W.equip(W.equip(w, c, 0).w, t, 1).w, p, 2).w;
  assert.deepEqual([W.carriage(w, 0), W.carriage(w, 1), W.carriage(w, 5)], [1.5, 1, 1]);
  assert.deepEqual([W.tray(w, 1), W.tray(w, 0)], [true, false]);
  assert.deepEqual([W.press(w, 2, 1), W.press(w, 2, 0), W.press(w, 1, 4)], [1.3, 1, 1], 'a first edition and other machines are unchanged');
  assert.deepEqual([W.carriage(undefined, 0), W.tray(undefined, 0), W.press(undefined, 0, 3)], [1, false, 1], 'no record, no effect');
});

test('loading refuses anything that could duplicate or invent rewards', () => {
  const W = load(), ok = { ...W.fresh(), parts: 3 };
  assert.equal(W.valid(ok), true);
  for (const bad of [{ ...ok, v: 2 }, { ...ok, parts: -1 }, { ...ok, parts: 1.5 }, { ...ok, leads: ['anthology', 'anthology'] }, { ...ok, leads: ['made-up'] },
    { ...ok, attachments: [{ id: 'a1', type: 'carriage' }, { id: 'a1', type: 'tray' }] }, { ...ok, attachments: [{ id: 'a1', type: 'laser' }] },
    { ...ok, exp: { id: 'x1', route: 'salvage', cost: 10, need: 900, elapsed: 901, state: 'away' } },
    { ...ok, exp: { id: 'x1', route: 'salvage', cost: 10, need: 900, elapsed: 900, state: 'away' } },
    { ...ok, exp: { id: 'x1', route: 'teleport', cost: 10, need: 900, elapsed: 0, state: 'away' } }, null, []])
    assert.equal(W.valid(bad), false, JSON.stringify(bad));
});
