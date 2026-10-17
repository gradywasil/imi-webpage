/* LG-02B1: definitions and pure structural validation only. This module never admits a save. */
window.Vault = (() => {
  'use strict';
  const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  const object = x => x !== null && typeof x === 'object' && !Array.isArray(x);
  const uint = x => Number.isSafeInteger(x) && x >= 0;
  const positive = x => uint(x) && x > 0;
  const timestamp = x => typeof x === 'number' && Number.isFinite(x) && Math.abs(x) <= 8.64e15;
  const map = x => object(x) && Object.keys(x).every(k => !['__proto__', 'prototype', 'constructor'].includes(k));
  const fail = (code, path) => ({ status: 'unsupported', code, path });
  const add = (a, b) => uint(a) && uint(b) && a <= Number.MAX_SAFE_INTEGER - b ? a + b : null;
  const tiers = (family, costs, effects, effectKey) => costs.map((cost, i) => Object.freeze({
    id: `${family}:${i + 1}`, family, stage: i + 1, cost, effect: Object.freeze({ [effectKey]: effects[i] }), purchasable: true
  }));
  const rows = [
    ...tiers('game-speed', [150, 300, 500, 800], [1.25, 1.5, 1.75, 2], 'factor'),
    ...tiers('typist-speed', [150, 300, 500, 800], [1.25, 1.5, 1.75, 2], 'factor'),
    ...tiers('lamp-plus', [100, 200, 400], [24, 36, 48], 'capHours'),
    Object.freeze({ id: 'muse-seat:4', family: 'muse-seat', stage: 1, cost: 300, effect: Object.freeze({ extraSeats: 1 }), purchasable: true }),
    Object.freeze({ id: 'garden-beds:7-8', family: 'garden-beds', stage: 1, cost: 200, effect: Object.freeze({ extraBeds: 2 }), purchasable: true }),
    Object.freeze({ id: 'lamp-endless', family: 'lamp-endless', stage: 1, cost: null, effect: Object.freeze({ unboundedCap: true }), purchasable: false })
  ];
  const catalogue = Object.freeze({ revision: 1, items: Object.freeze(rows) });
  const byId = Object.freeze(Object.fromEntries(rows.map(row => [row.id, row])));

  function validate(state) {
    try { return inspect(state); }
    catch { return fail('MALFORMED_INPUT', '$'); }
  }

  function inspect(state) {
    if (!object(state)) return fail('ROOT_SHAPE', '$');
    if (!own(state, 'prem')) return { status: 'absent' };
    const p = state.prem;
    if (!object(p)) return fail('PREM_SHAPE', 'prem');
    if (!own(p, 'vault')) {
      if (['spentEarned', 'spentBought'].some(k => own(p, k) && !uint(p[k]))) return fail('LEDGER_FIELD', 'prem');
      return p.spentEarned || p.spentBought ? fail('MISSING_SPEND_HISTORY', 'prem.vault') : { status: 'absent' };
    }
    const fields = ['earned', 'bought', 'earnedTotal', 'boughtTotal', 'spentEarned', 'spentBought'];
    if (fields.some(k => !uint(p[k]))) return fail('LEDGER_FIELD', 'prem');
    if (p.version !== 1) return fail('PREM_VERSION', 'prem.version');
    if (!map(p.credits)) return fail('CREDIT_MAP', 'prem.credits');
    const totals = { earned: 0, bought: 0 };
    for (const credit of Object.values(p.credits)) {
      if (!object(credit) || !['earned', 'bought'].includes(credit.source) || !uint(credit.amount)) return fail('CREDIT_ROW', 'prem.credits');
      const next = add(totals[credit.source], credit.amount);
      if (next === null) return fail('CREDIT_OVERFLOW', 'prem.credits');
      totals[credit.source] = next;
    }
    for (const source of ['earned', 'bought']) {
      const spent = source === 'earned' ? 'spentEarned' : 'spentBought';
      if (add(p[source], p[spent]) !== p[`${source}Total`] || totals[source] !== p[`${source}Total`]) return fail('LEDGER_TOTAL', 'prem');
    }
    if (add(p.earned, p.bought) === null || add(p.spentEarned, p.spentBought) === null) return fail('LEDGER_OVERFLOW', 'prem');
    const v = p.vault;
    if (!object(v) || v.version !== 1) return fail('VAULT_VERSION', 'prem.vault');
    if (!positive(v.nextSequence) || v.nextSequence === Number.MAX_SAFE_INTEGER) return fail('NEXT_SEQUENCE', 'prem.vault.nextSequence');
    for (const key of ['purchases', 'owned', 'active', 'selections', 'settings']) if (!map(v[key])) return fail('VAULT_MAP', `prem.vault.${key}`);
    if (typeof v.settings.hideStore !== 'boolean') return fail('VAULT_SETTINGS', 'prem.vault.settings.hideStore');
    if (Object.keys(v.selections).length) return fail('DEFERRED_SELECTION', 'prem.vault.selections');
    if (own(v, 'transition')) return fail('OPEN_RECOVERY_UNSUPPORTED', 'prem.vault.transition');
    const receipts = Object.entries(v.purchases), live = new Map(), history = new Map();
    let earnedSpent = 0, boughtSpent = 0, undoable = 0;
    for (const [id, r] of receipts) {
      if (!/^vault:[1-9]\d*$/.test(id) || !object(r) || !positive(r.sequence) || id !== `vault:${r.sequence}` || r.sequence >= v.nextSequence) return fail('RECEIPT_SEQUENCE', 'prem.vault.purchases');
      if (r.version !== 1 || r.catalogueRevision !== 1) return fail('RECEIPT_VERSION', 'prem.vault.purchases');
      const item = own(byId, r.itemId) ? byId[r.itemId] : null;
      if (!item || !item.purchasable) return fail('UNKNOWN_ITEM', 'prem.vault.purchases.itemId');
      if (!['undoable', 'active', 'refunded'].includes(r.status)) return fail('RECEIPT_STATUS', 'prem.vault.purchases');
      if (!uint(r.cost) || r.cost !== item.cost || !uint(r.debitEarned) || !uint(r.debitBought) || add(r.debitEarned, r.debitBought) !== r.cost) return fail('RECEIPT_DEBIT', 'prem.vault.purchases');
      if (!uint(r.priorTier) || r.priorTier !== item.stage - 1 || r.targetTier !== item.stage) return fail('RECEIPT_TIER', 'prem.vault.purchases');
      if (!timestamp(r.createdWallMs) || !uint(r.printingAtPurchase) || (own(state, 'printing') && (!uint(state.printing) || r.printingAtPurchase > state.printing))) return fail('RECEIPT_HISTORY', 'prem.vault.purchases');
      if (r.status === 'active' && (!timestamp(r.activatedWallMs) || own(r, 'refundedWallMs'))) return fail('RECEIPT_ACTIVATION', 'prem.vault.purchases');
      if (r.status === 'refunded' && (!timestamp(r.refundedWallMs) || own(r, 'activatedWallMs'))) return fail('RECEIPT_REFUND', 'prem.vault.purchases');
      if (r.status === 'undoable' && (own(r, 'activatedWallMs') || own(r, 'refundedWallMs'))) return fail('RECEIPT_RESERVATION', 'prem.vault.purchases');
      if ((own(r, 'plusCreditPurchaseIds') && (!Array.isArray(r.plusCreditPurchaseIds) || r.plusCreditPurchaseIds.length)) || (own(r, 'plusCreditAmount') && r.plusCreditAmount !== 0)) return fail('PLUS_CREDIT_UNSUPPORTED', 'prem.vault.purchases');
      history.set(id, { r, item });
    }
    if (v.nextSequence !== receipts.length + 1) return fail('NEXT_SEQUENCE', 'prem.vault.nextSequence');
    for (const [index, [id, { r, item }]] of [...history].sort((a, b) => a[1].r.sequence - b[1].r.sequence).entries()) {
      if (r.sequence !== index + 1) return fail('RECEIPT_SEQUENCE', 'prem.vault.purchases');
      if (r.status === 'undoable' && r.sequence !== receipts.length) return fail('RECEIPT_RESERVATION', 'prem.vault.purchases');
      const previous = live.get(item.id);
      if (previous) return fail('DUPLICATE_OWNERSHIP', 'prem.vault.purchases');
      if (item.stage > 1 && history.get(live.get(`${item.family}:${item.stage - 1}`))?.r.status !== 'active') return fail('TIER_CHAIN', 'prem.vault.purchases');
      if (r.status !== 'refunded') {
        live.set(item.id, id);
        earnedSpent = add(earnedSpent, r.debitEarned);
        boughtSpent = add(boughtSpent, r.debitBought);
        if (earnedSpent === null || boughtSpent === null) return fail('SPEND_OVERFLOW', 'prem.vault.purchases');
      }
      if (r.status === 'undoable') undoable++;
    }
    if (undoable > 1) return fail('MULTIPLE_RESERVATIONS', 'prem.vault.purchases');
    if (earnedSpent !== p.spentEarned || boughtSpent !== p.spentBought) return fail('SPEND_ATTRIBUTION', 'prem');
    if (Object.keys(v.owned).length !== live.size) return fail('OWNED_MAP', 'prem.vault.owned');
    for (const [itemId, id] of live) if (!own(v.owned, itemId) || v.owned[itemId] !== id) return fail('OWNED_REFERENCE', 'prem.vault.owned');
    const activeFamilies = new Set();
    for (const [itemId, id] of Object.entries(v.active)) {
      if (!live.has(itemId) || live.get(itemId) !== id || history.get(id).r.status !== 'active') return fail('ACTIVE_REFERENCE', 'prem.vault.active');
      const family = history.get(id).item.family;
      if (activeFamilies.has(family)) return fail('ACTIVE_TIER_DUPLICATE', 'prem.vault.active');
      activeFamilies.add(family);
    }
    for (const [itemId, id] of live) {
      const { r, item } = history.get(id);
      if (r.status !== 'active') continue;
      const highest = [...live].filter(([, purchaseId]) => history.get(purchaseId).item.family === item.family && history.get(purchaseId).r.status === 'active')
        .reduce((best, row) => !best || history.get(row[1]).item.stage > history.get(best[1]).item.stage ? row : best, null);
      if (highest[0] === itemId && v.active[itemId] !== id) return fail('MISSING_ACTIVE', 'prem.vault.active');
    }
    return { status: 'valid', catalogueRevision: 1, purchases: receipts.length, reservations: undoable };
  }
  return Object.freeze({ catalogue, validate });
})();
