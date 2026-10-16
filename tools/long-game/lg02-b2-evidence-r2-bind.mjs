import fs from 'node:fs';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';

const base = 'docs/plan/long-game/evidence/LG-02/';
const out = base + 'qa-evidence-b2-r2/';
const read = file => JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const hash = file => sha(fs.readFileSync(file));
const exclusions = ['capturedAt', 'sourceCommit', 'sourceHashes', 'url', 'wallSeconds'];
const canonical = raw => { const copy = structuredClone(raw); for (const key of exclusions) delete copy[key]; return JSON.stringify(copy, null, 2) + '\n'; };
const edit = read(out + 'edit-independent-timeline.json').response.items[0];
const results = [];
for (const [label, file, expected] of [
  ['before', 'before-hour.raw.json', '929397a189b2f2045f6c5e9a5a09c17667f969bf6a3c7d74783c28d760a108ef'],
  ['after', 'after-hour-final.raw.json', '0c9399695b9286ae1a6a195533507b2b4c182ec03ff0cb9cd3ab7b60f8182b38']
]) {
  const receipt = read(out + label + '-independent-timeline.json');
  assert.equal(receipt.response.items.length, 1);
  const item = receipt.response.items[0], parent = read(base + 'parent-evidence-recovery-b2-r2/' + label + '-command-timeline-export.json');
  assert.deepEqual(item, parent.item);
  assert.equal(item.textTruncated, false);
  assert.equal(item.nextTextOffset, null);
  assert.equal(item.type, 'command_execution');
  assert.equal(item.status, 'completed');
  const rawPath = base + 'implementation-b2-r2/' + file, raw = read(rawPath);
  assert.equal(hash(rawPath), expected);
  assert.deepEqual(JSON.parse(item.text.match(/^FINAL: (.+)$/m)[1]), raw.report.final);
  assert.deepEqual([raw.profile, raw.strategy, raw.seed, raw.activeMinutes, raw.sessionMinutes, raw.tune, raw.actualMinutes, raw.complete, raw.stopped, raw.errors, raw.httpErrors], ['active', 'collect', 1, 180, 60, {}, 60, true, null, [], []]);
  assert.ok(item.text.includes('--output ' + rawPath));
  assert.ok(item.text.includes('node tools/balance.mjs 60 active collect 1 180'));
  assert.ok(item.text.includes('GUARD=') && item.text.includes('240') && item.text.includes('BALANCE_TUNE=') && item.text.includes('PUPPETEER_MODULE='));
  const sourceBindings = Object.entries(raw.sourceHashes).map(([urlPath, expectedHash]) => {
    const sourceFile = label === 'before' ? base + 'implementation-b2-r2/before/source/' + urlPath.slice(1) : urlPath.slice(1);
    const actual = hash(sourceFile); assert.equal(actual, expectedHash); return { urlPath, sourceFile, sha256: actual };
  });
  results.push({ label, rawPath, rawSha256: expected, capturedAt: raw.capturedAt, itemId: item.itemId, position: item.position, updatedAt: item.updatedAt, parentItemExactlyEqual: true, fullTextLength: item.text.length, textSha256: sha(item.text), finalMatchesRaw: true, completeErrorFree: true, sourceBindings, exposedFields: Object.keys(item), numericExitCode: null, exitQualification: 'No numeric exit field or explicit exit record in item text. completed is not asserted to be exit 0.' });
}
assert.ok(results[0].position < edit.position && results[0].updatedAt < edit.updatedAt);
const original = read(base + 'implementation-b2-r2/parity-results-final.json');
assert.deepEqual(original.exclusions, exclusions);
const pairs = original.pairs.map(pair => {
  const a = canonical(read(base + 'implementation-b2-r2/' + pair.before)), b = canonical(read(base + 'implementation-b2-r2/' + pair.after));
  assert.equal(a, b); assert.equal(sha(a), pair.beforeSha256); assert.equal(sha(b), pair.afterSha256);
  return { ...pair, independentlyRecomputed: true };
});
const afterText = read(out + 'after-independent-timeline.json').response.items[0].text;
assert.deepEqual(JSON.parse(afterText.trim().split('\n').at(-1)), original.pairs);
const harness = 'tools/balance.mjs', frozenHarness = base + 'implementation-b2-r2/before/source/' + harness;
assert.equal(hash(harness), hash(frozenHarness));
const result = { at: new Date().toISOString(), results, firstDisplayedProductEdit: { position: edit.position, itemId: edit.itemId, updatedAt: edit.updatedAt }, beforePrecedesEdit: true, exclusions, pairs, originalAfterComparisonMatches: true, harness: { file: harness, sha256: hash(harness), unchangedFromBefore: true, qualification: 'Writes raw at line 66 before FINAL at line 70; line 74 sets exitCode=1 for incomplete results. This source expectation is not an observed historical numeric exit.' } };
fs.writeFileSync(out + 'independent-binding-validation.json', JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
console.log(JSON.stringify(result));
