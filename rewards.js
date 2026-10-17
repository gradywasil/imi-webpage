/* Approved LG-01 engine. Partial release: opt in only with ?lg01a=1. */
window.Rewards = (() => {
  'use strict';
  const enabled = (window.GameFeatures?.enabled('lg01a') ?? new URLSearchParams(location.search).get('lg01a') === '1');
  if (window.VaultSaveGate?.blocked || !enabled) return Object.freeze({ enabled: false });
  let owner = false, departed = false, requesting = false, release, booted = false, failed = false;
  const startup = [], finalizers = [], pending = new Map();
  const owns = () => owner && !departed;
  let panel, statusText, statusContent, statusPresentation, transactionRetry;
  function presentStatus() {
    const attached = owns() && transactionRetry && panel && !panel.hidden;
    if (attached && statusPresentation && !statusContent) {
      statusContent = document.createElement('div'); statusContent.className = 'o-writer-content';
      statusContent.tabIndex = 0; statusContent.setAttribute('role', 'region'); statusContent.setAttribute('aria-label', 'Save status and active effects');
      panel.insertBefore(statusContent, statusText); statusContent.appendChild(statusText);
      panel.classList.add('o-writer-held');
    }
    statusPresentation?.(attached ? statusContent : null);
  }
  function dismissStatus() {
    if (panel) panel.hidden = true;
    presentStatus();
  }
  function status(message) {
    if (!panel) {
      panel = document.createElement('section'); panel.className = 'o-writer-status';
      panel.setAttribute('role', 'status'); panel.setAttribute('aria-live', 'polite');
      const text = document.createElement('p'), retry = document.createElement('button');
      statusText = text;
      retry.type = 'button'; retry.textContent = 'Retry';
      retry.addEventListener('click', () => { if (transactionRetry) transactionRetry(); else if (failed || booted) location.reload(); else void acquire(); });
      panel.append(text, retry); document.body.appendChild(panel);
    }
    statusText.textContent = message; panel.hidden = false;
    presentStatus();
    panel.lastChild.focus();
  }
  // Only enabled game callbacks use these schedulers. A departed document cannot run them.
  function schedule(kind, callback, delay, args) {
    const repeat = kind === 'interval';
    const handle = { kind, id: 0 };
    handle.id = (kind === 'frame' ? window.requestAnimationFrame : repeat ? window.setInterval : window.setTimeout).call(window, value => {
      if (!repeat) pending.delete(handle);
      if (owns()) callback(...(kind === 'frame' ? [value] : args));
    }, delay);
    pending.set(handle, kind); return handle;
  }
  function cancel(handle) {
    const kind = pending.get(handle); pending.delete(handle);
    if (kind === 'frame') window.cancelAnimationFrame(handle.id); else { window.clearTimeout(handle?.id); window.clearInterval(handle?.id); }
  }
  const timers = {
    setTimeout: (fn, ms, ...args) => schedule('timeout', fn, ms, args),
    setInterval: (fn, ms, ...args) => schedule('interval', fn, ms, args),
    requestAnimationFrame: fn => schedule('frame', fn),
    clearTimeout: cancel, clearInterval: cancel, cancelAnimationFrame: cancel
  };
  function invoke(callback) {
    if (!owns() || failed) return;
    try { callback(); }
    catch (error) {
      failed = true; owner = false; startup.length = 0;
      for (const id of pending.keys()) cancel(id);
      release?.();
      status('Startup could not save safely. Retry reloads the last saved game.');
      console.error('LG-01A startup:', error);
    }
  }
  async function acquire() {
    if (requesting || owns() || departed || failed) return;
    if (!navigator.locks?.request) return status('This browser cannot safely open this test save. Web Locks are unavailable.');
    requesting = true;
    try {
      await navigator.locks.request('imi-save-writer', { mode: 'exclusive', ifAvailable: true }, async lock => {
        requesting = false;
        if (departed) return;
        if (!lock) return status('This save is open in another tab. Close that game, then retry here.');
        const staged=JSON.parse(localStorage.getItem('imi-ops-v1'));
        if (staged?.prem?.vault?.freeSpeed && staged.meta?.archive?.pending && document.readyState==='loading') {
          await new Promise(resolve=>document.addEventListener('DOMContentLoaded',resolve,{once:true}));
          if (departed) return;
        }
        if (window.VaultPlay && !VaultPlay.rawCheck(localStorage.getItem('imi-ops-v1'),localStorage.getItem('imi-score'))) {
          failed = true; startup.length = 0;
          return status('This save changed or cannot be opened safely. Your saved data has not been changed.');
        }
        if (window.VaultPlay && !VaultPlay.startupCheck(localStorage.getItem('imi-ops-v1'))) {
          failed=true;startup.length=0;
          return status('This Archive checkpoint cannot be opened safely. Your saved data has not been changed.');
        }
        owner = true;
        const held = new Promise(resolve => { release = resolve; });
        booted = true;
        while (startup.length && owns()) invoke(startup.shift());
        if (panel && !failed && !transactionRetry) dismissStatus();
        await held;
        owner = false; release = null;
      });
    } catch (error) {
      requesting = false; owner = false;
      status('This browser refused save ownership. Retry to try again.');
      console.error('LG-01A lock:', error);
    }
  }
  function start(callback) {
    if (failed || departed) return;
    if (owns()) invoke(callback); else { startup.push(callback); void acquire(); }
  }
  // Capture prevents old shell listeners and toys from acting after ownership ends.
  for (const type of ['click', 'pointerdown', 'keydown', 'input', 'change']) document.addEventListener(type, event => {
    if (owns() && (transactionRetry || localIntent) && api?.challengeEnabled() && event.target.closest?.('[data-act="automation:challenge-toggle"]')) {
      if (type === 'click') {api.challengeOff(); event.preventDefault(); event.stopImmediatePropagation(); return;}
      if (type === 'pointerdown' || type === 'keydown') return;
    }
    if (owns() && (transactionRetry || localIntent) && api?.printingEnabled() && event.target.closest?.('[data-act="automation:print-toggle"]')) {
      if (type === 'click') { api.printingOff(); event.preventDefault(); event.stopImmediatePropagation(); return; }
      if (type === 'pointerdown' || type === 'keydown') return;
    }
    if ((!owns() || transactionRetry || localIntent) && !panel?.contains(event.target) && !(type === 'keydown' && event.key === 'Tab')) { event.preventDefault(); event.stopImmediatePropagation(); }
  }, true);
  addEventListener('pagehide', () => {
    if (owns() && !transactionRetry && !localIntent && window.VaultPlay?.enabled() && VaultPlay.pending(api?.state() || {})) lampAction({kind:'activate',purchaseId:VaultPlay.pending(state())});
    if (owns() && localUnresolved()) {
      departureDisposition = transactionRetry ? 'preserve' : continueLocal() ? 'settled' : 'preserve';
    }
    if (owns()) for (const finish of finalizers) { try { finish(); } catch (error) { console.error('LG-01A final save:', error); } }
    statusPresentation?.(null); statusPresentation = null;
    departed = true; owner = false; localIntent = null; localExecuting = false;
    for (const id of pending.keys()) cancel(id);
    release?.();
  });
  // The restored document remains inert; a new document loads both keys under a fresh lock.
  addEventListener('pageshow', event => { if (event.persisted) location.reload(); });

  // Catalogue IDs are logical claims; changing catalogueVersion cannot repay them.
  const assignments = {
    l100:'L', l1k:'L', l10k:'L', l100k:'D', c10:'L', c50:'G', c100:'L', c200:'G',
    w10:'L', w100:'L', w1k:'L', s1:'C', s4:'C', s8:'D', s12:'D', s16:'D',
    k10:'C', k50:'D', k300:'D', m25:'C', m150:'D', m900:'D', d1:'C', d2:'D', d3:'D',
    p8:'L', p20:'D', p40:'D', g1:'G', g10:'G', g25:'G', r1:'L', deal:'D',
    storm:'L', night:'L', b10k:'C', b1m:'C', b1b:'C', keep:'L', hold:'C', away1:'C',
    lamp3:'C', mk15:'C', mk19:'D', lv5:'L', lv10:'L', hat1:'L', d4:'D', d5:'D',
    p1:'C', p10:'L', p50:'D', mk1:'C', mk3:'C', dv1:'C', dv100:'C', dv5:'D',
    dvall:'D', mu1:'C', mu3:'C', gar1:'L', gar500:'L', pr1:'D', pr3:'D',
    ch1:'D', ch4:'D', roy100:'C', roy1m:'C'
  };
  const firsts = { 'layer:printing:first':5, 'challenge:vowel:first':5,
    'challenge:haiku:first':7, 'challenge:hands:first':7, 'challenge:timed:first':9 };
  const letterFirsts = {
    'layer:imprint:first':{kind:'L', tier:0},
    'layer:estate:first':{kind:'L', tier:0},
    'challenge:handplanted:first':{kind:'L', tier:0}, 'challenge:onebrief:first':{kind:'L', tier:0},
    'challenge:paperonly:first':{kind:'L', tier:0}, 'challenge:fixedcast:first':{kind:'L', tier:0},
    'challenge:smallcrew:first':{kind:'L', tier:0}, 'challenge:quietshop:first':{kind:'L', tier:0},
    'challenge:patientpress:first':{kind:'L', tier:0}, 'challenge:baremetal:first':{kind:'L', tier:0}
  };
  const object = n => !!n && typeof n === 'object' && !Array.isArray(n);
  const integer = n => Number.isSafeInteger(n) && n >= 0;
  const clone = n => JSON.parse(JSON.stringify(n));
  let api, volatile = null, busy = false, writing = false, fault = null;
  const localEnabled = (window.GameFeatures?.enabled('lg02') ?? new URLSearchParams(location.search).get('lg02') === '1');
  let localIntent = null, localExecuting = false, departureDisposition = null, completedLocalId = null;
  const localUnresolved = () => !!(localIntent || api?.state().prem?.vault?.transition);
  const localDisposition = () => departureDisposition || (localUnresolved() ? 'preserve' : null);
  const state = () => api.state();
  const wallet = () => window.IMI.bananas;
  function transaction(callback) {
    const prior = writing; writing = true;
    try { return callback(); } finally { writing = prior; }
  }
  let lampCapability = null, lifetimeLease = null, lifetimeSequence = 0;
  const completedLamp = {};
  function hold(message) {
    if (window.VaultPlay?.enabled() && api && !lifetimeLease) {
      lifetimeLease = Object.freeze({id:++lifetimeSequence,mono:performance.now(),wall:Date.now()});
      api.lampHold(lifetimeLease);
    }
    fault = message; window.IMI.ops.progression.stop();
    transactionRetry = retry;
    status(message + (window.VaultPlay?.enabled() ? ' While saved recovery is pending, game progress stays paused, even while this game is closed. Retry to finish saving. Before recovery is saved, reloading uses your last saved progress.' : ''));
    return false;
  }
  function invalid(message) { throw Error(message); }
  const expanded = () => window.AwardsCatalogue;
  const funding = () => expanded()?.funding;
  const expandedRow = id => (expanded()?.enabled ? expanded().source(id) : undefined) || (funding()?.enabled ? funding().source(id) : undefined);
  const knownSource = id => !!(assignments[id.slice(6)] || firsts[id] || letterFirsts[id] || expandedRow(id));
  const goldSource = (s,id) => id === window.Hall?.id ? Hall.goldSource(s,id) : (assignments[id.slice(6)] === 'G' || expandedRow(id)?.kind === 'G') && s.rewards.claims[id]?.status === 'committed' && s.rewards.claims[id]?.descriptor?.kind === 'G';
  let hallWaiting = null;
  function hallFinish() {
    if (!hallWaiting) return true;
    normalize(hallWaiting.candidate);
    if (JSON.stringify(state()) !== hallWaiting.source) return hold('Hall source changed. Reload the acknowledged save.');
    const result = transaction(() => api.hallCommit(hallWaiting.candidate,hallWaiting.source));
    if (!result.ok) return hold('Hall waiting to save. Retry keeps the exact observations and reward. ' + result.error);
    hallWaiting = null;
    return true;
  }
  function hallInitialize(reason) {
    if (!window.Hall?.enabled || state().meta.hall !== undefined) return true;
    if (!owns() || hallWaiting) return false;
    hallWaiting = {source:JSON.stringify(state()),candidate:Hall.candidate(state(),'init',reason === 'full-reset' ? {} : api.hallHistory())};
    return hallFinish();
  }
  function hallAction(action) {
    if (!['save','claim'].includes(action) || !window.Hall?.enabled || !owns() || hallWaiting) return false;
    if (!window.IMI.ops.progression.running() || !guard(state()) || localDisposition() || !api.identitySettled()) return false;
    try {
      if (action === 'claim' && state().meta.hall?.claims[Hall.id]) return false;
      hallWaiting = {source:JSON.stringify(state()),candidate:Hall.candidate(state(),action)};
      return hallFinish();
    } catch (error) { return hold(error.message + '. Save preserved.'); }
  }
  function normalize(candidate) {
    if (!object(candidate.rewards) || !object(candidate.prem)) invalid('Unsupported reward namespaces');
    api?.masteryValidate(candidate); api?.challengeValidate(candidate); window.CommissionBoard?.validate(candidate); window.Seasons?.validate(candidate);
    const r = candidate.rewards, p = candidate.prem;
    expanded()?.validate(candidate, api.expandedManual, api.masteryValidate);
    window.Hall?.validate(candidate);
    if ((candidate.meta?.hall?.claims?.[window.Hall?.id] !== undefined || r.storedGold?.tokens?.[window.Hall?.id] !== undefined) && !goldSource(candidate,Hall.id)) invalid('Inconsistent Hall claim/token source');
    if (r.goals !== undefined && (!object(r.goals) || !Array.isArray(r.goals.ids) || r.goals.ids.length > 3 ||
        r.goals.ids.some(id => typeof id !== 'string') || new Set(r.goals.ids).size !== r.goals.ids.length)) invalid('Invalid goal selection');
    for (const key of ['claims', 'storedGold']) {
      if (r[key] !== undefined && !object(r[key])) invalid('Invalid reward ' + key);
      r[key] ??= key === 'storedGold' ? { tokens:{} } : {};
    }
    if (!object(r.storedGold.tokens ?? {})) invalid('Invalid stored tokens');
    r.storedGold.tokens ??= {};
    if (r.migration !== undefined && (!object(r.migration) || r.migration.version !== 1 ||
        r.migration.policy !== 'db-only' || !Array.isArray(r.migration.oldAwardIds) ||
        !Array.isArray(r.migration.oldChallengeIds) || !integer(r.migration.oldPrinting))) invalid('Invalid reward migration receipt');
    if (r.activeGold != null && (!object(r.activeGold) || !Number.isFinite(r.activeGold.remainingGameMs) || r.activeGold.remainingGameMs < 0 ||
        r.activeGold.remainingGameMs > 15000 || typeof r.activeGold.activationId !== 'string')) invalid('Invalid active rush');
    if (r.activeGold && (r.storedGold.tokens[r.activeGold.activationId]?.status !== 'consumed' ||
        !goldSource(candidate,r.activeGold.activationId))) invalid('Missing activation source');
    if (r.walletHead && (!object(r.walletHead) || !['away','pitch-sale','archive','mastery-sale','challenge-sale','board-sale','board-claim','seasons-claim'].includes(r.walletHead.origin) || typeof r.walletHead.id !== 'string' ||
        !(r.walletHead.origin === 'seasons-claim' ? ['id','sequence','amount','origin'].every(k => candidate.meta.seasons?.lastClaim?.[k] === r.walletHead[k]) : r.walletHead.origin.startsWith('board-') ? ['id','sequence','amount','origin'].every(k => candidate.meta.commissionBoard?.[r.walletHead.origin === 'board-sale' ? 'receipt' : 'lastClaim']?.[k] === r.walletHead[k]) : r.walletHead.origin === 'challenge-sale' ? r.walletHead.id.startsWith('a11-sale:') &&
          ['id','sequence','amount'].every(k => candidate.meta.automation?.challenge?.receipt?.[k] === r.walletHead[k]) : r.walletHead.origin === 'mastery-sale' ? r.walletHead.id.startsWith('mastery-sale:') &&
          ['id','sequence','amount'].every(k => candidate.meta.challengeMastery?.receipt?.[k] === r.walletHead[k]) : r.walletHead.origin === 'archive' ? r.walletHead.id.startsWith('archive:') : r.walletHead.origin === 'away' ? r.walletHead.id.startsWith('away:') : r.walletHead.id.startsWith('pitch-sale:') &&
          candidate.meta.automation?.pitch?.manual?.complete === true &&
          JSON.stringify(candidate.meta.automation.pitch.manual.receipt) === JSON.stringify({id:r.walletHead.id,sequence:r.walletHead.sequence,amount:r.walletHead.amount})) ||
        !integer(r.walletHead.sequence) || !r.walletHead.sequence || !integer(r.walletHead.amount) || !r.walletHead.amount || r.walletHead.amount % window.Economy.scale)) invalid('Invalid away wallet receipt');
    if (r.awayCheckpoint) {
      const cp = r.awayCheckpoint;
      if (!object(cp) || cp.version !== 1 || !integer(cp.st) || !integer(cp.batch) ||
          !Number.isFinite(cp.awaySec) || cp.awaySec < 0 || !Number.isFinite(cp.sec) || cp.sec < 0 || cp.sec > cp.awaySec ||
          !Number.isFinite(cp.multiplier) || cp.multiplier <= 0 || !Number.isFinite(cp.eff) || cp.eff < 0 || cp.eff > 1 ||
          !Number.isFinite(cp.nowMs) || !Number.isFinite(cp.paidSeconds) || cp.paidSeconds < 0 || !object(cp.report) || !object(cp.sold) ||
          !['early','advance','work','sale','challenge','expiry','next','tail','tray','market','roy','div','archive','bulk','complete'].includes(cp.phase) ||
          !Array.isArray(cp.saleTimes) || (cp.timed && (!Array.isArray(cp.boundaries) || !Array.isArray(cp.budgets)))) invalid('Invalid away checkpoint');
      if (cp.timed) {
        if (cp.boundaries[0] !== 0 || Math.abs(cp.boundaries.at(-1) - cp.sec) > Math.max(1, cp.sec) * Number.EPSILON * 8 || cp.st > cp.boundaries.length - 1 ||
            cp.boundaries.some((n, i) => !Number.isFinite(n) || n < 0 || (i && n <= cp.boundaries[i - 1]))) invalid('Invalid away chronology');
        const realBatch = cp.sec / Math.max(1, Math.min(300, Math.ceil(cp.sec / 20)));
        const sampled = !['early','advance','work'].includes(cp.phase) || (cp.phase === 'work' && cp.st > 0 && cp.boundaries[cp.st] < (cp.batch + 1) * realBatch);
        candidate.desks.forEach((desk, i) => {
          const budget = cp.budgets[i];
          if (sampled && desk.owned && desk.paws && !object(budget)) invalid('Missing conserved away sample');
          if (budget == null) return;
          if (!object(budget) || !Number.isFinite(budget.raw) || budget.raw < 0 || !integer(budget.n) || budget.n !== Math.round(budget.raw) ||
              !integer(budget.typed) || budget.typed > budget.n || !object(budget.inventory) || !object(budget.released) ||
              !Number.isFinite(budget.keeperRaw) || budget.keeperRaw < 0 || !integer(budget.banked) || !integer(budget.pass) || budget.pass > 12 ||
              !integer(budget.word) || typeof budget.any !== 'boolean') invalid('Invalid conserved away budget');
          if (budget.n) for (const ch of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
            if (!Object.hasOwn(budget.inventory, ch) || !integer(budget.inventory[ch]) ||
                (budget.typed && (!Object.hasOwn(budget.released, ch) || !integer(budget.released[ch]) || budget.released[ch] > budget.inventory[ch]))) invalid('Missing conserved letter inventory');
          }
        });
      }
    }
    for (const key of ['earned', 'bought', 'earnedTotal', 'boughtTotal', 'spentEarned', 'spentBought']) {
      if (p[key] !== undefined && !integer(p[key])) invalid('Invalid Diamond ledger ' + key);
      p[key] ??= 0;
    }
    if (p.credits !== undefined && !object(p.credits)) invalid('Invalid Diamond credits');
    p.credits ??= {};
    if (p.earned + p.spentEarned !== p.earnedTotal || p.bought + p.spentBought !== p.boughtTotal ||
        !integer(p.earned + p.bought)) invalid('Unverifiable Diamond ledger totals');
    const totals = { earned:0, bought:0 };
    for (const credit of Object.values(p.credits)) {
      if (!object(credit) || !['earned','bought'].includes(credit.source) || !integer(credit.amount)) invalid('Unverifiable Diamond credit');
      totals[credit.source] += credit.amount;
    }
    if (totals.earned !== p.earnedTotal || totals.bought !== p.boughtTotal) invalid('Unverifiable Diamond source totals');
    p.version ??= 1; r.version ??= 1; r.catalogueVersion ??= 1;
    for (const [id, claim] of Object.entries(r.claims)) {
      if (!knownSource(id)) continue; // Preserve future claims without interpreting them.
      if (!object(claim) || !['prepared','committed','waived'].includes(claim.status) ||
          !['new','historical','recovered'].includes(claim.origin)) invalid('Invalid claim ' + id);
      if (claim.status !== 'waived') validateDescriptor(id, claim.descriptor);
      if (claim.descriptor && claim.descriptor.origin !== claim.origin) invalid('Claim origin mismatch ' + id);
      if (claim.deltaApplied !== undefined && typeof claim.deltaApplied !== 'boolean') invalid('Invalid cash delta receipt ' + id);
      if (claim.status === 'waived' && claim.origin !== 'historical') invalid('Invalid waiver ' + id);
      if (claim.status === 'waived' && (row(id).kind === 'D' || !historical(candidate, id))) invalid('Invalid historical waiver ' + id);
      if (claim.descriptor?.kind === 'C' && (!integer(claim.sequence) || claim.sequence < 1 ||
          claim.sequence !== claim.previous + 1 || !integer(claim.printing))) invalid('Invalid cash preparation ' + id);
    }
    for (const [id, token] of Object.entries(r.storedGold.tokens)) {
      if (!assignments[id.slice(6)] && !expandedRow(id)) continue;
      if (!object(token) || !['stored','consumed'].includes(token.status) ||
          (r.claims[id] && (r.claims[id].status !== 'committed' || r.claims[id].descriptor?.kind !== 'G'))) invalid('Invalid token receipt ' + id);
      if (token.status === 'consumed' && token.activationId !== id) invalid('Missing token activation receipt ' + id);
    }
    return candidate;
  }
  function row(id) {
    if (expandedRow(id)) return expandedRow(id);
    if (Object.hasOwn(letterFirsts, id)) return letterFirsts[id];
    if (Object.hasOwn(firsts, id)) return { kind:'D', amount:firsts[id] };
    const key = id.slice(6), award = api.rewardAwards().find(a => a.id === key);
    if (!id.startsWith('award:') || !award || !Object.hasOwn(assignments, key)) invalid('Unknown reward ' + id);
    return { kind:assignments[key], tier:award.tier };
  }
  function descriptor(id, origin, basis = api.rewardBasis()) {
    const rule = row(id), E = window.Economy, tier = rule.tier;
    const kind = rule.kind;
    if (kind === 'D' || kind === 'G') return { version:1, kind, amount:kind === 'G' ? 1 : rule.amount ?? (tier === 1 ? 2 : 4), origin };
    const minutes = (kind === 'L' ? [3,5,10] : [5,10,30])[tier];
    const floor = kind === 'L' ? 50 : E.cash(250);
    const cap = kind === 'L' ? [5000,20000,100000][tier] : E.cash([10000,1000000,100000000][tier]);
    const rate = kind === 'L' ? basis.letters[basis.desk] : basis.bananas;
    if (!Number.isFinite(rate) || rate < 0) invalid('Invalid production basis');
    const bounded = Math.max(floor, Math.min(cap, 60 * minutes * rate));
    return { version:1, kind, amount:kind === 'L' ? Math.floor(bounded) : E.round(bounded),
      ...(kind === 'L' ? { desk:basis.desk } : {}), rate, minutes, floor, cap, speed:basis.speed, origin };
  }
  function validateDescriptor(id, d) {
    const rule = row(id);
    if (!object(d) || d.version !== 1 || d.kind !== rule.kind || !integer(d.amount) || d.amount === 0) invalid('Invalid locked descriptor ' + id);
    if (d.kind === 'L' && (!integer(d.desk) || d.desk >= state().desks.length)) invalid('Invalid locked desk ' + id);
    if (d.kind === 'C' && d.amount % window.Economy.scale) invalid('Invalid cash denomination ' + id);
    if (d.kind === 'G' && d.amount !== 1) invalid('Invalid gold quantity ' + id);
    if (d.kind === 'D' && d.amount !== (rule.amount ?? (rule.tier === 1 ? 2 : 4))) invalid('Invalid fixed Diamond amount ' + id);
    if (d.kind === 'L' || d.kind === 'C') {
      const tier = rule.tier, minutes = (d.kind === 'L' ? [3,5,10] : [5,10,30])[tier];
      const floor = d.kind === 'L' ? 50 : window.Economy.cash(250);
      const cap = d.kind === 'L' ? [5000,20000,100000][tier] : window.Economy.cash([10000,1000000,100000000][tier]);
      if (d.minutes !== minutes || d.floor !== floor || d.cap !== cap || !Number.isFinite(d.rate) ||
          d.rate < 0 || !Number.isFinite(d.speed) || d.speed <= 0 || d.amount < floor || d.amount > cap) invalid('Invalid locked basis ' + id);
      const raw = Math.max(floor, Math.min(cap, 60 * minutes * d.rate));
      if (d.amount !== (d.kind === 'L' ? Math.floor(raw) : window.Economy.round(raw))) invalid('Invalid locked amount ' + id);
    }
  }
  function persist(candidate) {
    normalize(candidate);
    const result = api.rewardCommit(candidate);
    if (!result.ok) return hold('Progress not saved. Reward waiting to save. ' + result.error);
    return true;
  }
  function eligible(s) {
    return [...Object.keys({...assignments,...(expanded()?.enabled ? Object.fromEntries([...expanded().rows,...(funding()?.enabled ? funding().rows : [])].map(r => [r.id,r.kind])) : {})}).filter(id => s.awards[id]).map(id => 'award:' + id),
      ...Object.keys({...firsts, ...letterFirsts}).filter(id => id === 'layer:estate:first' ? s.meta.estate?.version === 1 && (s.meta.estate.count || 0) > 0 : id === 'layer:imprint:first' ? s.meta.layers?.version === 1 && (s.meta.layers.count || 0) > 0 : id.startsWith('layer:') ? s.printing >= 1 : s.chDone[id.split(':')[1]])];
  }
  function historical(s, id) {
    if (funding()?.source(id)) return !!s.meta.speedFundingAwards?.historicalIds.includes(id.slice(6));
    if (expandedRow(id)) return !!s.meta.expandedAwards?.historicalIds.includes(id.slice(6));
    if (Object.hasOwn(letterFirsts, id)) return false;
    const m = s.rewards.migration;
    return id.startsWith('award:') ? m.oldAwardIds.includes(id.slice(6)) :
      id.startsWith('challenge:') ? m.oldChallengeIds.includes(id.split(':')[1]) : m.oldPrinting >= 1;
  }
  function guard(candidate) {
    try {
      window.WorksDemo?.retained(candidate);
      window.WorksPlay?.retained(candidate);
      normalize(clone(candidate));
      if (!candidate.rewards.migration) return hold('Initial reward history is waiting to save.');
      for (const id of eligible(candidate)) if (!candidate.rewards.claims[id]) return hold('Missing reward metadata: ' + id + '. Repair required.');
      return !fundingWaiting && !expandedWaiting && !hallWaiting && !volatile && !fault && !writing && !seasonsWaiting && !candidate.meta.seasons?.pending && !boardWaiting && !candidate.meta.commissionBoard?.pending && !candidate.meta.automation?.challenge?.pending && !candidate.meta.challengeMastery?.pending && !candidate.meta.layers?.pending && !candidate.meta.estate?.pending && !candidate.meta.archive?.pending && !candidate.meta.automation?.pitch?.sale && !candidate.meta.automation?.media?.pending && !candidate.meta.automation?.print?.pending && (!api.mediaEnabled?.() || api.validMedia(candidate.meta.automation?.media));
    } catch (error) { return hold(error.message + '. Repair required.'); }
  }
  // This check is pure. Reconciliation may pay only the actual live obligation.
  function localCandidate(candidate) {
    normalize(clone(candidate));
    if (!candidate.rewards.migration || volatile || fault) invalid('Unresolved local reward obligation');
    for (const id of eligible(candidate)) if (!candidate.rewards.claims[id]) invalid('Missing reward metadata: ' + id);
    const marker = wallet().acknowledgement(), r = candidate.rewards;
    for (const [id, c] of Object.entries(r.claims)) {
      if (c.status === 'prepared') invalid('Prepared reward must settle first');
      if (c.status !== 'committed') continue;
      if (c.descriptor?.kind === 'D' && (candidate.prem.credits[id]?.source !== 'earned' || candidate.prem.credits[id]?.amount !== c.descriptor.amount)) invalid('Diamond source mismatch');
      if (c.descriptor?.kind === 'G' && !r.storedGold.tokens[id]) invalid('Missing gold source receipt');
      if (c.descriptor?.kind === 'C' && (!c.deltaApplied || !marker || marker.sequence < c.sequence)) invalid('Committed cash has no wallet acknowledgement');
    }
    if (r.awayCheckpoint?.credit) invalid('Away payment must settle first');
    if (marker && !(r.walletHead?.id === marker.id && r.walletHead.sequence === marker.sequence && r.walletHead.amount === marker.amount) &&
        !window.Folio?.cashMarker(candidate, marker) &&
        !(r.claims[marker.id]?.descriptor?.kind === 'C' && r.claims[marker.id].sequence === marker.sequence && r.claims[marker.id].descriptor.amount === marker.amount)) invalid('Unexplained wallet reward marker');
    const validated = window.Vault.validate(candidate);
    if (!['valid','absent'].includes(validated.status)) invalid('Unsupported local Vault candidate: ' + validated.code);
    return true;
  }
  function continueLocal() {
    if (!localIntent || !owns() || localExecuting || fault) return false;
    const intent = localIntent;
    localExecuting = true;
    try {
      api.vaultResume();
      // OPEN, old deletion, tail deletion and closing are distinct real saves.
      for (let phase = 0; phase < 8; phase++) {
        const frame = intent.settle(intent.id);
        if (fault || transactionRetry || !owns()) return false;
        if (frame?.done) {
          api.vaultComplete();
          if (intent.command) return commitLamp(intent);
          completedLocalId = intent.id;
          localIntent = null;
          intent.continue();
          return true;
        }
        if (!frame?.proposal) invalid('Missing owned boundary proposal');
        const proposal = intent.build(frame.proposal);
        localCandidate(state());
        const baseline = wallet().saveAcknowledged();
        if (!baseline.ok) return hold('Wallet baseline waiting to save. ' + baseline.error);
        const result = transaction(() => api.vaultCommit(intent.id, proposal, localCandidate));
        if (!result.ok) return hold('Historical boundary waiting to save. ' + result.error);
      }
      return hold('Historical boundary did not finish its bounded phases.');
    } catch (error) { return hold(error.message + '. Repair required.'); }
    finally { localExecuting = false; }
  }
  function runLocalTransaction(request) {
    if (!localEnabled || !api || !owns() || localIntent || localExecuting || busy || fault || volatile || transactionRetry ||
        !object(request) || Object.getPrototypeOf(request) !== Object.prototype ||
        Object.keys(request).some(k => !['id','kind','settle','build','continue'].includes(k)) ||
        request.kind !== 'settlement' || typeof request.id !== 'string' || !/^boundary:[a-z0-9-]{1,64}$/.test(request.id) ||
        request.id === completedLocalId ||
        request.settle !== api.vaultBoundary || typeof request.build !== 'function' || typeof request.continue !== 'function' ||
        !(state().prem?.vault?.transition ? api.vaultPrepare() : window.IMI.ops.progression.running()) || !guard(state())) return false;
    localIntent = {id:request.id, settle:request.settle, build:request.build, continue:request.continue};
    return continueLocal();
  }
  function lampReview(itemId) {
    if (!api || !owns() || busy || localIntent || volatile || fault || transactionRetry || !guard(state()) || !api.identitySettled()) throw Error('Finish waiting work before reviewing a purchase.');
    return VaultPlay.review(state(),itemId);
  }
  function lampUndoable(id) {
    return owns() && lampCapability?.purchaseId === id && performance.now() < lampCapability.expiresMono;
  }
  function commitLamp(intent) {
    const c=intent.command;
    try {
      localCandidate(state());
      if (c.kind === 'reserve' && JSON.stringify(VaultPlay.review(state(),c.quote?.itemId)) !== JSON.stringify(c.quote)) {
        localIntent=null; api.lampRefused('The purchase review changed. Review it again.');
        return {ok:false,refused:true,error:'The purchase review changed. Review it again.'};
      }
      const baseline=wallet().saveAcknowledged();
      if (!baseline.ok) return hold('Wallet baseline waiting to save. '+baseline.error);
      const result=transaction(()=>api.lampCommit(c,localCandidate));
      if (!result.ok) return hold((c.kind==='reserve'?'Purchase not saved. No Diamond Bananas spent. Retry to save this purchase.':c.kind==='refund'?`Undo not saved. Purchase is still saved. Retry to return ${state().prem.vault.purchases[c.purchaseId].debitEarned} Diamond Bananas.`:c.kind==='activate'?'Purchase saved. Upgrade not active yet. Retry to activate it.':'Store preference not saved. Retry to save it.')+' '+result.error);
      localIntent=null;
      if(c.kind==='reserve') {
        const purchaseId=VaultPlay.pending(state());
        lampCapability={purchaseId,expiresMono:performance.now()+10000};
        timers.setTimeout(()=>{if(owns()&&!transactionRetry&&!localIntent&&VaultPlay.pending(state())===purchaseId)lampAction({kind:'activate',purchaseId});},10000);
      } else if(c.kind==='refund'||c.kind==='activate') lampCapability=null;
      completedLamp[c.kind]={key:JSON.stringify(c),result:{ok:true,duplicate:true}};
      api.lampSaved(c);
      return result;
    } catch(error) {localIntent=null;return {ok:false,refused:true,error:error.message};}
  }
  function lampAction(request) {
    if (!window.VaultPlay?.available() || !window.VaultPlay.enabled() || !api || !owns() || busy || fault || volatile || transactionRetry || localIntent || !object(request)) return {ok:false,refused:true,error:'Finish waiting saves first.'};
    const allowed={reserve:['kind','quote'],refund:['kind','purchaseId'],activate:['kind','purchaseId'],settings:['kind','hideStore']}[request.kind];
    if(!allowed || Object.keys(request).some(k=>!allowed.includes(k)) || !VaultPlay.supported(state(),true) || !guard(state())) return {ok:false,refused:true,error:'Unsupported lamp command.'};
    const command=clone(request), receipt=state().prem.vault?.purchases[command.purchaseId];
    if(completedLamp[command.kind]?.key===JSON.stringify(command))return completedLamp[command.kind].result;
    if(receipt && receipt.status===(command.kind==='refund'?'refunded':command.kind==='activate'?'active':''))return {ok:true,duplicate:true};
    if(command.kind==='refund'&&!lampUndoable(command.purchaseId))return {ok:false,refused:true,error:'Undo ended. Keep the saved purchase.'};
    if(command.kind==='reserve') {try {if(JSON.stringify(lampReview(command.quote?.itemId))!==JSON.stringify(command.quote))throw Error('The purchase review changed. Review it again.');}catch(error){return {ok:false,refused:true,error:error.message};}}
    if(command.kind==='activate'&&receipt?.status!=='undoable')return {ok:false,refused:true,error:'No saved reservation.'};
    if(!window.IMI.ops.progression.running())return {ok:false,refused:true,error:'Progression paused.'};
    localIntent={id:'boundary:lamp-'+command.kind,command,settle:api.vaultBoundary,build:p=>p};
    return continueLocal();
  }
  function lampStartup() {
    if(!window.VaultPlay?.enabled()||!VaultPlay.pending(state()))return true;
    const id=VaultPlay.pending(state());
    // Startup owns all positive absence, independently of the welcome threshold.
    return lampAction({kind:'activate',purchaseId:id});
  }
  // Fixed media prepare/debit/finish only. Never use the reward-credit marker for a purchase.
  let mediaWaiting = null, mediaWalletWriting = false;
  function mediaWrite(request) {
    const result = transaction(() => api.mediaCommit(request));
    if (!result.ok) hold('Media release waiting. Retry the exact release. ' + result.error);
    return result;
  }
  function finishMedia() {
    try {
      const t = api.mediaValidate();
      mediaWalletWriting = true;
      let paid;
      try { paid = wallet().debitMediaAcknowledged(t.id); } finally { mediaWalletWriting = false; }
      if (!paid.ok) { hold('Media debit waiting. Retry the exact release. ' + paid.error); return paid; }
      return mediaWrite({action:'finish'});
    } catch(error) { hold(error.message); return {ok:false,error:error.message}; }
  }
  function continueMedia() {
    if (state().meta.automation?.media?.pending) return finishMedia();
    try { api.mediaValidate(mediaWaiting,false); } catch(error) { hold(error.message); return {ok:false,error:error.message}; }
    const baseline = wallet().saveAcknowledged();
    if (!baseline.ok) { hold('Media baseline waiting. Retry the exact release. ' + baseline.error); return baseline; }
    const result = mediaWrite({action:'prepare',intent:mediaWaiting});
    if (!result.ok) return result;
    mediaWaiting = null;
    return finishMedia();
  }
  function mediaRelease(request) {
    if (!api?.mediaEnabled() || !owns() || busy || volatile || fault || transactionRetry || localUnresolved() || folioWaiting || layerWaiting || pitchWaiting ||
        !window.IMI.ops.progression.running() || !guard(state()) || !object(request) ||
        !window.Layers.epochMatches(state(),request) || Object.keys(request).some(k => !['division','quantity','origin','resetEpoch'].includes(k))) return {ok:false,error:'Finish the waiting save before releasing media.'};
    try {
      // Freeze once, before any acknowledgement. Retry never selects or quotes another release.
      const intent = api.mediaPlan(request.division,request.quantity,request.origin);
      const baseline = wallet().saveAcknowledged();
      if (baseline.ok) intent.wallet = JSON.parse(localStorage.getItem('imi-score'));
      mediaWaiting = clone(intent);
      if (!baseline.ok) { hold('Media baseline waiting. Retry the exact release. ' + baseline.error); return baseline; }
      const result = mediaWrite({action:'prepare',intent:mediaWaiting});
      if (!result.ok) return result;
      mediaWaiting = null;
      return finishMedia();
    } catch(error) { return {ok:false,error:error.message}; }
  }
  function mediaWallet(id) {
    if (!mediaWalletWriting || !owns()) return null;
    const t = api.mediaValidate();
    return t.id === id ? t : null;
  }
  // One predecessor sale only. Ops validates its exact recipe, quote and durable word deduction.
  let pitchWaiting = null;
  function pitchWrite(request) {
    const result = transaction(() => api.pitchSaleCommit(request));
    if (!result.ok) { if (result.refused && !state().meta.automation?.pitch?.sale) pitchWaiting = null; hold('Tracked pitch sale waiting. Retry to finish. ' + result.error); }
    return result;
  }
  function finishPitch() {
    try {
      const t = api.pitchSaleValidate();
      const paid = wallet().creditReward({id:t.id,previous:t.previous,sequence:t.sequence,amount:t.pay});
      if (!paid.ok) { hold('Tracked pitch payment waiting. Retry to finish. ' + paid.error); return paid; }
      return pitchWrite({action:'finish'});
    } catch(error) { hold(error.message); return {ok:false,error:error.message}; }
  }
  function continuePitch(request) {
    if (state().meta.automation?.pitch?.sale) return finishPitch();
    const baseline = wallet().saveAcknowledged();
    if (!baseline.ok) { hold('Tracked pitch baseline waiting. Retry to finish. ' + baseline.error); return baseline; }
    const result = pitchWrite(request);
    if (!result.ok) return result;
    pitchWaiting = null;
    return finishPitch();
  }
  function pitchSale(request) {
    if (!api?.pitchEnabled?.() || !owns() || busy || volatile || fault || transactionRetry || localUnresolved() || folioWaiting || layerWaiting ||
        !window.IMI.ops.progression.running() || !guard(state()) || !object(request) || request.action !== 'prepare' ||
        typeof request.id !== 'string' || typeof request.auto !== 'boolean' || !window.Layers.epochMatches(state(),request) || Object.keys(request).some(k => !['action','id','auto','resetEpoch'].includes(k))) return {ok:false,error:'Finish the waiting save before selling this pitch.'};
    pitchWaiting = clone(request);
    return continuePitch(pitchWaiting);
  }
  // Folio alone owns these commands and its bounded durable intent. This is not a callback transaction API.
  let folioWaiting = null;
  function folioWrite(request) {
    const result = transaction(() => api.folioCommit(request));
    if (!result.ok && !result.refused) hold('Folio binding waiting to save. Retry to finish. ' + result.error);
    return result;
  }
  function finishFolio() {
    const pending = state().meta?.folio?.pending;
    if (!pending) return {ok:true};
    // Requote the durable selection, current Printing, owned desks and words before credit.
    try {
      window.Folio.proposal(state(), {action:'finish'}, pending.credit || null, false);
    } catch(error) { hold(error.message); return {ok:false, error:error.message}; }
    if (pending.credit) {
      const paid = wallet().creditReward(pending.credit);
      if (!paid.ok) { hold('Folio payment waiting to save. Retry to finish. ' + paid.error); return paid; }
    }
    const result = folioWrite({action:'finish'});
    if (!result.ok && result.refused) hold(result.error);
    return result;
  }
  function continueFolio(request) {
    if (state().meta?.folio?.pending) return finishFolio();
    if (request.action === 'prepare') {
      const baseline = wallet().saveAcknowledged();
      if (!baseline.ok) { hold('Folio wallet waiting to save. Retry to finish. ' + baseline.error); return baseline; }
    }
    const result = folioWrite(request);
    if (!result.ok) return result;
    folioWaiting = null;
    return request.action === 'prepare' ? finishFolio() : result;
  }
  function folioAction(request) {
    if (!window.Folio?.enabled || !api || !owns() || busy || volatile || fault || transactionRetry || localUnresolved() || state().rewards.awayCheckpoint ||
        !window.IMI.ops.progression.running() || !guard(state())) return {ok:false, error:'Finish the waiting save before using Folio.'};
    try {
      // Refuse invalid/stale input before retaining a retry, flushing or writing anything.
      window.Folio.proposal(state(), request, wallet().acknowledgement(),
        !!(state().focus && !state().autoFocus && !state().written[state().focus]) || !!(window.ProductionGoal?.enabled && state().meta.productionGoal?.enabled && state().meta.productionGoal.manual));
      folioWaiting = clone(request);
      const result = continueFolio(folioWaiting);
      if (result.refused) folioWaiting = null;
      return result;
    } catch(error) { folioWaiting = null; return {ok:false, error:error.message}; }
  }
  // Fixed Imprint commands only; no callbacks, arbitrary candidate or wallet amount.
  let layerWaiting = null, layerWalletWriting = false;
  function layerWrite(request) {
    const result = transaction(() => api.layerCommit(request));
    if (!result.ok && !result.refused) hold('Imprint waiting to save. Retry to finish the foundation. ' + result.error);
    return result;
  }
  function finishLayer() {
    try {
      const p = window.Layers.pending(state());
      layerWalletWriting = true;
      let paid;
      try { paid = wallet().replaceImprintAcknowledged(p.id); } finally { layerWalletWriting = false; }
      if (!paid.ok) { hold('Imprint wallet waiting to save. Retry to finish. ' + paid.error); return paid; }
      const result = layerWrite({action:'finish'});
      if (!result.ok) { if (result.refused) hold(result.error); return result; }
      const c = state().rewards.claims['layer:imprint:first'];
      if (c?.status === 'prepared' && !transaction(() => deliver('layer:imprint:first',c))) return {ok:false, error:'First foundation Letters waiting to save.'};
      return result;
    } catch(error) { hold(error.message); return {ok:false,error:error.message}; }
  }
  function continueLayer(request) {
    if (state().meta.layers?.pending) return finishLayer();
    if (request.action === 'found') {
      const baseline = wallet().saveAcknowledged();
      if (!baseline.ok) { hold('Imprint baseline waiting to save. Retry to finish. ' + baseline.error); return baseline; }
    }
    const result = layerWrite(request);
    if (!result.ok) return result;
    layerWaiting = null;
    return request.action === 'found' ? finishLayer() : result;
  }
  function layerAction(request) {
    if (!window.Layers?.enabled || !api || !owns() || busy || volatile || fault || transactionRetry || localUnresolved() || folioWaiting ||
        !window.IMI.ops.progression.running() || !guard(state())) return {ok:false,error:'Finish the waiting save before using Imprints.'};
    try {
      if (request.action === 'found') {
        if (window.Archive?.enabled && !api.archiveSettle()) return {ok:false,error:'Archive income waiting to save'};
        if (!window.Layers.same(window.Layers.quote(state()),request.quote) || !window.Layers.same(state().meta.layers,request.expected)) invalid('Foundation changed. Review it again.');
      } else window.Layers.proposal(state(),request);
      layerWaiting = clone(request);
      const result = continueLayer(layerWaiting);
      if (result.refused) layerWaiting = null;
      return result;
    } catch(error) { layerWaiting = null; return {ok:false,error:error.message}; }
  }
  function layerWallet(id) {
    if (!layerWalletWriting || !owns() || !window.Layers?.enabled) return null;
    const p = window.Layers.pending(state());
    return p.id === id ? {seed:p.seed} : null;
  }
  // Printing accepts only its reviewed fixed owner command. Retry never calls doPrint.
  // Only Ops can freeze mastery prices, words and run identity. Callers provide an action/title.
  let seasonsWaiting = false;
  function seasonsWrite(phase) {
    const result=transaction(()=>api.seasonsCommit(phase));
    if (!result.ok) hold('Seasons waiting to save. Retry keeps the exact sample, time and bonus. '+result.error);
    return result;
  }
  function continueSeasons() {
    try {
      if (!state().meta.seasons?.pending) {
        const baseline=wallet().saveAcknowledged();
        if (!baseline.ok) { hold('Seasons wallet baseline waiting. '+baseline.error); return baseline; }
        const prepared=seasonsWrite('prepare'); if (!prepared.ok) return prepared;
      }
      const p=api.seasonsPending();
      if (p.action === 'claim') {
        const paid=wallet().creditReward({id:p.id,previous:p.previous,sequence:p.sequence,amount:p.pay});
        if (!paid.ok) { hold('Seasons payment waiting. '+paid.error); return paid; }
      }
      const result=seasonsWrite('finish'); if (result.ok) seasonsWaiting=false; return result;
    } catch(error) { hold(error.message); return {ok:false,error:error.message}; }
  }
  function seasonsAction(request) {
    if (!api?.seasonsEnabled() || !owns() || busy || volatile || fault || transactionRetry || localUnresolved() ||
        !window.IMI.ops.progression.running() || !guard(state()) || !object(request) ||
        !['participate','observe','leave','expire','claim'].includes(request.action) ||
        Object.keys(request).some(k=>!['action','quote','binding'].includes(k)) || request.quote !== undefined && request.action !== 'participate')
      return {ok:false,refused:true,error:'Finish waiting saves before Seasons.'};
    try { api.seasonsFreeze(request); } catch(error) { return {ok:false,refused:true,error:error.message}; }
    seasonsWaiting=true; return continueSeasons();
  }

  let boardWaiting = false;
  function boardWrite(action) {
    const result=transaction(()=>api.boardCommit(action));
    if(!result.ok)hold('Commission waiting to save. Retry the exact command. '+result.error);
    return result;
  }
  function continueBoard() {
    try {
      if(!state().meta.commissionBoard?.pending) {
        const baseline=wallet().saveAcknowledged();
        if(!baseline.ok){hold('Commission wallet baseline waiting. '+baseline.error);return baseline;}
        const prepared=boardWrite('prepare');if(!prepared.ok)return prepared;
      }
      const p=api.boardPending();
      if(p.action==='sale' || p.action==='claim') {
        const paid=wallet().creditReward({id:p.id,previous:p.previous,sequence:p.sequence,amount:p.pay});
        if(!paid.ok){hold('Commission payment waiting. '+paid.error);return paid;}
      }
      const result=boardWrite('finish');if(result.ok)boardWaiting=false;return result;
    }catch(error){hold(error.message);return {ok:false,error:error.message};}
  }
  function boardAction(request) {
    if(!api?.boardEnabled() || !owns() || busy || volatile || fault || transactionRetry || localUnresolved() ||
        !window.IMI.ops.progression.running() || !guard(state()) || !object(request) ||
        !['start','abandon','expire','sale','claim'].includes(request.action) || Object.keys(request).some(k=>!['action','id','quote'].includes(k)) ||
        request.id!==undefined && request.action!=='sale' || request.quote!==undefined && request.action!=='start') return {ok:false,refused:true,error:'Finish waiting saves before the Commission.'};
    let acceptedAt;
    try {acceptedAt=api.boardFreeze(request);}catch(error){return {ok:false,refused:true,error:error.message};}
    boardWaiting=true;const result=continueBoard();
    return {...result,...(request.action==='start' && !result.ok ? {startedAt:acceptedAt} : {})};
  }

  let challengeWaiting = false;
  function challengeWrite(action) {
    const result = transaction(() => api.challengeCommit(action));
    if (!result.ok) hold('Auto-challenge waiting to save. Retry the exact command. ' + result.error);
    return result;
  }
  function continueChallenge() {
    try {
      if (!state().meta.automation?.challenge?.pending) {
        const baseline = wallet().saveAcknowledged();
        if (!baseline.ok) {hold('A11 wallet baseline waiting. ' + baseline.error); return baseline;}
        const prepared = challengeWrite('prepare'); if (!prepared.ok) return prepared;
      }
      const p = api.challengePending();
      if (p.action === 'sale') {
        const paid = wallet().creditReward({id:p.id,previous:p.previous,sequence:p.sequence,amount:p.pay});
        if (!paid.ok) {hold('A11 sale payment waiting. ' + paid.error); return paid;}
      }
      const result = challengeWrite('finish'); if (result.ok) challengeWaiting = false;
      return result;
    } catch(error) {hold(error.message); return {ok:false,error:error.message};}
  }
  function challengeAction(request) {
    if (!api?.challengeEnabled() || !owns() || busy || volatile || fault || transactionRetry || localUnresolved() ||
        folioWaiting || layerWaiting || pitchWaiting || mediaWaiting || estateWaiting || printingWaiting || masteryWaiting || challengeWaiting ||
        !window.IMI.ops.progression.running() || !guard(state()) || !object(request) ||
        !['settings','focus','sale','exit','abandon','continue'].includes(request.action) || Object.keys(request).some(k => !['action','fields','expected'].includes(k)) || request.action !== 'settings' && request.fields !== undefined) return {ok:false,refused:true,error:'Finish waiting saves before A11.'};
    try {api.challengeFreeze(request);} catch(error) {return {ok:false,refused:true,error:error.message};}
    challengeWaiting = true; return continueChallenge();
  }

  let masteryWaiting = false;
  function masteryWrite(action) {
    const result = transaction(() => api.masteryCommit(action));
    if (!result.ok) hold('Small Crew mastery waiting to save. Retry the exact command. ' + result.error);
    return result;
  }
  function continueMastery() {
    try {
      if (!state().meta.challengeMastery?.pending) {
        const baseline = wallet().saveAcknowledged();
        if (!baseline.ok) {hold('Mastery wallet baseline waiting. ' + baseline.error); return baseline;}
        const prepared = masteryWrite('prepare'); if (!prepared.ok) return prepared;
      }
      const p = api.masteryPending();
      if (p.action === 'sale') {
        const paid = wallet().creditReward({id:p.id,previous:p.previous,sequence:p.sequence,amount:p.pay});
        if (!paid.ok) {hold('Mastery payment waiting. Retry the exact sale. ' + paid.error);return paid;}
      }
      const result = masteryWrite('finish'); if (result.ok) masteryWaiting = false;
      return result;
    } catch(error) {hold(error.message); return {ok:false,error:error.message};}
  }
  function masteryAction(request) {
    if (!api?.masteryEnabled() || !owns() || busy || volatile || fault || transactionRetry || localUnresolved() ||
        folioWaiting || layerWaiting || pitchWaiting || mediaWaiting || estateWaiting || printingWaiting || !window.IMI.ops.progression.running() || !guard(state()) ||
        !object(request) || !['sale','abandon','qualify'].includes(request.action) || Object.keys(request).some(k => !['action','id'].includes(k))) return {ok:false,refused:true,error:'Finish waiting saves before mastery.'};
    try {api.masteryFreeze(request);} catch(error) {return {ok:false,refused:true,error:error.message};}
    masteryWaiting = true; return continueMastery();
  }

  let printingWaiting = false, printingWalletWriting = false;
  function printingWrite(action) {
    const r = transaction(() => api.printingCommit(action));
    if (!r.ok) {hold('Printing waiting to save. Retry the exact Printing. ' + r.error);return {...r,status:'held'};}
    return r;
  }
  function continuePrinting() {
    try {
      if (!state().meta.automation?.print?.pending) {
        const baseline = wallet().saveAcknowledged();
        if (!baseline.ok) {hold('Printing wallet baseline waiting to save. ' + baseline.error);return {...baseline,status:'held'};}
        const prepared = printingWrite('prepare');
        if (!prepared.ok) return prepared;
      }
      const p = api.printingPending();
      printingWalletWriting = true;
      let paid;
      try {paid = wallet().replacePrintingAcknowledged(p.id);} finally {printingWalletWriting = false;}
      if (!paid.ok) {hold('Printing wallet waiting to save. Retry the exact Printing. ' + paid.error);return {...paid,status:'held'};}
      const result = printingWrite('finish');
      if (result.ok) printingWaiting = false;
      return result;
    } catch(error) {hold(error.message);return {ok:false,status:'held',error:error.message};}
  }
  function printingAction(request) {
    if (!api?.printingEnabled() || !owns() || busy || volatile || fault || transactionRetry || localUnresolved() ||
        folioWaiting || layerWaiting || pitchWaiting || mediaWaiting || estateWaiting || !window.IMI.ops.progression.running() || !guard(state())) return {ok:false,status:'refused',refused:true,error:'Finish waiting saves before Printing.'};
    try {api.printingFreeze(request);} catch(error) {return {ok:false,status:'refused',refused:true,error:error.message};}
    printingWaiting = true;
    return continuePrinting();
  }
  function printingWallet(id) {
    if (!printingWalletWriting || !owns() || !api?.printingEnabled()) return null;
    const p = api.printingPending();
    return p.id === id ? {balance:p.balance,seed:p.seed} : null;
  }
  // Estate has fixed commands and its own Core bridge, never caller-provided wallet values.
  let estateWaiting = null, estateWalletWriting = false;
  function estateWrite(request) {
    const result = transaction(() => api.estateCommit(request));
    if (!result.ok && !result.refused) hold('Estate waiting to save. Retry to finish. ' + result.error);
    return result;
  }
  function finishEstate() {
    try {
      const p = window.Estate.pending(state());
      estateWalletWriting = true;
      let paid;
      try { paid = wallet().replaceEstateAcknowledged(p.id); } finally { estateWalletWriting = false; }
      if (!paid.ok) { hold('Estate wallet waiting to save. Retry to finish. ' + paid.error); return paid; }
      const result = estateWrite({action:'finish'});
      if (!result.ok) { if (result.refused) hold(result.error); return result; }
      estateWaiting = null;
      const c = state().rewards.claims['layer:estate:first'];
      if (c?.status === 'prepared' && !transaction(() => deliver('layer:estate:first',c))) return {ok:false,error:'Estate Letters waiting to save.'};
      return result;
    } catch(error) { hold(error.message); return {ok:false,error:error.message}; }
  }
  function continueEstate(request) {
    if (state().meta.estate?.pending) return finishEstate();
    const baseline = wallet().saveAcknowledged();
    if (!baseline.ok) { hold('Estate baseline waiting to save. ' + baseline.error); return baseline; }
    const result = estateWrite(request);
    return result.ok ? finishEstate() : result;
  }
  function estateAction(request) {
    if (!window.Estate?.enabled || !api || !owns() || busy || volatile || fault || transactionRetry || localUnresolved() ||
        folioWaiting || layerWaiting || pitchWaiting || mediaWaiting || !window.IMI.ops.progression.running() || !guard(state())) return {ok:false,error:'Finish the waiting save before using Estate.'};
    try {
      if (request.action !== 'reset' || !window.Layers.same(window.Estate.quote(state()),request.quote)) invalid('Estate changed. Review it again.');
      if (window.Archive?.enabled && !window.Estate.settleArchiveIncome()) return {ok:false,error:'Archive income waiting to save'};
      estateWaiting = clone(request);
      const result = continueEstate(estateWaiting);
      if (result.refused) estateWaiting = null;
      return result;
    } catch(error) {estateWaiting=null;return {ok:false,error:error.message};}
  }
  function estateWallet(id) {
    if (!estateWalletWriting || !owns() || !window.Estate?.enabled) return null;
    const p = window.Estate.pending(state());
    return p.id === id ? {seed:p.seed,balance:p.balance} : null;
  }
  // The only Archive payment is the fixed interval supplied by its actual Ops owner.
  let worksPlayWaiting = null;
  function worksPlayWrite(request) {
    const result=transaction(() => api.worksPlayCommit(request));
    if(!result.ok && !result.refused)hold('Works waiting to save. Retry the same action. ' + result.error);
    return result;
  }
  function worksPlayAction(request) {
    if(!window.WorksPlay?.enabled || !api || !owns() || busy || fault || volatile || transactionRetry || localUnresolved() ||
       !window.IMI.ops.progression.running() || !guard(state()))return {ok:false,error:'Finish waiting saves before using Works.'};
    try {
      if(!api.archiveSettle())return {ok:false,error:'Archive income waiting to save'};
      window.WorksPlay.proposal(state(),request);
      worksPlayWaiting=clone(request);
      const result=worksPlayWrite(worksPlayWaiting);
      if(result.ok || result.refused)worksPlayWaiting=null;
      return result;
    }catch(error){return {ok:false,error:error.message};}
  }
  let worksDemoWaiting = null;
  function worksDemoWrite(request) {
    const result=transaction(() => api.worksDemoCommit(request));
    if(!result.ok && !result.refused)hold('Works demo waiting to save. Retry the same action. ' + result.error);
    return result;
  }
  function worksDemoAction(request) {
    if(!window.WorksDemo?.enabled || !api || !owns() || busy || fault || volatile || transactionRetry || localUnresolved() ||
       !window.IMI.ops.progression.running() || !guard(state()))return {ok:false,error:'Finish waiting saves before using Works demo.'};
    try {
      if(!api.archiveSettle())return {ok:false,error:'Archive income waiting to save'};
      window.WorksDemo.proposal(state(),request);
      worksDemoWaiting=clone(request);
      const result=worksDemoWrite(worksDemoWaiting);
      if(result.ok || result.refused)worksDemoWaiting=null;
      return result;
    }catch(error){return {ok:false,error:error.message};}
  }
  let archiveWaiting = null, archiveIncomeWaiting = false;
  function archiveWrite(request) {
    const result = transaction(() => api.archiveCommit(request));
    if (!result.ok && !result.refused) hold('Archive waiting to save. Retry the same action. ' + result.error);
    return result;
  }
  function finishArchive() {
    try {
      const p = window.Archive.pending(state());
      if (p.credit) {
        const paid = wallet().creditReward(p.credit);
        if (!paid.ok) {hold('Archive income waiting for wallet acknowledgement. ' + paid.error);return paid;}
      }
      const result = archiveWrite({action:'incomeFinish'});
      if (result.ok) archiveIncomeWaiting = false;
      if (!result.ok) hold(result.error);
      return result;
    } catch(error) {hold(error.message);return {ok:false,error:error.message};}
  }
  function archiveIncome() {
    if (!window.Archive?.enabled || !api || !owns()) return {ok:false,error:'Archive income owner unavailable'};
    if (state().meta.archive === undefined) return {ok:true,empty:true};
    if (state().meta.archive.pending) return finishArchive();
    const fixedBoundary=localExecuting && state().prem.vault?.freeSpeed && state().rewards.awayCheckpoint?.phase==='archive' && VaultPlay.supported(state());
    if (fault || volatile || localUnresolved() && !fixedBoundary) return {ok:false,error:'Finish waiting recovery first'};
    const baseline = wallet().saveAcknowledged();
    if (!baseline.ok) {hold('Archive wallet baseline waiting to save. ' + baseline.error);return baseline;}
    archiveIncomeWaiting = true;
    const result = archiveWrite({action:'income'});
    if (result.empty) archiveIncomeWaiting = false;
    if (result.refused) hold(result.error);
    return result.ok && !result.empty ? finishArchive() : result;
  }
  function archiveAction(request) {
    if (!window.Archive?.enabled || !api || !owns() || busy || fault || volatile || transactionRetry || localUnresolved() ||
        !window.IMI.ops.progression.running() || !guard(state())) return {ok:false,error:'Finish waiting saves before using Archive.'};
    try {
      if (!api.archiveSettle()) return {ok:false,error:'Archive income waiting to save'};
      window.Archive.proposal(state(),request);
      archiveWaiting = clone(request);
      const result = archiveWrite(archiveWaiting);
      if (result.ok || result.refused) archiveWaiting = null;
      return result;
    } catch(error) {return {ok:false,error:error.message};}
  }
  let imprintChallengeWaiting = null;
  function finishImprintChallenge() {
    const result = transaction(() => api.imprintChallengeCommit(imprintChallengeWaiting));
    if (!result.ok) return hold('Challenge clear waiting to save. Retry keeps your progress. ' + result.error);
    imprintChallengeWaiting = null;
    return true;
  }
  function imprintChallengeClear(id) {
    if (!['handplanted','onebrief','paperonly','fixedcast'].includes(id) || !owns() || busy || fault || volatile || transactionRetry ||
        localUnresolved() || !window.IMI.ops.progression.running() || !guard(state())) return false;
    const c = state().challenge;
    if (c?.id !== id) return false;
    imprintChallengeWaiting = {id,...window.Layers.epochFields(state()),printing:state().printing,imprint:window.Layers.identity(state()),start:c.start,
      descriptor:state().chDone[id] || state().rewards.claims[`challenge:${id}:first`] ? null : descriptor(`challenge:${id}:first`,'new')};
    return finishImprintChallenge();
  }
  function deliver(id, claim) {
    validateDescriptor(id, claim.descriptor);
    const d = claim.descriptor;
    if (d.kind === 'C') {
      if (claim.printing !== state().printing) return hold('Cash Printing identity mismatch. Repair required.');
      const result = wallet().creditReward({ id, sequence:claim.sequence, previous:claim.previous, amount:d.amount });
      if (!result.ok) return hold('Reward delivery waiting to save. ' + result.error);
    }
    const next = clone(state()), r = next.rewards, p = next.prem;
    const receipt = r.claims[id] = { ...claim, status:'committed' };
    if (d.kind === 'C') {
      if (!claim.deltaApplied) {
        next.run.earned = (next.run.earned || 0) + d.amount;
        receipt.deltaApplied = true;
      }
    } else if (d.kind === 'L') {
      if (!next.desks[d.desk]?.owned) return hold('Locked reward desk is unavailable. Repair required.');
      const pool = next.desks[d.desk].letters, each = Math.floor(d.amount / 26), remainder = d.amount % 26;
      if (!object(pool)) return hold('Invalid locked letter pool. Repair required.');
      for (let i = 0; i < 26; i++) {
        const ch = String.fromCharCode(65 + i), previous = Object.hasOwn(pool, ch) ? pool[ch] : 0, delta = each + (i < remainder ? 1 : 0);
        if (!integer(previous) || !integer(previous + delta) || previous + delta - previous !== delta) return hold('Letter pool cannot represent this reward. Repair required.');
        pool[ch] = previous + delta;
      }
    } else if (d.kind === 'D') {
      if (Object.hasOwn(p.credits, id)) return hold('Diamond delivery already has a source without a claim. Repair required.');
      p.earned += d.amount; p.earnedTotal += d.amount;
      p.credits[id] = { source:'earned', amount:d.amount, origin:claim.origin };
    } else {
      if (Object.hasOwn(r.storedGold.tokens, id)) return hold('Gold delivery already has a source without a claim. Repair required.');
      r.storedGold.tokens[id] = { status:'stored', origin:claim.origin };
    }
    return persist(next);
  }
  function claim(id, origin = 'new') {
    const existing = state().rewards.claims[id];
    if (existing) return existing.status === 'prepared' ? deliver(id, existing) : true;
    if (!volatile) volatile = { id, origin, descriptor:descriptor(id, origin) };
    if (volatile.id !== id) return hold('Another reward is waiting to save.');
    const sample = volatile, d = sample.descriptor, next = clone(state());
    if (origin === 'historical' && d.kind !== 'D') {
      next.rewards.claims[id] = { status:'waived', origin, policy:'db-only' };
      if (!persist(next)) return false;
      volatile = null; return true;
    }
    const c = { status:'prepared', origin, descriptor:d };
    if (d.kind === 'C') {
      // The wallet baseline includes unrelated earnings. It is acknowledged before Ops preparation.
      const flush = wallet().saveAcknowledged();
      if (!flush.ok) return hold('Wallet baseline waiting to save. ' + flush.error);
      const marker = wallet().acknowledgement();
      c.previous = marker?.sequence || 0; c.sequence = c.previous + 1; c.printing = next.printing;
    }
    next.rewards.claims[id] = c;
    if (!persist(next)) return false;
    volatile = null;
    return deliver(id, c);
  }
  function reconcile() {
    window.Seasons?.validate(state());
    if (state().meta.seasons?.pending && !continueSeasons().ok) return false;
    window.Hall?.validate(state());
    if ((state().meta.hall?.claims?.[window.Hall?.id] !== undefined || state().rewards.storedGold.tokens[window.Hall?.id] !== undefined) && !goldSource(state(),Hall.id)) return hold('Inconsistent Hall claim/token source. Save preserved.');
    if (state().meta.commissionBoard?.pending && !continueBoard().ok) return false;
    if (state().meta.automation?.challenge?.pending && !continueChallenge().ok) return false;
    if (state().meta.challengeMastery?.pending && !continueMastery().ok) return false;
    if (state().meta.automation?.print?.pending && !continuePrinting().ok) return false;
    if (state().meta.archive?.pending && !finishArchive().ok) return false;
    if (state().meta.estate?.pending && !finishEstate().ok) return false;
    if (state().meta.automation?.media?.pending && !finishMedia().ok) return false;
    if (state().meta.automation?.pitch?.sale && !finishPitch().ok) return false;
    if (state().meta?.layers?.pending && !finishLayer().ok) return false;
    if (state().meta?.folio?.pending && !finishFolio().ok) return false;
    if (state().rewards.awayCheckpoint?.credit && !awayCredit()) return false;
    const loadedMarker = wallet().acknowledgement();
    if (loadedMarker != null && (!object(loadedMarker) || !integer(loadedMarker.sequence) || loadedMarker.sequence < 1 || typeof loadedMarker.id !== 'string' || !loadedMarker.id ||
        !integer(loadedMarker.amount) || !loadedMarker.amount || loadedMarker.amount % window.Economy.scale)) return hold('Invalid wallet reward marker. Repair required.');
    for (const [id, c] of Object.entries(state().rewards.claims)) {
      if (c.status === 'prepared' && knownSource(id) && !deliver(id, c)) return false;
      if (c.status === 'committed' && c.descriptor?.kind === 'D') {
        const credit = state().prem.credits[id];
        if (!credit || credit.source !== 'earned' || credit.amount !== c.descriptor.amount) return hold('Diamond source mismatch. Repair required.');
      }
      if (c.status === 'committed' && c.descriptor?.kind === 'G' && !state().rewards.storedGold.tokens[id]) return hold('Missing gold source receipt. Repair required.');
      if (c.status === 'committed' && c.descriptor?.kind === 'C') {
        if (!loadedMarker || loadedMarker.sequence < c.sequence) return hold('Committed cash has no wallet acknowledgement. Repair required.');
        if (!c.deltaApplied) {
          if (loadedMarker.id !== id || loadedMarker.sequence !== c.sequence || loadedMarker.amount !== c.descriptor.amount) return hold('Missing cash delta has an ambiguous wallet acknowledgement. Repair required.');
          if (!deliver(id, c)) return false;
        }
      }
    }
    const marker = wallet().acknowledgement();
    const head = state().rewards.walletHead;
    if (marker && !(head?.id === marker.id && head.sequence === marker.sequence && head.amount === marker.amount) && !window.Folio?.cashMarker(state(), marker) && !Object.values(state().rewards.claims).some(c => c.descriptor?.kind === 'C' &&
        c.sequence === marker.sequence && c.descriptor.amount === marker.amount &&
        state().rewards.claims[marker.id] === c)) return hold('Unexplained wallet reward marker. Repair required.');
    for (const id of eligible(state())) {
      if (state().rewards.claims[id]) continue;
      if (historical(state(), id)) { if (!claim(id, 'historical')) return false; continue; }
      const rule = row(id);
      if (rule.kind === 'L' || rule.kind === 'C') return hold('Missing locked sample: ' + id + '. Repair required.');
      // Fixed delivery can be reconstructed only from consistent source evidence.
      const credit = state().prem.credits[id], token = state().rewards.storedGold.tokens[id];
      if (credit || token) {
        const d = descriptor(id, 'recovered'), next = clone(state());
        if ((rule.kind === 'D' && credit?.source === 'earned' && credit.amount === d.amount && !token) ||
            (rule.kind === 'G' && token && ['stored','consumed'].includes(token.status) && !credit)) {
          next.rewards.claims[id] = { status:'committed', origin:'recovered', descriptor:d };
          if (!persist(next)) return false;
        } else return hold('Ambiguous reward source: ' + id + '. Repair required.');
      } else if (!claim(id, 'recovered')) return false;
    }
    return expandedInitialize() && fundingInitialize();
  }
  let fundingWaiting = null;
  function fundingFinish() {
    if (!fundingWaiting) return true;
    if (JSON.stringify(state()) !== fundingWaiting.source) return hold('Funding award source changed. Reload the acknowledged save.');
    if (!persist(fundingWaiting.candidate)) return false;
    fundingWaiting = null;
    return true;
  }
  function fundingInitialize() {
    if (!funding()?.enabled || state().meta.speedFundingAwards !== undefined) return true;
    if (!api.identitySettled() || localUnresolved()) return hold('Finish pending work before funding award history.');
    if (!fundingWaiting) {
      const next = clone(state()), historicalIds = [];
      next.meta.speedFundingAwards = {version:1,policy:funding().policy,historicalIds};
      for (const r of funding().rows) {
        const proof = funding().proof(r.id,next,api.masteryValidate);
        if (!proof || !api.expandedAccess(r.id)) continue;
        const id = 'award:'+r.id;
        if (next.rewards.claims[id] !== undefined || next.awards[r.id] !== undefined || next.prem.credits[id] !== undefined) invalid('Funding source already exists without its snapshot');
        historicalIds.push(r.id); next.awards[r.id] = true;
        next.rewards.claims[id] = {status:'prepared',origin:'historical',proof,descriptor:descriptor(id,'historical')};
      }
      fundingWaiting = {source:JSON.stringify(state()),candidate:next};
    }
    if (!fundingFinish()) return false;
    for (const r of funding().rows) {
      const id = 'award:'+r.id, c = state().rewards.claims[id];
      if (c?.status === 'prepared' && !deliver(id,c)) return false;
    }
    return true;
  }
  let expandedWaiting = null;
  function expandedFinish() {
    if (!expandedWaiting) return true;
    if (JSON.stringify(state()) !== expandedWaiting.source) return hold('Expanded award source changed. Reload the acknowledged save.');
    if (!persist(expandedWaiting.candidate)) return false;
    const id = expandedWaiting.id; expandedWaiting = null;
    return !id || deliver(id,state().rewards.claims[id]);
  }
  function expandedReady(id) {
    try { return funding()?.row(id) ? !!(funding().enabled && state().meta.speedFundingAwards && funding().proof(id,state(),api.masteryValidate)) : !!(expanded()?.enabled && state().meta.expandedAwards && expanded().proof(id,state(),api.expandedManual)); }
    catch (error) { return hold(error.message); }
  }
  function expandedInitialize() {
    if (!expanded()?.enabled || state().meta.expandedAwards !== undefined) return true;
    if (!api.identitySettled() || localUnresolved()) return hold('Finish pending work before expanded award history.');
    if (!expandedWaiting) {
      const next = clone(state()), historicalIds = [];
      next.meta.expandedAwards = {version:1,policy:expanded().policy,historicalIds};
      for (const r of expanded().rows) {
        const proof = expanded().proof(r.id,next,api.expandedManual);
        if (!proof || !api.expandedAccess(r.id)) continue;
        const id = 'award:'+r.id;
        historicalIds.push(r.id); next.awards[r.id] = true;
        next.rewards.claims[id] = r.kind === 'D' ? {status:'prepared',origin:'historical',proof,descriptor:descriptor(id,'historical')} :
          {status:'waived',origin:'historical',policy:expanded().policy,proof};
      }
      expandedWaiting = {source:JSON.stringify(state()),candidate:next};
    }
    if (!expandedFinish()) return false;
    for (const r of expanded().rows) {
      const id = 'award:'+r.id, c = state().rewards.claims[id];
      if (c?.status === 'prepared' && !deliver(id,c)) return false;
    }
    return true;
  }
  function expandedDiscover(id) {
    if (!owns() || !expanded()?.enabled || state().awards[id] || !api.expandedAccess(id) || !api.identitySettled()) return false;
    try {
      if (!state().meta.expandedAwards || funding()?.row(id) && (!funding().enabled || !state().meta.speedFundingAwards) || expandedWaiting || !guard(state())) return false;
      return transaction(() => {
        const proof = funding()?.row(id) ? funding().proof(id,state(),api.masteryValidate) : expanded().proof(id,state(),api.expandedManual);
        if (!proof) return false;
        const next = clone(state()), claimId = 'award:'+id;
        next.awards[id] = true;
        next.rewards.claims[claimId] = {status:'prepared',origin:'new',proof,descriptor:descriptor(claimId,'new')};
        expandedWaiting = {source:JSON.stringify(state()),candidate:next,id:claimId};
        return expandedFinish();
      });
    } catch (error) { return hold(error.message); }
  }
  function initialize(reason, extension) {
    api = extension;
    try {
      if (api.mediaEnabled?.() && !api.validMedia(state().meta.automation?.media)) invalid('Unsupported media configuration. Save preserved.');
      if (state().meta.automation?.media?.pending && !finishMedia().ok) return;
      if (state().meta.automation?.pitch?.sale) api.pitchSaleValidate();
      const next = normalize(clone(state()));
      if (!next.rewards.migration) {
        if (volatile?.migration) next.rewards.migration = volatile.migration;
        else {
          const migration = { version:1, policy:'db-only', oldAwardIds:reason === 'full-reset' ? [] : Object.keys(next.awards).filter(id => next.awards[id]),
            oldChallengeIds:reason === 'full-reset' ? [] : Object.keys(next.chDone).filter(id => next.chDone[id]), oldPrinting:reason === 'full-reset' ? 0 : next.printing };
          volatile = { migration }; next.rewards.migration = migration;
        }
        if (!persist(next)) return;
        volatile = null;
      } else normalize(state());
      if (reason !== 'printing' && !reconcile()) return;
      hallInitialize(reason);
    } catch (error) { hold(error.message + '. Repair required.'); }
  }
  function retry() {
    if (!owns() || busy) return false;
    busy = true; fault = null;
    try {
      if (fundingWaiting && !fundingFinish()) return false;
      if (expandedWaiting && !expandedFinish()) return false;
      if ((seasonsWaiting || state().meta.seasons?.pending) && !continueSeasons().ok) return false;
      if (hallWaiting && !hallFinish()) return false;
      if ((boardWaiting || state().meta.commissionBoard?.pending) && !continueBoard().ok) return false;
      if ((challengeWaiting || state().meta.automation?.challenge?.pending) && !continueChallenge().ok) return false;
      if ((masteryWaiting || state().meta.challengeMastery?.pending) && !continueMastery().ok) return false;
      if ((printingWaiting || state().meta.automation?.print?.pending) && !continuePrinting().ok) return false;
      if (worksPlayWaiting) {const r=worksPlayWrite(worksPlayWaiting);if(!r.ok && !r.refused)return false;worksPlayWaiting=null;}
      if (worksDemoWaiting) {const r=worksDemoWrite(worksDemoWaiting);if(!r.ok && !r.refused)return false;worksDemoWaiting=null;}
      if ((state().meta.archive?.pending || archiveIncomeWaiting) && !archiveIncome().ok) return false;
      if (archiveWaiting) {const result = archiveWrite(archiveWaiting);if(!result.ok && !result.refused)return false;archiveWaiting=null;}
      if (estateWaiting || state().meta.estate?.pending) { const result = continueEstate(estateWaiting); if (!result.ok) { if (!result.refused) return false; estateWaiting = null; } }
      if (imprintChallengeWaiting && !finishImprintChallenge()) return false;
      if (state().meta.automation?.media?.pending || mediaWaiting) { const result = continueMedia(); if (!result.ok) return false; mediaWaiting = null; }
      if (state().meta.automation?.pitch?.sale || pitchWaiting) { const result = continuePitch(pitchWaiting); if (!result.ok) return false; pitchWaiting = null; }
      if (layerWaiting) { const result = continueLayer(layerWaiting); if (!result.ok) { if (!result.refused) return false; layerWaiting = null; } }
      if (folioWaiting) { const result = continueFolio(folioWaiting); if (!result.ok) { if (!result.refused) return false; folioWaiting = null; } }

      if (!state().rewards.migration) initialize('load', api);
      else if (volatile?.id) claim(volatile.id, volatile.origin);
      else if (volatile?.activation) {
        const id = volatile.activation, next = clone(state());
        if (!goldSource(next,id) || next.rewards.storedGold.tokens[id]?.status !== 'stored' || next.rewards.activeGold) return hold('Activation receipt mismatch. Repair required.');
        next.rewards.storedGold.tokens[id] = { ...next.rewards.storedGold.tokens[id], status:'consumed', activationId:id };
        next.rewards.activeGold = { activationId:id, remainingGameMs:15000 };
        if (!persist(next)) return false;
        volatile = null;
      }
      if (!fault && !reconcile()) return false;
      if (!fault && !hallInitialize('load')) return false;
      if (fault) return false;
      if (pendingUI) {
        const next = clone(state()); pendingUI(next.rewards);
        if (!transaction(() => persist(next))) return false;
        pendingUI = null;
      }
      transactionRetry = null;
      if (!localIntent && lifetimeLease && window.VaultPlay?.enabled()) {
        localIntent = {id:'boundary:lamp-recovery',settle:api.vaultBoundary,build:p=>p,continue:()=>{}};
      }
      if (localIntent) {
        if (!continueLocal()) return false;
        dismissStatus(); window.IMI.ops.progression.resume();
        return true;
      }
      dismissStatus();
      window.IMI.ops.progression.resume();
      api.rewardContinue();
      return true;
    } catch (error) { return hold(error.message + '. Repair required.'); }
    finally { busy = false; }
  }
  function activate() {
    if (!api || !owns() || !window.IMI.ops.progression.running() || state().rewards.activeGold ||
        api.nativeRush()) return false;
    const id = Object.keys(state().rewards.storedGold.tokens).find(id => goldSource(state(),id) && state().rewards.storedGold.tokens[id].status === 'stored');
    if (!id) return false;
    const next = clone(state()), token = next.rewards.storedGold.tokens[id];
    token.status = 'consumed'; token.activationId = id;
    next.rewards.activeGold = { activationId:id, remainingGameMs:15000 };
    if (!transaction(() => persist(next))) { volatile = { activation:id }; return false; }
    return true;
  }
  // Income integration leaves the original letter/keeper batches intact.
  function incomeSeconds(seconds, nativeRushMs = 0, criticMs = 0) {
    const remaining = (state().rewards.activeGold?.remainingGameMs || 0) / 1000;
    const rush = Math.min(seconds, Math.max(remaining, nativeRushMs / 1000)), critic = Math.min(seconds, criticMs / 1000);
    return seconds + 6 * rush - .5 * critic - 3 * Math.min(rush, critic);
  }
  function consumeGold(milliseconds) {
    const active = state().rewards.activeGold;
    if (!active) return;
    active.remainingGameMs = Math.max(0, active.remainingGameMs - milliseconds);
    if (!active.remainingGameMs) state().rewards.activeGold = null;
  }
  // The current away checkpoint journals its next wallet payment, not a new reward.
  // One acknowledged head receipt suffices once the enclosing checkpoint finishes.
  const awayCredit = (amount, nextPhase) => transaction(() => checkpointPayment(amount, nextPhase));
  function checkpointPayment(amount, nextPhase) {
    const cp = state().rewards.awayCheckpoint;
    if (!cp) return hold('Missing away payment checkpoint. Repair required.');
    if (!cp.credit) {
      if (!integer(amount) || !amount || amount % window.Economy.scale) return hold('Invalid away payment. Repair required.');
      const previous = wallet().acknowledgement()?.sequence || 0;
      cp.credit = { id:'away:' + cp.nowMs + ':' + (previous + 1), previous, sequence:previous + 1,
        amount, nextPhase, printing:state().printing };
    }
    // Retain the caller's payment and continuation before any fallible write.
    // Until Ops preparation succeeds this is volatile; reload uses the last saved cursor.
    const baseline = wallet().saveAcknowledged();
    if (!baseline.ok) return hold('Away wallet baseline waiting to save. ' + baseline.error);
    // Also re-acknowledge a same-process candidate whose first prepare write failed.
    if (!persist(clone(state()))) return false;
    const credit = state().rewards.awayCheckpoint.credit;
    if (!integer(credit.amount) || !credit.amount || credit.amount % window.Economy.scale ||
        !integer(credit.previous) || credit.sequence !== credit.previous + 1 || credit.printing !== state().printing ||
        typeof credit.id !== 'string' || typeof credit.nextPhase !== 'string') return hold('Invalid away payment receipt. Repair required.');
    const paid = wallet().creditReward(credit);
    if (!paid.ok) return hold('Away payment waiting to save. ' + paid.error);
    const next = clone(state());
    next.run.earned = (next.run.earned || 0) + credit.amount;
    next.rewards.walletHead = { id:credit.id, sequence:credit.sequence, amount:credit.amount, origin:'away' };
    next.rewards.awayCheckpoint.phase = credit.nextPhase;
    next.rewards.awayCheckpoint.credit = null;
    return persist(next);
  }
  // Goal policy stays private. Ops supplies current facts, never achievement predicates.
  const goalMetadata = {};
  function goalsGroup(ids, family, chain, metric, targets, destination, reach, printing = false) {
    ids.split(' ').forEach((id,i) => { goalMetadata[id] = { family, chain, metric, target:targets[i], destination, reach, printing }; });
  }
  goalsGroup('l100 l1k l10k l100k','typing','letters','letters',[100,1000,10000,100000],'floor','letters');
  goalsGroup('c10 c50 c100 c200','typing','streak','streak',[10,50,100,200],'floor','typing');
  goalsGroup('w10 w100 w1k keep','typing','words','words',[10,100,1000,25],'lab','words');
  goalsGroup('s1 s4 s8 s12','publishing','sales','sold',[1,4,8,12],'press','sold',true);
  goalsGroup('s16','publishing','sales','authored',['authored'],'press','authored',true);
  goalsGroup('k10 k50 k300','publishing','kids','kids',[10,50,'kids'],'press','kids',true);
  goalsGroup('m25 m150 m900','publishing','library','library',[25,150,'library'],'press','library',true);
  goalsGroup('d1 d2 d3 d4 d5','room','desks',null,[1,2,3,4,5],'shop','desks');
  goalsGroup('p8 p20 p40','room','crew','crew',[8,20,40],'training','crew',true);
  goalsGroup('b10k b1m b1b','room','wallet','wallet',[250000,25000000,25000000000],'press','sold',true);
  goalsGroup('lv5 lv10','typing','level','level',[5,10],'training','level',true);
  goalsGroup('hat1','typing','hat',null,[1],'training','hat');
  goalsGroup('hold','room','hold',null,[1],'shop','typing');
  goalsGroup('lamp3','room','lamp','lamp',[3],'shop','level',true);
  goalsGroup('mk1 mk3','room','restoration','restoration',[1,2],'shop','restoration',true);
  goalsGroup('p1','publishing','pitches','pitched',[1],'press','pitch');
  goalsGroup('p10 p50','publishing','pitches','pitchSold',[10,50],'press','pitch');
  goalsGroup('dv1 dv100','room','media','releases',[1,100],'studios','media',true);
  goalsGroup('dv5','room','media','divisions',[5],'studios','allDivisions',true);
  goalsGroup('dvall','room','catalogue',null,[1],'studios','catalogue');
  goalsGroup('mu1','room','muses','muses',[1],'muses','muse',true);
  goalsGroup('mu3','room','muses','seats',[3],'muses','seats',true);
  goalsGroup('gar1 gar500','typing','garden','harvested',[1,500],'lab','garden');
  goalsGroup('pr1 pr3','room','printing','printing',[1,3],'legacy','printing');
  goalsGroup('ch1 ch4','room','challenges','challenges',[1,'challenges'],'legacy','challenge');
  goalsGroup('deal','publishing','deals','deals',['deals'],'shop','deal',true);
  goalsGroup('roy100','publishing','royalties','royalties',[2500],'press','sold');
  const escape = value => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const exact = n => window.Economy.exact(n);
  let pendingUI = null, goalHost, notice, announced = '';
  function canDisplayAct() { return api && owns() && !busy && !writing && !fault && !volatile && !transactionRetry; }
  function amountText(d) {
    if (d.kind === 'L') return exact(d.amount) + ' balanced letters on ' + api.rewardDeskName(d.desk);
    if (d.kind === 'C') return exact(d.amount) + ' bananas';
    if (d.kind === 'D') return d.amount + ' Diamond Bananas';
    return '1 stored Royalty Rush token: x7 royalties and division income for 15 game seconds';
  }
  function rewardText(id) {
    const claim = state().rewards.claims['award:' + id];
    if (claim?.status === 'waived') return 'Earned before rewards were added. +1% income.';
    if (claim?.status === 'committed') return 'Reward saved: ' + amountText(claim.descriptor) + '. ' +
      (claim.origin === 'historical' ? 'Historical backfill. ' : claim.origin === 'recovered' ? 'Recovered receipt. ' : '') + '+1% income.';
    if (claim?.status === 'prepared') return 'Reward waiting for delivery: ' + amountText(claim.descriptor) + '. Preparation saved; delivery waiting to save. +1% income.';
    if (state().awards[id]) return 'Progress not saved. Reward waiting to save. +1% income.';
    const d = descriptor('award:' + id,'new');
    return (d.kind === 'L' || d.kind === 'C' ? 'Reward now: ' + amountText(d) + '. Scales with your production. Amount set when earned; saved on commit.' :
      'Reward: ' + amountText(d) + '.') + ' +1% income.';
  }
  /* a reward is shown as a picture and a number; the full sentence stays in the tooltip and for screen readers */
  const rewardChip = d => d.kind === 'D' ? (window.Gems?.amount('dbn', d.amount) || d.amount) : d.kind === 'C' ? (window.Gems?.amount('ban', window.Economy.fmt(d.amount)) || escape(amountText(d))) :
    d.kind === 'L' ? '<span class="gem-amt"><b>' + escape(exact(d.amount)) + ' letters</b></span>' : '<span class="gem-amt"><b>x7 Rush</b></span>';
  const rewardLine = id => {
    const claim = state().rewards.claims['award:' + id], tip = escape(rewardText(id));
    let body;
    if (claim?.status === 'waived' || !claim && state().awards[id]) body = '+1%';
    else if (claim?.status === 'committed') body = '✓ ' + rewardChip(claim.descriptor) + ' · +1%';
    else if (claim?.status === 'prepared') body = '⏳ ' + rewardChip(claim.descriptor) + ' · +1%';
    else body = rewardChip(descriptor('award:' + id, 'new')) + ' · +1%';
    return '<small class="o-reward-line" title="' + tip + '" aria-label="' + tip + '">' + body + '</small>';
  };
  const gemify = html => html.replace(/(\d[\d,]*) Diamond Bananas/g, (m, n) => window.Gems?.amount('dbn', n) || m);
  const expandedDestination = id => ({'lg10-folio-trio':'press','lg10-room-quartet':'legacy','lg10-two-stamps':'imprints','lg10-mixed-shelf':'imprints','lg10-imprint-quartet':'legacy','lg10-manual-pair':'lab','lg10-manual-quartet':'muses','lg10-estate-two':'estate','lg10-archive-pair':'archive','lg10-works-ten':'works-play','lg02e-stamps-four':'imprints','lg02e-stamps-six':'imprints','lg02e-estate-three':'estate','lg02e-archive-three':'archive','lg02e-manual-gold':'legacy','lg02e-works-quarter':'works-play','lg02e-works-half':'works-play'})[id];
  const fundingChains = [['lg10-two-stamps','lg02e-stamps-four','lg02e-stamps-six'],['lg10-works-ten','lg02e-works-quarter','lg02e-works-half']];
  const awardChain = id => funding()?.enabled && fundingChains.find(ids => ids.includes(id))?.[0] || (id.startsWith('lg10-manual-') ? 'expanded-manual' : id);
  function candidates(facts) {
    return api.goalAwards().flatMap(award => {
      const r = expandedRow('award:'+award.id);
      const g = r ? {family:'room',chain:awardChain(award.id),metric:null,target:1,destination:expandedDestination(award.id),reach:null} : goalMetadata[award.id];
      if (!g || state().awards[award.id] || ['committed','waived'].includes(state().rewards.claims['award:' + award.id]?.status)) return [];
      if (r && (!api.expandedAccess(award.id) || ['lg10-archive-pair','lg02e-archive-three'].includes(award.id) || funding()?.enabled && fundingChains.some(ids => ids.includes(award.id) && ids.find(id => !state().awards[id]) !== award.id) || award.id === 'lg10-manual-quartet' && !state().awards['lg10-manual-pair'])) return [];
      const reachable = r ? true : g.reach === 'desks' ? facts.reachable.desks[g.target] : facts.reachable[g.reach];
      const target = typeof g.target === 'string' ? facts.totals[g.target] : g.target;
      if (!facts.visible[g.destination] || !reachable || !(target > 0)) return [];
      if (Object.hasOwn(facts.capacity,g.metric) && target > facts.capacity[g.metric]) return [];
      return [{ ...award, ...g, target, progress:g.metric ? Math.min(target,Math.max(0,facts.metrics[g.metric] || 0)) : null }];
    });
  }
  function selectGoals(facts) {
    const list = candidates(facts), existing = state().rewards.goals?.ids || [];
    const ids = Array.from({length:3}, (_,i) => list.some(g => g.id === existing[i]) ? existing[i] : null);
    const choose = family => {
      const chains = new Set(ids.filter(Boolean).map(id => (goalMetadata[id]?.chain || awardChain(id))));
      const choices = list.filter(g => !chains.has(g.chain) && (!family || g.family === family) &&
        !list.some(next => next.chain === g.chain && (next.target < g.target || next.target === g.target && next.order < g.order)));
      choices.sort((a,b) => Number(b.destination === facts.currentTab) - Number(a.destination === facts.currentTab) || a.order - b.order || a.id.localeCompare(b.id));
      return choices[0]?.id || null;
    };
    for (let i=0;i<3;i++) if (!ids[i]) ids[i] = choose(['typing','publishing','room'][i]) || choose();
    return ids.filter(Boolean);
  }
  function saveUI(update) {
    if (!canDisplayAct()) return false;
    const next = clone(state());
    update(next.rewards);
    pendingUI = update;
    const ok = transaction(() => persist(next));
    if (ok) pendingUI = null;
    return ok;
  }
  function refreshGoals() {
    if (!canDisplayAct()) return;
    const facts = api.goalFacts(), previous = state().rewards.goals;
    if (!facts.revealed && !previous?.revealed) return;
    const ids = selectGoals(facts);
    if (previous?.revealed && JSON.stringify(ids) === JSON.stringify(previous.ids)) return;
    saveUI(r => { r.goals = { ...r.goals, version:1, revealed:true, ids }; });
  }
  function selectedGoals() {
    const facts = api.goalFacts(), list = candidates(facts);
    return (state().rewards.goals?.ids || []).map(id => list.find(g => g.id === id)).filter(Boolean);
  }
  const progressText = g => g.progress === null ? '' : exact(g.progress) + '/' + exact(g.target);
  function actionText(g) {
    return g.desc.replace(/your first title/, '1 title').replace(/your first manuscript/, '1 manuscript').replace(/Employ/, 'Hire').replace(/1,000/, '1K').replace(/10,000/, '10K').replace(/100,000/, '100K');
  }
  const summary = g => g.name + ': ' + g.desc + (g.printing ? ' this Printing' : '') + '. ' + progressText(g) + '. ' + rewardText(g.id);
  function historicalSummary() {
    const receipts = Object.values(state().rewards.claims).filter(c => c.origin === 'historical');
    const diamonds = receipts.reduce((n,c) => n + (c.status === 'committed' && c.descriptor?.kind === 'D' ? c.descriptor.amount : 0),0);
    const waived = receipts.filter(c => c.status === 'waived').length;
    return receipts.length ? 'Earlier progress: ' + diamonds + ' Diamond Bananas saved · ' + waived + ' waived · awards keep +1% each' : '';
  }
  function awardsHeader() {
    const goals = selectedGoals(), complete = api.rewardAwards().every(a => state().awards[a.id]);
    const r = state().rewards, count = Object.entries(r.storedGold.tokens).filter(([id,t]) => t.status === 'stored' && goldSource(state(),id)).length;
    const active = r.activeGold?.remainingGameMs > 0, unavailable = !canDisplayAct() || active || api.nativeRush() || !count;
    const history = !r.summaryAcknowledged && state().intro.done && !document.querySelector('.o-modal, .o-celebrate') ? historicalSummary() : '';
    const diamonds = state().prem.earned + state().prem.bought;
    return '<section class="o-goal-full" aria-label="Award goals">' + (complete ? '<p>All ' + api.rewardAwards().length + ' awards earned</p>' : goals.map(g =>
      '<button type="button" class="o-goal-row" data-act="rewards:goal" data-id="' + g.id + '"><b>' + escape(g.name) + '</b><span>' + escape(g.desc + (g.printing ? ' · this Printing' : '') + ' ' + progressText(g)) + '</span><span class="o-goal-bar"><i style="width:' + (g.progress === null || !(g.target > 0) ? 0 : Math.max(0, Math.min(100, 100 * g.progress / g.target))).toFixed(1) + '%"></i></span>' + rewardLine(g.id) + '</button>').join('') +
      (goals.length < 3 ? '<p>More goals as your room grows</p>' : '')) + '</section>' +
      '<section class="o-reward-inventory" aria-label="Stored rewards">' + (diamonds >= 1 ? '<p class="o-reward-wallet" aria-label="' + diamonds + ' Diamond Bananas">' + (window.Gems?.amount('dbn', diamonds, 'big') || diamonds + ' Diamond Bananas') + '</p>' : '') +
      (count || active ? '<button type="button" class="o-goal-row" data-act="rewards:activate" ' + (unavailable ? 'disabled' : '') + '>Royalty Rush · ' + count + ' stored · x7 · 15s' +
      (active ? ' · Active' : api.nativeRush() ? ' · Native rush active' : !count ? ' · No stored tokens' : !canDisplayAct() ? ' · Waiting to save' : ' · Activate one') + '</button>' : '') + '</section>' +
      (history ? '<div class="o-reward-history"><p>' + gemify(escape(history)) + '</p><button type="button" class="o-goal-row" data-act="rewards:acknowledge">Dismiss summary</button></div>' : '');
  }
  function afterRender() {
    refreshGoals();
    goalHost ??= document.getElementById('oGoals'); notice ??= document.getElementById('oGoalNotice');
    if (!goalHost) return;
    const goals = selectedGoals(), revealed = !!state().rewards.goals?.revealed;
    goalHost.hidden = !revealed || !goals.length;
    document.getElementById('opsRoot').classList.toggle('has-goals',revealed && goals.length > 0);
    const disabled = !canDisplayAct() ? ' disabled' : '';
    /* A small Goals tag over the room: three pips show how close each goal is, and a tap drops the list down. */
    const frac = g => g.progress === null || !(g.target > 0) ? 0 : Math.max(0, Math.min(1, g.progress / g.target));
    const line = g => '<span class="o-goal-line"><span>' + escape(actionText(g)) + '</span><span>' + escape(progressText(g)) + '</span></span><span class="o-goal-bar' + (frac(g) >= .9 && frac(g) < 1 ? ' near' : '') + '"><i style="width:' + (frac(g) * 100).toFixed(1) + '%"></i></span>';
    const open = goalHost.classList.contains('open');
    api.morph(goalHost, '<button type="button" class="o-goals-toggle' + (goals.some(g => frac(g) >= .9 && frac(g) < 1) ? ' near' : '') + '" data-act="rewards:goals" aria-expanded="' + open + '" aria-label="Goals" aria-description="' + escape(goals.map(summary).join(' ')) + '"><b>Goals</b><span class="o-goal-pips" aria-hidden="true">' +
      goals.map(g => '<i class="' + (frac(g) >= 1 ? 'full' : '') + '" style="--f:' + frac(g).toFixed(3) + '"></i>').join('') + '</span><span class="o-goal-caret" aria-hidden="true"></span></button><div class="o-goals-list"' + (open ? '' : ' hidden') + '>' +
      goals.map(g => '<button type="button" class="o-goal-item" data-act="rewards:goal" data-id="' + g.id + '" aria-description="' + escape(summary(g)) + '"' + disabled + '>' + line(g) + '</button>').join('') +
      (goals.length < 3 ? '<span class="o-goal-more">More goals as your room grows</span>' : '') + '</div>');
    const identity = goals.map(g => g.id).join('|');
    if (identity !== announced) { if (notice && announced) notice.textContent = 'Award goals updated. ' + goals.map(g => g.name).join(', '); announced = identity; }
  }
  (window.__OPS_EXTENSIONS ??= []).push(['rewards', {
    init:(reason, extension) => transaction(() => initialize(reason, extension)),
    award(event, extension) { api = extension; try { transaction(() => claim('award:' + event.id)); } catch (error) { hold(error.message); } },
    challenge(event, extension) { api = extension; if (event.first) { try { transaction(() => claim('challenge:' + event.id + ':first')); } catch (error) { hold(error.message); } } },
    reset(event, extension) {
      api = extension;
      if (event.kind === 'printing') {
        state().rewards.activeGold = null;
        if (event.previousPrinting === 0) { try { transaction(() => claim('layer:printing:first')); } catch (error) { hold(error.message); } }
      }
    },
    afterRender,
    vaultClosed:() => { if(lifetimeLease) {api.lampRelease(lifetimeLease); lifetimeLease=null;} },
    actions:{ activate:() => activate(), goal:el => { if (canDisplayAct()) { goalHost?.classList.remove('open'); api.openAward(el.dataset.id); } },
      goals:() => { goalHost?.classList.toggle('open'); afterRender(); },
      acknowledge:() => { if (canDisplayAct()) saveUI(r => { r.summaryAcknowledged = true; }); } }
  }]);
  return Object.freeze({ enabled, owns, start, timers, onPagehide: callback => finalizers.push(callback),
    onStatusPresentation: callback => { statusPresentation = callback; presentStatus(); },
    guard, retry, expandedReady, expandedDiscover, hallAction, seasonsAction, boardAction, challengeAction, masteryAction, printingAction, printingWallet, worksPlayAction, worksDemoAction, archiveAction, archiveIncome, estateAction, estateWallet, imprintChallengeClear, activate, incomeSeconds, consumeGold, awayCredit, folioAction, layerAction, layerWallet, pitchSale, mediaRelease, mediaWallet,
    estateReward:basis => descriptor('layer:estate:first','new',basis),
    validateEstateReward:d => {validateDescriptor('layer:estate:first',d);if(d.kind !== 'L' || d.desk !== 0 || d.origin !== 'new') invalid('Invalid Estate Letters');},
    layerReward:basis => descriptor('layer:imprint:first','new',basis), transacting:() => writing,
    lampAction, lampReview, lampUndoable, lampStartup,
    runLocalTransaction, localDisposition, boundaryProgressing:() => !!localIntent && localExecuting,
    boundaryFailure:message => localIntent ? hold(message) : false,
    checkpoint:() => { try { return persist(clone(state())); } catch (error) { return hold(error.message + '. Repair required.'); } },
    checkpointFailure:() => hold('Invalid away checkpoint. Repair required.'),
    resetFailure:() => hold('Reset wallet could not save. Retry before resetting again.'),
    held:() => !!transactionRetry, rewardLine, awardsHeader });
})();
