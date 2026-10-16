/* PG-02: protected spending only. Letter inventories remain on their original desks. */
window.TrainingPool = (() => {
  'use strict';
  const enabled = (window.GameFeatures?.enabled('pg02') ?? new URLSearchParams(location.search).get('pg02') === '1');
  const factors = [1, 4, 8, 16, 32, 64];
  const object = v => v !== null && typeof v === 'object' && !Array.isArray(v);
  const valid = p => object(p) && p.version === 1 && typeof p.enabled === 'boolean';
  let api, pending = null, error = '';
  const raw = () => api?.state().meta.trainingPool;
  const mode = () => pending || raw() !== undefined && !valid(raw()) ? 'suspended' : raw()?.enabled ? 'pooled' : 'local';
  function plan(desks, required, automation, cost) {
    const refuse = error => ({ ok:false, error });
    if (!Number.isSafeInteger(cost) || cost < 0) return refuse('Unsupported training cost');
    if (automation !== undefined && (!object(automation) || automation.version !== 1 || automation.desks !== undefined && !object(automation.desks))) return refuse('Unsupported donor settings');
    const donors = [], piles = [];
    for (const [i, d] of desks.entries()) {
      if (!d.owned) continue;
      const cfg = automation?.desks?.[d.id], reserve = cfg?.reservePercent === undefined ? 25 : cfg.reservePercent;
      if (cfg !== undefined && (!object(cfg) || cfg.enabled !== undefined && typeof cfg.enabled !== 'boolean' || cfg.version !== undefined && cfg.version !== 1) || !Number.isInteger(reserve) || reserve < 0 || reserve > 100 || reserve % 5) return refuse('Unsupported donor settings');
      const donor = { i, held:0, ingredients:0, floor:0, left:0 };
      for (const ch of Object.keys(d.letters).sort()) {
        const held = d.letters[ch], need = required[i]?.[ch] || 0;
        if (!Number.isSafeInteger(held) || held < 0 || !Number.isSafeInteger(need) || need < 0) return refuse('Unsupported letter inventory');
        const floor = Math.min(held, need);
        donor.held += held; donor.ingredients += floor;
        if (held > floor) piles.push({ i, ch, left:held - floor, taken:0, donor });
      }
      donor.floor = Math.max(donor.ingredients, Math.ceil(donor.held * reserve / 100));
      donor.left = donor.held - donor.floor; donors.push(donor);
    }
    const held = donors.reduce((n, d) => n + d.held, 0), protectedTotal = donors.reduce((n, d) => n + d.floor, 0), spendable = held - protectedTotal;
    const summary = { held, protected:protectedTotal, spendable, donors:donors.map(d => ({ i:d.i, held:d.held, ingredients:d.ingredients, floor:d.floor })) };
    if (cost > spendable) return { ...summary, ...refuse('Waiting for protected surplus') };
    let left = cost, chunks = 0;
    while (left > 0) {
      // When a donor budget binds, its alphabetically first tied pile wins until that budget changes.
      const candidates = piles.filter(p => p.left > 0 && p.donor.left > 0).filter(p => p.left < p.donor.left || !piles.some(q => q.i === p.i && q.ch < p.ch && q.left >= p.donor.left));
      candidates.sort((a, b) => Math.min(b.left, b.donor.left) - Math.min(a.left, a.donor.left) || a.i - b.i || a.ch.localeCompare(b.ch));
      const top = Math.min(candidates[0].left, candidates[0].donor.left), group = candidates.filter(p => Math.min(p.left, p.donor.left) === top);
      const next = candidates.find(p => Math.min(p.left, p.donor.left) < top);
      let rounds = Math.min(Math.floor(left / group.length), top - (next ? Math.min(next.left, next.donor.left) : 0));
      for (const d of donors) {
        const count = group.filter(p => p.donor === d).length;
        if (count > 1) rounds = Math.min(rounds, Math.floor((d.left - top) / (count - 1)));
      }
      const batch = rounds > 0 ? group : [candidates[0]], amount = rounds > 0 ? rounds : 1;
      for (const p of batch) { p.left -= amount; p.taken += amount; p.donor.left -= amount; left -= amount; }
      chunks++;
    }
    return { ...summary, ok:true, chunks, deductions:piles.filter(p => p.taken).map(p => ({ i:p.i, ch:p.ch, n:p.taken })) };
  }
  function configure(nextEnabled) {
    if (pending || raw() !== undefined && !valid(raw())) return { ok:false, error:'Unsupported or pending training choice' };
    const expected = raw() === undefined ? null : JSON.stringify(raw());
    pending = { expected, next:{ version:1, ...raw(), enabled:nextEnabled } };
    return retry();
  }
  function retry() {
    if (!pending) return { ok:false, error:'No pending training choice' };
    const result = api.commitTrainingPool(pending.expected, pending.next);
    error = result.ok ? '' : result.error || 'Save refused';
    if (result.ok) pending = null;
    api.mark(); return result;
  }
  function controls(esc, fmt) {
    const state = mode(), q = state === 'pooled' ? api.trainingPoolFacts(0) : null;
    return `<div class="o-card" aria-label="Shared training"><button type="button" class="o-btn" data-act="training-pool:toggle" aria-pressed="${state === 'pooled'}" ${state === 'suspended' ? 'disabled' : ''}>Shared training: ${state === 'suspended' ? 'Paused' : state === 'pooled' ? 'On' : 'Off'}</button><p role="status">${state === 'suspended' ? 'Shared training suspended. Saved data is preserved.' : q ? q.ok ? `Held ${fmt(q.held)} / Protected ${fmt(q.protected)} / Spendable ${fmt(q.spendable)}` : esc(q.error) : 'Off: training spends local desk letters at local prices.'}</p><details class="o-updetail"><summary>Donation rules</summary><p>All owned desks donate surplus, including Auto-hire Off desks. Held title ingredients and each desk's reserve stay protected. Reserves recalculate each purchase.</p></details>${error ? `<p role="alert">Choice not saved: ${esc(error)}. Training paused until Retry.</p>` : ''}${pending ? '<button type="button" class="o-btn" data-act="training-pool:retry">Retry</button>' : ''}</div>`;
  }
  if (enabled) (window.__OPS_EXTENSIONS ||= []).push(['training-pool', {
    init(_, current) { api = current; pending = null; error = ''; },
    actions:{ toggle:() => configure(mode() !== 'pooled'), retry }
  }]);
  return { enabled, factors, valid, mode, plan, configure, retry, controls };
})();
