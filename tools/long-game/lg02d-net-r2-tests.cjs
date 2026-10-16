const fs=require('node:fs'),assert=require('node:assert/strict');
const f='tests/vault-lamp-admission.test.cjs';let s=fs.readFileSync(f,'utf8');const start=s.indexOf('test("unleased net');assert(start>=0);s=s.slice(0,start)+`test('completed net prerequisite retains restricted runtime admission',()=>{const {c}=setup(),s=empty(c);assert.equal(c.VaultPlay.available(),true);assert.equal(c.VaultPlay.rawCheck(JSON.stringify(s),JSON.stringify({economyVersion:1,score:0})),true);delete c.__LG02_LAMP_TASK;assert.equal(c.VaultPlay.enabled(),false);assert.equal(c.VaultPlay.rawCheck(JSON.stringify(s),JSON.stringify({economyVersion:1,score:0})),false);});

test('Ops notifies net before native hiding and releases after clock compensation and native resume',()=>{
  const s=fs.readFileSync('ops.js','utf8'),hold=s.slice(s.indexOf('  function lampHold('),s.indexOf('  const lampPending'));
  assert(hold.indexOf("netHold(lease)")<hold.indexOf('goldObject?.hold(lease)'));
  assert(hold.indexOf('productionExtra -= elapsed')<hold.indexOf('netRelease(lease)'));
  assert(hold.indexOf('vaultResume(lease)')<hold.indexOf('netRelease(lease)'));
  assert(s.includes("netDispose(); IMI.pickups?.clear(true); goldObject?.dispose()"));
});
`;fs.writeFileSync(f,s);
fs.appendFileSync('tests/vault-lamp.test.cjs',`
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
`);
