// Real Ops/Rewards/Economy with the explicitly simulated balance UI bridge.
// This helper does not claim native Core, hardware crash or browser lifecycle coverage.
import { pathToFileURL } from 'node:url';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const { default:puppeteer } = await import(pathToFileURL(process.env.PUPPETEER_MODULE).href);
export const base = 'docs/plan/long-game/evidence/LG-01/implementation-b';
export async function browser() {
  return puppeteer.launch({ executablePath:process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless:true, args:['--no-sandbox'] });
}
export async function fixture(browser, { records, speed = 1, fault, frozen = false, rngStart } = {}) {
  const context = await browser.createBrowserContext(), page = await context.newPage(), errors = [], hashes = {}, reads = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('response', response => { const path = new URL(response.url()).pathname;
    if (response.ok() && /\/(rewards|economy|ops)\.js$|\/tools\/balance.html$/.test(path)) reads.push(response.buffer().then(bytes => { hashes[path] = createHash('sha256').update(bytes).digest('hex'); })); });
  if (frozen || rngStart !== undefined) {
    const sources={}; if(frozen)for(const path of ['ops.js','rewards.js','economy.js'])sources['/'+path]=await readFile(base+'/before/source/'+path);
    if(rngStart !== undefined){
      const html=await readFile('tools/balance.html','utf8'),marker='/* virtual clock */';
      sources['/tools/balance.html']=Buffer.from(html.replace(marker,'window.__rngcount=window.__fixtureRngStart; Math.random=()=>((++window.__rngcount*48271)%2147483647)/2147483647;\n'+marker));
    }
    await page.setRequestInterception(true);
    page.on('request',request=>{ const path=new URL(request.url()).pathname,body=sources[path]; if(body)void request.respond({ status:200,contentType:path.endsWith('.html')?'text/html':'text/javascript',body });else void request.continue(); });
  }
  await page.evaluateOnNewDocument(({ records, speed, fault, rngStart }) => {
    window.__LONG_GAME_FIXTURE = records;
    window.__fixtureSpeed = speed;
    window.__fixtureRngStart = rngStart;
    window.__OPS_EXTENSIONS = [['fixture-clock',{ speed:() => window.__fixtureSpeed, away:() => { window.__workRngCount=window.__rngcount; }, init:() => {
      if(rngStart !== undefined)window.__rngcount=rngStart;
    } }]];
    window.__writes = []; window.__fault = fault;
    const set = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) {
      let parsed; try { parsed = JSON.parse(value); } catch {}
      const fault = window.__fault, claim = parsed?.rewards?.claims?.[fault?.claim];
      const matches = fault && (fault.stage === 'migration' ? key === 'imi-ops-v1' && parsed?.rewards?.migration :
        fault.stage === 'wallet' ? key === 'imi-score' && parsed?.rewardMarker :
        fault.stage === 'away-commit' ? key === 'imi-ops-v1' && parsed?.rewards?.walletHead && !parsed?.rewards?.awayCheckpoint?.credit :
        key === 'imi-ops-v1' && claim?.status === fault.stage);
      if (matches && fault.remaining-- > 0) { window.__writes.push({ key, value, rejected:true }); throw Error('Injected ' + fault.stage + ' storage failure'); }
      set.call(this, key, value);
      if (key === 'imi-score' || key === 'imi-ops-v1') window.__writes.push({ key, value, rejected:false });
    };
  }, { records, speed, fault, rngStart });
  await page.goto((process.env.LG01_URL || 'http://127.0.0.1:8162') + '/tools/balance.html?lg01a=1', { waitUntil:'load' });
  await page.waitForFunction(() => !!window.IMI?.ops);
  await Promise.all(reads);
  return { context, page, errors, hashes, close:() => context.close() };
}
export async function records(overrides = {}) {
  const native = JSON.parse(await readFile(base + '/before/native-classic.json','utf8')).structuredContent.value;
  const s = JSON.parse(native.opsRaw);
  Object.assign(s, { lastSeen:0, awards:{}, chDone:{}, printing:0, rewards:{}, prem:{}, ...overrides });
  return { 'imi-score':JSON.stringify({ economyVersion:1, score:0 }), 'imi-ops-v1':JSON.stringify(s) };
}
export async function capture(fixture, name) {
  const value = await fixture.page.evaluate(() => ({ state:IMI.ops.dev.S(), wallet:JSON.parse(localStorage.getItem('imi-score')),
    persistedOps:JSON.parse(localStorage.getItem('imi-ops-v1')), writes:__writes, rng:window.__rngcount, workRng:window.__workRngCount, running:IMI.ops.progression.running(), status:document.querySelector('.o-writer-status')?.textContent }));
  const directory = base + '/fixture-' + (process.env.LG01_RUN || 'r1');
  await mkdir(directory,{recursive:true});
  await writeFile(directory + '/' + name + '.json',JSON.stringify({ coverage:'simulated UI bridge; actual Ops/Rewards/Economy adapter', hashes:fixture.hashes, errors:fixture.errors, ...value },null,2)+'\n',{flag:'wx'});
  return value;
}
