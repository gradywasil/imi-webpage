import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
const {default:puppeteer}=await import(pathToFileURL(process.env.PUPPETEER_MODULE).href);
export const out='docs/plan/long-game/evidence/LG-02/tutorial-repair-b2-r3';
export const browser=()=>puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--no-sandbox']});
export const holdExpression="(()=>{window.__r3Continued=0;window.__r3Writes=[];window.__r3Reject=2;window.__r3Opened=false;window.__r3Set=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){let p;try{p=JSON.parse(v);}catch{}if(k==='imi-ops-v1'&&p?.prem?.vault?.transition)__r3Opened=true;if(k==='imi-ops-v1'&&__r3Opened&&p?.prem?.vault&&!p.prem.vault.transition&&window.__r3Reject>0){window.__r3Reject--;__r3Writes.push({key:k,raw:v,rejected:true});throw new DOMException(\"Task closing storage failure. The acknowledged historical boundary is waiting for its separate closing save. The acknowledged historical boundary is waiting for its separate closing save. The acknowledged historical boundary is waiting for its separate closing save. The acknowledged historical boundary is waiting for its separate closing save. The acknowledged historical boundary is waiting for its separate closing save. \",'QuotaExceededError');}__r3Writes.push({key:k,raw:v,rejected:false});return __r3Set.call(this,k,v);};return {accepted:Rewards.runLocalTransaction({id:'boundary:tour-r-three',kind:'settlement',settle:IMI.ops.extensions.vaultBoundary,build:p=>p,continue:()=>{__r3Continued++;}}),held:Rewards.held(),continued:__r3Continued};})()";
export async function fixture(browser,{edition='pixel',flags='lg01a=1&lg02=1',tip=false,reduce=false,track=false,startupHold=false}={}){
 const context=await browser.createBrowserContext(),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.setViewport({width:390,height:700});
 if(reduce)await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
 await page.evaluateOnNewDocument(({tip,track,startupHold})=>{
  localStorage.setItem('imi-fx','low');
  if(tip)localStorage.setItem('imi-ops-v1',JSON.stringify({intro:{version:1,done:true,train:true,words:true,shop:true,hireAt:0},lastSeen:Date.now()}));
  if(startupHold){const set=Storage.prototype.setItem;window.__r3StartupReject=1;Storage.prototype.setItem=function(k,v){if(k==='imi-ops-v1'&&__r3StartupReject-->0)throw new DOMException('Actual startup migration failure','QuotaExceededError');return set.call(this,k,v);};}
  if(track){const Observer=MutationObserver;window.__r3Observers=[];window.MutationObserver=class extends Observer{constructor(fn){super(fn);this.targets=[];this.disconnected=false;__r3Observers.push(this);}observe(node,options){this.targets.push({className:node.className,tag:node.tagName,options});return super.observe(node,options);}disconnect(){this.disconnected=true;return super.disconnect();}};}
 },{tip,track,startupHold});
 await page.goto('http://127.0.0.1:8313/'+(edition==='pixel'?'index':'classic')+'.html?s='+edition+'&'+flags+'&r3=functional#play');
 await page.waitForFunction(()=>!!window.IMI?.tour&&!!window.IMI?.ops);
 await page.waitForFunction(()=>!document.querySelector('.tour-bub').hidden||!IMI.ops.introActive()||window.Rewards?.held?.());
 return {page,errors,close:()=>context.close()};
}
export async function capture(f,name){const value=await f.page.evaluate(()=>({owner:Rewards.owns?.(),held:Rewards.held?.(),intro:IMI.ops.introActive(),tour:localStorage.getItem('imi-tour'),text:document.querySelector('.tour-txt').textContent,bubbleHidden:document.querySelector('.tour-bub').hidden,ringHidden:document.querySelector('.tour-ring').hidden,continued:window.__r3Continued,writes:window.__r3Writes,keys:[localStorage.getItem('imi-ops-v1'),localStorage.getItem('imi-score')]}));fs.writeFileSync(out+'/test-'+process.env.LG02_B2_R3_RUN+'-'+name+'.json',JSON.stringify({coverage:'actual full-shell APIs; isolated headless functional checks; synthetic departure is not native lifecycle proof',errors:f.errors,...value},null,2)+'\n',{flag:'wx'});return value;}
