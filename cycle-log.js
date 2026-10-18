/* Per-cycle rebuild instrumentation for the long-game plan (phase A). A cycle runs from one reset to the next.
   It lives in memory only: nothing here is saved, quoted or paid, so it cannot change a reward or a save.
   Tuning reads it through IMI.ops.dev.cycles(). Resolution is one second of productive play. */
window.CycleLog = (() => {
  'use strict';
  const STAGES = ['typing', 'banking', 'publishing', 'funds'], KEEP = 20;
  const blank = (index, resumed) => ({ index, resumed, seconds: 0, firstSale: null, toPriorPeak: null, toNextMilestone: null,
    peakEarned: 0, milestone: 0, manual: { keys: 0, sales: 0, buys: 0 }, blocked: { typing: 0, banking: 0, publishing: 0, funds: 0 } });
  function create() {
    let cycle = null, done = [], index = 0, priorPeak = 0, bestMilestone = 0, carry = 0;
    const open = () => cycle || (cycle = blank(index, index === 0));
    return {
      /* dt productive seconds; probe() returns {earned, milestone, blocked} and runs at most once per second */
      tick(dt, probe) {
        if (!(dt > 0) || !Number.isFinite(dt)) return;
        const c = open(); c.seconds += dt; carry += dt;
        if (carry < 1) return;
        const p = probe(), span = carry; carry = 0;
        if (!p) return;
        if (Number.isFinite(p.earned)) {
          c.peakEarned = Math.max(c.peakEarned, p.earned);
          if (c.toPriorPeak === null && priorPeak > 0 && p.earned >= priorPeak) c.toPriorPeak = c.seconds;
        }
        if (Number.isFinite(p.milestone)) {
          c.milestone = Math.max(c.milestone, p.milestone);
          if (c.toNextMilestone === null && bestMilestone > 0 && p.milestone > bestMilestone) c.toNextMilestone = c.seconds;
        }
        if (STAGES.includes(p.blocked)) c.blocked[p.blocked] += span;
      },
      sale(manual) { const c = open(); if (c.firstSale === null) c.firstSale = c.seconds; if (manual) c.manual.sales++; },
      key() { open().manual.keys++; },
      buy() { open().manual.buys++; },
      /* a reset closes the cycle; the next tick opens a fresh one measured against this one */
      end(kind = 'printing') {
        if (!cycle) return null;
        const closed = { ...cycle, kind };
        done.push(closed); if (done.length > KEEP) done.shift();
        priorPeak = closed.peakEarned; bestMilestone = Math.max(bestMilestone, closed.milestone);
        cycle = null; carry = 0; index++;
        return closed;
      },
      snapshot: () => JSON.parse(JSON.stringify({ stages: STAGES, open: cycle, cycles: done, priorPeak, bestMilestone })),
      clear() { cycle = null; done = []; index = 0; priorPeak = 0; bestMilestone = 0; carry = 0; }
    };
  }
  return Object.freeze({ create, STAGES });
})();
