/* The Break Room: games are bought one at a time in the Shop. A rewarded break is one run, paid in Inspiration by how well it went
   (score against the game's par, so a hard game pays more for a modest score), and Inspiration buys permanent ideas.
   Games play inside the main wooden panel with the side menu live. Current Ops state is the sole durable authority. */
(() => {
  'use strict';
  if (!(window.GameFeatures?.enabled('mg01') ?? new URLSearchParams(location.search).get('mg01') === '1')) return;
  /* In shop order: each game is bought after the one before it. Prices are bananas before the global cash scale.
     par: a good ordinary run (about what a careful first-timer reaches). pay: Inspiration for a par run. tune: per-mode [par x, pay x]. */
  const GAMES = {
    barrel:  { page:'barrel-catch',     name:'Banana Barrel',     cost:5e3,   modes:['bananas','fruit'], par:1500,  ico:'i-palm',    blurb:'Catch falling bananas in a barrel and dodge the coconuts.' },
    shuffle: { page:'coconut-shuffle',  name:'Coconut Shuffle',   cost:12e3,  modes:['main'],            par:2500,  ico:'i-coconut', blurb:'Follow the shells and pick the one hiding the banana.' },
    hop:     { page:'road-hop',         name:'Road Hop',          cost:30e3,  modes:['main'],            par:120,  ico:'i-monkey',  blurb:'Cross busy city roads, grab fruit, outrun the garbage truck.' },
    whack:   { page:'key-whack',        name:'Key Whack',         cost:60e3,  modes:['main'],            par:3500, ico:'i-type',    blurb:'Hit the typewriter keys as they light up. Avoid the ink blots.' },
    stall:   { page:'fruit-stall',      name:'Fruit Stall',       cost:120e3, modes:['main'],            par:1000,  ico:'banana',    blurb:'Serve customers their fruit orders before they lose patience.' },
    vine:    { page:'vine-swing',       name:'Vine Swing',        cost:250e3, modes:['main'],            par:450,  ico:'leaf',      blurb:'One button: grab, swing, release and catch the next vine.' },
    dash:    { page:'peel-dash',        name:'Peel Dash',         cost:500e3, modes:['main'],            par:2000,  ico:'i-log',     blurb:'Sprint down a three-lane jungle path. Jump logs, dodge rocks.' },
    stack:   { page:'banana-stack',     name:'Banana Stack',      cost:1e6,   modes:['main'],            par:2500,  ico:'i-log',     blurb:'Drop swinging crates and build the tallest tower.' },
    slice:   { page:'banana-slice',     name:'Banana Slice',      cost:2e6,   modes:['main'],            par:3000,  ico:'banana',    blurb:'Slice tossed bananas with a swipe. Spare the coconuts.' },
    rhythm:  { page:'typewriter-rhythm', name:'Typewriter Rhythm', cost:4e6,  modes:['easy','normal','hard'], par:3500, tune:{ easy:[.7, .6], normal:[1, 1], hard:[1.3, 1.6] }, ico:'i-reel', blurb:'Four lanes of falling keys to a jungle beat.' },
    tidy:    { page:'library-tidy',     name:'Library Tidy',      cost:6e6,   modes:['main'],            par:3000,  ico:'i-works',   blurb:'Real titles fall fast: tap the shelf each one belongs on.' },
    bowling: { page:'coconut-bowling',  name:'Coconut Bowling',   cost:8e6,   modes:['main'],            par:150,  ico:'i-coconut', blurb:'A full ten-frame game. Slide, aim and throw.' },
    packer:  { page:'crate-packer',     name:'Crate Packer',      cost:16e6,  modes:['main'],            par:130,  ico:'i-log',     blurb:'Rotate and pack banana crates into the truck bay.' },
    heist:   { page:'banana-heist',     name:'Banana Heist',      cost:32e6,  modes:['main'],            par:300,  ico:'i-monkey',  blurb:'Creep past the guards, grab the bunch, slip back out.' },
    plinko:  { page:'banana-plinko',    name:'Banana Plinko',     cost:64e6,  modes:['main'],            par:1200,  ico:'banana',    blurb:'Drop a spinning banana through a board of pegs.' }
  };
  const ORDER = Object.keys(GAMES);
  ORDER.forEach((id, i) => { GAMES[id].pay = Math.round(100 * Math.pow(1.31, i) / 10) * 10; });   // 100 for the first game, about 4,300 for the last
  const REFILL_BASE = 2 * 60 * 60 * 1000;
  const CAP_BASE = 6, CURVE_UP = .85, CURVE_LOW = 1.15, FRESH = 1.25, NEW_BEST = .25, MAX_PLAY = 3600;
  /* The ideas. Each track is bought one level at a time; vals[] is the cumulative effect, so a card reads "+35% › +70%".
     Past the last listed level a track with a tail keeps going (value grows by tail, cost by grow) so Inspiration never stops being worth something.
     games[] is how many Break Room games you must own before that level is offered. */
  const pct = v => `+${Math.round(v * 100)}%`;
  const TRACKS = {
    hands:   { name:'Warm hands',   ico:'u-fing',     fx:'typing', unit:'automatic typing',   vals:[.15, .35, .7, 1.3, 2.3],  tail:1,   cost:[150, 600, 2400, 9500, 38e3],  grow:1.6, games:[0, 2, 4, 7, 10], show:v => pct(v) },
    keepers: { name:'Fresh eyes',   ico:'s-keeper',   fx:'keeper', unit:'keeper speed',       vals:[.15, .35, .7, 1.3, 2.3],  tail:1,   cost:[170, 680, 2700, 10.5e3, 42e3], grow:1.6, games:[2, 3, 5, 8, 11], show:v => pct(v) },
    sales:   { name:'Good stories', ico:'d-reprints', fx:'sale',   unit:'title income',       vals:[.1, .25, .5, .9, 1.5],    tail:.75, cost:[220, 900, 3600, 14e3, 56e3],   grow:1.6, games:[3, 4, 6, 9, 12], show:v => pct(v) },
    flash:   { name:'Bright ideas', ico:'i-insp',     fx:'flash',  unit:'inspired typists',   vals:[.3, .6, 1, 1.5],          secs:[4, 8, 12, 18], cost:[400, 1800, 7e3, 28e3], games:[4, 6, 8, 11], show:(v, lv) => `×${(1 + v).toFixed(1)} often · +${TRACKS.flash.secs[lv - 1]}s` },
    luck:    { name:'Lucky streak', ico:'u-rapid',    fx:'luck',   unit:'crits, hot sales, Golden Hours', vals:[.2, .45, .8, 1.3, 2], cost:[350, 1600, 6500, 26e3, 100e3], games:[5, 6, 8, 10, 13], show:v => pct(v) },
    room:    { name:'Room for play', ico:'i-game',    fx:'room',   unit:'breaks held',        vals:[8, 10, 12, 15, 20],       cost:[120, 500, 2e3, 8e3, 30e3],     games:[2, 3, 5, 7, 10], show:v => String(v) },
    pace:    { name:'Quick breaks', ico:'i-reel',     fx:'pace',   unit:'until a break returns', vals:[90, 60, 45, 30, 20],   cost:[250, 1200, 5e3, 20e3, 75e3],   games:[3, 5, 7, 9, 12], show:v => v + 'm' },
    muse:    { name:'Studio notes', ico:'i-works',    fx:'yield',  unit:'Inspiration per run', vals:[.2, .45, .8, 1.3],       tail:.5,  cost:[300, 1500, 6e3, 24e3],         grow:1.5, games:[3, 5, 7, 10], show:v => pct(v) }
  };
  const TRACK_IDS = Object.keys(TRACKS);
  const maxLv = t => t.tail ? Infinity : t.vals.length;
  const valueAt = (t, lv) => lv <= 0 ? 0 : lv <= t.vals.length ? t.vals[lv - 1] : t.vals[t.vals.length - 1] + t.tail * (lv - t.vals.length);
  const costAt = (t, lv) => Math.round(lv < t.cost.length ? t.cost[lv] : t.cost[t.cost.length - 1] * Math.pow(t.grow, lv - t.cost.length + 1));
  const needAt = (t, lv) => t.games[Math.min(lv, t.games.length - 1)];
  /* the first Break Room ideas were single purchases; they map onto the new levels so nothing already bought is lost */
  const OLD = { 'warm-up':['hands', 1], 'nimble-paws':['hands', 2], 'steady-hands':['hands', 3], 'fresh-eyes':['keepers', 1], 'quick-keepers':['keepers', 2], 'good-stories':['sales', 1], 'bestsellers':['sales', 2], 'room-for-play':['room', 1], 'big-break':['muse', 1] };
  /* saves from before the shop that already played the Break Room keep the two original games */
  const gamesOf = m => Array.isArray(m?.games) ? m.games : (m && (m.nextSession > 1 || m.wallet > 0) ? ['barrel', 'shuffle'] : []);
  const levelsOf = m => {
    const out = {};
    if (m && typeof m.lv === 'object' && m.lv) for (const id of TRACK_IDS) if (m.lv[id] > 0) out[id] = m.lv[id];
    if (Array.isArray(m?.nodes)) for (const id of m.nodes) { const o = OLD[id]; if (o && (out[o[0]] || 0) < o[1]) out[o[0]] = o[1]; }
    return out;
  };
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
  /* what a run is worth: the game's pay times (score / par) ^ 0.85 above par, so doubling a score pays less than double and an outlier cannot break the economy;
     below par the exponent is 1.15, so a token score earns a token reward */
  const tuneOf = (id, mode) => GAMES[id].tune?.[mode] || [1, 1];
  const bestKey = (id, mode) => GAMES[id].modes.length > 1 ? `${id}:${mode}` : id;
  const isFresh = (m, id) => { const owned = gamesOf(m).length; return owned > 2 && !(m.recent || []).slice(0, Math.min(2, owned - 1)).includes(id); };
  function worth(m, id, mode, score) {
    if (!(score > 0)) return 0;
    const g = GAMES[id], [parX, payX] = tuneOf(id, mode), par = g.par * parX, ratio = Math.min(score, par * 60) / par;
    return Math.max(1, Math.floor(g.pay * payX * Math.pow(ratio, ratio < 1 ? CURVE_LOW : CURVE_UP) * (1 + derived(m).yield) * (isFresh(m, id) ? FRESH : 1)));
  }
  const parWorth = (m, id, mode) => worth(m, id, mode, GAMES[id].par * tuneOf(id, mode)[0]);
  // A caller-owned developer fixture can supply only the dedicated played-time clock.
  const playNow = window.__MG01_CLOCK || (() => performance.now());
  let api, overlay, frame, host, pending, notice = '', returnFocus, view = 'games', launchSeq = 0, leaving = 0, shown = 0, rollRaf = 0, soundOn = true;
  const copy = value => JSON.parse(JSON.stringify(value));
  const classic = () => document.documentElement.dataset.style === 'classic';
  const saved = () => api.state().meta.minigames;
  const bounded = (n, max) => Number.isFinite(n) && n >= 0 && n <= max;
  function valid(m) {
    return m && m.version === 1 && Number.isSafeInteger(m.wallet) && m.wallet >= 0 && bounded(m.fraction, 1) && m.fraction < 1 &&
      (m.nodes === undefined || Array.isArray(m.nodes) && m.nodes.every(id => Object.hasOwn(OLD, id)) && new Set(m.nodes).size === m.nodes.length) &&
      (m.lv === undefined || m.lv && typeof m.lv === 'object' && Object.entries(m.lv).every(([id, n]) => Object.hasOwn(TRACKS, id) && Number.isInteger(n) && n >= 0 && n <= maxLv(TRACKS[id]) && n <= 999)) &&
      (m.best === undefined || m.best && typeof m.best === 'object' && Object.entries(m.best).every(([k, n]) => /^[a-z]+(:[a-z]+)?$/.test(k) && Object.hasOwn(GAMES, k.split(':')[0]) && bounded(n, 1e9))) &&
      (m.recent === undefined || Array.isArray(m.recent) && m.recent.length <= 3 && m.recent.every(id => Object.hasOwn(GAMES, id))) &&
      (m.games === undefined || Array.isArray(m.games) && m.games.every(id => Object.hasOwn(GAMES, id)) && new Set(m.games).size === m.games.length) &&
      Number.isInteger(m.attempts) && bounded(m.attempts, capacity(m)) && bounded(m.refillAt, Number.MAX_SAFE_INTEGER) &&
      Number.isSafeInteger(m.nextSession) && m.nextSession > 0 && Number.isSafeInteger(m.settled) && m.settled >= 0 && m.settled < m.nextSession &&
      (m.active === null || (gamesOf(m).includes(m.active?.game) && Number.isSafeInteger(m.active.id) && m.active.id > m.settled && m.active.id < m.nextSession && bounded(m.active.played, MAX_PLAY) &&
        (m.active.score === undefined || bounded(m.active.score, 1e9)) && (m.active.mode === undefined || GAMES[m.active.game].modes.includes(m.active.mode))));
  }
  function fresh() { return { version:1, wallet:0, fraction:0, games:[], attempts:CAP_BASE, refillAt:api.clock.wallNow(), nextSession:1, active:null, settled:0 }; }
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
    const lv = level(m, id), cost = costAt(t, lv);
    if (lv >= maxLv(t) || m.wallet < cost || gamesOf(m).length < needAt(t, lv)) return;
    const next = copy(m); next.lv = { ...derived(m).lv, [id]:lv + 1 }; delete next.nodes; refill(next); next.wallet -= cost;
    commit(next, () => { IMI.sfx.ding?.(); });
  }
  /* what the rest of the game reads: three bonuses it already knew, plus perk(kind) for the new ones */
  const bonus = kind => { const m = api && saved(); return valid(m) ? derived(m)[kind] : 0; };
  const fmt = n => n < 1e4 ? Math.round(n).toLocaleString('en-US') : n < 1e6 ? (n / 1e3).toFixed(n < 1e5 ? 1 : 0).replace(/\.0$/, '') + 'K' : (n / 1e6).toFixed(n < 1e7 ? 2 : 1).replace(/\.?0+$/, '') + 'M';
  const amt = (n, cls = '') => window.Gems?.amount('insp', typeof n === 'number' ? fmt(n) : n, cls) || String(n);
  const gem = (cls = '') => window.Gems?.html('insp', cls) || '';
  /* one icon per break held, or a count once there are too many to line up */
  const attemptPips = m => capacity(m) > 10
    ? `<span class="mg-tk-row mg-tk-count" role="img" aria-label="${m.attempts} of ${capacity(m)} rewarded breaks"><span class="mg-tk on">${api.shop.ico('i-game', 22)}</span><b>${m.attempts}/${capacity(m)}</b></span>`
    : `<span class="mg-tk-row" role="img" aria-label="${m.attempts} of ${capacity(m)} rewarded breaks">${Array.from({ length:capacity(m) }, (_, k) => `<span class="mg-tk${k < m.attempts ? ' on' : ''}">${api.shop.ico('i-game', 22)}</span>`).join('')}</span>`;
  function trackCard(id, m, supported) {
    const t = TRACKS[id], lv = supported ? level(m, id) : 0, top = lv >= maxLv(t), next = lv + 1, cost = top ? 0 : costAt(t, lv);
    const short = !top && m.wallet < cost, off = !supported || top || short || m.active || overlay || pending;
    const pips = t.tail ? `<span class="o-lvl">Lv ${lv}</span>` : `<span class="o-pips mg02-pips" role="img" aria-label="level ${lv} of ${t.vals.length}">${t.vals.map((_, k) => `<i class="${k < lv ? 'on' : ''}"></i>`).join('')}</span>`;
    const now = lv ? t.show(valueAt(t, lv), lv) : '', after = top ? '' : t.show(valueAt(t, next), next);
    return `<div class="o-card mg02-node${top ? ' owned' : ''}"><div class="o-row"><h4>${api.shop.cart(t.ico)}${t.name}</h4>${pips}</div><p class="mg02-fx">${now && !top ? `<span class="mg02-was">${now}</span><i>›</i>` : ''}<b>${top ? now : after}</b></p><small class="mg02-unit">${t.unit}</small>${top ? '' : `<div class="o-row mg02-buy">${amt(cost, short ? 'short' : '')}<button type="button" class="o-btn gold o-starbtn" data-mg01="purchase" data-node="${id}" aria-label="Buy ${t.name} level ${next}" ${off ? 'disabled' : ''}>Buy</button></div>`}</div>`;
  }
  /* the next level of each track you can reach, plus the totals you already have as small chips */
  function ideas(m) {
    const supported = valid(m), count = supported ? gamesOf(m).length : 0;
    if (!supported) return '';
    const open = TRACK_IDS.filter(id => { const t = TRACKS[id], lv = supported ? level(m, id) : 0; return lv >= maxLv(t) ? lv > 0 : count >= needAt(t, lv); });
    const buy = id => { const t = TRACKS[id], lv = level(m, id); return lv < maxLv(t) && m.wallet >= costAt(t, lv) && count >= needAt(t, lv) ? 0 : 1; };
    const sorted = open.slice().sort((a, b) => buy(a) - buy(b));
    const have = TRACK_IDS.filter(id => supported && level(m, id)).map(id => `<span class="mg02-chip" title="${TRACKS[id].name}: ${TRACKS[id].unit}">${api.shop.cart(TRACKS[id].ico)}<b>${TRACKS[id].show(valueAt(TRACKS[id], level(m, id)), level(m, id))}</b></span>`).join('');
    return `<section class="mg02-tree" aria-label="Permanent ideas">${have ? `<div class="mg02-have">${have}</div>` : ''}<div class="o-grid">${sorted.map(id => trackCard(id, m, supported)).join('')}</div></section>`;
  }
  const buyable = m => { if (!valid(m) || m.active) return 0; const count = gamesOf(m).length; return TRACK_IDS.filter(id => { const t = TRACKS[id], lv = level(m, id); return lv < maxLv(t) && m.wallet >= costAt(t, lv) && count >= needAt(t, lv); }).length; };
  function commit(next, done = () => {}) {
    if (pending || !valid(next)) return false;
    const expected = saved() === undefined ? null : JSON.stringify(saved());
    const result = api.commitMinigames(expected, next);
    if (!result.ok) {
      pending = { expected, next, done }; notice = 'Could not save this change. Retry to keep it.';
      if (host) frame?.contentWindow.postMessage({ bridge:'mg01', game:host.game, session:host.token, type:'hold' }, location.origin);
      update(); return false;
    }
    notice = ''; done(); update(); api.mark(); return true;
  }
  function retry() {
    if (!pending) return;
    const p = pending, result = api.commitMinigames(p.expected, p.next);
    if (!result.ok) { notice = 'Still could not save. Your result is waiting for Retry.'; update(); return; }
    pending = null; notice = ''; p.done(); update(); api.mark();
  }
  /* a break interrupted by a closed tab is paid out for the score it had reached */
  function stale(m) { return m.active && !host; }
  function settleStale() {
    const m = saved(); if (!api || pending || !valid(m) || !stale(m)) return;
    const a = m.active, next = copy(m), score = a.score ?? 0, g = a.game, mode = a.mode || GAMES[g].modes[0];
    const total = a.score === undefined ? Math.floor(Math.min(60, a.played) * (10 + Math.max(0, gamesOf(m).length - 1)) / 60) : worth(m, g, mode, score);
    next.wallet += total; next.settled = a.id; next.active = null;
    if (score > 0) { next.best = { ...(m.best || {}), [bestKey(g, mode)]:Math.max(score, m.best?.[bestKey(g, mode)] || 0) }; next.recent = [g, ...(m.recent || []).filter(x => x !== g)].slice(0, 2); }
    commit(next, () => { if (total) { notice = `Banked ${fmt(total)} Inspiration from your last break.`; window.Juice?.fly('insp', [innerWidth / 2, innerHeight / 2], Math.min(12, Math.max(3, Math.ceil(Math.log10(total + 1) * 3)))); } });
  }
  function ensure() {
    if (saved() === undefined) return commit(fresh());
    if (!valid(saved())) { notice = 'This Break Room save is unsupported. It has been kept unchanged.'; return false; }
    settleStale();
    if (pending) return false;
    const m = copy(saved()); refill(m);
    return JSON.stringify(m) === JSON.stringify(saved()) || commit(m);
  }
  function render(_, pane) {
    const m = saved(), ok = valid(m), mine = ok ? gamesOf(m) : [], when = api.clock.wallNow();
    const wait = ok && m.attempts < capacity(m) ? Math.ceil(Math.max(0, m.refillAt + refillMs(m) - when) / 60000) : 0;
    const head = ok ? `<div class="mg-head"><div class="mg-wallet">${amt(m.wallet < 1e7 ? m.wallet.toLocaleString('en-US') : m.wallet, 'big')}</div><div class="mg-breaks" title="Rewarded breaks. One comes back every ${Math.round(refillMs(m) / 60000)} minutes.">${attemptPips(m)}${wait ? `<small>${wait >= 60 ? Math.floor(wait / 60) + 'h ' + (wait % 60) + 'm' : wait + 'm'}</small>` : ''}</div></div>` : '';
    const noBreaks = ok && !m.attempts, n = ok ? buyable(m) : 0;
    const tabs = api.subTabs('breakroom', [['games', 'Games'], ['ideas', 'Ideas', n || '']]);
    const cards = mine.map(id => {
      const g = GAMES[id], mode = g.modes[0], best = ok ? Math.max(0, ...g.modes.map(k => m.best?.[bestKey(id, k)] || 0)) : 0, fresh = ok && isFresh(m, id);
      return `<div class="o-card mg-game"><div class="o-row"><h3>${api.shop.cart(g.ico)}${g.name}</h3>${amt('+' + fmt(parWorth(m, id, mode)))}</div><div class="o-row mg-meta">${best ? `<span class="mg-best" title="Best score">★ ${best.toLocaleString('en-US')}</span>` : '<span class="mg-best dim">Not played yet</span>'}${fresh ? '<span class="mg-fresh" title="Fresh: not one of your last two breaks. +25% Inspiration">FRESH +25%</span>' : ''}</div><div class="mg01-actions"><button type="button" class="o-btn gold" data-mg01="rewarded" data-game="${id}" ${noBreaks ? 'disabled' : ''}>Play</button><button type="button" class="o-btn" data-mg01="practice" data-game="${id}">Practice</button></div></div>`;
    }).join('');
    const body = (api.sub('breakroom') || 'games') === 'ideas' ? ideas(m) : `<div class="o-grid">${cards}</div>`;
    api.morph(pane, `<div class="mg01-choices">${tabs}${head}${body}${notice ? `<p role="status" class="o-warn">${notice}</p>` : ''}${pending ? '<button type="button" class="o-btn gold" data-mg01="retry">Retry save</button>' : ''}</div>`);
    api.hydrate(pane);
  }
  /* the Shop's Break Room games: one at a time, each after the one before it */
  function renderStore(slot) {
    const m = saved(), ok = valid(m), mine = ok ? gamesOf(m) : [], next = ORDER.find(id => !mine.includes(id)), have = IMI.bananas.get();
    const card = id => {
      const g = GAMES[id], cost = Economy.cash(g.cost), prev = ORDER[ORDER.indexOf(id) - 1];
      const lock = !ok ? 'Finish the introduction first' : m.active ? 'Finish your break first' : overlay ? 'Close the game first' : id !== next ? `Buy ${GAMES[prev].name} first` : '';
      return `<div class="o-card"><div class="o-row"><h3>${api.shop.cart(g.ico)}${g.name}</h3>${api.shop.price(cost)}</div><p>${g.blurb}</p><div class="o-row"><span class="mg-bonus">${gem()}<b>+${fmt(g.pay)}</b> at par</span><span class="o-lvl">${mine.length}/${ORDER.length}</span></div>${lock ? `<p class="o-warn">${lock}</p>` : ''}<button type="button" class="o-btn gold" data-mg01="buygame" data-game="${id}" ${lock || have < cost || pending ? 'disabled' : ''}>Buy</button></div>`;
    };
    api.morph(slot, `${notice && !overlay ? `<p role="status" class="o-warn">${notice}</p>` : ''}${next ? `<div class="o-grid">${card(next)}</div>` : ''}${pending ? '<button type="button" class="o-btn gold" data-mg01="retry">Retry save</button>' : ''}`);
    api.hydrate(slot);
  }
  function buyGame(id) {
    const g = GAMES[id], m = saved();
    if (overlay || pending || !g || !valid(m) || m.active) return;
    const mine = gamesOf(m), cost = Economy.cash(g.cost);
    if (mine.includes(id) || ORDER.find(x => !mine.includes(x)) !== id || IMI.bananas.get() < cost) return;
    const next = copy(m); refill(next); next.games = [...mine, id];
    commit(next, () => { if (!IMI.bananas.spend(cost)) notice = 'The purchase saved but the bananas could not be taken. Please reload.'; else { IMI.sfx.ding(); notice = ''; } });
  }
  /* ---------- the game, inside the main panel ---------- */
  const SVG = {
    pause:'<svg viewBox="0 0 16 16"><path d="M4 2h3v12H4zM9 2h3v12H9z"/></svg>', play:'<svg viewBox="0 0 16 16"><path d="M4 2l10 6-10 6z"/></svg>',
    on:'<svg viewBox="0 0 16 16"><path d="M2 6h3l4-3v10l-4-3H2z"/><path d="M11 5q2 3 0 6M13 3q4 5 0 10" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
    off:'<svg viewBox="0 0 16 16"><path d="M2 6h3l4-3v10l-4-3H2z"/><path d="M11 6l4 4M15 6l-4 4" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
    out:'<svg viewBox="0 0 16 16"><path d="M9 2L3 8l6 6V10h4V6H9z"/></svg>'
  };
  const parPos = r => r <= 0 ? 0 : r < 1 ? r * 50 : r < 2 ? 50 + (r - 1) * 25 : r < 4 ? 75 + (r - 2) * 12.5 : 100;
  function launch(game, rewarded) {
    if (overlay || pending || !ensure() || !GAMES[game]) return;
    const m = saved();
    if (!gamesOf(m).includes(game)) { notice = 'Buy this game in the Shop first.'; api.mark(); return; }
    if (rewarded && !m.attempts) { notice = 'No rewarded breaks left. Practice is always free.'; api.mark(); return; }
    const g = GAMES[game], played = Math.max(0, ...g.modes.map(k => m.best?.[bestKey(game, k)] || 0)) > 0;
    host = { game, token:++launchSeq, rewarded, run:null, mode:g.modes[0], phase:'title', input:false, elapsed:0, receipt:playNow(), sequence:0, score:0, played:0, checkpoint:0, last:null };
    try { soundOn = JSON.parse(localStorage.getItem('mg:sound') ?? 'true') !== false; } catch { soundOn = true; }
    returnFocus = document.activeElement;
    overlay = document.createElement('div'); overlay.className = 'mg01-overlay'; overlay.dataset.game = game;
    overlay.innerHTML = `<div class="mg01-layout"><div class="mg01-well"><iframe class="mg01-frame" title="${g.name} game" allow="fullscreen"></iframe></div>
      <aside class="o-card mg01-run" aria-label="Break controls">
        <h2 class="mg01-name">${api.shop.cart(g.ico)}<span>${g.name}</span></h2>
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
    frame.src = `minigames/${g.page}.html?hosted=mg01&game=${game}&session=${host.token}&skip=${played ? 1 : 0}&bests=${encodeURIComponent(JSON.stringify(Object.fromEntries(g.modes.map(k => [k, m.best?.[bestKey(game, k)] || 0]))))}&low=${IMI.fx?.low ? 1 : 0}&reduce=${IMI.reduceMotion ? 1 : 0}`;
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
  /* bank the run in progress (or just ended): its Inspiration, its best score, and the games it keeps fresh */
  function bank(returning = false, final) {
    if (pending) return;
    const m = saved(), a = m?.active;
    if (!valid(m) || !a || host && host.run?.id !== a.id) { if (returning) close(); return; }
    const next = copy(m), score = Math.max(0, Math.floor(final ?? host?.score ?? a.score ?? 0)), played = host ? host.played : a.played, mode = a.mode || GAMES[a.game].modes[0], key = bestKey(a.game, mode);
    next.settled = a.id; next.active = null;
    if (played < 2 && score === 0) { refill(next); next.attempts = Math.min(capacity(next), next.attempts + 1); }              // never played: the break comes back
    const total = worth(m, a.game, mode, score), prev = m.best?.[key] || 0, bonus = prev > 0 && score > prev ? Math.floor(total * NEW_BEST) : 0, best = score > prev;
    next.wallet += total + bonus;
    if (score > 0) { next.recent = [a.game, ...(m.recent || []).filter(x => x !== a.game)].slice(0, 2); }
    if (best) next.best = { ...(m.best || {}), [key]:score };
    commit(next, () => {
      const earned = total + bonus;
      if (host) { host.run = null; host.last = { total:earned, bonus, best, score }; host.score = score; }
      if (earned) window.Juice?.fly('insp', overlay?.querySelector('.mg01-pay') ? IMI.centerOf(overlay.querySelector('.mg01-pay')) : [innerWidth / 2, 60], Math.min(14, Math.max(3, Math.ceil(Math.log10(earned + 1) * 3))));
      if (host && earned) { frame?.contentWindow.postMessage({ bridge:'mg01', game:host.game, session:host.token, type:'reward', total:earned, best:bonus }, location.origin); }
      if (earned && window.Juice?.stamp) {
        const par = GAMES[a.game].par * tuneOf(a.game, mode)[0], r = score / par;
        if (best && prev > 0) window.Juice.stamp(classic() ? 'New best!' : 'NEW BEST!', { tier:2, sub:`+${fmt(earned)}` });
        else if (r >= 2) window.Juice.stamp(classic() ? 'Great run!' : 'GREAT RUN!', { tier:r >= 4 ? 3 : 2, sub:`+${fmt(earned)}` });
      }
      if (returning) close();
    });
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
    q('[data-kind="rewarded"]').disabled = !idle || !!pending || !m.attempts; q('[data-kind="practice"]').disabled = !idle || !!pending;
    q('.mg01-breaks').innerHTML = attemptPips(m) + (isFresh(m, host.game) ? '<span class="mg-fresh">FRESH +25%</span>' : '');
    q('[data-mg01="pause"]').innerHTML = SVG[host.phase === 'pause' ? 'play' : 'pause']; q('[data-mg01="pause"]').setAttribute('aria-label', host.phase === 'pause' ? 'Resume' : 'Pause');
    q('[data-mg01="pause"]').disabled = !(host.phase === 'play' || host.phase === 'pause');
    q('[data-mg01="sound"]').innerHTML = SVG[soundOn ? 'on' : 'off']; q('[data-mg01="sound"]').setAttribute('aria-pressed', String(!soundOn));
    q('[data-mg01="close"]').disabled = !!pending;
    q('.mg01-status').textContent = notice || (!host.rewarded ? 'Practice: no reward' : live ? '' : host.last ? '' : 'Starts a rewarded break');
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
    if (!next.attempts || next.active) { host.rewarded = false; notice = 'No rewarded breaks left. This run is practice.'; update(); toGame('start-ok'); return; }
    if (next.attempts === capacity(next)) next.refillAt = Math.max(next.refillAt, api.clock.wallNow());
    const id = next.nextSession; next.attempts--; next.nextSession++; next.active = { id, game:host.game, mode, played:0, score:0 };
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
    else if (action === 'buygame') buyGame(b.dataset.game);
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
    perk:kind => bonus(kind),
    tab:['breakroom', 'i-game', 'Break Room', 'Play for Inspiration', 'Break', true], visible:a => !!a.state().intro.done && gamesOf(a.state().meta.minigames).length > 0,
    init(_, a) { const first = !api; api = a; if (first) { IMI.on('tab', ({ tab }) => { if (overlay && tab !== 'breakroom') requestLeave(); }); IMI.onScreen(() => { if (overlay && IMI.screen() !== 'game') requestLeave(); }); } },
    render,
    reset() { pending = null; notice = ''; close(); },
    afterRender({ pane } = {}) {
      if (api.state().intro.done && saved() === undefined && !pending) ensure();
      else if (valid(saved()) && stale(saved())) settleStale();
      const slot = pane?.querySelector('[data-minigame-shop]'); if (slot) renderStore(slot);
    }
  };
  (window.__OPS_EXTENSIONS ||= []).push(['minigames', hooks]);
})();
