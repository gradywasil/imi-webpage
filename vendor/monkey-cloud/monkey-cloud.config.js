// Monkey Cloud config: the shipped "off" stub. Load it BEFORE monkey-cloud.js, like a real config.
//
// It deliberately sets nothing, so MonkeyCloud.status() is 'off' in every game: the game plays exactly
// as before, nothing is sent anywhere, Firebase is never loaded, and stats still reach the hub through
// postMessage when the game runs inside it. The file exists so that every game can load it
// unconditionally: a classic <script src> must not 404, monkey-sled's test/pwa.js wants every script
// precached, and a Vite import of a missing file fails the build.
//
// It also leaves an existing window.MONKEY_CLOUD_CONFIG alone, so a test harness can inject an emulator
// config before the page's scripts run (README "Test a game against the emulators").
//
// Once the Firebase project exists (README steps 1-5):
//   1. Replace this whole file with monkey-cloud.config.example.js and fill it in (README step 6).
//   2. node scripts/sync-sdk.mjs --write   copies it into every game.
//   3. In each classic game bump the service-worker cache name (the file is precached), rebuild the
//      Vite apps, and deploy.
