const fs = require('node:fs'), path = require('node:path'), http = require('node:http'), assert = require('node:assert/strict'), crypto = require('node:crypto');
const pp = require('C:/Users/arran/pp/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js');
const out = 'docs/plan/long-game/evidence/LG-08/identity-r1', run = process.argv[2];
assert(/^[a-z0-9-]+$/.test(run));
const write = (name,value) => fs.writeFileSync(`${out}/${run}-${name}.json`,JSON.stringify(value,null,2),{flag:'wx'});
const root = process.cwd(), fixture = JSON.parse(fs.readFileSync('docs/plan/long-game/evidence/LG-05/implementation-shelf-r1/final-ui-failure.json'));
Object.assign(fixture.state,{lastSeen:Date.now(),printing:4,challenge:null,offers:[],pitches:[]});
delete fixture.state.meta.automation;
const mime = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.woff2':'font/woff2'};
const server = http.createServer((req,res) => {
  const f = path.resolve(root,'.'+new URL(req.url,'http://local').pathname);
  if (!f.startsWith(root+path.sep)) return res.writeHead(403).end();
  fs.readFile(f,(e,b) => {res.writeHead(e?404:200,{'Content-Type':mime[path.extname(f)]||'application/octet-stream','Cache-Control':'no-store'});res.end(e?'missing':b);});
});
(async () => {
  let browser;
  const result = {status:'UNVERIFIED',checks:[],errors:[],sourceHashes:{},controls:'Isolated actual Core/Rewards owner. Seeded old settled Folio marker and optional identity, controlled inventory/earnings. Pure foundation uses actual layerPreview projector. No natural progression claim.'};
  try {
    await new Promise(r => server.listen(0,'127.0.0.1',r)); result.port = server.address().port;
    assert(![8000,8354,8356,8358,8397].includes(result.port));
    browser = await pp.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
    const page = await browser.newPage(), base = `http://127.0.0.1:${result.port}`;
    page.on('pageerror',e => result.errors.push(e.stack || e.message));
    page.on('response',async r => {const f = new URL(r.url()).pathname.slice(1);if (['layers.js','ops.js','folio.js','automation.js','rewards.js','core.js','vault-save-gate.js'].includes(f)) result.sourceHashes[f] = crypto.createHash('sha256').update(await r.buffer()).digest('hex');});
    await page.setBypassServiceWorker(true); await page.setCacheEnabled(false);
    const seed = await page.evaluateOnNewDocument(f => {localStorage.setItem('imi-ops-v1',JSON.stringify(f.state));localStorage.setItem('imi-score',JSON.stringify(f.wallet));},fixture);
    await page.goto(base+'/index.html?lg01a=1&lg03=1&lg05folio=1&lg05layers=1#play');
    await page.removeScriptToEvaluateOnNewDocument(seed.identifier);
    await page.waitForFunction(() => window.Rewards?.owns() && IMI.ops?.progression.running(),{timeout:12000});
    const checks = await page.evaluate(() => {
      const d = IMI.ops.dev, a = IMI.ops.extensions, clone = x => JSON.parse(JSON.stringify(x)), rows = [];
      const check = (name,pass,facts) => {rows.push({name,pass:!!pass,facts});if (!pass) throw Error(name);};
      const s = d.S();
      s.pub.on = false; s.desks.forEach(x => {x.paws=0;x.crew=[];x.keeper.on=false;});
      document.querySelectorAll('.o-modal,.o-celebrate').forEach(e => e.remove());
      check('owner before actions',Rewards.owns() && IMI.ops.progression.running() && !Rewards.held() && Rewards.guard(s));
      const before = JSON.stringify(s), raw = localStorage.getItem('imi-ops-v1'), oldHead = clone(s.meta.folio.cashHead), claims = JSON.stringify(s.rewards.claims);
      const neutral = Layers.epochFields(s), init = Layers.initializeIdentity(s);
      Folio.current(s); Layers.current(s);
      check('absent identity remains raw and pure',JSON.stringify(s)===before && localStorage.getItem('imi-ops-v1')===raw && Object.keys(neutral).length===0 && init.localImprints===s.meta.layers.count && init.resetEpoch===0,{init});
      const pending = clone(s); pending.meta.folio.pending = {printing:pending.printing,selection:{id:'pocket',leaves:[0,1],reward:{kind:'cash'}},credit:{id:'folio:1:4:pocket',previous:1,sequence:2,amount:6250}};
      let refused = false; try {Layers.initializeIdentity(pending);} catch {refused=true;}
      check('original pending blocks initialization',refused && !pending.meta.estate);
      s.meta.estate = {...init,futureIdentity:{keep:73}};
      s.meta.automation = {version:1,media:{version:1,sequence:23,pending:null,manual:{complete:true}},muse:{version:1,manual:{ids:['seuss','poe'],complete:true,imprint:1,printing:4}}};
      check('legacy settled marker survives activation',Folio.cashMarker(s,oldHead) && Rewards.guard(s) && JSON.stringify(s.meta.folio.cashHead)===JSON.stringify(oldHead));
      s.printing = 7; s.legacy.total = s.meta.layers.baseline+60;
      const pureBefore = JSON.stringify(s), projected = a.layerPreview().room;
      check('foundation projection increments lifetime local and epoch without aliasing',JSON.stringify(s)===pureBefore && projected.meta.layers.count===s.meta.layers.count+1 && projected.meta.estate.localImprints===init.localImprints+1 && projected.meta.estate.resetEpoch===1 && projected.meta.estate!==s.meta.estate && projected.meta.estate.futureIdentity!==s.meta.estate.futureIdentity && projected.meta.automation.media.sequence===23,{estate:projected.meta.estate,count:projected.meta.layers.count});
      const stale = {action:'choose',resetEpoch:0,expected:clone(s.meta.folio),selection:{id:'pocket',leaves:[0,1],reward:{kind:'cash'}}};
      const sourceMeta = s.meta, sourceBefore = JSON.stringify(sourceMeta);
      s.run.earned = 12.5e6;
      d.doPrint(); const n = d.S();
      document.querySelectorAll('.o-modal,.o-celebrate').forEach(e => e.remove());
      check('actual Printing advances once and clones old metadata',n.printing===8 && n.meta.estate.resetEpoch===1 && n.meta.layers.count===1 && n.meta.estate.localImprints===1 && JSON.stringify(sourceMeta)===sourceBefore && n.meta.automation.media.sequence===23 && n.meta.automation.muse.manual.complete && JSON.stringify(n.rewards.claims)===claims,{estate:n.meta.estate,printing:n.printing});
      check('old settled marker survives actual reset',Folio.cashMarker(n,oldHead) && Rewards.guard(n) && JSON.stringify(n.meta.folio.cashHead)===JSON.stringify(oldHead));
      // Supply identical current expected data, isolating the epoch refusal from ordinary stale-snapshot checks.
      stale.expected = clone(n.meta.folio);
      const refusalBefore = JSON.stringify(n), walletBefore = localStorage.getItem('imi-score'), saveBefore = localStorage.getItem('imi-ops-v1');
      const rejection = Rewards.folioAction(stale);
      check('actual stale Folio command refuses without changing state wallet or save',!rejection.ok && JSON.stringify(n)===refusalBefore && localStorage.getItem('imi-score')===walletBefore && localStorage.getItem('imi-ops-v1')===saveBefore,{rejection});
      const selection = {id:'pocket',leaves:[0,1],reward:{kind:'cash'}};
      let r = Rewards.folioAction({action:'choose',...Layers.epochFields(n),expected:clone(n.meta.folio),selection});
      check('current epoch choose',r.ok,{r});
      for (const [w,v] of Object.entries(Folio.ingredients(selection))) {n.bank[w]=v; n.desks.forEach(x => x.owned=true);}
      d.touchBank();
      const proposal = Folio.proposal(n,{action:'prepare',...Layers.epochFields(n),expected:clone(n.meta.folio)},IMI.bananas.acknowledgement(),false);
      const repeated = clone(n); repeated.meta.estate.resetEpoch=2; repeated.meta.folio=Folio.current(repeated); repeated.meta.folio.selection=selection;
      const next = Folio.proposal(repeated,{action:'prepare',...Layers.epochFields(repeated),expected:clone(repeated.meta.folio)},IMI.bananas.acknowledgement(),false);
      check('repeated local coordinates have distinct actual Folio provenance',proposal.folio.pending.credit.id!==next.folio.pending.credit.id && proposal.folio.pending.credit.sequence===2,{first:proposal.folio.pending.credit,next:next.folio.pending.credit});
      r = Rewards.folioAction({action:'prepare',...Layers.epochFields(n),expected:clone(n.meta.folio)});
      check('actual epoch binding settles retained sequence once',r.ok && n.meta.folio.cashHead.id===proposal.folio.pending.credit.id && n.meta.folio.cashHead.sequence===2 && !n.meta.folio.pending && Rewards.guard(n),{r,head:n.meta.folio.cashHead});
      n.run.earned=12.5e6; n.meta.estate.resetEpoch=Number.MAX_SAFE_INTEGER;
      const overflowBefore=JSON.stringify(n), overflowWallet=localStorage.getItem('imi-score'), overflowSave=localStorage.getItem('imi-ops-v1');
      d.doPrint();
      check('overflow refuses before room wallet or save mutation',JSON.stringify(d.S())===overflowBefore && localStorage.getItem('imi-score')===overflowWallet && localStorage.getItem('imi-ops-v1')===overflowSave);
      n.meta.estate.resetEpoch=1; check('save after fixture',IMI.ops.saveAcknowledged().ok && !Rewards.held() && Rewards.guard(n));
      return rows;
    });
    result.checks.push(...checks);
    await page.reload(); await page.waitForFunction(() => Rewards.owns() && IMI.ops?.progression.running());
    const reload = await page.evaluate(() => ({estate:IMI.ops.dev.S().meta.estate,head:IMI.ops.dev.S().meta.folio.cashHead,sequence:IMI.ops.dev.S().meta.automation.media.sequence,held:Rewards.held(),guard:Rewards.guard(IMI.ops.dev.S())}));
    result.checks.push({name:'reload actual identity and provenance',facts:reload});
    assert.equal(reload.estate.resetEpoch,1); assert.equal(reload.sequence,23); assert.equal(reload.head.id,'folio:e1:1:8:pocket'); assert(reload.guard&&!reload.held);
    await page.goto(base+'/index.html#play'); await page.waitForFunction(() => IMI.ops?.dev);
    const flagless = await page.evaluate(() => {const d=IMI.ops.dev,s=d.S();s.run.earned=12.5e6;const count=s.meta.layers.count,local=s.meta.estate.localImprints;d.doPrint();return {estate:d.S().meta.estate,count:d.S().meta.layers.count,local,previousCount:count,printing:d.S().printing,sequence:d.S().meta.automation.media.sequence};});
    result.checks.push({name:'flagless ordinary Printing',facts:flagless});
    assert.equal(flagless.estate.resetEpoch,2);assert.equal(flagless.count,flagless.previousCount);assert.equal(flagless.estate.localImprints,flagless.local);assert.equal(flagless.sequence,23);
    for (const [f,hash] of Object.entries(result.sourceHashes)) assert.equal(hash,crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex'));
    assert.deepEqual(result.errors,[]);result.status='PASS';
  } catch(e) {result.status='FAIL';result.error=e.stack;}
  finally {if(browser) await browser.close();await new Promise(r=>server.close(r));write('results',result);write('cleanup',{browserClosed:true,serverClosed:true,port:result.port,protectedResourcesUntouched:true});console.log(JSON.stringify({status:result.status,checks:result.checks.length,error:result.error}));if(result.status!=='PASS')process.exitCode=1;}
})();
