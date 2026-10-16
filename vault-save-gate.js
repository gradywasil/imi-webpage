/* Stable cold recognition only. Absence is not writer ownership. */
window.VaultSaveGate = (() => {
  'use strict';
  const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
  let lamp = false, speed = false, hall = false, seasons = false, awards = false, funding = false;
  let blocked = false, resume = false, imprint = false, printing = false, mastery = false, challenge = false, board = false, estate = false, archive = false, pitch = false, media = false;
  try {
    const raw = localStorage.getItem('imi-ops-v1');
    if (raw !== null) {
      const state = JSON.parse(raw);
      const layers = object(state) && object(state.meta) && state.meta.layers;
      if (object(layers) && own(layers, 'pending') && layers.pending !== null) {
        imprint = true;
        const flags = new URLSearchParams(location.search);
        // Recognize the intent envelope only; Layers owns validation and recovery.
        const known = layers.version === 1 && object(layers.pending) &&
          typeof layers.pending.id === 'string' && layers.pending.id.startsWith('imprint:') &&
          object(layers.pending.candidate) && layers.pending.candidate.meta?.layers?.version === 1;
        resume = known && ['lg01a', 'lg05folio', 'lg05layers'].some(flag => flags.get(flag) !== '1');
        blocked = !known || resume;
      }
      const catalogue = window.AwardsCatalogue;
      const expandedRecord = state.meta?.expandedAwards;
      const newKey = id => id.startsWith('lg10-') || id.startsWith('award:lg10-');
      const expandedKeys = [state.awards,state.rewards?.claims,state.prem?.credits,state.rewards?.storedGold?.tokens].flatMap(x => Object.keys(x || {}).filter(newKey));
      if (typeof state.rewards?.activeGold?.activationId === 'string' && newKey(state.rewards.activeGold.activationId)) expandedKeys.push(state.rewards.activeGold.activationId);
      if (expandedRecord !== undefined || expandedKeys.length) {
        awards = true;
        const known = catalogue && object(expandedRecord) && expandedRecord.version === 1 && expandedRecord.policy === catalogue.policy &&
          Array.isArray(expandedRecord.historicalIds) && new Set(expandedRecord.historicalIds).size === expandedRecord.historicalIds.length &&
          expandedRecord.historicalIds.every(id => catalogue.row(id)) && expandedKeys.every(id => catalogue.row(id.replace(/^award:/,'')));
        const missing = known && !catalogue.enabled;
        resume = resume || missing; blocked = blocked || !known || missing;
      }
      const fundingRecord = state.meta?.speedFundingAwards;
      const fundingKey = id => id.startsWith('lg02e-') || id.startsWith('award:lg02e-');
      const fundingMaps = [state.awards,state.rewards?.claims,state.prem?.credits,state.rewards?.storedGold?.tokens];
      const fundingKeys = fundingMaps.flatMap(x => Object.keys(x || {}).filter(fundingKey));
      const fundingActivation = state.rewards?.activeGold?.activationId;
      if (typeof fundingActivation === 'string' && fundingKey(fundingActivation)) fundingKeys.push(fundingActivation);
      if (fundingRecord !== undefined || fundingKeys.length) {
        funding = awards = true;
        const f = catalogue?.funding;
        const known = f && object(fundingRecord) && fundingRecord.version === 1 && fundingRecord.policy === f.policy &&
          Array.isArray(fundingRecord.historicalIds) && new Set(fundingRecord.historicalIds).size === fundingRecord.historicalIds.length &&
          fundingRecord.historicalIds.every(id => f.row(id)) && fundingKeys.every(id => f.row(id.replace(/^award:/,''))) &&
          !fundingMaps.some((x,i) => Object.keys(x || {}).some(id => fundingKey(id) && (i === 0 ? id.startsWith('award:') : !id.startsWith('award:')))) &&
          !Object.keys(state.rewards?.storedGold?.tokens || {}).some(fundingKey) && !(typeof fundingActivation === 'string' && fundingKey(fundingActivation));
        const missing = known && !f.enabled;
        resume = resume || missing; blocked = blocked || !known || missing;
      }
      const seasonsRecord = object(state) && state.meta?.seasons;
      if (seasonsRecord !== undefined || state.rewards?.walletHead?.origin === 'seasons-claim') {
        seasons = true;
        const c=seasonsRecord, p=c?.pending;
        const known=object(c) && c.version === 1 && c.rule === 1 && c.access === true &&
          ['sequence','lastObservedAt'].every(k=>Number.isSafeInteger(c[k]) && c[k]>=0) &&
          (c.highestSuccessWeek === null || Number.isSafeInteger(c.highestSuccessWeek) && c.highestSuccessWeek>=0) &&
          (c.active == null || object(c.active) && c.active.id === `seasons:${c.sequence}` && ['active','complete'].includes(c.active.status) &&
            ['typewriter','word-bank'].includes(c.active.theme) && object(c.active.descriptor) && c.active.descriptor.version === 1) &&
          (c.lastClaim == null || object(c.lastClaim) && c.lastClaim.origin === 'seasons-claim' && object(c.lastClaim.descriptor)) &&
          (p == null || object(p) && p.version === 1 && ['participate','observe','leave','expire','claim'].includes(p.action) && typeof p.source === 'string');
        const flags=new URLSearchParams(location.search), missing=known && ['lg09seasons','lg01a'].some(k=>flags.get(k)!=='1');
        resume=resume||missing; blocked=blocked||!known||missing;
      }
      const hallRecord = object(state) && state.meta?.hall;
      const hallId = 'hall:athletic-five:first';
      const hallToken = state.rewards?.storedGold?.tokens?.[hallId];
      if (hallRecord !== undefined || hallToken !== undefined) {
        hall = true;
        const known = object(hallRecord) && hallRecord.version === 1 && hallRecord.backfillPolicy === 1 &&
          ['historical','discovered','claims'].every(k => object(hallRecord[k])) &&
          (hallRecord.claims[hallId] === undefined || object(hallRecord.claims[hallId]) && hallRecord.claims[hallId].version === 1 && hallRecord.claims[hallId].rule === 1 && hallRecord.claims[hallId].status === 'committed') &&
          (hallToken === undefined || object(hallToken) && ['stored','consumed'].includes(hallToken.status));
        const flags = new URLSearchParams(location.search), missing = known && ['lg09hall','lg01a'].some(k => flags.get(k) !== '1');
        resume = resume || missing; blocked = blocked || !known || missing;
      }
      const boardRecord = object(state) && state.meta?.commissionBoard;
      if (boardRecord !== undefined) {
        const known = object(boardRecord) && boardRecord.version === 1 && boardRecord.access === true &&
          ['sequence','lastObservedAt'].every(k => Number.isSafeInteger(boardRecord[k]) && boardRecord[k] >= 0) &&
          (boardRecord.highestSuccessDay === null || Number.isSafeInteger(boardRecord.highestSuccessDay) && boardRecord.highestSuccessDay >= 0) &&
          (boardRecord.active == null || object(boardRecord.active) && boardRecord.active.id === `board:${boardRecord.sequence}` &&
            ['active','complete'].includes(boardRecord.active.status) && object(boardRecord.active.descriptor) && boardRecord.active.descriptor.version === 1 &&
            Number.isSafeInteger(boardRecord.active.startedAt) && Number.isSafeInteger(boardRecord.active.expiresAt) &&
            boardRecord.active.expiresAt === boardRecord.active.startedAt + 600000);
        if (!known || boardRecord.pending != null) {
          board = true;
          const p=boardRecord?.pending, flags=new URLSearchParams(location.search);
          const envelope=known && object(p) && p.version===1 && ['start','abandon','expire','sale','claim'].includes(p.action) && typeof p.source==='string';
          const missing=envelope && ['lg09board','lg01a'].some(k=>flags.get(k)!=='1');
          resume=resume||missing;blocked=blocked||!envelope||missing;
        }
      }
      const print = object(state) && state.meta?.automation?.print;
      if (object(print) && own(print,'pending') && print.pending !== null) {
        printing = true;
        const p = print.pending, flags = new URLSearchParams(location.search);
        // Envelope only. Ops validates the fixed source, frozen crew and exact successor.
        const known = print.version === 1 && object(p) && (p.version === 1 && ['manual','auto'].includes(p.origin) || p.version === 2 && p.origin === 'mastery' && p.selection?.version === 1 && p.selection.mode === 'smallcrew-mastery' || p.version === 3 && p.origin === 'auto-challenge' && p.selection?.version === 1 && p.selection.mode === 'smallcrew-auto') && (p.origin !== 'auto' || object(p.decision) && p.decision.version === 1 && p.decision.seconds === 300 && typeof p.decision.config === 'string') &&
          typeof p.id === 'string' && p.id.startsWith('printing:') && object(p.quote) && object(p.candidate) &&
          p.candidate.meta?.automation?.print?.version === 1 && Array.isArray(p.crew) && typeof p.source === 'string' &&
          ['balance','seed','at'].every(k => Number.isSafeInteger(p[k]) && p[k] >= 0) && own(p,'sourcePrint') && own(p,'marker');
        if (p.origin === 'mastery') mastery = true;
        if (p.origin === 'auto-challenge') challenge = true;
        const needsFlags = known && [...(challenge ? ['lg08challenge','lg08mastery'] : mastery ? ['lg08mastery'] : []),'lg08print','lg03','lg01a','lg05folio','lg05layers','lg08estate'].some(k => flags.get(k) !== '1');
        resume = resume || needsFlags; blocked = blocked || !known || needsFlags;
      }
      const c = object(state) && state.meta?.automation?.challenge;
      if (state.challenge?.a11 && c === undefined) {challenge = true; blocked = true;}
      if (c !== undefined) {
        const known = object(c) && c.version === 1 && Number.isSafeInteger(c.sequence) && c.sequence >= 0;
        if (!known || c.active != null || c.pending != null) {
          challenge = true;
          const p = c?.pending, r = c?.active, flags = new URLSearchParams(location.search);
          const envelope = known && (r == null || object(r) && r.version === 1 && r.rule === 1 && r.origin === 'auto-challenge' && typeof r.id === 'string' && Array.isArray(r.sold)) &&
            (p == null || object(p) && p.version === 1 && ['settings','focus','sale','exit','abandon','continue'].includes(p.action) && typeof p.source === 'string') &&
            (!state.challenge?.a11 || r?.id === state.challenge.a11);
          const missing = envelope && ['lg08challenge','lg08mastery','lg08print','lg03','lg01a','lg05folio','lg05layers','lg08estate'].some(k => flags.get(k) !== '1');
          resume = resume || missing; blocked = blocked || !envelope || missing;
        }
      }
      const m = object(state) && state.meta?.challengeMastery;
      if (state.challenge?.mastery && m === undefined) {mastery = true; blocked = true;}
      if (m !== undefined) {
        const known = object(m) && m.version === 1 && Number.isSafeInteger(m.sequence) && m.sequence >= 0;
        if (!known || m.active != null || m.pending != null) {
          mastery = true;
          const p = m?.pending, flags = new URLSearchParams(location.search);
          const envelope = known && object(m.active) && m.active.version === 1 && m.active.rule === 1 && m.active.origin === 'manual' &&
            [6,8,10].includes(m.active.target) && Array.isArray(m.active.required) && Array.isArray(m.active.sold) &&
            (p == null || object(p) && p.version === 1 && ['sale','abandon','qualify'].includes(p.action) && p.run === m.active.id && typeof p.source === 'string');
          const missing = envelope && ['lg08mastery','lg08print','lg03','lg01a','lg05folio','lg05layers','lg08estate'].some(k => flags.get(k) !== '1');
          resume = resume || missing; blocked = blocked || !envelope || missing;
        }
      }
      const endowment = object(state) && state.meta?.estate;
      if (object(endowment) && own(endowment,'pending') && endowment.pending !== null) {
        estate = true;
        const flags = new URLSearchParams(location.search), p = endowment.pending;
        // Envelope only. Estate validates the exact source, successor and wallet before recovery.
        const known = endowment.version === 1 && object(p) && p.version === 1 &&
          typeof p.id === 'string' && p.id.startsWith('estate:') && object(p.quote) &&
          object(p.candidate) && p.candidate.meta?.estate?.version === 1 && Array.isArray(p.crew) &&
          ['balance','seed','at'].every(k => Number.isSafeInteger(p[k]) && p[k] >= 0) && own(p,'sourceEstate') && own(p,'marker') && own(p,'reward');
        const needsFlags = known && ['lg08estate','lg01a','lg05folio','lg05layers'].some(flag => flags.get(flag) !== '1');
        resume = resume || needsFlags;
        blocked = blocked || !known || needsFlags;
      }
      const a = object(state) && state.meta?.archive;
      if (object(a) && own(a,'pending') && a.pending !== null) {
        archive = true;
        const p = a.pending, flags = new URLSearchParams(location.search);
        const known = a.version === 1 && object(p) && p.version === 1 && typeof p.id === 'string' && p.id.startsWith('archive:') &&
          Number.isSafeInteger(p.resetEpoch) && p.resetEpoch >= 0 && object(p.interval) && object(p.next) && p.next.version === 1 && own(p,'credit');
        const needsFlags = known && ['lg08archive','lg08estate','lg01a','lg05folio','lg05layers'].some(flag => flags.get(flag) !== '1');
        resume = resume || needsFlags; blocked = blocked || !known || needsFlags;
      }
      const cfg = object(state) && state.meta?.automation?.pitch;
      if (object(cfg) && own(cfg,'sale') && cfg.sale !== null) {
        pitch = true;
        const flags = new URLSearchParams(location.search), t = cfg.sale;
        const known = cfg.version === 1 && object(t) && t.version === 1 && typeof t.id === 'string' && t.id.startsWith('pitch-sale:') &&
          object(t.recipe) && typeof t.recipe.id === 'string' && object(cfg.manual) && object(cfg.manual.pending) &&
          ['printing','imprint','previous','sequence','balance','pay','earned'].every(k => Number.isSafeInteger(t[k]) && t[k] >= 0) &&
          t.pay > 0 && t.sequence === t.previous + 1 && object(t.bank) && object(t.need) && Array.isArray(t.stats) &&
          ['manual','publisher'].includes(t.origin);
        resume = known && ['lg03','lg01a','lg05folio','lg05layers'].some(flag => flags.get(flag) !== '1');
        blocked = blocked || !known || resume;
      }
      const mediaCfg = object(state) && state.meta?.automation?.media;
      if (mediaCfg !== undefined) {
        const cfgKnown = object(mediaCfg) && mediaCfg.version === 1 &&
          (mediaCfg.enabled === undefined || typeof mediaCfg.enabled === 'boolean') &&
          (mediaCfg.sequence === undefined || Number.isSafeInteger(mediaCfg.sequence) && mediaCfg.sequence >= 0) &&
          (mediaCfg.manual === undefined || object(mediaCfg.manual) && (mediaCfg.manual.complete === undefined || typeof mediaCfg.manual.complete === 'boolean'));
        const t = mediaCfg?.pending;
        if (!cfgKnown || t != null) {
          media = true;
          const flags = new URLSearchParams(location.search);
          const known = cfgKnown && object(t) && t.version === 1 && typeof t.id === 'string' && t.id.startsWith('media:') &&
            ['manual','auto'].includes(t.origin) && typeof t.division === 'string' && typeof t.config === 'string' && Array.isArray(t.catalogue) && object(t.wallet) &&
            ['printing','imprint','sequence','before','quantity','cost','balance','after'].every(k => Number.isSafeInteger(t[k]) && t[k] >= 0) &&
            t.sequence > 0 && t.quantity > 0 && t.cost > 0 && t.balance >= t.cost && t.after === t.balance - t.cost;
          const needsFlags = known && ['lg03','lg01a','lg05folio','lg05layers'].some(flag => flags.get(flag) !== '1');
          resume = resume || needsFlags;
          blocked = blocked || !known || needsFlags;
        }
      }
      if (object(state) && own(state, 'prem')) {
        if (!object(state.prem)) { blocked = true; resume = false; imprint = false; }
        else if (own(state.prem, 'vault')) {
          imprint = false;
          const flags = new URLSearchParams(location.search);
          lamp = !!window.VaultPlay?.supported(state);
          speed = state.prem.vault?.freeSpeed !== undefined;
          const admitted = lamp && VaultPlay.available() && VaultPlay.enabled() && (!speed || VaultPlay.speedEnabled() && VaultPlay.speedReady());
          blocked = blocked || !admitted;
          resume = lamp ? VaultPlay.available() && VaultPlay.isolated() && (!speed || VaultPlay.speedReady()) && ['lg01a','lg02','lg02lamp',...(speed ? ['lg02speed'] : [])].some(k => flags.get(k) !== '1') :
            object(state.prem.vault) && state.prem.vault.version === 1 && (flags.get('lg01a') !== '1' || flags.get('lg02') !== '1');
        }
      }
    }
  } catch { blocked = true; }
  if (blocked) {
    document.documentElement.dataset.vaultBlocked = '';
    const show = () => {
      for (const child of document.body.children) child.inert = true;
      const panel = document.createElement('main'); panel.className = 'o-vault-gate';
      panel.setAttribute('aria-labelledby', 'vaultGateTitle');
      const title = document.createElement('h1'); title.id = 'vaultGateTitle'; title.textContent = awards ? 'Awards recovery' : seasons ? 'Seasons recovery' : hall ? 'Hall recovery' : board ? 'Commission recovery' : challenge ? 'Auto-challenge recovery' : mastery ? 'Small Crew mastery recovery' : printing ? 'Printing recovery' : archive ? 'Archive income recovery' : estate ? 'Estate recovery' : media ? 'Media release recovery' : pitch ? 'Pitch sale recovery' : imprint ? 'Imprint recovery' : 'Vault test';
      const content = document.createElement('div'); content.className = 'o-vault-gate-content'; content.tabIndex = 0;
      content.setAttribute('role', 'region'); content.setAttribute('aria-label', 'Save status');
      const message = document.createElement('p');
      message.textContent = awards ? (resume ? funding ? 'Resume funding awards with lg02funding=1, lg10awards=1 and lg01a=1. Your saved awards and rewards stay preserved.' : 'Resume expanded awards with lg10awards=1 and lg01a=1. Your saved awards and rewards stay preserved.' : 'These expanded award records cannot be opened safely. Your saved data is preserved.') : seasons ? (resume ? 'Resume Seasons with lg09seasons=1 and lg01a=1. Exact saved progress and bonuses stay preserved.' : 'This Seasons record cannot be opened safely. Your saved data is preserved.') : hall ? (resume ? 'Resume Hall with lg09hall=1 and lg01a=1. Your exact saved observations and token stay preserved.' : 'This Hall record cannot be opened safely. Your saved data is preserved.') : board ? (resume ? 'Resume the Commission board to finish its exact saved command.' : 'This Commission record cannot be opened safely. Your saved data is preserved.') : challenge ? (resume ? 'Resume with the A11 recovery flags. Exact saved commands and payments wait for their owner.' : 'This Auto-challenge record cannot be opened safely. Saved data is preserved.') : mastery ? (resume ? 'Resume with the manual trial recovery flags. Saved progress and payments wait for their exact owner.' : 'This mastery record cannot be opened safely. Your saved data has not been changed.') : printing ? (resume ? 'This save has an unfinished Printing. Resume with its recovery flags to finish safely.' : 'This unfinished Printing cannot be opened safely. Your saved data has not been changed.') : archive ? (resume ? 'Resume Archive with its recovery flags to settle the saved income interval.' : 'This Archive income intent cannot be opened safely. Saved data is preserved.') : estate ? (resume ? 'This save has an unfinished Estate. Resume with its recovery flags to finish safely.' : 'This unfinished Estate cannot be opened safely. Your saved data has not been changed.') : media ? (resume ? 'This save has an unfinished media release. Resume with its recovery flags to finish safely.' : 'This media release cannot be opened safely. Your saved data has not been changed.') : pitch ? (resume ? 'This save has an unfinished pitch sale. Resume with its recovery flags to finish safely.' : 'This unfinished pitch sale cannot be opened safely. Your saved data has not been changed.') : imprint ? (resume ? 'This save has an unfinished Imprint. Resume with its recovery flags to finish safely.' :
        'This unfinished Imprint cannot be opened safely. Your saved data has not been changed.') : resume ? 'This save contains Vault items. Resume the Vault test to open it safely.' :
        'This save cannot be opened safely. Your saved data has not been changed.';
      const scope = document.createElement('p');
      scope.textContent = awards ? 'The award owner checks saved proofs and fixed reward receipts before production resumes.' : seasons ? 'Production waits for the saved Seasons command and payment. Retry keeps the fixed sample and never repeats an acknowledged bonus.' : hall ? 'Hall records local observations. Claim and stored or consumed reward sources are checked by their owner before production resumes.' : board ? 'Production waits for the saved command and payment. Retry keeps the original deadline and completion day.' : challenge ? 'Production waits for the saved one-run command. Retry never repeats an acknowledged payment or clear.' : mastery ? 'Production waits for the exact saved trial operation. Retry never repeats an acknowledged payment or qualification.' : printing ? 'Production waits until the exact saved Printing and seed-wallet replacement are settled.' : archive ? 'Production waits for the exact saved Archive income payment.' : estate ? 'Recovery stays on this local test origin. Other progression waits until the exact Estate and wallet replacement are settled.' : media ? 'Recovery stays on this local test origin. Other progression waits until the exact release and debit are settled.' : pitch ? 'Recovery stays on this local test origin. Other progression waits until the tracked sale is settled.' : imprint ? 'Recovery stays on this local test origin. Other progression waits until the Imprint is settled.' : 'Vault test: one game document on this isolated test origin. Shared saves and public purchases are not enabled.';
      content.append(message, scope);
      const action = document.createElement('button'); action.type = 'button'; action.textContent = resume ? 'Resume' : 'Retry';
      action.addEventListener('click', () => {
        if (!resume) { location.reload(); return; }
        const url = new URL(location.href);
        for (const flag of seasons ? ['lg09seasons','lg01a'] : hall ? ['lg09hall','lg01a'] : board ? ['lg09board','lg01a'] : challenge ? ['lg08challenge','lg08mastery','lg08print','lg03','lg01a','lg05folio','lg05layers','lg08estate'] : mastery ? ['lg08mastery','lg08print','lg03','lg01a','lg05folio','lg05layers','lg08estate'] : printing ? ['lg08print','lg03','lg01a','lg05folio','lg05layers','lg08estate'] : archive ? ['lg08archive','lg08estate','lg01a','lg05folio','lg05layers'] : estate ? ['lg08estate','lg01a','lg05folio','lg05layers'] : media || pitch ? ['lg03','lg01a','lg05folio','lg05layers'] : imprint ? ['lg01a', 'lg05folio', 'lg05layers'] : awards ? ['lg10awards','lg01a'] : ['lg01a', 'lg02']) url.searchParams.set(flag, '1');
        if (lamp) url.searchParams.set('lg02lamp','1');
        if (speed) url.searchParams.set('lg02speed','1');
        if (funding) url.searchParams.set('lg02funding','1');
        if (awards) {url.searchParams.set('lg10awards','1');url.searchParams.set('lg01a','1');}
        location.replace(url.href);
      });
      panel.append(title, content, action); document.body.appendChild(panel); action.focus();
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', show, { once:true }); else show();
  }
  return Object.freeze({ blocked });
})();
