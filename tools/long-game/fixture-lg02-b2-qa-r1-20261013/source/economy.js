/* Shared banana units, compact values, and one-time conversion of older local saves. */
window.Economy = (() => {
  'use strict';
  const version = 1, scale = 25;
  const cash = n => n * scale;
  const round = n => Math.round(n / scale) * scale;
  const floor = n => Math.floor(n / scale) * scale;
  const nf = new Intl.NumberFormat('en-US', { maximumFractionDigits: 6 });
  const units = [[1e15, 'Qa'], [1e12, 'T'], [1e9, 'B'], [1e6, 'M'], [1e3, 'K']];
  function format(value, fractional = false) {
    let n = fractional ? value : Math.round(value);
    if (!Number.isFinite(n)) return '0';
    const sign = n < 0 ? '-' : ''; n = Math.abs(n);
    const rounded = Number(n.toPrecision(3));
    if (rounded >= 1e18 || (fractional && n > 0 && n < .001)) return sign + rounded.toExponential(2).replace(/\.?0+e/, 'e').replace('e+', 'e');
    for (const [unit, suffix] of units) if (rounded >= unit) return sign + Number((rounded / unit).toPrecision(3)) + suffix;
    return sign + nf.format(fractional ? rounded : n);
  }
  const fmt = n => format(n);
  const rate = n => format(n, true);
  const exact = n => nf.format(n);
  const read = key => { try { return JSON.parse(localStorage.getItem(key)); } catch (error) { if (window.Rewards?.enabled) throw error; return null; } };
  const write = (key, value) => { if (window.VaultSaveGate?.blocked) return { ok:false, error:'Vault save blocked' }; try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Keep playing when storage is unavailable. */ } };
  function backup() {
    try {
      if (localStorage.getItem('imi-economy-v1-backup') === null) write('imi-economy-v1-backup', {
        score: localStorage.getItem('imi-score'), state: localStorage.getItem('imi-ops-v1')
      });
    } catch { /* Storage may be unavailable. */ }
  }
  const enabled = () => !!window.Rewards?.enabled;
  const writer = () => !window.VaultSaveGate?.blocked && (!enabled() || window.Rewards.owns());
  function preflight() {
    const walletRaw = localStorage.getItem('imi-score'), stateRaw = localStorage.getItem('imi-ops-v1');
    const wallet = walletRaw === null ? null : JSON.parse(walletRaw);
    const state = stateRaw === null ? null : JSON.parse(stateRaw);
    const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
    if (walletRaw !== null) {
      const legacy = typeof wallet === 'number';
      const score = legacy ? cash(wallet) : wallet?.score;
      if ((!legacy && (!object(wallet) || !Number.isInteger(wallet.economyVersion) || wallet.economyVersion < version)) ||
          !Number.isFinite(score) || score < 0) throw new Error('Unsupported saved wallet');
    }
    if (stateRaw !== null && !object(state)) throw new Error('Unsupported saved state');
    return { wallet, state };
  }
  let walletMetadata = {};
  function acknowledged(key, value) {
    if (!writer()) return { ok: false, error: 'Not the save owner' };
    try { localStorage.setItem(key, JSON.stringify(value)); return { ok: true }; }
    catch (error) { return { ok: false, error: error.message }; }
  }
  function saveScoreAcknowledged(score, marker = walletMetadata.rewardMarker) {
    if (!Number.isFinite(score) || score < 0) return { ok: false, error: 'Invalid wallet score' };
    const candidate = { ...walletMetadata, economyVersion: walletMetadata.economyVersion || version, score };
    if (marker === null) delete candidate.rewardMarker;
    else if (marker !== undefined) candidate.rewardMarker = marker;
    const result = acknowledged('imi-score', candidate);
    if (result.ok) walletMetadata = candidate;
    return result;
  }
  // Shared actual credit semantics for Core and the explicitly simulated balance bridge.
  function creditReward(score, { id, sequence, previous, amount } = {}) {
    if (!writer()) return { ok:false, error:'Not the save owner' };
    if (typeof id !== 'string' || !id || !Number.isSafeInteger(sequence) || sequence < 1 || !Number.isSafeInteger(previous) || previous < 0 || sequence !== previous + 1 || !Number.isSafeInteger(amount) || amount <= 0 || amount % scale !== 0) return { ok:false, error:'Invalid reward credit' };
    const marker = walletMetadata.rewardMarker == null ? null : JSON.parse(JSON.stringify(walletMetadata.rewardMarker));
    if (marker != null && (typeof marker !== 'object' || Array.isArray(marker) || !Number.isSafeInteger(marker.sequence) || marker.sequence < 1 || typeof marker.id !== 'string' || !Number.isSafeInteger(marker.amount) || marker.amount <= 0)) return { ok:false, error:'Invalid saved reward marker' };
    if (marker?.sequence === sequence) return marker.id === id && marker.amount === amount ? { ok:true, duplicate:true, marker, score } : { ok:false, error:'Reward marker mismatch' };
    if ((marker?.sequence || 0) !== previous) return { ok:false, error:'Reward sequence mismatch' };
    const next = score + amount, acknowledgement = { ...marker, sequence, id, amount };
    if (next - score !== amount) return { ok:false, error:'Wallet cannot represent this credit exactly' };
    const result = saveScoreAcknowledged(next, acknowledgement);
    return result.ok ? { ok:true, duplicate:false, marker:acknowledgement, score:next } : result;
  }
  const saveScore = score => enabled() ? saveScoreAcknowledged(score) : write('imi-score', { economyVersion: version, score });
  function loadScore() {
    if (!writer()) throw new Error('Wallet load requires save ownership');
    const saved = enabled() ? preflight().wallet : read('imi-score');
    if (enabled()) walletMetadata = saved && typeof saved === 'object' && !Array.isArray(saved) ? { ...saved } : {};
    const current = saved && typeof saved === 'object' && saved.economyVersion >= version;
    const score = current ? saved.score : cash(typeof saved === 'number' ? saved : 0);
    const valid = Number.isFinite(score) && score >= 0 ? score : 0;
    if (enabled() && current && valid !== score) throw new Error('Invalid saved wallet score');
    if (!current) { if (saved !== null) backup(); const result = saveScore(valid); if (enabled() && !result.ok) throw new Error(result.error); }
    return valid;
  }
  function loadState() {
    if (!writer()) throw new Error('State load requires save ownership');
    const state = enabled() ? preflight().state : read('imi-ops-v1');
    if (!state || typeof state !== 'object' || Array.isArray(state)) return null;
    if (state.economyVersion >= version) return state;
    backup();
    const convert = (object, key) => { if (object && Number.isFinite(object[key])) object[key] = cash(object[key]); };
    convert(state.run, 'earned'); convert(state.stats, 'lump');
    convert(state, 'royTotal'); convert(state, 'divTotal');
    for (const list of [state.pitches, state.offers]) if (Array.isArray(list)) for (const pitch of list) convert(pitch, 'pay');
    state.economyVersion = version;
    if (enabled()) { const result = acknowledged('imi-ops-v1', state); if (!result.ok) throw new Error(result.error); }
    else write('imi-ops-v1', state);
    return state;
  }
  return Object.freeze({ version, scale, cash, round, floor, fmt, rate, exact, loadScore, saveScore, loadState,
    creditReward, saveScoreAcknowledged, saveStateAcknowledged: state => acknowledged('imi-ops-v1', state),
    walletAcknowledgement: () => walletMetadata.rewardMarker === undefined ? null : JSON.parse(JSON.stringify(walletMetadata.rewardMarker)) });
})();
