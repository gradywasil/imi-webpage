/*! Monkey Cloud SDK 0.2.0 */
/*
 * Monkey Cloud: opt-in stats sync for the Infinite Monkey games.
 * Source of truth: monkey-cloud/sdk/monkey-cloud.js (see README.md, docs/DESIGN.md).
 *
 * A classic script with no imports or exports: use it as <script src="monkey-cloud.js">
 * or `import './monkey-cloud.js'` in Vite. It defines window.MonkeyCloud.
 *
 * - The local save is the source of truth; the cloud mirrors a few numbers.
 * - Nothing leaves the device until the player signs in (Google or an email link).
 * - Firebase (app, auth, firestore-lite) is loaded with import() only after a sign-in.
 * - Every public method is wrapped: nothing here ever throws into game code.
 */
(function (G) {
  'use strict';
  if (!G || G.MonkeyCloud) return;

  const VERSION = '0.2.0';
  const FIREBASE_VERSION = '13.1.0'; // pinned; www.gstatic.com/firebasejs/13.1.0/ checked 2026-10-25
  // Keep in step with isGame() / isCabinet() in firestore.rules. Room for 'imd', 'imsh' later.
  const GAMES = ['imi', 'ims', 'imt', 'imu', 'imw', 'imv', 'hub'];
  const CABINETS = ['whack', 'dash', 'hop', 'slice', 'rhythm', 'tidy', 'packer', 'stack', 'stall',
    'heist', 'barrel', 'shuffle', 'plinko', 'bowling', 'vine'];
  const KEY_RE = /^[a-zA-Z0-9_]{1,32}$/; // also checked by keysOk() in firestore.rules
  const MILESTONE_RE = /^[a-zA-Z0-9_-]{1,48}$/;
  const MAX_STATS = 64;
  const MAX_ABS = 1e300; // |stat| cap: 64 of them never overflow the rules' finite-sum check
  const MAX_MILESTONES_READ = 200; // profile() reads at most this many milestone docs
  const MAX_INT = Number.MAX_SAFE_INTEGER;
  const THROTTLE = 30000; // at most one write per document per 30 s
  const FLOOR = 11000; // rules allow one update per doc per 10 s; +1 s for clock skew
  const COALESCE = 2000; // gather a burst of reports into one write
  const MAX_BACKOFF = 15 * 60000;
  const FLAG = 'mc:auth'; // "signed in on this device before": load Firebase at startup
  const EMAIL = 'mc:email'; // the address an email link was sent to
  const DEL = 'mc:del'; // uid whose deletion is half done: never upload for it
  const LINK_PARAMS = ['mode', 'oobCode', 'apiKey', 'lang'];
  const NET = ['unavailable', 'deadline-exceeded', 'network-request-failed'];
  const EMULATOR = { auth: 'http://127.0.0.1:9299', firestore: ['127.0.0.1', 8189] };
  const DEMO_ID = 'demo-monkey-cloud';
  const DEMO = { apiKey: DEMO_ID, authDomain: DEMO_ID + '.firebaseapp.com', projectId: DEMO_ID, appId: DEMO_ID };

  // ---------- state ----------
  let game = null, build = '', statsFn = null, mono = new Set(), accent = null, themeName = null, cfg = null;
  let status = 'off', user = null, net = 'ok';
  let fb = null, fbP = null, loader = null, gisP = null, pendingLink = null;
  let timer = null, timerAt = 0, busy = false, again = false, inflight = null;
  let fails = 0, denied = 0, retryAt = 0, stopped = false, playerOk = null;
  const subs = { user: [], status: [], profile: [] };

  // ---------- helpers ----------
  const now = () => Date.now();
  const store = () => { try { return G.localStorage; } catch (e) { return null; } };
  const lsGet = (k) => { try { return store().getItem(k); } catch (e) { return null; } };
  const lsSet = (k, v) => { try { store().setItem(k, v); } catch (e) { /* quota / private mode */ } };
  const lsDel = (k) => { try { store().removeItem(k); } catch (e) { /* ignore */ } };
  const codeOf = (e) => String(e?.code || e?.name || 'unknown').replace(/^(auth|firestore)\//, '');
  const isNum = (v) => typeof v === 'number' && isFinite(v);
  const size = (o) => Object.keys(o).length;
  const no = (error, more) => ({ ok: false, error, ...more });
  /** Merge rule for one stat: max for monotonic keys, latest for the rest. */
  const merge = (k, old, v) => (mono.has(k) && isNum(old) ? Math.max(old, v) : v);
  const int = (v) => (isNum(v) ? Math.min(MAX_INT, Math.max(0, Math.floor(v))) : 0);
  const ms = (t) => (typeof t?.toMillis === 'function' ? t.toMillis() : 0);
  const offline = () => G.navigator?.onLine === false;
  const embedded = () => { try { return !!G.parent && G.parent !== G; } catch (e) { return false; } };
  const isNet = (e) => NET.includes(codeOf(e)) || offline() || e instanceof TypeError;
  const emit = (evt, v) => subs[evt].slice().forEach((fn) => { try { fn(v); } catch (e) { /* listener bug */ } });

  /** Firestore refuses field names that start and end with "__", so those are dropped too. */
  const okKey = (k) => KEY_RE.test(k) && !/^__.*__$/.test(k);
  /** Only valid keys with finite numbers (|v| <= 1e300), at most 64 of them. */
  function clean(stats) {
    const out = {};
    if (stats && typeof stats === 'object') {
      for (const k of Object.keys(stats)) {
        const v = stats[k];
        if (size(out) < MAX_STATS && okKey(k) && isNum(v) && Math.abs(v) <= MAX_ABS) out[k] = v;
      }
    }
    return out;
  }

  // ---------- the local queue: localStorage['mc:q:<game>'] ----------
  function Q() {
    let q;
    try { q = JSON.parse(lsGet('mc:q:' + game)); } catch (e) { /* corrupt: start over */ }
    if (q?.v !== 1) q = {};
    const list = (a) => (Array.isArray(a) ? a : []);
    const stats = clean(q.stats);
    // keys: stats changed since the last successful write. Only these overwrite the cloud's value for
    // "latest" keys, so a device that did not touch a stat never undoes another device's newer value.
    // urgent: report({ now: true }) is waiting, so the stats go out at the 10 s floor, not the 30 s throttle.
    return { v: 1, stats, keys: list(q.keys).filter((k) => k in stats), urgent: !!q.urgent, lastSentAt: +q.lastSentAt || 0, uid: q.uid || null,
      arcade: Object(q.arcade), ms: list(q.ms), done: list(q.done) };
  }
  const saveQ = (q) => lsSet('mc:q:' + game, JSON.stringify(q));
  const pending = (q = Q()) => q.keys.length > 0 || q.ms.length > 0 || Object.values(q.arcade).some((a) => a?.dirty);

  // ---------- status ----------
  const blocked = () => !!user && lsGet(DEL) === user.uid;
  function computeStatus() {
    if (!cfg || !game) return 'off';
    const off = net === 'offline' || offline();
    // Signed out, but this device has a session to restore: syncing while Firebase loads.
    if (!user) return lsGet(FLAG) !== '1' ? 'local' : off ? 'offline' : net === 'error' ? 'error' : 'syncing';
    if (off) return 'offline';
    if (net === 'error' || blocked()) return 'error';
    return busy || pending() ? 'syncing' : 'synced';
  }
  function refresh() {
    const s = computeStatus();
    if (s !== status) { status = s; emit('status', s); }
  }

  // ---------- postMessage bridge to the hub (works with no backend at all) ----------
  const update = (stats) => ({ type: 'imi-profile:update', game, stats, v: 1 });
  function postUpdate(stats) {
    if (!embedded() || !size(stats)) return;
    try { G.parent.postMessage(update(stats), '*'); } catch (e) { /* ignore */ }
  }
  function currentStats() {
    if (statsFn) { try { return clean(statsFn()); } catch (e) { /* game bug */ } }
    return Q().stats;
  }
  function onMessage(e) {
    if (e?.data?.type !== 'imi-profile:hello' || !embedded() || e.source !== G.parent) return;
    const origin = e.origin && e.origin !== 'null' ? e.origin : '*';
    try { e.source.postMessage(update(currentStats()), origin); } catch (x) { /* ignore */ }
  }

  // ---------- scheduling ----------
  /** Earliest time queued work may be written: honours the 30 s throttle, the 10 s rules floor and backoff. */
  function dueAt(q, t, fast) {
    let due = null;
    const take = (x) => { due = due === null ? x : Math.min(due, x); };
    const soon = t + (fast ? 0 : COALESCE), gap = fast ? FLOOR : THROTTLE;
    if (q.keys.length) take(q.urgent ? Math.max(t, q.lastSentAt + FLOOR) : Math.max(soon, q.lastSentAt + gap));
    for (const a of Object.values(q.arcade)) if (a?.dirty) take(Math.max(soon, (a.at || 0) + gap));
    if (q.ms.length) take(soon);
    return due === null ? null : Math.max(due, retryAt);
  }
  function schedule(fast) {
    if (!user || !fb || stopped || blocked() || P?.hold) return refresh();
    const t = now(), due = dueAt(Q(), t, fast);
    if (due !== null && !(timer && timerAt <= due)) {
      clearTimeout(timer);
      timerAt = due;
      timer = setTimeout(flush, Math.max(0, due - t));
    }
    refresh();
  }

  const healthy = () => { fails = 0; denied = 0; retryAt = 0; stopped = false; net = 'ok'; };

  /**
   * Run fn while holding this game's flush lock (Web Locks), so two tabs of the same game never write
   * at the same time (the loser would hit the 10 s rules floor). Resolves 'busy' if another tab holds it.
   */
  function exclusive(fn) {
    let locks = null;
    try { locks = G.navigator?.locks; } catch (e) { /* ignore */ }
    if (typeof locks?.request !== 'function') return fn();
    return locks.request('mc:flush:' + game, { ifAvailable: true }, (lock) => (lock ? fn() : 'busy'));
  }

  function flush() {
    timer = null; timerAt = 0;
    if (inflight) { again = true; return inflight; }
    if (!user || !fb || blocked() || P?.hold) return refresh();
    if (offline()) { net = 'offline'; return refresh(); } // the 'online' event resumes
    busy = true; refresh();
    const uid = user.uid;
    inflight = exclusive(() => writeQueued(uid)).then((r) => {
      // Another tab of this game is writing the shared queue right now: look again after the floor.
      if (r === 'busy') retryAt = now() + FLOOR; else healthy();
    }, (e) => {
      if (codeOf(e) === 'permission-denied') {
        // Usually the 10 s rate limit (another device just wrote): try later, give up after 3 in a row.
        if (++denied >= 3) { net = 'error'; stopped = true; } else retryAt = now() + FLOOR;
      } else {
        net = isNet(e) ? 'offline' : 'error';
        retryAt = now() + Math.min(MAX_BACKOFF, 5000 * 2 ** fails++);
      }
    }).finally(() => {
      busy = false; inflight = null;
      if (user?.uid === uid) schedule(again);
      again = false;
      refresh();
    });
    return inflight;
  }

  /** Write everything queued for uid. Stops before the next write once a deletion, a held panel or a user switch says so. */
  async function writeQueued(uid) {
    const halt = () => !user || user.uid !== uid || blocked() || !!P?.hold;
    await ensurePlayer();
    let q = Q();
    if (q.keys.length && now() >= q.lastSentAt + FLOOR) {
      if (halt()) return;
      const sent = q.stats, keys = q.keys;
      await writeGame(sent, keys);
      q = Q(); // a report() may have landed during the write: keep the keys that changed again
      q.keys = q.keys.filter((k) => !keys.includes(k) || q.stats[k] !== sent[k]);
      q.urgent = false;
      q.lastSentAt = now(); q.uid = uid; saveQ(q);
    }
    for (const [cab, a] of Object.entries(q.arcade)) {
      if (!a?.dirty || now() < (a.at || 0) + FLOOR) continue;
      if (halt()) return;
      await writeArcade(cab, a.best, a.plays);
      q = Q();
      const cur = q.arcade[cab] || { best: 0, plays: 0 };
      cur.plays = Math.max(0, cur.plays - a.plays); cur.at = now();
      cur.dirty = cur.plays > 0 || cur.best > a.best;
      q.arcade[cab] = cur; saveQ(q);
    }
    for (const id of q.ms.slice()) {
      if (halt()) return;
      await writeMilestone(id);
      q = Q(); q.ms = q.ms.filter((x) => x !== id); q.done = q.done.concat(id).slice(-200); saveQ(q);
    }
  }

  // ---------- Firestore writes (all transactions: read, merge, write) ----------
  const ref = (...path) => fb.F.doc(fb.db, 'players', user.uid, ...path);
  const tx = (fn) => fb.F.runTransaction(fb.db, fn);
  const stamp = () => fb.F.serverTimestamp();

  /** players/{uid}: create it, and note the last game played. Best effort, once per session. */
  async function ensurePlayer() {
    if (playerOk === user.uid) return;
    const r = ref();
    try {
      await tx(async (t) => {
        const snap = await t.get(r), d = snap.exists() ? snap.data() : null;
        // An update inside the 10 s window is refused by the rules; that is fine, it is only a hint.
        if (d?.lastGame !== game) t.set(r, { ...d, v: 1, createdAt: d?.createdAt || stamp(), updatedAt: stamp(), lastGame: game });
      });
    } catch (e) {
      if (isNet(e)) throw e; // offline: stop this flush
    }
    playerOk = user.uid;
  }

  /**
   * Monotonic keys keep the max across devices. Other keys take this device's value if it changed
   * here since the last write (`keys`) or the cloud has none; otherwise the cloud's value stays.
   */
  function writeGame(local, keys) {
    const r = ref('games', game);
    return tx(async (t) => {
      const snap = await t.get(r), d = snap.exists() ? snap.data() : null;
      const stats = clean(d?.stats);
      for (const [k, v] of Object.entries(local)) {
        if (mono.has(k) || keys.includes(k) || !(k in stats)) stats[k] = merge(k, stats[k], v);
      }
      for (const k of Object.keys(stats)) {
        if (size(stats) <= MAX_STATS) break;
        if (!(k in local)) delete stats[k]; // over the cap: drop server-only keys first
      }
      t.set(r, { v: 1, stats, build, updatedAt: stamp(), firstAt: d?.firstAt || stamp() });
    });
  }

  async function writeArcade(cab, best, plays) {
    const r = ref('arcade', cab);
    await tx(async (t) => {
      const snap = await t.get(r), d = snap.exists() ? snap.data() : {};
      t.set(r, { v: 1, best: Math.max(int(d.best), int(best)), plays: int(int(d.plays) + int(plays)), updatedAt: stamp() });
    });
  }

  async function writeMilestone(id) {
    const r = ref('milestones', game + '_' + id);
    await tx(async (t) => {
      if (!(await t.get(r)).exists()) t.set(r, { v: 1, game, id, at: stamp() });
    });
  }

  // ---------- Firebase loading (lazy) ----------
  /** https://www.gstatic.com/firebasejs/<ver>/firebase-{app,auth,firestore-lite}.js (ES modules). */
  function cdnLoader(ver) {
    return Promise.all(['app', 'auth', 'firestore-lite'].map((m) => import(/* @vite-ignore */ `https://www.gstatic.com/firebasejs/${ver}/firebase-${m}.js`)))
      .then(([app, auth, firestore]) => ({ app, auth, firestore }));
  }

  function loadFirebase() {
    if (fbP) return fbP;
    if (!cfg) return Promise.reject({ code: 'off' });
    // Never import() while offline: Chrome remembers a failed module fetch for the life of the page, so
    // one offline attempt would break sign-in and sync until a reload. The 'online' event boots instead.
    if (offline()) { net = 'offline'; refresh(); return Promise.reject({ code: 'network-request-failed' }); }
    net = 'ok';
    refresh();
    fbP = (async () => {
      let mods;
      try { mods = await (loader || cdnLoader)(cfg.sdkVersion); } catch (e) { throw { code: 'load-failed', cause: e }; }
      const { app: A, auth: U, firestore: F } = mods;
      const name = cfg.appName || 'monkey-cloud';
      const app = A.getApps?.().find((a) => a.name === name) || A.initializeApp(cfg.firebase, name);
      let auth;
      try {
        // No popupRedirectResolver: it is passed to signInWithPopup only, so a page load never
        // opens the authDomain iframe (third-party storage partitioning, TWA).
        auth = U.initializeAuth(app, { persistence: [U.indexedDBLocalPersistence, U.browserLocalPersistence].filter(Boolean) });
      } catch (e) { auth = U.getAuth(app); }
      const db = F.getFirestore(app), em = cfg.emulator;
      if (em) {
        try { U.connectAuthEmulator(auth, em.auth, { disableWarnings: true }); } catch (e) { /* already connected */ }
        try { F.connectFirestoreEmulator(db, em.firestore[0], em.firestore[1]); } catch (e) { /* already connected */ }
      }
      fb = { U, F, auth, db };
      await new Promise((resolve) => {
        let first = true;
        U.onAuthStateChanged(auth, (u) => { onUser(u); if (first) { first = false; resolve(); } });
      });
      return fb;
    })().catch((e) => {
      fbP = null;
      // load-failed: the gstatic modules did not arrive (network, or a blocked host). Shown as 'offline';
      // in Chrome only a reload (or a service worker that caches the files) can fix it.
      net = isNet(e) || e?.code === 'load-failed' ? 'offline' : 'error';
      refresh();
      throw e;
    });
    return fbP;
  }

  const toUser = (u) => ({
    uid: u.uid, name: u.displayName || null, email: u.email || null,
    provider: (u.providerData || []).some((p) => p?.providerId === 'google.com') ? 'google' : 'email',
  });

  function onUser(u) {
    const prev = user;
    user = u ? toUser(u) : null;
    if (u) lsSet(FLAG, '1'); else lsDel(FLAG);
    if (!u) { clearTimeout(timer); timer = null; playerOk = null; net = 'ok'; }
    if (u && prev?.uid !== u.uid) {
      healthy();
      const q = Q();
      if (q.uid !== u.uid && size(q.stats)) { q.keys = Object.keys(q.stats); saveQ(q); } // new account: send all
      report(undefined, { now: true }); // merge on sign-in: this device's stats go up straight away
    }
    refresh();
    if (prev?.uid !== user?.uid) emit('user', user && { ...user });
  }

  // ---------- public API ----------
  function init(o = {}) {
    if (game) { // a second init() may update the hooks, never the game id
      if (typeof o.stats === 'function') statsFn = o.stats;
      if (o.build) build = String(o.build).slice(0, 40);
      return api;
    }
    if (!GAMES.includes(o.game)) {
      G.console?.warn('[MonkeyCloud] init: unknown game id', o.game);
      return api;
    }
    game = o.game;
    build = String(o.build || '').slice(0, 40);
    statsFn = typeof o.stats === 'function' ? o.stats : null;
    mono = new Set(Array.isArray(o.monotonic) ? o.monotonic : []);
    accent = typeof o.ui?.accent === 'string' ? o.ui.accent : null;
    themeName = typeof o.ui?.theme === 'string' ? o.ui.theme : null;
    cfg = resolveConfig();
    const listen = (t, fn) => G.addEventListener?.(t, fn);
    listen('message', onMessage);
    listen('online', () => {
      net = 'ok'; retryAt = 0;
      if (fb) schedule(true); else if (cfg && lsGet(FLAG) === '1') boot();
      refresh();
    });
    listen('offline', refresh);
    G.document?.addEventListener?.('visibilitychange', () => {
      if (G.document.visibilityState === 'hidden') report(undefined, { now: true }); // best effort
    });
    refresh();
    if (cfg && (lsGet(FLAG) === '1' || emailLinkIn(href()))) setTimeout(boot, 0);
    return api;
  }

  function boot() {
    return loadFirebase().then(async () => {
      if (!emailLinkIn(href())) return;
      const r = await completeEmailLink();
      if (r.needEmail) openPanel('confirm-email');
      else if (r.reauth) openPanel('confirm-delete', 'Confirmed. You can delete the account now.', 'ok');
      else if (!r.ok) openPanel(undefined, errText(r.error), 'bad'); // expired or used link: say so
    }).catch(() => { /* status already says offline or error */ });
  }

  function resolveConfig() {
    const c = G.MONKEY_CLOUD_CONFIG || {}, loc = G.location || {};
    // ?cloud=off (any host): no Firebase on this page load, e.g. the hub's non-interactive live previews.
    // The postMessage bridge to the hub still works.
    if (/[?&]cloud=off(&|$)/.test(loc.search || '')) return null;
    // ?cloud=emulator works on local and LAN hosts only, and always uses the demo project.
    const local = /^(localhost|127\.0\.0\.1|\[::1\])$|^(10|192\.168)\.|\.local$/.test(loc.hostname || '');
    const param = local && /[?&]cloud=emulator(&|$)/.test(loc.search || '');
    const em = c.emulator || (param ? EMULATOR : null);
    let firebase = param && !c.emulator ? DEMO : c.firebase;
    if (!firebase?.apiKey || !firebase?.projectId) {
      if (!em) return null;
      firebase = DEMO;
    }
    // Other keys pass through: googleClientId, privacyUrl, appName (tests).
    return { ...c, firebase, sdkVersion: c.sdkVersion || FIREBASE_VERSION, emulator: em && { ...EMULATOR, ...em } };
  }

  function report(stats, opts) {
    if (!game) return;
    if (stats == null && statsFn) { try { stats = statsFn(); } catch (e) { stats = null; } }
    const q = Q(), fresh = clean(stats);
    let changed = false;
    for (const [k, v] of Object.entries(fresh)) {
      if (!(k in q.stats) && size(q.stats) >= MAX_STATS) continue;
      const next = merge(k, q.stats[k], v);
      if (q.stats[k] !== next) { q.stats[k] = next; changed = true; if (!q.keys.includes(k)) q.keys.push(k); }
    }
    if (opts?.now && q.keys.length && !q.urgent) { q.urgent = true; changed = true; }
    if (changed) { saveQ(q); stopped = false; }
    postUpdate(q.stats);
    schedule(!!opts?.now);
  }

  function arcade(cabinetId, score) {
    if (!game || !CABINETS.includes(cabinetId) || !isNum(score)) return;
    const q = Q(), a = q.arcade[cabinetId] || { best: 0, plays: 0, at: 0 };
    a.best = Math.max(int(a.best), int(score)); a.plays = int(a.plays) + 1; a.dirty = true;
    q.arcade[cabinetId] = a; saveQ(q); stopped = false;
    schedule(false);
  }

  function milestone(id) {
    if (!game || typeof id !== 'string' || !MILESTONE_RE.test(id)) return;
    const q = Q();
    if (q.ms.includes(id) || q.done.includes(id)) return;
    q.ms.push(id); saveQ(q);
    schedule(false);
  }

  const href = () => { try { return String(G.location.href); } catch (e) { return ''; } };
  const emailLinkIn = (link) => /[?&]mode=signIn(&|$)/.test(link) && /[?&]oobCode=/.test(link);
  /** This page without any email-link parameters (the continueUrl, and what the address bar keeps). */
  function stripLink() {
    const u = new URL(href());
    LINK_PARAMS.forEach((k) => u.searchParams.delete(k));
    return u;
  }
  function cleanUrl() {
    try { const u = stripLink(); G.history.replaceState(G.history.state, '', u.pathname + u.search + u.hash); } catch (e) { /* ignore */ }
  }

  async function signIn(method, email) {
    if (!cfg) return no('off');
    if (method !== 'google' && method !== 'email') return no('bad-method');
    email = String(email || '').trim();
    if (method === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return no('invalid-email');
    try {
      const { U, auth } = await loadFirebase();
      if (method === 'email') {
        const url = stripLink(); url.hash = '';
        await U.sendSignInLinkToEmail(auth, email, { url: url.toString(), handleCodeInApp: true });
        lsSet(EMAIL, email);
        return { ok: true, sent: true, email };
      }
      const p = new U.GoogleAuthProvider();
      p.setCustomParameters({ prompt: 'select_account' });
      const r = await U.signInWithPopup(auth, p, U.browserPopupRedirectResolver);
      return { ok: true, user: toUser(r.user) };
    } catch (e) { return no(codeOf(e)); }
  }

  /** Google Identity Services (FedCM button) hands us an ID token; Firebase turns it into a session. */
  async function signInWithIdToken(idToken) {
    try {
      const { U, auth } = await loadFirebase();
      const r = await U.signInWithCredential(auth, U.GoogleAuthProvider.credential(idToken));
      return { ok: true, user: toUser(r.user) };
    } catch (e) { return no(codeOf(e)); }
  }

  async function completeEmailLink(link, email) {
    link = typeof link === 'string' && link ? link : href();
    if (!emailLinkIn(link)) return no('no-link');
    if (!cfg) return no('off');
    const own = link === href();
    try {
      const { U, auth } = await loadFirebase();
      if (!U.isSignInWithEmailLink(auth, link)) return no('no-link');
      // The signed-in player asked for this link to confirm a half-done deletion (reauthenticate('email')):
      // reauthenticate that same account. A link for another address fails with 'user-mismatch'.
      const cur = auth.currentUser, reauth = !!cur && lsGet(DEL) === cur.uid;
      email = String(email || lsGet(EMAIL) || (reauth && cur.email) || '').trim();
      if (!email) { pendingLink = link; return no('need-email', { needEmail: true }); } // opened on another device
      let u;
      if (reauth) u = (await U.reauthenticateWithCredential(cur, U.EmailAuthProvider.credentialWithLink(email, link))).user;
      else u = (await U.signInWithEmailLink(auth, email, link)).user;
      lsDel(EMAIL); pendingLink = null;
      if (own) cleanUrl();
      return reauth ? { ok: true, user: toUser(u), reauth: true } : { ok: true, user: toUser(u) };
    } catch (e) {
      const code = codeOf(e);
      if (/action-code|user-mismatch/.test(code)) { pendingLink = null; if (own) cleanUrl(); } // the link is spent
      return no(code);
    }
  }

  async function signOut() {
    if (fb) await fb.U.signOut(fb.auth);
    return { ok: true };
  }

  /**
   * Confirm the signed-in player again. Firebase only deletes an account after a recent sign-in, so a
   * deleteMyData() that returned 'requires-recent-login' needs this, then deleteMyData() once more.
   * Always the CURRENT account: picking a different one fails with 'user-mismatch' and changes nothing.
   * - 'google': Google popup. (The panel's Google button passes its ID token instead.)
   * - 'email': emails a link to the player's own address; opening it on this device confirms them
   *   (the panel then offers the final delete). Resolves { ok, sent: true, email }.
   */
  async function reauthenticate(method, idToken) {
    if (!user || !fb) return no('not-signed-in');
    const { U, auth } = fb, cur = auth.currentUser;
    if (!cur || cur.uid !== user.uid) return no('not-signed-in');
    method = method || (user.provider === 'email' ? 'email' : 'google');
    try {
      if (idToken) {
        await U.reauthenticateWithCredential(cur, U.GoogleAuthProvider.credential(idToken));
      } else if (method === 'email') {
        if (!cur.email) return no('invalid-email');
        const url = stripLink(); url.hash = '';
        await U.sendSignInLinkToEmail(auth, cur.email, { url: url.toString(), handleCodeInApp: true });
        lsSet(EMAIL, cur.email);
        return { ok: true, sent: true, email: cur.email };
      } else if (method === 'google') {
        const p = new U.GoogleAuthProvider();
        p.setCustomParameters({ prompt: 'select_account', ...(cur.email ? { login_hint: cur.email } : {}) });
        await U.reauthenticateWithPopup(cur, p, U.browserPopupRedirectResolver);
      } else return no('bad-method');
      return { ok: true, user: toUser(cur) };
    } catch (e) { return no(codeOf(e)); }
  }

  const emptyProfile = () => ({ source: 'none', games: {}, arcade: {}, milestones: [] });

  async function profile() {
    if (!user || !fb) return emptyProfile();
    try {
      const { F, db } = fb, col = (c) => F.collection(db, 'players', user.uid, c);
      // Milestones are capped: rules cannot count docs, so a tampered client could create thousands (R4).
      const [g, a, m] = await Promise.all([F.getDocs(col('games')), F.getDocs(col('arcade')),
        F.getDocs(F.query(col('milestones'), F.limit(MAX_MILESTONES_READ)))]);
      const p = { source: 'cloud', games: {}, arcade: {}, milestones: [] };
      const each = (snap, fn) => snap.docs.forEach((d) => fn(d.id, d.data()));
      each(g, (id, x) => { p.games[id] = { stats: clean(x.stats), build: x.build || '', updatedAt: ms(x.updatedAt), firstAt: ms(x.firstAt) }; });
      each(a, (id, x) => { p.arcade[id] = { best: int(x.best), plays: int(x.plays), updatedAt: ms(x.updatedAt) }; });
      each(m, (id, x) => { p.milestones.push({ game: x.game, id: x.id, at: ms(x.at) }); });
      emit('profile', p);
      return p;
    } catch (e) { return { ...emptyProfile(), error: codeOf(e) }; }
  }

  /**
   * Delete every document under players/{uid}, then the account. If Firebase wants a recent sign-in
   * ('requires-recent-login'), the data is already gone and the DEL marker blocks re-uploads for that
   * uid until reauthenticate() succeeds and this runs again, or cancelDelete() keeps the account.
   */
  async function deleteMyData() {
    if (!user || !fb) return no('not-signed-in');
    const { F, U, db, auth } = fb, uid = user.uid, resumed = lsGet(DEL) === uid;
    let deleted = 0;
    lsSet(DEL, uid); clearTimeout(timer); timer = null;
    // A flush already writing stops at its next write (it sees the marker); wait for it, so nothing
    // it writes can land after the listing below and outlive the account.
    if (inflight) await inflight.catch(() => {});
    try {
      for (const c of ['games', 'arcade', 'milestones']) {
        const snap = await F.getDocs(F.collection(db, 'players', uid, c));
        await Promise.all(snap.docs.map((d) => F.deleteDoc(d.ref).then(() => deleted++)));
      }
      await F.deleteDoc(F.doc(db, 'players', uid)); deleted++;
    } catch (e) {
      if (!resumed) lsDel(DEL); // a first attempt failed before deleting everything: uploads may resume
      refresh();
      return no(codeOf(e), { deleted });
    }
    // Forget what was pushed for that account. Local stats stay: the save is the source of truth.
    const q = Q();
    Object.assign(q, { uid: null, lastSentAt: 0, done: [], ms: [], keys: Object.keys(q.stats) });
    saveQ(q);
    try {
      // Only ever the account whose data was just deleted.
      if (auth.currentUser?.uid !== uid) throw { code: 'user-mismatch' };
      await U.deleteUser(auth.currentUser);
    } catch (e) {
      refresh();
      return no(codeOf(e), { dataDeleted: true, deleted });
    }
    lsDel(DEL); lsDel(FLAG);
    refresh();
    return { ok: true, deleted };
  }

  /** Keep the account after a half-done deletion: clear the marker and upload this device's stats again. */
  function cancelDelete() {
    lsDel(DEL); stopped = false;
    report(undefined, { now: true });
    return { ok: true };
  }

  function on(evt, fn) {
    if (!Object.hasOwn(subs, evt) || typeof fn !== 'function') return () => {};
    subs[evt].push(fn);
    return () => { subs[evt] = subs[evt].filter((f) => f !== fn); };
  }

  // ---------- the panel: one small self-contained modal ----------
  // All rules live under .mc-root. The reset uses :where() so it adds no specificity, which lets every
  // component rule (.mc-root .mc-x = 0,2,0) beat it, while still beating a game's bare `button {…}` /
  // `input {…}` styles. The Google button slot (.mc-gis) and the logo SVG are left alone.
  const CSS = [
    '.mc-root{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:12px;background:rgba(4,10,7,.74);font:22px/1.1 var(--mc-body);color:var(--mc-text);text-align:left;-webkit-text-size-adjust:100%;-webkit-font-smoothing:none}',
    '.mc-root :where(*:not(.mc-gis *,svg,svg *)){box-sizing:border-box;margin:0;padding:0;border:0;border-radius:0;background:none;box-shadow:none;font:inherit;color:inherit;line-height:inherit;letter-spacing:normal;text-transform:none;text-shadow:none;text-align:inherit;text-decoration:none;min-width:0;min-height:0;max-width:none;width:auto;height:auto;float:none;position:static;transform:none;filter:none;opacity:1;animation:none;transition:none;outline:0;cursor:inherit;-webkit-appearance:none;appearance:none}',
    '.mc-root .mc-panel{position:relative;width:min(420px,100%);max-height:100%;overflow:auto;background:var(--mc-panel);border:3px solid var(--mc-ink);box-shadow:var(--mc-bevel),0 6px 0 rgba(0,0,0,.4);padding:16px 18px 16px}',
    '.mc-root .mc-panel:focus{outline:0}',
    '@media (prefers-reduced-motion:no-preference){.mc-root .mc-panel{animation:mc-in .16s steps(4,end)}}@keyframes mc-in{from{transform:translateY(10px);opacity:0}}',
    '.mc-root .mc-head{display:flex;align-items:center;justify-content:space-between;gap:12px}',
    '.mc-root .mc-title{font:12px/1.4 var(--mc-title-font);letter-spacing:.04em;text-transform:uppercase;color:var(--mc-title);text-shadow:2px 2px 0 var(--mc-ink)}',
    '.mc-root .mc-x{flex:none;width:44px;height:44px;margin:-6px -10px 0 0;background:none;border:0;box-shadow:none;font:16px/1 var(--mc-title-font);text-align:center;color:var(--mc-text);text-shadow:2px 2px 0 var(--mc-ink);cursor:pointer}',
    '.mc-root .mc-x:hover{color:var(--mc-title)}',
    '.mc-root .mc-status{display:flex;align-items:center;gap:9px;margin:4px 0 14px;font-size:22px;color:var(--mc-mute)}',
    '.mc-root .mc-dot{flex:none;width:12px;height:12px;background:var(--mc-dim);border:3px solid var(--mc-ink);box-sizing:content-box}',
    '.mc-root .mc-dot[data-s=synced]{background:var(--mc-ok)}.mc-root .mc-dot[data-s=syncing]{background:var(--mc-accent)}.mc-root .mc-dot[data-s=error]{background:var(--mc-bad)}',
    '.mc-root .mc-body>*+*{margin-top:12px}.mc-root .mc-lead{color:var(--mc-text)}.mc-root strong{font-weight:400;color:var(--mc-title)}',
    '.mc-root .mc-btn{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;min-height:44px;padding:10px 14px;border:3px solid var(--mc-ink);background:var(--mc-btn);color:var(--mc-btn-text);font:10px/1.3 var(--mc-title-font);text-align:center;text-shadow:2px 2px 0 var(--mc-ink);cursor:pointer;box-shadow:var(--mc-bevel),0 3px 0 rgba(0,0,0,.45)}',
    '.mc-root .mc-btn:hover{filter:brightness(1.1)}.mc-root .mc-btn:active{transform:translateY(2px);box-shadow:var(--mc-bevel),0 1px 0 rgba(0,0,0,.45)}.mc-root .mc-btn:disabled{opacity:.55;cursor:default;filter:none}',
    '.mc-root .mc-pri{background:var(--mc-accent);color:var(--mc-ink);text-shadow:none}.mc-root .mc-g{background:var(--mc-cream);color:#1f1f1f;text-shadow:none}.mc-root .mc-bad{background:var(--mc-bad);color:var(--mc-text)}',
    '.mc-root svg{flex:none;width:18px;height:18px}',
    '.mc-root :focus-visible{outline:3px solid var(--mc-text);outline-offset:2px}',
    '.mc-root .mc-lbl{display:block;margin-bottom:6px;font-size:22px;color:var(--mc-mute)}',
    '.mc-root .mc-in{display:block;width:100%;min-height:44px;margin-bottom:10px;padding:8px 12px;background:var(--mc-inset);border:3px solid var(--mc-ink);box-shadow:inset 0 3px 0 rgba(0,0,0,.35);font-size:24px;color:var(--mc-text);cursor:text}',
    '.mc-root .mc-in::placeholder{color:var(--mc-dim);opacity:1}',
    '.mc-root .mc-or{display:flex;align-items:center;gap:10px;font:9px/1 var(--mc-title-font);text-transform:uppercase;color:var(--mc-mute)}.mc-root .mc-or:before,.mc-root .mc-or:after{content:"";flex:1;height:3px;background:var(--mc-edge)}',
    '.mc-root .mc-row{display:flex;gap:10px}.mc-root .mc-row>*{flex:1}',
    '.mc-root .mc-msg{margin-top:12px;font-size:22px;color:var(--mc-text)}.mc-root .mc-msg[data-tone=bad]{color:var(--mc-bad-text)}.mc-root .mc-msg[data-tone=ok]{color:var(--mc-ok-text)}.mc-root .mc-msg:empty{display:none}',
    '.mc-root .mc-who{padding:8px 12px;background:var(--mc-inset);border:3px solid var(--mc-ink);overflow-wrap:anywhere}',
    '.mc-root .mc-tag{display:inline-block;margin-left:6px;padding:2px 6px;border:3px solid var(--mc-ink);font:8px/1.2 var(--mc-title-font);text-transform:uppercase;color:var(--mc-mute);vertical-align:2px}',
    '.mc-root .mc-link{display:inline-flex;align-items:center;min-height:44px;padding:0;background:none;border:0;box-shadow:none;font-size:22px;color:var(--mc-bad-text);text-decoration:underline;text-underline-offset:3px;cursor:pointer}',
    '.mc-root .mc-alt{font-size:20px;color:var(--mc-mute)}',
    '.mc-root .mc-gis{display:flex;justify-content:center;min-height:44px}.mc-root .mc-gis:empty{display:none}.mc-root .mc-gis:not(:empty)+.mc-btn{display:none}.mc-root .mc-gis:empty~.mc-alt{display:none}',
    '.mc-root .mc-note{margin-top:16px;padding-top:12px;border-top:3px dashed var(--mc-edge);font-size:19px;line-height:1.15;color:var(--mc-mute)}.mc-root .mc-note a{color:var(--mc-title);text-decoration:underline;cursor:pointer}',
  ].join('');
  // The panel borrows each game's look: pixel type (Press Start 2P / VT323, which every game already loads), hard ink borders and
  // bevelled buttons. Two palettes: the jungle-and-wood family look (the default) and Night Shift Security's navy. The game's own
  // accent colours the main button; init({ ui: { accent, theme } }) overrides either ('wood' | 'night').
  const WOOD = { panel: '#8a5a2b', ink: '#1a0f14', edge: '#5a3517', inset: '#3a2210', text: '#fff6d6', mute: '#f2e6bf', dim: '#c9b88a', title: '#ffd23a',
    btn: '#2f8a35', 'btn-text': '#fff6d6', accent: '#ffd23a', ok: '#9ccf3f', 'ok-text': '#d9f5a0', bad: '#b8322a', 'bad-text': '#ffd0c4', cream: '#fff6d6' };
  const NIGHT = { panel: '#131a33', ink: '#080c18', edge: '#2e3b70', inset: '#0d1326', text: '#eef2ff', mute: '#b4c0e8', dim: '#7d8bbf', title: '#ffbf3f',
    btn: '#222d58', 'btn-text': '#eef2ff', accent: '#ffbf3f', ok: '#4be0a0', 'ok-text': '#8ff0c4', bad: '#ff5a4a', 'bad-text': '#ffb4a8', cream: '#eef2ff' };
  const THEMES = { wood: WOOD, night: NIGHT };
  const THEME_OF = { imt: 'night' };
  const theme = () => THEMES[themeName] || THEMES[THEME_OF[game]] || WOOD;
  const BEVEL = 'inset 0 3px 0 rgba(255,255,255,.16),inset 0 -3px 0 rgba(0,0,0,.32)';
  const G_LOGO = '<svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.9 6.2C12.5 13.7 17.8 9.5 24 9.5z"/><path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 7l7.4 5.7c4.3-4 6.9-9.9 6.9-17.2z"/><path fill="#FBBC05" d="M10.5 28.6c-.5-1.4-.8-3-.8-4.6s.3-3.2.8-4.6l-7.9-6.2C1 16.5 0 20.1 0 24s1 7.5 2.7 10.8l7.8-6.2z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.7c-2.1 1.4-4.8 2.3-8.5 2.3-6.2 0-11.5-4.2-13.4-9.9l-7.9 6.2C6.6 42.6 14.6 48 24 48z"/></svg>';
  const STATUS_TEXT = { off: 'Cloud sync is off in this build', local: 'Not signed in. Progress stays on this device.', syncing: 'Syncing\u2026',
    synced: 'Synced', offline: 'Offline. Will sync when you are back online.', error: 'Sync paused. Will try again later.' };
  const OFFLINE_MSG = 'You seem to be offline. Try again when connected.', NOT_ENABLED = 'Sign-in is not enabled for this site yet.';
  const ERRORS = { 'invalid-email': 'That email address does not look right.', 'popup-blocked': 'The sign-in window was blocked. Tap the button again.',
    'network-request-failed': OFFLINE_MSG, unavailable: OFFLINE_MSG, 'unauthorized-domain': NOT_ENABLED, 'operation-not-allowed': NOT_ENABLED,
    'quota-exceeded': 'Too many sign-in emails today. Please try later.', 'invalid-action-code': 'That sign-in link expired or was already used. Ask for a new one.',
    'expired-action-code': 'That sign-in link expired. Ask for a new one.', 'popup-closed-by-user': '', 'cancelled-popup-request': '', 'user-cancelled': '',
    TypeError: OFFLINE_MSG, 'load-failed': 'Could not reach the sign-in service. Check your connection, then reload the game to try again.',
    'user-mismatch': 'That is a different account. Choose the account shown above to delete it.',
    'requires-recent-login': 'Please confirm it is you, then try again.' };
  const errText = (code) => (Object.hasOwn(ERRORS, code) ? ERRORS[code] : 'Something went wrong. Please try again.');

  let P = null; // the open panel

  /** h('button.mc-btn.mc-pri', { type: 'button', onclick }, 'text', child...) */
  function h(sel, props, ...kids) {
    const [tag, ...cls] = sel.split('.');
    const e = G.document.createElement(tag);
    if (cls.length) e.className = cls.join(' ');
    for (const [k, v] of Object.entries(props || {})) {
      if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else if (k in e) e[k] = v;
      else e.setAttribute(k, v);
    }
    for (const k of kids) if (k != null) e.append(k);
    return e;
  }
  const btn = (cls, text, fn) => h('button.' + cls, { type: 'button', 'data-k': text, disabled: !!P?.busy, onclick: () => P && !P.busy && fn() }, text);
  /** Switch view; msg shows under the buttons (tone: '' neutral, 'ok', 'bad'). */
  const go = (view, msg = '', tone = '') => { P.view = view; P.msg = msg; P.tone = tone; render(); };
  const oops = (code) => { if (P) { P.msg = errText(code); P.tone = 'bad'; } };

  /** Run an async action with the panel marked busy; the action may set P.view / P.msg. */
  function act(fn) {
    P.busy = true; P.msg = ''; P.tone = ''; render();
    Promise.resolve().then(fn).catch(() => oops()).finally(() => { if (P) { P.busy = false; render(); } });
  }

  /** view: 'main' | 'confirm-delete' | 'confirm-email' | 'reauth' | 'sent'; msg / tone: an opening message. */
  function openPanel(view, msg = '', tone = '') {
    const D = G.document;
    if (!D?.createElement) return false;
    if (!game) G.console?.warn('[MonkeyCloud] openPanel() before init({ game }): the panel can only say that sync is off');
    if (!D.body) { D.addEventListener('DOMContentLoaded', () => openPanel(view, msg, tone)); return true; }
    if (P) { if (view || msg) go(view || P.view, msg, tone); return true; }
    if (!D.getElementById('mc-css')) D.head.append(h('style', { id: 'mc-css', textContent: CSS }));
    const x = h('button.mc-x', { type: 'button', 'aria-label': 'Close', onclick: closePanel }, '\u00d7');
    const dot = h('span.mc-dot'), stText = h('span'), body = h('div.mc-body');
    // One persistent live region: screen readers announce a change of its text, not a node replaced on every render.
    const msgEl = h('p.mc-msg', { 'aria-live': 'polite' });
    const note = h('p.mc-note', null, 'Monkey Cloud keeps your sign-in email and a few game numbers (like best scores) so the Monkey Hub can show them on any device. No ads, no tracking. Nothing is sent until you sign in, and you can delete it all here.',
      cfg?.privacyUrl ? ' ' : null, cfg?.privacyUrl ? h('a', { href: cfg.privacyUrl, target: '_blank', rel: 'noopener' }, 'Privacy policy') : null);
    const panel = h('div.mc-panel', { role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'mc-title', tabIndex: -1 },
      h('div.mc-head', null, h('h2.mc-title', { id: 'mc-title' }, 'Monkey Cloud'), x),
      h('p.mc-status', { role: 'status' }, dot, stText), body, msgEl, note);
    const root = h('div.mc-root', { onmousedown: (e) => e.target === root && closePanel() }, panel);
    const T = theme(), vars = root.style;
    for (const k of Object.keys(T)) vars.setProperty('--mc-' + k, T[k]);
    vars.setProperty('--mc-accent', accent || T.accent);
    vars.setProperty('--mc-bevel', BEVEL);
    vars.setProperty('--mc-body', "'VT323','Courier New',monospace");
    vars.setProperty('--mc-title-font', "'Press Start 2P','Courier New',monospace");
    // hold: opened to delete (openPanel('delete')), so signing in must not upload this device's stats first.
    P = { root, panel, body, msgEl, dot, stText, view: view || (blocked() ? 'reauth' : 'main'), hold: view === 'confirm-delete', msg, tone, email: '', busy: false, back: D.activeElement, offs: [] };
    // Keys are handled on the document while the panel is open, so Escape and the Tab trap still work
    // when focus has fallen out of the panel (e.g. the Google button replaced the focused fallback).
    D.addEventListener('keydown', trapKeys);
    P.offs.push(on('status', render), on('user', onPanelUser), () => D.removeEventListener('keydown', trapKeys));
    D.body.append(root);
    render();
    // Focus the dialog itself: its first control may be swapped out when the Google button renders.
    try { panel.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
    if (cfg && !fb) loadFirebase().catch(() => {}); // warm up, so a popup opens within the click
    return true;
  }

  function onPanelUser(u) {
    if (!P) return;
    // Never act on a sign-in by itself: deleting needs an explicit press (and reauth checks the account).
    if (u && blocked()) go('confirm-delete'); // signed in to an account whose deletion is half done
    else if (u && P.view === 'confirm-delete') render(); // openPanel('delete'): signed in, now confirm
    else if (u) go('main', 'You are signed in. Stats sync in the background.', 'ok');
    else render();
  }

  function closePanel() {
    if (!P) return;
    const p = P;
    P = null;
    p.offs.forEach((f) => f());
    p.root.remove();
    if (p.hold) schedule(false); // uploads held for a delete that did not happen: resume
    try { p.back?.focus?.(); } catch (e) { /* ignore */ }
  }

  function trapKeys(e) {
    if (!P) return;
    if (e.key === 'Escape') { e.preventDefault(); closePanel(); return; }
    if (e.key !== 'Tab') return;
    const f = [...P.panel.querySelectorAll('button:not([disabled]),input,a[href],iframe')].filter((x) => x.getClientRects().length);
    if (!f.length) return;
    const ae = G.document.activeElement, i = f.indexOf(ae), last = f[f.length - 1];
    if (!P.panel.contains(ae)) { e.preventDefault(); (e.shiftKey ? last : f[0]).focus(); } // focus had left the dialog
    else if (e.shiftKey && i <= 0) { e.preventDefault(); last.focus(); } else if (!e.shiftKey && f[i] === last) { e.preventDefault(); f[0].focus(); }
  }

  function emailForm(label, action, submit) {
    const id = 'mc-email-' + P.view;
    return h('form', { onsubmit: (e) => { e.preventDefault(); if (!P.busy) act(() => submit(P.email.trim())); } },
      h('label.mc-lbl', { htmlFor: id }, label),
      h('input.mc-in', { id, type: 'email', autocomplete: 'email', required: true, placeholder: 'you@example.com', value: P.email, oninput: (e) => { P.email = e.target.value; } }),
      h('button.mc-btn.mc-pri', { type: 'submit', disabled: P.busy }, action));
  }

  /**
   * The Google sign-in group: the GIS button slot, the popup fallback (shown until GIS renders), and a
   * small "pop-up instead" link (shown only once GIS rendered, in case FedCM cannot run in this frame).
   */
  function googleBlock(label, popup) {
    const slot = h('div.mc-gis');
    const run = () => act(async () => { const r = await popup(); if (r && !r.ok) oops(r.error); });
    const g = btn('mc-btn.mc-g', label, run);
    g.insertAdjacentHTML('afterbegin', G_LOGO);
    renderGis(slot);
    return h('div', null, slot, g, btn('mc-link.mc-alt', 'Trouble with that button? Use a pop-up instead', run));
  }

  function signInBlock() {
    const google = googleBlock('Continue with Google', () => signIn('google'));
    // config.emailLink === false hides the email option (the Spark plan sends only 5 sign-in emails a day).
    if (cfg.emailLink === false) return [google];
    return [google, h('div.mc-or', null, 'or'), emailForm('Email me a sign-in link', 'Send link', async (v) => {
      const r = await signIn('email', v);
      if (!P) return;
      if (r.ok) { P.view = 'sent'; P.email = r.email; P.sentFor = 'sign-in'; } else oops(r.error);
    })];
  }

  async function finishDelete() {
    const r = await deleteMyData();
    if (!P) return;
    if (r.ok) { P.view = 'main'; P.msg = 'Your Monkey Cloud account and its data are deleted.'; P.tone = 'ok'; P.hold = false; }
    else if (r.error === 'requires-recent-login') P.view = 'reauth'; // data gone; confirm the account, then delete it
    else oops(r.error);
  }

  /**
   * The reauth step: confirm the SAME account (Google popup, the GIS button's ID token, or an email link),
   * then delete it. Another account is refused by Firebase ('user-mismatch') and nothing is deleted.
   */
  async function confirmAndDelete(method, idToken) {
    const uid = lsGet(DEL);
    const r = await reauthenticate(method, idToken);
    if (!r.ok) { oops(r.error); return r; }
    if (r.sent) { if (P) { P.view = 'sent'; P.email = r.email; P.sentFor = 'delete'; } return r; }
    if (!user || user.uid !== uid) { oops('user-mismatch'); return no('user-mismatch'); }
    await finishDelete();
    return r;
  }

  /** What an ID token from the Google button does: confirm the account in the reauth step, sign in otherwise. */
  async function onGoogleToken(idToken) {
    if (P) { P.busy = true; P.msg = ''; P.tone = ''; render(); }
    try {
      if (P?.view === 'reauth' && blocked()) return await confirmAndDelete('google', idToken);
      const r = await signInWithIdToken(idToken);
      if (!r.ok) oops(r.error);
      return r;
    } finally { if (P) { P.busy = false; render(); } }
  }

  function render() {
    if (!P) return;
    const st = computeStatus(), v = P.view, u = user;
    P.dot.setAttribute('data-s', st);
    P.stText.textContent = blocked() ? 'Sync paused until the account deletion is finished or cancelled.' : STATUS_TEXT[st];
    const lead = (t) => h('p.mc-lead', null, t);
    const who = (x) => h('div.mc-who', null, 'Signed in as ', h('strong', null, x.email || x.name || 'player'), h('span.mc-tag', null, x.provider === 'google' ? 'Google' : 'Email link'));
    let n;
    if (!cfg) {
      n = [lead('Cloud sync is not set up in this version of the game. Your progress is saved on this device.')];
    } else if (v === 'confirm-email') {
      n = [lead('To finish signing in, confirm the email address the link was sent to.'),
        emailForm('Email', 'Finish signing in', async (val) => {
          const r = await completeEmailLink(pendingLink, val);
          if (!r.ok) oops(r.error);
          else if (r.reauth && P) { P.view = 'confirm-delete'; P.msg = 'Confirmed. You can delete the account now.'; P.tone = 'ok'; }
        })];
    } else if (v === 'sent') {
      const del = P.sentFor === 'delete';
      n = [h('p.mc-lead', null, 'Check your inbox at ', h('strong', null, P.email), del
        ? '. Open the link on this device to confirm it is you, then finish deleting the account.' : '. Open the link on this device to finish signing in.'),
      del ? btn('mc-btn', 'Back', () => go('reauth')) : btn('mc-btn', 'Use a different email', () => go('main'))];
    } else if (v === 'confirm-delete' && u) {
      // blocked(): the data is already gone (an earlier attempt), only the account is left.
      const keep = () => { P.hold = false; if (blocked()) cancelDelete(); go('main'); schedule(false); };
      n = [who(u), lead(blocked() ? 'Your cloud stats were already deleted, but the account was not. Delete the account too? Progress saved on this device stays.'
        : 'This deletes your Monkey Cloud account and every stat stored in it, for all games. Progress saved on this device stays.'),
      h('div.mc-row', null, btn('mc-btn', blocked() ? 'Keep my account' : 'Cancel', keep), btn('mc-btn.mc-bad', 'Delete everything', () => act(finishDelete)))];
    } else if (v === 'reauth' && u && blocked()) {
      const email = u.provider === 'email';
      n = [who(u), lead(`Your cloud stats are deleted. To delete the account as well, ${email ? 'confirm your email address' : 'confirm with Google'} that it is you.`),
        email ? btn('mc-btn.mc-pri', 'Email me a confirmation link', () => act(() => confirmAndDelete('email')))
          : googleBlock('Confirm with Google', () => confirmAndDelete('google')),
        btn('mc-btn', 'Keep my account instead', () => { cancelDelete(); go('main'); })];
    } else if (u) {
      n = [who(u),
        h('div.mc-row', null,
          btn('mc-btn.mc-pri', 'Sync now', () => act(async () => {
            report(undefined, { now: true });
            if (game === 'hub') {
              const p = await profile();
              if (p.error) return oops(p.error);
            }
            if (P) go('main', 'Sync requested.');
          })),
          btn('mc-btn', 'Sign out', () => act(signOut))),
        btn('mc-link', 'Delete my cloud data\u2026', () => go('confirm-delete'))];
    } else {
      n = [lead(v === 'confirm-delete' ? 'Sign in with the account you want to delete. Nothing is uploaded while you do this.'
        : 'Sign in to back up your stats and see them in the Monkey Hub. Your game save stays on this device.'), ...signInBlock()];
    }
    P.msgEl.textContent = P.msg || '';
    P.msgEl.setAttribute('data-tone', P.tone || '');
    const ae = G.document.activeElement, lost = P.body.contains(ae);
    const sel = lost && (ae.id ? '#' + ae.id : ae.dataset?.k ? '[data-k="' + ae.dataset.k + '"]' : '');
    P.body.replaceChildren(...n);
    // Re-rendering replaces the nodes: put focus back on the same control, or on the panel itself
    // (no focus ring; Tab continues from there) when that control is gone or disabled.
    if (lost) {
      const next = (sel && P.body.querySelector(sel + ':not([disabled])')) || P.panel;
      try { next.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
    }
  }

  /**
   * FedCM cannot run in a cross-origin frame unless every parent iframe has allow="identity-credentials-get"
   * (e.g. a game inside the hub's play overlay). Then the GIS button would be a dead end: use the popup.
   */
  function fedcmBlocked() {
    try {
      const pp = G.document.permissionsPolicy || G.document.featurePolicy;
      return embedded() && typeof pp?.allowsFeature === 'function' && pp.features?.().includes('identity-credentials-get')
        && !pp.allowsFeature('identity-credentials-get');
    } catch (e) { return false; }
  }

  // Google Identity Services: the FedCM-capable button returns an ID token. TWA-safe: no redirect.
  function renderGis(slot) {
    if (!cfg?.googleClientId || cfg.emulator || fedcmBlocked()) return; // keep the popup fallback button
    gisP ||= new Promise((resolve, reject) => {
      if (G.google?.accounts?.id) return resolve(G.google.accounts.id);
      const s = h('script', { src: 'https://accounts.google.com/gsi/client', async: true });
      s.onload = () => (G.google?.accounts?.id ? resolve(G.google.accounts.id) : reject());
      s.onerror = reject;
      G.document.head.append(s);
      setTimeout(reject, 10000);
    }).then((id) => {
      id.initialize({
        // FedCM button UX on Chrome desktop M125+ / Android M128+; GIS falls back to its popup elsewhere.
        client_id: cfg.googleClientId, use_fedcm_for_button: true, auto_select: false, ux_mode: 'popup',
        callback: (resp) => onGoogleToken(resp?.credential),
      });
      return id;
    });
    gisP.then((id) => {
      if (!slot.isConnected) return;
      id.renderButton(slot, { type: 'standard', theme: 'outline', size: 'large', text: 'continue_with', shape: 'rectangular', logo_alignment: 'left', width: Math.max(200, Math.min(400, slot.clientWidth || 300)) });
      // The rendered button hides the fallback; if that held focus, keep focus inside the dialog.
      const keep = () => {
        const ae = G.document.activeElement;
        if (P && (!P.panel.contains(ae) || !ae.getClientRects().length)) { try { P.panel.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }
      };
      keep(); setTimeout(keep, 1000); // GIS may fill the slot a moment later
    }, () => { gisP = null; });
  }

  // ---------- export: every method is guarded ----------
  const fail = (e) => no(codeOf(e));
  function guard(fn, fallback) {
    const fb2 = (e) => (typeof fallback === 'function' ? fallback(e) : fallback);
    return (...args) => {
      try {
        const r = fn(...args);
        return r && typeof r.then === 'function' ? r.catch(fb2) : r;
      } catch (e) { return fb2(e); }
    };
  }

  const api = {
    version: VERSION,
    init: guard(init, () => api),
    report: guard(report),
    arcade: guard(arcade),
    milestone: guard(milestone),
    signIn: guard(signIn, fail),
    completeEmailLink: guard(completeEmailLink, fail),
    signOut: guard(signOut, fail),
    user: guard(() => user && { ...user }, null),
    status: guard(() => status, 'off'),
    on: guard(on, () => () => {}),
    profile: guard(profile, emptyProfile),
    deleteMyData: guard(deleteMyData, fail),
    /** After deleteMyData() returned 'requires-recent-login': confirm the same account, then call deleteMyData() again. */
    reauthenticate: guard((method) => reauthenticate(method), fail),
    /** Keep the account after a half-done deletion: uploads resume. */
    cancelDelete: guard(cancelDelete, fail),
    /** openPanel('delete') opens straight at the delete step (signing in first if needed): the Play "delete account" page. */
    openPanel: guard((view) => openPanel(view === 'delete' ? 'confirm-delete' : undefined), false),
    closePanel: guard(closePanel),
    /** Tests: replace the gstatic CDN loader, e.g. with the npm firebase package. */
    __setLoader: guard((fn) => { loader = typeof fn === 'function' ? fn : null; }),
    /** Emulator only: sign in with a fake Google ID token built from claims ({ sub, email }). */
    // Behaves like the panel's Google button: in the panel's reauth step it confirms the account instead.
    __emulatorSignIn: guard((claims) => (cfg?.emulator ? onGoogleToken(JSON.stringify({ email_verified: true, ...claims })) : no('emulator-only')), fail),
  };
  G.MonkeyCloud = api;
})(typeof window !== 'undefined' ? window : globalThis);
