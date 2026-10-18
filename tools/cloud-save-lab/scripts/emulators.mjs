import { existsSync, readdirSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const runtime = new URL('../.runtime/', import.meta.url);
const env = { ...process.env };
if (existsSync(runtime)) {
  const home = readdirSync(runtime).find(name => existsSync(new URL(`${name}/bin/java.exe`, runtime)));
  if (home) {
    env.JAVA_HOME = fileURLToPath(new URL(`${home}/`, runtime));
    env.PATH = `${env.JAVA_HOME}bin;${env.PATH}`;
  }
}
const testing = process.argv[2] === 'test';
const args = ['emulators:' + (testing ? 'exec' : 'start'), '--project', 'demo-imi-save-lab', '--only', 'auth,firestore'];
if (testing) args.push('node --test tests/firebase.integration.mjs');
else args.push('--import=.emulator-data', '--export-on-exit=.emulator-data');
const child = spawn(process.execPath, [fileURLToPath(new URL('../node_modules/firebase-tools/lib/bin/firebase.js', import.meta.url)), ...args], { cwd: root, env, stdio: 'inherit' });
child.on('error', error => { console.error(error.message); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code ?? 1; });
