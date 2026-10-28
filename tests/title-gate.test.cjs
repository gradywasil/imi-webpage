const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const os=require('node:os');
const root=path.resolve(__dirname,'..');

// The title's press-any-key gate (app.js): nothing plays before the press; the press starts the audio, the `title` tune and the opening; a returning visit
// in the same page load gets no gate; ?skipintro=1 and ?story=<id> bypass it; reduced motion skips the opening but keeps the gate and the music.
let puppeteer=null;
try{puppeteer=require(process.env.PUPPETEER_MODULE||'C:/Users/arran/pp/node_modules/puppeteer-core');}catch{ /* the browser fixtures need puppeteer-core outside the repo (see tools/test-runner.mjs) */ }
const run=puppeteer?test:test.skip;

async function withPage(fn,{reduced=false,query='',width=1280,height=800,mobile=false}={}){
 const server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost'),file=path.resolve(root,'.'+url.pathname);
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  fs.readFile(file,(err,b)=>{if(err){res.writeHead(404).end();return;}res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.svg':'image/svg+xml','.png':'image/png'})[path.extname(file)]||'application/octet-stream');res.end(b);});
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const origin=`http://127.0.0.1:${server.address().port}`,profile=fs.mkdtempSync(path.join(os.tmpdir(),'gate-profile-'));
 let browser;
 try{
  browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,userDataDir:profile,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});
  const page=await browser.newPage();page.setDefaultTimeout(20000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!/fonts\.g|ERR_|Failed to load resource/.test(m.text()))errors.push(m.text());});
  await page.setViewport({width,height,isMobile:mobile,hasTouch:mobile,deviceScaleFactor:mobile?2:1});
  if(reduced)await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}]);
  await page.evaluateOnNewDocument(()=>{ // count every oscillator the page schedules, so "music plays" is checked on the audio clock
   window.__notes=0;const start=OscillatorNode.prototype.start;OscillatorNode.prototype.start=function(){window.__notes++;return start.apply(this,arguments);};
  });
  await page.goto(origin+'/index.html'+query,{waitUntil:'load'});
  await page.waitForFunction(()=>window.IMI&&document.getElementById('menu'));
  await new Promise(r=>setTimeout(r,500));
  await fn(page,origin);
  assert.deepEqual(errors,[],'no console errors');
 }finally{if(browser)await browser.close().catch(()=>{});server.close();fs.rmSync(profile,{recursive:true,force:true});}
}
const state=page=>page.evaluate(()=>{const m=document.getElementById('menu'),g=document.getElementById('gate');return{gate:!g.hidden&&getComputedStyle(g).display!=='none',intro:m.classList.contains('intro'),settled:m.classList.contains('ui-in')&&!m.classList.contains('intro'),music:IMI.music.current(),wanted:IMI.music.wanted(),notes:window.__notes,story:document.documentElement.classList.contains('story-on'),screen:IMI.screen(),focus:document.activeElement&&document.activeElement.id};});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

run('gate first: the page waits silent, only a real key or tap starts the opening and the title tune',async()=>{
 await withPage(async page=>{
  let s=await state(page);
  assert.equal(s.gate,true,'the gate is up on the first title visit');
  assert.equal(s.focus,'gate','the full-screen button has focus');
  assert.equal(s.music,null,'no music before the press');assert.equal(s.notes,0,'nothing is scheduled before the press');
  assert.equal(await page.evaluate(()=>document.getElementById('gate').getAttribute('aria-label').length>10),true,'it has an aria-label');
  for(const k of ['Shift','Control','Alt','Tab','F5'])await page.keyboard.press(k).catch(()=>{});
  await page.keyboard.down('Control');await page.keyboard.press('KeyR').catch(()=>{});await page.keyboard.up('Control');
  await sleep(150);s=await state(page);assert.equal(s.gate,true,'modifiers, Tab, F-keys and browser shortcuts are not a press');
  await page.keyboard.press('KeyX');await sleep(60);
  await page.keyboard.press('KeyZ');await page.mouse.click(300,300);await sleep(60);
  s=await state(page);assert.equal(s.intro,true,'a second press inside the 350 ms debounce does not skip the opening');
  await sleep(600);
  s=await state(page);
  assert.equal(s.gate,false,'the press takes the gate down');assert.equal(s.intro,true,'and the opening runs');
  assert.equal(s.music,'title','the title tune is playing');assert.ok(s.notes>5,'its notes are on the audio clock ('+s.notes+')');
  await page.keyboard.press('KeyZ');await sleep(300);
  s=await state(page);assert.equal(s.settled,true,'a later press skips to the settled menu');assert.equal(s.music,'title','the tune plays on');
 });
});

run('a click or tap on the gate works too, and the opening plays out to the menu by itself',async()=>{
 await withPage(async page=>{
  await page.mouse.click(640,400);await sleep(600);
  let s=await state(page);assert.equal(s.gate,false);assert.equal(s.intro,true);assert.equal(s.music,'title');
  await page.waitForFunction(()=>{const m=document.getElementById('menu');return m.classList.contains('ui-in')&&!m.classList.contains('intro');},{timeout:12000});
  s=await state(page);assert.equal(s.intro,false,'the opening ended on its own');
  assert.equal(await page.evaluate(()=>!!document.getElementById('playBtn').offsetParent),true,'PLAY is there');
 });
});

run('?skipintro=1 lands on the settled menu with no gate and no opening; ?story=<id> bypasses the gate',async()=>{
 await withPage(async page=>{
  const s=await state(page);assert.equal(s.gate,false);assert.equal(s.settled,true,'settled at once');assert.equal(s.intro,false);
  await page.keyboard.press('ArrowDown');await sleep(500);
  assert.equal((await state(page)).music,'title','the tune starts on the first gesture');
 },{query:'?skipintro=1'});
 await withPage(async page=>{
  await page.waitForFunction(()=>document.documentElement.classList.contains('story-on'),{timeout:8000});
  const s=await state(page);assert.equal(s.gate,false,'the story preview skips the gate');assert.equal(s.story,true);
 },{query:'?story=prologue&pause=1'});
});

run('coming back from the game in the same page load gets no gate',async()=>{
 await withPage(async page=>{
  await page.keyboard.press('KeyX');await sleep(400);await page.keyboard.press('KeyX').catch(()=>{});await sleep(600);await page.keyboard.press('KeyX');await sleep(500);
  await page.evaluate(()=>{location.hash='#play';});await sleep(600);
  assert.equal((await state(page)).screen,'game');
  await page.evaluate(()=>document.getElementById('menuBtn').click());await sleep(800);
  const s=await state(page);assert.equal(s.screen,'menu');assert.equal(s.gate,false,'no gate on the way back');assert.equal(s.intro,false,'and no full opening');
 });
});

run('reduced motion: the gate does not blink, and the press goes straight to the settled menu with the music',async()=>{
 await withPage(async page=>{
  assert.equal(await page.evaluate(()=>getComputedStyle(document.querySelector('.gate-cta')).animationName),'none');
  assert.equal((await state(page)).gate,true,'the gate still shows');
  const at=await page.evaluate(()=>{const r=document.getElementById('playBtn').getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2};});
  await page.mouse.click(at.x,at.y);await sleep(900);                  // the press lands where PLAY will be: it must not also press PLAY
  const s=await state(page);assert.equal(s.gate,false);assert.equal(s.settled,true,'no opening');assert.equal(s.music,'title','but the music is on');
  assert.equal(s.screen,'menu','the press that opened the menu did not also press PLAY');
},{reduced:true});
});

run('phone: the gate says TAP TO START and a tap starts the show',async()=>{
 await withPage(async page=>{
  assert.equal(await page.evaluate(()=>getComputedStyle(document.querySelector('.gate-coarse')).display!=='none'&&getComputedStyle(document.querySelector('.gate-fine')).display==='none'),true,'TAP TO START, not PRESS ANY KEY');
  await page.touchscreen.tap(195,420);await sleep(600);
  const s=await state(page);assert.equal(s.gate,false);assert.equal(s.music,'title');
 },{width:390,height:844,mobile:true});
});
