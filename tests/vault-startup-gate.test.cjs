const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const source = name => readFileSync(name, 'utf8');
function page(raw, search = '', readFailure = false) {
  const writes = [], reads = [], events = {}, children = [], navigations = [];
  const records = new Map([['imi-score','{"economyVersion":1,"score":75,"unknown":"kept"}'],['other','kept']]);
  if(raw !== null) records.set('imi-ops-v1',raw);
  const node = () => ({ children:[], listeners:{}, setAttribute(){}, append(...n){this.children.push(...n);}, addEventListener(k,f){this.listeners[k]=f;},focus(){this.focused=true;} });
  const c = { URL, URLSearchParams, Intl, console, location:{search,href:'http://127.0.0.1:8173/index.html'+search+'#play',reload:()=>navigations.push('reload'),replace:url=>navigations.push(url)},
    localStorage:{getItem:k=>{reads.push(k);if(readFailure)throw Error('Storage inaccessible');return records.get(k)??null;},setItem:(...a)=>writes.push(['set',...a]),removeItem:k=>writes.push(['remove',k]),clear:()=>writes.push(['clear'])},
    document:{readyState:'loading',documentElement:{dataset:{}},createElement:node,body:{children,appendChild:n=>children.push(n)},addEventListener:(k,f)=>{events[k]=f;},querySelector:()=>null},
    matchMedia:()=>({matches:false}), addEventListener(){}, navigator:{locks:{request(){throw Error('Unexpected lock');}}},
    setTimeout(){throw Error('Unexpected timer');},setInterval(){throw Error('Unexpected timer');},requestAnimationFrame(){throw Error('Unexpected frame');}
  };
  c.window=c; vm.createContext(c); vm.runInContext(source('vault-save-gate.js'),c);
  return {c,writes,reads,events,children,navigations,records,run:name=>vm.runInContext(source(name),c)};
}
for(const [name,raw,blocked] of [
  ['no save',null,false],['legacy','{}',false],['optional namespaces','{"meta":{},"rewards":{},"prem":{}}',false],
  ['unknown ordinary fields','{"prem":{"future":true},"unknown":{"vault":1}}',false],
  ['nonobject null','null',false],['nonobject number','25',false],['nonobject string','"legacy"',false],['nonobject array','[]',false],
  ['empty Vault','{"prem":{"vault":{}}}',true],['null Vault','{"prem":{"vault":null}}',true],
  ['unknown version','{"prem":{"vault":{"version":99}}}',true],['recognized version','{"prem":{"vault":{"version":1}}}',true],
  ['malformed Vault','{"prem":{"vault":"unknown"}}',true],['malformed JSON','{',true],
  ['null prem','{"prem":null}',true],['array prem','{"prem":[]}',true],['scalar prem','{"prem":7}',true]
]) test('cold recognition: '+name,()=>{
  const f=page(raw); assert.equal(f.c.VaultSaveGate.blocked,blocked);assert.deepEqual(f.writes,[]);assert.deepEqual(f.reads,['imi-ops-v1']);
  assert.equal(f.records.get('imi-ops-v1')??null,raw);
});
test('storage read failure blocks without a second read or writer',()=>{const f=page(null,'',true);assert.equal(f.c.VaultSaveGate.blocked,true);assert.deepEqual(f.writes,[]);assert.deepEqual(f.reads,['imi-ops-v1']);});
for(const search of ['', '?lg01a=1','?lg02=1','?lg01a=1&lg02=1']) test('actual blocked callers and direct entries '+search,()=>{
  const f=page('{"prem":{"vault":{"version":1}},"unknown":"kept"}',search), before=[...f.records];
  f.run('rewards.js'); f.run('economy.js'); f.run('core.js');
  assert.equal(f.c.Rewards.enabled,false);
  for(const name of ['app.js','ops.js','pickups.js','tour.js','pixel-fx.js']) f.run(name);
  assert.equal(f.c.IMI,undefined);assert.equal(f.c.__OPS_EXTENSIONS,undefined);
  assert.throws(()=>f.c.Core.boot({edition:'pixel'}),/Vault save blocked/);
  for(const method of ['loadScore','loadState']) assert.throws(()=>f.c.Economy[method](),/requires save ownership/);
  assert.equal(f.c.Economy.saveScore(0).ok,false);
  assert.equal(f.c.Economy.saveScoreAcknowledged(0,null).ok,false);
  assert.equal(f.c.Economy.saveStateAcknowledged({}).ok,false);
  assert.equal(f.c.Economy.creditReward(75,{id:'reset',sequence:1,previous:0,amount:25}).ok,false);
  for(const shell of ['index.html','tools/balance.html']) for(const match of source(shell).matchAll(/<script>([\s\S]*?)<\/script>/g)) vm.runInContext(match[1],f.c);
  f.c.startBalance(); // The real clear/load boundary also refuses direct invocation.
  assert.deepEqual(f.writes,[]);assert.deepEqual([...f.records],before);assert.deepEqual(f.reads,['imi-ops-v1']);
});
for(const search of ['', '?lg01a=1','?lg02=1']) test('Resume replaces the same edition, preserves unrelated query/hash '+search,()=>{
  const f=page('{"prem":{"vault":{"version":1}}}',search+(search?'&':'?')+'other=kept');f.events.DOMContentLoaded();
  const action=f.children[0].children.at(-1);assert.equal(action.textContent,'Resume');assert.equal(action.focused,true);action.listeners.click();
  const url=new URL(f.navigations[0]);assert.equal(url.pathname,'/index.html');assert.equal(url.searchParams.get('other'),'kept');assert.equal(url.searchParams.get('lg01a'),'1');assert.equal(url.searchParams.get('lg02'),'1');assert.equal(url.hash,'#play');assert.deepEqual(f.writes,[]);
});
for(const raw of ['{','{"prem":{"vault":null}}','{"prem":{"vault":{"version":99}}}','{"prem":{"vault":{"version":1}}}']) test('generic fresh Retry without validator or reset: '+raw,()=>{
  const f=page(raw,'?lg01a=1&lg02=1');f.events.DOMContentLoaded();const panel=f.children[0],action=panel.children.at(-1);
  assert.equal(action.textContent,'Retry');assert.equal(panel.children[1].children[0].textContent,'This save cannot be opened safely. Your saved data has not been changed.');action.listeners.click();assert.deepEqual(f.navigations,['reload']);assert.deepEqual(f.writes,[]);
  f.records.set('imi-ops-v1','{}');assert.equal(f.c.VaultSaveGate.blocked,true);assert.equal(page(f.records.get('imi-ops-v1')).c.VaultSaveGate.blocked,false);
});
test('no-Vault flags retain real LG01 enable behavior without Vault namespace',()=>{
  for(const search of ['','?lg02=1','?lg01a=1','?lg01a=1&lg02=1']) {
    const f=page('{"prem":{}}',search);f.run('rewards.js');assert.equal(f.c.Rewards.enabled,search.includes('lg01a=1'));assert.deepEqual(f.writes,[]);assert.equal(f.c.VaultSaveGate.blocked,false);
  }
});
test('absence is a cold observation; current/current and stale writers are unsupported',()=>{
  const f=page('{}');f.records.set('imi-ops-v1','{"prem":{"vault":{"version":1}}}');assert.equal(f.c.VaultSaveGate.blocked,false);
  // This deliberately documents the unsupported admission race, not successful exclusion.
  assert.equal(page(f.records.get('imi-ops-v1')).c.VaultSaveGate.blocked,true);
});
