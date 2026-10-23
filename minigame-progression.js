/* The Break Room: every game is open from the start, in four families (Speed, Keepers, Sales, Luck). You play as one of your typists. A rewarded break is one run,
   paid in that family's Inspiration by how well it went (score against the game's par), and the run also trains the typist's badge. Badges become set bonuses
   on the typist's own machine. Floor problems (an ink jam, a napping keeper, a sales slump, a jinx) are fixed by playing a game of the matching family for free.
   Inspiration buys permanent ideas. Games play inside the main wooden panel with the side menu live. Current Ops state is the sole durable authority. */
(() => {
  'use strict';
  if (!(window.GameFeatures?.enabled('mg01') ?? new URLSearchParams(location.search).get('mg01') === '1')) return;
  const FAMS = ['speed', 'keeper', 'sales', 'luck'];
  const FAM = {
    speed:  { name:'Speed',   ico:'u-fing',     stat:'typing',                use:'Warm hands and Bright ideas', hint:'Reflex games. Their badges speed up their desk\'s typing.' },
    keeper: { name:'Keepers', ico:'s-keeper',   stat:'keeper speed',          use:'Fresh eyes',                  hint:'Tidy, pack and stack. Their badges speed up their desk\'s keeper.' },
    sales:  { name:'Sales',   ico:'d-reprints', stat:'title pay',             use:'Good stories',                hint:'Customers and deals. Their badges raise what their desk\'s titles pay.' },
    luck:   { name:'Luck',    ico:'u-rapid',    stat:'crits and lucky sales', use:'Lucky streak',                hint:'Chance and nerve. Their badges lift crit and lucky-sale odds on their desk.' }
  };
  /* par: a good ordinary run (about what a careful first-timer reaches). The Inspiration a par run pays is the same for every game (see basePay), so the game you are best at is the one to play.
     tune: per-mode [par x, pay x]. */
  const GAMES = {
    whack:   { fam:'speed',  page:'key-whack',         name:'Key Whack',         modes:['main'],            par:3500, ico:'i-type',    blurb:'Hit the typewriter keys as they light up. Avoid the ink blots.' },
    dash:    { fam:'speed',  page:'peel-dash',         name:'Peel Dash',         modes:['main'],            par:2000, ico:'i-log',     blurb:'Sprint down a three-lane jungle path. Jump logs, dodge rocks.' },
    hop:     { fam:'speed',  page:'road-hop',          name:'Road Hop',          modes:['main'],            par:120,  ico:'i-monkey',  blurb:'Cross busy city roads, grab fruit, outrun the garbage truck.' },
    slice:   { fam:'speed',  page:'banana-slice',      name:'Banana Slice',      modes:['main'],            par:3000, ico:'banana',    blurb:'Slice tossed bananas with a swipe. Spare the coconuts.' },
    rhythm:  { fam:'speed',  page:'typewriter-rhythm', name:'Typewriter Rhythm', modes:['easy','normal','hard'], par:3500, tune:{ easy:[.7, .6], normal:[1, 1], hard:[1.3, 1.6] }, ico:'i-reel', blurb:'Four lanes of falling keys to a jungle beat.' },
    tidy:    { fam:'keeper', page:'library-tidy',      name:'Library Tidy',      modes:['main'],            par:3000, ico:'i-works',   blurb:'Real titles fall fast: tap the shelf each one belongs on.' },
    packer:  { fam:'keeper', page:'crate-packer',      name:'Crate Packer',      modes:['main'],            par:130,  ico:'i-log',     blurb:'Rotate and pack banana crates into the truck bay.' },
    stack:   { fam:'keeper', page:'banana-stack',      name:'Banana Stack',      modes:['main'],            par:2500, ico:'i-log',     blurb:'Drop swinging crates and build the tallest tower.' },
    stall:   { fam:'sales',  page:'fruit-stall',       name:'Fruit Stall',       modes:['main'],            par:1000, ico:'banana',    blurb:'Serve customers their fruit orders before they lose patience.' },
    heist:   { fam:'sales',  page:'banana-heist',      name:'Banana Heist',      modes:['main'],            par:300,  ico:'i-monkey',  blurb:'Creep past the guards, grab the bunch, slip back out.' },
    barrel:  { fam:'sales',  page:'barrel-catch',      name:'Banana Barrel',     modes:['bananas','fruit'], par:1500, ico:'i-palm',    blurb:'Catch falling bananas in a barrel and dodge the coconuts.' },
    shuffle: { fam:'luck',   page:'coconut-shuffle',   name:'Coconut Shuffle',   modes:['main'],            par:2500, ico:'i-coconut', blurb:'Follow the shells and pick the one hiding the banana.' },
    plinko:  { fam:'luck',   page:'banana-plinko',     name:'Banana Plinko',     modes:['main'],            par:1200, ico:'banana',    blurb:'Drop a spinning banana through a board of pegs.' },
    bowling: { fam:'luck',   page:'coconut-bowling',   name:'Coconut Bowling',   modes:['main'],            par:150,  ico:'i-coconut', blurb:'A full ten-frame game. Slide, aim and throw.' },
    vine:    { fam:'luck',   page:'vine-swing',        name:'Vine Swing',        modes:['main'],            par:450,  ico:'leaf',      blurb:'One button: grab, swing, release and catch the next vine.' }
  };
  const ORDER = Object.keys(GAMES);
  const GAMES_OF = Object.fromEntries(FAMS.map(f => [f, ORDER.filter(id => GAMES[id].fam === f)]));
  const CAP_BASE = 6, CURVE_UP = .85, CURVE_LOW = 1.15, FRESH = 1.25, NEW_BEST = .25, MAX_PLAY = 3600;
  /* The ideas. Each track is bought one level at a time; vals[] is the cumulative effect, so a card reads "+35% › +70%".
     Past the last listed level a track with a tail keeps going (value grows by tail, cost by grow) so Inspiration never stops being worth something.
     fam is the family of Inspiration that pays for it; 'any' tracks take whatever you hold. */
  const pct = v => `+${Math.round(v * 100)}%`;
  const TRACKS = {
    hands:   { fam:'speed',  name:'Warm hands',    ico:'u-fing',     fx:'typing', unit:'automatic typing',   vals:[.15, .35, .7, 1.3, 2.3],  tail:1,   cost:[150, 600, 2400, 9500, 38e3],  grow:1.6, show:v => pct(v) },
    keepers: { fam:'keeper', name:'Fresh eyes',    ico:'s-keeper',   fx:'keeper', unit:'keeper speed',       vals:[.15, .35, .7, 1.3, 2.3],  tail:1,   cost:[170, 680, 2700, 10.5e3, 42e3], grow:1.6, show:v => pct(v) },
    sales:   { fam:'sales',  name:'Good stories',  ico:'d-reprints', fx:'sale',   unit:'title income',       vals:[.1, .25, .5, .9, 1.5],    tail:.75, cost:[220, 900, 3600, 14e3, 56e3],   grow:1.6, show:v => pct(v) },
    flash:   { fam:'speed',  name:'Bright ideas',  ico:'i-insp',     fx:'flash',  unit:'inspired typists',   vals:[.3, .6, 1, 1.5],          secs:[4, 8, 12, 18], cost:[400, 1800, 7e3, 28e3], show:(v, lv) => `×${(1 + v).toFixed(1)} often · +${TRACKS.flash.secs[lv - 1]}s` },
    luck:    { fam:'luck',   name:'Lucky streak',  ico:'u-rapid',    fx:'luck',   unit:'crits, hot sales, Golden Hours', vals:[.2, .45, .8, 1.3, 2], cost:[350, 1600, 6500, 26e3, 100e3], show:v => pct(v) },
    room:    { fam:'any',    name:'Room for play', ico:'i-game',     fx:'room',   unit:'breaks held',        vals:[8, 10, 12, 15, 20],       cost:[120, 500, 2e3, 8e3, 30e3],     show:v => String(v) },
    pace:    { fam:'any',    name:'Quick breaks',  ico:'i-reel',     fx:'pace',   unit:'until a break returns', vals:[90, 60, 45, 30, 20],   cost:[250, 1200, 5e3, 20e3, 75e3],   show:v => v + 'm' },
    muse:    { fam:'any',    name:'Studio notes',  ico:'i-works',    fx:'yield',  unit:'Inspiration per run', vals:[.2, .45, .8, 1.3],       tail:.5,  cost:[300, 1500, 6e3, 24e3],         grow:1.5, show:v => pct(v) }
  };
  const TRACK_IDS = Object.keys(TRACKS);
  const maxLv = t => t.tail ? Infinity : t.vals.length;
  const valueAt = (t, lv) => lv <= 0 ? 0 : lv <= t.vals.length ? t.vals[lv - 1] : t.vals[t.vals.length - 1] + t.tail * (lv - t.vals.length);
  const costAt = (t, lv) => Math.round(lv < t.cost.length ? t.cost[lv] : t.cost[t.cost.length - 1] * Math.pow(t.grow, lv - t.cost.length + 1));
  /* the first Break Room ideas were single purchases; they map onto the new levels so nothing already bought is lost */
  const OLD = { 'warm-up':['hands', 1], 'nimble-paws':['hands', 2], 'steady-hands':['hands', 3], 'fresh-eyes':['keepers', 1], 'quick-keepers':['keepers', 2], 'good-stories':['sales', 1], 'bestsellers':['sales', 2], 'room-for-play':['room', 1], 'big-break':['muse', 1] };
  const levelsOf = m => {
    const out = {};
    if (m && typeof m.lv === 'object' && m.lv) for (const id of TRACK_IDS) if (m.lv[id] > 0) out[id] = m.lv[id];
    if (Array.isArray(m?.nodes)) for (const id of m.nodes) { const o = OLD[id]; if (o && (out[o[0]] || 0) < o[1]) out[o[0]] = o[1]; }
    return out;
  };
  /* ---------- Inspiration: one pool a family, plus whatever loose Inspiration an older save still holds (that pays for anything) ---------- */
  const poolOf = m => ({ speed:0, keeper:0, sales:0, luck:0, ...(m?.pool || {}) });
  const heldOf = m => { const p = poolOf(m); return (m?.wallet || 0) + FAMS.reduce((n, f) => n + p[f], 0); };
  /* what is left after paying `cost` for something of family `fam`, or null if it cannot be paid. A family's own pool pays first, loose Inspiration next;
     an 'any' idea takes loose Inspiration first and then the biggest pools. */
  function afford(m, fam, cost) {
    const pool = poolOf(m); let wallet = m.wallet || 0, need = cost;
    const sources = fam === 'any' ? ['w', ...FAMS.slice().sort((a, b) => pool[b] - pool[a])] : [fam, 'w'];
    for (const s of sources) { const t = Math.min(s === 'w' ? wallet : pool[s], need); if (s === 'w') wallet -= t; else pool[s] -= t; need -= t; }
    return need > 0 ? null : { pool, wallet };
  }
  /* everything derived from one save object is computed once per object (commits replace the object) */
  let memo = { m:null, v:null };
  const derived = m => {
    if (memo.m === m && memo.v) return memo.v;
    const lv = levelsOf(m), at = id => valueAt(TRACKS[id], lv[id] || 0), room = lv.room ? at('room') : CAP_BASE, pace = lv.pace ? at('pace') : 120;
    const v = { lv, typing:at('hands'), keeper:at('keepers'), sale:at('sales'), luck:at('luck'), yield:at('muse'), cap:room, refill:pace * 60000,
      flashFreq:at('flash'), flashSecs:lv.flash ? TRACKS.flash.secs[Math.min(lv.flash, TRACKS.flash.secs.length) - 1] : 0 };
    memo = { m, v }; return v;
  };
  const capacity = m => derived(m).cap, refillMs = m => derived(m).refill;
  const tuneOf = (id, mode) => GAMES[id].tune?.[mode] || [1, 1];
  const bestKey = (id, mode) => GAMES[id].modes.length > 1 ? `${id}:${mode}` : id;
  const isFresh = (m, id) => !(m.recent || []).slice(0, 2).includes(id);
  /* What a par run pays is the same in every game, so the game you are best at is the one to play. It grows with how far the room has come
     (every machine owned is x1.3, every Printing x1.2), which keeps the Ideas worth chasing as their prices climb. */
  const stateNow = () => api?.state?.() || {};
  const basePay = () => { const S = stateNow(), desks = Math.max(1, (S.desks || []).filter(d => d?.owned).length); return Math.round(180 * Math.pow(1.3, desks - 1) * Math.pow(1.2, S.printing || 0) / 10) * 10; };
  /* what a run is worth: the pay times (score / par) ^ 0.85 above par, so doubling a score pays less than double and an outlier cannot break the economy;
     below par the exponent is 1.15, so a token score earns a token reward */
  const ratioOf = (id, mode, score) => { const par = GAMES[id].par * tuneOf(id, mode)[0]; return Math.min(score, par * 60) / par; };
  function worth(m, id, mode, score) {
    if (!(score > 0)) return 0;
    const r = ratioOf(id, mode, score);
    return Math.max(1, Math.floor(basePay() * tuneOf(id, mode)[1] * Math.pow(r, r < 1 ? CURVE_LOW : CURVE_UP) * (1 + derived(m).yield) * (isFresh(m, id) ? FRESH : 1)));
  }
  const parWorth = (m, id, mode) => worth(m, id, mode, GAMES[id].par * tuneOf(id, mode)[0]);
  /* ---------- typists: a badge in one family, trained by runs, that pays back on the typist's own machine ---------- */
  const BD_XP = 100, BD_UNIT = 60;                                   // a par run is 100 badge xp; level L needs 60 x L^2 xp, so there is no last level
  const bdLevel = xp => Math.floor(Math.sqrt((xp || 0) / BD_UNIT));
  const bdNeed = lv => BD_UNIT * lv * lv;
  const badgeOf = t => { let best = null, lv = 0; for (const f of FAMS) { const l = bdLevel(t?.bd?.[f]); if (l > lv) { lv = l; best = f; } } return best ? { fam:best, lv } : null; };
  const typistFresh = (m, t) => !(t?.bd?.at > 0) || m.nextSession - t.bd.at > 3;
  const badgeXp = (m, id, mode, score, t) => { const r = ratioOf(id, mode, score); return Math.max(1, Math.round(BD_XP * Math.pow(r, r < 1 ? CURVE_LOW : CURVE_UP) * (typistFresh(m, t) ? FRESH : 1))); };
  const IND = { speed:.004, keeper:.005, sales:.003, luck:.005 };    // each badge level adds this to its desk
  const WEIGHT = { speed:1, keeper:1, sales:.6, luck:1 };            // how hard the set tiers hit each family
  const TIERS = [[3, .1], [6, .25], [12, .6], [24, 1.5], [48, 4]];   // typists with that family's badge on one desk
  const FULL = .06;                                                  // each full house (one badge of every family, per set) adds this to all four
  const KIND = { typing:'speed', keeper:'keeper', sales:'sales', luck:'luck' };
  const zero = () => ({ speed:0, keeper:0, sales:0, luck:0 });
  const NONE = Object.freeze({ n:zero(), lv:zero(), bonus:zero(), sets:0 });
  let ver = 0; const setMemo = new Map();
  function deskSet(i) {
    const d = stateNow().desks?.[i]; if (!d?.crew?.length) return NONE;
    const c = setMemo.get(i); if (c && c.crew === d.crew && c.len === d.crew.length && c.ver === ver) return c.v;
    const n = zero(), lv = zero();
    for (const t of d.crew) { const b = badgeOf(t); if (b) { n[b.fam]++; lv[b.fam] += b.lv; } }
    const sets = Math.min(n.speed, n.keeper, n.sales, n.luck), bonus = zero();
    for (const f of FAMS) { let tier = 0; for (const [k, v] of TIERS) if (n[f] >= k) tier = v; bonus[f] = lv[f] * IND[f] + tier * WEIGHT[f] + FULL * sets; }
    const v = { n, lv, bonus, sets }; setMemo.set(i, { crew:d.crew, len:d.crew.length, ver, v }); return v;
  }
  const nextTier = n => TIERS.find(([k]) => n < k)?.[0] || 0;
  const findTypist = w => {
    if (!w) return null;
    const desks = stateNow().desks || [], at = i => { const c = desks[i]?.crew, p = c ? c.findIndex(t => t.name === w.name) : -1; return p >= 0 ? { d:i, p, t:c[p] } : null; };
    return at(w.d) || desks.map((_, i) => at(i)).find(Boolean) || null;
  };
  /* ---------- floor problems: runtime only (a jam is not worth a save), fixed for free by a game of the matching family ---------- */
  const PENALTY = { jam:.6, nap:.5, slump:.85, jinx:0 };
  const PROBLEM = {
    jam:   { fam:'speed',  title:d => `Ink jam on ${d}`,            text:'Typing there is 40% slower.' },
    nap:   { fam:'keeper', title:d => `${d} keeper nodded off`,     text:'It banks half as many words.' },
    slump: { fam:'sales',  title:d => `${d} titles are in a slump`, text:'They sell for 15% less.' },
    jinx:  { fam:'luck',   title:d => `Bad luck on ${d}`,           text:'No crits or lucky sales there.' }
  };
  const GLOBAL = { sluggish:{ fam:'speed', title:'Spoiled snack', text:'The typists are queasy.' }, critic:{ fam:'sales', title:'Bad review', text:'Titles sell for less for a while.' } };
  const FIRST_PROBLEM = 240, EVERY_PROBLEM = [300, 240], PROBLEM_LIFE = 240;       // seconds of play: the first, then 5 to 9 minutes apart (quicker with more machines); one stays 4 minutes
  let T = 0, nextAt = 0, probSeq = 0, prob = null, tunes = [], cardAt = -9, cardDirty = true;
  const mix = n => { n = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b); n ^= n >>> 13; n = Math.imul(n, 0xc2b2ae35); return (n ^ n >>> 16) >>> 0; };    // a problem never draws from the game's random stream
  function globalProblem() {
    if (!api?.buffLeft) return null;
    for (const k of ['sluggish', 'critic']) { const left = api.buffLeft(k); if (left > 0) return { kind:k, global:true, fam:GLOBAL[k].fam, until:T + left }; }
    return null;
  }
  const currentProblem = () => (prob && prob.until > T ? prob : null) || globalProblem();
  function deskFactor(i, kind) {
    const fam = KIND[kind]; if (!fam || !api) return 1;
    const m = saved(); if (m !== undefined && !validOnce(m)) return 1;
    let f = 1 + deskSet(i).bonus[fam];
    for (const t of tunes) if (t.desk === i && t.fam === fam && t.until > T) f *= t.mult;
    if (prob && prob.until > T && prob.desk === i && prob.fam === fam) f *= PENALTY[prob.kind];
    return f;
  }
  const validMemo = new WeakMap();       // deskFactor is asked every tick, so a save object is checked once
  const validOnce = m => { let ok = validMemo.get(m); if (ok === undefined) validMemo.set(m, ok = !!valid(m)); return ok; };
  const unlocked = S => !!S?.intro?.done && (S.meta?.minigames !== undefined || (S.printing || 0) > 0 || Object.keys(S.written || {}).length >= 3);
  function spawn(m) {
    const S = stateNow(), elig = (S.desks || []).map((d, i) => d?.owned && d.paws > 0 ? i : -1).filter(i => i >= 0);
    if (!elig.length) return;
    const h = mix(m.nextSession * 7919 + (++probSeq) * 104729 + Math.floor(T)), kind = ['jam', 'nap', 'slump', 'jinx'][h % 4], desk = elig[mix(h) % elig.length];
    prob = { id:probSeq, kind, desk, fam:PROBLEM[kind].fam, until:T + PROBLEM_LIFE };
    nextAt = T + (EVERY_PROBLEM[0] + EVERY_PROBLEM[1] * (mix(h + 1) % 100) / 100) / (1 + .1 * (elig.length - 1));
    cardDirty = true; IMI.sfx?.tick?.(); api.mark();                 // an open Break Room shows it at once
    api.note?.(`${PROBLEM[kind].title(api.deskInfo(desk).name)}. A ${FAM[prob.fam].name} game in the Break Room fixes it.`);
  }
  function clearProblem(p) { if (p === prob) prob = null; else if (p?.global) api.clearBuff?.(p.kind); cardDirty = true; }
  /* a fixing run: below 40% of par it only patches (half the time left); better than that fixes it, and a great run leaves the machine tuned up for a while */
  function applyFix(p, ratio) {
    if (!p) return '';
    if (ratio < .4) { if (p === prob) prob.until = T + (prob.until - T) / 2; cardDirty = true; return 'Patched'; }
    clearProblem(p);
    if (!p.global) { tunes.push({ desk:p.desk, fam:p.fam, mult:1 + Math.min(.6, .15 + .1 * ratio), until:T + 120 + 30 * Math.min(ratio, 4) }); }
    cardDirty = true; return 'Fixed';
  }
  const mmss = s => `${Math.floor(s / 60)}:${String(Math.max(0, Math.floor(s % 60))).padStart(2, '0')}`;
  function problemCard(onFloor = true) {
    const p = currentProblem(), up = tunes.filter(t => t.until > T), m = saved(), ok = valid(m), w = !onFloor && ok && p && !p.global ? whoNow(m) : null;
    const part = [];
    if (p) {
      const g = p.global ? GLOBAL[p.kind] : PROBLEM[p.kind], name = p.global ? g.title : g.title(api.deskInfo(p.desk).name), left = Math.max(0, p.until - T);
      part.push(`<div class="o-card mg-prob" data-fam="${p.fam}"><div class="mg-prob-main"><b>${famIco(p.fam)}${name}</b><span>${g.text} Play a ${FAM[p.fam].name} game to fix it, free.</span></div>
        <span class="mg-prob-time">${mmss(left)}</span>${onFloor && ok ? `<button type="button" class="o-btn gold sm" data-mg01="fix">Fix it</button>` : w && w.d !== p.desk ? `<button type="button" class="o-btn gold sm" data-mg01="fixwho">Play as a ${esc(api.deskInfo(p.desk).name)} typist</button>` : ''}</div>`);
    }
    for (const t of up) part.push(`<div class="o-card mg-prob good" data-fam="${t.fam}"><div class="mg-prob-main"><b>${famIco(t.fam)}${api.deskInfo(t.desk).name} tuned up</b><span>${FAM[t.fam].stat} ${pct(t.mult - 1)}</span></div><span class="mg-prob-time">${mmss(t.until - T)}</span></div>`);
    return part.join('');
  }
  function drawProblem() {
    cardAt = T; cardDirty = false;
    const el = document.getElementById('oProblem'); if (!el || !api) return;
    api.morph(el, problemCard()); api.hydrate(el);
  }
  function tick(e) {
    const dt = e?.gameSeconds; if (!api || !(dt > 0)) return;
    T += dt;
    if (prob && T >= prob.until) { prob = null; cardDirty = true; api.mark(); }
    if (tunes.length && tunes.some(t => t.until <= T)) { tunes = tunes.filter(t => t.until > T); cardDirty = true; }
    const S = stateNow(), m = saved();
    if (m !== undefined && validOnce(m) && unlocked(S) && !prob && !overlay && !pending) {
      if (!nextAt) nextAt = T + FIRST_PROBLEM;
      else if (T >= nextAt && api.problemsAllowed?.()) spawn(m);
    }
    if (cardDirty || T - cardAt >= 1) drawProblem();
  }
  const bonus = kind => { const m = api && saved(); return valid(m) ? derived(m)[kind] : 0; };
  // A caller-owned developer fixture can supply only the dedicated played-time clock.
  const playNow = window.__MG01_CLOCK || (() => performance.now());
  let api, overlay, frame, host, pending, notice = '', returnFocus, launchSeq = 0, leaving = 0, shown = 0, rollRaf = 0, soundOn = true, sel = null, pickOpen = false, pickDesk = -1;
  const copy = value => JSON.parse(JSON.stringify(value));
  const classic = () => document.documentElement.dataset.style === 'classic';
  const saved = () => api.state().meta.minigames;
  const bounded = (n, max) => Number.isFinite(n) && n >= 0 && n <= max;
  const validWho = w => !!w && Number.isInteger(w.d) && w.d >= 0 && w.d < 6 && typeof w.name === 'string' && w.name.length > 0 && w.name.length <= 60;
  function valid(m) {
    return m && m.version === 1 && Number.isSafeInteger(m.wallet) && m.wallet >= 0 && bounded(m.fraction, 1) && m.fraction < 1 &&
      (m.pool === undefined || m.pool && typeof m.pool === 'object' && FAMS.every(f => Number.isSafeInteger(m.pool[f]) && m.pool[f] >= 0)) &&
      (m.who === undefined || validWho(m.who)) &&
      (m.nodes === undefined || Array.isArray(m.nodes) && m.nodes.every(id => Object.hasOwn(OLD, id)) && new Set(m.nodes).size === m.nodes.length) &&
      (m.lv === undefined || m.lv && typeof m.lv === 'object' && Object.entries(m.lv).every(([id, n]) => Object.hasOwn(TRACKS, id) && Number.isInteger(n) && n >= 0 && n <= maxLv(TRACKS[id]) && n <= 999)) &&
      (m.best === undefined || m.best && typeof m.best === 'object' && Object.entries(m.best).every(([k, n]) => /^[a-z]+(:[a-z]+)?$/.test(k) && Object.hasOwn(GAMES, k.split(':')[0]) && bounded(n, 1e9))) &&
      (m.recent === undefined || Array.isArray(m.recent) && m.recent.length <= 3 && m.recent.every(id => Object.hasOwn(GAMES, id))) &&
      (m.games === undefined || Array.isArray(m.games) && m.games.every(id => Object.hasOwn(GAMES, id)) && new Set(m.games).size === m.games.length) &&
      Number.isInteger(m.attempts) && bounded(m.attempts, capacity(m)) && bounded(m.refillAt, Number.MAX_SAFE_INTEGER) &&
      Number.isSafeInteger(m.nextSession) && m.nextSession > 0 && Number.isSafeInteger(m.settled) && m.settled >= 0 && m.settled < m.nextSession &&
      (m.active === null || (Object.hasOwn(GAMES, m.active?.game) && Number.isSafeInteger(m.active.id) && m.active.id > m.settled && m.active.id < m.nextSession && bounded(m.active.played, MAX_PLAY) &&
        (m.active.score === undefined || bounded(m.active.score, 1e9)) && (m.active.mode === undefined || GAMES[m.active.game].modes.includes(m.active.mode)) &&
        (m.active.who === undefined || validWho(m.active.who)) && (m.active.free === undefined || m.active.free === 1)));
  }
  function fresh() { return { version:1, wallet:0, fraction:0, pool:{ speed:0, keeper:0, sales:0, luck:0 }, attempts:CAP_BASE, refillAt:api.clock.wallNow(), nextSession:1, active:null, settled:0 }; }
  function refill(m) {
    const now = api.clock.wallNow(), cap = capacity(m), every = refillMs(m);
    if (m.attempts >= cap) { m.refillAt = Math.max(m.refillAt, now); return; }
    const n = Math.min(cap - m.attempts, Math.floor(Math.max(0, now - m.refillAt) / every));
    m.attempts += n; m.refillAt = m.attempts === cap ? Math.max(m.refillAt, now) : m.refillAt + n * every;
  }
  /* ---------- ideas ---------- */
  const level = (m, id) => derived(m).lv[id] || 0;
  function purchase(id) {
    if (overlay || pending || !valid(saved())) return;
    const m = saved(), t = TRACKS[id]; if (!t || m.active) return;
    const lv = level(m, id), left = lv >= maxLv(t) ? null : afford(m, t.fam, costAt(t, lv));
    if (!left) return;
    const next = copy(m); next.lv = { ...derived(m).lv, [id]:lv + 1 }; delete next.nodes; refill(next); next.pool = left.pool; next.wallet = left.wallet;
    commit(next, () => { IMI.sfx.ding?.(); });
  }
  const fmt = n => n < 1e4 ? Math.round(n).toLocaleString('en-US') : n < 1e6 ? (n / 1e3).toFixed(n < 1e5 ? 1 : 0).replace(/\.0$/, '') + 'K' : (n / 1e6).toFixed(n < 1e7 ? 2 : 1).replace(/\.?0+$/, '') + 'M';
  const amt = (n, cls = '') => window.Gems?.amount('insp', typeof n === 'number' ? fmt(n) : n, cls) || String(n);
  const gem = (cls = '') => window.Gems?.html('insp', cls) || '';
  const famAmt = (f, n, cls = '') => f === 'any' ? amt(n, cls) : `<span class="mg-famamt" data-fam="${f}">${amt(n, cls)}</span>`;
  const famIco = f => `<span class="mg-famico" data-fam="${f}">${api.shop.cart(FAM[f].ico)}</span>`;
  const esc = s => api.esc ? api.esc(s) : String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  /* one icon per break held, or a count once there are too many to line up */
  const attemptPips = m => capacity(m) > 10
    ? `<span class="mg-tk-row mg-tk-count" role="img" aria-label="${m.attempts} of ${capacity(m)} rewarded breaks"><span class="mg-tk on">${api.shop.ico('i-game', 22)}</span><b>${m.attempts}/${capacity(m)}</b></span>`
    : `<span class="mg-tk-row" role="img" aria-label="${m.attempts} of ${capacity(m)} rewarded breaks">${Array.from({ length:capacity(m) }, (_, k) => `<span class="mg-tk${k < m.attempts ? ' on' : ''}">${api.shop.ico('i-game', 22)}</span>`).join('')}</span>`;
  function trackCard(id, m, supported) {
    const t = TRACKS[id], lv = supported ? level(m, id) : 0, top = lv >= maxLv(t), next = lv + 1, cost = top ? 0 : costAt(t, lv);
    const short = !top && !afford(m, t.fam, cost), off = !supported || top || short || m.active || overlay || pending;
    const pips = t.tail ? `<span class="o-lvl">Lv ${lv}</span>` : `<span class="o-pips mg02-pips" role="img" aria-label="level ${lv} of ${t.vals.length}">${t.vals.map((_, k) => `<i class="${k < lv ? 'on' : ''}"></i>`).join('')}</span>`;
    const now = lv ? t.show(valueAt(t, lv), lv) : '', after = top ? '' : t.show(valueAt(t, next), next);
    return `<div class="o-card mg02-node${top ? ' owned' : ''}" data-fam="${t.fam}"><div class="o-row"><h4>${api.shop.cart(t.ico)}${t.name}</h4>${pips}</div><p class="mg02-fx">${now && !top ? `<span class="mg02-was">${now}</span><i>›</i>` : ''}<b>${top ? now : after}</b></p><small class="mg02-unit">${t.unit}</small>${top ? '' : `<div class="o-row mg02-buy">${famAmt(t.fam, cost, short ? 'short' : '')}<button type="button" class="o-btn gold o-starbtn" data-mg01="purchase" data-node="${id}" aria-label="Buy ${t.name} level ${next}" ${off ? 'disabled' : ''}>Buy</button></div>`}</div>`;
  }
  /* every track, the next level of each, plus the totals you already have as small chips */
  function ideas(m) {
    const supported = valid(m); if (!supported) return '';
    const buy = id => { const t = TRACKS[id], lv = level(m, id); return lv < maxLv(t) && afford(m, t.fam, costAt(t, lv)) ? 0 : 1; };
    const sorted = TRACK_IDS.slice().sort((a, b) => buy(a) - buy(b));
    const have = TRACK_IDS.filter(id => level(m, id)).map(id => `<span class="mg02-chip" title="${TRACKS[id].name}: ${TRACKS[id].unit}">${api.shop.cart(TRACKS[id].ico)}<b>${TRACKS[id].show(valueAt(TRACKS[id], level(m, id)), level(m, id))}</b></span>`).join('');
    return `<section class="mg02-tree" aria-label="Permanent ideas">${have ? `<div class="mg02-have">${have}</div>` : ''}<div class="o-grid">${sorted.map(id => trackCard(id, m, supported)).join('')}</div></section>`;
  }
  const buyable = m => { if (!valid(m) || m.active) return 0; return TRACK_IDS.filter(id => { const t = TRACKS[id], lv = level(m, id); return lv < maxLv(t) && afford(m, t.fam, costAt(t, lv)); }).length; };
  /* a commit may carry a typist's new badge xp, saved in the same write as the Inspiration it came with */
  function commit(next, done = () => {}, badge = null) {
    if (pending || !valid(next)) return false;
    const expected = saved() === undefined ? null : JSON.stringify(saved());
    const result = api.commitMinigames(expected, next, badge);
    if (!result.ok) {
      pending = { expected, next, done, badge }; notice = 'Could not save this change. Retry to keep it.';
      if (host) frame?.contentWindow.postMessage({ bridge:'mg01', game:host.game, session:host.token, type:'hold' }, location.origin);
      update(); return false;
    }
    if (badge) { ver++; cardDirty = true; }
    notice = ''; done(); update(); api.mark(); return true;
  }
  function retry() {
    if (!pending) return;
    const p = pending, result = api.commitMinigames(p.expected, p.next, p.badge);
    if (!result.ok) { notice = 'Still could not save. Your result is waiting for Retry.'; update(); return; }
    if (p.badge) ver++;
    pending = null; notice = ''; p.done(); update(); api.mark();
  }
  const addPool = (m, fam, n) => { const pool = poolOf(m); pool[fam] += n; return pool; };
  /* a break interrupted by a closed tab is paid out for the score it had reached */
  function stale(m) { return m.active && !host; }
  function settleStale() {
    const m = saved(); if (!api || pending || !valid(m) || !stale(m)) return;
    const a = m.active, next = copy(m), score = a.score ?? 0, g = a.game, mode = a.mode || GAMES[g].modes[0], fam = GAMES[g].fam;
    const total = a.score === undefined ? Math.floor(Math.min(60, a.played) * 10 / 60) : worth(m, g, mode, score);
    next.pool = addPool(m, fam, total); next.settled = a.id; next.active = null;
    if (score > 0) { next.best = { ...(m.best || {}), [bestKey(g, mode)]:Math.max(score, m.best?.[bestKey(g, mode)] || 0) }; next.recent = [g, ...(m.recent || []).filter(x => x !== g)].slice(0, 2); }
    const who = score > 0 && a.who && findTypist(a.who), badge = who ? { d:who.d, name:who.t.name, fam, xp:badgeXp(m, g, mode, score, who.t), at:a.id } : null;
    commit(next, () => { if (total) { notice = `Banked ${fmt(total)} Inspiration from your last break.`; window.Juice?.fly('insp', [innerWidth / 2, innerHeight / 2], Math.min(12, Math.max(3, Math.ceil(Math.log10(total + 1) * 3)))); } }, badge);
  }
  function ensure() {
    if (saved() === undefined) return commit(fresh());
    if (!valid(saved())) { notice = 'This Break Room save is unsupported. It has been kept unchanged.'; return false; }
    settleStale();
    if (pending) return false;
    const m = copy(saved()); refill(m);
    return JSON.stringify(m) === JSON.stringify(saved()) || commit(m);
  }
  /* ---------- the typist you play as ---------- */
  function whoNow(m) {
    const found = findTypist(sel || (valid(m) ? m.who : null)); if (found) return found;
    const desks = stateNow().desks || []; for (let i = 0; i < desks.length; i++) if (desks[i]?.owned && desks[i].crew?.length) return { d:i, p:0, t:desks[i].crew[0] };
    return null;
  }
  const badgeText = t => { const b = badgeOf(t); return b ? `${FAM[b.fam].name} Lv ${b.lv}` : 'No badge yet'; };
  const badgeChip = t => { const b = badgeOf(t); return b ? `<span class="o-chip mg-badge" data-fam="${b.fam}" title="Break Room badge. ${FAM[b.fam].hint}">★ ${FAM[b.fam].name} Lv ${b.lv}</span>` : ''; };
  function whoStrip(m) {
    const w = whoNow(m);
    if (!w) return `<div class="o-card mg-who"><p class="o-dim">Hire a typist in Train and they can play for you.</p></div>`;
    const info = api.typist(w.t), dk = api.deskInfo(w.d), b = badgeOf(w.t), fresh = typistFresh(m, w.t);
    const pd = pickDesk >= 0 ? pickDesk : w.d, desks = (stateNow().desks || []).map((d, i) => d?.owned && d.crew?.length ? i : -1).filter(i => i >= 0);
    const picker = pickOpen ? `<div class="mg-picker"><div class="mg-pickdesks">${desks.map(i => `<button type="button" class="o-btn sm" data-mg01="pickdesk" data-d="${i}" aria-pressed="${i === pd}" style="--c:${api.deskInfo(i).color}">${api.deskInfo(i).name}</button>`).join('')}</div>
      <div class="mg-pickgrid">${(stateNow().desks[pd]?.crew || []).map((t, p) => `<button type="button" class="mg-pick${w.d === pd && w.p === p ? ' on' : ''}" data-mg01="who" data-d="${pd}" data-p="${p}" title="${esc(t.name)}: ${badgeText(t)}">${api.typist(t).art}<b>${esc(t.name)}</b><small>${badgeOf(t) ? `${FAM[badgeOf(t).fam].name} ${badgeOf(t).lv}` : '–'}</small></button>`).join('')}</div></div>` : '';
    return `<div class="o-card mg-who" style="--c:${dk.color}"><div class="mg-who-row">${info.art}<div class="mg-who-text"><b>${esc(w.t.name)}</b><small>${info.look} · ${dk.name} desk${fresh ? ' · <span class="mg-fresh" title="Rested: +25% badge xp">RESTED +25%</span>' : ''}</small>
      <span class="mg-who-badge">${b ? `<span class="mg-badge" data-fam="${b.fam}">★ ${FAM[b.fam].name} Lv ${b.lv}</span> <small class="o-dim">next ${fmt(bdNeed(b.lv + 1))} xp</small>` : '<span class="o-dim">Plays to earn a badge. Each run trains the family of its game.</span>'}</span></div>
      <button type="button" class="o-btn sm" data-mg01="whopick" aria-expanded="${pickOpen}">${pickOpen ? 'Done' : 'Change'}</button></div>${picker}</div>`;
  }
  /* ---------- panes ---------- */
  function render(_, pane) {
    const m = saved(), ok = valid(m), when = api.clock.wallNow();
    const wait = ok && m.attempts < capacity(m) ? Math.ceil(Math.max(0, m.refillAt + refillMs(m) - when) / 60000) : 0;
    const pool = poolOf(m);
    const head = ok ? `<div class="mg-head"><div class="mg-wallet">${FAMS.map(f => `<span class="mg-pool" data-fam="${f}" title="${FAM[f].name} Inspiration. It buys ${FAM[f].use}.">${famIco(f)}${amt(pool[f])}</span>`).join('')}${m.wallet ? `<span class="mg-pool" title="Loose Inspiration from before the families. It buys anything.">${amt(m.wallet)}</span>` : ''}</div><div class="mg-breaks" title="Rewarded breaks. One comes back every ${Math.round(refillMs(m) / 60000)} minutes. Fixing a floor problem is free.">${attemptPips(m)}${wait ? `<small>${wait >= 60 ? Math.floor(wait / 60) + 'h ' + (wait % 60) + 'm' : wait + 'm'}</small>` : ''}</div></div>` : '';
    const n = ok ? buyable(m) : 0, sub = api.sub('breakroom') || 'games';
    const tabs = api.subTabs('breakroom', [['games', 'Games'], ['crew', 'Crew'], ['ideas', 'Ideas', n || '']]);
    const p = currentProblem(), w = ok ? whoNow(m) : null;
    let body;
    if (sub === 'ideas') body = ideas(m);
    else if (sub === 'crew') body = crewPane(m);
    else {
      const noBreaks = ok && !m.attempts, order = p ? [p.fam, ...FAMS.filter(f => f !== p.fam)] : FAMS;
      const gamecard = id => {
        const g = GAMES[id], mode = g.modes[0], best = ok ? Math.max(0, ...g.modes.map(k => m.best?.[bestKey(id, k)] || 0)) : 0, fresh = ok && isFresh(m, id);
        const fixes = !!p && p.fam === g.fam && (p.global || w?.d === p.desk), wrong = !!p && p.fam === g.fam && !fixes;
        return `<div class="o-card mg-game${fixes ? ' fix' : ''}" data-fam="${g.fam}"><div class="o-row"><h3>${api.shop.cart(g.ico)}${g.name}</h3>${famAmt(g.fam, '+' + fmt(parWorth(m, id, mode)))}</div><p class="mg-blurb">${g.blurb}</p><div class="o-row mg-meta">${best ? `<span class="mg-best" title="Best score">★ ${best.toLocaleString('en-US')}</span>` : '<span class="mg-best dim">Not played yet</span>'}${fresh ? '<span class="mg-fresh" title="Fresh: not one of your last two breaks. +25% Inspiration">FRESH +25%</span>' : ''}${fixes ? '<span class="mg-fix" title="Fixes the problem on the Floor, and costs no break">FIXES IT · FREE</span>' : ''}${wrong ? `<span class="mg-fixhint" title="Pick a typist from that desk">needs a ${esc(api.deskInfo(p.desk).name)} typist</span>` : ''}</div><div class="mg01-actions"><button type="button" class="o-btn gold" data-mg01="rewarded" data-game="${id}" ${noBreaks && !fixes ? 'disabled' : ''}>${fixes ? 'Fix it' : 'Play'}</button><button type="button" class="o-btn" data-mg01="practice" data-game="${id}">Practice</button></div></div>`;
      };
      body = `${ok ? whoStrip(m) : ''}${p ? problemCard(false) : ''}${order.map(f => `<section class="mg-fam" data-fam="${f}"><h3 class="mg-famhead">${famIco(f)}<span>${FAM[f].name}</span><small>${FAM[f].hint}</small></h3><div class="o-grid">${GAMES_OF[f].map(gamecard).join('')}</div></section>`).join('')}`;
    }
    api.morph(pane, `<div class="mg01-choices">${tabs}${head}${body}${notice ? `<p role="status" class="o-warn">${notice}</p>` : ''}${pending ? '<button type="button" class="o-btn gold" data-mg01="retry">Retry save</button>' : ''}</div>`);
    api.hydrate(pane);
  }
  /* each machine's crew: how many of each badge it holds, the tier that earns, and who is on the roster */
  function crewPane(m) {
    const desks = (stateNow().desks || []).map((d, i) => d?.owned && d.crew?.length ? i : -1).filter(i => i >= 0);
    if (!desks.length) return '<p class="o-dim">Hire typists in Train. Each one can earn a badge here, and the badges pay back on their own machine.</p>';
    const intro = `<p class="o-dim mg-crewnote">A typist's badge is the family they have trained most. Badges pay back on their own machine: each level adds a little, 3, 6, 12, 24 and 48 of the same badge on one desk earn bigger set bonuses, and one badge of every family is a full house.</p>`;
    return intro + desks.map(i => {
      const dk = api.deskInfo(i), s = deskSet(i), crew = stateNow().desks[i].crew;
      const rows = FAMS.map(f => { const nt = nextTier(s.n[f]); return `<div class="mg-set" data-fam="${f}" title="${FAM[f].hint}"><span class="mg-setname">${famIco(f)}${FAM[f].name}</span><span class="mg-setn">${s.n[f]}${nt ? `<small>/${nt}</small>` : ''}</span><b class="mg-setfx">${pct(s.bonus[f])}</b><small>${FAM[f].stat}</small></div>`; }).join('');
      return `<div class="o-card mg-desk" style="--c:${dk.color}"><div class="o-row"><h3>${esc(dk.full)}</h3><span class="o-dim">${crew.length} typists${s.sets ? ` · ${s.sets} full house${s.sets > 1 ? 's' : ''} (${pct(FULL * s.sets)} to all)` : ''}</span></div><div class="mg-sets">${rows}</div>
        <div class="mg-roster">${crew.map((t, p) => { const b = badgeOf(t); return `<button type="button" class="mg-chip" data-mg01="who" data-d="${i}" data-p="${p}" data-go="games"${b ? ` data-fam="${b.fam}"` : ''} title="${esc(t.name)}: ${badgeText(t)}. Click to play as them.">${esc(t.name)}${b ? `<i>${b.lv}</i>` : ''}</button>`; }).join('')}</div></div>`;
    }).join('');
  }
  /* ---------- the game, inside the main panel ---------- */
  const SVG = {
    pause:'<svg viewBox="0 0 16 16"><path d="M4 2h3v12H4zM9 2h3v12H9z"/></svg>', play:'<svg viewBox="0 0 16 16"><path d="M4 2l10 6-10 6z"/></svg>',
    on:'<svg viewBox="0 0 16 16"><path d="M2 6h3l4-3v10l-4-3H2z"/><path d="M11 5q2 3 0 6M13 3q4 5 0 10" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
    off:'<svg viewBox="0 0 16 16"><path d="M2 6h3l4-3v10l-4-3H2z"/><path d="M11 6l4 4M15 6l-4 4" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
    out:'<svg viewBox="0 0 16 16"><path d="M9 2L3 8l6 6V10h4V6H9z"/></svg>'
  };
  const parPos = r => r <= 0 ? 0 : r < 1 ? r * 50 : r < 2 ? 50 + (r - 1) * 25 : r < 4 ? 75 + (r - 2) * 12.5 : 100;
  function launch(game, rewarded, opts = {}) {
    if (overlay || pending || !ensure() || !GAMES[game]) return;
    const m = saved(), g = GAMES[game], w = opts.who || whoNow(m), p = currentProblem();
    const fix = rewarded && p && p.fam === g.fam && w && (p.global || w.d === p.desk) ? p : null;
    if (rewarded && !m.attempts && !fix) { notice = 'No rewarded breaks left. Practice is always free.'; api.mark(); return; }
    const played = Math.max(0, ...g.modes.map(k => m.best?.[bestKey(game, k)] || 0)) > 0;
    host = { game, token:++launchSeq, rewarded, run:null, mode:g.modes[0], phase:'title', input:false, elapsed:0, receipt:playNow(), sequence:0, score:0, played:0, checkpoint:0, last:null,
      who:w ? { d:w.d, name:w.t.name } : null, typist:w, fix, free:!!fix };
    try { soundOn = JSON.parse(localStorage.getItem('mg:sound') ?? 'true') !== false; } catch { soundOn = true; }
    returnFocus = document.activeElement;
    overlay = document.createElement('div'); overlay.className = 'mg01-overlay'; overlay.dataset.game = game;
    overlay.innerHTML = `<div class="mg01-layout"><div class="mg01-well"><iframe class="mg01-frame" title="${g.name} game" allow="fullscreen"></iframe></div>
      <aside class="o-card mg01-run" aria-label="Break controls">
        <h2 class="mg01-name">${api.shop.cart(g.ico)}<span>${g.name}</span></h2>
        <div class="mg01-who"></div>
        <div class="mg01-pay" aria-live="off">${gem('big')}<b class="mg01-num">+0</b></div>
        <div class="mg01-par" role="img" aria-label="Score against par"><i class="mg01-fill"></i><u style="left:50%"></u><u style="left:75%"></u><u style="left:100%"></u></div>
        <div class="mg01-ticks"><span style="left:50%">PAR</span><span style="left:75%">×2</span><span style="left:100%">×4</span></div>
        <div class="mg01-score"><span>Score</span><b class="mg01-sc">0</b></div>
        <div class="mg01-score mg01-bestrow"><span>Best</span><b class="mg01-bs">0</b></div>
        <div class="mg01-kind" role="group" aria-label="Run type"><button type="button" data-mg01="kind" data-kind="rewarded" aria-label="Rewarded break">${gem()}<span>Reward</span></button><button type="button" data-mg01="kind" data-kind="practice" aria-label="Practice, no reward">Practice</button></div>
        <div class="mg01-breaks"></div>
        <div class="mg01-ctl"><button type="button" class="mg01-ico" data-mg01="pause" aria-label="Pause"></button><button type="button" class="mg01-ico" data-mg01="sound" aria-label="Sound"></button><button type="button" class="mg01-leave" data-mg01="close"><span class="mg01-glyph">${SVG.out}</span><span class="mg01-lbl">Leave</span></button></div>
        <p class="mg01-status" role="status"></p><button type="button" class="mg01-retry o-btn gold" data-mg01="retry" hidden>Retry save</button>
      </aside></div>`;
    const panel = document.querySelector('#opsRoot .o-panel'); panel?.classList.add('mg01-on');
    (panel || document.getElementById('opsRoot') || document.body).appendChild(overlay);
    frame = overlay.querySelector('iframe'); shown = 0;
    const look = w ? `&look=${encodeURIComponent(w.t.look || '')}&hat=${+w.t.hat || 0}` : '';
    frame.src = `minigames/${g.page}.html?hosted=mg01&game=${game}&session=${host.token}&skip=${played ? 1 : 0}&bests=${encodeURIComponent(JSON.stringify(Object.fromEntries(g.modes.map(k => [k, m.best?.[bestKey(game, k)] || 0]))))}&low=${IMI.fx?.low ? 1 : 0}&reduce=${IMI.reduceMotion ? 1 : 0}${look}`;
    overlay.querySelector('.mg01-sc').textContent = '0';
    update(); frame.focus();
  }
  function close() {
    if (!overlay || pending) return;
    document.querySelector('#opsRoot .o-panel')?.classList.remove('mg01-on');
    overlay.remove(); overlay = frame = host = null; leaving = 0; cancelAnimationFrame(rollRaf);
    if (returnFocus?.isConnected) returnFocus.focus(); api.mark();
  }
  const toGame = type => frame?.contentWindow.postMessage({ bridge:'mg01', game:host.game, session:host.token, type }, location.origin);
  /* bank the run in progress (or just ended): its Inspiration, its best score, the typist's badge xp, the games it keeps fresh, and any problem it fixed */
  function bank(returning = false, final) {
    if (pending) return;
    const m = saved(), a = m?.active;
    if (!valid(m) || !a || host && host.run?.id !== a.id) { if (returning) close(); return; }
    const next = copy(m), score = Math.max(0, Math.floor(final ?? host?.score ?? a.score ?? 0)), played = host ? host.played : a.played, mode = a.mode || GAMES[a.game].modes[0], key = bestKey(a.game, mode), fam = GAMES[a.game].fam;
    next.settled = a.id; next.active = null;
    if (played < 2 && score === 0 && !a.free) { refill(next); next.attempts = Math.min(capacity(next), next.attempts + 1); }              // never played: the break comes back
    const total = worth(m, a.game, mode, score), prev = m.best?.[key] || 0, extra = prev > 0 && score > prev ? Math.floor(total * NEW_BEST) : 0, best = score > prev, earned = total + extra;
    next.pool = addPool(m, fam, earned);
    if (score > 0) { next.recent = [a.game, ...(m.recent || []).filter(x => x !== a.game)].slice(0, 2); }
    if (best) next.best = { ...(m.best || {}), [key]:score };
    const who = score > 0 && a.who ? findTypist(a.who) : null, xp = who ? badgeXp(m, a.game, mode, score, who.t) : 0, lvWas = who ? bdLevel(who.t.bd?.[fam]) : 0;
    const badge = who ? { d:who.d, name:who.t.name, fam, xp, at:a.id } : null;
    if (who) next.who = { d:who.d, name:who.t.name };
    commit(next, () => {
      const ratio = ratioOf(a.game, mode, score), lvNow = who ? bdLevel(who.t.bd?.[fam]) : 0;
      const fixed = host?.fix && score > 0 ? applyFix(host.fix, ratio) : '';
      if (host) { host.run = null; host.last = { total:earned, bonus:extra, best, score, xp, fam, lv:lvNow, up:lvNow > lvWas, fixed, who:who?.t.name }; host.score = score; }
      if (earned) window.Juice?.fly('insp', overlay?.querySelector('.mg01-pay') ? IMI.centerOf(overlay.querySelector('.mg01-pay')) : [innerWidth / 2, 60], Math.min(14, Math.max(3, Math.ceil(Math.log10(earned + 1) * 3))));
      if (host && earned) { frame?.contentWindow.postMessage({ bridge:'mg01', game:host.game, session:host.token, type:'reward', total:earned, best:extra }, location.origin); }
      if (earned && window.Juice?.stamp) {
        const par = GAMES[a.game].par * tuneOf(a.game, mode)[0], r = score / par;
        if (fixed === 'Fixed') window.Juice.stamp(classic() ? 'Fixed!' : 'FIXED!', { tier:2, sub:`+${fmt(earned)}` });
        else if (lvNow > lvWas) window.Juice.stamp(classic() ? `${FAM[fam].name} badge Lv ${lvNow}!` : `${FAM[fam].name.toUpperCase()} BADGE LV ${lvNow}!`, { tier:2, sub:who.t.name });
        else if (best && prev > 0) window.Juice.stamp(classic() ? 'New best!' : 'NEW BEST!', { tier:2, sub:`+${fmt(earned)}` });
        else if (r >= 2) window.Juice.stamp(classic() ? 'Great run!' : 'GREAT RUN!', { tier:r >= 4 ? 3 : 2, sub:`+${fmt(earned)}` });
      }
      if (returning) close();
    }, badge);
  }
  /* leaving asks the game for its last score first, then banks whatever it says (or what we last heard if it does not answer) */
  function requestLeave() {
    if (pending) return;
    if (!host?.run) { close(); return; }
    toGame('quit-request');
    const t = ++leaving; setTimeout(() => { if (overlay && leaving === t && host?.run) bank(true); }, 450);
  }
  function previewScore() { return host?.last?.score ?? host?.score ?? 0; }
  function update() {
    if (!overlay) return;
    const m = saved(), g = GAMES[host.game], mode = host.mode || g.modes[0], [parX] = tuneOf(host.game, mode), par = g.par * parX;
    const live = !!host.run, score = previewScore(), earned = live || host.last ? (live ? worth(m, host.game, mode, score) : host.last.total) : 0;
    const q = s => overlay.querySelector(s);
    const rate = host.rewarded && (live || !host.last);
    q('.mg01-pay').classList.toggle('off', !host.rewarded);
    q('.mg01-pay').dataset.mode = !host.rewarded ? 'practice' : live ? 'live' : host.last ? 'done' : 'idle';
    rollTo(host.rewarded || host.last ? earned : 0);
    q('.mg01-fill').style.width = parPos(score / par) + '%';
    q('.mg01-par').classList.toggle('past', score >= par);
    q('.mg01-sc').textContent = score.toLocaleString('en-US');
    q('.mg01-bs').textContent = Math.max(0, Math.max(...g.modes.map(k => m.best?.[bestKey(host.game, k)] || 0))).toLocaleString('en-US');
    const idle = !live && (host.phase === 'title' || host.phase === 'over');
    q('[data-kind="rewarded"]').setAttribute('aria-pressed', String(host.rewarded)); q('[data-kind="practice"]').setAttribute('aria-pressed', String(!host.rewarded));
    q('[data-kind="rewarded"]').disabled = !idle || !!pending || !m.attempts && !host.free; q('[data-kind="practice"]').disabled = !idle || !!pending;
    q('.mg01-breaks').innerHTML = attemptPips(m) + (isFresh(m, host.game) ? '<span class="mg-fresh">FRESH +25%</span>' : '');
    const t = host.typist?.t, b = t && badgeOf(t), l = host.last;
    q('.mg01-who').innerHTML = t ? `${api.typist(t).art}<span><b>${esc(t.name)}</b><small>${l?.xp ? `+${l.xp} ${FAM[l.fam].name} xp${l.up ? ` · Lv ${l.lv}!` : ''}` : host.fix && !l ? `Fixing it, free` : b ? `${FAM[b.fam].name} Lv ${b.lv}` : 'No badge yet'}${l?.fixed ? ` · ${l.fixed}` : ''}</small></span>` : '';
    q('.mg01-who').dataset.fam = l?.fam || b?.fam || g.fam;
    q('[data-mg01="pause"]').innerHTML = SVG[host.phase === 'pause' ? 'play' : 'pause']; q('[data-mg01="pause"]').setAttribute('aria-label', host.phase === 'pause' ? 'Resume' : 'Pause');
    q('[data-mg01="pause"]').disabled = !(host.phase === 'play' || host.phase === 'pause');
    q('[data-mg01="sound"]').innerHTML = SVG[soundOn ? 'on' : 'off']; q('[data-mg01="sound"]').setAttribute('aria-pressed', String(!soundOn));
    q('[data-mg01="close"]').disabled = !!pending;
    q('.mg01-status').textContent = notice || (!host.rewarded ? 'Practice: no reward' : live ? '' : host.last ? '' : host.fix ? 'Starts a free fixing run' : 'Starts a rewarded break');
    q('.mg01-retry').hidden = !pending;
  }
  /* the number rolls up to its new value instead of jumping */
  function rollTo(target) {
    const el = overlay?.querySelector('.mg01-num'); if (!el) return;
    cancelAnimationFrame(rollRaf);
    const step = () => {
      if (!overlay) return;
      const d = target - shown; if (Math.abs(d) < 1) shown = target; else shown += Math.sign(d) * Math.max(1, Math.ceil(Math.abs(d) * .2));
      el.textContent = (host.rewarded ? '+' : '') + fmt(shown);
      if (shown !== target) rollRaf = requestAnimationFrame(step);
    };
    step();
  }
  function charge(mode) {
    const next = copy(saved()); refill(next);
    if (next.active || !host.free && !next.attempts) { host.rewarded = false; host.fix = null; notice = 'No rewarded breaks left. This run is practice.'; update(); toGame('start-ok'); return; }
    if (!host.free) { if (next.attempts === capacity(next)) next.refillAt = Math.max(next.refillAt, api.clock.wallNow()); next.attempts--; }
    const id = next.nextSession; next.nextSession++; next.active = { id, game:host.game, mode, played:0, score:0, ...(host.who ? { who:host.who } : {}), ...(host.free ? { free:1 } : {}) };
    commit(next, () => { host.run = { id }; host.score = 0; host.played = 0; host.checkpoint = 0; host.last = null; shown = 0; toGame('start-ok'); });
  }
  function receive(e) {
    const d = e.data;
    if (!host || pending || e.origin !== location.origin || e.source !== frame?.contentWindow || d?.bridge !== 'mg01' || d.game !== host.game || d.session !== host.token ||
        !Number.isSafeInteger(d.sequence) || d.sequence <= host.sequence || !GAMES[host.game].modes.includes(d.mode) || !bounded(d.elapsed, 86400) || d.elapsed < host.elapsed ||
        !['start','phase','input','progress','finish','quit'].includes(d.type) || d.score !== undefined && !bounded(d.score, 1e9)) return;
    if (d.type === 'phase' && !['title','count','waiting','play','pause','over'].includes(d.phase)) return;
    if (d.type === 'finish' && (d.reason !== 'natural' || !bounded(d.score, 1e9))) return;
    if (d.type === 'quit' && !['quit','back'].includes(d.reason)) return;
    const now = playNow(), delta = Math.min(d.elapsed - host.elapsed, Math.max(0, (now - host.receipt) / 1000));
    if (host.run && host.input && host.phase === 'play' && !document.hidden) host.played = Math.min(MAX_PLAY, host.played + delta);
    host.elapsed = d.elapsed; host.receipt = now; host.sequence = d.sequence; host.mode = d.mode;
    if (d.score !== undefined) host.score = d.score;
    if (d.type === 'start') {
      host.input = false; host.phase = 'waiting';
      if (!host.rewarded || host.run) toGame('start-ok'); else charge(d.mode);
    } else if (d.type === 'phase') { host.phase = d.phase; if (d.phase !== 'play') host.input = false; if (d.phase === 'count') { host.last = null; host.score = 0; } }
    else if (d.type === 'input' && host.phase === 'play') host.input = true;
    else if (d.type === 'quit') { host.run ? bank(true, d.score) : close(); return; }
    else if (d.type === 'finish') { host.phase = 'over'; host.score = d.score; if (host.run) bank(false, d.score); else practiceBest(d.score); update(); return; }
    if (host.run && (host.played - host.checkpoint >= 1)) {
      const next = copy(saved()); if (next.active?.id !== host.run.id) return;
      next.active.played = host.played; next.active.score = host.score;
      commit(next, () => { host.checkpoint = host.played; });
    }
    update();
  }
  /* a practice run still counts toward your best */
  function practiceBest(score) {
    const m = saved(), mode = host.mode || GAMES[host.game].modes[0], key = bestKey(host.game, mode);
    if (!valid(m) || m.active || !(score > (m.best?.[key] || 0))) return;
    const next = copy(m); next.best = { ...(m.best || {}), [key]:score }; commit(next);
  }
  /* the Floor's Fix it button: open the Break Room and start the matching game as the desk's best-trained typist */
  function fixProblem() {
    const p = currentProblem(), m = saved(); if (!p || !valid(m) || overlay || pending) return;
    const crew = p.global ? [] : (stateNow().desks[p.desk]?.crew || []);
    let t = null, at = p.global ? -1 : p.desk;
    if (p.global) { const w = whoNow(m); if (w) { t = w.t; at = w.d; } }
    else crew.forEach(c => { if (!t || (c.bd?.[p.fam] || 0) > (t.bd?.[p.fam] || 0)) t = c; });
    const list = GAMES_OF[p.fam], game = list[(m.nextSession + probSeq) % list.length];
    api.setTab('breakroom');
    launch(game, true, t ? { who:{ d:at, p:Math.max(0, (stateNow().desks[at]?.crew || []).indexOf(t)), t } } : {});
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-mg01]'); if (!b || !api) return;
    e.preventDefault(); e.stopPropagation();
    const action = b.dataset.mg01;
    if (action === 'retry') retry();
    else if (action === 'close') requestLeave();
    else if (action === 'pause') toGame('pause');
    else if (action === 'sound') { soundOn = !soundOn; frame?.contentWindow.postMessage({ bridge:'mg01', game:host.game, session:host.token, type:'mute', on:soundOn }, location.origin); update(); }
    else if (action === 'kind') { if (host && !host.run && !b.disabled) { host.rewarded = b.dataset.kind === 'rewarded'; if (host.rewarded) host.last = null; update(); } }
    else if (action === 'purchase') purchase(b.dataset.node);
    else if (action === 'fix') fixProblem();
    else if (action === 'fixwho') {
      const p = currentProblem(), crew = p && !p.global ? stateNow().desks?.[p.desk]?.crew || [] : [];
      let t = null; crew.forEach(c => { if (!t || (c.bd?.[p.fam] || 0) > (t.bd?.[p.fam] || 0)) t = c; });
      if (t) { sel = { d:p.desk, name:t.name }; pickDesk = p.desk; api.mark(); }
    }
    else if (action === 'whopick') { pickOpen = !pickOpen; api.mark(); }
    else if (action === 'pickdesk') { pickDesk = +b.dataset.d; api.mark(); }
    else if (action === 'who') {
      const d = +b.dataset.d, p = +b.dataset.p, t = stateNow().desks?.[d]?.crew?.[p];
      if (t) { sel = { d, name:t.name }; pickDesk = d; pickOpen = false; if (b.dataset.go) api.setSub?.('breakroom', b.dataset.go); api.mark(); }
    }
    else launch(b.dataset.game, action === 'rewarded');
  });
  /* the host's own buttons never take focus from the game, so pressing Pause or Sound does not blur-pause it */
  document.addEventListener('pointerdown', e => { if (overlay && e.target.closest('.mg01-run button')) e.preventDefault(); }, true);
  addEventListener('keydown', e => {
    if (!overlay) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); if (host.phase === 'play' || host.phase === 'pause') toGame('pause'); else requestLeave(); }
  }, true);
  addEventListener('message', receive);
  document.addEventListener('visibilitychange', () => { if (host) { host.receipt = playNow(); host.input = false; } });
  const hooks = {
    automaticTypingBonus:() => bonus('typing'), keeperWorkBonus:() => bonus('keeper'), titleSaleBonus:() => bonus('sale'),
    perk:kind => bonus(kind), deskFactor, badgeChip, tick,
    tab:['breakroom', 'i-game', 'Break Room', 'Play for Inspiration', 'Break', true], visible:a => unlocked(a.state()),
    init(_, a) { const first = !api; api = a; if (first) { IMI.on('tab', ({ tab }) => { if (overlay && tab !== 'breakroom') requestLeave(); }); IMI.onScreen(() => { if (overlay && IMI.screen() !== 'game') requestLeave(); }); } },
    render,
    reset() { pending = null; notice = ''; prob = null; tunes = []; nextAt = 0; ver++; sel = null; pickOpen = false; pickDesk = -1; cardDirty = true; close(); },
    away() { prob = null; tunes = []; cardDirty = true; },
    afterRender({ pane } = {}) {
      if (unlocked(api.state()) && saved() === undefined && !pending) ensure();
      else if (valid(saved()) && stale(saved())) settleStale();
      drawProblem();
    }
  };
  (window.__OPS_EXTENSIONS ||= []).push(['minigames', hooks]);
})();
