/* Long-game phase B: the first-reset Legacy package. Off unless lgb=1 (or GameFeatures enables it), so the old economy stays available for comparison.
   Pure rules only: Ops wires the effects in, this file owns the track tables, the dependencies and the one-time save migration.
   All numbers are tuning experiments; the balance harness can override them through window.__TUNE.LGB. */
window.LegacyB = (() => {
  'use strict';
  const VERSION = 1;
  const defaults = {
    press:  { max: 4, costs: [5, 15, 40, 100], mult: 2, tail: { ranks: 56, mult: 1.5, grow: 2.2 } },        // automatic typing, 16x at rank IV, then x1.5 a rank with no end in practice (each rank costs 2.2x the last)
    keeper: { max: 3, costs: [5, 15, 40], mult: 2, tail: { ranks: 57, mult: 1.5, grow: 2.2 } },             // banking action budget, 8x at rank III, then x1.5 a rank
    power:  { max: 4, costs: [10, 25, 60, 150], mult: 1.5, tail: { ranks: 56, mult: 1.25, grow: 2.2 } },     // eligible sale income, about 5.06x at rank IV, then x1.25 a rank
    control: { ledger: 10, buyer: 15, blueprint: 20, foreman: 30 },  // Rebuild Ledger, Machine Buyer, Publisher Blueprint, Printing Foreman (phase C)
    powerNeeds: false,                                           // true makes Publishing Power need Printing Press I and Quick Keepers I (off: it is open from the first star)
    crewRefund: 30,                                              // the old Veteran Crew price, returned once because the crew becomes free
    bundle: { sizes: [1, 2, 4, 8], pct: [.10, .25, .60] },       // Publisher Bundles: titles sold per publisher action, priced as a share of the next machine
    drive:  { mult: 1.4, pct: [.10, .25, .60] },                 // Machine Drive: automatic typing per rank, separate from letter-training ranks
    batch:  { base: 4, pct: [.10, .25, .60] },                   // Keeper Batches: keeper actions per tick, doubling per rank (8 / 16 / 32 from a baseline of 4)
    dict:   { pct: [.25], minPrinting: 2, perBand: .10, cap: .20 },                       // Shared Dictionary: extra missing-word swap chance per adjacent owned machine band, bounded
    editorial: { pct: [.25], minPrinting: 1 },                    // Editorial Desk (needs the Rebuild Ledger): the goal's words are reserved before surplus publishing
    genre: { pct: [.25], minPrinting: 1, boost: 1.3, cost: .92 },  // Genre Production Run (needs an Imprint genre): the genre's machines type faster, the others a little slower
    backlist: { pct: [.25], minPrinting: 2, milestones: [25, 50, 100, 200], step: .10 }   // Backlist Logistics: publisher sells faster at catalog milestones (titles kept across Printings)
  };
  const tune = () => (typeof window !== 'undefined' && window.__TUNE && window.__TUNE.LGB) || {};
  const cfg = () => ({ ...defaults, ...tune() });
  const enabled = () => !!(window.GameFeatures && window.GameFeatures.enabled('lgb'));
  const integer = n => Number.isSafeInteger(n) && n >= 0;

  /* old tracks, kept only to price what existing owners already paid */
  const costRamp = (n, base, grow) => Array.from({ length: n }, (_, i) => Math.round(base * Math.pow(grow, i)));
  const OLD = { speed: { costs: costRamp(10, 20, 1.42), step: .1 }, keeper: { costs: costRamp(8, 25, 1.5), step: .1 }, crew: { costs: [30] } };
  const spent = (id, rank) => OLD[id].costs.slice(0, Math.min(rank, OLD[id].costs.length)).reduce((a, b) => a + b, 0);

  /* new rank id -> its track: the stored ids stay speed/keeper/power so saves and aliases keep working */
  /* a track may carry a tail: past its listed ranks every further rank multiplies by tail.mult and costs tail.grow times the last (tuned tracks without a tail behave as they always did) */
  const tailed = new WeakMap();
  const withTail = t => {
    if (!t || !t.tail) return t;
    if (!tailed.has(t)) { const costs = t.costs.slice(); for (let k = 0; k < t.tail.ranks; k++) costs.push(Math.round(costs[costs.length - 1] * t.tail.grow)); tailed.set(t, { ...t, base: t.max, max: t.max + t.tail.ranks, costs }); }
    return tailed.get(t);
  };
  const track = id => withTail(({ speed: cfg().press, keeper: cfg().keeper, power: cfg().power })[id]);
  const mult = (id, rank) => {
    const t = track(id);
    if (!t) return 1;
    const r = Math.min(Math.max(0, rank | 0), t.max), base = t.base ?? t.max;
    return Math.pow(t.mult, Math.min(r, base)) * (t.tail ? Math.pow(t.tail.mult, Math.max(0, r - base)) : 1);
  };
  /* The temporary bridge: only when a tuned track cannot cover an old benefit. The old spend was refunded in full, and the old benefit
     stays as a non-stacking floor until any new rank of that track is bought, which replaces it in the same state write. */
  const bridgeMult = (legacy, id) => {
    const ledger = legacy && legacy.mig && legacy.mig.ledger;
    if (!ledger || !Array.isArray(ledger.bridge) || !ledger.bridge.includes(id) || ((legacy.ups || {})[id] || 0) > 0) return 1;
    return 1 + OLD[id].step * ((ledger.from && ledger.from[id]) || 0);
  };
  const bridged = legacy => ['speed', 'keeper'].filter(id => bridgeMult(legacy, id) > 1).map(id => ({ id, mult: bridgeMult(legacy, id) }));
  const speedMult = legacy => Math.max(mult('speed', ((legacy && legacy.ups) || {}).speed), bridgeMult(legacy, 'speed'));
  const keeperMult = legacy => Math.max(mult('keeper', ((legacy && legacy.ups) || {}).keeper), bridgeMult(legacy, 'keeper'));
  const pressMult = rank => mult('speed', rank);
  const powerMult = rank => mult('power', rank);
  /* keeper banking is stored as an additive speed bonus, matching the old divisor: 1 + extras + bonus */
  const keeperBonus = rank => mult('keeper', rank) - 1;
  const cost = (id, rank) => track(id)?.costs[rank];
  /* Publishing Power needs Printing Press I and Quick Keepers I */
  const locked = (id, ups) => id === 'power' && cfg().powerNeeds && !((ups.speed || 0) >= 1 && (ups.keeper || 0) >= 1) ? 'Needs Printing Press I and Quick Keepers I' : '';

  /* Publisher Bundles (ordinary shop, resets with the run). Priced against a fixed machine price, never the live wallet:
     the next machine not yet owned, or the last band once every machine is owned. */
  const FAMILIES = ['drive', 'batch', 'bundle', 'dict', 'backlist', 'editorial', 'genre'];
  const minPrinting = key => cfg()[key].minPrinting || 1;
  const rankMax = key => cfg()[key].pct.length;
  const clampRank = (key, rank) => Math.min(Math.max(0, rank | 0), rankMax(key));
  const rankCost = (key, rank, refPrice, round = n => n) => rank >= 0 && rank < rankMax(key) && refPrice > 0 ? round(cfg()[key].pct[rank] * refPrice) : null;
  const rankLocked = (key, printing, pubTier, extra = {}) => key === 'editorial' && printing >= 1 && !extra.ledger ? 'Needs Rebuild Ledger' : key === 'genre' && printing >= 1 && !extra.genre ? 'Needs an Imprint genre' : printing < minPrinting(key) ? (minPrinting(key) === 1 ? 'Unlocks after your first Printing' : `Unlocks at Printing ${minPrinting(key)}`) : key === 'bundle' && pubTier < 1 ? 'Needs the Publisher’s assistant' : '';
  /* adjacent bands that are owned, as a chance to swap a surplus letter for a missing one; bounded */
  const dictChance = (rank, adjacentOwned) => rank > 0 ? Math.min(cfg().dict.cap, cfg().dict.perBand * Math.max(0, adjacentOwned | 0)) : 0;
  /* publisher interval multiplier (1 = unchanged): one step per catalog milestone reached, capped at all milestones */
  const backlistFactor = (rank, catalog) => rank > 0 ? 1 - cfg().backlist.step * cfg().backlist.milestones.filter(m => catalog >= m).length : 1;
  const driveMult = rank => Math.pow(cfg().drive.mult, clampRank('drive', rank));
  /* Genre Production Run: machines in the Imprint genre's bands type faster, every other machine a little slower */
  const genreSpeed = (rank, inGenre) => rank > 0 ? (inGenre ? cfg().genre.boost : cfg().genre.cost) : 1;
  const batchCap = rank => cfg().batch.base * Math.pow(2, clampRank('batch', rank));
  const bundleMax = () => rankMax('bundle');
  const bundleSize = rank => cfg().bundle.sizes[clampRank('bundle', rank)];
  const bundleCost = (rank, refPrice, round) => rankCost('bundle', rank, refPrice, round);
  const bundleLocked = (printing, pubTier) => rankLocked('bundle', printing, pubTier);

  /* smallest new rank whose benefit is not below what the old rank gave; null when the new track cannot cover it */
  function mapRank(id, oldRank) {
    if (!oldRank) return 0;
    const owned = 1 + OLD[id].step * oldRank, max = track(id).max;
    for (let r = 1; r <= max; r++) if (mult(id, r) >= owned - 1e-9) return r;
    return null;
  }

  /* Versioned and idempotent. Refunds touch spendable stars only, never lifetime totals or eligibility.
     Returns the next legacy object and a ledger entry; running it again returns the input unchanged. */
  function migrate(legacy, printing = 0) {
    if (!legacy || legacy.mig?.lgb >= VERSION) return { legacy, changed: false };
    const ups = { ...(legacy.ups || {}) }, from = { speed: ups.speed || 0, keeper: ups.keeper || 0, crew: ups.crew || 0 };
    const ledger = { v: VERSION, from, credit: {}, refund: {}, bridge: [] };
    let refund = 0;
    for (const id of ['speed', 'keeper']) {
      const rank = mapRank(id, from[id]);
      if (rank === null) {
        // the new track cannot cover the old benefit: refund everything and bridge nothing silently
        ledger.refund[id] = spent(id, from[id]); ledger.bridge.push(id); ups[id] = 0; refund += ledger.refund[id];
        continue;
      }
      const credit = (track(id).costs || []).slice(0, rank).reduce((a, b) => a + b, 0), back = Math.max(0, spent(id, from[id]) - credit);
      ledger.credit[id] = credit; ledger.refund[id] = back; ups[id] = rank; refund += back;
    }
    if (from.crew) { ledger.refund.crew = cfg().crewRefund; refund += cfg().crewRefund; }
    else if (printing >= 1) { ups.crew = 1; ledger.granted = { crew: true }; }
    const stars = (legacy.stars || 0) + refund;
    // anyone past a first Printing pressed it by hand: automatic Printing never existed for them
    const fm = printing >= 1 && !legacy.fm ? { fm: { v: 1, enabled: false, policy: 'fast', target: 10, reserve: 10, order: [], bp: null, manual: true } } : {};
    return { legacy: { ...legacy, ...fm, stars, ups, mig: { lgb: VERSION, ledger } }, changed: true, refund };
  }

  /* a brand-new save already holds new-style ranks, so it is stamped as migrated and never refunded */
  const stamp = () => ({ lgb: VERSION, ledger: { v: VERSION, from: { speed: 0, keeper: 0, crew: 0 }, credit: {}, refund: {}, bridge: [] } });

  /* shape check for saves before trusting the ledger */
  const validLedger = m => m === undefined || (m && m.lgb === VERSION && m.ledger && m.ledger.v === VERSION && integer(m.ledger.from?.speed) && integer(m.ledger.from?.keeper));

  /* the Legacy shop: replaces the old speed/keeper tracks, hides the paid crew, adds Publishing Power */
  function shop(base) {
    const t = { ...cfg(), press: track('speed'), keeper: track('keeper'), power: track('power') }, K = [[1e12, 'T'], [1e9, 'B'], [1e6, 'M'], [1e3, 'K']], x0 = n => (Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, ''));
    const x = n => { const u = K.find(([v]) => n >= v); return u ? Number((n / u[0]).toPrecision(3)) + u[1] : x0(n); };
    const out = base.filter(u => u.id !== 'crew').map(u => {
      if (u.id === 'speed') return { ...u, name: 'Printing Press', max: t.press.max, costs: t.press.costs.slice(), now: lv => '×' + x(mult('speed', lv)), unit: 'automatic typing' };
      if (u.id === 'keeper') return { ...u, name: 'Quick Keepers', max: t.keeper.max, costs: t.keeper.costs.slice(), now: lv => '×' + x(mult('keeper', lv)), unit: 'keeper banking' };
      return u;
    });
    const at = out.findIndex(u => u.id === 'keeper') + 1;
    out.splice(at, 0, { id: 'power', name: 'Publishing Power', ico: 'd-reprints', max: t.power.max, costs: t.power.costs.slice(), now: lv => '×' + x(mult('power', lv)), unit: 'title sale income' });
    const on = lv => lv ? 'Owned' : 'Locked';
    out.push(
      { id: 'ledger', name: 'Rebuild Ledger', ico: 'a-ledger', max: 1, costs: [t.control.ledger], now: () => '', unit: '', tip: 'Remembers your purchase order and spending reserve' },
      { id: 'buyer', name: 'Machine Buyer', ico: 'a-buyer', max: 1, costs: [t.control.buyer], now: () => '', unit: '', tip: 'Buys machines and their upgrades in that order' },
      { id: 'blueprint', name: 'Publisher Blueprint', ico: 'a-blueprint', max: 1, costs: [t.control.blueprint], now: () => '', unit: '', tip: 'Restores your publisher setup each room' },
      { id: 'foreman', name: 'Printing Foreman', ico: 'a-foreman', max: 1, costs: [t.control.foreman], now: () => '', unit: '', tip: 'Can press Printing for you at a star target' });
    return out;
  }

  return Object.freeze({ VERSION, enabled, cfg, bridgeMult, bridged, speedMult, keeperMult, pressMult, powerMult, keeperBonus, cost, locked, mapRank, migrate, stamp, validLedger, shop, spent, FAMILIES, genreSpeed, minPrinting, dictChance, backlistFactor, rankMax, rankCost, rankLocked, driveMult, batchCap, bundleMax, bundleSize, bundleCost, bundleLocked });
})();
