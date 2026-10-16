const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),test=require('node:test');
const catalogue=fs.readFileSync('awards-catalogue.js','utf8'),gateSource=fs.readFileSync('vault-save-gate.js','utf8');
const flags='?lg02funding=1&lg10awards=1&lg01a=1';
const load=search=>{const c={window:{},location:{search},URLSearchParams};vm.createContext(c);vm.runInContext(catalogue,c);return c.window.AwardsCatalogue;};
const gate=(state,search=flags,module=true)=>{const raw=JSON.stringify(state),c={window:{},location:{search},URLSearchParams,localStorage:{getItem:()=>raw},document:{documentElement:{dataset:{}},readyState:'loading',addEventListener(){}}};vm.createContext(c);if(module)vm.runInContext(catalogue,c);vm.runInContext(gateSource,c);assert.equal(c.localStorage.getItem(),raw);return c.window.VaultSaveGate.blocked;};
const metadata=()=>({version:1,policy:'lg02e-db-only-v1',historicalIds:[]});
test('funding needs all three opt-ins and keeps the accepted catalogue separate',()=>{
 for(const search of ['', '?lg02funding=1','?lg02funding=1&lg01a=1','?lg02funding=1&lg10awards=1','?lg10awards=1&lg01a=1'])assert.equal(load(search).funding.enabled,false);
 const C=load(flags),F=C.funding;assert(F.enabled);assert.equal(C.rows.length,10);assert.equal(C.policy,'lg10a-db-only-v1');assert.equal(F.rows.length,7);assert(Object.isFrozen(F.rows)&&F.rows.every(Object.isFrozen));assert.equal(new Set(F.rows.map(r=>r.id)).size,7);assert.equal(F.rows.reduce((n,r)=>n+r.amount,0),35);
 for(const r of F.rows){assert.equal(r.tier,2);assert.equal(r.kind,'D');assert.equal(r.amount,5);assert.equal(F.source('award:'+r.id),r);assert.equal(C.row(r.id),undefined);}
});
test('cold funding metadata requires module and flags, including an empty acknowledged history',()=>{
 const s={meta:{speedFundingAwards:metadata()}};assert.equal(gate(s),false);assert(gate(s,''));assert(gate(s,flags,false));
 for(const change of [m=>m.version=2,m=>m.policy='future',m=>m.historicalIds=['lg02e-future'],m=>m.historicalIds=['lg02e-stamps-four','lg02e-stamps-four']]){const v=structuredClone(s);change(v.meta.speedFundingAwards);assert(gate(v));}
});
test('every new source form and unknown funding namespace blocks before legacy writers',()=>{
 for(const field of ['awards','claims','credits','tokens','active'])for(const id of ['lg02e-stamps-four','lg02e-future']){
  const s={meta:{},awards:{},rewards:{claims:{},storedGold:{tokens:{}}},prem:{credits:{}}};
  if(field==='awards')s.awards[id]=true;
  if(field==='claims')s.rewards.claims['award:'+id]={};
  if(field==='credits')s.prem.credits['award:'+id]={source:'earned',amount:5};
  if(field==='tokens')s.rewards.storedGold.tokens['award:'+id]={status:'stored'};
  if(field==='active')s.rewards.activeGold={activationId:'award:'+id};
  assert(gate(s));assert(gate(s,''));assert(gate(s,flags,false));
 }
});
test('funding never accepts a gold token, alternate source spelling, or orphan bit',()=>{
 const F=load(flags).funding;
 for(const field of ['awards','claims','credits','tokens']){
  const s={meta:{speedFundingAwards:metadata()},awards:{},rewards:{claims:{},storedGold:{tokens:{}}},prem:{credits:{}}};
  if(field==='awards')s.awards['award:lg02e-stamps-four']=true;
  if(field==='claims')s.rewards.claims['lg02e-stamps-four']={};
  if(field==='credits')s.prem.credits['lg02e-stamps-four']={};
  if(field==='tokens')s.rewards.storedGold.tokens['award:lg02e-stamps-four']={};
  assert(gate(s));assert.throws(()=>F.validate(s,()=>{}));
 }
 const orphan={meta:{speedFundingAwards:metadata()},awards:{'lg02e-stamps-four':true}};assert.throws(()=>F.validate(orphan,()=>{}));
});
