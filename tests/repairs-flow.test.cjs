const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
let h, browser, input;
before(async () => {
  h = await import('../tools/long-game/lg01-b-fixture.mjs'); browser = await h.browser();
  input = await h.records({ intro: { version: 1, done: true, train: true, words: true, shop: true, hireAt: 0 } });
});
after(async () => { await browser?.close(); });

/* The real Ops, repairs module and Floor strip on the harness's virtual clock (timers and frames move only when the test advances them).
   The first test plays the real repair page (repairs/leak.js) with its autoplayer, in real time inside the frame; the second replaces the page with a stub
   and speaks for it, from the frame's own window (the host only accepts messages whose source is the frame). The legacy profile leaves mg01 off, so it is switched on by name. */
const sleep = ms => new Promise(r => setTimeout(r, ms));
const advance = (f, ms = 400) => f.page.evaluate(ms => { __advance(ms); }, ms);
async function until(f, fn, what = 'condition', tries = 100) {
  for (let k = 0; k < tries; k++) { if (await f.page.evaluate(fn)) return; await advance(f, 200); await sleep(60); }
  throw new Error('timed out waiting for ' + what);
}
const mg = f => f.page.evaluate(() => structuredClone(IMI.ops.dev.S().meta.minigames));
const hooksCall = (f, name, ...args) => f.page.evaluate((name, args) => window.__OPS_EXTENSIONS.find(([id]) => id === 'minigames')[1][name](...args), name, args);
const mgTick = (f, secs) => f.page.evaluate(secs => { const hooks = window.__OPS_EXTENSIONS.find(([id]) => id === 'minigames')[1]; for (let k = 0; k < secs; k++) hooks.tick({ gameSeconds: 1 }); }, secs);
/* the harness page lives in /tools/, so the frame asks for /tools/minigames/repair.html: it gets the real page with a <base> back to /minigames/, or the stub */
const REAL = require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'minigames', 'repair.html'), 'utf8').replace('<head>', '<head><base href="/minigames/">');
const STUB = '<!doctype html><meta charset="utf-8"><title>stub repair</title><script>window.__got = []; addEventListener("message", e => { if (e.source === parent) __got.push(e.data); });</script>';
async function room({ stub = false } = {}) {
  const f = await h.fixture(browser, { records: input, speed: 1 });
  await f.page.setRequestInterception(true);
  f.page.on('request', r => { if (new URL(r.url()).pathname === '/tools/minigames/repair.html') void r.respond({ status: 200, contentType: 'text/html', body: stub ? STUB : REAL }); else void r.continue(); });
  await f.page.goto((process.env.LG01_URL || 'http://127.0.0.1:8162') + '/tools/balance.html?featureProfile=legacy&lg01a=1&mg01=1', { waitUntil: 'load' });
  await f.page.waitForFunction(() => !!window.IMI?.ops);
  await f.page.evaluate(() => {
    const D = IMI.ops.dev, S = D.S();
    S.written = { a: true, b: true, c: true, d: true }; S.meta.minigames = undefined;
    S.desks.forEach((d, i) => { d.owned = i < 2; d.paws = i < 2 ? 4 : 0; d.crew = []; if (d.paws) D.ensureCrew(d); });
    D.touchBank();
  });
  await advance(f, 3000);
  await hooksCall(f, 'afterRender', {});                       // the save is made the first time the game draws after the unlock
  await advance(f);
  assert.ok(await mg(f), 'the repairs save exists');
  return f;
}
/* what the repair page would say, said from the frame */
async function say(f, type, extra = {}) {
  await f.page.evaluate((type, extra) => {
    const fr = document.querySelector('.mg01-frame'), q = new URL(fr.src, location.href).searchParams;
    window.__seq = (window.__seq || 0) + 1; window.__el = (window.__el || 0) + 1;
    const msg = { bridge: 'mg01', game: q.get('game'), session: Number(q.get('session')), sequence: window.__seq, type, mode: 'main', elapsed: window.__el, score: 0, ...extra };
    fr.contentWindow.eval(`parent.postMessage(${JSON.stringify(msg)}, location.origin)`);
  }, type, extra);
  await sleep(80); await advance(f, 100);
}
const got = f => f.page.evaluate(() => document.querySelector('.mg01-frame')?.contentWindow?.__got?.map(m => ({ ...m })) || []);
const fix = async f => { await f.page.evaluate(() => document.querySelector('#oProblem [data-mg01="fix"]').click()); await until(f, () => !!document.querySelector('.mg01-overlay .mg01-frame'), 'the repair overlay'); };

test('a problem appears on the Floor; Fix it opens its own repair over the Floor; the real repair plays and its grade pays the family, trains the fixer and tunes the machine up', async () => {
  const f = await room();
  try {
    await mgTick(f, 185);                                      // the first problem comes three minutes after the unlock
    const card = await f.page.evaluate(() => ({ text: document.querySelector('#oProblem .mg-prob')?.textContent || '', fix: !!document.querySelector('#oProblem [data-mg01="fix"]') }));
    assert.ok(card.fix, 'the Floor shows the problem with Fix it: ' + card.text);
    assert.ok((await hooksCall(f, 'problem')).kind, 'and it is a real problem');
    await f.page.evaluate(() => { window.__MG01_REPAIR_Q = 'bot=1&warp=9'; IMI.ops.spawnProblem('leak'); });     // a known repair, with its autoplayer
    const p = await hooksCall(f, 'problem');
    assert.deepEqual([p.kind, p.scope], ['leak', 'desk']);
    assert.match(await f.page.evaluate(() => document.querySelector('#oProblem .mg-prob').textContent), /Leak in the ceiling over \w+[\s\S]*grabs a bucket[\s\S]*Fix it/);
    await fix(f);
    const src = await f.page.evaluate(() => document.querySelector('.mg01-frame').getAttribute('src'));
    assert.match(src, /^minigames\/repair\.html\?hosted=mg01&game=leak&session=\d+&skip=1&level=0\.11&desk=[01]&look=v\d+&hat=\d+&seed=\d+&extra=0&low=0&reduce=1&bot=1&warp=9$/, src);
    assert.equal(await f.page.evaluate(() => document.querySelector('.o-panel').classList.contains('mg01-on')), true, 'over the Floor, in the main panel');
    await until(f, () => document.querySelector('.mg01-frame')?.contentWindow?.__repair?.phase === 'play', 'the repair to start', 300);
    const charged = await mg(f);
    assert.equal(charged.active.game, 'leak', 'the start charged the session');
    await sleep(150);
    const box = await (await f.page.$('.mg01-frame')).boundingBox();             // real pointer input: an untouched repair pays nothing
    await f.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await f.page.mouse.move(box.x + box.width / 2 + 24, box.y + box.height / 2 + 6, { steps: 4 });
    await until(f, () => IMI.ops.dev.S().meta.minigames.active === null && IMI.ops.dev.S().meta.minigames.settled > 0, 'the verdict', 400);
    const m = await mg(f), rep = m.rep.leak;
    assert.ok(m.pool.keeper > 0, 'the Keepers pool was paid: ' + JSON.stringify(m.pool));
    assert.deepEqual([m.pool.speed, m.pool.sales, m.pool.luck], [0, 0, 0], 'and only Keepers');
    assert.ok(rep.best >= 40 && rep.n === 1, 'the bot fixed it: ' + JSON.stringify(rep));
    const trained = await f.page.evaluate(() => IMI.ops.dev.S().desks.flatMap(d => d.crew).filter(t => t.bd));
    assert.equal(trained.length, 1, 'exactly one typist trained'); assert.ok(trained[0].bd.keeper > 0 && trained[0].bd.at === charged.active.id);
    await until(f, () => !!document.querySelector('.mg01-frame').contentDocument.querySelector('.mg-reward:not([hidden])'), 'the reward on the game card');
    const over = await f.page.evaluate(() => { const d = document.querySelector('.mg01-frame').contentDocument; return { reward: d.querySelector('.mg-reward').textContent, verdict: d.querySelector('.mg-verdict').textContent }; });
    assert.match(over.reward, /^\+[\d,]+INSPIRATION\w+ tuned up \+\d+% for \d:\d\d\.$/, 'the reward line from the host: ' + over.reward);
    assert.match(over.verdict, /^(FIXED|PERFECT)$/);
    assert.match(await f.page.evaluate(() => document.querySelector('.mg01-verdict').textContent), /(FIXED|PERFECT) .*tuned up/, 'the side card shows the verdict');
    await f.page.evaluate(() => document.querySelector('.mg01-frame').contentDocument.querySelector('.mg-over .mg-btn').click());    // CONTINUE
    await until(f, () => !document.querySelector('.mg01-overlay'), 'CONTINUE to close the repair');
    await mgTick(f, 2);
    const floor = await f.page.evaluate(() => ({ open: !!document.querySelector('#oProblem .mg-prob:not(.good)'), tuned: document.querySelector('#oProblem .mg-prob.good')?.textContent || '' }));
    assert.equal(floor.open, false, 'the leak is fixed');
    assert.match(floor.tuned, /tuned up/, 'and the machine is tuned up for a while: ' + floor.tuned);
    assert.ok(await hooksCall(f, 'deskFactor', p.desk, 'keeper') > 1.2, 'Ops reads the tune-up');
    assert.deepEqual(f.errors, []);
  } finally { await f.close(); }
});

test('one shot: a graded finish pays once, a second start in the same session is held, and leaving before the verdict leaves the problem; the Ideas tab lists the repairs', async () => {
  const f = await room({ stub: true });
  try {
    await f.page.evaluate(() => IMI.ops.spawnProblem('jam'));
    const p = await hooksCall(f, 'problem');
    await fix(f);
    await until(f, () => Array.isArray(document.querySelector('.mg01-frame')?.contentWindow?.__got), 'the stub frame');
    const q = new URL(await f.page.evaluate(() => document.querySelector('.mg01-frame').src)).searchParams;
    assert.deepEqual([q.get('game'), q.get('desk')], ['jam', String(p.desk)]);
    await say(f, 'start');
    await until(f, () => !!IMI.ops.dev.S().meta.minigames.active, 'the charge');
    assert.deepEqual((await got(f)).map(m => m.type), ['start-ok']);
    await say(f, 'phase', { phase: 'play' }); await say(f, 'input'); await say(f, 'progress');
    await say(f, 'finish', { reason: 'natural', score: 700, grade: .7 });
    await until(f, () => IMI.ops.dev.S().meta.minigames.active === null, 'the verdict');
    const paid = await mg(f);
    assert.deepEqual(paid.pool, { speed: 287, keeper: 0, sales: 0, luck: 0 }, 'two machines: 290 x (.5 + .7 x .7)');
    const reward = (await got(f)).find(m => m.type === 'reward');
    assert.deepEqual([reward.total, reward.label, reward.verdict], [287, 'INSPIRATION', 'FIXED']);
    assert.match(reward.note, /tuned up \+36% for 3:24/);
    const fixer = await f.page.evaluate(() => IMI.ops.dev.S().desks.flatMap(d => d.crew).filter(t => t.bd));
    assert.equal(fixer.length, 1); assert.equal(fixer[0].bd.speed, 124, '100 x .99 x 1.25 rested');
    await say(f, 'start');                                     // the same session again: in-game AGAIN would have done this
    await say(f, 'finish', { reason: 'natural', score: 950, grade: .95 });
    assert.equal((await got(f)).at(-1).type, 'hold', 'the second start is held');
    assert.deepEqual(await mg(f), paid, 'and pays nothing');
    await say(f, 'quit', { reason: 'done' });
    await until(f, () => !document.querySelector('.mg01-overlay'), 'CONTINUE to close it');
    await mgTick(f, 2);
    assert.match(await f.page.evaluate(() => document.querySelector('#oProblem .mg-prob.good')?.textContent || ''), /tuned up/);
    assert.ok(Math.abs(await hooksCall(f, 'deskFactor', p.desk, 'typing') - 1.36 * 1.004) < 1e-9, 'one tune-up, and the fixer\'s first badge level');

    await f.page.evaluate(() => IMI.ops.spawnProblem('nap'));
    await fix(f);
    await until(f, () => Array.isArray(document.querySelector('.mg01-frame')?.contentWindow?.__got), 'the stub frame');
    await say(f, 'start'); await until(f, () => !!IMI.ops.dev.S().meta.minigames.active, 'the charge');
    await f.page.evaluate(() => document.querySelector('[data-mg01="close"]').click());                 // Leave, before the verdict
    await until(f, () => !document.querySelector('.mg01-overlay'), 'the overlay to close');
    const left = await mg(f);
    assert.deepEqual([left.active, left.settled, left.pool.keeper], [null, 2, 0], 'abandoned: settled, unpaid');
    assert.equal((await hooksCall(f, 'problem')).kind, 'nap', 'the problem stays');
    assert.ok(await f.page.evaluate(() => !!document.querySelector('#oProblem [data-mg01="fix"]')), 'and can be tried again');
    assert.deepEqual(left.rep, { jam: { n: 1, best: 70 }, nap: { n: 0, best: 0 } }, 'the repair log');

    await f.page.evaluate(() => { const a = IMI.ops.extensions; a.setSub('ideas', 'repairs'); a.setTab('ideas'); window.__OPS_EXTENSIONS.find(([id]) => id === 'minigames')[1].render(a, document.getElementById('o-ideas')); });   // the harness is headless: draw the pane by hand
    const pane = await f.page.evaluate(() => { const p = document.getElementById('o-ideas'); return { reps: p.querySelectorAll('.mg-rep').length, unseen: p.querySelectorAll('.mg-rep.unseen').length, text: p.textContent, subs: [...p.querySelectorAll('[data-dept="ideas"]')].map(b => b.dataset.sub) }; });
    assert.deepEqual(pane.subs, ['ideas', 'crew', 'repairs']);
    assert.equal(pane.reps, 20); assert.equal(pane.unseen, 18, 'only the jam and the nap have been met');
    assert.match(pane.text, /Ink jam[\s\S]*Fixed 1× · best 70%/); assert.match(pane.text, /Keeper nodded off[\s\S]*Not fixed yet · best 0%/);
    assert.equal(await f.page.evaluate(() => document.querySelector('.o-tab[data-tab="breakroom"]')), null, 'the Break Room is gone');
    assert.deepEqual(f.errors, []);
  } finally { await f.close(); }
});
