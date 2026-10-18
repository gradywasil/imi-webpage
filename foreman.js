/* Long-game phase C: the self-running room. Pure rules for the Rebuild Ledger, Machine Buyer, Publisher Blueprint and Printing Foreman.
   Ops owns every real purchase and reset; this file only decides what is next and why it waits. Settings live in legacy.fm, so they survive Printing,
   Imprint and Estate with the rest of the Legacy record. Numbers are tuning experiments. */
window.Foreman = (() => {
  'use strict';
  const RATE_DROP = .5, RATE_WINDOW = 60, RATE_MIN_SPAN = 45, MAX_CYCLES = 8, PASSIVE_MIN = 5, PASSIVE_MAX_CYCLES = 200, PASSIVE_MAX_SECONDS = 7 * 86400, MAX_ORDER = 120, MIN_SECS = 30, MAX_RESERVE = 50, MAX_TARGET = 100000, MAX_QUEUE = 5;
  const POLICIES = ['fast', 'frontier', 'explore'];
  const ROUTES = ['salvage', 'manuscript'];
  const defaults = { v: 1, enabled: false, policy: 'fast', target: 10, reserve: 10, order: [], bp: null, manual: false, route: 'salvage', cycles: [], autoCycles: 0, passive: false, minSecs: 30, mode: 'target', loadouts: [null, null], queue: [], genre: false };
  const object = v => v !== null && typeof v === 'object' && !Array.isArray(v);
  const settings = legacy => ({ ...defaults, ...(legacy && object(legacy.fm) ? legacy.fm : {}) });
  const SB = ['drive', 'batch', 'bundle', 'dict', 'backlist', 'editorial', 'genre'];

  /* a purchase entry: {k:'desk',i} | {k:'sb',key,to} | {k:'pub',to}; the Legacy upgrade that permits it is its owner */
  function validEntry(e) {
    if (!object(e)) return false;
    if (e.k === 'desk') return Number.isInteger(e.i) && e.i >= 1 && e.i <= 5;
    if (e.k === 'sb') return SB.includes(e.key) && Number.isInteger(e.to) && e.to >= 1 && e.to <= 3;
    if (e.k === 'pub') return Number.isInteger(e.to) && e.to >= 1 && e.to <= 3;
    return false;
  }
  const owner = e => e.k === 'pub' || e.k === 'sb' && (e.key === 'bundle' || e.key === 'backlist') ? 'blueprint' : 'buyer';
  const validCycles = c => c === undefined || Array.isArray(c) && c.length <= MAX_CYCLES && c.every(x => object(x) && Number.isInteger(x.sec) && x.sec >= 0 && Number.isInteger(x.gain) && x.gain >= 1);
  const MODES = ['target', 'rate'];
  const validLoadout = l => l === null || object(l) && POLICIES.includes(l.policy) && Number.isInteger(l.target) && l.target >= 1 && l.target <= MAX_TARGET && Number.isInteger(l.reserve) && l.reserve >= 0 && l.reserve <= MAX_RESERVE && l.reserve % 5 === 0 &&
    (l.route === undefined || ROUTES.includes(l.route)) && Number.isInteger(l.minSecs) && l.minSecs >= MIN_SECS && l.minSecs <= 3600 && MODES.includes(l.mode);
  const validBp = b => b === null || object(b) && ['any', 'fair', 'hot'].includes(b.rule) && typeof b.on === 'boolean' && Number.isInteger(b.tier) && b.tier >= 1 && b.tier <= 3;
  function valid(fm) {
    if (fm === undefined) return true;
    return object(fm) && fm.v === 1 && typeof fm.enabled === 'boolean' && POLICIES.includes(fm.policy) && Number.isInteger(fm.target) && fm.target >= 1 && fm.target <= MAX_TARGET &&
      Number.isInteger(fm.reserve) && fm.reserve >= 0 && fm.reserve <= MAX_RESERVE && fm.reserve % 5 === 0 && typeof fm.manual === 'boolean' && (fm.route === undefined || ROUTES.includes(fm.route)) && validCycles(fm.cycles) && (fm.autoCycles === undefined || Number.isSafeInteger(fm.autoCycles) && fm.autoCycles >= 0) && (fm.passive === undefined || typeof fm.passive === 'boolean') && (fm.minSecs === undefined || Number.isInteger(fm.minSecs) && fm.minSecs >= MIN_SECS && fm.minSecs <= 3600) && (fm.mode === undefined || MODES.includes(fm.mode)) &&
      (fm.queue === undefined || Array.isArray(fm.queue) && fm.queue.length <= MAX_QUEUE && fm.queue.every(n => Number.isInteger(n) && n >= 1 && n <= MAX_TARGET)) && (fm.genre === undefined || typeof fm.genre === 'boolean') &&
      (fm.loadouts === undefined || Array.isArray(fm.loadouts) && fm.loadouts.length === 2 && fm.loadouts.every(validLoadout)) && validBp(fm.bp) &&
      Array.isArray(fm.order) && fm.order.length <= MAX_ORDER && fm.order.every(validEntry);
  }

  /* shop gates for the four Legacy upgrades; '' means buyable */
  function locked(id, ups, printing, fm) {
    const f = fm || defaults;
    if (id === 'ledger') return printing < 2 ? 'Unlocks at Printing 2' : '';
    if (id === 'buyer' || id === 'blueprint') return printing < 2 ? 'Unlocks at Printing 2' : !ups.ledger ? 'Needs Rebuild Ledger' : '';
    if (id === 'foreman') return printing < 3 ? 'Unlocks at Printing 3' : !(ups.buyer && ups.blueprint) ? 'Needs Machine Buyer and Publisher Blueprint' : !f.manual ? 'Needs one Printing pressed by hand' : '';
    return null;
  }
  const IDS = ['ledger', 'buyer', 'blueprint', 'foreman'];

  /* appends are capped; an entry that repeats (same thing, higher rank) replaces nothing, it simply follows */
  const record = (run, entry) => validEntry(entry) && run.length < MAX_ORDER ? [...run, entry] : run;
  /* a run that bought nothing meaningful never wipes a good saved order */
  const closeRun = (saved, run) => Array.isArray(run) && run.filter(validEntry).length >= 3 ? run.filter(validEntry).slice(0, MAX_ORDER) : (saved || []);

  /* Walk the saved order. Stop at the first unaffordable step so cheaper later items never jump ahead of what is being saved for.
     view: has(e) satisfied, prereq(e) an earlier entry that must come first or null, cost(e) price or null when it cannot be bought now,
     why(e) text for a blocked step, name(e) label, balance. */
  function plan(order, view, opts) {
    const reserve = Math.min(MAX_RESERVE, Math.max(0, opts.reserve || 0)) / 100, usable = view.balance * (1 - reserve);
    let blocked = null;
    for (const entry of (order || []).slice(0, MAX_ORDER)) {
      if (!validEntry(entry) || !opts.owned[owner(entry)]) continue;
      if (opts.policy === 'frontier' && entry.k !== 'desk') continue;
      if (view.has(entry)) continue;
      const step = view.prereq(entry) || entry, cost = view.cost(step);
      if (cost === null) { blocked ??= view.why(step); continue; }
      if (cost > usable) return { action: null, wait: `Saving for ${view.name(step)}` };
      return { action: step, cost };
    }
    return { action: null, wait: blocked || 'Nothing left to buy' };
  }

  /* the ordinary-Printing rule: pending stars at or above the target, after a short accounting interval of real production */
  function due(set, stars, secs, hold, rate) {
    if (!set.enabled || set.policy !== 'fast') return { due: false, why: set.enabled ? 'This policy never presses Printing on its own' : 'Off' };
    if (hold) return { due: false, why: 'The Annex asked to hold the push' };
    if (!(stars >= 1)) return { due: false, why: 'Waiting for the first star' };
    if (stars < set.target) return { due: false, why: `Reset at ${set.target} stars (${stars} now)` };
    const floor = Math.max(MIN_SECS, set.minSecs || 0);
    if (secs < floor) return { due: false, why: `Settling production (${Math.ceil(floor - secs)}s)` };
    // rate mode (Estate): press once the room's recent pace has fallen well under what the Foreman's own last Printings managed. Too little history, or no estimate yet, behaves like a plain target.
    if (set.mode === 'rate' && rate && rate.recent !== null && rate.typical > 0 && rate.recent >= RATE_DROP * rate.typical) return { due: false, why: 'Still producing well' };
    return { due: true, why: 'Ready' };
  }
  /* what a frozen automatic reset must still match when it is validated after a reload */
  const decision = (set, quote) => ({ version: 1, policy: set.policy, target: set.target, gain: quote.gain, earned: quote.earned, config: JSON.stringify(set) });
  const validDecision = (d, set, ups, quote) => !!(object(d) && d.version === 1 && ups.foreman && set.enabled && set.policy === 'fast' && d.policy === 'fast' && d.target === set.target &&
    d.gain === quote.gain && d.earned === quote.earned && d.gain >= d.target && d.config === JSON.stringify(set));

  /* the settings a fresh room inherits: the run just ended becomes the saved order when the Ledger is owned, the publisher setup is remembered when the Blueprint is owned */
  function next(set, ups, run, pub, origin, cycle) {
    const out = { ...set, v: 1 };
    if (origin === 'foreman' && cycle && cycle.gain >= 1) { out.cycles = [...(set.cycles || []), { sec: Math.max(0, Math.round(cycle.sec)), gain: cycle.gain }].slice(-MAX_CYCLES); out.autoCycles = (set.autoCycles || 0) + 1; }
    // queued goals (Estate): each Foreman Printing takes the next saved star target for the room it starts; the last target then stays
    if (origin === 'foreman' && Array.isArray(set.queue) && set.queue.length) { out.target = set.queue[0]; out.queue = set.queue.slice(1); }
    if (ups.ledger) out.order = closeRun(set.order, run);
    if (ups.blueprint && pub && pub.tier >= 1) out.bp = { rule: pub.rule, on: !!pub.on, tier: Math.min(3, pub.tier) };
    if (origin === 'manual') out.manual = true;
    return out;
  }
  /* the free part of the Blueprint: the assistant at tier 1, in the remembered rule, at the start of a room that has none */
  const restore = (set, ups, pub) => ups.blueprint && set.bp && (!pub || !pub.tier) ? { tier: 1, on: set.bp.on, rule: set.bp.rule } : null;

  /* Time away beyond the ordinary offline cap, priced by what the Foreman has actually done: the median of its last five Printings, so one lucky run is not an oracle.
     Whole cycles only, at most 200 and a week. Returns null when mastery is not shown. */
  function passive(set, ups, extraSeconds) {
    if (!set.enabled || !set.passive || set.policy !== 'fast' || !ups.foreman || (set.autoCycles || 0) < PASSIVE_MIN) return null;
    const last = (set.cycles || []).slice(-PASSIVE_MIN);
    if (last.length < PASSIVE_MIN) return null;
    const median = list => { const a = list.slice().sort((x, y) => x - y); return a[Math.floor(a.length / 2)]; };
    const sec = Math.max(MIN_SECS, median(last.map(c => c.sec))), gain = median(last.map(c => c.gain));
    const n = Math.min(PASSIVE_MAX_CYCLES, Math.floor(Math.min(Math.max(0, extraSeconds), PASSIVE_MAX_SECONDS) / sec));
    return n > 0 ? { n, sec, gain, stars: n * gain } : null;
  }
  /* The rolling estimator: stars per second over the last minute, from [seconds, stars] samples. Null until there are 45 seconds of them, never negative. */
  function recentRate(samples) {
    if (!Array.isArray(samples) || samples.length < 2) return null;
    const last = samples[samples.length - 1], from = samples.find(s => s[0] >= last[0] - RATE_WINDOW) || samples[0];
    const span = last[0] - from[0];
    return span >= RATE_MIN_SPAN ? Math.max(0, (last[1] - from[1]) / span) : null;
  }
  /* what the last Printings managed: the median stars per second of the recorded cycles */
  const typicalRate = set => { const c = (set.cycles || []).slice(-PASSIVE_MIN).filter(x => x.sec > 0).map(x => x.gain / x.sec).sort((a, b) => a - b); return c.length >= PASSIVE_MIN ? c[Math.floor(c.length / 2)] : 0; };
  /* queued goals: the next star targets, in order. Adding follows the last one by ten stars; dropping removes one entry */
  const queueAdd = set => { const q = Array.isArray(set.queue) ? set.queue : []; if (q.length >= MAX_QUEUE) return set; return { ...set, queue: [...q, Math.min(MAX_TARGET, (q.length ? q[q.length - 1] : set.target) + 10)] }; };
  const queueDrop = (set, i) => Array.isArray(set.queue) && Number.isInteger(i) && i >= 0 && i < set.queue.length ? { ...set, queue: set.queue.filter((_, k) => k !== i) } : set;
  /* two saved loadouts of the control panel */
  const pick = s => ({ policy: s.policy, target: s.target, reserve: s.reserve, route: s.route || 'salvage', minSecs: s.minSecs || MIN_SECS, mode: s.mode || 'target' });
  const saveLoadout = (set, i) => i === 0 || i === 1 ? { ...set, loadouts: [0, 1].map(k => k === i ? pick(set) : (set.loadouts || [null, null])[k] || null) } : set;
  const applyLoadout = (set, i) => { const l = (set.loadouts || [])[i]; return l ? { ...set, ...l } : set; };
  return Object.freeze({ MAX_QUEUE, queueAdd, queueDrop, PASSIVE_MIN, MODES, recentRate, typicalRate, saveLoadout, applyLoadout, passive, MIN_SECS, MAX_ORDER, POLICIES, ROUTES, IDS, defaults, settings, valid, validEntry, owner, locked, record, closeRun, plan, due, decision, validDecision, next, restore });
})();
