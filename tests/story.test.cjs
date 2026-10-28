const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

/* story.js in a bare context: no document, no IMI, so only the pure StoryLogic runs */
function load() {
  const context = {}; context.window = context; context.globalThis = context;
  vm.runInNewContext(readFileSync(path.join(__dirname, '..', 'story.js'), 'utf8'), context);
  return context.StoryLogic;
}
const L = load();
const plain = x => JSON.parse(JSON.stringify(x));   // objects from the vm context have their own prototypes
const snap = (o = {}) => ({ typed: 0, paws: 0, words: 0, sold: 0, owned: 1, printing: 0, divs: { songs: 0, tv: 0, radio: 0, sketch: 0, film: 0 }, muses: [], combo: 0, tab: 'floor', intro: { done: false }, ...o });
const f = o => L.facts(snap(o));
const NOW = 1000;
const env = o => ({ screen: 'game', hidden: false, blocked: false, combo: 0, sinceTap: 1e9, tab: 'floor', waited: 0, prologue: false, ...o });

test('the arc is the 15 scenes in order, with permanent ids', () => {
  assert.deepEqual(plain(L.ARC.map(a => a.id)), ['prologue', 'first-hire', 'first-word', 'first-sale', 'machine-hibiscus', 'machine-lagoon', 'machine-honeycomb', 'machine-orchid', 'machine-moonflower', 'media-records', 'media-tv', 'media-radio', 'media-troupe', 'first-muse', 'second-printing']);
  assert.deepEqual(plain(L.ARC.map(a => a.chapter)), [...Array(15).keys()]);
});

test('a brand new save gets the prologue first, and nothing is marked', () => {
  const st = L.load(null);
  assert.equal(L.boot(st, f(), NOW, false), false);
  assert.deepEqual(plain(st.seen), {});
  assert.equal(L.pending(st, f()), 'prologue');
});

test('an existing save is marked silently up to where it is; only new progress plays', () => {
  const st = L.load(null), F = f({ typed: 900, paws: 4, words: 30, sold: 3, owned: 3, divs: { songs: 2 } });
  assert.equal(L.boot(st, F, NOW, false), true);
  assert.deepEqual(plain(Object.keys(st.seen).sort()), ['first-hire', 'first-sale', 'first-word', 'machine-hibiscus', 'machine-lagoon', 'media-records', 'prologue'].sort());
  assert.equal(L.pending(st, F), null, 'nothing replays');
  const later = f({ typed: 2000, paws: 6, words: 60, sold: 9, owned: 4, divs: { songs: 2, tv: 1 } });
  assert.equal(L.pending(st, later), 'machine-honeycomb', 'genuinely new progress plays, in arc order');
  L.mark(st, 'machine-honeycomb', NOW + 1);
  assert.equal(L.pending(st, later), 'media-tv');
});

test('a save after a Second Printing counts the early chapters as passed even though the run reset', () => {
  const st = L.load(null), F = f({ typed: 50, printing: 1, owned: 1 });
  L.boot(st, F, NOW, false);
  for (const id of ['prologue', 'first-hire', 'first-word', 'first-sale', 'second-printing']) assert.ok(st.seen[id], id);
  assert.equal(st.seen['machine-hibiscus'], undefined);
});

test('a stored state only settles: the prologue is dropped once the player has typed, never played late', () => {
  const st = L.load({ v: 1, seen: {} });
  assert.equal(L.boot(st, f({ typed: 0 }), NOW, true), false);
  assert.equal(L.pending(st, f({ typed: 0 })), 'prologue');
  assert.equal(L.settle(st, f({ typed: 3 }), NOW), true);
  assert.ok(st.seen.prologue);
  assert.equal(L.pending(st, f({ typed: 3 })), null);
  assert.equal(L.pending(st, f({ typed: 30, paws: 1 })), 'first-hire');
});

test('turning auto-play off marks passed scenes for replay and plays nothing', () => {
  const st = L.load({ v: 1, seen: { prologue: 1 }, off: true });
  assert.equal(L.pending(st, f({ typed: 5, paws: 1, words: 1 })), null);
  L.settle(st, f({ typed: 5, paws: 1, words: 1 }), NOW);
  assert.ok(st.seen['first-hire'] && st.seen['first-word']);
  assert.equal(st.seen['first-sale'], undefined);
});

test('load() keeps only known scene ids and the first word, and survives junk', () => {
  assert.deepEqual(plain(L.load('nonsense')), { v: 1, seen: {}, off: false });
  const st = L.load({ v: 1, seen: { 'first-hire': 5, bogus: 1 }, off: 1, word: 'CAT' });
  assert.deepEqual(plain(st), { v: 1, seen: { 'first-hire': 5 }, off: true, word: 'CAT' });
});

test('only registered scenes are offered: an unwritten scene is skipped, not blocking the queue', () => {
  const st = L.load({ v: 1, seen: { prologue: 1 } }), F = f({ typed: 9, paws: 1, words: 1, sold: 1 });
  assert.equal(L.pending(st, F, id => id !== 'first-word'), 'first-hire');
  L.mark(st, 'first-hire', NOW);
  assert.equal(L.pending(st, F, id => id !== 'first-word'), 'first-sale');
});

test('never interrupt: menu, hidden tab, a modal or repair, a tap streak, another department', () => {
  assert.deepEqual(plain(L.canPlay(env())), { ok: true, why: '' });
  assert.equal(L.canPlay(env({ screen: 'menu' })).why, 'screen');
  assert.equal(L.canPlay(env({ hidden: true })).why, 'hidden');
  assert.equal(L.canPlay(env({ blocked: true })).why, 'blocked');
  assert.equal(L.canPlay(env({ combo: 4 })).why, 'streak');
  assert.equal(L.canPlay(env({ sinceTap: 300 })).why, 'streak');
  assert.equal(L.canPlay(env({ tab: 'shop', waited: 5000 })).why, 'tab');
  assert.equal(L.canPlay(env({ tab: 'shop', waited: L.WAIT_TAB })).ok, true, 'after 20 s on another tab it plays anyway');
});

test('the prologue waits only for the game screen and a free screen, not for the tab or taps', () => {
  assert.equal(L.canPlay(env({ prologue: true, tab: 'shop', sinceTap: 0 })).ok, true);
  assert.equal(L.canPlay(env({ prologue: true, screen: 'menu' })).ok, false);
  assert.equal(L.canPlay(env({ prologue: true, blocked: true })).ok, false);
});

test('the building grows one stage per machine, clamped to the tower', () => {
  assert.deepEqual(plain([1, 2, 3, 4, 5, 6, 9].map(n => L.stage(f({ owned: n })))), [0, 1, 2, 3, 4, 5, 5]);
});

test('list() reports seen and registered scenes in arc order', () => {
  const st = L.load({ v: 1, seen: { prologue: 1 } });
  const ls = L.list(st, id => id === 'prologue' || id === 'first-hire');
  assert.equal(ls.length, 15);
  assert.deepEqual(plain(ls[0]), { id: 'prologue', title: 'The Clearing', chapter: 0, seen: true, ready: true });
  assert.equal(ls[2].ready, false);
});

test('track() remembers the empire a printing reached, and keeps the last one after a printing resets the run', () => {
  const st = L.load(null);
  assert.equal(L.track(st, f({ owned: 2, divs: { songs: 1 } })), true);
  assert.equal(L.track(st, f({ owned: 2, divs: { songs: 1 } })), false, 'no change, no write');
  L.track(st, f({ owned: 5, divs: { songs: 1, tv: 2 }, muses: ['poe'] }));
  L.track(st, f({ owned: 5, divs: { songs: 1, tv: 2 }, muses: ['poe'] }));
  assert.deepEqual(plain(st.peak), { p: 0, stage: 4, desks: 5, studios: ['songs', 'tv'], muses: ['poe'] });
  assert.equal(L.track(st, f({ owned: 1, printing: 1 })), true);
  assert.deepEqual(plain(st.prev), { p: 0, stage: 4, desks: 5, studios: ['songs', 'tv'], muses: ['poe'] }, 'the finished run is kept for the finale');
  assert.equal(st.peak.p, 1);
  const back = L.load(plain(st));
  assert.deepEqual(plain(back.prev), plain(st.prev), 'it survives a reload');
  assert.equal(L.load({ v: 1, seen: {}, prev: { p: 'x' } }).prev, undefined, 'junk is dropped');
});

test('a save that jumps ahead (import, restore, sync) plays only the furthest scene, not a marathon', () => {
  const st = L.load(null), F = f({ typed: 900, paws: 4, words: 30, sold: 1, owned: 1 });
  L.boot(st, F, NOW, false);
  const jumped = f({ typed: 9000, paws: 9, words: 300, sold: 12, owned: 4, divs: { songs: 1, tv: 1 } });
  assert.equal(L.settle(st, jumped, NOW + 1), true);
  assert.equal(L.pending(st, jumped), 'media-tv');
  L.mark(st, 'media-tv', NOW + 2);
  assert.equal(L.pending(st, jumped), null);
});
