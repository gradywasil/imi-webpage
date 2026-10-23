const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
let h, browser, input;
before(async () => {
  h = await import('../tools/long-game/lg01-b-fixture.mjs'); browser = await h.browser();
  input = await h.records({ intro: { version: 1, done: true, train: true, words: true, shop: true, hireAt: 0 } });
});
after(async () => { await browser?.close(); });

/* The real Ops, Break Room module and Floor strip on the harness's virtual clock (timers and frames move only when the test advances them).
   The game inside the frame is replaced by messages sent from the frame's own window (the bridge only accepts messages whose source is the frame),
   so a run's whole life is covered without playing a game. The legacy profile leaves the Break Room off, so it is switched on by name. */
const sleep = ms => new Promise(r => setTimeout(r, ms));
const advance = (f, ms = 400) => f.page.evaluate(ms => { __advance(ms); }, ms);
async function until(f, fn, what = 'condition') {
  for (let k = 0; k < 100; k++) { if (await f.page.evaluate(fn)) return; await advance(f, 200); await sleep(40); }
  throw new Error('timed out waiting for ' + what);
}
const mg = f => f.page.evaluate(() => structuredClone(IMI.ops.dev.S().meta.minigames));
const hooksCall = (f, name, ...args) => f.page.evaluate((name, args) => window.__OPS_EXTENSIONS.find(([id]) => id === 'minigames')[1][name](...args), name, args);
async function room() {
  const f = await h.fixture(browser, { records: input, speed: 1 });
  await f.page.goto((process.env.LG01_URL || 'http://127.0.0.1:8162') + '/tools/balance.html?featureProfile=legacy&lg01a=1&mg01=1', { waitUntil: 'load' });
  await f.page.waitForFunction(() => !!window.IMI?.ops);
  await f.page.evaluate(() => {
    const D = IMI.ops.dev, S = D.S();
    S.written = { a: true, b: true, c: true, d: true }; S.meta.minigames = undefined;
    S.desks.forEach((d, i) => { d.owned = i < 2; d.paws = i < 2 ? 4 : 0; d.crew = []; if (d.paws) D.ensureCrew(d); });
    D.touchBank();
  });
  await advance(f, 3000);
  await hooksCall(f, 'afterRender', {});                       // the Break Room opens its save the first time its screen draws
  await advance(f);
  assert.ok(await mg(f), 'the Break Room save exists');
  return f;
}
/* the same click the real buttons make, from a button made for the purpose */
const press = (f, data) => f.page.evaluate(data => { const b = document.createElement('button'); Object.entries(data).forEach(([k, v]) => { b.dataset[k] = v; }); document.body.appendChild(b); b.click(); b.remove(); }, data);
/* the Break Room's own clock, ticked directly: four minutes of the real tick loop would take minutes to simulate */
const mgTick = (f, secs) => f.page.evaluate(secs => { const hooks = window.__OPS_EXTENSIONS.find(([id]) => id === 'minigames')[1]; for (let k = 0; k < secs; k++) hooks.tick({ gameSeconds: 1 }); }, secs);
/* what the game inside the frame would say, said from the frame */
async function say(f, type, extra = {}) {
  await f.page.evaluate((type, extra) => {
    const fr = document.querySelector('.mg01-frame'), q = new URL(fr.src, location.href).searchParams;
    window.__seq = (window.__seq || 0) + 1; window.__el = (window.__el || 0) + (extra.dt || 0);
    const msg = { bridge: 'mg01', game: q.get('game'), session: Number(q.get('session')), sequence: window.__seq, type, mode: { barrel: 'bananas', rhythm: 'normal' }[q.get('game')] || 'main', elapsed: window.__el, score: extra.score || 0, ...extra.rest };
    fr.contentWindow.eval(`parent.postMessage(${JSON.stringify(msg)}, location.origin)`);
  }, type, extra);
  await sleep(100); await advance(f, 100);
}
async function playRun(f, score) {
  await until(f, () => { const fr = document.querySelector('.mg01-frame'); return fr && fr.contentWindow && fr.contentWindow.location.origin !== 'null' && fr.contentDocument?.readyState === 'complete'; }, 'the game frame');     // not the blank page it starts as
  await say(f, 'start');                                       // the host charges the break (or not, for a free fixing run) and answers
  await say(f, 'phase', { rest: { phase: 'play' } }); await say(f, 'input'); await say(f, 'progress', { dt: 5 });
  await say(f, 'finish', { dt: 30, score, rest: { reason: 'natural' } });
  await until(f, () => IMI.ops.dev.S().meta.minigames.active === null && IMI.ops.dev.S().meta.minigames.settled > 0, 'the run to bank');
}
const PAR = { speed: 3500, keeper: 3000, sales: 1000, luck: 450 };

test('a Floor problem appears, a game of its family fixes it for free, and the typist earns a badge that pays back on that machine', async () => {
  const f = await room();
  try {
    const before = await mg(f);
    assert.deepEqual(before.pool, { speed: 0, keeper: 0, sales: 0, luck: 0 });
    await mgTick(f, 250);                                       // the first problem arrives after four minutes of play
    const card = await f.page.evaluate(() => ({ text: document.querySelector('#oProblem .mg-prob')?.textContent || '', fam: document.querySelector('#oProblem .mg-prob')?.dataset.fam }));
    assert.match(card.text, /Fix it/, 'the Floor shows the problem: ' + JSON.stringify(card));
    const fam = card.fam;
    await f.page.evaluate(() => document.querySelector('[data-mg01="fix"]').click());                  // Fix it: opens the Break Room and the matching game
    await until(f, () => !!document.querySelector('.mg01-overlay'), 'the game overlay');
    const run = await f.page.evaluate(() => ({ game: document.querySelector('.mg01-overlay').dataset.game, status: document.querySelector('.mg01-status')?.textContent }));
    assert.match(run.status, /free/i, JSON.stringify(run));
    await playRun(f, PAR[fam]);
    const after = await mg(f);
    assert.equal(after.attempts, before.attempts, 'a fixing run costs no break');
    assert.ok(after.pool[fam] > 0, 'the family was paid: ' + JSON.stringify(after.pool));
    assert.ok(Object.entries(after.pool).every(([k, v]) => k === fam || v === 0), 'and only that family');
    const trained = await f.page.evaluate(() => IMI.ops.dev.S().desks.flatMap(d => d.crew).filter(t => t.bd));
    assert.equal(trained.length, 1, 'exactly one typist trained');
    assert.ok(trained[0].bd[fam] > 0 && trained[0].bd.at === 1);
    assert.deepEqual(Object.keys(after.who).sort(), ['d', 'name'], 'the last typist is remembered');
    await mgTick(f, 2);
    const state = await f.page.evaluate(() => ({ open: !!document.querySelector('#oProblem .mg-prob:not(.good)'), tuned: document.querySelector('#oProblem .mg-prob.good')?.textContent || '' }));
    assert.equal(state.open, false, 'the problem is fixed');
    assert.match(state.tuned, /tuned up/, 'and the machine is tuned up for a while: ' + state.tuned);
    assert.deepEqual(f.errors, []);
  } finally { await f.close(); }
});

test('a rewarded break spends a break, trains the typist you picked, pays its family, and the badge speeds up that machine', async () => {
  const f = await room();
  try {
    await press(f, { mg01: 'who', d: 1, p: 2 });               // pick Hibiscus' third typist
    const { name, rate } = await f.page.evaluate(() => ({ name: IMI.ops.dev.S().desks[1].crew[2].name, rate: IMI.ops.dev.autoRate(IMI.ops.dev.S().desks[1]) }));
    await press(f, { mg01: 'rewarded', game: 'whack' });       // Key Whack: a Speed game
    await until(f, () => !!document.querySelector('.mg01-overlay'), 'the game overlay');
    const url = await f.page.evaluate(() => document.querySelector('.mg01-frame').src);
    assert.match(url, /look=v\d\d/, 'the game draws the typist: ' + url);
    await playRun(f, 3500);                                     // at par
    const m = await mg(f);
    assert.equal(m.attempts, 5); assert.ok(m.pool.speed > 0); assert.equal(m.pool.luck, 0);
    assert.deepEqual(m.who, { d: 1, name });
    const t = await f.page.evaluate(() => IMI.ops.dev.S().desks[1].crew[2]);
    assert.equal(t.name, name); assert.ok(t.bd.speed >= 100, 'a par run is 100 xp, 125 for a rested typist: ' + JSON.stringify(t.bd));
    assert.match(await f.page.evaluate(() => document.querySelector('.mg01-who')?.textContent || ''), /[+][0-9]+ Speed xp · Lv 1/, 'the card shows the xp and the new level');
    assert.equal(await f.page.evaluate(() => IMI.ops.dev.S().desks.flatMap(d => d.crew).filter(x => x.bd).length), 1);
    await press(f, { mg01: 'close' }); await until(f, () => !document.querySelector('.mg01-overlay'), 'the overlay to close');
    const factor = await hooksCall(f, 'deskFactor', 1, 'typing');
    assert.ok(Math.abs(factor - 1.004) < 1e-9, 'one level-1 Speed badge adds 0.4% on its own machine: ' + factor);
    const now = await f.page.evaluate(() => IMI.ops.dev.autoRate(IMI.ops.dev.S().desks[1]));
    assert.ok(Math.abs(now / rate - factor) < 1e-6, `Ops reads it: ${now / rate} vs ${factor}`);
    assert.equal(await hooksCall(f, 'deskFactor', 0, 'typing'), 1, 'and the other machine is untouched');
    assert.deepEqual(f.errors, []);
  } finally { await f.close(); }
});
