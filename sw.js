/* Service worker: makes the site installable and playable offline.
   Network first (so a deploy is picked up as soon as you are online), falling back to the last copy we saw.
   The game shell is stored up front; everything else (library texts, archives, fonts) is stored the first time it is used. */
const VERSION = 'imi-v102';
const SHELL = ['./', 'index.html', 'classic.html', 'styles.css', 'classic.css', 'ops.css', 'gems.css', 'gems.js', 'juice.css', 'juice.js', 'longgame-fx.css', 'longgame-fx.js', 'pickups.css', 'classic-fx.css', 'pixel-fx.css',
  'game-features.js', 'awards-catalogue.js', 'seasons.js', 'seasons.css', 'hall.js', 'hall.css', 'commission-board.js', 'commission-board.css', 'works.js', 'works-catalogue.js', 'works-play.js', 'archive.js', 'estate.js', 'layers.js', 'layers.css', 'folio.js', 'training-pool.js', 'production-goal.js', 'production-goal.css', 'auto-challenge.js', 'automation.js', 'automation.css', 'minigame-progression.js', 'minigame-progression.css', 'minigames/hosted-bridge.js', 'minigames/mg-core.js', 'minigames/mg-art.js', 'minigames/mg-art3.js', 'minigames/mg-crew.js', 'minigames/mg.css', 'minigames/repair-kit.js', 'minigames/repair.html',
  'minigames/repairs/leak.js', 'minigames/repairs/jam.js', 'minigames/repairs/keys.js', 'minigames/repairs/carriage.js', 'minigames/repairs/ribbon.js', 'minigames/repairs/overheat.js', 'minigames/repairs/nap.js', 'minigames/repairs/termites.js', 'minigames/repairs/cards.js', 'minigames/repairs/slump.js', 'minigames/repairs/typos.js', 'minigames/repairs/shelf.js', 'minigames/repairs/jinx.js', 'minigames/repairs/raven.js', 'minigames/repairs/coconut.js', 'minigames/repairs/snack.js', 'minigames/repairs/critic.js', 'minigames/repairs/flood.js', 'minigames/repairs/fuses.js', 'minigames/repairs/tangle.js',
  'vault-save-gate.js', 'rewards.js', 'vault.js', 'vault-play.js', 'economy.js', 'cycle-log.js', 'legacy-b.js', 'foreman.js', 'workshop.js', 'workshop-ui.js', 'house.js', 'house-ui.js', 'campus.js', 'campus-ui.js', 'core.js', 'app.js', 'classic.js', 'classic-fx.js', 'pixel-fx.js', 'pixel.js', 'crew-art.js', 'crew-svg.js', 'muse-art.js', 'vendor/monkey-cloud/monkey-cloud.config.js', 'vendor/monkey-cloud/monkey-cloud.js', 'cloud-sync.js', 'ops.js', 'tour.js', 'pickups.js', 'weather.js', 'mood.js', 'world.js', 'style-swap.js', 'readers.js', 'readers-kids.js', 'readers-w5.js', 'readers-w7.js', 'readers-w9.js', 'library.js', 'pwa.js',
  'manifest.webmanifest', 'favicon.svg', 'favicon.ico', 'icons/favicon-32.png', 'icons/favicon-48.png', 'icons/icon-192.png', 'icons/icon-512.png'];
const RUNTIME = VERSION + '-runtime', MAX_RUNTIME = 300;
// Monkey Cloud (cloud-sync.js) loads Firebase from here with import() after a sign-in. Versioned, immutable files: cache first, in the
// VERSION cache (the runtime cache is trimmed), so a signed-in player's game can restore its session offline.
// Keep the version in step with FIREBASE_VERSION in vendor/monkey-cloud/monkey-cloud.js.
const FIREBASE = 'https://www.gstatic.com/firebasejs/13.1.0/';

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => { /* a missing optional file must not block install */ })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => !k.startsWith(VERSION)).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

async function trim(cache) { const keys = await cache.keys(); for (let i = 0; i < keys.length - MAX_RUNTIME; i++) await cache.delete(keys[i]); }
async function networkFirst(req) {
  const cache = await caches.open(RUNTIME);
  try {
    const res = await fetch(req);
    if (res && (res.ok || res.type === 'opaque')) { cache.put(req, res.clone()).then(() => trim(cache)); }
    return res;
  } catch (err) {
    const hit = (await caches.match(req, { ignoreSearch: true })) || (req.mode === 'navigate' ? await caches.match('index.html') : null);
    if (hit) return hit;
    throw err;
  }
}
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET') return;
  if (req.url.startsWith(FIREBASE)) { e.respondWith(caches.open(VERSION).then(async c => (await c.match(req)) || fetch(req).then(res => { if (res.ok) c.put(req, res.clone()); return res; }))); return; }
  const same = url.origin === location.origin, font = /(^|\.)fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (!same && !font) return;
  e.respondWith(networkFirst(req));
});
