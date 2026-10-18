const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function load() {
  const context = {}; context.window = context;
  vm.runInNewContext(readFileSync(path.join(__dirname, '..', 'workshop.js'), 'utf8'), context);
  return context.Workshop;
}
const plain = x => JSON.parse(JSON.stringify(x));
const ctx = (over = {}) => ({ printing: 2, ref: 1000, fundable: 10000, fundWords: 500, fundLetters: 5000, challenge: false, round: n => Math.round(n / 25) * 25, ...over });
const T0 = 1_000_000_000_000;
const mastered = W => ({ ...W.fresh(), mastery: { roster: true, twin: true } });

test('words and letters pay for a route from what this room produced, and refuse with the exact shortfall', () => {
  const W = load(), w = W.fresh();
  const words = W.quote(w, 'salvage', ctx(), 'words');
  assert.equal(words.ok, true); assert.equal(words.cost, 60); assert.equal(words.fund, 'words');
  const letters = W.quote(w, 'manuscript', ctx(), 'letters');
  assert.equal(letters.cost, 540); assert.equal(letters.ok, true);
  const short = W.quote(w, 'salvage', ctx({ fundWords: 59 }), 'words');
  assert.equal(short.ok, false); assert.match(short.why, /Needs 60 words produced this room \(59 eligible\)/);
  assert.equal(W.quote(w, 'salvage', ctx({ fundable: 0 }), 'words').ok, true, 'banana funds do not matter for a word-funded trip');
  assert.equal(W.quote(w, 'salvage', ctx(), 'nonsense').fund, 'bananas', 'an unknown fund falls back to bananas');
  const launched = W.launch(w, 'salvage', ctx(), T0, 'words', { stump: 40, leaf: 20 });
  assert.equal(launched.ok, true); assert.equal(launched.fund, 'words');
  assert.equal(launched.w.exp.fund, 'words'); assert.deepEqual(plain(launched.w.exp.took), { stump: 40, leaf: 20 });
  assert.equal(W.valid(launched.w), true);
});

test('a refund of words comes back only from what was taken, in the same unit, once', () => {
  const W = load();
  const go = W.launch(W.fresh(), 'salvage', ctx(), T0, 'words', { stump: 40, leaf: 20 });
  const half = W.advance(go.w, T0 + 450_000);
  const back = W.cancel(half, n => Math.floor(n), T0 + 450_000);
  assert.equal(back.ok, true); assert.equal(back.fund, 'words');
  assert.equal(back.refund, 30); assert.equal(back.lost, 30);
  assert.deepEqual(plain(back.give), { stump: 30 }, 'the share is drawn from the recorded take, never invented');
  assert.equal(back.w.exp, null);
  assert.equal(W.cancel(back.w).ok, false, 'a second call back refunds nothing');
  // letters are recorded per machine
  const lg = W.launch(W.fresh(), 'salvage', ctx(), T0, 'letters', { 0: { E: 200, A: 160 }, 1: { T: 40 } });
  const lb = W.cancel(lg.w, n => Math.floor(n), T0);
  assert.equal(lb.refund, 360);
  assert.deepEqual(plain(lb.give), { 0: { E: 200, A: 160 } }, 'letters keep their machine and the share stops at the refund');
});

test('without the Twin Band mastery there is one expedition at a time; with it two more wait in a queue', () => {
  const W = load();
  const one = W.launch(W.fresh(), 'salvage', ctx(), T0);
  assert.match(W.quote(one.w, 'salvage', ctx()).why, /One expedition at a time/);
  assert.equal(W.queueMax(W.fresh()), 0); assert.equal(W.queueMax(mastered(W)), 2);
  let w = W.launch(mastered(W), 'salvage', ctx(), T0).w;
  const q1 = W.launch(w, 'manuscript', ctx(), T0 + 1000);
  assert.equal(q1.ok, true); assert.equal(q1.queued, true);
  assert.equal(q1.w.exp.id, w.exp.id, 'the running trip is untouched'); assert.equal(q1.w.queue.length, 1);
  assert.equal(q1.w.clock.last, T0, 'queueing does not restart the clock');
  const q2 = W.launch(q1.w, 'salvage', ctx(), T0 + 2000);
  assert.equal(q2.ok, true); assert.equal(q2.w.queue.length, 2);
  const q3 = W.quote(q2.w, 'salvage', ctx());
  assert.equal(q3.ok, false); assert.match(q3.why, /queue is full/);
  assert.equal(W.valid(q2.w), true);
  assert.deepEqual(plain(q2.w.queue.map(x => x.state)), ['queued', 'queued']);
});

test('a long absence runs the whole queue in order; finished trips wait on the shelf and are collected one by one', () => {
  const W = load();
  const base = mastered(W), S = W.routeSeconds(base, 'salvage'), M = W.routeSeconds(base, 'manuscript');   // both routes are 20% shorter with these masteries
  let w = W.launch(base, 'salvage', ctx(), T0).w;
  w = W.launch(w, 'manuscript', ctx(), T0).w;
  w = W.launch(w, 'salvage', ctx(), T0).w;
  const after = W.advance(w, T0 + (S + M + 450) * 1000);
  assert.equal(after.exp.route, 'salvage'); assert.equal(after.exp.state, 'away'); assert.equal(after.exp.elapsed, 450);
  assert.deepEqual(plain(after.shelf.map(x => x.route)), ['salvage', 'manuscript']);
  assert.equal(after.queue.length, 0); assert.equal(W.valid(after), true);
  const done = W.advance(after, T0 + (S + M + S) * 1000);
  assert.equal(done.exp.state, 'returned'); assert.equal(done.shelf.length, 2); assert.equal(W.valid(done), true);
  const c1 = W.claim(done);
  assert.equal(c1.ok, true); assert.equal(c1.parts, 8, 'the oldest shelved trip pays first');
  const c2 = W.claim(c1.w);
  assert.equal(c2.ok, true); assert.equal(c2.parts, 3); assert.equal(c2.lead, 'anthology');
  const c3 = W.claim(c2.w);
  assert.equal(c3.ok, true); assert.equal(c3.parts, 8); assert.equal(c3.w.exp, null); assert.equal(c3.w.shelf.length, 0);
  assert.equal(c3.w.parts, 19, 'every trip paid exactly once'); assert.equal(c3.w.done, 3);
  assert.equal(W.claim(c3.w).ok, false);
});

test('calling the running trip back starts the next queued one; a queued trip cancels for its full cost', () => {
  const W = load();
  let w = W.launch(mastered(W), 'salvage', ctx(), T0).w;
  w = W.launch(w, 'manuscript', ctx(), T0, 'words', { stump: 90 }).w;
  const queuedId = w.queue[0].id;
  const refund = W.cancelQueued(w, queuedId);
  assert.equal(refund.ok, true); assert.equal(refund.refund, 90); assert.equal(refund.fund, 'words'); assert.deepEqual(plain(refund.give), { stump: 90 });
  assert.equal(refund.w.queue.length, 0); assert.equal(refund.w.exp.id, w.exp.id);
  assert.equal(W.cancelQueued(refund.w, queuedId).ok, false, 'it can only be cancelled once');
  const back = W.cancel(w, n => n, T0 + 100_000);
  assert.equal(back.ok, true); assert.equal(back.w.exp.id, queuedId); assert.equal(back.w.exp.state, 'away'); assert.equal(back.w.exp.elapsed, 0);
  assert.equal(back.w.clock.last, T0 + 100_000, 'the next trip starts when the first was called back');
  assert.equal(W.valid(back.w), true);
});

test('the Roster mastery opens a second attachment slot; two of a kind never stack and one attachment has one place', () => {
  const W = load();
  let w = { ...W.fresh(), parts: 100 };
  for (const type of ['carriage', 'tray', 'carriage']) w = W.craft(w, type).w;
  const [a1, a2, a3] = w.attachments.map(a => a.id);
  assert.equal(W.equip(w, a1, 0, 1).ok, false, 'no second slot yet');
  w = { ...w, mastery: { roster: true } };
  w = W.equip(w, a1, 0).w;
  const second = W.equip(w, a2, 0, 1);
  assert.equal(second.ok, true); w = second.w;
  assert.deepEqual(plain(W.typesAt(w, 0)), ['carriage', 'tray']);
  assert.equal(W.carriage(w, 0), 1.5); assert.equal(W.tray(w, 0), true);
  assert.equal(W.equip(w, a3, 0, 1).ok, false, 'a second carriage on the same machine is refused');
  assert.equal(W.valid(w), true);
  const moved = W.equip(w, a1, 2, 1);
  assert.equal(moved.ok, true); assert.equal(moved.w.equipped[0], undefined, 'moving unequips the old place in the same step');
  assert.equal(moved.w.equippedB[2], a1); assert.equal(W.valid(moved.w), true);
  // losing the mastery (a hand-edited save) cannot keep a second slot
  assert.equal(W.valid({ ...w, mastery: {} }), false);
  assert.equal(W.unequip(w, 0, 1).w.equippedB[0], undefined);
});

test('older records without queues, shelves or a second slot still load', () => {
  const W = load();
  const old = plain(W.fresh()); delete old.queue; delete old.shelf; delete old.equippedB;
  assert.equal(W.valid(old), true);
  const go = W.launch(old, 'salvage', ctx(), T0);
  assert.equal(go.ok, true); assert.equal(W.valid(go.w), true);
  assert.equal(W.valid({ ...go.w, queue: [go.w.exp] }), false, 'the same trip cannot be both running and waiting');
});
