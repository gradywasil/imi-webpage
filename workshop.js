/* Long-game phase D: expeditions supply the Machine Workshop. Account-level and persistent: everything lives in meta.workshop, which every reset keeps.
   Pure rules first (testable without a browser), then a small Ops extension for the tab. No random failure, no daily window, no repair tax.
   Numbers are tuning experiments. */
window.Workshop = (() => {
  'use strict';
  const VERSION = 1, UNLOCK_PRINTING = 2, KEEP_HISTORY = 40;
  const ROUTES = {
    salvage: { name: 'Salvage Route', pct: .20, seconds: 900, parts: 8, lead: false, blurb: 'Pulls scrap from the old foundry. The most Parts.' },
    manuscript: { name: 'Manuscript Route', pct: .30, seconds: 1800, parts: 3, lead: true, blurb: 'Follows a rumour to a named manuscript. Fewer Parts, a guaranteed lead.' },
    archive: { name: 'Deep Archive', pct: .40, seconds: 1800, parts: 20, lead: false, needs: 'anthology', blurb: 'Digs where the restored anthology points. More Parts for the time than the Salvage Route.' }
  };
  const RECIPES = {
    carriage: { name: 'Quick Carriage', parts: 6, text: 'One machine types 1.5x faster. Keepers and sales are unchanged.' },
    tray: { name: 'Wide Keeper Tray', parts: 8, text: 'One machine\'s keeper banks two words an action. It makes no letters and finishes no word for you.' },
    press: { name: 'Edition Press', parts: 10, text: 'One machine\'s reissued titles sell for 1.3x. Everything else sells as usual.' },
    typebar: { name: 'Precision Typebar', parts: 12, needs: 'anthology', text: 'One machine leans toward the letters your goal is missing, and types 0.85x as fast. Targeted, not faster.' }
  };
  /* Lost Library: three small collections, each opened by a manuscript lead. Deposits are words from the room bank, committed once and kept through every reset. */
  const RESTORE = {
    anthology: { name: 'The damaged anthology', bands: { 0: 6, 1: 4 }, bind: 1, reward: 'the Precision Typebar recipe and the Deep Archive route' },
    almanac: { name: 'A water-stained almanac', bands: { 1: 6, 2: 4 }, bind: 2, reward: 'the Collector Press build and the Roster Edition' },
    atlas: { name: 'A torn atlas of the canopy', bands: { 2: 6, 3: 4 }, bind: 3, reward: 'the Prestige Editions build and the Twin Band Edition' }
  };
  /* Special editions: authored challenges. The first clear is a permanent mastery; repeats pay a bounded handful of Parts. */
  const SPECIAL = {
    roster: { name: 'Roster Edition', needs: 'almanac', mastery: 'Salvage trips take 20% less time', route: 'salvage' },
    twin: { name: 'Twin Band Edition', needs: 'atlas', mastery: 'Manuscript trips take 20% less time', route: 'manuscript' }
  };
  const REPEAT_PARTS = 2, MAX_REPEATS = 5;
  const LEADS = [
    { id: 'anthology', name: 'The damaged anthology' },
    { id: 'almanac', name: 'A water-stained almanac' },
    { id: 'atlas', name: 'A torn atlas of the canopy' }
  ];
  const DUPLICATE_PARTS = 2, GROUPS = 6, MAX_QUEUE = 2, KEEP_TOOK = 60;
  /* A route can also be paid in words or letters this room produced (typist-made letters only: bonuses and swaps never count, so the figure cannot overcount). Fixed amounts, shown before sending. */
  const FUNDS = ['bananas', 'words', 'letters'];
  const FUND_COST = { words: { salvage: 60, manuscript: 90, archive: 120 }, letters: { salvage: 360, manuscript: 540, archive: 720 } };
  const FUND_NOUN = { bananas: 'bananas', words: 'words', letters: 'letters' };
  const EFFECT = { carriage: 1.5, press: 1.3 };
  const object = v => v !== null && typeof v === 'object' && !Array.isArray(v);
  const int = n => Number.isSafeInteger(n) && n >= 0;

  const fresh = () => ({ v: VERSION, parts: 0, seq: 0, mCount: 0, leads: [], dupes: 0, done: 0, attachments: [], equipped: {}, exp: null, queue: [], shelf: [], equippedB: {}, clock: { last: 0 }, history: [], restore: {}, restored: {}, mastery: {}, repeats: 0 });
  const norm = w => ({ restore: {}, restored: {}, mastery: {}, repeats: 0, queue: [], shelf: [], equippedB: {}, ...w });
  function valid(w) {
    if (w === undefined) return true;
    if (object(w)) w = norm(w);
    if (!object(w) || w.v !== VERSION || ![w.parts, w.seq, w.mCount, w.dupes, w.done].every(int) || !Array.isArray(w.leads) || !w.leads.every(id => LEADS.some(l => l.id === id)) ||
        new Set(w.leads).size !== w.leads.length || !Array.isArray(w.attachments) || !w.attachments.every(a => object(a) && typeof a.id === 'string' && RECIPES[a.type]) ||
        new Set(w.attachments.map(a => a.id)).size !== w.attachments.length || !object(w.equipped) || !object(w.clock) || !int(w.clock.last) || !Array.isArray(w.history)) return false;
    if (!object(w.restore) || !object(w.restored) || !object(w.mastery) || !int(w.repeats) || w.repeats > MAX_REPEATS) return false;
    for (const [id, r] of Object.entries(w.restore)) {
      if (!RESTORE[id] || !w.leads.includes(id) || !object(r) || !object(r.dep) || typeof r.armed !== 'boolean') return false;
      for (const [b, n] of Object.entries(r.dep)) if (RESTORE[id].bands[b] === undefined || !int(n) || n > RESTORE[id].bands[b]) return false;
    }
    if (!Object.entries(w.restored).every(([id, v]) => RESTORE[id] && v === true && w.leads.includes(id)) || !Object.entries(w.mastery).every(([id, v]) => SPECIAL[id] && v === true)) return false;
    const used = new Set();
    for (const [g, id] of Object.entries(w.equipped)) {
      if (!/^[0-5]$/.test(g) || used.has(id) || !w.attachments.some(a => a.id === id)) return false;     // one attachment, one place
      used.add(id);
    }
    if (!object(w.equippedB)) return false;
    for (const [g, id] of Object.entries(w.equippedB)) {
      if (!/^[0-5]$/.test(g) || used.has(id) || !w.attachments.some(a => a.id === id) || !secondSlot(w)) return false;
      used.add(id);
      const first = w.equipped[g];
      if (first && typeOf(w, first) === typeOf(w, id)) return false;                                     // two of the same kind never stack on one machine
    }
    const entry = (x, states) => object(x) && typeof x.id === 'string' && !!ROUTES[x.route] && int(x.cost) && int(x.need) && x.need > 0 && int(x.elapsed) && x.elapsed <= x.need && states.includes(x.state) && (x.fund === undefined || FUNDS.includes(x.fund)) && (x.took === undefined || object(x.took));
    const x = w.exp;
    if (!(x === null || entry(x, ['away', 'returned']) && (x.state === 'returned') === (x.elapsed >= x.need))) return false;
    if (!Array.isArray(w.queue) || w.queue.length > MAX_QUEUE || !w.queue.every(q => entry(q, ['queued']) && q.elapsed === 0)) return false;
    if (!Array.isArray(w.shelf) || w.shelf.length > MAX_QUEUE + 1 || !w.shelf.every(q => entry(q, ['returned']) && q.elapsed === q.need)) return false;
    if ((w.queue.length || w.shelf.length) && x === null) return false;
    return new Set([x?.id, ...w.queue.map(q => q.id), ...w.shelf.map(q => q.id)].filter(Boolean)).size === (x ? 1 : 0) + w.queue.length + w.shelf.length;
  }

  const unlocked = (w, printing) => printing >= UNLOCK_PRINTING || !!(w && (w.parts > 0 || w.exp || w.attachments.length));
  /* a mastery from a special edition shortens one route by a fifth */
  const routeSeconds = (w, route) => { const m = Object.entries(SPECIAL).find(([id, s]) => s.route === route && (w.mastery || {})[id]); return m ? Math.round(ROUTES[route].seconds * .8) : ROUTES[route].seconds; };
  /* Mastery rewards: the Roster Edition opens a second attachment slot on every machine, the Twin Band Edition opens a queue of two more expeditions. */
  const secondSlot = w => !!(w.mastery || {}).roster;
  const queueMax = w => (w.mastery || {}).twin ? MAX_QUEUE : 0;
  const typeOf = (w, id) => (w.attachments.find(a => a.id === id) || {}).type;
  const fundOf = x => x.fund || 'bananas';
  /* what a route would cost and pay right now. ctx: printing, ref (fixed machine price), fundable (eligible bananas), fundWords, fundLetters
     (what this room produced and still has spare), challenge, round. fund picks which of the three pays. */
  function quote(w, route, ctx, fund = 'bananas') {
    const r = ROUTES[route], f = FUNDS.includes(fund) ? fund : 'bananas';
    const cost = f === 'bananas' ? (ctx.round || (n => n))(r.pct * ctx.ref) : FUND_COST[f][route];
    const have = f === 'bananas' ? ctx.fundable : f === 'words' ? ctx.fundWords || 0 : ctx.fundLetters || 0;
    const out = { route, fund: f, name: r.name, cost, seconds: routeSeconds(w, route), parts: r.parts + (ctx.bonus && r.lead ? ctx.bonus : 0), lead: r.lead && w.mCount < LEADS.length ? LEADS[w.mCount] : null,
      dupParts: r.lead && w.mCount >= LEADS.length ? DUPLICATE_PARTS : 0, ok: false, why: '', queued: false };
    const waiting = (w.queue || []).length, room = queueMax(w);
    if (!unlocked(w, ctx.printing)) out.why = `Unlocks at Printing ${UNLOCK_PRINTING}`;
    else if (r.needs && !(w.restored || {})[r.needs]) out.why = `Restore ${RESTORE[r.needs].name.toLowerCase()} first`;
    else if (w.exp && !room) out.why = 'One expedition at a time';
    else if (w.exp && waiting >= room) out.why = 'The expedition queue is full';
    else if (ctx.challenge) out.why = 'Not during a challenge';
    else if (f === 'bananas' && !(ctx.ref > 0)) out.why = 'No machine to measure against';
    else if (have < cost) out.why = `Needs ${cost} ${FUND_NOUN[f]} ${f === 'bananas' ? 'earned' : 'produced'} this room (${Math.floor(have)} eligible)`;
    else { out.ok = true; out.queued = !!w.exp; }
    return out;
  }
  /* departure commits the inputs once under a fresh id; the clock is account-level elapsed time. With one already away, the trip waits in the queue (funded now). */
  function launch(w, route, ctx, now, fund = 'bananas', took = null) {
    const q = quote(w, route, ctx, fund);
    if (!q.ok) return { ok: false, why: q.why };
    const seq = w.seq + 1;
    const x = { id: `x${seq}`, route, cost: q.cost, need: q.seconds, elapsed: 0, state: q.queued ? 'queued' : 'away' };
    if (q.fund !== 'bananas') x.fund = q.fund;
    if (took && Object.keys(took).length) x.took = took;
    if (q.queued) return { ok: true, cost: q.cost, fund: q.fund, queued: true, w: { ...norm(w), seq, queue: [...(w.queue || []), x] } };
    return { ok: true, cost: q.cost, fund: q.fund, queued: false, w: { ...norm(w), seq, exp: x, clock: { last: now } } };
  }
  /* Elapsed time never goes backwards: a clock that moved back adds nothing and restarts from there. A trip that finishes starts the next queued one at that
     moment, so a long absence runs the whole queue; finished trips wait on the shelf for collection. */
  function advance(w, now) {
    if (!w.exp || w.exp.state !== 'away') return w;
    const gap = Math.max(0, Math.floor((now - w.clock.last) / 1000));
    const last = gap > 0 ? w.clock.last + gap * 1000 : (now < w.clock.last ? now : w.clock.last);
    let left = gap, exp = w.exp, queue = [...(w.queue || [])], shelf = [...(w.shelf || [])];
    for (;;) {
      const take = Math.min(exp.need - exp.elapsed, left);
      exp = { ...exp, elapsed: exp.elapsed + take }; left -= take;
      if (exp.elapsed < exp.need) { exp = { ...exp, state: 'away' }; break; }
      if (!queue.length) { exp = { ...exp, state: 'returned' }; break; }
      shelf.push({ ...exp, state: 'returned' });
      exp = { ...queue.shift(), state: 'away', elapsed: 0 };
    }
    return { ...norm(w), clock: { last }, exp, queue, shelf };
  }
  /* The reward is paid exactly once: the trip is removed in the same step that grants it. Shelved trips are collected first. */
  function claim(w, bonus = 0) {
    const shelf = w.shelf || [], x = shelf.length ? shelf[0] : w.exp;
    if (!x || x.state !== 'returned') return { ok: false, why: 'Nothing has returned' };
    const r = ROUTES[x.route];
    let parts = r.parts + (r.lead ? bonus : 0), lead = null, dup = false;
    let mCount = w.mCount, leads = w.leads, dupes = w.dupes;
    if (r.lead) {
      if (mCount < LEADS.length) { lead = LEADS[mCount].id; if (!leads.includes(lead)) leads = [...leads, lead]; else { dup = true; parts += DUPLICATE_PARTS; dupes++; } }
      else { dup = true; parts += DUPLICATE_PARTS; dupes++; }
      mCount++;
    }
    const history = [{ id: x.id, route: x.route, parts, lead, dup }, ...w.history].slice(0, KEEP_HISTORY);
    const base = { ...norm(w), parts: w.parts + parts, leads, dupes, mCount, done: w.done + 1, history };
    return { ok: true, parts, lead, dup, w: shelf.length ? { ...base, shelf: shelf.slice(1) } : { ...base, exp: null } };
  }
  /* split a recorded take (word -> count, or desk -> letter -> count) so the share handed back never exceeds what was taken */
  function share(took, amount) {
    const out = {}; let left = Math.max(0, amount | 0);
    const walk = (src, dst) => {
      for (const [k, v] of Object.entries(src || {})) {
        if (left <= 0) break;
        if (object(v)) { dst[k] = {}; walk(v, dst[k]); if (!Object.keys(dst[k]).length) delete dst[k]; }
        else { const n = Math.min(v, left); if (n > 0) { dst[k] = n; left -= n; } }
      }
    };
    walk(took, out);
    return out;
  }
  /* After departure the unconsumed share of the inputs comes back once, and the rest is disclosed as lost. Rewards are forfeited. The next queued trip starts. */
  function cancel(w, floor = n => n, now = 0) {
    const x = w.exp;
    if (!x) return { ok: false, why: 'No expedition' };
    if (x.state === 'returned') return { ok: false, why: 'It has already returned. Collect it.' };
    const refund = floor(x.cost * (1 - x.elapsed / x.need)), queue = [...(w.queue || [])];
    const next = queue.length ? { ...queue.shift(), state: 'away', elapsed: 0 } : null;
    return { ok: true, fund: fundOf(x), refund, lost: x.cost - refund, give: x.took ? share(x.took, refund) : null,
      w: { ...norm(w), exp: next, queue, clock: next ? { last: now || w.clock.last } : w.clock } };
  }
  /* A queued trip has not departed, so cancelling it returns everything it committed. */
  function cancelQueued(w, id) {
    const queue = w.queue || [], at = queue.findIndex(q => q.id === id);
    if (at < 0) return { ok: false, why: 'No such queued expedition' };
    const x = queue[at];
    return { ok: true, fund: fundOf(x), refund: x.cost, give: x.took || null, w: { ...norm(w), queue: queue.filter((_, i) => i !== at) } };
  }

  function craft(w, type) {
    const r = RECIPES[type];
    if (!r) return { ok: false, why: 'Unknown recipe' };
    if (r.needs && !(w.restored || {})[r.needs]) return { ok: false, why: `Restore ${RESTORE[r.needs].name.toLowerCase()} first` };
    if (w.parts < r.parts) return { ok: false, why: `Needs ${r.parts} Parts` };
    const seq = w.seq + 1;
    return { ok: true, w: { ...w, seq, parts: w.parts - r.parts, attachments: [...w.attachments, { id: `a${seq}`, type }] } };
  }
  /* Moving an attachment unequips its old place first, in the same step; a machine holds one attachment, or two once the Roster Edition is mastered (never two of a kind). */
  function equip(w, id, group, slot = 0) {
    if (!w.attachments.some(a => a.id === id)) return { ok: false, why: 'You do not own that attachment' };
    if (!Number.isInteger(group) || group < 0 || group >= GROUPS) return { ok: false, why: 'No such machine' };
    if (slot === 1 && !secondSlot(w)) return { ok: false, why: 'Master the Roster Edition for a second slot' };
    const strip = m => Object.fromEntries(Object.entries(m || {}).filter(([, a]) => a !== id));
    const equipped = strip(w.equipped), equippedB = strip(w.equippedB);
    const other = slot === 1 ? equipped[group] : equippedB[group];
    if (other && typeOf(w, other) === typeOf(w, id)) return { ok: false, why: 'A machine takes one of each kind' };
    if (slot === 1) equippedB[group] = id; else equipped[group] = id;
    return { ok: true, w: { ...norm(w), equipped, equippedB } };
  }
  const unequip = (w, group, slot = 0) => {
    const equipped = { ...w.equipped }, equippedB = { ...(w.equippedB || {}) };
    if (slot === 1) delete equippedB[group]; else delete equipped[group];
    return { ok: true, w: { ...norm(w), equipped, equippedB } };
  };

  const typesAt = (w, group) => [w && w.equipped ? w.equipped[group] : undefined, w && w.equippedB ? w.equippedB[group] : undefined].map(id => id ? typeOf(w, id) : undefined).filter(Boolean);
  const typeAt = (w, group) => typesAt(w, group)[0];
  /* effects are live multipliers, so a change applies from the next moment and never rewrites what was already earned */
  const carriage = (w, group) => typesAt(w, group).includes('carriage') ? EFFECT.carriage : 1;
  const tray = (w, group) => typesAt(w, group).includes('tray');
  const typebarSpeed = (w, group) => typesAt(w, group).includes('typebar') ? .85 : 1;
  const typebar = (w, group) => typesAt(w, group).includes('typebar') ? .25 : 0;
  const press = (w, group, editions) => typesAt(w, group).includes('press') && editions > 0 ? EFFECT.press : 1;

  /* ---- Lost Library ---- */
  const need = (id, band, discount = n => n) => discount(RESTORE[id].bands[band]);
  const progress = (w, id, discount) => {
    const dep = ((w.restore || {})[id] || {}).dep || {};
    return Object.keys(RESTORE[id].bands).map(b => ({ band: +b, have: Math.min(dep[b] || 0, need(id, b, discount)), need: need(id, b, discount) }));
  };
  const complete = (w, id, discount) => progress(w, id, discount).every(p => p.have >= p.need);
  /* Deposits commit once: the caller removes the words from the room first and passes how many it actually took. */
  function deposit(w, id, band, taken, discount) {
    if (!RESTORE[id] || !w.leads.includes(id)) return { ok: false, why: 'Find its lead first' };
    if ((w.restored || {})[id]) return { ok: false, why: 'Already restored' };
    const row = progress(w, id, discount).find(p => p.band === band);
    if (!row) return { ok: false, why: 'That band is not needed' };
    const add = Math.max(0, Math.min(taken, row.need - row.have));
    const cur = (w.restore || {})[id] || { dep: {}, armed: false };
    const next = { ...norm(w), restore: { ...w.restore, [id]: { dep: { ...cur.dep, [band]: (cur.dep[band] || 0) + add }, armed: false } } };
    if (complete(next, id, discount)) next.restore[id].armed = true;
    return { ok: true, added: add, w: next };
  }
  /* how many words of a band this collection still wants, for the caller to take */
  const wanted = (w, id, band, discount) => { const row = progress(w, id, discount).find(p => p.band === band); return row ? row.need - row.have : 0; };
  /* Binding: selling one title of the bind band, once every deposit is in, records the restoration. */
  const ready = (w, id, discount) => !!w.leads.includes(id) && !(w.restored || {})[id] && complete(w, id, discount);
  function onSale(w, band, discount) {
    let out = w;
    for (const id of Object.keys(w.restore || {})) {
      if (ready(w, id, discount) && RESTORE[id].bind === band) out = { ...norm(out), restored: { ...out.restored, [id]: true }, restore: { ...out.restore, [id]: { ...w.restore[id], armed: false } } };
    }
    return out;
  }
  /* first clear: a permanent mastery. Repeats: a few Parts, at most MAX_REPEATS in all. */
  function specialClear(w, id, mult = n => n) {
    const s = SPECIAL[id];
    if (!s || !(w.restored || {})[s.needs]) return { ok: false, why: 'Not unlocked' };
    if (!(w.mastery || {})[id]) return { ok: true, first: true, parts: 0, w: { ...norm(w), mastery: { ...w.mastery, [id]: true } } };
    if (w.repeats >= MAX_REPEATS) return { ok: true, first: false, parts: 0, w };
    const parts = mult(REPEAT_PARTS);
    return { ok: true, first: false, parts, w: { ...w, repeats: w.repeats + 1, parts: w.parts + parts } };
  }

  return Object.freeze({ MAX_QUEUE, FUNDS, FUND_COST, secondSlot, queueMax, cancelQueued, share, typesAt, RESTORE, SPECIAL, REPEAT_PARTS, MAX_REPEATS, norm, routeSeconds, progress, complete, ready, deposit, wanted, onSale, specialClear, typebar, typebarSpeed, VERSION, UNLOCK_PRINTING, ROUTES, RECIPES, LEADS, GROUPS, EFFECT, DUPLICATE_PARTS, fresh, valid, unlocked, quote, launch, advance, claim, cancel, craft, equip, unequip, typeAt, carriage, tray, press });
})();
