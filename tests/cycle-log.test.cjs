const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function load() {
  const context = {}; context.window = context;
  vm.runInNewContext(readFileSync(path.join(__dirname, '..', 'cycle-log.js'), 'utf8'), context);
  return context.CycleLog;
}
const run = (log, seconds, probe, step = 1) => { for (let t = 0; t < seconds; t += step) log.tick(step, () => (typeof probe === 'function' ? probe(t) : probe)); };

test('a cycle records first sale, blocked seconds, manual actions and peak', () => {
  const log = load().create(), c = () => JSON.parse(JSON.stringify(log.snapshot().open));
  run(log, 10, { earned: 100, milestone: 1, blocked: 'typing' });
  log.key(); log.key(); log.buy();
  log.sale(true); log.sale(false);
  run(log, 5, { earned: 900, milestone: 1, blocked: 'publishing' });
  assert.equal(c().seconds, 15);
  assert.equal(c().firstSale, 10);
  assert.deepEqual(c().manual, { keys: 2, sales: 1, buys: 1 });
  assert.deepEqual(c().blocked, { typing: 10, banking: 0, publishing: 5, funds: 0 });
  assert.equal(c().peakEarned, 900);
});

test('the next cycle measures time to the prior peak and to a new milestone', () => {
  const log = load().create();
  run(log, 20, t => ({ earned: t * 50, milestone: t < 10 ? 1 : 2, blocked: 'funds' }));
  const closed = log.end('printing');
  assert.equal(closed.kind, 'printing');
  assert.equal(closed.toPriorPeak, null, 'the first cycle has no prior to beat');
  run(log, 20, t => ({ earned: t * 100, milestone: t < 3 ? 1 : 3, blocked: 'typing' }));
  const second = log.snapshot().open;
  assert.equal(second.index, 1);
  assert.equal(second.toPriorPeak, 11, 'reaches the prior peak of 950 on the 11th second, at 1000 earned');
  assert.equal(second.toNextMilestone, 4, 'first passes the best milestone of 2 at 3');
  log.end('printing');
  assert.equal(log.snapshot().cycles.length, 2);
});

test('sampling cadence, bad input and history cap stay bounded', () => {
  const log = load().create();
  let probes = 0;
  for (let i = 0; i < 100; i++) log.tick(.1, () => { probes++; return { earned: 1, milestone: 1, blocked: 'banking' }; });
  assert.ok(probes >= 9 && probes <= 11, `about one probe per second, saw ${probes}`);
  for (const bad of [0, -1, NaN, Infinity, undefined]) log.tick(bad, () => { throw Error('must not probe'); });
  log.tick(1, () => ({ earned: NaN, milestone: NaN, blocked: 'nonsense' }));
  const open = log.snapshot().open;
  assert.equal(open.blocked.banking > 0, true);
  assert.equal(open.peakEarned, 1);
  for (let i = 0; i < 30; i++) { log.tick(1, () => null); log.end('printing'); }
  assert.equal(log.snapshot().cycles.length, 20);
  assert.equal(log.end('printing'), null, 'ending with no open cycle is a no-op');
});
