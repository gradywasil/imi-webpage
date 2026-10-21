const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
let h, browser, input;
before(async () => {
  h = await import('../tools/long-game/lg01-b-fixture.mjs'); browser = await h.browser();
  input = await h.records({ intro: { version: 1, done: true, train: true, words: true, shop: true, hireAt: 0 } });
});
after(async () => { await browser?.close(); });

/* The real game logic on a small build with the Publisher's assistant: the titles it sells while the player is away. */
async function away(minutes, tier) {
  const f = await h.fixture(browser, { records: input, speed: 1 });
  try {
    const result = await f.page.evaluate(({ minutes, tier }) => {
      const D = IMI.ops.dev, S = D.S(), keeper = { owned: true, on: true };
      S.bank = {}; S.written = {}; S.focus = null; S.autoFocus = true; S.pub = { tier, on: true, rule: 'any' }; S.lamp = 0;
      S.desks.forEach((d, i) => { d.owned = true; d.paws = [6, 5, 4, 2][i]; d.keeper = { ...d.keeper, ...keeper }; d.letters = {}; });
      D.touchBank();
      const before = IMI.bananas.get(), rep = IMI.ops.simulateAway(minutes * 60);
      return { sold: rep.pubSold, pay: rep.pubPay, gain: IMI.bananas.get() - before, written: Object.keys(S.written).length, checkpoint: !!S.rewards?.awayCheckpoint };
    }, { minutes, tier });
    assert.deepEqual(f.errors, []);
    return result;
  } finally { await f.close(); }
}

test('an hour away with the assistant sells a whole shelf of titles, not one', async () => {
  const r = await away(60, 1);
  assert.ok(r.sold >= 20, `sold ${r.sold}`);
  assert.equal(r.written, r.sold, 'every sale used up a title');
  assert.equal(r.checkpoint, false, 'the stretch settled');
  assert.ok(r.gain >= r.pay, 'the sales were paid');
});

test('a longer absence sells more than a shorter one, and the faster press at least as many as the slow one', async () => {
  const [short, long, fast] = [await away(20, 1), await away(120, 1), await away(120, 2)];
  assert.ok(long.sold > short.sold, `${long.sold} vs ${short.sold}`);
  assert.ok(fast.sold >= long.sold * .8, `${fast.sold} vs ${long.sold}`);
});
