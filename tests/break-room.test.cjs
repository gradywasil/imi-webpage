const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '..', 'minigame-progression.js'), 'utf8');

/* The Break Room module run against a stub game: no DOM, a fake save with the same commit rules as Ops (the expected text must match). */
function room(minigames, { crew = [[]], printing = 0, written = {}, buffs = {} } = {}, now = 1e12) {
  const S = { intro:{ done:true }, printing, written, meta:{ minigames },
    desks:crew.map((c, i) => ({ owned:true, paws:c.length, crew:c.map((t, k) => ({ name:t.name || `M${i}${k}`, look:'v01', hat:0, xp:0, ...t })) })) }, clicks = [], notes = [];
  const api = {
    state:() => S, clock:{ wallNow:() => now }, mark() {}, morph() {}, hydrate() {}, sub:() => 'games', subTabs:() => '', setTab() {}, setSub() {},
    shop:{ cart:() => '', ico:() => '', price:n => String(n) }, esc:s => String(s), note:t => notes.push(t),
    typist:t => ({ art:'', look:'Look', trait:'', level:1 }), deskInfo:i => ({ name:`Desk${i}`, full:`Desk ${i}`, color:'#fff' }),
    buffLeft:k => buffs[k] || 0, clearBuff:k => { buffs[k] = 0; }, problemsAllowed:() => true,
    commitMinigames(expected, next, badge) {
      if ((S.meta.minigames === undefined ? null : JSON.stringify(S.meta.minigames)) !== expected) return { ok:false };
      S.meta.minigames = JSON.parse(JSON.stringify(next));
      if (badge) { const t = S.desks[badge.d].crew.find(x => x.name === badge.name); t.bd = { ...(t.bd || {}), [badge.fam]:(t.bd?.[badge.fam] || 0) + badge.xp, at:badge.at }; }
      return { ok:true };
    }
  };
  const c = { location:{ search:'', origin:'https://game.example' }, URLSearchParams, JSON, Math, Number, Object, Array, Set, Map, WeakMap, Date, performance:{ now:() => 0 }, localStorage:{ getItem:() => null },
    document:{ addEventListener:(type, fn) => { if (type === 'click') clicks.push(fn); }, querySelector:() => null, getElementById:() => null, documentElement:{ dataset:{} } },
    addEventListener() {}, IMI:{ on() {}, onScreen() {}, sfx:{ ding() {}, tick() {} }, bananas:{ get:() => 0, spend:() => true }, centerOf:() => [0, 0] }, Economy:{ cash:n => n } };
  c.window = c; c.window.GameFeatures = { enabled:() => true };
  vm.createContext(c); vm.runInContext(source, c);
  const hooks = c.__OPS_EXTENSIONS.find(([id]) => id === 'minigames')[1];
  hooks.init(null, api);
  const click = dataset => clicks[0]({ target:{ closest:() => ({ dataset }) }, preventDefault() {}, stopPropagation() {} });
  return { S, hooks, click, notes, save:() => S.meta.minigames, reload:m => { S.meta.minigames = JSON.parse(JSON.stringify(m)); } };
}
const base = (extra = {}) => ({ version:1, wallet:0, fraction:0, pool:{ speed:0, keeper:0, sales:0, luck:0 }, attempts:6, refillAt:1e12, nextSession:1, active:null, settled:0, ...extra });
const near = (a, b) => assert(Math.abs(a - b) < 1e-9, `${a} is not ${b}`);
const bd = (fam, lv) => ({ bd:{ [fam]:60 * lv * lv } });
const ticks = (r, secs) => { for (let k = 0; k < secs; k++) r.hooks.tick({ gameSeconds:1 }); };

test('each track level feeds the hook the game already reads', () => {
  const r = room(base({ lv:{ hands:3, keepers:2, sales:1, flash:2, luck:1, room:2, pace:1, muse:2 }, attempts:10 }));
  near(r.hooks.automaticTypingBonus(), .7); near(r.hooks.keeperWorkBonus(), .35); near(r.hooks.titleSaleBonus(), .1);
  near(r.hooks.perk('flashFreq'), .6); assert.equal(r.hooks.perk('flashSecs'), 8); near(r.hooks.perk('luck'), .2); near(r.hooks.perk('yield'), .45);
});

test('a track with a tail keeps growing past its listed levels', () => {
  const r = room(base({ lv:{ hands:7 } }));
  near(r.hooks.automaticTypingBonus(), 2.3 + 2);
});

test('the first Break Room ideas map onto the new levels', () => {
  const r = room(base({ nodes:['warm-up', 'nimble-paws', 'big-break'] }));
  near(r.hooks.automaticTypingBonus(), .35); near(r.hooks.perk('yield'), .2);
});

test('an unsupported save grants nothing', () => {
  assert.equal(room(base({ lv:{ nonsense:2 } })).hooks.automaticTypingBonus(), 0);
  assert.equal(room(base({ lv:{ hands:2.5 } })).hooks.automaticTypingBonus(), 0);
  assert.equal(room(base({ attempts:7 })).hooks.automaticTypingBonus(), 0, 'seven breaks need Room for play');
  assert.equal(room(base({ lv:{ hands:2 }, pool:{ speed:-1, keeper:0, sales:0, luck:0 } })).hooks.automaticTypingBonus(), 0, 'a negative pool');
  assert.equal(room(base({ lv:{ hands:2 }, who:{ d:9, name:'x' } })).hooks.automaticTypingBonus(), 0, 'a typist on a desk that does not exist');
});

test('every game is open from the start and the Break Room opens after three titles', () => {
  const closed = room(undefined, { written:{ a:1, b:1 } }), open = room(undefined, { written:{ a:1, b:1, c:1 } });
  assert.equal(closed.hooks.visible({ state:() => closed.S }), false);
  assert.equal(open.hooks.visible({ state:() => open.S }), true);
  open.hooks.afterRender();
  assert.deepEqual(open.save().pool, { speed:0, keeper:0, sales:0, luck:0 });
  assert.equal(open.save().games, undefined, 'there is no list of owned games any more');
});

test('Inspiration is paid by family: its own pool first, loose Inspiration next, and any-family ideas take the biggest pools', () => {
  const r = room(base({ pool:{ speed:100, keeper:0, sales:0, luck:0 }, wallet:60 }));
  r.click({ mg01:'purchase', node:'hands' });                                // Warm hands 1 costs 150 Speed: 100 from the pool, 50 from the loose 60
  assert.deepEqual([r.save().pool.speed, r.save().wallet, r.save().lv.hands], [0, 10, 1]);
  r.click({ mg01:'purchase', node:'keepers' });                              // 170 Keepers: the Keepers pool is empty and 10 loose is not enough
  assert.equal(r.save().lv.keepers, undefined);
  const any = room(base({ pool:{ speed:300, keeper:60, sales:0, luck:0 } }));
  any.click({ mg01:'purchase', node:'room' });                               // Room for play 1 costs 120 of anything
  assert.deepEqual(any.save().pool, { speed:180, keeper:60, sales:0, luck:0 });
  assert.equal(any.save().lv.room, 1);
  const poor = room(base({ pool:{ speed:50, keeper:50, sales:0, luck:0 } }));
  poor.click({ mg01:'purchase', node:'room' }); assert.equal(poor.save().lv, undefined, '100 is not 120');
});

test('a break interrupted by a closed tab is paid into its family for the score it reached, and trains the typist', () => {
  const par = { game:'whack', mode:'main', played:30 };                     // Key Whack is a Speed game: a par run pays 180, x1.25 Fresh
  for (const [score, want] of [[3500, 225], [7000, 405], [1750, 101]]) {
    const r = room(base({ nextSession:2, active:{ id:1, ...par, score, who:{ d:0, name:'Bongo' } } }), { crew:[[{ name:'Bongo' }]] });
    r.hooks.afterRender();
    const m = r.save();
    assert.equal(m.pool.speed, want, `score ${score}`);
    assert.deepEqual([m.pool.keeper, m.wallet, m.active, m.settled, m.recent, m.best['whack']], [0, 0, null, 1, ['whack'], score]);
    const t = r.S.desks[0].crew[0];
    assert.equal(t.bd.at, 1); assert.ok(t.bd.speed > 0, 'the typist earned Speed badge xp');
  }
});

test('pay grows with the machines and Printings you have, and is the same in every game', () => {
  const run = (game, desks, printing) => { const r = room(base({ nextSession:2, active:{ id:1, game, mode:game === 'barrel' ? 'bananas' : 'main', played:30, score:{ whack:3500, plinko:1200, barrel:1500 }[game] } }), { crew:Array.from({ length:desks }, () => []), printing }); r.hooks.afterRender(); return Object.values(r.save().pool).reduce((a, b) => a + b, 0); };
  assert.equal(run('whack', 1, 0), 225); assert.equal(run('plinko', 1, 0), 225); assert.equal(run('barrel', 1, 0), 225);
  assert.equal(run('whack', 3, 0), 375);                                    // 180 x 1.3^2 = 304 (rounded to 300) x 1.25
  assert.equal(run('whack', 1, 4), 462);                                    // 180 x 1.2^4 = 373.2 (rounded to 370) x 1.25 = 462.5
});

test('a game played in your last two breaks is not Fresh, and Studio notes raise the pay', () => {
  const stale = room(base({ recent:['whack', 'hop'], nextSession:2, active:{ id:1, game:'whack', mode:'main', played:30, score:3500 } }));
  stale.hooks.afterRender(); assert.equal(stale.save().pool.speed, 180);
  const boosted = room(base({ recent:['whack', 'hop'], lv:{ muse:2 }, nextSession:2, active:{ id:1, game:'whack', mode:'main', played:30, score:3500 } }));
  boosted.hooks.afterRender(); assert.equal(boosted.save().pool.speed, 261);   // 180 x 1.45
});

test('a typist badge is the family they trained most, and its level has no end', () => {
  const r = room(base(), { crew:[[{ bd:{ speed:59, keeper:60 } }, { bd:{ speed:60, luck:240 } }, { bd:{ speed:6e6 } }, {}]] });
  const chips = r.S.desks[0].crew.map(t => r.hooks.badgeChip(t));
  assert.match(chips[0], /Keepers Lv 1/); assert.match(chips[1], /Luck Lv 2/); assert.match(chips[2], /Speed Lv 316/); assert.equal(chips[3], '');
});

test('badges pay back on their own machine: levels add, set tiers stack, a full house lifts all four, and other machines are untouched', () => {
  const crew = [[bd('speed', 1), bd('speed', 1), bd('speed', 1), {}], [bd('speed', 1)]];
  const r = room(base(), { crew });
  near(r.hooks.deskFactor(0, 'typing'), 1 + 3 * .004 + .1);                  // three level-1 Speed badges: 3 x 0.4% and the 3-typist set
  near(r.hooks.deskFactor(0, 'keeper'), 1); near(r.hooks.deskFactor(1, 'typing'), 1 + .004);
  const house = room(base(), { crew:[[bd('speed', 2), bd('keeper', 2), bd('sales', 2), bd('luck', 2)]] });
  near(house.hooks.deskFactor(0, 'typing'), 1 + 2 * .004 + .06); near(house.hooks.deskFactor(0, 'keeper'), 1 + 2 * .005 + .06);
  near(house.hooks.deskFactor(0, 'sales'), 1 + 2 * .003 + .06); near(house.hooks.deskFactor(0, 'luck'), 1 + 2 * .005 + .06);
  const big = room(base(), { crew:[Array.from({ length:24 }, () => bd('keeper', 1))] });
  near(big.hooks.deskFactor(0, 'keeper'), 1 + 24 * .005 + 1.5);              // the 24-typist tier
  const sales = room(base(), { crew:[Array.from({ length:12 }, () => bd('sales', 1))] });
  near(sales.hooks.deskFactor(0, 'sales'), 1 + 12 * .003 + .6 * .6);         // Sales tiers hit at 0.6
  assert.equal(room(base({ lv:{ nonsense:1 } }), { crew }).hooks.deskFactor(0, 'typing'), 1, 'an unsupported save grants nothing');
});

test('floor problems arrive on their own clock, slow one machine, and expire', () => {
  const r = room(base(), { crew:[[{}, {}], [{}]] });
  ticks(r, 239); assert.equal(r.notes.length, 0, 'none in the first four minutes');
  ticks(r, 2); assert.equal(r.notes.length, 1, 'then one');
  const factors = ['typing', 'keeper', 'sales', 'luck'].flatMap(k => [0, 1].map(i => r.hooks.deskFactor(i, k)));
  assert.equal(factors.filter(f => f < 1).length, 1, 'exactly one machine and one stat is hit: ' + factors);
  ticks(r, 20); assert.equal(r.notes.length, 1, 'only one at a time');
  ticks(r, 240); assert.deepEqual(['typing', 'keeper', 'sales', 'luck'].flatMap(k => [0, 1].map(i => r.hooks.deskFactor(i, k))).filter(f => f < 1), [], 'ignored, it goes away');
});

test('a room with nobody typing has nothing to break, and a reset clears a problem and every tune-up', () => {
  const idle = room(base(), { crew:[[]] });
  idle.S.desks[0].paws = 0;
  ticks(idle, 600); assert.equal(idle.notes.length, 0, 'no machine to break');
  const r = room(base(), { crew:[[{}]] });
  ticks(r, 400); assert.equal(r.notes.length, 1);
  assert.ok(['typing', 'keeper', 'sales', 'luck'].some(k => r.hooks.deskFactor(0, k) < 1));
  r.hooks.reset({ kind:'printing' });
  assert.deepEqual(['typing', 'keeper', 'sales', 'luck'].map(k => r.hooks.deskFactor(0, k)), [1, 1, 1, 1]);
});

test('problems and badges leave the unsupported-save guard in charge', () => {
  const r = room(base({ lv:{ nonsense:1 } }), { crew:[[{}]] });
  ticks(r, 600); assert.equal(r.notes.length, 0, 'no problems without a valid Break Room save');
});
