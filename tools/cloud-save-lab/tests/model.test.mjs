import test from 'node:test';
import assert from 'node:assert/strict';
import { Device, ConflictError, parsePayload, samplePayload, summary } from '../model.mjs';

class Storage {
  values = new Map();
  getItem(key) { return this.values.get(key) ?? null; }
  setItem(key, value) { this.values.set(key, value); }
}
class Cloud {
  head = null; previous = null; writes = 0;
  async read() { return structuredClone(this.head); }
  async upload(pending) {
    if (this.head?.operationId === pending.operationId) return structuredClone(this.head);
    if ((this.head?.revision || 0) !== pending.expectedRevision) throw new ConflictError(structuredClone(this.head));
    this.previous = this.head;
    this.head = { ...pending, formatVersion: 1, revision: pending.expectedRevision + 1, updatedAt: 1 };
    delete this.head.expectedRevision;
    this.writes++;
    return structuredClone(this.head);
  }
}
const fixture = () => {
  const storage = new Storage(), cloud = new Cloud();
  const device = (id, uid = 'player', extra = {}) => new Device({ id, uid, storage, cloud, ...extra });
  return { storage, cloud, device };
};

test('offline progress survives reload without touching game keys', async () => {
  const { device, storage, cloud } = fixture();
  storage.setItem('imi-score', 'real game sentinel');
  const a = device('A'); a.online = false; a.progress();
  await assert.rejects(a.upload(), /Offline/);
  assert.equal(summary(device('A').state.payload).bananas, 100);
  assert.equal(cloud.writes, 0);
  assert.equal(storage.getItem('imi-score'), 'real game sentinel');
});

test('raw records retain unknown fields, nested arrays, and absent record markers', () => {
  const payload = JSON.parse(samplePayload());
  const ops = JSON.parse(payload.records['imi-ops-v1']); ops.future = { unknown: [[1, 2], [3]] };
  payload.records['imi-ops-v1'] = JSON.stringify(ops);
  payload.records.extra = 'untouched';
  assert.deepEqual(parsePayload(JSON.stringify(payload)), payload);
  payload.records['imi-score'] = null;
  assert.equal(parsePayload(JSON.stringify(payload)).records['imi-score'], null);
  assert.throws(() => parsePayload('{"records":{}}'), /Missing/);
  assert.throws(() => parsePayload('x'.repeat(200001)), /size limit/);
});

test('two devices detect divergence and keep both branches when choosing cloud', async () => {
  const { device, cloud } = fixture(), a = device('A'), b = device('B');
  a.progress(); await a.upload();
  await b.check(); b.chooseCloud(); b.online = false; b.progress();
  a.progress(); await a.upload(); const cloudBranch = cloud.head.payload;
  b.progress(); const localBranch = b.state.payload; b.online = true;
  await b.upload();
  assert.equal(b.state.conflict.revision, 2);
  assert.equal(b.state.payload, localBranch);
  b.chooseCloud();
  assert.equal(b.state.payload, cloudBranch);
  assert.equal(b.state.backups.at(-1).payload, localBranch);
  assert.equal(cloud.writes, 2);
});

test('choosing local preserves the old cloud head and detects a second race', async () => {
  const { device, cloud } = fixture(), a = device('A'), b = device('B');
  await a.upload(); await b.check(); b.chooseCloud();
  b.progress(); a.progress(); await a.upload(); await b.upload();
  a.progress(); await a.upload();
  await b.upload(true);
  assert.equal(b.state.conflict.revision, 3);
  const before = cloud.head.payload, branch = b.state.payload;
  await b.upload(true);
  assert.equal(cloud.head.revision, 4);
  assert.equal(cloud.head.payload, branch);
  assert.equal(cloud.previous.payload, before);
});

test('uncertain upload outcome retries the exact operation after reload', async () => {
  const { device, cloud } = fixture();
  const upload = cloud.upload.bind(cloud); let loseReply = true;
  cloud.upload = async pending => { const head = await upload(pending); if (loseReply) { loseReply = false; throw Error('Connection lost after commit'); } return head; };
  const a = device('A'); a.progress();
  await assert.rejects(a.upload(), /Connection lost/);
  const operationId = a.state.pending.operationId;
  const reloaded = device('A');
  assert.throws(() => reloaded.progress(), /waiting/);
  await reloaded.upload();
  assert.equal(cloud.head.operationId, operationId);
  assert.equal(cloud.writes, 1);
  assert.equal(reloaded.state.pending, null);
});

test('failed local persistence prevents an upload and preserves in-memory progress', async () => {
  const { device, storage, cloud } = fixture(), a = device('A');
  a.progress(); const before = a.state;
  storage.setItem = () => { throw Error('Quota exceeded'); };
  await assert.rejects(a.upload(), /Quota/);
  assert.equal(a.state, before);
  assert.equal(cloud.writes, 0);
});

test('account scopes and guest progress remain separate across reloads', () => {
  const { device } = fixture();
  device('A', null).progress(); device('A', 'alice').progress(); device('A', 'alice').progress();
  assert.equal(summary(device('A', 'bob').state.payload).bananas, 0);
  assert.equal(summary(device('A', 'alice').state.payload).bananas, 200);
  assert.equal(summary(device('A', null).state.payload).bananas, 100);
});

test('guest progress transfers only through an explicit local copy', async () => {
  const { device, cloud } = fixture();
  device('A', null).progress();
  const account = device('A', 'alice');
  assert.equal(summary(account.state.payload).bananas, 0);
  account.copyGuest();
  assert.equal(summary(account.state.payload).bananas, 100);
  assert.equal(summary(device('A', null).state.payload).bananas, 100);
  assert.equal(cloud.writes, 0);
  await account.upload();
  assert.equal(summary(cloud.head.payload).bananas, 100);
});

test('account change during an upload cannot publish its result into the new session', async () => {
  const { device, cloud } = fixture(); let active = true, finish;
  cloud.upload = () => new Promise(resolve => { finish = resolve; });
  const a = device('A', 'alice', { active: () => active });
  const operation = a.upload();
  active = false;
  finish({ ...a.state.pending, formatVersion: 1, revision: 1 });
  await assert.rejects(operation, /Account changed/);
  assert.equal(a.state.baseRevision, 0);
  assert.ok(a.state.pending);
  assert.equal(device('A', 'bob').state.baseRevision, 0);
});

test('a stale tab cannot overwrite another tab using the same device record', () => {
  const { device } = fixture(), first = device('A'), stale = device('A');
  first.progress();
  assert.throws(() => stale.progress(), /another tab/);
  assert.equal(summary(device('A').state.payload).bananas, 100);
});

test('unsupported cloud format preserves local progress and does not overwrite cloud', async () => {
  const { device, cloud } = fixture(), a = device('A');
  a.progress(); const payload = a.state.payload;
  cloud.head = { formatVersion: 2, revision: 1 };
  await assert.rejects(a.check(), /Unsupported/);
  assert.equal(a.state.payload, payload);
  assert.equal(cloud.writes, 0);
});

test('concurrent button requests do not start a second upload', async () => {
  const { device, cloud } = fixture(); let finish;
  const upload = cloud.upload.bind(cloud);
  cloud.upload = pending => new Promise(resolve => { finish = async () => resolve(await upload(pending)); });
  const a = device('A'), first = a.upload();
  await assert.rejects(a.upload(), /already running/);
  await finish(); await first;
  assert.equal(cloud.writes, 1);
});
