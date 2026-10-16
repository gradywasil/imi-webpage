const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function environment(){const c={window:null,location:{search:'?lg01a=1&lg02=1&lg02lamp=1',origin:'http://127.0.0.1:49171'},URLSearchParams};c.window=c;c.__LG02_LAMP_TASK={origin:c.location.origin};vm.createContext(c);for(const f of ['vault.js','vault-play.js'])vm.runInContext(fs.readFileSync(f,'utf8'),c,{filename:f});return c;}
const state=()=>({printing:1,lamp:3,intro:{done:true},meta:{},rewards:{migration:{version:1},claims:{},storedGold:{tokens:{}}},prem:{version:1,earned:109,earnedTotal:109,bought:0,boughtTotal:0,spentEarned:0,spentBought:0,credits:{fixture:{source:'earned',amount:109}},unknown:{keep:true}},lastSeen:1000,unknown:{keep:'root'}});
const plain=x=>JSON.parse(JSON.stringify(x));
test('fixed 100 DB reservation is inactive and preserves unknown source fields',()=>{const c=environment(),s=state(),before=JSON.stringify(s),q=c.VaultPlay.review(s),n=c.VaultPlay.project(s,{kind:'reserve',quote:q},2000);assert.equal(JSON.stringify(s),before);assert.equal(n.prem.earned,9);assert.equal(n.prem.spentEarned,100);assert.equal(n.prem.vault.nextSequence,2);assert.deepEqual(plain(n.prem.vault.active),{});assert.equal(n.prem.vault.purchases['vault:1'].status,'undoable');assert.deepEqual(plain(n.unknown),s.unknown);assert.deepEqual(plain(n.prem.unknown),s.prem.unknown);assert.equal(c.Vault.validate(n).status,'valid');});
test('refund merges the recorded sources into current progress and keeps new earnings/history',()=>{const c=environment(),s=state(),reserved=c.VaultPlay.project(s,{kind:'reserve',quote:c.VaultPlay.review(s)},2000);reserved.prem.earned+=9;reserved.prem.earnedTotal+=9;reserved.prem.credits.newFirst={source:'earned',amount:9};reserved.rewards.claims.newFirst={status:'committed'};reserved.desks=[{letters:{A:57}}];reserved.prem.vault.purchases['vault:1'].unknownReceipt={keep:true};const n=c.VaultPlay.project(reserved,{kind:'refund',purchaseId:'vault:1'},3000);assert.equal(n.prem.earned,118);assert.equal(n.prem.earnedTotal,118);assert.equal(n.prem.spentEarned,0);assert.equal(n.prem.vault.nextSequence,2);assert.deepEqual(plain(n.desks),plain(reserved.desks));assert.deepEqual(plain(n.prem.credits),plain(reserved.prem.credits));assert.deepEqual(plain(n.rewards.claims),plain(reserved.rewards.claims));assert.deepEqual(plain(n.prem.vault.purchases['vault:1'].unknownReceipt),{keep:true});assert.equal(n.prem.vault.purchases['vault:1'].status,'refunded');assert.deepEqual(plain(n.prem.vault.owned),{});assert.deepEqual(plain(c.VaultPlay.project(n,{kind:'refund',purchaseId:'vault:1'},4000)),plain(n));});
test('activation is permanent, idempotent and supplies cap without changing efficiency inputs',()=>{const c=environment(),s=state(),r=c.VaultPlay.project(s,{kind:'reserve',quote:c.VaultPlay.review(s)},2000),n=c.VaultPlay.project(r,{kind:'activate',purchaseId:'vault:1'},3000);assert.equal(c.VaultPlay.cap(r),0);assert.equal(c.VaultPlay.cap(n),86400);assert.equal(n.lamp,3);assert.equal(n.prem.earned,9);assert.deepEqual(plain(c.VaultPlay.project(n,{kind:'activate',purchaseId:'vault:1'},4000)),plain(n));n.printing++;n.lamp=0;assert.equal(c.VaultPlay.cap(n),86400);assert.equal(c.Vault.oldEffects(n).capSeconds,86400);assert.equal(c.Vault.oldEffects(state()).capSeconds,57600);});
test('changed quote, hidden store and missing ordinary prerequisites refuse before projection',()=>{const c=environment(),s=state(),q=c.VaultPlay.review(s);for(const mutate of [x=>x.lamp=2,x=>x.prem.earned=108,x=>x.printing=2,x=>x.intro.done=false]){const n=state();mutate(n);const before=JSON.stringify(n);assert.throws(()=>c.VaultPlay.project(n,{kind:'reserve',quote:q},2000));assert.equal(JSON.stringify(n),before);}const n=c.VaultPlay.project(s,{kind:'settings',hideStore:true},2000);assert.equal(n.prem.vault.settings.hideStore,true);assert.throws(()=>c.VaultPlay.review(n));});

// Actual net functions with controlled DOM/clock/selection-write collaborators.
function netComponent(kind='golden') {
  const source=fs.readFileSync('automation.js','utf8'),state=source.slice(source.indexOf('  const netItems ='),source.indexOf('  const restoreSetting ='));
  const functions=source.slice(source.indexOf('  function netReady()'),source.indexOf('  function netStatus()'));
  const lifecycle=source.slice(source.indexOf('    netHold(lease)'),source.indexOf('    actions:',source.indexOf('    netHold(lease)')));
  const c={now:1000,ready:true,visible:true,phase:0,writes:0,claims:0,pending:null,api:{masteryActive:()=>false,automationAllowed:()=>c.ready,clock:{productionNow:()=>c.now},mark(){}},document:{hidden:false,querySelector:()=>null},IMI:{screen:()=> 'game',tour:{active:()=>false},ops:{progression:{running:()=>true}}},window:{},innerWidth:360,innerHeight:560,
    challengeControl:()=>false,netUnlocked:()=>true,supported:()=>true,saved:()=>({net:{version:1,enabled:true,[kind]:c.phase}}),netSetting:()=>({version:1,enabled:true,[kind]:c.phase}),suspended:new Set(),getComputedStyle:()=>({visibility:c.visible?'visible':'hidden',display:'block'}),sampleUpdate(){},museElapsed:0,mediaElapsed:0,pitchElapsed:0,gardenElapsed:0,
    write:p=>{c.phase=p.next.net[kind];c.writes++;}};
  vm.createContext(c);vm.runInContext(state+functions+';this.hooks={'+lifecycle+'};this.service=serviceNet;this.observe=observeNet;this.cancel=cancelNet;this.slots=netItems;this.disable=editNet;',c);
  const item={el:{isConnected:true,closest:()=>null,getBoundingClientRect:()=>({width:48,height:48,left:100,top:100,right:148,bottom:148})},valid:()=>c.ready,claim:()=>c.claims++};
  c.hooks.netCreated(kind,item);c.service({replay:false});return {c,item,kind};
}
test('both net kinds retain same admitted phase/start/dwell through hold callbacks and release once',()=>{
  for(const kind of ['ordinary','golden']){
    const {c,item}=netComponent(kind),slot=c.slots[kind],lease={id:1,mono:1200};assert.equal(c.phase,1);assert.equal(c.writes,1);assert.equal(slot.admitted,true);
    c.now=1200;c.hooks.netHold(lease);c.ready=false;c.visible=false;c.cancel();c.observe();c.service({replay:true});
    assert.equal(c.slots[kind],slot);assert.equal(slot.item,item);assert.equal(slot.at,1000);assert.equal(c.phase,1);assert.equal(c.claims,0);
    c.hooks.netRelease({id:1});c.cancel();assert.equal(c.slots[kind],slot);
    c.ready=true;c.visible=true;c.hooks.netRelease(lease);c.hooks.netRelease(lease);
    c.now=1999;c.service({replay:false});assert.equal(c.claims,0);c.now=2000;c.service({replay:false});c.service({replay:false});assert.equal(c.claims,1);assert.equal(c.writes,1);assert.equal(c.slots[kind],null);
  }
});
test('held net disposes disconnected/replaced/cleared objects, disable and departure without resurrection',()=>{
  for(const action of ['removed','replaced','cleared','disable','departure']){
    const {c,item,kind}=netComponent(),lease={id:1};c.hooks.netHold(lease);c.ready=false;
    if(action==='removed'){item.el.isConnected=false;c.observe();}
    if(action==='replaced')c.hooks.netCreated(kind,{...item});
    if(action==='cleared')c.hooks.netCleared(kind,item);
    if(action==='disable')c.disable();
    if(action==='departure')c.hooks.netDispose();
    assert.equal(c.slots[kind],null,action);c.hooks.netRelease(lease);c.ready=true;c.now=5000;c.service({replay:false});assert.equal(c.claims,0,action);
  }
});
test('ordinary nonlamp cancellation still discards and never pays a stale slot',()=>{const {c,kind}=netComponent();c.cancel();assert.equal(c.slots[kind],null);c.now=4000;c.service({replay:false});assert.equal(c.claims,0);});

test('lamp old-work replay preserves admitted slot before any hold while ordinary replay cancels',()=>{const {c,kind}=netComponent();const slot=c.slots[kind];c.window.VaultPlay={enabled:()=>true};c.window.Rewards={localDisposition:()=> 'preserve'};c.ready=false;c.service({replay:true});assert.equal(c.slots[kind],slot);assert.equal(c.writes,1);assert.equal(c.claims,0);delete c.window.VaultPlay;c.service({replay:true});assert.equal(c.slots[kind],null);});

test('closing observer sees temporarily hidden resumed node without discarding or readmitting it',()=>{const {c,kind}=netComponent(),slot=c.slots[kind],lease={id:1};c.hooks.netHold(lease);c.ready=false;c.visible=false;c.hooks.netRelease(lease);c.observe();c.cancel();assert.equal(c.slots[kind],slot);c.ready=true;c.service({replay:false});assert.equal(c.slots[kind],slot);assert.equal(c.claims,0);c.visible=true;c.now=1999;c.service({replay:false});assert.equal(c.claims,0);c.now=2000;c.service({replay:false});assert.equal(c.claims,1);assert.equal(c.writes,1);});

test('departure during the resume visibility handoff forcibly disposes the retained slot',()=>{const {c,kind}=netComponent(),lease={id:1};c.hooks.netHold(lease);c.hooks.netRelease(lease);assert.equal(c.slots[kind].resuming,true);c.hooks.netDispose();assert.equal(c.slots[kind],null);c.now=5000;c.service({replay:false});assert.equal(c.claims,0);const source=fs.readFileSync('automation.js','utf8');assert(source.includes("gardenNotice = ''; netLease = null; cancelNet(true); elapsed"));});
