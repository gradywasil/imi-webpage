// Checks one repair microgame (minigames/repairs/<id>.js) in headless Chrome: a bot run and a no-input run per level,
// console + page errors, and screenshots to judge by eye. Safe to run several at once (free port, own browser).
//   node tools/repairs/check-repair.mjs <id> [--level .5 | --level 0,.5,1] [--seed 7] [--desk 0..5] [--extra N] [--shots dir] [--no-idle] [--q "a=1&b=2"]
// Prints one JSON line per level:
//   { id, level, seed, botGrade, botVerdict, idleGrade, idleVerdict, idleOverAfter, errors: [], warnings: [], shots: [], ok }
// ok = no errors, the bot run reached the over card, the idle run graded < .4 and reached the over card within seconds + 5.
// A bot grade outside .6-.95 is a warning. Exit code 1 if any level is not ok.
// Needs Chrome (CHROME, default C:/Program Files/Google/Chrome/Application/chrome.exe) and puppeteer-core (PUPPETEER_MODULE, default ~/pp).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const TYPES = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json', '.ico': 'image/x-icon', '.woff2': 'font/woff2' };
const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 && i + 1 < args.length ? args[i + 1] : d; };
const VALUED = new Set(['--level', '--seed', '--desk', '--extra', '--shots', '--q']), id = args.filter((a, i) => !a.startsWith('--') && !VALUED.has(args[i - 1]))[0];
if (!id) { console.error('usage: node tools/repairs/check-repair.mjs <id> [--level .5|0,.5,1] [--seed 7] [--desk N] [--extra N] [--shots dir] [--no-idle] [--q "k=v&..."]'); process.exit(2); }
const levels = String(opt('level', '.5')).split(',').map(Number).filter(Number.isFinite);
const seed = +opt('seed', 7), idle = !args.includes('--no-idle');
const extraQ = [opt('desk') != null ? 'desk=' + +opt('desk') : '', opt('extra') != null ? 'extra=' + +opt('extra') : '', opt('q', '')].filter(Boolean).join('&');
const shotsDir = path.resolve(opt('shots', path.join(root, '..', '.plan', 'shots', id)));
const require = createRequire(import.meta.url);
const puppeteer = require(process.env.PUPPETEER_MODULE || 'C:/Users/arran/pp/node_modules/puppeteer-core');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const external = url => /fonts\.(googleapis|gstatic)\.com/.test(url);          /* the Google Fonts link may be offline: not the repair's fault */

const server = http.createServer((req, res) => {
  const file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://local').pathname));
  if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  fs.readFile(file, (error, body) => {
    if (error) { res.writeHead(404).end(); return; }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); res.end(body);
  });
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await puppeteer.launch({ executablePath: process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--no-sandbox'] });

async function open(q, view) {
  const page = await browser.newPage(), errors = [];
  if (view) await page.setViewport(view);
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !external(m.text() + ' ' + (m.location()?.url || ''))) errors.push('console: ' + m.text()); });
  page.on('requestfailed', r => { if (!external(r.url())) errors.push('request failed: ' + r.url()); });
  page.on('response', r => { if (r.status() >= 400 && !external(r.url())) errors.push(`HTTP ${r.status()}: ${r.url()}`); });
  await page.goto(`${base}/minigames/repair.html?game=${encodeURIComponent(id)}&${q}${extraQ ? '&' + extraQ : ''}`, { waitUntil: 'load' });
  return { page, errors };
}
const state = page => page.evaluate(() => { const r = window.__repair; if (r && r.phase === 'pause') r.shell?.resume(); return r ? { phase: r.phase, t: r.t || 0, grade: r.grade, verdict: r.verdict || null, error: r.error || null } : null; });
async function until(page, test, ms) { const t0 = Date.now(); let s = null; while (Date.now() - t0 < ms) { s = await state(page); if (s && (s.phase === 'error' || test(s))) return s; await sleep(40); } return s; }

/* what the runner knows about this id (stage size, seconds) */
const probe = await open('bot=0', { width: 420, height: 700 });
await until(probe.page, s => s.phase !== 'loading', 5000);
/* the stage + time the repair really set up (setup() options may override LIST); LIST as the fallback */
const meta = await probe.page.evaluate(i => { const m = window.MGRepair?.byId?.[i], r = window.__repair; return m ? { ...m, ...(r && r.W ? { W: r.W, H: r.H, seconds: r.seconds } : {}) } : null; }, id);
const probeErr = await state(probe.page); await probe.page.close();
const out = [];
if (!meta || probeErr?.phase === 'error') {
  out.push({ id, level: null, botGrade: null, idleGrade: null, errors: [probeErr?.error || `unknown repair "${id}"`, ...probe.errors], warnings: [], shots: [], ok: false });
} else {
  const view = meta.W > meta.H ? { width: 700, height: 420 } : { width: 420, height: 700 }, secs = meta.seconds;          /* includes --extra */
  for (const level of levels) {
    const tag = `${id}-L${Math.round(level * 100)}`, shots = [], warnings = [], errors = [];
    const shot = async (page, name) => { fs.mkdirSync(shotsDir, { recursive: true }); const f = path.join(shotsDir, `${tag}-${name}.png`); await page.screenshot({ path: f }); shots.push(f); };
    /* 1. the bot run: screenshots at 0.5 s of play, mid-run and on the over card */
    const bot = await open(`bot=1&seed=${seed}&level=${level}`, view);
    let s = await until(bot.page, s => s.phase === 'play' && s.t >= .5, 10000);
    if (s?.phase === 'play') await shot(bot.page, '0.5s');
    s = await until(bot.page, s => s.phase !== 'play' || s.t >= secs / 2, (secs + 10) * 1000);
    if (s?.phase === 'play') await shot(bot.page, 'mid');
    s = await until(bot.page, s => s.phase === 'over', (secs + 15) * 1000);
    if (s?.phase === 'over') { await sleep(1500); await shot(bot.page, 'over'); } else errors.push(`bot run never reached the over card (phase ${s?.phase})`);
    const botGrade = s?.phase === 'over' ? s.grade : null, botVerdict = s?.verdict || null;
    errors.push(...bot.errors); await bot.page.close();
    if (botGrade != null && (botGrade < .6 || botGrade > .95)) warnings.push(`bot grade ${botGrade.toFixed(3)} is outside .6-.95`);
    /* 2. the no-input run: must grade < .4 and end within seconds + 5 */
    let idleGrade = null, idleVerdict = null, idleOverAfter = null;
    if (idle) {
      const t0 = Date.now(), run = await open(`bot=0&seed=${seed}&level=${level}`, view);
      s = await until(run.page, s => s.phase === 'over', (secs + 5) * 1000);
      if (s?.phase === 'over') { idleOverAfter = +((Date.now() - t0) / 1000).toFixed(1); idleGrade = s.grade; idleVerdict = s.verdict; await sleep(1500); await shot(run.page, 'idle-over'); }
      else errors.push(`idle run did not reach the over card within ${secs + 5} s (phase ${s?.phase})`);
      if (idleGrade != null && !(idleGrade < .4)) errors.push(`idle grade ${idleGrade} is not < .4`);
      errors.push(...run.errors); await run.page.close();
    }
    const uniq = [...new Set(errors)];
    out.push({ id, level, seed, botGrade, botVerdict, idleGrade, idleVerdict, idleOverAfter, errors: uniq, warnings, shots, ok: !uniq.length && botGrade != null && (!idle || idleGrade != null) });
  }
}
await browser.close(); server.close();
for (const o of out) console.log(JSON.stringify(o));
process.exit(out.every(o => o.ok) ? 0 : 1);
