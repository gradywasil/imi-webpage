import fs from 'node:fs';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';

const base = 'docs/plan/long-game/evidence/LG-02/';
const out = base + 'qa-evidence-b2-r2/';
const read = file => JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const identity = file => { const bytes = fs.readFileSync(file); return { file, bytes: bytes.length, sha256: sha(bytes) }; };
const git = (...args) => execFileSync('git', args, { encoding: 'utf8', env: { ...process.env, GIT_OPTIONAL_LOCKS: '0' }, maxBuffer: 32 * 1024 * 1024 }).trim();
const write = (name, value) => fs.writeFileSync(out + name, JSON.stringify(value, null, 2) + '\n', { flag: 'wx' });
const phase = process.argv[2];
assert.ok(['before', 'after'].includes(phase));
fs.mkdirSync(out, { recursive: true });
const seals = ['qa-runtime-b2-r1/closing-seal.json', 'implementation-b2-r2/handoff-close-seal.json', 'tutorial-repair-b2-r3/closing-seal.json'];
const sealChecks = seals.map(file => {
  const seal = read(base + file), records = seal.records || seal.artifacts;
  const drift = records.filter(record => identity(record.file).sha256 !== record.sha256);
  return { ...identity(base + file), records: records.length, drift };
});
const source = [...fs.readFileSync('docs/plan/long-game/LG-02B2-QA-r1.md', 'utf8').matchAll(/\| (\w+\.js) \| ([a-f0-9]{64}) \|/g)].map(([, file, expected]) => ({ ...identity(file), expected }));
const state = { at: new Date().toISOString(), branch: git('branch', '--show-current'), head: git('rev-parse', 'HEAD'), index: identity(git('rev-parse', '--git-path', 'index')), staged: git('diff', '--cached', '--binary'), trackedStatus: git('status', '--short', '--untracked-files=no'), source, sealChecks };
if (phase === 'before') {
  const paths = new Set(Object.keys(read(base + 'qa-runtime-b2-r1/before-inventory.json').identities));
  for (const file of seals) { paths.add(base + file); for (const record of read(base + file).records || read(base + file).artifacts) paths.add(record.file); }
  for (const file of fs.readdirSync(base + 'parent-evidence-recovery-b2-r2')) paths.add(base + 'parent-evidence-recovery-b2-r2/' + file);
  for (const file of fs.readdirSync('docs/plan/long-game').filter(file => file.endsWith('.md'))) paths.add('docs/plan/long-game/' + file);
  if (fs.existsSync(out + 'dispatch.json')) paths.add(out + 'dispatch.json');
  state.preservation = [...paths].sort().map(identity);
} else {
  const before = read(out + 'preservation-before.json');
  state.preservationCount = before.preservation.length;
  state.preservationDrift = before.preservation.filter(record => identity(record.file).sha256 !== record.sha256);
  state.indexUnchanged = state.index.sha256 === before.index.sha256;
  state.stagedUnchanged = state.staged === before.staged;
  state.trackedStatusUnchanged = state.trackedStatus === before.trackedStatus;
  state.branchHeadUnchanged = state.branch === before.branch && state.head === before.head;
}
write('preservation-' + phase + '.json', state);
assert.equal(source.length, 6);
assert.ok(source.every(record => record.sha256 === record.expected));
assert.ok(sealChecks.every(seal => !seal.drift.length));
if (phase === 'after') assert.ok(!state.preservationDrift.length && state.indexUnchanged && state.stagedUnchanged && state.trackedStatusUnchanged && state.branchHeadUnchanged);
console.log(JSON.stringify({ phase, source, sealChecks, preservationCount: state.preservation?.length || state.preservationCount, preservationDrift: state.preservationDrift, indexUnchanged: state.indexUnchanged }));
