const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'vault.js'), 'utf8');
const touches = [];
const forbidden = name => new Proxy({}, { get() { touches.push(name); throw Error(name); } });
const context = { window: {}, localStorage: forbidden('storage'), IMI: forbidden('IMI'), document: forbidden('DOM'),
  setTimeout() { touches.push('timer'); throw Error('timer'); }, addEventListener() { touches.push('listener'); throw Error('listener'); } };
vm.runInNewContext(source, context);
const vault = context.window.Vault;
const item = id => vault.catalogue.items.find(x => x.id === id);
const row = (sequence, id, status, created = 1000, terminal = 2000) => ({
  version: 1, sequence, itemId: id, catalogueRevision: 1, status, cost: item(id).cost,
  debitEarned: item(id).cost, debitBought: 0, priorTier: item(id).stage - 1, targetTier: item(id).stage,
  createdWallMs: created, printingAtPurchase: 1,
  ...(status === 'active' ? { activatedWallMs: terminal } : status === 'refunded' ? { refundedWallMs: terminal } : {})
});
function state(rows = [], nextSequence = rows.length + 1) {
  const purchases = {}, owned = {}, active = {};
  let spent = 0;
  for (const r of rows) {
    const key = `vault:${r.sequence}`;
    purchases[key] = r;
    if (r.status !== 'refunded') { spent += r.cost; owned[r.itemId] = key; if (r.status === 'active') active[r.itemId] = key; }
  }
  return { printing: 2, prem: { version: 1, earned: 1000 - spent, bought: 0, earnedTotal: 1000, boughtTotal: 0,
    spentEarned: spent, spentBought: 0, credits: { grant: { source: 'earned', amount: 1000 } },
    vault: { version: 1, nextSequence, purchases, owned, active, selections: {}, settings: { hideStore: false } } } };
}
const result = s => vault.validate(s).status;

test('finite representable signed and fractional wall history has no chronology requirement', () => {
  for (const status of ['active', 'refunded']) {
    assert.equal(result(state([row(1, 'game-speed:1', status, 1000, 900)])), 'valid');
    assert.equal(result(state([row(1, 'game-speed:1', status, -1000.5, -1100.25)])), 'valid');
  }
  for (const invalid of [NaN, Infinity, -Infinity, '1000', 8.64e15 + 1, -8.64e15 - 1])
    assert.equal(result(state([row(1, 'game-speed:1', 'active', invalid)])), 'unsupported');
  assert.equal(result(state([row(1, 'game-speed:1', 'active', 8.64e15, -8.64e15)])), 'valid');
});

test('one unresolved reservation is the latest acknowledged purchase, even after a refund', () => {
  for (const later of [row(2, 'typist-speed:1', 'active'), row(2, 'typist-speed:1', 'refunded'), row(2, 'game-speed:2', 'active')]) {
    const s = state([row(1, 'game-speed:1', 'undoable'), later]);
    assert.equal(result(s), 'unsupported');
  }
  const s = state([row(1, 'game-speed:1', 'active'), row(2, 'game-speed:2', 'undoable')]);
  assert.equal(result(s), 'valid');
});

test('retained history includes every sequence and nextSequence is the exact successor', () => {
  assert.equal(result(state()), 'valid');
  assert.equal(result(state([], 2)), 'unsupported');
  assert.equal(result(state([row(2, 'game-speed:1', 'active')], 3)), 'unsupported');
  assert.equal(result(state([row(1, 'game-speed:1', 'refunded'), row(3, 'typist-speed:1', 'active')], 4)), 'unsupported');
  assert.equal(result(state([row(1, 'game-speed:1', 'active')], 4)), 'unsupported');
  assert.equal(result(state([row(1, 'game-speed:1', 'refunded'), row(2, 'typist-speed:1', 'active')], 3)), 'valid');
});

test('API and input remain unchanged across repeated validation', () => {
  const s = state([row(1, 'game-speed:1', 'active')]);
  s.unknown = { keep: true };
  const before = JSON.stringify(s), keys = Object.keys(vault).sort();
  assert.equal(result(s), 'valid');
  assert.equal(result(s), 'valid');
  assert.equal(JSON.stringify(s), before);
  assert.deepEqual(Object.keys(vault).sort(), keys);
  assert.ok(Object.isFrozen(vault.catalogue) && Object.isFrozen(vault.catalogue.items));
  assert.deepEqual(touches, []);
});
