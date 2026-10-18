import { initializeApp } from 'firebase/app';
import { initializeAuth, browserLocalPersistence, browserPopupRedirectResolver, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, doc, getDocFromServer, runTransaction, serverTimestamp } from 'firebase/firestore';
import { PROJECT_ID, ConflictError, parsePayload, validateSnapshot } from './model.mjs';

export function connectLab(name, persistence) {
  const app = initializeApp({ projectId: PROJECT_ID, apiKey: 'demo-save-lab-key', authDomain: `${PROJECT_ID}.firebaseapp.com` }, name);
  const options = { persistence: persistence || browserLocalPersistence };
  if (typeof window !== 'undefined') options.popupRedirectResolver = browserPopupRedirectResolver;
  const auth = initializeAuth(app, options);
  connectAuthEmulator(auth, 'http://127.0.0.1:9299', { disableWarnings: true });
  const db = getFirestore(app);
  connectFirestoreEmulator(db, '127.0.0.1', 8189);
  return { app, auth, db };
}

const portable = snapshot => snapshot.exists() ? { ...snapshot.data(), updatedAt: snapshot.data().updatedAt.toMillis() } : null;

export function cloudFor(db, auth, uid) {
  const headRef = doc(db, 'users', uid, 'saves', 'main');
  const backupRef = doc(db, 'users', uid, 'backups', 'previous');
  const currentAccount = () => { if (auth.currentUser?.uid !== uid) throw Error('Account changed. Reconnect before syncing.'); };
  return {
    async read() {
      currentAccount();
      const head = portable(await getDocFromServer(headRef));
      currentAccount();
      return head && validateSnapshot(head);
    },
    async upload(pending) {
      currentAccount(); parsePayload(pending.payload);
      // The expected revision stays fixed across Firestore's automatic retries.
      let result;
      try { result = await runTransaction(db, async transaction => {
        currentAccount();
        const snapshot = await transaction.get(headRef), head = portable(snapshot);
        if (head) validateSnapshot(head);
        if (head?.operationId === pending.operationId) {
          if (head.payload !== pending.payload || head.deviceId !== pending.deviceId || head.saveId !== pending.saveId) throw Error('Upload receipt does not match the pending save.');
          return head;
        }
        if ((head?.revision || 0) !== pending.expectedRevision || head && head.saveId !== pending.saveId) throw new ConflictError(head);
        const next = { formatVersion: 1, revision: pending.expectedRevision + 1, saveId: head?.saveId || pending.saveId, operationId: pending.operationId, deviceId: pending.deviceId, gameBuild: pending.gameBuild, payload: pending.payload, updatedAt: serverTimestamp() };
        validateSnapshot(next);
        if (snapshot.exists()) transaction.set(backupRef, snapshot.data());
        transaction.set(headRef, next);
        return { ...next, updatedAt: null };
      }); } catch (error) {
        // Rules may refuse a stale commit before the SDK retries its read.
        if (error.code === 'permission-denied') {
          currentAccount();
          const head = portable(await getDocFromServer(headRef));
          if (head) {
            validateSnapshot(head);
            if (head.revision !== pending.expectedRevision || head.saveId !== pending.saveId) throw new ConflictError(head);
          }
        }
        throw error;
      }
      currentAccount();
      return result;
    }
  };
}
