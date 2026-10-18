const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function load() {
  const context = {}; context.window = context;
  vm.runInNewContext(readFileSync(path.join(__dirname, '..', 'house.js'), 'utf8'), context);
  return context.House;
}
const plain = x => JSON.parse(JSON.stringify(x));

test('builds each pay for what they favor and charge for something else, never a flat universal bonus', () => {
  const H = load();
  assert.equal(H.saleFactor(null, 2, 0, 0), 1, 'no build, no change');
  // rapid: a launch window of six titles, and a cost on the two biggest machines
  assert.deepEqual([0, 5, 6].map(n => H.saleFactor({ build: 'rapid' }, 1, 0, n)), [1.25, 1.25, 1]);
  assert.ok(Math.abs(H.saleFactor({ build: 'rapid' }, 5, 0, 99) - .9) < 1e-9);
  // collector: reissues up, first editions down
  assert.deepEqual([H.saleFactor({ build: 'collector' }, 2, 3, 0), H.saleFactor({ build: 'collector' }, 2, 0, 0)], [1.15, .92]);
  // prestige: high bands up, low bands down
  assert.deepEqual([0, 1, 2, 3, 5].map(b => H.saleFactor({ build: 'prestige' }, b, 0, 0)), [.85, .85, 1, 1.15, 1.15]);
  for (const id of Object.keys(H.BUILDS)) assert.ok(H.BUILDS[id].cost.length > 10, id + ' states its trade-off');
});

test('a build can be chosen only after an Imprint, only before the room sells, and only once earned', () => {
  const H = load(), h = H.fresh();
  const ctx = (over = {}) => ({ imprints: 1, sold: 0, restored: {}, ...over });
  assert.equal(H.choose(h, 'rapid', ctx()).h.build, 'rapid');
  assert.match(H.choose(h, 'rapid', ctx({ imprints: 0 })).why, /Found an Imprint/);
  assert.match(H.choose(h, 'rapid', ctx({ sold: 1 })).why, /before this room sells/);
  assert.match(H.choose(h, 'collector', ctx()).why, /Restore the almanac/);
  assert.equal(H.choose(h, 'collector', ctx({ restored: { almanac: true } })).h.build, 'collector');
  assert.match(H.choose(h, 'prestige', ctx({ restored: { almanac: true } })).why, /atlas/);
  assert.equal(H.choose({ ...h, build: 'rapid' }, null, ctx()).h.build, null, 'swapping away is free');
  assert.equal(H.choose(h, 'nope', ctx()).ok, false);
});

test('touring staff speeds exactly one chosen machine, and only when owned', () => {
  const H = load();
  assert.equal(H.touring({ band: 2 }, true, 2), 1.25);
  assert.equal(H.touring({ band: 2 }, true, 3), 1);
  assert.equal(H.touring({ band: 2 }, false, 2), 1, 'not bought');
  assert.equal(H.touring({ band: null }, true, 2), 1);
  assert.equal(H.setBand(H.fresh(), 9, { sold: 0 }).ok, false);
  assert.match(H.setBand(H.fresh(), 2, { sold: 3 }).why, /before this room sells/);
});

test('collector and prestige reach into the workshop in bounded ways', () => {
  const H = load();
  assert.equal(H.extraParts({ build: 'collector' }, 'manuscript'), 1);
  assert.equal(H.extraParts({ build: 'collector' }, 'salvage'), 0);
  assert.equal(H.extraParts({ build: 'rapid' }, 'manuscript'), 0);
  assert.equal(H.depositNeed({ build: 'collector' }, 6), 5);
  assert.equal(H.depositNeed({ build: 'collector' }, 4), 3);
  assert.equal(H.depositNeed({ build: 'rapid' }, 6), 6);
  assert.equal(H.specialRepeat({ build: 'prestige' }, 2), 3);
  assert.equal(H.specialRepeat(null, 2), 2);
});

test('editorial exchange turns three surplus words of a band into one missing goal word, never touching goal words', () => {
  const H = load(), band = w => w.length <= 3 ? 0 : 1;
  const swap = H.exchange({ cat: 2, dog: 2, hen: 5, bird: 9 }, { cow: 1, hen: 1 }, band);
  assert.equal(swap.get, 'cow');
  assert.equal(Object.values(swap.take).reduce((a, b) => a + b, 0), 3);
  assert.ok(!('hen' in swap.take), 'a word the goal needs is never given up');
  assert.ok(!('bird' in swap.take), 'only the same band');
  assert.equal(H.exchange({ cat: 1, dog: 1 }, { cow: 1 }, band), null, 'two surplus words are not enough');
  assert.equal(H.exchange({ cat: 9 }, { cow: 1, cat: 0 }, band), null, 'cat is a goal word here');
  assert.equal(H.exchange({ cow: 1, cat: 9 }, { cow: 1 }, band), null, 'nothing missing');
});

test('specialization records validate strictly', () => {
  const H = load();
  assert.equal(H.valid(undefined), true);
  assert.equal(H.valid(H.fresh()), true);
  for (const bad of [{ v: 2, build: null, band: null }, { v: 1, build: 'mega', band: null }, { v: 1, build: null, band: 6 }, { v: 1, build: null, band: 1.5 }, null, []])
    assert.equal(H.valid(bad), false, JSON.stringify(bad));
  assert.deepEqual(plain(H.fresh()), { v: 1, build: null, band: null });
});
