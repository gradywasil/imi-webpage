// Documented headless screenshot workflow, independent profile/save; native T3 UI was checked first.
import {readFile,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import assert from 'node:assert/strict';
import {setTimeout as wait} from 'node:timers/promises';
const out='docs/plan/long-game/evidence/LG-03/implementation-a3-r1';
const {default:puppeteer}=await import(pathToFileURL(process.env.PUPPETEER_MODULE).href);
const browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--no-sandbox']});
const screens=[],errors=[];
try {
  const fixture=JSON.parse(await readFile(`${out}/functional-details.json`)).save;
  fixture.meta.automation.shop.enabled=false;
  for(const desk of Object.values(fixture.meta.automation.desks))desk.enabled=false;
  for(const edition of ['pixel','classic'])for(const [width,height] of [[1280,800],[360,560]]) {
    const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));
    await page.setBypassServiceWorker(true);await page.setViewport({width,height});
    await page.evaluateOnNewDocument(s=>{s.lastSeen=Date.now();s.daily={last:new Date().toDateString(),streak:1};localStorage.setItem('imi-ops-v1',JSON.stringify(s));localStorage.setItem('imi-score',JSON.stringify({economyVersion:1,score:50000000}));localStorage.setItem('imi-tour',JSON.stringify({version:2,done:true,tipsOff:true,tips:{}}));},fixture);
    await page.goto(`http://127.0.0.1:8356/${edition==='pixel'?'index':'classic'}.html?lg03=1#play`);
    await page.waitForFunction(()=>!!window.IMI?.ops?.extensions);
    await page.evaluate(()=>IMI.ops.extensions.setTab('automation'));
    await page.waitForSelector('.lg03-shop');
    await wait(1500); // Let the existing pane entrance animation finish before geometry/screenshots.
    const layout=await page.evaluate(()=>{
      const pane=document.getElementById('o-automation');
      return {width:innerWidth,height:innerHeight,pageWidth:document.documentElement.scrollWidth,pageHeight:document.documentElement.scrollHeight,pane:{height:pane.clientHeight,scrollHeight:pane.scrollHeight,width:pane.clientWidth,scrollWidth:pane.scrollWidth},targets:[...pane.querySelectorAll('button,select')].map(e=>({label:e.getAttribute('aria-label')||e.textContent,width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height})),media:{reduce:matchMedia('(prefers-reduced-motion: reduce)').matches,low:document.documentElement.dataset.quality||null}};
    });
    assert.ok(layout.pageWidth<=width&&layout.pageHeight<=height,'page scroll');
    assert.ok(layout.pane.scrollWidth<=layout.pane.width,'pane horizontal scroll');
    assert.ok(layout.targets.every(t=>t.width>=40&&t.height>=40),'targets');
    await page.screenshot({path:`${out}/${edition}-${width}-top.png`});
    await page.evaluate(()=>{const p=document.getElementById('o-automation');p.scrollTop=document.querySelector('.lg03-priority').offsetTop-p.offsetTop;});
    await page.screenshot({path:`${out}/${edition}-${width}-priority.png`});
    await page.evaluate(()=>{const p=document.getElementById('o-automation');p.scrollTop=p.scrollHeight;});
    await page.screenshot({path:`${out}/${edition}-${width}-hire.png`});
    screens.push({edition,layout,fixture:'Printing4 controlled save, shop/A1 off. CSS viewport only, desktop UA; carried default media, no emulation.'});
    await page.close();
  }
  assert.deepEqual(errors,[]);
  await writeFile(`${out}/screens.json`,JSON.stringify({screens,errors,complete:true},null,2));
} catch(e) {
  await writeFile(`${out}/screens-first-failure.json`,JSON.stringify({screens,errors,failure:e.stack},null,2),{flag:'wx'}).catch(()=>{});throw e;
} finally {await browser.close();}
console.log(JSON.stringify(screens.map(s=>({edition:s.edition,width:s.layout.width,scroll:s.layout.pane,targets:s.layout.targets.length})),null,2));
