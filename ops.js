/* TYPEWRITER OPS: the writing-room game, a full-screen app inside the jungle page.
   Letters (typed by hanging monkeys) → words (Coconut R&D) → written titles (Vine Infrastructure) → bananas → more typewriters.
   Shares the page's banana counter, sounds, particles, weather/mood and header toys through window.IMI (see core.js). */
(() => {
  function start() {
  'use strict';
  if (window.VaultSaveGate?.blocked) return;
  const { setTimeout, clearTimeout, setInterval, clearInterval, requestAnimationFrame, cancelAnimationFrame } = window.Rewards?.enabled ? Rewards.timers : window;
  const IMI = window.IMI, root = document.getElementById('opsRoot');
  if (!IMI || !root) return;
  const PX = IMI.edition === 'pixel';
  const $ = (s, r = root) => r.querySelector(s);
  const $$ = (s, r = root) => [...r.querySelectorAll(s)];
  const Economy = window.Economy, cash = Economy.cash, roundMoney = Economy.round, floorMoney = Economy.floor;
  const fmt = IMI.fmt, fmtBig = IMI.fmt;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const rand = Math.random;
  const VOWELS = 'AEIOU';
  const bananas = IMI.bananas;
  const writer = window.Rewards?.enabled ? window.Rewards : null;
  const expanded = window.AwardsCatalogue?.enabled ? window.AwardsCatalogue : null;
  const funding = expanded?.funding.enabled ? expanded.funding : null;
  const pg = window.ProductionGoal?.enabled ? window.ProductionGoal : null;
  const trainingPool = window.TrainingPool?.enabled ? window.TrainingPool : null;
  const folio = window.Folio;
  const layers = window.Layers;
  const archiveFeature = window.Archive;
  const worksDemo = window.WorksDemo;
  const worksPlay = window.WorksPlay;
  const activeWork = () => worksPlay?.active(S) ? worksPlay : worksDemo?.active(S) ? worksDemo : null;
  const worksActive = () => !!activeWork();
  const workPaused = () => worksActive() || !!folioGoal();
  const worksAdvance = () => { activeWork()?.advance(S, trainingIngredients()); };

  const titleAvailable = r => !archiveFeature || archiveFeature.available(S,r);
  const folioGoal = () => archiveFeature?.goal(S) || folio?.goal(S);
  let archiveSpans = [], archiveInterval = null, archiveSampleToken = null, pitchSampleToken = null, royaltySampleToken = null;
  function archiveSettle() {
    if (!archiveFeature?.enabled || S.meta.archive === undefined) return true;
    return writer.archiveIncome().ok;
  }
  let paused = false, started = false;
  const progressing = () => !writer || (writer.owns() && !paused && !writer.transacting() && !S.meta?.layers?.pending && !S.meta?.estate?.pending && !S.meta?.archive?.pending &&
    !S.meta?.seasons?.pending && !S.meta?.commissionBoard?.pending && !S.meta?.automation?.challenge?.pending && !S.meta?.challengeMastery?.pending && !S.meta?.automation?.pitch?.sale && !S.meta?.automation?.media?.pending && (!S.prem?.vault?.transition || writer.boundaryProgressing()));
  // Named callbacks run in registration order and always receive a current-state getter.
  const extensions = new Map();
  let speedProvider = null, productionExtra = 0;
  const speed = () => {
    const n = speedProvider ? speedProvider(extensionAPI) : 1;
    if (!Number.isFinite(n) || n <= 0) throw new Error('Invalid production speed');
    return n;
  };
  const extensionEvent = (name, event) => { for (const hooks of extensions.values()) hooks[name]?.(event, extensionAPI); };
  let lampLifetime = null;
  const productiveMono = () => lampLifetime?.mono ?? performance.now();
  const productionNow = () => productiveMono() + productionExtra;
  function lampHold(lease) {
    if (lampLifetime) return;
    lampLifetime = lease;
    lampLiveBuffs = Object.keys(buffs).filter(k => buffs[k] > lease.mono);
    extensions.get('automation')?.netHold(lease);
    goldObject?.hold(lease); IMI.pickups?.vaultHold(lease);
  }
  let lampLiveBuffs = [];
  function lampRelease(lease) {
    if (lampLifetime !== lease) return;
    const elapsed = performance.now() - lease.mono;
    for (const k of lampLiveBuffs) if (buffs[k]) buffs[k] += elapsed;
    productionExtra -= elapsed; lampLifetime = null; lampLiveBuffs = [];
    last = performance.now();
    goldObject?.resume(lease); IMI.pickups?.vaultResume(lease);
    extensions.get('automation')?.netRelease(lease);
  }
  const lampPending = () => !!(window.VaultPlay?.pending(S) || writer?.localDisposition());

  /* ================= static data ================= */
  const DESKS = [
    { id: 'mint',  name: 'Bamboo Classic',    lo: 2, hi: 3, price: 0,      color: '#78d9a0', font: PX ? "'Press Start 2P', monospace" : "'Lilita One', sans-serif",     style: PX ? 'Classic pixel' : 'Classic round' },
    { id: 'rose',  name: 'Hibiscus Ribbon',   lo: 4, hi: 5, price: 3000,   color: '#f08aa4', font: PX ? "'Pixelify Sans', monospace" : "'Fredoka', sans-serif",         style: PX ? 'Soft pixel' : 'Soft round' },
    { id: 'blue',  name: 'Lagoon Sprint',     lo: 6, hi: 7, price: 30000,  color: '#5fa8f0', font: PX ? "'Silkscreen', monospace" : "'Barlow Condensed', sans-serif",    style: 'Narrow' },
    { id: 'amber', name: 'Honeycomb Ledger',  lo: 8, hi: 9, price: 375000, color: '#f2b23a', font: PX ? "'Tiny5', monospace" : "'Rokkitt', serif",                      style: 'Slab' },
    { id: 'orchid', name: 'Orchid Imperial', lo: 10, hi: 11, price: 5000000, color: '#b58cf0', fs: PX ? '17px' : '', font: PX ? "'Jersey 10', monospace" : "'Bree Serif', serif", style: PX ? 'Tall pixel' : 'Serif' },
    { id: 'moon', name: 'Moonflower Grand', lo: 12, hi: 13, price: 62500000, color: '#dfe3f2', fs: PX ? '20px' : '', font: PX ? "'Micro 5', monospace" : "'Pacifico', cursive", style: 'Grand' }
  ].map(x => ({ ...x, price: cash(x.price) }));
  /* [id, icon, department, what it does, short label] */
  const TABS = [
    ['floor', 'type', 'Floor', 'Type and watch the room', 'Floor'], ['training', 'monkey', 'Train', 'Hire and train typists', 'Train'],
    ['lab', 'coconut', 'Words', 'Bank words, keepers, garden', 'Words'], ['press', 'log', 'Titles', 'Write and sell books', 'Titles'],
    ['shop', 'banana', 'Shop', 'Spend your bananas', 'Shop'],
    ['studios', 'reel', 'Media', 'Studios earn while you play', 'Media'],
    ['muses', 'quill', 'Muses', 'Literary patrons', 'Muses'], ['records', 'trophy2', 'Awards', 'Stats and awards', 'Awards'],
    ['legacy', 'trophy1', 'Legacy', 'Second printing', 'Legacy']
  ];
  /* progressive reveal: a tab is visible unless it has a gate that says otherwise */
  const TAB_GATES = {
    training: () => S.intro.train,
    lab: () => totalPaws() > 0 || S.stats.letters >= 60 || S.stats.words > 0 || Object.keys(S.written).length > 0,
    press: () => S.stats.words > 0 || Object.keys(S.written).length > 0 || readyList().length > 0,
    shop: () => bananas.get() > 0 || (S.run.earned || 0) > 0 || Object.keys(S.written).length > 0,
    studios: () => soldCount() >= 3 || S.divTotal > 0 || DIVS.some(D => divCount(D) > 0),
    muses: () => soldCount() >= 3 || Object.keys(S.muses.owned).length > 0,
    records: () => Object.keys(S.written).length > 0 || S.printing > 0,
    legacy: () => S.printing > 0 || S.legacy.total > 0 || (S.run.earned || 0) >= cash(100000) };
  const tabVisible = id => {
    const opening = id === 'floor' || (id === 'training' && S.intro.train) || (['lab', 'press'].includes(id) && S.intro.words) || (id === 'shop' && S.intro.shop);
    return introActive() ? opening : opening || !TAB_GATES[id] || !!TAB_GATES[id]();
  };
  const bandOf = n => (n <= 3 ? 0 : n <= 5 ? 1 : n <= 7 ? 2 : n <= 9 ? 3 : n <= 11 ? 4 : 5);
  /* ---- economy knobs (see tools/balance.mjs) ---- */
  const TUNE = window.__TUNE || {};                  // balance harness overrides; empty on the real site
  const PAW_GROW = TUNE.PAW_GROW || 1.55;            // each extra typist costs this much more than the last
  const PAW_BASE = TUNE.PAW_BASE || [1.5, 9, 27, 81, 243, 729];            // seconds per letter for one typist on each desk
  const PAW_COST = TUNE.PAW_COST || [100, 35, 50, 70, 100, 140];      // letters for the first extra typist on each desk
  const PAW_DESK_STEP = TUNE.PAW_DESK_STEP != null ? TUNE.PAW_DESK_STEP : 0.35;   // later machines charge this much more per desk index for every typist hire
  const KEEPER_PERIOD = TUNE.KEEPER_PERIOD || [0.6, 1.2, 2, 3, 4, 5];     // seconds per banked word per desk, free keepers
  const KEEPER_UP_STEP = TUNE.KEEPER_UP_STEP || 0.9;                      // each keeper level multiplies that period by this (Shop > Keepers, bananas)
  const KEEPER_UP_MAX = TUNE.KEEPER_UP_MAX || 6;
  const KEEPER_UP_GROW = TUNE.KEEPER_UP_GROW || 1.8;                      // each level costs this much more than the last
  const KEEPER_UP_BASE = (TUNE.KEEPER_UP_BASE || [100, 600, 3000, 30000, 4e5, 5e6]).map(cash);   // bananas for level 1, by desk
  const COACH_MAX = TUNE.COACH_MAX || 10;                                // Train > crew cards: coaching levels per monkey
  const COACH_STEP = TUNE.COACH_STEP || 2;                               // each coaching level is +this % typing speed on top of the monkey's talent
  const COACH_GROW = TUNE.COACH_GROW || 1.35;
  const COACH_BASE = (TUNE.COACH_BASE || [18, 215, 2700, 33500, 4.2e5, 5e6]).map(cash);     // bananas for a monkey's first coaching level, by desk (all 10 levels cost about half the next machine)
  const REROLL_BASE = (TUNE.REROLL_BASE || [20, 250, 3000, 38000, 5e5, 5.6e6]).map(cash);     // bananas for a monkey's first reroll, by desk; each reroll costs 1.5x the last
  const BARO_COST = (TUNE.BARO_COST || [30000, 150000]).map(cash);                   // Shop > Market tools: the barometer, two tiers (bananas): forecast 2 changes ahead, then 4 with market hints
  const PUB_COST = (TUNE.PUB_COST || [6000, 50000, 350000]).map(cash);             // Shop > Market tools: the Publisher's assistant, three tiers (bananas)
  const PUB_PERIOD = TUNE.PUB_PERIOD || [12, 6];                         // seconds between automatic sales: tiers 1, then 2 and up
  const PUB_RULES = { any: 0, fair: 1, hot: 1.4 };                       // the lowest market multiplier the assistant will sell into
  const AUTH_PAY = TUNE.AUTH_PAY || [0.15, 0.4, 0.35, 0.2, 0.2, 0.2];                       // runtime multiplier on the pay of authored readers, by band
  const LIB_PAY = TUNE.LIB_PAY || [0, 0.03, 0.018, 0.018, 0, 0];                // runtime multiplier on the baked-in pay of the 5-, 7- and 9-letter-cap library stories, by band
  const KID_PAY = TUNE.KID_PAY || 0.1;                                          // runtime multiplier on the baked-in pay of kids' titles
  const TITLE_SCALE = TUNE.TITLE_SCALE || [1, 1.3, 1.7, 2.2, 3, 4];     // pitched titles get bigger with the band
  const PITCH_PAY = TUNE.PITCH_PAY || [40, 504, 5000, 39120, 4.885e5, 6.12e6];   // rights for a standard pitched title, by band
  const SHOP = Object.fromEntries(Object.entries({ hold: 500, metro: 3000, dbl: 2000, contracts: 10000, agent: 40000, analyst: 150000, ...(TUNE.SHOP || {}) }).map(([key, value]) => [key, cash(value)]));
  const FREQ = { E: 12, T: 9, A: 8, O: 8, I: 7, N: 7, S: 6, H: 6, R: 6, D: 4, L: 4, C: 3, U: 3, M: 3, W: 2, F: 2, G: 2, Y: 2, P: 2, B: 1.5, V: 1, K: 1, J: .3, X: .3, Q: .2, Z: .2 };
  const POP_COLORS = ['#ff5d73', '#ffd23a', '#7be05a', '#4cc9f0', '#c39bff', '#ff9ec0'];
  const EXTRA_WORDS = `up if me we be no so or as at by my ox an am us
    ace add age ago aim air all and any arm art ask bad bag ban bat bed bee bet bit box boy bud bug bus but buy cab cat cow cry cub cut dad day den dig dim dip dog dot dry dub due ear eat egg end eye fan far fat few fit fix fly for fun gap gas get gum gut guy had ham has hat hay her hid him hip his hit hop hot how hug ice ink jam jar jaw jet job joy key kid kit lap lay leg let lid lip log lot low mad man map mat may mud nap net new nod nut oak odd off oil old one our out owl own pan pat paw pay pea pet pie pig pin pit pop pot put rag ram rat raw red rib rid rob rod row rub rug run sad sat saw say sea see set sew she shy sin sip sir sit six ski sky sly son sow spy sub sum sun tag tan tap tar tea ten tie tin tip toe ton top toy try tub tug two van vet wag war was wax way web wet who why win wit yak yam yes yet you zip zoo
    able acorn bark bean bell bird book boot bush calm cave chip city cook cool corn dark deep door dust each east farm fern fish flag fold fork free frog game gate gift glow goat gold grab hand hill hope jump kite lamp leaf lion loud mail monk nest pale pear plum rain rice rock root sand seed ship silk sing slow soft song star swim tail tall tent tree vine wave wind wing wood yard zebra
    banjo brick cabin chair clock cloud crown eagle flute grape habit jelly koala lemon mango otter paper piano quilt robin snack tiger trunk umbra waltz yacht
    anchor bakery basket branch candle carpet cheese circus garden hammer jungle lizard monkey orange parrot pencil pocket ribbon rocket shadow spider tablet turkey window
    blanket cabinet chimney compass diamond fantasy giraffe harvest journey kitchen library mixture natural octopus palette sparrow thunder trumpet whistle
    adventure alphabet bookcase carousel daydream elephant festival gingerly handsome jellyfish lighthouse marathon notebook orchestra pineapple`.split(/\s+/);

  /* ---- the pitch generator's word pools (every word here is also valid vocabulary) ---- */
  const split = str => str.trim().split(/\s+/);
  const GEN = {
    animal: split(`ape cat dog bat rat fox pig cow owl yak ant bee elk emu hen ram
      bear bird frog goat lion mole seal swan wolf zebra tiger otter koala eagle robin llama moose camel sheep horse whale shark squid snail
      lizard parrot spider turkey monkey beaver badger donkey gibbon gorilla panther ostrich sparrow penguin dolphin giraffe buffalo octopus
      elephant flamingo platypus hedgehog cockatoo kangaroo crocodile orangutan chameleon armadillo porcupine wolverine dragonfly jellyfish
      rhinoceros woodpecker chimpanzee salamander hummingbird grasshopper caterpillar stegosaurus mockingbird
      hippopotamus velociraptor brontosaurus tyrannosaurus`),
    thing: split(`hat cup box jam pie nut fig map pen pot rug toy van web log fan bed cap bag key lid kit
      book boot lamp kite gift acorn bean ship tent clock chair piano quilt brick banjo cake sock drum coin ring bell rope
      pencil pocket ribbon rocket basket candle carpet hammer window ladder trophy guitar blanket
      cabinet chimney compass diamond lantern notebook umbrella newspaper telescope crossword accordion spaceship
      typewriter manuscript masterpiece photograph trampoline microscope skateboard paintbrush toothbrush lighthouse
      refrigerator encyclopedia kaleidoscope thermometer wheelbarrow screwdriver typewriters manuscripts masterpieces photographs trampolines microscopes skateboards lighthouses
      encyclopedias kaleidoscopes refrigerators`),
    place: split(`cave city farm hill nest yard tent
      jungle garden kitchen library cabin meadow harbor valley island desert
      treehouse waterfall cornfield bookshop junkyard workshop mountain festival
      greenhouse playground wilderness rainforest laboratory wonderland lighthouse bookstore
      marketplace observatory supermarket schoolhouse underground
      neighborhood mountainside neighbourhood`),
    adj: split(`big red hot wet old new bad mad shy sly fat dry odd raw sad
      calm dark deep loud pale soft tall slow quick brave lazy wild
      quiet sleepy sticky gloomy clumsy golden hungry jolly mighty rusty shiny sneaky bouncy
      enormous hilarious gigantic fabulous peculiar
      mysterious ridiculous tremendous incredible unexpected
      mischievous adventurous magnificent spectacular unstoppable comfortable
      unbelievable alphabetical disorganized undiscovered unreasonable
      unforgettable extraordinary revolutionary overconfident`),
    verb: split(`ran sat hid dug hit put ate saw
      made went fell said grew sent wore woke found drove shook took
      chased grabbed guarded painted polished borrowed followed repaired sneaked washed carried
      discovered unearthed overheard surprised unwrapped misplaced
      celebrated outsmarted rearranged transformed outnumbered interrupted reorganized
      investigated rediscovered photographed disassembled reconsidered
      misunderstood mispronounced`),
    adv: split(`slowly loudly gently quickly quietly bravely proudly carefully cheerfully hilariously
      mysteriously suspiciously ridiculously accidentally unexpectedly dramatically triumphantly courageously
      mischievously adventurously magnificently spectacularly`),
    name: split(`Jim Max Pat Gus Hazel Mabel Milo Olive Rosie Wilbur Archibald Cornelius Clementine Maximilian Wilhelmina Montgomery Bartholomew Alexandrina Ferdinandson Maximilianson`)
  };
  const GEN_TEMPLATES = [
    'The {adj} {animal} {verb} the {thing} in the {place}.',
    '{name} and the {adj} {animal} {verb} {adv}.',
    'A {animal} {verb} the {adj} {thing} near the {place}.',
    'Nobody {verb} the {thing}.',
    'The {animal} {verb} the {place} {adv}.',
    '{name} {verb} the {adj} {thing}.'
  ];
  const RATE = [25, 270, 3400, 20000, 250000, 3000000];      // base banana rights per word, by band
  const PITCH_MAX = 8;

  /* ---- recipes come from the exact text of each edition ---- */
  const tokens = t => (t.toLowerCase().match(/[a-z']+/g) || []).map(w => w.replace(/'/g, '')).filter(w => w.length > 1);
  const buildRecipe = r => {
    const need = {}; let max = 0, total = 0;
    for (const w of tokens(r.text)) { const W = w.toUpperCase(); need[W] = (need[W] || 0) + 1; max = Math.max(max, w.length); total++; }
    const nominalPay = r.gen ? r.pay / Economy.scale : r.pay;
    return { ...r, pay: cash(r.kid ? Math.round(nominalPay * KID_PAY) : r.lib ? Math.round(nominalPay * LIB_PAY[bandOf(max)]) : Math.round(nominalPay * AUTH_PAY[bandOf(max)])), need, total, band: bandOf(max) };
  };
  const RECIPES = window.READERS.map(buildRecipe);
  const KIDS = RECIPES.filter(r => r.kid);                       // kids' books, in difficulty order (readers-kids.js)
  const LIBS = RECIPES.filter(r => r.lib);                       // the 5-, 7- and 9-letter-cap library stories (readers-w5/w7/w9.js): extra supply for bands 1-3
  const BOOKS = RECIPES.length - KIDS.length - LIBS.length;      // the authored readers; kids', library and pitched titles come on top
  const KID_LIST = TUNE.KID_LIST || 8;                           // kids' titles open on the reading list at once
  const LIB_ROY = TUNE.LIB_ROY || 0.5;                            // library stories pay this share of normal royalties
  const KID_ROY = TUNE.KID_ROY || 0.5;                           // kids' titles pay this share of normal royalties
  const RBY = Object.fromEntries(RECIPES.map(r => [r.id, r]));
  const VOCAB = new Set(EXTRA_WORDS.map(w => w.toUpperCase()).filter(w => w.length >= 2 && w.length <= 13));
  RECIPES.forEach(r => Object.keys(r.need).forEach(w => VOCAB.add(w)));
  Object.values(GEN).forEach(list => list.forEach(w => VOCAB.add(w.toUpperCase())));
  GEN_TEMPLATES.forEach(t => tokens(t.replace(/\{\w+\}/g, '')).forEach(w => VOCAB.add(w.toUpperCase())));
  const BAND_WORDS = DESKS.map(() => []);
  [...VOCAB].sort().forEach(w => BAND_WORDS[bandOf(w.length)].push(w));
  const LCOUNT = new Map();
  const lcount = w => { let c = LCOUNT.get(w); if (!c) { c = {}; for (const ch of w) c[ch] = (c[ch] || 0) + 1; LCOUNT.set(w, c); } return c; };

  /* ================= state ================= */
  const KEY = 'imi-ops-v1';
  const newIntro = () => ({ version: 1, done: false, train: false, words: false, shop: false, hireAt: null });
  const newDesk = i => ({
    owned: i === 0, paws: 0, crew: [], mk: 0, letters: {}, tray: [],
    up: { fing: 0, rapid: 0, vowel: 0, ink: 0, practice: 0, stock: 0, ribbon: 0 },
    keeper: { owned: i === 0, on: true, def: 0, targets: {}, lv: 0 }
  });
  const fresh = () => ({ meta: {}, rewards: {}, prem: {}, economyVersion: Economy.version, intro: newIntro(), focus: null, autoFocus: true, printing: 0, legacy: { stars: 0, total: 0, ups: {} }, editions: {}, looks: {}, run: { earned: 0 }, challenge: null, chDone: {}, muses: { owned: {}, seated: [null, null, null] }, garden: { beds: [null, null] }, divs: { songs: 0, tv: 0, radio: 0, sketch: 0, film: 0 }, divTotal: 0, pitches: [], offers: [], market: { v: [1, 1, 1, 1, 1, 1], m: [0, 0, 0, 0, 0, 0], hist: [[1], [1], [1], [1], [1], [1]] }, agent: false, analyst: false, baro: 0, pub: { tier: 0, on: true, rule: 'any' }, lamp: 0, lastSeen: 0, awards: {}, stats: { pitched: 0, pitchSold: 0, awayMax: 0, letters: 0, manual: 0, words: 0, lump: 0, rotten: 0, secs: 0, playSecs: 0, pickups: 0, pickupEarned: 0, storm: 0, night: 0, byLetter: {} }, deals: {}, royTotal: 0, gold: 0, best: 0, hold: false, metro: false, dbl: false, contracts: false, sel: 0, written: {}, bank: {}, log: [], desks: DESKS.map((_, i) => newDesk(i)) });
  let hallHistory = {};
  let S = (() => {
    try {
      const saved = Economy.loadState();
      if (window.Hall?.enabled) hallHistory = Hall.observe(JSON.parse(localStorage.getItem(KEY) || '{}'));
      if (!saved) return fresh();
      const f = fresh(), stats = f.stats; Object.assign(f, saved);
      f.stats = { ...stats, ...saved.stats, byLetter: { ...stats.byLetter, ...saved.stats?.byLetter } };
      if (!saved.intro) {
        const experienced = (saved.stats?.letters || 0) > 0 || (saved.stats?.words || 0) > 0 || (saved.printing || 0) > 0 || (saved.legacy?.total || 0) > 0 || Object.keys(saved.written || {}).length > 0 || Object.values(saved.bank || {}).some(n => n > 0) || (saved.desks || []).some((d, i) => d && (i > 0 && d.owned || d.paws > 0 || d.mk > 0 || Object.values(d.letters || {}).some(n => n > 0) || Object.values(d.up || {}).some(n => n > 0)));
        f.intro = { ...newIntro(), done: experienced, train: experienced, words: experienced, shop: experienced };
      } else f.intro = { ...newIntro(), ...saved.intro };
      f.desks = DESKS.map((_, i) => { const d = newDesk(i), s = (saved.desks || [])[i] || {}; return { ...d, ...s, up: { ...d.up, ...s.up }, keeper: { ...d.keeper, ...s.keeper } }; });
      const old = (saved.desks || []).map(x => x && x.keeper && x.keeper.focus).find(id => id && !(saved.written || {})[id]);   // pre-shared-goal saves: per-desk focus
      if (saved.focus === undefined) { f.focus = old || null; f.autoFocus = !old; }
      f.desks.forEach(d => { if (d.owned) d.keeper.owned = true; delete d.keeper.focus; });
      return f;
    } catch (error) { if (writer) throw error; return fresh(); }
  })();
  while (S.market.v.length < DESKS.length) { S.market.v.push(1); S.market.m.push(0); S.market.hist.push([1]); }   // saves from before the new machines
  S.meta ??= {}; S.rewards ??= {}; S.prem ??= {};
  (S.pitches || []).forEach(p => registerPitch(p));
  if (!S.garden || !Array.isArray(S.garden.beds)) S.garden = { beds: [null, null] };
  const saveAcknowledged = () => {
    if (!writer?.owns()) return { ok: false, error: 'Not the save owner' };
    if (writer.localDisposition()) return {ok:false, error:'Historical boundary owns the save'};
    if (!writer.guard(S)) return { ok: false, error: 'Reward metadata or transaction unresolved' };
    if (!archiveSettle()) return {ok:false,error:'Archive income waiting to save'};
    const lastSeen = S.rewards.awayCheckpoint ? S.lastSeen : Date.now(), result = Economy.saveStateAcknowledged({ ...S, lastSeen });
    if (result.ok) S.lastSeen = lastSeen;
    return result;
  };
  const save = () => { if (writer) return progressing() ? saveAcknowledged() : { ok: false, error: 'Progression paused' }; S.lastSeen = Date.now(); try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { /* storage blocked */ } };
  const rt = DESKS.map(() => ({ timers: [], sheet: '', col: 0, n: 0 }));    // runtime only
  const ui = { nextCh: '', seed: 'E', hot: [false, false, false, false, false, false], buyN: 1, unseen: 0, pulled: null, dropped: {}, mcd: {}, readySet: null, fresh: null, lastBanked: null, bankedAt: 0, trayN: 0, tab: 'floor', libq: '', libf: 'open', libcap: 'all', libsort: 'close', libshow: false, shelfNew: 0, archq: '', archf: 'all', read: null, sub: {}, libLimit: 24, archFailed: 0, bankq: '', ovr: '', ovrn: 3 };
  /* the Titles view (status, longest-word filter, sort, show-locked) is remembered between visits */
  const VIEW_KEYS = ['libf', 'libcap', 'libsort', 'libshow'];
  try { const v = JSON.parse(localStorage.getItem('imi-titles-view') || '{}'); VIEW_KEYS.forEach(k => { if (k in v) ui[k] = v[k]; }); } catch { /* ignore a bad value */ }
  const saveView = () => { if (!progressing()) return; try { localStorage.setItem('imi-titles-view', JSON.stringify(Object.fromEntries(VIEW_KEYS.map(k => [k, ui[k]])))); } catch { /* storage blocked */ } };
  let dirty = true, holding = false, holdAcc = 0, popSlot = 0, lastBananas = bananas.get();
  const introActive = () => !S.intro.done;
  const keepersReady = () => !introActive() || S.intro.words;
  function introProgress() {
    const intro = S.intro; if (intro.done) return;
    intro.train ||= S.stats.manual >= 25;
    if (totalPaws() > 0 && intro.hireAt === null) intro.hireAt = S.stats.manual;
    intro.words ||= intro.hireAt !== null && S.stats.manual >= intro.hireAt + 10;
    intro.shop ||= Object.keys(S.written).length > 0;
  }
  function completeIntro() {
    if (!progressing()) return;
    S.intro.done = true; S.intro.train = S.intro.words = S.intro.shop = true; save(); mark();
    setTimeout(dailyLater, 1200);
  }

  /* ================= the crew: every typist is a named monkey with a trait, a level and maybe a hat ================= */
  const NAMES = ['Bongo', 'Coco', 'Mango', 'Pip', 'Zuzu', 'Gibbs', 'Kiki', 'Mabel', 'Nutmeg', 'Oswald', 'Peaches', 'Quincy', 'Rufus', 'Sprocket', 'Tango', 'Uma', 'Waffles', 'Ziggy', 'Banjo', 'Clementine', 'Doodle', 'Edgar', 'Fig', 'Gus', 'Hazel', 'Ike', 'Juno', 'Lulu', 'Milo', 'Nacho', 'Olive', 'Pickles', 'Rosie', 'Biscuit', 'Teddy', 'Wilbur', 'Yoyo', 'Bubbles', 'Cleo', 'Dexter', 'Elsie', 'Fudge', 'Ginger', 'Hobbes', 'Iggy', 'Jasper', 'Kumquat', 'Pepper'];
  const TRAITS = {
    vowel: { name: 'Vowel Lover', desc: 'Leans toward vowels after a consonant.' },
    wordsmith: { name: 'Wordsmith', desc: 'Chases the focused title 15% harder.' },
    speedy: { name: 'Speedy', desc: 'Types 25% faster.' },
    owl: { name: 'Night Owl', desc: '40% faster at night, 10% slower by day.' },
    lucky: { name: 'Lucky', desc: '5% of presses type two letters.' },
    rainy: { name: 'Rain Lover', desc: '30% faster in rain, and ignores storms.' },
    scout: { name: 'Scout', desc: 'Spots golden bananas a little sooner.' }
  };
  const TRAIT_IDS = Object.keys(TRAITS);
  /* thirty looks (crew-art.js in pixel, the vector monkey in classic). The look decides the trait, so a monkey's skill is written on its costume,
     and every look throws its own particles when it lands on a key (fx.k: the kind, fx.c: colours; pixel-fx.js and classic-fx.js draw them).
     A hire rolls a random look; a re-roll rolls a new look (and with it the trait) plus a new talent. */
  const LOOKS = [
    { id: 'v01', name: 'Stomper Runner', trait: 'speedy', r: 'c', fx: { k: 'dust', c: ['#e8d8b8', '#c9b48a'] } },
    { id: 'v02', name: 'Southpaw Boxer', trait: 'speedy', r: 'c', fx: { k: 'stars', c: ['#ffd23a', '#fff6d6'] } },
    { id: 'v03', name: 'Acrobat Gymnast', trait: 'speedy', r: 'c', fx: { k: 'dust', c: ['#ffffff', '#e8eef4'] } },
    { id: 'v04', name: 'Street Skater', trait: 'speedy', r: 'c', fx: { k: 'dust', c: ['#b58cf0', '#d8c8f0'] } },
    { id: 'v05', name: 'Velodrome Cyclist', trait: 'speedy', r: 'c', fx: { k: 'dust', c: ['#ffd23a', '#fff08c'] } },
    { id: 'v06', name: 'Lucha Libre Champion', trait: 'lucky', r: 'e', fx: { k: 'confetti', c: ['#2fd0e0', '#ffd23a', '#ff5d73'] } },
    { id: 'v07', name: 'Carriage Slammer Dockworker', trait: 'rainy', r: 'c', fx: { k: 'drops', c: ['#7ec8f0', '#d6f0ff'] } },
    { id: 'v08', name: 'Iron Forge Blacksmith', trait: 'vowel', r: 'c', fx: { k: 'sparks', c: ['#ff9a3a', '#ffd23a', '#fff6d6'] } },
    { id: 'v09', name: 'Carbide Miner', trait: 'owl', r: 'c', fx: { k: 'dust', c: ['#3a3a44', '#6a6a78'] } },
    { id: 'v10', name: 'Timber Carpenter', trait: 'vowel', r: 'c', fx: { k: 'chips', c: ['#c08a4a', '#e8b878', '#8a5a2b'] } },
    { id: 'v11', name: 'Arc Welder', trait: 'vowel', r: 'r', fx: { k: 'sparks', c: ['#9fe8ff', '#ffffff', '#5fa8f0'] } },
    { id: 'v12', name: 'Steam Railroad Engineer', trait: 'owl', r: 'c', fx: { k: 'steam', c: ['#ffffff', '#d8dde4'] } },
    { id: 'v13', name: 'Platen Inspector', trait: 'scout', r: 'r', fx: { k: 'stars', c: ['#fff6d6', '#ffe680'] } },
    { id: 'v14', name: 'Tenured Professor', trait: 'wordsmith', r: 'c', fx: { k: 'ink', c: ['#1a0f14', '#3a2a60'] } },
    { id: 'v15', name: 'Horologist Clockmaker', trait: 'scout', r: 'r', fx: { k: 'chips', c: ['#ffd23a', '#c98f0e', '#d8dde4'] } },
    { id: 'v16', name: 'Safari Explorer', trait: 'rainy', r: 'c', fx: { k: 'leaves', c: ['#74c648', '#2f8a35', '#c8f08a'] } },
    { id: 'v17', name: 'High Court Judge', trait: 'wordsmith', r: 'e', fx: { k: 'paper', c: ['#fff6d6', '#ffffff'] } },
    { id: 'v18', name: 'Scoop Reporter', trait: 'scout', r: 'c', fx: { k: 'paper', c: ['#fff6d6', '#e8e0c8'] } },
    { id: 'v19', name: 'Grease Mechanic', trait: 'vowel', r: 'c', fx: { k: 'ink', c: ['#1a1a1a', '#5a4a2a'] } },
    { id: 'v20', name: 'Barnstorm Pilot', trait: 'scout', r: 'r', fx: { k: 'dust', c: ['#ffffff', '#c8ecff'] } },
    { id: 'v21', name: 'Deep-Sea Diver', trait: 'rainy', r: 'l', fx: { k: 'bubbles', c: ['#9fe0ff', '#d6f0ff'] } },
    { id: 'v22', name: 'Steampunk Tinkerer', trait: 'wordsmith', r: 'e', fx: { k: 'steam', c: ['#f0e8d8', '#ffd23a'] } },
    { id: 'v23', name: 'Radio Operator', trait: 'owl', r: 'r', fx: { k: 'notes', c: ['#7be05a', '#5fc8ff'] } },
    { id: 'v24', name: 'Alchemist', trait: 'wordsmith', r: 'r', fx: { k: 'bubbles', c: ['#b58cf0', '#7be05a'] } },
    { id: 'v25', name: 'Mischief Sailor', trait: 'rainy', r: 'c', fx: { k: 'drops', c: ['#5fa8f0', '#ffffff'] } },
    { id: 'v26', name: 'Pirate Captain', trait: 'lucky', r: 'e', fx: { k: 'coins', c: ['#ffd23a', '#c98f0e'] } },
    { id: 'v27', name: 'Pastry Chef', trait: 'vowel', r: 'r', fx: { k: 'steam', c: ['#ffffff', '#ffe6c8'] } },
    { id: 'v28', name: 'Stage Magician', trait: 'lucky', r: 'l', fx: { k: 'stars', c: ['#b58cf0', '#ff5d73', '#fff6d6'] } },
    { id: 'v29', name: 'Shadow Ninja', trait: 'owl', r: 'e', fx: { k: 'smoke', c: ['#2a2a34', '#4a4a58'] } },
    { id: 'v30', name: 'Lucky Cowboy', trait: 'lucky', r: 'c', fx: { k: 'coins', c: ['#ffd23a', '#e8b878'] } }
  ];
  const lookById = id => LOOKS.find(l => l.id === id) || LOOKS[0];
  /* rarer looks are harder to roll and their trait works harder: every trait's bonus is multiplied by mul (see traitText) */
  const RARITY = { c: { name: 'Common', odds: .71, mul: 1 }, r: { name: 'Rare', odds: .22, mul: 1.5 }, e: { name: 'Epic', odds: .06, mul: 2 }, l: { name: 'Legendary', odds: .01, mul: 3 } };
  const rarOf = t => (t && t.look ? lookById(t.look).r : 'c') || 'c';
  const trMul = t => RARITY[rarOf(t)].mul;
  const FX_TEXT = { dust: 'Kicks up dust', sparks: 'Throws sparks', stars: 'Sees stars', drops: 'Splashes', bubbles: 'Blows bubbles', steam: 'Lets off steam', smoke: 'Vanishes in smoke', coins: 'Scatters coins', confetti: 'Throws confetti', chips: 'Sheds chips and parts', paper: 'Shuffles papers', ink: 'Splatters ink', leaves: 'Drops leaves', notes: 'Hums a tune' };
  function traitText(t) {
    const m = trMul(t), pc = x => Math.round(x * 100) + '%';
    return { vowel: `Leans toward vowels after a consonant (${pc(Math.min(.9, .3 * m))} of the time).`, wordsmith: `Chases the focused title ${pc(.15 * m)} harder.`, speedy: `Types ${pc(.25 * m)} faster.`,
      owl: `${pc(.4 * m)} faster at night, 10% slower by day.`, lucky: `${+(5 * m).toFixed(1)}% of presses type two letters.`, rainy: `${pc(.3 * m)} faster in rain, and ignores storms.`,
      scout: `Spots golden bananas sooner (${pc(.03 * m)} each).` }[t.trait] || TRAITS[t.trait].desc;
  }
  const hashStr = str => { let h = 7; for (const c of String(str)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
  function rollLook(not) {                                         // draw a rarity first, then a look of that rarity
    let x = rand(), tier = 'c'; for (const k of ['l', 'e', 'r']) { if (x < RARITY[k].odds) { tier = k; break; } x -= RARITY[k].odds; }
    let pool = LOOKS.filter(l => l.r === tier && l.id !== not); if (!pool.length) pool = LOOKS.filter(l => l.id !== not);
    return pool[Math.floor(rand() * pool.length)];
  }
  const portraits = {};
  function lookArt(id, hat = 0) {
    const k = id + ':' + hat;
    if (!portraits[k]) portraits[k] = PX ? `<span class="o-lookpic"><img alt="" src="${window.CrewArt ? CrewArt.pose(id, 'idle', { hat }).toDataURL() : ''}"></span>` : `<span class="o-lookpic">${window.CrewSvg ? CrewSvg.svg(id, hat) : '🐒'}</span>`;
    return portraits[k];
  }
  const seeLook = id => { (S.looks || (S.looks = {}))[id] = 1; };
  const LVL_XP = [0, 40, 120, 300, 650, 1300, 2400, 4200, 7000, 11000];
  const levelOf = xp => { let l = 1; while (l < LVL_XP.length && xp >= LVL_XP[l]) l++; return l; };
  const HATS = [
    { id: 6, name: 'Cap', emoji: '🧢', award: 'l1k' }, { id: 4, name: 'Beret', emoji: '👒', award: 's1' }, { id: 7, name: 'Flower', emoji: '🌺', award: 'd1' },
    { id: 3, name: 'Party cone', emoji: '🎉', award: 'c10' }, { id: 2, name: 'Top hat', emoji: '🎩', award: 's8' }, { id: 8, name: 'Graduation cap', emoji: '🎓', award: 'g10' },
    { id: 5, name: 'Crown', emoji: '👑', award: 'l100k' }
  ];
  const hatOpen = h => !!S.awards[h.award];
  const hatById = id => HATS.find(h => h.id === id);
  const rollTalent = () => Math.floor(rand() * 7) + Math.floor(rand() * 7);                // two dice: +0 to +12 % typing speed, most often about +6
  function newTypist(candidate = S) {
    const used = new Set(candidate.desks.flatMap(d => (d.crew || []).map(t => t.name)));
    const free = NAMES.filter(n => !used.has(n));
    const name = free.length ? free[Math.floor(rand() * free.length)] : NAMES[Math.floor(rand() * NAMES.length)] + ' ' + (used.size + 1);
    const look = rollLook();
    if (candidate === S) ui.lastLook = { id: look.id, fresh: !(S.looks || {})[look.id] };
    (candidate.looks || (candidate.looks = {}))[look.id] = 1;
    return { name, look: look.id, trait: look.trait, talent: rollTalent(), coach: 0, rerolls: 0, xp: 0, lv: 1, hat: 0, shiny: rand() < .05 };   // 1 in 20 hires is shiny (cosmetic)
  }
  function ensureCrew(d) {
    if (!d.crew) d.crew = [];
    while (d.crew.length < d.paws) d.crew.push(newTypist());
    if (d.crew.length > d.paws) d.crew.length = d.paws;
    d.crew.forEach(t => {                                          // saves from before looks: dress each monkey in a look that matches the trait it already had
      if (t.look && LOOKS.some(l => l.id === t.look)) return;
      const fits = LOOKS.filter(l => l.trait === t.trait), pool = fits.length ? fits : LOOKS, look = pool[hashStr(t.name) % pool.length];
      t.look = look.id; t.trait = look.trait; seeLook(look.id);
    });
  }
  /* the sky for the game's rules comes from World (world.js), the same clock that drives the rain and the night class on screen.
     skyOv lets offline catch-up evaluate the sky at the moment it is simulating instead of now. */
  let skyOv = null, skyC = null, skyT = 0;
  const sky = () => { if (skyOv) return skyOv; const t = Date.now(); if (!skyC || t - skyT > 400) { skyC = World.at(t); skyT = t; } return skyC; };
  const isNight = () => sky().night;
  function typistSpeed(t) {
    if (!t) return 1;
    let m = 1 + .04 * (levelOf(t.xp) - 1);
    if (t.trait === 'speedy') m *= 1 + .25 * trMul(t);
    if (t.trait === 'owl') m *= isNight() ? 1 + .4 * trMul(t) : .9;
    if (museOn('poe') && isNight()) m *= 1.25;
    m *= speedPerks() * (1 + ((t.talent || 0) + (t.coach || 0) * COACH_STEP) / 100);        // the monkey's talent roll plus coaching
    if (t.trait === 'rainy') { if (sky().wx >= 1) m *= 1 + .3 * trMul(t); if (stormy()) m *= 2; }
    return m * (1 + (extensions.get('minigames')?.automaticTypingBonus?.() || 0)) * (worksPlay?.factor(S) || 1);
  }
  const maxLevel = () => S.desks.reduce((m, d) => d.crew.reduce((a, t) => Math.max(a, levelOf(t.xp)), m), 1);
  function grantXp(d, p, amt, silent) {
    const t = d.crew[p]; if (!t) return;
    t.xp += amt; const l = levelOf(t.xp);
    if (l > (t.lv || 1)) {
      t.lv = l; if (silent) return;
      IMI.sfx.tick();
      const k = typists.findIndex(x => x.ci === p);
      if (S.desks[S.sel] === d && ui.tab === 'floor' && k >= 0) {
        const ty = typists[k], x = stageXY[0] + ty.x, y = stageXY[1] + ty.y - keyW;
        say(ty, 'LEVEL UP!'); jump(ty); IMI.burst(x, y, ['star', 'spark'], 8); shock(x, y, '#7be05a'); floatText('LV ' + l, x, y - 30, '#7be05a', true);
      }
      if (l >= 4) { logIt(`${t.name} reached level ${l}.`); newsPush(`${t.name} has reached level ${l}. The banana is considered a raise.`); }
      mark();
    }
  }

  /* ================= helpers ================= */
  const cur = () => S.desks[S.sel];
  const stock = w => S.bank[w] || 0;
  const totalLetters = d => Object.values(d.letters).reduce((a, b) => a + b, 0);
  const target = (d, w) => (w in d.keeper.targets ? d.keeper.targets[w] : d.keeper.def);
  const stormy = () => sky().wx === 3;
  const buffs = { frenzy: 0, golden: 0, snack: 0, rush: 0, sluggish: 0, critic: 0 };
  // Keep old absolute timestamp formats. Extra game time moves only gameplay deadlines.
  function advanceDeadlines(extraMs, challengeExtraMs = extraMs) {
    if (extraMs) {
      S.garden.beds.forEach(b => { if (b) b.ready -= extraMs; });
      Object.keys(buffs).forEach(k => { if (buffs[k]) buffs[k] -= extraMs; });
    }
    if (challengeExtraMs && S.challenge) S.challenge.start -= challengeExtraMs;
  }
  const BUFF_INFO = { frenzy: ['FRENZY', ''], golden: ['GOLDEN KEYS', ''], snack: ['SNACK BREAK x1.5', ''], rush: ['ROYALTY RUSH x7', ''], sluggish: ['SPOILED: SLOW', 'bad'], critic: ['BAD REVIEW: ROYALTIES HALF', 'bad'] };
  const anyBuff = () => Object.keys(buffs).some(k => productiveMono() < buffs[k]);

  /* ---- royalties: every title on the shelf keeps paying, a little, forever ---- */
  const ROY_BASE = TUNE.ROY_BASE || 0.00001;
  const DEALS = [
    { id: 'reprints', name: 'Reprints', desc: 'Every title on your shelf earns 50% more royalties.', cost: 2500, need: 1, mult: 1.5 },
    { id: 'tour', name: 'Book tour', desc: 'Royalties x1.5. The monkeys sign autographs (badly).', cost: 15000, need: 3, mult: 1.5 },
    { id: 'translations', name: 'Translations', desc: 'Royalties x2, now unreadable in six languages.', cost: 120000, need: 6, mult: 2 },
    { id: 'clubs', name: 'Book clubs', desc: 'Each title on the shelf adds 3% to all royalties.', cost: 400000, need: 9, synergy: .03 },
    { id: 'option', name: 'Film option', desc: 'Royalties x2. A studio keeps calling.', cost: 1500000, need: 12, mult: 2 }
  ].map(x => ({ ...x, cost: cash(x.cost) }));
  const awardCount = () => Object.keys(S.awards).length;
  const awardMult = () => 1 + .01 * awardCount();
  /* everything that counts the shelf reads this one pass. It runs several times per 50ms tick (typist speed, muse seats, royalties), so it is
     cached until the shelf changes (dropCaches) or the save is swapped; before, a 260-title shelf cost ~70,000 steps per call. */
  let soldC = null;
  const soldStats = () => {
    if (soldC && soldC.ref === S.written) return soldC;
    let all = 0, kids = 0, libs = 0, authored = 0, pay = 0;
    for (const id in S.written) { const r = RBY[id]; if (!r) continue; pay += r.pay * (r.kid ? KID_ROY : r.lib ? LIB_ROY : 1); if (r.kid) kids++; else if (r.lib) libs++; else { all++; if (!r.gen) authored++; } }
    return (soldC = { ref: S.written, all, kids, libs, authored, pay });
  };
  const authoredSold = () => soldStats().authored;
  const kidsSold = () => soldStats().kids;
  const libSold = () => soldStats().libs;
  const soldCount = () => soldStats().all;   // progression gate: kids' and library titles never count
  /* the kids' reading list: the next KID_LIST unsold kids' titles; only those (plus authored and pitched titles) are in play */
  let listC = null, listT = 0, readyC = null, readyT = 0;
  const kidsListed = () => {
    const now = performance.now();
    if (!listC || now - listT > 1000) { listC = new Set(); listT = now; for (const r of KIDS) { if (S.written[r.id]) continue; listC.add(r.id); if (listC.size >= KID_LIST) break; } }
    return listC;
  };
  const inPlay = r => !r.kid || kidsListed().has(r.id);
  const readyList = () => { const now = performance.now(); if (!readyC || now - readyT > 250) { readyC = RECIPES.filter(canWrite); readyT = now; } return readyC; };
  const dropCaches = () => { listC = null; readyC = null; soldC = null; };
  const dealMult = () => DEALS.reduce((m, d) => (S.deals[d.id] ? m * (d.mult || 1) : m), 1) * (S.deals.clubs ? 1 + .03 * soldCount() : 1);
  const royaltyScale = () => new URLSearchParams(location.search).get('pg03') === '1' ? 2 * (1 + .35 * Math.min(S.printing, 7)) : 1;
  const bookRoy = r => r.pay * (r.kid ? KID_ROY : r.lib ? LIB_ROY : 1) * ROY_BASE * royaltyScale() * dealMult() * awardMult() * legacyMult() * (museOn('austen') ? 1.25 : 1);
  const royBase = () => soldStats().pay * ROY_BASE * royaltyScale() * dealMult() * awardMult() * legacyMult() * (museOn('austen') ? 1.25 : 1);   // bookRoy summed over the shelf, with the shared factors pulled out of the loop
  const royRate = () => royBase() * passive();
  const fmtRate = IMI.fmtRate;
  const buffOn = k => productiveMono() < buffs[k];
  const pawSecs = d => PAW_BASE[S.desks.indexOf(d)] * Math.pow(0.85, d.up.fing) * (toolOn('metro') ? 0.5 : 1) * (stormy() ? 2 : 1) * (buffOn('frenzy') ? 0.5 : 1) * (buffOn('snack') ? 1 / 1.5 : 1) * (buffOn('sluggish') ? 1.7 : 1);
  const holdRate = d => ((TUNE.HOLD_BASE || 4) + (TUNE.RAPID_STEP || 2) * d.up.rapid) * (toolOn('dbl') ? (TUNE.DBL || 2) : 1);
  const autoRate = d => (d.paws ? d.crew.reduce((a, t) => a + typistSpeed(t), 0) * deskMk(d) / pawSecs(d) : 0);
  const rewardBasis = () => {
    const multiplier = speed(), letters = S.desks.map((d, i) => !d.owned || !d.paws ? 0 :
      multiplier * deskMk(d) / (PAW_BASE[i] * .85 ** d.up.fing * (toolOn('metro') ? .5 : 1) * (stormy() ? 2 : 1)) *
      d.crew.reduce((n, t) => n + typistSpeed(t) * (t.trait === 'lucky' ? 1 + .05 * trMul(t) : 1), 0));
    return { speed:multiplier, desk:S.desks.reduce((n, d, i) => d.owned ? i : n, 0), letters, bananas:(royBase() + divBase()) * multiplier };
  };
  let layerOffer = null;
  const layerChoices = new Set();
  function layerChoiceResult(kind, result) {
    if (layers?.enabled) { if (result.ok) layerChoices.delete(kind); else layerChoices.add(kind); }
    return result;
  }
  function startingRoom(room) {
    const d = room.desks[0];
    if (room.legacy.ups.crew) { room.hold = true; d.paws = 2; for (let n=0;n<2;n++) d.crew.push(newTypist(room)); }
    const skyNow = sky(), multiplier = speed();
    const rate = multiplier / PAW_BASE[0] / (skyNow.wx === 3 ? 2 : 1) * d.crew.reduce((sum,t) => {
      const m = trMul(t);
      let factor = (1 + .1 * (room.legacy.ups.speed || 0)) * (room.chDone.vowel ? 1.05 : 1) * (room.chDone.hands ? 1.1 : 1) * (1 + t.talent / 100);
      if (t.trait === 'speedy') factor *= 1 + .25 * m;
      if (t.trait === 'owl') factor *= skyNow.night ? 1 + .4 * m : .9;
      if (t.trait === 'rainy') { if (skyNow.wx >= 1) factor *= 1 + .3 * m; if (skyNow.wx === 3) factor *= 2; }
      if (t.trait === 'lucky') factor *= 1 + .05 * m;
      return sum + factor * (1 + (extensions.get('minigames')?.automaticTypingBonus?.() || 0)) * (worksPlay?.factor(room) || 1);
    },0);
    return {room, basis:{desk:0, letters:[rate], speed:multiplier}, seed:cash([0,1000,10000,100000][room.legacy.ups.seed || 0])};
  }
  function layerPreview() {
    if (!archiveSettle()) throw Error('Archive income is waiting to save.');
    const quote = layers.quote(S), start = startingRoom(layers.project(S, fresh()));
    const reward = S.rewards.claims['layer:imprint:first'] ? null : writer.layerReward(start.basis);
    return layerOffer = {...start, quote, legacy:JSON.stringify(S.legacy), reward};
  }
  function layerRuntimeReset(tab = 'imprints') {
    IMI.pickups?.clear(); goldEnd?.(); holding = false; royAcc = coinBank = 0;
    combo.n = combo.t = 0; keeperT = []; freqCache = null; lastBananas = bananas.get();
    rt.forEach(r => { r.timers = []; r.sheet = ''; r.col = 0; r.n = 0; });
    Object.assign(ui, {hot:DESKS.map(() => false), readySet:null, pulled:null, fresh:null, dropped:{}, mcd:{}, tab, nextCh:''});
    Object.keys(buffs).forEach(k => { buffs[k] = 0; }); typists = []; dropCaches(); bankV++;
    // Reset runtime cadences only. Reward initialization must not reinterpret the new local Printing.
    for (const id of ['automation','minigames']) extensions.get(id)?.reset?.({kind:'imprint'}, extensionAPI);
    buildStage(); mark();
  }
  const canMake = (d, w) => { const c = lcount(w); for (const k in c) if ((d.letters[k] || 0) < c[k]) return false; return true; };
  const makeCopies = (d, w) => { const c = lcount(w); let n = Infinity; for (const k in c) n = Math.min(n, Math.floor((d.letters[k] || 0) / c[k])); return n; };
  const pick = map => {
    let t = 0; for (const k in map) t += map[k];
    if (t <= 0) return null;
    let r = rand() * t;
    for (const k in map) { r -= map[k]; if (r <= 0) return k; }
    return Object.keys(map)[0];
  };
  const addLetter = (d, ch) => { d.letters[ch] = (d.letters[ch] || 0) + 1; d.tray.push(ch); if (d.tray.length > 80) d.tray.shift(); };
  // Only actual press output enters this route. Generic grants remain ordinary.
  const generatedLetter = (d, i, ch) => { if (!activeWork()?.route(S,i,ch,1)) addLetter(d,ch); };
  const takeLetter = (d, ch) => {
    if (!d.letters[ch]) return;
    if (--d.letters[ch] <= 0) delete d.letters[ch];
    const i = d.tray.lastIndexOf(ch); if (i >= 0) d.tray.splice(i, 1);
  };
  /* one goal for every keeper; the argument is kept so call sites read the same */
  const focusRecipe = () => folioGoal() || (S.focus && titleAvailable(RBY[S.focus] || {}) && !S.written[S.focus] ? RBY[S.focus] || null : null);
  /* auto focus picks the best return for the crews' time: missing letters, weighted by how slowly that desk's typists work, per banana of rights */
  function autoEffort(r) {
    let t = 0;
    for (const w in r.need) { const n = r.need[w] - stock(w); if (n > 0) { const b = bandOf(w.length); t += n * w.length * PAW_BASE[b] / Math.max(1, S.desks[b].paws); } }
    return t;
  }
  function pickAutoFocus() {
    if (folioGoal()) return;
    if (challengeActive()?.phase === 'producing') return;
    if (pg?.active(pgContext)) {
      const was = S.focus, next = pg.resolve(pgContext);
      S.focus = next?.id || null; S.autoFocus = !S.meta.productionGoal.manual;
      if (S.focus !== was) IMI.emit('focus', { id: S.focus });
      return;
    }
    if (!S.autoFocus || focusRecipe()) return;
    let best = null, bm = Infinity;
    for (const r of RECIPES) {
      if (!titleAvailable(r) || S.written[r.id] || !inPlay(r) || !Object.keys(r.need).every(w => S.desks[bandOf(w.length)].owned)) continue;
      const miss = autoEffort(r) / r.pay;
      if (miss < bm || (miss === bm && best && r.pay < best.pay)) { best = r; bm = miss; }
    }
    const was = S.focus; S.focus = best ? best.id : null; if (S.focus !== was) IMI.emit('focus', { id: S.focus });
  }
  // The policy gets recipe facts and one bounded config writer, never an unrestricted state setter.
  const pgContext = pg ? {
    state: () => S, recipes: RECIPES, byId: RBY, available:titleAvailable, inPlay, bandOf, stock, effort: autoEffort,
    accessible: b => S.desks[b].owned && !((chal('haiku') || masteryActive()) && b > 1),
    ready: r => canWrite(r), mark: () => mark(), refresh: () => pickAutoFocus(),
    missing: () => DESKS.map((d, i) => ({ name: d.name, words: Object.entries(focusRecipe()?.need || {}).reduce((n, [w, count]) => n + (bandOf(w.length) === i ? Math.max(0, count - stock(w)) : 0), 0) })).filter(x => x.words),
    commit: commitProductionGoal
  } : null;
  function commitProductionGoal(expected, next) {
    if (!pg || window.VaultSaveGate?.blocked || !progressing() || writer && (writer.localDisposition() || !writer.guard(S))) return { ok: false, error: 'Save owner is unavailable' };
    if (challengeActive() && !challengeHandover()) return {ok:false,error:'A11 handover waiting to save'};
    const current = S.meta.productionGoal;
    if ((current === undefined ? null : JSON.stringify(current)) !== expected || current !== undefined && !pg.valid(current) || !pg.valid(next)) return { ok: false, error: 'Production goal changed or is unsupported' };
    const productionGoal = JSON.parse(JSON.stringify(next)), lastSeen = S.rewards.awayCheckpoint ? S.lastSeen : Date.now();
    const focus = productionGoal.enabled ? productionGoal.manual : null, autoFocus = !focus;
    const result = layerChoiceResult('productionGoal', Economy.saveStateAcknowledged({ ...S, meta: { ...S.meta, productionGoal }, focus, autoFocus, lastSeen }));
    if (result.ok) { S.meta.productionGoal = productionGoal; S.focus = focus; S.autoFocus = autoFocus; S.lastSeen = lastSeen; mark(); }
    return result;
  }
  const goalWord = w => folioGoal() ? !!folioGoal().need[w] && stock(w) < folioGoal().need[w] : !pg || pg.wants(pgContext, w);
  const goalTarget = (d, w) => folioGoal() ? folioGoal().need[w] || 0 : pg?.active(pgContext) ? focusRecipe()?.need[w] || 0 : target(d, w);
  const mark = () => { dirty = true; dropCaches(); };
  const vib = p => { try { if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return; navigator.vibrate && navigator.vibrate(p); } catch { /* unsupported */ } };
  /* progress(r) is how many of a title's words are banked. It is asked for every title (1,200 of them) on each redraw of the Titles list, but it only
     changes when the word bank does, so it is cached per title against bankV, which is bumped at every place the bank changes. */
  let bankV = 0;
  const progress = r => {
    if (r._pv === bankV && r._pb === S.bank) return r._pg;
    let have = 0; for (const w in r.need) have += Math.min(stock(w), r.need[w]);
    r._pv = bankV; r._pb = S.bank; return (r._pg = have);
  };
  /* rolling numbers: cnt() renders a number that animates toward its new value (and counts up from zero when a tab opens) */
  const shownN = {}, cntAnim = {}; let cntWake = false;
  const cnt = (key, n, big) => {
    cntWake = true;
    if (ui.cntZero && !IMI.reduceMotion) { shownN[key] = 0; delete cntAnim[key]; }
    if (!(key in shownN) || IMI.reduceMotion) shownN[key] = n;
    return `<span class="o-cnt" data-cnt="${key}" data-v="${n}"${big ? ' data-big' : ''}>${(big ? fmtBig : fmt)(shownN[key])}</span>`;
  };
  function countStep(now) {
    if (!cntWake) return;                                          // numbers only move after a render has handed them a new value
    let live = false;
    for (const el of document.querySelectorAll('.o-cnt')) {
      const k = el.dataset.cnt, t = +el.dataset.v; let a = cntAnim[k];
      if ((shownN[k] ?? t) === t && !a) { if (el.classList.contains('up')) el.classList.remove('up'); continue; }
      if (!a || a.to !== t) a = cntAnim[k] = { from: shownN[k] ?? t, to: t, t0: now, dur: Math.min(1100, 350 + Math.abs(t - (shownN[k] ?? t)) * 40) };
      const p = Math.min(1, (now - a.t0) / a.dur), e = 1 - Math.pow(1 - p, 3);
      shownN[k] = p >= 1 ? t : a.from + (t - a.from) * e; if (p >= 1) delete cntAnim[k]; else live = true;
      el.textContent = (el.hasAttribute('data-big') ? fmtBig : fmt)(shownN[k]); el.classList.toggle('up', p < 1);
    }
    cntWake = live;
  }
  const bar = (have, total) => `<span class="o-prog" role="img" aria-label="${have} of ${total} words"><i style="width:${Math.round(100 * have / total)}%"></i></span>`;
  /* floating text that rises from a point (page coordinates, so it survives re-renders) */
  function floatText(text, x, y, color, big) {
    if (IMI.reduceMotion) return;
    const el = document.createElement('div'); el.className = 'o-float' + (big ? ' big' : ''); el.textContent = text;
    el.style.cssText = `left:${x}px;top:${y}px;--pc:${color || DESKS[S.sel].color};font-family:${DESKS[S.sel].font}`;
    el.addEventListener('animationend', () => el.remove()); document.body.appendChild(el);
  }
  const logIt = text => { S.log.unshift(text); S.log.length = Math.min(S.log.length, 40); };

  function focusNeeds(d, i) {
    const r = focusRecipe(d), required = {}, oneCopy = {};
    if (!r) return { required, missing: {}, oneCopy };
    for (const w in r.need) {
      if (bandOf(w.length) !== i) continue;
      const left = r.need[w] - stock(w); if (left <= 0) continue;
      const c = lcount(w);
      for (const ch in c) { required[ch] = (required[ch] || 0) + c[ch] * left; oneCopy[ch] = (oneCopy[ch] || 0) + c[ch]; }
    }
    const missing = {};
    for (const ch in required) { const m = required[ch] - (d.letters[ch] || 0); if (m > 0) missing[ch] = m; }
    return { required, missing, oneCopy };
  }
  function completers(d, i, ok) {
    const out = {};
    for (const w of BAND_WORDS[i]) {
      if (!ok(w)) continue;
      const c = lcount(w); let miss = 0, which = null;
      for (const ch in c) { const m = c[ch] - (d.letters[ch] || 0); if (m > 0) { miss += m; which = ch; if (miss > 1) break; } }
      if (miss === 1) out[which] = (out[which] || 0) + 1;
    }
    return out;
  }

  /* ================= typing ================= */
  function roll(d, i, auto, ty) {
    const up = d.up, k = d.keeper; let ch = null;
    if (auto && focusRecipe(d) && rand() < Math.min(.98, UPV.practice[up.practice] + (ty && ty.trait === 'wordsmith' ? .15 * trMul(ty) : 0))) ch = pick(focusNeeds(d, i).missing);
    if (!ch && auto && k.owned && up.stock && rand() < UPV.stock[up.stock]) ch = pick(completers(d, i, w => goalWord(w) && goalTarget(d, w) > 0 && stock(w) < goalTarget(d, w)));
    if (!ch && up.ink && rand() < UPV.ink[up.ink]) ch = pick(completers(d, i, w => (!auto || goalWord(w)) && !stock(w)));
    if (!ch) {
      const last = rt[i].sheet.slice(-1).toUpperCase(), frequency = freqNow();
      const lastCons = last && /[A-Z]/.test(last) && !VOWELS.includes(last);
      if (lastCons && !chal('vowel') && (up.vowel || (ty && ty.trait === 'vowel') || museOn('dick')) && rand() < Math.max(UPV.vowel[up.vowel], ty && ty.trait === 'vowel' ? Math.min(.9, .3 * trMul(ty)) : 0, museOn('dick') ? .3 : 0)) ch = pick(Object.fromEntries([...VOWELS].map(v => [v, frequency[v]])));
      else ch = pick(frequency);
    }
    return ch;
  }
  function press(i, auto, p) {
    if (!progressing()) return;
    const d = S.desks[i]; if (!d.owned) return;
    const ty = auto && p != null ? d.crew[p] : null;
    if (!auto && chal('hands')) { handsNag(); return; }
    if (!auto && i === S.sel) comboHit();
    const ch = roll(d, i, auto, ty);
    generatedLetter(d, i, ch);
    if (ty) { grantXp(d, p, 1); if (ty.trait === 'lucky' && rand() < .05 * trMul(ty)) generatedLetter(d, i, roll(d, i, true, ty)); }
    const st = S.stats; st.letters++; if (!auto) { st.manual++; introProgress(); IMI.emit('tap', { letters: st.letters }); } st.byLetter[ch] = (st.byLetter[ch] || 0) + 1;
    if (stormy()) st.storm++; if (isNight()) st.night++;
    if (!auto && buffOn('golden')) generatedLetter(d, i, roll(d, i, false));
    if (auto && d.up.ribbon && d.keeper.owned && rand() < UPV.ribbon[d.up.ribbon]) {
      const { required, missing } = focusNeeds(d, i), want = pick(missing);
      const spare = Object.keys(d.letters).filter(l => d.letters[l] > (required[l] || 0));
      if (want && spare.length) { takeLetter(d, spare[Math.floor(rand() * spare.length)]); addLetter(d, want); }
    }
    worksAdvance();
    rt[i].sheet = (rt[i].sheet + ch).slice(-120); rt[i].n++;
    if (i === S.sel) animatePress(ch, auto, rt[i].n, p);
    mark();
  }

  /* tapping streaks: keep tapping and the milestones pay out real (if small) bonuses */
  const MILES = [
    { n: 10, name: 'WARM UP', desc: '+3 bonus letters' },
    { n: 25, name: 'FRENZY', desc: 'All typists work twice as fast for 15s' },
    { n: 50, name: 'GOLDEN KEYS', desc: 'Every tap types two letters for 12s' },
    { n: 100, name: 'BANANA BONUS', desc: `${fmt(cash(50))} bananas per title written, plus ${fmt(cash(50))}` },
    { n: 200, name: 'MONKEY MANIA', desc: '30s of Frenzy and Golden Keys, plus 10 letters' }
  ];
  const HIGH_MILES = new URLSearchParams(location.search).get('ui01') === '1' ? [
    [500, 'LONG RUN'], [1000, 'MARATHON'], [2000, 'IRON PAWS'],
    [3000, 'UNBROKEN'], [4000, 'LEGEND'], [5000, 'TYPING MYTH']
  ].map(([n, name]) => ({ n, name, desc: `A streak of ${n} taps!`, recognition: true })) : [];
  const combo = { n: 0, t: 0, timer: 0 };
  let milestoneNotice, noticeTimer, noticeItems = [];
  function showMilestone(m) {
    if (!milestoneNotice) {
      milestoneNotice = document.createElement('div'); milestoneNotice.className = 'o-milestone-notice';
      milestoneNotice.setAttribute('role', 'status'); root.appendChild(milestoneNotice);
    }
    if (!noticeItems.some(x => x.n === m.n) && noticeItems.length < MILES.length + HIGH_MILES.length) noticeItems.push(m);
    const visible = noticeItems.slice(0, 2), rest = noticeItems.slice(2);
    milestoneNotice.innerHTML = visible.map(x => `<b>${esc(x.name)}!</b><span>${esc(x.desc)}</span>`).join('') +
      (rest.length ? `<details><summary>${rest.length} more streak milestones</summary>${rest.map(x => `<b>${esc(x.name)}!</b><span>${esc(x.desc)}</span>`).join('')}</details>` : '');
    milestoneNotice.hidden = false;
    clearTimeout(noticeTimer); noticeTimer = setTimeout(() => { milestoneNotice.hidden = true; noticeItems = []; }, 3000);
  }
  function award(m, cx, cy) {
    if (m.recognition) { showMilestone(m); root.dataset.streak = m.n; mark(); return; }
    const d = cur(), now = performance.now();
    if (now < (ui.mcd[m.n] || 0)) { floatText('cooling down', cx, cy + 40, '#cfd8dc'); return; }
    ui.mcd[m.n] = now + 45000;
    if (m.n === 10) for (let k = 0; k < 3; k++) addLetter(d, roll(d, S.sel, true));
    if (m.n === 25) buffs.frenzy = now + 15000;
    if (m.n === 50) buffs.golden = now + 12000;
    if (m.n === 100) bananas.earn(cash(50) * (1 + Object.keys(S.written).length), [cx, cy]);
    if (m.n === 200) { buffs.frenzy = now + 30000; buffs.golden = now + 30000; for (let k = 0; k < 10; k++) addLetter(d, roll(d, S.sel, true)); }
    showMilestone(m);
    IMI.burst(cx, cy, ['spark', 'banana', 'star', 'leaf'], 12 + Math.min(14, m.n / 8)); shock(cx, cy, m.n >= 100 ? '#ff5d73' : '#ffd23a', m.n >= 50); if (m.n >= 50) flash('#fff08c'); if (m.n >= 100) vignette(m.n >= 200 ? '#ff5d73' : '#ffd23a'); shake(m.n >= 100 ? 2 : 1); IMI.sfx.ding(); vib([12, 30, 12]);
    cheer(m.n >= 100 ? 2600 : 1400, m.n >= 100 ? 'WOW!' : 'YAY!');
    IMI.emit('milestone', { n: m.n, x: cx, y: cy });
    mark();
  }
  function comboHit() {
    const now = performance.now(); combo.n = now - combo.t < 650 ? combo.n + 1 : 1; combo.t = now;
    if (combo.n > S.best) { S.best = combo.n; }
    vib(6);
    if (!fx) return; const el = fx.combo, stage = fx.stage;
    const heat = combo.n >= 50 ? 3 : combo.n >= 20 ? 2 : combo.n >= 10 ? 1 : 0;
    if (root.dataset.heat !== String(heat)) root.dataset.heat = heat;
    if (combo.n < 5) { if (el.className !== 'o-combo') el.className = 'o-combo'; return; }
    IMI.sfx.combo && IMI.sfx.combo(combo.n);
    fx.comboN.textContent = `x${combo.n}`; const cls = 'o-combo show' + (combo.n >= 50 ? ' hot' : combo.n >= 20 ? ' warm' : ''); if (el.className !== cls) el.className = cls;
    if (!IMI.reduceMotion) {                                         // the number pops on every tap and the streak timer drains from full: Web Animations restart without forcing a layout
      el.animate([{ transform: 'scale(1.8) rotate(-8deg)' }, { transform: 'none' }], { duration: 220, easing: PX ? 'steps(4)' : 'ease-out' });
      if (fx.meterAnim) fx.meterAnim.cancel();
      fx.meterAnim = fx.meter.animate([{ transform: 'scaleX(1)' }, { transform: 'scaleX(0)' }], { duration: 900, easing: PX ? 'steps(9)' : 'linear', fill: 'forwards' });
    }
    if (heat) ember(heat);
    IMI.emit('combo', { n: combo.n, heat });
    const m = MILES.find(x => x.n === combo.n) || HIGH_MILES.find(x => x.n === combo.n);
    if (m) { const b = stage.getBoundingClientRect(); award(m, b.left + b.width / 2, b.top + 150); }
    clearTimeout(combo.timer); combo.timer = setTimeout(() => { el.className = 'o-combo'; root.dataset.heat = 0; delete root.dataset.streak; combo.n = 0; if (fx && fx.meterAnim) fx.meterAnim.cancel(); mark(); }, 900);
    mark();
  }
  /* a hot streak throws sparks up off the keyboard */
  function ember(heat) {
    const box = fx && fx.embers; if (!box || IMI.reduceMotion || LOW()) return;
    for (let k = 0; k < heat; k++) {
      const e = document.createElement('i'); e.className = 'o-ember';
      e.style.cssText = `left:${15 + rand() * 70}%;--dx:${(rand() - .5) * 60}px;--rise:${-90 - rand() * 120}px;--ec:${['#ffd23a', '#ff9a3a', '#ff5d73'][Math.min(2, Math.floor(rand() * (heat + 1)))]}`;
      e.addEventListener('animationend', () => e.remove()); box.appendChild(e);
    }
    while (box.childElementCount > 40) box.firstElementChild.remove();
  }
  /* a pixel shockwave ring (page coordinates) plus an optional full-screen flash */
  function shock(x, y, color, big, tiny) {
    if (IMI.reduceMotion) return;
    const r = document.createElement('i'); r.className = 'o-shock' + (big ? ' big' : tiny ? ' tiny' : '');
    r.style.cssText = `left:${x}px;top:${y}px;--sc:${color || '#ffd23a'}`;
    r.addEventListener('animationend', () => r.remove()); document.body.appendChild(r);
    IMI.emit('shock', { x, y, color: color || '#ffd23a', big, tiny });
  }
  function flash(color) {
    if (IMI.reduceMotion) return;
    const f = document.createElement('i'); f.className = 'o-flash'; f.style.setProperty('--fc', color || '#fff6d6');
    f.addEventListener('animationend', () => f.remove()); document.body.appendChild(f);
  }
  /* royalties as visible income: little bananas hop off the shelf (or the typewriter room) into the counter */
  let coinBank = 0;
  function royCoins() {
    const amt = coinBank; coinBank = 0;
    const hud = document.getElementById('hud'); if (!amt || !hud || document.hidden || IMI.reduceMotion || IMI.screen() !== 'game') return;
    const srcs = [...document.querySelectorAll('.o-spine:not(.old)'), document.getElementById('oStage')].filter(e => {
      if (!e) return false; const r = e.getBoundingClientRect(); return r.width > 0 && r.bottom > 70 && r.top < innerHeight;
    });
    if (!srcs.length) return;
    const h = hud.getBoundingClientRect(), hx = h.left + h.width * .3, hy = h.top + h.height / 2, n = LOW() ? 1 : Math.min(3, 1 + Math.floor(Math.log10(amt / Economy.scale + 1) / 2));
    for (let k = 0; k < n; k++) setTimeout(() => {
      const src = srcs[Math.floor(rand() * srcs.length)], r = src.getBoundingClientRect(), x = r.left + r.width * (src.id === 'oStage' ? .2 + rand() * .6 : .5), y = r.top + 8;
      if (src.classList.contains('o-spine')) src.animate([{ translate: '0 0' }, { translate: '0 -7px' }, { translate: '0 0' }], { duration: 260, easing: PX ? 'steps(3)' : 'ease-out' });
      let c; if (PX) c = PXA.el('banana', 1); else c = IMI.bananaEl(1.6);
      c.classList.add('o-coin'); c.style.left = x + 'px'; c.style.top = y + 'px'; document.body.appendChild(c);
      const mx = (x + hx) / 2 + (rand() - .5) * 140, my = Math.min(y, hy) - 60 - rand() * 70;
      c.animate([
        { transform: 'translate(-50%,-50%) scale(.3)', opacity: 0 },
        { transform: `translate(calc(-50% + ${mx - x}px), calc(-50% + ${my - y}px)) scale(1.15)`, opacity: 1, offset: .42 },
        { transform: `translate(calc(-50% + ${hx - x}px), calc(-50% + ${hy - y}px)) scale(.6)`, opacity: 1 }
      ], { duration: 620 + rand() * 220, easing: PX ? 'steps(12)' : 'cubic-bezier(.45,0,.6,1)' }).onfinish = () => {
        c.remove(); hud.classList.remove('sip'); void hud.offsetWidth; hud.classList.add('sip'); IMI.sfx.coinlet && IMI.sfx.coinlet();
      };
    }, k * 120);
  }
  /* full-screen moments: a sunburst, a title card, fireworks */
  function celebrate(title, sub, extra) {
    if (document.querySelector('.o-celebrate')) return;
    const el = document.createElement('div'); el.className = 'o-celebrate'; el.setAttribute('role', 'status');
    el.innerHTML = `<i class="o-cel-burst"></i><div class="o-cel-card"><small>${esc(sub)}</small><b>${esc(title)}</b>${extra || ''}<em>Tap to continue</em></div>`;
    document.body.appendChild(el); document.body.classList.add('celebrating'); IMI.sfx.triumph && IMI.sfx.triumph(); vib([30, 40, 30, 40, 90]); flash('#fff6d6'); IMI.emit('celebrate', { title });
    const close = () => { if (!el.isConnected || el.classList.contains('out')) return; el.classList.add('out'); setTimeout(() => { el.remove(); document.body.classList.remove('celebrating'); }, IMI.reduceMotion ? 0 : 420); };
    el.addEventListener('click', close); setTimeout(close, 5600);
    if (!IMI.reduceMotion) for (let k = 0; k < 7; k++) setTimeout(() => {
      if (!el.isConnected) return; const x = innerWidth * (.1 + rand() * .8), y = innerHeight * (k % 2 ? .08 + rand() * .14 : .76 + rand() * .14);   // above and below the card, never over it
      IMI.burst(x, y, ['banana', 'star', 'spark', 'leaf'], 14); shock(x, y, ['#ffd23a', '#7be05a', '#ff9ec0', '#4cc9f0'][k % 4], true); IMI.sfx.coinlet && IMI.sfx.coinlet();
    }, 300 + k * 280);
  }
  function vignette(color) {
    if (IMI.reduceMotion) return;
    const v = document.createElement('i'); v.className = 'o-vig'; v.style.setProperty('--vc', color);
    v.addEventListener('animationend', () => v.remove()); document.body.appendChild(v);
  }
  function shake(strength) {
    const w = $('.o-panel'); if (!w || IMI.reduceMotion) return;
    const T = [[.25, -4, 2], [.5, 4, -2], [.75, -2, 0]], B = [[.12, -9, 4], [.25, 8, -5], [.4, -6, 3], [.55, 5, -2], [.75, -2, 1]];     // Web Animations restart without the forced reflow of the whole panel the class trick cost
    w.animate([{ translate: '0 0' }, ...(strength > 1 ? B : T).map(([offset, x, y]) => ({ translate: `${x}px ${y}px`, offset })), { translate: '0 0' }], { duration: strength > 1 ? 420 : 260, easing: PX ? 'steps(1)' : 'ease' });
  }

  /* ================= endless titles: the pitch desk ================= */
  const cap1 = w => w.charAt(0).toUpperCase() + w.slice(1);
  const roundSig = n => { const p = Math.pow(10, Math.floor(Math.log10(Math.max(1, n))) - 1); return Math.round(n / p) * p; };
  const shuffled = a => { const o = a.slice(); for (let i = o.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [o[i], o[j]] = [o[j], o[i]]; } return o; };
  function addRecipeWords(r) {
    for (const w of Object.keys(r.need)) if (!VOCAB.has(w)) { VOCAB.add(w); BAND_WORDS[bandOf(w.length)].push(w); BAND_WORDS[bandOf(w.length)].sort(); }
  }
  function registerPitch(p) {
    if (RBY[p.id]) return RBY[p.id];
    const r = buildRecipe({ ...p, gen: true }); RECIPES.push(r); RBY[r.id] = r; addRecipeWords(r); return r;
  }
  function genPitch(band) {
    let best = null;
    for (let attempt = 0; attempt < 60; attempt++) {
      const used = {};
      const choose = cat => {
        const pool = GEN[cat], anchors = pool.filter(w => bandOf(w.length) === band), lows = pool.filter(w => bandOf(w.length) <= band);
        const src = anchors.length && (band === 0 || rand() < .5) ? anchors : lows;
        const w = src[Math.floor(rand() * src.length)]; (used[cat] = used[cat] || []).push(w); return w;
      };
      const fits = t => [...t.matchAll(/\{(\w+)\}/g)].every(m => GEN[m[1]].some(w => bandOf(w.length) <= band));
      const allowed = GEN_TEMPLATES.filter(fits), goal = 22 * TITLE_SCALE[band], n = Math.max(3, Math.round(goal / 6.2)) + (rand() < .4 ? 1 : 0) + (band === 0 ? 2 : 0);
      const ts = Array.from({ length: n }, (_, k) => (band === 0 ? allowed[k % allowed.length] : shuffled(allowed)[k % allowed.length]));
      const text = ts.map(t => cap1(t.replace(/\{(\w+)\}/g, (_, c) => choose(c)))).join(' ');
      const r = buildRecipe({ id: 'tmp', title: '', pay: 0, text });
      const anchors = Object.keys(r.need).filter(w => bandOf(w.length) === band).reduce((a, w) => a + r.need[w], 0);
      if (!best || (r.band === band && anchors > best.anchors)) best = { text, r, used, anchors };
      if (r.band === band && (band === 0 || anchors >= 2) && r.total >= goal * .7 && r.total <= goal * 1.4) break;
    }
    const { text, r, used } = best;
    const A = (used.adj || [])[0], N = (used.animal || [])[0], T = (used.thing || [])[0], P = (used.place || [])[0], M = (used.name || [])[0];
    const forms = [];
    if (A && N) forms.push(`The ${cap1(A)} ${cap1(N)}`);
    if (M && A && T) forms.push(`${cap1(M)} and the ${cap1(A)} ${cap1(T)}`);
    if (N && P) forms.push(`A ${cap1(N)} in the ${cap1(P)}`);
    if (T && P) forms.push(`The ${cap1(T)} of the ${cap1(P)}`);
    const title = forms.length ? forms[Math.floor(rand() * forms.length)] : `The ${cap1((A || N || T || 'Story'))}`;
    const pay = cash(roundSig(PITCH_PAY[band] * (r.total / (22 * TITLE_SCALE[band])) * (.85 + rand() * .3) * (1 + .02 * Math.min(25, S.stats.pitchSold || 0))));
    return { id: 'p-' + Math.random().toString(36).slice(2, 9), title, pay, text };
  }
  const topBand = () => S.desks.reduce((m, d, i) => (d.owned ? i : m), 0);
  function pickPitchBand(taken) {
    const top = topBand();
    for (let k = 0; k < 8; k++) { const roll = rand(), b = roll < .5 ? top : roll < .8 ? Math.max(0, top - 1) : Math.max(0, top - 2); if (!taken.includes(b) || top === 0) return b; }
    return top;
  }
  function newOffers() { const bands = []; for (let k = 0; k < 3; k++) bands.push(pickPitchBand(bands)); return bands.map(b => genPitch(b)); }
  const pitchActive = () => RECIPES.filter(r => r.gen && !S.written[r.id]).length;
  const repitchCost = () => Math.max(cash(25), roundMoney(royBase() * 20));
  function commissionPublished(p,el) {
    ui.fresh = p.id; setTimeout(() => { if (ui.fresh === p.id) ui.fresh = null; mark(); }, 2200);
    pickAutoFocus();
    const at = el ? IMI.centerOf(el) : null; if (at) floatText('+1 COMMISSION', at[0], at[1] - 20, '#ffd23a', true);
    IMI.say(`Commissioned “${p.title}”. Find it under Pitches > Your commissions.`);
    IMI.sfx.ding(); logIt(`Commissioned a new title: “${p.title}”.`); newsPush(`Agents confirm a new pitch: “${p.title}”. Monkeys hurry to the typewriters.`); mark(); save();
    setTimeout(() => { const c = document.querySelector('#o-press .o-book.fresh'); if (c) c.scrollIntoView({ behavior: IMI.reduceMotion ? 'auto' : 'smooth', block: 'nearest' }); }, 60);
  }
  const pitchPrototype = () => gardenPrototype();
  const pitchCopy = v => JSON.parse(JSON.stringify(v));
  const pitchSame = (a,b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
  const pitchInteger = n => Number.isSafeInteger(n) && n >= 0;
  const pitchRecord = p => !!p && typeof p === 'object' && !Array.isArray(p) && typeof p.id === 'string' && /^p-[a-z0-9]+$/.test(p.id) &&
    typeof p.title === 'string' && !!p.title && typeof p.text === 'string' && !!p.text && pitchInteger(p.pay) && p.pay > 0 && p.pay % Economy.scale === 0;
  const pitchSaleShape = t => !!t && typeof t === 'object' && !Array.isArray(t) && t.version === 1 && pitchRecord(t.recipe) &&
    ['printing','imprint','previous','sequence','balance','pay','earned'].every(k => pitchInteger(t[k])) && t.pay > 0 && t.pay % Economy.scale === 0 &&
    t.sequence === t.previous + 1 && typeof t.id === 'string' && layers.epochValid(t) && t.id === layers.identityKey('pitch-sale',[t.imprint,t.printing,t.recipe.id],t) &&
    ['manual','publisher'].includes(t.origin) && Number.isFinite(t.mult) && t.mult >= .5 && t.mult <= 2 &&
    !!t.need && typeof t.need === 'object' && !Array.isArray(t.need) && !!t.bank && typeof t.bank === 'object' && !Array.isArray(t.bank) &&
    Object.keys(t.need).length > 0 && Object.entries(t.need).every(([w,n]) => /^[A-Z]+$/.test(w) && pitchInteger(n) && n > 0 && pitchInteger(t.bank[w]) && t.bank[w] >= n) &&
    Array.isArray(t.stats) && t.stats.length === 3 && pitchInteger(t.stats[0]) && pitchInteger(t.stats[1]) && Number.isFinite(t.stats[2]) && t.stats[2] >= 0 &&
    (t.previous === 0 ? t.marker === null : !!t.marker && t.marker.sequence === t.previous && typeof t.marker.id === 'string' && pitchInteger(t.marker.amount) && t.marker.amount > 0);
  function validPitch(p) {
    return p === undefined || !!p && typeof p === 'object' && !Array.isArray(p) && p.version === 1 &&
      (p.enabled === undefined || typeof p.enabled === 'boolean') &&
      (p.manual === undefined || !!p.manual && typeof p.manual === 'object' && !Array.isArray(p.manual) &&
        (p.manual.complete === undefined || typeof p.manual.complete === 'boolean') &&
        (p.manual.pending == null || layers.epochValid(p.manual.pending) && pitchRecord(p.manual.pending.recipe) && ['printing','imprint'].every(k => pitchInteger(p.manual.pending[k])))) &&
      (p.sale == null || pitchSaleShape(p.sale));
  }
  function trackedPitch(s = S) {
    const p = s.meta.automation?.pitch, m = p?.manual, record = m?.pending;
    return validPitch(p) && !m?.complete && !!record && layers.epochMatches(s,record) && record.printing === s.printing && record.imprint === layers.identity(s) &&
      !s.written[record.recipe.id] && s.pitches.filter(r => r.id === record.recipe.id).length === 1 && s.pitches.some(r => pitchSame(r,record.recipe));
  }
  function clearPitchPending(s) {
    const p = s.meta.automation?.pitch;
    if (pitchPrototype() && validPitch(p) && p?.manual?.pending && !p.sale) s.meta = {...s.meta, automation:{...s.meta.automation,
      pitch:{...p, manual:{...p.manual, pending:null}}}};
  }
  let commissionPending = null, commissionNotice = '';
  function pitchSelection() {
    const p = S.meta.productionGoal;
    if (pg && p !== undefined && !pg.valid(p)) return -1;
    if (pg?.active(pgContext) && (p.manual || !['all','pitches'].includes(p.collection)) ||
        S.focus && !S.autoFocus && !S.written[S.focus] || S.meta.folio?.working || S.meta.folio !== undefined && !folio.valid(S.meta.folio)) return -1;
    return (S.offers || []).map((p,i) => ({p,i,r:pitchRecord(p) ? buildRecipe({...p,gen:true}) : null})).filter(({p,r}) =>
      r && !S.written[p.id] && !RBY[p.id] && !S.pitches.some(x => x.id === p.id) && S.offers.filter(x => x.id === p.id).length === 1 &&
      Object.keys(r.need).every(w => S.desks[bandOf(w.length)]?.owned && !((chal('haiku') || masteryActive()) && bandOf(w.length) > 1)) &&
      marketMult(r.band) >= 1 && (!pg?.active(pgContext) || r.band === S.meta.productionGoal.band))
      .sort((a,b) => a.r.band - b.r.band || a.i - b.i)[0]?.i ?? -1;
  }
  function commission(i, origin = 'manual', el, retry = null) {
    const helper = extensions.get('automation'), refuse = error => { commissionPending = null; layerChoices.delete('pitch'); commissionNotice = error; mark(); return {ok:false,retryable:false,error}; };
    if (!challengeCommissionAllowed() || !pitchPrototype() || !writer?.owns() || !extensionAPI.automationAllowed() || !helper.validConfig(S.meta.automation) ||
        !['manual','auto'].includes(origin) || !Number.isInteger(i) || pitchActive() >= PITCH_MAX) return refuse('Commission owner, save or capacity unavailable.');
    try { layers.current(S); } catch { return refuse('Unsupported Imprint save.'); }
    if (commissionPending && commissionPending !== retry) return {ok:false,error:'Retry the waiting commission first.'};
    const p = S.offers?.[i];
    if (!pitchRecord(p) || RBY[p.id] || S.written[p.id] || S.pitches.some(x => x.id === p.id) || S.offers.filter(x => x.id === p.id).length !== 1) return refuse('Offer absent, duplicated or already registered.');
    if (origin === 'auto' && (!helper.pitchReady(!!retry) || pitchSelection() !== i)) return refuse('Auto-pitch is paused or no current offer qualifies.');
    const basis = JSON.stringify([S.offers,S.pitches,S.stats.pitched ?? 0,S.meta.automation,S.printing,layers.identity(S),layers.epochFields(S)]);
    if (retry && (retry.state !== S || retry.basis !== basis)) return refuse('Commission changed. Choose again.');
    const request = retry || {state:S,basis,i,origin,replacement:genPitch(buildRecipe(p).band)};
    if (!pitchRecord(request.replacement) || RBY[request.replacement.id] || S.offers.some(x => x.id === request.replacement.id) || S.pitches.some(x => x.id === request.replacement.id)) return refuse('Replacement identity unavailable.');
    const candidate = {...S, offers:S.offers.slice(), pitches:[...S.pitches,pitchCopy(p)], stats:{...S.stats,pitched:(S.stats.pitched || 0)+1}, meta:pitchCopy(S.meta), lastSeen:Date.now()};
    candidate.offers[i] = pitchCopy(request.replacement);
    if (origin === 'manual' && !candidate.meta.automation?.pitch?.manual?.complete && !trackedPitch()) {
      const m = candidate.meta.automation || {version:1}, cfg = m.pitch || {version:1,enabled:false};
      candidate.meta.automation = {...m,pitch:{...cfg,manual:{...cfg.manual,complete:false,pending:{...layers.epochFields(S),recipe:pitchCopy(p),printing:S.printing,imprint:layers.identity(S)}}}};
    }
    if (!writer.guard(candidate)) return refuse('Commission save guard refused.');
    const result = layerChoiceResult('pitch',Economy.saveStateAcknowledged(candidate));
    if (!result.ok) { commissionPending = request; commissionNotice = 'Commission save failed. Retry keeps the same replacement.'; mark(); return result; }
    S.offers = candidate.offers; S.pitches = candidate.pitches; S.stats = candidate.stats; S.meta = candidate.meta; S.lastSeen = candidate.lastSeen;
    registerPitch(p); commissionPending = null; commissionNotice = 'Commission saved.';
    commissionPublished(p,el); return result;
  }
  function pitchSaleValidate() {
    const p = S.meta.automation?.pitch, t = p?.sale, record = p?.manual?.pending;
    if (!challengeSaleAllowed(RBY[t?.recipe?.id] || {}) || !pitchPrototype() || !validPitch(p) || !t || !trackedPitch() || !pitchSame(t.recipe,record.recipe) ||
        !layers.epochMatches(S,t) || t.printing !== S.printing || t.imprint !== layers.identity(S) ||
        t.pay !== salePay(RBY[t.recipe.id],t.mult) || !pitchSame([RBY[t.recipe.id]?.title,RBY[t.recipe.id]?.text],[t.recipe.title,t.recipe.text]) ||
        !pitchSame(t.need,RBY[t.recipe.id]?.need) || !canWrite(RBY[t.recipe.id]) ||
        !pitchSame(t.bank,Object.fromEntries(Object.keys(t.need).map(w => [w,S.bank[w]]))) ||
        !pitchSame(t.stats,[S.stats.lump,S.stats.pitchSold || 0,S.stats.bestMult || 0]) || t.earned !== S.run.earned) throw Error('Unsupported tracked pitch sale. Save preserved.');
    const marker = bananas.acknowledgement(), paid = marker?.id === t.id && marker.sequence === t.sequence && marker.amount === t.pay;
    if (!paid && !pitchSame(marker,t.marker) || bananas.get() !== t.balance + (paid ? t.pay : 0)) throw Error('Tracked pitch wallet baseline mismatch. Save preserved.');
    return t;
  }
  function pitchSaleCommit(request) {
    if (!pitchPrototype() || !writer?.owns() || !writer.transacting() || writer.localDisposition()) return {ok:false,refused:true,error:'Tracked sale owner unavailable.'};
    try {
      let candidate, t;
      if (request.action === 'prepare') {
        const r = RBY[request.id], cfg = S.meta.automation?.pitch;
        if (!challengeSaleAllowed(r) || !trackedPitch() || cfg.sale || r?.id !== cfg.manual.pending.recipe.id || !canWrite(r) || document.hidden || IMI.screen() !== 'game' ||
            (chal('patientpress') || masteryActive()) && request.auto || request.auto && (S.focus === r.id && !S.autoFocus || !(!pg || pg.allowsSale(pgContext,r)))) throw Error('Tracked title is unavailable for visible sale.');
        pitchSampleToken = printingHelper()?.printSampleToken(true);
        const marker = bananas.acknowledgement(), previous = marker?.sequence || 0, mult = marketMult(r.band);
        t = {version:1,...layers.epochFields(S),id:layers.identityKey('pitch-sale',[layers.identity(S),S.printing,r.id],layers.epochFields(S)), recipe:pitchCopy(cfg.manual.pending.recipe), printing:S.printing,imprint:layers.identity(S),
          origin:request.auto ? 'publisher' : 'manual', previous,sequence:previous+1,marker,balance:bananas.get(),mult,pay:salePay(r,mult),need:pitchCopy(r.need),
          bank:Object.fromEntries(Object.keys(r.need).map(w => [w,S.bank[w]])),stats:[S.stats.lump,S.stats.pitchSold || 0,S.stats.bestMult || 0],earned:S.run.earned};
        if (!pitchSaleShape(t) || !pitchInteger(t.balance+t.pay) || !pitchInteger(t.stats[0]+t.pay) || !pitchInteger(t.stats[1]+1) || !pitchInteger(t.earned+t.pay)) throw Error('Tracked sale exceeds safe wallet limits.');
        candidate = {...S,meta:{...S.meta,automation:{...S.meta.automation,pitch:{...cfg,sale:t}}}};
        challengeBeforeSale(candidate,r);
      } else if (request.action === 'finish') {
        t = pitchSaleValidate();
        const marker = bananas.acknowledgement();
        if (marker?.id !== t.id || marker.sequence !== t.sequence || marker.amount !== t.pay) throw Error('Tracked sale credit is not acknowledged.');
        candidate = pitchCopy(S);
        for (const w in t.need) { candidate.bank[w] -= t.need[w]; if (candidate.bank[w] <= 0) delete candidate.bank[w]; }
        candidate.written[t.recipe.id] = true; challengeAfterSale(candidate); candidate.stats.lump += t.pay; candidate.stats.pitchSold = (candidate.stats.pitchSold || 0)+1;
        candidate.stats.bestMult = Math.max(candidate.stats.bestMult || 0,t.mult); candidate.run.earned += t.pay;
        const cfg = candidate.meta.automation.pitch;
        cfg.manual = {...cfg.manual,complete:true,pending:null,receipt:{id:t.id,sequence:t.sequence,amount:t.pay}}; cfg.sale = null;
        candidate.rewards.walletHead = {...cfg.manual.receipt,origin:'pitch-sale'};
        pg?.clearManual(candidate,t.recipe.id); if (candidate.focus === t.recipe.id) candidate.focus = null;
      } else throw Error('Unknown tracked sale command.');
      candidate.lastSeen = Date.now();
      const result = Economy.saveStateAcknowledged(candidate);
      if (result.ok) {
        if (request.action === 'prepare') { S.meta = candidate.meta; S.challenge = candidate.challenge; }
        else {
          for (const k of ['bank','written','stats','run','meta','rewards','focus','autoFocus','challenge']) S[k] = candidate[k];
          printingHelper()?.printPosting(t.pay,pitchSampleToken); pitchSampleToken = null;
          bankV++; dropCaches(); introProgress(); pickAutoFocus(); salePublished(RBY[t.recipe.id],t.pay,t.mult,null,{auto:t.origin === 'publisher'});
        }
        S.lastSeen = candidate.lastSeen; mark();
      }
      return result;
    } catch(error) { return {ok:false,refused:true,error:error.message}; }
  }
  function pitchHTML() {
    if (!S.offers || !S.offers.length) S.offers = newOffers();
    const act = pitchActive(), full = act >= PITCH_MAX || !challengeCommissionAllowed(), cost = repitchCost();
    const mine = RECIPES.filter(r => r.gen && !S.written[r.id]);
    return `<div class="o-card o-pitch"><p class="o-dim">Agents pitch endless parody titles built from words your typewriters can type. Commission one, then bank its words and write it to sell the rights. Each pitched title you sell makes the next ones pay 2% more.</p></div>
      <div class="o-card o-pitch"><div class="o-row"><h3>Your commissions</h3><span class="o-dim">${act}/${PITCH_MAX} commissions open</span></div>
      ${mine.length ? `<div class="o-grid">${mine.map(bookCard).join('')}</div>` : '<p class="o-dim">No commissions yet. Pick a pitch below; it will show up here, and in Titles under the Pitched filter.</p>'}</div>
      <div class="o-card o-pitch"><div class="o-row"><h3>New pitches</h3></div>
      <div class="o-grid">${S.offers.map((p, i) => {
        const r = buildRecipe({ ...p, gen: true }), lock = lockedDesk(r);
        return `<div class="o-card sub"><div class="o-row"><h3>${esc(p.title)}</h3><span class="o-tag b${r.band}">${DESKS[r.band].lo}–${DESKS[r.band].hi}</span></div>
          <p class="o-dim">${r.total} words · rights ${price(p.pay)}</p><p class="o-pitchtext">${esc(p.text.split('. ')[0])}…</p>
          ${lock !== undefined ? `<p class="o-warn">Needs ${DESKS[lock].name}</p>` : ''}
          <button type="button" class="o-btn sm gold" data-act="commission" data-i="${i}" ${full ? 'disabled' : ''}>${full ? 'Sell some titles first' : lock !== undefined ? 'Commission anyway' : 'Commission'}</button></div>`;
      }).join('')}</div>
      <div class="o-row o-left"><button type="button" class="o-btn sm" data-act="repitch" ${bananas.get() < cost ? 'disabled' : ''}>New pitches · ${price(cost)}</button></div></div>`;
  }

  /* ================= media divisions =================
     Each release turns a real manuscript from the Archive into a passive income stream. Every division has a quirk tied to something else in the game. */
  const DIVS = [
    { id: 'songs', shelf: 'songs', name: 'Jungle Records', unit: 'song', base: 15, cost: 120000, need: 3,
      quirk: 'Lyrics from the word bank: +1% income per 100 words banked.', mult: () => 1 + .01 * Math.floor(S.stats.words / 100),
      status: () => `Now x${(1 + .01 * Math.floor(S.stats.words / 100)).toFixed(2)} (${fmt(S.stats.words)} words banked).` },
    { id: 'tv', shelf: 'tv-shows', name: 'Canopy TV', unit: 'episode', base: 225, cost: 1.8e6, need: 6,
      quirk: 'Primetime: x1.5 income at night.', mult: () => (isNight() ? 1.5 : 1),
      status: () => (isNight() ? 'Primetime is on: x1.5.' : 'Waiting for night: x1.0.') },
    { id: 'radio', shelf: 'radio-plays', name: 'Vine Radio', unit: 'play', base: 3000, cost: 24e6, need: 9,
      quirk: 'Listeners stay in when it rains: x1.5 in rain or storms.', mult: () => (sky().wx >= 1 ? 1.5 : 1),
      status: () => (sky().wx >= 1 ? 'Rainy-day listening: x1.5.' : 'Clear skies: x1.0. Waiting for rain.') },
    { id: 'sketch', shelf: 'sketches', name: 'Monkey Business Troupe', unit: 'sketch', base: 42000, cost: 3.3e8, need: 12,
      quirk: 'Improv energy: x1.5 while a tap streak of 10 or more is running.', mult: () => (combo.n >= 10 ? 1.5 : 1),
      status: () => (combo.n >= 10 ? `Improv is on (streak x${combo.n}): x1.5.` : 'Tap the typewriter fast to get the troupe going.') },
    { id: 'film', shelf: 'films', name: 'IMI Pictures', unit: 'film', base: 6e5, cost: 4.8e9, need: 16,
      quirk: 'Premieres: every 5 minutes a film opens and pays 2 minutes of its income at once.', mult: () => 1,
      status: () => `Next premiere in ${Math.floor(Math.max(0, 300 - premiereClock) / 60)}:${String(Math.floor(Math.max(0, 300 - premiereClock) % 60)).padStart(2, '0')}.` }
  ].map(x => ({ ...x, base: cash(x.base), cost: cash(x.cost) }));
  const divCount = D => S.divs[D.id] || 0;
  const divOrder = {}, divPrefix = {};
  const totalReleased = () => DIVS.reduce((a, D) => a + divCount(D), 0);
  function buildDivOrder() {
    if (!archive) return;
    for (const D of DIVS) {
      const items = archive.filter(a => a.shelf === D.shelf);
      const avg = items.reduce((a, x) => a + x.words, 0) / Math.max(1, items.length);
      items.sort((a, b) => hashOf(a.title + D.id) - hashOf(b.title + D.id));
      divOrder[D.id] = items;
      const pre = [0]; items.forEach((x, k) => pre.push(pre[k] + Math.max(.7, Math.min(1.4, x.words / avg))));
      divPrefix[D.id] = pre;
    }
  }
  const divCap = D => (divOrder[D.id] ? divOrder[D.id].length : 600);
  const divFactor = D => { const n = Math.min(divCount(D), divCap(D)), p = divPrefix[D.id]; return p ? p[n] : n; };
  const divUnlocked = D => soldCount() >= D.need;
  const divUnit = D => D.base * (TUNE.DIV_BASE || 0.35) * D.mult();
  const divBase = () => DIVS.reduce((a, D) => a + (divCount(D) ? divUnit(D) * divFactor(D) : 0), 0) * (museOn('twain') ? 1.2 : 1) * legacyMult();
  const passive = () => (buffOn('rush') || (writer && S.rewards.activeGold?.remainingGameMs > 0) ? 7 : 1) * (buffOn('critic') ? .5 : 1);
  const divRate = () => divBase() * passive();
  let premiereClock = 0;
  function divPlan(D, want) {
    const have = bananas.get(), own = divCount(D), room = divCap(D) - own; let n = 0, cost = 0;
    while (n < want && n < room) { const c = D.cost * (TUNE.DIV_COST || 1) * Math.pow(1.15, own + n); if (want === Infinity && n > 0 && cost + c > have) break; cost += c; n++; }
    return { n, cost: roundMoney(cost) };
  }
  // A8 has one fixed command for manual and automatic catalogue releases.
  const mediaPrototype = () => gardenPrototype();
  const mediaSetting = () => ({version:1,enabled:false,manual:{complete:false},sequence:0,pending:null,...S.meta.automation?.media});
  const mediaObject = v => v !== null && typeof v === 'object' && !Array.isArray(v);
  function mediaShape(t) {
    return mediaObject(t) && t.version === 1 && ['manual','auto'].includes(t.origin) &&
      ['printing','imprint','sequence','before','quantity','cost','balance','after'].every(k => pitchInteger(t[k])) &&
      t.sequence > 0 && t.quantity > 0 && t.cost > 0 && t.cost % Economy.scale === 0 && t.balance >= t.cost &&
      t.after === t.balance - t.cost && t.balance - t.after === t.cost && DIVS.some(d => d.id === t.division) &&
      layers.epochValid(t) && t.id === layers.identityKey('media',[t.imprint,t.printing,t.sequence],t) && typeof t.config === 'string' &&
      Array.isArray(t.catalogue) && t.catalogue.length > 0 && t.catalogue.every(x => Array.isArray(x) && x.length === 2 && typeof x[0] === 'string' && Number.isFinite(x[1]) && x[1] > 0) &&
      mediaObject(t.wallet) && t.wallet.score === t.balance && t.wallet.economyVersion >= 1;
  }
  function validMedia(m) {
    return m === undefined || mediaObject(m) && m.version === 1 &&
      (m.enabled === undefined || typeof m.enabled === 'boolean') &&
      (m.manual === undefined || mediaObject(m.manual) && (m.manual.complete === undefined || typeof m.manual.complete === 'boolean')) &&
      (m.sequence === undefined || pitchInteger(m.sequence)) && (m.pending == null || mediaShape(m.pending));
  }
  const mediaConfig = cfg => JSON.stringify({...cfg,pending:null});
  const mediaCatalogue = D => divOrder[D.id]?.map(x => [x.title,x.words]);
  function mediaSelection() {
    loadArchive();
    return DIVS.map((D,index) => ({D,index,before:divCount(D),...divPlan(D,1)})).filter(q =>
      divOrder[q.D.id]?.length && divUnlocked(q.D) && q.n === 1 && pitchInteger(q.cost) && q.cost > 0 && q.cost <= bananas.get() && q.cost <= bananas.get() * .05)
      .sort((a,b) => a.before - b.before || a.index - b.index)[0];
  }
  function mediaPlan(id, quantity, origin) {
    const helper = extensions.get('automation'), cfg = mediaSetting(), D = DIVS.find(d => d.id === id);
    if (chal('paperonly') || !mediaPrototype() || !writer?.owns() || !extensionAPI.automationAllowed() || !helper.validConfig(S.meta.automation) || cfg.pending ||
        !S.intro.done || document.hidden || IMI.screen() !== 'game' || IMI.tour?.active() || document.querySelector('.o-modal, .o-celebrate, .set-pop:not([hidden])') ||
        !D || !divUnlocked(D) || !['manual','auto'].includes(origin)) throw Error('Media release is unavailable during this activity or save.');
    const imprint = layers.current(S).count;
    loadArchive();
    if (!divOrder[D.id]?.length) throw Error('Waiting for the media catalogue to load. Release again when ready.');
    if (origin === 'auto' && (!helper.mediaReady() || mediaSelection()?.D.id !== id || quantity !== 1)) throw Error('No automatic release qualifies.');
    const plan = divPlan(D,quantity), balance = bananas.get();
    const t = {version:1,...layers.epochFields(S),id:layers.identityKey('media',[imprint,S.printing,cfg.sequence+1],layers.epochFields(S)),origin,division:id,printing:S.printing,imprint,
      sequence:cfg.sequence+1,before:divCount(D),quantity:plan.n,cost:plan.cost,balance,after:balance-plan.cost,
      config:mediaConfig(cfg),catalogue:mediaCatalogue(D),wallet:JSON.parse(localStorage.getItem('imi-score'))};
    // The baseline flush below acknowledges current income before any intent is stored.
    t.wallet.score = balance;
    if (!mediaShape(t) || origin === 'auto' && t.cost > balance * .05) throw Error('Media quote is unaffordable or cannot be represented safely.');
    return t;
  }
  function mediaValidate(t = S.meta.automation?.media?.pending, prepared = true) {
    const cfg = mediaSetting(), D = DIVS.find(d => d.id === t?.division);
    if (chal('paperonly') || !mediaPrototype() || !validMedia(S.meta.automation?.media) || !mediaShape(t) ||
        !extensions.get('automation').validConfig(S.meta.automation) || !layers.epochMatches(S,t) || t.printing !== S.printing || t.imprint !== layers.current(S).count ||
        t.sequence !== cfg.sequence + 1 || t.config !== mediaConfig(cfg) || divCount(D) !== t.before || !divUnlocked(D) ||
        prepared && !pitchSame(t,cfg.pending) || !prepared && cfg.pending) throw Error('Unsupported or stale media release. Save preserved.');
    loadArchive();
    if (!divOrder[D.id]) throw Error('Waiting for the frozen media catalogue. Retry when loaded.');
    const q = divPlan(D,t.quantity);
    if (!pitchSame(t.catalogue,mediaCatalogue(D)) || q.n !== t.quantity || q.cost !== t.cost ||
        t.origin === 'auto' && (!cfg.enabled || !cfg.manual?.complete || t.imprint < 3 || t.quantity !== 1 || t.cost > t.balance * .05)) throw Error('Media catalogue, configuration or quote mismatch. Save preserved.');
    const wallet = JSON.parse(localStorage.getItem('imi-score'));
    if (!pitchSame({...wallet,score:t.balance},t.wallet) || !pitchSame(bananas.acknowledgement(),t.wallet.rewardMarker ?? null) ||
        ![t.balance,t.after].includes(bananas.get()) || wallet.score !== bananas.get() || !prepared && bananas.get() !== t.balance) throw Error('Media wallet baseline mismatch. Save preserved.');
    return t;
  }
  function mediaCommit(request) {
    if (!mediaPrototype() || !writer?.owns() || !writer.transacting() || writer.localDisposition()) return {ok:false,refused:true,error:'Media save owner unavailable.'};
    try {
      const t = mediaValidate(request.action === 'prepare' ? request.intent : undefined,request.action !== 'prepare');
      if (!['prepare','finish'].includes(request.action)) throw Error('Unknown media command.');
      const candidate = pitchCopy(S), cfg = mediaSetting();
      candidate.meta.automation = {...candidate.meta.automation,version:1,media:{...cfg,pending:pitchCopy(t)}};
      if (request.action === 'finish') {
        if (bananas.get() !== t.after) throw Error('Media debit is not acknowledged.');
        candidate.divs[t.division] = t.before + t.quantity;
        candidate.meta.automation.media = {...cfg,sequence:t.sequence,pending:null,
          manual:{...cfg.manual,complete:!!cfg.manual?.complete || t.origin === 'manual'}};
      }
      candidate.lastSeen = Date.now();
      const result = Economy.saveStateAcknowledged(candidate);
      if (result.ok) {
        S.meta = candidate.meta; S.lastSeen = candidate.lastSeen;
        if (request.action === 'finish') { S.divs = candidate.divs; releasePublished(DIVS.find(d => d.id === t.division),t.before,t.quantity); }
        mark();
      }
      return result;
    } catch(error) { return {ok:false,refused:true,error:error.message}; }
  }
  function releaseDiv(id) {
    if (chal('paperonly')) return {ok:false,error:'Media releases are blocked by Paper only.'};
    if (mediaPrototype()) { const result = writer.mediaRelease({...layers.epochFields(S),division:id,quantity:buyWant(),origin:'manual'}); if (!result.ok) IMI.say(result.error); return result; }
    const D = DIVS.find(x => x.id === id); if (!D || !divUnlocked(D)) return;
    loadArchive();
    const plan = divPlan(D, buyWant()); if (plan.n <= 0 || !bananas.spend(plan.cost)) return;
    const before = divCount(D); S.divs[D.id] = before + plan.n;
    releasePublished(D,before,plan.n); mark(); save();
  }
  function releasePublished(D,before,quantity) {
    const plan = {n:quantity};
    const ord = divOrder[D.id], last = ord && ord[Math.min(before + plan.n, ord.length) - 1];
    logIt(`${D.name} released ${plan.n > 1 ? plan.n + ' ' + D.unit + 's' : (/^[aeiou]/.test(D.unit) ? 'an ' : 'a ') + D.unit}${last ? `, latest: “${last.title}”` : ''}.`);
    newsPush(last ? `NEW RELEASE from ${D.name}: “${last.title}”. Critics are baffled; the monkeys are delighted.` : `${D.name} releases ${plan.n} new ${D.unit}${plan.n > 1 ? 's' : ''}.`);
    IMI.sfx.ding(); vib(25);
    const btn = $(`.o-btn[data-act="release"][data-id="${D.id}"]`);
    if (btn) { const [x, y] = IMI.centerOf(btn); IMI.burst(x, y, ['star', 'spark', 'banana'], 12); shock(x, y, '#ffd23a'); if (last) floatText('NEW: ' + last.title, x, y - 50, '#fff6d6'); const card = btn.closest('.o-card'); if (card && !IMI.reduceMotion) card.animate([{ transform: 'none' }, { transform: 'translateY(-6px) scale(1.02)' }, { transform: 'none' }], { duration: 320, easing: PX ? 'steps(4)' : 'ease-out' }); }
    mark();
  }
  function premiere() {
    const F = DIVS[4]; if (!divCount(F)) return;
    const lump = roundMoney(divUnit(F) * divFactor(F) * passive() * 120); S.divTotal += lump;
    const sample = printingHelper()?.printSampleToken(), balance = bananas.get();
    bananas.earn(lump); printingHelper()?.printPosting(bananas.get() - balance,sample); floatText(`PREMIERE! +${fmtBig(lump)}`, innerWidth / 2, 190, '#ffd23a', true);
    const ord = divOrder[F.id], pick1 = ord && ord[Math.floor(rand() * Math.min(ord.length, divCount(F)))];
    newsPush(pick1 ? `PREMIERE: “${pick1.title}” opens to a standing ovation from three monkeys and a pigeon.` : 'PREMIERE: a new IMI Picture opens to a standing ovation.');
    IMI.sfx.ding(); mark();
  }
  function renderStudios() {
    loadArchive();
    const want = buyWant(), total = totalReleased(), pool = archive ? archive.filter(a => a.shelf !== 'stories').length : 3000;
    const cards = DIVS.map(D => {
      if (!divUnlocked(D)) return `<div class="o-card locked"><h3>${D.name}</h3><p class="o-dim">Locked: sell ${D.need} titles (you have ${soldCount()}).</p><p class="o-dim">${D.quirk}</p></div>`;
      const n = divCount(D), plan = divPlan(D, want), unit = divUnit(D), ord = divOrder[D.id], full = n >= divCap(D);
      const recent = ord ? ord.slice(Math.max(0, Math.min(n, ord.length) - 3), Math.min(n, ord.length)).reverse().map(x => `<span class="o-chip">${esc(x.title)}</span>`).join('') : '';
      return `<div class="o-card o-div${n ? ' live' : ''}"><div class="o-row"><h3><i class="o-emb e-${D.id}" aria-hidden="true"><b></b><b></b><b></b><b></b></i>${D.name}</h3><span class="o-lvl">${n}/${divCap(D)}</span></div>
        <p>${fmtRate(unit)}/s per release now · total <b>${fmtRate(unit * divFactor(D) * passive())}/s</b></p>
        <p class="o-quirk">${D.quirk}</p><p class="o-dim">${D.status()}</p>
        ${recent ? `<div class="o-chips">${recent}</div>` : ''}
        <button type="button" class="o-btn gold" data-act="release" data-id="${D.id}" ${chal('paperonly') || full || bananas.get() < plan.cost ? 'disabled' : ''}>${full ? 'Catalogue complete' : `${plan.n > 1 ? `Release x${plan.n}` : `Release ${/^[aeiou]/.test(D.unit) ? 'an' : 'a'} ${D.unit}`} · ${price(plan.cost)}`}</button></div>`;
    }).join('');
    morph($('#o-studios'), `
      <p class="o-lede">Media turns your Archive into passive income. Each release picks a real manuscript from the monkey library and earns bananas every second; longer manuscripts earn a little more. Selling titles unlocks new divisions.</p>
      <div class="o-row o-left"><span>Division income <b>${fmtRate(divRate())}/s</b> · ${fmt(total)} of ${fmt(pool)} manuscripts released</span></div>
      <div class="o-row o-left"><span class="o-dim">Release</span><span class="o-seg">${[1, 10, 100, 'max'].map(n => `<button type="button" data-act="buyn" data-n="${n}" aria-pressed="${String(ui.buyN) === String(n)}">${n === 'max' ? 'Max' : 'x' + n}</button>`).join('')}</span></div>
      <div class="o-grid">${cards}</div>`);
    hydrate($('#o-studios'));
  }

  /* ================= muses: literary patrons seated in up to three slots ================= */
  const MUSES = [
    { id: 'seuss', name: 'Dr. Zoos', cost: 8000, desc: 'Titles in the two shortest bands (2-5 letters) sell for 20% more.' },
    { id: 'poe', name: 'Edgar Allan Chimp', cost: 15000, desc: 'Typists work 25% faster at night.' },
    { id: 'dick', name: 'Emily Dickinsimian', cost: 20000, desc: 'Every typist leans toward vowels after a consonant.' },
    { id: 'hemi', name: 'Ernest Hemingwape', cost: 30000, desc: 'Word keepers bank twice as fast.' },
    { id: 'christie', name: 'Agatha Chrisbanana', cost: 40000, desc: 'Golden bananas show up 30% sooner.' },
    { id: 'woolf', name: 'Virginia Woolfkin', cost: 60000, desc: 'Away work is 15 points more efficient.' },
    { id: 'austen', name: 'Jane Apesten', cost: 120000, desc: 'Royalties +25%.' },
    { id: 'tolken', name: 'J.R.R. Tolkong', cost: 200000, desc: 'Titles in the 8-13 letter bands sell for 25% more.' },
    { id: 'twain', name: 'Mark Twainana', cost: 500000, desc: 'Division income +20%.' }
  ].map(x => ({ ...x, cost: cash(x.cost) }));
  const museSlots = () => (soldCount() >= 13 ? 3 : soldCount() >= 8 ? 2 : soldCount() >= 3 ? 1 : 0);
  const museOn = id => { const seat = S.muses.seated, n = museSlots(); for (let i = 0; i < n; i++) if (seat[i] === id) return true; return false; };
  const museSale = (band, on = museOn) => (on('seuss') && band <= 1 ? 1.2 : 1) * (on('tolken') && band >= 3 ? 1.25 : 1);
  // A9 seats have no payment: one detached Ops acknowledgement publishes the whole choice.
  let musePending = null;
  const museSame = (a,b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
  function clearMuseIncomplete(s) {
    const a = s.meta.automation, m = a?.muse;
    if (!gardenPrototype() || !extensions.get('automation')?.validMuse(m) || !m?.manual || m.manual.complete) return;
    s.meta = {...s.meta, automation:{...a, muse:{...m, manual:{...m.manual, ids:[], complete:false, ...layers.epochFields(s), imprint:layers.identity(s), printing:s.printing}}}};
  }
  function museContext() {
    const manual = pg?.active(pgContext) ? S.meta.productionGoal.manual : !S.autoFocus ? S.focus : null;
    const selected = manual && !S.written[manual] ? manual : null;
    const titles = RECIPES.filter(r => !S.written[r.id] && inPlay(r) &&
      Object.entries(r.need).every(([w,n]) => S.desks[bandOf(w.length)].owned && !((chal('haiku') || masteryActive()) && bandOf(w.length) > 1) && stock(w) >= n) &&
      (selected ? r.id === selected : !pg || pg.allowsSale(pgContext,r)));
    const quote = saleContext();
    quote.state = {meta:{layers:S.meta.layers === undefined ? undefined : JSON.parse(JSON.stringify(S.meta.layers))}};
    return {titles:titles.map(r => ({id:r.id,band:r.band,pay:r.pay})), quote, markets:S.market.v.map((_,b) => marketMult(b)),
      night:!!sky().night, productive:S.desks.some(d => d.owned && autoRate(d) > 0), slots:museSlots(),
      owned:MUSES.filter(m => S.muses.owned[m.id]).map(m => m.id), paused:!!folioGoal()};
  }
  function museScore(seats,c) {
    const on = id => seats.slice(0,c.slots).includes(id);
    let q = 0;
    for (const r of c.titles) q = Math.max(q,salePay(r,c.markets[r.band],on,c.quote));
    return [q,c.night && c.productive && on('poe') ? 1.25 : 1];
  }
  const museBetter = (a,b) => a[0] > b[0] || a[0] === b[0] && a[1] > b[1];
  function museSelection() {
    const c = museContext(), seats = S.muses.seated;
    let score = museScore(seats,c), best = null;
    if (c.paused) return null;
    for (let slot = 0; slot < c.slots; slot++) for (const id of c.owned) {
      if (seats.includes(id)) continue;
      const next = seats.slice(); next[slot] = id;
      const value = museScore(next,c);
      if (museBetter(value,score)) { score = value; best = {slot,id,score:value,context:JSON.stringify(c)}; }
    }
    return best;
  }
  function seatMuse(slot,id,origin = 'manual') {
    const p = {slot,id,origin,state:S,...layers.epochFields(S),printing:S.printing,imprint:layers.identity(S),
      seats:S.muses.seated.slice(), config:JSON.stringify(S.meta.automation ?? null)};
    if (origin === 'auto') { const q = museSelection(); if (!q || q.slot !== slot || q.id !== id) return {ok:false,retryable:false,error:'No better seating choice'}; p.context = q.context; }
    return commitMuse(p);
  }
  function commitMuse(p) {
    const helper = extensions.get('automation');
    const refuse = error => { musePending = null; layerChoices.delete('muse'); mark(); return {ok:false,retryable:false,error}; };
    if (challengeSeatsLocked() || !p || !gardenPrototype() || !writer?.owns() || !extensionAPI.automationAllowed() || !helper.validConfig(S.meta.automation)) return refuse('Muse save owner unavailable');
    if (!['manual','auto'].includes(p.origin) || p.state !== S || !layers.epochMatches(S,p) || p.printing !== S.printing || p.imprint !== layers.identity(S) ||
        p.config !== JSON.stringify(S.meta.automation ?? null) || !museSame(p.seats,S.muses.seated) ||
        !Number.isInteger(p.slot) || p.slot < 0 || p.slot >= museSlots() ||
        p.id !== null && (!MUSES.some(m => m.id === p.id) || !S.muses.owned[p.id]) || p.seats[p.slot] === p.id) return refuse('Seating changed. Choose again.');
    try { layers.current(S); } catch { return refuse('Unsupported Imprint save'); }
    if (p.origin === 'auto') {
      if (!helper.museReady(p)) return refuse('Muse director is paused or locked');
      const q = museSelection();
      if (!q || q.slot !== p.slot || q.id !== p.id || q.context !== p.context) return refuse('Sale or night choice changed. Wait for a new attempt.');
    } else if (!helper.museActive()) return refuse('Manual seating is paused');
    const seats = p.seats.slice(), old = p.id === null ? -1 : seats.indexOf(p.id);
    if (old >= 0) seats[old] = null;
    seats[p.slot] = p.id;
    if (new Set(seats.filter(Boolean)).size !== seats.filter(Boolean).length) return refuse('Duplicate Muse seats');
    if (p.origin === 'manual') helper.museSuspend();
    const candidate = {...S, muses:{...S.muses,seated:seats}, meta:{...S.meta}, lastSeen:S.rewards.awayCheckpoint ? S.lastSeen : Date.now()};
    helper.museEvidence(candidate,p,old < 0);
    if (!writer.guard(candidate)) return refuse('Muse save guard refused the choice');
    const result = layerChoiceResult('muse',Economy.saveStateAcknowledged(candidate));
    musePending = result.ok ? null : p;
    if (result.ok) { S.muses = candidate.muses; S.meta = candidate.meta; S.lastSeen = candidate.lastSeen; IMI.sfx[p.id === null ? 'tick' : 'ding'](); }
    helper.museResult(result); mark(); return result;
  }
  /* every muse sits for a portrait: a pixel monkey in their signature hat, in a gilt frame */
  const MUSE_LOOK = { seuss: [3, '#ff5d73'], poe: [0, '#3a2a5a'], dick: [7, '#f08aa4'], hemi: [6, '#5fa8f0'], christie: [2, '#b58cf0'], woolf: [8, '#78d9a0'], austen: [4, '#f2b23a'], tolken: [5, '#9a6a3a'], twain: [2, '#dfe3f2'] };
  const museArt = {};
  function portrait(id, owned) {
    const [hat, bg] = MUSE_LOOK[id] || [0, '#3a2a10'];
    let art;
    if (PX) art = `<img alt="" src="${museArt[id] || (museArt[id] = PXA.monkeyFrame('desk', 'normal', 0, false, 0, hat).cv.toDataURL())}">`;
    else art = `<span class="o-pt-mk">🐒</span>${hat ? `<span class="o-pt-hat">${(hatById(hat) || {}).emoji || ''}</span>` : ''}`;
    return `<span class="o-portrait${owned ? '' : ' veiled'}" style="--mc:${bg}" aria-hidden="true">${art}</span>`;
  }
  function renderMuses() {
    const slots = museSlots(), M = S.muses, have = bananas.get();
    const seatedCards = [0, 1, 2].map(k => {
      const id = M.seated[k], mu = MUSES.find(x => x.id === id);
      if (k >= slots) return `<div class="o-card locked"><h3>Slot ${k + 1}</h3><p class="o-dim">Locked: sell ${[3, 8, 13][k]} titles (you have ${soldCount()}).</p></div>`;
      return mu ? `<div class="o-card o-pcard o-seat on">${portrait(mu.id, true)}<div class="o-row"><h3>${mu.name}</h3><span class="o-lvl">SLOT ${k + 1}</span></div><p>${mu.desc}</p><button type="button" class="o-btn sm" data-act="museout" data-slot="${k}" ${challengeSeatsLocked() ? 'disabled' : ''}>Send home</button></div>`
        : `<div class="o-card o-seat"><h3>Slot ${k + 1}</h3><p class="o-dim">Empty. Seat a patron below.</p></div>`;
    }).join('');
    const cards = MUSES.map(mu => {
      const owned = !!M.owned[mu.id], seated = M.seated.includes(mu.id);
      const seatBtns = owned && !seated ? [0, 1, 2].filter(k => k < slots).map(k => `<button type="button" class="o-btn sm" data-act="museseat" data-id="${mu.id}" data-slot="${k}" ${challengeSeatsLocked() ? 'disabled' : ''}>${M.seated[k] ? 'Swap into' : 'Seat in'} slot ${k + 1}</button>`).join('') : '';
      return `<div class="o-card o-pcard o-muse">${portrait(mu.id, owned)}<div class="o-row"><h3>${mu.name}</h3>${owned ? `<span class="o-lvl">${seated ? 'SEATED' : 'INVITED'}</span>` : price(mu.cost)}</div><p>${mu.desc}</p>
        ${owned ? (seatBtns || (seated ? '' : '<p class="o-dim">Unlock a slot by selling more titles.</p>')) : `<button type="button" class="o-btn gold" data-act="museinvite" data-id="${mu.id}" ${have < mu.cost ? 'disabled' : ''}>Invite</button>`}</div>`;
    }).join('');
    morph($('#o-muses'), `
      <p class="o-lede">Muses are literary patrons. Invite a Muse once, then seat up to three of them (slots open as you sell titles) and swap them whenever you like. A seated Muse works for you passively.</p>
      ${chal('fixedcast') ? `<p role="status">${chProgress()}</p>` : ''}
      <h3 class="o-h">Seated (${M.seated.slice(0, slots).filter(Boolean).length}/${slots})</h3><div class="o-grid">${seatedCards}</div>
      <h3 class="o-h">The guest list</h3><div class="o-grid">${cards}</div>`);
    hydrate($('#o-muses'));
  }

  /* ================= letter garden: grow the exact letters you need ================= */
  const GARDEN_COSTS = [1500, 6000, 25000, 100000].map(cash);                 // plots 3 to 6
  const GARDEN_SLOW = [1, 2, 5, 12, 30, 80];                        // higher desks grow slower, like their typists
  const gardenTime = (ch, desk) => Math.round((30 + (12 - FREQ[ch]) * 8) * GARDEN_SLOW[desk == null ? S.sel : desk]);   // seconds: rare letters take longer
  const fmtSecs = n => (n >= 3600 ? `${Math.floor(n / 3600)}h ${Math.round(n % 3600 / 60)}m` : n >= 120 ? `${Math.round(n / 60)}m` : `${n}s`);
  const gardenYield = ch => Math.round(6 + (12 - FREQ[ch]) * 1.2);  // ...and give more
  const gardenPrototype = () => new URLSearchParams(location.search).get('lg03') === '1' && !!layers?.enabled;
  const cropFor = (ch, desk) => ({ ch, desk, ready:savedWallNow() + gardenTime(ch, desk) * 1000 });
  function grantCrop(state, i) {
    const b = state.garden.beds[i], d = state.desks[b.desk] || state.desks[state.sel], y = gardenYield(b.ch);
    d.letters[b.ch] = (d.letters[b.ch] || 0) + y; for (let k = 0; k < Math.min(y, 8); k++) d.tray.push(b.ch); if (d.tray.length > 80) d.tray.splice(0, d.tray.length - 80);
    state.stats.harvested = (state.stats.harvested || 0) + y; state.garden.beds[i] = null; return y;
  }
  function gardenRequest(action, indices, ch, desk, origin) {
    return {action, indices, ch, desk, origin, state:S, ...layers.epochFields(S), printing:S.printing, imprint:layers.identity(S),
      crops:indices.map(i => S.garden.beds[i]),
      identities:indices.map(i => { const b = S.garden.beds[i]; return b ? [b.ch,b.desk,b.gardenToken ?? null] : null; }),
      config:origin === 'auto' ? JSON.stringify(S.meta.automation.garden) : null};
  }
  function commitGarden(p) {
    const helper = extensions.get('automation');
    const refuse = error => { layerChoices.delete('garden'); return {ok:false, retryable:false, error}; };
    if (chal('handplanted') && p.origin === 'auto' || !gardenPrototype() || !writer?.owns() || !extensionAPI.automationAllowed()) return refuse('Garden save owner unavailable');
    if (!helper?.validConfig(S.meta.automation) || !['manual','auto'].includes(p.origin) ||
        !['plant','harvest'].includes(p.action) || p.state !== S || !layers.epochMatches(S,p) || p.printing !== S.printing || p.imprint !== layers.identity(S)) return refuse('Garden action changed');
    try { layers.current(S); } catch { return refuse('Unsupported Imprint save'); }
    if (p.origin === 'auto' && !helper.gardenReady(p)) return refuse('Auto-garden is paused or locked');
    if (!p.indices.length || new Set(p.indices).size !== p.indices.length || p.indices.some((i,n) =>
        !Number.isInteger(i) || i < 0 || i >= S.garden.beds.length || S.garden.beds[i] !== p.crops[n] || JSON.stringify(p.identities[n]) !== JSON.stringify(S.garden.beds[i] ? [S.garden.beds[i].ch,S.garden.beds[i].desk,S.garden.beds[i].gardenToken ?? null] : null))) return refuse('Crop changed. Choose the action again.');
    if (p.action === 'plant' && (p.indices.length !== 1 || p.crops[0] || !FREQ[p.ch] || !Number.isInteger(p.desk) || !S.desks[p.desk]?.owned || !Number.isFinite(gardenTime(p.ch,p.desk)))) return refuse('Planting target unavailable');
    if (p.action === 'harvest' && p.crops.some(b => !b || !FREQ[b.ch] || !S.desks[b.desk]?.owned || !Number.isFinite(b.ready) || savedWallNow() < b.ready)) return refuse('Crop is absent, unripe or its desk is unavailable');
    const affected = new Set(p.action === 'harvest' ? p.crops.map(b => b.desk) : []);
    const candidate = {...S, garden:{...S.garden, beds:S.garden.beds.slice()}, stats:{...S.stats},
      desks:S.desks.map((d,i) => affected.has(i) ? {...d, letters:{...d.letters}, tray:d.tray.slice()} : d), meta:{...S.meta},
      lastSeen:S.rewards.awayCheckpoint ? S.lastSeen : Date.now()};
    let amount = 0;
    if (p.action === 'plant') {
      const crop = cropFor(p.ch,p.desk);
      if (p.origin === 'manual') crop.gardenToken = crypto.randomUUID();
      candidate.garden.beds[p.indices[0]] = crop;
    } else for (const i of p.indices) amount += grantCrop(candidate,i);
    helper.gardenEvidence(candidate,p);
    if (!writer.guard(candidate)) return refuse('Garden save guard refused the candidate');
    const result = layerChoiceResult('garden', Economy.saveStateAcknowledged(candidate));
    if (result.ok) {
      S.garden = candidate.garden; S.stats = candidate.stats; S.meta = candidate.meta; S.lastSeen = candidate.lastSeen;
      for (const i of affected) { S.desks[i].letters = candidate.desks[i].letters; S.desks[i].tray = candidate.desks[i].tray; }
      if (p.action === 'plant' && p.origin === 'manual') IMI.sfx.tick();
      mark();
    }
    return {...result, amount:result.ok ? amount : 0};
  }
  function plant(i, ch, desk = S.sel, origin = 'manual') {
    if (chal('handplanted') && origin === 'auto') return {ok:false,retryable:false,error:'Garden by hand during Hand-planted.'};
    if (gardenPrototype()) return extensions.get('automation')?.gardenAction(gardenRequest('plant',[i],ch,desk,origin));
    const g = S.garden; if (g.beds[i] || !FREQ[ch]) return;
    if (writer?.localDisposition()) return;
    g.beds[i] = cropFor(ch, S.sel); IMI.sfx.tick(); mark(); save();
  }
  function harvest(i, origin = 'manual') {
    if (chal('handplanted') && origin === 'auto') return 0;
    if (gardenPrototype()) return extensions.get('automation')?.gardenAction(gardenRequest('harvest',[i],null,null,origin)).amount || 0;
    const g = S.garden, b = g.beds[i]; if (writer?.localDisposition() || !b || savedWallNow() < b.ready) return 0;
    return grantCrop(S,i);
  }
  function gardenHTML() {
    const g = S.garden, D = DESKS[S.sel], need = focusNeeds(cur(), S.sel).missing, now = savedWallNow();
    const seeds = Object.keys(FREQ).sort().map(ch => `<button type="button" class="o-seed${ui.seed === ch ? ' on' : ''}${need[ch] ? ' need' : ''}" data-act="seed" data-ch="${ch}" aria-label="Seed ${ch}">${ch}</button>`).join('');
    const plots = g.beds.map((b, i) => {
      if (!b) return `<button type="button" class="o-plot empty" data-act="plant" data-i="${i}"><span class="o-pl-ch">+</span><small>Plant ${ui.seed}</small></button>`;
      const left = Math.max(0, Math.ceil((b.ready - now) / 1000)), total = gardenTime(b.ch, b.desk), pct = Math.min(100, Math.round(100 * (1 - (b.ready - now) / (total * 1000))));
      if (left <= 0) return `<button type="button" class="o-plot ripe" data-act="harvest" data-i="${i}"><span class="o-pl-ch">${b.ch}</span><small>Harvest +${gardenYield(b.ch)}</small></button>`;
      return `<div class="o-plot grow"><span class="o-pl-ch">${b.ch}</span><span class="o-prog" role="img" aria-label="${pct}% grown"><i style="width:${pct}%"></i></span><small>${fmtSecs(left)} · for ${DESKS[b.desk] ? DESKS[b.desk].name.split(' ')[0] : ''}</small></div>`;
    }).join('');
    const ripe = g.beds.filter(b => b && now >= b.ready).length;
    return `<div class="o-card o-garden"><div class="o-row"><h3>Letter garden</h3><span class="o-dim">${g.beds.length} plots · harvests go to ${D.name}</span></div>
      <p class="o-dim">Pick a letter, then tap an empty plot. Rare letters take longer but yield more. Gold keys are needed by the title ${D.name.split(' ')[0]} is focused on.</p>
      <div class="o-seeds">${seeds}</div>
      <p class="o-dim">${ui.seed}: grows in ${fmtSecs(gardenTime(ui.seed))}, yields ${gardenYield(ui.seed)} letters.</p>
      <div class="o-plots">${plots}</div>
      <div class="o-row o-left"><button type="button" class="o-btn sm gold" data-act="harvestall" ${ripe ? '' : 'disabled'}>Harvest all ripe${ripe ? ' (' + ripe + ')' : ''}</button></div></div>`;
  }

  /* ================= second printing (prestige) + oulipo challenges =================
     Retire the room, keep the shelf as earlier editions, and print again. Legacy stars make every printing stronger.
     Before printing you may pick an Oulipo constraint for the new run; finishing it pays stars and a permanent perk. */
  const LEG = [
    { id: 'seed', name: 'Seed Money', max: 3, costs: [1, 3, 8], desc: `Start each printing with ${[1000, 10000, 100000].map(n => fmt(cash(n))).join(' / ')} bananas.` },
    { id: 'crew', name: 'Veteran Crew', max: 1, costs: [2], desc: 'Start each printing with Hold to type and two typists on Bamboo.' },
    { id: 'speed', name: 'Printing Press', max: 5, costs: [2, 4, 6, 8, 10], desc: 'All typists work 10% faster per level.' },
    { id: 'sales', name: 'Prestige Imprint', max: 5, costs: [3, 5, 7, 9, 11], desc: 'All banana income (sales, royalties, divisions) +10% per level.' },
    { id: 'golden', name: 'Golden Touch', max: 3, costs: [2, 4, 6], desc: 'Golden bananas show up 25% more often per level.' }
  ];
  const CHALLENGES = [
    { id: 'vowel', name: 'Vowel Drought', stars: 3, goalN: 6, desc: 'Vowels are 65% rarer and vowel boosts are off. Sell 6 titles.', perk: 'Typists work 5% faster, forever.' },
    { id: 'haiku', name: 'Haiku Run', stars: 4, goalN: 10, desc: 'Only Bamboo and Hibiscus may be bought. Sell 10 titles.', perk: 'Restorations cost 20% less, forever.' },
    { id: 'hands', name: 'No Hands', stars: 4, goalN: 8, desc: 'Tapping and holding are disabled; only the typists type. Sell 8 titles.', perk: 'Typists work 10% faster, forever.' },
    { id: 'timed', name: 'Deadline', stars: 5, goalN: 8, minutes: 20, desc: 'Sell 8 titles within 20 minutes.', perk: 'Golden banana "Lucky" bonuses are 25% bigger, forever.' },
    { id: 'smallcrew', name: 'Small Crew', stars: 0, goalN: 6, helper: 'hire', desc: 'At most 2 typists per owned desk. Sell 6 progression titles.', perk: 'Auto-hire level at least 1, retaining higher levels and its base unlock.' },
    { id: 'quietshop', name: 'Quiet Shop', stars: 0, goalN: 6, helper: 'shop', desc: 'Hold to type, Writing contracts, Paw metronome, Double touch, Literary agent and Market analyst cannot be acquired or take effect, including Veteran Crew Hold. Sell 6 progression titles.', perk: 'Auto-shop level at least 1, retaining higher levels and its base unlock.' },
    { id: 'patientpress', name: 'Patient Press', stars: 0, goalN: 8, helper: 'coach', desc: 'Publisher purchases and automatic sales are disabled. Sell 8 progression titles manually.', perk: 'Auto-coach level at least 1, retaining higher levels and its base unlock.' },
    { id: 'baremetal', name: 'Bare Metal', stars: 0, goalN: 8, helper: 'restore', desc: 'No Mk II or Mk III restorations. New desks remain available. Sell 8 progression titles.', perk: 'Auto-restore level at least 1, retaining higher levels and its base unlock.' },
    { id: 'handplanted', name: 'Hand-planted', stars: 0, goalN: 6, helper: 'garden', imprint: true, desc: 'Automatic planting, harvesting and replanting are disabled. Garden by hand. Sell 6 progression titles.', perk: 'Auto-garden attempts every 45 active game seconds after its usual unlock.' },
    { id: 'onebrief', name: 'One brief', stars: 0, goalN: 8, helper: 'pitch', imprint: true, desc: 'Clear inherited commissions down to one unsold title first; clearance sales do not count. Then sell 8 more progression titles. Commission only with no unsold pitches. High-band titles may need desks reopened; there is no time limit.', perk: 'Auto-pitch attempts every 45 active game seconds after its usual unlock.' },
    { id: 'paperonly', name: 'Paper only', stars: 0, goalN: 8, helper: 'media', imprint: true, desc: 'No media releases of any quantity. Existing passive income remains. Sell 8 progression titles.', perk: 'Auto-media attempts every 45 active game seconds after its usual unlock.' },
    { id: 'fixedcast', name: 'Fixed cast', stars: 0, goalN: 8, helper: 'muse', imprint: true, desc: 'Sell 3 progression titles, then seat an invited Muse before sale 4. That sale locks every seat through sale 8, including newly opened seats. Invitations keep their ordinary cost.', perk: 'Muse director attempts every 45 active game seconds after its usual unlock.' }
  ];
  const legLvl = id => S.legacy.ups[id] || 0;
  const legacyMult = () => (1 + .02 * S.legacy.total) * (1 + .1 * legLvl('sales'));
  const editionMult = () => 1 + .35 * S.printing;
  const chal = id => !!S.challenge && S.challenge.id === id;
  const chDef = id => CHALLENGES.find(c => c.id === id);
  const challengePrototype = new URLSearchParams(location.search).get('lg03') === '1';
  const challengeCatalog = () => CHALLENGES.filter(c => !c.helper || challengePrototype || S.chDone[c.id] || chal(c.id));
  const challengeSelectable = c => c.imprint ? gardenPrototype() && validChallengeImprint() && S.printing >= 4 && S.intro.done && !!writer?.owns() :
    !c.helper || challengePrototype && S.printing >= 4 && S.intro.done && !!writer?.owns();
  const validChallengeImprint = () => { try { return layers.current(S).count >= 1; } catch { return false; } };
  const imprintChallenge = (s = S) => !!chDef(s.challenge?.id)?.imprint;
  const challengeCount = s => Object.keys(s.written).filter(id => RBY[id] && !RBY[id].kid && !RBY[id].lib).length;
  const challengeBacklog = s => RECIPES.filter(r => r.gen && !s.written[r.id]).length;
  function challengeRun(s = S) {
    const r = s.challenge?.imprintRun;
    if (!r || r.version !== 1 || !layers.epochMatches(s,r) || r.printing !== s.printing || r.imprint !== layers.identity(s)) return null;
    if (s.challenge.id === 'onebrief' && (!['clearance','goal'].includes(r.phase) ||
        !Number.isSafeInteger(r.baseline) || r.baseline < 0 || r.baseline > challengeCount(s))) return null;
    if (s.challenge.id === 'fixedcast' && challengeCount(s) >= 4 && r.seats == null) return null;
    if (s.challenge.id === 'fixedcast' && r.seats != null && (!Array.isArray(r.seats) || r.seats.length !== 3 ||
        !museSame(r.seats,s.muses.seated) || new Set(r.seats.filter(Boolean)).size !== r.seats.filter(Boolean).length ||
        !r.seats.some((id,i) => i < 1 && MUSES.some(m => m.id === id) && s.muses.owned[id]) ||
        r.seats.some(id => id !== null && (!MUSES.some(m => m.id === id) || !s.muses.owned[id])))) return null;
    return r;
  }
  const challengeSales = () => !chal('onebrief') ? soldCount() : challengeRun()?.phase === 'goal' ? Math.max(0,soldCount() - challengeRun().baseline) : 0;
  const challengeCommissionAllowed = () => !chal('onebrief') || challengeRun()?.phase === 'goal' && pitchActive() === 0;
  const challengeSeatsLocked = () => chal('fixedcast') && (!challengeRun() || challengeRun().seats != null || soldCount() >= 4);
  function challengeSaleAllowed(r, s = S) {
    if (!r) return false;
    if (!imprintChallenge(s) || r.kid || r.lib) return true;
    const run = challengeRun(s);
    if (!run) return false;
    if (s.challenge.id !== 'fixedcast') return true;
    const n = challengeCount(s);
    return run.seats != null || n < 3 || n === 3 && !musePending && !layerChoices.size &&
      s.muses.seated.some((id,i) => i < 1 && MUSES.some(m => m.id === id) && s.muses.owned[id]);
  }
  function challengeBeforeSale(s,r) {
    if (s.challenge?.id === 'fixedcast' && !r.kid && !r.lib && challengeCount(s) === 3 && challengeRun(s)?.seats == null)
      s.challenge = {...s.challenge,imprintRun:{...challengeRun(s),seats:s.muses.seated.slice()}};
  }
  function challengeAfterSale(s) {
    if (s.challenge?.id === 'onebrief' && challengeRun(s)?.phase === 'clearance' && challengeBacklog(s) <= 1)
      s.challenge = {...s.challenge,imprintRun:{...challengeRun(s),phase:'goal',baseline:challengeCount(s)}};
  }
  const challengeSettled = () => !layerChoices.size && !commissionPending && !musePending && !extensions.get('automation')?.pendingGarden() &&
    !extensions.get('automation')?.pendingChoice() && !S.meta.automation?.pitch?.sale && !S.meta.automation?.media?.pending &&
    !S.rewards.awayCheckpoint && !Object.values(S.rewards.claims || {}).some(c => c.status === 'prepared') && (!writer || writer.owns() && !writer.held() && !writer.localDisposition() && writer.guard(S));
  const challengeReward = c => c.imprint ? `${c.perk} First clear also gives a balanced Letters bundle on your highest owned desk: three minutes of productive output, at least 50 and at most 5,000 letters. Replays pay nothing.` : c.helper ? `${c.perk} First clear also gives Letters on the highest owned desk: floor(max(50, min(5000, 180 × productive letters/second))). No new stars or Diamond Bananas. Replays pay nothing.` : `+${c.stars} stars and a perk: ${c.perk}`;
  const toolOn = key => !!S[key] && !chal('quietshop');
  const challengeShopLock = what => chal('quietshop') && ['hold', 'contracts', 'metro', 'dbl', 'agent', 'analyst'].includes(what) ? 'Blocked by Quiet Shop' :
    (chal('patientpress') || masteryActive()) && what === 'pub' ? masteryActive() ? 'Blocked by manual Small Crew mastery' : 'Blocked by Patient Press' : chal('baremetal') && what === 'mk' ? 'Blocked by Bare Metal' : '';
  const chPerk = id => !!S.chDone[id];
  const speedPerks = () => (1 + .1 * legLvl('speed')) * (chPerk('vowel') ? 1.05 : 1) * (chPerk('hands') ? 1.1 : 1);
  const starsNow = () => Math.floor(Math.sqrt((S.run.earned || 0) / cash(5e5)));
  const nextStarAt = () => Math.pow(starsNow() + 1, 2) * cash(5e5);
  let freqCache = null;
  const freqNow = () => {
    const base = !chal('vowel') ? FREQ : freqCache || (freqCache = Object.fromEntries(Object.entries(FREQ).map(([k, v]) => [k, VOWELS.includes(k) ? v * .35 : v])));
    return layers?.weights(S, base) || base;
  };
  const chProgress = () => {
    if (!S.challenge) return '';
    if (masteryActive()) {const r = S.meta.challengeMastery.active; return `${r.medal}: ${r.sold.length}/${r.target} saved`;}
    const C = chDef(S.challenge.id);
    if (C.imprint && !challengeRun()) return 'Run unavailable. Abandon when saves settle.';
    if (chal('onebrief') && challengeRun().phase === 'clearance') return `Clearance: ${pitchActive()} unsold pitches; reach 1`;
    if (chal('fixedcast')) return `${soldCount()}/${C.goalN} · ${challengeSeatsLocked() ? 'Cast locked' : soldCount() >= 3 ? 'Seat an invited Muse before sale 4' : 'Choose your cast before sale 4'}`;
    const left = C.minutes ? Math.max(0, C.minutes * 60 - (savedWallNow() - S.challenge.start) / 1000) : null;
    return `${challengeSales()}/${C.goalN}${left !== null ? ` · ${Math.floor(left / 60)}:${String(Math.floor(left % 60)).padStart(2, '0')}` : ''}`;
  };
  function endChallenge(kind, acknowledged = false) {
    if (challengeActive()) return;
    if (masteryActive()) return writer.masteryAction({action:kind === 'done' ? 'qualify' : 'abandon'});
    const C = chDef(S.challenge.id), challengeWasDone = !!S.chDone[C.id];
    if (C.imprint && !acknowledged) {
      if (!challengeSettled()) return;
      if (kind === 'done') return writer.imprintChallengeClear(C.id);
    }
    if (kind === 'done' && C.helper && !C.imprint) {
      if (!writer?.owns() || !progressing() || writer.localDisposition() || !writer.guard(S)) return;
      if (!challengeWasDone) {
        const automation = extensions.get('automation')?.firstClearFloor(C.id, S.meta.automation);
        if (!automation) return;
        S.meta.automation = automation;
      }
    }
    S.challenge = null;
    if (kind === 'done') {
      const first = !S.chDone[C.id]; S.chDone = {...S.chDone,[C.id]:true};
      if (first && C.stars) { S.legacy.stars += C.stars; S.legacy.total += C.stars; }
      IMI.sfx.ding(); IMI.banner(PX ? 'OULIPO COMPLETE!' : 'Oulipo Complete!');
      logIt(`Oulipo challenge complete: ${C.name}.${first ? C.helper ? ` ${challengeReward(C)}` : ` +${C.stars} Legacy stars and a permanent perk.` : ''}`);
      newsPush(`${C.name} conquered. Constraint-loving monkeys are smug about it.`);
    } else if (kind === 'fail') { logIt(`The ${C.name} challenge ran out of time. The constraint is lifted.`); newsPush(`${C.name} failed. The monkeys promise they were just warming up.`); }
    else logIt(`Abandoned the ${C.name} challenge.`);
    extensionEvent('challenge', { id: C.id, kind, first: kind === 'done' && !challengeWasDone });
    if (!progressing()) return;
    mark(); save();
  }
  function checkChallenge() {
    if (!S.challenge || masteryActive() || challengeActive()) return;
    const C = chDef(S.challenge.id);
    if (!C || C.imprint && !challengeRun()) return;
    if (challengeSales() >= C.goalN) endChallenge('done');
    else if (C.minutes && savedWallNow() - S.challenge.start > C.minutes * 60000) endChallenge('fail');
  }
  let handsNagAt = 0;
  function handsNag() { const n = performance.now(); if (n - handsNagAt < 1200) return; handsNagAt = n; const b = $('#oStage'); if (b) { const r = b.getBoundingClientRect(); floatText('NO HANDS!', r.left + r.width / 2, r.top + 120, '#ff8a70', true); } }

  const seasonsEnabled = () => !!writer && window.Seasons?.enabled;
  let seasonsIntent = null;
  function seasonsDisabled() {
    return !seasonsEnabled() || !writer.owns() || !progressing() || !writer.guard(S) || writer.held() || writer.localDisposition() ||
      !challengeSettled() || !extensionAPI.identitySettled() || workPaused() || S.meta.folio?.working || S.meta.archive?.working ||
      S.meta.folio?.pending || S.meta.automation?.print?.pending || trainingPool?.mode() === 'suspended' || S.rewards?.awayCheckpoint ||
      document.hidden || IMI.screen() !== 'game' || IMI.tour?.active() || document.querySelector('.mg01-overlay, .o-modal, .o-celebrate, .set-pop:not([hidden])')
      ? 'Seasons waits for visible play, settled away progress, saves and work.' : '';
  }
  function seasonsPending() {
    Seasons.validate(S);
    const p=S.meta.seasons?.pending;
    if (!seasonsEnabled() || !p) throw Error('Seasons owner unavailable.');
    const source=pitchCopy(S); if (p.pendingNull) source.meta.seasons.pending=null; else delete source.meta.seasons.pending;
    if (p.absent) delete source.meta.seasons;
    if (printingSource(source) !== p.source) throw Error('Seasons source changed. Save preserved.');
    Seasons.assertChoice(source,p);
    if (p.action === 'claim') {
      const a=Seasons.current(source).active;
      if (p.id !== `seasons-claim:${a.sequence}` || !printInteger(p.previous) || p.sequence !== p.previous+1 ||
          ![p.sequence,p.balance,p.pay,p.balance+p.pay,source.run.earned+p.pay].every(printInteger) ||
          p.pay !== a.descriptor.amount || !pitchSame(p.descriptor,a.descriptor)) throw Error('Invalid Seasons payment.');
      const marker=bananas.acknowledgement(), paid=marker?.id===p.id && marker.sequence===p.sequence && marker.amount===p.pay;
      if (!paid && !pitchSame(marker,p.marker) || bananas.get() !== p.balance+(paid?p.pay:0)) throw Error('Seasons wallet baseline changed.');
    }
    return p;
  }
  function seasonsFreeze(request) {
    if (seasonsDisabled()) throw Error(seasonsDisabled());
    if (!archiveSettle()) throw Error('Archive income waiting to save.');
    if (seasonsDisabled()) throw Error(seasonsDisabled());
    const c=Seasons.current(S), a=c?.active, at=Seasons.observed(S), w=Seasons.week(at);
    if (!pitchSame(request.binding,{sequence:c?.sequence ?? 0,run:a?.id ?? null,weekIndex:w.weekIndex})) throw Error('Seasons changed. Review the current week again.');
    const action=a?.status === 'active' && at >= a.end ? 'expire' : request.action;
    let p={version:1,action,at,run:a?.id ?? null,source:printingSource(S),absent:c===undefined,pendingNull:c?.pending===null};
    if (action === 'participate') {
      const quote={week:w,descriptor:Seasons.descriptor(rewardBasis())};
      if (!pitchSame(quote,request.quote)) throw Error('Week or income changed. Review the current bonus again.');
      p={...p,week:w,descriptor:quote.descriptor,sample:S.stats[w.metric]};
    } else if (action === 'observe') p.sample=S.stats[a?.metric];
    Seasons.assertChoice(S,p);
    if (action === 'claim') {
      const marker=bananas.acknowledgement(), previous=marker?.sequence ?? 0;
      p={...p,id:`seasons-claim:${a.sequence}`,previous,sequence:previous+1,marker,balance:bananas.get(),pay:a.descriptor.amount,descriptor:pitchCopy(a.descriptor)};
    }
    const candidate=pitchCopy(S); candidate.meta.seasons ??= Seasons.fresh(); candidate.meta.seasons.pending=p;
    const live=S; try {S=candidate;seasonsPending();} finally {S=live;}
    seasonsIntent=candidate;
  }
  function seasonsCommit(phase) {
    if (!writer?.owns() || !writer.transacting() || !seasonsEnabled() || writer.localDisposition() || window.VaultSaveGate?.blocked) return {ok:false,error:'Seasons owner unavailable.'};
    try {
      let candidate;
      if (phase === 'prepare') {
        if (!seasonsIntent || printingSource(S) !== seasonsIntent.meta.seasons.pending.source) throw Error('Seasons changed before intent save.');
        candidate=seasonsIntent;
      } else if (phase === 'finish') {
        const p=seasonsPending(); candidate=pitchCopy(S);
        if (p.action === 'claim') {
          const marker=bananas.acknowledgement();
          if (marker?.id !== p.id || marker.sequence !== p.sequence || marker.amount !== p.pay) throw Error('Seasons payment is not acknowledged.');
          candidate.run.earned+=p.pay;
        }
        Seasons.outcome(candidate,p,Seasons.observed(S));
      } else throw Error('Unknown Seasons phase.');
      candidate.lastSeen=Date.now(); Seasons.validate(candidate);
      const result=Economy.saveStateAcknowledged(candidate); if (!result.ok) return result;
      S=candidate; seasonsIntent=null; mark(); return {ok:true,status:phase};
    } catch(error) { return {ok:false,error:error.message}; }
  }

  // These commands freeze only the board's reviewed choice or actual manual sale.
  const boardEnabled = () => !!writer && window.CommissionBoard?.enabled;
  const boardNames = () => CommissionBoard.ids.map(id => RBY[id]).filter(r => CommissionBoard.eligible(r) && titleAvailable(r) && !S.written[r.id]).map(r => r.title);
  let boardIntent = null;
  function boardReady(action) {
    if (!boardEnabled() || !writer.owns() || !progressing() || !writer.guard(S) || writer.held() || writer.localDisposition() ||
        !challengeSettled() || !extensionAPI.identitySettled() || workPaused() || S.meta.folio?.working || S.meta.archive?.working ||
        S.meta.folio?.pending || S.meta.automation?.print?.pending || trainingPool?.mode() === 'suspended' ||
        document.hidden || IMI.screen() !== 'game' || IMI.tour?.active() || document.querySelector('.mg01-overlay, .o-modal, .o-celebrate, .set-pop:not([hidden])') ||
        ['start','sale'].includes(action) && (S.challenge || masteryActive() || challengeActive())) throw Error('Commission waits for visible ordinary play and settled saves and work.');
  }
  function boardPending() {
    CommissionBoard.validate(S);
    const p = S.meta.commissionBoard?.pending;
    if (!boardEnabled() || !p) throw Error('Commission owner unavailable.');
    const source = pitchCopy(S); delete source.meta.commissionBoard.pending;
    if (p.absent) delete source.meta.commissionBoard;
    if (printingSource(source) !== p.source) throw Error('Commission source changed. Save preserved.');
    CommissionBoard.assertChoice(source,p,boardNames());
    if (p.action === 'sale' || p.action === 'claim') {
      const a = CommissionBoard.current(source).active;
      if (p.id !== `board-${p.action}:${a.sequence}` || !printInteger(p.previous) || p.sequence !== p.previous+1 ||
          ![p.sequence,p.balance,p.pay,p.balance+p.pay,source.run.earned+p.pay].every(printInteger) || !p.pay || p.pay % Economy.scale) throw Error('Invalid Commission payment.');
      if (p.action === 'sale') {
        const r=RBY[p.title];
        if (source.challenge || !CommissionBoard.eligible(r) || !canWrite(r) || !pitchSame(p.recipe,[r.title,r.text,r.pay]) || !pitchSame(p.need,r.need) ||
            !Number.isFinite(p.mult) || p.mult < .5 || p.mult > 2 || !Array.isArray(p.muses) || p.muses.some(id => !MUSES.some(m => m.id===id)) ||
            p.pay !== salePay(r,p.mult,id => p.muses.includes(id)) || !printInteger(source.stats.lump+p.pay)) throw Error('Commission reader or price changed.');
      } else if (p.pay !== a.descriptor.amount || !pitchSame(p.descriptor,a.descriptor)) throw Error('Commission bonus changed.');
      const marker=bananas.acknowledgement(), paid=marker?.id===p.id && marker.sequence===p.sequence && marker.amount===p.pay;
      if (!paid && !pitchSame(marker,p.marker) || bananas.get() !== p.balance+(paid?p.pay:0)) throw Error('Commission wallet baseline changed.');
    }
    return p;
  }
  function boardFreeze(request) {
    boardReady(request.action);
    if (!archiveSettle()) throw Error('Archive income waiting to save.');
    boardReady(request.action);
    const a=CommissionBoard.current(S)?.active, action=request.action, at=CommissionBoard.observed(S);
    let p={version:1,action,at,run:a?.id ?? null,source:printingSource(S),absent:S.meta.commissionBoard===undefined};
    if (action==='start') {
      const quote=CommissionBoard.descriptor(rewardBasis());
      if (!pitchSame(quote,request.quote)) throw Error('Income changed. Review the current bonus again.');
      p.descriptor=quote;
    }
    CommissionBoard.assertChoice(S,p,boardNames());
    if (action==='sale' || action==='claim') {
      const marker=bananas.acknowledgement(), previous=marker?.sequence ?? 0;
      p={...p,id:`board-${action}:${a.sequence}`,previous,sequence:previous+1,marker,balance:bananas.get()};
      if(action==='sale') {
        const r=RBY[request.id];
        if(!CommissionBoard.eligible(r) || !canWrite(r) || !challengeSaleAllowed(r)) throw Error('An eligible book must be ready for a manual sale.');
        const mult=marketMult(r.band);
        p={...p,title:r.id,need:pitchCopy(r.need),recipe:[r.title,r.text,r.pay],mult,pay:salePay(r,mult),muses:MUSES.filter(m=>museOn(m.id)).map(m=>m.id)};
      } else {p.pay=a.descriptor.amount;p.descriptor=pitchCopy(a.descriptor);}
    }
    const candidate=pitchCopy(S); candidate.meta.commissionBoard ??= CommissionBoard.fresh(); candidate.meta.commissionBoard.pending=p;
    const live=S; try {S=candidate;boardPending();} finally {S=live;}
    boardIntent=candidate; return p.at;
  }
  function boardCommit(action) {
    if (!writer?.owns() || !writer.transacting() || !boardEnabled() || writer.localDisposition() || window.VaultSaveGate?.blocked) return {ok:false,error:'Commission owner unavailable.'};
    try {
      let candidate,p;
      if(action==='prepare') {
        if(!boardIntent || printingSource(S)!==boardIntent.meta.commissionBoard.pending.source) throw Error('Commission changed before intent save.');
        candidate=boardIntent;
      } else if(action==='finish') {
        p=boardPending(); candidate=pitchCopy(S);
        if(p.action==='sale' || p.action==='claim') {
          const marker=bananas.acknowledgement();
          if(marker?.id!==p.id || marker.sequence!==p.sequence || marker.amount!==p.pay) throw Error('Commission payment is not acknowledged.');
          candidate.run.earned+=p.pay;
          if(p.action==='sale') {
            for(const w in p.need){candidate.bank[w]-=p.need[w];if(candidate.bank[w]<=0)delete candidate.bank[w];}
            candidate.written[p.title]=true;candidate.stats.lump+=p.pay;candidate.stats.bestMult=Math.max(candidate.stats.bestMult||0,p.mult);
            pg?.clearManual(candidate,p.title);if(candidate.focus===p.title)candidate.focus=null;
          }
        }
        CommissionBoard.outcome(candidate,p,CommissionBoard.observed(S));
      } else throw Error('Unknown Commission phase.');
      candidate.lastSeen=Date.now(); CommissionBoard.validate(candidate);
      const result=Economy.saveStateAcknowledged(candidate);if(!result.ok)return result;
      S=candidate;boardIntent=null;
      if(p?.action==='sale'){bankV++;dropCaches();introProgress();pickAutoFocus();salePublished(RBY[p.title],p.pay,p.mult,null,{});}
      mark();return {ok:true,status:p?'acknowledged':'prepared'};
    }catch(error){return {ok:false,error:error.message};}
  }

  const challengeEnabled = () => masteryEnabled() && window.AutoChallenge?.enabled;
  const challengeActive = (source = S) => window.AutoChallenge?.active(source);
  const challengeControlled = () => challengeActive()?.phase === 'producing' && printingHelper()?.challengeOn();
  const challengeValidate = source => window.AutoChallenge?.validate(source);
  function challengeAvailable() {
    const missing = AutoChallenge.ids.filter(id => !titleAvailable(RBY[id]));
    if (missing.length) throw Error('Unavailable in Archive: ' + missing.map(id => id + ' (' + RBY[id].title + ')').join(', '));
    if (!AutoChallenge.compatible(S)) throw Error('Waiting for PG: disabled, or band 0 / authored / no manual title / no advance.');
  }
  function challengeReady() {
    challengeValidate(S);
    if (!challengeEnabled() || !writer?.owns() || !progressing() || writer.held() || writer.localDisposition() || !writer.guard(S) ||
        !challengeSettled() || !extensionAPI.identitySettled() || workPaused() || S.meta.folio?.working || S.meta.archive?.working ||
        S.meta.folio?.pending || S.meta.layers?.pending || S.meta.estate?.pending || S.meta.archive?.pending || S.meta.automation?.print?.pending ||
        S.rewards.awayCheckpoint || S.prem.vault?.transition || trainingPool?.mode() === 'suspended' ||
        document.hidden || IMI.screen() !== 'game' || IMI.tour?.active() || document.querySelector('.mg01-overlay, .o-modal, .o-celebrate, .set-pop:not([hidden])')) throw Error('A11 waits for visible play and settled work and saves.');
  }
  let challengeIntent = null;
  function challengePending() {
    challengeValidate(S);
    const p = S.meta.automation?.challenge?.pending;
    if (!challengeEnabled() || !p || p.version !== 1 || !['settings','focus','sale','exit','abandon','continue'].includes(p.action) || typeof p.source !== 'string' || !printInteger(p.at)) throw Error('Unsupported pending A11 command.');
    const source = pitchCopy(S); delete source.meta.automation.challenge.pending;
    if (p.absent) delete source.meta.automation.challenge;
    if (p.automationAbsent) delete source.meta.automation;
    if (printingSource(source) !== p.source) throw Error('A11 command source changed. Save preserved.');
    const run = challengeActive(source);
    if (p.action === 'settings') {
      const fields = p.fields;
      if (!fields || Object.keys(fields).some(k => !['enabled','disclosed','selected','gold'].includes(k)) || typeof fields.enabled !== 'boolean' || !fields.enabled && Object.keys(fields).some(k => k !== 'enabled') ||
          fields.enabled && (!AutoChallenge.earned(source) || fields.disclosed !== true || !layers.same(fields.selected,['smallcrew']) || !layers.same(fields.gold,source.meta.challengeMastery.highest) || run && run.phase !== 'completed-awaiting-exit') ||
          !AutoChallenge.valid({...source.meta.automation?.challenge,...fields,version:1,sequence:source.meta.automation?.challenge?.sequence ?? 0,cursor:0,selected:fields.selected ?? source.meta.automation?.challenge?.selected ?? []})) throw Error('Unsupported A11 settings choice.');
    } else {
      if (!run || p.run !== run.id) throw Error('A11 run changed.');
      if (['focus','sale'].includes(p.action)) {
        const r = RBY[p.title];
        if (run.phase !== 'producing' || !AutoChallenge.compatible(source) || !r || p.title !== AutoChallenge.ids[run.sold.length] || !titleAvailable(r) || !layers.same(p.recipe,[r.title,r.text,r.pay]) || !layers.same(p.need,r.need)) throw Error('A11 fixed reader changed.');
        if (p.action === 'focus' && (run.target === p.title && source.focus === p.title || run.target !== null)) throw Error('A11 focus is already settled.');
        if (p.action === 'sale') {
          if (run.target !== p.title || source.focus !== p.title || !canWrite(r) || !Number.isFinite(p.mult) || p.mult < .5 || p.mult > 2 ||
              !Array.isArray(p.muses) || p.muses.some(id => !MUSES.some(m => m.id === id)) || p.pay !== salePay(r,p.mult,id => p.muses.includes(id)) ||
              p.id !== `a11-sale:e${run.resetEpoch}:${run.sequence}:${r.id}` || !printInteger(p.previous) || p.sequence !== p.previous + 1 ||
              ![p.balance,p.pay,p.balance+p.pay,source.stats.lump+p.pay,source.run.earned+p.pay].every(printInteger) || p.pay <= 0 || p.pay % Economy.scale) throw Error('Unsupported frozen A11 sale.');
          const marker = bananas.acknowledgement(), paid = marker?.id === p.id && marker.sequence === p.sequence && marker.amount === p.pay;
          if (!paid && !layers.same(marker,p.marker) || bananas.get() !== p.balance + (paid ? p.pay : 0)) throw Error('A11 wallet baseline changed.');
        }
      }
      if (p.action === 'exit' && run.phase !== 'completed-awaiting-exit' || p.action === 'continue' && run.phase === 'completed-awaiting-exit') throw Error('A11 outcome is unavailable.');
    }
    return p;
  }
  function challengeFreeze(request) {
    challengeReady();
    if (!archiveSettle()) throw Error('Archive income waiting to save.');
    challengeReady();
    const run = challengeActive(), action = request.action;
    if (['focus','sale','exit'].includes(action) && !printingHelper()?.challengeAuthorize()) throw Error('A11 command is not currently due.');
    if (['focus','sale'].includes(action)) challengeAvailable();
    let p = {version:1,action,run:run?.id ?? null,at:Date.now(),source:printingSource(S),absent:!S.meta.automation?.challenge,automationAbsent:S.meta.automation === undefined};
    if (action === 'settings') {
      if (request.expected !== JSON.stringify(S.meta.automation?.challenge ?? null)) throw Error('A11 settings changed. Review again.');
      p.fields = pitchCopy(request.fields);
    }
    if (['focus','sale'].includes(action)) {
      const r = RBY[AutoChallenge.ids[run.sold.length]];
      p = {...p,title:r.id,need:pitchCopy(r.need),recipe:[r.title,r.text,r.pay]};
      if (action === 'sale') {
        const marker = bananas.acknowledgement(), previous = marker?.sequence ?? 0, mult = marketMult(r.band);
        p = {...p,id:`a11-sale:e${run.resetEpoch}:${run.sequence}:${r.id}`,previous,sequence:previous+1,marker,balance:bananas.get(),mult,pay:salePay(r,mult),muses:MUSES.filter(m => museOn(m.id)).map(m => m.id)};
      }
    }
    const candidate = pitchCopy(S); candidate.meta.automation ??= {version:1};
    candidate.meta.automation.challenge ??= {version:1,sequence:0,cursor:0,selected:[]};
    candidate.meta.automation.challenge.pending = p;
    // Validate against this detached intent without publishing it.
    const live = S; try {S = candidate; challengePending();} finally {S = live;}
    challengeIntent = candidate;
  }
  function challengeCommit(action) {
    if (!writer?.owns() || !writer.transacting() || !challengeEnabled() || writer.localDisposition() || window.VaultSaveGate?.blocked) return {ok:false,refused:true,error:'A11 owner unavailable.'};
    try {
      let candidate, p;
      if (action === 'prepare') {
        if (!challengeIntent || printingSource(S) !== challengeIntent.meta.automation.challenge.pending.source) throw Error('A11 command changed before intent save.');
        candidate = challengeIntent;
      } else if (action === 'finish') {
        p = challengePending(); candidate = pitchCopy(S);
        if (p.action === 'sale') {
          const marker = bananas.acknowledgement();
          if (marker?.id !== p.id || marker.sequence !== p.sequence || marker.amount !== p.pay) throw Error('A11 payment is not acknowledged.');
          for (const w in p.need) {candidate.bank[w] -= p.need[w]; if (candidate.bank[w] <= 0) delete candidate.bank[w];}
          candidate.written[p.title] = true; candidate.stats.lump += p.pay; candidate.stats.bestMult = Math.max(candidate.stats.bestMult || 0,p.mult); candidate.run.earned += p.pay;
        }
        AutoChallenge.outcome(candidate,p);
      } else throw Error('Unknown A11 command.');
      candidate.lastSeen = p?.at ?? challengeIntent.meta.automation.challenge.pending.at;
      challengeValidate(candidate);
      const result = Economy.saveStateAcknowledged(candidate); if (!result.ok) return result;
      S = candidate; challengeIntent = null;
      if (p) {
        bankV++; dropCaches(); pickAutoFocus();
        if (p.action === 'sale') salePublished(RBY[p.title],p.pay,p.mult,null,{auto:true});
        if (p.action === 'sale' && challengeActive()?.phase === 'completed-awaiting-exit') IMI.banner('Small Crew clear saved. Exit waits for its next turn.');
      }
      mark(); return {ok:true,status:p ? 'acknowledged' : 'prepared'};
    } catch(error) {return {ok:false,refused:true,error:error.message};}
  }
  function challengeHandover() {
    const run = challengeActive();
    if (!run || run.phase === 'completed-awaiting-exit') return !run;
    printingHelper()?.challengeLocalOff();
    const result = writer.challengeAction({action:'continue'});
    if (!result.ok) newsPush(result.error);
    return result.ok;
  }

  // Manual Small Crew proof belongs to this fixed owner, never the ordinary first-clear counter.
  const masteryEnabled = () => printingEnabled() && new URLSearchParams(location.search).get('lg08mastery') === '1';
  const masteryIDs = ['ape-in-the-cape','goodnight-baboon','very-hungry-capuchin','three-little-twigs','chimp-in-the-hat','green-eggs-and-hamster','peter-panzee','swing-in-the-willows','charlie-chimpolate','wild-apes'];
  const masteryTargets = {bronze:6,silver:8,gold:10};
  const masteryActive = (s = S) => s.meta.challengeMastery?.active != null;
  function masteryValidate(s) {
    const m = s.meta.challengeMastery;
    if (m === undefined) {if (s.challenge?.mastery) throw Error('Missing mastery proof. Save preserved.'); return;}
    const obj = x => x && typeof x === 'object' && !Array.isArray(x);
    const proof = r => obj(r) && r.version === 1 && r.rule === 1 && r.origin === 'manual' && masteryTargets[r.medal] === r.target &&
      printInteger(r.sequence) && r.sequence > 0 && printInteger(r.resetEpoch) && printInteger(r.printing) && printInteger(r.imprint) &&
      r.id === `mastery:e${r.resetEpoch}:${r.sequence}` && layers.same(r.required,masteryIDs.slice(0,r.target)) &&
      Array.isArray(r.sold) && new Set(r.sold).size === r.sold.length && r.sold.every(id => r.required.includes(id));
    if (!obj(m) || m.version !== 1 || !printInteger(m.sequence) || m.highest != null && (!proof(m.highest) || m.highest.sold.length !== m.highest.target || !layers.same(m.highest.contained,Object.keys(masteryTargets).filter(k => masteryTargets[k] <= m.highest.target)) || m.highest.sequence > m.sequence) ||
        m.last != null && (!proof(m.last) || !['qualified','abandoned'].includes(m.last.outcome) || m.last.sequence > m.sequence || m.last.outcome === 'qualified' && m.last.sold.length !== m.last.target)) throw Error('Unsupported mastery proof. Save preserved.');
    if (m.active != null && (!s.chDone.smallcrew || !s.intro.done || !proof(m.active) || m.active.sequence !== m.sequence || !layers.epochMatches(s,m.active) || m.active.printing !== s.printing || m.active.imprint !== layers.identity(s) ||
        s.challenge?.id !== 'smallcrew' || s.challenge.mastery !== m.active.id || m.active.sold.some(id => !s.written[id]) ||
        s.desks.some((d,i) => d.owned && (i > 1 || d.paws > 2 || d.crew.length > 2)))) throw Error('Unsupported active mastery run. Save preserved.');
    if (s.challenge?.mastery && !m.active) throw Error('Missing active mastery proof. Save preserved.');
    const receipt = m.receipt;
    if (receipt != null && (!obj(receipt) || typeof receipt.id !== 'string' || !/^mastery-sale:e\d+:\d+:[a-z-]+$/.test(receipt.id) ||
        !printInteger(receipt.sequence) || receipt.sequence < 1 || !printInteger(receipt.amount) || !receipt.amount || receipt.amount % Economy.scale)) throw Error('Unsupported mastery payment receipt.');
  }
  function masterySelection(medal, source = S) {
    masteryValidate(source);
    if (!masteryEnabled() || !masteryTargets[medal] || !source.chDone.smallcrew || !source.intro.done || source.printing < 4 || masteryActive(source)) throw Error('Requires the ordinary Small Crew clear, introduction and Printing 5.');
    const unavailable = masteryIDs.slice(0,masteryTargets[medal]).filter(id => !titleAvailable(RBY[id]));
    if (unavailable.length) throw Error('Unavailable in Archive: ' + unavailable.map(id => RBY[id].title).join(', '));
    if (!printInteger((source.meta.challengeMastery?.sequence ?? 0) + 1)) throw Error('Mastery sequence cannot advance safely.');
    return {version:1,mode:'smallcrew-mastery',rule:1,medal,target:masteryTargets[medal],required:masteryIDs.slice(0,masteryTargets[medal])};
  }
  function masteryReady() {
    masteryValidate(S);
    if (!masteryEnabled() || !writer?.owns() || !progressing() || writer.held() || writer.localDisposition() || !writer.guard(S) || !masteryActive() ||
        !challengeSettled() || !extensionAPI.identitySettled() || !extensionAPI.layerSettled() || workPaused() || S.meta.folio?.working || S.meta.archive?.working ||
        document.hidden || IMI.screen() !== 'game' || IMI.tour?.active() || document.querySelector('.mg01-overlay, .o-modal, .o-celebrate, .set-pop:not([hidden])')) throw Error('Mastery waits for visible play and settled work and saves.');
  }
  let masteryIntent = null, masteryNotice = '';
  function masteryPending() {
    masteryValidate(S);
    const p = S.meta.challengeMastery?.pending;
    if (!masteryEnabled() || !p || p.version !== 1 || !['sale','abandon','qualify'].includes(p.action) || typeof p.source !== 'string' || !printInteger(p.at)) throw Error('Unsupported pending mastery command.');
    const source = pitchCopy(S); delete source.meta.challengeMastery.pending;
    if (printingSource(source) !== p.source || !masteryActive(source)) throw Error('Mastery source changed. Save preserved.');
    const run = source.meta.challengeMastery.active;
    if (p.run !== run.id) throw Error('Mastery run changed.');
    if (p.action === 'sale') {
      const r = RBY[p.title];
      if (!r || !run.required.includes(r.id) || run.sold.includes(r.id) || !canWrite(r) || !layers.same(p.need,r.need) ||
          !layers.same(p.recipe,[r.title,r.text,r.pay]) || !Number.isFinite(p.mult) || p.mult < .5 || p.mult > 2 ||
          !Array.isArray(p.muses) || p.muses.some(id => !MUSES.some(m => m.id === id)) || p.pay !== salePay(r,p.mult,id => p.muses.includes(id)) ||
          p.id !== `mastery-sale:e${run.resetEpoch}:${run.sequence}:${r.id}` || !printInteger(p.previous) || p.sequence !== p.previous + 1 ||
          ![p.balance,p.pay,p.balance+p.pay,source.stats.lump+p.pay,source.run.earned+p.pay].every(printInteger) || p.pay <= 0 || p.pay % Economy.scale) throw Error('Unsupported frozen mastery sale.');
      const marker = bananas.acknowledgement(), paid = marker?.id === p.id && marker.sequence === p.sequence && marker.amount === p.pay;
      if (!paid && !layers.same(marker,p.marker) || bananas.get() !== p.balance + (paid ? p.pay : 0)) throw Error('Mastery wallet baseline changed.');
    } else if (p.action === 'qualify' && run.sold.length !== run.target) throw Error('Mastery target is incomplete.');
    return p;
  }
  function masteryFreeze(request) {
    masteryReady();
    if (!archiveSettle()) throw Error('Archive income waiting to save.');
    masteryReady();
    const run = S.meta.challengeMastery.active, at = Date.now();
    let p = {version:1,action:request.action,run:run.id,at,source:printingSource(S)};
    if (request.action === 'sale') {
      const r = RBY[request.id];
      if (!r || !run.required.includes(r.id) || run.sold.includes(r.id) || !canWrite(r)) throw Error('Required authored title is unavailable.');
      const marker = bananas.acknowledgement(), previous = marker?.sequence ?? 0, mult = marketMult(r.band);
      p = {...p,title:r.id,id:`mastery-sale:e${run.resetEpoch}:${run.sequence}:${r.id}`,previous,sequence:previous+1,marker,balance:bananas.get(),mult,pay:salePay(r,mult),need:pitchCopy(r.need),recipe:[r.title,r.text,r.pay],muses:MUSES.filter(m => museOn(m.id)).map(m => m.id)};
    } else if (!['abandon','qualify'].includes(request.action) || request.action === 'qualify' && run.sold.length !== run.target) throw Error('Mastery outcome unavailable.');
    if (p.action === 'sale' && ![p.sequence,p.balance,p.pay,p.balance+p.pay,S.stats.lump+p.pay,S.run.earned+p.pay].every(printInteger)) throw Error('Mastery sale exceeds safe counters.');
    masteryIntent = pitchCopy(S); masteryIntent.meta.challengeMastery.pending = p;
  }
  function masteryCommit(action) {
    if (!writer?.owns() || !writer.transacting() || !masteryEnabled() || writer.localDisposition() || window.VaultSaveGate?.blocked) return {ok:false,refused:true,error:'Mastery owner unavailable.'};
    try {
      let candidate, p;
      if (action === 'prepare') {
        if (!masteryIntent || printingSource(S) !== masteryIntent.meta.challengeMastery.pending.source) throw Error('Mastery command changed before intent save.');
        candidate = masteryIntent;
      } else if (action === 'finish') {
        p = masteryPending(); candidate = pitchCopy(S);
        const m = candidate.meta.challengeMastery, run = m.active;
        if (p.action === 'sale') {
          const marker = bananas.acknowledgement();
          if (marker?.id !== p.id || marker.sequence !== p.sequence || marker.amount !== p.pay) throw Error('Mastery payment is not acknowledged.');
          for (const w in p.need) { candidate.bank[w] -= p.need[w]; if (candidate.bank[w] <= 0) delete candidate.bank[w]; }
          candidate.written[p.title] = true; candidate.stats.lump += p.pay; candidate.stats.bestMult = Math.max(candidate.stats.bestMult || 0,p.mult); candidate.run.earned += p.pay;
          run.sold.push(p.title); m.receipt = {...m.receipt,id:p.id,sequence:p.sequence,amount:p.pay}; candidate.rewards.walletHead = {...m.receipt,origin:'mastery-sale'};
          pg?.clearManual(candidate,p.title); if (candidate.focus === p.title) candidate.focus = null;
        }
        if (p.action !== 'sale' || run.sold.length === run.target) {
          const qualified = p.action !== 'abandon';
          m.last = {...m.last,...pitchCopy(run),outcome:qualified ? 'qualified' : 'abandoned',at:p.at};
          if (qualified && (!m.highest || m.highest.target < run.target)) m.highest = {...m.highest,...pitchCopy(run),contained:Object.keys(masteryTargets).filter(k => masteryTargets[k] <= run.target)};
          m.active = null; candidate.challenge = null;
        }
        delete m.pending;
      } else throw Error('Unknown mastery command.');
      candidate.lastSeen = p?.at ?? masteryIntent.meta.challengeMastery.pending.at;
      masteryValidate(candidate);
      const result = Economy.saveStateAcknowledged(candidate);
      if (!result.ok) return result;
      S = candidate; masteryIntent = null;
      if (p) {
        bankV++; dropCaches(); introProgress(); pickAutoFocus();
        if (p.action === 'sale') salePublished(RBY[p.title],p.pay,p.mult,null,{});
        if (!masteryActive()) { IMI.banner(S.meta.challengeMastery.last.outcome === 'qualified' ? 'Small Crew mastery saved' : 'Trial abandoned'); }
      }
      mark(); return {ok:true,status:p ? 'acknowledged' : 'prepared'};
    } catch(error) { return {ok:false,refused:true,error:error.message}; }
  }
  function masteryHTML() {
    if (!masteryEnabled()) return '';
    let m; try { masteryValidate(S); m = S.meta.challengeMastery; } catch(error) { return `<section class="o-card"><p>${esc(error.message)}</p></section>`; }
    const run = m?.active;
    return `<section class="o-card lg08j-mastery"><h3>Manual Small Crew mastery</h3>${masteryNotice ? `<p role="status">${esc(masteryNotice)}</p>` : ''}<p>Saved medal: ${m?.highest?.medal ?? 'none'}. ${m?.last ? 'Last trial: ' + m.last.outcome + '.' : ''}</p><p>Bamboo and Hibiscus only, at most two typists each. All helpers and Publisher pause. Typists, free keepers, manual holds and your existing output bonuses remain. No medal rewards.</p>${run ? `<p>${esc(run.medal)}: ${run.sold.length}/${run.target} saved titles</p><ul>${run.required.map(id => `<li>${run.sold.includes(id) ? 'Sold: ' : 'Needed: '}${esc(RBY[id].title)}</li>`).join('')}</ul><button class="o-btn" data-act="mastery-abandon">Abandon trial (no medal)</button>` : `<p>Requires ordinary Small Crew clear, introduction, Printing 5 and at least one pending Printing star.</p>${Object.entries(masteryTargets).map(([medal,n]) => `<button class="o-btn" data-act="mastery-review" data-medal="${medal}" ${S.challenge || !S.chDone.smallcrew || !S.intro.done || S.printing < 4 || starsNow() < 1 ? 'disabled' : ''}>Review ${medal} (${n} books)</button>`).join('')}`}</section>`;
  }
  function masteryReview(medal) {
    masteryNotice = '';
    try {
      const quote = printingReview('mastery',medal), selection = masterySelection(medal);
      const el = document.createElement('div'); el.className = 'o-modal';
      el.innerHTML = `<div class="o-modal-card o-vault-gate"><h3>Start ${esc(medal)} Small Crew?</h3><div class="o-vault-gate-content" tabindex="0" role="region" aria-label="Trial reset losses and books"><p>This Printing grants ${quote.gain} pending Legacy stars, then resets bananas, machines, typists, bank, run tools, deals, divisions, Muses and garden. Ordinary Printing history and permanent benefits remain. Only Bamboo/Hibiscus and two typists each. All helpers and Publisher pause until qualification or saved abandon. No medal or replay reward.</p><p>Manually produce and sell all ${selection.target} books:</p><ul>${selection.required.map(id => `<li>${esc(RBY[id].title)}</li>`).join('')}</ul></div><div class="o-row"><button class="o-btn" data-cancel>Cancel</button><button class="o-btn gold" data-start>Start trial</button></div></div>`;
      document.body.append(el); el.querySelector('[data-cancel]').onclick = () => el.remove();
      el.querySelector('[data-start]').onclick = () => {el.remove(); const r = writer.printingAction({origin:'mastery',quote}); if (!r.ok) newsPush(r.error);};
      el.querySelector('[data-cancel]').focus();
    } catch(error) {newsPush(error.message);}
  }

  // LG-08G owns only ordinary Printing. Challenge/full reset keep their old path.
  const printingEnabled = () => ['lg08print','lg03','lg01a','lg05folio','lg05layers','lg08estate'].every(k => new URLSearchParams(location.search).get(k) === '1');
  const printingHelper = () => extensions.get('automation') || (window.__OPS_EXTENSIONS || []).find(([id]) => id === 'automation')?.[1];
  const printInteger = n => Number.isSafeInteger(n) && n >= 0;
  let printingOffer = null, printingIntent = null;
  function printingQuote(source = S) {
    if (window.VaultPlay?.pending(source) || writer?.localDisposition()) throw Error('Finish the saved purchase or recovery before Printing.');
    masteryValidate(source); challengeValidate(source);
    if (challengeActive(source)) throw Error('Settle A11 before Printing.');
    if (!printingEnabled() || !printingHelper()?.validConfig(source.meta.automation,extensionAPI)) throw Error('Unsupported Printing settings or missing flags.');
    layers.current(source); archiveFeature?.retained(source); worksDemo?.retained(source); worksPlay?.retained(source);
    if (source.meta.folio?.pending || source.meta.layers?.pending || source.meta.estate?.pending || source.meta.archive?.pending ||
        source.meta.automation?.pitch?.sale || source.meta.automation?.media?.pending || source.rewards.awayCheckpoint ||
        source.prem.vault?.transition || Object.values(source.rewards.claims || {}).some(c => c.status === 'prepared') ||
        source.meta.folio?.working || source.meta.archive?.working || source.meta.worksDemo?.working || worksPlay?.current(source)?.working) throw Error('Original work or recovery must settle before Printing.');
    if (source.meta.folio !== undefined && !folio.valid(source.meta.folio) ||
        source.meta.productionGoal !== undefined && !window.ProductionGoal?.valid(source.meta.productionGoal) ||
        source.meta.trainingPool !== undefined && !window.TrainingPool?.valid(source.meta.trainingPool) ||
        source.meta.minigames !== undefined && source.meta.minigames?.version !== 1) throw Error('Unsupported retained progression. Save preserved.');
    const gain = Math.floor(Math.sqrt(source.run.earned / cash(5e5))), epoch = layers.estateIdentity(source)?.resetEpoch;
    if (source.challenge || ![source.run.earned,source.printing,source.printing + 1,source.legacy.stars,source.legacy.total,gain,source.legacy.stars + gain,source.legacy.total + gain].every(printInteger) ||
        gain < 1 || source.legacy.stars > source.legacy.total || epoch !== undefined && !printInteger(epoch + 1) ||
        !printInteger(source.legacy.ups.seed ?? 0) || (source.legacy.ups.seed ?? 0) > 3 || ![0,1].includes(source.legacy.ups.crew ?? 0) ||
        Object.values(source.editions).some(n => !printInteger(n)) || Object.keys(source.written).some(id => !printInteger((source.editions[id] ?? 0) + 1))) throw Error('Printing counters cannot advance safely.');
    return {...layers.epochFields(source),printing:source.printing,earned:source.run.earned,stars:source.legacy.stars,total:source.legacy.total,gain};
  }
  function printingReady() {
    if (!printingEnabled() || !writer?.owns() || !progressing() || !writer.guard(S) || writer.held() || writer.localDisposition() || window.VaultSaveGate?.blocked ||
        S.challenge || ui.nextCh || !challengeSettled() || !extensionAPI.identitySettled() || !extensionAPI.layerSettled() || workPaused() ||
        S.meta.folio?.working || S.meta.archive?.working || S.meta.worksDemo?.working || worksPlay?.current(S)?.working ||
        S.meta.folio?.pending || S.meta.layers?.pending || S.meta.estate?.pending || S.meta.archive?.pending || S.meta.automation?.print?.pending ||
        document.hidden || IMI.screen() !== 'game' || IMI.tour?.active() || document.querySelector('.mg01-overlay, .o-modal, .o-celebrate, .set-pop:not([hidden])')) throw Error('Finish current work and waiting saves before Printing.');
    printingQuote();
  }
  // Ignore only elapsed presentation counters. All room, earnings, identity and wallet inputs bind review.
  const printingSource = source => {
    const next = pitchCopy(source); delete next.lastSeen; delete next.log;
    delete next.stats.secs; delete next.stats.playSecs;
    return JSON.stringify(next);
  };
  function printingRoom(source, crew, at, origin, selection) {
    const q = printingQuote(source), next = layers.projectRoom(source,fresh());
    next.printing = q.printing + 1; next.run.earned = 0;
    next.intro = {...source.intro,done:true,train:true,words:true,shop:true};
    next.legacy = {...next.legacy,stars:q.stars + q.gain,total:q.total + q.gain};
    if (q.resetEpoch !== undefined) next.meta.estate.resetEpoch = q.resetEpoch + 1;
    worksPlay?.exit(next);
    if (next.meta.worksDemo) next.meta.worksDemo.working = false;
    if (next.meta.archive) next.meta.archive.working = null;
    pg?.clearManual(next);
    for (const id of ['garden','pitch','muse']) {
      const manual = next.meta.automation?.[id]?.manual;
      if (manual && !manual.complete) {
        if (id === 'muse') Object.assign(manual,{ids:[],complete:false,...layers.epochFields(next),imprint:layers.identity(next),printing:next.printing});
        else if (manual.pending != null) manual.pending = null;
      }
    }
    if (next.meta.folio !== undefined) next.meta.folio = folio.current(next);
    next.rewards.activeGold = null;
    next.desks[0].paws = crew.length; next.desks[0].crew = pitchCopy(crew);
    if (crew.length) next.hold = true;
    for (const t of crew) next.looks[t.look] = 1;
    const cfg = next.meta.automation?.print;
    next.meta.automation = {...next.meta.automation,version:1,print:{...cfg,version:1,manual:{...cfg?.manual,...(origin === 'manual' ? {complete:true} : {})}}};
    delete next.meta.automation.print.pending;
    if (origin === 'auto-challenge') AutoChallenge.enter(next,selection,at);
    if (origin === 'mastery') {
      const m = next.meta.challengeMastery ?? {version:1,sequence:0};
      const sequence = m.sequence + 1;
      next.meta.estate = {...selection.identity,resetEpoch:selection.identity.resetEpoch + 1};
      const run = {version:1,rule:1,origin:'manual',id:`mastery:e${next.meta.estate.resetEpoch}:${sequence}`,sequence,resetEpoch:next.meta.estate.resetEpoch,printing:next.printing,imprint:layers.identity(next),medal:selection.medal,target:selection.target,required:selection.required,sold:[]};
      next.meta.challengeMastery = {...m,sequence,active:run};
      next.challenge = {id:'smallcrew',start:at,mastery:run.id};
    }
    next.lastSeen = at;
    return next;
  }
  function printingPending() {
    const p = S.meta.automation?.print?.pending;
    if (!printingEnabled() || !p || !(p.version === 1 && ['manual','auto'].includes(p.origin) || p.version === 2 && p.origin === 'mastery' && masteryEnabled() && p.selection?.mode === 'smallcrew-mastery' || p.version === 3 && p.origin === 'auto-challenge' && challengeEnabled() && p.selection?.mode === 'smallcrew-auto') || !printInteger(p.at) || !printInteger(p.balance) || p.balance % Economy.scale ||
        !printInteger(p.seed) || !Array.isArray(p.crew) || typeof p.source !== 'string' || typeof p.automationAbsent !== 'boolean' ||
        !Object.hasOwn(p,'sourcePrint') || !layers.same(p.marker,bananas.acknowledgement()) || ![p.balance,p.seed].includes(bananas.get())) throw Error('Waiting Printing requires its exact original intent and wallet.');
    const source = pitchCopy(S);
    if (p.automationAbsent) delete source.meta.automation;
    else if (p.sourcePrint === null) delete source.meta.automation.print;
    else source.meta.automation.print = pitchCopy(p.sourcePrint);
    const q = printingQuote(source), id = layers.identityKey('printing',[q.printing + 1,q.total,q.earned],q);
    if (p.id !== id || !/^printing:(?:e(?:0|[1-9]\d*):)?(?:0|[1-9]\d*):(?:0|[1-9]\d*):(?:0|[1-9]\d*)$/.test(p.id) ||
        !layers.same(q,p.quote) || printingSource(source) !== p.source || p.seed !== cash([0,1000,10000,100000][source.legacy.ups.seed || 0]) ||
        !extensionAPI.estateCrewValid(p.crew,source) || !layers.same(printingRoom(source,p.crew,p.at,p.origin,p.selection),p.candidate)) throw Error('Waiting Printing source or successor changed. Save preserved.');
    if (p.origin === 'mastery') {
      const selection = masterySelection(p.selection.medal,source);
      const identity = layers.estateIdentity(source) ?? {version:1,localImprints:layers.current(source).count,resetEpoch:0};
      if (!layers.same(p.selection,{...selection,identity})) throw Error('Unsupported frozen mastery entry.');
    }
    if (p.origin === 'auto-challenge' && !layers.same(p.selection,AutoChallenge.selection(source))) throw Error('Unsupported frozen A11 entry.');
    if (p.origin === 'auto' && !printingHelper().validPrintDecision(p.decision,source,q,extensionAPI)) throw Error('Invalid frozen automatic Printing decision.');
    return p;
  }
  function printingReview(origin = 'manual', medal) {
    if (origin === 'auto-challenge' && !printingHelper()?.challengeAuthorize()) throw Error('A11 entry is not due.');
    if (origin === 'auto' && !printingHelper()?.printAuthorize()) throw Error('Automatic Printing is not currently due.');
    printingReady();
    if (!archiveSettle()) throw Error('Archive income waiting to save.');
    printingReady();
    const quote = printingQuote();
    const selection = origin === 'mastery' ? masterySelection(medal) : origin === 'auto-challenge' ? AutoChallenge.selection(S) : null;
    if (origin === 'auto-challenge') {challengeAvailable(); if (!S.autoFocus && S.focus) throw Error('Clear the manual focus before A11 entry.');}
    printingOffer = {origin,selection,quote,source:printingSource(S),balance:bananas.get(),marker:bananas.acknowledgement()};
    return pitchCopy(quote);
  }
  function printingFreeze(request) {
    printingReady();
    if (!['manual','auto','mastery','auto-challenge'].includes(request?.origin) || !printingOffer || request.origin !== printingOffer.origin || request.origin === 'auto' && !printingHelper()?.printAuthorize() || !layers.same(request.quote,printingOffer.quote) ||
        printingSource(S) !== printingOffer.source || bananas.get() !== printingOffer.balance || !layers.same(bananas.acknowledgement(),printingOffer.marker)) throw Error('Printing changed. Review it again.');
    // Only this named Archive settlement may refresh the reviewed boundary.
    if (!archiveSettle()) throw Error('Archive income waiting to save.');
    printingReady();
    if (request.origin === 'auto' && !printingHelper()?.printAuthorize()) throw Error('Automatic Printing changed before prepare.');
    if (request.origin === 'auto-challenge') {if (!printingHelper()?.challengeAuthorize()) throw Error('A11 entry changed.'); challengeAvailable();}
    const quote = printingQuote(), decision = request.origin === 'auto' ? printingHelper().printDecision() : null, at = Date.now(), room = fresh(), crew = room.desks[0].crew;
    if (request.origin === 'auto' && !printingHelper().validPrintDecision(decision,S,quote)) throw Error('Automatic decision is unavailable.');
    if (S.legacy.ups.crew) for (let i=0;i<2;i++) crew.push(newTypist(room));
    const selection = request.origin === 'mastery' ? {...masterySelection(printingOffer.selection.medal),identity:layers.estateIdentity(S) ?? layers.initializeIdentity(S)} : request.origin === 'auto-challenge' ? AutoChallenge.selection(S) : null;
    const p = {version:request.origin === 'auto-challenge' ? 3 : selection ? 2 : 1,origin:request.origin,...(selection ? {selection} : {}),...(decision ? {decision} : {}),at,id:layers.identityKey('printing',[quote.printing + 1,quote.total,quote.earned],quote),quote,
      source:printingSource(S),sourcePrint:pitchCopy(S.meta.automation?.print ?? null),automationAbsent:S.meta.automation === undefined,
      balance:bananas.get(),marker:bananas.acknowledgement(),seed:cash([0,1000,10000,100000][S.legacy.ups.seed || 0]),crew,
      candidate:printingRoom(S,crew,at,request.origin,selection)};
    printingIntent = {...pitchCopy(S),meta:{...pitchCopy(S.meta),automation:{...pitchCopy(S.meta.automation ?? {}),version:1,print:{...pitchCopy(S.meta.automation?.print ?? {}),version:1,pending:p}}}};
    printingOffer = null;
    return p.id;
  }
  function printingCommit(action) {
    if (!writer?.owns() || !writer.transacting() || !printingEnabled() || window.VaultSaveGate?.blocked || writer.localDisposition()) return {ok:false,status:'refused',refused:true,error:'Printing owner unavailable'};
    try {
      let candidate, p;
      if (action === 'prepare') {
        if (!printingIntent || printingSource(S) !== printingIntent.meta.automation.print.pending.source) throw Error('Prepared Printing source changed.');
        candidate = printingIntent;
      } else if (action === 'finish') {p = printingPending();candidate = p.candidate;}
      else throw Error('Unknown Printing command.');
      const result = Economy.saveStateAcknowledged(candidate);
      if (!result.ok) return {...result,status:'held'};
      S = candidate; printingIntent = null;
      if (p) {
        layerRuntimeReset('floor');
        extensionEvent('init','printing');
        extensionEvent('reset',{kind:'printing',gain:p.quote.gain,previousPrinting:p.quote.printing});
        if (pg?.active(pgContext)) pickAutoFocus();
        logIt(`Printing ${S.printing + 1} begins. Legacy stars: ${S.legacy.stars}.`);
        newsPush(`SECOND PRINTING: the room is reborn with ${S.legacy.total} Legacy stars. Titles can be sold again.`);
        shownN['cel-st'] = 0;
        celebrate(PX ? `PRINTING ${S.printing + 1}` : `Printing ${S.printing + 1}`, PX ? 'THE PRESSES ROLL AGAIN' : 'The presses roll again',
          `<p class="o-cel-stars">+${cnt('cel-st',p.quote.gain)} Legacy star${p.quote.gain > 1 ? 's' : ''}</p><p class="o-cel-sub">Every title can be sold again. Income x${(legacyMult() * editionMult()).toFixed(2)}.</p>`);
      }
      mark();
      return {ok:true,status:p ? 'acknowledged' : 'prepared',id:p?.id ?? S.meta.automation.print.pending.id};
    } catch(error) {return {ok:false,status:'refused',refused:true,error:error.message};}
  }

  function doPrint(chId) {
    if (lampPending()) return;
    if (masteryActive() || challengeActive()) return;
    if (printingEnabled() && !chId && !S.challenge) { try { return writer.printingAction({origin:'manual',quote:printingReview()}); } catch(error) { return {ok:false,status:'refused',refused:true,error:error.message}; } }
    if (!progressing()) return;
    if (!archiveSettle()) return;
    try { archiveFeature?.retained(S); worksDemo?.retained(S); worksPlay?.retained(S); } catch { return; }
    const gain = starsNow(); if (gain < 1) return;
    const constraint = chId && chDef(chId);
    if ((constraint?.imprint || imprintChallenge()) && (!challengeSettled() || imprintChallenge() && !challengeRun())) return;
    if (chId && (!constraint || !challengeSelectable(constraint) || constraint.helper && (writer.localDisposition() || !writer.guard(S)))) return;
    let estate;
    try { estate = layers?.advanceIdentity(S); } catch { return; }
    IMI.pickups?.clear(); goldEnd?.(); holding = false; royAcc = coinBank = 0;
    const old = S, f = fresh();
    f.meta = estate === undefined ? old.meta : {...pitchCopy(old.meta), estate}; f.rewards = old.rewards; f.prem = old.prem;
    if (window.Hall?.enabled) f.looks = {...old.looks};
    Object.assign(f, { intro: { ...old.intro, done: true, train: true, words: true, shop: true }, daily: old.daily, awards: old.awards, stats: old.stats, best: old.best, gold: old.gold, royTotal: old.royTotal, divTotal: old.divTotal, pitches: old.pitches, chDone: old.chDone, printing: old.printing + 1 });
    f.editions = { ...old.editions }; Object.keys(old.written).forEach(id => { f.editions[id] = (f.editions[id] || 0) + 1; });
    f.legacy = { ...old.legacy, ups: { ...old.legacy.ups }, stars: old.legacy.stars + gain, total: old.legacy.total + gain };
    f.run = { earned: 0 }; f.challenge = chId ? { id: chId, start: Date.now() } : null;
    if (constraint?.imprint) f.challenge.imprintRun = {version:1,...layers.epochFields(f),printing:f.printing,imprint:layers.identity(f),
      ...(chId === 'onebrief' ? {phase:challengeBacklog(f) > 1 ? 'clearance' : 'goal',baseline:0} : {}),
      ...(chId === 'fixedcast' ? {seats:null} : {})};
    S = f; worksPlay?.exit(S); if (S.meta.worksDemo) S.meta.worksDemo = {...S.meta.worksDemo,working:false}; if (S.meta.archive) S.meta.archive = {...S.meta.archive,working:null}; pg?.clearManual(S);
    if (gardenPrototype()) extensions.get('automation')?.clearGardenPending(S);
    clearMuseIncomplete(S); musePending = null; layerChoices.delete('muse');
    clearPitchPending(S); commissionPending = null; layerChoices.delete('pitch');
    if (folio?.enabled && S.meta.folio !== undefined && folio.valid(S.meta.folio)) S.meta = {...S.meta, folio:folio.current(S)};
    freqCache = null;
    S.desks.forEach(ensureCrew);
    bananas.spend(bananas.get());
    const seed = cash([0, 1000, 10000, 100000][legLvl('seed')]); if (seed) bananas.add(seed);
    if (legLvl('crew')) { S.hold = !chal('quietshop'); S.desks[0].paws = 2; ensureCrew(S.desks[0]); }
    S.run.earned = 0; lastBananas = bananas.get();
    extensionEvent('init', 'printing');
    extensionEvent('reset', { kind: 'printing', gain, previousPrinting: old.printing });
    if (pg?.active(pgContext)) pickAutoFocus();
    rt.forEach(r => { r.timers = []; r.sheet = ''; r.col = 0; r.n = 0; });
    ui.hot = DESKS.map(() => false); ui.readySet = null; ui.pulled = null; ui.fresh = null; ui.dropped = {}; ui.mcd = {}; ui.tab = 'floor';
    Object.keys(buffs).forEach(k => { buffs[k] = 0; });
    S.sel = 0; typists = [];
    if (!progressing()) { buildStage(); mark(); return; }
    logIt(`Printing ${S.printing + 1} begins. Legacy stars: ${S.legacy.stars}.${S.challenge ? ' Challenge: ' + chDef(S.challenge.id).name + '.' : ''}`);
    newsPush(`SECOND PRINTING: the room is reborn with ${S.legacy.total} Legacy stars. Titles can be sold again.`);
    shownN['cel-st'] = 0;
    celebrate(PX ? `PRINTING ${S.printing + 1}` : `Printing ${S.printing + 1}`, PX ? 'THE PRESSES ROLL AGAIN' : 'The presses roll again',
      `<p class="o-cel-stars">+${cnt('cel-st', gain)} Legacy star${gain > 1 ? 's' : ''}</p><p class="o-cel-sub">Every title can be sold again. Income x${(legacyMult() * editionMult()).toFixed(2)}.</p>`);
    buildStage(); render(); save();
  }
  function askPrint() {
    printingHelper()?.printChoice();
    let printQuote;
    if (printingEnabled() && !ui.nextCh && !S.challenge) { try { printQuote = printingReview(); } catch(error) { newsPush(error.message);return; } }
    if (!archiveSettle()) return;
    try { archiveFeature?.retained(S); worksDemo?.retained(S); worksPlay?.retained(S); } catch { return; }
    const gain = starsNow(); if (gain < 1) return;
    document.querySelectorAll('.o-modal').forEach(m => m.remove());
    const el = document.createElement('div'); el.className = 'o-modal'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-labelledby', 'oPrT');
    const C = ui.nextCh && chDef(ui.nextCh);
    el.innerHTML = `<div class="o-modal-card${C?.helper ? ' o-vault-gate' : ''}"><h3 id="oPrT">Go to press?</h3>
      ${C?.helper ? '<div class="o-vault-gate-content" tabindex="0" role="region" aria-label="Printing and challenge details">' : ''}
      <p>You will earn <b>${gain}</b> Legacy star${gain > 1 ? 's' : ''} and start printing ${S.printing + 2}.${C ? ` The <b>${C.name}</b> constraint will apply.` : ''}</p>
      ${C ? `<p>${C.desc} First-clear benefit: ${challengeReward(C)}</p>` : ''}
      <p class="o-dim">You keep awards, stats, pitched titles, Legacy and your bookshelf (as earlier editions). You lose bananas, machines, typists, upgrades, deals, divisions, Muses, the garden and the word bank.</p>
      ${C?.helper ? '</div>' : ''}<div class="o-row"><button type="button" class="o-btn" data-cancel>Not yet</button><button type="button" class="o-btn gold" data-ok>Print it</button></div></div>`;
    document.body.appendChild(el);
    const close = () => el.remove();
    el.querySelector('[data-cancel]').addEventListener('click', close);
    el.querySelector('[data-ok]').addEventListener('click', () => { close(); if (printQuote) { const r = writer.printingAction({origin:'manual',quote:printQuote}); if (!r.ok) newsPush(r.error); } else doPrint(ui.nextCh); });
    el.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    el.querySelector('[data-cancel]').focus();
  }
  function renderLegacy() {
    const earned = S.run.earned || 0, gain = starsNow(), L = S.legacy;
    const chips = [['', 'No constraint']].concat(challengeCatalog().map(c => [c.id, c.name + (S.chDone[c.id] ? ' ✓' : '')]))
      .map(([id, name]) => `<button type="button" data-act="chpick" data-id="${id}" ${id && !challengeSelectable(chDef(id)) ? 'disabled' : ''} aria-pressed="${(ui.nextCh || '') === id}">${esc(name)}</button>`).join('');
    const picked = ui.nextCh && chDef(ui.nextCh);
    const active = S.challenge ? `<div class="o-card o-seat on"><div class="o-row"><h3>Oulipo: ${chDef(S.challenge.id).name}</h3><span class="o-lvl">${chProgress()}</span></div><p>${chDef(S.challenge.id).desc}</p><button type="button" class="o-btn sm" data-act="chabandon">Abandon (no reward)</button></div>` : '';
    const legCards = LEG.map(u => {
      const lv = legLvl(u.id), cost = u.costs[lv];
      return `<div class="o-card"><div class="o-row"><h3>${u.name}</h3><span class="o-lvl">${lv}/${u.max}</span></div>${pips(lv, u.max)}<p>${u.desc}</p>
        ${lv >= u.max ? '<span class="o-lvl">MAXED</span>' : `<button type="button" class="o-btn gold" data-act="legbuy" data-id="${u.id}" ${L.stars < cost ? 'disabled' : ''}>${cost} star${cost > 1 ? 's' : ''}</button>`}</div>`;
    }).join('');
    const tabs = [['press', 'Press'], ['challenges', 'Challenges'], ['upgrades', 'Upgrades', L.stars ? L.stars : 0]];
    if (!tabs.some(t => t[0] === ui.sub.legacy)) ui.sub.legacy = 'press';
    const sub = ui.sub.legacy, done = challengeCatalog().filter(c => S.chDone[c.id]);
    let body;
    if (sub === 'press') body = `<div class="o-card o-print"><div class="o-row"><h3>Second Printing</h3><span class="o-lvl">Printing ${S.printing + 1}</span></div>
        <p>Keep your shelf as earlier editions: every title sells again for <b>+${35 * (S.printing + 1)}%</b> more (now +${35 * S.printing}%).</p>
        <p>Each Legacy star adds <b>2%</b> to all banana income.</p>
        <p>You restart machines, typists and bananas.</p>
        <p>This run has earned <b>${fmtBig(earned)}</b> bananas: <b>${gain}</b> Legacy star${gain === 1 ? '' : 's'} if you print now.${gain >= 1 ? '' : ` (The first star needs ${fmtBig(cash(500000))}.)`} The next star arrives at ${fmtBig(nextStarAt())}.</p>
        <p class="o-dim">Legacy: <b>${L.stars}</b> unspent of ${L.total} earned (+${2 * L.total}% income).</p>
        <button type="button" class="o-btn gold" data-act="printask" ${gain >= 1 ? '' : 'disabled'}>Go to press</button></div>`;
    else if (sub === 'challenges') body = `<h3 class="o-h">Challenge for the next printing (optional)</h3>
        <div class="o-filters"><span class="o-seg">${chips}</span></div>
        ${picked ? `<p>${picked.desc} First-clear benefit: ${challengeReward(picked)}${S.chDone[picked.id] ? ' <span class="o-dim">(already earned; replaying pays nothing)</span>' : ''}</p>` : `<p class="o-dim">${challengePrototype ? 'More constraints unlock at Printing 5 after the introduction, with reward saving enabled. The four Imprint challenges also require a founded Imprint. First clears pay the listed benefit once.' : 'Constraints make a run harder in a literary way. Each is worth stars and a permanent perk the first time you finish it.'}</p>`}
        ${masteryHTML()}
        ${masteryActive() ? '' : active}
        ${done.length ? `<h3 class="o-h">Completed perks</h3><div class="o-grid">${done.map(c => `<div class="o-card"><h3>${c.name} ✓</h3><p>${c.perk}</p></div>`).join('')}</div>` : ''}`;
    else body = `<p class="o-dim">Legacy stars unspent: <b>${L.stars}</b></p><div class="o-grid">${legCards}</div>`;
    morph($('#o-legacy'), subTabs('legacy', tabs) + body + (layers?.enabled && (S.printing >= 7 || layers.identity(S)) ? '<div class="o-card layers"><h3>Imprints</h3><p>A new room with retained Legacy and permanent Press Seal purchases.</p><button class="o-btn" data-act="layers:open">Review Imprints</button></div>' : ''));
    hydrate($('#o-legacy'));
  }

  /* ================= restorations ================= */
  const MK_BASE = [5000, 40000, 500000, 6e6, 8e7, 1e9].map(cash), MK_NAMES = ['', 'Mk II', 'Mk III'];
  const deskMk = d => 1 + .25 * (d.mk || 0);
  const mkCost = i => roundMoney(MK_BASE[i] * (S.desks[i].mk ? 12 : 1) * (chPerk('haiku') ? .8 : 1));
  /* ---- keepers: each desk's keeper can be tuned up (faster banking) with bananas ---- */
  const keeperLv = i => S.desks[i].keeper.lv || 0;
  const keeperPeriod = i => KEEPER_PERIOD[i] * Math.pow(KEEPER_UP_STEP, keeperLv(i)) / (1 + (extensions.get('minigames')?.keeperWorkBonus?.() || 0));      // seconds per banked word (the Muse multiplier is applied to the clock, not here)
  const keeperUpCost = i => roundMoney(KEEPER_UP_BASE[i] * Math.pow(KEEPER_UP_GROW, keeperLv(i)));
  function keeperCard(i, have) {
    const D = DESKS[i], lv = keeperLv(i), max = lv >= KEEPER_UP_MAX, cost = keeperUpCost(i), now = keeperPeriod(i);
    return `<div class="o-card" style="--c:${D.color}"><div class="o-row"><h3>${cart('s-keeper')}${D.name.split(' ')[0]} keeper</h3>${max ? '<span class="o-lvl">MAXED</span>' : price(cost)}</div>
      ${pips(lv, KEEPER_UP_MAX)}<p class="o-upcurrent">One word every ${now.toFixed(2)}s</p><p>When enough letters are held.${museOn('hemi') ? ' Hemingwape doubles banking speed.' : ''}</p>
      ${max ? '' : `<p class="o-upnext">Next: one word every ${(now * KEEPER_UP_STEP).toFixed(2)}s</p>`}
      ${max ? '' : `<button type="button" class="o-btn gold" data-act="buy" data-what="keeper" data-i="${i}" ${have < cost ? 'disabled' : ''}>Tune up</button>`}</div>`;
  }
  function baroCard(have) {
    const t = S.baro, descs = ['Names what the sky does next, two changes ahead, when you tap the weather or day/night gauge, and lists them on the Market page.', 'Four changes ahead, and the Market page says which titles each change will lift.'];
    if (t >= 2) return `<div class="o-card"><div class="o-row"><h3>${cart('s-baro')}Barometer</h3><span class="o-lvl">MAXED</span></div>${pips(2, 2)}<p>Forecasts four changes ahead, with the titles each one lifts.</p></div>`;
    const lock = soldCount() < 2 ? 'Needs 2 sold titles' : '';
    return `<div class="o-card"><div class="o-row"><h3>${cart('s-baro')}${t ? 'Better barometer' : 'Barometer'}</h3>${price(BARO_COST[t])}</div>${pips(t, 2)}<p>${descs[t]}</p>${lock ? `<p class="o-warn">${lock}</p>` : ''}
      <button type="button" class="o-btn gold" data-act="buy" data-what="baro" ${lock || have < BARO_COST[t] ? 'disabled' : ''}>Buy</button></div>`;
  }
  function pubCard(have) {
    const t = S.pub.tier, names = ['Publisher’s assistant', 'Fast presses', 'Night shift'];
    const descs = [`Sells your finished titles for you, one every ${PUB_PERIOD[0]} seconds, at a price you choose (on the Titles page). It never sells a title you picked by hand.`,
      `The assistant sells a title every ${PUB_PERIOD[1]} seconds.`, 'The assistant keeps selling while you are away, at an average market price.'];
    if (t >= 3) return `<div class="o-card"><div class="o-row"><h3>${cart('s-pub')}Publisher’s assistant</h3><span class="o-lvl">MAXED</span></div>${pips(3, 3)}<p>Sells a title every ${PUB_PERIOD[1]} seconds, even while you are away.</p></div>`;
    const lock = challengeShopLock('pub') || (t === 0 && soldCount() < 3 ? 'Needs 3 sold titles' : '');
    return `<div class="o-card"><div class="o-row"><h3>${cart('s-pub')}${names[t]}</h3>${price(PUB_COST[t])}</div>${pips(t, 3)}<p>${descs[t]}</p>${lock ? `<p class="o-warn">${lock}</p>` : ''}
      <button type="button" class="o-btn gold" data-act="buy" data-what="pub" ${lock || have < PUB_COST[t] ? 'disabled' : ''}>Buy</button></div>`;
  }
  function mkCard(i, have) {
    const D = DESKS[i], d = S.desks[i], next = MK_NAMES[d.mk + 1];
    return `<div class="o-card" style="--c:${D.color}"><div class="o-row"><h3>${cart(`tw-${D.id}-${d.mk || 0}`)}${D.name}${d.mk ? ' ' + MK_NAMES[d.mk] : ''}</h3>${d.mk >= 2 ? '<span class="o-lvl">MAXED</span>' : price(mkCost(i))}</div>
      <p>${d.mk >= 2 ? 'Fully restored: typists work 50% faster here and titles in this band sell for 10% more.' : `Restore to ${next}: typists here work ${d.mk ? '50' : '25'}% faster and titles in this band sell for ${d.mk ? '10' : '5'}% more.`}</p>
      ${d.mk >= 2 ? '' : `<button type="button" class="o-btn gold" data-act="buy" data-what="mk" data-i="${i}" ${challengeShopLock('mk') || have < mkCost(i) ? 'disabled' : ''}>${challengeShopLock('mk') || 'Restore'}</button>`}</div>`;
  }

  /* ================= rights market =================
     Every band has a demand multiplier that drifts. A sale pays base x demand, so you can sit on a ready title and wait for a hot market.
     Night, rain, storms and clear days each push a different band, which makes the weather and sun/moon toys matter. */
  const MK_MIN = 0.5, MK_MAX = 2.0;
  const marketFloor = () => (toolOn('agent') ? .85 : MK_MIN);
  const marketMult = b => Math.max(marketFloor(), Math.round(S.market.v[b] * 100) / 100);
  const saleContext = () => ({contracts:toolOn('contracts') ? 1.25 : 1, awards:awardMult(), desks:S.desks.map(d => 1 + .05 * (d.mk || 0)),
    legacy:legacyMult(), edition:editionMult(), minigames:1 + (extensions.get('minigames')?.titleSaleBonus?.() || 0), state:S});
  const salePay = (r, m = marketMult(r.band), on = museOn, c = saleContext()) => roundMoney(r.pay * c.contracts * c.awards * m * c.desks[r.band] * museSale(r.band,on) * c.legacy * c.edition * c.minigames * (layers?.saleFactor(c.state, r.band, on) || 1));
  function marketBias(b, sk = sky()) {
    const wx = sk.wx, night = sk.night;
    if (b === 0) return night ? .3 : 0;                       // bedtime books sell at night
    if (b === 1) return wx === 1 || wx === 2 ? .3 : 0;        // cosy reading weather
    if (b === 2) return wx === 3 ? .45 : 0;                   // dramatic stories sell in a storm
    if (b === 3) return wx === 0 && !night ? .2 : 0;          // gift books sell on sunny days
    if (b === 4) return wx === 0 && night ? .3 : 0;           // stargazing on clear nights
    return wx === 3 || (wx >= 2 && night) ? .45 : 0;          // gothic epics sell in heavy night weather
  }
  const marketNext = b => { const M = S.market; return M.v[b] + (1 + marketBias(b) - M.v[b]) * .12 + M.m[b] * .55; };
  function gardenTick() {
    const g = S.garden; if (!g.beds.some(Boolean)) return;
    const now = savedWallNow(); g.beds.forEach((b, i) => { if (b && now >= b.ready && !b.told) { b.told = true; if (!document.hidden) { IMI.sfx.tick(); newsPush(`A plot of ${b.ch} is ripe in the letter garden.`); } } });
    if (ui.tab === 'lab' || ui.tab === 'muses') mark(); else dirty = true;
  }
  /* ---- the Publisher's assistant: sells finished titles for you (Shop > Market tools, three tiers) ---- */
  let pubClock = 0;
  const pubPeriod = () => PUB_PERIOD[S.pub.tier >= 2 ? 1 : 0];
  const pubSellable = () => readyList().filter(r => challengeSaleAllowed(r) && (S.autoFocus || S.focus !== r.id) && (!pg || pg.allowsSale(pgContext, r)));          // a title you picked by hand stays yours to sell
  function pubSell() {
    if (challengeControlled() || workPaused() || (chal('patientpress') || masteryActive()) || !S.pub.tier || !S.pub.on || document.querySelector('.o-modal, .o-celebrate')) return false;
    const rule = PUB_RULES[S.pub.rule] != null ? PUB_RULES[S.pub.rule] : 1; let best = null, bp = -1;
    for (const r of pubSellable()) { if (marketMult(r.band) < rule) continue; const p = salePay(r); if (p > bp) { best = r; bp = p; } }
    if (!best) return false;
    writeTitle(best.id, null, { auto: true });
    if (ui.tab === 'press') mark();
    return true;
  }
  function pubStatus() {
    const p = S.pub; if (workPaused()) return 'Publisher paused while working on Folio, Archive restoration or Works.'; if ((chal('patientpress') || masteryActive())) return masteryActive() ? 'Publisher suspended for manual Small Crew mastery.' : 'Publisher disabled by Patient Press. Sell titles manually.'; if (!p.tier) return '';
    if (!p.on) return 'Auto-sell is off. Finished titles wait for you.';
    const rule = PUB_RULES[p.rule] != null ? PUB_RULES[p.rule] : 1, ready = pubSellable();
    if (!ready.length) return 'Waiting for a finished title.';
    const ok = ready.filter(r => marketMult(r.band) >= rule).length, held = ready.length - ok;
    if (!ok) return `Holding ${held} title${held > 1 ? 's' : ''} for a better price.`;
    return `Selling in ${Math.max(0, Math.ceil(pubPeriod() - pubClock))}s${held ? ` · holding ${held} for a better price` : ''}.`;
  }
  /* tier 3: at return, sell what finished while you were away, at an average market (x1.0), as many as the assistant could have managed */
  function autoSellAway(effSec, limit = 200, checkpoint) {
    const out = { n: 0, pay: 0 }; if (challengeActive() || workPaused() || (chal('patientpress') || masteryActive()) || S.pub.tier < 3 || !S.pub.on) return out;
    if (checkpoint) checkpoint.saleLeft ??= Math.min(limit, Math.floor(effSec / PUB_PERIOD[1]));
    for (let k = checkpoint ? checkpoint.saleLeft : Math.min(limit, Math.floor(effSec / PUB_PERIOD[1])); k > 0; k--) {
      let best = null, bp = -1; for (const r of pubSellable()) { if (pitchPrototype() && trackedPitch() && S.meta.automation.pitch.manual.pending.recipe.id === r.id) continue; const p = salePay(r, 1); if (p > bp) { best = r; bp = p; } }
      if (!best) break;
      if (checkpoint) checkpoint.saleLeft--;
      writeTitle(best.id, null, { silent: true, mult: 1 }); out.n++; out.pay += bp;
      if (!progressing()) return out;
    }
    return out;
  }
  function marketStep(silent) {
    const M = S.market;
    for (let b = 0; b < DESKS.length; b++) {
      M.m[b] = M.m[b] * .55 + (rand() - .5) * 2 * .07;
      M.v[b] = Math.max(marketFloor(), Math.min(MK_MAX, M.v[b] + (1 + marketBias(b) - M.v[b]) * .12 + M.m[b]));
      M.hist[b].push(Math.round(M.v[b] * 1000) / 1000); if (M.hist[b].length > 40) M.hist[b].shift();
      if (M.v[b] >= 1.5 && !ui.hot[b]) {
        ui.hot[b] = true;
        if (!silent && RECIPES.some(r => r.band === b && !S.written[r.id])) newsPush(`MARKET: ${DESKS[b].lo}-${DESKS[b].hi} letter titles are hot (x${M.v[b].toFixed(2)}). Publishers are throwing bananas.`);
      } else if (M.v[b] < 1.3) ui.hot[b] = false;
    }
    mark();
  }
  /* ---- the sky on the Market page: what is lifting prices now and (with a barometer) what is coming ---- */
  const BAND_NAME = DESKS.map(D => D.name.split(' ')[0]);
  const SKY_PHASE = { day: 'Day', dusk: 'Dusk', night: 'Night', dawn: 'Dawn' }, SKY_WX = ['Clear', 'Drizzle', 'Rain', 'Storm'];
  const favoured = sk => DESKS.map((_, b) => b).filter(b => marketBias(b, sk) > 0).map(b => BAND_NAME[b]);
  const clock = ms => { const t = Math.max(0, Math.ceil(ms / 1000)); return Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0'); };
  function skyCard() {
    const t = Date.now(), sk = sky(), tier = S.baro, fav = favoured(sk);
    const evs = World.next(t, tier >= 2 ? 4 : tier ? 2 : 1);
    const row = e => { const after = World.at(e.at + 1000), lift = favoured(after);
      return tier ? `<div class="o-row o-left"><b>${clock(e.at - t)}</b><span>${World.label(e)}${tier >= 2 ? (lift.length ? ` · lifts ${lift.join(', ')}` : ' · lifts nothing') : ''}</span></div>` : `<div class="o-row o-left"><b>${clock(e.at - t)}</b><span class="o-dim">the sky changes</span></div>`; };
    return `<div class="o-card o-skycard"><div class="o-row"><h3>The sky</h3><span class="o-dim">${SKY_PHASE[sk.phase]} · ${SKY_WX[sk.wx]}</span></div>
      <p>${fav.length ? `Lifting ${fav.join(', ')} titles right now.` : 'No band is lifted right now.'}</p>${evs.map(row).join('')}
      ${tier < 2 ? `<p class="o-dim">${tier ? 'A better barometer' : 'A barometer'} (Shop) ${tier ? 'looks further ahead and names the titles each change lifts' : 'names what is coming'}.</p>` : ''}</div>`;
  }
  /* one line on the Floor: what the sky is doing to your crew and the market */
  function skyLine() {
    const sk = sky(), bits = [];
    if (sk.night) bits.push('Owls +40%'); else bits.push('Owls -10%');
    if (sk.wx === 3) bits.push('Storm: typists half speed'); else if (sk.wx >= 1) bits.push('Rain Lovers +30%');
    const fav = favoured(sk); if (fav.length) bits.push('lifts ' + fav.join(', '));
    return `<b>${SKY_PHASE[sk.phase]}, ${SKY_WX[sk.wx].toLowerCase()}</b> · ${bits.join(' · ')}`;
  }
  function marketHTML() {
    const M = S.market, rows = DESKS.map((D, b) => {
      const v = marketMult(b), h = M.hist[b], prev = h.length > 1 ? h[h.length - 2] : v, dir = v > prev + .004 ? 'up' : v < prev - .004 ? 'down' : 'flat';
      const bars = h.slice(-24).map(x => `<i style="height:${Math.round(Math.max(6, Math.min(100, (x - .4) / 1.7 * 100)))}%"></i>`).join('');
      const nx = toolOn('analyst') ? marketNext(b) : null, fc = nx === null ? '' : `<span class="o-dim o-fc">soon: ${nx > v + .01 ? 'rising' : nx < v - .01 ? 'falling' : 'steady'}</span>`;
      const tag = v >= 1.5 ? '<span class="o-mtag hot">HOT</span>' : v <= .8 ? '<span class="o-mtag cold">COLD</span>' : '';
      const any = RECIPES.some(r => r.band === b), left = any ? RECIPES.filter(r => r.band === b && !S.written[r.id] && inPlay(r)).length : 1;
      return `<div class="o-mrow${left ? '' : ' done'}" style="--bc:${D.color}"><span class="o-mname"><b>${D.name.split(' ')[0]}</b><small>${D.lo}–${D.hi} letters${any ? (left ? '' : ' · all sold') : ' · pitch to unlock'}</small></span><span class="o-spark" aria-hidden="true">${bars}</span><span class="o-mval"><i class="o-arr ${dir}"></i>x${v.toFixed(2)}</span><span class="o-mextra">${tag}${fc}</span></div>`;
    }).join('');
    return `<div class="o-card o-market"><div class="o-row"><h3>Rights market</h3><span class="o-dim">sales pay base x demand</span></div>${rows}
      <p class="o-dim">Demand drivers: night lifts Bamboo, rain lifts Hibiscus, storms lift Lagoon, a clear day lifts Honeycomb, a clear night lifts Orchid, and a stormy night lifts Moonflower. The sky follows its own clock, so plan around it.</p></div>`;
  }

  /* ================= awards ================= */
  const AW = (id, tier, name, desc, test) => ({ id, tier, name, desc, test });
  const totalPaws = () => S.desks.reduce((a, d) => a + d.paws, 0);
  const AWARDS = [
    AW('l100', 0, 'Warming Up', 'Type 100 letters', () => S.stats.letters >= 100),
    AW('l1k', 0, 'Ink Fingers', 'Type 1,000 letters', () => S.stats.letters >= 1000),
    AW('l10k', 1, 'Ribbon Burner', 'Type 10,000 letters', () => S.stats.letters >= 10000),
    AW('l100k', 2, 'Infinite Monkey', 'Type 100,000 letters', () => S.stats.letters >= 100000),
    AW('c10', 0, 'Tap Dancer', 'Reach a x10 tap streak', () => S.best >= 10),
    AW('c50', 1, 'Key Storm', 'Reach a x50 tap streak', () => S.best >= 50),
    AW('c100', 1, 'Thumb Marathon', 'Reach a x100 tap streak', () => S.best >= 100),
    AW('c200', 2, 'Monkey Mania', 'Reach a x200 tap streak', () => S.best >= 200),
    AW('w10', 0, 'Word Hoarder', 'Bank 10 words', () => S.stats.words >= 10),
    AW('w100', 1, 'Lexicon', 'Bank 100 words', () => S.stats.words >= 100),
    AW('w1k', 2, 'Thesaurus', 'Bank 1,000 words', () => S.stats.words >= 1000),
    AW('s1', 0, 'First Printing', 'Sell your first title', () => soldCount() >= 1),
    AW('s4', 0, 'Back List', 'Sell 4 titles', () => soldCount() >= 4),
    AW('s8', 1, 'Prolific', 'Sell 8 titles', () => soldCount() >= 8),
    AW('s12', 1, 'Bestselling Author', 'Sell 12 titles', () => soldCount() >= 12),
    AW('s16', 2, 'The Complete Works', 'Sell every authored title', () => authoredSold() >= BOOKS),
    AW('k10', 0, 'Story Time', 'Sell 10 kids’ books', () => kidsSold() >= 10),
    AW('k50', 1, 'Reading Corner', 'Sell 50 kids’ books', () => kidsSold() >= 50),
    AW('k300', 2, 'Library Card', 'Sell all ' + KIDS.length + ' kids’ books', () => KIDS.length > 0 && kidsSold() >= KIDS.length),
    AW('m25', 0, 'Middle Shelf', 'Sell 25 library stories', () => libSold() >= 25),
    AW('m150', 1, 'Stacks Regular', 'Sell 150 library stories', () => libSold() >= 150),
    AW('m900', 2, 'Head Librarian', 'Sell all ' + LIBS.length + ' library stories', () => LIBS.length > 0 && libSold() >= LIBS.length),
    AW('d1', 0, 'In the Pink', 'Install Hibiscus Ribbon', () => S.desks[1].owned),
    AW('d2', 1, 'Making Waves', 'Install Lagoon Sprint', () => S.desks[2].owned),
    AW('d3', 2, 'Sweet as Honey', 'Install Honeycomb Ledger', () => S.desks[3].owned),
    AW('p8', 0, 'Typing Pool', 'Employ 8 typists', () => totalPaws() >= 8),
    AW('p20', 1, 'Open-Plan Office', 'Employ 20 typists', () => totalPaws() >= 20),
    AW('p40', 2, 'Monkey Business', 'Employ 40 typists', () => totalPaws() >= 40),
    AW('g1', 0, 'Shiny!', 'Catch a golden banana', () => S.gold >= 1),
    AW('g10', 1, 'Banana Spotter', 'Catch 10 golden bananas', () => S.gold >= 10),
    AW('g25', 2, 'Gold Rush', 'Catch 25 golden bananas', () => S.gold >= 25),
    AW('r1', 0, 'Rotten Luck', 'Touch a rotten banana', () => S.stats.rotten >= 1),
    AW('deal', 2, 'Mogul', 'Sign every publishing deal', () => DEALS.every(x => S.deals[x.id])),
    AW('storm', 1, 'Stormy Weather', 'Type 50 letters during a storm', () => S.stats.storm >= 50),
    AW('night', 0, 'Night Owl', 'Type 100 letters at night', () => S.stats.night >= 100),
    AW('b10k', 0, 'Banana Stand', `Hold ${fmt(cash(1e4))} bananas`, () => bananas.get() >= cash(1e4)),
    AW('b1m', 1, 'Banana Republic', `Hold ${fmt(cash(1e6))} bananas`, () => bananas.get() >= cash(1e6)),
    AW('b1b', 2, 'Banana Empire', `Hold ${fmt(cash(1e9))} bananas`, () => bananas.get() >= cash(1e9)),
    AW('keep', 0, 'Auto Clerk', 'Have a keeper bank 25 words', () => S.stats.words >= 25),
    AW('hold', 0, 'Heavy Hitter', 'Buy Hold to type', () => S.hold),
    AW('away1', 0, 'Welcome Back', 'Return after an hour away', () => (S.stats.awayMax || 0) >= 3600),
    AW('lamp3', 1, 'Night Light', 'Fully upgrade the Night Lamp', () => S.lamp >= 3),
    AW('mk15', 1, 'Market Timing', 'Sell a title at x1.5 or better', () => (S.stats.bestMult || 0) >= 1.5),
    AW('mk19', 2, 'Perfect Pitch', 'Sell a title at x1.9 or better', () => (S.stats.bestMult || 0) >= 1.9),
    AW('lv5', 0, 'Promotion', 'Get a typist to level 5', () => maxLevel() >= 5),
    AW('lv10', 1, 'Master Typist', 'Get a typist to level 10', () => maxLevel() >= 10),
    AW('hat1', 0, 'Dapper', 'Put a hat on a typist', () => S.desks.some(d => d.crew.some(t => t.hat))),
    AW('d4', 2, 'Orchid Season', 'Install Orchid Imperial', () => S.desks[4].owned),
    AW('d5', 2, 'Moonstruck', 'Install Moonflower Grand', () => S.desks[5].owned),
    AW('p1', 0, 'Pitch Perfect', 'Commission a pitched title', () => (S.stats.pitched || 0) >= 1),
    AW('p10', 1, 'Idea Factory', 'Sell 10 pitched titles', () => (S.stats.pitchSold || 0) >= 10),
    AW('p50', 2, 'Literary Empire', 'Sell 50 pitched titles', () => (S.stats.pitchSold || 0) >= 50),
    AW('mk1', 0, 'Restoration Drama', 'Restore a typewriter to Mk II', () => S.desks.some(d => d.mk >= 1)),
    AW('mk3', 1, 'Concours d\'Elegance', 'Restore a typewriter to Mk III', () => S.desks.some(d => d.mk >= 2)),
    AW('dv1', 0, 'On Air', 'Release your first manuscript', () => totalReleased() >= 1),
    AW('dv100', 1, 'Back Catalogue', 'Release 100 manuscripts', () => totalReleased() >= 100),
    AW('dv5', 2, 'Media Mogul', 'Run all five divisions', () => DIVS.every(D => divCount(D) > 0)),
    AW('dvall', 2, 'The Whole Catalogue', 'Release every manuscript of one format', () => DIVS.some(D => divOrder[D.id] && divCount(D) >= divOrder[D.id].length)),
    AW('mu1', 0, 'Patron of the Arts', 'Invite your first Muse', () => MUSES.some(m => S.muses.owned[m.id])),
    AW('mu3', 1, 'Full Salon', 'Seat three Muses at once', () => S.muses.seated.slice(0, 3).filter(Boolean).length >= 3),
    AW('gar1', 0, 'Green Thumb', 'Harvest your first letters', () => (S.stats.harvested || 0) >= 1),
    AW('gar500', 1, 'Letter Farmer', 'Harvest 500 letters', () => (S.stats.harvested || 0) >= 500),
    AW('pr1', 1, 'Second Printing', 'Complete a printing', () => S.printing >= 1),
    AW('pr3', 2, 'Collector\'s Edition', 'Complete three printings', () => S.printing >= 3),
    AW('ch1', 1, 'Constraint Satisfied', 'Finish an Oulipo challenge', () => Object.keys(S.chDone).length >= 1),
    AW('ch4', 2, 'Oulipian', 'Finish all four Oulipo challenges', () => ['vowel', 'haiku', 'hands', 'timed'].every(id => S.chDone[id])),
    AW('roy100', 1, 'Passive Income', `Earn ${fmt(cash(100))} bananas per second in royalties`, () => royBase() >= cash(100)),
    AW('roy1m', 1, 'Mailbox Money', `Earn ${fmt(cash(1e6))} bananas in royalties`, () => S.royTotal >= cash(1e6))
  ];
  /* app-style achievement cards slide in under the top bar and stack */
  function achieve(a) {
    if (document.querySelector('.o-celebrate, .o-modal')) return void setTimeout(() => achieve(a), 700);   // wait for the big moment to finish
    let box = document.querySelector('.o-achs');
    if (!box) { box = document.createElement('div'); box.className = 'o-achs'; box.setAttribute('aria-live', 'polite'); document.body.appendChild(box); }
    const el = document.createElement('button'); el.type = 'button'; el.className = `o-ach t${a.tier}`;
    el.innerHTML = `${ico('trophy' + a.tier, 40)}<span><small>${a.tier === 2 ? 'GOLD AWARD' : 'AWARD UNLOCKED'}</small><b>${esc(a.name)}</b><em>${esc(a.desc)} · +1% income</em></span>`;
    hydrate(el); box.appendChild(el);
    while (box.children.length > 3) box.firstElementChild.remove();
    el.addEventListener('click', () => { el.remove(); ui.sub.records = 'awards'; setTab('records'); });
    const r = el.getBoundingClientRect(); setTimeout(() => { if (!el.isConnected) return; IMI.burst(r.left + 30, r.top + r.height / 2, ['star', 'spark'], 8); }, 380);
    setTimeout(() => { if (IMI.reduceMotion) return el.remove(); el.classList.add('out'); el.addEventListener('animationend', () => el.remove(), { once: true }); }, 4200);
  }
  const allAwards = () => expanded ? [...AWARDS,...expanded.rows,...(funding?.rows || [])] : AWARDS;
  function expandedManual(s) {
    const helper = extensions.get('automation') || (window.__OPS_EXTENSIONS || []).find(([id]) => id === 'automation')?.[1];
    if (s.meta.automation === undefined) return true;
    if (!helper) return false;
    return helper.validConfig(s.meta.automation, {gardenEnabled:() => true,pitchEnabled:() => true,mediaEnabled:() => true,museEnabled:() => true,
      validPitch,validMedia,automationDesks:() => DESKS.map((d,index) => ({id:d.id,index}))});
  }
  function expandedAccess(id) {
    if (!expanded || !S.intro.done || !tabVisible('records')) return false;
    const gates = {
      'lg02e-stamps-four':() => funding && layers?.enabled && tabVisible('imprints'),
      'lg02e-stamps-six':() => funding && layers?.enabled && tabVisible('imprints'),
      'lg02e-estate-three':() => funding && window.Estate?.enabled && tabVisible('estate'),
      'lg02e-archive-three':() => funding && archiveFeature?.enabled && tabVisible('archive'),
      'lg02e-manual-gold':() => funding && masteryEnabled() && tabVisible('legacy'),
      'lg02e-works-quarter':() => funding && worksPlay?.enabled && tabVisible('works-play'),
      'lg02e-works-half':() => funding && worksPlay?.enabled && tabVisible('works-play'),
      'lg10-folio-trio':() => folio?.enabled && (S.printing >= 3 || layers?.charter(S)) && tabVisible('press'),
      'lg10-room-quartet':() => challengePrototype && tabVisible('legacy'),
      'lg10-two-stamps':() => layers?.enabled && tabVisible('imprints'),
      'lg10-mixed-shelf':() => layers?.enabled && tabVisible('imprints'),
      'lg10-imprint-quartet':() => gardenPrototype() && tabVisible('legacy'),
      'lg10-manual-pair':() => gardenPrototype() && tabVisible('lab') && tabVisible('press'),
      'lg10-manual-quartet':() => gardenPrototype() && ['lab','press','studios','muses'].every(tabVisible),
      'lg10-estate-two':() => window.Estate?.enabled && tabVisible('estate'),
      'lg10-archive-pair':() => archiveFeature?.enabled && tabVisible('archive'),
      'lg10-works-ten':() => worksPlay?.enabled && tabVisible('works-play')
    };
    return !!gates[id]?.();
  }
  function unlockAward(a, silent) {
    if (expanded?.row(a.id) || funding?.row(a.id)) { if (!writer.expandedDiscover(a.id)) return; }
    else { S.awards[a.id] = true;
    extensionEvent('award', { id: a.id, tier: a.tier, silent: !!silent }); }
    if (!progressing()) return;
    if (introActive()) { mark(); save(); return; }
    if (silent) return;
    ui.unseen++; IMI.sfx.ding(); vib([10, 20, 10]);
    logIt(`Award unlocked: ${a.name} (${a.desc.toLowerCase()}).`);
    newsPush(`AWARD: “${a.name}” goes to the monkeys. Income up 1%; modesty down 100%.`);
    achieve(a);
    if (a.tier === 2) IMI.banner(PX ? 'GOLD AWARD!' : 'Gold Award!');
    mark(); save();
  }
  function checkAwards(silent) { for (const a of allAwards()) { if (!progressing()) return; if (!S.awards[a.id] && (expanded?.row(a.id) || funding?.row(a.id) ? expandedAccess(a.id) && writer.expandedReady(a.id) : a.test())) unlockAward(a, silent); } }
  const trophyHTML = () => {
    const got = allAwards().filter(a => S.awards[a.id]);
    return `<div class="o-trophies">${got.map(a => `<span class="o-trophy" title="${esc(a.name)}: ${esc(a.desc)}">${ico('trophy' + a.tier, 30)}</span>`).join('') || '<span class="o-dim">No awards yet. Keep typing.</span>'}</div>`;
  };

  // Read-only facts use the same metrics and purchase/list gates as the live departments.
  function goalFacts() {
    const owned = S.desks.filter(d => d.owned), visible = Object.fromEntries(TABS.map(([id]) => [id, tabVisible(id)]));
    const available = r => !S.written[r.id] && inPlay(r) && lockedDesk(r) === undefined;
    return {
      visible, revealed: S.intro.done && tabVisible('records'), currentTab: ui.tab,
      metrics: { letters:S.stats.letters, streak:S.best, words:S.stats.words, sold:soldCount(), authored:authoredSold(),
        kids:kidsSold(), library:libSold(), crew:totalPaws(), wallet:bananas.get(), level:maxLevel(),
        pitched:S.stats.pitched || 0, pitchSold:S.stats.pitchSold || 0, restoration:Math.max(...owned.map(d => d.mk)),
        releases:totalReleased(), divisions:DIVS.filter(D => divCount(D) > 0).length,
        muses:MUSES.filter(m => S.muses.owned[m.id]).length, seats:S.muses.seated.slice(0,3).filter(Boolean).length,
        harvested:S.stats.harvested || 0, printing:S.printing, challenges:challengeCatalog().filter(c => S.chDone[c.id]).length,
        royalties:royBase(), royaltyTotal:S.royTotal, deals:DEALS.filter(d => S.deals[d.id]).length, lamp:S.lamp },
      totals: { authored:BOOKS, kids:KIDS.length, library:LIBS.length, deals:DEALS.length, challenges:challengeCatalog().length },
      capacity: { crew:owned.reduce((n,d) => n + upCap(UPS.find(u => u.k === 'paw'),d),0),
        authored:RECIPES.filter(r => !r.kid && !r.lib && !r.gen && lockedDesk(r) === undefined).length,
        kids:KIDS.filter(r => lockedDesk(r) === undefined).length, library:LIBS.filter(r => lockedDesk(r) === undefined).length },
      reachable: { typing:S.intro.done && !chal('hands'), words:keepersReady(),
        letters:S.intro.done && (!chal('hands') || owned.some(d => d.paws > 0)),
        crew:owned.some(d => d.paws < upCap(UPS.find(u => u.k === 'paw'),d)), level:owned.some(d => d.paws > 0),
        hat:owned.some(d => d.paws > 0) && HATS.some(hatOpen),
        sold:RECIPES.some(r => !r.kid && !r.lib && available(r)), authored:RECIPES.some(r => !r.kid && !r.lib && !r.gen && available(r)),
        kids:KIDS.some(available), library:LIBS.some(available),
        desks:S.desks.map((d,i) => i > 0 && !d.owned && S.desks[i-1].owned && !((chal('haiku') || masteryActive()) && i >= 2)),
        pitch:soldCount() >= 1 && (pitchActive() < PITCH_MAX || RECIPES.some(r => r.gen && available(r))),
        restoration:owned.some(d => d.mk < 2), media:DIVS.some(D => divUnlocked(D) && divCount(D) < divCap(D)),
        allDivisions:DIVS.every(divUnlocked), catalogue:DIVS.some(D => divUnlocked(D) && divOrder[D.id]?.length > 0 && divCount(D) < divOrder[D.id].length),
        muse:soldCount() >= 3, seats:museSlots() >= 3,
        garden:S.garden.beds.length > 0,
        printing:starsNow() >= 1, challenge:!!S.challenge || starsNow() >= 1,
        deal:DEALS.every(d => S.deals[d.id] || soldCount() >= d.need) },
      desks:DESKS.map(d => d.name)
    };
  }

  function renderRecords() {
    const focusedAward = writer && document.activeElement?.closest('.o-award')?.id;
    const st = S.stats, top = Object.entries(st.byLetter).sort((a, b) => b[1] - a[1])[0];
    const mins = Math.floor(st.secs / 60), played = mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m ${Math.floor(st.secs % 60)}s`;
    const row = (k, v) => `<div class="o-row"><span>${k}</span><b>${v}</b></div>`;
    const sorted = [...allAwards()].sort((a, b) => (!!S.awards[b.id] - !!S.awards[a.id]));
    const tabs = [['awards', 'Awards'], ['stats', 'Stats'], ['log', 'Log']];
    if (!tabs.some(t => t[0] === ui.sub.records)) ui.sub.records = 'awards';
    const sub = ui.sub.records;
    tabs[0].push(sub !== 'awards' && ui.unseen ? ui.unseen : 0);
    if (sub === 'awards') ui.unseen = 0;
    const awardsHTML = `${writer ? writer.awardsHeader() : ''}<p class="o-lede"><b>${cnt('r-aw', awardCount())}/${allAwards().length}</b> awards, <b>+${cnt('r-aw2', awardCount())}%</b> income (each adds 1%).</p>
      <div class="o-awards">${sorted.map((a, n) => { const on = !!S.awards[a.id]; return `<div ${writer ? `id="o-award-${a.id}" tabindex="-1"` : ''} class="o-award t${a.tier}${on ? '' : ' locked'}" style="--n:${n}">${ico(on ? 'trophy' + a.tier : 'trophy0', 36)}<span><b>${esc(a.name)}</b><small>${esc(a.desc)}</small>${writer ? writer.rewardLine(a.id) : ''}</span></div>`; }).join('')}</div>`;
    const logHTML = `<ol class="o-log">${S.log.map(t => `<li>${esc(t)}</li>`).join('') || '<li class="o-dim">Nothing yet. Go type something.</li>'}</ol>`;
    const statsHTML = `
      <div class="o-grid">
        <div class="o-card"><h3>Typing</h3>${row('Letters typed', cnt('r-let', st.letters))}${row('By hand', cnt('r-man', st.manual))}${row('By typists', cnt('r-aut', st.letters - st.manual))}${row('Favourite letter', top ? `${top[0]} (${fmt(top[1])})` : '-')}${row('Best tap streak', 'x' + cnt('r-best', S.best))}${row('Words banked', cnt('r-wds', st.words))}${row('Letters harvested', cnt('r-hv', st.harvested || 0))}</div>
        <div class="o-card"><h3>Publishing</h3>${row('Titles sold', `${authoredSold()}/${BOOKS}${S.stats.pitchSold ? ' + ' + S.stats.pitchSold + ' pitched' : ''}`)}${row('Rights sales', cnt('r-lump', st.lump, true))}${row('Royalties earned', cnt('r-roy', S.royTotal, true))}${row('Royalties now', fmtRate(royRate()) + '/s')}${row('Deals signed', `${DEALS.filter(x => S.deals[x.id]).length}/${DEALS.length}`)}${row('Division income', fmtRate(divRate()) + '/s')}${row('Manuscripts released', cnt('r-man2', totalReleased()))}${row('Printings completed', S.printing)}${row('Legacy stars', `${S.legacy.stars} (${S.legacy.total} earned)`)}${row('Best sale price', 'x' + (st.bestMult || 1).toFixed(2))}</div>
        <div class="o-card"><h3>Luck &amp; time</h3>${row('Golden bananas caught', cnt('r-gold', S.gold))}${row('Rotten bananas touched', cnt('r-rot', st.rotten))}${row('Typed in storms', cnt('r-storm', st.storm))}${row('Typed at night', cnt('r-night', st.night))}${row('Time on the floor', played)}</div>
      </div>`;
    morph($('#o-records'), subTabs('records', tabs) + (sub === 'awards' ? awardsHTML : sub === 'stats' ? statsHTML : logHTML));
    hydrate($('#o-records'));
    if (focusedAward && document.activeElement?.id !== focusedAward) document.getElementById(focusedAward)?.focus({ preventScroll:true });
  }

  /* ================= news ticker ================= */
  const NEWS = [
    'Local monkey demands better ribbon. Management offers a banana.',
    'BREAKING: Typist spotted napping on the Q key. Q is fine.',
    'The letter E reports a record workload and requests a day off.',
    'Jungle Press confirms every word is a real word, probably.',
    'Study: 9 out of 10 monkeys prefer typing to Shakespeare. The tenth is on a break.',
    'Banana prices steady as demand for fiction holds.',
    'Scientists confirm infinite monkeys remain infinitely busy.',
    'Typewriter ribbons unionize. Talks stall over ink.',
    'Vine inspector finds the vines “mostly vine-like”.',
    'Coconut R&D denies rumours of a coconut-powered typewriter. For now.',
    'Letter Z feels left out again. A committee has been formed.',
    'Tip line: if a monkey types “ape”, it is probably an ape.'
  ];
  const ticker = { q: [], anim: null, recent: [], timer: 0 };
  function headlinePool() {
    const out = NEWS.slice(), sold = Object.keys(S.written).filter(id => RBY[id]).map(id => RBY[id]), n = sold.length, paws = totalPaws();
    if (n) { const r = sold[Math.floor(rand() * n)]; out.push(`Critics call “${r.title}” “a bold reimagining” and also “short”.`, `Readers demand a sequel to “${r.title}”. The rights are sold; readers are told to cope.`); }
    const allCrew = S.desks.flatMap(d => d.crew || []);
    if (allCrew.length) { const t = allCrew[Math.floor(rand() * allCrew.length)]; out.push(`${t.name} (${TRAITS[t.trait].name}) was seen reorganizing the ribbon drawer.`); if (levelOf(t.xp) >= 3) out.push(`${t.name} is level ${levelOf(t.xp)} and has started giving other monkeys advice.`); }
    if (paws === 0) out.push('The Bamboo Classic sits idle. Experts recommend a monkey. Or a finger.');
    if (paws >= 5) out.push(`The typing pool reaches ${paws} monkeys. HR is overwhelmed.`);
    if (paws >= 20) out.push(`${paws} typists now employed; the break room is mostly banana peels.`);
    if (stormy()) out.push('Storm warning: typists clinging to vines. Spelling affected.');
    else if (sky().wx > 0) out.push('Rain delays typing. Monkeys in leaf hats report improved morale.');
    if (isNight()) out.push('Night shift begins. Fireflies file for overtime.');
    if (royBase() > 0) out.push(`Royalties reach ${fmtRate(royRate())} bananas per second. Accountants dizzy.`);
    out.push('Word keepers keep words. Experts call this “keeping”.');
    if (S.hold) out.push('New study: holding a key is also a kind of typing.');
    const bankN = Object.values(S.bank).reduce((a, b) => a + b, 0); if (bankN > 30) out.push(`The word bank holds ${bankN} words. Several are lonely.`);
    if (S.best >= 50) out.push(`Tap champion reaches x${S.best}. Thumbs have filed for appeal.`);
    if (S.gold) out.push(`Golden banana sightings reach ${S.gold}. Authorities remain baffled.`);
    S.market.v.forEach((v, b) => { if (v >= 1.4) out.push(`Publishers scramble for ${DESKS[b].lo}-${DESKS[b].hi} letter titles (x${v.toFixed(2)}).`); else if (v <= .8) out.push(`Bookshops overstocked with ${DESKS[b].lo}-${DESKS[b].hi} letter titles; prices sag.`); });
    if (totalReleased() > 0) out.push(`IMI Studios has released ${fmt(totalReleased())} manuscripts. Nobody has read them all, including the authors.`);
    if (S.muses.seated.some(Boolean)) out.push('The Muse Salon reports record attendance. Snacks are running low.');
    if (S.garden.beds.some(Boolean)) out.push('Coconut R&D confirms letters grow better when you talk to them. Kindly.');
    if (S.printing > 0) out.push(`Printing ${S.printing + 1} is under way. The first editions have been moved to the good shelf.`);
    if (S.challenge) out.push(`The ${chDef(S.challenge.id).name} constraint has the monkeys writing with one hand tied behind their back. They have four.`);
    if (S.desks[1].owned) out.push('Hibiscus Ribbon installed. Pink is now a typing speed.');
    if (S.desks[2].owned) out.push('Lagoon Sprint reportedly “very sprinty”.');
    if (S.desks[3].owned) out.push('Honeycomb Ledger arrives. Bees demand royalties.');
    if (S.desks[4].owned) out.push('Orchid Imperial installed. It types words so long the paper needs a sequel.');
    if (S.desks[5].owned) out.push('Moonflower Grand arrives. Nobody dares to type a short word on it.');
    if (awardCount() >= 5) out.push(`The trophy shelf holds ${awardCount()} awards and has begun to wobble.`);
    if (authoredSold() >= BOOKS) out.push('THE COMPLETE WORKS are complete. Monkeys request a longer shelf.');
    { const f = focusRecipe(); if (f) out.push(`Typists heard whispering words from “${f.title}”.`); }
    return out;
  }
  function nextHeadline() {
    const pool = headlinePool().filter(h => !ticker.recent.includes(h)), h = pool[Math.floor(rand() * pool.length)] || NEWS[0];
    ticker.recent.push(h); if (ticker.recent.length > 8) ticker.recent.shift(); return h;
  }
  function startNews(text) {
    const el = $('#oTkrText'); if (!el) return;
    clearTimeout(ticker.timer); if (ticker.anim) { ticker.anim.onfinish = null; ticker.anim.cancel(); ticker.anim = null; }
    el.textContent = text || ticker.q.shift() || nextHeadline();
    $('#oTicker').classList.toggle('hot', /^(EXTRA|AWARD|GOLDEN|SECOND|A SHINY|A banana crate)/i.test(el.textContent));   // breaking news gets a red tag
    if (IMI.reduceMotion) { el.style.transform = 'none'; ticker.timer = setTimeout(() => startNews(), 9000); return; }
    const vw = el.parentElement.clientWidth || 600, tw = el.scrollWidth, speed = vw < 500 ? 55 : 80;
    ticker.anim = el.animate([{ transform: `translateX(${vw}px)` }, { transform: `translateX(${-tw}px)` }], { duration: (vw + tw) / speed * 1000, easing: 'linear' });
    ticker.anim.onfinish = () => startNews();
  }
  function newsPush(text) { ticker.q.push(text); if (ticker.q.length > 3) ticker.q.shift(); startNews(); }
  IMI.news = newsPush;

  /* ================= offline progress =================
     While the page is closed or hidden the typists nap at reduced effort, keepers keep banking, and royalties keep trickling in.
     The Night Lamp raises how long and how hard they work. */
  const LAMP = [{ cost: 5000, cap: 4, eff: .5 }, { cost: 60000, cap: 8, eff: .6 }, { cost: 750000, cap: 16, eff: .7 }].map(x => ({ ...x, cost: cash(x.cost) }));
  const awayCap = () => Math.max((S.lamp ? LAMP[S.lamp - 1].cap : 2) * 3600, window.VaultPlay?.enabled() ? VaultPlay.cap(S) : 0);
  const awayEff = () => (S.lamp ? LAMP[S.lamp - 1].eff : .4) + (museOn('woolf') ? .15 : 0);
  const dur = sec => { const h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60); return h ? `${h}h ${m}m` : `${Math.max(1, m)}m`; };
  /* Offline work is simulated in bulk, not letter by letter: sample the letter mix once per step, add whole batches, bank words in bulk. */
  function offlineDist(d, i) {
    const up = d.up, k = d.keeper, mix = []; let r = 1;
    const fr = focusRecipe(d) ? focusNeeds(d, i).missing : null;
    if (fr && Object.keys(fr).length) { const p = UPV.practice[up.practice] * r; mix.push([fr, p]); r -= p; }
    if (k.owned && up.stock) { const m = completers(d, i, w => goalWord(w) && goalTarget(d, w) > 0 && stock(w) < goalTarget(d, w)); if (Object.keys(m).length) { const p = UPV.stock[up.stock] * r; mix.push([m, p]); r -= p; } }
    if (up.ink) { const m = completers(d, i, w => goalWord(w) && !stock(w)); if (Object.keys(m).length) { const p = UPV.ink[up.ink] * r; mix.push([m, p]); r -= p; } }
    const q = chal('vowel') ? 0 : Math.max(UPV.vowel[up.vowel], museOn('dick') ? .3 : 0), base = {}, F = freqNow();
    for (const ch in F) base[ch] = F[ch] * (VOWELS.includes(ch) ? 1 + 1.5 * q : 1);
    mix.push([base, r]);
    const out = {};
    for (const [m, p] of mix) { let t = 0; for (const ch in m) t += m[ch]; for (const ch in m) out[ch] = (out[ch] || 0) + p * m[ch] / t; }
    return out;
  }
  function keeperBulk(d, i, lim, work) {
    if (worksActive() || !keepersReady()) return 0;
    let banked = 0; const words = BAND_WORDS[i], r = focusRecipe(d);
    const bankN = (w, c) => {
      const cn = lcount(w);
      for (const ch in cn) { d.letters[ch] -= cn[ch] * c; if (d.letters[ch] <= 0) delete d.letters[ch]; }
      S.bank[w] = stock(w) + c; bankV++; S.stats.words += c; banked += c;
    };
    if (r) for (const w of words) {
      if (!r.need[w]) continue;
      const c = Math.min(makeCopies(d, w), r.need[w] - stock(w), lim - banked); if (c > 0) bankN(w, c);
      if (banked >= lim) return banked;
    }
    if (folioGoal() || pg?.active(pgContext)) return banked;
    const reserved = r ? focusNeeds(d, i).oneCopy : {};
    for (let pass = work ? work.pass : 0; pass < 12 && banked < lim; pass++) {
      let any = work ? work.any : false;
      for (let wi = work ? work.word : 0; wi < words.length; wi++) {
        if (banked >= lim) break;
        const w = words[wi]; if (work) work.word = wi + 1;
        const t = target(d, w); if (t <= 0 || stock(w) >= t || !canMake(d, w)) continue;
        const c = lcount(w); let safe = true;
        for (const ch in c) { const have = d.letters[ch] || 0; if (have - c[ch] < Math.min(have, reserved[ch] || 0)) { safe = false; break; } }
        if (!safe) continue;
        bankN(w, 1); any = true; if (work) work.any = true;
      }
      if (work && work.word < words.length) return banked;
      if (work) { work.word = 0; work.any = false; work.pass = pass + (any ? 1 : 0); }
      if (!any) break;
    }
    return banked;
  }
  let boundaryJob = null, historicalEnd = null, boundaryProposal = null;
  const savedWallNow = () => historicalEnd ?? boundaryJob?.displayEnd ?? Date.now();
  function simulateAway(awaySec, fixedEnd = null) {
    if (!progressing()) return;
    S.desks.forEach(ensureCrew);
    let cp = writer ? S.rewards.awayCheckpoint : null;
    if (cp && (cp.version !== 1 || !Number.isFinite(cp.awaySec) || !Number.isFinite(cp.sec) || cp.sec < 0 ||
        !Number.isFinite(cp.multiplier) || cp.multiplier <= 0 || !Number.isFinite(cp.nowMs) || !Number.isInteger(cp.st) ||
        !['early','advance','work','sale','challenge','expiry','next','tail','tray','market','roy','div','archive','bulk','complete'].includes(cp.phase))) {
      writer.checkpointFailure(); return;
    }
    if (cp) awaySec = cp.awaySec;
    const cap = cp ? cp.cap : awayCap(), eff = cp ? cp.eff : awayEff(), sec = cp ? cp.sec : Math.min(awaySec, cap);
    const rep = cp ? cp.report : { away: awaySec, counted: sec, capped: awaySec > cap, letters: 0, words: 0, roy: 0, ready: 0 };
    const multiplier = cp ? cp.multiplier : speed(), workSec = sec * multiplier;
    const steps = Math.max(1, Math.min(300, Math.ceil(sec / 20))), realDt = sec / steps, dt = workSec / steps, words0 = cp ? cp.words0 : S.stats.words;
    // Positive-duration speed changes opt into timed ordering; zero/default calls retain bulk behavior.
    const timed = cp ? cp.timed : sec > 0 && multiplier !== 1 && chal('timed');
    const deadline = cp ? cp.deadline ?? Infinity : timed ? (chDef('timed').minutes * 60 - ((fixedEnd ?? Date.now()) - awaySec * 1000 - S.challenge.start) / 1000) / multiplier : Infinity;
    const slots = timed && S.pub.tier >= 3 && S.pub.on ? Math.min(200, Math.floor(workSec * eff / PUB_PERIOD[1])) : 0;
    const saleTimes = cp ? cp.saleTimes : Array.from({ length: slots }, (_, i) => (i + 1) * PUB_PERIOD[1] / (multiplier * eff));
    const boundaries = cp ? cp.boundaries : timed ? [...new Set([0, ...Array.from({ length: steps }, (_, i) => (i + 1) * realDt), ...saleTimes, Math.max(0, Math.min(sec, deadline))])].sort((a, b) => a - b) : null;
    const sold = cp ? cp.sold : { n: 0, pay: 0 }, royaltyRate = cp ? cp.royaltyRate : timed ? royBase() : 0;
    const nowMs = cp ? cp.nowMs : fixedEnd ?? Date.now();
    if (writer && !cp) {
      cp = S.rewards.awayCheckpoint = { version:1, phase:'early', awaySec, cap, eff, sec, multiplier, nowMs,
        st:0, batch:0, budgets:timed ? [] : null, words0, report:rep, timed, deadline:timed ? deadline : null,
        saleTimes, boundaries, sold, royaltyRate, paidSeconds:writer.incomeSeconds(workSec,
          Math.max(0, buffs.rush - productiveMono()), Math.max(0, buffs.critic - productiveMono())) };
      if (!writer.checkpoint()) return;
    }
    if (!cp || cp.phase === 'early') {
      if (cp) cp.phase = 'advance';
      if (timed && deadline < 0) endChallenge('fail');
      else if (timed && soldCount() >= chDef('timed').goalN) endChallenge('done');
      if (!progressing()) return;
    }
    if (!cp || cp.phase === 'advance') {
      advanceDeadlines(sec * (multiplier - 1) * 1000, awaySec * (multiplier - 1) * 1000);
      if (cp) cp.phase = 'work';
    }
    let batch = cp ? cp.batch : 0, budgets = cp ? cp.budgets : timed ? [] : null;
    for (let st = cp ? cp.st : 0; st < (timed ? boundaries.length - 1 : steps); st++) {
      if (cp) { batch = cp.batch; budgets = cp.budgets; }
      const from = timed ? boundaries[st] : st * realDt, to = timed ? boundaries[st + 1] : (st + 1) * realDt;
      if ((!cp || cp.phase === 'work') && timed && from === (batch + 1) * realDt) { batch++; budgets = []; }
      if (cp) { cp.batch = batch; cp.budgets = budgets; }
      const stepDt = dt, batchEnd = to === (batch + 1) * realDt;
      const fraction = timed ? (to - batch * realDt) / realDt : 1;
      skyOv = World.at(timed ? nowMs - awaySec * 1000 + (batch + .5) * realDt * 1000 : nowMs - sec * 1000 + (st + .5) * realDt * 1000); // weather remains real time
      if (!cp || cp.phase === 'work') S.desks.forEach((d, i) => {
        if (!d.owned || !d.paws) return;
        const speedSum = d.crew.reduce((a, t) => a + typistSpeed(t), 0) * deskMk(d) || d.paws;
        const raw = speedSum / (PAW_BASE[i] * Math.pow(.85, d.up.fing) * (toolOn('metro') ? .5 : 1) * (stormy() ? 2 : 1)) * stepDt * eff;
        let n = Math.round(raw), budget = timed ? budgets[i] : null;
        if (timed) {
          if (!budget) {
            const keeperRaw = stepDt * eff * (museOn('hemi') ? 2 : 1) / keeperPeriod(i), inventory = {};
            if (n > 0) {
              const dist = offlineDist(d, i);
              for (const ch in dist) { const exp = n * dist[ch]; inventory[ch] = Math.floor(exp) + (rand() < exp % 1 ? 1 : 0); }
            }
            budget = budgets[i] = { raw, n, typed: 0, inventory, released: {}, keeperRaw, banked: 0, pass: 0, word: 0, any: false };
          }
          // Floors expose only elapsed work; original round/ceil/minimum remainders wait for the batch end.
          const typed = batchEnd ? budget.n : Math.min(budget.n, Math.floor(budget.raw * fraction));
          n = typed - budget.typed; budget.typed = typed;
        }
        if (n > 0) {
          const dist = timed ? budget.inventory : offlineDist(d, i);
          for (const ch in dist) {
            const exp = n * dist[ch];
            const released = timed ? Math.floor(dist[ch] * budget.typed / budget.n) : 0;
            const c = timed ? released - (budget.released[ch] || 0) : Math.floor(exp) + (rand() < exp % 1 ? 1 : 0);
            if (timed) budget.released[ch] = released;
            if (c > 0) { const ordinary = c - (activeWork()?.route(S,i,ch,c) || 0); d.letters[ch] = (d.letters[ch] || 0) + ordinary; S.stats.byLetter[ch] = (S.stats.byLetter[ch] || 0) + c; }
          }
          S.stats.letters += n; rep.letters += n;
          if (!timed && d.crew.length) { const each = n / d.crew.length; for (let q = 0; q < d.crew.length; q++) grantXp(d, q, each, true); }
        }
        if (timed && batchEnd && budget.n > 0 && d.crew.length) { const each = budget.n / d.crew.length; for (let q = 0; q < d.crew.length; q++) grantXp(d, q, each, true); }
        if (d.keeper.owned && d.keeper.on) {
          if (timed) {
            const capacity = batchEnd ? Math.max(2, Math.ceil(budget.keeperRaw)) : Math.floor(budget.keeperRaw * fraction);
            budget.banked += keeperBulk(d, i, Math.max(0, capacity - budget.banked), budget);
          } else keeperBulk(d, i, Math.max(2, Math.ceil(stepDt * eff * (museOn('hemi') ? 2 : 1) / keeperPeriod(i))));
        }
      });
      if (!cp || cp.phase === 'work') worksAdvance();
      if (cp && cp.phase === 'work') cp.phase = 'sale';
      if (timed) {
        readyC = null; // Offline time is fixed at return; a new production prefix must invalidate the timed cache.
        if (!cp || cp.phase === 'sale') {
          if (saleTimes.includes(to)) { const sale = autoSellAway(PUB_PERIOD[1], 1, cp); if (!cp) { sold.n += sale.n; sold.pay += sale.pay; } }
          if (!progressing()) { skyOv = null; return; }
          if (cp) { cp.saleLeft = null; cp.phase = 'challenge'; }
        }
        if (!cp || cp.phase === 'challenge') {
          if (cp) cp.phase = 'expiry';
          if (S.challenge && to <= deadline && soldCount() >= chDef('timed').goalN) endChallenge('done');
          if (!progressing()) { skyOv = null; return; }
        }
        if (!cp || cp.phase === 'expiry') {
          if (cp) cp.phase = 'next';
          if (S.challenge && to >= deadline) endChallenge('fail');
          if (!progressing()) { skyOv = null; return; }
        }
      }
      if (cp) { cp.st = st + 1; cp.phase = cp.st < (timed ? boundaries.length - 1 : steps) ? 'work' : 'tail'; }
    }
    if (!cp || cp.phase === 'tail') {
      if (cp) cp.phase = 'tray';
      if (timed && S.challenge && awaySec > deadline) endChallenge('fail');
      if (!progressing()) { skyOv = null; return; }
    }
    if (!cp || cp.phase === 'tray') S.desks.forEach((d, i) => {     // rebuild the tray from what is left in the drawers
      const bag = []; for (const ch in d.letters) for (let q = 0; q < Math.min(d.letters[ch], 8); q++) bag.push(ch);
      for (let q = bag.length - 1; q > 0; q--) { const j = Math.floor(rand() * (q + 1)); [bag[q], bag[j]] = [bag[j], bag[q]]; }
      d.tray = bag.slice(-80); rt[i].sheet = d.tray.join('').slice(-120);
    });
    if (cp && cp.phase === 'tray') cp.phase = 'market';
    if (!cp || cp.phase === 'market') {
      for (let q = 0, m = Math.min(200, Math.floor(sec / 6)); q < m; q++) { skyOv = World.at(nowMs - sec * 1000 + (q + .5) * (sec * 1000 / m)); marketStep(true); }
      if (cp) cp.phase = 'roy';
    }
    skyOv = null;
    rep.words = S.stats.words - words0;
    if (!cp || cp.phase === 'roy') {
      rep.roy = floorMoney((timed ? royaltyRate : royBase()) * (cp ? cp.paidSeconds : workSec) * eff);
      if (rep.roy > 0) { S.royTotal += rep.roy; if (cp) { if (!writer.awayCredit(rep.roy, 'div')) return; } else bananas.add(rep.roy); }
      else if (cp) cp.phase = 'div';
    }
    if (!cp || cp.phase === 'div') {
      rep.div = floorMoney(divBase() * (cp ? cp.paidSeconds : workSec) * eff);
      if (rep.div > 0) { S.divTotal += rep.div; if (cp) { if (!writer.awayCredit(rep.div, archiveFeature?.enabled && S.meta.archive !== undefined ? 'archive' : 'bulk')) return; } else bananas.add(rep.div); }
      else if (cp) cp.phase = archiveFeature?.enabled && S.meta.archive !== undefined ? 'archive' : 'bulk';
    }
    if (cp?.phase === 'archive' && !writer.archiveIncome().ok) return;
    S.stats.awayMax = Math.max(S.stats.awayMax || 0, awaySec);
    if (!cp || cp.phase === 'bulk') {
      const sales = timed ? sold : autoSellAway(workSec * eff, 200, cp); rep.pubSold = cp ? cp.sold.n : sales.n; rep.pubPay = cp ? cp.sold.pay : sales.pay;
      if (!progressing()) return;
      if (cp) { writer.consumeGold(workSec * 1000); cp.phase = 'complete'; }
    }
    rep.ready = readyList().length;
    if (cp) {
      // Acknowledging complete first makes checkpoint deletion safe to retry after reload.
      if (!writer.checkpoint()) return;
      if (boundaryJob) return rep;
      delete S.rewards.awayCheckpoint; S.lastSeen = nowMs;
      if (!writer.checkpoint()) { S.rewards.awayCheckpoint = cp; return; }
    }
    extensionEvent('away', { realSeconds: sec, gameSeconds: workSec, report: rep });
    return rep;
  }
  function proposeBoundary(id, proposal) {
    if (proposal.transition) { Object.freeze(proposal.transition.oldEffects); Object.freeze(proposal.transition); }
    if (proposal.ready) Object.freeze(proposal.ready);
    const frozen = Object.freeze(proposal);
    boundaryProposal = {id, proposal:frozen,
      garden:S.garden, crops:S.garden.beds.slice(), challenge:S.challenge, printing:S.printing};
    return {proposal:frozen};
  }
  function lampCommit(command, validate) {
    if (!writer?.owns() || !writer.transacting() || !writer.boundaryProgressing() || !window.VaultPlay?.enabled() || S.prem.vault?.transition || S.rewards.awayCheckpoint) return {ok:false,error:'Lamp commit requires settled owned work'};
    const candidate = VaultPlay.project(S,command,Date.now());
    validate(candidate);
    const previousSpeed = speed();
    const result = Economy.saveStateAcknowledged(candidate);
    if (result.ok) {
      S.prem=candidate.prem;
      if (speed() !== previousSpeed) {goldObject?.reschedule(); IMI.pickups?.vaultSpeed();}
      mark();
    }
    return result;
  }
  function vaultBoundary(id) {
    if (!writer?.boundaryProgressing()) throw Error('Boundary requires owned productive settlement');
    if (!boundaryJob) { const end=lampLifetime?.wall ?? Date.now(); boundaryJob = {id, end, hidden:!started || document.hidden, visible:null, displayEnd:end}; }
    if (boundaryJob.id !== id) throw Error('Boundary intent identity mismatch');
    if (boundaryJob.closed) { boundaryJob = null; return {done:true}; }
    const job = boundaryJob, t = S.prem.vault?.transition, cp = S.rewards.awayCheckpoint;
    const effects = Vault.oldEffects(S);
    if (!effects || effects.typistTier || effects.capSeconds !== awayCap() ||
        speed() !== [1,1.25,1.5,1.75,2][effects.gameTier]) throw Error('Historical effects require their actual clock/cap providers');
    if (!t) {
      if (!job.hidden && !cp) {
        job.visible ??= {phase:0, desk:0, paw:0, presses:0, debited:false, ...(lampLifetime ? {now:lampLifetime.mono} : {})};
        historicalEnd = job.end; skyOv = World.at(job.end);
        try { tick(job.visible); } finally { historicalEnd = null; skyOv = null; }
        if (!progressing()) return;
      }
      const start = cp ? cp.nowMs : job.hidden ? S.lastSeen : job.end;
      if (!Number.isFinite(start) || start > job.end) throw Error('Unsupported old boundary clock');
      return proposeBoundary(id, {kind:'open', transition:{version:1, printing:S.printing,
        phase:cp ? 'old' : start === job.end ? 'settled' : 'tail', tailStartWallMs:start,
        tailEndWallMs:job.end, holdStartWallMs:job.end, oldEffects:effects}, lastSeen:cp || job.hidden ? S.lastSeen : job.end});
    }
    if (Vault.validate(S).status !== 'valid') throw Error('Invalid OPEN historical state');
    job.displayEnd = t.phase === 'old' ? t.tailStartWallMs : t.tailEndWallMs;
    if (t.phase !== 'settled') {
      historicalEnd = t.phase === 'old' ? cp.nowMs : t.tailEndWallMs;
      try {
        if (cp || t.tailStartWallMs < t.tailEndWallMs) simulateAway(cp ? 0 : (t.tailEndWallMs - t.tailStartWallMs) / 1000, historicalEnd);
      } finally { historicalEnd = null; }
      if (!progressing()) return;
      const current = S.rewards.awayCheckpoint;
      if (current && current.phase !== 'complete') throw Error('Historical checkpoint has not completed');
      const end = t.phase === 'old' ? t.tailStartWallMs : t.tailEndWallMs;
      const phase = t.phase === 'old' && end < t.tailEndWallMs ? 'tail' : 'settled';
      return proposeBoundary(id, {kind:'delete', transition:{...t, phase, tailStartWallMs:end}, lastSeen:end});
    }
    const closing = Date.now(), delta = closing - t.holdStartWallMs;
    const ready = S.garden.beds.map(b => b ? b.ready + delta : null), challengeStart = S.challenge ? S.challenge.start + delta : null;
    if (![closing,...ready.filter(n=>n!==null),...(challengeStart===null?[]:[challengeStart])].every(n=>Number.isFinite(n)&&Math.abs(n)<=8.64e15)) throw Error('Closing clocks cannot be represented');
    if (S.garden.beds.some((b,i)=>b&&ready[i]-b.ready!==delta) || (S.challenge&&challengeStart-S.challenge.start!==delta)) throw Error('Closing clocks lose the held duration');
    return proposeBoundary(id, {kind:'close', lastSeen:closing, ready, challengeStart});
  }
  function vaultCommit(id, proposal, validate) {
    if (!writer?.owns() || !writer.transacting() || !writer.boundaryProgressing() || !boundaryProposal || boundaryProposal.id !== id ||
        proposal !== boundaryProposal.proposal) return {ok:false,error:'Unleased boundary proposal'};
    if (S.printing!==boundaryProposal.printing || S.garden!==boundaryProposal.garden || S.challenge!==boundaryProposal.challenge ||
        S.garden.beds.length!==boundaryProposal.crops.length || S.garden.beds.some((b,i)=>b!==boundaryProposal.crops[i])) return {ok:false,error:'Saved lifetime identity changed'};
    const candidate = JSON.parse(JSON.stringify(S)), p = proposal;
    if (p.kind === 'open') {
      candidate.prem.vault ??= {version:1,nextSequence:1,purchases:{},owned:{},active:{},selections:{},settings:{hideStore:false}};
      if (window.VaultPlay?.enabled()) candidate.prem.vault.freeLamp ??= {version:1,rule:1};
      candidate.prem.vault.transition = p.transition;
    } else if (p.kind === 'delete') {
      if (S.rewards.awayCheckpoint && (S.rewards.awayCheckpoint.phase !== 'complete' || S.rewards.awayCheckpoint.credit)) return {ok:false,error:'Checkpoint deletion is not settled'};
      delete candidate.rewards.awayCheckpoint; candidate.prem.vault.transition = p.transition;
    } else if (p.kind === 'close') {
      candidate.garden.beds.forEach((b,i)=>{if(b)b.ready=p.ready[i];});
      if (candidate.challenge) candidate.challenge.start=p.challengeStart;
      delete candidate.prem.vault.transition;
    } else return {ok:false,error:'Unknown boundary operation'};
    candidate.lastSeen = p.lastSeen;
    validate(candidate);
    const result = Economy.saveStateAcknowledged(candidate);
    if (!result.ok) return result;
    S.prem.vault ??= candidate.prem.vault;
    if (p.kind === 'delete') delete S.rewards.awayCheckpoint;
    if (p.kind === 'close') {
      S.garden.beds.forEach((b,i)=>{if(b)b.ready=p.ready[i];});
      if (S.challenge) S.challenge.start=p.challengeStart;
      delete S.prem.vault.transition;
      boundaryJob.closed = true;
    } else S.prem.vault.transition = candidate.prem.vault.transition;
    S.lastSeen = p.lastSeen; boundaryProposal = null; mark();
    // Publish the acknowledged saved fields before notifying later volatile owners.
    if (p.kind === 'close') extensionEvent('vaultClosed', {id, closingWallMs:p.lastSeen});
    return result;
  }
  function showWelcome(rep) {
    document.querySelectorAll('.o-modal').forEach(m => m.remove());
    const el = document.createElement('div'); el.className = 'o-modal'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-labelledby', 'oWbT');
    const row = (k, v) => `<div class="o-row"><span>${k}</span><b>${v}</b></div>`, next = LAMP[S.lamp];
    ['wb-let', 'wb-wds', 'wb-roy', 'wb-div'].forEach(k => { shownN[k] = 0; delete cntAnim[k]; });   // the report counts up as it opens
    el.innerHTML = `<div class="o-modal-card"><h3 id="oWbT">Welcome back!</h3>
      <p>You were away <b>${dur(rep.away)}</b>.${rep.capped ? ` The typists only worked ${dur(rep.counted)}, the most they will do unsupervised.` : ' The typists pretended to work the whole time.'}</p>
      <div class="o-modal-rows">${row('Letters typed', cnt('wb-let', rep.letters))}${row('Words banked by keepers', cnt('wb-wds', rep.words))}${row('Royalties', `${ico('banana', 22)} ${cnt('wb-roy', rep.roy, true)}`)}${rep.pubSold ? row('Titles sold by your assistant', `${rep.pubSold} · ${ico('banana', 22)} ${fmtBig(rep.pubPay)}`) : ''}${rep.div ? row('Division income', `${ico('banana', 22)} ${cnt('wb-div', rep.div, true)}`) : ''}${rep.ready ? row('Titles ready to write', rep.ready) : ''}</div>
      ${rep.capped && next ? '<p class="o-dim">A Night Lamp from the Shop keeps them working longer.</p>' : ''}
      <button type="button" class="o-btn gold" data-close>Collect</button></div>`;
    document.body.appendChild(el); hydrate(el);
    const close = () => { const b = el.querySelector('[data-close]').getBoundingClientRect(); el.remove(); IMI.sfx.ding(); if (rep.roy || rep.div) IMI.burst(b.left + b.width / 2, b.top, ['banana', 'spark', 'star'], 14); checkAwards(); mark(); };
    el.querySelector('[data-close]').addEventListener('click', close);
    el.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
    el.querySelector('[data-close]').focus();
  }
  /* ================= the daily banana crate: come back each day, the streak grows the prize ================= */
  const DAILY_MULT = [1, 1.25, 1.5, 1.75, 2, 2.5, 3];
  const dayKey = t => new Date(t).toDateString();
  function dailyState() {
    const d = S.daily || {}, today = dayKey(Date.now());
    if (d.last === today) return null;
    return { streak: d.last === dayKey(Date.now() - 864e5) ? (d.streak || 0) + 1 : 1, today };
  }
  const dailyPrize = streak => roundMoney(Math.max(cash(250), (royRate() + divRate()) * 600, bananas.get() * .02) * DAILY_MULT[Math.min(streak, 7) - 1]);
  function dailyCrate() {
    if (!progressing()) return;
    if (introActive()) return;
    if (window.__OPS_HEADLESS || !S.stats.letters) return;
    const ds = dailyState(); if (!ds) return;
    if (document.querySelector('.o-modal, .o-celebrate')) return void setTimeout(dailyCrate, 900);   // wait for the welcome-back report
    const prize = dailyPrize(ds.streak), day = Math.min(ds.streak, 7), big = day === 7;
    const el = document.createElement('div'); el.className = 'o-modal o-daily'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-labelledby', 'oDyT');
    el.innerHTML = `<div class="o-modal-card"><h3 id="oDyT">Daily banana crate</h3>
      <p>${ds.streak > 1 ? `Day <b>${ds.streak}</b> in a row. The crates get bigger every day for a week.` : 'A crate turned up on the loading dock. Come back tomorrow for a bigger one.'}</p>
      <div class="o-days">${DAILY_MULT.map((m, k) => `<span class="o-day${k + 1 < day ? ' done' : k + 1 === day ? ' now' : ''}"><small>DAY ${k + 1}</small><b>x${m}</b></span>`).join('')}</div>
      <button type="button" class="o-chest${big ? ' big' : ''}" data-open aria-label="Open the crate"><i class="o-chest-rays"></i><i class="o-chest-base"></i><i class="o-chest-lid"></i><i class="o-chest-lock"></i></button>
      <p class="o-chest-prize" aria-live="polite"></p>
      <button type="button" class="o-btn gold" data-open>Open the crate</button></div>`;
    document.body.appendChild(el);
    let opened = false;
    const btn = el.querySelector('.o-btn'), chest = el.querySelector('.o-chest');
    const open = () => {
      if (!progressing()) return;
      if (opened) return; opened = true;
      S.daily = { last: ds.today, streak: ds.streak }; save();                                   // claim first, so a refresh can't re-open it
      chest.classList.add('shake'); IMI.sfx.shake(); btn.disabled = true;
      setTimeout(() => {
        chest.classList.remove('shake'); chest.classList.add('open'); IMI.sfx.chest && IMI.sfx.chest(); IMI.sfx.fanfare(); vib([20, 30, 60]);
        for (let k = 0; k < 9; k++) {
          const b = document.createElement('i'); b.className = 'o-chest-pop'; b.style.cssText = `--dx:${(rand() - .5) * 260}px;--dy:${-90 - rand() * 120}px;--dl:${k * 40}ms`;
          if (PX) b.appendChild(PXA.el('banana', 1)); else b.textContent = '🍌';
          chest.appendChild(b);
        }
        shownN['daily'] = 0;
        el.querySelector('.o-chest-prize').innerHTML = `+${cnt('daily', prize, true)} bananas${big ? '<br><small>and a 30 second typing party</small>' : ''}`;
        btn.textContent = 'Collect'; btn.disabled = false; btn.focus();
      }, IMI.reduceMotion ? 0 : 700);
    };
    const collect = () => {
      if (!progressing()) return;
      const at = IMI.centerOf(btn); el.remove();
      bananas.earn(prize, at); IMI.burst(at[0], at[1], ['banana', 'spark', 'star'], 16);
      if (big) { const now = performance.now(); buffs.frenzy = now + 30000; buffs.golden = now + 30000; cheer(2400, 'PARTY!'); }
      logIt(`Opened the day ${ds.streak} banana crate: ${fmtBig(prize)} bananas.`); newsPush(`A banana crate arrives on day ${ds.streak} of the streak. Loyalty is rewarded, mostly with fruit.`);
      mark(); save(); IMI.emit('daily', { streak: ds.streak });
    };
    chest.addEventListener('click', open);
    btn.addEventListener('click', () => (opened ? (btn.textContent === 'Collect' && collect()) : open()));
    el.addEventListener('keydown', e => { if (e.key === 'Escape' && opened && btn.textContent === 'Collect') collect(); });
    btn.focus();
  }
  let dailyQ = false;
  const dailyLater = () => { if (dailyQ) return; dailyQ = true; IMI.whenPlaying(() => { dailyQ = false; dailyCrate(); }); };
  function welcomeBack(minSec) {
    if (!progressing()) return;
    const away = (Date.now() - (S.lastSeen || Date.now())) / 1000;
    if (away < minSec) return;
    const rep = simulateAway(away); if (!progressing() || !rep) return; S.lastSeen = Date.now(); save();
    logIt(`Back after ${dur(away)}: typists typed ${fmt(rep.letters)} letters, keepers banked ${fmt(rep.words)} words, royalties paid ${fmtBig(rep.roy)} and divisions ${fmtBig(rep.div || 0)} bananas.${rep.pubSold ? ` Your assistant sold ${rep.pubSold} title${rep.pubSold > 1 ? 's' : ''} for ${fmtBig(rep.pubPay)}.` : ''}`);
    newsPush('Welcome back. The typists pretended to work the whole time.');
    if (!introActive() && (rep.letters || rep.roy || rep.words)) IMI.whenPlaying(() => showWelcome(rep));
    mark();
  }

  /* ================= golden & rotten bananas =================
     A banana drifts across the page now and then. Golden ones are worth catching; rotten ones are best left alone. */
  const GOLD_FX = [['lucky', 35], ['rush', 25], ['shower', 20], ['muse', 12], ['party', 8]];
  const ROT_FX = [['sluggish', 60], ['critic', 40]];
  const roulette = list => { let r = rand() * list.reduce((a, [, w]) => a + w, 0); for (const [id, w] of list) { r -= w; if (r <= 0) return id; } return list[0][0]; };
  function museGift(n) {
    const top = S.desks.reduce((m, d, i) => (d.owned ? i : m), 0);
    const focused = focusRecipe() ? [focusRecipe()] : [];
    const pool = focused.length ? focused : RECIPES.filter(r => !S.written[r.id] && inPlay(r) && r.band <= top);
    const needs = [];
    for (const r of pool) for (const w in r.need) for (let k = stock(w); k < r.need[w]; k++) needs.push(w);
    const got = [];
    for (let k = 0; k < n && needs.length; k++) { const w = needs.splice(Math.floor(rand() * needs.length), 1)[0]; S.bank[w] = stock(w) + 1; bankV++; got.push(w); }
    return got;
  }
  function goldEffect(fx, x, y) {
    const now = performance.now(), d = cur(); let msg = '', good = true;
    if (fx === 'lucky') { const gain = roundMoney(Math.max(cash(100), Math.min(bananas.get() * .12, royBase() * 900)) * (chPerk('timed') ? 1.25 : 1)); bananas.earn(gain, [x, y]); msg = `LUCKY! +${fmt(gain)} bananas`; }
    else if (fx === 'rush') { buffs.rush = now + 15000; msg = 'ROYALTY RUSH! x7 for 15s'; }
    else if (fx === 'shower') { for (let k = 0; k < 25; k++) addLetter(d, roll(d, S.sel, true)); msg = 'LETTER SHOWER! +25 letters'; }
    else if (fx === 'muse') { const got = museGift(3); msg = got.length ? `THE MUSE! +${got.join(' ')}` : 'THE MUSE smiles at you'; }
    else if (fx === 'party') { buffs.golden = now + 15000; buffs.frenzy = now + 15000; msg = 'TYPING PARTY! Frenzy + Golden Keys'; cheer(2400, 'PARTY!'); }
    else if (fx === 'sluggish') { buffs.sluggish = now + 20000; msg = 'SPOILED! The typists are queasy'; good = false; }
    else if (fx === 'critic') { buffs.critic = now + 20000; msg = 'BAD REVIEW! Royalties halved for 20s'; good = false; }
    floatText(msg, x, y - 20, good ? '#ffd23a' : '#ff8a70', true);
    logIt(good ? `Caught a golden banana: ${msg.toLowerCase()}.` : `Touched a rotten banana: ${msg.toLowerCase()}.`);
    shock(x, y, good ? '#ffd23a' : '#9bd16a', good);
    if (good) { S.gold++; IMI.emit('gold', { n: S.gold }); flash('#ffe98a'); IMI.sfx.ding(); IMI.burst(x, y, ['banana', 'spark', 'star'], 16); vib([15, 30, 15]); cheer(1200, 'OOH!'); }
    else { S.stats.rotten++; IMI.sfx.shake(); IMI.burst(x, y, ['drop', 'leaf'], 10); vib(60); }
    newsPush(good ? 'GOLDEN BANANA caught. Witnesses say it was “extremely shiny”.' : 'Rotten banana touched. Witnesses recoil; one files a complaint.');
    mark(); save();
  }
  let goldEnd = null, goldUntil = 0, goldObject = null;
  function spawnGold(rotten) {
    if (!progressing()) return;
    if (introActive()) return;
    if (document.querySelector('.o-gold')) return;
    if (rotten === undefined) rotten = rand() < .22 && soldCount() > 0;
    const el = document.createElement('button'); el.type = 'button'; el.className = 'o-gold' + (rotten ? ' rotten' : '');
    el.setAttribute('aria-label', rotten ? 'A rotten banana drifts past. Leave it.' : 'A golden banana drifts past. Catch it!');
    if (PX) { const sp = PXA.el('banana', 1.4); sp.style.pointerEvents = 'none'; el.appendChild(sp); } else el.textContent = '🍌';
    document.body.appendChild(el);
    const W = innerWidth, H = innerHeight, dir = rand() < .5 ? 1 : -1, base = H * (.25 + rand() * .45), dur = (W < 700 ? 12000 : 9500) + rand() * 2500;
    const pts = Array.from({ length: 9 }, (_, k) => { const t = k / 8; return { transform: `translate(${dir > 0 ? -90 + t * (W + 180) : W + 90 - t * (W + 180)}px, ${base + Math.sin(t * 6.3 + rand()) * 70}px)` }; });
    let trail = 0, expiry = 0, anim = null, done = false;
    let netItem, heldLease = null, generation = 0, hovered = false;
    const end = () => { if (done || heldLease) return; done = true; extensions.get('automation')?.netCleared('golden', netItem); clearInterval(trail); clearTimeout(expiry); anim?.cancel(); el.remove(); goldEnd = null; goldUntil = 0; goldObject = null; };
    const expire = () => {const token=++generation;return () => {if(token===generation&&!heldLease&&writer?.owns()!==false){if(speed()!==1&&productionNow()<goldUntil)goldObject?.reschedule();else end();}};};
    goldObject = {
      hold(lease) {if(done||heldLease)return;heldLease=lease;el.dataset.lampHeld='';generation++;clearTimeout(expiry);anim?.pause();if(anim)anim.onfinish=null;},
      resume(lease) {if(heldLease!==lease)return;heldLease=null;delete el.dataset.lampHeld;if(!el.isConnected){end();return;}if(anim){anim.onfinish=expire();anim.play();}else expiry=setTimeout(expire(),Math.max(0,goldUntil-productionNow())/speed());if(speed()!==1)this.reschedule();},
      reschedule() {
        if (done || heldLease) return;
        clearTimeout(expiry);
        if (anim) {anim.onfinish=null;anim.playbackRate=speed()*(hovered ? .4 : 1);}
        expiry=setTimeout(expire(),Math.max(0,goldUntil-productionNow())/speed());
      },
      dispose() {heldLease=null;generation++;end();}
    };
    goldEnd = end;
    goldUntil = productionNow() + (IMI.reduceMotion ? 9000 : dur);
    if (IMI.reduceMotion) { el.style.cssText += `left:${W * (.2 + rand() * .6)}px;top:${base}px`; expiry = setTimeout(expire(), 9000); }
    else {
      anim = el.animate(pts, { duration: dur, easing: 'linear' }); anim.onfinish = expire();
      trail = setInterval(() => { if(heldLease||done)return; const r = el.getBoundingClientRect(); IMI.fall(r.left + r.width / 2, r.top + r.height / 2, rotten ? 'drop' : 'spark', 700); }, 220);
      el.addEventListener('pointerenter', () => { hovered=true;try { if(!heldLease)anim.playbackRate = speed()*.4; } catch { /* ignore */ } });
      el.addEventListener('pointerleave', () => { hovered=false;try { if(!heldLease)anim.playbackRate = speed(); } catch { /* ignore */ } });
    }
    if (speed() !== 1) goldObject.reschedule();
    const claim = () => {
      if (!progressing()) return;
      if (done || heldLease || productionNow()>=goldUntil) return;
      const r = el.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
      end(); if (!introActive()) goldEffect(roulette(rotten ? ROT_FX : GOLD_FX), x, y);
    };
    el.addEventListener('click', e => { if (!progressing() || done) return; e.stopPropagation(); claim(); });
    netItem = { el, valid:() => !rotten && !done && !heldLease && productionNow() < goldUntil, claim };
    extensions.get('automation')?.netCreated('golden', netItem);
    IMI.sfx.tick(); if (!rotten) IMI.emit('goldspawn');
    if (!rotten && ui.tab === 'floor' && typists.length) { const t = typists[Math.floor(rand() * typists.length)]; say(t, 'GOLD!'); jump(t); }
  }
  /* the header toys: core.js owns the buttons and their recharge, these are what they do */
  function perk(id, at) {
    if (!progressing()) return '';
    if (id === 'snack') { buffs.snack = performance.now() + 20000; cheer(1600, 'YUM!'); shock(at[0], at[1], '#ffd23a'); mark(); return 'SNACK BREAK! Typists work 50% faster for 20s.'; }
    const d = cur(), n = 8 + Math.min(32, totalPaws());                        // coconut: a pile of letters for the machine you are on
    for (let k = 0; k < n; k++) addLetter(d, roll(d, S.sel, true));
    floatText(`+${n} letters`, at[0], at[1] + 50, '#7be05a', true); shock(at[0], at[1], '#7be05a'); mark();
    return `COCONUT CRACKED! +${n} letters for ${DESKS[S.sel].name}.`;
  }
  /* a cheap read-only view for the tutorial */
  const snap = () => ({ typed: S.stats.letters, combo: combo.n, manual: S.stats.manual, intro: { ...S.intro }, letters: totalLetters(cur()), words: S.stats.words, paws: totalPaws(), sold: Object.keys(S.written).length, bananas: bananas.get(), ready: readyList().length, tab: ui.tab, sub: ui.sub, desk: S.sel, owned: S.desks.filter(d => d.owned).length, deskPrice: DESKS[1].price, gold: S.gold, printing: S.printing, stars: starsNow(), hireCost: PAW_COST[0], hot: S.market.v.some((v, b) => S.desks[b] && S.desks[b].owned && marketMult(b) >= 1.4), pitch: !!firstPitch(), museSlots: museSlots() });
  // Pickup growth uses visible play time and sustained income, never offline time or the wallet.
  const pickup = {
    ...(new URLSearchParams(location.search).get('lg03') === '1' ? {
      netCreated:(kind, item) => extensions.get('automation')?.netCreated(kind, item),
      netCleared:(kind, item) => extensions.get('automation')?.netCleared(kind, item)
    } : {}),
    eligible: () => !introActive() && ui.tab === 'floor',
    value: () => roundMoney(Math.max(cash(5 * (1 + Math.floor(S.stats.playSecs / 600))), 2 * (royBase() + divBase()))),
    collect(value, at) {
      if (!progressing()) return false;
      if (!this.eligible() || !Number.isFinite(value) || value <= 0) return false;
      S.stats.pickups++; S.stats.pickupEarned += value; bananas.earn(value, at); mark(); save(); return true;
    }
  };
  IMI.ops = { pickup, baro: () => S.baro, snap, spawnGold, royRate, simulateAway, genPitch, newOffers, perk, introActive, completeIntro, reset: () => { if (progressing()) return ACTIONS.reset(); } };
  if (pg) IMI.ops.productionGoal = {
    configure: patch => pg.configure(pgContext, patch), retry: () => pg.retry(pgContext),
    status: () => pg.status(pgContext)
  };
  if (writer) {
    IMI.ops.genPitch = (...args) => progressing() ? genPitch(...args) : null;
    IMI.ops.newOffers = (...args) => { if (progressing()) return newOffers(...args); };
    IMI.ops.progression = {
      running: progressing,
      stop: () => { extensions.get('automation')?.netBlocked(); paused = true; holding = false; printingHelper()?.sampleUpdate(); },
      resume: () => { if (!writer.owns()) return false; last = performance.now(); paused = false; if (!started) startGame(); return true; }
    };
    IMI.ops.saveAcknowledged = saveAcknowledged;
    writer.onPagehide(() => { paused = true; holding = false; if (!writer.localDisposition()) saveAcknowledged(); extensions.get('automation')?.netDispose(); IMI.pickups?.clear(true); goldObject?.dispose(); lampLifetime=null; ticker.anim?.cancel(); boundaryJob = null; boundaryProposal = null; });
  }
  const extensionAPI = {
    state: () => S, save, mark, morph, setTab,
    hallHistory:() => hallHistory,
    hallCommit(candidate, source) {
      if (!writer?.owns() || !writer.transacting() || writer.localDisposition() || JSON.stringify(S) !== source) return {ok:false,error:'Hall source changed. Save preserved.'};
      const result = Economy.saveStateAcknowledged(candidate);
      if (result.ok) { S.meta.hall = candidate.meta.hall; S.rewards = candidate.rewards; S.lastSeen = candidate.lastSeen; mark(); }
      return result;
    },
    seasonsEnabled, seasonsDisabled, seasonsFreeze, seasonsPending, seasonsCommit,
    boardEnabled, boardNames, boardFreeze, boardPending, boardCommit,
    challengeEnabled, challengeValidate, challengeReady, challengePending, challengeFreeze, challengeCommit,
    challengeOff:() => {printingHelper()?.challengeLocalOff(); printingHelper()?.challengeSaveOff(); if (ui.tab === 'automation') RENDER.automation();},
    challengeFacts:() => ({nextChallenge:ui.nextCh,manualFocus:!S.autoFocus && !!S.focus,available:AutoChallenge.ids.filter(id => !titleAvailable(RBY[id])),target:challengeActive()?.target,ready:!!challengeActive()?.target && canWrite(RBY[challengeActive().target])}),
    masteryEnabled, masteryActive, masteryValidate, masteryFreeze, masteryPending, masteryCommit,
    printingEnabled, printingReady, printingReview, printingFreeze, printingPending, printingCommit,
    printingOff:() => { printingHelper()?.turnPrintOff(); if (ui.tab === 'automation') RENDER.automation(); },
    printSampleAllowed(committed = false) {
      return printingEnabled() && !printingHelper()?.challengeReserved() && writer?.owns() && !paused && !writer.held() && !writer.localDisposition() &&
        (committed && writer.transacting() || progressing() && writer.guard(S)) && !window.VaultSaveGate?.blocked &&
        !document.hidden && IMI.screen() === 'game' && !S.challenge && !workPaused() && !S.meta.archive?.working &&
        !S.meta.layers?.pending && !S.meta.estate?.pending && !S.meta.archive?.pending && !S.meta.automation?.print?.pending &&
        !S.meta.automation?.pitch?.sale && !S.meta.automation?.media?.pending && !S.prem.vault?.transition && !S.rewards.awayCheckpoint &&
        !commissionPending && !musePending && !layerChoices.size && !printingHelper()?.pendingGarden() && !printingHelper()?.pendingChoice() &&
        trainingPool?.mode() !== 'suspended' && printingHelper()?.validConfig(S.meta.automation,extensionAPI) &&
        !IMI.tour?.active() && !document.querySelector('.o-modal, .o-celebrate, .set-pop:not([hidden])');
    },
    printSampleStart:archiveSettle,
    printSampleSpeed:() => JSON.stringify([speed(),buffOn('rush'),buffOn('critic'),S.rewards.activeGold?.remainingGameMs > 0,S.desks.map(d => [deskMk(d) / pawSecs(d),d.crew.map(t => typistSpeed(t))])]),
    challengeCommissionAllowed, challengeSeatsLocked,
    imprintChallengeCommit(request) {
      const C = chDef(S.challenge?.id);
      if (!writer?.owns() || !writer.transacting() || !C?.imprint || request.id !== C.id || !challengeRun() ||
          !layers.epochMatches(S,request) || request.printing !== S.printing || request.imprint !== layers.identity(S) || request.start !== S.challenge.start ||
          challengeSales() < C.goalN || layerChoices.size || musePending || commissionPending ||
          S.meta.automation?.pitch?.sale || S.meta.automation?.media?.pending || S.rewards.awayCheckpoint)
        return {ok:false,refused:true,error:'Challenge changed or a save still needs to settle.'};
      const candidate = {...S,challenge:null,chDone:{...S.chDone,[C.id]:true},rewards:pitchCopy(S.rewards)};
      const id = `challenge:${C.id}:first`;
      if (!S.chDone[C.id] && !candidate.rewards.claims[id]) candidate.rewards.claims[id] = {status:'prepared',origin:'new',descriptor:pitchCopy(request.descriptor)};
      const result = Economy.saveStateAcknowledged(candidate);
      if (result.ok) { S.rewards = candidate.rewards; endChallenge('done',true); }
      return result;
    },
    identitySettled:() => !S.meta.seasons?.pending && !S.meta.commissionBoard?.pending && !S.meta.automation?.challenge?.pending && !S.meta.challengeMastery?.pending && !layerChoices.size && !commissionPending && !musePending && !writer?.localDisposition() && (!extensions.get('automation') || extensions.get('automation').identitySettled()),
    ...(worksPlay?.enabled ? {
      worksPlayContinue() { const message=worksPlay.continueMessage(S);if(message)newsPush(message); },
      worksPlayCommit(request) {
        if (!writer?.owns() || !writer.transacting() || window.VaultSaveGate?.blocked || writer.localDisposition() || layerChoices.size || commissionPending || musePending || (!extensionAPI.identitySettled() || !extensionAPI.layerSettled())) return {ok:false,refused:true,error:'Finish waiting work before using Works.'};
        try {
          const candidate=worksPlay.proposal(S,request,trainingIngredients());
          candidate.lastSeen=Math.max(S.lastSeen,Date.now());
          const result=Economy.saveStateAcknowledged(candidate);
          if(result.ok){S=candidate;bankV++;mark();}
          return result;
        }catch(error){return {ok:false,refused:true,error:error.message};}
      }
    } : {}),
    ...(worksDemo?.enabled ? {
      worksDemoCommit(request) {
        if (!writer?.owns() || !writer.transacting() || window.VaultSaveGate?.blocked || writer.localDisposition()) return {ok:false,error:'Works demo save owner unavailable'};
        try {
          const candidate=worksDemo.proposal(S,request,trainingIngredients());
          candidate.lastSeen=Math.max(S.lastSeen,Date.now());
          const result=Economy.saveStateAcknowledged(candidate);
          if(result.ok){S=candidate;bankV++;mark();}
          return result;
        }catch(error){return {ok:false,refused:true,error:error.message};}
      }
    } : {}),
    ...(archiveFeature?.enabled ? {
      archiveSettle,
      archiveCommit(request) {
        const fixedCheckpoint=S.prem.vault?.freeSpeed && S.rewards.awayCheckpoint?.phase==='archive' &&
          ['income','incomeFinish'].includes(request.action) && VaultPlay.supported(S) &&
          (writer?.boundaryProgressing() || request.action==='incomeFinish' && S.meta.archive?.pending);
        if (!writer?.owns() || !writer.transacting() || window.VaultSaveGate?.blocked || writer.localDisposition() && !fixedCheckpoint) return {ok:false,error:'Archive save owner unavailable'};
        try {
          let candidate, production = 0, online = false;
          if (request.action === 'income') {
            const cp = S.rewards.awayCheckpoint;
            let interval = archiveInterval;
            if (cp?.phase === 'archive') {
              const start = Math.max(cp.nowMs - cp.awaySec * 1000,S.meta.archive.through), end = Math.max(start,cp.nowMs - cp.awaySec * 1000 + cp.sec * 1000);
              interval = {observed:cp.nowMs,spans:end > start ? [{start,end,seconds:(end-start)/1000*cp.multiplier*cp.eff}] : []};
            } else if (!interval && archiveSpans.length) interval = {observed:Math.ceil(Math.max(Date.now(),archiveSpans.at(-1).end)),spans:archiveSpans};
            else if (!interval) return {ok:true,empty:true};
            archiveInterval = interval;
            candidate = {...S,meta:{...S.meta,archive:archiveFeature.prepare(S,interval,bananas.acknowledgement())}};
          } else if (request.action === 'incomeFinish') {
            const p = archiveFeature.pending(S), a = p.next;
            production = p.credit?.amount || 0; online = !S.rewards.awayCheckpoint;
            candidate = {...S,meta:{...S.meta,archive:a},rewards:pitchCopy(S.rewards),run:{...S.run,earned:S.run.earned+(p.credit?.amount || 0)}};
            if (p.credit) candidate.rewards.walletHead = {id:p.credit.id,sequence:p.credit.sequence,amount:p.credit.amount,origin:'archive'};
            if (candidate.rewards.awayCheckpoint?.phase === 'archive') candidate.rewards.awayCheckpoint.phase = 'bulk';
          } else candidate = archiveFeature.proposal(S,request);
          candidate.lastSeen = S.rewards.awayCheckpoint ? S.lastSeen : Math.max(S.lastSeen,Date.now());
          const result = Economy.saveStateAcknowledged(candidate);
          if (result.ok) {
            const checkpoint = S.rewards.awayCheckpoint;
            if (checkpoint && candidate.rewards.awayCheckpoint) {
              const nextCheckpoint = candidate.rewards.awayCheckpoint;
              nextCheckpoint.report = checkpoint.report; nextCheckpoint.sold = checkpoint.sold;
              Object.assign(checkpoint,nextCheckpoint); candidate.rewards.awayCheckpoint = checkpoint;
            }
            S = candidate;
            if (request.action === 'incomeFinish') {
              if (online && production && printingEnabled()) {
                const helper = printingHelper(); helper?.sampleUpdate(true);
                if (archiveSampleToken === null || archiveSampleToken !== helper?.printSampleStatus().generation) helper?.resetSample();
                else helper?.printPosting(production,archiveSampleToken);
              }
              archiveSpans = []; archiveInterval = null; archiveSampleToken = null;
            }
            bankV++; mark();
          }
          return result;
        } catch(error) {return {ok:false,refused:true,error:error.message};}
      }
    } : {}),
    ...(window.Estate?.enabled ? {
      estatePreview() {
        if (!archiveSettle()) throw Error('Archive income is waiting to save.');
        const quote = Estate.quote(S), start = startingRoom(Estate.project(S, fresh()));
        return Estate.review(S, {...start, quote, reward:S.rewards.claims['layer:estate:first'] ? null : writer.estateReward(start.basis)});
      },
      estateCommit(request) {
        if (!writer?.owns() || !writer.transacting() || window.VaultSaveGate?.blocked || writer.localDisposition()) return {ok:false,refused:true,error:'Estate owner unavailable'};
        try {
          const candidate = request.action === 'reset' ? Estate.prepare(S,request) : Estate.pending(S).candidate;
          const result = Economy.saveStateAcknowledged(candidate);
          if (result.ok) {
            S = candidate;
            if (request.action === 'finish') { Estate.clearReview(); layerRuntimeReset('estate'); }
            mark();
          }
          return result;
        } catch(error) { return {ok:false,refused:true,error:error.message}; }
      },
      estateCrewValid:(crew,source) => crew.length === (source.legacy.ups.crew ? 2 : 0) && crew.every(t =>
        typeof t.name === 'string' && LOOKS.some(l => l.id === t.look && l.trait === t.trait) &&
        Number.isSafeInteger(t.talent) && t.talent >= 0 && t.talent <= 12 && t.coach === 0 && t.rerolls === 0 && t.xp === 0 && t.lv === 1 && t.hat === 0 && typeof t.shiny === 'boolean'),
      estateRoom:source => Estate.project(source, fresh(), true)
    } : {}),
    ...(layers?.enabled ? {
      layerPreview, layerMuseName:id => MUSES.find(m => m.id === id)?.name || id,
      layerSettled:() => !challengeActive() && !S.meta.automation?.challenge?.pending && !S.meta.automation?.media?.pending && !layerChoices.size && trainingPool?.mode() !== 'suspended' &&
        !document.querySelector('.mg01-overlay') && (!pg || S.meta.productionGoal === undefined || pg.valid(S.meta.productionGoal)) &&
        (!extensions.get('automation') || extensions.get('automation').validConfig(S.meta.automation)),
      layerCommit(request) {
        if (!writer?.owns() || !writer.transacting() || window.VaultSaveGate?.blocked || writer.localDisposition()) return {ok:false, error:'Imprint save owner unavailable'};
        try {
          let candidate;
          if (request.action === 'found') {
            const q = layers.quote(S);
            if (!layers.same(q,request.quote) || !layers.same(S.meta.layers,request.expected)) throw Error('Foundation changed. Review it again.');
            if (layerOffer && layerOffer.legacy !== JSON.stringify(S.legacy)) throw Error('Legacy upgrades changed. Review the foundation again.');
            const offer = layerOffer && layers.same(layerOffer.quote,q) ? layerOffer : layerPreview();
            candidate = layers.project(S, fresh());
            candidate.desks[0].paws = offer.room.desks[0].paws; candidate.desks[0].crew = JSON.parse(JSON.stringify(offer.room.desks[0].crew)); candidate.hold = offer.room.hold;
            candidate.looks = {...candidate.looks, ...offer.room.looks};
            if (offer.reward) candidate.rewards.claims['layer:imprint:first'] = {status:'prepared', origin:'new', descriptor:offer.reward};
            const pending = {...layers.epochFields(S),id:layers.identityKey('imprint',[q.count + 1,q.total],layers.epochFields(S)), total:q.total, seed:offer.seed, marker:bananas.acknowledgement(), candidate};
            candidate = {...S, meta:{...S.meta, layers:{...layers.current(S), pending}}};
          } else if (request.action === 'finish') {
            candidate = JSON.parse(JSON.stringify(layers.pending(S).candidate));
          } else candidate = {...S, meta:{...S.meta, layers:layers.proposal(S,request)}};
          candidate.lastSeen = Date.now();
          const result = Economy.saveStateAcknowledged(candidate);
          if (result.ok) {
            if (request.action === 'finish') { S = candidate; layerOffer = null; layerRuntimeReset(); }
            else { S.meta = candidate.meta; S.lastSeen = candidate.lastSeen; }
            mark();
          }
          return result;
        } catch(error) { return {ok:false, refused:true, error:error.message}; }
      }
    } : {}),
    ...(folio ? {
      folioDesks:DESKS.map(d => d.name),
      folioCommit(request) {
        if (!writer?.owns() || !writer.transacting() || window.VaultSaveGate?.blocked || writer.localDisposition()) return {ok:false, error:'Folio save owner unavailable'};
        try {
          const manual = !!(S.focus && !S.autoFocus && !S.written[S.focus]) || !!(pg?.active(pgContext) && S.meta.productionGoal.manual);
          const patch = folio.proposal(S, request, bananas.acknowledgement(), manual);
          const candidate = {...S, meta:{...S.meta, folio:patch.folio}, lastSeen:S.rewards.awayCheckpoint ? S.lastSeen : Date.now()};
          if (request.action === 'finish') { const stamps = layers?.stamp(S); if (stamps) candidate.meta.layers = stamps; }
          if (patch.bank) candidate.bank = patch.bank;
          if (patch.letters) candidate.desks = S.desks.map((d,i) => i === patch.letters.desk ? {...d, letters:patch.letters.pool} : d);
          if (patch.earned) candidate.run = {...S.run, earned:S.run.earned + patch.earned};
          const result = Economy.saveStateAcknowledged(candidate);
          if (result.ok) {
            S.meta = candidate.meta; S.lastSeen = candidate.lastSeen;
            if (patch.bank) { S.bank = candidate.bank; bankV++; }
            if (patch.letters) S.desks[patch.letters.desk].letters = patch.letters.pool;
            if (patch.earned) S.run = candidate.run;
            mark();
          }
          return result;
        } catch(error) { return {ok:false, refused:true, error:error.message}; }
      }
    } : {}),
    ...(trainingPool ? {
      trainingPoolFacts,
      commitTrainingPool(expected, next) {
        if (window.VaultSaveGate?.blocked || !progressing() || writer && (writer.localDisposition() || !writer.guard(S))) return { ok:false, error:'Save owner is unavailable' };
        const current = S.meta.trainingPool;
        if ((current === undefined ? null : JSON.stringify(current)) !== expected || current !== undefined && !trainingPool.valid(current) || !trainingPool.valid(next)) return { ok:false, error:'Training choice changed or is unsupported' };
        const training = JSON.parse(JSON.stringify(next)), lastSeen = S.rewards.awayCheckpoint ? S.lastSeen : Date.now();
        const result = layerChoiceResult('trainingPool', Economy.saveStateAcknowledged({ ...S, meta:{ ...S.meta, trainingPool:training }, lastSeen }));
        if (result.ok) { S.meta.trainingPool = training; S.lastSeen = lastSeen; mark(); }
        return result;
      }
    } : {}),
    ...(new URLSearchParams(location.search).get('lg03') === '1' ? {
      automationAllowed: () => !masteryActive() && !window.VaultSaveGate?.blocked && progressing() && (!writer || !writer.localDisposition() && writer.guard(S)),
      museEnabled:gardenPrototype, seatMuse, commitMuse, museContext, museScore, museSelection, clearMuseIncomplete,
      museStatus:() => ({pending:!!musePending}),
      retryMuse:() => musePending ? commitMuse(musePending) : {ok:false,retryable:false,error:'No waiting seating choice'},
      reconcileMuse() {
        const m = S.meta.automation?.muse?.manual;
        if (!gardenPrototype() || !writer?.owns() || !extensionAPI.automationAllowed() || !extensions.get('automation').validConfig(S.meta.automation) ||
            !m || m.complete || layers.epochMatches(S,m) && m.imprint === layers.identity(S) && m.printing === S.printing) return;
        const candidate = {...S,meta:{...S.meta}}; clearMuseIncomplete(candidate);
        if (writer.guard(candidate) && Economy.saveStateAcknowledged(candidate).ok) { S.meta = candidate.meta; mark(); }
      },
      gardenEnabled:gardenPrototype,
      mediaEnabled:mediaPrototype, validMedia, mediaPlan, mediaValidate, mediaCommit,
      mediaNext:() => { const q = mediaSelection(); return q ? {division:q.D.id,name:q.D.name,index:q.before,cost:q.cost} : null; },
      mediaAttempt:() => { const q = mediaSelection(); return q ? writer.mediaRelease({...layers.epochFields(S),division:q.D.id,quantity:1,origin:'auto'}) : {ok:false,error:'Waiting for a loaded, unlocked release costing at most 5% of your wallet.'}; },
      pitchEnabled:pitchPrototype, validPitch, trackedPitch, clearPitchPending,
      pitchSaleValidate, pitchSaleCommit,
      pitchStatus:() => ({pending:!!commissionPending,notice:commissionNotice}),
      retryCommission:() => commissionPending && commission(commissionPending.i,commissionPending.origin,null,commissionPending),
      pitchAttempt:() => { const i = pitchSelection(); return i < 0 ? {ok:false,error:'Waiting for a reachable wanted offer and free focus.'} : commission(i,'auto'); },
      clearGardenPending:state => extensions.get('automation')?.clearGardenPending(state),
      commitGarden,
      reconcileGarden() {
        const helper = extensions.get('automation');
        if (!gardenPrototype() || !writer?.owns() || !extensionAPI.automationAllowed() || !helper.validConfig(S.meta.automation) ||
            !S.meta.automation?.garden?.manual?.pending || helper.pendingCrop(S)) return;
        const candidate = {...S, meta:{...S.meta}};
        helper.clearGardenPending(candidate);
        if (writer.guard(candidate) && Economy.saveStateAcknowledged(candidate).ok) { S.meta = candidate.meta; mark(); }
      },
      gardenAttempt(cfg) {
        const desk = DESKS.findIndex(d => d.id === cfg.desk), i = cfg.bed, b = S.garden.beds[i];
        if (!Number.isInteger(i) || i < 0 || i >= S.garden.beds.length || !S.desks[desk]?.owned) return {ok:false, error:'Configured bed or desk is unavailable'};
        if (!b) return plant(i,cfg.letter,desk,'auto');
        if (b.ch !== cfg.letter || b.desk !== desk || savedWallNow() < b.ready) return {ok:false, error:'Waiting for a matching ripe crop'};
        return extensions.get('automation').gardenAction(gardenRequest('harvest',[i],null,null,'auto'));
      },
      automationDesks: () => DESKS.map((d, index) => ({ id:d.id, name:d.name, index, owned:S.desks[index].owned })),
      commitAutomation(expected, next) {
        if (!extensionAPI.automationAllowed()) return { ok:false, error:'Save owner is unavailable' };
        if (challengeActive() && !challengeHandover()) return {ok:false,error:'A11 handover waiting'};
        const current = S.meta.automation;
        if ((current === undefined ? null : JSON.stringify(current)) !== expected || !extensions.get('automation').validConfig(current) || !next || !extensions.get('automation').validConfig(next) || JSON.stringify(current?.tiers) !== JSON.stringify(next.tiers) || JSON.stringify(current?.garden?.manual) !== JSON.stringify(next.garden?.manual) || !pitchSame(current?.pitch?.manual,next.pitch?.manual) || !pitchSame(current?.pitch?.sale,next.pitch?.sale) || !pitchSame(current?.media?.manual,next.media?.manual) || (current?.media?.sequence ?? 0) !== (next.media?.sequence ?? 0) || !pitchSame(current?.media?.pending,next.media?.pending) || !museSame(current?.muse?.manual,next.muse?.manual) || current?.net && current.net.version !== next.net?.version) return { ok:false, error:'Automation save changed or is unsupported' };
        if (!pitchSame(current?.challenge,next.challenge)) return {ok:false,error:'A11 settings use their named owner'};
        if (!pitchSame(current?.print?.manual,next.print?.manual) || !pitchSame(current?.print?.pending,next.print?.pending) || printingEnabled() && next.print?.enabled && (!(S.intro.done && S.meta.estate?.count >= 1 && current?.print?.manual?.complete) || next.print.disclosed !== true)) return {ok:false,error:'Auto-print proof or disclosure is unavailable'};
        const automation = JSON.parse(JSON.stringify(next)), lastSeen = S.rewards.awayCheckpoint ? S.lastSeen : Date.now();
        const result = layerChoiceResult('automation', Economy.saveStateAcknowledged({ ...S, meta:{ ...S.meta, automation }, lastSeen }));
        if (result.ok) { S.meta.automation = automation; S.lastSeen = lastSeen; mark(); }
        return result;
      },
      quoteAutomationTier(id) {
        const current = S.meta.automation, valid = extensions.get('automation').validConfig(current);
        const level = current?.tiers?.[id] ?? 0, price = [1, 2, 4][level];
        const gate = { hire:S.printing >= 1, shop:S.printing >= 2, coach:!!S.chDone.hands,
          restore:S.printing >= 4 && !!S.chDone.haiku, net:S.printing >= 5 && !!S.chDone.timed };
        const error = !Object.hasOwn(gate, id) || !valid ? 'Unsupported automation tier' :
          !S.intro.done || !gate[id] ? 'Helper is locked' : level === 3 ? 'Max level' :
          !extensionAPI.automationAllowed() ? 'Save owner is unavailable' :
          !Number.isSafeInteger(S.legacy.stars) || S.legacy.stars < price ? 'Not enough Legacy stars' : '';
        return { ok:!error, error, level, price };
      },
      buyAutomationTier(id, expectedLevel, expected) {
        const q = extensionAPI.quoteAutomationTier(id), current = S.meta.automation;
        if (!q.ok || q.level !== expectedLevel || (current === undefined ? null : JSON.stringify(current)) !== expected ||
          !extensions.get('automation').tierRequestAllowed(id, expectedLevel, expected))
          return { ok:false, retryable:false, error:q.error || 'Automation tier changed. Choose the upgrade again.' };
        const automation = current === undefined ? {version:1} : JSON.parse(JSON.stringify(current));
        automation.tiers = { ...automation.tiers, version:1, [id]:q.level + 1 };
        if (id === 'net') automation.net = { enabled:false, ordinary:0, golden:0, ...automation.net, version:2 };
        const legacy = { ...S.legacy, stars:S.legacy.stars - q.price }, lastSeen = S.rewards.awayCheckpoint ? S.lastSeen : Date.now();
        const result = layerChoiceResult('automation', Economy.saveStateAcknowledged({ ...S, legacy, meta:{ ...S.meta, automation }, lastSeen }));
        if (result.ok) { S.legacy = legacy; S.meta.automation = automation; S.lastSeen = lastSeen; mark(); }
        return result;
      },
      quoteAutomationHire(i, reservePercent) {
        if (S.printing < 1 || !S.intro.done) return { ok:false, error:'Requires Printing 2' };
        if (!extensionAPI.automationAllowed()) return { ok:false, error:'Progression or save is paused' };
        const d = Number.isInteger(i) && S.desks[i], u = UPS.find(x => x.k === 'paw');
        if (!d?.owned) return { ok:false, error:'Desk is not owned' };
        if (trainingPool && trainingPool.mode() !== 'local') {
          const plan = trainingQuote(u, d, i, 1);
          return { ...plan, error:plan.error || (!plan.n ? 'Typist cap reached' : '') };
        }
        if (!Number.isInteger(reservePercent) || reservePercent < 0 || reservePercent > 100 || reservePercent % 5) return { ok:false, error:'Unsupported reserve' };
        const lock = upLock(u, d), plan = upPlan(u, d, i, 1), held = totalLetters(d);
        if (lock) return { ok:false, error:lock };
        if (!plan.n) return { ok:false, error:'Typist cap reached' };
        if (held < plan.cost) return { ok:false, error:'Waiting for affordable letters', cost:plan.cost };
        if (held - plan.cost < Math.ceil(held * reservePercent / 100)) return { ok:false, error:'Waiting for letter reserve', cost:plan.cost };
        return { ok:true, cost:plan.cost };
      },
      quoteAutomationRestore(i) {
        if (S.printing < 4 || !S.chDone.haiku || !S.intro.done) return { ok:false, error:'Requires Printing 5 and Haiku completion' };
        if (!extensionAPI.automationAllowed()) return { ok:false, error:'Progression or save is paused' };
        const d = Number.isInteger(i) && S.desks[i];
        if (!d?.owned) return { ok:false, error:'Desk is not owned' };
        const level = S.meta.automation?.tiers?.restore ?? 0;
        if (!extensions.get('automation').validConfig(S.meta.automation)) return { ok:false, error:'Unsupported automation tier' };
        const price = mkCost(i), margin = [2, 1.75, 1.5, 1][level], error = challengeShopLock('mk') || (d.mk >= 2 ? 'Restoration cap reached' :
          !(bananas.get() >= margin * price) ? `Waiting for wallet of at least ${margin} times the restoration price` : '');
        return { ok:!error, error, price };
      },
      restoreAutomationOne(i) {
        return extensionAPI.quoteAutomationRestore(i).ok && !!buy('mk', i);
      },
      automationCoachTargets() {
        return S.desks.flatMap((d, index) => d.owned ? d.crew.slice(0, d.paws).map((_, paw) =>
          ({ index, paw, ...extensionAPI.quoteAutomationCoach(index, paw) })) : []);
      },
      quoteAutomationCoach(i, p) {
        if (!S.chDone.hands || !S.intro.done) return { ok:false, error:'Requires No Hands completion' };
        if (!extensionAPI.automationAllowed()) return { ok:false, error:'Progression or save is paused' };
        const d = Number.isInteger(i) && S.desks[i], t = d?.owned && Number.isInteger(p) && p >= 0 && p < d.paws && d.crew[p];
        if (!t) return { ok:false, error:'Monkey is not owned' };
        const coach = t.coach || 0, price = coachCost(i, t);
        const error = coach >= COACH_MAX ? 'Coaching cap reached' :
          !(price <= bananas.get() / 20) ? 'Waiting for cost at most 5% of wallet' : '';
        return { ok:!error, error, price, coach, level:levelOf(t.xp), name:t.name, desk:DESKS[i].name };
      },
      coachAutomationOne(i, p) {
        return extensionAPI.quoteAutomationCoach(i, p).ok && !!coachTypist(i, p);
      },
      quoteAutomationShop(key) {
        if (!['hold', 'contracts', 'metro', 'dbl', 'agent', 'analyst'].includes(key)) return { ok:false, error:'Unsupported shop item' };
        const price = SHOP[key], owned = !!S[key], lock = shopLock(key);
        const error = owned ? 'Owned' : lock || (S.printing < 2 || !S.intro.done ? 'Requires Printing 3' :
          !extensionAPI.automationAllowed() ? 'Progression or save is paused' :
          !(price < bananas.get() / 10) ? 'Waiting for price below 10% of wallet' : '');
        return { ok:!error, price, owned, error };
      },
      buyAutomationShopOne(key) {
        return extensionAPI.quoteAutomationShop(key).ok && !!buy(key);
      },
      hireAutomationOne(i, reservePercent) {
        return extensionAPI.quoteAutomationHire(i, reservePercent).ok && !!buyUp('paw', i, 1);
      }
    } : {}),
    ...(new URLSearchParams(location.search).get('mg01') === '1' ? {
      commitMinigames(expected, next) {
        if (window.VaultSaveGate?.blocked || !progressing() || writer && (writer.localDisposition() || !writer.guard(S))) return { ok:false, error:'Save owner is unavailable' };
        const current = S.meta.minigames;
        if ((current === undefined ? null : JSON.stringify(current)) !== expected || current && current.version !== 1 || !next || next.version !== 1) return { ok:false, error:'Break Room save changed or is unsupported' };
        const minigames = JSON.parse(JSON.stringify(next)), lastSeen = S.rewards.awayCheckpoint ? S.lastSeen : Date.now();
        const result = layerChoiceResult('minigames', Economy.saveStateAcknowledged({ ...S, meta:{ ...S.meta, minigames }, lastSeen }));
        if (result.ok) { S.meta.minigames = minigames; S.lastSeen = lastSeen; mark(); }
        return result;
      }
    } : {}),
    ...(writer ? {
      expandedManual, expandedAccess,
      rewardBasis, rewardAwards:() => allAwards().map(({ id, tier, name }) => ({ id, tier, name })), goalFacts,
      rewardDeskName:i => DESKS[i]?.name,
      goalAwards:() => allAwards().map(({ id, tier, name, desc }, order) => ({ id, tier, name, desc, order })),
      openAward(id) { if (!progressing() || !tabVisible('records') || !allAwards().some(a => a.id === id)) return false;
        ui.sub.records = 'awards'; setTab('records');
        const card = document.getElementById('o-award-' + id), pane = $('#o-records');
        if (card && pane) { pane.scrollTop += card.getBoundingClientRect().top - pane.getBoundingClientRect().top - 60; card.focus({ preventScroll:true }); }
        return !!card;
      },
      nativeRush:() => buffOn('rush'),
      vaultBoundary, vaultCommit, lampCommit, lampHold, lampRelease,
      vaultContext:() => ({cap:awayCap(),eff:awayEff(),intro:!introActive(),lamp:S.lamp}),
      lampSaved:command => extensionEvent('lampSaved',command),
      lampRefused:message => extensionEvent('lampRefused',message),
      vaultResume:() => { if (writer.owns() && writer.boundaryProgressing()) paused = false; },
      vaultPrepare:() => writer.owns() && !paused && !writer.transacting(),
      vaultComplete:() => { last=performance.now(); },
      rewardCommit(candidate) {
        if (!writer.owns()) return { ok:false, error:'Not the save owner' };
        const result = Economy.saveStateAcknowledged(candidate);
        if (result.ok) {
          const checkpoint = S.rewards.awayCheckpoint;
          if (checkpoint && candidate.rewards.awayCheckpoint) {
            const nextCheckpoint = candidate.rewards.awayCheckpoint;
            Object.assign(checkpoint.report, nextCheckpoint.report); Object.assign(checkpoint.sold, nextCheckpoint.sold);
            nextCheckpoint.report = checkpoint.report; nextCheckpoint.sold = checkpoint.sold;
            Object.assign(checkpoint, nextCheckpoint); candidate.rewards.awayCheckpoint = checkpoint;
          }
          S.rewards = candidate.rewards; S.prem = candidate.prem; S.run = candidate.run;
          if (expanded) { S.awards = candidate.awards; if (candidate.meta.expandedAwards !== undefined) S.meta.expandedAwards = candidate.meta.expandedAwards; if (candidate.meta.speedFundingAwards !== undefined) S.meta.speedFundingAwards = candidate.meta.speedFundingAwards; }
          S.desks.forEach((d, i) => { d.letters = candidate.desks[i].letters; });
          mark();
        }
        return result;
      },
      rewardContinue:() => { if (S.rewards.awayCheckpoint) simulateAway(0); if (progressing()) { checkAwards(true); buildStage(); mark(); } }
    } : {}),
    clock: { speed, monotonicNow:() => performance.now(), wallNow: () => Date.now(), productionNow },
    register(id, hooks) {
      if (extensions.has(id)) return false;
      if (!/^[a-z][a-z0-9-]*$/.test(id) || !hooks || typeof hooks !== 'object') throw new Error('Invalid extension');
      if (hooks.speed && speedProvider) throw new Error('Production speed already registered');
      if (hooks.tab && TABS.some(t => t[0] === hooks.tab[0])) throw new Error('Tab already registered');
      extensions.set(id, hooks); if (hooks.speed) speedProvider = hooks.speed;
      if (hooks.tab) {
        const tab = hooks.tab; TABS.push(tab);
        TAB_GATES[tab[0]] = () => !hooks.visible || hooks.visible(extensionAPI);
        RENDER[tab[0]] = () => hooks.render(extensionAPI, $('#o-' + tab[0]));
        $('.o-panel').insertAdjacentHTML('beforeend', `<section class="o-pane" id="o-${esc(tab[0])}" role="tabpanel" hidden></section>`);
        document.getElementById('oTabs').insertAdjacentHTML('beforeend', tabBtn(tab));
      }
      hooks.init?.('load', extensionAPI); mark(); return true;
    }
  };
  IMI.ops.extensions = extensionAPI; IMI.ops.clock = extensionAPI.clock;
  /* Balance harness hook (tools/balance.html): lets a bot drive the real game logic. Not used by the site itself. */
  Object.defineProperty(IMI.ops, 'dev', { configurable: true, get: () => ({
    S: () => S, tabVisible, introProgress, completeIntro, upEffect, holdRate, ui, tick, press, genPitch, newOffers, buyUp, buy, writeTitle, bankWord, keeperStep, canWrite, RECIPES, RBY, DESKS, KEEPER_PERIOD, UPS, upPlan, upLock, DIVS, divPlan, releaseDiv, DEALS, SHOP, LAMP, MUSES, MK_BASE, mkCost,
    ...(layers?.enabled ? {layerFrequency:freqNow, layerOfflineDist:offlineDist} : {}),
    GARDEN_COSTS, MILES, focusNeeds, focusRecipe, stock, totalLetters, soldCount, kidsSold, kidsListed, KIDS, libSold, LIBS, touchBank: () => { bankV++; mark(); }, sky, marketBias, BARO_COST, typistSpeed, autoRate, coachTypist, rerollTypist, unrollTypist, coachCost, rerollCost, COACH_MAX, COACH_STEP, upCap, pubSell, pubStatus, PUB_COST, PUB_PERIOD, PUB_RULES, keeperPeriod, keeperUpCost, keeperLv, KEEPER_UP_MAX, royBase, divBase, salePay, marketMult, checkAwards, starsNow, museSlots, registerPitch, pitchActive, PITCH_MAX, buffs, makeCopies,
    plant, harvest, gardenTime, gardenYield, BAND_WORDS, target, ensureCrew, doPrint, awayCap, awayEff, LEG, legLvl, CHALLENGES, dailyState, buffOn, ROY_BASE, RATE, action: (name, dataset = {}) => ACTIONS[name]?.({ dataset }), comboHit: () => comboHit(), setSel: i => { S.sel = i; }
   }) });

  /* ================= banking & writing ================= */
  function bankWord(d, w) {
    const c = lcount(w);
    for (const k in c) if ((d.letters[k] || 0) < c[k]) return false;
    for (const k in c) for (let n = 0; n < c[k]; n++) takeLetter(d, k);
    S.stats.words++; S.bank[w] = stock(w) + 1; bankV++; ui.lastBanked = w; ui.bankedAt = performance.now(); mark(); IMI.emit('bank', { word: w }); return true;
  }
  function keeperStep(d, i) {
    if (worksActive() || !keepersReady()) return;
    const k = d.keeper; if (!k.owned || !k.on) return;
    const r = focusRecipe(d), words = BAND_WORDS[i];
    if (r) for (const w of words) if (r.need[w] && stock(w) < r.need[w] && canMake(d, w)) { bankWord(d, w); keeperFloat(i, w); return; }
    if (folioGoal() || pg?.active(pgContext)) return;
    const reserved = r ? focusNeeds(d, i).oneCopy : {};
    let best = null, bestStock = Infinity;
    for (const w of words) {
      const t = target(d, w), s = stock(w);
      if (t <= 0 || s >= t || s >= bestStock || !canMake(d, w)) continue;
      const c = lcount(w); let safe = true;
      for (const ch in c) { const have = d.letters[ch] || 0; if (have - c[ch] < Math.min(have, reserved[ch] || 0)) { safe = false; break; } }
      if (safe) { best = w; bestStock = s; }
    }
    if (best) { bankWord(d, best); keeperFloat(i, best); }
  }
  function keeperFloat(i, w) {
    if (i !== S.sel || ui.tab !== 'floor') return;
    const t = $('#oTray'); if (!t) return; const b = t.getBoundingClientRect();
    floatText('+' + w, b.left + 20 + rand() * Math.max(10, b.width - 80), b.top); if (typists.length) kick(false);
  }
  const canWrite = r => titleAvailable(r) && !S.written[r.id] && inPlay(r) && progress(r) === r.total;
  /* the title's word chips lift off the card and pour into the sell button, like pages into a binding */
  function gatherWords(btn) {
    const card = btn.closest('.o-card'); if (!card || IMI.reduceMotion) return;
    const [tx, ty] = IMI.centerOf(btn), chips = [...card.querySelectorAll('.o-chip')].slice(0, 18);
    chips.forEach((c, k) => {
      const r = c.getBoundingClientRect(), f = c.cloneNode(true); f.classList.add('o-fly');
      f.style.cssText = `left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px`; document.body.appendChild(f);
      const dx = tx - r.left - r.width / 2, dy = ty - r.top - r.height / 2;
      f.animate([{ transform: 'none' }, { transform: `translate(${dx * .3}px, ${dy * .3 - 40}px) rotate(${(rand() - .5) * 30}deg) scale(1.1)`, offset: .35 }, { transform: `translate(${dx}px, ${dy}px) scale(.2)`, opacity: .2 }],
        { duration: 520, delay: k * 28, easing: PX ? 'steps(9)' : 'cubic-bezier(.5,0,.7,1)', fill: 'both' }).onfinish = () => { f.remove(); if (k === chips.length - 1) { shock(tx, ty, '#7be05a'); IMI.sfx.key(); } };
    });
  }
  /* opts.auto: the publisher's assistant is selling (lighter fanfare); opts.silent: bulk sales while away (no effects, no news); opts.mult: price at this market multiplier */
  function writeTitle(id, fromEl, opts = {}) {
    if (challengeActive() && (opts.auto || opts.silent || !challengeHandover())) return;
    const r = RBY[id]; if (!r || !canWrite(r) || !challengeSaleAllowed(r) || (chal('patientpress') || masteryActive()) && (opts.auto || opts.silent)) return;
    if (masteryActive() && S.meta.challengeMastery.active.required.includes(id)) return writer.masteryAction({action:'sale',id});
    if (pitchPrototype() && trackedPitch() && S.meta.automation.pitch.manual.pending.recipe.id === id) {
      if (opts.silent || document.hidden || IMI.screen() !== 'game') return;
      return writer.pitchSale({action:'prepare',...layers.epochFields(S),id,auto:!!opts.auto});
    }
    if (boardEnabled() && !opts.auto && !opts.silent && CommissionBoard.current(S)?.active?.status === 'active' && CommissionBoard.eligible(r) && !S.challenge && !workPaused()) {
      const action = CommissionBoard.observed(S) >= CommissionBoard.current(S).active.expiresAt ? 'expire' : 'sale';
      const result = writer.boardAction({action,...(action === 'sale' ? {id} : {})});
      if (action === 'sale' || !result.ok) return result;
    }
    challengeBeforeSale(S,r);
    if (fromEl) gatherWords(fromEl);
    for (const w in r.need) { S.bank[w] -= r.need[w]; if (S.bank[w] <= 0) delete S.bank[w]; }
    bankV++;
    const quiet = !!opts.silent, mk = opts.mult != null ? opts.mult : marketMult(r.band), pay = salePay(r, mk); S.stats.lump += pay; if (!quiet) S.stats.bestMult = Math.max(S.stats.bestMult || 0, mk);
    dropCaches(); S.written[id] = true; challengeAfterSale(S); introProgress(); if (r.gen) S.stats.pitchSold = (S.stats.pitchSold || 0) + 1;
    pg?.clearManual(S, id);
    if (S.focus === id) S.focus = null;
    pickAutoFocus();
    const at = fromEl ? IMI.centerOf(fromEl) : undefined;
    if (quiet && writer && S.rewards.awayCheckpoint) {
      const cp = S.rewards.awayCheckpoint; cp.sold.n++; cp.sold.pay += pay;
      if (!writer.awayCredit(pay, cp.phase)) return;
    } else {
      const sample = printingHelper()?.printSampleToken(), balance = bananas.get();
      if (quiet) bananas.add(pay); else bananas.earn(pay, at);
      printingHelper()?.printPosting(bananas.get() - balance,sample);
    }
    salePublished(r,pay,mk,at,opts);
  }

  function salePublished(r,pay,mk,at,opts) {
    const id = r.id, quiet = !!opts.silent;
    if (at) { IMI.burst(at[0], at[1], ['banana', 'spark', 'leaf'], 14); shock(at[0], at[1], '#ffd23a', true); }
    if (!opts.auto && !quiet) { flash('#fff6d6'); shake(2); }
    ui.fresh = id; if (!(ui.tab === 'press' && ui.sub.press === 'shelf')) ui.shelfNew = (ui.shelfNew || 0) + 1;      // the Shelf tab wears a badge until you look
    setTimeout(() => { ui.fresh = null; mark(); }, 2200);
    if (at) { const big = pay >= cash(50000) ? 3 : pay >= cash(5000) ? 2 : 1; for (let k = 1; k < big + 1; k++) setTimeout(() => IMI.burst(at[0] + (k % 2 ? -1 : 1) * k * 40, at[1] - k * 20, ['banana', 'banana', 'spark', 'star'], 14), k * 220); }
    if (!quiet) { if (!opts.auto) vib([20, 40, 70]); cheer(opts.auto ? 1400 : 3000, 'SOLD!'); IMI.sfx.ding(); }
    if (!quiet) logIt(`The Jungle Press bought the rights to “${r.title}”: ${fmtBig(pay)} bananas${mk !== 1 ? ` (market x${mk.toFixed(2)})` : ''}. It will not be reprinted.`);
    if (!quiet) newsPush(`EXTRA: The Jungle Press buys “${r.title}” for ${fmtBig(pay)} bananas${mk >= 1.3 ? ', cashing in on a hot market' : mk <= .8 ? ', in a cold market. Ouch' : ''}.`);
    const n = Object.keys(S.written).length;
    if (authoredSold() === BOOKS && !r.gen) celebrate(PX ? 'THE COMPLETE WORKS' : 'The Complete Works', PX ? 'EVERY TITLE SOLD' : 'Every title sold', `<p class="o-cel-sub">${BOOKS} parodies, written by monkeys. The shelf is full.</p>`);
    else if (!quiet && n === 1) IMI.banner(PX ? 'FIRST PRINTING!' : 'First Printing!');
    else if (!quiet && n % 4 === 0) IMI.banner(PX ? 'BESTSELLER!' : 'Bestseller!');
    mark(); if (!quiet) save();
    IMI.emit('sold', { id, pay });
    if (imprintChallenge()) checkChallenge();
  }

  /* ================= training upgrades (spend this desk's letters) ================= */
  const TIER = [1, 2.5, 6, 24, 96];
  /* chance by level, 0 to 5, of each tiered upgrade (levels 4 and 5 need the machine restored to Mk II and Mk III) */
  const UPV = { practice: [.65, .75, .85, .95, .97, .98], stock: [0, .2, .4, .6, .72, .8], ink: [0, .25, .45, .65, .78, .88], vowel: [0, .45, .65, .8, .88, .92], ribbon: [0, .1, .2, .3, .38, .45] };
  const UPS = [
    { k: 'paw',      ico: 'monkey', name: 'Hire a typist', base: 25, max: 12, desc: 'Another junior monkey swings in and types letters on its own.' },
    { k: 'fing',     name: 'Quick fingers', base: 40, grow: 1.6, max: 10, desc: "Typing speed from this upgrade. Crew, weather and boosts apply separately." },
    { k: 'rapid',    name: 'Rapid touch', base: 75, grow: 1.7, max: 8, desc: 'Held typing on this desk. Double touch applies to the displayed rate.', needs: 'hold' },
    { k: 'vowel',    name: 'Vowel rhythm', base: 30, tier: 1, desc: 'Vowel bias after a consonant, when earlier letter biases do not apply. Traits and Muses may raise it; the vowel challenge disables it.' },
    { k: 'ink',      name: 'Fresh ink', base: 40, tier: 1, desc: 'Finishing-letter bias for words never banked, when earlier letter biases do not apply.' },
    { k: 'practice', name: 'Recipe practice', base: 100, tier: 1, desc: 'Automatic presses favor missing title ingredients. Wordsmith adds 15 points, capped at 98%.' },
    { k: 'stock',    name: 'Stock-aware ink', base: 80, tier: 1, desc: 'Automatic finishing-letter bias for words below keeper targets, after recipe practice.' },
    { k: 'ribbon',   name: 'Spare ribbon', base: 150, tier: 1, desc: 'Each automatic press may swap one surplus letter for a missing title ingredient, if both exist.' }
  ];
  /* ---- coaching and rerolls: per-monkey upgrades, bought with bananas on the Train page ---- */
  const coachCost = (i, t) => roundMoney(COACH_BASE[i] * Math.pow(COACH_GROW, t.coach || 0));
  const rerollCost = (i, t) => roundMoney(REROLL_BASE[i] * Math.pow(1.5, t.rerolls || 0));
  function coachTypist(i, p) {
    if (challengeActive() && !challengeHandover()) return;
    const t = S.desks[i].crew[p]; if (!t || (t.coach || 0) >= COACH_MAX || !bananas.spend(coachCost(i, t))) return false;
    t.coach = (t.coach || 0) + 1; IMI.sfx.ding(); logIt(`${t.name} was coached to +${t.coach * COACH_STEP}%.`); mark(); save(); return true;
  }
  function rerollTypist(i, p) {
    if (challengeActive() && !challengeHandover()) return;
    const t = S.desks[i].crew[p]; if (!t || !bananas.spend(rerollCost(i, t))) return false;
    t.prev = { trait: t.trait, talent: t.talent || 0, look: t.look };                     // one undo: the roll you just replaced
    const look = rollLook(t.look); ui.lastLook = { id: look.id, fresh: !(S.looks || {})[look.id] }; seeLook(look.id);
    t.rerolls = (t.rerolls || 0) + 1; t.look = look.id; t.trait = look.trait; t.talent = rollTalent();
    IMI.sfx.ding(); logIt(`${t.name} was re-rolled: now a ${look.name} (${TRAITS[t.trait].name}), talent +${t.talent}%.`); restyleTypist(p); mark(); save(); return true;
  }
  function unrollTypist(i, p) {
    const t = S.desks[i].crew[p]; if (!t || !t.prev) return false;
    t.trait = t.prev.trait; t.talent = t.prev.talent; if (t.prev.look) t.look = t.prev.look; t.prev = null; IMI.sfx.tick(); restyleTypist(p); mark(); save(); return true;
  }
  const upLevel = (u, d, i) => (u.k === 'paw' ? Math.max(0, d.paws - (i ? 1 : 0)) : d.up[u.k]);
  const upMax = u => (u.k === 'paw' ? u.max : u.tier ? 5 : u.max);
  const upCap = (u, d) => (u.k === 'paw' && chal('smallcrew') ? 2 : u.tier ? (d.mk >= 2 ? 5 : d.mk >= 1 ? 4 : 3) : upMax(u));      // levels 4 and 5 of the tiered upgrades need the machine restored (Shop > Restorations)
  const upCost = (u, d, i) => { const l = upLevel(u, d, i), bs = u.k === 'paw' ? PAW_COST[i] * (1 + PAW_DESK_STEP * i) : u.base; return Math.round((trainingPool && trainingPool.mode() !== 'local' ? trainingPool.factors[i] : 1) * (u.tier ? bs * TIER[l] : bs * Math.pow((u.k === 'paw' ? PAW_GROW : u.grow || 1.7), l))); };
  const upLock = (u, d) => {
    if (u.k === 'paw' && chal('smallcrew') && d.paws >= 2) return 'Small Crew allows 2 typists per desk';
    if (u.needs === 'hold' && !toolOn('hold')) return 'Needs Hold to type (in the Shop)';
    if (u.tier) { const lv = d.up[u.k]; if (lv >= upCap(u, d) && lv < 5) return `Needs ${MK_NAMES[lv - 2]} (restore this machine in the Shop)`; }
    return '';
  };
  /* how many levels a purchase of `want` covers and what it costs (Max stops where your letters run out) */
  function trainingIngredients() {
    const required = S.desks.map(() => ({})), r = focusRecipe();
    for (const [w, count] of Object.entries(r?.need || {})) {
      const missing = Math.max(0, count - stock(w)), band = bandOf(w.length);
      for (const ch of w) required[band][ch] = (required[band][ch] || 0) + missing;
    }
    return required;
  }
  function worksFloors() { return activeWork()?.floors(S,trainingIngredients()) || S.desks.map(() => ({})); }
  function localTrainingHave(d,i) { const floor=worksFloors()[i];return Object.entries(d.letters).reduce((n,[ch,count])=>n+Math.max(0,count-(floor[ch]||0)),0); }
  function trainingPoolFacts(cost) {
    pickAutoFocus();
    const required=trainingIngredients(),demo=worksFloors();
    for(let i=0;i<required.length;i++)for(const [ch,n]of Object.entries(demo[i]))required[i][ch]=(required[i][ch]||0)+n;
    return trainingPool.plan(S.desks.map((d, i) => ({ owned:d.owned, letters:d.letters, id:DESKS[i].id })), required, S.meta.automation, cost);
  }
  function trainingQuote(u, d, i, want) {
    const pooled = trainingPool && trainingPool.mode() !== 'local';
    const plan = upPlan(u, d, i, want);
    if (!d?.owned || !plan.n || upLock(u, d)) return { ...plan, ok:false, error:upLock(u, d) || 'Training unavailable' };
    if (pooled) {
      if (trainingPool.mode() === 'suspended' || !progressing() || writer && (writer.localDisposition() || !writer.guard(S))) return { ...plan, ok:false, error:'Shared training suspended' };
      return { ...plan, ...trainingPoolFacts(plan.cost) };
    }
    return { ...plan, ok:(worksActive() ? localTrainingHave(d,i) : totalLetters(d)) >= plan.cost };
  }
  function upPlan(u, d, i, want) {
    const max = upCap(u, d), pooled = trainingPool && trainingPool.mode() !== 'local', facts = pooled ? trainingPoolFacts(0) : null, have = pooled ? facts.spendable || 0 : worksActive() ? localTrainingHave(d,i) : totalLetters(d); let lv = u.k === 'paw' ? d.paws : d.up[u.k], n = 0, cost = 0;
    while (n < want && lv + n < max) {
      const l = u.k === 'paw' ? Math.max(0, lv + n - (i ? 1 : 0)) : lv + n;
      const bs = u.k === 'paw' ? PAW_COST[i] * (1 + PAW_DESK_STEP * i) : u.base, c = Math.round((pooled ? trainingPool.factors[i] : 1) * (u.tier ? bs * TIER[l] : bs * Math.pow((u.k === 'paw' ? PAW_GROW : u.grow || 1.7), l)));
      if (want === Infinity && (pooled || n > 0) && cost + c > have) break;
      cost += c; n++;
    }
    return { n, cost };
  }
  const buyWant = () => (ui.buyN === 'max' ? Infinity : +ui.buyN || 1);
  function upEffect(u, d, level) {
    if (u.k === 'paw') return `${level} automatic typist${level === 1 ? '' : 's'}`;
    if (u.k === 'fing') return `x${(1 / Math.pow(.85, level)).toFixed(2)} typing speed`;
    if (u.k === 'rapid') return `${holdRate({ ...d, up: { ...d.up, rapid: level } })}/s held typing`;
    return `${Math.round(UPV[u.k][level] * 100)}% ${u.k === 'ribbon' ? 'swap chance' : 'configured bias'}`;
  }
  function buyUp(k, i = S.sel, want = buyWant()) {
    if (challengeActive() && !challengeHandover()) return;
    const d = S.desks[i], u = UPS.find(x => x.k === k); if (!u || !d?.owned) return;
    if (upLock(u, d)) return;
    const plan = trainingQuote(u, d, i, want); if (!plan.ok) return;
    if (plan.deductions) {
      for (const { i:donor, ch, n } of plan.deductions) {
        const pile = S.desks[donor]; pile.letters[ch] -= n;
        if (!pile.letters[ch]) delete pile.letters[ch];
        let remaining = n;
        pile.tray = pile.tray.slice().reverse().filter(letter => letter !== ch || remaining-- <= 0).reverse();
      }
    } else {
      let left = plan.cost;                               // incumbent local spending
      const floor = worksActive() ? worksFloors()[i] : {};
      while (left-- > 0) { const top = Object.keys(d.letters).filter(ch => d.letters[ch] > (floor[ch] || 0)).sort((a, b) => d.letters[b] - d.letters[a])[0]; takeLetter(d, top); }
    }
    if (u.k === 'paw') { d.paws += plan.n; ensureCrew(d); } else d.up[u.k] += plan.n;
    introProgress();
    IMI.sfx.ding(); mark(); save();
    if (u.k === 'paw') IMI.emit('hire', { n: plan.n, desk: i });
    return true;
  }

  /* ================= shop (spend bananas) ================= */
  function shopLock(what) {
    const constraint = challengeShopLock(what); if (constraint) return constraint;
    if (what === 'dbl' && !S.hold) return 'Needs Hold to type';
    if ((what === 'agent' || what === 'analyst') && soldCount() < 2) return 'Needs 2 sold titles';
    if ((what === 'metro' || what === 'dbl' || what === 'contracts') && !S.desks[2].owned) return 'Unlocks with Lagoon Sprint';
    return '';
  }
  function buy(what, arg) {
    if (challengeActive() && !challengeHandover()) return;
    const i = +arg;
    if (challengeShopLock(what)) return;
    if (what === 'desk') {
      const d = S.desks[i], p = DESKS[i].price;
      if ((chal('haiku') || masteryActive()) && i >= 2) return;
      if (d.owned || !S.desks[i - 1]?.owned || !bananas.spend(p)) return;
      d.owned = true; d.keeper.owned = true; d.paws = 1; ensureCrew(d); pickAutoFocus(); S.sel = i; ui.dropIn = true; cheer(2000, 'NEW!'); newsPush(`${DESKS[i].name} installed. The monkeys argue over who touches it first.`); IMI.banner(PX ? 'NEW TYPEWRITER!' : 'New Typewriter!'); buildStage(); IMI.emit('desk', { i });
      logIt(`${DESKS[i].name} installed on the canopy. It types ${DESKS[i].lo}–${DESKS[i].hi} letter words.`);
    } else if (what === 'plot') {
      const nx = GARDEN_COSTS[S.garden.beds.length - 2]; if (!nx || !bananas.spend(nx)) return;
      S.garden.beds.push(null); logIt('Cleared another plot in the letter garden.');
    } else if (what === 'mk') {
      const d = S.desks[i]; if (!d || !d.owned || d.mk >= 2 || !bananas.spend(mkCost(i))) return;
      d.mk++; logIt(`${DESKS[i].name} restored to ${MK_NAMES[d.mk]}. It gleams.`);
    } else if (what === 'baro') {
      const t = S.baro; if (t >= 2 || soldCount() < 2 || !bananas.spend(BARO_COST[t])) return;
      S.baro = t + 1; logIt(t ? 'A better barometer: the forecast reaches four changes ahead.' : 'Hung a barometer on the porch: the forecast now names what is coming.');
    } else if (what === 'pub') {
      const t = S.pub.tier; if (t >= 3 || (t === 0 && soldCount() < 3) || !bananas.spend(PUB_COST[t])) return;
      S.pub.tier = t + 1; if (t === 0) S.pub.on = true;
      logIt(['Hired a publisher’s assistant: finished titles now sell themselves.', 'Fast presses installed: the assistant sells twice as often.', 'The assistant now works the night shift: titles sell while you are away.'][t]);
    } else if (what === 'keeper') {
      const d = S.desks[i]; if (!d || !d.owned || keeperLv(i) >= KEEPER_UP_MAX || !bananas.spend(keeperUpCost(i))) return;
      d.keeper.lv = keeperLv(i) + 1; logIt(`${DESKS[i].name} keeper tuned up to level ${d.keeper.lv}: a word every ${keeperPeriod(i).toFixed(2)}s.`);
    } else if (what === 'lamp') {
      const nx = LAMP[S.lamp]; if (!nx || !bananas.spend(nx.cost)) return;
      S.lamp++; logIt(`Lit a bigger Night Lamp: typists now work up to ${nx.cap}h while you are away.`);
    } else if (what === 'deal') {
      const x = DEALS.find(q => q.id === arg); if (!x || S.deals[x.id] || soldCount() < x.need || !bananas.spend(x.cost)) return;
      S.deals[x.id] = true; logIt(`Signed a publishing deal: ${x.name}.`);
    } else if (SHOP[what] && !S[what]) {
      if (shopLock(what)) return;
      if (!bananas.spend(SHOP[what])) return;
      S[what] = true;
    } else return;
    IMI.sfx.ding(); mark(); save();
    return true;
  }

  /* ================= icons ================= */
  const ICO_PX = { quill: 'i-quill', reel: 'i-reel', trophy0: 'trophy-0', trophy1: 'trophy-1', trophy2: 'trophy-2', type: 'i-type', monkey: 'i-monkey', coconut: 'i-coconut', palm: 'i-palm', log: 'i-log', banana: 'banana', leaf: 'leaf' };
  const ICO_CL = { quill: '🪶', reel: '🎬', trophy0: '🥉', trophy1: '🥈', trophy2: '🏆', type: '⌨️', monkey: '🐒', coconut: '🥥', palm: '🌴', log: '🪵', banana: '🍌', leaf: '🍃',
    /* card art on the department pages; the pixel edition draws these as sprites of the same name in pixel.js */
    'i-monkey': '🐵', 'u-fing': '👆', 'u-rapid': '⚡', 'u-vowel': '🅰️', 'u-ink': '🖋️', 'u-practice': '📖', 'u-stock': '📦', 'u-ribbon': '🎀',
    'd-reprints': '📚', 'd-tour': '🚌', 'd-translations': '🌍', 'd-clubs': '☕', 'd-option': '🎬',
    's-hold': '👇', 's-metro': '🎵', 's-dbl': '✌️', 's-contracts': '📜', 's-lamp': '💡', 's-agent': '💼', 's-analyst': '📈', 's-baro': '🌡️', 's-pub': '🖨️', 's-garden': '🌱', 's-keeper': '🗂️' };
  /* the classic edition's machines: a little vector typewriter in the desk colour; restorations add brass, then a gold bell */
  function twSvg(c, mk) {
    const col = (DESKS.find(D => D.id === c) || DESKS[0]).color, trim = mk ? '#f2c23a' : '#b8b8c4';
    const keys = [0, 1, 2].map(r => Array.from({ length: 7 - r }, (_, k) => `<circle cx="${13 + r * 2 + k * 6.4}" cy="${29 + r * 5}" r="2.1" fill="#fff6d6"/>`).join('')).join('');
    return `<svg viewBox="0 0 64 48" width="100%" height="100%" aria-hidden="true"><rect x="16" y="3" width="32" height="15" rx="2" fill="#fff6d6" stroke="#3d2410" stroke-width="2"/><path d="M20 9h18M20 13h12" stroke="#3d2410" stroke-width="1.6"/><rect x="5" y="16" width="54" height="6" rx="3" fill="${trim}" stroke="#3d2410" stroke-width="2"/><path d="M9 22h46l5 22H4z" fill="${col}" stroke="#3d2410" stroke-width="2.4" stroke-linejoin="round"/><path d="M11 25h42" stroke="#fff" stroke-opacity=".45" stroke-width="2"/>${keys}${mk ? '<path d="M7 41h50" stroke="#f2c23a" stroke-width="2.4"/>' : ''}${mk >= 2 ? '<circle cx="53" cy="9" r="4.5" fill="#ffd23a" stroke="#3d2410" stroke-width="2"/>' : ''}</svg>`;
  }
  const clArt = n => { const m = /^tw-([a-z]+)-([0-2])$/.exec(n); return m ? twSvg(m[1], +m[2]) : ICO_CL[n]; };
  /* panes re-render several times a second; patching the live DOM instead of replacing it keeps hover states,
     running CSS animations (shines, glints, stripes) and sprites intact. data-own marks a box another renderer fills. */
  const tpl = document.createElement('template');
  function morph(el, html) {
    if (!el || el._h === html) return;                             // same markup as last time (the common case when idle): no parse, no patch
    el._h = html; tpl.innerHTML = html; patchKids(el, tpl.content);
  }
  function patchKids(a, b) {
    const an = [...a.childNodes], bn = [...b.childNodes];
    bn.forEach((y, i) => {
      const x = an[i];
      if (!x) a.appendChild(y);
      else if (x.nodeType !== y.nodeType || x.nodeName !== y.nodeName) a.replaceChild(y, x);
      else if (x.nodeType !== 1) { if (x.nodeValue !== y.nodeValue) x.nodeValue = y.nodeValue; }
      else patchEl(x, y);
    });
    for (let i = an.length - 1; i >= bn.length; i--) an[i].remove();
  }
  function patchEl(x, y) {
    const ic = y.getAttribute('data-ico');
    if (ic && x.dataset.icoDone === ic + ':' + y.getAttribute('data-sz')) return;      // already hydrated into a sprite
    const keepOpen = x.tagName === 'DETAILS';                       // the browser owns a <details>'s open state: the template never mentions it, so a redraw must not close it
    for (const { name } of [...x.attributes]) if (!y.hasAttribute(name) && !(keepOpen && name === 'open')) x.removeAttribute(name);
    for (const { name, value } of [...y.attributes]) { const v = name === 'class' && x.classList.contains('can') && !y.classList.contains('can') ? value + ' can' : value; if (x.getAttribute(name) !== v) x.setAttribute(name, v); }   // 'can' is set by markCan() after each render
    if (x.tagName === 'INPUT' && x !== document.activeElement && x.value !== y.value) x.value = y.value;
    if (!y.hasAttribute('data-own')) patchKids(x, y);
  }
  const ico = (n, sz = 0) => `<i class="o-ico" data-ico="${n}" data-sz="${sz}"></i>`;
  const cart = n => `<i class="o-ico o-cart${n.startsWith('tw-') ? ' tw' : ''}" data-ico="${n}" data-sz="${n.startsWith('tw-') ? 52 : 32}" aria-hidden="true"></i>`;     // card art in a card's heading
  const price = n => `<span class="o-price" title="${esc(Economy.exact(n))} bananas" aria-label="${esc(Economy.exact(n))} bananas">${ico('banana', 24)}${fmtBig(n)}</span>`;
  function hydrate(scope) {
    $$('[data-ico]', scope).forEach(el => {
      const n = el.dataset.ico, sz = +el.dataset.sz;
      if (PX) {
        const sp = PXA.spr[ICO_PX[n] || n]; if (!sp) return;
        const w = sz || sp.w * PXA.S, h = Math.round(w * sp.h / sp.w);
        el.classList.add('spr'); el.style.width = w + 'px'; el.style.height = h + 'px';
        el.style.backgroundImage = `url(${sp.url})`; el.style.backgroundSize = '100% 100%';
      } else { const v = clArt(n) || ''; if (v[0] === '<') el.innerHTML = v; else el.textContent = v; if (sz && !el.classList.contains('o-cart')) el.style.fontSize = sz * .9 + 'px'; }
      el.dataset.icoDone = n + ':' + el.dataset.sz; el.removeAttribute('data-ico');
    });
  }

  /* ================= typewriter stage ================= */
  const ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];
  const LOW = () => !!(IMI.fx && IMI.fx.low);                      // Settings > Effects: Low trims decoration and particles
  let typists = [], fx = null;                                     // fx: the live stage's elements, looked up once per build instead of on every keystroke
  /* training shows on the machine itself: brass then gold keys, ribbon spools, a carriage bell, tinted vowels, a keeper light */
  const partsOf = d => { const u = d.up; return [u.fing >= 3 && 'p-brass', u.ink && 'p-spools', u.ribbon && 'p-ribbon2', u.rapid && 'p-bell', u.vowel && 'p-vowels', d.keeper.owned && 'p-led', d.keeper.owned && keepersReady() && d.keeper.on && 'p-ledon'].filter(Boolean).join(' '); };
  function buildStage() {
    const i = S.sel, D = DESKS[i];
    const pane = $('#o-floor');
    pane.innerHTML = `
      <button type="button" class="o-focus" id="oFocus" data-act="go" data-tab="press" title="Your keepers are working on this title. Tap to change it."></button>
      <div class="o-stagewrap">
      <div class="o-stage" id="oStage" data-desk="${D.id}" tabindex="0" role="button" aria-label="${esc(D.name)} typewriter. Tap, click, or press Space to type a letter.">
        <div class="o-scene" aria-hidden="true">
          <div class="o-wall"></div><div class="o-prop"></div>
          <div class="o-window" id="oWin"><i class="o-win-sky"></i><i class="o-win-rain"></i><i class="o-win-bolt"></i></div>
          <div class="o-lamp"><i class="o-lamp-shade"></i><i class="o-lamp-cone"></i></div>
          <div class="o-desktop"></div>
          <div class="o-speed"></div>
          <div class="o-embers" id="oEmbers"></div>
          <div class="o-drips">${Array.from({ length: 6 }, (_, k) => `<i style="left:${8 + k * 16 + rand() * 8}%;--d:${1.1 + rand() * .9}s;--dl:${-rand() * 2}s"></i>`).join('')}</div>
          <div class="o-flies">${Array.from({ length: 7 }, () => `<i style="left:${5 + rand() * 90}%;top:${10 + rand() * 50}%;--d:${5 + rand() * 5}s;--dl:${-rand() * 8}s"></i>`).join('')}</div>
        </div>
        <div class="o-tw mk${cur().mk || 0} ${partsOf(cur())}" id="oTw">
          <div class="o-sheetwrap"><div class="o-sheet"><span id="oSheet"></span></div></div>
          <div class="o-carriage" id="oCar"><i class="o-bell"></i></div>
          <div class="o-bars" id="oBars"><i class="o-spool l"></i><i class="o-spool r"></i>${Array.from({ length: 9 }, (_, n) => `<i class="o-bar" style="--a:${-48 + n * 12}deg"></i>`).join('')}</div>
          <div class="o-body" data-name="${esc(D.name.toUpperCase() + (cur().mk ? ' ' + MK_NAMES[cur().mk].toUpperCase() : ''))}"><i class="o-led"></i>
            <div class="o-kbd">${ROWS.map(r => `<div class="o-krow">${[...r].map(c => `<b class="o-key" data-k="${c}">${c}</b>`).join('')}</div>`).join('')}
              <div class="o-krow"><b class="o-key o-space" data-k=" "></b></div></div>
          </div>
        </div>
        <div class="o-crewlayer" id="oCrew" aria-hidden="true"></div>
      </div>
      <div class="o-fx">
        <div class="o-combo" id="oCombo" aria-hidden="true"><span id="oComboN"></span><i class="o-meter"><i id="oMeter"></i></i></div>
      </div>
      </div>
      <div class="o-info">
        <div class="o-tray" id="oTray" aria-label="Recent letters"></div>
        <div class="o-stats" id="oStats"></div>
        <div class="o-sky" id="oSky"></div>
        <button type="button" class="o-btn sm o-keyhelp" data-act="keyhelp">Key guide</button>
        <div class="o-miles" id="oMiles"></div>
        <p class="o-guide" id="oGuide"></p>
      </div>`;
    fx = { stage: $('#oStage'), tw: $('#oTw'), car: $('#oCar'), sheet: $('#oSheet'), combo: $('#oCombo'), comboN: $('#oComboN'), meter: $('#oMeter'), embers: $('#oEmbers'),
      bars: $$('.o-bar', pane), keys: {}, pops: [], richAt: 0, meterAnim: null };
    $$('.o-key[data-k]', pane).forEach(k => { fx.keys[k.dataset.k] = k; });
    rt[i].col = 0; typists = []; syncTypists(true);
    dressRoom(DESKS[i].id);
    if (ui.dropIn) { ui.dropIn = false; const st = $('#oStage'); st.classList.add('drop'); st.addEventListener('animationend', () => st.classList.remove('drop'), { once: true }); }
    $('#oSheet').textContent = rt[i].sheet.slice(-48);
    paintWindow();
  }
  /* the room is the page: on the Floor the machine's wall and desk fill the whole screen (ops.css "THE ROOM IS THE PAGE") */
  function dressRoom(id) {
    let room = document.getElementById('oRoom');
    const game = document.getElementById('game'); if (!room && !game) return;           // the balance harness has no #game
    if (!room) { room = document.createElement('div'); room.id = 'oRoom'; room.className = 'o-room'; room.setAttribute('aria-hidden', 'true'); room.innerHTML = '<div class="o-wall"></div><div class="o-desktop"></div>'; game.prepend(room); }
    if (room.dataset.desk !== id) { const had = !!room.dataset.desk; room.dataset.desk = id; if (had && !IMI.reduceMotion) { room.classList.remove('fade'); void room.offsetWidth; room.classList.add('fade'); } }
    if (ui.tab === 'floor') document.documentElement.dataset.room = id;
  }
  /* switching machines: the old typewriter slides off the desk and the next one slides on */
  let swapT = 0;
  function swapStage(dir) {
    const tw = $('#oTw'); clearTimeout(swapT);
    if (!dir || !tw || IMI.reduceMotion) return buildStage();
    tw.style.setProperty('--dir', dir); tw.classList.add('swap-out'); IMI.sfx.tick();
    swapT = setTimeout(() => {
      buildStage(); const n = $('#oTw'), st = $('#oStage'); if (!n) return;
      n.style.setProperty('--dir', dir); n.classList.add('swap-in'); st.classList.add('swapping');
      n.addEventListener('animationend', () => { n.classList.remove('swap-in'); st.classList.remove('swapping'); }, { once: true });
      IMI.sfx.key();
    }, 190);
  }
  /* the little window behind the typewriter shows the page's real weather and time of day */
  function paintWindow() {
    const w = $('#oWin'); if (!w) return;
    w.dataset.wx = typeof Weather !== 'undefined' ? Weather.state : 0;
  }
  /* ================= the crew on the keyboard =================
     Every visible typist (up to 8) stands on a key. When it types a letter it hops to that key and stomps it: the key goes down, and the
     monkey's look throws its own particles (IMI 'land' event), when it lands. Poses come from crew-art.js in pixel and the vector monkey
     (crew-svg.js) in classic. Positions are measured from the live keys, so the crew follows the machine at every size. */
  const HOP = { crouch: 60, launch: 50, impact: 80, rebound: 60 };
  const START_KEYS = ['G', 'D', 'K', 'S', 'J', 'F', 'L', 'H'];
  let keyPos = {}, keyW = 30, crewScale = 2, measuredAt = 0, stageXY = [0, 0], stageBoxC = null, crewRO = null;
  /* the effects layers read the stage and key positions from this cache instead of measuring the page on every tap (each measurement forces a layout) */
  IMI.stageGeom = () => (fx && fx.stage.isConnected && stageBoxC ? { box: stageBoxC, key: ch => keyPos[ch] && [stageXY[0] + keyPos[ch].x, stageXY[1] + keyPos[ch].y], keys: Object.keys(keyPos) } : null);
  function measureKeys() {
    const st = fx && fx.stage; if (!st || !st.isConnected) return false;
    const sr = st.getBoundingClientRect(); if (!sr.width) return false;
    const dk = st.querySelector('.o-desktop'), gm = document.getElementById('game');
    if (dk && gm) { const top = Math.round(dk.getBoundingClientRect().top - gm.getBoundingClientRect().top) + 'px'; if (gm.style.getPropertyValue('--desk-top') !== top) gm.style.setProperty('--desk-top', top); }
    stageXY = [sr.left, sr.top]; stageBoxC = { left: sr.left, top: sr.top, width: sr.width, height: sr.height, right: sr.right, bottom: sr.bottom }; keyPos = {}; let w = 0, n = 0;
    for (const ch in fx.keys) {
      const r = fx.keys[ch].getBoundingClientRect();
      keyPos[ch] = { x: r.left - sr.left + r.width / 2, y: r.top - sr.top + r.height * .62 };
      if (ch !== ' ') { w += r.width; n++; }
    }
    keyW = n ? w / n : 30;
    const want = keyW * (PX ? 1.3 : 1.1) / 24;                      // the monkey's body (about 24 art px wide) spans a key or so
    crewScale = PX ? Math.max(1, Math.round(want)) : want;          // pixel: whole-number scale keeps the art crisp
    measuredAt = performance.now();
    typists.forEach(t => { const p = keyPos[t.at] || keyPos.G; if (!t.hop && p) { t.x = p.x; t.y = p.y; } sizeTypist(t); t.tr = ''; });
    return true;
  }
  const spreadOf = t => (((t.ci * 5) % 7) / 6 - .5) * keyW * .7;     // each monkey stands a little to one side of its key, so a crowd on one key stays readable
  function sizeTypist(t) {
    const px = Math.round(64 * crewScale) + 'px'; t.mk.style.width = px; t.mk.style.height = px;
    if (!PX) { const n = Math.round(64 * crewScale * Math.min(2, devicePixelRatio || 1)); if (t.cv.width !== n) { t.cv.width = t.cv.height = n; t.bmpKey = ''; } }   // classic: a bitmap at screen resolution
  }
  function paintLook(t) {                                           // (re)dress a typist in its look and hat
    const c = cur().crew[t.ci] || {}; t.look = c.look || 'v01'; t.hat = c.hat || 0; t.frameKey = '';
    t.fx = lookById(t.look).fx; t.r = lookById(t.look).r || 'c'; t.el.classList.toggle('shiny', !!c.shiny); t.el.dataset.look = t.look; t.el.dataset.r = t.r;
  }
  function restyleTypist(p) { const t = typists.find(x => x.ci === p); if (t) { paintLook(t); t.poof = true; } }
  function syncTypists(initial) {
    const box = $('#oCrew'); if (!box) return;
    const crew = cur().crew, n = Math.min(cur().paws, 8), had = typists.length;
    if (had === n && typists.every(t => t.el.isConnected)) return;
    typists.slice(n).forEach(t => t.el.remove()); typists = typists.slice(0, n).filter(t => t.el.isConnected);
    for (let k = typists.length; k < n; k++) {
      const el = document.createElement('div'); el.className = 'o-hopper';
      el.innerHTML = '<canvas class="o-mk" width="64" height="64"></canvas><span class="o-nm"></span>';
      box.appendChild(el);
      const t = { ci: k, el, mk: el.firstChild, cv: el.firstChild, nmEl: el.lastChild, at: START_KEYS[k % START_KEYS.length], x: 0, y: 0, hop: null, next: null, face: k % 2 ? -1 : 1, until: 0, seed: k * 1.7, tr: '' };
      t.nmEl.textContent = (crew[k] || {}).name || '';
      paintLook(t);
      if (!initial && k >= had) t.drop = performance.now();         // a new hire drops in from above and lands on its key
      typists.push(t);
    }
    if (!measureKeys()) requestAnimationFrame(() => measureKeys());
    setTimeout(() => measureKeys(), 520);                            // again once the machine has finished sliding in
    if (!crewRO && window.ResizeObserver) crewRO = new ResizeObserver(() => measureKeys());
    if (crewRO && fx) { crewRO.disconnect(); crewRO.observe(fx.stage); }
    stepTypists(performance.now());
  }
  /* o.press: the key goes down on landing. o.inPlace: a stomp on the spot. o.big: a cheer-height jump */
  function hopTo(t, ch, o = {}) {
    const to = o.inPlace ? { x: t.x, y: t.y } : keyPos[ch]; if (!to) return false;
    if (t.hop) { if (o.press) t.next = ch; return true; }
    const from = { x: t.x, y: t.y }, d = Math.hypot(to.x - from.x, to.y - from.y), sp = buffOn('frenzy') ? .7 : 1;
    t.hop = { t0: performance.now(), ch: o.inPlace ? t.at : ch, from, to, sp, air: Math.min(330, 140 + d * .55) * sp, h: o.big ? keyW * 2.4 : Math.max(keyW * (o.inPlace ? .7 : 1.1), d * .32), press: !!o.press };
    if (Math.abs(to.x - from.x) > 2) t.face = to.x > from.x ? 1 : -1;
    return true;
  }
  /* a crew press: the typist who typed it heads for the key (when busy, it goes there next) */
  function hopPress(p, ch) {
    if (!typists.length || IMI.reduceMotion || p == null) return false;
    const t = typists.find(x => x.ci === p) || typists[p % typists.length];
    return hopTo(t, ch, { press: true, inPlace: ch === t.at && !t.hop });
  }
  function land(t, press) {
    if (press) { const k = fx.keys[t.at]; if (k) { k.classList.add('down'); setTimeout(() => k.classList.remove('down'), 110); } }
    if (LOW() || document.hidden) return;
    IMI.emit('land', { x: stageXY[0] + t.x + spreadOf(t), y: stageXY[1] + t.y, fx: t.fx, look: t.look, w: keyW, r: t.r });
  }
  function kick(strong, ci) {
    if (!typists.length) return;
    const t = (ci != null && typists.find(x => x.ci === ci)) || typists[Math.floor(rand() * typists.length)];
    t.until = performance.now() + 170;
    if (strong && !t.hop) hopTo(t, t.at, { inPlace: true });
    if (!IMI.reduceMotion && !LOW() && performance.now() > (t.nmAt || 0)) { t.nmAt = performance.now() + 230; t.nmEl.animate([{ transform: 'none' }, { transform: 'translateY(-6px) scale(1.18)', color: '#ffd23a' }, { transform: 'none' }], { duration: 220, easing: PX ? 'steps(3)' : 'ease-out' }); }
    if (!strong && rand() < .012) say(t);
  }
  function jump(t) { if (t && !t.hop) hopTo(t, t.at, { inPlace: true, big: true }); }
  function stepTypists(now, draw = true) {                          // movement runs every frame; the DOM/canvas writes only when `draw` (every other frame)
    const crew = cur().crew, scared = typeof Mood !== 'undefined' && Mood.scared, wild = buffOn('frenzy'), still = IMI.reduceMotion;
    if (!keyPos.G || now - measuredAt > 2500) measureKeys();
    for (const t of typists) {
      const c = crew[t.ci] || {};
      if (c.look !== t.look || (c.hat || 0) !== t.hat) { paintLook(t); t.poof = true; }
      if (c.name && t.nmEl.textContent !== c.name) t.nmEl.textContent = c.name;
      if (t.poof) { t.poof = false; if (!still) jump(t); }
      let x = t.x, y = t.y, lift = 0, pose = Math.floor(now / 600 + t.seed) % 2 ? 'breathe' : 'idle';
      if (still) { t.hop = null; t.drop = 0; pose = 'idle'; }
      if (t.drop) { const k = (now - t.drop) / 520; if (k >= 1) { t.drop = 0; land(t, false); pose = 'impact'; } else { lift = (1 - k * k) * keyW * 7; pose = 'fall'; } }
      const h = t.hop;
      if (h) {
        const e = now - h.t0, A = HOP.crouch * h.sp, B = A + HOP.launch * h.sp, C = B + h.air, D = C + HOP.impact * h.sp, E = D + (t.next ? 0 : HOP.rebound * h.sp);
        if (e < A) { pose = 'crouch'; x = h.from.x; y = h.from.y; }
        else if (e < C) { const k = (e - A) / (C - A); x = h.from.x + (h.to.x - h.from.x) * k; y = h.from.y + (h.to.y - h.from.y) * k; lift = Math.sin(k * Math.PI) * h.h; pose = k < .28 ? 'launch' : k < .68 ? 'air' : 'fall'; }
        else {
          x = h.to.x; y = h.to.y; pose = e < D ? 'impact' : 'rebound';
          if (!h.landed) { h.landed = true; t.x = x; t.y = y; t.at = h.ch; land(t, h.press); }
          if (e >= E) { t.hop = null; if (t.next) { const nx = t.next; t.next = null; hopTo(t, nx, { press: true, inPlace: nx === t.at }); } }
        }
      } else if (!still && !t.drop) {
        if (wild && rand() < .015) jump(t);
        else if (scared) x += Math.round(Math.sin(now / 40 + t.seed));
      }
      if (!draw) continue;
      const expr = now < t.until ? 'screech' : !h && !t.drop && (now / 1000 + t.seed * 3) % 7 < .18 ? 'wink' : '';
      const fk = pose + '|' + expr + '|' + t.look + '|' + t.hat;
      if (fk !== t.frameKey) {
        t.frameKey = fk;
        if (PX) { const g = t.cv.getContext('2d'); g.clearRect(0, 0, 64, 64); g.drawImage(CrewArt.pose(t.look, pose, { expr: expr || undefined, hat: t.hat }), 0, 0); }
        else {                                                       // classic: the pose is a squash/stretch of the cached bitmap; only the face swaps the image
          const P = (window.CrewArt && CrewArt.POSES[pose]) || { sx: 1, sy: 1 }; t.mk.style.transform = `scale(${P.sx}, ${P.sy})`;
          const face = expr || (pose === 'launch' || pose === 'impact' || pose === 'fall' ? 'screech' : ''), bk = face + t.look + t.hat + t.cv.width;
          if (bk !== t.bmpKey) { const bmp = window.CrewSvg && CrewSvg.bitmap(t.look, t.hat, face, t.cv.width, () => { t.frameKey = ''; }); if (bmp) { t.bmpKey = bk; const g = t.cv.getContext('2d'); g.clearRect(0, 0, t.cv.width, t.cv.height); g.drawImage(bmp, 0, 0); } }
        }
      }
      const sc = crewScale, spread = spreadOf(t);
      const tr = `translate(${Math.round(x + spread - 32 * sc)}px, ${Math.round(y - 55 * sc - lift)}px)`;
      if (tr !== t.tr) { t.tr = tr; t.el.style.transform = tr; }
      const z = Math.round(h ? Math.max(h.from.y, h.to.y) : t.y); if (z !== t.z) { t.z = z; t.el.style.zIndex = z; }
      if (t.face !== t.faceS) { t.faceS = t.face; t.el.classList.toggle('left', t.face < 0); }
      if (c.shiny && now > (t.sparkAt || 0) && !still && !LOW()) { t.sparkAt = now + 380 + rand() * 300; IMI.fall(stageXY[0] + x + (rand() - .5) * keyW, stageXY[1] + y - lift - keyW * (.4 + rand()), 'spark', 900); }
    }
  }
  const CHATTER = ['OOK!', 'EEK!', 'TAP TAP', 'BANANA?', 'HOO HOO', 'NICE WORD', 'STOMP!', 'BOING'];
  function say(t, text) {
    if (t.el.querySelector('.o-say')) return;
    const b = document.createElement('i'); b.className = 'o-say'; b.textContent = text || CHATTER[Math.floor(rand() * CHATTER.length)];
    b.addEventListener('animationend', () => b.remove()); t.el.appendChild(b);
  }
  /* group reactions: the whole crew bounces on the keys, shouts and throws bananas */
  const cheerState = { until: 0, next: 0, said: true, text: '', throwAt: 0 };
  function cheer(ms, text) { const now = performance.now(); cheerState.until = Math.max(cheerState.until, now + ms); cheerState.text = text || ''; cheerState.said = !text; }
  function cheerStep(now) {
    if (now >= cheerState.until || !typists.length) return;
    if (now >= cheerState.next) { cheerState.next = now + 160; typists.forEach(t => { if (!t.hop && rand() < .5) jump(t); t.until = now + 220; }); }
    if (!cheerState.said) { cheerState.said = true; typists.slice(0, 3).forEach(t => say(t, cheerState.text)); }
    if (now >= cheerState.throwAt) {
      cheerState.throwAt = now + 520;
      const t = typists[Math.floor(rand() * typists.length)]; IMI.burst(stageXY[0] + t.x, stageXY[1] + t.y - keyW, ['banana', 'spark'], 3);
    }
  }
  let loopN = 0;
  function loop(now) {
    loopN++;
    if (ui.tab === 'floor' && typists.length && !IMI.reduceMotion) { cheerStep(now); stepTypists(now, (loopN & (LOW() ? 3 : 1)) === 0); }
    countStep(now);
    requestAnimationFrame(loop);
  }
  function animatePress(ch, auto, n, p) {
    if (ui.tab !== 'floor' || !fx || !fx.stage.isConnected) return;
    const now = performance.now(), r = rt[S.sel];
    r.col++; r.page = (r.page || 0) + 1;
    if (r.page >= 48 && now - (ui.tearAt || 0) > 1400) { r.page = 0; ui.tearAt = now; tearPage(r); }
    /* a big crew can press dozens of times a second: tapping always gets the full show, auto-typing is drawn at most ~14 times a second */
    const hopped = auto && hopPress(p, ch);                          // the typist who typed it hops to the key (its landing presses the key)
    if (auto) { if (now - fx.richAt < (LOW() ? 160 : 70)) { if (!hopped) kick(false, p); return; } fx.richAt = now; }
    IMI.sfx.key(1 + S.sel * .14);                                   // each machine has its own clack, higher up the range
    const kp = keyPos[ch];
    IMI.emit('press', { ch, auto, p, col: r.col, ding: r.col % 9 === 0, key: fx.keys[ch], desk: DESKS[S.sel].color, x: kp && stageXY[0] + kp.x, y: kp && stageXY[1] + kp.y - keyW * .1 });                // classic-fx.js draws the sparks
    const key = fx.keys[ch];
    if (key && !hopped) { key.classList.add('down'); setTimeout(() => key.classList.remove('down'), 90); }
    const bar = fx.bars[ch.charCodeAt(0) % fx.bars.length];
    bar.classList.add('hit'); setTimeout(() => bar.classList.remove('hit'), 70);
    const car = fx.car;
    car.style.transform = `translateX(${-(r.col % 9) * 2}px)`;
    if (r.col % 9 === 0) { car.classList.remove('ding'); fx.tw.classList.remove('ding'); void car.offsetWidth; car.classList.add('ding'); fx.tw.classList.add('ding'); }   // on the machine too: its sheet and bell key off it
    if (!hopped) kick(!auto, auto ? p : undefined);
    fx.sheet.textContent = r.sheet.slice(-48);
    const tw = fx.tw;
    if (!IMI.reduceMotion) {
      if (!auto) tw.animate([{ translate: '0 0' }, { translate: '0 3px', offset: .35 }, { translate: '0 0' }], { duration: 140, easing: PX ? 'steps(2)' : 'ease-out' });   // the strike thumps the machine
      const k = auto ? (!LOW() && rand() < .35 ? 1 : 0) : (LOW() ? 1 : 2 + (rand() < .5 ? 1 : 0));
      for (let j = 0; j < k; j++) {                                  // ink flecks spit from the platen
        const f = document.createElement('i'); f.className = 'o-fleck';
        f.style.cssText = `--fx:${(rand() - .5) * 70}px;--fy:${-10 - rand() * 34}px;--fc:${rand() < .7 ? '#1a0f14' : POP_COLORS[Math.floor(rand() * POP_COLORS.length)]}`;
        f.addEventListener('animationend', () => f.remove()); tw.appendChild(f);
      }
    }
    if (auto && LOW()) return;                                     // Low: the crew's letters do not pop; your own taps still do
    const el = document.createElement('i'); el.className = 'o-pop'; el.textContent = ch;
    const slot = popSlot++ % 9;
    el.style.cssText = `left:${12 + slot * 9.5}%;top:${30 + (slot % 3) * 9}%;--pc:${POP_COLORS[popSlot % POP_COLORS.length]}`;
    el.addEventListener('animationend', () => { el.remove(); const k = fx.pops.indexOf(el); if (k >= 0) fx.pops.splice(k, 1); });
    fx.stage.appendChild(el); fx.pops.push(el);
    if (fx.pops.length > 14) fx.pops.shift().remove();
  }
  /* a full sheet rips off the platen and flutters away; a fresh one rolls in */
  function tearPage(r) {
    const sheet = $('.o-sheet'); if (!sheet) return;
    if (!IMI.reduceMotion) {
      const b = sheet.getBoundingClientRect(), pg = document.createElement('div'); pg.className = 'o-page'; pg.textContent = r.sheet.slice(-48);
      pg.style.cssText = `left:${b.left}px;top:${b.top}px;width:${b.width}px;height:${b.height}px;--tx:${(rand() < .5 ? -1 : 1) * (160 + rand() * 160)}px;--pr:${(rand() - .5) * 70}deg`;
      pg.addEventListener('animationend', () => pg.remove()); document.body.appendChild(pg);
      sheet.classList.remove('fresh'); void sheet.offsetWidth; sheet.classList.add('fresh');
    }
    IMI.sfx.rip && IMI.sfx.rip(); r.sheet = r.sheet.slice(-1);
    const sp = $('#oSheet'); if (sp) sp.textContent = '';
  }
  function royPing() {
    if (!['floor', 'press'].includes(ui.tab) || document.hidden || IMI.reduceMotion || LOW()) return;
    const sp = $$('.o-spine'); if (!sp.length) return;
    const el = sp[Math.floor(rand() * sp.length)], r = el.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
    const book = RBY[el.dataset.id]; if (!book) return;
    floatText('+' + fmtRate(bookRoy(book) * 2.4), r.left + r.width / 2, r.top - 6, '#ffd23a');
  }

  /* ---- the bookshelf: one spine per title you have sold, ghost slots for the rest ---- */
  const hashOf = str => { let h = 0; for (const c of str) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };
  const SHELF_MAX = 120;
  function shelfHTML() {
    const all = [...new Set([...Object.keys(S.editions || {}), ...Object.keys(S.written)])].filter(id => RBY[id]);
    const ids = all.length > SHELF_MAX ? [...all.filter(id => !RBY[id].kid && !RBY[id].lib), ...all.filter(id => RBY[id].lib), ...all.filter(id => RBY[id].kid)].slice(0, SHELF_MAX) : all;   // authored spines first, then library, then kids; the shelf is capped
    const more = all.length - ids.length;
    if (ids.some(id => ui.fresh === id && !ui.dropped[id])) ui.droppingUntil = performance.now() + 1300;
    const dropping = performance.now() < (ui.droppingUntil || 0);
    const books = ids.map(id => {
      const r = RBY[id], h = hashOf(id), w = Math.round(24 + Math.min(r.total, 40) * .5);
      const ht = 78 + r.band * 12 + h % 14, hue = [150, 345, 215, 40, 275, 210][r.band] + (h % 30) - 15;
      const drop = ui.fresh === id && !ui.dropped[id]; if (drop) ui.dropped[id] = true;
      return `<button type="button" class="o-spine b${r.band}${drop ? ' drop' : ''}${ui.pulled === id ? ' pulled' : ''}${S.written[id] ? '' : ' old'}" data-act="pull" data-id="${id}" style="--bw:${w}px;--bh:${ht}px;--hue:${hue};--tilt:${(h % 5) - 2}deg;--sd:${(h % 50) / 10}s" title="${esc(r.title)}" aria-label="${esc(r.title)}"><span>${esc(r.title)}</span></button>`;
    }).join('');
    const ghosts = Array.from({ length: Math.min(24, Math.max(0, BOOKS - ids.filter(id => !RBY[id].gen && !RBY[id].kid && !RBY[id].lib).length)) }, () => '<i class="o-slot"></i>').join('') + (more ? `<span class="o-chip">+${more} more</span>` : '');
    const plate = ui.pulled && (S.written[ui.pulled] || (S.editions || {})[ui.pulled]) ? (() => { const r = RBY[ui.pulled]; return `<div class="o-plate"><div class="o-row"><h3>${esc(r.title)}</h3><span class="o-tag b${r.band}">${DESKS[r.band].lo}–${DESKS[r.band].hi}</span></div><p class="o-dim">${r.total} words · rights sold for ${price(r.pay)} · ${S.written[ui.pulled] ? `pays <b>${fmtRate(bookRoy(r))}/s</b> in royalties` : '<b>out of print</b>: sell it again in this printing'}${(S.editions || {})[ui.pulled] ? ` · ${(S.editions || {})[ui.pulled]} earlier edition${(S.editions || {})[ui.pulled] > 1 ? 's' : ''}` : ''}</p><div class="o-read">${esc(r.text)}</div></div>`; })() : '';
    return `<div class="o-shelfrow${dropping ? ' dropping' : ''}">${books}${ghosts}</div>${plate}`;
  }
  function renderFloorInfo() {
    const d = cur(), D = DESKS[S.sel]; if (!$('#oTray')) return;
    const fresh = Math.min(3, Math.max(0, rt[S.sel].n - ui.trayN)); ui.trayN = rt[S.sel].n;
    const shown = d.tray.slice(-12);
    const tray = $('#oTray'), tiles = shown.map((c, k) => `<span class="o-tile${k >= shown.length - fresh ? ' new' : ''}">${c}</span>`).join('') || '<span class="o-dim">Tap to type!</span>';
    if (tray._h !== tiles) { tray._h = tiles; tray.innerHTML = tiles; }                 // untouched while no new letters arrive
    const fr = keepersReady() ? focusRecipe(d) : null, ft = $('#oFocus');
    const want = fr ? focusNeeds(d, S.sel).missing : {};               // quiet ingredient markers, separate from the Golden Keys buff
    $$('.o-key[data-k]').forEach(k => { const needed = !!want[k.dataset.k]; k.classList.toggle('want', needed); k.title = needed ? 'Needed for your current title. Taps still type random letters.' : ''; });
    if (ft) { ft.dataset.act = pg ? 'pgopen' : 'go'; ft.title = pg ? pg.status(pgContext) : ft.title; }
    if (ft) morph(ft, pg ? `<span class="o-fgoal">${pg.active(pgContext) ? DESKS[S.meta.productionGoal.band].hi + '-letter set' : 'Auto'}</span><b class="o-ftitle">${esc(fr?.title || pg.status(pgContext))}</b>${fr ? bar(progress(fr), fr.total) : ''}<span class="o-fn">Titles</span>` : fr ? `<span class="o-fgoal">Goal</span><b class="o-ftitle">${esc(fr.title)}</b>${bar(progress(fr), fr.total)}<span class="o-fn">${progress(fr)}/${fr.total}</span>` : '');
    morph($('#oSky'), skyLine());
    morph($('#oStats'), `<span class="o-s1"><b>${cnt('f-let' + S.sel, totalLetters(d))}</b> letters</span><span class="o-s2"><b>${d.paws}</b> typists · <b>${autoRate(d).toFixed(2)}</b>/s</span>` +
      (toolOn('hold') ? `<span class="o-sx"><b>${holdRate(d)}</b>/s held</span>` : '') + `<span class="o-sx o-dim">${D.lo}–${D.hi} letter words</span>` +
      (stormy() ? '<span class="o-sx o-warn">Storm! Half speed.</span>' : ''));
    const now = performance.now();
    $('#oMiles').classList.toggle('ui01', HIGH_MILES.some(m => m.n > combo.n));
    morph($('#oMiles'), `<span class="o-dim">Tap streak goals${S.best ? ` (best x${S.best})` : ''}:</span>` + [...MILES, ...HIGH_MILES.filter(m => m.n > combo.n).slice(0, 1)].map(m => `<span class="o-mile${m.recognition ? ' high' : ''}${combo.n >= m.n ? ' hit' : ''}${now < (ui.mcd[m.n] || 0) ? ' cd' : ''}" title="${esc(m.desc)}">x${m.n} ${m.name}</span>`).join(''));
    $('#oGuide').textContent = !d.paws ? 'Nobody is typing yet. Collect a few letters by hand, then hire a first typist in Train.' : toolOn('hold') ? 'Hold a finger, the mouse, or Space on the machine to type fast. Spend letters in Train or turn them into words in Words.'
      : 'Tap or click the typewriter (focus it and press Space too). Spend letters in Train or make words in Words.';
    syncTypists();
  }

  /* ================= panes ================= */
  const pips = (n, max) => `<span class="o-pips">${Array.from({ length: Math.min(max, 12) }, (_, k) => `<i class="${k < n ? 'on' : ''}"></i>`).join('')}</span>`;
  const stat = (label, v) => `<span class="o-stat"><b>${v}</b> ${label}</span>`;

  /* the look book: every look, grouped by rarity; the ones you have not found yet are silhouettes with only their rarity and trait showing */
  function lookBook() {
    if (window.Hall?.enabled) return Hall.render(S,LOOKS,RARITY,lookArt,esc,progressing() && writer.guard(S));
    const seen = S.looks || {}, onCrew = {};
    S.desks.forEach(d => d.owned && d.crew.forEach(t => { onCrew[t.look] = (onCrew[t.look] || 0) + 1; }));
    const tiers = ['l', 'e', 'r', 'c'];
    return `<p class="o-lede">Every hire and re-roll draws a look, and the look decides the monkey's trait. Rarer looks are harder to find and their trait works harder: Rare x1.5, Epic x2, Legendary x3. Odds per roll: ${tiers.map(k => `${RARITY[k].name} ${Math.round(RARITY[k].odds * 100)}%`).join(' · ')}.</p>
      ${tiers.map(k => { const ls = LOOKS.filter(l => l.r === k), n = ls.filter(l => seen[l.id]).length;
        return `<h3 class="o-h o-rarh r-${k}">${RARITY[k].name} <span class="o-dim">${n}/${ls.length}</span></h3><div class="o-looks">${ls.map(l => seen[l.id]
          ? `<div class="o-card o-lookcard" data-r="${k}">${lookArt(l.id)}<b>${l.name}</b><span class="o-chip trait">${TRAITS[l.trait].name}</span><span class="o-dim">${FX_TEXT[l.fx.k] || ''}${onCrew[l.id] ? ` · ${onCrew[l.id]} on your crew` : ''}</span></div>`
          : `<div class="o-card o-lookcard veiled" data-r="${k}">${lookArt(l.id)}<b>???</b><span class="o-chip trait">${TRAITS[l.trait].name}</span><span class="o-dim">Not found yet</span></div>`).join('')}</div>`; }).join('')}`;
  }
  function renderTraining() {
    const d = cur(), i = S.sel, have = totalLetters(d), want = buyWant();
    const tsub = ui.sub.training || 'crew';
    morph($('#o-training'), subTabs('training', [['crew', 'Crew'], ['book', window.Hall?.enabled ? 'Hall of Monkeys' : `Look book ${Object.keys(S.looks || {}).length}/${LOOKS.length}`]]) + (tsub === 'book' ? lookBook() : `
      ${trainingPool ? trainingPool.controls(esc, fmt) : ''}
      <p class="o-lede">Train hires and trains the monkeys on <b>${esc(DESKS[i].name)}</b>. Training costs <b>${trainingPool && trainingPool.mode() !== 'local' ? 'protected shared surplus' : 'letters from this desk'}</b> (${trainingPool && trainingPool.mode() !== 'local' ? 'the biggest removable piles' : 'the biggest piles'} go first). You hold ${fmt(have)}.</p>
      ${keepersReady() ? `<div class="o-row o-left"><span class="o-dim">Keeper</span>${keeperSeg(i)}</div>` : '<p class="o-dim">Letters stay here until your keeper is introduced.</p>'}
      <div class="o-row o-left"><span class="o-dim">Buy</span><span class="o-seg">${[1, 10, 100, 'max'].map(n => `<button type="button" data-act="buyn" data-n="${n}" aria-pressed="${String(ui.buyN) === String(n)}">${n === 'max' ? 'Max' : 'x' + n}</button>`).join('')}</span></div>
      <div class="o-grid">${UPS.map(u => {
        const lvl = u.k === 'paw' ? d.paws : d.up[u.k], max = upMax(u), lock = upLock(u, d), done = lvl >= max, plan = trainingQuote(u, d, i, want);
        const first = u.k === 'paw' && i === 0 && d.paws === 0 && plan.n === 1;
        return `<div class="o-card"><div class="o-row"><h3>${cart(u.k === 'paw' ? 'i-monkey' : 'u-' + u.k)}${u.name}</h3><span class="o-lvl">${lvl}/${max}</span></div>
          ${pips(lvl, max)}<p class="o-upcurrent">${upEffect(u, d, lvl)}</p><details class="o-updetail"><summary>How it works</summary><p>${u.desc}</p></details>${lock ? `<p class="o-warn">${lock}</p>` : ''}
          ${done ? '' : `<p class="o-upnext">${lock ? 'After unlocking' : plan.n > 1 ? `After buying x${plan.n}` : 'Next'}: ${upEffect(u, d, lvl + (lock ? 1 : plan.n))}</p>`}
          <button type="button" class="o-btn" data-act="up" data-k="${u.k}" title="${esc(Economy.exact(plan.cost))} letters" ${done || lock || !plan.ok ? 'disabled' : ''}>${done ? 'Maxed' : lock ? 'Locked' : !plan.n ? 'No affordable levels' : `${first ? 'Hire first typist · ' : ''}${plan.n > 1 ? `x${plan.n} · ` : ''}${fmt(plan.cost)} letters`}</button></div>`;
      }).join('')}</div>
      <h3 class="o-h">The crew <span class="o-dim">(${d.crew.length}) · ${Object.keys(S.looks || {}).length}/${LOOKS.length} looks found</span></h3>
      ${d.crew.length ? `<div class="o-grid o-crew">${d.crew.map((t, p) => {
        const l = levelOf(t.xp), nx = LVL_XP[l], pv = LVL_XP[l - 1], pct = nx ? Math.round(100 * (t.xp - pv) / (nx - pv)) : 100, hh = hatById(t.hat);
        return `<div class="o-card o-crewcard${t.shiny ? ' shiny' : ''}" data-r="${rarOf(t)}"><div class="o-row"><button type="button" class="o-name" data-act="rename" data-p="${p}" title="Rename">${t.shiny ? '✦ ' : ''}${esc(t.name)}</button><span class="o-lvl">Lv ${l}</span></div>
          <div class="o-crewlook">${lookArt(t.look, t.hat || 0)}<div class="o-lookname"><b>${lookById(t.look).name}</b><span class="o-chip trait">${TRAITS[t.trait].name}</span><span class="o-chip o-rar r-${rarOf(t)}">${RARITY[rarOf(t)].name}</span></div></div>
          <div class="o-chips"><span class="o-chip" title="This monkey's roll when hired">Talent +${t.talent || 0}%</span>${t.coach ? `<span class="o-chip ok" title="Coaching">Coached +${t.coach * COACH_STEP}%</span>` : ''}</div><p class="o-dim">${traitText(t)}</p>
          <span class="o-prog" role="img" aria-label="${pct}% to the next level"><i style="width:${pct}%"></i></span>
          <p class="o-upnext">Coaching now: +${(t.coach || 0) * COACH_STEP}% speed${(t.coach || 0) >= COACH_MAX ? ' (maxed)' : `. Next: +${((t.coach || 0) + 1) * COACH_STEP}%`}</p>
          <div class="o-row"><span class="o-dim">${fmt(t.xp)} xp${nx ? ' / ' + fmt(nx) : ' (max)'}</span><button type="button" class="o-btn sm" data-act="hat" data-p="${p}" ${HATS.some(hatOpen) ? '' : 'disabled'} title="${HATS.some(hatOpen) ? 'Change hat' : 'Earn awards to unlock hats'}">${hh ? hh.name : 'No hat'}</button></div>
          <div class="o-row o-left o-coach"><button type="button" class="o-btn sm" data-act="coach" data-p="${p}" ${(t.coach || 0) >= COACH_MAX || bananas.get() < coachCost(i, t) ? 'disabled' : ''} title="Coaching: +${COACH_STEP}% typing speed for this monkey (${t.coach || 0}/${COACH_MAX}). Cost: ${Economy.exact(coachCost(i, t))} bananas">${(t.coach || 0) >= COACH_MAX ? 'Fully coached' : `Coach ${ico('banana', 16)} ${fmtBig(coachCost(i, t))}`}</button>
            <button type="button" class="o-btn sm" data-act="reroll" data-p="${p}" ${bananas.get() < rerollCost(i, t) ? 'disabled' : ''} title="Re-roll this monkey's trait and talent. Coaching is kept. Cost: ${Economy.exact(rerollCost(i, t))} bananas">Reroll ${ico('banana', 16)} ${fmtBig(rerollCost(i, t))}</button>
            ${t.prev ? `<button type="button" class="o-btn sm" data-act="unroll" data-p="${p}" title="Go back to the previous roll">Undo (was ${t.prev.look ? lookById(t.prev.look).name : TRAITS[t.prev.trait].name} +${t.prev.talent}%)</button>` : ''}</div></div>`;
      }).join('')}</div>` : '<p class="o-dim">Nobody works here yet. Hire a typist above.</p>'}`));
    hydrate($('#o-training'));
  }

  function keeperStrip() {
    const f = focusRecipe();
    return `<div class="o-card o-kstrip" id="oKeepers"><div class="o-row"><h3>Keepers’ goal</h3><span class="o-seg"><button type="button" data-act="autofocus" aria-pressed="${S.autoFocus}">Auto</button><button type="button" data-act="go" data-tab="press" aria-pressed="${!S.autoFocus}">Manual</button></span></div>
      ${f ? `<p><b>${esc(f.title)}</b> <span class="o-dim">${progress(f)}/${f.total} words</span></p><div class="o-progrow">${bar(progress(f), f.total)}</div>` : '<p class="o-dim">No goal yet.</p>'}
      <div class="o-row o-left"><button type="button" class="o-btn sm" data-act="go" data-tab="press">Change</button></div>
      <div class="o-chips">${DESKS.map((X, n) => S.desks[n].owned ? `<button type="button" class="o-chip o-kchip${S.desks[n].keeper.on ? '' : ' off'}" data-act="ktoggle" data-i="${n}" title="${KPAUSE}">${X.name.split(' ')[0]}${keeperLv(n) ? ' Lv' + keeperLv(n) : ''}: ${S.desks[n].keeper.on ? 'Collecting' : 'Paused'}</button>` : '').join('')}</div></div>`;
  }
  function renderLab(force) {
    const pane = $('#o-lab'); if (!force && pane.contains(document.activeElement) && document.activeElement.matches('input')) return;
    const d = cur(), i = S.sel, D = DESKS[i], f = focusRecipe(d);
    const q = ui.bankq.trim().toUpperCase(), needed = f ? f.need : {};
    let words = BAND_WORDS[i].map(w => ({ w, n: makeCopies(d, w) }));
    words = q ? words.filter(x => x.w.includes(q)) : words.filter(x => x.n > 0);
    words.sort((a, b) => ((stock(a.w) === 0) !== (stock(b.w) === 0) ? (stock(a.w) === 0 ? -1 : 1) : (needed[b.w] ? 1 : 0) - (needed[a.w] ? 1 : 0) || a.w.localeCompare(b.w)));
    const ownedBank = Object.keys(S.bank).sort((a, b) => a.length - b.length || a.localeCompare(b));
    morph(pane, `
      ${keeperStrip()}
      <p class="o-lede">Words turns <b>${esc(D.name)}</b> letters into words. Any letters on this desk can combine; letters never move between desks, but finished words go to the shared bank.</p>
      ${gardenHTML()}
      <div class="o-card"><h3>Letters</h3>
        <div class="o-letters">${Object.keys(FREQ).sort().map(c => `<div class="o-lcell${d.letters[c] ? '' : ' zero'}" title="${Economy.exact(d.letters[c] || 0)} ${c} letters"><b>${c}</b>${fmt(d.letters[c] || 0)}</div>`).join('')}</div></div>
      <div class="o-card"><h3>Make a ${D.lo}–${D.hi} letter word</h3>
        <input class="o-search" id="oBankQ" placeholder="Search words…" value="${esc(ui.bankq)}" autocomplete="off" aria-label="Search words">
        <div class="o-words">${words.slice(0, 60).map(({ w, n }) => `<button type="button" class="o-word${!stock(w) ? ' new' : ''}${needed[w] && stock(w) < needed[w] ? ' need' : ''}" data-act="bankword" data-w="${w}" ${n > 0 ? '' : 'disabled'}><span>${w}</span><i>${n > 0 ? 'x' + n : ''}${stock(w) ? ' · ' + stock(w) + ' banked' : ''}</i></button>`).join('') || '<p class="o-dim">No words can be made from these letters yet.</p>'}</div>
        <p class="o-dim">Green: never banked. Gold: needed by this desk’s focused title.</p></div>
      <div class="o-card"><h3>Shared word bank</h3>
        <div class="o-chips">${ownedBank.map(w => `<span class="o-chip b${bandOf(w.length)}${w === ui.lastBanked && performance.now() - ui.bankedAt < 800 ? ' pop' : ''}">${w} x${S.bank[w]}</span>`).join('') || '<span class="o-dim">Empty. Bank a word above.</span>'}</div></div>
      <details class="o-card o-adv"><summary><h3 style="display:inline">Advanced stock targets</h3></summary>
        <div class="o-row"><label for="oKdef">${esc(D.name)} default stack target (0–9999, 0 skips)</label><input class="o-num" id="oKdef" type="number" min="0" max="9999" value="${d.keeper.def}" data-in="kdef"></div>
        <div class="o-chips">${Object.entries(d.keeper.targets).map(([w, t]) => `<span class="o-chip">${w} → ${t} <button type="button" class="o-x" data-act="ovrdel" data-w="${w}" aria-label="Remove override for ${w}">x</button></span>`).join('') || '<span class="o-dim">No per-word targets.</span>'}</div>
        <div class="o-row o-left"><input class="o-num wide" id="oOvrW" placeholder="word" value="${esc(ui.ovr)}" autocomplete="off" data-in="ovrw" aria-label="Word"><input class="o-num" id="oOvrN" type="number" min="0" max="9999" value="${ui.ovrn}" data-in="ovrn" aria-label="Target"><button type="button" class="o-btn" data-act="ovrset">Set</button></div>
        <p class="o-dim">Keepers only bank what the goal needs unless you set targets. Lowering a target keeps stock.</p></details>`);
    hydrate(pane);
    const inp = $('#oBankQ'); if (!inp._wired) inp._wired = 1, inp.addEventListener('input', () => { ui.bankq = inp.value; renderLab(true); const n = $('#oBankQ'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); });
  }

  /* a title lists the words it still needs; long ones (the 60-90 word library stories) cap the list and sum up the words already banked */
  const CHIP_MAX = 14;
  const chipsFor = r => {
    const all = Object.entries(r.need).sort((a, b) => a[0].length - b[0].length || a[0].localeCompare(b[0]));
    const chip = ([w, n]) => `<span class="o-chip b${bandOf(w.length)}${stock(w) >= n ? ' ok' : ''}">${w} ${Math.min(stock(w), n)}/${n}</span>`;
    if (all.length <= CHIP_MAX) return all.map(chip).join('');
    const todo = all.filter(([w, n]) => stock(w) < n), got = all.length - todo.length;
    return todo.slice(0, CHIP_MAX).map(chip).join('') + (todo.length > CHIP_MAX ? `<span class="o-chip">+${todo.length - CHIP_MAX} more to bank</span>` : '') + (got ? `<span class="o-chip ok">${got} of ${all.length} words banked</span>` : '');
  };
  const subTabs = (dept, items) => `<div class="o-subtabs" role="tablist">${items.map(([id, label, badge]) => `<button type="button" role="tab" data-act="sub" data-dept="${dept}" data-sub="${id}" aria-selected="${(ui.sub[dept] || items[0][0]) === id}">${label}${badge ? `<i class="o-subbadge">${badge}</i>` : ''}</button>`).join('')}</div>`;
  const firstPitch = () => !(S.stats.pitched || 0) && soldCount() >= 1 && pitchActive() < PITCH_MAX;
  const needDesks = r => r._nd || (r._nd = [...new Set(Object.keys(r.need).map(w => bandOf(w.length)))].sort((a, b) => a - b));       // fixed per title, so computed once
  const lockedDesk = r => needDesks(r).find(b => !S.desks[b].owned);
  function bookCard(r) {
        const done = S.written[r.id], ready = canWrite(r), foc = S.focus === r.id, lock = lockedDesk(r);
    return `<div class="o-card o-book${done ? ' done' : ''}${ui.fresh === r.id ? ' fresh' : ''}${ready ? ' ready' : ''}"><div class="o-row"><h3>${esc(r.title)}${r.gen && !done ? ' <small class="o-pit">COMMISSIONED</small>' : ''}</h3><span class="o-tag b${r.band}">${DESKS[r.band].lo}–${DESKS[r.band].hi}</span></div>
          <p class="o-dim">${r.total} words · rights ${price(done ? r.pay : salePay(r))}${!done && marketMult(r.band) !== 1 ? ` <span class="o-dim">(x${marketMult(r.band).toFixed(2)})</span>` : ''}${foc ? ' <span class="o-tag o-now">NOW WRITING</span>' : ''}</p>
          <div class="o-progrow">${bar(done ? r.total : progress(r), r.total)}<span class="o-dim">${done ? r.total : progress(r)}/${r.total}</span></div>
          ${!titleAvailable(r) ? '<p class="o-warn">Archived, retire entry to resume sales</p>' : ''}${done ? '' : `<div class="o-chips">${chipsFor(r)}</div>`}
          ${done ? '' : `<div class="o-chips o-needs"><span class="o-dim">Needs</span>${needDesks(r).map(b => `<span class="o-chip b${b}${S.desks[b].owned ? ' ok' : ''}">${DESKS[b].name.split(' ')[0]}</span>`).join('')}${lock !== undefined ? `<span class="o-warn">Needs ${DESKS[lock].name}</span>` : ''}</div>`}
          ${done ? `<i class="o-stamp${ui.fresh === r.id ? ' slam' : ''}">SOLD!</i>` : ''}
          ${ui.read === r.id ? `<div class="o-read">${esc(r.text)}</div>` : ''}
          <div class="o-row o-actions"><button type="button" class="o-btn sm" data-act="read" data-id="${r.id}">${ui.read === r.id ? 'Close' : 'Read'}</button>
            ${done ? '<span class="o-lvl">WRITTEN &amp; SOLD</span>' : `<button type="button" class="o-btn sm" data-act="focus" data-id="${r.id}" ${foc || lock !== undefined || !titleAvailable(r) ? 'disabled' : ''}>${foc ? 'Focused' : 'Focus'}</button>
            <button type="button" class="o-btn sm gold" data-act="write" data-id="${r.id}" ${ready ? '' : 'disabled'}>${ready && marketMult(r.band) >= 1.4 ? 'Sell now!' : 'Write &amp; sell'}</button>`}</div></div>`;
  }
  /* sort modes for the Titles list. Whatever the mode, the order is tiered first: ready to write, the focused title, titles you can work on now,
     titles that need a bigger typewriter, then sold ones. (A short title that needs a machine you do not own used to outrank a longer one you could write.) */
  const SORTS = [['close', 'Closest'], ['pay', 'Pay'], ['short', 'Short'], ['az', 'A–Z']];
  const SORT_BY = {
    close: (a, b) => a.left - b.left, pay: (a, b) => b.r.pay - a.r.pay, short: (a, b) => a.r.total - b.r.total, az: (a, b) => a.r.title.localeCompare(b.r.title)
  };
  function pressList() {
    const q = ui.libq.trim().toLowerCase(), f = ui.libf, byBand = DESKS.map(() => 0);
    const pre = [];                                                  // matches status and search, before the word-max and locked filters
    for (const r of RECIPES) {
      const done = !!S.written[r.id];
      if (!done && !inPlay(r)) continue;
      if (q && !r.title.toLowerCase().includes(q)) continue;
      if (!(f === 'all' || (f === 'written' ? done : f === 'ready' ? canWrite(r) : f === 'pitched' ? r.gen && !done : !done))) continue;
      byBand[r.band]++; pre.push(r);
    }
    const browsing = ui.libcap !== 'all' || ui.libshow || f === 'written' || f === 'all';   // picking a word max, or Show locked, reveals titles that need a machine you have not bought
    const rows = []; let hidden = 0;
    for (const r of pre) {
      if (ui.libcap !== 'all' && r.band !== +ui.libcap) continue;
      const done = !!S.written[r.id], lock = !done && lockedDesk(r) !== undefined;
      if (lock && !browsing) { hidden++; continue; }
      rows.push({ r, tier: done ? 4 : canWrite(r) ? 0 : S.focus === r.id ? 1 : lock ? 3 : 2, left: r.total - progress(r) });
    }
    const cmp = SORT_BY[ui.libsort] || SORT_BY.close;
    rows.sort((a, b) => a.tier - b.tier || cmp(a, b) || b.r.pay - a.r.pay || (a.r.id < b.r.id ? -1 : 1));
    const shown = rows.slice(0, ui.libLimit);
    const seg = (items, act, cur, attr) => `<span class="o-seg">${items.map(([k, n, extra]) => `<button type="button" data-act="${act}" data-${attr}="${k}" aria-pressed="${String(cur) === String(k)}"${extra ? ` class="${extra}"` : ''}>${n}</button>`).join('')}</span>`;
    const caps = [['all', 'All'], ...DESKS.map((D, i) => [String(i), `${D.hi}<i class="o-capn">${byBand[i]}</i>`, S.desks[i].owned ? '' : 'o-cap-locked']).filter(([k]) => byBand[+k] > 0 || ui.libcap === k)];
    return `<div class="o-row o-left o-lsearch"><input class="o-search" id="oLibQ" placeholder="Search titles…" value="${esc(ui.libq)}" autocomplete="off" aria-label="Search titles">
        <select class="o-search o-lsort" data-in="libsort" aria-label="Sort titles">${SORTS.map(([k, n]) => `<option value="${k}"${ui.libsort === k ? ' selected' : ''}>${n}</option>`).join('')}</select></div>
      <div class="o-filters o-lfilters">
        <div class="o-row o-left">${seg([['open', 'Open'], ['ready', 'Ready'], ['pitched', 'Pitch'], ['written', 'Sold'], ['all', 'All']], 'libf', f, 'f')}</div>
        <div class="o-row o-left"><span class="o-dim o-flab" title="The longest word in the title: which typewriter it needs">Word max</span>${seg(caps, 'libcap', ui.libcap, 'c')}</div>
      </div>
      <div class="o-row o-left o-lcount"><span class="o-dim">${rows.length.toLocaleString('en-US')} title${rows.length === 1 ? '' : 's'}${hidden && !ui.libshow ? ` · ${hidden.toLocaleString('en-US')} locked` : ''}</span>${hidden || ui.libshow ? `<button type="button" class="o-btn sm" data-act="liblock" aria-pressed="${ui.libshow}">${ui.libshow ? 'Hide locked' : 'Show locked'}</button>` : ''}</div>
      <div class="o-grid">${shown.map(x => bookCard(x.r)).join('') || '<p class="o-dim">No titles match.</p>'}</div>
      ${rows.length > shown.length ? `<div class="o-row"><button type="button" class="o-btn sm" data-act="libmore">Show more (${(rows.length - shown.length).toLocaleString('en-US')})</button></div>` : ''}`;
  }
  function pubBar() {
    if ((chal('patientpress') || masteryActive())) return `<p class="o-warn">${masteryActive() ? 'Publisher suspended for manual Small Crew mastery.' : 'Publisher disabled by Patient Press.'} Manual selling is available.</p>`;
    if (!S.pub.tier) return '';
    const rules = [['any', 'Any', 'Sell as soon as a title is finished'], ['fair', 'Fair', 'Hold titles until the market is at least x1.0'], ['hot', 'Hot', 'Hold titles until the market is HOT (x1.4 or more)']];
    return `<div class="o-card o-pubbar"><div class="o-row o-left"><span class="o-seg"><button type="button" data-act="pubon" aria-pressed="${S.pub.on}" title="Let the assistant sell finished titles for you">Auto-sell ${S.pub.on ? 'on' : 'off'}</button></span>
      <span class="o-seg">${rules.map(([k, n, t]) => `<button type="button" data-act="pubrule" data-r="${k}" title="${t}" aria-pressed="${S.pub.rule === k}">${n}</button>`).join('')}</span></div>
      <p class="o-dim o-pubstat">${pubStatus()}</p></div>`;
  }
  function renderPress(force) {
    const pane = $('#o-press'); if (!force && pane.contains(document.activeElement) && document.activeElement.matches('input')) return;
    const sold = soldCount(), ready = readyList().length;
    const tabs = [['titles', 'Titles', ready || ''], ...((sold >= 1 || boardEnabled() && CommissionBoard.access(S) || seasonsEnabled() && Seasons.access(S)) ? [['shelf', 'Shelf', ui.shelfNew || '']] : []), ...(sold >= 1 ? [ ['pitches', 'Pitches', firstPitch() ? '!' : ''], ['market', 'Market']] : []), ...(sold >= 3 ? [['archive', 'Archive']] : [])];
    if (!tabs.some(t => t[0] === ui.sub.press)) ui.sub.press = 'titles';
    const sub = ui.sub.press;
    let body = '';
    if (sub === 'titles') {
      const fr = focusRecipe();
      body = `${pg ? pg.controls(pgContext, esc) : `<div class="o-card o-goalbar" id="oGoal"><div class="o-row o-gtop">${fr ? `<span class="o-gtitle">Now writing: <b>${esc(fr.title)}</b></span><span class="o-dim">${progress(fr)}/${fr.total}</span>` : '<span>Pick a title below</span>'}</div><div class="o-progrow o-gbar">${fr ? bar(progress(fr), fr.total) : '<span class="o-dim">Auto picks the best title</span>'}<span class="o-seg" title="Auto: the keepers pick the title that pays best for the effort"><button type="button" data-act="autotoggle" aria-pressed="${S.autoFocus}">Auto</button></span></div></div>`}

        ${pubBar()}
        <div id="oTitleList">${pressList()}</div>${KIDS.length ? `<p class="o-dim o-kidsline">Kids' reading list: ${kidsSold()} of ${KIDS.length} written${LIBS.length ? ` · Library stories: ${libSold()} of ${LIBS.length} written` : ''}</p>` : ''}`;
    } else if (sub === 'shelf') {
      ui.shelfNew = 0;
      const written = Object.keys(S.written).length;
      body = `<div class="o-card o-shelf"><div class="o-row"><h3>Your bookshelf</h3><span class="o-dim">${written} sold · royalties ${fmtRate(royRate())}/s</span></div>${sold ? '<p class="o-dim">Tap a spine to read it.</p>' : '<p class="o-dim">Sell a title to put it here.</p>'}${shelfHTML()}</div>${boardEnabled() ? CommissionBoard.render(extensionAPI) : ''}${seasonsEnabled() ? Seasons.render(extensionAPI) : ''}`;
    } else if (sub === 'pitches') body = pitchHTML();
    else if (sub === 'market') body = `<p class="o-lede">Publishers pay more or less depending on demand. Sell when your title’s band is HOT. The weather and the time of day change demand.</p>${skyCard()}${marketHTML()}`;
    else body = `<div class="o-card o-archive"><h3>The Archive</h3>
        <p class="o-dim" id="oArchNote" data-own>Loading the stacks…</p>
        <input class="o-search" id="oArchQ" placeholder="Search the complete manuscripts…" value="${esc(ui.archq)}" autocomplete="off" aria-label="Search the archive">
        <div class="o-filters" id="oArchF" data-own></div><div class="o-grid" id="oArchRes" data-own></div></div>`;
    morph(pane, subTabs('press', tabs) + body);
    const lq = $('#oLibQ'); if (lq && !lq._wired) lq._wired = 1, lq.addEventListener('input', e => { ui.libq = e.target.value; ui.libLimit = 24; renderPress(true); const n = $('#oLibQ'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); });
    const aq = $('#oArchQ'); if (aq && !aq._wired) aq._wired = 1, aq.addEventListener('input', e => { ui.archq = e.target.value; renderArchive(); });
    hydrate(pane); if (sub === 'archive') renderArchive();
  }

  /* ---- archive: the 3,573 full manuscripts, locked until longer machines exist ---- */
  let archive = null, archiveLoading = false;
  const SHELVES = [['all', 'All'], ['stories', 'Stories'], ['songs', 'Songs'], ['tv-shows', 'TV'], ['radio-plays', 'Radio'], ['sketches', 'Sketches'], ['films', 'Films']];
  function loadArchive() {
    if (archive || archiveLoading || Date.now() - ui.archFailed < 30000) return; archiveLoading = true;
    Promise.all(['library/books.json', 'library/archives.json'].map(u => fetch(u).then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })))
      .then(([books, arch]) => {
        archive = [...books.map(b => ({ shelf: 'stories', title: b.parody, sub: 'A parody of “' + b.original + '”', words: b.words })),
          ...arch.map(a => ({ shelf: a.archive, title: a.title, sub: a.target, words: a.words }))];
        buildDivOrder(); mark();
        if (ui.tab === 'press') renderArchive();
      })
      .catch(() => { archiveLoading = false; ui.archFailed = Date.now(); const n = $('#oArchNote'); if (n) n.textContent = 'The stacks are locked. Run node sync-library.mjs and serve the site over http.'; });
  }
  function renderArchive() {
    const note = $('#oArchNote'), res = $('#oArchRes'); if (!note || !res) return;
    if (!archive) { loadArchive(); return; }
    morph(note, `${archive.length.toLocaleString()} complete manuscripts are catalogued. Their full-length recipes need longer machines, punctuation rules and a bigger vocabulary, so they stay locked for now. <a href="library.html">Read them in the Library</a>.`);
    morph($('#oArchF'), `<span class="o-seg">${SHELVES.map(([k, n]) => `<button type="button" data-act="archf" data-f="${k}" aria-pressed="${ui.archf === k}">${n}</button>`).join('')}</span>`);
    const q = ui.archq.trim().toLowerCase();
    const hits = archive.filter(a => (ui.archf === 'all' || a.shelf === ui.archf) && (!q || (a.title + ' ' + a.sub).toLowerCase().includes(q)));
    morph(res, hits.slice(0, 18).map(a => `<div class="o-card sub"><div class="o-row"><h3>${esc(a.title)}</h3><span class="o-tag">LOCKED</span></div><p class="o-dim">${esc(a.sub)} · ${a.words} words</p></div>`).join('') +
      (hits.length > 18 ? `<p class="o-dim">…and ${(hits.length - 18).toLocaleString()} more.</p>` : '') || '<p class="o-dim">Nothing matches.</p>');
  }

  function gardenCard(have) {
    const n = S.garden.beds.length, nx = GARDEN_COSTS[n - 2];
    return `<div class="o-card"><div class="o-row"><h3>${cart('s-garden')}Garden plots</h3><span class="o-lvl">${n}/6</span></div>${pips(n - 2, 4)}
      <p>More plots in the letter garden (on the Words page), so you can grow more letters at once.</p>
      ${nx ? `<button type="button" class="o-btn gold" data-act="buy" data-what="plot" ${have < nx ? 'disabled' : ''}>Add a plot · ${price(nx)}</button>` : '<span class="o-lvl">MAXED</span>'}</div>`;
  }
  function lampCard(have) {
    const nx = LAMP[S.lamp], capH = awayCap() / 3600, eff = Math.round(awayEff() * 100);
    return `<div class="o-card"><div class="o-row"><h3>${cart('s-lamp')}Night Lamp</h3><span class="o-lvl">${S.lamp}/${LAMP.length}</span></div>${pips(S.lamp, LAMP.length)}
      <p>Keeps typists, keepers and royalties going while you are away. Now: up to ${capH}h at ${eff}% effort.${nx ? ` Next: ${nx.cap}h at ${Math.round(nx.eff * 100)}%.` : ''}</p>
      ${nx ? `<button type="button" class="o-btn gold" data-act="buy" data-what="lamp" ${have < nx.cost ? 'disabled' : ''}>Upgrade · ${price(nx.cost)}</button>` : '<span class="o-lvl">MAXED</span>'}</div>`;
  }
  function renderShop() {
    const blue = S.desks[2].owned, have = bananas.get();
    const item = (name, desc, cost, owned, lock, act, i) => { lock = challengeShopLock(act) || lock; return `<div class="o-card"><div class="o-row"><h3>${name}</h3>${owned ? '<span class="o-lvl">OWNED</span>' : price(cost)}</div><p>${desc}</p>${lock && !owned ? `<p class="o-warn">${lock}</p>` : ''}
      ${owned ? '' : `<button type="button" class="o-btn gold" data-act="buy" data-what="${act}" ${i != null ? `data-i="${i}"` : ''} ${lock || have < cost ? 'disabled' : ''}>Buy</button>`}</div>`; };
    morph($('#o-shop'), `
      <p class="o-lede">The Shop spends the bananas your titles earn. Typewriters and room-wide upgrades are bought here.</p>
      <h3 class="o-h">Typewriters</h3><div class="o-grid">${DESKS.slice(1).map((D, n) => {
        const i = n + 1, d = S.desks[i];
        return item(cart(`tw-${D.id}-0`) + D.name, `Specialises in ${D.lo}–${D.hi} letter words (${D.style} lettering). Starts with one typist.`, D.price, d.owned, (chal('haiku') || masteryActive()) && i >= 2 ? masteryActive() ? 'Small Crew mastery allows only Bamboo and Hibiscus' : 'Blocked by the Haiku Run' : !S.desks[i - 1].owned ? 'Buy ' + DESKS[i - 1].name + ' first' : '', 'desk', i);
      }).join('')}</div>
      <h3 class="o-h">Publishing deals <span class="o-dim">(royalties ${fmtRate(royBase())}/s now)</span></h3><div class="o-grid">${DEALS.map(x => item(cart('d-' + x.id) + x.name, x.desc, x.cost, !!S.deals[x.id], soldCount() < x.need ? `Needs ${x.need} sold title${x.need > 1 ? 's' : ''}` : '', 'deal', x.id)).join('')}</div>
      <h3 class="o-h">Restorations</h3><div class="o-grid">${DESKS.map((D, i) => S.desks[i].owned ? mkCard(i, have) : '').join('')}</div>
      <h3 class="o-h">Keepers</h3><div class="o-grid">${DESKS.map((D, i) => S.desks[i].owned ? keeperCard(i, have) : '').join('')}</div>
      <h3 class="o-h">Garden</h3><div class="o-grid">${gardenCard(have)}</div>
      <h3 class="o-h">Market tools</h3><div class="o-grid">
        ${baroCard(have)}
        ${pubCard(have)}
        ${item(cart('s-agent') + 'Literary agent', 'Haggles: the market can never push your sale prices below x0.85.', SHOP.agent, S.agent, soldCount() < 2 ? 'Needs 2 sold titles' : '', 'agent')}
        ${item(cart('s-analyst') + 'Market analyst', 'Shows which way each band is heading next.', SHOP.analyst, S.analyst, soldCount() < 2 ? 'Needs 2 sold titles' : '', 'analyst')}
      </div>
      <h3 class="o-h">Room-wide upgrades</h3><div class="o-grid">
        ${item(cart('s-hold') + 'Hold to type', 'Hold a finger, cursor or Space to type on every current and future machine.', SHOP.hold, S.hold, '', 'hold')}
        ${item(cart('s-metro') + 'Paw metronome', 'Doubles every typist’s speed across the room.', SHOP.metro, S.metro, blue ? '' : 'Unlocks with Lagoon Sprint', 'metro')}
        ${item(cart('s-dbl') + 'Double touch', 'Doubles held typing speed across the room.', SHOP.dbl, S.dbl, !blue ? 'Unlocks with Lagoon Sprint' : !S.hold ? 'Needs Hold to type' : '', 'dbl')}
        ${item(cart('s-contracts') + 'Writing contracts', 'Adds 25% to future title rights income.', SHOP.contracts, S.contracts, blue ? '' : 'Unlocks with Lagoon Sprint', 'contracts')}
        ${lampCard(have)}
      </div>
      `);
    hydrate($('#o-shop'));
  }

  const RENDER = { training: renderTraining, lab: renderLab, press: renderPress, studios: renderStudios, muses: renderMuses, shop: renderShop, records: renderRecords, legacy: renderLegacy };
  const KPAUSE = 'Paused keepers stop turning letters into words, so letters pile up for hiring and training.';
  const keeperSeg = i => `<span class="o-seg" title="${KPAUSE}"><button type="button" data-act="ktoggle" data-i="${i}" aria-pressed="${S.desks[i].keeper.on}">Collecting</button><button type="button" data-act="ktoggle" data-i="${i}" aria-pressed="${!S.desks[i].keeper.on}">Paused</button></span>`;
  const dn = D => { const [a, ...r] = D.name.split(' '); return `<b>${a}<em class="o-rest"> ${r.join(' ')}</em></b>`; };
  /* little dots on the department tabs when something there is worth doing */
  function badgeFor(k) {
    const d = cur(), i = S.sel;
    if (k === 'training') return UPS.some(u => trainingQuote(u, d, i, 1).ok) ? '!' : '';
    if (k === 'lab') return d.owned && BAND_WORDS[i].some(w => !stock(w) && canMake(d, w)) ? '!' : '';
    if (k === 'lab' && S.garden.beds.some(b => b && savedWallNow() >= b.ready)) return '!';
    if (k === 'muses') { const slots = museSlots(); return slots && S.muses.seated.slice(0, slots).some(x => !x) && MUSES.some(m => S.muses.owned[m.id] && !S.muses.seated.includes(m.id)) ? '!' : (slots && MUSES.some(m => !S.muses.owned[m.id] && bananas.get() >= m.cost) ? '!' : ''); }
    if (k === 'studios') return DIVS.some(D => divUnlocked(D) && divCount(D) < divCap(D) && bananas.get() >= divPlan(D, 1).cost) ? '!' : '';
    if (k === 'records') return ui.unseen ? String(ui.unseen) : '';
    if (k === 'legacy') return starsNow() >= 1 || LEG.some(u => legLvl(u.id) < u.max && S.legacy.stars >= u.costs[legLvl(u.id)]) ? '!' : '';
    if (k === 'press') { const rl = readyList(), n = rl.length, hot = rl.some(r => marketMult(r.band) >= 1.5); return n ? n + (hot ? '!' : '') : firstPitch() ? '!' : ''; }
    if (k === 'shop') {
      const have = bananas.get(), blue = S.desks[2].owned;
      const next = S.desks.findIndex(x => !x.owned);
      const can = (next > 0 && S.desks[next - 1].owned && have >= DESKS[next].price) ||
        (!S.hold && have >= SHOP.hold) || (blue && !S.metro && have >= SHOP.metro) || (blue && S.hold && !S.dbl && have >= SHOP.dbl) || (blue && !S.contracts && have >= SHOP.contracts);
      const plots = GARDEN_COSTS[S.garden.beds.length - 2] && have >= GARDEN_COSTS[S.garden.beds.length - 2];
      const mks = plots || S.desks.some((d, i) => d.owned && d.mk < 2 && have >= mkCost(i));
      const keepers = mks || S.desks.some((d, i) => d.owned && keeperLv(i) < KEEPER_UP_MAX && have >= keeperUpCost(i));
      const pubOk = S.pub.tier < 3 && (S.pub.tier > 0 || soldCount() >= 3) && have >= PUB_COST[S.pub.tier];
      const baroOk = S.baro < 2 && soldCount() >= 2 && have >= BARO_COST[S.baro];
      const tools = keepers || pubOk || baroOk || (!S.agent && soldCount() >= 2 && have >= SHOP.agent) || (!S.analyst && soldCount() >= 2 && have >= SHOP.analyst);
      const deal = tools || DEALS.some(x => !S.deals[x.id] && soldCount() >= x.need && have >= x.cost);
      return can || deal || (LAMP[S.lamp] && have >= LAMP[S.lamp].cost) ? '!' : '';
    }
    return '';
  }
  /* ---- header readout + the always-visible buff bar ---- */
  const hudEl = document.getElementById('hud');
  const hudRate = document.createElement('small'); hudRate.className = 'hud-rate'; hudRate.id = 'hudRate'; hudRate.title = 'Royalties from your bookshelf, per second';
  if (hudEl) {                                   // stack the rate under the banana count so the header stays one row
    const col = document.createElement('span'); col.className = 'hud-col'; const sc = hudEl.querySelector('#score');
    hudEl.insertBefore(col, sc); col.appendChild(sc); col.appendChild(hudRate);
  }
  const buffBar = document.createElement('div'); buffBar.className = 'o-buffbar'; buffBar.setAttribute('aria-live', 'polite');
  const buffDisplay = {};
  const BUFF_DETAILS = {
    frenzy: 'All typists work twice as fast.', golden: 'Every tap types two letters.',
    snack: 'Typists work 50% faster.', rush: 'Royalties pay seven times as much.',
    sluggish: 'Typists work more slowly.', critic: 'Royalties are halved.'
  };
  function renderBuffs() {
    if (!progressing()) return;
    const now = productiveMono(), on = Object.keys(buffs).filter(buffOn), floor = ui.tab === 'floor';
    const host = floor ? $('#o-floor') : $('.o-wrap');
    if (host && !buffBar.closest('.o-writer-content') && buffBar.parentNode !== host) {
      if (floor) host.prepend(buffBar); else host.insertBefore(buffBar, $('.o-panel'));
    }
    for (const k of Object.keys(buffDisplay)) if (!on.includes(k)) delete buffDisplay[k];
    morph(buffBar, on.map((k, i) => {
      const remaining = Math.max(0, buffs[k] - now), old = buffDisplay[k];
      if (!old || remaining > old.remaining + 250) buffDisplay[k] = { total: remaining };
      const display = buffDisplay[k]; display.remaining = remaining;
      const ratio = Math.min(1, remaining / display.total), desc = BUFF_DETAILS[k];
      const meter = `<span class="o-buff-meter" role="img" aria-label="${esc(BUFF_INFO[k][0])}: ${Math.ceil(remaining / 1000)} seconds remaining"><i style="transform:scaleX(${ratio.toFixed(4)})"></i></span>`;
      return `<div class="o-buff ${k} ${BUFF_INFO[k][1]}">${floor && i < 2 ? `<b>${BUFF_INFO[k][0]}</b><span class="o-buff-desc">${desc}</span>${meter}` : `<details><summary aria-label="${BUFF_INFO[k][0]}: read effect details"><b>${BUFF_INFO[k][0]}</b>${meter}</summary><span>${desc}</span></details>`}</div>`;
    }).join('') + (S.challenge ? `<div class="o-buff chal"><b>OULIPO: ${esc(chDef(S.challenge.id).name)}</b><span>${chProgress()}</span></div>` : ''));
    const st = $('#oStage'); if (st) { st.classList.toggle('frenzy', buffOn('frenzy')); st.classList.toggle('golden', buffOn('golden')); }
    const r = royRate() + divRate(); hudRate.textContent = r > 0 ? `+${fmtRate(r)}/s` : ''; hudRate.hidden = r <= 0;
  }
  /* the title screen: a live board of the floor, and PLAY turns into CONTINUE once you have started */
  const menuLive = document.getElementById('heroLive'), playLabel = document.getElementById('playLabel');
  function renderMenu() {
    const started = S.stats.letters > 0, rate = royRate() + divRate();
    if (playLabel) playLabel.textContent = playLabel.dataset[started ? 'cont' : 'new'];
    if (!menuLive || !started) return;
    menuLive.hidden = false;
    morph(menuLive, `<i class="hl-dot"></i><span class="hl-tag">LIVE</span><span><b>${fmtBig(bananas.get())}</b> bananas</span><span><b>${totalPaws()}</b> typists</span><span><b>${fmtBig(S.stats.letters)}</b> letters</span><span><b>${soldCount()}</b> titles</span>${rate > 0 ? `<span class="hl-rate">+${fmtRate(rate)}/s</span>` : ''}`);
  }
  function renderChrome() {
    renderBuffs();
    const firstLocked = S.desks.findIndex(x => !x.owned);
    morph($('#oDesks'), DESKS.map((D, i) => {
      const d = S.desks[i]; if (firstLocked >= 0 && i > firstLocked) return '';
      if (!d.owned && !Object.keys(S.written).length) return '';     // locked machines are a spoiler until the first sale
      if (!d.owned) { const pc = Math.min(100, Math.floor(100 * bananas.get() / D.price)); return `<button type="button" class="o-desk locked${pc >= 100 ? ' can' : ''}" style="--tw:${D.color}" data-act="go" data-tab="shop">${dn(D)}<span class="o-d1">${D.lo}–${D.hi} letters</span><span class="o-d2">${price(D.price)}</span><span class="o-dbar" aria-hidden="true"><i style="width:${pc}%"></i></span></button>`; }
      const ar = autoRate(d); return `<button type="button" class="o-desk" style="--tw:${D.color}" data-act="sel" data-i="${i}" aria-pressed="${i === S.sel}">${ar > 0 ? `<i class="o-dact" style="--spd:${Math.max(.12, Math.min(2, 1 / ar)).toFixed(2)}s" aria-hidden="true"></i>` : ''}${dn(D)}<span class="o-d1">${D.lo}–${D.hi} letters · ${fmt(totalLetters(d))} held</span><span class="o-d2">${d.paws} typists · ${autoRate(d).toFixed(2)}/s</span><span class="o-d3">${fmt(totalLetters(d))} held</span><span ${keepersReady() ? '' : 'hidden'} class="o-ktog${d.keeper.on ? '' : ' off'}" role="button" tabindex="0" data-act="ktoggle" data-i="${i}" title="${KPAUSE}" aria-label="Keeper ${d.keeper.on ? 'collecting' : 'paused'}: click to toggle"><i class="o-kdot"></i><span class="o-kw">Keeper</span><span class="o-kst">${d.keeper.on ? ' on' : ' paused'}</span></span></button>`;
    }).join(''));
    hydrate($('#oDesks'));
    const badge = (b, bd) => { if (bd) b.dataset.badge = bd; else delete b.dataset.badge; };
    document.querySelectorAll('.o-tab[data-tab]').forEach(b => { b.setAttribute('aria-selected', String(b.dataset.tab === ui.tab)); b.hidden = !tabVisible(b.dataset.tab); badge(b, b.hidden || b.dataset.tab === ui.tab ? '' : badgeFor(b.dataset.tab)); });
    $$('.o-pane').forEach(p => { p.hidden = p.id !== 'o-' + ui.tab; });
    const D = DESKS[S.sel];
    const wrap = $('.o-wrap');                                       // on .o-wrap itself: its own defaults would otherwise shadow these
    wrap.dataset.tab = ui.tab; root.dataset.tab = ui.tab;
    const roomId = ui.tab === 'floor' ? DESKS[S.sel].id : null;
    if ((document.documentElement.dataset.room || null) !== roomId) { if (roomId) document.documentElement.dataset.room = roomId; else delete document.documentElement.dataset.room; }
    wrap.style.setProperty('--tw', D.color); wrap.style.setProperty('--tw-font', D.font); wrap.style.setProperty('--tw-fs', D.fs || '');
  }
  /* cards with something you can afford get a highlight. This used to be a :has() rule, which made the browser re-check every card (and
     every bookshelf spine) whenever anything on the page changed; a class set here costs one pass per render instead. */
  const CAN_BTN = '.o-btn:is([data-act="up"], [data-act="buy"], [data-act="write"], [data-act="release"], [data-act="museinvite"], [data-act="legbuy"], [data-act="commission"]):not(:disabled)';
  function markCan(pane) { if (pane) for (const c of pane.querySelectorAll('.o-card')) { const on = !!c.querySelector(CAN_BTN); if (on !== c.classList.contains('can')) c.classList.toggle('can', on); } }
  let lastLetters = -1;
  function render() {
    if (window.__OPS_HEADLESS) return;
    if (IMI.screen() !== 'game') return renderMenu();                // nothing below is on screen from the title menu
    const ready = readyList().map(r => r.id);
    if (ui.readySet) { const fresh = ready.filter(id => !ui.readySet.includes(id)); if (fresh.length) { cheer(1100, 'READY!'); IMI.sfx.ding(); IMI.emit('ready', { ids: fresh }); } }
    ui.readySet = ready;
    renderChrome();
    if (ui.tab === 'floor') renderFloorInfo(); else { RENDER[ui.tab](); markCan($('#o-' + ui.tab)); }
    const lt = totalLetters(cur()); if (lt !== lastLetters) { lastLetters = lt; IMI.emit('letters', { total: lt, typed: S.stats.letters }); }
    extensionEvent('afterRender', { tab: ui.tab, pane: $('#o-' + ui.tab) });
    IMI.emit('render');
  }

  /* ================= wiring ================= */
  const tabBtn = ([k, ic, name, sub, short]) => `<button type="button" role="tab" class="o-tab" data-tab="${k}" aria-label="${name}" title="${name}: ${sub}"><span class="o-tabico">${ico(ic)}</span><em class="o-short">${short}</em><em class="o-long"><b>${name}</b><small>${sub}</small></em></button>`;
  root.innerHTML = `<div class="o-wrap" data-tab="floor">
    <div class="o-ticker" id="oTicker" role="marquee" aria-label="News" title="Tap for the next headline"><b class="o-tkr-tag">NEWS</b><div class="o-tkr-view"><span class="o-tkr-text" id="oTkrText"></span></div></div>
    <div class="o-desks" id="oDesks"></div>
    ${writer ? '<div id="oGoals" class="o-goals" hidden data-own></div><span id="oGoalNotice" class="o-goal-sr" role="status" aria-live="polite" data-own></span>' : ''}
    <div class="o-panel">${TABS.map(([k]) => `<section class="o-pane" id="o-${k}" role="tabpanel" ${k === 'floor' ? '' : 'hidden'}></section>`).join('')}</div>
  </div>`;
  document.getElementById('oTabs').innerHTML = TABS.map(tabBtn).join('');                  // the departments live in the side rail (index.html / classic.html)
  hydrate(root); hydrate(document.getElementById('oTabs'));

  if (writer) {
    let host, next, panel, panelHost, panelNext;
    writer.onStatusPresentation(content => {
      if (content) {
        if (!host) {
          host = buffBar.parentNode; next = buffBar.nextSibling;
          panel = content.parentNode; panelHost = panel.parentNode; panelNext = panel.nextSibling;
        }
        if (buffBar.parentNode !== content) content.appendChild(buffBar);
        if (panel.parentNode !== $('.o-panel')) $('.o-panel').appendChild(panel);
      } else if (host) {
        host.insertBefore(buffBar, next?.parentNode === host ? next : null);
        panelHost.insertBefore(panel, panelNext?.parentNode === panelHost ? panelNext : null);
        host = next = panel = panelHost = panelNext = null;
      }
    });
  }

  function setTab(t) {
    if (!tabVisible(t)) return;
    holding = false;
    const changed = ui.tab !== t, order = TABS.map(x => x[0]), dir = Math.sign(order.indexOf(t) - order.indexOf(ui.tab)); ui.tab = t;
    $('#o-' + t).style.setProperty('--edir', dir);
    if (t === 'floor') buildStage(); ui.cntZero = changed; render(); ui.cntZero = false;
    IMI.emit('tab', { tab: t });
    if (changed) { const p = $('#o-' + t); p.classList.remove('enter'); void p.offsetWidth; p.classList.add('enter'); p.addEventListener('animationend', () => p.classList.remove('enter'), { once: true }); IMI.sfx.tick(); }
  }
  /* the side rail: icons only until the menu button opens it into a labelled drawer (toys, settings, title screen) */
  const rail = document.getElementById('rail'), railBtn = document.getElementById('railToggle');
  const setRail = open => { rail.classList.toggle('open', open); railBtn.setAttribute('aria-expanded', String(open)); railBtn.setAttribute('aria-label', open ? 'Close the menu' : 'Open the menu'); };
  railBtn.addEventListener('click', () => { IMI.sfx.tick(); setRail(!rail.classList.contains('open')); });
  document.addEventListener('pointerdown', e => { if (rail.classList.contains('open') && !e.target.closest('#rail, .set-pop')) setRail(false); });
  rail.addEventListener('click', e => { if (rail.classList.contains('open') && e.target.closest('.o-tab, #menuBtn, #settingsBtn')) setRail(false); }, true);   // capture: the settings button stops propagation
  rail.addEventListener('click', e => { const tab = e.target.closest('.o-tab'); if (tab) setTab(tab.dataset.tab); });
  const dockQ = matchMedia('(min-width: 900px)');                // wide screens: the rail stays open as a sidebar
  const dock = () => { rail.classList.toggle('docked', dockQ.matches); if (dockQ.matches) setRail(false); };
  dockQ.addEventListener('change', dock); dock();
  addEventListener('keydown', e => { if (e.key === 'Escape' && rail.classList.contains('open')) { e.stopImmediatePropagation(); setRail(false); railBtn.focus(); } }, true);
  const tap = () => { press(S.sel, false); };
  root.addEventListener('pointerdown', e => {
    if (!e.target.closest('#oStage')) return;
    e.preventDefault(); $('#oStage').focus({ preventScroll: true }); tap(); if (!chal('hands')) shock(e.clientX, e.clientY, combo.n >= 20 ? '#ff9a3a' : '#fff6d6', false, true); if (toolOn('hold')) holding = true;
  });
  ['pointerup', 'pointercancel', 'blur'].forEach(ev => window.addEventListener(ev, () => { holding = false; }));
  root.addEventListener('keydown', e => {
    if (!e.target.closest('#oStage') || (e.code !== 'Space' && e.code !== 'Enter')) return;
    e.preventDefault(); if (e.repeat) return; tap(); if (toolOn('hold')) holding = true;
  });
  window.addEventListener('keyup', e => { if (e.code === 'Space' || e.code === 'Enter') holding = false; });
  root.addEventListener('focusout', e => { if (e.target.closest('#oStage')) holding = false; });
  IMI.onScreen(() => { holding = false; });

  /* a purchase lands: the card squashes, the picture jumps and the newly filled pips pop (Web Animations, so the 4x/s morph() cannot cut them short) */
  function boughtFx(el) {
    const card = el.closest('.o-card'); if (!card || IMI.reduceMotion) return;
    const had = card.querySelectorAll('.o-pips i.on').length, ease = PX ? 'steps(5)' : 'cubic-bezier(.3,1.5,.5,1)';
    render();
    card.animate([{ scale: '1' }, { scale: '1.045 .96', offset: .3 }, { scale: '.985 1.02', offset: .6 }, { scale: '1' }], { duration: 480, easing: ease });
    const art = card.querySelector('.o-cart');
    if (art) art.animate([{ translate: '0 0', rotate: '0deg' }, { translate: '0 -12px', rotate: '-12deg', offset: .35 }, { translate: '0 2px', rotate: '6deg', offset: .7 }, { translate: '0 0', rotate: '0deg' }], { duration: 560, easing: PX ? 'steps(6)' : 'cubic-bezier(.3,1.6,.5,1)' });
    [...card.querySelectorAll('.o-pips i.on')].slice(had).forEach((p, k) => p.animate([{ scale: '.2', filter: 'brightness(3)' }, { scale: '1.7', filter: 'brightness(1.8)', offset: .5 }, { scale: '1', filter: 'none' }], { duration: 520, delay: k * 50, easing: PX ? 'steps(4)' : 'cubic-bezier(.3,1.8,.5,1)' }));
  }
  const RAR_COL = { c: '#fff6d6', r: '#5fc8ff', e: '#c9a0ff', l: '#ffd23a' };
  function revealLook(at, dy) {                                     // the name floats up in its rarity colour; Rare+ and first finds get a banner, Epic+ a celebration
    const lk = lookById(ui.lastLook.id), r = lk.r || 'c', fresh = ui.lastLook.fresh;
    floatText(lk.name.toUpperCase(), at[0], at[1] + dy, RAR_COL[r], true);
    if (r === 'l') { IMI.banner(PX ? 'LEGENDARY LOOK!' : 'Legendary look!'); flash('#fff08c'); shock(at[0], at[1], '#ffd23a', true); IMI.burst(at[0], at[1], ['star', 'banana', 'spark'], 24); cheer(2400, 'WOW!'); vib([30, 40, 30, 40, 90]); }
    else if (r === 'e') { IMI.banner(PX ? 'EPIC LOOK!' : 'Epic look!'); shock(at[0], at[1], '#c9a0ff', true); IMI.burst(at[0], at[1], ['star', 'spark'], 16); cheer(1400, 'OOH!'); }
    else if (r === 'r') { IMI.banner(fresh ? (PX ? 'NEW RARE LOOK!' : 'New rare look!') : (PX ? 'RARE LOOK!' : 'Rare look!')); shock(at[0], at[1], '#5fc8ff'); }
    else if (fresh) IMI.banner(PX ? 'NEW LOOK!' : 'New look!');
  }
  const resetExplanation = 'Reset progress is unavailable while this save has Diamond Bananas, reward history or Vault items. Second Printing remains available when no purchase or save recovery is pending.';
  const resetBlocked = () => !!(S.prem.earned || S.prem.bought || S.prem.earnedTotal || S.prem.boughtTotal || S.prem.vault || Object.keys(S.prem.credits || {}).length || Object.keys(S.rewards.claims || {}).length || Object.keys(S.rewards.storedGold?.tokens || {}).length || S.rewards.walletHead || S.rewards.awayCheckpoint);
  const ACTIONS = {
    keyhelp: () => {
      if (document.querySelector('.o-modal')) return;
      const el = document.createElement('div'); el.className = 'o-modal'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-labelledby', 'oKeyHelpTitle');
      el.innerHTML = '<div class="o-modal-card"><h3 id="oKeyHelpTitle">Keyboard signals</h3><p>A blue underline marks a letter needed for your current title. Every tap on the typewriter still types a random letter.</p><p>A pressed key briefly dips. Golden Keys turns the whole keyboard gold and gives two letters per manual tap.</p><p>Tap within 0.65 seconds to build a streak. At 10 taps: 3 letters. At 25: double typist speed for 15s. At 50: Golden Keys for 12s. Each reward has a 45s cooldown.</p><button type="button" class="o-btn" data-close>Got it</button></div>';
      document.body.appendChild(el); const btn = el.querySelector('[data-close]'); const close = () => { el.remove(); $('#oStage')?.focus(); }; btn.addEventListener('click', close); el.addEventListener('keydown', e => { if (e.key === 'Escape') { e.stopPropagation(); close(); } }); btn.focus();
    },
    go: el => setTab(el.dataset.tab),
    sel: el => { const to = +el.dataset.i, from = S.sel; S.sel = to; el.scrollIntoView({ inline: 'nearest', block: 'nearest' }); if (ui.tab === 'floor') swapStage(to === from ? 0 : to > from ? 1 : -1); mark(); save(); },
    coach: el => { const at = IMI.centerOf(el); if (coachTypist(S.sel, +el.dataset.p)) { IMI.burst(at[0], at[1], ['spark', 'star'], 8); floatText('+' + COACH_STEP + '%', at[0], at[1] - 10, '#7be05a'); } },
    reroll: el => { const at = IMI.centerOf(el); if (rerollTypist(S.sel, +el.dataset.p)) { IMI.burst(at[0], at[1], ['spark', 'leaf', 'star'], 10); if (ui.lastLook) revealLook(at, -10); else floatText('NEW ROLL', at[0], at[1] - 10, '#ffd23a', true); } },
    unroll: el => { unrollTypist(S.sel, +el.dataset.p); },
    hat: el => {
      const t = cur().crew[+el.dataset.p]; if (!t) return;
      const open = [0, ...HATS.filter(hatOpen).map(h => h.id)], at = open.indexOf(t.hat || 0);
      t.hat = open[(at + 1) % open.length] || 0; IMI.sfx.tick(); S.stats.hatsWorn = Math.max(S.stats.hatsWorn || 0, cur().crew.filter(x => x.hat).length); mark(); save();
    },
    rename: el => {
      const t = cur().crew[+el.dataset.p]; if (!t) return;
      const nm = window.prompt('Name this typist', t.name); if (nm && nm.trim()) { t.name = nm.trim().slice(0, 16); typists = []; syncTypists(true); mark(); save(); }
    },
    commission: el => {
      if (!challengeCommissionAllowed()) return;
      if (pitchPrototype()) return commission(+el.dataset.i,'manual',el);
      const i = +el.dataset.i, p = S.offers[i]; if (!p || pitchActive() >= PITCH_MAX) return;
      S.pitches.push(p); registerPitch(p); S.stats.pitched = (S.stats.pitched || 0) + 1; S.offers[i] = genPitch(buildRecipe({ ...p, text: p.text }).band);
      commissionPublished(p,el);
    },
    repitch: () => { const c = repitchCost(); if (!bananas.spend(c)) return; S.offers = newOffers(); IMI.sfx.tick(); mark(); save(); },
    release: el => releaseDiv(el.dataset.id),
    seed: el => { ui.seed = el.dataset.ch; IMI.sfx.tick(); mark(); },
    plant: el => plant(+el.dataset.i, ui.seed),
    harvest: el => {
      const at = IMI.centerOf(el), ch = S.garden.beds[+el.dataset.i] && S.garden.beds[+el.dataset.i].ch, y = harvest(+el.dataset.i);
      if (y) { IMI.sfx.key(); IMI.burst(at[0], at[1], ['leaf', 'spark'], 8); floatText(`+${y} ${ch}`, at[0], at[1] - 10); vib(12); mark(); save(); }
    },
    harvestall: () => {
      let got = 0;
      if (gardenPrototype()) {
        const indices = S.garden.beds.flatMap((b,i) => b && savedWallNow() >= b.ready ? [i] : []);
        if (indices.length) got = extensions.get('automation')?.gardenAction(gardenRequest('harvest',indices,null,null,'manual')).amount || 0;
      } else S.garden.beds.forEach((b, i) => { got += harvest(i) || 0; });
      if (got) { IMI.sfx.ding(); floatText(`+${got} letters`, innerWidth / 2, 200, '#7be05a', true); mark(); save(); }
    },
    museinvite: el => { const mu = MUSES.find(x => x.id === el.dataset.id); if (!mu || S.muses.owned[mu.id] || !bananas.spend(mu.cost)) return; S.muses.owned[mu.id] = true; IMI.sfx.ding(); logIt(`${mu.name} accepted your invitation to the Muse Salon.`); newsPush(`${mu.name} arrives at the Muse Salon. The monkeys pretend to have read the books.`); mark(); save(); },
    museseat: el => { if (challengeSeatsLocked()) return; const id = el.dataset.id, k = +el.dataset.slot; if (gardenPrototype()) return seatMuse(k,id); if (!S.muses.owned[id] || k >= museSlots()) return; const M = S.muses; const old = M.seated.indexOf(id); if (old >= 0) M.seated[old] = null; M.seated[k] = id; IMI.sfx.ding(); mark(); save(); },
    museout: el => { if (challengeSeatsLocked()) return; if (gardenPrototype()) return seatMuse(+el.dataset.slot,null); S.muses.seated[+el.dataset.slot] = null; IMI.sfx.tick(); mark(); save(); },
    chpick: el => { const c = chDef(el.dataset.id); if (el.dataset.id && (!c || !challengeSelectable(c))) return; ui.nextCh = el.dataset.id; printingHelper()?.printChoice(); IMI.sfx.tick(); mark(); },
    printask: () => askPrint(),
    'mastery-review': el => masteryReview(el.dataset.medal),
    'mastery-abandon': () => writer.masteryAction({action:'abandon'}),
    chabandon: () => { if (challengeActive()) {if (confirm('Abandon this Small Crew run? No compensation or reward.')) {printingHelper()?.challengeLocalOff(); writer.challengeAction({action:'abandon'});} return;} if (S.challenge) endChallenge('abandon'); },
    legbuy: el => {
      const u = LEG.find(x => x.id === el.dataset.id); if (!u) return; const lv = legLvl(u.id), cost = u.costs[lv];
      if (lv >= u.max || S.legacy.stars < cost) return; S.legacy.stars -= cost; S.legacy.ups[u.id] = lv + 1;
      IMI.sfx.ding(); logIt(`Legacy upgrade: ${u.name} level ${lv + 1}.`); mark(); save();
    },
    buyn: el => { ui.buyN = el.dataset.n === 'max' ? 'max' : +el.dataset.n; mark(); },
    up: el => { const at = IMI.centerOf(el), had = JSON.stringify(cur().up) + cur().paws; buyUp(el.dataset.k); if (JSON.stringify(cur().up) + cur().paws !== had) { IMI.burst(at[0], at[1], ['spark', 'leaf', 'star'], 10); vib(25); boughtFx(el); if (el.dataset.k === 'paw') { const nt = cur().crew[cur().crew.length - 1]; if (nt && nt.shiny) { floatText(`SHINY ${nt.name.toUpperCase()}!`, at[0], at[1] - 40, '#ffe680', true); shock(at[0], at[1], '#ffe680', true); flash('#fff6a0'); newsPush(`A SHINY typist joins the crew: ${nt.name} glitters faintly and refuses to explain why.`); } cheer(900, 'HI!'); if (nt && ui.lastLook) revealLook(at, -70); newsPush('A new typist swings in. HR hands over a name tag and a banana.'); } } },
    bankword: el => { const at = IMI.centerOf(el); if (bankWord(cur(), el.dataset.w)) { IMI.sfx.key(); vib(8); shock(at[0], at[1], '#7be05a'); floatText('+' + el.dataset.w, at[0], at[1] - 10); } },
    buy: el => { const at = IMI.centerOf(el), before = bananas.get(); buy(el.dataset.what, el.dataset.i); if (bananas.get() < before) { IMI.burst(at[0], at[1], ['banana', 'spark', 'star'], 12); vib(25); boughtFx(el); } },
    write: el => writeTitle(el.dataset.id, el),
    pgopen: () => { ui.sub.press = 'titles'; setTab('press'); },
    pgauto: () => pg?.configure(pgContext, { enabled: false, manual: null }),
    pgband: el => pg?.configure(pgContext, { enabled: true, band: +el.dataset.band, manual: null }),
    pgadvance: () => pg?.configure(pgContext, { advance: !S.meta.productionGoal?.advance }),
    pgreturn: () => pg?.configure(pgContext, { manual: null }),
    pgretry: () => pg?.retry(pgContext),
    focus: el => { if (folioGoal() && !writer.folioAction({action:'return', expected:S.meta.folio}).ok) return; const r = RBY[el.dataset.id]; if (!r || !titleAvailable(r)) return; if (pg?.active(pgContext)) return pg.configure(pgContext, { manual: el.dataset.id }); if (!r || lockedDesk(r) !== undefined) return; S.focus = el.dataset.id; S.autoFocus = false; mark(); save(); IMI.emit('focus', { id: S.focus }); },
    unfocus: () => { if (pg?.active(pgContext)) return pg.configure(pgContext, { manual: null }); S.focus = null; S.autoFocus = true; pickAutoFocus(); mark(); save(); },
    autofocus: () => { if (pg?.active(pgContext)) return pg.configure(pgContext, { manual: null }); S.autoFocus = true; S.focus = null; pickAutoFocus(); mark(); save(); },
    ktoggle: el => { if (!keepersReady()) return; const k = S.desks[+el.dataset.i].keeper; k.on = !k.on; IMI.sfx.tick(); mark(); save(); },
    kon: () => { cur().keeper.on = true; mark(); save(); },
    koff: () => { cur().keeper.on = false; mark(); save(); },
    ovrset: () => {
      const w = ui.ovr.trim().toUpperCase();
      if (!VOCAB.has(w) || bandOf(w.length) !== S.sel) return IMI.say(`“${w || '…'}” isn’t a ${DESKS[S.sel].lo}–${DESKS[S.sel].hi} letter word here.`);
      cur().keeper.targets[w] = Math.max(0, Math.min(9999, ui.ovrn | 0)); ui.ovr = ''; mark(); save();
    },
    ovrdel: el => { delete cur().keeper.targets[el.dataset.w]; mark(); save(); },
    libf: el => { ui.libf = el.dataset.f; ui.libLimit = 24; saveView(); mark(); },
    libcap: el => { ui.libcap = el.dataset.c; ui.libLimit = 24; saveView(); IMI.sfx.tick(); mark(); },
    libsort: el => { ui.libsort = el.dataset.s; ui.libLimit = 24; saveView(); IMI.sfx.tick(); mark(); },
    pubon: () => { if ((chal('patientpress') || masteryActive())) return; S.pub.on = !S.pub.on; IMI.sfx.tick(); mark(); save(); },
    pubrule: el => { if ((chal('patientpress') || masteryActive())) return; S.pub.rule = el.dataset.r; IMI.sfx.tick(); mark(); save(); },
    liblock: () => { ui.libshow = !ui.libshow; ui.libLimit = 24; saveView(); IMI.sfx.tick(); mark(); },
    libmore: () => { ui.libLimit += 24; mark(); },
    sub: el => { ui.sub[el.dataset.dept] = el.dataset.sub; IMI.sfx.tick(); mark(); IMI.emit('tab', { tab: el.dataset.dept, sub: el.dataset.sub }); const p = $('#o-' + el.dataset.dept); if (p) p.scrollTop = 0; },
    golist: () => { const n = $('#oTitleList'); if (n) n.scrollIntoView({ behavior: IMI.reduceMotion ? 'auto' : 'smooth', block: 'start' }); },
    autotoggle: () => { if (pg?.active(pgContext)) return pg.configure(pgContext, { manual: null }); if (S.autoFocus) S.autoFocus = false; else { S.autoFocus = true; S.focus = null; pickAutoFocus(); } IMI.sfx.tick(); mark(); save(); },
    archf: el => { ui.archf = el.dataset.f; renderArchive(); },
    pull: el => { ui.pulled = ui.pulled === el.dataset.id ? null : el.dataset.id; ui.sub.press = 'shelf'; IMI.sfx.tick(); if (ui.tab !== 'press') setTab('press'); else mark(); },
    read: el => { ui.read = ui.read === el.dataset.id ? null : el.dataset.id; mark(); },
    reset: () => { if (resetBlocked()) { IMI.say(resetExplanation); return; } if (imprintChallenge() && !challengeSettled()) return; if (confirm('Reset Typewriter Ops and bananas?')) { if (writer && !bananas.resetAcknowledged().ok) { writer.resetFailure(); return; } IMI.pickups?.clear(); if (!writer) bananas.spend(bananas.get()); S = fresh(); extensionEvent('init', 'full-reset'); extensionEvent('reset', { kind: 'full-reset' }); goldEnd?.(); royAcc = coinBank = 0; Object.assign(ui, { tab: 'floor', libq: '', libf: 'open', libcap: 'all', libsort: 'close', libshow: false, libLimit: 24, sub: {}, pulled: null, read: null, shelfNew: 0 }); saveView(); combo.n = combo.t = 0; ui.mcd = {}; Object.keys(buffs).forEach(k => buffs[k] = 0); holding = false; keeperT = []; rt.forEach(r => r.timers = []); try { localStorage.removeItem('imi-tour'); } catch { /* storage blocked */ } IMI.tour?.reset(); save(); buildStage(); mark(); } }
  };
  const challengeInterventions = new Set(['focus','unfocus','autofocus','autotoggle','ktoggle','koff','up','buy','chpick','pgauto','pgband','pgadvance','pgreturn','pgretry','plant','harvest','harvestall','commission','repitch','release','museinvite','museseat','museout','legbuy','coach','reroll','ovrset','bankword']);
  if (writer) for (const name of Object.keys(ACTIONS)) {
    const action = ACTIONS[name]; ACTIONS[name] = (...args) => { if (progressing() && (!challengeActive() || !challengeInterventions.has(name) || challengeHandover())) return action(...args); };
  }
  root.addEventListener('click', e => {
    if (!progressing()) return;
    const el = e.target.closest('[data-act]'); if (!el || el.disabled) return;
    const act = el.dataset.act;
    if (challengeActive() && /^(folio|archive|works-demo|works-play|automation):/.test(act) && !act.startsWith('automation:challenge-') && !challengeHandover()) return;
    if (ACTIONS[el.dataset.act]) ACTIONS[el.dataset.act](el);
    else { const [id, name] = el.dataset.act.split(':'); extensions.get(id)?.actions?.[name]?.(el, extensionAPI); }
    renderT = 9;                    // a tap redraws on the next tick, whatever the render spacing is
  });
  root.addEventListener('change', e => {
    if (!progressing()) return;
    const el = e.target.closest('[data-in]');
    if (challengeActive() && (el?.dataset.in === 'kdef' || e.target.dataset.lg03Reserve || e.target.dataset.lg06a) && !challengeHandover()) return;
    if (el && el.dataset.in === 'pgcollection') pg?.configure(pgContext, { collection: el.value, manual: null });
    if (el && el.dataset.in === 'libsort') { ui.libsort = el.value; ui.libLimit = 24; saveView(); IMI.sfx.tick(); mark(); }
    if (el && el.dataset.in === 'kdef') { cur().keeper.def = Math.max(0, Math.min(9999, el.value | 0)); save(); mark(); }
  });
  root.addEventListener('input', e => {
    if (!progressing()) return;
    const el = e.target.closest('[data-in]'); if (!el) return;
    if (el.dataset.in === 'ovrw') ui.ovr = el.value; else if (el.dataset.in === 'ovrn') ui.ovrn = el.value | 0;
  });
  const tk = $('#oTicker');
  tk.addEventListener('click', () => startNews());
  tk.addEventListener('pointerenter', () => { try { ticker.anim && ticker.anim.pause(); } catch { /* ignore */ } });
  tk.addEventListener('pointerleave', () => { try { ticker.anim && ticker.anim.play(); } catch { /* ignore */ } });
  bananas.watch((b, event) => { if (b !== lastBananas) { if (b > lastBananas && !event?.reward) S.run.earned = (S.run.earned || 0) + (b - lastBananas); lastBananas = b; mark(); } });

  /* ================= main loop ================= */
  let coinClock = 0, chalClock = 0, gardenClock = 0, marketClock = 0, awardClock = 0, royAcc = 0, royClock = 0, royFloat = 2.4, goldIn = 25 + rand() * 25, buffWas = false, last = performance.now(), keeperT = [], focusClock = 0, saveT = 0, renderT = 0, renderGap = .25;
  function tick(frame = null) {
    if (!progressing()) return;
    if (!frame && printingEnabled()) printingHelper()?.sampleUpdate();
    const now = frame?.now ?? performance.now(), realDt = frame?.realDt ?? Math.min(0.25, (now - last) / 1000), multiplier = frame?.multiplier ?? speed(), dt = realDt * multiplier;
    if (!frame || frame.phase === 0) {
    last = now;
    if (frame) Object.assign(frame, {now,realDt,multiplier,heldInput:holding && toolOn('hold')});
    if (!document.hidden) { const extra = (dt - realDt) * 1000; productionExtra += extra; advanceDeadlines(extra); }
    S.desks.forEach(ensureCrew);
    gardenClock += dt; if (gardenClock >= 1) { gardenClock = 0; gardenTick(); }
    if (frame) frame.phase = 1;
    }
    if (document.hidden) return;                                   // hidden time is paid out as offline progress when you come back
    if (!frame || frame.phase === 1) {
    S.desks.forEach((d, i) => {
      if (frame && (i < frame.desk || !progressing())) return;
      if (!d.owned || !d.paws) return;
      const T = rt[i].timers, base = pawSecs(d);
      while (T.length < d.paws) T.push(rand() * base);
      for (let p = 0; p < d.paws; p++) {
        if (frame && p < frame.paw) continue;
        const secs = base / typistSpeed(d.crew[p]) / deskMk(d);
        if (!frame || !frame.debited) T[p] -= dt;
        if (frame) { frame.desk=i; frame.paw=p; frame.debited=true; }
        let guard = frame?.presses || 0;
        while (T[p] <= 0 && guard++ < 8) {
          T[p] += secs; if (frame) frame.presses=guard;
          press(i, true, p);
          if (frame && !progressing()) return;
        }
        if (frame) { frame.paw=p+1; frame.presses=0; frame.debited=false; }
      }
      if (frame) { frame.desk=i+1; frame.paw=0; }
    });
    if (frame) { if (!progressing()) return; frame.phase=2; }
    }
    if (!frame || frame.phase === 2) {
    const stH = $('#oStage'); if (stH) stH.classList.toggle('holding', !!(holding && toolOn('hold')));
    if (frame ? frame.heldInput : holding && toolOn('hold')) {
      if (!frame || !frame.holdStarted) holdAcc += holdRate(cur()) * dt;
      if (frame) frame.holdStarted=true;
      let g = frame?.holdPresses || 0;
      while (holdAcc >= 1 && g++ < 12) { holdAcc -= 1; if(frame)frame.holdPresses=g; press(S.sel, false); if(frame&&!progressing())return; }
    } else holdAcc = 0;
    if (frame) frame.phase=3;
    }
    if (!frame || frame.phase === 3) {
    focusClock += dt; if (focusClock >= 1) { focusClock = 0; if (!S.focus && S.autoFocus) pickAutoFocus(); }
    worksAdvance();
    S.desks.forEach((d, i) => { if (!d.owned) return; keeperT[i] = (keeperT[i] || 0) + dt * (museOn('hemi') ? 2 : 1); let g = 0; while (keeperT[i] >= keeperPeriod(i) && g++ < 4) { keeperT[i] -= keeperPeriod(i); keeperStep(d, i); } if (g >= 4) keeperT[i] = 0; });
    if (frame) frame.phase=4;
    }
    if (!frame || frame.phase === 4) {
    if (S.challenge) {
      if (!frame || !frame.challengeStarted) chalClock += dt;
      if (frame) frame.challengeStarted=true;
      if (chalClock >= 1) { chalClock = 0; checkChallenge(); dirty = true; }
    }
    if (!progressing()) return;
    if (frame) frame.phase=5;
    }
    if (!frame || frame.phase === 5) {
    if (!frame || !frame.awardsStarted) {
    const buffNow = anyBuff(); if (buffNow || buffWas) dirty = true; buffWas = buffNow;
    marketClock += realDt; if (marketClock >= 6) { marketClock = 0; marketStep(); }
      S.stats.secs += realDt; if (IMI.screen() === 'game') S.stats.playSecs += dt; awardClock += realDt;
      if (frame) { frame.awardsStarted=true; frame.awardsDue=awardClock>=1; }
    }
    if (frame ? frame.awardsDue : awardClock >= 1) { awardClock = 0; checkAwards(); }
    if (!progressing()) return;
    if (frame) frame.phase=6;
    }
    if (!frame || frame.phase === 6) {
    const paidSeconds = writer ? writer.incomeSeconds(dt, Math.max(0, buffs.rush - now + dt * 1000), Math.max(0, buffs.critic - now + dt * 1000)) : dt;
    const rr = writer ? royBase() : royRate(), dr = writer ? divBase() : divRate();
    if (!frame || !frame.incomeStarted) {
      if (archiveFeature?.enabled && S.meta.archive !== undefined && (!frame || !frame.archiveStarted)) {
        if (frame) frame.archiveStarted = true;
        const end = Math.max(Date.now(), S.meta.archive.through, archiveSpans.at(-1)?.end || 0);
        const start = Math.max(S.meta.archive.through, archiveSpans.at(-1)?.end || end - realDt * 1000);
        // Real productive dt is already speed-scaled once; wall time only selects the age stage.
        if (!archiveSpans.length) archiveSampleToken = printingHelper()?.printSampleToken() ?? null;
        else if (!extensionAPI.printSampleAllowed()) archiveSampleToken = null;
        archiveSpans.push({start,end:Math.max(end,start + .001),seconds:dt});
        if (archiveSpans.length >= 100 && !archiveSettle()) return;
      }
      if (royAcc === 0) royaltySampleToken = printingHelper()?.printSampleToken();
      else if (!extensionAPI.printSampleAllowed()) royaltySampleToken = null;
      royAcc += (rr + dr) * paidSeconds; royClock += dt;
      if (writer) writer.consumeGold(dt * 1000);
      if (frame) frame.incomeStarted=true;
    }
    if (royClock >= .25 && royAcc >= cash(1)) {
      const n = floorMoney(royAcc), share = dr / ((rr + dr) || 1);
      if (frame && bananas.add(n) === false) { writer.boundaryFailure('Historical income waiting for the wallet save.'); return; }
      royAcc -= n; royClock = 0; S.royTotal += n * (1 - share); S.divTotal += n * share;
      if (!frame) { const balance = bananas.get(); bananas.add(n); printingHelper()?.printPosting(bananas.get() - balance,royaltySampleToken); }
      royaltySampleToken = printingHelper()?.printSampleToken();
      coinBank += n;
    }
    if (frame) frame.phase=7;
    }
    if (!frame || frame.phase === 7) {
    coinClock += realDt; if (coinClock >= 1.1) { coinClock = 0; royCoins(); }
    if (divCount(DIVS[4])) { premiereClock += dt; if (premiereClock >= 300) { premiereClock = 0; premiere(); } }
    royFloat -= realDt; if (royFloat <= 0) { royFloat = 2.4; royPing(); }
    if (multiplier !== 1 && goldEnd && productionNow() >= goldUntil) goldEnd();
    if (!document.hidden) { goldIn -= dt * (museOn('christie') ? 1.3 : 1) * (1 + .25 * legLvl('golden')) * (1 + .03 * S.desks.reduce((a, d) => a + d.crew.reduce((b, t) => b + (t.trait === 'scout' ? trMul(t) : 0), 0), 0)); if (goldIn <= 0) { goldIn = 55 + rand() * 80; spawnGold(); } }
    if (frame) frame.phase=8;
    }
    if (!frame || frame.phase === 8) {
    if (frame) frame.phase=9;
    if (!(chal('patientpress') || masteryActive()) && S.pub.tier && S.pub.on) { pubClock += dt; if (pubClock >= pubPeriod()) { pubClock = 0; pubSell(); } } else pubClock = 0;
    if (frame && !progressing()) return;
    }
    if (!frame || frame.phase === 9) {
    extensionEvent('tick', { realSeconds: realDt, gameSeconds: dt, ...(extensions.has('automation') ? { replay:!!frame } : {}) });
    renderT += realDt;
    if (renderT >= renderGap && dirty) {                           // renders are spaced by how long they take, so a slow phone spends a fixed share of its time here
      renderT = 0; dirty = false; const t0 = performance.now(); render();
      renderGap = Math.min(1, Math.max(LOW() ? .5 : .25, (performance.now() - t0) * .007));
    }
    saveT += realDt; if (saveT >= 5) { saveT = 0; save(); }
    if (frame) frame.phase=10;
    }
  }
  window.addEventListener('beforeunload', save);
  document.addEventListener('visibilitychange', () => { if (!progressing()) return; if (document.hidden) save(); else { last = performance.now(); welcomeBack(30); setTimeout(dailyLater, 1200); } });
  if (typeof Weather !== 'undefined') Weather.on('change', () => { paintWindow(); mark(); });
  /* the sky announces itself in the ticker; with a barometer it also warns shortly before a change */
  const SKY_NEWS = ['The clouds clear over the canopy. Honeycomb gift books look brighter already.', 'Drizzle on the canopy. Cosy-reading weather: Hibiscus titles are in demand.', 'Rain! The monkeys put on leaf hats and the water starts to rise.', 'STORM. The typists cling to their vines and Lagoon drama sells.'];
  IMI.on('sky', e => { skyC = null; if (e.night !== e.prev.night) newsPush(e.night ? 'Night falls. Owls clock in and bedtime books sell.' : 'The sun comes up. The owls go home grumbling.'); else newsPush(SKY_NEWS[e.wx]); mark(); });
  IMI.on('skysoon', e => { if (S.baro >= 1) newsPush(`Forecast: ${World.label(e.ev)} in about ${Math.max(1, Math.round(e.etaMs / 1000))} seconds.`); });

  for (const [id, hooks] of window.__OPS_EXTENSIONS || []) extensionAPI.register(id, hooks);
  window.VaultPlay?.install(extensionAPI);
  function startGame() {
  if (writer && S.prem.vault && (S.prem.vault.transition || S.rewards.awayCheckpoint) && !writer.boundaryProgressing()) {
    if (!writer.runLocalTransaction({id:'boundary:startup',kind:'settlement',settle:vaultBoundary,build:p=>p,continue:()=>{}})) return false;
  }
  if (writer && !started && window.VaultPlay?.enabled() && !writer.lampStartup()) return false;
  if (started || !progressing()) return false;
  started = true;
  introProgress(); pickAutoFocus(); S.desks.forEach(ensureCrew); if (totalReleased() > 0) loadArchive();
  if (writer && S.rewards.awayCheckpoint) simulateAway(0);
  if (!progressing()) { started = false; return false; }
  checkAwards(true);
  if (!progressing()) { started = false; return false; }
  buildStage(); render(); startNews(); welcomeBack(60);
  if (!progressing()) { started = false; return false; }
  setTimeout(dailyLater, 1800);
  IMI.onScreen(name => { if (name === 'game') { mark(); buildStage(); startNews(); render(); } else render(); });
  setInterval(tick, 50);
  requestAnimationFrame(loop);
  return true;
  }
  startGame();
  }
  if (window.Rewards?.enabled) Rewards.start(start); else start();
})();
