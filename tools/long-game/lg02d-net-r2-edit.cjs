const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process'),assert=require('node:assert/strict');
const out='docs/plan/long-game/evidence/LG-02/free-lamp-net-r2',prior='docs/plan/long-game/evidence/LG-02/free-lamp-r1';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
fs.mkdirSync(out,{recursive:true});
const four=['automation.js','ops.js','vault-play.js','sw.js'];
const historical=JSON.parse(fs.readFileSync(prior+'/before-source.json'));
assert.equal(hash(fs.readFileSync('automation.js')),historical['automation.js'].sha256);
const blocked=JSON.parse(fs.readFileSync(prior+'/closure-blocked-r2/source-final.json'));
for(const f of four.filter(f=>f!=='automation.js'))assert.equal(hash(fs.readFileSync(f)),blocked[f].sha256,f);
const manifest={};for(const f of [...Object.keys(historical),'vault-play.js','tests/vault-lamp.test.cjs','tests/vault-lamp-admission.test.cjs']){const b=fs.readFileSync(f);manifest[f]={bytes:b.length,sha256:hash(b)};if(four.includes(f)||f.startsWith('tests/')){fs.mkdirSync(path.dirname(out+'/before/'+f),{recursive:true});fs.writeFileSync(out+'/before/'+f,b,{flag:'wx'});}}
fs.writeFileSync(out+'/before-source.json',JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
fs.writeFileSync(out+'/before-identity.json',JSON.stringify({automationEarlierProtectedEqual:true,blockedFourMatch:true,branch:cp.execFileSync('git',['branch','--show-current'],{encoding:'utf8'}).trim(),head:cp.execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),index:hash(fs.readFileSync('.git/index')),status:cp.execFileSync('git',['status','--porcelain=v1'],{encoding:'utf8'}),prerequisite:'Automation owns admitted net slot separately from native object. Lease hold before progression stop/native hiding; retain connected slots through callbacks; release after productive clock compensation; dispose on actual departure/removal/disable. No slot.at compensation. No additional unowned dependency.'},null,2)+'\n',{flag:'wx'});
function edit(f,from,to){const b=fs.readFileSync(f),s=b.toString('utf8');assert.equal(s.split(from).length,2,f+': '+from);fs.writeFileSync(f,s.replace(from,to));}
edit('automation.js','  const cancelNet = () => { netItems.ordinary = netItems.golden = null; };',`  let netLease = null;
  const cancelNet = (force = false) => {
    for (const kind of ['ordinary', 'golden']) {
      if (!netLease || force === true || !netItems[kind]?.item.el.isConnected) netItems[kind] = null;
    }
  };`.replaceAll('\n','\r\n'));
edit('automation.js',"gardenNotice = ''; cancelNet(); elapsed", "gardenNotice = ''; netLease = null; cancelNet(); elapsed");
edit('automation.js',"if (id === 'net') cancelNet();", "if (id === 'net') cancelNet(true);");
edit('automation.js',"    cancelNet();\r\n    if (!enabled)","    cancelNet(true);\r\n    if (!enabled)");
edit('automation.js',"    if (!netReady()) return cancelNet();\r\n    for (const kind", "    if (netLease || !netReady()) return cancelNet();\r\n    for (const kind");
edit('automation.js',"    if (replay || !netReady()) return cancelNet();", "    if (netLease || replay || !netReady()) return cancelNet();");
edit('automation.js',"    netBlocked:cancelNet,",`    netHold(lease) { if (!netLease) netLease = lease; },
    netRelease(lease) { if (netLease === lease) { cancelNet(); netLease = null; } },
    netDispose() { netLease = null; cancelNet(); },
    netBlocked:cancelNet,`.replaceAll('\n','\r\n'));
edit('automation.js',"      if (netReady() && item.valid() && itemLiveDOM(item)) netItems[kind] = {item, admitted:false};", "      if (netLease) { if (netItems[kind]?.item !== item) netItems[kind] = null; return; }\r\n      if (netReady() && item.valid() && itemLiveDOM(item)) netItems[kind] = {item, admitted:false};");
edit('ops.js',"    goldObject?.hold(lease); IMI.pickups?.vaultHold(lease);", "    extensions.get('automation')?.netHold(lease);\n    goldObject?.hold(lease); IMI.pickups?.vaultHold(lease);");
edit('ops.js',"    goldObject?.resume(lease); IMI.pickups?.vaultResume(lease);", "    goldObject?.resume(lease); IMI.pickups?.vaultResume(lease);\n    extensions.get('automation')?.netRelease(lease);");
edit('ops.js',"IMI.pickups?.clear(true); goldObject?.dispose(); lampLifetime=null;", "extensions.get('automation')?.netDispose(); IMI.pickups?.clear(true); goldObject?.dispose(); lampLifetime=null;");
console.log('Captured immediate four-file bytes and protected owners; Automation matches original protected baseline. Applied net lifetime integration only. Readiness remains false.');

