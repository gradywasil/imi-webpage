/* ============================================================
   WORLD: the sky as a pure function of the clock.
   A day lasts DAY_MS (14 real minutes): 9 minutes of day, 1 of dusk, 3 of night, 1 of dawn. Weather is chosen per 150-second cell
   from a fixed hash, so any moment (now, the forecast, an hour ago while you were away) is reproducible and nothing is ever saved.
   Everything that reads the sky (the market, typists, the rain, the gauges) asks World.at(time).
   ============================================================ */
(() => {
  'use strict';
  const MIN = 60000, DAY_MS = 14 * MIN, CELL_MS = 150000, EPOCH = Date.UTC(2026, 0, 1);
  const WX_NAMES = ['clear', 'drizzle', 'rain', 'storm'];
  /* the day, in seconds from its start: day 0-540, dusk 540-600, night 600-780, dawn 780-840 (dusk and dawn count as day) */
  const PHASES = [[0, 'day'], [540, 'dusk'], [600, 'night'], [780, 'dawn']];

  /* a small integer hash to a number in [0, 1): the same input always gives the same sky */
  function hash(k) {
    let h = Math.imul((k | 0) ^ 0x9e3779b9, 0x85ebca6b);
    h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }
  const cellOf = t => Math.floor((t - EPOCH) / CELL_MS);
  const raw = k => { const u = hash(k); return u < .55 ? 0 : u < .70 ? 1 : u < .80 ? 2 : 3; };      // before the storm rule: clear 55%, drizzle 15%, rain 10%, storm 20%
  const wxOfCell = k => { const r = raw(k); return r === 3 && raw(k - 1) < 1 ? 2 : r; };           // a storm needs weather before it (a storm straight after a clear cell is only rain): about clear 55%, drizzle 15%, rain 21%, storm 9%

  function phaseAt(t) {
    const s = (((t - EPOCH) % DAY_MS) + DAY_MS) % DAY_MS / 1000;
    let name = 'day'; for (const [from, n] of PHASES) if (s >= from) name = n;
    return { name, s };
  }
  const World = { DAY_MS, CELL_MS, WX_NAMES };
  World.at = t => {
    const p = phaseAt(t);
    return { night: p.name === 'night', phase: p.name, phaseT: p.s / (DAY_MS / 1000), wx: wxOfCell(cellOf(t)) };
  };

  /* the next `n` changes after time t: a new weather, or the day phase turning over. kinds: 'wx', 'night' (night starting or ending) or 'phase' (any phase) */
  World.next = (t, n = 2, kind = 'any') => {
    const out = [];
    let prev = World.at(t);
    const tEnd = t + 3 * 3600 * 1000;
    for (let u = t; u < tEnd && out.length < n;) {
      // the next moment either can change: the next cell boundary, or the next phase boundary
      const cellEnd = EPOCH + (cellOf(u) + 1) * CELL_MS;
      const s = (((u - EPOCH) % DAY_MS) + DAY_MS) % DAY_MS / 1000;
      const nextPhaseS = (PHASES.map(p => p[0]).find(x => x > s) ?? DAY_MS / 1000);
      const phaseEnd = u + (nextPhaseS - s) * 1000;
      u = Math.min(cellEnd, phaseEnd) + 1;
      const cur = World.at(u);
      if (cur.wx !== prev.wx && (kind === 'any' || kind === 'wx')) out.push({ at: u, kind: 'wx', wx: cur.wx, from: prev.wx });
      if (cur.night !== prev.night && (kind === 'any' || kind === 'night')) out.push({ at: u, kind: 'night', night: cur.night });
      else if (cur.phase !== prev.phase && cur.night === prev.night && kind === 'any') out.push({ at: u, kind: 'phase', phase: cur.phase });
      prev = cur;
    }
    return out.slice(0, n);
  };
  World.untilNext = (t, kind) => { const nx = World.next(t, 1, kind)[0]; return nx ? nx.at - t : Infinity; };
  World.label = (e) => e.kind === 'wx' ? (e.wx === 0 ? 'clearing' : WX_NAMES[e.wx]) : e.kind === 'night' ? (e.night ? 'night falls' : 'sunrise') : e.phase;

  (typeof window !== 'undefined' ? window : globalThis).World = World;
  if (typeof module !== 'undefined' && module.exports) module.exports = World;
})();
