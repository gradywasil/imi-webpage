// Opt-in calendar sessions; the legacy Bot policy stays the default.
(() => {
  const D = IMI.ops.dev, S = () => D.S();
  const schedules = {
    Casual: { cycle: 1440, starts: [0, 488], length: 8, taps: 1, pickups: false },
    Regular: { cycle: 1440, starts: [0, 480, 960], length: 20, taps: 3, pickups: true },
    Hardcore: { cycle: 1440, starts: [0, 240, 480, 720, 960, 1200], length: 30, taps: 3, pickups: true },
    Away: { cycle: 4320, starts: [0], length: 15, taps: 1, pickups: false }
  };
  let profile, calendar = 0, active = 0, marks = {}, away = [], resets = [], challenges = [], pickups = 0;
  const stamp = () => ({ calendarMinutes: calendar, activeMinutes: active });
  const mark = (id, test) => { if (test && !marks[id]) marks[id] = stamp(); };
  const trainingComplete = d => D.UPS.filter(u => u.k !== 'paw').every(u => d.up[u.k] === (u.tier ? 5 : u.max));
  function observe() {
    const s = S();
    mark('firstStar', D.starsNow() >= 1); mark('firstReset', s.printing > 0);
    D.CHALLENGES.forEach(c => mark('challenge-' + c.id, s.chDone[c.id]));
    mark('sixDesks', s.desks.every(d => d.owned));
    mark('authoredTitles', D.RECIPES.filter(r => !r.gen && !r.kid && !r.lib).every(r => s.written[r.id] || s.editions[r.id]));
    mark('legacyTree', D.LEG.every(u => D.legLvl(u.id) === u.max));
    s.desks.forEach((d, i) => { mark('desk-' + i, d.owned); for (let n = 1; n <= 2; n++) mark(`restoration-${i}-${n}`, d.mk >= n); mark('keeperMax-' + i, D.keeperLv(i) === D.KEEPER_UP_MAX); mark('trainingMax-' + i, trainingComplete(d)); });
    mark('lampMax', s.lamp === 3); mark('publisherMax', s.pub.tier === 3);
    mark('finiteContent', !!marks.sixDesks && !!marks.authoredTitles && !!marks.legacyTree && D.CHALLENGES.every(c => marks['challenge-' + c.id]) && s.desks.every((d, i) => d.mk === 2 && D.keeperLv(i) === D.KEEPER_UP_MAX && trainingComplete(d)) && s.lamp === 3 && s.pub.tier === 3);
  }
  function extras() {
    const s = S();
    // Dismiss only game-created celebration cards, just as a player continuing the session does.
    document.querySelector('.o-celebrate [data-close]')?.click();
    const order = ['crew', 'seed', 'speed', 'sales', 'golden'];
    for (const id of order) {
      const u = D.LEG.find(u => u.id === id), lv = D.legLvl(id);
      if (lv < u.max && s.legacy.stars >= u.costs[lv]) { D.action('legbuy', { id }); break; }
    }
    if (profile.pickups) { document.querySelector('.o-gold:not(.rotten)')?.click(); if (calendar * 60 % 50 === 0 && IMI.ops.pickup.eligible()) { IMI.ops.pickup.collect(IMI.ops.pickup.value()); pickups++; } }
    s.garden.beds.forEach((b, i) => { if (b) D.harvest(i); if (!s.garden.beds[i]) D.plant(i, 'E'); });
    // Finish Rapid touch beyond the legacy bot's level-2 target using its real purchase.
    s.desks.forEach((d, i) => { if (!d.owned || d.up.fing < 10 || d.up.rapid >= 8) return; const previous = s.sel; s.sel = i; D.buyUp('rapid'); s.sel = previous; });
    if (D.starsNow() < 1 || s.challenge) return;
    const next = ['haiku', 'vowel', 'hands', 'timed'].find(id => !s.chDone[id] && (!['hands', 'timed'].includes(id) || D.legLvl('crew') > 0));
    const remaining = D.LEG.reduce((sum, u) => sum + u.costs.slice(D.legLvl(u.id)).reduce((a, b) => a + b, 0), 0);
    if (s.printing === 0 || next || remaining > 0 && D.starsNow() >= remaining) {
      const gain = D.starsNow(); D.doPrint(next); resets.push({ ...stamp(), gain, challenge: next || null, printing: S().printing });
    }
  }
  window.LongGameBot = {
    schedules,
    start(name, seed, options = {}) {
      profile = schedules[name]; if (!profile) throw new Error('Unknown calendar profile');
      Bot.start({ profile: 'active', strategy: 'collect', seed, activeMinutes: Infinity, tapRate: profile.taps, realActions: true, usePublisher: true });
      // The legacy bank Proxy counts diagnostic deposits; calendar reports use the game's own stats.
      if (options.plainBank) S().bank = { ...S().bank };
      IMI.ops.extensions.register('long-game-measurement', { challenge: event => challenges.push({ ...stamp(), ...event }) });
      observe();
    },
    online(minutes) {
      for (let i = 0; i < Math.round(minutes * 60); i++) { Bot.run(1 / 60); calendar += 1 / 60; active += 1 / 60; observe(); extras(); observe(); }
    },
    away(minutes) {
      const before = stamp(), cap = D.awayCap(), efficiency = D.awayEff();
      __skip(minutes * 60000); const progress = IMI.ops.simulateAway(minutes * 60); calendar += minutes;
      away.push({ before, after: stamp(), capSeconds: cap, efficiency, progress }); observe();
    },
    report() { return { ...stamp(), schedule: profile, endpoints: marks, resets, challenges, pickups, away, state: S(), wallet: IMI.bananas.get(), finiteComplete: !!marks.finiteContent }; }
  };
})();
