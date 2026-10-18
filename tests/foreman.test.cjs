const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function load() {
  const context = {}; context.window = context;
  vm.runInNewContext(readFileSync(path.join(__dirname, '..', 'foreman.js'), 'utf8'), context);
  return context.Foreman;
}
const plain = x => JSON.parse(JSON.stringify(x));
const desk = i => ({ k: 'desk', i }), sb = (key, to) => ({ k: 'sb', key, to }), pub = to => ({ k: 'pub', to });

// a tiny world: owned items and prices, enough to drive the planner
function world(owned = [], prices = {}, balance = 0) {
  const key = e => JSON.stringify(e), has = new Set(owned.map(key));
  return { balance, has: e => has.has(key(e)), prereq: e => (e.k === 'desk' && e.i > 1 && !has.has(key(desk(e.i - 1))) ? desk(e.i - 1) : null),
    cost: e => prices[key(e)] ?? null, why: e => `blocked ${key(e)}`, name: e => key(e) };
}
const both = { buyer: true, blueprint: true };

test('shop gates follow the plan: Ledger at Printing 2, buyers need the Ledger, Foreman needs both buyers and a hand-pressed Printing', () => {
  const f = load();
  assert.equal(f.locked('ledger', {}, 1), 'Unlocks at Printing 2');
  assert.equal(f.locked('ledger', {}, 2), '');
  assert.equal(f.locked('buyer', {}, 2), 'Needs Rebuild Ledger');
  assert.equal(f.locked('buyer', { ledger: 1 }, 2), '');
  assert.equal(f.locked('blueprint', { ledger: 1 }, 2), '');
  assert.equal(f.locked('foreman', { ledger: 1, buyer: 1, blueprint: 1 }, 2), 'Unlocks at Printing 3');
  assert.equal(f.locked('foreman', { ledger: 1, buyer: 1 }, 3), 'Needs Machine Buyer and Publisher Blueprint');
  assert.equal(f.locked('foreman', { ledger: 1, buyer: 1, blueprint: 1 }, 3, { manual: false }), 'Needs one Printing pressed by hand');
  assert.equal(f.locked('foreman', { ledger: 1, buyer: 1, blueprint: 1 }, 3, { manual: true }), '');
  assert.equal(f.locked('seed', {}, 9), null, 'other upgrades are not its business');
});

test('settings validate strictly; anything unknown is refused rather than guessed', () => {
  const f = load();
  assert.equal(f.valid(undefined), true);
  assert.equal(f.valid({ ...f.defaults }), true);
  for (const bad of [{ ...f.defaults, v: 2 }, { ...f.defaults, policy: 'rush' }, { ...f.defaults, reserve: 7 }, { ...f.defaults, reserve: 55 }, { ...f.defaults, target: 0 },
    { ...f.defaults, order: [{ k: 'desk', i: 9 }] }, { ...f.defaults, order: [{ k: 'sb', key: 'nope', to: 1 }] }, { ...f.defaults, bp: { rule: 'any', on: true, tier: 9 } }, null, []])
    assert.equal(f.valid(bad), false, JSON.stringify(bad));
  assert.equal(f.valid({ ...f.defaults, order: [desk(1), pub(1), sb('drive', 2)], bp: { rule: 'fair', on: true, tier: 2 } }), true);
  assert.equal(f.valid({ ...f.defaults, policy: 'explore', route: 'manuscript' }), true);
  assert.equal(f.valid({ ...f.defaults, route: 'teleport' }), false);
});

test('the planner follows the saved order, buys prerequisites first, and stops at the first thing it cannot afford', () => {
  const f = load();
  const order = [desk(2), sb('drive', 1), pub(1)];
  const prices = { [JSON.stringify(desk(1))]: 100, [JSON.stringify(desk(2))]: 300, [JSON.stringify(sb('drive', 1))]: 10 };
  let r = f.plan(order, world([], prices, 1000), { policy: 'fast', reserve: 0, owned: both });
  assert.deepEqual(plain(r.action), desk(1), 'the earlier desk is a prerequisite and comes first');
  r = f.plan(order, world([desk(1)], prices, 1000), { policy: 'fast', reserve: 0, owned: both });
  assert.deepEqual(plain(r.action), desk(2));
  r = f.plan(order, world([desk(1)], prices, 200), { policy: 'fast', reserve: 0, owned: both });
  assert.equal(r.action, null);
  assert.match(r.wait, /Saving for/, 'it waits instead of letting a cheaper later item jump ahead');
  r = f.plan(order, world([desk(1), desk(2)], prices, 1000), { policy: 'fast', reserve: 0, owned: both });
  assert.deepEqual(plain(r.action), sb('drive', 1));
});

test('the reserve is kept back, owners gate each class, frontier buys only machines, blocked steps are explained', () => {
  const f = load();
  const prices = { [JSON.stringify(desk(1))]: 100, [JSON.stringify(sb('drive', 1))]: 10 };
  const order = [desk(1), sb('drive', 1)];
  assert.equal(f.plan(order, world([], prices, 110), { policy: 'fast', reserve: 10, owned: both }).action, null, '110 with 10% kept leaves 99, short of 100');
  assert.deepEqual(plain(f.plan(order, world([], prices, 112), { policy: 'fast', reserve: 10, owned: both }).action), desk(1));
  assert.equal(f.plan(order, world([desk(1)], prices, 1000), { policy: 'fast', reserve: 0, owned: { buyer: false, blueprint: true } }).action, null, 'no Machine Buyer, no machine purchases');
  assert.equal(f.plan(order, world([desk(1)], prices, 1000), { policy: 'frontier', reserve: 0, owned: both }).action, null, 'frontier skips upgrades');
  const noPrice = f.plan([pub(1)], world([], {}, 1000), { policy: 'fast', reserve: 0, owned: both });
  assert.equal(noPrice.action, null);
  assert.match(noPrice.wait, /blocked/);
  assert.equal(f.plan([], world(), { policy: 'fast', reserve: 0, owned: both }).wait, 'Nothing left to buy');
});

test('the reset rule needs the target in stars and a short interval of real production, and frontier never resets', () => {
  const f = load(), on = { ...f.defaults, enabled: true };
  assert.equal(f.due({ ...on, enabled: false }, 50, 999).due, false);
  assert.equal(f.due({ ...on, policy: 'frontier' }, 50, 999).due, false);
  assert.equal(f.due({ ...on, policy: 'explore' }, 50, 999).due, false, 'exploring never presses Printing either');
  assert.equal(f.due(on, 0, 999).due, false);
  assert.equal(f.due({ ...on, target: 20 }, 19, 999).due, false);
  assert.match(f.due({ ...on, target: 20 }, 19, 999).why, /19 now/);
  assert.equal(f.due(on, 10, 29).due, false, 'the 30 second accounting interval is not skippable');
  assert.equal(f.due(on, 10, 30).due, true);
});

test('a frozen decision must still match the settings and the quote after a reload', () => {
  const f = load(), set = { ...f.defaults, enabled: true, target: 10 }, quote = { gain: 12, earned: 99 };
  const d = f.decision(set, quote);
  assert.equal(f.validDecision(d, set, { foreman: 1 }, quote), true);
  assert.equal(f.validDecision(d, set, {}, quote), false, 'needs the upgrade');
  assert.equal(f.validDecision(d, { ...set, enabled: false }, { foreman: 1 }, quote), false, 'Off means off');
  assert.equal(f.validDecision(d, { ...set, target: 15 }, { foreman: 1 }, quote), false, 'changed settings go stale');
  assert.equal(f.validDecision(d, set, { foreman: 1 }, { gain: 13, earned: 99 }), false, 'a different quote goes stale');
  assert.equal(f.validDecision({ ...d, gain: 5 }, set, { foreman: 1 }, { gain: 5, earned: 99 }), false, 'below the target');
});

test('the next room inherits the run as the saved order, remembers the publisher, and records hand-pressed Printings', () => {
  const f = load(), set = { ...f.defaults, order: [desk(1)] };
  const run = [desk(1), desk(2), pub(1), sb('drive', 1)];
  let n = f.next(set, { ledger: 1, blueprint: 1 }, run, { tier: 2, rule: 'fair', on: true }, 'manual');
  assert.deepEqual(plain(n.order), run);
  assert.deepEqual(plain(n.bp), { rule: 'fair', on: true, tier: 2 });
  assert.equal(n.manual, true);
  n = f.next(set, { ledger: 1 }, [desk(1)], { tier: 1, rule: 'any', on: true }, 'foreman');
  assert.deepEqual(plain(n.order), [desk(1)], 'a run that bought almost nothing keeps the saved order');
  assert.equal(n.bp, null, 'no Blueprint, nothing remembered');
  assert.equal(n.manual, false, 'a Foreman Printing is not a hand-pressed one');
  n = f.next(set, {}, run, null, 'manual');
  assert.deepEqual(plain(n.order), [desk(1)], 'no Ledger, no change of order');
});

test('the Blueprint restores only the first rank, only when the room has none, and only after one was remembered', () => {
  const f = load(), set = { ...f.defaults, bp: { rule: 'hot', on: false, tier: 3 } };
  assert.deepEqual(plain(f.restore(set, { blueprint: 1 }, { tier: 0 })), { tier: 1, on: false, rule: 'hot' });
  assert.equal(f.restore(set, { blueprint: 1 }, { tier: 1 }), null);
  assert.equal(f.restore(set, {}, { tier: 0 }), null);
  assert.equal(f.restore({ ...f.defaults }, { blueprint: 1 }, { tier: 0 }), null);
  assert.equal(f.record(Array.from({ length: 120 }, () => desk(1)), desk(2)).length, 120, 'the record is capped');
});

test('queued goals: each Foreman Printing takes the next saved star target, other origins leave the queue alone', () => {
  const f = load();
  const base = { ...f.defaults, enabled: true, target: 10, queue: [20, 35] };
  assert.equal(f.valid(base), true);
  assert.equal(f.valid({ ...base, queue: [0] }), false, 'a goal must be at least one star');
  assert.equal(f.valid({ ...base, queue: [1, 2, 3, 4, 5, 6] }), false, 'at most five queued goals');
  assert.equal(f.valid({ ...base, queue: [1.5] }), false);
  assert.equal(f.valid({ ...base, genre: 'yes' }), false);
  let n = f.next(base, {}, [], null, 'foreman', { sec: 400, gain: 10 });
  assert.equal(n.target, 20); assert.deepEqual(plain(n.queue), [35]);
  n = f.next(n, {}, [], null, 'foreman', { sec: 400, gain: 20 });
  assert.equal(n.target, 35); assert.deepEqual(plain(n.queue), []);
  n = f.next(n, {}, [], null, 'foreman', { sec: 400, gain: 35 });
  assert.equal(n.target, 35, 'the last target stays once the queue is empty');
  const manual = f.next(base, {}, [], null, 'manual');
  assert.equal(manual.target, 10); assert.deepEqual(plain(manual.queue), [20, 35]);
});

test('queue add follows the last goal by ten, stops at five, and drop removes one entry', () => {
  const f = load();
  let s = { ...f.defaults, target: 10 };
  for (let i = 0; i < 7; i++) s = f.queueAdd(s);
  assert.deepEqual(plain(s.queue), [20, 30, 40, 50, 60]);
  s = f.queueDrop(s, 1);
  assert.deepEqual(plain(s.queue), [20, 40, 50, 60]);
  assert.equal(f.queueDrop(s, 9), s, 'an index out of range changes nothing');
  assert.equal(f.valid(s), true);
});
