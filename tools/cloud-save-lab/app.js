import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { Device, summary } from './model.mjs';
import { connectLab, cloudFor } from './firebase.mjs';

if (!['localhost', '127.0.0.1'].includes(location.hostname)) throw Error('Run this lab on localhost.');
const { auth, db } = connectLab('save-lab-browser');
const $ = selector => document.querySelector(selector);
const accountStatus = $('#account-status');
let generation = 0, authBusy = false;

function message(error) {
  if (error.code === 'auth/network-request-failed' || error.code === 'unavailable') return 'Local emulators are unavailable. Start npm run emulators and retry. Local progress is preserved.';
  return error.message;
}

async function accountAction(action) {
  if (authBusy) return;
  authBusy = true;
  $('#auth-form').querySelectorAll('button').forEach(button => button.disabled = true);
  $('#google').disabled = true;
  try { await action(); accountStatus.textContent = 'Account session updated. Device records are kept separate for each account.'; }
  catch (error) { accountStatus.textContent = message(error); }
  finally {
    authBusy = false;
    $('#password').value = '';
    $('#auth-form').querySelectorAll('button').forEach(button => button.disabled = false);
    $('#google').disabled = false;
  }
}
$('#auth-form').addEventListener('submit', event => {
  event.preventDefault();
  const email = $('#email').value.trim(), password = $('#password').value;
  accountAction(() => event.submitter?.name === 'create' ? createUserWithEmailAndPassword(auth, email, password) : signInWithEmailAndPassword(auth, email, password));
});
$('#google').addEventListener('click', () => accountAction(() => signInWithPopup(auth, new GoogleAuthProvider())));
$('#sign-out').addEventListener('click', () => accountAction(() => signOut(auth)));

function mountDevice(device) {
  const section = document.createElement('article');
  section.className = 'device'; section.setAttribute('aria-label', `Device ${device.id}`);
  section.innerHTML = `<h2>Device ${device.id}</h2>
    <label class="switch"><input type="checkbox" checked>Connected to cloud</label>
    <div class="stats"><div><strong data-value="bananas"></strong><span>sample bananas</span></div><div><strong data-value="words"></strong><span>sample words</span></div></div>
    <p class="meta" data-meta></p><p class="status" role="status" aria-live="polite"></p>
    <div class="actions"><button data-action="progress" class="secondary">Add sample progress</button><button data-action="upload">Save to cloud</button><button data-action="check" class="secondary">Check cloud</button></div>
    <div class="conflict" hidden><h3>Choose which progress to continue</h3><p data-comparison></p><div class="actions"><button data-action="cloud">Use cloud save</button><button data-action="local" class="secondary">Keep this device</button></div><p>Using cloud keeps a local recovery copy. Keeping this device saves the previous cloud version as a backup.</p></div>
    <div class="actions"><button data-action="guest" class="secondary">Copy guest progress</button></div>
    <details><summary>Inspect sample snapshot</summary><pre data-snapshot></pre></details>
    <details><summary data-backup-count>Local recovery copies</summary><pre data-backups></pre></details>`;
  $('#devices').append(section);
  const status = section.querySelector('.status');
  const paint = () => {
    const state = device.state, values = summary(state.payload);
    for (const key of ['bananas', 'words']) section.querySelector(`[data-value="${key}"]`).textContent = values[key].toLocaleString();
    section.querySelector('[data-meta]').textContent = `Cloud base revision ${state.baseRevision} · ${device.uid ? 'Account sample' : 'Local guest sample'} · ${state.dirty ? 'Local changes' : 'Synced'}`;
    section.querySelector('[data-snapshot]').textContent = JSON.stringify({ formatVersion: 1, saveId: state.saveId, baseRevision: state.baseRevision, records: JSON.parse(state.payload).records }, null, 2);
    section.querySelector('[data-backup-count]').textContent = `Local recovery copies (${state.backups.length}/3)`;
    section.querySelector('[data-backups]').textContent = JSON.stringify(state.backups, null, 2);
    section.querySelector('.conflict').hidden = !state.conflict;
    if (state.conflict) {
      const other = summary(state.conflict.payload);
      section.querySelector('[data-comparison]').textContent = `This device: ${values.bananas} bananas, ${values.words} words. Cloud revision ${state.conflict.revision}: ${other.bananas} bananas, ${other.words} words from Device ${state.conflict.deviceId}.`;
    }
    for (const button of section.querySelectorAll('button')) {
      const action = button.dataset.action;
      button.disabled = device.busy || (action !== 'progress' && action !== 'cloud' && action !== 'guest' && (!device.uid || !device.online)) || ((action === 'progress' || action === 'guest') && !!(state.pending || state.conflict)) || (action === 'guest' && !device.uid) || (action === 'check' && !!state.pending) || (action === 'upload' && !!state.conflict);
    }
    section.querySelector('[data-action="upload"]').textContent = state.pending ? 'Retry upload' : 'Save to cloud';
  };
  section.querySelector('input').addEventListener('change', event => {
    device.online = event.target.checked;
    status.textContent = device.online ? 'Connected. Check cloud before switching devices.' : 'Offline. Sample progress stays on this device.';
    paint();
  });
  section.addEventListener('click', async event => {
    const action = event.target.closest('button')?.dataset.action;
    if (!action) return;
    try {
      let result;
      if (action === 'progress') { device.progress(); result = 'Progress saved on this device.'; }
      if (action === 'guest') { device.copyGuest(); result = 'Guest progress copied locally. Save to cloud when ready. The guest original is preserved.'; }
      if (action === 'cloud') { device.chooseCloud(); result = 'Cloud save loaded. Previous local progress is in recovery copies.'; }
      if (action === 'upload' || action === 'local') { const operation = device.upload(action === 'local'); paint(); result = await operation; }
      if (action === 'check') { const operation = device.check(); paint(); result = await operation; }
      if (device.active()) status.textContent = result;
    } catch (error) { if (device.active()) status.textContent = message(error); }
    finally { if (device.active()) paint(); }
  });
  status.textContent = device.state.conflict ? 'A saved conflict needs your choice.' : device.state.pending ? 'An upload is waiting. Retry with the same saved request.' : device.state.dirty ? 'Sample saved locally. Add progress or connect it to cloud.' : 'Saved to cloud.';
  paint();
}

onAuthStateChanged(auth, user => {
  const epoch = ++generation;
  $('#identity').textContent = user ? `${user.email || user.displayName || 'Test player'} · ${user.uid}` : 'Playing as a local guest';
  $('#sign-out').disabled = !user;
  $('#devices').replaceChildren();
  for (const id of ['A', 'B']) {
    try {
      const device = new Device({ uid: user?.uid || null, id, storage: localStorage, cloud: user ? cloudFor(db, auth, user.uid) : null, active: () => generation === epoch });
      mountDevice(device);
    } catch (error) { accountStatus.textContent = `Device ${id}: ${message(error)} Stored data has been left in place.`; }
  }
}, error => { accountStatus.textContent = message(error); });
