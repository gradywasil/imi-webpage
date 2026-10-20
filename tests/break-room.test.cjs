const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '..', 'minigame-progression.js'), 'utf8');

/* The Break Room module run against a stub game: no DOM, a fake save with the same commit rules as Ops (the expected text must match). */
function room(minigames, now = 1e12) {
  const S = { intro:{ done:true }, meta:{ minigames } }, clicks = [];
  const api = {
    state:() => S, clock:{ wallNow:() => now }, mark() {}, morph() {}, hydrate() {}, sub:() => 'games', subTabs:() => '',
    shop:{ cart:() => '', ico:() => '', price:n => String(n) },
    commitMinigames(expected, next) {
      if ((S.meta.minigames === undefined ? null : JSON.stringify(S.meta.minigames)) !== expected) return { ok:false };
      S.meta.minigames = JSON.parse(JSON.stringify(next)); return { ok:true };
    }
  };
  const c = { location:{ search:'', origin:'https://game.example' }, URLSearchParams, JSON, Math, Number, Object, Array, Set, Date, performance:{ now:() => 0 }, localStorage:{ getItem:() => null },
    document:{ addEventListener:(type, fn) => { if (type === 'click') clicks.push(fn); }, querySelector:() => null, documentElement:{ dataset:{} } },
    addEventListener() {}, IMI:{ on() {}, onScreen() {}, sfx:{ ding() {} }, bananas:{ get:() => 0, spend:() => true }, centerOf:() => [0, 0] }, Economy:{ cash:n => n } };
  c.window = c; c.window.GameFeatures = { enabled:() => true };
  vm.createContext(c); vm.runInContext(source, c);
  const hooks = c.__OPS_EXTENSIONS.find(([id]) => id === 'minigames')[1];
  hooks.init(null, api);
  const click = dataset => clicks[0]({ target:{ closest:() => ({ dataset }) }, preventDefault() {}, stopPropagation() {} });
  return { S, hooks, click, save:() => S.meta.minigames };
}
const base = (extra = {}) => ({ version:1, wallet:0, fraction:0, games:['barrel', 'shuffle', 'hop'], attempts:6, refillAt:1e12, nextSession:1, active:null, settled:0, ...extra });
const near = (a, b) => assert(Math.abs(a - b) < 1e-9, `${a} is not ${b}`);

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
});

test('buying an idea spends Inspiration, converts old nodes and respects the game requirement', () => {
  const r = room(base({ wallet:200, nodes:['warm-up'] }));
  r.click({ mg01:'purchase', node:'hands' });                               // old Warm-up counts as level 1, so this is level 2: 600, needs 2 games
  assert.equal(r.save().wallet, 200, 'too expensive');
  r.save().wallet = 600; r.S.meta.minigames = JSON.parse(JSON.stringify(r.save()));
  r.click({ mg01:'purchase', node:'hands' });
  assert.deepEqual([r.save().wallet, r.save().lv.hands, r.save().nodes], [0, 2, undefined]);
  const few = room(base({ wallet:1e6, games:['barrel'] }));
  few.click({ mg01:'purchase', node:'keepers' });
  assert.equal(few.save().lv, undefined, 'Fresh eyes needs two games');
});

test('a break interrupted by a closed tab is paid for the score it reached', () => {
  const par = { game:'whack', mode:'main', played:30 };                     // Key Whack: pay 220, par 3,500; Fresh (+25%) because nothing was played lately
  for (const [score, want] of [[3500, 275], [7000, 495], [1750, 123]]) {
    const r = room(base({ games:['barrel', 'shuffle', 'hop', 'whack'], nextSession:2, active:{ id:1, ...par, score } }));
    r.hooks.afterRender();
    const m = r.save();
    assert.equal(m.wallet, want, `score ${score}`);
    assert.deepEqual([m.active, m.settled, m.recent, m.best['whack']], [null, 1, ['whack'], score]);
  }
});

test('a game played in your last two breaks is not Fresh, and Studio notes raise the pay', () => {
  const stale = room(base({ games:['barrel', 'shuffle', 'hop', 'whack'], recent:['whack', 'hop'], nextSession:2, active:{ id:1, game:'whack', mode:'main', played:30, score:3500 } }));
  stale.hooks.afterRender(); assert.equal(stale.save().wallet, 220);
  const boosted = room(base({ games:['barrel', 'shuffle', 'hop', 'whack'], recent:['whack', 'hop'], lv:{ muse:2 }, nextSession:2, active:{ id:1, game:'whack', mode:'main', played:30, score:3500 } }));
  boosted.hooks.afterRender(); assert.equal(boosted.save().wallet, 319);   // 220 x 1.45
});

test('an old break with no score keeps its time-based payout', () => {
  const r = room(base({ nextSession:2, active:{ id:1, game:'barrel', played:60 } }));
  r.hooks.afterRender();
  assert.equal(r.save().wallet, 12);                                          // the old rate: ten a minute, plus one for each game owned beyond the first
});
