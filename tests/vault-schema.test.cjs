const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync(require('node:path').join(__dirname, '..', 'vault.js'), 'utf8');
function moduleUnderTest() {
  const touches = [];
  const forbidden = name => new Proxy({}, { get() { touches.push(name); throw Error(name); } });
  const guardedMath = Object.create(Math);
  guardedMath.random = () => { touches.push('RNG'); throw Error('RNG'); };
  const context = { window: {}, localStorage: forbidden('storage'), IMI: forbidden('IMI'), document: forbidden('DOM'), Math: guardedMath,
    setTimeout() { touches.push('timer'); throw Error('timer'); }, addEventListener() { touches.push('listener'); throw Error('listener'); } };
  vm.runInNewContext(source, context);
  assert.deepEqual(touches, []);
  return { vault: context.window.Vault, touches };
}
const { vault, touches } = moduleUnderTest();
const copy = x => structuredClone(x);
const credit = (source, amount) => ({ source, amount });
function base() {
  return { printing: 2, prem: { version: 1, earned: 109, bought: 100, earnedTotal: 109, boughtTotal: 100,
    spentEarned: 0, spentBought: 0, credits: { first: credit('earned', 109), synthetic: credit('bought', 100) },
    vault: { version: 1, nextSequence: 1, purchases: {}, owned: {}, active: {}, selections: {}, settings: { hideStore: false } } } };
}
function receipt(sequence, itemId, status = 'active', debitEarned = 109, debitBought = 41) {
  const row = vault.catalogue.items.find(x => x.id === itemId);
  return { version: 1, itemId, catalogueRevision: 1, sequence, status, cost: row.cost, debitEarned, debitBought,
    priorTier: row.stage - 1, targetTier: row.stage, createdWallMs: 1000, printingAtPurchase: 1,
    ...(status === 'active' ? { activatedWallMs: 2000 } : status === 'refunded' ? { refundedWallMs: 2000 } : {}) };
}
function spend(s, r) {
  const id = `vault:${r.sequence}`;
  s.prem.vault.purchases[id] = r;
  s.prem.vault.nextSequence = r.sequence + 1;
  if (r.status !== 'refunded') {
    s.prem.spentEarned += r.debitEarned; s.prem.spentBought += r.debitBought;
    s.prem.earned -= r.debitEarned; s.prem.bought -= r.debitBought;
    s.prem.vault.owned[r.itemId] = id;
    if (r.status === 'active') s.prem.vault.active[r.itemId] = id;
  }
  return s;
}
const status = s => vault.validate(s).status;

test('catalogue is immutable and contains only approved priced stages and an unset Endless', () => {
  const c = vault.catalogue;
  assert.equal(c.revision, 1);
  assert.deepEqual([...c.items.filter(x => x.family === 'game-speed').map(x => x.cost)], [150, 300, 500, 800]);
  assert.deepEqual([...c.items.filter(x => x.family === 'typist-speed').map(x => x.effect.factor)], [1.25, 1.5, 1.75, 2]);
  assert.deepEqual([...c.items.filter(x => x.family === 'lamp-plus').map(x => x.effect.capHours)], [24, 36, 48]);
  assert.equal(c.items.find(x => x.id === 'muse-seat:4').effect.extraSeats, 1);
  assert.equal(c.items.find(x => x.id === 'garden-beds:7-8').effect.extraBeds, 2);
  assert.equal(c.items.find(x => x.id === 'lamp-endless').cost, null);
  assert.equal(c.items.find(x => x.id === 'lamp-endless').purchasable, false);
  assert.equal(c.items.length, 14);
  assert.ok(Object.isFrozen(c) && Object.isFrozen(c.items) && c.items.every(x => Object.isFrozen(x) && Object.isFrozen(x.effect)));
  assert.ok(!c.items.some(x => /cosmetic|ribbon|pack/.test(x.id)));
});

test('absence, empty Vault and historical spent without Vault differ', () => {
  const s = base();
  assert.equal(status(s), 'valid');
  delete s.prem.vault;
  assert.equal(status(s), 'absent');
  s.prem.spentEarned = 1; s.prem.earned = 108;
  assert.equal(vault.validate(s).code, 'MISSING_SPEND_HISTORY');
  assert.equal(vault.validate({}).status, 'absent');
  assert.equal(vault.validate({ prem: {} }).status, 'absent');
});

test('109 earned plus 100 synthetic bought permits a structural 150 debit, not paid provenance', () => {
  const s = spend(base(), receipt(1, 'game-speed:1'));
  assert.deepEqual([s.prem.earned, s.prem.bought, s.prem.spentEarned, s.prem.spentBought], [0, 59, 109, 41]);
  assert.equal(status(s), 'valid');
  assert.equal(vault.validate(s).paidVerified, undefined);
  const reserved = spend(base(), receipt(1, 'game-speed:1', 'undoable'));
  assert.equal(status(reserved), 'valid');
  assert.deepEqual(Object.keys(reserved.prem.vault.active), []);
});

test('refund accounting retains intervening 4 earned and permits later repurchase', () => {
  const s = base();
  s.prem.earned = 113; s.prem.earnedTotal = 113; s.prem.credits.intervening = credit('earned', 4);
  s.prem.vault.purchases['vault:1'] = receipt(1, 'game-speed:1', 'refunded');
  s.prem.vault.nextSequence = 2;
  assert.equal(status(s), 'valid');
  s.prem.vault.purchases['vault:2'] = receipt(2, 'game-speed:1', 'active', 109, 41);
  s.prem.vault.nextSequence = 3;
  s.prem.vault.owned['game-speed:1'] = 'vault:2'; s.prem.vault.active['game-speed:1'] = 'vault:2';
  s.prem.earned = 4; s.prem.bought = 59; s.prem.spentEarned = 109; s.prem.spentBought = 41;
  assert.equal(status(s), 'valid');
  s.prem.vault.purchases['vault:1'].status = 'active';
  assert.equal(vault.validate(s).code, 'RECEIPT_ACTIVATION');
});

test('tier history survives higher ownership without activating two stages', () => {
  const s = spend(base(), receipt(1, 'lamp-plus:1', 'active', 100, 0));
  s.prem.vault.purchases['vault:2'] = receipt(2, 'lamp-plus:2', 'undoable', 9, 191);
  s.prem.vault.nextSequence = 3; s.prem.vault.owned['lamp-plus:2'] = 'vault:2';
  s.prem.earned = 0; s.prem.bought = 0; s.prem.spentEarned = 109; s.prem.spentBought = 191;
  s.prem.boughtTotal = 191; s.prem.credits.synthetic.amount = 191;
  assert.equal(status(s), 'valid');
  s.prem.vault.active['lamp-plus:2'] = 'vault:2';
  assert.equal(vault.validate(s).code, 'ACTIVE_REFERENCE');
  delete s.prem.vault.active['lamp-plus:2'];
  delete s.prem.vault.active['lamp-plus:1'];
  assert.equal(vault.validate(s).code, 'MISSING_ACTIVE');
});

test('higher active tier retains lower history, and space packages encode ownership stage one', () => {
  const s = base(); s.prem.bought = 191; s.prem.boughtTotal = 191; s.prem.credits.synthetic.amount = 191;
  spend(s, receipt(1, 'lamp-plus:1', 'active', 100, 0));
  spend(s, receipt(2, 'lamp-plus:2', 'active', 9, 191));
  delete s.prem.vault.active['lamp-plus:1'];
  assert.equal(status(s), 'valid');
  for (const itemId of ['muse-seat:4', 'garden-beds:7-8']) {
    const row = vault.catalogue.items.find(x => x.id === itemId);
    const one = base(); one.prem.bought = row.cost - 109; one.prem.boughtTotal = row.cost - 109;
    one.prem.credits.synthetic.amount = row.cost - 109;
    spend(one, receipt(1, itemId, 'active', 109, row.cost - 109));
    assert.equal(one.prem.vault.purchases['vault:1'].targetTier, 1);
    assert.equal(status(one), 'valid');
  }
});

test('independent ledger, source, receipt, map and revision corruptions fail closed', () => {
  const cases = [
    [s => { s.prem.credits.synthetic.amount++; }, 'LEDGER_TOTAL'],
    [s => { s.prem.spentEarned++; }, 'LEDGER_TOTAL'],
    [s => { s.prem.vault.purchases['vault:1'].debitBought++; }, 'RECEIPT_DEBIT'],
    [s => { s.prem.vault.purchases['vault:1'].cost++; }, 'RECEIPT_DEBIT'],
    [s => { s.prem.vault.purchases['vault:1'].catalogueRevision = 2; }, 'RECEIPT_VERSION'],
    [s => { s.prem.vault.purchases['vault:1'].itemId = 'future:1'; }, 'UNKNOWN_ITEM'],
    [s => { s.prem.vault.nextSequence = 1; }, 'RECEIPT_SEQUENCE'],
    [s => { s.prem.vault.owned['game-speed:1'] = 'vault:9'; }, 'OWNED_REFERENCE'],
    [s => { s.prem.vault.active['game-speed:1'] = 'vault:9'; }, 'ACTIVE_REFERENCE'],
    [s => { s.prem.vault.purchases['vault:1'].priorTier = 1; }, 'RECEIPT_TIER'],
    [s => { s.prem.vault.purchases['vault:1'].printingAtPurchase = 3; }, 'RECEIPT_HISTORY'],
    [s => { s.prem.vault.settings.hideStore = 1; }, 'VAULT_SETTINGS'],
    [s => { s.prem.vault.selections.skin = 'future'; }, 'DEFERRED_SELECTION'],
    [s => { s.prem.vault.transition = { version: 1 }; }, 'OPEN_RECOVERY_UNSUPPORTED']
  ];
  for (const [mutate, code] of cases) { const s = spend(base(), receipt(1, 'game-speed:1')); mutate(s); assert.equal(vault.validate(s).code, code); }
});

test('duplicate live identities, missing tier and unaccounted spend are unsupported', () => {
  const s = spend(base(), receipt(1, 'game-speed:1'));
  s.prem.vault.purchases['vault:2'] = receipt(2, 'game-speed:1', 'active'); s.prem.vault.nextSequence = 3;
  assert.equal(vault.validate(s).code, 'DUPLICATE_OWNERSHIP');
  const t = base(); t.prem.vault.purchases['vault:1'] = receipt(1, 'game-speed:2', 'active', 109, 191); t.prem.vault.nextSequence = 2;
  t.prem.boughtTotal = 191; t.prem.credits.synthetic.amount = 191; t.prem.spentEarned = 109; t.prem.spentBought = 191; t.prem.earned = 0; t.prem.bought = 0;
  t.prem.vault.owned['game-speed:2'] = 'vault:1'; t.prem.vault.active['game-speed:2'] = 'vault:1';
  assert.equal(vault.validate(t).code, 'TIER_CHAIN');
  const u = base(); u.prem.spentEarned = 1; u.prem.earned = 108;
  assert.equal(vault.validate(u).code, 'SPEND_ATTRIBUTION');
});

test('overflow, malformed maps, future namespaces and Endless fail closed', () => {
  const s = base(); s.prem.earned = Number.MAX_SAFE_INTEGER; s.prem.earnedTotal = Number.MAX_SAFE_INTEGER;
  s.prem.credits.first.amount = Number.MAX_SAFE_INTEGER; s.prem.bought = 1; s.prem.boughtTotal = 1; s.prem.credits.synthetic.amount = 1;
  assert.equal(vault.validate(s).code, 'LEDGER_OVERFLOW');
  const t = base(); t.prem.vault.purchases = [];
  assert.equal(vault.validate(t).code, 'VAULT_MAP');
  const f = base(); f.prem.vault.version = 2;
  assert.equal(vault.validate(f).code, 'VAULT_VERSION');
  const e = base(); e.prem.vault.purchases['vault:1'] = { ...receipt(1, 'game-speed:1'), itemId: 'lamp-endless' }; e.prem.vault.nextSequence = 2;
  assert.equal(vault.validate(e).code, 'UNKNOWN_ITEM');
  const hostile = base(); hostile.prem.vault.purchases['vault:1<private>'] = receipt(1, 'game-speed:1'); hostile.prem.vault.nextSequence = 2;
  assert.ok(!JSON.stringify(vault.validate(hostile)).includes('private'));
  assert.equal(vault.validate({ prem: null }).code, 'PREM_SHAPE');
});

test('frozen input and unknown fields survive repeated pure validation without ambient access', () => {
  const s = spend(base(), receipt(1, 'game-speed:1'));
  s.extra = { future: true }; s.prem.future = { marker: 7 }; s.prem.vault.future = { marker: 8 };
  s.prem.vault.purchases['vault:1'].future = { marker: 9 };
  const before = JSON.stringify(s);
  const freeze = x => { Object.freeze(x); for (const v of Object.values(x)) if (v && typeof v === 'object' && !Object.isFrozen(v)) freeze(v); };
  freeze(s);
  assert.equal(status(s), 'valid'); assert.equal(status(s), 'valid');
  assert.equal(JSON.stringify(s), before); assert.deepEqual(touches, []);
});
