const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const context = { window: {}, location: { search: '?pg02=1' }, URLSearchParams };
vm.createContext(context);
vm.runInContext(fs.readFileSync('training-pool.js', 'utf8'), context);
const pool = context.window.TrainingPool;

function reference(desks, required, reserves, cost) {
  const copies = structuredClone(desks);
  const floors = copies.map((desk, i) => Object.fromEntries(Object.entries(desk.letters).map(([ch, held]) => [ch, Math.min(held, required[i]?.[ch] || 0)])));
  const budgets = copies.map((desk, i) => desk.owned ? Object.values(desk.letters).reduce((a, b) => a + b, 0) - Math.max(Object.values(floors[i]).reduce((a, b) => a + b, 0), Math.ceil(Object.values(desk.letters).reduce((a, b) => a + b, 0) * (reserves?.desks?.[desk.id]?.reservePercent ?? 25) / 100)) : 0);
  const taken = {};
  for (let n = 0; n < cost; n++) {
    const piles = copies.flatMap((desk, i) => desk.owned ? Object.keys(desk.letters).map(ch => ({ i, ch, removable: Math.min(desk.letters[ch] - floors[i][ch], budgets[i]) })) : []);
    piles.sort((a, b) => b.removable - a.removable || a.i - b.i || a.ch.localeCompare(b.ch));
    if (!piles[0] || piles[0].removable <= 0) return null;
    const { i, ch } = piles[0];
    copies[i].letters[ch]--; budgets[i]--;
    taken[`${i}:${ch}`] = (taken[`${i}:${ch}`] || 0) + 1;
  }
  return taken;
}

const cases = [
  { name: 'equal piles and desk ties', desks: [{ id:'a', owned:true, letters:{ A:8, B:8 } }, { id:'b', owned:true, letters:{ A:8 } }], required: [{}, {}], reserves:undefined, costs:[0, 1, 7, 14] },
  { name: 'shared donor budget and protected B', desks: [{ id:'a', owned:true, letters:{ A:12, B:12, C:11 } }], required:[{ B:5 }], reserves:{ version:1, desks:{ a:{ reservePercent:50, enabled:false } } }, costs:[1, 7, 14, 18] },
  { name: 'Off donor and unowned exclusion', desks: [{ id:'a', owned:true, letters:{ Z:20 } }, { id:'b', owned:true, letters:{ A:5, B:5 } }, { id:'c', owned:false, letters:{ Z:100 } }], required:[{}, { A:3 }, {}], reserves:{ version:1, desks:{ a:{ enabled:false, reservePercent:25 }, b:{ reservePercent:40 } } }, costs:[1, 6, 14, 20] }
];
const results = [];
for (const c of cases) {
  const before = JSON.stringify(c.desks);
  for (const cost of c.costs) {
    const expected = reference(c.desks, c.required, c.reserves, cost);
    const actual = pool.plan(c.desks, c.required, c.reserves, cost);
    assert.equal(actual.ok, expected !== null, `${c.name} cost ${cost}`);
    if (expected) assert.deepEqual(Object.fromEntries(actual.deductions.map(x => [`${x.i}:${x.ch}`, x.n])), expected, `${c.name} cost ${cost}`);
    results.push({ name:c.name, cost, ok:actual.ok, deductions:actual.ok ? actual.deductions : null, chunks:actual.chunks || 0 });
  }
  assert.equal(JSON.stringify(c.desks), before, `${c.name} mutation`);
}
console.log(JSON.stringify(results, null, 2));
