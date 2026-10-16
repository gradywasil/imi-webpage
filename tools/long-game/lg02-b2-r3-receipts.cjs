const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const out='docs/plan/long-game/evidence/LG-02/tutorial-repair-b2-r3';
const read=name=>JSON.parse(fs.readFileSync(out+'/'+name,'utf8').replace(/^\uFEFF/,''));
const rows=[];
for(const edition of ['pixel','classic'])for(const [width,height]of [[1280,800],[390,700],[360,560]]){
 const prefix='current-'+edition+'-'+width+'x'+height;
 const values={};for(const phase of ['normal','held','pointer-failed','restored','blocked'])values[phase]=read(prefix+'-'+phase+'.json').structuredContent.value;
 const {normal,held,restored,blocked}=values,failed=values['pointer-failed'];
 assert.equal(held.held,true);assert.equal(failed.held,true);assert.equal(held.bubbleHidden,true);assert.equal(failed.bubbleHidden,true);assert.equal(held.ringHidden,true);
 assert.equal(held.continued,0);assert.equal(failed.continued,0);assert.deepEqual(failed.keys,held.keys);assert.equal(failed.tourRaw,held.tourRaw);assert.equal(failed.chips,held.chips);
 assert.equal(held.hits.length,5);assert.equal(held.hits.every(h=>h.retry),true);assert.equal(failed.hits.every(h=>h.retry),true);assert.equal(held.button.h>=40,true);assert.equal(held.button.w>=40,true);
 assert.equal(held.chipsInside,true);assert.deepEqual(held.order,['o-writer-content','BUTTON']);assert.match(failed.focus,/BUTTON:Retry/);
 assert.equal(restored.held,false);assert.equal(restored.continued,1);assert.equal(restored.bubbleHidden,false);assert.equal(restored.intro,true);assert.equal(restored.tourRaw,normal.tourRaw);assert.equal(restored.text,normal.text);
 for(const value of [normal,held,failed,restored])assert.deepEqual(value.page,[width,height,0,0]);
 assert.equal(blocked.blocked,true);assert.equal(blocked.ops,false);assert.deepEqual(blocked.page,[width,height]);
 // Resumed play and normal pagehide legitimately save after the restored capture.
 // Exact gate preservation is separately captured from inert planted acknowledged bytes.
 const gate=read('blocked-byte-'+edition+'-'+width+'x'+height+'.json');assert.deepEqual(gate.actual.keys,gate.planted);assert.equal(gate.actual.blocked,true);assert.equal(gate.actual.ops,false);
 rows.push({edition,width,height,pass:true,retry:held.button,internal:held.internal,restoredStep:JSON.parse(restored.tourRaw).step});
}
const enlarged=[];
for(const edition of ['pixel','classic']){
 const v=read('enlarged-'+edition+'-internal-key-scroll.json').structuredContent.value;
 assert.equal(v.internal[1]>v.internal[0],true);assert.equal(v.internal[2]>0,true);assert.deepEqual(v.page,[390,700,0,0]);assert.equal(v.hits.every(h=>h.retry),true);assert.equal(v.bubbleHidden,true);
 enlarged.push({edition,internal:v.internal,page:v.page,pass:true,qualification:'200% held-content DOM text fixture; no native zoom/physical-device proof'});
}
const jsonFiles=[];
function walk(root){for(const entry of fs.readdirSync(root,{withFileTypes:true})){const file=path.join(root,entry.name);if(entry.isDirectory())walk(file);else if(entry.name.endsWith('.json')){JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''));jsonFiles.push({file:path.relative(out,file).replaceAll('\\','/'),sha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')});}}}
walk(out);
fs.writeFileSync(out+'/receipt-readback-audit.json',JSON.stringify({rows,enlarged,jsonFiles,coverage:'Read-back validation of actual native receipts. Original r2/HOLD/command qualification remains unchanged.'},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({nativeMatrix:rows.length,enlarged:enlarged.length,validJSON:jsonFiles.length}));
