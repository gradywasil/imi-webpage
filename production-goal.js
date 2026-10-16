/* PG-01: exact production sets. No state is created until an explicit acknowledged choice. */
window.ProductionGoal = (() => {
  'use strict';
  const enabled = (window.GameFeatures?.enabled('pg01') ?? new URLSearchParams(location.search).get('pg01') === '1');
  const bands = [3, 5, 7, 9, 11, 13];
  const collections = { all: 'All collections', authored: 'Authored readers', kids: "Kids' reading list", library5: 'Library cap 5', library7: 'Library cap 7', library9: 'Library cap 9', pitches: 'Commissioned pitches' };
  let pending = null, error = '';
  const raw = c => c.state().meta.productionGoal;
  const valid = p => p?.version === 1 && typeof p.enabled === 'boolean' && Number.isInteger(p.band) && bands[p.band] !== undefined && Object.hasOwn(collections, p.collection) && typeof p.advance === 'boolean' && (p.manual === null || typeof p.manual === 'string');
  const active = c => enabled && valid(raw(c)) && raw(c).enabled;
  const member = (r, p) => r.band === p.band && (p.collection === 'all' || p.collection === 'kids' && r.kid || p.collection === 'authored' && !r.kid && !r.lib && !r.gen || p.collection === 'pitches' && r.gen || p.collection === 'library' + r.lib);
  const members = (c, p) => c.recipes.filter(r => member(r, p) && c.available(r));
  const eligible = (c, r) => c.available(r) && c.inPlay(r) && Object.keys(r.need).every(w => c.accessible(c.bandOf(w.length)));
  function publish(c, next) {
    const expected = raw(c) === undefined ? null : JSON.stringify(raw(c));
    const result = c.commit(expected, next);
    if (!result.ok) { pending = { expected, next }; error = result.error || 'Save refused'; }
    else { pending = null; error = ''; }
    return result;
  }
  function configure(c, patch) {
    if (!enabled || raw(c) !== undefined && !valid(raw(c))) return { ok: false, error: 'Unsupported production goal' };
    const next = { version: 1, enabled: false, band: 0, collection: 'all', advance: false, manual: null, ...raw(c), ...patch };
    if (!valid(next) || next.manual && (!c.byId[next.manual] || !eligible(c, c.byId[next.manual]) || c.state().written[next.manual])) return { ok: false, error: 'Unavailable production goal' };
    const result = publish(c, next);
    if (result.ok) c.refresh();
    c.mark();
    return result;
  }
  function retry(c) {
    if (!pending) return { ok: false, error: 'No pending choice' };
    if ((raw(c) === undefined ? null : JSON.stringify(raw(c))) !== pending.expected) { pending = null; error = 'Goal changed. Choose again.'; c.mark(); return { ok: false, error }; }
    return configure(c, pending.next);
  }
  function resolve(c) {
    if (!active(c)) return null;
    let p = raw(c), s = c.state();
    if (p.manual && c.byId[p.manual] && eligible(c,c.byId[p.manual]) && !s.written[p.manual]) return c.byId[p.manual];
    let set = members(c, p), unsold = set.filter(r => !s.written[r.id]);
    if (set.length && !unsold.length && p.advance && !pending) {
      for (let band = p.band + 1; band < bands.length; band++) {
        const next = { ...p, band, manual: null }, full = members(c, next);
        if (!full.length) continue;
        if (!publish(c, next).ok) return null;
        p = raw(c); set = full; unsold = full.filter(r => !s.written[r.id]);
        if (unsold.length) break;
      }
    }
    const current = c.byId[s.focus];
    if (current && unsold.includes(current) && eligible(c, current)) return current;
    let best = null, effort = Infinity;
    for (const r of unsold) {
      if (!eligible(c, r)) continue;
      const rank = c.effort(r) / r.pay;
      if (rank < effort || rank === effort && best && r.pay < best.pay) { best = r; effort = rank; }
    }
    return best;
  }
  const allowsSale = (c, r) => c.available(r) && (!active(c) || r.id !== raw(c).manual && member(r, raw(c)));
  const wants = (c, w) => !active(c) || !!c.byId[c.state().focus]?.need[w] && c.stock(w) < c.byId[c.state().focus].need[w];
  function clearManual(s, id) {
    const p = s.meta.productionGoal;
    if (enabled && valid(p) && p.enabled && p.manual && (id === undefined || p.manual === id)) { s.meta.productionGoal = { ...p, manual: null }; s.autoFocus = true; s.focus = null; }
  }
  function status(c) {
    const p = raw(c), s = c.state();
    if (p !== undefined && !valid(p)) return 'Unsupported saved goal. Auto preserved.';
    if (!active(c)) return 'Auto: best return for effort';
    const excluded = c.recipes.filter(r => member(r,p) && !c.available(r)).length;
    const set = members(c, p), left = set.filter(r => !s.written[r.id]), r = c.byId[s.focus];
    let reason = !set.length ? excluded ? 'All titles archived' : 'No titles in this set' : !left.length ? 'Set complete' : 'Waiting for letters';
    if (p.manual && r) reason = 'Manual title: sell by hand or Return to set';
    else if (r && c.ready(r)) reason = 'Ready, waiting for Publisher / price';
    else if (!r && left.length) reason = left.some(r => c.inPlay(r)) ? s.challenge?.id === 'haiku' && left.some(r => Object.keys(r.need).some(w => c.bandOf(w.length) > 1)) ? 'Waiting: Haiku blocks this desk' : 'Waiting for desk' : "Waiting for kids' reading list";
    return `${bands[p.band]}-letter set · ${collections[p.collection]} · ${set.length - left.length}/${set.length} sold, ${excluded} archived excluded · ${reason}`;
  }
  function controls(c, esc) {
    if (!enabled) return '';
    const p = raw(c), supported = p === undefined || valid(p), on = active(c);
    return `<div class="o-card pg01-controls" aria-label="Production set"><h3>Production set</h3><div class="pg01-actions"><button type="button" class="o-btn" data-act="pgauto" aria-pressed="${!on}" ${supported ? '' : 'disabled'}>Auto</button>${bands.map((n, band) => `<button type="button" class="o-btn" data-act="pgband" data-band="${band}" aria-pressed="${on && p.band === band}" ${supported ? '' : 'disabled'}>${n}-letter set</button>`).join('')}</div><div class="pg01-actions"><label>Collection <select data-in="pgcollection" aria-label="Production collection" ${supported ? '' : 'disabled'}>${Object.entries(collections).map(([id, name]) => `<option value="${id}" ${p?.collection === id ? 'selected' : ''}>${esc(name)}</option>`).join('')}</select></label><button type="button" class="o-btn" data-act="pgadvance" aria-pressed="${!!p?.advance}" ${supported ? '' : 'disabled'}>Advance when complete: ${p?.advance ? 'On' : 'Off'}</button>${on && p.manual ? '<button type="button" class="o-btn" data-act="pgreturn">Return to set</button>' : ''}</div><p class="o-dim">Exact longest-word band. A 5-letter set still needs shorter ingredient words on their original desks. Advance moves upward only.</p><p class="pg01-status" role="status">${esc(status(c))}</p>${c.byId[c.state().focus] ? `<p>Now writing: <b>${esc(c.byId[c.state().focus].title)}</b></p><p class="o-dim">${c.missing().map(x => `${esc(x.name)}: ${x.words} words`).join(' · ') || 'All ingredients banked'}</p>` : ''}${error ? `<div role="alert">Choice not saved: ${esc(error)}. Previous goal retained.${pending ? ' <button type="button" class="o-btn" data-act="pgretry">Retry</button>' : ''}</div>` : ''}</div>`;
  }
  return { enabled, valid, active, configure, retry, resolve, allowsSale, wants, clearManual, status, controls };
})();
