const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const pp = require('C:/Users/arran/pp/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js');

const root = process.cwd();
const out = path.join(root, 'docs/plan/long-game/evidence/LG-09/works-review-r1');
const fixture = JSON.parse(fs.readFileSync('docs/plan/long-game/evidence/LG-08/archive-r1/main-retained-save.json'));
const priorEstate = JSON.parse(fs.readFileSync('docs/plan/long-game/evidence/LG-08/archive-review-r1/estate-smoke-verified.json'));
const s = fixture.state, now = Date.now();
s.lastSeen = now;
s.challenge = null;
s.offers = [];
s.pitches = [];
s.written = {};
s.bank = {};
s.focus = null;
s.autoFocus = false;
s.printing = 7;
s.legacy.total = 720;
s.legacy.stars = 367;
s.meta.layers.baseline = 360;
s.meta.estate.count = 3;
s.meta.estate.localImprints = 5;
s.meta.estate.starBaseline = 360;
s.meta.estate.resetEpoch = 3;
s.meta.folio.resetEpoch = 3;
s.meta.archive.working = null;
s.meta.archive.through = now;
s.meta.archive.entries[0].born = now - 49 * 3600000;
s.meta.archive.entries[0].age = 48 * 3600000;
s.meta.archive.entries[1] = {...s.meta.archive.entries[0], key:4, slot:0, title:'midsummer-chimp', pay:3000000};
s.meta.archive.usedCopies['midsummer-chimp'] = 1;
s.rewards.claims['layer:estate:first'] = priorEstate.path.after.claims['layer:estate:first'];
s.desks.forEach((d,i) => {
  d.owned = i < 2;
  d.paws = 0;
  d.crew = [];
  d.letters = Object.fromEntries([...`ABCDEFGHIJKLMNOPQRSTUVWXYZ`].map(ch => [ch,1000]));
  d.tray = [];
  d.keeper.on = true;
  for (const k of ['practice','stock','ink','vowel','ribbon']) d.up[k] = 0;
});
s.pub = {tier:3,on:true,rule:'any'};
const server = http.createServer((req,res) => {
  const file = path.resolve(root,'.'+new URL(req.url,'http://local').pathname);
  if (!file.startsWith(root+path.sep)) return res.writeHead(403).end();
  fs.readFile(file,(error,body) => {
    res.writeHead(error?404:200,{'Content-Type':({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2'})[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});
    res.end(error?'missing':body);
  });
});
const result = {status:'UNVERIFIED',fixture:'Accepted LG08C Archive save with controlled Estate3, local Imprints5, Printing8, two mature classics, settled first Estate claim, ordinary hoard, zero autonomous paws and controlled real press rolls.',checks:[],pageErrors:[],hashes:{}};
const check = (name,pass,facts) => {result.checks.push({name,pass:!!pass,facts});assert(pass,name+': '+JSON.stringify(facts));};
const pages = ['works.js','ops.js','rewards.js','layers.js','folio.js','archive.js','estate.js'];
(async () => {
  let browser;
  try {
    await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
    result.port = server.address().port;
    assert(![8000,8354,8356,8358,8397].includes(result.port));
    browser = await pp.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
    const page = await browser.newPage();
    await page.setBypassServiceWorker(true);
    await page.setCacheEnabled(false);
    page.on('pageerror',error => result.pageErrors.push(error.stack||error.message));
    page.on('response',async response => {
      const file = new URL(response.url()).pathname.slice(1);
      if (pages.includes(file)) result.hashes[file] = crypto.createHash('sha256').update(await response.buffer()).digest('hex');
    });
    const seed = await page.evaluateOnNewDocument(data => {
      localStorage.setItem('imi-ops-v1',JSON.stringify(data.state));
      localStorage.setItem('imi-score',JSON.stringify(data.wallet));
      localStorage.setItem('imi-tour',JSON.stringify({version:2,done:true,tipsOff:true}));
      Math.random = () => window.fixtureRand??.5;
    },fixture);
    const url = `http://127.0.0.1:${result.port}/index.html?lg01a=1&lg05folio=1&lg05layers=1&lg08estate=1&lg08archive=1&lg09demo=1#play`;
    await page.goto(url);
    await page.removeScriptToEvaluateOnNewDocument(seed.identifier);
    await page.waitForFunction(() => Rewards.owns()&&IMI.ops?.progression.running()&&!Rewards.held(),{timeout:15000});
    const helpers = () => {
      window.state = () => IMI.ops.extensions.state();
      window.request = action => ({action,...Layers.epochFields(state()),content:WorksDemo.identity,expected:WorksDemo.snapshot(state())});
      window.cmd = action => Rewards.worksDemoAction(request(action));
      window.typed = (ch,i=1) => {
        const frequency = IMI.ops.dev.layerFrequency(), entries = Object.entries(frequency);
        const sum = Object.values(frequency).reduce((a,b) => a+b,0);
        let before = 0;
        for (const [letter,n] of entries) {if (letter===ch) {fixtureRand=(before+n/2)/sum;break;}before+=n;}
        IMI.ops.dev.press(i,false);
      };
      window.trayCount = () => state().meta.worksDemo.trays.reduce((n,p) => n+Object.values(p).reduce((a,b) => a+b,0),0);
      window.drawerCount = () => state().desks.reduce((n,d) => n+Object.values(d.letters).reduce((a,b) => a+b,0),0);
    };
    await page.evaluate(helpers);
    const first = await page.evaluate(() => {
      const rows = [];
      const test = (name,pass,facts) => rows.push({name,pass,facts});
      test('normal owner before actions',Rewards.owns()&&IMI.ops.progression.running()&&Rewards.guard(state())&&!Rewards.held());
      test('no eager demo namespace',!state().meta.worksDemo);
      const introduction = cmd('introduce');
      test('eligible introduction acknowledged',introduction.ok&&state().meta.worksDemo?.index===0,{introduction});
      if (!introduction.ok) return {rows};
      const original = drawerCount();
      test('ordinary first pass consumes150 and stops at fresh pass',cmd('work').ok&&state().meta.worksDemo.index===23&&original-drawerCount()===150);
      const letters = state().stats.letters;
      for (const ch of 'LANTERNS') typed(ch);
      test('actual press completes first fresh word',state().meta.worksDemo.index===24&&state().stats.letters===letters+8&&trayCount()===0);
      typed('G');typed('L');
      test('new reserved letters remain at producing desk',state().meta.worksDemo.index===24&&state().meta.worksDemo.trays[1].G===1&&state().meta.worksDemo.trays[1].L===1&&trayCount()===2);
      test('prefix and tray saved',IMI.ops.saveAcknowledged().ok);
      const before = {works:JSON.parse(JSON.stringify(state().meta.worksDemo)),archive:JSON.parse(JSON.stringify(state().meta.archive)),claims:JSON.parse(JSON.stringify(state().rewards.claims)),awards:JSON.parse(JSON.stringify(state().awards)),prem:JSON.parse(JSON.stringify(state().prem)),epoch:state().meta.estate.resetEpoch};
      const offer = IMI.ops.extensions.estatePreview();
      const reset = Rewards.estateAction({action:'reset',quote:offer.quote});
      test('eligible actual Estate reset acknowledged',reset.ok,{reset,quote:offer.quote});
      test('Estate advances once and exits work',state().meta.estate.resetEpoch===before.epoch+1&&state().meta.estate.count===4&&!state().meta.worksDemo.working);
      test('Estate keeps prefix, unlock and producing desk tray',state().meta.worksDemo.index===24&&state().meta.worksDemo.unlocked&&JSON.stringify(state().meta.worksDemo.trays)===JSON.stringify(before.works.trays)&&!state().desks[1].owned);
      test('Archive retained without pending or replay',state().meta.archive.entries.length===before.archive.entries.length&&state().meta.archive.sequence===before.archive.sequence&&state().meta.archive.pending==null&&state().meta.archive.through>=before.archive.through);
      test('no demo reward, award, premium or anthology',JSON.stringify(state().rewards.claims)===JSON.stringify(before.claims)&&JSON.stringify(state().awards)===JSON.stringify(before.awards)&&JSON.stringify(state().prem)===JSON.stringify(before.prem)&&!state().meta.works&&!state().meta.anthology);
      return {rows,before,after:{works:state().meta.worksDemo,estate:state().meta.estate,archive:state().meta.archive}};
    });
    for (const row of first.rows) check(row.name,row.pass,row.facts);
    result.path = {before:first.before,after:first.after};
    await page.reload();
    await page.waitForFunction(() => Rewards.owns()&&IMI.ops?.progression.running()&&!Rewards.held(),{timeout:15000});
    await page.evaluate(helpers);
    const second = await page.evaluate(() => {
      const rows = [];
      const test = (name,pass,facts) => rows.push({name,pass,facts});
      test('reload keeps Estate epoch, prefix, tray and exit',state().meta.estate.resetEpoch===4&&state().meta.worksDemo.index===24&&!state().meta.worksDemo.working&&state().meta.worksDemo.trays[1].G===1&&state().meta.worksDemo.trays[1].L===1);
      test('normal owner after reload',Rewards.owns()&&IMI.ops.progression.running()&&Rewards.guard(state())&&!Rewards.held());
      test('manual resume acknowledged',cmd('work').ok&&state().meta.worksDemo.working&&state().meta.worksDemo.index===24);
      const reserve = trayCount(), index = state().meta.worksDemo.index;
      IMI.ops.perk('coconut',[0,0]);
      test('actual generic grant remains ordinary after reset',trayCount()===reserve&&state().meta.worksDemo.index===index);
      const drawers = drawerCount();
      test('release unowned desk tray once',cmd('release').ok&&trayCount()===0&&drawerCount()===drawers+reserve&&state().desks[1].letters.G===1&&state().desks[1].letters.L===1);
      const afterRelease = drawerCount();
      test('second release cannot double credit',cmd('release').ok&&drawerCount()===afterRelease);
      test('released and ordinary letters do not advance fresh prefix',cmd('work').ok&&state().meta.worksDemo.index===index&&trayCount()===0);
      test('postrelease saved',IMI.ops.saveAcknowledged().ok);
      return {rows,works:state().meta.worksDemo,estate:state().meta.estate,archive:state().meta.archive};
    });
    for (const row of second.rows) check(row.name,row.pass,row.facts);
    result.path.final = {works:second.works,estate:second.estate,archive:second.archive};
    for (const [file,hash] of Object.entries(result.hashes)) assert.equal(hash,crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),file+' loaded source differs');
    assert.deepEqual(result.pageErrors,[]);
    result.status = 'PASS';
  } catch(error) {result.error=error.stack||error.message;process.exitCode=1;}
  finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
    result.cleanup = {browserClosed:!!browser,serverClosed:true,port:result.port,protectedResourcesTouched:false,priorReviewerTempPreserved:true};
    fs.mkdirSync(out,{recursive:true});
    fs.writeFileSync(path.join(out,'estate-path.json'),JSON.stringify(result,null,2));
    console.log(JSON.stringify({status:result.status,checks:result.checks,error:result.error,cleanup:result.cleanup},null,2));
  }
})();
