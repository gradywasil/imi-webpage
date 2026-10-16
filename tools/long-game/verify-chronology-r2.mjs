import {readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const {default:puppeteer}=await import(pathToFileURL(process.env.PUPPETEER_MODULE).href);
const browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,protocolTimeout:0});
const out='docs/plan/long-game/evidence/LG-00/repair-r2/';const evidence={cases:[],errors:[],httpErrors:[],sources:[]};
const specs=[
 {name:'ready-expiring',ready:8,left:10,away:60,done:false},
 {name:'ready-early-long-capped',ready:8,left:130,away:10800,done:true},
 {name:'insufficient-prefix',ready:7,left:130,away:10800,done:false},
 {name:'already-expired',ready:8,left:-1,away:60,done:false},
 {name:'newly-banked-prefix',ready:7,letters:true,left:1000,away:3600,done:true},
 {name:'newly-produced-prefix',ready:7,produce:true,left:1000,away:3600,done:true},
 {name:'newly-produced-after-expiry',ready:7,produce:true,left:10,away:600,done:false},
 {name:'non-timed',ready:8,challenge:'hands',left:10,away:60,done:true}
];
try {for(const spec of specs){const page=await browser.newPage();page.on('pageerror',e=>evidence.errors.push(e.message));page.on('response',r=>{if(r.status()>=400&&!r.url().endsWith('/favicon.ico'))evidence.httpErrors.push({url:r.url(),status:r.status()});});await page.goto('http://127.0.0.1:8148/tools/balance.html?r2-cases');
 const result=await page.evaluate(spec=>{const D=IMI.ops.dev,s=D.S(),events=[];IMI.ops.extensions.register('r2-clock',{speed:()=>2,challenge:e=>events.push({...e,bank:{...s.bank},sold:D.soldCount()})});s.intro.done=s.intro.words=s.intro.shop=true;s.pub={tier:3,on:true,rule:'any'};s.focus=null;s.autoFocus=true;const recipes=D.RECIPES.filter(r=>!r.gen&&!r.kid&&!r.lib).slice(0,8);for(const r of recipes.slice(0,spec.ready))for(const [w,n]of Object.entries(r.need))s.bank[w]=(s.bank[w]||0)+n;
 if(spec.letters||spec.produce){s.desks.forEach(d=>{d.owned=true;d.paws=spec.produce?12:1;if(spec.produce){d.up.fing=10;d.up.practice=5;d.mk=2;}d.keeper.owned=d.keeper.on=true;D.ensureCrew(d);d.crew.forEach(t=>t.talent=spec.produce?100:0.000001);});s.focus=recipes[7].id;for(const [w,n]of Object.entries(recipes[7].need)){const missing=n;s.desks[w.length<=3?0:w.length<=5?1:w.length<=7?2:w.length<=9?3:w.length<=11?4:5].keeper.targets[w]=n;if(spec.letters)for(const ch of w){const band=w.length<=3?0:w.length<=5?1:w.length<=7?2:w.length<=9?3:w.length<=11?4:5;const d=s.desks[band];d.letters[ch]=(d.letters[ch]||0)+missing;}else{const band=w.length<=3?0:w.length<=5?1:w.length<=7?2:w.length<=9?3:w.length<=11?4:5;s.desks[band].keeper.targets[w]=n;}}}
 D.touchBank();const initiallyReady=recipes.map(r=>D.canWrite(r));const id=spec.challenge||'timed';s.challenge={id,start:Date.now()-(1200-spec.left)*1000};const bankBefore={...s.bank};__skip(spec.away*1000);const progress=IMI.ops.simulateAway(spec.away);__advance(1000);return {recipes:recipes.map(r=>({id:r.id,need:r.need})),spec,initiallyReady,bankBefore,events,progress,done:!!s.chDone[id],active:!!s.challenge,sold:D.soldCount(),state:JSON.parse(JSON.stringify(s))};},spec);
 evidence.cases.push(result);assert.equal(result.done,spec.done,spec.name);assert.equal(result.active,false,spec.name);if(spec.name==='ready-expiring')assert.equal(result.progress.pubSold,8);await page.close();}
 }catch(e){evidence.errors.push(e.stack);process.exitCode=1;}finally{await browser.close();evidence.opsHash=createHash('sha256').update(await readFile('ops.js')).digest('hex');await writeFile(process.argv[2]||out+'chronology-cases-final-v2.json',JSON.stringify(evidence,null,2),{flag:'wx'});console.log(evidence.cases.map(c=>({name:c.spec.name,done:c.done,sold:c.sold,words:c.progress.words,events:c.events})));console.log(evidence.errors);}
