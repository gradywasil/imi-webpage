// Documented headless UI workflow after native T3 ordinary UI; isolated task origin/save/profile.
import {readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {setTimeout as wait} from 'node:timers/promises';
import assert from 'node:assert/strict';
const out='docs/plan/long-game/evidence/LG-03/implementation-a2-r1';
const {default:puppeteer}=await import(pathToFileURL(process.env.PUPPETEER_MODULE).href);
const browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--no-sandbox']});
const screens=[],errors=[];
try {
  const fixture=JSON.parse(await readFile(`${out}/functional-details.json`)).save;
  fixture.meta.automation.coach.enabled=false;
  fixture.meta.automation.shop.enabled=false;
  for(const d of Object.values(fixture.meta.automation.desks))d.enabled=false;
  for(const edition of ['pixel','classic'])for(const [width,height] of [[1280,800],[360,560]]) {
    const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));
    await page.setBypassServiceWorker(true);await page.setViewport({width,height});
    await page.evaluateOnNewDocument(s=>{s.lastSeen=Date.now();s.daily={last:new Date().toDateString(),streak:1};localStorage.setItem('imi-ops-v1',JSON.stringify(s));localStorage.setItem('imi-score',JSON.stringify({economyVersion:1,score:1e9}));localStorage.setItem('imi-tour',JSON.stringify({version:2,done:true,tipsOff:true,tips:{}}));},fixture);
    await page.goto(`http://127.0.0.1:8358/${edition==='pixel'?'index':'classic'}.html?lg03=1#play`);
    await page.waitForFunction(()=>!!window.IMI?.ops?.extensions?.automationCoachTargets);
    await page.evaluate(()=>IMI.ops.extensions.setTab('automation'));await page.waitForSelector('.lg03-coach');await wait(1500);
    const geometry=()=>page.evaluate(()=>{const p=document.getElementById('o-automation');return {width:innerWidth,height:innerHeight,pageWidth:document.documentElement.scrollWidth,pageHeight:document.documentElement.scrollHeight,pane:{height:p.clientHeight,scrollHeight:p.scrollHeight,width:p.clientWidth,scrollWidth:p.scrollWidth},targets:[...p.querySelectorAll('button,select')].map(e=>({label:e.getAttribute('aria-label')||e.textContent,width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height}))};});
    let layout=await geometry();assert.ok(layout.pageWidth<=width&&layout.pageHeight<=height,'page overflow');assert.ok(layout.pane.scrollWidth<=layout.pane.width,'pane horizontal overflow');assert.ok(layout.targets.every(t=>t.width>=40&&t.height>=40),'touch target');
    await page.screenshot({path:`${out}/${edition}-${width}-top.png`});
    await page.evaluate(()=>{const p=document.getElementById('o-automation'),c=document.querySelector('.lg03-coach');p.scrollTop+=c.getBoundingClientRect().top-p.getBoundingClientRect().top;});
    await page.screenshot({path:`${out}/${edition}-${width}-coach.png`});
    await page.click('[data-act="automation:coach-toggle"]');
    await page.waitForFunction(()=>document.querySelector('.lg03-coach [role="status"]').textContent.includes('Next eligible:'));
    await page.screenshot({path:`${out}/${edition}-${width}-enabled.png`});
    await page.click('[data-act="automation:coach-toggle"]');
    screens.push({edition,layout,fixture:'No Hands complete; all helpers initially Off; native Core; CSS viewport, desktop UA, normal media. Enabled next-target status captured; no media/device acceptance claim.'});
    await page.close();
  }
  assert.deepEqual(errors,[]);await writeFile(`${out}/screens.json`,JSON.stringify({complete:true,screens,errors},null,2));
  console.log(JSON.stringify(screens.map(s=>({edition:s.edition,width:s.layout.width,pane:s.layout.pane})),null,2));
} catch(e) {
  await writeFile(`${out}/screens-first-failure.json`,JSON.stringify({screens,errors,failure:e.stack},null,2),{flag:'wx'}).catch(()=>{});throw e;
} finally {await browser.close();}
