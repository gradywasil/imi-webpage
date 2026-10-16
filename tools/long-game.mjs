// Calendar profiles run the actual online loop and simulateAway, without grants.
import { mkdir, writeFile, access } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
const [profile = 'Regular', daysArg = '7', seedArg = '1', output = `docs/plan/long-game/evidence/LG-00/profiles/${profile}.json`] = process.argv.slice(2);
const days = +daysArg, seed = +seedArg, guardMs = +(process.env.GUARD || 240) * 1000;
const plainBank = process.env.LG00_PLAIN_BANK === '1', checkpointSeconds = +(process.env.LG00_CHECKPOINT_SECONDS || 30);
if (!(days > 0) || !Number.isFinite(days) || !Number.isInteger(seed) || !(guardMs > 0)) throw new Error('Invalid profile inputs');
if (!(checkpointSeconds > 0) || !Number.isFinite(checkpointSeconds)) throw new Error('Invalid checkpoint interval');
if (await access(output).then(() => true, () => false)) throw new Error('Output already exists');
await mkdir(output + '.checkpoints');
const { default: puppeteer } = await import(pathToFileURL(process.env.PUPPETEER_MODULE).href);
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, protocolTimeout: 0 });
const errors = [], httpErrors = [], sourceHashes = {}, reads = [], start = Date.now();
let page, report, stopped = null, timer;
let checkpoint = 0, checkpointAt = start;
async function snapshot() {
  await Promise.all(reads);
  const report = await page.evaluate(() => JSON.parse(JSON.stringify(LongGameBot.report())));
  await writeFile(`${output}.checkpoints/${String(checkpoint++).padStart(4, '0')}.json`, JSON.stringify({ profile, seed, plainBank, wallSeconds: (Date.now() - start) / 1000, sourceHashes, errors, httpErrors, report }, null, 2) + '\n', { flag: 'wx' });
  checkpointAt = Date.now();
}
try {
  page = await browser.newPage();
  page.on('pageerror', e => errors.push(e.message));
  page.on('requestfailed', r => errors.push(`${r.url()}: ${r.failure().errorText}`));
  page.on('response', r => { const path = new URL(r.url()).pathname; if (r.status() >= 400 && path !== '/favicon.ico') httpErrors.push({ url: r.url(), status: r.status() }); if (r.ok() && /\.(js|html|json)$/.test(path)) reads.push(r.buffer().then(b => { sourceHashes[path] = createHash('sha256').update(b).digest('hex'); }).catch(e => errors.push(e.message))); });
  await page.goto((process.env.LG00_URL || 'http://127.0.0.1:8147') + '/tools/balance.html?long-game');
  await page.evaluate(({ profile, seed, plainBank }) => LongGameBot.start(profile, seed, { plainBank }), { profile, seed, plainBank });
  await snapshot();
  const schedule = await page.evaluate(() => JSON.parse(JSON.stringify(LongGameBot.report())).schedule), client = await page.createCDPSession();
  timer = setTimeout(() => { stopped = 'wall-clock guard'; void client.send('Runtime.terminateExecution').catch(() => {}); }, Math.max(1, guardMs - (Date.now() - start)));
  let now = 0;
  outer: for (let cycle = 0; cycle < days * 1440; cycle += schedule.cycle) for (const offset of schedule.starts) {
    const session = cycle + offset; if (session >= days * 1440) break outer;
    if (Date.now() - start >= guardMs) { stopped = 'wall-clock guard'; break outer; }
    if (session > now) { await page.evaluate(n => LongGameBot.away(n), session - now); now = session; }
    const end = Math.min(days * 1440, session + schedule.length);
    while (now < end - 1e-8) { const n = Math.min(1, end - now); await page.evaluate(n => LongGameBot.online(n), n); now += n; if (Date.now() - checkpointAt >= checkpointSeconds * 1000) await snapshot(); if (Date.now() - start >= guardMs) { stopped = 'wall-clock guard'; break outer; } }
    const complete = await page.evaluate(() => JSON.parse(JSON.stringify(LongGameBot.report())).finiteComplete); if (complete) break outer;
  }
  report = await page.evaluate(() => JSON.parse(JSON.stringify(LongGameBot.report())));
  if (!stopped && !report.finiteComplete && now < days * 1440) { await page.evaluate(n => LongGameBot.away(n), days * 1440 - now); report = await page.evaluate(() => JSON.parse(JSON.stringify(LongGameBot.report()))); }
  await snapshot();
} catch (e) {
  if (!stopped) { stopped = 'simulation error'; errors.push(e.message); }
  report = page ? await page.evaluate(() => JSON.parse(JSON.stringify(LongGameBot.report()))).catch(() => null) : null;
} finally { clearTimeout(timer); await Promise.all(reads); await browser.close(); }
await mkdir(output.slice(0, output.lastIndexOf('/')), { recursive: true });
await writeFile(output, JSON.stringify({ profile, requestedDays: days, seed, plainBank, checkpoints: checkpoint, capturedAt: new Date().toISOString(), wallSeconds: (Date.now() - start) / 1000, sourceHashes, errors, httpErrors, stopped, horizonComplete: !!report && report.calendarMinutes + 1e-6 >= days * 1440 && !stopped, report }, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify({ output, stopped, calendarMinutes: report?.calendarMinutes, activeMinutes: report?.activeMinutes, endpoints: report?.endpoints }));
if (stopped || errors.length || httpErrors.length) process.exitCode = 1;
