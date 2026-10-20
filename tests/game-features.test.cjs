const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm');
const source = name => fs.readFileSync(name, 'utf8');
function context(search = '', config = true) {
  const c = {location:{search, origin:'https://game.example'}, URLSearchParams};
  c.window = c;
  vm.createContext(c);
  if (config) vm.runInContext(source('game-features.js'), c);
  return c;
}
test('normal URLs enable the implemented catalogue only, with explicit overrides', () => {
  const c = context();
  for (const name of ['lg01a','lg02','lg02lamp','lg02speed','lg02funding','lg03','lg05folio','lg05layers','lg08estate','lg08archive','lg08print','lg08mastery','lg08challenge','lg09works','lg09board','lg09hall','lg09seasons','lg10awards','mg01','pg01','pg02','pg03','ui01']) assert(c.GameFeatures.enabled(name), name);
  for (const name of ['lg09demo','payments','endless','unknown']) assert.equal(c.GameFeatures.enabled(name), false);
  assert.equal(c.GameFeatures.enabled('lgb'), true, 'the long-game package is part of the game');
  assert.equal(context('?lgb=0').GameFeatures.enabled('lgb'), false, 'and can still be switched off to compare');
  assert.equal(context('?featureProfile=legacy').GameFeatures.enabled('lgb'), false, 'the legacy profile keeps the old economy');
  const off = context('?lg03=0&lg02speed=0');
  assert.equal(off.GameFeatures.enabled('lg03'), false);
  assert.equal(off.GameFeatures.enabled('lg02speed'), false);
  assert(off.GameFeatures.enabled('mg01'));
});
test('legacy profile and absent helper retain explicit flag behavior', () => {
  const c = context('?featureProfile=legacy&pg01=1');
  assert(c.GameFeatures.legacy);
  assert(c.GameFeatures.enabled('pg01'));
  assert.equal(c.GameFeatures.enabled('lg01a'), false);
  for (const [query, expected] of [['',false],['?pg01=1',true]]) {
    const bare = context(query, false);
    vm.runInContext(source('production-goal.js'), bare);
    assert.equal(bare.ProductionGoal.enabled, expected);
  }
});
test('both editions and harness load configuration before cold predicates; SW caches it', () => {
  for (const file of ['index.html','classic.html','tools/balance.html']) {
    const html = source(file);
    assert(html.indexOf('game-features.js') < html.indexOf('awards-catalogue.js'), file);
    assert(html.indexOf('game-features.js') < html.indexOf('vault-save-gate.js'), file);
  }
  assert(source('sw.js').includes("const VERSION = 'imi-v90'"));
  assert(source('sw.js').includes("'game-features.js'"));
});
function ownedSpeed(c) {
  for (const file of ['vault.js','vault-play.js']) vm.runInContext(source(file), c);
  const s = {printing:0,lamp:0,lastSeen:1000,intro:{done:true},meta:{},rewards:{migration:{version:1}},prem:{version:1,earned:150,earnedTotal:150,bought:0,boughtTotal:0,spentEarned:0,spentBought:0,credits:{component:{source:'earned',amount:150}}}};
  return c.VaultPlay.project(c.VaultPlay.project(s,{kind:'reserve',quote:c.VaultPlay.review(s,'game-speed:1')},2000),{kind:'activate',purchaseId:'vault:1'},3000);
}
test('HTTPS saved ownership admits busy gameplay while new Vault commands stay refused', () => {
  const c = context(), s = ownedSpeed(c);
  assert.equal(c.__LG02_LAMP_TASK, undefined);
  assert(c.VaultPlay.enabled());
  for (const busy of [x => x.meta.minigames = {active:{id:1}}, x => x.meta.challengeMastery = {active:{id:'trial'}}, x => x.meta.automation = {pitch:{sale:{id:'pending'}}}]) {
    const next = JSON.parse(JSON.stringify(s)); busy(next);
    assert(c.VaultPlay.savedSupported(next));
    assert(c.VaultPlay.rawCheck(JSON.stringify(next), JSON.stringify({economyVersion:1,score:0})));
    assert.equal(c.VaultPlay.supported(next), false);
    assert.throws(() => c.VaultPlay.review(next));
  }
  s.meta.minigames = {active:{id:1}};
  c.document = {readyState:'loading',documentElement:{dataset:{}},addEventListener(){}};
  c.localStorage = {getItem:() => JSON.stringify(s)};
  vm.runInContext(source('vault-save-gate.js'), c);
  assert.equal(c.VaultSaveGate.blocked, false);
});
test('normal admission still refuses paid, unknown and invalid receipts without mutation', () => {
  const c = context(), original = ownedSpeed(c);
  for (const change of [s => s.prem.bought = 1, s => s.prem.vault.purchases['vault:1'].itemId = 'typist-speed:1', s => s.prem.vault.freeSpeed.rule = 2, s => s.prem.vault.purchases['vault:1'].cost = 149]) {
    const s = JSON.parse(JSON.stringify(original)); change(s);
    const raw = JSON.stringify(s);
    assert.equal(c.VaultPlay.rawCheck(raw, JSON.stringify({economyVersion:1,score:0})), false);
    assert.equal(JSON.stringify(s), raw);
  }
});
