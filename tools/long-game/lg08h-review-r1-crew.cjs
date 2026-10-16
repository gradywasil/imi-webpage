const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const assert = require('node:assert/strict');
const pp = require('C:/Users/arran/pp/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js');

const root = process.cwd();
const out = 'docs/plan/long-game/evidence/LG-08/auto-print-review-r1';
const fixture = JSON.parse(fs.readFileSync('docs/plan/long-game/evidence/LG-08/printing-ack-r1/final-first.json'));
fixture.state.daily = {last:new Date().toDateString(),streak:1};
fixture.state.lastSeen = Date.now();
fixture.state.meta.estate.count = 1;
fixture.state.meta.archive.through = Date.now();
fixture.state.run.earned = 20000000;
fixture.state.challenge = null;
fixture.state.pub.on = false;
fixture.state.written = {'ape-in-the-cape':true};
fixture.state.meta.automation.print = {version:1,manual:{complete:true},futureH:'retained'};
const write = (name,value) => fs.writeFileSync(`${out}/${name}.json`,JSON.stringify(value,null,2),{flag:'wx'});
const server = http.createServer((req,res) => {
  const file = path.resolve(root,'.' + new URL(req.url,'http://local').pathname);
  if (!file.startsWith(root + path.sep)) return res.writeHead(403).end();
  fs.readFile(file,(error,bytes) => {
    res.writeHead(error ? 404 : 200,{'Content-Type':({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json'})[path.extname(file)] || 'application/octet-stream','Cache-Control':'no-store'});
    res.end(error ? 'missing' : bytes);
  });
});
const flags = '?lg08print=1&lg03=1&lg01a=1&lg05folio=1&lg05layers=1&lg08estate=1&lg08archive=1&lg09works=1#play';

(async () => {
  let browser;
  const result = {status:'FAIL',fixture:'LG08G acknowledged manual proof, Estate 1, inherited two working typists at XP 0; controlled monotonic 250 ms steps; normal XP and paid Ops.tick production; no bot Print',errors:[],levels:[],resets:[]};
  try {
    await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
    result.port = server.address().port;
    assert(![8000,8354,8356,8358,8397].includes(result.port));
    browser = await pp.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
    const page = await browser.newPage();
    page.on('pageerror',error => result.errors.push(error.message));
    await page.setBypassServiceWorker(true);
    await page.setCacheEnabled(false);
    const seed = await page.evaluateOnNewDocument(value => {
      localStorage.setItem('imi-ops-v1',JSON.stringify(value.state));
      localStorage.setItem('imi-score',JSON.stringify(value.wallet));
      localStorage.setItem('imi-tour',JSON.stringify({version:2,done:true,tipsOff:true}));
    },fixture);
    await page.goto(`http://127.0.0.1:${result.port}/index.html${flags}`);
    await page.removeScriptToEvaluateOnNewDocument(seed.identifier);
    await page.waitForFunction(() => Rewards.owns() && IMI.ops?.progression.running() && !Rewards.held());
    result.before = await page.evaluate(() => {
      const s = IMI.ops.extensions.state();
      return {owner:Rewards.owns(),running:IMI.ops.progression.running(),guard:Rewards.guard(s),held:Rewards.held(),crew:s.desks[0].crew.map(t => ({name:t.name,xp:t.xp,lv:t.lv})),paws:s.desks[0].paws,proof:s.meta.automation.print.manual.complete,printing:s.printing};
    });
    assert(result.before.owner && result.before.running && result.before.guard && !result.before.held);
    assert(result.before.paws > 0 && result.before.crew.length > 0 && result.before.proof);
    await page.evaluate(() => IMI.ops.extensions.setTab('automation'));
    await page.click('[data-act="automation:print-toggle"]');
    await page.click('[data-enable]');
    result.enabled = await page.evaluate(() => {
      const s = IMI.ops.extensions.state();
      return {enabled:s.meta.automation.print.enabled,disclosed:s.meta.automation.print.disclosed,N:s.meta.automation.print.N,guard:Rewards.guard(s)};
    });
    assert(result.enabled.enabled && result.enabled.disclosed && result.enabled.guard);
    await page.evaluate(() => {
      window.h = __OPS_EXTENSIONS.find(([id]) => id === 'automation')[1];
      window.reviewNow = performance.now();
      Object.defineProperty(performance,'now',{configurable:true,value:() => reviewNow});
      window.reviewLast = null;
      window.reviewSteps = 0;
      window.reviewStartPrinting = IMI.ops.extensions.state().printing;
    });
    for (let block = 0; block < 24; block++) {
      const trace = await page.evaluate(() => {
        const events = [];
        for (let i = 0; i < 400; i++) {
          reviewNow += 250;
          IMI.ops.dev.tick();
          reviewSteps++;
          const s = IMI.ops.extensions.state();
          const levels = s.desks[0].crew.map(t => t.lv);
          const sample = h.printSampleStatus();
          const prior = reviewLast;
          if (!prior || levels.some((lv,j) => lv !== prior.levels[j]) || sample.generation !== prior.generation || s.printing !== prior.printing)
            events.push({seconds:reviewSteps / 4,printing:s.printing,levels,xp:s.desks[0].crew.map(t => t.xp),sample,earned:s.run.earned});
          reviewLast = {levels,generation:sample.generation,printing:s.printing};
          if (s.printing !== window.reviewStartPrinting) break;
        }
        const s = IMI.ops.extensions.state();
        return {events,seconds:reviewSteps / 4,printing:s.printing,crew:s.desks[0].crew.map(t => ({name:t.name,xp:t.xp,lv:t.lv})),sample:h.printSampleStatus(),earned:s.run.earned,stars:s.legacy.total,held:Rewards.held(),owner:Rewards.owns(),running:IMI.ops.progression.running(),guard:Rewards.guard(s),proof:s.meta.automation.print.manual.complete,config:s.meta.automation.print,stored:JSON.parse(localStorage.getItem('imi-ops-v1'))?.meta?.automation?.print};
      });
      if (block === 0) result.startPrinting = result.before.printing;
      result.levels.push(...trace.events);
      result.last = trace;
      if (trace.printing !== result.before.printing) break;
    }
    result.after = result.last;
    if (result.after.printing === result.before.printing + 1) {
      assert(result.after.owner && result.after.running && result.after.guard && !result.after.held);
      assert(result.after.proof && result.after.config.enabled && result.after.config.futureH === 'retained');
      await page.evaluate(() => IMI.ops.saveAcknowledged());
      await page.reload();
      await page.waitForFunction(() => Rewards.owns() && IMI.ops?.progression.running() && !Rewards.held());
      result.reload = await page.evaluate(() => {
        const s = IMI.ops.extensions.state();
        return {printing:s.printing,proof:s.meta.automation.print.manual.complete,enabled:s.meta.automation.print.enabled,N:s.meta.automation.print.N,owner:Rewards.owns(),guard:Rewards.guard(s)};
      });
      assert(result.reload.printing === result.after.printing && result.reload.proof && result.reload.enabled && result.reload.guard);
      result.status = 'PASS';
    } else result.status = 'HOLD';
    assert.deepEqual(result.errors,[]);
  } catch (error) {result.error = error.stack;} finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
    result.cleanup = {browserClosed:true,serverClosed:true,port:result.port};
    write('working-crew',result);
    console.log(JSON.stringify({status:result.status,seconds:result.after?.seconds,maxSample:Math.max(0,...result.levels.map(x => x.sample.seconds),result.after?.sample.seconds || 0),printing:result.after?.printing,levels:result.levels.length,error:result.error}));
    if (result.status === 'FAIL') process.exitCode = 1;
  }
})();
