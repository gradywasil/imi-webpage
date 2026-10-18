import test from 'node:test';
import assert from 'node:assert/strict';
import { deleteApp } from 'firebase/app';
import { inMemoryPersistence, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDocFromServer, setDoc, getDocs, collection, deleteDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { connectLab, cloudFor } from '../firebase.mjs';
import { Device, summary } from '../model.mjs';

test('Firebase Auth, conflict transactions, backups, and access rules', async t => {
  const clients = ['a', 'b', 'other', 'guest'].map(name => connectLab(`test-${name}-${crypto.randomUUID()}`, inMemoryPersistence));
  try {
    const [a, b, other, guest] = clients;
    const email = `player-${crypto.randomUUID()}@example.test`, password = 'sample-only-password';
    const { user } = await createUserWithEmailAndPassword(a.auth, email, password);
    await signInWithEmailAndPassword(b.auth, email, password);
    await createUserWithEmailAndPassword(other.auth, `other-${crypto.randomUUID()}@example.test`, password);
    const values = new Map(), storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
    const deviceA = new Device({ uid: user.uid, id: 'A', storage, cloud: cloudFor(a.db, a.auth, user.uid) });
    const deviceB = new Device({ uid: user.uid, id: 'B', storage, cloud: cloudFor(b.db, b.auth, user.uid) });
    const head = doc(a.db, 'users', user.uid, 'saves', 'main');
    const backup = doc(a.db, 'users', user.uid, 'backups', 'previous');
    const denied = action => assert.rejects(action, error => error.code === 'permission-denied');

    await t.test('signed-in sample sync creates revision one', async () => {
      deviceA.progress(); await deviceA.upload();
      assert.equal((await getDocFromServer(head)).data().revision, 1);
      assert.equal(deviceA.state.dirty, false);
    });
    await t.test('a second device downloads after explicit conflict choice', async () => {
      await deviceB.check(); assert.ok(deviceB.state.conflict); deviceB.chooseCloud();
      assert.equal(summary(deviceB.state.payload).bananas, 100);
    });
    await t.test('simultaneous device uploads accept one and refuse the stale branch', async () => {
      deviceA.progress(); deviceB.progress(); deviceB.progress();
      await Promise.all([deviceA.upload(), deviceB.upload()]);
      assert.equal((await getDocFromServer(head)).data().revision, 2);
      const loser = deviceA.state.conflict ? deviceA : deviceB;
      assert.ok(loser.state.conflict);
      const before = (await getDocFromServer(head)).data();
      await loser.upload(true);
      assert.equal((await getDocFromServer(head)).data().revision, 3);
      assert.deepEqual((await getDocFromServer(backup)).data(), before);
    });
    await t.test('repeat delivery of the same operation is idempotent', async () => {
      const gateway = cloudFor(a.db, a.auth, user.uid), current = await gateway.read();
      const request = { ...current, expectedRevision: current.revision - 1 };
      await gateway.upload(request);
      assert.equal((await getDocFromServer(head)).data().revision, 3);
    });
    await t.test('guests and other accounts cannot read or overwrite a save', async () => {
      for (const client of [guest, other]) {
        const ref = doc(client.db, 'users', user.uid, 'saves', 'main');
        await denied(() => getDocFromServer(ref));
        await denied(() => setDoc(ref, { payload: 'overwrite' }));
        await denied(() => getDocFromServer(doc(client.db, 'users', user.uid, 'backups', 'previous')));
      }
    });
    await t.test('lists, deletion, revision jumps, unknown fields, and client timestamps are refused', async () => {
      await denied(() => getDocs(collection(a.db, 'users', user.uid, 'saves')));
      await denied(() => deleteDoc(head));
      const current = (await getDocFromServer(head)).data();
      const next = { ...current, revision: current.revision + 1, operationId: crypto.randomUUID(), updatedAt: serverTimestamp() };
      await denied(() => setDoc(head, next)); // No atomic backup.
      for (const patch of [{ revision: 99 }, { extra: true }, { saveId: 'changed' }, { updatedAt: new Date(0) }, { deviceId: 42 }, { formatVersion: 2 }, { payload: 'x'.repeat(200001) }]) {
        const batch = writeBatch(a.db); batch.set(backup, current); batch.set(head, { ...next, ...patch });
        await denied(() => batch.commit());
      }
      await denied(() => setDoc(backup, current)); // No head change.
    });
    await t.test('malformed create and cross-account create are refused', async () => {
      const current = (await getDocFromServer(head)).data();
      const own = doc(other.db, 'users', other.auth.currentUser.uid, 'saves', 'main');
      const next = { ...current, revision: 1, operationId: crypto.randomUUID(), updatedAt: serverTimestamp() };
      for (const patch of [{ revision: 2 }, { payload: 12 }, { operationId: '' }, { unexpected: true }]) await denied(() => setDoc(own, { ...next, ...patch }));
      const wrong = doc(other.db, 'users', 'somebody-else', 'saves', 'main');
      await denied(() => setDoc(wrong, next));
    });
    await t.test('sign-out blocks the old account gateway and sign-in restores its UID', async () => {
      const gateway = cloudFor(a.db, a.auth, user.uid);
      await signOut(a.auth); await assert.rejects(gateway.read(), /Account changed/);
      await signInWithEmailAndPassword(a.auth, email, password);
      assert.equal(a.auth.currentUser.uid, user.uid);
      assert.equal((await gateway.read()).revision, 3);
    });
  } finally { await Promise.all(clients.map(client => deleteApp(client.app))); }
});
