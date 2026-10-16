// Freeze complete legacy reports. Only capture provenance is excluded from parity.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
const phase = process.argv[2];
if (!['before', 'after'].includes(phase)) throw new Error('Use before or after');
const suffix = process.argv[3] || '';
if (suffix && !/^-[a-z0-9-]+$/.test(suffix)) throw new Error('Invalid evidence suffix');
const base = 'docs/plan/long-game/evidence/LG-00', out = `${base}/${phase}${suffix}`;
await mkdir(out, { recursive: true });
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const sources = ['ops.js', 'pickups.js', 'economy.js', 'world.js', 'core.js', 'tools/bot.js', 'tools/balance.mjs', 'tools/balance.html', 'readers.js', 'readers-kids.js', 'readers-w5.js', 'readers-w7.js', 'readers-w9.js'];
const identities = Object.fromEntries(await Promise.all(sources.map(async p => [p, hash(await readFile(p))])));
await writeFile(`${out}/sources.json`, JSON.stringify(identities, null, 2) + '\n', { flag: 'wx' });
const excluded = new Set(['capturedAt', 'sourceCommit', 'sourceHashes', 'url', 'wallSeconds']);
const canonical = raw => JSON.stringify(Object.fromEntries(Object.entries(raw).filter(([k]) => !excluded.has(k))), null, 2) + '\n';
const runs = [];
for (const profile of ['active', 'idle']) for (const strategy of ['collect', 'hoard']) for (const seed of [1, 2, 3]) runs.push({ profile, strategy, seed, minutes: 60, active: 30 });
for (const strategy of ['collect', 'hoard']) for (const seed of [1, 2, 3]) runs.push({ profile: 'active', strategy, seed, minutes: 45, active: 45, session: 15, away: 480 });
runs.push({ ...runs[0], repeat: true });
const manifest = [];
for (const r of runs) {
  const name = `${r.away ? 'overnight' : 'hour'}-${r.profile}-${r.strategy}-${r.seed}${r.repeat ? '-repeat' : ''}`;
  if (process.argv[4] && name !== process.argv[4]) continue;
  const rawPath = `${out}/${name}.raw.json`, canonicalPath = `${out}/${name}.canonical.json`;
  const args = ['tools/balance.mjs', String(r.minutes), r.profile, r.strategy, String(r.seed), String(r.active), '--url', 'http://127.0.0.1:8147/tools/balance.html', '--output', rawPath];
  if (r.away) args.push('--session', String(r.session), '--away', String(r.away));
  const log = await new Promise(resolve => { const p = spawn(process.execPath, args, { env: { ...process.env, GUARD: '240', BALANCE_TUNE: '{}' } }); let log = ''; p.stdout.on('data', b => { log += b; }); p.stderr.on('data', b => { log += b; }); p.on('exit', code => resolve({ code, log })); });
  await writeFile(`${out}/${name}.log`, log.log, { flag: 'wx' });
  const raw = JSON.parse(await readFile(rawPath, 'utf8')), bytes = canonical(raw);
  await writeFile(canonicalPath, bytes, { flag: 'wx' });
  const reference = phase === 'after' ? `${base}/before/${name}.canonical.json` : r.repeat ? `${out}/hour-active-collect-1.canonical.json` : null;
  const parity = reference ? bytes === await readFile(reference, 'utf8') : null;
  manifest.push({ name, rawPath, rawHash: hash(await readFile(rawPath)), canonicalPath, canonicalHash: hash(bytes), complete: raw.complete, exitCode: log.code, parity });
  console.log(name, raw.complete, parity);
}
if (phase === 'before') {
  const { default: puppeteer } = await import(pathToFileURL(process.env.PUPPETEER_MODULE).href);
  const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    const page = await browser.newPage(); await page.goto('http://127.0.0.1:8147/tools/balance.html');
    const fixture = await page.evaluate(() => { Bot.start({ profile: 'active', strategy: 'collect', seed: 1, activeMinutes: 15 }); Bot.run(15); __advance(5000); Economy.saveScore(IMI.bananas.get()); return { 'imi-ops-v1': localStorage.getItem('imi-ops-v1'), 'imi-score': localStorage.getItem('imi-score'), capturedClock: Date.now() }; });
    await writeFile(`${out}/old-save.json`, JSON.stringify(fixture, null, 2) + '\n', { flag: 'wx' });
  } finally { await browser.close(); }
}
await writeFile(`${out}/manifest.json`, JSON.stringify({ excluded: [...excluded], identities, reports: manifest }, null, 2) + '\n', { flag: 'wx' });
if (manifest.some(r => !r.complete || r.parity === false)) process.exitCode = 1;
