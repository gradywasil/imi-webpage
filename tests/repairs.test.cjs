const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm'), path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '..', 'minigame-progression.js'), 'utf8');

/* The repairs module run against a stub game: a fake save with the same commit rules as Ops (the expected text must match), a fake panel and frame,
   and the frame's bridge messages sent straight to the module's message listener. */
function room(minigames, { crew = [[]], printing = 0, written = {}, buffs = {}, sky = { wx:0, night:false }, sel = 0, allowed = true } = {}, now = 1e12) {
  const S = { intro:{ done:true }, printing, written, sel, meta:{ minigames },
    desks:crew.map((c, i) => ({ owned:true, paws:c.length, crew:c.map((t, k) => ({ name:t.name || `M${i}${k}`, look:'v01', hat:0, xp:0, ...t })) })) }, clicks = [], notes = [], posted = [], listeners = {};
  const api = {
    state:() => S, clock:{ wallNow:() => now }, mark() {}, morph() {}, hydrate() {}, sub:() => 'ideas', subTabs:() => '', setTab() {}, setSub() {},
    shop:{ cart:() => '', ico:() => '', price:n => String(n) }, esc:s => String(s), note:t => notes.push(t),
    typist:() => ({ art:'', look:'Look', trait:'', level:1 }), deskInfo:i => ({ name:`Desk${i}`, full:`Desk ${i}`, color:'#fff' }),
    buffLeft:k => buffs[k] || 0, clearBuff:k => { buffs[k] = 0; }, problemsAllowed:() => allowed, sky:() => sky,
    commitMinigames(expected, next, badge) {
      if ((S.meta.minigames === undefined ? null : JSON.stringify(S.meta.minigames)) !== expected) return { ok:false };
      S.meta.minigames = JSON.parse(JSON.stringify(next));
      if (badge) { const t = S.desks[badge.d].crew.find(x => x.name === badge.name); t.bd = { ...(t.bd || {}), [badge.fam]:(t.bd?.[badge.fam] || 0) + badge.xp, at:badge.at }; }
      return { ok:true };
    }
  };
  const frame = { src:'', focus() {}, contentWindow:{ postMessage:m => posted.push(m) } };
  const el = () => { const kids = {}; return { dataset:{}, style:{}, attrs:{}, hidden:false, disabled:false, textContent:'', innerHTML:'', isConnected:true, classList:{ add() {}, remove() {}, toggle() {} },
    setAttribute(k, v) { this.attrs[k] = v; }, focus() {}, remove() { overlays.delete(this); }, appendChild(c) { overlays.add(c); return c; }, querySelector:s => s === 'iframe' ? frame : (kids[s] ||= el()) }; };
  const overlays = new Set(), panel = el();
  const c = { location:{ search:'', origin:'https://game.example' }, URLSearchParams, JSON, Math, Number, Object, Array, Set, Map, WeakMap, Date, String, performance:{ now:() => 0 }, localStorage:{ getItem:() => null },
    innerWidth:800, innerHeight:600, requestAnimationFrame:() => 0, cancelAnimationFrame() {},
    document:{ addEventListener:(type, fn) => { if (type === 'click') clicks.push(fn); }, querySelector:s => s === '#opsRoot .o-panel' ? panel : null, getElementById:() => null, createElement:() => el(), documentElement:{ dataset:{} }, activeElement:null, body:panel },
    addEventListener:(type, fn) => { listeners[type] = fn; }, IMI:{ on() {}, onScreen() {}, ops:{}, sfx:{ ding() {}, tick() {} }, bananas:{ get:() => 0, spend:() => true }, centerOf:() => [0, 0] }, Economy:{ cash:n => n } };
  c.window = c; c.window.GameFeatures = { enabled:() => true };
  vm.createContext(c); vm.runInContext(source, c);
  const hooks = c.__OPS_EXTENSIONS.find(([id]) => id === 'minigames')[1];
  hooks.init(null, api);
  const click = dataset => clicks[0]({ target:{ closest:() => ({ dataset }) }, preventDefault() {}, stopPropagation() {} });
  let seq = 0;
  const url = () => new URL(frame.src, 'https://game.example/');
  /* what the repair page would say, from the frame */
  const say = (type, extra = {}) => { const q = url().searchParams; listeners.message({ origin:'https://game.example', source:frame.contentWindow,
    data:{ bridge:'mg01', game:q.get('game'), session:Number(q.get('session')), sequence:++seq, type, mode:'main', elapsed:seq, score:0, ...extra } }); };
  /* a whole repair: open it from the Floor's Fix it, play it (with real input unless told otherwise) and finish with a grade */
  const repair = (grade, { input = true, finish = true } = {}) => {
    click({ mg01:'fix' }); assert.ok(overlays.size, 'the repair opens over the Floor');
    say('start'); say('phase', { phase:'play' }); if (input) say('input');
    if (finish) say('finish', { reason:'natural', score:Math.round(grade * 1000), grade });
  };
  const done = () => { say('quit', { reason:'done' }); };
  return { S, hooks, click, notes, posted, say, repair, done, url, buffs, overlays, IMI:c.IMI, setSky:k => { sky = k; }, save:() => S.meta.minigames, problem:() => hooks.problem() };
}
const base = (extra = {}) => ({ version:1, wallet:0, fraction:0, pool:{ speed:0, keeper:0, sales:0, luck:0 }, attempts:6, refillAt:1e12, nextSession:1, active:null, settled:0, ...extra });
const near = (a, b, msg) => assert(Math.abs(a - b) < 1e-9, `${a} is not ${b}${msg ? ': ' + msg : ''}`);
const bd = (fam, lv) => ({ bd:{ [fam]:60 * lv * lv } });
const ticks = (r, secs, step = 1) => { for (let k = 0; k < secs; k += step) r.hooks.tick({ gameSeconds:step }); };
const FAMS = ['typing', 'keeper', 'sales', 'luck'];
const pro = () => ({ bd:{ luck:6e6 } });        // a Luck badge no repair outgrows, so typing, keeper and sales factors show only problems and tune-ups

test('old Break Room saves still validate and keep every Idea they bought', () => {
  const old = base({ attempts:15, refillAt:5e11, lv:{ hands:2, keepers:1, room:5, pace:3, muse:1 }, nodes:['warm-up', 'big-break'], who:{ d:0, name:'Bongo' },
    best:{ whack:4100, 'rhythm:hard':5000, 'barrel:bananas':900 }, recent:['whack', 'barrel'], games:['whack', 'plinko', 'vine'], nextSession:9, settled:8 });
  const r = room(old);
  near(r.hooks.automaticTypingBonus(), .35); near(r.hooks.keeperWorkBonus(), .15); near(r.hooks.perk('yield'), .2);
  near(r.hooks.perk('toolbox'), .6, 'Room for play 5 is Toolbox 5'); assert.equal(r.hooks.perk('extra'), 3, 'Quick breaks 3 is Steady hands 3');
  for (const attempts of [0, 6, 7, 20, 999]) assert.ok(room(base({ attempts, lv:{ hands:1 } })).hooks.automaticTypingBonus() > 0, `${attempts} breaks held is still a valid save`);
  assert.equal(room(base({ lv:{ hands:1 }, attempts:1000 })).hooks.automaticTypingBonus(), 0);
  assert.equal(room(base({ lv:{ hands:1 }, attempts:2.5 })).hooks.automaticTypingBonus(), 0);
  const nodesOnly = room(base({ nodes:['warm-up', 'nimble-paws', 'room-for-play'] }));
  near(nodesOnly.hooks.automaticTypingBonus(), .35); near(nodesOnly.hooks.perk('toolbox'), .1);
});

test('an unsupported save grants nothing, and the repair log only takes repair ids', () => {
  assert.equal(room(base({ lv:{ nonsense:2 } })).hooks.automaticTypingBonus(), 0);
  assert.equal(room(base({ lv:{ hands:2.5 } })).hooks.automaticTypingBonus(), 0);
  assert.equal(room(base({ lv:{ room:6 } })).hooks.automaticTypingBonus(), 0, 'Toolbox has five levels, like Room for play');
  assert.equal(room(base({ lv:{ hands:2 }, pool:{ speed:-1, keeper:0, sales:0, luck:0 } })).hooks.automaticTypingBonus(), 0, 'a negative pool');
  assert.equal(room(base({ lv:{ hands:2 }, who:{ d:9, name:'x' } })).hooks.automaticTypingBonus(), 0, 'a typist on a desk that does not exist');
  assert.equal(room(base({ lv:{ hands:2 }, best:{ leak:9 } })).hooks.automaticTypingBonus(), 0, 'bests are only for the old games');
  const ok = room(base({ lv:{ hands:2 }, rep:{ leak:{ n:3, best:88 }, flood:{ n:0, best:0 } } }));
  near(ok.hooks.automaticTypingBonus(), .35);
  for (const rep of [{ whack:{ n:1, best:1 } }, { nope:{ n:1, best:1 } }, { leak:{ n:-1, best:5 } }, { leak:{ n:1, best:101 } }, { leak:{ n:1, best:.5 } }, { leak:null }, []])
    assert.equal(room(base({ lv:{ hands:2 }, rep })).hooks.automaticTypingBonus(), 0, JSON.stringify(rep));
  const active = (a) => room(base({ lv:{ hands:1 }, nextSession:3, settled:1, active:{ id:2, played:0, ...a } })).hooks.automaticTypingBonus();
  assert.ok(active({ game:'rhythm', mode:'hard', score:10 }) > 0, 'an old run'); assert.ok(active({ game:'leak' }) > 0, 'a repair run');
  assert.equal(active({ game:'leak', mode:'hard' }), 0); assert.equal(active({ game:'banana' }), 0);
});

test('an old Break Room run interrupted by a closed tab is paid once on the old scale; an interrupted repair is cleared unpaid', () => {
  for (const [score, want] of [[3500, 225], [7000, 405], [1750, 101]]) {                           // Key Whack at par paid 180 x1.25 Fresh
    const r = room(base({ nextSession:2, active:{ id:1, game:'whack', mode:'main', played:30, score, who:{ d:0, name:'Bongo' } } }), { crew:[[{ name:'Bongo' }]] });
    r.hooks.afterRender(); r.hooks.afterRender();
    const m = r.save();
    assert.equal(m.pool.speed, want, `score ${score}`);
    assert.deepEqual([m.pool.keeper, m.wallet, m.active, m.settled, m.recent, m.best.whack], [0, 0, null, 1, ['whack'], score]);
    assert.ok(r.S.desks[0].crew[0].bd.speed > 0 && r.S.desks[0].crew[0].bd.at === 1, 'and trained the typist');
  }
  const rep = room(base({ nextSession:4, settled:2, active:{ id:3, game:'leak', played:0, who:{ d:0, name:'Bongo' } }, pool:{ speed:5, keeper:6, sales:7, luck:8 } }), { crew:[[{ name:'Bongo' }]] });
  rep.hooks.afterRender();
  assert.deepEqual([rep.save().active, rep.save().settled, rep.save().pool], [null, 3, { speed:5, keeper:6, sales:7, luck:8 }]);
  assert.equal(rep.S.desks[0].crew[0].bd, undefined);
});

test('the Ideas tab opens with the old Break Room rule and makes the save the first time it draws', () => {
  const closed = room(undefined, { written:{ a:1, b:1 } }), open = room(undefined, { written:{ a:1, b:1, c:1 } });
  assert.equal(closed.hooks.visible({ state:() => closed.S }), false);
  assert.equal(open.hooks.visible({ state:() => open.S }), true);
  assert.equal(JSON.stringify(open.hooks.tab), JSON.stringify(['ideas', 'i-insp', 'Ideas', 'Spend Inspiration', 'Ideas']));
  open.hooks.afterRender();
  assert.deepEqual(open.save().pool, { speed:0, keeper:0, sales:0, luck:0 });
  assert.equal(open.save().attempts, 6, 'the old fields are still written, inert');
});

test('Inspiration is paid by family: its own pool first, loose Inspiration next, and any-family ideas take the biggest pools', () => {
  const r = room(base({ pool:{ speed:100, keeper:0, sales:0, luck:0 }, wallet:60 }));
  r.click({ mg01:'purchase', node:'hands' });                                // Warm hands 1 costs 150 Speed: 100 from the pool, 50 from the loose 60
  assert.deepEqual([r.save().pool.speed, r.save().wallet, r.save().lv.hands], [0, 10, 1]);
  const any = room(base({ pool:{ speed:300, keeper:60, sales:0, luck:0 } }));
  any.click({ mg01:'purchase', node:'room' });                               // Toolbox 1 costs 120 of anything
  assert.deepEqual([any.save().pool, any.save().lv.room], [{ speed:180, keeper:60, sales:0, luck:0 }, 1]);
});

test('problems arrive on their own clock: 180 s after unlock, then 270-480 s apart, one at a time; ignored, they expire', () => {
  const r = room(base(), { crew:[[{}, {}], [{}]] });
  ticks(r, 179); assert.equal(r.notes.length, 0, 'none in the first three minutes');
  ticks(r, 2); assert.equal(r.notes.length, 1, 'then one');
  const p = r.problem(); assert.ok(p && p.left > 230, JSON.stringify(p));
  ticks(r, 20); assert.equal(r.notes.length, 1, 'only one at a time');
  ticks(r, 290); assert.notEqual(r.problem()?.id, p.id, 'ignored, it goes away');
  const idle = room(base(), { crew:[[]] }); idle.S.desks[0].paws = 0;
  ticks(idle, 900); assert.equal(idle.notes.length, 0, 'a room with nobody typing has nothing to break');
  const bad = room(base({ lv:{ nonsense:1 } }), { crew:[[{}]] });
  ticks(bad, 900); assert.equal(bad.notes.length, 0, 'no problems without a valid save');
});

test('spawns are weighted and gated by the sky: rain brings leaks, storms floods, nights ravens and fuses; long ones are rare and never twice running', () => {
  const tally = sky => {                                                       // ignored problems expire and the next one comes on the clock
    const r = room(base(), { crew:[[{}], [{}], [{}]], sky }), n = {}, seq = []; let id = 0;
    for (let k = 0; k < 200000 && seq.length < 900; k++) { r.hooks.tick({ gameSeconds:5 }); const p = r.problem(); if (p && p.id !== id) { id = p.id; n[p.kind] = (n[p.kind] || 0) + 1; seq.push(p.kind); } }
    assert.equal(seq.length, 900); return { n, seq };
  };
  const longs = ['flood', 'fuses', 'tangle'], share = (n, ids) => ids.reduce((a, id) => a + (n[id] || 0), 0) / Object.values(n).reduce((a, b) => a + b, 0);
  const clear = tally({ wx:0, night:false });
  assert.equal(clear.n.flood || 0, 0, 'no floods on a clear day'); assert.equal(clear.n.fuses || 0, 0, 'no blown fuses on a clear day');
  assert.equal((clear.n.snack || 0) + (clear.n.critic || 0), 0, 'Spoiled snack and Bad review only come from rotten bananas');
  assert.ok(clear.n.tangle > 0, 'the Great Ribbon Tangle can come any time');
  const longShare = share(clear.n, longs); assert.ok(longShare > .06 && longShare < .16, 'about one in nine is long: ' + longShare);
  for (let k = 1; k < clear.seq.length; k++) assert.ok(!(longs.includes(clear.seq[k]) && longs.includes(clear.seq[k - 1])), 'never two long ones in a row');
  const micro = n => Object.entries(n).filter(([id]) => !longs.includes(id)).reduce((a, [, v]) => a + v, 0);
  const leakDry = (clear.n.leak || 0) / micro(clear.n);
  const rain = tally({ wx:2, night:false }), leakWet = (rain.n.leak || 0) / micro(rain.n);
  assert.ok(leakWet > 2.5 * leakDry, `leaks x4 in the rain: ${leakDry.toFixed(3)} dry, ${leakWet.toFixed(3)} wet`);
  assert.ok(rain.n.flood > 0 && rain.n.fuses > 0, 'heavy rain opens floods and fuses');
  const night = tally({ wx:0, night:true });
  assert.ok(night.n.fuses > 0 && !(night.n.flood > 0), 'a clear night can blow fuses but not flood');
  assert.ok((night.n.raven || 0) / micro(night.n) > 1.5 * (clear.n.raven || 0) / micro(clear.n), 'ravens x2 at night');
});

test('a rotten banana becomes a Floor-wide problem: its 20 s buff is cleared and the penalty hits every machine', () => {
  const r = room(base(), { crew:[[{}], [{}]], buffs:{ sluggish:15 } });
  ticks(r, 1);
  const p = r.problem();
  assert.deepEqual([p.kind, p.scope, p.fam], ['snack', 'global', 'speed']); assert.ok(p.left > 115 && p.left <= 120, 'it lasts two minutes');
  assert.equal(r.buffs.sluggish, 0, 'the buff itself is cleared so it does not hit twice');
  near(r.hooks.deskFactor(0, 'typing'), .75); near(r.hooks.deskFactor(1, 'typing'), .75); near(r.hooks.deskFactor(0, 'sales'), 1);
  const critic = room(base(), { crew:[[{}], [{}]], buffs:{ critic:9 } }); ticks(critic, 1);
  assert.equal(critic.problem().kind, 'critic'); near(critic.hooks.deskFactor(1, 'sales'), .8);
  const off = room(base({ lv:{ nonsense:1 } }), { crew:[[{}]], buffs:{ sluggish:15 } }); ticks(off, 1);
  assert.deepEqual([off.problem(), off.buffs.sluggish], [null, 15], 'with the module inactive the buff behaves as before');
  const busy = room(base(), { crew:[[{}]] }); busy.IMI.ops.spawnProblem('jam'); busy.buffs.critic = 9; ticks(busy, 1);
  assert.deepEqual([busy.problem().kind, busy.buffs.critic], ['jam', 9], 'with a problem already on the Floor the buff runs as a buff');
});

test('Floor-wide problems hit every machine: flood halves every keeper, fuses halve typing, the tangle slows it 40%', () => {
  for (const [kind, stat, f] of [['flood', 'keeper', .5], ['fuses', 'typing', .5], ['tangle', 'typing', .6]]) {
    const r = room(base(), { crew:[[{}], [{}], [{}]] });
    assert.ok(r.IMI.ops.spawnProblem(kind));
    for (const i of [0, 1, 2]) near(r.hooks.deskFactor(i, stat), f, kind);
    assert.ok(r.problem().left > 290, 'long problems last five minutes');
    assert.deepEqual(FAMS.filter(k => k !== stat).map(k => r.hooks.deskFactor(0, k)), [1, 1, 1]);
  }
  const one = room(base(), { crew:[[{}], [{}]] }); one.IMI.ops.spawnProblem('jinx');
  const hit = [0, 1].map(i => one.hooks.deskFactor(i, 'luck'));
  assert.deepEqual(hit.slice().sort(), [0, 1], 'a desk problem hits one machine: ' + hit);
});

test('Fix it opens the problem\'s own repair with the room\'s level, the desk, the fixer\'s costume, a seed and Steady hands', () => {
  const r = room(base({ lv:{ pace:3 } }), { crew:[[], [], [{ name:'Pip', look:'v07', hat:3 }]], printing:2 });       // three machines, only the third typing
  r.IMI.ops.spawnProblem('jam'); r.click({ mg01:'fix' });
  const q = r.url().searchParams;
  assert.equal(r.url().pathname, '/minigames/repair.html');
  assert.deepEqual(['hosted', 'game', 'skip', 'desk', 'look', 'hat', 'extra', 'low', 'reduce'].map(k => q.get(k)), ['mg01', 'jam', '1', '2', 'v07', '3', '3', '0', '0']);
  assert.equal(q.get('level'), '0.42', '(3 machines - 1) / 5 x .55 + 2 Printings x .1');
  assert.ok(Number(q.get('session')) >= 1 && /^\d+$/.test(q.get('seed')));
});

test('pay follows the grade: patched pays a little, fixed more, perfect x1.15, long repairs x3, Studio notes on top; no input or a zero grade pays nothing', () => {
  const pay = (grade, { kind = 'leak', lv, input = true } = {}) => {
    const r = room(base(lv ? { lv } : {}), { crew:[[{ name:'Pip' }]] }); r.IMI.ops.spawnProblem(kind); r.repair(grade, { input });
    const m = r.save(); return { total:Object.values(m.pool).reduce((a, b) => a + b, 0), r, m };
  };
  assert.equal(pay(.6).total, 211, 'one machine pays 230 (225 rounded to tens) x (.5 + .7 x .6)');
  assert.equal(pay(.9).total, 298, '230 x 1.13 x 1.15');
  assert.equal(pay(.2).total, 80, '230 x (.25 + .5 x .2)');
  assert.equal(pay(0).total, 0, 'NOT FIXED pays nothing');
  assert.equal(pay(.9, { input:false }).total, 0, 'a repair nobody touched pays nothing');
  assert.equal(pay(.6, { kind:'flood' }).total, 634, 'long repairs pay x3');
  assert.equal(pay(.6, { lv:{ muse:2 } }).total, 306, 'Studio notes 2: x1.45');
  const leak = pay(.6), flood = pay(.6, { kind:'flood' });
  assert.equal(leak.m.pool.keeper, 211, 'into its family');
  assert.deepEqual([leak.r.S.desks[0].crew[0].bd.keeper, leak.r.S.desks[0].crew[0].bd.at], [115, 1], 'badge xp 100 x .92 x 1.25 rested');
  assert.equal(flood.r.S.desks[0].crew[0].bd.keeper, 288, 'long repairs train x2.5');
  const reward = leak.r.posted.find(m => m.type === 'reward');
  assert.deepEqual([reward.total, reward.label, reward.verdict], [211, 'INSPIRATION', 'FIXED']); assert.match(reward.note, /Desk0 tuned up \+33% for 3:12/);
  assert.deepEqual(leak.m.rep, { leak:{ n:1, best:60 } }, 'the repair log');
  const big = room(base(), { crew:[[{}], [{}], [{}]], printing:1 }); big.IMI.ops.spawnProblem('jam'); big.repair(.6);
  assert.equal(big.save().pool.speed, Math.floor(Math.round(225 * 1.3 * 1.3 * 1.2 / 10) * 10 * .92), 'and grows with machines and Printings');
});

test('one shot: a problem pays once, a second start in the same session is held, and a patched problem can be finished unpaid', () => {
  const r = room(base(), { crew:[[{ name:'Pip' }, { name:'Kiki' }]] });
  r.IMI.ops.spawnProblem('nap'); const left = r.problem().left;
  r.repair(.3);
  const once = JSON.stringify(r.save());
  assert.equal(r.save().pool.keeper, 92, 'patched: 230 x .4');
  const p = r.problem(); assert.ok(p.patched && p.paid && Math.abs(p.left - left / 2) < 1e-9, 'half the time left: ' + JSON.stringify(p));
  const before = r.posted.length; r.say('start');
  assert.equal(r.posted.slice(before).map(m => m.type).join(), 'hold', 'the same session cannot start again');
  r.say('finish', { reason:'natural', score:900, grade:.9 });
  assert.equal(JSON.stringify(r.save()), once, 'and nothing it says pays');
  r.done(); assert.equal(r.overlays.size, 0, 'CONTINUE closes it');
  r.repair(.9);
  assert.equal(r.save().pool.keeper, 92, 'a second repair of the same problem clears it unpaid');
  assert.equal(r.problem(), null);
  assert.equal(r.S.desks[0].crew.filter(t => t.bd).length, 1, 'and trains nobody');
  assert.match(r.posted.filter(m => m.type === 'reward').at(-1).note, /^Already paid/);
  assert.deepEqual(r.save().rep.nap, { n:1, best:90 });
});

test('leaving before the verdict abandons the repair: no pay, the problem stays, and it can be tried again', () => {
  const r = room(base(), { crew:[[{}]] });
  r.IMI.ops.spawnProblem('slump'); r.repair(0, { finish:false });
  assert.ok(r.save().active, 'the run is charged when it starts');
  r.click({ mg01:'close' });
  assert.deepEqual([r.save().active, r.save().pool.sales, r.overlays.size, r.problem().kind], [null, 0, 0, 'slump']);
  r.repair(0); r.done();
  assert.equal(r.problem().kind, 'slump', 'NOT FIXED changes nothing');
  r.repair(.7); assert.equal(r.save().pool.sales, 227, 'and it still pays the first real fix: 230 x .99');
});

test('the fixer is whoever on the desk repaired longest ago, then the least trained in that family', () => {
  const r = room(base({ nextSession:20, settled:19 }), { crew:[[{ name:'A', bd:{ at:9, speed:500 } }, { name:'B', bd:{ at:4, speed:900 } }, { name:'C', bd:{ at:4, speed:100 } }, { name:'D', bd:{ at:12 } }]] });
  const order = [];
  for (let k = 0; k < 4; k++) { r.IMI.ops.spawnProblem('jam'); r.repair(.7); order.push(r.save().who.name); r.done(); }
  assert.deepEqual(order, ['C', 'B', 'A', 'D']);
  const all = room(base(), { crew:[[{ name:'A', bd:{ at:3 } }], [{ name:'B' }]] }); all.IMI.ops.spawnProblem('tangle'); all.repair(.7);
  assert.equal(all.save().who.name, 'B', 'a Floor-wide problem picks from every machine');
});

test('tune-ups replace rather than stack, cover every machine after a Floor-wide fix, and Toolbox makes them stronger and longer', () => {
  const keep = room(base(), { crew:[[pro()]], allowed:false });
  keep.IMI.ops.spawnProblem('leak'); keep.repair(.6); keep.done();
  near(keep.hooks.deskFactor(0, 'keeper'), 1.33, '1 + (.15 + .3 x .6)');
  keep.IMI.ops.spawnProblem('nap'); keep.repair(1); keep.done();
  near(keep.hooks.deskFactor(0, 'keeper'), 1.45, 'the second fix replaced the first (not 1.33 x 1.45)');
  ticks(keep, 239); near(keep.hooks.deskFactor(0, 'keeper'), 1.45); ticks(keep, 2); near(keep.hooks.deskFactor(0, 'keeper'), 1, 'it lasts 120 + 120 x g seconds');
  const all = room(base(), { crew:[[pro()], [pro()], [pro()]] }); all.IMI.ops.spawnProblem('fuses'); all.repair(.85); all.done();
  for (const i of [0, 1, 2]) near(all.hooks.deskFactor(i, 'typing'), 1.405, 'every machine');
  const glob = room(base(), { crew:[[pro()]], buffs:{ critic:5 } }); ticks(glob, 1); glob.repair(1); glob.done();
  assert.equal(JSON.stringify([glob.problem(), FAMS.slice(0, 3).map(k => glob.hooks.deskFactor(0, k))]), JSON.stringify([null, [1, 1, 1]]), 'a rotten banana is cleared with no tune-up');
  const tool = room(base({ lv:{ room:5 } }), { crew:[[pro()]], allowed:false }); tool.IMI.ops.spawnProblem('jam'); tool.repair(.6); tool.done();
  near(tool.hooks.deskFactor(0, 'typing'), 1 + .33 * 1.6, 'Toolbox 5: +60% to the tune-up');
  ticks(tool, 306); assert.ok(tool.hooks.deskFactor(0, 'typing') > 1); ticks(tool, 2); near(tool.hooks.deskFactor(0, 'typing'), 1, 'and to its length: 192 x 1.6 = 307 s');
});

test('badges still pay back on their own machine: levels add, set tiers stack, a full house lifts all four', () => {
  const r = room(base(), { crew:[[bd('speed', 1), bd('speed', 1), bd('speed', 1), {}], [bd('speed', 1)]] });
  near(r.hooks.deskFactor(0, 'typing'), 1 + 3 * .004 + .1); near(r.hooks.deskFactor(0, 'keeper'), 1); near(r.hooks.deskFactor(1, 'typing'), 1 + .004);
  const house = room(base(), { crew:[[bd('speed', 2), bd('keeper', 2), bd('sales', 2), bd('luck', 2)]] });
  near(house.hooks.deskFactor(0, 'luck'), 1 + 2 * .005 + .06);
  const chips = room(base(), { crew:[[{ bd:{ speed:59, keeper:60 } }, {}]] });
  assert.match(chips.hooks.badgeChip(chips.S.desks[0].crew[0]), /Keepers Lv 1/); assert.equal(chips.hooks.badgeChip(chips.S.desks[0].crew[1]), '');
  assert.equal(room(base({ lv:{ nonsense:1 } }), { crew:[[bd('speed', 3)]] }).hooks.deskFactor(0, 'typing'), 1, 'an unsupported save grants nothing');
});

test('a reset (Printing, Imprint) clears the problem and every tune-up', () => {
  const r = room(base(), { crew:[[pro()]] }), three = () => JSON.stringify(FAMS.slice(0, 3).map(k => r.hooks.deskFactor(0, k)));
  r.IMI.ops.spawnProblem('jam'); r.repair(.9); r.done(); r.IMI.ops.spawnProblem('nap');
  assert.equal(three(), JSON.stringify([1.42, .5, 1]), 'tuned-up typing, napping keeper');
  r.hooks.reset({ kind:'printing' });
  assert.deepEqual([r.problem(), three()], [null, '[1,1,1]']);
});

test('Fresh eyes is applied once: keeperPeriod divides only by the desk factor', () => {
  const ops = fs.readFileSync(path.join(__dirname, '..', 'ops.js'), 'utf8'), line = ops.split('\n').find(l => l.includes('const keeperPeriod ='));
  assert.ok(line && !line.includes('keeperWorkBonus') && line.includes("mgDesk(i, 'keeper')"), line);
  assert.match(ops.split('\n').find(l => l.includes('const keeperAt =')), /keeperWorkBonus/);
});
