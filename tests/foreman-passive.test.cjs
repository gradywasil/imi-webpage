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
const mastered = (F, over = {}) => ({ ...F.defaults, enabled: true, passive: true, autoCycles: 5, cycles: Array.from({ length: 5 }, () => ({ sec: 120, gain: 10 })), ...over });

test('only Foreman Printings are recorded as cycles, the record is bounded, and a hand-pressed one adds nothing', () => {
  const F = load(), set = { ...F.defaults };
  let n = F.next(set, {}, [], null, 'foreman', { sec: 91.6, gain: 12 });
  assert.deepEqual(plain(n.cycles), [{ sec: 92, gain: 12 }]);
  assert.equal(n.autoCycles, 1);
  n = F.next(n, {}, [], null, 'manual', { sec: 50, gain: 10 });
  assert.equal(n.autoCycles, 1, 'a hand-pressed Printing is not mastery');
  assert.equal(n.cycles.length, 1);
  for (let i = 0; i < 20; i++) n = F.next(n, {}, [], null, 'foreman', { sec: 60 + i, gain: 10 });
  assert.equal(n.cycles.length, 8, 'only the latest eight are kept');
  assert.equal(n.autoCycles, 21, 'the count keeps counting');
  assert.equal(F.valid(n), true);
  assert.equal(F.next(set, {}, [], null, 'foreman', { sec: 30, gain: 0 }).autoCycles, 0, 'a cycle that paid nothing is not recorded');
});

test('passive time needs shown mastery, uses the median of the last five, and is bounded', () => {
  const F = load(), ups = { foreman: 1 }, day = 86400;
  assert.equal(F.passive({ ...F.defaults }, ups, day), null, 'off by default');
  assert.equal(F.passive(mastered(F, { passive: false }), ups, day), null);
  assert.equal(F.passive(mastered(F, { autoCycles: 4 }), ups, day), null, 'five automatic Printings first');
  assert.equal(F.passive(mastered(F, { cycles: [{ sec: 100, gain: 10 }] }), ups, day), null);
  assert.equal(F.passive(mastered(F, { policy: 'frontier' }), ups, day), null, 'only the Printing policy');
  assert.equal(F.passive(mastered(F), {}, day), null, 'needs the Foreman');
  const p = F.passive(mastered(F), ups, 3600);
  assert.deepEqual(plain(p), { n: 30, sec: 120, gain: 10, stars: 300 });
  assert.equal(F.passive(mastered(F), ups, 100), null, 'no partial cycle');
  // one lucky run is not an oracle: the median ignores it
  const lucky = mastered(F, { cycles: [{ sec: 120, gain: 10 }, { sec: 120, gain: 10 }, { sec: 1, gain: 900 }, { sec: 120, gain: 10 }, { sec: 120, gain: 10 }] });
  assert.equal(F.passive(lucky, ups, 3600).gain, 10);
  assert.equal(F.passive(lucky, ups, 3600).sec, 120);
  // bounded in cycles and in time
  assert.equal(F.passive(mastered(F, { cycles: Array.from({ length: 5 }, () => ({ sec: 30, gain: 10 })) }), ups, 30 * 86400).n, 200);
  const slow = mastered(F, { cycles: Array.from({ length: 5 }, () => ({ sec: 3600, gain: 10 })) });
  assert.equal(F.passive(slow, ups, 365 * 86400).n, 168, 'a week at most, whatever the absence');
  assert.equal(F.passive(mastered(F), ups, -5), null);
  assert.equal(F.passive(mastered(F, { cycles: Array.from({ length: 5 }, () => ({ sec: 2, gain: 10 })) }), ups, 600).sec, F.MIN_SECS, 'never faster than the accounting interval');
});

test('an Annex hold keeps the Foreman from pressing, and says so', () => {
  const F = load(), on = { ...F.defaults, enabled: true };
  assert.equal(F.due(on, 50, 999, false).due, true);
  const held = F.due(on, 50, 999, true);
  assert.equal(held.due, false);
  assert.match(held.why, /Annex/);
});

test('settings saved before cycles existed still validate', () => {
  const F = load(), old = plain(F.defaults);
  for (const k of ['cycles', 'autoCycles', 'passive', 'route']) delete old[k];
  assert.equal(F.valid(old), true);
  assert.equal(F.valid({ ...F.defaults, cycles: [{ sec: -1, gain: 1 }] }), false);
  assert.equal(F.valid({ ...F.defaults, cycles: Array.from({ length: 9 }, () => ({ sec: 1, gain: 1 })) }), false);
  assert.equal(F.valid({ ...F.defaults, passive: 'yes' }), false);
});
