const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const old = 'docs/plan/long-game/evidence/LG-02/implementation-a/before/source/';
const bad = 'docs/plan/long-game/evidence/LG-02/repair-runtime-a-r2/before/';
function probe(path, blocked = false) {
  const source = fs.readFileSync(path, 'utf8');
  const end = source.indexOf('  const { setTimeout');
  assert.ok(end > 0, 'actual startup prefix is present');
  // Preserve the actual enclosing IIFE and function prologue; stop before any game code.
  return vm.runInNewContext(source.slice(0, end) + `
    const strictThis = (function () { return this === undefined; })();
    const frozen = Object.freeze({value: 1});
    let throws = false;
    try { frozen.value = 2; } catch (error) { throws = error instanceof TypeError; }
    return {strictThis, throws, value: frozen.value};
  } return start(); })();`, {window: {VaultSaveGate: {blocked}}});
}
for (const path of ['ops.js', 'pickups.js', 'tour.js']) {
  test(path + ' original ordinary prefix is a positive strict semantic control', () => {
    const result = probe(old + path);
    assert.equal(result.strictThis, true);
    assert.equal(result.throws, true);
    assert.equal(result.value, 1);
  });
  test(path + ' frozen failed candidate reaches non-strict negative control', () => {
    const result = probe(bad + path);
    assert.equal(result.strictThis, false);
    assert.equal(result.throws, false);
    assert.equal(result.value, 1);
    assert.equal(probe(bad + path, true), undefined);
  });
  test(path + ' current admitted startup retains original strict semantics', () => {
    const result = probe(path);
    assert.equal(result.strictThis, true);
    assert.equal(result.throws, true);
    assert.equal(result.value, 1);
    assert.equal(probe(path, true), undefined, 'cold block returns before the probe');
  });
}
for (const path of ['app.js', 'pixel-fx.js']) {
  test(path + ' retains original non-strict lexical mode and cold block', () => {
    for (const file of [old + path, path]) {
      const result = probe(file);
      assert.equal(result.strictThis, false);
      assert.equal(result.throws, false);
      assert.equal(result.value, 1);
    }
    assert.equal(probe(path, true), undefined);
  });
}
