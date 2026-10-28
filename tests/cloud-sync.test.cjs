const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm'), path = require('node:path');
const source = name => fs.readFileSync(path.join(__dirname, '..', name), 'utf8');
const plain = v => JSON.parse(JSON.stringify(v));   // values built in the vm have the vm's prototypes

/* cloud-sync.js with the shipped config (or none: bare) and the real SDK, in a stub page that the hub embeds: what reaches the parent, and when.
   Ops is played by hand: register the 'cloud' extension with a fake save, then call its hooks the way ops.js does. */
function page({ embedded = true, rewards = true, config, bare = false } = {}) {
  const store = new Map(), posted = [], listeners = {}, own = { v:true }, clock = { t:0 };
  let mcRoot = null, closed = 0;
  const parent = { postMessage:(m, origin) => posted.push({ m:plain(m), origin }) };
  const c = { console, setTimeout, clearTimeout, URLSearchParams, navigator:{ onLine:true }, performance:{ now:() => clock.t },
    location:{ search:'', hostname:'imi.arrangedgodly.com', href:'https://imi.arrangedgodly.com/index.html#play' },
    localStorage:{ getItem:k => store.has(k) ? store.get(k) : null, setItem:(k, v) => { store.set(k, String(v)); }, removeItem:k => { store.delete(k); } },
    addEventListener:(type, fn, capture) => { (listeners[type] ||= []).push({ fn, capture:!!capture }); },
    document:{ visibilityState:'visible', addEventListener() {}, querySelector:s => s === '.mc-root' ? mcRoot : null } };
  c.window = c; c.parent = embedded ? parent : c;
  if (config) c.MONKEY_CLOUD_CONFIG = config;                         // what a test harness injects; the shipped config only fills in an empty slot (||=)
  c.Rewards = rewards ? { enabled:true, owns:() => own.v } : { enabled:false };
  vm.createContext(c);
  for (const file of [...(bare ? [] : ['vendor/monkey-cloud/monkey-cloud.config.js']), 'vendor/monkey-cloud/monkey-cloud.js', 'cloud-sync.js']) vm.runInContext(source(file), c, { filename:file });
  c.MonkeyCloud.closePanel = () => { closed++; };
  const S = { stats:{ words:1234.7, letters:98765.2, playSecs:3661.9 }, legacy:{ stars:3, total:12 }, prem:{ earnedTotal:40 } };
  const ext = c.__OPS_EXTENSIONS.filter(([id]) => id === 'cloud');
  const hooks = ext[0][1];
  const start = () => hooks.init('load', { state:() => S });           // ops.js registers extensions once the save is loaded (and the lock held)
  const hello = () => listeners.message.forEach(l => l.fn({ data:{ type:'imi-profile:hello', v:1 }, source:parent, origin:'https://monkey.arrangedgodly.com' }));
  const key = (k, root) => { mcRoot = root; let stopped = 0, prevented = 0; (listeners.keydown || []).filter(l => l.capture).forEach(l => l.fn({ key:k, stopImmediatePropagation() { stopped++; }, preventDefault() { prevented++; } })); return { stopped, prevented }; };
  return { c, S, ext, hooks, start, hello, key, posted, own, clock, queue:() => JSON.parse(store.get('mc:q:imi') || 'null'), closed:() => closed };
}
const EXPECT = { words:1234, letters:98765, legacyStars:12, diamonds:40, playMins:61 };
const MIN = 60 * 1000;

test('with no config (a fork, a self-host) the SDK stays off, still registers one ops extension, and posts nothing; the shipped config turns it on', () => {
  assert.equal(page().c.MonkeyCloud.status(), 'local', 'the shipped Firebase config: on, signed out');
  const p = page({ bare:true });
  assert.equal(p.c.MonkeyCloud.status(), 'off');
  assert.equal(p.c.MONKEY_CLOUD_CONFIG, undefined);
  assert.equal(p.ext.length, 1);
  assert.deepEqual(Object.keys(p.hooks).sort(), ['init', 'reset', 'tick']);
  assert.equal(p.posted.length, 0, 'nothing is posted before a report');
});

test('the hub hello gets the five lifetime numbers, floored, once the save is loaded', () => {
  const p = page();
  p.hello();
  assert.deepEqual(p.posted.pop(), { m:{ type:'imi-profile:update', game:'imi', stats:{}, v:1 }, origin:'https://monkey.arrangedgodly.com' }, 'before ops starts there is nothing to say');
  p.start(); p.hello();
  assert.deepEqual(p.posted.pop(), { m:{ type:'imi-profile:update', game:'imi', stats:EXPECT, v:1 }, origin:'https://monkey.arrangedgodly.com' });
  p.S.legacy.stars = 0; p.hello();
  assert.equal(p.posted.pop().m.stats.legacyStars, 12, 'spent stars do not count: legacy.total is lifetime');
});

test('the tick reports on the first tick, then at most once per 5 minutes; printings and resets report at once', () => {
  const p = page();
  p.start();
  p.hooks.tick({ realSeconds:.05 });
  assert.equal(p.posted.length, 1); assert.deepEqual(p.posted[0].m.stats, EXPECT); assert.equal(p.posted[0].origin, '*');
  for (let t = 50; t < 5 * MIN; t += 50) { p.clock.t = t; p.hooks.tick({ realSeconds:.05 }); }
  assert.equal(p.posted.length, 1, '6000 ticks inside 5 minutes post nothing');
  p.clock.t = 5 * MIN + 50; p.S.stats.words = 2000; p.hooks.tick({ realSeconds:.05 });
  assert.equal(p.posted.length, 2); assert.equal(p.posted[1].m.stats.words, 2000);
  p.clock.t += 1000; p.S.legacy.total = 30;
  p.hooks.reset({ kind:'printing', gain:18 }); p.hooks.reset({ kind:'printing', gain:0 });
  assert.equal(p.posted.length, 4, 'every printing reports');
  assert.equal(p.posted[3].m.stats.legacyStars, 30);
  assert.deepEqual(p.queue().stats, { ...EXPECT, words:2000, legacyStars:30 }, 'the SDK queue holds the same numbers');
});

test('a full reset never lowers what the hub was told: every key is monotonic', () => {
  const p = page();
  p.start(); p.hooks.reset({ kind:'printing' });
  Object.assign(p.S, { stats:{ words:0, letters:0, playSecs:0 }, legacy:{ stars:0, total:0 }, prem:{} });
  p.hooks.init('full-reset', { state:() => p.S }); p.hooks.reset({ kind:'full-reset' });
  assert.deepEqual(p.posted.at(-1).m.stats, EXPECT);
});

test('only the tab that holds the save lock reports; without the lock feature every tab does', () => {
  const p = page();
  p.own.v = false; p.start();
  p.hello(); assert.deepEqual(p.posted.pop().m.stats, {}, 'a second tab answers the hub with nothing of its own');
  p.hooks.tick({}); p.hooks.reset({ kind:'printing' });
  assert.equal(p.queue(), null, 'and adds nothing to the shared queue');
  p.own.v = true; p.hooks.reset({ kind:'printing' });
  assert.deepEqual(p.posted.pop().m.stats, EXPECT);
  const q = page({ rewards:false }); q.start(); q.hello();
  assert.deepEqual(q.posted.pop().m.stats, EXPECT);
});

test('a broken or partial save reports what it can and never throws into ops', () => {
  const p = page();
  p.start(); delete p.S.prem; p.S.stats = { words:'x' }; p.S.legacy = null;
  p.hello(); assert.deepEqual(p.posted.pop().m.stats, { words:0, letters:0, legacyStars:0, diamonds:0, playMins:0 });
  const q = page(); q.hooks.init('load', { state:() => { throw Error('no save'); } });
  assert.doesNotThrow(() => { q.hooks.tick({}); q.hooks.reset({ kind:'printing' }); q.hello(); });
  assert.deepEqual(q.posted.pop().m.stats, {});
});

test('standalone (not in the hub) nothing is posted, but the queue still fills', () => {
  const p = page({ embedded:false });
  p.start(); p.hooks.tick({}); p.hello();
  assert.equal(p.posted.length, 0);
  assert.deepEqual(p.queue().stats, EXPECT);
});

test('Escape closes an open cloud panel before the tour, the rail or the title-screen key can see it; off, the keys are untouched', () => {
  const off = page({ bare:true });
  assert.deepEqual(off.key('Escape', {}), { stopped:0, prevented:0 }); assert.equal(off.closed(), 0, 'off: no key listener at all');
  const p = page({ config:{ emulator:{ auth:'http://127.0.0.1:1', firestore:['127.0.0.1', 2] }, emailLink:false } });
  assert.equal(p.c.MonkeyCloud.status(), 'local');
  assert.deepEqual(p.key('Escape', null), { stopped:0, prevented:0 }); assert.equal(p.closed(), 0, 'no panel: the game keeps its Escape');
  assert.deepEqual(p.key('Enter', {}), { stopped:0, prevented:0 });
  assert.deepEqual(p.key('Escape', {}), { stopped:1, prevented:1 }); assert.equal(p.closed(), 1);
});

test('both editions load the config, the SDK and the wiring before ops.js; the worker precaches them and caches Firebase', () => {
  const files = ['vendor/monkey-cloud/monkey-cloud.config.js', 'vendor/monkey-cloud/monkey-cloud.js', 'cloud-sync.js', 'ops.js'];
  for (const file of ['index.html']) {
    const at = files.map(f => source(file).indexOf(`<script src="${f}"></script>`));
    assert(at.every((x, i) => x > 0 && (i === 0 || x > at[i - 1])), file);
  }
  const sw = source('sw.js'), version = sw.match(/const VERSION = '([^']+)'/)[1];
  for (const f of files) assert(sw.includes(`'${f}'`), f);
  assert.equal(source('cloud-sync.js').match(/const BUILD = '([^']+)'/)[1], version, 'the build reported to the cloud is the worker version');
  assert.equal(sw.match(/const FIREBASE = 'https:\/\/www\.gstatic\.com\/firebasejs\/([\d.]+)\/'/)[1], source('vendor/monkey-cloud/monkey-cloud.js').match(/FIREBASE_VERSION = '([\d.]+)'/)[1]);
});

test('the worker serves Firebase cache first from its versioned cache and still ignores other origins', async () => {
  const caches = new Map(), fetched = [], on = {};
  const cache = name => { if (!caches.has(name)) caches.set(name, new Map()); const m = caches.get(name);
    return { match:async r => m.get(r.url), put:async (r, res) => { m.set(r.url, res); }, keys:async () => [...m.keys()], delete:async k => m.delete(k), add:async () => {} }; };
  const c = { URL, location:{ origin:'https://imi.arrangedgodly.com' }, fetch:async r => { fetched.push(r.url); return { ok:!r.url.includes('missing'), type:'cors', url:r.url, clone() { return this; } }; },
    caches:{ open:async n => cache(n), match:async () => undefined, keys:async () => [...caches.keys()], delete:async k => caches.delete(k) } };
  c.self = { addEventListener:(t, fn) => { on[t] = fn; }, skipWaiting() {}, clients:{ claim() {} } };
  vm.createContext(c); vm.runInContext(source('sw.js'), c);
  const version = source('sw.js').match(/const VERSION = '([^']+)'/)[1];
  const get = async url => { let p = null; on.fetch({ request:{ method:'GET', url, mode:'cors' }, respondWith(x) { p = x; } }); return p && await p; };
  const fb = 'https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js';
  assert.equal((await get(fb)).url, fb); assert.equal((await get(fb)).url, fb);
  assert.deepEqual(fetched, [fb], 'the second load comes from the cache');
  assert(caches.get(version).has(fb), 'in the versioned cache, which activate keeps and the runtime trim never touches');
  await get('https://www.gstatic.com/firebasejs/13.1.0/missing.js'); await get('https://www.gstatic.com/firebasejs/13.1.0/missing.js');
  assert.equal(fetched.filter(u => u.includes('missing')).length, 2, 'a failed response is never stored');
  assert.equal(await get('https://other.example/game.js'), null);
  assert.equal(await get('https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js'), null, 'only the pinned version');
});
