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
const ctx = (over = {}) => ({ printing: 2, ref: 1000, fundable: 10000, challenge: false, round: n => Math.round(n / 25) * 25, ...over });
const T0 = 1_000_000_000_000;

test('restoration: deposits commit once and survive, only what is wanted is taken, and binding needs a sale of the right band', () => {
  const W = load();
  let w = { ...W.fresh(), leads: ['anthology'] };
  assert.equal(W.valid(w), true);
  assert.equal(W.deposit({ ...w, leads: [] }, 'anthology', 0, 3).ok, false, 'needs the lead first');
  assert.equal(W.wanted(w, 'anthology', 0), 6);
  let r = W.deposit(w, 'anthology', 0, 4);
  assert.equal(r.added, 4);
  r = W.deposit(r.w, 'anthology', 0, 4);
  assert.equal(r.added, 2, 'never takes more than the collection wants');
  assert.equal(W.wanted(r.w, 'anthology', 0), 0);
  assert.equal(r.w.restore.anthology.armed, false, 'one band still short');
  r = W.deposit(r.w, 'anthology', 1, 9);
  assert.equal(r.added, 4);
  w = r.w;
  assert.equal(w.restore.anthology.armed, true);
  assert.equal(W.valid(w), true);
  assert.equal(W.onSale(w, 0), w, 'the wrong band does not bind');
  const bound = W.onSale(w, 1);
  assert.equal(bound.restored.anthology, true);
  assert.equal(bound.restore.anthology.armed, false);
  assert.equal(W.deposit(bound, 'anthology', 0, 1).ok, false, 'already restored');
  assert.equal(W.onSale(bound, 1), bound, 'binding happens once');
  assert.equal(W.valid(bound), true);
});

test('the collector discount lowers what a deposit needs, and mid-way progress is never lost to it', () => {
  const W = load(), disc = n => Math.ceil(n * .75);
  let w = { ...W.fresh(), leads: ['atlas'] };
  assert.deepEqual(plain(W.progress(w, 'atlas', disc).map(p => p.need)), [5, 3]);
  w = W.deposit(w, 'atlas', 2, 5, disc).w;
  assert.equal(W.deposit(w, 'atlas', 3, 3, disc).w.restore.atlas.armed, true);
  assert.equal(W.ready(W.deposit(w, 'atlas', 3, 3, disc).w, 'atlas', disc), true);
  assert.equal(W.ready(W.deposit(w, 'atlas', 3, 3).w, 'atlas'), false, 'without the discount four are still wanted');
  // readiness follows the discount, so switching builds after depositing never strands a collection
  const half = { ...W.fresh(), leads: ['atlas'], restore: { atlas: { dep: { 2: 5, 3: 3 }, armed: false } } };
  assert.equal(W.ready(half, 'atlas', disc), true);
  assert.equal(W.ready(half, 'atlas'), false);
  assert.equal(W.onSale(half, 3).restored.atlas, undefined, 'no discount: not yet');
  assert.equal(W.onSale(half, 3, disc).restored.atlas, true, 'with the discount the sale binds it');
});

test('restoring unlocks its recipe and route; the quote and bench say why not before', () => {
  const W = load(), base = { ...W.fresh(), parts: 99, leads: ['anthology'] };
  assert.match(W.quote(base, 'archive', ctx()).why, /Restore the damaged anthology first/);
  assert.match(W.craft(base, 'typebar').why, /Restore the damaged anthology first/);
  const done = { ...base, restored: { anthology: true } };
  const q = W.quote(done, 'archive', ctx());
  assert.deepEqual([q.ok, q.cost, q.seconds, q.parts], [true, 400, 1800, 20]);
  assert.ok(q.parts / q.seconds > W.ROUTES.salvage.parts / W.ROUTES.salvage.seconds, 'a better rate per minute than the first route');
  assert.ok(q.parts / q.cost > W.ROUTES.salvage.parts / W.quote(base, 'salvage', ctx()).cost, 'and per banana');
  const w = W.craft(done, 'typebar').w;
  const e = W.equip(w, w.attachments[0].id, 2).w;
  assert.deepEqual([W.typebar(e, 2), W.typebarSpeed(e, 2), W.typebar(e, 1), W.typebarSpeed(e, 1)], [.25, .85, 0, 1], 'targeted, at the price of speed');
});

test('special editions: the first clear is a permanent mastery, repeats pay a few Parts and then stop', () => {
  const W = load();
  const base = { ...W.fresh(), leads: ['almanac'], restored: { almanac: true } };
  assert.equal(W.specialClear(W.fresh(), 'roster').ok, false, 'locked until the almanac is restored');
  let r = W.specialClear(base, 'roster');
  assert.deepEqual([r.first, r.parts, r.w.mastery.roster], [true, 0, true]);
  assert.equal(W.valid(r.w), true);
  let w = r.w, paid = 0;
  for (let n = 0; n < 9; n++) { r = W.specialClear(w, 'roster'); paid += r.parts; w = r.w; }
  assert.equal(paid, W.MAX_REPEATS * W.REPEAT_PARTS, 'bounded: repeats stop paying');
  assert.equal(w.repeats, W.MAX_REPEATS);
  assert.equal(W.specialClear(base, 'twin').ok, false, 'its own collection is needed');
  assert.equal(W.specialClear(w, 'roster', n => Math.ceil(n * 1.5)).parts, 0, 'a spent allowance stays spent, whatever the multiplier');
});

test('masteries shorten exactly their own route by a fifth; the collector adds a Part to lead trips only', () => {
  const W = load(), w = { ...W.fresh(), mastery: { roster: true }, restored: {} };
  assert.equal(W.routeSeconds(w, 'salvage'), 720);
  assert.equal(W.routeSeconds(w, 'manuscript'), 1800);
  assert.equal(W.quote(w, 'salvage', ctx()).seconds, 720);
  const got = W.launch(W.fresh(), 'manuscript', ctx({ bonus: 1 }), T0);
  assert.equal(got.ok, true);
  const back = W.advance(got.w, T0 + 1800_000);
  assert.equal(W.claim(back, 1).parts, 4);
  const salvage = W.advance(W.launch(W.fresh(), 'salvage', ctx(), T0).w, T0 + 900_000);
  assert.equal(W.claim(salvage, 1).parts, 8, 'no bonus on a trip with no lead');
});

test('records saved before restoration existed still load, and impossible restoration records do not', () => {
  const W = load(), old = plain(W.fresh());
  for (const k of ['restore', 'restored', 'mastery', 'repeats']) delete old[k];
  assert.equal(W.valid(old), true);
  assert.equal(W.valid({ ...W.fresh(), repeats: 99 }), false);
  assert.equal(W.valid({ ...W.fresh(), restored: { atlas: true } }), false, 'a restoration needs its lead');
  assert.equal(W.valid({ ...W.fresh(), mastery: { fake: true } }), false);
  assert.equal(W.valid({ ...W.fresh(), leads: ['atlas'], restore: { atlas: { dep: { 9: 1 }, armed: false } } }), false, 'a band the collection never asked for');
});
