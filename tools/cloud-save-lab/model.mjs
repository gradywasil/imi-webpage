export const PROJECT_ID = 'demo-imi-save-lab';
export const GAME_BUILD = 'sample-lab-1';
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);

export function samplePayload() {
  return JSON.stringify({ records: {
    'imi-ops-v1': JSON.stringify({ economyVersion: 1, printing: 0, stats: { words: 0, playSecs: 0 }, meta: {}, rewards: {}, prem: {}, market: { hist: [[1], [1]] } }),
    'imi-score': JSON.stringify({ economyVersion: 1, score: 0 })
  } });
}

export function parsePayload(payload) {
  if (typeof payload !== 'string' || new TextEncoder().encode(payload).length > 200000) throw Error('Snapshot exceeds the lab size limit.');
  const envelope = JSON.parse(payload);
  if (!object(envelope) || !object(envelope.records)) throw Error('Invalid snapshot records.');
  const records = envelope.records;
  for (const key of ['imi-ops-v1', 'imi-score']) {
    if (!Object.hasOwn(records, key) || records[key] !== null && typeof records[key] !== 'string') throw Error('Missing or invalid saved record.');
    if (records[key] !== null && !object(JSON.parse(records[key]))) throw Error('Saved record must be an object.');
  }
  return envelope;
}

export function validateSnapshot(snapshot) {
  if (!object(snapshot) || snapshot.formatVersion !== 1 || !Number.isSafeInteger(snapshot.revision) || snapshot.revision < 1) throw Error('Unsupported cloud snapshot. Local progress preserved.');
  for (const key of ['saveId', 'operationId', 'deviceId', 'gameBuild']) {
    if (typeof snapshot[key] !== 'string' || !snapshot[key].length || snapshot[key].length > 100) throw Error('Invalid snapshot metadata.');
  }
  parsePayload(snapshot.payload);
  return snapshot;
}

export class ConflictError extends Error {
  constructor(head) { super('Another device has different progress. Choose which save to continue.'); this.head = head; }
}

export class Device {
  constructor({ uid, id, storage, cloud, active = () => true }) {
    Object.assign(this, { uid, id, storage, cloud, active, online: true, busy: false });
    this.key = `imi-save-lab:v1:${uid || 'guest'}:${id}`;
    const raw = storage.getItem(this.key);
    this.raw = raw;
    this.state = raw ? JSON.parse(raw) : { version: 1, saveId: crypto.randomUUID(), payload: samplePayload(), baseRevision: 0, dirty: true, pending: null, conflict: null, backups: [] };
    if (this.state.version !== 1 || !Array.isArray(this.state.backups) || !Number.isSafeInteger(this.state.baseRevision)) throw Error('Unsupported local lab record. Data preserved.');
    parsePayload(this.state.payload);
    if (this.state.conflict) validateSnapshot(this.state.conflict);
  }
  persist(next) {
    if (!this.active()) throw Error('Account changed. This operation cannot update the current session.');
    if (this.storage.getItem(this.key) !== this.raw) throw Error('This lab device changed in another tab. Reload to continue.');
    const raw = JSON.stringify(next);
    this.storage.setItem(this.key, raw);
    this.raw = raw;
    this.state = next;
  }
  progress() {
    if (this.busy || this.state.pending || this.state.conflict) throw Error('Resolve or retry the waiting save first.');
    const envelope = parsePayload(this.state.payload), records = envelope.records;
    const ops = JSON.parse(records['imi-ops-v1']), wallet = JSON.parse(records['imi-score']);
    if (!Number.isFinite(wallet?.score) || !Number.isFinite(ops?.stats?.words) || !Number.isFinite(ops?.stats?.playSecs)) throw Error('This sample cannot be advanced.');
    wallet.score += 100; ops.stats.words += 10; ops.stats.playSecs += 60;
    records['imi-ops-v1'] = JSON.stringify(ops); records['imi-score'] = JSON.stringify(wallet);
    this.persist({ ...this.state, payload: JSON.stringify(envelope), dirty: true });
  }
  copyGuest() {
    if (!this.uid || this.busy || this.state.pending || this.state.conflict) throw Error('Sign in and resolve waiting saves before copying guest progress.');
    const raw = this.storage.getItem(`imi-save-lab:v1:guest:${this.id}`);
    if (!raw) throw Error('This device has no saved guest progress yet.');
    const guest = JSON.parse(raw);
    if (guest.version !== 1) throw Error('Unsupported guest record. Data preserved.');
    parsePayload(guest.payload);
    const backups = [...this.state.backups, { payload: this.state.payload, baseRevision: this.state.baseRevision }].slice(-3);
    this.persist({ ...this.state, payload: guest.payload, dirty: true, backups });
  }
  requireConnection() {
    if (!this.uid) throw Error('Sign in to connect saves. Guest progress stays on this device.');
    if (!this.online) throw Error('Offline. Progress is saved on this device.');
    if (!this.active()) throw Error('Account changed.');
  }
  async run(action) {
    if (this.busy) throw Error('A device operation is already running.');
    this.requireConnection(); this.busy = true;
    try { return await action(); } finally { this.busy = false; }
  }
  async check() {
    return this.run(async () => {
      if (this.state.pending) throw Error('Retry the waiting upload before checking cloud progress.');
      const head = await this.cloud.read();
      if (!head) return 'No cloud save yet. Upload this sample to start.';
      validateSnapshot(head);
      if (this.state.dirty) {
        if (head.revision !== this.state.baseRevision || head.saveId !== this.state.saveId) this.persist({ ...this.state, conflict: head });
        return this.state.conflict ? 'Choose which save to continue.' : 'Local changes are ready to upload.';
      }
      this.accept(head);
      return 'Cloud progress loaded.';
    });
  }
  accept(head) {
    validateSnapshot(head);
    const backups = [...this.state.backups, { payload: this.state.payload, baseRevision: this.state.baseRevision }].slice(-3);
    this.persist({ ...this.state, saveId: head.saveId, payload: head.payload, baseRevision: head.revision, dirty: false, pending: null, conflict: null, backups });
  }
  chooseCloud() {
    if (this.busy || !this.state.conflict) throw Error('Check for a conflict first.');
    this.accept(this.state.conflict);
  }
  async upload(chooseLocal = false) {
    return this.run(async () => {
      if (this.state.conflict && !chooseLocal) throw Error('Choose which save to continue first.');
      if (chooseLocal && !this.state.conflict) throw Error('Check for a conflict first.');
      if (!this.state.dirty && !this.state.pending) return 'Already saved to cloud.';
      const expectedRevision = chooseLocal ? this.state.conflict.revision : this.state.baseRevision;
      const pending = this.state.pending || { expectedRevision, operationId: crypto.randomUUID(), saveId: this.state.conflict?.saveId || this.state.saveId, payload: this.state.payload, deviceId: this.id, gameBuild: GAME_BUILD };
      this.persist({ ...this.state, pending });
      try {
        const head = await this.cloud.upload(pending);
        this.accept(head);
        return 'Saved to cloud.';
      } catch (error) {
        if (error instanceof ConflictError) {
          validateSnapshot(error.head);
          this.persist({ ...this.state, pending: null, conflict: error.head });
          return error.message;
        }
        throw error;
      }
    });
  }
}

export function summary(payload) {
  const { records } = parsePayload(payload);
  const ops = records['imi-ops-v1'] === null ? {} : JSON.parse(records['imi-ops-v1']);
  const wallet = records['imi-score'] === null ? {} : JSON.parse(records['imi-score']);
  return { bananas: wallet.score ?? 0, words: ops.stats?.words ?? 0, printing: ops.printing ?? 0 };
}
