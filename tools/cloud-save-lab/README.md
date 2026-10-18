# Connected saves lab

A standalone experiment for Infinite Monkey Industries. It never reads or writes
the game's browser records. All local sample records use `imi-save-lab:v1:` keys.
The existing deployment ignore file excludes this entire `tools/` directory.

## Run locally

Use Node 24 and Java 21 or newer. Dependencies and a portable Java runtime have
been installed locally for this checkout. The launcher uses a Windows Java runtime
under `.runtime/` when present, otherwise it uses Java from your environment.
The Firebase app and compatibility app packages are pinned together to keep one
component registry and retain compatibility with the installed Node 24.9 runtime.

From this directory, open two terminals:

```powershell
npm ci
npm run emulators
```

```powershell
npm run dev
```

Open http://127.0.0.1:5199/. Emulator UI: http://127.0.0.1:4499/.
Use made-up email/password credentials or the Google emulator's simulated login.
No Firebase login, billing account, live project, or real Google login is needed.
The `demo-imi-save-lab` project ID and loopback emulator endpoints are hardcoded.
Google's emulator flow does not prove production OAuth or Android sign-in.

The emulator launcher imports/exports `.emulator-data/` on normal shutdown.
Local device samples and the auth session survive page reloads. Restarting the
emulator without its saved export can invalidate an old browser auth session;
sign out and create/sign in to a test account again in that case.

## Try the workflow

1. Create a test account and add progress on A. Save A to cloud.
2. Check cloud on B. Choose **Use cloud save** to start from A's snapshot.
3. Disconnect B with its checkbox, then add progress on B.
4. Add different progress on A and save it to cloud.
5. Reconnect B and save. Its stale base revision must produce a conflict.
6. Choose cloud to preserve B's branch in local recovery copies, or keep B to
   atomically preserve the previous cloud head before replacing it.
7. Sign out and create another test account. Its device records start separately.
8. Return to the first account to recover its existing device samples.

Both panels share one account session. They simulate separate device storage
and per-device connectivity; the checkbox gates requests for that device rather
than taking the browser's entire Firebase connection offline. Physical network
loss also leaves an exact pending upload to retry. No automatic uploads run.
If you made guest progress first, use **Copy guest progress** after signing in.
This copies only that device's guest sample into the current account's local
record, preserves both originals through guest storage and recovery copies, and
requires a separate cloud upload. Nothing moves between accounts automatically.

## Save and conflict contract

`users/{uid}/saves/main` holds a version-1 envelope with `revision`, stable
`saveId`, unique `operationId`, `deviceId`, `gameBuild`, opaque JSON `payload`,
and a server `updatedAt` timestamp. The JSON stores the main game record and
wallet together as raw JSON strings, or explicit null for absent records.
The lab samples are deliberately incomplete and must never be imported into the
game. Unknown fields and nested arrays survive transport. Client validation
checks the container, not all gameplay invariants or purchase legitimacy.

Every upload captures a fixed expected revision before its transaction. SDK
transaction retries cannot silently advance that expectation. A repeated request
matching the current operation ID is acknowledged without another write. If a
different device has since uploaded, a retry becomes a conflict instead.
An uncertain response keeps the exact pending operation locally, including across
reload. Account generation checks prevent old responses from updating a new
account's view. Local writes must succeed before a network upload is attempted.
A stale browser tab cannot overwrite a changed local record.

The current head and `users/{uid}/backups/previous` are the only cloud snapshots.
Updates must atomically copy the previous head to that backup. Local device
recovery keeps the last three replaced copies. Choosing a branch is never an
inventory merge. Account or save deletion is intentionally absent in this lab.
Payloads are limited to 200,000 UTF-8 bytes in the client; prototype rules also
cap payload string length. Payload indexing is disabled. No production database
edition or region has been selected; the emulator runs Standard edition.

## Verify

```powershell
npm test
npm run test:firebase
npm run build
```

Stop `npm run emulators` before `test:firebase`; that command starts its own
temporary Auth and Firestore emulators on the same ports without importing data.
Model tests cover offline storage, conflicts, response loss, account changes,
quota failure, and stale local tabs. Integration tests exercise real emulator
Auth, concurrent Firestore transactions, bounded backups, and denied access.

Verified on 2026-10-18: 12 model tests passed; all 8 emulator scenarios passed
inside their parent test. The Vite build passed with a warning about the Firebase
SDK bundle exceeding 500 kB. Browser checks covered email account creation,
guest copying, cloud transfer, offline-device divergence, conflict resolution,
session/save recovery after reload, separate accounts, and simulated Google login.
Desktop and Pixel 7 CSS layouts were inspected with no horizontal overflow.
This does not establish physical Android behavior or production OAuth readiness.

The rules are a prototype for owner-only reads and constrained snapshot writes.
Review them before any live deployment. They do not validate the opaque game's
contents, protect real-money entitlements, implement account deletion, or rate
limit abuse. A production integration also needs a consistent game-owned export
and restore boundary, migrations, startup/time-away ordering, Android native
auth handling, and recovery acceptance on actual devices. iPhone support is later.

References: [Auth emulator](https://firebase.google.com/docs/emulator-suite/connect_auth),
[Firestore emulator](https://firebase.google.com/docs/emulator-suite/connect_firestore),
[transactions](https://firebase.google.com/docs/firestore/manage-data/transactions).
