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
const on = F => ({ ...F.defaults, enabled: true });

test('the rolling estimator needs 45 seconds of samples, reads the last minute, and is never negative', () => {
  const F = load();
  assert.equal(F.recentRate([]), null);
  assert.equal(F.recentRate([[0, 0]]), null);
  assert.equal(F.recentRate([[0, 0], [30, 10]]), null, 'too short a span');
  assert.equal(F.recentRate([[0, 0], [60, 30]]), .5);
  // only the last minute counts: an early burst does not hide a slowdown
  const samples = [[0, 0], [10, 100], [20, 100], [30, 100], [40, 100], [50, 100], [60, 100], [70, 101], [80, 102], [90, 103], [100, 104]];
  assert.ok(F.recentRate(samples) < .1);
  assert.equal(F.recentRate([[0, 50], [60, 40]]), 0, 'a drop in pending stars is not a negative rate');
  assert.equal(F.recentRate('nope'), null);
});

test('the typical pace is the median of the last five Printings, and needs all five', () => {
  const F = load();
  assert.equal(F.typicalRate({ cycles: [{ sec: 100, gain: 10 }] }), 0);
  const cycles = [100, 100, 10, 200, 100].map(sec => ({ sec, gain: 10 }));
  assert.equal(F.typicalRate({ cycles }), .1, 'the median ignores the fast and slow outliers');
});

test('rate mode waits while the room is producing well and presses once the pace has fallen, never before the target or interval', () => {
  const F = load(), set = { ...on(F), mode: 'rate' }, typical = .1;
  assert.equal(F.due(set, 12, 200, false, { recent: .09, typical }).due, false, 'still producing well');
  assert.match(F.due(set, 12, 200, false, { recent: .09, typical }).why, /producing well/);
  assert.equal(F.due(set, 12, 200, false, { recent: .04, typical }).due, true, 'under half the usual pace');
  assert.equal(F.due(set, 9, 200, false, { recent: 0, typical }).due, false, 'the star target still applies');
  assert.equal(F.due(set, 12, 20, false, { recent: 0, typical }).due, false, 'and the settling interval');
  assert.equal(F.due(set, 12, 200, false, { recent: null, typical }).due, true, 'no estimate yet: behaves like a plain target');
  assert.equal(F.due(set, 12, 200, false, { recent: 0, typical: 0 }).due, true, 'no history: behaves like a plain target');
  assert.equal(F.due(set, 12, 200, true, { recent: 0, typical }).due, false, 'a hold still wins');
  assert.equal(F.due({ ...on(F), mode: 'target' }, 12, 200, false, { recent: .09, typical }).due, true, 'target mode ignores the pace');
});

test('the combined condition adds a minimum interval above the 30 second floor', () => {
  const F = load(), set = { ...on(F), minSecs: 120 };
  assert.equal(F.due(set, 50, 90).due, false);
  assert.match(F.due(set, 50, 90).why, /30s/);
  assert.equal(F.due(set, 50, 120).due, true);
  assert.equal(F.due({ ...on(F), minSecs: 5 }, 50, 29).due, false, 'never under the floor');
});

test('two loadouts save and restore the panel without touching the saved order or the record of cycles', () => {
  const F = load(), base = { ...on(F), policy: 'frontier', target: 40, reserve: 20, route: 'manuscript', minSecs: 90, mode: 'rate', order: [{ k: 'desk', i: 1 }], autoCycles: 7 };
  const saved = F.saveLoadout(base, 0);
  assert.deepEqual(plain(saved.loadouts[0]), { policy: 'frontier', target: 40, reserve: 20, route: 'manuscript', minSecs: 90, mode: 'rate' });
  assert.equal(saved.loadouts[1], null);
  assert.equal(F.valid(saved), true);
  const changed = { ...saved, policy: 'fast', target: 10, reserve: 0, mode: 'target' };
  const back = F.applyLoadout(changed, 0);
  assert.deepEqual([back.policy, back.target, back.reserve, back.mode, back.minSecs], ['frontier', 40, 20, 'rate', 90]);
  assert.deepEqual(plain(back.order), plain(base.order));
  assert.equal(back.autoCycles, 7);
  assert.equal(F.applyLoadout(changed, 1), changed, 'an empty slot changes nothing');
  assert.equal(F.saveLoadout(base, 5), base, 'only two slots');
  const twice = F.saveLoadout(F.saveLoadout(base, 0), 1);
  assert.notEqual(twice.loadouts[0], null);
  assert.notEqual(twice.loadouts[1], null);
});

test('settings validate with the new fields and still load without them', () => {
  const F = load(), old = plain(F.defaults);
  for (const k of ['minSecs', 'mode', 'loadouts']) delete old[k];
  assert.equal(F.valid(old), true);
  assert.equal(F.valid({ ...F.defaults, minSecs: 5 }), false);
  assert.equal(F.valid({ ...F.defaults, mode: 'wild' }), false);
  assert.equal(F.valid({ ...F.defaults, loadouts: [null] }), false);
  assert.equal(F.valid({ ...F.defaults, loadouts: [{ policy: 'x' }, null] }), false);
});
