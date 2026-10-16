// Frozen pre-edit balance code replay for the separate opt-in/no-Vault controls.
// This is not a retroactive native Core BEFORE capture.
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const out='docs/plan/long-game/evidence/LG-02/implementation-b2-r2';
const leaf='tools/long-game/fixture-lg02-b2-r2-20261013';
const original=fs.readFileSync(out+'/before/source/tools/balance.html','utf8'),routes=[];
const html=original.replace('<!doctype html>','<!doctype html><base href="/tools/">').replace(/src="([^"]+)"/g,(match,src)=>{
  const file=new URL(src,'http://fixture/tools/balance.html').pathname.slice(1),frozen=out+'/before/source/'+file;
  const target=fs.existsSync(frozen)?frozen:file;
  routes.push({original:src,target,sha256:createHash('sha256').update(fs.readFileSync(target)).digest('hex'),frozen:target===frozen});
  return 'src="/'+target+'"';
});
fs.mkdirSync(leaf,{recursive:true});fs.writeFileSync(leaf+'/before-balance-r2.html',html,{flag:'wx'});
fs.writeFileSync(out+'/opt-in-frozen-replay-routing-r2.json',JSON.stringify({coverage:'post-edit frozen-code replay; original /tools base also governs dynamically-created Bot scripts; immutable nonleased dependencies remain current',routes},null,2)+'\n',{flag:'wx'});
