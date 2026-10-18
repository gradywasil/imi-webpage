/* Long-game phase F: the Estate grows a second building, the Annex. Pure rules and a deterministic rate model; Ops owns the real wallet and the clock.
   The Annex is an independent room: its own machines, typists, keepers, word stock and title catalog. It shares only the banana wallet (through an
   allocation and a reserve), the account's Parts and recipes, and the one reward ledger (its income is real production, credited once).
   APPROXIMATION, disclosed: it is not a keystroke simulation. Each second it turns typists into letters, letters into banked words (half of them usable),
   words into titles, and titles into sales at the room's own average title price, bounded by its keepers, a sale cadence and the titles left in its catalog.
   Numbers are tuning experiments. */
window.Campus = (() => {
  'use strict';
  const VERSION = 1, BANDS = 6, MAX_TYPISTS = 6, MAX_KEEPER = 6, SALE_RATE = 1 / 6, USABLE = .5, KEEPER_STEP = .9, CHUNK = 30, MAX_CHUNKS = 60;
  const POLICIES = ['farm', 'push'];
  const LETTERS_PER_WORD = [2.5, 4.5, 6.5, 8.5, 10.5, 12.5];
  const GATES = { estate: 1, autoCycles: 10, restored: 1, mastery: 1 };
  /* Past the Annex: campus scheduling opens once the Annex has been rebuilt three times, and the Studio (a precision building: fewer titles, better paid,
     sold more slowly) after two Estates, five Annex rebuilds and 25 Foreman Printings. */
  const SCHED_GATE = 3, STUDIO_GATES = { estate: 2, annexRooms: 5, autoCycles: 25 };
  const SPECS = { annex: { name: 'Annex', pay: 1, rate: SALE_RATE, cap: Infinity }, studio: { name: 'Studio', pay: 1.5, rate: 1 / 9, cap: 8 } };
  const KINDS = ['annex', 'studio'];
  const object = v => v !== null && typeof v === 'object' && !Array.isArray(v);
  const int = n => Number.isSafeInteger(n) && n >= 0;

  const newRoom = () => ({ t: 0, earned: 0, sold: Array(BANDS).fill(0), stock: Array(BANDS).fill(0), wip: Array(BANDS).fill(0), pub: 0,
    bands: Array.from({ length: BANDS }, (_, i) => ({ on: i === 0, typists: i === 0 ? 1 : 0, keeper: 0 })), last: { rate: 0, blocked: '', next: '' } });
  const fresh = () => ({ v: VERSION, deed: false, policy: 'farm', alloc: 30, reserve: 10, hold: false, on: true, room: null, rooms: 0, banked: 0, sched: { on: false, until: 3 }, moved: 0, studio: null });
  const freshStudio = () => ({ policy: 'farm', alloc: 20, reserve: 10, hold: false, on: true, room: newRoom(), rooms: 0, banked: 0, sched: { on: false, until: 3 } });

  function validRoom(r) {
    return object(r) && Number.isFinite(r.t) && r.t >= 0 && Number.isFinite(r.earned) && r.earned >= 0 && ['sold', 'stock', 'wip'].every(k => Array.isArray(r[k]) && r[k].length === BANDS && r[k].every(n => Number.isFinite(n) && n >= 0)) &&
      Number.isFinite(r.pub) && r.pub >= 0 && Array.isArray(r.bands) && r.bands.length === BANDS && r.bands.every((b, i) => object(b) && typeof b.on === 'boolean' && int(b.typists) && b.typists <= MAX_TYPISTS && int(b.keeper) && b.keeper <= MAX_KEEPER && (i > 0 || b.on)) &&
      object(r.last);
  }
  const validSched = s => s === undefined || object(s) && typeof s.on === 'boolean' && Number.isInteger(s.until) && s.until >= 1 && s.until <= BANDS;
  const validSettings = c => POLICIES.includes(c.policy) && Number.isInteger(c.alloc) && c.alloc >= 0 && c.alloc <= 100 && c.alloc % 5 === 0 &&
    Number.isInteger(c.reserve) && c.reserve >= 0 && c.reserve <= 50 && c.reserve % 5 === 0 && typeof c.hold === 'boolean' && typeof c.on === 'boolean' && int(c.rooms) && Number.isFinite(c.banked) && c.banked >= 0 && validSched(c.sched);
  function valid(c) {
    if (c === undefined) return true;
    return object(c) && c.v === VERSION && typeof c.deed === 'boolean' && validSettings(c) && (c.room === null || validRoom(c.room)) && (c.room === null || c.deed) &&
      (c.moved === undefined || int(c.moved)) &&
      (c.studio === undefined || c.studio === null || c.deed && object(c.studio) && validSettings(c.studio) && validRoom(c.studio.room));
  }

  /* One way to read and write either building: the Annex keeps its fields at the top of the record (so older saves load unchanged), the Studio keeps its own. */
  const view = (c, kind) => kind === 'studio' ? c.studio : (c.deed ? c : null);
  const withBuilding = (c, kind, patch) => kind === 'studio' ? { ...c, studio: { ...c.studio, ...patch } } : { ...c, ...patch };
  const active = c => KINDS.filter(k => { const b = c && view(c, k); return !!(b && b.room); });
  /* policy scheduling: push until this many machines are open, then follow the saved policy */
  const schedulingOpen = c => !!(c && c.deed && c.rooms >= SCHED_GATE);
  const policyOf = b => b.sched && b.sched.on && b.room && b.room.bands.filter(x => x.on).length < b.sched.until ? 'push' : b.policy;
  const holding = c => !!(c && (c.hold || (c.studio && c.studio.hold)));
  /* the rate model of a building: its own price, cadence and catalog size on top of the room's figures */
  const contextFor = (kind, ctx) => { const s = SPECS[kind] || SPECS.annex; return { ...ctx, avgPay: ctx.avgPay.map(p => p * s.pay), saleRate: s.rate, catalog: ctx.catalog.map(n => Math.min(n, s.cap)) }; };

  function studioMilestones(f) {
    const rows = [
      { id: 'estate', text: 'Endow the Estate twice', have: f.estate, need: STUDIO_GATES.estate },
      { id: 'rooms', text: 'Rebuild the Annex five times', have: f.annexRooms || 0, need: STUDIO_GATES.annexRooms },
      { id: 'cycles', text: 'Let the Foreman press 25 ordinary Printings by itself', have: f.autoCycles, need: STUDIO_GATES.autoCycles }
    ];
    return { rows: rows.map(r => ({ ...r, done: r.have >= r.need })), open: rows.every(r => r.have >= r.need) };
  }
  function openStudio(c, f) {
    if (!c.deed) return { ok: false, why: 'Open the Annex first' };
    if (c.studio) return { ok: false, why: 'The Studio is already open' };
    if (!studioMilestones(f).open) return { ok: false, why: 'Finish the milestones first' };
    return { ok: true, c: { ...c, studio: freshStudio() } };
  }
  /* Staff transfer: one typist moves from a band of one building to the same band of the other, in one step on records the caller has just settled.
     The head count never changes, nothing is paid, and the Original room (whose typists carry training) is never part of it. */
  function movable(c, from, to) {
    if (from === to || !KINDS.includes(from) || !KINDS.includes(to) || !c || !c.deed || !c.studio) return -1;
    const a = view(c, from), b = view(c, to);
    if (!a || !b || !a.room || !b.room) return -1;
    for (let i = BANDS - 1; i >= 0; i--) {
      if (a.room.bands[i].on && b.room.bands[i].on && a.room.bands[i].typists > (i === 0 ? 1 : 0) && b.room.bands[i].typists < MAX_TYPISTS) return i;
    }
    return -1;
  }
  function move(c, from, to) {
    const band = movable(c, from, to);
    if (band < 0) return { ok: false, why: 'No typist can move' };
    const shift = (k, d) => { const b = view(c, k); return { room: { ...b.room, bands: b.room.bands.map((x, i) => i === band ? { ...x, typists: x.typists + d } : x) } }; };
    let next = withBuilding(c, from, shift(from, -1));
    next = withBuilding(next, to, shift(to, 1));
    return { ok: true, band, c: { ...next, moved: (c.moved || 0) + 1 } };
  }

  /* the milestones that open the Annex: stable automatic cycles, a restored collection, a special edition, and a first Estate */
  function milestones(f) {
    const rows = [
      { id: 'estate', text: 'Endow the Estate once', have: f.estate, need: GATES.estate },
      { id: 'cycles', text: 'Let the Foreman press 10 ordinary Printings by itself', have: f.autoCycles, need: GATES.autoCycles },
      { id: 'restored', text: 'Restore a Lost Library collection', have: f.restored, need: GATES.restored },
      { id: 'mastery', text: 'Clear a special edition', have: f.mastery, need: GATES.mastery }
    ];
    return { rows: rows.map(r => ({ ...r, done: r.have >= r.need })), open: rows.every(r => r.have >= r.need) };
  }
  function openDeed(c, f) {
    if (c.deed) return { ok: false, why: 'The Annex is already open' };
    if (!milestones(f).open) return { ok: false, why: 'Finish the milestones first' };
    return { ok: true, c: { ...c, deed: true, room: newRoom() } };
  }
  /* A reset rebuilds every active building; the deed, settings and ledger stay. The Annex starts as a legal fresh room, not a copy of what it was. */
  const afterReset = c => c && c.deed ? { ...c, room: newRoom(), rooms: c.rooms + 1, studio: c.studio ? { ...c.studio, room: newRoom(), rooms: c.studio.rooms + 1 } : c.studio } : c;

  const typistCost = (price, n) => Math.round(.04 * Math.max(price, 75000) * Math.pow(1.35, n));
  const keeperCost = (price, n) => Math.round(.06 * Math.max(price, 75000) * Math.pow(1.5, n));
  const bandCost = price => Math.round(.5 * price);
  /* every price is a whole number of the 25-banana denomination (ctx.round), so spending never leaves the wallet at an unrepresentable value */
  const costOf = (step, ctx, room) => (ctx.round || (n => n))(step.k === 'band' ? bandCost(ctx.price[step.b]) : step.k === 'typist' ? typistCost(ctx.price[step.b], room.bands[step.b].typists) : keeperCost(ctx.price[step.b], room.bands[step.b].keeper));
  const nameOf = (step, ctx) => `${step.k === 'band' ? 'the ' + ctx.names[step.b] + ' machine' : step.k === 'typist' ? 'a typist on ' + ctx.names[step.b] : 'a keeper tune-up on ' + ctx.names[step.b]}`;

  /* the saved order for each policy, as a plain list of wanted levels; the first unmet one is next */
  function wants(room, policy) {
    const on = room.bands.map((b, i) => b.on ? i : -1).filter(i => i >= 0), nextBand = room.bands.findIndex(b => !b.on), out = [];
    const typists = n => on.forEach(b => out.push({ k: 'typist', b, to: n })), keepers = n => on.forEach(b => out.push({ k: 'keeper', b, to: n }));
    const unlock = () => { if (nextBand >= 0) out.push({ k: 'band', b: nextBand, to: 1 }); };
    if (policy === 'push') { unlock(); typists(2); keepers(1); typists(3); keepers(2); typists(MAX_TYPISTS); keepers(MAX_KEEPER); }
    else { typists(3); keepers(1); unlock(); typists(MAX_TYPISTS); keepers(3); keepers(MAX_KEEPER); }
    return out;
  }
  const level = (room, s) => s.k === 'band' ? (room.bands[s.b].on ? 1 : 0) : room.bands[s.b][s.k === 'typist' ? 'typists' : 'keeper'];
  function next(room, policy, ctx) {
    for (const s of wants(room, policy)) {
      if (!room.bands[s.b].on && s.k !== 'band') continue;
      if (level(room, s) >= s.to) continue;
      const step = s.k === 'band' ? s : { k: s.k, b: s.b };
      return { step, cost: costOf(step, ctx, room), name: nameOf(step, ctx) };
    }
    return null;
  }
  function buy(room, step) {
    const bands = room.bands.map(b => ({ ...b }));
    if (step.k === 'band') bands[step.b].on = true; else if (step.k === 'typist') bands[step.b].typists++; else bands[step.b].keeper++;
    return { ...room, bands };
  }

  /* one chunk of the rate model. ctx: pawBase[], keeperBase[], avgPay[], wordsPerTitle[], catalog[], speed, eff (offline efficiency) */
  function step(room, dt, ctx) {
    const sold = room.sold.slice(), stock = room.stock.slice(), wip = room.wip.slice();
    let pub = room.pub + dt * (ctx.saleRate || SALE_RATE), income = 0, best = { rate: 0, blocked: '' };
    const want = Array(BANDS).fill(0);
    room.bands.forEach((b, i) => {
      if (!b.on || !b.typists) return;
      const letters = b.typists * dt * (ctx.speed || 1) / ctx.pawBase[i];
      const typed = letters / LETTERS_PER_WORD[i] * USABLE, keeps = dt * (ctx.speed || 1) / (ctx.keeperBase[i] * Math.pow(KEEPER_STEP, b.keeper));
      const words = Math.min(typed, keeps);
      stock[i] += words;
      const titles = Math.min(stock[i] / ctx.wordsPerTitle[i], Math.max(0, ctx.catalog[i] - sold[i] - wip[i]));
      stock[i] -= titles * ctx.wordsPerTitle[i]; wip[i] += titles; want[i] = titles;
      const rate = titles / dt * ctx.avgPay[i] * (ctx.eff || 1);
      if (rate >= best.rate) best = { rate, blocked: ctx.catalog[i] - sold[i] - wip[i] <= 0 ? 'catalog' : typed <= keeps ? 'typing' : 'banking' };
    });
    // sell what has finished, within the sale cadence, lowest band first so the order never depends on the iteration of an object
    for (let i = 0; i < BANDS; i++) {
      const n = Math.min(Math.floor(wip[i]), Math.floor(pub), ctx.catalog[i] - sold[i]);
      if (n <= 0) continue;
      sold[i] += n; wip[i] -= n; pub -= n; income += n * ctx.avgPay[i] * (ctx.eff || 1);
    }
    const waiting = wip.some(w => w >= 1);
    return { room: { ...room, t: room.t + dt, earned: room.earned + income, sold, stock, wip, pub: Math.min(pub, 3), last: { rate: best.rate, blocked: waiting && best.blocked !== 'catalog' ? 'publishing' : best.blocked, next: room.last.next } }, income };
  }
  /* bounded: at most MAX_CHUNKS chunks of CHUNK seconds per call; the rest is reported back, never silently dropped */
  function advance(room, seconds, ctx, chunk = CHUNK) {
    let r = room, income = 0, left = Math.max(0, seconds);
    for (let n = 0; n < MAX_CHUNKS && left > 0; n++) {
      const dt = Math.min(chunk, left), s = step(r, dt, ctx); r = s.room; income += s.income; left -= dt;
    }
    return { room: r, income, left };
  }
  /* what the Original room reports beside it, for the overview */
  const summary = room => room ? { bands: room.bands.filter(b => b.on).length, typists: room.bands.reduce((a, b) => a + b.typists, 0), keepers: room.bands.reduce((a, b) => a + b.keeper, 0), sold: room.sold.reduce((a, b) => a + b, 0), earned: room.earned } : null;

  return Object.freeze({ SCHED_GATE, STUDIO_GATES, SPECS, KINDS, freshStudio, view, withBuilding, active, schedulingOpen, policyOf, holding, contextFor, studioMilestones, openStudio, movable, move, VERSION, BANDS, MAX_TYPISTS, MAX_KEEPER, POLICIES, GATES, SALE_RATE, CHUNK, MAX_CHUNKS, fresh, newRoom, valid, validRoom, milestones, openDeed, afterReset, next, buy, step, advance, summary, wants, bandCost, typistCost, keeperCost });
})();
