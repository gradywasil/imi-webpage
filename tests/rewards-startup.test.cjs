const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');

// Synthetic script/lock scheduling; actual module bytes, not browser lifecycle proof.
function fixture(enabled = true) {
  const nodes = [], tasks = new Map(), listeners = {}, errors = [], writes = [];
  const records = new Map([['imi-score', '"25"'], ['imi-ops-v1', '{}'], ['unrelated', 'retained']]);
  let grant, held = false, requests = 0, reloads = 0, next = 0;
  const element = () => ({ hidden: false, children: [], listeners: {},
    setAttribute() {}, addEventListener(type, fn) { this.listeners[type] = fn; },
    append(...children) { this.children.push(...children); }, focus() { this.focused = true; },
    contains(target) { return this.children.includes(target); },
    get firstChild() { return this.children[0]; }, get lastChild() { return this.children.at(-1); }
  });
  const context = { URLSearchParams, Intl, console: { error: (...args) => errors.push(args) },
    location: { search: enabled ? '?lg01a=1' : '', reload: () => reloads++ },
    navigator: { locks: { request: (_name, _options, callback) => {
      requests++;
      return new Promise(resolve => { grant = () => {
        held = true;
        Promise.resolve(callback({ name: 'imi-save-writer' })).then(() => { held = false; resolve(); });
      }; });
    } } },
    document: { createElement: element, body: { appendChild: node => nodes.push(node) }, addEventListener() {} },
    addEventListener: (type, fn) => { listeners[type] = fn; },
    localStorage: { getItem: key => records.get(key) ?? null,
      setItem: (key, value) => { writes.push(key); records.set(key, value); } }
  };
  for (const name of ['setTimeout', 'setInterval', 'requestAnimationFrame']) context[name] = fn => { tasks.set(++next, fn); return next; };
  for (const name of ['clearTimeout', 'clearInterval', 'cancelAnimationFrame']) context[name] = id => tasks.delete(id);
  context.window = context;
  vm.runInNewContext(readFileSync(process.env.REWARDS_SOURCE || join(__dirname, '..', 'rewards.js'), 'utf8'), context);
  vm.runInNewContext(readFileSync(join(__dirname, '..', 'economy.js'), 'utf8'), context);
  return { context, nodes, tasks, records, writes, errors, listeners,
    grant: () => grant(), held: () => held, requests: () => requests, reloads: () => reloads };
}
const settle = async () => { for (let i = 0; i < 8; i++) await Promise.resolve(); };

for (const order of ['queued-before-grant', 'registered-after-ownership']) {
  test(`save rejection stays blocked through later registration and deliberate Retry: ${order}`, async () => {
    const f = fixture(), r = f.context.Rewards, before = [...f.records];
    let game = false, dependent = 0, stale = 0, escaped = null;
    r.start(() => {}); // Shell registration starts acquisition before the edition script.
    if (order === 'registered-after-ownership') { f.grant(); await settle(); }
    const boot = () => {
      r.timers.setInterval(() => stale++, 50);
      f.context.Economy.loadScore(); // Same wallet boundary reached by Core.boot.
      game = true;
    };
    try { r.start(boot); } catch (error) { escaped = error.message; }
    if (order === 'queued-before-grant') { f.grant(); await settle(); }
    await settle();
    assert.deepEqual({ escaped, game, owner: r.owns(), held: f.held(),
      status: f.nodes[0]?.firstChild.textContent ?? null, hidden: f.nodes[0]?.hidden ?? null },
    { escaped: null, game: false, owner: false, held: false,
      status: 'Startup could not save safely. Retry reloads the last saved game.', hidden: false });
    const requests = f.requests();
    r.start(() => dependent++); // Later Ops/tour/pickup registration cannot reboot.
    for (const fn of f.tasks.values()) fn();
    await settle();
    assert.equal(dependent, 0);
    assert.equal(stale, 0);
    assert.equal(f.tasks.size, 0);
    assert.equal(f.requests(), requests);
    assert.equal(f.reloads(), 0);
    assert.equal(f.nodes[0].hidden, false);
    assert.equal(f.nodes[0].lastChild.focused, true);
    f.nodes[0].lastChild.listeners.click();
    await settle();
    assert.equal(f.reloads(), 1);
    assert.equal(f.requests(), requests); // Retry starts a new document, not stale callbacks.
    assert.equal(r.owns(), false);
    assert.deepEqual([...f.records], before);
    assert.deepEqual(f.writes, []);
    assert.equal(f.errors.length, 1);
  });
  test(`successful boot preserves callback order: ${order}`, async () => {
    const f = fixture(), calls = [], r = f.context.Rewards;
    r.start(() => calls.push('shell'));
    if (order === 'registered-after-ownership') { f.grant(); await settle(); }
    r.start(() => calls.push('edition'));
    r.start(() => calls.push('ops'));
    if (order === 'queued-before-grant') { f.grant(); await settle(); }
    assert.deepEqual(calls, ['shell', 'edition', 'ops']);
    assert.equal(r.owns(), true);
    assert.equal(f.held(), true);
    f.listeners.pagehide(); await settle();
    assert.equal(r.owns(), false);
    assert.equal(f.held(), false);
  });
}
test('default-off module leaves the caller synchronous and requests no lock', () => {
  const f = fixture(false), calls = [];
  if (f.context.Rewards.enabled) f.context.Rewards.start(() => calls.push('boot'));
  else calls.push('boot');
  assert.deepEqual(calls, ['boot']);
  assert.equal(f.requests(), 0);
  assert.equal(f.nodes.length, 0);
});
