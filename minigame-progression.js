/* The Break Room: games are bought one at a time in the Shop, and playing them earns Inspiration for permanent factory ideas.
   Current Ops state is the sole durable authority. */
(() => {
  'use strict';
  if (!(window.GameFeatures?.enabled('mg01') ?? new URLSearchParams(location.search).get('mg01') === '1')) return;
  /* In shop order: each game is bought after the one before it. Prices are bananas before the global cash scale. */
  const GAMES = {
    barrel:  { page:'barrel-catch',     name:'Banana Barrel',     cost:5e3,   modes:['bananas','fruit'], ico:'i-palm',    blurb:'Catch falling bananas in a barrel and dodge the coconuts.' },
    shuffle: { page:'coconut-shuffle',  name:'Coconut Shuffle',   cost:12e3,  modes:['main'],            ico:'i-coconut', blurb:'Follow the shells and pick the one hiding the banana.' },
    hop:     { page:'road-hop',         name:'Road Hop',          cost:30e3,  modes:['main'],            ico:'i-monkey',  blurb:'Cross busy city roads, grab fruit, outrun the garbage truck.' },
    whack:   { page:'key-whack',        name:'Key Whack',         cost:60e3,  modes:['main'],            ico:'i-type',    blurb:'Hit the typewriter keys as they light up. Avoid the ink blots.' },
    stall:   { page:'fruit-stall',      name:'Fruit Stall',       cost:120e3, modes:['main'],            ico:'banana',    blurb:'Serve customers their fruit orders before they lose patience.' },
    vine:    { page:'vine-swing',       name:'Vine Swing',        cost:250e3, modes:['main'],            ico:'leaf',      blurb:'One button: grab, swing, release and catch the next vine.' },
    dash:    { page:'peel-dash',        name:'Peel Dash',         cost:500e3, modes:['main'],            ico:'i-log',     blurb:'Sprint down a three-lane jungle path. Jump logs, dodge rocks.' },
    stack:   { page:'banana-stack',     name:'Banana Stack',      cost:1e6,   modes:['main'],            ico:'i-log',     blurb:'Drop swinging crates and build the tallest tower.' },
    slice:   { page:'banana-slice',     name:'Banana Slice',      cost:2e6,   modes:['main'],            ico:'banana',    blurb:'Slice tossed bananas with a swipe. Spare the coconuts.' },
    rhythm:  { page:'typewriter-rhythm', name:'Typewriter Rhythm', cost:4e6,  modes:['easy','normal','hard'], ico:'i-reel', blurb:'Four lanes of falling keys to a jungle beat.' },
    tidy:    { page:'library-tidy',     name:'Library Tidy',      cost:6e6,   modes:['main'],            ico:'i-works',   blurb:'Real titles fall fast: tap the shelf each one belongs on.' },
    bowling: { page:'coconut-bowling',  name:'Coconut Bowling',   cost:8e6,   modes:['main'],            ico:'i-coconut', blurb:'A full ten-frame game. Slide, aim and throw.' },
    packer:  { page:'crate-packer',     name:'Crate Packer',      cost:16e6,  modes:['main'],            ico:'i-log',     blurb:'Rotate and pack banana crates into the truck bay.' },
    heist:   { page:'banana-heist',     name:'Banana Heist',      cost:32e6,  modes:['main'],            ico:'i-monkey',  blurb:'Creep past the guards, grab the bunch, slip back out.' },
    plinko:  { page:'banana-plinko',    name:'Banana Plinko',     cost:64e6,  modes:['main'],            ico:'banana',    blurb:'Drop a spinning banana through a board of pegs.' }
  };
  const ORDER = Object.keys(GAMES);
  const REFILL = 2 * 60 * 60 * 1000;
  const BASE_YIELD = 10;                         // Inspiration for a full first minute of a rewarded break; every extra game owned adds one
  const NODES = {
    'warm-up': { name:'Warm-up', cost:10, effect:'+2% automatic typing' },
    'nimble-paws': { name:'Nimble paws', cost:40, effect:'+3% automatic typing' },
    'fresh-eyes': { name:'Fresh eyes', cost:40, effect:'+3% keeper work rate' },
    'good-stories': { name:'Good stories', cost:40, effect:'+3% title sale income' },
    'room-for-play': { name:'Room for play', cost:60, effect:'8 attempt capacity; same refill pace' },
    'steady-hands': { name:'Steady hands', cost:100, games:4, effect:'+4% automatic typing' },
    'quick-keepers': { name:'Quick keepers', cost:100, games:5, effect:'+4% keeper work rate' },
    'bestsellers': { name:'Bestsellers', cost:140, games:6, effect:'+4% title sale income' },
    'big-break': { name:'Big break', cost:200, games:8, effect:'+25% Inspiration from every break' }
  };
  const owned = (m, id) => Array.isArray(m?.nodes) && m.nodes.includes(id);
  /* saves from before the shop that already played the Break Room keep the two original games */
  const gamesOf = m => Array.isArray(m?.games) ? m.games : (m && (m.nextSession > 1 || m.wallet > 0) ? ['barrel', 'shuffle'] : []);
  const yieldPer = m => { const n = gamesOf(m).length; return (BASE_YIELD + Math.max(0, n - 1)) * (owned(m, 'big-break') ? 1.25 : 1); };
  const capacity = m => owned(m, 'room-for-play') ? 8 : 6;
  // A caller-owned developer fixture can supply only the dedicated played-time clock.
  const playNow = window.__MG01_CLOCK || (() => performance.now());
  let api, overlay, frame, host, pending, notice = '', returnFocus, inert = [], practiceID = 0;
  const copy = value => JSON.parse(JSON.stringify(value));
  const saved = () => api.state().meta.minigames;
  const bounded = (n, max) => Number.isFinite(n) && n >= 0 && n <= max;
  function valid(m) {
    return m && m.version === 1 && Number.isSafeInteger(m.wallet) && m.wallet >= 0 && bounded(m.fraction, 1) && m.fraction < 1 &&
      (m.nodes === undefined || Array.isArray(m.nodes) && m.nodes.every(id => Object.hasOwn(NODES, id)) && new Set(m.nodes).size === m.nodes.length && (m.nodes.every(id => id === 'warm-up') || owned(m, 'warm-up'))) &&
      (m.games === undefined || Array.isArray(m.games) && m.games.every(id => Object.hasOwn(GAMES, id)) && new Set(m.games).size === m.games.length) &&
      Number.isInteger(m.attempts) && bounded(m.attempts, capacity(m)) && bounded(m.refillAt, Number.MAX_SAFE_INTEGER) &&
      Number.isSafeInteger(m.nextSession) && m.nextSession > 0 && Number.isSafeInteger(m.settled) && m.settled >= 0 && m.settled < m.nextSession &&
      (m.active === null || (gamesOf(m).includes(m.active?.game) && Number.isSafeInteger(m.active.id) && m.active.id > m.settled && m.active.id < m.nextSession && bounded(m.active.played, 180)));
  }
  function fresh() { return { version:1, wallet:0, fraction:0, games:[], attempts:6, refillAt:api.clock.wallNow(), nextSession:1, active:null, settled:0 }; }
  function refill(m) {
    const now = api.clock.wallNow(), cap = capacity(m);
    if (m.attempts === cap) { m.refillAt = Math.max(m.refillAt, now); return; }
    const n = Math.min(cap - m.attempts, Math.floor(Math.max(0, now - m.refillAt) / REFILL));
    m.attempts += n; m.refillAt = m.attempts === cap ? Math.max(m.refillAt, now) : m.refillAt + n * REFILL;
  }
  function purchase(id) {
    if (overlay || pending || !valid(saved())) return;
    const m = saved(), node = NODES[id];
    if (!node || m.active || owned(m, id) || id !== 'warm-up' && !owned(m, 'warm-up') || m.wallet < node.cost || gamesOf(m).length < (node.games || 0)) return;
    const next = copy(m); refill(next);
    next.wallet -= node.cost; next.nodes = [...(next.nodes || []), id];
    commit(next);
  }
  function contribution(family) {
    const m = api && saved(); if (!valid(m)) return 0;
    if (family === 'typing') return (owned(m, 'warm-up') ? .02 : 0) + (owned(m, 'nimble-paws') ? .03 : 0) + (owned(m, 'steady-hands') ? .04 : 0);
    if (family === 'keeper') return (owned(m, 'fresh-eyes') ? .03 : 0) + (owned(m, 'quick-keepers') ? .04 : 0);
    return (owned(m, 'good-stories') ? .03 : 0) + (owned(m, 'bestsellers') ? .04 : 0);
  }
  const amt = (n, cls = '') => window.Gems?.amount('insp', n, cls) || String(n);
  const gem = (cls = '') => window.Gems?.html('insp', cls) || '';
  const NODE_ICO = { 'warm-up':'u-fing', 'nimble-paws':'u-rapid', 'fresh-eyes':'s-keeper', 'good-stories':'d-reprints', 'room-for-play':'i-game', 'steady-hands':'u-rapid', 'quick-keepers':'s-keeper', 'bestsellers':'d-reprints', 'big-break':'i-insp' };
  function tree(m) {
    const supported = valid(m), count = supported ? gamesOf(m).length : 0;
    /* only ideas whose games you already own are drawn; the rest appear as you buy more */
    const cards = Object.entries(NODES).filter(([, n]) => count >= (n.games || 0)).map(([id, n]) => {
      const has = supported && owned(m, id), locked = id !== 'warm-up' && !owned(m, 'warm-up'), short = !has && !locked && m.wallet < n.cost;
      const off = !supported || has || locked || m.wallet < n.cost || m.active || overlay || pending;
      return `<div class="o-card mg02-node${has ? ' owned' : ''}${locked && !has ? ' locked' : ''}"><div class="o-row"><h4>${api.shop.cart(NODE_ICO[id] || 'i-insp')}${n.name}</h4>${has ? '<span class="o-lvl">✓</span>' : amt(n.cost, short ? 'short' : '')}</div><p class="mg02-fx"><b>${n.effect.split(' ')[0]}</b> ${n.effect.split(' ').slice(1).join(' ')}</p>${has ? '' : `<button type="button" class="o-btn gold o-starbtn" data-mg01="purchase" data-node="${id}" aria-label="Buy ${n.name}" ${off ? 'disabled' : ''}>${locked ? '🔒' : 'Buy'}</button>`}</div>`;
    }).join('');
    return `<section class="mg02-tree" aria-label="Permanent ideas"><h3 class="o-h">${gem()}Ideas</h3><div class="o-grid">${cards}</div></section>`;
  }
  function commit(next, done = () => {}) {
    if (pending || !valid(next)) return false;
    const expected = saved() === undefined ? null : JSON.stringify(saved());
    const result = api.commitMinigames(expected, next);
    if (!result.ok) {
      pending = { expected, next, done }; notice = 'Could not save this change. Retry to keep it.';
      frame?.contentWindow.postMessage({ bridge:'mg01', game:host.game, session:host.id, type:'hold' }, location.origin);
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
  function ensure() {
    if (saved() === undefined) return commit(fresh());
    if (!valid(saved())) { notice = 'This Break Room save is unsupported. It has been kept unchanged.'; return false; }
    const m = copy(saved()); refill(m);
    return JSON.stringify(m) === JSON.stringify(saved()) || commit(m);
  }
  function summary() {
    const m = saved(); if (!valid(m)) return notice || 'Buy a game in the Shop to begin.';
    return `${m.wallet} Inspiration · ${m.attempts}/${capacity(m)} breaks`;
  }
  const attemptPips = m => `<span class="mg-tk-row" role="img" aria-label="${m.attempts} of ${capacity(m)} rewarded breaks">${Array.from({ length:capacity(m) }, (_, k) => `<span class="mg-tk${k < m.attempts ? ' on' : ''}">${api.shop.ico('i-game', 26)}</span>`).join('')}</span>`;
  function render(_, pane) {
    const m = saved(), ok = valid(m), active = ok && m.active, mine = ok ? gamesOf(m) : [], rate = ok ? yieldPer(m) : BASE_YIELD, rate1 = Number(rate.toFixed(2));
    const wait = ok && m.attempts < capacity(m) ? Math.ceil(Math.max(0, m.refillAt + REFILL - api.clock.wallNow()) / 60000) : 0;
    const head = ok ? `<div class="mg-head"><div class="mg-wallet">${amt(m.wallet, 'big')}</div><div class="mg-breaks" title="Rewarded breaks. One comes back every 2 hours.">${attemptPips(m)}${wait ? `<small>${wait >= 60 ? Math.floor(wait / 60) + 'h ' + (wait % 60) + 'm' : wait + 'm'}</small>` : ''}</div></div>` : '';
    const noBreaks = ok && !m.attempts;
    const resume = active ? `<div class="o-card mg-game mg-resume"><div class="o-row"><h3>${api.shop.cart(GAMES[active.game].ico)}${GAMES[active.game].name}</h3>${amt('+' + Number(((m.fraction + Math.min(60, active.played) * rate / 60)).toFixed(1)))}</div><span class="o-prog mg-meter" role="img" aria-label="${Math.min(60, Math.round(active.played))} of 60 seconds"><i style="width:${Math.min(100, active.played / .6)}%"></i></span><div class="mg01-actions"><button type="button" class="o-btn gold" data-mg01="resume">Resume</button><button type="button" class="o-btn" data-mg01="saved-bank">Bank</button></div></div>` : '';
    const cards = active ? '' : mine.map(id => `<div class="o-card mg-game"><div class="o-row"><h3>${api.shop.cart(GAMES[id].ico)}${GAMES[id].name}</h3>${amt('+' + rate1)}</div><div class="mg01-actions"><button type="button" class="o-btn gold" data-mg01="rewarded" data-game="${id}" ${noBreaks ? 'disabled' : ''}>Play</button><button type="button" class="o-btn" data-mg01="practice" data-game="${id}">Practice</button></div></div>`).join('');
    api.morph(pane, `<div class="mg01-choices">${head}${resume}<div class="o-grid">${cards}</div>${tree(m)}${notice ? `<p role="status" class="o-warn">${notice}</p>` : ''}${pending ? '<button type="button" class="o-btn gold" data-mg01="retry">Retry save</button>' : ''}</div>`);
    api.hydrate(pane);
  }
  /* the Shop's Break Room games: one at a time, each after the one before it */
  function renderStore(slot) {
    const m = saved(), ok = valid(m), mine = ok ? gamesOf(m) : [], next = ORDER.find(id => !mine.includes(id)), have = IMI.bananas.get();
    const card = id => {
      const g = GAMES[id], cost = Economy.cash(g.cost), prev = ORDER[ORDER.indexOf(id) - 1];
      const lock = !ok ? 'Finish the introduction first' : m.active ? 'Bank your saved break first' : overlay ? 'Close the game first' : id !== next ? `Buy ${GAMES[prev].name} first` : '';
      return `<div class="o-card"><div class="o-row"><h3>${api.shop.cart(g.ico)}${g.name}</h3>${api.shop.price(cost)}</div><p>${g.blurb}</p><div class="o-row"><span class="mg-bonus">${gem()}<b>+${mine.length ? 1 : BASE_YIELD}</b> per break</span><span class="o-lvl">${mine.length}/${ORDER.length}</span></div>${lock ? `<p class="o-warn">${lock}</p>` : ''}<button type="button" class="o-btn gold" data-mg01="buygame" data-game="${id}" ${lock || have < cost || pending ? 'disabled' : ''}>Buy</button></div>`;
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
  function launch(game, rewarded, resume = false) {
    if (overlay || pending || !ensure() || !GAMES[game]) return;
    const m = saved();
    if (!gamesOf(m).includes(game)) { notice = 'Buy this game in the Shop first.'; api.mark(); return; }
    if (rewarded && !resume && (m.active || !m.attempts)) { notice = m.active ? 'Resume or bank your saved break first.' : 'No rewarded breaks left. Practice is always free.'; api.mark(); return; }
    const id = resume ? m.active.id : rewarded ? m.nextSession : Math.max(m.nextSession, ++practiceID);
    host = { game, id, rewarded, charged:resume, played:resume ? m.active.played : 0, phase:'title', input:false, elapsed:0, receipt:playNow(), sequence:0, checkpoint:0 };
    returnFocus = document.activeElement;
    overlay = document.createElement('div'); overlay.className = 'mg01-overlay';
    overlay.innerHTML = `<section class="mg01-dialog" role="group" aria-labelledby="mg01-title"><div class="mg01-bar"><button data-mg01="close" class="mg01-back" aria-label="Bank credit and return to the Break Room">‹</button><h2 id="mg01-title">${GAMES[game].name}</h2><span class="mg01-live" aria-live="off">${gem()}<b>0</b></span><span class="o-prog mg01-meter" role="img" aria-label="Inspiration progress"><i></i></span><span class="mg01-status" role="status"></span><button data-mg01="bank" aria-label="Bank credit and keep practising">Bank</button><button data-mg01="retry" hidden>Retry save</button></div><iframe class="mg01-frame" title="${GAMES[game].name} game" allow="fullscreen"></iframe></section>`;
    const stage = document.getElementById('opsRoot') || document.body, wrap = stage.querySelector('.o-wrap');
    inert = wrap ? [[wrap, wrap.inert]] : []; inert.forEach(([el]) => { el.inert = true; });
    stage.appendChild(overlay); frame = overlay.querySelector('iframe');
    frame.src = `minigames/${GAMES[game].page}.html?hosted=mg01&game=${game}&session=${id}&low=${IMI.fx?.low ? 1 : 0}&reduce=${IMI.reduceMotion ? 1 : 0}`;
    update(); frame.focus();
  }
  function close() {
    if (!overlay || pending) return;
    overlay.remove(); overlay = frame = host = null;
    inert.forEach(([el, was]) => { el.inert = was; }); inert = [];
    if (returnFocus?.isConnected) returnFocus.focus(); api.mark();
  }
  function bank(returning = false) {
    if (pending) return;
    const m = saved(), a = m?.active;
    if (!valid(m) || !a || host && (!host.rewarded || host.id !== a.id)) { if (returning) close(); return; }
    const next = copy(m), played = host ? host.played : a.played;
    const earned = next.fraction + Math.min(60, played) * yieldPer(m) / 60, whole = Math.floor(earned + 1e-9);
    next.wallet += whole; next.fraction = Math.max(0, earned - whole); next.settled = a.id; next.active = null;
    commit(next, () => {
      if (whole) { const live = overlay?.querySelector('.mg01-live'); window.Juice?.fly('insp', live ? IMI.centerOf(live) : [innerWidth / 2, 60], Math.min(12, whole)); }
      if (host) { host.rewarded = false; notice = 'Reward banked. You can keep practising for free.'; }
      if (returning) close();
    });
  }
  function requestBank(returning) {
    if (pending) return;
    if (!host?.rewarded || !host.charged) { if (returning) close(); return; }
    frame.contentWindow.postMessage({ bridge:'mg01', game:host.game, session:host.id, type:returning ? 'quit-request' : 'bank-request' }, location.origin);
  }
  function update() {
    if (!overlay) return;
    const m = saved(), r = yieldPer(m), earned = (m.fraction || 0) + Math.min(60, host.played) * r / 60;
    const live = overlay.querySelector('.mg01-live'), meter = overlay.querySelector('.mg01-meter i');
    live.hidden = !host.rewarded; overlay.querySelector('.mg01-meter').hidden = !host.rewarded;
    live.querySelector('b').textContent = '+' + (Math.floor(earned * 10) / 10).toFixed(1);
    meter.style.width = Math.min(100, host.played / .6) + '%';
    overlay.querySelector('.mg01-status').textContent = notice || (host.rewarded ? '' : 'Practice');
    overlay.querySelector('[data-mg01="bank"]').disabled = !!pending || !host.charged || !host.rewarded;
    overlay.querySelector('[data-mg01="bank"]').hidden = !host.rewarded;
    overlay.querySelector('[data-mg01="close"]').disabled = !!pending;
    overlay.querySelector('[data-mg01="retry"]').hidden = !pending;
  }
  function receive(e) {
    const d = e.data;
    if (!host || pending || e.origin !== location.origin || e.source !== frame.contentWindow || d?.bridge !== 'mg01' || d.game !== host.game || d.session !== host.id ||
        !Number.isSafeInteger(d.sequence) || d.sequence <= host.sequence || !GAMES[host.game].modes.includes(d.mode) || !bounded(d.elapsed, 86400) || d.elapsed < host.elapsed ||
        !['start','phase','input','progress','finish','quit','bank'].includes(d.type)) return;
    if (d.type === 'phase' && !['title','count','waiting','play','pause','over'].includes(d.phase)) return;
    if (d.type === 'finish' && (d.reason !== 'natural' || !bounded(d.score, 1e9))) return;
    if (d.type === 'quit' && !['quit','back'].includes(d.reason) || d.type === 'bank' && d.reason !== 'bank') return;
    const now = playNow(), delta = Math.min(d.elapsed - host.elapsed, Math.max(0, (now - host.receipt) / 1000));
    if (host.rewarded && host.charged && host.input && host.phase === 'play' && !document.hidden) host.played = Math.min(180, host.played + delta);
    host.elapsed = d.elapsed; host.receipt = now; host.sequence = d.sequence;
    const send = type => frame?.contentWindow.postMessage({ bridge:'mg01', game:host.game, session:host.id, type }, location.origin);
    if (d.type === 'start') {
      host.input = false;
      if (!host.rewarded || host.charged) send('start-ok');
      else {
        const next = copy(saved()); refill(next); if (!next.attempts || next.active) return;
        if (next.attempts === capacity(next)) next.refillAt = Math.max(next.refillAt, api.clock.wallNow());
        next.attempts--; next.nextSession++; next.active = { id:host.id, game:host.game, played:0 };
        commit(next, () => { host.charged = true; send('start-ok'); });
      }
    } else if (d.type === 'phase') { host.phase = d.phase; if (d.phase !== 'play') host.input = false; }
    else if (d.type === 'input' && host.phase === 'play') host.input = true;
    else if (d.type === 'quit') { bank(true); return; }
    else if (d.type === 'bank') { bank(); return; }
    else if (d.type === 'finish' && host.phase === 'over' && host.played >= 60) { bank(); return; }
    if (host.rewarded && host.charged && (host.played - host.checkpoint >= 1 || host.played === 180 && host.checkpoint < 180)) {
      const next = copy(saved()); if (next.active?.id !== host.id) return;
      next.active.played = host.played;
      commit(next, () => { host.checkpoint = host.played; send('resume'); });
    }
    update();
  }
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-mg01]'); if (!b || !api) return;
    e.preventDefault(); e.stopPropagation();
    const action = b.dataset.mg01;
    if (action === 'retry') retry();
    else if (action === 'close') requestBank(true);
    else if (action === 'bank') requestBank(false);
    else if (action === 'saved-bank') bank();
    else if (action === 'purchase') purchase(b.dataset.node);
    else if (action === 'buygame') buyGame(b.dataset.game);
    else if (action === 'resume') { if (ensure() && saved().active) launch(saved().active.game, true, true); }
    else launch(b.dataset.game, action === 'rewarded');
  });
  addEventListener('keydown', e => {
    if (!overlay) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); requestBank(true); }
  }, true);
  addEventListener('message', receive);
  document.addEventListener('visibilitychange', () => { if (host) { host.receipt = playNow(); host.input = false; } });
  const hooks = {
    automaticTypingBonus:() => contribution('typing'), keeperWorkBonus:() => contribution('keeper'), titleSaleBonus:() => contribution('sale'),
    tab:['breakroom', 'i-game', 'Break Room', 'Play for Inspiration', 'Break', true], visible:a => !!a.state().intro.done && gamesOf(a.state().meta.minigames).length > 0,
    init(_, a) { const first = !api; api = a; if (first) { IMI.on('tab', ({ tab }) => { if (overlay && tab !== 'breakroom') requestBank(true); }); IMI.onScreen(() => { if (overlay && IMI.screen() !== 'game') requestBank(true); }); } }, render,
    reset() { pending = null; notice = ''; close(); },
    afterRender({ pane } = {}) {
      if (api.state().intro.done && saved() === undefined && !pending) ensure();
      const slot = pane?.querySelector('[data-minigame-shop]'); if (slot) renderStore(slot);
    }
  };
  (window.__OPS_EXTENSIONS ||= []).push(['minigames', hooks]);
})();
