const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const read = file => readFileSync(path.join(root, file), 'utf8');

function loadEconomy() {
  const context = { Intl, localStorage: { getItem: () => null, setItem() {} } };
  context.window = context;
  vm.runInContext(read('economy.js'), vm.createContext(context));
  return context.Economy;
}

// Long-game scope phase A: one Printing quote shared by the manual UI, the reward and Auto Printing.
const FIXTURES = [
  [0, 0, 12500000], [12499999, 0, 12500000], [12500000, 10, 15125000], [12500001, 10, 15125000],
  [15124999, 10, 15125000], [15125000, 11, 18000000], [49999999, 19, 50000000], [50000000, 20, 55125000]
];

test('star quote matches the documented thresholds at and around each boundary', () => {
  const e = loadEconomy();
  for (const [earned, stars, next] of FIXTURES) {
    assert.equal(e.starsFor(earned), stars, `stars at ${earned}`);
    assert.equal(e.nextStarAt(earned), next, `next threshold at ${earned}`);
  }
});

test('every exact threshold awards its star and the one before it does not', () => {
  const e = loadEconomy();
  for (let g = 10; g <= 20000; g++) {
    const at = e.starAt(g);
    assert.ok(Number.isSafeInteger(at), `threshold ${g} is an integer`);
    assert.equal(e.starsFor(at), g, `stars at threshold ${g}`);
    assert.equal(e.starsFor(at - 1), g === 10 ? 0 : g - 1, `stars just below threshold ${g}`);
    assert.equal(e.nextStarAt(at), e.starAt(g + 1));
  }
});

test('star quote tolerates non-finite and huge values without hanging', () => {
  const e = loadEconomy();
  for (const bad of [NaN, -1, undefined, null]) assert.equal(e.starsFor(bad), 0);
  assert.equal(e.starsFor(Infinity), Infinity);
  assert.ok(e.starsFor(1e300) > 0);
  assert.ok(e.starsFor(Number.MAX_SAFE_INTEGER) > 0);
});

test('Auto Printing rule reads the same pending stars and next threshold as the quote', () => {
  const noop = () => {};
  const ctx = vm.createContext({ window: null, location: { search: '' }, URLSearchParams, GameFeatures: { enabled: () => true },
    Layers: { current: () => ({ count: 5 }), epochValid: () => true }, IMI: { screen: () => 'game', onScreen: noop, tour: { active: () => false } },
    document: { hidden: false, body: {}, querySelector: () => null, addEventListener: noop }, addEventListener: noop, MutationObserver: class { observe() {} } });
  ctx.window = ctx;
  vm.runInContext(read('economy.js'), ctx);
  vm.runInContext(read('automation.js'), ctx);
  const rule = ctx.__OPS_EXTENSIONS[0][1].printRule, e = ctx.Economy;
  for (const [earned, stars, next] of FIXTURES) {
    const r = rule(earned, 3e6, 300, 30);
    assert.ok(r, `rule at ${earned}`);
    assert.equal(r.gain, stars, `rule gain at ${earned}`);
    assert.equal(r.gap, next - earned, `rule gap at ${earned}`);
  }
  // The old rule saw 1 star at 12.5M while the quote paid 10, so no automatic decision could ever validate.
  const slow = rule(12500000, 300, 300, 30);
  assert.equal(slow.gain, e.starsFor(12500000));
  assert.equal(slow.eligible, true, 'next star more than N minutes away at a slow income');
  assert.equal(rule(12500000, 3e9, 300, 30).eligible, false, 'next star is close at a fast income');
  assert.equal(rule(12499999, 300, 300, 30).eligible, false, 'no star below the first threshold');
});

test('an automatic Printing decision validates against the same quote and goes stale with it', () => {
  const noop = () => {};
  const ctx = vm.createContext({ window: null, location: { search: '' }, URLSearchParams, GameFeatures: { enabled: () => true },
    Layers: { current: () => ({ count: 5 }), epochValid: () => true }, IMI: { screen: () => 'game', onScreen: noop, tour: { active: () => false } },
    document: { hidden: false, body: {}, querySelector: () => null, addEventListener: noop }, addEventListener: noop, MutationObserver: class { observe() {} } });
  ctx.window = ctx;
  vm.runInContext(read('economy.js'), ctx);
  vm.runInContext(read('automation.js'), ctx);
  const hook = ctx.__OPS_EXTENSIONS[0][1], e = ctx.Economy, earned = 12500000;
  const print = { version: 1, enabled: true, disclosed: true, N: 30, manual: { complete: true } };
  const s = { printing: 5, intro: { done: true }, chDone: {}, run: { earned }, meta: { estate: { count: 1 }, layers: { count: 5 },
    automation: { version: 1, ownership: { version: 1, owned: { print: true } }, print } } };
  const api = { state: () => s, automationDesks: () => [], mark: noop, automationAllowed: () => true, gardenEnabled: () => false, pitchEnabled: () => false,
    mediaEnabled: () => false, museEnabled: () => false, printingEnabled: () => true, challengeEnabled: () => false };
  hook.init('load', api);
  const r = hook.printRule(earned, 300, 300, 30);
  const decision = { version: 1, seconds: 300, paid: 300, N: 30, earned, gain: r.gain, gap: r.gap, estimate: r.estimate, config: JSON.stringify(print) };
  const quote = { earned, gain: e.starsFor(earned) };
  assert.equal(hook.validPrintDecision(decision, s, quote, api), true, 'decision matches the manual quote');
  assert.equal(hook.validPrintDecision(decision, s, { earned, gain: quote.gain + 1 }, api), false, 'a different pending-star count is stale');
  assert.equal(hook.validPrintDecision(decision, s, { earned: earned + 1, gain: quote.gain }, api), false, 'a moved run is stale');
});
