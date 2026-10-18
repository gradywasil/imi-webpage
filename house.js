/* Long-game phase E: Imprint specializations. The three builds are free to choose and swap at a safe boundary (a room that has sold nothing yet),
   and each trades something away. Four Imprint upgrades are bought with Press Seals inside layers.js; this file holds their rules.
   Account-level and kept by every reset in meta.house. Numbers are tuning experiments. */
window.House = (() => {
  'use strict';
  const VERSION = 1;
  const BUILDS = {
    rapid: { name: 'Rapid Editions', gain: 'The first 6 titles sold in each room pay 1.25x.', cost: 'Machines five and six (10 to 13 letter titles) pay 0.9x.', focus: 'Short, profitable cycles' },
    collector: { name: 'Collector Press', gain: 'Reissued titles pay 1.15x. Manuscript trips bring 1 extra Part. Restoration deposits need a quarter fewer words.', cost: 'First editions pay 0.92x.', focus: 'Varied manuscripts and restoration', needs: 'almanac' },
    prestige: { name: 'Prestige Editions', gain: 'Titles from machines four to six pay 1.15x. Special editions pay 1.5x on repeat clears.', cost: 'Machines one and two pay 0.85x.', focus: 'Long, high-value editions', needs: 'atlas' }
  };
  const LAUNCH = 6, TOURING = 1.25;
  const object = v => v !== null && typeof v === 'object' && !Array.isArray(v);
  const fresh = () => ({ v: VERSION, build: null, band: null });
  const valid = h => h === undefined || object(h) && h.v === VERSION && (h.build === null || !!BUILDS[h.build]) && (h.band === null || Number.isInteger(h.band) && h.band >= 0 && h.band <= 5);

  /* the build you may pick: collector and prestige are earned by restoring a collection */
  const available = (restored, id) => !BUILDS[id].needs || !!(restored && restored[BUILDS[id].needs]);
  /* choose only in a room that has sold nothing: no sale is ever re-priced and the swap costs nothing */
  function choose(h, id, ctx) {
    if (id !== null && !BUILDS[id]) return { ok: false, why: 'Unknown build' };
    if (!ctx.imprints) return { ok: false, why: 'Found an Imprint first' };
    if (ctx.sold > 0) return { ok: false, why: 'Change it before this room sells a title' };
    if (id !== null && !available(ctx.restored, id)) return { ok: false, why: `Restore the ${BUILDS[id].needs} first` };
    return { ok: true, h: { ...h, build: id } };
  }
  function setBand(h, band, ctx) {
    if (band !== null && !(Number.isInteger(band) && band >= 0 && band <= 5)) return { ok: false, why: 'No such machine' };
    if (ctx.sold > 0) return { ok: false, why: 'Change it before this room sells a title' };
    return { ok: true, h: { ...h, band } };
  }
  /* sale factor for one title. ctx: band, editions (earlier editions of this title), soldInRoom */
  function saleFactor(h, band, editions, soldInRoom) {
    const b = h && h.build;
    if (b === 'rapid') return (soldInRoom < LAUNCH ? 1.25 : 1) * (band >= 4 ? .9 : 1);
    if (b === 'collector') return editions > 0 ? 1.15 : .92;
    if (b === 'prestige') return band >= 3 ? 1.15 : band <= 1 ? .85 : 1;
    return 1;
  }
  const touringBand = (h, owned) => owned && h && Number.isInteger(h.band) ? h.band : null;
  const touring = (h, owned, group) => touringBand(h, owned) === group ? TOURING : 1;
  /* the Collector's interactions with the Workshop */
  const extraParts = (h, route) => h && h.build === 'collector' && route === 'manuscript' ? 1 : 0;
  const depositNeed = (h, n) => h && h.build === 'collector' ? Math.ceil(n * .75) : n;
  const specialRepeat = (h, parts) => h && h.build === 'prestige' ? Math.ceil(parts * 1.5) : parts;

  /* Editorial Exchange: surplus words become the goal's missing words, three for one inside a band, a couple of times a spell.
     bank: {word: count}; need: {word: count} the goal wants; lengthBand: word -> band. Returns the swap to make, or null. */
  function exchange(bank, need, lengthBand) {
    for (const w of Object.keys(need)) {
      if ((bank[w] || 0) >= need[w]) continue;
      const band = lengthBand(w), give = Object.keys(bank).filter(v => v !== w && bank[v] > 0 && !(v in need) && lengthBand(v) === band);
      let have = 0; const take = {};
      for (const v of give) { const n = Math.min(bank[v], 3 - have); take[v] = n; have += n; if (have === 3) return { get: w, take }; }
    }
    return null;
  }
  return Object.freeze({ VERSION, BUILDS, LAUNCH, TOURING, fresh, valid, available, choose, setBand, saleFactor, touringBand, touring, extraParts, depositNeed, specialRepeat, exchange });
})();
