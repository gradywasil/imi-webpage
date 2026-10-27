/* Repairs: things break on the Floor (a leak over a machine, an ink jam, a napping keeper, a raven on the carriage) and every problem has its own repair,
   a WarioWare-style microgame (8-15 s; the rare big problems 40-45 s) that one of your typists plays over the Floor in minigames/repair.html.
   The repair's grade (0..1) is the verdict: Patched halves the time left, Fixed clears it and tunes the machine up, Perfect tunes it up harder.
   A problem pays once, in its family's Inspiration, and trains the fixer's badge; badges become set bonuses on the typist's own machine.
   Inspiration buys permanent Ideas (the Ideas tab). Current Ops state is the sole durable authority.
   The 15 Break Room games moved to monkey-hub's arcade; LEGACY keeps their ids so older saves still validate and an unfinished old run pays once. */
(() => {
  'use strict';
  if (!(window.GameFeatures?.enabled('mg01') ?? new URLSearchParams(location.search).get('mg01') === '1')) return;
  const FAMS = ['speed', 'keeper', 'sales', 'luck'];
  const FAM = {
    speed:  { name:'Speed',   ico:'u-fing',     stat:'typing',                use:'Warm hands and Bright ideas', hint:'Typewriter repairs. Their badges speed up their desk\'s typing.' },
    keeper: { name:'Keepers', ico:'s-keeper',   stat:'keeper speed',          use:'Fresh eyes',                  hint:'Word drawer repairs. Their badges speed up their desk\'s keeper.' },
    sales:  { name:'Sales',   ico:'d-reprints', stat:'title pay',             use:'Good stories',                hint:'Shop floor repairs. Their badges raise what their desk\'s titles pay.' },
    luck:   { name:'Luck',    ico:'u-rapid',    stat:'crits and lucky sales', use:'Lucky streak',                hint:'Bad-luck repairs. Their badges lift crit and lucky-sale odds on their desk.' }
  };
  const freeze = o => Object.freeze(Object.fromEntries(Object.entries(o).map(([k, v]) => [k, Object.freeze(v)])));
  /* the 15 Break Room games (now the hub's arcade). Only old saves use them: to validate best, recent, games and active.game, and to pay an unfinished run once.
     par: a good ordinary run; tune: per-mode [par x, pay x]. */
  const LEGACY = freeze({
    whack:{ fam:'speed', modes:['main'], par:3500 }, dash:{ fam:'speed', modes:['main'], par:2000 }, hop:{ fam:'speed', modes:['main'], par:120 }, slice:{ fam:'speed', modes:['main'], par:3000 },
    rhythm:{ fam:'speed', modes:['easy', 'normal', 'hard'], par:3500, tune:{ easy:[.7, .6], normal:[1, 1], hard:[1.3, 1.6] } },
    tidy:{ fam:'keeper', modes:['main'], par:3000 }, packer:{ fam:'keeper', modes:['main'], par:130 }, stack:{ fam:'keeper', modes:['main'], par:2500 },
    stall:{ fam:'sales', modes:['main'], par:1000 }, heist:{ fam:'sales', modes:['main'], par:300 }, barrel:{ fam:'sales', modes:['bananas', 'fruit'], par:1500 },
    shuffle:{ fam:'luck', modes:['main'], par:2500 }, plinko:{ fam:'luck', modes:['main'], par:1200 }, bowling:{ fam:'luck', modes:['main'], par:150 }, vine:{ fam:'luck', modes:['main'], par:450 }
  });
  /* ---------- the repairs (minigames/repairs/<id>.js; the runner's own list is MGRepair.LIST in repair-kit.js) ----------
     scope: desk (one machine), all (every machine) or global (a rotten banana). size: micro, or long (pays x3, 2.5x badge xp).
     pen: what the problem does to its family's stat through deskFactor. w: spawn weight; gate(sky) multiplies it (0 closes it); when: the gate in words.
     title/news take the desk's short name. tool: what the fixer does on the card ("Pip grabs a bucket"). ico/emo: the manual's picture (pixel / classic). */
  const PEN = { speed:.6, keeper:.5, sales:.85, luck:0 };
  const REPAIRS = {
    leak:     { fam:'keeper', verb:'CATCH',  secs:14, name:'Leak in the ceiling', title:d => `Leak in the ceiling over ${d}`, text:'Soggy word cards: it banks half as many words.', news:d => `Drip, drip. The ceiling over ${d} is leaking.`,
      tool:'grabs a bucket', how:'Slide a bucket under the drips and flick it out of the window when it fills.', ico:'drop', emo:'💧', w:2, gate:k => k.wx >= 1 ? 4 : 1, when:'More in the rain' },
    jam:      { fam:'speed',  verb:'SCRUB',  secs:10, name:'Ink jam', title:d => `Ink jam on ${d}`, text:'Typing there is 40% slower.', news:d => `Splat. Ink is gumming up the ${d} typebars.`,
      tool:'grabs a rag', how:'Rub the blotted typebar heads clean before the ink sets.', ico:'u-ink', emo:'🖋️', w:3 },
    keys:     { fam:'speed',  verb:'POP',    secs:10, name:'Banana mush in the keys', title:d => `Banana mush in the ${d} keys`, text:'Typing there is 40% slower.', news:d => `Someone ate lunch over ${d}. The keys are sticking.`,
      tool:'rolls up their sleeves', how:'Tap the stuck keys back up. Clean keys are decoys.', ico:'i-type', emo:'⌨️', w:2 },
    carriage: { fam:'speed',  verb:'SLAM',   secs:8,  name:"Carriage won't return", title:d => `${d} carriage won't return`, text:'Typing there is 40% slower.', news:d => `Clunk. The ${d} carriage is stuck at the end of the line.`,
      tool:'grabs the return lever', how:'Yank the lever while the needle is in the green, three times.', ico:'w-carriage', emo:'↩️', w:2 },
    ribbon:   { fam:'speed',  verb:'REEL',   secs:12, name:'Tangled ribbon', title:d => `${d} ribbon is tangled`, text:'Typing there is 40% slower.', news:d => `The ${d} ribbon has come off its spool. Again.`,
      tool:'grabs the spool', how:'Wind the slack back onto the spool without snapping it.', ico:'u-ribbon', emo:'🎀', w:2 },
    overheat: { fam:'speed',  verb:'FAN',    secs:10, name:'Overheating', title:d => `${d} is overheating`, text:'Typing there is 40% slower.', news:d => `Steam is rising from ${d}. Typists report warm fingers.`,
      tool:'grabs a palm leaf', how:'Fan it with a palm leaf to keep the needle out of the red.', ico:'sun', emo:'🔥', w:2 },
    nap:      { fam:'keeper', verb:'WAKE',   secs:9,  name:'Keeper nodded off', title:d => `${d} keeper nodded off`, text:'It banks half as many words.', news:d => `Snores from the ${d} word drawer. The keeper is asleep.`,
      tool:'grabs a banana', how:'Bonk the snoozing keeper at the bottom of each snore.', ico:'moon', emo:'💤', w:3 },
    termites: { fam:'keeper', verb:'SQUISH', secs:12, name:'Termites', title:d => `Termites in the ${d} word drawer`, text:'It banks half as many words.', news:d => `Termites found in the ${d} word drawer. They prefer long words.`,
      tool:'grabs a slipper', how:'Whack the termites before they nibble the word cards.', ico:'i-log', emo:'🐜', w:2 },
    cards:    { fam:'keeper', verb:'SORT',   secs:15, name:'Spilled card tray', title:d => `${d} keeper's card tray spilled`, text:'It banks half as many words.', news:d => `Word cards everywhere at ${d}. Mind your step.`,
      tool:'kneels by the tray', how:'Drop each word card in the slot for its length.', ico:'s-keeper', emo:'🗂️', w:2 },
    slump:    { fam:'sales',  verb:'SERVE',  secs:15, name:'Sales slump', title:d => `${d} titles are in a slump`, text:'They sell for 15% less.', news:d => `Readers are walking past the ${d} titles. Someone needs to sell them.`,
      tool:'opens the book stall', how:'Hand each reader the book they wish for before they give up.', ico:'d-reprints', emo:'📉', w:3 },
    typos:    { fam:'sales',  verb:'SPOT',   secs:14, name:'Typos in the proofs', title:d => `Typos in the ${d} proofs`, text:'They sell for 15% less.', news:d => `A reader found "teh" in a ${d} title. The proofs are recalled.`,
      tool:'grabs a red pen', how:'Tap the one misspelt word in each line as it scrolls by.', ico:'f-editorial', emo:'✏️', w:2 },
    shelf:    { fam:'sales',  verb:'SHELVE', secs:14, name:'Collapsed shelf', title:d => `The ${d} shelf collapsed`, text:'They sell for 15% less.', news:d => `Crash. The ${d} shelf gave way under its bestsellers.`,
      tool:'catches the falling books', how:'Drop each tumbling spine on the shelf of its colour.', ico:'f-backlist', emo:'📚', w:2 },
    jinx:     { fam:'luck',   verb:'BLOW',   secs:9,  name:'A black cloud', title:d => `A black cloud hangs over ${d}`, text:'No crits or lucky sales there.', news:d => `A small black cloud has settled over ${d}. Nobody walked under a ladder.`,
      tool:'takes a deep breath', how:'Hold to blow the little storm cloud out of the window.', ico:'cloud', emo:'🌩️', w:3 },
    raven:    { fam:'luck',   verb:'SHOO',   secs:9,  name:'A raven', title:d => `A raven perched on ${d}`, text:'No crits or lucky sales there.', news:d => `A raven sits on ${d}. It quoths, the typists say.`,
      tool:'gets ready to clap', how:'Clap only while it looks away.', ico:'i-quill', emo:'🐦‍⬛', w:2, gate:k => k.night ? 2 : 1, when:'More at night' },
    coconut:  { fam:'luck',   verb:'GLUE',   secs:10, name:'Cracked lucky coconut', title:d => `The lucky coconut on ${d} cracked`, text:'No crits or lucky sales there.', news:d => `The ${d} lucky coconut has a crack in it. Luck is leaking out.`,
      tool:'grabs the glue', how:'Hold the halves together, crack inside the band, while the glue sets.', ico:'i-coconut', emo:'🥥', w:2 },
    snack:    { fam:'speed',  verb:'SORT',   secs:12, scope:'global', pen:.75, name:'Spoiled snack', title:() => 'Spoiled snack', text:'The typists are queasy: all typing is slower.', news:() => 'A rotten banana got into the snacks. The whole Floor feels queasy.',
      tool:'checks the snack belt', how:'Flick the rotten bananas off the belt and let the good ones through.', ico:'banana', emo:'🍌', w:0, when:'Comes from a rotten banana' },
    critic:   { fam:'sales',  verb:'STAMP',  secs:10, scope:'global', pen:.8, name:'Bad review', title:() => 'Bad review', text:'A critic panned us: all titles sell for less.', news:() => 'A critic panned the whole list. Time to stamp some raves.',
      tool:'grabs the RAVE stamp', how:'Slam RAVE on the bad reviews only.', ico:'i-star', emo:'📰', w:0, when:'Comes from a rotten banana' },
    flood:    { fam:'keeper', verb:'BAIL & PATCH', secs:45, scope:'all', size:'long', name:'Storm flood', title:() => 'Storm flood on the Floor', text:"The water's rising: every keeper banks half as much.", news:() => 'The storm is pouring through the roof. The Floor is flooding.',
      tool:'grabs a bucket and a hammer', how:'Patch the roof, bail the water under the line, then fish out the word cards.', ico:'w-tray', emo:'🌊', w:1, gate:k => k.wx >= 3 ? 2 : k.wx >= 2 ? 1 : 0, when:'Only in heavy rain' },
    fuses:    { fam:'speed',  verb:'LIGHT',  secs:40, scope:'all', size:'long', pen:.5, name:'Blown fuses', title:() => 'Lightning blew the fuses', text:'Lights out: every typewriter types at half speed.', news:() => 'Bang. The lights are out across the Floor.',
      tool:'straps on a headlamp', how:'Find and flip the breakers in the dark. Mind the sparking wires.', ico:'spark', emo:'⚡', w:1, gate:k => k.wx >= 2 || k.night ? 1 : 0, when:'In storms or at night' },
    tangle:   { fam:'speed',  verb:'UNTANGLE', secs:40, scope:'all', size:'long', name:'The Great Ribbon Tangle', title:() => 'The Great Ribbon Tangle', text:'Ribbons everywhere: all typing 40% slower.', news:() => 'Every ribbon on the Floor has tied itself to every other ribbon.',
      tool:'rolls up their sleeves', how:'Drag the spools until no ribbons cross.', ico:'i-reel', emo:'🧶', w:1 }
  };
  for (const [id, r] of Object.entries(REPAIRS)) Object.freeze(Object.assign(r, { id, scope:r.scope || 'desk', size:r.size || 'micro', pen:r.pen ?? PEN[r.fam], pay:r.size === 'long' ? 3 : 1, life:r.scope === 'global' ? 120 : r.size === 'long' ? 300 : 240 }));
  Object.freeze(REPAIRS);
  const IDS = Object.keys(REPAIRS);
  const CURVE_UP = .85, CURVE_LOW = 1.15, FRESH = 1.25, MAX_PLAY = 3600;
  const FIX_AT = .4, PERFECT_AT = .85, STARS_AT = [.4, .65, .85];      // the kit's MG.VERDICT_AT / MG.STARS_AT (minigames/mg-core.js)
  const verdictOf = g => g <= 0 ? 'NOT FIXED' : g < FIX_AT ? 'PATCHED' : g < PERFECT_AT ? 'FIXED' : 'PERFECT';
  const starsOf = g => STARS_AT.filter(x => g >= x).length;
  /* The ideas. Each track is bought one level at a time; vals[] is the cumulative effect, so a card reads "+35% › +70%".
     Past the last listed level a track with a tail keeps going (value grows by tail, cost by grow) so Inspiration never stops being worth something.
     fam is the family of Inspiration that pays for it; 'any' tracks take whatever you hold. room and pace keep their ids and levels (old purchases carry over). */
  const pct = v => `+${Math.round(v * 100)}%`;
  const TRACKS = {
    hands:   { fam:'speed',  name:'Warm hands',    ico:'u-fing',     fx:'typing', unit:'automatic typing',   vals:[.15, .35, .7, 1.3, 2.3],  tail:1,   cost:[150, 600, 2400, 9500, 38e3],  grow:1.6, show:v => pct(v) },
    keepers: { fam:'keeper', name:'Fresh eyes',    ico:'s-keeper',   fx:'keeper', unit:'keeper speed',       vals:[.15, .35, .7, 1.3, 2.3],  tail:1,   cost:[170, 680, 2700, 10.5e3, 42e3], grow:1.6, show:v => pct(v) },
    sales:   { fam:'sales',  name:'Good stories',  ico:'d-reprints', fx:'sale',   unit:'title income',       vals:[.1, .25, .5, .9, 1.5],    tail:.75, cost:[220, 900, 3600, 14e3, 56e3],   grow:1.6, show:v => pct(v) },
    flash:   { fam:'speed',  name:'Bright ideas',  ico:'i-insp',     fx:'flash',  unit:'inspired typists',   vals:[.3, .6, 1, 1.5],          secs:[4, 8, 12, 18], cost:[400, 1800, 7e3, 28e3], show:(v, lv) => `×${(1 + v).toFixed(1)} often · +${TRACKS.flash.secs[lv - 1]}s` },
    luck:    { fam:'luck',   name:'Lucky streak',  ico:'u-rapid',    fx:'luck',   unit:'crits, hot sales, Golden Hours', vals:[.2, .45, .8, 1.3, 2], cost:[350, 1600, 6500, 26e3, 100e3], show:v => pct(v) },
    room:    { fam:'any',    name:'Toolbox',       ico:'x-salvage',  fx:'toolbox', unit:'tune-up strength and length', vals:[.1, .2, .3, .45, .6], cost:[120, 500, 2e3, 8e3, 30e3],  show:v => pct(v) },
    pace:    { fam:'any',    name:'Steady hands',  ico:'s-metro',    fx:'extra',  unit:'seconds on every repair', vals:[1, 2, 3, 4, 5],     cost:[250, 1200, 5e3, 20e3, 75e3],   show:v => `+${v}s` },
    muse:    { fam:'any',    name:'Studio notes',  ico:'i-works',    fx:'yield',  unit:'Inspiration per repair', vals:[.2, .45, .8, 1.3],    tail:.5,  cost:[300, 1500, 6e3, 24e3],         grow:1.5, show:v => pct(v) }
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
    const lv = levelsOf(m), at = id => valueAt(TRACKS[id], lv[id] || 0);
    const v = { lv, typing:at('hands'), keeper:at('keepers'), sale:at('sales'), luck:at('luck'), yield:at('muse'), toolbox:at('room'), extra:at('pace'),
      flashFreq:at('flash'), flashSecs:lv.flash ? TRACKS.flash.secs[Math.min(lv.flash, TRACKS.flash.secs.length) - 1] : 0 };
    memo = { m, v }; return v;
  };
  /* What a repair pays grows with how far the room has come (every machine owned is x1.3, every Printing x1.2), which keeps the Ideas worth chasing as their prices climb.
     Repairs are the only source of Inspiration, so the base is 225 (the Break Room's was 180; an old unfinished run is still paid on 180). */
  const BASE_PAY = 225, LEGACY_PAY = 180;
  const stateNow = () => api?.state?.() || {};
  const ownedN = () => Math.max(1, (stateNow().desks || []).filter(d => d?.owned).length);
  const basePay = (base = BASE_PAY) => Math.round(base * Math.pow(1.3, ownedN() - 1) * Math.pow(1.2, stateNow().printing || 0) / 10) * 10;
  /* a repair's grade g pays .25-.45 of the base when it only patches, .78-1.2 when it fixes, and x1.15 more for a Perfect; long repairs pay x3 */
  const payFactor = g => g < FIX_AT ? .25 + .5 * g : .5 + .7 * g;
  const repairWorth = (m, R, g) => g > 0 ? Math.max(1, Math.floor(basePay() * R.pay * payFactor(g) * (g >= PERFECT_AT ? 1.15 : 1) * (1 + derived(m).yield))) : 0;
  /* an old Break Room run: (score / par) ^ 0.85 above par, ^1.15 below, x1.25 if the game was Fresh */
  const tuneOf = (id, mode) => LEGACY[id].tune?.[mode] || [1, 1];
  const bestKey = (id, mode) => LEGACY[id].modes.length > 1 ? `${id}:${mode}` : id;
  const isFresh = (m, id) => !(m.recent || []).slice(0, 2).includes(id);
  const ratioOf = (id, mode, score) => { const par = LEGACY[id].par * tuneOf(id, mode)[0]; return Math.min(score, par * 60) / par; };
  const curve = r => Math.pow(r, r < 1 ? CURVE_LOW : CURVE_UP);
  const legacyWorth = (m, id, mode, score) => score > 0 ? Math.max(1, Math.floor(basePay(LEGACY_PAY) * tuneOf(id, mode)[1] * curve(ratioOf(id, mode, score)) * (1 + derived(m).yield) * (isFresh(m, id) ? FRESH : 1))) : 0;
  /* ---------- typists: a badge in one family, trained by repairs, that pays back on the typist's own machine ---------- */
  const BD_XP = 100, BD_UNIT = 60;                                   // a par run was 100 badge xp; level L needs 60 x L^2 xp, so there is no last level
  const bdLevel = xp => Math.floor(Math.sqrt((xp || 0) / BD_UNIT));
  const badgeOf = t => { let best = null, lv = 0; for (const f of FAMS) { const l = bdLevel(t?.bd?.[f]); if (l > lv) { lv = l; best = f; } } return best ? { fam:best, lv } : null; };
  const typistFresh = (m, t) => !(t?.bd?.at > 0) || m.nextSession - t.bd.at > 3;
  const legacyXp = (m, id, mode, score, t) => Math.max(1, Math.round(BD_XP * curve(ratioOf(id, mode, score)) * (typistFresh(m, t) ? FRESH : 1)));
  const repairXp = (m, R, g, t) => g > 0 ? Math.max(1, Math.round(BD_XP * payFactor(g) * (R.pay === 3 ? 2.5 : 1) * (typistFresh(m, t) ? FRESH : 1))) : 0;
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
  /* the fixer: on the problem's desk (every desk for a Floor-wide one), whoever repaired longest ago, then whoever has the least xp in that family.
     That spreads badges across the crew, which is what grows the set tiers. */
  function fixer(p) {
    const desks = stateNow().desks || [], ids = p.scope === 'desk' ? [p.desk] : desks.map((d, i) => d?.owned ? i : -1).filter(i => i >= 0);
    let best = null;
    for (const d of ids) (desks[d]?.crew || []).forEach((t, k) => { const at = t.bd?.at || 0, xp = t.bd?.[p.fam] || 0; if (!best || at < best.at || at === best.at && xp < best.xp) best = { d, p:k, t, at, xp }; });
    return best;
  }
  /* ---------- floor problems: runtime only (a leak is not worth a save) ----------
     The first comes 180 s after repairs unlock, then every 270-480 s (quicker with more machines in use); one at a time. A long problem is about one spawn
     in nine (1 in 8 after a micro one, never two in a row). A rotten banana's Spoiled snack or Bad review becomes a Floor-wide problem of its own. */
  const FIRST_PROBLEM = 180, EVERY_PROBLEM = [270, 210], LONG_ODDS = 1 / 8;
  let T = 0, nextAt = 0, probSeq = 0, prob = null, tunes = [], lastLong = false, cardAt = -9, cardDirty = true, curTab = 'floor';
  const mix = n => { n = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b); n ^= n >>> 13; n = Math.imul(n, 0xc2b2ae35); return (n ^ n >>> 16) >>> 0; };    // a problem never draws from the game's random stream
  const unit = n => mix(n) / 4294967296;
  const skyNow = () => api?.sky?.() || window.World?.at?.(Date.now()) || { wx:0, night:false };
  const weightOf = (id, sky) => { const R = REPAIRS[id]; return R.w * (R.gate ? R.gate(sky) : 1); };
  function pickKind(h, sky) {
    const open = size => IDS.filter(id => REPAIRS[id].size === size && weightOf(id, sky) > 0), longs = open('long');
    const list = longs.length && !lastLong && unit(h + 3) < LONG_ODDS ? longs : open('micro');
    let x = unit(h + 5) * list.reduce((n, id) => n + weightOf(id, sky), 0);
    for (const id of list) { x -= weightOf(id, sky); if (x < 0) return id; }
    return list[list.length - 1];
  }
  const live = p => !!p && (p.until > T || host?.prob === p);         // a problem being repaired waits for the verdict
  const currentProblem = () => live(prob) ? prob : null;
  function deskFactor(i, kind) {
    const fam = KIND[kind]; if (!fam || !api) return 1;
    const m = saved(); if (m !== undefined && !validOnce(m)) return 1;
    let f = 1 + deskSet(i).bonus[fam];
    for (const t of tunes) if (t.desk === i && t.fam === fam && t.until > T) f *= t.mult;
    if (live(prob) && prob.fam === fam && (prob.scope !== 'desk' || prob.desk === i)) f *= prob.pen;
    return f;
  }
  const validMemo = new WeakMap();       // deskFactor is asked every tick, so a save object is checked once
  const validOnce = m => { let ok = validMemo.get(m); if (ok === undefined) validMemo.set(m, ok = !!valid(m)); return ok; };
  const unlocked = S => !!S?.intro?.done && (S.meta?.minigames !== undefined || (S.printing || 0) > 0 || Object.keys(S.written || {}).length >= 3);
  const eligible = () => (stateNow().desks || []).map((d, i) => d?.owned && d.paws > 0 ? i : -1).filter(i => i >= 0);
  function arrive(kind, desk) {
    const R = REPAIRS[kind];
    prob = { id:++probSeq, kind, desk, fam:R.fam, scope:R.scope, pen:R.pen, until:T + R.life, paid:false, patched:false };
    lastLong = R.size === 'long'; cardDirty = true; IMI.sfx?.tick?.(); api.mark();
    api.note?.(R.news(desk >= 0 ? api.deskInfo(desk).name : ''));
  }
  function spawn(m, kind) {
    const elig = eligible(); if (!elig.length) return false;
    const h = mix(m.nextSession * 7919 + (probSeq + 1) * 104729 + Math.floor(T)), id = REPAIRS[kind] ? kind : pickKind(h, skyNow()), R = REPAIRS[id];
    arrive(id, R.scope === 'desk' ? elig[mix(h) % elig.length] : -1);
    nextAt = T + (EVERY_PROBLEM[0] + EVERY_PROBLEM[1] * (mix(h + 1) % 100) / 100) / (1 + .1 * (elig.length - 1));
    return true;
  }
  /* a rotten banana: its 20 s buff is cleared so it cannot hit twice, and the problem's own penalty runs through deskFactor on every machine until it is repaired */
  function rotten(k) { api.clearBuff?.(k); arrive(k === 'sluggish' ? 'snack' : 'critic', -1); }
  const mmss = s => `${Math.floor(s / 60)}:${String(Math.max(0, Math.floor(s % 60))).padStart(2, '0')}`;
  /* the verdict on the Floor. Patched: half the time left (it can be repaired again, unpaid, to clear it). Fixed / Perfect: cleared, and the machine
     (every machine, for a Floor-wide problem; none for a rotten banana) is tuned up. A new tune-up replaces the old one for that machine and family. */
  function applyFix(p, g) {
    if (!(g > 0)) return 'The problem is still there.';
    if (p !== prob || !live(p)) return 'It had already cleared up.';
    if (g < FIX_AT) { p.until = T + Math.max(0, p.until - T) / 2; p.patched = true; cardDirty = true; return `Patched: ${mmss(p.until - T)} left.`; }
    prob = null; cardDirty = true;
    if (p.scope === 'global') return `${REPAIRS[p.kind].name} cleared.`;
    const tb = derived(saved()).toolbox, mult = 1 + Math.min(.6, .15 + .3 * g) * (1 + tb), until = T + (120 + 120 * g) * (1 + tb);
    const desks = p.scope === 'all' ? (stateNow().desks || []).map((d, i) => d?.owned ? i : -1).filter(i => i >= 0) : [p.desk];
    tunes = tunes.filter(t => t.fam !== p.fam || !desks.includes(t.desk)).concat(desks.map(desk => ({ desk, fam:p.fam, mult, until, grp:p.id })));
    return `${p.scope === 'all' ? 'Every machine' : api.deskInfo(p.desk).name} tuned up ${pct(mult - 1)} for ${mmss(until - T)}.`;
  }
  /* the problem card: title, effect and who fixes it (on the Floor the last two share one clamped line; the whole text is the tooltip) */
  function probCard(p) {
    const R = REPAIRS[p.kind], w = fixer(p), ok = valid(saved()) || saved() === undefined, title = R.title(p.desk >= 0 ? api.deskInfo(p.desk).name : '');
    const who = w ? `${w.t.name} ${R.tool}${p.paid ? ' · already paid' : ''}` : '';
    return `<div class="o-card mg-prob${p.patched ? ' patched' : ''}" data-fam="${R.fam}" data-kind="${p.kind}"><div class="mg-prob-main" title="${esc(`${title}. ${R.text}${who ? ` ${who}.` : ''}`)}"><b>${famIco(R.fam)}<span class="mg-prob-ttl">${esc(title)}</span></b><span class="mg-prob-fx">${R.text}${who ? `<small class="mg-prob-who">${esc(who)}</small>` : ''}</span></div>
      <span class="mg-prob-time">${p.patched ? '<i>PATCHED</i>' : ''}${mmss(Math.max(0, p.until - T))}</span>${ok && !overlay && !pending ? `<button type="button" class="o-btn gold sm" data-mg01="fix">${p.patched ? 'Finish it' : 'Fix it'}</button>` : ''}</div>`;
  }
  /* a tune-up is a chip: family icon, machine, boost, time left ("tuned up" and the stat are spoken, and in the tooltip) */
  const tuneIco = f => `<span class="mg-famico" data-fam="${f}" aria-hidden="true">${api.shop.ico(FAM[f].ico, 20)}</span>`;
  function problemCard() {
    const p = currentProblem(), part = [];
    if (pending && !overlay) part.push(`<div class="o-card mg-prob"><div class="mg-prob-main"><b><span class="mg-prob-ttl">Could not save</span></b><span class="mg-prob-fx">${notice}</span></div><button type="button" class="o-btn gold sm" data-mg01="retry">Retry save</button></div>`);
    if (p) part.push(probCard(p));
    const groups = new Map();                                        // a Floor-wide fix tunes every machine: one chip for the lot
    for (const t of tunes) if (t.until > T) { const k = t.grp + ':' + t.fam; if (!groups.has(k)) groups.set(k, []); groups.get(k).push(t); }
    for (const [t, n] of [...groups.values()].map(g => [g[0], g.length])) {
      const name = n > 1 ? 'Every machine' : api.deskInfo(t.desk).name;
      part.push(`<div class="mg-prob good mg-tune" data-fam="${t.fam}" title="${esc(`${name} tuned up: ${FAM[t.fam].stat} ${pct(t.mult - 1)}`)}">${tuneIco(t.fam)}<b>${n > 1 ? 'All' : esc(name)}</b><span class="mg-sr"> ${n > 1 ? 'machines ' : ''}tuned up, ${FAM[t.fam].stat}</span><span class="mg-tune-fx">${pct(t.mult - 1)}</span><span class="mg-prob-time">${mmss(t.until - T)}</span></div>`);
    }
    return part.join('');
  }
  /* the Floor shows what is wrong: #opsRoot[data-problem] while the machine on screen is hit (always, for a Floor-wide one); minigame-progression.css draws it */
  function stageHook() {
    const root = document.getElementById('opsRoot'); if (!root) return;
    const p = currentProblem(), k = p && (p.scope !== 'desk' || p.desk === stateNow().sel) ? p.kind : '';
    if ((root.dataset.problem || '') !== k) { if (k) root.dataset.problem = k; else delete root.dataset.problem; }
  }
  function drawProblem() {
    cardAt = T; cardDirty = false;
    if (!api) return;
    stageHook();
    const el = document.getElementById('oProblem'); if (!el) return;
    api.morph(el, problemCard()); api.hydrate(el);
  }
  function tick(e) {
    const dt = e?.gameSeconds; if (!api || !(dt > 0)) return;
    T += dt;
    if (prob && !live(prob)) { prob = null; cardDirty = true; api.mark(); }
    if (tunes.length && tunes.some(t => t.until <= T)) { tunes = tunes.filter(t => t.until > T); cardDirty = true; }
    const S = stateNow(), m = saved();
    if (m !== undefined && validOnce(m) && unlocked(S) && !prob && !overlay && !pending) {
      const rot = api.problemsAllowed?.() && ['sluggish', 'critic'].find(k => api.buffLeft?.(k) > 0);
      if (rot) rotten(rot);
      else if (!nextAt) nextAt = T + FIRST_PROBLEM;
      else if (T >= nextAt && api.problemsAllowed?.()) spawn(m);
    }
    if (cardDirty || T - cardAt >= 1) drawProblem();
  }
  const bonus = kind => { const m = api && saved(); return valid(m) ? derived(m)[kind] : 0; };
  let api, overlay, frame, host, pending, notice = '', returnFocus, launchSeq = 0, shown = 0, rollRaf = 0, soundOn = true;
  const copy = value => JSON.parse(JSON.stringify(value));
  const classic = () => document.documentElement.dataset.style === 'classic';
  const saved = () => api.state().meta.minigames;
  const bounded = (n, max) => Number.isFinite(n) && n >= 0 && n <= max;
  const validWho = w => !!w && Number.isInteger(w.d) && w.d >= 0 && w.d < 6 && typeof w.name === 'string' && w.name.length > 0 && w.name.length <= 60;
  const validRep = r => !!r && typeof r === 'object' && Number.isSafeInteger(r.n) && r.n >= 0 && Number.isInteger(r.best) && r.best >= 0 && r.best <= 100;
  /* every save that validated for the Break Room still does: legacy ids for best/recent/games/active, any attempts count 0..999 (breaks are gone; the field stays) */
  function valid(m) {
    return m && m.version === 1 && Number.isSafeInteger(m.wallet) && m.wallet >= 0 && bounded(m.fraction, 1) && m.fraction < 1 &&
      (m.pool === undefined || m.pool && typeof m.pool === 'object' && FAMS.every(f => Number.isSafeInteger(m.pool[f]) && m.pool[f] >= 0)) &&
      (m.who === undefined || validWho(m.who)) &&
      (m.nodes === undefined || Array.isArray(m.nodes) && m.nodes.every(id => Object.hasOwn(OLD, id)) && new Set(m.nodes).size === m.nodes.length) &&
      (m.lv === undefined || m.lv && typeof m.lv === 'object' && Object.entries(m.lv).every(([id, n]) => Object.hasOwn(TRACKS, id) && Number.isInteger(n) && n >= 0 && n <= maxLv(TRACKS[id]) && n <= 999)) &&
      (m.best === undefined || m.best && typeof m.best === 'object' && Object.entries(m.best).every(([k, n]) => /^[a-z]+(:[a-z]+)?$/.test(k) && Object.hasOwn(LEGACY, k.split(':')[0]) && bounded(n, 1e9))) &&
      (m.recent === undefined || Array.isArray(m.recent) && m.recent.length <= 3 && m.recent.every(id => Object.hasOwn(LEGACY, id))) &&
      (m.games === undefined || Array.isArray(m.games) && m.games.every(id => Object.hasOwn(LEGACY, id)) && new Set(m.games).size === m.games.length) &&
      (m.rep === undefined || m.rep && typeof m.rep === 'object' && !Array.isArray(m.rep) && Object.entries(m.rep).every(([id, r]) => Object.hasOwn(REPAIRS, id) && validRep(r))) &&
      Number.isInteger(m.attempts) && bounded(m.attempts, 999) && bounded(m.refillAt, Number.MAX_SAFE_INTEGER) &&
      Number.isSafeInteger(m.nextSession) && m.nextSession > 0 && Number.isSafeInteger(m.settled) && m.settled >= 0 && m.settled < m.nextSession &&
      (m.active === null || ((Object.hasOwn(LEGACY, m.active?.game) || Object.hasOwn(REPAIRS, m.active?.game)) && Number.isSafeInteger(m.active.id) && m.active.id > m.settled && m.active.id < m.nextSession && bounded(m.active.played, MAX_PLAY) &&
        (m.active.score === undefined || bounded(m.active.score, 1e9)) && (m.active.mode === undefined || (LEGACY[m.active.game]?.modes || ['main']).includes(m.active.mode)) &&
        (m.active.who === undefined || validWho(m.active.who)) && (m.active.free === undefined || m.active.free === 1)));
  }
  function fresh() { return { version:1, wallet:0, fraction:0, pool:{ speed:0, keeper:0, sales:0, luck:0 }, attempts:6, refillAt:api.clock.wallNow(), nextSession:1, active:null, settled:0 }; }
  /* ---------- ideas ---------- */
  const level = (m, id) => derived(m).lv[id] || 0;
  function purchase(id) {
    if (overlay || pending || !valid(saved())) return;
    const m = saved(), t = TRACKS[id]; if (!t || m.active) return;
    const lv = level(m, id), left = lv >= maxLv(t) ? null : afford(m, t.fam, costAt(t, lv));
    if (!left) return;
    const next = copy(m); next.lv = { ...derived(m).lv, [id]:lv + 1 }; delete next.nodes; next.pool = left.pool; next.wallet = left.wallet;
    commit(next, () => { IMI.sfx.ding?.(); });
  }
  const fmt = n => n < 1e4 ? Math.round(n).toLocaleString('en-US') : n < 1e6 ? (n / 1e3).toFixed(n < 1e5 ? 1 : 0).replace(/\.0$/, '') + 'K' : (n / 1e6).toFixed(n < 1e7 ? 2 : 1).replace(/\.?0+$/, '') + 'M';
  const amt = (n, cls = '') => window.Gems?.amount('insp', typeof n === 'number' ? fmt(n) : n, cls) || String(n);
  const gem = (cls = '') => window.Gems?.html('insp', cls) || '';
  const famAmt = (f, n, cls = '') => f === 'any' ? amt(n, cls) : `<span class="mg-famamt" data-fam="${f}">${amt(n, cls)}</span>`;
  const famIco = f => `<span class="mg-famico" data-fam="${f}">${api.shop.cart(FAM[f].ico)}</span>`;
  const esc = s => api.esc ? api.esc(s) : String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
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
      if (host) toGame('hold');
      update(); cardDirty = true; api.mark(); return false;
    }
    if (badge) { ver++; cardDirty = true; }
    notice = ''; done(); update(); api.mark(); return true;
  }
  function retry() {
    if (!pending) return;
    const p = pending, result = api.commitMinigames(p.expected, p.next, p.badge);
    if (!result.ok) { notice = 'Still could not save. Your result is waiting for Retry.'; update(); api.mark(); return; }
    if (p.badge) ver++;
    pending = null; notice = ''; cardDirty = true; p.done(); update(); api.mark();
  }
  const addPool = (m, fam, n) => { const pool = poolOf(m); pool[fam] += n; return pool; };
  /* a run interrupted by a closed tab: an old Break Room run is paid once for the score it had reached; a repair is cleared unpaid (problems do not survive a reload) */
  const stale = m => m.active && !host;
  function settleStale() {
    const m = saved(); if (!api || pending || !valid(m) || !stale(m)) return;
    const a = m.active, next = copy(m); next.settled = a.id; next.active = null;
    if (!LEGACY[a.game]) { commit(next); return; }
    const score = a.score ?? 0, g = a.game, mode = a.mode || LEGACY[g].modes[0], fam = LEGACY[g].fam;
    const total = a.score === undefined ? Math.floor(Math.min(60, a.played) * 10 / 60) : legacyWorth(m, g, mode, score);
    next.pool = addPool(m, fam, total);
    if (score > 0) { next.best = { ...(m.best || {}), [bestKey(g, mode)]:Math.max(score, m.best?.[bestKey(g, mode)] || 0) }; next.recent = [g, ...(m.recent || []).filter(x => x !== g)].slice(0, 2); }
    const who = score > 0 && a.who && findTypist(a.who), badge = who ? { d:who.d, name:who.t.name, fam, xp:legacyXp(m, g, mode, score, who.t), at:a.id } : null;
    commit(next, () => { if (total) { notice = `Banked ${fmt(total)} Inspiration from your last Break Room game.`; window.Juice?.fly('insp', [innerWidth / 2, innerHeight / 2], Math.min(12, Math.max(3, Math.ceil(Math.log10(total + 1) * 3)))); } }, badge);
  }
  function ensure() {
    if (saved() === undefined) return commit(fresh());
    if (!valid(saved())) { notice = 'This Ideas save is unsupported. It has been kept unchanged.'; return false; }
    settleStale();
    return !pending;
  }
  const badgeText = t => { const b = badgeOf(t); return b ? `${FAM[b.fam].name} Lv ${b.lv}` : 'No badge yet'; };
  const badgeChip = t => { const b = badgeOf(t); return b ? `<span class="o-chip mg-badge" data-fam="${b.fam}" title="Repair badge. ${FAM[b.fam].hint}">★ ${FAM[b.fam].name} Lv ${b.lv}</span>` : ''; };
  /* ---------- the Ideas tab: Ideas, Crew, Repairs ---------- */
  function wallet(m) {
    const pool = poolOf(m);
    return `<div class="mg-wallet">${FAMS.map(f => `<span class="mg-pool" data-fam="${f}" title="${FAM[f].name} Inspiration, from ${FAM[f].name} repairs. It buys ${FAM[f].use}.">${famIco(f)}${amt(pool[f])}</span>`).join('')}${m.wallet ? `<span class="mg-pool" title="Loose Inspiration from before the families. It buys anything.">${amt(m.wallet)}</span>` : ''}</div>`;
  }
  function render(_, pane) {
    const m = saved(), ok = valid(m), sub = api.sub('ideas') || 'ideas', p = currentProblem();
    const tabs = api.subTabs('ideas', [['ideas', 'Ideas', ok ? buyable(m) || '' : ''], ['crew', 'Crew'], ['repairs', 'Repairs', p ? '!' : '']]);
    const body = sub === 'crew' ? crewPane() : sub === 'repairs' ? repairsPane(m, ok, p) : (ok ? wallet(m) : '') + ideas(m);
    api.morph(pane, `<div class="mg01-choices">${tabs}${body}${notice ? `<p role="status" class="o-warn">${notice}</p>` : ''}${pending ? '<button type="button" class="o-btn gold" data-mg01="retry">Retry save</button>' : ''}</div>`);
    api.hydrate(pane);
  }
  /* each machine's crew: how many of each badge it holds, the tier that earns, and who is on the roster */
  function crewPane() {
    const desks = (stateNow().desks || []).map((d, i) => d?.owned && d.crew?.length ? i : -1).filter(i => i >= 0);
    if (!desks.length) return '<p class="o-dim">Hire typists in Train. Each one fixes problems on the Floor and earns a badge, and the badges pay back on their own machine.</p>';
    const intro = `<p class="o-dim mg-crewnote">A typist's badge is the family they have repaired most, and the fixer is whoever on the desk repaired longest ago, so badges spread. They pay back on their own machine: each level adds a little, 3, 6, 12, 24 and 48 of one badge on a desk earn set bonuses, and one of every family is a full house.</p>`;
    return intro + desks.map(i => {
      const dk = api.deskInfo(i), s = deskSet(i), crew = stateNow().desks[i].crew;
      const rows = FAMS.map(f => { const nt = nextTier(s.n[f]); return `<div class="mg-set" data-fam="${f}" title="${FAM[f].hint}"><span class="mg-setname">${famIco(f)}${FAM[f].name}</span><span class="mg-setn">${s.n[f]}${nt ? `<small>/${nt}</small>` : ''}</span><b class="mg-setfx">${pct(s.bonus[f])}</b><small>${FAM[f].stat}</small></div>`; }).join('');
      return `<div class="o-card mg-desk" style="--c:${dk.color}"><div class="o-row"><h3>${esc(dk.full)}</h3><span class="o-dim">${crew.length} typists${s.sets ? ` · ${s.sets} full house${s.sets > 1 ? 's' : ''} (${pct(FULL * s.sets)} to all)` : ''}</span></div><div class="mg-sets">${rows}</div>
        <div class="mg-roster">${crew.map(t => { const b = badgeOf(t); return `<span class="mg-chip"${b ? ` data-fam="${b.fam}"` : ''} title="${esc(t.name)}: ${badgeText(t)}">${esc(t.name)}${b ? `<i>${b.lv}</i>` : ''}</span>`; }).join('')}</div></div>`;
    }).join('');
  }
  /* the repair manual: every problem, ??? until you have tried its repair (or it is on the Floor now), with times fixed and the best grade as stars */
  function repairsPane(m, ok, p) {
    const log = ok ? m.rep || {} : {}, icon = R => classic() ? `<span class="mg-rep-emo" aria-hidden="true">${R.emo}</span>` : api.shop.cart(R.ico);
    const top = p ? probCard(p) : '<div class="o-card mg-prob good mg-calm"><div class="mg-prob-main"><b>Nothing is broken right now</b><span class="mg-prob-fx">Something on the Floor always breaks sooner or later.</span></div></div>';
    const intro = `<p class="o-dim mg-crewnote">Every problem has its own repair: one verb, a few seconds. A fix pays up to ${amt(repairWorth(ok ? m : {}, { pay:1 }, 1))} in its family's Inspiration (big ones three times that), trains the typist who fixed it, and tunes the machine up for a while.</p>`;
    const card = id => {
      const R = REPAIRS[id], r = log[id], seen = !!r || p?.kind === id, stars = r ? starsOf(r.best / 100) : 0;
      return `<div class="o-card mg-rep${seen ? '' : ' unseen'}" data-fam="${R.fam}"><span class="mg-rep-ico">${icon(R)}</span><b class="mg-rep-name">${seen ? R.name : '???'}</b>
        <span class="mg-stars" role="img" aria-label="${stars} of 3 stars">${[0, 1, 2].map(k => `<i class="${k < stars ? 'on' : ''}">★</i>`).join('')}</span>
        <small class="mg-rep-tag">${seen ? `<em>${R.verb}</em> · ` : ''}${FAM[R.fam].name}${R.size === 'long' ? ' · BIG' : ''}${R.scope === 'desk' ? '' : R.scope === 'all' ? ' · every machine' : ' · whole Floor'}</small>
        <span class="mg-rep-how">${seen ? R.how : R.when || 'Not met yet.'}</span><small class="mg-rep-log">${r ? `${r.n ? `Fixed ${r.n}×` : 'Not fixed yet'} · best ${r.best}%` : seen ? 'Not tried yet' : ''}</small></div>`;
    };
    return top + intro + `<div class="mg-reps">${IDS.map(card).join('')}</div>`;
  }
  /* ---------- the repair, over the Floor ---------- */
  const SVG = {
    pause:'<svg viewBox="0 0 16 16"><path d="M4 2h3v12H4zM9 2h3v12H9z"/></svg>', play:'<svg viewBox="0 0 16 16"><path d="M4 2l10 6-10 6z"/></svg>',
    on:'<svg viewBox="0 0 16 16"><path d="M2 6h3l4-3v10l-4-3H2z"/><path d="M11 5q2 3 0 6M13 3q4 5 0 10" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
    off:'<svg viewBox="0 0 16 16"><path d="M2 6h3l4-3v10l-4-3H2z"/><path d="M11 6l4 4M15 6l-4 4" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
    out:'<svg viewBox="0 0 16 16"><path d="M9 2L3 8l6 6V10h4V6H9z"/></svg>'
  };
  const VKEY = { 'NOT FIXED':'no', PATCHED:'patch', FIXED:'fix', PERFECT:'perfect' };
  /* difficulty grows with the room: up to +.55 over six machines and +.1 per Printing (to four) */
  const repairLevel = () => Math.max(0, Math.min(1, (ownedN() - 1) / 5 * .55 + Math.min(stateNow().printing || 0, 4) * .1));
  /* a caller-owned test fixture may add the autoplayer to the frame's URL (only bot / warp, only numbers) */
  const devQuery = () => { const q = window.__MG01_REPAIR_Q; return typeof q === 'string' && /^(bot|warp)=\d+(\.\d+)?(&(bot|warp)=\d+(\.\d+)?)?$/.test(q) ? '&' + q : ''; };
  function launch(p, w) {
    const R = REPAIRS[p.kind], m = saved(), desk = p.scope === 'desk' ? p.desk : w ? w.d : Math.max(0, stateNow().sel || 0);
    host = { game:p.kind, prob:p, token:++launchSeq, run:null, charged:false, phase:'title', touched:false, elapsed:0, sequence:0, last:null, tab:curTab,
      who:w ? { d:w.d, name:w.t.name } : null, typist:w };
    try { soundOn = JSON.parse(localStorage.getItem('mg:sound') ?? 'true') !== false; } catch { soundOn = true; }
    returnFocus = document.activeElement;
    overlay = document.createElement('div'); overlay.className = 'mg01-overlay'; overlay.dataset.game = p.kind;
    overlay.innerHTML = `<div class="mg01-layout"><div class="mg01-well"><iframe class="mg01-frame" title="${esc(R.name)} repair" allow="fullscreen"></iframe></div>
      <aside class="o-card mg01-run" aria-label="Repair">
        <h2 class="mg01-name">${famIco(R.fam)}<span>${esc(R.title(p.desk >= 0 ? api.deskInfo(p.desk).name : ''))}</span></h2>
        <p class="mg01-prob">${R.text}</p>
        <div class="mg01-who" data-fam="${R.fam}"></div>
        <div class="mg01-pay" aria-live="off">${gem('big')}<span class="mg01-upto">up to</span><b class="mg01-num">+0</b></div>
        <p class="mg01-verdict"></p>
        <div class="mg01-ctl"><button type="button" class="mg01-ico" data-mg01="pause" aria-label="Pause"></button><button type="button" class="mg01-ico" data-mg01="sound" aria-label="Sound"></button><button type="button" class="mg01-leave" data-mg01="close"><span class="mg01-glyph">${SVG.out}</span><span class="mg01-lbl">Leave</span></button></div>
        <p class="mg01-status" role="status"></p><button type="button" class="mg01-retry o-btn gold" data-mg01="retry" hidden>Retry save</button>
      </aside></div>`;
    const panel = document.querySelector('#opsRoot .o-panel'); panel?.classList.add('mg01-on');
    (panel || document.getElementById('opsRoot') || document.body).appendChild(overlay);
    frame = overlay.querySelector('iframe'); shown = 0;
    const q = new URLSearchParams({ hosted:'mg01', game:p.kind, session:host.token, skip:1, level:repairLevel().toFixed(2), desk, look:w?.t.look || '', hat:+w?.t.hat || 0,
      seed:mix(host.token * 7919 + p.id * 104729 + Math.floor(T * 1000)) % 1e9, extra:derived(m).extra, low:IMI.fx?.low ? 1 : 0, reduce:IMI.reduceMotion ? 1 : 0 });
    frame.src = `minigames/repair.html?${q}${devQuery()}`;
    cardDirty = true; update(); frame.focus(); api.mark();
  }
  function close() {
    if (!overlay || pending) return;
    document.querySelector('#opsRoot .o-panel')?.classList.remove('mg01-on');
    overlay.remove(); overlay = frame = host = null; cancelAnimationFrame(rollRaf); cardDirty = true;
    if (returnFocus?.isConnected) returnFocus.focus(); drawProblem(); api.mark();
  }
  const toGame = (type, extra = {}) => frame?.contentWindow?.postMessage({ bridge:'mg01', game:host.game, session:host.token, type, ...extra }, location.origin);
  /* leaving: a repair that is running is abandoned (no pay; the problem stays and can be tried again while it lasts); one that has finished just closes */
  function leave() {
    if (!overlay || pending) return;
    const m = saved(), a = m?.active;
    if (host?.run && valid(m) && a?.id === host.run.id) { const next = copy(m); next.settled = a.id; next.active = null; host.run = null; commit(next, close); return; }
    close();
  }
  /* one shot: the first start of a session charges it (the save marks the run active); any later start is held */
  function charge() {
    host.charged = true;
    const m = saved(); if (!valid(m) || m.active) { notice = 'Another run is still being saved.'; update(); return; }
    const next = copy(m), id = next.nextSession; next.nextSession++;
    next.active = { id, game:host.game, played:0, ...(host.who ? { who:host.who } : {}) };
    next.rep = { ...(m.rep || {}), [host.game]:m.rep?.[host.game] || { n:0, best:0 } };
    commit(next, () => { if (!host) return; host.run = { id }; host.last = null; shown = 0; toGame('start-ok'); });
  }
  /* the verdict: pay (once per problem, only if the repair was really played), the fixer's badge xp, the repair log, then the Floor */
  function bank(grade) {
    if (pending || !host?.run) return;
    const m = saved(), a = m?.active; if (!valid(m) || a?.id !== host.run.id) return;
    const R = REPAIRS[host.game], p = host.prob, g = host.touched ? Math.max(0, Math.min(1, Number(grade) || 0)) : 0, verdict = verdictOf(g), payable = g > 0 && !p.paid;
    const total = payable ? repairWorth(m, R, g) : 0, was = m.rep?.[host.game] || { n:0, best:0 };
    const next = copy(m); next.settled = a.id; next.active = null;
    next.rep = { ...(m.rep || {}), [host.game]:{ n:was.n + (g >= FIX_AT ? 1 : 0), best:Math.max(was.best, Math.round(g * 100)) } };
    if (total) next.pool = addPool(m, R.fam, total);
    const who = payable && host.who ? findTypist(host.who) : null, xp = who ? repairXp(m, R, g, who.t) : 0, lvWas = who ? bdLevel(who.t.bd?.[R.fam]) : 0;
    if (who) next.who = { d:who.d, name:who.t.name };
    host.run = null;
    commit(next, () => {
      if (payable) p.paid = true;
      const note = applyFix(p, g), lvNow = who ? bdLevel(who.t.bd?.[R.fam]) : 0;
      if (host) host.last = { g, verdict, total, xp, fam:R.fam, lv:lvNow, up:lvNow > lvWas, note, paid:!payable && g > 0 };
      const at = overlay?.querySelector('.mg01-pay') ? IMI.centerOf(overlay.querySelector('.mg01-pay')) : [innerWidth / 2, 60];
      if (total) window.Juice?.fly('insp', at, Math.min(14, Math.max(3, Math.ceil(Math.log10(total + 1) * 3))));
      toGame('reward', { total, label:'INSPIRATION', verdict, note:!payable && g > 0 ? `Already paid. ${note}` : note });
      if (total && window.Juice?.stamp) {
        if (lvNow > lvWas) window.Juice.stamp(classic() ? `${FAM[R.fam].name} badge Lv ${lvNow}!` : `${FAM[R.fam].name.toUpperCase()} BADGE LV ${lvNow}!`, { tier:2, sub:who.t.name });
        else if (g >= FIX_AT) window.Juice.stamp(classic() ? (g >= PERFECT_AT ? 'Perfect!' : 'Fixed!') : g >= PERFECT_AT ? 'PERFECT!' : 'FIXED!', { tier:g >= PERFECT_AT ? 3 : 2, sub:`+${fmt(total)}` });
      }
    }, who && xp ? { d:who.d, name:who.t.name, fam:R.fam, xp, at:a.id } : null);
  }
  function update() {
    if (!overlay || !host) return;
    const q = s => overlay.querySelector(s), R = REPAIRS[host.game], l = host.last, t = host.typist?.t, b = t && badgeOf(t), m = saved();
    const upto = l ? l.total : host.prob.paid ? 0 : repairWorth(valid(m) ? m : {}, R, 1);
    q('.mg01-pay').dataset.mode = l ? 'done' : host.run ? 'live' : 'idle';
    q('.mg01-pay').classList.toggle('off', !l && host.prob.paid);
    q('.mg01-upto').hidden = !!l;
    rollTo(upto);
    q('.mg01-who').innerHTML = t ? `${api.typist(t).art}<span><b>${esc(t.name)}</b><small>${l?.xp ? `+${l.xp} ${FAM[l.fam].name} xp${l.up ? ` · Lv ${l.lv}!` : ''}` : `${R.tool}${b ? ` · ${FAM[b.fam].name} Lv ${b.lv}` : ''}`}</small></span>` : '';
    q('.mg01-verdict').innerHTML = l ? `<b data-v="${VKEY[l.verdict]}">${l.verdict}</b> ${esc(l.note)}` : '';
    q('[data-mg01="pause"]').innerHTML = SVG[host.phase === 'pause' ? 'play' : 'pause']; q('[data-mg01="pause"]').setAttribute('aria-label', host.phase === 'pause' ? 'Resume' : 'Pause');
    q('[data-mg01="pause"]').disabled = !(host.phase === 'play' || host.phase === 'pause');
    q('[data-mg01="sound"]').innerHTML = SVG[soundOn ? 'on' : 'off']; q('[data-mg01="sound"]').setAttribute('aria-pressed', String(!soundOn));
    q('[data-mg01="close"]').disabled = !!pending;
    q('.mg01-lbl').textContent = host.run ? 'Leave' : 'Close';
    q('.mg01-status').textContent = notice || (!l && host.prob.paid ? 'Already paid: this repair only clears it.' : '');
    q('.mg01-retry').hidden = !pending;
  }
  /* the number rolls up to its new value instead of jumping */
  function rollTo(target) {
    const el = overlay?.querySelector('.mg01-num'); if (!el) return;
    cancelAnimationFrame(rollRaf);
    const step = () => {
      if (!overlay) return;
      const d = target - shown; if (Math.abs(d) < 1) shown = target; else shown += Math.sign(d) * Math.max(1, Math.ceil(Math.abs(d) * .2));
      el.textContent = '+' + fmt(shown);
      if (shown !== target) rollRaf = requestAnimationFrame(step);
    };
    step();
  }
  function receive(e) {
    const d = e.data;
    if (!host || pending || e.origin !== location.origin || e.source !== frame?.contentWindow || d?.bridge !== 'mg01' || d.game !== host.game || d.session !== host.token ||
        !Number.isSafeInteger(d.sequence) || d.sequence <= host.sequence || d.mode !== 'main' || !bounded(d.elapsed, 86400) || d.elapsed < host.elapsed ||
        !['start', 'phase', 'input', 'progress', 'finish', 'quit'].includes(d.type) || d.score !== undefined && !bounded(d.score, 1e9)) return;
    if (d.type === 'phase' && !['title', 'count', 'waiting', 'play', 'pause', 'over'].includes(d.phase)) return;
    if (d.type === 'finish' && (d.reason !== 'natural' || d.grade !== undefined && !bounded(d.grade, 1))) return;
    if (d.type === 'quit' && !['quit', 'back', 'done'].includes(d.reason)) return;
    host.elapsed = d.elapsed; host.sequence = d.sequence;
    if (d.type === 'start') { host.phase = 'waiting'; if (host.charged) toGame('hold'); else charge(); }
    else if (d.type === 'phase') host.phase = d.phase;
    else if (d.type === 'input') { if (host.run && host.phase === 'play') host.touched = true; }
    else if (d.type === 'quit') { leave(); return; }
    else if (d.type === 'finish') { host.phase = 'over'; bank(d.grade ?? (d.score || 0) / 1000); }
    update();
  }
  /* the Floor's Fix it: the problem's own repair, played by its fixer, right over the Floor */
  function fixProblem() {
    const p = currentProblem(); if (!p || overlay || pending || !ensure() || !valid(saved())) return;
    launch(p, fixer(p));
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-mg01]'); if (!b || !api) return;
    e.preventDefault(); e.stopPropagation();
    const action = b.dataset.mg01;
    if (action === 'retry') retry();
    else if (action === 'close') leave();
    else if (action === 'pause') { if (host) toGame('pause'); }
    else if (action === 'sound') { soundOn = !soundOn; if (host) toGame('mute', { on:soundOn }); update(); }
    else if (action === 'purchase') purchase(b.dataset.node);
    else if (action === 'fix') fixProblem();
  });
  /* the host's own buttons never take focus from the game, so pressing Pause or Sound does not blur-pause it */
  document.addEventListener('pointerdown', e => { if (overlay && e.target.closest('.mg01-run button')) e.preventDefault(); }, true);
  addEventListener('keydown', e => {
    if (!overlay) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); if (host?.phase === 'play' || host?.phase === 'pause') toGame('pause'); else leave(); }
  }, true);
  addEventListener('message', receive);
  /* dev hook (like IMI.ops.spawnGold): IMI.ops.spawnProblem('leak') puts that problem on the Floor now; a desk kind lands on an eligible machine */
  const spawnNow = kind => {
    const m = saved(); if (!api || !REPAIRS[kind] || !valid(m) || overlay || pending) return false;
    prob = null; if (REPAIRS[kind].scope === 'global') arrive(kind, -1); else if (!spawn(m, kind)) return false;
    drawProblem(); return true;
  };
  const hooks = {
    automaticTypingBonus:() => bonus('typing'), keeperWorkBonus:() => bonus('keeper'), titleSaleBonus:() => bonus('sale'),
    perk:kind => bonus(kind), deskFactor, badgeChip, tick,
    problem:() => { const p = currentProblem(); return p && { id:p.id, kind:p.kind, desk:p.desk, scope:p.scope, fam:p.fam, left:Math.max(0, p.until - T), paid:p.paid, patched:p.patched }; },     // read-only, for tests and tools
    tab:['ideas', 'i-insp', 'Ideas', 'Spend Inspiration', 'Ideas'], visible:a => unlocked(a.state()),
    init(_, a) {
      const first = !api; api = a;
      if (first) {
        IMI.on('tab', ({ tab }) => { if (overlay && tab !== host?.tab) leave(); });
        IMI.onScreen(() => { if (overlay && IMI.screen() !== 'game') leave(); });
        if (window.IMI?.ops) IMI.ops.spawnProblem = spawnNow;
      }
    },
    render,
    reset() { pending = null; notice = ''; prob = null; tunes = []; nextAt = 0; lastLong = false; ver++; cardDirty = true; close(); },
    away() { prob = null; tunes = []; cardDirty = true; },
    afterRender({ tab } = {}) {
      if (tab) curTab = tab;
      if (unlocked(api.state()) && saved() === undefined && !pending) ensure();
      else if (valid(saved()) && stale(saved())) settleStale();
      drawProblem();
    }
  };
  (window.__OPS_EXTENSIONS ||= []).push(['minigames', hooks]);
})();
