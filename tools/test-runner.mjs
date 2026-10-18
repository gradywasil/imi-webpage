// Runs the test suite with everything it needs: static servers on the ports the browser fixtures expect,
// puppeteer-core on PUPPETEER_MODULE, and a clean exit that stops the servers.
//   node tools/test-runner.mjs                      all tests
//   node tools/test-runner.mjs tests/foreman.test.cjs tests/campus.test.cjs
//   node tools/test-runner.mjs --serve              only start the servers and wait (for debugging a fixture by hand)
//   node tools/test-runner.mjs --serial             one file at a time (slower, but avoids the browser flakes of a parallel run)
// Needs Google Chrome at the path the tests use and puppeteer-core installed outside the repo (PUPPETEER_DIR, default ~/pp).
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORTS = [8162, 8312, 8313];            // lg01-b-fixture, lg02-b2-r2-fixture, lg02-b2-r3-fixture
const TYPES = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.woff2': 'font/woff2' };

function serve(port) {
  const server = http.createServer((req, res) => {
    const file = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://local').pathname));
    if (!file.startsWith(root + path.sep) && file !== root) { res.writeHead(403).end(); return; }
    fs.readFile(file, (error, body) => {
      if (error) { res.writeHead(404).end(); return; }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); res.end(body);
    });
  });
  return new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', () => resolve(server)); });
}

function puppeteerEntry() {
  if (process.env.PUPPETEER_MODULE) return process.env.PUPPETEER_MODULE;
  const dir = process.env.PUPPETEER_DIR || path.join(os.homedir(), 'pp');
  return createRequire(path.join(dir, 'x.js')).resolve('puppeteer-core');
}

const args = process.argv.slice(2), serial = args.includes('--serial'), files = args.filter(a => !a.startsWith('--'));
const servers = [];
try { for (const port of PORTS) servers.push(await serve(port)); }
catch (error) { console.error(`Could not start a test server (${error.message}). Is another copy running on ports ${PORTS.join(', ')}?`); process.exit(2); }

if (args.includes('--serve')) { console.log(`Serving ${root} on ${PORTS.join(', ')}. Ctrl+C to stop.`); await new Promise(() => {}); }
// Labels the evidence-capture helpers put in their output file names. Reruns overwrite the same files.
const env = { REPAIR_PHASE: 'green', LG01_RUN: 'local', LG02_B2_R2_TEST_RUN: 'local', LG02_B2_R3_RUN: 'local', ...process.env, PUPPETEER_MODULE: puppeteerEntry() };
const targets = files.length ? files : fs.readdirSync(path.join(root, 'tests')).filter(f => f.endsWith('.test.cjs')).map(f => 'tests/' + f);
const code = await new Promise(resolve => {
  const child = spawn(process.execPath, ['--test', ...(serial ? ['--test-concurrency=1'] : []), ...targets], { cwd: root, env, stdio: 'inherit' });
  child.on('exit', c => resolve(c ?? 1));
});
for (const s of servers) s.close();
process.exit(code);
