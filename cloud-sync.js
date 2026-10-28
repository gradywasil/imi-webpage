/* Monkey Cloud wiring (the SDK is vendor/monkey-cloud/, copied from monkey-cloud/sdk by its sync-sdk script; never edit the copy).
   Reports a few lifetime numbers to the Monkey Hub and, once a real Firebase config ships, to the player's cloud profile.
   With the shipped "off" config nothing new is visible and nothing is sent anywhere; inside the hub the numbers still
   reach the parent page by postMessage. Loads after the SDK and before ops.js, so the 'cloud' extension is registered
   with the others. Only the tab that holds the save lock (Rewards) reports: another tab's copy of the save can be stale. */
(() => {
  'use strict';
  if (!window.MonkeyCloud) return;
  const BUILD = 'imi-v103';                      // keep in step with VERSION in sw.js
  const EVERY = 5 * 60 * 1000;                   // the tick reports at most this often; a printing or a reset reports at once
  const whole = v => Math.max(0, Math.floor(Number(v) || 0));
  let api = null, next = 0;
  function stats() {                             // all five only ever grow: a printing keeps stats, legacy and prem
    try {
      if (!api || (window.Rewards?.enabled && !Rewards.owns())) return {};
      const s = api.state(), st = s.stats || {};
      return { words: whole(st.words), letters: whole(st.letters), legacyStars: whole(s.legacy?.total), diamonds: whole(s.prem?.earnedTotal), playMins: whole(st.playSecs / 60) };
    } catch { return {}; }
  }
  MonkeyCloud.init({ game: 'imi', build: BUILD, stats, monotonic: ['words', 'letters', 'legacyStars', 'diamonds', 'playMins'], ui: { accent: '#3fd9a4' } });
  // Escape closes the cloud panel and nothing else: the tour, the rail and the "back to the title screen" key would act behind it.
  // Without a config the status stays 'off' and the panel is never offered, so the game keeps its keys untouched.
  if (MonkeyCloud.status() !== 'off') addEventListener('keydown', e => { if (e.key === 'Escape' && document.querySelector('.mc-root')) { e.preventDefault(); e.stopImmediatePropagation(); MonkeyCloud.closePanel(); } }, true);
  (window.__OPS_EXTENSIONS ||= []).push(['cloud', {
    init(_, current) { api = current; },
    // The first tick after the save loads, then every 5 minutes. A hidden page does not tick; the SDK reports when it is hidden.
    tick() { const t = performance.now(); if (t < next) return; next = t + EVERY; MonkeyCloud.report(); },
    reset() { MonkeyCloud.report(); }            // a printing or a full reset
  }]);
})();
